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

// Portions of the code in this file are based on code from react.
// Original licensing for the following can be found in the
// NOTICE file in the root directory of this source tree.
// See https://github.com/facebook/react/tree/cc7c1aece46a6b69b41958d731e0fd27c94bfc6c/packages/react-interactions

import {FocusEvent, HTMLAttributes} from 'react';
import {FocusEvents} from '@react-types/shared';

interface FocusProps extends FocusEvents {
  /** Whether the focus events should be disabled. */
  isDisabled?: boolean
}

interface FocusResult<T extends HTMLElement = HTMLElement> {
  /** Props to spread onto the target element. */
  focusProps: HTMLAttributes<T>
}

/**
 * Handles focus events for the immediate target.
 * Focus events on child elements will be ignored.
 */
export function useFocus<T extends HTMLElement = HTMLElement>(props: FocusProps): FocusResult<T> {
  if (props.isDisabled) {
    return {focusProps: {}};
  }

  let onFocus, onBlur;
  if (props.onFocus || props.onFocusChange) {
    onFocus = (e: FocusEvent<T>) => {
      if (e.target === e.currentTarget) {
        if (props.onFocus) {
          props.onFocus(e);
        }

        if (props.onFocusChange) {
          props.onFocusChange(true);
        }
      }
    };
  }

  if (props.onBlur || props.onFocusChange) {
    onBlur = (e: FocusEvent<T>) => {
      if (e.target === e.currentTarget) {
        if (props.onBlur) {
          props.onBlur(e);
        }

        if (props.onFocusChange) {
          props.onFocusChange(false);
        }
      }
    };
  }

  return {
    focusProps: {
      onFocus,
      onBlur
    }
  };
}
