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

import CalendarIcon from '@spectrum-icons/workflow/Calendar';
import {classNames} from '@react-spectrum/utils';
import {Content} from '@react-spectrum/view';
import {DatePickerField} from './DatePickerField';
import datepickerStyles from './styles.css';
import {DateValue, SpectrumDateRangePickerProps} from '@react-types/datepicker';
import {Dialog, DialogTrigger} from '@react-spectrum/dialog';
import {Field} from '@react-spectrum/label';
import {FieldButton} from '@react-spectrum/button';
import {Flex} from '@react-spectrum/layout';
import {FocusableRef} from '@react-types/shared';
import {Input} from './Input';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {mergeProps} from '@react-aria/utils';
import {RangeCalendar} from '@react-spectrum/calendar';
import React, {ReactElement, useRef} from 'react';
import styles from '@adobe/spectrum-css-temp/components/inputgroup/vars.css';
import {TimeField} from './TimeField';
import {useDateRangePicker} from '@react-aria/datepicker';
import {useDateRangePickerState} from '@react-stately/datepicker';
import {useFocusManagerRef, useFormatHelpText, useFormattedDateWidth, useVisibleMonths} from './utils';
import {useFocusRing} from '@react-aria/focus';
import {useFormProps} from '@react-spectrum/form';
import {useHover} from '@react-aria/interactions';
import {useLocale, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useProviderProps} from '@react-spectrum/provider';

/**
 * DateRangePickers combine two DateFields and a RangeCalendar popover to allow users
 * to enter or select a date and time range.
 */
