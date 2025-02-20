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
import {ColumnSize, SpectrumColumnProps, TableCollection} from '@react-types/table';
import {DOMRef, DropTarget, FocusableElement, FocusableRef, Key, RefObject} from '@react-types/shared';
import type {DragAndDropHooks} from '@react-spectrum/dnd';
import type {DraggableCollectionState, DroppableCollectionState} from '@react-stately/dnd';
import type {DraggableItemResult, DropIndicatorAria, DroppableCollectionResult} from '@react-aria/dnd';
import {FocusRing, FocusScope, useFocusRing} from '@react-aria/focus';
import {getInteractionModality, HoverProps, isFocusVisible, useHover, usePress} from '@react-aria/interactions';
import {GridNode} from '@react-types/grid';
import {InsertionIndicator} from './InsertionIndicator';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {isAndroid, mergeProps, scrollIntoView, scrollIntoViewport, useLoadMore} from '@react-aria/utils';
import {Item, Menu, MenuTrigger} from '@react-spectrum/menu';
import {LayoutInfo, Rect, ReusableView, useVirtualizerState} from '@react-stately/virtualizer';
import {layoutInfoToStyle, ScrollView, setScrollLeft, VirtualizerItem} from '@react-aria/virtualizer';
import ListGripper from '@spectrum-icons/ui/ListGripper';
import {ListKeyboardDelegate} from '@react-aria/selection';
import {Nubbin} from './Nubbin';
import {ProgressCircle} from '@react-spectrum/progress';
import React, {DOMAttributes, HTMLAttributes, ReactElement, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Resizer, ResizeStateContext} from './Resizer';
import {RootDropIndicator} from './RootDropIndicator';
import {DragPreview as SpectrumDragPreview} from './DragPreview';
import {SpectrumTableProps} from './TableViewWrapper';
import styles from '@adobe/spectrum-css-temp/components/table/vars.css';
import stylesOverrides from './table.css';
import {TableState, TreeGridState, useTableColumnResizeState} from '@react-stately/table';
import {TableViewLayout} from './TableViewLayout';
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
  dragState: DraggableCollectionState | null,
  dropState: DroppableCollectionState | null,
  dragAndDropHooks?: DragAndDropHooks['dragAndDropHooks'],
  isTableDraggable: boolean,
  isTableDroppable: boolean,
  layout: TableViewLayout<T>,
  headerRowHovered: boolean,
  isInResizeMode: boolean,
  setIsInResizeMode: (val: boolean) => void,
  isEmpty: boolean,
  onFocusedResizer: () => void,
  onResizeStart?: (widths: Map<Key, ColumnSize>) => void,
  onResize?: (widths: Map<Key, ColumnSize>) => void,
  onResizeEnd?: (widths: Map<Key, ColumnSize>) => void,
  headerMenuOpen: boolean,
  setHeaderMenuOpen: (val: boolean) => void,
  renderEmptyState?: () => ReactElement
}

export const TableContext = React.createContext<TableContextValue<unknown> | null>(null);
export function useTableContext(): TableContextValue<unknown> {
  return useContext(TableContext)!;
}

export const VirtualizerContext = React.createContext<{width: number, key: Key | null} | null>(null);
export function useVirtualizerContext(): {
  width: number,
  key: Key | null
} | null {
  return useContext(VirtualizerContext);
}

interface TableBaseProps<T> extends SpectrumTableProps<T> {
  state: TableState<T> | TreeGridState<T>
}

