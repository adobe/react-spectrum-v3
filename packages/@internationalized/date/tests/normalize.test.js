import {CalendarDate, CalendarDateTime, IslamicUmalquraCalendar, ZonedDateTime} from '..';

describe('normalize', function () {
  describe('CalendarDateTime', function () {
    it('should handle hour overflow', function () {
      let date = new CalendarDateTime(2024, 1, 1, 26, 0, 0, 0);
      expect(date).toEqual(new CalendarDateTime(2024, 1, 2, 2, 0, 0, 0));
    });

    it('should handle minute overflow', function () {
      let date = new CalendarDateTime(2024, 1, 1, 1, 70, 0, 0);
      expect(date).toEqual(new CalendarDateTime(2024, 1, 1, 2, 10, 0, 0));
    });

    it('should handle second overflow', function () {
      let date = new CalendarDateTime(2024, 1, 1, 1, 1, 90, 0);
      expect(date).toEqual(new CalendarDateTime(2024, 1, 1, 1, 2, 30, 0));
    });

    it('should handle millisecond overflow', function () {
      let date = new CalendarDateTime(2024, 1, 1, 1, 1, 1, 1500);
      expect(date).toEqual(new CalendarDateTime(2024, 1, 1, 1, 1, 2, 500));
    });

    it('should handle hour underflow', function () {
      let date = new CalendarDateTime(2024, 1, 2, -2, 0, 0, 0);
      expect(date).toEqual(new CalendarDateTime(2024, 1, 1, 22, 0, 0, 0));
    });

    it('should handle complex time overflow', function () {
      let date = new CalendarDateTime(2024, 1, 1, 25, 61, 61, 1001);
      expect(date).toEqual(new CalendarDateTime(2024, 1, 2, 2, 2, 2, 1));
    });

    it('should handle day overflow', function () {
      let date = new CalendarDateTime(2024, 1, 32, 0, 0, 0, 0);
      expect(date).toEqual(new CalendarDateTime(2024, 2, 1, 0, 0, 0, 0));
    });

    it('should handle month overflow', function () {
      let date = new CalendarDateTime(2024, 13, 1, 0, 0, 0, 0);
      expect(date).toEqual(new CalendarDateTime(2025, 1, 1, 0, 0, 0, 0));
    });

    it('should handle leap year correctly', function () {
      let date = new CalendarDateTime(2024, 2, 29, 24, 0, 0, 0);
      expect(date).toEqual(new CalendarDateTime(2024, 3, 1, 0, 0, 0, 0));
    });

    it('should handle non-leap year correctly', function () {
      let date = new CalendarDateTime(2023, 2, 29, 0, 0, 0, 0);
      expect(date).toEqual(new CalendarDateTime(2023, 3, 1, 0, 0, 0, 0));
    });
  });

  describe('CalendarDate', function () {
    it('should handle day overflow', function () {
      let date = new CalendarDate(2024, 1, 32);
      expect(date).toEqual(new CalendarDate(2024, 2, 1));
    });

    it('should handle month overflow', function () {
      let date = new CalendarDate(2024, 13, 1);
      expect(date).toEqual(new CalendarDate(2025, 1, 1));
    });

    it('should handle day underflow', function () {
      let date = new CalendarDate(2024, 1, 0);
      expect(date).toEqual(new CalendarDate(2023, 12, 31));
    });

    it('should handle month underflow', function () {
      let date = new CalendarDate(2024, 0, 1);
      expect(date).toEqual(new CalendarDate(2023, 12, 1));
    });

    it('should handle leap year', function () {
      let date = new CalendarDate(2024, 2, 29);
      expect(date).toEqual(new CalendarDate(2024, 2, 29));
    });

    it('should handle non-leap year', function () {
      let date = new CalendarDate(2023, 2, 29);
      expect(date).toEqual(new CalendarDate(2023, 3, 1));
    });

    it('should work with different calendar systems', function () {
      let date = new CalendarDate(new IslamicUmalquraCalendar(), 1445, 13, 1);
      expect(date.month).toBe(1);
      expect(date.year).toBe(1446);
    });
  });

  describe('ZonedDateTime', function () {
    it('should handle hour overflow', function () {
      let date = new ZonedDateTime(2024, 1, 1, 'America/Los_Angeles', -28800000, 26, 0, 0, 0);
      expect(date).toEqual(new ZonedDateTime(2024, 1, 2, 'America/Los_Angeles', -28800000, 2, 0, 0, 0));
    });

    it('should handle minute overflow', function () {
      let date = new ZonedDateTime(2024, 1, 1, 'America/Los_Angeles', -28800000, 1, 70, 0, 0);
      expect(date).toEqual(new ZonedDateTime(2024, 1, 1, 'America/Los_Angeles', -28800000, 2, 10, 0, 0));
    });

    it('should handle complex time overflow', function () {
      let date = new ZonedDateTime(2024, 1, 1, 'America/Los_Angeles', -28800000, 25, 61, 61, 1001);
      expect(date).toEqual(new ZonedDateTime(2024, 1, 2, 'America/Los_Angeles', -28800000, 2, 2, 2, 1));
    });

    it('should handle day overflow', function () {
      let date = new ZonedDateTime(2024, 1, 32, 'America/Los_Angeles', -28800000, 0, 0, 0, 0);
      expect(date).toEqual(new ZonedDateTime(2024, 2, 1, 'America/Los_Angeles', -28800000, 0, 0, 0, 0));
    });

    it('should handle month overflow', function () {
      let date = new ZonedDateTime(2024, 13, 1, 'UTC', 0, 0, 0, 0, 0);
      expect(date.year).toBe(2025);
      expect(date.month).toBe(1);
      expect(date.day).toBe(1);
      expect(date.hour).toBe(0);
      expect(date.minute).toBe(0);
      expect(date.second).toBe(0);
      expect(date.millisecond).toBe(0);
    });

    it('should handle different calendar systems', function () {
      let date = new ZonedDateTime(new IslamicUmalquraCalendar(), 1445, 13, 1, 'America/Los_Angeles', -28800000, 0, 0, 0, 0);
      expect(date.month).toBe(1);
      expect(date.year).toBe(1446);
    });
  });
});
