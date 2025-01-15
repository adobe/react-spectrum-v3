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

import {act, pointerMap, render} from '@react-spectrum/test-utils-internal';
import {Button, FieldError, Group, Input, Label, NumberField, NumberFieldContext, Text} from '../';
import React from 'react';
import userEvent from '@testing-library/user-event';

let TestNumberField = (props) => (
  <NumberField defaultValue={1024} minValue={0} data-foo="bar" {...props}>
    <Label>Width</Label>
    <Group {...props.groupProps}>
      <Button slot="decrement">-</Button>
      <Input />
      <Button slot="increment">+</Button>
    </Group>
    <Text slot="description">Description</Text>
    <Text slot="errorMessage">Error</Text>
  </NumberField>
);

describe('NumberField', () => {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });
  it('provides slots', () => {
    let {getByRole, getAllByRole} = render(<TestNumberField />);

    let group = getByRole('group');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute('class', 'react-aria-Group');

    expect(group.closest('.react-aria-NumberField')).toHaveAttribute('data-foo', 'bar');

    let input = getByRole('textbox');
    expect(input).toHaveValue('1,024');

    expect(input).toHaveAttribute('aria-labelledby');
    let label = document.getElementById(input.getAttribute('aria-labelledby'));
    expect(label).toHaveAttribute('class', 'react-aria-Label');
    expect(label).toHaveTextContent('Width');

    expect(input).toHaveAttribute('aria-describedby');
    expect(input.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ')).toBe('Description Error');

    let buttons = getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-label', 'Decrease');
    expect(buttons[1]).toHaveAttribute('aria-label', 'Increase');
  });

  it('should support slot', () => {
    let {getByRole} = render(
      <NumberFieldContext.Provider value={{slots: {test: {'aria-label': 'test'}}}}>
        <TestNumberField slot="test" />
      </NumberFieldContext.Provider>
    );

    let textbox = getByRole('textbox');
    expect(textbox.closest('.react-aria-NumberField')).toHaveAttribute('slot', 'test');
    expect(textbox).toHaveAttribute('aria-label', 'test');
  });

  it('should support hover state', async () => {
    let {getByRole} = render(<TestNumberField groupProps={{className: ({isHovered}) => isHovered ? 'hover' : ''}} />);
    let group = getByRole('group');

    expect(group).not.toHaveAttribute('data-hovered');
    expect(group).not.toHaveClass('hover');

    await user.hover(group);
    expect(group).toHaveAttribute('data-hovered', 'true');
    expect(group).toHaveClass('hover');

    await user.unhover(group);
    expect(group).not.toHaveAttribute('data-hovered');
    expect(group).not.toHaveClass('hover');
  });

  it('should support focus visible state', async () => {
    let {getByRole} = render(<TestNumberField groupProps={{className: ({isFocusVisible}) => isFocusVisible ? 'focus' : ''}} />);
    let group = getByRole('group');
    let input = getByRole('textbox');

    expect(group).not.toHaveAttribute('data-focus-visible');
    expect(group).not.toHaveClass('focus');

    await user.tab();
    expect(document.activeElement).toBe(input);
    expect(group).toHaveAttribute('data-focus-visible', 'true');
    expect(group).toHaveClass('focus');

    await user.tab();
    expect(group).not.toHaveAttribute('data-focus-visible');
    expect(group).not.toHaveClass('focus');
  });

  it('should support render props', () => {
    let {getByRole} = render(
      <NumberField defaultValue={1024} minValue={300} maxValue={1400}>
        {({state}) => (
          <>
            <Label>Width (min: {state.minValue}, max: {state.maxValue})</Label>
            <Group>
              <Button slot="decrement">-</Button>
              <Input />
              <Button slot="increment">+</Button>
            </Group>
          </>
        )}
      </NumberField>
    );

    let input = getByRole('textbox');
    let label = document.getElementById(input.getAttribute('aria-labelledby'));
    expect(label).toHaveTextContent('Width (min: 300, max: 1400)');
  });

  it('should support form value', () => {
    let {rerender} = render(<TestNumberField name="test" value={25} formatOptions={{style: 'currency', currency: 'USD'}} />);
    let input = document.querySelector('input[name=test]');
    expect(input).toHaveValue('25');

    rerender(<TestNumberField name="test" value={null} formatOptions={{style: 'currency', currency: 'USD'}} />);
    expect(input).toHaveValue('');
  });

  it('should render data- attributes only on the outer element', () => {
    let {getAllByTestId} = render(
      <TestNumberField data-testid="number-field" />
    );
    let outerEl = getAllByTestId('number-field');
    expect(outerEl).toHaveLength(1);
    expect(outerEl[0]).toHaveClass('react-aria-NumberField');
  });

  it('supports validation errors', async () => {
    let {getByRole, getByTestId} = render(
      <form data-testid="form">
        <NumberField isRequired>
          <Label>Width</Label>
          <Group>
            <Button slot="decrement">-</Button>
            <Input />
            <Button slot="increment">+</Button>
          </Group>
          <FieldError />
        </NumberField>
      </form>
    );

    let input = getByRole('textbox');
    let numberfield = input.closest('.react-aria-NumberField');
    expect(input).toHaveAttribute('required');
    expect(input).not.toHaveAttribute('aria-required');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input.validity.valid).toBe(false);
    expect(numberfield).not.toHaveAttribute('data-invalid');

    act(() => {getByTestId('form').checkValidity();});

    expect(input).toHaveAttribute('aria-describedby');
    expect(document.getElementById(input.getAttribute('aria-describedby'))).toHaveTextContent('Constraints not satisfied');
    expect(numberfield).toHaveAttribute('data-invalid');
    expect(document.activeElement).toBe(input);

    await user.keyboard('3');

    expect(input).toHaveAttribute('aria-describedby');
    expect(input.validity.valid).toBe(true);

    await user.tab();
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(numberfield).not.toHaveAttribute('data-invalid');
  });

  it('supports pasting value in another numbering system', async () => {
    let {getByRole, rerender} = render(<TestNumberField />);
    let input = getByRole('textbox');
    act(() => {
      input.focus();
      input.setSelectionRange(0, input.value.length);
    });
    await userEvent.paste('3.000.000,25');
    expect(input).toHaveValue('3,000,000.25');

    act(() => {
      input.setSelectionRange(0, input.value.length);
    });
    await userEvent.paste('3 000 000,25');
    expect(input).toHaveValue('3,000,000.25');

    rerender(<TestNumberField formatOptions={{style: 'currency', currency: 'USD'}} />);
    act(() => {
      input.setSelectionRange(0, input.value.length);
    });
    await userEvent.paste('3 000 000,256789');
    expect(input).toHaveValue('$3,000,000.26');

    act(() => {
      input.setSelectionRange(0, input.value.length);
    });
    await userEvent.paste('1 000');
    expect(input).toHaveValue('$1,000.00');

    act(() => {
      input.setSelectionRange(0, input.value.length);
    });

    await userEvent.paste('1,000');
    expect(input).toHaveValue('$1,000.00', 'Ambiguous value should be parsed using the current locale');

    await userEvent.paste('1.000');
    expect(input).toHaveValue('$1.00', 'Ambiguous value should be parsed using the current locale');
  });
});
