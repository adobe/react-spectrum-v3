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

import {
  Button,
  CellRenderProps,
  Collection,
  ColumnRenderProps,
  ColumnResizer,
  ContextValue,
  Key,
  Provider,
  Cell as RACCell,
  CellProps as RACCellProps,
  CheckboxContext as RACCheckboxContext,
  Column as RACColumn,
  ColumnProps as RACColumnProps,
  Row as RACRow,
  RowProps as RACRowProps,
  Table as RACTable,
  TableBody as RACTableBody,
  TableBodyProps as RACTableBodyProps,
  TableHeader as RACTableHeader,
  TableHeaderProps as RACTableHeaderProps,
  TableProps as RACTableProps,
  ResizableTableContainer,
  RowRenderProps,
  TableBodyRenderProps,
  TableRenderProps,
  UNSTABLE_TableLayout,
  UNSTABLE_TableLoadingIndicator,
  UNSTABLE_Virtualizer,
  useSlottedContext,
  useTableOptions
} from 'react-aria-components';
import {centerPadding, getAllowedOverrides, StylesPropWithHeight, UnsafeStyles} from './style-utils' with {type: 'macro'};
import {Checkbox} from './Checkbox';
import Chevron from '../ui-icons/Chevron';
import {colorMix, focusRing, fontRelative, lightDark, space, style} from '../style' with {type: 'macro'};
import {ColumnSize} from '@react-types/table';
import {DOMRef, DOMRefValue, forwardRefType, LoadingState, Node} from '@react-types/shared';
import {GridNode} from '@react-types/grid';
import {IconContext} from './Icon';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {LayoutNode} from '@react-stately/layout';
import {Menu, MenuItem, MenuSection, MenuTrigger} from './Menu';
import {mergeStyles} from '../style/runtime';
import Nubbin from '../ui-icons/S2_MoveHorizontalTableWidget.svg';
import {ProgressCircle} from './ProgressCircle';
import {raw} from '../style/style-macro' with {type: 'macro'};
import React, {createContext, forwardRef, ReactElement, ReactNode, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {Rect} from '@react-stately/virtualizer';
import SortDownArrow from '../s2wf-icons/S2_Icon_SortDown_20_N.svg';
import SortUpArrow from '../s2wf-icons/S2_Icon_SortUp_20_N.svg';
import {useActionBarContainer} from './ActionBar';
import {useDOMRef} from '@react-spectrum/utils';
import {useLoadMore} from '@react-aria/utils';
import {useLocalizedStringFormatter} from '@react-aria/i18n';
import {useScale} from './utils';
import {useSpectrumContextProps} from './useSpectrumContextProps';
import {VisuallyHidden} from 'react-aria';

interface S2TableProps {
  /** Whether the Table should be displayed with a quiet style. */
  isQuiet?: boolean,
  /**
   * Sets the amount of vertical padding within each cell.
   * @default 'regular'
   */
  density?: 'compact' | 'spacious' | 'regular',
  /**
   * Sets the overflow behavior for the cell contents.
   * @default 'truncate'
   */
  overflowMode?: 'wrap' | 'truncate',
  // TODO: will we contine with onAction or rename to onRowAction like it is in RAC?
  /** Handler that is called when a user performs an action on a row. */
  onAction?: (key: Key) => void,
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
  onResizeEnd?: (widths: Map<Key, ColumnSize>) => void,
  /** The current loading state of the table. */
  loadingState?: LoadingState,
  /** Handler that is called when more items should be loaded, e.g. while scrolling near the bottom. */
  onLoadMore?: () => any,
  /** Provides the ActionBar to display when rows are selected in the TableView. */
  renderActionBar?: (selectedKeys: 'all' | Set<Key>) => ReactElement
}

// TODO: Note that loadMore and loadingState are now on the Table instead of on the TableBody
export interface TableViewProps extends Omit<RACTableProps, 'style' | 'disabledBehavior' | 'className' | 'onRowAction' | 'selectionBehavior' | 'onScroll' | 'onCellAction' | 'dragAndDropHooks'>, UnsafeStyles, S2TableProps {
  /** Spectrum-defined styles, returned by the `style()` macro. */
  styles?: StylesPropWithHeight
}

let InternalTableContext = createContext<TableViewProps & {layout?: S2TableLayout<unknown>, setIsInResizeMode?:(val: boolean) => void, isInResizeMode?: boolean}>({});

const tableWrapper = style({
  minHeight: 0,
  minWidth: 0,
  display: 'flex',
  isolation: 'isolate',
  disableTapHighlight: true,
  position: 'relative',
  // Clip ActionBar animation.
  overflow: 'clip'
});

const table = style<TableRenderProps & S2TableProps & {isCheckboxSelection?: boolean}>({
  width: 'full',
  userSelect: 'none',
  minHeight: 0,
  minWidth: 0,
  fontFamily: 'sans',
  fontWeight: 'normal',
  overflow: 'auto',
  backgroundColor: {
    default: 'gray-25',
    isQuiet: 'transparent',
    forcedColors: 'Background'
  },
  borderColor: 'gray-300',
  borderStyle: 'solid',
  borderWidth: {
    default: 1,
    isQuiet: 0
  },
  ...focusRing(),
  outlineOffset: -1, // Cover the border
  borderRadius: {
    default: '[6px]',
    isQuiet: 'none'
  },
  // Multiple browser bugs from scrollIntoView and scrollPadding:
  // Bug: Table doesn't scroll items into view perfectly in Chrome
  // https://issues.chromium.org/issues/365913982
  // Bug: Table scrolls to the left when navigating up/down through the checkboxes when body is scrolled to the right.
  // https://issues.chromium.org/issues/40067778
  // https://bugs.webkit.org/show_bug.cgi?id=272799
  // Base reproduction: https://codepen.io/lfdanlu/pen/zYVVGPW
  scrollPaddingTop: 32,
  scrollPaddingStart: {
    isCheckboxSelection: 40
  }
}, getAllowedOverrides({height: true}));

// component-height-100
const DEFAULT_HEADER_HEIGHT = {
  medium: 32,
  large: 40
};

const ROW_HEIGHTS = {
  compact: {
    medium: 32, // table-row-height-medium-compact (aka component-height-100)
    large: 40
  },
  regular: {
    medium: 40, // table-row-height-medium-regular
    large: 50
  },
  spacious: {
    medium: 48, // table-row-height-medium-spacious
    large: 60
  }
};

export class S2TableLayout<T> extends UNSTABLE_TableLayout<T> {
  constructor(options) {
    super({...options, loaderHeight: 60});
  }

  protected isStickyColumn(node: GridNode<T>): boolean {
    return node.props.isSticky;
  }

  protected buildCollection(): LayoutNode[] {
    let [header, body] = super.buildCollection();
    let {children, layoutInfo} = body;
    // TableLayout's buildCollection always sets the body width to the max width between the header width, but
    // we want the body to be sticky and only as wide as the table so it is always in view if loading/empty
    if (children?.length === 0) {
      layoutInfo.rect.width = this.virtualizer!.visibleRect.width - 80;
    }

    return [
      header,
      body
    ];
  }

  protected buildLoader(node: Node<T>, x: number, y: number): LayoutNode {
    let layoutNode = super.buildLoader(node, x, y);
    let {layoutInfo} = layoutNode;
    layoutInfo.allowOverflow = true;
    layoutInfo.rect.width = this.virtualizer!.visibleRect.width;
    layoutInfo.isSticky = true;
    return layoutNode;
  }

  protected buildBody(y: number): LayoutNode {
    let layoutNode = super.buildBody(y);
    let {children, layoutInfo} = layoutNode;
    // Needs overflow for sticky loader
    layoutInfo.allowOverflow = true;
    // If loading or empty, we'll want the body to be sticky and centered
    if (children?.length === 0) {
      layoutInfo.rect = new Rect(40, 40, this.virtualizer!.visibleRect.width - 80, this.virtualizer!.visibleRect.height - 80);
      layoutInfo.isSticky = true;
    }

    return {...layoutNode, layoutInfo};
  }

  protected buildRow(node: GridNode<T>, x: number, y: number): LayoutNode {
    let layoutNode = super.buildRow(node, x, y);
    layoutNode.layoutInfo.allowOverflow = true;
    // Needs overflow for sticky selection/drag cells
    return layoutNode;
  }

  protected buildTableHeader(): LayoutNode {
    let layoutNode = super.buildTableHeader();
    // Needs overflow for sticky selection/drag column
    layoutNode.layoutInfo.allowOverflow = true;
    return layoutNode;
  }

  protected buildColumn(node: GridNode<T>, x: number, y: number): LayoutNode {
    let layoutNode = super.buildColumn(node, x, y);
    // Needs overflow for the resize handle
    layoutNode.layoutInfo.allowOverflow = true;
    return layoutNode;
  }
}

export const TableContext = createContext<ContextValue<Partial<TableViewProps>, DOMRefValue<HTMLDivElement>>>(null);

/**
 * Tables are containers for displaying information. They allow users to quickly scan, sort, compare, and take action on large amounts of data.
 */
export const TableView = forwardRef(function TableView(props: TableViewProps, ref: DOMRef<HTMLDivElement>) {
  [props, ref] = useSpectrumContextProps(props, ref, TableContext);
  let {
    UNSAFE_style,
    UNSAFE_className,
    isQuiet = false,
    density = 'regular',
    overflowMode = 'truncate',
    styles,
    loadingState,
    onLoadMore,
    onResize: propsOnResize,
    onResizeStart: propsOnResizeStart,
    onResizeEnd: propsOnResizeEnd,
    onAction,
    ...otherProps
  } = props;

  let domRef = useDOMRef(ref);
  let scale = useScale();
  let layout = useMemo(() => {
    return new S2TableLayout({
      rowHeight: overflowMode === 'wrap'
        ? undefined
        : ROW_HEIGHTS[density][scale],
      estimatedRowHeight: overflowMode === 'wrap'
      ? ROW_HEIGHTS[density][scale]
      : undefined,
      // No need for estimated headingHeight since the headers aren't affected by overflow mode: wrap
      headingHeight: DEFAULT_HEADER_HEIGHT[scale]
    });
  }, [overflowMode, density, scale]);

  // Starts when the user selects resize from the menu, ends when resizing ends
  // used to control the visibility of the resizer Nubbin
  let [isInResizeMode, setIsInResizeMode] = useState(false);
  let onResizeStart = useCallback((widths) => {
    propsOnResizeStart?.(widths);
  }, [propsOnResizeStart]);
  let onResizeEnd = useCallback((widths) => {
    setIsInResizeMode(false);
    propsOnResizeEnd?.(widths);
  }, [propsOnResizeEnd, setIsInResizeMode]);

  let context = useMemo(() => ({
    isQuiet,
    density,
    overflowMode,
    loadingState,
    isInResizeMode,
    setIsInResizeMode
  }), [isQuiet, density, overflowMode, loadingState, isInResizeMode, setIsInResizeMode]);

  let isLoading = loadingState === 'loading' || loadingState === 'loadingMore';
  let scrollRef = useRef<HTMLElement | null>(null);
  let memoedLoadMoreProps = useMemo(() => ({
    isLoading: isLoading,
    onLoadMore
  }), [isLoading, onLoadMore]);
  useLoadMore(memoedLoadMoreProps, scrollRef);
  let isCheckboxSelection = props.selectionMode === 'multiple' || props.selectionMode === 'single';

  let {selectedKeys, onSelectionChange, actionBar, actionBarHeight} = useActionBarContainer({...props, scrollRef});

  return (
    <ResizableTableContainer
      // TODO: perhaps this ref should be attached to the RACTable but it expects a table type ref which isn't true in the virtualized case
      ref={domRef}
      onResize={propsOnResize}
      onResizeEnd={onResizeEnd}
      onResizeStart={onResizeStart}
      className={(UNSAFE_className || '') + mergeStyles(tableWrapper, styles)}
      style={UNSAFE_style}>
      <UNSTABLE_Virtualizer layout={layout}>
        <InternalTableContext.Provider value={context}>
          <RACTable
            ref={scrollRef as any}
            style={{
              // Fix webkit bug where scrollbars appear above the checkboxes/other table elements
              WebkitTransform: 'translateZ(0)',
              // Add padding at the bottom when the action bar is visible so users can scroll to the last items.
              // Also add scroll padding so navigating with the keyboard doesn't go behind the action bar.
              paddingBottom: actionBarHeight > 0 ? actionBarHeight + 8 : 0,
              scrollPaddingBottom: actionBarHeight > 0 ? actionBarHeight + 8 : 0
            }}
            className={renderProps => table({
              ...renderProps,
              isCheckboxSelection,
              isQuiet
            })}
            selectionBehavior="toggle"
            onRowAction={onAction}
            {...otherProps}
            selectedKeys={selectedKeys}
            defaultSelectedKeys={undefined}
            onSelectionChange={onSelectionChange} />
        </InternalTableContext.Provider>
      </UNSTABLE_Virtualizer>
      {actionBar}
    </ResizableTableContainer>
  );
});

const centeredWrapper = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'full',
  height: 'full'
});

