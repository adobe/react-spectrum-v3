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

import {BuddhistCalendar, CalendarDate, CalendarDateTime, CopticCalendar, EthiopicAmeteAlemCalendar, EthiopicCalendar, HebrewCalendar, IndianCalendar, IslamicCivilCalendar, IslamicTabularCalendar, IslamicUmalquraCalendar, JapaneseCalendar, PersianCalendar, TaiwanCalendar, ZonedDateTime} from '..';
import {Custom454Calendar} from './customCalendarImpl';

describe('CalendarDate manipulation', function () {
  describe('add', function () {
    it('should add years', function () {
      let date = new CalendarDate(2020, 1, 1);
      expect(date.add({years: 5})).toEqual(new CalendarDate(2025, 1, 1));
    });

    it('should add months', function () {
      let date = new CalendarDate(2020, 1, 1);
      expect(date.add({months: 5})).toEqual(new CalendarDate(2020, 6, 1));
    });

    it('should add months across years', function () {
      let date = new CalendarDate(2020, 9, 1);
      expect(date.add({months: 5})).toEqual(new CalendarDate(2021, 2, 1));
    });

    it('should add months across multiple years', function () {
      let date = new CalendarDate(2020, 9, 1);
      expect(date.add({months: 17})).toEqual(new CalendarDate(2022, 2, 1));
    });

    it('should add months and constrain days', function () {
      let date = new CalendarDate(2020, 8, 31);
      expect(date.add({months: 1})).toEqual(new CalendarDate(2020, 9, 30));
    });

    it('should add days', function () {
      let date = new CalendarDate(2020, 9, 1);
      expect(date.add({days: 5})).toEqual(new CalendarDate(2020, 9, 6));
    });

    it('should add days across months', function () {
      let date = new CalendarDate(2020, 9, 20);
      expect(date.add({days: 15})).toEqual(new CalendarDate(2020, 10, 5));
    });

    it('should add days across multiple months', function () {
      let date = new CalendarDate(2020, 9, 20);
      expect(date.add({days: 46})).toEqual(new CalendarDate(2020, 11, 5));
    });

    it('should add days across years', function () {
      let date = new CalendarDate(2020, 12, 20);
      expect(date.add({days: 15})).toEqual(new CalendarDate(2021, 1, 4));
    });

    it('should add days across multiple years', function () {
      let date = new CalendarDate(2020, 12, 20);
      expect(date.add({days: 380})).toEqual(new CalendarDate(2022, 1, 4));
    });

    it('should handle leap years', function () {
      let date = new CalendarDate(2020, 2, 28);
      expect(date.add({days: 1})).toEqual(new CalendarDate(2020, 2, 29));
      expect(date.add({days: 2})).toEqual(new CalendarDate(2020, 3, 1));
    });

    it('should handle non-leap years', function () {
      let date = new CalendarDate(2019, 2, 28);
      expect(date.add({days: 1})).toEqual(new CalendarDate(2019, 3, 1));
    });

    it('should add weeks', function () {
      let date = new CalendarDate(2020, 9, 1);
      expect(date.add({weeks: 5})).toEqual(new CalendarDate(2020, 10, 6));
    });

    it('should add years, months, and days together', function () {
      let date = new CalendarDate(2020, 10, 25);
      expect(date.add({years: 2, months: 3, days: 10})).toEqual(new CalendarDate(2023, 2, 4));
    });

    it('should ignore time when adding to a date', function () {
      let date = new CalendarDate(2020, 10, 25);
      expect(date.add({hours: 36})).toEqual(date);
      expect(date.add({minutes: 500})).toEqual(date);
      expect(date.add({seconds: 5000000})).toEqual(date);
      expect(date.add({milliseconds: 50000000000})).toEqual(date);
    });

    it('should add in BC', function () {
      let date = new CalendarDate('BC', 10, 9, 3);
      expect(date.add({years: 1})).toEqual(new CalendarDate('BC', 9, 9, 3));
    });

    it('should add between BC and AD', function () {
      let date = new CalendarDate('BC', 1, 9, 3);
      expect(date.add({years: 1})).toEqual(new CalendarDate(1, 9, 3));

      date = new CalendarDate('BC', 11, 9, 3);
      expect(date.add({years: 20})).toEqual(new CalendarDate(10, 9, 3));
    });

    it('should constrain when hitting the maximum year', function () {
      let date = new CalendarDate(9999, 12, 1);
      expect(date.add({months: 1})).toEqual(new CalendarDate(9999, 12, 31));
    });

    it('should constrain when hitting the minimum year', function () {
      let date = new CalendarDate('BC', 9999, 1, 12);
      expect(date.subtract({months: 1})).toEqual(new CalendarDate('BC', 9999, 1, 1));
    });

    describe('Japanese calendar', function () {
      it('should add years and rebalance era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30);
        expect(date.add({years: 1})).toEqual(new CalendarDate(new JapaneseCalendar(), 'reiwa', 2, 4, 30));
      });

      it('should add months and rebalance era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new JapaneseCalendar(), 'reiwa', 1, 5, 30));
      });

      it('should add days and rebalance era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30);
        expect(date.add({days: 1})).toEqual(new CalendarDate(new JapaneseCalendar(), 'reiwa', 1, 5, 1));
      });

      it('should contstrain when reaching begining of meiji era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'meiji', 1, 10, 1);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new JapaneseCalendar(), 'meiji', 1, 9, 8));
      });

      it('should constrain when reaching 7981 reiwa', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'reiwa', 7981, 12, 5);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new JapaneseCalendar(), 'reiwa', 7981, 12, 31));
      });
    });

    describe('Taiwan calendar', function () {
      it('should add years and rebalance era', function () {
        let date = new CalendarDate(new TaiwanCalendar(), 'before_minguo', 1, 4, 30);
        expect(date.add({years: 1})).toEqual(new CalendarDate(new TaiwanCalendar(), 'minguo', 1, 4, 30));
      });

      it('should add years in before_minguo era', function () {
        let date = new CalendarDate(new TaiwanCalendar(), 'before_minguo', 3, 4, 30);
        expect(date.add({years: 1})).toEqual(new CalendarDate(new TaiwanCalendar(), 'before_minguo', 2, 4, 30));
      });

      it('should add months and rebalance era', function () {
        let date = new CalendarDate(new TaiwanCalendar(), 'before_minguo', 1, 12, 30);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new TaiwanCalendar(), 'minguo', 1, 1, 30));
      });

      it('should add days and rebalance era', function () {
        let date = new CalendarDate(new TaiwanCalendar(), 'before_minguo', 1, 12, 31);
        expect(date.add({days: 1})).toEqual(new CalendarDate(new TaiwanCalendar(), 'minguo', 1, 1, 1));
      });

      it('should constrain when reaching year 8088', function () {
        let date = new CalendarDate(new TaiwanCalendar(), 8088, 12, 10);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new TaiwanCalendar(), 8088, 12, 31));
      });

      it('should constrain when reaching year 8088 before minguo', function () {
        let date = new CalendarDate(new TaiwanCalendar(), 'before_minguo', 9999, 1, 10);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new TaiwanCalendar(), 'before_minguo', 9999, 1, 1));
      });
    });

    describe('Hebrew calendar', function () {
      it('should add months in a non-leap year', function () {
        let date = new CalendarDate(new HebrewCalendar(), 5781, 5, 1);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 5781, 6, 1));

        date = new CalendarDate(new HebrewCalendar(), 5781, 12, 1);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 5782, 1, 1));
      });

      it('should add months in a leap year', function () {
        let date = new CalendarDate(new HebrewCalendar(), 5782, 5, 1);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 5782, 6, 1));

        date = new CalendarDate(new HebrewCalendar(), 5782, 12, 1);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 5782, 13, 1));
      });

      it('should add years in a leap year', function () {
        let date = new CalendarDate(new HebrewCalendar(), 5782, 13, 1);
        expect(date.add({years: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 5783, 12, 1));
      });

      it('should constrain when reaching year 1', function () {
        let date = new CalendarDate(new HebrewCalendar(), 1, 1, 10);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 1, 1, 1));
      });

      it('should constrain when reaching year 9999', function () {
        let date = new CalendarDate(new HebrewCalendar(), 9999, 12, 10);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 9999, 12, 29));
      });
    });

    describe('IndianCalendar', function () {
      it('should constrain when reaching year 1', function () {
        let date = new CalendarDate(new IndianCalendar(), 1, 1, 10);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new IndianCalendar(), 1, 1, 1));
      });

      it('should constrain when reaching year 9919', function () {
        let date = new CalendarDate(new IndianCalendar(), 9919, 12, 10);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new IndianCalendar(), 9919, 12, 31));
      });
    });

    describe('PersianCalendar', function () {
      it('should constrain when reaching year 1', function () {
        let date = new CalendarDate(new PersianCalendar(), 1, 1, 10);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new PersianCalendar(), 1, 1, 1));
      });

      it('should constrain when reaching year 9377', function () {
        let date = new CalendarDate(new PersianCalendar(), 9377, 12, 10);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new PersianCalendar(), 9377, 12, 31));
      });
    });

    describe('BuddhistCalendar', function () {
      it('should constrain when reaching year 1', function () {
        let date = new CalendarDate(new BuddhistCalendar(), 1, 1, 12);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new BuddhistCalendar(), 1, 1, 1));
      });

      it('should constrain when reaching year 9999', function () {
        let date = new CalendarDate(new BuddhistCalendar(), 9999, 12, 10);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new BuddhistCalendar(), 9999, 12, 31));
      });
    });

    describe('CopticCalendar', function () {
      it('should rebalance era when subtracting', function () {
        let date = new CalendarDate(new CopticCalendar(), 1, 1, 12);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new CopticCalendar(), 'BCE', 1, 13, 5));
      });

      it('should rebalance era when adding', function () {
        let date = new CalendarDate(new CopticCalendar(), 'BCE', 1, 13, 5);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new CopticCalendar(), 1, 1, 5));
      });

      it('should constrain when reaching year 9715 CE', function () {
        let date = new CalendarDate(new CopticCalendar(), 9715, 13, 2);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new CopticCalendar(), 9715, 13, 6));
      });

      it('should constrain when reaching year 9999 BCE', function () {
        let date = new CalendarDate(new CopticCalendar(), 'BCE', 9999, 1, 5);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new CopticCalendar(), 'BCE', 9999, 1, 1));
      });
    });

    describe('EthiopicCalendar', function () {
      it('should constrain when reaching year 9991 AM', function () {
        let date = new CalendarDate(new EthiopicCalendar(), 9991, 13, 2);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new EthiopicCalendar(), 9991, 13, 6));
      });

      it('should constrain when reaching year 9999 AA', function () {
        let date = new CalendarDate(new EthiopicCalendar(), 'AA', 9999, 13, 2);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new EthiopicCalendar(), 'AA', 9999, 13, 6));
      });
    });

    describe('EthiopicAmeteAlemCalendar', function () {
      it('should constrain when reaching year 9999 AA', function () {
        let date = new CalendarDate(new EthiopicAmeteAlemCalendar(), 'AA', 9999, 13, 2);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new EthiopicAmeteAlemCalendar(), 'AA', 9999, 13, 6));
      });
    });

    describe('IslamicCivilCalendar', function () {
      it('should constrain when reaching year 9995', function () {
        let date = new CalendarDate(new IslamicCivilCalendar(), 9995, 12, 2);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new IslamicCivilCalendar(), 9995, 12, 30));
      });
    });

    describe('IslamicTabularCalendar', function () {
      it('should constrain when reaching year 9995', function () {
        let date = new CalendarDate(new IslamicTabularCalendar(), 9995, 12, 2);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new IslamicTabularCalendar(), 9995, 12, 30));
      });
    });

    describe('IslamicUmalquraCalendar', function () {
      it('should constrain when reaching year 9995', function () {
        let date = new CalendarDate(new IslamicUmalquraCalendar(), 9995, 12, 2);
        expect(date.add({months: 1})).toEqual(new CalendarDate(new IslamicUmalquraCalendar(), 9995, 12, 30));
      });
    });

    describe('Custom calendar', function () {
      // Use https://www5.an.adobe.com/sc15/settings/customize_calendar_preview.html?&type=1 to help verify
      it('should use the getCurrentMonth function when adding months', function () {
        let date = new CalendarDate(new Custom454Calendar(), 2023, 10, 1);
        // Oct 2023 has 4 weeks in the 454 calendar; 4*7 = 28 days | 1+28 = 29
        expect(date.add({months: 1})).toEqual(new CalendarDate(new Custom454Calendar(), 2023, 10, 29));
      });

      it('should add multiple months correctly', function () {
        // Sep 2023 has 5 weeks in the 454 calendar and starts on Aug 27; 5*7 = 35 days
        // Oct 2023 has 4 weeks in the 454 calendar; 4*7 = 28 days
        // 35+28 = 63 total days to add
        let date = new CalendarDate(new Custom454Calendar(), 2023, 8, 27);

        // Aug 27 + 63 days = Oct 29
        expect(date.add({months: 2})).toEqual(new CalendarDate(new Custom454Calendar(), 2023, 10, 29));

        // Sanity check for above math
        expect(new CalendarDate(2023, 8, 27).add({days: 63})).toEqual(new CalendarDate(2023, 10, 29));
      });
    });
  });

  describe('subtract', function () {
    it('should subtract years', function () {
      let date = new CalendarDate(2025, 1, 1);
      expect(date.subtract({years: 5})).toEqual(new CalendarDate(2020, 1, 1));
    });

    it('should subtract months', function () {
      let date = new CalendarDate(2020, 6, 1);
      expect(date.subtract({months: 5})).toEqual(new CalendarDate(2020, 1, 1));
    });

    it('should subtract months across years', function () {
      let date = new CalendarDate(2021, 2, 1);
      expect(date.subtract({months: 5})).toEqual(new CalendarDate(2020, 9, 1));
    });

    it('should subtract months across multiple years', function () {
      let date = new CalendarDate(2022, 2, 1);
      expect(date.subtract({months: 17})).toEqual(new CalendarDate(2020, 9, 1));
    });

    it('should subtract months and constrain days', function () {
      let date = new CalendarDate(2020, 10, 31);
      expect(date.subtract({months: 1})).toEqual(new CalendarDate(2020, 9, 30));
    });

    it('should subtract days', function () {
      let date = new CalendarDate(2020, 9, 6);
      expect(date.subtract({days: 5})).toEqual(new CalendarDate(2020, 9, 1));
    });

    it('should subtract days across months', function () {
      let date = new CalendarDate(2020, 10, 5);
      expect(date.subtract({days: 15})).toEqual(new CalendarDate(2020, 9, 20));
    });

    it('should subtract days across multiple months', function () {
      let date = new CalendarDate(2020, 11, 5);
      expect(date.subtract({days: 46})).toEqual(new CalendarDate(2020, 9, 20));
    });

    it('should subtract days across years', function () {
      let date = new CalendarDate(2021, 1, 4);
      expect(date.subtract({days: 15})).toEqual(new CalendarDate(2020, 12, 20));
    });

    it('should subtract days across multiple years', function () {
      let date = new CalendarDate(2022, 1, 4);
      expect(date.subtract({days: 380})).toEqual(new CalendarDate(2020, 12, 20));
    });

    it('should handle leap years', function () {
      let date = new CalendarDate(2020, 2, 28);
      expect(new CalendarDate(2020, 2, 29).subtract({days: 1})).toEqual(date);
      expect(new CalendarDate(2020, 3, 1).subtract({days: 2})).toEqual(date);
    });

    it('should handle non-leap years', function () {
      let date = new CalendarDate(2019, 2, 28);
      expect(new CalendarDate(2019, 3, 1).subtract({days: 1})).toEqual(date);
    });

    it('should subtract weeks', function () {
      let date = new CalendarDate(2020, 10, 6);
      expect(date.subtract({weeks: 5})).toEqual(new CalendarDate(2020, 9, 1));
    });

    it('should ignore time when subtracting from a date', function () {
      let date = new CalendarDate(2020, 10, 25);
      expect(date.subtract({hours: 36})).toEqual(date);
      expect(date.subtract({minutes: 500})).toEqual(date);
      expect(date.subtract({seconds: 5000000})).toEqual(date);
      expect(date.subtract({milliseconds: 50000000000})).toEqual(date);
    });

    it('should subtract in BC', function () {
      let date = new CalendarDate('BC', 1, 9, 3);
      expect(date.subtract({years: 1})).toEqual(new CalendarDate('BC', 2, 9, 3));
    });

    it('should subtract between AD and BC', function () {
      let date = new CalendarDate(1, 9, 3);
      expect(date.subtract({years: 1})).toEqual(new CalendarDate('BC', 1, 9, 3));

      date = new CalendarDate(10, 9, 3);
      expect(date.subtract({years: 20})).toEqual(new CalendarDate('BC', 11, 9, 3));
    });

    describe('Japanese calendar', function () {
      it('should subtract years and rebalance era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'reiwa', 1, 5, 30);
        expect(date.subtract({years: 1})).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 30, 5, 30));
      });

      it('should subtract months and rebalance era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'reiwa', 1, 5, 30);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30));
      });

      it('should subtract days and rebalance era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'reiwa', 1, 5, 1);
        expect(date.subtract({days: 1})).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30));
      });

      it('should constrain when reaching the minimum supported era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'meiji', 1, 9, 10);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new JapaneseCalendar(), 'meiji', 1, 9, 10));

        date = new CalendarDate(new JapaneseCalendar(), 'meiji', 1, 9, 10);
        expect(date.subtract({years: 1})).toEqual(new CalendarDate(new JapaneseCalendar(), 'meiji', 1, 9, 10));
      });
    });

    describe('Taiwan calendar', function () {
      it('should subtract years and rebalance era', function () {
        let date = new CalendarDate(new TaiwanCalendar(), 'minguo', 1, 4, 30);
        expect(date.subtract({years: 1})).toEqual(new CalendarDate(new TaiwanCalendar(), 'before_minguo', 1, 4, 30));
      });

      it('should subtract years in before_minguo era', function () {
        let date = new CalendarDate(new TaiwanCalendar(), 'before_minguo', 2, 4, 30);
        expect(date.subtract({years: 1})).toEqual(new CalendarDate(new TaiwanCalendar(), 'before_minguo', 3, 4, 30));
      });

      it('should subtract months and rebalance era', function () {
        let date = new CalendarDate(new TaiwanCalendar(), 'minguo', 1, 1, 30);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new TaiwanCalendar(), 'before_minguo', 1, 12, 30));
      });

      it('should subtract days and rebalance era', function () {
        let date = new CalendarDate(new TaiwanCalendar(), 'minguo', 1, 1, 1);
        expect(date.subtract({days: 1})).toEqual(new CalendarDate(new TaiwanCalendar(), 'before_minguo', 1, 12, 31));
      });
    });

    describe('Hebrew calendar', function () {
      it('should subtract months in a non-leap year', function () {
        let date = new CalendarDate(new HebrewCalendar(), 5781, 6, 1);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 5781, 5, 1));

        date = new CalendarDate(new HebrewCalendar(), 5782, 1, 1);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 5781, 12, 1));
      });

      it('should subtract months in a leap year', function () {
        let date = new CalendarDate(new HebrewCalendar(), 5782, 6, 1);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 5782, 5, 1));

        date = new CalendarDate(new HebrewCalendar(), 5782, 13, 1);
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 5782, 12, 1));
      });

      it('should subtract years in a leap year', function () {
        let date = new CalendarDate(new HebrewCalendar(), 5782, 13, 1);
        expect(date.subtract({years: 1})).toEqual(new CalendarDate(new HebrewCalendar(), 5781, 12, 1));
      });
    });

    describe('Custom calendar', function () {
      // Use https://www5.an.adobe.com/sc15/settings/customize_calendar_preview.html?&type=1 to help verify
      it('should subtract the number of days from the previous month from the provided day', function () {
        // Sep 2023 has 5 weeks in the 454 calendar; 5*7 = 35 days | Oct 1 - 35 = Aug 27
        let date = new CalendarDate(new Custom454Calendar(), 2023, 10, 1); // Start of Oct 2023
        expect(date.subtract({months: 1})).toEqual(new CalendarDate(new Custom454Calendar(), 2023, 8, 27));
      });

      it('should subtract multiple months correctly', function () {
        // Aug 2023 has 4 weeks in the 454 calendar; 4*7 = 28 days
        // Sep 2023 has 5 weeks in the 454 calendar and starts on Aug 27; 5*7 = 35 days
        // Oct 2023 has 4 weeks in the 454 calendar; 4*7 = 28 days
        // 28+35+28 = 91 total days to subtract
        let date = new CalendarDate(new Custom454Calendar(), 2023, 10, 29); // Start of Nov 2023
        // Oct 29 - 91 days = Jul 30
        expect(date.subtract({months: 3})).toEqual(new CalendarDate(new Custom454Calendar(), 2023, 7, 30));

        // Sanity check for above math
        expect(new CalendarDate(2023, 10, 29).subtract({days: 91})).toEqual(new CalendarDate(2023, 7, 30));
      });
    });
  });

  describe('set', function () {
    it('should set year', function () {
      let date = new CalendarDate(2020, 2, 3);
      expect(date.set({year: 2022})).toEqual(new CalendarDate(2022, 2, 3));
    });

    it('should set month', function () {
      let date = new CalendarDate(2020, 2, 3);
      expect(date.set({month: 5})).toEqual(new CalendarDate(2020, 5, 3));
    });

    it('should constrain month', function () {
      let date = new CalendarDate(2020, 2, 3);
      expect(date.set({month: 13})).toEqual(new CalendarDate(2020, 12, 3));
    });

    it('should set month and constrain day', function () {
      let date = new CalendarDate(2020, 8, 31);
      expect(date.set({month: 9})).toEqual(new CalendarDate(2020, 9, 30));
    });

    it('should set day', function () {
      let date = new CalendarDate(2020, 2, 3);
      expect(date.set({day: 9})).toEqual(new CalendarDate(2020, 2, 9));
    });

    it('should constrain day', function () {
      let date = new CalendarDate(2020, 9, 3);
      expect(date.set({day: 31})).toEqual(new CalendarDate(2020, 9, 30));
    });

    it('should constrain day on leap years', function () {
      let date = new CalendarDate(2020, 2, 3);
      expect(date.set({day: 31})).toEqual(new CalendarDate(2020, 2, 29));

      date = new CalendarDate(2019, 2, 3);
      expect(date.set({day: 31})).toEqual(new CalendarDate(2019, 2, 28));
    });

    describe('Japanese calendar', function () {
      it('should constrain date in era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'heisei', 30, 4, 30);
        expect(date.set({year: 35})).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30));

        date = new CalendarDate(new JapaneseCalendar(), 'showa', 63, 1, 6);
        expect(date.set({year: 72})).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 6));

        date = new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 3, 30);
        expect(date.set({month: 5})).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30));

        date = new CalendarDate(new JapaneseCalendar(), 'showa', 1, 12, 30);
        expect(date.set({month: 5})).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 1, 12, 30));

        date = new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 6);
        expect(date.set({day: 8})).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 7));

        date = new CalendarDate(new JapaneseCalendar(), 'showa', 1, 12, 30);
        expect(date.set({day: 5})).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 1, 12, 25));

        date = new CalendarDate(new JapaneseCalendar(), 'reiwa', 1, 12, 30);
        expect(date.set({year: 1, month: 1, day: 1})).toEqual(new CalendarDate(new JapaneseCalendar(), 'reiwa', 1, 5, 1));
      });
    });

    describe('Taiwan calendar', function () {
      it('should constrain year in era', function () {
        let date = new CalendarDate(new TaiwanCalendar(), 'before_minguo', 5, 4, 30);
        expect(date.set({year: -2})).toEqual(new CalendarDate(new TaiwanCalendar(), 'before_minguo', 1, 4, 30));
      });
    });
  });

  describe('cycle', function () {
    describe('era', function () {
      it('should cycle the era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'heisei', 10, 4, 30);
        expect(date.cycle('era', 1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'reiwa', 10, 4, 30));
        expect(date.cycle('era', -1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 10, 4, 30));

        date = new CalendarDate(new JapaneseCalendar(), 'showa', 10, 4, 30);
        expect(date.cycle('era', 2)).toEqual(new CalendarDate(new JapaneseCalendar(), 'reiwa', 10, 4, 30));
        expect(date.cycle('era', 3)).toEqual(new CalendarDate(new JapaneseCalendar(), 'meiji', 10, 4, 30));
      });

      it('should constrain the date within the era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'showa', 63, 1, 6);
        expect(date.cycle('era', 1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 1, 6));

        date = new CalendarDate(new JapaneseCalendar(), 'showa', 63, 7, 6);
        expect(date.cycle('era', 1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 6));
      });
    });

    describe('year', function () {
      it('should cycle the year', function () {
        let date = new CalendarDate(2020, 9, 3);
        expect(date.cycle('year', 1)).toEqual(new CalendarDate(2021, 9, 3));
        expect(date.cycle('year', -1)).toEqual(new CalendarDate(2019, 9, 3));
        expect(date.cycle('year', 5)).toEqual(new CalendarDate(2025, 9, 3));
        expect(date.cycle('year', -5)).toEqual(new CalendarDate(2015, 9, 3));

        date = new CalendarDate(9999, 9, 3);
        expect(date.cycle('year', 1)).toEqual(new CalendarDate(1, 9, 3));

        date = new CalendarDate(1, 9, 3);
        expect(date.cycle('year', -1)).toEqual(new CalendarDate('BC', 1, 9, 3));

        date = new CalendarDate(10, 9, 3);
        expect(date.cycle('year', -20)).toEqual(new CalendarDate('BC', 11, 9, 3));

        date = new CalendarDate('BC', 1, 9, 3);
        expect(date.cycle('year', 1)).toEqual(new CalendarDate(1, 9, 3));

        date = new CalendarDate(new HebrewCalendar(), 5782, 13, 1);
        expect(date.cycle('year', 1)).toEqual(new CalendarDate(new HebrewCalendar(), 5783, 12, 1));

        date = new CalendarDate(new HebrewCalendar(), 5783, 12, 1);
        expect(date.cycle('year', -1)).toEqual(new CalendarDate(new HebrewCalendar(), 5782, 13, 1));
      });

      it('should cycle the year with rounding', function () {
        let date = new CalendarDate(2019, 9, 3);
        expect(date.cycle('year', 5, {round: true})).toEqual(new CalendarDate(2020, 9, 3));
        expect(date.cycle('year', -5, {round: true})).toEqual(new CalendarDate(2015, 9, 3));
      });

      it('should constrain the day on leap years', function () {
        let date = new CalendarDate(2020, 2, 29);
        expect(date.cycle('year', 1)).toEqual(new CalendarDate(2021, 2, 28));
      });

      it('should adjust the era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30);
        expect(date.cycle('year', 1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'reiwa', 2, 4, 30));
        expect(date.cycle('year', 5)).toEqual(new CalendarDate(new JapaneseCalendar(), 'reiwa', 6, 4, 30));

        date = new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 7);
        expect(date.cycle('year', 1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 2, 1, 7));

        date = new CalendarDate(new JapaneseCalendar(), 'heisei', 2, 1, 7);
        expect(date.cycle('year', -1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 7));

        date = new CalendarDate(new JapaneseCalendar(), 'showa', 2, 8, 5);
        expect(date.cycle('year', -1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'taisho', 15, 8, 5));
      });
    });

    describe('month', function () {
      it('should cycle the month', function () {
        let date = new CalendarDate(2020, 9, 3);
        expect(date.cycle('month', 1)).toEqual(new CalendarDate(2020, 10, 3));
        expect(date.cycle('month', -1)).toEqual(new CalendarDate(2020, 8, 3));
        expect(date.cycle('month', 4)).toEqual(new CalendarDate(2020, 1, 3));
        expect(date.cycle('month', -10)).toEqual(new CalendarDate(2020, 11, 3));
      });

      it('should cycle the month with rounding', function () {
        let date = new CalendarDate(2020, 8, 3);
        expect(date.cycle('month', 5, {round: true})).toEqual(new CalendarDate(2020, 10, 3));
        expect(date.cycle('month', -5, {round: true})).toEqual(new CalendarDate(2020, 5, 3));
      });

      it('should constrain the day', function () {
        let date = new CalendarDate(2020, 1, 31);
        expect(date.cycle('month', 1)).toEqual(new CalendarDate(2020, 2, 29));

        date = new CalendarDate(2021, 1, 31);
        expect(date.cycle('month', 1)).toEqual(new CalendarDate(2021, 2, 28));
      });

      it('should adjust the era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30);
        expect(date.cycle('month', 1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'reiwa', 1, 5, 30));

        date = new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 1, 30);
        expect(date.cycle('month', -1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'reiwa', 1, 12, 30));

        date = new CalendarDate(new JapaneseCalendar(), 'showa', 1, 12, 25);
        expect(date.cycle('month', 1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'taisho', 15, 1, 25));

        date = new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 7);
        expect(date.cycle('month', 1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 2, 7));

        date = new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 2, 7);
        expect(date.cycle('month', -1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 7));
      });
    });

    describe('day', function () {
      it('should cycle the day', function () {
        let date = new CalendarDate(2020, 9, 3);
        expect(date.cycle('day', 1)).toEqual(new CalendarDate(2020, 9, 4));
        expect(date.cycle('day', -1)).toEqual(new CalendarDate(2020, 9, 2));
        expect(date.cycle('day', 28)).toEqual(new CalendarDate(2020, 9, 1));
        expect(date.cycle('day', -4)).toEqual(new CalendarDate(2020, 9, 29));
      });

      it('should cycle the day with rounding', function () {
        let date = new CalendarDate(2020, 8, 3);
        expect(date.cycle('day', 5, {round: true})).toEqual(new CalendarDate(2020, 8, 5));
        expect(date.cycle('day', -5, {round: true})).toEqual(new CalendarDate(2020, 8, 1));
      });

      it('should adjust the era', function () {
        let date = new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 7);
        expect(date.cycle('day', 1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 1, 8));

        date = new CalendarDate(new JapaneseCalendar(), 'heisei', 1, 1, 8);
        expect(date.cycle('day', -1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'showa', 64, 1, 7));

        date = new CalendarDate(new JapaneseCalendar(), 'showa', 1, 12, 25);
        expect(date.cycle('day', -1)).toEqual(new CalendarDate(new JapaneseCalendar(), 'taisho', 15, 12, 24));
      });
    });
  });
});

