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

import {chain, useLayoutEffect} from '@react-aria/utils';
import React, {RefObject, useCallback, useRef} from 'react';
import {SpectrumTextFieldProps, TextFieldRef} from '@react-types/textfield';
import {TextFieldBase} from './TextFieldBase';
import {useControlledState} from '@react-stately/utils';
import {useProviderProps} from '@react-spectrum/provider';
import {useTextField} from '@react-aria/textfield';

function TextArea(props: SpectrumTextFieldProps, ref: RefObject<TextFieldRef>) {
  props = useProviderProps(props);
  let {
    isDisabled = false,
    isQuiet = false,
    isReadOnly = false,
    isRequired = false,
    onChange,
    ...otherProps
  } = props;

  // not in stately because this is so we know when to re-measure, which is a spectrum design
  let [inputValue, setInputValue] = useControlledState(props.value, props.defaultValue, () => {});

  let inputRef = useRef<HTMLTextAreaElement>();

  let onHeightChange = useCallback(() => {
    if (isQuiet) {
      let input = inputRef.current;
      let prevAlignment = input.style.alignSelf;
      input.style.alignSelf = 'start';
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
      input.style.alignSelf = prevAlignment;
    }
  }, [isQuiet, inputRef]);

  useLayoutEffect(() => {
    if (inputRef.current) {
      onHeightChange();
    }
  }, [onHeightChange, inputValue, inputRef]);


  let {labelProps, inputProps, descriptionProps, errorMessageProps} = useTextField({
    ...props,
    onChange: chain(onChange, setInputValue),
    inputElementType: 'textarea'
  }, inputRef);

  return (
    <TextFieldBase
      {...otherProps}
      ref={ref}
      inputRef={inputRef}
      labelProps={labelProps}
      inputProps={inputProps}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      multiLine
      isDisabled={isDisabled}
      isQuiet={isQuiet}
      isReadOnly={isReadOnly}
      isRequired={isRequired} />
  );
}

/**
 * TextAreas are multiline text inputs, useful for cases where users have
 * a sizable amount of text to enter. They allow for all customizations that
 * are available to text fields.
 */
let _TextArea = React.forwardRef(TextArea);
export {_TextArea as TextArea};
