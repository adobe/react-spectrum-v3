/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {MutableRefObject, useCallback, useMemo, useRef} from 'react';

/**
 * Offers an object ref for a given callback ref or an object ref. Especially
 * helfpul when passing forwarded refs (created using `React.forwardRef`) to
 * React Aria hooks.
 *
 * @param ref The original ref intended to be used.
 * @returns An object ref that updates the given ref.
 * @see https://react.dev/reference/react/forwardRef
 */
export function useObjectRef<T>(ref?: ((instance: T | null) => (() => void) | void) | MutableRefObject<T | null> | null): MutableRefObject<T | null> {
  const objRef: MutableRefObject<T | null> = useRef<T>(null);
  const cleanupRef: MutableRefObject<(() => void) | void> = useRef(undefined);

  const refEffect = useCallback(
    (instance: T | null) => {
      if (typeof ref === 'function') {
        const refCallback = ref;
        const refCleanup = refCallback(instance);
        return () => {
          if (typeof refCleanup === 'function') {
            refCleanup();
          } else {
            refCallback(null);
          }
        };
      } else if (ref) {
        ref.current = instance;
        return () => {
          ref.current = null;
        };
      }
    },
    [ref]
  );

  return useMemo(
    () => ({
      get current() {
        return objRef.current;
      },
      set current(value) {
        objRef.current = value;
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = undefined;
        }

        if (value != null) {
          cleanupRef.current = refEffect(value);
        }
      }
    }),
    [refEffect]
  );
}
