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

import {DOMPropsResponderContext} from './DOMPropsContext';
import {HoverProps} from './useHover';
import React, {ForwardedRef, ReactNode, useEffect, useRef} from 'react';
import {useObjectRef} from '@react-aria/utils';

interface DOMPropsResponderProps extends HoverProps {
  children: ReactNode
}

export const DOMPropsResponder = React.forwardRef(({children, ...props}: DOMPropsResponderProps, ref: ForwardedRef<Element>) => {
  let isRegistered = useRef(false);
  let objRef = useObjectRef(ref);
  let context = {
    ...props,
    ref: objRef,
    register() {
      isRegistered.current = true;
    }
  };

  // TODO: Think of a more generic message when this replaces the PressResponder as well
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (!isRegistered.current) {
        console.warn(
        'A DOMPropsResponder was ultilized without a hoverable DOM node.'
      );
      }
    }
  }, []);

  return (
    <DOMPropsResponderContext.Provider value={context}>
      {children}
    </DOMPropsResponderContext.Provider>
  );
});
