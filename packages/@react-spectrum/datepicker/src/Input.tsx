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

import Alert from '@spectrum-icons/ui/AlertMedium';
import Checkmark from '@spectrum-icons/ui/CheckmarkMedium';
import {classNames, useValueEffect} from '@react-spectrum/utils';
import datepickerStyles from './styles.css';
import {mergeProps, mergeRefs, useEvent, useLayoutEffect, useResizeObserver} from '@react-aria/utils';
import React, {ReactElement, useCallback, useRef} from 'react';
import textfieldStyles from '@adobe/spectrum-css-temp/components/textfield/vars.css';
import {useFocusRing} from '@react-aria/focus';

export const Input = React.forwardRef(function Input(props: any, ref: any) {
  let inputRef = useRef<HTMLInputElement | null>(null);
  let {
    isDisabled,
    isQuiet,
    inputClassName,
    validationState,
    children,
    fieldProps,
    className,
    style,
    disableFocusRing
  } = props;

  // Reserve padding for the error icon when the width of the input is unconstrained.
  // When constrained, don't reserve space because adding it only when invalid will
  // not cause a layout shift.
  let [reservePadding, setReservePadding] = useValueEffect(false);
  let onResize = useCallback(() => setReservePadding(function *(reservePadding) {
    if (inputRef.current && inputRef.current.parentElement) {
      if (reservePadding) {
        // Try to collapse padding if the content is clipped.
        if (inputRef.current.scrollWidth > inputRef.current.offsetWidth) {
          let width = inputRef.current.parentElement.offsetWidth;
          yield false;

          // If removing padding causes a layout shift, add it back.
          if (inputRef.current.parentElement.offsetWidth !== width) {
            yield true;
          }
        }
      } else {
        // Try to add padding if the content is not clipped.
        if (inputRef.current.offsetWidth >= inputRef.current.scrollWidth) {
          let width = inputRef.current.parentElement.offsetWidth;
          yield true;

          // If adding padding does not change the width (i.e. width is constrained), remove it again.
          if (inputRef.current.parentElement.offsetWidth === width) {
            yield false;
          }
        }
      }
    }

  }), [inputRef, setReservePadding]);

  useLayoutEffect(onResize, [onResize]);
  useResizeObserver({
    ref: inputRef,
    onResize
  });

  // We also need to listen for resize events of the window so we can detect
  // when there is enough space for the padding to be re-added. Ideally we'd
  // use a resize observer on a parent element, but it's hard to know _what_
  // parent element.
  useEvent(useRef(typeof window !== 'undefined' ? window : null), 'resize', onResize);

  let {focusProps, isFocusVisible, isFocused} = useFocusRing({
    within: true
  });

  let isInvalid = validationState === 'invalid' && !isDisabled;
  let textfieldClass = classNames(
    textfieldStyles,
    'spectrum-Textfield',
    {
      'spectrum-Textfield--invalid': isInvalid,
      'spectrum-Textfield--valid': validationState === 'valid' && !isDisabled,
      'spectrum-Textfield--quiet': isQuiet,
      'focus-ring': isFocusVisible && !disableFocusRing
    },
    classNames(datepickerStyles, 'react-spectrum-Datepicker-field'),
    className
  );

  let inputClass = classNames(
    textfieldStyles,
    'spectrum-Textfield-input',
    {
      'is-disabled': isDisabled,
      'is-focused': isFocused
    },
    classNames(datepickerStyles, 'react-spectrum-DateField-Input'),
    reservePadding && classNames(datepickerStyles, 'react-spectrum-Datepicker-input'),
    inputClassName
  );

  let iconClass = classNames(
    textfieldStyles,
    'spectrum-Textfield-validationIcon'
  );

  let validationIcon: ReactElement | null = null;
  if (validationState === 'invalid' && !isDisabled) {
    validationIcon = <Alert data-testid="invalid-icon" UNSAFE_className={iconClass} />;
  } else if (validationState === 'valid' && !isDisabled) {
    validationIcon = <Checkmark data-testid="valid-icon" UNSAFE_className={iconClass} />;
  }

  return (
    <div role="presentation" {...mergeProps(fieldProps, focusProps)} className={textfieldClass} style={style}>
      <div role="presentation" className={inputClass}>
        <div
          role="presentation"
          className={classNames(datepickerStyles, 'react-spectrum-Datepicker-inputContents')}
          ref={mergeRefs(ref, inputRef)}>
          <div
            role="presentation"
            className={classNames(datepickerStyles, 'react-spectrum-Datepicker-inputSized')}
            style={{minWidth: props.minWidth}}>
            {children}
          </div>
        </div>
      </div>
      {validationIcon}
    </div>
  );
});
