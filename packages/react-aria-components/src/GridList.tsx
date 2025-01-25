/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {AriaGridListProps, DraggableItemResult, DragPreviewRenderer, DropIndicatorAria, DroppableCollectionResult, FocusScope, ListKeyboardDelegate, mergeProps, useCollator, useFocusRing, useGridList, useGridListItem, useGridListSelectionCheckbox, useHover, useLocale, useVisuallyHidden} from 'react-aria';
import {ButtonContext} from './Button';
import {CheckboxContext} from './RSPContexts';
import {Collection, CollectionBuilder, createLeafComponent} from '@react-aria/collections';
import {CollectionProps, CollectionRendererContext, DefaultCollectionRenderer, ItemRenderProps} from './Collection';
import {ContextValue, DEFAULT_SLOT, Provider, RenderProps, ScrollableProps, SlotProps, StyleRenderProps, useContextProps, useRenderProps} from './utils';
import {DragAndDropContext, DropIndicatorContext, DropIndicatorProps, useDndPersistedKeys, useRenderDropIndicator} from './DragAndDrop';
import {DragAndDropHooks} from './useDragAndDrop';
import {DraggableCollectionState, DroppableCollectionState, Collection as ICollection, ListState, Node, SelectionBehavior, useListState} from 'react-stately';
import {filterDOMProps, useObjectRef} from '@react-aria/utils';
import {forwardRefType, HoverEvents, Key, LinkDOMProps, RefObject} from '@react-types/shared';
import {ListStateContext} from './ListBox';
import React, {createContext, ForwardedRef, forwardRef, HTMLAttributes, JSX, ReactNode, useContext, useEffect, useMemo, useRef} from 'react';
import {TextContext} from './Text';

export interface GridListRenderProps {
  /**
   * Whether the list has no items and should display its empty state.
   * @selector [data-empty]
   */
  isEmpty: boolean,
  /**
   * Whether the grid list is currently focused.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the grid list is currently keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the grid list is currently the active drop target.
   * @selector [data-drop-target]
   */
  isDropTarget: boolean,
  /**
   * Whether the items are arranged in a stack or grid.
   * @selector [data-layout="stack | grid"]
   */
  layout: 'stack' | 'grid',
  /**
   * State of the grid list.
   */
  state: ListState<unknown>
}

export interface GridListProps<T> extends Omit<AriaGridListProps<T>, 'children'>, CollectionProps<T>, StyleRenderProps<GridListRenderProps>, SlotProps, ScrollableProps<HTMLDivElement> {
  /**
   * Whether typeahead navigation is disabled.
   * @default false
   */
  disallowTypeAhead?: boolean,
  /** How multiple selection should behave in the collection. */
  selectionBehavior?: SelectionBehavior,
  /** The drag and drop hooks returned by `useDragAndDrop` used to enable drag and drop behavior for the GridList. */
  dragAndDropHooks?: DragAndDropHooks,
  /** Provides content to display when there are no items in the list. */
  renderEmptyState?: (props: GridListRenderProps) => ReactNode,
  /**
   * Whether the items are arranged in a stack or grid.
   * @default 'stack'
   */
  layout?: 'stack' | 'grid'
}


export const GridListContext = createContext<ContextValue<GridListProps<any>, HTMLDivElement>>(null);

/**
 * A grid list displays a list of interactive items, with support for keyboard navigation,
 * single or multiple selection, and row actions.
 */
export const GridList = /*#__PURE__*/ (forwardRef as forwardRefType)(function GridList<T extends object>(props: GridListProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  // Render the portal first so that we have the collection by the time we render the DOM in SSR.
  [props, ref] = useContextProps(props, ref, GridListContext);

  return (
    <CollectionBuilder content={<Collection {...props} />}>
      {collection => <GridListInner props={props} collection={collection} gridListRef={ref} />}
    </CollectionBuilder>
  );
});

interface GridListInnerProps<T extends object> {
  props: GridListProps<T>,
  collection: ICollection<Node<object>>,
  gridListRef: RefObject<HTMLDivElement | null>
}