export interface TableBodyProps<T> extends Omit<RACTableBodyProps<T>, 'style' | 'className' | 'dependencies'> {}

/**
 * The body of a `<Table>`, containing the table rows.
 */
export const TableBody = /*#__PURE__*/ (forwardRef as forwardRefType)(function TableBody<T extends object>(props: TableBodyProps<T>, ref: DOMRef<HTMLDivElement>) {
  let {items, renderEmptyState, children} = props;
  let domRef = useDOMRef(ref);
  let {loadingState} = useContext(InternalTableContext);
  let emptyRender;
  let renderer = children;
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/s2');
  let loadMoreSpinner = (
    <UNSTABLE_TableLoadingIndicator className={style({height: 'full', width: 'full'})}>
      <div className={centeredWrapper}>
        <ProgressCircle
          isIndeterminate
          aria-label={stringFormatter.format('table.loadingMore')} />
      </div>
    </UNSTABLE_TableLoadingIndicator>
  );

  // If the user is rendering their rows in dynamic fashion, wrap their render function in Collection so we can inject
  // the loader. Otherwise it is a static renderer and thus we can simply add the table loader after
  // TODO: this assumes that the user isn't providing their children in some wrapper though and/or isn't doing a map of children
  // (though I guess they wouldn't provide items then so the check for this is still valid in the latter case)...
  if (typeof children === 'function' && items) {
    renderer = (
      <>
        <Collection items={items}>
          {children}
        </Collection>
        {loadingState === 'loadingMore' && loadMoreSpinner}
      </>
    );
  } else {
    renderer = (
      <>
        {children}
        {loadingState === 'loadingMore' && loadMoreSpinner}
      </>
    );
  }

  if (renderEmptyState != null && loadingState !== 'loading') {
    emptyRender = (props: TableBodyRenderProps) => (
      <div className={centeredWrapper}>
        {renderEmptyState(props)}
      </div>
    );
  } else if (loadingState === 'loading') {
    emptyRender = () => (
      <div className={centeredWrapper}>
        <ProgressCircle
          isIndeterminate
          aria-label={stringFormatter.format('table.loading')} />
      </div>
    );
  }

  return (
    <RACTableBody
      // @ts-ignore
      ref={domRef}
      className={style({height: 'full'})}
      {...props}
      renderEmptyState={emptyRender}
      dependencies={[loadingState]}>
      {renderer}
    </RACTableBody>
  );
});

