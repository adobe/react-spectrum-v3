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
import {
  AriaCalendarProps,
  AriaRangeCalendarProps,
  DateValue,
  mergeProps,
  useCalendar,
  useCalendarCell,
  useCalendarGrid,
  useFocusRing,
  useHover,
  useLocale,
  useRangeCalendar,
  VisuallyHidden
} from 'react-aria';
import {ButtonContext} from './Button';
import {CalendarDate, createCalendar, DateDuration, endOfMonth, isSameDay, isSameMonth} from '@internationalized/date';
import {CalendarState, RangeCalendarState, useCalendarState, useRangeCalendarState} from 'react-stately';
import {ContextValue, DOMProps, Provider, RenderProps, SlotProps, StyleProps, useContextProps, useRenderProps, useSlottedContext} from './utils';
import {DOMAttributes, FocusableElement, forwardRefType, HoverEvents} from '@react-types/shared';
import {filterDOMProps} from '@react-aria/utils';
import {HeadingContext} from './RSPContexts';
import React, {createContext, ForwardedRef, forwardRef, ReactElement, useContext, useRef} from 'react';
import {TextContext} from './Text';

export interface CalendarRenderProps {
  /**
   * Whether the calendar is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * State of the calendar.
   */
  state: CalendarState,
  /**
   * Whether the calendar is invalid.
   * @selector [data-invalid]
   */
  isInvalid: boolean
}

export interface RangeCalendarRenderProps extends Omit<CalendarRenderProps, 'state'> {
  /**
   * State of the range calendar.
   */
  state: RangeCalendarState
}

export interface CalendarProps<T extends DateValue> extends Omit<AriaCalendarProps<T>, 'errorMessage' | 'validationState'>, RenderProps<CalendarRenderProps>, SlotProps {
  /**
   * The amount of days that will be displayed at once. This affects how pagination works.
   * @default {months: 1}
   */
  visibleDuration?: DateDuration,

  /**
   * A function to create a new [Calendar](https://react-spectrum.adobe.com/internationalized/date/Calendar.html)
   * object for a given calendar identifier. If not provided, the {@link createCalendar} function
   * from `@internationalized/date` will be used.
   */
  createCalendar?: typeof createCalendar
}

export interface RangeCalendarProps<T extends DateValue> extends Omit<AriaRangeCalendarProps<T>, 'errorMessage' | 'validationState'>, RenderProps<RangeCalendarRenderProps>, SlotProps {
  /**
   * The amount of days that will be displayed at once. This affects how pagination works.
   * @default {months: 1}
   */
  visibleDuration?: DateDuration,

  /**
   * A function to create a new [Calendar](https://react-spectrum.adobe.com/internationalized/date/Calendar.html)
   * object for a given calendar identifier. If not provided, the {@link createCalendar} function
   * from `@internationalized/date` will be used.
   */
  createCalendar?: typeof createCalendar
}

export const CalendarContext = createContext<ContextValue<CalendarProps<any>, HTMLDivElement>>(null);
export const RangeCalendarContext = createContext<ContextValue<RangeCalendarProps<any>, HTMLDivElement>>(null);
export const CalendarStateContext = createContext<CalendarState | null>(null);
export const RangeCalendarStateContext = createContext<RangeCalendarState | null>(null);

/**
 * A calendar displays one or more date grids and allows users to select a single date.
 */
export const Calendar = /*#__PURE__*/ (forwardRef as forwardRefType)(function Calendar<T extends DateValue>(props: CalendarProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, CalendarContext);
  let {locale} = useLocale();
  let state = useCalendarState({
    createCalendar,
    ...props,
    locale
  });

  let {calendarProps, prevButtonProps, nextButtonProps, errorMessageProps, title} = useCalendar(props, state);

  let renderProps = useRenderProps({
    ...props,
    values: {
      state,
      isDisabled: props.isDisabled || false,
      isInvalid: state.isValueInvalid
    },
    defaultClassName: 'react-aria-Calendar'
  });

  return (
    <div
      {...renderProps}
      {...calendarProps}
      ref={ref}
      slot={props.slot || undefined}
      data-disabled={props.isDisabled || undefined}
      data-invalid={state.isValueInvalid || undefined}>
      <Provider
        values={[
          [ButtonContext, {
            slots: {
              previous: prevButtonProps,
              next: nextButtonProps
            }
          }],
          [HeadingContext, {'aria-hidden': true, level: 2, children: title}],
          [CalendarStateContext, state],
          [CalendarContext, props as CalendarProps<any>],
          [TextContext, {
            slots: {
              errorMessage: errorMessageProps
            }
          }]
        ]}>
        {/* Add a screen reader only description of the entire visible range rather than
          * a separate heading above each month grid. This is placed first in the DOM order
          * so that it is the first thing a touch screen reader user encounters.
          * In addition, VoiceOver on iOS does not announce the aria-label of the grid
          * elements, so the aria-label of the Calendar is included here as well. */}
        <VisuallyHidden>
          <h2>{calendarProps['aria-label']}</h2>
        </VisuallyHidden>
        {renderProps.children}
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
      </Provider>
    </div>
  );
});

