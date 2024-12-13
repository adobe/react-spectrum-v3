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

import {act} from 'react-dom/test-utils';
import {Button} from '@react-spectrum/button';
import {Checkbox} from '../';
import {Form} from '@react-spectrum/form';
import {pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

describe('Checkbox', function () {
  let onChangeSpy = jest.fn();
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  afterEach(() => {
    onChangeSpy.mockClear();
  });

  it.each`
    Name                       | Component   | props
    ${'Checkbox'}              | ${Checkbox} | ${{onChange: onChangeSpy}}
    ${'Checkbox isEmphasized'} | ${Checkbox} | ${{onChange: onChangeSpy, isEmphasized: true}}
  `('$Name default unchecked can be checked', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.value).toBe('on');
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy).not.toHaveBeenCalled();

    await user.click(checkbox);
    expect(checkbox.checked).toBeTruthy();
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[0][0]).toBe(true);

    await user.click(checkbox);
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[1][0]).toBe(false);

    // would test space key, but then it's just testing the browser, no need
  });

  it.each`
    Name                       | Component   | props
    ${'Checkbox'}              | ${Checkbox} | ${{onChange: onChangeSpy, defaultSelected: true, value: 'newsletter'}}
    ${'Checkbox isEmphasized'} | ${Checkbox} | ${{onChange: onChangeSpy, defaultSelected: true, isEmphasized: true, value: 'newsletter'}}
  `('$Name can be default checked', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.value).toBe('newsletter');
    expect(checkbox.checked).toBeTruthy();

    await user.click(checkbox);
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[0][0]).toBe(false);
  });

  it.each`
    Name                       | Component   | props
    ${'Checkbox'}              | ${Checkbox} | ${{onChange: onChangeSpy, isSelected: true}}
    ${'Checkbox isEmphasized'} | ${Checkbox} | ${{onChange: onChangeSpy, isSelected: true, isEmphasized: true}}
  `('$Name can be controlled checked', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.value).toBe('on');
    expect(checkbox.checked).toBeTruthy();

    await user.click(checkbox);
    expect(checkbox.checked).toBeTruthy();
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[0][0]).toBe(false);
  });

  it.each`
    Name                       | Component   | props
    ${'Checkbox'}              | ${Checkbox} | ${{onChange: onChangeSpy, isSelected: false}}
    ${'Checkbox isEmphasized'} | ${Checkbox} | ${{onChange: onChangeSpy, isSelected: false, isEmphasized: true}}
  `('$Name can be controlled unchecked', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.value).toBe('on');
    expect(checkbox.checked).toBeFalsy();

    await user.click(checkbox);
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[0][0]).toBe(true);
  });

  it.each`
    Name                       | Component   | props
    ${'Checkbox'}              | ${Checkbox} | ${{onChange: onChangeSpy, isDisabled: true}}
    ${'Checkbox isEmphasized'} | ${Checkbox} | ${{onChange: onChangeSpy, isDisabled: true, isEmphasized: true}}
  `('$Name can be disabled', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.value).toBe('on');
    expect(checkbox.checked).toBeFalsy();

    await user.click(checkbox);
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it.each`
    Name          | Component   | props
    ${'Checkbox'} | ${Checkbox} | ${{onChange: onChangeSpy, isInvalid: true}}
  `('$Name can be invalid', function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByRole('checkbox');
    expect(checkbox.value).toBe('on');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
  });

  it.each`
    Name          | Component   | props
    ${'Checkbox'} | ${Checkbox} | ${{onChange: onChangeSpy, isInvalid: true, 'aria-errormessage': 'test'}}
  `('$Name passes through aria-errormessage', function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByRole('checkbox');
    expect(checkbox.value).toBe('on');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAttribute('aria-errormessage', 'test');
  });

  it.each`
    Name                       | Component   | props
    ${'Checkbox'}              | ${Checkbox} | ${{onChange: onChangeSpy, isIndeterminate: true}}
    ${'Checkbox isEmphasized'} | ${Checkbox} | ${{onChange: onChangeSpy, isIndeterminate: true, isEmphasized: true}}
  `('$Name can be indeterminate', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.value).toBe('on');
    expect(checkbox.indeterminate).toBeTruthy();
    expect(checkbox.checked).toBeFalsy();

    await user.click(checkbox);
    expect(checkbox.indeterminate).toBeTruthy();
    expect(checkbox.checked).toBeTruthy();
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[0][0]).toBe(true);

    await user.click(checkbox);
    expect(checkbox.indeterminate).toBeTruthy();
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy.mock.calls[1][0]).toBe(false);
  });

  it.each`
    Name          | Component   | props
    ${'Checkbox'} | ${Checkbox} | ${{onChange: onChangeSpy, 'aria-label': 'not visible'}}
  `('$Name can have a non-visible label', function ({Component, props}) {
    let {getByRole} = render(<Component {...props} />);

    let checkbox = getByRole('checkbox');
    expect(checkbox.value).toBe('on');
    expect(checkbox).toHaveAttribute('aria-label', props['aria-label']);
  });

  it.each`
    Name          | Component   | props
    ${'Checkbox'} | ${Checkbox} | ${{onChange: onChangeSpy, 'aria-labelledby': 'test'}}
  `('$Name supports aria-labelledby', function ({Component, props}) {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Component {...props} />
      </>
    );

    let checkbox = getByRole('checkbox');
    expect(checkbox.value).toBe('on');
    expect(checkbox).toHaveAttribute(
      'aria-labelledby',
      props['aria-labelledby']
    );
  });

  it.each`
    Name          | Component   | props
    ${'Checkbox'} | ${Checkbox} | ${{onChange: onChangeSpy, 'aria-describedby': 'test'}}
  `('$Name supports aria-describedby', function ({Component, props}) {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Component {...props}>Hi</Component>
      </>
    );

    let checkbox = getByRole('checkbox');
    expect(checkbox.value).toBe('on');
    expect(checkbox).toHaveAttribute(
      'aria-describedby',
      props['aria-describedby']
    );
  });

  it.each`
    Name          | Component   | props
    ${'Checkbox'} | ${Checkbox} | ${{onChange: onChangeSpy, 'data-testid': 'target'}}
  `('$Name supports additional props', function ({Component, props}) {
    let {getByTestId} = render(<Component {...props}>Click Me</Component>);

    let checkboxLabel = getByTestId('target');
    expect(checkboxLabel).toBeInTheDocument();
  });

  it.each`
    Name          | Component   | props
    ${'Checkbox'} | ${Checkbox} | ${{onChange: onChangeSpy, excludeFromTabOrder: true}}
  `('$Name supports excludeFromTabOrder', function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Hi</Component>);

    let checkbox = getByRole('checkbox');
    expect(checkbox.value).toBe('on');
    expect(checkbox).toHaveAttribute('tabIndex', '-1');
  });

  it.each`
    Name          | Component   | props
    ${'Checkbox'} | ${Checkbox} | ${{onChange: onChangeSpy, isSelected: true, isReadOnly: true}}
  `('$Name supports readOnly', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.value).toBe('on');
    expect(checkbox.checked).toBeTruthy();

    await user.click(checkbox);
    expect(checkbox.checked).toBeTruthy();
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it.each`
    Name          | Component   | props
    ${'Checkbox'} | ${Checkbox} | ${{onChange: onChangeSpy, isReadOnly: true}}
  `('$Name supports uncontrolled readOnly', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.value).toBe('on');
    expect(checkbox.checked).toBeFalsy();

    await user.click(checkbox);
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it('supports form reset', async () => {
    function Test() {
      let [isSelected, setSelected] = React.useState(false);
      return (
        <form>
          <Checkbox data-testid="checkbox" isSelected={isSelected} onChange={setSelected}>Checkbox</Checkbox>
          <input type="reset" data-testid="reset" />
        </form>
      );
    }

    let {getByTestId} = render(<Test />);
    let input = getByTestId('checkbox');

    expect(input).not.toBeChecked();
    await user.click(input);
    expect(input).toBeChecked();

    let button = getByTestId('reset');
    await user.click(button);
    expect(input).not.toBeChecked();
  });

  describe('validation', () => {
    describe('validationBehavior=native', () => {
      it('supports isRequired', async () => {
        let {getByRole, getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <Checkbox isRequired validationBehavior="native">Terms and conditions</Checkbox>
            </Form>
          </Provider>
        );

        let checkbox = getByRole('checkbox');
        expect(checkbox).toHaveAttribute('required');
        expect(checkbox).not.toHaveAttribute('aria-required');
        expect(checkbox.validity.valid).toBe(false);

        act(() => {getByTestId('form').checkValidity();});

        await user.click(checkbox);
        expect(checkbox.validity.valid).toBe(true);
      });

      it('supports validate function', async () => {
        let {getByRole, getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <Checkbox validationBehavior="native" validate={v => !v ? 'You must accept the terms.' : null}>Terms and conditions</Checkbox>
            </Form>
          </Provider>
        );

        let checkbox = getByRole('checkbox');
        expect(checkbox.validity.valid).toBe(false);

        act(() => {getByTestId('form').checkValidity();});

        await user.click(checkbox);
        expect(checkbox.validity.valid).toBe(true);
      });

      it('supports server validation', async () => {
        function Test() {
          let [serverErrors, setServerErrors] = React.useState({});
          let onSubmit = e => {
            e.preventDefault();
            setServerErrors({
              terms: 'You must accept the terms.'
            });
          };

          return (
            <Provider theme={theme}>
              <Form onSubmit={onSubmit} validationErrors={serverErrors}>
                <Checkbox name="terms" validationBehavior="native">Terms and conditions</Checkbox>
                <Button type="submit">Submit</Button>
              </Form>
            </Provider>
          );
        }

        let {getByRole} = render(<Test />);
        await user.click(getByRole('button'));

        let checkbox = getByRole('checkbox');
        expect(checkbox.validity.valid).toBe(false);

        await user.click(checkbox);
        expect(checkbox.validity.valid).toBe(true);
      });
    });

    describe('validationBehavior=aria', () => {
      it('supports validate function', async () => {
        let {getByRole} = render(
          <Provider theme={theme}>
            <Checkbox value="terms" validate={v => !v ? 'You must accept the terms.' : null}>Terms and conditions</Checkbox>
          </Provider>
        );

        let checkbox = getByRole('checkbox');
        expect(checkbox.validity.valid).toBe(true);

        await user.click(checkbox);
      });

      it('supports server validation', async () => {
        let {getByRole} = render(
          <Provider theme={theme}>
            <Form validationErrors={{terms: 'You must accept the terms'}}>
              <Checkbox name="terms">Terms and conditions</Checkbox>
            </Form>
          </Provider>
        );

        let checkbox = getByRole('checkbox');
        expect(checkbox).toHaveAttribute('aria-invalid', 'true');

        await user.click(checkbox);
        expect(checkbox).not.toHaveAttribute('aria-invalid');
      });
    });
  });
});
