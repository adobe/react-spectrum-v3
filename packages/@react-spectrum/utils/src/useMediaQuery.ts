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

import {useEffect, useState} from 'react';
import {useIsSSR} from '@react-aria/ssr';

export function useMediaQuery(query: string): boolean {
  let supportsMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  let [matches, setMatches] = useState(() =>
    supportsMatchMedia
      ? window.matchMedia(query).matches
      : false
  );

  useEffect(() => {
    if (!supportsMatchMedia) {
      return;
    }

    let mq = window.matchMedia(query);
    let onChange = (evt) => {
      setMatches(evt.matches);
    };

    mq.addListener(onChange);
    return () => {
      mq.removeListener(onChange);
    };
  }, [supportsMatchMedia, query]);

  // If in SSR, the media query should never match. Once the page hydrates,
  // this will update and the real value will be returned.
  let isSSR = useIsSSR();
  return isSSR ? false : matches;
}
