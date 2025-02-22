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

import {AriaButtonProps} from '@react-types/button';
import {classNames, useFocusableRef, useStyleProps} from '@react-spectrum/utils';
import {Field} from '@react-spectrum/label';
import {FocusableRef, RefObject} from '@react-types/shared';
import {FocusRing} from '@react-aria/focus';
import {mergeProps} from '@react-aria/utils';
import {NumberFieldState, useNumberFieldState} from '@react-stately/numberfield';
import React, {HTMLAttributes, InputHTMLAttributes, Ref, useRef} from 'react';
import {SpectrumNumberFieldProps} from '@react-types/numberfield';
import {StepButton} from './StepButton';
import stepperStyle from '@adobe/spectrum-css-temp/components/stepper/vars.css';
import {TextFieldBase} from '@react-spectrum/textfield';
import {useFormProps} from '@react-spectrum/form';
import {useHover} from '@react-aria/interactions';
import {useLocale} from '@react-aria/i18n';
import {useNumberField} from '@react-aria/numberfield';
import {useProvider, useProviderProps} from '@react-spectrum/provider';

/**
 * NumberFields allow users to enter a number, and increment or decrement the value using stepper buttons.
 */
export const NumberField = React.forwardRef(function NumberField(props: SpectrumNumberFieldProps, ref: FocusableRef<HTMLElement>) {
  props = useProviderProps(props);
  props = useFormProps(props);
  let provider = useProvider();
  let {
    isQuiet,
    isReadOnly,
    isDisabled,
    hideStepper
  } = props;

  let {styleProps: style} = useStyleProps(props);

  let {locale} = useLocale();
  let state = useNumberFieldState({...props, locale});
  let inputRef = useRef<HTMLInputElement>(null);
  let domRef = useFocusableRef<HTMLElement>(ref, inputRef);
  let {
    groupProps,
    labelProps,
    inputProps,
    incrementButtonProps,
    decrementButtonProps,
    descriptionProps,
    errorMessageProps,
    isInvalid,
    validationErrors,
    validationDetails
  } = useNumberField(props, state, inputRef);
  let isMobile = provider.scale === 'large';
  let showStepper = !hideStepper;

  let {isHovered, hoverProps} = useHover({isDisabled});

  let validationState = props.validationState || (isInvalid ? 'invalid' : undefined);
  let className =
    classNames(
      stepperStyle,
      'spectrum-Stepper',
      // because FocusRing won't pass along the className from Field, we have to handle that ourselves
      !props.label && style.className ? style.className : '',
      {
        'spectrum-Stepper--isQuiet': isQuiet,
        'is-disabled': isDisabled,
        'spectrum-Stepper--readonly': isReadOnly,
        'is-invalid': validationState === 'invalid' && !isDisabled,
        'spectrum-Stepper--showStepper': showStepper,
        'spectrum-Stepper--isMobile': isMobile,
        'is-hovered': isHovered
      }
    );

  return (
    <Field
      {...props as Omit<SpectrumNumberFieldProps, 'onChange'>}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      isInvalid={isInvalid}
      validationErrors={validationErrors}
      validationDetails={validationDetails}
      labelProps={labelProps}
      ref={domRef}
      wrapperClassName={classNames(
        stepperStyle,
        'spectrum-Stepper-container',
        {
          'spectrum-Stepper-container--isMobile': isMobile
        }
      )}>
      <NumberFieldInput
        {...props}
        groupProps={mergeProps(groupProps, hoverProps)}
        inputProps={inputProps}
        inputRef={inputRef}
        incrementProps={incrementButtonProps}
        decrementProps={decrementButtonProps}
        className={className}
        style={style}
        state={state}
        validationState={validationState} />
    </Field>
  );
});


interface NumberFieldInputProps extends SpectrumNumberFieldProps {
  groupProps: HTMLAttributes<HTMLDivElement>,
  inputProps: InputHTMLAttributes<HTMLInputElement>,
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  incrementProps: AriaButtonProps,
  decrementProps: AriaButtonProps,
  className?: string,
  style?: React.CSSProperties,
  state: NumberFieldState
}

const NumberFieldInput = React.forwardRef(function NumberFieldInput(props: NumberFieldInputProps, ref: Ref<HTMLDivElement>) {
  let {
    groupProps,
    inputProps,
    inputRef,
    incrementProps,
    decrementProps,
    className,
    style,
    autoFocus,
    isQuiet,
    isDisabled,
    hideStepper,
    validationState,
    name,
    state
  } = props;
  let showStepper = !hideStepper;

  return (
    <FocusRing
      within
      focusClass={classNames(stepperStyle, 'is-focused')}
      focusRingClass={classNames(stepperStyle, 'focus-ring')}
      autoFocus={autoFocus}>
      <div
        {...groupProps}
        ref={ref}
        style={style}
        className={className}>
        <TextFieldBase
          UNSAFE_className={
            classNames(
              stepperStyle,
              'spectrum-Stepper-field'
            )
          }
          inputClassName={
            classNames(
              stepperStyle,
              'spectrum-Stepper-input'
            )
          }
          validationIconClassName={
            classNames(
              stepperStyle,
              'spectrum-Stepper-icon'
            )
          }
          isQuiet={isQuiet}
          inputRef={inputRef}
          validationState={validationState}
          inputProps={inputProps}
          isDisabled={isDisabled}
          disableFocusRing />
        {showStepper &&
        <>
          <StepButton direction="up" isQuiet={isQuiet} {...incrementProps} />
          <StepButton direction="down" isQuiet={isQuiet} {...decrementProps} />
        </>
        }
        {name && <input type="hidden" name={name} value={isNaN(state.numberValue) ? '' : state.numberValue} />}
      </div>
    </FocusRing>
  );
});
