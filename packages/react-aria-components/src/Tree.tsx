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

import {AriaGridListProps, FocusScope,  mergeProps, useFocusRing, useGridList, useGridListItem, useHover} from 'react-aria';
import {BaseCollection, Collection, CollectionProps, CollectionRendererContext, ItemRenderProps, NodeValue, useCachedChildren, useCollection, useCollectionChildren, useSSRCollectionNode} from './Collection';
import {Collection as ICollection, ListState, Node, SelectionBehavior, useListState, useTreeState} from 'react-stately';
import {ContextValue, forwardRefType, Provider, RenderProps, ScrollableProps, SlotProps, StyleRenderProps, useContextProps, useRenderProps} from './utils';
import {filterDOMProps, useObjectRef} from '@react-aria/utils';
import {Expandable, Key, LinkDOMProps} from '@react-types/shared';
import {ListStateContext} from './ListBox';
import React, {createContext, ForwardedRef, forwardRef, HTMLAttributes, JSX, ReactNode, RefObject, useContext, useEffect, useMemo} from 'react';
import {TextContext} from './Text';
import { GridNode } from '@react-types/grid';
import { useControlledState } from '@react-stately/utils';

// TODO: Figure out what we want in this. It should be like useTreeGridState perhaps where we
// generate a flattened collection which is all the expanded/visible tree rows. The nodes themselves should have
// the proper parent - child information along with what level and position in set it is. When a row is expanded the collection should update
// and return the new version of the flattened collection. I guess the fake DOM would reflect the fully expanded tree state so that we get the
// proper information per node.
// TODO: do we need columns? Just setup a single column automatically? What about cells?
// Maybe fake the collection for now. See what GridList and Table's collections look like right now

// TODO: two approaches perhaps that we can do.
// 1. Make TreeCOllection's get size, getKeyBefore, etc all filter out non-expanded keys when they get called and return the particular values that we'd
// expect as if the TreeCollection only had the expanded rows and their children's information. This means the TreeCollection itself would only rebuild if there
// were changes to the items provided to the Tree itself, not when things are expanded/collapsed.

// 2. Have TreeCollection create a key map that only contains the expanded keys and their children. Also modify the node information in such a way that it reflects only the
// flattened row structure

// 3. Something like TreeGridState which has a collection that reflects the flattened state, and then a keymap that has the non-flattened state. Kinda like 1 and 2 combined?
class TreeCollection<T> implements ICollection<Node<T>> {
  // TODO: should I also expose the original rows and keymap from the original collection?
  private flattenedRows: NodeValue<T>[];
  private keyMap: Map<Key, NodeValue<T>> = new Map();
  // TODO: Add keymap from original collection and use that for get

  constructor(opts) {
    let {collection, expandedKeys} = opts;
    // TODO: we don't actually need the keymap from generatateTreeGridCollection technically since index is equivalent to
    // indexOfType. However the level calculated will need to be bumped up by one so keep it?
    // Also maybe use it for this.getItem?
    let {flattenedRows, keyMap} = generateTreeGridCollection<T>(collection, {expandedKeys});
    this.flattenedRows = flattenedRows;
    // TODO: replace with the flattened key map or the original one? Maybe have the state provide the original keymap?
    this.keyMap = keyMap;
  }

  *[Symbol.iterator]() {
    yield* this.flattenedRows;
  }

  get size() {
    return this.flattenedRows.length;
  }

  getKeys() {
    return this.keyMap.keys();
  }

  getItem(key: Key) {
    return this.keyMap.get(key);
  }

  at(idx: number) {
    return this.flattenedRows[idx];
  }

  getFirstKey() {
    return this.flattenedRows[0]?.key;
  }

  getLastKey() {
    return this.flattenedRows[this.size - 1]?.key;
  }

  getKeyAfter(key: Key) {
    let index = this.flattenedRows.findIndex(row => row.key === key);
    return this.flattenedRows[index + 1]?.key;
  }

  getKeyBefore(key: Key) {
    let index = this.flattenedRows.findIndex(row => row.key === key);
    return this.flattenedRows[index - 1]?.key;
  }

  // TODO: If we use the keyMap and the keymap has the extra "content" nodes, its going to be all out of wack
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

  getTextValue(key: Key): string {
    let item = this.getItem(key);
    return item ? item.textValue : '';
  }
}