function GridListInner<T extends object>({props, collection, gridListRef: ref}: GridListInnerProps<T>) {
  let {dragAndDropHooks, keyboardNavigationBehavior = 'arrow', layout = 'stack'} = props;
  let {CollectionRoot, isVirtualized, layoutDelegate, dropTargetDelegate: ctxDropTargetDelegate} = useContext(CollectionRendererContext);
  let state = useListState({
    ...props,
    collection,
    children: undefined,
    layoutDelegate
  });

  let collator = useCollator({usage: 'search', sensitivity: 'base'});
  let {disabledBehavior, disabledKeys} = state.selectionManager;
  let {direction} = useLocale();
  let keyboardDelegate = useMemo(() => (
    new ListKeyboardDelegate({
      collection,
      collator,
      ref,
      disabledKeys,
      disabledBehavior,
      layoutDelegate,
      layout,
      direction
    })
  ), [collection, ref, layout, disabledKeys, disabledBehavior, layoutDelegate, collator, direction]);

  let {gridProps: {id, ...gridProps}} = useGridList({
    ...props,
    keyboardDelegate,
    // Only tab navigation is supported in grid layout.
    keyboardNavigationBehavior: layout === 'grid' ? 'tab' : keyboardNavigationBehavior,
    isVirtualized
  }, state, ref);

  let selectionManager = state.selectionManager;
  let isListDraggable = !!dragAndDropHooks?.useDraggableCollectionState;
  let isListDroppable = !!dragAndDropHooks?.useDroppableCollectionState;
  let dragHooksProvided = useRef(isListDraggable);
  let dropHooksProvided = useRef(isListDroppable);
  useEffect(() => {
    if (dragHooksProvided.current !== isListDraggable) {
      console.warn('Drag hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
    }
    if (dropHooksProvided.current !== isListDroppable) {
      console.warn('Drop hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
    }
  }, [isListDraggable, isListDroppable]);

  let dragState: DraggableCollectionState | undefined = undefined;
  let dropState: DroppableCollectionState | undefined = undefined;
  let droppableCollection: DroppableCollectionResult | undefined = undefined;
  let isRootDropTarget = false;
  let dragPreview: JSX.Element | null = null;
  let preview = useRef<DragPreviewRenderer>(null);

  if (isListDraggable && dragAndDropHooks) {
    dragState = dragAndDropHooks.useDraggableCollectionState!({
      collection,
      selectionManager,
      preview: dragAndDropHooks.renderDragPreview ? preview : undefined
    });
    dragAndDropHooks.useDraggableCollection!({}, dragState, ref);

    let DragPreview = dragAndDropHooks.DragPreview!;
    dragPreview = dragAndDropHooks.renderDragPreview
      ? <DragPreview ref={preview}>{dragAndDropHooks.renderDragPreview}</DragPreview>
      : null;
  }

  if (isListDroppable && dragAndDropHooks) {
    dropState = dragAndDropHooks.useDroppableCollectionState!({
      collection,
      selectionManager
    });

    let keyboardDelegate = new ListKeyboardDelegate({
      collection,
      disabledKeys: selectionManager.disabledKeys,
      disabledBehavior: selectionManager.disabledBehavior,
      ref
    });
    let dropTargetDelegate = dragAndDropHooks.dropTargetDelegate || ctxDropTargetDelegate || new dragAndDropHooks.ListDropTargetDelegate(collection, ref, {layout, direction});
    droppableCollection = dragAndDropHooks.useDroppableCollection!({
      keyboardDelegate,
      dropTargetDelegate
    }, dropState, ref);

    isRootDropTarget = dropState.isDropTarget({type: 'root'});
  }

  let {focusProps, isFocused, isFocusVisible} = useFocusRing();
  let renderValues = {
    isDropTarget: isRootDropTarget,
    isEmpty: state.collection.size === 0,
    isFocused,
    isFocusVisible,
    layout,
    state
  };
  let renderProps = useRenderProps({
    className: props.className,
    style: props.style,
    defaultClassName: 'react-aria-GridList',
    values: renderValues
  });

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
        {...mergeProps(gridProps, focusProps, droppableCollection?.collectionProps, emptyStatePropOverrides, {id})}
        ref={ref}
        slot={props.slot || undefined}
        onScroll={props.onScroll}
        data-drop-target={isRootDropTarget || undefined}
        data-empty={state.collection.size === 0 || undefined}
        data-focused={isFocused || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-layout={layout}>
        <Provider
          values={[
            [ListStateContext, state],
            [DragAndDropContext, {dragAndDropHooks, dragState, dropState}],
            [DropIndicatorContext, {render: GridListDropIndicatorWrapper}]
          ]}>
          {isListDroppable && <RootDropIndicator />}
          <CollectionRoot
            collection={collection}
            scrollRef={ref}
            persistedKeys={useDndPersistedKeys(selectionManager, dragAndDropHooks, dropState)}
            renderDropIndicator={useRenderDropIndicator(dragAndDropHooks, dropState)} />
        </Provider>
        {emptyState}
        {dragPreview}
      </div>
    </FocusScope>
  );
}

export interface GridListItemRenderProps extends ItemRenderProps {}

export interface GridListItemProps<T = object> extends RenderProps<GridListItemRenderProps>, LinkDOMProps, HoverEvents {
  /** The unique id of the item. */
  id?: Key,
  /** The object value that this item represents. When using dynamic collections, this is set automatically. */
  value?: T,
  /** A string representation of the item's contents, used for features like typeahead. */
  textValue?: string,
  /** Whether the item is disabled. */
  isDisabled?: boolean,
  /**
   * Handler that is called when a user performs an action on the item. The exact user event depends on
   * the collection's `selectionBehavior` prop and the interaction modality.
   */
  onAction?: () => void
}

/**
 * A GridListItem represents an individual item in a GridList.
 */
export const GridListItem = /*#__PURE__*/ createLeafComponent('item', function GridListItem<T extends object>(props: GridListItemProps<T>, forwardedRef: ForwardedRef<HTMLDivElement>, item: Node<T>) {
  let state = useContext(ListStateContext)!;
  let {dragAndDropHooks, dragState, dropState} = useContext(DragAndDropContext);
  let ref = useObjectRef<HTMLDivElement>(forwardedRef);
  let {isVirtualized} = useContext(CollectionRendererContext);
  let {rowProps, gridCellProps, descriptionProps, ...states} = useGridListItem(
    {
      node: item,
      shouldSelectOnPressUp: !!dragState,
      isVirtualized
    },
    state,
    ref
  );

  let {hoverProps, isHovered} = useHover({
    isDisabled: !states.allowsSelection && !states.hasAction,
    onHoverStart: item.props.onHoverStart,
    onHoverChange: item.props.onHoverChange,
    onHoverEnd: item.props.onHoverEnd
  });

  let {isFocusVisible, focusProps} = useFocusRing();
  let {checkboxProps} = useGridListSelectionCheckbox(
    {key: item.key},
    state
  );

  let buttonProps = state.selectionManager.disabledBehavior === 'all' && states.isDisabled ? {isDisabled: true} : {};

  let draggableItem: DraggableItemResult | null = null;
  if (dragState && dragAndDropHooks) {
    draggableItem = dragAndDropHooks.useDraggableItem!({key: item.key, hasDragButton: true}, dragState);
  }

  let dropIndicator: DropIndicatorAria | null = null;
  let dropIndicatorRef = useRef<HTMLDivElement>(null);
  let {visuallyHiddenProps} = useVisuallyHidden();
  if (dropState && dragAndDropHooks) {
    dropIndicator = dragAndDropHooks.useDropIndicator!({
      target: {type: 'item', key: item.key, dropPosition: 'on'}
    }, dropState, dropIndicatorRef);
  }

  let isDragging = dragState && dragState.isDragging(item.key);
  let renderProps = useRenderProps({
    ...props,
    id: undefined,
    children: item.rendered,
    defaultClassName: 'react-aria-GridListItem',
    values: {
      ...states,
      isHovered,
      isFocusVisible,
      selectionMode: state.selectionManager.selectionMode,
      selectionBehavior: state.selectionManager.selectionBehavior,
      allowsDragging: !!dragState,
      isDragging,
      isDropTarget: dropIndicator?.isDropTarget
    }
  });

  let dragButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (dragState && !dragButtonRef.current) {
      console.warn('Draggable items in a GridList must contain a <Button slot="drag"> element so that keyboard and screen reader users can drag them.');
    }
  // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!item.textValue) {
      console.warn('A `textValue` prop is required for <GridListItem> elements with non-plain text children in order to support accessibility features such as type to select.');
    }
  }, [item.textValue]);

  return (
    <>
      {dropIndicator && !dropIndicator.isHidden &&
        <div role="row" style={{position: 'absolute'}}>
          <div role="gridcell">
            <div role="button" {...visuallyHiddenProps} {...dropIndicator?.dropIndicatorProps} ref={dropIndicatorRef} />
          </div>
        </div>
      }
      <div
        {...mergeProps(filterDOMProps(props as any), rowProps, focusProps, hoverProps, draggableItem?.dragProps)}
        {...renderProps}
        ref={ref}
        data-selected={states.isSelected || undefined}
        data-disabled={states.isDisabled || undefined}
        data-hovered={isHovered || undefined}
        data-focused={states.isFocused || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-pressed={states.isPressed || undefined}
        data-allows-dragging={!!dragState || undefined}
        data-dragging={isDragging || undefined}
        data-drop-target={dropIndicator?.isDropTarget || undefined}
        data-selection-mode={state.selectionManager.selectionMode === 'none' ? undefined : state.selectionManager.selectionMode}>
        <div {...gridCellProps} style={{display: 'contents'}}>
          <Provider
            values={[
              [CheckboxContext, {
                slots: {
                  [DEFAULT_SLOT]: {},
                  selection: checkboxProps
                }
              }],
              [ButtonContext, {
                slots: {
                  [DEFAULT_SLOT]: buttonProps,
                  drag: {
                    ...draggableItem?.dragButtonProps,
                    ref: dragButtonRef,
                    style: {
                      pointerEvents: 'none'
                    }
                  }
                }
              }],
              [TextContext, {
                slots: {
                  [DEFAULT_SLOT]: {},
                  description: descriptionProps
                }
              }],
              [CollectionRendererContext, DefaultCollectionRenderer],
              [ListStateContext, null]
            ]}>
            {renderProps.children}
          </Provider>
        </div>
      </div>
    </>
  );
});

