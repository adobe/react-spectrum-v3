/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, installPointerEvent, pointerMap, render, within} from '@react-spectrum/test-utils-internal';
import {DateInput, DateSegment, FieldError, Label, Text, TimeField, TimeFieldContext} from '../';
import React from 'react';
import {Time} from '@internationalized/date';
import userEvent from '@testing-library/user-event';

describe('TimeField', () => {
  installPointerEvent();

  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  it('provides slots', () => {
    let {getByRole, getAllByRole} = render(
      <TimeField data-foo="bar">
        <Label>Birth date</Label>
        <DateInput data-bar="foo">
          {segment => <DateSegment segment={segment} data-test="test" />}
        </DateInput>
        <Text slot="description">Description</Text>
        <Text slot="errorMessage">Error</Text>
      </TimeField>
    );

    let input = getByRole('group');
    expect(input.textContent.replace(' ', ' ').replace(/[\u2066-\u2069]/g, '')).toBe('––:–– AM');
    expect(input).toHaveAttribute('class', 'react-aria-DateInput');
    expect(input).toHaveAttribute('data-bar', 'foo');

    expect(input.closest('.react-aria-TimeField')).toHaveAttribute('data-foo', 'bar');

    expect(input).toHaveAttribute('aria-labelledby');
    let label = document.getElementById(input.getAttribute('aria-labelledby'));
    expect(label).toHaveAttribute('class', 'react-aria-Label');
    expect(label).toHaveTextContent('Birth date');

    expect(input).toHaveAttribute('aria-describedby');
    expect(input.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ')).toBe('Description Error');

    for (let segment of getAllByRole('spinbutton')) {
      expect(segment).toHaveAttribute('class', 'react-aria-DateSegment');
      expect(segment).toHaveAttribute('data-placeholder', 'true');
      expect(segment).toHaveAttribute('data-type');
      expect(segment).toHaveAttribute('data-test', 'test');
    }
  });

  it('supports custom class names', () => {
    let {getByRole, getAllByRole} = render(
      <TimeField className="date-field">
        <Label>Birth date</Label>
        <DateInput className="date-input">
          {segment => <DateSegment segment={segment} className={({isPlaceholder}) => `segment ${isPlaceholder ? 'placeholder' : ''}`} />}
        </DateInput>
      </TimeField>
    );

    let input = getByRole('group');
    expect(input).toHaveAttribute('class', 'date-input');
    expect(input.closest('.date-field')).toBeInTheDocument();

    for (let segment of getAllByRole('spinbutton')) {
      expect(segment).toHaveAttribute('class', 'segment placeholder');
    }
  });

  it('should support slot', () => {
    let {getByRole} = render(
      <TimeFieldContext.Provider value={{slots: {test: {'aria-label': 'test'}}}}>
        <TimeField slot="test">
          <DateInput>
            {segment => <DateSegment segment={segment} />}
          </DateInput>
        </TimeField>
      </TimeFieldContext.Provider>
    );

    let group = getByRole('group');
    expect(group.closest('.react-aria-TimeField')).toHaveAttribute('slot', 'test');
    expect(group).toHaveAttribute('aria-label', 'test');
  });

  it('should support render props', () => {
    let {getByRole} = render(
      <TimeField minValue={new Time(6, 0, 0)} defaultValue={new Time(5, 0, 0)} validationBehavior="aria">
        {({isInvalid}) => (
          <>
            <Label>Birth date</Label>
            <DateInput data-validation-state={isInvalid ? 'invalid' : null}>
              {segment => <DateSegment segment={segment} />}
            </DateInput>
          </>
        )}
      </TimeField>
    );

    let group = getByRole('group');
    expect(group).toHaveAttribute('data-validation-state', 'invalid');
  });

  it('should support form value', () => {
    render(
      <TimeField name="time" value={new Time(8, 30)}>
        <Label>Time</Label>
        <DateInput>
          {segment => <DateSegment segment={segment} />}
        </DateInput>
      </TimeField>
    );
    let input = document.querySelector('input[name=time]');
    expect(input).toHaveValue('08:30:00');
  });

  it('supports validation errors', async () => {
    let {getByRole, getByTestId} = render(
      <form data-testid="form">
        <TimeField name="date" isRequired>
          <Label>Time</Label>
          <DateInput>
            {segment => <DateSegment segment={segment} />}
          </DateInput>
          <FieldError />
        </TimeField>
      </form>
    );

    let group = getByRole('group');
    let input = document.querySelector('input[name=date]');
    expect(input).toHaveAttribute('required');
    expect(input.validity.valid).toBe(false);
    expect(group).not.toHaveAttribute('aria-describedby');

    act(() => {getByTestId('form').checkValidity();});

    expect(group).toHaveAttribute('aria-describedby');
    let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
    expect(getDescription()).toContain('Constraints not satisfied');
    expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);

    await user.keyboard('[ArrowUp][Tab][ArrowUp][Tab][ArrowUp]');

    expect(getDescription()).toContain('Constraints not satisfied');
    expect(input.validity.valid).toBe(true);

    await user.tab();

    expect(getDescription()).not.toContain('Constraints not satisfied');
  });
});