type View = ReusableView<GridNode<unknown>, ReactNode>;

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
    if (dragHooksProvided.current !== isTableDraggable) {
      console.warn('Drag hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
    }
    if (dropHooksProvided.current !== isTableDroppable) {
      console.warn('Drop hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
    }
    if ('expandedKeys' in state && (isTableDraggable || isTableDroppable)) {
      console.warn('Drag and drop is not yet fully supported with expandable rows and may produce unexpected results.');
    }
  }, [isTableDraggable, isTableDroppable, state]);

  let {styleProps} = useStyleProps(props);
  let {scale} = useProvider();

  // Starts when the user selects resize from the menu, ends when resizing ends
  // used to control the visibility of the resizer Nubbin
  let [isInResizeMode, setIsInResizeMode] = useState(false);
  // Starts when the resizer is actually moved
  // entering resizing/exiting resizing doesn't trigger a render
  // with table layout, so we need to track it here
  let [, setIsResizing] = useState(false);

  let domRef = useDOMRef(ref);
  let headerRef = useRef<HTMLDivElement | null>(null);
  let bodyRef = useRef<HTMLDivElement | null>(null);

  let density = props.density || 'regular';
  let layout = useMemo(() => new TableViewLayout<T>({
    // If props.rowHeight is auto, then use estimated heights based on scale, otherwise use fixed heights.
    rowHeight: props.overflowMode === 'wrap'
      ? undefined
      : ROW_HEIGHTS[density][scale],
    estimatedRowHeight: props.overflowMode === 'wrap'
      ? ROW_HEIGHTS[density][scale]
      : undefined,
    headingHeight: props.overflowMode === 'wrap'
      ? undefined
      : DEFAULT_HEADER_HEIGHT[scale],
    estimatedHeadingHeight: props.overflowMode === 'wrap'
      ? DEFAULT_HEADER_HEIGHT[scale]
      : undefined
  }),
    // don't recompute when state.collection changes, only used for initial value

    [props.overflowMode, scale, density]
  );

  let dragState: DraggableCollectionState | null = null;
  let preview = useRef(null);
  if (isTableDraggable && dragAndDropHooks) {
    dragState = dragAndDropHooks.useDraggableCollectionState!({
      collection: state.collection,
      selectionManager: state.selectionManager,
      preview
    });
    dragAndDropHooks.useDraggableCollection!({}, dragState, domRef);
  }

  let DragPreview = dragAndDropHooks?.DragPreview;
  let dropState: DroppableCollectionState | null = null;
  let droppableCollection: DroppableCollectionResult | null = null;
  let isRootDropTarget = false;
  if (isTableDroppable && dragAndDropHooks) {
    dropState = dragAndDropHooks.useDroppableCollectionState!({
      collection: state.collection,
      selectionManager: state.selectionManager
    });
    droppableCollection = dragAndDropHooks.useDroppableCollection!({
      keyboardDelegate: new ListKeyboardDelegate({
        collection: state.collection,
        disabledKeys: state.selectionManager.disabledKeys,
        ref: domRef,
        layoutDelegate: layout
      }),
      dropTargetDelegate: layout
    }, dropState, domRef);

    isRootDropTarget = dropState.isDropTarget({type: 'root'});
  }

  let {gridProps} = useTable({
    ...props,
    isVirtualized: true,
    layoutDelegate: layout,
    onRowAction: onAction,
    scrollRef: bodyRef
  }, state, domRef);
  let [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  let [headerRowHovered, setHeaderRowHovered] = useState(false);

  // This overrides collection view's renderWrapper to support DOM hierarchy.
  let renderWrapper = useCallback((parent: View | null, reusableView: View, children: View[], renderChildren: (views: View[]) => ReactElement[]): ReactElement => {
    if (reusableView.viewType === 'rowgroup') {
      return (
        <TableRowGroup
          key={reusableView.key}
          layoutInfo={reusableView.layoutInfo!}
          parent={parent?.layoutInfo ?? null}
          // Override the default role="rowgroup" with role="presentation",
          // in favor or adding role="rowgroup" to the ScrollView with
          // ref={bodyRef} in the TableVirtualizer below.
          role="presentation">
          {renderChildren(children)}
        </TableRowGroup>
      );
    }

    if (reusableView.viewType === 'header') {
      return (
        <TableHeader
          key={reusableView.key}
          layoutInfo={reusableView.layoutInfo!}
          parent={parent?.layoutInfo ?? null}>
          {renderChildren(children)}
        </TableHeader>
      );
    }

    if (reusableView.viewType === 'row') {
      return (
        <TableRow
          key={reusableView.key}
          item={reusableView.content!}
          layoutInfo={reusableView.layoutInfo!}
          parent={parent?.layoutInfo ?? null}>
          {renderChildren(children)}
        </TableRow>
      );
    }

    if (reusableView.viewType === 'headerrow') {
      return (
        <TableHeaderRow
          onHoverChange={setHeaderRowHovered}
          key={reusableView.key}
          layoutInfo={reusableView.layoutInfo!}
          parent={parent?.layoutInfo ?? null}
          item={reusableView.content!}>
          {renderChildren(children)}
        </TableHeaderRow>
      );
    }

    return (
      <TableCellWrapper
        key={reusableView.key}
        layoutInfo={reusableView.layoutInfo!}
        virtualizer={reusableView.virtualizer}
        parent={parent!}>
        {reusableView.rendered}
      </TableCellWrapper>
    );
  }, []);

  let renderView = useCallback((type: string, item: GridNode<T>) => {
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
            aria-colspan={item.colSpan != null && item.colSpan > 1 ? item.colSpan : undefined} />
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
          return <ResizableTableColumnHeader column={item} />;
        }

        return (
          <TableColumnHeader column={item} />
        );
      case 'loader':
        return <LoadingState />;
      case 'empty': {
        return <EmptyState />;
      }
    }
    return null;
  }, []);

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
    if (bodyRef.current && headerRef.current) {
      bodyRef.current.scrollLeft = headerRef.current.scrollLeft;
    }
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
  let dropTargetKey: Key | null = null;
  if (dropState?.target?.type === 'item') {
    dropTargetKey = dropState.target.key;
    if (dropState.target.dropPosition === 'before' && dropTargetKey !== state.collection.getFirstKey()) {
      // Normalize to the "after" drop position since we only render those in the DOM.
      // The exception to this is for the first row in the table, where we also render the "before" position.
      dropTargetKey = state.collection.getKeyBefore(dropTargetKey);
    }
  }

  let persistedKeys = useMemo(() => {
    return new Set([focusedKey, dropTargetKey].filter(k => k !== null));
  }, [focusedKey, dropTargetKey]);

  let mergedProps = mergeProps(
    isTableDroppable ? droppableCollection?.collectionProps : null,
    gridProps,
    focusProps
  );

  if (dragAndDropHooks?.isVirtualDragging?.()) {
    mergedProps.tabIndex = undefined;
  }

  return (
    <TableContext.Provider
      value={{
        state,
        dragState,
        dropState,
        dragAndDropHooks,
        isTableDraggable,
        isTableDroppable,
        layout,
        onResizeStart,
        onResize: props.onResize,
        onResizeEnd,
        headerRowHovered,
        isInResizeMode,
        setIsInResizeMode,
        isEmpty,
        onFocusedResizer,
        headerMenuOpen,
        setHeaderMenuOpen,
        renderEmptyState: props.renderEmptyState
      }}>
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
        tableState={state}
        layout={layout}
        collection={state.collection}
        persistedKeys={persistedKeys}
        renderView={renderView}
        renderWrapper={renderWrapper}
        onVisibleRectChange={onVisibleRectChange}
        domRef={domRef}
        headerRef={headerRef}
        bodyRef={bodyRef}
        isFocusVisible={isFocusVisible}
        isVirtualDragging={dragAndDropHooks?.isVirtualDragging?.() || false}
        isRootDropTarget={isRootDropTarget} />
      {DragPreview && isTableDraggable && dragAndDropHooks && dragState &&
        <DragPreview ref={preview}>
          {() => {
            if (dragState.draggedKey == null) {
              return null;
            }
            if (dragAndDropHooks.renderPreview) {
              return dragAndDropHooks.renderPreview(dragState.draggingKeys, dragState.draggedKey);
            }
            let itemCount = dragState.draggingKeys.size;
            let maxWidth = bodyRef.current!.getBoundingClientRect().width;
            let height = ROW_HEIGHTS[density][scale];
            let itemText = state.collection.getTextValue!(dragState.draggedKey);
            return <SpectrumDragPreview itemText={itemText} itemCount={itemCount} height={height} maxWidth={maxWidth} />;
          }}
        </DragPreview>
      }
    </TableContext.Provider>
  );
}

