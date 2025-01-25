import {AriaLabelingProps, HoverEvents, Key, LinkDOMProps, RefObject} from '@react-types/shared';
import {BaseCollection, Collection, CollectionBuilder, CollectionNode, createBranchComponent, createLeafComponent, useCachedChildren} from '@react-aria/collections';
import {buildHeaderRows, TableColumnResizeState} from '@react-stately/table';
import {ButtonContext} from './Button';
import {CheckboxContext} from './RSPContexts';
import {CollectionProps, CollectionRendererContext, DefaultCollectionRenderer, ItemRenderProps} from './Collection';
import {ColumnSize, ColumnStaticSize, TableCollection as ITableCollection, TableProps as SharedTableProps} from '@react-types/table';
import {ContextValue, DEFAULT_SLOT, DOMProps, Provider, RenderProps, ScrollableProps, SlotProps, StyleProps, StyleRenderProps, useContextProps, useRenderProps} from './utils';
import {DisabledBehavior, DraggableCollectionState, DroppableCollectionState, MultipleSelectionState, Node, SelectionBehavior, SelectionMode, SortDirection, TableState, useMultipleSelectionState, useTableColumnResizeState, useTableState} from 'react-stately';
import {DragAndDropContext, DropIndicatorContext, DropIndicatorProps, useDndPersistedKeys, useRenderDropIndicator} from './DragAndDrop';
import {DragAndDropHooks} from './useDragAndDrop';
import {DraggableItemResult, DragPreviewRenderer, DropIndicatorAria, DroppableCollectionResult, FocusScope, ListKeyboardDelegate, mergeProps, useFocusRing, useHover, useLocale, useLocalizedStringFormatter, useTable, useTableCell, useTableColumnHeader, useTableColumnResize, useTableHeaderRow, useTableRow, useTableRowGroup, useTableSelectAllCheckbox, useTableSelectionCheckbox, useVisuallyHidden} from 'react-aria';
import {filterDOMProps, isScrollable, mergeRefs, useLayoutEffect, useObjectRef, useResizeObserver} from '@react-aria/utils';
import {GridNode} from '@react-types/grid';
// @ts-ignore
import intlMessages from '../intl/*.json';
import React, {createContext, ForwardedRef, forwardRef, JSX, ReactElement, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import ReactDOM from 'react-dom';

class TableCollection<T> extends BaseCollection<T> implements ITableCollection<T> {
  headerRows: GridNode<T>[] = [];
  columns: GridNode<T>[] = [];
  rows: GridNode<T>[] = [];
  rowHeaderColumnKeys: Set<Key> = new Set();
  head: CollectionNode<T> = new CollectionNode('tableheader', -1);
  body: CollectionNode<T> = new CollectionNode('tablebody', -2);
  columnsDirty = true;

  addNode(node: CollectionNode<T>) {
    super.addNode(node);

    this.columnsDirty ||= node.type === 'column';
    if (node.type === 'tableheader') {
      this.head = node;
    }

    if (node.type === 'tablebody') {
      this.body = node;
    }
  }

  commit(firstKey: Key, lastKey: Key, isSSR = false) {
    this.updateColumns(isSSR);
    super.commit(firstKey, lastKey, isSSR);
    this.rows = [...this.getChildren(this.body.key)];
  }

  private updateColumns(isSSR: boolean) {
    if (!this.columnsDirty) {
      return;
    }

    this.rowHeaderColumnKeys = new Set();
    this.columns = [];

    let columnKeyMap = new Map();
    let visit = (node: Node<T>) => {
      switch (node.type) {
        case 'column':
          columnKeyMap.set(node.key, node);
          if (!node.hasChildNodes) {
            node.index = this.columns.length;
            this.columns.push(node);

            if (node.props.isRowHeader) {
              this.rowHeaderColumnKeys.add(node.key);
            }
          }
          break;
      }
      for (let child of this.getChildren(node.key)) {
        visit(child);
      }
    };

    for (let node of this.getChildren(this.head.key)) {
      visit(node);
    }

    this.headerRows = buildHeaderRows(columnKeyMap, this.columns);
    this.columnsDirty = false;
    if (this.rowHeaderColumnKeys.size === 0 && this.columns.length > 0 && !isSSR) {
      throw new Error('A table must have at least one Column with the isRowHeader prop set to true');
    }
  }

  get columnCount() {
    return this.columns.length;
  }

  *[Symbol.iterator]() {
    // Wait until the collection is initialized.
    if (this.head.key === -1) {
      return;
    }
    yield this.head;
    yield this.body;
  }

  get size() {
    return this.rows.length;
  }

  getFirstKey() {
    return this.body.firstChildKey;
  }

  getLastKey() {
    return this.body.lastChildKey;
  }

  getKeyAfter(key: Key) {
    let node = this.getItem(key);
    if (node?.type === 'column') {
      return node.nextKey ?? null;
    }

    return super.getKeyAfter(key);
  }

  getKeyBefore(key: Key) {
    let node = this.getItem(key);
    if (node?.type === 'column') {
      return node.prevKey ?? null;
    }

    let k = super.getKeyBefore(key);
    if (k != null && this.getItem(k)?.type === 'tablebody') {
      return null;
    }

    return k;
  }

  getChildren(key: Key): Iterable<Node<T>> {
    if (!this.getItem(key)) {
      for (let row of this.headerRows) {
        if (row.key === key) {
          return row.childNodes;
        }
      }
    }

    return super.getChildren(key);
  }

  clone() {
    let collection = super.clone();
    collection.headerRows = this.headerRows;
    collection.columns = this.columns;
    collection.rowHeaderColumnKeys = this.rowHeaderColumnKeys;
    collection.head = this.head;
    collection.body = this.body;
    return collection;
  }

  getTextValue(key: Key): string {
    let row = this.getItem(key);
    if (!row) {
      return '';
    }

    // If the row has a textValue, use that.
    if (row.textValue) {
      return row.textValue;
    }

    // Otherwise combine the text of each of the row header columns.
    let rowHeaderColumnKeys = this.rowHeaderColumnKeys;
    let text: string[] = [];
    for (let cell of this.getChildren(key)) {
      let column = this.columns[cell.index!];
      if (rowHeaderColumnKeys.has(column.key) && cell.textValue) {
        text.push(cell.textValue);
      }

      if (text.length === rowHeaderColumnKeys.size) {
        break;
      }
    }

    return text.join(' ');
  }
}

interface ResizableTableContainerContextValue {
  tableWidth: number,
  tableRef: RefObject<HTMLTableElement | null>,
  scrollRef: RefObject<HTMLElement | null>,
  // Dependency inject useTableColumnResizeState so it doesn't affect bundle size unless you're using ResizableTableContainer.
  useTableColumnResizeState: typeof useTableColumnResizeState,
  onResizeStart?: (widths: Map<Key, ColumnSize>) => void,
  onResize?: (widths: Map<Key, ColumnSize>) => void,
  onResizeEnd?: (widths: Map<Key, ColumnSize>) => void
}

const ResizableTableContainerContext = createContext<ResizableTableContainerContextValue | null>(null);

export interface ResizableTableContainerProps extends DOMProps, ScrollableProps<HTMLDivElement> {
  /**
   * Handler that is called when a user starts a column resize.
   */
  onResizeStart?: (widths: Map<Key, ColumnSize>) => void,
  /**
   * Handler that is called when a user performs a column resize.
   * Can be used with the width property on columns to put the column widths into
   * a controlled state.
   */
  onResize?: (widths: Map<Key, ColumnSize>) => void,
  /**
   * Handler that is called after a user performs a column resize.
   * Can be used to store the widths of columns for another future session.
   */
  onResizeEnd?: (widths: Map<Key, ColumnSize>) => void
}

export const ResizableTableContainer = forwardRef(function ResizableTableContainer(props: ResizableTableContainerProps, ref: ForwardedRef<HTMLDivElement>) {
  let containerRef = useObjectRef(ref);
  let tableRef = useRef<HTMLTableElement>(null);
  let scrollRef = useRef<HTMLElement | null>(null);
  let [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    // Walk up the DOM from the Table to the ResizableTableContainer and stop
    // when we reach the first scrollable element. This is what we'll measure
    // to determine column widths (important due to width of scrollbars).
    // This will usually be the ResizableTableContainer for native tables, and
    // the Table itself for virtualized tables.
    let table = tableRef.current as HTMLElement | null;
    while (table && table !== containerRef.current && !isScrollable(table)) {
      table = table.parentElement;
    }
    scrollRef.current = table;
  }, [containerRef]);

  useResizeObserver({
    ref: scrollRef,
    box: 'border-box',
    onResize() {
      setWidth(scrollRef.current?.clientWidth ?? 0);
    }
  });

  useLayoutEffect(() => {
    setWidth(scrollRef.current?.clientWidth ?? 0);
  }, []);

  let ctx = useMemo(() => ({
    tableRef,
    scrollRef,
    tableWidth: width,
    useTableColumnResizeState,
    onResizeStart: props.onResizeStart,
    onResize: props.onResize,
    onResizeEnd: props.onResizeEnd
  }), [tableRef, width, props.onResizeStart, props.onResize, props.onResizeEnd]);

  return (
    <div
      {...filterDOMProps(props as any)}
      ref={containerRef}
      className={props.className || 'react-aria-ResizableTableContainer'}
      style={props.style}
      onScroll={props.onScroll}>
      <ResizableTableContainerContext.Provider value={ctx}>
        {props.children}
      </ResizableTableContainerContext.Provider>
    </div>
  );
});

