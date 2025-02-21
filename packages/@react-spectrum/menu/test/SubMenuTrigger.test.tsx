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

import {act, fireEvent, installPointerEvent, pointerMap, render as renderComponent, triggerTouch, within} from '@react-spectrum/test-utils-internal';
import {composeStories} from '@storybook/react';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import type {Scale} from '@react-types/provider';
import * as stories from '../stories/Submenu.stories';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

let {
  SubmenuStatic,
  SubmenuDynamic,
  Complex,
  TabBehaviorStory
} = composeStories(stories);

let render = (children, scale = 'medium' as Scale, locale = 'en-US') => {
  let tree = renderComponent(
    <Provider theme={theme} scale={scale} locale={locale}>
      {children}
    </Provider>
  );

  act(() => {jest.runAllTimers();});
  return tree;
};

describe('Submenu', function () {
  let user;
  let onAction = jest.fn();
  let submenuOnAction = jest.fn();
  let onOpenChange = jest.fn();
  let onSelectionChange = jest.fn();
  let submenuOnSelectionChange = jest.fn();
  let onClose = jest.fn();
  let submenuOnClose = jest.fn();

  beforeAll(function () {
    user = userEvent.setup({delay: null, pointerMap});
    jest.spyOn(window.HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => 1000);
    jest.spyOn(window.HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => 1000);
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    jest.spyOn(window.screen, 'width', 'get').mockImplementation(() => 1024);
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {jest.runAllTimers();});
    jest.clearAllMocks();
  });

  afterAll(function () {
    jest.restoreAllMocks();
  });

  // TODO: this should be in chromatic tests
  it.each`
    Name                 | Component
    ${'static'}          | ${SubmenuStatic}
    ${'dynamic'}         | ${SubmenuDynamic}
  `('renders $Name submenu', async function ({Component}) {
    let tree = render(<Component />);
    let triggerButton = tree.getByRole('button');
    await user.pointer({target: triggerButton, keys: '[MouseLeft]'});
    act(() => {jest.runAllTimers();});

    let menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();
    expect(document.activeElement).toBe(menu);
    let menuItems = within(menu).getAllByRole('menuitem');
    expect(within(menuItems[0]).queryByRole('img', {hidden: true})).not.toBeTruthy();
    expect(within(menuItems[1]).getByRole('img', {hidden: true})).toBeTruthy();
    expect(within(menuItems[2]).queryByRole('img', {hidden: true})).not.toBeTruthy();

    let submenuTrigger1 = menuItems[1];
    expect(submenuTrigger1).toHaveAttribute('aria-haspopup', 'menu');
    expect(submenuTrigger1).toHaveAttribute('aria-expanded', 'false');
    expect(submenuTrigger1).toHaveAttribute('data-key', 'Lvl 1 Item 2');

    await user.pointer({target: submenuTrigger1});
    act(() => {jest.runAllTimers();});
    let menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(2);
    let submenu1 = menus[1];
    expect(document.activeElement).toBe(submenuTrigger1);
    expect(submenu1).toHaveAttribute('aria-labelledby', submenuTrigger1.id);
    expect(submenuTrigger1).toHaveAttribute('aria-expanded', 'true');
    expect(submenuTrigger1).toHaveAttribute('aria-controls', submenu1.id);

    let submenu1Items = within(submenu1).getAllByRole('menuitem');
    expect(submenu1Items).toHaveLength(3);
    expect(submenu1Items[2]).toHaveTextContent('Lvl 2 Item 3');

    let submenuTrigger2 = submenu1Items[2];
    expect(within(submenuTrigger2).getByRole('img', {hidden: true})).toBeTruthy();
    expect(submenuTrigger2).toHaveAttribute('aria-haspopup', 'menu');
    expect(submenuTrigger2).toHaveAttribute('aria-expanded', 'false');
    expect(submenuTrigger2).toHaveAttribute('data-key', 'Lvl 2 Item 3');
    await user.pointer({target: submenuTrigger2});
    act(() => {jest.runAllTimers();});

    menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(3);
    let submenu2 = menus[2];
    expect(document.activeElement).toBe(submenuTrigger2);
    expect(submenu2).toHaveAttribute('aria-labelledby', submenuTrigger2.id);
    expect(submenuTrigger2).toHaveAttribute('aria-expanded', 'true');
    expect(submenuTrigger2).toHaveAttribute('aria-controls', submenu2.id);

    let submenu2Items = within(submenu2).getAllByRole('menuitem');
    expect(submenu2Items).toHaveLength(3);
    expect(submenu2Items[2]).toHaveTextContent('Lvl 3 Item 3');
  });

  it('submenu closes when hover leaves the submenu trigger', async function () {
    let tree = render(<SubmenuStatic menuTriggerProps={{onOpenChange}} />);
    let triggerButton = tree.getByRole('button');
    await user.pointer({target: triggerButton, keys: '[MouseLeft]'});
    act(() => {jest.runAllTimers();});

    let menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();
    expect(document.activeElement).toBe(menu);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    let menuItems = within(menu).getAllByRole('menuitem');
    let submenuTrigger1 = menuItems[1];
    expect(submenuTrigger1).toHaveAttribute('aria-haspopup', 'menu');
    expect(submenuTrigger1).toHaveAttribute('aria-expanded', 'false');

    await user.pointer({target: submenuTrigger1});
    act(() => {jest.runAllTimers();});
    let menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(2);
    expect(submenuTrigger1).toHaveAttribute('aria-expanded', 'true');
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    await user.pointer({target: menuItems[0]});
    act(() => {jest.runAllTimers();});
    menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(1);
    expect(submenuTrigger1).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it('only allows one submenu open at a time', async function () {
    let tree = render(<Complex />);
    let triggerButton = tree.getByRole('button');
    await user.pointer({target: triggerButton, keys: '[MouseLeft]'});
    act(() => {jest.runAllTimers();});

    let menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();
    expect(document.activeElement).toBe(menu);
    let menuItems = within(menu).getAllByRole('menuitem');
    let submenuTrigger1 = menuItems[0];
    expect(submenuTrigger1).toHaveAttribute('aria-haspopup', 'menu');
    expect(submenuTrigger1).toHaveAttribute('aria-expanded', 'false');
    let submenuTrigger2 = menuItems[1];
    expect(submenuTrigger2).toHaveAttribute('aria-haspopup', 'menu');
    expect(submenuTrigger2).toHaveAttribute('aria-expanded', 'false');

    await user.pointer({target: submenuTrigger1});
    act(() => {jest.runAllTimers();});
    let menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(2);
    expect(submenuTrigger1).toHaveAttribute('aria-expanded', 'true');
    expect(submenuTrigger2).toHaveAttribute('aria-expanded', 'false');
    expect(within(menus[1]).getAllByRole('menuitem')).toHaveLength(8);

    await user.pointer({target: submenuTrigger2});
    act(() => {jest.runAllTimers();});
    menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(2);
    expect(submenuTrigger1).toHaveAttribute('aria-expanded', 'false');
    expect(submenuTrigger2).toHaveAttribute('aria-expanded', 'true');
    expect(within(menus[1]).getAllByRole('menuitem')).toHaveLength(4);
  });

  it('should not close the sub menu if user hovers onto the sub menu trigger from the sub menu', async function () {
    let tree = render(<SubmenuStatic />);
    await user.tab();
    await user.keyboard('[ArrowDown]');
    act(() => {jest.runAllTimers();});

    let menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();
    let menuItems = within(menu).getAllByRole('menuitem');
    expect(document.activeElement).toBe(menuItems[0]);
    await user.keyboard('[ArrowDown]');
    let submenuTrigger1 = menuItems[1];
    expect(document.activeElement).toBe(submenuTrigger1);
    await user.keyboard('[ArrowRight]');
    act(() => {jest.runAllTimers();});

    let menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(2);
    let submenu1Items = within(menus[1]).getAllByRole('menuitem');
    expect(document.activeElement).toBe(submenu1Items[0]);
    await user.pointer({target: submenu1Items[0]});
    await user.pointer({target: submenuTrigger1});

    act(() => {jest.runAllTimers();});
    menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(2);
    expect(document.activeElement).toBe(submenu1Items[0]);
  });

  it('should close the sub menu if the user hovers a neighboring menu item from the submenu trigger', async function () {
    let tree = render(<SubmenuStatic />);
    await user.tab();
    await user.keyboard('[ArrowDown]');
    act(() => {jest.runAllTimers();});

    let menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();
    let menuItems = within(menu).getAllByRole('menuitem');
    expect(document.activeElement).toBe(menuItems[0]);
    await user.keyboard('[ArrowDown]');
    let submenuTrigger1 = menuItems[1];
    expect(document.activeElement).toBe(submenuTrigger1);
    await user.keyboard('[ArrowRight]');
    act(() => {jest.runAllTimers();});

    let menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(2);
    let submenu1Items = within(menus[1]).getAllByRole('menuitem');
    expect(document.activeElement).toBe(submenu1Items[0]);

    // Hover neighboring menu item adjacent to submenu trigger when focus is in the submenu
    await user.pointer({target: submenu1Items[0]});
    await user.pointer({target: menuItems[0]});
    act(() => {jest.runAllTimers();});
    menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(1);
    expect(document.activeElement).toBe(menuItems[0]);
    await user.pointer({target: submenuTrigger1});

    act(() => {jest.runAllTimers();});
    menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(2);
    expect(document.activeElement).toBe(submenuTrigger1);

    // Hover neighboring menu item adjacent to submenu trigger when focus is in the submenu trigger's menu
    await user.pointer({target: menuItems[0]});
    act(() => {jest.runAllTimers();});
    menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(1);
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it.each`
    Name
    ${'menu item'}
    ${'submenu trigger'}
  `('should close the sub menu if the user hovers a $Name from a earlier sub menu', async function ({Name}) {
    let tree = render(<SubmenuStatic />);
    await user.tab();
    await user.keyboard('[ArrowDown]');
    act(() => {jest.runAllTimers();});

    let menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();
    let menuItems = within(menu).getAllByRole('menuitem');
    expect(document.activeElement).toBe(menuItems[0]);
    await user.keyboard('[ArrowDown]');
    let submenuTrigger1 = menuItems[1];
    expect(document.activeElement).toBe(submenuTrigger1);
    await user.keyboard('[ArrowRight]');
    act(() => {jest.runAllTimers();});

    let menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(2);
    let submenu1Items = within(menus[1]).getAllByRole('menuitem');
    expect(document.activeElement).toBe(submenu1Items[0]);
    await user.keyboard('[ArrowDown]');
    await user.keyboard('[ArrowDown]');
    await user.keyboard('[ArrowRight]');
    act(() => {jest.runAllTimers();});

    menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(3);
    let submenu2Items = within(menus[2]).getAllByRole('menuitem');
    expect(document.activeElement).toBe(submenu2Items[0]);
    await user.pointer({target: submenu2Items[0]});

    let target;
    if ((Name as string).includes('menu item')) {
      // Hover non submenu trigger menu item in original menu
      target = menuItems[0];
    } else {
      // Hover submenu trigger item in original menu
      target = menuItems[0];
    }
    await user.pointer({target});
    act(() => {jest.runAllTimers();});

    menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(1);
    // ensure focus is always moved to the hovered target
    expect(document.activeElement).toBe(target);
  });

  it('disables a submenu trigger if the wrapped item is in the disabledKeys array', async function () {
    let tree = render(<SubmenuStatic disabledKeys={['Lvl 1 Item 2']} />);
    let triggerButton = tree.getByRole('button');
    await user.pointer({target: triggerButton, keys: '[MouseLeft]'});
    act(() => {jest.runAllTimers();});

    let menu = tree.getByRole('menu');
    expect(menu).toBeTruthy();
    let menuItems = within(menu).getAllByRole('menuitem');
    let submenuTrigger = menuItems[1];
    expect(submenuTrigger).toHaveAttribute('aria-haspopup', 'menu');

    await user.pointer({target: submenuTrigger});
    act(() => {jest.runAllTimers();});
    let menus = tree.getAllByRole('menu', {hidden: true});
    expect(menus).toHaveLength(1);
    expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(submenuTrigger).toHaveAttribute('aria-disabled', 'true');

    await user.keyboard('[ArrowDown]');
    expect(document.activeElement).toBe(menuItems[0]);
    expect(document.activeElement).toHaveTextContent('Lvl 1 Item 1');
    await user.keyboard('[ArrowDown]');
    expect(document.activeElement).toBe(menuItems[2]);
    expect(document.activeElement).toHaveTextContent('Lvl 1 Item 3');
  });

  describe('keyboard interactions', function () {
    it.each`
      Name                | locale      | actions
      ${'ltr, ArrowKeys'} | ${'en-US'}  | ${[async () => await user.keyboard('[ArrowRight]'), async () => await user.keyboard('[ArrowLeft]')]}
      ${'rtl, ArrowKeys'} | ${'ar-AE'}  | ${[async () => await user.keyboard('[ArrowLeft]'), async () => await user.keyboard('[ArrowRight]')]}
      ${'ltr, Enter/Esc'} | ${'en-US'}  | ${[async () => await user.keyboard('[Enter]'), async () => await user.keyboard('[Escape]')]}
    `('opens/closes the submenu via keyboard ($Name)', async function ({Name, locale, actions}) {
      let tree = render(<SubmenuStatic menuTriggerProps={{onOpenChange}} />, 'medium', locale);
      await user.tab();
      await user.keyboard('[ArrowDown]');
      act(() => {jest.runAllTimers();});
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenLastCalledWith(true);

      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      let menuItems = within(menu).getAllByRole('menuitem');
      expect(document.activeElement).toBe(menuItems[0]);
      await user.keyboard('[ArrowDown]');
      let submenuTrigger1 = menuItems[1];
      expect(document.activeElement).toBe(submenuTrigger1);
      await actions[0]();
      act(() => {jest.runAllTimers();});

      let menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      expect(submenuTrigger1).toHaveAttribute('aria-expanded', 'true');
      expect(onOpenChange).toHaveBeenCalledTimes(1);

      let submenu1Items = within(menus[1]).getAllByRole('menuitem');
      expect(document.activeElement).toBe(submenu1Items[0]);
      await actions[1]();
      act(() => {jest.runAllTimers();});

      if (Name === 'ltr, Enter/Esc') {
        // Only closes the current submenu via Arrow keys
        menus = tree.getAllByRole('menu', {hidden: true});
        expect(menus).toHaveLength(1);
        expect(submenuTrigger1).toHaveAttribute('aria-expanded', 'false');
        expect(onOpenChange).toHaveBeenCalledTimes(1);
      }
    });

    it('should close the submenu if focus moves from the submenu trigger to a neighboring element via keyboard', async function () {
      let tree = render(<SubmenuStatic />);
      await user.tab();
      await user.keyboard('[ArrowDown]');
      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      let menuItems = within(menu).getAllByRole('menuitem');
      let submenuTrigger1 = menuItems[1];
      fireEvent.mouseMove(submenuTrigger1);
      await user.pointer({target: submenuTrigger1});
      act(() => {jest.runAllTimers();});

      let menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      expect(document.activeElement).toBe(submenuTrigger1);
      await user.keyboard('[ArrowUp]');

      act(() => {jest.runAllTimers();});
      menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(1);
    });

    it.each`
    Name                | locale      | actions
      ${'ltr, ArrowKeys'} | ${'en-US'}  | ${[async () => await user.keyboard('[ArrowLeft]')]}
      ${'rtl, ArrowKeys'} | ${'ar-AE'}  | ${[async () => await user.keyboard('[ArrowRight]')]}
    `('only closes the last submenu via keyboard if focus is on the trigger ($Name)', async function ({locale, actions}) {
      let tree = render(<SubmenuStatic />, 'medium', locale);
      await user.tab();
      await user.keyboard('[ArrowDown]');
      act(() => {jest.runAllTimers();});

      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      let menuItems = within(menu).getAllByRole('menuitem');
      let submenuTrigger1 = menuItems[1];
      fireEvent.mouseMove(submenuTrigger1);
      await user.pointer({target: submenuTrigger1});
      act(() => {jest.runAllTimers();});

      let menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      let submenu1Items = within(menus[1]).getAllByRole('menuitem');
      let submenuTrigger2 = submenu1Items[2];
      await user.pointer({target: submenuTrigger2});
      act(() => {jest.runAllTimers();});

      menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(3);
      expect(document.activeElement).toBe(submenuTrigger2);
      await actions[0]();
      act(() => {jest.runAllTimers();});

      menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      expect(document.activeElement).toBe(submenuTrigger2);
    });

    it.skip('should shift focus to the prev/next element adjacent to the menu trigger when pressing Tab', async function () {
      async function openSubMenus() {
        await user.keyboard('[ArrowDown]');
        act(() => {jest.runAllTimers();});

        let menu = tree.getByRole('menu');
        expect(menu).toBeTruthy();
        await user.keyboard('[ArrowDown]');
        await user.keyboard('[ArrowRight]');
        act(() => {jest.runAllTimers();});

        let menus = tree.getAllByRole('menu', {hidden: true});
        expect(menus).toHaveLength(2);
        await user.keyboard('[ArrowDown]');
        await user.keyboard('[ArrowDown]');
        await user.keyboard('[ArrowRight]');
        act(() => {jest.runAllTimers();});

        menus = tree.getAllByRole('menu', {hidden: true});
        expect(menus).toHaveLength(3);
        let submenu2Items = within(menus[2]).getAllByRole('menuitem');
        expect(document.activeElement).toBe(submenu2Items[0]);
      }

      let tree = render(<TabBehaviorStory />);
      let inputleft = tree.getByTestId('inputleft');
      let inputright = tree.getByTestId('inputright');
      let triggerButton = tree.getByRole('button');
      await user.tab();
      await user.tab();
      await openSubMenus();

      // Tab should close all menus and move focus to the next input relative to the original menu trigger
      await user.tab();
      act(() => {jest.runAllTimers();});
      let menus = tree.queryAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(0);
      expect(document.activeElement).toBe(inputright);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(triggerButton);
      await openSubMenus();

      // Shift + Tab should close all menus and move focus to the prev input relative to the original menu trigger
      await user.tab({shift: true});
      act(() => {jest.runAllTimers();});
      menus = tree.queryAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(0);
      expect(document.activeElement).toBe(inputleft);
    });
  });

  describe('user provided callbacks', function () {
    it('calls user provided submenu onAction and onClose when submenu option is pressed', async function () {
      let tree = render(
        <SubmenuStatic
          onAction={onAction}
          onClose={onClose}
          menuTriggerProps={{onOpenChange}}
          submenu1Props={{onAction: submenuOnAction, onClose: submenuOnClose}} />
        );
      let triggerButton = tree.getByRole('button');
      await user.pointer({target: triggerButton, keys: '[MouseLeft]'});
      act(() => {jest.runAllTimers();});
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenLastCalledWith(true);

      // Click on the 3rd level Submenu item
      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      let menuItems = within(menu).getAllByRole('menuitem');
      let submenuTrigger1 = menuItems[1];
      await user.pointer({target: submenuTrigger1});
      act(() => {jest.runAllTimers();});
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      let menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      let submenu1 = menus[1];
      expect(document.activeElement).toBe(submenuTrigger1);
      let submenu1Items = within(submenu1).getAllByRole('menuitem');
      let submenuTrigger2 = submenu1Items[2];
      await user.pointer({target: submenuTrigger2});
      act(() => {jest.runAllTimers();});
      menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(3);
      let submenu2 = menus[2];
      expect(document.activeElement).toBe(submenuTrigger2);
      let submenu2Items = within(submenu2).getAllByRole('menuitem');
      await user.pointer({target: submenu2Items[2], keys: '[MouseLeft]'});
      act(() => {jest.runAllTimers();});
      menus = tree.queryAllByRole('menu', {hidden: true});
      // Closes all menus when a submenu action is triggered. No action/close handlers are called since
      // 3rd menu doesn't have one provided
      expect(menus).toHaveLength(0);
      expect(onAction).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(submenuOnAction).not.toHaveBeenCalled();
      expect(submenuOnClose).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenLastCalledWith(false);

      // Click on the 2rd level Submenu item which has its own onAction defined
      await user.pointer({target: triggerButton, keys: '[MouseLeft]'});
      act(() => {jest.runAllTimers();});
      menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      menuItems = within(menu).getAllByRole('menuitem');
      submenuTrigger1 = menuItems[1];
      await user.pointer({target: submenuTrigger1});
      act(() => {jest.runAllTimers();});
      menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      submenu1 = menus[1];
      expect(document.activeElement).toBe(submenuTrigger1);
      submenu1Items = within(submenu1).getAllByRole('menuitem');
      await user.pointer({target: submenu1Items[1], keys: '[MouseLeft]'});
      act(() => {jest.runAllTimers();});
      menus = tree.queryAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(0);
      expect(onAction).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(submenuOnAction).toHaveBeenCalledTimes(1);
      expect(submenuOnAction).toHaveBeenLastCalledWith('Lvl 2 Item 2');
      expect(submenuOnClose).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledTimes(4);
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('should not trigger onClose when closing the submenu with Esc', async function () {
      let tree = render(
        <SubmenuStatic
          onClose={onClose}
          submenu1Props={{onClose: submenuOnClose}} />
        );
      let triggerButton = tree.getByRole('button');
      await user.pointer({target: triggerButton, keys: '[MouseLeft]'});
      act(() => {jest.runAllTimers();});
      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      let menuItems = within(menu).getAllByRole('menuitem');
      let submenuTrigger1 = menuItems[1];
      await user.pointer({target: submenuTrigger1});
      act(() => {jest.runAllTimers();});
      let menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      expect(document.activeElement).toBe(submenuTrigger1);
      await user.keyboard('[ArrowRight]');
      await user.keyboard('[Escape]');
      act(() => {jest.runAllTimers();});
      menus = tree.queryAllByRole('menu');
      expect(menus).toHaveLength(1);
      expect(onClose).not.toHaveBeenCalled();
      expect(submenuOnClose).not.toHaveBeenCalled();
    });

    it('should not trigger root menu\' onAction when pressing on a submenu trigger item', async function () {
      let tree = render(<SubmenuStatic onAction={onAction} />);
      let triggerButton = tree.getByRole('button');
      await user.pointer({target: triggerButton, keys: '[MouseLeft]'});
      act(() => {jest.runAllTimers();});
      let menu = tree.getByRole('menu', {hidden: true});
      expect(menu).toBeTruthy();
      let menuItems = within(menu).getAllByRole('menuitem');
      let submenuTrigger1 = menuItems[1];
      await user.pointer({target: submenuTrigger1, keys: '[MouseLeft]'});
      act(() => {jest.runAllTimers();});
      let menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      expect(onAction).not.toHaveBeenCalled();

      await user.keyboard('[Enter]');
      act(() => {jest.runAllTimers();});
      expect(onAction).not.toHaveBeenCalled();

      await user.pointer({target: menuItems[0], keys: '[MouseLeft]'});
      act(() => {jest.runAllTimers();});
      menus = tree.queryAllByRole('menu');
      expect(menus).toHaveLength(0);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenLastCalledWith('Lvl 1 Item 1');
    });

    it('supports selectionMode and onSelectionChange on submenus', async function () {
      let tree = render(
        <SubmenuStatic
          onSelectionChange={onSelectionChange}
          onClose={onClose}
          selectionMode="multiple"
          submenu1Props={{onSelectionChange: submenuOnSelectionChange, onClose: submenuOnClose, selectionMode: 'single'}} />
        );
      await user.tab();
      await user.keyboard('[ArrowDown]');
      act(() => {jest.runAllTimers();});
      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      let menuItems = within(menu).getAllByRole('menuitemcheckbox');
      expect(document.activeElement).toBe(menuItems[0]);
      await user.keyboard('[Space]');
      expect(onSelectionChange).toBeCalledTimes(1);
      expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(['Lvl 1 Item 1']));
      await user.keyboard('[ArrowDown]');
      await user.keyboard('[ArrowDown]');
      await user.keyboard('[Space]');
      expect(onSelectionChange).toBeCalledTimes(2);
      expect(new Set(onSelectionChange.mock.calls[1][0])).toEqual(new Set(['Lvl 1 Item 1', 'Lvl 1 Item 3']));
      await user.keyboard('[ArrowUp]');

      let submenuTrigger = within(menu).getAllByRole('menuitem')[0];
      expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).toBe(submenuTrigger);
      await user.keyboard('[Enter]');
      act(() => {jest.runAllTimers();});

      expect(onSelectionChange).toBeCalledTimes(2);
      let menus = tree.getAllByRole('menu', {hidden: true});
      let submenu1Items = within(menus[1]).getAllByRole('menuitemradio');
      expect(document.activeElement).toBe(submenu1Items[0]);
      await user.keyboard('[Space]');
      expect(onSelectionChange).toBeCalledTimes(2);
      expect(submenuOnSelectionChange).toBeCalledTimes(1);
      expect(new Set(submenuOnSelectionChange.mock.calls[0][0])).toEqual(new Set(['Lvl 2 Item 1']));
      await user.keyboard('[ArrowDown]');
      await user.keyboard('[Space]');
      expect(submenuOnSelectionChange).toBeCalledTimes(2);
      expect(new Set(submenuOnSelectionChange.mock.calls[1][0])).toEqual(new Set(['Lvl 2 Item 2']));
    });

    it('does not trigger selection when clicking/pressing on a submenu trigger', async function () {
      let tree = render(
        <SubmenuStatic
          onSelectionChange={onSelectionChange}
          selectionMode="multiple"
          submenu1Props={{onSelectionChange: submenuOnSelectionChange, onClose: submenuOnClose, selectionMode: 'single'}} />
        );
      await user.tab();
      await user.keyboard('[ArrowDown]');
      act(() => {jest.runAllTimers();});
      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      let menuItems = within(menu).getAllByRole('menuitemcheckbox');
      expect(document.activeElement).toBe(menuItems[0]);
      await user.keyboard('[ArrowDown]');
      let submenuTrigger = within(menu).getAllByRole('menuitem')[0];
      expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).toBe(submenuTrigger);

      // Click on the menu's submenu trigger
      await user.pointer({target: document.activeElement, keys: '[MouseLeft]'});
      expect(onSelectionChange).not.toHaveBeenCalled();
      await user.keyboard('[ArrowLeft]');
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(submenuTrigger);

      // Hit enter on the menu's submenu trigger
      await user.keyboard('[Enter]');
      expect(onSelectionChange).not.toHaveBeenCalled();
      let menus = tree.getAllByRole('menu', {hidden: true});
      let submenu1Items = within(menus[1]).getAllByRole('menuitemradio');
      expect(document.activeElement).toBe(submenu1Items[0]);

      await user.keyboard('[ArrowDown]');
      await user.keyboard('[ArrowDown]');

      // Click on the submenu's submenu trigger
      let submenuTrigger2 = within(menus[1]).getAllByRole('menuitem')[0];
      expect(submenuTrigger2).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).toBe(submenuTrigger2);
      await user.pointer({target: document.activeElement, keys: '[MouseLeft]'});
      expect(submenuOnSelectionChange).not.toHaveBeenCalled();
      await user.keyboard('[Enter]');
      act(() => {jest.runAllTimers();});
      expect(submenuOnSelectionChange).not.toHaveBeenCalled();
      expect(onSelectionChange).not.toHaveBeenCalled();
      menus = tree.getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(3);
    });

    it('doesnt select a submenu trigger even if its key is specified in selectedKeys', async function () {
      let tree = render(
        <SubmenuStatic
          onSelectionChange={onSelectionChange}
          selectionMode="multiple"
          selectedKeys={['Lvl 1 Item 1', 'Lvl 1 Item 2']} />
        );
      await user.tab();
      await user.keyboard('[ArrowDown]');
      act(() => {jest.runAllTimers();});
      let menu = tree.getByRole('menu');
      expect(menu).toBeTruthy();
      let menuCheckboxItems = within(menu).getAllByRole('menuitemcheckbox');
      expect(menuCheckboxItems).toHaveLength(2);
      expect(menuCheckboxItems[0]).toHaveAttribute('aria-checked', 'true');

      // The submenu trigger isn't selectable so it shouldn't have the menuitemcheckbox role
      let menuItems = within(menu).getAllByRole('menuitem');
      expect(menuItems).toHaveLength(1);
      let submenuTrigger = menuItems[0];
      expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');
      expect(submenuTrigger).not.toHaveAttribute('aria-checked');
    });
  });

  describe('submenu tray', function () {
    installPointerEvent();
    beforeEach(() => {
      jest.spyOn(window.screen, 'width', 'get').mockImplementation(() => 700);
    });

    afterEach(() => {
      act(() => jest.runAllTimers());
      jest.clearAllMocks();
    });

    it('should open sub menus in the same tray on touch press', async function () {
      let tree = render(<SubmenuStatic />);
      let triggerButton = tree.getByRole('button');
      await user.pointer({target: triggerButton, keys: '[TouchA]'});
      act(() => {jest.runAllTimers();});

      let tray = tree.getByTestId('tray');
      let menu = within(tray).getByRole('menu');
      expect(menu).toBeTruthy();
      expect(within(tray).queryByRole('dialog')).toBeFalsy();
      let buttons = within(tray).getAllByRole('button');
      expect(buttons).toHaveLength(2);
      for (let button of buttons) {
        expect(button).toHaveAttribute('aria-label', 'Dismiss');
      }
      let menuItems = within(menu).getAllByRole('menuitem');
      let submenuTrigger1 = menuItems[1];
      // TODO: userevent pointer is detected as a virtual press...
      triggerTouch(submenuTrigger1);
      act(() => {jest.runAllTimers();});

      let menus = within(tray).getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      let menuWrappers = tree.getAllByTestId('menu-wrapper');
      // All menus other than the latest sub menu should be in the tray but hidden from view
      // Visibility check no longer works after using className instead of inline styles, rely on Chromatic instead
      expect(menuWrappers[0]).not.toHaveAttribute('aria-hidden', 'true');
      expect(menuWrappers[1]).toHaveAttribute('aria-hidden', 'true');
      expect(menuWrappers[1]).toContainElement(menus[1]);

      let submenu1 = menus[0];
      let submenu1Items = within(submenu1).getAllByRole('menuitem');
      expect(document.activeElement).toBe(submenu1Items[0]);
      expect(submenu1).toHaveAttribute('aria-labelledby', submenuTrigger1.id);
      let trayDialog = within(tray).getByRole('dialog');
      expect(trayDialog).toBeTruthy();
      let backButton = within(trayDialog).getByRole('button');
      expect(backButton).toHaveAttribute('aria-label', `Return to ${submenuTrigger1.textContent}`);
      let menuHeader = within(trayDialog).getAllByText(submenuTrigger1.textContent!)[0];
      expect(menuHeader).toBeVisible();
      expect(menuHeader.tagName).toBe('H1');
      let submenuTrigger2 = submenu1Items[2];
      triggerTouch(submenuTrigger2);
      act(() => {jest.runAllTimers();});

      menus = within(tray).getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(3);
      menuWrappers = tree.getAllByTestId('menu-wrapper');
      expect(menuWrappers[0]).not.toHaveAttribute('aria-hidden', 'true');
      expect(menuWrappers[1]).toHaveAttribute('aria-hidden', 'true');
      expect(menuWrappers[1]).toContainElement(menus[1]);
      expect(menuWrappers[2]).toHaveAttribute('aria-hidden', 'true');
      expect(menuWrappers[2]).toContainElement(menus[2]);

      let submenu2 = menus[0];
      let submenu2Items = within(submenu2).getAllByRole('menuitem');
      expect(document.activeElement).toBe(submenu2Items[0]);
      expect(submenu2).toHaveAttribute('aria-labelledby', submenuTrigger2.id);
      trayDialog = within(tray).getByRole('dialog');
      backButton = within(trayDialog).getByRole('button');
      expect(backButton).toHaveAttribute('aria-label', `Return to ${submenuTrigger2.textContent}`);
      menuHeader = within(tray).getAllByText(submenuTrigger2.textContent!)[0];
      expect(menuHeader).toBeVisible();
      expect(menuHeader.tagName).toBe('H1');
    });

    it('should provide a back button to close the submenu', async function () {
      let tree = render(<SubmenuStatic />);
      let triggerButton = tree.getByRole('button');
      await user.pointer({target: triggerButton, keys: '[TouchA]'});
      act(() => {jest.runAllTimers();});

      let tray = tree.getByTestId('tray');
      let menu = within(tray).getByRole('menu');
      expect(menu).toBeTruthy();
      let menuItems = within(menu).getAllByRole('menuitem');
      let submenuTrigger1 = menuItems[1];
      triggerTouch(submenuTrigger1);
      act(() => {jest.runAllTimers();});

      let menus = within(tray).getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      let submenu1 = menus[0];
      let submenu1Items = within(submenu1).getAllByRole('menuitem');
      let submenuTrigger2 = submenu1Items[2];
      triggerTouch(submenuTrigger2);
      act(() => {jest.runAllTimers();});

      menus = within(tray).getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(3);
      menuItems = within(menus[0]).getAllByRole('menuitem');
      expect(menuItems[0]).toHaveTextContent('Lvl 3');
      let buttons = within(tray).getAllByRole('button');
      expect(buttons).toHaveLength(3);
      expect(buttons[1]).toHaveAttribute('aria-label', `Return to ${submenuTrigger2.textContent}`);
      triggerTouch(buttons[1]);
      act(() => {jest.runAllTimers();});

      menus = within(tray).getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      menuItems = within(menus[0]).getAllByRole('menuitem');
      expect(menuItems[0]).toHaveTextContent('Lvl 2');
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(menuItems[0]);
      buttons = within(tray).getAllByRole('button');
      expect(buttons).toHaveLength(3);
      expect(buttons[1]).toHaveAttribute('aria-label', `Return to ${submenuTrigger1.textContent}`);
      triggerTouch(buttons[1]);
      act(() => {jest.runAllTimers();});

      menus = within(tray).getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(1);
      menuItems = within(menus[0]).getAllByRole('menuitem');
      expect(menuItems[0]).toHaveTextContent('Lvl 1');
    });

    it('should not open/close submenus on hover', async function () {
      let tree = render(<SubmenuStatic />);
      let triggerButton = tree.getByRole('button');
      await user.pointer({target: triggerButton, keys: '[TouchA]'});
      act(() => {jest.runAllTimers();});

      let tray = tree.getByTestId('tray');
      let menu = within(tray).getByRole('menu');
      let menuItems = within(menu).getAllByRole('menuitem');
      let submenuTrigger1 = menuItems[1];
      await user.pointer({target: submenuTrigger1});
      act(() => {jest.runAllTimers();});

      let menus = within(tray).getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(1);
      triggerTouch(submenuTrigger1);
      act(() => {jest.runAllTimers();});

      menus = within(tray).getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
      menuItems = within(menus[0]).getAllByRole('menuitem');
      await user.pointer({target: menuItems[2]});
      act(() => {jest.runAllTimers();});

      menus = within(tray).getAllByRole('menu', {hidden: true});
      expect(menus).toHaveLength(2);
    });

    describe('keyboard interactions', function () {
      it('should allow the user to open and close menus with the arrow keys', async function () {
        let tree = render(<SubmenuStatic />);
        await user.tab();
        await user.keyboard('[ArrowDown]');
        act(() => {jest.runAllTimers();});

        let tray = tree.getByTestId('tray');
        let menu = within(tray).getByRole('menu');
        let menuItems = within(menu).getAllByRole('menuitem');
        await user.keyboard('[ArrowDown]');
        let submenuTrigger1 = menuItems[1];
        expect(document.activeElement).toBe(submenuTrigger1);
        await user.keyboard('[ArrowRight]');
        act(() => {jest.runAllTimers();});

        let menus = within(tray).getAllByRole('menu', {hidden: true});
        expect(menus).toHaveLength(2);
        menuItems = within(menus[0]).getAllByRole('menuitem');
        expect(menuItems[0]).toHaveTextContent('Lvl 2');
        expect(document.activeElement).toBe(menuItems[0]);
        await user.keyboard('[ArrowLeft]');
        act(() => {jest.runAllTimers();});

        menus = within(tray).getAllByRole('menu', {hidden: true});
        expect(menus).toHaveLength(1);
        menuItems = within(menus[0]).getAllByRole('menuitem');
        expect(menuItems[0]).toHaveTextContent('Lvl 1');
      });

      it('should allow the user to tab to the back button and close the submenu', async function () {
        let tree = render(<SubmenuStatic />);
        await user.tab();
        await user.keyboard('[ArrowDown]');
        act(() => {jest.runAllTimers();});

        let tray = tree.getByTestId('tray');
        let menu = within(tray).getByRole('menu');
        let menuItems = within(menu).getAllByRole('menuitem');
        await user.keyboard('[ArrowDown]');
        let submenuTrigger1 = menuItems[1];
        expect(document.activeElement).toBe(submenuTrigger1);
        await user.keyboard('[ArrowRight]');
        act(() => {jest.runAllTimers();});

        let menus = within(tray).getAllByRole('menu', {hidden: true});
        expect(menus).toHaveLength(2);
        menuItems = within(menus[0]).getAllByRole('menuitem');
        expect(menuItems[0]).toHaveTextContent('Lvl 2');
        expect(document.activeElement).toBe(menuItems[0]);

        await user.tab({shift: true});
        expect(document.activeElement).toHaveAttribute('aria-label', `Return to ${submenuTrigger1.textContent}`);
        await user.keyboard('[Enter]');
        act(() => {jest.runAllTimers();});

        menus = within(tray).getAllByRole('menu', {hidden: true});
        expect(menus).toHaveLength(1);
        menuItems = within(menus[0]).getAllByRole('menuitem');
        expect(menuItems[0]).toHaveTextContent('Lvl 1');
        expect(document.activeElement).toBe(submenuTrigger1);
      });
    });
  });
});