interface TableVirtualizerProps<T> extends HTMLAttributes<HTMLElement> {
  tableState: TableState<T>,
  layout: TableViewLayout<T>,
  collection: TableCollection<T>,
  persistedKeys: Set<Key> | null,
  renderView: (type: string, content: GridNode<T>) => ReactElement | null,
  renderWrapper: (
    parent: View | null,
    reusableView: View,
    children: View[],
    renderChildren: (views: View[]) => ReactElement[]
  ) => ReactElement | null,
  domRef: RefObject<HTMLDivElement | null>,
  bodyRef: RefObject<HTMLDivElement | null>,
  headerRef: RefObject<HTMLDivElement | null>,
  onVisibleRectChange: (rect: Rect) => void,
  isFocusVisible: boolean,
  isVirtualDragging: boolean,
  isRootDropTarget: boolean
}

// This is a custom Virtualizer that also has a header that syncs its scroll position with the body.
function TableVirtualizer<T>(props: TableVirtualizerProps<T>) {
  let {tableState, layout, collection, persistedKeys, renderView, renderWrapper, domRef, bodyRef, headerRef, onVisibleRectChange: onVisibleRectChangeProp, isFocusVisible, isVirtualDragging, isRootDropTarget, ...otherProps} = props;
  let {direction} = useLocale();
  let loadingState = collection.body.props.loadingState;
  let isLoading = loadingState === 'loading' || loadingState === 'loadingMore';
  let onLoadMore = collection.body.props.onLoadMore;
  let [tableWidth, setTableWidth] = useState(0);
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

  let columnResizeState = useTableColumnResizeState({
    tableWidth,
    getDefaultWidth,
    getDefaultMinWidth
  }, tableState);

  let state = useVirtualizerState<GridNode<unknown>, ReactNode>({
    layout,
    collection,
    renderView,
    onVisibleRectChange(rect) {
      if (bodyRef.current) {
        bodyRef.current.scrollTop = rect.y;
        setScrollLeft(bodyRef.current, direction, rect.x);
      }
    },
    persistedKeys,
    layoutOptions: useMemo(() => ({
      columnWidths: columnResizeState.columnWidths
    }), [columnResizeState.columnWidths])
  });

  useLoadMore({isLoading, onLoadMore, scrollOffset: 1}, bodyRef);
  let onVisibleRectChange = useCallback((rect: Rect) => {
    state.setVisibleRect(rect);
  }, [state]);

  let onVisibleRectChangeMemo = useCallback(rect => {
    setTableWidth(rect.width);
    onVisibleRectChange(rect);
    onVisibleRectChangeProp(rect);
  }, [onVisibleRectChange, onVisibleRectChangeProp]);

  // this effect runs whenever the contentSize changes, it doesn't matter what the content size is
  // only that it changes in a resize, and when that happens, we want to sync the body to the
  // header scroll position
  useEffect(() => {
    if (getInteractionModality() === 'keyboard' && headerRef.current?.contains(document.activeElement) && bodyRef.current) {
      scrollIntoView(headerRef.current, document.activeElement as HTMLElement);
      scrollIntoViewport(document.activeElement, {containingElement: domRef.current});
      bodyRef.current.scrollLeft = headerRef.current.scrollLeft;
    }
  }, [state.contentSize, headerRef, bodyRef, domRef]);

  let headerHeight = layout.getLayoutInfo('header')?.rect.height || 0;

  // Sync the scroll position from the table body to the header container.
  let onScroll = useCallback(() => {
    if (headerRef.current && bodyRef.current) {
      headerRef.current.scrollLeft = bodyRef.current.scrollLeft;
    }
  }, [bodyRef, headerRef]);

  let resizerPosition = columnResizeState.resizingColumn != null ? layout.getLayoutInfo(columnResizeState.resizingColumn)!.rect.maxX - 2 : 0;

  let resizerAtEdge = resizerPosition > Math.max(state.virtualizer.contentSize.width, state.virtualizer.visibleRect.width) - 3;
  // this should be fine, every movement of the resizer causes a rerender
  // scrolling can cause it to lag for a moment, but it's always updated
  let resizerInVisibleRegion = resizerPosition < state.virtualizer.visibleRect.maxX;
  let shouldHardCornerResizeCorner = resizerAtEdge && resizerInVisibleRegion;

  // minimize re-render caused on Resizers by memoing this
  let resizingColumnWidth = columnResizeState.resizingColumn != null ? columnResizeState.getColumnWidth(columnResizeState.resizingColumn) : 0;
  let resizingColumn = useMemo(() => ({
    width: resizingColumnWidth,
    key: columnResizeState.resizingColumn
  }), [resizingColumnWidth, columnResizeState.resizingColumn]);

  if (isVirtualDragging) {
    otherProps.tabIndex = undefined;
  }

  let firstColumn = collection.columns[0];
  let scrollPadding = 0;
  if (firstColumn.props.isSelectionCell || firstColumn.props.isDragButtonCell) {
    scrollPadding = columnResizeState.getColumnWidth(firstColumn.key);
  }

  let visibleViews = renderChildren(null, state.visibleViews, renderWrapper);

  return (
    <VirtualizerContext.Provider value={resizingColumn}>
      <FocusScope>
        <div
          {...otherProps}
          ref={domRef}>
          <div
            role="presentation"
            className={classNames(styles, 'spectrum-Table-headWrapper')}
            style={{
              height: headerHeight,
              overflow: 'hidden',
              position: 'relative',
              willChange: state.isScrolling ? 'scroll-position' : undefined,
              scrollPaddingInlineStart: scrollPadding
            }}
            ref={headerRef}>
            <ResizeStateContext.Provider value={columnResizeState}>
              {visibleViews[0]}
            </ResizeStateContext.Provider>
          </div>
          <ScrollView
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
            //  Firefox and Chrome make generic elements using CSS overflow 'scroll' or 'auto' tabbable,
            //  including them within the accessibility tree, which breaks the table structure in Firefox.
            //  Using tabIndex={-1} prevents the ScrollView from being tabbable, and using role="rowgroup"
            //  here and role="presentation" on the table body content fixes the table structure.
            role="rowgroup"
            tabIndex={isVirtualDragging ? undefined : -1}
            style={{
              flex: 1,
              scrollPaddingInlineStart: scrollPadding
            }}
            innerStyle={{overflow: 'visible'}}
            ref={bodyRef}
            contentSize={state.contentSize}
            onVisibleRectChange={onVisibleRectChangeMemo}
            onScrollStart={state.startScrolling}
            onScrollEnd={state.endScrolling}
            onScroll={onScroll}>
            {visibleViews[1]}
            <div
              className={classNames(styles, 'spectrum-Table-bodyResizeIndicator')}
              style={{[direction === 'ltr' ? 'left' : 'right']: `${resizerPosition}px`, height: `${Math.max(state.virtualizer.contentSize.height, state.virtualizer.visibleRect.height)}px`, display: columnResizeState.resizingColumn ? 'block' : 'none'}} />
          </ScrollView>
        </div>
      </FocusScope>
    </VirtualizerContext.Provider>
  );
}