export const TableContext = createContext<ContextValue<TableProps, HTMLTableElement>>(null);
export const TableStateContext = createContext<TableState<any> | null>(null);
export const TableColumnResizeStateContext = createContext<TableColumnResizeState<unknown> | null>(null);

export interface TableRenderProps {
  /**
   * Whether the table is currently focused.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the table is currently keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the table is currently the active drop target.
   * @selector [data-drop-target]
   */
  isDropTarget: boolean,
  /**
   * State of the table.
   */
  state: TableState<unknown>
}

export interface TableProps extends Omit<SharedTableProps<any>, 'children'>, StyleRenderProps<TableRenderProps>, SlotProps, AriaLabelingProps, ScrollableProps<HTMLTableElement> {
  /** The elements that make up the table. Includes the TableHeader, TableBody, Columns, and Rows. */
  children?: ReactNode,
  /**
   * How multiple selection should behave in the collection.
   * @default "toggle"
   */
  selectionBehavior?: SelectionBehavior,
  /**
   * Whether `disabledKeys` applies to all interactions, or only selection.
   * @default "selection"
   */
  disabledBehavior?: DisabledBehavior,
  /** Handler that is called when a user performs an action on the row. */
  onRowAction?: (key: Key) => void,
  /** The drag and drop hooks returned by `useDragAndDrop` used to enable drag and drop behavior for the Table. */
  dragAndDropHooks?: DragAndDropHooks
}

/**
 * A table displays data in rows and columns and enables a user to navigate its contents via directional navigation keys,
 * and optionally supports row selection and sorting.
 */
