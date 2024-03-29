/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import ArrowDownSmall from '@spectrum-icons/ui/ArrowDownSmall';
import {chain, isAndroid, mergeProps, scrollIntoView, scrollIntoViewport} from '@react-aria/utils';
import {Checkbox} from '@react-spectrum/checkbox';
import ChevronDownMedium from '@spectrum-icons/ui/ChevronDownMedium';
import ChevronLeftMedium from '@spectrum-icons/ui/ChevronLeftMedium';
import ChevronRightMedium from '@spectrum-icons/ui/ChevronRightMedium';
import {
  classNames,
  useDOMRef,
  useFocusableRef,
  useStyleProps,
  useUnwrapDOMRef
} from '@react-spectrum/utils';
import {ColumnSize, SpectrumColumnProps} from '@react-types/table';
import {DOMRef, DropTarget, FocusableElement, FocusableRef, Key} from '@react-types/shared';
import type {DragAndDropHooks} from '@react-spectrum/dnd';
import type {DraggableCollectionState, DroppableCollectionState} from '@react-stately/dnd';
import type {DraggableItemResult, DropIndicatorAria, DroppableCollectionResult, DroppableItemResult} from '@react-aria/dnd';
import {FocusRing, FocusScope, useFocusRing} from '@react-aria/focus';
import {getInteractionModality, isFocusVisible, useHover, usePress} from '@react-aria/interactions';
import {GridNode} from '@react-types/grid';
import {InsertionIndicator} from './InsertionIndicator';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {Item, Menu, MenuTrigger} from '@react-spectrum/menu';
import {layoutInfoToStyle, ScrollView, setScrollLeft, useVirtualizer, VirtualizerItem} from '@react-aria/virtualizer';
import ListGripper from '@spectrum-icons/ui/ListGripper';
import {Nubbin} from './Nubbin';
import {ProgressCircle} from '@react-spectrum/progress';
import React, {DOMAttributes, HTMLAttributes, ReactElement, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Resizer} from './Resizer';
import {ReusableView, useVirtualizerState} from '@react-stately/virtualizer';
import {RootDropIndicator} from './RootDropIndicator';
import {DragPreview as SpectrumDragPreview} from './DragPreview';
import {SpectrumTableProps} from './TableViewWrapper';
import styles from '@adobe/spectrum-css-temp/components/table/vars.css';
import stylesOverrides from './table.css';
import {TableColumnLayout, TableState, TreeGridState} from '@react-stately/table';
import {TableLayout} from '@react-stately/layout';
import {Tooltip, TooltipTrigger} from '@react-spectrum/tooltip';
import {useButton} from '@react-aria/button';
import {useLocale, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useProvider, useProviderProps} from '@react-spectrum/provider';
import {
  useTable,
  useTableCell,
  useTableColumnHeader,
  useTableHeaderRow,
  useTableRow,
  useTableRowGroup,
  useTableSelectAllCheckbox,
  useTableSelectionCheckbox
} from '@react-aria/table';
import {useVisuallyHidden, VisuallyHidden} from '@react-aria/visually-hidden';

const DEFAULT_HEADER_HEIGHT = {
  medium: 34,
  large: 40
};

const DEFAULT_HIDE_HEADER_CELL_WIDTH = {
  medium: 38,
  large: 46
};

const ROW_HEIGHTS = {
  compact: {
    medium: 32,
    large: 40
  },
  regular: {
    medium: 40,
    large: 50
  },
  spacious: {
    medium: 48,
    large: 60
  }
};

const SELECTION_CELL_DEFAULT_WIDTH = {
  medium: 38,
  large: 48
};

const DRAG_BUTTON_CELL_DEFAULT_WIDTH = {
  medium: 16,
  large: 20
};

const LEVEL_OFFSET_WIDTH = {
  medium: 16,
  large: 20
};

export interface TableContextValue<T> {
  state: TableState<T> | TreeGridState<T>,
  dragState: DraggableCollectionState,
  dropState: DroppableCollectionState,
  dragAndDropHooks: DragAndDropHooks['dragAndDropHooks'],
  isTableDraggable: boolean,
  isTableDroppable: boolean,
  layout: TableLayout<T> & {tableState: TableState<T> | TreeGridState<T>},
  headerRowHovered: boolean,
  isInResizeMode: boolean,
  setIsInResizeMode: (val: boolean) => void,
  isEmpty: boolean,
  onFocusedResizer: () => void,
  onResizeStart: (widths: Map<Key, ColumnSize>) => void,
  onResize: (widths: Map<Key, ColumnSize>) => void,
  onResizeEnd: (widths: Map<Key, ColumnSize>) => void,
  headerMenuOpen: boolean,
  setHeaderMenuOpen: (val: boolean) => void
}

export const TableContext = React.createContext<TableContextValue<unknown>>(null);
export function useTableContext() {
  return useContext(TableContext);
}

export const VirtualizerContext = React.createContext(null);
export function useVirtualizerContext() {
  return useContext(VirtualizerContext);
}

interface TableBaseProps<T> extends SpectrumTableProps<T> {
  state: TableState<T> | TreeGridState<T>
}

