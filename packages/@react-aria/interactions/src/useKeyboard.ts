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

import {createEventHandler} from './createEventHandler';
import {HTMLAttributes} from 'react';
import {KeyboardEvents} from '@react-types/shared';

export interface KeyboardProps extends KeyboardEvents {
  /** Whether the keyboard events should be disabled. */
  isDisabled?: boolean
}

interface KeyboardResult<T extends HTMLElement = HTMLElement> {
  /** Props to spread onto the target element. */
  keyboardProps: HTMLAttributes<T>
}

/**
 * Handles keyboard interactions for a focusable element.
 */
export function useKeyboard<T extends HTMLElement = HTMLElement>(props: KeyboardProps): KeyboardResult<T> {
  return {
    keyboardProps: props.isDisabled ? {} : {
      onKeyDown: createEventHandler(props.onKeyDown),
      onKeyUp: createEventHandler(props.onKeyUp)
    }
  };
}
