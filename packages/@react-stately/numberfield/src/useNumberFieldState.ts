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

import {clamp, snapValueToStep, useControlledState} from '@react-stately/utils';
import {NumberFieldProps} from '@react-types/numberfield';
import {NumberFormatter, NumberParser} from '@internationalized/number';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

export interface NumberFieldState {
  /**
   * The current text value of the input. Updated as the user types,
   * and formatted according to `formatOptions` on blur.
   */
  inputValue: string,
  /**
   * The currently parsed number value, or NaN if a valid number could not be parsed.
   * Updated based on the `inputValue` as the user types.
   */
  numberValue: number,
  /** The minimum value of the number field. */
  minValue: number,
  /** The maximum value of the number field. */
  maxValue: number,
  /** Whether the current value can be incremented according to the maximum value and step. */
  canIncrement: boolean,
  /** Whether the current value can be decremented according to the minimum value and step. */
  canDecrement: boolean,
  /**
   * Validates a user input string according to the current locale and format options.
   * Values can be partially entered, and may be valid even if they cannot currently be parsed to a number.
   * Can be used to implement validation as a user types.
   */
  validate(value: string): boolean,
  /** Sets the current text value of the input. */
  setInputValue(val: string): void,
  /**
   * Commits the current input value. The value is parsed to a number, clamped according
   * to the minimum and maximum values of the field, and snapped to the nearest step value.
   * This will fire the `onChange` prop with the new value, and if uncontrolled, update the `numberValue`.
   * Typically this is called when the field is blurred.
   */
  commit(): void,
  /** Increments the current input value to the next step boundary, and fires `onChange`. */
  increment(): void,
  /** Decrements the current input value to the next step boundary, and fires `onChange`. */
  decrement(): void,
  /** Sets the current value to the `maxValue` if any, and fires `onChange`. */
  incrementToMax(): void,
  /** Sets the current value to the `minValue` if any, and fires `onChange`. */
  decrementToMin(): void
}

interface NumberFieldStateProps extends NumberFieldProps {
  /**
   * The locale that should be used for parsing.
   * @default 'en-US'
   */
  locale: string
}

/**
 * Provides state management for a number field component. Number fields allow users to enter a number,
 * and increment or decrement the value using stepper buttons.
 */
