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

import {FocusableElement} from '@react-types/shared';
import {mergeProps, useObjectRef, useSyncRef} from '@react-aria/utils';
import {PressProps} from './usePress';
import {PressResponderContext} from './context';
import React, {ForwardedRef, ReactNode, useContext, useEffect, useMemo, useRef} from 'react';

interface PressResponderProps extends PressProps {
  children: ReactNode
}

export const PressResponder = React.forwardRef(({children, ...props}: PressResponderProps, ref: ForwardedRef<FocusableElement>) => {
  let isRegistered = useRef(false);
  let prevContext = useContext(PressResponderContext);
  ref = useObjectRef(ref || prevContext?.ref);
  let context = mergeProps(prevContext || {}, {
    ...props,
    ref,
    register() {
      isRegistered.current = true;
      if (prevContext) {
        prevContext.register();
      }
    }
  });

  useSyncRef(prevContext, ref);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (!isRegistered.current) {
        console.warn(
        'A PressResponder was rendered without a pressable child. ' +
        'Either call the usePress hook, or wrap your DOM node with <Pressable> component.'
      );
        isRegistered.current = true; // only warn once in strict mode.
      }
    }
  }, []);

  return (
    <PressResponderContext.Provider value={context}>
      {children}
    </PressResponderContext.Provider>
  );
});

export function ClearPressResponder({children}: {children: ReactNode}) {
  let context = useMemo(() => ({register: () => {}}), []);
  return (
    <PressResponderContext.Provider value={context}>
      {children}
    </PressResponderContext.Provider>
  );
}
