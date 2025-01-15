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

import {announce} from '@react-aria/live-announcer';
import {AriaButtonProps} from '@react-types/button';
import {AriaNumberFieldProps} from '@react-types/numberfield';
import {chain, filterDOMProps, isAndroid, isIOS, isIPhone, mergeProps, useFormReset, useId} from '@react-aria/utils';
import {
  type ClipboardEvent,
  type ClipboardEventHandler,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  RefObject,
  useCallback,
  useMemo,
  useState
} from 'react';
import {DOMAttributes, GroupDOMAttributes, TextInputDOMProps, ValidationResult} from '@react-types/shared';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {NumberFieldState} from '@react-stately/numberfield';
import {privateValidationStateProp} from '@react-stately/form';
import {useFocus, useFocusWithin, useScrollWheel} from '@react-aria/interactions';
import {useFormattedTextField} from '@react-aria/textfield';
import {
  useLocalizedStringFormatter,
  useNumberFormatter
} from '@react-aria/i18n';
import {useSpinButton} from '@react-aria/spinbutton';

export interface NumberFieldAria extends ValidationResult {
  /** Props for the label element. */
  labelProps: LabelHTMLAttributes<HTMLLabelElement>,
  /** Props for the group wrapper around the input and stepper buttons. */
  groupProps: GroupDOMAttributes,
  /** Props for the input element. */
  inputProps: InputHTMLAttributes<HTMLInputElement>,
  /** Props for the increment button, to be passed to [useButton](useButton.html). */
  incrementButtonProps: AriaButtonProps,
  /** Props for the decrement button, to be passed to [useButton](useButton.html). */
  decrementButtonProps: AriaButtonProps,
  /** Props for the number field's description element, if any. */
  descriptionProps: DOMAttributes,
  /** Props for the number field's error message element, if any. */
  errorMessageProps: DOMAttributes
}

/**
 * Provides the behavior and accessibility implementation for a number field component.
 * Number fields allow users to enter a number, and increment or decrement the value using stepper buttons.
 */
