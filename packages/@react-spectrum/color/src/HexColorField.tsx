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

import React, {RefObject, useRef} from 'react';
import {SpectrumHexColorFieldProps} from '@react-types/color';
import {TextFieldBase} from '@react-spectrum/textfield';
import {TextFieldRef} from '@react-types/textfield';
import {useHexColorField} from '@react-aria/color';
import {useHexColorFieldState} from '@react-stately/color';
import {useProviderProps} from '@react-spectrum/provider';

function HexColorField(props: SpectrumHexColorFieldProps, ref: RefObject<TextFieldRef>) {
  props = useProviderProps(props);
  const {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    value,
    defaultValue,
    onChange,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    ...otherProps
  } = props;
  const state = useHexColorFieldState(props);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>();
  const {
    labelProps,
    inputFieldProps
  } = useHexColorField(props, state, inputRef);

  return (
    <TextFieldBase
      {...otherProps}
      ref={ref}
      inputRef={inputRef}
      labelProps={labelProps}
      inputProps={inputFieldProps} />
  );
}

const _HexColorField = React.forwardRef(HexColorField);
export {_HexColorField as HexColorField};
