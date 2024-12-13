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

import {pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import React from 'react';
import {Switch} from '../';
import userEvent from '@testing-library/user-event';

describe('Switch', function () {
  let onChangeSpy = jest.fn();
  let user;

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  afterEach(() => {
    onChangeSpy.mockClear();
  });

  it.each`
    Name                     | Component    | props
    ${'Switch'}              | ${Switch}    | ${{onChange: onChangeSpy}}
    ${'Switch isEmphasized'} | ${Switch}    | ${{onChange: onChangeSpy, isEmphasized: true}}
  `('$Name default unchecked can be checked', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.value).toBe('on');
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy).not.toHaveBeenCalled();

    await user.click(checkbox);
    expect(checkbox.checked).toBeTruthy();
    expect(onChangeSpy.mock.calls[0][0]).toBe(true);

    await user.click(checkbox);
    expect(onChangeSpy.mock.calls[1][0]).toBe(false);

    // would test space key, but then it's just testing the browser, no need
  });

  it.each`
    Name                     | Component    | props
    ${'Switch'}              | ${Switch}    | ${{onChange: onChangeSpy, defaultSelected: true, value: 'newsletter'}}
    ${'Switch isEmphasized'} | ${Switch}    | ${{onChange: onChangeSpy, defaultSelected: true, isEmphasized: true, value: 'newsletter'}}
  `('$Name can be default checked', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.value).toBe('newsletter');
    expect(checkbox.checked).toBeTruthy();

    await user.click(checkbox);
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy.mock.calls[0][0]).toBe(false);
  });

  it.each`
    Name                     | Component    | props
    ${'Switch'}              | ${Switch}    | ${{onChange: onChangeSpy, isSelected: true}}
    ${'Switch isEmphasized'} | ${Switch}    | ${{onChange: onChangeSpy, isSelected: true, isEmphasized: true}}
  `('$Name can be controlled checked', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.checked).toBeTruthy();

    await user.click(checkbox);
    expect(checkbox.checked).toBeTruthy();
    expect(onChangeSpy.mock.calls[0][0]).toBe(false);
  });

  it.each`
    Name                     | Component    | props
    ${'Switch'}              | ${Switch}    | ${{onChange: onChangeSpy, isSelected: false}}
    ${'Switch isEmphasized'} | ${Switch}    | ${{onChange: onChangeSpy, isSelected: false, isEmphasized: true}}
  `('$Name can be controlled unchecked', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.checked).toBeFalsy();

    await user.click(checkbox);
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy.mock.calls[0][0]).toBe(true);
  });

  it.each`
    Name                     | Component    | props
    ${'Switch'}              | ${Switch}    | ${{onChange: onChangeSpy, isDisabled: true}}
    ${'Switch isEmphasized'} | ${Switch}    | ${{onChange: onChangeSpy, isDisabled: true, isEmphasized: true}}
  `('$Name can be disabled', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.checked).toBeFalsy();

    await user.click(checkbox);
    expect(checkbox.checked).toBeFalsy();
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it.each`
    Name                     | Component    | props
    ${'Switch'}              | ${Switch}    | ${{onChange: onChangeSpy, 'aria-label': 'not visible'}}
  `('$Name can have a non-visible label', function ({Component, props}) {
    let {getByRole} = render(<Component {...props} />);

    let checkbox = getByRole('switch');
    expect(checkbox).toHaveAttribute('aria-label', props['aria-label']);
  });

  it.each`
    Name                     | Component    | props
    ${'Switch'}              | ${Switch}    | ${{onChange: onChangeSpy, 'aria-labelledby': 'test'}}
  `('$Name supports aria-labelledby', function ({Component, props}) {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Component {...props} />
      </>
    );

    let checkbox = getByRole('switch');
    expect(checkbox).toHaveAttribute('aria-labelledby', props['aria-labelledby']);
  });

  it.each`
    Name                     | Component    | props
    ${'Switch'}              | ${Switch}    | ${{onChange: onChangeSpy, 'aria-describedby': 'test'}}
  `('$Name supports aria-describedby', function ({Component, props}) {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Component {...props}>Hi</Component>
      </>
    );

    let checkbox = getByRole('switch');
    expect(checkbox).toHaveAttribute('aria-describedby', props['aria-describedby']);
  });

  /* This one is different, aria-hidden is getting applied to the label, not to the input, because it's the root */
  it.each`
    Name                     | Component    | props
    ${'Switch'}              | ${Switch}    | ${{onChange: onChangeSpy, 'data-testid': 'target'}}
  `('$Name supports additional props', function ({Component, props}) {
    let {getByTestId} = render(<Component {...props}>Click Me</Component>);

    let checkboxLabel = getByTestId('target');
    expect(checkboxLabel).toBeInTheDocument();
  });

  it.each`
    Name                     | Component    | props
    ${'Switch'}              | ${Switch}    | ${{onChange: onChangeSpy, excludeFromTabOrder: true}}
  `('$Name supports excludeFromTabOrder', function ({Component, props}) {
    let {getByRole} = render(<Component {...props}>Hi</Component>);

    let checkbox = getByRole('switch');
    expect(checkbox).toHaveAttribute('tabIndex', '-1');
  });

  it.each`
    Name                     | Component    | props
    ${'Switch'}              | ${Switch}    | ${{onChange: onChangeSpy, isSelected: true, isReadOnly: true}}
  `('$Name supports readOnly', async function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props}>Click Me</Component>);

    let checkbox = getByLabelText('Click Me');
    expect(checkbox.checked).toBeTruthy();

    await user.click(checkbox);
    expect(checkbox.checked).toBeTruthy();
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it('supports form reset', async () => {
    function Test() {
      let [isSelected, setSelected] = React.useState(false);
      return (
        <form>
          <Switch data-testid="switch" isSelected={isSelected} onChange={setSelected}>Switch</Switch>
          <input type="reset" data-testid="reset" />
        </form>
      );
    }

    let {getByTestId} = render(<Test />);
    let input = getByTestId('switch');

    expect(input).not.toBeChecked();
    await user.click(input);
    expect(input).toBeChecked();

    let button = getByTestId('reset');
    await user.click(button);
    expect(input).not.toBeChecked();
  });
});
