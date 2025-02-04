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

jest.mock('@react-aria/live-announcer');
jest.mock('@react-aria/utils/src/scrollIntoView');
import {
  act,
  fireEvent,
  installPointerEvent,
  pointerMap,
  render as renderComponent,
  within
} from '@react-spectrum/test-utils-internal';
import {announce} from '@react-aria/live-announcer';
import {composeStories} from '@storybook/react';
import {enableTableNestedRows} from '@react-stately/flags';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {Scale} from '@react-types/provider';
import {scrollIntoView} from '@react-aria/utils';
import * as stories from '../stories/TreeGridTable.stories';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

let {
  StaticExpandableRows: StaticExpandableTable,
  DynamicExpandableRowsStory: DynamicExpandableTable,
  ManyExpandableRowsStory: ManyRowsExpandableTable,
  EmptyTreeGridStory: EmptyStateTable,
  LoadingTreeGridStory: LoadingTable,
  UserSetRowHeader: UserSetRowHeaderTable
} = composeStories(stories);

let onSelectionChange = jest.fn();
let onExpandedChange = jest.fn();
let onAction = jest.fn();

let getCell = (tree, text) => {
  // Find by text, then go up to the element with the cell role.
  let el = tree.getByText(text);
  while (el && !/gridcell|rowheader|columnheader/.test(el.getAttribute('role'))) {
    el = el.parentElement;
  }

  return el;
};

let focusCell = (tree, text) => act(() => getCell(tree, text).focus());
let moveFocus = (key, opts = {}) => {
  fireEvent.keyDown(document.activeElement!, {key, ...opts});
  fireEvent.keyUp(document.activeElement!, {key, ...opts});
};

let render = (children, scale = 'medium' as Scale, locale = 'en-US') => {
  let tree = renderComponent(
    <Provider theme={theme} scale={scale} locale={locale}>
      {children}
    </Provider>
  );

  act(() => {jest.runAllTimers();});
  return tree;
};

let rerender = (tree, children, scale = 'medium' as Scale) => {
  let newTree = tree.rerender(
    <Provider theme={theme} scale={scale}>
      {children}
    </Provider>
  );
  act(() => {jest.runAllTimers();});
  return newTree;
};


