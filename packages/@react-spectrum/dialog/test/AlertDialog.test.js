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

import {AlertDialog} from '../';
import {pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

describe('AlertDialog', function () {
  it('renders alert dialog with onPrimaryAction', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let onPrimaryAction = jest.fn();
    let {getByRole} = render(
      <Provider theme={theme}>
        <AlertDialog variant="confirmation" title="the title" primaryActionLabel="confirm" onPrimaryAction={onPrimaryAction}>
          Content body
        </AlertDialog>
      </Provider>
    );

    let dialog = getByRole('alertdialog');
    expect(document.activeElement).toBe(dialog);

    let button = getByRole('button');
    await user.click(button);
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenCalledWith();
  });

  it('renders 2 button alert dialog with onPrimaryAction / onCancel', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let onCancelSpy = jest.fn();
    let onPrimaryAction = jest.fn();
    let {getByRole, getByText} = render(
      <Provider theme={theme}>
        <AlertDialog variant="confirmation" title="the title" primaryActionLabel="confirm" cancelLabel="cancel" onPrimaryAction={onPrimaryAction} onCancel={onCancelSpy}>
          Content body
        </AlertDialog>
      </Provider>
    );

    let dialog = getByRole('alertdialog');
    expect(document.activeElement).toBe(dialog);

    let cancelButton = getByText('cancel');
    await user.click(cancelButton);
    expect(onPrimaryAction).toHaveBeenCalledTimes(0);
    expect(onCancelSpy).toHaveBeenCalledTimes(1);
    expect(onCancelSpy).toHaveBeenCalledWith();

    let confirmButton = getByText('confirm');
    await user.click(confirmButton);
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onCancelSpy).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenCalledWith();
  });

  it('renders a 3 button alert dialog with onPrimaryAction / onCancel', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let onCancelSpy = jest.fn();
    let onPrimaryAction = jest.fn();
    let onSecondaryAction = jest.fn();
    let {getByRole, getByText} = render(
      <Provider theme={theme}>
        <AlertDialog variant="confirmation" title="the title" primaryActionLabel="confirm" cancelLabel="cancel" secondaryActionLabel="secondary" onPrimaryAction={onPrimaryAction} onSecondaryAction={onSecondaryAction} onCancel={onCancelSpy}>
          Content body
        </AlertDialog>
      </Provider>
    );

    let dialog = getByRole('alertdialog');
    expect(document.activeElement).toBe(dialog);

    let confirmButton = getByText('confirm');
    let secondaryButton = getByText('secondary');
    let cancelButton = getByText('cancel');
    await user.click(secondaryButton);
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    expect(onSecondaryAction).toHaveBeenLastCalledWith();
    expect(onCancelSpy).toHaveBeenCalledTimes(0);

    await user.click(confirmButton);
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenLastCalledWith();
    expect(onCancelSpy).toHaveBeenCalledTimes(0);

    await user.click(cancelButton);
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onCancelSpy).toHaveBeenCalledTimes(1);
    expect(onCancelSpy).toHaveBeenLastCalledWith();
  });

  it('disable its confirm button', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let onPrimaryAction = jest.fn();
    let {getByRole, getByText} = render(
      <Provider theme={theme}>
        <AlertDialog variant="confirmation" isPrimaryActionDisabled title="the title" primaryActionLabel="confirm" onPrimaryAction={onPrimaryAction}>
          Content body
        </AlertDialog>
      </Provider>
    );

    let dialog = getByRole('alertdialog');
    expect(document.activeElement).toBe(dialog);

    let button = getByText('confirm');
    await user.click(button);
    expect(onPrimaryAction).toHaveBeenCalledTimes(0);
  });

  it('autofocus its confirm button', function () {
    let {getByText} = render(
      <Provider theme={theme}>
        <AlertDialog variant="confirmation" title="the title" primaryActionLabel="confirm" autoFocusButton="primary">
          Content body
        </AlertDialog>
      </Provider>
    );

    let button = getByText('confirm').closest('button');
    expect(document.activeElement).toBe(button);
  });

  it('autofocus its cancel button', function () {
    let {getByText} = render(
      <Provider theme={theme}>
        <AlertDialog variant="confirmation" title="the title" primaryActionLabel="confirm" cancelLabel="cancel" autoFocusButton="cancel" >
          Content body
        </AlertDialog>
      </Provider>
    );

    let button = getByText('cancel').closest('button');
    expect(document.activeElement).toBe(button);
  });

  it('disable its secondary button', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let onPrimaryAction = jest.fn();
    let {getByRole, getByText} = render(
      <Provider theme={theme}>
        <AlertDialog variant="confirmation" isSecondaryActionDisabled title="the title" primaryActionLabel="confirm" secondaryActionLabel="secondary" onPrimaryAction={onPrimaryAction}>
          Content body
        </AlertDialog>
      </Provider>
    );

    let dialog = getByRole('alertdialog');
    expect(document.activeElement).toBe(dialog);

    let button = getByText('secondary');
    await user.click(button);
    expect(onPrimaryAction).toHaveBeenCalledTimes(0);
  });

  it('autofocus its secondary button', function () {
    let {getByText} = render(
      <Provider theme={theme}>
        <AlertDialog variant="confirmation" title="the title" primaryActionLabel="confirm" secondaryActionLabel="secondary" autoFocusButton="secondary">
          Content body
        </AlertDialog>
      </Provider>
    );

    let button = getByText('secondary').closest('button');
    expect(document.activeElement).toBe(button);
  });
});