/**
 * A range calendar displays one or more date grids and allows users to select a contiguous range of dates.
 */
export const RangeCalendar = /*#__PURE__*/ (forwardRef as forwardRefType)(function RangeCalendar<T extends DateValue>(props: RangeCalendarProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, RangeCalendarContext);
  let {locale} = useLocale();
  let state = useRangeCalendarState({
    createCalendar,
    ...props,
    locale
  });

  let {calendarProps, prevButtonProps, nextButtonProps, errorMessageProps, title} = useRangeCalendar(
    props,
    state,
    ref
  );

  let renderProps = useRenderProps({
    ...props,
    values: {
      state,
      isDisabled: props.isDisabled || false,
      isInvalid: state.isValueInvalid
    },
    defaultClassName: 'react-aria-RangeCalendar'
  });

  return (
    <div
      {...renderProps}
      {...calendarProps}
      ref={ref}
      slot={props.slot || undefined}
      data-disabled={props.isDisabled || undefined}
      data-invalid={state.isValueInvalid || undefined}>
      <Provider
        values={[
          [ButtonContext, {
            slots: {
              previous: prevButtonProps,
              next: nextButtonProps
            }
          }],
          [HeadingContext, {'aria-hidden': true, level: 2, children: title}],
          [RangeCalendarStateContext, state],
          [RangeCalendarContext, props as RangeCalendarProps<any>],
          [TextContext, {
            slots: {
              errorMessage: errorMessageProps
            }
          }]
        ]}>
        {/* Add a screen reader only description of the entire visible range rather than
          * a separate heading above each month grid. This is placed first in the DOM order
          * so that it is the first thing a touch screen reader user encounters.
          * In addition, VoiceOver on iOS does not announce the aria-label of the grid
          * elements, so the aria-label of the Calendar is included here as well. */}
        <VisuallyHidden>
          <h2>{calendarProps['aria-label']}</h2>
        </VisuallyHidden>
        {renderProps.children}
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
      </Provider>
    </div>
  );
});

export interface CalendarCellRenderProps {
  /** The date that the cell represents. */
  date: CalendarDate,
  /** The day number formatted according to the current locale. */
  formattedDate: string,
  /**
   * Whether the cell is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean,
  /**
   * Whether the cell is currently being pressed.
   * @selector [data-pressed]
   */
  isPressed: boolean,
  /**
   * Whether the cell is selected.
   * @selector [data-selected]
   */
  isSelected: boolean,
  /**
   * Whether the cell is the first date in a range selection.
   * @selector [data-selection-start]
   */
  isSelectionStart: boolean,
  /**
   * Whether the cell is the last date in a range selection.
   * @selector [data-selection-end]
   */
  isSelectionEnd: boolean,
  /**
   * Whether the cell is focused.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the cell is keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the cell is disabled, according to the calendar's `minValue`, `maxValue`, and `isDisabled` props.
   * Disabled dates are not focusable, and cannot be selected by the user. They are typically
   * displayed with a dimmed appearance.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * Whether the cell is outside the visible range of the calendar.
   * For example, dates before the first day of a month in the same week.
   * @selector [data-outside-visible-range]
   */
  isOutsideVisibleRange: boolean,
  /**
   * Whether the cell is outside the current month.
   * @selector [data-outside-month]
   */
  isOutsideMonth: boolean,
  /**
   * Whether the cell is unavailable, according to the calendar's `isDateUnavailable` prop. Unavailable dates remain
   * focusable, but cannot be selected by the user. They should be displayed with a visual affordance to indicate they
   * are unavailable, such as a different color or a strikethrough.
   *
   * Note that because they are focusable, unavailable dates must meet a 4.5:1 color contrast ratio,
   * [as defined by WCAG](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html).
   *
   * @selector [data-unavailable]
   */
  isUnavailable: boolean,
  /**
   * Whether the cell is part of an invalid selection.
   * @selector [data-invalid]
   */
  isInvalid: boolean
}