function TableViewBase<T extends object>(props: TableBaseProps<T>, ref: DOMRef<HTMLDivElement>) {
  props = useProviderProps(props);
  let {
    isQuiet,
    onAction,
    onResizeStart: propsOnResizeStart,
    onResizeEnd: propsOnResizeEnd,
    dragAndDropHooks,
    state
  } = props;
  let isTableDraggable = !!dragAndDropHooks?.useDraggableCollectionState;
  let isTableDroppable = !!dragAndDropHooks?.useDroppableCollectionState;
  let dragHooksProvided = useRef(isTableDraggable);
  let dropHooksProvided = useRef(isTableDroppable);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (dragHooksProvided.current !== isTableDraggable) {
        console.warn('Drag hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
      }
      if (dropHooksProvided.current !== isTableDroppable) {
        console.warn('Drop hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
      }
      if ('expandedKeys' in state && (isTableDraggable || isTableDroppable)) {
        console.warn('Drag and drop is not yet fully supported with expandable rows and may produce unexpected results.');
      }
    }
  }, [isTableDraggable, isTableDroppable, state]);

  let {styleProps} = useStyleProps(props);
  let {direction} = useLocale();
  let {scale} = useProvider();

  const getDefaultWidth = useCallback(({props: {hideHeader, isSelectionCell, showDivider, isDragButtonCell}}: GridNode<T>): ColumnSize | null | undefined => {
    if (hideHeader) {
      let width = DEFAULT_HIDE_HEADER_CELL_WIDTH[scale];
      return showDivider ? width + 1 : width;
    } else if (isSelectionCell) {
      return SELECTION_CELL_DEFAULT_WIDTH[scale];
    } else if (isDragButtonCell) {
      return DRAG_BUTTON_CELL_DEFAULT_WIDTH[scale];
    }
  }, [scale]);

  const getDefaultMinWidth = useCallback(({props: {hideHeader, isSelectionCell, showDivider, isDragButtonCell}}: GridNode<T>): ColumnSize | null | undefined => {
    if (hideHeader) {
      let width = DEFAULT_HIDE_HEADER_CELL_WIDTH[scale];
      return showDivider ? width + 1 : width;
    } else if (isSelectionCell) {
      return SELECTION_CELL_DEFAULT_WIDTH[scale];
    } else if (isDragButtonCell) {
      return DRAG_BUTTON_CELL_DEFAULT_WIDTH[scale];
    }
    return 75;
  }, [scale]);

  // Starts when the user selects resize from the menu, ends when resizing ends
  // used to control the visibility of the resizer Nubbin
  let [isInResizeMode, setIsInResizeMode] = useState(false);
  // Starts when the resizer is actually moved
  // entering resizing/exiting resizing doesn't trigger a render
  // with table layout, so we need to track it here
  let [, setIsResizing] = useState(false);

  let domRef = useDOMRef(ref);
  let headerRef = useRef<HTMLDivElement>();
  let bodyRef = useRef<HTMLDivElement>();
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/table');

  let density = props.density || 'regular';
  let columnLayout = useMemo(
    () => new TableColumnLayout({
      getDefaultWidth,
      getDefaultMinWidth
    }),
    [getDefaultWidth, getDefaultMinWidth]
  );
  let tableLayout = useMemo(() => new TableLayout({
    // If props.rowHeight is auto, then use estimated heights based on scale, otherwise use fixed heights.
    rowHeight: props.overflowMode === 'wrap'
      ? null
      : ROW_HEIGHTS[density][scale],
    estimatedRowHeight: props.overflowMode === 'wrap'
      ? ROW_HEIGHTS[density][scale]
      : null,
    headingHeight: props.overflowMode === 'wrap'
      ? null
      : DEFAULT_HEADER_HEIGHT[scale],
    estimatedHeadingHeight: props.overflowMode === 'wrap'
      ? DEFAULT_HEADER_HEIGHT[scale]
      : null,
    columnLayout,
    initialCollection: state.collection
  }),
    // don't recompute when state.collection changes, only used for initial value
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.overflowMode, scale, density, columnLayout]
  );

  // Use a proxy so that a new object is created for each render so that alternate instances aren't affected by mutation.
  // This can be thought of as equivalent to `{…tableLayout, tableState: state}`, but works with classes as well.
  let layout = useMemo(() => {
    let proxy = new Proxy(tableLayout, {
      get(target, prop, receiver) {
        return prop === 'tableState' ? state : Reflect.get(target, prop, receiver);
      }
    });
    return proxy as TableLayout<T> & {tableState: TableState<T> | TreeGridState<T>};
  }, [state, tableLayout]);

  let dragState: DraggableCollectionState;
  let preview = useRef(null);
  if (isTableDraggable) {
    dragState = dragAndDropHooks.useDraggableCollectionState({
      collection: state.collection,
      selectionManager: state.selectionManager,
      preview
    });
    dragAndDropHooks.useDraggableCollection({}, dragState, domRef);
  }

  let DragPreview = dragAndDropHooks?.DragPreview;
  let dropState: DroppableCollectionState;
  let droppableCollection: DroppableCollectionResult;
  let isRootDropTarget: boolean;
  if (isTableDroppable) {
    dropState = dragAndDropHooks.useDroppableCollectionState({
      collection: state.collection,
      selectionManager: state.selectionManager
    });
    droppableCollection = dragAndDropHooks.useDroppableCollection({
      keyboardDelegate: layout,
      dropTargetDelegate: layout
    }, dropState, domRef);

    isRootDropTarget = dropState.isDropTarget({type: 'root'});
  }

  let {gridProps} = useTable({
    ...props,
    isVirtualized: true,
    layout,
    onRowAction: onAction
  }, state, domRef);
  let [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  let [headerRowHovered, setHeaderRowHovered] = useState(false);

  // This overrides collection view's renderWrapper to support DOM hierarchy.
  type View = ReusableView<GridNode<T>, ReactNode>;
  let renderWrapper = (parent: View, reusableView: View, children: View[], renderChildren: (views: View[]) => ReactElement[]) => {
    let style = layoutInfoToStyle(reusableView.layoutInfo, direction, parent && parent.layoutInfo);
    if (style.overflow === 'hidden') {
      style.overflow = 'visible'; // needed to support position: sticky
    }

    if (reusableView.viewType === 'rowgroup') {
      return (
        <TableRowGroup key={reusableView.key} style={style}>
          {isTableDroppable &&
            <RootDropIndicator key="root" />
          }
          {renderChildren(children)}
        </TableRowGroup>
      );
    }

    if (reusableView.viewType === 'header') {
      return (
        <TableHeader
          key={reusableView.key}
          style={style}>
          {renderChildren(children)}
        </TableHeader>
      );
    }

    if (reusableView.viewType === 'row') {
      return (
        <TableRow
          key={reusableView.key}
          item={reusableView.content}
          style={style}
          hasActions={onAction}
          isTableDroppable={isTableDroppable}
          isTableDraggable={isTableDraggable}>
          {renderChildren(children)}
        </TableRow>
      );
    }

    if (reusableView.viewType === 'headerrow') {
      return (
        <TableHeaderRow
          onHoverChange={setHeaderRowHovered}
          key={reusableView.key}
          style={style}
          item={reusableView.content}>
          {renderChildren(children)}
        </TableHeaderRow>
      );
    }
    let isDropTarget: boolean;
    let isRootDroptarget: boolean;
    if (isTableDroppable) {
      if (parent.content) {
        isDropTarget =  dropState.isDropTarget({type: 'item', dropPosition: 'on', key: parent.content.key});
      }
      isRootDroptarget = dropState.isDropTarget({type: 'root'});
    }

    return (
      <VirtualizerItem
        key={reusableView.key}
        layoutInfo={reusableView.layoutInfo}
        virtualizer={reusableView.virtualizer}
        parent={parent?.layoutInfo}
        className={
          classNames(
            styles,
            'spectrum-Table-cellWrapper',
            classNames(
              stylesOverrides,
              {
                'react-spectrum-Table-cellWrapper': !reusableView.layoutInfo.estimatedSize,
                'react-spectrum-Table-cellWrapper--dropTarget': isDropTarget || isRootDroptarget
              }
            )
          )
        }>
        {reusableView.rendered}
      </VirtualizerItem>
    );
  };

  let renderView = (type: string, item: GridNode<T>) => {
    switch (type) {
      case 'header':
      case 'rowgroup':
      case 'section':
      case 'row':
      case 'headerrow':
        return null;
      case 'cell': {
        if (item.props.isSelectionCell) {
          return <TableCheckboxCell cell={item} />;
        }

        if (item.props.isDragButtonCell) {
          return <TableDragCell cell={item} />;
        }

        return <TableCell cell={item} />;
      }
      case 'placeholder':
        // TODO: move to react-aria?
        return (
          <div
            role="gridcell"
            aria-colindex={item.index + 1}
            aria-colspan={item.colspan > 1 ? item.colspan : null} />
        );
      case 'column':
        if (item.props.isSelectionCell) {
          return <TableSelectAllCell column={item} />;
        }

        if (item.props.isDragButtonCell) {
          return <TableDragHeaderCell column={item} />;
        }

        // TODO: consider this case, what if we have hidden headers and a empty table
        if (item.props.hideHeader) {
          return (
            <TooltipTrigger placement="top" trigger="focus">
              <TableColumnHeader column={item} />
              <Tooltip placement="top">{item.rendered}</Tooltip>
            </TooltipTrigger>
          );
        }

        if (item.props.allowsResizing && !item.hasChildNodes) {
          return <ResizableTableColumnHeader tableRef={domRef} column={item} />;
        }

        return (
          <TableColumnHeader column={item} />
        );
      case 'loader':
        return (
          <CenteredWrapper>
            <ProgressCircle
              isIndeterminate
              aria-label={state.collection.size > 0 ? stringFormatter.format('loadingMore') : stringFormatter.format('loading')} />
          </CenteredWrapper>
        );
      case 'empty': {
        let emptyState = props.renderEmptyState ? props.renderEmptyState() : null;
        if (emptyState == null) {
          return null;
        }

        return (
          <CenteredWrapper>
            {emptyState}
          </CenteredWrapper>
        );
      }
    }
  };

  let [isVerticalScrollbarVisible, setVerticalScollbarVisible] = useState(false);
  let [isHorizontalScrollbarVisible, setHorizontalScollbarVisible] = useState(false);
  let viewport = useRef({x: 0, y: 0, width: 0, height: 0});
  let onVisibleRectChange = useCallback((e) => {
    if (viewport.current.width === e.width && viewport.current.height === e.height) {
      return;
    }
    viewport.current = e;
    if (bodyRef.current) {
      setVerticalScollbarVisible(bodyRef.current.clientWidth + 2 < bodyRef.current.offsetWidth);
      setHorizontalScollbarVisible(bodyRef.current.clientHeight + 2 < bodyRef.current.offsetHeight);
    }
  }, []);
  let {isFocusVisible, focusProps} = useFocusRing();
  let isEmpty = state.collection.size === 0;

  let onFocusedResizer = () => {
    bodyRef.current.scrollLeft = headerRef.current.scrollLeft;
  };

  let onResizeStart = useCallback((widths) => {
    setIsResizing(true);
    propsOnResizeStart?.(widths);
  }, [setIsResizing, propsOnResizeStart]);
  let onResizeEnd = useCallback((widths) => {
    setIsInResizeMode(false);
    setIsResizing(false);
    propsOnResizeEnd?.(widths);
  }, [propsOnResizeEnd, setIsInResizeMode, setIsResizing]);

  let focusedKey = state.selectionManager.focusedKey;
  if (dropState?.target?.type === 'item') {
    focusedKey = dropState.target.key;
  }

  let mergedProps = mergeProps(
    isTableDroppable && droppableCollection?.collectionProps,
    gridProps,
    focusProps,
    dragAndDropHooks?.isVirtualDragging() && {tabIndex: null}
  );

  return (
    <TableContext.Provider value={{state, dragState, dropState, dragAndDropHooks, isTableDraggable, isTableDroppable, layout, onResizeStart, onResize: props.onResize, onResizeEnd, headerRowHovered, isInResizeMode, setIsInResizeMode, isEmpty, onFocusedResizer, headerMenuOpen, setHeaderMenuOpen}}>
      <TableVirtualizer
        {...mergedProps}
        {...styleProps}
        className={
          classNames(
            styles,
            'spectrum-Table',
            `spectrum-Table--${density}`,
            {
              'spectrum-Table--quiet': isQuiet,
              'spectrum-Table--wrap': props.overflowMode === 'wrap',
              'spectrum-Table--loadingMore': state.collection.body.props.loadingState === 'loadingMore',
              'spectrum-Table--isVerticalScrollbarVisible': isVerticalScrollbarVisible,
              'spectrum-Table--isHorizontalScrollbarVisible': isHorizontalScrollbarVisible
            },
            classNames(
              stylesOverrides,
              'react-spectrum-Table'
            ),
            styleProps.className
          )
        }
        layout={layout}
        collection={state.collection}
        focusedKey={focusedKey}
        renderView={renderView}
        renderWrapper={renderWrapper}
        onVisibleRectChange={onVisibleRectChange}
        domRef={domRef}
        headerRef={headerRef}
        bodyRef={bodyRef}
        isFocusVisible={isFocusVisible}
        isVirtualDragging={dragAndDropHooks?.isVirtualDragging()}
        isRootDropTarget={isRootDropTarget} />
      {DragPreview && isTableDraggable &&
        <DragPreview ref={preview}>
          {() => {
            if (dragAndDropHooks.renderPreview) {
              return dragAndDropHooks.renderPreview(dragState.draggingKeys, dragState.draggedKey);
            }
            let itemCount = dragState.draggingKeys.size;
            let maxWidth = bodyRef.current.getBoundingClientRect().width;
            let height = ROW_HEIGHTS[density][scale];
            let itemText = state.collection.getTextValue(dragState.draggedKey);
            return <SpectrumDragPreview itemText={itemText} itemCount={itemCount} height={height} maxWidth={maxWidth} />;
          }}
        </DragPreview>
      }
    </TableContext.Provider>
  );
}