export const Table = forwardRef(function Table(props: TableProps, ref: ForwardedRef<HTMLTableElement>) {
  [props, ref] = useContextProps(props, ref, TableContext);

  // Separate selection state so we have access to it from collection components via useTableOptions.
  let selectionState = useMultipleSelectionState(props);
  let {selectionBehavior, selectionMode, disallowEmptySelection} = selectionState;
  let hasDragHooks = !!props.dragAndDropHooks?.useDraggableCollectionState;
  let ctx = useMemo(() => ({
    selectionBehavior: selectionMode === 'none' ? null : selectionBehavior,
    selectionMode,
    disallowEmptySelection,
    allowsDragging: hasDragHooks
  }), [selectionBehavior, selectionMode, disallowEmptySelection, hasDragHooks]);

  let content = (
    <TableOptionsContext.Provider value={ctx}>
      <Collection {...props} />
    </TableOptionsContext.Provider>
  );

  return (
    <CollectionBuilder content={content} createCollection={() => new TableCollection<any>()}>
      {collection => <TableInner props={props} forwardedRef={ref} selectionState={selectionState} collection={collection} />}
    </CollectionBuilder>
  );
});

interface TableInnerProps {
  props: TableProps,
  forwardedRef: ForwardedRef<HTMLTableElement>,
  selectionState: MultipleSelectionState,
  collection: ITableCollection<Node<object>>
}


