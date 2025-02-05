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

import {AriaToggleProps} from '@react-types/checkbox';
import {filterDOMProps, mergeProps, useFormReset} from '@react-aria/utils';
import {InputHTMLAttributes, LabelHTMLAttributes} from 'react';
import {RefObject} from '@react-types/shared';
import {ToggleState} from '@react-stately/toggle';
import {useFocusable, usePress} from '@react-aria/interactions';

export interface ToggleAria {
  /** Props to be spread on the label element. */
  labelProps: LabelHTMLAttributes<HTMLLabelElement>,
  /** Props to be spread on the input element. */
  inputProps: InputHTMLAttributes<HTMLInputElement>,
  /** Whether the toggle is selected. */
  isSelected: boolean,
  /** Whether the toggle is in a pressed state. */
  isPressed: boolean,
  /** Whether the toggle is disabled. */
  isDisabled: boolean,
  /** Whether the toggle is read only. */
  isReadOnly: boolean,
  /** Whether the toggle is invalid. */
  isInvalid: boolean
}

/**
 * Handles interactions for toggle elements, e.g. Checkboxes and Switches.
 */
export function useToggle(props: AriaToggleProps, state: ToggleState, ref: RefObject<HTMLInputElement | null>): ToggleAria {
  let {
    isDisabled = false,
    isReadOnly = false,
    value,
    name,
    children,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    validationState = 'valid',
    isInvalid
  } = props;

  let onChange = (e) => {
    // since we spread props on label, onChange will end up there as well as in here.
    // so we have to stop propagation at the lowest level that we care about
    e.stopPropagation();
    state.setSelected(e.target.checked);
  };

  let hasChildren = children != null;
  let hasAriaLabel = ariaLabel != null || ariaLabelledby != null;
  if (!hasChildren && !hasAriaLabel) {
    console.warn('If you do not provide children, you must specify an aria-label for accessibility');
  }

  // Handle press state for keyboard interactions and cases where labelProps is not used.
  let {pressProps, isPressed} = usePress({
    isDisabled
  });

  // Handle press state on the label.
  let {pressProps: labelProps, isPressed: isLabelPressed} = usePress({
    isDisabled: isDisabled || isReadOnly
  });

  let {focusableProps} = useFocusable(props, ref);
  let interactions = mergeProps(pressProps, focusableProps);
  let domProps = filterDOMProps(props, {labelable: true});

  useFormReset(ref, state.isSelected, state.setSelected);

  return {
    labelProps,
    inputProps: mergeProps(domProps, {
      'aria-invalid': isInvalid || validationState === 'invalid' || undefined,
      'aria-errormessage': props['aria-errormessage'],
      'aria-controls': props['aria-controls'],
      'aria-readonly': isReadOnly || undefined,
      onChange,
      disabled: isDisabled,
      ...(value == null ? {} : {value}),
      name,
      type: 'checkbox',
      ...interactions
    }),
    isSelected: state.isSelected,
    isPressed: isPressed || isLabelPressed,
    isDisabled,
    isReadOnly,
    isInvalid: isInvalid || validationState === 'invalid'
  };
}