// This is a custom Virtualizer that also has a header that syncs its scroll position with the body.
function TableVirtualizer(props) {
  let {layout, collection, focusedKey, renderView, renderWrapper, domRef, bodyRef, headerRef, onVisibleRectChange: onVisibleRectChangeProp, isFocusVisible, isVirtualDragging, isRootDropTarget, ...otherProps} = props;
  let {direction} = useLocale();
  let loadingState = collection.body.props.loadingState;
  let isLoading = loadingState === 'loading' || loadingState === 'loadingMore';
  let onLoadMore = collection.body.props.onLoadMore;
  let transitionDuration = 220;
  if (isLoading) {
    transitionDuration = 160;
  }
  if (layout.resizingColumn != null) {
    // while resizing, prop changes should not cause animations
    transitionDuration = 0;
  }
  let state = useVirtualizerState<object, ReactNode, ReactNode>({
    layout,
    collection,
    renderView,
    renderWrapper,
    onVisibleRectChange(rect) {
      bodyRef.current.scrollTop = rect.y;
      setScrollLeft(bodyRef.current, direction, rect.x);
    },
    transitionDuration
  });

  let scrollToItem = useCallback((key) => {
    let item = collection.getItem(key);
    let column = collection.columns[0];
    let virtualizer = state.virtualizer;

    virtualizer.scrollToItem(key, {
      duration: 0,
      // Prevent scrolling to the top when clicking on column headers.
      shouldScrollY: item?.type !== 'column',
      // Offset scroll position by width of selection cell
      // (which is sticky and will overlap the cell we're scrolling to).
      offsetX: column.props.isSelectionCell || column.props.isDragButtonCell
        ? layout.getColumnWidth(column.key)
        : 0
    });

    // Sync the scroll positions of the column headers and the body so scrollIntoViewport can
    // properly decide if the column is outside the viewport or not
    headerRef.current.scrollLeft = bodyRef.current.scrollLeft;
  }, [collection, bodyRef, headerRef, layout, state.virtualizer]);

  let memoedVirtualizerProps = useMemo(() => ({
    tabIndex: otherProps.tabIndex,
    focusedKey,
    scrollToItem,
    isLoading,
    onLoadMore
  }), [otherProps.tabIndex, focusedKey, scrollToItem, isLoading, onLoadMore]);

  let {virtualizerProps, scrollViewProps: {onVisibleRectChange}} = useVirtualizer(memoedVirtualizerProps, state, domRef);

  // this effect runs whenever the contentSize changes, it doesn't matter what the content size is
  // only that it changes in a resize, and when that happens, we want to sync the body to the
  // header scroll position
  useEffect(() => {
    if (getInteractionModality() === 'keyboard' && headerRef.current.contains(document.activeElement)) {
      scrollIntoView(headerRef.current, document.activeElement as HTMLElement);
      scrollIntoViewport(document.activeElement, {containingElement: domRef.current});
      bodyRef.current.scrollLeft = headerRef.current.scrollLeft;
    }
  }, [state.contentSize, headerRef, bodyRef, domRef]);

  let headerHeight = layout.getLayoutInfo('header')?.rect.height || 0;

  // Sync the scroll position from the table body to the header container.
  let onScroll = useCallback(() => {
    headerRef.current.scrollLeft = bodyRef.current.scrollLeft;
  }, [bodyRef, headerRef]);

  let resizerPosition = layout.getResizerPosition() - 2;

  let resizerAtEdge = resizerPosition > Math.max(state.virtualizer.contentSize.width, state.virtualizer.visibleRect.width) - 3;
  // this should be fine, every movement of the resizer causes a rerender
  // scrolling can cause it to lag for a moment, but it's always updated
  let resizerInVisibleRegion = resizerPosition < state.virtualizer.visibleRect.maxX;
  let shouldHardCornerResizeCorner = resizerAtEdge && resizerInVisibleRegion;

  // minimize re-render caused on Resizers by memoing this
  let resizingColumnWidth = layout.getColumnWidth(layout.resizingColumn);
  let resizingColumn = useMemo(() => ({
    width: resizingColumnWidth,
    key: layout.resizingColumn
  }), [resizingColumnWidth, layout.resizingColumn]);
  let mergedProps = mergeProps(
    otherProps,
    virtualizerProps,
    isVirtualDragging && {tabIndex: null}
  );

  return (
    <VirtualizerContext.Provider value={resizingColumn}>
      <FocusScope>
        <div
          {...mergedProps}
          ref={domRef}>
          <div
            role="presentation"
            className={classNames(styles, 'spectrum-Table-headWrapper')}
            style={{
              height: headerHeight,
              overflow: 'hidden',
              position: 'relative',
              willChange: state.isScrolling ? 'scroll-position' : undefined,
              transition: state.isAnimating ? `none ${state.virtualizer.transitionDuration}ms` : undefined
            }}
            ref={headerRef}>
            {state.visibleViews[0]}
          </div>
          <ScrollView
            role="presentation"
            className={
              classNames(
                styles,
                'spectrum-Table-body',
                {
                  'focus-ring': isFocusVisible,
                  'spectrum-Table-body--resizerAtTableEdge': shouldHardCornerResizeCorner
                },
                classNames(
                  stylesOverrides,
                  'react-spectrum-Table-body',
                  {
                    'react-spectrum-Table-body--dropTarget': !!isRootDropTarget
                  }
                )
              )
            }
            tabIndex={isVirtualDragging ? null : -1}
            style={{flex: 1}}
            innerStyle={{overflow: 'visible', transition: state.isAnimating ? `none ${state.virtualizer.transitionDuration}ms` : undefined}}
            ref={bodyRef}
            contentSize={state.contentSize}
            onVisibleRectChange={chain(onVisibleRectChange, onVisibleRectChangeProp)}
            onScrollStart={state.startScrolling}
            onScrollEnd={state.endScrolling}
            onScroll={onScroll}>
            {state.visibleViews[1]}
            <div
              className={classNames(styles, 'spectrum-Table-bodyResizeIndicator')}
              style={{[direction === 'ltr' ? 'left' : 'right']: `${resizerPosition}px`, height: `${Math.max(state.virtualizer.contentSize.height, state.virtualizer.visibleRect.height)}px`, display: layout.resizingColumn ? 'block' : 'none'}} />
          </ScrollView>
        </div>
      </FocusScope>
    </VirtualizerContext.Provider>
  );
}

