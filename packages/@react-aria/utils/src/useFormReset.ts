/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {RefObject} from '@react-types/shared';
import {useEffect, useRef} from 'react';
import {useEffectEvent} from './useEffectEvent';

export function useFormReset<T>(
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null> | undefined,
  initialValue: T,
  onReset: (value: T) => void
) {
  let resetValue = useRef(initialValue);
  let handleReset = useEffectEvent((e: Event) => {
    if (onReset && !e.defaultPrevented) {
      onReset(resetValue.current);
    }
  });

  useEffect(() => {
    let form = ref?.current?.form;
    form?.addEventListener('reset', handleReset);
    return () => {
      form?.removeEventListener('reset', handleReset);
    };
  }, [ref, handleReset]);
}
