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

import {CalendarCell} from './CalendarCell';
import {CalendarDate, endOfMonth} from '@internationalized/date';
import {CalendarPropsBase} from '@react-types/calendar';
import {CalendarState, RangeCalendarState} from '@react-stately/calendar';
import {classNames} from '@react-spectrum/utils';
import {DOMProps, StyleProps} from '@react-types/shared';
import React from 'react';
import styles from '@adobe/spectrum-css-temp/components/calendar/vars.css';
import {useCalendarGrid} from '@react-aria/calendar';

interface CalendarMonthProps extends CalendarPropsBase, DOMProps, StyleProps {
  state: CalendarState | RangeCalendarState,
  startDate: CalendarDate
}

export function CalendarMonth(props: CalendarMonthProps) {
  let {
    state,
    startDate,
    firstDayOfWeek
  } = props;

  let {
    gridProps,
    headerProps,
    weekDays,
    weeksInMonth
  } = useCalendarGrid({
    ...props,
    endDate: endOfMonth(startDate)
  }, state);

  return (
    <table
      {...gridProps}
      className={classNames(styles, 'spectrum-Calendar-body', 'spectrum-Calendar-table')}>
      <thead {...headerProps}>
        <tr>
          {weekDays.map((day, index) => (
            <th
              key={index}
              className={classNames(styles, 'spectrum-Calendar-tableCell')}>
              <span className={classNames(styles, 'spectrum-Calendar-dayOfWeek')}>
                {day}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...new Array(weeksInMonth).keys()].map(weekIndex => (
          <tr key={weekIndex}>
            {state.getDatesInWeek(weekIndex, startDate).map((date, i) => (
              date ? (
                <CalendarCell
                  key={i}
                  state={state}
                  date={date}
                  currentMonth={startDate}
                  firstDayOfWeek={firstDayOfWeek} />
              ) : <td key={i} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
