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

import clsx from 'clsx';
import {mergeProps} from '@react-aria/utils';
import React, {ReactElement} from 'react';
import {useFocusRing} from './useFocusRing';

export interface FocusRingProps {
  /** Child element to apply CSS classes to. */
  children: ReactElement,
  /** CSS class to apply when the element is focused. */
  focusClass?: string,
  /** CSS class to apply when the element has keyboard focus. */
  focusRingClass?: string,
  /**
   * Whether to show the focus ring when something
   * inside the container element has focus (true), or
   * only if the container itself has focus (false).
   * @default false
   */
  within?: boolean,

  /**
   * Whether the element is a text input.
   * @deprecated This is no longer necessary.
   */
  isTextInput?: boolean,
  /** Whether the element will be auto focused. */
  autoFocus?: boolean
}

/**
 * A utility component that applies a CSS class when an element has keyboard focus.
 * Focus rings are visible only when the user is interacting with a keyboard,
 * not with a mouse, touch, or other input methods.
 */
export function FocusRing(props: FocusRingProps) {
  let {children, focusClass, focusRingClass} = props;
  let {isFocused, isFocusVisible, focusProps} = useFocusRing(props);
  let child = React.Children.only(children);

  return React.cloneElement(child, mergeProps(child.props as any, {
    ...focusProps,
    className: clsx({
      [focusClass || '']: isFocused,
      [focusRingClass || '']: isFocusVisible
    })
  }));
}
