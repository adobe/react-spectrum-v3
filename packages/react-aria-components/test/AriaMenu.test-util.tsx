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
import {
  AriaBaseTestProps,
  pointerMap
} from '@react-spectrum/test-utils-internal';
import {User} from '@react-aria/test-utils';
import userEvent from '@testing-library/user-event';

let describeInteractions = ((name, tests) => describe.each`
  interactionType
  ${'mouse'}
  ${'keyboard'}
  ${'touch'}
`(`${name} - $interactionType`, tests));

// @ts-ignore
describeInteractions.only = ((name, tests) => describe.only.each`
  interactionType
  ${'mouse'}
  ${'keyboard'}
  ${'touch'}
`(`${name} - $interactionType`, tests));

// @ts-ignore
describeInteractions.skip = ((name, tests) => describe.skip.each`
  interactionType
  ${'mouse'}
  ${'keyboard'}
  ${'touch'}
`(`${name} - $interactionType`, tests));

let triggerText = 'Menu Button';
interface AriaMenuTestProps extends AriaBaseTestProps {
  renderers: {
    // needs at least three child items, all enabled
    standard: (props?: {name: string}) => ReturnType<typeof render>,
    // trigger must be disabled
    disabledTrigger?: (props?: {name: string}) => ReturnType<typeof render>,
    // needs at least three child items, all enabled, with single selection
    singleSelection?: (props?: {name: string}) => ReturnType<typeof render>,
    // needs at least four child items, all enabled, with single selection
    multipleSelection?: (props?: {name: string}) => ReturnType<typeof render>,
    // needs a focusable sibling after the trigger with the label 'after'
    // TODO: better to have tests return JSX and I call `render`? could allow me to inject elements in the DOM more easily
    siblingFocusableElement?: (props?: {name: string}) => ReturnType<typeof render>,
    // needs two menus that are siblings
    multipleMenus?: (props?: {name: string}) => ReturnType<typeof render>,
    // Menu should only open on long press
    longPress?: (props?: {name: string}) => ReturnType<typeof render>,
    // Menu must have two levels of submenus
    submenus?: (props?: {name: string}) => ReturnType<typeof render>
  }
}
export const AriaMenuTests = ({renderers, setup, prefix}: AriaMenuTestProps) => {
  describe(prefix ? prefix + 'AriaMenuTrigger' : 'AriaMenuTrigger', function () {
    let onOpenChange = jest.fn();
    let onOpen = jest.fn();
    let onClose = jest.fn();
    let onSelect = jest.fn();
    let onSelectionChange = jest.fn();
    let user;
    let testUtilUser = new User();
    setup?.();

    beforeAll(function () {
      user = userEvent.setup({delay: null, pointerMap});
      window.HTMLElement.prototype.scrollIntoView = jest.fn();
      jest.useFakeTimers();
    });

    afterEach(() => {
      onOpenChange.mockClear();
      onOpen.mockClear();
      onClose.mockClear();
      onSelect.mockClear();
      onSelectionChange.mockClear();
      act(() => jest.runAllTimers());
    });


  // it('should support aria-label on the menu items', () => {
  //   let {getAllByRole} = renderMenu({}, {'aria-label': 'test'});

  //   for (let menuitem of getAllByRole('menuitem')) {
  //     expect(menuitem).toHaveAttribute('aria-label', 'test');
  //   }
  // });

    it('has default behavior (button renders, menu is closed)', function () {
      let tree = renderers.standard();
      let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
      let triggerButton = menuTester.trigger!;

      expect(triggerButton).toBeTruthy();
      expect(triggerButton).toHaveAttribute('aria-haspopup', 'true');

      let buttonText = within(triggerButton).getByText(triggerText);
      expect(buttonText).toBeTruthy();

      expect(menuTester.menu).toBeFalsy();

      expect(triggerButton).toHaveAttribute('aria-expanded', 'false');
      expect(triggerButton).toHaveAttribute('type', 'button');
    });

    it('toggles the menu display on button click', async function () {
      let tree = renderers.standard();
      let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
      let triggerButton = menuTester.trigger!;

      await menuTester.open();
      act(() => {jest.runAllTimers();});

      let menu = menuTester.menu!;
      expect(menu).toBeTruthy();
      expect(menu).toHaveAttribute('aria-labelledby', triggerButton.id);
      expect(menu).toHaveFocus();

      expect(triggerButton).toHaveAttribute('aria-expanded', 'true');
      expect(triggerButton).toHaveAttribute('aria-controls', menu.id);

      await user.click(triggerButton);
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();
      expect(triggerButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('will not close the menu when mousing over the trigger again without lifting press', function () {
      let tree = renderers.standard();
      let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
      let triggerButton = menuTester.trigger!;

      fireEvent.mouseEnter(triggerButton);
      fireEvent.mouseDown(triggerButton, {detail: 1});
      fireEvent.mouseLeave(triggerButton);
      fireEvent.mouseEnter(triggerButton);
      fireEvent.mouseUp(triggerButton, {detail: 1});
      fireEvent.click(triggerButton);

      expect(triggerButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes the menu on click outside', async function () {
      let tree = renderers.standard();
      let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
      let triggerButton = menuTester.trigger!;

      await menuTester.open();
      act(() => {jest.runAllTimers();});

      let menu = menuTester.menu!;
      expect(menu).toBeTruthy();
      expect(menu).toHaveAttribute('aria-labelledby', triggerButton.id);
      expect(menu).toHaveFocus();

      expect(triggerButton).toHaveAttribute('aria-expanded', 'true');
      expect(triggerButton).toHaveAttribute('aria-controls', menu.id);

      fireEvent.mouseDown(document.body);
      fireEvent.mouseUp(document.body);

      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();
      expect(triggerButton).toHaveAttribute('aria-expanded', 'false');
    });

    // Enter and Space keypress tests are ommitted since useMenuTrigger doesn't have space and enter cases in its key down
    // since usePress handles those cases

    it('can open the menu display via Enter key', async function () {
      let tree = renderers.standard();
      let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
      menuTester.setInteractionType('keyboard');
      let triggerButton = menuTester.trigger;

      await menuTester.open();
      act(() => {jest.runAllTimers();});

      let menu = menuTester.menu;
      expect(menu).toBeTruthy();
      let options = menuTester.options();
      expect(options[0]).toHaveFocus();

      await menuTester.close();
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();

      expect(triggerButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('can open the menu display via ArrowDown key', async function () {
      let tree = renderers.standard();
      let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
      menuTester.setInteractionType('keyboard');
      let triggerButton = menuTester.trigger;

      await menuTester.open({direction: 'down'});
      act(() => {jest.runAllTimers();});

      let menu = menuTester.menu;
      expect(menu).toBeTruthy();
      let options = menuTester.options();
      expect(options[0]).toHaveFocus();

      await menuTester.close();
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();

      expect(triggerButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('can open the menu display via ArrowUp key', async function () {
      let tree = renderers.standard();
      let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
      menuTester.setInteractionType('keyboard');
      let triggerButton = menuTester.trigger;

      await menuTester.open({direction: 'up'});
      act(() => {jest.runAllTimers();});

      let menu = menuTester.menu;
      expect(menu).toBeTruthy();
      let options = menuTester.options();
      expect(options[options.length - 1]).toHaveFocus();

      await menuTester.close();
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();

      expect(triggerButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('moves focus up and down with the arrow keys', async function () {
      let tree = renderers.standard();
      let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
      menuTester.setInteractionType('keyboard');
      let triggerButton = menuTester.trigger!;

      await menuTester.open();
      act(() => {jest.runAllTimers();});

      let menu = menuTester.menu;
      expect(menu).toBeTruthy();
      expect(menu).toHaveAttribute('aria-labelledby', triggerButton.id);

      let options = menuTester.options();
      expect(options[0]).toHaveFocus();

      await user.keyboard('[ArrowUp]');
      expect(options[options.length - 1]).toHaveFocus();

      await user.keyboard('[ArrowDown]');
      expect(options[0]).toHaveFocus();

      await user.keyboard('[ArrowDown]');
      expect(options[1]).toHaveFocus();
    });

    it('closes regardless of Space or Enter to activate an option', async function () {
      let tree = renderers.standard();
      let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
      menuTester.setInteractionType('keyboard');

      await menuTester.open();
      act(() => {jest.runAllTimers();});

      let menu = menuTester.menu;

      await user.keyboard('[Space]');
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();

      await menuTester.open();
      act(() => {jest.runAllTimers();});
      menu = menuTester.menu;

      await user.keyboard('[Enter]');
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();
    });

    it.skip('closes if menu is tabbed away from', async function () {
      let tree = renderers.standard();
      let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
      menuTester.setInteractionType('keyboard');

      await menuTester.open();
      act(() => {jest.runAllTimers();});

      let menu = menuTester.menu;

      await user.tab();
      act(() => {jest.runAllTimers();});
      act(() => {jest.runAllTimers();});
      expect(menu).not.toBeInTheDocument();
      expect(document.activeElement).toBe(menuTester.trigger);
    });

    it('has hidden dismiss buttons for screen readers', async function () {
      let tree = renderers.standard();
      let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
      menuTester.setInteractionType('keyboard');

      await menuTester.open();
      act(() => {jest.runAllTimers();});

      let menu = menuTester.menu;
      let buttons = tree.getAllByLabelText('Dismiss');
      expect(buttons.length).toBe(2);

      await user.click(buttons[0]);
      act(() => {jest.runAllTimers();});

      expect(menu).not.toBeInTheDocument();
    });

    // TODO: holding down 'Enter' when no selection results in a loop of opening and closing the menu

    if (renderers.singleSelection) {
      describe('single selection', function () {
        it('selects an option via mouse', async function () {
          let tree = (renderers.singleSelection!)();
          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
          let triggerButton = menuTester.trigger!;

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          let menu = menuTester.menu;
          expect(menu).toBeTruthy();
          expect(menu).toHaveAttribute('aria-labelledby', triggerButton.id);

          let options = menuTester.options();

          await menuTester.selectOption({option: options[1], menuSelectionMode: 'single'});

          act(() => {jest.runAllTimers();});
          expect(menu).not.toBeInTheDocument();

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          options = menuTester.options();
          expect(options[0]).toHaveAttribute('aria-checked', 'false');
          expect(options[1]).toHaveAttribute('aria-checked', 'true');
        });

        it('selects an option via keyboard and autoFocuses it next time the menu is opened via keyboard, does not clear if menu is closed with Esc', async function () {
          let tree = (renderers.singleSelection!)();
          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container, interactionType: 'keyboard'});
          let triggerButton = menuTester.trigger!;

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          let menu = menuTester.menu!;
          expect(menu).toBeTruthy();
          expect(menu).toHaveAttribute('aria-labelledby', triggerButton.id);

          let options = menuTester.options();
          expect(options[0]).toHaveFocus();

          await menuTester.selectOption({option: options[1], menuSelectionMode: 'single'});

          act(() => {jest.runAllTimers();});
          expect(menu).not.toBeInTheDocument();

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          options = menuTester.options();
          expect(options[0]).toHaveAttribute('aria-checked', 'false');
          expect(options[1]).toHaveAttribute('aria-checked', 'true');
          expect(options[1]).toHaveFocus();

          await menuTester.close();

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          options = menuTester.options();
          expect(options[0]).toHaveAttribute('aria-checked', 'false');
          expect(options[1]).toHaveAttribute('aria-checked', 'true');
          expect(options[1]).toHaveFocus();
        });

        it('selects an option via keyboard and does not close if it was selected with Space', async function () {
          let tree = (renderers.singleSelection!)();
          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
          menuTester.setInteractionType('keyboard');
          let triggerButton = menuTester.trigger;

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          let menu = menuTester.menu;
          expect(menu).toBeTruthy();
          expect(menu).toHaveAttribute('aria-labelledby', triggerButton.id);

          let options = menuTester.options();
          expect(options[0]).toHaveFocus();

          await user.keyboard('[ArrowDown]');
          await user.keyboard('[Space]');

          act(() => {jest.runAllTimers();});
          expect(menu).toBeInTheDocument();
          expect(options[0]).toHaveAttribute('aria-checked', 'false');
          expect(options[1]).toHaveAttribute('aria-checked', 'true');
          expect(options[1]).toHaveFocus();
        });

        it('ignores keyboard repeat events', async function () {
          let tree = (renderers.singleSelection!)();
          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
          menuTester.setInteractionType('keyboard');
          await user.tab();
          await user.keyboard('{Enter>}');

          act(() => {jest.runAllTimers();});
          fireEvent.keyDown(document.activeElement!, {key: 'Enter', repeat: true});
          let menu = menuTester.menu;
          expect(menu).toBeInTheDocument();
          await user.keyboard('{/Enter}');
          expect(menuTester.options().filter(option => option.getAttribute('aria-checked') === 'true').length).toBe(0);
        });
      });
    }

    if (renderers.multipleSelection) {
      describe('multiple selection', function () {
        it('selects options via mouse, autofocuses the last selected option when menu is reopened', async function () {
          let tree = (renderers.multipleSelection!)();
          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          let menu = menuTester.menu;
          let options = menuTester.options();

          await menuTester.selectOption({option: options[2], menuSelectionMode: 'multiple'});
          await menuTester.selectOption({option: options[1], menuSelectionMode: 'multiple'});

          expect(options[1]).toHaveAttribute('aria-checked', 'true');
          expect(options[2]).toHaveAttribute('aria-checked', 'true');

          act(() => {jest.runAllTimers();});
          expect(menu).toBeInTheDocument();

          await menuTester.close();
          act(() => {jest.runAllTimers();});
          expect(menu).not.toBeInTheDocument();

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          menu = menuTester.menu;
          options = menuTester.options();
          expect(options[1]).toHaveAttribute('aria-checked', 'true');
          expect(options[2]).toHaveAttribute('aria-checked', 'true');
          expect(options[2]).toHaveFocus();
        });

        it('selects options via keyboard and autoFocuses next time the menu is opened via keyboard, does not clear if menu is closed with Esc', async function () {
          let tree = (renderers.multipleSelection!)();
          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
          menuTester.setInteractionType('keyboard');

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          let menu = menuTester.menu;
          let options = menuTester.options();
          expect(options[0]).toHaveFocus();

          await user.keyboard('[ArrowDown]');
          await user.keyboard('[Space]');
          await user.keyboard('[ArrowDown]');
          await user.keyboard('[Space]');

          expect(options[1]).toHaveAttribute('aria-checked', 'true');
          expect(options[2]).toHaveAttribute('aria-checked', 'true');

          act(() => {jest.runAllTimers();});
          expect(menu).toBeInTheDocument();

          await menuTester.close();
          act(() => {jest.runAllTimers();});
          expect(menu).not.toBeInTheDocument();

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          menu = menuTester.menu;
          options = menuTester.options();
          expect(options[1]).toHaveAttribute('aria-checked', 'true');
          expect(options[2]).toHaveAttribute('aria-checked', 'true');
          expect(options[1]).toHaveFocus();
        });

        it('selects options via keyboard and immediately closes on selection if Enter was used', async function () {
          let tree = (renderers.multipleSelection!)();
          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
          menuTester.setInteractionType('keyboard');

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          let menu = menuTester.menu;
          let options = menuTester.options();
          expect(options[0]).toHaveFocus();

          await user.keyboard('[ArrowDown]');
          await user.keyboard('[Enter]');

          act(() => {jest.runAllTimers();});
          expect(menu).not.toBeInTheDocument();

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          menu = menuTester.menu;
          options = menuTester.options();
          expect(options[0]).toHaveAttribute('aria-checked', 'false');
          expect(options[1]).toHaveAttribute('aria-checked', 'true');
          expect(options[2]).toHaveAttribute('aria-checked', 'false');
          expect(options[1]).toHaveFocus();
        });

        it('ignores keyboard repeat events', async function () {
          let tree = (renderers.multipleSelection!)();
          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
          menuTester.setInteractionType('keyboard');
          await user.tab();
          await user.keyboard('{Enter>}');

          act(() => {jest.runAllTimers();});
          fireEvent.keyDown(document.activeElement!, {key: 'Enter', repeat: true});
          let menu = menuTester.menu;
          expect(menu).toBeInTheDocument();
          await user.keyboard('{/Enter}');
          expect(menuTester.options().filter(option => option.getAttribute('aria-checked') === 'true').length).toBe(0);
        });
      });
    }

    if (renderers.disabledTrigger) {
      describe('disabled trigger', function () {
        it('does not trigger', async function () {
          let tree = (renderers.disabledTrigger!)();
          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
          let triggerButton = menuTester.trigger;

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          expect(triggerButton).toHaveAttribute('aria-expanded', 'false');
        });
      });
    }

    if (renderers.siblingFocusableElement) {
      describe.skip('sibling focusable element', function () {
        it('focuses the next tabbable thing after the trigger if tab is hit inside the menu', async function () {
          let tree = (renderers.siblingFocusableElement!)();
          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});

          await menuTester.open();
          act(() => {jest.runAllTimers();});

          let menu = menuTester.menu;

          await user.tab();
          act(() => {jest.runAllTimers();});
          expect(menu).not.toBeInTheDocument();
          expect(document.activeElement).toBe(tree.getByLabelText('after'));
        });
      });
    }

    if (renderers.multipleMenus) {
      describe('multiple menus', function () {
        it('two menus can not be open at the same time', async function () {
          let tree = (renderers.multipleMenus!)();
          let [button1, button2] = tree.getAllByRole('button');
          // TODO: should i try to open with the tester?
          // let menu1Tester = testUtilUser.createTester('Menu', {root: button1});
          // let menu2Tester = testUtilUser.createTester('Menu', {root: button2});

          await user.click(button1);
          act(() => jest.runAllTimers());
          let menu = tree.getByRole('menu');
          expect(tree.getByLabelText('Test1')).toBe(menu);

          // pressing once on button 2 should close menu1, but not open menu2 yet
          await user.click(button2);
          act(() => jest.runAllTimers());
          expect(menu).not.toBeInTheDocument();

          // second press of button2 should open menu2
          await user.click(button2);
          act(() => jest.runAllTimers());
          let menu2 = tree.getByRole('menu');
          expect(tree.getByLabelText('Test2')).toBe(menu2);
        });
      });
    }

    if (renderers.submenus) {
      describeInteractions('Submenus general interactions', function ({interactionType}) {
        it('should support a submenu trigger', async () => {
          let tree = (renderers.submenus!)();

          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container, interactionType});
          await menuTester.open();
          let menu = menuTester.menu;

          let submenuTrigger = menuTester.submenuTriggers[0]!;
          expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');

          let submenuUtil = (await menuTester.openSubmenu({submenuTrigger}))!;
          act(() => {jest.runAllTimers();});
          expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
          let submenu = submenuUtil.menu;
          expect(submenu).toBeInTheDocument();

          await submenuUtil.selectOption({option: submenuUtil.options().filter(item => item.getAttribute('aria-haspopup') == null)[0]});
          // TODO: not ideal, this runAllTimers is only needed for RSPv3, not RAC or S2
          act(() => {jest.runAllTimers();});
          expect(menu).not.toBeInTheDocument();
          expect(submenu).not.toBeInTheDocument();
          expect(document.activeElement).toBe(menuTester.trigger);
        });

        it('should support nested submenu triggers', async () => {
          let tree = (renderers.submenus!)();

          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container, interactionType});
          await menuTester.open();
          let menu = menuTester.menu;

          let submenuTrigger = menuTester.submenuTriggers[0];
          expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');

          let submenuUtil = (await menuTester.openSubmenu({submenuTrigger}))!;
          act(() => {jest.runAllTimers();});
          expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
          let submenu = submenuUtil.menu;
          expect(submenu).toBeInTheDocument();

          let nestedSubmenuTrigger = submenuUtil.submenuTriggers[0];
          expect(nestedSubmenuTrigger).toHaveAttribute('aria-expanded', 'false');

          let nestedSubmenuUtil = (await submenuUtil.openSubmenu({submenuTrigger: nestedSubmenuTrigger}))!;
          act(() => {jest.runAllTimers();});
          expect(nestedSubmenuTrigger).toHaveAttribute('aria-expanded', 'true');
          let nestedSubmenu = nestedSubmenuUtil.menu;
          expect(nestedSubmenu).toBeInTheDocument();

          await nestedSubmenuUtil.selectOption({option: nestedSubmenuUtil.options().filter(item => item.getAttribute('aria-haspopup') == null)[0]});
          act(() => {jest.runAllTimers();});
          expect(menu).not.toBeInTheDocument();
          expect(submenu).not.toBeInTheDocument();
          expect(nestedSubmenu).not.toBeInTheDocument();
          expect(document.activeElement).toBe(menuTester.trigger);
        });
      });

      describe('submenu specific interaction tests', function () {
        it('should close all submenus if interacting outside root submenu', async () => {
          let tree = (renderers.submenus!)();

          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container});
          await menuTester.open();
          let menu = menuTester.menu;

          let submenuTrigger = menuTester.submenuTriggers[0];
          expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');

          let submenuUtil = (await menuTester.openSubmenu({submenuTrigger}))!;
          act(() => {jest.runAllTimers();});
          expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
          let submenu = submenuUtil.menu;
          expect(submenu).toBeInTheDocument();

          let nestedSubmenuTrigger = submenuUtil.submenuTriggers[0];
          expect(nestedSubmenuTrigger).toHaveAttribute('aria-expanded', 'false');

          let nestedSubmenuUtil = (await submenuUtil.openSubmenu({submenuTrigger: nestedSubmenuTrigger}))!;
          act(() => {jest.runAllTimers();});
          expect(nestedSubmenuTrigger).toHaveAttribute('aria-expanded', 'true');
          let nestedSubmenu = nestedSubmenuUtil.menu;
          expect(submenu).toBeInTheDocument();

          await user.click(document.body);
          act(() => {jest.runAllTimers();});
          expect(nestedSubmenu).not.toBeInTheDocument();
          expect(submenu).not.toBeInTheDocument();
          expect(menu).not.toBeInTheDocument();
        });

        it('should close current submenu with Escape', async () => {
          let tree = (renderers.submenus!)();

          let menuTester = testUtilUser.createTester('Menu', {user, root: tree.container, interactionType: 'keyboard'});
          await menuTester.open();
          let menu = menuTester.menu;

          let submenuTrigger = menuTester.submenuTriggers[0];
          let submenuUtil = (await menuTester.openSubmenu({submenuTrigger}))!;
          act(() => {jest.runAllTimers();});
          let submenu = submenuUtil.menu;

          let nestedSubmenuTrigger = submenuUtil.submenuTriggers[0];
          let nestedSubmenuUtil = (await submenuUtil.openSubmenu({submenuTrigger: nestedSubmenuTrigger}))!;
          act(() => {jest.runAllTimers();});
          let nestedSubmenu = nestedSubmenuUtil.menu;

          await user.keyboard('[Escape]');
          act(() => {jest.runAllTimers();});
          act(() => {jest.runAllTimers();});
          expect(menu).toBeInTheDocument();
          expect(submenu).toBeInTheDocument();
          expect(nestedSubmenu).not.toBeInTheDocument();
          expect(document.activeElement).toBe(nestedSubmenuTrigger);
        });
      });
    }


    // TODO: closeOnSelect is not implemented in RAC and therefor not in S2
    // TODO: long press might be implementation specific, better to test in S2 and RAC separately, also hard because i don't have a way to know if a button was "pressed"
    // TODO: sub dialogs not implemented yet in RAC
    // TODO: where to test portalContainer? it's implementation specific, so RAC only?
    // TODO: RTL
  });
};
