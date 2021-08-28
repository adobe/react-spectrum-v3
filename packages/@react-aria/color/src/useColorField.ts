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

import {AriaColorFieldProps} from '@react-types/color';
import {ColorFieldState} from '@react-stately/color';
import {
  HTMLAttributes,
  LabelHTMLAttributes,
  RefObject,
  useCallback,
  useState
} from 'react';
import {mergeProps, useId} from '@react-aria/utils';
import {useFocusWithin, useScrollWheel} from '@react-aria/interactions';
import {useFormattedTextField} from '@react-aria/textfield';
import {useSpinButton} from '@react-aria/spinbutton';

interface ColorFieldAria {
  /** Props for the label element. */
  labelProps: LabelHTMLAttributes<HTMLLabelElement>,
  /** Props for the input element. */
  inputProps: HTMLAttributes<HTMLInputElement>
}

/**
 * Provides the behavior and accessibility implementation for a color field component.
 * Color fields allow users to enter and adjust a hex color value.
 */
export function useColorField(
  props: AriaColorFieldProps,
  state: ColorFieldState,
  ref: RefObject<HTMLInputElement>
): ColorFieldAria {
  let {
    isDisabled,
    isReadOnly,
    isRequired
  } = props;

  let {
    colorValue,
    inputValue,
    commit,
    increment,
    decrement,
    incrementToMax,
    decrementToMin
  } = state;

  let inputId = useId();
  let {spinButtonProps} = useSpinButton(
    {
      isDisabled,
      isReadOnly,
      isRequired,
      maxValue: 0xFFFFFF,
      minValue: 0,
      onIncrement: increment,
      onIncrementToMax: incrementToMax,
      onDecrement: decrement,
      onDecrementToMin: decrementToMin,
      value: colorValue ? colorValue.toHexInt() : undefined,
      textValue: colorValue ? colorValue.toString('hex') : undefined
    }
  );

  let [focusWithin, setFocusWithin] = useState(false);
  let {focusWithinProps} = useFocusWithin({isDisabled, onFocusWithinChange: setFocusWithin});

  let onWheel = useCallback((e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) {
      return;
    }
    if (e.deltaY > 0) {
      increment();
    } else if (e.deltaY < 0) {
      decrement();
    }
  }, [decrement, increment]);
  // If the input isn't supposed to receive input, disable scrolling.
  let scrollingDisabled = isDisabled || isReadOnly || !focusWithin;
  useScrollWheel({onScroll: onWheel, isDisabled: scrollingDisabled}, ref);

  let onChange = value => {
    state.setInputValue(value);
  };

  let {labelProps, inputProps} = useFormattedTextField(
    // @ts-ignore
    mergeProps(props, {
      id: inputId,
      value: inputValue,
      type: 'text',
      autoComplete: 'off',
      onChange
    }), state, ref);

  return {
    labelProps,
    inputProps: mergeProps(inputProps, spinButtonProps, focusWithinProps, {
      role: 'textbox',
      'aria-valuemax': null,
      'aria-valuemin': null,
      'aria-valuenow': null,
      'aria-valuetext': null,
      autoCorrect: 'off',
      onBlur: commit
    })
  };
}