function TableInner({props, forwardedRef: ref, selectionState, collection}: TableInnerProps) {
  let tableContainerContext = useContext(ResizableTableContainerContext);
  ref = useObjectRef(useMemo(() => mergeRefs(ref, tableContainerContext?.tableRef), [ref, tableContainerContext?.tableRef]));
  let state = useTableState({
    ...props,
    collection,
    children: undefined,
    UNSAFE_selectionState: selectionState
  });

  let {isVirtualized, layoutDelegate, dropTargetDelegate: ctxDropTargetDelegate, CollectionRoot} = useContext(CollectionRendererContext);
  let {dragAndDropHooks} = props;
  let {gridProps: {id, ...gridProps}} = useTable({
    ...props,
    layoutDelegate,
    isVirtualized
  }, state, ref);
  let selectionManager = state.selectionManager;
  let hasDragHooks = !!dragAndDropHooks?.useDraggableCollectionState;
  let hasDropHooks = !!dragAndDropHooks?.useDroppableCollectionState;
  let dragHooksProvided = useRef(hasDragHooks);
  let dropHooksProvided = useRef(hasDropHooks);
  useEffect(() => {
    if (dragHooksProvided.current !== hasDragHooks) {
      console.warn('Drag hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
    }
    if (dropHooksProvided.current !== hasDropHooks) {
      console.warn('Drop hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
    }
  }, [hasDragHooks, hasDropHooks]);

  let dragState: DraggableCollectionState | undefined = undefined;
  let dropState: DroppableCollectionState | undefined = undefined;
  let droppableCollection: DroppableCollectionResult | undefined = undefined;
  let isRootDropTarget = false;
  let dragPreview: JSX.Element | null = null;
  let preview = useRef<DragPreviewRenderer>(null);

  if (hasDragHooks && dragAndDropHooks) {
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

  if (hasDropHooks && dragAndDropHooks) {
    dropState = dragAndDropHooks.useDroppableCollectionState!({
      collection,
      selectionManager
    });

    let keyboardDelegate = new ListKeyboardDelegate({
      collection,
      disabledKeys: selectionManager.disabledKeys,
      disabledBehavior: selectionManager.disabledBehavior,
      ref,
      layoutDelegate
    });
    let dropTargetDelegate = dragAndDropHooks.dropTargetDelegate || ctxDropTargetDelegate || new dragAndDropHooks.ListDropTargetDelegate(collection.rows, ref);
    droppableCollection = dragAndDropHooks.useDroppableCollection!({
      keyboardDelegate,
      dropTargetDelegate
    }, dropState, ref);

    isRootDropTarget = dropState.isDropTarget({type: 'root'});
  }

  let {focusProps, isFocused, isFocusVisible} = useFocusRing();
  let renderProps = useRenderProps({
    className: props.className,
    style: props.style,
    defaultClassName: 'react-aria-Table',
    values: {
      isDropTarget: isRootDropTarget,
      isFocused,
      isFocusVisible,
      state
    }
  });

  let isListDraggable = !!(hasDragHooks && !dragState?.isDisabled);

  let style = renderProps.style;
  let layoutState: TableColumnResizeState<unknown> | null = null;
  if (tableContainerContext) {
    layoutState = tableContainerContext.useTableColumnResizeState({
      tableWidth: tableContainerContext.tableWidth
    }, state);
    if (!isVirtualized) {
      style = {
        ...style,
        tableLayout: 'fixed',
        width: 'fit-content'
      };
    }
  }

  let ElementType = useElementType('table');

  return (
    <Provider
      values={[
        [TableStateContext, state],
        [TableColumnResizeStateContext, layoutState],
        [DragAndDropContext, {dragAndDropHooks, dragState, dropState}],
        [DropIndicatorContext, {render: TableDropIndicatorWrapper}]
      ]}>
      <FocusScope>
        <ElementType
          {...filterDOMProps(props)}
          {...renderProps}
          {...mergeProps(gridProps, focusProps, droppableCollection?.collectionProps, {id})}
          style={style}
          ref={ref}
          slot={props.slot || undefined}
          onScroll={props.onScroll}
          data-allows-dragging={isListDraggable || undefined}
          data-drop-target={isRootDropTarget || undefined}
          data-focused={isFocused || undefined}
          data-focus-visible={isFocusVisible || undefined}>
          <CollectionRoot
            collection={collection}
            scrollRef={tableContainerContext?.scrollRef ?? ref}
            persistedKeys={useDndPersistedKeys(selectionManager, dragAndDropHooks, dropState)} />
        </ElementType>
      </FocusScope>
      {dragPreview}
    </Provider>
  );
}

function useElementType<E extends keyof JSX.IntrinsicElements>(element: E): E | 'div' {
  let {isVirtualized} = useContext(CollectionRendererContext);
  return isVirtualized ? 'div' : element;
}

export interface TableOptionsContextValue {
  /** The type of selection that is allowed in the table. */
  selectionMode: SelectionMode,
  /** The selection behavior for the table. If selectionMode is `"none"`, this will be `null`. */
  selectionBehavior: SelectionBehavior | null,
  /** Whether the table allows empty selection. */
  disallowEmptySelection: boolean,
  /** Whether the table allows rows to be dragged. */
  allowsDragging: boolean
}

const TableOptionsContext = createContext<TableOptionsContextValue | null>(null);

/**
 * Returns options from the parent `<Table>` component.
 */
export function useTableOptions(): TableOptionsContextValue {
  return useContext(TableOptionsContext)!;
}

export interface TableHeaderRenderProps {
  /**
   * Whether the table header is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean
}

export interface TableHeaderProps<T> extends StyleRenderProps<TableHeaderRenderProps>, HoverEvents {
  /** A list of table columns. */
  columns?: T[],
  /** A list of `Column(s)` or a function. If the latter, a list of columns must be provided using the `columns` prop. */
  children?: ReactNode | ((item: T) => ReactElement),
  /** Values that should invalidate the column cache when using dynamic collections. */
  dependencies?: any[]
}

/**
 * A header within a `<Table>`, containing the table columns.
 */
export const TableHeader =  /*#__PURE__*/ createBranchComponent(
  'tableheader',
  <T extends object>(props: TableHeaderProps<T>, ref: ForwardedRef<HTMLTableSectionElement>) => {
    let collection = useContext(TableStateContext)!.collection as TableCollection<unknown>;
    let headerRows = useCachedChildren({
      items: collection.headerRows,
      children: useCallback((item: Node<unknown>) => {
        switch (item.type) {
          case 'headerrow':
            return <TableHeaderRow item={item} />;
          default:
            throw new Error('Unsupported node type in TableHeader: ' + item.type);
        }
      }, [])
    });

    let THead = useElementType('thead');
    let {rowGroupProps} = useTableRowGroup();
    let {hoverProps, isHovered} = useHover({
      onHoverStart: props.onHoverStart,
      onHoverChange: props.onHoverChange,
      onHoverEnd: props.onHoverEnd
    });

    let renderProps = useRenderProps({
      className: props.className,
      style: props.style,
      defaultClassName: 'react-aria-TableHeader',
      values: {
        isHovered
      }
    });

    return (
      <THead
        {...mergeProps(filterDOMProps(props as any), rowGroupProps, hoverProps)}
        {...renderProps}
        ref={ref}
        data-hovered={isHovered || undefined}>
        {headerRows}
      </THead>
    );
  },
  props => (
    <Collection dependencies={props.dependencies} items={props.columns}>
      {props.children}
    </Collection>
  )
);

function TableHeaderRow({item}: {item: GridNode<any>}) {
  let ref = useRef<HTMLTableRowElement>(null);
  let state = useContext(TableStateContext)!;
  let {isVirtualized, CollectionBranch} = useContext(CollectionRendererContext);
  let {rowProps} = useTableHeaderRow({node: item, isVirtualized}, state, ref);
  let {checkboxProps} = useTableSelectAllCheckbox(state);
  let TR = useElementType('tr');

  return (
    <TR {...rowProps} ref={ref}>
      <Provider
        values={[
          [CheckboxContext, {
            slots: {
              selection: checkboxProps
            }
          }]
        ]}>
        <CollectionBranch collection={state.collection} parent={item} />
      </Provider>
    </TR>
  );
}

export interface ColumnRenderProps {
  /**
   * Whether the item is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean,
  /**
   * Whether the item is currently focused.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the item is currently keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the column allows sorting.
   * @selector [data-allows-sorting]
   */
  allowsSorting: boolean,
  /**
   * The current sort direction.
   * @selector [data-sort-direction="ascending | descending"]
   */
  sortDirection: SortDirection | undefined,
  /**
   * Whether the column is currently being resized.
   * @selector [data-resizing]
   */
  isResizing: boolean,
  /**
   * Triggers sorting for this column in the given direction.
   */
  sort(direction: SortDirection): void,
  /**
   * Starts column resizing if the table is contained in a `<ResizableTableContainer>` element.
   */
  startResize(): void
}

export interface ColumnProps extends RenderProps<ColumnRenderProps> {
  /** The unique id of the column. */
  id?: Key,
  /** Whether the column allows sorting. */
  allowsSorting?: boolean,
  /** Whether a column is a [row header](https://www.w3.org/TR/wai-aria-1.1/#rowheader) and should be announced by assistive technology during row navigation. */
  isRowHeader?: boolean,
  /** A string representation of the column's contents, used for accessibility announcements. */
  textValue?: string,
  /** The width of the column. This prop only applies when the `<Table>` is wrapped in a `<ResizableTableContainer>`. */
  width?: ColumnSize | null,
  /** The default width of the column. This prop only applies when the `<Table>` is wrapped in a `<ResizableTableContainer>`. */
  defaultWidth?: ColumnSize | null,
  /** The minimum width of the column. This prop only applies when the `<Table>` is wrapped in a `<ResizableTableContainer>`. */
  minWidth?: ColumnStaticSize | null,
  /** The maximum width of the column. This prop only applies when the `<Table>` is wrapped in a `<ResizableTableContainer>`. */
  maxWidth?: ColumnStaticSize | null
}

/**
 * A column within a `<Table>`.
 */
export const Column = /*#__PURE__*/ createLeafComponent('column', (props: ColumnProps, forwardedRef: ForwardedRef<HTMLTableCellElement>, column: GridNode<unknown>) => {
  let ref = useObjectRef<HTMLTableHeaderCellElement>(forwardedRef);
  let state = useContext(TableStateContext)!;
  let {isVirtualized} = useContext(CollectionRendererContext);
  let {columnHeaderProps} = useTableColumnHeader(
    {node: column, isVirtualized},
    state,
    ref
  );
  let {isFocused, isFocusVisible, focusProps} = useFocusRing();

  let layoutState = useContext(TableColumnResizeStateContext);
  let isResizing = false;
  if (layoutState) {
    isResizing = layoutState.resizingColumn === column.key;
  } else {
    for (let prop in ['width', 'defaultWidth', 'minWidth', 'maxWidth']) {
      if (prop in column.props) {
        console.warn(`The ${prop} prop on a <Column> only applies when a <Table> is wrapped in a <ResizableTableContainer>. If you aren't using column resizing, you can set the width of a column with CSS.`);
      }
    }
  }

  let {hoverProps, isHovered} = useHover({isDisabled: !props.allowsSorting});
  let renderProps = useRenderProps({
    ...props,
    id: undefined,
    children: column.rendered,
    defaultClassName: 'react-aria-Column',
    values: {
      isHovered,
      isFocused,
      isFocusVisible,
      allowsSorting: column.props.allowsSorting,
      sortDirection: state.sortDescriptor?.column === column.key
        ? state.sortDescriptor.direction
        : undefined,
      isResizing,
      startResize: () => {
        if (layoutState) {
          layoutState.startResize(column.key);
          state.setKeyboardNavigationDisabled(true);
        } else {
          throw new Error('Wrap your <Table> in a <ResizableTableContainer> to enable column resizing');
        }
      },
      sort: (direction) => {
        state.sort(column.key, direction);
      }
    }
  });

  let style = renderProps.style;
  if (layoutState) {
    style = {...style, width: layoutState.getColumnWidth(column.key)};
  }

  let TH = useElementType('th');

  return (
    <TH
      {...mergeProps(filterDOMProps(props as any), columnHeaderProps, focusProps, hoverProps)}
      {...renderProps}
      style={style}
      colSpan={column.colspan}
      ref={ref}
      data-hovered={isHovered || undefined}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-resizing={isResizing || undefined}
      data-allows-sorting={column.props.allowsSorting || undefined}
      data-sort-direction={state.sortDescriptor?.column === column.key ? state.sortDescriptor.direction : undefined}>
      <Provider
        values={[
          [ColumnResizerContext, {column, triggerRef: ref}],
          [CollectionRendererContext, DefaultCollectionRenderer]
        ]}>
        {renderProps.children}
      </Provider>
    </TH>
  );
});

export interface ColumnResizerRenderProps {
  /**
   * Whether the resizer is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean,
  /**
   * Whether the resizer is currently focused.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the resizer is currently keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the resizer is currently being resized.
   * @selector [data-resizing]
   */
  isResizing: boolean,
  /**
   * The direction that the column is currently resizable.
   * @selector [data-resizable-direction="right | left | both"]
   */
  resizableDirection: 'right' | 'left' | 'both'
}

export interface ColumnResizerProps extends HoverEvents, RenderProps<ColumnResizerRenderProps> {
  /** A custom accessibility label for the resizer. */
  'aria-label'?: string
}

interface ColumnResizerContextValue {
  column: GridNode<unknown>,
  triggerRef: RefObject<HTMLDivElement | null>
}

const ColumnResizerContext = createContext<ColumnResizerContextValue | null>(null);

export const ColumnResizer = forwardRef(function ColumnResizer(props: ColumnResizerProps, ref: ForwardedRef<HTMLDivElement>) {
  let layoutState = useContext(TableColumnResizeStateContext);
  if (!layoutState) {
    throw new Error('Wrap your <Table> in a <ResizableTableContainer> to enable column resizing');
  }
  let stringFormatter = useLocalizedStringFormatter(intlMessages, 'react-aria-components');

  let {onResizeStart, onResize, onResizeEnd} = useContext(ResizableTableContainerContext)!;
  let {column, triggerRef} = useContext(ColumnResizerContext)!;
  let inputRef = useRef<HTMLInputElement>(null);
  let {resizerProps, inputProps, isResizing} = useTableColumnResize(
    {
      column,
      'aria-label': props['aria-label'] || stringFormatter.format('tableResizer'),
      onResizeStart,
      onResize,
      onResizeEnd,
      triggerRef
    },
    layoutState,
    inputRef
  );
  let {focusProps, isFocused, isFocusVisible} = useFocusRing();
  let {hoverProps, isHovered} = useHover(props);

  let isEResizable = layoutState.getColumnMinWidth(column.key) >= layoutState.getColumnWidth(column.key);
  let isWResizable = layoutState.getColumnMaxWidth(column.key) <= layoutState.getColumnWidth(column.key);
  let {direction} = useLocale();
  let resizableDirection: ColumnResizerRenderProps['resizableDirection'] = 'both';
  if (isEResizable) {
    resizableDirection = direction === 'rtl' ? 'right' : 'left';
  } else if (isWResizable) {
    resizableDirection = direction === 'rtl' ? 'left' : 'right';
  } else {
    resizableDirection = 'both';
  }

  let objectRef = useObjectRef(ref);
  let [cursor, setCursor] = useState('');
  useEffect(() => {
    if (!objectRef.current) {
      return;
    }
    let style = window.getComputedStyle(objectRef.current);
    setCursor(style.cursor);
  }, [objectRef, resizableDirection]);

  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-ColumnResizer',
    values: {
      isFocused,
      isFocusVisible,
      isResizing,
      isHovered,
      resizableDirection
    }
  });

  let [isMouseDown, setMouseDown] = useState(false);
  let onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') {
      setMouseDown(true);
    }
  };

  if (!isResizing && isMouseDown) {
    setMouseDown(false);
  }

  return (
    <div
      ref={objectRef}
      role="presentation"
      {...filterDOMProps(props as any)}
      {...renderProps}
      {...mergeProps(resizerProps, {onPointerDown}, hoverProps)}
      data-hovered={isHovered || undefined}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-resizing={isResizing || undefined}
      data-resizable-direction={resizableDirection}>
      {renderProps.children}
      <input
        ref={inputRef}
        {...mergeProps(inputProps, focusProps)} />
      {isResizing && isMouseDown && ReactDOM.createPortal(<div style={{position: 'fixed', top: 0, left: 0, bottom: 0, right: 0, cursor}} />, document.body)}
    </div>
  );
});

