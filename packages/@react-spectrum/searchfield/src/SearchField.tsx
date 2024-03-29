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

import {classNames, useSlotProps} from '@react-spectrum/utils';
import {ClearButton} from '@react-spectrum/button';
import Magnifier from '@spectrum-icons/ui/Magnifier';
import React, {forwardRef, ReactElement, Ref, useRef} from 'react';
import {SpectrumSearchFieldProps} from '@react-types/searchfield';
import styles from '@adobe/spectrum-css-temp/components/search/vars.css';
import {TextFieldBase} from '@react-spectrum/textfield';
import {TextFieldRef} from '@react-types/textfield';
import {useFormProps} from '@react-spectrum/form';
import {useProviderProps} from '@react-spectrum/provider';
import {useSearchField} from '@react-aria/searchfield';
import {useSearchFieldState} from '@react-stately/searchfield';

function SearchField(props: SpectrumSearchFieldProps, ref: Ref<TextFieldRef>) {
  props = useSlotProps(props, 'searchfield');
  props = useProviderProps(props);
  props = useFormProps(props);
  let defaultIcon = (
    <Magnifier data-testid="searchicon" />
  );

  let {
    icon = defaultIcon,
    isDisabled,
    UNSAFE_className,
    placeholder,
    ...otherProps
  } = props;

  if (process.env.NODE_ENV !== 'production') {
    if (placeholder) {
      console.warn('Placeholders are deprecated due to accessibility issues. Please use help text instead. See the docs for details: https://react-spectrum.adobe.com/react-spectrum/SearchField.html#help-text');
    }
  }

  let state = useSearchFieldState(props);
  let inputRef = useRef<HTMLInputElement>(null);
  let {clearButtonProps, ...result} = useSearchField(props, state, inputRef);

  let clearButton = (
    <ClearButton
      {...clearButtonProps}
      preventFocus
      UNSAFE_className={
        classNames(
          styles,
          'spectrum-ClearButton'
        )
      }
      isDisabled={isDisabled} />
  );

  let validationState = props.validationState || (result.isInvalid ? 'invalid' : undefined);

  return (
    <TextFieldBase
      {...otherProps}
      {...result}
      validationState={validationState}
      UNSAFE_className={
        classNames(
          styles,
          'spectrum-Search',
          'spectrum-Textfield',
          {
            'is-disabled': isDisabled,
            'is-quiet': props.isQuiet,
            'spectrum-Search--invalid': validationState === 'invalid' && !isDisabled,
            'spectrum-Search--valid': validationState === 'valid' && !isDisabled
          },
          UNSAFE_className
        )
      }
      inputClassName={classNames(styles, 'spectrum-Search-input')}
      ref={ref}
      inputRef={inputRef}
      isDisabled={isDisabled}
      icon={icon}
      wrapperChildren={(state.value !== '' && !props.isReadOnly) ? clearButton : undefined} />
  );
}

/**
 * A SearchField is a text field designed for searches.
 */
let _SearchField = forwardRef(SearchField) as (props: SpectrumSearchFieldProps & {ref?: Ref<TextFieldRef>}) => ReactElement;
export {_SearchField as SearchField};
