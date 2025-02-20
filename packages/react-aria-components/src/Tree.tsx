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

import {AriaTreeGridListItemOptions, AriaTreeGridListProps, useTreeGridList, useTreeGridListItem} from '@react-aria/tree';
import {ButtonContext} from './Button';
import {CheckboxContext} from './RSPContexts';
import {Collection, CollectionBuilder, CollectionNode, createBranchComponent, createLeafComponent, useCachedChildren} from '@react-aria/collections';
import {CollectionProps, CollectionRendererContext, DefaultCollectionRenderer, ItemRenderProps, usePersistedKeys} from './Collection';
import {ContextValue, DEFAULT_SLOT, Provider, RenderProps, ScrollableProps, SlotProps, StyleRenderProps, useContextProps, useRenderProps} from './utils';
import {DisabledBehavior, DragPreviewRenderer, Expandable, forwardRefType, HoverEvents, Key, KeyboardDelegate, LinkDOMProps, RefObject} from '@react-types/shared';
import {DragAndDropContext, DropIndicatorContext, DropIndicatorProps, useRenderDropIndicator} from './DragAndDrop';
import {DragAndDropHooks} from './useDragAndDrop';
import {DraggableCollectionState, DroppableCollectionState, Collection as ICollection, Node, SelectionBehavior, TreeState, useTreeState} from 'react-stately';
import {DraggableItemResult, DroppableCollectionResult, DroppableItemResult, FocusScope,  ListKeyboardDelegate,  mergeProps, useCollator, useFocusRing, useGridListSelectionCheckbox, useHover, useLocale} from 'react-aria';
import {filterDOMProps, useObjectRef} from '@react-aria/utils';
import React, {createContext, ForwardedRef, forwardRef, HTMLAttributes, ReactNode, useContext, useEffect, useMemo, useRef} from 'react';
import {useControlledState} from '@react-stately/utils';

class TreeCollection<T> implements ICollection<Node<T>> {
  private flattenedRows: Node<T>[];
  private keyMap: Map<Key, CollectionNode<T>> = new Map();

  constructor(opts) {
    let {collection, expandedKeys} = opts;
    let {flattenedRows, keyMap} = flattenTree<T>(collection, {expandedKeys});
    this.flattenedRows = flattenedRows;
    // Use generated keyMap because it contains the modified collection nodes (aka it adjusts the indexes so that they ignore the existence of the Content items)
    this.keyMap = keyMap;
  }

  // TODO: should this collection's getters reflect the flattened structure or the original structure
  // If we respresent the flattened structure, it is easier for the keyboard nav but harder to find all the nodes
  *[Symbol.iterator]() {
    yield* this.flattenedRows;
  }

  get size() {
    return this.flattenedRows.length;
  }

  getKeys() {
    return this.keyMap.keys();
  }

