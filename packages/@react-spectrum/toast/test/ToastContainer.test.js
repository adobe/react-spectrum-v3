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

import {act, fireEvent, pointerMap, render, within} from '@react-spectrum/test-utils-internal';
import {Button} from '@react-spectrum/button';
import {clearToastQueue, ToastContainer, ToastQueue} from '../src/ToastContainer';
import {defaultTheme} from '@adobe/react-spectrum';
import {Provider} from '@react-spectrum/provider';
import React, {useState} from 'react';
import userEvent from '@testing-library/user-event';

function RenderToastButton(props = {}) {
  return (
    <div>
      <Button
        onPress={() => ToastQueue[props.variant || 'neutral'](props.content ?? 'Toast is default', props)}
        variant="primary">
        Show Default Toast
      </Button>
    </div>
  );
}

function renderComponent(contents) {
  return render(
    <Provider theme={defaultTheme}>
      <ToastContainer />
      {contents}
    </Provider>
  );
}

function fireAnimationEnd(alert) {
  let e = new Event('animationend', {bubbles: true, cancelable: false});
  e.animationName = 'fade-out';
  fireEvent(alert, e);
}

describe('Toast Provider and Container', function () {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  beforeEach(() => {
    jest.useFakeTimers();
    clearToastQueue();
  });

  afterEach(() => {
    act(() => jest.runAllTimers());
  });

  it('renders a button that triggers a toast', async () => {
    let {getByRole, queryByRole} = renderComponent(<RenderToastButton />);
    let button = getByRole('button');

    expect(queryByRole('alert')).toBeNull();
    await user.click(button);

    let region = getByRole('region');
    expect(region).toHaveAttribute('aria-label', 'Notifications');

    let alert = getByRole('alert');
    expect(alert).toBeVisible();

    button = within(alert).getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close');
    await user.click(button);

    fireAnimationEnd(alert);
    expect(queryByRole('alert')).toBeNull();
  });

  it('should label icon by variant', async () => {
    let {getByRole} = renderComponent(<RenderToastButton variant="positive" />);
    let button = getByRole('button');
    await user.click(button);

    let alert = getByRole('alert');
    let icon = within(alert).getByRole('img');
    expect(icon).toHaveAttribute('aria-label', 'Success');
  });

  it('removes a toast via timeout', async () => {
    let {getByRole, queryByRole} = renderComponent(<RenderToastButton timeout={5000} />);
    let button = getByRole('button');

    await user.click(button);

    let toast = getByRole('alert');
    expect(toast).toBeVisible();

    act(() => jest.advanceTimersByTime(1000));
    expect(toast).not.toHaveAttribute('data-animation', 'exiting');

    act(() => jest.advanceTimersByTime(5000));
    expect(toast).toHaveAttribute('data-animation', 'exiting');

    fireAnimationEnd(toast);
    expect(queryByRole('alert')).toBeNull();
  });

  it('pauses timers when hovering', async () => {
    let {getByRole, queryByRole} = renderComponent(<RenderToastButton timeout={5000} />);
    let button = getByRole('button');

    await user.click(button);

    let toast = getByRole('alert');
    expect(toast).toBeVisible();

    act(() => jest.advanceTimersByTime(1000));
    await user.hover(toast);

    act(() => jest.advanceTimersByTime(7000));
    expect(toast).not.toHaveAttribute('data-animation', 'exiting');

    await user.unhover(toast);

    act(() => jest.advanceTimersByTime(4000));
    expect(toast).toHaveAttribute('data-animation', 'exiting');

    fireAnimationEnd(toast);
    expect(queryByRole('alert')).toBeNull();
  });

  it('pauses timers when focusing', async () => {
    let {getByRole, queryByRole} = renderComponent(<RenderToastButton timeout={5000} />);
    let button = getByRole('button');

    await user.click(button);

    let toast = getByRole('alert');
    expect(toast).toBeVisible();

    act(() => jest.advanceTimersByTime(1000));
    act(() => within(toast).getByRole('button').focus());

    act(() => jest.advanceTimersByTime(7000));
    expect(toast).not.toHaveAttribute('data-animation', 'exiting');

    act(() => within(toast).getByRole('button').blur());

    act(() => jest.advanceTimersByTime(4000));
    expect(toast).toHaveAttribute('data-animation', 'exiting');

    fireAnimationEnd(toast);
    expect(queryByRole('alert')).toBeNull();
  });

  it('renders a toast with an action', async () => {
    let onAction = jest.fn();
    let onClose = jest.fn();
    let {getByRole, queryByRole} = renderComponent(<RenderToastButton actionLabel="Action" onAction={onAction} onClose={onClose} />);
    let button = getByRole('button');

    expect(queryByRole('alert')).toBeNull();
    await user.click(button);

    let alert = getByRole('alert');
    expect(alert).toBeVisible();

    let buttons = within(alert).getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Action');
    await user.click(buttons[0]);

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes toast on action', async () => {
    let onAction = jest.fn();
    let onClose = jest.fn();
    let {getByRole, queryByRole} = renderComponent(<RenderToastButton actionLabel="Action" onAction={onAction} onClose={onClose} shouldCloseOnAction />);
    let button = getByRole('button');

    expect(queryByRole('alert')).toBeNull();
    await user.click(button);

    let alert = getByRole('alert');
    expect(alert).toBeVisible();

    let buttons = within(alert).getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Action');
    await user.click(buttons[0]);

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    expect(alert).toHaveAttribute('data-animation', 'exiting');
    fireAnimationEnd(alert);
    expect(queryByRole('alert')).toBeNull();
  });

  it('can focus toast region using F6', async () => {
    let {getByRole} = renderComponent(<RenderToastButton timeout={5000} />);
    let button = getByRole('button');

    await user.click(button);

    let toast = getByRole('alert');
    expect(toast).toBeVisible();

    expect(document.activeElement).toBe(button);
    fireEvent.keyDown(button, {key: 'F6'});
    fireEvent.keyUp(button, {key: 'F6'});

    let region = getByRole('region');
    expect(document.activeElement).toBe(region);
  });

  it('should restore focus when a toast exits', async () => {
    let {getByRole, queryByRole} = renderComponent(<RenderToastButton />);
    let button = getByRole('button');

    await user.click(button);

    let toast = getByRole('alert');
    let closeButton = within(toast).getByRole('button');
    act(() => closeButton.focus());

    await user.click(closeButton);
    fireAnimationEnd(toast);
    expect(queryByRole('alert')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('should move focus to container when a toast exits and there are more', async () => {
    let {getAllByRole, getByRole, queryByRole} = renderComponent(<RenderToastButton />);
    let button = getByRole('button');

    await user.click(button);
    await user.click(button);

    let toast = getAllByRole('alert')[0];
    let closeButton = within(toast).getByRole('button');
    await user.click(closeButton);
    fireAnimationEnd(toast);

    expect(document.activeElement).toBe(getByRole('region'));

    toast = getByRole('alert');
    closeButton = within(toast).getByRole('button');
    await user.click(closeButton);
    fireAnimationEnd(toast);

    expect(queryByRole('alert')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('should support programmatically closing toasts', async () => {
    function ToastToggle() {
      let [close, setClose] = useState(null);

      return (
        <Button
          onPress={() => {
            if (close) {
              setClose(close());
            } else {
              let close = ToastQueue.positive('Toast is done!');
              setClose(() => close);
            }
          }}
          variant="primary">
          {close ? 'Hide' : 'Show'} Toast
        </Button>
      );
    }

    let {getByRole, queryByRole} = renderComponent(<ToastToggle />);
    let button = getByRole('button');

    await user.click(button);

    let toast = getByRole('alert');
    expect(toast).toBeVisible();

    await user.click(button);
    fireAnimationEnd(toast);
    expect(queryByRole('alert')).toBeNull();
  });

  it('should only render one ToastContainer', async () => {
    let {getByRole, getAllByRole, rerender} = render(
      <Provider theme={defaultTheme}>
        <ToastContainer key="first" />
        <ToastContainer key="second" />
        <RenderToastButton />
      </Provider>
    );

    let button = getByRole('button');
    await user.click(button);

    expect(getAllByRole('region')).toHaveLength(1);
    expect(getAllByRole('alert')).toHaveLength(1);

    rerender(
      <Provider theme={defaultTheme}>
        <ToastContainer key="second" />
        <RenderToastButton />
      </Provider>
    );

    expect(getAllByRole('region')).toHaveLength(1);
    expect(getAllByRole('alert')).toHaveLength(1);

    rerender(
      <Provider theme={defaultTheme}>
        <ToastContainer key="first" />
        <RenderToastButton />
      </Provider>
    );

    expect(getAllByRole('region')).toHaveLength(1);
    expect(getAllByRole('alert')).toHaveLength(1);

    rerender(
      <Provider theme={defaultTheme}>
        <ToastContainer key="first" />
        <ToastContainer key="second" />
        <RenderToastButton />
      </Provider>
    );

    expect(getAllByRole('region')).toHaveLength(1);
    expect(getAllByRole('alert')).toHaveLength(1);
  });

  it('should support custom toast events', async () => {
    let {getByRole, queryByRole} = renderComponent(<RenderToastButton />);

    let onToast = jest.fn().mockImplementation(e => e.preventDefault());
    window.addEventListener('react-spectrum-toast', onToast);

    let button = getByRole('button');
    await user.click(button);

    expect(queryByRole('alert')).toBeNull();
    expect(onToast).toHaveBeenCalledTimes(1);
    expect(onToast.mock.calls[0][0].detail).toEqual({
      children: 'Toast is default',
      variant: 'neutral',
      options: {}
    });

    window.removeEventListener('react-spectrum-toast', onToast);
  });

  it('should support custom aria-label', async () => {
    let {getByRole} = render(
      <Provider theme={defaultTheme}>
        <ToastContainer aria-label="Toasts" />
        <RenderToastButton />
      </Provider>
    );

    let button = getByRole('button');
    await user.click(button);

    let region = getByRole('region');
    expect(region).toHaveAttribute('aria-label', 'Toasts');
  });

  it('should support ReactNode as children/content', () => {
    let {getByRole} = renderComponent(
      <RenderToastButton
        content={
          <React.Fragment>
            <strong>My new folder</strong> created within <b>Week 1</b>
          </React.Fragment>
        } />
    );

    const button = getByRole('button');
    triggerPress(button);

    const alert = getByRole('alert');
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent('My new folder created within Week 1');
    expect(alert.querySelector('strong')).toBeVisible();
    expect(alert.querySelector('strong')).toHaveTextContent('My new folder');
    expect(alert.querySelector('b')).toBeVisible();
    expect(alert.querySelector('b')).toHaveTextContent('Week 1');
  });
});
