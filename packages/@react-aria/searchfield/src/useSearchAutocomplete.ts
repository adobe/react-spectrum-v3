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
import {AriaListBoxOptions} from '@react-aria/listbox';
import {ComboBoxState} from '@react-stately/combobox';
import {HTMLAttributes, InputHTMLAttributes, RefObject} from 'react';
import {KeyboardDelegate} from '@react-types/shared';
import {mergeProps} from '@react-aria/utils';
import {SearchAutocompleteProps} from '@react-types/searchfield';
import {SearchFieldState} from '@react-stately/searchfield';
import {useComboBox} from '@react-aria/combobox';
import {useSearchField} from '@react-aria/searchfield';

interface AriaSearchAutocompleteProps<T> extends SearchAutocompleteProps<T> {
  /** The ref for the input element. */
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
  /** The ref for the list box popover. */
  popoverRef: RefObject<HTMLDivElement>,
  /** The ref for the list box. */
  listBoxRef: RefObject<HTMLElement>,
  /** An optional keyboard delegate implementation, to override the default. */
  keyboardDelegate?: KeyboardDelegate
}

interface SearchAutocompleteAria<T> {
  /** Props for the label element. */
  labelProps: HTMLAttributes<HTMLElement>,
  /** Props for the search input element. */
  inputProps: InputHTMLAttributes<HTMLInputElement>,
  /** Props for the list box, to be passed to [useListBox](useListBox.html). */
  listBoxProps: AriaListBoxOptions<T>,
  /** Props for the search input's clear button. */
  clearButtonProps: AriaButtonProps
}

interface SearchAutocompleteState<T> extends ComboBoxState<T>, SearchFieldState {}

/**
 * Provides the behavior and accessibility implementation for a search autocomplete component.
 * A search autocomplete combines a combobox with a searchfield, allowing users to filter a list of options to items matching a query.
 * @param props - Props for the search autocomplete.
 * @param state - State for the search autocomplete, as returned by `useSearchAutocomplete`.
 */
export function useSearchAutocomplete<T>(props: AriaSearchAutocompleteProps<T>, state: SearchAutocompleteState<T>): SearchAutocompleteAria<T> {
  let {
    popoverRef,
    inputRef,
    listBoxRef,
    keyboardDelegate,
    onSubmit = () => {}
  } = props;

  let {labelProps, inputProps, clearButtonProps} = useSearchField({
    ...props,
    value: state.inputValue,
    onChange: state.setInputValue,
    autoComplete: 'off',
    onClear: () => state.setInputValue(''),
    onSubmit: (value) => onSubmit(value, state.selectedKey || null)
  }, state, inputRef);
  

  let {listBoxProps, inputProps: comboBoxInputProps} = useComboBox(
    {
      ...props,
      keyboardDelegate,
      popoverRef,
      listBoxRef,
      inputRef
    },
    state
  );

  return {
    labelProps,
    inputProps: mergeProps(inputProps, comboBoxInputProps),
    listBoxProps: mergeProps(listBoxProps, {
      selectionMode: 'none'
    }),
    clearButtonProps
  };
}
