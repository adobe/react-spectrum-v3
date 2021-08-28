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

import {useCallback, useRef, useState} from 'react';

export function useControlledState<T>(
  value: T,
  defaultValue: T,
  onChange: (value: T, ...args: any[]) => void
): [T, (value: T | ((prevState: T) => T), ...args: any[]) => void]  {
  let [stateValue, setStateValue] = useState(value || defaultValue);
  let ref = useRef(value !== undefined);
  let wasControlled = ref.current;
  let isControlled = value !== undefined;
  // Internal state reference for useCallback
  let stateRef = useRef(stateValue);
  if (wasControlled !== isControlled) {
    console.warn(`WARN: A component changed from ${wasControlled ? 'controlled' : 'uncontrolled'} to ${isControlled ? 'controlled' : 'uncontrolled'}.`);
  }

  ref.current = isControlled;

  let setValue = useCallback((value, ...args) => {
    let onChangeCaller = (value, ...onChangeArgs) => {
      if (onChange) {
        if (!Object.is(stateRef.current, value)) {
          onChange(value, ...onChangeArgs);
        }
      }
      if (!isControlled) {
        stateRef.current = value;
      }
    };

    if (typeof value === 'function') {
      // this supports functional updates https://reactjs.org/docs/hooks-reference.html#functional-updates
      let oldValue = stateRef.current;
      let interceptedValue = value(oldValue);
      setStateValue(!isControlled ? interceptedValue : oldValue);
      onChangeCaller(interceptedValue, ...args);
    } else {
      if (!isControlled) {
        setStateValue(value);
      }
      onChangeCaller(value, ...args);
    }
  }, [isControlled, onChange]);

  // If a controlled component's value prop changes, we need to update stateRef
  if (isControlled) {
    stateRef.current = value;
  } else {
    value = stateValue;
  }

  return [value, setValue];
}