function GridListDropIndicatorWrapper(props: DropIndicatorProps, ref: ForwardedRef<HTMLElement>) {
  ref = useObjectRef(ref);
  let {dragAndDropHooks, dropState} = useContext(DragAndDropContext);
  let buttonRef = useRef<HTMLDivElement>(null);
  let {dropIndicatorProps, isHidden, isDropTarget} = dragAndDropHooks!.useDropIndicator!(
    props,
    dropState!,
    buttonRef
  );

  if (isHidden) {
    return null;
  }

  return (
    <GridListDropIndicatorForwardRef {...props} dropIndicatorProps={dropIndicatorProps} isDropTarget={isDropTarget} buttonRef={buttonRef} ref={ref} />
  );
}

interface GridListDropIndicatorProps extends DropIndicatorProps {
  dropIndicatorProps: React.HTMLAttributes<HTMLElement>,
  isDropTarget: boolean,
  buttonRef: RefObject<HTMLDivElement | null>
}

function GridListDropIndicator(props: GridListDropIndicatorProps, ref: ForwardedRef<HTMLElement>) {
  let {
    dropIndicatorProps,
    isDropTarget,
    buttonRef,
    ...otherProps
  } = props;

  let {visuallyHiddenProps} = useVisuallyHidden();
  let renderProps = useRenderProps({
    ...otherProps,
    defaultClassName: 'react-aria-DropIndicator',
    values: {
      isDropTarget
    }
  });

  return (
    <div
      {...renderProps}
      role="row"
      ref={ref as RefObject<HTMLDivElement | null>}
      data-drop-target={isDropTarget || undefined}>
      <div role="gridcell">
        <div {...visuallyHiddenProps} role="button" {...dropIndicatorProps} ref={buttonRef} />
        {renderProps.children}
      </div>
    </div>
  );
}

const GridListDropIndicatorForwardRef = forwardRef(GridListDropIndicator);

function RootDropIndicator() {
  let {dragAndDropHooks, dropState} = useContext(DragAndDropContext);
  let ref = useRef<HTMLDivElement>(null);
  let {dropIndicatorProps} = dragAndDropHooks!.useDropIndicator!({
    target: {type: 'root'}
  }, dropState!, ref);
  let isDropTarget = dropState!.isDropTarget({type: 'root'});
  let {visuallyHiddenProps} = useVisuallyHidden();

  if (!isDropTarget && dropIndicatorProps['aria-hidden']) {
    return null;
  }

  return (
    <div role="row" aria-hidden={dropIndicatorProps['aria-hidden']} style={{position: 'absolute'}}>
      <div role="gridcell">
        <div role="button" {...visuallyHiddenProps} {...dropIndicatorProps} ref={ref} />
      </div>
    </div>
  );
}
