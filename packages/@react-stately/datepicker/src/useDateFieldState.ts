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

import {Calendar, DateFormatter, getMinimumDayInMonth, getMinimumMonthInYear, GregorianCalendar, toCalendar} from '@internationalized/date';
import {convertValue, createPlaceholderDate, FieldOptions, FormatterOptions, getFormatOptions, getValidationResult, useDefaultProps} from './utils';
import {DatePickerProps, DateValue, Granularity, MappedDateValue} from '@react-types/datepicker';
import {FormValidationState, useFormValidationState} from '@react-stately/form';
import {getPlaceholder} from './placeholders';
import {useControlledState} from '@react-stately/utils';
import {useEffect, useMemo, useRef, useState} from 'react';
import {ValidationState} from '@react-types/shared';

export type SegmentType = 'era' | 'year' | 'month' | 'day' |  'hour' | 'minute' | 'second' | 'dayPeriod' | 'literal' | 'timeZoneName';
export interface DateSegment {
  /** The type of segment. */
  type: SegmentType,
  /** The formatted text for the segment. */
  text: string,
  /** The numeric value for the segment, if applicable. */
  value?: number,
  /** The minimum numeric value for the segment, if applicable. */
  minValue?: number,
  /** The maximum numeric value for the segment, if applicable. */
  maxValue?: number,
  /** Whether the value is a placeholder. */
  isPlaceholder: boolean,
  /** A placeholder string for the segment. */
  placeholder: string,
  /** Whether the segment is editable. */
  isEditable: boolean
}

export interface DateFieldState extends FormValidationState {
  /** The current field value. */
  value: DateValue | null,
  /** The current value, converted to a native JavaScript `Date` object.  */
  dateValue: Date,
  /** The calendar system currently in use. */
  calendar: Calendar,
  /** Sets the field's value. */
  setValue(value: DateValue | null): void,
  /** A list of segments for the current value. */
  segments: DateSegment[],
  /** A date formatter configured for the current locale and format. */
  dateFormatter: DateFormatter,
  /**
   * The current validation state of the date field, based on the `validationState`, `minValue`, and `maxValue` props.
   * @deprecated Use `isInvalid` instead.
   */
  validationState: ValidationState | null,
  /** Whether the date field is invalid, based on the `isInvalid`, `minValue`, and `maxValue` props. */
  isInvalid: boolean,
  /** The granularity for the field, based on the `granularity` prop and current value. */
  granularity: Granularity,
  /** The maximum date or time unit that is displayed in the field. */
  maxGranularity: 'year' | 'month' | Granularity,
  /** Whether the field is disabled. */
  isDisabled: boolean,
  /** Whether the field is read only. */
  isReadOnly: boolean,
  /** Whether the field is required. */
  isRequired: boolean,
  /** Increments the given segment. Upon reaching the minimum or maximum value, the value wraps around to the opposite limit. */
  increment(type: SegmentType): void,
  /** Decrements the given segment. Upon reaching the minimum or maximum value, the value wraps around to the opposite limit. */
  decrement(type: SegmentType): void,
  /**
   * Increments the given segment by a larger amount, rounding it to the nearest increment.
   * The amount to increment by depends on the field, for example 15 minutes, 7 days, and 5 years.
   * Upon reaching the minimum or maximum value, the value wraps around to the opposite limit.
   */
  incrementPage(type: SegmentType): void,
  /**
   * Decrements the given segment by a larger amount, rounding it to the nearest increment.
   * The amount to decrement by depends on the field, for example 15 minutes, 7 days, and 5 years.
   * Upon reaching the minimum or maximum value, the value wraps around to the opposite limit.
   */
  decrementPage(type: SegmentType): void,
  /** Sets the value of the given segment. */
  setSegment(type: 'era', value: string): void,
  setSegment(type: SegmentType, value: number): void,
  /** Updates the remaining unfilled segments with the placeholder value. */
  confirmPlaceholder(): void,
  /** Clears the value of the given segment, reverting it to the placeholder. */
  clearSegment(type: SegmentType): void,
  /** Formats the current date value using the given options. */
  formatValue(fieldOptions: FieldOptions): string,
  /** Gets a formatter based on state's props. */
  getDateFormatter(locale: string, formatOptions: FormatterOptions): DateFormatter
}

