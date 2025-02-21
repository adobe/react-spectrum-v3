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

import {act, fireEvent, mockClickDefault, pointerMap, render, within} from '@react-spectrum/test-utils-internal';
import {AriaMenuTests} from './AriaMenu.test-util';
import {Button, Collection, Header, Heading, Input, Keyboard, Label, Menu, MenuContext, MenuItem, MenuSection, MenuTrigger, Popover, Pressable, Separator, SubmenuTrigger, Text, TextField} from '..';
import React, {useState} from 'react';
import {Selection, SelectionMode} from '@react-types/shared';
import {UNSTABLE_PortalProvider} from '@react-aria/overlays';
import {User} from '@react-aria/test-utils';
import userEvent from '@testing-library/user-event';

let TestMenu = ({menuProps = {}, itemProps = {}, hasSubmenu, hasNestedSubmenu}: {menuProps?: any, itemProps?: any, hasSubmenu?: boolean, hasNestedSubmenu?: any}) => (
  <Menu aria-label="Test" {...menuProps}>
    <MenuItem {...itemProps} id="cat">Cat</MenuItem>
    <MenuItem {...itemProps} id="dog">Dog</MenuItem>
    <MenuItem {...itemProps} id="kangaroo">Kangaroo</MenuItem>
    {hasSubmenu && (
      <SubmenuTrigger>
        <MenuItem {...itemProps} id="submenu-trigger">Submenu Trigger</MenuItem>
        <Popover>
          <Menu>
            <MenuItem {...itemProps} id="submenu-item-1">Submenu Item 1</MenuItem>
            <MenuItem {...itemProps} id="submenu-item-2">Submenu Item 2</MenuItem>
            <MenuItem {...itemProps} id="submenu-item-3">Submenu Item 3</MenuItem>
            {hasNestedSubmenu && (
              <SubmenuTrigger>
                <MenuItem {...itemProps} id="nested-submenu-trigger">Nested Submenu Trigger</MenuItem>
                <Popover>
                  <Menu>
                    <MenuItem {...itemProps} id="nested-submenu-item-1">Nested Submenu Item 1</MenuItem>
                    <MenuItem {...itemProps} id="nested-submenu-item-2">Nested Submenu Item 2</MenuItem>
                    <MenuItem {...itemProps} id="nested-submenu-item-3">Nested Submenu Item 3</MenuItem>
                  </Menu>
                </Popover>
              </SubmenuTrigger>
            )}
          </Menu>
        </Popover>
      </SubmenuTrigger>
    )}
  </Menu>
);

let renderMenu = (menuProps = {}, itemProps = {}) => render(<TestMenu {...{menuProps, itemProps}} />);

