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

import {AriaCalendarCellProps, useCalendarCell} from '@react-aria/calendar';
import {CalendarDate, getDayOfWeek, isSameDay, isSameMonth, isToday} from '@internationalized/date';
import {CalendarState, RangeCalendarState} from '@react-stately/calendar';
import {classNames} from '@react-spectrum/utils';
import {mergeProps} from '@react-aria/utils';
import React, {useRef} from 'react';
import styles from '@adobe/spectrum-css-temp/components/calendar/vars.css';
import {useFocusRing} from '@react-aria/focus';
import {useHover} from '@react-aria/interactions';
import {useLocale} from '@react-aria/i18n';

interface CalendarCellProps extends AriaCalendarCellProps {
  state: CalendarState | RangeCalendarState,
  currentMonth: CalendarDate,
  firstDayOfWeek?: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
}

export function CalendarCell({state, currentMonth, firstDayOfWeek, ...props}: CalendarCellProps) {
  let ref = useRef<HTMLElement>(null);
  let {
    cellProps,
    buttonProps,
    isPressed,
    isSelected,
    isDisabled,
    isFocused,
    isInvalid,
    formattedDate
  } = useCalendarCell({
    ...props,
    isDisabled: !isSameMonth(props.date, currentMonth)
  }, state, ref);
  let isUnavailable = state.isCellUnavailable(props.date) && !isDisabled;
  let isLastSelectedBeforeDisabled = !isDisabled && !isInvalid && state.isCellUnavailable(props.date.add({days: 1}));
  let isFirstSelectedAfterDisabled = !isDisabled && !isInvalid && state.isCellUnavailable(props.date.subtract({days: 1}));
  let highlightedRange = 'highlightedRange' in state && state.highlightedRange;
  let isSelectionStart = isSelected && highlightedRange && isSameDay(props.date, highlightedRange.start);
  let isSelectionEnd = isSelected && highlightedRange && isSameDay(props.date, highlightedRange.end);
  let {locale} = useLocale();
  let dayOfWeek = getDayOfWeek(props.date, locale, firstDayOfWeek);
  let {isRangeStart, isRangeEnd} = getIsRangeStartOrEnd({isSelected, date: props.date, dayOfWeek, currentMonth, isFirstSelectedAfterDisabled, isLastSelectedBeforeDisabled});
  let {focusProps, isFocusVisible} = useFocusRing();
  let {hoverProps, isHovered} = useHover({isDisabled: isDisabled || isUnavailable || state.isReadOnly});

  return (
    <td
      {...cellProps}
      className={classNames(styles, 'spectrum-Calendar-tableCell')}>
      <span
        {...mergeProps(buttonProps, hoverProps, focusProps)}
        ref={ref}
        className={classNames(styles, 'spectrum-Calendar-date', {
          'is-today': isToday(props.date, state.timeZone),
          'is-selected': isSelected,
          'is-focused': isFocused && isFocusVisible,
          // Style disabled (i.e. out of min/max range), but selected dates as unavailable
          // since it is more clear than trying to dim the selection.
          'is-disabled': isDisabled && !isInvalid,
          'is-unavailable': isUnavailable || (isInvalid && isDisabled),
          'is-outsideMonth': !isSameMonth(props.date, currentMonth),
          'is-range-start': isRangeStart,
          'is-range-end': isRangeEnd,
          'is-range-selection': isSelected && 'highlightedRange' in state,
          'is-selection-start': isSelectionStart,
          'is-selection-end': isSelectionEnd,
          'is-hovered': isHovered,
          'is-pressed': isPressed && !state.isReadOnly,
          'is-invalid': isInvalid
        })}>
        <span className={classNames(styles, 'spectrum-Calendar-dateText')}>
          <span>{formattedDate}</span>
        </span>
      </span>
    </td>
  );
}

function getIsRangeStartOrEnd({
  date,
  dayOfWeek,
  isSelected,
  currentMonth,
  isFirstSelectedAfterDisabled,
  isLastSelectedBeforeDisabled
}: {
  date: CalendarDate,
  dayOfWeek: number,
  isSelected: boolean,
  currentMonth: CalendarDate,
  isFirstSelectedAfterDisabled: boolean,
  isLastSelectedBeforeDisabled: boolean
}) {
  if (!isSelected) {
    return {
      isRangeStart: false,
      isRangeEnd: false
    };
  }

  const dayOfMonth = date.day;
  let isStartOfMonth = dayOfMonth === 1;
  let isEndOfMonth = dayOfMonth === currentMonth.calendar.getDaysInMonth(currentMonth);
  
  if (currentMonth.calendar.getCurrentMonth) {
    const customMonth = currentMonth.calendar.getCurrentMonth(date);
    isStartOfMonth = dayOfMonth === customMonth.start.day && customMonth.start.month === date.month;
    isEndOfMonth = dayOfMonth === customMonth.end.day && customMonth.end.month === date.month;
  }

  const isRangeStart = isFirstSelectedAfterDisabled || dayOfWeek === 0 || isStartOfMonth;
  const isRangeEnd = isLastSelectedBeforeDisabled || dayOfWeek === 6 || isEndOfMonth;
  return {
    isRangeStart,
    isRangeEnd
  };
}
