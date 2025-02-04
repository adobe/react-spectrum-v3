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

import {getOwnerDocument, useEffectEvent} from '@react-aria/utils';
import {RefObject} from '@react-types/shared';
import {useEffect, useRef} from 'react';

export interface InteractOutsideProps {
  ref: RefObject<Element | null>,
  onInteractOutside?: (e: PointerEvent) => void,
  onInteractOutsideStart?: (e: PointerEvent) => void,
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

  let onPointerDown = useEffectEvent((e) => {
    if (onInteractOutside && isValidEvent(e, ref)) {
      if (onInteractOutsideStart) {
        onInteractOutsideStart(e);
      }
      stateRef.current.isPointerDown = true;
    }
  });

  let triggerInteractOutside = useEffectEvent((e: PointerEvent) => {
    if (onInteractOutside) {
      onInteractOutside(e);
    }
  });

  useEffect(() => {
    let state = stateRef.current;
    if (isDisabled) {
      return;
    }

    const element = ref.current;
    const documentObject = getOwnerDocument(element);

    // Use pointer events if available. Otherwise, fall back to mouse and touch events.
    if (typeof PointerEvent !== 'undefined') {
      let onPointerUp = (e) => {
        if (state.isPointerDown && isValidEvent(e, ref)) {
          triggerInteractOutside(e);
        }
        state.isPointerDown = false;
      };

      // changing these to capture phase fixed combobox
      documentObject.addEventListener('pointerdown', onPointerDown, true);
      documentObject.addEventListener('pointerup', onPointerUp, true);

      return () => {
        documentObject.removeEventListener('pointerdown', onPointerDown, true);
        documentObject.removeEventListener('pointerup', onPointerUp, true);
      };
    } else {
      let onMouseUp = (e) => {
        if (state.ignoreEmulatedMouseEvents) {
          state.ignoreEmulatedMouseEvents = false;
        } else if (state.isPointerDown && isValidEvent(e, ref)) {
          triggerInteractOutside(e);
        }
        state.isPointerDown = false;
      };

      let onTouchEnd = (e) => {
        state.ignoreEmulatedMouseEvents = true;
        if (state.isPointerDown && isValidEvent(e, ref)) {
          triggerInteractOutside(e);
        }
        state.isPointerDown = false;
      };

      documentObject.addEventListener('mousedown', onPointerDown, true);
      documentObject.addEventListener('mouseup', onMouseUp, true);
      documentObject.addEventListener('touchstart', onPointerDown, true);
      documentObject.addEventListener('touchend', onTouchEnd, true);

      return () => {
        documentObject.removeEventListener('mousedown', onPointerDown, true);
        documentObject.removeEventListener('mouseup', onMouseUp, true);
        documentObject.removeEventListener('touchstart', onPointerDown, true);
        documentObject.removeEventListener('touchend', onTouchEnd, true);
      };
    }
  }, [ref, isDisabled, onPointerDown, triggerInteractOutside]);
}

function isValidEvent(event, ref) {
  if (event.button > 0) {
    return false;
  }
  if (event.target) {
    // if the event target is no longer in the document, ignore
    const ownerDocument = event.target.ownerDocument;
    if (!ownerDocument || !ownerDocument.documentElement.contains(event.target)) {
      return false;
    }
    // If the target is within a top layer element (e.g. toasts), ignore.
    if (event.target.closest('[data-react-aria-top-layer]')) {
      return false;
    }
  }

  if (!ref.current) {
    return false;
  }

  // When the event source is inside a Shadow DOM, event.target is just the shadow root.
  // Using event.composedPath instead means we can get the actual element inside the shadow root.
  // This only works if the shadow root is open, there is no way to detect if it is closed.
  // If the event composed path contains the ref, interaction is inside.
  return !event.composedPath().includes(ref.current);
}
