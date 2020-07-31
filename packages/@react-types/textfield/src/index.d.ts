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

import {
  AriaLabelingProps,
  AriaValidationProps,
  FocusableDOMProps,
  FocusableProps,
  FocusableRefValue,
  InputBase,
  LabelableProps,
  SpectrumLabelableProps,
  StyleProps,
  TextInputBase,
  TextInputDOMProps,
  Validation,
  ValueBase
} from '@react-types/shared';
import {ElementType, ReactElement} from 'react';

export interface TextFieldProps<T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement | HTMLTextAreaElement> extends InputBase, Validation, FocusableProps<T>, TextInputBase, ValueBase<string>, LabelableProps {}

export interface AriaTextFieldProps<T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement | HTMLTextAreaElement> extends TextFieldProps<T>, AriaLabelingProps, FocusableDOMProps, TextInputDOMProps, AriaValidationProps {
  // https://www.w3.org/TR/wai-aria-1.2/#textbox
  /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
  'aria-activedescendant'?: string,
  /**
   * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
   * presented if they are made.
   */
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both',
  /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog',

  /**
   * The HTML element used to render the input, e.g. 'input', or 'textarea'.
   * It determines whether certain HTML attributes will be included in `inputProps`.
   * For example, [`type`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-type).
   * @default 'input'
   */
  inputElementType?: ElementType
}

export interface SpectrumTextFieldProps<T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement | HTMLTextAreaElement> extends AriaTextFieldProps<T>, SpectrumLabelableProps, StyleProps {
  /** An icon to display at the start of the textfield. */
  icon?: ReactElement,
  /** Whether the textfield should be displayed with a quiet style. */
  isQuiet?: boolean
}

export interface TextFieldRef extends FocusableRefValue<HTMLInputElement & HTMLTextAreaElement, HTMLDivElement> {
  select(): void,
  getInputElement(): HTMLInputElement & HTMLTextAreaElement
}