const EDITABLE_SEGMENTS = {
  year: true,
  month: true,
  day: true,
  hour: true,
  minute: true,
  second: true,
  dayPeriod: true,
  era: true
};

const PAGE_STEP = {
  year: 5,
  month: 2,
  day: 7,
  hour: 2,
  minute: 15,
  second: 15
};

// Node seems to convert everything to lowercase...
const TYPE_MAPPING = {
  dayperiod: 'dayPeriod'
};

export interface DateFieldStateOptions<T extends DateValue = DateValue> extends DatePickerProps<T> {
  /**
   * The maximum unit to display in the date field.
   * @default 'year'
   */
  maxGranularity?: 'year' | 'month' | Granularity,
  /** The locale to display and edit the value according to. */
  locale: string,
  /**
   * A function that creates a [Calendar](../internationalized/date/Calendar.html)
   * object for a given calendar identifier. Such a function may be imported from the
   * `@internationalized/date` package, or manually implemented to include support for
   * only certain calendars.
   */
  createCalendar: (name: string) => Calendar
}

/**
 * Provides state management for a date field component.
 * A date field allows users to enter and edit date and time values using a keyboard.
 * Each part of a date value is displayed in an individually editable segment.
 */
export function useDateFieldState<T extends DateValue = DateValue>(props: DateFieldStateOptions<T>): DateFieldState {
  let {
    locale,
    createCalendar,
    hideTimeZone,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    minValue,
    maxValue,
    isDateUnavailable
  } = props;

  let v: DateValue | null = props.value || props.defaultValue || props.placeholderValue || null;
  let [granularity, defaultTimeZone] = useDefaultProps(v, props.granularity);
  let timeZone = defaultTimeZone || 'UTC';

  // props.granularity must actually exist in the value if one is provided.
  if (v && !(granularity in v)) {
    throw new Error('Invalid granularity ' + granularity + ' for value ' + v.toString());
  }

  let defaultFormatter = useMemo(() => new DateFormatter(locale), [locale]);
  let calendar = useMemo(() => createCalendar(defaultFormatter.resolvedOptions().calendar), [createCalendar, defaultFormatter]);

  let [value, setDate] = useControlledState<DateValue | null, MappedDateValue<T> | null>(
    props.value,
    props.defaultValue ?? null,
    props.onChange
  );

  let calendarValue = useMemo(() => convertValue(value, calendar) ?? null, [value, calendar]);

  // We keep track of the placeholder date separately in state so that onChange is not called
  // until all segments are set. If the value === null (not undefined), then assume the component
  // is controlled, so use the placeholder as the value until all segments are entered so it doesn't
  // change from uncontrolled to controlled and emit a warning.
  let [placeholderDate, setPlaceholderDate] = useState(
    () => createPlaceholderDate(props.placeholderValue, granularity, calendar, defaultTimeZone)
  );

  let val = calendarValue || placeholderDate;
  let showEra = calendar.identifier === 'gregory' && val.era === 'BC';
  let formatOpts = useMemo(() => ({
    granularity,
    maxGranularity: props.maxGranularity ?? 'year',
    timeZone: defaultTimeZone,
    hideTimeZone,
    hourCycle: props.hourCycle,
    showEra,
    shouldForceLeadingZeros: props.shouldForceLeadingZeros
  }), [props.maxGranularity, granularity, props.hourCycle, props.shouldForceLeadingZeros, defaultTimeZone, hideTimeZone, showEra]);
  let opts = useMemo(() => getFormatOptions({}, formatOpts), [formatOpts]);

  let dateFormatter = useMemo(() => new DateFormatter(locale, opts), [locale, opts]);
  let resolvedOptions = useMemo(() => dateFormatter.resolvedOptions(), [dateFormatter]);

  // Determine how many editable segments there are for validation purposes.
  // The result is cached for performance.
  let allSegments: Partial<typeof EDITABLE_SEGMENTS> = useMemo(() =>
    dateFormatter.formatToParts(new Date())
      .filter(seg => EDITABLE_SEGMENTS[seg.type])
      .reduce((p, seg) => (p[seg.type] = true, p), {})
  , [dateFormatter]);

  let [validSegments, setValidSegments] = useState<Partial<typeof EDITABLE_SEGMENTS>>(
    () => props.value || props.defaultValue ? {...allSegments} : {}
  );

  let clearedSegment = useRef<string | null>(null);

  // Reset placeholder when calendar changes
  let lastCalendarIdentifier = useRef(calendar.identifier);
  useEffect(() => {
    if (calendar.identifier !== lastCalendarIdentifier.current) {
      lastCalendarIdentifier.current = calendar.identifier;
      setPlaceholderDate(placeholder =>
        Object.keys(validSegments).length > 0
          ? toCalendar(placeholder, calendar)
          : createPlaceholderDate(props.placeholderValue, granularity, calendar, defaultTimeZone)
      );
    }
  }, [calendar, granularity, validSegments, defaultTimeZone, props.placeholderValue]);

  // If there is a value prop, and some segments were previously placeholders, mark them all as valid.
  if (value && Object.keys(validSegments).length < Object.keys(allSegments).length) {
    validSegments = {...allSegments};
    setValidSegments(validSegments);
  }

  // If the value is set to null and all segments are valid, reset the placeholder.
  if (value == null && Object.keys(validSegments).length === Object.keys(allSegments).length) {
    validSegments = {};
    setValidSegments(validSegments);
    setPlaceholderDate(createPlaceholderDate(props.placeholderValue, granularity, calendar, defaultTimeZone));
  }

  // If all segments are valid, use the date from state, otherwise use the placeholder date.
  let displayValue = calendarValue && Object.keys(validSegments).length >= Object.keys(allSegments).length ? calendarValue : placeholderDate;
  let setValue = (newValue: DateValue) => {
    if (props.isDisabled || props.isReadOnly) {
      return;
    }
    let validKeys = Object.keys(validSegments);
    let allKeys = Object.keys(allSegments);

    // if all the segments are completed or a timefield with everything but am/pm set the time, also ignore when am/pm cleared
    if (newValue == null) {
      setDate(null);
      setPlaceholderDate(createPlaceholderDate(props.placeholderValue, granularity, calendar, defaultTimeZone));
      setValidSegments({});
    } else if (validKeys.length >= allKeys.length || (validKeys.length === allKeys.length - 1 && allSegments.dayPeriod && !validSegments.dayPeriod && clearedSegment.current !== 'dayPeriod')) {
      // The display calendar should not have any effect on the emitted value.
      // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
      newValue = toCalendar(newValue, v?.calendar || new GregorianCalendar());
      setDate(newValue);
    } else {
      setPlaceholderDate(newValue);
    }
    clearedSegment.current = null;
  };

  let dateValue = useMemo(() => displayValue.toDate(timeZone), [displayValue, timeZone]);
  let segments = useMemo(() =>
    dateFormatter.formatToParts(dateValue)
      .map(segment => {
        let isEditable = EDITABLE_SEGMENTS[segment.type];
        if (segment.type === 'era' && calendar.getEras().length === 1) {
          isEditable = false;
        }

        let isPlaceholder = EDITABLE_SEGMENTS[segment.type] && !validSegments[segment.type];
        let placeholder = EDITABLE_SEGMENTS[segment.type] ? getPlaceholder(segment.type, segment.value, locale) : null;
        return {
          type: TYPE_MAPPING[segment.type] || segment.type,
          text: isPlaceholder ? placeholder : segment.value,
          ...getSegmentLimits(displayValue, segment.type, resolvedOptions),
          isPlaceholder,
          placeholder,
          isEditable
        } as DateSegment;
      })
  , [dateValue, validSegments, dateFormatter, resolvedOptions, displayValue, calendar, locale]);

  // When the era field appears, mark it valid if the year field is already valid.
  // If the era field disappears, remove it from the valid segments.
  if (allSegments.era && validSegments.year && !validSegments.era) {
    validSegments.era = true;
    setValidSegments({...validSegments});
  } else if (!allSegments.era && validSegments.era) {
    delete validSegments.era;
    setValidSegments({...validSegments});
  }

  let markValid = (part: Intl.DateTimeFormatPartTypes) => {
    validSegments[part] = true;
    if (part === 'year' && allSegments.era) {
      validSegments.era = true;
    }
    setValidSegments({...validSegments});
  };

  let adjustSegment = (type: Intl.DateTimeFormatPartTypes, amount: number) => {
    if (!validSegments[type]) {
      markValid(type);
      let validKeys = Object.keys(validSegments);
      let allKeys = Object.keys(allSegments);
      if (validKeys.length >= allKeys.length || (validKeys.length === allKeys.length - 1 && allSegments.dayPeriod && !validSegments.dayPeriod)) {
        setValue(displayValue);
      }
    } else {
      setValue(addSegment(displayValue, type, amount, resolvedOptions));
    }
  };

  let builtinValidation = useMemo(() => getValidationResult(
    value,
    minValue,
    maxValue,
    isDateUnavailable,
    formatOpts
  ), [value, minValue, maxValue, isDateUnavailable, formatOpts]);

  let validation = useFormValidationState({
    ...props,
    value: value as MappedDateValue<T> | null,
    builtinValidation
  });

  let isValueInvalid = validation.displayValidation.isInvalid;
  let validationState: ValidationState | null = props.validationState || (isValueInvalid ? 'invalid' : null);

  return {
    ...validation,
    value: calendarValue,
    dateValue,
    calendar,
    setValue,
    segments,
    dateFormatter,
    validationState,
    isInvalid: isValueInvalid,
    granularity,
    maxGranularity: props.maxGranularity ?? 'year',
    isDisabled,
    isReadOnly,
    isRequired,
    increment(part) {
      adjustSegment(part, 1);
    },
    decrement(part) {
      adjustSegment(part, -1);
    },
    incrementPage(part) {
      adjustSegment(part, PAGE_STEP[part] || 1);
    },
    decrementPage(part) {
      adjustSegment(part, -(PAGE_STEP[part] || 1));
    },
    setSegment(part, v: string | number) {
      markValid(part);
      setValue(setSegment(displayValue, part, v, resolvedOptions));
    },
    confirmPlaceholder() {
      if (props.isDisabled || props.isReadOnly) {
        return;
      }

      // Confirm the placeholder if only the day period is not filled in.
      let validKeys = Object.keys(validSegments);
      let allKeys = Object.keys(allSegments);
      if (validKeys.length === allKeys.length - 1 && allSegments.dayPeriod && !validSegments.dayPeriod) {
        validSegments = {...allSegments};
        setValidSegments(validSegments);
        setValue(displayValue.copy());
      }
    },
    clearSegment(part) {
      delete validSegments[part];
      clearedSegment.current = part;
      setValidSegments({...validSegments});

      let placeholder = createPlaceholderDate(props.placeholderValue, granularity, calendar, defaultTimeZone);
      let value = displayValue;

      // Reset day period to default without changing the hour.
      if (part === 'dayPeriod' && 'hour' in displayValue && 'hour' in placeholder) {
        let isPM = displayValue.hour >= 12;
        let shouldBePM = placeholder.hour >= 12;
        if (isPM && !shouldBePM) {
          value = displayValue.set({hour: displayValue.hour - 12});
        } else if (!isPM && shouldBePM) {
          value = displayValue.set({hour: displayValue.hour + 12});
        }
      } else if (part === 'hour' && 'hour' in displayValue && displayValue.hour >= 12 && validSegments.dayPeriod) {
        value = displayValue.set({hour: placeholder['hour'] + 12});
      } else if (part in displayValue) {
        value = displayValue.set({[part]: placeholder[part]});
      }

      setDate(null);
      setValue(value);
    },
    formatValue(fieldOptions: FieldOptions) {
      if (!calendarValue) {
        return '';
      }

      let formatOptions = getFormatOptions(fieldOptions, formatOpts);
      let formatter = new DateFormatter(locale, formatOptions);
      return formatter.format(dateValue);
    },
    getDateFormatter(locale, formatOptions: FormatterOptions) {
      let newOptions = {...formatOpts, ...formatOptions};
      let newFormatOptions = getFormatOptions({}, newOptions);
      return new DateFormatter(locale, newFormatOptions);
    }
  };
}