function TableHeader({children, ...otherProps}) {
  let {rowGroupProps} = useTableRowGroup();

  return (
    <div {...rowGroupProps} {...otherProps} className={classNames(styles, 'spectrum-Table-head')}>
      {children}
    </div>
  );
}

function TableColumnHeader(props) {
  let {column} = props;
  let ref = useRef<HTMLDivElement>(null);
  let {state, isEmpty} = useTableContext();
  let {pressProps, isPressed} = usePress({isDisabled: isEmpty});
  let columnProps = column.props as SpectrumColumnProps<unknown>;
  useEffect(() => {
    if (column.hasChildNodes && columnProps.allowsResizing) {
      console.warn(`Column key: ${column.key}. Columns with child columns don't allow resizing.`);
    }
  }, [column.hasChildNodes, column.key, columnProps.allowsResizing]);

  let {columnHeaderProps} = useTableColumnHeader({
    node: column,
    isVirtualized: true
  }, state, ref);

  let {hoverProps, isHovered} = useHover({...props, isDisabled: isEmpty});

  const allProps = [columnHeaderProps, hoverProps, pressProps];

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...mergeProps(...allProps)}
        ref={ref}
        className={
          classNames(
            styles,
            'spectrum-Table-headCell',
            {
              'is-active': isPressed,
              'is-sortable': columnProps.allowsSorting,
              'is-sorted-desc': state.sortDescriptor?.column === column.key && state.sortDescriptor?.direction === 'descending',
              'is-sorted-asc': state.sortDescriptor?.column === column.key && state.sortDescriptor?.direction === 'ascending',
              'is-hovered': isHovered,
              'spectrum-Table-cell--hideHeader': columnProps.hideHeader
            },
            classNames(
              stylesOverrides,
              'react-spectrum-Table-cell',
              {
                'react-spectrum-Table-cell--alignCenter': columnProps.align === 'center' || column.colspan > 1,
                'react-spectrum-Table-cell--alignEnd': columnProps.align === 'end'
              }
            )
          )
        }>
        {columnProps.allowsSorting &&
          <ArrowDownSmall UNSAFE_className={classNames(styles, 'spectrum-Table-sortedIcon')} />
        }
        {columnProps.hideHeader ?
          <VisuallyHidden>{column.rendered}</VisuallyHidden> :
          <div className={classNames(styles, 'spectrum-Table-headCellContents')}>{column.rendered}</div>
        }
      </div>
    </FocusRing>
  );
}