export interface TableBodyRenderProps {
  /**
   * Whether the table body has no rows and should display its empty state.
   * @selector [data-empty]
   */
  isEmpty: boolean,
  /**
   * Whether the Table is currently the active drop target.
   * @selector [data-drop-target]
   */
  isDropTarget: boolean
}

export interface TableBodyProps<T> extends CollectionProps<T>, StyleRenderProps<TableBodyRenderProps> {
  /** Provides content to display when there are no rows in the table. */
  renderEmptyState?: (props: TableBodyRenderProps) => ReactNode
}
/**
 * The body of a `<Table>`, containing the table rows.
 */
export const TableBody = /*#__PURE__*/ createBranchComponent('tablebody', <T extends object>(props: TableBodyProps<T>, ref: ForwardedRef<HTMLTableSectionElement>) => {
  let state = useContext(TableStateContext)!;
  let {isVirtualized} = useContext(CollectionRendererContext);
  let collection = state.collection;
  let {CollectionBranch} = useContext(CollectionRendererContext);
  let {dragAndDropHooks, dropState} = useContext(DragAndDropContext);
  let isDroppable = !!dragAndDropHooks?.useDroppableCollectionState && !dropState?.isDisabled;
  let isRootDropTarget = isDroppable && !!dropState && (dropState.isDropTarget({type: 'root'}) ?? false);

  let renderValues = {
    isDropTarget: isRootDropTarget,
    isEmpty: collection.size === 0
  };
  let renderProps = useRenderProps({
    ...props,
    id: undefined,
    children: undefined,
    defaultClassName: 'react-aria-TableBody',
    values: renderValues
  });

  let emptyState;
  let TR = useElementType('tr');
  let TD = useElementType('td');
  let numColumns = collection.columnCount;
  if (collection.size === 0 && props.renderEmptyState && state) {
    let rowProps = {};
    let rowHeaderProps = {};
    let style = {};
    if (isVirtualized) {
      rowProps['aria-rowindex'] = collection.headerRows.length + 1;
      rowHeaderProps['aria-colspan'] = numColumns;
      style = {display: 'contents'};
    } else {
      rowHeaderProps['colSpan'] = numColumns;
    }

    emptyState = (
      <TR role="row" {...rowProps} style={style}>
        <TD role="rowheader" {...rowHeaderProps} style={style}>
          {props.renderEmptyState(renderValues)}
        </TD>
      </TR>
    );
  }

  let {rowGroupProps} = useTableRowGroup();
  let TBody = useElementType('tbody');

  // TODO: TableBody doesn't support being the scrollable body of the table yet, to revisit if needed. Would need to
  // call useLoadMore here and walk up the DOM to the nearest scrollable element to set scrollRef
  return (
    <TBody
      {...mergeProps(filterDOMProps(props as any), rowGroupProps)}
      {...renderProps}
      ref={ref}
      data-empty={collection.size === 0 || undefined}>
      {isDroppable && <RootDropIndicator />}
      <CollectionBranch
        collection={collection}
        parent={collection.body}
        renderDropIndicator={useRenderDropIndicator(dragAndDropHooks, dropState)} />
      {emptyState}
    </TBody>
  );
});