  getItem(key: Key): Node<T> | null {
    return this.keyMap.get(key) || null;
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

  // Note that this will return Content nodes in addition to nested TreeItems
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

export interface TreeRenderProps {
  /**
   * Whether the tree has no items and should display its empty state.
   * @selector [data-empty]
   */
  isEmpty: boolean,
  /**
   * Whether the tree is currently focused.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the tree is currently keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * State of the tree.
   */
  state: TreeState<unknown>
}

export interface TreeEmptyStateRenderProps extends Omit<TreeRenderProps, 'isEmpty'> {}

export interface TreeProps<T> extends Omit<AriaTreeGridListProps<T>, 'children'>, CollectionProps<T>, StyleRenderProps<TreeRenderProps>, SlotProps, ScrollableProps<HTMLDivElement>, Expandable {
  /** How multiple selection should behave in the tree. */
  selectionBehavior?: SelectionBehavior,
  /** Provides content to display when there are no items in the list. */
  renderEmptyState?: (props: TreeEmptyStateRenderProps) => ReactNode,
  /**
   * Whether `disabledKeys` applies to all interactions, or only selection.
   * @default 'all'
   */
  disabledBehavior?: DisabledBehavior,
  dragAndDropHooks?: DragAndDropHooks,

  /**
   * An optional keyboard delegate implementation for type to select,
   * to override the default.
   */
  keyboardDelegate?: KeyboardDelegate
}


export const UNSTABLE_TreeContext = createContext<ContextValue<TreeProps<any>, HTMLDivElement>>(null);
export const UNSTABLE_TreeStateContext = createContext<TreeState<any> | null>(null);

/**
 * A tree provides users with a way to navigate nested hierarchical information, with support for keyboard navigation
 * and selection.
 */
export const UNSTABLE_Tree = /*#__PURE__*/ (forwardRef as forwardRefType)(function Tree<T extends object>(props: TreeProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  // Render the portal first so that we have the collection by the time we render the DOM in SSR.
  [props, ref] = useContextProps(props, ref, UNSTABLE_TreeContext);

  return (
    <CollectionBuilder content={<Collection {...props} />}>
      {collection => <TreeInner props={props} collection={collection} treeRef={ref} />}
    </CollectionBuilder>
  );
});

interface TreeInnerProps<T extends object> {
  props: TreeProps<T>,
  collection: ICollection<unknown>,
  treeRef: RefObject<HTMLDivElement | null>
}

function TreeInner<T extends object>({props, collection, treeRef: ref}: TreeInnerProps<T>) {
  const {dragAndDropHooks} = props;
  let {direction} = useLocale();
  let collator = useCollator({usage: 'search', sensitivity: 'base'});
  let isListDraggable = !!dragAndDropHooks?.useDraggableCollectionState;
  let isListDroppable = !!dragAndDropHooks?.useDroppableCollectionState;
  let {
    selectionMode = 'none',
    expandedKeys: propExpandedKeys,
    defaultExpandedKeys: propDefaultExpandedKeys,
    onExpandedChange,
    disabledBehavior = 'all'
  } = props;
  let {CollectionRoot, isVirtualized, layoutDelegate} = useContext(CollectionRendererContext);

  // Kinda annoying that we have to replicate this code here as well as in useTreeState, but don't want to add
  // flattenCollection stuff to useTreeState. Think about this later
  let [expandedKeys, setExpandedKeys] = useControlledState(
    propExpandedKeys ? convertExpanded(propExpandedKeys) : undefined,
    propDefaultExpandedKeys ? convertExpanded(propDefaultExpandedKeys) : new Set(),
    onExpandedChange
  );

  let flattenedCollection = useMemo(() => {
    return new TreeCollection<object>({collection, expandedKeys});
  }, [collection, expandedKeys]);

  let state = useTreeState({
    ...props,
    selectionMode,
    expandedKeys,
    onExpandedChange: setExpandedKeys,
    collection: flattenedCollection,
    children: undefined,
    disabledBehavior
  });

  let keyboardDelegate = useMemo(
    () =>
      props.keyboardDelegate ||
      new ListKeyboardDelegate({
        collection: state.collection,
        collator,
        ref,
        disabledKeys: state.selectionManager.disabledKeys,
        disabledBehavior: state.selectionManager.disabledBehavior,
        layout: 'stack',
        direction,
        layoutDelegate
      }),
    [collator, ref, state.selectionManager.disabledKeys, direction, state.collection, state.selectionManager.disabledBehavior, props.keyboardDelegate, layoutDelegate]
  );

  let {gridProps} = useTreeGridList({
    ...props,
    isVirtualized,
    layoutDelegate
  }, state, ref);

  let {focusProps, isFocused, isFocusVisible} = useFocusRing();
  let renderValues = {
    isEmpty: state.collection.size === 0,
    isFocused,
    isFocusVisible,
    state
  };

  let renderProps = useRenderProps({
    className: props.className,
    style: props.style,
    defaultClassName: 'react-aria-Tree',
    values: renderValues
  });

  let emptyState: ReactNode = null;
  let emptyStatePropOverrides: HTMLAttributes<HTMLElement> | null = null;
  if (state.collection.size === 0 && props.renderEmptyState) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let {isEmpty, ...values} = renderValues;
    let content = props.renderEmptyState({...values});
    let treeGridRowProps = {
      'aria-level': 1,
      'aria-posinset': 1,
      'aria-setsize': 1
    };

    emptyState = (
      <div role="row" style={{display: 'contents'}} {...treeGridRowProps}>
        <div role="gridcell" style={{display: 'contents'}}>
          {content}
        </div>
      </div>
    );
  }
  let dragState: DraggableCollectionState | undefined = undefined;
  let dropState: DroppableCollectionState | undefined = undefined;
  let droppableCollection: DroppableCollectionResult | undefined = undefined;
  let preview = useRef<DragPreviewRenderer>(null);

  if (isListDraggable && dragAndDropHooks) {
    dragState = dragAndDropHooks.useDraggableCollectionState!({
      collection: state.collection,
      selectionManager: state.selectionManager,
      preview: dragAndDropHooks.renderDragPreview ? preview : undefined
    });
    dragAndDropHooks.useDraggableCollection!({}, dragState, ref);
  }

  if (isListDroppable && dragAndDropHooks) {
    dropState = dragAndDropHooks.useDroppableCollectionState!({
      collection: state.collection,
      selectionManager: state.selectionManager
    });

    let dropTargetDelegate = new dragAndDropHooks.ListDropTargetDelegate(
      state.collection,
      ref,
      {layout: 'stack', direction}
    );

    droppableCollection = dragAndDropHooks.useDroppableCollection!(
      {keyboardDelegate, dropTargetDelegate},
      dropState,
      ref
    );
  }
  return (
    <FocusScope>
      <div
        {...filterDOMProps(props)}
        {...renderProps}
        {...mergeProps(
          gridProps,
          focusProps,
          emptyStatePropOverrides,
          droppableCollection?.collectionProps
        )}
        ref={ref}
        slot={props.slot || undefined}
        onScroll={props.onScroll}
        data-empty={state.collection.size === 0 || undefined}
        data-focused={isFocused || undefined}
        data-focus-visible={isFocusVisible || undefined}>
        <Provider
          values={[
            [UNSTABLE_TreeStateContext, state],
            [DragAndDropContext, {dragAndDropHooks, dragState, dropState}],
            [DropIndicatorContext, {render: TreeDropIndicatorWrapper}]
          ]}>
          <CollectionRoot
            collection={state.collection}
            persistedKeys={usePersistedKeys(state.selectionManager.focusedKey)}
            scrollRef={ref}
            renderDropIndicator={useRenderDropIndicator(dragAndDropHooks, dropState)} />
        </Provider>
        {emptyState}
      </div>
    </FocusScope>
  );
}

// TODO: readd the rest of the render props when tree supports them
export interface TreeItemRenderProps extends Omit<ItemRenderProps, 'allowsDragging' | 'isDragging' | 'isDropTarget'> {
  /** Whether the tree item is expanded. */
  isExpanded: boolean,
  // TODO: api discussion, how do we feel about the below? This is so we can still style the row as grey when a child element within is focused
  // Maybe should have this for the other collection item render props
  /** Whether the tree item's children have keyboard focus. */
  isFocusVisibleWithin: boolean
}

export interface TreeItemContentRenderProps extends ItemRenderProps {
  // Whether the tree item is expanded.
  isExpanded: boolean,
  // Whether the tree item has child tree items.
  hasChildItems: boolean,
  // What level the tree item has within the tree.
  level: number,
  // Whether the tree item's children have keyboard focus.
  isFocusVisibleWithin: boolean,
  // The state of the tree.
  state: TreeState<unknown>,
  // The unique id of the tree row.
  id: Key
}

// The TreeItemContent is the one that accepts RenderProps because we would get much more complicated logic in TreeItem otherwise since we'd
// need to do a bunch of check to figure out what is the Content and what are the actual collection elements (aka child rows) of the TreeItem
export interface TreeItemContentProps extends Pick<RenderProps<TreeItemContentRenderProps>, 'children'> {}

export const UNSTABLE_TreeItemContent = /*#__PURE__*/ createLeafComponent('content', function TreeItemContent(props: TreeItemContentProps) {
  let values = useContext(TreeItemContentContext)!;
  let renderProps = useRenderProps({
    children: props.children,
    values
  });
  return (
    <CollectionRendererContext.Provider value={DefaultCollectionRenderer}>
      {renderProps.children}
    </CollectionRendererContext.Provider>
  );
});

export const TreeItemContentContext = createContext<TreeItemContentRenderProps | null>(null);

export interface TreeItemProps<T = object> extends StyleRenderProps<TreeItemRenderProps>, LinkDOMProps, HoverEvents, Pick<AriaTreeGridListItemOptions, 'hasChildItems'> {
  /** The unique id of the tree row. */
  id?: Key,
  /** The object value that this tree item represents. When using dynamic collections, this is set automatically. */
  value?: T,
  /** A string representation of the tree item's contents, used for features like typeahead. */
  textValue: string,
  /** An accessibility label for this tree item. */
  'aria-label'?: string,
  /** The content of the tree item along with any nested children. Supports static nested tree items or use of a Collection to dynamically render nested tree items. */
  children: ReactNode
}

/**
 * A TreeItem represents an individual item in a Tree.
 */
export const UNSTABLE_TreeItem = /*#__PURE__*/ createBranchComponent('item', <T extends object>(props: TreeItemProps<T>, ref: ForwardedRef<HTMLDivElement>, item: Node<T>) => {
  let state = useContext(UNSTABLE_TreeStateContext)!;
  ref = useObjectRef<HTMLDivElement>(ref);
  // TODO: remove this when we support description in tree row
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let {rowProps, gridCellProps, expandButtonProps, descriptionProps, ...states} = useTreeGridListItem({node: item}, state, ref);
  let isExpanded = rowProps['aria-expanded'] === true;
  let hasChildItems = props.hasChildItems || [...state.collection.getChildren!(item.key)]?.length > 1;;
  let level = rowProps['aria-level'] || 1;

  let {hoverProps, isHovered} = useHover({
    isDisabled: !states.allowsSelection && !states.hasAction,
    onHoverStart: props.onHoverStart,
    onHoverChange: props.onHoverChange,
    onHoverEnd: props.onHoverEnd
  });

  let {isFocusVisible, focusProps} = useFocusRing();
  let {
    isFocusVisible: isFocusVisibleWithin,
    focusProps: focusWithinProps
  } = useFocusRing({within: true});
  let {checkboxProps} = useGridListSelectionCheckbox(
    {key: item.key},
    state
  );

  let {dragAndDropHooks, dragState, dropState} = useContext(DragAndDropContext)!;

  let draggableItem: DraggableItemResult | null = null;
  if (dragState && dragAndDropHooks) {
    draggableItem = dragAndDropHooks.useDraggableItem!({key: item.key}, dragState);
  }

  let droppableItem: DroppableItemResult | null = null;
  if (dropState && dragAndDropHooks) {
    droppableItem = dragAndDropHooks.useDroppableItem!({target: {type: 'item', key: item.key, dropPosition: 'on'}}, dropState, ref);
  }

  let renderPropValues = React.useMemo<TreeItemContentRenderProps>(() => ({
    ...states,
    isHovered,
    isFocusVisible,
    isExpanded,
    hasChildItems,
    level,
    selectionMode: state.selectionManager.selectionMode,
    selectionBehavior: state.selectionManager.selectionBehavior,
    isFocusVisibleWithin,
    state,
    id: item.key
  }), [states, isHovered, isFocusVisible, state.selectionManager, isExpanded, hasChildItems, level, isFocusVisibleWithin, state, item.key]);

  let renderProps = useRenderProps({
    ...props,
    id: undefined,
    children: item.rendered,
    defaultClassName: 'react-aria-TreeItem',
    defaultStyle: {
      // @ts-ignore
      '--tree-item-level': level
    },
    values: renderPropValues
  });

  useEffect(() => {
    if (!item.textValue) {
      console.warn('A `textValue` prop is required for <TreeItem> elements in order to support accessibility features such as type to select.');
    }
  }, [item.textValue]);

  let expandButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (hasChildItems && !expandButtonRef.current) {
      console.warn('Expandable tree items must contain a expand button so screen reader users can expand/collapse the item.');
    }
  // eslint-disable-next-line
  }, []);

