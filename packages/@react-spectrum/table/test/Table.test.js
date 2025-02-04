/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

jest.mock('@react-aria/live-announcer');
jest.mock('@react-aria/utils/src/scrollIntoView');
import {act, fireEvent, installPointerEvent, mockClickDefault, pointerMap, render as renderComponent, User, within} from '@react-spectrum/test-utils-internal';
import {ActionButton, Button} from '@react-spectrum/button';
import Add from '@spectrum-icons/workflow/Add';
import {announce} from '@react-aria/live-announcer';
import {ButtonGroup} from '@react-spectrum/buttongroup';
import {Cell, Column, Row, TableBody, TableHeader, TableView} from '../';
import {composeStories} from '@storybook/react';
import {Content} from '@react-spectrum/view';
import {CRUDExample} from '../stories/CRUDExample';
import {Dialog, DialogTrigger} from '@react-spectrum/dialog';
import {Divider} from '@react-spectrum/divider';
import {enableTableNestedRows} from '@react-stately/flags';
import {getFocusableTreeWalker} from '@react-aria/focus';
import {Heading} from '@react-spectrum/text';
import {Item, Picker} from '@react-spectrum/picker';
import {Link} from '@react-spectrum/link';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {scrollIntoView} from '@react-aria/utils';
import * as stories from '../stories/Table.stories';
import {Switch} from '@react-spectrum/switch';
import {TextField} from '@react-spectrum/textfield';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

let {
  InlineDeleteButtons: DeletableRowsTable,
  EmptyStateStory: EmptyStateTable,
  WithBreadcrumbNavigation: TableWithBreadcrumbs,
  TypeaheadWithDialog: TypeaheadWithDialog,
  ColumnHeaderFocusRingTable
} = composeStories(stories);


let columns = [
  {name: 'Foo', key: 'foo'},
  {name: 'Bar', key: 'bar'},
  {name: 'Baz', key: 'baz'}
];

let nestedColumns = [
  {name: 'Test', key: 'test'},
  {name: 'Tiered One Header', key: 'tier1', children: [
    {name: 'Tier Two Header A', key: 'tier2a', children: [
      {name: 'Foo', key: 'foo'},
      {name: 'Bar', key: 'bar'}
    ]},
    {name: 'Yay', key: 'yay'},
    {name: 'Tier Two Header B', key: 'tier2b', children: [
      {name: 'Baz', key: 'baz'}
    ]}
  ]}
];

let items = [
  {test: 'Test 1', foo: 'Foo 1', bar: 'Bar 1', yay: 'Yay 1', baz: 'Baz 1'},
  {test: 'Test 2', foo: 'Foo 2', bar: 'Bar 2', yay: 'Yay 2', baz: 'Baz 2'}
];

let itemsWithFalsyId = [
  {test: 'Test 1', foo: 'Foo 1', bar: 'Bar 1', yay: 'Yay 1', baz: 'Baz 1', id: 0},
  {test: 'Test 2', foo: 'Foo 2', bar: 'Bar 2', yay: 'Yay 2', baz: 'Baz 2', id: 1}
];

let manyItems = [];
for (let i = 1; i <= 100; i++) {
  manyItems.push({id: i, foo: 'Foo ' + i, bar: 'Bar ' + i, baz: 'Baz ' + i});
}

let manyColumns = [];
for (let i = 1; i <= 100; i++) {
  manyColumns.push({id: i, name: 'Column ' + i});
}

function ExampleSortTable() {
  let [sortDescriptor, setSortDescriptor] = React.useState({column: 'bar', direction: 'ascending'});

  return (
    <TableView aria-label="Table" sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
      <TableHeader>
        <Column key="foo" allowsSorting>Foo</Column>
        <Column key="bar" allowsSorting>Bar</Column>
        <Column key="baz">Baz</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>Foo 1</Cell>
          <Cell>Bar 1</Cell>
          <Cell>Baz 1</Cell>
        </Row>
      </TableBody>
    </TableView>
  );
}

let defaultTable = (
  <TableView aria-label="Table">
    <TableHeader>
      <Column key="foo">Foo</Column>
      <Column key="bar">Bar</Column>
    </TableHeader>
    <TableBody>
      <Row>
        <Cell>Foo 1</Cell>
        <Cell>Bar 1</Cell>
      </Row>
      <Row>
        <Cell>Foo 2</Cell>
        <Cell>Bar 2</Cell>
      </Row>
    </TableBody>
  </TableView>
);

function pointerEvent(type, opts) {
  let evt = new Event(type, {bubbles: true, cancelable: true});
  Object.assign(evt, {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    button: opts.button || 0,
    width: opts.width == null ? undefined : opts.width ?? 1,
    height: opts.height == null ? undefined : opts.height ?? 1
  }, opts);
  return evt;
}

