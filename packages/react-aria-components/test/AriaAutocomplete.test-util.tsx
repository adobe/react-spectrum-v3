/*
 * Copyright 2024 Adobe. All rights reserved.
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
  installPointerEvent,
  mockClickDefault,
  pointerMap
} from '@react-spectrum/test-utils-internal';
import userEvent from '@testing-library/user-event';

// TODO: bring this in when a test util is written so that we can have proper testing for all interaction modalities
// let describeInteractions = ((name, tests) => describe.each`
//   interactionType
//   ${'mouse'}
//   ${'keyboard'}
//   ${'touch'}
// `(`${name} - $interactionType`, tests));

interface AriaAutocompleteTestProps extends AriaBaseTestProps {
  renderers: {
    // needs to wrap a menu with at three items, all enabled. The items should be Foo, Bar, and Baz with ids 1, 2, and 3 respectively
    standard: () => ReturnType<typeof render>,
    // needs at two sections with titles containing Section 1 and Section 2. The first section should have Foo, Bar, Baz with ids 1, 2, and 3. The second section
    // should have Copy, Cut, Paste with ids 4, 5, 6
    sections?: () => ReturnType<typeof render>,
    // needs a 3 items, Foo, Bar, and Google with ids 1, 2, 3. The Google item should have a href of https://google.com
    links?: () => ReturnType<typeof render>,
    // needs a controlled input element and the same collection items as the standard renderer. Should default to an empty string for the input
    controlled?: () => ReturnType<typeof render>,
    // needs the collection to have item actions enabled and a mock listener for the action provided. Uses the same collection items as the standard renderer
    itemActions?: () => ReturnType<typeof render>,
    // needs the collection to have multiple item selection enabled and a mock listener for the selection provided. Uses the same collection items as the standard renderer
    multipleSelection?: () => ReturnType<typeof render>,
    // needs the collection to have the item with key 2 disabled. Should include a item action mock listener. Uses the same collection items as the standard renderer
    disabledItems?: () => ReturnType<typeof render>,
    // should set a default value of "Ba" on the autocomplete. Uses the same collection items as the standard renderer
    defaultValue?: () => ReturnType<typeof render>,
    // should allow the user to filter the items themselves in a async manner. The items should be Foo, Bar, and Baz with ids 1, 2, and 3 respectively.
    // The filtering can take any amount of time but should be standard non-case sensitive contains matching
    asyncFiltering?: () => ReturnType<typeof render>,
    // Should have a menu with three items, and two levels of submenus. Tree should be roughly: Foo Bar Baz -> (branch off Bar) Lvl 1 Bar 1, Lvl 1 Bar 2, Lvl 1 Bar 3 ->
    // (branch off Lvl 1 Bar 2) ->  Lvl 2 Bar 1, Lvl 2 Bar 2, Lvl 2 Bar 3
    submenus?: () => ReturnType<typeof render>,
    // Should have a menu with three items, and two levels of subdialog. Tree should be roughly: Foo Bar Baz -> (branch off Bar) Lvl 1 Bar 1, Lvl 1 Bar 2, Lvl 1 Bar 3 ->
    // (branch off Lvl 1 Bar 2) ->  Lvl 2 Bar 1, Lvl 2 Bar 2, Lvl 2 Bar 3
    subdialogs?: () => ReturnType<typeof render>,
    // Should have a menu with items -> a subdialog -> submenu -> subdialog. Tree should be roughly: Foo Bar Baz -> (branch off Bar) Lvl 1 Bar 1, Lvl 1 Bar 2, Lvl 1 Bar 3 ->
    // (branch off Lvl 1 Bar 2) ->  Lvl 2 Bar 1, Lvl 2 Bar 2, Lvl 2 Bar 3 -> (branch off Lvl 2 Bar 2) ->  Lvl 3 Bar 1, Lvl 3 Bar 2, Lvl 3 Bar 3
    subdialogAndMenu?: () => ReturnType<typeof render>
  },
  ariaPattern?: 'menu' | 'listbox',
  selectionListener?: jest.Mock<any, any>,
  actionListener?: jest.Mock<any, any>
}
export const AriaAutocompleteTests = ({renderers, setup, prefix, ariaPattern = 'menu', selectionListener, actionListener}: AriaAutocompleteTestProps) => {
  describe(prefix ? prefix + ' AriaAutocomplete' : 'AriaAutocomplete', function () {
    let user;
    let collectionNodeRole;
    let collectionItemRole;
    let collectionSelectableItemRole;
    setup?.();

    beforeAll(function () {
      user = userEvent.setup({delay: null, pointerMap});
      jest.useFakeTimers();
      if (ariaPattern === 'menu') {
        collectionNodeRole = 'menu';
        collectionItemRole = 'menuitem';
        collectionSelectableItemRole = 'menuitemcheckbox';
      } else if (ariaPattern === 'listbox') {
        collectionNodeRole = 'listbox';
        collectionItemRole = 'option';
        collectionSelectableItemRole = 'option';
      }
    });

    afterEach(() => {
      actionListener?.mockClear();
      selectionListener?.mockClear();
      act(() => jest.runAllTimers());
    });

    describe('standard interactions', function () {
      it('has default behavior (input field renders with expected attributes)', async function () {
        let {getByRole} = renderers.standard();
        let input = getByRole('searchbox');
        expect(input).toHaveAttribute('aria-controls');
        expect(input).toHaveAttribute('aria-haspopup', 'listbox');
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAttribute('autoCorrect', 'off');
        expect(input).toHaveAttribute('spellCheck', 'false');

        let menu = getByRole(collectionNodeRole);
        expect(menu).toHaveAttribute('id', input.getAttribute('aria-controls')!);
      });

      it('should support keyboard navigation', async function () {
        let {getByRole} = renderers.standard();
        let input = getByRole('searchbox');
        let menu = getByRole(collectionNodeRole);
        let options = within(menu).getAllByRole(collectionItemRole);
        expect(input).not.toHaveAttribute('aria-activedescendant');

        await user.tab();
        expect(document.activeElement).toBe(input);

        await user.keyboard('{ArrowDown}');
        expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
        await user.keyboard('{ArrowDown}');
        expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
        await user.keyboard('{ArrowDown}');
        expect(input).toHaveAttribute('aria-activedescendant', options[2].id);
        await user.keyboard('{ArrowUp}');
        expect(input).toHaveAttribute('aria-activedescendant', options[1].id);

        expect(document.activeElement).toBe(input);
      });

      it('should clear the focused key when using ArrowLeft and ArrowRight but preserves it internally for future keyboard operations', async function () {
        let {getByRole} = renderers.standard();
        let input = getByRole('searchbox');
        let menu = getByRole(collectionNodeRole);
        expect(input).not.toHaveAttribute('aria-activedescendant');

        await user.tab();
        expect(document.activeElement).toBe(input);

        await user.keyboard('{ArrowDown}');
        let options = within(menu).getAllByRole(collectionItemRole);
        expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
        await user.keyboard('{ArrowRight}');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        // Old focused key was options[0] so should move one down
        await user.keyboard('{ArrowDown}');
        expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
        await user.keyboard('{ArrowLeft}');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        expect(document.activeElement).toBe(input);
        await user.keyboard('{ArrowUp}');
        expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
      });

      it('should completely clear the focused key when Backspacing', async function () {
        let {getByRole} = renderers.standard();
        let input = getByRole('searchbox');
        let menu = getByRole(collectionNodeRole);
        expect(input).not.toHaveAttribute('aria-activedescendant');

        await user.tab();
        expect(document.activeElement).toBe(input);

        await user.keyboard('B');
        act(() => jest.runAllTimers());
        let options = within(menu).getAllByRole(collectionItemRole);
        let firstActiveDescendant = options[0].id;
        expect(input).toHaveAttribute('aria-activedescendant', firstActiveDescendant);
        expect(options[0]).toHaveTextContent('Bar');
        await user.keyboard('{Backspace}');
        act(() => jest.runAllTimers());
        expect(input).not.toHaveAttribute('aria-activedescendant');

        options = within(menu).getAllByRole(collectionItemRole);
        await user.keyboard('{ArrowDown}');
        expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
        expect(firstActiveDescendant).not.toEqual(options[0].id);
        expect(options[0]).toHaveTextContent('Foo');
      });

      it('should delay the aria-activedescendant being set when autofocusing the first option', async function () {
        let {getByRole} = renderers.standard();
        let input = getByRole('searchbox');
        let menu = getByRole(collectionNodeRole);
        expect(input).not.toHaveAttribute('aria-activedescendant');

        await user.tab();
        expect(document.activeElement).toBe(input);

        await user.keyboard('a');
        let options = within(menu).getAllByRole(collectionItemRole);
        expect(input).not.toHaveAttribute('aria-activedescendant');
        act(() => jest.advanceTimersByTime(500));
        expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
      });

      it('should maintain the newest focused item as the activescendant if set after autofocusing the first option', async function () {
        let {getByRole} = renderers.standard();
        let input = getByRole('searchbox');
        let menu = getByRole(collectionNodeRole);
        expect(input).not.toHaveAttribute('aria-activedescendant');

        await user.tab();
        expect(document.activeElement).toBe(input);

        await user.keyboard('a');
        let options = within(menu).getAllByRole(collectionItemRole);
        expect(input).not.toHaveAttribute('aria-activedescendant');
        await user.keyboard('{ArrowDown}');
        act(() => jest.runAllTimers());
        expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
      });

      it('should not move the text input cursor when using Home/End/ArrowUp/ArrowDown', async function () {
        let {getByRole} = renderers.standard();
        let input = getByRole('searchbox') as HTMLInputElement;

        await user.tab();
        expect(document.activeElement).toBe(input);
        await user.keyboard('Bar');
        act(() => jest.runAllTimers());
        expect(input.selectionStart).toBe(3);

        await user.keyboard('{ArrowLeft}');
        act(() => jest.runAllTimers());
        expect(input.selectionStart).toBe(2);

        await user.keyboard('{Home}');
        act(() => jest.runAllTimers());
        expect(input.selectionStart).toBe(2);

        await user.keyboard('{End}');
        act(() => jest.runAllTimers());
        expect(input.selectionStart).toBe(2);

        await user.keyboard('{ArrowDown}');
        act(() => jest.runAllTimers());
        expect(input.selectionStart).toBe(2);

        await user.keyboard('{ArrowUp}');
        act(() => jest.runAllTimers());
        expect(input.selectionStart).toBe(2);
      });

      it('should focus the input when clicking on an item', async function () {
        let {getByRole} = renderers.standard();
        let input = getByRole('searchbox') as HTMLInputElement;
        let menu = getByRole(collectionNodeRole);
        let options = within(menu).getAllByRole(collectionItemRole);

        await user.click(options[0]);
        expect(document.activeElement).toBe(input);
      });

      if (ariaPattern === 'menu') {
        it('should update the aria-activedescendant when hovering over an item', async function () {
          let {getByRole} = renderers.standard();
          let input = getByRole('searchbox');
          let menu = getByRole(collectionNodeRole);
          let options = within(menu).getAllByRole(collectionItemRole);
          expect(input).not.toHaveAttribute('aria-activedescendant');

          await user.tab();
          expect(document.activeElement).toBe(input);
          // Need to press to set a modality
          await user.click(input);
          await user.hover(options[1]);
          act(() => jest.runAllTimers());
          expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
          expect(document.activeElement).toBe(input);
        });
      }
    });

    if (renderers.defaultValue) {
      describe('default text value', function () {
        it('should support default value', async function () {
          let {getByRole} = (renderers.defaultValue!)();
          let input = getByRole('searchbox');
          expect(input).toHaveValue('Ba');
          let menu = getByRole(collectionNodeRole);
          let options = within(menu).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(2);
          expect(options[0]).toHaveTextContent('Bar');
          expect(options[1]).toHaveTextContent('Baz');

          await user.tab();
          expect(document.activeElement).toBe(input);
          await user.keyboard('z');
          act(() => jest.runAllTimers());
          options = within(menu).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(1);
          expect(options[0]).toHaveTextContent('Baz');
        });
      });
    }

    if (ariaPattern === 'menu' && renderers.itemActions) {
      describe('item actions', function () {
        it('should trigger the wrapped element\'s actionListener when hitting Enter', async function () {
          let {getByRole} = (renderers.itemActions!)();
          let input = getByRole('searchbox');
          let menu = getByRole(collectionNodeRole);
          expect(input).not.toHaveAttribute('aria-activedescendant');

          await user.tab();
          expect(document.activeElement).toBe(input);

          await user.keyboard('{ArrowDown}');
          let options = within(menu).getAllByRole(collectionItemRole);
          expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
          await user.keyboard('{Enter}');
          expect(actionListener).toHaveBeenCalledTimes(1);
          expect(actionListener).toHaveBeenLastCalledWith('1');

          await user.keyboard('{ArrowDown}');
          await user.keyboard('{Enter}');
          expect(actionListener).toHaveBeenCalledTimes(2);
          expect(actionListener).toHaveBeenLastCalledWith('2');
        });

        it('should not trigger the wrapped element\'s actionListener when hitting Space', async function () {
          let {getByRole} = renderers.standard();
          let input = getByRole('searchbox');
          let menu = getByRole(collectionNodeRole);
          expect(input).not.toHaveAttribute('aria-activedescendant');

          await user.tab();
          expect(document.activeElement).toBe(input);

          await user.keyboard('{ArrowDown}');
          let options = within(menu).getAllByRole(collectionItemRole);
          expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
          await user.keyboard('[Space]');
          act(() => jest.runAllTimers());
          expect(actionListener).toHaveBeenCalledTimes(0);
          options = within(menu).queryAllByRole(collectionItemRole);
          expect(options).toHaveLength(0);
        });
      });
    }

    if (renderers.multipleSelection) {
      describe('supports multiple selection', function () {
        it('should trigger the wrapped element\'s onSelectionChange when hitting Enter', async function () {
          let {getByRole} = (renderers.multipleSelection!)();
          let input = getByRole('searchbox');
          let menu = getByRole(collectionNodeRole);
          expect(input).not.toHaveAttribute('aria-activedescendant');

          await user.tab();
          expect(document.activeElement).toBe(input);

          await user.keyboard('{ArrowDown}');
          let options = within(menu).getAllByRole(collectionSelectableItemRole);
          expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
          await user.keyboard('{Enter}');
          if (selectionListener) {
            expect(selectionListener).toHaveBeenCalledTimes(1);
            expect(new Set(selectionListener.mock.calls[0][0])).toEqual(new Set(['1']));
          }

          await user.keyboard('{ArrowDown}');
          await user.keyboard('{Enter}');
          if (selectionListener) {
            expect(selectionListener).toHaveBeenCalledTimes(2);
            expect(new Set(selectionListener.mock.calls[1][0])).toEqual(new Set(['1', '2']));
          }

          await user.keyboard('{ArrowUp}');
          await user.keyboard('{Enter}');
          if (selectionListener) {
            expect(selectionListener).toHaveBeenCalledTimes(3);
            expect(new Set(selectionListener.mock.calls[2][0])).toEqual(new Set(['2']));
          }
        });

        it('should clear the wrapped element\'s selection when hitting Escape', async function () {
          let {getByRole} = (renderers.multipleSelection!)();
          let input = getByRole('searchbox');
          let menu = getByRole(collectionNodeRole);
          expect(input).not.toHaveAttribute('aria-activedescendant');

          await user.tab();
          expect(document.activeElement).toBe(input);

          await user.keyboard('{ArrowDown}');
          let options = within(menu).getAllByRole(collectionSelectableItemRole);
          expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
          await user.keyboard('{Enter}');
          if (selectionListener) {
            expect(selectionListener).toHaveBeenCalledTimes(1);
            expect(new Set(selectionListener.mock.calls[0][0])).toEqual(new Set(['1']));
          }

          await user.keyboard('{ArrowDown}');
          await user.keyboard('{Enter}');
          if (selectionListener) {
            expect(selectionListener).toHaveBeenCalledTimes(2);
            expect(new Set(selectionListener.mock.calls[1][0])).toEqual(new Set(['1', '2']));
          }

          await user.keyboard('{Escape}');
          if (selectionListener) {
            expect(selectionListener).toHaveBeenCalledTimes(3);
            expect(new Set(selectionListener.mock.calls[2][0])).toEqual(new Set([]));
          }
        });
      });
    }

    if (renderers.disabledItems) {
      describe('disabled items', function () {
        it('should properly skip over disabled items', async function () {
          let {getByRole} =  (renderers.disabledItems!)();
          let input = getByRole('searchbox');
          let menu = getByRole(collectionNodeRole);
          let options = within(menu).getAllByRole(collectionItemRole);
          expect(options[1]).toHaveAttribute('aria-disabled', 'true');

          await user.tab();
          expect(document.activeElement).toBe(input);
          await user.keyboard('{ArrowDown}');
          act(() => jest.runAllTimers());
          expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
          await user.keyboard('{ArrowDown}');
          act(() => jest.runAllTimers());
          expect(input).toHaveAttribute('aria-activedescendant', options[2].id);

          await user.keyboard('B');
          act(() => jest.runAllTimers());
          await user.keyboard('a');
          act(() => jest.runAllTimers());
          await user.keyboard('r');
          act(() => jest.runAllTimers());
          options = within(menu).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(1);
          expect(options[0]).toHaveAttribute('aria-disabled', 'true');
          expect(input).not.toHaveAttribute('aria-activedescendant');

          await user.click(options[0]);
          expect(actionListener).toHaveBeenCalledTimes(0);
        });
      });

      it('should not autofocus the first item if backspacing from a list state where there are only disabled items', async function () {
        let {getByRole} =  (renderers.disabledItems!)();
        let input = getByRole('searchbox');
        let menu = getByRole(collectionNodeRole);
        let options = within(menu).getAllByRole(collectionItemRole);
        expect(options[1]).toHaveAttribute('aria-disabled', 'true');

        await user.tab();
        expect(document.activeElement).toBe(input);
        await user.keyboard('r');
        act(() => jest.runAllTimers());
        options = within(menu).getAllByRole(collectionItemRole);
        expect(options).toHaveLength(1);
        expect(input).not.toHaveAttribute('aria-activedescendant');
        expect(options[0]).toHaveAttribute('aria-disabled', 'true');

        await user.keyboard('{Backspace}');
        act(() => jest.runAllTimers());
        options = within(menu).getAllByRole(collectionItemRole);
        expect(input).not.toHaveAttribute('aria-activedescendant');
        await user.keyboard('{ArrowDown}');
        act(() => jest.runAllTimers());
        expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
      });
    }

    let filterTests = (renderer) => {
      describe('default text filtering', function () {
        it('should support filtering', async function () {
          let {getByRole} = renderer();
          let input = getByRole('searchbox');
          expect(input).toHaveValue('');
          let menu = getByRole(collectionNodeRole);
          let options = within(menu).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(3);

          await user.tab();
          expect(document.activeElement).toBe(input);
          await user.keyboard('F');
          act(() => jest.runAllTimers());
          options = within(menu).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(1);
          expect(options[0]).toHaveTextContent('Foo');

          expect(input).toHaveValue('F');
          expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
          expect(document.activeElement).toBe(input);

          await user.keyboard('{Backspace}');
          options = within(menu).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(3);
          expect(input).not.toHaveAttribute('aria-activedescendant');
          expect(document.activeElement).toBe(input);
        });
      });
    };

    filterTests(renderers.standard);

    if (renderers.controlled) {
      describe('controlled text value', function () {
        filterTests(renderers.controlled);
      });
    }

    if (renderers.asyncFiltering) {
      describe('async filtering performed outside the autocomplete', function () {
        it('should properly filter and autofocus the first item when typing forward', async function () {
          let {getByRole} = (renderers.asyncFiltering!)();
          await act(async () => {
            jest.runAllTimers();
          });

          let input = getByRole('searchbox');
          expect(input).toHaveValue('');
          let menu = getByRole(collectionNodeRole);
          let options = within(menu).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(3);

          // Does not immediately set aria-activedescendant until the collection updates
          await user.tab();
          expect(document.activeElement).toBe(input);
          await user.keyboard('F');
          expect(input).not.toHaveAttribute('aria-activedescendant');

          await act(async () => {
            jest.advanceTimersToNextTimer();
          });
          options = within(menu).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(1);
          expect(options[0]).toHaveTextContent('Foo');
          expect(input).not.toHaveAttribute('aria-activedescendant');

          // Only sets aria-activedescendant after the collection updates and the delay passes
          act(() => jest.advanceTimersToNextTimer());
          expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
        });
      });
    }

    if (renderers.sections) {
      describe('with sections', function () {
        it('should properly skip over sections when keyboard navigating', async function () {
          let {getByRole} = (renderers.sections!)();
          let input = getByRole('searchbox');
          let menu = getByRole(collectionNodeRole);
          let sections = within(menu).getAllByRole('group');
          expect(sections).toHaveLength(2);
          expect(sections[0]).toHaveTextContent('Section 1');
          expect(sections[1]).toHaveTextContent('Section 2');
          expect(within(menu).getByRole('separator')).toBeInTheDocument();

          let firstSecOpts = within(sections[0]).getAllByRole(collectionItemRole);
          expect(firstSecOpts).toHaveLength(3);
          let secondSecOpts = within(sections[1]).getAllByRole(collectionItemRole);
          expect(secondSecOpts).toHaveLength(3);

          await user.tab();
          expect(document.activeElement).toBe(input);
          for (let section of sections) {
            let options = within(section).getAllByRole(collectionItemRole);
            for (let opt of options) {
              await user.keyboard('{ArrowDown}');
              expect(input).toHaveAttribute('aria-activedescendant', opt.id);
            }
          }
        });

        it('should omit section titles and dividers when filtering', async function () {
          let {getByRole} = (renderers.sections!)();
          let input = getByRole('searchbox');
          let menu = getByRole(collectionNodeRole);
          let sections = within(menu).getAllByRole('group');
          expect(sections).toHaveLength(2);
          let options = within(menu).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(6);
          let divider = within(menu).getAllByRole('separator');
          expect(divider).toHaveLength(1);

          // This should just have the first section
          await user.tab();
          expect(document.activeElement).toBe(input);
          await user.keyboard('F');
          act(() => jest.runAllTimers());
          sections = within(menu).getAllByRole('group');
          expect(sections).toHaveLength(1);
          expect(sections[0]).toHaveAttribute('aria-labelledby');
          expect(document.getElementById(sections[0].getAttribute('aria-labelledby')!)).toHaveTextContent('Section 1');
          options = within(sections[0]).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(1);
          divider = within(menu).queryAllByRole('separator');
          expect(divider).toHaveLength(0);
          await user.keyboard('{ArrowDown}');
          expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
          expect(options[0]).toHaveTextContent('Foo');

          // Return to unfiltered view
          await user.keyboard('{Backspace}');
          act(() => jest.runAllTimers());
          sections = within(menu).getAllByRole('group');
          expect(sections).toHaveLength(2);
          options = within(menu).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(6);
          divider = within(menu).getAllByRole('separator');
          expect(divider).toHaveLength(1);
          expect(input).not.toHaveAttribute('aria-activedescendant');
          await user.keyboard('{ArrowDown}');
          expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
          expect(options[0]).toHaveTextContent('Foo');

          // This should just have the second section
          await user.keyboard('e');
          act(() => jest.runAllTimers());
          sections = within(menu).getAllByRole('group');
          expect(sections).toHaveLength(1);
          expect(sections[0]).toHaveAttribute('aria-labelledby');
          expect(document.getElementById(sections[0].getAttribute('aria-labelledby')!)).toHaveTextContent('Section 2');
          options = within(sections[0]).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(1);
          divider = within(menu).queryAllByRole('separator');
          expect(divider).toHaveLength(0);
          await user.keyboard('{ArrowDown}');
          expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
          expect(options[0]).toHaveTextContent('Paste');

          await user.keyboard('{Backspace}');
          act(() => jest.runAllTimers());
          // This should just have both sections
          await user.keyboard('a');
          act(() => jest.runAllTimers());
          sections = within(menu).getAllByRole('group');
          expect(sections).toHaveLength(2);
          options = within(menu).getAllByRole(collectionItemRole);
          expect(options).toHaveLength(3);
          divider = within(menu).queryAllByRole('separator');
          expect(divider).toHaveLength(1);
          let firstSecOpts = within(sections[0]).getAllByRole(collectionItemRole);
          expect(firstSecOpts).toHaveLength(2);
          let secondSecOpts = within(sections[1]).getAllByRole(collectionItemRole);
          expect(secondSecOpts).toHaveLength(1);
          expect(input).toHaveAttribute('aria-activedescendant', firstSecOpts[0].id);
          expect(firstSecOpts[0]).toHaveTextContent('Bar');
          await user.keyboard('{ArrowDown}');
          expect(input).toHaveAttribute('aria-activedescendant', firstSecOpts[1].id);
          expect(firstSecOpts[1]).toHaveTextContent('Baz');
          await user.keyboard('{ArrowDown}');
          expect(input).toHaveAttribute('aria-activedescendant', secondSecOpts[0].id);
          expect(secondSecOpts[0]).toHaveTextContent('Paste');
          if (ariaPattern === 'menu') {
            await user.keyboard('{ArrowDown}');
            expect(input).toHaveAttribute('aria-activedescendant', firstSecOpts[0].id);
          }
        });
      });
    }

    if (renderers.links) {
      describe('with links', function () {
        it('should trigger the link option when hitting Enter', async function () {
          let {getByRole} = (renderers.links!)();
          let input = getByRole('searchbox');
          let menu = getByRole(collectionNodeRole);
          expect(input).not.toHaveAttribute('aria-activedescendant');

          await user.tab();
          expect(document.activeElement).toBe(input);

          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');

          let options = within(menu).getAllByRole(collectionItemRole);
          expect(options[2].tagName).toBe('A');
          expect(options[2]).toHaveAttribute('href', 'https://google.com');
          let onClick = mockClickDefault();

          await user.keyboard('{Enter}');
          expect(onClick).toHaveBeenCalledTimes(1);
          window.removeEventListener('click', onClick);
        });
      });
    }

    if (renderers.submenus) {
      // TODO: wrap all of these within a DialogTrigger?
      describe('with submenus', function () {
        it('should open a submenu when pressing the autocomplete wrapped submenu trigger', async function () {
          let {getByRole, getAllByRole} = (renderers.submenus!)();
          let menu = getByRole('menu');
          let options = within(menu).getAllByRole('menuitem');
          expect(options[1]).toHaveAttribute('aria-haspopup', 'menu');

          await user.click(options[1]);
          act(() => {
            jest.runAllTimers();
          });

          let menus = getAllByRole('menu');
          expect(menus).toHaveLength(2);
        });

        describe('pointer events', function () {
          installPointerEvent();
          
          it('should close the menu when hovering an adjacent menu item in the virtual focus list', async function () {
            let {getByRole, getAllByRole} = (renderers.submenus!)();
            let menu = getByRole('menu');
            let options = within(menu).getAllByRole('menuitem');
            expect(options[1]).toHaveAttribute('aria-haspopup', 'menu');
            await user.click(options[1]);
            act(() => {
              jest.runAllTimers();
            });

            let menus = getAllByRole('menu');
            expect(menus).toHaveLength(2);

            await user.hover(options[2]);
            act(() => {
              jest.runAllTimers();
            });
            menus = getAllByRole('menu');
            expect(menus).toHaveLength(1);
          });
        });

        it('should not clear the focused key when using arrowRight to open a submenu', async function () {
          let {getByRole, getAllByRole} = (renderers.submenus!)();
          let input = getByRole('searchbox');
          let menu = getByRole('menu');
          expect(input).not.toHaveAttribute('aria-activedescendant');

          await user.tab();
          expect(document.activeElement).toBe(input);
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          let options = within(menu).getAllByRole('menuitem');
          expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
          expect(options[1]).toHaveAttribute('aria-haspopup', 'menu');
          expect(options[1]).toHaveAttribute('data-focused');
          expect(options[1]).toHaveAttribute('data-focus-visible');

          // Open submenu
          await user.keyboard('{ArrowRight}');
          act(() => jest.runAllTimers());
          expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
          expect(options[1]).not.toHaveAttribute('data-focused');
          expect(options[1]).not.toHaveAttribute('data-focus-visible');
          let menus = getAllByRole('menu');
          expect(menus).toHaveLength(2);
          expect(menus[1]).toContainElement(document.activeElement as HTMLElement);

          // Close submenu and check that previous focus location was retained
          await user.keyboard('{ArrowLeft}');
          act(() => jest.runAllTimers());
          menus = getAllByRole('menu');
          expect(menus).toHaveLength(1);
          expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
          expect(options[1]).toHaveAttribute('data-focused');
          expect(options[1]).toHaveAttribute('data-focus-visible');
          await user.keyboard('{ArrowDown}');
          expect(input).toHaveAttribute('aria-activedescendant', options[2].id);
          expect(options[2]).toHaveAttribute('data-focused');
          expect(options[2]).toHaveAttribute('data-focus-visible');
        });

        it('should only close a single level when hitting Escape and focus should be moved back to the input', async function () {
          let {getByRole, getAllByRole} = (renderers.submenus!)();
          let input = getByRole('searchbox');
          let menu = getByRole('menu');

          await user.tab();
          expect(document.activeElement).toBe(input);
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          let options = within(menu).getAllByRole('menuitem');
          expect(input).toHaveAttribute('aria-activedescendant', options[1].id);

          // Open submenu
          await user.keyboard('{ArrowRight}');
          act(() => jest.runAllTimers());
          let menus = getAllByRole('menu');
          expect(menus).toHaveLength(2);
          expect(menus[1]).toContainElement(document.activeElement as HTMLElement);

          // Open the nested submenu
          await user.keyboard('{ArrowDown}');
          expect(document.activeElement).toHaveAttribute('aria-haspopup');
          await user.keyboard('{ArrowRight}');
          act(() => jest.runAllTimers());
          menus = getAllByRole('menu');
          expect(menus).toHaveLength(3);
          expect(menus[2]).toContainElement(document.activeElement as HTMLElement);

          // Close submenus and check that previous focus location are retained
          await user.keyboard('{Escape}');
          act(() => jest.runAllTimers());
          menus = getAllByRole('menu');
          expect(menus).toHaveLength(2);
          expect(menus[1]).toContainElement(document.activeElement as HTMLElement);
          expect(document.activeElement).toBe(within(menus[1]).getAllByRole('menuitem')[1]);

          await user.keyboard('{Escape}');
          act(() => jest.runAllTimers());
          menus = getAllByRole('menu');
          expect(menus).toHaveLength(1);
          expect(document.activeElement).toBe(input);
        });

        it('should close all menus when clicking on the body', async function () {
          let {getByRole, getAllByRole} = (renderers.submenus!)();
          let menu = getByRole('menu');
          let options = within(menu).getAllByRole('menuitem');
          expect(options[1]).toHaveAttribute('aria-haspopup', 'menu');
          await user.click(options[1]);
          act(() => {
            jest.runAllTimers();
          });

          let menus = getAllByRole('menu');
          expect(menus).toHaveLength(2);

          await user.hover(within(menus[1]).getAllByRole('menuitem')[1]);
          act(() => {
            jest.runAllTimers();
          });
          menus = getAllByRole('menu');
          expect(menus).toHaveLength(3);

          await user.click(document.body);
          act(() => {
            jest.runAllTimers();
          });
          menus = getAllByRole('menu');
          expect(menus).toHaveLength(1);
        });

        // TODO: not sure why this is causing the "statndard interactions -> should support keyboard navigation" test to fail...
        it.skip('should close the current submenu when clicking the dismiss button', function () {
          let {getByRole, getAllByRole} = (renderers.submenus!)();
          let input = getByRole('searchbox');
          let menu = getByRole('menu');

          act(() => input.focus());
          fireEvent.click(input, {pointerType: 'mouse', width: 1, height: 1, detail: 0});
          expect(document.activeElement).toBe(input);
          let options = within(menu).getAllByRole('menuitem');
          expect(options[1]).toHaveAttribute('aria-haspopup', 'menu');

          act(() => options[1].focus());
          fireEvent.click(options[1], {pointerType: 'mouse', width: 1, height: 1, detail: 0});
          act(() => jest.runAllTimers());
          let menus = getAllByRole('menu');
          expect(menus).toHaveLength(2);

          let popover = menus[1].closest('.react-aria-Popover');
          let dismissButtons = within(popover as HTMLElement).getAllByRole('button', {hidden: true});
          expect(dismissButtons.length).toBe(1);
          act(() => dismissButtons[0].focus());
          fireEvent.click(dismissButtons[0], {pointerType: 'mouse', width: 1, height: 1, detail: 0});
          act(() => jest.runAllTimers());

          menus = getAllByRole('menu');
          expect(menus).toHaveLength(1);
          expect(document.activeElement).toBe(options[1]);
        });
      });
    }

    if (renderers.subdialogs) {
      describe('with subdialogs', function () {
        it('should open a subdialog when pressing the autocomplete wrapped subdialog triggers', async function () {
          let {getByRole, getAllByRole} = (renderers.subdialogs!)();
          let menu = getByRole('menu');
          let options = within(menu).getAllByRole('menuitem');
          expect(options[1]).toHaveAttribute('aria-haspopup', 'menu');

          await user.click(options[1]);
          act(() => {jest.runAllTimers();});

          let dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(1);

          await user.click(within(dialogs[0]).getAllByRole('menuitem')[1]);
          act(() => {jest.runAllTimers();});

          dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(2);
        });

        it('should close the subdialog when hovering an adjacent menu item in the virtual focus list', async function () {
          document.elementFromPoint = jest.fn().mockImplementation(query => query);
          let {getByRole, getAllByRole} = (renderers.subdialogs!)();
          let menu = getByRole('menu');
          let options = within(menu).getAllByRole('menuitem');
          expect(options[1]).toHaveAttribute('aria-haspopup', 'menu');
          await user.click(options[1]);
          act(() => {
            jest.runAllTimers();
          });

          let dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(1);

          await user.hover(within(dialogs[0]).getAllByRole('menuitem')[1]);
          act(() => {
            jest.runAllTimers();
          });

          dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(2);

          await user.hover(within(dialogs[0]).getAllByRole('menuitem')[0]);
          act(() => {
            jest.runAllTimers();
          });
          dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(1);
        });

        it('should contain focus even for virtual focus', async function () {
          let {getByRole, getAllByRole} = (renderers.subdialogs!)();
          let input = getByRole('searchbox');
          let menu = getByRole('menu');
          let options = within(menu).getAllByRole('menuitem');
          expect(options[1]).toHaveAttribute('aria-haspopup', 'menu');
          await user.tab();
          expect(document.activeElement).toBe(input);
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowRight}');
          act(() => {
            jest.runAllTimers();
          });

          let dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(1);
          let subDialogInput = within(dialogs[0]).getByRole('searchbox');
          expect(document.activeElement).toBe(subDialogInput);

          await user.tab();
          expect(document.activeElement).toBe(subDialogInput);
          await user.tab({shift: true});
          expect(document.activeElement).toBe(subDialogInput);
        });

        it('should only close a single level when hitting Escape and focus should be moved back to the input', async function () {
          let {getByRole, getAllByRole, queryAllByRole} = (renderers.subdialogs!)();
          let input = getByRole('searchbox');
          let menu = getByRole('menu');

          await user.tab();
          expect(document.activeElement).toBe(input);
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          let options = within(menu).getAllByRole('menuitem');
          expect(input).toHaveAttribute('aria-activedescendant', options[1].id);

          // Open subdialog
          await user.keyboard('{ArrowRight}');
          act(() => jest.runAllTimers());
          let dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(1);
          let subDialogInput = within(dialogs[0]).getByRole('searchbox');
          expect(document.activeElement).toBe(subDialogInput);

          // Open the nested submenu
          await user.keyboard('{ArrowDown}');
          // await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowRight}');
          act(() => jest.runAllTimers());
          dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(2);
          let subDialogInput2 = within(dialogs[1]).getByRole('searchbox');
          expect(document.activeElement).toBe(subDialogInput2);

          // Close subdialogs and check that previous focus locations are retained
          await user.keyboard('{Escape}');
          act(() => jest.runAllTimers());
          dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(1);
          expect(document.activeElement).toBe(subDialogInput);
          let subDialogMenuItems = within(dialogs[0]).getAllByRole('menuitem');
          expect(subDialogMenuItems[1]).toHaveAttribute('aria-haspopup', 'menu');
          expect(subDialogInput).toHaveAttribute('aria-activedescendant', subDialogMenuItems[1].id);

          await user.keyboard('{Escape}');
          act(() => jest.runAllTimers());
          dialogs = queryAllByRole('dialog');
          expect(dialogs).toHaveLength(0);
          expect(document.activeElement).toBe(input);
        });

        // TODO: not sure why this is causing other tests to fail... Something with calling fireEvent?
        it.skip('should close the current subdialog when clicking the dismiss button', function () {
          let {getByRole, getAllByRole, queryAllByRole} = (renderers.subdialogs!)();
          let input = getByRole('searchbox');
          let menu = getByRole('menu');

          act(() => input.focus());
          fireEvent.click(input, {pointerType: 'mouse', width: 1, height: 1, detail: 0});
          expect(document.activeElement).toBe(input);
          let options = within(menu).getAllByRole('menuitem');
          expect(options[1]).toHaveAttribute('aria-haspopup', 'menu');

          act(() => options[1].focus());
          fireEvent.click(options[1], {pointerType: 'mouse', width: 1, height: 1, detail: 0});
          act(() => jest.runAllTimers());
          let dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(1);

          let popover = dialogs[0].closest('.react-aria-Popover');
          let dismissButtons = within(popover as HTMLElement).getAllByRole('button', {hidden: true});
          expect(dismissButtons.length).toBe(2);
          act(() => dismissButtons[1].focus());
          fireEvent.click(dismissButtons[1], {pointerType: 'mouse', width: 1, height: 1, detail: 0});
          act(() => jest.runAllTimers());

          dialogs = queryAllByRole('dialog');
          expect(dialogs).toHaveLength(0);
          expect(document.activeElement).toBe(options[1]);
          act(() => jest.runAllTimers());
        });
      });
    }

    if (renderers.subdialogAndMenu) {
      describe('with subdialogs and menus mixed', function () {
        it('should allow opening a subdialog from menu and vice versa', async function () {
          // Tests a mix of virtual focus and non virtual focus
          let {getByRole, getAllByRole, queryAllByRole} = (renderers.subdialogAndMenu!)();
          let input = getByRole('searchbox');
          let menus = getAllByRole('menu');

          await user.tab();
          expect(document.activeElement).toBe(input);
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          let options = within(menus[0]).getAllByRole('menuitem');
          expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
          expect(options[1]).toHaveAttribute('aria-haspopup', 'menu');

          // Open subdialog
          await user.keyboard('{ArrowRight}');
          act(() => {jest.runAllTimers();});

          let dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(1);
          let subDialogInput = within(dialogs[0]).getByRole('searchbox');
          expect(document.activeElement).toBe(subDialogInput);
          let subDialogMenuItems = within(dialogs[0]).getAllByRole('menuitem');
          expect(subDialogMenuItems[1]).toHaveAttribute('aria-haspopup', 'menu');

          // Open submenu
          await user.keyboard('{ArrowDown}');
          // await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowRight}');
          act(() => {jest.runAllTimers();});
          menus = getAllByRole('menu');
          // 3 menus, 2 from autocomplete dialogs and one from submenu
          expect(menus).toHaveLength(3);
          expect(menus[2]).toContainElement(document.activeElement as HTMLElement);
          let submenuItems = within(menus[2]).getAllByRole('menuitem');
          expect(submenuItems[1]).toHaveAttribute('aria-haspopup', 'menu');

          // Open last subdialog
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowRight}');
          act(() => {jest.runAllTimers();});
          dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(3);
          let subDialogInput2 = within(dialogs[2]).getByRole('searchbox');
          expect(document.activeElement).toBe(subDialogInput2);

          // Check focus is restored to the expected places when closing dialogs/menus
          await user.keyboard('{Escape}');
          act(() => jest.runAllTimers());
          dialogs = getAllByRole('dialog');
          expect(dialogs).toHaveLength(2);
          expect(document.activeElement).toBe(submenuItems[1]);

          await user.keyboard('{ArrowLeft}');
          act(() => jest.runAllTimers());
          menus = getAllByRole('menu');
          expect(menus).toHaveLength(2);
          expect(document.activeElement).toBe(subDialogInput);
          expect(subDialogInput).toHaveAttribute('aria-activedescendant', subDialogMenuItems[1].id);

          await user.keyboard('{Escape}');
          act(() => jest.runAllTimers());
          dialogs = queryAllByRole('dialog');
          expect(dialogs).toHaveLength(0);
          expect(document.activeElement).toBe(input);
          expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
        });
      });
    }
  });
};
