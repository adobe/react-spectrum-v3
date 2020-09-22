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

import React from 'react';
import {renderHook} from '@testing-library/react-hooks';
import {useHexColorField} from '../';

describe('useHexColorField', function () {
  let ref;

  beforeEach(() => {
    ref = React.createRef();
  });

  const renderHexColorFieldHook = (props, state = {}) => {
    let {result} = renderHook(() => useHexColorField({
      'aria-label': 'Primary Color',
      ...props
    }, state, ref));
    return result.current;
  };

  it('handles defaults', function () {
    const {inputFieldProps} = renderHexColorFieldHook({});
    expect(inputFieldProps.type).toBe('text');
    expect(inputFieldProps.autoComplete).toBe('off');
    expect(inputFieldProps.id).toBeTruthy();
    expect(inputFieldProps.role).toBe('spinbutton');
    expect(inputFieldProps['aria-required']).toBeUndefined();
    expect(inputFieldProps['aria-invalid']).toBeUndefined();
    expect(inputFieldProps.disabled).toBe(false);
    expect(inputFieldProps.readOnly).toBe(false);
  });

  it('should return props for label', function () {
    const {labelProps, inputFieldProps} = renderHexColorFieldHook({
      'aria-label': undefined,
      label: 'Secondary Color'
    });
    expect(labelProps.id).toBeTruthy();
    expect(labelProps.htmlFor).toBe(inputFieldProps.id);
    expect(inputFieldProps.id).toBeTruthy();
    expect(inputFieldProps['aria-labelledby']).toBe(labelProps.id);
    expect(inputFieldProps['aria-label']).toBeUndefined(); // because label prop is provided instead of aria-label
    expect(typeof inputFieldProps.onChange).toBe('function');
    expect(typeof inputFieldProps.onBlur).toBe('function');
    expect(typeof inputFieldProps.onFocus).toBe('function');
    expect(typeof inputFieldProps.onKeyDown).toBe('function');
  });

  it('should return prop for invalid', function () {
    const {inputFieldProps} = renderHexColorFieldHook({validationState: 'invalid'});
    expect(inputFieldProps['aria-invalid']).toBe(true);
  });
  
  it('should return prop for required', function () {
    const {inputFieldProps} = renderHexColorFieldHook({isRequired: true});
    expect(inputFieldProps['aria-required']).toBe(true);
  });
  
  it('should return prop for readonly', function () {
    const {inputFieldProps} = renderHexColorFieldHook({isReadOnly: true});
    expect(inputFieldProps.readOnly).toBe(true);
  });

  it('should return prop for disabled', function () {
    const {inputFieldProps} = renderHexColorFieldHook({isDisabled: true});
    expect(inputFieldProps.disabled).toBe(true);
  });
});
