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

import {act, fireEvent, pointerMap, renderv3 as render, within} from '@react-spectrum/test-utils-internal';
import {ActionButton, Button} from '@react-spectrum/button';
import {ButtonGroup} from '@react-spectrum/buttongroup';
import {Content, Header} from '@react-spectrum/view';
import {Dialog, DialogContainer, useDialogContainer} from '../src';
import {DialogContainerExample, MenuExample, NestedDialogContainerExample} from '../stories/DialogContainerExamples';
import {Divider} from '@react-spectrum/divider';
import {Heading, Text} from '@react-spectrum/text';
import {Provider} from '@react-spectrum/provider';
import React, {useRef, useState} from 'react';
import {theme} from '@react-spectrum/theme-default';
import {UNSTABLE_PortalProvider} from '@react-aria/overlays';
import userEvent from '@testing-library/user-event';

describe('DialogContainer', function () {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {jest.runAllTimers();});
  });

  it('should open and close a dialog based on controlled state', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <DialogContainerExample />
      </Provider>
    );

    let button = getByRole('button');
    expect(queryByRole('dialog')).toBeNull();

    await user.click(button);
    act(() => {jest.runAllTimers();});

    let dialog = getByRole('dialog');
    expect(document.activeElement).toBe(dialog);

    button = within(dialog).getByText('Confirm');

    await user.click(button);
    act(() => {jest.runAllTimers();});

    expect(queryByRole('dialog')).toBeNull();
  });

  it('should support closing a dialog via the Escape key', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <DialogContainerExample />
      </Provider>
    );

    let button = getByRole('button');
    expect(queryByRole('dialog')).toBeNull();

    await user.click(button);
    act(() => {jest.runAllTimers();});

    let dialog = getByRole('dialog');
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(dialog, {key: 'Escape'});
    fireEvent.keyUp(dialog, {key: 'Escape'});
    act(() => {jest.runAllTimers();});

    expect(queryByRole('dialog')).toBeNull();
  });

  it('should not close a dialog via the Escape key if isKeyboardDismissDisabled', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <DialogContainerExample isKeyboardDismissDisabled />
      </Provider>
    );

    let button = getByRole('button');
    expect(queryByRole('dialog')).toBeNull();

    await user.click(button);
    act(() => {jest.runAllTimers();});

    let dialog = getByRole('dialog');
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(dialog, {key: 'Escape'});
    fireEvent.keyUp(dialog, {key: 'Escape'});
    act(() => {jest.runAllTimers();});

    expect(getByRole('dialog')).toBeVisible();
  });

  it('should not close when clicking outside the dialog by default', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <DialogContainerExample />
      </Provider>
    );

    let button = getByRole('button');
    expect(queryByRole('dialog')).toBeNull();

    await user.click(button);
    act(() => {jest.runAllTimers();});

    expect(getByRole('dialog')).toBeVisible();

    await user.click(document.body);
    act(() => {jest.runAllTimers();});

    expect(getByRole('dialog')).toBeVisible();
  });

  it('should close when clicking outside the dialog when isDismissible', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <DialogContainerExample isDismissable />
      </Provider>
    );

    let button = getByRole('button');
    expect(queryByRole('dialog')).toBeNull();

    await user.click(button);
    act(() => {jest.runAllTimers();});

    expect(getByRole('dialog')).toBeVisible();

    await user.click(document.body);
    act(() => {jest.runAllTimers();});

    expect(queryByRole('dialog')).toBeNull();
  });

  it('should not close the dialog when a trigger unmounts', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <MenuExample />
      </Provider>
    );

    let button = getByRole('button');
    expect(queryByRole('dialog')).toBeNull();

    await user.click(button);
    act(() => {jest.runAllTimers();});

    expect(queryByRole('dialog')).toBeNull();

    let menu = getByRole('menu');
    let menuitem = within(menu).getByRole('menuitem');

    await user.click(menuitem);
    act(() => {jest.runAllTimers();});

    expect(queryByRole('menu')).toBeNull();
    expect(queryByRole('menuitem')).toBeNull();

    let dialog = getByRole('dialog');
    button = within(dialog).getByText('Confirm');

    await user.click(button);
    act(() => {jest.runAllTimers();});
    act(() => {jest.runAllTimers();});

    expect(queryByRole('dialog')).toBeNull();
  });

  it('should be able to have dialogs open dialogs and still restore focus', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let {getByRole} = render(
      <Provider theme={theme}>
        <NestedDialogContainerExample />
      </Provider>
    );

    let button = getByRole('button');
    await user.click(button);
    act(() => {jest.runAllTimers();});

    let menu = getByRole('menu');
    let menuitem = within(menu).getAllByRole('menuitem')[0];

    await user.click(menuitem);
    act(() => {jest.runAllTimers();});

    let dialog = getByRole('dialog');
    let confirmButton = within(dialog).getByText('Do that');

    await user.click(confirmButton);
    act(() => {jest.runAllTimers();});

    dialog = getByRole('dialog');
    confirmButton = within(dialog).getByRole('button', {name: 'Do this'});

    expect(document.activeElement).toBe(confirmButton);

    let closeButton = getByRole('button', {name: 'Dismiss'});

    await user.click(closeButton);
    act(() => {jest.runAllTimers();});
    act(() => {jest.runAllTimers();});

    expect(document.activeElement).toBe(button);
  });

  describe('portalContainer', () => {
    let user;
    beforeAll(() => {
      user = userEvent.setup({delay: null, pointerMap});
      jest.useFakeTimers();
    });
    function ExampleDialog(props) {
      let container = useDialogContainer();

      return (
        <Dialog>
          <Heading>The Heading</Heading>
          <Header>The Header</Header>
          <Divider />
          <Content><Text>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sit amet tristique risus. In sit amet suscipit lorem. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In condimentum imperdiet metus non condimentum. Duis eu velit et quam accumsan tempus at id velit. Duis elementum elementum purus, id tempus mauris posuere a. Nunc vestibulum sapien pellentesque lectus commodo ornare.</Text></Content>
          {!props.isDismissable &&
            <ButtonGroup>
              <Button variant="secondary" onPress={container.dismiss}>Cancel</Button>
              <Button variant="cta" onPress={container.dismiss}>Confirm</Button>
            </ButtonGroup>
          }
        </Dialog>
      );
    }
    function App(props) {
      let container = useRef(null);
      let [isOpen, setOpen] = useState(false);

      return (
        <Provider theme={theme}>
          <ActionButton onPress={() => setOpen(true)}>Open dialog</ActionButton>
          <UNSTABLE_PortalProvider getContainer={() => container.current}>
            <DialogContainer onDismiss={() => setOpen(false)} {...props}>
              {isOpen &&
                <ExampleDialog {...props} />
              }
            </DialogContainer>
          </UNSTABLE_PortalProvider>
          <div ref={container} data-testid="custom-container" />
        </Provider>
      );
    }

    it('should render the dialog in the portal container', async () => {
      let {getByRole, getByTestId} = render(
        <App />
      );

      let button = getByRole('button');
      await user.click(button);

      expect(getByRole('dialog').closest('[data-testid="custom-container"]')).toBe(getByTestId('custom-container'));
    });
  });
});
