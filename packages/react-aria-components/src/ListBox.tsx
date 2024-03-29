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

import {AriaListBoxOptions, AriaListBoxProps, DraggableItemResult, DragPreviewRenderer, DroppableCollectionResult, DroppableItemResult, FocusScope, ListKeyboardDelegate, mergeProps, useCollator, useFocusRing, useHover, useListBox, useListBoxSection, useLocale, useOption} from 'react-aria';
import {CollectionDocumentContext, CollectionPortal, CollectionProps, ItemRenderProps, useCachedChildren, useCollection, useSSRCollectionNode} from './Collection';
import {ContextValue, forwardRefType, HiddenContext, Provider, RenderProps, ScrollableProps, SlotProps, StyleProps, StyleRenderProps, useContextProps, useRenderProps, useSlot} from './utils';
import {DragAndDropContext, DragAndDropHooks, DropIndicator, DropIndicatorContext, DropIndicatorProps} from './useDragAndDrop';
import {DraggableCollectionState, DroppableCollectionState, ListState, Node, Orientation, SelectionBehavior, useListState} from 'react-stately';
import {filterDOMProps, mergeRefs, useObjectRef} from '@react-aria/utils';
import {Header} from './Header';
import {HoverEvents, Key, LinkDOMProps} from '@react-types/shared';
import React, {createContext, ForwardedRef, forwardRef, JSX, ReactNode, RefObject, useContext, useEffect, useMemo, useRef} from 'react';
import {Separator, SeparatorContext} from './Separator';
import {TextContext} from './Text';

export interface ListBoxRenderProps {
  /**
   * Whether the listbox has no items and should display its empty state.
   * @selector [data-empty]
   */
  isEmpty: boolean,
  /**
   * Whether the listbox is currently focused.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the listbox is currently keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the listbox is currently the active drop target.
   * @selector [data-drop-target]
   */
  isDropTarget: boolean,
  /**
   * Whether the items are arranged in a stack or grid.
   * @selector [data-layout="stack | grid"]
   */
  layout: 'stack' | 'grid',
  /**
   * State of the listbox.
   */
  state: ListState<unknown>
}

export interface ListBoxProps<T> extends Omit<AriaListBoxProps<T>, 'children' | 'label'>, CollectionProps<T>, StyleRenderProps<ListBoxRenderProps>, SlotProps, ScrollableProps<HTMLDivElement> {
  /** How multiple selection should behave in the collection. */
  selectionBehavior?: SelectionBehavior,
  /** The drag and drop hooks returned by `useDragAndDrop` used to enable drag and drop behavior for the ListBox. */
  dragAndDropHooks?: DragAndDropHooks,
  /** Provides content to display when there are no items in the list. */
  renderEmptyState?: (props: ListBoxRenderProps) => ReactNode,
  /**
   * Whether the items are arranged in a stack or grid.
   * @default 'stack'
   */
  layout?: 'stack' | 'grid',
  /**
   * The primary orientation of the items. Usually this is the
   * direction that the collection scrolls.
   * @default 'vertical'
   */
  orientation?: Orientation
}

export const ListBoxContext = createContext<ContextValue<ListBoxProps<any>, HTMLDivElement>>(null);
export const ListStateContext = createContext<ListState<any> | null>(null);

function ListBox<T extends object>(props: ListBoxProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, ListBoxContext);
  let isHidden = useContext(HiddenContext);
  let state = useContext(ListStateContext);
  let document = useContext(CollectionDocumentContext);

  // The structure of ListBox is a bit strange because it needs to work inside other components like ComboBox and Select.
  // Those components render two copies of their children so that the collection can be built even when the popover is closed.
  // The first copy sends a collection document via context which we render the collection portal into.
  // The second copy sends a ListState object via context which we use to render the ListBox without rebuilding the state.
  // Otherwise, we have a standalone ListBox, so we need to create a collection and state ourselves.

  if (document) {
    return <CollectionPortal {...props} />;
  }

  if (state) {
    return isHidden ? null : <ListBoxInner state={state} props={props} listBoxRef={ref} />;
  }

  return <StandaloneListBox props={props} listBoxRef={ref} />;
}

