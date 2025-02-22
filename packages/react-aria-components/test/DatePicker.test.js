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

import {act, pointerMap, render, within} from '@react-spectrum/test-utils-internal';
import {Button, Calendar, CalendarCell, CalendarGrid, DateInput, DatePicker, DatePickerContext, DateSegment, Dialog, FieldError, Group, Heading, Label, Popover, Text} from 'react-aria-components';
import {CalendarDate} from '@internationalized/date';
import React from 'react';
import userEvent from '@testing-library/user-event';

let TestDatePicker = (props) => (
  <DatePicker data-foo="bar" {...props}>
    <Label>Birth date</Label>
    <Group>
      <DateInput>
        {(segment) => <DateSegment segment={segment} />}
      </DateInput>
      <Button>▼</Button>
    </Group>
    <Text slot="description">Description</Text>
    <Text slot="errorMessage">Error</Text>
    <Popover>
      <Dialog>
        <Calendar>
          <header>
            <Button slot="previous">◀</Button>
            <Heading />
            <Button slot="next">▶</Button>
          </header>
          <CalendarGrid>
            {(date) => <CalendarCell date={date} />}
          </CalendarGrid>
        </Calendar>
      </Dialog>
    </Popover>
  </DatePicker>
);

describe('DatePicker', () => {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });
  it('provides slots', async () => {
    let {getByRole, getAllByRole} = render(<TestDatePicker />);

    let group = getByRole('group');
    let input = group.querySelector('.react-aria-DateInput');
    let button = getByRole('button');
    expect(input.textContent.replace(/[\u2066-\u2069]/g, '')).toBe('mm/dd/yyyy');
    expect(button).toHaveAttribute('aria-label', 'Calendar');

    expect(input.closest('.react-aria-DatePicker')).toHaveAttribute('data-foo', 'bar');

    expect(group).toHaveAttribute('aria-labelledby');
    let label = document.getElementById(group.getAttribute('aria-labelledby'));
    expect(label).toHaveAttribute('class', 'react-aria-Label');
    expect(label).toHaveTextContent('Birth date');

    expect(group).toHaveAttribute('aria-describedby');
    expect(group.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ')).toBe('Description Error');

    for (let segment of getAllByRole('spinbutton')) {
      expect(segment).toHaveAttribute('class', 'react-aria-DateSegment');
      expect(segment).toHaveAttribute('data-placeholder', 'true');
      expect(segment).toHaveAttribute('data-type');
    }

    await user.click(button);

    let dialog = getByRole('dialog');
    expect(dialog).toHaveAttribute('class', 'react-aria-Dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog.getAttribute('aria-labelledby')).toContain(label.id);
    expect(dialog.closest('.react-aria-Popover')).toBeInTheDocument();
    expect(dialog.closest('.react-aria-Popover')).toHaveAttribute('data-trigger', 'DatePicker');

    expect(getByRole('grid')).toHaveClass('react-aria-CalendarGrid');
  });

  it('should support the slot prop', () => {
    let {getByRole} = render(
      <DatePickerContext.Provider value={{slots: {test: {'aria-label': 'test'}}}}>
        <TestDatePicker slot="test" />
      </DatePickerContext.Provider>
    );

    let group = getByRole('group');
    expect(group.closest('.react-aria-DatePicker')).toHaveAttribute('slot', 'test');
    expect(group).toHaveAttribute('aria-label', 'test');
  });

  it('should apply isPressed state to button when expanded', async () => {
    let {getByRole} = render(<TestDatePicker />);
    let button = getByRole('button');

    expect(button).not.toHaveAttribute('data-pressed');
    await user.click(button);
    expect(button).toHaveAttribute('data-pressed');
  });

  it('should support data-open state', async () => {
    let {getByRole} = render(<TestDatePicker />);
    let datePicker = document.querySelector('.react-aria-DatePicker');
    let button = getByRole('button');

    expect(datePicker).not.toHaveAttribute('data-open');
    await user.click(button);
    expect(datePicker).toHaveAttribute('data-open');
  });

  it('should support render props', () => {
    let {getByRole} = render(
      <DatePicker minValue={new CalendarDate(2023, 1, 1)} defaultValue={new CalendarDate(2020, 2, 3)} validationBehavior="aria">
        {({isInvalid}) => (
          <>
            <Label>Birth date</Label>
            <Group data-validation-state={isInvalid ? 'invalid' : null}>
              <DateInput>
                {(segment) => <DateSegment segment={segment} />}
              </DateInput>
              <Button>▼</Button>
            </Group>
            <Popover>
              <Dialog>
                <Calendar>
                  <header>
                    <Button slot="previous">◀</Button>
                    <Heading />
                    <Button slot="next">▶</Button>
                  </header>
                  <CalendarGrid>
                    {(date) => <CalendarCell date={date} />}
                  </CalendarGrid>
                </Calendar>
              </Dialog>
            </Popover>
          </>
        )}
      </DatePicker>
    );

    let group = getByRole('group');
    expect(group).toHaveAttribute('data-validation-state', 'invalid');
  });

  it('should support form value', () => {
    render(<TestDatePicker name="birthday" value={new CalendarDate(2020, 2, 3)} />);
    let input = document.querySelector('input[name=birthday]');
    expect(input).toHaveValue('2020-02-03');
  });

  it('should render data- attributes only on the outer element', () => {
    let {getAllByTestId} = render(
      <TestDatePicker data-testid="date-picker" />
    );
    let outerEl = getAllByTestId('date-picker');
    expect(outerEl).toHaveLength(1);
    expect(outerEl[0]).toHaveClass('react-aria-DatePicker');
  });

  it('supports validation errors', async () => {
    let {getByRole, getByTestId} = render(
      <form data-testid="form">
        <DatePicker name="date" isRequired>
          <Label>Birth date</Label>
          <Group>
            <DateInput>
              {(segment) => <DateSegment segment={segment} />}
            </DateInput>
            <Button>▼</Button>
          </Group>
          <FieldError />
          <Popover>
            <Dialog>
              <Calendar>
                <header>
                  <Button slot="previous">◀</Button>
                  <Heading />
                  <Button slot="next">▶</Button>
                </header>
                <CalendarGrid>
                  {(date) => <CalendarCell date={date} />}
                </CalendarGrid>
              </Calendar>
            </Dialog>
          </Popover>
        </DatePicker>
      </form>
    );

    let group = getByRole('group');
    let datepicker = group.closest('.react-aria-DatePicker');
    let input = document.querySelector('input[name=date]');
    expect(input).toHaveAttribute('required');
    expect(input.validity.valid).toBe(false);
    expect(group).not.toHaveAttribute('aria-describedby');
    expect(datepicker).not.toHaveAttribute('data-invalid');

    act(() => {getByTestId('form').checkValidity();});

    expect(group).toHaveAttribute('aria-describedby');
    let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
    expect(getDescription()).toContain('Constraints not satisfied');
    expect(datepicker).toHaveAttribute('data-invalid');
    expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);

    await user.keyboard('[ArrowUp][Tab][ArrowUp][Tab][ArrowUp]');

    expect(getDescription()).toContain('Constraints not satisfied');
    expect(input.validity.valid).toBe(true);

    await user.tab();
    expect(getDescription()).not.toContain('Constraints not satisfied');
    expect(datepicker).not.toHaveAttribute('data-invalid');
  });

  it('should support close on select = true', async () => {
    let {getByRole, getAllByRole} = render(<TestDatePicker value={new CalendarDate(2019, 2, 3)} />);

    let button = getByRole('button');

    await user.click(button);

    let dialog = getByRole('dialog');

    let cells = getAllByRole('gridcell');
    let selected = cells.find(cell => cell.getAttribute('aria-selected') === 'true');
    expect(selected.children[0]).toHaveAttribute('aria-label', 'Sunday, February 3, 2019 selected');

    await user.click(selected.nextSibling.children[0]);
    expect(dialog).not.toBeInTheDocument();
  });

  it('should support close on select = false', async () => {
    let {getByRole, getAllByRole} = render(<TestDatePicker value={new CalendarDate(2019, 2, 3)} shouldCloseOnSelect={false} />);

    let button = getByRole('button');

    await user.click(button);

    let dialog = getByRole('dialog');

    let cells = getAllByRole('gridcell');
    let selected = cells.find(cell => cell.getAttribute('aria-selected') === 'true');
    expect(selected.children[0]).toHaveAttribute('aria-label', 'Sunday, February 3, 2019 selected');

    await user.click(selected.nextSibling.children[0]);
    expect(dialog).toBeInTheDocument();
  });

  it('should disable button and date input when DatePicker is disabled', () => {
    let {getByRole} = render(<TestDatePicker isDisabled />);

    let button = getByRole('button');
    expect(button).toBeDisabled();

    let group = getByRole('group');
    expect(group).toHaveAttribute('aria-disabled', 'true');

    let spinbuttons = within(group).getAllByRole('spinbutton');
    for (let spinbutton of spinbuttons) {
      expect(spinbutton).toHaveAttribute('aria-disabled', 'true');
    }

    let hiddenInput = getByRole('textbox', {hidden: true});
    expect(hiddenInput).toHaveAttribute('disabled');
  });

  it('should support autofill', async() => {
    let {getByRole} = render(<TestDatePicker />);

    let hiddenDateInput = document.querySelector('input[type=date]');
    await user.type(hiddenDateInput, '2000-05-30');
    let group = getByRole('group');
    let input = group.querySelector('.react-aria-DateInput');
    expect(input).toHaveTextContent('5/30/2000');
  });
});
