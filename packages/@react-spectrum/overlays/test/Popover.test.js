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

import {act, fireEvent, pointerMap, renderv3 as render, waitFor} from '@react-spectrum/test-utils-internal';
import {Dialog} from '@react-spectrum/dialog';
import {Popover} from '../';
import {Provider} from '@react-spectrum/provider';
import React, {useRef} from 'react';
import {theme} from '@react-spectrum/theme-default';
import {useOverlayTriggerState} from '@react-stately/overlays';
import userEvent from '@testing-library/user-event';

function PopoverWithDialog({children}) {
  let ref = useRef();
  let state = useOverlayTriggerState({isOpen: true});
  return (
    <Popover triggerRef={ref} state={state}>
      <Dialog>{children}</Dialog>
    </Popover>
  );
}

function TestPopover(props) {
  let ref = useRef();
  let state = useOverlayTriggerState(props);
  return <Popover {...props} triggerRef={ref} state={state} />;
}

describe('Popover', function () {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      getPropertyValue: () => '20'
    }));
  });

  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
    window.getComputedStyle.mockRestore();
  });

  describe('parity', function () {
    it.each`
      Name      | Component            | props                | expectedTabIndex
      ${'v3'}   | ${PopoverWithDialog} | ${{}}                | ${'-1'}
    `('$Name has a tabIndex set', async function ({Name, Component, props, expectedTabIndex}) {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Component {...props} />
        </Provider>
      );

      let dialog = getByRole('dialog');
      act(() => {
        jest.runAllTimers();
      });
      await waitFor(() => {
        expect(dialog).toBeVisible();
      }); // wait for animation
      expect(dialog).toHaveAttribute('tabIndex', expectedTabIndex);
    });

    it.each`
      Name      | Component            | props
      ${'v3'}   | ${PopoverWithDialog} | ${{}}
    `('$Name auto focuses the first tabbable element by default', async function ({Name, Component, props}) {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Component {...props}>
            <input data-testid="input1" />
            <input data-testid="input2" />
          </Component>
        </Provider>
      );

      act(() => {
        jest.runAllTimers();
      });
      let dialog = getByRole('dialog');
      await waitFor(() => {
        expect(dialog).toBeVisible();
      }); // wait for animation
      expect(document.activeElement).toBe(dialog);
    });

    it.each`
      Name      | Component            | props
      ${'v3'}   | ${PopoverWithDialog} | ${{isOpen: true}}
    `('$Name auto focuses the dialog itself if there is no focusable child', async function ({Name, Component, props}) {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Component {...props} />
        </Provider>
      );
      act(() => {
        jest.runAllTimers();
      });

      let dialog = getByRole('dialog');

      await waitFor(() => {
        expect(dialog).toBeVisible();
      }); // wait for animation
      expect(document.activeElement).toBe(dialog);
    });

    it.each`
      Name      | Component            | props
      ${'v3'}   | ${PopoverWithDialog} | ${{}}
    `('$Name allows autofocus prop on a child element to work as expected', async function ({Name, Component, props}) {
      let {getByRole, getByTestId} = render(
        <Provider theme={theme}>
          <Component {...props}>
            <input data-testid="input1" />
            <input data-testid="input2" autoFocus />
          </Component>
        </Provider>
      );
      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(getByRole('dialog')).toBeVisible();
      }); // wait for animation

      let input2 = getByTestId('input2');
      expect(document.activeElement).toBe(input2);
    });

    it.each`
      Name      | Component            | props
      ${'v3'}   | ${PopoverWithDialog} | ${{}}
    `('$Name contains focus within the popover', async function ({Name, Component, props}) {
      let {getByRole, getByTestId} = render(
        <Provider theme={theme}>
          <Component {...props}>
            <input data-testid="input1" />
            <input data-testid="input2" />
          </Component>
        </Provider>
      );
      act(() => {
        jest.runAllTimers();
      });

      let dialog = getByRole('dialog');

      await waitFor(() => {
        expect(dialog).toBeVisible();
      }); // wait for animation

      let input1 = getByTestId('input1');
      let input2 = getByTestId('input2');
      expect(document.activeElement).toBe(dialog);

      fireEvent.keyDown(document.activeElement, {key: 'Tab'});
      fireEvent.keyUp(document.activeElement, {key: 'Tab'});
      expect(document.activeElement).toBe(input1);

      fireEvent.keyDown(document.activeElement, {key: 'Tab'});
      fireEvent.keyUp(document.activeElement, {key: 'Tab'});
      expect(document.activeElement).toBe(input2);

      fireEvent.keyDown(document.activeElement, {key: 'Tab'});
      fireEvent.keyUp(document.activeElement, {key: 'Tab'});
      expect(document.activeElement).toBe(input1);
    });
  });

  describe('v3', function () {
    it('hides the popover when pressing the escape key', async function () {
      let onOpenChange = jest.fn();
      let {getByTestId} = render(
        <Provider theme={theme}>
          <TestPopover isOpen onOpenChange={onOpenChange} />
        </Provider>
      );
      act(() => {
        jest.runAllTimers();
      });
      let popover = getByTestId('popover');
      await waitFor(() => {
        expect(popover).toBeVisible();
      }); // wait for animation
      fireEvent.keyDown(popover, {key: 'Escape'});
      fireEvent.keyUp(popover, {key: 'Escape'});
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('hides the popover when clicking outside', async function () {
      let user = userEvent.setup({delay: null, pointerMap});
      let onOpenChange = jest.fn();
      let {getByTestId} = render(
        <Provider theme={theme}>
          <TestPopover isOpen onOpenChange={onOpenChange} />
        </Provider>
      );
      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(getByTestId('popover')).toBeVisible();
      }); // wait for animation
      await user.click(document.body);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('hides the popover on blur when shouldCloseOnBlur is true', async function () {
      // can't use Dialog in this one because Dialog does not work with shouldCloseOnBlur
      let onOpenChange = jest.fn();
      let {getAllByRole, getByTestId} = render(
        <Provider theme={theme}>
          <TestPopover isOpen onOpenChange={onOpenChange} shouldCloseOnBlur>
            <button autoFocus>Focus me</button>
          </TestPopover>
        </Provider>
      );

      act(() => {
        jest.runAllTimers();
      });
      let button = getAllByRole('button')[1];
      let popover = getByTestId('popover');
      expect(document.activeElement).toBe(button);

      await waitFor(() => {
        expect(popover).toBeVisible();
      }); // wait for animation

      act(() => {button.blur();});
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('should have hidden dismiss buttons for screen readers', function () {
      let onOpenChange = jest.fn();
      let {getAllByRole} = render(
        <Provider theme={theme}>
          <TestPopover isOpen onOpenChange={onOpenChange} />
        </Provider>
      );

      let buttons = getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('aria-label', 'Dismiss');
      expect(buttons[1]).toHaveAttribute('aria-label', 'Dismiss');

      fireEvent.click(buttons[0]);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });
  });
});
