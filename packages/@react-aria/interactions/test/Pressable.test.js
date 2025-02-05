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

import {pointerMap, render} from '@react-spectrum/test-utils-internal';
import {Pressable} from '../';
import React, {useImperativeHandle} from 'react';
import userEvent from '@testing-library/user-event';

describe('Pressable', function () {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should apply press events to child element', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let onPress = jest.fn();
    let {getByRole} = render(
      <Pressable onPress={onPress}>
        <button>Button</button>
      </Pressable>
    );

    let button = getByRole('button');
    await user.click(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should should merge with existing props, not overwrite', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let onPress = jest.fn();
    let onClick = jest.fn();
    let {getByRole} = render(
      <Pressable onPress={onPress}>
        <button onClick={onClick}>Button</button>
      </Pressable>
    );

    let button = getByRole('button');
    await user.click(button);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should should merge with existing ref', async function () {
    let ref1 = React.createRef();
    let ref2 = React.createRef();
    let {getByRole} = render(
      <Pressable ref={ref1}>
        <button ref={ref2}>Button</button>
      </Pressable>
    );

    let button = getByRole('button');
    expect(ref1.current).toBe(button);
    expect(ref2.current).toBe(button);
  });

  it('should automatically make child focusable', async function () {
    let {getByRole} = render(
      <Pressable>
        <span role="button">Button</span>
      </Pressable>
    );

    let button = getByRole('button');
    expect(button).toHaveAttribute('tabindex', '0');
  });

  it('should error if component does not forward its ref', async function () {
    let spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let Component = () => <button>Hi</button>;
    render(
      <Pressable>
        <Component>Button</Component>
      </Pressable>
    );

    expect(spy).toHaveBeenCalledWith('<Pressable> child must forward its ref to a DOM element.');
  });

  it('should error if component does not forward its ref to a DOM element', async function () {
    let spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let Component = React.forwardRef((_, ref) => {
      useImperativeHandle(ref, () => ({something: true}));
      return <button>Test</button>;
    });

    render(
      <Pressable>
        <Component>Button</Component>
      </Pressable>
    );

    expect(spy).toHaveBeenCalledWith('<Pressable> child must forward its ref to a DOM element.');
  });

  it('should warn if child is not focusable', async function () {
    let spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let Component = React.forwardRef((_, ref) => <span role="button" ref={ref}>Hi</span>);
    render(
      <Pressable>
        <Component>Button</Component>
      </Pressable>
    );

    expect(spy).toHaveBeenCalledWith('<Pressable> child must be focusable. Please ensure the tabIndex prop is passed through.');
  });

  it('should warn if child does not have a role', async function () {
    let spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Pressable>
        <span>Trigger</span>
      </Pressable>
    );

    expect(spy).toHaveBeenCalledWith('<Pressable> child must have an interactive ARIA role.');
  });

  it('should warn if child does not have an interactive role', async function () {
    let spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Pressable>
        <span role="presentation">Trigger</span>
      </Pressable>
    );

    expect(spy).toHaveBeenCalledWith('<Pressable> child must have an interactive ARIA role. Got "presentation".');
  });
});
