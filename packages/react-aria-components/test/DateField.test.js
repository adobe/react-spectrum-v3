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
import {CalendarDate} from '@internationalized/date';
import {DateField, DateFieldContext, DateInput, DateSegment, FieldError, Label, Text} from '../';
import React from 'react';
import userEvent from '@testing-library/user-event';

describe('DateField', () => {
  installPointerEvent();

  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  it('provides slots', () => {
    let {getByRole, getAllByRole} = render(
      <DateField data-foo="bar">
        <Label>Birth date</Label>
        <DateInput data-bar="foo">
          {segment => <DateSegment segment={segment} data-test="test" />}
        </DateInput>
        <Text slot="description">Description</Text>
        <Text slot="errorMessage">Error</Text>
      </DateField>
    );

    let input = getByRole('group');
    expect(input).toHaveTextContent('mm/dd/yyyy');
    expect(input).toHaveAttribute('class', 'react-aria-DateInput');
    expect(input).toHaveAttribute('data-bar', 'foo');

    expect(input.closest('.react-aria-DateField')).toHaveAttribute('data-foo', 'bar');

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
      <DateField className="date-field">
        <Label>Birth date</Label>
        <DateInput className="date-input">
          {segment => <DateSegment segment={segment} className={({isPlaceholder}) => `segment ${isPlaceholder ? 'placeholder' : ''}`} />}
        </DateInput>
      </DateField>
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
      <DateFieldContext.Provider value={{slots: {test: {'aria-label': 'test'}}}}>
        <DateField slot="test">
          <DateInput>
            {segment => <DateSegment segment={segment} />}
          </DateInput>
        </DateField>
      </DateFieldContext.Provider>
    );

    let group = getByRole('group');
    expect(group.closest('.react-aria-DateField')).toHaveAttribute('slot', 'test');
    expect(group).toHaveAttribute('aria-label', 'test');
  });

  it('should support hover state', async () => {
    let hoverStartSpy = jest.fn();
    let hoverChangeSpy = jest.fn();
    let hoverEndSpy = jest.fn();
    let {getByRole} = render(
      <DateField>
        <Label>Birth date</Label>
        <DateInput className={({isHovered}) => isHovered ? 'hover' : ''}>
          {segment => <DateSegment segment={segment} className={({isHovered}) => isHovered ? 'hover' : ''} onHoverStart={hoverStartSpy} onHoverChange={hoverChangeSpy} onHoverEnd={hoverEndSpy} />}
        </DateInput>
      </DateField>
    );
    let group = getByRole('group');

    expect(group).not.toHaveAttribute('data-hovered');
    expect(group).not.toHaveClass('hover');

    await user.hover(group);
    expect(group).toHaveAttribute('data-hovered', 'true');
    expect(group).toHaveClass('hover');

    await user.unhover(group);
    expect(group).not.toHaveAttribute('data-hovered');
    expect(group).not.toHaveClass('hover');

    let segments = within(group).getAllByRole('spinbutton');
    await user.hover(segments[0]);
    expect(segments[0]).toHaveAttribute('data-hovered', 'true');
    expect(segments[0]).toHaveClass('hover');
    expect(hoverStartSpy).toHaveBeenCalledTimes(1);
    expect(hoverChangeSpy).toHaveBeenCalledTimes(1);

    await user.unhover(segments[0]);
    expect(segments[0]).not.toHaveAttribute('data-hovered', 'true');
    expect(segments[0]).not.toHaveClass('hover');
    expect(hoverEndSpy).toHaveBeenCalledTimes(1);
    expect(hoverChangeSpy).toHaveBeenCalledTimes(2);
  });

  it('should support focus visible state', async () => {
    let {getByRole} = render(
      <DateField>
        <Label>Birth date</Label>
        <DateInput className={({isFocusVisible}) => isFocusVisible ? 'focus' : ''}>
          {segment => <DateSegment segment={segment} className={({isFocusVisible}) => isFocusVisible ? 'focus' : ''} />}
        </DateInput>
      </DateField>
    );
    let group = getByRole('group');

    expect(group).not.toHaveAttribute('data-focus-visible');
    expect(group).not.toHaveClass('focus');

    await user.tab();
    expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);
    expect(group).toHaveAttribute('data-focus-visible', 'true');
    expect(group).toHaveClass('focus');

    let segments = within(group).getAllByRole('spinbutton');
    expect(segments[0]).toHaveAttribute('data-focus-visible', 'true');
    expect(segments[0]).toHaveClass('focus');

    await user.tab({shift: true});
    expect(group).not.toHaveAttribute('data-focus-visible');
    expect(group).not.toHaveClass('focus');
    expect(segments[0]).not.toHaveAttribute('data-focus-visible', 'true');
    expect(segments[0]).not.toHaveClass('focus');
  });

  it('should support disabled state', () => {
    let {getByRole} = render(
      <DateField isDisabled>
        <Label>Birth date</Label>
        <DateInput className={({isDisabled}) => isDisabled ? 'disabled' : ''}>
          {segment => <DateSegment segment={segment} />}
        </DateInput>
      </DateField>
    );
    let group = getByRole('group');
    expect(group).toHaveAttribute('data-disabled');
    expect(group).toHaveClass('disabled');
  });

  it('should support render props', () => {
    let {getByRole} = render(
      <DateField minValue={new CalendarDate(2023, 1, 1)} defaultValue={new CalendarDate(2020, 2, 3)} validationBehavior="aria">
        {({isInvalid}) => (
          <>
            <Label>Birth date</Label>
            <DateInput data-validation-state={isInvalid ? 'invalid' : null}>
              {segment => <DateSegment segment={segment} />}
            </DateInput>
          </>
        )}
      </DateField>
    );
    let group = getByRole('group');
    expect(group).toHaveAttribute('data-validation-state', 'invalid');
  });

  it('should support form value', () => {
    render(
      <DateField name="birthday" value={new CalendarDate(2020, 2, 3)}>
        <Label>Birth date</Label>
        <DateInput>
          {segment => <DateSegment segment={segment} />}
        </DateInput>
      </DateField>
    );
    let input = document.querySelector('input[name=birthday]');
    expect(input).toHaveValue('2020-02-03');
  });

  it('should render data- attributes only on the outer element', () => {
    let {getAllByTestId} = render(
      <DateField data-testid="date-field">
        <Label>Birth Date</Label>
        <DateInput>
          {segment => <DateSegment segment={segment} />}
        </DateInput>
      </DateField>
    );
    let outerEl = getAllByTestId('date-field');
    expect(outerEl).toHaveLength(1);
    expect(outerEl[0]).toHaveClass('react-aria-DateField');
  });

  it('supports validation errors', async () => {
    let {getByRole, getByTestId} = render(
      <form data-testid="form">
        <DateField name="date" isRequired>
          <Label>Birth Date</Label>
          <DateInput>
            {segment => <DateSegment segment={segment} />}
          </DateInput>
          <FieldError />
        </DateField>
      </form>
    );

    let group = getByRole('group');
    let input = document.querySelector('input[name=date]');
    expect(input).toHaveAttribute('required');
    expect(input.validity.valid).toBe(false);
    expect(group).not.toHaveAttribute('aria-describedby');
    expect(group).not.toHaveAttribute('data-invalid');

    act(() => {getByTestId('form').checkValidity();});

    expect(group).toHaveAttribute('aria-describedby');
    let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
    expect(getDescription()).toContain('Constraints not satisfied');
    expect(group).toHaveAttribute('data-invalid');
    expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);

    await user.keyboard('[ArrowUp][Tab][ArrowUp][Tab][ArrowUp]');

    expect(getDescription()).toContain('Constraints not satisfied');
    expect(input.validity.valid).toBe(true);

    await user.tab();
    expect(getDescription()).not.toContain('Constraints not satisfied');
    expect(group).not.toHaveAttribute('data-invalid');
  });

  it('should use controlled validation first', async () => {
    let {getByRole, getByTestId} = render(
      <form data-testid="form">
        <DateField name="date" isRequired isInvalid={false}>
          <Label>Birth Date</Label>
          <DateInput>
            {segment => <DateSegment segment={segment} />}
          </DateInput>
          <FieldError />
        </DateField>
      </form>
    );

    let group = getByRole('group');
    let input = document.querySelector('input[name=date]');
    expect(input).toHaveAttribute('required');
    expect(input.validity.valid).toBe(false);
    expect(group).not.toHaveAttribute('aria-describedby');
    expect(group).not.toHaveAttribute('data-invalid');

    act(() => {getByTestId('form').checkValidity();});

    expect(input.validity.valid).toBe(false);
    expect(group).not.toHaveAttribute('aria-describedby');
    expect(group).not.toHaveAttribute('data-invalid');
  });

  it('should focus previous segment when backspacing on an empty date segment', async () => {
    let {getAllByRole} = render(
      <DateField defaultValue={new CalendarDate(2024, 12, 31)}>
        <Label>Birth date</Label>
        <DateInput>
          {segment => <DateSegment segment={segment} />}
        </DateInput>
      </DateField>
    );
  
    let segments = getAllByRole('spinbutton');
    await user.click(segments[2]);
    expect(document.activeElement).toBe(segments[2]);

    // Press backspace to delete '2024'
    for (let i = 0; i < 4; i++) {
      await user.keyboard('{backspace}');
    }
    expect(document.activeElement).toBe(segments[2]);
    await user.keyboard('{backspace}');
    expect(document.activeElement).toBe(segments[1]);

    // Press backspace to delete '31'
    for (let i = 0; i < 2; i++) {
      await user.keyboard('{backspace}');
    }
    expect(document.activeElement).toBe(segments[1]);
    await user.keyboard('{backspace}');
    expect(document.activeElement).toBe(segments[0]);
  });

  it('should support autofill', async() => {
    let {getByRole} = render(
      <DateField>
        <Label>Birth date</Label>
        <DateInput>
          {segment => <DateSegment segment={segment} />}
        </DateInput>
      </DateField>
    );

    let hiddenDateInput = document.querySelector('input[type=date]');
    await user.type(hiddenDateInput, '2000-05-30');
    let input = getByRole('group');
    expect(input).toHaveTextContent('5/30/2000');
  });
});
