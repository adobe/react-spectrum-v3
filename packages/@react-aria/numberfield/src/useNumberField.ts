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

import {AriaButtonProps} from '@react-types/button';
import {AriaNumberFieldProps} from '@react-types/numberfield';
import {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  RefObject,
  useCallback,
  useMemo,
  useState
} from 'react';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {isAndroid, isIOS, isIPhone, mergeProps, useId} from '@react-aria/utils';
import {NumberFieldState} from '@react-stately/numberfield';
import {TextInputDOMProps} from '@react-types/shared';
import {useFocus, useFocusWithin} from '@react-aria/interactions';
import {useFormattedTextField} from '@react-aria/textfield';
import {
  useMessageFormatter,
  useNumberFormatter
} from '@react-aria/i18n';
import {useScrollWheel} from '@react-aria/interactions';
import {useSpinButton} from '@react-aria/spinbutton';

interface NumberFieldAria {
  /** Props for the label element. */
  labelProps: LabelHTMLAttributes<HTMLLabelElement>,
  /** Props for the group wrapper around the input and stepper buttons. */
  groupProps: HTMLAttributes<HTMLElement>,
  /** Props for the input element. */
  inputProps: InputHTMLAttributes<HTMLInputElement>,
  /** Props for the increment button, to be passed to [useButton](useButton.html). */
  incrementButtonProps: AriaButtonProps,
  /** Props for the decrement button, to be passed to [useButton](useButton.html). */
  decrementButtonProps: AriaButtonProps
}

/**
 * Provides the behavior and accessibility implementation for a number field component.
 * Number fields allow users to enter a number, and increment or decrement the value using stepper buttons.
 */
