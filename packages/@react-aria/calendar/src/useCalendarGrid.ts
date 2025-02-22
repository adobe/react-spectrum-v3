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

import {CalendarDate, getWeeksInMonth, startOfWeek, today} from '@internationalized/date';
import {CalendarState, RangeCalendarState} from '@react-stately/calendar';
import {DOMAttributes} from '@react-types/shared';
import {hookData, useVisibleRangeDescription} from './utils';
import {KeyboardEvent, useMemo} from 'react';
import {mergeProps, useLabels} from '@react-aria/utils';
import {useDateFormatter, useLocale} from '@react-aria/i18n';

export interface AriaCalendarGridProps {
  /**
   * The first date displayed in the calendar grid.
   * Defaults to the first visible date in the calendar.
   * Override this to display multiple date grids in a calendar.
   */
  startDate?: CalendarDate,
  /**
   * The last date displayed in the calendar grid.
   * Defaults to the last visible date in the calendar.
   * Override this to display multiple date grids in a calendar.
   */
  endDate?: CalendarDate,
  /**
   * The style of weekday names to display in the calendar grid header,
   * e.g. single letter, abbreviation, or full day name.
   * @default "narrow"
   */
  weekdayStyle?: 'narrow' | 'short' | 'long',
  /**
   * The day that starts the week.
   */
  firstDayOfWeek?: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
}

export interface CalendarGridAria {
  /** Props for the date grid element (e.g. `<table>`). */
  gridProps: DOMAttributes,
  /** Props for the grid header element (e.g. `<thead>`). */
  headerProps: DOMAttributes,
  /** A list of week day abbreviations formatted for the current locale, typically used in column headers. */
  weekDays: string[],
  /** The number of weeks in the month. */
  weeksInMonth: number
}

/**
 * Provides the behavior and accessibility implementation for a calendar grid component.
 * A calendar grid displays a single grid of days within a calendar or range calendar which
 * can be keyboard navigated and selected by the user.
 */
export function useCalendarGrid(props: AriaCalendarGridProps, state: CalendarState | RangeCalendarState): CalendarGridAria {
  let {
    startDate = state.visibleRange.start,
    endDate = state.visibleRange.end,
    firstDayOfWeek
  } = props;

  let {direction} = useLocale();

  let onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        state.selectFocusedDate();
        break;
      case 'PageUp':
        e.preventDefault();
        e.stopPropagation();
        state.focusPreviousSection(e.shiftKey);
        break;
      case 'PageDown':
        e.preventDefault();
        e.stopPropagation();
        state.focusNextSection(e.shiftKey);
        break;
      case 'End':
        e.preventDefault();
        e.stopPropagation();
        state.focusSectionEnd();
        break;
      case 'Home':
        e.preventDefault();
        e.stopPropagation();
        state.focusSectionStart();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        e.stopPropagation();
        if (direction === 'rtl') {
          state.focusNextDay();
        } else {
          state.focusPreviousDay();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        state.focusPreviousRow();
        break;
      case 'ArrowRight':
        e.preventDefault();
        e.stopPropagation();
        if (direction === 'rtl') {
          state.focusPreviousDay();
        } else {
          state.focusNextDay();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        state.focusNextRow();
        break;
      case 'Escape':
        // Cancel the selection.
        if ('setAnchorDate' in state) {
          e.preventDefault();
          state.setAnchorDate(null);
        }
        break;
    }
  };

  let visibleRangeDescription = useVisibleRangeDescription(startDate, endDate, state.timeZone, true);

  let {ariaLabel, ariaLabelledBy} = hookData.get(state)!;
  let labelProps = useLabels({
    'aria-label': [ariaLabel, visibleRangeDescription].filter(Boolean).join(', '),
    'aria-labelledby': ariaLabelledBy
  });

  let dayFormatter = useDateFormatter({weekday: props.weekdayStyle || 'narrow', timeZone: state.timeZone});
  let {locale} = useLocale();
  let weekDays = useMemo(() => {
    let weekStart = startOfWeek(today(state.timeZone), locale, firstDayOfWeek);
    return [...new Array(7).keys()].map((index) => {
      let date = weekStart.add({days: index});
      let dateDay = date.toDate(state.timeZone);
      return dayFormatter.format(dateDay);
    });
  }, [locale, state.timeZone, dayFormatter, firstDayOfWeek]);
  let weeksInMonth = getWeeksInMonth(startDate, locale, firstDayOfWeek);

  return {
    gridProps: mergeProps(labelProps, {
      role: 'grid',
      'aria-readonly': state.isReadOnly || undefined,
      'aria-disabled': state.isDisabled || undefined,
      'aria-multiselectable': ('highlightedRange' in state) || undefined,
      onKeyDown,
      onFocus: () => state.setFocused(true),
      onBlur: () => state.setFocused(false)
    }),
    headerProps: {
      // Column headers are hidden to screen readers to make navigating with a touch screen reader easier.
      // The day names are already included in the label of each cell, so there's no need to announce them twice.
      'aria-hidden': true
    },
    weekDays,
    weeksInMonth
  };
}
