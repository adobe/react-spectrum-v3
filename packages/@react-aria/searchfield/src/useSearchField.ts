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
import {AriaSearchFieldProps} from '@react-types/searchfield';
import {HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, RefObject} from 'react';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {SearchFieldState} from '@react-stately/searchfield';
import {useMessageFormatter} from '@react-aria/i18n';
import {useTextField} from '@react-aria/textfield';

interface SearchFieldAria {
  /** Props for the text field's visible label element (if any). */
  labelProps: LabelHTMLAttributes<HTMLLabelElement>,
  /** Props for the input element. */
  inputProps: InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
  /** Props for the clear button. */
  clearButtonProps: AriaButtonProps,
  /** Props for the description element. */
  descriptionProps: HTMLAttributes<HTMLElement>,
  /** Props for the error message element. */
  errorMessageProps: HTMLAttributes<HTMLElement>
}

/**
 * Provides the behavior and accessibility implementation for a search field.
 * @param props - Props for the search field.
 * @param state - State for the search field, as returned by `useSearchFieldState`.
 * @param inputRef - A ref to the input element.
 */
export function useSearchField(
  props: AriaSearchFieldProps,
  state: SearchFieldState,
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>
): SearchFieldAria {
  let formatMessage = useMessageFormatter(intlMessages);
  let {
    isDisabled,
    onSubmit = () => {},
    onClear,
    type = 'search'
  } = props;

  let onKeyDown = (e) => {
    const key = e.key;

    if (key === 'Enter' || key === 'Escape') {
      e.preventDefault();
    }

    if (isDisabled) {
      return;
    }

    if (key === 'Enter') {
      onSubmit(state.value);
    }

    if (key === 'Escape') {
      state.setValue('');
      if (onClear) {
        onClear();
      }
    }
  };

  let onClearButtonClick = () => {
    state.setValue('');

    if (onClear) {
      onClear();
    }
  };

  let onPressStart = () => {
    // this is in PressStart for mobile so that touching the clear button doesn't remove focus from
    // the input and close the keyboard
    inputRef.current.focus();
  };

  let {labelProps, inputProps, descriptionProps, errorMessageProps} = useTextField({
    ...props,
    value: state.value,
    onChange: state.setValue,
    onKeyDown,
    type
  }, inputRef);

  return {
    labelProps,
    inputProps: {
      ...inputProps,
      // already handled by useSearchFieldState
      defaultValue: undefined
    },
    clearButtonProps: {
      'aria-label': formatMessage('Clear search'),
      excludeFromTabOrder: true,
      // @ts-ignore
      preventFocusOnPress: true,
      onPress: onClearButtonClick,
      onPressStart
    },
    descriptionProps,
    errorMessageProps
  };
}
