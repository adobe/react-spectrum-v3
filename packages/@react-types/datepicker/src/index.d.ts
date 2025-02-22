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
  AriaLabelingProps,
  DOMProps,
  FocusableProps,
  HelpTextProps,
  InputBase,
  InputDOMProps,
  LabelableProps,
  RangeValue,
  SpectrumFieldValidation,
  SpectrumLabelableProps,
  StyleProps,
  Validation,
  ValueBase
} from '@react-types/shared';
import {CalendarDate, CalendarDateTime, Time, ZonedDateTime} from '@internationalized/date';
import {OverlayTriggerProps} from '@react-types/overlays';
import {PageBehavior} from '@react-types/calendar';

export type DateValue = CalendarDate | CalendarDateTime | ZonedDateTime;
type MappedDateValue<T> =
  T extends ZonedDateTime ? ZonedDateTime :
  T extends CalendarDateTime ? CalendarDateTime :
  T extends CalendarDate ? CalendarDate :
  never;

export type Granularity = 'day' | 'hour' | 'minute' | 'second';
interface DateFieldBase<T extends DateValue> extends InputBase, Validation<MappedDateValue<T>>, FocusableProps, LabelableProps, HelpTextProps, OverlayTriggerProps {
  /** The minimum allowed date that a user may select. */
  minValue?: DateValue | null,
  /** The maximum allowed date that a user may select. */
  maxValue?: DateValue | null,
  /** Callback that is called for each date of the calendar. If it returns true, then the date is unavailable. */
  isDateUnavailable?: (date: DateValue) => boolean,
  /** A placeholder date that influences the format of the placeholder shown when no value is selected. Defaults to today's date at midnight. */
  placeholderValue?: T | null,
  /** Whether to display the time in 12 or 24 hour format. By default, this is determined by the user's locale. */
  hourCycle?: 12 | 24,
  /** Determines the smallest unit that is displayed in the date picker. By default, this is `"day"` for dates, and `"minute"` for times. */
  granularity?: Granularity,
  /**
   * Whether to hide the time zone abbreviation.
   * @default false
   */
  hideTimeZone?: boolean,
  /**
   * Whether to always show leading zeros in the month, day, and hour fields.
   * By default, this is determined by the user's locale.
   */
  shouldForceLeadingZeros?: boolean,
  /**
   * Describes the type of autocomplete functionality the input should provide if any. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefautocomplete).
   */
  autoComplete?: string
}

interface AriaDateFieldBaseProps<T extends DateValue> extends DateFieldBase<T>, AriaLabelingProps, DOMProps {}
export interface DateFieldProps<T extends DateValue> extends DateFieldBase<T>, ValueBase<T | null, MappedDateValue<T> | null> {}
export interface AriaDateFieldProps<T extends DateValue> extends DateFieldProps<T>, AriaDateFieldBaseProps<T>, InputDOMProps {}

interface DatePickerBase<T extends DateValue> extends DateFieldBase<T>, OverlayTriggerProps {
  /**
   * Controls the behavior of paging. Pagination either works by advancing the visible page by visibleDuration (default) or one unit of visibleDuration.
   * @default visible
   */
  pageBehavior?: PageBehavior,
  /**
   * The day that starts the week.
   */
  firstDayOfWeek?: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
}
export interface AriaDatePickerBaseProps<T extends DateValue> extends DatePickerBase<T>, AriaLabelingProps, DOMProps {}

export interface DatePickerProps<T extends DateValue> extends DatePickerBase<T>, ValueBase<T | null, MappedDateValue<T> | null> {}
export interface AriaDatePickerProps<T extends DateValue> extends DatePickerProps<T>, AriaDatePickerBaseProps<T>, InputDOMProps {}

export type DateRange = RangeValue<DateValue>;
export interface DateRangePickerProps<T extends DateValue> extends Omit<DatePickerBase<T>, 'validate' | 'autoComplete'>, Validation<RangeValue<MappedDateValue<T>>>, ValueBase<RangeValue<T> | null, RangeValue<MappedDateValue<T>> | null> {
  /**
   * When combined with `isDateUnavailable`, determines whether non-contiguous ranges,
   * i.e. ranges containing unavailable dates, may be selected.
   */
  allowsNonContiguousRanges?: boolean,
  /**
   * The name of the start date input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname).
   */
  startName?: string,
  /**
   * The name of the end date input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname).
   */
  endName?: string
}

