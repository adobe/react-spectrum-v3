/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Collection as ICollection, Key, Node} from '@react-types/shared';
import {ReactElement, ReactNode} from 'react';

export type Mutable<T> = {
  -readonly[P in keyof T]: T[P]
}

/** An immutable object representing a Node in a Collection. */
export class CollectionNode<T> implements Node<T> {
  readonly type: string;
  readonly key: Key;
  readonly value: T | null = null;
  readonly level: number = 0;
  readonly hasChildNodes: boolean = false;
  readonly rendered: ReactNode = null;
  readonly textValue: string = '';
  readonly 'aria-label'?: string = undefined;
  readonly index: number = 0;
  readonly parentKey: Key | null = null;
  readonly prevKey: Key | null = null;
  readonly nextKey: Key | null = null;
  readonly firstChildKey: Key | null = null;
  readonly lastChildKey: Key | null = null;
  readonly props: any = {};
  readonly render?: (node: Node<any>) => ReactElement;

  constructor(type: string, key: Key) {
    this.type = type;
    this.key = key;
  }

  get childNodes(): Iterable<Node<T>> {
    throw new Error('childNodes is not supported');
  }

  clone(): CollectionNode<T> {
    let node: Mutable<CollectionNode<T>> = new CollectionNode(this.type, this.key);
    node.value = this.value;
    node.level = this.level;
    node.hasChildNodes = this.hasChildNodes;
    node.rendered = this.rendered;
    node.textValue = this.textValue;
    node['aria-label'] = this['aria-label'];
    node.index = this.index;
    node.parentKey = this.parentKey;
    node.prevKey = this.prevKey;
    node.nextKey = this.nextKey;
    node.firstChildKey = this.firstChildKey;
    node.lastChildKey = this.lastChildKey;
    node.props = this.props;
    node.render = this.render;
    return node;
  }
}

/**
 * An immutable Collection implementation. Updates are only allowed
 * when it is not marked as frozen. This can be subclassed to implement
 * custom collection behaviors.
 */
export class BaseCollection<T> implements ICollection<Node<T>> {
  private keyMap: Map<Key, CollectionNode<T>> = new Map();
  private firstKey: Key | null = null;
  private lastKey: Key | null = null;
  private frozen = false;

  get size() {
    return this.keyMap.size;
  }

  getKeys() {
    return this.keyMap.keys();
  }

  *[Symbol.iterator]() {
    let node: Node<T> | undefined = this.firstKey != null ? this.keyMap.get(this.firstKey) : undefined;
    while (node) {
      yield node;
      node = node.nextKey != null ? this.keyMap.get(node.nextKey) : undefined;
    }
  }

  getChildren(key: Key): Iterable<Node<T>> {
    let keyMap = this.keyMap;
    return {
      *[Symbol.iterator]() {
        let parent = keyMap.get(key);
        let node = parent?.firstChildKey != null ? keyMap.get(parent.firstChildKey) : null;
        while (node) {
          yield node as Node<T>;
          node = node.nextKey != null ? keyMap.get(node.nextKey) : undefined;
        }
      }
    };
  }

  getKeyBefore(key: Key) {
    let node = this.keyMap.get(key);
    if (!node) {
      return null;
    }

    if (node.prevKey != null) {
      node = this.keyMap.get(node.prevKey);

      while (node && node.type !== 'item' && node.lastChildKey != null) {
        node = this.keyMap.get(node.lastChildKey);
      }

      return node?.key ?? null;
    }

    return node.parentKey;
  }

  getKeyAfter(key: Key) {
    let node = this.keyMap.get(key);
    if (!node) {
      return null;
    }

    if (node.type !== 'item' && node.firstChildKey != null) {
      return node.firstChildKey;
    }

    while (node) {
      if (node.nextKey != null) {
        return node.nextKey;
      }

      if (node.parentKey != null) {
        node = this.keyMap.get(node.parentKey);
      } else {
        return null;
      }
    }

    return null;
  }

  getFirstKey() {
    return this.firstKey;
  }

  getLastKey() {
    let node = this.lastKey != null ? this.keyMap.get(this.lastKey) : null;
    while (node?.lastChildKey != null) {
      node = this.keyMap.get(node.lastChildKey);
    }

    return node?.key ?? null;
  }

  getItem(key: Key): Node<T> | null {
    return this.keyMap.get(key) ?? null;
  }

  at(): Node<T> {
    throw new Error('Not implemented');
  }

  clone(): this {
    // We need to clone using this.constructor so that subclasses have the right prototype.
    // TypeScript isn't happy about this yet.
    // https://github.com/microsoft/TypeScript/issues/3841
    let Constructor: any = this.constructor;
    let collection: this = new Constructor();
    collection.keyMap = new Map(this.keyMap);
    collection.firstKey = this.firstKey;
    collection.lastKey = this.lastKey;
    return collection;
  }

  addNode(node: CollectionNode<T>) {
    if (this.frozen) {
      throw new Error('Cannot add a node to a frozen collection');
    }

    this.keyMap.set(node.key, node);
  }

  removeNode(key: Key) {
    if (this.frozen) {
      throw new Error('Cannot remove a node to a frozen collection');
    }

    this.keyMap.delete(key);
  }

  commit(firstKey: Key | null, lastKey: Key | null, isSSR = false) {
    if (this.frozen) {
      throw new Error('Cannot commit a frozen collection');
    }

    this.firstKey = firstKey;
    this.lastKey = lastKey;
    this.frozen = !isSSR;
  }

