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

import {act, render} from '@testing-library/react';
import {Checkbox} from '../';
import React from 'react';
import userEvent from '@testing-library/user-event';
import V2Checkbox from '@react/react-spectrum/Checkbox';


describe('Checkbox', function () {
  let onChangeSpy = jest.fn();

  afterEach(() => {
    onChangeSpy.mockClear();
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy}}
    ${'Checkbox isEmphasized'} | ${Checkbox}    | ${{onChange: onChangeSpy, isEmphasized: true}}
    ${'V2Checkbox'}            | ${V2Checkbox}  | ${{onChange: onChangeSpy}}
    ${'V2Checkbox quiet'}      | ${V2Checkbox}  | ${{onChange: onChangeSpy, quiet: true}}
  `('$Name default unchecked can be checked', function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.checked).toBeFalsy();
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(onChangeSpy).not.toHaveBeenCalled();

    userEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(checkbox.checked).toBeTruthy();
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[0][0]).toBe(true);

    userEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[1][0]).toBe(false);

    // would test space key, but then it's just testing the browser, no need
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, defaultSelected: true}}
    ${'Checkbox isEmphasized'} | ${Checkbox}    | ${{onChange: onChangeSpy, defaultSelected: true, isEmphasized: true}}
    ${'V2Checkbox'}            | ${V2Checkbox}  | ${{onChange: onChangeSpy, defaultChecked: true}}
    ${'V2Checkbox quiet'}      | ${V2Checkbox}  | ${{onChange: onChangeSpy, defaultChecked: true, quiet: true}}
  `('$Name can be default checked', function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.checked).toBeTruthy();

    userEvent.click(checkbox);
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[0][0]).toBe(false);
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, isSelected: true}}
    ${'Checkbox isEmphasized'} | ${Checkbox}    | ${{onChange: onChangeSpy, isSelected: true, isEmphasized: true}}
    ${'V2Checkbox'}            | ${V2Checkbox}  | ${{onChange: onChangeSpy, checked: true}}
    ${'V2Checkbox quiet'}      | ${V2Checkbox}  | ${{onChange: onChangeSpy, checked: true, quiet: true}}
  `('$Name can be controlled checked', function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.checked).toBeTruthy();

    userEvent.click(checkbox);
    expect(checkbox.checked).toBeTruthy();
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[0][0]).toBe(false);
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, isSelected: false}}
    ${'Checkbox isEmphasized'} | ${Checkbox}    | ${{onChange: onChangeSpy, isSelected: false, isEmphasized: true}}
    ${'V2Checkbox'}            | ${V2Checkbox}  | ${{onChange: onChangeSpy, checked: false}}
    ${'V2Checkbox quiet'}      | ${V2Checkbox}  | ${{onChange: onChangeSpy, checked: false, quiet: true}}
  `('$Name can be controlled unchecked', function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.checked).toBeFalsy();

    userEvent.click(checkbox);
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[0][0]).toBe(true);
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, isDisabled: true}}
    ${'Checkbox isEmphasized'} | ${Checkbox}    | ${{onChange: onChangeSpy, isDisabled: true, isEmphasized: true}}
    ${'V2Checkbox'}            | ${V2Checkbox}  | ${{onChange: onChangeSpy, disabled: true}}
    ${'V2Checkbox quiet'}      | ${V2Checkbox}  | ${{onChange: onChangeSpy, disabled: true, quiet: true}}
  `('$Name can be disabled', function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.checked).toBeFalsy();

    userEvent.click(checkbox);
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, validationState: 'invalid'}}
    ${'V2Checkbox quiet'}      | ${V2Checkbox}  | ${{onChange: onChangeSpy, invalid: true, quiet: true}}
  `('$Name can be invalid', function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, validationState: 'invalid', 'aria-errormessage': 'test'}}
  `('$Name passes through aria-errormessage', function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAttribute('aria-errormessage', 'test');
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, isIndeterminate: true}}
    ${'Checkbox isEmphasized'} | ${Checkbox}    | ${{onChange: onChangeSpy, isIndeterminate: true, isEmphasized: true}}
    ${'V2Checkbox'}            | ${V2Checkbox}  | ${{onChange: onChangeSpy, indeterminate: true}}
    ${'V2Checkbox quiet'}      | ${V2Checkbox}  | ${{onChange: onChangeSpy, indeterminate: true, quiet: true}}
  `('$Name can be indeterminate', function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    expect(checkbox.indeterminate).toBeTruthy();
    expect(checkbox.checked).toBeFalsy();

    userEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    expect(checkbox.indeterminate).toBeTruthy();
    expect(checkbox.checked).toBeTruthy();
    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy.mock.calls[0][0]).toBe(true);

    userEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    expect(checkbox.indeterminate).toBeTruthy();
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy.mock.calls[1][0]).toBe(false);

  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, 'aria-label': 'not visible'}}
    ${'V2Checkbox quiet'}      | ${V2Checkbox}  | ${{onChange: onChangeSpy, 'aria-label': 'not visible', quiet: true}}
  `('$Name can have a non-visible label', function ({Component, props}) {
    let {getByRole} = render(<Component {...props} />);

    let checkbox = getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', props['aria-label']);
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, 'aria-labelledby': 'test'}}
    ${'V2Checkbox'}            | ${V2Checkbox}  | ${{onChange: onChangeSpy, 'aria-labelledby': 'test'}}
  `('$Name supports aria-labelledby', function ({Component, props}) {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Component {...props} />
      </>
    );

    let checkbox = getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-labelledby', props['aria-labelledby']);
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, 'aria-describedby': 'test'}}
    ${'V2Checkbox'}            | ${V2Checkbox}  | ${{onChange: onChangeSpy, 'aria-describedby': 'test'}}
  `('$Name supports aria-describedby', function ({Component, props}) {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Component {...props}>Hi</Component>
      </>
    );

    let checkbox = getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-describedby', props['aria-describedby']);
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, 'data-testid': 'target'}}
  `('$Name supports additional props', function ({Component, props}) {
    let {getByTestId} = render(<Component {...props}>Click Me</Component>);

    let checkboxLabel = getByTestId('target');
    expect(checkboxLabel).toBeInTheDocument();
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, excludeFromTabOrder: true}}
  `('$Name supports excludeFromTabOrder', function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Hi</Component>);

    let checkbox = getByRole('checkbox');
    expect(checkbox).toHaveAttribute('tabIndex', '-1');
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, isSelected: true, isReadOnly: true}}
  `('$Name supports readOnly', function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.checked).toBeTruthy();

    userEvent.click(checkbox);
    expect(checkbox.checked).toBeTruthy();
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it.each`
    Name                       | Component      | props
    ${'Checkbox'}              | ${Checkbox}    | ${{onChange: onChangeSpy, isReadOnly: true}}
  `('$Name supports uncontrolled readOnly', function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.checked).toBeFalsy();

    act(() => {userEvent.click(checkbox);});
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy).not.toHaveBeenCalled();
  });
});