  let children = useCachedChildren({
    items: state.collection.getChildren!(item.key),
    children: item => {
      switch (item.type) {
        case 'content': {
          return item.render!(item);
        }
        // Skip item since we don't render the nested rows as children of the parent row, the flattened collection
        // will render them each as siblings instead
        case 'loader':
        case 'item':
          return <></>;
        default:
          throw new Error('Unsupported element type in TreeRow: ' + item.type);
      }
    }
  });

  return (
    <>
      <div
        {...mergeProps(
          filterDOMProps(props as any),
          rowProps,
          focusProps,
          hoverProps,
          focusWithinProps,
          draggableItem?.dragProps,
          droppableItem?.dropProps
        )}
        {...renderProps}
        ref={ref}
        // TODO: missing selectionBehavior, hasAction and allowsSelection data attribute equivalents (available in renderProps). Do we want those?
        data-expanded={(hasChildItems && isExpanded) || undefined}
        data-has-child-items={hasChildItems || undefined}
        data-level={level}
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
              [CheckboxContext, {
                slots: {
                  selection: checkboxProps
                }
              }],
              // TODO: support description in the tree row
              // TODO: don't think I need to pass isExpanded to the button here since it can be sourced from the renderProps? Might be worthwhile passing it down?
              [ButtonContext, {
                slots: {
                  [DEFAULT_SLOT]: {},
                  chevron: {
                    ...expandButtonProps,
                    ref: expandButtonRef
                  }
                }
              }],
              [TreeItemContentContext, {
                ...renderPropValues
              }]
            ]}>
            {children}
          </Provider>
        </div>
      </div>
    </>
  );
});

