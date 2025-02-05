/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, pointerMap, render} from '@react-spectrum/test-utils-internal';
import {Button, Dialog, DialogTrigger, OverlayArrow, Popover, Pressable} from '../';
import React from 'react';
import userEvent from '@testing-library/user-event';

let TestPopover = (props) => (
  <DialogTrigger>
    <Button />
    <Popover {...props}>
      <OverlayArrow>
        <svg width={12} height={12}>
          <path d="M0 0,L6 6,L12 0" />
        </svg>
      </OverlayArrow>
      <Dialog>Popover</Dialog>
    </Popover>
  </DialogTrigger>
);

describe('Popover', () => {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });
  afterEach(() => {
    act(() => jest.runAllTimers());
  });

  it('works with a dialog', async () => {
    let {getByRole, queryByRole} = render(<TestPopover />);

    let button = getByRole('button');
    expect(queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(button);

    let dialog = getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.closest('.react-aria-Popover')).toHaveAttribute('data-trigger', 'DialogTrigger');

    await user.click(document.body);

    expect(dialog).not.toBeInTheDocument();
  });

  it('should handle focus', async () => {
    let {getByRole} = render(<TestPopover />);

    let button = getByRole('button');

    await user.tab();
    expect(button).toHaveFocus();

    await user.click(button);

    let dialog = getByRole('dialog');
    expect(dialog).toHaveFocus();

    await user.click(document.body);
    act(() => jest.runAllTimers());

    expect(button).toHaveFocus();
  });

  it('should support render props', async () => {
    let {getByRole} = render(
      <DialogTrigger>
        <Button />
        <Popover placement="bottom start">
          {({placement}) => <Dialog>Popover at {placement}</Dialog>}
        </Popover>
      </DialogTrigger>
    );

    let button = getByRole('button');

    await user.click(button);

    let dialog = getByRole('dialog');
    expect(dialog).toHaveTextContent('Popover at bottom');
  });

  it('should support being used standalone', async () => {
    let triggerRef = React.createRef();
    let onOpenChange = jest.fn();
    let {getByRole} = render(<>
      <span ref={triggerRef}>Trigger</span>
      <Popover isOpen triggerRef={triggerRef} onOpenChange={onOpenChange}>
        <Dialog aria-label="Popover">A popover</Dialog>
      </Popover>
    </>);

    let dialog = getByRole('dialog');
    expect(dialog).toHaveTextContent('A popover');

    await user.click(document.body);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('isOpen and defaultOpen should override state from context', async () => {
    let onOpenChange = jest.fn();
    let {getByRole} = render(<>
      <DialogTrigger>
        <Button />
        <Popover isOpen onOpenChange={onOpenChange}>
          <Dialog>A popover</Dialog>
        </Popover>
      </DialogTrigger>
    </>);

    let dialog = getByRole('dialog');
    expect(dialog).toHaveTextContent('A popover');

    await user.click(document.body);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('supports isEntering and isExiting props', async () => {
    let {getByRole, rerender} = render(<TestPopover isEntering />);

    let button = getByRole('button');
    await user.click(button);

    let popover = getByRole('dialog').closest('.react-aria-Popover');
    expect(popover).toHaveAttribute('data-entering');

    rerender(<TestPopover />);
    expect(popover).not.toHaveAttribute('data-entering');

    rerender(<TestPopover isExiting />);
    await user.click(button);

    expect(popover).toBeInTheDocument();
    expect(popover).toHaveAttribute('data-exiting');

    rerender(<TestPopover />);
    expect(popover).not.toBeInTheDocument();
  });

  it('supports overriding styles', async () => {
    let {getByRole, getByTestId} = render(
      <DialogTrigger>
        <Button />
        <Popover style={{zIndex: 5}}>
          <OverlayArrow style={{top: 5}} data-testid="arrow">
            <svg width={12} height={12}>
              <path d="M0 0,L6 6,L12 0" />
            </svg>
          </OverlayArrow>
          <Dialog>Popover</Dialog>
        </Popover>
      </DialogTrigger>
    );

    let button = getByRole('button');
    await user.click(button);

    let popover = getByRole('dialog').closest('.react-aria-Popover');
    expect(popover).toHaveAttribute('style', expect.stringContaining('z-index: 5'));
    let arrow = getByTestId('arrow');
    expect(arrow).toHaveAttribute('style', expect.stringContaining('top: 5px'));
  });

  describe('portalContainer', () => {
    function InfoPopover(props) {
      return (
        <DialogTrigger>
          <Button />
          <Popover UNSTABLE_portalContainer={props.container}>
            <OverlayArrow>
              <svg width={12} height={12}>
                <path d="M0 0,L6 6,L12 0" />
              </svg>
            </OverlayArrow>
            <Dialog>Popover</Dialog>
          </Popover>
        </DialogTrigger>
      );
    }
    function App() {
      let [container, setContainer] = React.useState();
      return (
        <>
          <InfoPopover container={container} />
          <div ref={setContainer} data-testid="custom-container" />
        </>
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

  it('should support custom Pressable trigger', async () => {
    let {getByRole} = render(
      <DialogTrigger>
        <Pressable>
          <span role="button">Trigger</span>
        </Pressable>
        <Popover>
          <Dialog>Popover</Dialog>
        </Popover>
      </DialogTrigger>
    );

    let button = getByRole('button');

    await user.click(button);

    let dialog = getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });
});
