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

import {Color, ColorFieldProps, ColorFormat} from '@react-types/color';
import {parseColor} from './Color';
import {useColor} from './useColor';
import {useControlledState} from '@react-stately/utils';
import {useMemo, useRef, useState} from 'react';

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

const MIN_COLOR = parseColor('#000000FF');
const MAX_COLOR = parseColor('#FFFFFFFF');
const MIN_COLOR_INT = MIN_COLOR.toHexInt();
const MAX_COLOR_INT = MAX_COLOR.toHexInt();

const MIN_COLOR_ALPHA_DEFAULT = parseColor('#000000FF');
const MIN_COLOR_ALPHA = parseColor('#00000000');
const MAX_COLOR_ALPHA = parseColor('#FFFFFFFF');
const MIN_COLOR_INT_ALPHA = MIN_COLOR_ALPHA.toHexInt();
const MAX_COLOR_INT_ALPHA = MAX_COLOR_ALPHA.toHexInt();

const RGB_REGEX = /^#?[0-9a-f]{0,6}$/i;
const RGBA_REGEX = /^#?[0-9a-f]{0,8}$/i;

/**
 * Provides state management for a color field component. Color fields allow
 * users to enter and adjust a hex color value.
 */
export function useColorFieldState(
  props: ColorFieldProps
): ColorFieldState {
  let {
    value,
    defaultValue,
    onChange,
    allowsAlpha = false
  } = props;
  let hexFormat: ColorFormat = allowsAlpha ? 'hexa' : 'hex';
  let validationRegex = allowsAlpha ? RGBA_REGEX : RGB_REGEX;
  let minColor = allowsAlpha ? MIN_COLOR_ALPHA_DEFAULT : MIN_COLOR;
  let maxColor = allowsAlpha ? MAX_COLOR_ALPHA : MAX_COLOR;
  let {step} = MIN_COLOR.getChannelRange('red');

  let initialValue = useColor(value);
  let initialDefaultValue = useColor(defaultValue);
  let [colorValue, setColorValue] = useControlledState<Color>(initialValue, initialDefaultValue, onChange);
  let [inputValue, setInputValue] = useState(() => (value || defaultValue) && colorValue ? colorValue.toString(hexFormat) : '');

  let safelySetColorValue = (newColor: Color) => {
    if (!colorValue || !newColor) {
      setColorValue(newColor);
      return;
    }
    if (newColor.toHexInt() !== colorValue.toHexInt()) {
      setColorValue(newColor);
      return;
    }
  };

  let prevValue = useRef(colorValue);
  let prevAllowsAlpha = useRef(allowsAlpha);
  if (prevValue.current !== colorValue || prevAllowsAlpha.current !== allowsAlpha) {
    setInputValue(colorValue ? colorValue.toString(hexFormat) : '');
    // if we move from allowing alpha to not allowing it, the data should match what is displayed
    if (prevAllowsAlpha.current && colorValue) {
      safelySetColorValue(parseColor(colorValue.toString(hexFormat)));
    }
    prevValue.current = colorValue;
    prevAllowsAlpha.current = allowsAlpha;
  }


  let parsedValue = useMemo(() => {
    let color;
    try {
      color = parseColor(inputValue.startsWith('#') ? inputValue : `#${inputValue}`);
    } catch (err) {
      color = null;
    }
    return color;
  }, [inputValue]);
  let parsed = useRef<Color | null>(null);
  parsed.current = parsedValue;

  let commit = () => {
    // Set to empty state if input value is empty
    if (!inputValue.length) {
      safelySetColorValue(null);
      setInputValue(value === undefined ? '' : colorValue.toString(hexFormat));
      return;
    }

    // if it failed to parse, then reset input to formatted version of current number
    if (parsed.current == null) {
      setInputValue(colorValue ? colorValue.toString(hexFormat) : '');
      return;
    }

    safelySetColorValue(parsed.current);
    // in a controlled state, the numberValue won't change, so we won't go back to our old input without help
    let newColorValue = '';
    if (colorValue) {
      newColorValue = colorValue.toString(hexFormat);
    }
    setInputValue(newColorValue);
  };

  let increment = () => {
    let newValue = addColorValue(parsed.current, step);
    newValue = newValue.withChannelValue('alpha', parsed.current.getChannelValue('alpha'));
    // if we've arrived at the same value that was previously in the state, the
    // input value should be updated to match
    // ex type 4, press increment, highlight the number in the input, type 4 again, press increment
    // you'd be at 5, then incrementing to 5 again, so no re-render would happen and 4 would be left in the input
    if (newValue === colorValue) {
      setInputValue(newValue.toString(hexFormat));
    }
    safelySetColorValue(newValue);
  };
  let decrement = () => {
    let newValue = addColorValue(parsed.current, -step);
    newValue = newValue.withChannelValue('alpha', parsed.current.getChannelValue('alpha'));
    // if we've arrived at the same value that was previously in the state, the
    // input value should be updated to match
    // ex type 4, press increment, highlight the number in the input, type 4 again, press increment
    // you'd be at 5, then incrementing to 5 again, so no re-render would happen and 4 would be left in the input
    if (newValue === colorValue) {
      setInputValue(newValue.toString(hexFormat));
    }
    safelySetColorValue(newValue);
  };
  let incrementToMax = () => {
    if (parsed.current) {
      safelySetColorValue(maxColor.withChannelValue('alpha', parsed.current.getChannelValue('alpha')));
    } else {
      safelySetColorValue(maxColor);
    }
  };
  let decrementToMin = () => {
    if (parsed.current) {
      safelySetColorValue(minColor.withChannelValue('alpha', parsed.current.getChannelValue('alpha')));
    } else {
      safelySetColorValue(minColor);
    }
  };

  let validate = (value: string) => value === '' || !!value.match(validationRegex)?.[0];

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

function addColorValue(color: Color, step: number, allowsAlpha: boolean = false) {
  let minColorInt = allowsAlpha ? MIN_COLOR_INT_ALPHA : MIN_COLOR_INT;
  let maxColorInt = allowsAlpha ? MAX_COLOR_INT_ALPHA : MAX_COLOR_INT;
  step = allowsAlpha ? step : step * 0x100;
  let newColor = color ? color : MIN_COLOR_ALPHA_DEFAULT;
  let colorInt = newColor.toHexInt(); // always includes alpha

  let clampInt = Math.min(Math.max(colorInt + step, minColorInt), maxColorInt);
  if (clampInt !== colorInt) {
    let newColorString = `#${clampInt.toString(16).padStart(8, '0').toUpperCase()}`;
    newColor = parseColor(newColorString);
  }
  return newColor;
}
