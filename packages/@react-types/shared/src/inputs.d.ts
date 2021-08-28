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

import {Alignment} from './labelable';
import {ReactNode} from 'react';

export type ValidationState = 'valid' | 'invalid';

export interface Validation {
  /** Whether the input should display its "valid" or "invalid" visual styling. */
  validationState?: ValidationState,
  /**
   * Whether user input is required on the input before form submission.
   * Often paired with the `necessityIndicator` prop to add a visual indicator to the input.
   */
  isRequired?: boolean
}

export interface InputBase {
  /** Whether the input is disabled. */
  isDisabled?: boolean,
  /** Whether the input can be selected but not changed by the user. */
  isReadOnly?: boolean
}

export interface ValueBase<T, C = T> {
  /** The current value (controlled). */
  value?: T,
  /** The default value (uncontrolled). */
  defaultValue?: T,
  /** Handler that is called when the value changes. */
  onChange?: (value: C) => void
}

export interface TextInputBase {
  /** Temporary text that occupies the text input when it is empty. */
  placeholder?: string
}

export interface RangeValue<T> {
  /** The start value of the range. */
  start: T,
  /** The end value of the range. */
  end: T
}

export interface RangeInputBase<T> {
  /** The smallest value allowed for the input. */
  minValue?: T,
  /** The largest value allowed for the input. */
  maxValue?: T,
  /** The amount that the input value changes with each increment or decrement "tick". */
  step?: T // ??
}

export interface HelpTextProps {
  /** A description for the field. Provides a hint such as specific requirements for what to choose. */
  description?: ReactNode,
  /** An error message for the field. */
  errorMessage?: ReactNode
}

// Spectrum specific types. Extends `Validation` so that the `validationState` prop is available.
export interface SpectrumHelpTextProps extends HelpTextProps, Validation {
  /** Whether the description is displayed with lighter text. */
  isDisabled?: boolean,
  /** Whether an error icon is rendered. */
  showErrorIcon?: boolean,
  /** The help text's horizontal alignment relative to the element it is describing. */
  labelAlign?: Alignment
}
