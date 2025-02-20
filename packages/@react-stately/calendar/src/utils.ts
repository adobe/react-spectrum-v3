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
  DateDuration,
  maxDate,
  minDate,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toCalendarDate
} from '@internationalized/date';
import {DateValue} from '@react-types/calendar';

export function isInvalid(date: DateValue, minValue?: DateValue | null, maxValue?: DateValue | null): boolean {
  return (minValue != null && date.compare(minValue) < 0) ||
    (maxValue != null && date.compare(maxValue) > 0);
}

export function alignCenter(date: CalendarDate, duration: DateDuration, locale: string, minValue?: DateValue | null, maxValue?: DateValue | null): CalendarDate {
  let halfDuration: DateDuration = {};
  for (let key in duration) {
    halfDuration[key] = Math.floor(duration[key] / 2);
    if (halfDuration[key] > 0 && duration[key] % 2 === 0) {
      halfDuration[key]--;
    }
  }

  let aligned = alignStart(date, duration, locale).subtract(halfDuration);
  return constrainStart(date, aligned, duration, locale, minValue, maxValue);
}

export function alignStart(date: CalendarDate, duration: DateDuration, locale: string, minValue?: DateValue | null, maxValue?: DateValue | null): CalendarDate {
  // align to the start of the largest unit
  let aligned = date;
  if (duration.years) {
    aligned = startOfYear(date);
  } else if (duration.months) {
    aligned = startOfMonth(date);
  } else if (duration.weeks) {
    aligned = startOfWeek(date, locale);
  }

  return constrainStart(date, aligned, duration, locale, minValue, maxValue);
}

export function alignEnd(date: CalendarDate, duration: DateDuration, locale: string, minValue?: DateValue | null, maxValue?: DateValue | null): CalendarDate {
  let d = {...duration};
  // subtract 1 from the smallest unit
  if (d.days) {
    d.days--;
  } else if (d.weeks) {
    d.weeks--;
  } else if (d.months) {
    d.months--;
  } else if (d.years) {
    d.years--;
  }

  let aligned = alignStart(date, duration, locale).subtract(d);
  return constrainStart(date, aligned, duration, locale, minValue, maxValue);
}

export function constrainStart(
  date: CalendarDate,
  aligned: CalendarDate,
  duration: DateDuration,
  locale: string,
  minValue?: DateValue | null,
  maxValue?: DateValue | null): CalendarDate {
  if (minValue && date.compare(minValue) >= 0) {
    let newDate = maxDate(
      aligned,
      alignStart(toCalendarDate(minValue), duration, locale)
    );
    if (newDate) {
      aligned = newDate;
    }
  }

  if (maxValue && date.compare(maxValue) <= 0) {
    let newDate = minDate(
      aligned,
      alignEnd(toCalendarDate(maxValue), duration, locale)
    );
    if (newDate) {
      aligned = newDate;
    }
  }

  return aligned;
}

export function constrainValue(date: CalendarDate, minValue?: DateValue | null, maxValue?: DateValue | null): CalendarDate {
  if (minValue) {
    let newDate = maxDate(date, toCalendarDate(minValue));
    if (newDate) {
      date = newDate;
    }
  }

  if (maxValue) {
    let newDate = minDate(date, toCalendarDate(maxValue));
    if (newDate) {
      date = newDate;
    }
  }

  return date;
}

export function previousAvailableDate(date: CalendarDate, minValue: DateValue, isDateUnavailable?: (date: CalendarDate) => boolean): CalendarDate | null {
  if (!isDateUnavailable) {
    return date;
  }

  while (date.compare(minValue) >= 0 && isDateUnavailable(date)) {
    date = date.subtract({days: 1});
  }

  if (date.compare(minValue) >= 0) {
    return date;
  }
  return null;
}
