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

import {Color, ColorFieldProps} from '@react-types/color';
import {parseColor} from './Color';
import {useColor} from './useColor';
import {useControlledState} from '@react-stately/utils';
import {useEffect, useMemo, useRef, useState} from 'react';

export interface ColorFieldState {
  /**
   * The current text value of the input. Updated as the user types,
   * and formatted according to `formatOptions` on blur.
   */
  readonly inputValue: string,
  /**
   * The currently parsed color value, or null if the field is empty.
   * Updated based on the `inputValue` as the user types.
   */
  readonly colorValue: Color,
  /** Sets the current text value of the input. */
  setInputValue(value: string): void,
  /**
   * Updates the input value based on the currently parsed color value.
   * Typically this is called when the field is blurred.
   */
  commit(): void,
  /** Increments the current input value to the next step boundary, and fires `onChange`. */
  increment(): void,
  /** Decrements the current input value to the next step boundary, and fires `onChange`. */
  decrement(): void,
  /** Sets the current value to the maximum color value, and fires `onChange`. */
  incrementToMax(): void,
  /** Sets the current value to the minimum color value, and fires `onChange`. */
  decrementToMin(): void,
  /**
   * Validates a user input string.
   * Values can be partially entered, and may be valid even if they cannot currently be parsed to a color.
   * Can be used to implement validation as a user types.
   */
  validate(value: string): boolean
}

const MIN_COLOR = parseColor('#000000');
const MAX_COLOR = parseColor('#FFFFFF');
const MIN_COLOR_INT = MIN_COLOR.toHexInt();
const MAX_COLOR_INT = MAX_COLOR.toHexInt();

/**
 * Provides state management for a color field component. Color fields allow
 * users to enter and adjust a hex color value.
 */
export function useColorFieldState(
  props: ColorFieldProps
): ColorFieldState {
  let {
    step = 1,
    value,
    defaultValue,
    onChange
  } = props;

  let initialValue = useColor(value);
  let initialDefaultValue = useColor(defaultValue);
  let [colorValue, setColorValue] = useControlledState<Color>(initialValue, initialDefaultValue, onChange);
  let [inputValue, setInputValue] = useState(() => (value || defaultValue) && colorValue ? colorValue.toString('hex') : '');

  let safelySetColorValue = (newColor: Color | ((prevState: Color) => Color)) => {
    if (typeof newColor === 'function') {
      setColorValue((prev:Color) => {
        let resolved: Color = newColor(prev);
        if (!prev || !resolved) {
          return resolved;
        }
        if (resolved.toHexInt() !== prev.toHexInt()) {
          return resolved;
        }
        return prev;
      });
      return;
    }
    if (!colorValue || !newColor) {
      setColorValue(newColor);
      return;
    }
    if (newColor.toHexInt() !== colorValue.toHexInt()) {
      setColorValue(newColor);
      return;
    }
  };

  useEffect(() => {
    setInputValue(colorValue ? colorValue.toString('hex') : '');
  }, [colorValue, setInputValue]);

  let parsedValue = useMemo(() => {
    let color;
    try {
      color = parseColor(inputValue.startsWith('#') ? inputValue : `#${inputValue}`);
    } catch (err) {
      color = null;
    }
    return color;
  }, [inputValue]);
  let parsed = useRef(null);
  parsed.current = parsedValue;

  let commit = () => {
    // Set to empty state if input value is empty
    if (!inputValue.length) {
      safelySetColorValue(null);
      setInputValue(value === undefined ? '' : colorValue.toString('hex'));
      return;
    }

    // if it failed to parse, then reset input to formatted version of current number
    if (parsed.current == null) {
      setInputValue(colorValue ? colorValue.toString('hex') : '');
      return;
    }

    safelySetColorValue(parsed.current);
    // in a controlled state, the numberValue won't change, so we won't go back to our old input without help
    let newColorValue = '';
    if (colorValue) {
      newColorValue = colorValue.toString('hex');
    }
    setInputValue(newColorValue);
  };

  let increment = () => {
    safelySetColorValue((prevColor: Color) => {
      let newValue = addColorValue(parsed.current, step);
      // if we've arrived at the same value that was previously in the state, the
      // input value should be updated to match
      // ex type 4, press increment, highlight the number in the input, type 4 again, press increment
      // you'd be at 5, then incrementing to 5 again, so no re-render would happen and 4 would be left in the input
      if (newValue === prevColor) {
        setInputValue(newValue.toString('hex'));
      }
      return newValue;
    });
  };
  let decrement = () => {
    safelySetColorValue((prevColor: Color) => {
      let newValue = addColorValue(parsed.current, -step);
      // if we've arrived at the same value that was previously in the state, the
      // input value should be updated to match
      // ex type 4, press increment, highlight the number in the input, type 4 again, press increment
      // you'd be at 5, then incrementing to 5 again, so no re-render would happen and 4 would be left in the input
      if (newValue === prevColor) {
        setInputValue(newValue.toString('hex'));
      }
      return newValue;
    });
  };
  let incrementToMax = () => safelySetColorValue(MAX_COLOR);
  let decrementToMin = () => safelySetColorValue(MIN_COLOR);

  let validate = (value: string) => value === '' || !!value.match(/^#?[0-9a-f]{0,6}$/i)?.[0];

  return {
    validate,
    colorValue,
    inputValue,
    setInputValue,
    commit,
    increment,
    incrementToMax,
    decrement,
    decrementToMin
  };
}

function addColorValue(color: Color, step: number) {
  let newColor = color ? color : MIN_COLOR;
  let colorInt = newColor.toHexInt();

  let clampInt = Math.min(Math.max(colorInt + step, MIN_COLOR_INT), MAX_COLOR_INT);
  if (clampInt !== colorInt) {
    let newColorString = `#${clampInt.toString(16).padStart(6, '0').toUpperCase()}`;
    newColor = parseColor(newColorString);
  }
  return newColor;
}
