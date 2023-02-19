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
import {ElementType, HTMLAttributes, RefObject} from 'react';
import {filterDOMProps} from '@react-aria/utils';
import {FocusableElement} from '@react-types/shared';
import {mergeProps} from '@react-aria/utils';
import {useFocusable} from '@react-aria/focus';
import {usePress} from '@react-aria/interactions';


export interface ButtonAria<T> {
  /** Props for the button element. */
  buttonProps: T,
  /** Whether the button is currently pressed. */
  isPressed: boolean
}

export type AriaButtonPropsElementType = 'button' | 'a' | 'div' | 'input' | 'span' | ElementType;

export type HTMLAttributesElementType = HTMLButtonElement | HTMLAnchorElement | HTMLDivElement | HTMLInputElement | HTMLSpanElement;

export type RefObjectElementType = HTMLAttributesElementType | Element;

/**
 * Provides the behavior and accessibility implementation for a button component. Handles mouse, keyboard, and touch interactions,
 * focus behavior, and ARIA props for both native button elements and custom element types.
 * @param props - Props to be applied to the button.
 * @param ref - A ref to a DOM element for the button.
 */
export function useButton<T extends AriaButtonPropsElementType = 'button', V extends RefObjectElementType = HTMLButtonElement>(props: AriaButtonProps<T>, ref: RefObject<V>): ButtonAria<HTMLAttributes<any>> {
  let {
    elementType = 'button',
    isDisabled,
    onPress,
    onPressStart,
    onPressEnd,
    onPressChange,
    // @ts-ignore - undocumented
    preventFocusOnPress,
    // @ts-ignore - undocumented
    allowFocusWhenDisabled,
    // @ts-ignore
    onClick: deprecatedOnClick,
    href,
    target,
    rel,
    type = 'button'
  } = props;
  let additionalProps;
  if (elementType === 'button') {
    additionalProps = {
      type,
      disabled: isDisabled
    };
  } else {
    additionalProps = {
      role: 'button',
      tabIndex: isDisabled ? undefined : 0,
      href: elementType === 'a' && isDisabled ? undefined : href,
      target: elementType === 'a' ? target : undefined,
      type: elementType === 'input' ? type : undefined,
      disabled: elementType === 'input' ? isDisabled : undefined,
      'aria-disabled': !isDisabled || elementType === 'input' ? undefined : isDisabled,
      rel: elementType === 'a' ? rel : undefined
    };
  }

  let {pressProps, isPressed} = usePress({
    onPressStart,
    onPressEnd,
    onPressChange,
    onPress,
    isDisabled,
    preventFocusOnPress,
    ref
  });

  let {focusableProps} = useFocusable(props, ref as RefObject<FocusableElement>);
  if (allowFocusWhenDisabled) {
    focusableProps.tabIndex = isDisabled ? -1 : focusableProps.tabIndex;
  }
  let buttonProps = mergeProps(focusableProps, pressProps, filterDOMProps(props, {labelable: true}));

  return {
    isPressed, // Used to indicate press state for visual
    buttonProps: mergeProps(additionalProps, buttonProps, {
      'aria-haspopup': props['aria-haspopup'],
      'aria-expanded': props['aria-expanded'],
      'aria-controls': props['aria-controls'],
      'aria-pressed': props['aria-pressed'],
      onClick: (e) => {
        if (deprecatedOnClick) {
          deprecatedOnClick(e);
          console.warn('onClick is deprecated, please use onPress');
        }
      }
    })
  };
}
