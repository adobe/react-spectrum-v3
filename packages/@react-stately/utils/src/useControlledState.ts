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

import {useCallback, useEffect, useRef, useState} from 'react';

export function useControlledState<T, C = T>(value: Exclude<T, undefined>, defaultValue: Exclude<T, undefined> | undefined, onChange?: (v: C, ...args: any[]) => void): [T, (value: T) => void];
export function useControlledState<T, C = T>(value: Exclude<T, undefined> | undefined, defaultValue: Exclude<T, undefined>, onChange?: (v: C, ...args: any[]) => void): [T, (value: T) => void];
export function useControlledState<T, C = T>(value: T, defaultValue: T, onChange?: (v: C, ...args: any[]) => void): [T, (value: T) => void] {
  let [stateValue, setStateValue] = useState(value || defaultValue);

  let isControlledRef = useRef(value !== undefined);
  let isControlled = value !== undefined;
  useEffect(() => {
    let wasControlled = isControlledRef.current;
    if (wasControlled !== isControlled) {
      console.warn(`WARN: A component changed from ${wasControlled ? 'controlled' : 'uncontrolled'} to ${isControlled ? 'controlled' : 'uncontrolled'}.`);
    }
    isControlledRef.current = isControlled;
  }, [isControlled]);

  let currentValue = isControlled ? value : stateValue;
  let setValue = useCallback((value, ...args) => {
    let onChangeCaller = (value, ...onChangeArgs) => {
      if (onChange) {
        if (!Object.is(currentValue, value)) {
          onChange(value, ...onChangeArgs);
        }
      }
      if (!isControlled) {
        // If uncontrolled, mutate the currentValue local variable so that
        // calling setState multiple times with the same value only emits onChange once.
        // We do not use a ref for this because we specifically _do_ want the value to
        // reset every render, and assigning to a ref in render breaks aborted suspended renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        currentValue = value;
      }
    };

    if (typeof value === 'function') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('We can not support a function callback. See Github Issues for details https://github.com/adobe/react-spectrum/issues/2320');
      }
      // this supports functional updates https://reactjs.org/docs/hooks-reference.html#functional-updates
      // when someone using useControlledState calls setControlledState(myFunc)
      // this will call our useState setState with a function as well which invokes myFunc and calls onChange with the value from myFunc
      // if we're in an uncontrolled state, then we also return the value of myFunc which to setState looks as though it was just called with myFunc from the beginning
      // otherwise we just return the controlled value, which won't cause a rerender because React knows to bail out when the value is the same
      let updateFunction = (oldValue, ...functionArgs) => {
        let interceptedValue = value(isControlled ? currentValue : oldValue, ...functionArgs);
        onChangeCaller(interceptedValue, ...args);
        if (!isControlled) {
          return interceptedValue;
        }
        return oldValue;
      };
      setStateValue(updateFunction);
    } else {
      if (!isControlled) {
        setStateValue(value);
      }
      onChangeCaller(value, ...args);
    }
  }, [isControlled, currentValue, onChange]);

  return [currentValue, setValue];
}