  // TODO: this is pretty specific to menu, will need to check if it is generic enough
  // Will need to handle varying levels I assume but will revisit after I get searchable menu working for base menu
  // TODO: an alternative is to simply walk the collection and add all item nodes that match the filter and any sections/separators we encounter
  // to an array, then walk that new array and fix all the next/Prev keys while adding them to the new collection
  filter(filterFn: (nodeValue: string) => boolean): BaseCollection<T> {
    let newCollection = new BaseCollection<T>();
    // This tracks the absolute last node we've visited in the collection when filtering, used for setting up the filteredCollection's lastKey and
    // for updating the next/prevKey for every non-filtered node.
    let lastNode: Mutable<CollectionNode<T>> | null = null;

    for (let node of this) {
      if (node.type === 'section' && node.hasChildNodes) {
        let clonedSection: Mutable<CollectionNode<T>> = (node as CollectionNode<T>).clone();
        let lastChildInSection: Mutable<CollectionNode<T>> | null = null;
        for (let child of this.getChildren(node.key)) {
          if (shouldKeepNode(child, filterFn, this, newCollection)) {
            let clonedChild: Mutable<CollectionNode<T>> = (child as CollectionNode<T>).clone();
            // eslint-disable-next-line max-depth
            if (lastChildInSection == null) {
              clonedSection.firstChildKey = clonedChild.key;
            }

            // eslint-disable-next-line max-depth
            if (newCollection.firstKey == null) {
              newCollection.firstKey = clonedSection.key;
            }

            // eslint-disable-next-line max-depth
            if (lastChildInSection && lastChildInSection.parentKey === clonedChild.parentKey) {
              lastChildInSection.nextKey = clonedChild.key;
              clonedChild.prevKey = lastChildInSection.key;
            } else {
              clonedChild.prevKey = null;
            }

            clonedChild.nextKey = null;
            newCollection.addNode(clonedChild);
            lastChildInSection = clonedChild;
          }
        }

        // Add newly filtered section to collection if it has any valid child nodes, otherwise remove it and its header if any
        if (lastChildInSection) {
          if (lastChildInSection.type !== 'header') {
            clonedSection.lastChildKey = lastChildInSection.key;

            // If the old prev section was filtered out, will need to attach to whatever came before
            // eslint-disable-next-line max-depth
            if (lastNode == null) {
              clonedSection.prevKey = null;
            } else if (lastNode.type === 'section' || lastNode.type === 'separator') {
              lastNode.nextKey = clonedSection.key;
              clonedSection.prevKey = lastNode.key;
            }
            clonedSection.nextKey = null;
            lastNode = clonedSection;
            newCollection.addNode(clonedSection);
          } else {
            if (newCollection.firstKey === clonedSection.key) {
              newCollection.firstKey = null;
            }
            newCollection.removeNode(lastChildInSection.key);
          }
        }
      } else if (node.type === 'separator') {
        // will need to check if previous section key exists, if it does then we add the separator to the collection.
        // After the full collection is created we'll need to remove it it is the last node in the section (aka no following section after the separator)
        let clonedSeparator: Mutable<CollectionNode<T>> = (node as CollectionNode<T>).clone();
        clonedSeparator.nextKey = null;
        if (lastNode?.type === 'section') {
          lastNode.nextKey = clonedSeparator.key;
          clonedSeparator.prevKey = lastNode.key;
          lastNode = clonedSeparator;
          newCollection.addNode(clonedSeparator);
        }
      } else {
        // At this point, the node is either a subdialogtrigger node or a standard row/item
        let clonedNode: Mutable<CollectionNode<T>> = (node as CollectionNode<T>).clone();
        if (shouldKeepNode(clonedNode, filterFn, this, newCollection)) {
          if (newCollection.firstKey == null) {
            newCollection.firstKey = clonedNode.key;
          }

          if (lastNode != null && (lastNode.type !== 'section' && lastNode.type !== 'separator') && lastNode.parentKey === clonedNode.parentKey) {
            lastNode.nextKey = clonedNode.key;
            clonedNode.prevKey = lastNode.key;
          } else {
            clonedNode.prevKey = null;
          }

          clonedNode.nextKey = null;
          newCollection.addNode(clonedNode);
          lastNode = clonedNode;
        }
      }
    }

    if (lastNode?.type === 'separator' && lastNode.nextKey === null) {
      let lastSection;
      if (lastNode.prevKey != null) {
        lastSection = newCollection.getItem(lastNode.prevKey) as Mutable<CollectionNode<T>>;
        lastSection.nextKey = null;
      }
      newCollection.removeNode(lastNode.key);
      lastNode = lastSection;
    }

    newCollection.lastKey = lastNode?.key || null;

    return newCollection;
  }
}

function shouldKeepNode<T>(node: Node<T>, filterFn: (nodeValue: string) => boolean, oldCollection: BaseCollection<T>, newCollection: BaseCollection<T>): boolean {
  if (node.type === 'subdialogtrigger' || node.type === 'submenutrigger') {
    // Subdialog wrapper should only have one child, if it passes the filter add it to the new collection since we don't need to
    // do any extra handling for its first/next key
    let triggerChild = [...oldCollection.getChildren(node.key)][0];
    if (triggerChild && filterFn(triggerChild.textValue)) {
      let clonedChild: Mutable<CollectionNode<T>> = (triggerChild as CollectionNode<T>).clone();
      newCollection.addNode(clonedChild);
      return true;
    } else {
      return false;
    }
  } else if (node.type === 'header') {
    return true;
  } else {
    return filterFn(node.textValue);
  }
}