export let tableTests = () => {
  let offsetWidth, offsetHeight;
  let user;
  let testUtilUser = new User({advanceTimer: (time) => jest.advanceTimersByTime(time)});

  beforeAll(function () {
    user = userEvent.setup({delay: null, pointerMap});
    offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    jest.useFakeTimers();
  });

  afterAll(function () {
    offsetWidth.mockReset();
    offsetHeight.mockReset();
  });

  afterEach(() => {
    act(() => {jest.runAllTimers();});
  });

  let render = (children, scale = 'medium') => {
    let tree = renderComponent(
      <Provider theme={theme} scale={scale}>
        {children}
      </Provider>
    );
    // account for table column resizing to do initial pass due to relayout from useTableColumnResizeState render
    act(() => {jest.runAllTimers();});
    return tree;
  };

  let rerender = (tree, children, scale = 'medium') => {
    let newTree = tree.rerender(
      <Provider theme={theme} scale={scale}>
        {children}
      </Provider>
    );
    act(() => {jest.runAllTimers();});
    return newTree;
  };
  // I'd use tree.getByRole(role, {name: text}) here, but it's unbearably slow.
  let getCell = (tree, text) => {
    // Find by text, then go up to the element with the cell role.
    let el = tree.getByText(text);
    while (el && !/gridcell|rowheader|columnheader/.test(el.getAttribute('role'))) {
      el = el.parentElement;
    }

    return el;
  };

  let focusCell = (tree, text) => act(() => getCell(tree, text).focus());
  let moveFocus = (key, opts = {}) => {fireEvent.keyDown(document.activeElement, {key, ...opts});};

  it('renders a static table', function () {
    let {getByRole} = render(
      <TableView aria-label="Table" data-testid="test">
        <TableHeader>
          <Column>Foo</Column>
          <Column>Bar</Column>
          <Column>Baz</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>Foo 1</Cell>
            <Cell>Bar 1</Cell>
            <Cell>Baz 1</Cell>
          </Row>
          <Row>
            <Cell>Foo 2</Cell>
            <Cell>Bar 2</Cell>
            <Cell>Baz 2</Cell>
          </Row>
        </TableBody>
      </TableView>
    );

    let grid = getByRole('grid');
    expect(grid).toBeVisible();
    expect(grid).toHaveAttribute('aria-label', 'Table');
    expect(grid).toHaveAttribute('data-testid', 'test');

    expect(grid).toHaveAttribute('aria-rowcount', '3');
    expect(grid).toHaveAttribute('aria-colcount', '3');

    let rowgroups = within(grid).getAllByRole('rowgroup');
    expect(rowgroups).toHaveLength(2);

    let headerRows = within(rowgroups[0]).getAllByRole('row');
    expect(headerRows).toHaveLength(1);
    expect(headerRows[0]).toHaveAttribute('aria-rowindex', '1');

    let headers = within(grid).getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveAttribute('aria-colindex', '1');
    expect(headers[1]).toHaveAttribute('aria-colindex', '2');
    expect(headers[2]).toHaveAttribute('aria-colindex', '3');

    for (let header of headers) {
      expect(header).not.toHaveAttribute('aria-sort');
      expect(header).not.toHaveAttribute('aria-describedby');
    }

    expect(headers[0]).toHaveTextContent('Foo');
    expect(headers[1]).toHaveTextContent('Bar');
    expect(headers[2]).toHaveTextContent('Baz');

    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute('aria-rowindex', '2');
    expect(rows[1]).toHaveAttribute('aria-rowindex', '3');

    let rowheader = within(rows[0]).getByRole('rowheader');
    let cellSpan = within(rowheader).getByText('Foo 1');
    expect(rowheader).toHaveTextContent('Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');

    expect(rows[0]).toHaveAttribute('aria-labelledby', cellSpan.id);

    rowheader = within(rows[1]).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Foo 2');
    expect(rowheader).toHaveTextContent('Foo 2');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');

    expect(rows[1]).not.toHaveAttribute('aria-selected');
    expect(rows[1]).toHaveAttribute('aria-labelledby', cellSpan.id);


    let cells = within(rowgroups[1]).getAllByRole('gridcell');
    expect(cells).toHaveLength(4);

    expect(cells[0]).toHaveAttribute('aria-colindex', '2');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '2');
    expect(cells[3]).toHaveAttribute('aria-colindex', '3');
  });

  it('renders a static table with selection', function () {
    let {getByRole} = render(
      <TableView aria-label="Table" data-testid="test" selectionMode="multiple">
        <TableHeader>
          <Column>Foo</Column>
          <Column>Bar</Column>
          <Column>Baz</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>Foo 1</Cell>
            <Cell>Bar 1</Cell>
            <Cell>Baz 1</Cell>
          </Row>
          <Row>
            <Cell>Foo 2</Cell>
            <Cell>Bar 2</Cell>
            <Cell>Baz 2</Cell>
          </Row>
        </TableBody>
      </TableView>
    );

    let grid = getByRole('grid');
    expect(grid).toBeVisible();
    expect(grid).toHaveAttribute('aria-label', 'Table');
    expect(grid).toHaveAttribute('data-testid', 'test');
    expect(grid).toHaveAttribute('aria-multiselectable', 'true');
    expect(grid).toHaveAttribute('aria-rowcount', '3');
    expect(grid).toHaveAttribute('aria-colcount', '4');

    let rowgroups = within(grid).getAllByRole('rowgroup');
    expect(rowgroups).toHaveLength(2);

    let headerRows = within(rowgroups[0]).getAllByRole('row');
    expect(headerRows).toHaveLength(1);
    expect(headerRows[0]).toHaveAttribute('aria-rowindex', '1');

    let headers = within(grid).getAllByRole('columnheader');
    expect(headers).toHaveLength(4);
    expect(headers[0]).toHaveAttribute('aria-colindex', '1');
    expect(headers[1]).toHaveAttribute('aria-colindex', '2');
    expect(headers[2]).toHaveAttribute('aria-colindex', '3');
    expect(headers[3]).toHaveAttribute('aria-colindex', '4');

    for (let header of headers) {
      expect(header).not.toHaveAttribute('aria-sort');
      expect(header).not.toHaveAttribute('aria-describedby');
    }

    let checkbox = within(headers[0]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select All');

    expect(headers[1]).toHaveTextContent('Foo');
    expect(headers[2]).toHaveTextContent('Bar');
    expect(headers[3]).toHaveTextContent('Baz');

    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute('aria-rowindex', '2');
    expect(rows[1]).toHaveAttribute('aria-rowindex', '3');

    let rowheader = within(rows[0]).getByRole('rowheader');
    let cellSpan = within(rowheader).getByText('Foo 1');
    expect(rowheader).toHaveTextContent('Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');

    expect(rows[0]).toHaveAttribute('aria-selected', 'false');
    expect(rows[0]).toHaveAttribute('aria-labelledby', cellSpan.id);

    checkbox = within(rows[0]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    rowheader = within(rows[1]).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Foo 2');
    expect(rowheader).toHaveTextContent('Foo 2');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');

    expect(rows[1]).toHaveAttribute('aria-selected', 'false');
    expect(rows[1]).toHaveAttribute('aria-labelledby', cellSpan.id);


    checkbox = within(rows[1]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    let cells = within(rowgroups[1]).getAllByRole('gridcell');
    expect(cells).toHaveLength(6);

    expect(cells[0]).toHaveAttribute('aria-colindex', '1');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '4');
    expect(cells[3]).toHaveAttribute('aria-colindex', '1');
    expect(cells[4]).toHaveAttribute('aria-colindex', '3');
    expect(cells[5]).toHaveAttribute('aria-colindex', '4');
  });

  it('accepts a UNSAFE_className', function () {
    let {getByRole} = render(
      <TableView aria-label="Table" data-testid="test" selectionMode="multiple" UNSAFE_className="test-class">
        <TableHeader>
          <Column>Foo</Column>
          <Column>Bar</Column>
          <Column>Baz</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>Foo 1</Cell>
            <Cell>Bar 1</Cell>
            <Cell>Baz 1</Cell>
          </Row>
          <Row>
            <Cell>Foo 2</Cell>
            <Cell>Bar 2</Cell>
            <Cell>Baz 2</Cell>
          </Row>
        </TableBody>
      </TableView>
    );

    let grid = getByRole('grid');
    expect(grid).toHaveAttribute('class', expect.stringContaining('test-class'));
  });

  it('renders a dynamic table', function () {
    let {getByRole} = render(
      <TableView aria-label="Table">
        <TableHeader columns={columns}>
          {column => <Column>{column.name}</Column>}
        </TableHeader>
        <TableBody items={items}>
          {item =>
            (<Row key={item.foo}>
              {key => <Cell>{item[key]}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
    );

    let grid = getByRole('grid');
    expect(grid).toBeVisible();
    expect(grid).toHaveAttribute('aria-rowcount', '3');
    expect(grid).toHaveAttribute('aria-colcount', '3');

    let rowgroups = within(grid).getAllByRole('rowgroup');
    expect(rowgroups).toHaveLength(2);

    let headerRows = within(rowgroups[0]).getAllByRole('row');
    expect(headerRows).toHaveLength(1);
    expect(headerRows[0]).toHaveAttribute('aria-rowindex', '1');

    let headers = within(grid).getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveAttribute('aria-colindex', '1');
    expect(headers[1]).toHaveAttribute('aria-colindex', '2');
    expect(headers[2]).toHaveAttribute('aria-colindex', '3');

    expect(headers[0]).toHaveTextContent('Foo');
    expect(headers[1]).toHaveTextContent('Bar');
    expect(headers[2]).toHaveTextContent('Baz');

    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(2);

    let rowheader = within(rows[0]).getByRole('rowheader');
    let cellSpan = within(rowheader).getByText('Foo 1');
    expect(rowheader).toHaveTextContent('Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');

    expect(rows[0]).toHaveAttribute('aria-labelledby', cellSpan.id);

    rowheader = within(rows[1]).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Foo 2');
    expect(rowheader).toHaveTextContent('Foo 2');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');

    expect(rows[1]).not.toHaveAttribute('aria-selected');
    expect(rows[1]).toHaveAttribute('aria-labelledby', cellSpan.id);

    let cells = within(rowgroups[1]).getAllByRole('gridcell');
    expect(cells).toHaveLength(4);

    expect(cells[0]).toHaveAttribute('aria-colindex', '2');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '2');
    expect(cells[3]).toHaveAttribute('aria-colindex', '3');
  });

  it('renders a dynamic table with selection', function () {
    let {getByRole} = render(
      <TableView aria-label="Table" selectionMode="multiple">
        <TableHeader columns={columns}>
          {column => <Column>{column.name}</Column>}
        </TableHeader>
        <TableBody items={items}>
          {item =>
            (<Row key={item.foo}>
              {key => <Cell>{item[key]}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
    );

    let grid = getByRole('grid');
    expect(grid).toBeVisible();
    expect(grid).toHaveAttribute('aria-multiselectable', 'true');
    expect(grid).toHaveAttribute('aria-rowcount', '3');
    expect(grid).toHaveAttribute('aria-colcount', '4');

    let rowgroups = within(grid).getAllByRole('rowgroup');
    expect(rowgroups).toHaveLength(2);

    let headerRows = within(rowgroups[0]).getAllByRole('row');
    expect(headerRows).toHaveLength(1);
    expect(headerRows[0]).toHaveAttribute('aria-rowindex', '1');

    let headers = within(grid).getAllByRole('columnheader');
    expect(headers).toHaveLength(4);
    expect(headers[0]).toHaveAttribute('aria-colindex', '1');
    expect(headers[1]).toHaveAttribute('aria-colindex', '2');
    expect(headers[2]).toHaveAttribute('aria-colindex', '3');
    expect(headers[3]).toHaveAttribute('aria-colindex', '4');

    let checkbox = within(headers[0]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select All');

    expect(headers[1]).toHaveTextContent('Foo');
    expect(headers[2]).toHaveTextContent('Bar');
    expect(headers[3]).toHaveTextContent('Baz');

    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(2);

    let rowheader = within(rows[0]).getByRole('rowheader');
    let cellSpan = within(rowheader).getByText('Foo 1');
    expect(rowheader).toHaveTextContent('Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');

    expect(rows[0]).toHaveAttribute('aria-selected', 'false');
    expect(rows[0]).toHaveAttribute('aria-labelledby', cellSpan.id);

    checkbox = within(rows[0]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    rowheader = within(rows[1]).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Foo 2');
    expect(rowheader).toHaveTextContent('Foo 2');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');

    expect(rows[1]).toHaveAttribute('aria-selected', 'false');
    expect(rows[1]).toHaveAttribute('aria-labelledby', cellSpan.id);


    checkbox = within(rows[1]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    let cells = within(rowgroups[1]).getAllByRole('gridcell');
    expect(cells).toHaveLength(6);

    expect(cells[0]).toHaveAttribute('aria-colindex', '1');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '4');
    expect(cells[3]).toHaveAttribute('aria-colindex', '1');
    expect(cells[4]).toHaveAttribute('aria-colindex', '3');
    expect(cells[5]).toHaveAttribute('aria-colindex', '4');
  });

  it('renders contents even with falsy row ids', function () {
    // TODO: doesn't support empty string ids, fix for that to come
    let {getByRole} = render(
      <TableView aria-label="Table">
        <TableHeader columns={columns}>
          {column => <Column>{column.name}</Column>}
        </TableHeader>
        <TableBody items={itemsWithFalsyId}>
          {item =>
            (<Row>
              {key => <Cell>{item[key]}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
    );

    let grid = getByRole('grid');
    let rows = within(grid).getAllByRole('row');
    expect(rows).toHaveLength(3);

    for (let [i, row] of rows.entries()) {
      if (i === 0) {
        let columnheaders = within(row).getAllByRole('columnheader');
        expect(columnheaders).toHaveLength(3);
        for (let [j, columnheader] of columnheaders.entries()) {
          expect(within(columnheader).getByText(columns[j].name)).toBeTruthy();
        }
      } else {
        let rowheader = within(row).getByRole('rowheader');
        expect(within(rowheader).getByText(itemsWithFalsyId[i - 1][columns[0].key])).toBeTruthy();
        let cells = within(row).getAllByRole('gridcell');
        expect(cells).toHaveLength(2);
        expect(within(cells[0]).getByText(itemsWithFalsyId[i - 1][columns[1].key])).toBeTruthy();
        expect(within(cells[1]).getByText(itemsWithFalsyId[i - 1][columns[2].key])).toBeTruthy();
      }
    }
  });

  it('renders a static table with nested columns', function () {
    let {getByRole} = render(
      <TableView aria-label="Table" selectionMode="multiple">
        <TableHeader>
          <Column key="test">Test</Column>
          <Column title="Group 1">
            <Column key="foo">Foo</Column>
            <Column key="bar">Bar</Column>
          </Column>
          <Column title="Group 2">
            <Column key="baz">Baz</Column>
          </Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>Test 1</Cell>
            <Cell>Foo 1</Cell>
            <Cell>Bar 1</Cell>
            <Cell>Baz 1</Cell>
          </Row>
          <Row>
            <Cell>Test 2</Cell>
            <Cell>Foo 2</Cell>
            <Cell>Bar 2</Cell>
            <Cell>Baz 2</Cell>
          </Row>
        </TableBody>
      </TableView>
    );

    let grid = getByRole('grid');
    expect(grid).toBeVisible();
    expect(grid).toHaveAttribute('aria-multiselectable', 'true');
    expect(grid).toHaveAttribute('aria-rowcount', '4');
    expect(grid).toHaveAttribute('aria-colcount', '5');

    let rowgroups = within(grid).getAllByRole('rowgroup');
    expect(rowgroups).toHaveLength(2);

    let headerRows = within(rowgroups[0]).getAllByRole('row');
    expect(headerRows).toHaveLength(2);
    expect(headerRows[0]).toHaveAttribute('aria-rowindex', '1');
    expect(headerRows[1]).toHaveAttribute('aria-rowindex', '2');

    let headers = within(headerRows[0]).getAllByRole('columnheader');
    let placeholderCells = within(headerRows[0]).getAllByRole('gridcell');
    expect(headers).toHaveLength(2);
    expect(placeholderCells).toHaveLength(1);

    expect(placeholderCells[0]).toHaveTextContent('');
    expect(placeholderCells[0]).toHaveAttribute('aria-colspan', '2');
    expect(placeholderCells[0]).toHaveAttribute('aria-colindex', '1');

    expect(headers[0]).toHaveTextContent('Group 1');
    expect(headers[0]).toHaveAttribute('aria-colspan', '2');
    expect(headers[0]).toHaveAttribute('aria-colindex', '3');
    expect(headers[1]).toHaveTextContent('Group 2');
    expect(headers[1]).toHaveAttribute('aria-colindex', '5');

    headers = within(headerRows[1]).getAllByRole('columnheader');
    expect(headers).toHaveLength(5);
    expect(headers[0]).toHaveAttribute('aria-colindex', '1');
    expect(headers[1]).toHaveAttribute('aria-colindex', '2');
    expect(headers[2]).toHaveAttribute('aria-colindex', '3');
    expect(headers[3]).toHaveAttribute('aria-colindex', '4');
    expect(headers[4]).toHaveAttribute('aria-colindex', '5');

    let checkbox = within(headers[0]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select All');

    expect(headers[1]).toHaveTextContent('Test');
    expect(headers[2]).toHaveTextContent('Foo');
    expect(headers[3]).toHaveTextContent('Bar');
    expect(headers[4]).toHaveTextContent('Baz');

    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(2);

    let rowheader = within(rows[0]).getByRole('rowheader');
    let cellSpan = within(rowheader).getByText('Test 1');
    expect(rowheader).toHaveTextContent('Test 1');

    expect(rows[0]).toHaveAttribute('aria-selected', 'false');
    expect(rows[0]).toHaveAttribute('aria-labelledby', cellSpan.id);
    expect(rows[0]).toHaveAttribute('aria-rowindex', '3');

    checkbox = within(rows[0]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    rowheader = within(rows[1]).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Test 2');
    expect(rowheader).toHaveTextContent('Test 2');

    expect(rows[1]).toHaveAttribute('aria-selected', 'false');
    expect(rows[1]).toHaveAttribute('aria-labelledby', cellSpan.id);
    expect(rows[1]).toHaveAttribute('aria-rowindex', '4');


    checkbox = within(rows[1]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    let cells = within(rowgroups[1]).getAllByRole('gridcell');
    expect(cells).toHaveLength(8);
  });

  it('renders a dynamic table with nested columns', function () {
    let {getByRole} = render(
      <TableView aria-label="Table" selectionMode="multiple">
        <TableHeader columns={nestedColumns}>
          {column =>
            <Column childColumns={column.children}>{column.name}</Column>
          }
        </TableHeader>
        <TableBody items={items}>
          {item =>
            (<Row key={item.foo}>
              {key => <Cell>{item[key]}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
    );

    let grid = getByRole('grid');
    expect(grid).toBeVisible();
    expect(grid).toHaveAttribute('aria-multiselectable', 'true');
    expect(grid).toHaveAttribute('aria-rowcount', '5');
    expect(grid).toHaveAttribute('aria-colcount', '6');

    let rowgroups = within(grid).getAllByRole('rowgroup');
    expect(rowgroups).toHaveLength(2);

    let headerRows = within(rowgroups[0]).getAllByRole('row');
    expect(headerRows).toHaveLength(3);
    expect(headerRows[0]).toHaveAttribute('aria-rowindex', '1');
    expect(headerRows[1]).toHaveAttribute('aria-rowindex', '2');
    expect(headerRows[2]).toHaveAttribute('aria-rowindex', '3');

    let headers = within(headerRows[0]).getAllByRole('columnheader');
    let placeholderCells = within(headerRows[0]).getAllByRole('gridcell');
    expect(headers).toHaveLength(1);
    expect(placeholderCells).toHaveLength(1);

    expect(placeholderCells[0]).toHaveTextContent('');
    expect(placeholderCells[0]).toHaveAttribute('aria-colspan', '2');
    expect(placeholderCells[0]).toHaveAttribute('aria-colindex', '1');
    expect(headers[0]).toHaveTextContent('Tiered One Header');
    expect(headers[0]).toHaveAttribute('aria-colspan', '4');
    expect(headers[0]).toHaveAttribute('aria-colindex', '3');

    headers = within(headerRows[1]).getAllByRole('columnheader');
    placeholderCells = within(headerRows[1]).getAllByRole('gridcell');
    expect(headers).toHaveLength(2);
    expect(placeholderCells).toHaveLength(2);

    expect(placeholderCells[0]).toHaveTextContent('');
    expect(placeholderCells[0]).toHaveAttribute('aria-colspan', '2');
    expect(placeholderCells[0]).toHaveAttribute('aria-colindex', '1');
    expect(headers[0]).toHaveTextContent('Tier Two Header A');
    expect(headers[0]).toHaveAttribute('aria-colspan', '2');
    expect(headers[0]).toHaveAttribute('aria-colindex', '3');
    expect(placeholderCells[1]).toHaveTextContent('');
    expect(placeholderCells[1]).toHaveAttribute('aria-colindex', '5');
    expect(headers[1]).toHaveTextContent('Tier Two Header B');
    expect(headers[1]).toHaveAttribute('aria-colindex', '6');

    headers = within(headerRows[2]).getAllByRole('columnheader');
    expect(headers).toHaveLength(6);

    let checkbox = within(headers[0]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select All');

    expect(headers[1]).toHaveTextContent('Test');
    expect(headers[2]).toHaveTextContent('Foo');
    expect(headers[3]).toHaveTextContent('Bar');
    expect(headers[4]).toHaveTextContent('Yay');
    expect(headers[5]).toHaveTextContent('Baz');

    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(2);

    let rowheader = within(rows[0]).getByRole('rowheader');
    let cellSpan = within(rowheader).getByText('Test 1');
    expect(rowheader).toHaveTextContent('Test 1');

    expect(rows[0]).toHaveAttribute('aria-selected', 'false');
    expect(rows[0]).toHaveAttribute('aria-labelledby', cellSpan.id);
    expect(rows[0]).toHaveAttribute('aria-rowindex', '4');

    checkbox = within(rows[0]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    rowheader = within(rows[1]).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Test 2');
    expect(rowheader).toHaveTextContent('Test 2');

    expect(rows[1]).toHaveAttribute('aria-selected', 'false');
    expect(rows[1]).toHaveAttribute('aria-labelledby', cellSpan.id);
    expect(rows[1]).toHaveAttribute('aria-rowindex', '5');


    checkbox = within(rows[1]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    let cells = within(rowgroups[1]).getAllByRole('gridcell');
    expect(cells).toHaveLength(10);
  });

  it('renders a table with multiple row headers', function () {
    let {getByRole} = render(
      <TableView aria-label="Table" selectionMode="multiple">
        <TableHeader>
          <Column isRowHeader>First Name</Column>
          <Column isRowHeader>Last Name</Column>
          <Column>Birthday</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>Sam</Cell>
            <Cell>Smith</Cell>
            <Cell>May 3</Cell>
          </Row>
          <Row>
            <Cell>Julia</Cell>
            <Cell>Jones</Cell>
            <Cell>February 10</Cell>
          </Row>
        </TableBody>
      </TableView>
    );

    let grid = getByRole('grid');
    let rowgroups = within(grid).getAllByRole('rowgroup');
    let rows = within(rowgroups[1]).getAllByRole('row');

    let rowheaders = within(rows[0]).getAllByRole('rowheader');
    expect(rowheaders).toHaveLength(2);
    expect(rowheaders[0]).toHaveTextContent('Sam');
    expect(rowheaders[1]).toHaveTextContent('Smith');
    let firstCellSpan = within(rowheaders[0]).getByText('Sam');
    let secondCellSpan = within(rowheaders[1]).getByText('Smith');

    expect(rows[0]).toHaveAttribute('aria-labelledby', `${firstCellSpan.id} ${secondCellSpan.id}`);

    let checkbox = within(rows[0]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${firstCellSpan.id} ${secondCellSpan.id}`);

    rowheaders = within(rows[1]).getAllByRole('rowheader');
    expect(rowheaders).toHaveLength(2);
    expect(rowheaders[0]).toHaveTextContent('Julia');
    expect(rowheaders[1]).toHaveTextContent('Jones');
    firstCellSpan = within(rowheaders[0]).getByText('Julia');
    secondCellSpan = within(rowheaders[1]).getByText('Jones');

    expect(rows[1]).toHaveAttribute('aria-labelledby', `${firstCellSpan.id} ${secondCellSpan.id}`);

    checkbox = within(rows[1]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${firstCellSpan.id} ${secondCellSpan.id}`);
  });

  describe('keyboard focus', function () {
    // locale is being set here, since we can't nest them, use original render function
    let renderTable = (locale = 'en-US', props = {}) => {
      let tree = renderComponent(
        <Provider locale={locale} theme={theme}>
          <TableView aria-label="Table" {...props}>
            <TableHeader columns={columns}>
              {column => <Column>{column.name}</Column>}
            </TableHeader>
            <TableBody items={items}>
              {item =>
                (<Row key={item.foo}>
                  {key => <Cell>{item[key]}</Cell>}
                </Row>)
              }
            </TableBody>
          </TableView>
        </Provider>
      );
      act(() => {jest.runAllTimers();});
      return tree;
    };

    // locale is being set here, since we can't nest them, use original render function
    let renderNested = (locale = 'en-US') => {
      let tree = renderComponent(
        <Provider locale={locale} theme={theme}>
          <TableView aria-label="Table">
            <TableHeader columns={nestedColumns}>
              {column =>
                <Column childColumns={column.children}>{column.name}</Column>
              }
            </TableHeader>
            <TableBody items={items}>
              {item =>
                (<Row key={item.foo}>
                  {key => <Cell>{item[key]}</Cell>}
                </Row>)
              }
            </TableBody>
          </TableView>
        </Provider>
      );
      act(() => {jest.runAllTimers();});
      return tree;
    };

    let renderMany = () => render(
      <TableView aria-label="Table">
        <TableHeader columns={columns}>
          {column =>
            <Column>{column.name}</Column>
          }
        </TableHeader>
        <TableBody items={manyItems}>
          {item =>
            (<Row key={item.foo}>
              {key => <Cell>{item[key]}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
    );

    let renderManyColumns = () => render(
      <TableView aria-label="Table" selectionMode="multiple">
        <TableHeader columns={manyColumns}>
          {column =>
            <Column>{column.name}</Column>
          }
        </TableHeader>
        <TableBody items={manyItems}>
          {item =>
            (<Row key={item.foo}>
              {key => <Cell>{item.foo + ' ' + key}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
    );

    describe('ArrowRight', function () {
      it('should move focus to the next cell in a row with ArrowRight', async function () {
        let tree = renderTable();
        focusCell(tree, 'Bar 1');
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(getCell(tree, 'Baz 1'));
      });

      it('should move focus to the previous cell in a row with ArrowRight in RTL', function () {
        let tree = renderTable('ar-AE');
        focusCell(tree, 'Bar 1');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 1'));
      });

      it('should move focus to the row when on the last cell with ArrowRight', function () {
        let tree = renderTable();
        focusCell(tree, 'Baz 1');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[1]);
      });

      it('should move focus to the row when on the first cell with ArrowRight in RTL', function () {
        let tree = renderTable('ar-AE');
        focusCell(tree, 'Foo 1');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[1]);
      });

      it('should move focus from the row to the first cell with ArrowRight', function () {
        let tree = renderTable();
        act(() => {tree.getAllByRole('row')[1].focus();});
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 1'));
      });

      it('should move focus from the row to the last cell with ArrowRight in RTL', function () {
        let tree = renderTable('ar-AE');
        act(() => {tree.getAllByRole('row')[1].focus();});
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(tree, 'Baz 1'));
      });

      it('should move to the next column header in a row with ArrowRight', function () {
        let tree = renderTable();
        focusCell(tree, 'Bar');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(tree, 'Baz'));
      });

      it('should move to the previous column header in a row with ArrowRight in RTL', function () {
        let tree = renderTable('ar-AE');
        focusCell(tree, 'Bar');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(tree, 'Foo'));
      });

      it('should move to the next nested column header in a row with ArrowRight', function () {
        let tree = renderNested();
        focusCell(tree, 'Tier Two Header A');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(tree, 'Tier Two Header B'));
      });

      it('should move to the previous nested column header in a row with ArrowRight in RTL', function () {
        let tree = renderNested('ar-AE');
        focusCell(tree, 'Tier Two Header B');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(tree, 'Tier Two Header A'));
      });

      it('should move to the first column header when focus is on the last column with ArrowRight', function () {
        let tree = renderTable();
        focusCell(tree, 'Baz');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(tree, 'Foo'));
      });

      it('should move to the last column header when focus is on the first column with ArrowRight in RTL', function () {
        let tree = renderTable('ar-AE');
        focusCell(tree, 'Foo');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(tree, 'Baz'));
      });

      it('should allow the user to focus disabled cells', function () {
        let tree = renderTable('en-US', {disabledKeys: ['Foo 1']});
        focusCell(tree, 'Bar 1');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(tree, 'Baz 1'));
      });
    });

    describe('ArrowLeft', function () {
      it('should move focus to the previous cell in a row with ArrowLeft', function () {
        let tree = renderTable();
        focusCell(tree, 'Bar 1');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 1'));
      });

      it('should move focus to the next cell in a row with ArrowRight in RTL', function () {
        let tree = renderTable('ar-AE');
        focusCell(tree, 'Bar 1');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Baz 1'));
      });

      it('should move focus to the row when on the first cell with ArrowLeft', function () {
        let tree = renderTable();
        focusCell(tree, 'Foo 1');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[1]);
      });

      it('should move focus to the row when on the last cell with ArrowLeft in RTL', function () {
        let tree = renderTable('ar-AE');
        focusCell(tree, 'Baz 1');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[1]);
      });

      it('should move focus from the row to the last cell with ArrowLeft', function () {
        let tree = renderTable();
        act(() => {tree.getAllByRole('row')[1].focus();});
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Baz 1'));
      });

      it('should move focus from the row to the first cell with ArrowLeft in RTL', function () {
        let tree = renderTable('ar-AE');
        act(() => {tree.getAllByRole('row')[1].focus();});
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 1'));
      });

      it('should move to the previous column header in a row with ArrowLeft', function () {
        let tree = renderTable();
        focusCell(tree, 'Bar');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Foo'));
      });

      it('should move to the next column header in a row with ArrowLeft in RTL', function () {
        let tree = renderTable('ar-AE');
        focusCell(tree, 'Bar');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Baz'));
      });

      it('should move to the previous nested column header in a row with ArrowLeft', function () {
        let tree = renderNested();
        focusCell(tree, 'Tier Two Header B');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Tier Two Header A'));
      });

      it('should move to the next nested column header in a row with ArrowLeft in RTL', function () {
        let tree = renderNested('ar-AE');
        focusCell(tree, 'Tier Two Header A');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Tier Two Header B'));
      });

      it('should move to the last column header when focus is on the first column with ArrowLeft', function () {
        let tree = renderTable();
        focusCell(tree, 'Foo');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Baz'));
      });

      it('should move to the first column header when focus is on the last column with ArrowLeft in RTL', function () {
        let tree = renderTable('ar-AE');
        focusCell(tree, 'Baz');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Foo'));
      });

      it('should allow the user to focus disabled cells', function () {
        let tree = renderTable('en-US', {disabledKeys: ['Foo 1']});
        focusCell(tree, 'Bar 1');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 1'));
      });
    });

    describe('ArrowUp', function () {
      it('should move focus to the cell above with ArrowUp', function () {
        let tree = renderTable();
        focusCell(tree, 'Bar 2');
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(tree, 'Bar 1'));
      });

      it('should move focus to the row above with ArrowUp', function () {
        let tree = renderTable();
        act(() => {tree.getAllByRole('row')[2].focus();});
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[1]);
      });

      it('should move focus to the column header above a cell in the first row with ArrowUp', function () {
        let tree = renderTable();
        focusCell(tree, 'Bar 1');
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(tree, 'Bar'));
      });

      it('should move focus to the column header above the first row with ArrowUp', function () {
        let tree = renderTable();
        act(() => {tree.getAllByRole('row')[1].focus();});
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(tree, 'Foo'));
      });

      it('should move focus to the parent column header with ArrowUp', function () {
        let tree = renderNested();
        focusCell(tree, 'Bar');
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(tree, 'Tier Two Header A'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(tree, 'Tiered One Header'));
        // do nothing when at the top
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(tree, 'Tiered One Header'));
      });

      it('should allow the user to focus disabled rows', function () {
        let tree = renderTable('en-US', {disabledKeys: ['Foo 1']});
        focusCell(tree, 'Bar 2');
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(tree, 'Bar 1'));
      });
    });

    describe('ArrowDown', function () {
      it('should move focus to the cell below with ArrowDown', function () {
        let tree = renderTable();
        focusCell(tree, 'Bar 1');
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(tree, 'Bar 2'));
      });

      it('should move focus to the row below with ArrowDown', function () {
        let tree = renderTable();
        act(() => {tree.getAllByRole('row')[1].focus();});
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[2]);
      });

      it('should move focus to the child column header with ArrowDown', function () {
        let tree = renderNested();
        focusCell(tree, 'Tiered One Header');
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(tree, 'Tier Two Header A'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(tree, 'Foo'));
      });

      it('should move focus to the cell below a column header with ArrowDown', function () {
        let tree = renderTable();
        focusCell(tree, 'Bar');
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(tree, 'Bar 1'));
      });

      it('should allow the user to focus disabled cells', function () {
        let tree = renderTable('en-US', {disabledKeys: ['Foo 2']});
        focusCell(tree, 'Bar 1');
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(tree, 'Bar 2'));
      });
    });

    describe('Home', function () {
      it('should focus the first cell in a row with Home', function () {
        let tree = renderTable();
        focusCell(tree, 'Bar 1');
        moveFocus('Home');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 1'));
      });

      it('should focus the first cell in the first row with ctrl + Home', function () {
        let tree = renderTable();
        focusCell(tree, 'Bar 2');
        moveFocus('Home', {ctrlKey: true});
        expect(document.activeElement).toBe(getCell(tree, 'Foo 1'));
      });

      it('should focus the first row with Home', function () {
        let tree = renderTable();
        act(() => {tree.getAllByRole('row')[2].focus();});
        moveFocus('Home');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[1]);
      });
    });

    describe('End', function () {
      it('should focus the last cell in a row with End', function () {
        let tree = renderTable();
        focusCell(tree, 'Foo 1');
        moveFocus('End');
        expect(document.activeElement).toBe(getCell(tree, 'Baz 1'));
      });

      it('should focus the last cell in the last row with ctrl + End', function () {
        let tree = renderTable();
        focusCell(tree, 'Bar 1');
        moveFocus('End', {ctrlKey: true});
        expect(document.activeElement).toBe(getCell(tree, 'Baz 2'));
      });

      it('should focus the last row with End', function () {
        let tree = renderTable();
        act(() => {tree.getAllByRole('row')[1].focus();});
        moveFocus('End');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[2]);
      });
    });

    describe('PageDown', function () {
      it('should focus the cell a page below', function () {
        let tree = renderMany();
        focusCell(tree, 'Foo 1');
        moveFocus('PageDown');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 25'));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 49'));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 73'));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 97'));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 100'));
      });

      it('should focus the row a page below', function () {
        let tree = renderMany();
        act(() => {tree.getAllByRole('row')[1].focus();});
        moveFocus('PageDown');
        expect(document.activeElement).toBe(tree.getByRole('row', {name: 'Foo 25'}));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(tree.getByRole('row', {name: 'Foo 49'}));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(tree.getByRole('row', {name: 'Foo 73'}));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(tree.getByRole('row', {name: 'Foo 97'}));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(tree.getByRole('row', {name: 'Foo 100'}));
      });
    });

    describe('PageUp', function () {
      it('should focus the cell a page above', function () {
        let tree = renderMany();
        focusCell(tree, 'Foo 25');
        moveFocus('PageUp');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 1'));
        focusCell(tree, 'Foo 12');
        moveFocus('PageUp');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 1'));
      });

      it('should focus the row a page above', function () {
        let tree = renderMany();
        act(() => {tree.getAllByRole('row')[25].focus();});
        moveFocus('PageUp');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[1]);
        act(() => {tree.getAllByRole('row')[12].focus();});
        moveFocus('PageUp');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[1]);
      });
    });

    describe('type to select', function () {
      let renderTypeSelect = () => render(
        <TableView aria-label="Table" selectionMode="none">
          <TableHeader>
            <Column isRowHeader>First Name</Column>
            <Column isRowHeader>Last Name</Column>
            <Column>Birthday</Column>
          </TableHeader>
          <TableBody>
            <Row>
              <Cell>Sam</Cell>
              <Cell>Smith</Cell>
              <Cell>May 3</Cell>
            </Row>
            <Row>
              <Cell>Julia</Cell>
              <Cell>Jones</Cell>
              <Cell>February 10</Cell>
            </Row>
            <Row>
              <Cell>John</Cell>
              <Cell>Doe</Cell>
              <Cell>December 12</Cell>
            </Row>
          </TableBody>
        </TableView>
      );

      it('focuses cell by typing letters in rapid succession', function () {
        let tree = renderTypeSelect();
        focusCell(tree, 'Sam');

        moveFocus('J');
        expect(document.activeElement).toBe(getCell(tree, 'Julia'));

        moveFocus('o');
        expect(document.activeElement).toBe(getCell(tree, 'Jones'));

        moveFocus('h');
        expect(document.activeElement).toBe(getCell(tree, 'John'));
      });

      it('matches against all row header cells', function () {
        let tree = renderTypeSelect();
        focusCell(tree, 'Sam');

        moveFocus('D');
        expect(document.activeElement).toBe(getCell(tree, 'Doe'));
      });

      it('non row header columns don\'t match', function () {
        let tree = renderTypeSelect();
        focusCell(tree, 'Sam');

        moveFocus('F');
        expect(document.activeElement).toBe(getCell(tree, 'Sam'));
      });

      it('focuses row by typing letters in rapid succession', function () {
        let tree = renderTypeSelect();
        act(() => {tree.getAllByRole('row')[1].focus();});

        moveFocus('J');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[2]);

        moveFocus('o');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[2]);

        moveFocus('h');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[3]);
      });

      it('matches row against all row header cells', function () {
        let tree = renderTypeSelect();
        act(() => {tree.getAllByRole('row')[1].focus();});

        moveFocus('D');
        expect(document.activeElement).toBe(tree.getAllByRole('row')[3]);
      });

      it('resets the search text after a timeout', function () {
        let tree = renderTypeSelect();
        focusCell(tree, 'Sam');

        moveFocus('J');
        expect(document.activeElement).toBe(getCell(tree, 'Julia'));

        act(() => {jest.runAllTimers();});

        moveFocus('J');
        expect(document.activeElement).toBe(getCell(tree, 'Julia'));
      });

      it('wraps around when reaching the end of the collection', function () {
        let tree = renderTypeSelect();
        focusCell(tree, 'Sam');

        moveFocus('J');
        expect(document.activeElement).toBe(getCell(tree, 'Julia'));

        moveFocus('o');
        expect(document.activeElement).toBe(getCell(tree, 'Jones'));

        moveFocus('h');
        expect(document.activeElement).toBe(getCell(tree, 'John'));

        act(() => {jest.runAllTimers();});

        moveFocus('J');
        expect(document.activeElement).toBe(getCell(tree, 'John'));

        moveFocus('u');
        expect(document.activeElement).toBe(getCell(tree, 'Julia'));
      });

      it('wraps around when no items past the current one match', function () {
        let tree = renderTypeSelect();
        focusCell(tree, 'Sam');

        moveFocus('J');
        expect(document.activeElement).toBe(getCell(tree, 'Julia'));

        act(() => {jest.runAllTimers();});

        moveFocus('S');
        expect(document.activeElement).toBe(getCell(tree, 'Sam'));
      });

      describe('type ahead with dialog triggers', function () {
        beforeEach(function () {
          offsetHeight.mockRestore();
          offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get')
            .mockImplementationOnce(() => 20)
            .mockImplementation(() => 100);
        });
        afterEach(function () {
          offsetHeight.mockRestore();
          offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
        });
        it('does not pick up typeahead from a dialog', async function () {
          offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get')
            .mockImplementationOnce(() => 20)
            .mockImplementation(() => 100);
          let tree = render(<TypeaheadWithDialog />);
          let trigger = tree.getAllByRole('button')[0];
          await user.click(trigger);
          act(() => {
            jest.runAllTimers();
          });
          let textfield = tree.getByLabelText('Enter a J');
          act(() => {textfield.focus();});
          fireEvent.keyDown(textfield, {key: 'J'});
          fireEvent.keyUp(textfield, {key: 'J'});
          act(() => {
            jest.runAllTimers();
          });
          expect(document.activeElement).toBe(textfield);
          fireEvent.keyDown(document.activeElement, {key: 'Escape'});
          fireEvent.keyUp(document.activeElement, {key: 'Escape'});
          act(() => {
            jest.runAllTimers();
          });
        });
      });
    });

    describe('focus marshalling', function () {
      let renderFocusable = () => render(
        <>
          <input data-testid="before" />
          <TableView aria-label="Table" selectionMode="multiple">
            <TableHeader>
              <Column>Foo</Column>
              <Column>Bar</Column>
              <Column>baz</Column>
            </TableHeader>
            <TableBody>
              <Row>
                <Cell textValue="Foo 1"><Switch aria-label="Foo 1" /></Cell>
                <Cell textValue="Google"><Link><a href="https://google.com" target="_blank">Google</a></Link></Cell>
                <Cell>Baz 1</Cell>
              </Row>
              <Row>
                <Cell textValue="Foo 2"><Switch aria-label="Foo 2" /><Switch aria-label="Foo 3" /></Cell>
                <Cell textValue="Yahoo"><Link><a href="https://yahoo.com" target="_blank">Yahoo</a></Link></Cell>
                <Cell>Baz 2</Cell>
              </Row>
            </TableBody>
          </TableView>
          <input data-testid="after" />
        </>
      );

      let renderWithPicker = () => render(
        <>
          <TableView aria-label="Table">
            <TableHeader>
              <Column>Foo</Column>
              <Column>Bar</Column>
              <Column>baz</Column>
            </TableHeader>
            <TableBody>
              <Row>
                <Cell textValue="Foo 1"><Switch aria-label="Foo 1" /></Cell>
                <Cell textValue="Search engine">
                  <Picker aria-label="Search engine" placeholder="Search with:" width={'100%'} isQuiet>
                    <Item key="Yahoo">Yahoo</Item>
                    <Item key="Google">Google</Item>
                    <Item key="DuckDuckGo">DuckDuckGo</Item>
                  </Picker>
                </Cell>
                <Cell>Baz 1</Cell>
              </Row>
            </TableBody>
          </TableView>
        </>
      );

      it('should retain focus on the pressed child', async function () {
        let tree = renderFocusable();
        let switchToPress = tree.getAllByRole('switch')[2];
        await user.click(switchToPress);
        expect(document.activeElement).toBe(switchToPress);
      });

      it('should marshall focus to the focusable element inside a cell', function () {
        let tree = renderFocusable();
        focusCell(tree, 'Baz 1');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(tree.getAllByRole('link')[0]);

        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(tree.getAllByRole('switch')[0]);

        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(tree.getAllByRole('switch')[1]);

        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(tree.getAllByRole('switch')[2]);

        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(tree.getAllByRole('link')[1]);

        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(tree.getAllByRole('switch')[2]);

        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(tree.getAllByRole('switch')[1]);

        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(tree.getAllByRole('checkbox')[2]);

        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(tree.getAllByRole('checkbox')[1]);

        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(tree.getAllByRole('checkbox')[0]);
      });

      it('should support keyboard navigation after pressing focusable element inside a cell', async function () {
        let tree = renderFocusable();
        await user.click(tree.getAllByRole('switch')[0]);
        expect(document.activeElement).toBe(tree.getAllByRole('switch')[0]);

        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(tree.getAllByRole('switch')[1]);
      });

      it('should move focus to the first row when tabbing into the table from the start', function () {
        let tree = renderFocusable();

        let table = tree.getByRole('grid');
        expect(table).toHaveAttribute('tabIndex', '0');

        let before = tree.getByTestId('before');
        act(() => before.focus());

        // Simulate tabbing to the first "tabbable" item inside the table
        fireEvent.keyDown(before, {key: 'Tab'});
        act(() => {within(table).getAllByRole('switch')[0].focus();});
        fireEvent.keyUp(before, {key: 'Tab'});

        expect(document.activeElement).toBe(within(table).getAllByRole('row')[1]);
      });

      it('should move focus to the last row when tabbing into the table from the end', function () {
        let tree = renderFocusable();

        let table = tree.getByRole('grid');
        expect(table).toHaveAttribute('tabIndex', '0');

        let after = tree.getByTestId('after');
        act(() => after.focus());

        // Simulate tabbing to the last "tabbable" item inside the table
        act(() => {
          fireEvent.keyDown(after, {key: 'Tab', shiftKey: true});
          within(table).getAllByRole('link')[1].focus();
          fireEvent.keyUp(after, {key: 'Tab', shiftKey: true});
        });

        expect(document.activeElement).toBe(within(table).getAllByRole('row')[2]);
      });

      it('should move focus to the last focused cell when tabbing into the table from the start', function () {
        let tree = renderFocusable();

        let table = tree.getByRole('grid');
        expect(table).toHaveAttribute('tabIndex', '0');

        let baz1 = getCell(tree, 'Baz 1');
        act(() => baz1.focus());

        expect(table).toHaveAttribute('tabIndex', '-1');

        let before = tree.getByTestId('before');
        act(() => before.focus());

        // Simulate tabbing to the first "tabbable" item inside the table
        fireEvent.keyDown(before, {key: 'Tab'});
        act(() => {within(table).getAllByRole('switch')[0].focus();});
        fireEvent.keyUp(before, {key: 'Tab'});

        expect(document.activeElement).toBe(baz1);
      });

      it('should move focus to the last focused cell when tabbing into the table from the end', function () {
        let tree = renderFocusable();

        let table = tree.getByRole('grid');
        expect(table).toHaveAttribute('tabIndex', '0');

        let baz1 = getCell(tree, 'Baz 1');
        act(() => baz1.focus());

        expect(table).toHaveAttribute('tabIndex', '-1');

        let after = tree.getByTestId('after');
        act(() => after.focus());

        // Simulate tabbing to the last "tabbable" item inside the table
        fireEvent.keyDown(after, {key: 'Tab'});
        act(() => {within(table).getAllByRole('link')[1].focus();});
        fireEvent.keyUp(after, {key: 'Tab'});

        expect(document.activeElement).toBe(baz1);
      });

      it('should not trap focus when navigating through a cell with a picker using the arrow keys', function () {
        let tree = renderWithPicker();
        focusCell(tree, 'Baz 1');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(tree.getByRole('button'));
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(tree.getByRole('switch'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(tree.getByRole('button'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(tree.getAllByRole('gridcell')[1]);
      });

      it('should move focus after the table when tabbing', async function () {
        let tree = renderFocusable();

        await user.click(tree.getAllByRole('switch')[1]);
        expect(document.activeElement).toBe(tree.getAllByRole('switch')[1]);

        // Simulate tabbing within the table
        fireEvent.keyDown(document.activeElement, {key: 'Tab'});
        let walker = getFocusableTreeWalker(document.body, {tabbable: true});
        walker.currentNode = document.activeElement;
        act(() => {walker.nextNode().focus();});
        fireEvent.keyUp(document.activeElement, {key: 'Tab'});

        let after = tree.getByTestId('after');
        expect(document.activeElement).toBe(after);
      });

      it('should move focus after the table when tabbing from the last row', function () {
        let tree = renderFocusable();

        act(() => tree.getAllByRole('row')[2].focus());
        expect(document.activeElement).toBe(tree.getAllByRole('row')[2]);

        // Simulate tabbing within the table
        act(() => {
          fireEvent.keyDown(document.activeElement, {key: 'Tab'});
          let walker = getFocusableTreeWalker(document.body, {tabbable: true});
          walker.currentNode = document.activeElement;
          walker.nextNode().focus();
          fireEvent.keyUp(document.activeElement, {key: 'Tab'});
        });

        let after = tree.getByTestId('after');
        expect(document.activeElement).toBe(after);
      });

      it('should move focus before the table when shift tabbing', async function () {
        let tree = renderFocusable();

        await user.click(tree.getAllByRole('switch')[1]);
        expect(document.activeElement).toBe(tree.getAllByRole('switch')[1]);

        // Simulate shift tabbing within the table
        fireEvent.keyDown(document.activeElement, {key: 'Tab', shiftKey: true});
        let walker = getFocusableTreeWalker(document.body, {tabbable: true});
        walker.currentNode = document.activeElement;
        act(() => {walker.previousNode().focus();});
        fireEvent.keyUp(document.activeElement, {key: 'Tab', shiftKey: true});

        let before = tree.getByTestId('before');
        expect(document.activeElement).toBe(before);
      });

      it('should send focus to the appropriate key below if the focused row is removed', async function () {
        let tree = render(<DeletableRowsTable selectionMode="multiple" />);

        let rows = tree.getAllByRole('row');
        await user.tab();
        expect(document.activeElement).toBe(rows[1]);

        fireEvent.keyDown(document.activeElement, {key: 'ArrowLeft'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowLeft'});
        expect(document.activeElement).toBe(within(rows[1]).getByRole('button'));

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});
        act(() => {jest.runAllTimers();});

        rows = tree.getAllByRole('row');
        expect(document.activeElement).toBe(within(rows[1]).getByRole('button'));

        fireEvent.keyDown(document.activeElement, {key: 'ArrowUp'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowUp'});

        rows = tree.getAllByRole('row');
        expect(document.activeElement).toBe(within(rows[0]).getAllByRole('columnheader')[4]);
      });

      it('should send focus to the appropriate key above if the focused last row is removed', async function () {
        let tree = render(<DeletableRowsTable selectionMode="multiple" />);

        let rows = tree.getAllByRole('row');
        await user.tab();
        expect(document.activeElement).toBe(rows[1]);

        fireEvent.keyDown(document.activeElement, {key: 'ArrowLeft'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowLeft'});
        expect(document.activeElement).toBe(within(rows[1]).getByRole('button'));

        fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
        expect(document.activeElement).toBe(within(rows[2]).getByRole('button'));

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});
        act(() => {jest.runAllTimers();});

        rows = tree.getAllByRole('row');
        expect(document.activeElement).toBe(within(rows[1]).getByRole('button'));

        fireEvent.keyDown(document.activeElement, {key: 'ArrowUp'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowUp'});

        rows = tree.getAllByRole('row');
        expect(document.activeElement).toBe(within(rows[0]).getAllByRole('columnheader')[4]);
      });

      it('should send focus to the appropriate column and row if both the current row and column are removed', function () {
        let itemsLocal = items;
        let columnsLocal = columns;
        let renderJSX = (props, items = itemsLocal, columns = columnsLocal) => (
          <TableView aria-label="Table" {...props}>
            <TableHeader columns={columns}>
              {column => <Column>{column.name}</Column>}
            </TableHeader>
            <TableBody items={items}>
              {item =>
                (<Row key={item.foo}>
                  {key => <Cell>{item[key]}</Cell>}
                </Row>)
              }
            </TableBody>
          </TableView>
        );

        let renderTable = (props, items = itemsLocal, columns = columnsLocal) => render(renderJSX(props, items, columns));

        let tree = renderTable();
        focusCell(tree, 'Baz 1');

        rerender(tree, renderJSX({}, [itemsLocal[1], itemsLocal[0]], columnsLocal.slice(0, 2)));

        expect(document.activeElement).toBe(tree.getAllByRole('row')[1], 'If column index with last focus is greater than the new number of columns, focus the row');

        focusCell(tree, 'Bar 1');

        rerender(tree, renderJSX({}, [itemsLocal[1]], columnsLocal.slice(0, 1)));

        expect(document.activeElement).toBe(tree.getAllByRole('row')[1], 'If column index with last focus is greater than the new number of columns, focus the row');

        focusCell(tree, 'Foo 2');

        rerender(tree, renderJSX({}, [itemsLocal[0], itemsLocal[0]], columnsLocal));

        expect(document.activeElement).toBe(getCell(tree, 'Foo 1'));
      });
    });

    describe('scrolling', function () {
      it('should scroll to a cell when it is focused', function () {
        let tree = renderMany();
        let body = tree.getByRole('grid').childNodes[1];

        focusCell(tree, 'Baz 25');
        expect(scrollIntoView).toHaveBeenLastCalledWith(body, document.activeElement);
      });

      it('should scroll to a cell when it is focused off screen', function () {
        let tree = renderManyColumns();
        let body = tree.getByRole('grid').childNodes[1];

        let cell = getCell(tree, 'Foo 5 5');
        act(() => cell.focus());
        expect(document.activeElement).toBe(cell);
        expect(body.scrollTop).toBe(0);

        // When scrolling the focused item out of view, focus should remain on the item,
        // virtualizer keeps focused items from being reused
        body.scrollTop = 1000;
        body.scrollLeft = 1000;
        fireEvent.scroll(body);
        act(() => jest.runAllTimers());

        expect(body.scrollTop).toBe(1000);
        expect(document.activeElement).toBe(cell);
        expect(tree.queryByText('Foo 5 5')).toBe(cell.firstElementChild);

        // Ensure we have the correct sticky cells in the right order.
        let row = cell.closest('[role=row]');
        let cells = within(row).getAllByRole('gridcell');
        let rowHeaders = within(row).getAllByRole('rowheader');
        expect(cells).toHaveLength(17);
        expect(rowHeaders).toHaveLength(1);
        expect(cells[0]).toHaveAttribute('aria-colindex', '1'); // checkbox
        expect(rowHeaders[0]).toHaveAttribute('aria-colindex', '2'); // rowheader
        expect(cells[1]).toHaveAttribute('aria-colindex', '6'); // persisted
        expect(cells[1]).toBe(cell);
        expect(cells[2]).toHaveAttribute('aria-colindex', '14'); // first visible

        // Moving focus should scroll the new focused item into view
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(tree, 'Foo 5 4'));
        expect(scrollIntoView).toHaveBeenLastCalledWith(body, document.activeElement);
      });

      it('should not scroll when a column header receives focus', function () {
        let tree = renderMany();
        let body = tree.getByRole('grid').childNodes[1];
        let cell = getCell(tree, 'Baz 5');

        focusCell(tree, 'Baz 5');

        body.scrollTop = 1000;
        fireEvent.scroll(body);

        expect(body.scrollTop).toBe(1000);
        expect(document.activeElement).toBe(cell);

        focusCell(tree, 'Bar');
        expect(document.activeElement).toHaveAttribute('role', 'columnheader');
        expect(document.activeElement).toHaveTextContent('Bar');
        expect(scrollIntoView).toHaveBeenLastCalledWith(body, document.activeElement);
      });
    });
  });

  describe('selection', function () {
    afterEach(() => {
      act(() => jest.runAllTimers());
    });

    let renderJSX = (props, items = manyItems) => (
      <TableView aria-label="Table" selectionMode="multiple" {...props}>
        <TableHeader columns={columns}>
          {column => <Column>{column.name}</Column>}
        </TableHeader>
        <TableBody items={items}>
          {item =>
            (<Row key={item.foo}>
              {key => <Cell>{item[key]}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
    );

    let renderTable = (props, items = manyItems) => render(renderJSX(props, items));

    let checkSelection = (onSelectionChange, selectedKeys) => {
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(selectedKeys));
    };

    let checkSelectAll = (tree, state = 'indeterminate') => {
      let checkbox = tree.getByLabelText('Select All');
      if (state === 'indeterminate') {
        expect(checkbox.indeterminate).toBe(true);
      } else {
        expect(checkbox.checked).toBe(state === 'checked');
      }
    };

    let checkRowSelection = (rows, selected) => {
      for (let row of rows) {
        expect(row).toHaveAttribute('aria-selected', '' + selected);
      }
    };

    describe('row selection', function () {
      it('should select a row from checkbox', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.click(within(row).getByRole('checkbox'));

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
        checkSelectAll(tree);
      });

      it('should select a row by pressing on a cell', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.click(getCell(tree, 'Baz 1'));

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
        checkSelectAll(tree);
      });

      it('should select a row by pressing the Space key on a row', function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        fireEvent.keyDown(row, {key: ' '});

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
        checkSelectAll(tree);
      });

      it('should select a row by pressing the Enter key on a row', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        await user.tab();
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Enter}');

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
        checkSelectAll(tree);
      });

      it('should select a row by pressing the Space key on a cell', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.tab();
        await user.keyboard('{ArrowRight}{ArrowRight}');
        await user.keyboard(' ');

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
        checkSelectAll(tree);
      });

      it('should select a row by pressing the Enter key on a cell', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.tab();
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Enter}');

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
        checkSelectAll(tree);
      });

      it('should support selecting multiple with a pointer', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.click(getCell(tree, 'Baz 1'));

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        checkRowSelection(rows.slice(2), false);
        checkSelectAll(tree, 'indeterminate');

        onSelectionChange.mockReset();
        await user.click(getCell(tree, 'Baz 2'));

        checkSelection(onSelectionChange, ['Foo 1', 'Foo 2']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(rows[2]).toHaveAttribute('aria-selected', 'true');
        checkRowSelection(rows.slice(3), false);
        checkSelectAll(tree, 'indeterminate');

        // Deselect
        onSelectionChange.mockReset();
        await user.click(getCell(tree, 'Baz 2'));

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        checkRowSelection(rows.slice(2), false);
        checkSelectAll(tree, 'indeterminate');
      });

      it('should support selecting multiple with the Space key', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.tab();
        await user.keyboard('{ArrowRight}{ArrowRight}');
        await user.keyboard(' ');

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        checkRowSelection(rows.slice(2), false);
        checkSelectAll(tree, 'indeterminate');

        onSelectionChange.mockReset();
        await user.keyboard('{ArrowDown}');
        await user.keyboard(' ');

        checkSelection(onSelectionChange, ['Foo 1', 'Foo 2']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(rows[2]).toHaveAttribute('aria-selected', 'true');
        checkRowSelection(rows.slice(3), false);
        checkSelectAll(tree, 'indeterminate');

        // Deselect
        onSelectionChange.mockReset();
        await user.keyboard(' ');

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        checkRowSelection(rows.slice(2), false);
        checkSelectAll(tree, 'indeterminate');
      });

      it('should not allow selection of a disabled row via checkbox click', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange, disabledKeys: ['Foo 1']});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.click(within(row).getByRole('checkbox'));

        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(row).toHaveAttribute('aria-selected', 'false');

        let checkbox = tree.getByLabelText('Select All');
        expect(checkbox.checked).toBeFalsy();
      });

      it('should not allow selection of a disabled row by pressing on a cell', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange, disabledKeys: ['Foo 1']});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.click(getCell(tree, 'Baz 1'));

        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(row).toHaveAttribute('aria-selected', 'false');

        let checkbox = tree.getByLabelText('Select All');
        expect(checkbox.checked).toBeFalsy();
      });

      it('should not allow the user to select a disabled row via keyboard', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange, disabledKeys: ['Foo 1']});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');

        await user.tab();
        await user.keyboard(' ');
        await user.keyboard('{Enter}');

        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(row).toHaveAttribute('aria-selected', 'false');

        let checkbox = tree.getByLabelText('Select All');
        expect(checkbox.checked).toBeFalsy();
      });

      describe('Space key with focus on a link within a cell', () => {
        it('should toggle selection and prevent scrolling of the table', async () => {
          let tree = render(
            <TableView aria-label="Table" selectionMode="multiple">
              <TableHeader columns={columns}>
                {column => <Column>{column.name}</Column>}
              </TableHeader>
              <TableBody items={items}>
                {item =>
                  (<Row key={item.foo}>
                    {key => <Cell><Link><a href={`https://example.com/?id=${item.id}`} target="_blank">{item[key]}</a></Link></Cell>}
                  </Row>)
                }
              </TableBody>
            </TableView>
          );

          let row = tree.getAllByRole('row')[1];
          expect(row).toHaveAttribute('aria-selected', 'false');

          let link = within(row).getAllByRole('link')[0];
          expect(link.textContent).toBe('Foo 1');

          await user.tab();
          await user.keyboard('{ArrowRight}');
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(link);
          await user.keyboard(' ');
          act(() => {jest.runAllTimers();});

          row = tree.getAllByRole('row')[1];
          expect(row).toHaveAttribute('aria-selected', 'true');

          await user.keyboard(' ');
          act(() => {jest.runAllTimers();});

          row = tree.getAllByRole('row')[1];
          link = within(row).getAllByRole('link')[0];

          expect(row).toHaveAttribute('aria-selected', 'false');
          expect(link.textContent).toBe('Foo 1');
        });
      });
    });

    describe('range selection', function () {
      it('should support selecting a range with a pointer', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.click(getCell(tree, 'Baz 1'));

        onSelectionChange.mockReset();
        await user.keyboard('[ShiftLeft>]');
        await user.click(getCell(tree, 'Baz 20'));
        await user.keyboard('[/ShiftLeft]');

        checkSelection(onSelectionChange, [
          'Foo 1', 'Foo 2', 'Foo 3', 'Foo 4', 'Foo 5', 'Foo 6', 'Foo 7', 'Foo 8', 'Foo 9', 'Foo 10',
          'Foo 11', 'Foo 12', 'Foo 13', 'Foo 14', 'Foo 15', 'Foo 16', 'Foo 17', 'Foo 18', 'Foo 19', 'Foo 20'
        ]);

        checkRowSelection(rows.slice(1, 21), true);
        checkRowSelection(rows.slice(21), false);
      });

      it('should anchor range selections with a pointer', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.click(getCell(tree, 'Baz 10'));

        onSelectionChange.mockReset();
        await user.keyboard('[ShiftLeft>]');
        await user.click(getCell(tree, 'Baz 20'));
        await user.keyboard('[/ShiftLeft]');

        checkSelection(onSelectionChange, [
          'Foo 10', 'Foo 11', 'Foo 12', 'Foo 13', 'Foo 14', 'Foo 15',
          'Foo 16', 'Foo 17', 'Foo 18', 'Foo 19', 'Foo 20'
        ]);

        checkRowSelection(rows.slice(11, 21), true);
        checkRowSelection(rows.slice(21), false);

        onSelectionChange.mockReset();
        await user.keyboard('[ShiftLeft>]');
        await user.click(getCell(tree, 'Baz 1'));
        await user.keyboard('[/ShiftLeft]');

        checkSelection(onSelectionChange, [
          'Foo 1', 'Foo 2', 'Foo 3', 'Foo 4', 'Foo 5',
          'Foo 6', 'Foo 7', 'Foo 8', 'Foo 9', 'Foo 10'
        ]);

        checkRowSelection(rows.slice(1, 11), true);
        checkRowSelection(rows.slice(11), false);
      });

      it('should extend a selection with Shift + ArrowDown', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.tab();
        await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
        await user.keyboard('{ArrowDown}'.repeat(9));
        await user.keyboard(' ');

        onSelectionChange.mockReset();
        await user.keyboard('{Shift>}{ArrowDown}{/Shift}');

        checkSelection(onSelectionChange, ['Foo 10', 'Foo 11']);
        checkRowSelection(rows.slice(1, 10), false);
        checkRowSelection(rows.slice(11, 12), true);
        checkRowSelection(rows.slice(12), false);
      });

      it('should extend a selection with Shift + ArrowUp', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.tab();
        await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
        await user.keyboard('{ArrowDown}'.repeat(9));
        await user.keyboard(' ');

        onSelectionChange.mockReset();
        await user.keyboard('{Shift>}{ArrowUp}{/Shift}');

        checkSelection(onSelectionChange, ['Foo 9', 'Foo 10']);
        checkRowSelection(rows.slice(1, 9), false);
        checkRowSelection(rows.slice(9, 10), true);
        checkRowSelection(rows.slice(11), false);
      });

      it('should extend a selection with Ctrl + Shift + Home', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.tab();
        await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
        await user.keyboard('{ArrowDown}'.repeat(9));
        await user.keyboard(' ');

        onSelectionChange.mockReset();
        await user.keyboard('{Shift>}{Control>}{Home}{/Control}{/Shift}');

        checkSelection(onSelectionChange, [
          'Foo 1', 'Foo 2', 'Foo 3', 'Foo 4', 'Foo 5',
          'Foo 6', 'Foo 7', 'Foo 8', 'Foo 9', 'Foo 10'
        ]);

        checkRowSelection(rows.slice(1, 11), true);
        checkRowSelection(rows.slice(11), false);
      });

      it('should extend a selection with Ctrl + Shift + End', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.tab();
        await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
        await user.keyboard('{ArrowDown}'.repeat(9));
        await user.keyboard(' ');

        onSelectionChange.mockReset();
        await user.keyboard('{Shift>}{Control>}{End}{/Control}{/Shift}');

        let expected = [];
        for (let i = 10; i <= 100; i++) {
          expected.push('Foo ' + i);
        }

        checkSelection(onSelectionChange, expected);
      });

      it('should extend a selection with Shift + PageDown', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.tab();
        await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
        await user.keyboard('{ArrowDown}'.repeat(9));
        await user.keyboard(' ');

        onSelectionChange.mockReset();
        await user.keyboard('{Shift>}{PageDown}{/Shift}');

        let expected = [];
        for (let i = 10; i <= 34; i++) {
          expected.push('Foo ' + i);
        }

        checkSelection(onSelectionChange, expected);
      });

      it('should extend a selection with Shift + PageUp', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.tab();
        await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
        await user.keyboard('{ArrowDown}'.repeat(9));
        await user.keyboard(' ');

        onSelectionChange.mockReset();
        await user.keyboard('{Shift>}{PageUp}{/Shift}');

        checkSelection(onSelectionChange, [
          'Foo 1', 'Foo 2', 'Foo 3', 'Foo 4', 'Foo 5',
          'Foo 6', 'Foo 7', 'Foo 8', 'Foo 9', 'Foo 10'
        ]);

        checkRowSelection(rows.slice(1, 11), true);
        checkRowSelection(rows.slice(11), false);
      });

      it('should not include disabled rows within a range selection', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange, disabledKeys: ['Foo 3', 'Foo 16']});
        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.click(getCell(tree, 'Baz 1'));

        onSelectionChange.mockReset();
        await user.keyboard('[ShiftLeft>]');
        await user.click(getCell(tree, 'Baz 20'));
        await user.keyboard('[/ShiftLeft]');

        checkSelection(onSelectionChange, [
          'Foo 1', 'Foo 2', 'Foo 4', 'Foo 5', 'Foo 6', 'Foo 7', 'Foo 8', 'Foo 9', 'Foo 10',
          'Foo 11', 'Foo 12', 'Foo 13', 'Foo 14', 'Foo 15', 'Foo 17', 'Foo 18', 'Foo 19', 'Foo 20'
        ]);

        checkRowSelection(rows.slice(1, 3), true);
        checkRowSelection(rows.slice(3, 4), false);
        checkRowSelection(rows.slice(4, 16), true);
        checkRowSelection(rows.slice(16, 17), false);
        checkRowSelection(rows.slice(17, 21), true);
      });
    });

    describe('select all', function () {
      it('should support selecting all via the checkbox', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});
        let tableTester = testUtilUser.createTester('Table', {root: tree.getByRole('grid')});
        tableTester.setInteractionType('keyboard');

        checkSelectAll(tree, 'unchecked');

        let rows = tableTester.rows;
        checkRowSelection(rows.slice(1), false);
        expect(tableTester.selectedRows).toHaveLength(0);

        await tableTester.toggleSelectAll();
        expect(tableTester.selectedRows).toHaveLength(tableTester.rows.length);
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onSelectionChange.mock.calls[0][0]).toEqual('all');
        checkRowSelection(rows.slice(1), true);
        checkSelectAll(tree, 'checked');
      });

      it('should support selecting all via ctrl + A', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);

        await user.tab();
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Control>}a{/Control}');

        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onSelectionChange.mock.calls[0][0]).toEqual('all');
        checkRowSelection(rows.slice(1), true);
        checkSelectAll(tree, 'checked');

        await user.keyboard('{Control>}a{/Control}');

        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onSelectionChange.mock.calls[0][0]).toEqual('all');
        checkRowSelection(rows.slice(1), true);
        checkSelectAll(tree, 'checked');
      });

      it('should deselect an item after selecting all', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);

        await user.click(tree.getByLabelText('Select All'));

        onSelectionChange.mockReset();
        await user.click(rows[4]);

        let expected = [];
        for (let i = 1; i <= 100; i++) {
          if (i !== 4) {
            expected.push('Foo ' + i);
          }
        }

        checkSelection(onSelectionChange, expected);
        expect(rows[4]).toHaveAttribute('aria-selected', 'false');
      });

      it('should shift click on an item after selecting all', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);

        await user.click(tree.getByLabelText('Select All'));

        onSelectionChange.mockReset();
        await user.keyboard('[ShiftLeft>]');
        await user.click(rows[4]);
        await user.keyboard('[/ShiftLeft]');

        checkSelection(onSelectionChange, ['Foo 4']);
        checkRowSelection(rows.slice(1, 4), false);
        expect(rows[4]).toHaveAttribute('aria-selected', 'true');
        checkRowSelection(rows.slice(5), false);
      });

      it('should support clearing selection via checkbox', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);

        await user.click(tree.getByLabelText('Select All'));
        checkSelectAll(tree, 'checked');

        onSelectionChange.mockReset();
        await user.click(tree.getByLabelText('Select All'));

        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set());
        checkRowSelection(rows.slice(1), false);
        checkSelectAll(tree, 'unchecked');
      });

      it('should support clearing selection via Escape', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.click(getCell(tree, 'Baz 1'));
        checkSelectAll(tree, 'indeterminate');

        onSelectionChange.mockReset();
        await user.keyboard('{ArrowLeft}');
        await user.keyboard('{Escape}');

        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set());
        checkRowSelection(rows.slice(1), false);
        checkSelectAll(tree, 'unchecked');
      });

      it('should only call onSelectionChange if there are selections to clear', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');
        await user.tab();
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Escape}');
        expect(onSelectionChange).not.toHaveBeenCalled();

        await user.click(tree.getByLabelText('Select All'));
        checkSelectAll(tree, 'checked');
        expect(onSelectionChange).toHaveBeenLastCalledWith('all');

        onSelectionChange.mockReset();
        await user.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
        await user.keyboard('{Escape}');
        expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set());
      });

      it('should automatically select new items when select all is active', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);

        await user.click(tree.getByLabelText('Select All'));
        checkSelectAll(tree, 'checked');
        checkRowSelection(rows.slice(1), true);

        rerender(tree, renderJSX({onSelectionChange}, [
          {foo: 'Foo 0', bar: 'Bar 0', baz: 'Baz 0'},
          ...manyItems
        ]));

        act(() => jest.runAllTimers());

        expect(getCell(tree, 'Foo 0')).toBeVisible();
        checkRowSelection(rows.slice(1), true);
      });

      it('manually selecting all should not auto select new items', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange}, items);

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);

        await user.click(rows[1]);
        checkSelectAll(tree, 'indeterminate');

        await user.click(rows[2]);
        checkSelectAll(tree, 'checked');

        rerender(tree, renderJSX({onSelectionChange}, [
          {foo: 'Foo 0', bar: 'Bar 0', baz: 'Baz 0'},
          ...items
        ]));

        act(() => jest.runAllTimers());

        rows = tree.getAllByRole('row');
        expect(getCell(tree, 'Foo 0')).toBeVisible();
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        checkRowSelection(rows.slice(2), true);
        checkSelectAll(tree, 'indeterminate');
      });

      it('should not included disabled rows when selecting all', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange, disabledKeys: ['Foo 3']});

        checkSelectAll(tree, 'unchecked');

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);

        await user.click(tree.getByLabelText('Select All'));

        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onSelectionChange.mock.calls[0][0]).toEqual('all');
        checkRowSelection(rows.slice(1, 3), true);
        checkRowSelection(rows.slice(3, 4), false);
        checkRowSelection(rows.slice(4, 20), true);
      });
    });

    describe('annoucements', function () {
      it('should announce the selected or deselected row', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        await user.click(row);
        expect(announce).toHaveBeenLastCalledWith('Foo 1 selected.');

        await user.click(row);
        expect(announce).toHaveBeenLastCalledWith('Foo 1 not selected.');
      });

      it('should announce the row and number of selected items when there are more than one', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let rows = tree.getAllByRole('row');
        await user.click(rows[1]);
        await user.click(rows[2]);

        expect(announce).toHaveBeenLastCalledWith('Foo 2 selected. 2 items selected.');

        await user.click(rows[2]);
        expect(announce).toHaveBeenLastCalledWith('Foo 2 not selected. 1 item selected.');
      });

      it('should announce only the number of selected items when multiple are selected at once', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let rows = tree.getAllByRole('row');
        await user.click(rows[1]);
        await user.keyboard('[ShiftLeft>]');
        await user.click(rows[3]);

        expect(announce).toHaveBeenLastCalledWith('3 items selected.');

        await user.click(rows[1]);
        await user.keyboard('[/ShiftLeft]');
        expect(announce).toHaveBeenLastCalledWith('1 item selected.');
      });

      it('should announce select all', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        await user.click(tree.getByLabelText('Select All'));
        expect(announce).toHaveBeenLastCalledWith('All items selected.');

        await user.click(tree.getByLabelText('Select All'));
        expect(announce).toHaveBeenLastCalledWith('No items selected.');
      });

      it('should announce all row header columns', async function () {
        let tree = render(
          <TableView aria-label="Table" selectionMode="multiple">
            <TableHeader>
              <Column isRowHeader>First Name</Column>
              <Column isRowHeader>Last Name</Column>
              <Column>Birthday</Column>
            </TableHeader>
            <TableBody>
              <Row>
                <Cell>Sam</Cell>
                <Cell>Smith</Cell>
                <Cell>May 3</Cell>
              </Row>
              <Row>
                <Cell>Julia</Cell>
                <Cell>Jones</Cell>
                <Cell>February 10</Cell>
              </Row>
            </TableBody>
          </TableView>
        );

        let row = tree.getAllByRole('row')[1];
        await user.click(row);
        expect(announce).toHaveBeenLastCalledWith('Sam Smith selected.');

        await user.click(row);
        expect(announce).toHaveBeenLastCalledWith('Sam Smith not selected.');
      });

      it('should announce changes in sort order', async function () {
        let tree = render(<ExampleSortTable />);
        let table = tree.getByRole('grid');
        let columnheaders = within(table).getAllByRole('columnheader');
        expect(columnheaders).toHaveLength(3);

        await user.click(columnheaders[1]);
        expect(announce).toHaveBeenLastCalledWith('sorted by column Bar in descending order', 'assertive', 500);
        await user.click(columnheaders[1]);
        expect(announce).toHaveBeenLastCalledWith('sorted by column Bar in ascending order', 'assertive', 500);
        await user.click(columnheaders[0]);
        expect(announce).toHaveBeenLastCalledWith('sorted by column Foo in ascending order', 'assertive', 500);
        await user.click(columnheaders[0]);
        expect(announce).toHaveBeenLastCalledWith('sorted by column Foo in descending order', 'assertive', 500);
      });
    });

    it('can announce deselect even when items are swapped out completely', async () => {
      let tree = render(<TableWithBreadcrumbs selectionMode="multiple" />);

      let row = tree.getAllByRole('row')[2];
      await user.click(row);
      expect(announce).toHaveBeenLastCalledWith('File B selected.');

      let link = tree.getAllByRole('link')[1];
      await user.click(link);

      expect(announce).toHaveBeenLastCalledWith('No items selected.');
      expect(announce).toHaveBeenCalledTimes(2);
    });

    it('will not announce deselect caused by breadcrumb navigation', async () => {
      let tree = render(<TableWithBreadcrumbs selectionMode="multiple" />);

      let link = tree.getAllByRole('link')[1];
      await user.click(link);

      // TableWithBreadcrumbs has a setTimeout to load the results of the link navigation on Folder A
      act(() => jest.runAllTimers());
      // Animation.
      act(() => jest.runAllTimers());
      let row = tree.getAllByRole('row')[1];
      await user.click(row);
      expect(announce).toHaveBeenLastCalledWith('File C selected.');
      expect(announce).toHaveBeenCalledTimes(2);

      // breadcrumb root
      link = tree.getAllByRole('link')[0];
      await user.click(link);

      // focus isn't on the table, so we don't announce that it has been deselected
      expect(announce).toHaveBeenCalledTimes(2);
    });

    it('updates even if not focused', async () => {
      let tree = render(<TableWithBreadcrumbs selectionMode="multiple" />);

      let link = tree.getAllByRole('link')[1];
      await user.click(link);

      // TableWithBreadcrumbs has a setTimeout to load the results of the link navigation on Folder A
      act(() => jest.runAllTimers());
      // Animation.
      act(() => jest.runAllTimers());
      let row = tree.getAllByRole('row')[1];
      await user.click(row);
      expect(announce).toHaveBeenLastCalledWith('File C selected.');
      expect(announce).toHaveBeenCalledTimes(2);
      let button = tree.getAllByRole('button')[0];
      await user.click(button);
      expect(announce).toHaveBeenCalledTimes(2);

      // breadcrumb root
      link = tree.getAllByRole('menuitemradio')[0];
      await user.click(link);

      act(() => {
        // TableWithBreadcrumbs has a setTimeout to load the results of the link navigation on Folder A
        jest.runAllTimers();
      });

      // focus isn't on the table, so we don't announce that it has been deselected
      expect(announce).toHaveBeenCalledTimes(2);

      link = tree.getAllByRole('link')[1];
      await user.click(link);

      act(() => {
        // TableWithBreadcrumbs has a setTimeout to load the results of the link navigation on Folder A
        jest.runAllTimers();
      });

      expect(announce).toHaveBeenCalledTimes(3);
      expect(announce).toHaveBeenLastCalledWith('No items selected.');
    });

    describe('onAction', function () {
      it('should trigger onAction when clicking rows with the mouse', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        let tree = renderTable({onSelectionChange, onAction});

        let rows = tree.getAllByRole('row');
        await user.click(getCell(tree, 'Baz 10'), {pointerType: 'mouse'});
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenLastCalledWith('Foo 10');
        checkRowSelection(rows.slice(1), false);

        let checkbox = within(rows[1]).getByRole('checkbox');
        await user.click(checkbox);
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        checkRowSelection([rows[1]], true);

        await user.click(getCell(tree, 'Baz 10'), {pointerType: 'mouse'});
        expect(onSelectionChange).toHaveBeenCalledTimes(2);
        checkRowSelection([rows[1], rows[10]], true);
      });

      it('should trigger onAction when clicking rows with touch', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        let tree = renderTable({onSelectionChange, onAction});

        let rows = tree.getAllByRole('row');
        await user.click(getCell(tree, 'Baz 10'), {pointerType: 'touch'});
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenLastCalledWith('Foo 10');
        checkRowSelection(rows.slice(1), false);

        let checkbox = within(rows[1]).getByRole('checkbox');
        await user.click(checkbox, {pointerType: 'touch'});
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        checkRowSelection([rows[1]], true);

        await user.click(getCell(tree, 'Baz 10'), {pointerType: 'touch'});
        expect(onSelectionChange).toHaveBeenCalledTimes(2);
        checkRowSelection([rows[1], rows[10]], true);
      });

      describe('needs PointerEvent defined', () => {
        installPointerEvent();
        it('should support long press to enter selection mode on touch', async function () {
          let onSelectionChange = jest.fn();
          let onAction = jest.fn();
          let tree = renderTable({onSelectionChange, onAction, selectionStyle: 'highlight'});
          let tableTester = testUtilUser.createTester('Table', {root: tree.getByRole('grid')});
          tableTester.setInteractionType('touch');

          act(() => jest.runAllTimers());
          await user.pointer({target: document.body, keys: '[TouchA]'});

          await tableTester.toggleRowSelection({row: 'Foo 5', needsLongPress: true});
          checkSelection(onSelectionChange, ['Foo 5']);
          expect(onAction).not.toHaveBeenCalled();
          onSelectionChange.mockReset();

          await tableTester.toggleRowSelection({row: 'Foo 10', needsLongPress: false});
          checkSelection(onSelectionChange, ['Foo 5', 'Foo 10']);

          // Deselect all to exit selection mode
          onSelectionChange.mockReset();
          await tableTester.toggleRowSelection({row: 'Foo 10', needsLongPress: false});
          checkSelection(onSelectionChange, ['Foo 5']);
          onSelectionChange.mockReset();
          await tableTester.toggleRowSelection({row: 'Foo 5', needsLongPress: false});
          act(() => jest.runAllTimers());
          checkSelection(onSelectionChange, []);
          expect(onAction).not.toHaveBeenCalled();
        });
      });

      it('should trigger onAction when pressing Enter', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        let tree = renderTable({onSelectionChange, onAction});
        let rows = tree.getAllByRole('row');

        await user.tab();
        await user.keyboard('{ArrowDown}'.repeat(9));
        await user.keyboard('{Enter}');
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenLastCalledWith('Foo 10');
        checkRowSelection(rows.slice(1), false);

        onAction.mockReset();
        await user.keyboard(' ');
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onAction).not.toHaveBeenCalled();
        checkRowSelection([rows[10]], true);
      });
    });

    describe('selectionStyle highlight', function () {
      it('will replace the current selection with the new selection', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange, selectionStyle: 'highlight'});

        expect(tree.queryByLabelText('Select All')).toBeNull();

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.click(getCell(tree, 'Baz 10'));
        expect(announce).toHaveBeenLastCalledWith('Foo 10 selected.');
        expect(announce).toHaveBeenCalledTimes(1);

        onSelectionChange.mockReset();
        await user.keyboard('[ShiftLeft>]');
        await user.click(getCell(tree, 'Baz 20'));
        await user.keyboard('[/ShiftLeft]');
        // await user.click(getCell(tree, 'Baz 20'), {pointerType: 'mouse', shiftKey: true});
        expect(announce).toHaveBeenLastCalledWith('11 items selected.');
        expect(announce).toHaveBeenCalledTimes(2);

        onSelectionChange.mockReset();
        await user.click(getCell(tree, 'Foo 5'));
        expect(announce).toHaveBeenLastCalledWith('Foo 5 selected. 1 item selected.');
        expect(announce).toHaveBeenCalledTimes(3);

        checkSelection(onSelectionChange, [
          'Foo 5'
        ]);

        checkRowSelection(rows.slice(1, 5), false);
        checkRowSelection(rows.slice(5, 6), true);
        checkRowSelection(rows.slice(6), false);

        onSelectionChange.mockReset();
        await user.keyboard('[ShiftLeft>]');
        await user.click(getCell(tree, 'Foo 10'));
        await user.keyboard('[/ShiftLeft]');
        expect(announce).toHaveBeenLastCalledWith('6 items selected.');
        expect(announce).toHaveBeenCalledTimes(4);

        checkSelection(onSelectionChange, [
          'Foo 5', 'Foo 6', 'Foo 7', 'Foo 8', 'Foo 9', 'Foo 10'
        ]);

        checkRowSelection(rows.slice(1, 5), false);
        checkRowSelection(rows.slice(5, 11), true);
        checkRowSelection(rows.slice(11), false);
      });

      it('will add to the current selection if the command key is pressed', async function () {
        let uaMock = jest.spyOn(navigator, 'platform', 'get').mockImplementation(() => 'Mac');
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange, selectionStyle: 'highlight'});

        expect(tree.queryByLabelText('Select All')).toBeNull();

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.click(getCell(tree, 'Baz 10'), {pointerType: 'mouse'});

        onSelectionChange.mockReset();
        await user.keyboard('[ShiftLeft>]');
        await user.click(getCell(tree, 'Baz 20'));
        await user.keyboard('[/ShiftLeft]');

        onSelectionChange.mockReset();
        await user.keyboard('[MetaLeft>]');
        await user.click(getCell(tree, 'Foo 5'));
        await user.keyboard('[/MetaLeft]');

        checkSelection(onSelectionChange, [
          'Foo 5', 'Foo 10', 'Foo 11', 'Foo 12', 'Foo 13', 'Foo 14', 'Foo 15',
          'Foo 16', 'Foo 17', 'Foo 18', 'Foo 19', 'Foo 20'
        ]);

        checkRowSelection(rows.slice(1, 5), false);
        checkRowSelection(rows.slice(5, 6), true);
        checkRowSelection(rows.slice(6, 10), false);
        checkRowSelection(rows.slice(10, 21), true);
        checkRowSelection(rows.slice(21), false);

        uaMock.mockRestore();
      });

      describe('needs pointerEvents', function () {
        installPointerEvent();
        it('should toggle selection with touch', async function () {
          let onSelectionChange = jest.fn();
          let tree = renderTable({onSelectionChange, selectionStyle: 'highlight'});
          let tableTester = testUtilUser.createTester('Table', {root: tree.getByRole('grid')});
          tableTester.setInteractionType('touch');
          expect(tree.queryByLabelText('Select All')).toBeNull();

          await tableTester.toggleRowSelection({row: 'Baz 5'});
          expect(announce).toHaveBeenLastCalledWith('Foo 5 selected.');
          expect(announce).toHaveBeenCalledTimes(1);
          onSelectionChange.mockReset();
          await tableTester.toggleRowSelection({row: 'Foo 10'});
          expect(announce).toHaveBeenLastCalledWith('Foo 10 selected. 2 items selected.');
          expect(announce).toHaveBeenCalledTimes(2);

          checkSelection(onSelectionChange, ['Foo 5', 'Foo 10']);
        });

        it('should support single tap to perform onAction with touch', async function () {
          let onSelectionChange = jest.fn();
          let onAction = jest.fn();
          let tree = renderTable({onSelectionChange, selectionStyle: 'highlight', onAction});

          await user.pointer({target: getCell(tree, 'Baz 5'), keys: '[TouchA]'});
          expect(announce).not.toHaveBeenCalled();
          expect(onSelectionChange).not.toHaveBeenCalled();
          expect(onAction).toHaveBeenCalledTimes(1);
          expect(onAction).toHaveBeenCalledWith('Foo 5');
        });
      });

      it('should support double click to perform onAction with mouse', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        let tree = renderTable({onSelectionChange, selectionStyle: 'highlight', onAction});
        let tableTester = testUtilUser.createTester('Table', {root: tree.getByRole('grid')});

        await tableTester.toggleRowSelection({row: 'Foo 5'});
        expect(announce).toHaveBeenLastCalledWith('Foo 5 selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Foo 5']);
        expect(onAction).not.toHaveBeenCalled();

        announce.mockReset();
        onSelectionChange.mockReset();
        await tableTester.triggerRowAction({row: 'Foo 5', needsDoubleClick: true});
        expect(announce).not.toHaveBeenCalled();
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('Foo 5');
      });

      describe('needs pointerEvents', function () {
        installPointerEvent();
        it('should support single tap to perform row selection with screen reader if onAction isn\'t provided', function () {
          let onSelectionChange = jest.fn();
          let tree = renderTable({onSelectionChange, selectionStyle: 'highlight'});

          let cell = getCell(tree, 'Baz 5');
          fireEvent(cell, pointerEvent('pointerdown', {width: 0, height: 0, pointerType: 'touch'}));
          fireEvent(cell, pointerEvent('mousedown', {}));
          fireEvent(cell, pointerEvent('pointerup', {width: 0, height: 0, pointerType: 'touch'}));
          fireEvent(cell, pointerEvent('mouseup', {}));
          fireEvent(cell, pointerEvent('click', {}));
          checkSelection(onSelectionChange, [
            'Foo 5'
          ]);
          onSelectionChange.mockReset();

          cell = getCell(tree, 'Foo 8');
          fireEvent(cell, pointerEvent('pointerdown', {
            pointerId: 1,
            width: 1,
            height: 1,
            pressure: 0,
            detail: 0,
            pointerType: 'mouse'
          }));
          fireEvent(cell, pointerEvent('pointerup', {
            pointerId: 1,
            width: 1,
            height: 1,
            pressure: 0,
            detail: 0,
            pointerType: 'mouse'
          }));
          fireEvent.click(cell, {pointerType: 'mouse', width: 1, height: 1, detail: 1});
          checkSelection(onSelectionChange, [
            'Foo 5', 'Foo 8'
          ]);
          onSelectionChange.mockReset();

          // Android TalkBack double tap test, virtual pointer event sets pointerType and onClick handles the rest
          cell = getCell(tree, 'Foo 10');
          fireEvent(cell, pointerEvent('pointerdown', {
            pointerId: 1,
            width: 1,
            height: 1,
            pressure: 0,
            detail: 0,
            pointerType: 'mouse'
          }));
          fireEvent(cell, pointerEvent('pointerup', {
            pointerId: 1,
            width: 1,
            height: 1,
            pressure: 0,
            detail: 0,
            pointerType: 'mouse'
          }));
          fireEvent.click(cell, {pointerType: 'mouse', width: 1, height: 1, detail: 1});
          checkSelection(onSelectionChange, [
            'Foo 5', 'Foo 8', 'Foo 10'
          ]);
        });

        it('should support single tap to perform onAction with screen reader', function () {
          let onSelectionChange = jest.fn();
          let onAction = jest.fn();
          let tree = renderTable({onSelectionChange, selectionStyle: 'highlight', onAction});

          fireEvent.click(getCell(tree, 'Baz 5'), {detail: 0});
          expect(announce).not.toHaveBeenCalled();
          expect(onSelectionChange).not.toHaveBeenCalled();
          expect(onAction).toHaveBeenCalledTimes(1);
          expect(onAction).toHaveBeenCalledWith('Foo 5');

          // Android TalkBack double tap test, virtual pointer event sets pointerType and onClick handles the rest
          let cell = getCell(tree, 'Foo 10');
          fireEvent(cell, pointerEvent('pointerdown', {pointerId: 1, width: 1, height: 1, pressure: 0, detail: 0, pointerType: 'mouse'}));
          fireEvent(cell, pointerEvent('pointerup', {pointerId: 1, width: 1, height: 1, pressure: 0, detail: 0, pointerType: 'mouse'}));
          fireEvent.click(cell, {pointerType: 'mouse', width: 1, height: 1, detail: 1});
          expect(onSelectionChange).not.toHaveBeenCalled();
          expect(onAction).toHaveBeenCalledTimes(2);
          expect(onAction).toHaveBeenCalledWith('Foo 10');
        });
      });

      describe('with pointer events', () => {
        beforeEach(() => {
          window.ontouchstart = jest.fn();
        });
        afterEach(() => {
          delete window.ontouchstart;
        });

        describe('still needs pointer events install', function () {
          installPointerEvent();
          it('should support long press to enter selection mode on touch', async function () {
            let onSelectionChange = jest.fn();
            let onAction = jest.fn();
            let tree = renderTable({onSelectionChange, selectionStyle: 'highlight', onAction});
            act(() => {
              jest.runAllTimers();
            });

            let tableTester = testUtilUser.createTester('Table', {root: tree.getByRole('grid')});
            tableTester.setInteractionType('touch');

            await user.click(document.body);

            // TODO: Not replacing this with util for long press since it tests various things in the middle of the press
            fireEvent.pointerDown(tableTester.findCell({text: 'Baz 5'}), {pointerType: 'touch'});
            let description = tree.getByText('Long press to enter selection mode.');
            expect(tree.getByRole('grid')).toHaveAttribute('aria-describedby', expect.stringContaining(description.id));
            expect(announce).not.toHaveBeenCalled();
            expect(onSelectionChange).not.toHaveBeenCalled();
            expect(onAction).not.toHaveBeenCalled();
            expect(tree.queryByLabelText('Select All')).toBeNull();

            act(() => {
              jest.advanceTimersByTime(800);
            });

            expect(announce).toHaveBeenLastCalledWith('Foo 5 selected.');
            expect(announce).toHaveBeenCalledTimes(1);
            checkSelection(onSelectionChange, ['Foo 5']);
            expect(onAction).not.toHaveBeenCalled();
            expect(tree.queryByLabelText('Select All')).not.toBeNull();

            let cell = getCell(tree, 'Baz 5');
            fireEvent.pointerUp(cell, {pointerType: 'touch'});
            fireEvent.click(cell, {detail: 1});
            onSelectionChange.mockReset();
            act(() => {
              jest.runAllTimers();
            });

            await user.click(getCell(tree, 'Foo 10'), {pointerType: 'touch'});
            act(() => {
              jest.runAllTimers();
            });
            expect(announce).toHaveBeenLastCalledWith('Foo 10 selected. 2 items selected.');
            expect(announce).toHaveBeenCalledTimes(2);
            checkSelection(onSelectionChange, ['Foo 5', 'Foo 10']);

            // Deselect all to exit selection mode
            await tableTester.toggleRowSelection({row: 'Foo 10'});
            expect(announce).toHaveBeenLastCalledWith('Foo 10 not selected. 1 item selected.');
            expect(announce).toHaveBeenCalledTimes(3);
            onSelectionChange.mockReset();

            await tableTester.toggleRowSelection({row: 'Foo 5'});
            expect(announce).toHaveBeenLastCalledWith('Foo 5 not selected.');
            expect(announce).toHaveBeenCalledTimes(4);

            checkSelection(onSelectionChange, []);
            expect(onAction).not.toHaveBeenCalled();
            expect(tree.queryByLabelText('Select All')).toBeNull();
          });
        });
      });

      it('should support Enter to perform onAction with keyboard', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        renderTable({onSelectionChange, selectionStyle: 'highlight', onAction});

        await user.tab();
        await user.keyboard('{ArrowDown}'.repeat(8));
        await user.keyboard('{ArrowRight}{ArrowRight}');
        onSelectionChange.mockReset();
        await user.keyboard('{ArrowDown}');
        checkSelection(onSelectionChange, ['Foo 10']);
        expect(onAction).not.toHaveBeenCalled();

        onSelectionChange.mockReset();
        await user.keyboard('{ArrowUp}'.repeat(5));
        onSelectionChange.mockReset();
        announce.mockReset();
        onSelectionChange.mockReset();
        await user.keyboard('{Enter}');
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(announce).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('Foo 5');
      });

      it('should perform onAction on single click with selectionMode: none', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        let tree = renderTable({onSelectionChange, selectionMode: 'none', onAction});

        await user.click(getCell(tree, 'Baz 10'), {pointerType: 'mouse'});
        expect(announce).not.toHaveBeenCalled();
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('Foo 10');
      });

      it('should move selection when using the arrow keys', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange, selectionStyle: 'highlight'});

        await user.click(getCell(tree, 'Baz 5'), {pointerType: 'mouse'});
        expect(announce).toHaveBeenLastCalledWith('Foo 5 selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Foo 5']);

        announce.mockReset();
        onSelectionChange.mockReset();
        await user.keyboard('{ArrowDown}');
        expect(announce).toHaveBeenCalledWith('Foo 6 selected.');
        checkSelection(onSelectionChange, ['Foo 6']);

        onSelectionChange.mockReset();
        await user.keyboard('{ArrowUp}');
        expect(announce).toHaveBeenCalledWith('Foo 5 selected.');
        checkSelection(onSelectionChange, ['Foo 5']);

        onSelectionChange.mockReset();
        await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
        expect(announce).toHaveBeenCalledWith('Foo 6 selected. 2 items selected.');
        checkSelection(onSelectionChange, ['Foo 5', 'Foo 6']);
      });

      it('should announce the new row when moving with the keyboard after multi select', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange, selectionStyle: 'highlight'});

        await user.click(getCell(tree, 'Baz 5'), {pointerType: 'mouse'});
        expect(announce).toHaveBeenLastCalledWith('Foo 5 selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Foo 5']);

        announce.mockReset();
        onSelectionChange.mockReset();
        await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
        expect(announce).toHaveBeenCalledWith('Foo 6 selected. 2 items selected.');
        checkSelection(onSelectionChange, ['Foo 5', 'Foo 6']);

        announce.mockReset();
        onSelectionChange.mockReset();
        await user.keyboard('{ArrowDown}');
        expect(announce).toHaveBeenCalledWith('Foo 7 selected. 1 item selected.');
        checkSelection(onSelectionChange, ['Foo 7']);
      });

      it('should support non-contiguous selection with the keyboard', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange, selectionStyle: 'highlight'});

        await user.click(getCell(tree, 'Baz 5'), {pointerType: 'mouse'});
        expect(announce).toHaveBeenLastCalledWith('Foo 5 selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Foo 5']);

        announce.mockReset();
        onSelectionChange.mockReset();
        await user.keyboard('{Control>}{ArrowDown}{/Control}');
        expect(announce).not.toHaveBeenCalled();
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(getCell(tree, 'Baz 6'));

        await user.keyboard('{Control>}{ArrowDown}{/Control}');
        expect(announce).not.toHaveBeenCalled();
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(getCell(tree, 'Baz 7'));

        await user.keyboard('{Control>} {/Control}');
        expect(announce).toHaveBeenCalledWith('Foo 7 selected. 2 items selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Foo 5', 'Foo 7']);

        announce.mockReset();
        onSelectionChange.mockReset();
        await user.keyboard(' ');
        expect(announce).toHaveBeenCalledWith('Foo 7 selected. 1 item selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Foo 7']);
      });

      it('should not call onSelectionChange when hitting Space/Enter on the currently selected row', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        renderTable({onSelectionChange, selectionStyle: 'highlight', onAction});

        await user.tab();
        await user.keyboard('{ArrowDown}'.repeat(8));
        await user.keyboard('{ArrowRight}{ArrowRight}');
        onSelectionChange.mockReset();
        await user.keyboard('{ArrowDown}');
        checkSelection(onSelectionChange, ['Foo 10']);
        expect(onAction).not.toHaveBeenCalled();

        await user.keyboard(' ');
        expect(onSelectionChange).toHaveBeenCalledTimes(1);

        await user.keyboard('{Enter}');
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('Foo 10');
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
      });

      it('should announce the current selection when moving from all to one item', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        let tree = renderTable({onSelectionChange, selectionStyle: 'highlight', onAction});
        await user.click(getCell(tree, 'Baz 5'), {pointerType: 'mouse'});
        expect(announce).toHaveBeenLastCalledWith('Foo 5 selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Foo 5']);

        announce.mockReset();
        onSelectionChange.mockReset();
        await user.keyboard('{Control>}a{/Control}');
        expect(onSelectionChange.mock.calls[0][0]).toEqual('all');
        expect(announce).toHaveBeenCalledWith('All items selected.');

        announce.mockReset();
        onSelectionChange.mockReset();
        await user.keyboard('{ArrowDown}');
        expect(announce).toHaveBeenCalledWith('Foo 6 selected. 1 item selected.');
        checkSelection(onSelectionChange, ['Foo 6']);
      });
    });
  });

  describe('single selection', function () {
    let renderJSX = (props, items = manyItems) => (
      <TableView aria-label="Table" selectionMode="single" {...props}>
        <TableHeader columns={columns}>
          {column => <Column>{column.name}</Column>}
        </TableHeader>
        <TableBody items={items}>
          {item =>
            (<Row key={item.foo}>
              {key => <Cell>{item[key]}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
    );

    let renderTable = (props, items = manyItems) => render(renderJSX(props, items));

    let checkSelection = (onSelectionChange, selectedKeys) => {
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(selectedKeys));
    };

    let checkRowSelection = (rows, selected) => {
      for (let row of rows) {
        expect(row).toHaveAttribute('aria-selected', '' + selected);
      }
    };

    describe('row selection', function () {
      it('should select a row from checkbox', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.click(within(row).getByRole('checkbox'));

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
      });

      it('should select a row by pressing on a cell', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.click(getCell(tree, 'Baz 1'));

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
      });

      it('should select a row by pressing the Space key on a row', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.tab();
        await user.keyboard('{ArrowRight}');
        await user.keyboard(' ');

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
      });

      it('should select a row by pressing the Enter key on a row', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.tab();
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Enter}');

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
      });

      it('should select a row by pressing the Space key on a cell', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.tab();
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Enter}');

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
      });

      it('should select a row by pressing the Enter key on a cell', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.tab();
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Enter}');

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(row).toHaveAttribute('aria-selected', 'true');
      });

      it('will only select one if pointer is used to click on multiple rows', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.click(getCell(tree, 'Baz 1'));

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(rows[2]).toHaveAttribute('aria-selected', 'false');
        checkRowSelection(rows.slice(2), false);

        onSelectionChange.mockReset();
        await user.click(getCell(tree, 'Baz 2'));

        checkSelection(onSelectionChange, ['Foo 2']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'true');
        checkRowSelection(rows.slice(3), false);

        // Deselect
        onSelectionChange.mockReset();
        await user.click(getCell(tree, 'Baz 2'));

        checkSelection(onSelectionChange, []);
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'false');
        checkRowSelection(rows.slice(2), false);
      });

      it('will only select one if pointer is used to click on multiple checkboxes', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.click(within(rows[1]).getByRole('checkbox'));

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(rows[2]).toHaveAttribute('aria-selected', 'false');
        checkRowSelection(rows.slice(2), false);

        onSelectionChange.mockReset();
        await user.click(within(rows[2]).getByRole('checkbox'));

        checkSelection(onSelectionChange, ['Foo 2']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'true');
        checkRowSelection(rows.slice(3), false);

        // Deselect
        onSelectionChange.mockReset();
        await user.click(within(rows[2]).getByRole('checkbox'));

        checkSelection(onSelectionChange, []);
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'false');
        checkRowSelection(rows.slice(2), false);
      });

      it('should support selecting single row only with the Space key', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});

        let rows = tree.getAllByRole('row');
        checkRowSelection(rows.slice(1), false);
        await user.tab();
        await user.keyboard('{ArrowRight}{ArrowRight}');
        await user.keyboard(' ');

        checkSelection(onSelectionChange, ['Foo 1']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(rows[2]).toHaveAttribute('aria-selected', 'false');
        checkRowSelection(rows.slice(2), false);

        onSelectionChange.mockReset();
        await user.keyboard('{ArrowDown}');
        await user.keyboard(' ');

        checkSelection(onSelectionChange, ['Foo 2']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'true');
        checkRowSelection(rows.slice(3), false);

        // Deselect
        onSelectionChange.mockReset();
        await user.keyboard(' ');

        checkSelection(onSelectionChange, []);
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'false');
        checkRowSelection(rows.slice(2), false);
      });

      it('should not select a disabled row from checkbox or keyboard interaction', async function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange, disabledKeys: ['Foo 1']});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.click(within(row).getByRole('checkbox'));
        await user.click(getCell(tree, 'Baz 1'));
        await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
        await user.keyboard(' ');
        await user.keyboard('{ArrowRight}{ArrowRight}');
        await user.keyboard(' ');
        await user.keyboard('{Enter}');

        expect(row).toHaveAttribute('aria-selected', 'false');
        expect(onSelectionChange).not.toHaveBeenCalled();
      });
    });

    describe('row selection column header', function () {
      it('should contain a hidden checkbox and VisuallyHidden accessible text', function () {
        let onSelectionChange = jest.fn();
        let tree = renderTable({onSelectionChange});
        let columnheader = tree.getAllByRole('columnheader')[0];
        let checkboxInput = columnheader.querySelector('input[type="checkbox"]');
        expect(columnheader).not.toHaveAttribute('aria-disabled', 'true');
        expect(columnheader.firstElementChild).toBeVisible();
        expect(checkboxInput).not.toBeVisible();
        expect(checkboxInput.getAttribute('aria-label')).toEqual('Select');
        expect(columnheader.firstElementChild.textContent).toEqual(checkboxInput.getAttribute('aria-label'));
      });
    });
  });

  describe('press/hover interactions and selection mode', function () {
    let TableWithBreadcrumbs = (props) => (
      <TableView aria-label="Table" {...props}>
        <TableHeader columns={columns}>
          {column => <Column>{column.name}</Column>}
        </TableHeader>
        <TableBody items={items}>
          {item =>
            (<Row key={item.foo}>
              {key => <Cell>{item[key]}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
    );

    it('displays pressed/hover styles when row is pressed/hovered and selection mode is not "none"', async function () {
      let tree = render(<TableWithBreadcrumbs selectionMode="multiple" />);

      let row = tree.getAllByRole('row')[1];
      await user.hover(row);
      expect(row.className.includes('is-hovered')).toBeTruthy();
      await user.pointer({target: row, keys: '[MouseLeft>]'});
      expect(row.className.includes('is-active')).toBeTruthy();
      await user.pointer({target: row, keys: '[/MouseLeft]'});

      rerender(tree, <TableWithBreadcrumbs selectionMode="single" />);
      row = tree.getAllByRole('row')[1];
      await user.hover(row);
      expect(row.className.includes('is-hovered')).toBeTruthy();
      await user.pointer({target: row, keys: '[MouseLeft>]'});
      expect(row.className.includes('is-active')).toBeTruthy();
      await user.pointer({target: row, keys: '[/MouseLeft]'});
    });

    it('doesn\'t show pressed/hover styles when row is pressed/hovered and selection mode is "none" and disabledBehavior="all"', async function () {
      let tree = render(<TableWithBreadcrumbs disabledBehavior="all" selectionMode="none" />);

      let row = tree.getAllByRole('row')[1];
      await user.hover(row);
      expect(row.className.includes('is-hovered')).toBeFalsy();
      await user.pointer({target: row, keys: '[MouseLeft>]'});
      expect(row.className.includes('is-active')).toBeFalsy();
      await user.pointer({target: row, keys: '[/MouseLeft]'});
    });

    it('shows pressed/hover styles when row is pressed/hovered and selection mode is "none", disabledBehavior="selection" and has a action', async function () {
      let tree = render(<TableWithBreadcrumbs onAction={jest.fn()} disabledBehavior="selection" selectionMode="none" />);

      let row = tree.getAllByRole('row')[1];
      await user.hover(row);
      expect(row.className.includes('is-hovered')).toBeTruthy();
      await user.pointer({target: row, keys: '[MouseLeft>]'});
      expect(row.className.includes('is-active')).toBeTruthy();
      await user.pointer({target: row, keys: '[/MouseLeft]'});
    });

    it('shows pressed/hover styles when row is pressed/hovered, disabledBehavior="selection", row is disabled and has a action', async function () {
      let tree = render(<TableWithBreadcrumbs disabledKeys={['Foo 1']} onAction={jest.fn()} disabledBehavior="selection" selectionMode="none" />);

      let row = tree.getAllByRole('row')[1];
      await user.hover(row);
      expect(row.className.includes('is-hovered')).toBeTruthy();
      await user.pointer({target: row, keys: '[MouseLeft>]'});
      expect(row.className.includes('is-active')).toBeTruthy();
      await user.pointer({target: row, keys: '[/MouseLeft]'});
    });

    it('doesn\'t show pressed/hover styles when row is pressed/hovered, has a action, but is disabled and disabledBehavior="all"', async function () {
      let tree = render(<TableWithBreadcrumbs disabledKeys={['Foo 1']} onAction={jest.fn()} disabledBehavior="all" selectionMode="multiple" />);

      let row = tree.getAllByRole('row')[1];
      await user.hover(row);
      expect(row.className.includes('is-hovered')).toBeFalsy();
      await user.pointer({target: row, keys: '[MouseLeft>]'});
      expect(row.className.includes('is-active')).toBeFalsy();
      await user.pointer({target: row, keys: '[/MouseLeft]'});
    });
  });

  describe('CRUD', function () {
    it('can add items', async function () {
      let tree = render(<Provider theme={theme}><CRUDExample /></Provider>);

      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);
      expect(rows[1]).toHaveAttribute('aria-rowindex', '2');
      expect(rows[2]).toHaveAttribute('aria-rowindex', '3');

      let button = tree.getByLabelText('Add item');
      await user.click(button);
      act(() => {jest.runAllTimers();});

      let dialog = tree.getByRole('dialog');
      expect(dialog).toBeVisible();

      await user.keyboard('Devon');
      await user.tab();

      await user.keyboard('Govett');
      await user.tab();

      await user.keyboard('Feb 3');
      await user.tab();

      let createButton = tree.getByText('Create');
      await user.click(createButton);
      act(() => {jest.runAllTimers();});

      expect(dialog).not.toBeInTheDocument();

      rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(4);
      expect(rows[1]).toHaveAttribute('aria-rowindex', '2');
      expect(rows[2]).toHaveAttribute('aria-rowindex', '3');
      expect(rows[3]).toHaveAttribute('aria-rowindex', '4');

      let rowHeaders = within(rows[1]).getAllByRole('rowheader');
      expect(rowHeaders[0]).toHaveTextContent('Devon');
      expect(rowHeaders[1]).toHaveTextContent('Govett');

      let cells = within(rows[1]).getAllByRole('gridcell');
      expect(cells[1]).toHaveTextContent('Feb 3');
    });

    it('can remove items', async function () {
      let tree = render(<Provider theme={theme}><CRUDExample /></Provider>);

      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);

      await user.tab();
      await user.tab();
      expect(document.activeElement).toBe(rows[1]);

      fireEvent.keyDown(document.activeElement, {key: 'ArrowLeft'});
      fireEvent.keyUp(document.activeElement, {key: 'ArrowLeft'});
      expect(document.activeElement).toBe(within(rows[1]).getByRole('button'));

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});

      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitem');
      expect(menuItems.length).toBe(2);
      expect(document.activeElement).toBe(menuItems[0]);

      fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
      fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(menuItems[1]);

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      expect(menu).not.toBeInTheDocument();

      let dialog = tree.getByRole('alertdialog', {hidden: true});
      let deleteButton = within(dialog).getByRole('button', {hidden: true});

      await user.click(deleteButton);
      act(() => jest.runAllTimers());
      expect(dialog).not.toBeInTheDocument();

      act(() => jest.runAllTimers());
      expect(rows[1]).not.toBeInTheDocument();

      rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(2);

      expect(within(rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Julia');

      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(within(rows[1]).getByRole('button'));
    });

    it('resets row indexes after deleting a row', async function () {
      let tree = render(<Provider theme={theme}><CRUDExample /></Provider>);

      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);
      expect(rows[1]).toHaveAttribute('aria-rowindex', '2');
      expect(rows[2]).toHaveAttribute('aria-rowindex', '3');

      let button = within(rows[1]).getByRole('button');
      await user.click(button);

      let menu = tree.getByRole('menu');
      expect(document.activeElement).toBe(menu);

      let menuItems = within(menu).getAllByRole('menuitem');
      expect(menuItems.length).toBe(2);

      await user.click(menuItems[1]);
      act(() => jest.runAllTimers());
      expect(menu).not.toBeInTheDocument();

      let dialog = tree.getByRole('alertdialog', {hidden: true});
      let deleteButton = within(dialog).getByRole('button', {hidden: true});

      await user.click(deleteButton);
      act(() => jest.runAllTimers());
      expect(dialog).not.toBeInTheDocument();

      act(() => jest.runAllTimers());
      act(() => jest.runAllTimers());
      expect(rows[1]).not.toBeInTheDocument();

      rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(2);

      let rowHeaders = within(rows[1]).getAllByRole('rowheader');
      expect(rowHeaders[0]).toHaveTextContent('Julia');

      expect(rows[1]).toHaveAttribute('aria-rowindex', '2');
    });

    it('can bulk remove items', async function () {
      let tree = render(<Provider theme={theme}><CRUDExample /></Provider>);

      let addButton = tree.getAllByRole('button')[0];
      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);

      let checkbox = within(rows[0]).getByRole('checkbox');
      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);

      let deleteButton = tree.getByLabelText('Delete selected items');
      await user.click(deleteButton);

      let dialog = tree.getByRole('alertdialog');
      let confirmButton = within(dialog).getByRole('button');
      expect(document.activeElement).toBe(dialog);

      await user.click(confirmButton);
      act(() => jest.runAllTimers());
      expect(dialog).not.toBeInTheDocument();

      act(() => jest.runAllTimers());

      rows = within(table).getAllByRole('row');

      // account for renderEmptyState
      await act(() => Promise.resolve());
      expect(rows).toHaveLength(2);
      expect(rows[1].firstChild.getAttribute('aria-colspan')).toBe('5');
      expect(rows[1].textContent).toBe('No results');

      expect(checkbox.checked).toBe(false);

      expect(document.activeElement).toBe(addButton);
    });

    it('can edit items', async function () {
      let tree = render(<Provider theme={theme}><CRUDExample /></Provider>);

      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);

      let button = within(rows[2]).getByRole('button');
      await user.click(button);
      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');
      expect(document.activeElement).toBe(menu);

      let menuItems = within(menu).getAllByRole('menuitem');
      expect(menuItems.length).toBe(2);

      await user.click(menuItems[0]);
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();

      let dialog = tree.getByRole('dialog');
      expect(dialog).toBeVisible();

      let firstName = tree.getByLabelText('First Name');
      expect(document.activeElement).toBe(firstName);
      await user.keyboard('Jessica');

      let saveButton = tree.getByText('Save');
      await user.click(saveButton);

      act(() => {jest.runAllTimers();});
      act(() => {jest.runAllTimers();});

      expect(dialog).not.toBeInTheDocument();

      let rowHeaders = within(rows[2]).getAllByRole('rowheader');
      expect(rowHeaders[0]).toHaveTextContent('Jessica');
      expect(rowHeaders[1]).toHaveTextContent('Jones');
      expect(document.activeElement).toBe(button);
    });

    it('keyboard navigation works as expected with menu buttons', async function () {
      let tree = render(<Provider theme={theme}><CRUDExample /></Provider>);

      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);

      act(() => within(rows[1]).getAllByRole('gridcell').pop().focus());
      act(() => {jest.runAllTimers();});
      let button = within(rows[1]).getByRole('button');
      expect(document.activeElement).toBe(button);

      fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});

      expect(tree.queryByRole('menu')).toBeNull();

      expect(document.activeElement).toBe(within(rows[2]).getByRole('button'));

      fireEvent.keyDown(document.activeElement, {key: 'ArrowUp'});
      fireEvent.keyUp(document.activeElement, {key: 'ArrowUp'});

      expect(tree.queryByRole('menu')).toBeNull();

      expect(document.activeElement).toBe(button);

      fireEvent.keyDown(document.activeElement, {key: 'ArrowDown', altKey: true});
      fireEvent.keyUp(document.activeElement, {key: 'ArrowDown', altKey: true});
      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');
      expect(document.activeElement).toBe(within(menu).getAllByRole('menuitem')[0]);

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      act(() => {jest.runAllTimers();});
      await user.tab();
      act(() => {jest.runAllTimers();});
      await user.tab();
      act(() => {jest.runAllTimers();});
      await user.tab();
      act(() => {jest.runAllTimers();});
      await user.tab();
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(tree.getAllByRole('button')[1]);

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      act(() => {jest.runAllTimers();});
      act(() => {jest.runAllTimers();});

      expect(document.activeElement).toBe(button);
    });

    it('menu buttons can be opened with Alt + ArrowDown', function () {
      let tree = render(<Provider theme={theme}><CRUDExample /></Provider>);

      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);

      act(() => within(rows[1]).getAllByRole('gridcell').pop().focus());
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(within(rows[1]).getByRole('button'));

      fireEvent.keyDown(document.activeElement, {key: 'ArrowDown', altKey: true});

      let menu = tree.getByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(document.activeElement).toBe(within(menu).getAllByRole('menuitem')[0]);
    });

    it('menu buttons can be opened with Alt + ArrowUp', function () {
      let tree = render(<Provider theme={theme}><CRUDExample /></Provider>);

      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);

      act(() => within(rows[1]).getAllByRole('gridcell').pop().focus());
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(within(rows[1]).getByRole('button'));

      fireEvent.keyDown(document.activeElement, {key: 'ArrowUp', altKey: true});

      let menu = tree.getByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(document.activeElement).toBe(within(menu).getAllByRole('menuitem').pop());
    });

    it('menu keyboard navigation does not affect table', function () {
      let tree = render(<Provider theme={theme}><CRUDExample /></Provider>);

      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);

      act(() => within(rows[1]).getAllByRole('gridcell').pop().focus());
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(within(rows[1]).getByRole('button'));

      fireEvent.keyDown(document.activeElement, {key: 'ArrowDown', altKey: true});
      fireEvent.keyUp(document.activeElement, {key: 'ArrowDown', altKey: true});

      let menu = tree.getByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(document.activeElement).toBe(within(menu).getAllByRole('menuitem')[0]);

      fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
      fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(within(menu).getAllByRole('menuitem')[1]);

      fireEvent.keyDown(document.activeElement, {key: 'Escape'});
      fireEvent.keyUp(document.activeElement, {key: 'Escape'});

      act(() => jest.runAllTimers());

      expect(menu).not.toBeInTheDocument();
      expect(document.activeElement).toBe(within(rows[1]).getByRole('button'));
    });
  });

  describe('with dialog trigger', function () {
    let TableWithBreadcrumbs = (props) => (
      <TableView aria-label="TableView with static contents" selectionMode="multiple" width={300} height={200} {...props}>
        <TableHeader>
          <Column key="foo">Foo</Column>
          <Column key="bar">Bar</Column>
          <Column key="baz">Baz</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>One</Cell>
            <Cell>Two</Cell>
            <Cell>
              <DialogTrigger>
                <ActionButton aria-label="Add"><Add /></ActionButton>
                {close => (
                  <Dialog>
                    <Heading>The Heading</Heading>
                    <Divider />
                    <Content>
                      <TextField autoFocus label="Last Words" data-testid="input" />
                    </Content>
                    <ButtonGroup>
                      <Button variant="secondary" onPress={close}>Cancel</Button>
                      <Button variant="cta" onPress={close}>Confirm</Button>
                    </ButtonGroup>
                  </Dialog>
                )}
              </DialogTrigger>
            </Cell>
          </Row>
        </TableBody>
      </TableView>
    );

    it('arrow keys interactions don\'t move the focus away from the textfield in the dialog', async function () {
      let tree = render(<TableWithBreadcrumbs />);
      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(2);

      let button = within(rows[1]).getByRole('button');
      await user.click(button);

      let dialog = tree.getByRole('dialog');
      let input = within(dialog).getByTestId('input');

      expect(input).toBeTruthy();
      await user.type(input, 'blah');
      expect(document.activeElement).toEqual(input);
      expect(input.value).toBe('blah');

      fireEvent.keyDown(input, {key: 'ArrowLeft', code: 37, charCode: 37});
      fireEvent.keyUp(input, {key: 'ArrowLeft', code: 37, charCode: 37});
      act(() => {
        jest.runAllTimers();
      });

      expect(document.activeElement).toEqual(input);

      fireEvent.keyDown(input, {key: 'ArrowRight', code: 39, charCode: 39});
      fireEvent.keyUp(input, {key: 'ArrowRight', code: 39, charCode: 39});
      act(() => {
        jest.runAllTimers();
      });

      expect(document.activeElement).toEqual(input);

      fireEvent.keyDown(input, {key: 'Escape', code: 27, charCode: 27});
      fireEvent.keyUp(input, {key: 'Escape', code: 27, charCode: 27});
      act(() => {
        jest.runAllTimers();
      });

      expect(dialog).not.toBeInTheDocument();
    });
  });

  describe('async loading', function () {
    it('should display a spinner when loading', function () {
      let tree = render(
        <TableView aria-label="Table" selectionMode="multiple">
          <TableHeader>
            <Column key="foo">Foo</Column>
            <Column key="bar">Bar</Column>
          </TableHeader>
          <TableBody loadingState="loading">
            {[]}
          </TableBody>
        </TableView>
      );

      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(2);
      expect(rows[1]).toHaveAttribute('aria-rowindex', '2');

      let cell = within(rows[1]).getByRole('rowheader');
      expect(cell).toHaveAttribute('aria-colspan', '3');

      let spinner = within(cell).getByRole('progressbar');
      expect(spinner).toBeVisible();
      expect(spinner).toHaveAttribute('aria-label', 'Loading…');
      expect(spinner).not.toHaveAttribute('aria-valuenow');

      rerender(tree, defaultTable);
      act(() => jest.runAllTimers());

      rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);
      expect(spinner).not.toBeInTheDocument();
    });

    it('should display a spinner at the bottom when loading more', function () {
      let tree = render(
        <TableView aria-label="Table">
          <TableHeader>
            <Column key="foo">Foo</Column>
            <Column key="bar">Bar</Column>
          </TableHeader>
          <TableBody loadingState="loadingMore">
            <Row>
              <Cell>Foo 1</Cell>
              <Cell>Bar 1</Cell>
            </Row>
            <Row>
              <Cell>Foo 2</Cell>
              <Cell>Bar 2</Cell>
            </Row>
          </TableBody>
        </TableView>
      );

      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(4);
      expect(rows[3]).toHaveAttribute('aria-rowindex', '4');

      let cell = within(rows[3]).getByRole('rowheader');
      expect(cell).toHaveAttribute('aria-colspan', '2');

      let spinner = within(cell).getByRole('progressbar');
      expect(spinner).toBeVisible();
      expect(spinner).toHaveAttribute('aria-label', 'Loading more…');
      expect(spinner).not.toHaveAttribute('aria-valuenow');

      rerender(tree, defaultTable);
      act(() => jest.runAllTimers());

      rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);
      expect(spinner).not.toBeInTheDocument();
    });

    it('should not display a spinner when filtering', function () {
      let tree = render(
        <TableView aria-label="Table">
          <TableHeader>
            <Column key="foo">Foo</Column>
            <Column key="bar">Bar</Column>
          </TableHeader>
          <TableBody loadingState="filtering">
            <Row>
              <Cell>Foo 1</Cell>
              <Cell>Bar 1</Cell>
            </Row>
            <Row>
              <Cell>Foo 2</Cell>
              <Cell>Bar 2</Cell>
            </Row>
          </TableBody>
        </TableView>
      );

      let table = tree.getByRole('grid');
      expect(within(table).queryByRole('progressbar')).toBeNull();
    });

    it('should fire onLoadMore when scrolling near the bottom', function () {
      let scrollHeightMock = jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 4100);
      let items = [];
      for (let i = 1; i <= 100; i++) {
        items.push({id: i, foo: 'Foo ' + i, bar: 'Bar ' + i});
      }

      let onLoadMore = jest.fn();
      let tree = render(
        <TableView aria-label="Table">
          <TableHeader>
            <Column key="foo">Foo</Column>
            <Column key="bar">Bar</Column>
          </TableHeader>
          <TableBody items={items} onLoadMore={onLoadMore}>
            {row => (
              <Row>
                {key => <Cell>{row[key]}</Cell>}
              </Row>
            )}
          </TableBody>
        </TableView>
      );

      let body = tree.getAllByRole('rowgroup')[1];
      let scrollView = body;

      let rows = within(body).getAllByRole('row');
      expect(rows).toHaveLength(34); // each row is 41px tall. table is 1000px tall. 25 rows fit. + 1/3 overscan

      scrollView.scrollTop = 250;
      fireEvent.scroll(scrollView);
      act(() => {jest.runAllTimers();});

      scrollView.scrollTop = 1500;
      fireEvent.scroll(scrollView);
      act(() => {jest.runAllTimers();});

      scrollView.scrollTop = 2800;
      fireEvent.scroll(scrollView);
      act(() => {jest.runAllTimers();});

      expect(onLoadMore).toHaveBeenCalledTimes(1);
      scrollHeightMock.mockReset();
    });

    it('should automatically fire onLoadMore if there aren\'t enough items to fill the Table', function () {
      let scrollHeightMock = jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 1000);
      let items = [{id: 1, foo: 'Foo 1', bar: 'Bar 1'}];
      let onLoadMore = jest.fn(() => {
        scrollHeightMock = jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 2000);
      });

      let TableMock = (props) => (
        <TableView aria-label="Table">
          <TableHeader>
            <Column key="foo">Foo</Column>
            <Column key="bar">Bar</Column>
          </TableHeader>
          <TableBody items={props.items} onLoadMore={onLoadMore}>
            {row => (
              <Row>
                {key => <Cell>{row[key]}</Cell>}
              </Row>
            )}
          </TableBody>
        </TableView>
      );

      render(<TableMock items={items} />);
      act(() => jest.runAllTimers());
      expect(onLoadMore).toHaveBeenCalledTimes(1);
      scrollHeightMock.mockReset();
    });
  });

  describe('sorting', function () {
    it('should set the proper aria-describedby and aria-sort on sortable column headers', function () {
      let tree = render(
        <TableView aria-label="Table">
          <TableHeader>
            <Column key="foo" allowsSorting>Foo</Column>
            <Column key="bar" allowsSorting>Bar</Column>
            <Column key="baz">Baz</Column>
          </TableHeader>
          <TableBody>
            <Row>
              <Cell>Foo 1</Cell>
              <Cell>Bar 1</Cell>
              <Cell>Baz 1</Cell>
            </Row>
          </TableBody>
        </TableView>
      );

      let table = tree.getByRole('grid');
      let columnheaders = within(table).getAllByRole('columnheader');
      expect(columnheaders).toHaveLength(3);
      expect(columnheaders[0]).toHaveAttribute('aria-sort', 'none');
      expect(columnheaders[1]).toHaveAttribute('aria-sort', 'none');
      expect(columnheaders[2]).not.toHaveAttribute('aria-sort');
      expect(columnheaders[0]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[0].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[1]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[1].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[2]).not.toHaveAttribute('aria-describedby');
    });

    it('should set the proper aria-describedby and aria-sort on an ascending sorted column header', function () {
      let tree = render(
        <TableView aria-label="Table" sortDescriptor={{column: 'bar', direction: 'ascending'}}>
          <TableHeader>
            <Column key="foo" allowsSorting>Foo</Column>
            <Column key="bar" allowsSorting>Bar</Column>
            <Column key="baz">Baz</Column>
          </TableHeader>
          <TableBody>
            <Row>
              <Cell>Foo 1</Cell>
              <Cell>Bar 1</Cell>
              <Cell>Baz 1</Cell>
            </Row>
          </TableBody>
        </TableView>
      );

      let table = tree.getByRole('grid');
      let columnheaders = within(table).getAllByRole('columnheader');
      expect(columnheaders).toHaveLength(3);
      expect(columnheaders[0]).toHaveAttribute('aria-sort', 'none');
      expect(columnheaders[1]).toHaveAttribute('aria-sort', 'ascending');
      expect(columnheaders[2]).not.toHaveAttribute('aria-sort');
      expect(columnheaders[0]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[0].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[1]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[1].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[2]).not.toHaveAttribute('aria-describedby');
    });

    it('should set the proper aria-describedby and aria-sort on an descending sorted column header', function () {
      let tree = render(
        <TableView aria-label="Table" sortDescriptor={{column: 'bar', direction: 'descending'}}>
          <TableHeader>
            <Column key="foo" allowsSorting>Foo</Column>
            <Column key="bar" allowsSorting>Bar</Column>
            <Column key="baz">Baz</Column>
          </TableHeader>
          <TableBody>
            <Row>
              <Cell>Foo 1</Cell>
              <Cell>Bar 1</Cell>
              <Cell>Baz 1</Cell>
            </Row>
          </TableBody>
        </TableView>
      );

      let table = tree.getByRole('grid');
      let columnheaders = within(table).getAllByRole('columnheader');
      expect(columnheaders).toHaveLength(3);
      expect(columnheaders[0]).toHaveAttribute('aria-sort', 'none');
      expect(columnheaders[1]).toHaveAttribute('aria-sort', 'descending');
      expect(columnheaders[2]).not.toHaveAttribute('aria-sort');
      expect(columnheaders[0]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[0].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[1]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[1].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[2]).not.toHaveAttribute('aria-describedby');
    });

    it('should add sort direction info to the column header\'s aria-describedby for Android', async function () {
      let uaMock = jest.spyOn(navigator, 'userAgent', 'get').mockImplementation(() => 'Android');
      let tree = render(<ExampleSortTable />);
      let tableTester = testUtilUser.createTester('Table', {root: tree.getByRole('grid')});
      tableTester.setInteractionType('keyboard');
      let columnheaders = tableTester.columns;
      expect(columnheaders).toHaveLength(3);
      expect(columnheaders[0]).not.toHaveAttribute('aria-sort');
      expect(columnheaders[1]).not.toHaveAttribute('aria-sort');
      expect(columnheaders[2]).not.toHaveAttribute('aria-sort');
      expect(columnheaders[0]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[0].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[1]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[1].getAttribute('aria-describedby'))).toHaveTextContent('sortable column, ascending');
      expect(columnheaders[2]).not.toHaveAttribute('aria-describedby');

      await tableTester.toggleSort({column: 1});
      expect(document.getElementById(columnheaders[1].getAttribute('aria-describedby'))).toHaveTextContent('sortable column, descending');

      uaMock.mockRestore();
    });

    it('should fire onSortChange when there is no existing sortDescriptor', async function () {
      let onSortChange = jest.fn();
      let tree = render(
        <TableView aria-label="Table" onSortChange={onSortChange}>
          <TableHeader>
            <Column key="foo" allowsSorting>Foo</Column>
            <Column key="bar" allowsSorting>Bar</Column>
            <Column key="baz">Baz</Column>
          </TableHeader>
          <TableBody>
            <Row>
              <Cell>Foo 1</Cell>
              <Cell>Bar 1</Cell>
              <Cell>Baz 1</Cell>
            </Row>
          </TableBody>
        </TableView>
      );

      let table = tree.getByRole('grid');
      let columnheaders = within(table).getAllByRole('columnheader');
      expect(columnheaders).toHaveLength(3);
      expect(columnheaders[0]).toHaveAttribute('aria-sort', 'none');
      expect(columnheaders[1]).toHaveAttribute('aria-sort', 'none');
      expect(columnheaders[2]).not.toHaveAttribute('aria-sort');
      expect(columnheaders[0]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[0].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[1]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[1].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[2]).not.toHaveAttribute('aria-describedby');

      await user.click(columnheaders[0]);

      expect(onSortChange).toHaveBeenCalledTimes(1);
      expect(onSortChange).toHaveBeenCalledWith({column: 'foo', direction: 'ascending'});
    });

    it('should toggle the sort direction from ascending to descending', async function () {
      let onSortChange = jest.fn();
      let tree = render(
        <TableView aria-label="Table" sortDescriptor={{column: 'foo', direction: 'ascending'}} onSortChange={onSortChange}>
          <TableHeader>
            <Column key="foo" allowsSorting>Foo</Column>
            <Column key="bar" allowsSorting>Bar</Column>
            <Column key="baz">Baz</Column>
          </TableHeader>
          <TableBody>
            <Row>
              <Cell>Foo 1</Cell>
              <Cell>Bar 1</Cell>
              <Cell>Baz 1</Cell>
            </Row>
          </TableBody>
        </TableView>
      );

      let table = tree.getByRole('grid');
      let columnheaders = within(table).getAllByRole('columnheader');
      expect(columnheaders).toHaveLength(3);
      expect(columnheaders[0]).toHaveAttribute('aria-sort', 'ascending');
      expect(columnheaders[1]).toHaveAttribute('aria-sort', 'none');
      expect(columnheaders[2]).not.toHaveAttribute('aria-sort');
      expect(columnheaders[0]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[0].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[1]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[1].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[2]).not.toHaveAttribute('aria-describedby');

      await user.click(columnheaders[0]);

      expect(onSortChange).toHaveBeenCalledTimes(1);
      expect(onSortChange).toHaveBeenCalledWith({column: 'foo', direction: 'descending'});
    });

    it('should toggle the sort direction from descending to ascending', async function () {
      let onSortChange = jest.fn();
      let tree = render(
        <TableView aria-label="Table" sortDescriptor={{column: 'foo', direction: 'descending'}} onSortChange={onSortChange}>
          <TableHeader>
            <Column key="foo" allowsSorting>Foo</Column>
            <Column key="bar" allowsSorting>Bar</Column>
            <Column key="baz">Baz</Column>
          </TableHeader>
          <TableBody>
            <Row>
              <Cell>Foo 1</Cell>
              <Cell>Bar 1</Cell>
              <Cell>Baz 1</Cell>
            </Row>
          </TableBody>
        </TableView>
      );

      let table = tree.getByRole('grid');
      let columnheaders = within(table).getAllByRole('columnheader');
      expect(columnheaders).toHaveLength(3);
      expect(columnheaders[0]).toHaveAttribute('aria-describedby');
      expect(columnheaders[0]).toHaveAttribute('aria-sort', 'descending');
      expect(columnheaders[1]).toHaveAttribute('aria-sort', 'none');
      expect(columnheaders[2]).not.toHaveAttribute('aria-sort');
      expect(document.getElementById(columnheaders[0].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[1]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[1].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[2]).not.toHaveAttribute('aria-describedby');

      await user.click(columnheaders[0]);

      expect(onSortChange).toHaveBeenCalledTimes(1);
      expect(onSortChange).toHaveBeenCalledWith({column: 'foo', direction: 'ascending'});
    });

    it('should trigger sorting on a different column', async function () {
      let onSortChange = jest.fn();
      let tree = render(
        <TableView aria-label="Table" sortDescriptor={{column: 'foo', direction: 'ascending'}} onSortChange={onSortChange}>
          <TableHeader>
            <Column key="foo" allowsSorting>Foo</Column>
            <Column key="bar" allowsSorting>Bar</Column>
            <Column key="baz">Baz</Column>
          </TableHeader>
          <TableBody>
            <Row>
              <Cell>Foo 1</Cell>
              <Cell>Bar 1</Cell>
              <Cell>Baz 1</Cell>
            </Row>
          </TableBody>
        </TableView>
      );

      let table = tree.getByRole('grid');
      let columnheaders = within(table).getAllByRole('columnheader');
      expect(columnheaders).toHaveLength(3);
      expect(columnheaders[0]).toHaveAttribute('aria-sort', 'ascending');
      expect(columnheaders[1]).toHaveAttribute('aria-sort', 'none');
      expect(columnheaders[2]).not.toHaveAttribute('aria-sort');
      expect(columnheaders[0]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[0].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[1]).toHaveAttribute('aria-describedby');
      expect(document.getElementById(columnheaders[1].getAttribute('aria-describedby'))).toHaveTextContent('sortable column');
      expect(columnheaders[2]).not.toHaveAttribute('aria-describedby');

      await user.click(columnheaders[1]);

      expect(onSortChange).toHaveBeenCalledTimes(1);
      expect(onSortChange).toHaveBeenCalledWith({column: 'bar', direction: 'ascending'});
    });
  });

  describe('empty state', function () {
    it('should display an empty state when there are no items', async function () {
      let tree = render(
        <TableView aria-label="Table" renderEmptyState={() => <h3>No results</h3>}>
          <TableHeader>
            <Column key="foo">Foo</Column>
            <Column key="bar">Bar</Column>
          </TableHeader>
          <TableBody>
            {[]}
          </TableBody>
        </TableView>
      );

      await act(() => Promise.resolve()); // wait for MutationObserver in useHasTabbableChild or we get act warnings

      let table = tree.getByRole('grid');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(2);
      expect(rows[1]).toHaveAttribute('aria-rowindex', '2');

      let cell = within(rows[1]).getByRole('rowheader');
      expect(cell).toHaveAttribute('aria-colspan', '2');

      let heading = within(cell).getByRole('heading');
      expect(heading).toBeVisible();
      expect(heading).toHaveTextContent('No results');

      rerender(tree, defaultTable);
      act(() => jest.runAllTimers());

      rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);
      expect(heading).not.toBeInTheDocument();
    });

    it('empty table select all should be disabled', async function () {
      let onSelectionChange = jest.fn();
      let tree = render(
        <div>
          <TableView aria-label="Table" selectionMode="multiple" onSelectionChange={onSelectionChange} renderEmptyState={() => <h3>No results</h3>}>
            <TableHeader>
              <Column key="foo">Foo</Column>
              <Column key="bar">Bar</Column>
            </TableHeader>
            <TableBody>
              {[]}
            </TableBody>
          </TableView>
          <input />
        </div>
      );

      await act(() => Promise.resolve());

      let table = tree.getByRole('grid');
      let selectAll = tree.getByRole('checkbox');

      await user.tab();
      expect(document.activeElement).toBe(table);
      await user.tab();
      expect(document.activeElement).not.toBe(selectAll);
      expect(selectAll).toHaveAttribute('disabled');
    });

    it('should allow the user to tab into the table body', async function () {
      let tree = render(<EmptyStateTable />);
      await act(() => Promise.resolve());
      let toggleButton = tree.getAllByRole('button')[0];
      let link = tree.getByRole('link');

      await user.tab();
      expect(document.activeElement).toBe(toggleButton);
      await user.tab();
      expect(document.activeElement).toBe(link);
    });

    it('should disable keyboard navigation within the table', async function () {
      let tree = render(<EmptyStateTable />);
      await act(() => Promise.resolve());
      let table = tree.getByRole('grid');
      let header = within(table).getAllByRole('columnheader')[2];
      expect(header).toHaveAttribute('tabindex', '-1');
      let headerButton = within(header).getByRole('button');
      expect(headerButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('should shift focus to the table if table becomes empty via column sort', function () {
      let tree = render(<ColumnHeaderFocusRingTable />);
      let rows = tree.getAllByRole('row');
      expect(rows).toHaveLength(3);
      focusCell(tree, 'Height');
      expect(document.activeElement).toHaveTextContent('Height');
      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      act(() => jest.advanceTimersByTime(500));
      let table = tree.getByRole('grid');
      expect(document.activeElement).toBe(table);
      // Run the rest of the timeout and run the transitions
      act(() => {jest.runAllTimers();});
      act(() => {jest.runAllTimers();});
      rows = tree.getAllByRole('row');
      expect(rows).toHaveLength(2);
    });

    it('should disable press interactions with the column headers', async function () {
      let tree = render(<EmptyStateTable />);
      await act(() => Promise.resolve());
      let table = tree.getByRole('grid');
      let headers = within(table).getAllByRole('columnheader');
      let toggleButton = tree.getAllByRole('button')[0];

      await user.tab();
      expect(document.activeElement).toBe(toggleButton);

      let columnButton = within(headers[2]).getByRole('button');
      await user.click(columnButton);
      expect(document.activeElement).toBe(toggleButton);
      expect(tree.queryByRole('menuitem')).toBeFalsy();
      fireEvent.mouseEnter(headers[2]);
      act(() => {jest.runAllTimers();});
      expect(tree.queryByRole('slider')).toBeFalsy();
    });

    it.skip('should re-enable functionality when the table recieves items', async function () {
      let tree = render(<EmptyStateTable />);
      let table = tree.getByRole('grid');
      let headers = within(table).getAllByRole('columnheader');
      let toggleButton = tree.getAllByRole('button')[0];
      let selectAll = tree.getByRole('checkbox');

      await user.tab();
      expect(document.activeElement).toBe(toggleButton);
      await user.click(toggleButton);
      act(() => {jest.runAllTimers();});

      expect(selectAll).not.toHaveAttribute('disabled');
      await user.click(selectAll);
      act(() => {jest.runAllTimers();});
      expect(selectAll.checked).toBeTruthy();
      expect(document.activeElement).toBe(selectAll);

      fireEvent.mouseEnter(headers[2]);
      act(() => {jest.runAllTimers();});
      expect(tree.queryAllByRole('slider')).toBeTruthy();

      let column1Button = within(headers[1]).getByRole('button');
      let column2Button = within(headers[2]).getByRole('button');
      await user.click(column2Button);
      act(() => {jest.runAllTimers();});
      expect(tree.queryAllByRole('menuitem')).toBeTruthy();
      await user.keyboard('{Escape}');
      act(() => {jest.runAllTimers();});
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(column2Button);
      await user.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(column1Button);

      await user.click(toggleButton);
      act(() => {jest.runAllTimers();});
      expect(selectAll).toHaveAttribute('disabled');
      await user.click(headers[2]);
      expect(document.activeElement).toBe(toggleButton);
      await user.tab();
      expect(document.activeElement).toBe(table);
      expect(table).toHaveAttribute('tabIndex', '0');
    });
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
          <Provider theme={theme}>
            <TableView aria-label="Table">
              <TableHeader>
                <Column>Foo</Column>
                <Column>Bar</Column>
                <Column>Baz</Column>
              </TableHeader>
              <TableBody>
                <Row href="https://google.com">
                  <Cell>Foo 1</Cell>
                  <Cell>Bar 1</Cell>
                  <Cell>Baz 1</Cell>
                </Row>
                <Row href="https://adobe.com">
                  <Cell>Foo 2</Cell>
                  <Cell>Bar 2</Cell>
                  <Cell>Baz 2</Cell>
                </Row>
              </TableBody>
            </TableView>
          </Provider>
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

      it.each(['single', 'multiple'])('should support links with selectionStyle="checkbox" selectionMode="%s"', async function (selectionMode) {
        let {getAllByRole} = render(
          <Provider theme={theme}>
            <TableView aria-label="Table" selectionMode={selectionMode}>
              <TableHeader>
                <Column>Foo</Column>
                <Column>Bar</Column>
                <Column>Baz</Column>
              </TableHeader>
              <TableBody>
                <Row href="https://google.com">
                  <Cell>Foo 1</Cell>
                  <Cell>Bar 1</Cell>
                  <Cell>Baz 1</Cell>
                </Row>
                <Row href="https://adobe.com">
                  <Cell>Foo 2</Cell>
                  <Cell>Bar 2</Cell>
                  <Cell>Baz 2</Cell>
                </Row>
              </TableBody>
            </TableView>
          </Provider>
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
        document.removeEventListener('click', onClick);
      });

      it.each(['single', 'multiple'])('should support links with selectionStyle="highlight" selectionMode="%s"', async function (selectionMode) {
        let {getAllByRole} = render(
          <Provider theme={theme}>
            <TableView aria-label="Table" selectionMode={selectionMode} selectionStyle="highlight">
              <TableHeader>
                <Column>Foo</Column>
                <Column>Bar</Column>
                <Column>Baz</Column>
              </TableHeader>
              <TableBody>
                <Row href="https://google.com">
                  <Cell>Foo 1</Cell>
                  <Cell>Bar 1</Cell>
                  <Cell>Baz 1</Cell>
                </Row>
                <Row href="https://adobe.com">
                  <Cell>Foo 2</Cell>
                  <Cell>Bar 2</Cell>
                  <Cell>Baz 2</Cell>
                </Row>
              </TableBody>
            </TableView>
          </Provider>
        );

        let items = getAllByRole('row').slice(1);
        for (let item of items) {
          expect(item.tagName).not.toBe('A');
          expect(item).toHaveAttribute('data-href');
        }

        let onClick = mockClickDefault();
        await trigger(items[0], ' ');
        expect(onClick).not.toHaveBeenCalled();
        expect(items[0]).toHaveAttribute('aria-selected', 'true');
        document.removeEventListener('click', onClick);

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

      it('should work with RouterProvider', async () => {
        let navigate = jest.fn();
        let {getAllByRole} = render(
          <Provider theme={theme} router={{navigate}}>
            <TableView aria-label="Table">
              <TableHeader>
                <Column>Foo</Column>
                <Column>Bar</Column>
                <Column>Baz</Column>
              </TableHeader>
              <TableBody>
                <Row href="/one" routerOptions={{foo: 'bar'}}>
                  <Cell>Foo 1</Cell>
                  <Cell>Bar 1</Cell>
                  <Cell>Baz 1</Cell>
                </Row>
                <Row href="https://adobe.com">
                  <Cell>Foo 2</Cell>
                  <Cell>Bar 2</Cell>
                  <Cell>Baz 2</Cell>
                </Row>
              </TableBody>
            </TableView>
          </Provider>
        );

        let items = getAllByRole('row').slice(1);
        await trigger(items[0]);
        expect(navigate).toHaveBeenCalledWith('/one', {foo: 'bar'});

        navigate.mockReset();
        let onClick = mockClickDefault();

        await trigger(items[1]);
        expect(navigate).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalledTimes(1);
      });
    });
  });
};

describe('TableView', tableTests);

describe('TableView with expandable rows flag on', function () {
  beforeAll(() => {
    enableTableNestedRows();
  });

  tableTests();
});
