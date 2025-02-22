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

import {CalendarDate, DateFormatter, endOfMonth, isSameDay, startOfMonth} from '@internationalized/date';
import {CalendarState, RangeCalendarState} from '@react-stately/calendar';
// @ts-ignore
import intlMessages from '../intl/*.json';
import type {LocalizedStringFormatter} from '@internationalized/string';
import {useDateFormatter, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useMemo} from 'react';

interface HookData {
  ariaLabel?: string,
  ariaLabelledBy?: string,
  errorMessageId: string,
  selectedDateDescription: string
}

export const hookData = new WeakMap<CalendarState | RangeCalendarState, HookData>();

export function getEraFormat(date: CalendarDate | undefined): 'short' | undefined {
  return date?.calendar.identifier === 'gregory' && date.era === 'BC' ? 'short' : undefined;
}

export function useSelectedDateDescription(state: CalendarState | RangeCalendarState) {
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-aria/calendar');

  let start: CalendarDate | undefined, end: CalendarDate | undefined;
  if ('highlightedRange' in state) {
    ({start, end} = state.highlightedRange || {});
  } else {
    start = end = state.value ?? undefined;
  }

  let dateFormatter = useDateFormatter({
    weekday: 'long',
    month: 'long',
    year: 'numeric',
    day: 'numeric',
    era: getEraFormat(start) || getEraFormat(end),
    timeZone: state.timeZone
  });

  let anchorDate = 'anchorDate' in state ? state.anchorDate : null;
  return useMemo(() => {
    // No message if currently selecting a range, or there is nothing highlighted.
    if (!anchorDate && start && end) {
      // Use a single date message if the start and end dates are the same day,
      // otherwise include both dates.
      if (isSameDay(start, end)) {
        let date = dateFormatter.format(start.toDate(state.timeZone));
        return stringFormatter.format('selectedDateDescription', {date});
      } else {
        let dateRange = formatRange(dateFormatter, stringFormatter, start, end, state.timeZone);

        return stringFormatter.format('selectedRangeDescription', {dateRange});
      }
    }
    return '';
  }, [start, end, anchorDate, state.timeZone, stringFormatter, dateFormatter]);
}

export function useVisibleRangeDescription(startDate: CalendarDate, endDate: CalendarDate, timeZone: string, isAria: boolean) {
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-aria/calendar');
  let era: any = getEraFormat(startDate) || getEraFormat(endDate);
  let monthFormatter = useDateFormatter({
    month: 'long',
    year: 'numeric',
    era,
    calendar: startDate.calendar.identifier,
    timeZone
  });

  let dateFormatter = useDateFormatter({
    month: 'long',
    year: 'numeric',
    day: 'numeric',
    era,
    calendar: startDate.calendar.identifier,
    timeZone
  });

  return useMemo(() => {
    const customMonthFormat = formatBasedOnCustomMonth(monthFormatter, stringFormatter, startDate, endDate, timeZone, isAria);
    if (customMonthFormat) {
      return customMonthFormat;
    }
      
    // Special case for month granularity. Format as a single month if only a
    // single month is visible, otherwise format as a range of months.
    if (isSameDay(startDate, startOfMonth(startDate))) {
      if (isSameDay(endDate, endOfMonth(startDate))) {
        return monthFormatter.format(startDate.toDate(timeZone));
      } else if (isSameDay(endDate, endOfMonth(endDate))) {
        return isAria
          ? formatRange(monthFormatter, stringFormatter, startDate, endDate, timeZone)
          : monthFormatter.formatRange(startDate.toDate(timeZone), endDate.toDate(timeZone));
      }
    }

    return isAria
      ? formatRange(dateFormatter, stringFormatter, startDate, endDate, timeZone)
      : dateFormatter.formatRange(startDate.toDate(timeZone), endDate.toDate(timeZone));
  }, [startDate, endDate, monthFormatter, dateFormatter, stringFormatter, timeZone, isAria]);
}

function formatRange(dateFormatter: DateFormatter, stringFormatter: LocalizedStringFormatter, start: CalendarDate, end: CalendarDate, timeZone: string) {
  let parts = dateFormatter.formatRangeToParts(start.toDate(timeZone), end.toDate(timeZone));

  // Find the separator between the start and end date. This is determined
  // by finding the last shared literal before the end range.
  let separatorIndex = -1;
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    if (part.source === 'shared' && part.type === 'literal') {
      separatorIndex = i;
    } else if (part.source === 'endRange') {
      break;
    }
  }

  // Now we can combine the parts into start and end strings.
  let startValue = '';
  let endValue = '';
  for (let i = 0; i < parts.length; i++) {
    if (i < separatorIndex) {
      startValue += parts[i].value;
    } else if (i > separatorIndex) {
      endValue += parts[i].value;
    }
  }

  return stringFormatter.format('dateRange', {startDate: startValue, endDate: endValue});
}

// If the calendar has a getCurrentMonth function, use it to format the range.
function formatBasedOnCustomMonth(monthFormatter: DateFormatter, stringFormatter: LocalizedStringFormatter, startDate: CalendarDate, endDate: CalendarDate, timeZone: string, isAria: boolean) {
  const getCurrentMonth = bindGetCurrentMonthFunction(startDate) || bindGetCurrentMonthFunction(endDate);
  if (!getCurrentMonth) {
    return undefined;
  }

  // To get the correct year, use the end date's year. Unless the month is December, then use the start date's year.
  // This ensures that we don't have two Decembers or Januarys 12 months apart in the "same year".
  const getCorrectYear = (month: ReturnType<typeof getCurrentMonth>) => month.index === 12 ? month.start.year : month.end.year;

  const startMonth = getCurrentMonth(startDate);
  const endMonth = getCurrentMonth(endDate);
  if (startMonth.index === endMonth.index) {
    return monthFormatter.format(startDate.set({month: startMonth.index, year: getCorrectYear(endMonth)}).toDate(timeZone));
  }

  const adjustedStartDate = startMonth.start.set({month: startMonth.index, year: getCorrectYear(startMonth)}) as CalendarDate;
  const adjustedEndDate = endMonth.end.set({month: endMonth.index, year: getCorrectYear(endMonth)}) as CalendarDate;
  return isAria
    ? formatRange(monthFormatter, stringFormatter, adjustedStartDate, adjustedEndDate, timeZone)
    : monthFormatter.formatRange(adjustedStartDate.toDate(timeZone), adjustedEndDate.toDate(timeZone));
}

function bindGetCurrentMonthFunction(date: CalendarDate) {
  return date.calendar.getCurrentMonth?.bind(date.calendar);
}