function getSegmentLimits(date: DateValue, type: string, options: Intl.ResolvedDateTimeFormatOptions) {
  switch (type) {
    case 'era': {
      let eras = date.calendar.getEras();
      return {
        value: eras.indexOf(date.era),
        minValue: 0,
        maxValue: eras.length - 1
      };
    }
    case 'year':
      return {
        value: date.year,
        minValue: 1,
        maxValue: date.calendar.getYearsInEra(date)
      };
    case 'month':
      return {
        value: date.month,
        minValue: getMinimumMonthInYear(date),
        maxValue: date.calendar.getMonthsInYear(date)
      };
    case 'day':
      return {
        value: date.day,
        minValue: getMinimumDayInMonth(date),
        maxValue: date.calendar.getDaysInMonth(date)
      };
  }

  if ('hour' in date) {
    switch (type) {
      case 'dayPeriod':
        return {
          value: date.hour >= 12 ? 12 : 0,
          minValue: 0,
          maxValue: 12
        };
      case 'hour':
        if (options.hour12) {
          let isPM = date.hour >= 12;
          return {
            value: date.hour,
            minValue: isPM ? 12 : 0,
            maxValue: isPM ? 23 : 11
          };
        }

        return {
          value: date.hour,
          minValue: 0,
          maxValue: 23
        };
      case 'minute':
        return {
          value: date.minute,
          minValue: 0,
          maxValue: 59
        };
      case 'second':
        return {
          value: date.second,
          minValue: 0,
          maxValue: 59
        };
    }
  }

  return {};
}

