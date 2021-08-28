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
import {useTag} from '../';

describe.skip('useTag tests', () => {
  it('handles defaults', () => {
    let props = {};
    let {result} = renderHook(() => useTag(props));
    expect(result.current.tagProps.onKeyDown).toBeDefined();
    expect(result.current.tagProps['aria-selected']).not.toBeDefined();
    expect(result.current.tagProps['aria-invalid']).not.toBeDefined();
    expect(result.current.clearButtonProps.onPress).toBeDefined();
    expect(result.current.labelProps.id).toBeDefined();
  });

  it('set correct aria if it is invalid', () => {
    let props = {validationState: 'invalid'};
    let {result} = renderHook(() => useTag(props));
    expect(result.current.tagProps['aria-invalid']).toBe(true);
  });

  it('set correct aria if it is selected', () => {
    let props = {isSelected: true};
    let hook = renderHook(() => useTag(props));
    expect(hook.result.current.tagProps['aria-selected']).toBe(true);

    props = {isSelected: true, isDisabled: true};
    hook = renderHook(() => useTag(props));
    expect(hook.result.current.tagProps['aria-selected']).toBe(false);
  });

  it('handles isDisabled flag', () => {
    let props = {isDisabled: true};
    let {result} = renderHook(() => useTag(props));
    expect(result.current.tagProps.onKeyDown).toBe(null);
    expect(result.current.tagProps.tabIndex).toBe(-1);
    expect(result.current.clearButtonProps.isDisabled).toBe(true);
  });
});