let _TableColumnHeaderButton = (props, ref: FocusableRef<HTMLDivElement>) => {
  let {focusProps, alignment, ...otherProps} = props;
  let {isEmpty} = useTableContext();
  let domRef = useFocusableRef(ref);
  let {buttonProps} = useButton({...otherProps, elementType: 'div', isDisabled: isEmpty}, domRef);
  let {hoverProps, isHovered} = useHover({...otherProps, isDisabled: isEmpty});

  return (
    <div
      className={
        classNames(
          styles,
          'spectrum-Table-headCellContents',
          {
            'is-hovered': isHovered
          }
        )
      }
      {...hoverProps}>
      <div
        className={
          classNames(
            styles,
            'spectrum-Table-headCellButton',
            {
              'spectrum-Table-headCellButton--alignStart': alignment === 'start',
              'spectrum-Table-headCellButton--alignCenter': alignment === 'center',
              'spectrum-Table-headCellButton--alignEnd': alignment === 'end'
            }
          )
        }
        {...mergeProps(buttonProps, focusProps)}
        ref={domRef}>
        {props.children}
      </div>
    </div>
  );
};
let TableColumnHeaderButton = React.forwardRef(_TableColumnHeaderButton);

function ResizableTableColumnHeader(props) {
  let {column} = props;
  let ref = useRef(null);
  let triggerRef = useRef(null);
  let resizingRef = useRef(null);
  let {
    state,
    layout,
    onResizeStart,
    onResize,
    onResizeEnd,
    headerRowHovered,
    setIsInResizeMode,
    isEmpty,
    isInResizeMode,
    headerMenuOpen,
    setHeaderMenuOpen
  } = useTableContext();
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/table');
  let {pressProps, isPressed} = usePress({isDisabled: isEmpty});
  let {columnHeaderProps} = useTableColumnHeader({
    node: column,
    isVirtualized: true
  }, state, ref);

  let {hoverProps, isHovered} = useHover({...props, isDisabled: isEmpty || headerMenuOpen});

  const allProps = [columnHeaderProps, pressProps, hoverProps];

  let columnProps = column.props as SpectrumColumnProps<unknown>;

  let {isFocusVisible, focusProps} = useFocusRing();

  const onMenuSelect = (key) => {
    switch (key) {
      case 'sort-asc':
        state.sort(column.key, 'ascending');
        break;
      case 'sort-desc':
        state.sort(column.key, 'descending');
        break;
      case 'resize':
        layout.startResize(column.key);
        setIsInResizeMode(true);
        state.setKeyboardNavigationDisabled(true);
        break;
    }
  };
  let allowsSorting = column.props?.allowsSorting;
  let items = useMemo(() => {
    let options = [
      allowsSorting ? {
        label: stringFormatter.format('sortAscending'),
        id: 'sort-asc'
      } : undefined,
      allowsSorting ? {
        label: stringFormatter.format('sortDescending'),
        id: 'sort-desc'
      } : undefined,
      {
        label: stringFormatter.format('resizeColumn'),
        id: 'resize'
      }
    ];
    return options;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowsSorting]);

  let resizingColumn = layout.resizingColumn;
  let showResizer = !isEmpty && ((headerRowHovered && getInteractionModality() !== 'keyboard') || resizingColumn != null);
  let alignment = 'start';
  let menuAlign = 'start' as 'start' | 'end';
  if (columnProps.align === 'center' || column.colspan > 1) {
    alignment = 'center';
  } else if (columnProps.align === 'end') {
    alignment = 'end';
    menuAlign = 'end';
  }

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...mergeProps(...allProps)}
        ref={ref}
        className={
          classNames(
            styles,
            'spectrum-Table-headCell',
            {
              'is-active': isPressed,
              'is-resizable': columnProps.allowsResizing,
              'is-sortable': columnProps.allowsSorting,
              'is-sorted-desc': state.sortDescriptor?.column === column.key && state.sortDescriptor?.direction === 'descending',
              'is-sorted-asc': state.sortDescriptor?.column === column.key && state.sortDescriptor?.direction === 'ascending',
              'is-hovered': isHovered,
              'focus-ring': isFocusVisible,
              'spectrum-Table-cell--hideHeader': columnProps.hideHeader
            },
            classNames(
              stylesOverrides,
              'react-spectrum-Table-cell',
              {
                'react-spectrum-Table-cell--alignCenter': alignment === 'center',
                'react-spectrum-Table-cell--alignEnd': alignment === 'end'
              }
            )
          )
        }>
        <MenuTrigger onOpenChange={setHeaderMenuOpen} align={menuAlign}>
          <TableColumnHeaderButton alignment={alignment} ref={triggerRef} focusProps={focusProps}>
            {columnProps.allowsSorting &&
              <ArrowDownSmall UNSAFE_className={classNames(styles, 'spectrum-Table-sortedIcon')} />
            }
            {columnProps.hideHeader ?
              <VisuallyHidden>{column.rendered}</VisuallyHidden> :
              <div className={classNames(styles, 'spectrum-Table-headerCellText')}>{column.rendered}</div>
            }
            {
              columnProps.allowsResizing && <ChevronDownMedium UNSAFE_className={classNames(styles, 'spectrum-Table-menuChevron')} />
            }
          </TableColumnHeaderButton>
          <Menu onAction={onMenuSelect} minWidth="size-2000" items={items}>
            {(item) => (
              <Item>
                {item.label}
              </Item>
            )}
          </Menu>
        </MenuTrigger>
        <Resizer
          ref={resizingRef}
          column={column}
          showResizer={showResizer}
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
          triggerRef={useUnwrapDOMRef(triggerRef)} />
        <div
          aria-hidden
          className={classNames(
            styles,
            'spectrum-Table-colResizeIndicator',
            {
              'spectrum-Table-colResizeIndicator--visible': resizingColumn != null,
              'spectrum-Table-colResizeIndicator--resizing': resizingColumn === column.key
            }
          )}>
          <div
            className={classNames(
              styles,
              'spectrum-Table-colResizeNubbin',
              {
                'spectrum-Table-colResizeNubbin--visible': isInResizeMode && resizingColumn === column.key
              }
            )}>
            <Nubbin />
          </div>
        </div>
      </div>
    </FocusRing>
  );
}

