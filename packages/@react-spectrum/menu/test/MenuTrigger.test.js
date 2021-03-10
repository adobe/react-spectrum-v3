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
import {Button} from '@react-spectrum/button';
import {Item, Menu, MenuTrigger, Section} from '../';
import {LONG_PRESS_DEFAULT_THRESHOLD_IN_MS} from '@react-aria/interactions';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import {triggerLongPress, triggerPress, triggerTouchPress} from '@react-spectrum/test-utils';
import V2Button from '@react/react-spectrum/Button';
import V2Dropdown from '@react/react-spectrum/Dropdown';
import {Menu as V2Menu, MenuItem as V2MenuItem} from '@react/react-spectrum/Menu';

let triggerText = 'Menu Button';

let withSection = [
  {name: 'Heading 1', children: [
    {name: 'Foo'},
    {name: 'Bar'},
    {name: 'Baz'}
  ]}
];

function renderComponent(Component, triggerProps = {}, menuProps = {}, buttonProps = {}) {
  if (Component === V2Dropdown) {
    return render(
      <Component {...triggerProps}>
        <V2Button
          variant="cta">
          {triggerText}
        </V2Button>
        <V2Menu {...menuProps}>
          <V2MenuItem value="foo">Foo</V2MenuItem>
          <V2MenuItem value="bar">Bar</V2MenuItem>
          <V2MenuItem value="baz">Baz</V2MenuItem>
        </V2Menu>
      </Component>
    );
  } else {
    return render(
      <Provider theme={theme}>
        <div data-testid="scrollable">
          <Component {...triggerProps}>
            <Button {...buttonProps}>
              {triggerText}
            </Button>
            <Menu items={withSection} {...menuProps}>
              {item => (
                <Section key={item.name} items={item.children} title={item.name}>
                  {item => <Item key={item.name} childItems={item.children}>{item.name}</Item>}
                </Section>
              )}
            </Menu>
          </Component>
        </div>
      </Provider>
    );
  }
}

