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

import {act, fireEvent, render} from '@testing-library/react';
import {ActionButton, Button, ClearButton, LogicButton} from '../';
import React from 'react';
import {triggerPress} from '@react-spectrum/test-utils';
import V2Button from '@react/react-spectrum/Button';

/**
 * Logic Button has no tests outside of this file because functionally it is identical
 * to Button right now. The only difference is the class names, and since we aren't
 * testing that, these are all the tests we need to cover Logic Button.
 */

describe('Button', function () {
  let onPressSpy = jest.fn();

  afterEach(() => {
    onPressSpy.mockClear();
  });

  it.each`
    Name              | Component      | props
    ${'ActionButton'} | ${ActionButton}| ${{onPress: onPressSpy}}
    ${'Button'}       | ${Button}      | ${{onPress: onPressSpy}}
    ${'LogicButton'}  | ${LogicButton} | ${{onPress: onPressSpy}}
    ${'V2Button'}     | ${V2Button}    | ${{onClick: onPressSpy}}
  `('$Name handles defaults', function ({Component, props}) {
    let {getByRole, getByText} = render(<Component {...props}>Click Me</Component>);

    let button = getByRole('button');
    triggerPress(button);
    expect(onPressSpy).toHaveBeenCalledTimes(1);

    let text = getByText('Click Me');
    expect(text).not.toBeNull();
  });

  it.each`
    Name              | Component
    ${'ActionButton'} | ${ActionButton}
    ${'Button'}       | ${Button}
    ${'ClearButton'}  | ${ClearButton}
    ${'LogicButton'}  | ${LogicButton}
    ${'V2Button'}     | ${V2Button}
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
    ${'V2Button'}     | ${V2Button}
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
    ${'V2Button'}     | ${V2Button}
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
    ${'V2Button'}     | ${V2Button}
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
    ${'V2Button'}     | ${V2Button}       | ${{className: 'x-men-first-class'}}
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
    ${'V2Button'}     | ${V2Button}
  `('$Name handles deprecated onClick', function ({Component}) {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let {getByRole} = render(<Component onClick={onPressSpy}>Click Me</Component>);

    let button = getByRole('button');
    triggerPress(button);
    expect(onPressSpy).toHaveBeenCalledTimes(1);
    if (Component === Button) {
      expect(spyWarn).toHaveBeenCalledWith('onClick is deprecated, please use onPress');
    }
  });

  it.each`
    Name              | Component      | props
    ${'ActionButton'} | ${ActionButton}| ${{onPress: onPressSpy, elementType: 'a'}}
    ${'Button'}       | ${Button}      | ${{onPress: onPressSpy, elementType: 'a'}}
    ${'LogicButton'}  | ${LogicButton} | ${{onPress: onPressSpy, elementType: 'a'}}
    ${'V2Button'}     | ${V2Button}    | ${{onClick: onPressSpy, element: 'a'}}
  `('$Name can have elementType=a', function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let button = getByRole('button');
    expect(button).toHaveAttribute('tabindex', '0');
    triggerPress(button);
    expect(onPressSpy).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, {key: 'Enter', code: 13});
    fireEvent.keyUp(button, {key: 'Enter', code: 13});
    expect(onPressSpy).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(button, {key: ' ', code: 32});
    fireEvent.keyUp(button, {key: ' ', code: 32});
    expect(onPressSpy).toHaveBeenCalledTimes(3);
  });

  it.each`
    Name              | Component      | props
    ${'ActionButton'} | ${ActionButton}| ${{onPress: onPressSpy, elementType: 'a', href: '#only-hash-in-jsdom'}}
    ${'Button'}       | ${Button}      | ${{onPress: onPressSpy, elementType: 'a', href: '#only-hash-in-jsdom'}}
    ${'LogicButton'}  | ${LogicButton} | ${{onPress: onPressSpy, elementType: 'a', href: '#only-hash-in-jsdom'}}
    ${'V2Button'}     | ${V2Button}    | ${{onClick: onPressSpy, element: 'a', href: '#only-hash-in-jsdom'}}
  `('$Name can have elementType=a with an href', function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let button = getByRole('button');
    expect(button).toHaveAttribute('tabindex', '0');
    expect(button).toHaveAttribute('href', '#only-hash-in-jsdom');
    triggerPress(button);
    expect(onPressSpy).toHaveBeenCalledTimes(1);
  });

  it.each`
    Name              | Component      | props
    ${'ActionButton'} | ${ActionButton}| ${{onPress: onPressSpy, isDisabled: true}}
    ${'Button'}       | ${Button}      | ${{onPress: onPressSpy, isDisabled: true}}
    ${'ClearButton'}  | ${ClearButton} | ${{onPress: onPressSpy, isDisabled: true}}
    ${'LogicButton'}  | ${LogicButton} | ${{onPress: onPressSpy, isDisabled: true}}
    ${'V2Button'}     | ${V2Button}    | ${{onClick: onPressSpy, disabled: true}}
  `('$Name does not respond when disabled', function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let button = getByRole('button');
    triggerPress(button);
    expect(onPressSpy).not.toHaveBeenCalled();
  });

  // when a user uses the keyboard and keyDowns 'enter' or 'space' on a button, it fires an onclick.
  // when code dispatches a keyDown for 'enter' or 'space', it does not fire onclick
  // this means that it's impossible for us to write a test for the 'button' elementType for keyDown 'enter' or 'space'
  // see https://jsfiddle.net/snowystinger/z6vmrw4d/1/
  // it's also extraneous to test with 'enter' or 'space' on a button because it'd just be testing
  // the spec https://www.w3.org/TR/WCAG20-TECHS/SCR35.html

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

  it.each`
    Name                | Component | props
    ${'Button'}         | ${Button} | ${{onPress: onPressSpy, isPending: true}}
  `('$Name supports isPending', async function ({Component, props}) {
    let {getByRole, rerender} = render(<Component {...props}>Click me</Component>);

    let button = getByRole('button');

    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-disabled');

    triggerPress(button);
    expect(onPressSpy).toHaveBeenCalledTimes(0);

    await act(async () => new Promise((c) => setTimeout(c, 1000))); // Enter intermediate state

    // TODO: verify that label is visible only to screen readers
    triggerPress(button);
    expect(button.textContent).toEqual('Click me');
    expect(onPressSpy).toHaveBeenCalledTimes(0);

    rerender(<Component {...props} isPending={false} />);

    expect(button).not.toHaveAttribute('aria-disabled');

    triggerPress(button);
    expect(onPressSpy).toHaveBeenCalledTimes(1);
  });
});
