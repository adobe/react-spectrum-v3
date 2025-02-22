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

import {MutableRefObject, Ref} from 'react';

/**
 * Merges multiple refs into one. Works with either callback or object refs.
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | MutableRefObject<T> | null | undefined>): Ref<T> {
  if (refs.length === 1 && refs[0]) {
    return refs[0];
  }

  return (value: T | null) => {
    let hasCleanup = false;

    const cleanups = refs.map(ref => {
      const cleanup = setRef(ref, value);
      hasCleanup ||= typeof cleanup == 'function';
      return cleanup;
    });

    if (hasCleanup) {
      return () => {
        cleanups.forEach((cleanup, i) => {
          if (typeof cleanup === 'function') {
            cleanup();
          } else {
            setRef(refs[i], null);
          }
        });
      };
    }
  };
}

function setRef<T>(ref: Ref<T> | MutableRefObject<T> | null | undefined, value: T) {
  if (typeof ref === 'function') {
    return ref(value);
  } else if (ref != null) {
    ref.current = value;
  }
}
