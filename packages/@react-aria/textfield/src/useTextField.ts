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

import {AriaTextFieldProps} from '@react-types/textfield';
import {
  ChangeEvent,
  HTMLAttributes,
  type JSX,
  LabelHTMLAttributes,
  RefObject,
  useEffect
} from 'react';
import {DOMAttributes, ValidationResult} from '@react-types/shared';
import {filterDOMProps, getOwnerWindow, mergeProps, useFormReset} from '@react-aria/utils';
import {useControlledState} from '@react-stately/utils';
import {useField} from '@react-aria/label';
import {useFocusable} from '@react-aria/interactions';
import {useFormValidation} from '@react-aria/form';
import {useFormValidationState} from '@react-stately/form';

/**
 * A map of HTML element names and their interface types.
 * For example `'a'` -> `HTMLAnchorElement`.
 */
type IntrinsicHTMLElements = {
  [K in keyof IntrinsicHTMLAttributes]: IntrinsicHTMLAttributes[K] extends HTMLAttributes<infer T> ? T : never
};

/**
 * A map of HTML element names and their attribute interface types.
 * For example `'a'` -> `AnchorHTMLAttributes<HTMLAnchorElement>`.
 */
type IntrinsicHTMLAttributes = JSX.IntrinsicElements;

type DefaultElementType = 'input';

/**
 * The intrinsic HTML element names that `useTextField` supports; e.g. `input`,
 * `textarea`.
 */
type TextFieldIntrinsicElements = keyof Pick<IntrinsicHTMLElements, 'input' | 'textarea'>;

/**
 * The HTML element interfaces that `useTextField` supports based on what is
 * defined for `TextFieldIntrinsicElements`; e.g. `HTMLInputElement`,
 * `HTMLTextAreaElement`.
 */
type TextFieldHTMLElementType = Pick<IntrinsicHTMLElements, TextFieldIntrinsicElements>;

/**
 * The HTML attributes interfaces that `useTextField` supports based on what
 * is defined for `TextFieldIntrinsicElements`; e.g. `InputHTMLAttributes`,
 * `TextareaHTMLAttributes`.
 */
type TextFieldHTMLAttributesType = Pick<IntrinsicHTMLAttributes, TextFieldIntrinsicElements>;

/**
 * The type of `inputProps` returned by `useTextField`; e.g. `InputHTMLAttributes`,
 * `TextareaHTMLAttributes`.
 */
type TextFieldInputProps<T extends TextFieldIntrinsicElements> = TextFieldHTMLAttributesType[T];

export interface AriaTextFieldOptions<T extends TextFieldIntrinsicElements> extends AriaTextFieldProps<TextFieldHTMLElementType[T]> {
  /**
   * The HTML element used to render the input, e.g. 'input', or 'textarea'.
   * It determines whether certain HTML attributes will be included in `inputProps`.
   * For example, [`type`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-type).
   * @default 'input'
   */
  inputElementType?: T,
  /**
   * Controls whether inputted text is automatically capitalized and, if so, in what manner.
   * See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autocapitalize).
   */
  autoCapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters'
}

/**
 * The type of `ref` object that can be passed to `useTextField` based on the given
 * intrinsic HTML element name; e.g.`RefObject<HTMLInputElement>`,
 * `RefObject<HTMLTextAreaElement>`.
 */
type TextFieldRefObject<T extends TextFieldIntrinsicElements> = RefObject<TextFieldHTMLElementType[T] | null>;

export interface TextFieldAria<T extends TextFieldIntrinsicElements = DefaultElementType> extends ValidationResult {
  /** Props for the input element. */
  inputProps: TextFieldInputProps<T>,
  /** Props for the text field's visible label element, if any. */
  labelProps: DOMAttributes | LabelHTMLAttributes<HTMLLabelElement>,
  /** Props for the text field's description element, if any. */
  descriptionProps: DOMAttributes,
  /** Props for the text field's error message element, if any. */
  errorMessageProps: DOMAttributes
}

/**
 * Provides the behavior and accessibility implementation for a text field.
 * @param props - Props for the text field.
 * @param ref - Ref to the HTML input or textarea element.
 */
export function useTextField<T extends TextFieldIntrinsicElements = DefaultElementType>(
  props: AriaTextFieldOptions<T>,
  ref: TextFieldRefObject<T>
): TextFieldAria<T> {
  let {
    inputElementType = 'input',
    isDisabled = false,
    isRequired = false,
    isReadOnly = false,
    type = 'text',
    validationBehavior = 'aria'
  } = props;
  let [value, setValue] = useControlledState<string>(props.value, props.defaultValue || '', props.onChange);
  let {focusableProps} = useFocusable<TextFieldHTMLElementType[T]>(props, ref);
  let validationState = useFormValidationState({
    ...props,
    value
  });
  let {isInvalid, validationErrors, validationDetails} = validationState.displayValidation;
  let {labelProps, fieldProps, descriptionProps, errorMessageProps} = useField({
    ...props,
    isInvalid,
    errorMessage: props.errorMessage || validationErrors
  });
  let domProps = filterDOMProps(props, {labelable: true});

  const inputOnlyProps = {
    type,
    pattern: props.pattern
  };

  useFormReset(ref, value, setValue);
  useFormValidation(props, validationState, ref);

  useEffect(() => {
    // This works around a React/Chrome bug that prevents textarea elements from validating when controlled.
    // We prevent React from updating defaultValue (i.e. children) of textarea when `value` changes,
    // which causes Chrome to skip validation. Only updating `value` is ok in our case since our
    // textareas are always controlled. React is planning on removing this synchronization in a
    // future major version.
    // https://github.com/facebook/react/issues/19474
    // https://github.com/facebook/react/issues/11896
    if (ref.current instanceof getOwnerWindow(ref.current).HTMLTextAreaElement) {
      let input = ref.current;
      Object.defineProperty(input, 'defaultValue', {
        get: () => input.value,
        set: () => {},
        configurable: true
      });
    }
  }, [ref]);

  return {
    labelProps,
    inputProps: mergeProps(
      domProps,
      inputElementType === 'input' ? inputOnlyProps : undefined,
      {
        disabled: isDisabled,
        readOnly: isReadOnly,
        required: isRequired && validationBehavior === 'native',
        'aria-required': (isRequired && validationBehavior === 'aria') || undefined,
        'aria-invalid': isInvalid || undefined,
        'aria-errormessage': props['aria-errormessage'],
        'aria-activedescendant': props['aria-activedescendant'],
        'aria-autocomplete': props['aria-autocomplete'],
        'aria-haspopup': props['aria-haspopup'],
        'aria-controls': props['aria-controls'],
        value,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
        autoComplete: props.autoComplete,
        autoCapitalize: props.autoCapitalize,
        maxLength: props.maxLength,
        minLength: props.minLength,
        name: props.name,
        placeholder: props.placeholder,
        inputMode: props.inputMode,
        autoCorrect: props.autoCorrect,
        spellCheck: props.spellCheck,

        // Clipboard events
        onCopy: props.onCopy,
        onCut: props.onCut,
        onPaste: props.onPaste,

        // Composition events
        onCompositionEnd: props.onCompositionEnd,
        onCompositionStart: props.onCompositionStart,
        onCompositionUpdate: props.onCompositionUpdate,

        // Selection events
        onSelect: props.onSelect,

        // Input events
        onBeforeInput: props.onBeforeInput,
        onInput: props.onInput,
        ...focusableProps,
        ...fieldProps
      }
    ),
    descriptionProps,
    errorMessageProps,
    isInvalid,
    validationErrors,
    validationDetails
  };
}
