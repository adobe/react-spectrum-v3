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

import {act, fireEvent, pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import {Button} from '@react-spectrum/button';
import {chain} from '@react-aria/utils';
import {ColorField} from '../';
import {Form} from '@react-spectrum/form';
import {parseColor} from '@react-stately/color';
import {Provider} from '@react-spectrum/provider';
import React, {useState} from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

function renderComponent(props) {
  return render(
    <Provider theme={theme}>
      <ColorField
        label="Primary Color"
        {...props} />
    </Provider>
  );
}

describe('ColorField', function () {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  it('should handle defaults', function () {
    let {
      getByLabelText,
      getByRole,
      getByText
    } = renderComponent({});
    let colorField = getByLabelText('Primary Color');
    let label = getByText('Primary Color');
    expect(colorField).toBeInTheDocument();
    expect(getByRole('textbox')).toBe(colorField);
    expect(colorField).toHaveAttribute('type', 'text');
    expect(colorField).toHaveAttribute('autocomplete', 'off');
    expect(colorField).toHaveAttribute('autocorrect', 'off');
    expect(colorField).toHaveAttribute('spellcheck', 'false');
    expect(colorField).not.toHaveAttribute('readonly');
    expect(colorField).not.toBeInvalid();
    expect(colorField).not.toBeDisabled();
    expect(colorField).not.toBeRequired();
    expect(label).toHaveAttribute('for', colorField.id);
    expect(colorField).toHaveAttribute('aria-labelledby', label.id);
  });

  it('should handle aria-label prop', function () {
    let {getByLabelText} = renderComponent({
      'aria-label': 'Custom label',
      label: undefined
    });
    let colorField = getByLabelText('Custom label');
    expect(colorField).toBeInTheDocument();
    expect(colorField).not.toHaveAttribute('aria-labelledby');
  });

  it('should allow placeholder and show warning', function () {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let {getByPlaceholderText, getByRole} = renderComponent({placeholder: 'Enter a color'});
    expect(getByRole('textbox')).toBe(getByPlaceholderText('Enter a color'));
    expect(spyWarn).toHaveBeenCalledWith('Placeholders are deprecated due to accessibility issues. Please use help text instead. See the docs for details: https://react-spectrum.adobe.com/react-spectrum/ColorField.html#help-text');
  });

  it('should show valid validation state', function () {
    let {getByLabelText} = renderComponent({validationState: 'valid'});
    let colorField = getByLabelText('Primary Color');
    expect(colorField).not.toBeInvalid();
  });

  it('should show invalid validation state', function () {
    let {getByLabelText} = renderComponent({validationState: 'invalid'});
    let colorField = getByLabelText('Primary Color');
    expect(colorField).toBeInvalid();
  });

  it('should be disabled', function () {
    let {getByLabelText} = renderComponent({isDisabled: true});
    let colorField = getByLabelText('Primary Color');
    expect(colorField).toBeDisabled();
  });

  it('should be readonly', function () {
    let {getByLabelText} = renderComponent({isReadOnly: true});
    let colorField = getByLabelText('Primary Color');
    expect(colorField).toHaveAttribute('readonly');
  });

  it('should be required', function () {
    let {getByLabelText} = renderComponent({isRequired: true});
    let colorField = getByLabelText(/Primary Color/);
    expect(colorField).toBeRequired();
  });

  it('should be empty when invalid value is provided', function () {
    let {getByLabelText} = renderComponent({defaultValue: '#fffffffff'});
    let colorField = getByLabelText('Primary Color');
    expect(colorField.value).toBe('');

    // call commit to re-verify that a colorValue is not set in state
    act(() => {colorField.focus();});
    act(() => {colorField.blur();});
    expect(colorField.value).toBe('');
  });

  it.each`
    Name                                 | props
    ${'3-length hex string'}             | ${{defaultValue: '#abc'}}
    ${'6-length hex string'}             | ${{defaultValue: '#aabbcc'}}
    ${'Color object'}                    | ${{defaultValue: parseColor('#abc')}}
    ${'3-length hex string controlled'}  | ${{value: '#abc'}}
    ${'6-length hex string controlled'}  | ${{value: '#aabbcc'}}
    ${'Color object controlled'}         | ${{value: parseColor('#abc')}}
  `('should accept $Name as value', function ({props}) {
    let {getByLabelText} = renderComponent(props);
    let colorField = getByLabelText('Primary Color');
    expect(colorField.value).toBe('#AABBCC');
  });

  it('should handle uncontrolled state', async function () {
    let onChangeSpy = jest.fn();
    let {getByLabelText} = renderComponent({defaultValue: '#abc', onChange: onChangeSpy});

    let colorField = getByLabelText('Primary Color');
    expect(colorField.value).toBe('#AABBCC');

    act(() => {
      colorField.focus();
    });
    await user.clear(colorField);
    expect(colorField.value).toBe('');
    expect(onChangeSpy).not.toHaveBeenCalled();
    act(() => {
      colorField.blur();
    });
    // should call onChange when input is cleared
    expect(colorField.value).toBe('');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(null);

    act(() => {
      colorField.focus();
    });
    await user.keyboard('cba');
    await user.keyboard('cba');
    act(() => {
      colorField.blur();
    });
    expect(colorField.value).toBe('#CBACBA');
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenCalledWith(parseColor('#cbacba'));
  });

  it('should handle uncontrolled state typing same value twice', async function () {
    let onChangeSpy = jest.fn();
    let {getByLabelText} = renderComponent({onChange: onChangeSpy});

    let colorField = getByLabelText('Primary Color');

    act(() => {
      colorField.focus();
    });
    await user.keyboard('cbacba');
    act(() => {
      colorField.blur();
    });
    expect(colorField.value).toBe('#CBACBA');

    act(() => {
      colorField.focus();
    });
    await user.clear(colorField);
    await user.keyboard('cbacba');
    act(() => {
      colorField.blur();
    });
    expect(colorField.value).toBe('#CBACBA');
  });

  it('should not update value in controlled state', async function () {
    let onChangeSpy = jest.fn();
    let {getByLabelText} = renderComponent({value: '#abc', onChange: onChangeSpy});

    let colorField = getByLabelText('Primary Color');
    expect(colorField.value).toBe('#AABBCC');

    act(() => {
      colorField.focus();
    });
    await user.clear(colorField);
    // blur must be called in its own act
    act(() => {
      colorField.blur();
    });
    // should call onChange when input is cleared
    expect(colorField.value).toBe('#AABBCC');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(null);

    act(() => {
      colorField.focus();
    });
    await user.clear(colorField);
    await user.keyboard('cba');
    act(() => {
      colorField.blur();
    });
    expect(colorField.value).toBe('#AABBCC');
    expect(onChangeSpy).toHaveBeenCalledWith(parseColor('#cba'));
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
  });

  it('should update value in controlled state when implemented', async function () {
    function ColorFieldControlled(props) {
      let {onChange} = props;
      let [color, setColor] = useState(props.value);
      return (
        <ColorField
          {...props}
          label="Primary Color"
          value={color}
          onChange={chain(setColor, onChange)} />
      );
    }
    let onChangeSpy = jest.fn();
    let {getByLabelText} = render(<ColorFieldControlled value={parseColor('#abc')} onChange={onChangeSpy} />);

    let colorField = getByLabelText('Primary Color');
    expect(colorField.value).toBe('#AABBCC');

    act(() => {
      colorField.focus();
    });
    await user.clear(colorField);
    act(() => {
      colorField.blur();
    });
    // should call onChange when input is cleared
    expect(colorField.value).toBe('');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(null);

    act(() => {
      colorField.focus();
    });
    await user.keyboard('cba');
    act(() => {colorField.blur();});
    expect(colorField.value).toBe('#CCBBAA');
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenCalledWith(parseColor('#CCBBAA'));
  });

  it('should disallow invalid characters and revert back to last valid value if left incomplete', async function () {
    let onChangeSpy = jest.fn();
    let {getByLabelText} = renderComponent({onChange: onChangeSpy});
    let colorField = getByLabelText('Primary Color');
    expect(colorField.value).toBe('');

    act(() => {colorField.focus();});
    await user.keyboard('abc');
    act(() => {colorField.blur();});
    expect(colorField.value).toBe('#AABBCC');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(parseColor('#abc'));

    act(() => {
      colorField.focus();
    });
    await user.clear(colorField);
    await user.keyboard('abcxyz8b');
    expect(colorField.value).toBe('abc8b');
    act(() => {colorField.blur();});
    /* is this really what we expect?? */
    expect(colorField.value).toBe('#AABBCC');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
  });

  it.each`
    Name                                | expected                 | key
    ${'increment with arrow up key'}    | ${parseColor('#AAAAAB')}  | ${'ArrowUp'}
    ${'decrement with arrow down key'}  | ${parseColor('#AAAAA9')}  | ${'ArrowDown'}
  `('should handle $Name event', async function ({expected, key}) {
    let onChangeSpy = jest.fn();
    let {getByLabelText} = renderComponent({
      defaultValue: '#aaa',
      onChange: onChangeSpy
    });
    let colorField = getByLabelText('Primary Color');
    expect(colorField.value).toBe('#AAAAAA');

    await user.tab();
    await user.keyboard(`{${key}}`);
    expect(onChangeSpy).toHaveBeenCalledWith(expected);
    expect(colorField.value).toBe(expected.toString('hex'));
  });

  it.each`
    Name                                | expected                        | deltaY
    ${'increment with mouse wheel'}     | ${parseColor('#AAAAAB')}  | ${10}
    ${'decrement with mouse wheel'}     | ${parseColor('#AAAAA9')}  | ${-10}
  `('should handle $Name event', function ({expected, deltaY}) {
    let onChangeSpy = jest.fn();
    let {getByLabelText} = renderComponent({
      defaultValue: '#aaa',
      onChange: onChangeSpy
    });
    let colorField = getByLabelText('Primary Color');
    expect(colorField.value).toBe('#AAAAAA');

    act(() => {colorField.focus();});
    fireEvent.wheel(colorField, {deltaY});
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(expected);
    expect(colorField.value).toBe(expected.toString('hex'));
  });

  it.each`
    Name                                 | props                                   | initExpected  | key
    ${'not increment beyond max value'}  | ${{defaultValue: '#fffffe'}}            | ${'#FFFFFE'}  | ${'ArrowUp'}
    ${'increment to max value'}          | ${{defaultValue: '#aabbcc'}}            | ${'#AABBCC'}  | ${'End'}
  `('should $Name', async function ({props, initExpected, key}) {
    let onChangeSpy = jest.fn();
    let {getByLabelText} = renderComponent({...props, onChange: onChangeSpy});
    let colorField = getByLabelText('Primary Color');
    expect(colorField.value).toBe(initExpected);

    let maxColor = parseColor('#FFFFFF');
    await user.tab();
    await user.keyboard(`{${key}}`);
    expect(onChangeSpy).toHaveBeenCalledWith(maxColor);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(colorField.value).toBe(maxColor.toString('hex'));

    // repeat action to make sure onChange is not called when already at max
    await user.tab();
    await user.keyboard(`{${key}}`);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
  });

  it.each`
    Name                                 | props                                   | initExpected  | key
    ${'not decrement beyond min value'}  | ${{defaultValue: '#000001'}}            | ${'#000001'}  | ${'ArrowDown'}
    ${'decrement to min value'}          | ${{defaultValue: '#aabbcc'}}            | ${'#AABBCC'}  | ${'Home'}
  `('should $Name', async function ({props, initExpected, key}) {
    let onChangeSpy = jest.fn();
    let {getByLabelText} = renderComponent({...props, onChange: onChangeSpy});
    let colorField = getByLabelText('Primary Color');
    expect(colorField.value).toBe(initExpected);

    let minColor = parseColor('#000000');
    await user.tab();
    await user.keyboard(`{${key}}`);
    expect(onChangeSpy).toHaveBeenCalledWith(minColor);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(colorField.value).toBe(minColor.toString('hex'));

    // repeat action to make sure onChange is not called when already at min
    await user.tab();
    await user.keyboard(`{${key}}`);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
  });

  describe('channel', function () {
    it('should support the channel prop', async function () {
      let onChange = jest.fn();
      let {getByRole} = renderComponent({label: null, value: '#abc', colorSpace: 'hsl', channel: 'hue', onChange});
      let colorField = getByRole('textbox');
      expect(colorField.value).toBe('210°');
      expect(colorField).toHaveAttribute('aria-label', 'Hue');

      await user.tab();
      await user.keyboard('100');
      await user.tab();
      expect(onChange).toHaveBeenCalledWith(parseColor('hsl(100, 25%, 73.33%)'));
    });

    it('should default to empty', function () {
      let {getByRole} = renderComponent({label: null, colorSpace: 'hsl', channel: 'hue'});
      let colorField = getByRole('textbox');
      expect(colorField).toHaveValue('');
    });

    it('should support null value', function () {
      let {getByRole} = renderComponent({label: null, value: null, colorSpace: 'hsl', channel: 'hue'});
      let colorField = getByRole('textbox');
      expect(colorField).toHaveValue('');
    });

    it('should support clearing value', async function () {
      let onChange = jest.fn();
      let {getByRole} = renderComponent({label: null, defaultValue: '#abc', colorSpace: 'hsl', channel: 'hue', onChange});
      let colorField = getByRole('textbox');
      expect(colorField).toHaveValue('210°');

      await user.tab();
      await user.keyboard('{Backspace}');
      await user.tab();

      expect(colorField).toHaveValue('');
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('validation', () => {
    describe('validationBehavior=native', () => {
      it('supports isRequired', async () => {
        let {getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <ColorField data-testid="input" label="Color" isRequired validationBehavior="native"  />
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

        await user.keyboard('#000');

        expect(input).toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(true);

        await user.tab();

        expect(input).not.toHaveAttribute('aria-describedby');
      });

      it('supports validate function', async () => {
        let {getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <ColorField data-testid="input" label="Color" defaultValue="#000" step={2} validationBehavior="native" validate={v => v.red === 0 ? 'Invalid value' : null} />
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
        await user.keyboard('#111');

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
                <ColorField data-testid="input" label="Color" name="value" validationBehavior="native" />
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
        await user.keyboard('#333');
        await user.tab();

        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input.validity.valid).toBe(true);
      });

      it('supports customizing native error messages', async () => {
        let {getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <ColorField data-testid="input" label="Color" isRequired validationBehavior="native" errorMessage={e => e.validationDetails.valueMissing ? 'Please enter a value' : null} />
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
              <ColorField data-testid="input" label="Value" isRequired validationBehavior="native" />
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

        expect(input).toHaveAttribute('aria-describedby');
        expect(document.activeElement).toBe(input);

        await user.keyboard('333');

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
              <ColorField data-testid="input" label="Color" defaultValue="#000" validate={v => v.red === 0 ? 'Invalid value' : null} />
            </Form>
          </Provider>
        );

        let input = getByTestId('input');
        expect(input).toHaveAttribute('aria-describedby');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(document.getElementById(input.getAttribute('aria-describedby'))).toHaveTextContent('Invalid value');
        expect(input.validity.valid).toBe(true);

        await user.tab();
        await user.keyboard('#333');
        await user.tab();
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input).not.toHaveAttribute('aria-invalid');
      });

      it('supports server validation', async () => {
        let {getByTestId} = render(
          <Provider theme={theme}>
            <Form validationErrors={{value: 'Invalid value'}}>
              <ColorField data-testid="input" label="Color" name="value" validationBehavior="native" />
            </Form>
          </Provider>
        );

        let input = getByTestId('input');
        expect(input).toHaveAttribute('aria-describedby');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(document.getElementById(input.getAttribute('aria-describedby'))).toHaveTextContent('Invalid value');

        await user.tab();
        await user.keyboard('#fff');
        await user.tab();
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input).not.toHaveAttribute('aria-invalid');
      });
    });
  });
});
