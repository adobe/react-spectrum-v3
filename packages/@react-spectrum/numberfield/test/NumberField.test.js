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

jest.mock('@react-aria/live-announcer');
import {act, fireEvent, pointerMap, renderv3 as render, within} from '@react-spectrum/test-utils-internal';
import {announce} from '@react-aria/live-announcer';
import {Button} from '@react-spectrum/button';
import {chain} from '@react-aria/utils';
import {defaultTheme} from '@adobe/react-spectrum';
import {Form} from '@react-spectrum/form';
import messages from '../../../@react-aria/numberfield/intl/*.json';
import {NumberField} from '../';
import {Provider} from '@react-spectrum/provider';
import React, {useState} from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

// for some reason hu-HU isn't supported in jsdom/node
let locales = Object.keys(messages).filter(locale => locale !== 'hu-HU');

// a note for these tests, text selection is not working in jsdom, so on focus will not select the value already
// in the numberfield

describe('NumberField', function () {
  let onChangeSpy = jest.fn();
  let onBlurSpy = jest.fn();
  let onKeyDownSpy = jest.fn();
  let onKeyUpSpy = jest.fn();
  let user;

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });

  afterEach(() => {
    onChangeSpy.mockClear();
    onBlurSpy.mockClear();
    onKeyDownSpy.mockClear();
    onKeyUpSpy.mockClear();
    announce.mockClear();
    // there's an announcer, make sure to run through it
    // make sure only to run the pending timers, spin button can cause an infinite loop if we run all
    act(() => {jest.runOnlyPendingTimers();});
  });

  function renderNumberField(props = {}, providerProps = {}) {
    let {locale = 'en-US', scale = 'medium'} = providerProps;
    let {container, debug} = render(<NumberField aria-label="labelled" {...props} />, undefined, {theme, scale, locale});

    let root = props.label ? container.firstChild.firstChild : undefined;
    container = within(container).queryByRole('group');
    let textField = within(container).queryByRole('textbox');
    let buttons = within(container).queryAllByRole('button');
    let incrementButton = buttons[0];
    let decrementButton = buttons[1];
    return {
      root,
      container,
      textField,
      buttons,
      incrementButton,
      decrementButton,
      debug
    };
  }

  it.each`
    Name
    ${'NumberField'}
  `('$Name has correct aria and props', () => {
    let {
      container,
      textField,
      incrementButton,
      decrementButton
    } = renderNumberField();

    expect(container).toBeTruthy();
    expect(container).toHaveAttribute('role', 'group');
    expect(textField).toBeTruthy();
    expect(textField).toHaveAttribute('type', 'text');
    expect(textField).toHaveAttribute('inputMode', 'numeric');
    expect(incrementButton).toBeTruthy();
    expect(decrementButton).toBeTruthy();
    expect(incrementButton).toHaveAttribute('tabIndex', '-1');
    expect(decrementButton).toHaveAttribute('tabIndex', '-1');
  });

  it('attaches a user provided ref to the outer div', function () {
    let ref = React.createRef();
    let {container, textField} = renderNumberField({ref});

    expect(ref.current.UNSAFE_getDOMNode()).toBe(container.parentElement);
    act(() => {
      ref.current.focus();
    });
    expect(document.activeElement).toBe(textField);
  });

  it('attaches a user provided ref to the outer div with a label', function () {
    let ref = React.createRef();
    let {root, textField} = renderNumberField({ref, label: 'Visually labelled'});

    expect(ref.current.UNSAFE_getDOMNode()).toBe(root);
    act(() => {
      ref.current.focus();
    });
    expect(document.activeElement).toBe(textField);
  });

  it.each`
    Name              | props                                                       | platform    | UA               | inputMode
    ${'NumberField'}  | ${{}}                                                       | ${'iPhone'} | ${'AppleWebKit'} | ${'text'}
    ${'NumberField'}  | ${{formatOptions: {maximumFractionDigits: 0}}}              | ${'iPhone'} | ${'AppleWebKit'} | ${'text'}
    ${'NumberField'}  | ${{minValue: 0}}                                            | ${'iPhone'} | ${'AppleWebKit'} | ${'decimal'}
    ${'NumberField'}  | ${{minValue: 0, formatOptions: {maximumFractionDigits: 0}}} | ${'iPhone'} | ${'AppleWebKit'} | ${'numeric'}
    ${'NumberField'}  | ${{}}                                                       | ${'iPad'}   | ${'AppleWebKit'} | ${'numeric'}
    ${'NumberField'}  | ${{formatOptions: {maximumFractionDigits: 0}}}              | ${'iPad'}   | ${'AppleWebKit'} | ${'numeric'}
    ${'NumberField'}  | ${{minValue: 0}}                                            | ${'iPad'}   | ${'AppleWebKit'} | ${'numeric'}
    ${'NumberField'}  | ${{minValue: 0, formatOptions: {maximumFractionDigits: 0}}} | ${'iPad'}   | ${'AppleWebKit'} | ${'numeric'}
    ${'NumberField'}  | ${{}}                                                       | ${'Mac'}    | ${'AppleWebKit'} | ${'numeric'}
    ${'NumberField'}  | ${{formatOptions: {maximumFractionDigits: 0}}}              | ${'Mac'}    | ${'AppleWebKit'} | ${'numeric'}
    ${'NumberField'}  | ${{minValue: 0}}                                            | ${'Mac'}    | ${'AppleWebKit'} | ${'numeric'}
    ${'NumberField'}  | ${{minValue: 0, formatOptions: {maximumFractionDigits: 0}}} | ${'Mac'}    | ${'AppleWebKit'} | ${'numeric'}
    ${'NumberField'}  | ${{}}                                                       | ${'Linux'}  | ${'Android'}     | ${'numeric'}
    ${'NumberField'}  | ${{formatOptions: {maximumFractionDigits: 0}}}              | ${'Linux'}  | ${'Android'}     | ${'numeric'}
    ${'NumberField'}  | ${{minValue: 0}}                                            | ${'Linux'}  | ${'Android'}     | ${'decimal'}
    ${'NumberField'}  | ${{minValue: 0, formatOptions: {maximumFractionDigits: 0}}} | ${'Linux'}  | ${'Android'}     | ${'numeric'}
  `('$Name uses inputMode=$inputMode on $platform $UA with $props', ({props, platform, UA, inputMode}) => {
    let platformMock = jest.spyOn(navigator, 'platform', 'get').mockImplementation(() => platform);
    let uaMock = jest.spyOn(navigator, 'userAgent', 'get').mockImplementation(() => UA);

    let {
      textField
    } = renderNumberField({onChange: onChangeSpy, ...props});
    platformMock.mockRestore();
    uaMock.mockRestore();

    expect(textField).toHaveAttribute('inputMode', inputMode);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name switches to numeric inputMode if maximumFractionDigits is 0 and no negative numbers', async () => {
    let {
      textField
    } = renderNumberField({onChange: onChangeSpy, formatOptions: {maximumFractionDigits: 0}, minValue: 0});

    expect(textField).toHaveAttribute('inputMode', 'numeric');

    act(() => {textField.focus();});
    await user.keyboard('5.2');
    expect(textField).toHaveAttribute('value', '52');
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledWith(52);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name switches to numeric for currencies that have no decimals', async () => {
    let {
      textField
    } = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'JPY'}, minValue: 0});

    expect(textField).toHaveAttribute('inputMode', 'numeric');

    act(() => {textField.focus();});
    await user.keyboard('5.2');
    expect(textField).toHaveAttribute('value', '52');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '¥52');
    expect(onChangeSpy).toHaveBeenCalledWith(52);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name switches to numeric for percentages', async () => {
    let {
      textField
    } = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'percent'}});

    expect(textField).toHaveAttribute('inputMode', 'numeric');

    act(() => {textField.focus();});
    await user.keyboard('5.2');
    expect(textField).toHaveAttribute('value', '52');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '52%');
    expect(onChangeSpy).toHaveBeenCalledWith(0.52);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name handles input change', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy});

    act(() => {textField.focus();});
    await user.keyboard('5');
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledWith(5);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name handles just typing a minus sign from empty', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy});

    act(() => {textField.focus();});
    await user.keyboard('-');
    act(() => {textField.blur();});
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', '');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name handles starting a number with a decimal input change', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy});

    act(() => {textField.focus();});
    await user.keyboard('.5');
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledWith(0.5);
  });

  it.each`
    Name
    ${'NumberField'}
  `('cannot type random letter after a number', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy});

    act(() => {textField.focus();});
    await user.keyboard('1acd');
    expect(textField).toHaveAttribute('value', '1');
    expect(onChangeSpy).not.toHaveBeenCalled();
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(1);
    expect(textField).toHaveAttribute('value', '1');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name handles input change with custom step number', async () => {
    let {textField, incrementButton} = renderNumberField({onChange: onChangeSpy, onBlur: onBlurSpy, step: 5});

    act(() => {textField.focus();});
    expect(onBlurSpy).not.toHaveBeenCalled();
    await user.keyboard('2');
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenLastCalledWith(0);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenLastCalledWith(5);
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onBlurSpy).toHaveBeenCalledTimes(1);

    act(() => {textField.focus();});
    await user.clear(textField);
    await user.keyboard('3');
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenLastCalledWith(5);
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenLastCalledWith(10);
    expect(onChangeSpy).toHaveBeenCalledTimes(3);
    expect(onBlurSpy).toHaveBeenCalledTimes(2); // blur spy is called after each blur
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name fires state change then blur', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, onBlur: onBlurSpy, step: 5});
    act(() => {textField.focus();});
    await user.keyboard('3');
    await user.tab();
    expect(onChangeSpy.mock.invocationCallOrder[0]).toBeLessThan(onBlurSpy.mock.invocationCallOrder[0]);
  });

  it.each`
  Name                            | props                                        | expected
  ${'defaultValue minValue'}      | ${{defaultValue: 20, minValue: 50}}          | ${'50'}
  ${'defaultValue maxValue'}      | ${{defaultValue: 20, maxValue: 10}}          | ${'10'}
  ${'defaultValue minValue step'} | ${{defaultValue: 20, minValue: 50, step: 3}} | ${'50'}
  ${'defaultValue maxValue step'} | ${{defaultValue: 20, maxValue: 10, step: 3}} | ${'9'}
  ${'value minValue'}             | ${{value: 20, minValue: 50}}                 | ${'50'}
  ${'value maxValue'}             | ${{value: 20, maxValue: 10}}                 | ${'10'}
  ${'value minValue step'}        | ${{value: 20, minValue: 50, step: 3}}        | ${'50'}
  ${'value maxValue step'}        | ${{value: 20, maxValue: 10, step: 3}}        | ${'9'}
  `('clamps value & defaultValue to the allowed range $Name', function ({props, expected}) {
    let {textField} = renderNumberField(props);
    expect(textField).toHaveAttribute('value', expected);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name will not allow typing of a number less than the min', async () => {
    let {
      container,
      textField
    } = renderNumberField({onChange: onChangeSpy, minValue: 0});

    expect(container).not.toHaveAttribute('aria-invalid');

    act(() => {textField.focus();});
    await user.keyboard('-');
    expect(onChangeSpy).toHaveBeenCalledTimes(0);
    expect(textField).toHaveAttribute('value', '');
    await user.keyboard('1');
    expect(onChangeSpy).not.toHaveBeenCalled();
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(1);
    expect(textField).toHaveAttribute('value', '1');

    expect(container).not.toHaveAttribute('aria-invalid');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name will allow typing of a number between min and max', async () => {
    let {
      textField
    } = renderNumberField({onChange: onChangeSpy, minValue: 20, maxValue: 50});

    act(() => {textField.focus();});
    await user.keyboard('32');
    expect(textField).toHaveAttribute('value', '32');
    expect(onChangeSpy).not.toHaveBeenCalled();
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(32);
    expect(textField).toHaveAttribute('value', '32');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name will not allow typing of a number greater than the max', async () => {
    let {
      container,
      textField
    } = renderNumberField({onChange: onChangeSpy, maxValue: 1, defaultValue: 0});

    expect(container).not.toHaveAttribute('aria-invalid');

    act(() => {textField.focus();});
    await user.keyboard('2');
    expect(onChangeSpy).not.toHaveBeenCalled();
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy).toHaveBeenCalledWith(1);
    expect(textField).toHaveAttribute('value', '1');

    expect(container).not.toHaveAttribute('aria-invalid');

    onChangeSpy.mockReset();
    act(() => {textField.focus();});
    await user.keyboard('1');
    expect(onChangeSpy).not.toHaveBeenCalled();
    act(() => {textField.blur();});
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', '1');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name increment value by one when increment button is pressed', async () => {
    let {incrementButton} = renderNumberField({defaultValue: 0, onChange: onChangeSpy});

    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledWith(1);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name decrement value by one when increment button is pressed', async () => {
    let {decrementButton} = renderNumberField({defaultValue: 0, onChange: onChangeSpy});

    await user.click(decrementButton);
    expect(onChangeSpy).toHaveBeenCalledWith(-1);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name use step for increasing and decreasing value', async () => {
    let {decrementButton, incrementButton} = renderNumberField({defaultValue: 0, step: 10, onChange: onChangeSpy});

    await user.click(decrementButton);
    expect(onChangeSpy).toHaveBeenCalledWith(-10);

    onChangeSpy.mockReset();
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledWith(0);
  });

  it('does not lose precision', async () => {
    let {textField} = renderNumberField({minValue: 0.1, maxValue: 24, step: 0.1, onChange: onChangeSpy});

    act(() => {textField.focus();});
    await user.keyboard('24');
    await user.tab();

    expect(textField).toHaveAttribute('value', '24');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name decrement value when scrolling downwards or left in LTR', () => {
    // downwards is reverse natural scroll? i don't know how to describe it
    let {textField} = renderNumberField({defaultValue: 0, onChange: onChangeSpy, onBlur: onBlurSpy});

    act(() => {textField.focus();});
    fireEvent.wheel(textField, {deltaY: -10});
    expect(onChangeSpy).toHaveBeenCalledWith(-1);
    act(() => {textField.blur();});
    expect(onBlurSpy).toHaveBeenCalledTimes(1); // blur isn't triggered erroneously by wheel events
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name cannot scroll to step when not focused', () => {
    let {textField} = renderNumberField({defaultValue: 0, onChange: onChangeSpy});

    fireEvent.wheel(textField, {deltaY: -10});
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name increment value when scrolling upwards', () => {
    let {textField} = renderNumberField({defaultValue: 0, onChange: onChangeSpy});

    act(() => {textField.focus();});
    fireEvent.wheel(textField, {deltaY: 10});
    expect(onChangeSpy).toHaveBeenLastCalledWith(1);
    act(() => {textField.blur();});
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name decrement value when scrolling down', () => {
    let {textField} = renderNumberField({defaultValue: 0, onChange: onChangeSpy}, {locale: 'ar-AE'});

    act(() => {textField.focus();});
    fireEvent.wheel(textField, {deltaY: -10});
    expect(onChangeSpy).toHaveBeenCalledWith(-1);
    act(() => {textField.blur();});
  });

  // pinch to zoom triggers scrolling https://bugzilla.mozilla.org/show_bug.cgi?id=1052253 with the ctrl key
  it.each`
    Name
    ${'NumberField'}
  `('$Name should not fire increment or decrement if it is a zoom event', () => {

    let {textField} = renderNumberField({defaultValue: 0, onChange: onChangeSpy});

    act(() => {textField.focus();});
    fireEvent.wheel(textField, {deltaY: 10, ctrlKey: true});
    expect(onChangeSpy).not.toHaveBeenCalled();
    fireEvent.wheel(textField, {deltaY: -10, ctrlKey: true});
    expect(onChangeSpy).not.toHaveBeenCalled();
    act(() => {textField.blur();});
  });

  // TODO: what should happen when an invalid defaultValue is supplied in a min/max

  it.each`
    Name
    ${'NumberField'}
  `('$Name onChange is not called when controlled at minValue and decrement is pressed', async () => {
    let {
      container,
      decrementButton
    } = renderNumberField({onChange: onChangeSpy, minValue: 3, value: 3});

    expect(container).toBeTruthy();
    expect(container).toHaveAttribute('role', 'group');
    expect(container).not.toHaveAttribute('aria-invalid');
    await user.click(decrementButton);
    expect(onChangeSpy).toHaveBeenCalledTimes(0);
  });

  it.each`
    Name
    ${'v3 NumberField'}
  `('$Name onChange is not called when controlled at maxValue and increment is pressed', async () => {
    let {
      container,
      incrementButton
    } = renderNumberField({onChange: onChangeSpy, maxValue: 3, value: 3});

    expect(container).toBeTruthy();
    expect(container).toHaveAttribute('role', 'group');
    expect(container).not.toHaveAttribute('aria-invalid');
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledTimes(0);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name can hide step buttons', () => {
    let {textField, incrementButton, decrementButton} = renderNumberField({hideStepper: true});

    expect(textField).toBeDefined();
    expect(incrementButton).not.toBeDefined();
    expect(decrementButton).not.toBeDefined();
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name step buttons show for mobile', () => {
    let {textField, incrementButton, decrementButton} = renderNumberField({}, {scale: 'large'});

    expect(textField).toBeDefined();
    expect(incrementButton).toBeDefined();
    expect(decrementButton).toBeDefined();
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name step buttons show for mobile quiet', () => {
    let {textField, incrementButton, decrementButton} = renderNumberField({isQuiet: true}, {scale: 'large'});

    expect(textField).toBeDefined();
    expect(incrementButton).toBeDefined();
    expect(decrementButton).toBeDefined();
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name starting from empty field, will start at the 0 if neither min or max are defined', async () => {
    let {
      textField,
      incrementButton,
      decrementButton
    } = renderNumberField({onChange: onChangeSpy, onBlur: onBlurSpy});

    expect(textField).toHaveAttribute('value', '');
    await user.click(incrementButton);
    expect(textField).toHaveAttribute('value', '0');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(0);
    expect(onBlurSpy).not.toHaveBeenCalled();

    act(() => {textField.focus();});
    await user.clear(textField);
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '');
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenLastCalledWith(NaN);
    expect(onBlurSpy).toHaveBeenCalledTimes(1);

    await user.click(decrementButton);
    expect(textField).toHaveAttribute('value', '0');
    expect(onChangeSpy).toHaveBeenCalledTimes(3);
    expect(onChangeSpy).toHaveBeenCalledWith(0);
    expect(onBlurSpy).toHaveBeenCalledTimes(1); // increment/decrement buttons don't trigger blur
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name starting from empty field, will start from the min value', async () => {
    let {
      textField,
      incrementButton,
      decrementButton
    } = renderNumberField({onChange: onChangeSpy, minValue: 3});

    expect(textField).toHaveAttribute('value', '');
    await user.click(incrementButton);
    expect(textField).toHaveAttribute('value', '3');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(3);

    act(() => {textField.focus();});
    await user.clear(textField);
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '');
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenLastCalledWith(NaN);

    await user.click(decrementButton);
    expect(textField).toHaveAttribute('value', '3');
    expect(onChangeSpy).toHaveBeenCalledTimes(3);
    expect(onChangeSpy).toHaveBeenLastCalledWith(3);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name starting from empty field, will start at from the max value', async () => {
    let {
      textField,
      incrementButton,
      decrementButton
    } = renderNumberField({onChange: onChangeSpy, maxValue: 3});

    expect(textField).toHaveAttribute('value', '');
    await user.click(decrementButton);
    expect(textField).toHaveAttribute('value', '3');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(3);

    act(() => {textField.focus();});
    await user.clear(textField);
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '');
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenLastCalledWith(NaN);

    await user.click(incrementButton);
    expect(textField).toHaveAttribute('value', '0');
    expect(onChangeSpy).toHaveBeenCalledTimes(3);
    expect(onChangeSpy).toHaveBeenLastCalledWith(0);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name properly will return the same number from onChange as is displayed', async () => {
    let {textField} = renderNumberField({id: 'foo', onChange: onChangeSpy, defaultValue: 10, formatOptions: {maximumFractionDigits: 2}});

    act(() => {textField.focus();});
    expect(textField).toHaveAttribute('value', '10');
    await user.keyboard('.01');
    expect(textField).toHaveAttribute('value', '10.01');
    expect(onChangeSpy).not.toHaveBeenCalled();

    await user.keyboard('45');
    expect(textField).toHaveAttribute('value', '10.0145');
    expect(onChangeSpy).not.toHaveBeenCalled();
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '10.01');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(10.01);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name properly formats defaultValue', () => {
    let {textField} = renderNumberField({defaultValue: 10, formatOptions: {style: 'currency', currency: 'EUR'}});

    expect(textField).toHaveAttribute('value', '€10.00');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name calls onChange with typed value and properly formats', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'EUR'}});

    act(() => {textField.focus();});
    await user.keyboard('12 .83');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '€12.83');

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(12.83);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name will not call onChange with NaN before a valid input has been typed', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'EUR'}});
    act(() => {textField.focus();});
    await user.keyboard('-');
    await user.keyboard('{Backspace}');
    act(() => {textField.blur();});
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name will parse numbers even if they have currency in them', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, defaultValue: -10, formatOptions: {style: 'currency', currency: 'USD'}});
    act(() => {textField.focus();});
    expect(textField).toHaveAttribute('value', '-$10.00');
    await user.keyboard('{Backspace}');
    await user.keyboard('2');
    expect(textField).toHaveAttribute('value', '-$10.02');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '-$10.02');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(-10.02);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name will not call onChange with NaN twice in a row', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'EUR'}});
    act(() => {textField.focus();});
    await user.keyboard('-');
    await user.keyboard('{Backspace}');
    await user.keyboard('-');
    await user.keyboard('{Backspace}');
    act(() => {textField.blur();});
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name if an invalid input is left, then revert to last good value', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'EUR'}});
    act(() => {textField.focus();});
    await user.keyboard('-1');
    expect(onChangeSpy).not.toHaveBeenCalled();
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(-1);
    expect(textField).toHaveAttribute('value', '-€1.00');
    onChangeSpy.mockReset();
    act(() => {textField.focus();});
    await user.keyboard('{Backspace}');
    await user.keyboard('{Backspace}');
    await user.keyboard('{Backspace}');
    await user.keyboard('{Backspace}');
    await user.keyboard('{Backspace}');
    expect(textField).toHaveAttribute('value', '-');
    act(() => {textField.blur();});
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', '-€1.00');
  });

  it.each`
    Name                    | value          | result
    ${'NumberField'}        | ${'98.543213'} | ${'98.54321'}
    ${'NumberField rounds'} | ${'98.543216'} | ${'98.54322'}
  `('$Name can have specified fraction digits', async ({value, result}) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {maximumFractionDigits: 5}});
    act(() => {textField.focus();});
    await user.keyboard(value);
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', result);
  });

  it.each`
    Name                           | value   | result
    ${'NumberField down positive'} | ${'6'}  | ${'5'}
    ${'NumberField up positive'}   | ${'8'}  | ${'10'}
    ${'NumberField down negative'} | ${'-8'} | ${'-10'}
    ${'NumberField up negative'}   | ${'-6'} | ${'-5'}
  `('$Name rounds to step on commit', async ({value, result}) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, step: 5});
    act(() => {textField.focus();});
    await user.keyboard(value);
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', result);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name properly formats percents', async () => {
    let {textField, incrementButton} = renderNumberField({onChange: onChangeSpy, defaultValue: 0.1, formatOptions: {style: 'percent'}});

    expect(textField).toHaveAttribute('inputMode', 'numeric');
    expect(textField).toHaveAttribute('value', '10%');
    act(() => {textField.focus();});
    await user.clear(textField);
    await user.keyboard('25');
    expect(textField).toHaveAttribute('value', '25');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '25%');
    expect(onChangeSpy).toHaveBeenLastCalledWith(0.25);
    act(() => {textField.focus();});
    await user.click(incrementButton);
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '26%');
    expect(onChangeSpy).toHaveBeenLastCalledWith(0.26);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name properly formats percent for 2.11', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2}});

    act(() => {textField.focus();});
    await user.keyboard('2.11');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '2.11%');
    expect(onChangeSpy).toHaveBeenCalledWith(0.0211);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name properly formats percents as a unit', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, value: 10, formatOptions: {style: 'unit', unit: 'percent', signDisplay: 'always'}});

    expect(textField).toHaveAttribute('value', '+10%');
    act(() => {textField.focus();});
    textField.setSelectionRange(2, 3);
    await user.keyboard('{Backspace}');
    expect(textField).toHaveAttribute('value', '+1%');
    expect(onChangeSpy).not.toHaveBeenCalled();
    textField.setSelectionRange(2, 3);
    await user.keyboard('5%');
    expect(textField).toHaveAttribute('value', '+15%');
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledWith(15);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name properly formats value', () => {
    let {textField} = renderNumberField({value: 10, formatOptions: {style: 'currency', currency: 'EUR'}});

    expect(textField).toHaveAttribute('value', '€10.00');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name properly formats value when value changes', async () => {
    let {textField, incrementButton, decrementButton} = renderNumberField({defaultValue: 10, formatOptions: {style: 'currency', currency: 'EUR'}});

    expect(textField).toHaveAttribute('value', '€10.00');
    await user.click(incrementButton);
    expect(textField).toHaveAttribute('value', '€11.00');
    await user.click(decrementButton);
    await user.click(decrementButton);
    expect(textField).toHaveAttribute('value', '€9.00');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name properly formats value when formatter changes', () => {
    let {container, rerender} = render(<Provider theme={defaultTheme}><NumberField aria-label="labelled" {...{defaultValue: 10, formatOptions: {style: 'currency', currency: 'EUR'}}} /></Provider>);
    let textField = within(container).queryByRole('textbox');

    expect(textField).toHaveAttribute('value', '€10.00');
    rerender(<Provider theme={defaultTheme}><NumberField aria-label="labelled" {...{defaultValue: 10, formatOptions: {style: 'currency', currency: 'USD'}}} /></Provider>);
    expect(textField).toHaveAttribute('value', '$10.00');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name keeps formatting on focus', () => {
    let {textField} = renderNumberField({defaultValue: 10, formatOptions: {style: 'currency', currency: 'EUR'}});

    expect(textField).toHaveAttribute('value', '€10.00');
    act(() => {textField.focus();});
    expect(textField).toHaveAttribute('value', '€10.00');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name properly formats currencySign accounting', async () => {
    let {textField, incrementButton} = renderNumberField({onChange: onChangeSpy, defaultValue: -10, formatOptions: {style: 'currency', currency: 'USD', currencySign: 'accounting'}});

    expect(textField).toHaveAttribute('value', '($10.00)');
    await user.click(incrementButton);
    expect(textField).toHaveAttribute('value', '($9.00)');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(-9);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenLastCalledWith('−$9.00', 'assertive');

    act(() => {textField.focus();});
    textField.setSelectionRange(2, 3);
    await user.keyboard('{Backspace}');
    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce).toHaveBeenLastCalledWith('−$0.00', 'assertive');
    textField.setSelectionRange(2, 2);
    await user.keyboard('1');
    expect(announce).toHaveBeenCalledTimes(3);
    expect(announce).toHaveBeenLastCalledWith('−$1.00', 'assertive');
    textField.setSelectionRange(3, 3);
    await user.keyboard('8');
    expect(textField).toHaveAttribute('value', '($18.00)');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '($18.00)');
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenLastCalledWith(-18);
    expect(announce).toHaveBeenCalledTimes(4);
    expect(announce).toHaveBeenLastCalledWith('−$18.00', 'assertive');

    act(() => {textField.focus();});
    textField.setSelectionRange(7, 8);
    await user.keyboard('{Backspace}');
    expect(textField).toHaveAttribute('value', '($18.00');
    expect(announce).toHaveBeenCalledTimes(5);
    expect(announce).toHaveBeenLastCalledWith('$18.00', 'assertive');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '$18.00');
    expect(onChangeSpy).toHaveBeenCalledTimes(3);
    expect(onChangeSpy).toHaveBeenLastCalledWith(18);

    act(() => {textField.focus();});
    await user.clear(textField);
    expect(announce).toHaveBeenCalledTimes(6);
    expect(announce).toHaveBeenLastCalledWith('Empty', 'assertive');
    await user.keyboard('($32)');
    expect(textField).toHaveAttribute('value', '($32)');
    expect(announce).toHaveBeenCalledTimes(9);
    expect(announce).toHaveBeenLastCalledWith('−$32.00', 'assertive');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '($32.00)');
    expect(onChangeSpy).toHaveBeenCalledTimes(4);
    expect(onChangeSpy).toHaveBeenLastCalledWith(-32);
  });

  // TODO: not a regression, this is already broken in chrome, but we should fix it at some point
  it.skip.each`
    Name
    ${'NumberField'}
  `('$Name can use accounting sign in arabic with latin numerals', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD', currencySign: 'accounting'}}, {locale: 'ar-AE'});

    act(() => {textField.focus();});
    await user.type(textField, '(10)');
    expect(textField).toHaveAttribute('value', '(10)');
    expect(announce).toHaveBeenCalledTimes(3);
    expect(announce).toHaveBeenLastCalledWith('‎−US$ 10.00', 'assertive');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '(US$10.00)');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenLastCalledWith(-10);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name can edit a currencySign accounting in a locale that does not use the parenthesis notation', async () => {
    let {textField, incrementButton} = renderNumberField({
      onChange: onChangeSpy,
      defaultValue: -10,
      formatOptions: {style: 'currency', currency: 'USD', currencySign: 'accounting'}
    }, {locale: 'el-GR'});

    expect(textField).toHaveAttribute('value', '-10,00 $');
    await user.click(incrementButton);
    expect(textField).toHaveAttribute('value', '-9,00 $');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(-9);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenLastCalledWith('−9,00 $', 'assertive');

    act(() => {
      textField.focus();
    });
    textField.setSelectionRange(1, 2);
    await user.keyboard('{Backspace}');
    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce).toHaveBeenLastCalledWith('−0,00 $', 'assertive');
    textField.setSelectionRange(1, 1);
    await user.keyboard('1');
    expect(announce).toHaveBeenCalledTimes(3);
    expect(announce).toHaveBeenLastCalledWith('−1,00 $', 'assertive');
    textField.setSelectionRange(2, 2);
    await user.keyboard('8');
    expect(textField).toHaveAttribute('value', '-18,00 $');
    expect(announce).toHaveBeenCalledTimes(4);
    expect(announce).toHaveBeenLastCalledWith('−18,00 $', 'assertive');
    act(() => {
      textField.blur();
    });
    expect(textField).toHaveAttribute('value', '-18,00 $');
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenLastCalledWith(-18);
  });

  it.each`
    Name              | props                                                    | locale     | expected
    ${'US Euros'}     | ${{formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'en-US'} | ${'€10.00'}
    ${'Arabic Euros'} | ${{formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'ar-AE'} | ${'‏10.00 €'}
    ${'French Euros'} | ${{formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'fr-FR'} | ${'10,00 €'}
    ${'US JPY'}       | ${{formatOptions: {style: 'currency', currency: 'JPY'}}} | ${'en-US'} | ${'¥10'}
  `('$Name keeps formatted value on focus', ({props, locale, expected}) => {
    let {textField} = renderNumberField({defaultValue: 10, ...props}, {locale});

    expect(textField).toHaveAttribute('value', expected);
    act(() => {textField.focus();});
    expect(textField).toHaveAttribute('value', expected);
    act(() => {textField.blur();});
  });

  // must use js-escapes for negative currency arabic, otherwise jest won't recognize the result as being equal
  it.each`
    Name                       | props                                                                       | locale     | expected
    ${'US Euros'}              | ${{defaultValue: 10, formatOptions: {style: 'currency', currency: 'EUR'}}}  | ${'en-US'} | ${['€10.00', '€11.00', '€9.00']}
    ${'French Euros'}          | ${{defaultValue: 10, formatOptions: {style: 'currency', currency: 'EUR'}}}  | ${'fr-FR'} | ${['10,00 €', '11,00 €', '9,00 €']}
    ${'Arabic Euros'}          | ${{defaultValue: 10, formatOptions: {style: 'currency', currency: 'EUR'}}}  | ${'ar-AE'} | ${['‏10.00 €', '‏11.00 €', '‏9.00 €']}
    ${'US Euros negative'}     | ${{defaultValue: -10, formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'en-US'} | ${['-€10.00', '-€9.00', '-€11.00']}
    ${'French Euros negative'} | ${{defaultValue: -10, formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'fr-FR'} | ${['-10,00 €', '-9,00 €', '-11,00 €']}
    ${'Arabic Euros negative'} | ${{defaultValue: -10, formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'ar-AE'} | ${['‏‎-10.00 €', '‏‎-9.00 €', '‏‎-11.00 €']}
  `('$Name pressing increment & decrement keeps formatting', async ({props, locale, expected}) => {
    let {textField, incrementButton, decrementButton} = renderNumberField({minValue: -15, ...props}, {locale});

    expect(textField).toHaveAttribute('value', expected[0]);
    await user.click(incrementButton);
    expect(textField).toHaveAttribute('value', expected[1]);
    await user.click(decrementButton);
    await user.click(decrementButton);
    expect(textField).toHaveAttribute('value', expected[2]);
  });

  it.each`
    Name              | props                                                    | locale     | expected
    ${'US Euros'}     | ${{formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'en-US'} | ${['€10.00', '€11.00', '€9.00', '€9.00']}
    ${'French Euros'} | ${{formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'fr-FR'} | ${['10,00 €', '11,00 €', '9,00 €', '9,00 €']}
    ${'Arabic Euros'} | ${{formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'ar-AE'} | ${['‏10.00 €', '‏11.00 €', '‏9.00 €', '‏9.00 €']}
  `('$Name pressing up arrow & down arrow keeps focus state formatting', ({props, locale, expected}) => {
    let {textField} = renderNumberField({defaultValue: 10, onKeyDown: onKeyDownSpy, onKeyUp: onKeyUpSpy, ...props}, {locale});

    act(() => {textField.focus();});
    expect(textField).toHaveAttribute('value', expected[0]);
    expect(onKeyDownSpy).not.toHaveBeenCalled();
    expect(onKeyUpSpy).not.toHaveBeenCalled();
    fireEvent.keyDown(textField, {key: 'ArrowUp'});
    fireEvent.keyUp(textField, {key: 'ArrowUp'});
    expect(textField).toHaveAttribute('value', expected[1]);
    fireEvent.keyDown(textField, {key: 'ArrowDown'});
    fireEvent.keyUp(textField, {key: 'ArrowDown'});
    fireEvent.keyDown(textField, {key: 'ArrowDown'});
    fireEvent.keyUp(textField, {key: 'ArrowDown'});
    expect(textField).toHaveAttribute('value', expected[2]);
    act(() => {textField.blur();});
    // after blur, we should go to the formatted version
    expect(textField).toHaveAttribute('value', expected[3]);
    expect(onKeyDownSpy).toHaveBeenCalledTimes(3); // correct number of key events are called
    expect(onKeyUpSpy).toHaveBeenCalledTimes(3);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name sets number value on enter', async () => {
    let {
      textField
    } = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'percent'}});

    expect(textField).toHaveAttribute('inputMode', 'numeric');

    act(() => {textField.focus();});
    await user.keyboard('5.2');
    expect(textField).toHaveAttribute('value', '52');
    await user.keyboard('{Enter}');
    expect(textField).toHaveAttribute('value', '52%');
    expect(onChangeSpy).toHaveBeenCalledWith(0.52);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name sets invalid input value to valid number value on blur', async () => {
    let {textField} = renderNumberField({defaultValue: 10});

    expect(textField).toHaveAttribute('value', '10');
    await user.keyboard('-');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '10');
    act(() => {textField.focus();});
    expect(textField).toHaveAttribute('value', '10');
    act(() => {textField.blur();});
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name sets invalid input value to valid step on blur', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, defaultValue: 10, step: 10});

    expect(textField).toHaveAttribute('value', '10');
    act(() => {textField.focus();});
    await user.keyboard('5');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '110');
    expect(onChangeSpy).toHaveBeenCalledWith(110);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);

    act(() => {textField.focus();});
    await user.clear(textField);
    await user.keyboard('16');
    expect(textField).toHaveAttribute('value', '16');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '20');
    expect(onChangeSpy).toHaveBeenLastCalledWith(20);
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
  });

  it.each`
    Name
    ${'NumberField'}
  `('goes to valid max on `end`', () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, defaultValue: 10, maxValue: 521});

    expect(textField).toHaveAttribute('value', '10');
    act(() => {textField.focus();});
    fireEvent.keyDown(textField, {key: 'End'});
    fireEvent.keyUp(textField, {key: 'End'});
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '521');
    expect(onChangeSpy).toHaveBeenCalledWith(521);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
  });

  it.each`
    Name
    ${'NumberField'}
  `('goes to valid step max on `end`', () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, defaultValue: 10, step: 10, maxValue: 521});

    expect(textField).toHaveAttribute('value', '10');
    act(() => {textField.focus();});
    fireEvent.keyDown(textField, {key: 'End'});
    fireEvent.keyUp(textField, {key: 'End'});
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '520');
    expect(onChangeSpy).toHaveBeenCalledWith(520);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
  });

  it.each`
    Name
    ${'NumberField'}
  `('goes to valid min on `home`', () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, defaultValue: 10, minValue: -521});

    expect(textField).toHaveAttribute('value', '10');
    act(() => {textField.focus();});
    fireEvent.keyDown(textField, {key: 'Home'});
    fireEvent.keyUp(textField, {key: 'Home'});
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '-521');
    expect(onChangeSpy).toHaveBeenCalledWith(-521);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
  });

  it.each`
    Name
    ${'NumberField'}
  `('goes to valid step min on `home`', () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, defaultValue: 10, step: 10, minValue: -521});

    expect(textField).toHaveAttribute('value', '9');
    act(() => {textField.focus();});
    fireEvent.keyDown(textField, {key: 'Home'});
    fireEvent.keyUp(textField, {key: 'Home'});
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '-521');
    expect(onChangeSpy).toHaveBeenCalledWith(-521);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
  });

  it.each`
    Name                               | direction    | props                                         | expected
    ${'unbound'}                       | ${'up'}      | ${{minValue: undefined, maxValue: undefined}} | ${0}
    ${'unbound'}                       | ${'down'}    | ${{minValue: undefined, maxValue: undefined}} | ${0}
    ${'negative lower bound'}          | ${'up'}      | ${{minValue: -5, maxValue: undefined}}        | ${-5}
    ${'negative lower bound'}          | ${'down'}    | ${{minValue: -5, maxValue: undefined}}        | ${0}
    ${'positive lower bound'}          | ${'up'}      | ${{minValue: 5, maxValue: undefined}}         | ${5}
    ${'positive lower bound'}          | ${'down'}    | ${{minValue: 5, maxValue: undefined}}         | ${5}
    ${'positive upper bound'}          | ${'up'}      | ${{minValue: undefined, maxValue: 5}}         | ${0}
    ${'positive upper bound'}          | ${'down'}    | ${{minValue: undefined, maxValue: 5}}         | ${5}
    ${'negative upper bound'}          | ${'up'}      | ${{minValue: undefined, maxValue: -5}}        | ${-5}
    ${'negative upper bound'}          | ${'down'}    | ${{minValue: undefined, maxValue: -5}}        | ${-5}
    ${'negative lower positive upper'} | ${'up'}      | ${{minValue: -5, maxValue: 5}}                | ${-5}
    ${'negative lower positive upper'} | ${'down'}    | ${{minValue: -5, maxValue: 5}}                | ${5}
    ${'negative lower negative upper'} | ${'up'}      | ${{minValue: -15, maxValue: -5}}              | ${-15}
    ${'negative lower negative upper'} | ${'down'}    | ${{minValue: -15, maxValue: -5}}              | ${-5}
    ${'positive lower positive upper'} | ${'up'}      | ${{minValue: 5, maxValue: 15}}                | ${5}
    ${'positive lower positive upper'} | ${'down'}    | ${{minValue: 5, maxValue: 15}}                | ${15}
  `('$direction $Name starts from the right place', ({direction, props, expected}) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, onBlur: onBlurSpy, onKeyUp: onKeyUpSpy, onKeyDown: onKeyDownSpy, ...props});
    let key = direction === 'up' ? 'ArrowUp' : 'ArrowDown';
    act(() => {textField.focus();});
    expect(onBlurSpy).not.toHaveBeenCalled();
    expect(onKeyUpSpy).not.toHaveBeenCalled();
    expect(onKeyDownSpy).not.toHaveBeenCalled();
    fireEvent.keyDown(textField, {key});
    fireEvent.keyUp(textField, {key});
    expect(onChangeSpy).toHaveBeenCalledWith(expected);
    act(() => {textField.blur();});
    expect(onBlurSpy).toHaveBeenCalledTimes(1); // checking the blur and key events with arrow keys
    expect(onKeyUpSpy).toHaveBeenCalledTimes(1);
    expect(onKeyDownSpy).toHaveBeenCalledTimes(1);
  });

  it.each`
    Name                               | direction    | props                                         | expected
    ${'unbound'}                       | ${'up'}      | ${{minValue: undefined, maxValue: undefined}} | ${0}
    ${'unbound'}                       | ${'down'}    | ${{minValue: undefined, maxValue: undefined}} | ${0}
    ${'negative lower bound'}          | ${'up'}      | ${{minValue: -5, maxValue: undefined}}        | ${-5}
    ${'negative lower bound'}          | ${'down'}    | ${{minValue: -5, maxValue: undefined}}        | ${1}
    ${'positive lower bound'}          | ${'up'}      | ${{minValue: 5, maxValue: undefined}}         | ${5}
    ${'positive lower bound'}          | ${'down'}    | ${{minValue: 5, maxValue: undefined}}         | ${5}
    ${'positive upper bound'}          | ${'up'}      | ${{minValue: undefined, maxValue: 5}}         | ${0}
    ${'positive upper bound'}          | ${'down'}    | ${{minValue: undefined, maxValue: 5}}         | ${3}
    ${'negative upper bound'}          | ${'up'}      | ${{minValue: undefined, maxValue: -5}}        | ${-6}
    ${'negative upper bound'}          | ${'down'}    | ${{minValue: undefined, maxValue: -5}}        | ${-6}
    ${'negative lower positive upper'} | ${'up'}      | ${{minValue: -5, maxValue: 5}}                | ${-5}
    ${'negative lower positive upper'} | ${'down'}    | ${{minValue: -5, maxValue: 5}}                | ${4}
    ${'negative lower negative upper'} | ${'up'}      | ${{minValue: -15, maxValue: -5}}              | ${-15}
    ${'negative lower negative upper'} | ${'down'}    | ${{minValue: -15, maxValue: -5}}              | ${-6}
    ${'positive lower positive upper'} | ${'up'}      | ${{minValue: 5, maxValue: 15}}                | ${5}
    ${'positive lower positive upper'} | ${'down'}    | ${{minValue: 5, maxValue: 15}}                | ${14}
  `('$direction $Name step 3 starts from the right place', ({direction, props, expected}) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, step: 3, ...props});
    let key = direction === 'up' ? 'ArrowUp' : 'ArrowDown';
    act(() => {textField.focus();});
    fireEvent.keyDown(textField, {key});
    fireEvent.keyUp(textField, {key});
    expect(onChangeSpy).toHaveBeenCalledWith(expected);
    act(() => {textField.blur();});
  });

  it.each`
    Name              | props                                                    | locale     | keystrokes              | expected
    ${'US Euros'}     | ${{formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'en-US'} | ${['4', '2', '.', '1']} | ${['4', '42', '42.', '42.1', '€42.10']}
    ${'French Euros'} | ${{formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'fr-FR'} | ${['4', '2', ',', '1']} | ${['4', '42', '42,', '42,1', '42,10 €']}
    ${'Arabic Euros'} | ${{formatOptions: {style: 'currency', currency: 'EUR'}}} | ${'ar-AE'} | ${['٤', '٢', ',', '١']} | ${['٤', '٤٢', '٤٢,', '٤٢,١', '‏٤٢٫١٠ €']}
  `('$Name typing in locale stays consistent', async ({props, locale, keystrokes, expected}) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, ...props}, {locale});

    act(() => {textField.focus();});
    expect(textField).toHaveAttribute('value', '');
    await user.keyboard(keystrokes[0]);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', expected[0]);
    await user.keyboard(keystrokes[1]);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', expected[1]);
    await user.keyboard(keystrokes[2]);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', expected[2]);
    await user.keyboard(keystrokes[3]);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', expected[3]);
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledWith(42.1);
    // after blur, we should go to the formatted version
    expect(textField).toHaveAttribute('value', expected[4]);
  });

  it.each`
    Name              | props | locale     | keystrokes                   | expected
    ${'US Euros'}     | ${{}} | ${'en-US'} | ${['1', ',', '0', '0', '0']} | ${['1', '1,', '1,0', '1,00', '1,000', '1,000']}
    ${'French Euros'} | ${{}} | ${'fr-FR'} | ${['1', ' ', '0', '0', '0']} | ${['1', '1 ', '1 0', '1 00', '1 000', '1 000']}
    ${'Arabic Euros'} | ${{}} | ${'ar-AE'} | ${['١', '.', '٠', '٠', '٠']} | ${['١', '١.', '١.٠', '١.٠٠', '١.٠٠٠', '١٬٠٠٠']}
  `('$Name typing group characters works', async ({props, locale, keystrokes, expected}) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, ...props}, {locale});

    act(() => {textField.focus();});
    expect(textField).toHaveAttribute('value', '');
    await user.keyboard(keystrokes[0]);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', expected[0]);
    await user.keyboard(keystrokes[1]);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', expected[1]);
    await user.keyboard(keystrokes[2]);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', expected[2]);
    await user.keyboard(keystrokes[3]);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', expected[3]);
    await user.keyboard(keystrokes[4]);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', expected[4]);
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledWith(1000);
    // after blur, we should go to the formatted version
    expect(textField).toHaveAttribute('value', expected[5]);
  });

  it.each`
    Name              | props                                                                      | locale
    ${'US SAR'}       | ${{defaultValue: 10, formatOptions: {style: 'currency', currency: 'SAR'}}} | ${'en-US'}
  `('$Name will not allow invalid characters', async ({props, locale}) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, ...props}, {locale});
    expect(textField).toHaveAttribute('value', 'SAR 10.00');

    act(() => {textField.focus();});
    expect(textField).toHaveAttribute('value', 'SAR 10.00');
    await user.keyboard('@!');
    expect(textField).toHaveAttribute('value', 'SAR 10.00');
    act(() => {textField.blur();});
  });

  it('advances automatically if the arrows are held down', () => {
    let {textField, incrementButton, decrementButton} = renderNumberField({defaultValue: 10, onChange: onChangeSpy});

    act(() => {textField.focus();});
    fireEvent.mouseDown(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledWith(11);
    act(() => {jest.advanceTimersByTime(399);});
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    act(() => {jest.advanceTimersByTime(1);});
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenCalledWith(12);
    act(() => {jest.advanceTimersByTime(60);});
    expect(onChangeSpy).toHaveBeenCalledTimes(3);
    expect(onChangeSpy).toHaveBeenCalledWith(13);
    act(() => {jest.advanceTimersByTime(60);});
    act(() => {jest.advanceTimersByTime(60);});
    act(() => {jest.advanceTimersByTime(60);});
    expect(onChangeSpy).toHaveBeenCalledTimes(6);
    expect(onChangeSpy).toHaveBeenNthCalledWith(4, 14);
    expect(onChangeSpy).toHaveBeenNthCalledWith(5, 15);
    expect(onChangeSpy).toHaveBeenNthCalledWith(6, 16);
    fireEvent.mouseUp(incrementButton);
    onChangeSpy.mockReset();

    fireEvent.mouseDown(decrementButton);
    expect(onChangeSpy).toHaveBeenCalledWith(15);
    act(() => {jest.advanceTimersByTime(399);});
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    act(() => {jest.advanceTimersByTime(1);});
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenCalledWith(14);
    act(() => {jest.advanceTimersByTime(60);});
    expect(onChangeSpy).toHaveBeenCalledTimes(3);
    expect(onChangeSpy).toHaveBeenCalledWith(13);
    act(() => {jest.advanceTimersByTime(60);});
    act(() => {jest.advanceTimersByTime(60);});
    act(() => {jest.advanceTimersByTime(60);});
    expect(onChangeSpy).toHaveBeenCalledTimes(6);
    expect(onChangeSpy).toHaveBeenNthCalledWith(4, 12);
    expect(onChangeSpy).toHaveBeenNthCalledWith(5, 11);
    expect(onChangeSpy).toHaveBeenNthCalledWith(6, 10);
    fireEvent.mouseUp(decrementButton);
  });

  it('advances automatically to the limit and not beyond', () => {
    let {textField, incrementButton, decrementButton} = renderNumberField({defaultValue: 10, minValue: 0, maxValue: 20, onChange: onChangeSpy});

    act(() => {textField.focus();});
    fireEvent.mouseDown(incrementButton);
    // to get to 20, it'll take 11 (0ms), 12 (400ms), 13 (60ms) ... 20 (540ms) 22 (660ms)
    // we should never get to 21 or 22 though, but lets advance the time there to make sure
    act(() => {jest.advanceTimersByTime(400);});
    for (let i = 0; i < 10; i += 1) {
      act(() => {jest.advanceTimersByTime(60);});
    }
    expect(onChangeSpy).toHaveBeenCalledTimes(10);
    expect(onChangeSpy).toHaveBeenLastCalledWith(20);
    fireEvent.mouseUp(incrementButton);

    onChangeSpy.mockReset();

    fireEvent.mouseDown(decrementButton);
    act(() => {jest.advanceTimersByTime(400);});
    for (let i = 0; i < 20; i += 1) {
      act(() => {jest.advanceTimersByTime(60);});
    }
    expect(onChangeSpy).toHaveBeenCalledTimes(20);
    expect(onChangeSpy).toHaveBeenLastCalledWith(0);
    fireEvent.mouseUp(decrementButton);
  });

  it('advances increment starting from undefined', () => {
    let {textField, incrementButton} = renderNumberField({onChange: onChangeSpy});

    act(() => {textField.focus();});
    fireEvent.mouseDown(incrementButton);
    // it should start at 0
    act(() => {jest.advanceTimersByTime(400);});
    act(() => {jest.advanceTimersByTime(60);});
    expect(onChangeSpy).toHaveBeenCalledTimes(3);
    expect(onChangeSpy).toHaveBeenLastCalledWith(2);
    fireEvent.mouseUp(incrementButton);
  });

  it('advances increment starting from undefined where min is defined', () => {
    let {textField, incrementButton} = renderNumberField({onChange: onChangeSpy, minValue: 20});

    act(() => {textField.focus();});
    fireEvent.mouseDown(incrementButton);
    act(() => {jest.advanceTimersByTime(400);});
    act(() => {jest.advanceTimersByTime(60);});
    expect(onChangeSpy).toHaveBeenCalledTimes(3);
    expect(onChangeSpy).toHaveBeenLastCalledWith(22);
    fireEvent.mouseUp(incrementButton);
  });

  it('advances decrement starting from undefined', () => {
    let {textField, decrementButton} = renderNumberField({onChange: onChangeSpy});

    act(() => {textField.focus();});
    fireEvent.mouseDown(decrementButton);
    // it should start at 0
    act(() => {jest.advanceTimersByTime(400);});
    act(() => {jest.advanceTimersByTime(60);});
    expect(onChangeSpy).toHaveBeenCalledTimes(3);
    expect(onChangeSpy).toHaveBeenLastCalledWith(-2);
    fireEvent.mouseUp(decrementButton);
  });

  it.each`
    Name
    ${'v3 NumberField'}
  `('$Name handles input change with custom decimal step number', async () => {
    let {textField, incrementButton} = renderNumberField({onChange: onChangeSpy, step: 0.001});

    act(() => {textField.focus();});
    await user.keyboard('1');
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledWith(1.001);
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledWith(1.002);
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledWith(1.003);
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledWith(1.004);
    act(() => {textField.blur();});
  });

  it.each`
    Name
    ${'v3 NumberField'}
  `('$Name will start with uncommitted value when stepper buttons are pressed', async () => {
    let {textField, incrementButton} = renderNumberField({onChange: onChangeSpy, step: 5});

    act(() => {textField.focus();});
    await user.keyboard('2');
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenLastCalledWith(5);
    act(() => {textField.blur();});

    act(() => {textField.focus();});
    await user.clear(textField);
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenLastCalledWith(NaN);

    act(() => {textField.focus();});
    await user.keyboard('3');
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledTimes(3);
    expect(onChangeSpy).toHaveBeenLastCalledWith(5);
    act(() => {textField.blur();});

    act(() => {textField.focus();});
    await user.clear(textField);
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledTimes(4);
    expect(onChangeSpy).toHaveBeenLastCalledWith(NaN);
  });

  it.each`
    Name
    ${'v3 NumberField'}
  `('$Name adjust the text field value if the resulting number is the same - inc', async () => {
    let {textField, incrementButton} = renderNumberField({onChange: onChangeSpy});

    act(() => {textField.focus();});
    await user.keyboard('2');
    expect(textField).toHaveAttribute('value', '2');
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(3);
    expect(textField).toHaveAttribute('value', '3');
    act(() => {textField.blur();});

    act(() => {textField.focus();});
    await user.clear(textField);
    await user.keyboard('2');
    expect(textField).toHaveAttribute('value', '2');
    await user.click(incrementButton);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(textField).toHaveAttribute('value', '3');
    act(() => {textField.blur();});
  });

  it.each`
    Name
    ${'v3 NumberField'}
  `('$Name adjust the text field value if the resulting number is the same - dec', async () => {
    let {textField, decrementButton} = renderNumberField({onChange: onChangeSpy});

    act(() => {textField.focus();});
    await user.keyboard('2');
    expect(textField).toHaveAttribute('value', '2');
    await user.click(decrementButton);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(1);
    expect(textField).toHaveAttribute('value', '1');
    act(() => {textField.blur();});

    act(() => {textField.focus();});
    await user.clear(textField);
    await user.keyboard('2');
    expect(textField).toHaveAttribute('value', '2');
    await user.click(decrementButton);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(textField).toHaveAttribute('value', '1');
    act(() => {textField.blur();});
  });

  // not sure why this one won't work, it looked like select() was added to jsdom 5 years ago
  it.skip.each`
    Name
    ${'v3 NumberField'}
  `('$Name selects input text on focus', async () => {
    let {textField} = renderNumberField({defaultValue: 100});
    // start with 100 in the input
    expect(textField).toHaveAttribute('value', '100');
    // after we focus, we should have all 0f '100' selected, we can prove this by typing something into the input
    // if it wasn't all selected, then we'd still see some of the old value, instead we want to only see the new value
    act(() => {textField.focus();});
    await user.keyboard('3');
    expect(textField).toHaveAttribute('value', '3');
    act(() => {textField.blur();});
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name isReadOnly cannot be stepped', () => {
    let {textField, incrementButton, decrementButton} = renderNumberField({defaultValue: 100, isReadOnly: true});
    expect(textField).toHaveAttribute('value', '100');
    expect(incrementButton).toHaveAttribute('aria-disabled');
    expect(decrementButton).toHaveAttribute('aria-disabled');
    // they are aria-disabled, but don't have the attribute disabled because they are not buttons or inputs
    // should they be made buttons again after the Safari bug is fixed, this will need to be reversed
    expect(incrementButton).not.toBeDisabled();
    expect(decrementButton).not.toBeDisabled();
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name has proper aria attributes', () => {
    let {textField, incrementButton, decrementButton} = renderNumberField({
      defaultValue: 100,
      minValue: 0,
      maxValue: 100,
      isReadOnly: true,
      isDisabled: true,
      isRequired: true,
      id: 'test-numberfield-id',
      formatOptions: {style: 'currency', currency: 'EUR'}
    });

    expect(textField).not.toHaveAttribute('aria-valuenow', '100');
    expect(textField).not.toHaveAttribute('aria-valuetext', '€100.00');
    expect(textField).not.toHaveAttribute('aria-valuemin', '0');
    expect(textField).not.toHaveAttribute('aria-valuemax', '100');
    expect(textField).toHaveAttribute('aria-readonly', 'true');
    expect(textField).toHaveAttribute('aria-required', 'true');
    expect(textField).toHaveAttribute('aria-disabled', 'true');
    expect(textField).not.toHaveAttribute('role');
    expect(textField).toHaveAttribute('id', 'test-numberfield-id');

    expect(incrementButton).toHaveAttribute('aria-controls', textField.id);
    expect(decrementButton).toHaveAttribute('aria-controls', textField.id);
  });

  describe('labeling', () => {
    it('string label', () => {
      let {textField, incrementButton, decrementButton} = renderNumberField({
        label: 'Width',
        'aria-label': null
      });

      expect(textField).toHaveAttribute('aria-labelledby');
      expect(textField).toHaveAttribute('id');

      let labelId = textField.getAttribute('aria-labelledby');
      let label = document.getElementById(labelId);
      expect(label).toHaveTextContent('Width');
      expect(label).toHaveAttribute('for', textField.id);

      expect(incrementButton).toHaveAttribute('aria-label', 'Increase Width');
      expect(incrementButton).not.toHaveAttribute('id');
      expect(incrementButton).not.toHaveAttribute('aria-labelledby');
      expect(decrementButton).toHaveAttribute('aria-label', 'Decrease Width');
      expect(decrementButton).not.toHaveAttribute('id');
      expect(decrementButton).not.toHaveAttribute('aria-labelledby');
    });

    it('aria-label', () => {
      let {textField, incrementButton, decrementButton} = renderNumberField({
        'aria-label': 'Width'
      });

      expect(textField).not.toHaveAttribute('aria-labelledby');
      expect(textField).toHaveAttribute('aria-label', 'Width');

      expect(incrementButton).toHaveAttribute('aria-label', 'Increase Width');
      expect(incrementButton).not.toHaveAttribute('id');
      expect(incrementButton).not.toHaveAttribute('aria-labelledby');
      expect(decrementButton).toHaveAttribute('aria-label', 'Decrease Width');
      expect(decrementButton).not.toHaveAttribute('id');
      expect(decrementButton).not.toHaveAttribute('aria-labelledby');
    });

    it('JSX label', () => {
      let {textField, incrementButton, decrementButton} = renderNumberField({
        label: <span>Width</span>,
        'aria-label': null
      });

      expect(textField).toHaveAttribute('aria-labelledby');
      expect(textField).toHaveAttribute('id');

      let labelId = textField.getAttribute('aria-labelledby');
      let label = document.getElementById(labelId);
      expect(label).toHaveTextContent('Width');
      expect(label).toHaveAttribute('for', textField.id);

      expect(incrementButton).toHaveAttribute('aria-label', 'Increase');
      expect(incrementButton).toHaveAttribute('id');
      expect(incrementButton).toHaveAttribute('aria-labelledby', `${incrementButton.id} ${labelId}`);
      expect(decrementButton).toHaveAttribute('aria-label', 'Decrease');
      expect(decrementButton).toHaveAttribute('id');
      expect(decrementButton).toHaveAttribute('aria-labelledby', `${decrementButton.id} ${labelId}`);
    });

    it('aria-labelledby', () => {
      let {textField, incrementButton, decrementButton} = renderNumberField({
        'aria-labelledby': 'label-id',
        'aria-label': null
      });

      expect(textField).toHaveAttribute('aria-labelledby', 'label-id');
      expect(textField).toHaveAttribute('id');

      expect(incrementButton).toHaveAttribute('aria-label', 'Increase');
      expect(incrementButton).toHaveAttribute('id');
      expect(incrementButton).toHaveAttribute('aria-labelledby', `${incrementButton.id} label-id`);
      expect(decrementButton).toHaveAttribute('aria-label', 'Decrease');
      expect(decrementButton).toHaveAttribute('id');
      expect(decrementButton).toHaveAttribute('aria-labelledby', `${decrementButton.id} label-id`);
    });

    it('custom incrementAriaLabel', () => {
      let {textField, incrementButton, decrementButton} = renderNumberField({
        'aria-label': 'Width',
        incrementAriaLabel: 'Increment'
      });

      expect(textField).not.toHaveAttribute('aria-labelledby');
      expect(textField).toHaveAttribute('aria-label', 'Width');

      expect(incrementButton).toHaveAttribute('aria-label', 'Increment');
      expect(incrementButton).not.toHaveAttribute('id');
      expect(incrementButton).not.toHaveAttribute('aria-labelledby');
      expect(decrementButton).toHaveAttribute('aria-label', 'Decrease Width');
      expect(decrementButton).not.toHaveAttribute('id');
      expect(decrementButton).not.toHaveAttribute('aria-labelledby');
    });

    it('custom decrementAriaLabel', () => {
      let {textField, incrementButton, decrementButton} = renderNumberField({
        'aria-label': 'Width',
        decrementAriaLabel: 'Decrement'
      });

      expect(textField).not.toHaveAttribute('aria-labelledby');
      expect(textField).toHaveAttribute('aria-label', 'Width');

      expect(incrementButton).toHaveAttribute('aria-label', 'Increase Width');
      expect(incrementButton).not.toHaveAttribute('id');
      expect(incrementButton).not.toHaveAttribute('aria-labelledby');
      expect(decrementButton).toHaveAttribute('aria-label', 'Decrement');
      expect(decrementButton).not.toHaveAttribute('id');
      expect(decrementButton).not.toHaveAttribute('aria-labelledby');
    });

    it('error message', () => {
      let {textField, root} = renderNumberField({
        label: 'Width',
        errorMessage: 'This is a error.',
        validationState: 'invalid'
      });

      let errorText = within(root).getByText('This is a error.');
      expect(textField).toHaveAttribute('aria-describedby', errorText.id);
    });

    it('description', () => {
      let {textField, root} = renderNumberField({
        label: 'Width',
        description: 'This is a description.'
      });

      let description = within(root).getByText('This is a description.');
      expect(textField).toHaveAttribute('aria-describedby', description.id);
    });
  });

  it.each`
    Name                          | props
    ${'NumberField uncontrolled'} | ${{defaultValue: 0}}
    ${'NumberField controlled'}   | ${{value: 0}}
  `('$Name 0 is rendered', ({props}) => {
    let {textField} = renderNumberField(props);
    expect(textField).toHaveAttribute('value', '0');
  });

  it.each`
    Name                          | props
    ${'NumberField controlled'}   | ${{value: 10, onChange: onChangeSpy}}
  `('$Name 10 is rendered and will not change the value in the input for steppers', async ({props}) => {
    let {textField, incrementButton, decrementButton} = renderNumberField(props);
    expect(textField).toHaveAttribute('value', '10');
    await user.click(incrementButton);
    expect(textField).toHaveAttribute('value', '10');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(11);
    await user.click(decrementButton);
    expect(textField).toHaveAttribute('value', '10');
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenCalledWith(9);
  });

  it.each`
    Name                          | props
    ${'NumberField controlled'}   | ${{value: 10, onChange: onChangeSpy}}
  `('$Name 10 is rendered and will not change the value in the input for typed text', async ({props}) => {
    let {textField} = renderNumberField(props);
    expect(textField).toHaveAttribute('value', '10');
    act(() => {textField.focus();});
    await user.keyboard('123');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '10');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(10123);
  });

  it.each`
    Name
    ${'NumberField controlled'}
  `('$Name 10 is rendered and will change if the controlled version is implemented', async () => {
    function NumberFieldControlled(props) {
      let {onChange} = props;
      let [value, setValue] = useState(10);
      return (
        <NumberField {...props} label="you shall not change" formatOptions={{style: 'currency', currency: 'EUR'}} value={value} onChange={chain(setValue, onChange)} />
      );
    }
    let {container, getByRole} = render(<NumberFieldControlled onChange={onChangeSpy} />);
    container = within(container).queryByRole('group');
    let textField = getByRole('textbox');
    let buttons = within(container).queryAllByRole('button');
    let incrementButton = buttons[0];
    let decrementButton = buttons[1];
    expect(textField).toHaveAttribute('value', '€10.00');
    await user.click(incrementButton);
    expect(textField).toHaveAttribute('value', '€11.00');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(11);
    await user.click(decrementButton);
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenLastCalledWith(10);
    expect(textField).toHaveAttribute('value', '€10.00');
  });

  it.each`
    Name             | props
    ${'NumberField'} | ${{validationState: 'invalid'}}
  `('$Name can be invalid', ({props}) => {
    let {container} = renderNumberField(props);
    expect(container).toHaveAttribute('aria-invalid', 'true');
  });

  it.each`
    Name             | props
    ${'NumberField'} | ${{label: 'this is the stepper that never ends'}}
  `('$Name supports labels', ({props}) => {
    let {getByLabelText, getByRole} = render(<Provider theme={theme} locale="en-US"><NumberField {...props} /></Provider>);
    let spinButton = getByRole('textbox');
    expect(getByLabelText(props.label)).toBe(spinButton);
    expect(spinButton).toHaveAttribute('aria-roledescription', 'Number field');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name will re-enable the steppers if the value causing it to be disabled is deleted', async () => {
    let {textField, decrementButton, incrementButton} = renderNumberField({onChange: onChangeSpy, defaultValue: 1, maxValue: 1});
    expect(textField).toHaveAttribute('value', '1');
    expect(incrementButton).toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');

    act(() => {textField.focus();});
    await user.clear(textField);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(textField).toHaveAttribute('value', '');
    expect(incrementButton).not.toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');
    act(() => {textField.blur();});
    expect(onChangeSpy).toHaveBeenCalledWith(NaN);
  });

  it('should disable the steppers if the typed value is greater than the maximum', async () => {
    let {textField, decrementButton, incrementButton} = renderNumberField({onChange: onChangeSpy, maxValue: 15});
    expect(incrementButton).not.toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');

    act(() => {textField.focus();});

    await user.keyboard('10');
    expect(incrementButton).not.toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');

    await user.keyboard('0');
    expect(incrementButton).toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');
  });

  it('should disable the steppers if the typed value is smaller than the minimum', async () => {
    let {textField, decrementButton, incrementButton} = renderNumberField({onChange: onChangeSpy, minValue: -15});
    expect(incrementButton).not.toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');

    act(() => {textField.focus();});

    await user.keyboard('-10');
    expect(incrementButton).not.toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');

    await user.keyboard('0');
    expect(incrementButton).not.toHaveAttribute('aria-disabled');
    expect(decrementButton).toHaveAttribute('aria-disabled');
  });

  it('should disable the steppers if the typed value is greater than the maximum step', async () => {
    let {textField, decrementButton, incrementButton} = renderNumberField({onChange: onChangeSpy, minValue: 2, maxValue: 21, step: 3});
    expect(incrementButton).not.toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');

    act(() => {textField.focus();});

    await user.keyboard('19');
    expect(incrementButton).not.toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');

    await user.clear(textField);
    await user.keyboard('20');
    expect(incrementButton).toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');
  });

  it('should disable the steppers if the typed value is greater than the minimum step', async () => {
    let {textField, decrementButton, incrementButton} = renderNumberField({onChange: onChangeSpy, minValue: 2, maxValue: 21, step: 3});
    expect(incrementButton).not.toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');

    act(() => {textField.focus();});

    await user.keyboard('3');
    expect(incrementButton).not.toHaveAttribute('aria-disabled');
    expect(decrementButton).not.toHaveAttribute('aria-disabled');

    await user.clear(textField);
    await user.keyboard('2');
    expect(incrementButton).not.toHaveAttribute('aria-disabled');
    expect(decrementButton).toHaveAttribute('aria-disabled');
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name can type in a numeral system that is not the default for the locale', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy});
    expect(textField).toHaveAttribute('value', '');

    act(() => {textField.focus();});
    await user.keyboard('٤٢');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '٤٢');
    expect(onChangeSpy).toHaveBeenCalledWith(42);
    onChangeSpy.mockReset();

    act(() => {textField.focus();});
    await user.keyboard('1');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '٤٢');
    expect(onChangeSpy).not.toHaveBeenCalled();
    onChangeSpy.mockReset();

    act(() => {textField.focus();});
    await user.clear(textField);
    await user.keyboard('56');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '56');
    expect(onChangeSpy).toHaveBeenCalledWith(56);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name can type in a numeral system that is not the default for arab system', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy});
    expect(textField).toHaveAttribute('value', '');

    act(() => {textField.focus();});
    await user.keyboard('21');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '21');
    expect(onChangeSpy).toHaveBeenCalledWith(21);
    onChangeSpy.mockReset();

    act(() => {textField.focus();});
    await user.keyboard('٤');
    expect(textField).toHaveAttribute('value', '21');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '21');
    expect(onChangeSpy).not.toHaveBeenCalled();
    onChangeSpy.mockReset();

    act(() => {textField.focus();});
    await user.clear(textField);
    await user.keyboard('٤٢');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', '٤٢');
    expect(onChangeSpy).toHaveBeenCalledWith(42);
  });

  it.each`
    Name
    ${'NumberField'}
  `('$Name can type any kind of whitespace', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'SAR'}});
    expect(textField).toHaveAttribute('value', '');

    act(() => {textField.focus();});
    await user.keyboard(' 21 . 00 ');
    expect(textField).toHaveAttribute('value', ' 21 . 00 ');
    act(() => {textField.blur();});
    expect(textField).toHaveAttribute('value', 'SAR 21.00');
    expect(onChangeSpy).toHaveBeenCalledWith(21);
  });

  it.each(locales)('%s formats', (locale) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, defaultValue: -52, formatOptions: {style: 'currency', currency: 'USD'}}, {locale});

    let formatter = new Intl.NumberFormat(locale, {style: 'currency', currency: 'USD'});
    expect(textField).toHaveAttribute('value', formatter.format(-52));
  });

  it.each(locales)('%s can have latin numerals entered', async (locale) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD'}}, {locale});

    act(() => {textField.focus();});
    await user.keyboard('21');
    act(() => {textField.blur();});

    let formatter = new Intl.NumberFormat(locale + '-u-nu-latn', {style: 'currency', currency: 'USD'});
    expect(textField).toHaveAttribute('value', formatter.format(21));
  });

  it.each(locales)('%s can have latin numerals entered with SAR', async (locale) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'SAR'}}, {locale});
    act(() => {textField.focus();});
    await user.keyboard('21');
    act(() => {textField.blur();});
    let formatter = new Intl.NumberFormat(locale + '-u-nu-latn', {style: 'currency', currency: 'SAR'});
    expect(textField).toHaveAttribute('value', formatter.format(21));
  });

  it.each(locales)('%s can have arabic numerals entered', async (locale) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD'}}, {locale});

    act(() => {textField.focus();});
    await user.keyboard('٢١');
    act(() => {textField.blur();});

    let formatter = new Intl.NumberFormat(locale + '-u-nu-arab', {style: 'currency', currency: 'USD'});
    expect(textField).toHaveAttribute('value', formatter.format(21));
  });

  it.each(locales)('%s can have hanidec numerals entered', async (locale) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD'}}, {locale});

    act(() => {textField.focus();});
    await user.keyboard('二一');
    act(() => {textField.blur();});

    let formatter = new Intl.NumberFormat(locale + '-u-nu-hanidec', {style: 'currency', currency: 'USD'});
    expect(textField).toHaveAttribute('value', formatter.format(21));
  });

  it.each(locales)('%s can have devanagari numerals entered', async (locale) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD'}}, {locale});

    act(() => {textField.focus();});
    await user.keyboard('२१');
    act(() => {textField.blur();});

    let formatter = new Intl.NumberFormat(locale + '-u-nu-deva', {style: 'currency', currency: 'USD'});
    expect(textField).toHaveAttribute('value', formatter.format(21));
  });

  it.each(locales)('%s can have bengali numerals entered', async (locale) => {
    let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD'}}, {locale});

    act(() => {textField.focus();});
    await user.keyboard('২১');
    act(() => {textField.blur();});

    let formatter = new Intl.NumberFormat(locale + '-u-nu-beng', {style: 'currency', currency: 'USD'});
    expect(textField).toHaveAttribute('value', formatter.format(21));
  });

  describe('beforeinput', () => {
    let getTargetRanges = InputEvent.prototype.getTargetRanges;
    beforeEach(() => {
      InputEvent.prototype.getTargetRanges = () => {};
    });

    afterEach(() => {
      InputEvent.prototype.getTargetRanges = getTargetRanges;
    });

    it.each(['deleteHardLineBackward', 'deleteSoftLineBackward', 'deleteContentBackward', 'deleteContentForward', 'deleteContent', 'deleteByCut', 'deleteByDrag'])('allows %s of whole currency symbol', async (inputType) => {
      let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD', currencyDisplay: 'code'}});

      act(() => {textField.focus();});
      await user.keyboard('12');
      act(() => {textField.blur();});

      expect(textField).toHaveAttribute('value', 'USD 12.00');

      act(() => {textField.focus();});
      textField.setSelectionRange(0, 3);

      let e = new InputEvent('beforeinput', {cancelable: true, inputType});
      let proceed = fireEvent(textField, e);

      expect(proceed).toBe(true);
    });

    it.each(['deleteHardLineBackward', 'deleteSoftLineBackward', 'deleteContentBackward', 'deleteContentForward', 'deleteContent', 'deleteByCut', 'deleteByDrag'])('prevents %s of partial currency symbol', async (inputType) => {
      let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD', currencyDisplay: 'code'}});

      act(() => {textField.focus();});
      await user.keyboard('12');
      act(() => {textField.blur();});

      expect(textField).toHaveAttribute('value', 'USD 12.00');

      act(() => {textField.focus();});
      textField.setSelectionRange(1, 3);

      let e = new InputEvent('beforeinput', {cancelable: true, inputType});
      let proceed = fireEvent(textField, e);

      expect(proceed).toBe(false);
    });

    it.each(['deleteContentBackward', 'deleteContentForward'])('prevents %s inside currency symbol', async (inputType) => {
      let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD', currencyDisplay: 'code'}});

      act(() => {textField.focus();});
      await user.keyboard('12');
      act(() => {textField.blur();});

      expect(textField).toHaveAttribute('value', 'USD 12.00');

      act(() => {textField.focus();});
      textField.setSelectionRange(1, 1);

      let e = new InputEvent('beforeinput', {cancelable: true, inputType});
      let proceed = fireEvent(textField, e);

      expect(proceed).toBe(false);
    });

    it.each(['insertText', 'insertFromPaste', 'insertFromDrop', 'insertFromYank', 'insertReplacementText'])('allows %s of number inside number', async (inputType) => {
      let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD', currencyDisplay: 'code'}});

      act(() => {textField.focus();});
      await user.keyboard('12');
      act(() => {textField.blur();});

      expect(textField).toHaveAttribute('value', 'USD 12.00');

      act(() => {textField.focus();});
      textField.setSelectionRange(5, 5);

      let e = new InputEvent('beforeinput', {cancelable: true, data: '2', inputType});
      let proceed = fireEvent(textField, e);

      expect(proceed).toBe(true);
    });

    it.each(['insertText', 'insertFromPaste', 'insertFromDrop', 'insertFromYank', 'insertReplacementText'])('allows %s replacing whole number', async (inputType) => {
      let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD', currencyDisplay: 'code'}});

      act(() => {textField.focus();});
      await user.keyboard('12');
      act(() => {textField.blur();});

      expect(textField).toHaveAttribute('value', 'USD 12.00');

      act(() => {textField.focus();});
      textField.setSelectionRange(4, 10);

      let e = new InputEvent('beforeinput', {cancelable: true, data: '2', inputType});
      let proceed = fireEvent(textField, e);

      expect(proceed).toBe(true);
    });

    it.each(['insertText', 'insertFromPaste', 'insertFromDrop', 'insertFromYank', 'insertReplacementText'])('prevents %s of number inside currency symbol', async (inputType) => {
      let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD', currencyDisplay: 'code'}});

      act(() => {textField.focus();});
      await user.keyboard('12');
      act(() => {textField.blur();});

      expect(textField).toHaveAttribute('value', 'USD 12.00');

      act(() => {textField.focus();});
      textField.setSelectionRange(1, 1);

      let e = new InputEvent('beforeinput', {cancelable: true, data: '2', inputType});
      let proceed = fireEvent(textField, e);

      expect(proceed).toBe(false);
    });

    it.each(['historyUndo', 'historyRedo'])('allows %s', async (inputType) => {
      let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'currency', currency: 'USD', currencyDisplay: 'code'}});

      act(() => {textField.focus();});
      await user.keyboard('12');
      act(() => {textField.blur();});

      expect(textField).toHaveAttribute('value', 'USD 12.00');

      act(() => {textField.focus();});
      textField.setSelectionRange(2, 2);

      let e = new InputEvent('beforeinput', {cancelable: true, inputType});
      let proceed = fireEvent(textField, e);

      expect(proceed).toBe(true);
    });

    it.each(['deleteContentForward'])('allows %s of starting plusSign', async (inputType) => {
      let {textField} = renderNumberField({onChange: onChangeSpy, formatOptions: {style: 'unit', unit: 'percent', signDisplay: 'always'}});

      act(() => {textField.focus();});
      await user.keyboard('12');
      act(() => {textField.blur();});

      expect(textField).toHaveAttribute('value', '+12%');

      act(() => {textField.focus();});
      textField.setSelectionRange(0, 0);

      let e = new InputEvent('beforeinput', {cancelable: true, inputType});
      let proceed = fireEvent(textField, e);

      expect(proceed).toBe(true);
    });
  });

  it('handles compositionend events and undoes them if invalid', async () => {
    let {textField} = renderNumberField({onChange: onChangeSpy});

    act(() => {textField.focus();});
    await user.keyboard('123');
    textField.setSelectionRange(1, 1);

    // fire compositionstart and beforeinput
    fireEvent.compositionStart(textField);
    let e = new InputEvent('beforeinput', {cancelable: false, data: 'ü', inputType: 'insertCompositionText'});
    let proceed = fireEvent(textField, e);
    expect(proceed).toBe(true);

    // fire input event to update the value
    fireEvent.input(textField, {data: 'ü'});

    // manually update value and selection state because JSDOM won't
    textField.value = '1ü23';
    textField.setSelectionRange(2, 2);

    // Fire compositionend
    fireEvent.compositionEnd(textField);

    // Value and selection should be reverted
    expect(textField.value).toBe('123');
    expect(textField.selectionStart).toBe(1);
    expect(textField.selectionEnd).toBe(1);
  });

  it('adds data attributes to textField', () => {
    let {textField} = renderNumberField({'data-testid': '123'});

    expect(textField).toHaveAttribute('data-testid', '123');
  });

  describe('locale specific', () => {
    describe('spanish (spain)', () => {
      it('can determine the group symbol', async () => {
        let {textField} = renderNumberField({onChange: onChangeSpy}, {locale: 'es-ES'});
        act(() => {textField.focus();});
        await user.keyboard('123.456.789');
        expect(textField).toHaveAttribute('value', '123.456.789');
        act(() => {textField.blur();});
        expect(textField).toHaveAttribute('value', '123.456.789');
      });
    });
  });

  it('can be reset to blank using null', async () => {
    function NumberFieldControlled(props) {
      let {onChange} = props;
      let [value, setValue] = useState(10);
      return (
        <Provider theme={theme} scale="medium" locale="en-US">
          <NumberField {...props} label="reset to blank using null" value={value} onChange={value => setValue(value)} />
          <Button
            variant={'primary'}
            onPress={() => chain(setValue(null), onChange())}>
            Reset
          </Button>
        </Provider>
      );
    }
    let resetSpy = jest.fn();
    let {getByText, getByRole} = render(<NumberFieldControlled onChange={resetSpy} />, undefined, {theme, scale: 'medium', locale: 'en-US'});
    let textField = getByRole('textbox');
    let resetButton = getByText('Reset');

    expect(textField).toHaveAttribute('value', '10');
    await user.click(resetButton);
    expect(resetSpy).toHaveBeenCalledTimes(1);
    expect(textField).toHaveAttribute('value', '');
  });

  it('supports form value', () => {
    let {container, rerender} = render(<Provider theme={defaultTheme}><NumberField aria-label="labelled" {...{name: 'age', value: 30}} /></Provider>);
    container = within(container).queryByRole('group');
    let textField = within(container).queryByRole('textbox');
    expect(textField).not.toHaveAttribute('name');
    let hiddenInput = document.querySelector('input[type=hidden]');
    expect(hiddenInput).toHaveAttribute('name', 'age');
    expect(hiddenInput).toHaveValue('30');

    rerender(<Provider theme={defaultTheme}><NumberField aria-label="labelled" {...{name: 'age', value: null}} /></Provider>);
    expect(hiddenInput).toHaveValue('');
  });

  it('supports form reset', async () => {
    function Test() {
      let [value, setValue] = React.useState(10);
      return (
        <Provider theme={theme}>
          <form>
            <NumberField data-testid="input" label="Value" value={value} onChange={setValue} />
            <input type="reset" data-testid="reset" />
          </form>
        </Provider>
      );
    }

    let {getByTestId} = render(<Test />);
    let input = getByTestId('input');

    expect(input).toHaveValue('10');
    act(() => input.focus());
    await user.keyboard('0');
    expect(input).toHaveValue('100');

    let button = getByTestId('reset');
    act(() => input.blur());
    await user.click(button);
    expect(input).toHaveValue('10');
  });

  describe('validation', () => {
    describe('validationBehavior=native', () => {
      it('supports isRequired', async () => {
        let {getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <NumberField data-testid="input" label="Value" isRequired validationBehavior="native" />
            </Form>
          </Provider>
        );

        let input = getByTestId('input');
        expect(input).toHaveAttribute('required');
        expect(input).not.toHaveAttribute('aria-required');
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(false);

        act(() => {getByTestId('form').checkValidity();});

        expect(input).toHaveAttribute('aria-describedby');
        expect(document.getElementById(input.getAttribute('aria-describedby'))).toHaveTextContent('Constraints not satisfied');
        expect(document.activeElement).toBe(input);

        await user.keyboard('4');

        expect(input).toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(true);

        await user.tab();

        expect(input).not.toHaveAttribute('aria-describedby');
      });

      it('commits validation changes when pressing increment/decrement buttons', async () => {
        let {getByTestId, getAllByRole} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <NumberField data-testid="input" label="Value" isRequired validationBehavior="native" />
            </Form>
          </Provider>
        );

        let input = getByTestId('input');
        expect(input).toHaveAttribute('required');
        expect(input).not.toHaveAttribute('aria-required');
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(false);

        act(() => {getByTestId('form').checkValidity();});

        expect(document.activeElement).toBe(input);
        expect(input).toHaveAttribute('aria-describedby');
        expect(document.getElementById(input.getAttribute('aria-describedby'))).toHaveTextContent('Constraints not satisfied');

        await user.click(getAllByRole('button')[0]);

        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(true);
      });

      it('supports validate function', async () => {
        let {getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <NumberField data-testid="input" label="Value" defaultValue={2} step={2} validationBehavior="native" validate={v => v !== 4 ? 'Invalid value' : null} />
            </Form>
          </Provider>
        );

        let input = getByTestId('input');
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(false);

        act(() => {getByTestId('form').checkValidity();});

        expect(input).toHaveAttribute('aria-describedby');
        expect(document.getElementById(input.getAttribute('aria-describedby'))).toHaveTextContent('Invalid value');
        expect(document.activeElement).toBe(input);

        await user.clear(input);
        await user.keyboard('3');

        expect(input).toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(false);

        await user.tab();

        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(true);
      });

      it('supports server validation', async () => {
        function Test() {
          let [serverErrors, setServerErrors] = React.useState({});
          let onSubmit = e => {
            e.preventDefault();
            setServerErrors({
              value: 'Invalid value.'
            });
          };

          return (
            <Provider theme={theme}>
              <Form onSubmit={onSubmit} validationErrors={serverErrors}>
                <NumberField data-testid="input" label="Value" name="value" validationBehavior="native" />
                <Button type="submit" data-testid="submit">Submit</Button>
              </Form>
            </Provider>
          );
        }

        let {getByTestId} = render(<Test />);

        let input = getByTestId('input');
        expect(input).not.toHaveAttribute('aria-describedby');

        await user.click(getByTestId('submit'));

        expect(input).toHaveAttribute('aria-describedby');
        expect(document.getElementById(input.getAttribute('aria-describedby'))).toHaveTextContent('Invalid value.');
        expect(input.validity.valid).toBe(false);

        await user.tab({shift: true});
        await user.keyboard('4');
        await user.tab();

        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(true);
      });

      it('supports customizing native error messages', async () => {
        let {getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <NumberField data-testid="input" label="Value" isRequired validationBehavior="native" errorMessage={e => e.validationDetails.valueMissing ? 'Please enter a value' : null} />
            </Form>
          </Provider>
        );

        let input = getByTestId('input');
        expect(input).not.toHaveAttribute('aria-describedby');

        act(() => {getByTestId('form').checkValidity();});
        expect(input).toHaveAttribute('aria-describedby');
        expect(document.getElementById(input.getAttribute('aria-describedby'))).toHaveTextContent('Please enter a value');
      });

      it('only commits on blur if the value changed', async () => {
        let {getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <NumberField data-testid="input" label="Value" isRequired validationBehavior="native" />
            </Form>
          </Provider>
        );

        let input = getByTestId('input');
        expect(input).toHaveAttribute('required');
        expect(input).not.toHaveAttribute('aria-required');
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(false);

        await user.tab();
        await user.tab({shift: true});
        expect(input).not.toHaveAttribute('aria-describedby');

        act(() => {getByTestId('form').checkValidity();});

        expect(document.activeElement).toBe(input);
        expect(input).toHaveAttribute('aria-describedby');

        await user.keyboard('4');

        expect(input).toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(true);

        await user.tab();
        expect(input).not.toHaveAttribute('aria-describedby');
      });
    });

    describe('validationBehavior=aria', () => {
      it('supports validate function', async () => {
        let {getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <NumberField data-testid="input" label="Value" defaultValue={2} validate={v => v === 2 ? 'Invalid value' : null} />
            </Form>
          </Provider>
        );

        let input = getByTestId('input');
        expect(input).toHaveAttribute('aria-describedby');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(document.getElementById(input.getAttribute('aria-describedby'))).toHaveTextContent('Invalid value');
        expect(input.validity.valid).toBe(true);

        await user.tab();
        await user.keyboard('4');
        await user.tab();
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input).not.toHaveAttribute('aria-invalid');
      });

      it('supports server validation', async () => {
        let {getByTestId} = render(
          <Provider theme={theme}>
            <Form validationErrors={{value: 'Invalid value'}}>
              <NumberField data-testid="input" label="Value" name="value" />
            </Form>
          </Provider>
        );

        let input = getByTestId('input');
        expect(input).toHaveAttribute('aria-describedby');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(document.getElementById(input.getAttribute('aria-describedby'))).toHaveTextContent('Invalid value');

        await user.tab();
        await user.keyboard('4');
        await user.tab();
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input).not.toHaveAttribute('aria-invalid');
      });
    });
  });
});
