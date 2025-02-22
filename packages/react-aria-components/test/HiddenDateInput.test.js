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

import {createCalendar, parseDate} from '@internationalized/date';
import {HiddenDateInput} from '../src/HiddenDateInput';
import {pointerMap, render} from '@react-spectrum/test-utils-internal';
import React from 'react';
import {useDateFieldState} from 'react-stately';
import {useLocale} from 'react-aria';
import userEvent from '@testing-library/user-event';

const HiddenDateInputExample = (props) => {
  let {locale} = useLocale();
  const state = useDateFieldState({
    ...props,
    locale,
    createCalendar
  });

  return (
    <HiddenDateInput
      autoComplete={props.autoComplete}
      name={props.name}
      isDisabled={props.isDisabled}
      state={props.state || state} />
  );
};

describe('<HiddenDateInput />', () => {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  it('should trigger onChange when input onchange is triggered (autofill)', async () => {
    const onChange = jest.fn();
    render(
      <HiddenDateInputExample
        onChange={onChange} />
    );

    let input = document.querySelector('input[type=date]');
    await user.type(input, '2000-05-30');
    let dateValue = parseDate('2000-05-30');
    expect(onChange).toBeCalledWith(dateValue);
  });

  it('should always add a data attribute data-a11y-ignore="aria-hidden-focus"', () => {
    let {getByTestId} = render(
      <HiddenDateInputExample autoComplete="bday" name="bday" />
    );

    expect(getByTestId('hidden-dateinput-container')).toHaveAttribute('data-a11y-ignore', 'aria-hidden-focus');
  });

  it('should always add a data attribute data-react-aria-prevent-focus', () => {
    let {getByTestId} = render(
      <HiddenDateInputExample autoComplete="bday" name="bday" />
    );

    expect(getByTestId('hidden-dateinput-container')).toHaveAttribute('data-react-aria-prevent-focus');
  });
});
