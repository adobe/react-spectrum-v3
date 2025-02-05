/*
 * Copyright 2021 Adobe. All rights reserved.
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
import {act, fireEvent, installPointerEvent, mockClickDefault, pointerMap, render as renderComponent, triggerTouch, within} from '@react-spectrum/test-utils-internal';
import {ActionButton} from '@react-spectrum/button';
import {announce} from '@react-aria/live-announcer';
import {FocusExample} from '../stories/ListViewActions.stories';
import {Item, ListView} from '../src';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {renderEmptyState} from '../stories/ListView.stories';
import {scrollIntoView} from '@react-aria/utils';
import {Text} from '@react-spectrum/text';
import {theme} from '@react-spectrum/theme-default';
import {User} from '@react-aria/test-utils';
import userEvent from '@testing-library/user-event';

function pointerEvent(type, opts) {
  let evt = new Event(type, {bubbles: true, cancelable: true});
  Object.assign(evt, {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    button: opts.button || 0,
    width: 1,
    height: 1
  }, opts);
  return evt;
}

describe('ListView', function () {
  let offsetWidth, offsetHeight, scrollHeight;
  let onSelectionChange = jest.fn();
  let onAction = jest.fn();
  let user;
  let testUtilUser = new User();
  let checkSelection = (onSelectionChange, selectedKeys) => {
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(selectedKeys));
  };
  let items = [
    {key: 'foo', label: 'Foo'},
    {key: 'bar', label: 'Bar'},
    {key: 'baz', label: 'Baz'}
  ];

  let manyItems = [];
  for (let i = 1; i <= 100; i++) {
    manyItems.push({id: i, label: 'Foo ' + i});
  }

  beforeAll(function () {
    user = userEvent.setup({delay: null, pointerMap});
    offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    scrollHeight = jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 40);
    jest.useFakeTimers();
  });

  afterEach(function () {
    fireEvent.keyDown(document.activeElement, {key: 'Escape'});
    fireEvent.keyUp(document.activeElement, {key: 'Escape'});
    jest.clearAllMocks();
  });

  afterAll(function () {
    offsetWidth.mockReset();
    offsetHeight.mockReset();
    scrollHeight.mockReset();
  });

  let render = (children, locale = 'en-US', scale = 'medium') => {
    let tree = renderComponent(
      <Provider theme={theme} scale={scale} locale={locale}>
        {children}
      </Provider>
    );
    // Allow for Virtualizer layout to update
    act(() => {jest.runAllTimers();});
    return tree;
  };

  let renderList = (props = {}) => {
    let {
      locale,
      scale,
      ...otherProps
    } = props;
    return render(
      <ListView items={items} aria-label="List" {...otherProps}>
        {item => (
          <Item textValue={item.label}>
            {item.label}
          </Item>
        )}
      </ListView>,
      locale,
      scale
    );
  };

  let renderListWithFocusables = (props = {}) => {
    let {
      locale,
      scale,
      ...otherProps
    } = props;
    return render(
      <ListView items={items} aria-label="List" {...otherProps}>
        {item => (
          <Item textValue={item.label}>
            {item.label}
            <ActionButton>button1 {item.label}</ActionButton>
            <ActionButton>button2 {item.label}</ActionButton>
          </Item>
        )}
      </ListView>,
      locale,
      scale
    );
  };

  let getRow = (tree, text) => {
    // Find by text, then go up to the element with the row role.
    let el = tree.getByText(text);
    while (el && !/row/.test(el.getAttribute('role'))) {
      el = el.parentElement;
    }

    return el;
  };

  let moveFocus = (key, opts = {}) => {
    fireEvent.keyDown(document.activeElement, {key, ...opts});
    fireEvent.keyUp(document.activeElement, {key, ...opts});
  };

  let focusRow = (tree, text) => act(() => getRow(tree, text).focus());

  it('renders a static listview', function () {
    let {getByRole} = render(
      <ListView aria-label="List" data-testid="test">
        <Item>Foo</Item>
        <Item>Bar</Item>
        <Item>Baz</Item>
      </ListView>
    );

    let grid = getByRole('grid');
    let gridListTester = testUtilUser.createTester('GridList', {root: grid});

    expect(grid).toBeVisible();
    expect(grid).toHaveAttribute('aria-label', 'List');
    expect(grid).toHaveAttribute('data-testid', 'test');
    expect(grid).toHaveAttribute('aria-rowcount', '3');
    expect(grid).toHaveAttribute('aria-colcount', '1');

    let rows = gridListTester.rows;
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveAttribute('aria-rowindex', '1');
    expect(rows[1]).toHaveAttribute('aria-rowindex', '2');
    expect(rows[2]).toHaveAttribute('aria-rowindex', '3');

    let gridCells = gridListTester.cells({element: rows[0]});
    expect(gridCells).toHaveLength(1);
    expect(gridCells[0]).toHaveTextContent('Foo');
    expect(gridCells[0]).toHaveAttribute('aria-colindex', '1');
  });

  it('renders a dynamic listview', function () {
    let items = [
      {key: 'foo', label: 'Foo'},
      {key: 'bar', label: 'Bar'},
      {key: 'baz', label: 'Baz'}
    ];
    let {getByRole, getAllByRole} = render(
      <ListView items={items} aria-label="List">
        {item =>
          <Item textValue={item.key}>{item.label}</Item>
        }
      </ListView>
    );

    let grid = getByRole('grid');
    expect(grid).toBeVisible();
    expect(grid).toHaveAttribute('aria-label', 'List');
    expect(grid).toHaveAttribute('aria-rowcount', '3');
    expect(grid).toHaveAttribute('aria-colcount', '1');

    let rows = getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveAttribute('aria-rowindex', '1');
    expect(rows[1]).toHaveAttribute('aria-rowindex', '2');
    expect(rows[2]).toHaveAttribute('aria-rowindex', '3');

    let gridCells = within(rows[0]).getAllByRole('gridcell');
    expect(gridCells).toHaveLength(1);
    expect(gridCells[0]).toHaveTextContent('Foo');
    expect(gridCells[0]).toHaveAttribute('aria-colindex', '1');
  });

  it('renders a falsy ids', function () {
    let items = [
      {id: 0, label: 'Foo'},
      {id: 1, label: 'Bar'}
    ];
    let {getByRole, getAllByRole} = render(
      <ListView items={items} aria-label="List">
        {item =>
          <Item textValue={item.label}>{item.label}</Item>
        }
      </ListView>
    );

    let grid = getByRole('grid');
    expect(grid).toBeVisible();

    let rows = getAllByRole('row');
    expect(rows).toHaveLength(2);

    let gridCells = within(rows[0]).getAllByRole('gridcell');
    expect(gridCells).toHaveLength(1);
    expect(gridCells[0]).toHaveTextContent('Foo');
  });

  it('should retain focus on the pressed child', async function () {
    let tree = renderListWithFocusables();
    let button = within(getRow(tree, 'Foo')).getAllByRole('button')[1];
    await user.click(button);
    expect(document.activeElement).toBe(button);
  });

  it('should focus the row if the cell is pressed', async function () {
    let tree = renderList({selectionMode: 'single'});
    let cell = within(getRow(tree, 'Bar')).getByRole('gridcell');
    await user.click(cell);
    act(() => {
      jest.runAllTimers();
    });
    expect(document.activeElement).toBe(getRow(tree, 'Bar'));
  });

  it('should have an aria-label on the row for the row text content', function () {
    let tree = renderList();
    expect(getRow(tree, 'Foo')).toHaveAttribute('aria-label', 'Foo');
    expect(getRow(tree, 'Bar')).toHaveAttribute('aria-label', 'Bar');
    expect(getRow(tree, 'Baz')).toHaveAttribute('aria-label', 'Baz');
  });

  it('should label the checkboxes with the row label', function () {
    let tree = renderList({selectionMode: 'single'});
    let rows = tree.getAllByRole('row');
    for (let row of rows) {
      let checkbox = within(row).getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${row.id}`);
    }
  });

  it('should disable nested elements when row is disabled', function () {
    let tree = renderListWithFocusables({disabledKeys: ['foo'], selectionMode: 'multiple'});
    let row = getRow(tree, 'Foo');
    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(row).not.toHaveAttribute('aria-selected');
    expect(within(row).getByRole('checkbox')).toHaveAttribute('disabled');

    let buttons = within(row).getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('disabled');
    expect(buttons[1]).toHaveAttribute('disabled');

    row = getRow(tree, 'Bar');
    expect(row).not.toHaveAttribute('aria-disabled', 'true');
    expect(row).toHaveAttribute('aria-selected', 'false');
    expect(within(row).getByRole('checkbox')).not.toHaveAttribute('disabled');

    buttons = within(row).getAllByRole('button');
    expect(buttons[0]).not.toHaveAttribute('disabled');
    expect(buttons[1]).not.toHaveAttribute('disabled');
  });

  it('should disable nested elements with disabledBehavior="selection"', function () {
    let tree = renderListWithFocusables({disabledKeys: ['foo'], disabledBehavior: 'selection', selectionMode: 'multiple'});
    let row = getRow(tree, 'Foo');
    expect(row).not.toHaveAttribute('aria-disabled');
    expect(row).not.toHaveAttribute('aria-selected');
    expect(within(row).getByRole('checkbox')).toHaveAttribute('disabled');

    let buttons = within(row).getAllByRole('button');
    expect(buttons[0]).not.toHaveAttribute('disabled');
    expect(buttons[1]).not.toHaveAttribute('disabled');
  });

  describe('keyboard focus', function () {
    describe('Type to select', function () {
      it('focuses the correct cell when typing', async function () {
        let tree = renderList();
        let target = getRow(tree, 'Baz');
        let grid = tree.getByRole('grid');
        await user.tab();
        fireEvent.keyDown(grid, {key: 'B'});
        fireEvent.keyUp(grid, {key: 'Enter'});
        fireEvent.keyDown(grid, {key: 'A'});
        fireEvent.keyUp(grid, {key: 'A'});
        fireEvent.keyDown(grid, {key: 'Z'});
        fireEvent.keyUp(grid, {key: 'Z'});
        expect(document.activeElement).toBe(target);
      });
    });

    describe('ArrowRight', function () {
      it('should not move focus if no focusables present', async function () {
        let tree = renderList();
        let start = getRow(tree, 'Foo');
        await user.tab();
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(start);
      });

      describe('with cell focusables', function () {
        it('should move focus to next cell and back to row', async function () {
          let tree = renderListWithFocusables();
          let start = getRow(tree, 'Foo');
          let focusables = within(start).getAllByRole('button');
          await user.tab();
          moveFocus('ArrowRight');
          expect(document.activeElement).toBe(focusables[0]);
          moveFocus('ArrowRight');
          expect(document.activeElement).toBe(focusables[1]);
          moveFocus('ArrowRight');
          expect(document.activeElement).toBe(start);
        });

        it('should move focus to previous cell in RTL', async function () {
          let tree = renderListWithFocusables({locale: 'ar-AE'});
          // Should move from button two to button one
          let start = within(getRow(tree, 'Foo')).getAllByRole('button')[1];
          let end = within(getRow(tree, 'Foo')).getAllByRole('button')[0];
          // Need to press to set a modality, otherwise useSelectableCollection will think this is a tab operation
          await user.click(start);
          expect(document.activeElement).toHaveTextContent('button2 Foo');
          expect(document.activeElement).toBe(start);
          moveFocus('ArrowRight');
          expect(document.activeElement).toBe(end);
          expect(document.activeElement).toHaveTextContent('button1 Foo');
        });
      });
    });

    describe('ArrowLeft', function () {
      it('should not move focus if no focusables present', async function () {
        let tree = renderList();
        let start = getRow(tree, 'Foo');
        await user.tab();
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(start);
      });

      describe('with cell focusables', function () {
        it('should move focus to previous cell and back to row', async function () {
          let tree = renderListWithFocusables();
          let focusables = within(getRow(tree, 'Foo')).getAllByRole('button');
          let start = getRow(tree, 'Foo');
          await user.tab();
          moveFocus('ArrowLeft');
          expect(document.activeElement).toBe(focusables[1]);
          moveFocus('ArrowLeft');
          expect(document.activeElement).toBe(focusables[0]);
          moveFocus('ArrowLeft');
          expect(document.activeElement).toBe(start);
        });

        it('should move focus to next cell in RTL', async function () {
          let tree = renderListWithFocusables({locale: 'ar-AE'});
          // Should move from button one to button two
          let start = within(getRow(tree, 'Foo')).getAllByRole('button')[0];
          let end = within(getRow(tree, 'Foo')).getAllByRole('button')[1];
          // Need to press to set a modality, otherwise useSelectableCollection will think this is a tab operation
          await user.click(start);
          expect(document.activeElement).toHaveTextContent('button1 Foo');
          expect(document.activeElement).toBe(start);
          moveFocus('ArrowLeft');
          expect(document.activeElement).toBe(end);
          expect(document.activeElement).toHaveTextContent('button2 Foo');
        });
      });
    });

    describe('ArrowUp', function () {
      it('should not wrap focus', async function () {
        let tree = renderListWithFocusables();
        let start = getRow(tree, 'Foo');
        await user.tab();
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(start);
      });

      it('should move focus to above row', async function () {
        let tree = renderListWithFocusables({selectionMode: 'single'});
        let start = getRow(tree, 'Bar');
        let end = getRow(tree, 'Foo');
        await user.click(start);
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(end);
      });

      it('should skip disabled rows', async function () {
        let tree = renderListWithFocusables({disabledKeys: ['bar'], selectionMode: 'single'});
        let start = getRow(tree, 'Baz');
        let end = getRow(tree, 'Foo');
        await user.click(start);
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(end);
      });

      it('should allow focus on disabled rows with disabledBehavior="selection"', async function () {
        let tree = renderListWithFocusables({disabledKeys: ['foo'], disabledBehavior: 'selection', selectionMode: 'single'});
        let start = getRow(tree, 'Bar');
        let end = getRow(tree, 'Foo');
        await user.click(start);
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(end);
      });
    });

    describe('ArrowDown', function () {
      it('should not wrap focus', async function () {
        let tree = renderListWithFocusables({selectionMode: 'single'});
        let start = getRow(tree, 'Baz');
        await user.click(start);
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(start);
      });

      it('should move focus to below row', async function () {
        let tree = renderListWithFocusables({selectionMode: 'single'});
        let start = getRow(tree, 'Foo');
        let end = getRow(tree, 'Bar');
        await user.click(start);
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(end);
      });

      it('should skip disabled rows', async function () {
        let tree = renderListWithFocusables({disabledKeys: ['bar'], selectionMode: 'single'});
        let start = getRow(tree, 'Foo');
        let end = getRow(tree, 'Baz');
        await user.click(start);
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(end);
      });

      it('should allow focus on disabled rows with disabledBehavior="selection"', async function () {
        let tree = renderListWithFocusables({disabledKeys: ['bar'], disabledBehavior: 'selection', selectionMode: 'single'});
        let start = getRow(tree, 'Foo');
        let end = getRow(tree, 'Bar');
        await user.click(start);
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(end);
      });
    });

    describe('PageUp', function () {
      it('should move focus to a row a page above when focus starts on a row', async function () {
        let tree = renderListWithFocusables({items: manyItems, selectionMode: 'single'});
        let start = getRow(tree, 'Foo 25');
        await user.click(start);
        moveFocus('PageUp');
        expect(document.activeElement).toBe(getRow(tree, 'Foo 1'));
      });

      it('should move focus to a row a page above when focus starts in the row cell', async function () {
        let tree = renderListWithFocusables({items: manyItems});
        let focusables = within(getRow(tree, 'Foo 25')).getAllByRole('button');
        let start = focusables[0];
        await user.click(start);
        expect(document.activeElement).toBe(start);
        moveFocus('PageUp');
        expect(document.activeElement).toBe(getRow(tree, 'Foo 1'));
      });
    });

    describe('PageDown', function () {
      it('should move focus to a row a page below when focus starts on a row', async function () {
        let tree = renderListWithFocusables({items: manyItems, selectionMode: 'single'});
        tree.getByRole('grid').style.overflow = 'auto'; // make ListKeyboardDelegate know we are scrollable
        await user.tab();
        moveFocus('PageDown');
        expect(document.activeElement).toBe(getRow(tree, 'Foo 25'));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(getRow(tree, 'Foo 49'));
      });

      it('should move focus to a row a page below when focus starts in the row cell', async function () {
        let tree = renderListWithFocusables({items: manyItems});
        tree.getByRole('grid').style.overflow = 'auto'; // make ListKeyboardDelegate know we are scrollable
        let focusables = within(getRow(tree, 'Foo 1')).getAllByRole('button');
        let start = focusables[0];
        await user.click(start);
        expect(document.activeElement).toBe(start);
        moveFocus('PageDown');
        expect(document.activeElement).toBe(getRow(tree, 'Foo 25'));
        moveFocus('PageDown');
        expect(document.activeElement).toBe(getRow(tree, 'Foo 49'));
      });
    });

    describe('Home', function () {
      it('should move focus to the first row when focus starts on a row', async function () {
        let tree = renderListWithFocusables({items: manyItems, selectionMode: 'single'});
        let start = getRow(tree, 'Foo 15');
        await user.click(start);
        moveFocus('Home');
        expect(document.activeElement).toBe(getRow(tree, 'Foo 1'));
      });

      it('should move focus to the first row when focus starts in the row cell', async function () {
        let tree = renderListWithFocusables({items: manyItems});
        let focusables = within(getRow(tree, 'Foo 15')).getAllByRole('button');
        let start = focusables[0];
        await user.click(start);
        expect(document.activeElement).toBe(start);
        moveFocus('Home');
        expect(document.activeElement).toBe(getRow(tree, 'Foo 1'));
      });
    });

    describe('End', function () {
      it('should move focus to the last row when focus starts on a row', async function () {
        let tree = renderListWithFocusables({items: manyItems});
        await user.tab();
        moveFocus('End');
        expect(document.activeElement).toBe(getRow(tree, 'Foo 100'));
      });

      it('should move focus to the last row when focus starts in the row cell', async function () {
        let tree = renderListWithFocusables({items: manyItems});
        let focusables = within(getRow(tree, 'Foo 1')).getAllByRole('button');
        let start = focusables[0];
        await user.click(start);
        expect(document.activeElement).toBe(start);
        moveFocus('End');
        expect(document.activeElement).toBe(getRow(tree, 'Foo 100'));
      });
    });

    it('should move focus to the next item that is not disabled when the focused item is removed', async () => {
      let tree = render(<FocusExample />);
      let rows = tree.getAllByRole('row');
      act(() => rows[3].focus());
      expect(document.activeElement).toBe(rows[3]);
      moveFocus('ArrowRight');
      expect(document.activeElement).toBe(within(rows[3]).getByRole('button'));
      expect(rows[4]).toHaveAttribute('aria-disabled', 'true');
      await user.click(document.activeElement);
      act(() => {
        jest.runAllTimers();
      });
      rows = tree.getAllByRole('row');
      expect(document.activeElement).toBe(rows[4]);
      act(() => rows[rows.length - 1].focus());
      expect(document.activeElement).toBe(rows[rows.length - 1]);
      moveFocus('ArrowRight');
      expect(document.activeElement).toBe(within(rows[rows.length - 1]).getByRole('button'));
      await user.click(document.activeElement);
      act(() => {
        jest.runAllTimers();
      });
      rows = tree.getAllByRole('row');
      expect(document.activeElement).toBe(rows[rows.length - 1]);
      moveFocus('ArrowRight');
      expect(document.activeElement).toBe(within(rows[rows.length - 1]).getByRole('button'));
      await user.click(document.activeElement);
      act(() => {
        jest.runAllTimers();
      });
      rows = tree.getAllByRole('row');
      expect(document.activeElement).toBe(rows[rows.length - 1]);
      moveFocus('ArrowRight');
      expect(document.activeElement).toBe(within(rows[rows.length - 1]).getByRole('button'));
      await user.click(document.activeElement);
      act(() => {
        jest.runAllTimers();
      });
      rows = tree.getAllByRole('row');
      expect(document.activeElement).toBe(rows[rows.length - 1]);
      moveFocus('ArrowRight');
      expect(document.activeElement).toBe(within(rows[rows.length - 1]).getByRole('button'));
      await user.click(document.activeElement);
      act(() => {
        jest.runAllTimers();
      });
      rows = tree.getAllByRole('row');
      expect(document.activeElement).toBe(rows[rows.length - 1]);
      moveFocus('ArrowRight');
      expect(document.activeElement).toBe(within(rows[rows.length - 1]).getByRole('button'));
      await user.click(document.activeElement);
      act(() => {
        jest.runAllTimers();
      });
      rows = tree.getAllByRole('row');
      expect(document.activeElement).toBe(rows[rows.length - 2]);
      expect(rows[rows.length - 1]).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('should display loading affordance with proper height (isLoading)', function () {
    let {getAllByRole} = render(<ListView aria-label="List" loadingState="loading">{[]}</ListView>);
    let row = getAllByRole('row')[0];
    expect(row.parentNode.style.height).toBe('1000px');
    let progressbar = within(row).getByRole('progressbar');
    expect(progressbar).toBeTruthy();
  });

  it('should allow you to tab to ListView body if loading (no tabbable children)', async function () {
    let {getByRole} = render(<ListView aria-label="List" loadingState="loading">{[]}</ListView>);
    let grid = getByRole('grid');
    await user.tab();
    expect(document.activeElement).toBe(grid);
  });

  it('should display loading affordance with proper height (isLoadingMore)', function () {
    let items = [
      {key: 'foo', label: 'Foo'},
      {key: 'bar', label: 'Bar'},
      {key: 'baz', label: 'Baz'}
    ];
    let {getByRole} = render(
      <ListView items={items} aria-label="List" loadingState="loadingMore">
        {item =>
          <Item textValue={item.key}>{item.label}</Item>
        }
      </ListView>
    );
    let progressbar = getByRole('progressbar');
    expect(progressbar).toBeTruthy();
    expect(progressbar.parentNode.parentNode.parentNode.style.height).toBe('40px');
  });

  it('should render empty state', async function () {
    let {getByText} = render(<ListView aria-label="List" renderEmptyState={renderEmptyState} />);
    await act(() => Promise.resolve()); // wait for MutationObserver in useHasTabbableChild or we get act warnings
    expect(getByText('No results')).toBeTruthy();
  });

  it('should allow you to tab into ListView body if empty with link', async function () {
    let {getByRole} = render(
      <>
        <ActionButton>Toggle</ActionButton>
        <ListView aria-label="List" renderEmptyState={renderEmptyState}>{[]}</ListView>
      </>
    );
    await act(() => Promise.resolve());
    let toggleButton = getByRole('button');
    let link = getByRole('link');

    await user.tab();
    expect(document.activeElement).toBe(toggleButton);
    await user.tab();
    expect(document.activeElement).toBe(link);
  });

  it('supports custom data attributes', () => {
    let {getByRole} = render(
      <ListView aria-label="List" data-testid="test">
        <Item>Foo</Item>
        <Item>Bar</Item>
      </ListView>
    );
    let grid = getByRole('grid');
    expect(grid).toHaveAttribute('data-testid', 'test');
  });

  it('should use item description text as aria-describedby', function () {
    let {getAllByRole} = render(
      <ListView aria-label="List">
        <Item textValue="Label">
          <Text>Label</Text>
          <Text slot="description">Description</Text>
        </Item>
      </ListView>
    );

    let rows = getAllByRole('row');
    let description = within(rows[0]).getByText('Description');
    expect(rows[0]).toHaveAttribute('aria-labelledby', `${rows[0].id} ${description.id}`);
  });

  describe('selection', function () {
    let items = [
      {key: 'foo', label: 'Foo'},
      {key: 'bar', label: 'Bar'},
      {key: 'baz', label: 'Baz'}
    ];
    let renderSelectionList = (props) => render(
      <ListView items={items} aria-label="List" {...props}>
        {item => (
          <Item key={item.key} textValue={item.label}>
            {item.label}
          </Item>
        )}
      </ListView>
    );

    it('should announce the selected or deselected row', async function () {
      let onSelectionChange = jest.fn();
      let tree = renderSelectionList({onSelectionChange, selectionMode: 'single'});

      let row = tree.getAllByRole('row')[1];
      await user.click(row);
      expect(announce).toHaveBeenLastCalledWith('Bar selected.');
      expect(announce).toHaveBeenCalledTimes(1);

      await user.click(row);
      expect(announce).toHaveBeenLastCalledWith('Bar not selected.');
      expect(announce).toHaveBeenCalledTimes(2);
    });

    it('should select an item from checkbox', async function () {
      let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple'});

      let row = tree.getAllByRole('row')[1];
      expect(row).toHaveAttribute('aria-selected', 'false');
      await user.click(within(row).getByRole('checkbox'));

      checkSelection(onSelectionChange, ['bar']);
      expect(row).toHaveAttribute('aria-selected', 'true');
      expect(announce).toHaveBeenLastCalledWith('Bar selected.');
      expect(announce).toHaveBeenCalledTimes(1);
    });

    it('should select a row by pressing the Space key on a row', async function () {
      let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple'});

      let row = tree.getAllByRole('row')[0];
      await user.tab();
      expect(row).toHaveAttribute('aria-selected', 'false');
      await user.keyboard(' ');

      checkSelection(onSelectionChange, ['foo']);
      expect(row).toHaveAttribute('aria-selected', 'true');
      expect(announce).toHaveBeenLastCalledWith('Foo selected.');
      expect(announce).toHaveBeenCalledTimes(1);
    });

    it('should select a row by pressing the Enter key on a row', async function () {
      let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple'});

      let row = tree.getAllByRole('row')[0];
      await user.tab();
      expect(row).toHaveAttribute('aria-selected', 'false');
      await user.keyboard('{Enter}');

      checkSelection(onSelectionChange, ['foo']);
      expect(row).toHaveAttribute('aria-selected', 'true');
      expect(announce).toHaveBeenLastCalledWith('Foo selected.');
      expect(announce).toHaveBeenCalledTimes(1);
    });

    it('should only allow one item to be selected in single selection', async function () {
      let tree = renderSelectionList({onSelectionChange, selectionMode: 'single'});

      let rows = tree.getAllByRole('row');
      expect(rows[1]).toHaveAttribute('aria-selected', 'false');
      await user.click(within(rows[1]).getByRole('checkbox'));

      checkSelection(onSelectionChange, ['bar']);
      expect(rows[1]).toHaveAttribute('aria-selected', 'true');
      expect(announce).toHaveBeenLastCalledWith('Bar selected.');
      expect(announce).toHaveBeenCalledTimes(1);

      onSelectionChange.mockClear();
      await user.click(within(rows[2]).getByRole('checkbox'));
      checkSelection(onSelectionChange, ['baz']);
      expect(rows[1]).toHaveAttribute('aria-selected', 'false');
      expect(rows[2]).toHaveAttribute('aria-selected', 'true');
    });

    it('should allow multiple items to be selected in multiple selection', async function () {
      let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple'});

      let rows = tree.getAllByRole('row');
      expect(rows[1]).toHaveAttribute('aria-selected', 'false');
      await user.click(within(rows[1]).getByRole('checkbox'));

      checkSelection(onSelectionChange, ['bar']);
      expect(rows[1]).toHaveAttribute('aria-selected', 'true');
      expect(announce).toHaveBeenLastCalledWith('Bar selected.');
      expect(announce).toHaveBeenCalledTimes(1);

      onSelectionChange.mockClear();
      await user.click(within(rows[2]).getByRole('checkbox'));
      checkSelection(onSelectionChange, ['bar', 'baz']);
      expect(rows[1]).toHaveAttribute('aria-selected', 'true');
      expect(rows[2]).toHaveAttribute('aria-selected', 'true');
      expect(announce).toHaveBeenLastCalledWith('Baz selected. 2 items selected.');
      expect(announce).toHaveBeenCalledTimes(2);

      await user.click(within(rows[2]).getByRole('checkbox'));
      expect(announce).toHaveBeenLastCalledWith('Baz not selected. 1 item selected.');
      expect(announce).toHaveBeenCalledTimes(3);
    });

    it('should support range selection', async function () {
      let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple'});

      let rows = tree.getAllByRole('row');
      await user.click(rows[0]);
      checkSelection(onSelectionChange, ['foo']);
      onSelectionChange.mockClear();
      await user.keyboard('{Shift>}');
      await user.click(rows[2]);
      await user.keyboard('{/Shift}');
      checkSelection(onSelectionChange, ['foo', 'bar', 'baz']);
      onSelectionChange.mockClear();
      expect(announce).toHaveBeenLastCalledWith('3 items selected.');
      expect(announce).toHaveBeenCalledTimes(2);

      await user.keyboard('{Shift>}');
      await user.click(rows[0], {shiftKey: true});
      await user.keyboard('{/Shift}');
      checkSelection(onSelectionChange, ['foo']);
      expect(announce).toHaveBeenLastCalledWith('1 item selected.');
      expect(announce).toHaveBeenCalledTimes(3);
    });

    it('should support select all and clear all via keyboard', async function () {
      let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple'});
      let grid = tree.getByRole('grid');
      let gridListTester = testUtilUser.createTester('GridList', {root: grid});
      let rows = gridListTester.rows;

      await gridListTester.toggleRowSelection({row: 0});
      checkSelection(onSelectionChange, ['foo']);
      onSelectionChange.mockClear();
      expect(announce).toHaveBeenLastCalledWith('Foo selected.');
      expect(announce).toHaveBeenCalledTimes(1);
      expect(gridListTester.selectedRows).toHaveLength(1);

      await user.keyboard('{Control>}a{/Control}');
      act(() => jest.runAllTimers());
      checkSelection(onSelectionChange, 'all');
      onSelectionChange.mockClear();
      expect(announce).toHaveBeenLastCalledWith('All items selected.');
      expect(announce).toHaveBeenCalledTimes(2);
      expect(gridListTester.selectedRows).toHaveLength(3);

      fireEvent.keyDown(rows[0], {key: 'Escape'});
      fireEvent.keyUp(rows[0], {key: 'Escape'});
      checkSelection(onSelectionChange, []);
      onSelectionChange.mockClear();
      expect(announce).toHaveBeenLastCalledWith('No items selected.');
      expect(announce).toHaveBeenCalledTimes(3);
      expect(gridListTester.selectedRows).toHaveLength(0);
    });

    describe('onAction', function () {
      it('should trigger onAction when clicking items with the mouse', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', onAction});
        let gridListTester = testUtilUser.createTester('GridList', {root: tree.getByRole('grid')});

        await gridListTester.triggerRowAction({row: 1});
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenLastCalledWith('bar');

        await gridListTester.toggleRowSelection({row: 1});
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['bar']);

        onSelectionChange.mockReset();
        await gridListTester.toggleRowSelection({row: 2});
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['bar', 'baz']);
      });

      it('should trigger onAction when clicking items with touch', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', onAction});
        let gridListTester = testUtilUser.createTester('GridList', {root: tree.getByRole('grid')});

        await gridListTester.triggerRowAction({row: 1});
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenLastCalledWith('bar');

        await gridListTester.toggleRowSelection({row: 1});
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['bar']);

        onSelectionChange.mockReset();
        gridListTester.setInteractionType('touch');
        await gridListTester.toggleRowSelection({row: 2});
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['bar', 'baz']);
      });

      describe('still needs pointer events install', function () {
        installPointerEvent();
        it('should support long press to enter selection mode on touch', async function () {
          let onSelectionChange = jest.fn();
          let onAction = jest.fn();
          let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', onAction});
          await user.click(document.body);

          let rows = tree.getAllByRole('row');
          fireEvent.pointerDown(rows[1], {pointerType: 'touch'});
          expect(onSelectionChange).not.toHaveBeenCalled();
          expect(onAction).not.toHaveBeenCalled();

          act(() => jest.advanceTimersByTime(800));

          checkSelection(onSelectionChange, ['bar']);
          expect(onAction).not.toHaveBeenCalled();

          fireEvent.pointerUp(rows[1], {pointerType: 'touch'});
          onSelectionChange.mockReset();

          triggerTouch(rows[2]);
          checkSelection(onSelectionChange, ['bar', 'baz']);

          // Deselect all to exit selection mode
          triggerTouch(rows[2]);
          onSelectionChange.mockReset();
          triggerTouch(rows[1]);

          act(() => jest.runAllTimers());
          checkSelection(onSelectionChange, []);
          expect(onAction).not.toHaveBeenCalled();
        });
      });

      it('should trigger onAction when pressing Enter', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', onAction});
        let gridListTester = testUtilUser.createTester('GridList', {root: tree.getByRole('grid')});
        gridListTester.setInteractionType('keyboard');

        await gridListTester.triggerRowAction({row: 1});
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenLastCalledWith('bar');

        onAction.mockReset();
        await gridListTester.toggleRowSelection({row: 2});
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onAction).not.toHaveBeenCalled();
        checkSelection(onSelectionChange, ['baz']);
      });

      it('should not trigger action when deselecting with mouse', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', onAction, defaultSelectedKeys: ['foo']});
        let rows = tree.getAllByRole('row');

        await user.click(rows[0]);
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onAction).not.toHaveBeenCalled();
      });

      it('should not trigger action when deselecting with keyboard', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        renderSelectionList({onSelectionChange, selectionMode: 'multiple', onAction, defaultSelectedKeys: ['foo']});

        await user.tab();
        await user.keyboard(' ');
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onAction).not.toHaveBeenCalled();
      });

      it('should not trigger action or selection when pressing Enter while in selection mode', async function () {
        let onSelectionChange = jest.fn();
        let onAction = jest.fn();
        onSelectionChange.mockReset();
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', onAction, defaultSelectedKeys: ['foo']});
        tree.getAllByRole('row');

        await user.tab();
        await user.keyboard('{Enter}');
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).not.toHaveBeenCalled();
      });

      it('should not trigger actions when a row is disabled', async function () {
        let onAction = jest.fn();
        let tree = renderSelectionList({onAction, disabledKeys: ['foo']});
        let rows = tree.getAllByRole('row');

        await user.click(rows[0]);
        expect(onAction).not.toHaveBeenCalled();

        await user.click(rows[1]);
        expect(onAction).toHaveBeenCalledTimes(1);
      });

      it('should trigger actions when a disabledBehavior="selection"', async function () {
        let onAction = jest.fn();
        let tree = renderSelectionList({onAction, disabledKeys: ['foo'], disabledBehavior: 'selection'});
        let rows = tree.getAllByRole('row');

        await user.click(rows[0]);
        expect(onAction).toHaveBeenCalledTimes(1);
      });
    });

    describe('selectionStyle highlight', function () {
      installPointerEvent();
      it('should toggle items in selection highlight with meta-click on Mac', async function () {
        let uaMock = jest.spyOn(navigator, 'platform', 'get').mockImplementation(() => 'Mac');
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', selectionStyle: 'highlight'});

        let rows = tree.getAllByRole('row');
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'false');
        await user.keyboard('[MetaLeft>]');
        await user.click(getRow(tree, 'Bar'));
        await user.keyboard('[/MetaLeft]');

        checkSelection(onSelectionChange, ['bar']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(announce).toHaveBeenLastCalledWith('Bar selected.');
        expect(announce).toHaveBeenCalledTimes(1);

        onSelectionChange.mockClear();
        await user.keyboard('[MetaLeft>]');
        await user.click(getRow(tree, 'Baz'));
        await user.keyboard('[/MetaLeft]');
        checkSelection(onSelectionChange, ['bar', 'baz']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(rows[2]).toHaveAttribute('aria-selected', 'true');
        expect(announce).toHaveBeenLastCalledWith('Baz selected. 2 items selected.');
        expect(announce).toHaveBeenCalledTimes(2);

        onSelectionChange.mockClear();
        await user.keyboard('[MetaLeft>]');
        await user.click(getRow(tree, 'Bar'));
        await user.keyboard('[/MetaLeft]');
        checkSelection(onSelectionChange, ['baz']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'true');
        expect(announce).toHaveBeenLastCalledWith('Baz selected. 1 item selected.');
        expect(announce).toHaveBeenCalledTimes(3);

        uaMock.mockRestore();
      });

      it('should allow multiple items to be selected in selection highlight with ctrl-click on Windows', async function () {
        let uaMock = jest.spyOn(navigator, 'userAgent', 'get').mockImplementation(() => 'Windows');
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', selectionStyle: 'highlight'});

        let rows = tree.getAllByRole('row');
        expect(rows[0]).toHaveAttribute('aria-selected', 'false');
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'false');
        await user.keyboard('[ControlLeft>]');
        await user.click(getRow(tree, 'Foo'));
        await user.keyboard('[/ControlLeft]');

        checkSelection(onSelectionChange, ['foo']);
        expect(rows[0]).toHaveAttribute('aria-selected', 'true');
        expect(announce).toHaveBeenLastCalledWith('Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);

        onSelectionChange.mockClear();
        await user.keyboard('[ControlLeft>]');
        await user.click(getRow(tree, 'Baz'));
        await user.keyboard('[/ControlLeft]');
        checkSelection(onSelectionChange, ['foo', 'baz']);
        expect(rows[0]).toHaveAttribute('aria-selected', 'true');
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'true');
        expect(announce).toHaveBeenLastCalledWith('Baz selected. 2 items selected.');
        expect(announce).toHaveBeenCalledTimes(2);

        uaMock.mockRestore();
      });

      it('should toggle items in selection highlight with ctrl-click on Windows', async function () {
        let uaMock = jest.spyOn(navigator, 'userAgent', 'get').mockImplementation(() => 'Windows');
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', selectionStyle: 'highlight'});

        let rows = tree.getAllByRole('row');
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'false');
        await user.keyboard('{Control>}');
        await user.click(getRow(tree, 'Bar'));
        await user.keyboard('{/Control}');

        checkSelection(onSelectionChange, ['bar']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(announce).toHaveBeenLastCalledWith('Bar selected.');
        expect(announce).toHaveBeenCalledTimes(1);

        onSelectionChange.mockClear();
        await user.keyboard('{Control>}');
        await user.click(getRow(tree, 'Baz'));
        await user.keyboard('{/Control}');
        checkSelection(onSelectionChange, ['bar', 'baz']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(rows[2]).toHaveAttribute('aria-selected', 'true');
        expect(announce).toHaveBeenLastCalledWith('Baz selected. 2 items selected.');
        expect(announce).toHaveBeenCalledTimes(2);

        onSelectionChange.mockClear();
        await user.keyboard('{Control>}');
        await user.click(getRow(tree, 'Bar'));
        await user.keyboard('{/Control}');
        checkSelection(onSelectionChange, ['baz']);
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');
        expect(rows[2]).toHaveAttribute('aria-selected', 'true');
        expect(announce).toHaveBeenLastCalledWith('Baz selected. 1 item selected.');
        expect(announce).toHaveBeenCalledTimes(3);

        uaMock.mockRestore();
      });

      it('should support single tap to perform row selection with screen reader if onAction isn\'t provided', async function () {
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', selectionStyle: 'highlight'});

        let rows = tree.getAllByRole('row');
        expect(rows[1]).toHaveAttribute('aria-selected', 'false');

        await user.click(within(rows[1]).getByText('Bar'), {pointerType: 'touch', width: 0, height: 0});
        checkSelection(onSelectionChange, [
          'bar'
        ]);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(announce).toHaveBeenLastCalledWith('Bar selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        onSelectionChange.mockClear();

        // Android TalkBack double tap test, pointer event sets pointerType and onClick handles the rest
        expect(rows[2]).toHaveAttribute('aria-selected', 'false');
        act(() => {
          let el = within(rows[2]).getByText('Baz');
          fireEvent(el, pointerEvent('pointerdown', {pointerType: 'mouse', pointerId: 1, width: 1, height: 1, pressure: 0, detail: 0}));
          fireEvent(el, pointerEvent('pointerup', {pointerType: 'mouse', pointerId: 1, width: 1, height: 1, pressure: 0, detail: 0}));
          fireEvent.click(el, {pointerType: 'mouse', width: 1, height: 1, detail: 1});
        });
        checkSelection(onSelectionChange, [
          'bar', 'baz'
        ]);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(rows[2]).toHaveAttribute('aria-selected', 'true');
        expect(announce).toHaveBeenLastCalledWith('Baz selected. 2 items selected.');
        expect(announce).toHaveBeenCalledTimes(2);
      });

      it('should support single tap to perform onAction with screen reader', async function () {
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', selectionStyle: 'highlight', onAction});

        let rows = tree.getAllByRole('row');
        let cell = within(rows[1]).getByText('Bar');
        fireEvent(cell, pointerEvent('pointerdown', {width: 0, height: 0, pointerType: 'touch'}));
        fireEvent(cell, pointerEvent('mousedown', {}));
        fireEvent(cell, pointerEvent('pointerup', {width: 0, height: 0, pointerType: 'touch'}));
        fireEvent(cell, pointerEvent('mouseup', {}));
        fireEvent(cell, pointerEvent('click', {}));
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('bar');

        // Android TalkBack double tap test, pointer event sets pointerType and onClick handles the rest
        act(() => {
          let el = within(rows[2]).getByText('Baz');
          fireEvent(el, pointerEvent('pointerdown', {pointerType: 'mouse', pointerId: 1, width: 1, height: 1, pressure: 0, detail: 0}));
          fireEvent(el, pointerEvent('pointerup', {pointerType: 'mouse', pointerId: 1, width: 1, height: 1, pressure: 0, detail: 0}));
          fireEvent.click(el, {pointerType: 'mouse', width: 1, height: 1, detail: 1});
        });
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(2);
        expect(onAction).toHaveBeenCalledWith('baz');
        expect(announce).not.toHaveBeenCalled();
      });

      it('should not call onSelectionChange when hitting Space/Enter on the currently selected row', async function () {
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'multiple', selectionStyle: 'highlight', onAction});

        let row = tree.getAllByRole('row')[1];
        expect(row).toHaveAttribute('aria-selected', 'false');
        await user.keyboard('[ControlLeft>]');
        await user.pointer({target: getRow(tree, 'Bar'), keys: '[MouseLeft]', coords: {pressure: 0.5}});
        await user.keyboard('[/ControlLeft]');

        checkSelection(onSelectionChange, ['bar']);
        expect(row).toHaveAttribute('aria-selected', 'true');
        expect(onAction).toHaveBeenCalledTimes(0);
        expect(announce).toHaveBeenLastCalledWith('Bar selected.');
        expect(announce).toHaveBeenCalledTimes(1);

        await user.keyboard('{Space}');
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledTimes(0);
        expect(announce).toHaveBeenCalledTimes(1);

        await user.keyboard('{Enter}');
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('bar');
        expect(announce).toHaveBeenCalledTimes(1);
      });

      it('should perform onAction on single click with selectionMode: none', async function () {
        let tree = renderSelectionList({onSelectionChange, selectionMode: 'none', selectionStyle: 'highlight', onAction});

        let rows = tree.getAllByRole('row');
        await user.click(rows[0]);
        expect(announce).not.toHaveBeenCalled();
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('foo');
      });

      it('should move selection when using the arrow keys', async function () {
        let tree = renderSelectionList({onSelectionChange, selectionStyle: 'highlight', selectionMode: 'multiple'});

        let rows = tree.getAllByRole('row');
        await user.click(rows[0]);
        expect(announce).toHaveBeenLastCalledWith('Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['foo']);
        onSelectionChange.mockClear();

        await user.keyboard('{ArrowDown}');
        expect(announce).toHaveBeenLastCalledWith('Bar selected.');
        expect(announce).toHaveBeenCalledTimes(2);
        checkSelection(onSelectionChange, ['bar']);
        onSelectionChange.mockClear();

        await user.keyboard('{ArrowUp}');
        expect(announce).toHaveBeenLastCalledWith('Foo selected.');
        expect(announce).toHaveBeenCalledTimes(3);
        checkSelection(onSelectionChange, ['foo']);
        onSelectionChange.mockClear();

        await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
        expect(announce).toHaveBeenLastCalledWith('Bar selected. 2 items selected.');
        expect(announce).toHaveBeenCalledTimes(4);
        checkSelection(onSelectionChange, ['foo', 'bar']);
      });

      it('should announce the new row when moving with the keyboard after multi select', async function () {
        let tree = renderSelectionList({onSelectionChange, selectionStyle: 'highlight', selectionMode: 'multiple'});

        let rows = tree.getAllByRole('row');
        await user.click(rows[0]);
        expect(announce).toHaveBeenLastCalledWith('Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['foo']);
        onSelectionChange.mockClear();

        await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
        expect(announce).toHaveBeenLastCalledWith('Bar selected. 2 items selected.');
        expect(announce).toHaveBeenCalledTimes(2);
        checkSelection(onSelectionChange, ['foo', 'bar']);
        onSelectionChange.mockClear();

        await user.keyboard('{ArrowDown}');
        expect(announce).toHaveBeenLastCalledWith('Baz selected. 1 item selected.');
        checkSelection(onSelectionChange, ['baz']);
      });

      it('should support non-contiguous selection with the keyboard', async function () {
        let tree = renderSelectionList({onSelectionChange, selectionStyle: 'highlight', selectionMode: 'multiple'});

        let rows = tree.getAllByRole('row');
        await user.click(rows[0]);
        expect(announce).toHaveBeenLastCalledWith('Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['foo']);
        onSelectionChange.mockClear();

        await user.keyboard('{Control>}{ArrowDown}{/Control}');
        expect(announce).toHaveBeenCalledTimes(1);
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(getRow(tree, 'Bar'));

        await user.keyboard('{Control>}{ArrowDown}{/Control}');
        expect(announce).toHaveBeenCalledTimes(1);
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(getRow(tree, 'Baz'));

        await user.keyboard('{Control>} {/Control}');
        expect(announce).toHaveBeenCalledWith('Baz selected. 2 items selected.');
        expect(announce).toHaveBeenCalledTimes(2);
        checkSelection(onSelectionChange, ['foo', 'baz']);
        onSelectionChange.mockClear();

        await user.keyboard(' ');
        expect(announce).toHaveBeenCalledWith('Baz selected. 1 item selected.');
        expect(announce).toHaveBeenCalledTimes(3);
        checkSelection(onSelectionChange, ['baz']);
      });

      it('should announce the current selection when moving from all to one item', async function () {
        let tree = renderSelectionList({onSelectionChange, selectionStyle: 'highlight', onAction, selectionMode: 'multiple'});

        let rows = tree.getAllByRole('row');
        await user.pointer({target: rows[0], keys: '[MouseLeft]', coords: {pressure: 0.5}});
        checkSelection(onSelectionChange, ['foo']);
        onSelectionChange.mockClear();
        expect(announce).toHaveBeenLastCalledWith('Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);

        await user.keyboard('{Control>}a{/Control}');
        checkSelection(onSelectionChange, 'all');
        onSelectionChange.mockClear();
        expect(announce).toHaveBeenLastCalledWith('All items selected.');
        expect(announce).toHaveBeenCalledTimes(2);

        await user.keyboard('{ArrowDown}');
        expect(announce).toHaveBeenLastCalledWith('Bar selected. 1 item selected.');
        expect(announce).toHaveBeenCalledTimes(3);
        checkSelection(onSelectionChange, ['bar']);
      });
    });

    describe('long press', () => {
      installPointerEvent();
      beforeEach(() => {
        window.ontouchstart = jest.fn();
      });

      afterEach(() => {
        delete window.ontouchstart;
      });

      it('should support long press to enter selection mode on touch', async function () {
        window.ontouchstart = jest.fn();
        let tree = renderSelectionList({onSelectionChange, selectionStyle: 'highlight', onAction, selectionMode: 'multiple'});
        let rows = tree.getAllByRole('row');
        await user.click(document.body);

        fireEvent.pointerDown(rows[0], {pointerType: 'touch'});
        let description = tree.getByText('Long press to enter selection mode.');
        expect(tree.getByRole('grid')).toHaveAttribute('aria-describedby', expect.stringContaining(description.id));
        expect(announce).not.toHaveBeenCalled();
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).not.toHaveBeenCalled();

        act(() => jest.advanceTimersByTime(800));

        expect(announce).toHaveBeenLastCalledWith('Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['foo']);
        onSelectionChange.mockClear();
        expect(onAction).not.toHaveBeenCalled();
        expect(within(rows[0]).getByRole('checkbox')).toBeTruthy();

        fireEvent.pointerUp(rows[0], {pointerType: 'touch'});
        fireEvent.click(rows[0], {detail: 1});

        await user.pointer({target: rows[1], keys: '[TouchA]'});
        expect(announce).toHaveBeenLastCalledWith('Bar selected. 2 items selected.');
        expect(announce).toHaveBeenCalledTimes(2);
        checkSelection(onSelectionChange, ['foo', 'bar']);
        onSelectionChange.mockClear();

        // Deselect all to exit selection mode
        fireEvent.pointerDown(rows[0], {pointerType: 'touch'});
        fireEvent.pointerUp(rows[0], {pointerType: 'touch'});
        fireEvent.click(rows[0], {pointerType: 'touch'});
        expect(announce).toHaveBeenLastCalledWith('Foo not selected. 1 item selected.');
        expect(announce).toHaveBeenCalledTimes(3);
        checkSelection(onSelectionChange, ['bar']);
        onSelectionChange.mockClear();
        fireEvent.pointerDown(rows[1], {pointerType: 'touch'});
        fireEvent.pointerUp(rows[1], {pointerType: 'touch'});
        fireEvent.click(rows[1], {pointerType: 'touch'});
        expect(announce).toHaveBeenLastCalledWith('Bar not selected.');
        expect(announce).toHaveBeenCalledTimes(4);

        act(() => jest.runAllTimers());
        checkSelection(onSelectionChange, []);
        expect(onAction).not.toHaveBeenCalled();
        expect(within(rows[0]).queryByRole('checkbox')).toBeNull();
      });
    });
  });

  describe('scrolling', function () {
    it('should scroll to a row when it is focused', async function () {
      let tree = render(
        <ListView
          width="250px"
          height="60px"
          aria-label="List"
          data-testid="test"
          selectionStyle="highlight"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
          items={[...Array(20).keys()].map(k => ({key: k, name: `Item ${k}`}))}>
          {item => <Item>{item.name}</Item>}
        </ListView>
      );
      let grid = tree.getByRole('grid');
      Object.defineProperty(grid, 'clientHeight', {
        get() {
          return 60;
        }
      });
      // fire resize so the new clientHeight is requested
      act(() => {
        fireEvent(window, new Event('resize'));
      });
      act(() => {
        jest.runAllTimers();
      });
      await user.tab();

      let rows = tree.getAllByRole('row');
      let rowWrappers = rows.map(item => item.parentElement);

      expect(rowWrappers[0].style.top).toBe('0px');
      expect(rowWrappers[0].style.height).toBe('40px');
      expect(rowWrappers[1].style.top).toBe('40px');
      expect(rowWrappers[1].style.height).toBe('40px');

      // scroll us down far enough that item 0 isn't in the view
      moveFocus('ArrowDown');
      expect(scrollIntoView).toHaveBeenLastCalledWith(grid, getRow(tree, 'Item 1'));
      grid.scrollTop = 40;
      fireEvent.scroll(grid);
      moveFocus('ArrowDown');
      expect(scrollIntoView).toHaveBeenLastCalledWith(grid, getRow(tree, 'Item 2'));
      grid.scrollTop = 80;
      fireEvent.scroll(grid);
      moveFocus('ArrowDown');
      expect(scrollIntoView).toHaveBeenLastCalledWith(grid, getRow(tree, 'Item 3'));
      grid.scrollTop = 120;
      fireEvent.scroll(grid);

      moveFocus('ArrowUp');
      expect(scrollIntoView).toHaveBeenLastCalledWith(grid, getRow(tree, 'Item 2'));
      grid.scrollTop = 80;
      fireEvent.scroll(grid);
      moveFocus('ArrowUp');
      expect(scrollIntoView).toHaveBeenLastCalledWith(grid, getRow(tree, 'Item 1'));
      grid.scrollTop = 40;
      fireEvent.scroll(grid);
      moveFocus('ArrowUp');
      expect(scrollIntoView).toHaveBeenLastCalledWith(grid, getRow(tree, 'Item 0'));
    });

    it('should scroll to a row when it is focused', function () {
      let tree = render(
        <ListView
          width="250px"
          height="60px"
          aria-label="List"
          data-testid="test"
          selectionStyle="highlight"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
          items={[...Array(20).keys()].map(k => ({key: k, name: `Item ${k}`}))}>
          {item => <Item>{item.name}</Item>}
        </ListView>
      );
      let grid = tree.getByRole('grid');
      Object.defineProperty(grid, 'clientHeight', {
        get() {
          return 60;
        }
      });
      // fire resize so the new clientHeight is requested
      act(() => {
        fireEvent(window, new Event('resize'));
      });
      act(() => {
        jest.runAllTimers();
      });

      focusRow(tree, 'Item 1');
      expect(document.activeElement).toBe(getRow(tree, 'Item 1'));
      expect(scrollIntoView).toHaveBeenLastCalledWith(grid, document.activeElement);
    });

    it('should scroll to a row when it is focused off screen', function () {
      let tree = render(
        <ListView
          width="250px"
          height="60px"
          aria-label="List"
          data-testid="test"
          selectionStyle="highlight"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
          items={[...Array(20).keys()].map(k => ({key: k, name: `Item ${k}`}))}>
          {item => <Item>{item.name}</Item>}
        </ListView>
      );
      let body = tree.getByRole('grid');

      let row = getRow(tree, 'Item 0');
      act(() => row.focus());
      expect(document.activeElement).toBe(row);

      // When scrolling the focused item out of view, focus should remain on the item
      fireEvent.scroll(body);

      expect(document.activeElement).toBe(row);
      // item isn't reused by virutalizer
      expect(tree.queryByText('Item 0')).toBe(row.firstElementChild.firstElementChild.firstElementChild);

      // Moving focus should scroll the new focused item into view
      moveFocus('ArrowDown');
      expect(document.activeElement).toBe(getRow(tree, 'Item 1'));
      expect(scrollIntoView).toHaveBeenLastCalledWith(body, document.activeElement);
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
            <ListView aria-label="listview">
              <Item href="https://google.com">One</Item>
              <Item href="https://adobe.com">Two</Item>
            </ListView>
          </Provider>
        );

        let items = getAllByRole('row');
        for (let item of items) {
          expect(item.tagName).not.toBe('A');
          expect(item).toHaveAttribute('data-href');
        }

        let onClick = mockClickDefault();
        if (type === 'keyboard') {
          await user.tab();
        }
        await trigger(items[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
        expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');
      });

      it.each(['single', 'multiple'])('should support links with selectionStyle="checkbox" selectionMode="%s"', async function (selectionMode) {
        let {getAllByRole} = render(
          <Provider theme={theme}>
            <ListView aria-label="listview" selectionMode={selectionMode}>
              <Item href="https://google.com">One</Item>
              <Item href="https://adobe.com">Two</Item>
            </ListView>
          </Provider>
        );

        let items = getAllByRole('row');
        for (let item of items) {
          expect(item.tagName).not.toBe('A');
          expect(item).toHaveAttribute('data-href');
        }

        let onClick = mockClickDefault();
        if (type === 'keyboard') {
          await user.tab();
        }
        await trigger(items[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
        expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');

        await user.click(within(items[0]).getByRole('checkbox'));
        expect(items[0]).toHaveAttribute('aria-selected', 'true');

        if (type === 'keyboard') {
          await user.keyboard('{ArrowDown}');
        }
        await trigger(items[1], ' ');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(items[1]).toHaveAttribute('aria-selected', 'true');
        window.removeEventListener('click', onClick);
      });

      it.each(['single', 'multiple'])('should support links with selectionStyle="highlight" selectionMode="%s"', async function (selectionMode) {
        let {getAllByRole} = render(
          <Provider theme={theme}>
            <ListView aria-label="listview" selectionMode={selectionMode} selectionStyle="highlight">
              <Item href="https://google.com">One</Item>
              <Item href="https://adobe.com">Two</Item>
            </ListView>
          </Provider>
        );

        let items = getAllByRole('row');
        for (let item of items) {
          expect(item.tagName).not.toBe('A');
          expect(item).toHaveAttribute('data-href');
        }

        let onClick = mockClickDefault();
        if (type === 'mouse') {
          await user.click(items[0]);
        } else {
          if (type === 'keyboard') {
            await user.tab();
            await user.keyboard(' ');
            if (selectionMode === 'single') {
              // single selection with replace will follow focus
              await user.keyboard(' ');
            }
          }
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

      it('works with RouterProvider', async () => {
        let navigate = jest.fn();
        let {getAllByRole} = render(
          <Provider theme={theme} router={{navigate}}>
            <ListView aria-label="listview">
              <Item href="/one" routerOptions={{foo: 'bar'}}>One</Item>
              <Item href="https://adobe.com">Two</Item>
            </ListView>
          </Provider>
        );

        let items = getAllByRole('row');

        if (type === 'keyboard') {
          await user.tab();
        }
        await trigger(items[0]);
        expect(navigate).toHaveBeenCalledWith('/one', {foo: 'bar'});

        navigate.mockReset();
        let onClick = mockClickDefault();

        if (type === 'keyboard') {
          await user.keyboard('{ArrowDown}');
        }
        await trigger(items[1]);
        expect(navigate).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('height 0', () => {

    it('should render and not infinite loop', function () {
      offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 0);
      offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 0);
      scrollHeight = jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 0);
      let tree = render(
        <ListView
          width="250px"
          height="60px"
          aria-label="List"
          data-testid="test"
          items={[...Array(20).keys()].map(k => ({key: k, name: `Item ${k}`}))}>
          {item => <Item>{item.name}</Item>}
        </ListView>
      );
      let grid = tree.getByRole('grid');
      act(() => {
        jest.runAllTimers();
      });
      expect(grid.firstChild).toBeEmptyDOMElement();
    });
  });
});
