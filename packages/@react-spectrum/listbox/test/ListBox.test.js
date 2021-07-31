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

import {act, fireEvent, render, within} from '@testing-library/react';
import Bell from '@spectrum-icons/workflow/Bell';
import {Item, ListBox, Section} from '../';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {Text} from '@react-spectrum/text';
import {theme} from '@react-spectrum/theme-default';
import {triggerPress} from '@react-spectrum/test-utils';

let withSection = [
  {name: 'Heading 1', children: [
    {name: 'Foo'},
    {name: 'Bar'},
    {name: 'Baz'}
  ]},
  {name: 'Heading 2', children: [
    {name: 'Blah'},
    {name: 'Bleh'}
  ]},
  {name: 'Heading 3', children: [
    {name: 'Foo Bar'},
    {name: 'Foo Baz'}
  ]}
];

function renderComponent(props) {
  return render(
    <Provider theme={theme}>
      <span id="label">Choose an item</span>
      <ListBox items={withSection} aria-labelledby="label" {...props}>
        {item => (
          <Section key={item.name} items={item.children} title={item.name}>
            {item => <Item key={item.name} childItems={item.children}>{item.name}</Item>}
          </Section>
        )}
      </ListBox>
    </Provider>
  );
}

describe('ListBox', function () {
  let offsetWidth, offsetHeight, scrollHeight;
  let onSelectionChange = jest.fn();

  beforeAll(function () {
    offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    scrollHeight = jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 48);
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb());
    jest.useFakeTimers();
  });

  afterEach(() => {
    onSelectionChange.mockClear();
  });

  afterAll(function () {
    offsetWidth.mockReset();
    offsetHeight.mockReset();
    scrollHeight.mockReset();
  });

  it('renders properly', function () {
    let tree = renderComponent();
    let listbox = tree.getByRole('listbox');
    expect(listbox).toBeTruthy();
    expect(listbox).toHaveAttribute('aria-labelledby', 'label');

    let sections = within(listbox).getAllByRole('group');
    expect(sections.length).toBe(withSection.length);

    for (let section of sections) {
      expect(section).toHaveAttribute('aria-labelledby');
      let heading = document.getElementById(section.getAttribute('aria-labelledby'));
      expect(heading).toBeTruthy();
      expect(heading).toHaveAttribute('aria-hidden', 'true');
    }

    let dividers = within(listbox).getAllByRole('separator');
    expect(dividers.length).toBe(withSection.length - 1);

    let items = within(listbox).getAllByRole('option');
    expect(items.length).toBe(withSection.reduce((acc, curr) => (acc + curr.children.length), 0));
    let i = 1;
    for (let item of items) {
      expect(item).toHaveAttribute('tabindex');
      expect(item).not.toHaveAttribute('aria-selected');
      expect(item).toHaveAttribute('aria-disabled');
      expect(item).toHaveAttribute('aria-posinset', '' + i++);
      expect(item).toHaveAttribute('aria-setsize');
    }
    let item1 = within(listbox).getByText('Foo');
    let item2 = within(listbox).getByText('Bar');
    let item3 = within(listbox).getByText('Baz');
    let item4 = within(listbox).getByText('Blah');
    let item5 = within(listbox).getByText('Bleh');

    expect(item1).toBeTruthy();
    expect(item2).toBeTruthy();
    expect(item3).toBeTruthy();
    expect(item4).toBeTruthy();
    expect(item5).toBeTruthy();
    expect(item3).toBeTruthy();
  });

  it('allows user to change menu item focus via up/down arrow keys', function () {
    let tree = renderComponent({autoFocus: 'first'});
    let listbox = tree.getByRole('listbox');
    let options = within(listbox).getAllByRole('option');
    let selectedItem = options[0];
    expect(document.activeElement).toBe(selectedItem);
    fireEvent.keyDown(selectedItem, {key: 'ArrowDown', code: 40, charCode: 40});
    let nextSelectedItem = options[1];
    expect(document.activeElement).toBe(nextSelectedItem);
    fireEvent.keyDown(nextSelectedItem, {key: 'ArrowUp', code: 38, charCode: 38});
    expect(document.activeElement).toBe(selectedItem);
  });

  it('wraps focus from first to last/last to first item if up/down arrow is pressed if shouldFocusWrap is true', function () {
    let tree = renderComponent({autoFocus: 'first', shouldFocusWrap: true});
    let listbox = tree.getByRole('listbox');
    let options = within(listbox).getAllByRole('option');
    let firstItem = options[0];
    expect(document.activeElement).toBe(firstItem);
    fireEvent.keyDown(firstItem, {key: 'ArrowUp', code: 38, charCode: 38});
    let lastItem = options[options.length - 1];
    expect(document.activeElement).toBe(lastItem);
    fireEvent.keyDown(lastItem, {key: 'ArrowDown', code: 40, charCode: 40});
    expect(document.activeElement).toBe(firstItem);
  });

  describe('supports single selection', function () {
    it('supports defaultSelectedKeys (uncontrolled)', function () {
      // Check that correct menu item is selected by default
      let tree = renderComponent({onSelectionChange, defaultSelectedKeys: ['Blah'], autoFocus: 'first', selectionMode: 'single'});
      let listbox = tree.getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      let selectedItem = options[3];
      expect(selectedItem).toBe(document.activeElement);
      expect(selectedItem).toHaveAttribute('aria-selected', 'true');
      expect(selectedItem).toHaveAttribute('tabindex', '0');
      let itemText = within(selectedItem).getByText('Blah');
      expect(itemText).toBeTruthy();
      let checkmark = within(selectedItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Select a different menu item via enter
      let nextSelectedItem = options[4];
      fireEvent.keyDown(nextSelectedItem, {key: 'Enter', code: 13, charCode: 13});
      expect(nextSelectedItem).toHaveAttribute('aria-selected', 'true');
      itemText = within(nextSelectedItem).getByText('Bleh');
      expect(itemText).toBeTruthy();
      checkmark = within(nextSelectedItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there is only a single checkmark in the entire menu
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(1);

      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bleh')).toBeTruthy();
    });

    it('supports selectedKeys (controlled)', function () {
      // Check that correct menu item is selected by default
      let tree = renderComponent({onSelectionChange, selectedKeys: ['Blah'], autoFocus: 'first', selectionMode: 'single'});
      let listbox = tree.getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      let selectedItem = options[3];
      expect(selectedItem).toBe(document.activeElement);
      expect(selectedItem).toHaveAttribute('aria-selected', 'true');
      expect(selectedItem).toHaveAttribute('tabindex', '0');
      let itemText = within(selectedItem).getByText('Blah');
      expect(itemText).toBeTruthy();
      let checkmark = within(selectedItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Select a different menu item via enter
      let nextSelectedItem = options[4];
      fireEvent.keyDown(nextSelectedItem, {key: 'Enter', code: 13, charCode: 13});
      expect(nextSelectedItem).toHaveAttribute('aria-selected', 'false');
      expect(selectedItem).toHaveAttribute('aria-selected', 'true');
      checkmark = within(selectedItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there is only a single checkmark in the entire menu
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(1);

      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bleh')).toBeTruthy();
    });

    it('supports using space key to change item selection', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'single'});
      let listbox = tree.getByRole('listbox');
      let options = within(listbox).getAllByRole('option');

      // Trigger a menu item via space
      let item = options[4];
      fireEvent.keyDown(item, {key: ' ', code: 32, charCode: 32});
      expect(item).toHaveAttribute('aria-selected', 'true');
      let checkmark = within(item).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there is only a single checkmark in the entire menu
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(1);

      // Verify onSelectionChange is called
      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bleh')).toBeTruthy();
    });

    it('supports using click to change item selection', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'single'});
      let listbox = tree.getByRole('listbox');
      let options = within(listbox).getAllByRole('option');

      // Trigger a menu item via press
      let item = options[4];
      triggerPress(item);
      expect(item).toHaveAttribute('aria-selected', 'true');
      let checkmark = within(item).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there is only a single checkmark in the entire menu
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(1);

      // Verify onSelectionChange is called
      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bleh')).toBeTruthy();
    });

    it('supports disabled items', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'single', disabledKeys: ['Baz'], autoFocus: 'first'});
      let listbox = tree.getByRole('listbox');
      let options = within(listbox).getAllByRole('option');

      // Attempt to trigger the disabled item
      let disabledItem = options[2];
      triggerPress(disabledItem);
      expect(disabledItem).toHaveAttribute('aria-selected', 'false');
      expect(disabledItem).toHaveAttribute('aria-disabled', 'true');

      // Make sure there are no checkmarks
      let checkmarks = tree.queryAllByRole('img');
      expect(checkmarks.length).toBe(0);

      // Verify onSelectionChange is not called
      expect(onSelectionChange).toBeCalledTimes(0);

      // Verify that keyboard navigation skips disabled items
      expect(document.activeElement).toBe(options[0]);
      fireEvent.keyDown(listbox, {key: 'ArrowDown', code: 40, charCode: 40});
      expect(document.activeElement).toBe(options[1]);
      fireEvent.keyDown(listbox, {key: 'ArrowDown', code: 40, charCode: 40});
      expect(document.activeElement).toBe(options[3]);
      fireEvent.keyDown(listbox, {key: 'ArrowUp', code: 38, charCode: 38});
      expect(document.activeElement).toBe(options[1]);
      fireEvent.keyDown(listbox, {key: 'ArrowUp', code: 38, charCode: 38});
      expect(document.activeElement).toBe(options[0]);
    });
  });

  describe('supports multi selection', function () {
    it('supports selecting multiple items', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'multiple'});
      let listbox = tree.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

      // Make sure nothing is checked by default
      let checkmarks = tree.queryAllByRole('img');
      expect(checkmarks.length).toBe(0);

      let options = within(listbox).getAllByRole('option');
      let firstItem = options[3];
      triggerPress(firstItem);
      expect(firstItem).toHaveAttribute('aria-selected', 'true');
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Select a different menu item
      let secondItem = options[1];
      triggerPress(secondItem);
      expect(secondItem).toHaveAttribute('aria-selected', 'true');
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there are multiple checkmark in the entire menu
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      expect(onSelectionChange).toBeCalledTimes(2);
      expect(onSelectionChange.mock.calls[0][0].has('Blah')).toBeTruthy();
      expect(onSelectionChange.mock.calls[1][0].has('Bar')).toBeTruthy();
    });

    it('supports selecting multiple items at once with the shift key', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'multiple'});
      let listbox = tree.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

      // Make sure nothing is checked by default
      let checkmarks = tree.queryAllByRole('img');
      expect(checkmarks.length).toBe(0);

      let options = within(listbox).getAllByRole('option');
      let firstItem = options[0];
      triggerPress(firstItem);
      expect(firstItem).toHaveAttribute('aria-selected', 'true');
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      let secondItem = options[1];
      let thirdItem = options[2];
      // Select a different menu item
      triggerPress(thirdItem, {shiftKey: true});
      expect(secondItem).toHaveAttribute('aria-selected', 'true');
      expect(thirdItem).toHaveAttribute('aria-selected', 'true');
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();
      checkmark = within(thirdItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there are multiple checkmark in the entire menu
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(3);

      expect(onSelectionChange).toBeCalledTimes(2);
      expect(onSelectionChange.mock.calls[0][0].has('Foo')).toBeTruthy();
      expect(onSelectionChange.mock.calls[1][0].has('Bar')).toBeTruthy();
      expect(onSelectionChange.mock.calls[1][0].has('Baz')).toBeTruthy();
    });

    it('selectionBehavior toggle will add to the current selection', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'multiple'});
      let listbox = tree.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

      // Make sure nothing is checked by default
      let checkmarks = tree.queryAllByRole('img');
      expect(checkmarks.length).toBe(0);

      let options = within(listbox).getAllByRole('option');
      let firstItem = options[0];
      triggerPress(firstItem);
      expect(firstItem).toHaveAttribute('aria-selected', 'true');
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      let secondItem = options[1];
      let thirdItem = options[2];
      // Select a different menu item
      triggerPress(thirdItem, {shiftKey: true});
      expect(secondItem).toHaveAttribute('aria-selected', 'true');
      expect(thirdItem).toHaveAttribute('aria-selected', 'true');
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();
      checkmark = within(thirdItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there are multiple checkmark in the entire menu
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(3);

      expect(onSelectionChange).toBeCalledTimes(2);
      expect(onSelectionChange.mock.calls[0][0].has('Foo')).toBeTruthy();
      expect(onSelectionChange.mock.calls[1][0].has('Bar')).toBeTruthy();
      expect(onSelectionChange.mock.calls[1][0].has('Baz')).toBeTruthy();

      let fifthItem = options[4];
      triggerPress(fifthItem);
      expect(onSelectionChange).toBeCalledTimes(3);
      expect(onSelectionChange.mock.calls[2][0].has('Bleh')).toBeTruthy();

      // Make sure there are multiple checkmark in the entire menu
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(4);
    });

    it('selectionBehavior replace will replace the current selection with the new selection', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'multiple', selectionBehavior: 'replace'});
      let listbox = tree.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

      // Make sure nothing is checked by default
      let checkmarks = tree.queryAllByRole('img');
      expect(checkmarks.length).toBe(0);

      let options = within(listbox).getAllByRole('option');
      let firstItem = options[0];
      triggerPress(firstItem);
      expect(firstItem).toHaveAttribute('aria-selected', 'true');
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      let secondItem = options[1];
      let thirdItem = options[2];
      // Select a different menu item
      triggerPress(thirdItem, {shiftKey: true});
      expect(secondItem).toHaveAttribute('aria-selected', 'true');
      expect(thirdItem).toHaveAttribute('aria-selected', 'true');
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();
      checkmark = within(thirdItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there are multiple checkmark in the entire menu
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(3);

      expect(onSelectionChange).toBeCalledTimes(2);
      expect(onSelectionChange.mock.calls[0][0].has('Foo')).toBeTruthy();
      expect(onSelectionChange.mock.calls[1][0].has('Bar')).toBeTruthy();
      expect(onSelectionChange.mock.calls[1][0].has('Baz')).toBeTruthy();

      let fifthItem = options[4];
      triggerPress(fifthItem);
      expect(onSelectionChange).toBeCalledTimes(3);
      expect(onSelectionChange.mock.calls[2][0].has('Bleh')).toBeTruthy();

      // there should only be one selection now
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(1);
    });

    it('selectionBehavior replace will add to the current selection if the command key is pressed', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'multiple', selectionBehavior: 'replace'});
      let listbox = tree.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

      // Make sure nothing is checked by default
      let checkmarks = tree.queryAllByRole('img');
      expect(checkmarks.length).toBe(0);

      let options = within(listbox).getAllByRole('option');
      let firstItem = options[0];
      triggerPress(firstItem);
      expect(firstItem).toHaveAttribute('aria-selected', 'true');
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      let secondItem = options[1];
      let thirdItem = options[2];
      // Select a different menu item
      triggerPress(thirdItem, {shiftKey: true});
      expect(secondItem).toHaveAttribute('aria-selected', 'true');
      expect(thirdItem).toHaveAttribute('aria-selected', 'true');
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();
      checkmark = within(thirdItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there are multiple checkmark in the entire menu
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(3);

      expect(onSelectionChange).toBeCalledTimes(2);
      expect(onSelectionChange.mock.calls[0][0].has('Foo')).toBeTruthy();
      expect(onSelectionChange.mock.calls[1][0].has('Bar')).toBeTruthy();
      expect(onSelectionChange.mock.calls[1][0].has('Baz')).toBeTruthy();

      let fifthItem = options[4];
      triggerPress(fifthItem, {metaKey: true});
      expect(onSelectionChange).toBeCalledTimes(3);
      expect(onSelectionChange.mock.calls[2][0].has('Bleh')).toBeTruthy();

      // there should only be one selection now
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(4);
    });

    it('supports multiple defaultSelectedKeys (uncontrolled)', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'multiple', defaultSelectedKeys: ['Foo', 'Bar']});
      let listbox = tree.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

      // Make sure two items are checked by default
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      let options = within(listbox).getAllByRole('option');
      let firstItem = options[0];
      let secondItem = options[1];

      expect(firstItem).toHaveAttribute('aria-selected', 'true');
      expect(secondItem).toHaveAttribute('aria-selected', 'true');
      let itemText = within(firstItem).getByText('Foo');
      expect(itemText).toBeTruthy();
      itemText = within(secondItem).getByText('Bar');
      expect(itemText).toBeTruthy();
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Select a different menu item
      let thirdItem = options[4];
      triggerPress(thirdItem);
      expect(thirdItem).toHaveAttribute('aria-selected', 'true');
      checkmark = within(thirdItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there are now three checkmarks
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(3);

      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bleh')).toBeTruthy();
      expect(onSelectionChange.mock.calls[0][0].has('Foo')).toBeTruthy();
      expect(onSelectionChange.mock.calls[0][0].has('Bar')).toBeTruthy();
    });

    it('supports multiple selectedKeys (controlled)', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'multiple', selectedKeys: ['Foo', 'Bar']});
      let listbox = tree.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

      // Make sure two items are checked by default
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      let options = within(listbox).getAllByRole('option');
      let firstItem = options[0];
      let secondItem = options[1];

      expect(firstItem).toHaveAttribute('aria-selected', 'true');
      expect(secondItem).toHaveAttribute('aria-selected', 'true');
      let itemText = within(firstItem).getByText('Foo');
      expect(itemText).toBeTruthy();
      itemText = within(secondItem).getByText('Bar');
      expect(itemText).toBeTruthy();
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Select a different menu item
      let thirdItem = options[4];
      triggerPress(thirdItem);
      expect(thirdItem).toHaveAttribute('aria-selected', 'false');
      checkmark = within(thirdItem).queryByRole('img', {hidden: true});
      expect(checkmark).toBeNull();

      // Make sure there are still two checkmarks
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bleh')).toBeTruthy();
    });

    it('supports deselection', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'multiple', defaultSelectedKeys: ['Foo', 'Bar']});
      let listbox = tree.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

      // Make sure two items are checked by default
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      let options = within(listbox).getAllByRole('option');
      let firstItem = options[0];
      let secondItem = options[1];

      expect(firstItem).toHaveAttribute('aria-selected', 'true');
      expect(secondItem).toHaveAttribute('aria-selected', 'true');
      let itemText = within(firstItem).getByText('Foo');
      expect(itemText).toBeTruthy();
      itemText = within(secondItem).getByText('Bar');
      expect(itemText).toBeTruthy();
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Deselect the first item
      triggerPress(firstItem);
      expect(firstItem).toHaveAttribute('aria-selected', 'false');
      checkmark = within(firstItem).queryByRole('img', {hidden: true});
      expect(checkmark).toBeNull();

      // Make sure there only a single checkmark now
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(1);

      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bar')).toBeTruthy();
    });

    it('supports disabledKeys', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'multiple', defaultSelectedKeys: ['Foo', 'Bar'], disabledKeys: ['Baz']});
      let listbox = tree.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

      // Attempt to trigger disabled item
      let options = within(listbox).getAllByRole('option');
      let disabledItem = options[2];
      triggerPress(disabledItem);

      expect(disabledItem).toHaveAttribute('aria-selected', 'false');
      expect(disabledItem).toHaveAttribute('aria-disabled', 'true');

      // Make sure that only two items are checked still
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      expect(onSelectionChange).toBeCalledTimes(0);
    });
  });

  describe('supports no selection', function () {
    it('prevents selection of any items', function () {
      let tree = renderComponent({onSelectionChange, selectionMode: 'none'});
      let listbox = tree.getByRole('listbox');

      // Make sure nothing is checked by default
      let checkmarks = tree.queryAllByRole('img');
      expect(checkmarks.length).toBe(0);

      // Attempt to select a variety of items via enter, space, and click
      let options = within(listbox).getAllByRole('option');
      let firstItem = options[3];
      let secondItem = options[4];
      let thirdItem = options[1];
      triggerPress(firstItem);
      fireEvent.keyDown(secondItem, {key: ' ', code: 32, charCode: 32});
      fireEvent.keyDown(thirdItem, {key: 'Enter', code: 13, charCode: 13});
      expect(firstItem).not.toHaveAttribute('aria-selected', 'true');
      expect(secondItem).not.toHaveAttribute('aria-selected', 'true');
      expect(thirdItem).not.toHaveAttribute('aria-selected', 'true');

      // Make sure nothing is still checked
      checkmarks = tree.queryAllByRole('img');
      expect(checkmarks.length).toBe(0);
      expect(onSelectionChange).toBeCalledTimes(0);
    });
  });

  describe('supports type to select', function () {
    it('supports focusing items by typing letters in rapid succession', function () {
      let tree = renderComponent({autoFocus: 'first'});
      let listbox = tree.getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(listbox, {key: 'B'});
      expect(document.activeElement).toBe(options[1]);

      fireEvent.keyDown(listbox, {key: 'L'});
      expect(document.activeElement).toBe(options[3]);

      fireEvent.keyDown(listbox, {key: 'E'});
      expect(document.activeElement).toBe(options[4]);
    });

    it('supports the space character in a search', function () {
      let tree = renderComponent({autoFocus: 'first'});
      let listbox = tree.getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(listbox, {key: 'F'});
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(listbox, {key: 'O'});
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(listbox, {key: 'O'});
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(listbox, {key: ' '});
      expect(document.activeElement).toBe(options[5]);

      fireEvent.keyDown(listbox, {key: 'B'});
      expect(document.activeElement).toBe(options[5]);

      fireEvent.keyDown(listbox, {key: 'A'});
      expect(document.activeElement).toBe(options[5]);

      fireEvent.keyDown(listbox, {key: 'Z'});
      expect(document.activeElement).toBe(options[6]);
    });

    it('supports item selection using the Spacebar after search times out', function () {
      let tree = renderComponent({autoFocus: 'first', onSelectionChange, selectionMode: 'single'});
      let listbox = tree.getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(listbox, {key: 'F'});
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(listbox, {key: 'O'});
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(listbox, {key: 'O'});
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(listbox, {key: ' '});
      expect(document.activeElement).toBe(options[5]);

      // Verify no selection was made
      expect(document.activeElement).toHaveAttribute('aria-selected', 'false');

      // Verify there are no checkmarks on the active element
      let checkmark = within(document.activeElement).queryByRole('img', {hidden: true});
      expect(checkmark).toBeFalsy();

      // Verify there are no checkmarks in the entire listbox
      let checkmarks = tree.queryAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(0);

      // Verify onSelectionChange was not called
      expect(onSelectionChange).toBeCalledTimes(0);

      // Continue the search
      fireEvent.keyDown(listbox, {key: 'B'});
      expect(document.activeElement).toBe(options[5]);

      // Advance the timers so we can select using the Spacebar
      act(() => {jest.runAllTimers();});

      fireEvent.keyDown(document.activeElement, {key: ' ', code: 32, charCode: 32});

      // Verify the selection
      expect(document.activeElement).toHaveAttribute('aria-selected', 'true');
      checkmark = within(document.activeElement).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Verify there is only a single checkmark in the entire listbox
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(1);

      // Verify onSelectionChange is called
      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Foo Bar')).toBeTruthy();
    });

    it('resets the search text after a timeout', function () {
      let tree = renderComponent({autoFocus: 'first'});
      let listbox = tree.getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(listbox, {key: 'B'});
      expect(document.activeElement).toBe(options[1]);

      act(() => {jest.runAllTimers();});

      fireEvent.keyDown(listbox, {key: 'B'});
      expect(document.activeElement).toBe(options[1]);
    });

    it('wraps around when no items past the current one match', function () {
      let tree = renderComponent({autoFocus: 'first'});
      let listbox = tree.getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(listbox, {key: 'B'});
      fireEvent.keyDown(listbox, {key: 'L'});
      fireEvent.keyDown(listbox, {key: 'E'});
      expect(document.activeElement).toBe(options[4]);

      act(() => {jest.runAllTimers();});

      fireEvent.keyDown(listbox, {key: 'B'});
      expect(document.activeElement).toBe(options[4]);
    });
  });

  it('supports complex options with aria-labelledby and aria-describedby', function () {
    let tree = render(
      <Provider theme={theme}>
        <ListBox aria-label="listbox">
          <Item textValue="Label">
            <Bell />
            <Text>Label</Text>
            <Text slot="description">Description</Text>
          </Item>
        </ListBox>
      </Provider>
    );

    let listbox = tree.getByRole('listbox');
    let option = within(listbox).getByRole('option');
    let label = within(listbox).getByText('Label');
    let description = within(listbox).getByText('Description');

    expect(option).toHaveAttribute('aria-labelledby', label.id);
    expect(option).toHaveAttribute('aria-describedby', description.id);
  });

  it('supports aria-label', function () {
    let tree = renderComponent({'aria-label': 'Test'});
    let listbox = tree.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-label', 'Test');
  });

  it('warns user if no aria-label is provided', () => {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    renderComponent({'aria-labelledby': undefined});
    expect(spyWarn).toHaveBeenCalledWith('If you do not provide a visible label, you must specify an aria-label or aria-labelledby attribute for accessibility');
  });

  it('supports aria-label on sections and items', function () {
    let tree = render(
      <Provider theme={theme}>
        <ListBox aria-label="listbox">
          <Section aria-label="Section">
            <Item aria-label="Item"><Bell /></Item>
          </Section>
        </ListBox>
      </Provider>
    );

    let listbox = tree.getByRole('listbox');
    let group = within(listbox).getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'Section');
    let option = within(listbox).getByRole('option');
    expect(option).toHaveAttribute('aria-label', 'Item');
    expect(option).not.toHaveAttribute('aria-labelledby');
    expect(option).not.toHaveAttribute('aria-describedby');
  });

  it('supports custom data attributes', function () {
    let tree = renderComponent({'data-testid': 'test'});
    let listbox = tree.getByRole('listbox');
    expect(listbox).toHaveAttribute('data-testid', 'test');
  });

  describe('async loading', function () {
    it('should display a spinner while loading', function () {
      let {getByRole, rerender} = render(
        <Provider theme={theme}>
          <ListBox aria-label="listbox" items={[]} isLoading>
            {item => <Item>{item.name}</Item>}
          </ListBox>
        </Provider>
      );

      let listbox = getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(options.length).toBe(1);

      let progressbar = within(options[0]).getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Loading…');
      expect(progressbar).not.toHaveAttribute('aria-valuenow');

      rerender(
        <Provider theme={theme}>
          <ListBox aria-label="listbox" items={[]}>
            {item => <Item>{item.name}</Item>}
          </ListBox>
        </Provider>
      );

      expect(progressbar).not.toBeInTheDocument();
    });

    it('should display a spinner inside the listbox when loading more', function () {
      let items = [{name: 'Foo'}, {name: 'Bar'}];
      let {getByRole, rerender} = render(
        <Provider theme={theme}>
          <ListBox aria-label="listbox" items={items} isLoading>
            {item => <Item key={item.name}>{item.name}</Item>}
          </ListBox>
        </Provider>
      );

      let listbox = getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(options.length).toBe(3);

      let progressbar = within(options[2]).getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Loading more…');
      expect(progressbar).not.toHaveAttribute('aria-valuenow');

      rerender(
        <Provider theme={theme}>
          <ListBox aria-label="listbox" items={items}>
            {item => <Item key={item.name}>{item.name}</Item>}
          </ListBox>
        </Provider>
      );

      options = within(listbox).getAllByRole('option');
      expect(options.length).toBe(2);
      expect(progressbar).not.toBeInTheDocument();
    });

    it('should fire onLoadMore when scrolling near the bottom', function () {
      // Mock clientHeight to match maxHeight prop
      let maxHeight = 200;
      jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => maxHeight);

      let onLoadMore = jest.fn();
      let items = [];
      for (let i = 1; i <= 100; i++) {
        items.push({name: 'Test ' + i});
      }

      let {getByRole} = render(
        <Provider theme={theme}>
          <ListBox aria-label="listbox" items={items} maxHeight={maxHeight} onLoadMore={onLoadMore}>
            {item => <Item key={item.name}>{item.name}</Item>}
          </ListBox>
        </Provider>
      );

      let listbox = getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(options.length).toBe(5); // each row is 48px tall, listbox is 200px. 5 rows fit.

      listbox.scrollTop = 250;
      fireEvent.scroll(listbox);

      listbox.scrollTop = 1500;
      fireEvent.scroll(listbox);

      listbox.scrollTop = 5000;
      fireEvent.scroll(listbox);

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should fire onLoadMore if there aren\'t enough items to fill the ListBox ', function () {
      // Mock clientHeight to match maxHeight prop
      let maxHeight = 300;
      jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => maxHeight);

      let onLoadMore = jest.fn();
      let items = [];
      for (let i = 1; i <= 5; i++) {
        items.push({name: 'Test ' + i});
      }

      let {getByRole} = render(
        <Provider theme={theme}>
          <ListBox aria-label="listbox" items={items} maxHeight={maxHeight} onLoadMore={onLoadMore}>
            {item => <Item key={item.name}>{item.name}</Item>}
          </ListBox>
        </Provider>
      );

      let listbox = getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(options.length).toBe(5);
      // onLoadMore called twice from onVisibleRectChange due to ListBox sizeToFit
      // onLoadMore called three times from useLayoutEffect
      expect(onLoadMore).toHaveBeenCalledTimes(5);
    });
  });
});