export function useNumberFieldState(
  props: NumberFieldStateProps
): NumberFieldState {
  let {
    minValue,
    maxValue,
    step,
    formatOptions,
    value,
    defaultValue,
    onChange,
    locale,
    isDisabled,
    isReadOnly
  } = props;

  let [numberValue, setNumberValue] = useControlledState<number>(value, isNaN(defaultValue) ? NaN : defaultValue, onChange);
  let [inputValue, setInputValue] = useState(() => isNaN(numberValue) ? '' : new NumberFormatter(locale, formatOptions).format(numberValue));

  let numberParser = useMemo(() => new NumberParser(locale, formatOptions), [locale, formatOptions]);
  let numberingSystem = useMemo(() => numberParser.getNumberingSystem(inputValue), [numberParser, inputValue]);
  let formatter = useMemo(() => new NumberFormatter(locale, {...formatOptions, numberingSystem}), [locale, formatOptions, numberingSystem]);
  let intlOptions = useMemo(() => formatter.resolvedOptions(), [formatter]);
  let format = useCallback((value: number) => isNaN(value) ? '' : formatter.format(value), [formatter]);

  let clampStep = !isNaN(step) ? step : 1;
  if (intlOptions.style === 'percent' && isNaN(step)) {
    clampStep = 0.01;
  }

  // Update the input value when the number value or format options change. This is done
  // in a useEffect so that the controlled behavior is correct and we only update the
  // textfield after prop changes. We don't want to update when format changes because
  // it changes whenever the formatter changes which changes based on the numbering system
  // which could cause us to never be able to type.
  useEffect(() => {
    setInputValue(format(numberValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberValue, locale, formatOptions]);

  // Store last parsed value in a ref so it can be used by increment/decrement below
  let parsedValue = useMemo(() => numberParser.parse(inputValue), [numberParser, inputValue]);
  let parsed = useRef(0);
  parsed.current = parsedValue;

  let commit = () => {
    // Set to empty state if input value is empty
    if (!inputValue.length) {
      setNumberValue(NaN);
      setInputValue(value === undefined ? '' : format(numberValue));
      return;
    }

    // if it failed to parse, then reset input to formatted version of current number
    if (isNaN(parsed.current)) {
      setInputValue(format(numberValue));
      return;
    }

    // Clamp to min and max, round to the nearest step, and round to specified number of digits
    let clampedValue: number;
    if (isNaN(step)) {
      clampedValue = clamp(parsed.current, minValue, maxValue);
    } else {
      clampedValue = snapValueToStep(parsed.current, minValue, maxValue, step);
    }

    clampedValue = numberParser.parse(format(clampedValue));
    setNumberValue(clampedValue);

    // in a controlled state, the numberValue won't change, so we won't go back to our old input without help
    setInputValue(format(value === undefined ? clampedValue : numberValue));
  };

  let safeNextStep = (operation: '+' | '-', minMax: number) => {
    let prev = parsed.current;

    if (isNaN(prev)) {
      // if the input is empty, start from the min/max value when incrementing/decrementing,
      // or zero if there is no min/max value defined.
      let newValue = isNaN(minMax) ? 0 : minMax;
      return snapValueToStep(newValue, minValue, maxValue, clampStep);
    } else {
      // otherwise, first snap the current value to the nearest step. if it moves in the direction
      // we're going, use that value, otherwise add the step and snap that value.
      let newValue = snapValueToStep(prev, minValue, maxValue, clampStep);
      if ((operation === '+' && newValue > prev) || (operation === '-' && newValue < prev)) {
        return newValue;
      }

      return snapValueToStep(
        handleDecimalOperation(operation, prev, clampStep),
        minValue,
        maxValue,
        clampStep
      );
    }
  };

  let increment = () => {
    setNumberValue((previousValue) => {
      let newValue = safeNextStep('+', minValue);

      // if we've arrived at the same value that was previously in the state, the
      // input value should be updated to match
      // ex type 4, press increment, highlight the number in the input, type 4 again, press increment
      // you'd be at 5, then incrementing to 5 again, so no re-render would happen and 4 would be left in the input
      if (newValue === previousValue) {
        setInputValue(format(newValue));
      }

      return newValue;
    });
  };

  let decrement = () => {
    setNumberValue((previousValue) => {
      let newValue = safeNextStep('-', maxValue);

      if (newValue === previousValue) {
        setInputValue(format(newValue));
      }

      return newValue;
    });
  };

  let incrementToMax = () => {
    if (maxValue != null) {
      setNumberValue(snapValueToStep(maxValue, minValue, maxValue, clampStep));
    }
  };

  let decrementToMin = () => {
    if (minValue != null) {
      setNumberValue(minValue);
    }
  };

  let canIncrement = useMemo(() => (
    !isDisabled &&
    !isReadOnly &&
    (
      isNaN(parsedValue) ||
      isNaN(maxValue) ||
      snapValueToStep(parsedValue, minValue, maxValue, clampStep) > parsedValue ||
      handleDecimalOperation('+', parsedValue, clampStep) <= maxValue
    )
  ), [isDisabled, isReadOnly, minValue, maxValue, clampStep, parsedValue]);

  let canDecrement = useMemo(() => (
    !isDisabled &&
    !isReadOnly &&
    (
      isNaN(parsedValue) ||
      isNaN(minValue) ||
      snapValueToStep(parsedValue, minValue, maxValue, clampStep) < parsedValue ||
      handleDecimalOperation('-', parsedValue, clampStep) >= minValue
    )
  ), [isDisabled, isReadOnly, minValue, maxValue, clampStep, parsedValue]);

  let validate = (value: string) => numberParser.isValidPartialNumber(value, minValue, maxValue);

  return {
    validate,
    increment,
    incrementToMax,
    decrement,
    decrementToMin,
    canIncrement,
    canDecrement,
    minValue,
    maxValue,
    numberValue: parsedValue,
    setInputValue,
    inputValue,
    commit
  };
}

function handleDecimalOperation(operator: '-' | '+', value1: number, value2: number): number {
  let result = operator === '+' ? value1 + value2 : value1 - value2;

  // Check if we have decimals
  if (value1 % 1 !== 0 || value2 % 1 !== 0) {
    const value1Decimal = value1.toString().split('.');
    const value2Decimal = value2.toString().split('.');
    const value1DecimalLength = (value1Decimal[1] && value1Decimal[1].length) || 0;
    const value2DecimalLength = (value2Decimal[1] && value2Decimal[1].length) || 0;
    const multiplier = Math.pow(10, Math.max(value1DecimalLength, value2DecimalLength));

    // Transform the decimals to integers based on the precision
    value1 = Math.round(value1 * multiplier);
    value2 = Math.round(value2 * multiplier);

    // Perform the operation on integers values to make sure we don't get a fancy decimal value
    result = operator === '+' ? value1 + value2 : value1 - value2;

    // Transform the integer result back to decimal
    result /= multiplier;
  }

  return result;
}
