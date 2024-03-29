import {AriaLabelingProps, HoverEvents, Key, LinkDOMProps} from '@react-types/shared';
import {BaseCollection, CollectionContext, CollectionProps, CollectionRendererContext, ItemRenderProps, NodeValue, useCachedChildren, useCollection, useCollectionChildren, useSSRCollectionNode} from './Collection';
import {buildHeaderRows, TableColumnResizeState} from '@react-stately/table';
import {ButtonContext} from './Button';
import {CheckboxContext} from './Checkbox';
import {ColumnSize, ColumnStaticSize, TableCollection as ITableCollection, TableProps as SharedTableProps} from '@react-types/table';
import {ContextValue, DEFAULT_SLOT, DOMProps, forwardRefType, Provider, RenderProps, ScrollableProps, SlotProps, StyleProps, StyleRenderProps, useContextProps, useRenderProps} from './utils';
import {DisabledBehavior, DraggableCollectionState, DroppableCollectionState, Node, SelectionBehavior, SelectionMode, SortDirection, TableState, useTableColumnResizeState, useTableState} from 'react-stately';
import {DragAndDropContext, DragAndDropHooks, DropIndicator, DropIndicatorContext, DropIndicatorProps} from './useDragAndDrop';
import {DraggableItemResult, DragPreviewRenderer, DropIndicatorAria, DroppableCollectionResult, FocusScope, ListKeyboardDelegate, mergeProps, useFocusRing, useHover, useLocale, useLocalizedStringFormatter, useTable, useTableCell, useTableColumnHeader, useTableColumnResize, useTableHeaderRow, useTableRow, useTableRowGroup, useTableSelectAllCheckbox, useTableSelectionCheckbox, useVisuallyHidden} from 'react-aria';
import {filterDOMProps, useLayoutEffect, useObjectRef, useResizeObserver} from '@react-aria/utils';
import {GridNode} from '@react-types/grid';
// @ts-ignore
import intlMessages from '../intl/*.json';
import React, {createContext, ForwardedRef, forwardRef, JSX, ReactElement, ReactNode, RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import ReactDOM from 'react-dom';

class TableCollection<T> extends BaseCollection<T> implements ITableCollection<T> {
  headerRows: GridNode<T>[] = [];
  columns: GridNode<T>[] = [];
  rowHeaderColumnKeys: Set<Key> = new Set();
  head: NodeValue<T> = new NodeValue('tableheader', -1);
  body: NodeValue<T> = new NodeValue('tablebody', -2);
  columnsDirty = true;

  addNode(node: NodeValue<T>) {
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

  get rows() {
    return [...this.getChildren(this.body.key)];
  }

  *[Symbol.iterator]() {
    yield* this.getChildren(this.body.key);
  }

  get size() {
    return [...this.getChildren(this.body.key)].length;
  }

  getFirstKey() {
    return [...this.getChildren(this.body.key)][0]?.key;
  }

  getLastKey() {
    let rows = [...this.getChildren(this.body.key)];
    return rows[rows.length - 1]?.key;
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

function ResizableTableContainer(props: ResizableTableContainerProps, ref: ForwardedRef<HTMLDivElement>) {
  let objectRef = useObjectRef(ref);
  let [width, setWidth] = useState(0);
  useResizeObserver({
    ref: objectRef,
    onResize() {
      setWidth(objectRef.current?.clientWidth ?? 0);
    }
  });

  useLayoutEffect(() => {
    setWidth(objectRef.current?.clientWidth ?? 0);
  }, [objectRef]);

  let ctx = useMemo(() => ({
    tableWidth: width,
    useTableColumnResizeState,
    onResizeStart: props.onResizeStart,
    onResize: props.onResize,
    onResizeEnd: props.onResizeEnd
  }), [width, props.onResizeStart, props.onResize, props.onResizeEnd]);

  return (
    <div
      {...filterDOMProps(props as any)}
      ref={objectRef}
      className={props.className || 'react-aria-ResizableTableContainer'}
      style={props.style}
      onScroll={props.onScroll}>
      <ResizableTableContainerContext.Provider value={ctx}>
        {props.children}
      </ResizableTableContainerContext.Provider>
    </div>
  );
}

const _ResizableTableContainer = forwardRef(ResizableTableContainer);
export {_ResizableTableContainer as ResizableTableContainer};

export const TableContext = createContext<ContextValue<TableProps, HTMLTableElement>>(null);
export const TableStateContext = createContext<TableState<unknown> | null>(null);
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

function Table(props: TableProps, ref: ForwardedRef<HTMLTableElement>) {
  [props, ref] = useContextProps(props, ref, TableContext);
  let initialCollection = useMemo(() => new TableCollection<any>(), []);
  let {portal, collection} = useCollection(props, initialCollection);
  let state = useTableState({
    ...props,
    collection,
    children: undefined
  });

  let {gridProps} = useTable(props, state, ref);

  let {dragAndDropHooks} = props;
  let selectionManager = state.selectionManager;
  let isListDraggable = !!dragAndDropHooks?.useDraggableCollectionState;
  let isListDroppable = !!dragAndDropHooks?.useDroppableCollectionState;
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

    let keyboardDelegate = new ListKeyboardDelegate(
      collection,
      selectionManager.disabledBehavior === 'selection' ? new Set() : selectionManager.disabledKeys,
      ref
    );
    let dropTargetDelegate = dragAndDropHooks.dropTargetDelegate || new dragAndDropHooks.ListDropTargetDelegate(collection, ref);
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

  let {selectionBehavior, selectionMode, disallowEmptySelection} = state.selectionManager;
  let ctx = useMemo(() => ({
    selectionBehavior: selectionMode === 'none' ? null : selectionBehavior,
    selectionMode,
    disallowEmptySelection,
    allowsDragging: isListDraggable
  }), [selectionBehavior, selectionMode, disallowEmptySelection, isListDraggable]);

  let style = renderProps.style;
  let tableContainerContext = useContext(ResizableTableContainerContext);
  let layoutState: TableColumnResizeState<unknown> | null = null;
  if (tableContainerContext) {
    layoutState = tableContainerContext.useTableColumnResizeState({
      tableWidth: tableContainerContext.tableWidth
    }, state);
    style = {
      ...style,
      tableLayout: 'fixed',
      width: 'fit-content'
    };
  }

  return (
    <>
      <TableOptionsContext.Provider value={ctx}>
        {portal}
      </TableOptionsContext.Provider>
      <Provider
        values={[
          [TableStateContext, state],
          [TableColumnResizeStateContext, layoutState],
          [DragAndDropContext, {dragAndDropHooks, dragState, dropState}],
          [DropIndicatorContext, {render: TableDropIndicatorWrapper}]
        ]}>
        <FocusScope>
          <table
            {...filterDOMProps(props)}
            {...renderProps}
            {...mergeProps(gridProps, focusProps, droppableCollection?.collectionProps)}
            style={style}
            ref={ref}
            slot={props.slot || undefined}
            onScroll={props.onScroll}
            data-allows-dragging={isListDraggable || undefined}
            data-drop-target={isRootDropTarget || undefined}
            data-focused={isFocused || undefined}
            data-focus-visible={isFocusVisible || undefined}>
            <TableHeaderRowGroup collection={collection} />
            <TableBodyRowGroup collection={collection} isDroppable={isListDroppable} />
          </table>
        </FocusScope>
        {dragPreview}
      </Provider>
    </>
  );
}

/**
 * A table displays data in rows and columns and enables a user to navigate its contents via directional navigation keys,
 * and optionally supports row selection and sorting.
 */
const _Table = forwardRef(Table);
export {_Table as Table};

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

export interface TableHeaderProps<T> extends StyleProps {
  /** A list of table columns. */
  columns?: T[],
  /** A list of `Column(s)` or a function. If the latter, a list of columns must be provided using the `columns` prop. */
  children?: ReactNode | ((item: T) => ReactElement),
  /** Values that should invalidate the column cache when using dynamic collections. */
  dependencies?: any[]
}

function TableHeader<T extends object>(props: TableHeaderProps<T>, ref: ForwardedRef<HTMLTableSectionElement>) {
  let children = useCollectionChildren({
    children: props.children,
    items: props.columns,
    dependencies: props.dependencies
  });

  let renderer = typeof props.children === 'function' ? props.children : null;
  return (
    <CollectionRendererContext.Provider value={renderer}>
      {useSSRCollectionNode('tableheader', props, ref, null, children)}
    </CollectionRendererContext.Provider>
  );
}

/**
 * A header within a `<Table>`, containing the table columns.
 */
const _TableHeader = /*#__PURE__*/ (forwardRef as forwardRefType)(TableHeader);
export {_TableHeader as TableHeader};

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

function Column(props: ColumnProps, ref: ForwardedRef<HTMLTableCellElement>): JSX.Element | null {
  return useSSRCollectionNode('column', props, ref, props.children);
}

/**
 * A column within a `<Table>`.
 */
const _Column = /*#__PURE__*/ (forwardRef as forwardRefType)(Column);
export {_Column as Column};

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

function TableBody<T extends object>(props: TableBodyProps<T>, ref: ForwardedRef<HTMLTableSectionElement>): JSX.Element | null {
  let children = useCollectionChildren(props);
  return useSSRCollectionNode('tablebody', props, ref, null, children);
}

/**
 * The body of a `<Table>`, containing the table rows.
 */
const _TableBody = /*#__PURE__*/ (forwardRef as forwardRefType)(TableBody);
export {_TableBody as TableBody};

export interface RowRenderProps extends ItemRenderProps {}

export interface RowProps<T> extends StyleRenderProps<RowRenderProps>, LinkDOMProps {
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
  textValue?: string
}

function Row<T extends object>(props: RowProps<T>, ref: ForwardedRef<HTMLTableRowElement>): JSX.Element | null {
  let dependencies = [props.value].concat(props.dependencies);
  let children = useCollectionChildren({
    dependencies,
    children: props.children,
    items: props.columns,
    idScope: props.id
  });

  let ctx = useMemo(() => ({idScope: props.id, dependencies}), [props.id, ...dependencies]);

  return useSSRCollectionNode('item', props, ref, null, (
    <CollectionContext.Provider value={ctx}>
      {children}
    </CollectionContext.Provider>
  ));
}

/**
 * A row within a `<Table>`.
 */
const _Row = /*#__PURE__*/ (forwardRef as forwardRefType)(Row);
export {_Row as Row};

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

function Cell(props: CellProps, ref: ForwardedRef<HTMLTableCellElement>): JSX.Element | null {
  return useSSRCollectionNode('cell', props, ref, props.children);
}

/**
 * A cell within a table row.
 */
const _Cell = /*#__PURE__*/ (forwardRef as forwardRefType)(Cell);
export {_Cell as Cell};

function TableHeaderRowGroup<T>({collection}: {collection: TableCollection<T>}) {
  let headerRows = useCachedChildren({
    items: collection.headerRows,
    children: useCallback((item: Node<T>) => {
      switch (item.type) {
        case 'headerrow':
          return <TableHeaderRow item={item} />;
        default:
          throw new Error('Unsupported node type in TableHeader: ' + item.type);
      }
    }, [])
  });

  let {rowGroupProps} = useTableRowGroup();
  return (
    <thead
      {...filterDOMProps(collection.head.props)}
      {...rowGroupProps}
      ref={collection.head.props.ref}
      className={collection.head.props.className ?? 'react-aria-TableHeader'}
      style={collection.head.props.style}>
      {headerRows}
    </thead>
  );
}

function TableBodyRowGroup<T>(props: {collection: TableCollection<T>, isDroppable: boolean}) {
  let {collection, isDroppable} = props;
  let bodyRows = useCachedChildren({
    items: collection.rows,
    children: useCallback((item: Node<T>) => {
      switch (item.type) {
        case 'item':
          return <TableRow item={item} />;
        default:
          throw new Error('Unsupported node type in TableBody: ' + item.type);
      }
    }, [])
  });

  let state = useContext(TableStateContext);
  let {dropState} = useContext(DragAndDropContext);
  let isRootDropTarget = isDroppable && !!dropState && (dropState.isDropTarget({type: 'root'}) ?? false);

  let bodyProps: TableBodyProps<T> = collection.body.props;
  let renderValues = {
    isDropTarget: isRootDropTarget,
    isEmpty: collection.size === 0
  };
  let renderProps = useRenderProps({
    ...bodyProps,
    id: undefined,
    children: undefined,
    defaultClassName: 'react-aria-TableBody',
    values: renderValues
  });

  let emptyState;
  if (collection.size === 0 && bodyProps.renderEmptyState && state) {
    emptyState = (
      <tr role="row">
        <td role="gridcell" colSpan={collection.columnCount}>
          {bodyProps.renderEmptyState(renderValues)}
        </td>
      </tr>
    );
  }

  let {rowGroupProps} = useTableRowGroup();
  return (
    <tbody
      {...mergeProps(filterDOMProps(bodyProps as any), rowGroupProps)}
      {...renderProps}
      ref={collection.body.props.ref}
      data-empty={collection.size === 0 || undefined}>
      {isDroppable && <RootDropIndicator />}
      {bodyRows}
      {emptyState}
    </tbody>
  );
}

function TableHeaderRow<T>({item}: {item: GridNode<T>}) {
  let ref = useRef<HTMLTableRowElement>(null);
  let state = useContext(TableStateContext)!;
  let {rowProps} = useTableHeaderRow({node: item}, state, ref);
  let {checkboxProps} = useTableSelectAllCheckbox(state);

  let cells = useCachedChildren({
    items: state.collection.getChildren!(item.key),
    children: (item) => {
      switch (item.type) {
        case 'column':
          return <TableColumnHeader column={item} />;
        default:
          throw new Error('Unsupported node type in Row: ' + item.type);
      }
    }
  });

  return (
    <tr {...rowProps} ref={ref}>
      <Provider
        values={[
          [CheckboxContext, {
            slots: {
              selection: checkboxProps
            }
          }]
        ]}>
        {cells}
      </Provider>
    </tr>
  );
}

interface ColumnResizerContextValue {
  column: GridNode<unknown>,
  triggerRef: RefObject<HTMLDivElement>
}

const ColumnResizerContext = createContext<ColumnResizerContextValue | null>(null);

function TableColumnHeader<T>({column}: {column: GridNode<T>}) {
  let ref = useObjectRef<HTMLTableHeaderCellElement>(column.props.ref);
  let state = useContext(TableStateContext)!;
  let {columnHeaderProps} = useTableColumnHeader(
    {node: column},
    state,
    ref
  );
  let {isFocused, isFocusVisible, focusProps} = useFocusRing();

  let layoutState = useContext(TableColumnResizeStateContext);
  let isResizing = false;
  if (layoutState) {
    isResizing = layoutState.resizingColumn === column.key;
  } else {
    if (process.env.NODE_ENV !== 'production') {
      for (let prop in ['width', 'defaultWidth', 'minWidth', 'maxWidth']) {
        if (prop in column.props) {
          console.warn(`The ${prop} prop on a <Column> only applies when a <Table> is wrapped in a <ResizableTableContainer>. If you aren't using column resizing, you can set the width of a column with CSS.`);
        }
      }
    }
  }

  let props: ColumnProps = column.props;
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

  return (
    <th
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
      <ColumnResizerContext.Provider value={{column, triggerRef: ref}}>
        {renderProps.children}
      </ColumnResizerContext.Provider>
    </th>
  );
}

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

function ColumnResizer(props: ColumnResizerProps, ref: ForwardedRef<HTMLDivElement>) {
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
}

const _ColumnResizer = forwardRef(ColumnResizer);
export {_ColumnResizer as ColumnResizer};

function TableRow<T>({item}: {item: GridNode<T>}) {
  let ref = useObjectRef<HTMLTableRowElement>(item.props.ref);
  let state = useContext(TableStateContext)!;
  let {dragAndDropHooks, dragState, dropState} = useContext(DragAndDropContext);
  let {rowProps, ...states} = useTableRow(
    {
      node: item,
      shouldSelectOnPressUp: !!dragState
    },
    state,
    ref
  );
  let {isFocused, isFocusVisible, focusProps} = useFocusRing();
  let {hoverProps, isHovered} = useHover({
    isDisabled: !states.allowsSelection && !states.hasAction
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

  let renderDropIndicator = dragAndDropHooks?.renderDropIndicator || (target => <DropIndicator target={target} />);
  let dragButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (dragState && !dragButtonRef.current) {
        console.warn('Draggable items in a Table must contain a <Button slot="drag"> element so that keyboard and screen reader users can drag them.');
      }
    }
  // eslint-disable-next-line
  }, []);

  let props = item.props as RowProps<unknown>;
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
      isDropTarget: dropIndicator?.isDropTarget
    }
  });

  let cells = useCachedChildren({
    items: state.collection.getChildren!(item.key),
    children: (item: Node<unknown>) => {
      switch (item.type) {
        case 'cell':
          return <TableCell cell={item} />;
        default:
          throw new Error('Unsupported node type in Row: ' + item.type);
      }
    }
  });

  return (
    <>
      {dragAndDropHooks?.useDropIndicator &&
        renderDropIndicator({type: 'item', key: item.key, dropPosition: 'before'})
      }
      {dropIndicator && !dropIndicator.isHidden && (
        <tr role="row" style={{height: 0}}>
          <td role="gridcell" colSpan={state.collection.columnCount} style={{padding: 0}}>
            <div role="button" {...visuallyHiddenProps} {...dropIndicator.dropIndicatorProps} ref={dropIndicatorRef} />
          </td>
        </tr>
      )}
      <tr
        {...mergeProps(filterDOMProps(props as any), rowProps, focusProps, hoverProps, draggableItem?.dragProps)}
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
        data-selection-mode={state.selectionManager.selectionMode === 'none' ? undefined : state.selectionManager.selectionMode}>
        <Provider
          values={[
            [CheckboxContext, {
              slots: {
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
          {cells}
        </Provider>
      </tr>
      {dragAndDropHooks?.useDropIndicator && state.collection.getKeyAfter(item.key) == null &&
        renderDropIndicator({type: 'item', key: item.key, dropPosition: 'after'})
      }
    </>
  );
}

function TableCell<T>({cell}: {cell: GridNode<T>}) {
  let ref = useObjectRef<HTMLTableCellElement>(cell.props.ref);
  let state = useContext(TableStateContext)!;
  let {dragState} = useContext(DragAndDropContext);

  // @ts-ignore
  cell.column = state.collection.columns[cell.index];

  let {gridCellProps, isPressed} = useTableCell({
    node: cell,
    shouldSelectOnPressUp: !!dragState
  }, state, ref);
  let {isFocused, isFocusVisible, focusProps} = useFocusRing();
  let {hoverProps, isHovered} = useHover({});

  let props: CellProps = cell.props;
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

  return (
    <td
      {...mergeProps(filterDOMProps(props as any), gridCellProps, focusProps, hoverProps)}
      {...renderProps}
      ref={ref}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-pressed={isPressed || undefined}>
      {renderProps.children}
    </td>
  );
}

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
  buttonRef: RefObject<HTMLDivElement>
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

  return (
    <tr
      {...filterDOMProps(props as any)}
      {...renderProps}
      role="row"
      ref={ref as RefObject<HTMLTableRowElement>}
      data-drop-target={isDropTarget || undefined}>
      <td
        role="gridcell"
        colSpan={state.collection.columnCount}
        style={{padding: 0}}>
        <div {...visuallyHiddenProps} role="button" {...dropIndicatorProps} ref={buttonRef} />
        {renderProps.children}
      </td>
    </tr>
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

  if (!isDropTarget && dropIndicatorProps['aria-hidden']) {
    return null;
  }

  return (
    <tr
      role="row"
      aria-hidden={dropIndicatorProps['aria-hidden']}
      style={{height: 0}}>
      <td
        role="gridcell"
        colSpan={state.collection.columnCount}
        style={{padding: 0}}>
        <div role="button" {...visuallyHiddenProps} {...dropIndicatorProps} ref={ref} />
      </td>
    </tr>
  );
}
