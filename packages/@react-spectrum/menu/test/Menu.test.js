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

import {act, fireEvent, mockClickDefault, pointerMap, renderv3 as render, within} from '@react-spectrum/test-utils-internal';
import Bell from '@spectrum-icons/workflow/Bell';
import {Dialog, DialogTrigger} from '@react-spectrum/dialog';
import {Item, Menu, Section} from '../';
import {Keyboard, Text} from '@react-spectrum/text';
import {MenuContext} from '../src/context';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

let menuId = 'menu-id';

let withSection = [
  {name: 'Heading 1', children: [
    {name: 'Foo'},
    {name: 'Bar'},
    {name: 'Baz'}
  ]},
  {name: 'Heading 2', children: [
    {name: 'Blah'},
    {name: 'Bleh'}
  ]}
];

function renderComponent(Component, contextProps = {}, props = {}) {
  return render(
    <Provider theme={theme}>
      <span id="label">Label</span>
      <MenuContext.Provider value={contextProps}>
        <Menu id={menuId} items={withSection} aria-labelledby="label" {...props}>
          {item => (
            <Section key={item.name} items={item.children} title={item.name}>
              {item => <Item key={item.name} childItems={item.children}>{item.name}</Item>}
            </Section>
          )}
        </Menu>
      </MenuContext.Provider>
    </Provider>
  );
}

