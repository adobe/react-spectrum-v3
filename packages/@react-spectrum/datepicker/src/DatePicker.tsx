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

import {Calendar} from '@react-spectrum/calendar';
import CalendarIcon from '@spectrum-icons/workflow/Calendar';
import {classNames} from '@react-spectrum/utils';
import {Content} from '@react-spectrum/view';
import {DatePickerField} from './DatePickerField';
import datepickerStyles from './styles.css';
import {DateValue, SpectrumDatePickerProps} from '@react-types/datepicker';
import {Dialog, DialogTrigger} from '@react-spectrum/dialog';
import {Field} from '@react-spectrum/label';
import {FieldButton} from '@react-spectrum/button';
import {FocusableRef} from '@react-types/shared';
import {Input} from './Input';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {mergeProps} from '@react-aria/utils';
import React, {ReactElement, useRef} from 'react';
import '@adobe/spectrum-css-temp/components/textfield/vars.css'; // HACK: must be included BEFORE inputgroup
import styles from '@adobe/spectrum-css-temp/components/inputgroup/vars.css';
import {TimeField} from './TimeField';
import {useDatePicker} from '@react-aria/datepicker';
import {useDatePickerState} from '@react-stately/datepicker';
import {useFocusManagerRef, useFormatHelpText, useFormattedDateWidth, useVisibleMonths} from './utils';
import {useFocusRing} from '@react-aria/focus';
import {useFormProps} from '@react-spectrum/form';
import {useHover} from '@react-aria/interactions';
import {useLocale, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useProviderProps} from '@react-spectrum/provider';

/**
 * DatePickers combine a DateField and a Calendar popover to allow users to enter or select a date and time value.
 */
export const DatePicker = React.forwardRef(function DatePicker<T extends DateValue>(props: SpectrumDatePickerProps<T>, ref: FocusableRef<HTMLElement>) {
  props = useProviderProps(props);
  props = useFormProps(props);
  let {
    autoFocus,
    isQuiet,
    isDisabled,
    placeholderValue,
    maxVisibleMonths = 1,
    pageBehavior,
    firstDayOfWeek
  } = props;
  let {hoverProps, isHovered} = useHover({isDisabled});
  let targetRef = useRef<HTMLDivElement | null>(null);
  let state = useDatePickerState({
    ...props,
    shouldCloseOnSelect: () => !state.hasTime
  });
  let {groupProps, labelProps, fieldProps, descriptionProps, errorMessageProps, buttonProps, dialogProps, calendarProps, isInvalid, validationErrors, validationDetails} = useDatePicker(props, state, targetRef);
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

  let approximateWidth = useFormattedDateWidth(state) + 'ch';

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
        <Input
          isDisabled={isDisabled}
          isQuiet={isQuiet}
          validationState={validationState}
          className={classNames(styles, 'spectrum-InputGroup-field')}
          inputClassName={fieldClassName}
          disableFocusRing
          minWidth={approximateWidth}>
          <DatePickerField
            {...fieldProps}
            data-testid="date-field"
            isQuiet={isQuiet} />
        </Input>
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
                <Calendar
                  {...calendarProps}
                  visibleMonths={visibleMonths}
                  pageBehavior={pageBehavior}
                  firstDayOfWeek={firstDayOfWeek}
                  UNSAFE_className={classNames(datepickerStyles, 'react-spectrum-Datepicker-calendar', {'is-invalid': isInvalid})} />
                {showTimeField &&
                  <div className={classNames(datepickerStyles, 'react-spectrum-Datepicker-timeFields')}>
                    <TimeField
                      label={stringFormatter.format('time')}
                      value={state.timeValue}
                      onChange={state.setTimeValue}
                      placeholderValue={timePlaceholder}
                      granularity={timeGranularity}
                      minValue={timeMinValue}
                      maxValue={timeMaxValue}
                      hourCycle={props.hourCycle}
                      hideTimeZone={props.hideTimeZone}
                      marginTop="size-100" />
                  </div>
                }
              </div>
            </Content>
          </Dialog>
        </DialogTrigger>
      </div>
    </Field>
  );
}) as <T extends DateValue>(props: SpectrumDatePickerProps<T> & {ref?: FocusableRef<HTMLElement>}) => ReactElement;
