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

import {renderHook} from '@testing-library/react-hooks';
import {useField} from '../';

describe('useField', function () {
  let renderFieldHook = (fieldProps) => {
    let {result} = renderHook(() => useField(fieldProps));
    return result.current;
  };

  it('should return label props', function () {
    let {labelProps, fieldProps} = renderFieldHook({label: 'Test'});
    expect(labelProps.id).toBeDefined();
    expect(fieldProps.id).toBeDefined();
  });

  it('should return props for description and error message if they are passed in', function () {
    let {descriptionProps, errorMessageProps} = renderFieldHook({label: 'Test', description: 'Description', errorMessage: 'Error'});
    expect(descriptionProps.id).toBeDefined();
    expect(errorMessageProps.id).toBeDefined();
  });

  it('should not return props for description and error message if they are not passed in', function () {
    let {descriptionProps, errorMessageProps} = renderFieldHook({label: 'Test'});
    expect(descriptionProps).toEqual({});
    expect(errorMessageProps).toEqual({});
  });
});