// TODO: all of below is just from GridList as scaffolding and renamed to Tree

export interface TreeRenderProps {
}

// TODO: double check these props, get rid of AriaGridListProps later
export interface TreeProps<T> extends Omit<AriaGridListProps<T>, 'children'>, CollectionProps<T>, StyleRenderProps<TreeRenderProps>, SlotProps, ScrollableProps<HTMLDivElement>, Expandable {
  /** How multiple selection should behave in the collection. */
  selectionBehavior?: SelectionBehavior,
  /** Provides content to display when there are no items in the list. */
  renderEmptyState?: (props: TreeRenderProps) => ReactNode
}


export const TreeContext = createContext<ContextValue<TreeProps<any>, HTMLDivElement>>(null);

function Tree<T extends object>(props: TreeProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  // Render the portal first so that we have the collection by the time we render the DOM in SSR.
  [props, ref] = useContextProps(props, ref, TreeContext);
  let {collection, portal} = useCollection(props);
  let renderer = typeof props.children === 'function' ? props.children : null;
  return (
    <>
      <CollectionRendererContext.Provider value={renderer}>
        {portal}
      </CollectionRendererContext.Provider>
      <TreeInner props={props} collection={collection} treeRef={ref} />
    </>
  );
}

interface TreeInnerProps<T extends object> {
  props: TreeProps<T>,
  collection: ICollection<Node<T>>,
  treeRef: RefObject<HTMLDivElement>
}

