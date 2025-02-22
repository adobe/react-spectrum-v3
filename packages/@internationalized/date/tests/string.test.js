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

import {CalendarDate, CalendarDateTime, parseAbsolute, parseDate, parseDateTime, parseDuration, parseTime, parseZonedDateTime, Time, ZonedDateTime} from '../';
import {durationToString} from '../src/string';

describe('string conversion', function () {
  describe('parseTime', function () {
    it('should parse a time with only hours', function () {
      let time = parseTime('14');
      let expected = new Time(14);
      expect(time).toEqual(expected);
    });

    it('should parse a padded time with only hours', function () {
      let time = parseTime('04');
      let expected = new Time(4);
      expect(time).toEqual(expected);
    });

    it('should parse a time with hours and minutes', function () {
      let time = parseTime('14:05');
      let expected = new Time(14, 5);
      expect(time).toEqual(expected);
    });

    it('should parse a time with hours, minutes, and seconds', function () {
      let time = parseTime('14:05:25');
      let expected = new Time(14, 5, 25);
      expect(time).toEqual(expected);
    });

    it('should parse a time with hours, minutes, seconds, and milliseconds', function () {
      let time = parseTime('14:05:25.1');
      let expected = new Time(14, 5, 25, 100);
      expect(time).toEqual(expected);

      time = parseTime('14:05:25.12');
      expected = new Time(14, 5, 25, 120);
      expect(time).toEqual(expected);
    });

    it('should error if time is not padded', function () {
      expect(() => parseTime('1')).toThrow();
      expect(() => parseTime('01:4')).toThrow();
    });

    it('should error if components are out of range', function () {
      expect(() => parseTime('45:23')).toThrow();
      expect(() => parseTime('12:99')).toThrow();
      expect(() => parseTime('12:45:99')).toThrow();
    });
  });

  describe('Time#toString', function () {
    it('should stringify a time', function () {
      let time = new Time(14, 45, 25);
      expect(time.toString()).toBe('14:45:25');
    });

    it('should stringify a time with padding', function () {
      let time = new Time(4, 5, 25);
      expect(time.toString()).toBe('04:05:25');
    });

    it('should stringify a time milliseconds', function () {
      let time = new Time(4, 5, 25, 100);
      expect(time.toString()).toBe('04:05:25.1');

      time = new Time(4, 5, 25, 120);
      expect(time.toString()).toBe('04:05:25.12');
    });
  });

  describe('parseDate', function () {
    it('should parse a date', function () {
      let date = parseDate('2020-02-03');
      let expected = new CalendarDate(2020, 2, 3);
      expect(date).toEqual(expected);
    });

    it('should parse a padded date', function () {
      let date = parseDate('0128-02-03');
      let expected = new CalendarDate(128, 2, 3);
      expect(date).toEqual(expected);
    });

    it('should error if date is not padded', function () {
      expect(() => parseDate('128-02-03')).toThrow();
      expect(() => parseDate('2020-2-03')).toThrow();
      expect(() => parseDate('2020-02-3')).toThrow();
    });

    it('should error if not all components are provided', function () {
      expect(() => parseDate('2020')).toThrow();
      expect(() => parseDate('2020-02')).toThrow();
    });

    it('should error if components are out of range', function () {
      expect(() => parseDate('2020-00-03')).toThrow();
      expect(() => parseDate('2020-13-03')).toThrow();
      expect(() => parseDate('2020-01-32')).toThrow();
      expect(() => parseDate('2020-02-30')).toThrow();
    });
  });

  describe('CalendarDate#toString', function () {
    it('should stringify a date', function () {
      let date = new CalendarDate(2020, 11, 20);
      expect(date.toString()).toBe('2020-11-20');
    });

    it('should stringify a date with padding', function () {
      let date = new CalendarDate(123, 2, 3);
      expect(date.toString()).toBe('0123-02-03');
    });

    it('should stringify a BC date', function () {
      let date = new CalendarDate('BC', 1, 1, 1);
      expect(date.toString()).toBe('0000-01-01');

      date = new CalendarDate('BC', 2, 1, 1);
      expect(date.toString()).toBe('-000001-01-01');
    });
  });

  describe('parseDateTime', function () {
    it('should parse a date without a time', function () {
      let date = parseDateTime('2020-02-03');
      let expected = new CalendarDateTime(2020, 2, 3);
      expect(date).toEqual(expected);
    });

    it('should parse a date with a time', function () {
      let date = parseDateTime('2020-02-03T12:23:24.12');
      let expected = new CalendarDateTime(2020, 2, 3, 12, 23, 24, 120);
      expect(date).toEqual(expected);
    });

    it('should parse a date with only hours', function () {
      let date = parseDateTime('2020-02-03T12');
      let expected = new CalendarDateTime(2020, 2, 3, 12, 0, 0, 0);
      expect(date).toEqual(expected);
    });

    it('should parse a date with only hours and minutes', function () {
      let date = parseDateTime('2020-02-03T12:24');
      let expected = new CalendarDateTime(2020, 2, 3, 12, 24, 0, 0);
      expect(date).toEqual(expected);
    });

    it('should parse a date with only hours, minutes, and seconds', function () {
      let date = parseDateTime('2020-02-03T12:24:45');
      let expected = new CalendarDateTime(2020, 2, 3, 12, 24, 45, 0);
      expect(date).toEqual(expected);
    });

    it('should parse BC dates', function () {
      let date = parseDateTime('0000-01-01');
      let expected = new CalendarDateTime('BC', 1, 1, 1);
      expect(date).toEqual(expected);

      date = parseDateTime('-000002-01-01');
      expected = new CalendarDateTime('BC', 3, 1, 1);
      expect(date).toEqual(expected);
    });

    it('should error if date is not padded', function () {
      expect(() => parseDateTime('123-02-03T12:24:45')).toThrow();
      expect(() => parseDateTime('2020-2-03T12:24:45')).toThrow();
      expect(() => parseDateTime('2020-02-3T12:24:45')).toThrow();
    });

    it('should error if time is not padded', function () {
      expect(() => parseDateTime('2020-02-03T1:24:45')).toThrow();
      expect(() => parseDateTime('2020-02-03T01:4:45')).toThrow();
      expect(() => parseDateTime('2020-02-03T01:04:5')).toThrow();
    });

    it('should error if components are out of range', function () {
      expect(() => parseDateTime('2020-00-03')).toThrow();
      expect(() => parseDateTime('2020-13-03')).toThrow();
      expect(() => parseDateTime('2020-01-32')).toThrow();
      expect(() => parseDateTime('2020-02-30')).toThrow();
      expect(() => parseDateTime('2020-02-03T33:00')).toThrow();
      expect(() => parseDateTime('2020-02-03T23:99')).toThrow();
      expect(() => parseDateTime('2020-02-03T12:22:99')).toThrow();
    });
  });

  describe('CalendarDateTime#toString', function () {
    it('should stringify a date with a zero time', function () {
      let date = new CalendarDateTime(2020, 2, 3);
      expect(date.toString()).toBe('2020-02-03T00:00:00');
    });

    it('should stringify a date with a time', function () {
      let date = new CalendarDateTime(2020, 2, 3, 12, 23, 45);
      expect(date.toString()).toBe('2020-02-03T12:23:45');
    });

    it('should stringify a date with a time and milliseconds', function () {
      let date = new CalendarDateTime(2020, 2, 3, 12, 23, 45, 120);
      expect(date.toString()).toBe('2020-02-03T12:23:45.12');
    });

    it('should stringify a BC date', function () {
      let date = new CalendarDateTime('BC', 1, 1, 1);
      expect(date.toString()).toBe('0000-01-01T00:00:00');

      date = new CalendarDateTime('BC', 2, 1, 1);
      expect(date.toString()).toBe('-000001-01-01T00:00:00');
    });
  });

  describe('parseZonedDateTime', function () {
    it('should parse a date without a time or offset', function () {
      let date = parseZonedDateTime('2020-02-03[America/Los_Angeles]');
      let expected = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000);
      expect(date).toEqual(expected);
    });

    it('should parse a date with a time but no offset', function () {
      let date = parseZonedDateTime('2020-02-03T12:24:45[America/Los_Angeles]');
      let expected = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 12, 24, 45);
      expect(date).toEqual(expected);
    });

    it('should parse a date with a time with milliseconds but no offset', function () {
      let date = parseZonedDateTime('2020-02-03T12:24:45.12[America/Los_Angeles]');
      let expected = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 12, 24, 45, 120);
      expect(date).toEqual(expected);
    });

    it('should parse a date with a time and an offset with only hours', function () {
      let date = parseZonedDateTime('2020-02-03T12:24:45-08[America/Los_Angeles]');
      let expected = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 12, 24, 45);
      expect(date).toEqual(expected);
    });

    it('should parse a date with a time and an offset with hours and minutes', function () {
      let date = parseZonedDateTime('2020-02-03T12:24:45-08:00[America/Los_Angeles]');
      let expected = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 12, 24, 45);
      expect(date).toEqual(expected);

      date = parseZonedDateTime('2020-02-03T12:24:45-0800[America/Los_Angeles]');
      expected = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 12, 24, 45);
      expect(date).toEqual(expected);

      date = parseZonedDateTime('2020-02-03T12:24:45-08[America/Los_Angeles]');
      expected = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 12, 24, 45);
      expect(date).toEqual(expected);

      date = parseZonedDateTime('2020-02-03T12:24:45+0000[UTC]');
      expected = new ZonedDateTime(2020, 2, 3, 'UTC', 0, 12, 24, 45);
      expect(date).toEqual(expected);
    });

    it('should parse a date with a time with milliseconds and an offset', function () {
      let date = parseZonedDateTime('2020-02-03T12:24:45.12-08:00[America/Los_Angeles]');
      let expected = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 12, 24, 45, 120);
      expect(date).toEqual(expected);
    });

    it('should disambiguate ambiguous times without an offset', function () {
      let date = parseZonedDateTime('2020-11-01T01:00[America/Los_Angeles]');
      let expected = new ZonedDateTime(2020, 11, 1, 'America/Los_Angeles', -25200000, 1, 0, 0);
      expect(date).toEqual(expected);

      date = parseZonedDateTime('2021-03-14T02:00[America/Los_Angeles]');
      expected = new ZonedDateTime(2021, 3, 14, 'America/Los_Angeles', -25200000, 3, 0, 0);
      expect(date).toEqual(expected);
    });

    it('should accept a disambiguation option', function () {
      let date = parseZonedDateTime('2020-11-01T01:00[America/Los_Angeles]', 'later');
      let expected = new ZonedDateTime(2020, 11, 1, 'America/Los_Angeles', -28800000, 1, 0, 0);
      expect(date).toEqual(expected);

      date = parseZonedDateTime('2021-03-14T02:00[America/Los_Angeles]', 'earlier');
      expected = new ZonedDateTime(2021, 3, 14, 'America/Los_Angeles', -28800000, 1, 0, 0);
      expect(date).toEqual(expected);
    });

    it('should disambiguate ambiguous times with an offset', function () {
      let date = parseZonedDateTime('2020-11-01T01:00-08:00[America/Los_Angeles]');
      let expected = new ZonedDateTime(2020, 11, 1, 'America/Los_Angeles', -28800000, 1, 0, 0);
      expect(date).toEqual(expected);

      date = parseZonedDateTime('2020-11-01T01:00-07:00[America/Los_Angeles]');
      expected = new ZonedDateTime(2020, 11, 1, 'America/Los_Angeles', -25200000, 1, 0, 0);
      expect(date).toEqual(expected);
    });

    it('should parse BC dates', function () {
      let date = parseZonedDateTime('0000-01-01T01:00[America/Los_Angeles]');
      let expected = new ZonedDateTime('BC', 1, 1, 1, 'America/Los_Angeles', -28378000, 1, 0, 0);
      expect(date).toEqual(expected);

      date = parseZonedDateTime('-000002-01-01T01:00[America/Los_Angeles]');
      expected = new ZonedDateTime('BC', 3, 1, 1, 'America/Los_Angeles', -28378000, 1, 0, 0);
      expect(date).toEqual(expected);
    });

    it('should error if parsing a date with an invalid offset', function () {
      expect(() => parseZonedDateTime('2020-02-03T12:24:45.12-04:00[America/Los_Angeles]')).toThrow();
      expect(() => parseZonedDateTime('2020-02-03T12:24:45.12-08:24[America/Los_Angeles]')).toThrow();
      expect(() => parseZonedDateTime('2021-03-14T02:00-08:00[America/Los_Angeles]')).toThrow();
      expect(() => parseZonedDateTime('2021-03-14T02:00-07:00[America/Los_Angeles]')).toThrow();
    });

    it('should error if components are out of range', function () {
      expect(() => parseZonedDateTime('2020-00-03[America/Los_Angeles]')).toThrow();
      expect(() => parseZonedDateTime('2020-13-03[America/Los_Angeles]')).toThrow();
      expect(() => parseZonedDateTime('2020-01-32[America/Los_Angeles]')).toThrow();
      expect(() => parseZonedDateTime('2020-02-30[America/Los_Angeles]')).toThrow();
      expect(() => parseZonedDateTime('2020-02-03T33:00[America/Los_Angeles]')).toThrow();
      expect(() => parseZonedDateTime('2020-02-03T23:99[America/Los_Angeles]')).toThrow();
      expect(() => parseZonedDateTime('2020-02-03T12:22:99[America/Los_Angeles]')).toThrow();
    });
  });

  describe('ZonedDateTime#toString', function () {
    it('should stringify a date', function () {
      let date = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 12, 24, 45);
      expect(date.toString()).toBe('2020-02-03T12:24:45-08:00[America/Los_Angeles]');
    });

    it('should stringify a date with milliseconds', function () {
      let date = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 12, 24, 45, 120);
      expect(date.toString()).toBe('2020-02-03T12:24:45.12-08:00[America/Los_Angeles]');
    });

    it('should stringify a BC date', function () {
      let date = new ZonedDateTime('BC', 1, 1, 1, 'UTC', 0, 1, 0, 0);
      expect(date.toString()).toBe('0000-01-01T01:00:00+00:00[UTC]');

      date = new ZonedDateTime('BC', 2, 1, 1, 'UTC', 0, 1, 0, 0);
      expect(date.toString()).toBe('-000001-01-01T01:00:00+00:00[UTC]');
    });
  });

  describe('parseAbsolute', function () {
    it('should parse a date without a time', function () {
      let date = parseAbsolute('2020-02-03Z', 'America/Los_Angeles');
      let expected = new ZonedDateTime(2020, 2, 2, 'America/Los_Angeles', -28800000, 16);
      expect(date).toEqual(expected);
    });

    it('should parse a date with an offset but no time', function () {
      let date = parseAbsolute('2020-02-03-08:00', 'America/Los_Angeles');
      let expected = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000);
      expect(date).toEqual(expected);
    });

    it('should parse a date with a time', function () {
      let date = parseAbsolute('2020-02-03T22:32:45Z', 'America/Los_Angeles');
      let expected = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 14, 32, 45);
      expect(date).toEqual(expected);
    });

    it('should parse a date with a time and offset', function () {
      let date = parseAbsolute('2020-02-03T22:32:45-08:00', 'America/Los_Angeles');
      let expected = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 22, 32, 45);
      expect(date).toEqual(expected);
    });

    it('should handle daylight saving time', function () {
      let date = parseAbsolute('2021-03-14T02:00-08:00', 'America/Los_Angeles');
      let expected = new ZonedDateTime(2021, 3, 14, 'America/Los_Angeles', -25200000, 3, 0, 0);
      expect(date).toEqual(expected);

      date = parseAbsolute('2021-11-07T01:00-07:00', 'America/Los_Angeles');
      expected = new ZonedDateTime(2021, 11, 7, 'America/Los_Angeles', -25200000, 1, 0, 0);
      expect(date).toEqual(expected);

      date = parseAbsolute('2021-11-07T01:00-08:00', 'America/Los_Angeles');
      expected = new ZonedDateTime(2021, 11, 7, 'America/Los_Angeles', -28800000, 1, 0, 0);
      expect(date).toEqual(expected);

      date = parseAbsolute('2021-11-07T01:00-0800', 'America/Los_Angeles');
      expected = new ZonedDateTime(2021, 11, 7, 'America/Los_Angeles', -28800000, 1, 0, 0);
      expect(date).toEqual(expected);

      date = parseAbsolute('2021-11-07T01:00-08', 'America/Los_Angeles');
      expected = new ZonedDateTime(2021, 11, 7, 'America/Los_Angeles', -28800000, 1, 0, 0);
      expect(date).toEqual(expected);

      date = parseAbsolute('2021-11-07T01:00+0000', 'America/Los_Angeles');
      expected = new ZonedDateTime(2021, 11, 6, 'America/Los_Angeles', -25200000, 18, 0, 0);
      expect(date).toEqual(expected);
    });

    it('should parse BC dates', function () {
      let date = parseAbsolute('0000-01-01T01:00Z', 'UTC');
      let expected =  new ZonedDateTime('BC', 1, 1, 1, 'UTC', 0, 1, 0, 0);
      expect(date).toEqual(expected);

      date = parseAbsolute('-000002-01-01T01:00Z', 'UTC');
      expected = new ZonedDateTime('BC', 3, 1, 1, 'UTC', 0, 1, 0, 0);
      expect(date).toEqual(expected);
    });

    it('should error if missing offset or Z', function () {
      expect(() => parseAbsolute('2020-02-03')).toThrow();
    });

    it('should error if components are out of range', function () {
      expect(() => parseAbsolute('2020-00-03Z')).toThrow();
      expect(() => parseAbsolute('2020-13-03Z')).toThrow();
      expect(() => parseAbsolute('2020-01-32Z')).toThrow();
      expect(() => parseAbsolute('2020-02-30Z')).toThrow();
      expect(() => parseAbsolute('2020-02-03T33:00Z')).toThrow();
      expect(() => parseAbsolute('2020-02-03T23:99Z')).toThrow();
      expect(() => parseAbsolute('2020-02-03T12:22:99Z')).toThrow();
    });
  });

  describe('ZonedDateTime#toAbsoluteString', function () {
    it('should stringify a date', function () {
      let date = new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 14, 32, 45);
      expect(date.toAbsoluteString()).toBe('2020-02-03T22:32:45.000Z');
    });

    it('should stringify a BC date', function () {
      let date = new ZonedDateTime('BC', 1, 1, 1, 'UTC', 0, 1, 0, 0);
      expect(date.toAbsoluteString()).toBe('0000-01-01T01:00:00.000Z');

      date = new ZonedDateTime('BC', 2, 1, 1, 'UTC', 0, 1, 0, 0);
      expect(date.toAbsoluteString()).toBe('-000001-01-01T01:00:00.000Z');
    });
  });

  describe('parseDuration', function () {
    it('parses an ISO 8601 duration string that contains years, months, weeks, days, hours, minutes, and seconds and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P3Y6M6W4DT12H30M5S');
      expect(duration).toStrictEqual({
        years: 3,
        months: 6,
        weeks: 6,
        days: 4,
        hours: 12,
        minutes: 30,
        seconds: 5,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains years, months, weeks, days, hours, minutes, and fractional values for seconds expressed with a period and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P3Y6M6W4DT12H30M5.5S');
      expect(duration).toStrictEqual({
        years: 3,
        months: 6,
        weeks: 6,
        days: 4,
        hours: 12,
        minutes: 30,
        seconds: 5.5,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains years, months, weeks, days, hours, minutes, and fractional values for seconds expressed with a comma and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P3Y6M6W4DT12H30M5,5S');
      expect(duration).toStrictEqual({
        years: 3,
        months: 6,
        weeks: 6,
        days: 4,
        hours: 12,
        minutes: 30,
        seconds: 5.5,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains years, months, weeks, days, hours, and fractional values for minutes expressed with a period and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P3Y6M6W4DT12H30.5M');
      expect(duration).toStrictEqual({
        years: 3,
        months: 6,
        weeks: 6,
        days: 4,
        hours: 12,
        minutes: 30.5,
        seconds: 0,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains years, months, weeks, days, hours, and fractional values for minutes expressed with a comma and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P3Y6M6W4DT12H30,5M');
      expect(duration).toStrictEqual({
        years: 3,
        months: 6,
        weeks: 6,
        days: 4,
        hours: 12,
        minutes: 30.5,
        seconds: 0,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains years, months, weeks, days, and fractional values for hours expressed with a period and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P3Y6M6W4DT12.5H');
      expect(duration).toStrictEqual({
        years: 3,
        months: 6,
        weeks: 6,
        days: 4,
        hours: 12.5,
        minutes: 0,
        seconds: 0,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains years, months, weeks, days, and fractional values for hours expressed with a comma and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P3Y6M6W4DT12.5H');
      expect(duration).toStrictEqual({
        years: 3,
        months: 6,
        weeks: 6,
        days: 4,
        hours: 12.5,
        minutes: 0,
        seconds: 0,
        milliseconds: 0
      });
    });

    it('parses a negative ISO 8601 duration string that contains years, months, weeks, days, hours, minutes, and seconds and returns a DateTimeDuration object', function () {
      const duration = parseDuration('-P3Y6M6W4DT12H30M5S');
      expect(duration).toStrictEqual({
        years: -3,
        months: -6,
        weeks: -6,
        days: -4,
        hours: -12,
        minutes: -30,
        seconds: -5,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains years, months, weeks, days, hours, minutes, and seconds with a preceding + sign and returns a DateTimeDuration object', function () {
      const duration = parseDuration('+P3Y6M6W4DT12H30M5S');
      expect(duration).toStrictEqual({
        years: 3,
        months: 6,
        weeks: 6,
        days: 4,
        hours: 12,
        minutes: 30,
        seconds: 5,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains hours, minutes, and seconds and returns a DateTimeDuration object', function () {
      const duration = parseDuration('PT20H35M15S');
      expect(duration).toStrictEqual({
        years: 0,
        months: 0,
        weeks: 0,
        days: 0,
        hours: 20,
        minutes: 35,
        seconds: 15,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains years, months, weeks, and days and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P7Y8M14W6D');
      expect(duration).toStrictEqual({
        years: 7,
        months: 8,
        weeks: 14,
        days: 6,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains years, months, hours, and seconds and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P18Y7MT20H15S');
      expect(duration).toStrictEqual({
        years: 18,
        months: 7,
        weeks: 0,
        days: 0,
        hours: 20,
        minutes: 0,
        seconds: 15,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string with values exceeding normal calendar constraints', function () {
      const duration = parseDuration('P99Y99M99W99DT99H99M99S');
      expect(duration).toStrictEqual({
        years: 99,
        months: 99,
        weeks: 99,
        days: 99,
        hours: 99,
        minutes: 99,
        seconds: 99,
        milliseconds: 0
      });
    });


    it('parses an ISO 8601 duration string that contains only years as a fractional value expressed with a period and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P0.5Y');
      expect(duration).toStrictEqual({
        years: 0.5,
        months: 0,
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0
      });
    });


    it('parses an ISO 8601 duration string that contains years, months, and fractional values for months expressed with a comma and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P1Y0,5M');
      expect(duration).toStrictEqual({
        years: 1,
        months: 0.5,
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains years, months, weeks, and fractional values for weeks expressed with a period and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P1Y1M0.5W');
      expect(duration).toStrictEqual({
        years: 1,
        months: 1,
        weeks: 0.5,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0
      });
    });

    it('parses an ISO 8601 duration string that contains years, months, weeks, days and fractional values for days expressed with a comma and returns a DateTimeDuration object', function () {
      const duration = parseDuration('P1Y1M1W0,5D');
      expect(duration).toStrictEqual({
        years: 1,
        months: 1,
        weeks: 1,
        days: 0.5,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0
      });
    });

    it('throws an error when passed an improperly formatted ISO 8601 duration string', function () {
      expect(() => {
        parseDuration('+-P18Y7MT20H15S');
      }).toThrow('Invalid ISO 8601 Duration string: +-P18Y7MT20H15S');
      expect(() => {
        parseDuration('-+P18Y7MT20H15S');
      }).toThrow('Invalid ISO 8601 Duration string: -+P18Y7MT20H15S');
      expect(() => {
        parseDuration('--P18Y7MT20H15S');
      }).toThrow('Invalid ISO 8601 Duration string: --P18Y7MT20H15S');
      expect(() => {
        parseDuration('++P18Y7MT20H15S');
      }).toThrow('Invalid ISO 8601 Duration string: ++P18Y7MT20H15S');
      expect(() => {
        parseDuration('P18Y7MT');
      }).toThrow('Invalid ISO 8601 Duration string: P18Y7MT');
      expect(() => {
        parseDuration('7Y6D85');
      }).toThrow('Invalid ISO 8601 Duration string: 7Y6D85');
      expect(() => {
        parseDuration('P1Y1M1W1DT1H1M1.123456789123S');
      }).toThrow('Invalid ISO 8601 Duration string: P1Y1M1W1DT1H1M1.123456789123S');
      expect(() => {
        parseDuration('P1Y1M1W1DT0.5H5S');
      }).toThrow('Invalid ISO 8601 Duration string: P1Y1M1W1DT0.5H5S - only the smallest unit can be fractional');
      expect(() => {
        parseDuration('P1Y1M1W1DT1.5H0,5M');
      }).toThrow('Invalid ISO 8601 Duration string: P1Y1M1W1DT1.5H0,5M - only the smallest unit can be fractional');
      expect(() => {
        parseDuration('P1Y1M1W1DT1H0.5M0.5S');
      }).toThrow('Invalid ISO 8601 Duration string: P1Y1M1W1DT1H0.5M0.5S - only the smallest unit can be fractional');
      expect(() => {
        parseDuration('P1.5Y1M1W1DT1H5M5S');
      }).toThrow('Invalid ISO 8601 Duration string: P1.5Y1M1W1DT1H5M5S - only the smallest unit can be fractional');
      expect(() => {
        parseDuration('P1.5Y1M1W1DT1H0.5M0.5S');
      }).toThrow('Invalid ISO 8601 Duration string: P1.5Y1M1W1DT1H0.5M0.5S - only the smallest unit can be fractional');
      expect(() => {
        parseDuration('P');
      }).toThrow('Invalid ISO 8601 Duration string: P');
      expect(() => {
        parseDuration('PT');
      }).toThrow('Invalid ISO 8601 Duration string: PT');
      expect(() => {
        parseDuration('-P');
      }).toThrow('Invalid ISO 8601 Duration string: -P');
      expect(() => {
        parseDuration('-PT');
      }).toThrow('Invalid ISO 8601 Duration string: -PT');
      expect(() => {
        parseDuration('+P');
      }).toThrow('Invalid ISO 8601 Duration string: +P');
      expect(() => {
        parseDuration('+PT');
      }).toThrow('Invalid ISO 8601 Duration string: +PT');
      expect(() => {
        parseDuration('P1Y1M1W1DT1H1M1.01Sjunk');
      }).toThrow('Invalid ISO 8601 Duration string: P1Y1M1W1DT1H1M1.01Sjunk');
      expect(() => {
        parseDuration('P-1Y1M');
      }).toThrow('Invalid ISO 8601 Duration string: P-1Y1M');
      expect(() => {
        parseDuration('P1Y-1M');
      }).toThrow('Invalid ISO 8601 Duration string: P1Y-1M');
    });
  });

  describe('durationToString', function () {
    it('should stringify a DateTimeDuration as an ISO 8601 compliant string', function () {
      const duration = {years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6};
      expect(durationToString(duration)).toBe('P1Y2M3DT4H5M6S');
    });

    it('should stringify a DateTimeDuration with milliseconds as an ISO 8601 compliant string', function () {
      const duration = {years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6, milliseconds: 50};
      expect(durationToString(duration)).toBe('P1Y2M3DT4H5M6.05S');
    });

    it('should stringify a DateTimeDuration with the last component of the duration being a decimal', function () {
      const duration = {years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6.5};
      expect(durationToString(duration)).toBe('P1Y2M3DT4H5M6.5S');
    });

    it('should stringify a DateTimeDuration with decimal seconds and milliseconds', function () {
      const duration = {years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6.5, milliseconds: 1234};
      expect(durationToString(duration)).toBe('P1Y2M3DT4H5M7.734S');
    });

    it('should not produce a string with the W time scale component', function () {
      const duration = {weeks: 2, days: 6};
      expect(durationToString(duration)).toBe('P20D');
    });

    it('should stringify a DateTimeDuration with negative values', function () {
      const duration = {years: -1, months: -2, days: -3, hours: -4, minutes: -5, seconds: -6};
      expect(durationToString(duration)).toBe('-P1Y2M3DT4H5M6S');
    });

    it('should throw an error if the DateTimeDuration has mixed positive and negative components', function () {
      const duration = {years: -1, months: -2, days: 3, hours: -4, minutes: -5, seconds: -6};
      expect(() => durationToString(duration)).toThrow('Cannot stringify a duration with mixed positive and negative components');
    });

    it('should throw an error if the DateTimeDuration has a decimal component that\'s not the lowest order', function () {
      const duration = {years: 1, months: 2, days: 3, hours: 4, minutes: 5.5, seconds: 6};
      expect(() => durationToString(duration)).toThrow('Cannot stringify a duration which contains fractional values other than in the lowest order component');
    });

    it('should throw an error if the DateTimeDuration has decimal minutes, no seconds, and milliseconds', function () {
      const duration = {years: 1, months: 2, days: 3, hours: 4, minutes: 5.5, milliseconds: 6};
      expect(() => durationToString(duration)).toThrow('Cannot stringify a duration which contains fractional values other than in the lowest order component');
    });

    it('should produce a valid ISO 8601 string for zero duration', function () {
      expect(durationToString({})).toBe('P0D');
    });
  });
});