export interface TreeLoadingIndicatorRenderProps {
  /**
   * What level the tree item has within the tree.
   * @selector [data-level]
   */
  level: number
}

export interface TreeLoaderProps extends RenderProps<TreeLoadingIndicatorRenderProps>, StyleRenderProps<TreeLoadingIndicatorRenderProps> {}

export const UNSTABLE_TreeLoadingIndicator = createLeafComponent('loader', function TreeLoader<T extends object>(props: TreeLoaderProps,  ref: ForwardedRef<HTMLDivElement>, item: Node<T>) {
  let state = useContext(UNSTABLE_TreeStateContext);
  // This loader row is is non-interactable, but we want the same aria props calculated as a typical row
  // @ts-ignore
  let {rowProps} = useTreeGridListItem({node: item}, state, ref);
  let level = rowProps['aria-level'] || 1;

  let ariaProps = {
    'aria-level': rowProps['aria-level'],
    'aria-posinset': rowProps['aria-posinset'],
    'aria-setsize': rowProps['aria-setsize']
  };

  let renderProps = useRenderProps({
    ...props,
    id: undefined,
    children: item.rendered,
    defaultClassName: 'react-aria-TreeLoader',
    values: {
      level
    }
  });

  return (
    <>
      <div
        role="row"
        ref={ref}
        {...mergeProps(filterDOMProps(props as any), ariaProps)}
        {...renderProps}
        data-level={level}>
        <div role="gridcell" aria-colindex={1}>
          {renderProps.children}
        </div>
      </div>
    </>
  );
});

