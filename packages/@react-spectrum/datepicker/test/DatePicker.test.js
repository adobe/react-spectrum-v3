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

import {act, fireEvent, pointerMap, render as render_, waitFor, within} from '@react-spectrum/test-utils-internal';
import {Button} from '@react-spectrum/button';
import {CalendarDate, CalendarDateTime, DateFormatter, EthiopicCalendar, getLocalTimeZone, JapaneseCalendar, parseZonedDateTime, toCalendarDateTime, today} from '@internationalized/date';
import {DatePicker} from '../';
import {Form} from '@react-spectrum/form';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

function beforeInput(target, key) {
  // JSDOM doesn't support the beforeinput event
  let e = new InputEvent('beforeinput', {cancelable: true, data: key, inputType: 'insertText'});
  fireEvent(target, e);
}

function getTextValue(el) {
  if (el.className?.includes?.('DatePicker-placeholder') && !el.parentElement.className.includes('is-placeholder')) {
    return '';
  }

  return el.textContent.replace(/[\u2066-\u2069]/g, '');
}

function expectPlaceholder(el, placeholder) {
  expect(getTextValue(el).replace(' ', ' ')).toBe(placeholder);
}

function render(el) {
  if (el.type === Provider) {
    return render_(el);
  }
  let res = render_(
    <Provider theme={theme}>
      {el}
    </Provider>
  );
  return {
    ...res,
    rerender(el) {
      return res.rerender(<Provider theme={theme}>{el}</Provider>);
    }
  };
}