const cellFocus = {
  outlineStyle: {
    default: 'none',
    isFocusVisible: 'solid'
  },
  outlineOffset: -2,
  outlineWidth: 2,
  outlineColor: 'focus-ring',
  borderRadius: '[6px]'
} as const;

function CellFocusRing() {
  return <div role="presentation" className={style({...cellFocus, position: 'absolute', inset: 0})({isFocusVisible: true})} />;
}

const columnStyles = style({
  height: '[inherit]',
  boxSizing: 'border-box',
  color: {
    default: 'neutral',
    forcedColors: 'ButtonText'
  },
  paddingX: {
    default: 16,
    isMenu: 0
  },
  textAlign: {
    align: {
      start: 'start',
      center: 'center',
      end: 'end'
    }
  },
  outlineStyle: 'none',
  position: 'relative',
  fontSize: 'control',
  fontFamily: 'sans',
  fontWeight: 'bold',
  display: 'flex',
  borderColor: {
    default: 'gray-300',
    forcedColors: 'ButtonBorder'
  },
  borderTopWidth: {
    default: 0,
    isQuiet: 1
  },
  borderBottomWidth: 1,
  borderStartWidth: 0,
  borderEndWidth: {
    default: 0,
    isMenu: 1
  },
  borderStyle: 'solid',
  forcedColorAdjust: 'none'
});