function convertExpanded(expanded: 'all' | Iterable<Key>): 'all' | Set<Key> {
  if (!expanded) {
    return new Set<Key>();
  }

  return expanded === 'all'
    ? 'all'
    : new Set(expanded);
}
interface TreeGridCollectionOptions {
  expandedKeys: Set<Key>
}

interface FlattenedTree<T> {
  flattenedRows: Node<T>[],
  keyMap: Map<Key, CollectionNode<T>>
}

function flattenTree<T>(collection: TreeCollection<T>, opts: TreeGridCollectionOptions): FlattenedTree<T> {
  let {
    expandedKeys = new Set()
  } = opts;
  let keyMap: Map<Key, CollectionNode<T>> = new Map();
  let flattenedRows: Node<T>[] = [];

  let visitNode = (node: Node<T>) => {
    if (node.type === 'item' || node.type === 'loader') {
      let parentKey = node?.parentKey;
      let clone = {...node};
      if (parentKey != null) {
        // TODO: assumes that non item content node (aka TreeItemContent always placed before Collection) will be always placed before the child rows. If we can't make this assumption then we can filter out
        // every non-item per level and assign indicies based off the node's position in said filtered array
        let hasContentNode = [...collection.getChildren(parentKey)][0].type !== 'item';
        if (hasContentNode) {
          clone.index = node?.index != null ? node?.index - 1 : 0;
        }

        // For loader nodes that have a parent (aka non-root level loaders), these need their levels incremented by 1 for parity with their sibiling rows
        // (Collection only increments the level if it is a "item" type node).
        if (node.type === 'loader') {
          clone.level = node.level + 1;
        }

        keyMap.set(clone.key, clone as CollectionNode<T>);
      } else {
        keyMap.set(node.key, node as CollectionNode<T>);
      }

      if (node.level === 0 || (parentKey != null && expandedKeys.has(parentKey) && flattenedRows.find(row => row.key === parentKey))) {
        // Grab the modified node from the key map so our flattened list and modified key map point to the same nodes
        flattenedRows.push(keyMap.get(node.key) || node);
      }
    } else if (node.type !== null) {
      keyMap.set(node.key, node as CollectionNode<T>);
    }

    for (let child of collection.getChildren(node.key)) {
      visitNode(child);
    }
  };

  for (let node of collection) {
    visitNode(node);
  }

  return {
    flattenedRows,
    keyMap
  };
}

