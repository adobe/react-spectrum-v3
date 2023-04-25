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

import {act, fireEvent, render, triggerPress} from '@react-spectrum/test-utils';
import {AlertDialog} from '../';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';

describe('AlertDialog', function () {
  it('renders alert dialog with onPrimaryAction', function () {
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
    triggerPress(button);
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenCalledWith();
  });

  it('renders 2 button alert dialog with onPrimaryAction / onCancel', function () {
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
    triggerPress(cancelButton);
    expect(onPrimaryAction).toHaveBeenCalledTimes(0);
    expect(onCancelSpy).toHaveBeenCalledTimes(1);
    expect(onCancelSpy).toHaveBeenCalledWith();

    let confirmButton = getByText('confirm');
    triggerPress(confirmButton);
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onCancelSpy).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenCalledWith();
  });

  it('renders a 3 button alert dialog with onPrimaryAction / onCancel', function () {
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
    triggerPress(secondaryButton);
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    expect(onSecondaryAction).toHaveBeenLastCalledWith();
    expect(onCancelSpy).toHaveBeenCalledTimes(0);

    triggerPress(confirmButton);
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenLastCalledWith();
    expect(onCancelSpy).toHaveBeenCalledTimes(0);

    triggerPress(cancelButton);
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onCancelSpy).toHaveBeenCalledTimes(1);
    expect(onCancelSpy).toHaveBeenLastCalledWith();
  });

  it('disable its confirm button', function () {
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
    triggerPress(button);
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

  it('disable its secondary button', function () {
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
    triggerPress(button);
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

  it('allowsKeyboardConfirmation enabled', function () {
    let onPrimaryAction = jest.fn();
    let {getByRole} = render(
      <Provider theme={theme}>
        <AlertDialog variant="confirmation" allowsKeyboardConfirmation title="the title" primaryActionLabel="confirm" onPrimaryAction={onPrimaryAction}>
          Content body
        </AlertDialog>
      </Provider>
    );

    let dialog = getByRole('alertdialog');
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(document.activeElement, {key: 'Enter'});
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });

  it('only when the keydown event actually happens on the Dialog itself will allowsKeyboardConfirmation work', function () {
    let onPrimaryAction = jest.fn();
    let onKeyDown = jest.fn();
    let {getByText} = render(
      <Provider theme={theme}>
        <AlertDialog variant="confirmation" allowsKeyboardConfirmation title="the title" primaryActionLabel="confirm" onPrimaryAction={onPrimaryAction}>
          <button onKeyDown={onKeyDown}>native button</button>
        </AlertDialog>
      </Provider>
    );

    let button = getByText('native button');
    act(() => {
      button.focus();
    });
    expect(document.activeElement).toBe(button);

    fireEvent.keyDown(button, {key: 'Enter'});
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenCalledTimes(0);
  });
});
