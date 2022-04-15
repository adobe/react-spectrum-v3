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

import {CalendarBase} from './CalendarBase';
import {createCalendar} from '@internationalized/date';
import {createDOMRef} from '@react-spectrum/utils';
import {DateValue, SpectrumCalendarProps} from '@react-types/calendar';
import {FocusableRef} from '@react-types/shared';
import React, {ReactElement, useImperativeHandle, useMemo, useRef} from 'react';
import {useCalendar} from '@react-aria/calendar';
import {useCalendarState} from '@react-stately/calendar';
import {useLocale} from '@react-aria/i18n';

function Calendar<T extends DateValue>(props: SpectrumCalendarProps<T>, ref: FocusableRef<HTMLElement>) {
  let {visibleMonths = 1} = props;
  let visibleDuration = useMemo(() => ({months: visibleMonths}), [visibleMonths]);
  let {locale} = useLocale();
  let state = useCalendarState({
    ...props,
    locale,
    visibleDuration,
    createCalendar
  });

  let domRef = useRef();
  useImperativeHandle(ref, () => ({
    ...createDOMRef(domRef),
    focus() {
      state.setFocused(true);
    }
  }));

  let {calendarProps, prevButtonProps, nextButtonProps, errorMessageProps} = useCalendar(props, state);

  return (
    <CalendarBase
      {...props}
      state={state}
      calendarRef={domRef}
      calendarProps={calendarProps}
      prevButtonProps={prevButtonProps}
      nextButtonProps={nextButtonProps}
      errorMessageProps={errorMessageProps} />
  );
}

/**
 * Calendars display a grid of days in one or more months and allow users to select a single date.
 */
const _Calendar = React.forwardRef(Calendar) as <T extends DateValue>(props: SpectrumCalendarProps<T> & {ref?: FocusableRef<HTMLElement>}) => ReactElement;
export {_Calendar as Calendar};
