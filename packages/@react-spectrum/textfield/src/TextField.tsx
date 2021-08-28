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

import React, {forwardRef, RefObject, useRef} from 'react';
import {SpectrumTextFieldProps, TextFieldRef} from '@react-types/textfield';
import {TextFieldBase} from './TextFieldBase';
import {useProviderProps} from '@react-spectrum/provider';
import {useTextField} from '@react-aria/textfield';

function TextField(props: SpectrumTextFieldProps, ref: RefObject<TextFieldRef>) {
  props = useProviderProps(props);

  let inputRef = useRef<HTMLInputElement>();
  let {labelProps, inputProps, descriptionProps, errorMessageProps} = useTextField(props, inputRef);
  return (
    <TextFieldBase
      {...props}
      labelProps={labelProps}
      inputProps={inputProps}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      ref={ref}
      inputRef={inputRef} />
  );
}

/**
 * TextFields are text inputs that allow users to input custom text entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */
const _TextField = forwardRef(TextField);
export {_TextField as TextField};
