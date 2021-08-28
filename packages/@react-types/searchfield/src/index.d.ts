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

import {AriaTextFieldProps, SpectrumTextFieldProps, TextFieldProps} from '@react-types/textfield';
import {AsyncLoadable, CollectionBase, LoadingState, SpectrumLabelableProps, StyleProps} from '@react-types/shared';
import {Key} from 'react';
import {MenuTriggerAction} from '@react-types/combobox';

export interface SearchFieldProps extends TextFieldProps {
  /** Handler that is called when the SearchField is submitted. */
  onSubmit?: (value: string) => void,

  /** Handler that is called when the clear button is pressed. */
  onClear?: () => void
}

export interface SearchAutocompleteProps<T> extends CollectionBase<T>, Omit<SearchFieldProps, 'onSubmit'> {
  /** The list of SearchAutocomplete items (uncontrolled). */
  defaultItems?: Iterable<T>,
  /** The list of SearchAutocomplete items (controlled). */
  items?: Iterable<T>,
  /** Method that is called when the open state of the menu changes. Returns the new open state and the action that caused the opening of the menu. */
  onOpenChange?: (isOpen: boolean, menuTrigger?: MenuTriggerAction) => void,
  /** The value of the SearchAutocomplete input (controlled). */
  inputValue?: string,
  /** The default value of the SearchAutocomplete input (uncontrolled). */
  defaultInputValue?: string,
  /** Handler that is called when the SearchAutocomplete input value changes. */
  onInputChange?: (value: string) => void,
  /**
   * The interaction required to display the SearchAutocomplete menu.
   * @default 'input'
   */
  menuTrigger?: MenuTriggerAction,
  onSubmit?: (value: string, key: Key | null) => void
}

export interface SpectrumSearchAutocompleteProps<T> extends Omit<SearchAutocompleteProps<T>, 'menuTrigger'>, SpectrumLabelableProps, StyleProps, Omit<AsyncLoadable, 'isLoading'> {
  /**
   * The interaction required to display the SearchAutocomplete menu. Note that this prop has no effect on the mobile SearchAutocomplete experience.
   * @default 'input'
   */
  menuTrigger?: MenuTriggerAction,
  /** Whether the SearchAutocomplete should be displayed with a quiet style. */
  isQuiet?: boolean,
  /**
   * Direction the menu will render relative to the SearchAutocomplete.
   * @default 'bottom'
   */
  direction?: 'bottom' | 'top',
  /** The current loading state of the SearchAutocomplete. Determines whether or not the progress circle should be shown. */
  loadingState?: LoadingState,
  /**
   * Whether the menu should automatically flip direction when space is limited.
   * @default true
   */
  shouldFlip?: boolean,
  onLoadMore?: () => void
}

export interface AriaSearchFieldProps extends SearchFieldProps, AriaTextFieldProps {}
export interface SpectrumSearchFieldProps extends AriaSearchFieldProps, SpectrumTextFieldProps {}
