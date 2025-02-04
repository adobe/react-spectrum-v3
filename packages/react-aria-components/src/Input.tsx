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

import {ContextValue, StyleRenderProps, useContextProps, useRenderProps} from './utils';
import {createHideableComponent} from '@react-aria/collections';
import {HoverEvents, mergeProps, useFocusRing, useHover} from 'react-aria';
import React, {createContext, ForwardedRef, InputHTMLAttributes} from 'react';

export interface InputRenderProps {
  /**
   * Whether the input is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean,
  /**
   * Whether the input is focused, either via a mouse or keyboard.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the input is keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the input is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * Whether the input is invalid.
   * @selector [data-invalid]
   */
  isInvalid: boolean
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style'>, HoverEvents, StyleRenderProps<InputRenderProps> {}

export const InputContext = createContext<ContextValue<InputProps, HTMLInputElement>>({});

let filterHoverProps = (props: InputProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let {onHoverStart, onHoverChange, onHoverEnd, ...otherProps} = props;
  return otherProps;
};

/**
 * An input allows a user to input text.
 */
export const Input = /*#__PURE__*/ createHideableComponent(function Input(props: InputProps, ref: ForwardedRef<HTMLInputElement>) {
  [props, ref] = useContextProps(props, ref, InputContext);

  let {hoverProps, isHovered} = useHover(props);
  let {isFocused, isFocusVisible, focusProps} = useFocusRing({
    autoFocus: props.autoFocus
  });

  let isInvalid = !!props['aria-invalid'] && props['aria-invalid'] !== 'false';
  let renderProps = useRenderProps({
    ...props,
    values: {
      isHovered,
      isFocused,
      isFocusVisible,
      isDisabled: props.disabled || false,
      isInvalid
    },
    defaultClassName: 'react-aria-Input'
  });

  return (
    <input
      {...mergeProps(filterHoverProps(props), focusProps, hoverProps)}
      {...renderProps}
      ref={ref}
      data-focused={isFocused || undefined}
      data-disabled={props.disabled || undefined}
      data-hovered={isHovered || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-invalid={isInvalid || undefined} />
  );
});
