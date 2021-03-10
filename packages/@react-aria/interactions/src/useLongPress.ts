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

import {PressEvent} from '@react-types/shared';
import {usePress} from './usePress';
import {useRef} from 'react';

export interface LongPressHookProps {
  onLongPress: (e: PressEvent) => void,
  onPressStart?: (e: PressEvent) => void,
  triggerThreshold?: number
}

export const LONG_PRESS_DEFAULT_THRESHOLD_IN_MS = 500;

export function useLongPress(props : LongPressHookProps) {
  let {
    onPressStart,
    onLongPress,
    triggerThreshold
  } = props;
  
  triggerThreshold = triggerThreshold || LONG_PRESS_DEFAULT_THRESHOLD_IN_MS;

  const timeRef = useRef(null);

  let {pressProps} = usePress({
    onPressStart(e) {
      if (e.pointerType === 'mouse' || e.pointerType === 'touch') {
        if (onPressStart) {
          onPressStart(e);
        }

        timeRef.current = setTimeout(() => {
          onLongPress(e);
          timeRef.current = null;
        }, triggerThreshold);
      }
    },
    onPressEnd() { 
      if (timeRef.current) {
        clearTimeout(timeRef.current);
      }
    }
  });
  
  return pressProps;
}
