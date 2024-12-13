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

import {fireEvent, renderv3 as render, waitFor} from '@react-spectrum/test-utils-internal';
import {Modal} from '../';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import {useOverlayTriggerState} from '@react-stately/overlays';

function TestModal(props) {
  let state = useOverlayTriggerState(props);
  return <Modal {...props} state={state} />;
}

describe('Modal', function () {
  it('should render nothing if isOpen is not set', function () {
    let {queryByRole} = render(
      <Provider theme={theme}>
        <TestModal>
          <div role="dialog">contents</div>
        </TestModal>
      </Provider>
    );

    expect(queryByRole('dialog')).toBeNull();
    expect(document.documentElement).not.toHaveStyle('overflow: hidden');
  });

  it('should render when isOpen is true', async function () {
    let {getByRole} = render(
      <Provider theme={theme}>
        <TestModal isOpen>
          <div role="dialog">contents</div>
        </TestModal>
      </Provider>
    );

    await waitFor(() => {
      expect(getByRole('dialog')).toBeVisible();
    }); // wait for animation

    let dialog = getByRole('dialog');
    expect(dialog).toBeVisible();
    expect(document.documentElement).toHaveStyle('overflow: hidden');
  });

  it('hides the modal when pressing the escape key', async function () {
    let onOpenChange = jest.fn();
    let {getByRole} = render(
      <Provider theme={theme}>
        <TestModal isOpen onOpenChange={onOpenChange}>
          <div role="dialog">contents</div>
        </TestModal>
      </Provider>
    );

    await waitFor(() => {
      expect(getByRole('dialog')).toBeVisible();
    }); // wait for animation

    let dialog = getByRole('dialog');
    fireEvent.keyDown(dialog, {key: 'Escape'});
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('doesn\'t hide the modal when clicking outside by default', async function () {
    let onOpenChange = jest.fn();
    let {getByRole} = render(
      <Provider theme={theme}>
        <TestModal isOpen onOpenChange={onOpenChange}>
          <div role="dialog">contents</div>
        </TestModal>
      </Provider>
    );

    await waitFor(() => {
      expect(getByRole('dialog')).toBeVisible();
    }); // wait for animation

    fireEvent.mouseUp(document.body);
    expect(onOpenChange).toHaveBeenCalledTimes(0);
  });

  it('hides the modal when clicking outside if isDismissible is true', async function () {
    let onOpenChange = jest.fn();
    let {getByRole} = render(
      <Provider theme={theme}>
        <TestModal isOpen onOpenChange={onOpenChange} isDismissable>
          <div role="dialog">contents</div>
        </TestModal>
      </Provider>
    );

    await waitFor(() => {
      expect(getByRole('dialog')).toBeVisible();
    }); // wait for animation

    fireEvent.mouseDown(document.body);
    fireEvent.mouseUp(document.body);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});
