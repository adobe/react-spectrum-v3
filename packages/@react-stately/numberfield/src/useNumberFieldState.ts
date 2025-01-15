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
import {FormValidationState, useFormValidationState} from '@react-stately/form';
import {NumberFieldProps} from '@react-types/numberfield';
import {NumberFormatter, NumberParser} from '@internationalized/number';
import {useCallback, useMemo, useState} from 'react';

export interface NumberFieldState extends FormValidationState {
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
  minValue?: number,
  /** The maximum value of the number field. */
  maxValue?: number,
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
  /** Sets the number value. */
  setNumberValue(val: number): void,
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
  decrementToMin(): void,
  /**
   * Parses a string value in any supported locale to a number.
   * This is useful when the user pastes a value that may be in a different locale.
   */
  parseValueInAnySupportedLocale(value: string): number
}

export interface NumberFieldStateOptions extends NumberFieldProps {
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
  props: NumberFieldStateOptions
): NumberFieldState {
  let {
    minValue,
    maxValue,
    step,
    formatOptions,
    value,
    defaultValue = NaN,
    onChange,
    locale,
    isDisabled,
    isReadOnly
  } = props;

  if (value === null) {
    value = NaN;
  }

  if (value !== undefined && !isNaN(value)) {
    if (step !== undefined && !isNaN(step)) {
      value = snapValueToStep(value, minValue, maxValue, step);
    } else {
      value = clamp(value, minValue, maxValue);
    }
  }

  if (!isNaN(defaultValue)) {
    if (step !== undefined && !isNaN(step)) {
      defaultValue = snapValueToStep(defaultValue, minValue, maxValue, step);
    } else {
      defaultValue = clamp(defaultValue, minValue, maxValue);
    }
  }

  let [numberValue, setNumberValue] = useControlledState<number>(value, isNaN(defaultValue) ? NaN : defaultValue, onChange);
  let [inputValue, setInputValue] = useState(() => isNaN(numberValue) ? '' : new NumberFormatter(locale, formatOptions).format(numberValue));

  let numberParser = useMemo(() => new NumberParser(locale, formatOptions), [locale, formatOptions]);
  let numberingSystem = useMemo(() => numberParser.getNumberingSystem(inputValue), [numberParser, inputValue]);
  let formatter = useMemo(() => new NumberFormatter(locale, {...formatOptions, numberingSystem}), [locale, formatOptions, numberingSystem]);
  let intlOptions = useMemo(() => formatter.resolvedOptions(), [formatter]);
  let format = useCallback((value: number) => (isNaN(value) || value === null) ? '' : formatter.format(value), [formatter]);

  let validation = useFormValidationState({
    ...props,
    value: numberValue
  });

  let clampStep = (step !== undefined && !isNaN(step)) ? step : 1;
  if (intlOptions.style === 'percent' && (step === undefined || isNaN(step))) {
    clampStep = 0.01;
  }

  // Update the input value when the number value or format options change. This is done
  // in a useEffect so that the controlled behavior is correct and we only update the
  // textfield after prop changes.
  let [prevValue, setPrevValue] = useState(numberValue);
  let [prevLocale, setPrevLocale] = useState(locale);
  let [prevFormatOptions, setPrevFormatOptions] = useState(formatOptions);
  if (!Object.is(numberValue, prevValue) || locale !== prevLocale || formatOptions !== prevFormatOptions) {
    setInputValue(format(numberValue));
    setPrevValue(numberValue);
    setPrevLocale(locale);
    setPrevFormatOptions(formatOptions);
  }

  let parsedValue = useMemo(() => numberParser.parse(inputValue), [numberParser, inputValue]);
  let commit = () => {
    // Set to empty state if input value is empty
    if (!inputValue.length) {
      setNumberValue(NaN);
      setInputValue(value === undefined ? '' : format(numberValue));
      return;
    }

    // if it failed to parse, then reset input to formatted version of current number
    if (isNaN(parsedValue)) {
      setInputValue(format(numberValue));
      return;
    }

    // Clamp to min and max, round to the nearest step, and round to specified number of digits
    let clampedValue: number;
    if (step === undefined || isNaN(step)) {
      clampedValue = clamp(parsedValue, minValue, maxValue);
    } else {
      clampedValue = snapValueToStep(parsedValue, minValue, maxValue, step);
    }

    clampedValue = numberParser.parse(format(clampedValue));
    setNumberValue(clampedValue);

    // in a controlled state, the numberValue won't change, so we won't go back to our old input without help
    setInputValue(format(value === undefined ? clampedValue : numberValue));
  };

  let safeNextStep = (operation: '+' | '-', minMax: number = 0) => {
    let prev = parsedValue;

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
    let newValue = safeNextStep('+', minValue);

    // if we've arrived at the same value that was previously in the state, the
    // input value should be updated to match
    // ex type 4, press increment, highlight the number in the input, type 4 again, press increment
    // you'd be at 5, then incrementing to 5 again, so no re-render would happen and 4 would be left in the input
    if (newValue === numberValue) {
      setInputValue(format(newValue));
    }

    setNumberValue(newValue);
    validation.commitValidation();
  };

  let decrement = () => {
    let newValue = safeNextStep('-', maxValue);

    if (newValue === numberValue) {
      setInputValue(format(newValue));
    }

    setNumberValue(newValue);
    validation.commitValidation();
  };

  let incrementToMax = () => {
    if (maxValue != null) {
      setNumberValue(snapValueToStep(maxValue, minValue, maxValue, clampStep));
      validation.commitValidation();
    }
  };

  let decrementToMin = () => {
    if (minValue != null) {
      setNumberValue(minValue);
      validation.commitValidation();
    }
  };

  let canIncrement = useMemo(() => (
    !isDisabled &&
    !isReadOnly &&
    (
      isNaN(parsedValue) ||
      (maxValue === undefined || isNaN(maxValue)) ||
      snapValueToStep(parsedValue, minValue, maxValue, clampStep) > parsedValue ||
      handleDecimalOperation('+', parsedValue, clampStep) <= maxValue
    )
  ), [isDisabled, isReadOnly, minValue, maxValue, clampStep, parsedValue]);

  let canDecrement = useMemo(() => (
    !isDisabled &&
    !isReadOnly &&
    (
      isNaN(parsedValue) ||
      (minValue === undefined || isNaN(minValue)) ||
      snapValueToStep(parsedValue, minValue, maxValue, clampStep) < parsedValue ||
      handleDecimalOperation('-', parsedValue, clampStep) >= minValue
    )
  ), [isDisabled, isReadOnly, minValue, maxValue, clampStep, parsedValue]);

  let validate = (value: string) => numberParser.isValidPartialNumber(value, minValue, maxValue);

  let parseValueInAnySupportedLocale = (value: string) => numberParser.parse(value);

  return {
    ...validation,
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
    setNumberValue,
    setInputValue,
    inputValue,
    commit,
    parseValueInAnySupportedLocale
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