export interface RowRenderProps extends ItemRenderProps {
  /** Whether the row's children have keyboard focus. */
  isFocusVisibleWithin: boolean
}

export interface RowProps<T> extends StyleRenderProps<RowRenderProps>, LinkDOMProps, HoverEvents {
  /** The unique id of the row. */
  id?: Key,
  /** A list of columns used when dynamically rendering cells. */
  columns?: Iterable<T>,
  /** The cells within the row. Supports static items or a function for dynamic rendering. */
  children?: ReactNode | ((item: T) => ReactElement),
  /** The object value that this row represents. When using dynamic collections, this is set automatically. */
  value?: T,
  /** Values that should invalidate the cell cache when using dynamic collections. */
  dependencies?: any[],
  /** A string representation of the row's contents, used for features like typeahead. */
  textValue?: string,
  /** Whether the row is disabled. */
  isDisabled?: boolean,
  /**
   * Handler that is called when a user performs an action on the row. The exact user event depends on
   * the collection's `selectionBehavior` prop and the interaction modality.
   */
  onAction?: () => void
}

/**
 * A row within a `<Table>`.
 */
export const Row = /*#__PURE__*/ createBranchComponent(
  'item',
  <T extends object>(props: RowProps<T>, forwardedRef: ForwardedRef<HTMLTableRowElement>, item: GridNode<T>) => {
    let ref = useObjectRef<HTMLTableRowElement>(forwardedRef);
    let state = useContext(TableStateContext)!;
    let {dragAndDropHooks, dragState, dropState} = useContext(DragAndDropContext);
    let {isVirtualized, CollectionBranch} = useContext(CollectionRendererContext);
    let {rowProps, ...states} = useTableRow(
      {
        node: item,
        shouldSelectOnPressUp: !!dragState,
        isVirtualized
      },
      state,
      ref
    );
    let {isFocused, isFocusVisible, focusProps} = useFocusRing();
    let {
      isFocusVisible: isFocusVisibleWithin,
      focusProps: focusWithinProps
    } = useFocusRing({within: true});
    let {hoverProps, isHovered} = useHover({
      isDisabled: !states.allowsSelection && !states.hasAction,
      onHoverStart: props.onHoverStart,
      onHoverChange: props.onHoverChange,
      onHoverEnd: props.onHoverEnd
    });

    let {checkboxProps} = useTableSelectionCheckbox(
      {key: item.key},
      state
    );

    let draggableItem: DraggableItemResult | undefined = undefined;
    if (dragState && dragAndDropHooks) {
      draggableItem = dragAndDropHooks.useDraggableItem!({key: item.key, hasDragButton: true}, dragState);
    }

    let dropIndicator: DropIndicatorAria | undefined = undefined;
    let dropIndicatorRef = useRef<HTMLDivElement>(null);
    let {visuallyHiddenProps} = useVisuallyHidden();
    if (dropState && dragAndDropHooks) {
      dropIndicator = dragAndDropHooks.useDropIndicator!({
        target: {type: 'item', key: item.key, dropPosition: 'on'}
      }, dropState, dropIndicatorRef);
    }

    let dragButtonRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
      if (dragState && !dragButtonRef.current) {
        console.warn('Draggable items in a Table must contain a <Button slot="drag"> element so that keyboard and screen reader users can drag them.');
      }
    // eslint-disable-next-line
    }, []);

    let isDragging = dragState && dragState.isDragging(item.key);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let {children: _, ...restProps} = props;
    let renderProps = useRenderProps({
      ...restProps,
      id: undefined,
      defaultClassName: 'react-aria-Row',
      values: {
        ...states,
        isHovered,
        isFocused,
        isFocusVisible,
        selectionMode: state.selectionManager.selectionMode,
        selectionBehavior: state.selectionManager.selectionBehavior,
        isDragging,
        isDropTarget: dropIndicator?.isDropTarget,
        isFocusVisibleWithin
      }
    });

    let TR = useElementType('tr');
    let TD = useElementType('td');

    return (
      <>
        {dropIndicator && !dropIndicator.isHidden && (
          <TR role="row" style={{height: 0}}>
            <TD role="gridcell" colSpan={state.collection.columnCount} style={{padding: 0}}>
              <div role="button" {...visuallyHiddenProps} {...dropIndicator.dropIndicatorProps} ref={dropIndicatorRef} />
            </TD>
          </TR>
        )}
        <TR
          {...mergeProps(filterDOMProps(props as any), rowProps, focusProps, hoverProps, draggableItem?.dragProps, focusWithinProps)}
          {...renderProps}
          ref={ref}
          data-disabled={states.isDisabled || undefined}
          data-selected={states.isSelected || undefined}
          data-hovered={isHovered || undefined}
          data-focused={states.isFocused || undefined}
          data-focus-visible={isFocusVisible || undefined}
          data-pressed={states.isPressed || undefined}
          data-dragging={isDragging || undefined}
          data-drop-target={dropIndicator?.isDropTarget || undefined}
          data-selection-mode={state.selectionManager.selectionMode === 'none' ? undefined : state.selectionManager.selectionMode}
          data-focus-visible-within={isFocusVisibleWithin || undefined}>
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
                  [DEFAULT_SLOT]: {},
                  drag: {
                    ...draggableItem?.dragButtonProps,
                    ref: dragButtonRef,
                    style: {
                      pointerEvents: 'none'
                    }
                  }
                }
              }]
            ]}>
            <CollectionBranch collection={state.collection} parent={item} />
          </Provider>
        </TR>
      </>
    );
  },
  props => {
    if (props.id == null && typeof props.children === 'function') {
      throw new Error('No id detected for the Row element. The Row element requires a id to be provided to it when the cells are rendered dynamically.');
    }

    let scope = props.columns ? props.id : undefined;
    let dependencies = [props.value].concat(props.dependencies);

    return (
      <Collection dependencies={dependencies} items={props.columns} idScope={scope}>
        {props.children}
      </Collection>
    );
  }
);