function TableSelectAllCell({column}) {
  let ref = useRef();
  let {state} = useTableContext();
  let isSingleSelectionMode = state.selectionManager.selectionMode === 'single';
  let {columnHeaderProps} = useTableColumnHeader({
    node: column,
    isVirtualized: true
  }, state, ref);

  let {checkboxProps} = useTableSelectAllCheckbox(state);
  let {hoverProps, isHovered} = useHover({});

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...mergeProps(columnHeaderProps, hoverProps)}
        ref={ref}
        className={
          classNames(
            styles,
            'spectrum-Table-headCell',
            'spectrum-Table-checkboxCell',
            {
              'is-hovered': isHovered
            }
          )
        }>
        {
          /*
            In single selection mode, the checkbox will be hidden.
            So to avoid leaving a column header with no accessible content,
            we use a VisuallyHidden component to include the aria-label from the checkbox,
            which for single selection will be "Select."
          */
          isSingleSelectionMode &&
          <VisuallyHidden>{checkboxProps['aria-label']}</VisuallyHidden>
        }
        <Checkbox
          {...checkboxProps}
          isEmphasized
          UNSAFE_style={isSingleSelectionMode ? {visibility: 'hidden'} : undefined}
          UNSAFE_className={classNames(styles, 'spectrum-Table-checkbox')} />
      </div>
    </FocusRing>
  );
}

function TableDragHeaderCell({column}) {
  let ref = useRef();
  let {state} = useTableContext();
  let {columnHeaderProps} = useTableColumnHeader({
    node: column,
    isVirtualized: true
  }, state, ref);
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/table');

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...columnHeaderProps}
        ref={ref}
        className={
          classNames(
            styles,
            'spectrum-Table-headCell',
            classNames(
              stylesOverrides,
              'react-spectrum-Table-headCell',
              'react-spectrum-Table-dragButtonHeadCell'
            )
          )
        }>
        <VisuallyHidden>{stringFormatter.format('drag')}</VisuallyHidden>
      </div>
    </FocusRing>
  );
}

function TableRowGroup({children, ...otherProps}) {
  let {rowGroupProps} = useTableRowGroup();

  return (
    <div {...rowGroupProps} {...otherProps}>
      {children}
    </div>
  );
}

function DragButton() {
  let {dragButtonProps, dragButtonRef, isFocusVisibleWithin} = useTableRowContext();
  let {visuallyHiddenProps} = useVisuallyHidden();
  return (
    <FocusRing focusRingClass={classNames(stylesOverrides, 'focus-ring')}>
      <div
        {...dragButtonProps as React.HTMLAttributes<HTMLElement>}
        className={
          classNames(
            stylesOverrides,
            'react-spectrum-Table-dragButton'
          )
        }
        style={!isFocusVisibleWithin ? {...visuallyHiddenProps.style} : {}}
        ref={dragButtonRef}
        draggable="true">
        <ListGripper UNSAFE_className={classNames(stylesOverrides)} />
      </div>
    </FocusRing>
  );
}

interface TableRowContextValue {
  dragButtonProps: React.HTMLAttributes<HTMLDivElement>,
  dragButtonRef: React.MutableRefObject<undefined>,
  isFocusVisibleWithin: boolean
}