describe('TableView with expandable rows', function () {
  let user;
  let shiftClick = async (node) => {
    await user.keyboard('{Shift>}');
    await user.click(node);
    await user.keyboard('{/Shift}');
  };

  beforeAll(function () {
    jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    jest.useFakeTimers();
    user = userEvent.setup({delay: null, pointerMap});
    enableTableNestedRows();
  });

  afterEach(() => {
    jest.clearAllMocks();
    act(() => {jest.runAllTimers();});
  });

  afterAll(function () {
    jest.restoreAllMocks();
  });

  it.each`
    Name                 | Component
    ${'static'}          | ${StaticExpandableTable}
    ${'dynamic'}         | ${DynamicExpandableTable}
  `('renders a $Name expandable rows table', ({Component}) => {
    let {getByRole} = render(<Component UNSTABLE_expandedKeys="all" />);

    let treegrid = getByRole('treegrid');
    expect(treegrid).toBeVisible();

    expect(treegrid).toHaveAttribute('aria-rowcount', '5');
    expect(treegrid).toHaveAttribute('aria-colcount', '3');

    let rowgroups = within(treegrid).getAllByRole('rowgroup');
    expect(rowgroups).toHaveLength(2);

    let headerRows = within(rowgroups[0]).getAllByRole('row');
    expect(headerRows).toHaveLength(1);
    expect(headerRows[0]).not.toHaveAttribute('aria-rowindex');

    let headers = within(treegrid).getAllByRole('columnheader');
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

    // First row
    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(4);
    let row = rows[0];
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(row).toHaveAttribute('aria-level', '1');
    expect(row).toHaveAttribute('aria-posinset', '1');
    expect(row).toHaveAttribute('aria-setsize', '1');
    expect(row).not.toHaveAttribute('aria-rowindex');

    let rowheader = within(row).getByRole('rowheader');
    let cellSpan = within(rowheader).getByText('Lvl 1 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 1 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    let cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveAttribute('aria-colindex', '2');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');

    // first child Row
    row = rows[1];
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(row).toHaveAttribute('aria-level', '2');
    expect(row).toHaveAttribute('aria-posinset', '1');
    expect(row).toHaveAttribute('aria-setsize', '2');
    expect(row).not.toHaveAttribute('aria-rowindex');

    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 2 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 2 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveAttribute('aria-colindex', '2');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');

    // child of child Row
    row = rows[2];
    expect(row).not.toHaveAttribute('aria-expanded');
    expect(row).toHaveAttribute('aria-level', '3');
    expect(row).toHaveAttribute('aria-posinset', '1');
    expect(row).toHaveAttribute('aria-setsize', '1');
    expect(row).not.toHaveAttribute('aria-rowindex');

    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 3 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 3 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveAttribute('aria-colindex', '2');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');

    // 2nd child Row of original top level row
    row = rows[3];
    expect(row).not.toHaveAttribute('aria-expanded');
    expect(row).toHaveAttribute('aria-level', '2');
    expect(row).toHaveAttribute('aria-posinset', '2');
    expect(row).toHaveAttribute('aria-setsize', '2');
    expect(row).not.toHaveAttribute('aria-rowindex');

    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 2 Foo 2');
    expect(rowheader).toHaveTextContent('Lvl 2 Foo 2');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveAttribute('aria-colindex', '2');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
  });

  it.each`
    Name                 | Component
    ${'static'}          | ${StaticExpandableTable}
    ${'dynamic'}         | ${DynamicExpandableTable}
  `('renders a $Name expandable rows table with selection', ({Component}) => {
    let {getByRole} = render(<Component UNSTABLE_expandedKeys="all" selectionMode="multiple" />);

    let treegrid = getByRole('treegrid');
    expect(treegrid).toHaveAttribute('aria-multiselectable', 'true');
    expect(treegrid).toHaveAttribute('aria-colcount', '4');

    let rowgroups = within(treegrid).getAllByRole('rowgroup');
    expect(rowgroups).toHaveLength(2);

    let headers = within(treegrid).getAllByRole('columnheader');
    expect(headers).toHaveLength(4);
    expect(headers[0]).toHaveAttribute('aria-colindex', '1');
    expect(headers[1]).toHaveAttribute('aria-colindex', '2');
    expect(headers[2]).toHaveAttribute('aria-colindex', '3');
    expect(headers[3]).toHaveAttribute('aria-colindex', '4');

    let checkbox = within(headers[0]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select All');

    // First row
    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(4);
    let row = rows[0];

    let rowheader = within(row).getByRole('rowheader');
    let cellSpan = within(rowheader).getByText('Lvl 1 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 1 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    checkbox = within(row).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    let cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveAttribute('aria-colindex', '1');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '4');

    // first child Row
    row = rows[1];
    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 2 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 2 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    checkbox = within(row).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveAttribute('aria-colindex', '1');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '4');

    // child of child Row
    row = rows[2];
    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 3 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 3 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveAttribute('aria-colindex', '1');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '4');

    // 2nd child Row of original top level row
    row = rows[3];
    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 2 Foo 2');
    expect(rowheader).toHaveTextContent('Lvl 2 Foo 2');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveAttribute('aria-colindex', '1');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '4');
  });

  it('shouldn\'t render a child row if its parent isn\'t included in the expanded keys', function () {
    let treegrid = render(<DynamicExpandableTable UNSTABLE_expandedKeys={['Lvl 2 Foo 1']} />);
    let rowgroups = treegrid.getAllByRole('rowgroup');
    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContainElement(getCell(treegrid, 'Lvl 1 Foo 1'));
    rerender(treegrid, <DynamicExpandableTable UNSTABLE_expandedKeys={['Lvl 2 Foo 1', 'Lvl 1 Foo 1']} />);
    rowgroups = treegrid.getAllByRole('rowgroup');
    rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(4);
  });

  it('should place the chevron cell on the first row header', function () {
    let treegrid = render(<UserSetRowHeaderTable UNSTABLE_expandedKeys="all" />);
    let rowgroups = treegrid.getAllByRole('rowgroup');
    let rows = within(rowgroups[1]).getAllByRole('row');
    for (let i = 0; i < 2; i++) {
      let row = rows[i];
      let rowheaders =  within(row).getAllByRole('rowheader');
      expect(rowheaders).toHaveLength(2);
      let rowheader = rowheaders[0];
      let chevron = within(rowheader).getByRole('button');
      expect(chevron).toBeTruthy();
      expect(chevron).toHaveAttribute('aria-label', 'Collapse');
      expect(rowheader).toHaveAttribute('aria-colindex', '2');
    }
  });

  describe('collapsing and expanding rows', function () {
    describe('with press', function () {
      it('should expand a row when pressing the chevron', async function () {
        let treegrid = render(<StaticExpandableTable onSelectionChange={onSelectionChange} UNSTABLE_onExpandedChange={onExpandedChange} />);
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        expect(rows).toHaveLength(3);
        let thirdRow = rows[2];
        expect(thirdRow).toHaveAttribute('aria-level', '2');
        expect(thirdRow).toHaveAttribute('aria-posinset', '2');
        expect(thirdRow).toHaveAttribute('aria-setsize', '2');
        expect(thirdRow).toHaveTextContent('Lvl 2 Foo 2');

        let rowToExpand = rows[1];
        expect(rowToExpand).toHaveAttribute('aria-expanded', 'false');
        let chevron = within(rowToExpand).getByRole('button');
        expect(chevron).toBeTruthy();
        expect(chevron).toHaveAttribute('aria-label', 'Expand');
        await user.click(chevron);
        act(() => jest.runAllTimers());

        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(new Set(onExpandedChange.mock.calls[0][0])).toEqual(new Set(['child row 1 level 2', 'row 1']));
        rowgroups = treegrid.getAllByRole('rowgroup');
        rows = within(rowgroups[1]).getAllByRole('row');
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(chevron).toHaveAttribute('aria-label', 'Collapse');
        expect(rows).toHaveLength(4);
        rowToExpand = rows[1];
        expect(rowToExpand).toHaveAttribute('aria-expanded', 'true');

        thirdRow = rows[2];
        expect(thirdRow).toHaveAttribute('aria-level', '3');
        expect(thirdRow).toHaveAttribute('aria-posinset', '1');
        expect(thirdRow).toHaveAttribute('aria-setsize', '1');
        expect(thirdRow).toHaveTextContent('Lvl 3 Foo 1');

        let fourthRow = rows[3];
        expect(fourthRow).toHaveAttribute('aria-level', '2');
        expect(fourthRow).toHaveAttribute('aria-posinset', '2');
        expect(fourthRow).toHaveAttribute('aria-setsize', '2');
        expect(fourthRow).toHaveTextContent('Lvl 2 Foo 2');
      });

      it('should collapse a row when pressing the chevron', async function () {
        let treegrid = render(<StaticExpandableTable onSelectionChange={onSelectionChange} UNSTABLE_onExpandedChange={onExpandedChange} />);
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        expect(rows).toHaveLength(3);

        let rowToCollapse = rows[0];
        expect(rowToCollapse).toHaveAttribute('aria-level', '1');
        expect(rowToCollapse).toHaveAttribute('aria-posinset', '1');
        expect(rowToCollapse).toHaveAttribute('aria-setsize', '1');
        expect(rowToCollapse).toHaveTextContent('Lvl 1 Foo 1');
        expect(rowToCollapse).toHaveAttribute('aria-expanded', 'true');
        let chevron = within(rowToCollapse).getByRole('button');
        expect(chevron).toBeTruthy();
        expect(chevron).toHaveAttribute('aria-label', 'Collapse');
        await user.click(chevron);
        act(() => jest.runAllTimers());

        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(new Set(onExpandedChange.mock.calls[0][0])).toEqual(new Set());
        rowgroups = treegrid.getAllByRole('rowgroup');
        rows = within(rowgroups[1]).getAllByRole('row');
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(chevron).toHaveAttribute('aria-label', 'Expand');
        expect(rows).toHaveLength(1);
        rowToCollapse = rows[0];
        expect(rowToCollapse).toHaveAttribute('aria-level', '1');
        expect(rowToCollapse).toHaveAttribute('aria-posinset', '1');
        expect(rowToCollapse).toHaveAttribute('aria-setsize', '1');
        expect(rowToCollapse).toHaveTextContent('Lvl 1 Foo 1');
        expect(rowToCollapse).toHaveAttribute('aria-expanded', 'false');
      });
    });

    describe('with keyboard', function () {
      it.each`
        Arrow                 | Locale
        ${'ArrowRight'}       | ${'en-US'}
        ${'ArrowLeft'}        | ${'ar-AE'}
      `('should expand a row via $Arrow if focus is on the row ($Locale)', ({Arrow, Locale}) => {
        let labels = {
          'en-US': {
            'expand': 'Expand',
            'collapse': 'Collapse'
          },
          'ar-AE': {
            'expand': 'مد',
            'collapse': 'طي'
          }
        };
        let treegrid = render(<StaticExpandableTable onSelectionChange={onSelectionChange} UNSTABLE_onExpandedChange={onExpandedChange} />, undefined, Locale);
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        expect(rows).toHaveLength(3);
        let thirdRow = rows[2];
        expect(thirdRow).toHaveAttribute('aria-level', '2');
        expect(thirdRow).toHaveAttribute('aria-posinset', '2');
        expect(thirdRow).toHaveAttribute('aria-setsize', '2');
        expect(thirdRow).toHaveTextContent('Lvl 2 Foo 2');

        let rowToExpand = rows[1];
        expect(rowToExpand).toHaveAttribute('aria-expanded', 'false');
        let chevron = within(rowToExpand).getByRole('button');
        expect(chevron).toBeTruthy();
        expect(chevron).toHaveAttribute('aria-label', labels[Locale]['expand']);

        focusCell(treegrid, 'Lvl 2 Foo 1');
        moveFocus(Arrow);
        act(() => jest.runAllTimers());
        expect(onExpandedChange).not.toHaveBeenCalled();

        act(() => {rowToExpand.focus();});
        moveFocus(Arrow);
        act(() => jest.runAllTimers());

        expect(document.activeElement).toBe(rowToExpand);
        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(new Set(onExpandedChange.mock.calls[0][0])).toEqual(new Set(['child row 1 level 2', 'row 1']));
        rowgroups = treegrid.getAllByRole('rowgroup');
        rows = within(rowgroups[1]).getAllByRole('row');
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(chevron).toHaveAttribute('aria-label', labels[Locale]['collapse']);
        expect(rows).toHaveLength(4);
        rowToExpand = rows[1];
        expect(rowToExpand).toHaveAttribute('aria-expanded', 'true');

        thirdRow = rows[2];
        expect(thirdRow).toHaveAttribute('aria-level', '3');
        expect(thirdRow).toHaveAttribute('aria-posinset', '1');
        expect(thirdRow).toHaveAttribute('aria-setsize', '1');
        expect(thirdRow).toHaveTextContent('Lvl 3 Foo 1');

        let fourthRow = rows[3];
        expect(fourthRow).toHaveAttribute('aria-level', '2');
        expect(fourthRow).toHaveAttribute('aria-posinset', '2');
        expect(fourthRow).toHaveAttribute('aria-setsize', '2');
        expect(fourthRow).toHaveTextContent('Lvl 2 Foo 2');
      });

      it.each`
        Arrow                | Locale
        ${'ArrowLeft'}       | ${'en-US'}
        ${'ArrowRight'}      | ${'ar-AE'}
      `('should collapse a row via $Arrow if focus is on the row ($Locale)', ({Arrow, Locale}) => {
        let labels = {
          'en-US': {
            'expand': 'Expand',
            'collapse': 'Collapse'
          },
          'ar-AE': {
            'expand': 'مد',
            'collapse': 'طي'
          }
        };
        let treegrid = render(<StaticExpandableTable onSelectionChange={onSelectionChange} UNSTABLE_onExpandedChange={onExpandedChange} />, undefined, Locale);
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        expect(rows).toHaveLength(3);

        let rowToCollapse = rows[0];
        expect(rowToCollapse).toHaveAttribute('aria-level', '1');
        expect(rowToCollapse).toHaveAttribute('aria-posinset', '1');
        expect(rowToCollapse).toHaveAttribute('aria-setsize', '1');
        expect(rowToCollapse).toHaveTextContent('Lvl 1 Foo 1');
        expect(rowToCollapse).toHaveAttribute('aria-expanded', 'true');
        let chevron = within(rowToCollapse).getByRole('button');
        expect(chevron).toBeTruthy();
        expect(chevron).toHaveAttribute('aria-label', labels[Locale]['collapse']);

        focusCell(treegrid, 'Lvl 1 Foo 1');
        moveFocus(Arrow);
        act(() => jest.runAllTimers());
        expect(onExpandedChange).not.toHaveBeenCalled();

        act(() => {rowToCollapse.focus();});
        moveFocus(Arrow);
        act(() => jest.runAllTimers());

        expect(document.activeElement).toBe(rowToCollapse);
        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(new Set(onExpandedChange.mock.calls[0][0])).toEqual(new Set());
        rowgroups = treegrid.getAllByRole('rowgroup');
        rows = within(rowgroups[1]).getAllByRole('row');
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(chevron).toHaveAttribute('aria-label', labels[Locale]['expand']);
        expect(rows).toHaveLength(1);
        rowToCollapse = rows[0];
        expect(rowToCollapse).toHaveAttribute('aria-level', '1');
        expect(rowToCollapse).toHaveAttribute('aria-posinset', '1');
        expect(rowToCollapse).toHaveAttribute('aria-setsize', '1');
        expect(rowToCollapse).toHaveTextContent('Lvl 1 Foo 1');
        expect(rowToCollapse).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('keyboard focus', function () {
    describe('ArrowDown', function () {
      it('should move focus to the nested row\'s below', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[1].focus();});
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[2]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[3]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 3, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[4]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 2, Lvl 1, Foo'));
      });

      it('should move focus to the nested row\'s cell below', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" />);
        focusCell(treegrid, 'Row 1, Lvl 1, Foo');
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 3, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 2, Lvl 1, Foo'));
      });

      it('should move focus to the cell below a column header', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" />);
        focusCell(treegrid, 'Bar');
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 1, Bar'));
      });

      it('should allow the user to focus disabled nested rows', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" disabledKeys={['Row 1 Lvl 2']} />);
        focusCell(treegrid, 'Row 1, Lvl 1, Foo');
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });

      it('should skip child rows of non-expanded parent rows', function () {
        // Only one child level of Row 1 and Row 3 should be exposed, otherwise only the top level rows are rendered
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys={['Row 1 Lvl 1', 'Row 3 Lvl 1']} />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[1].focus();});
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[2]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[3]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 2, Lvl 1, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[4]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 3, Lvl 1, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[5]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 3, Lvl 2, Foo'));
      });
    });

    describe('ArrowUp', function () {
      it('should move focus to the nested row\'s above', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[4].focus();});
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[3]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 3, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[2]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[1]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
      });

      it('should move focus to the nested row\'s cell above', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" />);
        focusCell(treegrid, 'Row 2, Lvl 1, Foo');
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 3, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
      });

      it('should move focus to the column header above a cell in the first row ', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" />);
        focusCell(treegrid, 'Row 1, Lvl 1, Bar');
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Bar'));
      });

      it('should move focus to the column header above the first row', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[1].focus();});
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Foo'));
      });

      it('should allow the user to focus disabled nested rows', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" disabledKeys={['Row 1 Lvl 2']} />);
        focusCell(treegrid, 'Row 1, Lvl 3, Foo');
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });

      it('should skip child rows of non-expanded parent rows', function () {
        // Only one child level of Row 1 and Row 3 should be exposed, otherwise only the top level rows are rendered
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys={['Row 1 Lvl 1', 'Row 3 Lvl 1']} />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[5].focus();});
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[4]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 3, Lvl 1, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[3]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 2, Lvl 1, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[2]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });
    });

    describe('ArrowRight', function () {
      it('should properly wrap focus with ArrowRight', function () {
        let treegrid = render(<ManyRowsExpandableTable />);
        let row = treegrid.getAllByRole('row')[2];
        focusCell(treegrid, 'Row 1, Lvl 2, Foo');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Bar'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Baz'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(row);
        expect(row).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });

      it('should properly wrap focus with ArrowRight (RTL)', function () {
        let treegrid = render(<ManyRowsExpandableTable />, undefined, 'ar-AE');
        let row = treegrid.getAllByRole('row')[2];
        focusCell(treegrid, 'Row 1, Lvl 2, Foo');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(row);
        expect(row).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        // Focus doesn't move because Arrow Right on the row will collapse it
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(row);
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Baz'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Bar'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });
    });

    describe('ArrowLeft', function () {
      it('should properly wrap focus with ArrowLeft', function () {
        let treegrid = render(<ManyRowsExpandableTable />);
        let row = treegrid.getAllByRole('row')[2];
        focusCell(treegrid, 'Row 1, Lvl 2, Foo');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(row);
        expect(row).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        // Focus doesn't move because Arrow Left on the row will collapse it here
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(row);
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Baz'));
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Bar'));
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });

      it('should properly wrap focus with ArrowLeft (RTL)', function () {
        let treegrid = render(<ManyRowsExpandableTable />, undefined, 'ar-AE');
        let row = treegrid.getAllByRole('row')[2];
        focusCell(treegrid, 'Row 1, Lvl 2, Foo');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Bar'));
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Baz'));
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(row);
        expect(row).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });
    });

    describe('End', function () {
      it('should focus the last nested row with End', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[1].focus();});
        moveFocus('End');
        rows = treegrid.getAllByRole('row');
        expect(document.activeElement).toBe(rows.at(-1));
        expect(document.activeElement).toHaveTextContent('Row 19, Lvl 3, Foo');
      });
    });

    describe('Home', function () {
      it('should focus the first row from a nested row with Home', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[15].focus();});
        expect(document.activeElement).toHaveTextContent('Row 5, Lvl 3, Foo');
        moveFocus('Home');
        expect(document.activeElement).toBe(rows[1]);
        expect(document.activeElement).toHaveTextContent('Row 1, Lvl 1, Foo');
      });
    });

    describe('PageDown', function () {
      it('should focus a nested row a page below', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[2].focus();});
        moveFocus('PageDown');
        expect(document.activeElement).toBe(treegrid.getByRole('row', {name: 'Row 9, Lvl 2, Foo'}));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(treegrid.getByRole('row', {name: 'Row 17, Lvl 2, Foo'}));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(treegrid.getByRole('row', {name: 'Row 19, Lvl 3, Foo'}));
      });
    });

    describe('PageUp', function () {
      it('should focus a nested row a page above', function () {
        let treegrid = render(<ManyRowsExpandableTable UNSTABLE_expandedKeys="all" />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[1].focus();});
        moveFocus('End');
        moveFocus('PageUp');
        expect(document.activeElement).toBe(treegrid.getByRole('row', {name: 'Row 11, Lvl 3, Foo'}));
        moveFocus('PageUp');
        expect(document.activeElement).toBe(treegrid.getByRole('row', {name: 'Row 3, Lvl 3, Foo'}));
        moveFocus('PageUp');
        expect(document.activeElement).toBe(treegrid.getByRole('row', {name: 'Row 1, Lvl 1, Foo'}));
      });
    });

    describe('type to select', function () {
      it('should focus a nested row', function () {
        let treegrid = render(<StaticExpandableTable UNSTABLE_expandedKeys="all" />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[1].focus();});
        moveFocus('L');
        moveFocus('v');
        moveFocus('l');
        moveFocus(' ');
        moveFocus('2');
        expect(document.activeElement).toBe(treegrid.getByRole('row', {name: 'Lvl 2 Foo 1'}));
      });
    });

    describe('scrolling', function () {
      it('should scroll to a cell when it is focused', function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} disabledKeys={undefined} />);
        let body = (treegrid.getByRole('treegrid').childNodes[1] as HTMLElement);

        focusCell(treegrid, 'Row 9, Lvl 1, Foo');
        expect(scrollIntoView).toHaveBeenLastCalledWith(body, document.activeElement);
      });

      it('should scroll to a nested row cell when it is focused off screen', function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} />);
        let body = (treegrid.getByRole('treegrid').childNodes[1] as HTMLElement);
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');
        act(() => cell.focus());
        expect(document.activeElement).toBe(cell);

        // When scrolling the focused item out of view, focus should remain on the item,
        // virtualizer keeps focused items from being reused
        body.scrollTop = 1000;
        body.scrollLeft = 1000;
        fireEvent.scroll(body);
        act(() => jest.runAllTimers());

        expect(body.scrollTop).toBe(1000);
        expect(document.activeElement).toBe(cell);

        // Ensure we have the correct sticky cells in the right order.
        let row = cell.closest('[role=row]');
        let cells = within(row).getAllByRole('gridcell');
        let rowHeaders = within(row).getAllByRole('rowheader');
        expect(cells).toHaveLength(3);
        expect(rowHeaders).toHaveLength(1);
        expect(cells[0]).toHaveAttribute('aria-colindex', '1'); // checkbox
        expect(rowHeaders[0]).toHaveAttribute('aria-colindex', '2'); // rowheader
        expect(rowHeaders[0]).toBe(cell);
        expect(cells[1]).toHaveAttribute('aria-colindex', '3');
        expect(cells[1]).toHaveTextContent('Row 1, Lvl 3, Bar');
        expect(cells[2]).toHaveAttribute('aria-colindex', '4');
        expect(cells[2]).toHaveTextContent('Row 1, Lvl 3, Baz');

        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        expect(within(rows[0]).getByRole('rowheader')).toHaveTextContent('Row 1, Lvl 3, Foo');
        expect(within(rows[1]).getByRole('rowheader')).toHaveTextContent('Row 9, Lvl 1, Foo');

        // Moving focus should scroll the new focused item into view
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 3, Bar'));
        expect(scrollIntoView).toHaveBeenLastCalledWith(body, document.activeElement);
      });
    });
  });

  describe('selection', function () {
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

    let pressWithKeyboard = (element, key = ' ') => {
      fireEvent.keyDown(element, {key});
      act(() => {element.focus();});
      fireEvent.keyUp(element, {key});
      act(() => jest.runAllTimers());
    };

    describe('row selection', function () {
      describe('with pointer', function () {
        it('should select a row when clicking on the chevron cell', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let chevronCell = getCell(treegrid, 'Row 1, Lvl 1, Foo');
          let chevron = within(chevronCell).getByRole('button');
          expect(chevron).toHaveAttribute('aria-label', 'Collapse');

          checkRowSelection(rows, false);
          await user.click(chevronCell);
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1'
          ]);
          checkRowSelection(rows.slice(0, 1), true);

          onSelectionChange.mockReset();
          await user.click(chevron);
          expect(onSelectionChange).not.toHaveBeenCalled();
          checkRowSelection(rows.slice(0, 1), true);
        });

        it('should select a nested row on click', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');

          checkRowSelection(rows, false);
          await user.click(cell);
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 3'
          ]);
          checkRowSelection(rows.slice(2, 3), true);
        });
      });

      describe('with keyboard', function () {
        it('should select a nested row by pressing the Enter key on a row', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          pressWithKeyboard(rows[1], 'Enter');
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 2'
          ]);
          checkRowSelection(rows.slice(1, 2), true);
          checkSelectAll(treegrid);
        });

        it('should select a nested row by pressing the Space key on a row', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          pressWithKeyboard(rows[1]);
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 2'
          ]);
          checkRowSelection(rows.slice(1, 2), true);
          checkSelectAll(treegrid);
        });

        it('should select a row by pressing the Enter key on a chevron cell', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = within(rows[0]).getByRole('checkbox');

          checkRowSelection(rows, false);
          await user.tab();
          await user.tab();
          await user.tab();
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(cell);
          await user.keyboard('{Enter}');
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1'
          ]);
          checkRowSelection(rows.slice(0, 1), true);
          checkSelectAll(treegrid);
        });

        it('should select a row by pressing the Space key on a chevron cell', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = within(rows[0]).getByRole('checkbox');

          checkRowSelection(rows, false);
          await user.tab();
          await user.tab();
          await user.tab();
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(cell);
          await user.keyboard(' ');
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1'
          ]);
          checkRowSelection(rows.slice(0, 1), true);
          checkSelectAll(treegrid);
        });
      });

      it('should select nested rows if select all checkbox is pressed', async function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
        let checkbox = treegrid.getByLabelText('Select All');
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        await user.click(checkbox);
        checkRowSelection(rows, true);
        checkSelectAll(treegrid, 'checked');
      });

      it('should not allow selection of disabled nested rows', async function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={['Row 1 Lvl 2']} onAction={undefined} />);
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let cell = getCell(treegrid, 'Row 1, Lvl 2, Foo');

        await user.click(cell);
        expect(onSelectionChange).not.toHaveBeenCalled();
        checkRowSelection(rows, false);

        let checkbox = treegrid.getByLabelText('Select All');
        await user.click(checkbox);
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(new Set(onSelectionChange.mock.calls[0][0]).has('Row 1 Lvl 2')).toBeFalsy();
        checkRowSelection([rows[1]], false);
      });
    });

    describe('range selection', function () {
      describe('with pointer', function () {
        it('should support selecting a range from a top level row to a nested row', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          await user.click(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          await shiftClick(getCell(treegrid, 'Row 2, Lvl 3, Foo'));
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3', 'Row 2 Lvl 1', 'Row 2 Lvl 2', 'Row 2 Lvl 3'
          ]);
          checkRowSelection(rows.slice(0, 6), true);
          checkRowSelection(rows.slice(6), false);
        });

        it('should support selecting a range from a nested row to a top level row', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          await user.click(getCell(treegrid, 'Row 2, Lvl 3, Foo'));
          onSelectionChange.mockReset();

          await shiftClick(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3', 'Row 2 Lvl 1', 'Row 2 Lvl 2', 'Row 2 Lvl 3'
          ]);
          checkRowSelection(rows.slice(0, 6), true);
          checkRowSelection(rows.slice(6), false);
        });

        it('should support selecting a range from a top level row to a descendent child row', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          await user.click(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          await shiftClick(getCell(treegrid, 'Row 1, Lvl 3, Foo'));
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3'
          ]);
          checkRowSelection(rows.slice(0, 3), true);
          checkRowSelection(rows.slice(3), false);
        });

        it('should support selecting a range from a nested child row to its top level row ancestor', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          await user.click(getCell(treegrid, 'Row 1, Lvl 3, Foo'));
          onSelectionChange.mockReset();

          await shiftClick(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3'
          ]);
          checkRowSelection(rows.slice(0, 3), true);
          checkRowSelection(rows.slice(3), false);
        });

        it('should not include disabled rows', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={['Row 1 Lvl 2']} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          await user.click(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          await shiftClick(getCell(treegrid, 'Row 2, Lvl 3, Foo'));
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 3', 'Row 2 Lvl 1', 'Row 2 Lvl 2', 'Row 2 Lvl 3'
          ]);
          checkRowSelection(rows.slice(0, 1), true);
          checkRowSelection(rows.slice(1, 2), false);
          checkRowSelection(rows.slice(2, 6), true);
        });
      });

      describe('with keyboard', function () {
        it('should extend a selection with Shift + ArrowDown through nested keys', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = within(rows[0]).getByRole('checkbox');

          checkRowSelection(rows, false);
          await user.tab();
          await user.tab();
          await user.tab();
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(cell);
          await user.keyboard(' ');
          onSelectionChange.mockReset();

          await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
          act(() => jest.runAllTimers());
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2'
          ]);

          onSelectionChange.mockReset();
          await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
          act(() => jest.runAllTimers());
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3'
          ]);

          onSelectionChange.mockReset();
          await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
          act(() => jest.runAllTimers());
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3', 'Row 2 Lvl 1'
          ]);

          checkRowSelection(rows.slice(0, 4), true);
          checkRowSelection(rows.slice(4), false);
        });

        it('should extend a selection with Shift + ArrowUp through nested keys', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = within(rows[3]).getByRole('checkbox');

          checkRowSelection(rows, false);
          await user.tab();
          await user.tab();
          await user.tab();
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(cell);
          await user.keyboard('{Enter}');
          onSelectionChange.mockReset();

          await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
          act(() => jest.runAllTimers());
          checkSelection(onSelectionChange, [
            'Row 2 Lvl 1', 'Row 1 Lvl 3'
          ]);

          onSelectionChange.mockReset();
          await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
          act(() => jest.runAllTimers());
          checkSelection(onSelectionChange, [
            'Row 2 Lvl 1', 'Row 1 Lvl 3', 'Row 1 Lvl 2'
          ]);

          onSelectionChange.mockReset();
          await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
          act(() => jest.runAllTimers());
          checkSelection(onSelectionChange, [
            'Row 2 Lvl 1', 'Row 1 Lvl 3', 'Row 1 Lvl 2', 'Row 1 Lvl 1'
          ]);

          checkRowSelection(rows.slice(0, 4), true);
          checkRowSelection(rows.slice(4), false);
        });

        it('should extend a selection with Ctrl + Shift + Home', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = within(rows[6]).getByRole('checkbox');

          checkRowSelection(rows, false);
          await user.tab();
          await user.tab();
          await user.tab();
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(cell);
          await user.keyboard('{Enter}');
          onSelectionChange.mockReset();

          await user.keyboard('{Shift>}{Control>}{Home}{/Control}{/Shift}');
          act(() => jest.runAllTimers());

          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3', 'Row 2 Lvl 1', 'Row 2 Lvl 2', 'Row 2 Lvl 3', 'Row 3 Lvl 1'
          ]);

          checkRowSelection(rows.slice(0, 7), true);
          checkRowSelection(rows.slice(7), false);
        });

        it('should extend a selection with Ctrl + Shift + End', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = within(rows[6]).getByRole('checkbox');

          checkRowSelection(rows, false);
          await user.tab();
          await user.tab();
          await user.tab();
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(cell);
          await user.keyboard('{Enter}');
          onSelectionChange.mockReset();

          await user.keyboard('{Shift>}{Control>}{End}{/Control}{/Shift}');
          act(() => jest.runAllTimers());

          checkRowSelection(rows.slice(6), true);
        });

        it('should extend a selection with Shift + PageDown', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = within(rows[6]).getByRole('checkbox');

          checkRowSelection(rows, false);
          await user.tab();
          await user.tab();
          await user.tab();
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(cell);
          await user.keyboard('{Enter}');
          onSelectionChange.mockReset();

          await user.keyboard('{Shift>}{PageDown}{/Shift}');
          act(() => jest.runAllTimers());

          checkSelection(onSelectionChange, [
            'Row 3 Lvl 1', 'Row 3 Lvl 2', 'Row 3 Lvl 3', 'Row 4 Lvl 1', 'Row 4 Lvl 2', 'Row 4 Lvl 3',
            'Row 5 Lvl 1', 'Row 5 Lvl 2', 'Row 5 Lvl 3', 'Row 6 Lvl 1', 'Row 6 Lvl 2', 'Row 6 Lvl 3',
            'Row 7 Lvl 1', 'Row 7 Lvl 2', 'Row 7 Lvl 3', 'Row 8 Lvl 1', 'Row 8 Lvl 2', 'Row 8 Lvl 3',
            'Row 9 Lvl 1', 'Row 9 Lvl 2', 'Row 9 Lvl 3', 'Row 10 Lvl 1', 'Row 10 Lvl 2', 'Row 10 Lvl 3',
            'Row 11 Lvl 1'
          ]);
        });

        it('should extend a selection with Shift + PageUp', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = within(rows[6]).getByRole('checkbox');

          checkRowSelection(rows, false);
          await user.tab();
          await user.tab();
          await user.tab();
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(cell);
          await user.keyboard('{Enter}');
          onSelectionChange.mockReset();

          await user.keyboard('{Shift>}{PageUp}{/Shift}');
          act(() => jest.runAllTimers());

          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3', 'Row 2 Lvl 1', 'Row 2 Lvl 2', 'Row 2 Lvl 3', 'Row 3 Lvl 1'
          ]);
        });

        it('should not include disabled rows', async function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={['Row 1 Lvl 2']} onAction={undefined} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = within(rows[0]).getByRole('checkbox');

          checkRowSelection(rows, false);
          await user.tab();
          await user.tab();
          await user.tab();
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(cell);
          await user.keyboard('{Enter}');
          onSelectionChange.mockReset();

          await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
          act(() => jest.runAllTimers());
          await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
          act(() => jest.runAllTimers());
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 3'
          ]);

          checkRowSelection(rows.slice(0, 1), true);
          checkRowSelection(rows.slice(1, 2), false);
          checkRowSelection(rows.slice(2, 3), true);
        });
      });
    });

    describe('onAction', function () {
      installPointerEvent();

      it.each`
        Name
        ${'mouse'}
        ${'touch'}
      `('should trigger onAction when clicking nested rows with $Name', async ({Name}) => {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={onAction} />);
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');
        fireEvent.pointerDown(cell, {pointerType: Name, pointerId: 1});
        fireEvent.pointerUp(cell, {pointerType: Name, pointerId: 1});
        act(() => jest.runAllTimers());
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenLastCalledWith('Row 1 Lvl 3');
        checkRowSelection([rows[2]], false);

        let checkbox = within(rows[0]).getByRole('checkbox');
        await user.click(checkbox);
        act(() => jest.runAllTimers());
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Row 1 Lvl 1']);
        checkRowSelection([rows[0]], true);
        onSelectionChange.mockReset();

        fireEvent.pointerDown(cell, {pointerType: Name, pointerId: 1});
        fireEvent.pointerUp(cell, {pointerType: Name, pointerId: 1});
        act(() => jest.runAllTimers());
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Row 1 Lvl 1', 'Row 1 Lvl 3']);
        checkRowSelection([rows[0], rows[2]], true);
      });

      it('should trigger onAction when pressing Enter', async function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={undefined} onAction={onAction} />);
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let cell = within(rows[2]).getByRole('checkbox');
        await user.tab();
        await user.tab();
        await user.tab();

        await user.keyboard('{ArrowDown}');
        await user.keyboard('{ArrowDown}');
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Enter}');
        expect(document.activeElement).toBe(cell);
        act(() => jest.runAllTimers());
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenLastCalledWith('Row 1 Lvl 3');
        checkRowSelection(rows, false);

        onAction.mockReset();
        await user.keyboard(' ');
        act(() => jest.runAllTimers());
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onAction).not.toHaveBeenCalled();
        checkRowSelection([rows[2]], true);
      });
    });

    describe('selectionStyle highlight', function () {
      installPointerEvent();

      it('should toggle selection with mouse', async function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="highlight" disabledKeys={undefined} onAction={undefined} />);
        expect(treegrid.queryByLabelText('Select All')).toBeNull();

        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');

        checkRowSelection(rows, false);
        await user.pointer({target: cell, keys: '[MouseLeft]', coords: {pressure: 0.5}});
        act(() => jest.runAllTimers());
        expect(announce).toHaveBeenLastCalledWith('Row 1, Lvl 3, Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Row 1 Lvl 3']);
        checkRowSelection([rows[2]], true);
        onSelectionChange.mockReset();

        cell = getCell(treegrid, 'Row 1, Lvl 1, Foo');
        await user.pointer({target: cell, keys: '[MouseLeft]', coords: {pressure: 0.5}});
        act(() => jest.runAllTimers());
        expect(announce).toHaveBeenLastCalledWith('Row 1, Lvl 1, Foo selected.');
        expect(announce).toHaveBeenCalledTimes(2);
        checkSelection(onSelectionChange, ['Row 1 Lvl 1']);
        checkRowSelection([rows[0]], true);
        checkRowSelection(rows.slice(1), false);
      });

      it('should toggle selection with touch', async function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="highlight" disabledKeys={undefined} onAction={undefined} />);
        expect(treegrid.queryByLabelText('Select All')).toBeNull();

        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');

        checkRowSelection(rows, false);
        await user.pointer({target: cell, keys: '[TouchA]', coords: {width: 1}});
        act(() => jest.runAllTimers());
        expect(announce).toHaveBeenLastCalledWith('Row 1, Lvl 3, Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Row 1 Lvl 3']);
        checkRowSelection([rows[2]], true);
        onSelectionChange.mockReset();

        cell = getCell(treegrid, 'Row 1, Lvl 1, Foo');
        await user.pointer({target: cell, keys: '[TouchA]', coords: {width: 1}});
        act(() => jest.runAllTimers());
        expect(announce).toHaveBeenLastCalledWith('Row 1, Lvl 1, Foo selected. 2 items selected.');
        expect(announce).toHaveBeenCalledTimes(2);
        checkSelection(onSelectionChange, ['Row 1 Lvl 1', 'Row 1 Lvl 3']);
        checkRowSelection([rows[0], rows[2]], true);
      });

      it('should support long press to enter selection mode on touch', async function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="highlight" disabledKeys={undefined} onAction={onAction} />);
        await user.click(document.body);
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let firstCell = getCell(treegrid, 'Row 1, Lvl 3, Foo');
        let secondCell = getCell(treegrid, 'Row 1, Lvl 1, Foo');

        await user.pointer({target: firstCell, keys: '[TouchA>]', coords: {width: 1}});
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).not.toHaveBeenCalled();

        act(() => jest.advanceTimersByTime(800));

        checkSelection(onSelectionChange, ['Row 1 Lvl 3']);
        checkRowSelection([rows[2]], true);
        expect(onAction).not.toHaveBeenCalled();

        await user.pointer({target: firstCell, keys: '[/TouchA]', coords: {width: 1}});
        onSelectionChange.mockReset();

        await user.pointer({target: secondCell, keys: '[TouchA]', coords: {width: 1}});
        act(() => jest.runAllTimers());
        checkSelection(onSelectionChange, ['Row 1 Lvl 1', 'Row 1 Lvl 3']);
        checkRowSelection([rows[0], rows[2]], true);

        // Deselect all to exit selection mode
        await user.pointer({target: firstCell, keys: '[TouchA]', coords: {width: 1}});
        act(() => jest.runAllTimers());
        onSelectionChange.mockReset();
        await user.pointer({target: secondCell, keys: '[TouchA]', coords: {width: 1}});
        act(() => jest.runAllTimers());
        checkSelection(onSelectionChange, []);
        expect(onAction).not.toHaveBeenCalled();
        checkRowSelection(rows, false);
      });

      it('should support double click to perform onAction with mouse', async function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="highlight" disabledKeys={undefined} onAction={onAction} />);
        expect(treegrid.queryByLabelText('Select All')).toBeNull();

        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');

        checkRowSelection(rows, false);
        await user.pointer({target: cell, keys: '[MouseLeft]', coords: {pressure: 0.5}});
        act(() => jest.runAllTimers());
        expect(announce).toHaveBeenLastCalledWith('Row 1, Lvl 3, Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Row 1 Lvl 3']);
        expect(onAction).not.toHaveBeenCalled();
        onSelectionChange.mockReset();
        await user.pointer({target: cell, keys: '[MouseLeft][MouseLeft]', coords: {pressure: 0.5}});
        act(() => jest.runAllTimers());
        expect(announce).toHaveBeenCalledTimes(1);
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('Row 1 Lvl 3');
      });

      it('should support single tap to perform onAction with touch', function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="highlight" disabledKeys={undefined} onAction={onAction} />);
        expect(treegrid.queryByLabelText('Select All')).toBeNull();
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');

        fireEvent.pointerDown(cell, {pointerType: 'touch', pointerId: 1});
        fireEvent.pointerUp(cell, {pointerType: 'touch', pointerId: 1});
        act(() => jest.runAllTimers());
        expect(announce).not.toHaveBeenCalled();
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('Row 1 Lvl 3');
      });
    });
  });

  describe('empty state', function () {
    it('should display an empty state with the proper aria attributes', async function () {
      let treegrid = render(<EmptyStateTable />);
      await act(() => Promise.resolve()); // wait for MutationObserver in useHasTabbableChild or we get act warnings
      let rowgroups = treegrid.getAllByRole('rowgroup');
      let rows = within(rowgroups[1]).getAllByRole('row');
      expect(rows).toHaveLength(1);
      let row = rows[0];
      expect(row).not.toHaveAttribute('aria-expanded');
      expect(row).toHaveAttribute('aria-level', '1');
      expect(row).toHaveAttribute('aria-posinset', '1');
      expect(row).toHaveAttribute('aria-setsize', '1');

      let cell = within(rows[0]).getByRole('rowheader');
      expect(cell).toHaveAttribute('aria-colspan', '3');

      let heading = within(cell).getByRole('heading');
      expect(heading).toBeVisible();
      expect(heading).toHaveTextContent('No results');

      let showItemsButton = treegrid.getAllByRole('button')[0];
      await user.click(showItemsButton);
      act(() => jest.runAllTimers());
      rowgroups = treegrid.getAllByRole('rowgroup');
      rows = within(rowgroups[1]).getAllByRole('row');
      expect(rows).toHaveLength(19);
      expect(heading).not.toBeInTheDocument();
    });
  });

  describe('loading state', function () {
    it('should render a spinner row with the proper attributes when loading', async function () {
      let treegrid = render(<LoadingTable />);
      await act(() => Promise.resolve()); // wait for MutationObserver in useHasTabbableChild or we get act warnings
      let rowgroups = treegrid.getAllByRole('rowgroup');
      let rows = within(rowgroups[1]).getAllByRole('row');
      expect(rows).toHaveLength(1);
      let row = rows[0];
      expect(row).not.toHaveAttribute('aria-expanded');
      expect(row).toHaveAttribute('aria-level', '1');
      expect(row).toHaveAttribute('aria-posinset', '1');
      expect(row).toHaveAttribute('aria-setsize', '1');

      let cell = within(rows[0]).getByRole('rowheader');
      expect(cell).toHaveAttribute('aria-colspan', '3');

      let spinner = within(cell).getByRole('progressbar');
      expect(spinner).toHaveAttribute('aria-label', 'Loading…');
      expect(spinner).not.toHaveAttribute('aria-valuenow');

      let showItemsButton = treegrid.getAllByRole('button')[0];
      await user.click(showItemsButton);
      act(() => jest.runAllTimers());
      rowgroups = treegrid.getAllByRole('rowgroup');
      rows = within(rowgroups[1]).getAllByRole('row');
      expect(rows).toHaveLength(20);

      row = rows[19];
      expect(row).not.toHaveAttribute('aria-expanded');
      expect(row).toHaveAttribute('aria-level', '1');
      expect(row).toHaveAttribute('aria-posinset', '20');
      expect(row).toHaveAttribute('aria-setsize', '20');
      spinner = within(row).getByRole('progressbar');
      expect(spinner).toBeTruthy();
    });
  });
});
