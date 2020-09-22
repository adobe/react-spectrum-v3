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
import {Color} from '@react-stately/color';
import {HexColorField} from '../';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';

function renderComponent(props) {
  return render(
    <Provider theme={theme}>
      <HexColorField
        label="Primary Color"
        {...props} />
    </Provider>
  );
}

describe('HexColorField', function () {
  it('should handle defaults', function () {
    const {
      getByLabelText, 
      getByRole,
      getByText
    } = renderComponent({});
    const hexColorField = getByLabelText('Primary Color');
    const label = getByText('Primary Color');
    expect(hexColorField).toBeInTheDocument();
    expect(getByRole('spinbutton')).toBe(hexColorField);
    expect(hexColorField).toHaveAttribute('type', 'text');
    expect(hexColorField).toHaveAttribute('autocomplete', 'off');
    expect(hexColorField).not.toHaveAttribute('readonly');
    expect(hexColorField).not.toBeInvalid();
    expect(hexColorField).not.toBeDisabled();
    expect(hexColorField).not.toBeRequired();
    expect(label).toHaveAttribute('for', hexColorField.id);
    expect(hexColorField).toHaveAttribute('aria-labelledby', label.id);
  });

  it('should handle aria-label prop', function () {
    const {getByLabelText} = renderComponent({
      'aria-label': 'Custom label',
      label: undefined
    });
    const hexColorField = getByLabelText('Custom label');
    expect(hexColorField).toBeInTheDocument();
    expect(hexColorField).not.toHaveAttribute('aria-labelledby');
  });

  it('should allow placeholder', function () {
    const {getByPlaceholderText, getByRole} = renderComponent({placeholder: 'Enter a color'});
    expect(getByRole('spinbutton')).toBe(getByPlaceholderText('Enter a color'));
  });

  it('should show valid validation state', function () {
    const {getByLabelText} = renderComponent({validationState: 'valid'});
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField).not.toBeInvalid();
  });

  it('should show invalid validation state', function () {
    const {getByLabelText} = renderComponent({validationState: 'invalid'});
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField).toBeInvalid();
  });

  it('should be disabled', function () {
    const {getByLabelText} = renderComponent({isDisabled: true});
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField).toBeDisabled();
  });

  it('should be readonly', function () {
    const {getByLabelText} = renderComponent({isReadOnly: true});
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField).toHaveAttribute('readonly');
  });

  it('should be required', function () {
    const {getByLabelText} = renderComponent({isRequired: true});
    const hexColorField = getByLabelText(/Primary Color/);
    expect(hexColorField).toBeRequired();
  });

  it('should be empty when invalid value is provided', function () {
    const {getByLabelText} = renderComponent({defaultValue: true});
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField.value).toBe('');

    act(() => {hexColorField.focus();});
    act(() => {hexColorField.blur();});
    expect(hexColorField.value).toBe('');
  });

  it.each`
    Name                                 | props
    ${'3-length hex string'}             | ${{defaultValue: '#abc'}}
    ${'6-length hex string'}             | ${{defaultValue: '#aabbcc'}}
    ${'Color object'}                    | ${{defaultValue: new Color('#abc')}}
    ${'3-length hex string controlled'}  | ${{value: '#abc'}}
    ${'6-length hex string controlled'}  | ${{value: '#aabbcc'}}
    ${'Color object controlled'}         | ${{value: new Color('#abc')}}
  `('should accept $Name as value', function ({props}) {
    const {getByLabelText} = renderComponent(props);
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField.value).toBe('#AABBCC');
  });

  it.each`
    Name                   | props
    ${'custom min value'}  | ${{defaultValue: '#aaa', minValue: '#bbb'}}
    ${'custom max value'}  | ${{defaultValue: '#ccc', maxValue: '#bbb'}}
  `('should clamp initial value provided to $Name', function ({props}) {
    const {getByLabelText} = renderComponent(props);
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField.value).toBe('#BBBBBB');
  });

  it('should handle uncontrolled state', function () {
    const onChangeSpy = jest.fn();
    const {getByLabelText} = renderComponent({defaultValue: '#abc', onChange: onChangeSpy});

    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField.value).toBe('#AABBCC');

    act(() => {hexColorField.focus();});
    fireEvent.change(hexColorField, {target: {value: 'cba'}});
    expect(hexColorField.value).toBe('cba');
    expect(onChangeSpy).toHaveBeenCalledWith(new Color('#cba'));

    act(() => {hexColorField.blur();});
    expect(hexColorField.value).toBe('#CCBBAA');
  });

  it('should handle controlled state', function () {
    const onChangeSpy = jest.fn();
    const {getByLabelText} = renderComponent({value: '#abc', onChange: onChangeSpy});

    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField.value).toBe('#AABBCC');

    act(() => {hexColorField.focus();});
    fireEvent.change(hexColorField, {target: {value: 'cba'}});
    expect(hexColorField.value).toBe('cba');
    expect(onChangeSpy).toHaveBeenCalledWith(new Color('#cba'));

    act(() => {hexColorField.blur();});
    expect(hexColorField.value).toBe('#AABBCC');
  });

  it('should revert back to last valid value', function () {
    const onChangeSpy = jest.fn();
    const {getByLabelText} = renderComponent({defaultValue: '#abc', onChange: onChangeSpy});
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField.value).toBe('#AABBCC');

    act(() => {hexColorField.focus();});
    fireEvent.change(hexColorField, {target: {value: 'xyz'}});
    expect(hexColorField.value).toBe('xyz');
    expect(onChangeSpy).not.toHaveBeenCalled();

    act(() => {hexColorField.blur();});
    expect(hexColorField.value).toBe('#AABBCC');
  });

  it.each`
    Name                                | expected      | key
    ${'increment with arrow up key'}    | ${'#AAAAAE'}  | ${'ArrowUp'}
    ${'increment with page up key'}     | ${'#AAAAAE'}  | ${'PageUp'}
    ${'decrement with arrow down key'}  | ${'#AAAAA6'}  | ${'ArrowDown'}
    ${'decrement with page down key'}   | ${'#AAAAA6'}  | ${'PageDown'}
  `('should handle $Name event', function ({expected, key}) {
    const {getByLabelText} = renderComponent({defaultValue: '#aaa', step: 4});
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField.value).toBe('#AAAAAA');

    fireEvent.keyDown(hexColorField, {key});
    fireEvent.keyUp(hexColorField, {key});
    expect(hexColorField.value).toBe(expected);
  });

  it.each`
    Name                                | expected      | deltaY
    ${'increment with mouse wheel'}     | ${'#AAAAAE'}  | ${-10}
    ${'decrement with mouse wheel'}     | ${'#AAAAA6'}  | ${10}
  `('should handle $Name event', function ({expected, action, deltaY}) {
    const {getByLabelText} = renderComponent({defaultValue: '#aaa', step: 4});
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField.value).toBe('#AAAAAA');

    fireEvent.wheel(hexColorField, {deltaY});
    expect(hexColorField.value).toBe(expected);
  });

  it.each`
    Name                                 | props                                                    | initExpected  | key
    ${'not increment beyond max value'}  | ${{defaultValue: '#bbbbba', maxValue: '#bbb', step: 4}}  | ${'#BBBBBA'}  | ${'ArrowUp'}
    ${'not decrement beyond min value'}  | ${{defaultValue: '#bbbbbc', minValue: '#bbb', step: 4}}  | ${'#BBBBBC'}  | ${'ArrowDown'}
    ${'increment to max value'}          | ${{defaultValue: '#aaa', maxValue: '#bbb'}}              | ${'#AAAAAA'}  | ${'End'}
    ${'decrement to min value'}          | ${{defaultValue: '#ccc', minValue: '#bbb'}}              | ${'#CCCCCC'}  | ${'Home'}
  `('should $Name', function ({props, initExpected, key}) {
    const {getByLabelText} = renderComponent(props);
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField.value).toBe(initExpected);

    fireEvent.keyDown(hexColorField, {key});
    fireEvent.keyUp(hexColorField, {key});
    expect(hexColorField.value).toBe('#BBBBBB');
  });

  it.each`
    Name            | props                                        | initExpected  | newValue  | action
    ${'max value'}  | ${{defaultValue: '#aaa', maxValue: '#bbb'}}  | ${'#AAAAAA'}  | ${'fff'}  | ${(el) => fireEvent.change(el, {target: {value: 'fff'}})}
    ${'min value'}  | ${{defaultValue: '#ccc', minValue: '#bbb'}}  | ${'#CCCCCC'}  | ${'000'}  | ${(el) => fireEvent.change(el, {target: {value: '000'}})}
  `('should clamp value to $Name on change', function ({props, initExpected, newValue, action}) {
    const {getByLabelText} = renderComponent(props);
    const hexColorField = getByLabelText('Primary Color');
    expect(hexColorField.value).toBe(initExpected);

    act(() => {hexColorField.focus();});
    action(hexColorField);
    expect(hexColorField.value).toBe(newValue);

    act(() => {hexColorField.blur();});
    expect(hexColorField.value).toBe('#BBBBBB');
  });
});