export interface ColumnProps extends RACColumnProps {
  /** Whether the column should render a divider between it and the next column. */
  showDivider?: boolean,
  /** Whether the column allows resizing. */
  allowsResizing?: boolean,
  /**
   * The alignment of the column's contents relative to its allotted width.
   * @default 'start'
   */
  align?: 'start' | 'center' | 'end',
  /** The content to render as the column header. */
  children: ReactNode,
  menu?: ReactNode
}

/**
 * A column within a `<Table>`.
 */
export const Column = forwardRef(function Column(props: ColumnProps, ref: DOMRef<HTMLDivElement>) {
  let {isHeaderRowHovered} = useContext(InternalTableHeaderContext);
  let {isQuiet} = useContext(InternalTableContext);
  let {allowsResizing, children, align = 'start'} = props;
  let domRef = useDOMRef(ref);
  let isMenu = allowsResizing || !!props.menu;


  return (
    <RACColumn {...props} ref={domRef} style={{borderInlineEndColor: 'transparent'}} className={renderProps => columnStyles({...renderProps, isMenu, align, isQuiet})}>
      {({allowsSorting, sortDirection, isFocusVisible, sort, startResize, isHovered}) => (
        <>
          {/* Note this is mainly for column's without a dropdown menu. If there is a dropdown menu, the button is styled to have a focus ring for simplicity
          (no need to juggle showing this focus ring if focus is on the menu button and not if it is on the resizer) */}
          {/* Separate absolutely positioned element because appyling the ring on the column directly via outline means the ring's required borderRadius will cause the bottom gray border to curve as well */}
          {isFocusVisible && <CellFocusRing />}
          {isMenu ?
            (
              <ResizableColumnContents isColumnResizable={allowsResizing} menu={props.menu} allowsSorting={allowsSorting} sortDirection={sortDirection} sort={sort} startResize={startResize} isHovered={isHeaderRowHovered || isHovered} align={align}>
                {children}
              </ResizableColumnContents>
            ) : (
              <ColumnContents allowsSorting={allowsSorting} sortDirection={sortDirection}>
                {children}
              </ColumnContents>
            )
          }
        </>
      )}
    </RACColumn>
  );
});

