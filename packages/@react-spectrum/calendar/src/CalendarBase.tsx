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

import {ActionButton} from '@react-spectrum/button';
import {AriaButtonProps} from '@react-types/button';
import {CalendarMonth} from './CalendarMonth';
import {CalendarPropsBase} from '@react-types/calendar';
import {CalendarState, RangeCalendarState} from '@react-stately/calendar';
import ChevronLeft from '@spectrum-icons/ui/ChevronLeftLarge';
import ChevronRight from '@spectrum-icons/ui/ChevronRightLarge';
import {classNames, useStyleProps} from '@react-spectrum/utils';
import {DOMProps, RefObject, StyleProps} from '@react-types/shared';
import {HelpText} from '@react-spectrum/label';
// @ts-ignore
import intlMessages from '../intl/*.json';
import React, {HTMLAttributes, JSX} from 'react';
import styles from '@adobe/spectrum-css-temp/components/calendar/vars.css';
import {useDateFormatter, useLocale, useLocalizedStringFormatter} from '@react-aria/i18n';
import {VisuallyHidden} from '@react-aria/visually-hidden';

interface CalendarBaseProps<T extends CalendarState | RangeCalendarState> extends CalendarPropsBase, DOMProps, StyleProps {
  state: T,
  visibleMonths?: number,
  calendarProps: HTMLAttributes<HTMLElement>,
  nextButtonProps: AriaButtonProps,
  prevButtonProps: AriaButtonProps,
  errorMessageProps: HTMLAttributes<HTMLElement>,
  calendarRef: RefObject<HTMLDivElement | null>
}

export function CalendarBase<T extends CalendarState | RangeCalendarState>(props: CalendarBaseProps<T>) {
  let {
    state,
    calendarProps,
    nextButtonProps,
    prevButtonProps,
    errorMessageProps,
    calendarRef: ref,
    visibleMonths = 1,
    firstDayOfWeek
  } = props;
  let {styleProps} = useStyleProps(props);
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/calendar');
  let {direction} = useLocale();
  let currentMonth = state.visibleRange.start;
  let monthDateFormatter = useDateFormatter({
    month: 'long',
    year: 'numeric',
    era: currentMonth.calendar.identifier === 'gregory' && currentMonth.era === 'BC' ? 'short' : undefined,
    calendar: currentMonth.calendar.identifier,
    timeZone: state.timeZone
  });

  let titles: JSX.Element[] = [];
  let calendars: JSX.Element[] = [];
  for (let i = 0; i < visibleMonths; i++) {
    let d = currentMonth.add({months: i});
    titles.push(
      <div key={i} className={classNames(styles, 'spectrum-Calendar-monthHeader')}>
        {i === 0 &&
          <ActionButton
            {...prevButtonProps}
            UNSAFE_className={classNames(styles, 'spectrum-Calendar-prevMonth')}
            isQuiet>
            {direction === 'rtl' ? <ChevronRight /> : <ChevronLeft />}
          </ActionButton>
        }
        <h2
          // We have a visually hidden heading describing the entire visible range,
          // and the calendar itself describes the individual month
          // so we don't need to repeat that here for screen reader users.
          aria-hidden
          className={classNames(styles, 'spectrum-Calendar-title')}>
          {getCurrentMonthName(d, state.timeZone, monthDateFormatter)}
        </h2>
        {i === visibleMonths - 1 &&
          <ActionButton
            {...nextButtonProps}
            UNSAFE_className={classNames(styles, 'spectrum-Calendar-nextMonth')}
            isQuiet>
            {direction === 'rtl' ? <ChevronLeft /> : <ChevronRight />}
          </ActionButton>
        }
      </div>
    );

    calendars.push(
      <CalendarMonth
        {...props}
        key={i}
        state={state}
        startDate={d}
        firstDayOfWeek={firstDayOfWeek} />
    );
  }

  return (
    <div
      {...styleProps}
      {...calendarProps}
      ref={ref}
      className={
        classNames(styles,
          'spectrum-Calendar',
          styleProps.className
        )
      }>
      {/* Add a screen reader only description of the entire visible range rather than
        * a separate heading above each month grid. This is placed first in the DOM order
        * so that it is the first thing a touch screen reader user encounters.
        * In addition, VoiceOver on iOS does not announce the aria-label of the grid
        * elements, so the aria-label of the Calendar is included here as well. */}
      <VisuallyHidden>
        <h2>{calendarProps['aria-label']}</h2>
      </VisuallyHidden>
      <div className={classNames(styles, 'spectrum-Calendar-header')}>
        {titles}
      </div>
      <div className={classNames(styles, 'spectrum-Calendar-months')}>
        {calendars}
      </div>
      {/* For touch screen readers, add a visually hidden next button after the month grid
        * so it's easy to navigate after reaching the end without going all the way
        * back to the start of the month. */}
      <VisuallyHidden>
        <button
          aria-label={nextButtonProps['aria-label']}
          disabled={nextButtonProps.isDisabled}
          onClick={() => state.focusNextPage()}
          tabIndex={-1} />
      </VisuallyHidden>
      {state.isValueInvalid &&
        <HelpText
          showErrorIcon
          errorMessage={props.errorMessage || stringFormatter.format('invalidSelection', {selectedCount: 'highlightedRange' in state ? 2 : 1})}
          errorMessageProps={errorMessageProps}
          isInvalid
          // Intentionally a global class name so it can be targeted in DatePicker CSS...
          UNSAFE_className="spectrum-Calendar-helpText" />
      }
    </div>
  );
}

function getCurrentMonthName(date: CalendarState['focusedDate'], timezone: string, monthDateFormatter: ReturnType<typeof useDateFormatter>): string {
  if (date.calendar.getCurrentMonth) {
    const monthRange = date.calendar.getCurrentMonth(date);
    // The monthRange's index indicates which month we are in in the current year, since the start of 
    // the month range may not be in the same month (e.g. fiscal calendar).
    // To get the correct year, use the end date's year. Unless the month is December, then use the start date's year.
    // This ensures that we don't have two December 2025s or January 2026s 12 months apart.
    const month = date.set({month: monthRange.index, year: monthRange.index === 12 ? monthRange.start.year : monthRange.end.year});
    return monthDateFormatter.format(month.toDate(timezone));
  }
  return monthDateFormatter.format(date.toDate(timezone));
}