describe('Menu', () => {
  let user;
  let testUtilUser = new User();

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {jest.runAllTimers();});
  });

  it('should have the base set of aria and data attributes', () => {
    let {getByRole, getAllByRole} = render(
      <Menu aria-label="Animals">
        <MenuItem id="cat">Cat</MenuItem>
        <MenuItem id="dog">Dog</MenuItem>
        <MenuItem id="kangaroo">Kangaroo</MenuItem>
        <MenuSection>
          <Header>Fish</Header>
          <MenuItem id="salmon">Salmon</MenuItem>
          <MenuItem id="tuna">Tuna</MenuItem>
          <MenuItem id="cod">Cod</MenuItem>
        </MenuSection>
      </Menu>
    );
    let menu = getByRole('menu');
    expect(menu).toHaveAttribute('data-rac');

    for (let group of getAllByRole('group')) {
      expect(group).toHaveAttribute('data-rac');
    }

    for (let menuitem of getAllByRole('menuitem')) {
      expect(menuitem).toHaveAttribute('data-rac');
    }
  });

  it('should render with default classes', () => {
    let {getByRole, getAllByRole} = renderMenu();
    let menu = getByRole('menu');
    expect(menu).toHaveAttribute('class', 'react-aria-Menu');

    for (let menuitem of getAllByRole('menuitem')) {
      expect(menuitem).toHaveAttribute('class', 'react-aria-MenuItem');
    }
  });

  it('should render with custom classes', () => {
    let {getByRole, getAllByRole} = renderMenu({className: 'menu'}, {className: 'item'});
    let menu = getByRole('menu');
    expect(menu).toHaveAttribute('class', 'menu');

    for (let menuitem of getAllByRole('menuitem')) {
      expect(menuitem).toHaveAttribute('class', 'item');
    }
  });

  it('should support DOM props', () => {
    let {getByRole, getAllByRole} = renderMenu({'data-foo': 'bar'}, {'data-bar': 'foo'});
    let menu = getByRole('menu');
    expect(menu).toHaveAttribute('data-foo', 'bar');

    for (let menuitem of getAllByRole('menuitem')) {
      expect(menuitem).toHaveAttribute('data-bar', 'foo');
    }
  });

  it('should support the slot prop', () => {
    let {getByRole} = render(
      <MenuContext.Provider value={{slots: {test: {'aria-label': 'test'}}}}>
        <TestMenu menuProps={{slot: 'test', 'aria-label': undefined}} />
      </MenuContext.Provider>
    );

    let menu = getByRole('menu');
    expect(menu).toHaveAttribute('slot', 'test');
    expect(menu).toHaveAttribute('aria-label', 'test');
  });

  it('should support refs', () => {
    let listBoxRef = React.createRef<HTMLDivElement>();
    let sectionRef = React.createRef<HTMLDivElement>();
    let itemRef = React.createRef<HTMLDivElement>();
    render(
      <Menu aria-label="Test" ref={listBoxRef}>
        <MenuSection ref={sectionRef} aria-label="Felines">
          <MenuItem ref={itemRef}>Cat</MenuItem>
        </MenuSection>
      </Menu>
    );
    expect(listBoxRef.current).toBeInstanceOf(HTMLElement);
    expect(sectionRef.current).toBeInstanceOf(HTMLElement);
    expect(itemRef.current).toBeInstanceOf(HTMLElement);
    expect(sectionRef.current).toHaveAttribute('aria-label', 'Felines');
  });

  it('should support hover', async () => {
    let onHoverStart = jest.fn();
    let onHoverChange = jest.fn();
    let onHoverEnd = jest.fn();
    let {getAllByRole} = renderMenu({}, {className: ({isHovered}) => isHovered ? 'hover' : '', onHoverStart, onHoverChange, onHoverEnd});
    let item = getAllByRole('menuitem')[0];

    expect(item).not.toHaveAttribute('data-hovered');
    expect(item).not.toHaveClass('hover');

    await user.hover(item);
    expect(item).toHaveAttribute('data-hovered', 'true');
    expect(item).toHaveClass('hover');
    expect(onHoverStart).toHaveBeenCalledTimes(1);
    expect(onHoverChange).toHaveBeenCalledTimes(1);

    await user.unhover(item);
    expect(item).not.toHaveAttribute('data-hovered');
    expect(item).not.toHaveClass('hover');
    expect(onHoverEnd).toHaveBeenCalledTimes(1);
    expect(onHoverChange).toHaveBeenCalledTimes(2);
  });

  it('should not show hover state when item is not interactive', async () => {
    let onHoverStart = jest.fn();
    let onHoverChange = jest.fn();
    let onHoverEnd = jest.fn();
    let {getAllByRole} = renderMenu({disabledKeys: ['cat', 'dog', 'kangaroo']}, {className: ({isHovered}) => isHovered ? 'hover' : '', onHoverStart, onHoverChange, onHoverEnd});
    let item = getAllByRole('menuitem')[0];

    expect(item).not.toHaveAttribute('data-hovered');
    expect(item).not.toHaveClass('hover');
    expect(onHoverStart).not.toHaveBeenCalled();
    expect(onHoverChange).not.toHaveBeenCalled();
    expect(onHoverEnd).not.toHaveBeenCalled();

    await user.hover(item);
    expect(item).not.toHaveAttribute('data-hovered');
    expect(item).not.toHaveClass('hover');
    expect(onHoverStart).not.toHaveBeenCalled();
    expect(onHoverChange).not.toHaveBeenCalled();
    expect(onHoverEnd).not.toHaveBeenCalled();
  });

  it('should support slots', () => {
    let {getByRole} = render(
      <Menu aria-label="Actions">
        <MenuItem textValue="Copy">
          <Text slot="label">Copy</Text>
          <Text slot="description">Copy the selected text</Text>
          <Keyboard>⌘C</Keyboard>
        </MenuItem>
      </Menu>
    );

    let menuitem = getByRole('menuitem');
    expect(menuitem).toHaveAttribute('aria-labelledby');
    expect(document.getElementById(menuitem.getAttribute('aria-labelledby')!)).toHaveTextContent('Copy');
    expect(menuitem).toHaveAttribute('aria-describedby');
    expect((menuitem.getAttribute('aria-describedby')!).split(' ')
      .map(o => (document.getElementById(o)!).textContent).join(' ')).toBe('Copy the selected text ⌘C');
  });

  it('should support separators', () => {
    let {getByRole} = render(
      <Menu aria-label="Actions">
        <MenuItem>Foo</MenuItem>
        <Separator />
        <MenuItem>Bar</MenuItem>
      </Menu>
    );

    let separator = getByRole('separator');
    expect(separator).toHaveClass('react-aria-Separator');
  });

  it('should support separators with custom class names', () => {
    let {getByRole} = render(
      <Menu aria-label="Actions">
        <MenuItem>Foo</MenuItem>
        <Separator className="my-separator" />
        <MenuItem>Bar</MenuItem>
      </Menu>
    );

    let separator = getByRole('separator');
    expect(separator).toHaveClass('my-separator');
  });

  it('should support sections', () => {
    let {getAllByRole} = render(
      <Menu aria-label="Sandwich contents" selectionMode="multiple">
        <MenuSection>
          <Header>Veggies</Header>
          <MenuItem id="lettuce">Lettuce</MenuItem>
          <MenuItem id="tomato">Tomato</MenuItem>
          <MenuItem id="onion">Onion</MenuItem>
        </MenuSection>
        <MenuSection>
          <Header>Protein</Header>
          <MenuItem id="ham">Ham</MenuItem>
          <MenuItem id="tuna">Tuna</MenuItem>
          <MenuItem id="tofu">Tofu</MenuItem>
        </MenuSection>
      </Menu>
    );

    let groups = getAllByRole('group');
    expect(groups).toHaveLength(2);

    expect(groups[0]).toHaveClass('react-aria-MenuSection');
    expect(groups[1]).toHaveClass('react-aria-MenuSection');

    expect(groups[0]).toHaveAttribute('aria-labelledby');
    expect(document.getElementById(groups[0].getAttribute('aria-labelledby')!)).toHaveTextContent('Veggies');
  });

  it('should support dynamic collections', () => {
    let items = [
      {id: 'cat', name: 'Cat'},
      {id: 'dog', name: 'Dog'}
    ];

    let {getAllByRole} = render(
      <Menu aria-label="Test" items={items}>
        {(item) => <MenuItem id={item.id}>{item.name}</MenuItem>}
      </Menu>
    );

    expect(getAllByRole('menuitem').map((it) => it.textContent)).toEqual(['Cat', 'Dog']);
  });

  it('should support focus ring', async () => {
    let {getAllByRole} = renderMenu({}, {className: ({isFocusVisible}) => isFocusVisible ? 'focus' : ''});
    let menuitem = getAllByRole('menuitem')[0];

    expect(menuitem).not.toHaveAttribute('data-focus-visible');
    expect(menuitem).not.toHaveClass('focus');

    await user.tab();
    expect(document.activeElement).toBe(menuitem);
    expect(menuitem).toHaveAttribute('data-focus-visible', 'true');
    expect(menuitem).toHaveClass('focus');

    fireEvent.keyDown(menuitem, {key: 'ArrowDown'});
    fireEvent.keyUp(menuitem, {key: 'ArrowDown'});
    expect(menuitem).not.toHaveAttribute('data-focus-visible');
    expect(menuitem).not.toHaveClass('focus');
  });

  it('should support press state', async () => {
    let {getAllByRole} = renderMenu({}, {className: ({isPressed}) => isPressed ? 'pressed' : ''});
    let menuitem = getAllByRole('menuitem')[0];

    expect(menuitem).not.toHaveAttribute('data-pressed');
    expect(menuitem).not.toHaveClass('pressed');

    await user.pointer({target: menuitem, keys: '[MouseLeft>]'});
    expect(menuitem).toHaveAttribute('data-pressed', 'true');
    expect(menuitem).toHaveClass('pressed');

    await user.pointer({target: menuitem, keys: '[/MouseLeft]'});
    expect(menuitem).not.toHaveAttribute('data-pressed');
    expect(menuitem).not.toHaveClass('pressed');
  });

  it('should support selection state', async () => {
    let {getAllByRole} = renderMenu({selectionMode: 'multiple'}, {className: ({isSelected}) => isSelected ? 'selected' : ''});
    let menuitem = getAllByRole('menuitemcheckbox')[0];

    expect(menuitem).not.toHaveAttribute('aria-checked', 'true');
    expect(menuitem).not.toHaveClass('selected');

    await user.click(menuitem);
    expect(menuitem).toHaveAttribute('aria-checked', 'true');
    expect(menuitem).toHaveClass('selected');

    await user.click(menuitem);
    expect(menuitem).not.toHaveAttribute('aria-checked', 'true');
    expect(menuitem).not.toHaveClass('selected');
  });

  it('should support section-level selection', async () => {
    function Example() {
      let [veggies, setVeggies] = useState<Selection>(new Set(['lettuce']));
      let [protein, setProtein] = useState<Selection>(new Set(['ham']));
      return (
        <Menu aria-label="Sandwich contents" selectionMode="multiple">
          <MenuSection selectionMode="multiple" selectedKeys={veggies} onSelectionChange={setVeggies}>
            <MenuItem id="lettuce">Lettuce</MenuItem>
            <MenuItem id="tomato">Tomato</MenuItem>
            <MenuItem id="onion">Onion</MenuItem>
          </MenuSection>
          <MenuSection selectionMode="single" selectedKeys={protein} onSelectionChange={setProtein}>
            <MenuItem id="ham">Ham</MenuItem>
            <MenuItem id="tuna">Tuna</MenuItem>
            <MenuItem id="tofu">Tofu</MenuItem>
          </MenuSection>
        </Menu>
      );
    }

    let {getAllByRole} = render(<Example />);
    let checkboxes = getAllByRole('menuitemcheckbox');

    expect(checkboxes).toHaveLength(3);
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true');
    expect(checkboxes[1]).toHaveAttribute('aria-checked', 'false');
    expect(checkboxes[2]).toHaveAttribute('aria-checked', 'false');

    await user.click(checkboxes[1]);
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true');
    expect(checkboxes[1]).toHaveAttribute('aria-checked', 'true');
    expect(checkboxes[2]).toHaveAttribute('aria-checked', 'false');

    let radios = getAllByRole('menuitemradio');

    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');
    expect(radios[2]).toHaveAttribute('aria-checked', 'false');

    await user.click(radios[1]);
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[2]).toHaveAttribute('aria-checked', 'false');

    act(() => checkboxes[0].focus());
    let sequence = checkboxes.slice(1).concat(radios);
    for (let item of sequence) {
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(item);
    }
  });

  it('should support disabled state', () => {
    let {getAllByRole} = renderMenu({disabledKeys: ['cat']}, {className: ({isDisabled}) => isDisabled ? 'disabled' : ''});
    let menuitem = getAllByRole('menuitem')[0];

    expect(menuitem).toHaveAttribute('aria-disabled', 'true');
    expect(menuitem).toHaveClass('disabled');
  });

  it('should support isDisabled prop on items', async () => {
    let {getAllByRole} = render(
      <Menu aria-label="Test">
        <MenuItem id="cat">Cat</MenuItem>
        <MenuItem id="dog" isDisabled>Dog</MenuItem>
        <MenuItem id="kangaroo">Kangaroo</MenuItem>
      </Menu>
    );
    let items = getAllByRole('menuitem');
    expect(items[1]).toHaveAttribute('aria-disabled', 'true');

    await user.tab();
    expect(document.activeElement).toBe(items[0]);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[2]);
  });

  it('should support onAction on items', async () => {
    let onAction = jest.fn();
    let {getAllByRole} = render(
      <Menu aria-label="Test">
        <MenuItem id="cat" onAction={onAction}>Cat</MenuItem>
        <MenuItem id="dog">Dog</MenuItem>
        <MenuItem id="kangaroo">Kangaroo</MenuItem>
      </Menu>
    );
    let items = getAllByRole('menuitem');
    await user.click(items[0]);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should support onAction on menu and menu items', async () => {
    let onAction = jest.fn();
    let itemAction = jest.fn();
    let {getAllByRole} = render(
      <Menu aria-label="Test" onAction={onAction}>
        <MenuItem id="cat" onAction={itemAction}>Cat</MenuItem>
        <MenuItem id="dog">Dog</MenuItem>
        <MenuItem id="kangaroo">Kangaroo</MenuItem>
      </Menu>
    );

    let items = getAllByRole('menuitem');
    await user.click(items[0]);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(itemAction).toHaveBeenCalledTimes(1);
  });

  it('should support menu trigger', async () => {
    let onAction = jest.fn();
    let {getByRole, getAllByRole} = render(
      <MenuTrigger>
        <Button aria-label="Menu">☰</Button>
        <Popover>
          <Menu onAction={onAction}>
            <MenuItem id="open">Open</MenuItem>
            <MenuItem id="rename">Rename…</MenuItem>
            <MenuItem id="duplicate">Duplicate</MenuItem>
            <MenuItem id="share">Share…</MenuItem>
            <MenuItem id="delete">Delete…</MenuItem>
          </Menu>
        </Popover>
      </MenuTrigger>
    );

    let button = getByRole('button');
    expect(button).not.toHaveAttribute('data-pressed');

    await user.click(button);
    expect(button).toHaveAttribute('data-pressed');

    let menu = getByRole('menu');
    expect(getAllByRole('menuitem')).toHaveLength(5);

    let popover = menu.closest('.react-aria-Popover');
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveAttribute('data-trigger', 'MenuTrigger');

    await user.click(getAllByRole('menuitem')[1]);
    expect(onAction).toHaveBeenLastCalledWith('rename');
  });

  it('should support onScroll', () => {
    let onScroll = jest.fn();
    let {getByRole} = renderMenu({onScroll});
    let menu = getByRole('menu');
    fireEvent.scroll(menu);
    expect(onScroll).toHaveBeenCalled();
  });

  describe('supports links', function () {
    describe.each(['mouse', 'keyboard'])('%s', (type) => {
      it.each(['none', 'single', 'multiple'] as unknown as SelectionMode[])('with selectionMode = %s', async function (selectionMode) {
        let onAction = jest.fn();
        let onSelectionChange = jest.fn();
        let tree = render(
          <Menu aria-label="menu" selectionMode={selectionMode} onSelectionChange={onSelectionChange} onAction={onAction}>
            <MenuItem href="https://google.com">One</MenuItem>
            <MenuItem href="https://adobe.com">Two</MenuItem>
          </Menu>
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
        document.removeEventListener('click', onClick);
      });
    });
  });

  describe('Submenus', function () {
    it('should support a submenu trigger', async () => {
      let onAction = jest.fn();
      let {getByRole, getAllByRole} = render(
        <MenuTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Menu onAction={onAction}>
              <MenuItem id="open">Open</MenuItem>
              <MenuItem id="rename">Rename…</MenuItem>
              <MenuItem id="duplicate">Duplicate</MenuItem>
              <SubmenuTrigger>
                <MenuItem id="share">Share…</MenuItem>
                <Popover>
                  <Menu onAction={onAction}>
                    <MenuItem id="email">Email</MenuItem>
                    <MenuItem id="sms">SMS</MenuItem>
                    <MenuItem id="x">X</MenuItem>
                  </Menu>
                </Popover>
              </SubmenuTrigger>
              <MenuItem id="delete">Delete…</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      );

      let button = getByRole('button');
      expect(button).not.toHaveAttribute('data-pressed');

      await user.click(button);
      expect(button).toHaveAttribute('data-pressed');

      let menu = getAllByRole('menu')[0];
      expect(getAllByRole('menuitem')).toHaveLength(5);

      let popover = menu.closest('.react-aria-Popover');
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveAttribute('data-trigger', 'MenuTrigger');

      let triggerItem = getAllByRole('menuitem')[3];
      expect(triggerItem).toHaveTextContent('Share…');
      expect(triggerItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'false');
      expect(triggerItem).toHaveAttribute('data-has-submenu', 'true');
      expect(triggerItem).not.toHaveAttribute('data-open');

      // Open the submenu
      await user.pointer({target: triggerItem});
      act(() => {jest.runAllTimers();});
      expect(triggerItem).toHaveAttribute('data-hovered', 'true');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'true');
      expect(triggerItem).toHaveAttribute('data-open', 'true');
      let submenu = getAllByRole('menu')[1];
      expect(submenu).toBeInTheDocument();

      let submenuPopover = submenu.closest('.react-aria-Popover');
      expect(submenuPopover).toBeInTheDocument();
      expect(submenuPopover).toHaveAttribute('data-trigger', 'SubmenuTrigger');

      // Click a submenu item
      await user.click(getAllByRole('menuitem')[5]);
      expect(onAction).toHaveBeenLastCalledWith('email');
      expect(menu).not.toBeInTheDocument();
      expect(submenu).not.toBeInTheDocument();
    });
    it('should support nested submenu triggers', async () => {
      let onAction = jest.fn();
      let {getByRole, getAllByRole} = render(
        <MenuTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Menu onAction={onAction}>
              <MenuItem id="open">Open</MenuItem>
              <MenuItem id="rename">Rename…</MenuItem>
              <MenuItem id="duplicate">Duplicate</MenuItem>
              <SubmenuTrigger>
                <MenuItem id="share">Share…</MenuItem>
                <Popover>
                  <Menu onAction={onAction}>
                    <SubmenuTrigger>
                      <MenuItem id="email">Email…</MenuItem>
                      <Popover>
                        <Menu onAction={onAction}>
                          <MenuItem id="work">Work</MenuItem>
                          <MenuItem id="personal">Personal</MenuItem>
                        </Menu>
                      </Popover>
                    </SubmenuTrigger>
                    <MenuItem id="sms">SMS</MenuItem>
                    <MenuItem id="x">X</MenuItem>
                  </Menu>
                </Popover>
              </SubmenuTrigger>
              <MenuItem id="delete">Delete…</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      );

      let button = getByRole('button');
      expect(button).not.toHaveAttribute('data-pressed');

      await user.click(button);
      expect(button).toHaveAttribute('data-pressed');

      let menu = getAllByRole('menu')[0];
      expect(getAllByRole('menuitem')).toHaveLength(5);

      let popover = menu.closest('.react-aria-Popover');
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveAttribute('data-trigger', 'MenuTrigger');

      let triggerItem = getAllByRole('menuitem')[3];
      expect(triggerItem).toHaveTextContent('Share…');
      expect(triggerItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'false');
      expect(triggerItem).toHaveAttribute('data-has-submenu', 'true');
      expect(triggerItem).not.toHaveAttribute('data-open');

      // Open the submenu
      await user.pointer({target: triggerItem});
      act(() => {jest.runAllTimers();});
      expect(triggerItem).toHaveAttribute('data-hovered', 'true');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'true');
      expect(triggerItem).toHaveAttribute('data-open', 'true');
      let submenu = getAllByRole('menu')[1];
      expect(submenu).toBeInTheDocument();

      let submenuPopover = submenu.closest('.react-aria-Popover');
      expect(submenuPopover).toBeInTheDocument();
      expect(submenuPopover).toHaveAttribute('data-trigger', 'SubmenuTrigger');

      let nestedTriggerItem = getAllByRole('menuitem')[5];
      expect(nestedTriggerItem).toHaveTextContent('Email…');
      expect(nestedTriggerItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(nestedTriggerItem).toHaveAttribute('aria-expanded', 'false');
      expect(nestedTriggerItem).toHaveAttribute('data-has-submenu', 'true');
      expect(nestedTriggerItem).not.toHaveAttribute('data-open');

      // Open the nested submenu
      await user.pointer({target: nestedTriggerItem});
      act(() => {jest.runAllTimers();});
      expect(nestedTriggerItem).toHaveAttribute('data-hovered', 'true');
      expect(nestedTriggerItem).toHaveAttribute('aria-expanded', 'true');
      expect(nestedTriggerItem).toHaveAttribute('data-open', 'true');
      let nestedSubmenu = getAllByRole('menu')[1];
      expect(nestedSubmenu).toBeInTheDocument();

      let nestedSubmenuPopover = nestedSubmenu.closest('.react-aria-Popover');
      expect(nestedSubmenuPopover).toBeInTheDocument();
      expect(nestedSubmenuPopover).toHaveAttribute('data-trigger', 'SubmenuTrigger');

      // Click a nested submenu item
      await user.click(getAllByRole('menuitem')[8]);
      expect(onAction).toHaveBeenLastCalledWith('work');
      expect(nestedSubmenu).not.toBeInTheDocument();
      expect(submenu).not.toBeInTheDocument();
    });
    it('should close all submenus if interacting outside root submenu', async () => {
      let onAction = jest.fn();
      let {getByRole, getAllByRole, getByTestId} = render(
        <MenuTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Menu onAction={onAction}>
              <MenuItem id="open">Open</MenuItem>
              <MenuItem id="rename">Rename…</MenuItem>
              <MenuItem id="duplicate">Duplicate</MenuItem>
              <SubmenuTrigger>
                <MenuItem id="share">Share…</MenuItem>
                <Popover>
                  <Menu onAction={onAction}>
                    <SubmenuTrigger>
                      <MenuItem id="email">Email…</MenuItem>
                      <Popover>
                        <Menu onAction={onAction}>
                          <MenuItem id="work">Work</MenuItem>
                          <MenuItem id="personal">Personal</MenuItem>
                        </Menu>
                      </Popover>
                    </SubmenuTrigger>
                    <MenuItem id="sms">SMS</MenuItem>
                    <MenuItem id="x">X</MenuItem>
                  </Menu>
                </Popover>
              </SubmenuTrigger>
              <MenuItem id="delete">Delete…</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      );

      let button = getByRole('button');
      expect(button).not.toHaveAttribute('data-pressed');

      await user.click(button);
      expect(button).toHaveAttribute('data-pressed');

      let menu = getAllByRole('menu')[0];
      expect(getAllByRole('menuitem')).toHaveLength(5);

      let popover = menu.closest('.react-aria-Popover');
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveAttribute('data-trigger', 'MenuTrigger');

      let triggerItem = getAllByRole('menuitem')[3];
      expect(triggerItem).toHaveTextContent('Share…');
      expect(triggerItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'false');
      expect(triggerItem).toHaveAttribute('data-has-submenu', 'true');
      expect(triggerItem).not.toHaveAttribute('data-open');

      // Open the submenu
      await user.pointer({target: triggerItem});
      act(() => {jest.runAllTimers();});
      expect(triggerItem).toHaveAttribute('data-hovered', 'true');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'true');
      expect(triggerItem).toHaveAttribute('data-open', 'true');
      let submenu = getAllByRole('menu')[1];
      expect(submenu).toBeInTheDocument();

      let submenuPopover = submenu.closest('.react-aria-Popover');
      expect(submenuPopover).toBeInTheDocument();
      expect(submenuPopover).toHaveAttribute('data-trigger', 'SubmenuTrigger');

      let nestedTriggerItem = getAllByRole('menuitem')[5];
      expect(nestedTriggerItem).toHaveTextContent('Email…');
      expect(nestedTriggerItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(nestedTriggerItem).toHaveAttribute('aria-expanded', 'false');
      expect(nestedTriggerItem).toHaveAttribute('data-has-submenu', 'true');
      expect(nestedTriggerItem).not.toHaveAttribute('data-open');

      // Open the nested submenu
      await user.pointer({target: nestedTriggerItem});
      act(() => {jest.runAllTimers();});
      expect(nestedTriggerItem).toHaveAttribute('data-hovered', 'true');
      expect(nestedTriggerItem).toHaveAttribute('aria-expanded', 'true');
      expect(nestedTriggerItem).toHaveAttribute('data-open', 'true');
      let nestedSubmenu = getAllByRole('menu')[1];
      expect(nestedSubmenu).toBeInTheDocument();

      let nestedSubmenuPopover = nestedSubmenu.closest('.react-aria-Popover');
      expect(nestedSubmenuPopover).toBeInTheDocument();
      expect(nestedSubmenuPopover).toHaveAttribute('data-trigger', 'SubmenuTrigger');

      let underlay = getByTestId('underlay');
      expect(underlay).toBeInTheDocument();
      expect(underlay).toHaveAttribute('aria-hidden', 'true');
      await user.click(document.body);
      expect(nestedSubmenu).not.toBeInTheDocument();
      expect(submenu).not.toBeInTheDocument();
      expect(menu).not.toBeInTheDocument();
      expect(underlay).not.toBeInTheDocument();
    });
    it('should restore focus to menu trigger if submenu is closed with Escape key', async () => {
      let {getByRole, getAllByRole} = render(
        <MenuTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Menu>
              <MenuItem id="open">Open</MenuItem>
              <MenuItem id="rename">Rename…</MenuItem>
              <MenuItem id="duplicate">Duplicate</MenuItem>
              <SubmenuTrigger>
                <MenuItem id="share">Share…</MenuItem>
                <Popover>
                  <Menu>
                    <MenuItem id="email">Email</MenuItem>
                    <MenuItem id="sms">SMS</MenuItem>
                    <MenuItem id="x">X</MenuItem>
                  </Menu>
                </Popover>
              </SubmenuTrigger>
              <MenuItem id="delete">Delete…</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      );

      let button = getByRole('button');
      expect(button).not.toHaveAttribute('data-pressed');

      await user.click(button);
      expect(button).toHaveAttribute('data-pressed');

      let menu = getAllByRole('menu')[0];
      expect(getAllByRole('menuitem')).toHaveLength(5);

      let popover = menu.closest('.react-aria-Popover');
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveAttribute('data-trigger', 'MenuTrigger');

      let triggerItem = getAllByRole('menuitem')[3];
      expect(triggerItem).toHaveTextContent('Share…');
      expect(triggerItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'false');
      expect(triggerItem).toHaveAttribute('data-has-submenu', 'true');
      expect(triggerItem).not.toHaveAttribute('data-open');

      // Open the submenu
      await user.pointer({target: triggerItem});
      act(() => {jest.runAllTimers();});
      expect(triggerItem).toHaveAttribute('data-hovered', 'true');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'true');
      expect(triggerItem).toHaveAttribute('data-open', 'true');
      let submenu = getAllByRole('menu')[1];
      expect(submenu).toBeInTheDocument();

      let submenuItems = within(submenu).getAllByRole('menuitem');
      expect(submenuItems).toHaveLength(3);

      await user.pointer({target: submenuItems[0]});
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(submenuItems[0]);

      await user.keyboard('{Escape}');
      act(() => {jest.runAllTimers();});

      expect(submenu).not.toBeInTheDocument();
      expect(menu).toBeInTheDocument();
      expect(document.activeElement).toBe(triggerItem);
    });
    it('should restore focus to nested submenu trigger if nested submenu is closed with Escape key', async () => {
      document.elementFromPoint = jest.fn().mockImplementation(query => query);
      let {getByRole} = render(
        <MenuTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Menu>
              <MenuItem id="open">Open</MenuItem>
              <MenuItem id="rename">Rename…</MenuItem>
              <MenuItem id="duplicate">Duplicate</MenuItem>
              <SubmenuTrigger>
                <MenuItem id="share">Share…</MenuItem>
                <Popover>
                  <Menu>
                    <SubmenuTrigger>
                      <MenuItem id="email">Email…</MenuItem>
                      <Popover>
                        <Menu>
                          <MenuItem id="work">Work</MenuItem>
                          <MenuItem id="personal">Personal</MenuItem>
                        </Menu>
                      </Popover>
                    </SubmenuTrigger>
                    <MenuItem id="sms">SMS</MenuItem>
                    <MenuItem id="x">X</MenuItem>
                  </Menu>
                </Popover>
              </SubmenuTrigger>
              <MenuItem id="delete">Delete…</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      );

      let menuTester = testUtilUser.createTester('Menu', {root: getByRole('button'), interactionType: 'keyboard'});

      expect(menuTester.trigger).not.toHaveAttribute('data-pressed');
      await menuTester.open();
      expect(menuTester.trigger).toHaveAttribute('data-pressed');

      expect(menuTester.options()).toHaveLength(5);
      expect(menuTester.menu).toBeInTheDocument();

      let popover = menuTester.menu?.closest('.react-aria-Popover');
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveAttribute('data-trigger', 'MenuTrigger');

      let triggerItem = menuTester.submenuTriggers[0];
      expect(triggerItem).toHaveTextContent('Share…');
      expect(triggerItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'false');
      expect(triggerItem).toHaveAttribute('data-has-submenu', 'true');
      expect(triggerItem).not.toHaveAttribute('data-open');

      // Open the submenu
      await user.pointer({target: triggerItem});
      let submenuTester = await menuTester.openSubmenu({submenuTrigger: triggerItem});
      act(() => {jest.runAllTimers();});
      expect(triggerItem).toHaveAttribute('data-hovered', 'true');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'true');
      expect(triggerItem).toHaveAttribute('data-open', 'true');
      expect(submenuTester?.menu).toBeInTheDocument();
      expect(submenuTester?.options()).toHaveLength(3);

      // Open the nested submenu
      let nestedSubmenu = await submenuTester?.openSubmenu({submenuTrigger: 'Email…'});
      act(() => {jest.runAllTimers();});
      expect(nestedSubmenu?.menu).toBeInTheDocument();
      expect(document.activeElement).toBe(nestedSubmenu?.options()[0]);

      await user.keyboard('{Escape}');
      act(() => {jest.runAllTimers();});

      expect(nestedSubmenu?.menu).not.toBeInTheDocument();
      expect(submenuTester?.menu).toBeInTheDocument();
      expect(menuTester.menu).toBeInTheDocument();
      expect(document.activeElement).toBe(nestedSubmenu?.trigger);
    });
    it('should not close the menu when clicking on a element within the submenu tree', async () => {
      let onAction = jest.fn();
      let {getByRole, getAllByRole, queryAllByRole} = render(
        <MenuTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Menu onAction={onAction}>
              <MenuItem id="open">Open</MenuItem>
              <MenuItem id="rename">Rename…</MenuItem>
              <MenuItem id="duplicate">Duplicate</MenuItem>
              <SubmenuTrigger>
                <MenuItem id="share">Share…</MenuItem>
                <Popover>
                  <Menu onAction={onAction}>
                    <SubmenuTrigger>
                      <MenuItem id="email">Email…</MenuItem>
                      <Popover>
                        <Menu onAction={onAction}>
                          <MenuItem id="work">Work</MenuItem>
                          <MenuItem id="personal">Personal</MenuItem>
                        </Menu>
                      </Popover>
                    </SubmenuTrigger>
                    <MenuItem id="sms">SMS</MenuItem>
                    <MenuItem id="x">X</MenuItem>
                  </Menu>
                </Popover>
              </SubmenuTrigger>
              <MenuItem id="delete">Delete…</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      );

      let button = getByRole('button');
      expect(button).not.toHaveAttribute('data-pressed');

      await user.click(button);
      expect(button).toHaveAttribute('data-pressed');

      let menu = getAllByRole('menu')[0];
      expect(getAllByRole('menuitem')).toHaveLength(5);

      let popover = menu.closest('.react-aria-Popover');
      expect(popover).toBeInTheDocument();

      let triggerItem = getAllByRole('menuitem')[3];

      // Open the submenu
      await user.pointer({target: triggerItem});
      act(() => {jest.runAllTimers();});
      let submenu = getAllByRole('menu')[1];
      expect(submenu).toBeInTheDocument();

      let nestedTriggerItem = getAllByRole('menuitem')[5];

      // Click a nested submenu item trigger
      await user.click(nestedTriggerItem);
      act(() => {jest.runAllTimers();});
      let menus = getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(3);

      await user.click(getAllByRole('menuitem')[6]);
      menus = queryAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(0);
      expect(menu).not.toBeInTheDocument();
    });

    it('should support sections', async () => {
      let onAction = jest.fn();
      let {getByRole, getAllByRole} = render(
        <MenuTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Menu onAction={onAction}>
              <MenuSection>
                <Header>Actions</Header>
                <MenuItem id="open">Open</MenuItem>
                <MenuItem id="rename">Rename…</MenuItem>
                <MenuItem id="duplicate">Duplicate</MenuItem>
                <SubmenuTrigger>
                  <MenuItem id="share">Share…</MenuItem>
                  <Popover>
                    <Menu onAction={onAction}>
                      <MenuSection>
                        <Header>Work</Header>
                        <MenuItem id="email-work">Email</MenuItem>
                        <MenuItem id="sms-work">SMS</MenuItem>
                        <MenuItem id="x-work">X</MenuItem>
                      </MenuSection>
                      <Separator />
                      <MenuSection>
                        <Header>Personal</Header>
                        <MenuItem id="email-personal">Email</MenuItem>
                        <MenuItem id="sms-personal">SMS</MenuItem>
                        <MenuItem id="x-personal">X</MenuItem>
                      </MenuSection>
                    </Menu>
                  </Popover>
                </SubmenuTrigger>
                <MenuItem id="delete">Delete…</MenuItem>
              </MenuSection>
              <Separator />
              <MenuSection>
                <Header>Settings</Header>
                <MenuItem id="user">User Settings</MenuItem>
                <MenuItem id="system">System Settings</MenuItem>
              </MenuSection>
            </Menu>
          </Popover>
        </MenuTrigger>
      );

      let button = getByRole('button');
      expect(button).not.toHaveAttribute('data-pressed');
      let menuTester = testUtilUser.createTester('Menu', {user, root: button});
      await menuTester.open();
      expect(button).toHaveAttribute('data-pressed');

      let groups = menuTester.sections;
      expect(groups).toHaveLength(2);

      expect(groups[0]).toHaveClass('react-aria-MenuSection');
      expect(groups[1]).toHaveClass('react-aria-MenuSection');

      expect(groups[0]).toHaveAttribute('aria-labelledby');
      expect(document.getElementById(groups[0].getAttribute('aria-labelledby')!)).toHaveTextContent('Actions');

      expect(groups[1]).toHaveAttribute('aria-labelledby');
      expect(document.getElementById(groups[1].getAttribute('aria-labelledby')!)).toHaveTextContent('Settings');

      let menu = menuTester.menu!;
      expect(getAllByRole('menuitem')).toHaveLength(7);

      let popover = menu.closest('.react-aria-Popover');
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveAttribute('data-trigger', 'MenuTrigger');
      let submenuTriggers = menuTester.submenuTriggers;
      expect(submenuTriggers).toHaveLength(1);

      // Open the submenu
      let submenuUtil = (await menuTester.openSubmenu({submenuTrigger: 'Share…'}))!;
      let submenu = submenuUtil.menu;
      expect(submenu).toBeInTheDocument();

      let submenuItems = submenuUtil.options();
      expect(submenuItems).toHaveLength(6);

      let groupsInSubmenu = submenuUtil.sections;
      expect(groupsInSubmenu).toHaveLength(2);

      expect(groupsInSubmenu[0]).toHaveClass('react-aria-MenuSection');
      expect(groupsInSubmenu[1]).toHaveClass('react-aria-MenuSection');

      expect(groupsInSubmenu[0]).toHaveAttribute('aria-labelledby');
      expect(document.getElementById(groupsInSubmenu[0].getAttribute('aria-labelledby')!)).toHaveTextContent('Work');

      expect(groupsInSubmenu[1]).toHaveAttribute('aria-labelledby');
      expect(document.getElementById(groupsInSubmenu[1].getAttribute('aria-labelledby')!)).toHaveTextContent('Personal');

      await user.click(submenuItems[0]);
      act(() => {jest.runAllTimers();});

      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenLastCalledWith('email-work');

      expect(submenu).not.toBeInTheDocument();
      expect(menu).not.toBeInTheDocument();
    });
  });

  describe('Subdialog', function () {
    it('should contain focus for subdialogs', async () => {
      let onAction = jest.fn();
      let {getByRole, getAllByRole} = render(
        <MenuTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Menu onAction={onAction}>
              <MenuItem id="open">Open</MenuItem>
              <MenuItem id="rename">Rename…</MenuItem>
              <MenuItem id="duplicate">Duplicate</MenuItem>
              <SubmenuTrigger>
                <MenuItem id="share">Share…</MenuItem>
                <Popover>
                  <form style={{display: 'flex', flexDirection: 'column'}}>
                    <Heading slot="title">Sign up</Heading>
                    <TextField>
                      <Label>First Name: </Label>
                      <Input />
                    </TextField>
                    <TextField>
                      <Label>Last Name: </Label>
                      <Input />
                    </TextField>
                  </form>
                </Popover>
              </SubmenuTrigger>
              <MenuItem id="delete">Delete…</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      );

      let menuTester = testUtilUser.createTester('Menu', {root: getByRole('button')});
      expect(menuTester.trigger).not.toHaveAttribute('data-pressed');

      await menuTester.open();
      expect(menuTester.trigger).toHaveAttribute('data-pressed');
      expect(menuTester.options()).toHaveLength(5);

      let popover = menuTester.menu?.closest('.react-aria-Popover');
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveAttribute('data-trigger', 'MenuTrigger');

      let triggerItem = menuTester.submenuTriggers[0];
      expect(triggerItem).toHaveTextContent('Share…');
      expect(triggerItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'false');
      expect(triggerItem).toHaveAttribute('data-has-submenu', 'true');
      expect(triggerItem).not.toHaveAttribute('data-open');

      // Open the subdialog
      await menuTester.openSubmenu({submenuTrigger: triggerItem});
      act(() => {jest.runAllTimers();});
      expect(triggerItem).toHaveAttribute('data-hovered', 'true');
      expect(triggerItem).toHaveAttribute('aria-expanded', 'true');
      expect(triggerItem).toHaveAttribute('data-open', 'true');
      let subdialog = getAllByRole('dialog')[1];
      expect(subdialog).toBeInTheDocument();

      let subdialogPopover = subdialog.closest('.react-aria-Popover') as HTMLElement;
      expect(subdialogPopover).toBeInTheDocument();
      expect(subdialogPopover).toHaveAttribute('data-trigger', 'SubmenuTrigger');

      let inputs = within(subdialogPopover).getAllByRole('textbox');
      await user.click(inputs[0]);
      expect(document.activeElement).toBe(inputs[0]);
      await user.tab();
      expect(document.activeElement).toBe(inputs[1]);
      await user.tab();
      expect(document.activeElement).toBe(inputs[0]);
    });

    it('should support nested subdialogs', async () => {
      let onAction = jest.fn();
      let {getByRole, getAllByRole, queryAllByRole} = render(
        <MenuTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Menu onAction={onAction}>
              <MenuItem id="open">Open</MenuItem>
              <MenuItem id="rename">Rename…</MenuItem>
              <MenuItem id="duplicate">Duplicate</MenuItem>
              <SubmenuTrigger>
                <MenuItem id="share">Share…</MenuItem>
                <Popover>
                  <Menu>
                    <SubmenuTrigger>
                      <MenuItem>Nested Subdialog</MenuItem>
                      <Popover>
                        <form>
                          <Heading slot="title">Contact</Heading>
                          <TextField autoFocus>
                            <Label>Email: </Label>
                            <Input />
                          </TextField>
                          <TextField>
                            <Label>Contact number: </Label>
                            <Input />
                          </TextField>
                          <Button>
                            Submit
                          </Button>
                        </form>
                      </Popover>
                    </SubmenuTrigger>
                    <MenuItem>B</MenuItem>
                    <MenuItem>C</MenuItem>
                  </Menu>
                  <Button>Test</Button>
                </Popover>
              </SubmenuTrigger>
              <MenuItem id="delete">Delete…</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      );

      let menuTester = testUtilUser.createTester('Menu', {root: getByRole('button')});
      await menuTester.open();

      let triggerItem = menuTester.submenuTriggers[0];
      expect(triggerItem).toHaveTextContent('Share…');
      expect(triggerItem).toHaveAttribute('aria-haspopup', 'menu');

      // Open the subdialog
      let subDialogTester = await menuTester.openSubmenu({submenuTrigger: triggerItem});
      act(() => {jest.runAllTimers();});
      expect(subDialogTester?.menu).toBeInTheDocument();

      let subDialogTriggerItem = subDialogTester?.submenuTriggers[0];
      expect(subDialogTriggerItem).toHaveTextContent('Nested Subdialog');
      expect(subDialogTriggerItem).toHaveAttribute('aria-haspopup', 'menu');

      // Open the nested subdialog
      await subDialogTester?.openSubmenu({submenuTrigger: subDialogTriggerItem!});
      act(() => {jest.runAllTimers();});
      let subdialogs = getAllByRole('dialog');
      expect(subdialogs).toHaveLength(3);

      await user.keyboard('{Escape}');
      act(() => {jest.runAllTimers();});
      subdialogs = getAllByRole('dialog');
      expect(subdialogs).toHaveLength(2);
      expect(document.activeElement).toBe(subDialogTriggerItem);

      await user.keyboard('{Escape}');
      act(() => {jest.runAllTimers();});
      subdialogs = queryAllByRole('dialog');
      expect(subdialogs).toHaveLength(1);
      expect(document.activeElement).toBe(triggerItem);
    });

    it('should close all subdialogs if interacting outside the root menu', async () => {
      let onAction = jest.fn();
      let {getByRole, getAllByRole, queryAllByRole} = render(
        <MenuTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Menu onAction={onAction}>
              <MenuItem id="open">Open</MenuItem>
              <MenuItem id="rename">Rename…</MenuItem>
              <MenuItem id="duplicate">Duplicate</MenuItem>
              <SubmenuTrigger>
                <MenuItem id="share">Share…</MenuItem>
                <Popover>
                  <Menu>
                    <SubmenuTrigger>
                      <MenuItem>Nested Subdialog</MenuItem>
                      <Popover>
                        <form>
                          <Heading slot="title">Contact</Heading>
                          <TextField autoFocus>
                            <Label>Email: </Label>
                            <Input />
                          </TextField>
                          <TextField>
                            <Label>Contact number: </Label>
                            <Input />
                          </TextField>
                          <Button>
                            Submit
                          </Button>
                        </form>
                      </Popover>
                    </SubmenuTrigger>
                    <MenuItem>B</MenuItem>
                    <MenuItem>C</MenuItem>
                  </Menu>
                  <Button>Test </Button>
                </Popover>
              </SubmenuTrigger>
              <MenuItem id="delete">Delete…</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      );

      let menuTester = testUtilUser.createTester('Menu', {root: getByRole('button')});
      await menuTester.open();

      // Open the subdialog
      let triggerItem = menuTester.submenuTriggers[0];

      let subDialogTester = await menuTester.openSubmenu({submenuTrigger: triggerItem});
      act(() => {jest.runAllTimers();});
      expect(subDialogTester?.menu).toBeInTheDocument();

      // Open the nested subdialog
      let subDialogTriggerItem = subDialogTester?.submenuTriggers[0];
      await subDialogTester?.openSubmenu({submenuTrigger: subDialogTriggerItem!});
      act(() => {jest.runAllTimers();});
      let subdialogs = getAllByRole('dialog');
      expect(subdialogs).toHaveLength(3);

      await user.click(document.body);
      act(() => {jest.runAllTimers();});
      subdialogs = queryAllByRole('dialog');
      expect(subdialogs).toHaveLength(0);
      expect(menuTester.menu).not.toBeInTheDocument();
    });

    // TODO: add test where clicking in a parent subdialog should close the nested subdialog when we fix that use case
  });

  describe('portalContainer', () => {
    function InfoMenu(props) {
      return (
        <UNSTABLE_PortalProvider getContainer={() => props.container.current}>
          <MenuTrigger>
            <Button aria-label="trigger" />
            <Popover>
              <Menu aria-label="Test">
                <MenuItem id="1">One</MenuItem>
                <MenuItem id="">Two</MenuItem>
                <MenuItem id="3">Three</MenuItem>
              </Menu>
            </Popover>
          </MenuTrigger>
        </UNSTABLE_PortalProvider>
      );
    }

    function App() {
      let container = React.useRef(null);
      return (
        <>
          <InfoMenu container={container} />
          <div ref={container} data-testid="custom-container" />
        </>
      );
    }

    it('should render the menu in the portal container', async () => {
      let {getByRole, getByTestId} = render(
        <App />
      );

      let button = getByRole('button');
      await user.click(button);

      expect(getByRole('menu').closest('[data-testid="custom-container"]')).toBe(getByTestId('custom-container'));
    });
  });

  it('should support custom Pressable trigger', async () => {
    let {getByRole} = render(
      <MenuTrigger>
        <Pressable>
          <span role="button">Trigger</span>
        </Pressable>
        <Popover>
          <Menu aria-label="Test">
            <MenuItem id="1">One</MenuItem>
            <MenuItem id="">Two</MenuItem>
            <MenuItem id="3">Three</MenuItem>
          </Menu>
        </Popover>
      </MenuTrigger>
    );

    let button = getByRole('button');

    await user.click(button);

    let menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
  });
});

