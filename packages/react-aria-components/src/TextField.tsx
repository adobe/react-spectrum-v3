/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaTextFieldProps, useFocusRing, useHover, useTextField} from 'react-aria';
import {ContextValue, DOMProps, Provider, RenderProps, SlotProps, useContextProps, useRenderProps, useSlot} from './utils';
import {filterDOMProps} from '@react-aria/utils';
import {InputContext} from './Input';
import {LabelContext} from './Label';
import React, {createContext, ForwardedRef, forwardRef, useRef} from 'react';
import {TextContext} from './Text';

export interface TextFieldRenderProps {
  /**
   * Whether the text field is focused, either via a mouse or keyboard.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the text field is keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the text field is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean,
  /**
   * Whether the text field is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean
}

export interface TextFieldProps extends Omit<AriaTextFieldProps, 'label' | 'placeholder' | 'description' | 'errorMessage'>, Omit<DOMProps, 'style' | 'className' | 'children'>, SlotProps, RenderProps<TextFieldRenderProps> {}

export const TextFieldContext = createContext<ContextValue<TextFieldProps, HTMLDivElement>>(null);

function TextField(props: TextFieldProps, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, TextFieldContext);
  let inputRef = useRef<HTMLInputElement>(null);
  let [labelRef, label] = useSlot();
  let {labelProps, inputProps, descriptionProps, errorMessageProps} = useTextField({
    ...props,
    label
  }, inputRef);

  let {focusProps, isFocused, isFocusVisible} = useFocusRing({within: true});
  let {hoverProps, isHovered} = useHover(props);
  let renderProps = useRenderProps({
    ...props,
    values: {isHovered, isFocused, isFocusVisible, isDisabled: props.isDisabled || false},
    defaultClassName: 'react-aria-TextField'
  });

  return (
    <div
      {...filterDOMProps(props)}
      {...focusProps}
      {...hoverProps}
      {...renderProps}
      ref={ref}
      slot={props.slot}
      data-hovered={isHovered || undefined}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-disabled={props.isDisabled || undefined}>
      <Provider
        values={[
          [LabelContext, {...labelProps, ref: labelRef}],
          [InputContext, {...inputProps, ref: inputRef}],
          [TextContext, {
            slots: {
              description: descriptionProps,
              errorMessage: errorMessageProps
            }
          }]
        ]}>
        {renderProps.children}
      </Provider>
    </div>
  );
}

/**
 * A text field allows a user to enter a plain text value with a keyboard.
 */
const _TextField = forwardRef(TextField);
export {_TextField as TextField};