describe('MenuTrigger', function () {
  let offsetWidth, offsetHeight;
  let onOpenChange = jest.fn();
  let onOpen = jest.fn();
  let onClose = jest.fn();
  let onSelect = jest.fn();
  let onSelectionChange = jest.fn();

  beforeAll(function () {
    offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => 1000);
    offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => 1000);
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    jest.spyOn(window.screen, 'width', 'get').mockImplementation(() => 1024);
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 0));
    jest.useFakeTimers();
  });

  afterEach(() => {
    onOpenChange.mockClear();
    onOpen.mockClear();
    onClose.mockClear();
    onSelect.mockClear();
    onSelectionChange.mockClear();
  });

  afterAll(function () {
    offsetWidth.mockReset();
    offsetHeight.mockReset();
  });

  function verifyMenuToggle(Component, triggerProps = {}, menuProps = {}, triggerEvent) {
    let tree = renderComponent(Component, triggerProps, menuProps);
    let triggerButton = tree.getByRole('button');

    if (Component === MenuTrigger) {
      expect(onOpenChange).toBeCalledTimes(0);
    } else {
      expect(onOpen).toBeCalledTimes(0);
      expect(onClose).toBeCalledTimes(0);
    }

    triggerEvent(triggerButton);
    jest.runAllTimers();

    let menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();
    expect(menu).toHaveAttribute('aria-labelledby', triggerButton.id);

    let menuItem1 = within(menu).getByText('Foo');
    let menuItem2 = within(menu).getByText('Bar');
    let menuItem3 = within(menu).getByText('Baz');
    expect(menuItem1).toBeTruthy();
    expect(menuItem2).toBeTruthy();
    expect(menuItem3).toBeTruthy();

    expect(triggerButton).toHaveAttribute('aria-expanded', 'true');
    expect(triggerButton).toHaveAttribute('aria-controls', menu.id);

    if (Component === MenuTrigger) {
      expect(onOpenChange).toBeCalledTimes(1);
    } else {
      expect(onOpen).toBeCalledTimes(1);
      expect(onClose).toBeCalledTimes(0);
    }

    triggerEvent(triggerButton, menu);
    jest.runAllTimers();
    expect(menu).not.toBeInTheDocument();

    if (Component === MenuTrigger) {
      expect(triggerButton).toHaveAttribute('aria-expanded', 'false');
      expect(onOpenChange).toBeCalledTimes(2);
    } else {
      expect(triggerButton).not.toHaveAttribute('aria-expanded');
      expect(onOpen).toBeCalledTimes(1);
    }
  }

  it.each`
    Name             | Component      | props
    ${'MenuTrigger'} | ${MenuTrigger} | ${{}}
    ${'V2Dropdown'}  | ${V2Dropdown}  | ${{}}
  `('$Name has default behavior (button renders, menu is closed)', function ({Component}) {
    let tree = renderComponent(Component);
    let triggerButton = tree.getByRole('button');
    expect(triggerButton).toBeTruthy();
    expect(triggerButton).toHaveAttribute('aria-haspopup', 'true');

    let buttonText = within(triggerButton).getByText(triggerText);
    expect(buttonText).toBeTruthy();

    let menuItem = tree.queryByText('Foo');
    expect(menuItem).toBeFalsy();

    if (Component === MenuTrigger) {
      expect(triggerButton).toHaveAttribute('aria-expanded', 'false');
      expect(triggerButton).toHaveAttribute('type', 'button');
    }
  });

  it.each`
    Name             | Component      | props
    ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange}}
    ${'V2Dropdown'}  | ${V2Dropdown}  | ${{onOpen, onClose}}
  `('$Name toggles the menu display on button click', function ({Component, props}) {
    verifyMenuToggle(Component, props, {}, (button) => triggerPress(button));
  });

  // Enter and Space keypress tests are ommitted since useMenuTrigger doesn't have space and enter cases in it's key down
  // since usePress handles those cases

  it.each`
    Name             | Component      | props
    ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange}}
  `('$Name can toggle the menu display via ArrowUp key', function ({Component, props}) {
    verifyMenuToggle(Component, props, {}, (button, menu) => {
      if (!menu) {
        fireEvent.keyDown(button, {key: 'ArrowUp', code: 38, charCode: 38});
      } else {
        fireEvent.keyDown(menu, {key: 'Escape'});
      }
    });
  });

  it.each`
    Name             | Component      | props
    ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange}}
  `('$Name can toggle the menu display via ArrowDown key', function ({Component, props}) {
    verifyMenuToggle(Component, props, {}, (button, menu) => {
      if (!menu) {
        fireEvent.keyDown(button, {key: 'ArrowDown', code: 40, charCode: 40});
      } else {
        fireEvent.keyDown(menu, {key: 'Escape'});
      }
    });
  });

  // New functionality in v3
  it.each`
    Name             | Component      | props
    ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange, isOpen: true}}
  `('$Name supports a controlled open state ', function ({Component, props}) {
    let tree = renderComponent(Component, props);
    expect(onOpenChange).toBeCalledTimes(0);

    let menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();

    let triggerButton = tree.getByText('Menu Button');
    triggerPress(triggerButton);
    act(() => {jest.runAllTimers();});

    menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();
    expect(onOpenChange).toBeCalledTimes(2); // once for press, once for blur :/
  });

  // New functionality in v3
  it.each`
    Name             | Component      | props
    ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange, defaultOpen: true}}
  `('$Name supports a uncontrolled default open state ', function ({Component, props}) {
    let tree = renderComponent(Component, props);
    expect(onOpenChange).toBeCalledTimes(0);

    let menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();

    let triggerButton = tree.getByText('Menu Button');
    triggerPress(triggerButton);
    act(() => {jest.runAllTimers();});

    expect(menu).not.toBeInTheDocument();
    expect(onOpenChange).toBeCalledTimes(1);
  });

  it.each`
    Name             | Component      | props
    ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange}}
  `('$Name does not trigger on disabled button', function ({Component, props}) {
    let tree = renderComponent(Component, props, {}, {isDisabled: true});
    let button = tree.getByRole('button');
    triggerPress(button);
    act(() => {jest.runAllTimers();});
    let menu = tree.queryByRole('menu');
    expect(menu).toBeNull();
    expect(onOpenChange).toBeCalledTimes(0);
  });

  describe('default focus behavior', function () {
    it.each`
      Name             | Component      | props
      ${'MenuTrigger'} | ${MenuTrigger} | ${{}}
    `('$Name autofocuses the selected item on menu open', function ({Component, props}) {
      let tree = renderComponent(Component, props, {selectedKeys: ['Bar']});
      let button = tree.getByRole('button');
      triggerPress(button);
      act(() => {jest.runAllTimers();});
      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      let menuItems = within(menu).getAllByRole('menuitem');
      let selectedItem = menuItems[1];
      expect(selectedItem).toBe(document.activeElement);
      triggerPress(button);
      act(() => {jest.runAllTimers();});

      expect(menu).not.toBeInTheDocument();

      // Opening menu via down arrow still autofocuses the selected item
      fireEvent.keyDown(button, {key: 'ArrowDown', code: 40, charCode: 40});
      menu = tree.getByRole('menu');
      menuItems = within(menu).getAllByRole('menuitem');
      selectedItem = menuItems[1];
      expect(selectedItem).toBe(document.activeElement);
      triggerPress(button);
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();

      // Opening menu via up arrow still autofocuses the selected item
      fireEvent.keyDown(button, {key: 'ArrowUp', code: 38, charCode: 38});
      menu = tree.getByRole('menu');
      menuItems = within(menu).getAllByRole('menuitem');
      selectedItem = menuItems[1];
      expect(selectedItem).toBe(document.activeElement);
    });

    it.each`
      Name             | Component      | props
      ${'MenuTrigger'} | ${MenuTrigger} | ${{}}
    `('$Name focuses the last item on ArrowUp if there isn\'t a selected item', function ({Component, props}) {
      let tree = renderComponent(Component, props, {});
      let button = tree.getByRole('button');
      fireEvent.keyDown(button, {key: 'ArrowUp', code: 38, charCode: 38});
      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitem');
      let selectedItem = menuItems[menuItems.length - 1];
      expect(selectedItem).toBe(document.activeElement);
    });

    it.each`
      Name             | Component      | props
      ${'MenuTrigger'} | ${MenuTrigger} | ${{}}
    `('$Name focuses the first item on ArrowDown if there isn\'t a selected item', function ({Component, props}) {
      let tree = renderComponent(Component, props, {});
      let button = tree.getByRole('button');
      fireEvent.keyDown(button, {key: 'ArrowDown', code: 40, charCode: 40});
      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitem');
      let selectedItem = menuItems[0];
      expect(selectedItem).toBe(document.activeElement);
    });

    it.each`
      Name             | Component      | props
      ${'MenuTrigger'} | ${MenuTrigger} | ${{}}
    `('$Name moves focus via ArrowDown and ArrowUp', function ({Component, props}) {
      let tree = render(
        <Provider theme={theme}>
          <div data-testid="scrollable">
            <MenuTrigger>
              <Button>
                {triggerText}
              </Button>
              <Menu>
                <Item key="1">One</Item>
                <Item key="">Two</Item>
                <Item key="3">Three</Item>
              </Menu>
            </MenuTrigger>
          </div>
        </Provider>
      );

      let button = tree.getByRole('button');
      fireEvent.keyDown(button, {key: 'ArrowDown', code: 40, charCode: 40});
      let menu = tree.getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitem');
      let selectedItem = menuItems[0];
      expect(selectedItem).toBe(document.activeElement);

      fireEvent.keyDown(menu, {key: 'ArrowDown', code: 40, charCode: 40});
      expect(menuItems[1]).toBe(document.activeElement);

      fireEvent.keyDown(menu, {key: 'ArrowDown', code: 40, charCode: 40});
      expect(menuItems[2]).toBe(document.activeElement);

      fireEvent.keyDown(menu, {key: 'ArrowUp', code: 38, charCode: 38});
      expect(menuItems[1]).toBe(document.activeElement);
    });
  });

  describe('menu popover closing behavior', function () {
    let tree;
    afterEach(() => {
      if (tree) {
        tree.unmount();
      }
      tree = null;
    });

    function openAndTriggerMenuItem(tree, isV3, role, selectionMode, triggerEvent) {
      let triggerButton = tree.getByRole('button');
      act(() => triggerPress(triggerButton));
      act(() => jest.runAllTimers());

      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();

      let menuItemRole = 'menuitem';
      if (isV3) {
        if (role === 'listbox') {
          menuItemRole = 'option';
        } else if (selectionMode === 'single') {
          menuItemRole = 'menuitemradio';
        } else if (selectionMode === 'multiple') {
          menuItemRole = 'menuitemcheckbox';
        }
      }

      let menuItems = within(menu).getAllByRole(menuItemRole);
      let itemToAction = menuItems[1];
      act(() => {
        triggerEvent(itemToAction);
      });
      act(() => jest.runAllTimers());
    }

    // New functionality in v3
    it.each`
      Name             | Component      | props
      ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange}}
    `('$Name closes the menu upon trigger body scroll', function ({Component, props}) {
      tree = renderComponent(Component, props);
      let button = tree.getByRole('button');
      triggerPress(button);
      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();

      let scrollable = tree.getByTestId('scrollable');
      fireEvent.scroll(scrollable);
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();
      expect(document.activeElement).toBe(button);
    });

    // Can't figure out why this isn't working for the v2 component
    it.each`
      Name             | Component      | props
      ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange}}
    `('$Name closes the menu upon clicking escape key', function ({Component, props}) {
      tree = renderComponent(Component, props);
      let button = tree.getByRole('button');
      triggerPress(button);
      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      fireEvent.keyDown(menu, {key: 'Escape', code: 27, charCode: 27});
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();
      expect(document.activeElement).toBe(button);
    });

    // Can't figure out why this isn't working for the v2 component
    it.each`
      Name             | Component      | props
      ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange}}
    `('$Name closes the menu upon clicking outside the menu', function ({Component, props}) {
      tree = renderComponent(Component, props);
      let button = tree.getByRole('button');
      triggerPress(button);
      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      fireEvent.mouseDown(document.body);
      fireEvent.mouseUp(document.body);
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();
      expect(document.activeElement).toBe(button);
    });

    it.each`
      Name             | Component      | props
      ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange, closeOnSelect: false}}
      ${'V2Dropdown'}  | ${V2Dropdown}  | ${{onOpen, onClose, onSelect, closeOnSelect: false}}
    `('$Name doesn\'t close on menu item selection if closeOnSelect=false', function ({Component, props}) {
      tree = renderComponent(Component, props, {selectionMode: 'single', onSelectionChange});
      expect(onOpenChange).toBeCalledTimes(0);
      let button = tree.getByRole('button');
      triggerPress(button);
      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      if (Component === MenuTrigger) {
        expect(onOpenChange).toBeCalledTimes(1);
        expect(onSelectionChange).toBeCalledTimes(0);
      } else {
        expect(onOpen).toBeCalledTimes(1);
        expect(onClose).toBeCalledTimes(0);
        expect(onSelect).toBeCalledTimes(0);
      }

      let menuItem1 = within(menu).getByText('Foo');
      expect(menuItem1).toBeTruthy();
      triggerPress(menuItem1);

      if (Component === MenuTrigger) {
        expect(onSelectionChange).toBeCalledTimes(1);
      } else {
        expect(onSelect).toBeCalledTimes(1);
      }

      expect(menu).toBeInTheDocument();

      if (Component === MenuTrigger) {
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(onOpenChange).toBeCalledTimes(1);
      } else {
        expect(button).toHaveAttribute('aria-expanded');
        expect(onOpen).toBeCalledTimes(1);
        expect(onClose).toBeCalledTimes(0);
      }
    });

    it.each`
      Name             | Component      | props
      ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange, closeOnSelect: false}}
    `('$Name doesn\'t closes menu on item selection via ENTER press if closeOnSelect=false', function ({Component, props}) {
      tree = renderComponent(Component, props, {selectionMode: 'single', onSelectionChange});
      expect(onOpenChange).toBeCalledTimes(0);
      let button = tree.getByRole('button');
      triggerPress(button);
      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onSelectionChange).toBeCalledTimes(0);


      let menuItem1 = within(menu).getByText('Foo');
      expect(menuItem1).toBeTruthy();
      fireEvent.keyDown(menuItem1, {key: 'Enter', code: 13, charCode: 13});
      fireEvent.keyUp(menuItem1, {key: 'Enter', code: 13, charCode: 13});
      act(() => {jest.runAllTimers();});
      expect(onSelectionChange).toBeCalledTimes(1);
      expect(menu).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(onOpenChange).toBeCalledTimes(1);
    });

    it.each`
      Name                      | Component      | props | menuProps
      ${'MenuTrigger single'}   | ${MenuTrigger} | ${{}} | ${{selectionMode: 'single'}}
      ${'MenuTrigger multiple'} | ${MenuTrigger} | ${{}} | ${{selectionMode: 'multiple'}}
      ${'MenuTrigger none'}     | ${MenuTrigger} | ${{}} | ${{selectionMode: 'none'}}
      ${'V2Dropdown single'}    | ${V2Dropdown}  | ${{}} | ${{selectionMode: 'single'}}
      ${'V2Dropdown multiple'}  | ${V2Dropdown}  | ${{}} | ${{selectionMode: 'multiple'}}
      ${'V2Dropdown none'}      | ${V2Dropdown}  | ${{}} | ${{selectionMode: 'none'}}
    `('$Name closes on menu item selection if toggled by mouse click', function ({Component, props, menuProps}) {
      tree = renderComponent(Component, props, menuProps);
      openAndTriggerMenuItem(tree, Component === MenuTrigger, props.role, menuProps.selectionMode, (item) => triggerPress(item));

      let menu = tree.queryByRole('menu');
      expect(menu).toBeNull();
      expect(document.activeElement).toBe(tree.getByRole('button'));
    });

    it.each`
      Name                      | Component      | props | menuProps
      ${'MenuTrigger single'}   | ${MenuTrigger} | ${{}} | ${{selectionMode: 'single'}}
      ${'MenuTrigger multiple'} | ${MenuTrigger} | ${{}} | ${{selectionMode: 'multiple'}}
      ${'MenuTrigger none'}     | ${MenuTrigger} | ${{}} | ${{selectionMode: 'none'}}
      ${'V2Dropdown single'}    | ${V2Dropdown}  | ${{}} | ${{selectionMode: 'single'}}
      ${'V2Dropdown multiple'}  | ${V2Dropdown}  | ${{}} | ${{selectionMode: 'multiple'}}
      ${'V2Dropdown none'}      | ${V2Dropdown}  | ${{}} | ${{selectionMode: 'none'}}
    `('$Name closes on menu item selection if toggled by ENTER key', function ({Component, props, menuProps}) {
      tree = renderComponent(Component, props, menuProps);
      openAndTriggerMenuItem(tree, Component === MenuTrigger, props.role, menuProps.selectionMode, (item) => fireEvent.keyDown(item, {key: 'Enter', code: 13, charCode: 13}));

      let menu = tree.queryByRole('menu');
      expect(menu).toBeNull();
      expect(document.activeElement).toBe(tree.getByRole('button'));
    });

    // V3 exclusive
    it.each`
      Name                      | Component      | props | menuProps
      ${'MenuTrigger single'}   | ${MenuTrigger} | ${{}} | ${{selectionMode: 'single'}}
      ${'MenuTrigger multiple'} | ${MenuTrigger} | ${{}} | ${{selectionMode: 'multiple'}}
    `('$Name doesn\'t close on menu item selection if toggled by SPACE key (all selection modes except "none")', function ({Component, props, menuProps}) {
      tree = renderComponent(Component, props, menuProps);
      openAndTriggerMenuItem(tree, true, props.role, menuProps.selectionMode, (item) => fireEvent.keyDown(item, {key: ' ', code: 32, charCode: 32}));

      let menu = tree.queryByRole('menu');
      expect(menu).toBeTruthy();
    });

    it.each`
      Name                  | Component      | props | menuProps
      ${'MenuTrigger none'} | ${MenuTrigger} | ${{}} | ${{selectionMode: 'none'}}
      ${'V2Dropdown none'}  | ${V2Dropdown}  | ${{}} | ${{selectionMode: 'none'}}
    `('$Name closes on menu item selection if toggled by SPACE key (selectionMode=none)', function ({Component, props, menuProps}) {
      tree = renderComponent(Component, props, menuProps);
      openAndTriggerMenuItem(tree, Component === MenuTrigger, props.role, menuProps.selectionMode, (item) => fireEvent.keyDown(item, {key: ' ', code: 32, charCode: 32}));

      let menu = tree.queryByRole('menu');
      expect(menu).toBeNull();
      expect(document.activeElement).toBe(tree.getByRole('button'));
    });

    // V3 exclusive
    it.each`
      Name             | Component      | props
      ${'MenuTrigger'} | ${MenuTrigger} | ${{onOpenChange}}
    `('$Name closes the menu when blurring the menu', function ({Component, props}) {
      tree = renderComponent(Component, props, {});
      expect(onOpenChange).toBeCalledTimes(0);
      let button = tree.getByRole('button');
      triggerPress(button);
      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      act(() => {document.activeElement.blur();});
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(onOpenChange).toBeCalledTimes(2);
    });

    it.each`
      Name                      | Component      | props | menuProps
      ${'MenuTrigger single'}   | ${MenuTrigger} | ${{}} | ${{selectionMode: 'single'}}
      ${'MenuTrigger multiple'} | ${MenuTrigger} | ${{}} | ${{selectionMode: 'multiple'}}
      ${'MenuTrigger none'}     | ${MenuTrigger} | ${{}} | ${{selectionMode: 'none'}}
    `('$Name ignores repeating keyboard events', function ({Component, props, menuProps}) {
      tree = renderComponent(Component, props, menuProps);
      openAndTriggerMenuItem(tree, Component === MenuTrigger, props.role, menuProps.selectionMode, (item) => fireEvent.keyDown(item, {key: 'Enter', code: 13, charCode: 13, repeat: true}));

      let menu = tree.queryByRole('menu');
      expect(menu).toBeTruthy();
    });

    it('tabs to the next element after the trigger and closes the menu', function () {
      tree = render(
        <Provider theme={theme}>
          <input data-testid="before-input" />
          <MenuTrigger onOpenChange={onOpenChange}>
            <Button>
              {triggerText}
            </Button>
            <Menu items={withSection}>
              {item => (
                <Section key={item.name} items={item.children} title={item.name}>
                  {item => <Item key={item.name} childItems={item.children}>{item.name}</Item>}
                </Section>
              )}
            </Menu>
          </MenuTrigger>
          <input data-testid="after-input" />
        </Provider>
      );

      let button = tree.getByRole('button');
      triggerPress(button);
      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      fireEvent.keyDown(document.activeElement, {key: 'Tab'});
      act(() => {jest.runAllTimers();});

      expect(document.activeElement).toBe(tree.getByTestId('after-input'));

      expect(menu).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(onOpenChange).toBeCalledTimes(2);
    });

    it('should have a hidden dismiss button for screen readers', function () {
      let {getByRole, getAllByLabelText} = render(
        <Provider theme={theme}>
          <MenuTrigger onOpenChange={onOpenChange}>
            <Button>
              {triggerText}
            </Button>
            <Menu items={withSection}>
              {item => (
                <Section key={item.name} items={item.children} title={item.name}>
                  {item => <Item key={item.name} childItems={item.children}>{item.name}</Item>}
                </Section>
              )}
            </Menu>
          </MenuTrigger>
        </Provider>
      );

      let button = getByRole('button');
      act(() => {
        triggerPress(button);
      });
      act(() => jest.runAllTimers());

      let menu = getByRole('menu');
      expect(menu).toBeTruthy();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      let buttons = getAllByLabelText('Dismiss');
      expect(buttons.length).toBe(2);

      act(() => {
        fireEvent.click(buttons[0]);
      });
      act(() => jest.runAllTimers());
      expect(onOpenChange).toHaveBeenCalledTimes(2);

      expect(menu).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(document.activeElement).toBe(button);
    });

    it('should forward ref to the button', function () {
      let ref = React.createRef();
      let {getByRole} = render(
        <Provider theme={theme}>
          <MenuTrigger ref={ref}>
            <Button>
              {triggerText}
            </Button>
            <Menu items={withSection}>
              {item => (
                <Section key={item.name} items={item.children} title={item.name}>
                  {item => <Item key={item.name} childItems={item.children}>{item.name}</Item>}
                </Section>
              )}
            </Menu>
          </MenuTrigger>
        </Provider>
      );

      expect(ref.current.UNSAFE_getDOMNode()).toBe(getByRole('button'));
    });

    it('works with a ref on both the button and menu trigger', function () {
      let menuTriggerRef = React.createRef();
      let buttonRef = React.createRef();
      let {getByRole} = render(
        <Provider theme={theme}>
          <MenuTrigger ref={menuTriggerRef}>
            <Button ref={buttonRef}>
              {triggerText}
            </Button>
            <Menu items={withSection}>
              {item => (
                <Section key={item.name} items={item.children} title={item.name}>
                  {item => <Item key={item.name} childItems={item.children}>{item.name}</Item>}
                </Section>
              )}
            </Menu>
          </MenuTrigger>
        </Provider>
      );

      expect(menuTriggerRef.current.UNSAFE_getDOMNode()).toBe(getByRole('button'));
      expect(buttonRef.current.UNSAFE_getDOMNode()).toBe(getByRole('button'));
    });
  });

  it('should not show checkmarks if selectionMode not defined', function () {
    let {queryByRole} = render(
      <Menu aria-label="foo" selectedKeys={['alpha']}>
        <Item key="alpha">Alpha</Item>
        <Item key="bravo">Bravo</Item>
      </Menu>
    );
    let checkmark = queryByRole('img', {hidden: true});
    expect(checkmark).toBeNull();
  });

  describe('MenuTrigger trigger="longPress" behaviour', function () { 
    it('MenuTrigger toggles the menu display on mouse down longPress', function () {
      const props = {onOpenChange, trigger: 'longPress'};
      verifyMenuToggle(MenuTrigger, props, {}, (button, menu) => {
        if (menu) {
          triggerPress(button);
        } else {
          triggerLongPress(button, 'mouse');
        }
      });
    });
  
    it('MenuTrigger toggles the menu display on touch longPress', function () {
      const props = {onOpenChange, trigger: 'longPress'};
      verifyMenuToggle(MenuTrigger, props, {}, (button, menu) => {
        if (menu) {
          triggerTouchPress(button);
        } else {
          triggerLongPress(button, 'touch');
        }
      });
    });

    it('MenuTrigger toggles the menu display on Alt+ArrowDown key (LongPress Alternative)', function () {
      const props = {onOpenChange, trigger: 'longPress'};
      verifyMenuToggle(MenuTrigger, props, {}, (button, menu) => {
        if (menu) {
          triggerPress(button);
        } else {
          fireEvent.keyDown(button, {key: 'ArrowDown', altKey: true});
        }
      });
    });

    it('MenuTrigger toggles the menu display on Alt+ArrowUp key (LongPress Alternative)', function () {
      const props = {onOpenChange, trigger: 'longPress'};
      verifyMenuToggle(MenuTrigger, props, {}, (button, menu) => {
        if (menu) {
          triggerPress(button);
        } else {
          fireEvent.keyDown(button, {key: 'ArrowUp', altKey: true});
        }
      });
    });

    it(`Verifies long press duration behaviour (Set to ${LONG_PRESS_DEFAULT_THRESHOLD_IN_MS}ms)`, function () {
      let menuNotFoundError = new Error('Menu not found');
      const props = {onOpenChange, trigger: 'longPress'};
      let tree = renderComponent(MenuTrigger, props, {});
      let triggerButton = tree.getByRole('button');

      const callback = () => {
        try {
          let menu = tree.getByRole('menu');
          expect(menu).toBeTruthy();
          expect(menu).toHaveAttribute('aria-labelledby', triggerButton.id);
        } catch (e) {
          throw menuNotFoundError;
        }
      };

      act(() => {
        fireEvent.mouseDown(triggerButton, {detail: 1});

        setTimeout(() => {
          expect(callback).toThrowError(menuNotFoundError);
        }, LONG_PRESS_DEFAULT_THRESHOLD_IN_MS / 2);

        setTimeout(() => {
          expect(callback).not.toThrowError(menuNotFoundError);
        }, LONG_PRESS_DEFAULT_THRESHOLD_IN_MS);

        jest.runAllTimers();
      });
    });

    describe('MenuTrigger longPress focus behaviour', function () {
      it('MenuTrigger autofocuses the selected item on menu open', function () {
        let tree = renderComponent(MenuTrigger, {trigger: 'longPress'}, {selectedKeys: ['Bar']});
        let button = tree.getByRole('button');
        
        act(() => {
          fireEvent.mouseDown(button, {detail: 1});
          jest.runAllTimers();
        });

        let menu = tree.getByRole('menu');
        expect(menu).toBeTruthy();
        let menuItems = within(menu).getAllByRole('menuitem');
        let selectedItem = menuItems[1];
        expect(selectedItem).toBe(document.activeElement);
      
        act(() => {
          triggerPress(button);
          jest.runAllTimers();
        });

        expect(menu).not.toBeInTheDocument();

        // Opening menu via up alt+arrowUp still autofocuses the selected item
        fireEvent.keyDown(button, {key: 'ArrowUp', altKey: true});
        menu = tree.getByRole('menu');
        menuItems = within(menu).getAllByRole('menuitem');
        selectedItem = menuItems[1];
        expect(selectedItem).toBe(document.activeElement);
        act(() => {
          triggerPress(button);
          jest.runAllTimers();
        });
        expect(menu).not.toBeInTheDocument();

        // Opening menu via up alt+arrowDown still autofocuses the selected item
        fireEvent.keyDown(button, {key: 'ArrowDown', altKey: true});
        menu = tree.getByRole('menu');
        menuItems = within(menu).getAllByRole('menuitem');
        selectedItem = menuItems[1];
        expect(selectedItem).toBe(document.activeElement);
      });

      
      it('MenuTrigger focuses the first item on Alt+ArrowDown if there isn\'t a selected item', function () {
        let tree = renderComponent(MenuTrigger, {trigger: 'longPress'}, {});
        let button = tree.getByRole('button');
        fireEvent.keyDown(button, {key: 'ArrowDown', altKey: true});
        let menu = tree.getByRole('menu');
        expect(menu).toBeTruthy();
        let menuItems = within(menu).getAllByRole('menuitem');
        let selectedItem = menuItems[0];
        expect(selectedItem).toBe(document.activeElement);
      });

      it('MenuTrigger focuses the last item on Alt+ArrowUp if there isn\'t a selected item', function () {
        let tree = renderComponent(MenuTrigger, {trigger: 'longPress'}, {});
        let button = tree.getByRole('button');
        fireEvent.keyDown(button, {key: 'ArrowUp', altKey: true});
        let menu = tree.getByRole('menu');
        expect(menu).toBeTruthy();
        let menuItems = within(menu).getAllByRole('menuitem');
        let selectedItem = menuItems[menuItems.length - 1];
        expect(selectedItem).toBe(document.activeElement);
      });
    });
  });
});