// better to accept items from the test? or just have the test have a requirement that you render a certain-ish structure?
// what about the button label?
// where and how can i define the requirements/assumptions for setup for the test?
let withSection = [
  {id: 'heading 1', name: 'Heading 1', children: [
    {id: 'foo', name: 'Foo'},
    {id: 'bar', name: 'Bar'},
    {id: 'baz', name: 'Baz'},
    {id: 'fizz', name: 'Fizz'}
  ]}
];

function SelectionStatic(props) {
  let {selectionMode = 'single'} = props;
  let [selected, setSelected] = React.useState<Selection>(new Set());
  return (
    <MenuTrigger>
      <Button>Menu Button</Button>
      <Popover>
        <Menu
          aria-label="Test"
          selectionMode={selectionMode}
          selectedKeys={selected}
          onSelectionChange={setSelected}>
          <MenuSection>
            <Header>Heading 1</Header>
            <MenuItem>Foo</MenuItem>
            <MenuItem>Bar</MenuItem>
            <MenuItem>Baz</MenuItem>
            <MenuItem>Fizz</MenuItem>
          </MenuSection>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

function SelectionDynamic(props) {
  let {selectionMode = 'single'} = props;
  let [selected, setSelected] = React.useState<Selection>(new Set());
  return (
    <MenuTrigger>
      <Button>Menu Button</Button>
      <Popover>
        <Menu
          aria-label="Test"
          items={withSection}
          selectionMode={selectionMode}
          selectedKeys={selected}
          onSelectionChange={setSelected}>
          {(section) => (
            <MenuSection>
              <Header>{section.name}</Header>
              <Collection items={section.children}>
                {item => <MenuItem>{item.name}</MenuItem>}
              </Collection>
            </MenuSection>
        )}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

AriaMenuTests({
  prefix: 'rac-static',
  renderers: {
    standard: () => render(
      <MenuTrigger>
        <Button>Menu Button</Button>
        <Popover>
          <Menu aria-label="Test">
            <MenuSection>
              <Header>Heading 1</Header>
              <MenuItem>Foo</MenuItem>
              <MenuItem>Bar</MenuItem>
              <MenuItem>Baz</MenuItem>
            </MenuSection>
          </Menu>
        </Popover>
      </MenuTrigger>
    ),
    disabledTrigger: () => render(
      <MenuTrigger>
        <Button isDisabled>Menu Button</Button>
        <Popover>
          <Menu aria-label="Test">
            <MenuSection>
              <Header>Heading 1</Header>
              <MenuItem>Foo</MenuItem>
              <MenuItem>Bar</MenuItem>
              <MenuItem>Baz</MenuItem>
            </MenuSection>
          </Menu>
        </Popover>
      </MenuTrigger>
    ),
    singleSelection: () => render(
      <SelectionStatic />
    ),
    multipleSelection: () => render(
      <SelectionStatic selectionMode="multiple" />
    ),
    siblingFocusableElement: () => render(
      <>
        <input aria-label="before" />
        <MenuTrigger>
          <Button>Menu Button</Button>
          <Popover>
            <Menu aria-label="Test">
              <MenuSection>
                <Header>Heading 1</Header>
                <MenuItem>Foo</MenuItem>
                <MenuItem>Bar</MenuItem>
                <MenuItem>Baz</MenuItem>
              </MenuSection>
            </Menu>
          </Popover>
        </MenuTrigger>
        <input aria-label="after" />
      </>
    ),
    multipleMenus: () => render(
      <>
        <MenuTrigger>
          <Button>Menu Button1</Button>
          <Popover>
            <Menu aria-label="Test1">
              <MenuSection>
                <Header>Heading 1</Header>
                <MenuItem>Foo</MenuItem>
                <MenuItem>Bar</MenuItem>
                <MenuItem>Baz</MenuItem>
              </MenuSection>
            </Menu>
          </Popover>
        </MenuTrigger>
        <MenuTrigger>
          <Button>Menu Button2</Button>
          <Popover>
            <Menu aria-label="Test2">
              <MenuSection>
                <Header>Heading 1</Header>
                <MenuItem>Foo</MenuItem>
                <MenuItem>Bar</MenuItem>
                <MenuItem>Baz</MenuItem>
              </MenuSection>
            </Menu>
          </Popover>
        </MenuTrigger>
      </>
    ),
    submenus: () => render(
      <MenuTrigger>
        <Button aria-label="Menu">☰</Button>
        <Popover>
          <Menu>
            <MenuItem id="open">Open</MenuItem>
            <MenuItem id="rename">Rename…</MenuItem>
            <MenuItem id="duplicate">Duplicate</MenuItem>
            <SubmenuTrigger>
              <MenuItem id="share">Share…</MenuItem>
              <Popover>
                <Menu>
                  <SubmenuTrigger>
                    <MenuItem id="email">Email…</MenuItem>
                    <Popover>
                      <Menu>
                        <MenuItem id="work">Work</MenuItem>
                        <MenuItem id="personal">Personal</MenuItem>
                      </Menu>
                    </Popover>
                  </SubmenuTrigger>
                  <MenuItem id="sms">SMS</MenuItem>
                  <MenuItem id="x">X</MenuItem>
                </Menu>
              </Popover>
            </SubmenuTrigger>
            <MenuItem id="delete">Delete…</MenuItem>
          </Menu>
        </Popover>
      </MenuTrigger>
    )
  }
});

AriaMenuTests({
  prefix: 'rac-dynamic',
  renderers: {
    standard: () => render(
      <MenuTrigger>
        <Button>Menu Button</Button>
        <Popover>
          <Menu aria-label="Test" items={withSection}>
            {(section) => (
              <MenuSection>
                <Header>{section.name}</Header>
                <Collection items={section.children}>
                  {item => <MenuItem>{item.name}</MenuItem>}
                </Collection>
              </MenuSection>
            )}
          </Menu>
        </Popover>
      </MenuTrigger>
    ),
    singleSelection: () => render(
      <SelectionDynamic />
    ),
    multipleSelection: () => render(
      <SelectionDynamic selectionMode="multiple" />
    )
  }
});