const columnContentWrapper = style({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  width: 'full'
});

const sortIcon = style({
  size: fontRelative(16),
  flexShrink: 0,
  marginEnd: {
    default: 8,
    isButton: 'text-to-visual'
  },
  verticalAlign: {
    default: 'bottom',
    isButton: 0
  },
  '--iconPrimary': {
    type: 'fill',
    value: 'currentColor'
  }
});

interface ColumnContentProps extends Pick<ColumnRenderProps, 'allowsSorting' | 'sortDirection'>, Pick<ColumnProps, 'children'> {}

function ColumnContents(props: ColumnContentProps) {
  let {allowsSorting, sortDirection, children} = props;

  return (
    <div className={columnContentWrapper}>
      {allowsSorting && (
        <Provider
          values={[
            [IconContext, {
              styles: sortIcon({})
            }]
          ]}>
          {sortDirection != null && (
            sortDirection === 'ascending' ? <SortUpArrow /> : <SortDownArrow />
          )}
        </Provider>
      )}
      <span className={style({truncate: true, width: 'full'})}>
        {children}
      </span>
    </div>
  );
}

const resizableMenuButtonWrapper = style({
  ...cellFocus,
  color: 'gray-800', // body-color
  width: 'full',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: {
    align: {
      default: 'start',
      center: 'center',
      end: 'end'
    }
  },
  // TODO: when align: end, the dropdown arrow is misaligned with the text, not sure how best to make the svg be flush with the end of the button other than modifying the
  // paddingEnd
  paddingX: 16,
  backgroundColor: 'transparent',
  borderStyle: 'none',
  fontSize: 'control',
  fontFamily: 'sans',
  fontWeight: 'bold'
});

const resizerHandleContainer = style({
  display: {
    default: 'none',
    isResizing: 'block',
    isHovered: 'block'
  },
  width: 12,
  height: 'full',
  position: 'absolute',
  top: 0,
  insetEnd: space(-6),
  cursor: {
    default: 'none',
    resizableDirection: {
      'left': 'e-resize',
      'right': 'w-resize',
      'both': 'ew-resize'
    }
  }
});

const resizerHandle = style({
  backgroundColor: {
    default: 'transparent',
    isHovered: 'gray-300',
    isFocusVisible: lightDark('informative-900', 'informative-700'), // --spectrum-informative-background-color-default, can't use `informative` because that will use the focusVisible version
    isResizing: lightDark('informative-900', 'informative-700'),
    forcedColors: {
      default: 'Background',
      isHovered: 'ButtonBorder',
      isFocusVisible: 'Highlight',
      isResizing: 'Highlight'
    }
  },
  height: {
    default: 'full',
    isResizing: 'screen'
  },
  width: {
    default: 1,
    isResizing: 2
  },
  position: 'absolute',
  insetStart: space(6)
});

const columnHeaderText = style({
  truncate: true,
  // Make it so the text doesn't completely disappear when column is resized to smallest width + both sort and chevron icon is rendered
  minWidth: fontRelative(16),
  flexGrow: 0,
  flexShrink: 1,
  flexBasis: 'auto'
});

const chevronIcon = style({
  rotate: 90,
  marginStart: 'text-to-visual',
  minWidth: fontRelative(16),
  flexShrink: 0,
  '--iconPrimary': {
    type: 'fill',
    value: 'currentColor'
  }
});

const nubbin = style({
  position: 'absolute',
  top: 0,
  insetStart: space(-1),
  size: fontRelative(16),
  fill: {
    default: lightDark('informative-900', 'informative-700'), // --spectrum-informative-background-color-default, can't use `informative` because that won't be the background color value
    forcedColors: 'Highlight'
  },
  '--iconPrimary': {
    type: 'fill',
    value: {
      default: 'white',
      forcedColors: 'HighlightText'
    }
  }
});

interface ResizableColumnContentProps extends Pick<ColumnRenderProps, 'allowsSorting' | 'sort' | 'sortDirection' | 'startResize' | 'isHovered'>, Pick<ColumnProps, 'align' | 'children'> {
  isColumnResizable?: boolean,
  menu?: ReactNode
}