function renderChildren<T extends object>(parent: View | null, views: View[], renderWrapper: NonNullable<TableVirtualizerProps<T>['renderWrapper']>) {
  return views.map(view => {
    return renderWrapper(
      parent,
      view,
      view.children ? Array.from(view.children) : [],
      childViews => renderChildren(view, childViews, renderWrapper)
    );
  });
}

function useStyle(layoutInfo: LayoutInfo, parent: LayoutInfo | null) {
  let {direction} = useLocale();
  let style = layoutInfoToStyle(layoutInfo, direction, parent);
  if (style.overflow === 'hidden') {
    style.overflow = 'visible'; // needed to support position: sticky
  }
  return style;
}

function TableHeader({children, layoutInfo, parent, ...otherProps}: {children: ReactNode, layoutInfo: LayoutInfo, parent: LayoutInfo | null}) {
  let {rowGroupProps} = useTableRowGroup();
  let style = useStyle(layoutInfo, parent);

  return (
    <div {...rowGroupProps} {...otherProps} className={classNames(styles, 'spectrum-Table-head')} style={style}>
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
                'react-spectrum-Table-cell--alignCenter': columnProps.align === 'center' || column.colSpan > 1,
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

let ForwardTableColumnHeaderButton = (props, ref: FocusableRef<HTMLDivElement>) => {
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
let TableColumnHeaderButton = React.forwardRef(ForwardTableColumnHeaderButton);

function ResizableTableColumnHeader(props) {
  let {column} = props;
  let ref = useRef(null);
  let triggerRef = useRef(null);
  let resizingRef = useRef(null);
  let {
    state,
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
  let columnResizeState = useContext(ResizeStateContext)!;
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
        columnResizeState.startResize(column.key);
        setIsInResizeMode(true);
        state.setKeyboardNavigationDisabled(true);
        break;
    }
  };
  let allowsSorting = column.props?.allowsSorting;
  let items = useMemo(() => {
    let options: {label: string, id: string}[] = [];
    if (allowsSorting) {
      options.push({
        label: stringFormatter.format('sortAscending'),
        id: 'sort-asc'
      });
      options.push({
        label: stringFormatter.format('sortDescending'),
        id: 'sort-desc'
      });
    }
    options.push({
      label: stringFormatter.format('resizeColumn'),
      id: 'resize'
    });
    return options;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowsSorting]);

  let resizingColumn = columnResizeState.resizingColumn;
  let showResizer = !isEmpty && ((headerRowHovered && getInteractionModality() !== 'keyboard') || resizingColumn != null);
  let alignment = 'start';
  let menuAlign = 'start' as 'start' | 'end';
  if (columnProps.align === 'center' || column.colSpan > 1) {
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
  let ref = useRef<HTMLDivElement | null>(null);
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
  let ref = useRef<HTMLDivElement | null>(null);
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

function TableRowGroup({children, layoutInfo, parent, ...otherProps}: {children: ReactNode, layoutInfo: LayoutInfo, parent: LayoutInfo | null, role: string}) {
  let {rowGroupProps} = useTableRowGroup();
  let {isTableDroppable} = useContext(TableContext)!;
  let style = useStyle(layoutInfo, parent);

  return (
    <div {...rowGroupProps} style={style} {...otherProps}>
      {isTableDroppable &&
        <RootDropIndicator key="root" />
      }
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
  dragButtonRef: React.RefObject<HTMLDivElement | null>,
  isFocusVisibleWithin: boolean
}


const TableRowContext = React.createContext<TableRowContextValue | null>(null);
export function useTableRowContext(): TableRowContextValue {
  return useContext(TableRowContext)!;
}

function TableRow({item, children, layoutInfo, parent, ...otherProps}: {item: GridNode<unknown>, children: ReactNode, layoutInfo: LayoutInfo, parent: LayoutInfo | null}) {
  let ref = useRef<HTMLDivElement | null>(null);
  let {state, layout, dragAndDropHooks, isTableDraggable, isTableDroppable, dragState, dropState} = useTableContext();
  let isSelected = state.selectionManager.isSelected(item.key);
  let {rowProps, hasAction, allowsSelection} = useTableRow({
    node: item,
    isVirtualized: true,
    shouldSelectOnPressUp: isTableDraggable
  }, state, ref);

  let isDisabled = state.selectionManager.isDisabled(item.key);
  let isInteractive = !isDisabled && (hasAction || allowsSelection || isTableDraggable);
  let {pressProps, isPressed} = usePress({isDisabled: !isInteractive});

  // The row should show the focus background style when any cell inside it is focused.
  // If the row itself is focused, then it should have a blue focus indicator on the left.
  let {
    isFocusVisible: isFocusVisibleWithin,
    focusProps: focusWithinProps
  } = useFocusRing({within: true});
  let {isFocusVisible, focusProps} = useFocusRing();
  let {hoverProps, isHovered} = useHover({isDisabled: !isInteractive});
  let isFirstRow = state.collection.rows.find(row => row.level === 1)?.key === item.key;
  let isLastRow = item.nextKey == null;
  // Figure out if the TableView content is equal or greater in height to the container. If so, we'll need to round the bottom
  // border corners of the last row when selected.
  let isFlushWithContainerBottom = false;
  if (isLastRow) {
    if (layout.getContentSize()?.height >= (layout.virtualizer?.visibleRect.height ?? 0)) {
      isFlushWithContainerBottom = true;
    }
  }

  let draggableItem: DraggableItemResult | null = null;
  if (isTableDraggable && dragAndDropHooks && dragState) {
    draggableItem = dragAndDropHooks.useDraggableItem!({key: item.key, hasDragButton: true}, dragState);
    if (isDisabled) {
      draggableItem = null;
    }
  }
  let isDropTarget = false;
  let dropIndicator: DropIndicatorAria | null = null;
  let dropIndicatorRef = useRef<HTMLDivElement | null>(null);
  if (isTableDroppable && dragAndDropHooks && dropState) {
    let target = {type: 'item', key: item.key, dropPosition: 'on'} as DropTarget;
    isDropTarget = dropState.isDropTarget(target);

    dropIndicator = dragAndDropHooks.useDropIndicator!({target}, dropState, dropIndicatorRef);
  }

  let dragButtonRef = React.useRef<HTMLDivElement | null>(null);
  let {buttonProps: dragButtonProps} = useButton({
    ...draggableItem?.dragButtonProps,
    elementType: 'div'
  }, dragButtonRef);

  let style = useStyle(layoutInfo, parent);

  let props = mergeProps(
    rowProps,
    otherProps,
    {style},
    focusWithinProps,
    focusProps,
    hoverProps,
    pressProps,
    draggableItem?.dragProps,
    // Remove tab index from list row if performing a screenreader drag. This prevents TalkBack from focusing the row,
    // allowing for single swipe navigation between row drop indicator
    dragAndDropHooks?.isVirtualDragging?.() ? {tabIndex: null} : null
  ) as HTMLAttributes<HTMLElement> & DOMAttributes<FocusableElement>;

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
        {...props}
        ref={ref}
        className={
          classNames(
            styles,
            'spectrum-Table-row',
            {
              'is-active': isPressed,
              'is-selected': isSelected,
              'spectrum-Table-row--highlightSelection': state.selectionManager.selectionBehavior === 'replace',
              'is-next-selected': item.nextKey != null && state.selectionManager.isSelected(item.nextKey),
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

function TableHeaderRow({item, children, layoutInfo, parent, ...props}: {item: GridNode<unknown>, children: ReactNode, layoutInfo: LayoutInfo, parent: LayoutInfo | null} & HoverProps) {
  let {state, headerMenuOpen} = useTableContext();
  let ref = useRef<HTMLDivElement | null>(null);
  let {rowProps} = useTableHeaderRow({node: item, isVirtualized: true}, state, ref);
  let {hoverProps} = useHover({...props, isDisabled: headerMenuOpen});
  let style = useStyle(layoutInfo, parent);

  return (
    <div {...mergeProps(rowProps, hoverProps)} ref={ref} style={style}>
      {children}
    </div>
  );
}

function TableDragCell({cell}) {
  let ref = useRef<HTMLDivElement | null>(null);
  let {state, isTableDraggable} = useTableContext();
  let isDisabled = state.selectionManager.isDisabled(cell.parentKey);
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
  let ref = useRef<HTMLDivElement | null>(null);
  let {state} = useTableContext();
  // The TableCheckbox should always render its disabled status if the row is disabled, regardless of disabledBehavior,
  // but the cell itself should not render its disabled styles if disabledBehavior="selection" because the row might have actions on it.
  let isSelectionDisabled = state.disabledKeys.has(cell.parentKey);
  let isDisabled = state.selectionManager.isDisabled(cell.parentKey);
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
            isDisabled={isSelectionDisabled}
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
  let ref = useRef<HTMLDivElement | null>(null);
  let columnProps = cell.column.props as SpectrumColumnProps<unknown>;
  let isDisabled = state.selectionManager.isDisabled(cell.parentKey);
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

function TableCellWrapper({layoutInfo, virtualizer, parent, children}: {layoutInfo: LayoutInfo, virtualizer: any, parent: ReusableView<any, any>, children: ReactNode}) {
  let {isTableDroppable, dropState} = useContext(TableContext)!;
  let isDropTarget = false;
  let isRootDroptarget = false;
  if (isTableDroppable && dropState) {
    if (parent.content) {
      isDropTarget = dropState.isDropTarget({type: 'item', dropPosition: 'on', key: parent.content.key});
    }
    isRootDroptarget = dropState.isDropTarget({type: 'root'});
  }

  return (
    <VirtualizerItem
      layoutInfo={layoutInfo}
      virtualizer={virtualizer}
      parent={parent?.layoutInfo}
      className={
        useMemo(() => classNames(
          styles,
          'spectrum-Table-cellWrapper',
          classNames(
            stylesOverrides,
            {
              'react-spectrum-Table-cellWrapper': !layoutInfo.estimatedSize,
              'react-spectrum-Table-cellWrapper--dropTarget': isDropTarget || isRootDroptarget
            }
          )
        ), [layoutInfo.estimatedSize, isDropTarget, isRootDroptarget])
      }>
      {children}
    </VirtualizerItem>
  );
}

function ExpandableRowChevron({cell}) {
   // TODO: move some/all of the chevron button setup into a separate hook?
  let {direction} = useLocale();
  let {state} = useTableContext();
  let expandButtonRef = useRef<HTMLSpanElement | null>(null);
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

function LoadingState() {
  let {state} = useContext(TableContext)!;
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/table');
  return (
    <CenteredWrapper>
      <ProgressCircle
        isIndeterminate
        aria-label={state.collection.size > 0 ? stringFormatter.format('loadingMore') : stringFormatter.format('loading')} />
    </CenteredWrapper>
  );
}

function EmptyState() {
  let {renderEmptyState} = useContext(TableContext)!;
  let emptyState = renderEmptyState ? renderEmptyState() : null;
  if (emptyState == null) {
    return null;
  }

  return (
    <CenteredWrapper>
      {emptyState}
    </CenteredWrapper>
  );
}

function CenteredWrapper({children}) {
  let {state} = useTableContext();
  let rowProps;

  if ('expandedKeys' in state) {
    let topLevelRowCount = [...state.collection.body.childNodes].length;
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

const ForwardTableViewBase = React.forwardRef(TableViewBase) as <T>(props: TableBaseProps<T> & {ref?: DOMRef<HTMLDivElement>}) => ReactElement;

export {ForwardTableViewBase as TableViewBase};
