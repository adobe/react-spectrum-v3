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

import {
  CalendarDate,
  isEqualDay,
  isSameDay,
  isToday
} from '@internationalized/date';
import {CalendarState, RangeCalendarState} from '@react-stately/calendar';
import {DOMAttributes} from '@react-types/shared';
import {
  focusWithoutScrolling,
  getScrollParent,
  mergeProps,
  scrollIntoViewport,
  useDeepMemo,
  useDescription
} from '@react-aria/utils';
import {getEraFormat, hookData} from './utils';
import {getInteractionModality, usePress} from '@react-aria/interactions';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {RefObject, useEffect, useMemo, useRef} from 'react';
import {
  useDateFormatter,
  useLocalizedStringFormatter
} from '@react-aria/i18n';

export interface AriaCalendarCellProps {
  /** The date that this cell represents. */
  date: CalendarDate,
  /**
   * Whether the cell is disabled. By default, this is determined by the
   * Calendar's `minValue`, `maxValue`, and `isDisabled` props.
   */
  isDisabled?: boolean
}

export interface CalendarCellAria {
  /** Props for the grid cell element (e.g. `<td>`). */
  cellProps: DOMAttributes,
  /** Props for the button element within the cell. */
  buttonProps: DOMAttributes,
  /** Whether the cell is currently being pressed. */
  isPressed: boolean,
  /** Whether the cell is selected. */
  isSelected: boolean,
  /** Whether the cell is focused. */
  isFocused: boolean,
  /**
   * Whether the cell is disabled, according to the calendar's `minValue`, `maxValue`, and `isDisabled` props.
   * Disabled dates are not focusable, and cannot be selected by the user. They are typically
   * displayed with a dimmed appearance.
   */
  isDisabled: boolean,
  /**
   * Whether the cell is unavailable, according to the calendar's `isDateUnavailable` prop. Unavailable dates remain
   * focusable, but cannot be selected by the user. They should be displayed with a visual affordance to indicate they
   * are unavailable, such as a different color or a strikethrough.
   *
   * Note that because they are focusable, unavailable dates must meet a 4.5:1 color contrast ratio,
   * [as defined by WCAG](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html).
   */
  isUnavailable: boolean,
  /**
   * Whether the cell is outside the visible range of the calendar.
   * For example, dates before the first day of a month in the same week.
   */
  isOutsideVisibleRange: boolean,
  /** Whether the cell is part of an invalid selection. */
  isInvalid: boolean,
  /** The day number formatted according to the current locale. */
  formattedDate: string
}

/**
 * Provides the behavior and accessibility implementation for a calendar cell component.
 * A calendar cell displays a date cell within a calendar grid which can be selected by the user.
 */
