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

import {actHook as act, renderHook} from '@react-spectrum/test-utils-internal';
import {useToastState} from '../';

describe('useToastState', () => {
  let newValue = [{
    content: 'Toast Message',
    props: {timeout: 0}
  }];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => jest.runAllTimers());
  });

  it('should add a new toast via add', () => {
    let {result} = renderHook(() => useToastState());
    expect(result.current.visibleToasts).toStrictEqual([]);

    act(() => {result.current.add(newValue[0].content, newValue[0].props);});
    expect(result.current.visibleToasts).toHaveLength(1);
    expect(result.current.visibleToasts[0].content).toBe(newValue[0].content);
    expect(result.current.visibleToasts[0].timeout).toBe(0);
    expect(result.current.visibleToasts[0].timer).toBe(undefined);
    expect(result.current.visibleToasts[0]).toHaveProperty('key');
  });

  it('should add a new toast with a timer', () => {
    let {result} = renderHook(() => useToastState());
    expect(result.current.visibleToasts).toStrictEqual([]);

    act(() => {result.current.add('Test', {timeout: 5000});});
    expect(result.current.visibleToasts).toHaveLength(1);
    expect(result.current.visibleToasts[0].content).toBe('Test');
    expect(result.current.visibleToasts[0].timeout).toBe(5000);
    expect(result.current.visibleToasts[0].timer).not.toBe(undefined);
    expect(result.current.visibleToasts[0]).toHaveProperty('key');
  });

  it('should be able to add multiple toasts', () => {
    let secondToast = {
      content: 'Second Toast',
      props: {timeout: 0}
    };
    let {result} = renderHook(() => useToastState({maxVisibleToasts: 2}));
    expect(result.current.visibleToasts).toStrictEqual([]);

    act(() => {result.current.add(newValue[0].content, newValue[0].props);});
    expect(result.current.visibleToasts[0].content).toBe(newValue[0].content);

    act(() => {result.current.add(secondToast.content, secondToast.props);});
    expect(result.current.visibleToasts.length).toBe(2);
    expect(result.current.visibleToasts[0].content).toBe(newValue[0].content);
    expect(result.current.visibleToasts[1].content).toBe(secondToast.content);
  });

  it('should be able to display three toasts and remove the middle toast via timeout then the visible toast', () => {
    let {result} = renderHook(() => useToastState({maxVisibleToasts: 3}));

    // Add the first toast
    act(() => {
      result.current.add('First Toast', {timeout: 0});
    });
    expect(result.current.visibleToasts).toHaveLength(1);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');

    // Add the second toast
    act(() => {
      result.current.add('Second Toast', {timeout: 1000});
    });
    expect(result.current.visibleToasts).toHaveLength(2);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');

    result.current.resumeAll();

    // Add the third toast
    act(() => {
      result.current.add('Third Toast', {timeout: 0});
    });
    expect(result.current.visibleToasts).toHaveLength(3);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');
    expect(result.current.visibleToasts[1].content).toBe('Second Toast');
    expect(result.current.visibleToasts[2].content).toBe('Third Toast');

    act(() => jest.advanceTimersByTime(500));
    expect(result.current.visibleToasts).toHaveLength(3);

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.visibleToasts).toHaveLength(2);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');
    expect(result.current.visibleToasts[1].content).toBe('Third Toast');

    act(() => {result.current.close(result.current.visibleToasts[0].key);});
    expect(result.current.visibleToasts.length).toBe(1);
    expect(result.current.visibleToasts[0].content).toBe('Third Toast');
  });

  it('should be able to display one toast, add multiple toasts, and remove the middle not visible one programmatically', () => {
    let {result} = renderHook(() => useToastState());

    // Add the first toast
    act(() => {
      result.current.add('First Toast', {timeout: 0});
    });
    expect(result.current.visibleToasts).toHaveLength(1);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');

    let secondToastKey = null;
    // Add the second toast
    act(() => {
      secondToastKey = result.current.add('Second Toast', {timeout: 0});
    });
    expect(result.current.visibleToasts).toHaveLength(1);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');

    // Add the third toast
    act(() => {
      result.current.add('Third Toast', {timeout: 0});
    });
    expect(result.current.visibleToasts).toHaveLength(1);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');

    // Remove a toast that isn't visible
    act(() => {result.current.close(secondToastKey);});
    expect(result.current.visibleToasts).toHaveLength(1);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');

    // Remove the visible toast to confirm the middle toast was removed
    act(() => {result.current.close(result.current.visibleToasts[0].key);});
    expect(result.current.visibleToasts.length).toBe(1);
    expect(result.current.visibleToasts[0].content).toBe('Third Toast');
  });

  it('should be able to display one toast, add multiple toasts', () => {
    let {result} = renderHook(() => useToastState());

    // Add the first toast
    act(() => {
      result.current.add('First Toast', {timeout: 0});
    });
    expect(result.current.visibleToasts).toHaveLength(1);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');

    // Add the second toast
    act(() => {
      result.current.add('Second Toast', {timeout: 0});
    });
    expect(result.current.visibleToasts).toHaveLength(1);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');

    // Add the third toast
    act(() => {
      result.current.add('Third Toast', {timeout: 0});
    });
    expect(result.current.visibleToasts).toHaveLength(1);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');
  });

  it('should maintain the toast queue order on close', () => {
    let {result} = renderHook(() => useToastState({maxVisibleToasts: 3}));

    act(() => {result.current.add('First Toast');});
    expect(result.current.visibleToasts).toHaveLength(1);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');

    act(() => {result.current.add('Second Toast');});
    expect(result.current.visibleToasts).toHaveLength(2);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');
    expect(result.current.visibleToasts[1].content).toBe('Second Toast');

    act(() => {result.current.add('Third Toast');});
    expect(result.current.visibleToasts).toHaveLength(3);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');
    expect(result.current.visibleToasts[1].content).toBe('Second Toast');
    expect(result.current.visibleToasts[2].content).toBe('Third Toast');

    act(() => {result.current.close(result.current.visibleToasts[1].key);});
    expect(result.current.visibleToasts).toHaveLength(2);
    expect(result.current.visibleToasts[0].content).toBe('First Toast');
    expect(result.current.visibleToasts[1].content).toBe('Third Toast');
  });

  it('should close a toast', () => {
    let {result} = renderHook(() => useToastState());
    act(() => {result.current.add(newValue[0].content, newValue[0].props);});

    act(() => {result.current.close(result.current.visibleToasts[0].key);});
    expect(result.current.visibleToasts).toStrictEqual([]);
  });

  it('should queue toasts', () => {
    let {result} = renderHook(() => useToastState());
    expect(result.current.visibleToasts).toStrictEqual([]);

    act(() => {result.current.add(newValue[0].content, newValue[0].props);});
    expect(result.current.visibleToasts[0].content).toBe(newValue[0].content);

    act(() => {result.current.add('Second Toast');});
    expect(result.current.visibleToasts.length).toBe(1);
    expect(result.current.visibleToasts[0].content).toBe(newValue[0].content);

    act(() => {result.current.close(result.current.visibleToasts[0].key);});
    expect(result.current.visibleToasts.length).toBe(1);
    expect(result.current.visibleToasts[0].content).toBe('Second Toast');
  });

  it('should queue toasts with priority', () => {
    let {result} = renderHook(() => useToastState());
    expect(result.current.visibleToasts).toStrictEqual([]);

    act(() => {result.current.add(newValue[0].content, newValue[0].props);});
    expect(result.current.visibleToasts[0].content).toBe(newValue[0].content);

    act(() => {result.current.add('Second Toast', {priority: 1});});
    expect(result.current.visibleToasts.length).toBe(1);
    expect(result.current.visibleToasts[0].content).toBe('Second Toast');

    act(() => {result.current.close(result.current.visibleToasts[0].key);});
    expect(result.current.visibleToasts.length).toBe(1);
    expect(result.current.visibleToasts[0].content).toBe(newValue[0].content);
  });
});
