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

import {act, fireEvent, renderv3 as render, waitFor} from '@react-spectrum/test-utils-internal';
import {Dialog} from '@react-spectrum/dialog';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import {Tray} from '../';
import {useOverlayTriggerState} from '@react-stately/overlays';

function TestTray(props) {
  let state = useOverlayTriggerState(props);
  return <Tray {...props} state={state} />;
}

describe('Tray', function () {
  beforeAll(() => jest.useFakeTimers());

  it('should render nothing if isOpen is not set', function () {
    let {queryByRole} = render(
      <Provider theme={theme}>
        <TestTray>
          <div role="dialog">contents</div>
        </TestTray>
      </Provider>
    );

    expect(queryByRole('dialog')).toBeNull();
    expect(document.documentElement).not.toHaveStyle('overflow: hidden');
  });

  it('should render when isOpen is true', function () {
    let {getByRole} = render(
      <Provider theme={theme}>
        <TestTray isOpen>
          <div role="dialog">contents</div>
        </TestTray>
      </Provider>
    );

    let dialog = getByRole('dialog');
    expect(dialog).toBeVisible();
    expect(document.documentElement).toHaveStyle('overflow: hidden');
  });

  it('hides the tray when pressing the escape key', async function () {
    let onOpenChange = jest.fn();
    let {getByRole} = render(
      <Provider theme={theme}>
        <TestTray isOpen onOpenChange={onOpenChange}>
          <div role="dialog">contents</div>
        </TestTray>
      </Provider>
    );

    await waitFor(() => {
      expect(getByRole('dialog')).toBeVisible();
    }); // wait for animation
    act(() => {jest.runAllTimers();});

    let dialog = await getByRole('dialog');
    fireEvent.keyDown(dialog, {key: 'Escape'});
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('hides the tray when clicking outside', async function () {
    let onOpenChange = jest.fn();
    let {getByRole} = render(
      <Provider theme={theme}>
        <TestTray isOpen onOpenChange={onOpenChange}>
          <div role="dialog">contents</div>
        </TestTray>
      </Provider>
    );

    await waitFor(() => {
      expect(getByRole('dialog')).toBeVisible();
    }); // wait for animation
    act(() => {jest.runAllTimers();});

    fireEvent.mouseDown(document.body);
    fireEvent.mouseUp(document.body);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it('hides the tray on blur when shouldCloseOnBlur is true', async function () {
    let onOpenChange = jest.fn();
    let {getByRole} = render(
      <Provider theme={theme}>
        <TestTray isOpen onOpenChange={onOpenChange} shouldCloseOnBlur>
          <Dialog>contents</Dialog>
        </TestTray>
      </Provider>
    );

    await waitFor(() => {
      expect(getByRole('dialog')).toBeVisible();
    }); // wait for animation
    act(() => {jest.runAllTimers();});

    let dialog = await getByRole('dialog');
    expect(document.activeElement).toBe(dialog);
    expect(onOpenChange).toHaveBeenCalledTimes(0);

    act(() => {dialog.blur();});
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it('should have hidden dismiss buttons for screen readers', function () {
    let onOpenChange = jest.fn();
    let {getAllByRole} = render(
      <Provider theme={theme}>
        <TestTray isOpen onOpenChange={onOpenChange} />
      </Provider>
    );

    let buttons = getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-label', 'Dismiss');
    expect(buttons[1]).toHaveAttribute('aria-label', 'Dismiss');

    fireEvent.click(buttons[0]);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});