export interface CalendarGridProps extends StyleProps {
  /**
   * Either a function to render calendar cells for each date in the month,
   * or children containing a `<CalendarGridHeader>`` and `<CalendarGridBody>`
   * when additional customization is needed.
   */
  children?: ReactElement | ReactElement[] | ((date: CalendarDate) => ReactElement),
  /**
   * An offset from the beginning of the visible date range that this
   * CalendarGrid should display. Useful when displaying more than one
   * month at a time.
   */
  offset?: DateDuration,
  /**
   * The style of weekday names to display in the calendar grid header,
   * e.g. single letter, abbreviation, or full day name.
   * @default "narrow"
   */
  weekdayStyle?: 'narrow' | 'short' | 'long'
}

interface InternalCalendarGridContextValue {
  headerProps: DOMAttributes<FocusableElement>,
  weekDays: string[],
  startDate: CalendarDate,
  weeksInMonth: number
}

const InternalCalendarGridContext = createContext<InternalCalendarGridContextValue | null>(null);

/**
 * A calendar grid displays a single grid of days within a calendar or range calendar which
 * can be keyboard navigated and selected by the user.
 */
export const CalendarGrid = /*#__PURE__*/ (forwardRef as forwardRefType)(function CalendarGrid(props: CalendarGridProps, ref: ForwardedRef<HTMLTableElement>) {
  let calendarState = useContext(CalendarStateContext);
  let rangeCalendarState = useContext(RangeCalendarStateContext);
  let calenderProps = useSlottedContext(CalendarContext)!;
  let rangeCalenderProps = useSlottedContext(RangeCalendarContext)!;
  let state = calendarState ?? rangeCalendarState!;
  let startDate = state.visibleRange.start;
  if (props.offset) {
    startDate = startDate.add(props.offset);
  }

  let firstDayOfWeek = calenderProps?.firstDayOfWeek ?? rangeCalenderProps?.firstDayOfWeek;

  let {gridProps, headerProps, weekDays, weeksInMonth} = useCalendarGrid({
    startDate,
    endDate: endOfMonth(startDate),
    weekdayStyle: props.weekdayStyle,
    firstDayOfWeek
  }, state);

  return (
    <InternalCalendarGridContext.Provider value={{headerProps, weekDays, startDate, weeksInMonth}}>
      <table
        {...filterDOMProps(props as any)}
        {...gridProps}
        ref={ref}
        style={props.style}
        className={props.className ?? 'react-aria-CalendarGrid'}>
        {typeof props.children !== 'function'
          ? props.children
          : (<>
            <CalendarGridHeaderForwardRef>
              {day => <CalendarHeaderCellForwardRef>{day}</CalendarHeaderCellForwardRef>}
            </CalendarGridHeaderForwardRef>
            <CalendarGridBodyForwardRef>
              {props.children}
            </CalendarGridBodyForwardRef>
          </>)
        }
      </table>
    </InternalCalendarGridContext.Provider>
  );
});

export interface CalendarGridHeaderProps extends StyleProps {
  /** A function to render a `<CalendarHeaderCell>` for a weekday name. */
  children: (day: string) => ReactElement
}

function CalendarGridHeader(props: CalendarGridHeaderProps, ref: ForwardedRef<HTMLTableSectionElement>) {
  let {children, style, className} = props;
  let {headerProps, weekDays} = useContext(InternalCalendarGridContext)!;

  return (
    <thead
      {...filterDOMProps(props as any)}
      {...headerProps}
      ref={ref}
      style={style}
      className={className || 'react-aria-CalendarGridHeader'}>
      <tr>
        {weekDays.map((day, key) => React.cloneElement(children(day), {key}))}
      </tr>
    </thead>
  );
}

/**
 * A calendar grid header displays a row of week day names at the top of a month.
 */
const CalendarGridHeaderForwardRef = /*#__PURE__*/ (forwardRef as forwardRefType)(CalendarGridHeader);
export {CalendarGridHeaderForwardRef as CalendarGridHeader};

export interface CalendarHeaderCellProps extends DOMProps {}

function CalendarHeaderCell(props: CalendarHeaderCellProps, ref: ForwardedRef<HTMLTableCellElement>) {
  let {children, style, className} = props;
  return (
    <th
      {...filterDOMProps(props as any)}
      ref={ref}
      style={style}
      className={className || 'react-aria-CalendarHeaderCell'}>
      {children}
    </th>
  );
}