function StandaloneListBox({props, listBoxRef}) {
  let {portal, collection} = useCollection(props);
  props = {...props, collection, children: null, items: null};
  let state = useListState(props);
  return (
    <>
      {portal}
      <ListBoxInner state={state} props={props} listBoxRef={listBoxRef} />
    </>
  );
}

/**
 * A listbox displays a list of options and allows a user to select one or more of them.
 */
const _ListBox = /*#__PURE__*/ (forwardRef as forwardRefType)(ListBox);
export {_ListBox as ListBox};

interface ListBoxInnerProps<T> {
  state: ListState<T>,
  props: ListBoxProps<T> & AriaListBoxOptions<T>,
  listBoxRef: RefObject<HTMLDivElement>
}

function ListBoxInner<T>({state, props, listBoxRef}: ListBoxInnerProps<T>) {
  let {dragAndDropHooks, layout = 'stack', orientation = 'vertical'} = props;
  let {collection, selectionManager} = state;
  let isListDraggable = !!dragAndDropHooks?.useDraggableCollectionState;
  let isListDroppable = !!dragAndDropHooks?.useDroppableCollectionState;
  let {direction} = useLocale();
  let {disabledBehavior, disabledKeys} = selectionManager;
  let collator = useCollator({usage: 'search', sensitivity: 'base'});
  let keyboardDelegate = useMemo(() => (
    props.keyboardDelegate || new ListKeyboardDelegate({
      collection,
      collator,
      ref: listBoxRef,
      disabledKeys: disabledBehavior === 'selection' ? new Set<Key>() : disabledKeys,
      layout,
      orientation,
      direction
    })
  ), [collection, collator, listBoxRef, disabledBehavior, disabledKeys, orientation, direction, props.keyboardDelegate, layout]);

  let {listBoxProps} = useListBox({
    ...props,
    shouldSelectOnPressUp: isListDraggable || props.shouldSelectOnPressUp,
    keyboardDelegate
  }, state, listBoxRef);

  let children = useCachedChildren({
    items: collection,
    children: (item: Node<T>) => {
      switch (item.type) {
        case 'section':
          return <ListBoxSection section={item} />;
        case 'separator':
          return <Separator {...item.props} />;
        case 'item':
          return <Option item={item} />;
        default:
          throw new Error('Unsupported node type in Menu: ' + item.type);
      }
    }
  });

  let dragHooksProvided = useRef(isListDraggable);
  let dropHooksProvided = useRef(isListDroppable);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (dragHooksProvided.current !== isListDraggable) {
        console.warn('Drag hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
      }
      if (dropHooksProvided.current !== isListDroppable) {
        console.warn('Drop hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
      }
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
    dragAndDropHooks.useDraggableCollection!({}, dragState, listBoxRef);

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

    let dropTargetDelegate = dragAndDropHooks.dropTargetDelegate || new dragAndDropHooks.ListDropTargetDelegate(collection, listBoxRef, {orientation, layout, direction});
    droppableCollection = dragAndDropHooks.useDroppableCollection!({
      keyboardDelegate,
      dropTargetDelegate
    }, dropState, listBoxRef);

    isRootDropTarget = dropState.isDropTarget({type: 'root'});
  }

  let {focusProps, isFocused, isFocusVisible} = useFocusRing();
  let renderValues = {
    isDropTarget: isRootDropTarget,
    isEmpty: state.collection.size === 0,
    isFocused,
    isFocusVisible,
    layout: props.layout || 'stack',
    state
  };
  let renderProps = useRenderProps({
    className: props.className,
    style: props.style,
    defaultClassName: 'react-aria-ListBox',
    values: renderValues
  });

  let emptyState: JSX.Element | null = null;
  if (state.collection.size === 0 && props.renderEmptyState) {
    emptyState = (
      <div
        // eslint-disable-next-line
        role="option"
        style={{display: 'contents'}}>
        {props.renderEmptyState(renderValues)}
      </div>
    );
  }

  return (
    <FocusScope>
      <div
        {...filterDOMProps(props)}
        {...mergeProps(listBoxProps, focusProps, droppableCollection?.collectionProps)}
        {...renderProps}
        ref={listBoxRef}
        slot={props.slot || undefined}
        onScroll={props.onScroll}
        data-drop-target={isRootDropTarget || undefined}
        data-empty={state.collection.size === 0 || undefined}
        data-focused={isFocused || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-layout={props.layout || 'stack'}
        data-orientation={props.orientation || 'vertical'}>
        <Provider
          values={[
            [ListBoxContext, props],
            [ListStateContext, state],
            [DragAndDropContext, {dragAndDropHooks, dragState, dropState}],
            [SeparatorContext, {elementType: 'div'}],
            [DropIndicatorContext, {render: ListBoxDropIndicatorWrapper}]
          ]}>
          {children}
        </Provider>
        {emptyState}
        {dragPreview}
      </div>
    </FocusScope>
  );
}

interface ListBoxSectionProps<T> extends StyleProps {
  section: Node<T>
}

function ListBoxSection<T>({section, className, style}: ListBoxSectionProps<T>) {
  let state = useContext(ListStateContext)!;
  let [headingRef, heading] = useSlot();
  let {headingProps, groupProps} = useListBoxSection({
    heading,
    'aria-label': section.props['aria-label'] ?? undefined
  });

  let children = useCachedChildren({
    items: state.collection.getChildren!(section.key),
    children: item => {
      switch (item.type) {
        case 'header': {
          return (
            <SectionHeader
              item={item}
              headingProps={headingProps}
              headingRef={headingRef} />
          );
        }
        case 'item':
          return <Option item={item} />;
        default:
          throw new Error('Unsupported element type in Section: ' + item.type);
      }
    }
  });

  return (
    <section
      {...filterDOMProps(section.props)}
      {...groupProps}
      className={className || section.props?.className || 'react-aria-Section'}
      style={style || section.props?.style}
      ref={section.props.ref}>
      {children}
    </section>
  );
}

// This is a separate component so that headingProps.id doesn't override the item key in useCachedChildren.
function SectionHeader({item, headingProps, headingRef}) {
  let {ref, ...otherProps} = item.props;
  return (
    <Header
      {...headingProps}
      {...otherProps}
      ref={mergeRefs(headingRef, ref)}>
      {item.rendered}
    </Header>
  );
}

export interface ListBoxItemRenderProps extends ItemRenderProps {}

export interface ListBoxItemProps<T = object> extends RenderProps<ListBoxItemRenderProps>, LinkDOMProps, HoverEvents {
  /** The unique id of the item. */
  id?: Key,
  /** The object value that this item represents. When using dynamic collections, this is set automatically. */
  value?: T,
  /** A string representation of the item's contents, used for features like typeahead. */
  textValue?: string,
  /** An accessibility label for this item. */
  'aria-label'?: string
}

function ListBoxItem<T extends object>(props: ListBoxItemProps<T>, ref: ForwardedRef<HTMLDivElement>): JSX.Element | null {
  return useSSRCollectionNode('item', props, ref, props.children);
}

/**
 * A ListBoxItem represents an individual option in a ListBox.
 */
const _ListBoxItem = /*#__PURE__*/ (forwardRef as forwardRefType)(ListBoxItem);
export {_ListBoxItem as ListBoxItem};

interface OptionProps<T> {
  item: Node<T>
}

function Option<T>({item}: OptionProps<T>) {
  let ref = useObjectRef<any>(item.props.ref);
  let state = useContext(ListStateContext)!;
  let {dragAndDropHooks, dragState, dropState} = useContext(DragAndDropContext)!;
  let {optionProps, labelProps, descriptionProps, ...states} = useOption(
    {key: item.key, 'aria-label': item.props?.['aria-label']},
    state,
    ref
  );

  let {hoverProps, isHovered} = useHover({
    isDisabled: !states.allowsSelection && !states.hasAction,
    onHoverStart: item.props.onHoverStart,
    onHoverChange: item.props.onHoverChange,
    onHoverEnd: item.props.onHoverEnd
  });

  let draggableItem: DraggableItemResult | null = null;
  if (dragState && dragAndDropHooks) {
    draggableItem = dragAndDropHooks.useDraggableItem!({key: item.key}, dragState);
  }

  let droppableItem: DroppableItemResult | null = null;
  if (dropState && dragAndDropHooks) {
    droppableItem = dragAndDropHooks.useDroppableItem!({
      target: {type: 'item', key: item.key, dropPosition: 'on'}
    }, dropState, ref);
  }

  let props: ListBoxItemProps<T> = item.props;
  let isDragging = dragState && dragState.isDragging(item.key);
  let renderProps = useRenderProps({
    ...props,
    id: undefined,
    children: item.rendered,
    defaultClassName: 'react-aria-ListBoxItem',
    values: {
      ...states,
      isHovered,
      selectionMode: state.selectionManager.selectionMode,
      selectionBehavior: state.selectionManager.selectionBehavior,
      allowsDragging: !!dragState,
      isDragging,
      isDropTarget: droppableItem?.isDropTarget
    }
  });

  let renderDropIndicator = dragAndDropHooks?.renderDropIndicator || (target => <DropIndicator target={target} />);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (!item.textValue) {
        console.warn('A `textValue` prop is required for <ListBoxItem> elements with non-plain text children in order to support accessibility features such as type to select.');
      }
    }
  }, [item.textValue]);

  let ElementType: React.ElementType = props.href ? 'a' : 'div';

  return (
    <>
      {dragAndDropHooks?.useDropIndicator &&
        renderDropIndicator({type: 'item', key: item.key, dropPosition: 'before'})
      }
      <ElementType
        {...mergeProps(optionProps, hoverProps, draggableItem?.dragProps, droppableItem?.dropProps)}
        {...renderProps}
        ref={ref}
        data-allows-dragging={!!dragState || undefined}
        data-selected={states.isSelected || undefined}
        data-disabled={states.isDisabled || undefined}
        data-hovered={isHovered || undefined}
        data-focused={states.isFocused || undefined}
        data-focus-visible={states.isFocusVisible || undefined}
        data-pressed={states.isPressed || undefined}
        data-dragging={isDragging || undefined}
        data-drop-target={droppableItem?.isDropTarget || undefined}
        data-selection-mode={state.selectionManager.selectionMode === 'none' ? undefined : state.selectionManager.selectionMode}>
        <Provider
          values={[
            [TextContext, {
              slots: {
                label: labelProps,
                description: descriptionProps
              }
            }]
          ]}>
          {renderProps.children}
        </Provider>
      </ElementType>
      {dragAndDropHooks?.useDropIndicator && state.collection.getKeyAfter(item.key) == null &&
        renderDropIndicator({type: 'item', key: item.key, dropPosition: 'after'})
      }
    </>
  );
}

function ListBoxDropIndicatorWrapper(props: DropIndicatorProps, ref: ForwardedRef<HTMLElement>) {
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
    <ListBoxtDropIndicatorForwardRef {...props} dropIndicatorProps={dropIndicatorProps} isDropTarget={isDropTarget} ref={ref} />
  );
}

interface ListBoxDropIndicatorProps extends DropIndicatorProps {
  dropIndicatorProps: React.HTMLAttributes<HTMLElement>,
  isDropTarget: boolean
}

function ListBoxtDropIndicator(props: ListBoxDropIndicatorProps, ref: ForwardedRef<HTMLElement>) {
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
      ref={ref as RefObject<HTMLDivElement>}
      data-drop-target={isDropTarget || undefined} />
  );
}

const ListBoxtDropIndicatorForwardRef = forwardRef(ListBoxtDropIndicator);
