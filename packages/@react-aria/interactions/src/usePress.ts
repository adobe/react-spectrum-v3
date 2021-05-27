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

import {disableTextSelection, restoreTextSelection} from './textSelection';
import {focusWithoutScrolling, mergeProps, useGlobalListeners, useSyncRef} from '@react-aria/utils';
import {HTMLAttributes, RefObject, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {isVirtualClick} from './utils';
import {PointerType, PressEvents} from '@react-types/shared';
import {PressResponderContext} from './context';

export interface PressProps extends PressEvents {
  /** Whether the target is in a controlled press state (e.g. an overlay it triggers is open). */
  isPressed?: boolean,
  /** Whether the press events should be disabled. */
  isDisabled?: boolean,
  /** Whether the target should not receive focus on press. */
  preventFocusOnPress?: boolean
}

export interface PressHookProps extends PressProps {
  /** A ref to the target element. */
  ref?: RefObject<HTMLElement>
}

interface PressState {
  isPressed: boolean,
  ignoreEmulatedMouseEvents: boolean,
  ignoreClickAfterPress: boolean,
  didFirePressStart: boolean,
  activePointerId: any,
  target: HTMLElement | null,
  targetRect: DOMRect | null,
  isOverTarget: boolean,
  pointerType: PointerType,
  userSelect?: string
}

interface EventBase {
  currentTarget: EventTarget,
  shiftKey: boolean,
  ctrlKey: boolean,
  metaKey: boolean
}

export interface PressResult {
  /** Whether the target is currently pressed. */
  isPressed: boolean,
  /** Props to spread on the target element. */
  pressProps: HTMLAttributes<HTMLElement>
}

function usePressResponderContext(props: PressHookProps): PressHookProps {
  // Consume context from <PressResponder> and merge with props.
  let context = useContext(PressResponderContext);
  if (context) {
    let {register, ...contextProps} = context;
    props = mergeProps(contextProps, props) as PressHookProps;
    register();
  }
  useSyncRef(context, props.ref);

  return props;
}

/**
 * Handles press interactions across mouse, touch, keyboard, and screen readers.
 * It normalizes behavior across browsers and platforms, and handles many nuances
 * of dealing with pointer and keyboard events.
 */
export function usePress(props: PressHookProps): PressResult {
  let {
    onPress,
    onPressChange,
    onPressStart,
    onPressEnd,
    onPressUp,
    isDisabled,
    isPressed: isPressedProp,
    preventFocusOnPress,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ref: _, // Removing `ref` from `domProps` because TypeScript is dumb,
    ...domProps
  } = usePressResponderContext(props);
  let propsRef = useRef<PressHookProps>(null);
  propsRef.current = {onPress, onPressChange, onPressStart, onPressEnd, onPressUp, isDisabled};

  let [isPressed, setPressed] = useState(false);
  let ref = useRef<PressState>({
    isPressed: false,
    ignoreEmulatedMouseEvents: false,
    ignoreClickAfterPress: false,
    didFirePressStart: false,
    activePointerId: null,
    target: null,
    isOverTarget: false,
    pointerType: null,
    targetRect: null
  });

  let {addGlobalListener, removeAllGlobalListeners} = useGlobalListeners();

  let pressProps = useMemo(() => {
    let state = ref.current;
    let triggerPressStart = (originalEvent: EventBase, pointerType: PointerType) => {
      let {onPressStart, onPressChange, isDisabled} = propsRef.current;
      if (isDisabled || state.didFirePressStart) {
        return;
      }

      if (onPressStart) {
        onPressStart({
          type: 'pressstart',
          pointerType,
          target: originalEvent.currentTarget as HTMLElement,
          shiftKey: originalEvent.shiftKey,
          metaKey: originalEvent.metaKey,
          ctrlKey: originalEvent.ctrlKey
        });
      }

      if (onPressChange) {
        onPressChange(true);
      }

      state.didFirePressStart = true;
      setPressed(true);
    };

    let triggerPressEnd = (originalEvent: EventBase, pointerType: PointerType, wasPressed = true) => {
      let {onPressEnd, onPressChange, onPress, isDisabled} = propsRef.current;
      if (!state.didFirePressStart) {
        return;
      }

      state.ignoreClickAfterPress = true;
      state.didFirePressStart = false;

      if (onPressEnd) {
        onPressEnd({
          type: 'pressend',
          pointerType,
          target: originalEvent.currentTarget as HTMLElement,
          shiftKey: originalEvent.shiftKey,
          metaKey: originalEvent.metaKey,
          ctrlKey: originalEvent.ctrlKey
        });
      }

      if (onPressChange) {
        onPressChange(false);
      }

      setPressed(false);

      if (onPress && wasPressed && !isDisabled) {
        onPress({
          type: 'press',
          pointerType,
          target: originalEvent.currentTarget as HTMLElement,
          shiftKey: originalEvent.shiftKey,
          metaKey: originalEvent.metaKey,
          ctrlKey: originalEvent.ctrlKey
        });
      }
    };

    let triggerPressUp = (originalEvent: EventBase, pointerType: PointerType) => {
      let {onPressUp, isDisabled} = propsRef.current;
      if (isDisabled) {
        return;
      }

      if (onPressUp) {
        onPressUp({
          type: 'pressup',
          pointerType,
          target: originalEvent.currentTarget as HTMLElement,
          shiftKey: originalEvent.shiftKey,
          metaKey: originalEvent.metaKey,
          ctrlKey: originalEvent.ctrlKey
        });
      }
    };

    let cancel = (e: EventBase) => {
      if (state.isPressed) {
        if (state.isOverTarget) {
          triggerPressEnd(createEvent(state.target, e), state.pointerType, false);
        }
        state.isPressed = false;
        state.isOverTarget = false;
        state.activePointerId = null;
        state.pointerType = null;
        removeAllGlobalListeners();
        restoreTextSelection();
      }
    };

    let pressProps: HTMLAttributes<HTMLElement> = {
      onKeyDown(e) {
        if (isValidKeyboardEvent(e.nativeEvent)) {
          e.preventDefault();
          e.stopPropagation();


          // If the event is repeating, it may have started on a different element
          // after which focus moved to the current element. Ignore these events and
          // only handle the first key down event.
          if (!state.isPressed && !e.repeat) {
            state.target = e.currentTarget as HTMLElement;
            state.targetRect = e.currentTarget.getBoundingClientRect();
            state.isPressed = true;
            triggerPressStart(e, 'keyboard');

            // Focus may move before the key up event, so register the event on the document
            // instead of the same element where the key down event occurred.
            addGlobalListener(document, 'keyup', onKeyUp, false);
          }
        }
      },
      onKeyUp(e) {
        if (isValidKeyboardEvent(e.nativeEvent) && !e.repeat) {
          triggerPressUp(createEvent(state.target, e), 'keyboard');
        }
      },
      onClick(e) {
        if (e && e.button === 0) {
          e.stopPropagation();
          if (isDisabled) {
            e.preventDefault();
          }

          // If triggered from a screen reader or by using element.click(),
          // trigger as if it were a keyboard click.
          if (!state.ignoreClickAfterPress && !state.ignoreEmulatedMouseEvents && isVirtualClick(e.nativeEvent)) {
            // Ensure the element receives focus (VoiceOver on iOS does not do this)
            if (!isDisabled && !preventFocusOnPress) {
              focusWithoutScrolling(e.currentTarget);
            }

            triggerPressStart(e, 'virtual');
            triggerPressUp(e, 'virtual');
            triggerPressEnd(e, 'virtual');
          }

          state.ignoreEmulatedMouseEvents = false;
          state.ignoreClickAfterPress = false;
        }
      }
    };

    let onKeyUp = (e: KeyboardEvent) => {
      if (state.isPressed && isValidKeyboardEvent(e)) {
        e.preventDefault();
        e.stopPropagation();

        state.isPressed = false;
        triggerPressEnd(createEvent(state.target, e), 'keyboard', e.target === state.target);
        removeAllGlobalListeners();

        // If the target is a link, trigger the click method to open the URL,
        // but defer triggering pressEnd until onClick event handler.
        if (e.target === state.target && isHTMLAnchorLink(state.target) || state.target.getAttribute('role') === 'link') {
          state.target.click();
        }
      }
    };

    if (typeof PointerEvent !== 'undefined') {
      pressProps.onPointerDown = (e) => {
        // Only handle left clicks
        if (e.button !== 0) {
          return;
        }

        // Due to browser inconsistencies, especially on mobile browsers, we prevent
        // default on pointer down and handle focusing the pressable element ourselves.
        if (shouldPreventDefault(e.target as Element)) {
          e.preventDefault();
        }

        // iOS safari fires pointer events from VoiceOver (but only when outside an iframe...)
        // https://bugs.webkit.org/show_bug.cgi?id=222627
        state.pointerType = isVirtualPointerEvent(e.nativeEvent) ? 'virtual' : e.pointerType;

        e.stopPropagation();
        if (!state.isPressed) {
          state.isPressed = true;
          state.isOverTarget = true;
          state.activePointerId = e.pointerId;
          state.target = e.currentTarget;
          state.targetRect = e.currentTarget.getBoundingClientRect();

          if (!isDisabled && !preventFocusOnPress) {
            focusWithoutScrolling(e.currentTarget);
          }

          disableTextSelection();
          triggerPressStart(e, state.pointerType);

          addGlobalListener(document, 'pointermove', onPointerMove, false);
          addGlobalListener(document, 'pointerup', onPointerUp, false);
          addGlobalListener(document, 'pointercancel', onPointerCancel, false);
        }
      };

      pressProps.onMouseDown = (e) => {
        if (e.button === 0) {
          // Chrome and Firefox on touch Windows devices require mouse down events
          // to be canceled in addition to pointer events, or an extra asynchronous
          // focus event will be fired.
          if (shouldPreventDefault(e.target as Element)) {
            e.preventDefault();
          }

          e.stopPropagation();
        }
      };

      pressProps.onPointerUp = (e) => {
        // Only handle left clicks
        // Safari on iOS sometimes fires pointerup events, even
        // when the touch isn't over the target, so double check.
        if (e.button === 0 && isOverTarget(e, state.targetRect)) {
          triggerPressUp(e, state.pointerType);
        }
      };

      // Safari on iOS < 13.2 does not implement pointerenter/pointerleave events correctly.
      // Use pointer move events instead to implement our own hit testing.
      // See https://bugs.webkit.org/show_bug.cgi?id=199803
      let onPointerMove = (e: PointerEvent) => {
        if (e.pointerId !== state.activePointerId) {
          return;
        }

        if (isOverTarget(e, state.targetRect)) {
          if (!state.isOverTarget) {
            state.isOverTarget = true;
            triggerPressStart(createEvent(state.target, e), state.pointerType);
          }
        } else if (state.isOverTarget) {
          state.isOverTarget = false;
          triggerPressEnd(createEvent(state.target, e), state.pointerType, false);
        }
      };

      let onPointerUp = (e: PointerEvent) => {
        if (e.pointerId === state.activePointerId && state.isPressed && e.button === 0) {
          if (isOverTarget(e, state.targetRect)) {
            triggerPressEnd(createEvent(state.target, e), state.pointerType);
          } else if (state.isOverTarget) {
            triggerPressEnd(createEvent(state.target, e), state.pointerType, false);
          }

          state.isPressed = false;
          state.isOverTarget = false;
          state.activePointerId = null;
          state.pointerType = null;
          removeAllGlobalListeners();
          restoreTextSelection();
        }
      };

      let onPointerCancel = (e: PointerEvent) => {
        cancel(e);
      };

      pressProps.onDragStart = (e) => {
        // Safari does not call onPointerCancel when a drag starts, whereas Chrome and Firefox do.
        cancel(e);
      };
    } else {
      pressProps.onMouseDown = (e) => {
        // Only handle left clicks
        if (e.button !== 0) {
          return;
        }

        // Due to browser inconsistencies, especially on mobile browsers, we prevent
        // default on mouse down and handle focusing the pressable element ourselves.
        if (shouldPreventDefault(e.target as Element)) {
          e.preventDefault();
        }

        e.stopPropagation();
        if (state.ignoreEmulatedMouseEvents) {
          return;
        }

        state.isPressed = true;
        state.isOverTarget = true;
        state.target = e.currentTarget;
        state.targetRect = e.currentTarget.getBoundingClientRect();
        state.pointerType = isVirtualClick(e.nativeEvent) ? 'virtual' : 'mouse';

        if (!isDisabled && !preventFocusOnPress) {
          focusWithoutScrolling(e.currentTarget);
        }

        triggerPressStart(e, state.pointerType);

        addGlobalListener(document, 'mouseup', onMouseUp, false);
      };

      pressProps.onMouseEnter = (e) => {
        e.stopPropagation();
        if (state.isPressed && !state.ignoreEmulatedMouseEvents) {
          state.isOverTarget = true;
          triggerPressStart(e, state.pointerType);
        }
      };

      pressProps.onMouseLeave = (e) => {
        e.stopPropagation();
        if (state.isPressed && !state.ignoreEmulatedMouseEvents) {
          state.isOverTarget = false;
          triggerPressEnd(e, state.pointerType, false);
        }
      };

      pressProps.onMouseUp = (e) => {
        if (!state.ignoreEmulatedMouseEvents && e.button === 0) {
          triggerPressUp(e, state.pointerType);
        }
      };

      let onMouseUp = (e: MouseEvent) => {
        // Only handle left clicks
        if (e.button !== 0) {
          return;
        }

        state.isPressed = false;
        removeAllGlobalListeners();

        if (state.ignoreEmulatedMouseEvents) {
          state.ignoreEmulatedMouseEvents = false;
          return;
        }

        if (isOverTarget(e, state.targetRect)) {
          triggerPressEnd(createEvent(state.target, e), state.pointerType);
        } else if (state.isOverTarget) {
          triggerPressEnd(createEvent(state.target, e), state.pointerType, false);
        }

        state.isOverTarget = false;
      };

      pressProps.onTouchStart = (e) => {
        e.stopPropagation();
        let touch = getTouchFromEvent(e.nativeEvent);
        if (!touch) {
          return;
        }
        state.activePointerId = touch.identifier;
        state.ignoreEmulatedMouseEvents = true;
        state.isOverTarget = true;
        state.isPressed = true;
        state.target = e.currentTarget;
        state.targetRect = e.currentTarget.getBoundingClientRect();
        state.pointerType = 'touch';

        // Due to browser inconsistencies, especially on mobile browsers, we prevent default
        // on the emulated mouse event and handle focusing the pressable element ourselves.
        if (!isDisabled && !preventFocusOnPress) {
          focusWithoutScrolling(e.currentTarget);
        }

        disableTextSelection();
        triggerPressStart(e, state.pointerType);

        addGlobalListener(window, 'scroll', onScroll, true);
      };

      pressProps.onTouchMove = (e) => {
        e.stopPropagation();
        if (!state.isPressed) {
          return;
        }

        let touch = getTouchById(e.nativeEvent, state.activePointerId);
        if (touch && isOverTarget(touch, e.currentTarget.getBoundingClientRect())) {
          if (!state.isOverTarget) {
            state.isOverTarget = true;
            triggerPressStart(e, state.pointerType);
          }
        } else if (state.isOverTarget) {
          state.isOverTarget = false;
          triggerPressEnd(e, state.pointerType, false);
        }
      };

      pressProps.onTouchEnd = (e) => {
        e.stopPropagation();
        if (!state.isPressed) {
          return;
        }

        let touch = getTouchById(e.nativeEvent, state.activePointerId);
        if (touch && isOverTarget(touch, e.currentTarget.getBoundingClientRect())) {
          triggerPressUp(e, state.pointerType);
          triggerPressEnd(e, state.pointerType);
        } else if (state.isOverTarget) {
          triggerPressEnd(e, state.pointerType, false);
        }

        state.isPressed = false;
        state.activePointerId = null;
        state.isOverTarget = false;
        state.ignoreEmulatedMouseEvents = true;
        restoreTextSelection();
        removeAllGlobalListeners();
      };

      pressProps.onTouchCancel = (e) => {
        e.stopPropagation();
        if (state.isPressed) {
          cancel(e);
        }
      };

      let onScroll = (e: Event) => {
        if (state.isPressed && (e.target as HTMLElement).contains(state.target)) {
          cancel({
            currentTarget: state.target,
            shiftKey: false,
            ctrlKey: false,
            metaKey: false
          });
        }
      };

      pressProps.onDragStart = (e) => {
        cancel(e);
      };
    }

    return pressProps;
  }, [addGlobalListener, isDisabled, preventFocusOnPress, removeAllGlobalListeners]);

  // Remove user-select: none in case component unmounts immediately after pressStart
  // eslint-disable-next-line arrow-body-style
  useEffect(() => {
    return () => restoreTextSelection();
  }, []);

  return {
    isPressed: isPressedProp || isPressed,
    pressProps: mergeProps(domProps, pressProps)
  };
}

function isHTMLAnchorLink(target: HTMLElement): boolean {
  return target.tagName === 'A' && target.hasAttribute('href');
}

function isValidKeyboardEvent(event: KeyboardEvent): boolean {
  const {key, target} = event;
  const element = target as HTMLElement;
  const {tagName, isContentEditable} = element;
  const role = element.getAttribute('role');
  // Accessibility for keyboards. Space and Enter only.
  // "Spacebar" is for IE 11
  return (
    (key === 'Enter' || key === ' ' || key === 'Spacebar') &&
    (tagName !== 'INPUT' &&
      tagName !== 'TEXTAREA' &&
      isContentEditable !== true) &&
    // A link with a valid href should be handled natively,
    // unless it also has role='button' and was triggered using Space.
    (!isHTMLAnchorLink(element) || (role === 'button' && key !== 'Enter')) &&
    // An element with role='link' should only trigger with Enter key
    !(role === 'link' && key !== 'Enter')
  );
}

function getTouchFromEvent(event: TouchEvent): Touch | null {
  const {targetTouches} = event;
  if (targetTouches.length > 0) {
    return targetTouches[0];
  }
  return null;
}

function getTouchById(
  event: TouchEvent,
  pointerId: null | number
): null | Touch {
  const changedTouches = event.changedTouches;
  for (let i = 0; i < changedTouches.length; i++) {
    const touch = changedTouches[i];
    if (touch.identifier === pointerId) {
      return touch;
    }
  }
  return null;
}

function createEvent(target: HTMLElement, e: EventBase): EventBase {
  return {
    currentTarget: target,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey
  };
}

interface EventPoint {
  clientX: number,
  clientY: number
}

function isOverTarget(point: EventPoint, rect: DOMRect) {
  return (point.clientX || 0) >= (rect.left || 0) &&
    (point.clientX || 0) <= (rect.right || 0) &&
    (point.clientY || 0) >= (rect.top || 0) &&
    (point.clientY || 0) <= (rect.bottom || 0);
}

function shouldPreventDefault(target: Element) {
  // We cannot prevent default if the target is inside a draggable element.
  return !target.closest('[draggable="true"]');
}

function isVirtualPointerEvent(event: PointerEvent) {
  // If the pointer size is zero, then we assume it's from a screen reader.
  return event.width === 0 && event.height === 0;
}