describe('CalendarDateTime manipulation', function () {
  describe('add', function () {
    it.each`
      Unit              | Expected
      ${'years'}        | ${new CalendarDateTime(2025, 1, 1, 0, 0, 0, 0)}
      ${'months'}       | ${new CalendarDateTime(2020, 6, 1, 0, 0, 0, 0)}
      ${'weeks'}        | ${new CalendarDateTime(2020, 2, 5, 0, 0, 0, 0)}
      ${'days'}         | ${new CalendarDateTime(2020, 1, 6, 0, 0, 0, 0)}
      ${'hours'}        | ${new CalendarDateTime(2020, 1, 1, 5, 0, 0, 0)}
      ${'minutes'}      | ${new CalendarDateTime(2020, 1, 1, 0, 5, 0, 0)}
      ${'seconds'}      | ${new CalendarDateTime(2020, 1, 1, 0, 0, 5, 0)}
      ${'milliseconds'} | ${new CalendarDateTime(2020, 1, 1, 0, 0, 0, 5)}
    `('should add $Unit', ({Unit, Expected}) => {
      let date = new CalendarDateTime(2020, 1, 1, 0, 0, 0, 0);
      expect(date.add({[`${Unit}`]: 5})).toEqual(Expected);
    });
  });

  describe('subtract', function () {
    it.each`
      Unit              | Expected
      ${'years'}        | ${new CalendarDateTime(2015, 1, 1, 5, 5, 5, 5)}
      ${'months'}       | ${new CalendarDateTime(2019, 8, 1, 5, 5, 5, 5)}
      ${'weeks'}        | ${new CalendarDateTime(2019, 11, 27, 5, 5, 5, 5)}
      ${'days'}         | ${new CalendarDateTime(2019, 12, 27, 5, 5, 5, 5)}
      ${'hours'}        | ${new CalendarDateTime(2020, 1, 1, 0, 5, 5, 5)}
      ${'minutes'}      | ${new CalendarDateTime(2020, 1, 1, 5, 0, 5, 5)}
      ${'seconds'}      | ${new CalendarDateTime(2020, 1, 1, 5, 5, 0, 5)}
      ${'milliseconds'} | ${new CalendarDateTime(2020, 1, 1, 5, 5, 5, 0)}
    `('should subtract $Unit', ({Unit, Expected}) => {
      let date = new CalendarDateTime(2020, 1, 1, 5, 5, 5, 5);
      expect(date.subtract({[`${Unit}`]: 5})).toEqual(Expected);
    });
  });
});