export function useCalendarCell(
  props: AriaCalendarCellProps,
  state: CalendarState | RangeCalendarState,
  ref: RefObject<HTMLElement>
): CalendarCellAria {
  let {date, isDisabled} = props;
  let {errorMessageId, selectedDateDescription} = hookData.get(state);
  let stringFormatter = useLocalizedStringFormatter(
    intlMessages,
    '@react-aria/calendar'
  );
  let dateFormatter = useDateFormatter({
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    era: getEraFormat(date),
    timeZone: state.timeZone
  });
  let isSelected = state.isSelected(date);
  let isFocused = state.isCellFocused(date);
  isDisabled = isDisabled || state.isCellDisabled(date);
  let isUnavailable = state.isCellUnavailable(date);
  let isSelectable = !isDisabled && !isUnavailable;
  let isInvalid =
    state.isValueInvalid &&
    ('highlightedRange' in state
      ? !state.anchorDate &&
        state.highlightedRange &&
        date.compare(state.highlightedRange.start) >= 0 &&
        date.compare(state.highlightedRange.end) <= 0
      : state.value && isSameDay(state.value, date));

  if (isInvalid) {
    isSelected = true;
  }

  // For performance, reuse the same date object as before if the new date prop is the same.
  // This allows subsequent useMemo results to be reused.
  date = useDeepMemo<CalendarDate>(date, isEqualDay);
  let nativeDate = useMemo(
    () => date.toDate(state.timeZone),
    [date, state.timeZone]
  );

  // aria-label should be localize Day of week, Month, Day and Year without Time.
  let isDateToday = isToday(date, state.timeZone);
  let label = useMemo(() => {
    let label = '';

    // If this is a range calendar, add a description of the full selected range
    // to the first and last selected date.
    if (
      'highlightedRange' in state &&
      state.value &&
      !state.anchorDate &&
      (isSameDay(date, state.value.start) || isSameDay(date, state.value.end))
    ) {
      label = selectedDateDescription + ', ';
    }

    label += dateFormatter.format(nativeDate);
    if (isDateToday) {
      // If date is today, set appropriate string depending on selected state:
      label = stringFormatter.format(
        isSelected ? 'todayDateSelected' : 'todayDate',
        {
          date: label
        }
      );
    } else if (isSelected) {
      // If date is selected but not today:
      label = stringFormatter.format('dateSelected', {
        date: label
      });
    }

    if (state.minValue && isSameDay(date, state.minValue)) {
      label += ', ' + stringFormatter.format('minimumDate');
    } else if (state.maxValue && isSameDay(date, state.maxValue)) {
      label += ', ' + stringFormatter.format('maximumDate');
    }

    return label;
  }, [
    dateFormatter,
    nativeDate,
    stringFormatter,
    isSelected,
    isDateToday,
    date,
    state,
    selectedDateDescription
  ]);

  // When a cell is focused and this is a range calendar, add a prompt to help
  // screenreader users know that they are in a range selection mode.
  let rangeSelectionPrompt = '';
  if ('anchorDate' in state && isFocused && !state.isReadOnly && isSelectable) {
    // If selection has started add 'click to finish selecting range'
    if (state.anchorDate) {
      rangeSelectionPrompt = stringFormatter.format(
        'finishRangeSelectionPrompt'
      );
      // Otherwise, add 'click to start selecting range' prompt
    } else {
      rangeSelectionPrompt = stringFormatter.format(
        'startRangeSelectionPrompt'
      );
    }
  }

  let descriptionProps = useDescription(rangeSelectionPrompt);

  let isAnchorPressed = useRef(false);
  let isRangeBoundaryPressed = useRef(false);
  let touchDragTimerRef = useRef(null);
  let {pressProps, isPressed} = usePress({
    // When dragging to select a range, we don't want dragging over the original anchor
    // again to trigger onPressStart. Cancel presses immediately when the pointer exits.
    shouldCancelOnPointerExit: 'anchorDate' in state && !!state.anchorDate,
    preventFocusOnPress: true,
    isDisabled: !isSelectable || state.isReadOnly,
    onPressStart(e) {
      if (state.isReadOnly) {
        state.setFocusedDate(date);
        return;
      }

      if (
        'highlightedRange' in state &&
        !state.anchorDate &&
        (e.pointerType === 'mouse' || e.pointerType === 'touch')
      ) {
        // Allow dragging the start or end date of a range to modify it
        // rather than starting a new selection.
        // Don't allow dragging when invalid, or weird jumping behavior may occur as date ranges
        // are constrained to available dates. The user will need to select a new range in this case.
        if (state.highlightedRange && !isInvalid) {
          if (isSameDay(date, state.highlightedRange.start)) {
            state.setAnchorDate(state.highlightedRange.end);
            state.setFocusedDate(date);
            state.setDragging(true);
            isRangeBoundaryPressed.current = true;
            return;
          } else if (isSameDay(date, state.highlightedRange.end)) {
            state.setAnchorDate(state.highlightedRange.start);
            state.setFocusedDate(date);
            state.setDragging(true);
            isRangeBoundaryPressed.current = true;
            return;
          }
        }

        let startDragging = () => {
          state.setDragging(true);
          touchDragTimerRef.current = null;

          state.selectDate(date);
          state.setFocusedDate(date);
          isAnchorPressed.current = true;
        };

        // Start selection on mouse/touch down so users can drag to select a range.
        // On touch, delay dragging to determine if the user really meant to scroll.
        if (e.pointerType === 'touch') {
          touchDragTimerRef.current = setTimeout(startDragging, 200);
        } else {
          startDragging();
        }
      }
    },
    onPressEnd() {
      isRangeBoundaryPressed.current = false;
      isAnchorPressed.current = false;
      clearTimeout(touchDragTimerRef.current);
      touchDragTimerRef.current = null;
    },
    onPress() {
      // For non-range selection, always select on press up.
      if (!('anchorDate' in state) && !state.isReadOnly) {
        state.selectDate(date);
        state.setFocusedDate(date);
      }
    },
    onPressUp(e) {
      if (state.isReadOnly) {
        return;
      }

      // If the user tapped quickly, the date won't be selected yet and the
      // timer will still be in progress. In this case, select the date on touch up.
      // Timer is cleared in onPressEnd.
      if ('anchorDate' in state && touchDragTimerRef.current) {
        state.selectDate(date);
        state.setFocusedDate(date);
      }

      if ('anchorDate' in state) {
        if (isRangeBoundaryPressed.current) {
          // When clicking on the start or end date of an already selected range,
          // start a new selection on press up to also allow dragging the date to
          // change the existing range.
          state.setAnchorDate(date);
        } else if (state.anchorDate && !isAnchorPressed.current) {
          // When releasing a drag or pressing the end date of a range, select it.
          state.selectDate(date);
          state.setFocusedDate(date);
        } else if (e.pointerType === 'keyboard' && !state.anchorDate) {
          // For range selection, auto-advance the focused date by one if using keyboard.
          // This gives an indication that you're selecting a range rather than a single date.
          // For mouse, this is unnecessary because users will see the indication on hover. For screen readers,
          // there will be an announcement to 'click to finish selecting range' (above).
          state.selectDate(date);
          let nextDay = date.add({days: 1});
          if (state.isInvalid(nextDay)) {
            nextDay = date.subtract({days: 1});
          }
          if (!state.isInvalid(nextDay)) {
            state.setFocusedDate(nextDay);
          }
        } else if (e.pointerType === 'virtual') {
          // For screen readers, just select the date on click.
          state.selectDate(date);
          state.setFocusedDate(date);
        }
      }
    }
  });

  let tabIndex = null;
  if (!isDisabled) {
    tabIndex = isSameDay(date, state.focusedDate) ? 0 : -1;
  }

  // Focus the button in the DOM when the state updates.
  useEffect(() => {
    if (isFocused && ref.current) {
      focusWithoutScrolling(ref.current);

      // Scroll into view if navigating with a keyboard, otherwise
      // try not to shift the view under the user's mouse/finger.
      // If in a overlay, scrollIntoViewport will only cause scrolling
      // up to the overlay scroll body to prevent overlay shifting.
      // Also only scroll into view if the cell actually got focused.
      // There are some cases where the cell might be disabled or inside,
      // an inert container and we don't want to scroll then.
      if (
        getInteractionModality() !== 'pointer' &&
        document.activeElement === ref.current
      ) {
        scrollIntoViewport(ref.current, {
          containingElement: getScrollParent(ref.current)
        });
      }
    }
  }, [isFocused, ref]);

  let cellDateFormatter = useDateFormatter({
    day: 'numeric',
    timeZone: state.timeZone,
    calendar: date.calendar.identifier
  });

  let formattedDate = useMemo(
    () =>
      cellDateFormatter
        .formatToParts(nativeDate)
        .find((part) => part.type === 'day').value,
    [cellDateFormatter, nativeDate]
  );

  return {
    cellProps: {
      role: 'gridcell',
      'aria-disabled': !isSelectable || null,
      'aria-selected': isSelected || null,
      'aria-invalid': isInvalid || null
    },
    buttonProps: mergeProps(pressProps, {
      onFocus() {
        if (!isDisabled) {
          state.setFocusedDate(date);
        }
      },
      tabIndex,
      role: 'button',
      'aria-disabled': !isSelectable || null,
      'aria-label': label,
      'aria-invalid': isInvalid || null,
      'aria-describedby':
        [
          isInvalid ? errorMessageId : null,
          descriptionProps['aria-describedby']
        ]
          .filter(Boolean)
          .join(' ') || undefined,
      onPointerEnter(e) {
        // Highlight the date on hover or drag over a date when selecting a range.
        if (
          'highlightDate' in state &&
          (e.pointerType !== 'touch' || state.isDragging) &&
          isSelectable
        ) {
          state.highlightDate(date);
        }
      },
      onPointerDown(e) {
        try {
          // This is necessary on touch devices to allow dragging
          // outside the original pressed element.
          // (JSDOM does not support this)
          if ('releasePointerCapture' in e.target) {
            e.target.releasePointerCapture(e.pointerId);
          }
        } catch {
          // `releasePointerCapture` sometimes fails when being invoked with the exception:
          //  DOMException: Failed to execute 'releasePointerCapture' on 'Element':
          //  No active pointer with the given id is found.
          //
          // There's no need to do anything in case of failure
        }
      },
      onContextMenu(e) {
        // Prevent context menu on long press.
        e.preventDefault();
      }
    }),
    isPressed,
    isFocused,
    isSelected,
    isDisabled,
    isUnavailable,
    isOutsideVisibleRange:
      date.compare(state.visibleRange.start) < 0 ||
      date.compare(state.visibleRange.end) > 0,
    isInvalid,
    formattedDate
  };
}