export interface CellRenderProps {
  /**
   * Whether the cell is currently in a pressed state.
   * @selector [data-pressed]
   */
  isPressed: boolean,
  /**
   * Whether the cell is currently focused.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the cell is currently keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the cell is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean
}

export interface CellProps extends RenderProps<CellRenderProps> {
  /** The unique id of the cell. */
  id?: Key,
  /** A string representation of the cell's contents, used for features like typeahead. */
  textValue?: string
}

/**
 * A cell within a table row.
 */
export const Cell = /*#__PURE__*/ createLeafComponent('cell', (props: CellProps, forwardedRef: ForwardedRef<HTMLTableCellElement>, cell: GridNode<unknown>) => {
  let ref = useObjectRef<HTMLTableCellElement>(forwardedRef);
  let state = useContext(TableStateContext)!;
  let {dragState} = useContext(DragAndDropContext);
  let {isVirtualized} = useContext(CollectionRendererContext);

  cell.column = state.collection.columns[cell.index];

  let {gridCellProps, isPressed} = useTableCell({
    node: cell,
    shouldSelectOnPressUp: !!dragState,
    isVirtualized
  }, state, ref);
  let {isFocused, isFocusVisible, focusProps} = useFocusRing();
  let {hoverProps, isHovered} = useHover({});

  let renderProps = useRenderProps({
    ...props,
    id: undefined,
    defaultClassName: 'react-aria-Cell',
    values: {
      isFocused,
      isFocusVisible,
      isPressed,
      isHovered
    }
  });

  let TD = useElementType('td');

  return (
    <TD
      {...mergeProps(filterDOMProps(props as any), gridCellProps, focusProps, hoverProps)}
      {...renderProps}
      ref={ref}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-pressed={isPressed || undefined}>
      <CollectionRendererContext.Provider value={DefaultCollectionRenderer}>
        {renderProps.children}
      </CollectionRendererContext.Provider>
    </TD>
  );
});