function ResizableColumnContents(props: ResizableColumnContentProps) {
  let {allowsSorting, sortDirection, sort, startResize, children, isHovered, align, isColumnResizable, menu} = props;
  let {setIsInResizeMode, isInResizeMode} = useContext(InternalTableContext);
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/s2');
  const onMenuSelect = (key) => {
    switch (key) {
      case 'sort-asc':
        sort('ascending');
        break;
      case 'sort-desc':
        sort('descending');
        break;
      case 'resize':
        setIsInResizeMode?.(true);
        startResize();
        break;
    }
  };

  let items = useMemo(() => {
    let options: Array<{label: string, id: string}> = [];
    if (isColumnResizable) {
      options = [{
        label: stringFormatter.format('table.resizeColumn'),
        id: 'resize'
      }];
    }
    if (allowsSorting) {
      options = [
        {
          label: stringFormatter.format('table.sortAscending'),
          id: 'sort-asc'
        },
        {
          label: stringFormatter.format('table.sortDescending'),
          id: 'sort-desc'
        },
        ...options
      ];
    }
    return options;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowsSorting, isColumnResizable]);

  let buttonAlignment = 'start';
  let menuAlign = 'start' as 'start' | 'end';
  if (align === 'center') {
    buttonAlignment = 'center';
  } else if (align === 'end') {
    buttonAlignment = 'end';
    menuAlign = 'end';
  }

  return (
    <>
      <MenuTrigger align={menuAlign}>
        <Button className={(renderProps) => resizableMenuButtonWrapper({...renderProps, align: buttonAlignment})}>
          {allowsSorting && (
            <Provider
              values={[
                [IconContext, {
                  styles: sortIcon({isButton: true})
                }]
              ]}>
              {sortDirection != null && (
                sortDirection === 'ascending' ? <SortUpArrow /> : <SortDownArrow />
              )}
            </Provider>
          )}
          <div className={columnHeaderText}>
            {children}
          </div>
          <Chevron size="M" className={chevronIcon} />
        </Button>
        <Menu onAction={onMenuSelect} styles={style({minWidth: 128})}>
          {items.length > 0 && (
            <MenuSection aria-label="Sort or resize?">
              <Collection items={items}>
                {(item) => <MenuItem>{item?.label}</MenuItem>}
              </Collection>
            </MenuSection>
          )}
          {menu}
        </Menu>
      </MenuTrigger>
      {isColumnResizable && (
        <div data-react-aria-prevent-focus="true">
          <ColumnResizer data-react-aria-prevent-focus="true" className={({resizableDirection, isResizing}) => resizerHandleContainer({resizableDirection, isResizing, isHovered: isInResizeMode || isHovered})}>
            {({isFocusVisible, isResizing}) => (
              <>
                <ResizerIndicator isInResizeMode={isInResizeMode} isFocusVisible={isFocusVisible} isHovered={isHovered} isResizing={isResizing} />
                {(isFocusVisible || isInResizeMode) && isResizing && <div className={nubbin}><Nubbin /></div>}
              </>
          )}
          </ColumnResizer>
        </div>
      )}
    </>
  );
}

function ResizerIndicator({isFocusVisible, isHovered, isResizing, isInResizeMode}) {
  return (
    <div className={resizerHandle({isFocusVisible, isHovered: isHovered || isInResizeMode, isResizing})} />
  );
}

const tableHeader = style({
  height: 'full',
  width: 'full',
  backgroundColor: 'gray-75',
  // Attempt to prevent 1px area where you can see scrolled cell content between the table outline and the table header
  marginTop: '[-1px]'
});

const selectAllCheckbox = style({
  marginStart: 16 // table-edge-to-content, same between mobile and desktop
});

const selectAllCheckboxColumn = style({
  padding: 0,
  height: 'full',
  boxSizing: 'border-box',
  outlineStyle: 'none',
  position: 'relative',
  alignContent: 'center',
  borderColor: {
    default: 'gray-300',
    forcedColors: 'ButtonBorder'
  },
  borderXWidth: 0,
  borderTopWidth: {
    default: 0,
    isQuiet: 1
  },
  borderBottomWidth: 1,
  borderStyle: 'solid',
  backgroundColor: 'gray-75'
});

let InternalTableHeaderContext = createContext<{isHeaderRowHovered?: boolean}>({isHeaderRowHovered: false});

export interface TableHeaderProps<T> extends Omit<RACTableHeaderProps<T>, 'style' | 'className' | 'dependencies' | 'onHoverChange' | 'onHoverStart' | 'onHoverEnd'> {}

/**
 * A header within a `<Table>`, containing the table columns.
 */
