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
import {act, fireEvent, pointerMap, renderv3 as render, within} from '@react-spectrum/test-utils-internal';
import {announce} from '@react-aria/live-announcer';
import {Example} from '../stories/Example';
import {getFocusableTreeWalker} from '@react-aria/focus';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

describe('ActionBar', () => {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 500);
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => jest.runAllTimers());
  });

  it('should open when there are selected items', async () => {
    let tree = render(<Provider theme={theme}><Example /></Provider>);
    act(() => {jest.runAllTimers();});

    let table = tree.getByRole('grid');
    let rows = within(table).getAllByRole('row');

    expect(tree.queryByRole('toolbar')).toBeNull();
    await user.click(rows[1]);

    expect(announce).toHaveBeenCalledWith('Actions available.');

    let toolbar = tree.getByRole('toolbar');
    expect(toolbar).toHaveAttribute('aria-label', 'Actions');

    let buttons = within(toolbar).getAllByRole('button');
    expect(buttons).toHaveLength(5);

    expect(tree.getByText('1 selected')).toBeInTheDocument();

    let clearButton = tree.getByLabelText('Clear selection');
    expect(clearButton.tagName).toBe('BUTTON');
  });

  it('should update the selected count when selecting more items', async () => {
    let tree = render(<Provider theme={theme}><Example /></Provider>);
    act(() => {jest.runAllTimers();});

    let table = tree.getByRole('grid');
    let rows = within(table).getAllByRole('row');

    await user.click(rows[1]);

    let selectedCount = tree.getByText('1 selected');

    await user.click(rows[2]);
    expect(selectedCount).toHaveTextContent('2 selected');
  });

  it('should work with select all', async () => {
    let tree = render(<Provider theme={theme}><Example /></Provider>);
    act(() => {jest.runAllTimers();});

    let selectAll = tree.getByLabelText('Select All');
    await user.click(selectAll);

    expect(tree.getByText('All selected')).toBeInTheDocument();
  });

  it('should close and restore focus when pressing the clear button', async () => {
    let tree = render(<Provider theme={theme}><Example /></Provider>);
    act(() => {jest.runAllTimers();});

    let table = tree.getByRole('grid');
    let rows = within(table).getAllByRole('row');
    let checkbox = within(rows[1]).getByRole('checkbox');

    await user.click(checkbox);
    act(() => jest.runAllTimers());
    expect(document.activeElement).toBe(checkbox);

    let clearButton = tree.getByLabelText('Clear selection');

    act(() => clearButton.focus());
    await user.click(clearButton);
    act(() => jest.runAllTimers());
    act(() => jest.runAllTimers());

    expect(tree.queryByRole('toolbar')).toBeNull();
    expect(document.activeElement).toBe(checkbox);
  });

  it('should close when pressing the escape key', async () => {
    let tree = render(<Provider theme={theme}><Example /></Provider>);
    act(() => {jest.runAllTimers();});

    let table = tree.getByRole('grid');
    let rows = within(table).getAllByRole('row');
    let checkbox = within(rows[1]).getByRole('checkbox');

    await user.click(checkbox);
    act(() => jest.runAllTimers());
    expect(document.activeElement).toBe(checkbox);

    let toolbar = tree.getByRole('toolbar');
    act(() => within(toolbar).getAllByRole('button')[0].focus());

    await user.keyboard('{Escape}');
    act(() => jest.runAllTimers());
    act(() => jest.runAllTimers());

    expect(tree.queryByRole('toolbar')).toBeNull();
    expect(document.activeElement).toBe(checkbox);
  });

  it('should restore focus where it came from after being closed via escape if no elements are removed', async () => {
    let tree = render(<Provider theme={theme}><Example /></Provider>);
    act(() => {jest.runAllTimers();});

    let table = tree.getByRole('grid');
    let rows = within(table).getAllByRole('row');
    let checkbox = within(rows[1]).getByRole('checkbox');

    await user.tab();
    expect(document.activeElement).toBe(rows[1]);
    await user.keyboard('{Enter}');
    expect(checkbox).toBeChecked();
    act(() => jest.runAllTimers());

    let toolbar = tree.getByRole('toolbar');
    expect(toolbar).toBeVisible();
    expect(document.activeElement).toBe(rows[1]);

    // Simulate tabbing within the table
    fireEvent.keyDown(document.activeElement, {key: 'Tab'});
    let walker = getFocusableTreeWalker(document.body, {tabbable: true});
    walker.currentNode = document.activeElement;
    act(() => {walker.nextNode().focus();});
    fireEvent.keyUp(document.activeElement, {key: 'Tab'});
    expect(document.activeElement).toBe(within(toolbar).getAllByRole('button')[0]);

    await user.keyboard('{Escape}');
    // jsdom doesn't blur to body like a browser, so it was being placed on the first focusable element, conveniently our table row
    // emulate browser behavior and blur
    act(() => document.activeElement.blur());
    act(() => jest.runAllTimers());
    act(() => jest.runAllTimers());

    expect(toolbar).not.toBeInTheDocument();
    expect(document.activeElement).toBe(rows[1]);
  });

  it('should restore focus to the the new first row if the row we wanted to restore to was removed', async () => {
    let tree = render(<Provider theme={theme}><Example /></Provider>);
    act(() => {jest.runAllTimers();});

    let table = tree.getByRole('grid');
    let rows = within(table).getAllByRole('row');
    expect(within(rows[1]).getByRole('rowheader')).toHaveTextContent('Foo 1');
    let checkbox = within(rows[1]).getByRole('checkbox');

    await user.tab();
    expect(document.activeElement).toBe(rows[1]);
    await user.keyboard('{Enter}');
    expect(checkbox).toBeChecked();
    act(() => jest.runAllTimers());

    let toolbar = tree.getByRole('toolbar');
    expect(toolbar).toBeVisible();
    expect(document.activeElement).toBe(rows[1]);

    // Simulate tabbing within the table
    fireEvent.keyDown(document.activeElement, {key: 'Tab'});
    let walker = getFocusableTreeWalker(document.body, {tabbable: true});
    walker.currentNode = document.activeElement;
    act(() => {walker.nextNode().focus();});
    fireEvent.keyUp(document.activeElement, {key: 'Tab'});
    expect(document.activeElement).toBe(within(toolbar).getAllByRole('button')[0]);

    await user.keyboard('{ArrowRight}');

    await user.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(within(toolbar).getAllByRole('button')[2]);

    await user.keyboard('{Enter}');

    act(() => jest.runAllTimers());
    act(() => jest.runAllTimers());
    await act(async () => Promise.resolve());

    rows = within(table).getAllByRole('row');
    expect(toolbar).not.toBeInTheDocument();
    expect(document.activeElement).toBe(rows[1]);
    expect(within(rows[1]).getByRole('rowheader')).toHaveTextContent('Foo 2');
  });

  it('should restore focus to the new first row if the row we wanted to restore to was removed via actiongroup menu', async () => {
    let tree = render(<Provider theme={theme}><Example /></Provider>);
    act(() => {jest.runAllTimers();});

    let table = tree.getByRole('grid');
    let rows = within(table).getAllByRole('row');
    let checkbox = within(rows[1]).getByRole('checkbox');

    await user.tab();
    expect(document.activeElement).toBe(rows[1]);
    await user.keyboard('{Enter}');
    expect(checkbox).toBeChecked();
    act(() => jest.runAllTimers());

    let toolbar = tree.getByRole('toolbar');
    expect(toolbar).toBeVisible();
    expect(document.activeElement).toBe(rows[1]);

    jest.spyOn(toolbar.parentNode, 'getBoundingClientRect').mockImplementation(() => ({width: 200, height: 0, top: 0, left: 0, bottom: 0, right: 0}));
    for (let action of toolbar.childNodes) {
      jest.spyOn(action, 'getBoundingClientRect').mockImplementation(() => ({width: 75, height: 0, top: 0, left: 0, bottom: 0, right: 0}));
    }
    fireEvent(window, new Event('resize'));

    // Simulate tabbing within the table
    fireEvent.keyDown(document.activeElement, {key: 'Tab'});
    let walker = getFocusableTreeWalker(document.body, {tabbable: true});
    walker.currentNode = document.activeElement;
    act(() => {walker.nextNode().focus();});
    fireEvent.keyUp(document.activeElement, {key: 'Tab'});
    expect(document.activeElement).toBe(within(toolbar).getAllByRole('button')[0]);

    await user.keyboard('{ArrowRight}');

    await user.keyboard('{ArrowRight}');

    expect(within(toolbar).getAllByRole('button')).toHaveLength(3);
    expect(document.activeElement).toBe(within(toolbar).getAllByRole('button')[2]);

    await user.keyboard('{Enter}');

    let listItems = tree.getAllByRole('menuitem');
    expect(document.activeElement).toBe(listItems[0]);
    expect(document.activeElement.textContent).toBe('Delete');

    await user.keyboard('{Enter}');

    act(() => jest.runAllTimers());
    act(() => jest.runAllTimers());
    await act(async () => Promise.resolve());
    rows = within(table).getAllByRole('row');
    // row reused by the virtualizer, so it's still in dom, but its contents have been swapped out
    expect(rows[1].textContent).not.toBe('Foo 1Bar 1Baz 1');

    rows = within(table).getAllByRole('row');
    expect(toolbar).not.toBeInTheDocument();
    expect(document.activeElement).toBe(rows[1]);
  });

  it('should fire onAction when clicking on an action', async () => {
    let onAction = jest.fn();
    let tree = render(<Provider theme={theme}><Example onAction={onAction} /></Provider>);
    act(() => {jest.runAllTimers();});

    let table = tree.getByRole('grid');
    let rows = within(table).getAllByRole('row');

    await user.click(rows[1]);

    let toolbar = tree.getByRole('toolbar');
    await user.click(within(toolbar).getAllByRole('button')[0]);

    expect(onAction).toHaveBeenCalledWith('edit');
  });

  it('should respect disabledKeys when passed in', async () => {
    let tree = render(<Provider theme={theme}><Example disabledKeys={['edit']} /></Provider>);
    act(() => {jest.runAllTimers();});

    let table = tree.getByRole('grid');
    let rows = within(table).getAllByRole('row');

    await user.click(rows[1]);

    expect(within(tree.getByRole('toolbar')).getAllByRole('button')[0]).toBeDisabled();
    expect(within(tree.getByRole('toolbar')).getAllByRole('button')[1]).not.toBeDisabled();
  });
});
