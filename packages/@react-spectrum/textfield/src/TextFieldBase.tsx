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

import AlertMedium from '@spectrum-icons/ui/AlertMedium';
import CheckmarkMedium from '@spectrum-icons/ui/CheckmarkMedium';
import {classNames, createFocusableRef} from '@react-spectrum/utils';
import {Field} from '@react-spectrum/label';
import {mergeProps} from '@react-aria/utils';
import {PressEvents, RefObject, ValidationResult} from '@react-types/shared';
import React, {cloneElement, forwardRef, HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactElement, Ref, TextareaHTMLAttributes, useImperativeHandle, useRef} from 'react';
import {SpectrumTextFieldProps, TextFieldRef} from '@react-types/textfield';
import styles from '@adobe/spectrum-css-temp/components/textfield/vars.css';
import {useFocusRing} from '@react-aria/focus';
import {useHover} from '@react-aria/interactions';

interface TextFieldBaseProps extends Omit<SpectrumTextFieldProps, 'onChange' | 'validate'>, PressEvents, Partial<ValidationResult> {
  wrapperChildren?: ReactElement | ReactElement[],
  inputClassName?: string,
  validationIconClassName?: string,
  multiLine?: boolean,
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>,
  inputProps: InputHTMLAttributes<HTMLInputElement> | TextareaHTMLAttributes<HTMLTextAreaElement>,
  descriptionProps?: HTMLAttributes<HTMLElement>,
  errorMessageProps?: HTMLAttributes<HTMLElement>,
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  loadingIndicator?: ReactElement,
  isLoading?: boolean,
  disableFocusRing?: boolean
}

export const TextFieldBase = forwardRef(function TextFieldBase(props: TextFieldBaseProps, ref: Ref<TextFieldRef<HTMLInputElement | HTMLTextAreaElement>>) {
  let {
    validationState = props.isInvalid ? 'invalid' : null,
    icon,
    isQuiet = false,
    isDisabled,
    multiLine,
    autoFocus,
    inputClassName,
    wrapperChildren,
    labelProps,
    inputProps,
    descriptionProps,
    errorMessageProps,
    inputRef: userInputRef,
    isLoading,
    loadingIndicator,
    validationIconClassName,
    disableFocusRing
  } = props;
  let {hoverProps, isHovered} = useHover({isDisabled});
  let domRef = useRef<HTMLDivElement>(null);
  let defaultInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  let inputRef = userInputRef || defaultInputRef;

  // Expose imperative interface for ref
  useImperativeHandle(ref, () => ({
    ...createFocusableRef(domRef, inputRef),
    select() {
      if (inputRef.current) {
        inputRef.current.select();
      }
    },
    getInputElement() {
      return inputRef.current;
    }
  }));

  let ElementType: React.ElementType = multiLine ? 'textarea' : 'input';
  let isInvalid = validationState === 'invalid' && !isDisabled;

  if (icon) {
    let UNSAFE_className = classNames(
      styles,
      icon.props && (icon.props as any).UNSAFE_className,
      'spectrum-Textfield-icon'
    );

    icon = cloneElement(icon, {
      UNSAFE_className,
      size: 'S'
    } as any);
  }

  let validationIcon = isInvalid ? <AlertMedium /> : <CheckmarkMedium />;
  let validation = cloneElement(validationIcon, {
    UNSAFE_className: classNames(
      styles,
      'spectrum-Textfield-validationIcon',
      validationIconClassName
    )
  });

  let {focusProps, isFocusVisible} = useFocusRing({
    autoFocus
  });

  let textField = (
    <div
      className={
        classNames(
          styles,
          'spectrum-Textfield',
          {
            'spectrum-Textfield--invalid': isInvalid,
            'spectrum-Textfield--valid': validationState === 'valid' && !isDisabled,
            'spectrum-Textfield--loadable': loadingIndicator,
            'spectrum-Textfield--quiet': isQuiet,
            'spectrum-Textfield--multiline': multiLine,
            'focus-ring': !disableFocusRing && isFocusVisible
          }
        )
      }>
      <ElementType
        {...mergeProps(inputProps, hoverProps, focusProps)}
        ref={inputRef as any}
        rows={multiLine ? 1 : undefined}
        className={
          classNames(
            styles,
            'spectrum-Textfield-input',
            {
              'spectrum-Textfield-inputIcon': icon,
              'is-hovered': isHovered
            },
            inputClassName
          )
        } />
      {icon}
      {validationState && !isLoading && !isDisabled ? validation : null}
      {isLoading && loadingIndicator}
      {wrapperChildren}
    </div>
  );

  return (
    <Field
      {...props}
      labelProps={labelProps}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      wrapperClassName={
        classNames(
          styles,
          'spectrum-Textfield-wrapper',
          {
            'spectrum-Textfield-wrapper--quiet': isQuiet
          }
        )
      }
      showErrorIcon={false}
      ref={domRef}>
      {textField}
    </Field>
  );
});
