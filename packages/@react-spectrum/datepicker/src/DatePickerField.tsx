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

import {classNames} from '@react-spectrum/utils';
import {createCalendar} from '@internationalized/date';
import {DatePickerSegment} from './DatePickerSegment';
import datepickerStyles from './styles.css';
import {DateValue, SpectrumDatePickerProps} from '@react-types/datepicker';
import React, {ReactElement, useRef} from 'react';
import {useDateField} from '@react-aria/datepicker';
import {useDateFieldState} from '@react-stately/datepicker';
import {useLocale} from '@react-aria/i18n';

interface DatePickerFieldProps<T extends DateValue> extends SpectrumDatePickerProps<T> {
  inputClassName?: string,
  hideValidationIcon?: boolean,
  maxGranularity?: SpectrumDatePickerProps<T>['granularity']
}

export function DatePickerField<T extends DateValue>(props: DatePickerFieldProps<T>): ReactElement {
  let {
    isDisabled,
    isReadOnly,
    isRequired,
    inputClassName
  } = props;
  let ref = useRef<HTMLDivElement | null>(null);
  let {locale} = useLocale();
  let state = useDateFieldState({
    ...props,
    locale,
    createCalendar
  });

  let inputRef = useRef<HTMLInputElement | null>(null);
  let {fieldProps, inputProps} = useDateField({...props, inputRef}, state, ref);

  return (
    <span {...fieldProps} data-testid={props['data-testid']} className={classNames(datepickerStyles, 'react-spectrum-Datepicker-segments', inputClassName)} ref={ref}>
      {state.segments.map((segment, i) =>
        (<DatePickerSegment
          key={i}
          segment={segment}
          state={state}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={isRequired} />)
      )}
      <input {...inputProps} ref={inputRef} />
    </span>
  );
}