export function useNumberField(props: AriaNumberFieldProps, state: NumberFieldState, inputRef: RefObject<HTMLInputElement>): NumberFieldAria {
  let {
    id,
    decrementAriaLabel,
    incrementAriaLabel,
    isDisabled,
    isReadOnly,
    isRequired,
    minValue,
    maxValue,
    autoFocus,
    validationState,
    label,
    formatOptions,
    onBlur,
    onFocus,
    onFocusChange,
    onKeyDown,
    onKeyUp
  } = props;

  let {
    increment,
    incrementToMax,
    decrement,
    decrementToMin,
    numberValue,
    commit
  } = state;

  const formatMessage = useMessageFormatter(intlMessages);

  let inputId = useId(id);

  let {focusProps} = useFocus({
    onBlur: () => {
      // Set input value to normalized valid value
      commit();
    }
  });

  let {
    spinButtonProps,
    incrementButtonProps: incButtonProps,
    decrementButtonProps: decButtonProps
  } = useSpinButton(
    {
      isDisabled,
      isReadOnly,
      isRequired,
      maxValue,
      minValue,
      onIncrement: increment,
      onIncrementToMax: incrementToMax,
      onDecrement: decrement,
      onDecrementToMin: decrementToMin,
      value: numberValue,
      textValue: state.inputValue
    }
  );

  let [focusWithin, setFocusWithin] = useState(false);
  let {focusWithinProps} = useFocusWithin({isDisabled, onFocusWithinChange: setFocusWithin});

  let onWheel = useCallback((e) => {
    // if on a trackpad, users can scroll in both X and Y at once, check the magnitude of the change
    // if it's mostly in the X direction, then just return, the user probably doesn't mean to inc/dec
    // this isn't perfect, events come in fast with small deltas and a part of the scroll may give a false indication
    // especially if the user is scrolling near 45deg
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
  useScrollWheel({onScroll: onWheel, isDisabled: scrollingDisabled}, inputRef);

  // The inputMode attribute influences the software keyboard that is shown on touch devices.
  // Browsers and operating systems are quite inconsistent about what keys are available, however.
  // We choose between numeric and decimal based on whether we allow negative and fractional numbers,
  // and based on testing on various devices to determine what keys are available in each inputMode.
  let numberFormatter = useNumberFormatter(formatOptions);
  let intlOptions = useMemo(() => numberFormatter.resolvedOptions(), [numberFormatter]);
  let hasDecimals = intlOptions.maximumFractionDigits > 0;
  let hasNegative = isNaN(state.minValue) || state.minValue < 0;
  let inputMode: TextInputDOMProps['inputMode'] = 'numeric';
  if (isIPhone()) {
    // iPhone doesn't have a minus sign in either numeric or decimal.
    // Note this is only for iPhone, not iPad, which always has both
    // minus and decimal in numeric.
    if (hasNegative) {
      inputMode = 'text';
    } else if (hasDecimals) {
      inputMode = 'decimal';
    }
  } else if (isAndroid()) {
    // Android numeric has both a decimal point and minus key.
    // decimal does not have a minus key.
    if (hasNegative) {
      inputMode = 'numeric';
    } else if (hasDecimals) {
      inputMode = 'decimal';
    }
  }

  let onChange = value => {
    state.setInputValue(value);
  };

  let {labelProps, inputProps: textFieldProps} = useFormattedTextField({
    label,
    autoFocus,
    isDisabled,
    isReadOnly,
    isRequired,
    validationState,
    value: state.inputValue,
    autoComplete: 'off',
    'aria-label': props['aria-label'] || null,
    'aria-labelledby': props['aria-labelledby'] || null,
    id: inputId,
    type: 'text', // Can't use type="number" because then we can't have things like $ in the field.
    inputMode,
    onChange,
    onBlur,
    onFocus,
    onFocusChange,
    onKeyDown,
    onKeyUp
  }, state, inputRef);

  let inputProps = mergeProps(
    spinButtonProps,
    textFieldProps,
    focusProps,
    {
      // override the spinbutton role, we can't focus a spin button with VO
      role: null,
      // ignore aria-roledescription on iOS so that required state will announce when it is present
      'aria-roledescription': (!isIOS() ? formatMessage('numberField') : null),
      'aria-valuemax': null,
      'aria-valuemin': null,
      'aria-valuenow': null,
      'aria-valuetext': null,
      autoCorrect: 'off',
      spellCheck: 'false'
    }
  );

  let onButtonPressStart = (e) => {
    // If focus is already on the input, keep it there so we don't hide the
    // software keyboard when tapping the increment/decrement buttons.
    if (document.activeElement === inputRef.current) {
      return;
    }

    // Otherwise, when using a mouse, move focus to the input.
    // On touch, or with a screen reader, focus the button so that the software
    // keyboard does not appear and the screen reader cursor is not moved off the button.
    if (e.pointerType === 'mouse') {
      inputRef.current.focus();
    } else {
      e.target.focus();
    }
  };

  let onButtonPressEnd = (e) => {
    if (e.pointerType !== 'mouse') {
      inputRef.current.focus();
    }
  };

  // Determine the label for the increment and decrement buttons. There are 4 cases:
  //
  // 1. With a visible label that is a string: aria-label: `Increase ${props.label}`
  // 2. With a visible label that is JSX: aria-label: 'Increase', aria-labelledby: '${incrementId} ${labelId}'
  // 3. With an aria-label: aria-label: `Increase ${props['aria-label']}`
  // 4. With an aria-labelledby: aria-label: 'Increase', aria-labelledby: `${incrementId} ${props['aria-labelledby']}`
  //
  // (1) and (2) could possibly be combined and both use aria-labelledby. However, placing the label in
  // the aria-label string rather than using aria-labelledby gives more flexibility to translators to change
  // the order or add additional words around the label if needed.
  let fieldLabel = props['aria-label'] || (typeof props.label === 'string' ? props.label : '');
  let ariaLabelledby: string;
  if (!fieldLabel) {
    ariaLabelledby = props.label != null ? labelProps.id : props['aria-labelledby'];
  }

  let incrementId = useId();
  let decrementId = useId();

  let incrementButtonProps: AriaButtonProps = mergeProps(incButtonProps, {
    'aria-label': incrementAriaLabel || formatMessage('increase', {fieldLabel}).trim(),
    id: ariaLabelledby && !incrementAriaLabel ? incrementId : null,
    'aria-labelledby': ariaLabelledby && !incrementAriaLabel ? `${incrementId} ${ariaLabelledby}` : null,
    'aria-controls': inputId,
    excludeFromTabOrder: true,
    preventFocusOnPress: true,
    isDisabled: !state.canIncrement,
    onPressStart: onButtonPressStart,
    onPressEnd: onButtonPressEnd
  });

  let decrementButtonProps: AriaButtonProps = mergeProps(decButtonProps, {
    'aria-label': decrementAriaLabel || formatMessage('decrease', {fieldLabel}).trim(),
    id: ariaLabelledby && !decrementAriaLabel ? decrementId : null,
    'aria-labelledby': ariaLabelledby && !decrementAriaLabel ? `${decrementId} ${ariaLabelledby}` : null,
    'aria-controls': inputId,
    excludeFromTabOrder: true,
    preventFocusOnPress: true,
    isDisabled: !state.canDecrement,
    onPressStart: onButtonPressStart,
    onPressEnd: onButtonPressEnd
  });

  return {
    groupProps: {
      role: 'group',
      'aria-disabled': isDisabled,
      'aria-invalid': validationState === 'invalid' ? 'true' : undefined,
      ...focusWithinProps
    },
    labelProps,
    inputProps,
    incrementButtonProps,
    decrementButtonProps
  };
}