export function TreeDropIndicatorWrapper(props: DropIndicatorProps, ref: ForwardedRef<HTMLElement>) {
  ref = useObjectRef(ref);
  let {dragAndDropHooks, dropState} = useContext(DragAndDropContext)!;
  let {dropIndicatorProps, isHidden, isDropTarget} = dragAndDropHooks!.useDropIndicator!(
    props,
    dropState!,
    ref
  );

  if (isHidden) {
    return null;
  }
  return (
    <TreeDropIndicatorForwardRef {...props} dropIndicatorProps={dropIndicatorProps} isDropTarget={isDropTarget} ref={ref} />
  );
}

interface TreeDropIndicatorProps extends DropIndicatorProps {
  dropIndicatorProps: React.HTMLAttributes<HTMLElement>,
  isDropTarget: boolean
}

function TreeDropIndicator(props: TreeDropIndicatorProps, ref: ForwardedRef<HTMLElement>) {
  let {
    dropIndicatorProps,
    isDropTarget,
    ...otherProps
  } = props;
  let renderProps = useRenderProps({
    ...otherProps,
    defaultClassName: 'react-aria-DropIndicator',
    values: {
      isDropTarget
    }
  });
  return (
    <div
      {...dropIndicatorProps}
      {...renderProps}
      // eslint-disable-next-line
      role="option"
      ref={ref as RefObject<HTMLDivElement | null>}
      data-drop-target={isDropTarget || undefined} />
  );
}

const TreeDropIndicatorForwardRef = forwardRef(TreeDropIndicator);
