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

import {FocusableDOMProps, FocusableProps} from '@react-types/shared';
import {HTMLAttributes} from 'react';
import {mergeProps} from '@react-aria/utils';
import {RefObject, useEffect} from 'react';
import {useFocus, useKeyboard} from '@react-aria/interactions';

interface FocusableOptions extends FocusableProps, FocusableDOMProps {
  /** Whether focus should be disabled. */
  isDisabled?: boolean
}

interface FocusableResult<T extends HTMLElement = HTMLElement> {
  /** Props to spread onto the target element. */
  focusableProps: HTMLAttributes<T>
}

/**
 * Used to make an element focusable and capable of auto focus.
 */
export function useFocusable<T extends HTMLElement = HTMLElement>(props: FocusableOptions, domRef: RefObject<T>): FocusableResult<T> {
  let {focusProps} = useFocus<T>(props);
  let {keyboardProps} = useKeyboard<T>(props);
  let interactions = mergeProps(focusProps, keyboardProps);

  useEffect(() => {
    if (props.autoFocus && domRef.current) {
      domRef.current.focus();
    }
  }, [props.autoFocus, domRef]);

  return {
    focusableProps: {
      ...interactions,
      tabIndex: props.excludeFromTabOrder && !props.isDisabled ? -1 : undefined
    }
  };
}
