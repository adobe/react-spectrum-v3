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

// Portions of the code in this file are based on code from react.
// Original licensing for the following can be found in the
// NOTICE file in the root directory of this source tree.
// See https://github.com/facebook/react/tree/cc7c1aece46a6b69b41958d731e0fd27c94bfc6c/packages/react-interactions

import {RefObject, SyntheticEvent, useEffect, useRef} from 'react';

interface InteractOutsideProps {
  ref: RefObject<Element>,
  onInteractOutside?: (e: SyntheticEvent) => void,
  onInteractOutsideStart?: (e: SyntheticEvent) => void,
  /** Whether the interact outside events should be disabled. */
  isDisabled?: boolean
}

/**
 * Example, used in components like Dialogs and Popovers so they can close
 * when a user clicks outside them.
 */
export function useInteractOutside(props: InteractOutsideProps) {
  let {ref, onInteractOutside, isDisabled, onInteractOutsideStart} = props;
  let stateRef = useRef({
    isPointerDown: false,
    ignoreEmulatedMouseEvents: false
  });
  let state = stateRef.current;

  useEffect(() => {
    let onPointerDown = (e) => {
      if (isDisabled) {
        return;
      }
      if (isValidEvent(e, ref) && onInteractOutside) {
        if (onInteractOutsideStart) {
          onInteractOutsideStart(e);
        }
        state.isPointerDown = true;
      }
    };

    // Use pointer events if available. Otherwise, fall back to mouse and touch events.
    if (typeof PointerEvent !== 'undefined') {
      let onPointerUp = (e) => {
        if (isDisabled) {
          return;
        }
        if (state.isPointerDown && onInteractOutside && isValidEvent(e, ref)) {
          state.isPointerDown = false;
          onInteractOutside(e);
        }
      };

      // changing these to capture phase fixed combobox
      document.addEventListener('pointerdown', onPointerDown, true);
      document.addEventListener('pointerup', onPointerUp, true);

      return () => {
        document.removeEventListener('pointerdown', onPointerDown, true);
        document.removeEventListener('pointerup', onPointerUp, true);
      };
    } else {
      let onMouseUp = (e) => {
        if (isDisabled) {
          return;
        }
        if (state.ignoreEmulatedMouseEvents) {
          state.ignoreEmulatedMouseEvents = false;
        } else if (state.isPointerDown && onInteractOutside && isValidEvent(e, ref)) {
          state.isPointerDown = false;
          onInteractOutside(e);
        }
      };

      let onTouchEnd = (e) => {
        if (isDisabled) {
          return;
        }
        state.ignoreEmulatedMouseEvents = true;
        if (onInteractOutside && state.isPointerDown && isValidEvent(e, ref)) {
          state.isPointerDown = false;
          onInteractOutside(e);
        }
      };

      document.addEventListener('mousedown', onPointerDown, true);
      document.addEventListener('mouseup', onMouseUp, true);
      document.addEventListener('touchstart', onPointerDown, true);
      document.addEventListener('touchend', onTouchEnd, true);

      return () => {
        document.removeEventListener('mousedown', onPointerDown, true);
        document.removeEventListener('mouseup', onMouseUp, true);
        document.removeEventListener('touchstart', onPointerDown, true);
        document.removeEventListener('touchend', onTouchEnd, true);
      };
    }
  }, [onInteractOutside, ref, state, isDisabled, onInteractOutsideStart]);
}

function isValidEvent(event, ref) {
  if (event.button > 0) {
    return false;
  }

  // if the event target is no longer in the document
  if (event.target) {
    const ownerDocument = event.target.ownerDocument;
    if (!ownerDocument || !ownerDocument.documentElement.contains(event.target)) {
      return false;
    }
  }

  return ref.current && !ref.current.contains(event.target);
}