describe('DatePicker', function () {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-08-20T08:00:00Z'));
  });
  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
  });
  describe('basics', function () {
    it('should render a datepicker with a specified date', function () {
      let {getAllByRole} = render(<DatePicker label="Date" value={new CalendarDate(2019, 2, 3)} />);

      let combobox = getAllByRole('group')[0];
      expect(combobox).toBeVisible();
      expect(combobox).not.toHaveAttribute('aria-disabled');
      expect(combobox).not.toHaveAttribute('aria-invalid');

      let segments = getAllByRole('spinbutton');
      expect(segments.length).toBe(3);

      expect(getTextValue(segments[0])).toBe('2');
      expect(segments[0].getAttribute('aria-label')).toBe('month, ');
      expect(segments[0].getAttribute('aria-valuenow')).toBe('2');
      expect(segments[0].getAttribute('aria-valuetext')).toBe('2 – February');
      expect(segments[0].getAttribute('aria-valuemin')).toBe('1');
      expect(segments[0].getAttribute('aria-valuemax')).toBe('12');

      expect(getTextValue(segments[1])).toBe('3');
      expect(segments[1].getAttribute('aria-label')).toBe('day, ');
      expect(segments[1].getAttribute('aria-valuenow')).toBe('3');
      expect(segments[1].getAttribute('aria-valuetext')).toBe('3');
      expect(segments[1].getAttribute('aria-valuemin')).toBe('1');
      expect(segments[1].getAttribute('aria-valuemax')).toBe('28');

      expect(getTextValue(segments[2])).toBe('2019');
      expect(segments[2].getAttribute('aria-label')).toBe('year, ');
      expect(segments[2].getAttribute('aria-valuenow')).toBe('2019');
      expect(segments[2].getAttribute('aria-valuetext')).toBe('2019');
      expect(segments[2].getAttribute('aria-valuemin')).toBe('1');
      expect(segments[2].getAttribute('aria-valuemax')).toBe('9999');
    });

    it('should render a datepicker with granularity="second"', function () {
      let {getAllByRole} = render(<DatePicker label="Date" value={new CalendarDateTime(2019, 2, 3)} granularity="second" />);

      let combobox = getAllByRole('group')[0];
      expect(combobox).toBeVisible();
      expect(combobox).not.toHaveAttribute('aria-disabled');
      expect(combobox).not.toHaveAttribute('aria-invalid');

      let segments = getAllByRole('spinbutton');
      expect(segments.length).toBe(7);

      expect(getTextValue(segments[0])).toBe('2');
      expect(segments[0].getAttribute('aria-label')).toBe('month, ');
      expect(segments[0].getAttribute('aria-valuenow')).toBe('2');
      expect(segments[0].getAttribute('aria-valuetext')).toBe('2 – February');
      expect(segments[0].getAttribute('aria-valuemin')).toBe('1');
      expect(segments[0].getAttribute('aria-valuemax')).toBe('12');

      expect(getTextValue(segments[1])).toBe('3');
      expect(segments[1].getAttribute('aria-label')).toBe('day, ');
      expect(segments[1].getAttribute('aria-valuenow')).toBe('3');
      expect(segments[1].getAttribute('aria-valuetext')).toBe('3');
      expect(segments[1].getAttribute('aria-valuemin')).toBe('1');
      expect(segments[1].getAttribute('aria-valuemax')).toBe('28');

      expect(getTextValue(segments[2])).toBe('2019');
      expect(segments[2].getAttribute('aria-label')).toBe('year, ');
      expect(segments[2].getAttribute('aria-valuenow')).toBe('2019');
      expect(segments[2].getAttribute('aria-valuetext')).toBe('2019');
      expect(segments[2].getAttribute('aria-valuemin')).toBe('1');
      expect(segments[2].getAttribute('aria-valuemax')).toBe('9999');

      expect(getTextValue(segments[3])).toBe('12');
      expect(segments[3].getAttribute('aria-label')).toBe('hour, ');
      expect(segments[3].getAttribute('aria-valuenow')).toBe('0');
      expect(segments[3].getAttribute('aria-valuetext')).toBe('12 AM');
      expect(segments[3].getAttribute('aria-valuemin')).toBe('0');
      expect(segments[3].getAttribute('aria-valuemax')).toBe('11');

      expect(getTextValue(segments[4])).toBe('00');
      expect(segments[4].getAttribute('aria-label')).toBe('minute, ');
      expect(segments[4].getAttribute('aria-valuenow')).toBe('0');
      expect(segments[4].getAttribute('aria-valuetext')).toBe('00');
      expect(segments[4].getAttribute('aria-valuemin')).toBe('0');
      expect(segments[4].getAttribute('aria-valuemax')).toBe('59');

      expect(getTextValue(segments[5])).toBe('00');
      expect(segments[5].getAttribute('aria-label')).toBe('second, ');
      expect(segments[5].getAttribute('aria-valuenow')).toBe('0');
      expect(segments[5].getAttribute('aria-valuetext')).toBe('00');
      expect(segments[5].getAttribute('aria-valuemin')).toBe('0');
      expect(segments[5].getAttribute('aria-valuemax')).toBe('59');

      expect(getTextValue(segments[6])).toBe('AM');
      expect(segments[6].getAttribute('aria-label')).toBe('AM/PM, ');
      expect(segments[6].getAttribute('aria-valuetext')).toBe('AM');
    });

    it('should support focusing via a ref', function () {
      let ref = React.createRef();
      let {getAllByRole} = render(<DatePicker label="Date" ref={ref} />);
      expect(ref.current).toHaveProperty('focus');

      act(() => ref.current.focus());
      expect(document.activeElement).toBe(getAllByRole('spinbutton')[0]);
    });

    it('should support autoFocus', function () {
      let {getAllByRole} = render(<DatePicker label="Date" autoFocus />);
      expect(document.activeElement).toBe(getAllByRole('spinbutton')[0]);
    });

    it('should pass through data attributes', function () {
      let {getByTestId} = render(<DatePicker label="Date" data-testid="foo" />);
      expect(getByTestId('foo')).toHaveAttribute('role', 'group');
    });

    it('should return the outer most DOM element from the ref', function () {
      let ref = React.createRef();
      render(<DatePicker label="Date" ref={ref} />);
      expect(ref.current).toHaveProperty('UNSAFE_getDOMNode');

      let wrapper = ref.current.UNSAFE_getDOMNode();
      expect(wrapper).toBeInTheDocument();
      expect(within(wrapper).getByText('Date')).toBeInTheDocument();
      expect(within(wrapper).getAllByRole('spinbutton')[0]).toBeInTheDocument();
    });
  });

  describe('events', function () {
    let onBlurSpy = jest.fn();
    let onFocusChangeSpy = jest.fn();
    let onFocusSpy = jest.fn();
    let onKeyDownSpy = jest.fn();
    let onKeyUpSpy = jest.fn();

    afterEach(() => {
      onBlurSpy.mockClear();
      onFocusChangeSpy.mockClear();
      onFocusSpy.mockClear();
      onKeyDownSpy.mockClear();
      onKeyUpSpy.mockClear();
    });

    it('should focus field, move a segment, and open popover and does not blur', async function () {
      let {getByRole, getAllByRole} = render(<DatePicker label="Date" onBlur={onBlurSpy} onFocus={onFocusSpy} onFocusChange={onFocusChangeSpy} />);
      let segments = getAllByRole('spinbutton');
      let button = getByRole('button');

      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).not.toHaveBeenCalled();
      expect(onFocusSpy).not.toHaveBeenCalled();

      await user.tab();
      expect(segments[0]).toHaveFocus();
      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(1);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);

      await user.tab();
      expect(segments[1]).toHaveFocus();
      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(1);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);

      await user.click(button);
      act(() => jest.runAllTimers());

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();
      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(1);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);
    });

    it('should focus field and leave to blur', async function () {
      let {getAllByRole} = render(<DatePicker label="Date" onBlur={onBlurSpy} onFocus={onFocusSpy} onFocusChange={onFocusChangeSpy} />);
      let segments = getAllByRole('spinbutton');

      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).not.toHaveBeenCalled();
      expect(onFocusSpy).not.toHaveBeenCalled();

      await user.tab();
      expect(segments[0]).toHaveFocus();
      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(1);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);

      await user.click(document.body);
      expect(document.body).toHaveFocus();
      expect(onBlurSpy).toHaveBeenCalledTimes(1);
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(2);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);
    });

    it('should open popover and call picker onFocus', async function () {
      let {getByRole} = render(<DatePicker label="Date" onBlur={onBlurSpy} onFocus={onFocusSpy} onFocusChange={onFocusChangeSpy} />);
      let button = getByRole('button');

      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).not.toHaveBeenCalled();
      expect(onFocusSpy).not.toHaveBeenCalled();

      await user.click(button);
      act(() => jest.runAllTimers());

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();
      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(1);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);
    });

    it('should open and close popover and only call blur when focus leaves picker', async function () {
      let {getByRole} = render(<DatePicker label="Date" onBlur={onBlurSpy} onFocus={onFocusSpy} onFocusChange={onFocusChangeSpy} />);
      let button = getByRole('button');

      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).not.toHaveBeenCalled();
      expect(onFocusSpy).not.toHaveBeenCalled();

      await user.click(button);
      act(() => jest.runAllTimers());

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();
      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(1);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);

      await user.keyboard('{Escape}');
      act(() => jest.runAllTimers());

      await waitFor(() => {
        expect(dialog).not.toBeInTheDocument();
      }); // wait for animation

      // now that it's been unmounted, run the raf callback
      act(() => {
        jest.runAllTimers();
      });

      expect(dialog).not.toBeInTheDocument();
      expect(document.activeElement).toBe(button);
      expect(button).toHaveFocus();
      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(1);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);

      await user.tab();
      expect(document.body).toHaveFocus();
      expect(onBlurSpy).toHaveBeenCalledTimes(1);
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(2);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);
    });

    it('should trigger right arrow key event for segment navigation', async function () {
      let {getAllByRole} = render(<DatePicker label="Date" onKeyDown={onKeyDownSpy} onKeyUp={onKeyUpSpy} />);
      let segments = getAllByRole('spinbutton');

      expect(onKeyDownSpy).not.toHaveBeenCalled();
      expect(onKeyUpSpy).not.toHaveBeenCalled();

      await user.tab();
      expect(segments[0]).toHaveFocus();
      expect(onKeyDownSpy).not.toHaveBeenCalled();
      expect(onKeyUpSpy).toHaveBeenCalledTimes(1);

      await user.keyboard('{ArrowRight}');
      expect(segments[1]).toHaveFocus();
      expect(onKeyDownSpy).toHaveBeenCalledTimes(1);
      expect(onKeyUpSpy).toHaveBeenCalledTimes(2);
    });

    it('should trigger key event in popover and focus/blur/key events are not called', async function () {
      let {getByRole} = render(<DatePicker label="Date" onBlur={onBlurSpy} onFocus={onFocusSpy} onFocusChange={onFocusChangeSpy} onKeyDown={onKeyDownSpy} onKeyUp={onKeyUpSpy} />);
      let button = getByRole('button');

      expect(onKeyDownSpy).not.toHaveBeenCalled();
      expect(onKeyUpSpy).not.toHaveBeenCalled();
      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).not.toHaveBeenCalled();
      expect(onFocusSpy).not.toHaveBeenCalled();

      await user.click(button);

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();
      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(1);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);

      await user.keyboard('{ArrowRight}');
      expect(onKeyDownSpy).toHaveBeenCalledTimes(0);
      expect(onKeyUpSpy).toHaveBeenCalledTimes(0);
      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(1);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('calendar popover', function () {
    it('should emit onChange when selecting a date in the calendar in controlled mode', async function () {
      let onChange = jest.fn();
      let {getByRole, getAllByRole, queryByLabelText} = render(
        <Provider theme={theme}>
          <DatePicker label="Date" value={new CalendarDate(2019, 2, 3)} onChange={onChange} />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      expect(getTextValue(combobox)).toBe('2/3/2019');

      let button = getByRole('button');
      await user.click(button);

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();

      expect(queryByLabelText('Time')).toBeNull();

      let cells = getAllByRole('gridcell');
      let selected = cells.find(cell => cell.getAttribute('aria-selected') === 'true');
      expect(selected.children[0]).toHaveAttribute('aria-label', 'Sunday, February 3, 2019 selected');

      await user.click(selected.nextSibling.children[0]);

      await waitFor(() => {
        expect(dialog).not.toBeInTheDocument();
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(new CalendarDate(2019, 2, 4));
      expect(getTextValue(combobox)).toBe('2/3/2019'); // controlled
    });

    it('should emit onChange when selecting a date in the calendar in uncontrolled mode', async function () {
      let onChange = jest.fn();
      let {getByRole, getAllByRole} = render(
        <Provider theme={theme}>
          <DatePicker label="Date" defaultValue={new CalendarDate(2019, 2, 3)} onChange={onChange} />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      expect(getTextValue(combobox)).toBe('2/3/2019');

      let button = getByRole('button');
      await user.click(button);

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();

      let cells = getAllByRole('gridcell');
      let selected = cells.find(cell => cell.getAttribute('aria-selected') === 'true');
      expect(selected.children[0]).toHaveAttribute('aria-label', 'Sunday, February 3, 2019 selected');

      await user.click(selected.nextSibling.children[0]);

      await waitFor(() => {
        expect(dialog).not.toBeInTheDocument();
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(new CalendarDate(2019, 2, 4));
      expect(getTextValue(combobox)).toBe('2/4/2019'); // uncontrolled
    });

    it('should display a time field when a CalendarDateTime value is used', async function () {
      let onChange = jest.fn();
      let {getByRole, getAllByRole, getAllByLabelText} = render(
        <Provider theme={theme}>
          <DatePicker label="Date" defaultValue={new CalendarDateTime(2019, 2, 3, 8, 45)} onChange={onChange} />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      expect(getTextValue(combobox)).toBe('2/3/2019, 8:45 AM');

      let button = getByRole('button');
      await user.click(button);

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();

      let cells = getAllByRole('gridcell');
      let selected = cells.find(cell => cell.getAttribute('aria-selected') === 'true');
      expect(selected.children[0]).toHaveAttribute('aria-label', 'Sunday, February 3, 2019 selected');

      let timeField = getAllByLabelText('Time')[0];
      expect(getTextValue(timeField)).toBe('8:45 AM');

      // selecting a date should not close the popover
      await user.click(selected.nextSibling.children[0]);

      expect(dialog).toBeVisible();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(new CalendarDateTime(2019, 2, 4, 8, 45));
      expect(getTextValue(combobox)).toBe('2/4/2019, 8:45 AM');

      let hour = within(timeField).getByLabelText('hour,');
      expect(hour).toHaveAttribute('role', 'spinbutton');
      expect(hour).toHaveAttribute('aria-valuetext', '8 AM');

      act(() => hour.focus());
      await user.keyboard('{ArrowUp}');

      expect(hour).toHaveAttribute('aria-valuetext', '9 AM');

      expect(dialog).toBeVisible();
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenCalledWith(new CalendarDateTime(2019, 2, 4, 9, 45));
      expect(getTextValue(combobox)).toBe('2/4/2019, 9:45 AM');
    });

    it('should not throw error when deleting values from time field when CalendarDateTime value is used', async function () {
      let onChange = jest.fn();
      let {getByRole, getAllByRole, getAllByLabelText} = render(
        <Provider theme={theme}>
          <DatePicker label="Date" defaultValue={new CalendarDateTime(2019, 2, 3, 10, 45)} onChange={onChange} />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      expect(getTextValue(combobox)).toBe('2/3/2019, 10:45 AM');

      let button = getByRole('button');
      await user.click(button);

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();

      let cells = getAllByRole('gridcell');
      let selected = cells.find(cell => cell.getAttribute('aria-selected') === 'true');
      expect(selected.children[0]).toHaveAttribute('aria-label', 'Sunday, February 3, 2019 selected');

      let timeField = getAllByLabelText('Time')[0];
      expect(getTextValue(timeField)).toBe('10:45 AM');

      // selecting a date should not close the popover
      await user.click(selected.nextSibling.children[0]);

      expect(dialog).toBeVisible();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(new CalendarDateTime(2019, 2, 4, 10, 45));
      expect(getTextValue(combobox)).toBe('2/4/2019, 10:45 AM');

      let hour = within(timeField).getByLabelText('hour,');
      expect(hour).toHaveAttribute('role', 'spinbutton');
      expect(hour).toHaveAttribute('aria-valuetext', '10 AM');

      act(() => hour.focus());
      await user.keyboard('{Backspace}');
      expect(hour).toHaveAttribute('aria-valuetext', '1 AM');

      await user.keyboard('{Backspace}');
      expect(hour).toHaveAttribute('aria-valuetext', '1 AM');

      expect(dialog).toBeVisible();
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenCalledWith(new CalendarDateTime(2019, 2, 4, 1, 45));
      expect(getTextValue(combobox)).toBe('2/4/2019, 1:45 AM');
    });

    it('should fire onChange until both date and time are selected', async function () {
      let onChange = jest.fn();
      let {getByRole, getAllByRole, getAllByLabelText} = render(
        <Provider theme={theme}>
          <DatePicker label="Date" granularity="minute" onChange={onChange} />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      let formatter = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'});
      expectPlaceholder(combobox, 'mm/dd/yyyy, ––:–– AM');

      let button = getByRole('button');
      await user.click(button);

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();

      let cells = getAllByRole('gridcell');
      let selected = cells.find(cell => cell.getAttribute('aria-selected') === 'true');
      expect(selected).toBeUndefined();

      let timeField = getAllByLabelText('Time')[0];
      expectPlaceholder(timeField, '––:–– AM');

      // selecting a date should not close the popover
      let todayCell = cells.find(cell => cell.firstChild.getAttribute('aria-label')?.startsWith('Today'));
      await user.click(todayCell.firstChild);

      expect(todayCell).toHaveAttribute('aria-selected', 'true');

      expect(dialog).toBeVisible();
      expect(onChange).not.toHaveBeenCalled();
      expectPlaceholder(combobox, 'mm/dd/yyyy, ––:–– AM');

      let hour = within(timeField).getByLabelText('hour,');
      expect(hour).toHaveAttribute('role', 'spinbutton');
      expect(hour).toHaveAttribute('aria-valuetext', 'Empty');

      act(() => hour.focus());
      await user.keyboard('{ArrowUp}');

      expect(hour).toHaveAttribute('aria-valuetext', '12 AM');

      expect(onChange).not.toHaveBeenCalled();
      expectPlaceholder(combobox, 'mm/dd/yyyy, ––:–– AM');

      await user.keyboard('{ArrowRight}');

      expect(document.activeElement).toHaveAttribute('aria-label', 'minute, ');
      expect(document.activeElement).toHaveAttribute('aria-valuetext', 'Empty');
      await user.keyboard('{ArrowUp}');

      expect(document.activeElement).toHaveAttribute('aria-valuetext', '00');

      expect(onChange).toHaveBeenCalledTimes(1);
      let parts = formatter.formatToParts(today(getLocalTimeZone()).toDate(getLocalTimeZone()));
      let month = parts.find(p => p.type === 'month').value;
      let day = parts.find(p => p.type === 'day').value;
      let year = parts.find(p => p.type === 'year').value;

      expectPlaceholder(combobox, `${month}/${day}/${year}, 12:00 AM`);

      await user.keyboard('{ArrowRight}');

      expect(document.activeElement).toHaveAttribute('aria-label', 'AM/PM, ');
      expect(document.activeElement).toHaveAttribute('aria-valuetext', 'AM');

      expect(dialog).toBeVisible();
      expect(onChange).toHaveBeenCalledTimes(1);
      let value = toCalendarDateTime(today(getLocalTimeZone()));
      expect(onChange).toHaveBeenCalledWith(value);
      expectPlaceholder(combobox, formatter.format(value.toDate(getLocalTimeZone())));
    });

    it('should confirm time placeholder on blur if date is selected', async function () {
      let onChange = jest.fn();
      let {getByRole, getAllByRole} = render(
        <Provider theme={theme}>
          <DatePicker label="Date" granularity="minute" onChange={onChange} />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      let formatter = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'});
      expectPlaceholder(combobox, 'mm/dd/yyyy, ––:–– AM');

      let button = getByRole('button');
      await user.click(button);
      act(() => jest.runAllTimers());

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();

      let cells = getAllByRole('gridcell');
      let todayCell = cells.find(cell => cell.firstChild.getAttribute('aria-label')?.startsWith('Today'));
      await user.click(todayCell.firstChild);
      expect(todayCell).toHaveAttribute('aria-selected', 'true');
      expect(onChange).not.toHaveBeenCalled();

      await user.click(document.body);
      act(() => jest.runAllTimers());

      expect(dialog).not.toBeInTheDocument();

      expect(onChange).toHaveBeenCalledTimes(1);
      let value = toCalendarDateTime(today(getLocalTimeZone()));
      expect(onChange).toHaveBeenCalledWith(value);
      expectPlaceholder(combobox, formatter.format(value.toDate(getLocalTimeZone())));
    });

    it('should not confirm on blur if date is not selected', async function () {
      let onChange = jest.fn();
      let {getByRole, getAllByRole, getAllByLabelText} = render(
        <Provider theme={theme}>
          <DatePicker label="Date" granularity="minute" onChange={onChange} />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      expectPlaceholder(combobox, 'mm/dd/yyyy, ––:–– AM');

      let button = getByRole('button');
      await user.click(button);
      act(() => jest.runAllTimers());

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();

      let timeField = getAllByLabelText('Time')[0];
      expectPlaceholder(timeField, '––:–– AM');

      let hour = within(timeField).getByLabelText('hour,');
      expect(hour).toHaveAttribute('role', 'spinbutton');
      expect(hour).toHaveAttribute('aria-valuetext', 'Empty');

      act(() => hour.focus());
      await user.keyboard('{ArrowUp}');

      expect(hour).toHaveAttribute('aria-valuetext', '12 AM');

      await user.click(document.body);
      act(() => jest.runAllTimers());

      expect(dialog).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should confirm valid date time on dialog close', async function () {
      let onChange = jest.fn();
      let {getByRole, getAllByRole, getAllByLabelText} = render(
        <Provider theme={theme}>
          <DatePicker label="Date" granularity="minute" onChange={onChange} />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      expectPlaceholder(combobox, 'mm/dd/yyyy, ––:–– AM');

      let button = getByRole('button');
      await user.click(button);
      act(() => jest.runAllTimers());

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();

      let cells = getAllByRole('gridcell');
      let todayCell = cells.find(cell => cell.firstChild.getAttribute('aria-label')?.startsWith('Today'));
      await user.click(todayCell.firstChild);
      expect(todayCell).toHaveAttribute('aria-selected', 'true');
      expect(onChange).not.toHaveBeenCalled();

      let timeField = getAllByLabelText('Time')[0];
      expectPlaceholder(timeField, '––:–– AM');

      let hour = within(timeField).getByLabelText('hour,');
      expect(hour).toHaveAttribute('role', 'spinbutton');
      expect(hour).toHaveAttribute('aria-valuetext', 'Empty');

      act(() => hour.focus());
      await user.keyboard('{ArrowUp}');

      expect(hour).toHaveAttribute('aria-valuetext', '12 AM');

      let minute = within(timeField).getByLabelText('minute,');
      expect(minute).toHaveAttribute('role', 'spinbutton');
      expect(minute).toHaveAttribute('aria-valuetext', 'Empty');

      act(() => minute.focus());
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowUp}');

      expect(minute).toHaveAttribute('aria-valuetext', '01');

      await user.click(document.body);
      act(() => jest.runAllTimers());

      expect(dialog).not.toBeInTheDocument();
      expect(onChange).toHaveBeenCalledTimes(2);
      let formatter = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: 'numeric', day: 'numeric'});
      let parts = formatter.formatToParts(today(getLocalTimeZone()).toDate(getLocalTimeZone()));
      let month = parts.find(p => p.type === 'month').value;
      let day = parts.find(p => p.type === 'day').value;
      let year = parts.find(p => p.type === 'year').value;
      expectPlaceholder(combobox, `${month}/${day}/${year}, 12:01 AM`);
    });

    it('should clear date and time when controlled value is set to null', async function () {
      function ControlledDatePicker() {
        let [value, setValue] = React.useState(null);
        return (<>
          <DatePicker label="Date" granularity="minute" value={value} onChange={setValue} />
          <button onClick={() => setValue(null)}>Clear</button>
        </>);
      }

      let {getAllByRole, getAllByLabelText} = render(
        <Provider theme={theme}>
          <ControlledDatePicker />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      let formatter = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'});
      expectPlaceholder(combobox, 'mm/dd/yyyy, ––:–– AM');

      let button = getAllByRole('button')[0];
      await user.click(button);

      let cells = getAllByRole('gridcell');
      let timeField = getAllByLabelText('Time')[0];
      let todayCell = cells.find(cell => cell.firstChild.getAttribute('aria-label')?.startsWith('Today'));
      await user.click(todayCell.firstChild);

      expect(todayCell).toHaveAttribute('aria-selected', 'true');

      let hour = within(timeField).getByLabelText('hour,');
      act(() => hour.focus());
      await user.keyboard('{ArrowUp}');
      expect(hour).toHaveAttribute('aria-valuetext', '12 AM');

      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toHaveAttribute('aria-label', 'minute, ');
      await user.keyboard('{ArrowUp}');
      expect(document.activeElement).toHaveAttribute('aria-valuetext', '00');

      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toHaveAttribute('aria-label', 'AM/PM, ');
      expect(document.activeElement).toHaveAttribute('aria-valuetext', 'AM');

      await user.click(document.body);
      act(() => jest.runAllTimers());

      let value = toCalendarDateTime(today(getLocalTimeZone()));
      expectPlaceholder(combobox, formatter.format(value.toDate(getLocalTimeZone())));

      let clear = getAllByRole('button')[1];
      await user.click(clear);
      expectPlaceholder(combobox, 'mm/dd/yyyy, ––:–– AM');

      await user.click(button);
      cells = getAllByRole('gridcell');
      let selected = cells.find(cell => cell.getAttribute('aria-selected') === 'true');
      expect(selected).toBeUndefined();

      timeField = getAllByLabelText('Time')[0];
      expectPlaceholder(timeField, '––:–– AM');
    });
  });

  describe('labeling', function () {
    it('should support labeling', function () {
      let {getByRole, getAllByRole, getByText} = render(<DatePicker label="Date" />);

      let label = getByText('Date');

      let combobox = getAllByRole('group')[0];
      expect(combobox).toHaveAttribute('aria-labelledby', label.id);

      let button = getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Calendar');
      expect(button).toHaveAttribute('id');
      let buttonId = button.getAttribute('id');
      expect(button).toHaveAttribute('aria-labelledby', `${buttonId} ${label.id}`);

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('id');
        let segmentId = segment.getAttribute('id');
        expect(segment).toHaveAttribute('aria-labelledby', `${segmentId} ${label.id}`);
      }
    });

    it('should support labeling with aria-label', function () {
      let {getByRole, getAllByRole, getByTestId} = render(<DatePicker aria-label="Birth date" />);

      let group = getByRole('group');
      expect(group).toHaveAttribute('id');
      expect(group).toHaveAttribute('aria-label', 'Birth date');
      let comboboxId = group.getAttribute('id');

      let field = getByTestId('date-field');
      expect(field).toHaveAttribute('role', 'presentation');
      expect(field).not.toHaveAttribute('aria-label');

      let button = getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Calendar');
      expect(button).toHaveAttribute('id');
      let buttonId = button.getAttribute('id');
      expect(button).toHaveAttribute('aria-labelledby', `${buttonId} ${comboboxId}`);

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('id');
        expect(segment.getAttribute('aria-label').endsWith(' Birth date')).toBe(true);
        expect(segment).not.toHaveAttribute('aria-labelledby');
      }
    });

    it('should support labeling with aria-labelledby', function () {
      let {getByRole, getAllByRole, getByTestId} = render(<DatePicker aria-labelledby="foo" />);

      let combobox = getByRole('group');
      expect(combobox).not.toHaveAttribute('aria-label');
      expect(combobox).toHaveAttribute('aria-labelledby', 'foo');

      let field = getByTestId('date-field');
      expect(field).toHaveAttribute('role', 'presentation');
      expect(field).not.toHaveAttribute('aria-labelledby');

      let button = getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Calendar');
      expect(button).toHaveAttribute('id');
      let buttonId = button.getAttribute('id');
      expect(button).toHaveAttribute('aria-labelledby', `${buttonId} foo`);

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('id');
        let segmentId = segment.getAttribute('id');
        expect(segment).toHaveAttribute('aria-labelledby', `${segmentId} foo`);
      }
    });

    it('should support help text description', function () {
      let {getAllByRole, getByRole, getByTestId} = render(<DatePicker label="Date" description="Help text" />);

      let group = getByRole('group');
      let field = getByTestId('date-field');
      expect(group).toHaveAttribute('aria-describedby');
      expect(field).not.toHaveAttribute('aria-describedby');

      let description = document.getElementById(group.getAttribute('aria-describedby'));
      expect(description).toHaveTextContent('Help text');

      let segments = getAllByRole('spinbutton');
      expect(segments[0]).toHaveAttribute('aria-describedby', description.id);

      for (let segment of segments.slice(1)) {
        expect(segment).not.toHaveAttribute('aria-describedby');
      }
    });

    it('should support error message', function () {
      let {getAllByRole, getByRole, getByTestId} = render(<DatePicker label="Date" errorMessage="Error message" validationState="invalid" />);

      let group = getByRole('group');
      let field = getByTestId('date-field');
      expect(group).toHaveAttribute('aria-describedby');
      expect(field).not.toHaveAttribute('aria-describedby');

      let description = document.getElementById(group.getAttribute('aria-describedby'));
      expect(description).toHaveTextContent('Error message');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('aria-describedby', group.getAttribute('aria-describedby'));
      }
    });

    it('should not display error message if not invalid', function () {
      let {getAllByRole, getByRole, getByTestId} = render(<DatePicker label="Date" errorMessage="Error message" />);

      let group = getByRole('group');
      let field = getByTestId('date-field');
      expect(group).not.toHaveAttribute('aria-describedby');
      expect(field).not.toHaveAttribute('aria-describedby');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).not.toHaveAttribute('aria-describedby');
      }
    });

    it('should support help text with a value', function () {
      let {getAllByRole, getByRole, getByTestId} = render(<DatePicker label="Date" description="Help text" value={new CalendarDate(2020, 2, 3)} />);

      let group = getByRole('group');
      let field = getByTestId('date-field');
      expect(group).toHaveAttribute('aria-describedby');
      expect(field).not.toHaveAttribute('aria-describedby');

      let description = group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
      expect(description).toBe('Selected Date: February 3, 2020 Help text');

      let segments = getAllByRole('spinbutton');
      expect(segments[0]).toHaveAttribute('aria-describedby', group.getAttribute('aria-describedby'));

      for (let segment of segments.slice(1)) {
        expect(segment).not.toHaveAttribute('aria-describedby');
      }
    });

    it('should support error message with a value', function () {
      let {getAllByRole, getByRole, getByTestId} = render(<DatePicker label="Date" errorMessage="Error message" validationState="invalid" value={new CalendarDate(2020, 2, 3)} />);

      let group = getByRole('group');
      let field = getByTestId('date-field');
      expect(group).toHaveAttribute('aria-describedby');
      expect(field).not.toHaveAttribute('aria-describedby');

      let description = group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
      expect(description).toBe('Selected Date: February 3, 2020 Error message');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('aria-describedby', group.getAttribute('aria-describedby'));
      }
    });

    it('should support format help text', function () {
      let {getAllByRole, getByText, getByRole, getByTestId} = render(<DatePicker label="Date" showFormatHelpText />);

      // Not needed in aria-described by because each segment has a label already, so this would be duplicative.
      let group = getByRole('group');
      let field = getByTestId('date-field');
      expect(group).not.toHaveAttribute('aria-describedby');
      expect(field).not.toHaveAttribute('aria-describedby');

      expect(getByText('month / day / year')).toBeVisible();

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).not.toHaveAttribute('aria-describedby');
      }
    });

    it('should include era for BC dates', function () {
      let {getAllByRole} = render(<DatePicker label="Date" value={new CalendarDate('BC', 5, 2, 3)} />);
      let group = getAllByRole('group')[0];
      expect(group).toHaveAttribute('aria-describedby');

      let description = group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
      expect(description).toBe('Selected Date: February 3, 5 BC');

      let segments = getAllByRole('spinbutton');
      expect(segments[3]).toHaveTextContent('BC');
    });
  });

  describe('focus management', function () {
    it('should focus the first segment on mouse down in the field', async function () {
      let {getAllByRole, getByTestId} = render(<DatePicker label="Date" />);
      let field = getByTestId('date-field');
      let segments = getAllByRole('spinbutton');

      await user.click(field);
      expect(segments[0]).toHaveFocus();
    });

    it('should focus the first unfilled segment on mouse down in the field', async function () {
      let {getAllByRole, getByTestId} = render(<DatePicker label="Date" />);
      let field = getByTestId('date-field');
      let segments = getAllByRole('spinbutton');

      act(() => segments[0].focus());
      await user.keyboard('{ArrowUp}');
      expect(segments[0]).toHaveFocus();

      await user.click(field);
      expect(segments[1]).toHaveFocus();
    });

    it('should focus the last segment on mouse down in the field with a value', async function () {
      let {getAllByRole, getByTestId} = render(<DatePicker label="Date" value={new CalendarDate(2020, 2, 3)} />);
      let field = getByTestId('date-field');
      let segments = getAllByRole('spinbutton');

      await user.click(field);
      expect(segments[2]).toHaveFocus();
    });

    it('should focus the previous segment when the era is removed', async function () {
      let {getByTestId, queryByTestId} = render(<DatePicker label="Date" defaultValue={new CalendarDate('BC', 2020, 2, 3)} />);
      let field = getByTestId('date-field');
      let era = getByTestId('era');
      expect(era).toBe(within(field).getAllByRole('spinbutton').pop());

      act(() => era.focus());
      await user.keyboard('{ArrowUp}');

      expect(queryByTestId('era')).toBeNull();
      expect(document.activeElement).toBe(within(field).getAllByRole('spinbutton').pop());
    });

    it('should focus the next segment when the era is removed and is the first segment', async function () {
      let {getByTestId, queryByTestId} = render(
        <Provider theme={theme} locale="lv-LV">
          <DatePicker label="Date" defaultValue={new CalendarDate('BC', 2020, 2, 3)} />
        </Provider>
      );
      let field = getByTestId('date-field');
      let era = getByTestId('era');
      expect(era).toBe(field.firstChild);

      act(() => era.focus());
      await user.keyboard('{ArrowUp}');

      expect(queryByTestId('era')).toBeNull();
      expect(document.activeElement.textContent.replace(/[\u2066-\u2069]/g, '')).toBe('3');
    });

    it('does not try to shift focus when the entire datepicker is unmounted while focused', function () {
      let {rerender, getByTestId} = render(<DatePicker label="Date" defaultValue={new CalendarDate('BC', 2020, 2, 3)} />);
      let era = getByTestId('era');

      act(() => era.focus());

      rerender(<div />);
      expect(era).not.toBeInTheDocument();
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('editing', function () {
    describe('arrow keys', function () {
      async function testArrows(label, value, incremented, decremented, options = {}) {
        let onChange = jest.fn();

        // Test controlled mode
        let {getByLabelText, unmount} = render(
          <Provider theme={theme} locale={options?.locale}>
            <DatePicker label="Date" value={value} onChange={onChange} {...options.props} />
          </Provider>
        );
        let segment = getByLabelText(label);
        let textContent = segment.textContent;
        act(() => {segment.focus();});

        await user.keyboard(`{${options?.upKey || 'ArrowUp'}}`);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(incremented);
        expect(segment.textContent).toBe(textContent);

        await user.keyboard(`{${options?.downKey || 'ArrowDown'}}`);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenCalledWith(decremented);
        expect(segment.textContent).toBe(textContent);
        unmount();

        // Test uncontrolled mode (increment)
        onChange = jest.fn();
        ({getByLabelText, unmount} = render(
          <Provider theme={theme} locale={options?.locale}>
            <DatePicker label="Date" defaultValue={value} onChange={onChange} {...options.props} />
          </Provider>
        ));
        segment = getByLabelText(label);
        textContent = segment.textContent;
        act(() => {segment.focus();});

        await user.keyboard(`{${options?.upKey || 'ArrowUp'}}`);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(incremented);
        expect(segment.textContent).not.toBe(textContent);
        unmount();

        // Test uncontrolled mode (decrement)
        onChange = jest.fn();
        ({getByLabelText, unmount} = render(
          <Provider theme={theme} locale={options?.locale}>
            <DatePicker label="Date" defaultValue={value} onChange={onChange} {...options.props} />
          </Provider>
          ));
        segment = getByLabelText(label);
        textContent = segment.textContent;
        act(() => {segment.focus();});

        await user.keyboard(`{${options?.downKey || 'ArrowDown'}}`);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(decremented);
        expect(segment.textContent).not.toBe(textContent);
        unmount();

        // Test read only mode (increment)
        onChange = jest.fn();
        ({getByLabelText, unmount} = render(
          <Provider theme={theme} locale={options?.locale}>
            <DatePicker label="Date" defaultValue={value} isReadOnly onChange={onChange} {...options.props} />
          </Provider>
        ));
        segment = getByLabelText(label);
        textContent = segment.textContent;
        act(() => {segment.focus();});

        await user.keyboard(`{${options?.upKey || 'ArrowUp'}}`);
        expect(onChange).not.toHaveBeenCalled();
        expect(segment.textContent).toBe(textContent);
        unmount();

        // Test read only mode (decrement)
        onChange = jest.fn();
        ({getByLabelText, unmount} = render(
          <Provider theme={theme} locale={options?.locale}>
            <DatePicker label="Date" defaultValue={value} isReadOnly onChange={onChange} {...options.props} />
          </Provider>
        ));
        segment = getByLabelText(label);
        textContent = segment.textContent;
        act(() => {segment.focus();});

        await user.keyboard(`{${options?.downKey || 'ArrowDown'}}`);
        expect(onChange).not.toHaveBeenCalled();
        expect(segment.textContent).toBe(textContent);
        unmount();
      }

      describe('month', function () {
        it('should support using the arrow keys to increment and decrement the month', async function () {
          await testArrows('month,', new CalendarDate(2019, 2, 3), new CalendarDate(2019, 3, 3), new CalendarDate(2019, 1, 3));
        });

        it('should wrap around when incrementing and decrementing the month', async function () {
          await testArrows('month,', new CalendarDate(2019, 12, 3), new CalendarDate(2019, 1, 3), new CalendarDate(2019, 11, 3));
          await testArrows('month,', new CalendarDate(2019, 1, 3), new CalendarDate(2019, 2, 3), new CalendarDate(2019, 12, 3));
        });

        it('should support using the page up and down keys to increment and decrement the month by 2', async function () {
          await testArrows('month,', new CalendarDate(2019, 1, 3), new CalendarDate(2019, 3, 3), new CalendarDate(2019, 11, 3), {upKey: 'PageUp', downKey: 'PageDown'});
          await testArrows('month,', new CalendarDate(2019, 2, 3), new CalendarDate(2019, 4, 3), new CalendarDate(2019, 12, 3), {upKey: 'PageUp', downKey: 'PageDown'});
        });

        it('should support using the home and end keys to jump to the min and max month', async function () {
          await testArrows('month,', new CalendarDate(2019, 6, 3), new CalendarDate(2019, 12, 3), new CalendarDate(2019, 1, 3), {upKey: 'End', downKey: 'Home'});
        });
      });

      describe('day', function () {
        it('should support using the arrow keys to increment and decrement the day', async function () {
          await testArrows('day,', new CalendarDate(2019, 2, 3), new CalendarDate(2019, 2, 4), new CalendarDate(2019, 2, 2));
        });

        it('should wrap around when incrementing and decrementing the day', async function () {
          await testArrows('day,', new CalendarDate(2019, 2, 28), new CalendarDate(2019, 2, 1), new CalendarDate(2019, 2, 27));
          await testArrows('day,', new CalendarDate(2019, 2, 1), new CalendarDate(2019, 2, 2), new CalendarDate(2019, 2, 28));
        });

        it('should support using the page up and down keys to increment and decrement the day by 7', async function () {
          await testArrows('day,', new CalendarDate(2019, 2, 3), new CalendarDate(2019, 2, 10), new CalendarDate(2019, 2, 24), {upKey: 'PageUp', downKey: 'PageDown'});
        });

        it('should support using the home and end keys to jump to the min and max day', async function () {
          await testArrows('day,', new CalendarDate(2019, 2, 5), new CalendarDate(2019, 2, 28), new CalendarDate(2019, 2, 1), {upKey: 'End', downKey: 'Home'});
        });
      });

      describe('year', function () {
        it('should support using the arrow keys to increment and decrement the year', async function () {
          await testArrows('year,', new CalendarDate(2019, 2, 3), new CalendarDate(2020, 2, 3), new CalendarDate(2018, 2, 3));
        });

        it('should support using the page up and down keys to increment and decrement the year to the nearest 5', async function () {
          await testArrows('year,', new CalendarDate(2019, 2, 3), new CalendarDate(2020, 2, 3), new CalendarDate(2015, 2, 3), {upKey: 'PageUp', downKey: 'PageDown'});
        });
      });

      describe('hour', function () {
        it('should support using the arrow keys to increment and decrement the hour', async function () {
          await testArrows('hour,', new CalendarDateTime(2019, 2, 3, 8), new CalendarDateTime(2019, 2, 3, 9), new CalendarDateTime(2019, 2, 3, 7));
        });

        it('should wrap around when incrementing and decrementing the hour in 12 hour time', async function () {
          // AM
          await testArrows('hour,', new CalendarDateTime(2019, 2, 3, 11), new CalendarDateTime(2019, 2, 3, 0), new CalendarDateTime(2019, 2, 3, 10));
          await testArrows('hour,', new CalendarDateTime(2019, 2, 3, 0), new CalendarDateTime(2019, 2, 3, 1), new CalendarDateTime(2019, 2, 3, 11));

          // PM
          await testArrows('hour,', new CalendarDateTime(2019, 2, 3, 23), new CalendarDateTime(2019, 2, 3, 12), new CalendarDateTime(2019, 2, 3, 22));
          await testArrows('hour,', new CalendarDateTime(2019, 2, 3, 12), new CalendarDateTime(2019, 2, 3, 13), new CalendarDateTime(2019, 2, 3, 23));
        });

        it('should wrap around when incrementing and decrementing the hour in 24 hour time', async function () {
          await testArrows('hour,', new CalendarDateTime(2019, 2, 3, 23), new CalendarDateTime(2019, 2, 3, 0), new CalendarDateTime(2019, 2, 3, 22), {props: {hourCycle: 24}});
          await testArrows('hour,', new CalendarDateTime(2019, 2, 3, 0), new CalendarDateTime(2019, 2, 3, 1), new CalendarDateTime(2019, 2, 3, 23), {props: {hourCycle: 24}});
        });

        it('should support using the page up and down keys to increment and decrement the hour by 2', async function () {
          await testArrows('hour,', new CalendarDateTime(2019, 2, 3, 8), new CalendarDateTime(2019, 2, 3, 10), new CalendarDateTime(2019, 2, 3, 6), {upKey: 'PageUp', downKey: 'PageDown'});
        });

        it('should support using the home and end keys to jump to the min and max hour in 12 hour time', async function () {
          // AM
          await testArrows('hour,', new CalendarDateTime(2019, 2, 3, 8), new CalendarDateTime(2019, 2, 3, 11), new CalendarDateTime(2019, 2, 3, 0), {upKey: 'End', downKey: 'Home'});

          // PM
          await testArrows('hour,', new CalendarDateTime(2019, 2, 3, 16), new CalendarDateTime(2019, 2, 3, 23), new CalendarDateTime(2019, 2, 3, 12), {upKey: 'End', downKey: 'Home'});
        });

        it('should support using the home and end keys to jump to the min and max hour in 24 hour time', async function () {
          await testArrows('hour,', new CalendarDateTime(2019, 2, 3, 8), new CalendarDateTime(2019, 2, 3, 23), new CalendarDateTime(2019, 2, 3, 0), {upKey: 'End', downKey: 'Home', props: {hourCycle: 24}});
        });
      });

      describe('minute', function () {
        it('should support using the arrow keys to increment and decrement the minute', async function () {
          await testArrows('minute,', new CalendarDateTime(2019, 2, 3, 8, 5), new CalendarDateTime(2019, 2, 3, 8, 6), new CalendarDateTime(2019, 2, 3, 8, 4));
        });

        it('should wrap around when incrementing and decrementing the minute', async function () {
          await testArrows('minute,', new CalendarDateTime(2019, 2, 3, 8, 59), new CalendarDateTime(2019, 2, 3, 8, 0), new CalendarDateTime(2019, 2, 3, 8, 58));
          await testArrows('minute,', new CalendarDateTime(2019, 2, 3, 8, 0), new CalendarDateTime(2019, 2, 3, 8, 1), new CalendarDateTime(2019, 2, 3, 8, 59));
        });

        it('should support using the page up and down keys to increment and decrement the minute to the nearest 15', async function () {
          await testArrows('minute,', new CalendarDateTime(2019, 2, 3, 8, 22), new CalendarDateTime(2019, 2, 3, 8, 30), new CalendarDateTime(2019, 2, 3, 8, 15), {upKey: 'PageUp', downKey: 'PageDown'});
        });

        it('should support using the home and end keys to jump to the min and max minute', async function () {
          await testArrows('minute,', new CalendarDateTime(2019, 2, 3, 8, 22), new CalendarDateTime(2019, 2, 3, 8, 59), new CalendarDateTime(2019, 2, 3, 8, 0), {upKey: 'End', downKey: 'Home', props: {hourCycle: 24}});
        });
      });

      describe('second', function () {
        it('should support using the arrow keys to increment and decrement the second', async function () {
          await testArrows('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 10), new CalendarDateTime(2019, 2, 3, 8, 5, 11), new CalendarDateTime(2019, 2, 3, 8, 5, 9), {props: {granularity: 'second'}});
        });

        it('should wrap around when incrementing and decrementing the second', async function () {
          await testArrows('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 59), new CalendarDateTime(2019, 2, 3, 8, 5, 0), new CalendarDateTime(2019, 2, 3, 8, 5, 58), {props: {granularity: 'second'}});
          await testArrows('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 0), new CalendarDateTime(2019, 2, 3, 8, 5, 1), new CalendarDateTime(2019, 2, 3, 8, 5, 59), {props: {granularity: 'second'}});
        });

        it('should support using the page up and down keys to increment and decrement the second to the nearest 15', async function () {
          await testArrows('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 22), new CalendarDateTime(2019, 2, 3, 8, 5, 30), new CalendarDateTime(2019, 2, 3, 8, 5, 15), {upKey: 'PageUp', downKey: 'PageDown', props: {granularity: 'second'}});
        });

        it('should support using the home and end keys to jump to the min and max second', async function () {
          await testArrows('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 22), new CalendarDateTime(2019, 2, 3, 8, 5, 59), new CalendarDateTime(2019, 2, 3, 8, 5, 0), {upKey: 'End', downKey: 'Home', props: {granularity: 'second', hourCycle: 24}});
        });
      });

      describe('day period', function () {
        it('should support using the arrow keys to increment and decrement the day period', async function () {
          await testArrows('AM/PM,', new CalendarDateTime(2019, 2, 3, 8), new CalendarDateTime(2019, 2, 3, 20), new CalendarDateTime(2019, 2, 3, 20));
          await testArrows('AM/PM,', new CalendarDateTime(2019, 2, 3, 20), new CalendarDateTime(2019, 2, 3, 8), new CalendarDateTime(2019, 2, 3, 8));
        });
      });

      describe('era', function () {
        it('should support using the arrow keys to increment and decrement the era', async function () {
          await testArrows('era,', new CalendarDate(new JapaneseCalendar(), 'heisei', 5, 2, 3), new CalendarDate(new JapaneseCalendar(), 'reiwa', 5, 2, 3), new CalendarDate(new JapaneseCalendar(), 'showa', 5, 2, 3), {locale: 'en-US-u-ca-japanese'});
        });

        it('should show and hide the era field as needed', async function () {
          let {queryByTestId} = render(<DatePicker label="Date" />);
          let year = queryByTestId('year');
          expect(queryByTestId('era')).toBeNull();

          beforeInput(year, '1');
          act(() => year.focus());
          await user.keyboard('{ArrowDown}');

          let era = queryByTestId('era');
          expect(era).not.toBeNull();
          act(() => era.focus());
          await user.keyboard('{ArrowDown}');

          expect(queryByTestId('era')).toBeNull();
        });
      });
    });

    describe('text input', function () {
      function testInput(label, value, keys, newValue, moved, props) {
        let onChange = jest.fn();
        // Test controlled mode
        let {getByLabelText, getAllByRole, unmount} = render(
          <Provider theme={theme} locale={props?.locale}>
            <DatePicker label="Date" value={value} onChange={onChange} {...props} />
          </Provider>
        );

        let segment = getByLabelText(label);
        let textContent = segment.textContent;
        act(() => {segment.focus();});

        let allowsZero = (label.indexOf('hour') === 0 && props?.hourCycle === 24) || label.indexOf('minute') === 0 || label.indexOf('second') === 0;
        let count = 0;
        for (let [i, key] of [...keys].entries()) {
          beforeInput(segment, key);

          if (key !== '0' || (moved && i === keys.length - 1) || allowsZero) {
            expect(onChange).toHaveBeenCalledTimes(++count);
          }
          expect(segment.textContent).toBe(textContent);

          if (i < keys.length - 1) {
            expect(segment).toHaveFocus();
          }
        }

        expect(onChange).toHaveBeenCalledWith(newValue);

        if (moved) {
          let segments = getAllByRole('spinbutton');
          let nextSegment = segments[segments.indexOf(segment) + 1];
          expect(nextSegment).toHaveFocus();
        } else {
          expect(segment).toHaveFocus();
        }

        unmount();

        // Test uncontrolled mode
        onChange = jest.fn();
        ({getByLabelText, getAllByRole, unmount} = render(
          <Provider theme={theme} locale={props?.locale}>
            <DatePicker label="Date" defaultValue={value} onChange={onChange} {...props} />
          </Provider>
        ));
        segment = getByLabelText(label);
        textContent = segment.textContent;
        act(() => {segment.focus();});

        count = 0;
        for (let [i, key] of [...keys].entries()) {
          beforeInput(segment, key);

          if (key !== '0' || (moved && i === keys.length - 1) || allowsZero) {
            expect(onChange).toHaveBeenCalledTimes(++count);
            expect(segment.textContent).not.toBe(textContent);
          }

          if (i < keys.length - 1) {
            expect(segment).toHaveFocus();
          }
        }

        expect(onChange).toHaveBeenCalledWith(newValue);

        if (moved) {
          let segments = getAllByRole('spinbutton');
          let nextSegment = segments[segments.indexOf(segment) + 1];
          expect(nextSegment).toHaveFocus();
        } else {
          expect(segment).toHaveFocus();
        }

        unmount();

        // Test read only mode
        onChange = jest.fn();
        ({getByLabelText, getAllByRole, unmount} = render(
          <Provider theme={theme} locale={props?.locale}>
            <DatePicker label="Date" defaultValue={value} isReadOnly onChange={onChange} {...props} />
          </Provider>
        ));
        segment = getByLabelText(label);
        textContent = segment.textContent;
        act(() => {segment.focus();});

        for (let key of keys) {
          beforeInput(segment, key);

          expect(onChange).not.toHaveBeenCalled();
          expect(segment.textContent).toBe(textContent);
          expect(segment).toHaveFocus();
        }

        expect(onChange).not.toHaveBeenCalled();
        expect(segment).toHaveFocus();
        unmount();
      }

      function testIgnored(label, value, keys, props) {
        let onChange = jest.fn();
        let {getByLabelText, unmount} = render(<DatePicker label="Date" defaultValue={value} onChange={onChange} {...props} />);

        let segment = getByLabelText(label);
        let textContent = segment.textContent;
        act(() => {segment.focus();});

        for (let key of keys) {
          beforeInput(segment, key);
        }

        expect(onChange).not.toHaveBeenCalled();
        expect(segment.textContent).toBe(textContent);
        expect(segment).toHaveFocus();
        unmount();
      }

      it('should support typing into the month segment', function () {
        testInput('month,', new CalendarDate(2019, 2, 3), '1', new CalendarDate(2019, 1, 3), false);
        testInput('month,', new CalendarDate(2019, 2, 3), '01', new CalendarDate(2019, 1, 3), true);
        testInput('month,', new CalendarDate(2019, 2, 3), '12', new CalendarDate(2019, 12, 3), true);
        testInput('month,', new CalendarDate(2019, 2, 3), '4', new CalendarDate(2019, 4, 3), true);
        testIgnored('month,', new CalendarDate(2019, 2, 3), '0');
        testIgnored('month,', new CalendarDate(2019, 2, 3), '00');
      });

      it('should support typing into the day segment', function () {
        testInput('day,', new CalendarDate(2019, 2, 3), '1', new CalendarDate(2019, 2, 1), false);
        testInput('day,', new CalendarDate(2019, 2, 3), '01', new CalendarDate(2019, 2, 1), true);
        testInput('day,', new CalendarDate(2019, 2, 3), '12', new CalendarDate(2019, 2, 12), true);
        testInput('day,', new CalendarDate(2019, 2, 3), '4', new CalendarDate(2019, 2, 4), true);
        testIgnored('day,', new CalendarDate(2019, 2, 3), '0');
        testIgnored('day,', new CalendarDate(2019, 2, 3), '00');
      });

      it('should support typing into the year segment', function () {
        testInput('year,', new CalendarDate(2019, 2, 3), '1993', new CalendarDate(1993, 2, 3), false);
        testInput('year,', new CalendarDateTime(2019, 2, 3, 8), '1993', new CalendarDateTime(1993, 2, 3, 8), true);
        testIgnored('year,', new CalendarDate(2019, 2, 3), '0');
      });

      it('should support typing into the hour segment in 12 hour time', function () {
        // AM
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 8), '1', new CalendarDateTime(2019, 2, 3, 1), false);
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 8), '01', new CalendarDateTime(2019, 2, 3, 1), true);
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 8), '11', new CalendarDateTime(2019, 2, 3, 11), true);
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 8), '12', new CalendarDateTime(2019, 2, 3, 0), true);
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 8), '4', new CalendarDateTime(2019, 2, 3, 4), true);
        testIgnored('hour,', new CalendarDateTime(2019, 2, 3, 8), '0');

        // PM
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 20), '1', new CalendarDateTime(2019, 2, 3, 13), false);
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 20), '01', new CalendarDateTime(2019, 2, 3, 13), true);
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 20), '11', new CalendarDateTime(2019, 2, 3, 23), true);
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 20), '12', new CalendarDateTime(2019, 2, 3, 12), true);
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 20), '4', new CalendarDateTime(2019, 2, 3, 16), true);
        testIgnored('hour,', new CalendarDateTime(2019, 2, 3, 20), '0');
      });

      it('should support typing into the hour segment in 24 hour time', function () {
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 8), '0', new CalendarDateTime(2019, 2, 3, 0), false, {hourCycle: 24});
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 8), '00', new CalendarDateTime(2019, 2, 3, 0), true, {hourCycle: 24});
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 8), '1', new CalendarDateTime(2019, 2, 3, 1), false, {hourCycle: 24});
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 8), '01', new CalendarDateTime(2019, 2, 3, 1), true, {hourCycle: 24});
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 8), '11', new CalendarDateTime(2019, 2, 3, 11), true, {hourCycle: 24});
        testInput('hour,', new CalendarDateTime(2019, 2, 3, 8), '23', new CalendarDateTime(2019, 2, 3, 23), true, {hourCycle: 24});
      });

      it('should support typing into the minute segment', function () {
        testInput('minute,', new CalendarDateTime(2019, 2, 3, 8, 8), '0', new CalendarDateTime(2019, 2, 3, 8, 0), false);
        testInput('minute,', new CalendarDateTime(2019, 2, 3, 8, 8), '00', new CalendarDateTime(2019, 2, 3, 8, 0), true);
        testInput('minute,', new CalendarDateTime(2019, 2, 3, 8, 8), '1', new CalendarDateTime(2019, 2, 3, 8, 1), false);
        testInput('minute,', new CalendarDateTime(2019, 2, 3, 8, 8), '01', new CalendarDateTime(2019, 2, 3, 8, 1), true);
        testInput('minute,', new CalendarDateTime(2019, 2, 3, 8, 8), '2', new CalendarDateTime(2019, 2, 3, 8, 2), false);
        testInput('minute,', new CalendarDateTime(2019, 2, 3, 8, 8), '02', new CalendarDateTime(2019, 2, 3, 8, 2), true);
        testInput('minute,', new CalendarDateTime(2019, 2, 3, 8, 8), '5', new CalendarDateTime(2019, 2, 3, 8, 5), false);
        testInput('minute,', new CalendarDateTime(2019, 2, 3, 8, 8), '6', new CalendarDateTime(2019, 2, 3, 8, 6), true);
        testInput('minute,', new CalendarDateTime(2019, 2, 3, 8, 8), '59', new CalendarDateTime(2019, 2, 3, 8, 59), true);
      });

      it('should support typing into the second segment', function () {
        testInput('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 8), '0', new CalendarDateTime(2019, 2, 3, 8, 5, 0), false, {granularity: 'second'});
        testInput('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 8), '00', new CalendarDateTime(2019, 2, 3, 8, 5, 0), true, {granularity: 'second'});
        testInput('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 8), '1', new CalendarDateTime(2019, 2, 3, 8, 5, 1), false, {granularity: 'second'});
        testInput('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 8), '01', new CalendarDateTime(2019, 2, 3, 8, 5, 1), true, {granularity: 'second'});
        testInput('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 8), '2', new CalendarDateTime(2019, 2, 3, 8, 5, 2), false, {granularity: 'second'});
        testInput('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 8), '5', new CalendarDateTime(2019, 2, 3, 8, 5, 5), false, {granularity: 'second'});
        testInput('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 8), '6', new CalendarDateTime(2019, 2, 3, 8, 5, 6), true, {granularity: 'second'});
        testInput('second,', new CalendarDateTime(2019, 2, 3, 8, 5, 8), '59', new CalendarDateTime(2019, 2, 3, 8, 5, 59), true, {granularity: 'second'});
      });

      it('should support typing into the day period segment', function () {
        testInput('AM/PM,', new CalendarDateTime(2019, 2, 3, 8), 'p', new CalendarDateTime(2019, 2, 3, 20), false);
        testInput('AM/PM,', new CalendarDateTime(2019, 2, 3, 20), 'a', new CalendarDateTime(2019, 2, 3, 8), false);
      });

      it('should support entering arabic digits', function () {
        testInput('year,', new CalendarDate(2019, 2, 3), '٢٠٢٤', new CalendarDate(2024, 2, 3), false);
      });

      it('should support typing into the era segment', function () {
        testInput('era,', new CalendarDate(new JapaneseCalendar(), 'reiwa', 5, 2, 3), 'h', new CalendarDate(new JapaneseCalendar(), 'heisei', 5, 2, 3), false, {locale: 'en-US-u-ca-japanese'});
        testInput('era,', new CalendarDate(new JapaneseCalendar(), 'reiwa', 5, 2, 3), 's', new CalendarDate(new JapaneseCalendar(), 'showa', 5, 2, 3), false, {locale: 'en-US-u-ca-japanese'});
        testInput('era,', new CalendarDate(new JapaneseCalendar(), 'showa', 5, 2, 3), 'r', new CalendarDate(new JapaneseCalendar(), 'reiwa', 5, 2, 3), false, {locale: 'en-US-u-ca-japanese'});
        testInput('era,', new CalendarDate(new EthiopicCalendar(), 'AM', 2012, 2, 3), '0', new CalendarDate(new EthiopicCalendar(), 'AA', 2012, 2, 3), false, {locale: 'en-US-u-ca-ethiopic'});
        testInput('era,', new CalendarDate(new EthiopicCalendar(), 'AA', 2012, 2, 3), '1', new CalendarDate(new EthiopicCalendar(), 'AM', 2012, 2, 3), false, {locale: 'en-US-u-ca-ethiopic'});
      });
    });

    describe('backspace', function () {
      async function testBackspace(label, value, newValue, options) {
        let onChange = jest.fn();

        // Test controlled mode
        let {getByLabelText, unmount} = render(<DatePicker label="Date" value={value} onChange={onChange} {...options} />);
        let segment = getByLabelText(label);
        let textContent = segment.textContent;
        act(() => {segment.focus();});

        await user.keyboard('{Backspace}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(newValue);
        expect(segment.textContent).toBe(textContent);
        unmount();

        // Test uncontrolled mode
        onChange = jest.fn();
        ({getByLabelText, unmount} = render(<DatePicker label="Date" defaultValue={value} onChange={onChange} {...options} />));
        segment = getByLabelText(label);
        textContent = segment.textContent;
        act(() => {segment.focus();});

        await user.keyboard('{Backspace}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(newValue);
        if (label === 'AM/PM,') {
          expect(segment).toHaveAttribute('data-placeholder', 'true');
          expect(segment).toHaveAttribute('aria-valuetext', 'Empty');
        } else {
          expect(segment.textContent).not.toBe(textContent);
        }
        unmount();
      }

      it('should support backspace in the month segment', async function () {
        await testBackspace('month,', new CalendarDate(2019, 2, 3), null);
        await testBackspace('month,', new CalendarDate(2019, 6, 3), null);
        await testBackspace('month,', new CalendarDate(2019, 12, 3), new CalendarDate(2019, 1, 3));
      });

      it('should support backspace in the day segment', async function () {
        await testBackspace('day,', new CalendarDate(2019, 2, 3), null);
        await testBackspace('day,', new CalendarDate(2019, 2, 20), new CalendarDate(2019, 2, 2));
      });

      it('should support backspace in the year segment', async function () {
        await testBackspace('year,', new CalendarDate(2019, 2, 3), new CalendarDate(201, 2, 3));
        await testBackspace('year,', new CalendarDate(2, 2, 3), null);
      });

      it('should support backspace in the hour segment in 12 hour time', async function () {
        // AM
        await testBackspace('hour,', new CalendarDateTime(2019, 2, 3, 8), null);
        await testBackspace('hour,', new CalendarDateTime(2019, 2, 3, 11), new CalendarDateTime(2019, 2, 3, 1));

        // PM
        await testBackspace('hour,', new CalendarDateTime(2019, 2, 3, 16), null);
        await testBackspace('hour,', new CalendarDateTime(2019, 2, 3, 23), new CalendarDateTime(2019, 2, 3, 13));
      });

      it('should support backspace in the hour segment in 24 hour time', async function () {
        await testBackspace('hour,', new CalendarDateTime(2019, 2, 3, 8), null, {hourCycle: 24});
        await testBackspace('hour,', new CalendarDateTime(2019, 2, 3, 11), new CalendarDateTime(2019, 2, 3, 1), {hourCycle: 24});
        await testBackspace('hour,', new CalendarDateTime(2019, 2, 3, 16), new CalendarDateTime(2019, 2, 3, 1), {hourCycle: 24});
        await testBackspace('hour,', new CalendarDateTime(2019, 2, 3, 23), new CalendarDateTime(2019, 2, 3, 2), {hourCycle: 24});
      });

      it('should support backspace in the am/pm field', async function () {
        await testBackspace('AM/PM,', new CalendarDateTime(2019, 2, 3, 8), null);
        await testBackspace('AM/PM,', new CalendarDateTime(2019, 2, 3, 16), null);
      });

      it('should support backspace in the minute segment', async function () {
        await testBackspace('minute,', new CalendarDateTime(2019, 2, 3, 5, 8), null);
        await testBackspace('minute,', new CalendarDateTime(2019, 2, 3, 5, 25), new CalendarDateTime(2019, 2, 3, 5, 2));
        await testBackspace('minute,', new CalendarDateTime(2019, 2, 3, 5, 59), new CalendarDateTime(2019, 2, 3, 5, 5));
      });

      it('should support second in the minute segment', async function () {
        await testBackspace('second,', new CalendarDateTime(2019, 2, 3, 5, 5, 8), null, {granularity: 'second'});
        await testBackspace('second,', new CalendarDateTime(2019, 2, 3, 5, 5, 25), new CalendarDateTime(2019, 2, 3, 5, 5, 2), {granularity: 'second'});
        await testBackspace('second,', new CalendarDateTime(2019, 2, 3, 5, 5, 59), new CalendarDateTime(2019, 2, 3, 5, 5, 5), {granularity: 'second'});
      });

      it('should support backspace with arabic digits', async function () {
        let onChange = jest.fn();
        let {getByLabelText} = render(
          <Provider theme={theme} locale="ar-EG">
            <DatePicker label="Date" defaultValue={new CalendarDate(2019, 2, 3)} onChange={onChange} />
          </Provider>
        );
        let segment = getByLabelText('السنة,');
        expect(segment).toHaveTextContent('٢٠١٩');
        act(() => {segment.focus();});

        await user.keyboard('{Backspace}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(new CalendarDate(201, 2, 3));
        expect(segment).toHaveTextContent('٢٠١');
      });
    });
  });

  describe('validation', function () {
    it('should display an error icon when date is less than the minimum (controlled)', function () {
      let {getByTestId} = render(<DatePicker label="Date" value={new CalendarDate(1980, 1, 1)} minValue={new CalendarDate(1985, 1, 1)} />);
      expect(getByTestId('invalid-icon')).toBeVisible();
    });

    it('should display an error icon when date is less than the minimum (uncontrolled)', async function () {
      let {getByTestId, getByLabelText, queryByTestId} = render(<DatePicker label="Date" defaultValue={new CalendarDate(1985, 1, 1)} minValue={new CalendarDate(1985, 1, 1)} />);
      expect(queryByTestId('invalid-icon')).toBeNull();

      let year = getByLabelText('year,');
      act(() => year.focus());
      await user.keyboard('{ArrowDown}');

      expect(getByTestId('invalid-icon')).toBeVisible();

      await user.keyboard('{ArrowUp}');
      expect(queryByTestId('invalid-icon')).toBeNull();
    });

    it('should display an error icon when date is greater than the maximum (controlled)', function () {
      let {getByTestId} = render(<DatePicker label="Date" value={new CalendarDate(1990, 1, 1)} maxValue={new CalendarDate(1985, 1, 1)} />);
      expect(getByTestId('invalid-icon')).toBeVisible();
    });

    it('should display an error icon when date is greater than the maximum (uncontrolled)', async function () {
      let {getByTestId, getByLabelText, queryByTestId} = render(<DatePicker label="Date" defaultValue={new CalendarDate(1985, 1, 1)} maxValue={new CalendarDate(1985, 1, 1)} />);
      expect(queryByTestId('invalid-icon')).toBeNull();

      let year = getByLabelText('year,');
      act(() => year.focus());
      await user.keyboard('{ArrowUp}');

      expect(getByTestId('invalid-icon')).toBeVisible();

      await user.keyboard('{ArrowDown}');
      expect(queryByTestId('invalid-icon')).toBeNull();
    });
  });

  describe('placeholder', function () {
    it('should display a placeholder if no value is provided', function () {
      let onChange = jest.fn();
      let {getAllByRole} = render(<DatePicker label="Date" onChange={onChange} />);

      let combobox = getAllByRole('group')[0];
      expectPlaceholder(combobox, 'mm/dd/yyyy');
    });

    it('should display a placeholder if the value prop is null', function () {
      let onChange = jest.fn();
      let {getAllByRole} = render(<DatePicker label="Date" onChange={onChange} value={null} />);

      let combobox = getAllByRole('group')[0];
      expectPlaceholder(combobox, 'mm/dd/yyyy');
    });

    it('should use the placeholderValue prop if provided', function () {
      let onChange = jest.fn();
      let {getAllByRole} = render(<DatePicker label="Date" onChange={onChange} placeholderValue={new CalendarDate(1980, 1, 1)} />);

      let combobox = getAllByRole('group')[0];
      expectPlaceholder(combobox, 'mm/dd/yyyy');
    });

    it('should use arrow keys to modify placeholder (uncontrolled)', async function () {
      let onChange = jest.fn();
      let {getAllByRole} = render(<DatePicker label="Date" onChange={onChange} />);

      let combobox = getAllByRole('group')[0];
      let formatter = new Intl.DateTimeFormat('en-US');
      expectPlaceholder(combobox, 'mm/dd/yyyy');

      let segments = getAllByRole('spinbutton');
      act(() => {segments[0].focus();});

      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowRight}');
      expect(segments[1]).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      let value = today(getLocalTimeZone());
      let parts = formatter.formatToParts(value.toDate(getLocalTimeZone()));
      let month = parts.find(p => p.type === 'month').value;
      expectPlaceholder(combobox, `${month}/dd/yyyy`);

      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowRight}');
      expect(segments[2]).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      parts = formatter.formatToParts(value.toDate(getLocalTimeZone()));
      month = parts.find(p => p.type === 'month').value;
      let day = parts.find(p => p.type === 'day').value;
      expectPlaceholder(combobox, `${month}/${day}/yyyy`);

      await user.keyboard('{ArrowUp}');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(value);
      expectPlaceholder(combobox, formatter.format(value.toDate(getLocalTimeZone())));
    });

    it('should use arrow keys to modify placeholder (controlled)', async function () {
      let onChange = jest.fn();
      let {getAllByRole, rerender} = render(<DatePicker label="Date" onChange={onChange} value={null} />);

      let combobox = getAllByRole('group')[0];
      let formatter = new Intl.DateTimeFormat('en-US');
      expectPlaceholder(combobox, 'mm/dd/yyyy');

      let segments = getAllByRole('spinbutton');
      act(() => {segments[0].focus();});

      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowRight}');
      expect(segments[1]).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      let value = today(getLocalTimeZone());
      let parts = formatter.formatToParts(value.toDate(getLocalTimeZone()));
      let month = parts.find(p => p.type === 'month').value;
      expectPlaceholder(combobox, `${month}/dd/yyyy`);

      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowRight}');
      expect(segments[2]).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      parts = formatter.formatToParts(value.toDate(getLocalTimeZone()));
      month = parts.find(p => p.type === 'month').value;
      let day = parts.find(p => p.type === 'day').value;
      expectPlaceholder(combobox, `${month}/${day}/yyyy`);

      await user.keyboard('{ArrowUp}');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(value);
      expectPlaceholder(combobox, 'mm/dd/yyyy'); // controlled

      rerender(<DatePicker label="Date" onChange={onChange} value={value} />);
      expectPlaceholder(combobox, formatter.format(value.toDate(getLocalTimeZone())));
    });

    it('should enter a date to modify placeholder (uncontrolled)', function () {
      let onChange = jest.fn();
      let {getAllByRole} = render(<DatePicker label="Date" onChange={onChange} />);

      let combobox = getAllByRole('group')[0];
      let formatter = new Intl.DateTimeFormat('en-US');
      expectPlaceholder(combobox, 'mm/dd/yyyy');

      let segments = getAllByRole('spinbutton');
      act(() => {segments[0].focus();});

      beforeInput(document.activeElement, '4');
      expect(segments[1]).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      let value = today(getLocalTimeZone()).set({month: 4});
      let parts = formatter.formatToParts(value.toDate(getLocalTimeZone()));
      let month = parts.find(p => p.type === 'month').value;
      expectPlaceholder(combobox, `${month}/dd/yyyy`);

      beforeInput(document.activeElement, '5');
      expect(segments[2]).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      value = today(getLocalTimeZone()).set({month: 4, day: 5});
      parts = formatter.formatToParts(value.toDate(getLocalTimeZone()));
      month = parts.find(p => p.type === 'month').value;
      let day = parts.find(p => p.type === 'day').value;
      expectPlaceholder(combobox, `${month}/${day}/yyyy`);

      beforeInput(document.activeElement, '2');
      expect(onChange).toHaveBeenCalledTimes(1);
      beforeInput(document.activeElement, '0');
      expect(onChange).toHaveBeenCalledTimes(2);
      beforeInput(document.activeElement, '2');
      expect(onChange).toHaveBeenCalledTimes(3);
      beforeInput(document.activeElement, '0');
      expect(segments[2]).toHaveFocus();
      expect(onChange).toHaveBeenCalledTimes(4);
      value = new CalendarDate(2020, 4, 5);
      expect(onChange).toHaveBeenCalledWith(value);
      expectPlaceholder(combobox, formatter.format(value.toDate(getLocalTimeZone())));
    });

    it('should enter a date to modify placeholder (controlled)', function () {
      let onChange = jest.fn();
      let {getAllByRole, rerender} = render(<DatePicker label="Date" onChange={onChange} value={null} />);

      let combobox = getAllByRole('group')[0];
      let formatter = new Intl.DateTimeFormat('en-US');
      expectPlaceholder(combobox, 'mm/dd/yyyy');

      let segments = getAllByRole('spinbutton');
      act(() => {segments[0].focus();});

      beforeInput(document.activeElement, '4');
      expect(segments[1]).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      let value = today(getLocalTimeZone()).set({month: 4});
      let parts = formatter.formatToParts(value.toDate(getLocalTimeZone()));
      let month = parts.find(p => p.type === 'month').value;
      expectPlaceholder(combobox, `${month}/dd/yyyy`);

      beforeInput(document.activeElement, '5');
      expect(segments[2]).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      value = today(getLocalTimeZone()).set({month: 4, day: 5});
      parts = formatter.formatToParts(value.toDate(getLocalTimeZone()));
      month = parts.find(p => p.type === 'month').value;
      let day = parts.find(p => p.type === 'day').value;
      expectPlaceholder(combobox, `${month}/${day}/yyyy`);

      beforeInput(document.activeElement, '2');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(new CalendarDate(2, 4, 5));
      expect(segments[2]).toHaveFocus();
      expectPlaceholder(combobox, 'mm/dd/yyyy'); // controlled

      value = new CalendarDate(2020, 4, 5);
      rerender(<DatePicker label="Date" onChange={onChange} value={value} />);
      expectPlaceholder(combobox, formatter.format(value.toDate(getLocalTimeZone())));
    });

    it('should confirm the placeholder on blur and only AM/PM is un-entered', function () {
      let onChange = jest.fn();
      let {getAllByRole} = render(<DatePicker label="Date" granularity="minute" onChange={onChange} />);

      let combobox = getAllByRole('group')[0];
      expectPlaceholder(combobox, 'mm/dd/yyyy, ––:–– AM');

      let segments = getAllByRole('spinbutton');
      act(() => {segments[0].focus();});

      // Should not emit onChange if no segments are set
      act(() => {segments[0].blur();});
      expect(onChange).not.toHaveBeenCalled();

      act(() => {segments[0].focus();});
      beforeInput(document.activeElement, '4');
      expect(onChange).not.toHaveBeenCalled();

      expect(segments[1]).toHaveFocus();
      act(() => {segments[1].blur();});
      expect(onChange).not.toHaveBeenCalled();

      act(() => {segments[1].focus();});
      beforeInput(document.activeElement, '5');

      expect(segments[2]).toHaveFocus();
      act(() => {segments[2].blur();});
      expect(onChange).not.toHaveBeenCalled();

      act(() => {segments[2].focus();});
      beforeInput(document.activeElement, '2022');

      expect(segments[3]).toHaveFocus();
      act(() => {segments[3].blur();});
      expect(onChange).not.toHaveBeenCalled();

      act(() => {segments[3].focus();});
      beforeInput(document.activeElement, '5');

      expect(segments[4]).toHaveFocus();
      act(() => {segments[4].blur();});
      expect(onChange).not.toHaveBeenCalled();

      act(() => {segments[4].focus();});
      beforeInput(document.activeElement, '45');

      expect(segments[5]).toHaveFocus();
      act(() => {segments[5].blur();});
      expect(onChange).toHaveBeenCalledWith(new CalendarDateTime(2022, 4, 5, 5, 45));
    });
  });

  describe('timeZone', function () {
    it('should keep timeZone from defaultValue when date and time are cleared', async function () {
      let {getAllByRole} = render(
        <DatePicker
          label="Date"
          defaultValue={parseZonedDateTime(
            '2024-09-21T00:00:00[America/Los_Angeles]'
          )} />
      );
      let combobox = getAllByRole('group')[0];

      expectPlaceholder(combobox, '9/21/2024, 12:00 AM PDT');

      await user.tab();
      await user.keyboard('{Backspace}');
      await user.tab();
      let i;
      for (i = 0; i < 2; i++) {
        await user.keyboard('{Backspace}');
      }
      await user.tab();
      for (i = 0; i < 4; i++) {
        await user.keyboard('{Backspace}');
      }
      await user.tab();
      for (i = 0; i < 2; i++) {
        await user.keyboard('{Backspace}');
      }
      await user.tab();
      for (i = 0; i < 2; i++) {
        await user.keyboard('{Backspace}');
      }
      await user.tab();
      await user.keyboard('{Backspace}');

      let timeZoneName =
        new DateFormatter('en-US',
          {
            timeZone: 'America/Los_Angeles',
            timeZoneName: 'short'
          })
          .formatToParts(new Date())
          .find(p => p.type === 'timeZoneName')
          .value;

      expectPlaceholder(combobox, `mm/dd/yyyy, ––:–– AM ${timeZoneName}`);
    });

    it('should keep timeZone from defaultValue when date and time are cleared then set', async function () {
      let {getAllByRole, getByRole} = render(
        <DatePicker
          label="Date"
          defaultValue={parseZonedDateTime('2024-09-21T00:00:00[Greenwich]')} />
      );
      let combobox = getAllByRole('group')[0];
      let formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });

      expectPlaceholder(combobox, '9/21/2024, 12:00 AM GMT');

      await user.tab();
      await user.keyboard('{Backspace}');
      await user.tab();
      let i;
      for (i = 0; i < 2; i++) {
        await user.keyboard('{Backspace}');
      }
      await user.tab();
      for (i = 0; i < 4; i++) {
        await user.keyboard('{Backspace}');
      }
      await user.tab();
      for (i = 0; i < 2; i++) {
        await user.keyboard('{Backspace}');
      }
      await user.tab();
      for (i = 0; i < 2; i++) {
        await user.keyboard('{Backspace}');
      }
      await user.tab();
      await user.keyboard('{Backspace}');

      expectPlaceholder(combobox, 'mm/dd/yyyy, ––:–– AM GMT');

      let button = getByRole('button');
      await user.click(button);

      let dialog = getByRole('dialog');
      expect(dialog).toBeVisible();

      let cells = getAllByRole('gridcell');
      let selected = cells.find(
        (cell) => cell.getAttribute('aria-selected') === 'true'
      );
      expect(selected).toBeUndefined();

      let todayCell = cells.find((cell) =>
        cell.firstChild.getAttribute('aria-label')?.startsWith('Today')
      );
      await user.click(todayCell.firstChild);

      expect(todayCell).toHaveAttribute('aria-selected', 'true');
      expect(dialog).toBeVisible();
      await user.click(document.body);
      act(() => jest.runAllTimers());
      expect(dialog).not.toBeInTheDocument();
      let value = toCalendarDateTime(today('Greenwich'));
      expectPlaceholder(
        combobox,
        `${formatter.format(value.toDate())} GMT`
      );
    });
  });

  describe('forms', () => {
    it('supports form reset', async () => {
      function Test() {
        let [value, setValue] = React.useState(new CalendarDate(2020, 2, 3));
        return (
          <form>
            <DatePicker name="date" label="Value" value={value} onChange={setValue} />
            <input type="reset" data-testid="reset" />
          </form>
        );
      }

      let {getByTestId, getByRole} = render(<Test />);
      let group = getByRole('group');
      let input = document.querySelector('input[name=date]');

      let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
      expect(getDescription()).toBe('Selected Date: February 3, 2020');

      expect(input).toHaveValue('2020-02-03');
      expect(input).toHaveAttribute('name', 'date');
      await user.tab();
      await user.keyboard('{ArrowUp}');
      expect(getDescription()).toBe('Selected Date: March 3, 2020');
      expect(input).toHaveValue('2020-03-03');

      let button = getByTestId('reset');
      await user.click(button);
      expect(getDescription()).toBe('Selected Date: February 3, 2020');
      expect(input).toHaveValue('2020-02-03');
    });

    describe('validation', () => {
      describe('validationBehavior=native', () => {
        it('supports isRequired', async () => {
          let {getByRole, getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DatePicker label="Date" name="date" isRequired validationBehavior="native" />
              </Form>
            </Provider>
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

        it('supports minValue and maxValue', async () => {
          let {getByRole, getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DatePicker label="Date" name="date" minValue={new CalendarDate(2020, 2, 3)} maxValue={new CalendarDate(2024, 2, 3)} defaultValue={new CalendarDate(2019, 2, 3)} validationBehavior="native" />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          let input = document.querySelector('input[name=date]');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(input.validity.valid).toBe(false);
          expect(getDescription()).not.toContain('Value must be 2/3/2020 or later.');

          act(() => {getByTestId('form').checkValidity();});

          expect(group).toHaveAttribute('aria-describedby');
          expect(getDescription()).toContain('Value must be 2/3/2020 or later.');
          expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);

          await user.keyboard('[Tab][Tab][ArrowUp]');

          expect(getDescription()).toContain('Value must be 2/3/2020 or later.');
          expect(input.validity.valid).toBe(true);

          await user.tab();

          expect(getDescription()).not.toContain('Value must be 2/3/2020 or later.');

          await user.tab({shift: true});
          await user.keyboard('2025');
          expect(getDescription()).not.toContain('Value must be 2/3/2024 or earlier.');
          expect(input.validity.valid).toBe(false);
          await user.tab();

          act(() => {getByTestId('form').checkValidity();});
          expect(getDescription()).toContain('Value must be 2/3/2024 or earlier.');
          expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);

          await user.keyboard('[Tab][Tab][ArrowDown]');
          expect(getDescription()).toContain('Value must be 2/3/2024 or earlier.');
          expect(input.validity.valid).toBe(true);
          await user.tab();

          expect(getDescription()).not.toContain('Value must be 2/3/2024 or earlier.');
        });

        it('supports validate function', async () => {
          let {getByRole, getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DatePicker name="date" label="Value" defaultValue={new CalendarDate(2020, 2, 3)} validationBehavior="native" validate={v => v.year < 2022 ? 'Invalid value' : null} />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          let input = document.querySelector('input[name=date]');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).not.toContain('Invalid value');
          expect(input.validity.valid).toBe(false);

          act(() => {getByTestId('form').checkValidity();});

          expect(group).toHaveAttribute('aria-describedby');
          expect(getDescription()).toContain('Invalid value');
          expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);

          await user.keyboard('[ArrowRight][ArrowRight]2024');

          expect(getDescription()).toContain('Invalid value');
          expect(input.validity.valid).toBe(true);

          await user.tab();

          expect(getDescription()).not.toContain('Invalid value');
          expect(input.validity.valid).toBe(true);
        });

        it('supports server validation', async () => {
          function Test() {
            let [serverErrors, setServerErrors] = React.useState({});
            let onSubmit = e => {
              e.preventDefault();
              setServerErrors({
                date: 'Invalid value'
              });
            };

            return (
              <Provider theme={theme}>
                <Form onSubmit={onSubmit} validationErrors={serverErrors}>
                  <DatePicker name="date" label="Value" validationBehavior="native" />
                  <Button type="submit" data-testid="submit">Submit</Button>
                </Form>
              </Provider>
            );
          }

          let {getByTestId, getByRole} = render(<Test />);

          let group = getByRole('group');
          let input = document.querySelector('input[name=date]');
          expect(group).not.toHaveAttribute('aria-describedby');

          await user.click(getByTestId('submit'));

          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).toContain('Invalid value');
          expect(input.validity.valid).toBe(false);

          await user.tab({shift: true});
          await user.tab({shift: true});
          await user.keyboard('2024[ArrowLeft]2[ArrowLeft]2');
          act(() => document.activeElement.blur());

          expect(getDescription()).not.toContain('Invalid value');
          expect(input.validity.valid).toBe(true);
        });

        it('supports customizing native error messages', async () => {
          let {getByTestId, getByRole} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DatePicker name="date" label="Value" isRequired validationBehavior="native" errorMessage={e => e.validationDetails.valueMissing ? 'Please enter a value' : null} />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          expect(group).not.toHaveAttribute('aria-describedby');

          act(() => {getByTestId('form').checkValidity();});
          expect(group).toHaveAttribute('aria-describedby');
          expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('Please enter a value');
        });

        it('clears validation on form reset', async () => {
          let {getByRole, getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DatePicker label="Date" name="date" isRequired validationBehavior="native" />
                <Button type="reset" data-testid="reset">Reset</Button>
              </Form>
            </Provider>
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

          await user.click(getByTestId('reset'));

          expect(group).not.toHaveAttribute('aria-describedby');
        });

        it('updates when selecting a date with the calendar', async () => {
          let {getByRole, getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DatePicker label="Date" name="date" isRequired validationBehavior="native" />
              </Form>
            </Provider>
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

          await user.click(getByRole('button'));
          await user.click(document.activeElement);

          expect(input.validity.valid).toBe(true);
          expect(getDescription()).not.toContain('Constraints not satisfied');
        });
      });

      describe('validationBehavior=aria', () => {
        it('supports minValue and maxValue', async () => {
          let {getByRole} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DatePicker label="Date" name="date" minValue={new CalendarDate(2020, 2, 3)} maxValue={new CalendarDate(2024, 2, 3)} defaultValue={new CalendarDate(2019, 2, 3)} />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).toContain('Value must be 2/3/2020 or later.');

          await user.keyboard('[Tab][Tab][Tab][ArrowUp]');
          expect(getDescription()).not.toContain('Value must be 2/3/2020 or later.');

          await user.keyboard('[ArrowUp][ArrowUp][ArrowUp][ArrowUp][ArrowUp]');
          expect(getDescription()).toContain('Value must be 2/3/2024 or earlier.');

          await user.keyboard('[ArrowDown]');
          expect(getDescription()).not.toContain('Value must be 2/3/2024 or earlier.');
        });

        it('supports validate function', async () => {
          let {getByRole} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DatePicker label="Value" defaultValue={new CalendarDate(2020, 2, 3)} validate={v => v.year < 2022 ? 'Invalid value' : null} />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          expect(group).toHaveAttribute('aria-describedby');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).toContain('Invalid value');

          await user.keyboard('[Tab][ArrowRight][ArrowRight]2024');
          expect(getDescription()).not.toContain('Invalid value');
        });

        it('supports server validation', async () => {
          let {getByRole} = render(
            <Provider theme={theme}>
              <Form validationErrors={{value: 'Invalid value'}}>
                <DatePicker label="Value" name="value" defaultValue={new CalendarDate(2020, 2, 3)} />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          expect(group).toHaveAttribute('aria-describedby');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).toContain('Invalid value');

          await user.keyboard('[Tab][ArrowRight][ArrowRight]2024[Tab]');
          expect(getDescription()).not.toContain('Invalid value');
        });
      });
    });
  });
});
