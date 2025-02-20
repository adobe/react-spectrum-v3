/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {CollectionBase, CollectionElement, Key, Node} from '@react-types/shared';
import {PartialNode} from './types';
import React, {ReactElement} from 'react';

interface CollectionBuilderState {
  renderer?: (value: any) => ReactElement | null
}

interface CollectReactElement<T> extends ReactElement {
  getCollectionNode(props: any, context: any): Generator<PartialNode<T>, void, Node<T>[]>
}

export class CollectionBuilder<T extends object> {
  private context?: unknown;
  private cache: WeakMap<T, Node<T>> = new WeakMap();

  build(props: Partial<CollectionBase<T>>, context?: unknown): Iterable<Node<T>> {
    this.context = context;
    return iterable(() => this.iterateCollection(props));
  }

  private *iterateCollection(props: Partial<CollectionBase<T>>): Generator<Node<T>> {
    let {children, items} = props;

    if (React.isValidElement<{children: CollectionElement<T>}>(children) && children.type === React.Fragment) {
      yield* this.iterateCollection({
        children: children.props.children,
        items
      });
    } else if (typeof children === 'function') {
      if (!items) {
        throw new Error('props.children was a function but props.items is missing');
      }

      let index = 0;
      for (let item of items) {
        yield* this.getFullNode({
          value: item,
          index
        }, {renderer: children});
        index++;
      }
    } else {
      let items: CollectionElement<T>[] = [];
      React.Children.forEach(children, child => {
        if (child) {
          items.push(child);
        }
      });

      let index = 0;
      for (let item of items) {
        let nodes = this.getFullNode({
          element: item,
          index: index
        }, {});

        for (let node of nodes) {
          index++;
          yield node;
        }
      }
    }
  }

  private getKey(item: NonNullable<CollectionElement<T>>, partialNode: PartialNode<T>, state: CollectionBuilderState, parentKey?: Key | null): Key {
    if (item.key != null) {
      return item.key;
    }

    if (partialNode.type === 'cell' && partialNode.key != null) {
      return `${parentKey}${partialNode.key}`;
    }

    let v = partialNode.value as any;
    if (v != null) {
      let key = v.key ?? v.id;
      if (key == null) {
        throw new Error('No key found for item');
      }

      return key;
    }

    return parentKey ? `${parentKey}.${partialNode.index}` : `$.${partialNode.index}`;
  }

  private getChildState(state: CollectionBuilderState, partialNode: PartialNode<T>) {
    return {
      renderer: partialNode.renderer || state.renderer
    };
  }

