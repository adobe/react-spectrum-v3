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
  AsyncLoadable,
  CollectionBase,
  DimensionValue,
  DOMProps,
  FocusableProps,
  HelpTextProps,
  InputBase,
  InputDOMProps,
  Key,
  LabelableProps,
  LoadingState,
  SingleSelection,
  SpectrumFieldValidation,
  SpectrumLabelableProps,
  SpectrumTextInputBase,
  StyleProps,
  TextInputBase,
  Validation
} from '@react-types/shared';

export type MenuTriggerAction = 'focus' | 'input' | 'manual';

export interface ComboBoxValidationValue {
  /** The selected key in the ComboBox. */
  selectedKey: Key | null,
  /** The value of the ComboBox input. */
  inputValue: string
}

export interface ComboBoxProps<T> extends CollectionBase<T>, Omit<SingleSelection, 'disallowEmptySelection' | 'onSelectionChange'>, InputBase, TextInputBase, Validation<ComboBoxValidationValue>, FocusableProps<HTMLInputElement>, LabelableProps, HelpTextProps {
  /** The list of ComboBox items (uncontrolled). */
  defaultItems?: Iterable<T>,
  /** The list of ComboBox items (controlled). */
  items?: Iterable<T>,
  /** Method that is called when the open state of the menu changes. Returns the new open state and the action that caused the opening of the menu. */
  onOpenChange?: (isOpen: boolean, menuTrigger?: MenuTriggerAction) => void,
  /** Handler that is called when the selection changes. */
  onSelectionChange?: (key: Key | null) => void,
  /** The value of the ComboBox input (controlled). */
  inputValue?: string,
  /** The default value of the ComboBox input (uncontrolled). */
  defaultInputValue?: string,
  /** Handler that is called when the ComboBox input value changes. */
  onInputChange?: (value: string) => void,
  /** Whether the ComboBox allows a non-item matching input value to be set. */
  allowsCustomValue?: boolean,
  // /**
  //  * Whether the Combobox should only suggest matching options or autocomplete the field with the nearest matching option.
  //  * @default 'suggest'
  //  */
  // completionMode?: 'suggest' | 'complete',
 /**
  * The interaction required to display the ComboBox menu.
  * @default 'input'
  */
  menuTrigger?: MenuTriggerAction
}

export interface AriaComboBoxProps<T> extends ComboBoxProps<T>, DOMProps, InputDOMProps, AriaLabelingProps {
  /** Whether keyboard navigation is circular. */
  shouldFocusWrap?: boolean,
  /**
   * Whether the combobox listbox should focus on hover.
   * @default true
   */
  shouldFocusOnHover?: boolean
}

export interface SpectrumComboBoxProps<T> extends SpectrumTextInputBase, Omit<AriaComboBoxProps<T>, 'menuTrigger' | 'isInvalid' | 'validationState'>, SpectrumFieldValidation<ComboBoxValidationValue>, SpectrumLabelableProps, StyleProps, Omit<AsyncLoadable, 'isLoading'> {
  /**
   * The interaction required to display the ComboBox menu. Note that this prop has no effect on the mobile ComboBox experience.
   * @default 'input'
   */
  menuTrigger?: MenuTriggerAction,
  /** Whether the ComboBox should be displayed with a quiet style. */
  isQuiet?: boolean,
  /** Alignment of the menu relative to the input target.
   * @default 'end'
   */
  align?: 'start' | 'end',
  /**
   * Direction the menu will render relative to the ComboBox.
   * @default 'bottom'
   */
  direction?: 'bottom' | 'top',
  /** The current loading state of the ComboBox. Determines whether or not the progress circle should be shown. */
  loadingState?: LoadingState,
  /**
   * Whether the menu should automatically flip direction when space is limited.
   * @default true
   */
  shouldFlip?: boolean,
  /** Width of the menu. By default, matches width of the combobox. Note that the minimum width of the dropdown is always equal to the combobox's width. */
  menuWidth?: DimensionValue,
  /**
   * Whether the text or key of the selected item is submitted as part of an HTML form.
   * When `allowsCustomValue` is `true`, this option does not apply and the text is always submitted.
   * @default 'text'
   */
  formValue?: 'text' | 'key'
}
