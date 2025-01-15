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

import {act, fireEvent, installPointerEvent, pointerMap, render as render_, simulateDesktop, within} from '@react-spectrum/test-utils-internal';
import {CalendarDate, parseZonedDateTime} from '@internationalized/date';
import {DatePicker, DateRangePicker} from '../';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

function pointerEvent(type, opts) {
  let evt = new Event(type, {bubbles: true, cancelable: true});
  Object.assign(evt, {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    button: opts.button || 0
  }, opts);
  return evt;
}

function render(el) {
  if (el.type === Provider) {
    return render_(el);
  }
  return render_(
    <Provider theme={theme}>
      {el}
    </Provider>
  );
}

describe('DatePickerBase', function () {
  beforeAll(() => {
    simulateDesktop();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('basics', function () {
    it.each`
      Name                   | Component            | numSegments
      ${'DatePicker'}        | ${DatePicker}        | ${3}
      ${'DateRangePicker'}   | ${DateRangePicker}   | ${6}
    `('$Name should render a default datepicker', ({Component, numSegments}) => {
      let {getAllByRole} = render(<Component label="Date" />);

      let combobox = getAllByRole('group')[0];
      expect(combobox).toBeVisible();
      expect(combobox).not.toHaveAttribute('aria-disabled');
      expect(combobox).not.toHaveAttribute('aria-invalid');

      let segments = getAllByRole('spinbutton');
      expect(segments.length).toBe(numSegments);
      for (let segment of segments) {
        expect(segment).not.toHaveAttribute('aria-disabled');
        expect(segment).toHaveAttribute('contentEditable', 'true');
        expect(segment).toHaveAttribute('inputMode', 'numeric');
        expect(segment).not.toHaveAttribute('aria-readonly', 'true');
      }

      let button = getAllByRole('button')[0];
      expect(button).toBeVisible();
      expect(button).not.toHaveAttribute('tabindex');
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should set aria-disabled when isDisabled', ({Component}) => {
      let {getAllByRole} = render(<Component label="Date" isDisabled />);

      let combobox = getAllByRole('group')[0];
      expect(combobox).toHaveAttribute('aria-disabled', 'true');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('aria-disabled', 'true');
        expect(segment).not.toHaveAttribute('contentEditable', 'true');
        expect(segment).not.toHaveAttribute('inputMode', 'numeric');
      }

      let button = getAllByRole('button')[0];
      expect(button).toHaveAttribute('disabled');
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should set aria-readonly when isReadOnly', ({Component}) => {
      let {getAllByRole} = render(<Component label="Date" isReadOnly />);

      let combobox = getAllByRole('group')[0];
      expect(combobox).not.toHaveAttribute('aria-readonly', 'true');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('aria-readonly', 'true');
      }

      let button = getAllByRole('button')[0];
      expect(button).toHaveAttribute('disabled');
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should set aria-required when isRequired', ({Component}) => {
      let {getAllByRole} = render(<Component label="Date" isRequired />);

      let combobox = getAllByRole('group')[0];
      expect(combobox).not.toHaveAttribute('aria-required', 'true');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('aria-required', 'true');
      }
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should set aria-invalid when validationState="invalid"', ({Component}) => {
      let {getAllByRole} = render(<Component label="Date" validationState="invalid" />);

      let combobox = getAllByRole('group')[0];
      expect(combobox).not.toHaveAttribute('aria-invalid', 'true');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('aria-invalid', 'true');
      }
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should set aria-readonly on non-editable segments', ({Component}) => {
      let {getAllByTestId} = render(<Component label="Date" placeholderValue={parseZonedDateTime('2021-11-07T00:45-07:00[America/Los_Angeles]')} />);

      let timezones = getAllByTestId('timeZoneName');
      for (let tz of timezones) {
        expect(tz).toHaveAttribute('role', 'textbox');
        expect(tz).toHaveAttribute('aria-readonly', 'true');
        expect(tz).toHaveTextContent('PDT');
        expect(tz).not.toHaveAttribute('contenteditable');
      }
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should focus placeholderValue in calendar', async ({Component}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let {getByRole} = render(<Component label="Date" placeholderValue={new CalendarDate(2019, 6, 5)} />);

      let button = getByRole('button');
      await user.click(button);

      let grid = getByRole('grid');
      expect(grid).toHaveAttribute('aria-label', 'June 2019');
      expect(document.activeElement.getAttribute('aria-label').startsWith('Wednesday, June 5, 2019')).toBe(true);
    });

    it.each`
      Name                   | Component          | props
      ${'DatePicker'}        | ${DatePicker}      | ${{defaultValue: new CalendarDate(2019, 7, 5)}}
      ${'DateRangePicker'}   | ${DateRangePicker} | ${{defaultValue: {start: new CalendarDate(2019, 7, 5), end: new CalendarDate(2019, 7, 10)}}}
    `('$Name should focus selected date over placeholderValue', async ({Component, props}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let {getByRole} = render(<Component label="Date" {...props} placeholderValue={new CalendarDate(2019, 6, 5)} />);

      let button = getByRole('button');
      await user.click(button);

      let grid = getByRole('grid');
      expect(grid).toHaveAttribute('aria-label', 'July 2019');
      expect(document.activeElement.getAttribute('aria-label').includes('Friday, July 5, 2019')).toBe(true);
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should respond to provider props', ({Component}) => {
      let {getAllByRole} = render(
        <Provider theme={theme} isDisabled>
          <Component label="Date" isDisabled />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      expect(combobox).toHaveAttribute('aria-disabled', 'true');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('aria-disabled', 'true');
      }

      let button = getAllByRole('button')[0];
      expect(button).toHaveAttribute('disabled');
    });

    it.each`
      Name                   | Component          | props
      ${'DatePicker'}        | ${DatePicker}      | ${{defaultValue: new CalendarDate(2019, 7, 5)}}
      ${'DateRangePicker'}   | ${DateRangePicker} | ${{defaultValue: {start: new CalendarDate(2019, 7, 5), end: new CalendarDate(2019, 7, 8)}}}
    `('$Name should support shouldForceLeadingZeros', ({Component, props}) => {
      let {getAllByRole} = render(<Component label="Date" {...props} shouldForceLeadingZeros />);

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        if (segment.getAttribute('data-testid') !== 'year') {
          // ignore placeholder text.
          let textContent = [...segment.childNodes].map(el => el.nodeType === 3 ? el.textContent : '').join('');
          expect(textContent.startsWith('0')).toBeTruthy();
        }
      }
    });
  });

  describe('calendar popover', function () {
    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should open a calendar popover when clicking the button', async ({Component}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let {getAllByRole} = render(
        <Provider theme={theme}>
          <Component label="Date" />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      expect(combobox).not.toHaveAttribute('aria-haspopup', 'dialog');
      expect(combobox).not.toHaveAttribute('aria-owns');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        // expect(segment).toHaveAttribute('aria-haspopup', 'dialog');
        expect(segment).not.toHaveAttribute('aria-expanded');
        expect(segment).not.toHaveAttribute('aria-controls');
      }

      let button = getAllByRole('button')[0];
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).not.toHaveAttribute('aria-controls');

      await user.click(button);

      let dialog = getAllByRole('dialog')[0];
      expect(dialog).toBeVisible();
      expect(dialog).toHaveAttribute('id');
      let dialogId = dialog.getAttribute('id');

      // for (let segment of segments) {
      //   expect(segment).toHaveAttribute('aria-controls', dialogId);
      // }

      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-controls', dialogId);

      // Focuses the calendar date
      expect(document.activeElement.parentElement).toHaveAttribute('role', 'gridcell');
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should open a calendar popover pressing Alt + ArrowDown on the keyboard', ({Component}) => {
      let {getAllByRole} = render(
        <Provider theme={theme}>
          <Component label="Date" />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      expect(combobox).not.toHaveAttribute('aria-haspopup', 'dialog');
      expect(combobox).not.toHaveAttribute('aria-owns');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        // expect(segment).toHaveAttribute('aria-haspopup', 'dialog');
        expect(segment).not.toHaveAttribute('aria-expanded');
        expect(segment).not.toHaveAttribute('aria-controls');
      }

      let button = getAllByRole('button')[0];
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button).not.toHaveAttribute('aria-controls');

      fireEvent.keyDown(combobox, {key: 'ArrowDown', altKey: true});

      let dialog = getAllByRole('dialog')[0];
      expect(dialog).toBeVisible();
      expect(dialog).toHaveAttribute('id');
      let dialogId = dialog.getAttribute('id');

      // for (let segment of segments) {
      //   expect(segment).toHaveAttribute('aria-controls', dialogId);
      // }

      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-controls', dialogId);

      // Focuses the calendar date
      expect(document.activeElement.parentElement).toHaveAttribute('role', 'gridcell');
    });

    it.skip.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should open a calendar popover when tapping on the date field with a touch device', ({Component}) => {
      let {getAllByRole} = render(
        <Provider theme={theme}>
          <Component label="Date" />
        </Provider>
      );

      let combobox = getAllByRole('group')[0];
      expect(combobox).not.toHaveAttribute('aria-haspopup', 'dialog');
      expect(combobox).not.toHaveAttribute('aria-owns');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        // expect(segment).toHaveAttribute('aria-haspopup', 'dialog');
        expect(segment).not.toHaveAttribute('aria-expanded');
        expect(segment).not.toHaveAttribute('aria-controls');
      }

      let button = getAllByRole('button')[0];
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button).not.toHaveAttribute('aria-controls');

      fireEvent.touchStart(combobox, {targetTouches: [{identifier: 1}]});
      fireEvent.touchEnd(combobox, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});

      let dialog = getAllByRole('dialog')[0];
      expect(dialog).toBeVisible();
      expect(dialog).toHaveAttribute('id');
      let dialogId = dialog.getAttribute('id');

      // for (let segment of segments) {
      //   expect(segment).toHaveAttribute('aria-controls', dialogId);
      // }

      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-controls', dialogId);

      // Focuses the calendar date
      expect(document.activeElement.parentElement).toHaveAttribute('role', 'gridcell');
    });

    it.each`
      Name                   | Component          | props
      ${'DatePicker'}        | ${DatePicker}      | ${{defaultValue: new CalendarDate(2021, 10, 3)}}
      ${'DateRangePicker'}   | ${DateRangePicker} | ${{defaultValue: {start: new CalendarDate(2021, 10, 3), end: new CalendarDate(2021, 10, 4)}}}
    `('$Name should pass validationState and errorMessage to calendar', async ({Component, props}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let {getAllByRole} = render(
        <Provider theme={theme}>
          <Component {...props} label="Date" errorMessage="Selected dates cannot include weekends." validationState="invalid" />
        </Provider>
      );

      let button = getAllByRole('button')[0];
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).not.toHaveAttribute('aria-controls');

      await user.click(button);

      let dialog = getAllByRole('dialog')[0];
      let grid = within(dialog).getByRole('grid');
      let cell = within(grid).getAllByLabelText('selected', {exact: false})[0];
      let description = cell.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ');
      expect(description.startsWith('Selected dates cannot include weekends.')).toBe(true);
    });
  });

  describe('focus management', function () {
    installPointerEvent();

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should support arrow keys to move between segments', ({Component}) => {
      let {getAllByRole} = render(<Component label="Date" />);

      let segments = getAllByRole('spinbutton');
      let button = getAllByRole('button')[0];
      act(() => {segments[0].focus();});

      for (let i = 0; i < segments.length; i++) {
        expect(segments[i]).toHaveFocus();
        fireEvent.keyDown(document.activeElement, {key: 'ArrowRight'});
      }

      expect(button).toHaveFocus();
      fireEvent.keyDown(document.activeElement, {key: 'ArrowLeft'});

      for (let i = segments.length - 1; i >= 0; i--) {
        expect(segments[i]).toHaveFocus();
        fireEvent.keyDown(document.activeElement, {key: 'ArrowLeft'});
      }
    });
    // TODO: figure out this test. probably remove it since the issues stem from not being able to actually calculate the position of each segments. still would like to find a way to test tho?
    it.skip.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should support arrow keys to move between segments in an RTL locale', ({Component}) => {
      let {getAllByRole} = render(
        <Provider theme={theme} locale="ar-EG">
          <Component label="Date" value={new CalendarDate(2019, 2, 3)} />
        </Provider>
      );

      let segments = getAllByRole('spinbutton');
      let button = getAllByRole('button')[0];
      act(() => {segments[0].focus();});

      for (let i = 0; i < segments.length; i++) {
        expect(segments[i]).toHaveFocus();
        fireEvent.keyDown(document.activeElement, {key: 'ArrowLeft'});
      }

      expect(button).toHaveFocus();
      fireEvent.keyDown(document.activeElement, {key: 'ArrowRight'});

      for (let i = segments.length - 1; i >= 0; i--) {
        expect(segments[i]).toHaveFocus();
        fireEvent.keyDown(document.activeElement, {key: 'ArrowRight'});
      }
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should focus the previous segment on mouse down on a literal segment', ({Component}) => {
      let {getAllByRole, getAllByText} = render(<Component label="Date" />);
      let literals = getAllByText('/');
      let segments = getAllByRole('spinbutton');

      fireEvent(literals[0], pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      expect(segments[0]).toHaveFocus();
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should not be focusable when isDisabled', ({Component}) => {
      let {getAllByRole} = render(<Component label="Date"isDisabled />);
      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).not.toHaveAttribute('tabIndex');
      }
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should focus the first segment by default if autoFocus is set', ({Component}) => {
      let {getAllByRole} = render(<Component label="Date" autoFocus />);

      let segments = getAllByRole('spinbutton');
      expect(segments[0]).toHaveFocus();
    });
  });

  describe('validation', function () {
    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should display an error icon when validationState="invalid"', ({Component}) => {
      let {getByTestId} = render(<Component label="Date" validationState="invalid" />);
      expect(getByTestId('invalid-icon')).toBeVisible();
    });

    it.each`
      Name                   | Component
      ${'DatePicker'}        | ${DatePicker}
      ${'DateRangePicker'}   | ${DateRangePicker}
    `('$Name should display an checkmark icon when validationState="valid"', ({Component}) => {
      let {getByTestId} = render(<Component label="Date" validationState="valid" />);
      expect(getByTestId('valid-icon')).toBeVisible();
    });
  });
});