/**
 * A calendar header cell displays a week day name at the top of a column within a calendar.
 */
const CalendarHeaderCellForwardRef = forwardRef(CalendarHeaderCell);
export {CalendarHeaderCellForwardRef as CalendarHeaderCell};

export interface CalendarGridBodyProps extends StyleProps {
  /** A function to render a `<CalendarCell>` for a given date. */
  children: (date: CalendarDate) => ReactElement
}

function CalendarGridBody(props: CalendarGridBodyProps, ref: ForwardedRef<HTMLTableSectionElement>) {
  let {children, style, className} = props;
  let calendarState = useContext(CalendarStateContext);
  let rangeCalendarState = useContext(RangeCalendarStateContext);
  let state = calendarState ?? rangeCalendarState!;
  let {startDate, weeksInMonth} = useContext(InternalCalendarGridContext)!;

  return (
    <tbody
      {...filterDOMProps(props as any)}
      ref={ref}
      style={style}
      className={className || 'react-aria-CalendarGridBody'}>
      {[...new Array(weeksInMonth).keys()].map((weekIndex) => (
        <tr key={weekIndex}>
          {state.getDatesInWeek(weekIndex, startDate).map((date, i) => (
            date
              ? React.cloneElement(children(date), {key: i})
              : <td key={i} />
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/**
 * A calendar grid body displays a grid of calendar cells within a month.
 */
const CalendarGridBodyForwardRef = /*#__PURE__*/ (forwardRef as forwardRefType)(CalendarGridBody);
export {CalendarGridBodyForwardRef as CalendarGridBody};

export interface CalendarCellProps extends RenderProps<CalendarCellRenderProps>, HoverEvents {
  /** The date to render in the cell. */
  date: CalendarDate
}

/**
 * A calendar cell displays a date cell within a calendar grid which can be selected by the user.
 */
export const CalendarCell = /*#__PURE__*/ (forwardRef as forwardRefType)(function CalendarCell({date, ...otherProps}: CalendarCellProps, ref: ForwardedRef<HTMLTableCellElement>) {
  let calendarState = useContext(CalendarStateContext);
  let rangeCalendarState = useContext(RangeCalendarStateContext);
  let state = calendarState ?? rangeCalendarState!;
  let {startDate: currentMonth} = useContext(InternalCalendarGridContext) ?? {startDate: state.visibleRange.start};
  let buttonRef = useRef<HTMLDivElement>(null);
  let {cellProps, buttonProps, ...states} = useCalendarCell(
    {date},
    state,
    buttonRef
  );

  let {hoverProps, isHovered} = useHover({...otherProps, isDisabled: states.isDisabled});
  let {focusProps, isFocusVisible} = useFocusRing();
  isFocusVisible &&= states.isFocused;
  let isOutsideMonth = !isSameMonth(currentMonth, date);
  let isSelectionStart = false;
  let isSelectionEnd = false;
  if ('highlightedRange' in state && state.highlightedRange) {
    isSelectionStart = isSameDay(date, state.highlightedRange.start);
    isSelectionEnd = isSameDay(date, state.highlightedRange.end);
  }

  let renderProps = useRenderProps({
    ...otherProps,
    defaultChildren: states.formattedDate,
    defaultClassName: 'react-aria-CalendarCell',
    values: {
      date,
      isHovered,
      isOutsideMonth,
      isFocusVisible,
      isSelectionStart,
      isSelectionEnd,
      ...states
    }
  });

  let dataAttrs = {
    'data-focused': states.isFocused || undefined,
    'data-hovered': isHovered || undefined,
    'data-pressed': states.isPressed || undefined,
    'data-unavailable': states.isUnavailable || undefined,
    'data-disabled': states.isDisabled || undefined,
    'data-focus-visible': isFocusVisible || undefined,
    'data-outside-visible-range': states.isOutsideVisibleRange || undefined,
    'data-outside-month': isOutsideMonth || undefined,
    'data-selected': states.isSelected || undefined,
    'data-selection-start': isSelectionStart || undefined,
    'data-selection-end': isSelectionEnd || undefined,
    'data-invalid': states.isInvalid || undefined
  };

  return (
    <td {...cellProps} ref={ref}>
      <div {...mergeProps(filterDOMProps(otherProps as any), buttonProps, focusProps, hoverProps, dataAttrs, renderProps)} ref={buttonRef} />
    </td>
  );
});
