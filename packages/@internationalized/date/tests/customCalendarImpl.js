import {add} from '../src/manipulation';
import {CalendarDate, createCalendar} from '../src';
import {compareDate, endOfWeek, startOfWeek} from '../src/queries';

export class Custom454Calendar {
  identifier = 'custom-454';
  #anchorDate;
  #gregCalendar;

  constructor() {
    this.#gregCalendar = createCalendar('gregory');
    this.#anchorDate = new CalendarDate(this, 2001, 2, 4);
  }

  fromJulianDay(jd) {
    return this.#gregCalendar.fromJulianDay(jd);
  }
  toJulianDay(date) {
    return this.#gregCalendar.toJulianDay(date);
  }
  getDaysInMonth(date) {
    return this.#gregCalendar.getDaysInMonth(date);
  }
  getMonthsInYear() {
    return this.#gregCalendar.getMonthsInYear();
  }
  getYearsInEra(date) {
    return this.#gregCalendar.getYearsInEra(date);
  }
  getEras() {
    return this.#gregCalendar.getEras();
  }
  getWeeksInMonth(date) {
    const dateMonth = this.getCurrentMonth(date);
    const weekPattern = this.#getWeekPattern(this.#getCurrentYear(date).isBigYear);
    return weekPattern[dateMonth.index - 1];
  }
  isSamePeriod(a, b, span) {
    switch (span) {
      case 'month':
        return this.getCurrentMonth(a).index === this.getCurrentMonth(b).index;
      case 'year':
        return this.#getCurrentYear(a).start.year === this.#getCurrentYear(b).start.year;
      case 'week': {
        let weekA = this.#getCurrentWeek(a);
        let weekB = this.#getCurrentWeek(b);
        return weekA.start.compare(weekB.start) === 0;    
      }
      default:
        return a.day === b.day && a.month === b.month && a.year === b.year;
    }
  }
  getCurrentMonth(date) {
    const yearRange = this.#getCurrentYear(date);
    const months = this.#getWeekPattern(yearRange.isBigYear);
    let pointer = yearRange.start;
    
    for (let k = 1; k <= months.length; k++) {
      const weeksInMonth = months[k % months.length];
      const end = pointer.add({weeks: weeksInMonth});
      if (this.toJulianDay(date) < this.toJulianDay(end)) {
        return {
          start: pointer,
          end: end.subtract({days: 1}),
          index: (k % months.length) + 1,
          isBigYear: yearRange.isBigYear
        };
      }
      pointer = end;
    }

    throw Error('Date is not in any month somehow');
  }
  #getWeekPattern(isBigYear) {
    // Retail calendars begin in Feb, but we index months with Jan as month 1, so we shift the week pattern by 1.
    return isBigYear ? [5, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5] : [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5];
  }
  #getCurrentYear(date) {
    const getStartOfWeek = (currentDate) => this.#getCurrentWeek(currentDate).start;
    let currentAnchor = this.#anchorDate.copy();
    currentAnchor.year = date.year + 1;
    
    while (compareDate(date, getStartOfWeek(currentAnchor)) < 0) {
      currentAnchor.year -= 1;
    }

    const startOfYear = getStartOfWeek(currentAnchor);
    const isBigYear = !startOfYear.add({weeks: 53}).compare(add(currentAnchor, {years: 1}));
    return {
      isBigYear,
      start: startOfYear.copy(),
      end: startOfYear.add({weeks: isBigYear ? 53 : 52, days: -1})
    };
  }
  #getCurrentWeek(date) {
    return {
      start: startOfWeek(date, 'en', 'sun'),
      end: endOfWeek(date, 'en', 'sun')
    };
  }
}