export function useNumberField(props: AriaNumberFieldProps, state: NumberFieldState, inputRef: RefObject<HTMLInputElement | null>): NumberFieldAria {
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
    label,
    formatOptions,
    onBlur = () => {},
    onFocus,
    onFocusChange,
    onKeyDown,
    onKeyUp,
    description,
    errorMessage,
    isWheelDisabled,
    ...otherProps
  } = props;

  let {
    increment,
    incrementToMax,
    decrement,
    decrementToMin,
    numberValue,
    inputValue,
    commit,
    commitValidation
  } = state;

  const stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-aria/numberfield');

  let inputId = useId(id);
  let {focusProps} = useFocus({
    onBlur() {
      // Set input value to normalized valid value
      commit();
    }
  });

  let numberFormatter = useNumberFormatter(formatOptions);
  let intlOptions = useMemo(() => numberFormatter.resolvedOptions(), [numberFormatter]);

  // Replace negative textValue formatted using currencySign: 'accounting'
  // with a textValue that can be announced using a minus sign.
  let textValueFormatter = useNumberFormatter({...formatOptions, currencySign: undefined});
  let textValue = useMemo(() => isNaN(numberValue) ? '' : textValueFormatter.format(numberValue), [textValueFormatter, numberValue]);

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
      textValue
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
  let scrollingDisabled = isWheelDisabled || isDisabled || isReadOnly || !focusWithin;
  useScrollWheel({onScroll: onWheel, isDisabled: scrollingDisabled}, inputRef);

  // The inputMode attribute influences the software keyboard that is shown on touch devices.
  // Browsers and operating systems are quite inconsistent about what keys are available, however.
  // We choose between numeric and decimal based on whether we allow negative and fractional numbers,
  // and based on testing on various devices to determine what keys are available in each inputMode.
  let hasDecimals = (intlOptions.maximumFractionDigits ?? 0) > 0;
  let hasNegative = (state.minValue === undefined || isNaN(state.minValue)) || state.minValue < 0;
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
    if (state.validate(value)) {
      state.setInputValue(value);
    }
  };

  let onPaste: ClipboardEventHandler<HTMLInputElement> = (e: ClipboardEvent<HTMLInputElement>) => {
    props.onPaste?.(e);
    let inputElement = e.target as HTMLInputElement;
    if (
      inputElement &&
      (
        ((inputElement.selectionEnd ?? -1) - (inputElement.selectionStart ?? 0)) === inputElement.value.length
      )
    ) {
      e.preventDefault();
      let pastedText = e.clipboardData?.getData?.('text/plain')?.trim() ?? '';
      let value = state.parseValueInAnySupportedLocale(pastedText);
      if (!isNaN(value)) {
        let reformattedValue = numberFormatter.format(value);
        if (state.validate(reformattedValue)) {
          state.setInputValue(reformattedValue);
          if (reformattedValue !== pastedText) {
            announce(stringFormatter.format('pastedValue', {value: reformattedValue}), 'polite');
          }
        }
      }
    }
  };

  let domProps = filterDOMProps(props);
  let onKeyDownEnter = useCallback((e) => {
    if (e.key === 'Enter') {
      commit();
      commitValidation();
    } else {
      e.continuePropagation();
    }
  }, [commit, commitValidation]);

  let {isInvalid, validationErrors, validationDetails} = state.displayValidation;
  let {labelProps, inputProps: textFieldProps, descriptionProps, errorMessageProps} = useFormattedTextField({
    ...otherProps,
    ...domProps,
    name: undefined,
    label,
    autoFocus,
    isDisabled,
    isReadOnly,
    isRequired,
    validate: undefined,
    [privateValidationStateProp]: state,
    value: inputValue,
    defaultValue: undefined, // defaultValue already used to populate state.inputValue, unneeded here
    autoComplete: 'off',
    'aria-label': props['aria-label'] || undefined,
    'aria-labelledby': props['aria-labelledby'] || undefined,
    id: inputId,
    type: 'text', // Can't use type="number" because then we can't have things like $ in the field.
    inputMode,
    onChange,
    onBlur,
    onFocus,
    onFocusChange,
    onKeyDown: useMemo(() => chain(onKeyDownEnter, onKeyDown), [onKeyDownEnter, onKeyDown]),
    onKeyUp,
    onPaste,
    description,
    errorMessage
  }, state, inputRef);

  useFormReset(inputRef, state.numberValue, state.setNumberValue);

  let inputProps: InputHTMLAttributes<HTMLInputElement> = mergeProps(
    spinButtonProps,
    focusProps,
    textFieldProps,
    {
      // override the spinbutton role, we can't focus a spin button with VO
      role: null,
      // ignore aria-roledescription on iOS so that required state will announce when it is present
      'aria-roledescription': (!isIOS() ? stringFormatter.format('numberField') : null),
      'aria-valuemax': null,
      'aria-valuemin': null,
      'aria-valuenow': null,
      'aria-valuetext': null,
      autoCorrect: 'off',
      spellCheck: 'false'
    }
  );

  if (props.validationBehavior === 'native') {
    inputProps['aria-required'] = undefined;
  }

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
      inputRef.current?.focus();
    } else {
      e.target.focus();
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
  let ariaLabelledby: string | undefined;
  if (!fieldLabel) {
    ariaLabelledby = props.label != null ? labelProps.id : props['aria-labelledby'];
  }

  let incrementId = useId();
  let decrementId = useId();

  let incrementButtonProps: AriaButtonProps = mergeProps(incButtonProps, {
    'aria-label': incrementAriaLabel || stringFormatter.format('increase', {fieldLabel}).trim(),
    id: ariaLabelledby && !incrementAriaLabel ? incrementId : null,
    'aria-labelledby': ariaLabelledby && !incrementAriaLabel ? `${incrementId} ${ariaLabelledby}` : null,
    'aria-controls': inputId,
    excludeFromTabOrder: true,
    preventFocusOnPress: true,
    allowFocusWhenDisabled: true,
    isDisabled: !state.canIncrement,
    onPressStart: onButtonPressStart
  });

  let decrementButtonProps: AriaButtonProps = mergeProps(decButtonProps, {
    'aria-label': decrementAriaLabel || stringFormatter.format('decrease', {fieldLabel}).trim(),
    id: ariaLabelledby && !decrementAriaLabel ? decrementId : null,
    'aria-labelledby': ariaLabelledby && !decrementAriaLabel ? `${decrementId} ${ariaLabelledby}` : null,
    'aria-controls': inputId,
    excludeFromTabOrder: true,
    preventFocusOnPress: true,
    allowFocusWhenDisabled: true,
    isDisabled: !state.canDecrement,
    onPressStart: onButtonPressStart
  });

  return {
    groupProps: {
      ...focusWithinProps,
      role: 'group',
      'aria-disabled': isDisabled,
      'aria-invalid': isInvalid ? 'true' : undefined
    },
    labelProps,
    inputProps,
    incrementButtonProps,
    decrementButtonProps,
    errorMessageProps,
    descriptionProps,
    isInvalid,
    validationErrors,
    validationDetails
  };
}