export const TableHeader = /*#__PURE__*/ (forwardRef as forwardRefType)(function TableHeader<T extends object>({columns, children}: TableHeaderProps<T>, ref: DOMRef<HTMLDivElement>) {
  let scale = useScale();
  let {selectionBehavior, selectionMode} = useTableOptions();
  let {isQuiet} = useContext(InternalTableContext);
  let [isHeaderRowHovered, setHeaderRowHovered] = useState(false);
  let domRef = useDOMRef(ref);

  return (
    <InternalTableHeaderContext.Provider value={{isHeaderRowHovered}}>
      <RACTableHeader
        // @ts-ignore
        ref={domRef}
        onHoverChange={setHeaderRowHovered}
        className={tableHeader}>
        {/* Add extra columns for selection. */}
        {selectionBehavior === 'toggle' && (
          // Also isSticky prop is applied just for the layout, will decide what the RAC api should be later
          // @ts-ignore
          <RACColumn isSticky width={scale === 'medium' ? 40 : 52} minWidth={scale === 'medium' ? 40 : 52} className={selectAllCheckboxColumn({isQuiet})}>
            {({isFocusVisible}) => (
              <>
                {selectionMode === 'single' &&
                  <>
                    {isFocusVisible && <CellFocusRing />}
                    <VisuallyHiddenSelectAllLabel />
                  </>
                }
                {selectionMode === 'multiple' &&
                  <Checkbox isEmphasized styles={selectAllCheckbox} slot="selection" />
                }
              </>
            )}
          </RACColumn>
        )}
        <Collection items={columns}>
          {children}
        </Collection>
      </RACTableHeader>
    </InternalTableHeaderContext.Provider>
  );
});

function VisuallyHiddenSelectAllLabel() {
  let checkboxProps = useSlottedContext(RACCheckboxContext, 'selection');

  return (
    <VisuallyHidden>{checkboxProps?.['aria-label']}</VisuallyHidden>
  );
}

const commonCellStyles = {
  borderColor: 'transparent',
  borderBottomWidth: 1,
  borderTopWidth: 0,
  borderXWidth: 0,
  borderStyle: 'solid',
  position: 'relative',
  color: {
    default: 'gray-800',
    forcedColors: 'ButtonText'
  },
  outlineStyle: 'none',
  paddingX: 16 // table-edge-to-content
} as const;

const cell = style<CellRenderProps & S2TableProps & {isDivider: boolean}>({
  ...commonCellStyles,
  color: 'neutral',
  paddingY: centerPadding(),
  minHeight: {
    default: 40,
    density: {
      compact: 32,
      spacious: 48
    }
  },
  boxSizing: 'border-box',
  height: 'full',
  width: 'full',
  fontSize: 'control',
  alignItems: 'center',
  display: 'flex',
  borderStyle: {
    default: 'none',
    isDivider: 'solid'
  },
  borderEndWidth: {
    default: 0,
    isDivider: 1
  },
  borderColor: {
    default: 'gray-300',
    forcedColors: 'ButtonBorder'
  }
});

const stickyCell = {
  backgroundColor: 'gray-25'
} as const;

const checkboxCellStyle = style({
  ...commonCellStyles,
  ...stickyCell,
  paddingStart: 16,
  alignContent: 'center',
  height: '[calc(100% - 1px)]',
  borderBottomWidth: 0,
  backgroundColor: '--rowBackgroundColor'
});

const cellContent = style({
  truncate: true,
  whiteSpace: {
    default: 'nowrap',
    overflowMode: {
      wrap: 'normal'
    }
  },
  textAlign: {
    align: {
      start: 'start',
      center: 'center',
      end: 'end'
    }
  },
  width: 'full',
  isolation: 'isolate',
  padding: {
    default: 4,
    isSticky: 0
  },
  margin: {
    default: -4,
    isSticky: 0
  },
  backgroundColor: {
    default: 'transparent',
    isSticky: '--rowBackgroundColor'
  }
});

export interface CellProps extends RACCellProps, Pick<ColumnProps, 'align' | 'showDivider'> {
  /** @private */
  isSticky?: boolean,
  /** The content to render as the cell children. */
  children: ReactNode
}

/**
 * A cell within a table row.
 */
export const Cell = forwardRef(function Cell(props: CellProps, ref: DOMRef<HTMLDivElement>) {
  let {children, isSticky, showDivider = false, align, textValue, ...otherProps} = props;
  let domRef = useDOMRef(ref);
  let tableVisualOptions = useContext(InternalTableContext);
  textValue ||= typeof children === 'string' ? children : undefined;

  return (
    <RACCell
      ref={domRef}
      // Also isSticky prop is applied just for the layout, will decide what the RAC api should be later
      // @ts-ignore
      isSticky={isSticky}
      className={renderProps => cell({
        ...renderProps,
        ...tableVisualOptions,
        isDivider: showDivider
      })}
      textValue={textValue}
      {...otherProps}>
      {({isFocusVisible}) => (
        <>
          {isFocusVisible && <CellFocusRing />}
          <span className={cellContent({...tableVisualOptions, isSticky, align: align || 'start'})}>{children}</span>
        </>
      )}
    </RACCell>
  );
});

