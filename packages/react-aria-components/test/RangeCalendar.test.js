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

import {act, fireEvent, pointerMap, render, within} from '@react-spectrum/test-utils';
import {Button, CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader, CalendarHeaderCell, Heading, RangeCalendar, RangeCalendarContext} from 'react-aria-components';
import {CalendarDate, getLocalTimeZone, startOfMonth, startOfWeek, today} from '@internationalized/date';
import React from 'react';
import userEvent from '@testing-library/user-event';

let TestCalendar = ({calendarProps, gridProps, cellProps}) => (
  <RangeCalendar aria-label="Trip dates" {...calendarProps}>
    <header>
      <Button slot="previous">◀</Button>
      <Heading />
      <Button slot="next">▶</Button>
    </header>
    <CalendarGrid {...gridProps}>
      {(date) => <CalendarCell date={date} {...cellProps} />}
    </CalendarGrid>
  </RangeCalendar>
);

let renderCalendar = (calendarProps, gridProps, cellProps) => render(<TestCalendar {...{calendarProps, gridProps, cellProps}} />);

describe('RangeCalendar', () => {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });
  it('should render with default classes', () => {
    let {getByRole} = renderCalendar();
    let group = getByRole('application');
    expect(group).toHaveAttribute('class', 'react-aria-RangeCalendar');

    let grid = getByRole('grid');
    expect(grid).toHaveAttribute('class', 'react-aria-CalendarGrid');

    let rowgroups = within(grid).getAllByRole('rowgroup', {hidden: true});
    expect(rowgroups[0]).toHaveAttribute('class', 'react-aria-CalendarGridHeader');
    expect(rowgroups[1]).toHaveAttribute('class', 'react-aria-CalendarGridBody');

    for (let cell of within(rowgroups[0]).getAllByRole('columnheader', {hidden: true})) {
      expect(cell).toHaveAttribute('class', 'react-aria-CalendarHeaderCell');
    }

    for (let cell of within(grid).getAllByRole('button')) {
      expect(cell).toHaveAttribute('class', 'react-aria-CalendarCell');
    }
  });

  it('should render with custom classes', () => {
    let {getByRole} = renderCalendar({className: 'calendar'}, {className: 'grid'}, {className: 'cell'});
    let group = getByRole('application');
    expect(group).toHaveAttribute('class', 'calendar');

    let grid = getByRole('grid');
    expect(grid).toHaveAttribute('class', 'grid');

    for (let cell of within(grid).getAllByRole('button')) {
      expect(cell).toHaveAttribute('class', 'cell');
    }
  });

  it('should support DOM props', () => {
    let {getByRole} = renderCalendar({'data-foo': 'bar'}, {'data-bar': 'baz'}, {'data-baz': 'foo'});
    let group = getByRole('application');
    expect(group).toHaveAttribute('data-foo', 'bar');

    let grid = getByRole('grid');
    expect(grid).toHaveAttribute('data-bar', 'baz');

    for (let cell of within(grid).getAllByRole('button')) {
      expect(cell).toHaveAttribute('data-baz', 'foo');
    }
  });

  it('should support custom CalendarGridHeader', () => {
    let {getByRole} = render(
      <RangeCalendar aria-label="Trip dates">
        <header>
          <Button slot="previous">◀</Button>
          <Heading />
          <Button slot="next">▶</Button>
        </header>
        <CalendarGrid>
          <CalendarGridHeader className="grid-header">
            {(day) => (
              <CalendarHeaderCell className="header-cell">
                {day}
              </CalendarHeaderCell>
            )}
          </CalendarGridHeader>
          <CalendarGridBody className="grid-body">
            {(date) => <CalendarCell date={date} />}
          </CalendarGridBody>
        </CalendarGrid>
      </RangeCalendar>
    );

    let grid = getByRole('grid');
    expect(grid).toHaveAttribute('class', 'react-aria-CalendarGrid');

    let rowgroups = within(grid).getAllByRole('rowgroup', {hidden: true});
    expect(rowgroups[0]).toHaveAttribute('class', 'grid-header');
    expect(rowgroups[1]).toHaveAttribute('class', 'grid-body');

    for (let cell of within(rowgroups[0]).getAllByRole('columnheader', {hidden: true})) {
      expect(cell).toHaveAttribute('class', 'header-cell');
    }
  });

  it('should support slot', () => {
    let {getByRole} = render(
      <RangeCalendarContext.Provider value={{slots: {test: {'aria-label': 'test'}}}}>
        <TestCalendar calendarProps={{slot: 'test', 'aria-label': undefined}} />
      </RangeCalendarContext.Provider>
    );

    let group = getByRole('application');
    expect(group).toHaveAttribute('slot', 'test');
    expect(group).toHaveAttribute('aria-label', expect.stringContaining('test'));
  });

  it('should support render props', () => {
    let {getByRole} = render(
      <RangeCalendar
        aria-label="Trip dates"
        minValue={new CalendarDate(2023, 1, 1)}
        defaultValue={{start: new CalendarDate(2020, 2, 3), end: new CalendarDate(2020, 2, 10)}}>
        {({isInvalid}) => (
          <>
            <header>
              <Button slot="previous">◀</Button>
              <Heading />
              <Button slot="next">▶</Button>
            </header>
            <CalendarGrid data-validation-state={isInvalid ? 'invalid' : null}>
              {(date) => <CalendarCell date={date} />}
            </CalendarGrid>
          </>
        )}
      </RangeCalendar>
    );

    let grid = getByRole('grid');
    expect(grid).toHaveAttribute('data-validation-state', 'invalid');
  });

  it('should support multi-month calendars', () => {
    let {getAllByRole} = render(
      <RangeCalendar aria-label="Trip dates" visibleDuration={{months: 2}}>
        <header>
          <Button slot="previous">◀</Button>
          <Heading />
          <Button slot="next">▶</Button>
        </header>
        <div style={{display: 'flex', gap: 30}}>
          <CalendarGrid>
            {date => <CalendarCell date={date} />}
          </CalendarGrid>
          <CalendarGrid offset={{months: 1}}>
            {date => <CalendarCell date={date} />}
          </CalendarGrid>
        </div>
      </RangeCalendar>
    );

    let grids = getAllByRole('grid');
    expect(grids).toHaveLength(2);

    let formatter = new Intl.DateTimeFormat('en-US', {month: 'long', year: 'numeric'});
    expect(grids[0]).toHaveAttribute('aria-label', 'Trip dates, ' + formatter.format(new Date()));
    expect(grids[1]).toHaveAttribute('aria-label', 'Trip dates, ' + formatter.format(today(getLocalTimeZone()).add({months: 1}).toDate(getLocalTimeZone())));
  });

  it('should support hover', async () => {
    let {getByRole} = renderCalendar({}, {}, {className: ({isHovered}) => isHovered ? 'hover' : ''});
    let grid = getByRole('grid');
    let cell = within(grid).getAllByRole('button')[7];

    expect(cell).not.toHaveAttribute('data-hovered');
    expect(cell).not.toHaveClass('hover');

    await user.hover(cell);
    expect(cell).toHaveAttribute('data-hovered', 'true');
    expect(cell).toHaveClass('hover');

    await user.unhover(cell);
    expect(cell).not.toHaveAttribute('data-hovered');
    expect(cell).not.toHaveClass('hover');
  });

  it('should support focus ring', async () => {
    let {getByRole} = renderCalendar({}, {}, {className: ({isFocusVisible}) => isFocusVisible ? 'focus' : ''});
    let grid = getByRole('grid');
    let cell = within(grid).getAllByRole('button')[7];

    expect(cell).not.toHaveAttribute('data-focus-visible');
    expect(cell).not.toHaveClass('focus');

    await user.tab();
    act(() => cell.focus());
    expect(document.activeElement).toBe(cell);
    expect(cell).toHaveAttribute('data-focus-visible', 'true');
    expect(cell).toHaveClass('focus');

    await user.tab();
    expect(cell).not.toHaveAttribute('data-focus-visible');
    expect(cell).not.toHaveClass('focus');
  });

  it('should support press state', () => {
    let {getByRole} = renderCalendar({}, {}, {className: ({isPressed}) => isPressed ? 'pressed' : ''});
    let grid = getByRole('grid');
    let cell = within(grid).getAllByRole('button')[7];

    expect(cell).not.toHaveAttribute('data-pressed');
    expect(cell).not.toHaveClass('pressed');

    fireEvent.mouseDown(cell);
    expect(cell).toHaveAttribute('data-pressed', 'true');
    expect(cell).toHaveClass('pressed');

    fireEvent.mouseUp(cell);
    expect(cell).not.toHaveAttribute('data-pressed');
    expect(cell).not.toHaveClass('pressed');
  });

  it('should support selected state', async () => {
    let {getByRole} = renderCalendar({}, {}, {className: ({isSelected}) => isSelected ? 'selected' : ''});
    let grid = getByRole('grid');
    let cell = within(grid).getAllByRole('button')[7];

    expect(cell).not.toHaveAttribute('data-selected');
    expect(cell).not.toHaveClass('selected');

    await user.click(cell);
    expect(cell).toHaveAttribute('data-selected', 'true');
    expect(cell).toHaveClass('selected');
  });

  it('should support selected range states', async () => {
    let {getByRole} = renderCalendar({}, {}, {className: ({isSelectionStart, isSelectionEnd}) => `${isSelectionStart ? 'start' : ''} ${isSelectionEnd ? 'end' : ''}`});
    let grid = getByRole('grid');
    let cells = within(grid).getAllByRole('button');

    expect(cells[7]).not.toHaveAttribute('data-selection-start');
    expect(cells[7]).not.toHaveClass('start');
    expect(cells[7]).not.toHaveClass('end');

    await user.click(cells[7]);
    expect(cells[7]).toHaveAttribute('data-selection-start', 'true');
    expect(cells[7]).toHaveClass('start');
    expect(cells[7]).toHaveAttribute('data-selection-end', 'true');
    expect(cells[7]).toHaveClass('end');

    expect(cells[8]).not.toHaveAttribute('data-selection-start', 'true');
    expect(cells[8]).not.toHaveClass('start');
    expect(cells[8]).not.toHaveAttribute('data-selection-end', 'true');
    expect(cells[8]).not.toHaveClass('end');

    await user.click(cells[10]);
    expect(cells[7]).toHaveAttribute('data-selection-start', 'true');
    expect(cells[7]).toHaveClass('start');
    expect(cells[7]).not.toHaveAttribute('data-selection-end', 'true');
    expect(cells[7]).not.toHaveClass('end');
    expect(cells[10]).toHaveAttribute('data-selection-end', 'true');
    expect(cells[10]).toHaveClass('end');

    expect(cells[8]).not.toHaveAttribute('data-selection-start', 'true');
    expect(cells[8]).not.toHaveClass('start');
    expect(cells[8]).not.toHaveAttribute('data-selection-end', 'true');
    expect(cells[8]).not.toHaveClass('end');
  });

  it('should support unavailable state', () => {
    let {getByRole} = renderCalendar({isDateUnavailable: () => true}, {}, {className: ({isUnavailable}) => isUnavailable ? 'unavailable' : ''});
    let grid = getByRole('grid');
    let cell = within(grid).getAllByRole('button')[7];

    expect(cell).toHaveAttribute('data-unavailable', 'true');
    expect(cell).toHaveClass('unavailable');
  });

  it('should support disabled state', () => {
    let {getByRole} = renderCalendar({isDisabled: true}, {}, {className: ({isDisabled}) => isDisabled ? 'disabled' : ''});
    let grid = getByRole('grid');
    let cell = within(grid).getAllByRole('button')[7];

    expect(cell).toHaveAttribute('data-disabled', 'true');
    expect(cell).toHaveClass('disabled');
  });

  it('should support invalid state', () => {
    let {getByRole} = renderCalendar({
      isInvalid: true,
      value: {
        start: startOfWeek(startOfMonth(today(getLocalTimeZone())), 'en-US').add({days: 7}),
        end: startOfWeek(startOfMonth(today(getLocalTimeZone())), 'en-US').add({days: 10})
      }
    }, {}, {className: ({isInvalid}) => isInvalid ? 'invalid' : ''});
    let grid = getByRole('grid');
    let cell = within(grid).getAllByRole('button')[7];

    expect(cell).toHaveAttribute('aria-invalid', 'true');
    expect(cell).toHaveClass('invalid');
  });

  it('should support fixedWeeks', async () => {
    let {getByRole} = renderCalendar({isFixedWeeks: true, 
      defaultValue: {start: new CalendarDate(2024, 2, 3), end: new CalendarDate(2024, 2, 10)}});

    let grid = getByRole('grid');
    let rowgroups = within(grid).getAllByRole('rowgroup');
    expect(rowgroups[0]).toHaveAttribute('class', 'react-aria-CalendarGridBody');

    let calendarGridBody = rowgroups[0];
    let rowsInCalendarGridBody = within(calendarGridBody).getAllByRole('row');
    expect(rowsInCalendarGridBody.length).toBe(6);

    let header = getByRole('banner');
    let nextButton = within(header).getByRole('button', {name: 'Next'});
    
    await user.click(nextButton);
    calendarGridBody = rowgroups[0];
    rowsInCalendarGridBody = within(calendarGridBody).getAllByRole('row');
    expect(rowsInCalendarGridBody.length).toBe(6);

    await user.click(nextButton);
    rowgroups = within(grid).getAllByRole('rowgroup');
    calendarGridBody = rowgroups[0];
    rowsInCalendarGridBody = within(calendarGridBody).getAllByRole('row');
    expect(rowsInCalendarGridBody.length).toBe(6);
  });
});
