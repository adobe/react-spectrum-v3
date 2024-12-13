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

jest.mock('@react-aria/live-announcer');
import {act, fireEvent, installPointerEvent, pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import {announce} from '@react-aria/live-announcer';
import {CalendarDate, isWeekend} from '@internationalized/date';
import {RangeCalendar} from '../';
import React from 'react';
import {useLocale} from '@react-aria/i18n';
import userEvent from '@testing-library/user-event';

let cellFormatter = new Intl.DateTimeFormat('en-US', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});

describe('RangeCalendar', () => {
  /** @type {ReturnType<typeof userEvent['setup']>} */
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });
  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
  });

  describe('basics', () => {
    it.each`
      Name          | RangeCalendar    | props
      ${'v3'}       | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}}
    `('$Name should render a calendar with a defaultValue', ({RangeCalendar, props}) => {
      let {getAllByLabelText, getByRole, getAllByRole} = render(<RangeCalendar {...props} />);

      let heading = getByRole('heading');
      expect(heading).toHaveTextContent('June 2019');

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(30);

      let selectedDates = getAllByLabelText('Selected', {exact: false});
      let labels = [
        'Selected Range: Wednesday, June 5 to Monday, June 10, 2019, Wednesday, June 5, 2019 selected',
        'Thursday, June 6, 2019 selected',
        'Friday, June 7, 2019 selected',
        'Saturday, June 8, 2019 selected',
        'Sunday, June 9, 2019 selected',
        'Selected Range: Wednesday, June 5 to Monday, June 10, 2019, Monday, June 10, 2019 selected'
      ];
      expect(selectedDates.length).toBe(6);

      let i = 0;
      for (let cell of selectedDates) {
        expect(cell.parentElement).toHaveAttribute('role', 'gridcell');
        expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
        expect(cell).toHaveAttribute('aria-label', labels[i++]);
      }
    });

    it.each`
      Name          | RangeCalendar    | props
      ${'v3'}       | ${RangeCalendar} | ${{value: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}}
    `('$Name should render a calendar with a value', ({RangeCalendar, props}) => {
      let {getAllByLabelText, getByRole, getAllByRole} = render(<RangeCalendar {...props} />);

      let heading = getByRole('heading');
      expect(heading).toHaveTextContent('June 2019');

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(30);

      let selectedDates = getAllByLabelText('Selected', {exact: false});
      let labels = [
        'Selected Range: Wednesday, June 5 to Monday, June 10, 2019, Wednesday, June 5, 2019 selected',
        'Thursday, June 6, 2019 selected',
        'Friday, June 7, 2019 selected',
        'Saturday, June 8, 2019 selected',
        'Sunday, June 9, 2019 selected',
        'Selected Range: Wednesday, June 5 to Monday, June 10, 2019, Monday, June 10, 2019 selected'
      ];
      expect(selectedDates.length).toBe(6);

      let i = 0;
      for (let cell of selectedDates) {
        expect(cell.parentElement).toHaveAttribute('role', 'gridcell');
        expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
        expect(cell).toHaveAttribute('aria-label', labels[i++]);
      }
    });

    it.each`
      Name          | RangeCalendar    | props
      ${'v3'}       | ${RangeCalendar} | ${{value: {start: new CalendarDate(2019, 2, 3), end: new CalendarDate(2019, 2, 18)}}}
    `('$Name should focus the first selected date if autoFocus is set', ({RangeCalendar, props}) => {
      let {getByRole, getAllByLabelText} = render(<RangeCalendar {...props} autoFocus />);

      let cells = getAllByLabelText('selected', {exact: false});
      let grid = getByRole('grid');

      expect(cells[0].parentElement).toHaveAttribute('role', 'gridcell');
      expect(cells[0].parentElement).toHaveAttribute('aria-selected', 'true');
      expect(cells[0]).toHaveFocus();
      expect(grid).not.toHaveAttribute('aria-activedescendant');
    });

    it('should show selected dates across multiple months', async () => {
      let {getByRole, getByLabelText, getAllByLabelText, getAllByRole} = render(<RangeCalendar value={{start: new CalendarDate(2019, 6, 20), end: new CalendarDate(2019, 7, 10)}} />);

      let heading = getByRole('heading');
      expect(heading).toHaveTextContent('June 2019');

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(30);

      let selected = getAllByLabelText('selected', {exact: false}).filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(selected.length).toBe(11);
      let juneLabels = [
        'Selected Range: Thursday, June 20 to Wednesday, July 10, 2019, Thursday, June 20, 2019 selected',
        'Friday, June 21, 2019 selected',
        'Saturday, June 22, 2019 selected',
        'Sunday, June 23, 2019 selected',
        'Monday, June 24, 2019 selected',
        'Tuesday, June 25, 2019 selected',
        'Wednesday, June 26, 2019 selected',
        'Thursday, June 27, 2019 selected',
        'Friday, June 28, 2019 selected',
        'Saturday, June 29, 2019 selected',
        'Sunday, June 30, 2019 selected'
      ];

      let i = 0;
      for (let cell of selected) {
        expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
        expect(cell).toHaveAttribute('aria-label', juneLabels[i++]);
      }

      let nextButton = getAllByLabelText('Next')[0];
      await user.click(nextButton);

      selected = getAllByLabelText('selected', {exact: false}).filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(selected.length).toBe(10);
      let julyLabels = [
        'Monday, July 1, 2019 selected',
        'Tuesday, July 2, 2019 selected',
        'Wednesday, July 3, 2019 selected',
        'Thursday, July 4, 2019 selected',
        'Friday, July 5, 2019 selected',
        'Saturday, July 6, 2019 selected',
        'Sunday, July 7, 2019 selected',
        'Monday, July 8, 2019 selected',
        'Tuesday, July 9, 2019 selected',
        'Selected Range: Thursday, June 20 to Wednesday, July 10, 2019, Wednesday, July 10, 2019 selected'
      ];

      i = 0;
      for (let cell of selected) {
        expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
        expect(cell).toHaveAttribute('aria-label', julyLabels[i++]);
      }

      expect(heading).toHaveTextContent('July 2019');
      gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(31);

      expect(nextButton).toHaveFocus();

      let prevButton = getByLabelText('Previous');
      await user.click(prevButton);

      expect(heading).toHaveTextContent('June 2019');
      gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(30);

      selected = getAllByLabelText('selected', {exact: false}).filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(selected.length).toBe(11);
      i = 0;
      for (let cell of selected) {
        expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
        expect(cell).toHaveAttribute('aria-label', juneLabels[i++]);
      }

      expect(prevButton).toHaveFocus();
    });

    it('should center the selected range if multiple months are visible', () => {
      let {getAllByRole, getAllByLabelText} = render(<RangeCalendar value={{start: new CalendarDate(2019, 2, 3), end: new CalendarDate(2019, 2, 10)}} visibleMonths={3} />);

      let grids = getAllByRole('grid');
      expect(grids).toHaveLength(3);

      let cells = getAllByLabelText('selected', {exact: false});
      expect(cells.every(cell => grids[1].contains(cell))).toBe(true);
    });

    it('should constrain the visible region depending on the minValue', () => {
      let {getAllByRole, getAllByLabelText} = render(<RangeCalendar value={{start: new CalendarDate(2019, 2, 3), end: new CalendarDate(2019, 2, 10)}} minValue={new CalendarDate(2019, 2, 1)} visibleMonths={3} />);

      let grids = getAllByRole('grid');
      expect(grids).toHaveLength(3);

      let cells = getAllByLabelText('selected', {exact: false});
      expect(cells.every(cell => grids[0].contains(cell))).toBe(true);
    });

    it('should start align the selected range if it would go out of view when centered', () => {
      let {getAllByRole, getAllByLabelText} = render(<RangeCalendar value={{start: new CalendarDate(2019, 1, 3), end: new CalendarDate(2019, 3, 10)}} visibleMonths={3} />);

      let grids = getAllByRole('grid');
      expect(grids).toHaveLength(3);

      let cells = getAllByLabelText('selected', {exact: false});
      expect(grids[0].contains(cells[0])).toBe(true);
    });

    it('should show era for BC dates', () => {
      let {getAllByLabelText} = render(<RangeCalendar value={{start: new CalendarDate('BC', 1, 12, 14), end: new CalendarDate(1, 1, 22)}} />);
      let cell = getAllByLabelText('selected', {exact: false})[0];
      expect(cell).toHaveAttribute('aria-label', 'Selected Range: Thursday, December 14, 1 BC to Monday, January 22, 1 AD, Thursday, December 14, 1 BC selected');
    });
  });

  describe('selection', () => {
    it.each`
      Name          | RangeCalendar    | props
      ${'v3'}       | ${RangeCalendar} | ${{}}
    `('$Name adds a range selection prompt to the focused cell', ({RangeCalendar, props}) => {
      let {getByRole, getByLabelText} = render(<RangeCalendar {...props} autoFocus />);

      let grid = getByRole('grid');
      let cell = getByLabelText('today', {exact: false});
      expect(grid).not.toHaveAttribute('aria-activedescendant');
      expect(cell).toHaveAttribute('aria-label', `Today, ${cellFormatter.format(new Date())}`);
      expect(cell).toHaveAttribute('aria-describedby');
      expect(document.getElementById(cell.getAttribute('aria-describedby'))).toHaveTextContent('Click to start selecting date range');

      // enter selection mode
      fireEvent.keyDown(grid, {key: 'Enter'});
      expect(grid).not.toHaveAttribute('aria-activedescendant');
      expect(cell.parentElement).toHaveAttribute('aria-selected');
      expect(cell).toHaveAttribute('aria-label', `Today, ${cellFormatter.format(new Date())} selected`);
      expect(cell).toHaveAttribute('aria-describedby');
      expect(document.getElementById(cell.getAttribute('aria-describedby'))).toHaveTextContent('Click to finish selecting date range');
    });

    it.each`
      Name          | RangeCalendar    | props
      ${'v3'}       | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}}
    `('$Name can select a range with the keyboard (uncontrolled)', async ({RangeCalendar, props}) => {
      let onChange = jest.fn();
      let {getAllByLabelText} = render(
        <RangeCalendar
          {...props}
          autoFocus
          onChange={onChange} />
      );

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('5');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('10');

      // Select a new date
      await user.keyboard('{ArrowLeft}');

      // Begin selecting
      await user.keyboard('{Enter}');

      // Auto advances by one day
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('4');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('5');
      expect(onChange).toHaveBeenCalledTimes(0);

      // Move focus
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('4');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('9');
      expect(onChange).toHaveBeenCalledTimes(0);

      // End selection
      await user.keyboard('[Space]');
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('4'); // uncontrolled
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('9');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 4));
      expect(end).toEqual(new CalendarDate(2019, 6, 9));
    });

    it.each`
      Name          | RangeCalendar    | props
      ${'v3'}       | ${RangeCalendar} | ${{value: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}}
    `('$Name can select a range with the keyboard (controlled)', async ({RangeCalendar, props}) => {
      let onChange = jest.fn();
      let {getAllByLabelText} = render(
        <RangeCalendar
          {...props}
          autoFocus
          onChange={onChange} />
      );

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('5');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('10');

      // Select a new date
      await user.keyboard('{ArrowLeft}');

      // Begin selecting
      await user.keyboard('{Enter}');

      // Auto advances by one day
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('4');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('5');
      expect(onChange).toHaveBeenCalledTimes(0);

      // Move focus
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('4');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('9');
      expect(onChange).toHaveBeenCalledTimes(0);

      // End selection
      await user.keyboard('[Space]');
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('5'); // controlled
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('10');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 4));
      expect(end).toEqual(new CalendarDate(2019, 6, 9));
    });

    it('does not enter selection mode with the keyboard if isReadOnly', async () => {
      let {getByRole, getByLabelText} = render(<RangeCalendar isReadOnly autoFocus />);

      let grid = getByRole('grid');
      let cell = getByLabelText('today', {exact: false});
      expect(grid).not.toHaveAttribute('aria-activedescendant');
      expect(cell).toHaveAttribute('aria-label', `Today, ${cellFormatter.format(new Date())}`);
      expect(document.activeElement).toBe(cell);

      // try to enter selection mode
      await user.keyboard('{Enter}');
      expect(grid).not.toHaveAttribute('aria-activedescendant');
      expect(cell.parentElement).not.toHaveAttribute('aria-selected');
      expect(cell).toHaveAttribute('aria-label', `Today, ${cellFormatter.format(new Date())}`);
      expect(document.activeElement).toBe(cell);
    });

    it.each`
      Name          | RangeCalendar    | props
      ${'v3'}       | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}}
    `('$Name selects a range with the mouse (uncontrolled)', async ({RangeCalendar, props}) => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(
        <RangeCalendar
          {...props}
          onChange={onChange} />
      );

      await user.click(getByText('17'));

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('17');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('17');
      expect(onChange).toHaveBeenCalledTimes(0);

      // hovering updates the highlighted dates
      fireEvent.pointerEnter(getByText('10').parentElement);
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('17');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.pointerEnter(getByText('7').parentElement);
      await user.click(getByText('7'));

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('7'); // uncontrolled
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('17');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 7));
      expect(end).toEqual(new CalendarDate(2019, 6, 17));
    });

    it.each`
      Name          | RangeCalendar    | props
      ${'v3'}       | ${RangeCalendar} | ${{value: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}}
    `('$Name selects a range with the mouse (controlled)', async ({RangeCalendar, props}) => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(
        <RangeCalendar
          {...props}
          onChange={onChange} />
      );

      await user.click(getByText('17'));

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('17');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('17');
      expect(onChange).toHaveBeenCalledTimes(0);

      // hovering updates the highlighted dates
      fireEvent.pointerEnter(getByText('10'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('17');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.pointerEnter(getByText('7'));
      await user.click(getByText('7'));

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('5'); // controlled
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('10');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 7));
      expect(end).toEqual(new CalendarDate(2019, 6, 17));
    });

    it('selects by dragging with the mouse', () => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(<RangeCalendar onChange={onChange} defaultValue={{start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}} />);

      fireEvent.mouseDown(getByText('17'), {detail: 1});

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('17');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('17');
      expect(onChange).toHaveBeenCalledTimes(0);

      // dragging updates the highlighted dates
      fireEvent.pointerEnter(getByText('18'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('17');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('18');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.pointerEnter(getByText('23'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('17');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('23');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.mouseUp(getByText('23'), {detail: 1});

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('17');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('23');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 17));
      expect(end).toEqual(new CalendarDate(2019, 6, 23));
    });

    it('allows dragging the start of the highlighted range to modify it', () => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(<RangeCalendar onChange={onChange} defaultValue={{start: new CalendarDate(2019, 6, 10), end: new CalendarDate(2019, 6, 20)}} />);

      fireEvent.mouseDown(getByText('10'), {detail: 1});

      // mouse down on a range end should not reset it
      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
      expect(onChange).toHaveBeenCalledTimes(0);

      // dragging updates the highlighted dates
      fireEvent.pointerEnter(getByText('11'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('11');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.pointerEnter(getByText('8'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('8');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.mouseUp(getByText('8'), {detail: 1});

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('8');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 8));
      expect(end).toEqual(new CalendarDate(2019, 6, 20));
    });

    it('allows dragging the end of the highlighted range to modify it', () => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(<RangeCalendar onChange={onChange} defaultValue={{start: new CalendarDate(2019, 6, 10), end: new CalendarDate(2019, 6, 20)}} />);

      fireEvent.mouseDown(getByText('20'), {detail: 1});

      // mouse down on a range end should not reset it
      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
      expect(onChange).toHaveBeenCalledTimes(0);

      // dragging updates the highlighted dates
      fireEvent.pointerEnter(getByText('21'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('21');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.pointerEnter(getByText('19'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('19');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.mouseUp(getByText('19'), {detail: 1});

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('19');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 10));
      expect(end).toEqual(new CalendarDate(2019, 6, 19));
    });

    it('releasing drag outside calendar commits it', () => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(<RangeCalendar onChange={onChange} defaultValue={{start: new CalendarDate(2019, 6, 10), end: new CalendarDate(2019, 6, 20)}} />);

      fireEvent.mouseDown(getByText('22'), {detail: 1});

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('22');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('22');
      expect(onChange).toHaveBeenCalledTimes(0);

      // dragging updates the highlighted dates
      fireEvent.pointerEnter(getByText('25'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('22');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('25');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.pointerUp(document.body);

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('22');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('25');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 22));
      expect(end).toEqual(new CalendarDate(2019, 6, 25));
    });

    describe('touch', () => {
      installPointerEvent();

      it('selects by dragging with touch', () => {
        let onChange = jest.fn();
        let {getAllByLabelText, getByText} = render(<RangeCalendar onChange={onChange} defaultValue={{start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}} />);

        fireEvent.pointerDown(getByText('17'), {pointerType: 'touch'});

        // There is a delay to distinguish between dragging and scrolling
        let selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates).toHaveLength(6);

        act(() => jest.advanceTimersByTime(300));

        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates).toHaveLength(1);
        expect(selectedDates[0].textContent).toBe('17');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('17');
        expect(onChange).toHaveBeenCalledTimes(0);

        // dragging updates the highlighted dates
        fireEvent.pointerEnter(getByText('18'));
        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('17');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('18');
        expect(onChange).toHaveBeenCalledTimes(0);

        fireEvent.pointerEnter(getByText('23'));
        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('17');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('23');
        expect(onChange).toHaveBeenCalledTimes(0);

        fireEvent.pointerUp(getByText('23'), {pointerType: 'touch'});

        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('17');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('23');
        expect(onChange).toHaveBeenCalledTimes(1);

        let {start, end} = onChange.mock.calls[0][0];
        expect(start).toEqual(new CalendarDate(2019, 6, 17));
        expect(end).toEqual(new CalendarDate(2019, 6, 23));
      });

      it('does not allow dragging the end of an invalid range', async () => {
        let onChange = jest.fn();
        let {getAllByLabelText, getByText} = render(<RangeCalendar isInvalid onChange={onChange} defaultValue={{start: new CalendarDate(2019, 6, 10), end: new CalendarDate(2019, 6, 20)}} />);

        fireEvent.pointerDown(getByText('20'), {pointerType: 'touch'});

        let selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('10');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
        expect(onChange).toHaveBeenCalledTimes(0);

        fireEvent.pointerEnter(getByText('21'));
        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('10');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
        expect(onChange).toHaveBeenCalledTimes(0);

        fireEvent.pointerEnter(getByText('19'));
        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('10');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
        expect(onChange).toHaveBeenCalledTimes(0);

        fireEvent.pointerUp(getByText('19'), {pointerType: 'touch', clientX: 100, clientY: 100});

        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('10');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
        expect(onChange).toHaveBeenCalledTimes(0);

        // Can click to select range
        let cell15 = getByText('15');
        // TODO: fix that this doesn't work with await user.click()
        fireEvent.pointerDown(cell15, {detail: 1, pointerType: 'mouse'});
        fireEvent.pointerUp(cell15, {detail: 1, pointerType: 'mouse'});
        fireEvent.click(cell15, {detail: 1, pointerType: 'mouse'});
        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('15');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('15');
        expect(onChange).toHaveBeenCalledTimes(0);

        let cell20 = getByText('20');
        fireEvent.pointerDown(cell20, {detail: 1, pointerType: 'mouse'});
        fireEvent.pointerUp(cell20, {detail: 1, pointerType: 'mouse'});
        fireEvent.click(cell20, {detail: 1, pointerType: 'mouse'});
        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('15');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
        expect(onChange).toHaveBeenCalledTimes(1);

        let {start, end} = onChange.mock.calls[0][0];
        expect(start).toEqual(new CalendarDate(2019, 6, 15));
        expect(end).toEqual(new CalendarDate(2019, 6, 20));
      });

      it('selection isn\'t prematurely finalized when touching a day cell to scroll through the calendar', async () => {
        let onChange = jest.fn();

        let {getAllByLabelText, getByText} = render(
          <RangeCalendar
            defaultValue={{
              start: new CalendarDate(2019, 6, 15),
              end: new CalendarDate(2019, 6, 20)
            }}
            onChange={onChange} />
        );

        // start a range selection
        await user.click(getByText('23'));
        let selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('23');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('23');
        expect(onChange).toHaveBeenCalledTimes(0);

        // scroll through the calendar
        // simulate touch scroll by touch-move on a day
        let dayEl = getByText('10');
        fireEvent.pointerDown(dayEl, {pointerType: 'touch'});
        fireEvent.pointerCancel(dayEl, {pointerType: 'touch'});

        // finalize selection
        await user.click(getByText('25'));
        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('23');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('25');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({
          start: new CalendarDate(2019, 6, 23),
          end: new CalendarDate(2019, 6, 25)
        });
      });

      it('selection isn\'t prematurely finalized when touching a disabled day cell to scroll through the calendar', async () => {
        let onChange = jest.fn();

        let {getAllByLabelText, getByText} = render(
          <RangeCalendar
            defaultValue={{
              start: new CalendarDate(2019, 6, 15),
              end: new CalendarDate(2019, 6, 20)
            }}
            onChange={onChange} />
        );

        // start a range selection
        await user.click(getByText('23'));
        let selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('23');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('23');
        expect(onChange).toHaveBeenCalledTimes(0);

        // scroll through the calendar
        // simulate touch scroll by touch-move on a disabled day (May 31)
        let disabledDayEl = getByText('31');
        fireEvent.pointerDown(disabledDayEl, {pointerType: 'touch'});
        fireEvent.pointerCancel(disabledDayEl, {pointerType: 'touch'});

        // finalize selection
        await user.click(getByText('25'));
        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('23');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('25');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({
          start: new CalendarDate(2019, 6, 23),
          end: new CalendarDate(2019, 6, 25)
        });
      });

      it('selection isn\'t prematurely finalized when touching a weekday header to scroll through the calendar', async () => {
        let onChange = jest.fn();

        let {getAllByLabelText, getByText} = render(
          <RangeCalendar
            defaultValue={{
              start: new CalendarDate(2019, 6, 15),
              end: new CalendarDate(2019, 6, 20)
            }}
            onChange={onChange} />
        );

        // start a range selection
        await user.click(getByText('23'));
        let selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('23');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('23');
        expect(onChange).toHaveBeenCalledTimes(0);

        // scroll through the calendar
        // simulate touch scroll by touch-move on a weekday
        let weekdayEl = getByText('M');
        fireEvent.pointerDown(weekdayEl, {pointerType: 'touch'});
        fireEvent.pointerCancel(weekdayEl, {pointerType: 'touch'});

        // finalize selection
        await user.click(getByText('25'));
        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('23');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('25');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({
          start: new CalendarDate(2019, 6, 23),
          end: new CalendarDate(2019, 6, 25)
        });
      });

      it('selection isn\'t prematurely finalized when touching the header to scroll through the calendar', async () => {
        let onChange = jest.fn();

        let {getAllByLabelText, getByText, getByRole} = render(
          <RangeCalendar
            defaultValue={{
              start: new CalendarDate(2019, 6, 15),
              end: new CalendarDate(2019, 6, 20)
            }}
            onChange={onChange} />
        );

        // start a range selection
        await user.click(getByText('23'));
        let selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('23');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('23');
        expect(onChange).toHaveBeenCalledTimes(0);

        // scroll through the calendar
        // simulate touch scroll by touch-move on heading
        let headingEl = getByRole('heading');
        fireEvent.pointerDown(headingEl, {pointerType: 'touch'});
        fireEvent.pointerCancel(headingEl, {pointerType: 'touch'});

        // finalize selection
        await user.click(getByText('25'));
        selectedDates = getAllByLabelText('selected', {exact: false});
        expect(selectedDates[0].textContent).toBe('23');
        expect(selectedDates[selectedDates.length - 1].textContent).toBe('25');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({
          start: new CalendarDate(2019, 6, 23),
          end: new CalendarDate(2019, 6, 25)
        });
      });
    });

    it('clicking outside calendar commits selection', async () => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(<RangeCalendar onChange={onChange} defaultValue={{start: new CalendarDate(2019, 6, 10), end: new CalendarDate(2019, 6, 20)}} />);

      await user.click(getByText('22'));

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('22');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('22');
      expect(onChange).toHaveBeenCalledTimes(0);

      // hovering updates the highlighted dates
      fireEvent.pointerEnter(getByText('25'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('22');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('25');
      expect(onChange).toHaveBeenCalledTimes(0);

      await user.click(document.body);

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('22');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('25');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 22));
      expect(end).toEqual(new CalendarDate(2019, 6, 25));
    });

    it('clicking on next/previous buttons does not commit selection', async () => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(<RangeCalendar onChange={onChange} defaultValue={{start: new CalendarDate(2019, 6, 10), end: new CalendarDate(2019, 6, 20)}} />);

      await user.click(getByText('22'));

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('22');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('22');
      expect(onChange).toHaveBeenCalledTimes(0);

      // hovering updates the highlighted dates
      fireEvent.pointerEnter(getByText('25'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('22');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('25');
      expect(onChange).toHaveBeenCalledTimes(0);

      let next = getAllByLabelText('Next')[0];
      await user.click(next);

      selectedDates = getAllByLabelText('selected', {exact: false}).filter(d => !d.hasAttribute('aria-disabled'));
      expect(selectedDates[0].textContent).toBe('1');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('25');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.pointerEnter(getByText('10'));
      selectedDates = getAllByLabelText('selected', {exact: false}).filter(d => !d.hasAttribute('aria-disabled'));
      expect(selectedDates[0].textContent).toBe('1');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('10');
      expect(onChange).toHaveBeenCalledTimes(0);

      await user.click(getByText('10').parentElement);
      selectedDates = getAllByLabelText('selected', {exact: false}).filter(d => !d.hasAttribute('aria-disabled'));
      expect(selectedDates[0].textContent).toBe('1');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('10');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 22));
      expect(end).toEqual(new CalendarDate(2019, 7, 10));
    });

    it('clicking on the start of the highlighted range starts a new selection', async () => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(<RangeCalendar onChange={onChange} defaultValue={{start: new CalendarDate(2019, 6, 10), end: new CalendarDate(2019, 6, 20)}} />);

      fireEvent.mouseDown(getByText('10'), {detail: 1});

      // mouse down on a range end should not reset it
      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
      expect(onChange).toHaveBeenCalledTimes(0);

      // mouse up should
      fireEvent.mouseUp(getByText('10'), {detail: 1});
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('10');
      expect(onChange).toHaveBeenCalledTimes(0);

      // hovering updates the highlighted dates
      fireEvent.pointerEnter(getByText('11'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('11');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.pointerEnter(getByText('12'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('12');
      expect(onChange).toHaveBeenCalledTimes(0);

      await user.click(getByText('12'));

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('12');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 10));
      expect(end).toEqual(new CalendarDate(2019, 6, 12));
    });

    it('clicking on the end of the highlighted range starts a new selection', async () => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(<RangeCalendar onChange={onChange} defaultValue={{start: new CalendarDate(2019, 6, 10), end: new CalendarDate(2019, 6, 20)}} />);

      fireEvent.mouseDown(getByText('20'), {detail: 1});

      // mouse down on a range end should not reset it
      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
      expect(onChange).toHaveBeenCalledTimes(0);

      // mouse up should
      fireEvent.mouseUp(getByText('20'), {detail: 1});
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('20');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
      expect(onChange).toHaveBeenCalledTimes(0);

      // hovering updates the highlighted dates
      fireEvent.pointerEnter(getByText('19'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('19');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.pointerEnter(getByText('18'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('18');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
      expect(onChange).toHaveBeenCalledTimes(0);

      await user.click(getByText('18'));

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('18');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 18));
      expect(end).toEqual(new CalendarDate(2019, 6, 20));
    });

    it('mouse down in the middle of the highlighted range starts a new selection', async () => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(<RangeCalendar onChange={onChange} defaultValue={{start: new CalendarDate(2019, 6, 10), end: new CalendarDate(2019, 6, 20)}} />);

      fireEvent.mouseDown(getByText('15'), {detail: 1});

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('15');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('15');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.mouseUp(getByText('15'), {detail: 1});

      // hovering updates the highlighted dates
      fireEvent.pointerEnter(getByText('16'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('15');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('16');
      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.pointerEnter(getByText('17'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('15');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('17');
      expect(onChange).toHaveBeenCalledTimes(0);

      await user.click(getByText('17'));

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('15');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('17');
      expect(onChange).toHaveBeenCalledTimes(1);

      let {start, end} = onChange.mock.calls[0][0];
      expect(start).toEqual(new CalendarDate(2019, 6, 15));
      expect(end).toEqual(new CalendarDate(2019, 6, 17));
    });

    it('does not enter selection mode with the mouse if isReadOnly', async () => {
      let {getByRole, getByLabelText, getByText} = render(<RangeCalendar isReadOnly autoFocus />);

      let grid = getByRole('grid');
      let cell = getByLabelText('today', {exact: false});
      expect(grid).not.toHaveAttribute('aria-activedescendant');
      expect(document.activeElement).toBe(cell);

      // try to enter selection mode
      cell = getByText('17').closest('[role="button"]');
      await user.click(cell);
      expect(grid).not.toHaveAttribute('aria-activedescendant');
      expect(cell.parentElement).not.toHaveAttribute('aria-selected');
    });

    it('does not enter selection mode with the mouse on range end if isReadOnly', async () => {
      let {getAllByLabelText, getByText} = render(<RangeCalendar isReadOnly autoFocus defaultValue={{start: new CalendarDate(2019, 6, 10), end: new CalendarDate(2019, 6, 20)}} />);

      let cell = getByText('10').closest('[role="button"]');
      expect(document.activeElement).toBe(cell);

      // try to enter selection mode
      await user.click(cell);
      expect(document.activeElement).toBe(cell);

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');

      cell = getByText('15').closest('[role="button"]');
      await user.click(cell);

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('20');
    });

    it.each`
      Name          | RangeCalendar    | props
      ${'v3'}       | ${RangeCalendar} | ${{isDisabled: true}}
    `('$Name does not select a date on click if isDisabled', async ({RangeCalendar, props}) => {
      let onChange = jest.fn();
      let {getAllByLabelText, getByText} = render(
        <RangeCalendar
          {...props}
          onChange={onChange} />
      );

      let newDate = getByText('17');
      await user.click(newDate);

      expect(() => {
        getAllByLabelText('selected', {exact: false});
      }).toThrow();
      expect(onChange).not.toHaveBeenCalled();
    });

    it.each`
      Name          | RangeCalendar    | props
      ${'v3'}       | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 2, 8), end: new CalendarDate(2019, 2, 15)}, minValue: new CalendarDate(2019, 2, 5), maxValue: new CalendarDate(2019, 2, 15)}}
    `('$Name does not select a date on click if outside the valid date range', async ({RangeCalendar, props}) => {
      let onChange = jest.fn();
      let {getByLabelText, getAllByLabelText} = render(
        <RangeCalendar
          onChange={onChange}
          {...props} />
      );

      await user.click(getByLabelText('Sunday, February 3, 2019'));

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('8');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('15');
      expect(onChange).not.toHaveBeenCalled();

      await user.click(getByLabelText('Sunday, February 17, 2019'));

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('8');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('15');
      expect(onChange).not.toHaveBeenCalled();

      await user.click(getByLabelText('Tuesday, February 5, 2019, First available date'));

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('5');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('5');
      expect(onChange).not.toHaveBeenCalled();

      await user.click(getByLabelText('Friday, February 15, 2019, Last available date'));

      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('5');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('15');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it.each`
      Name          | RangeCalendar    | props
      ${'v3'}       | ${RangeCalendar} | ${{value: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}}
    `('$Name cancels the selection when the escape key is pressed', async ({RangeCalendar, props}) => {
      let onChange = jest.fn();
      let {getByText, getAllByLabelText} = render(
        <RangeCalendar
          autoFocus
          onChange={onChange}
          {...props} />
      );

      // start a selection
      await user.click(getByText('17'));

      let selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('17');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('17');
      expect(onChange).not.toHaveBeenCalled();

      // highlight some dates
      fireEvent.pointerEnter(getByText('10'));
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('10');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('17');
      expect(onChange).not.toHaveBeenCalled();

      // Cancel
      await user.keyboard('{Escape}');

      // Should revert selection
      selectedDates = getAllByLabelText('selected', {exact: false});
      expect(selectedDates[0].textContent).toBe('5');
      expect(selectedDates[selectedDates.length - 1].textContent).toBe('10');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('disables dates not reachable from start date if isDateUnavailable is provided', async () => {
      const isDateUnavailable = (date) => {
        const disabledIntervals = [[new CalendarDate(2021, 12, 6), new CalendarDate(2021, 12, 10)], [new CalendarDate(2021, 12, 22), new CalendarDate(2021, 12, 26)]];
        return disabledIntervals.some((interval) => date.compare(interval[0]) >= 0 && date.compare(interval[1]) <= 0);
      };

      let {getByRole, getAllByLabelText} = render(
        <RangeCalendar
          defaultValue={{start: new CalendarDate(2021, 12, 15), end: new CalendarDate(2021, 12, 15)}}
          isDateUnavailable={isDateUnavailable} />
      );

      let cellBefore = getByRole('button', {name: 'Sunday, December 5, 2021'});
      let cellAfter = getByRole('button', {name: 'Monday, December 27, 2021'});
      expect(cellBefore).toHaveAttribute('tabIndex', '-1');
      expect(cellBefore).not.toHaveAttribute('aria-disabled');
      expect(cellAfter).toHaveAttribute('tabIndex', '-1');
      expect(cellAfter).not.toHaveAttribute('aria-disabled');

      let cell = getByRole('button', {name: 'Sunday, December 12, 2021'});
      await user.click(cell);

      expect(cellBefore).not.toHaveAttribute('tabIndex');
      expect(cellBefore).toHaveAttribute('aria-disabled', 'true');
      expect(cellAfter).not.toHaveAttribute('tabIndex');
      expect(cellAfter).toHaveAttribute('aria-disabled', 'true');

      let prevButton = getByRole('button', {name: 'Previous'});
      expect(prevButton).toHaveAttribute('disabled');

      let nextButton = getAllByLabelText('Next')[0];
      expect(nextButton).toHaveAttribute('disabled');

      cell = getByRole('button', {name: 'Tuesday, December 14, 2021'});
      await user.click(cell);

      expect(cellBefore).toHaveAttribute('tabIndex', '-1');
      expect(cellBefore).not.toHaveAttribute('aria-disabled');
      expect(cellAfter).toHaveAttribute('tabIndex', '-1');
      expect(cellAfter).not.toHaveAttribute('aria-disabled');

      expect(prevButton).not.toHaveAttribute('disabled');
      expect(nextButton).not.toHaveAttribute('disabled');

      // Clicking on one of the selected dates should also disable the dates outside the available range.
      cell = getByRole('button', {name: 'Selected Range: Sunday, December 12 to Tuesday, December 14, 2021, Sunday, December 12, 2021 selected'});
      await user.click(cell);

      expect(cellBefore).not.toHaveAttribute('tabIndex');
      expect(cellBefore).toHaveAttribute('aria-disabled', 'true');
      expect(cellAfter).not.toHaveAttribute('tabIndex');
      expect(cellAfter).toHaveAttribute('aria-disabled', 'true');
      expect(prevButton).toHaveAttribute('disabled');
      expect(nextButton).toHaveAttribute('disabled');
    });

    it('disables the previous button if the last day of the previous month is unavailable', async () => {
      const isDateUnavailable = (date) => {
        const disabledIntervals = [[new CalendarDate(2022, 4, 25), new CalendarDate(2022, 4, 30)]];
        return disabledIntervals.some((interval) => date.compare(interval[0]) >= 0 && date.compare(interval[1]) <= 0);
      };

      let {getByRole, getAllByLabelText} = render(
        <RangeCalendar
          defaultValue={{start: new CalendarDate(2022, 5, 10), end: new CalendarDate(2022, 5, 12)}}
          isDateUnavailable={isDateUnavailable} />
      );

      let cell = getByRole('button', {name: /Wednesday, May 4, 2022/});
      await user.click(cell);

      let prevButton = getByRole('button', {name: 'Previous'});
      expect(prevButton).toHaveAttribute('disabled');

      for (let nextButton of getAllByLabelText('Next')) {
        expect(nextButton).not.toHaveAttribute('disabled');
      }
    });

    it('disables the next button if the first day of the next month is unavailable', async () => {
      const isDateUnavailable = (date) => {
        const disabledIntervals = [[new CalendarDate(2022, 5, 1), new CalendarDate(2022, 5, 4)]];
        return disabledIntervals.some((interval) => date.compare(interval[0]) >= 0 && date.compare(interval[1]) <= 0);
      };

      let {getByRole, getAllByLabelText} = render(
        <RangeCalendar
          defaultValue={{start: new CalendarDate(2022, 4, 10), end: new CalendarDate(2022, 4, 12)}}
          isDateUnavailable={isDateUnavailable} />
      );

      let cell = getByRole('button', {name: /Thursday, April 28, 2022/});
      await user.click(cell);

      let prevButton = getByRole('button', {name: 'Previous'});
      expect(prevButton).not.toHaveAttribute('disabled');

      let nextButton = getAllByLabelText('Next')[0];
      expect(nextButton).toHaveAttribute('disabled');
    });

    it('updates the unavailable dates when navigating', async () => {
      const isDateUnavailable = (date) => {
        const disabledIntervals = [[new CalendarDate(2022, 5, 2), new CalendarDate(2022, 5, 4)]];
        return disabledIntervals.some((interval) => date.compare(interval[0]) >= 0 && date.compare(interval[1]) <= 0);
      };

      let {getByRole, getAllByLabelText} = render(
        <RangeCalendar
          defaultValue={{start: new CalendarDate(2022, 4, 10), end: new CalendarDate(2022, 4, 12)}}
          isDateUnavailable={isDateUnavailable} />
      );

      let cell = getByRole('button', {name: /Thursday, April 28, 2022/});
      await user.click(cell);

      let prevButton = getByRole('button', {name: 'Previous'});
      expect(prevButton).not.toHaveAttribute('disabled');

      for (let nextButton of getAllByLabelText('Next')) {
        expect(nextButton).not.toHaveAttribute('disabled');
      }

      await user.click(getAllByLabelText('Next')[0]);

      cell = getByRole('button', {name: 'Sunday, May 1, 2022 selected, Last available date'});
      expect(cell).not.toHaveAttribute('aria-disabled');
      expect(cell).toHaveAttribute('tabindex', '0');

      cell = getByRole('button', {name: /Monday, May 2, 2022/});
      expect(cell).toHaveAttribute('aria-disabled', 'true');
    });

    it('advances selection backwards when starting a selection at the end of an available range', async () => {
      const isDateUnavailable = (date) => {
        const disabledIntervals = [[new CalendarDate(2021, 12, 6), new CalendarDate(2021, 12, 10)], [new CalendarDate(2021, 12, 22), new CalendarDate(2021, 12, 26)]];
        return disabledIntervals.some((interval) => date.compare(interval[0]) >= 0 && date.compare(interval[1]) <= 0);
      };

      let {getByRole} = render(
        <RangeCalendar
          defaultValue={{start: new CalendarDate(2021, 12, 15), end: new CalendarDate(2021, 12, 15)}}
          isDateUnavailable={isDateUnavailable} />
      );

      let cell = getByRole('button', {name: 'Tuesday, December 21, 2021'});
      act(() => cell.focus());
      await user.keyboard('{Enter}');

      let cell2 = getByRole('button', {name: /Monday, December 20, 2021/});
      expect(document.activeElement).toBe(cell2);
      expect(cell2.parentElement).toHaveAttribute('aria-selected', 'true');
    });

    it('does not disable dates not reachable from start date if allowsNonContiguousRanges is provider', async () => {
      function Example() {
        let {locale} = useLocale();
        return (
          <RangeCalendar
            defaultValue={{start: new CalendarDate(2021, 12, 15), end: new CalendarDate(2021, 12, 15)}}
            isDateUnavailable={date => isWeekend(date, locale)}
            allowsNonContiguousRanges />
        );
      }

      let {getByRole} = render(<Example />);

      expect(getByRole('button', {name: 'Sunday, December 5, 2021'})).toHaveAttribute('aria-disabled', 'true');
      expect(getByRole('button', {name: 'Monday, December 6, 2021'})).not.toHaveAttribute('aria-disabled');

      let cell = getByRole('button', {name: 'Tuesday, December 7, 2021'});
      await user.click(cell);
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');

      expect(getByRole('button', {name: 'Monday, December 13, 2021'})).not.toHaveAttribute('aria-disabled');

      cell = getByRole('button', {name: 'Tuesday, December 14, 2021'});
      expect(cell).not.toHaveAttribute('aria-disabled');
      await user.click(cell);
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');

      expect(getByRole('button', {name: 'Sunday, December 5, 2021'}).parentElement).not.toHaveAttribute('aria-selected', 'true');
    });

    it('selects the nearest available date when blurring the calendar', async () => {
      let onChange = jest.fn();
      function Example() {
        let {locale} = useLocale();
        return (
          <RangeCalendar
            defaultValue={{start: new CalendarDate(2022, 3, 1), end: new CalendarDate(2022, 3, 5)}}
            isDateUnavailable={date => isWeekend(date, locale)}
            allowsNonContiguousRanges
            onChange={onChange} />
        );
      }

      let {getByRole} = render(<Example />);

      let cell = getByRole('button', {name: 'Wednesday, March 9, 2022'});
      await user.click(cell);
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');

      await user.keyboard('{PageDown}');

      cell = getByRole('button', {name: 'Saturday, April 9, 2022'});
      expect(document.activeElement).toBe(cell);
      expect(cell).toHaveAttribute('aria-disabled', 'true');
      expect(cell.parentElement).not.toHaveAttribute('aria-selected');

      act(() => cell.blur());

      expect(onChange).toHaveBeenCalledWith({start: new CalendarDate(2022, 3, 9), end: new CalendarDate(2022, 4, 8)});
    });

    it('should support invalid state', () => {
      let {getByRole} = render(
        <RangeCalendar
          defaultValue={{start: new CalendarDate(2022, 3, 10), end: new CalendarDate(2022, 3, 12)}}
          isInvalid />
      );

      let cell = getByRole('button', {name: 'Friday, March 11, 2022 selected'});
      expect(cell).toHaveAttribute('aria-invalid', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-invalid', 'true');

      let description = cell.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ');
      expect(description).toBe('Selected dates unavailable.');

      act(() => cell.focus());

      description = cell.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ');
      expect(description).toBe('Selected dates unavailable. Click to start selecting date range');
    });

    it('should support a custom errorMessage', () => {
      let {getByRole} = render(
        <RangeCalendar
          defaultValue={{start: new CalendarDate(2022, 3, 10), end: new CalendarDate(2022, 3, 12)}}
          isInvalid
          errorMessage="Selection dates cannot include weekends." />
      );

      let cell = getByRole('button', {name: 'Friday, March 11, 2022 selected'});
      expect(cell).toHaveAttribute('aria-invalid', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-invalid', 'true');

      let description = cell.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ');
      expect(description).toBe('Selection dates cannot include weekends.');

      act(() => cell.focus());

      description = cell.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ');
      expect(description).toBe('Selection dates cannot include weekends. Click to start selecting date range');
    });

    it('does not show error message without isInvalid', () => {
      let {getByRole} = render(
        <RangeCalendar
          defaultValue={{start: new CalendarDate(2022, 3, 10), end: new CalendarDate(2022, 3, 12)}}
          errorMessage="Selection dates cannot include weekends." />
      );

      let cell = getByRole('button', {name: 'Friday, March 11, 2022 selected'});
      expect(cell).not.toHaveAttribute('aria-invalid', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
      expect(cell.parentElement).not.toHaveAttribute('aria-invalid', 'true');

      expect(cell).not.toHaveAttribute('aria-describedby');
      act(() => cell.focus());

      let description = cell.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ');
      expect(description).toBe('Click to start selecting date range');
    });

    it('automatically marks selection as invalid using isDateUnavailable', () => {
      function Example() {
        let {locale} = useLocale();
        return (
          <RangeCalendar
            defaultValue={{start: new CalendarDate(2022, 3, 1), end: new CalendarDate(2022, 3, 5)}}
            isDateUnavailable={date => isWeekend(date, locale)}
            allowsNonContiguousRanges />
        );
      }

      let {getByRole} = render(<Example />);

      let cell = getByRole('button', {name: 'Friday, March 4, 2022 selected'});
      expect(cell).toHaveAttribute('aria-invalid', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
      expect(cell.parentElement).toHaveAttribute('aria-invalid', 'true');

      let description = cell.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ');
      expect(description).toBe('Selected dates unavailable.');

      act(() => cell.focus());

      description = cell.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ');
      expect(description).toBe('Selected dates unavailable. Click to start selecting date range');
    });
  });

  // These tests only work against v3
  describe('announcing', () => {
    it('announces when the current month changes', async () => {
      let {getAllByLabelText} = render(<RangeCalendar defaultValue={{start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}} />);

      let nextButton = getAllByLabelText('Next')[0];
      await user.click(nextButton);

      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('July 2019');
    });

    it('announces when the selected date range changes', async () => {
      let {getByText} = render(<RangeCalendar defaultValue={{start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}} />);

      await user.click(getByText('17'));
      await user.click(getByText('10'));

      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('Selected Range: Monday, June 10 to Monday, June 17, 2019', 'polite', 4000);
    });

    it('ensures that the active descendant is announced when the focused date changes', async () => {
      let {getAllByLabelText} = render(<RangeCalendar defaultValue={{start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}} autoFocus />);

      let selectedDates = getAllByLabelText('selected', {exact: false});

      expect(selectedDates[0]).toHaveFocus();
      await user.keyboard('{ArrowRight}');

      expect(selectedDates[1]).toHaveFocus();
    });

    it('includes era in BC dates', async () => {
      let {getByText, getAllByLabelText} = render(<RangeCalendar defaultValue={{start: new CalendarDate('BC', 5, 2, 3), end: new CalendarDate('BC', 5, 18, 3)}} />);

      await user.click(getByText('17'));
      await user.click(getByText('23'));

      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('Selected Range: Saturday, February 17 to Friday, February 23, 5 BC', 'polite', 4000);

      announce.mockReset();
      let nextButton = getAllByLabelText('Next')[0];
      await user.click(nextButton);

      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('March 5 BC');
    });
  });
});