  private *getFullNode(partialNode: PartialNode<T> & {index: number}, state: CollectionBuilderState, parentKey?: Key | null, parentNode?: Node<T>): Generator<Node<T>> {
    if (React.isValidElement<{children: CollectionElement<T>}>(partialNode.element) && partialNode.element.type === React.Fragment) {
      let children: CollectionElement<T>[] = [];

      React.Children.forEach(partialNode.element.props.children, child => {
        children.push(child);
      });

      let index = partialNode.index ?? 0;

      for (const child of children) {
        yield* this.getFullNode({
          element: child,
          index: index++
        }, state, parentKey, parentNode);
      }

      return;
    }

    // If there's a value instead of an element on the node, and a parent renderer function is available,
    // use it to render an element for the value.
    let element = partialNode.element;
    if (!element && partialNode.value && state && state.renderer) {
      let cached = this.cache.get(partialNode.value);
      if (cached && (!cached.shouldInvalidate || !cached.shouldInvalidate(this.context))) {
        cached.index = partialNode.index;
        cached.parentKey = parentNode ? parentNode.key : null;
        yield cached;
        return;
      }

      element = state.renderer(partialNode.value);
    }

    // If there's an element with a getCollectionNode function on its type, then it's a supported component.
    // Call this function to get a partial node, and recursively build a full node from there.
    if (React.isValidElement(element)) {
      let type = element.type as unknown as CollectReactElement<T>;
      if (typeof type !== 'function' && typeof type.getCollectionNode !== 'function') {
        let name = element.type;
        throw new Error(`Unknown element <${name}> in collection.`);
      }

      let childNodes = type.getCollectionNode(element.props, this.context) as Generator<PartialNode<T>, void, Node<T>[]>;
      let index = partialNode.index ?? 0;
      let result = childNodes.next();
      while (!result.done && result.value) {
        let childNode = result.value;

        partialNode.index = index;

        let nodeKey = childNode.key ?? null;
        if (nodeKey == null) {
          nodeKey = childNode.element ? null : this.getKey(element as NonNullable<CollectionElement<T>>, partialNode, state, parentKey);
        }

        let nodes = this.getFullNode({
          ...childNode,
          key: nodeKey,
          index,
          wrapper: compose(partialNode.wrapper, childNode.wrapper)
        }, this.getChildState(state, childNode), parentKey ? `${parentKey}${element.key}` : element.key, parentNode);

        let children = [...nodes];
        for (let node of children) {
          // Cache the node based on its value
          node.value = childNode.value ?? partialNode.value ?? null;
          if (node.value) {
            this.cache.set(node.value, node);
          }

          // The partial node may have specified a type for the child in order to specify a constraint.
          // Verify that the full node that was built recursively matches this type.
          if (partialNode.type && node.type !== partialNode.type) {
            throw new Error(`Unsupported type <${capitalize(node.type)}> in <${capitalize(parentNode?.type ?? 'unknown parent type')}>. Only <${capitalize(partialNode.type)}> is supported.`);
          }

          index++;
          yield node;
        }

        result = childNodes.next(children);
      }

      return;
    }

    // Ignore invalid elements
    if (partialNode.key == null || partialNode.type == null) {
      return;
    }

    // Create full node
    let builder = this;
    let node: Node<T> = {
      type: partialNode.type,
      props: partialNode.props,
      key: partialNode.key,
      parentKey: parentNode ? parentNode.key : null,
      value: partialNode.value ?? null,
      level: parentNode ? parentNode.level + 1 : 0,
      index: partialNode.index,
      rendered: partialNode.rendered,
      textValue: partialNode.textValue ?? '',
      'aria-label': partialNode['aria-label'],
      wrapper: partialNode.wrapper,
      shouldInvalidate: partialNode.shouldInvalidate,
      hasChildNodes: partialNode.hasChildNodes || false,
      childNodes: iterable(function *() {
        if (!partialNode.hasChildNodes || !partialNode.childNodes) {
          return;
        }

        let index = 0;
        for (let child of partialNode.childNodes()) {
          // Ensure child keys are globally unique by prepending the parent node's key
          if (child.key != null) {
            // TODO: Remove this line entirely and enforce that users always provide unique keys.
            // Currently this line will have issues when a parent has a key `a` and a child with key `bc`
            // but another parent has key `ab` and its child has a key `c`. The combined keys would result in both
            // children having a key of `abc`.
            child.key = `${node.key}${child.key}`;
          }

          let nodes = builder.getFullNode({...child, index}, builder.getChildState(state, child), node.key, node);
          for (let node of nodes) {
            index++;
            yield node;
          }
        }
      })
    };

    yield node;
  }
}

// Wraps an iterator function as an iterable object, and caches the results.
function iterable<T>(iterator: () => IterableIterator<Node<T>>): Iterable<Node<T>> {
  let cache: Array<Node<T>> = [];
  let iterable: null | IterableIterator<Node<T>> = null;
  return {
    *[Symbol.iterator]() {
      for (let item of cache) {
        yield item;
      }

      if (!iterable) {
        iterable = iterator();
      }

      for (let item of iterable) {
        cache.push(item);
        yield item;
      }
    }
  };
}

type Wrapper = (element: ReactElement) => ReactElement;
function compose(outer: Wrapper | void, inner: Wrapper | void): Wrapper | undefined {
  if (outer && inner) {
    return (element) => outer(inner(element));
  }

  if (outer) {
    return outer;
  }

  if (inner) {
    return inner;
  }
}

function capitalize(str: string) {
  return str[0].toUpperCase() + str.slice(1);
}
