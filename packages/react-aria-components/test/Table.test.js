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

import {act, fireEvent, installPointerEvent, mockClickDefault, pointerMap, render, triggerLongPress, within} from '@react-spectrum/test-utils-internal';
import {Button, Cell, Checkbox, Collection, Column, ColumnResizer, Dialog, DialogTrigger, DropIndicator, Label, Modal, ResizableTableContainer, Row, Table, TableBody, TableHeader, UNSTABLE_TableLayout as TableLayout, Tag, TagGroup, TagList, useDragAndDrop, useTableOptions, UNSTABLE_Virtualizer as Virtualizer} from '../';
import {composeStories} from '@storybook/react';
import {DataTransfer, DragEvent} from '@react-aria/dnd/test/mocks';
import React, {useMemo, useRef, useState} from 'react';
import {resizingTests} from '@react-aria/table/test/tableResizingTests';
import {setInteractionModality} from '@react-aria/interactions';
import * as stories from '../stories/Table.stories';
import {useLoadMore} from '@react-aria/utils';
import {User} from '@react-aria/test-utils';
import userEvent from '@testing-library/user-event';

let {
  RenderEmptyStateStory: EmptyLoadingTable,
  TableLoadingBodyWrapperStory: LoadingMoreTable
} = composeStories(stories);

function MyColumn(props) {
  return (
    <Column {...props}>
      {({allowsSorting, sortDirection}) => (<>
        {props.children}
        {allowsSorting && (
          <span aria-hidden="true" className="sort-indicator">
            {sortDirection === 'ascending' ? '▲' : '▼'}
          </span>
        )}
        {props.allowsResizing && <ColumnResizer data-testid="resizer" />}
      </>)}
    </Column>
  );
}

function MyTableHeader({columns, children, ...otherProps}) {
  let {selectionBehavior, selectionMode, allowsDragging} = useTableOptions();

  return (
    <TableHeader {...otherProps}>
      {allowsDragging && <Column />}
      {selectionBehavior === 'toggle' && (
        <Column>{selectionMode === 'multiple' && <MyCheckbox />}</Column>
      )}
      <Collection items={columns}>
        {children}
      </Collection>
    </TableHeader>
  );
}

function MyRow({id, columns, children, ...otherProps}) {
  let {selectionBehavior, allowsDragging} = useTableOptions();

  return (
    <Row id={id} {...otherProps} columns={columns}>
      {allowsDragging && (
        <Cell>
          <Button slot="drag">≡</Button>
        </Cell>
      )}
      {selectionBehavior === 'toggle' && (
        <Cell>
          <MyCheckbox />
        </Cell>
      )}
      <Collection items={columns}>
        {children}
      </Collection>
    </Row>
  );
}

function MyCheckbox() {
  return (
    <Checkbox slot="selection">
      {({isIndeterminate}) => (
        <div className="checkbox">
          <svg viewBox="0 0 18 18">
            {isIndeterminate
              ? <rect x={1} y={7.5} width={15} height={3} />
              : <polyline points="1 9 7 14 15 4" />}
          </svg>
        </div>
      )}
    </Checkbox>
  );
}

let TestTable = ({tableProps, tableHeaderProps, columnProps, tableBodyProps, rowProps, cellProps}) => (
  <Table aria-label="Files" {...tableProps}>
    <MyTableHeader {...tableHeaderProps}>
      <MyColumn id="name" isRowHeader {...columnProps}>Name</MyColumn>
      <MyColumn {...columnProps}>Type</MyColumn>
      <MyColumn {...columnProps}>Date Modified</MyColumn>
    </MyTableHeader>
    <TableBody {...tableBodyProps}>
      <MyRow id="1" textValue="Games" {...rowProps}>
        <Cell {...cellProps}>Games</Cell>
        <Cell {...cellProps}>File folder</Cell>
        <Cell {...cellProps}>6/7/2020</Cell>
      </MyRow>
      <MyRow id="2" textValue="Program Files" {...rowProps}>
        <Cell {...cellProps}>Program Files</Cell>
        <Cell {...cellProps}>File folder</Cell>
        <Cell {...cellProps}>4/7/2021</Cell>
      </MyRow>
      <MyRow id="3" textValue="bootmgr" {...rowProps}>
        <Cell {...cellProps}>bootmgr</Cell>
        <Cell {...cellProps}>System file</Cell>
        <Cell {...cellProps}>11/20/2010</Cell>
      </MyRow>
    </TableBody>
  </Table>
);

let EditableTable = ({tableProps, tableHeaderProps, columnProps, tableBodyProps, rowProps, cellProps}) => (
  <Table aria-label="Files" {...tableProps}>
    <MyTableHeader {...tableHeaderProps}>
      <MyColumn id="name" isRowHeader {...columnProps}>Name</MyColumn>
      <MyColumn {...columnProps}>Type</MyColumn>
      <MyColumn {...columnProps}>Actions</MyColumn>
    </MyTableHeader>
    <TableBody {...tableBodyProps}>
      <MyRow id="1" textValue="Edit" {...rowProps}>
        <Cell {...cellProps}>Games</Cell>
        <Cell {...cellProps}>File folder</Cell>
        <Cell {...cellProps}>
          <TagGroup aria-label="Tag group">
            <TagList>
              <Tag id="1">Tag 1</Tag>
              <Tag id="2">Tag 2</Tag>
              <Tag id="3">Tag 3</Tag>
            </TagList>
          </TagGroup>
        </Cell>
      </MyRow>
    </TableBody>
  </Table>
);

let DraggableTable = (props) => {
  let {dragAndDropHooks} = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({'text/plain': key})),
    ...props
  });

  return <TestTable tableProps={{dragAndDropHooks}} />;
};

let DraggableTableWithSelection = (props) => {
  let {dragAndDropHooks} = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({'text/plain': key})),
    ...props
  });

  return <TestTable tableProps={{dragAndDropHooks, selectionMode: 'multiple'}} />;
};

let columns = [
  {name: 'Name', id: 'name', isRowHeader: true},
  {name: 'Type', id: 'type'},
  {name: 'Date Modified', id: 'date'}
];

let rows = [
  {id: 1, name: 'Games', date: '6/7/2020', type: 'File folder'},
  {id: 2, name: 'Program Files', date: '4/7/2021', type: 'File folder'},
  {id: 3, name: 'bootmgr', date: '11/20/2010', type: 'System file'},
  {id: 4, name: 'log.txt', date: '1/18/2016', type: 'Text Document'}
];

let DynamicTable = ({tableProps, tableHeaderProps, tableBodyProps, rowProps}) => (
  <Table aria-label="Files" {...tableProps}>
    <MyTableHeader columns={columns} {...tableHeaderProps}>
      {column => (
        <MyColumn isRowHeader={column.isRowHeader} childColumns={column.children}>
          {column.name}
        </MyColumn>
      )}
    </MyTableHeader>
    <TableBody items={rows} {...tableBodyProps}>
      {item => (
        <MyRow columns={columns} {...rowProps}>
          {column => <Cell>{item[column.id]}</Cell>}
        </MyRow>
      )}
    </TableBody>
  </Table>
);

let renderTable = (props) => render(<TestTable {...props} />);

