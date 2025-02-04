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

import {useCallback, useMemo} from 'react';
import {useCollator} from './useCollator';

export interface Filter {
  /** Returns whether a string starts with a given substring. */
  startsWith(string: string, substring: string): boolean,
  /** Returns whether a string ends with a given substring. */
  endsWith(string: string, substring: string): boolean,
  /** Returns the index of the first occurrence of a substring in a string, or -1 if not found. */
  indexOf(string: string, substring: string): number,
  /** Returns whether a string contains a given substring. */
  contains(string: string, substring: string): boolean
}

/**
 * Provides localized string search functionality that is useful for filtering or matching items
 * in a list. Options can be provided to adjust the sensitivity to case, diacritics, and other parameters.
 */
export function useFilter(options?: Intl.CollatorOptions): Filter {
  let collator = useCollator({
    usage: 'search',
    ...options
  });

  // TODO(later): these methods don't currently support the ignorePunctuation option.
  let startsWith = useCallback((string, substring) => {
    if (substring.length === 0) {
      return true;
    }

    // Normalize both strings so we can slice safely
    // TODO: take into account the ignorePunctuation option as well...
    string = string.normalize('NFC');
    substring = substring.normalize('NFC');
    return collator.compare(string.slice(0, substring.length), substring) === 0;
  }, [collator]);

  let endsWith = useCallback((string, substring) => {
    if (substring.length === 0) {
      return true;
    }

    string = string.normalize('NFC');
    substring = substring.normalize('NFC');
    return collator.compare(string.slice(-substring.length), substring) === 0;
  }, [collator]);

  let indexOf = useCallback((string: string, substring: string) => {
    if (substring.length === 0) {
      return 0;
    }

    string = string.normalize('NFC');
    substring = substring.normalize('NFC');

    let sliceLen = substring.length;
    let strLen = string.length;
    for (let scan = 0; scan + sliceLen <= strLen; scan++) {
      let slice = string.slice(scan, scan + sliceLen);
      if (collator.compare(substring, slice) === 0) {
        return scan;
      }
    }

    return -1;
  }, [collator]);

  let contains = useCallback((string, substring) => {
    return indexOf(string, substring) !== -1;
  }, [indexOf]);

  return useMemo(() => ({
    startsWith,
    endsWith,
    indexOf,
    contains
  }), [startsWith, endsWith, indexOf, contains]);
}