function TreeInner<T extends object>({props, collection, treeRef: ref}: TreeInnerProps<T>) {
  console.log('collection', collection)
  // TODO: perhaps perform post processing of the collection here? Would we call useTreeState and pass the collection to it, then
  // process the collection with the expandedKeys? Or perhaps make a new hook?


  let {
    selectionMode = 'none',
    expandedKeys: propExpandedKeys,
    defaultExpandedKeys: propDefaultExpandedKeys,
    onExpandedChange
  } = props;


  let [expandedKeys, setExpandedKeys] = useControlledState(
    propExpandedKeys ? convertExpanded(propExpandedKeys) : undefined,
    propDefaultExpandedKeys ? convertExpanded(propDefaultExpandedKeys) : new Set(),
    onExpandedChange
  );

  // let treeGridCollection = useMemo(() => {
  //   return generateTreeGridCollection<T>(collection, {expandedKeys});
  // }, [collection, expandedKeys]);

  let flattenedCollection = useMemo(() => {
    // TODO: types
    return new TreeCollection<object>({collection, expandedKeys});
  }, [collection, expandedKeys]);

  // TODO: we get the flatten rows in the proper order but the nodes aren't modified to have a new set of keys pointing to the proper "next key" that would reflect the flattened state
  // Couple of approaches that I can think of
  // 1. Change this generateTreeGrid function so that it returns a new TreeCollection that has the keymap from the original base structure but uses
  // the flattened table rows when performing `getKeyBefore`, `getKeyAfter` etc, aka it would do index based look ups instead of needing to look at the keyMap.
  // Perhaps I could call generateTreeGridCollection in constructor of the TreeCollection class
  // console.log('treeGridCollection', flattenedCollection, collection)


  // TODO: use useTreeState or update useGridState to handle expandable rows?
  // We don't have cell nodes in the collection as is so if we want to use useGridState we'll need to add those perhaps since a lot of the state and row code may expect cell keys
  // At the moment the flattened nodes have other rows as their children which isn't what some of the useGridState code expects
  // RSP TableView got around this by just modifying the flattened row nodes so they had cells as their childNodes and got rid of the child rows
  let state = useTreeState({
    ...props,
    collection: flattenedCollection,
    children: undefined
  });

  // TODO: replace with useGrid, will need to update useGrid to have treegrid specific things
  let {gridProps} = useGridList(props, state, ref);

  let children = useCachedChildren({
    // TODO: this would the flatted rows from the collection
    // items: collection,
    items: state.collection,
    children: (item: Node<T>) => {
      switch (item.type) {
        case 'item':
          return <TreeRow item={item} />;
        default:
          throw new Error('Unsupported node type in Tree: ' + item.type);
      }
    }
  });

  let {focusProps, isFocused, isFocusVisible} = useFocusRing();
  let renderValues = {
    isEmpty: state.collection.size === 0,
    isFocused,
    isFocusVisible,
    state
  };

  // TODO: double check what other render props should exist
  let renderProps = useRenderProps({
    className: props.className,
    style: props.style,
    defaultClassName: 'react-aria-Tree',
    values: renderValues
  });


  // TODO: empty state for a empty tree?
  let emptyState: ReactNode = null;
  let emptyStatePropOverrides: HTMLAttributes<HTMLElement> | null = null;
  if (state.collection.size === 0 && props.renderEmptyState) {
    let content = props.renderEmptyState(renderValues);
    emptyState = (
      <div role="row" style={{display: 'contents'}}>
        <div role="gridcell" style={{display: 'contents'}}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <FocusScope>
      <div
        {...filterDOMProps(props)}
        {...renderProps}
        {...mergeProps(gridProps, focusProps, emptyStatePropOverrides)}
        ref={ref}
        slot={props.slot || undefined}
        onScroll={props.onScroll}
        data-empty={state.collection.size === 0 || undefined}
        data-focused={isFocused || undefined}
        data-focus-visible={isFocusVisible || undefined}>
        <Provider
          values={[
            [ListStateContext, state]
          ]}>
          {children}
        </Provider>
        {emptyState}
      </div>
    </FocusScope>
  );
}

/**
 * A tree provides users with a way to navigate nested hierarchical information, with support for keyboard navigation
 * and selection.
 */
const _Tree = /*#__PURE__*/ (forwardRef as forwardRefType)(Tree);
export {_Tree as Tree};

export interface TreeItemRenderProps extends ItemRenderProps {
  // Whether the Tree row is expanded.
  isExpanded: boolean
}

// TODO: will it need to support LinkProps?
export interface TreeItemProps<T = object> extends RenderProps<TreeItemRenderProps> {
  /** The unique id of the item. */
  id?: Key,
  /** The object value that this item represents. When using dynamic collections, this is set automatically. */
  value?: T,
  /** A string representation of the item's contents, used for features like typeahead. */
  textValue?: string,
  /** An accessibility label for this item. */
  'aria-label'?: string,
  // TODO: support child item, will need to figure out how to render that in the fake dom
  childItems?: Iterable<T>
}

// TODO TreeItem here would need to know how to render nested TreeItems based off of its children (aka static) or for the dynamic case (check childItems existance and reuse the render func provided to Tree)
function TreeItem<T extends object>(props: TreeItemProps<T>, ref: ForwardedRef<HTMLDivElement>): JSX.Element | null {
  let {childItems} = props;
  let render = useContext(CollectionRendererContext);

  // let nestedChildren;
  // if (childItems) {
  //   // TODO: the assumption here is that either the Tree was passed a render function aka dynamic case
  //   nestedChildren = (
  //     <Collection items={childItems}>
  //       {render}
  //     </Collection>
  //   );
  // }

  // return useSSRCollectionNode('item', props, ref, children, nestedChildren);


  // TODO: do we need to support a title prop to distinguish static from dynamic?
  let childRows: ReactNode | ((item: T) => ReactNode);
  let renderedChildren: ReactNode;
  if (typeof render === 'function') {
    // console.log('render', props.children, React.Children.count(props.children) > 1, React.Children.count(props.children), props.children.length);
    // if (React.Children.count(props.children) > 1) {

    // } else {
      // renderedChildren = props.children;
    // }

    childRows = render;
    renderedChildren = props.children[0];
  } else if (typeof props.children !== 'function') {
    if (React.Children.count(props.children) > 1) {
      childRows = props.children[1];
      renderedChildren = props.children[0];
    } else {
      renderedChildren = props.children;
    }
  }

  let children = useCollectionChildren({
    // children: childItems ? childRows : null,
    children: childRows,
    items: childItems
  });
  console.log('children, childRows, props.children, props.title', children, childRows, props.children[0], props.title)

  // TODO: right now I have null as rendered because the user provides <Content> which is the rendered content
  // This means however that renderProps doesn't work...
  return useSSRCollectionNode('item', props, ref, renderedChildren, children);
}

/**
 * A TreeItem represents an individual item in a Tree.
 */
const _TreeItem = /*#__PURE__*/ (forwardRef as forwardRefType)(TreeItem);
export {_TreeItem as TreeItem};

// TODO: I think TreeRow wouldn't need any useCachedChildren or anything since it should theoretically used the flattened structure
// Probably would just render the children? Will need to see what item has in its .rendered
// Also I guess we need to useGridRow and useGridCell, so that means we need cells
function TreeRow({item}) {
  let state = useContext(ListStateContext)!;
  let ref = useObjectRef<HTMLDivElement>(item.props.ref);
  // TODO replace with useGridRow perhaps. Wonder if I could use something like useGridListItem instead since it is technically a
  // single column single cell setup. Double check what differences between useGridListItem and useGridRow/useGridCell exist
  // since that might affect it (I think there used to be some weirdness with single column useGridRow).
  // Also depending on the item's information with index/level, we may need to add +1 to various attributes
  let {rowProps, gridCellProps, descriptionProps, ...states} = useGridListItem(
    {
      node: item
    },
    state,
    ref
  );

  let {hoverProps, isHovered} = useHover({
    isDisabled: !states.allowsSelection && !states.hasAction
  });

  let {isFocusVisible, focusProps} = useFocusRing();
  // console.log('item', item);
  let props: TreeItemProps<unknown> = item.props;
  let renderProps = useRenderProps({
    ...props,
    id: undefined,
    children: item.rendered,
    defaultClassName: 'react-aria-TreeItem',
    values: {
      ...states,
      isHovered,
      isFocusVisible,
      // TODO: grab expanded rows from tree state
      // isExpanded: true,
      isExpanded: item.hasChildNodes ? state.expandedKeys === 'all' || state.expandedKeys.has(item.key) : undefined,
      selectionMode: state.selectionManager.selectionMode,
      selectionBehavior: state.selectionManager.selectionBehavior
    }
  });


  useEffect(() => {
    if (!item.textValue) {
      console.warn('A `textValue` prop is required for <TreeItem> elements with non-plain text children in order to support accessibility features such as type to select.');
    }
  }, [item.textValue]);


  // TODO: don't need the below unless we want to track 'content' in the
  // console.log('state.collection ', state.collection)
  // let children = useCachedChildren({
  //   items: state.collection.getChildren!(item.key),
  //   children: item => {
  //     switch (item.type) {
  //       case 'content': {
  //         return <>{item.rendered}</>;
  //       }
  //       // skip item since we don't render the nested rows as children of the parent row
  //       case 'item':
  //         return <></>;
  //       default:
  //         throw new Error('Unsupported element type in TreeRow: ' + item.type);
  //     }
  //   }
  // });

  // console.log('children in ROW', children)


  return (
    <>
      <div
        {...mergeProps(filterDOMProps(props as any), rowProps, focusProps, hoverProps)}
        {...renderProps}
        ref={ref}
        data-selected={states.isSelected || undefined}
        data-disabled={states.isDisabled || undefined}
        data-hovered={isHovered || undefined}
        data-focused={states.isFocused || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-pressed={states.isPressed || undefined}
        data-selection-mode={state.selectionManager.selectionMode === 'none' ? undefined : state.selectionManager.selectionMode}>
        <div {...gridCellProps} style={{display: 'contents'}}>
          <Provider
            values={[
              [TextContext, {
                //  TODO: update
                slots: {
                  title: {}
                }
              }]
            ]}>
            {renderProps.children}
            {/* {children} */}
          </Provider>
        </div>
      </div>
    </>
  );
}







// TODO: Code from useTreeGridState
function toggleKey<T>(currentExpandedKeys: 'all' | Set<Key>, key: Key, collection: TreeGridCollection<T>): Set<Key> {
  let updatedExpandedKeys: Set<Key>;
  if (currentExpandedKeys === 'all') {
    updatedExpandedKeys = new Set(collection.flattenedRows.filter(row => row.props.childItems || row.props.children.length > collection.userColumnCount).map(row => row.key));
    updatedExpandedKeys.delete(key);
  } else {
    updatedExpandedKeys = new Set(currentExpandedKeys);
    if (updatedExpandedKeys.has(key)) {
      updatedExpandedKeys.delete(key);
    } else {
      updatedExpandedKeys.add(key);
    }
  }

  return updatedExpandedKeys;
}

function convertExpanded(expanded: 'all' | Iterable<Key>): 'all' | Set<Key> {
  if (!expanded) {
    return new Set<Key>();
  }

  return expanded === 'all'
    ? 'all'
    : new Set(expanded);
}

interface TreeGridCollectionOptions {
  showSelectionCheckboxes?: boolean,
  showDragButtons?: boolean,
  expandedKeys: 'all' | Set<Key>
}

// TODO: These should perhaps be NodeValue instead of gridNode?
interface TreeGridCollection<T> {
  keyMap: Map<Key, NodeValue<T>>,
  // tableNodes: GridNode<T>[],
  flattenedRows: NodeValue<T>[],
  userColumnCount: number
}
function generateTreeGridCollection<T>(nodes, opts: TreeGridCollectionOptions): TreeGridCollection<T> {
  let {
    expandedKeys = new Set()
  } = opts;

  // let body: GridNode<T>;
  let flattenedRows = [];
  // TODO: get rid of column count
  let columnCount = 0;
  let userColumnCount = 0;
  let originalColumns = [];
  let keyMap = new Map();

  if (opts?.showSelectionCheckboxes) {
    columnCount++;
  }

  if (opts?.showDragButtons) {
    columnCount++;
  }

  let topLevelRows = [];
  let visit = (node: GridNode<T>) => {
    switch (node.type) {
      // case 'body':
      //   body = node;
      //   keyMap.set(body.key, body);
      //   break;
      // case 'column':
      //   if (!node.hasChildNodes) {
      //     userColumnCount++;
      //   }
      //   break;
      case 'item':
        topLevelRows.push(node);
        return;
    }

    for (let child of nodes.getChildren(node.key)) {
      visit(child);
    }
  };

  for (let node of nodes) {
    if (node.type === 'column') {
      originalColumns.push(node);
    }
    visit(node);
  }
  columnCount += userColumnCount;

  // Update each grid node in the treegrid table with values specific to a treegrid structure. Also store a set of flattened row nodes for TableCollection to consume
  let globalRowCount = 0;
  let visitNode = (node: GridNode<T>, i?: number) => {
    // Clone row node and its children so modifications to the node for treegrid specific values aren't applied on the nodes provided
    // to TableCollection. Index, level, and parent keys are all changed to reflect a flattened row structure rather than the treegrid structure
    // values automatically calculated via CollectionBuilder
    if (node.type === 'item') {
      let childNodes = [];
      for (let child of  nodes.getChildren(node.key)) {
        // TODO: get rid of this cell handling
        if (child.type === 'cell') {
          let cellClone = {...child};
          if (cellClone.index + 1 === columnCount) {
            cellClone.nextKey = null;
          }
          childNodes.push({...cellClone});
        }
      }
      let clone = {...node, childNodes: childNodes, level: 1, index: globalRowCount++};
      flattenedRows.push(clone);
    }

    let newProps = {};

    // Assign indexOfType to cells and rows for aria-posinset
    if (node.type !== 'placeholder' && node.type !== 'column') {
      newProps['indexOfType'] = i;
    }

    // Use Object.assign instead of spread to preserve object reference for keyMap. Also ensures retrieving nodes
    // via .childNodes returns the same object as the one found via keyMap look up
    Object.assign(node, newProps);
    keyMap.set(node.key, node);

    let lastNode: GridNode<T>;
    let rowIndex = 0;
    for (let child of nodes.getChildren(node.key)) {
      if (!(child.type === 'item' && expandedKeys !== 'all' && !expandedKeys.has(node.key))) {
        if (child.parentKey == null) {
          // if child is a cell/expanded row/column and the parent key isn't already established by the collection, match child node to parent row
          child.parentKey = node.key;
        }

        if (lastNode) {
          lastNode.nextKey = child.key;
          child.prevKey = lastNode.key;
        } else {
          child.prevKey = null;
        }

        if (child.type === 'item') {
          visitNode(child, rowIndex++);
        } else {
          // We enforce that the cells come before rows so can just reuse cell index
          visitNode(child, child.index);
        }

        lastNode = child;
      }
    }

    if (lastNode) {
      lastNode.nextKey = null;
    }
  };

  let last: GridNode<T>;
  topLevelRows.forEach((node: GridNode<T>, i) => {
    visitNode(node as GridNode<T>, i);

    if (last) {
      last.nextKey = node.key;
      node.prevKey = last.key;
    } else {
      node.prevKey = null;
    }

    last = node;
  });

  if (last) {
    last.nextKey = null;
  }

  return {
    keyMap,
    userColumnCount,
    flattenedRows,
    // tableNodes: [...originalColumns, {...body, childNodes: flattenedRows}]
  };
}