describe('ZonedDateTime manipulation', function () {
  describe('add', function () {
    it.each`
      Unit              | Expected
      ${'years'}        | ${new ZonedDateTime(2025, 1, 1, 'UTC', 0, 0, 0, 0, 0)}
      ${'months'}       | ${new ZonedDateTime(2020, 6, 1, 'UTC', 0, 0, 0, 0, 0)}
      ${'weeks'}        | ${new ZonedDateTime(2020, 2, 5, 'UTC', 0, 0, 0, 0, 0)}
      ${'days'}         | ${new ZonedDateTime(2020, 1, 6, 'UTC', 0, 0, 0, 0, 0)}
      ${'hours'}        | ${new ZonedDateTime(2020, 1, 1, 'UTC', 0, 5, 0, 0, 0)}
      ${'minutes'}      | ${new ZonedDateTime(2020, 1, 1, 'UTC', 0, 0, 5, 0, 0)}
      ${'seconds'}      | ${new ZonedDateTime(2020, 1, 1, 'UTC', 0, 0, 0, 5, 0)}
      ${'milliseconds'} | ${new ZonedDateTime(2020, 1, 1, 'UTC', 0, 0, 0, 0, 5)}
    `('should add $Unit', ({Unit, Expected}) => {
      let date = new ZonedDateTime(2020, 1, 1, 'UTC', 0, 0, 0, 0, 0);
      expect(date.add({[`${Unit}`]: 5})).toEqual(Expected);
    });
  });

  describe('subtract', function () {
    it.each`
      Unit              | Expected
      ${'years'}        | ${new ZonedDateTime(2015, 1, 1, 'UTC', 0, 5, 5, 5, 5)}
      ${'months'}       | ${new ZonedDateTime(2019, 8, 1, 'UTC', 0, 5, 5, 5, 5)}
      ${'weeks'}        | ${new ZonedDateTime(2019, 11, 27, 'UTC', 0, 5, 5, 5, 5)}
      ${'days'}         | ${new ZonedDateTime(2019, 12, 27, 'UTC', 0,  5, 5, 5, 5)}
      ${'hours'}        | ${new ZonedDateTime(2020, 1, 1, 'UTC', 0, 0, 5, 5, 5)}
      ${'hours'}        | ${new ZonedDateTime(2020, 1, 1, 'UTC', 0, 0, 5, 5, 5)}
      ${'minutes'}      | ${new ZonedDateTime(2020, 1, 1, 'UTC', 0, 5, 0, 5, 5)}
      ${'seconds'}      | ${new ZonedDateTime(2020, 1, 1, 'UTC', 0, 5, 5, 0, 5)}
      ${'milliseconds'} | ${new ZonedDateTime(2020, 1, 1, 'UTC', 0, 5, 5, 5, 0)}
    `('should subtract $Unit', ({Unit, Expected}) => {
      let date = new ZonedDateTime(2020, 1, 1, 'UTC', 0, 5, 5, 5, 5);
      expect(date.subtract({[`${Unit}`]: 5})).toEqual(Expected);
    });
  });
});