describe('Table', () => {
  let user;
  let testUtilUser = new User();
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default classes', () => {
    let {getByRole} = renderTable();
    let tableTester = testUtilUser.createTester('Table', {root: getByRole('grid')});
    let table = tableTester.table;
    expect(table).toHaveAttribute('class', 'react-aria-Table');

    for (let row of tableTester.rows) {
      expect(row).toHaveAttribute('class', 'react-aria-Row');
    }

    let rowGroups = tableTester.rowGroups;
    expect(rowGroups).toHaveLength(2);
    expect(rowGroups[0]).toHaveAttribute('class', 'react-aria-TableHeader');
    expect(rowGroups[1]).toHaveAttribute('class', 'react-aria-TableBody');

    for (let cell of tableTester.columns) {
      expect(cell).toHaveAttribute('class', 'react-aria-Column');
    }

    for (let cell of tableTester.rowHeaders) {
      expect(cell).toHaveAttribute('class', 'react-aria-Cell');
    }

    for (let cell of tableTester.cells()) {
      expect(cell).toHaveAttribute('class', 'react-aria-Cell');
    }
  });

  it('should render with custom classes', () => {
    let {getByRole, getAllByRole} = renderTable({
      tableProps: {className: 'table'},
      tableHeaderProps: {className: 'table-header'},
      columnProps: {className: 'column'},
      tableBodyProps: {className: 'table-body'},
      rowProps: {className: 'row'},
      cellProps: {className: 'cell'}
    });
    let table = getByRole('grid');
    expect(table).toHaveAttribute('class', 'table');

    for (let row of getAllByRole('row').slice(1)) {
      expect(row).toHaveAttribute('class', 'row');
    }

    let rowGroups = getAllByRole('rowgroup');
    expect(rowGroups).toHaveLength(2);
    expect(rowGroups[0]).toHaveAttribute('class', 'table-header');
    expect(rowGroups[1]).toHaveAttribute('class', 'table-body');

    for (let cell of getAllByRole('columnheader')) {
      expect(cell).toHaveAttribute('class', 'column');
    }

    for (let cell of getAllByRole('rowheader')) {
      expect(cell).toHaveAttribute('class', 'cell');
    }

    for (let cell of getAllByRole('gridcell')) {
      expect(cell).toHaveAttribute('class', 'cell');
    }
  });

  it('should support DOM props', () => {
    let {getByRole, getAllByRole} = renderTable({
      tableProps: {'data-testid': 'table'},
      tableHeaderProps: {'data-testid': 'table-header'},
      columnProps: {'data-testid': 'column'},
      tableBodyProps: {'data-testid': 'table-body'},
      rowProps: {'data-testid': 'row'},
      cellProps: {'data-testid': 'cell'}
    });
    let table = getByRole('grid');
    expect(table).toHaveAttribute('data-testid', 'table');

    for (let row of getAllByRole('row').slice(1)) {
      expect(row).toHaveAttribute('data-testid', 'row');
    }

    let rowGroups = getAllByRole('rowgroup');
    expect(rowGroups).toHaveLength(2);
    expect(rowGroups[0]).toHaveAttribute('data-testid', 'table-header');
    expect(rowGroups[1]).toHaveAttribute('data-testid', 'table-body');

    for (let cell of getAllByRole('columnheader')) {
      expect(cell).toHaveAttribute('data-testid', 'column');
    }

    for (let cell of getAllByRole('rowheader')) {
      expect(cell).toHaveAttribute('data-testid', 'cell');
    }

    for (let cell of getAllByRole('gridcell')) {
      expect(cell).toHaveAttribute('data-testid', 'cell');
    }
  });

  it('should render checkboxes for selection', async () => {
    let {getAllByRole} = renderTable({
      tableProps: {selectionMode: 'multiple'}
    });

    for (let row of getAllByRole('row')) {
      let checkbox = within(row).getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    }

    let checkbox = getAllByRole('checkbox')[0];
    expect(checkbox).toHaveAttribute('aria-label', 'Select All');

    await user.click(checkbox);

    for (let row of getAllByRole('row')) {
      let checkbox = within(row).getByRole('checkbox');
      expect(checkbox).toBeChecked();
    }
  });

  it('should not render checkboxes for selection with selectionBehavior=replace', async () => {
    let {getAllByRole} = renderTable({
      tableProps: {
        selectionMode: 'multiple',
        selectionBehavior: 'replace'
      }
    });

    for (let row of getAllByRole('row')) {
      let checkbox = within(row).queryByRole('checkbox');
      expect(checkbox).toBeNull();
    }

    let row = getAllByRole('row')[1];
    expect(row).toHaveAttribute('aria-selected', 'false');
    await user.click(row);
    expect(row).toHaveAttribute('aria-selected', 'true');
  });

  it('should support dynamic collections', () => {
    let {getAllByRole} = render(<DynamicTable />);
    expect(getAllByRole('row')).toHaveLength(5);
  });

  it('should support column hover when sorting is allowed', async () => {
    let {getAllByRole} = renderTable({
      columnProps: {allowsSorting: true, className: ({isHovered}) => isHovered ? 'hover' : ''}
    });
    let column = getAllByRole('columnheader')[0];

    expect(column).not.toHaveAttribute('data-hovered');
    expect(column).not.toHaveClass('hover');

    await user.hover(column);
    expect(column).toHaveAttribute('data-hovered', 'true');
    expect(column).toHaveClass('hover');

    await user.unhover(column);
    expect(column).not.toHaveAttribute('data-hovered');
    expect(column).not.toHaveClass('hover');
  });

  it('should not show column hover state when column is not sortable', async () => {
    let {getAllByRole} = renderTable({
      columnProps: {className: ({isHovered}) => isHovered ? 'hover' : ''}
    });
    let column = getAllByRole('columnheader')[0];

    expect(column).not.toHaveAttribute('data-hovered');
    expect(column).not.toHaveClass('hover');

    await user.hover(column);
    expect(column).not.toHaveAttribute('data-hovered');
    expect(column).not.toHaveClass('hover');
  });

  it('should support hover', async () => {
    let onHoverStart = jest.fn();
    let onHoverChange = jest.fn();
    let onHoverEnd = jest.fn();
    let {getAllByRole} = renderTable({
      tableProps: {selectionMode: 'multiple'},
      rowProps: {className: ({isHovered}) => isHovered ? 'hover' : '', onHoverStart, onHoverChange, onHoverEnd}
    });
    let row = getAllByRole('row')[1];

    expect(row).not.toHaveAttribute('data-hovered');
    expect(row).not.toHaveClass('hover');

    await user.hover(row);
    expect(row).toHaveAttribute('data-hovered', 'true');
    expect(row).toHaveClass('hover');
    expect(onHoverStart).toHaveBeenCalledTimes(1);
    expect(onHoverChange).toHaveBeenCalledTimes(1);

    await user.unhover(row);
    expect(row).not.toHaveAttribute('data-hovered');
    expect(row).not.toHaveClass('hover');
    expect(onHoverEnd).toHaveBeenCalledTimes(1);
    expect(onHoverChange).toHaveBeenCalledTimes(2);
  });

  it('should not show hover state when item is not interactive', async () => {
    let onHoverStart = jest.fn();
    let onHoverChange = jest.fn();
    let onHoverEnd = jest.fn();
    let {getAllByRole} = renderTable({
      rowProps: {className: ({isHovered}) => isHovered ? 'hover' : '', onHoverStart, onHoverChange, onHoverEnd}
    });
    let row = getAllByRole('row')[1];

    expect(row).not.toHaveAttribute('data-hovered');
    expect(row).not.toHaveClass('hover');
    expect(onHoverStart).not.toHaveBeenCalled();
    expect(onHoverChange).not.toHaveBeenCalled();
    expect(onHoverEnd).not.toHaveBeenCalled();

    await user.hover(row);
    expect(row).not.toHaveAttribute('data-hovered');
    expect(row).not.toHaveClass('hover');
    expect(onHoverStart).not.toHaveBeenCalled();
    expect(onHoverChange).not.toHaveBeenCalled();
    expect(onHoverEnd).not.toHaveBeenCalled();
  });

  it('should support hover events on the TableHeader', async () => {
    let onHoverStart = jest.fn();
    let onHoverChange = jest.fn();
    let onHoverEnd = jest.fn();
    let {getAllByRole} = renderTable({
      tableHeaderProps: {className: ({isHovered}) => isHovered ? 'hover' : '', onHoverStart, onHoverChange, onHoverEnd}
    });
    let headerRow = getAllByRole('rowgroup')[0];

    expect(headerRow).not.toHaveAttribute('data-hovered');
    expect(headerRow).not.toHaveClass('hover');
    expect(onHoverStart).not.toHaveBeenCalled();
    expect(onHoverChange).not.toHaveBeenCalled();
    expect(onHoverEnd).not.toHaveBeenCalled();

    await user.hover(headerRow);
    expect(headerRow).toHaveAttribute('data-hovered');
    expect(headerRow).toHaveClass('hover');
    expect(onHoverStart).toHaveBeenCalledTimes(1);
    expect(onHoverChange).toHaveBeenCalledTimes(1);

    await user.unhover(headerRow);
    expect(headerRow).not.toHaveAttribute('data-hovered');
    expect(headerRow).not.toHaveClass('hover');
    expect(onHoverEnd).toHaveBeenCalledTimes(1);
    expect(onHoverChange).toHaveBeenCalledTimes(2);
  });

  it('should support focus ring', async () => {
    let {getAllByRole} = renderTable({
      rowProps: {className: ({isFocusVisible}) => isFocusVisible ? 'focus' : ''},
      cellProps: {className: ({isFocusVisible}) => isFocusVisible ? 'focus' : ''},
      columnProps: {className: ({isFocusVisible}) => isFocusVisible ? 'focus' : ''}
    });

    let row = getAllByRole('row')[1];
    let cell = within(row).getAllByRole('rowheader')[0];

    expect(row).not.toHaveAttribute('data-focus-visible');
    expect(row).not.toHaveClass('focus');

    await user.tab();
    expect(document.activeElement).toBe(row);
    expect(row).toHaveAttribute('data-focus-visible', 'true');
    expect(row).toHaveClass('focus');

    fireEvent.keyDown(row, {key: 'ArrowRight'});
    fireEvent.keyUp(row, {key: 'ArrowRight'});

    expect(document.activeElement).toBe(cell);
    expect(row).not.toHaveAttribute('data-focus-visible');
    expect(row).not.toHaveClass('focus');
    expect(cell).toHaveAttribute('data-focus-visible', 'true');
    expect(cell).toHaveClass('focus');

    fireEvent.keyDown(row, {key: 'ArrowUp'});
    fireEvent.keyUp(row, {key: 'ArrowUp'});

    let column = getAllByRole('columnheader')[0];
    expect(document.activeElement).toBe(column);
    expect(column).toHaveAttribute('data-focus-visible', 'true');
    expect(column).toHaveClass('focus');
  });

  it('should support press state', async () => {
    let {getAllByRole} = renderTable({
      tableProps: {selectionMode: 'multiple'},
      rowProps: {className: ({isPressed}) => isPressed ? 'pressed' : ''}
    });

    let row = getAllByRole('row')[1];

    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');

    await user.pointer({target: row, keys: '[MouseLeft>]'});
    expect(row).toHaveAttribute('data-pressed', 'true');
    expect(row).toHaveClass('pressed');

    await user.pointer({target: row, keys: '[/MouseLeft]'});
    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');
  });

  it('should not show press state when not interactive', async () => {
    let {getAllByRole} = renderTable({
      rowProps: {className: ({isPressed}) => isPressed ? 'pressed' : ''}
    });
    let row = getAllByRole('row')[0];

    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');

    await user.pointer({target: row, keys: '[MouseLeft>]'});
    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');

    await user.pointer({target: row, keys: '[/MouseLeft]'});
    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');
  });

  it('should support row actions', async () => {
    let onRowAction = jest.fn();
    let {getAllByRole} = renderTable({
      tableProps: {onRowAction},
      rowProps: {className: ({isPressed}) => isPressed ? 'pressed' : ''}
    });

    let row = getAllByRole('row')[1];

    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');

    await user.pointer({target: row, keys: '[MouseLeft>]'});
    expect(row).toHaveAttribute('data-pressed', 'true');
    expect(row).toHaveClass('pressed');

    await user.pointer({target: row, keys: '[/MouseLeft]'});
    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');

    expect(onRowAction).toHaveBeenCalledTimes(1);
  });

  it('should support disabled state', async () => {
    let {getAllByRole} = renderTable({
      tableProps: {selectionMode: 'multiple', disabledKeys: ['2'], disabledBehavior: 'all'},
      rowProps: {className: ({isDisabled}) => isDisabled ? 'disabled' : ''}
    });
    let rows = getAllByRole('row');
    let row = rows[2];

    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(row).toHaveClass('disabled');
    expect(within(row).getByRole('checkbox')).toBeDisabled();

    await user.tab();
    expect(document.activeElement).toBe(rows[1]);
    fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
    fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
    expect(document.activeElement).toBe(rows[3]);
  });

  it('should support isDisabled prop on rows', async () => {
    let {getAllByRole} = render(
      <Table aria-label="Table" selectionMode="multiple" disabledBehavior="all">
        <MyTableHeader>
          <Column isRowHeader>Foo</Column>
          <Column>Bar</Column>
          <Column>Baz</Column>
        </MyTableHeader>
        <TableBody>
          <MyRow>
            <Cell>Foo 1</Cell>
            <Cell>Bar 1</Cell>
            <Cell>Baz 1</Cell>
          </MyRow>
          <MyRow isDisabled>
            <Cell>Foo 2</Cell>
            <Cell>Bar 2</Cell>
            <Cell>Baz 2</Cell>
          </MyRow>
          <MyRow>
            <Cell>Foo 3</Cell>
            <Cell>Bar 3</Cell>
            <Cell>Baz 3</Cell>
          </MyRow>
        </TableBody>
      </Table>
    );
    let items = getAllByRole('row');
    expect(items[2]).toHaveAttribute('aria-disabled', 'true');

    await user.tab();
    expect(document.activeElement).toBe(items[1]);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[3]);
  });

  it('should support onAction on items', async () => {
    let onAction = jest.fn();
    let {getByRole} = render(
      <Table aria-label="Table" selectionMode="multiple" disabledBehavior="all">
        <MyTableHeader>
          <Column isRowHeader>Foo</Column>
          <Column>Bar</Column>
          <Column>Baz</Column>
        </MyTableHeader>
        <TableBody>
          <MyRow onAction={onAction}>
            <Cell>Foo 1</Cell>
            <Cell>Bar 1</Cell>
            <Cell>Baz 1</Cell>
          </MyRow>
          <MyRow>
            <Cell>Foo 2</Cell>
            <Cell>Bar 2</Cell>
            <Cell>Baz 2</Cell>
          </MyRow>
        </TableBody>
      </Table>
    );

    let tableTester = testUtilUser.createTester('Table', {root: getByRole('grid')});
    await tableTester.triggerRowAction({row: 0});
    expect(onAction).toHaveBeenCalled();
  });

  it('should support sorting', async () => {
    let onSortChange = jest.fn();
    let {getByRole} = renderTable({
      tableProps: {sortDescriptor: {column: 'name', direction: 'ascending'}, onSortChange},
      columnProps: {allowsSorting: true}
    });

    let tableTester = testUtilUser.createTester('Table', {root: getByRole('grid')});

    let columns = tableTester.columns;
    expect(columns[0]).toHaveAttribute('aria-sort', 'ascending');
    expect(columns[0]).toHaveTextContent('▲');
    expect(columns[1]).toHaveAttribute('aria-sort', 'none');
    expect(columns[1]).not.toHaveTextContent('▲');
    expect(columns[2]).toHaveAttribute('aria-sort', 'none');
    expect(columns[2]).not.toHaveTextContent('▲');

    await tableTester.toggleSort({column: 0});
    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange).toHaveBeenCalledWith({column: 'name', direction: 'descending'});
  });

  it('should support empty state', () => {
    let {getAllByRole, getByRole} = render(
      <Table aria-label="Search results">
        <TableHeader>
          <Column isRowHeader>Name</Column>
          <Column>Type</Column>
          <Column>Date Modified</Column>
        </TableHeader>
        <TableBody renderEmptyState={() => 'No results'}>
          {[]}
        </TableBody>
      </Table>
    );
    let body = getAllByRole('rowgroup')[1];
    expect(body).toHaveAttribute('data-empty', 'true');
    let cell = getByRole('rowheader');
    expect(cell).toHaveTextContent('No results');
  });

  it('supports removing rows', async () => {
    let {rerender, getByRole} = render(<DynamicTable tableBodyProps={{rows}} />);

    let tableTester = testUtilUser.createTester('Table', {root: getByRole('grid')});
    await user.tab();
    fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
    fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
    fireEvent.keyDown(document.activeElement, {key: 'ArrowRight'});
    fireEvent.keyUp(document.activeElement, {key: 'ArrowRight'});

    let gridRows = tableTester.rows;
    expect(gridRows).toHaveLength(4);
    let cell = within(gridRows[1]).getAllByRole('rowheader')[0];
    expect(cell).toHaveTextContent('Program Files');
    expect(document.activeElement).toBe(cell);

    rerender(<DynamicTable tableBodyProps={{items: [rows[0], ...rows.slice(2)]}} />);

    gridRows = tableTester.rows;
    expect(gridRows).toHaveLength(3);
    cell = within(gridRows[1]).getAllByRole('rowheader')[0];
    expect(cell).toHaveTextContent('bootmgr');
    expect(document.activeElement).toBe(cell);
  });

  it('should support refs', () => {
    let tableRef = React.createRef();
    let headerRef = React.createRef();
    let columnRef = React.createRef();
    let bodyRef = React.createRef();
    let rowRef = React.createRef();
    let cellRef = React.createRef();
    render(
      <Table aria-label="Search results" ref={tableRef}>
        <TableHeader ref={headerRef}>
          <Column isRowHeader ref={columnRef}>Name</Column>
          <Column>Type</Column>
        </TableHeader>
        <TableBody ref={bodyRef}>
          <Row ref={rowRef}>
            <Cell ref={cellRef}>Foo</Cell>
            <Cell>Bar</Cell>
          </Row>
        </TableBody>
      </Table>
    );
    expect(tableRef.current).toBeInstanceOf(HTMLTableElement);
    expect(headerRef.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(columnRef.current).toBeInstanceOf(HTMLTableCellElement);
    expect(bodyRef.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(rowRef.current).toBeInstanceOf(HTMLTableRowElement);
    expect(cellRef.current).toBeInstanceOf(HTMLTableCellElement);
  });

  it('should support row render function and not call it with state', () => {
    let renderRow = jest.fn(() => {});
    render(
      <Table aria-label="Search results">
        <TableHeader columns={[columns[0]]}>
          {column => (
            <Column isRowHeader={column.isRowHeader}>
              {column.name}
            </Column>
          )}
        </TableHeader>
        <TableBody items={[rows[0]]}>
          {item => (
            <Row columns={[columns[0]]}>
              {column => {
                renderRow(column);
                return (
                  <Cell>
                    {item[column.id]}
                  </Cell>
                );
              }}
            </Row>
          )}
        </TableBody>
      </Table>
    );

    // React 19 only calls render function once, vs twice in React 18, 17 and 16.
    // Every call should be the same, so just loop over them.
    expect(renderRow.mock.calls.length).toBeGreaterThanOrEqual(1);
    renderRow.mock.calls.forEach((call) => {
      expect(call[0]).toBe(columns[0]);
    });
    renderRow.mockReset();

    // We do not currently call the renderProps function on any of these changes
    // let rowElems = getAllByRole('row');
    // let cells = getAllByRole('rowheader');
    // act(() => rowElems[1].focus());
    // expect(cells[0]).toHaveTextContent('Games focused');
  });

  it('should support cell render props', () => {
    let {getAllByRole} = render(
      <Table aria-label="Search results">
        <TableHeader>
          <Column isRowHeader>
            {({isFocused}) => `Name${isFocused ? ' (focused)' : ''}`}
          </Column>
          <Column>Type</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>
              {({isFocused}) => `Foo${isFocused ? ' (focused)' : ''}`}
            </Cell>
            <Cell>Bar</Cell>
          </Row>
        </TableBody>
      </Table>
    );

    let headers = getAllByRole('columnheader');
    expect(headers[0]).toHaveTextContent('Name');
    act(() => headers[0].focus());
    expect(headers[0]).toHaveTextContent('Name (focused)');

    let cells = getAllByRole('rowheader');
    expect(cells[0]).toHaveTextContent('Foo');
    act(() => cells[0].focus());
    expect(cells[0]).toHaveTextContent('Foo (focused)');
  });

  it('should support updating columns', () => {
    let tree = render(<DynamicTable tableHeaderProps={{columns}} tableBodyProps={{dependencies: [columns]}} rowProps={{columns}} />);
    let headers = tree.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);

    let newColumns = [columns[0], columns[2]];
    tree.rerender(<DynamicTable tableHeaderProps={{columns: newColumns}} tableBodyProps={{dependencies: [newColumns]}} rowProps={{columns: newColumns}} />);

    headers = tree.getAllByRole('columnheader');
    expect(headers).toHaveLength(2);
  });

  it('should support updating and reordering a row at the same time', () => {
    let tree = render(<DynamicTable tableBodyProps={{items: rows}} />);
    let rowHeaders = tree.getAllByRole('rowheader');
    expect(rowHeaders.map(r => r.textContent)).toEqual(['Games', 'Program Files', 'bootmgr', 'log.txt']);

    tree.rerender(<DynamicTable tableBodyProps={{items: [rows[1], {...rows[0], name: 'XYZ'}, ...rows.slice(2)]}} />);
    rowHeaders = tree.getAllByRole('rowheader');
    expect(rowHeaders.map(r => r.textContent)).toEqual(['Program Files', 'XYZ', 'bootmgr', 'log.txt']);
  });

  it('should support onScroll', () => {
    let onScroll = jest.fn();
    let {getByRole} = renderTable({tableProps: {onScroll}});
    let grid = getByRole('grid');
    fireEvent.scroll(grid);
    expect(onScroll).toHaveBeenCalled();
  });

  it('should support data-focus-visible-within', async () => {
    let {getAllByRole} = renderTable();
    let items = getAllByRole('row');
    expect(items[1]).not.toHaveAttribute('data-focus-visible-within', 'true');

    await user.tab();
    expect(document.activeElement).toBe(items[1]);
    expect(items[1]).toHaveAttribute('data-focus-visible-within', 'true');
    await user.keyboard('{ArrowRight}');

    let cell = within(items[1]).getAllByRole('rowheader')[0];
    expect(document.activeElement).toBe(cell);
    expect(cell).toHaveAttribute('data-focus-visible', 'true');
    expect(items[1]).toHaveAttribute('data-focus-visible-within', 'true');

    await user.keyboard('{ArrowDown}');
    expect(items[1]).not.toHaveAttribute('data-focus-visible-within', 'true');
  });

  it('should support virtualizer', async () => {
    let layout = new TableLayout({
      rowHeight: 25
    });

    let items = [];
    for (let i = 0; i < 50; i++) {
      items.push({id: i, foo: 'Foo ' + i, bar: 'Bar ' + i});
    }

    jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 100);
    jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 100);

    let {getByRole, getAllByRole} = render(
      <Virtualizer layout={layout}>
        <Table aria-label="Test">
          <TableHeader>
            <Column isRowHeader>Foo</Column>
            <Column>Bar</Column>
          </TableHeader>
          <TableBody items={items}>
            {item => (
              <Row>
                <Cell>{item.foo}</Cell>
                <Cell>{item.bar}</Cell>
              </Row>
            )}
          </TableBody>
        </Table>
      </Virtualizer>
    );

    let rows = getAllByRole('row');
    expect(rows).toHaveLength(7);
    expect(rows.map(r => r.textContent)).toEqual(['FooBar', 'Foo 0Bar 0', 'Foo 1Bar 1', 'Foo 2Bar 2', 'Foo 3Bar 3', 'Foo 4Bar 4', 'Foo 5Bar 5']);
    for (let row of rows) {
      expect(row).toHaveAttribute('aria-rowindex');
    }

    let grid = getByRole('grid');
    grid.scrollTop = 200;
    fireEvent.scroll(grid);

    rows = getAllByRole('row');
    expect(rows).toHaveLength(8);
    expect(rows.map(r => r.textContent)).toEqual(['FooBar', 'Foo 7Bar 7', 'Foo 8Bar 8', 'Foo 9Bar 9', 'Foo 10Bar 10', 'Foo 11Bar 11', 'Foo 12Bar 12', 'Foo 13Bar 13']);

    await user.tab();
    await user.keyboard('{End}');

    rows = getAllByRole('row');
    expect(rows).toHaveLength(9);
    expect(rows.map(r => r.textContent)).toEqual(['FooBar', 'Foo 7Bar 7', 'Foo 8Bar 8', 'Foo 9Bar 9', 'Foo 10Bar 10', 'Foo 11Bar 11', 'Foo 12Bar 12', 'Foo 13Bar 13', 'Foo 49Bar 49']);
  });

  it('should support nested collections with colliding keys', async () => {
    let {container} = render(<EditableTable />);

    let itemMap = new Map();
    let items = container.querySelectorAll('[data-key]');

    for (let item of items) {
      if (item instanceof HTMLElement) {
        expect(itemMap.has(item.dataset.key)).toBe(false);
        itemMap.set(item.dataset.key, item);
      }
    }
  });

  describe('drag and drop', () => {
    it('should support drag button slot', () => {
      let {getAllByRole} = render(<DraggableTable />);
      let button = getAllByRole('button')[0];
      expect(button).toHaveAttribute('aria-label', 'Drag Games');
    });

    it('should render drop indicators', () => {
      let onReorder = jest.fn();
      let {getAllByRole} = render(<DraggableTable onReorder={onReorder} renderDropIndicator={(target) => <DropIndicator target={target}>Test</DropIndicator>} />);
      let button = getAllByRole('button')[0];
      fireEvent.keyDown(button, {key: 'Enter'});
      fireEvent.keyUp(button, {key: 'Enter'});
      act(() => jest.runAllTimers());

      let rows = getAllByRole('row');
      expect(rows).toHaveLength(5);
      expect(rows[0]).toHaveAttribute('class', 'react-aria-DropIndicator');
      expect(rows[0]).toHaveAttribute('data-drop-target', 'true');
      expect(rows[0]).toHaveTextContent('Test');
      expect(within(rows[0]).getByRole('button')).toHaveAttribute('aria-label', 'Insert before Games');
      expect(rows[2]).toHaveAttribute('class', 'react-aria-DropIndicator');
      expect(rows[2]).not.toHaveAttribute('data-drop-target');
      expect(within(rows[2]).getByRole('button')).toHaveAttribute('aria-label', 'Insert between Games and Program Files');
      expect(rows[3]).toHaveAttribute('class', 'react-aria-DropIndicator');
      expect(rows[3]).not.toHaveAttribute('data-drop-target');
      expect(within(rows[3]).getByRole('button')).toHaveAttribute('aria-label', 'Insert between Program Files and bootmgr');
      expect(rows[4]).toHaveAttribute('class', 'react-aria-DropIndicator');
      expect(rows[4]).not.toHaveAttribute('data-drop-target');
      expect(within(rows[4]).getByRole('button')).toHaveAttribute('aria-label', 'Insert after bootmgr');

      fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
      fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

      expect(document.activeElement).toHaveAttribute('aria-label', 'Insert between Games and Program Files');
      expect(rows[0]).not.toHaveAttribute('data-drop-target', 'true');
      expect(rows[2]).toHaveAttribute('data-drop-target', 'true');

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      act(() => jest.runAllTimers());

      expect(onReorder).toHaveBeenCalledTimes(1);
    });

    it('should support dropping on rows', () => {
      let onItemDrop = jest.fn();
      let {getAllByRole} = render(<>
        <DraggableTable />
        <DraggableTable onItemDrop={onItemDrop} />
      </>);

      let button = getAllByRole('button')[0];
      fireEvent.keyDown(button, {key: 'Enter'});
      fireEvent.keyUp(button, {key: 'Enter'});
      act(() => jest.runAllTimers());

      let grids = getAllByRole('grid');
      let rows = within(grids[1]).getAllByRole('row');
      expect(rows).toHaveLength(3);
      expect(within(rows[0]).getByRole('button')).toHaveAttribute('aria-label', 'Drop on Games');
      expect(rows[0].nextElementSibling).toHaveAttribute('data-drop-target', 'true');
      expect(within(rows[1]).getByRole('button')).toHaveAttribute('aria-label', 'Drop on Program Files');
      expect(rows[1].nextElementSibling).not.toHaveAttribute('data-drop-target');
      expect(within(rows[2]).getByRole('button')).toHaveAttribute('aria-label', 'Drop on bootmgr');
      expect(rows[2].nextElementSibling).not.toHaveAttribute('data-drop-target');

      expect(document.activeElement).toBe(within(rows[0]).getByRole('button'));

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      act(() => jest.runAllTimers());

      expect(onItemDrop).toHaveBeenCalledTimes(1);
    });

    it('should support dropping on the root', () => {
      let onRootDrop = jest.fn();
      let {getAllByRole} = render(<>
        <DraggableTable />
        <DraggableTable onRootDrop={onRootDrop} />
      </>);

      let button = getAllByRole('button')[0];
      fireEvent.keyDown(button, {key: 'Enter'});
      fireEvent.keyUp(button, {key: 'Enter'});
      act(() => jest.runAllTimers());

      let grids = getAllByRole('grid');
      let rows = within(grids[1]).getAllByRole('row');
      expect(rows).toHaveLength(1);
      expect(within(rows[0]).getByRole('button')).toHaveAttribute('aria-label', 'Drop on');
      expect(document.activeElement).toBe(within(rows[0]).getByRole('button'));
      expect(grids[1]).toHaveAttribute('data-drop-target', 'true');

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      act(() => jest.runAllTimers());

      expect(onRootDrop).toHaveBeenCalledTimes(1);
    });

    it('should support disabled drag and drop', async () => {
      let {queryAllByRole, getByRole, getAllByRole} = render(
        <DraggableTable isDisabled />
      );

      let buttons = queryAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });

      let table = getByRole('grid');
      expect(table).not.toHaveAttribute('data-allows-dragging', 'true');
      expect(table).not.toHaveAttribute('draggable', 'true');

      let rows = getAllByRole('row');
      rows.forEach(row => {
        expect(row).not.toHaveAttribute('draggable', 'true');
      });
    });

    it('should allow selection even when drag and drop is disabled', async () => {
      let {getAllByRole} = render(
        <DraggableTableWithSelection isDisabled />
    );

      for (let row of getAllByRole('row')) {
        let checkbox = within(row).getByRole('checkbox');
        expect(checkbox).not.toBeChecked();
      }

      let checkbox = getAllByRole('checkbox')[0];
      expect(checkbox).toHaveAttribute('aria-label', 'Select All');

      await user.click(checkbox);

      for (let row of getAllByRole('row')) {
        let checkbox = within(row).getByRole('checkbox');
        expect(checkbox).toBeChecked();
      }
    });
  });

  describe('column resizing', () => {
    // I'd use tree.getByRole(role, {name: text}) here, but it's unbearably slow.
    function getColumn(tree, name) {
      // Find by text, then go up to the element with the cell role.
      let el = tree.getByText(name);
      while (el && !/columnheader/.test(el.getAttribute('role'))) {
        el = el.parentElement;
      }

      return el;
    }

    function resizeCol(tree, col, delta) {
      act(() => {setInteractionModality('pointer');});
      let column = getColumn(tree, col);
      let resizer = within(column).getByRole('slider');

      fireEvent.pointerEnter(resizer);

      // actual locations do not matter, the delta matters between events for the calculation of useMove
      fireEvent.pointerDown(resizer, {pointerType: 'mouse', pointerId: 1, pageX: 0, pageY: 30});
      fireEvent.pointerMove(resizer, {pointerType: 'mouse', pointerId: 1, pageX: delta, pageY: 25});
      fireEvent.pointerUp(resizer, {pointerType: 'mouse', pointerId: 1});
    }

    function resizeTable(clientWidth, newValue) {
      clientWidth.mockImplementation(() => newValue);
      fireEvent(window, new Event('resize'));
      act(() => {jest.runAllTimers();});
    }

    let defaultColumns = [
      {name: 'Name', uid: 'name', width: '1fr'},
      {name: 'Type', uid: 'type', width: '1fr'},
      {name: 'Height', uid: 'height'},
      {name: 'Weight', uid: 'weight'},
      {name: 'Level', uid: 'level', width: '5fr'}
    ];

    resizingTests(render, (tree, ...args) => tree.rerender(...args), ResizableTable, ControlledResizableTable, resizeCol, resizeTable);

    function ResizableTable(props) {
      let {columns, rows, onResizeStart, onResize, onResizeEnd, ...otherProps} = props;
      return (
        <ResizableTableContainer onResizeStart={onResizeStart} onResize={onResize} onResizeEnd={onResizeEnd}>
          <Table aria-label="Files" {...otherProps}>
            <MyTableHeader columns={columns}>
              {column => (
                <MyColumn {...column} isRowHeader={column.id === 'name'}>
                  {column.name}
                </MyColumn>
              )}
            </MyTableHeader>
            <TableBody items={rows}>
              {item => (
                <MyRow columns={columns}>
                  {column => <Cell>{item[column.id]}</Cell>}
                </MyRow>
              )}
            </TableBody>
          </Table>
        </ResizableTableContainer>
      );
    }

    function ControlledResizableTable(props) {
      let {columns = defaultColumns, rows} = props;
      let [widths, setWidths] = useState(() => new Map(columns.filter(col => col.width).map((col) => [col.uid, col.width])));
      let cols = useMemo(() => columns.map(col => ({...col, width: widths.get(col.uid)})), [columns, widths]);
      return (
        <ResizableTableContainer onResizeStart={props.onResizeStart} onResize={w => {setWidths(w); props.onResize?.(w);}} onResizeEnd={props.onResizeEnd}>
          <Table aria-label="Files">
            <MyTableHeader columns={cols}>
              {column => (
                <MyColumn {...column} id={column.uid} isRowHeader={column.uid === 'name'} allowsResizing>
                  {column.name}
                </MyColumn>
              )}
            </MyTableHeader>
            <TableBody items={rows}>
              {item => (
                <MyRow columns={columns}>
                  {column => <Cell>{item[column.id]}</Cell>}
                </MyRow>
              )}
            </TableBody>
          </Table>
        </ResizableTableContainer>
      );
    }

    it('Column resizer accepts data attributes', () => {
      let {getAllByTestId} = render(<ControlledResizableTable />);
      let resizers = getAllByTestId('resizer');
      expect(resizers).toHaveLength(5);
    });
  });

  it('should support overriding table style', () => {
    let {getByRole} = render(
      <Table aria-label="Table" style={{width: 200}}>
        <MyTableHeader>
          <Column isRowHeader>Foo</Column>
          <Column>Bar</Column>
          <Column>Baz</Column>
        </MyTableHeader>
        <TableBody>
          <MyRow href="https://google.com">
            <Cell>Foo 1</Cell>
            <Cell>Bar 1</Cell>
            <Cell>Baz 1</Cell>
          </MyRow>
          <MyRow href="https://adobe.com">
            <Cell>Foo 2</Cell>
            <Cell>Bar 2</Cell>
            <Cell>Baz 2</Cell>
          </MyRow>
        </TableBody>
      </Table>
    );

    let table = getByRole('grid');
    expect(table).toHaveAttribute('style', expect.stringContaining('width: 200px'));
  });

  describe('links', function () {
    describe.each(['mouse', 'keyboard'])('%s', (type) => {
      let trigger = async (item, key = 'Enter') => {
        if (type === 'mouse') {
          await user.click(item);
        } else {
          fireEvent.keyDown(item, {key});
          fireEvent.keyUp(item, {key});
        }
      };

      it('should support links with selectionMode="none"', async function () {
        let {getAllByRole} = render(
          <Table aria-label="Table">
            <MyTableHeader>
              <Column isRowHeader>Foo</Column>
              <Column>Bar</Column>
              <Column>Baz</Column>
            </MyTableHeader>
            <TableBody>
              <MyRow href="https://google.com">
                <Cell>Foo 1</Cell>
                <Cell>Bar 1</Cell>
                <Cell>Baz 1</Cell>
              </MyRow>
              <MyRow href="https://adobe.com">
                <Cell>Foo 2</Cell>
                <Cell>Bar 2</Cell>
                <Cell>Baz 2</Cell>
              </MyRow>
            </TableBody>
          </Table>
        );

        let items = getAllByRole('row').slice(1);
        for (let item of items) {
          expect(item.tagName).not.toBe('A');
          expect(item).toHaveAttribute('data-href');
        }

        let onClick = mockClickDefault();
        await trigger(items[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
        expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');
      });

      it.each(['single', 'multiple'])('should support links with selectionBehavior="toggle" selectionMode="%s"', async function (selectionMode) {
        let {getAllByRole} = render(
          <Table aria-label="Table" selectionMode={selectionMode}>
            <MyTableHeader>
              <Column isRowHeader>Foo</Column>
              <Column>Bar</Column>
              <Column>Baz</Column>
            </MyTableHeader>
            <TableBody>
              <MyRow href="https://google.com">
                <Cell>Foo 1</Cell>
                <Cell>Bar 1</Cell>
                <Cell>Baz 1</Cell>
              </MyRow>
              <MyRow href="https://adobe.com">
                <Cell>Foo 2</Cell>
                <Cell>Bar 2</Cell>
                <Cell>Baz 2</Cell>
              </MyRow>
            </TableBody>
          </Table>
        );

        let items = getAllByRole('row').slice(1);
        for (let item of items) {
          expect(item.tagName).not.toBe('A');
          expect(item).toHaveAttribute('data-href');
        }

        let onClick = mockClickDefault();
        await trigger(items[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
        expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');

        await user.click(within(items[0]).getByRole('checkbox'));
        expect(items[0]).toHaveAttribute('aria-selected', 'true');

        await trigger(items[1], ' ');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(items[1]).toHaveAttribute('aria-selected', 'true');
      });

      it.each(['single', 'multiple'])('should support links with selectionBehavior="replace" selectionMode="%s"', async function (selectionMode) {
        let {getAllByRole} = render(
          <Table aria-label="Table" selectionMode={selectionMode} selectionBehavior="replace">
            <MyTableHeader>
              <Column isRowHeader>Foo</Column>
              <Column>Bar</Column>
              <Column>Baz</Column>
            </MyTableHeader>
            <TableBody>
              <MyRow href="https://google.com">
                <Cell>Foo 1</Cell>
                <Cell>Bar 1</Cell>
                <Cell>Baz 1</Cell>
              </MyRow>
              <MyRow href="https://adobe.com">
                <Cell>Foo 2</Cell>
                <Cell>Bar 2</Cell>
                <Cell>Baz 2</Cell>
              </MyRow>
            </TableBody>
          </Table>
        );

        let items = getAllByRole('row').slice(1);
        for (let item of items) {
          expect(item.tagName).not.toBe('A');
          expect(item).toHaveAttribute('data-href');
        }
        let onClick = mockClickDefault({once: true});
        if (type === 'mouse') {
          await user.click(items[0]);
        } else {
          fireEvent.keyDown(items[0], {key: ' '});
          fireEvent.keyUp(items[0], {key: ' '});
        }
        expect(onClick).not.toHaveBeenCalled();
        expect(items[0]).toHaveAttribute('aria-selected', 'true');

        if (type === 'mouse') {
          await user.dblClick(items[0], {pointerType: 'mouse'});
        } else {
          fireEvent.keyDown(items[0], {key: 'Enter'});
          fireEvent.keyUp(items[0], {key: 'Enter'});
        }
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
        expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');
      });
    });
  });

  describe('error state', () => {
    let consoleWarnSpy = jest.fn();
    let consoleWarn = console.warn;
    let consoleError = console.error;
    beforeEach(() => {
      console.warn = consoleWarnSpy;
      console.error = jest.fn();
    });

    afterEach(() => {
      console.warn = consoleWarn;
      console.error = consoleError;
      jest.clearAllMocks();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should throw a warning if the rows are rendered staticly without ids but the cells are rendered dynamically', () => {
      function StaticRowDynamicCell() {
        let columns = [
          {name: 'Name', id: 'name', isRowHeader: true},
          {name: 'Type', id: 'type'},
          {name: 'Date Modified', id: 'date'}
        ];

        return (
          <Table aria-label="Files">
            <TableHeader columns={columns}>
              {(column) => (
                <Column isRowHeader={column.isRowHeader}>{column.name}</Column>
              )}
            </TableHeader>
            <TableBody>
              <Row columns={columns}>
                {() => {
                  return <Cell>filler</Cell>;
                }}
              </Row>
              <Row columns={columns}>
                {() => {
                  return <Cell>filler</Cell>;
                }}
              </Row>
            </TableBody>
          </Table>
        );
      }

      expect(() => render(<StaticRowDynamicCell />)).toThrow('No id detected for the Row element. The Row element requires a id to be provided to it when the cells are rendered dynamically.');
    });
  });

  describe('load more spinner', () => {
    let offsetHeight, scrollHeight;
    let DndTable = stories.DndTable;
    let initialItems = [
      {id: '1', type: 'file', name: 'Adobe Photoshop'},
      {id: '2', type: 'file', name: 'Adobe XD'}
    ];
    beforeAll(function () {
      scrollHeight = jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 200);
      offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
        if (this.getAttribute('role') === 'grid') {
          return 200;
        }

        return 40;
      });
    });

    afterAll(function () {
      offsetHeight.mockReset();
      scrollHeight.mockReset();
    });

    it('should render the load more element with the expected attributes', () => {
      let {getAllByRole} = render(<LoadingMoreTable isLoadingMore />);

      let rows = getAllByRole('row');
      expect(rows).toHaveLength(6);
      let loader = rows[5];
      expect(loader).toHaveTextContent('Load more spinner');

      let cell = within(loader).getByRole('rowheader');
      expect(cell).toHaveAttribute('colspan', '3');
    });

    it('should not focus the load more row when using ArrowDown', async () => {
      let {getAllByRole} = render(<LoadingMoreTable isLoadingMore />);

      let rows = getAllByRole('row');
      let loader = rows[5];
      expect(loader).toHaveTextContent('Load more spinner');

      await user.tab();
      expect(document.activeElement).toBe(rows[1]);
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(rows[4]);

      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(rows[4]);

      // Check that it didn't shift the focusedkey to the loader key even if DOM focus didn't shift to the loader
      await user.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(rows[3]);
    });

    it('should not focus the load more row when using End', async () => {
      let {getAllByRole} = render(<LoadingMoreTable isLoadingMore />);

      let rows = getAllByRole('row');
      let loader = rows[5];
      expect(loader).toHaveTextContent('Load more spinner');

      await user.tab();
      expect(document.activeElement).toBe(rows[1]);
      await user.keyboard('{End}');
      expect(document.activeElement).toBe(rows[4]);

      // Check that it didn't shift the focusedkey to the loader key even if DOM focus didn't shift to the loader
      await user.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(rows[3]);
    });

    it('should not focus the load more row when using PageDown', async () => {
      let {getAllByRole} = render(<LoadingMoreTable isLoadingMore />);

      let rows = getAllByRole('row');
      let loader = rows[5];
      expect(loader).toHaveTextContent('Load more spinner');

      await user.tab();
      expect(document.activeElement).toBe(rows[1]);
      await user.keyboard('{PageDown}');
      expect(document.activeElement).toBe(rows[4]);

      // Check that it didn't shift the focusedkey to the loader key even if DOM focus didn't shift to the loader
      await user.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(rows[3]);

      // Check that the same when cell is focused
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(within(rows[3]).getByRole('rowheader'));
      await user.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(within(rows[2]).getByRole('rowheader'));
      await user.keyboard('{PageDown}');
      expect(document.activeElement).toBe(within(rows[4]).getByRole('rowheader'));
    });

    it('should disable the select all checkbox and column focusablity when the table is empty and loading', async () => {
      let {getByRole, getAllByRole} = render(<EmptyLoadingTable isLoading />);

      let table = getByRole('grid');
      await user.tab();
      expect(document.activeElement).toBe(table);
      let column = getAllByRole('columnheader')[0];
      expect(within(column).getByRole('checkbox', {hidden: true})).toBeDisabled();
    });

    it('should not render no results state and the loader at the same time', () => {
      let {getAllByRole, rerender} = render(<EmptyLoadingTable isLoading />);

      let rows = getAllByRole('row');
      let loader = rows[1];
      let body = getAllByRole('rowgroup')[1];

      expect(rows).toHaveLength(2);
      expect(body).toHaveAttribute('data-empty', 'true');
      expect(loader).toHaveTextContent('Loading spinner');

      rerender(<EmptyLoadingTable />);

      rows = getAllByRole('row');
      expect(rows).toHaveLength(2);
      expect(body).toHaveAttribute('data-empty', 'true');
      expect(rows[1]).toHaveTextContent('No results');
    });

    it('should not include the loader in the selection when selecting all/deselecting all', async () => {
      let onSelectionChange = jest.fn();
      let {getAllByRole} = render(<DndTable initialItems={initialItems} aria-label="selection table with loader test" isLoading onSelectionChange={onSelectionChange} />);

      let rows = getAllByRole('row');
      expect(rows).toHaveLength(4);
      let loader = rows[3];
      expect(loader).toHaveTextContent('Load more spinner');

      let selectAll = getAllByRole('checkbox')[0];
      expect(selectAll).toHaveAttribute('aria-label', 'Select All');

      await user.click(selectAll);
      expect(onSelectionChange).toHaveBeenLastCalledWith('all');

      let checkbox = getAllByRole('checkbox')[2];
      await user.click(checkbox);
      expect(new Set(onSelectionChange.mock.calls[1][0])).toEqual(new Set(['1']));
    });

    it('should not crash when dragging over the loader', async () => {
      let {getAllByRole} = render(<DndTable initialItems={initialItems} aria-label="selection table with loader test" isLoading />);

      let rows = getAllByRole('row');
      expect(rows).toHaveLength(4);
      expect(rows[1]).toHaveTextContent('Adobe Photoshop');
      let loader = rows[3];
      expect(loader).toHaveTextContent('Load more spinner');

      let dragButton = getAllByRole('button')[0];
      expect(dragButton).toHaveAttribute('aria-label', 'Drag Adobe Photoshop');
      await user.tab();
      await user.keyboard('{Right}');
      expect(document.activeElement).toBe(dragButton);
      await user.keyboard('{Enter}');
      act(() => jest.runAllTimers());
      rows = getAllByRole('row');

      // There should be 4 rows aka the drag indicator rows (1 for before the first row, between the two rows, and after the last row) + the original dragged row
      expect(rows).toHaveLength(4);
      expect(within(rows[0]).getByRole('button')).toHaveAttribute('aria-label', 'Insert before Adobe Photoshop');

      await user.keyboard('{Escape}');
      act(() => jest.runAllTimers());
      rows = getAllByRole('row');

      let dragCell = within(rows[1]).getAllByRole('rowheader')[0];

      let dataTransfer = new DataTransfer();
      fireEvent.pointerDown(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
      fireEvent(dragCell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
      let dropTarget = rows[2];
      fireEvent.pointerMove(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
      fireEvent(dragCell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
      fireEvent(dropTarget, new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 80}));
      fireEvent.pointerUp(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
      fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 80}));
      fireEvent(dragCell, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 1}));
      act(() => jest.runAllTimers());

      rows = getAllByRole('row');
      expect(rows[2]).toHaveTextContent('Adobe Photoshop');
    });
  });

  describe('async loading', function () {
    let onLoadMore = jest.fn();
    let items = [];
    for (let i = 1; i <= 10; i++) {
      items.push({id: i, foo: 'Foo ' + i, bar: 'Bar ' + i});
    }

    function LoadMoreTable({onLoadMore, isLoading, scrollOffset, items}) {
      let scrollRef = useRef(null);
      let memoedLoadMoreProps = useMemo(() => ({
        isLoading,
        onLoadMore,
        scrollOffset
      }), [isLoading, onLoadMore, scrollOffset]);
      useLoadMore(memoedLoadMoreProps, scrollRef);

      return (
        <ResizableTableContainer data-testid="scrollRegion" ref={scrollRef}>
          <Table aria-label="Load more table" onLoadMore={onLoadMore} isLoading={isLoading} scrollRef={scrollRef} scrollOffset={scrollOffset}>
            <TableHeader>
              <Column isRowHeader>Foo</Column>
              <Column>Bar</Column>
            </TableHeader>
            <TableBody items={items}>
              {(item) => (
                <Row>
                  <Cell>{item.foo}</Cell>
                  <Cell>{item.bar}</Cell>
                </Row>
              )}
            </TableBody>
          </Table>
        </ResizableTableContainer>
      );
    }

    afterEach(() => {
      onLoadMore.mockRestore();
    });

    it('should fire onLoadMore when scrolling near the bottom', function () {
      jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 100);
      jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 25);

      let tree = render(<LoadMoreTable onLoadMore={onLoadMore} />);

      let scrollView = tree.getByTestId('scrollRegion');
      expect(onLoadMore).toHaveBeenCalledTimes(0);

      scrollView.scrollTop = 50;
      fireEvent.scroll(scrollView);
      act(() => {jest.runAllTimers();});

      expect(onLoadMore).toHaveBeenCalledTimes(0);

      scrollView.scrollTop = 76;
      fireEvent.scroll(scrollView);
      act(() => {jest.runAllTimers();});

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('doesn\'t call onLoadMore if it is already loading items', function () {
      jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 100);
      jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 25);

      let tree = render(<LoadMoreTable onLoadMore={onLoadMore} isLoading />);

      let scrollView = tree.getByTestId('scrollRegion');
      expect(onLoadMore).toHaveBeenCalledTimes(0);

      scrollView.scrollTop = 76;
      fireEvent.scroll(scrollView);
      act(() => {jest.runAllTimers();});

      expect(onLoadMore).toHaveBeenCalledTimes(0);

      tree.rerender(<LoadMoreTable onLoadMore={onLoadMore} />);

      fireEvent.scroll(scrollView);
      act(() => {jest.runAllTimers();});
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should automatically fire onLoadMore if there aren\'t enough items to fill the Table', function () {
      jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 100);
      jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 100);

      let tree = render(<LoadMoreTable onLoadMore={onLoadMore} isLoading items={items} />);
      tree.rerender(<LoadMoreTable onLoadMore={onLoadMore} items={items} />);

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    // TODO: this test doesn't work due to the TableBody not being rendered immediately, hence scrollRef.current is undef when
    // we try to attach it via useEvent
    // This could be remedied perhaps by moving the useLoadOnScroll call to TableBody internally and passing down the scrollRef and other load props via context from body.
    // That would guarentee that the ref for the table body is defined at the time the hook renders. Stashed this change locally, to be discussed.
    it.skip('accepts a user defined scrollRef', function () {
      jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 100);
      jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 25);
      let LoadMoreTableBodyScroll = ({onLoadMore, isLoading, scrollOffset, items}) => {
        let scrollRef = React.useRef();
        return (
          <Table aria-label="Load more table" onLoadMore={onLoadMore} isLoading={isLoading} scrollRef={scrollRef} scrollOffset={scrollOffset}>
            <TableHeader>
              <Column isRowHeader>Foo</Column>
              <Column>Bar</Column>
            </TableHeader>
            <TableBody items={items} ref={scrollRef}>
              {(item) => (
                <Row>
                  <Cell>{item.foo}</Cell>
                  <Cell>{item.bar}</Cell>
                </Row>
              )}
            </TableBody>
          </Table>
        );
      };

      let tree = render(<LoadMoreTableBodyScroll onLoadMore={onLoadMore} />);

      let table = tree.getByRole('grid');
      expect(onLoadMore).toHaveBeenCalledTimes(0);

      table.scrollTop = 76;
      fireEvent.scroll(table);
      act(() => {jest.runAllTimers();});

      expect(onLoadMore).toHaveBeenCalledTimes(0);

      let scrollView = tree.getAllByRole('rowgroup')[1];
      scrollView.scrollTop = 76;
      fireEvent.scroll(scrollView);
      act(() => {jest.runAllTimers();});
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('allows the user to customize the scrollOffset required to trigger onLoadMore', function () {
      jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 100);
      jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 25);

      let tree = render(<LoadMoreTable onLoadMore={onLoadMore} scrollOffset={2} />);

      let scrollView = tree.getByTestId('scrollRegion');
      expect(onLoadMore).toHaveBeenCalledTimes(0);

      scrollView.scrollTop = 50;
      fireEvent.scroll(scrollView);
      act(() => {jest.runAllTimers();});

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('works with virtualizer', function () {
      let items = [];
      for (let i = 0; i < 6; i++) {
        items.push({id: i, foo: 'Foo ' + i, bar: 'Bar ' + i});
      }
      function VirtualizedTableLoad() {
        let layout = new TableLayout({
          rowHeight: 25
        });

        let scrollRef = useRef(null);
        useLoadMore({onLoadMore}, scrollRef);

        return (
          <Virtualizer layout={layout}>
            <Table aria-label="Load more table" ref={scrollRef} onLoadMore={onLoadMore}>
              <TableHeader>
                <Column isRowHeader>Foo</Column>
                <Column>Bar</Column>
              </TableHeader>
              <TableBody items={items}>
                {item => (
                  <Row>
                    <Cell>{item.foo}</Cell>
                    <Cell>{item.bar}</Cell>
                  </Row>
                )}
              </TableBody>
            </Table>
          </Virtualizer>
        );
      }

      jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 150);
      jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 100);
      jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementationOnce(() => 0).mockImplementation(function () {
        if (this.getAttribute('role') === 'grid') {
          return 50;
        }

        return 25;
      });

      let {getByRole} = render(<VirtualizedTableLoad />);

      let scrollView = getByRole('grid');
      expect(onLoadMore).toHaveBeenCalledTimes(0);

      scrollView.scrollTop = 50;
      fireEvent.scroll(scrollView);
      act(() => {jest.runAllTimers();});

      expect(onLoadMore).toHaveBeenCalledTimes(0);

      scrollView.scrollTop = 76;
      fireEvent.scroll(scrollView);
      act(() => {jest.runAllTimers();});

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  describe('with pointer events', () => {
    installPointerEvent();

    it('should show checkboxes on long press', async () => {
      let {getAllByRole} = renderTable({
        tableProps: {
          selectionMode: 'multiple',
          selectionBehavior: 'replace',
          onRowAction: () => {}
        }
      });

      for (let row of getAllByRole('row')) {
        let checkbox = within(row).queryByRole('checkbox');
        expect(checkbox).toBeNull();
      }

      let row = getAllByRole('row')[1];
      // Note that long press interactions with rows is strictly touch only for grid rows
      await triggerLongPress({element: row, advanceTimer: jest.advanceTimersByTime, pointerOpts: {pointerType: 'touch'}});
      expect(row).toHaveAttribute('aria-selected', 'true');

      for (let row of getAllByRole('row')) {
        let checkbox = within(row).queryByRole('checkbox');
        expect(checkbox).toBeInTheDocument();
      }
    });
  });

  describe('contexts', () => {
    it('should not propagate the checkbox context from selection into other cells', async () => {
      let tree = render(
        <Table aria-label="Files" selectionMode="multiple">
          <MyTableHeader>
            <MyColumn id="name" isRowHeader>Name</MyColumn>
            <MyColumn>Type</MyColumn>
            <MyColumn>Date Modified</MyColumn>
          </MyTableHeader>
          <TableBody>
            <MyRow id="1" textValue="Games">
              <Cell>Games</Cell>
              <Cell>File folder</Cell>
              <Cell>
                <DialogTrigger>
                  <Button>Open</Button>
                  <Modal>
                    <Dialog>
                      <Checkbox><Label>Agree</Label></Checkbox>
                    </Dialog>
                  </Modal>
                </DialogTrigger>
              </Cell>
            </MyRow>
          </TableBody>
        </Table>
      );
      await user.click(tree.getByRole('button'));
      let checkbox = tree.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });
  });
});