export interface AriaDateRangePickerProps<T extends DateValue> extends Omit<AriaDatePickerBaseProps<T>, 'validate' | 'autoComplete'>, DateRangePickerProps<T> {}

interface SpectrumDateFieldBase<T extends DateValue> extends SpectrumLabelableProps, HelpTextProps, SpectrumFieldValidation<MappedDateValue<T>>, StyleProps {
  /**
   * Whether the date picker should be displayed with a quiet style.
   * @default false
   */
  isQuiet?: boolean,
  /**
   * Whether to show the localized date format as help text below the field.
   * @default false
   */
  showFormatHelpText?: boolean
}

interface SpectrumDatePickerBase<T extends DateValue> extends SpectrumDateFieldBase<T>, SpectrumLabelableProps, StyleProps {
  /**
   * The maximum number of months to display at once in the calendar popover, if screen space permits.
   * @default 1
   */
  maxVisibleMonths?: number,
  /**
   * Whether the calendar popover should automatically flip direction when space is limited.
   * @default true
   */
  shouldFlip?: boolean
}

export interface SpectrumDatePickerProps<T extends DateValue> extends Omit<AriaDatePickerProps<T>, 'isInvalid' | 'validationState' | 'autoComplete'>, SpectrumDatePickerBase<T> {}
export interface SpectrumDateRangePickerProps<T extends DateValue> extends Omit<AriaDateRangePickerProps<T>, 'isInvalid' | 'validationState'>, Omit<SpectrumDatePickerBase<T>, 'validate'> {}
export interface SpectrumDateFieldProps<T extends DateValue> extends Omit<AriaDateFieldProps<T>, 'isInvalid' | 'validationState' | 'autoComplete'>, SpectrumDateFieldBase<T> {}

export type TimeValue = Time | CalendarDateTime | ZonedDateTime;
type MappedTimeValue<T> =
  T extends ZonedDateTime ? ZonedDateTime :
  T extends CalendarDateTime ? CalendarDateTime :
  T extends Time ? Time :
  never;

export interface TimePickerProps<T extends TimeValue> extends InputBase, Validation<MappedTimeValue<T>>, FocusableProps, LabelableProps, HelpTextProps, ValueBase<T | null, MappedTimeValue<T> | null> {
  /** Whether to display the time in 12 or 24 hour format. By default, this is determined by the user's locale. */
  hourCycle?: 12 | 24,
  /**
   * Determines the smallest unit that is displayed in the time picker.
   * @default 'minute'
   */
  granularity?: 'hour' | 'minute' | 'second',
  /** Whether to hide the time zone abbreviation. */
  hideTimeZone?: boolean,
  /**
   * Whether to always show leading zeros in the hour field.
   * By default, this is determined by the user's locale.
   */
  shouldForceLeadingZeros?: boolean,
  /**
   * A placeholder time that influences the format of the placeholder shown when no value is selected.
   * Defaults to 12:00 AM or 00:00 depending on the hour cycle.
   */
  placeholderValue?: T,
  /** The minimum allowed time that a user may select. */
  minValue?: TimeValue | null,
  /** The maximum allowed time that a user may select. */
  maxValue?: TimeValue | null
}

export interface AriaTimeFieldProps<T extends TimeValue> extends TimePickerProps<T>, AriaLabelingProps, DOMProps, InputDOMProps {}

export interface SpectrumTimeFieldProps<T extends TimeValue> extends Omit<AriaTimeFieldProps<T>, 'isInvalid' | 'validationState'>, SpectrumFieldValidation<MappedTimeValue<T>>, SpectrumLabelableProps, StyleProps, InputDOMProps {
  /**
   * Whether the time field should be displayed with a quiet style.
   * @default false
   */
  isQuiet?: boolean
}

// backward compatibility
export type SpectrumTimePickerProps<T extends TimeValue> = SpectrumTimeFieldProps<T>;