// Use color-mix instead of transparency so sticky cells work correctly.
const selectedBackground = lightDark(colorMix('gray-25', 'informative-900', 10), colorMix('gray-25', 'informative-700', 10));
const selectedActiveBackground = lightDark(colorMix('gray-25', 'informative-900', 15), colorMix('gray-25', 'informative-700', 15));
const rowBackgroundColor = {
  default: {
    default: 'gray-25',
    isQuiet: '--s2-container-bg'
  },
  isFocusVisibleWithin: colorMix('gray-25', 'gray-900', 7), // table-row-hover-color
  isHovered: colorMix('gray-25', 'gray-900', 7), // table-row-hover-color
  isPressed: colorMix('gray-25', 'gray-900', 10), // table-row-hover-color
  isSelected: {
    default: selectedBackground, // table-selected-row-background-color, opacity /10
    isFocusVisibleWithin: selectedActiveBackground, // table-selected-row-background-color, opacity /15
    isHovered: selectedActiveBackground, // table-selected-row-background-color, opacity /15
    isPressed: selectedActiveBackground // table-selected-row-background-color, opacity /15
  },
  forcedColors: {
    default: 'Background'
  }
} as const;

const row = style<RowRenderProps & S2TableProps>({
  height: 'full',
  position: 'relative',
  boxSizing: 'border-box',
  backgroundColor: '--rowBackgroundColor',
  '--rowBackgroundColor': {
    type: 'backgroundColor',
    value: rowBackgroundColor
  },
  '--rowFocusIndicatorColor': {
    type: 'outlineColor',
    value: {
      default: 'focus-ring',
      forcedColors: 'Highlight'
    }
  },
  // TODO: outline here is to emulate v3 forcedColors experience but runs into the same problem where the sticky column covers the outline
  // This doesn't quite work because it gets cut off by the checkbox cell background masking element, figure out another way. Could shrink the checkbox cell's content even more
  // and offset it by margin top but that messes up the checkbox centering a bit
  // outlineWidth: {
  //   forcedColors: {
  //     isFocusVisible: 2
  //   }
  // },
  // outlineOffset: {
  //   forcedColors: {
  //     isFocusVisible: -1
  //   }
  // },
  // outlineColor: {
  //   forcedColors: {
  //     isFocusVisible: 'ButtonBorder'
  //   }
  // },
  // outlineStyle: {
  //   default: 'none',
  //   forcedColors: {
  //     isFocusVisible: 'solid'
  //   }
  // },
  outlineStyle: 'none',
  borderTopWidth: 0,
  borderBottomWidth: 1,
  borderStartWidth: 0,
  borderEndWidth: 0,
  borderStyle: 'solid',
  borderColor: {
    default: 'gray-300',
    forcedColors: 'ButtonBorder'
  },
  forcedColorAdjust: 'none'
});

export interface RowProps<T> extends Pick<RACRowProps<T>, 'id' | 'columns' | 'children' | 'textValue'>  {}

/**
 * A row within a `<Table>`.
 */
export const Row = /*#__PURE__*/ (forwardRef as forwardRefType)(function Row<T extends object>({id, columns, children, ...otherProps}: RowProps<T>, ref: DOMRef<HTMLDivElement>) {
  let {selectionBehavior, selectionMode} = useTableOptions();
  let tableVisualOptions = useContext(InternalTableContext);
  let domRef = useDOMRef(ref);

  return (
    <RACRow
      // @ts-ignore
      ref={domRef}
      id={id}
      className={renderProps => row({
        ...renderProps,
        ...tableVisualOptions
      }) + (renderProps.isFocusVisible && ' ' + raw('&:before { content: ""; display: inline-block; position: sticky; inset-inline-start: 0; width: 3px; height: 100%; margin-inline-end: -3px; margin-block-end: 1px;  z-index: 3; background-color: var(--rowFocusIndicatorColor)'))}
      {...otherProps}>
      {selectionMode !== 'none' && selectionBehavior === 'toggle' && (
        <Cell isSticky className={checkboxCellStyle}>
          <Checkbox isEmphasized slot="selection" />
        </Cell>
      )}
      <Collection items={columns}>
        {children}
      </Collection>
    </RACRow>
  );
});
