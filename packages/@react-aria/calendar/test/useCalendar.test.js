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

import {act, pointerMap, render} from '@react-spectrum/test-utils-internal';
import {CalendarDate} from '@internationalized/date';
import {Custom454Calendar} from '@internationalized/date/tests/customCalendarImpl';
import {Example, ExampleCustomFirstDay} from '../stories/Example';
import {I18nProvider} from '@react-aria/i18n';
import React from 'react';
import userEvent from '@testing-library/user-event';

describe('useCalendar', () => {
  let user;
  beforeAll(() => {
    jest.useFakeTimers();
    user = userEvent.setup({delay: null, pointerMap});
  });

  afterEach(() => {
    // clear any live announcers
    act(() => {
      jest.runAllTimers();
    });
  });

  async function testKeyboard(defaultValue, beforeRange, key, count, value, afterRange, props, opts) {
    let {getByRole, getByLabelText, getAllByLabelText, unmount} = render(<Example defaultValue={defaultValue} autoFocus {...props} />);
    let grid = getByRole('grid');
    expect(grid).toHaveAttribute('aria-label', beforeRange);

    let cell = getAllByLabelText('selected', {exact: false}).filter(cell => cell.role !== 'grid')[0];
    expect(document.activeElement).toBe(cell);

    for (let i = 0; i < count; i++) {
      if (opts?.shiftKey) {
        await user.keyboard('{Shift>}');
      }

      await user.keyboard(`{${key}}`);

      if (opts?.shiftKey) {
        await user.keyboard('{/Shift}');
      }
    }

    cell = getByLabelText(value, {exact: false});
    expect(document.activeElement).toBe(cell);

    expect(grid).toHaveAttribute('aria-label', afterRange);

    // clear any live announcers
    act(() => {
      jest.runAllTimers();
    });

    unmount();
  }

  async function testFirstDayOfWeek(defaultValue, firstDayOfWeek, expectedFirstDay, locale = 'en-US') {
    let {getAllByRole, unmount} = render(
      <I18nProvider locale={locale}>
        <ExampleCustomFirstDay defaultValue={defaultValue} firstDayOfWeek={firstDayOfWeek} />
      </I18nProvider>
    );
    let cells = getAllByRole('gridcell');
    expect(cells[0].children[0]).toHaveAttribute('aria-label', expectedFirstDay);
    unmount();
  }

  describe('visibleDuration: 3 days', () => {
    it('should move the focused date by one day with the left/right arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'ArrowLeft', 1, 'Tuesday, June 4, 2019', 'June 4 to 6, 2019', {visibleDuration: {days: 3}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'ArrowLeft', 2, 'Monday, June 3, 2019', 'June 1 to 3, 2019', {visibleDuration: {days: 3}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'ArrowRight', 1, 'Thursday, June 6, 2019', 'June 4 to 6, 2019', {visibleDuration: {days: 3}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'ArrowRight', 2, 'Friday, June 7, 2019', 'June 7 to 9, 2019', {visibleDuration: {days: 3}});
    });

    it('should move the focused date by one row with the up/down arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'ArrowUp', 1, 'Sunday, June 2, 2019', 'June 1 to 3, 2019', {visibleDuration: {days: 3}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'ArrowDown', 1, 'Saturday, June 8, 2019', 'June 7 to 9, 2019', {visibleDuration: {days: 3}});
    });

    it('should move the focused date by one row with the page up/page down arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'PageUp', 1, 'Sunday, June 2, 2019', 'June 1 to 3, 2019', {visibleDuration: {days: 3}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'PageDown', 1, 'Saturday, June 8, 2019', 'June 7 to 9, 2019', {visibleDuration: {days: 3}});
    });

    it('should move the focused date by one row with the shift + page up/page down arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'PageUp', 1, 'Sunday, June 2, 2019', 'June 1 to 3, 2019', {visibleDuration: {days: 3}}, {shiftKey: true});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'PageDown', 1, 'Saturday, June 8, 2019', 'June 7 to 9, 2019', {visibleDuration: {days: 3}}, {shiftKey: true});
    });

    it('should move the focused date to the start/end of the visible range with the home/end keys', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'Home', 1, 'Tuesday, June 4, 2019', 'June 4 to 6, 2019', {visibleDuration: {days: 3}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 4 to 6, 2019', 'End', 1, 'Thursday, June 6, 2019', 'June 4 to 6, 2019', {visibleDuration: {days: 3}});
    });
  });

  describe('visibleDuration: 1 week', () => {
    it('should move the focused date by one day with the left/right arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'ArrowLeft', 1, 'Tuesday, June 4, 2019', 'June 2 to 8, 2019', {visibleDuration: {weeks: 1}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'ArrowLeft', 4, 'Saturday, June 1, 2019', 'May 26 to June 1, 2019', {visibleDuration: {weeks: 1}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'ArrowRight', 1, 'Thursday, June 6, 2019', 'June 2 to 8, 2019', {visibleDuration: {weeks: 1}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'ArrowRight', 4, 'Sunday, June 9, 2019', 'June 9 to 15, 2019', {visibleDuration: {weeks: 1}});
    });

    it('should move the focused date by one week with the up/down arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'ArrowUp', 1, 'Wednesday, May 29, 2019', 'May 26 to June 1, 2019', {visibleDuration: {weeks: 1}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'ArrowDown', 1, 'Wednesday, June 12, 2019', 'June 9 to 15, 2019', {visibleDuration: {weeks: 1}});
    });

    it('should move the focused date by one week with the page up/page down arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'PageUp', 1, 'Wednesday, May 29, 2019', 'May 26 to June 1, 2019', {visibleDuration: {weeks: 1}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'PageDown', 1, 'Wednesday, June 12, 2019', 'June 9 to 15, 2019', {visibleDuration: {weeks: 1}});
    });

    it('should move the focused date by one month with the shift + page up/page down arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'PageUp', 1, 'Sunday, May 5, 2019', 'May 5 to 11, 2019', {visibleDuration: {weeks: 1}}, {shiftKey: true});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'PageDown', 1, 'Friday, July 5, 2019', 'June 30 to July 6, 2019', {visibleDuration: {weeks: 1}}, {shiftKey: true});
    });

    it('should move the focused date to the start/end of the week with the home/end keys', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'Home', 1, 'Sunday, June 2, 2019', 'June 2 to 8, 2019', {visibleDuration: {weeks: 1}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 8, 2019', 'End', 1, 'Saturday, June 8, 2019', 'June 2 to 8, 2019', {visibleDuration: {weeks: 1}});
    });
  });

  describe('visibleDuration: 2 weeks', () => {
    it('should move the focused date by one day with the left/right arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'ArrowLeft', 1, 'Tuesday, June 4, 2019', 'June 2 to 15, 2019', {visibleDuration: {weeks: 2}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'ArrowLeft', 4, 'Saturday, June 1, 2019', 'May 19 to June 1, 2019', {visibleDuration: {weeks: 2}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'ArrowRight', 1, 'Thursday, June 6, 2019', 'June 2 to 15, 2019', {visibleDuration: {weeks: 2}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'ArrowRight', 4, 'Sunday, June 9, 2019', 'June 2 to 15, 2019', {visibleDuration: {weeks: 2}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'ArrowRight', 11, 'Sunday, June 16, 2019', 'June 16 to 29, 2019', {visibleDuration: {weeks: 2}});
    });

    it('should move the focused date by one week with the up/down arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'ArrowUp', 1, 'Wednesday, May 29, 2019', 'May 19 to June 1, 2019', {visibleDuration: {weeks: 2}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'ArrowDown', 1, 'Wednesday, June 12, 2019', 'June 2 to 15, 2019', {visibleDuration: {weeks: 2}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'ArrowDown', 2, 'Wednesday, June 19, 2019', 'June 16 to 29, 2019', {visibleDuration: {weeks: 2}});
    });

    it('should move the focused date by one week with the page up/page down arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'PageUp', 1, 'Wednesday, May 29, 2019', 'May 19 to June 1, 2019', {visibleDuration: {weeks: 2}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'PageDown', 1, 'Wednesday, June 12, 2019', 'June 2 to 15, 2019', {visibleDuration: {weeks: 2}});
    });

    it('should move the focused date by one month with the shift + page up/page down arrows', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'PageUp', 1, 'Sunday, May 5, 2019', 'April 28 to May 11, 2019', {visibleDuration: {weeks: 2}}, {shiftKey: true});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'PageDown', 1, 'Friday, July 5, 2019', 'June 30 to July 13, 2019', {visibleDuration: {weeks: 2}}, {shiftKey: true});
    });

    it('should move the focused date to the start/end of the visible range with the home/end keys', async () => {
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'Home', 1, 'Sunday, June 2, 2019', 'June 2 to 15, 2019', {visibleDuration: {weeks: 2}});
      await testKeyboard(new CalendarDate(2019, 6, 5), 'June 2 to 15, 2019', 'End', 1, 'Saturday, June 8, 2019', 'June 2 to 15, 2019', {visibleDuration: {weeks: 2}});
    });
  });

  async function testPagination(defaultValue, rangeBefore, rangeAfter, rel, count,  visibleDuration, pageBehavior) {
    let {getByTestId, getByLabelText, unmount} = render(<Example defaultValue={defaultValue} autoFocus visibleDuration={visibleDuration} pageBehavior={pageBehavior} />);
    let grid = getByTestId('range');
    expect(grid).toHaveTextContent(rangeBefore);
    let btn = getByLabelText(rel);

    for (let i = 0; i < count; i++) {
      await user.click(btn);
    }

    expect(grid).toHaveTextContent(rangeAfter);
    unmount();
  }

  describe('pagination', () => {
    it.each`
      Name | defaultValue | rangeBefore | rangeAfter | rel | count | visibleDuration
      ${'going forward one'} | ${new CalendarDate(2019, 1, 1)} | ${'January to February 2019'} | ${'March to April 2019'} | ${'Next'} | ${1} | ${{months: 2}}
      ${'going forward two'} | ${new CalendarDate(2019, 1, 1)} | ${'January to February 2019'} | ${'May to June 2019'} | ${'Next'} | ${2} | ${{months: 2}}
      ${'going backward one'} | ${new CalendarDate(2019, 1, 1)} | ${'January to February 2019'} | ${'November to December 2018'} | ${'Previous'} | ${1} | ${{months: 2}}
      ${'going backward two'} | ${new CalendarDate(2019, 1, 1)} | ${'January to February 2019'} | ${'September to October 2018'} | ${'Previous'} | ${2} | ${{months: 2}}
      `('should use visible as default value $Name', async ({defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration}) => {
        await testPagination(defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration);
      });

    it.each`
      Name | defaultValue | rangeBefore | rangeAfter | rel | count | visibleDuration | pageBehavior
      ${'going forward one'} | ${new CalendarDate(2019, 1, 1)} | ${'January to February 2019'} | ${'February to March 2019'} | ${'Next'} | ${1} | ${{months: 2}} | ${'single'}
      ${'going forward two'} | ${new CalendarDate(2019, 1, 1)} | ${'January to February 2019'} | ${'March to April 2019'} | ${'Next'} | ${2} | ${{months: 2}} | ${'single'}
      ${'going backward one'} | ${new CalendarDate(2019, 1, 1)} | ${'January to February 2019'} | ${'December 2018 to January 2019'} | ${'Previous'} | ${1} | ${{months: 2}} | ${'single'}
      ${'going backward two'} | ${new CalendarDate(2019, 1, 1)} | ${'January to February 2019'} | ${'November to December 2018'} | ${'Previous'} | ${2} | ${{months: 2}} | ${'single'}
      `('should use pageBehavior single $Name', async ({defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration, pageBehavior}) => {
        await testPagination(defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration, pageBehavior);
      });

    it.each`
    Name | defaultValue | rangeBefore | rangeAfter | rel | count | visibleDuration
    ${'week going forward one'} | ${new CalendarDate(2019, 1, 1)} | ${'December 23, 2018 to January 12, 2019'} | ${'January 13 to February 2, 2019'} | ${'Next'} | ${1} | ${{weeks: 3}}
    ${'week going forward two'} | ${new CalendarDate(2019, 1, 1)} | ${'December 23, 2018 to January 12, 2019'} | ${'February 3 to 23, 2019'} | ${'Next'} | ${2} | ${{weeks: 3}}
    ${'week going backward one'} | ${new CalendarDate(2019, 1, 1)} | ${'December 23, 2018 to January 12, 2019'} | ${'December 2 to 22, 2018'} | ${'Previous'} | ${1} | ${{weeks: 3}}
    ${'week going backward two'} | ${new CalendarDate(2019, 1, 1)} | ${'December 23, 2018 to January 12, 2019'} | ${'November 11 to December 1, 2018'} | ${'Previous'} | ${2} | ${{weeks: 3}}
    `('should use visible as default $Name', async ({defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration, pageBehavior}) => {
      await testPagination(defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration, pageBehavior);
    });

    it.each`
    Name | defaultValue | rangeBefore | rangeAfter | rel | count | visibleDuration | pageBehavior
    ${'week going forward one'} | ${new CalendarDate(2019, 1, 1)} | ${'December 23, 2018 to January 12, 2019'} | ${'December 30, 2018 to January 19, 2019'} | ${'Next'} | ${1} | ${{weeks: 3}} | ${'single'}
    ${'week going forward four'} | ${new CalendarDate(2019, 1, 1)} | ${'December 23, 2018 to January 12, 2019'} | ${'January 20 to February 9, 2019'} | ${'Next'} | ${4} | ${{weeks: 3}} | ${'single'}
    ${'week going backward one'} | ${new CalendarDate(2019, 1, 1)} | ${'December 23, 2018 to January 12, 2019'} | ${'December 16, 2018 to January 5, 2019'} | ${'Previous'} | ${1} | ${{weeks: 3}} | ${'single'}
    ${'week going backward four'} | ${new CalendarDate(2019, 1, 1)} | ${'December 23, 2018 to January 12, 2019'} | ${'November 25 to December 15, 2018'} | ${'Previous'} | ${4} | ${{weeks: 3}} | ${'single'}
    `('should use pageBehavior single $Name', async ({defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration, pageBehavior}) => {
      await testPagination(defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration, pageBehavior);
    });

    it.each`
    Name | defaultValue | rangeBefore | rangeAfter | rel | count | visibleDuration
    ${'day going forward one'} | ${new CalendarDate(2019, 1, 1)} | ${'December 30, 2018 to January 3, 2019'} | ${'January 4 to 8, 2019'} | ${'Next'} | ${1} | ${{days: 5}}
    ${'day going forward two'} | ${new CalendarDate(2019, 1, 1)} | ${'December 30, 2018 to January 3, 2019'} | ${'January 9 to 13, 2019'} | ${'Next'} | ${2} | ${{days: 5}}
    ${'day going backward one'} | ${new CalendarDate(2019, 1, 1)} | ${'December 30, 2018 to January 3, 2019'} | ${'December 25 to 29, 2018'} | ${'Previous'} | ${1} | ${{days: 5}}
    ${'day going backward two'} | ${new CalendarDate(2019, 1, 1)} | ${'December 30, 2018 to January 3, 2019'} | ${'December 20 to 24, 2018'} | ${'Previous'} | ${2} | ${{days: 5}}
    `('should use visible as default $Name', async ({defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration, pageBehavior}) => {
      await testPagination(defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration, pageBehavior);
    });

    it.each`
    Name | defaultValue | rangeBefore | rangeAfter | rel | count | visibleDuration | pageBehavior
    ${'day going forward one'} | ${new CalendarDate(2019, 1, 1)} | ${'December 30, 2018 to January 3, 2019'} | ${'December 31, 2018 to January 4, 2019'} | ${'Next'} | ${1} | ${{days: 5}} | ${'single'}
    ${'day going forward five'} | ${new CalendarDate(2019, 1, 1)} | ${'December 30, 2018 to January 3, 2019'} | ${'January 3 to 7, 2019'} | ${'Next'} | ${4} | ${{days: 5}} | ${'single'}
    ${'day going backward one'} | ${new CalendarDate(2019, 1, 1)} | ${'December 30, 2018 to January 3, 2019'} | ${'December 29, 2018 to January 2, 2019'} | ${'Previous'} | ${1} | ${{days: 5}} | ${'single'}
    ${'day going backward five'} | ${new CalendarDate(2019, 1, 1)} | ${'December 30, 2018 to January 3, 2019'} | ${'December 26 to 30, 2018'} | ${'Previous'} | ${4} | ${{days: 5}} | ${'single'}
    `('should use pageBehavior single $Name', async ({defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration, pageBehavior}) => {
      await testPagination(defaultValue, rangeBefore, rangeAfter, rel, count, visibleDuration, pageBehavior);
    });
  });

  describe('firstDayOfWeek', () => {
    it.each`
    Name | defaultValue | firstDayOfWeek | expectedFirstDay | locale
    ${'default'} | ${new CalendarDate(2024, 1, 1)} | ${undefined} | ${'Sunday, December 31, 2023'} | ${'en-US'}
    ${'Sunday'} | ${new CalendarDate(2024, 1, 1)} | ${'sun'} | ${'Sunday, December 31, 2023'} | ${'en-US'}
    ${'Monday'} | ${new CalendarDate(2024, 1, 1)} | ${'mon'} | ${'Monday, January 1, 2024 selected'} | ${'en-US'}
    ${'Tuesday'} | ${new CalendarDate(2024, 1, 1)} | ${'tue'} | ${'Tuesday, December 26, 2023'} | ${'en-US'}
    ${'Wednesday'} | ${new CalendarDate(2024, 1, 1)} | ${'wed'} | ${'Wednesday, December 27, 2023'} | ${'en-US'}
    ${'Thursday'} | ${new CalendarDate(2024, 1, 1)} | ${'thu'} | ${'Thursday, December 28, 2023'} | ${'en-US'}
    ${'Friday'} | ${new CalendarDate(2024, 1, 1)} | ${'fri'} | ${'Friday, December 29, 2023'} | ${'en-US'}
    ${'Saturday'} | ${new CalendarDate(2024, 1, 1)} | ${'sat'} | ${'Saturday, December 30, 2023'} | ${'en-US'}
    ${'default (fr-FR)'} | ${new CalendarDate(2024, 1, 1)} | ${undefined} | ${'lundi 1 janvier 2024 sélectionné'} | ${'fr-FR'}
    ${'Sunday (fr-FR)'} | ${new CalendarDate(2024, 1, 1)} | ${'sun'} | ${'dimanche 31 décembre 2023'} | ${'fr-FR'}
    ${'Monday (fr-FR)'} | ${new CalendarDate(2024, 1, 1)} | ${'mon'} | ${'lundi 1 janvier 2024 sélectionné'} | ${'fr-FR'}
    ${'Tuesday (fr-FR)'} | ${new CalendarDate(2024, 1, 1)} | ${'tue'} | ${'mardi 26 décembre 2023'} | ${'fr-FR'}
    ${'Wednesday (fr-FR)'} | ${new CalendarDate(2024, 1, 1)} | ${'wed'} | ${'mercredi 27 décembre 2023'} | ${'fr-FR'}
    ${'Thursday (fr-FR)'} | ${new CalendarDate(2024, 1, 1)} | ${'thu'} | ${'jeudi 28 décembre 2023'} | ${'fr-FR'}
    ${'Friday (fr-FR)'} | ${new CalendarDate(2024, 1, 1)} | ${'fri'} | ${'vendredi 29 décembre 2023'} | ${'fr-FR'}
    ${'Saturday (fr-FR)'} | ${new CalendarDate(2024, 1, 1)} | ${'sat'} | ${'samedi 30 décembre 2023'} | ${'fr-FR'}
    `('should use firstDayOfWeek $Name', async ({defaultValue, firstDayOfWeek, expectedFirstDay, locale}) => {
      await testFirstDayOfWeek(defaultValue, firstDayOfWeek, expectedFirstDay, locale);
    });
  });

  describe('custom calendar visible range description', () => {
    const calendar = new Custom454Calendar();

    // Selection alignment is "start", so we can start on the provided date and add x months to it
    it.each([
      {name: 'a single month', visibleDuration: {months: 1}, date: new CalendarDate(calendar, 2023, 10, 29), expected: 'November 2023'},
      {name: 'final month of the year', visibleDuration: {months: 1}, date: new CalendarDate(calendar, 2023, 12, 13), expected: 'December 2023'},
      {name: 'multiple months in same year', visibleDuration: {months: 3}, date: new CalendarDate(calendar, 2023, 7, 30), expected: 'August to October 2023'},
      {name: 'multiple months across years', visibleDuration: {months: 3}, date: new CalendarDate(calendar, 2023, 10, 29), expected: 'November 2023 to January 2024'}
    ])('should format the visible range for $name', async ({visibleDuration, date, expected}) => {
      const {getByTestId} = render(
        <I18nProvider locale="en-US">
          <Example createCalendar={() => calendar} focusedValue={date} visibleDuration={visibleDuration} selectionAlignment="start" />
        </I18nProvider>
      );
      expect(getByTestId('range')).toHaveTextContent(expected);
    });
  });
});
