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

import {alignCenter, constrainValue, isInvalid, previousAvailableDate} from './utils';
import {Calendar, CalendarDate, DateDuration, GregorianCalendar, isEqualDay, maxDate, minDate, toCalendar, toCalendarDate} from '@internationalized/date';
import {CalendarState, RangeCalendarState} from './types';
import {DateRange, DateValue, RangeCalendarProps} from '@react-types/calendar';
import {RangeValue, ValidationState} from '@react-types/shared';
import {useCalendarState} from './useCalendarState';
import {useControlledState} from '@react-stately/utils';
import {useMemo, useRef, useState} from 'react';

export interface RangeCalendarStateOptions<T extends DateValue = DateValue> extends RangeCalendarProps<T> {
  /** The locale to display and edit the value according to. */
  locale: string,
  /**
   * A function that creates a [Calendar](../internationalized/date/Calendar.html)
   * object for a given calendar identifier. Such a function may be imported from the
   * `@internationalized/date` package, or manually implemented to include support for
   * only certain calendars.
   */
  createCalendar: (name: string) => Calendar,
  /**
   * The amount of days that will be displayed at once. This affects how pagination works.
   * @default {months: 1}
   */
  visibleDuration?: DateDuration
}

/**
 * Provides state management for a range calendar component.
 * A range calendar displays one or more date grids and allows users to select a contiguous range of dates.
 */
export function useRangeCalendarState<T extends DateValue = DateValue>(props: RangeCalendarStateOptions<T>): RangeCalendarState {
  let {value: valueProp, defaultValue, onChange, createCalendar, locale, visibleDuration = {months: 1}, minValue, maxValue, ...calendarProps} = props;
  let [value, setValue] = useControlledState<DateRange>(
    valueProp,
    defaultValue || null,
    onChange
  );

  let [anchorDate, setAnchorDateState] = useState(props.anchorDate || null);
  let alignment: 'center' | 'start' = 'center';
  if (value && value.start && value.end) {
    let start = alignCenter(toCalendarDate(value.start), visibleDuration, locale, minValue, maxValue);
    let end = start.add(visibleDuration).subtract({days: 1});

    if (value.end.compare(end) > 0) {
      alignment = 'start';
    }
  }

  // Available range must be stored in a ref so we have access to the updated version immediately in `isInvalid`.
  let availableRangeRef = useRef<RangeValue<DateValue>>(null);
  let [availableRange, setAvailableRange] = useState<RangeValue<DateValue>>(null);
  let min = useMemo(() => maxDate(minValue, availableRange?.start), [minValue, availableRange]);
  let max = useMemo(() => minDate(maxValue, availableRange?.end), [maxValue, availableRange]);

  let calendar = useCalendarState({
    ...calendarProps,
    value: value && value.start,
    createCalendar,
    locale,
    visibleDuration,
    minValue: min,
    maxValue: max,
    selectionAlignment: alignment
  });

  let updateAvailableRange = (date) => {
    if (date && props.isDateUnavailable && !props.allowsNonContiguousRanges) {
      availableRangeRef.current = {
        start: nextUnavailableDate(date, calendar, -1),
        end: nextUnavailableDate(date, calendar, 1)
      };
      setAvailableRange(availableRangeRef.current);
    } else {
      availableRangeRef.current = null;
      setAvailableRange(null);
    }
  };

  // If the visible range changes, we need to update the available range.
  let [lastVisibleRange, setLastVisibleRange] = useState(calendar.visibleRange);
  if (!isEqualDay(calendar.visibleRange.start, lastVisibleRange.start) || !isEqualDay(calendar.visibleRange.end, lastVisibleRange.end)) {
    updateAvailableRange(anchorDate);
    setLastVisibleRange(calendar.visibleRange);
  }

  let setAnchorDate = (date: CalendarDate) => {
    if (date) {
      setAnchorDateState(date);
      updateAvailableRange(date);
    } else {
      setAnchorDateState(null);
      updateAvailableRange(null);
    }
  };

  let highlightedRange = anchorDate && !props.anchorDate ? makeRange(anchorDate, calendar.focusedDate) : value && makeRange(value.start, value.end);
  let selectDate = (date: CalendarDate) => {
    if (props.isReadOnly) {
      return;
    }

    date = constrainValue(date, min, max);
    date = previousAvailableDate(date, calendar.visibleRange.start, props.isDateUnavailable);
    if (!date) {
      return;
    }

    if (!anchorDate) {
      setAnchorDate(date);
    } else {
      let range = makeRange(anchorDate, date);
      setValue({
        start: convertValue(range.start, value?.start),
        end: convertValue(range.end, value?.end)
      });
      setAnchorDate(props.anchorDate || null);
    }
  };

  let [isDragging, setDragging] = useState(false);

  let {isDateUnavailable} = props;
  let isInvalidSelection = useMemo(() => {
    if (!value || anchorDate) {
      return false;
    }

    if (isDateUnavailable && (isDateUnavailable(value.start) || isDateUnavailable(value.end))) {
      return true;
    }

    return isInvalid(value.start, minValue, maxValue) || isInvalid(value.end, minValue, maxValue);
  }, [isDateUnavailable, value, anchorDate, minValue, maxValue]);

  let isValueInvalid = props.isInvalid || props.validationState === 'invalid' || isInvalidSelection;
  let validationState: ValidationState = isValueInvalid ? 'invalid' : null;

  return {
    ...calendar,
    value,
    setValue,
    anchorDate,
    setAnchorDate,
    highlightedRange,
    validationState,
    isValueInvalid,
    selectFocusedDate() {
      if (!props.anchorDate) {
        selectDate(calendar.focusedDate);
      }
    },
    selectDate,
    highlightDate(date) {
      if (anchorDate) {
        calendar.setFocusedDate(date);
      }
    },
    isSelected(date) {
      return highlightedRange && date.compare(highlightedRange.start) >= 0 && date.compare(highlightedRange.end) <= 0 && !calendar.isCellDisabled(date) && !calendar.isCellUnavailable(date);
    },
    isInvalid(date) {
      return calendar.isInvalid(date) || isInvalid(date, availableRangeRef.current?.start, availableRangeRef.current?.end);
    },
    isDragging,
    setDragging
  };
}

function makeRange(start: DateValue, end: DateValue): RangeValue<CalendarDate> {
  if (!start || !end) {
    return null;
  }

  if (end.compare(start) < 0) {
    [start, end] = [end, start];
  }

  return {start: toCalendarDate(start), end: toCalendarDate(end)};
}

function convertValue(newValue: CalendarDate, oldValue: DateValue) {
  // The display calendar should not have any effect on the emitted value.
  // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
  newValue = toCalendar(newValue, oldValue?.calendar || new GregorianCalendar());

  // Preserve time if the input value had one.
  if (oldValue && 'hour' in oldValue) {
    return oldValue.set(newValue);
  }

  return newValue;
}

function nextUnavailableDate(anchorDate: CalendarDate, state: CalendarState, dir: number) {
  let nextDate = anchorDate.add({days: dir});
  while (
    (dir < 0 ? nextDate.compare(state.visibleRange.start) >= 0 : nextDate.compare(state.visibleRange.end) <= 0) &&
    !state.isCellUnavailable(nextDate)
  ) {
    nextDate = nextDate.add({days: dir});
  }

  if (state.isCellUnavailable(nextDate)) {
    return nextDate.add({days: -dir});
  }

  return null;
}
