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

import {act, pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import {ActionButton, Button, ClearButton, LogicButton} from '../';
import {Checkbox, defaultTheme} from '@adobe/react-spectrum';
import {Form} from '@react-spectrum/form';
import {Provider} from '@react-spectrum/provider';
import React, {useState} from 'react';
import userEvent from '@testing-library/user-event';

/**
 * Logic Button has no tests outside of this file because functionally it is identical
 * to Button right now. The only difference is the class names, and since we aren't
 * testing that, these are all the tests we need to cover Logic Button.
 */

describe('Button', function () {
  let onPressSpy = jest.fn();
  let spinnerVisibilityDelay = 1000;
  let onPressStartSpy = jest.fn();
  let onPressEndSpy = jest.fn();
  let onPressUpSpy = jest.fn();
  let onPressChangeSpy = jest.fn();
  let user;

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });

  afterEach(() => {
    onPressSpy.mockClear();
  });

  it.each`
    Name              | Component      | props
    ${'ActionButton'} | ${ActionButton}| ${{onPress: onPressSpy}}
    ${'Button'}       | ${Button}      | ${{onPress: onPressSpy}}
    ${'LogicButton'}  | ${LogicButton} | ${{onPress: onPressSpy}}
  `('$Name handles defaults', async function ({Component, props}) {
    let {getByRole, getByText} = render(<Component {...props}>Click Me</Component>);

    let button = getByRole('button');
    await user.click(button);
    expect(onPressSpy).toHaveBeenCalledTimes(1);

    let text = getByText('Click Me');
    expect(text).not.toBeNull();
  });

  it.each`
    Name              | Component      | props
    ${'ActionButton'} | ${ActionButton}| ${{onPress: onPressSpy, onPressStart: onPressStartSpy, onPressEnd: onPressEndSpy, onPressUp: onPressUpSpy, onPressChange: onPressChangeSpy}}
    ${'Button'}       | ${Button}      | ${{onPress: onPressSpy, onPressStart: onPressStartSpy, onPressEnd: onPressEndSpy, onPressUp: onPressUpSpy, onPressChange: onPressChangeSpy}}
    ${'LogicButton'}  | ${LogicButton} | ${{onPress: onPressSpy, onPressStart: onPressStartSpy, onPressEnd: onPressEndSpy, onPressUp: onPressUpSpy, onPressChange: onPressChangeSpy}}
  `('$Name supports press events', async function ({Component, props}) {
    let {getByRole, getByText} = render(<Component {...props}>Click Me</Component>);

    let button = getByRole('button');
    await user.click(button);
    expect(onPressStartSpy).toHaveBeenCalledTimes(1);
    expect(onPressSpy).toHaveBeenCalledTimes(1);
    expect(onPressEndSpy).toHaveBeenCalledTimes(1);
    expect(onPressUpSpy).toHaveBeenCalledTimes(1);
    expect(onPressChangeSpy).toHaveBeenCalledTimes(2);

    let text = getByText('Click Me');
    expect(text).not.toBeNull();
  });

  it.each`
    Name              | Component      | props
    ${'ActionButton'} | ${ActionButton}| ${{onPress: onPressSpy, onPressStart: onPressStartSpy, onPressEnd: onPressEndSpy, onPressUp: onPressUpSpy, onPressChange: onPressChangeSpy}}
    ${'Button'}       | ${Button}      | ${{onPress: onPressSpy, onPressStart: onPressStartSpy, onPressEnd: onPressEndSpy, onPressUp: onPressUpSpy, onPressChange: onPressChangeSpy}}
    ${'LogicButton'}  | ${LogicButton} | ${{onPress: onPressSpy, onPressStart: onPressStartSpy, onPressEnd: onPressEndSpy, onPressUp: onPressUpSpy, onPressChange: onPressChangeSpy}}
  `('$Name keyboard press and key events', async function ({Component, props}) {
    let onKeyDownSpy = jest.fn();
    let onKeyUpSpy = jest.fn();
    let {getByRole} = render(<Component {...props} onKeyDown={onKeyDownSpy} onKeyUp={onKeyUpSpy}>Click Me</Component>);

    let button = getByRole('button');
    await user.tab();
    expect(onKeyUpSpy).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(button);
    await user.keyboard('{Enter}');
    expect(onPressStartSpy).toHaveBeenCalledTimes(1);
    expect(onPressSpy).toHaveBeenCalledTimes(1);
    expect(onPressEndSpy).toHaveBeenCalledTimes(1);
    expect(onPressUpSpy).toHaveBeenCalledTimes(1);
    expect(onPressChangeSpy).toHaveBeenCalledTimes(2);
    expect(onKeyDownSpy).toHaveBeenCalledTimes(1);
    expect(onKeyUpSpy).toHaveBeenCalledTimes(2);

    await user.keyboard('A');
    expect(onKeyDownSpy).toHaveBeenCalledTimes(2);
    expect(onKeyUpSpy).toHaveBeenCalledTimes(3);
  });

  it.each`
    Name              | Component
    ${'ActionButton'} | ${ActionButton}
    ${'Button'}       | ${Button}
    ${'ClearButton'}  | ${ClearButton}
    ${'LogicButton'}  | ${LogicButton}
  `('$Name allows custom props to be passed through to the button', function ({Component}) {
    let {getByRole} = render(<Component data-foo="bar">Click Me</Component>);

    let button = getByRole('button');
    expect(button).toHaveAttribute('data-foo', 'bar');
  });

  it.each`
    Name              | Component
    ${'ActionButton'} | ${ActionButton}
    ${'Button'}       | ${Button}
    ${'ClearButton'}  | ${ClearButton}
    ${'LogicButton'}  | ${LogicButton}
  `('$Name supports aria-label', function ({Component}) {
    let {getByRole} = render(<Component aria-label="Test" />);

    let button = getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Test');
  });

  it.each`
    Name              | Component
    ${'ActionButton'} | ${ActionButton}
    ${'Button'}       | ${Button}
    ${'ClearButton'}  | ${ClearButton}
    ${'LogicButton'}  | ${LogicButton}
  `('$Name supports aria-labelledby', function ({Component}) {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Component aria-labelledby="test" />
      </>
    );

    let button = getByRole('button');
    expect(button).toHaveAttribute('aria-labelledby', 'test');
  });

  it.each`
    Name              | Component
    ${'ActionButton'} | ${ActionButton}
    ${'Button'}       | ${Button}
    ${'ClearButton'}  | ${ClearButton}
    ${'LogicButton'}  | ${LogicButton}
  `('$Name supports aria-describedby', function ({Component}) {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Component aria-describedby="test">Hi</Component>
      </>
    );

    let button = getByRole('button');
    expect(button).toHaveAttribute('aria-describedby', 'test');
  });

  it.each`
    Name              | Component         | props
    ${'ActionButton'} | ${ActionButton}   | ${{UNSAFE_className: 'x-men-first-class'}}
    ${'Button'}       | ${Button}         | ${{UNSAFE_className: 'x-men-first-class'}}
    ${'ClearButton'}  | ${ClearButton}    | ${{UNSAFE_className: 'x-men-first-class'}}
    ${'LogicButton'}  | ${LogicButton}    | ${{UNSAFE_className: 'x-men-first-class'}}
  `('$Name allows a custom classname on the button', function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let button = getByRole('button');
    expect(button.getAttribute('class')).toEqual(expect.stringContaining('x-men-first-class'));
  });

  it.each`
    Name              | Component
    ${'ActionButton'} | ${ActionButton}
    ${'Button'}       | ${Button}
    ${'ClearButton'}  | ${ClearButton}
    ${'LogicButton'}  | ${LogicButton}
  `('$Name handles deprecated onClick', async function ({Component}) {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let {getByRole} = render(<Component onClick={onPressSpy}>Click Me</Component>);

    let button = getByRole('button');
    await user.click(button);
    expect(onPressSpy).toHaveBeenCalledTimes(1);
    expect(spyWarn).toHaveBeenCalledWith('onClick is deprecated, please use onPress');
  });

  it.each`
    Name              | Component      | props
    ${'ActionButton'} | ${ActionButton}| ${{onPress: onPressSpy, elementType: 'a'}}
    ${'Button'}       | ${Button}      | ${{onPress: onPressSpy, elementType: 'a'}}
    ${'LogicButton'}  | ${LogicButton} | ${{onPress: onPressSpy, elementType: 'a'}}
  `('$Name can have elementType=a', async function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let button = getByRole('button');
    expect(button).toHaveAttribute('tabindex', '0');
    expect(button).not.toHaveAttribute('type', 'button');
    await user.click(button);
    expect(onPressSpy).toHaveBeenCalledTimes(1);

    await user.keyboard('{Enter}');
    expect(onPressSpy).toHaveBeenCalledTimes(2);

    await user.keyboard('[Space]');
    expect(onPressSpy).toHaveBeenCalledTimes(3);
  });

  it.each`
    Name              | Component      | props
    ${'ActionButton'} | ${ActionButton}| ${{onPress: onPressSpy, elementType: 'a', href: '#only-hash-in-jsdom'}}
    ${'Button'}       | ${Button}      | ${{onPress: onPressSpy, elementType: 'a', href: '#only-hash-in-jsdom'}}
    ${'LogicButton'}  | ${LogicButton} | ${{onPress: onPressSpy, elementType: 'a', href: '#only-hash-in-jsdom'}}
  `('$Name can have elementType=a with an href', async function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let button = getByRole('button');
    expect(button).toHaveAttribute('tabindex', '0');
    expect(button).toHaveAttribute('href', '#only-hash-in-jsdom');
    await user.click(button);
    expect(onPressSpy).toHaveBeenCalledTimes(1);
  });

  it.each`
    Name              | Component      | props
    ${'ActionButton'} | ${ActionButton}| ${{onPress: onPressSpy, isDisabled: true}}
    ${'Button'}       | ${Button}      | ${{onPress: onPressSpy, isDisabled: true}}
    ${'ClearButton'}  | ${ClearButton} | ${{onPress: onPressSpy, isDisabled: true}}
    ${'LogicButton'}  | ${LogicButton} | ${{onPress: onPressSpy, isDisabled: true}}
  `('$Name does not respond when disabled', async function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let button = getByRole('button');
    await user.click(button);
    expect(button).toBeDisabled();
    expect(onPressSpy).not.toHaveBeenCalled();
  });

  it.each`
    Name                | Component
    ${'ActionButton'}   | ${ActionButton}
    ${'Button'}         | ${Button}
    ${'LogicButton'}    | ${LogicButton}
  `('$Name supports autoFocus', function ({Component}) {
    let {getByRole} = render(<Component autoFocus>Click Me</Component>);

    let button = getByRole('button');
    expect(document.activeElement).toBe(button);
  });


  it('prevents default for non-submit types', async function () {
    let eventDown;
    let eventUp;
    let btn = React.createRef();
    let {getByRole} = render(
      <Provider theme={defaultTheme}>
        <Form>
          <Checkbox>An Input</Checkbox>
          <Button variant="primary" ref={btn}>Click Me</Button>
        </Form>
      </Provider>
    );
    // need to attach event listeners after instead of directly on Button because the ones directly on Button
    // will fire before the usePress ones
    btn.current.UNSAFE_getDOMNode().addEventListener('keydown', e => eventDown = e);
    btn.current.UNSAFE_getDOMNode().addEventListener('keyup', e => eventUp = e);

    let button = getByRole('button');
    act(() => button.focus());
    await user.keyboard('{Enter}');
    expect(eventDown.defaultPrevented).toBeTruthy();
    expect(eventUp.defaultPrevented).toBeTruthy();

    await user.keyboard('[Space]');
    expect(eventDown.defaultPrevented).toBeTruthy();
    expect(eventUp.defaultPrevented).toBeTruthy();
  });

  // we only need to test that we allow the browser to do the default thing when space or enter is pressed on a submit button
  // space submits on key up and is actually a click
  it('submit in form using space', async function () {
    let eventUp;
    let btn = React.createRef();
    let {getByRole} = render(
      <Provider theme={defaultTheme}>
        <Form>
          <Checkbox>An Input</Checkbox>
          <Button variant="primary" type="submit" ref={btn}>Click Me</Button>
        </Form>
      </Provider>
    );
    btn.current.UNSAFE_getDOMNode().addEventListener('keyup', e => eventUp = e);

    let button = getByRole('button');
    act(() => button.focus());
    await user.keyboard('{Space}');
    expect(eventUp.defaultPrevented).toBeFalsy();
  });

  // enter submits on keydown
  it('submit in form using enter', async function () {
    let eventDown;
    let btn = React.createRef();
    let {getByRole} = render(
      <Provider theme={defaultTheme}>
        <Form>
          <Checkbox>An Input</Checkbox>
          <Button variant="primary" type="submit" ref={btn}>Click Me</Button>
        </Form>
      </Provider>
    );
    btn.current.UNSAFE_getDOMNode().addEventListener('keydown', e => {
      eventDown = {...e};
      // Prevent default to avoid "Error: Not implemented: HTMLFormElement.prototype.requestSubmit"
      e.preventDefault();
    });
    let button = getByRole('button');
    act(() => button.focus());
    await user.keyboard('[Enter]');
    expect(eventDown.defaultPrevented).toBeFalsy();
  });

  // isPending state
  it('displays a spinner after a short delay when isPending prop is true', async function () {
    let onPressSpy = jest.fn();
    function TestComponent() {
      let [pending, setPending] = useState(false);
      return (
        <Button
          onPress={(pending) => {
            setPending(true);
            onPressSpy();
          }}
          isPending={pending}>
          Click me
        </Button>
      );
    }
    let {getByRole, queryByRole} = render(<TestComponent />);
    let button = getByRole('button');
    expect(button).not.toHaveAttribute('aria-disabled');
    await user.click(button);
    // Button is disabled immediately, but spinner visibility is delayed
    expect(button).toHaveAttribute('aria-disabled', 'true');
    let spinner = queryByRole('progressbar');
    expect(spinner).not.toBeInTheDocument();
    // Multiple clicks shouldn't call onPressSpy
    await user.click(button);
    act(() => {
      jest.advanceTimersByTime(spinnerVisibilityDelay);
    });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    spinner = queryByRole('progressbar', {hidden: true});
    expect(spinner).toBeVisible();
    expect(onPressSpy).toHaveBeenCalledTimes(1);
  });

  // isPending anchor element
  it('removes href attribute from anchor element when isPending is true', () => {
    let {getByRole} = render(
      <Button elementType="a" href="//example.com" isPending>
        Click Me
      </Button>
    );
    let button = getByRole('button');
    expect(button).not.toHaveAttribute('href');
  });

  // 'implicit submission' can't be tested https://github.com/testing-library/react-testing-library/issues/487
});