export const DateRangePicker = React.forwardRef(function DateRangePicker<T extends DateValue>(props: SpectrumDateRangePickerProps<T>, ref: FocusableRef<HTMLElement>) {
  props = useProviderProps(props);
  props = useFormProps(props);
  let {
    isQuiet,
    isDisabled,
    autoFocus,
    placeholderValue,
    maxVisibleMonths = 1,
    pageBehavior,
    firstDayOfWeek
  } = props;
  let {hoverProps, isHovered} = useHover({isDisabled});
  let targetRef = useRef<HTMLDivElement | null>(null);
  let state = useDateRangePickerState({
    ...props,
    shouldCloseOnSelect: () => !state.hasTime
  });
  let {labelProps, groupProps, buttonProps, dialogProps, startFieldProps, endFieldProps, descriptionProps, errorMessageProps, calendarProps, isInvalid, validationErrors, validationDetails} = useDateRangePicker(props, state, targetRef);
  let {isOpen, setOpen} = state;
  let {direction} = useLocale();
  let domRef = useFocusManagerRef(ref);
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/datepicker');

  let {isFocused, isFocusVisible, focusProps} = useFocusRing({
    within: true,
    autoFocus
  });

  let {isFocused: isFocusedButton, focusProps: focusPropsButton} = useFocusRing({
    within: false,
    autoFocus
  });

  let className = classNames(
    styles,
    'spectrum-InputGroup',
    {
      'spectrum-InputGroup--quiet': isQuiet,
      'spectrum-InputGroup--invalid': isInvalid && !isDisabled,
      'is-disabled': isDisabled,
      'is-hovered': isHovered,
      'is-focused': isFocused,
      'focus-ring': isFocusVisible && !isFocusedButton
    }
  );

  let fieldClassName = classNames(
    styles,
    'spectrum-InputGroup-input',
    {
      'is-disabled': isDisabled,
      'is-invalid': isInvalid && !isDisabled
    }
  );

  // Note: this description is intentionally not passed to useDatePicker.
  // The format help text is unnecessary for screen reader users because each segment already has a label.
  let description = useFormatHelpText(props);
  if (description && !props.description) {
    descriptionProps.id = undefined;
  }

  let placeholder: DateValue | null | undefined = placeholderValue;
  let timePlaceholder = placeholder && 'hour' in placeholder ? placeholder : null;
  let timeMinValue = props.minValue && 'hour' in props.minValue ? props.minValue : null;
  let timeMaxValue = props.maxValue && 'hour' in props.maxValue ? props.maxValue : null;
  let timeGranularity = state.granularity === 'hour' || state.granularity === 'minute' || state.granularity === 'second' ? state.granularity : null;
  let showTimeField = !!timeGranularity;

  let visibleMonths = useVisibleMonths(maxVisibleMonths);
  let validationState = state.validationState || (isInvalid ? 'invalid' : null);

  // Multiplying by two for the two dates, adding one character for the dash, and then the padding around the dash
  let approximateWidth = `calc(${useFormattedDateWidth(state) * 2 + 1}ch + 2 * var(--spectrum-global-dimension-size-100))`;

  return (
    <Field
      {...props}
      ref={domRef}
      elementType="span"
      description={description}
      labelProps={labelProps}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      validationState={validationState}
      isInvalid={isInvalid}
      validationErrors={validationErrors}
      validationDetails={validationDetails}
      wrapperClassName={classNames(datepickerStyles, 'react-spectrum-Datepicker-fieldWrapper')}>
      <div
        {...mergeProps(groupProps, hoverProps, focusProps)}
        className={className}
        ref={targetRef}>
        <div style={{overflow: 'hidden', width: '100%'}}>
          <Input
            isDisabled={isDisabled}
            isQuiet={isQuiet}
            validationState={validationState}
            className={classNames(styles, 'spectrum-InputGroup-field')}
            inputClassName={fieldClassName}
            disableFocusRing
            minWidth={approximateWidth}>
            <DatePickerField
              {...startFieldProps}
              data-testid="start-date"
              isQuiet={props.isQuiet}
              inputClassName={classNames(datepickerStyles, 'react-spectrum-Datepicker-startField')} />
            <DateRangeDash />
            <DatePickerField
              {...endFieldProps}
              data-testid="end-date"
              isQuiet={props.isQuiet}
              inputClassName={classNames(
                styles,
                'spectrum-Datepicker-endField',
                classNames(
                  datepickerStyles,
                  'react-spectrum-Datepicker-endField'
                )
              )} />
          </Input>
        </div>
        <DialogTrigger
          type="popover"
          mobileType="tray"
          placement={direction === 'rtl' ? 'bottom right' : 'bottom left'}
          targetRef={targetRef}
          hideArrow
          isOpen={isOpen}
          onOpenChange={setOpen}
          shouldFlip={props.shouldFlip}>
          <FieldButton
            {...mergeProps(buttonProps, focusPropsButton)}
            UNSAFE_className={classNames(styles, 'spectrum-FieldButton')}
            isQuiet={isQuiet}
            validationState={validationState}>
            <CalendarIcon />
          </FieldButton>
          <Dialog UNSAFE_className={classNames(datepickerStyles, 'react-spectrum-Datepicker-dialog')} {...dialogProps}>
            <Content>
              <div className={classNames(datepickerStyles, 'react-spectrum-Datepicker-dialogContent')}>
                <RangeCalendar
                  {...calendarProps}
                  visibleMonths={visibleMonths}
                  pageBehavior={pageBehavior}
                  firstDayOfWeek={firstDayOfWeek}
                  UNSAFE_className={classNames(datepickerStyles, 'react-spectrum-Datepicker-calendar', {'is-invalid': validationState === 'invalid'})} />
                {showTimeField &&
                  <Flex gap="size-100" marginTop="size-100" UNSAFE_className={classNames(datepickerStyles, 'react-spectrum-Datepicker-timeFields')}>
                    <TimeField
                      label={stringFormatter.format('startTime')}
                      value={state.timeRange?.start || null}
                      onChange={v => state.setTime('start', v)}
                      placeholderValue={timePlaceholder}
                      granularity={timeGranularity}
                      minValue={timeMinValue}
                      maxValue={timeMaxValue}
                      hourCycle={props.hourCycle}
                      hideTimeZone={props.hideTimeZone}
                      flex />
                    <TimeField
                      label={stringFormatter.format('endTime')}
                      value={state.timeRange?.end || null}
                      onChange={v => state.setTime('end', v)}
                      placeholderValue={timePlaceholder}
                      granularity={timeGranularity}
                      minValue={timeMinValue}
                      maxValue={timeMaxValue}
                      hourCycle={props.hourCycle}
                      hideTimeZone={props.hideTimeZone}
                      flex />
                  </Flex>
                }
              </div>
            </Content>
          </Dialog>
        </DialogTrigger>
      </div>
    </Field>
  );
}) as <T extends DateValue>(props: SpectrumDateRangePickerProps<T> & {ref?: FocusableRef<HTMLElement>}) => ReactElement;

function DateRangeDash() {
  return (
    <span
      aria-hidden="true"
      data-testid="date-range-dash"
      className={classNames(datepickerStyles, 'react-spectrum-Datepicker-rangeDash')} />
  );
}