const TableRowContext = React.createContext<TableRowContextValue>(null);
export function useTableRowContext() {
  return useContext(TableRowContext);
}

function TableRow({item, children, hasActions, isTableDraggable, isTableDroppable, ...otherProps}) {
  let ref = useRef();
  let {state, layout, dragAndDropHooks, dragState, dropState} = useTableContext();
  let allowsInteraction = state.selectionManager.selectionMode !== 'none' || hasActions;
  let isDisabled = !allowsInteraction || state.disabledKeys.has(item.key);
  let isDroppable = isTableDroppable && !isDisabled;
  let isSelected = state.selectionManager.isSelected(item.key);
  let {rowProps} = useTableRow({
    node: item,
    isVirtualized: true,
    shouldSelectOnPressUp: isTableDraggable
  }, state, ref);

  let {pressProps, isPressed} = usePress({isDisabled});

  // The row should show the focus background style when any cell inside it is focused.
  // If the row itself is focused, then it should have a blue focus indicator on the left.
  let {
    isFocusVisible: isFocusVisibleWithin,
    focusProps: focusWithinProps
  } = useFocusRing({within: true});
  let {isFocusVisible, focusProps} = useFocusRing();
  let {hoverProps, isHovered} = useHover({isDisabled});
  let isFirstRow = state.collection.rows.find(row => row.level === 1)?.key === item.key;
  let isLastRow = item.nextKey == null;
  // Figure out if the TableView content is equal or greater in height to the container. If so, we'll need to round the bottom
  // border corners of the last row when selected.
  let isFlushWithContainerBottom = false;
  if (isLastRow) {
    if (layout.getContentSize()?.height >= layout.virtualizer?.getVisibleRect().height) {
      isFlushWithContainerBottom = true;
    }
  }

  let draggableItem: DraggableItemResult;
  if (isTableDraggable) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    draggableItem = dragAndDropHooks.useDraggableItem({key: item.key, hasDragButton: true}, dragState);
    if (isDisabled) {
      draggableItem = null;
    }
  }
  let droppableItem: DroppableItemResult;
  let isDropTarget: boolean;
  let dropIndicator: DropIndicatorAria;
  let dropIndicatorRef = useRef();
  if (isTableDroppable) {
    let target = {type: 'item', key: item.key, dropPosition: 'on'} as DropTarget;
    isDropTarget = dropState.isDropTarget(target);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    dropIndicator = dragAndDropHooks.useDropIndicator({target}, dropState, dropIndicatorRef);
  }

  let dragButtonRef = React.useRef();
  let {buttonProps: dragButtonProps} = useButton({
    ...draggableItem?.dragButtonProps,
    elementType: 'div'
  }, dragButtonRef);

  let props = mergeProps(
    rowProps,
    otherProps,
    focusWithinProps,
    focusProps,
    hoverProps,
    pressProps,
    draggableItem?.dragProps,
    // Remove tab index from list row if performing a screenreader drag. This prevents TalkBack from focusing the row,
    // allowing for single swipe navigation between row drop indicator
    dragAndDropHooks?.isVirtualDragging() && {tabIndex: null}
  ) as HTMLAttributes<HTMLElement> & DOMAttributes<FocusableElement>;

  let dropProps = isDroppable ? droppableItem?.dropProps : {'aria-hidden': droppableItem?.dropProps['aria-hidden']};
  let {visuallyHiddenProps} = useVisuallyHidden();

  return (
    <TableRowContext.Provider value={{dragButtonProps, dragButtonRef, isFocusVisibleWithin}}>
      {isTableDroppable && isFirstRow &&
        <InsertionIndicator
          rowProps={props}
          key={`${item.key}-before`}
          target={{key: item.key, type: 'item', dropPosition: 'before'}} />
      }
      {isTableDroppable && !dropIndicator?.isHidden &&
        <div role="row" {...visuallyHiddenProps}>
          <div role="gridcell">
            <div role="button" {...dropIndicator?.dropIndicatorProps} ref={dropIndicatorRef} />
          </div>
        </div>
      }
      <div
        {...mergeProps(props, dropProps)}
        ref={ref}
        className={
          classNames(
            styles,
            'spectrum-Table-row',
            {
              'is-active': isPressed,
              'is-selected': isSelected,
              'spectrum-Table-row--highlightSelection': state.selectionManager.selectionBehavior === 'replace',
              'is-next-selected': state.selectionManager.isSelected(item.nextKey),
              'is-focused': isFocusVisibleWithin,
              'focus-ring': isFocusVisible,
              'is-hovered': isHovered,
              'is-disabled': isDisabled,
              'spectrum-Table-row--firstRow': isFirstRow,
              'spectrum-Table-row--lastRow': isLastRow,
              'spectrum-Table-row--isFlushBottom': isFlushWithContainerBottom
            },
            classNames(
              stylesOverrides,
              'react-spectrum-Table-row',
              {'react-spectrum-Table-row--dropTarget': isDropTarget}
            )
          )
        }>
        {children}
      </div>
      {isTableDroppable &&
        <InsertionIndicator
          rowProps={props}
          key={`${item.key}-after`}
          target={{key: item.key, type: 'item', dropPosition: 'after'}} />
      }
    </TableRowContext.Provider>
  );
}

function TableHeaderRow({item, children, style, ...props}) {
  let {state, headerMenuOpen} = useTableContext();
  let ref = useRef();
  let {rowProps} = useTableHeaderRow({node: item, isVirtualized: true}, state, ref);
  let {hoverProps} = useHover({...props, isDisabled: headerMenuOpen});

  return (
    <div {...mergeProps(rowProps, hoverProps)} ref={ref} style={style}>
      {children}
    </div>
  );
}

function TableDragCell({cell}) {
  let ref = useRef();
  let {state, isTableDraggable} = useTableContext();
  let isDisabled = state.disabledKeys.has(cell.parentKey);
  let {gridCellProps} = useTableCell({
    node: cell,
    isVirtualized: true
  }, state, ref);


  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...gridCellProps}
        ref={ref}
        className={
          classNames(
            styles,
            'spectrum-Table-cell',
            {
              'is-disabled': isDisabled
            },
            classNames(
              stylesOverrides,
              'react-spectrum-Table-cell',
              'react-spectrum-Table-dragButtonCell'
            )
          )
        }>
        {isTableDraggable && !isDisabled && <DragButton />}
      </div>
    </FocusRing>
  );
}