function TableDropIndicatorWrapper(props: DropIndicatorProps, ref: ForwardedRef<HTMLElement>) {
  ref = useObjectRef(ref);
  let {dragAndDropHooks, dropState} = useContext(DragAndDropContext)!;
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
    <TableDropIndicatorForwardRef {...props} dropIndicatorProps={dropIndicatorProps} isDropTarget={isDropTarget} buttonRef={buttonRef} ref={ref} />
  );
}

interface TableDropIndicatorProps extends DropIndicatorProps {
  dropIndicatorProps: React.HTMLAttributes<HTMLElement>,
  isDropTarget: boolean,
  buttonRef: RefObject<HTMLDivElement | null>
}

function TableDropIndicator(props: TableDropIndicatorProps, ref: ForwardedRef<HTMLElement>) {
  let {
    dropIndicatorProps,
    isDropTarget,
    buttonRef,
    ...otherProps
  } = props;

  let state = useContext(TableStateContext)!;
  let {visuallyHiddenProps} = useVisuallyHidden();
  let renderProps = useRenderProps({
    ...otherProps,
    defaultClassName: 'react-aria-DropIndicator',
    values: {
      isDropTarget
    }
  });

  let TR = useElementType('tr');
  let TD = useElementType('td');

  return (
    <TR
      {...filterDOMProps(props as any)}
      {...renderProps}
      role="row"
      ref={ref as RefObject<HTMLTableRowElement | null>}
      data-drop-target={isDropTarget || undefined}>
      <TD
        role="gridcell"
        colSpan={state.collection.columnCount}
        style={{padding: 0}}>
        <div {...visuallyHiddenProps} role="button" {...dropIndicatorProps} ref={buttonRef} />
        {renderProps.children}
      </TD>
    </TR>
  );
}

const TableDropIndicatorForwardRef = forwardRef(TableDropIndicator);

function RootDropIndicator() {
  let state = useContext(TableStateContext)!;
  let {dragAndDropHooks, dropState} = useContext(DragAndDropContext);
  let ref = useRef<HTMLDivElement>(null);
  let {dropIndicatorProps} = dragAndDropHooks!.useDropIndicator!({
    target: {type: 'root'}
  }, dropState!, ref);
  let isDropTarget = dropState!.isDropTarget({type: 'root'});
  let {visuallyHiddenProps} = useVisuallyHidden();
  let TR = useElementType('tr');
  let TD = useElementType('td');

  if (!isDropTarget && dropIndicatorProps['aria-hidden']) {
    return null;
  }

  return (
    <TR
      role="row"
      aria-hidden={dropIndicatorProps['aria-hidden']}
      style={{height: 0}}>
      <TD
        role="gridcell"
        colSpan={state.collection.columnCount}
        style={{padding: 0}}>
        <div role="button" {...visuallyHiddenProps} {...dropIndicatorProps} ref={ref} />
      </TD>
    </TR>
  );
}

export interface TableLoadingIndicatorProps extends StyleProps {
  children?: ReactNode
}

export const UNSTABLE_TableLoadingIndicator = createLeafComponent('loader', function TableLoadingIndicator<T extends object>(props: TableLoadingIndicatorProps, ref: ForwardedRef<HTMLTableRowElement>, item: Node<T>) {
  let state = useContext(TableStateContext)!;
  let {isVirtualized} = useContext(CollectionRendererContext);
  let numColumns = state.collection.columns.length;

  let renderProps = useRenderProps({
    ...props,
    id: undefined,
    children: item.rendered,
    defaultClassName: 'react-aria-TableLoadingIndicator',
    values: null
  });
  let TR = useElementType('tr');
  let TD = useElementType('td');
  let rowProps = {};
  let rowHeaderProps = {};
  let style = {};

  if (isVirtualized) {
    rowProps['aria-rowindex'] = state.collection.headerRows.length + state.collection.size ;
    rowHeaderProps['aria-colspan'] = numColumns;
    style = {display: 'contents'};
  } else {
    rowHeaderProps['colSpan'] = numColumns;
  }

  return (
    <>
      <TR
        role="row"
        ref={ref}
        {...mergeProps(filterDOMProps(props as any), rowProps)}
        {...renderProps}>
        <TD role="rowheader" {...rowHeaderProps} style={style}>
          {renderProps.children}
        </TD>
      </TR>
    </>
  );
});
