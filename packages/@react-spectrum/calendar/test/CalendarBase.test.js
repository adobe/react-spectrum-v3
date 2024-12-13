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

import {act, fireEvent, render as noProviderRender, pointerMap, renderv3 as render, within} from '@react-spectrum/test-utils-internal';
import {Calendar, RangeCalendar} from '../';
import {CalendarDate, GregorianCalendar, today} from '@internationalized/date';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

let cellFormatter = new Intl.DateTimeFormat('en-US', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
let headingFormatter = new Intl.DateTimeFormat('en-US', {month: 'long', year: 'numeric'});

describe('CalendarBase', () => {
  let user;

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });

  afterEach(() => {
    // clear any live announcers
    act(() => {
      jest.runAllTimers();
    });
  });

  describe('basics', () => {
    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{}}
    `('$Name shows the current month by default', ({Calendar, props}) => {
      let {getByLabelText, getAllByLabelText, getByRole, getAllByRole} = render(<Calendar {...props} />);

      let calendar = getByRole('application');
      expect(calendar).toBeVisible();

      let heading = getByRole('heading');
      expect(heading).toHaveTextContent(headingFormatter.format(new Date()));

      let grid = getByRole('grid');
      expect(grid).not.toHaveAttribute('tabIndex');

      let todayCell = getByLabelText('today', {exact: false});
      expect(todayCell.parentElement).toHaveAttribute('role', 'gridcell');
      expect(todayCell).toHaveAttribute('aria-label', `Today, ${cellFormatter.format(new Date())}`);
      expect(todayCell).toHaveAttribute('tabIndex', '0');

      expect(getByLabelText('Previous')).toBeVisible();
      expect(getAllByLabelText('Next')[0]).toBeVisible();

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(new GregorianCalendar().getDaysInMonth(today()));
      for (let cell of gridCells) {
        expect(cell.children[0]).toHaveAttribute('aria-label');
      }
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{isDisabled: true}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{isDisabled: true}}
    `('$Name should set aria-disabled when isDisabled', ({Calendar, props}) => {
      let {getByRole, getAllByRole, getByLabelText, getAllByLabelText} = render(<Calendar {...props} />);

      let grid = getByRole('grid');
      expect(grid).toHaveAttribute('aria-disabled', 'true');
      expect(grid).not.toHaveAttribute('tabIndex');

      let gridCells = getAllByRole('gridcell');
      for (let cell of gridCells) {
        expect(cell).toHaveAttribute('aria-disabled', 'true');
      }

      expect(getByLabelText('Previous')).toHaveAttribute('disabled');
      for (let next of getAllByLabelText('Next')) {
        expect(next).toHaveAttribute('disabled');
      }
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{isReadOnly: true}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{isReadOnly: true}}
    `('$Name should set aria-readonly when isReadOnly', ({Calendar, props}) => {
      let {getByRole} = render(<Calendar {...props} />);
      let grid = getByRole('grid');
      expect(grid).toHaveAttribute('aria-readonly', 'true');
      expect(grid).not.toHaveAttribute('tabIndex');
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{}}
    `('$Name should focus today if autoFocus is set and there is no selected value', ({Calendar}) => {
      let {getByLabelText} = render(<Calendar autoFocus />);

      let cell = getByLabelText('today', {exact: false});
      expect(cell.parentElement).toHaveAttribute('role', 'gridcell');
      expect(cell).toHaveFocus();
    });

    it.each`
      Name                    | Calendar              | props
      ${'v3 Calendar'}        | ${Calendar}           | ${{defaultValue: new CalendarDate(2019, 2, 10), minValue: new CalendarDate(2019, 2, 3), maxValue: new CalendarDate(2019, 2, 20)}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}      | ${{defaultValue: {start: new CalendarDate(2019, 2, 10), end: new CalendarDate(2019, 2, 15)}, minValue: new CalendarDate(2019, 2, 3), maxValue: new CalendarDate(2019, 2, 20)}}
    `('$Name should set aria-disabled on cells outside the valid date range', ({Calendar, props}) => {
      let {getAllByRole} = render(<Calendar {...props} />);

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(18);
    });

    it.each`
      Name                    | Calendar              | props
      ${'v3 Calendar'}        | ${Calendar}           | ${{defaultValue: new CalendarDate(2019, 2, 10), minValue: new CalendarDate(2019, 2, 3), maxValue: new CalendarDate(2019, 3, 20)}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}      | ${{defaultValue: {start: new CalendarDate(2019, 2, 10), end: new CalendarDate(2019, 2, 15)}, minValue: new CalendarDate(2019, 2, 3), maxValue: new CalendarDate(2019, 3, 20)}}
    `('$Name should disable the previous button if outside valid date range', ({Calendar, props}) => {
      let {getByLabelText, getAllByLabelText} = render(<Calendar {...props} />);

      expect(getByLabelText('Previous')).toHaveAttribute('disabled');
      for (let next of getAllByLabelText('Next')) {
        expect(next).not.toHaveAttribute('disabled');
      }
    });

    it.each`
      Name                    | Calendar              | props
      ${'v3 Calendar'}        | ${Calendar}           | ${{defaultValue: new CalendarDate(2019, 3, 10), minValue: new CalendarDate(2019, 2, 3), maxValue: new CalendarDate(2019, 3, 20)}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}      | ${{defaultValue: {start: new CalendarDate(2019, 3, 10), end: new CalendarDate(2019, 3, 15)}, minValue: new CalendarDate(2019, 2, 3), maxValue: new CalendarDate(2019, 3, 20)}}
    `('$Name should disable the next button if outside valid date range', ({Calendar, props}) => {
      let {getByLabelText, getAllByLabelText} = render(<Calendar {...props} />);

      expect(getByLabelText('Previous')).not.toHaveAttribute('disabled');
      for (let next of getAllByLabelText('Next')) {
        expect(next).toHaveAttribute('disabled');
      }
    });

    it.each`
      Name                    | Calendar              | props
      ${'v3 Calendar'}        | ${Calendar}           | ${{defaultValue: new CalendarDate(2019, 3, 10), minValue: new CalendarDate(2019, 2, 3), maxValue: new CalendarDate(2019, 2, 20)}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}      | ${{defaultValue: {start: new CalendarDate(2019, 3, 10), end: new CalendarDate(2019, 3, 15)}, minValue: new CalendarDate(2019, 2, 3), maxValue: new CalendarDate(2019, 2, 20)}}
    `('$Name should disable both the next and previous buttons if outside valid date range', ({Calendar, props}) => {
      let {getByLabelText, getAllByLabelText} = render(<Calendar {...props} />);

      expect(getByLabelText('Previous')).toHaveAttribute('disabled');
      for (let next of getAllByLabelText('Next')) {
        expect(next).toHaveAttribute('disabled');
      }
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new CalendarDate(2019, 6, 5)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}}
    `('$Name should change the month when previous or next buttons are clicked', async ({Calendar, props}) => {
      let {getByRole, getByLabelText, getAllByLabelText, getAllByRole} = render(<Calendar {...props} />);

      let heading = getByRole('heading');
      expect(heading).toHaveTextContent('June 2019');

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(30);
      expect(getAllByLabelText('selected', {exact: false}).length).toBeGreaterThan(0);

      let nextButton = getAllByLabelText('Next')[0];
      await user.click(nextButton);

      expect(() => {
        getAllByLabelText('selected', {exact: false});
      }).toThrow();

      expect(heading).toHaveTextContent('July 2019');
      gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(31);

      expect(nextButton).toHaveFocus();

      let prevButton = getByLabelText('Previous');
      await user.click(prevButton);

      expect(heading).toHaveTextContent('June 2019');
      gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(30);
      expect(getAllByLabelText('selected', {exact: false}).length).toBeGreaterThan(0);
      expect(prevButton).toHaveFocus();
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new CalendarDate(2019, 6, 5)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}}
    `('$Name should change the month when previous or next buttons are clicked and multiple months are visible', async ({Calendar, props}) => {
      let {getAllByRole, getByLabelText, getAllByLabelText} = render(<Calendar {...props} visibleMonths={3} />);

      let grids = getAllByRole('grid');
      expect(grids).toHaveLength(3);
      expect(grids[0]).toHaveAttribute('aria-label', 'May 2019');
      expect(grids[1]).toHaveAttribute('aria-label', 'June 2019');
      expect(grids[2]).toHaveAttribute('aria-label', 'July 2019');

      let nextButton = getAllByLabelText('Next')[0];
      await user.click(nextButton);

      grids = getAllByRole('grid');
      expect(grids).toHaveLength(3);
      expect(grids[0]).toHaveAttribute('aria-label', 'August 2019');
      expect(grids[1]).toHaveAttribute('aria-label', 'September 2019');
      expect(grids[2]).toHaveAttribute('aria-label', 'October 2019');

      let prevButton = getByLabelText('Previous');
      await user.click(prevButton);

      grids = getAllByRole('grid');
      expect(grids).toHaveLength(3);
      expect(grids[0]).toHaveAttribute('aria-label', 'May 2019');
      expect(grids[1]).toHaveAttribute('aria-label', 'June 2019');
      expect(grids[2]).toHaveAttribute('aria-label', 'July 2019');
    });

    it.each`
      Name                    | Calendar              | props
      ${'v3 Calendar'}        | ${Calendar}           | ${{defaultValue: new CalendarDate(2019, 3, 10), minValue: new CalendarDate(2019, 2, 3), maxValue: new CalendarDate(2019, 4, 20)}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}      | ${{defaultValue: {start: new CalendarDate(2019, 3, 10), end: new CalendarDate(2019, 3, 15)}, minValue: new CalendarDate(2019, 2, 3), maxValue: new CalendarDate(2019, 4, 20)}}
    `('$Name should move focus when the previous or next buttons become disabled', async ({Calendar, props}) => {
      let {getByLabelText, getAllByLabelText} = render(<Calendar {...props} />);

      let prevButton = getByLabelText('Previous');
      let nextButton = getAllByLabelText('Next')[0];

      expect(prevButton).not.toHaveAttribute('disabled');
      expect(nextButton).not.toHaveAttribute('disabled');

      await user.click(prevButton);
      expect(prevButton).toHaveAttribute('disabled');
      expect(nextButton).not.toHaveAttribute('disabled');
      expect(document.activeElement.getAttribute('aria-label').startsWith('Sunday, February 10, 2019')).toBe(true);

      await user.click(nextButton);

      expect(prevButton).not.toHaveAttribute('disabled');
      expect(nextButton).not.toHaveAttribute('disabled');
      expect(document.activeElement).toBe(nextButton);

      await user.click(nextButton);
      expect(prevButton).not.toHaveAttribute('disabled');
      expect(nextButton).toHaveAttribute('disabled');
      expect(document.activeElement.getAttribute('aria-label').startsWith('Wednesday, April 10, 2019')).toBe(true);
    });

    it.each`
      Name                   | Calendar
      ${'v3 Calendar'}       | ${Calendar}
      ${'v3 RangeCalendar'}  | ${RangeCalendar}
    `('$Name should handle minimum dates in a calendar system', ({Calendar}) => {
      let {getByRole, getAllByRole} = render(
        <Calendar defaultFocusedValue={new CalendarDate(1868, 9, 12)} />
      , undefined, {locale: 'en-US-u-ca-japanese'});

      let grid = getByRole('grid');
      let headers = within(grid).getAllByRole('columnheader', {hidden: true});
      expect(headers.map(h => h.textContent)).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);

      let cells = within(grid).getAllByRole('gridcell');
      expect(cells[0]).toHaveTextContent('8');
      expect([...cells[0].parentElement.children].indexOf(cells[0])).toBe(2);

      let button = getByRole('button', {name: 'Previous'});
      expect(button).toHaveAttribute('disabled');

      button = getAllByRole('button', {name: 'Next'})[0];
      expect(button).not.toHaveAttribute('disabled');
    });

    it.each`
      Name                   | Calendar
      ${'v3 Calendar'}       | ${Calendar}
      ${'v3 RangeCalendar'}  | ${RangeCalendar}
    `('$Name should handle maximum dates in a calendar system', ({Calendar}) => {
      let {getByRole, getAllByRole} = render(<Calendar defaultFocusedValue={new CalendarDate(9999, 12, 12)} />);

      let grid = getByRole('grid');
      let cells = within(grid).getAllByRole('gridcell');
      expect(cells[cells.length - 1]).toHaveTextContent('31');

      let button = getByRole('button', {name: 'Previous'});
      expect(button).not.toHaveAttribute('disabled');

      button = getAllByRole('button', {name: 'Next'})[0];
      expect(button).toHaveAttribute('disabled');
    });

    it.each`
      Name                   | Calendar
      ${'v3 Calendar'}       | ${Calendar}
      ${'v3 RangeCalendar'}  | ${RangeCalendar}
    `('$Name should show era for BC dates', ({Calendar}) => {
      let {getByRole} = render(<Calendar defaultFocusedValue={new CalendarDate('BC', 2, 1, 5)} />);

      let group = getByRole('application');
      expect(group).toHaveAttribute('aria-label', 'January 2 BC');

      let heading = getByRole('heading');
      expect(heading).toHaveTextContent('January 2 BC');
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new CalendarDate(2019, 6, 5)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}}
    `('$Name should change the month when keyboard navigating and multiple months are visible', async ({Calendar, props}) => {
      let {getAllByRole, getByLabelText} = render(<Calendar {...props} visibleMonths={3} />);

      let grids = getAllByRole('grid');
      expect(grids).toHaveLength(3);
      expect(grids[0]).toHaveAttribute('aria-label', 'May 2019');
      expect(grids[1]).toHaveAttribute('aria-label', 'June 2019');
      expect(grids[2]).toHaveAttribute('aria-label', 'July 2019');

      act(() => getByLabelText('Wednesday, July 31, 2019').focus());
      await user.keyboard('{ArrowRight}');

      grids = getAllByRole('grid');
      expect(grids).toHaveLength(3);
      expect(grids[0]).toHaveAttribute('aria-label', 'August 2019');
      expect(grids[1]).toHaveAttribute('aria-label', 'September 2019');
      expect(grids[2]).toHaveAttribute('aria-label', 'October 2019');

      await user.keyboard('{ArrowLeft}');

      grids = getAllByRole('grid');
      expect(grids).toHaveLength(3);
      expect(grids[0]).toHaveAttribute('aria-label', 'May 2019');
      expect(grids[1]).toHaveAttribute('aria-label', 'June 2019');
      expect(grids[2]).toHaveAttribute('aria-label', 'July 2019');
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new CalendarDate(2021, 12, 15)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2021, 12, 15), end: new CalendarDate(2021, 12, 15)}}}
    `('$Name should set aria-disabled on cells for which isDateUnavailable returns true', async ({Calendar, props}) => {
      const isDateUnavailable = (date) => {
        const disabledIntervals = [[new CalendarDate(2021, 12, 6), new CalendarDate(2021, 12, 10)], [new CalendarDate(2021, 12, 22), new CalendarDate(2021, 12, 26)]];
        return disabledIntervals.some((interval) => date.compare(interval[0]) >= 0 && date.compare(interval[1]) <= 0);
      };
      let {getByRole, getAllByRole} = render(<Calendar {...props} isDateUnavailable={isDateUnavailable} />);

      expect(getByRole('button', {name: 'Monday, December 6, 2021'})).toHaveAttribute('aria-disabled', 'true');
      expect(getByRole('button', {name: 'Tuesday, December 7, 2021'})).toHaveAttribute('aria-disabled', 'true');
      expect(getByRole('button', {name: 'Wednesday, December 8, 2021'})).toHaveAttribute('aria-disabled', 'true');
      expect(getByRole('button', {name: 'Thursday, December 9, 2021'})).toHaveAttribute('aria-disabled', 'true');
      expect(getByRole('button', {name: 'Friday, December 10, 2021'})).toHaveAttribute('aria-disabled', 'true');

      expect(getByRole('button', {name: 'Wednesday, December 22, 2021'})).toHaveAttribute('aria-disabled', 'true');
      expect(getByRole('button', {name: 'Thursday, December 23, 2021'})).toHaveAttribute('aria-disabled', 'true');
      expect(getByRole('button', {name: 'Friday, December 24, 2021'})).toHaveAttribute('aria-disabled', 'true');
      expect(getByRole('button', {name: 'Saturday, December 25, 2021'})).toHaveAttribute('aria-disabled', 'true');
      expect(getByRole('button', {name: 'Sunday, December 26, 2021'})).toHaveAttribute('aria-disabled', 'true');

      let gridCells = getAllByRole('gridcell').filter(cell => cell.getAttribute('aria-disabled') !== 'true');
      expect(gridCells.length).toBe(21);

      let cell = getByRole('button', {name: 'Wednesday, December 22, 2021'});
      await user.click(cell);
      expect(cell.parentElement).not.toHaveAttribute('aria-selected');

      cell = getByRole('button', {name: 'Sunday, December 12, 2021'});
      await user.click(cell);
      expect(cell.parentElement).toHaveAttribute('aria-selected', 'true');
    });

    it.each`
      Name                   | Calendar
      ${'v3 Calendar'}       | ${Calendar}
      ${'v3 RangeCalendar'}  | ${RangeCalendar}
    `('$Name should support defaultFocusedValue', async ({Calendar}) => {
      let onFocusChange = jest.fn();
      let {getByRole} = render(<Calendar defaultFocusedValue={new CalendarDate(2019, 6, 5)} autoFocus onFocusChange={onFocusChange} />);

      let grid = getByRole('grid');
      expect(grid).toHaveAttribute('aria-label', 'June 2019');
      expect(document.activeElement.getAttribute('aria-label').startsWith('Wednesday, June 5, 2019')).toBe(true);

      await user.keyboard('{ArrowRight}');
      expect(document.activeElement.getAttribute('aria-label').startsWith('Thursday, June 6, 2019')).toBe(true);
      expect(onFocusChange).toHaveBeenCalledWith(new CalendarDate(2019, 6, 6));
    });

    it.each`
      Name                   | Calendar
      ${'v3 Calendar'}       | ${Calendar}
      ${'v3 RangeCalendar'}  | ${RangeCalendar}
    `('$Name should support controlled focusedValue', async ({Calendar}) => {
      let onFocusChange = jest.fn();
      let {getByRole} = render(<Calendar focusedValue={new CalendarDate(2019, 6, 5)} autoFocus onFocusChange={onFocusChange} />);

      let grid = getByRole('grid');
      expect(grid).toHaveAttribute('aria-label', 'June 2019');
      expect(document.activeElement.getAttribute('aria-label').startsWith('Wednesday, June 5, 2019')).toBe(true);

      await user.keyboard('{ArrowRight}');
      expect(document.activeElement.getAttribute('aria-label').startsWith('Wednesday, June 5, 2019')).toBe(true);
      expect(onFocusChange).toHaveBeenCalledWith(new CalendarDate(2019, 6, 6));
    });

    it.each`
      Name                   | Calendar
      ${'v3 Calendar'}       | ${Calendar}
      ${'v3 RangeCalendar'}  | ${RangeCalendar}
    `('$Name should constrain defaultFocusedValue', ({Calendar}) => {
      let {getByRole} = render(<Calendar defaultFocusedValue={new CalendarDate(2019, 6, 5)} minValue={new CalendarDate(2019, 7, 5)} autoFocus />);

      let grid = getByRole('grid');
      expect(grid).toHaveAttribute('aria-label', 'July 2019');
      expect(document.activeElement.getAttribute('aria-label').startsWith('Friday, July 5, 2019')).toBe(true);
    });

    it.each`
      Name                   | Calendar
      ${'v3 Calendar'}       | ${Calendar}
      ${'v3 RangeCalendar'}  | ${RangeCalendar}
    `('$Name should constrain focusedValue', ({Calendar}) => {
      let {getByRole} = render(<Calendar focusedValue={new CalendarDate(2019, 6, 5)} minValue={new CalendarDate(2019, 7, 5)} autoFocus />);

      let grid = getByRole('grid');
      expect(grid).toHaveAttribute('aria-label', 'July 2019');
      expect(document.activeElement.getAttribute('aria-label').startsWith('Friday, July 5, 2019')).toBe(true);
    });

    it.each`
      Name                   | Calendar
      ${'v3 Calendar'}       | ${Calendar}
      ${'v3 RangeCalendar'}  | ${RangeCalendar}
    `('$Name should support focusing via a ref', ({Calendar}) => {
      let ref = React.createRef();
      render(<Calendar ref={ref} />);
      expect(ref.current).toHaveProperty('focus');

      act(() => ref.current.focus());
      expect(document.activeElement).toHaveAttribute('role', 'button');
      expect(document.activeElement.parentElement).toHaveAttribute('role', 'gridcell');
    });

    it.each`
      Name                   | Calendar
      ${'v3 Calendar'}       | ${Calendar}
      ${'v3 RangeCalendar'}  | ${RangeCalendar}
    `('$Name should pass through data attributes', ({Calendar}) => {
      let {getByTestId} = render(<Calendar data-testid="foo" />);
      expect(getByTestId('foo')).toHaveAttribute('role', 'application');
    });

    it.each`
      Name                   | Calendar
      ${'v3 Calendar'}       | ${Calendar}
      ${'v3 RangeCalendar'}  | ${RangeCalendar}
    `('$Name should return the outer most DOM element from the ref', ({Calendar}) => {
      let ref = React.createRef();
      render(<Calendar ref={ref} />);
      expect(ref.current).toHaveProperty('UNSAFE_getDOMNode');

      let wrapper = ref.current.UNSAFE_getDOMNode();
      expect(wrapper).toHaveAttribute('role', 'application');
    });

    it.each`
      Name                   | Calendar
      ${'v3 Calendar'}       | ${Calendar}
      ${'v3 RangeCalendar'}  | ${RangeCalendar}
    `('$Name should respond to provider props', ({Calendar}) => {
      let {getByRole, getAllByRole, getByLabelText, getAllByLabelText} = render(
        <Provider theme={theme} isDisabled>
          <Calendar />
        </Provider>
      );

      let grid = getByRole('grid');
      expect(grid).toHaveAttribute('aria-disabled', 'true');
      expect(grid).not.toHaveAttribute('tabIndex');

      let gridCells = getAllByRole('gridcell');
      for (let cell of gridCells) {
        expect(cell).toHaveAttribute('aria-disabled', 'true');
      }

      expect(getByLabelText('Previous')).toHaveAttribute('disabled');
      expect(getAllByLabelText('Next')[0]).toHaveAttribute('disabled');
    });
  });

  describe('labeling', () => {
    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new CalendarDate(2019, 6, 5)}}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 5)}}}
    `('$Name should be labeled by month heading by default', async ({Calendar, props}) => {
      let {getByRole} = render(<Calendar  {...props} />);
      let calendar = getByRole('application');
      let body = getByRole('grid');
      expect(calendar).toHaveAttribute('id');
      expect(calendar).toHaveAttribute('aria-label', 'June 2019');
      expect(body).toHaveAttribute('aria-label', 'June 2019');
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new CalendarDate(2019, 6, 5)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 5)}}}
    `('$Name should support labeling with aria-label', ({Calendar, props}) => {
      let {getByRole} = render(<Calendar {...props} aria-label="foo" />);
      let calendar = getByRole('application');
      let body = getByRole('grid');
      expect(calendar).toHaveAttribute('id');
      expect(calendar).toHaveAttribute('aria-label', 'foo, June 2019');
      expect(body).toHaveAttribute('aria-label', 'foo, June 2019');
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new CalendarDate(2019, 6, 5)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 5)}}}
    `('$Name should support labeling with aria-labelledby', ({Calendar, props}) => {
      let {getByRole} = render(<Calendar {...props} aria-labelledby="foo" />);
      let calendar = getByRole('application');
      let body = getByRole('grid');
      expect(calendar).toHaveAttribute('id');
      expect(calendar).toHaveAttribute('aria-label', 'June 2019');
      expect(calendar).toHaveAttribute('aria-labelledby', `${calendar.id} foo`);
      expect(body).toHaveAttribute('aria-label', 'June 2019');
      expect(body).toHaveAttribute('id');
      expect(body).toHaveAttribute('aria-labelledby', `${body.id} foo`);
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new CalendarDate(2019, 6, 5)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 5)}}}
    `('$Name should support labeling with aria-labelledby and aria-label', ({Calendar, props}) => {
      let {getByRole} = render(<Calendar {...props} aria-label="cal" aria-labelledby="foo" />);
      let calendar = getByRole('application');
      let body = getByRole('grid');
      expect(calendar).toHaveAttribute('id');
      expect(calendar).toHaveAttribute('aria-label', 'cal, June 2019');
      expect(calendar).toHaveAttribute('aria-labelledby', `${calendar.id} foo`);
      expect(body).toHaveAttribute('aria-label', 'cal, June 2019');
      expect(body).toHaveAttribute('id');
      expect(body).toHaveAttribute('aria-labelledby', `${body.id} foo`);
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new CalendarDate(2019, 6, 5)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 5)}}}
    `('$Name should support labeling with a custom id', ({Calendar, props}) => {
      let {getByRole} = render(<Calendar {...props} id="hi" aria-label="cal" aria-labelledby="foo" />);
      let calendar = getByRole('application');
      let body = getByRole('grid');
      expect(calendar).toHaveAttribute('id', 'hi');
      expect(calendar).toHaveAttribute('aria-label', 'cal, June 2019');
      expect(calendar).toHaveAttribute('aria-labelledby', `${calendar.id} foo`);
      expect(body).toHaveAttribute('aria-label', 'cal, June 2019');
      expect(body).toHaveAttribute('id');
      expect(body).toHaveAttribute('aria-labelledby', `${body.id} foo`);
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new CalendarDate(2019, 6, 5)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 5)}}}
    `('$Name should support labeling with multiple visible months', ({Calendar, props}) => {
      let {getByRole, getAllByRole} = render(<Calendar {...props} aria-label="Calendar" visibleMonths={3} />);
      let calendar = getByRole('application');
      let months = getAllByRole('grid');
      expect(months).toHaveLength(3);
      expect(calendar).toHaveAttribute('id');
      expect(calendar).toHaveAttribute('aria-label', 'Calendar, May to July 2019');
      expect(months[0]).toHaveAttribute('aria-label', 'Calendar, May 2019');
      expect(months[1]).toHaveAttribute('aria-label', 'Calendar, June 2019');
      expect(months[2]).toHaveAttribute('aria-label', 'Calendar, July 2019');
    });
  });

  describe('keyboard navigation', () => {
    async function testKeyboard(Calendar, defaultValue, key, value, month, props, opts) {
      // For range calendars, convert the value to a range of one day
      if (Calendar === RangeCalendar) {
        defaultValue = {start: defaultValue, end: defaultValue};
      }

      let {getAllByRole, getAllByLabelText, unmount} = render(<Calendar defaultValue={defaultValue} autoFocus {...props} />);
      let grid = getAllByRole('grid')[0]; // get by role will see two, role=grid and implicit <table> which also has role=grid

      let cell = getAllByLabelText('selected', {exact: false}).filter(cell => cell.role !== 'grid')[0];
      expect(grid).not.toHaveAttribute('aria-activedescendant');
      expect(document.activeElement).toBe(cell);

      if (opts?.shiftKey) {
        await user.keyboard('{Shift>}');
      }
      await user.keyboard(`[${key}]`);
      if (opts?.shiftKey) {
        await user.keyboard('{/Shift}');
      }

      expect(grid).not.toHaveAttribute('aria-activedescendant');
      expect(document.activeElement.getAttribute('aria-label')).toMatch(value);

      let heading = getAllByRole('heading')[0];
      expect(heading).toHaveTextContent(month);

      // clear any live announcers
      act(() => {
        jest.runAllTimers();
      });

      unmount();
    }

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{}}
    `('$Name should move the focused date by one day with the left/right arrows', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'ArrowLeft', 'Tuesday, June 4, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'ArrowRight', 'Thursday, June 6, 2019', 'June 2019', props);

      await testKeyboard(Calendar, new CalendarDate(2019, 6, 1), 'ArrowLeft', 'Friday, May 31, 2019', 'May 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 30), 'ArrowRight', 'Monday, July 1, 2019', 'July 2019', props);
    });

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{}}
    `('$Name should move the focused date by one week with the up/down arrows', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 12), 'ArrowUp', 'Wednesday, June 5, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 12), 'ArrowDown', 'Wednesday, June 19, 2019', 'June 2019', props);

      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'ArrowUp', 'Wednesday, May 29, 2019', 'May 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 26), 'ArrowDown', 'Wednesday, July 3, 2019', 'July 2019', props);
    });

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{}}
    `('$Name should move the focused date to the start or end of the month with the home/end keys', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 12), 'Home', 'Saturday, June 1, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 12), 'End', 'Sunday, June 30, 2019', 'June 2019', props);
    });

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{visibleMonths: 3}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{visibleMonths: 3}}
    `('$Name should move the focused date to the start or end of the month with the home/end keys when multiple months are visible', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 12), 'Home', 'Saturday, June 1, 2019', 'May to July 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 12), 'End', 'Sunday, June 30, 2019', 'May to July 2019', props);
    });

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{}}
    `('$Name should move the focused date by one month with the page up/page down keys', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'PageUp', 'Sunday, May 5, 2019', 'May 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'PageDown', 'Friday, July 5, 2019', 'July 2019', props);
    });

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{visibleMonths: 3}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{visibleMonths: 3}}
    `('$Name should move the focused date by one month with the page up/page down keys when multiple months are visible', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'PageUp', 'Sunday, May 5, 2019', 'May to July 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'PageDown', 'Friday, July 5, 2019', 'May to July 2019', props);
    });

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{}}
    `('$Name should move the focused date by one year with the shift + page up/shift + page down keys', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'PageUp', 'Tuesday, June 5, 2018', 'June 2018', props, {shiftKey: true});
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'PageDown', 'Friday, June 5, 2020', 'June 2020', props, {shiftKey: true});
    });

    it.each`
      Name                    | Calendar          | props
      ${'v3 Calendar'}        | ${Calendar}       | ${{minValue: new CalendarDate(2019, 6, 2), maxValue: new CalendarDate(2019, 6, 8)}}
      ${'v3 RangeCalendar'}   | ${RangeCalendar}  | ${{minValue: new CalendarDate(2019, 6, 2), maxValue: new CalendarDate(2019, 6, 8)}}
    `('$Name should not move the focused date outside the valid range', async ({Calendar, props}) => {
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 2), 'ArrowLeft', 'Sunday, June 2, 2019 selected', 'June 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 8), 'ArrowRight', 'Saturday, June 8, 2019 selected', 'June 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'ArrowUp', 'Sunday, June 2, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'ArrowDown', 'Saturday, June 8, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'Home', 'Sunday, June 2, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'End', 'Saturday, June 8, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'PageUp', 'Sunday, June 2, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'PageDown', 'Saturday, June 8, 2019', 'June 2019', props);
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'PageUp', 'Sunday, June 2, 2019', 'June 2019', props, {shiftKey: true});
      await testKeyboard(Calendar, new CalendarDate(2019, 6, 5), 'PageDown', 'Saturday, June 8, 2019', 'June 2019', props, {shiftKey: true});
    });
  });

  // These tests only apply to v3
  describe('internationalization', () => {
    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{}}
    `('$Name should change the week start day based on the locale', ({Calendar}) => {
      let {getAllByRole, rerender} = render(
        <Provider theme={theme} locale="en-US">
          <Calendar />
        </Provider>
      );

      let headers = getAllByRole('columnheader', {hidden: true});
      expect(headers[0]).toHaveTextContent('S');

      rerender(
        <Provider theme={theme} locale="de-DE">
          <Calendar />
        </Provider>
      );

      headers = getAllByRole('columnheader', {hidden: true});
      expect(headers[0]).toHaveTextContent('M');
    });

    it.each`
      Name                   | Calendar         | props
      ${'v3 Calendar'}       | ${Calendar}      | ${{defaultValue: new CalendarDate(2019, 6, 5)}}
      ${'v3 RangeCalendar'}  | ${RangeCalendar} | ${{defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}}
    `('$Name should mirror arrow key movement in an RTL locale', async ({Calendar, props}) => {
      // LTR
      let {getByRole, getAllByRole, rerender} = noProviderRender(
        <Provider theme={theme} locale="en-US">
          <Calendar {...props} autoFocus />
        </Provider>
      );

      let grid = getByRole('grid');
      let selected = getAllByRole('button').find(cell => cell.getAttribute('tabIndex') === '0');
      expect(document.activeElement).toBe(selected);

      await user.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(selected.parentNode.previousSibling.children[0]);

      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(selected);

      // RTL
      rerender(
        <Provider theme={theme} locale="ar-EG">
          <Calendar {...props} autoFocus />
        </Provider>
      );

      // make sure focused cell gets updated after rerender
      fireEvent.blur(grid);
      fireEvent.focus(grid);

      selected = getAllByRole('button').find(cell => cell.getAttribute('tabIndex') === '0');
      expect(document.activeElement).toBe(selected);

      await user.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(selected.parentNode.nextSibling.children[0]);


      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(selected);
    });
  });
});
