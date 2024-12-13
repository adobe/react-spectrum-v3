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

import {act} from '@testing-library/react';

jest.mock('@react-aria/live-announcer');
import {announce} from '@react-aria/live-announcer';
import {Calendar} from '../';
import {CalendarDate, isWeekend} from '@internationalized/date';
import {pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import React from 'react';
import {useLocale} from '@react-aria/i18n';
import userEvent from '@testing-library/user-event';

describe('Calendar', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    act(() => {jest.runAllTimers();});
  });

  describe('basics', () => {
    it.each`
      Name      | Calendar
      ${'v3'}   | ${Calendar}
    `('$Name should render a calendar with a defaultValue', ({Calendar}) => {
      let {getByLabelText, getByRole, getAllByRole} = render(<Calendar defaultValue={new CalendarDate(2019, 6, 5)} />);

      let heading = getByRole('heading');
      expect(heading).toHaveTextContent('June 2019');

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(30);

      let selectedDate = getByLabelText('Selected', {exact: false});
      expect(selectedDate.parentElement).toHaveAttribute('role', 'gridcell');
      expect(selectedDate.parentElement).toHaveAttribute('aria-selected', 'true');
      expect(selectedDate).toHaveAttribute('aria-label', 'Wednesday, June 5, 2019 selected');
    });

    it.each`
      Name      | Calendar
      ${'v3'}   | ${Calendar}
    `('$Name should render a calendar with a value', ({Calendar}) => {
      let {getByLabelText, getByRole, getAllByRole} = render(<Calendar value={new CalendarDate(2019, 6, 5)} />);

      let heading = getByRole('heading');
      expect(heading).toHaveTextContent('June 2019');

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(30);

      let selectedDate = getByLabelText('Selected', {exact: false});
      expect(selectedDate.parentElement).toHaveAttribute('role', 'gridcell');
      expect(selectedDate.parentElement).toHaveAttribute('aria-selected', 'true');
      expect(selectedDate).toHaveAttribute('aria-label', 'Wednesday, June 5, 2019 selected');
    });

    it.each`
      Name      | Calendar
      ${'v3'}   | ${Calendar}
    `('$Name should focus the selected date if autoFocus is set', ({Calendar}) => {
      let {getByRole, getByLabelText} = render(<Calendar value={new CalendarDate(2019, 2, 3)} autoFocus />);

      let cell = getByLabelText('selected', {exact: false});

      let grid = getByRole('grid');
      expect(cell.parentElement).toHaveAttribute('role', 'gridcell');
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
      expect(cell).toHaveFocus();
      expect(grid).not.toHaveAttribute('aria-activedescendant');
    });

    it('should center the selected date if multiple months are visible', () => {
      let {getAllByRole, getByLabelText} = render(<Calendar value={new CalendarDate(2019, 2, 3)} visibleMonths={3} />);

      let grids = getAllByRole('grid');
      expect(grids).toHaveLength(3);

      let cell = getByLabelText('selected', {exact: false});
      expect(grids[1].contains(cell)).toBe(true);
    });

    it('should constrain the visible region depending on the minValue', () => {
      let {getAllByRole, getByLabelText} = render(<Calendar value={new CalendarDate(2019, 2, 3)} minValue={new CalendarDate(2019, 2, 1)} visibleMonths={3} />);

      let grids = getAllByRole('grid');
      expect(grids).toHaveLength(3);

      let cell = getByLabelText('selected', {exact: false});
      expect(grids[0].contains(cell)).toBe(true);
    });

    it('should show era for BC dates', () => {
      let {getByLabelText} = render(<Calendar value={new CalendarDate('BC', 5, 2, 3)} />);
      let cell = getByLabelText('selected', {exact: false});
      expect(cell).toHaveAttribute('aria-label', 'Saturday, February 3, 5 BC selected');
    });
  });

  describe('selection', () => {
    it.each`
      Name      | Calendar
      ${'v3'}   | ${Calendar}
    `('$Name selects a date on keyDown Enter/Space (uncontrolled)', async ({Calendar}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let onChange = jest.fn();
      let {getByLabelText} = render(
        <Calendar
          defaultValue={new CalendarDate(2019, 6, 5)}
          autoFocus
          onChange={onChange} />
      );

      let selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('5');

      // Select a new date
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{Enter}');
      selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('4');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toEqual(new CalendarDate(2019, 6, 4));

      await user.keyboard('{ArrowLeft}');
      await user.keyboard('[Space]');
      selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('3');
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.calls[1][0]).toEqual(new CalendarDate(2019, 6, 3));
    });

    it.each`
      Name      | Calendar
      ${'v3'}   | ${Calendar}
    `('$Name selects a date on keyDown Enter/Space (controlled)', async ({Calendar}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let onChange = jest.fn();
      let {getByLabelText} = render(
        <Calendar
          value={new CalendarDate(2019, 6, 5)}
          autoFocus
          onChange={onChange} />
      );

      let selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('5');

      // Select a new date
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{Enter}');
      selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('5'); // controlled
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toEqual(new CalendarDate(2019, 6, 4));

      await user.keyboard('{ArrowLeft}');
      await user.keyboard('[Space]');
      selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('5'); // controlled
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.calls[1][0]).toEqual(new CalendarDate(2019, 6, 3));
    });

    it.each`
      Name      | Calendar      | props
      ${'v3'}   | ${Calendar}   | ${{isReadOnly: true}}
    `('$Name does not select a date on keyDown Enter/Space if isReadOnly', async ({Calendar, props}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let onChange = jest.fn();
      let {getByLabelText} = render(
        <Calendar
          defaultValue={new CalendarDate(2019, 6, 5)}
          autoFocus
          onChange={onChange}
          {...props} />
      );

      let selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('5');

      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{Enter}');
      selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('5');
      expect(onChange).not.toHaveBeenCalled();

      await user.keyboard('{ArrowLeft}');
      await user.keyboard('[Space]');
      selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('5');
      expect(onChange).not.toHaveBeenCalled();
    });

    it.each`
      Name      | Calendar
      ${'v3'}   | ${Calendar}
    `('$Name selects a date on click (uncontrolled)', async ({Calendar}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let onChange = jest.fn();
      let {getByLabelText, getByText} = render(
        <Calendar
          defaultValue={new CalendarDate(2019, 6, 5)}
          onChange={onChange} />
      );

      let newDate = getByText('17');
      await user.click(newDate);

      let selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('17');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toEqual(new CalendarDate(2019, 6, 17));
    });

    it.each`
      Name      | Calendar
      ${'v3'}   | ${Calendar}
    `('$Name selects a date on click (controlled)', async ({Calendar}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let onChange = jest.fn();
      let {getByLabelText, getByText} = render(
        <Calendar
          value={new CalendarDate(2019, 6, 5)}
          onChange={onChange} />
      );

      let newDate = getByText('17');
      await user.click(newDate);

      let selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('5');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toEqual(new CalendarDate(2019, 6, 17));
    });

    it.each`
      Name      | Calendar      | props
      ${'v3'}   | ${Calendar}   | ${{isDisabled: true}}
    `('$Name does not select a date on click if isDisabled', async ({Calendar, props}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(
        <Calendar
          value={new CalendarDate(2019, 6, 5)}
          onChange={onChange}
          {...props} />
      );

      let newDate = getByText('17');
      await user.click(newDate);

      expect(() => {
        getAllByLabelText('selected', {exact: false});
      }).toThrow();
      expect(onChange).not.toHaveBeenCalled();
    });

    it.each`
      Name      | Calendar      | props
      ${'v3'}   | ${Calendar}   | ${{isReadOnly: true}}
    `('$Name does not select a date on click if isReadOnly', async ({Calendar, props}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let onChange = jest.fn();
      let {getByLabelText, getByText} = render(
        <Calendar
          value={new CalendarDate(2019, 6, 5)}
          onChange={onChange}
          {...props} />
      );

      let newDate = getByText('17');
      await user.click(newDate);

      let selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('5');
      expect(onChange).not.toHaveBeenCalled();
    });

    it.each`
      Name      | Calendar      | props
      ${'v3'}   | ${Calendar}   | ${{defaultValue: new CalendarDate(2019, 2, 8), minValue: new CalendarDate(2019, 2, 5), maxValue: new CalendarDate(2019, 2, 15)}}
    `('$Name does not select a date on click if outside the valid date range', async ({Calendar, props}) => {
      let user = userEvent.setup({delay: null, pointerMap});
      let onChange = jest.fn();
      let {getByLabelText} = render(
        <Calendar
          onChange={onChange}
          {...props} />
      );

      await user.click(getByLabelText('Sunday, February 3, 2019'));

      let selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('8');
      expect(onChange).not.toHaveBeenCalled();

      await user.click(getByLabelText('Sunday, February 17, 2019'));

      selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('8');
      expect(onChange).not.toHaveBeenCalled();

      await user.click(getByLabelText('Tuesday, February 5, 2019, First available date'));

      selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('5');
      expect(onChange).toHaveBeenCalledTimes(1);

      await user.click(getByLabelText('Friday, February 15, 2019, Last available date'));

      selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate.textContent).toBe('15');
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('should support invalid state', () => {
      let {getByRole} = render(
        <Calendar
          defaultValue={new CalendarDate(2022, 3, 11)}
          isInvalid />
      );

      let cell = getByRole('button', {name: 'Friday, March 11, 2022 selected'});
      expect(cell).toHaveAttribute('aria-invalid', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-invalid', 'true');

      let description = cell.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ');
      expect(description).toBe('Selected date unavailable.');
    });

    it('should support a custom errorMessage', () => {
      let {getByRole} = render(
        <Calendar
          defaultValue={new CalendarDate(2022, 3, 11)}
          isInvalid
          errorMessage="Selection dates cannot include weekends." />
      );

      let cell = getByRole('button', {name: 'Friday, March 11, 2022 selected'});
      expect(cell).toHaveAttribute('aria-invalid', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-invalid', 'true');

      let description = cell.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ');
      expect(description).toBe('Selection dates cannot include weekends.');
    });

    it('does not show error message without isInvalid', () => {
      let {getByRole} = render(
        <Calendar
          defaultValue={new CalendarDate(2022, 3, 11)}
          errorMessage="Selection dates cannot include weekends." />
      );

      let cell = getByRole('button', {name: 'Friday, March 11, 2022 selected'});
      expect(cell).not.toHaveAttribute('aria-invalid', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
      expect(cell.parentElement).not.toHaveAttribute('aria-invalid', 'true');
    });

    it('automatically marks selection as invalid using isDateUnavailable', () => {
      function Example() {
        let {locale} = useLocale();
        return (
          <Calendar
            defaultValue={new CalendarDate(2022, 3, 5)}
            isDateUnavailable={date => isWeekend(date, locale)}
            allowsNonContiguousRanges />
        );
      }

      let {getByRole} = render(<Example />);

      let cell = getByRole('button', {name: 'Saturday, March 5, 2022 selected'});
      expect(cell).toHaveAttribute('aria-invalid', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-invalid', 'true');

      let description = cell.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ');
      expect(description).toBe('Selected date unavailable.');
    });
  });

  describe('announcing', () => {
    it('announces when the current month changes', async () => {
      let user = userEvent.setup({delay: null, pointerMap});
      let {getAllByLabelText} = render(<Calendar defaultValue={new CalendarDate(2019, 6, 5)} />);

      let nextButton = getAllByLabelText('Next')[0];
      await user.click(nextButton);
      act(() => {jest.runAllTimers();});

      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('July 2019');
    });

    it('announces when the selected date changes', async () => {
      let user = userEvent.setup({delay: null, pointerMap});
      let {getByText} = render(<Calendar defaultValue={new CalendarDate(2019, 6, 5)} />);

      let newDate = getByText('17');
      await user.click(newDate);
      act(() => {jest.runAllTimers();});

      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('Selected Date: Monday, June 17, 2019', 'polite', 4000);
    });

    it('ensures that the active descendant is announced when the focused date changes', async () => {
      let user = userEvent.setup({delay: null, pointerMap});
      let {getByLabelText} = render(<Calendar defaultValue={new CalendarDate(2019, 6, 5)} autoFocus />);

      let selectedDate = getByLabelText('selected', {exact: false});
      expect(selectedDate).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      act(() => {jest.runAllTimers();});
      expect(getByLabelText('Thursday, June 6, 2019', {exact: false})).toHaveFocus();
    });

    it('includes era in BC dates', async () => {
      let user = userEvent.setup({delay: null, pointerMap});
      let {getByText, getAllByLabelText} = render(<Calendar defaultValue={new CalendarDate('BC', 5, 2, 3)} />);

      let newDate = getByText('17');
      await user.click(newDate);
      act(() => {jest.runAllTimers();});

      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('Selected Date: Saturday, February 17, 5 BC', 'polite', 4000);

      announce.mockReset();
      let nextButton = getAllByLabelText('Next')[0];
      await user.click(nextButton);
      act(() => {jest.runAllTimers();});

      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('March 5 BC');
    });
  });
});