describe('Menu', function () {
  let offsetWidth, offsetHeight;
  let onSelectionChange = jest.fn();

  beforeAll(function () {
    offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => 1000);
    offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => 1000);
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    onSelectionChange.mockClear();
  });

  afterAll(function () {
    offsetWidth.mockReset();
    offsetHeight.mockReset();
  });

  it.each`
    Name        | Component | props
    ${'Menu'}   | ${Menu}   | ${{}}
  `('$Name renders properly', function ({Component}) {
    let tree = renderComponent(Component);
    let menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();
    expect(menu).toHaveAttribute('aria-labelledby', 'label');

    let sections = within(menu).getAllByRole('group');
    expect(sections.length).toBe(2);

    for (let section of sections) {
      expect(section).toHaveAttribute('aria-labelledby');
      let heading = document.getElementById(section.getAttribute('aria-labelledby'));
      expect(heading).toBeTruthy();
      expect(heading).toHaveAttribute('role', 'presentation');
    }

    let dividers = within(menu).getAllByRole('separator');
    expect(dividers.length).toBe(1);

    let items = within(menu).getAllByRole('menuitem');
    expect(items.length).toBe(5);
    for (let item of items) {
      expect(item).toHaveAttribute('tabindex');
      expect(item).not.toHaveAttribute('aria-disabled');
    }
    let item1 = within(menu).getByText('Foo');
    let item2 = within(menu).getByText('Bar');
    let item3 = within(menu).getByText('Baz');
    let item4 = within(menu).getByText('Blah');
    let item5 = within(menu).getByText('Bleh');

    expect(item1).toBeTruthy();
    expect(item2).toBeTruthy();
    expect(item3).toBeTruthy();
    expect(item4).toBeTruthy();
    expect(item5).toBeTruthy();
    expect(item3).toBeTruthy();
  });

  it.each`
    Name        | Component | props
    ${'Menu'}   | ${Menu}   | ${{autoFocus: 'first'}}
  `('$Name allows user to change menu item focus via up/down arrow keys', function ({Component, props}) {
    let tree = renderComponent(Component, {}, props);
    let menu = tree.getByRole('menu');
    let menuItems = within(menu).getAllByRole('menuitem');
    let selectedItem = menuItems[0];
    expect(selectedItem).toBe(document.activeElement);
    fireEvent.keyDown(selectedItem, {key: 'ArrowDown', code: 40, charCode: 40});
    let nextSelectedItem = menuItems[1];
    expect(nextSelectedItem).toBe(document.activeElement);
    fireEvent.keyDown(nextSelectedItem, {key: 'ArrowUp', code: 38, charCode: 38});
    expect(selectedItem).toBe(document.activeElement);
  });

  it.each`
    Name        | Component | props
    ${'Menu'}   | ${Menu}   | ${{autoFocus: 'first', shouldFocusWrap: true}}
  `('$Name wraps focus from first to last/last to first item if up/down arrow is pressed if shouldFocusWrap is true', function ({Component, props}) {
    let tree = renderComponent(Component, {}, props);
    let menu = tree.getByRole('menu');
    let menuItems = within(menu).getAllByRole('menuitem');
    let firstItem = menuItems[0];
    expect(firstItem).toBe(document.activeElement);
    fireEvent.keyDown(firstItem, {key: 'ArrowUp', code: 38, charCode: 38});
    let lastItem = menuItems[menuItems.length - 1];
    expect(lastItem).toBe(document.activeElement);
    fireEvent.keyDown(lastItem, {key: 'ArrowDown', code: 40, charCode: 40});
    expect(firstItem).toBe(document.activeElement);
  });

  describe('supports single selection', function () {
    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{selectionMode: 'single', onSelectionChange, defaultSelectedKeys: ['Blah'], autoFocus: 'first'}}
    `('$Name supports defaultSelectedKeys (uncontrolled)', function ({Component, props}) {
      // Check that correct menu item is selected by default
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitemradio');
      let selectedItem = menuItems[3];
      expect(selectedItem).toBe(document.activeElement);
      expect(selectedItem).toHaveAttribute('aria-checked', 'true');
      expect(selectedItem).toHaveAttribute('tabindex', '0');
      let itemText = within(selectedItem).getByText('Blah');
      expect(itemText).toBeTruthy();
      let checkmark = within(selectedItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Select a different menu item via enter
      let nextSelectedItem = menuItems[4];
      fireEvent.keyDown(nextSelectedItem, {key: 'Enter', code: 13, charCode: 13});
      fireEvent.keyUp(nextSelectedItem, {key: 'Enter', code: 13, charCode: 13});
      expect(nextSelectedItem).toHaveAttribute('aria-checked', 'true');
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

    it.each`
    Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{selectionMode: 'single', onSelectionChange, selectedKeys: ['Blah'], autoFocus: 'first'}}
    `('$Name supports selectedKeys (controlled)', function ({Component, props}) {
      // Check that correct menu item is selected by default
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitemradio');
      let selectedItem = menuItems[3];
      expect(selectedItem).toBe(document.activeElement);
      expect(selectedItem).toHaveAttribute('aria-checked', 'true');
      expect(selectedItem).toHaveAttribute('tabindex', '0');
      let itemText = within(selectedItem).getByText('Blah');
      expect(itemText).toBeTruthy();
      let checkmark = within(selectedItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Select a different menu item via enter
      let nextSelectedItem = menuItems[4];
      fireEvent.keyDown(nextSelectedItem, {key: 'Enter', code: 13, charCode: 13});
      fireEvent.keyUp(nextSelectedItem, {key: 'Enter', code: 13, charCode: 13});
      expect(nextSelectedItem).toHaveAttribute('aria-checked', 'false');
      expect(selectedItem).toHaveAttribute('aria-checked', 'true');
      checkmark = within(selectedItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there is only a single checkmark in the entire menu
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(1);

      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bleh')).toBeTruthy();
    });

    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{selectionMode: 'single', onSelectionChange}}
    `('$Name supports using space key to change item selection', function ({Component, props}) {
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitemradio');

      // Trigger a menu item via space
      let item = menuItems[4];
      fireEvent.keyDown(item, {key: ' ', code: 32, charCode: 32});
      fireEvent.keyUp(item, {key: ' ', code: 32, charCode: 32});
      expect(item).toHaveAttribute('aria-checked', 'true');
      let checkmark = within(item).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there is only a single checkmark in the entire menu
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(1);

      // Verify onSelectionChange is called
      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bleh')).toBeTruthy();
    });

    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{selectionMode: 'single', onSelectionChange}}
    `('$Name supports using click to change item selection', async function ({Component, props}) {
      let user = userEvent.setup({delay: null, pointerMap});
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitemradio');

      // Trigger a menu item via press
      let item = menuItems[4];
      await user.click(item);
      expect(item).toHaveAttribute('aria-checked', 'true');
      let checkmark = within(item).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there is only a single checkmark in the entire menu
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(1);

      // Verify onSelectionChange is called
      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bleh')).toBeTruthy();
    });

    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{selectionMode: 'single', onSelectionChange, disabledKeys: ['Baz']}}
    `('$Name supports disabled items', async function ({Component, props}) {
      let user = userEvent.setup({delay: null, pointerMap});
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitemradio');

      // Attempt to trigger the disabled item
      let disabledItem = menuItems[2];
      await user.click(disabledItem);
      expect(disabledItem).toHaveAttribute('aria-checked', 'false');
      expect(disabledItem).toHaveAttribute('aria-disabled', 'true');

      // Make sure there are no checkmarks
      let checkmarks = tree.queryAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(0);

      // Verify onSelectionChange is not called
      expect(onSelectionChange).toBeCalledTimes(0);
    });
  });

  describe('supports multi selection', function () {
    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{onSelectionChange, selectionMode: 'multiple'}}
    `('$Name supports selecting multiple items', async function ({Component, props}) {
      let user = userEvent.setup({delay: null, pointerMap});
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');

      // Make sure nothing is checked by default
      let checkmarks = tree.queryAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(0);

      let menuItems = within(menu).getAllByRole('menuitemcheckbox');
      let firstItem = menuItems[3];
      await user.click(firstItem);
      expect(firstItem).toHaveAttribute('aria-checked', 'true');
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Select a different menu item
      let secondItem = menuItems[1];
      await user.click(secondItem);
      expect(secondItem).toHaveAttribute('aria-checked', 'true');
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Make sure there are multiple checkmark in the entire menu
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      expect(onSelectionChange).toBeCalledTimes(2);
      expect(onSelectionChange.mock.calls[0][0].has('Blah')).toBeTruthy();
      expect(onSelectionChange.mock.calls[1][0].has('Bar')).toBeTruthy();
    });

    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{onSelectionChange, selectionMode: 'multiple', defaultSelectedKeys: ['Foo', 'Bar']}}
    `('$Name supports multiple defaultSelectedKeys (uncontrolled)', async function ({Component, props}) {
      let user = userEvent.setup({delay: null, pointerMap});
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');

      // Make sure two items are checked by default
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      let menuItems = within(menu).getAllByRole('menuitemcheckbox');
      let firstItem = menuItems[0];
      let secondItem = menuItems[1];

      expect(firstItem).toHaveAttribute('aria-checked', 'true');
      expect(secondItem).toHaveAttribute('aria-checked', 'true');
      let itemText = within(firstItem).getByText('Foo');
      expect(itemText).toBeTruthy();
      itemText = within(secondItem).getByText('Bar');
      expect(itemText).toBeTruthy();
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Select a different menu item
      let thirdItem = menuItems[4];
      await user.click(thirdItem);
      expect(thirdItem).toHaveAttribute('aria-checked', 'true');
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

    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{onSelectionChange, selectionMode: 'multiple', selectedKeys: ['Foo', 'Bar']}}
    `('$Name supports multiple selectedKeys (controlled)', async function ({Component, props}) {
      let user = userEvent.setup({delay: null, pointerMap});
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');

      // Make sure two items are checked by default
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      let menuItems = within(menu).getAllByRole('menuitemcheckbox');
      let firstItem = menuItems[0];
      let secondItem = menuItems[1];

      expect(firstItem).toHaveAttribute('aria-checked', 'true');
      expect(secondItem).toHaveAttribute('aria-checked', 'true');
      let itemText = within(firstItem).getByText('Foo');
      expect(itemText).toBeTruthy();
      itemText = within(secondItem).getByText('Bar');
      expect(itemText).toBeTruthy();
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Select a different menu item
      let thirdItem = menuItems[4];
      await user.click(thirdItem);
      expect(thirdItem).toHaveAttribute('aria-checked', 'false');
      checkmark = within(thirdItem).queryByRole('img', {hidden: true});
      expect(checkmark).toBeNull();

      // Make sure there are still two checkmarks
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bleh')).toBeTruthy();
    });

    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{onSelectionChange, selectionMode: 'multiple', defaultSelectedKeys: ['Foo', 'Bar']}}
    `('$Name supports deselection', async function ({Component, props}) {
      let user = userEvent.setup({delay: null, pointerMap});
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');

      // Make sure two items are checked by default
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      let menuItems = within(menu).getAllByRole('menuitemcheckbox');
      let firstItem = menuItems[0];
      let secondItem = menuItems[1];

      expect(firstItem).toHaveAttribute('aria-checked', 'true');
      expect(secondItem).toHaveAttribute('aria-checked', 'true');
      let itemText = within(firstItem).getByText('Foo');
      expect(itemText).toBeTruthy();
      itemText = within(secondItem).getByText('Bar');
      expect(itemText).toBeTruthy();
      let checkmark = within(firstItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();
      checkmark = within(secondItem).getByRole('img', {hidden: true});
      expect(checkmark).toBeTruthy();

      // Deselect the first item
      await user.click(firstItem);
      expect(firstItem).toHaveAttribute('aria-checked', 'false');
      checkmark = within(firstItem).queryByRole('img', {hidden: true});
      expect(checkmark).toBeNull();

      // Make sure there only a single checkmark now
      checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(1);

      expect(onSelectionChange).toBeCalledTimes(1);
      expect(onSelectionChange.mock.calls[0][0].has('Bar')).toBeTruthy();
    });

    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{onSelectionChange, selectionMode: 'multiple', defaultSelectedKeys: ['Foo', 'Bar'], disabledKeys: ['Baz']}}
    `('$Name supports disabledKeys', async function ({Component, props}) {
      let user = userEvent.setup({delay: null, pointerMap});
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');

      // Attempt to trigger disabled item
      let menuItems = within(menu).getAllByRole('menuitemcheckbox');
      let disabledItem = menuItems[2];
      await user.click(disabledItem);

      expect(disabledItem).toHaveAttribute('aria-checked', 'false');
      expect(disabledItem).toHaveAttribute('aria-disabled', 'true');

      // Make sure that only two items are checked still
      let checkmarks = tree.getAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(2);

      expect(onSelectionChange).toBeCalledTimes(0);
    });
  });

  describe('supports no selection', function () {
    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{onSelectionChange, selectionMode: 'none'}}
    `('$Name prevents selection of any items', async function ({Component, props}) {
      let user = userEvent.setup({delay: null, pointerMap});
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');

      // Make sure nothing is checked by default
      let checkmarks = tree.queryAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(0);

      // Attempt to select a variety of items via enter, space, and click
      let menuItems = within(menu).getAllByRole('menuitem');
      let firstItem = menuItems[3];
      let secondItem = menuItems[4];
      let thirdItem = menuItems[1];
      await user.click(firstItem);
      fireEvent.keyDown(secondItem, {key: ' ', code: 32, charCode: 32});
      fireEvent.keyDown(thirdItem, {key: 'Enter', code: 13, charCode: 13});
      expect(firstItem).not.toHaveAttribute('aria-checked', 'true');
      expect(secondItem).not.toHaveAttribute('aria-checked', 'true');
      expect(thirdItem).not.toHaveAttribute('aria-checked', 'true');

      // Make sure nothing is still checked
      checkmarks = tree.queryAllByRole('img', {hidden: true});
      expect(checkmarks.length).toBe(0);
      expect(onSelectionChange).toBeCalledTimes(0);
    });
  });

  describe('supports type to select', function () {
    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{autoFocus: 'first'}}
    `('$Name supports focusing items by typing letters in rapid succession', function ({Component, props}) {
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitem');
      expect(document.activeElement).toBe(menuItems[0]);

      fireEvent.keyDown(menu, {key: 'B'});
      expect(document.activeElement).toBe(menuItems[1]);

      fireEvent.keyDown(menu, {key: 'L'});
      expect(document.activeElement).toBe(menuItems[3]);

      fireEvent.keyDown(menu, {key: 'E'});
      expect(document.activeElement).toBe(menuItems[4]);
    });

    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{autoFocus: 'first'}}
    `('$Name resets the search text after a timeout', function ({Component, props}) {
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitem');
      expect(document.activeElement).toBe(menuItems[0]);

      fireEvent.keyDown(menu, {key: 'B'});
      expect(document.activeElement).toBe(menuItems[1]);

      act(() => {jest.runAllTimers();});

      fireEvent.keyDown(menu, {key: 'B'});
      expect(document.activeElement).toBe(menuItems[1]);
    });

    it.each`
      Name        | Component | props
      ${'Menu'}   | ${Menu}   | ${{autoFocus: 'first'}}
    `('$Name wraps around when no items past the current one match', function ({Component, props}) {
      let tree = renderComponent(Component, {}, props);
      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitem');
      expect(document.activeElement).toBe(menuItems[0]);

      fireEvent.keyDown(menu, {key: 'B'});
      fireEvent.keyDown(menu, {key: 'L'});
      fireEvent.keyDown(menu, {key: 'E'});
      expect(document.activeElement).toBe(menuItems[4]);

      act(() => {jest.runAllTimers();});

      fireEvent.keyDown(menu, {key: 'B'});
      expect(document.activeElement).toBe(menuItems[4]);
    });
  });

  it('supports DialogTrigger as a wrapper around items', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let tree = render(
      <Provider theme={theme}>
        <Menu aria-label="menu" id={menuId} selectionMode="none">
          <Section title="Test">
            <DialogTrigger>
              <Item>Hi</Item>
              <Dialog>
                I'm a dialog
              </Dialog>
            </DialogTrigger>
          </Section>
        </Menu>
      </Provider>
    );

    let menu = tree.getByRole('menu');
    let menuItem = within(menu).getByRole('menuitem');

    await user.click(menuItem);
    act(() => {
      jest.runAllTimers();
    });

    let dialog = tree.getByRole('dialog');
    expect(dialog).toBeVisible();

    act(() => {
      fireEvent.keyDown(dialog, {key: 'Escape'});
      fireEvent.keyUp(dialog, {key: 'Escape'});
      jest.runAllTimers();
    });

    expect(tree.queryByRole('dialog')).toBeNull();
  });

  describe('supports onAction', function () {
    it('Menu with static list supports onAction', async function () {
      let user = userEvent.setup({delay: null, pointerMap});
      let onAction = jest.fn();
      let onSelectionChange = jest.fn();
      let tree = render(
        <Provider theme={theme}>
          <Menu aria-label="menu" onSelectionChange={onSelectionChange} onAction={onAction}>
            <Item key="One">One</Item>
            <Item key="Two">Two</Item>
            <Item key="Three">Three</Item>
          </Menu>
        </Provider>
      );

      let menu = tree.getByRole('menu');

      let [item1, item2, item3] = [
        within(menu).getByText('One'),
        within(menu).getByText('Two'),
        within(menu).getByText('Three')
      ];

      await user.click(item1);
      expect(onAction).toHaveBeenCalledWith('One');
      expect(onSelectionChange).toHaveBeenCalledTimes(0);


      await user.click(item2);
      expect(onAction).toHaveBeenCalledWith('Two');
      expect(onSelectionChange).toHaveBeenCalledTimes(0);


      await user.click(item3);
      expect(onAction).toHaveBeenCalledWith('Three');
      expect(onSelectionChange).toHaveBeenCalledTimes(0);
    });

    it('Menu with generative list supports onAction', async function () {
      let user = userEvent.setup({delay: null, pointerMap});
      let onAction = jest.fn();
      let onSelectionChange = jest.fn();
      let flatItems = [
        {name: 'One'},
        {name: 'Two'},
        {name: 'Three'}
      ];
      let tree = render(
        <Provider theme={theme}>
          <Menu aria-label="menu" onSelectionChange={onSelectionChange} items={flatItems} onAction={onAction}>
            {item => <Item key={item.name}>{item.name}</Item>}
          </Menu>
        </Provider>
      );

      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');

      let [item1, item2, item3] = [
        within(menu).getByText('One'),
        within(menu).getByText('Two'),
        within(menu).getByText('Three')
      ];

      await user.click(item1);
      expect(onAction).toHaveBeenCalledWith('One');
      expect(onSelectionChange).toHaveBeenCalledTimes(0);


      await user.click(item2);
      expect(onAction).toHaveBeenCalledWith('Two');
      expect(onSelectionChange).toHaveBeenCalledTimes(0);


      await user.click(item3);
      expect(onAction).toHaveBeenCalledWith('Three');
      expect(onSelectionChange).toHaveBeenCalledTimes(0);
    });

    it('should support onAction on menu and menu items', async () => {
      let user = userEvent.setup({delay: null, pointerMap});
      let onAction = jest.fn();
      let itemAction = jest.fn();
      let {getAllByRole} = render(
        <Menu aria-label="Test" onAction={onAction}>
          <Item id="cat" onAction={itemAction}>Cat</Item>
          <Item id="dog">Dog</Item>
          <Item id="kangaroo">Kangaroo</Item>
        </Menu>
      );

      let items = getAllByRole('menuitem');
      await user.click(items[0]);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(itemAction).toHaveBeenCalledTimes(1);
    });

    it('should support onAction on menu and menu items in sections', async () => {
      let user = userEvent.setup({delay: null, pointerMap});
      let onAction = jest.fn();
      let itemAction = jest.fn();
      let {getAllByRole} = render(
        <Menu aria-label="Test" onAction={onAction}>
          <Section title="Animals">
            <Item id="cat" onAction={itemAction}>Cat</Item>
            <Item id="dog">Dog</Item>
            <Item id="kangaroo">Kangaroo</Item>
          </Section>
        </Menu>
      );

      let items = getAllByRole('menuitem');
      await user.click(items[0]);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(itemAction).toHaveBeenCalledTimes(1);
    });
  });

  it('supports complex menu items with aria-labelledby and aria-describedby', function () {
    let tree = render(
      <Provider theme={theme}>
        <Menu id={menuId} aria-label="menu" selectionMode="none">
          <Item textValue="Label">
            <Bell />
            <Text>Label</Text>
            <Text slot="description">Description</Text>
            <Keyboard>⌘V</Keyboard>
          </Item>
        </Menu>
      </Provider>
    );

    let menu = tree.getByRole('menu');
    let menuItem = within(menu).getByRole('menuitem');
    let label = within(menu).getByText('Label');
    let description = within(menu).getByText('Description');
    let keyboard = within(menu).getByText('⌘V');

    expect(menuItem).toHaveAttribute('aria-labelledby', label.id);
    expect(menuItem).toHaveAttribute('aria-describedby', `${description.id} ${keyboard.id}`);
  });

  it('supports aria-label on sections and items', function () {
    let tree = render(
      <Provider theme={theme}>
        <Menu aria-label="menu">
          <Section aria-label="Section">
            <Item aria-label="Item"><Bell /></Item>
          </Section>
        </Menu>
      </Provider>
    );

    let menu = tree.getByRole('menu');
    let group = within(menu).getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'Section');
    let menuItem = within(menu).getByRole('menuitem');
    expect(menuItem).toHaveAttribute('aria-label', 'Item');
    expect(menuItem).not.toHaveAttribute('aria-labelledby');
    expect(menuItem).not.toHaveAttribute('aria-describedby');
  });

  it('supports aria-label', function () {
    let tree = renderComponent(Menu, {}, {'aria-label': 'Test'});
    let menu = tree.getByRole('menu');
    expect(menu).toHaveAttribute('aria-label', 'Test');
  });

  it('warns user if no aria-label is provided', () => {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    renderComponent(Menu, {}, {'aria-labelledby': undefined});
    expect(spyWarn).toHaveBeenCalledWith('An aria-label or aria-labelledby prop is required for accessibility.');
  });

  it('supports custom data attributes', function () {
    let tree = renderComponent(Menu, {}, {'data-testid': 'test'});
    let menu = tree.getByRole('menu');
    expect(menu).toHaveAttribute('data-testid', 'test');
  });

  describe('supports links', function () {
    describe.each(['mouse', 'keyboard'])('%s', (type) => {
      it.each(['none', 'single', 'multiple'])('with selectionMode = %s', async function (selectionMode) {
        let user = userEvent.setup({delay: null, pointerMap});
        let onAction = jest.fn();
        let onSelectionChange = jest.fn();
        let tree = render(
          <Provider theme={theme}>
            <Menu aria-label="menu" selectionMode={selectionMode} onSelectionChange={onSelectionChange} onAction={onAction}>
              <Item href="https://google.com">One</Item>
              <Item href="https://adobe.com">Two</Item>
            </Menu>
          </Provider>
        );

        let role = {
          none: 'menuitem',
          single: 'menuitemradio',
          multiple: 'menuitemcheckbox'
        }[selectionMode];
        let items = tree.getAllByRole(role);
        expect(items).toHaveLength(2);
        expect(items[0].tagName).toBe('A');
        expect(items[0]).toHaveAttribute('href', 'https://google.com');
        expect(items[1].tagName).toBe('A');
        expect(items[1]).toHaveAttribute('href', 'https://adobe.com');

        let onClick = mockClickDefault();

        if (type === 'mouse') {
          await user.click(items[1]);
        } else {
          fireEvent.keyDown(items[1], {key: 'Enter'});
          fireEvent.keyUp(items[1], {key: 'Enter'});
        }
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalledTimes(1);
        window.removeEventListener('click', onClick);
      });
    });
  });
});
