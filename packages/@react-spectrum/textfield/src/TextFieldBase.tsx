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
import {
  classNames,
  createFocusableRef,
  useStyleProps
} from '@react-spectrum/utils';
import {FocusRing} from '@react-aria/focus';
import {Label} from '@react-spectrum/label';
import {LabelPosition, PressEvents} from '@react-types/shared';
import labelStyles from '@adobe/spectrum-css-temp/components/fieldlabel/vars.css';
import {mergeProps} from '@react-aria/utils';
import React, {cloneElement, forwardRef, InputHTMLAttributes, LabelHTMLAttributes, ReactElement, Ref, RefObject, TextareaHTMLAttributes, useImperativeHandle, useRef} from 'react';
import {SpectrumTextFieldProps, TextFieldRef} from '@react-types/textfield';
import styles from '@adobe/spectrum-css-temp/components/textfield/vars.css';
import {useFormProps} from '@react-spectrum/form';
import {useHover} from '@react-aria/interactions';
import {useProviderProps} from '@react-spectrum/provider';

interface TextFieldBaseProps extends SpectrumTextFieldProps, PressEvents {
  wrapperChildren?: ReactElement | ReactElement[],
  inputClassName?: string,
  validationIconClassName?: string,
  multiLine?: boolean,
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>,
  inputProps: InputHTMLAttributes<HTMLInputElement> | TextareaHTMLAttributes<HTMLTextAreaElement>,
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement>,
  loadingIndicator?: ReactElement,
  isLoading?: boolean
}

function TextFieldBase(props: TextFieldBaseProps, ref: Ref<TextFieldRef>) {
  props = useProviderProps(props);
  props = useFormProps(props);
  let {
    label,
    labelPosition = 'top' as LabelPosition,
    labelAlign,
    isRequired,
    necessityIndicator,
    validationState,
    icon,
    isQuiet = false,
    isDisabled,
    multiLine,
    autoFocus,
    inputClassName,
    wrapperChildren,
    labelProps,
    inputProps,
    inputRef,
    isLoading,
    loadingIndicator,
    validationIconClassName,
    ...otherProps
  } = props;
  let {hoverProps, isHovered} = useHover({isDisabled});
  let domRef = useRef<HTMLDivElement>(null);
  let defaultInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  inputRef = inputRef || defaultInputRef;

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

  let {styleProps} = useStyleProps(otherProps);
  let ElementType: React.ElementType = multiLine ? 'textarea' : 'input';
  let isInvalid = validationState === 'invalid';

  if (icon) {
    let UNSAFE_className = classNames(
      styles,
      icon.props && icon.props.UNSAFE_className,
      'spectrum-Textfield-icon'
    );

    icon = cloneElement(icon, {
      UNSAFE_className,
      size: 'S'
    });
  }

  let validationIcon = isInvalid ? <AlertMedium /> : <CheckmarkMedium />;
  let validation = cloneElement(validationIcon, {
    UNSAFE_className: classNames(
      styles,
      'spectrum-Textfield-validationIcon',
      validationIconClassName
    )
  });

  let textField = (
    <div
      className={
        classNames(
          styles,
          'spectrum-Textfield',
          {
            'spectrum-Textfield--invalid': isInvalid,
            'spectrum-Textfield--valid': validationState === 'valid',
            'spectrum-Textfield--loadable': loadingIndicator,
            'spectrum-Textfield--quiet': isQuiet,
            'spectrum-Textfield--multiline': multiLine
          }
        )
      }>
      <FocusRing focusRingClass={classNames(styles, 'focus-ring')} isTextInput autoFocus={autoFocus}>
        <ElementType
          {...mergeProps(inputProps, hoverProps)}
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
      </FocusRing>
      {icon}
      {validationState && !isLoading ? validation : null}
      {isLoading && loadingIndicator}
      {wrapperChildren}
    </div>
  );

  if (label) {
    let labelWrapperClass = classNames(
      labelStyles,
      'spectrum-Field',
      {
        'spectrum-Field--positionTop': labelPosition === 'top',
        'spectrum-Field--positionSide': labelPosition === 'side'
      },
      styleProps.className
    );

    textField = React.cloneElement(textField, mergeProps(textField.props, {
      className: classNames(
        labelStyles,
        'spectrum-Field-field',
        {
          'spectrum-Field-field--multiline': multiLine
        }
      )
    }));

    return (
      <div
        {...styleProps}
        ref={domRef}
        className={labelWrapperClass}>
        <Label
          {...labelProps}
          isQuiet={isQuiet}
          labelPosition={labelPosition}
          labelAlign={labelAlign}
          isRequired={isRequired}
          necessityIndicator={necessityIndicator}>
          {label}
        </Label>
        {textField}
      </div>
    );
  }

  return React.cloneElement(textField, mergeProps(textField.props, {
    ...styleProps,
    ref: domRef
  }));
}

const _TextFieldBase = forwardRef(TextFieldBase);
export {_TextFieldBase as TextFieldBase};
