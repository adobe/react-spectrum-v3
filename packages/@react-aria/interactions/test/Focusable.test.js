/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Focusable} from '../';
import {pointerMap, render} from '@react-spectrum/test-utils-internal';
import React, {useImperativeHandle} from 'react';
import userEvent from '@testing-library/user-event';

describe('Focusable', function () {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should apply focusable props to child element', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let onFocus = jest.fn();
    let onBlur = jest.fn();
    let onKeyDown = jest.fn();
    let {getByRole} = render(
      <Focusable onFocus={onFocus} onKeyDown={onKeyDown} onBlur={onBlur}>
        <span role="button">Button</span>
      </Focusable>
    );

    let button = getByRole('button');
    expect(button).toHaveAttribute('tabindex', '0');

    await user.tab();
    expect(onFocus).toHaveBeenCalled();

    await user.keyboard('a');
    expect(onKeyDown).toHaveBeenCalled();

    await user.tab();
    expect(onBlur).toHaveBeenCalled();
  });

  it('supports isDisabled', async function () {
    let {getByRole} = render(
      <Focusable isDisabled>
        <span role="button">Button</span>
      </Focusable>
    );

    let button = getByRole('button');
    expect(button).not.toHaveAttribute('tabindex');
  });

  it('supports excludeFromTabOrder', async function () {
    let {getByRole} = render(
      <Focusable excludeFromTabOrder>
        <span role="button">Button</span>
      </Focusable>
    );

    let button = getByRole('button');
    expect(button).toHaveAttribute('tabindex', '-1');
  });

  it('supports autoFocus', async function () {
    let {getByRole} = render(
      <Focusable autoFocus>
        <span role="button">Button</span>
      </Focusable>
    );

    let button = getByRole('button');
    expect(document.activeElement).toBe(button);
  });

  it('should should merge with existing props', async function () {
    let {getByRole} = render(
      <Focusable>
        <button tabIndex={-1}>Button</button>
      </Focusable>
    );

    let button = getByRole('button');
    expect(button).toHaveAttribute('tabindex', '-1');
  });

  it('should should merge with existing ref', async function () {
    let ref1 = React.createRef();
    let ref2 = React.createRef();
    let {getByRole} = render(
      <Focusable ref={ref1}>
        <button ref={ref2}>Button</button>
      </Focusable>
    );

    let button = getByRole('button');
    expect(ref1.current).toBe(button);
    expect(ref2.current).toBe(button);
  });

  it('should error if component does not forward its ref', async function () {
    let spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let Component = () => <span role="button">Hi</span>;
    render(
      <Focusable>
        <Component>Button</Component>
      </Focusable>
    );

    expect(spy).toHaveBeenCalledWith('<Focusable> child must forward its ref to a DOM element.');
  });

  it('should error if component does not forward its ref to a DOM element', async function () {
    let spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let Component = React.forwardRef((_, ref) => {
      useImperativeHandle(ref, () => ({something: true}));
      return <button>Test</button>;
    });

    render(
      <Focusable>
        <Component>Button</Component>
      </Focusable>
    );

    expect(spy).toHaveBeenCalledWith('<Focusable> child must forward its ref to a DOM element.');
  });

  it('should warn if child is not focusable', async function () {
    let spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let Component = React.forwardRef((_, ref) => <span role="button" ref={ref}>Hi</span>);
    render(
      <Focusable>
        <Component>Button</Component>
      </Focusable>
    );

    expect(spy).toHaveBeenCalledWith('<Focusable> child must be focusable. Please ensure the tabIndex prop is passed through.');
  });

  it('should warn if child does not have a role', async function () {
    let spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Focusable>
        <span>Trigger</span>
      </Focusable>
    );

    expect(spy).toHaveBeenCalledWith('<Focusable> child must have an interactive ARIA role.');
  });

  it('should warn if child does not have an interactive role', async function () {
    let spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Focusable>
        <span role="presentation">Trigger</span>
      </Focusable>
    );

    expect(spy).toHaveBeenCalledWith('<Focusable> child must have an interactive ARIA role. Got "presentation".');
  });
});