function TableCheckboxCell({cell}) {
  let ref = useRef();
  let {state} = useTableContext();
  let isDisabled = state.disabledKeys.has(cell.parentKey);
  let {gridCellProps} = useTableCell({
    node: cell,
    isVirtualized: true
  }, state, ref);

  let {checkboxProps} = useTableSelectionCheckbox({key: cell.parentKey}, state);

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...gridCellProps}
        ref={ref}
        className={
          classNames(
            styles,
            'spectrum-Table-cell',
            'spectrum-Table-checkboxCell',
            {
              'is-disabled': isDisabled
            },
            classNames(
              stylesOverrides,
              'react-spectrum-Table-cell'
            )
          )
        }>
        {state.selectionManager.selectionMode !== 'none' &&
          <Checkbox
            {...checkboxProps}
            isEmphasized
            isDisabled={isDisabled}
            UNSAFE_className={classNames(styles, 'spectrum-Table-checkbox')} />
        }
      </div>
    </FocusRing>
  );
}

function TableCell({cell}) {
  let {scale} = useProvider();
  let {state} = useTableContext();
  let isExpandableTable = 'expandedKeys' in state;
  let ref = useRef();
  let columnProps = cell.column.props as SpectrumColumnProps<unknown>;
  let isDisabled = state.disabledKeys.has(cell.parentKey);
  let {gridCellProps} = useTableCell({
    node: cell,
    isVirtualized: true
  }, state, ref);
  let {id, ...otherGridCellProps} = gridCellProps;
  let isFirstRowHeaderCell = state.collection.rowHeaderColumnKeys.keys().next().value === cell.column.key;
  let isRowExpandable = false;
  let showExpandCollapseButton = false;
  let levelOffset = 0;

  if ('expandedKeys' in state) {
    isRowExpandable = state.keyMap.get(cell.parentKey)?.props.UNSTABLE_childItems?.length > 0 || state.keyMap.get(cell.parentKey)?.props?.children?.length > state.userColumnCount;
    showExpandCollapseButton = isFirstRowHeaderCell && isRowExpandable;
    // Offset based on level, and add additional offset if there is no expand/collapse button on a row
    levelOffset = (cell.level - 2) * LEVEL_OFFSET_WIDTH[scale] + (!showExpandCollapseButton ? LEVEL_OFFSET_WIDTH[scale] * 2 : 0);
  }

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...otherGridCellProps}
        aria-labelledby={id}
        ref={ref}
        style={isExpandableTable && isFirstRowHeaderCell ? {paddingInlineStart: levelOffset} : {}}
        className={
          classNames(
            styles,
            'spectrum-Table-cell',
            {
              'spectrum-Table-cell--divider': columnProps.showDivider && cell.column.nextKey !== null,
              'spectrum-Table-cell--hideHeader': columnProps.hideHeader,
              'spectrum-Table-cell--hasExpandCollapseButton': showExpandCollapseButton,
              'is-disabled': isDisabled
            },
            classNames(
              stylesOverrides,
              'react-spectrum-Table-cell',
              {
                'react-spectrum-Table-cell--alignStart': columnProps.align === 'start',
                'react-spectrum-Table-cell--alignCenter': columnProps.align === 'center',
                'react-spectrum-Table-cell--alignEnd': columnProps.align === 'end'
              }
            )
          )
        }>
        {showExpandCollapseButton && <ExpandableRowChevron cell={cell} />}
        <span
          id={id}
          className={
            classNames(
              styles,
              'spectrum-Table-cellContents'
            )
        }>
          {cell.rendered}
        </span>
      </div>
    </FocusRing>
  );
}

function ExpandableRowChevron({cell}) {
   // TODO: move some/all of the chevron button setup into a separate hook?
  let {direction} = useLocale();
  let {state} = useTableContext();
  let expandButtonRef = useRef();
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/table');
  let isExpanded;

  if ('expandedKeys' in state) {
    isExpanded = state.expandedKeys === 'all' || state.expandedKeys.has(cell.parentKey);
  }

  // Will need to keep the chevron as a button for iOS VO at all times since VO doesn't focus the cell. Also keep as button if cellAction is defined by the user in the future
  let {buttonProps} = useButton({
    // Desktop and mobile both toggle expansion of a native expandable row on mouse/touch up
    onPress: () => {
      (state as TreeGridState<unknown>).toggleKey(cell.parentKey);
      if (!isFocusVisible()) {
        state.selectionManager.setFocused(true);
        state.selectionManager.setFocusedKey(cell.parentKey);
      }
    },
    elementType: 'span',
    'aria-label': isExpanded ? stringFormatter.format('collapse') : stringFormatter.format('expand')
  }, expandButtonRef);

  return (
    <span
      {...buttonProps}
      ref={expandButtonRef}
      // Override tabindex so that grid keyboard nav skips over it. Needs -1 so android talkback can actually "focus" it
      tabIndex={isAndroid() ? -1 : undefined}
      className={
        classNames(
          styles,
          'spectrum-Table-expandButton',
          {
            'is-open': isExpanded
          }
        )
      }>
      {direction === 'ltr' ? <ChevronRightMedium /> : <ChevronLeftMedium />}
    </span>
  );
}

function CenteredWrapper({children}) {
  let {state} = useTableContext();
  let rowProps;

  if ('expandedKeys' in state) {
    let topLevelRowCount = [...state.keyMap.get(state.collection.body.key).childNodes].length;
    rowProps = {
      'aria-level': 1,
      'aria-posinset': topLevelRowCount + 1,
      'aria-setsize': topLevelRowCount + 1
    };
  } else {
    rowProps = {
      'aria-rowindex': state.collection.headerRows.length + state.collection.size + 1
    };
  }

  return (
    <div
      role="row"
      {...rowProps}
      className={classNames(stylesOverrides, 'react-spectrum-Table-centeredWrapper')}>
      <div role="rowheader" aria-colspan={state.collection.columns.length}>
        {children}
      </div>
    </div>
  );
}

const _TableViewBase = React.forwardRef(TableViewBase) as <T>(props: TableBaseProps<T> & {ref?: DOMRef<HTMLDivElement>}) => ReactElement;

export {_TableViewBase as TableViewBase};