function addSegment(value: DateValue, part: string, amount: number, options: Intl.ResolvedDateTimeFormatOptions) {
  switch (part) {
    case 'era':
    case 'year':
    case 'month':
    case 'day':
      return value.cycle(part, amount, {round: part === 'year'});
  }

  if ('hour' in value) {
    switch (part) {
      case 'dayPeriod': {
        let hours = value.hour;
        let isPM = hours >= 12;
        return value.set({hour: isPM ? hours - 12 : hours + 12});
      }
      case 'hour':
      case 'minute':
      case 'second':
        return value.cycle(part, amount, {
          round: part !== 'hour',
          hourCycle: options.hour12 ? 12 : 24
        });
    }
  }

  throw new Error('Unknown segment: ' + part);
}

function setSegment(value: DateValue, part: string, segmentValue: number | string, options: Intl.ResolvedDateTimeFormatOptions) {
  switch (part) {
    case 'day':
    case 'month':
    case 'year':
    case 'era':
      return value.set({[part]: segmentValue});
  }

  if ('hour' in value && typeof segmentValue === 'number') {
    switch (part) {
      case 'dayPeriod': {
        let hours = value.hour;
        let wasPM = hours >= 12;
        let isPM = segmentValue >= 12;
        if (isPM === wasPM) {
          return value;
        }
        return value.set({hour: wasPM ? hours - 12 : hours + 12});
      }
      case 'hour':
        // In 12 hour time, ensure that AM/PM does not change
        if (options.hour12) {
          let hours = value.hour;
          let wasPM = hours >= 12;
          if (!wasPM && segmentValue === 12) {
            segmentValue = 0;
          }
          if (wasPM && segmentValue < 12) {
            segmentValue += 12;
          }
        }
        // fallthrough
      case 'minute':
      case 'second':
        return value.set({[part]: segmentValue});
    }
  }

  throw new Error('Unknown segment: ' + part);
}
