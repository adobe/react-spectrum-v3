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
  endOfMonth,
  endOfWeek,
  endOfYear,
  EthiopicCalendar,
  getDayOfWeek,
  getMinimumDayInMonth,
  getMinimumMonthInYear,
  getWeeksInMonth,
  isEqualDay,
  isEqualMonth,
  isEqualYear,
  IslamicUmalquraCalendar,
  isSameDay,
  isSameMonth,
  isSameYear,
  JapaneseCalendar,
  maxDate,
  minDate,
  PersianCalendar,
  startOfMonth,
  startOfWeek,
  startOfYear,
  ZonedDateTime
} from '..';

describe('queries', function () {
  describe('isSameDay', function () {
    it('works with two dates in the same calendar', function () {
      expect(isSameDay(new CalendarDate(2020, 2, 3), new CalendarDate(2020, 2, 3))).toBe(true);
      expect(isSameDay(new CalendarDate(2019, 2, 3), new CalendarDate(2020, 2, 3))).toBe(false);
      expect(isSameDay(new CalendarDate(2020, 3, 3), new CalendarDate(2020, 2, 3))).toBe(false);
      expect(isSameDay(new CalendarDate(2020, 2, 4), new CalendarDate(2020, 2, 3))).toBe(false);
      expect(isSameDay(new CalendarDate('AD', 1, 1, 1), new CalendarDate('BC', 1, 1, 1))).toBe(false);
    });

    it('works with two dates in different calendars', function () {
      expect(isSameDay(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(true);
      expect(isSameDay(new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4), new CalendarDate(2021, 4, 16))).toBe(true);
      expect(isSameDay(new CalendarDate(2019, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(false);
      expect(isSameDay(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1441, 9, 4))).toBe(false);
      expect(isSameDay(new CalendarDate(2021, 5, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(false);
      expect(isSameDay(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 10, 4))).toBe(false);
      expect(isSameDay(new CalendarDate(2021, 4, 17), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(false);
      expect(isSameDay(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 3))).toBe(false);
    });

    it('works in Persian calendar', function () {
      const persian = new CalendarDate(new PersianCalendar(), 1401, 12, 8);
      const gregorian = new CalendarDate(2023, 2, 27);
      expect(isSameDay(gregorian, persian)).toBe(true);
      expect(isSameDay(persian, gregorian)).toBe(true);
    });

    it("uses a calendar's isSamePeriod method if present", function () {
      const a = new Proxy(new CalendarDate(2023, 2, 27), {
        get(target, prop) {
          if (prop === 'calendar') {
            return {
              ...target.calendar,
              isSamePeriod: () => true
            };
          }
          return target[prop];
        }
      });
      const b = new CalendarDate(2001, 2, 4);
      expect(isSameDay(a, b)).toBe(true);
    });
  });

  describe('isSameMonth', function () {
    it('works with two dates in the same calendar', function () {
      expect(isSameMonth(new CalendarDate(2020, 2, 3), new CalendarDate(2020, 2, 3))).toBe(true);
      expect(isSameMonth(new CalendarDate(2019, 2, 3), new CalendarDate(2020, 2, 3))).toBe(false);
      expect(isSameMonth(new CalendarDate(2020, 3, 3), new CalendarDate(2020, 2, 3))).toBe(false);
      expect(isSameMonth(new CalendarDate(2020, 2, 4), new CalendarDate(2020, 2, 3))).toBe(true);
    });

    it('works with two dates in different calendars', function () {
      expect(isSameMonth(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(true);
      expect(isSameMonth(new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4), new CalendarDate(2021, 4, 16))).toBe(true);
      expect(isSameMonth(new CalendarDate(2019, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(false);
      expect(isSameMonth(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1441, 9, 4))).toBe(false);
      expect(isSameMonth(new CalendarDate(2021, 5, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(false);
      expect(isSameMonth(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 10, 4))).toBe(false);
      expect(isSameMonth(new CalendarDate(2021, 4, 17), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(true);
      expect(isSameMonth(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 3))).toBe(true);
    });

    it('works with months that span different eras', function () {
      expect(isSameMonth(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3), new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 1, 10))).toBe(true);
      expect(isSameMonth(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3), new CalendarDate(1989, 1, 10))).toBe(true);
    });

    it("uses a calendar's isSamePeriod method if present", function () {
      const a = new Proxy(new CalendarDate(2023, 2, 27), {
        get(target, prop) {
          if (prop === 'calendar') {
            return {
              ...target.calendar,
              isSamePeriod: () => true
            };
          }
          return target[prop];
        }
      });
      const b = new CalendarDate(2001, 2, 4);
      expect(isSameMonth(a, b)).toBe(true);
    });
  });

  describe('isSameYear', function () {
    it('works with two dates in the same calendar', function () {
      expect(isSameYear(new CalendarDate(2020, 2, 3), new CalendarDate(2020, 2, 3))).toBe(true);
      expect(isSameYear(new CalendarDate(2019, 2, 3), new CalendarDate(2020, 2, 3))).toBe(false);
      expect(isSameYear(new CalendarDate(2020, 3, 3), new CalendarDate(2020, 2, 3))).toBe(true);
      expect(isSameYear(new CalendarDate(2020, 2, 4), new CalendarDate(2020, 2, 3))).toBe(true);
    });

    it('works with two dates in different calendars', function () {
      expect(isSameYear(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(true);
      expect(isSameYear(new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4), new CalendarDate(2021, 4, 16))).toBe(true);
      expect(isSameYear(new CalendarDate(2019, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(false);
      expect(isSameYear(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1441, 9, 4))).toBe(false);
      expect(isSameYear(new CalendarDate(2021, 5, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(true);
      expect(isSameYear(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 10, 4))).toBe(true);
      expect(isSameYear(new CalendarDate(2021, 4, 17), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(true);
      expect(isSameYear(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 3))).toBe(true);
    });

    it('works with months that span different eras', function () {
      expect(isSameYear(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3), new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 1, 10))).toBe(true);
      expect(isSameYear(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3), new CalendarDate(1989, 1, 10))).toBe(true);
    });

    it("uses a calendar's isSamePeriod method if present", function () {
      const a = new Proxy(new CalendarDate(2023, 2, 27), {
        get(target, prop) {
          if (prop === 'calendar') {
            return {
              ...target.calendar,
              isSamePeriod: () => true
            };
          }
          return target[prop];
        }
      });
      const b = new CalendarDate(2001, 2, 4);
      expect(isSameYear(a, b)).toBe(true);
    });
  });

  describe('isEqualDay', function () {
    it('works with two dates in the same calendar', function () {
      expect(isEqualDay(new CalendarDate(2020, 2, 3), new CalendarDate(2020, 2, 3))).toBe(true);
      expect(isEqualDay(new CalendarDate(2019, 2, 3), new CalendarDate(2020, 2, 3))).toBe(false);
      expect(isEqualDay(new CalendarDate(2020, 3, 3), new CalendarDate(2020, 2, 3))).toBe(false);
      expect(isEqualDay(new CalendarDate(2020, 2, 4), new CalendarDate(2020, 2, 3))).toBe(false);
    });

    it('does not work with two dates in different calendars', function () {
      expect(isEqualDay(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(false);
      expect(isEqualDay(new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4), new CalendarDate(2021, 4, 16))).toBe(false);
    });
  });

  describe('isEqualMonth', function () {
    it('works with two dates in the same calendar', function () {
      expect(isEqualMonth(new CalendarDate(2020, 2, 3), new CalendarDate(2020, 2, 3))).toBe(true);
      expect(isEqualMonth(new CalendarDate(2019, 2, 3), new CalendarDate(2020, 2, 3))).toBe(false);
      expect(isEqualMonth(new CalendarDate(2020, 3, 3), new CalendarDate(2020, 2, 3))).toBe(false);
      expect(isEqualMonth(new CalendarDate(2020, 2, 4), new CalendarDate(2020, 2, 3))).toBe(true);
    });

    it('does not work with two dates in different calendars', function () {
      expect(isEqualMonth(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(false);
      expect(isEqualMonth(new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4), new CalendarDate(2021, 4, 16))).toBe(false);
    });

    it('works with months that span different eras', function () {
      expect(isEqualMonth(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3), new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 1, 10))).toBe(true);
      expect(isEqualMonth(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3), new CalendarDate(1989, 1, 10))).toBe(false);
    });
  });

  describe('isEqualYear', function () {
    it('works with two dates in the same calendar', function () {
      expect(isEqualYear(new CalendarDate(2020, 2, 3), new CalendarDate(2020, 2, 3))).toBe(true);
      expect(isEqualYear(new CalendarDate(2019, 2, 3), new CalendarDate(2020, 2, 3))).toBe(false);
      expect(isEqualYear(new CalendarDate(2020, 3, 3), new CalendarDate(2020, 2, 3))).toBe(true);
      expect(isEqualYear(new CalendarDate(2020, 2, 4), new CalendarDate(2020, 2, 3))).toBe(true);
    });

    it('does not work with two dates in different calendars', function () {
      expect(isEqualYear(new CalendarDate(2021, 4, 16), new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toBe(false);
      expect(isEqualYear(new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4), new CalendarDate(2021, 4, 16))).toBe(false);
    });

    it('works with months that span different eras', function () {
      expect(isEqualYear(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3), new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 1, 10))).toBe(true);
      expect(isEqualYear(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3), new CalendarDate(1989, 1, 10))).toBe(false);
    });
  });

  describe('startOfMonth', function () {
    it('moves the day to the first of the month', function () {
      expect(startOfMonth(new CalendarDate(2020, 2, 3))).toEqual(new CalendarDate(2020, 2, 1));
      expect(startOfMonth(new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toEqual(new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 1));
    });

    it('works in months that span eras', function () {
      expect(startOfMonth(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3))).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 1));
      expect(startOfMonth(new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 1, 10))).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 1));
    });

    it('works with zoned date times', function () {
      expect(startOfMonth(new ZonedDateTime(2021, 11, 10, 'America/Los_Angeles', -28800000, 1, 0, 0))).toEqual(new ZonedDateTime(2021, 11, 1, 'America/Los_Angeles', -25200000, 1, 0, 0));
    });

    it("uses the date calendar's getCurrentMonth method if present", function () {
      const date = new Proxy(new CalendarDate(2023, 2, 27), {
        get(target, prop) {
          if (prop === 'calendar') {
            return {
              ...target.calendar,
              getCurrentMonth: () => ({
                start: new CalendarDate(2023, 2, 26)
              })
            };
          }
          return target[prop];
        }
      });
      expect(startOfMonth(date)).toEqual(new CalendarDate(2023, 2, 26));
    });
  });

  describe('endOfMonth', function () {
    it('moves the day to the last day of the month', function () {
      expect(endOfMonth(new CalendarDate(2020, 2, 3))).toEqual(new CalendarDate(2020, 2, 29));
      expect(endOfMonth(new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4))).toEqual(new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 30));
    });

    it('works in years that span eras', function () {
      expect(endOfMonth(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3))).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 1, 31));
      expect(endOfMonth(new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 1, 10))).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 1, 31));
    });

    it('works with zoned date times', function () {
      expect(endOfMonth(new ZonedDateTime(2021, 11, 5, 'America/Los_Angeles', -25200000, 1, 0, 0))).toEqual(new ZonedDateTime(2021, 11, 30, 'America/Los_Angeles', -28800000, 1, 0, 0));
    });


    it("uses the date calendar's getCurrentMonth method if present", function () {
      const date = new Proxy(new CalendarDate(2023, 2, 27), {
        get(target, prop) {
          if (prop === 'calendar') {
            return {
              ...target.calendar,
              getCurrentMonth: () => ({
                end: new CalendarDate(2023, 4, 1)
              })
            };
          }
          return target[prop];
        }
      });
      expect(endOfMonth(date)).toEqual(new CalendarDate(2023, 4, 1));
    });
  });

  describe('startOfYear', function () {
    it('moves the day to the first of the year', function () {
      expect(startOfYear(new CalendarDate(2020, 2, 3))).toEqual(new CalendarDate(2020, 1, 1));
    });

    it('works in years that span eras', function () {
      expect(startOfYear(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3))).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 1));
      expect(startOfYear(new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 5, 10))).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 1));
    });

    it('works with zoned date times', function () {
      expect(startOfYear(new ZonedDateTime(2021, 11, 5, 'America/Los_Angeles', -25200000, 1, 0, 0))).toEqual(new ZonedDateTime(2021, 1, 1, 'America/Los_Angeles', -28800000, 1, 0, 0));
    });
  });

  describe('endOfYear', function () {
    it('moves the day to the last day of the year', function () {
      expect(endOfYear(new CalendarDate(2020, 2, 3))).toEqual(new CalendarDate(2020, 12, 31));
    });

    it('works in years that span eras', function () {
      expect(endOfYear(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 3))).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 12, 31));
      expect(endOfYear(new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 5, 10))).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 12, 31));
    });

    it('works with zoned date times', function () {
      expect(endOfYear(new ZonedDateTime(2021, 11, 5, 'America/Los_Angeles', -25200000, 1, 0, 0))).toEqual(new ZonedDateTime(2021, 12, 31, 'America/Los_Angeles', -28800000, 1, 0, 0));
    });
  });

  describe('getDayOfWeek', function () {
    it('should return the day of week in en-US', function () {
      expect(getDayOfWeek(new CalendarDate(2021, 8, 4), 'en-US')).toBe(3);
    });

    it('should return the day of week in fr-CA', function () {
      expect(getDayOfWeek(new CalendarDate(2021, 8, 4), 'fr-CA')).toBe(3);
    });

    it('should return the day of week in fr-FR', function () {
      expect(getDayOfWeek(new CalendarDate(2021, 8, 4), 'fr-FR')).toBe(2);
    });

    it('should return the day of week in fr', function () {
      expect(getDayOfWeek(new CalendarDate(2021, 8, 4), 'fr')).toBe(2);
    });

    it('should return the day of the week with a custom firstDayOfWeek', function () {
      expect(getDayOfWeek(new CalendarDate(2021, 8, 4), 'en-US', 'mon')).toBe(2);
      expect(getDayOfWeek(new CalendarDate(2021, 8, 4), 'en-US', 'tue')).toBe(1);
      expect(getDayOfWeek(new CalendarDate(2021, 8, 4), 'fr-FR', 'mon')).toBe(2);
      expect(getDayOfWeek(new CalendarDate(2021, 8, 4), 'fr-FR', 'tue')).toBe(1);
    });
  });

  describe('startOfWeek', function () {
    it('should return the start of week in en-US', function () {
      expect(startOfWeek(new CalendarDate(2021, 8, 4), 'en-US')).toEqual(new CalendarDate(2021, 8, 1));
    });

    it('should return the start of week in fr-FR', function () {
      expect(startOfWeek(new CalendarDate(2021, 8, 4), 'fr-FR')).toEqual(new CalendarDate(2021, 8, 2));
    });

    it('should return the start of the week with a custom firstDayOfWeek', function () {
      expect(startOfWeek(new CalendarDate(2021, 8, 4), 'en-US', 'mon')).toEqual(new CalendarDate(2021, 8, 2));
      expect(startOfWeek(new CalendarDate(2021, 8, 4), 'en-US', 'tue')).toEqual(new CalendarDate(2021, 8, 3));
      expect(startOfWeek(new CalendarDate(2021, 8, 4), 'fr-FR', 'sun')).toEqual(new CalendarDate(2021, 8, 1));
      expect(startOfWeek(new CalendarDate(2021, 8, 4), 'en-US', 'thu')).toEqual(new CalendarDate(2021, 7, 29));
    });
  });

  describe('endOfWeek', function () {
    it('should return the end of week in en-US', function () {
      expect(endOfWeek(new CalendarDate(2021, 8, 4), 'en-US')).toEqual(new CalendarDate(2021, 8, 7));
    });

    it('should return the end of week in fr-FR', function () {
      expect(endOfWeek(new CalendarDate(2021, 8, 4), 'fr-FR')).toEqual(new CalendarDate(2021, 8, 8));
    });

    it('should return the end of the week with a custom firstDayOfWeek', function () {
      expect(endOfWeek(new CalendarDate(2021, 8, 4), 'en-US', 'mon')).toEqual(new CalendarDate(2021, 8, 8));
      expect(endOfWeek(new CalendarDate(2021, 8, 4), 'en-US', 'tue')).toEqual(new CalendarDate(2021, 8, 9));
      expect(endOfWeek(new CalendarDate(2021, 8, 4), 'fr-FR', 'sun')).toEqual(new CalendarDate(2021, 8, 7));
    });
  });

  describe('getWeeksInMonth', function () {
    it('should work for months starting at the beginning of the week', function () {
      expect(getWeeksInMonth(new CalendarDate(2021, 8, 4), 'en-US')).toBe(5);
    });

    it('should work for months starting at the end of the week', function () {
      expect(getWeeksInMonth(new CalendarDate(2021, 10, 4), 'en-US')).toBe(6);
    });

    it('should work for other calendars', function () {
      expect(getWeeksInMonth(new CalendarDate(new EthiopicCalendar(), 2013, 13, 4), 'en-US')).toBe(1);
    });

    it('should support custom firstDayOfWeek', function () {
      expect(getWeeksInMonth(new CalendarDate(2021, 8, 4), 'en-US', 'sun')).toBe(5);
      expect(getWeeksInMonth(new CalendarDate(2021, 8, 4), 'en-US', 'mon')).toBe(6);
      expect(getWeeksInMonth(new CalendarDate(2021, 10, 4), 'en-US', 'sun')).toBe(6);
      expect(getWeeksInMonth(new CalendarDate(2021, 10, 4), 'en-US', 'mon')).toBe(5);
    });

    it("should use the date calendar's getWeeksInMonth method if present", function () {
      const date = new Proxy(new CalendarDate(2023, 2, 4), {
        get(target, prop) {
          if (prop === 'calendar') {
            return {
              ...target.calendar,
              getWeeksInMonth: () => 5
            };
          }
          return target[prop];
        }
      });
      expect(getWeeksInMonth(date, 'en-US')).toBe(5);
    });
  });

  describe('getMinimumMonthInYear', function () {
    it('returns the minimum month of the year', function () {
      expect(getMinimumMonthInYear(new CalendarDate(2020, 2, 3))).toBe(1);
    });
  });

  describe('getMinimumDayInMonth', function () {
    it('returns the minimum day in a month', function () {
      expect(getMinimumDayInMonth(new CalendarDate(2020, 2, 3))).toBe(1);
    });
  });

  describe('minDate', function () {
    it('should return the minimum date', function () {
      expect(minDate(new CalendarDate(2020, 2, 3), new CalendarDate(2020, 5, 3))).toEqual(new CalendarDate(2020, 2, 3));
      expect(minDate(new CalendarDate(2020, 5, 3), new CalendarDate(2020, 2, 3))).toEqual(new CalendarDate(2020, 2, 3));
    });
  });

  describe('maxDate', function () {
    it('should return the maximum date', function () {
      expect(maxDate(new CalendarDate(2020, 2, 3), new CalendarDate(2020, 5, 3))).toEqual(new CalendarDate(2020, 5, 3));
      expect(maxDate(new CalendarDate(2020, 5, 3), new CalendarDate(2020, 2, 3))).toEqual(new CalendarDate(2020, 5, 3));
    });
  });

  describe('compare', function () {
    it('works with dates in different eras', function () {
      let a = new CalendarDate('BC', 1, 1, 1);
      let b = new CalendarDate('AD', 1, 1, 1);
      expect(a.compare(b)).toBeLessThan(0);
      expect(b.compare(a)).toBeGreaterThan(0);
    });
  });
});
