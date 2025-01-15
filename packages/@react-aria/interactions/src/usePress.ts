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

import {
  chain,
  focusWithoutScrolling,
  getEventTarget,
  getOwnerDocument,
  getOwnerWindow,
  isMac,
  isVirtualClick,
  isVirtualPointerEvent,
  mergeProps,
  nodeContains,
  openLink,
  useEffectEvent,
  useGlobalListeners,
  useSyncRef
} from '@react-aria/utils';
import {disableTextSelection, restoreTextSelection} from './textSelection';
import {DOMAttributes, FocusableElement, PressEvent as IPressEvent, PointerType, PressEvents, RefObject} from '@react-types/shared';
import {PressResponderContext} from './context';
import {TouchEvent as RTouchEvent, useContext, useEffect, useMemo, useRef, useState} from 'react';

export interface PressProps extends PressEvents {
  /** Whether the target is in a controlled press state (e.g. an overlay it triggers is open). */
  isPressed?: boolean,
  /** Whether the press events should be disabled. */
  isDisabled?: boolean,
  /** Whether the target should not receive focus on press. */
  preventFocusOnPress?: boolean,
  /**
   * Whether press events should be canceled when the pointer leaves the target while pressed.
   * By default, this is `false`, which means if the pointer returns back over the target while
   * still pressed, onPressStart will be fired again. If set to `true`, the press is canceled
   * when the pointer leaves the target and onPressStart will not be fired if the pointer returns.
   */
  shouldCancelOnPointerExit?: boolean,
  /** Whether text selection should be enabled on the pressable element. */
  allowTextSelectionOnPress?: boolean
}

export interface PressHookProps extends PressProps {
  /** A ref to the target element. */
  ref?: RefObject<Element | null>
}

interface PressState {
  isPressed: boolean,
  ignoreEmulatedMouseEvents: boolean,
  ignoreClickAfterPress: boolean,
  didFirePressStart: boolean,
  isTriggeringEvent: boolean,
  activePointerId: any,
  target: FocusableElement | null,
  isOverTarget: boolean,
  pointerType: PointerType | null,
  userSelect?: string,
  metaKeyEvents?: Map<string, KeyboardEvent>
}

interface EventBase {
  currentTarget: EventTarget | null,
  shiftKey: boolean,
  ctrlKey: boolean,
  metaKey: boolean,
  altKey: boolean,
  clientX?: number,
  clientY?: number,
  targetTouches?: Array<{clientX?: number, clientY?: number}>
}

export interface PressResult {
  /** Whether the target is currently pressed. */
  isPressed: boolean,
  /** Props to spread on the target element. */
  pressProps: DOMAttributes
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

class PressEvent implements IPressEvent {
  type: IPressEvent['type'];
  pointerType: PointerType;
  target: Element;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  x: number;
  y: number;
  #shouldStopPropagation = true;

  constructor(type: IPressEvent['type'], pointerType: PointerType, originalEvent: EventBase, state?: PressState) {
    let currentTarget = state?.target ?? originalEvent.currentTarget;
    const rect: DOMRect | undefined = (currentTarget as Element)?.getBoundingClientRect();
    let x, y = 0;
    let clientX, clientY: number | null = null;
    if (originalEvent.clientX != null && originalEvent.clientY != null) {
      clientX = originalEvent.clientX;
      clientY = originalEvent.clientY;
    }
    if (rect) {
      if (clientX != null && clientY != null) {
        x = clientX - rect.left;
        y = clientY - rect.top;
      } else {
        x = rect.width / 2;
        y = rect.height / 2;
      }
    }
    this.type = type;
    this.pointerType = pointerType;
    this.target = originalEvent.currentTarget as Element;
    this.shiftKey = originalEvent.shiftKey;
    this.metaKey = originalEvent.metaKey;
    this.ctrlKey = originalEvent.ctrlKey;
    this.altKey = originalEvent.altKey;
    this.x = x;
    this.y = y;
  }

  continuePropagation() {
    this.#shouldStopPropagation = false;
  }

  get shouldStopPropagation() {
    return this.#shouldStopPropagation;
  }
}

const LINK_CLICKED = Symbol('linkClicked');

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
    shouldCancelOnPointerExit,
    allowTextSelectionOnPress,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ref: _, // Removing `ref` from `domProps` because TypeScript is dumb
    ...domProps
  } = usePressResponderContext(props);

  let [isPressed, setPressed] = useState(false);
  let ref = useRef<PressState>({
    isPressed: false,
    ignoreEmulatedMouseEvents: false,
    ignoreClickAfterPress: false,
    didFirePressStart: false,
    isTriggeringEvent: false,
    activePointerId: null,
    target: null,
    isOverTarget: false,
    pointerType: null
  });

  let {addGlobalListener, removeAllGlobalListeners} = useGlobalListeners();

  let triggerPressStart = useEffectEvent((originalEvent: EventBase, pointerType: PointerType) => {
    let state = ref.current;
    if (isDisabled || state.didFirePressStart) {
      return false;
    }

    let shouldStopPropagation = true;
    state.isTriggeringEvent = true;
    if (onPressStart) {
      let event = new PressEvent('pressstart', pointerType, originalEvent);
      onPressStart(event);
      shouldStopPropagation = event.shouldStopPropagation;
    }

    if (onPressChange) {
      onPressChange(true);
    }

    state.isTriggeringEvent = false;
    state.didFirePressStart = true;
    setPressed(true);
    return shouldStopPropagation;
  });

  let triggerPressEnd = useEffectEvent((originalEvent: EventBase, pointerType: PointerType, wasPressed = true) => {
    let state = ref.current;
    if (!state.didFirePressStart) {
      return false;
    }

    state.ignoreClickAfterPress = true;
    state.didFirePressStart = false;
    state.isTriggeringEvent = true;

    let shouldStopPropagation = true;
    if (onPressEnd) {
      let event = new PressEvent('pressend', pointerType, originalEvent);
      onPressEnd(event);
      shouldStopPropagation = event.shouldStopPropagation;
    }

    if (onPressChange) {
      onPressChange(false);
    }

    setPressed(false);

    if (onPress && wasPressed && !isDisabled) {
      let event = new PressEvent('press', pointerType, originalEvent);
      onPress(event);
      shouldStopPropagation &&= event.shouldStopPropagation;
    }

    state.isTriggeringEvent = false;
    return shouldStopPropagation;
  });

  let triggerPressUp = useEffectEvent((originalEvent: EventBase, pointerType: PointerType) => {
    let state = ref.current;
    if (isDisabled) {
      return false;
    }

    if (onPressUp) {
      state.isTriggeringEvent = true;
      let event = new PressEvent('pressup', pointerType, originalEvent);
      onPressUp(event);
      state.isTriggeringEvent = false;
      return event.shouldStopPropagation;
    }

    return true;
  });

  let cancel = useEffectEvent((e: EventBase) => {
    let state = ref.current;
    if (state.isPressed && state.target) {
      if (state.isOverTarget && state.pointerType != null) {
        triggerPressEnd(createEvent(state.target, e), state.pointerType, false);
      }
      state.isPressed = false;
      state.isOverTarget = false;
      state.activePointerId = null;
      state.pointerType = null;
      removeAllGlobalListeners();
      if (!allowTextSelectionOnPress) {
        restoreTextSelection(state.target);
      }
    }
  });

  let cancelOnPointerExit = useEffectEvent((e: EventBase) => {
    if (shouldCancelOnPointerExit) {
      cancel(e);
    }
  });

  let pressProps = useMemo(() => {
    let state = ref.current;
    let pressProps: DOMAttributes = {
      onKeyDown(e) {
        if (isValidKeyboardEvent(e.nativeEvent, e.currentTarget) && nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          if (shouldPreventDefaultKeyboard(getEventTarget(e.nativeEvent), e.key)) {
            e.preventDefault();
          }

          // If the event is repeating, it may have started on a different element
          // after which focus moved to the current element. Ignore these events and
          // only handle the first key down event.
          let shouldStopPropagation = true;
          if (!state.isPressed && !e.repeat) {
            state.target = e.currentTarget;
            state.isPressed = true;
            shouldStopPropagation = triggerPressStart(e, 'keyboard');

            // Focus may move before the key up event, so register the event on the document
            // instead of the same element where the key down event occurred. Make it capturing so that it will trigger
            // before stopPropagation from useKeyboard on a child element may happen and thus we can still call triggerPress for the parent element.
            let originalTarget = e.currentTarget;
            let pressUp = (e) => {
              if (isValidKeyboardEvent(e, originalTarget) && !e.repeat && nodeContains(originalTarget, getEventTarget(e)) && state.target) {
                triggerPressUp(createEvent(state.target, e), 'keyboard');
              }
            };

            addGlobalListener(getOwnerDocument(e.currentTarget), 'keyup', chain(pressUp, onKeyUp), true);
          }

          if (shouldStopPropagation) {
            e.stopPropagation();
          }

          // Keep track of the keydown events that occur while the Meta (e.g. Command) key is held.
          // macOS has a bug where keyup events are not fired while the Meta key is down.
          // When the Meta key itself is released we will get an event for that, and we'll act as if
          // all of these other keys were released as well.
          // https://bugs.chromium.org/p/chromium/issues/detail?id=1393524
          // https://bugs.webkit.org/show_bug.cgi?id=55291
          // https://bugzilla.mozilla.org/show_bug.cgi?id=1299553
          if (e.metaKey && isMac()) {
            state.metaKeyEvents?.set(e.key, e.nativeEvent);
          }
        } else if (e.key === 'Meta') {
          state.metaKeyEvents = new Map();
        }
      },
      onClick(e) {
        if (e && !nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        if (e && e.button === 0 && !state.isTriggeringEvent && !(openLink as any).isOpening) {
          let shouldStopPropagation = true;
          if (isDisabled) {
            e.preventDefault();
          }

          // If triggered from a screen reader or by using element.click(),
          // trigger as if it were a keyboard click.
          if (!state.ignoreClickAfterPress && !state.ignoreEmulatedMouseEvents && !state.isPressed && (state.pointerType === 'virtual' || isVirtualClick(e.nativeEvent))) {
            // Ensure the element receives focus (VoiceOver on iOS does not do this)
            if (!isDisabled && !preventFocusOnPress) {
              focusWithoutScrolling(e.currentTarget);
            }

            let stopPressStart = triggerPressStart(e, 'virtual');
            let stopPressUp = triggerPressUp(e, 'virtual');
            let stopPressEnd = triggerPressEnd(e, 'virtual');
            shouldStopPropagation = stopPressStart && stopPressUp && stopPressEnd;
          }

          state.ignoreEmulatedMouseEvents = false;
          state.ignoreClickAfterPress = false;
          if (shouldStopPropagation) {
            e.stopPropagation();
          }
        }
      }
    };

    let onKeyUp = (e: KeyboardEvent) => {
      if (state.isPressed && state.target && isValidKeyboardEvent(e, state.target)) {
        if (shouldPreventDefaultKeyboard(getEventTarget(e), e.key)) {
          e.preventDefault();
        }

        let target = getEventTarget(e);
        triggerPressEnd(createEvent(state.target, e), 'keyboard', nodeContains(state.target, getEventTarget(e)));
        removeAllGlobalListeners();

        // If a link was triggered with a key other than Enter, open the URL ourselves.
        // This means the link has a role override, and the default browser behavior
        // only applies when using the Enter key.
        if (e.key !== 'Enter' && isHTMLAnchorLink(state.target) && nodeContains(state.target, target) && !e[LINK_CLICKED]) {
          // Store a hidden property on the event so we only trigger link click once,
          // even if there are multiple usePress instances attached to the element.
          e[LINK_CLICKED] = true;
          openLink(state.target, e, false);
        }

        state.isPressed = false;
        state.metaKeyEvents?.delete(e.key);
      } else if (e.key === 'Meta' && state.metaKeyEvents?.size) {
        // If we recorded keydown events that occurred while the Meta key was pressed,
        // and those haven't received keyup events already, fire keyup events ourselves.
        // See comment above for more info about the macOS bug causing this.
        let events = state.metaKeyEvents;
        state.metaKeyEvents = undefined;
        for (let event of events.values()) {
          state.target?.dispatchEvent(new KeyboardEvent('keyup', event));
        }
      }
    };

    if (typeof PointerEvent !== 'undefined') {
      pressProps.onPointerDown = (e) => {
        // Only handle left clicks, and ignore events that bubbled through portals.
        if (e.button !== 0 || !nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        // iOS safari fires pointer events from VoiceOver with incorrect coordinates/target.
        // Ignore and let the onClick handler take care of it instead.
        // https://bugs.webkit.org/show_bug.cgi?id=222627
        // https://bugs.webkit.org/show_bug.cgi?id=223202
        if (isVirtualPointerEvent(e.nativeEvent)) {
          state.pointerType = 'virtual';
          return;
        }

        // Due to browser inconsistencies, especially on mobile browsers, we prevent
        // default on pointer down and handle focusing the pressable element ourselves.
        if (shouldPreventDefaultDown(e.currentTarget as Element)) {
          e.preventDefault();
        }

        state.pointerType = e.pointerType;

        let shouldStopPropagation = true;
        if (!state.isPressed) {
          state.isPressed = true;
          state.isOverTarget = true;
          state.activePointerId = e.pointerId;
          state.target = e.currentTarget as FocusableElement;

          if (!isDisabled && !preventFocusOnPress) {
            focusWithoutScrolling(state.target);
          }

          if (!allowTextSelectionOnPress) {
            disableTextSelection(state.target);
          }

          shouldStopPropagation = triggerPressStart(e, state.pointerType);

          // Release pointer capture so that touch interactions can leave the original target.
          // This enables onPointerLeave and onPointerEnter to fire.
          let target = getEventTarget(e.nativeEvent);
          if ('releasePointerCapture' in target) {
            target.releasePointerCapture(e.pointerId);
          }

          addGlobalListener(getOwnerDocument(e.currentTarget), 'pointerup', onPointerUp, false);
          addGlobalListener(getOwnerDocument(e.currentTarget), 'pointercancel', onPointerCancel, false);
        }

        if (shouldStopPropagation) {
          e.stopPropagation();
        }
      };

      pressProps.onMouseDown = (e) => {
        if (!nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        if (e.button === 0) {
          // Chrome and Firefox on touch Windows devices require mouse down events
          // to be canceled in addition to pointer events, or an extra asynchronous
          // focus event will be fired.
          if (shouldPreventDefaultDown(e.currentTarget as Element)) {
            e.preventDefault();
          }

          e.stopPropagation();
        }
      };

      pressProps.onPointerUp = (e) => {
        // iOS fires pointerup with zero width and height, so check the pointerType recorded during pointerdown.
        if (!nodeContains(e.currentTarget, getEventTarget(e.nativeEvent)) || state.pointerType === 'virtual') {
          return;
        }

        // Only handle left clicks
        if (e.button === 0) {
          triggerPressUp(e, state.pointerType || e.pointerType);
        }
      };

      pressProps.onPointerEnter = (e) => {
        if (e.pointerId === state.activePointerId && state.target && !state.isOverTarget && state.pointerType != null) {
          state.isOverTarget = true;
          triggerPressStart(createEvent(state.target, e), state.pointerType);
        }
      };

      pressProps.onPointerLeave = (e) => {
        if (e.pointerId === state.activePointerId && state.target && state.isOverTarget && state.pointerType != null) {
          state.isOverTarget = false;
          triggerPressEnd(createEvent(state.target, e), state.pointerType, false);
          cancelOnPointerExit(e);
        }
      };

      let onPointerUp = (e: PointerEvent) => {
        if (e.pointerId === state.activePointerId && state.isPressed && e.button === 0 && state.target) {
          if (nodeContains(state.target, getEventTarget(e)) && state.pointerType != null) {
            triggerPressEnd(createEvent(state.target, e), state.pointerType);
          } else if (state.isOverTarget && state.pointerType != null) {
            triggerPressEnd(createEvent(state.target, e), state.pointerType, false);
          }

          state.isPressed = false;
          state.isOverTarget = false;
          state.activePointerId = null;
          state.pointerType = null;
          removeAllGlobalListeners();
          if (!allowTextSelectionOnPress) {
            restoreTextSelection(state.target);
          }

          // Prevent subsequent touchend event from triggering onClick on unrelated elements on Android. See below.
          // Both 'touch' and 'pen' pointerTypes trigger onTouchEnd, but 'mouse' does not.
          if ('ontouchend' in state.target && e.pointerType !== 'mouse') {
            addGlobalListener(state.target, 'touchend', onTouchEnd, {once: true});
          }
        }
      };

      // This is a workaround for an Android Chrome/Firefox issue where click events are fired on an incorrect element
      // if the original target is removed during onPointerUp (before onClick).
      // https://github.com/adobe/react-spectrum/issues/1513
      // https://issues.chromium.org/issues/40732224
      // Note: this event must be registered directly on the element, not via React props in order to work.
      // https://github.com/facebook/react/issues/9809
      let onTouchEnd = (e: TouchEvent) => {
        // Don't preventDefault if we actually want the default (e.g. submit/link click).
        if (shouldPreventDefaultUp(e.currentTarget as Element)) {
          e.preventDefault();
        }
      };

      let onPointerCancel = (e: PointerEvent) => {
        cancel(e);
      };

      pressProps.onDragStart = (e) => {
        if (!nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        // Safari does not call onPointerCancel when a drag starts, whereas Chrome and Firefox do.
        cancel(e);
      };
    } else {
      pressProps.onMouseDown = (e) => {
        // Only handle left clicks
        if (e.button !== 0 || !nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        // Due to browser inconsistencies, especially on mobile browsers, we prevent
        // default on mouse down and handle focusing the pressable element ourselves.
        if (shouldPreventDefaultDown(e.currentTarget)) {
          e.preventDefault();
        }

        if (state.ignoreEmulatedMouseEvents) {
          e.stopPropagation();
          return;
        }

        state.isPressed = true;
        state.isOverTarget = true;
        state.target = e.currentTarget;
        state.pointerType = isVirtualClick(e.nativeEvent) ? 'virtual' : 'mouse';

        if (!isDisabled && !preventFocusOnPress) {
          focusWithoutScrolling(e.currentTarget);
        }

        let shouldStopPropagation = triggerPressStart(e, state.pointerType);
        if (shouldStopPropagation) {
          e.stopPropagation();
        }

        addGlobalListener(getOwnerDocument(e.currentTarget), 'mouseup', onMouseUp, false);
      };

      pressProps.onMouseEnter = (e) => {
        if (!nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        let shouldStopPropagation = true;
        if (state.isPressed && !state.ignoreEmulatedMouseEvents && state.pointerType != null) {
          state.isOverTarget = true;
          shouldStopPropagation = triggerPressStart(e, state.pointerType);
        }

        if (shouldStopPropagation) {
          e.stopPropagation();
        }
      };

      pressProps.onMouseLeave = (e) => {
        if (!nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        let shouldStopPropagation = true;
        if (state.isPressed && !state.ignoreEmulatedMouseEvents && state.pointerType != null) {
          state.isOverTarget = false;
          shouldStopPropagation = triggerPressEnd(e, state.pointerType, false);
          cancelOnPointerExit(e);
        }

        if (shouldStopPropagation) {
          e.stopPropagation();
        }
      };

      pressProps.onMouseUp = (e) => {
        if (!nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        if (!state.ignoreEmulatedMouseEvents && e.button === 0) {
          triggerPressUp(e, state.pointerType || 'mouse');
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

        if (state.target && isOverTarget(e, state.target) && state.pointerType != null) {
          triggerPressEnd(createEvent(state.target, e), state.pointerType);
        } else if (state.target && state.isOverTarget && state.pointerType != null) {
          triggerPressEnd(createEvent(state.target, e), state.pointerType, false);
        }

        state.isOverTarget = false;
      };

      pressProps.onTouchStart = (e) => {
        if (!nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        let touch = getTouchFromEvent(e.nativeEvent);
        if (!touch) {
          return;
        }
        state.activePointerId = touch.identifier;
        state.ignoreEmulatedMouseEvents = true;
        state.isOverTarget = true;
        state.isPressed = true;
        state.target = e.currentTarget;
        state.pointerType = 'touch';

        // Due to browser inconsistencies, especially on mobile browsers, we prevent default
        // on the emulated mouse event and handle focusing the pressable element ourselves.
        if (!isDisabled && !preventFocusOnPress) {
          focusWithoutScrolling(e.currentTarget);
        }

        if (!allowTextSelectionOnPress) {
          disableTextSelection(state.target);
        }

        let shouldStopPropagation = triggerPressStart(createTouchEvent(state.target, e), state.pointerType);
        if (shouldStopPropagation) {
          e.stopPropagation();
        }

        addGlobalListener(getOwnerWindow(e.currentTarget), 'scroll', onScroll, true);
      };

      pressProps.onTouchMove = (e) => {
        if (!nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        if (!state.isPressed) {
          e.stopPropagation();
          return;
        }

        let touch = getTouchById(e.nativeEvent, state.activePointerId);
        let shouldStopPropagation = true;
        if (touch && isOverTarget(touch, e.currentTarget)) {
          if (!state.isOverTarget && state.pointerType != null) {
            state.isOverTarget = true;
            shouldStopPropagation = triggerPressStart(createTouchEvent(state.target!, e), state.pointerType);
          }
        } else if (state.isOverTarget && state.pointerType != null) {
          state.isOverTarget = false;
          shouldStopPropagation = triggerPressEnd(createTouchEvent(state.target!, e), state.pointerType, false);
          cancelOnPointerExit(createTouchEvent(state.target!, e));
        }

        if (shouldStopPropagation) {
          e.stopPropagation();
        }
      };

      pressProps.onTouchEnd = (e) => {
        if (!nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        if (!state.isPressed) {
          e.stopPropagation();
          return;
        }

        let touch = getTouchById(e.nativeEvent, state.activePointerId);
        let shouldStopPropagation = true;
        if (touch && isOverTarget(touch, e.currentTarget) && state.pointerType != null) {
          triggerPressUp(createTouchEvent(state.target!, e), state.pointerType);
          shouldStopPropagation = triggerPressEnd(createTouchEvent(state.target!, e), state.pointerType);
        } else if (state.isOverTarget && state.pointerType != null) {
          shouldStopPropagation = triggerPressEnd(createTouchEvent(state.target!, e), state.pointerType, false);
        }

        if (shouldStopPropagation) {
          e.stopPropagation();
        }

        state.isPressed = false;
        state.activePointerId = null;
        state.isOverTarget = false;
        state.ignoreEmulatedMouseEvents = true;
        if (state.target && !allowTextSelectionOnPress) {
          restoreTextSelection(state.target);
        }
        removeAllGlobalListeners();
      };

      pressProps.onTouchCancel = (e) => {
        if (!nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        e.stopPropagation();
        if (state.isPressed) {
          cancel(createTouchEvent(state.target!, e));
        }
      };

      let onScroll = (e: Event) => {
        if (state.isPressed && nodeContains(getEventTarget(e), state.target)) {
          cancel({
            currentTarget: state.target,
            shiftKey: false,
            ctrlKey: false,
            metaKey: false,
            altKey: false
          });
        }
      };

      pressProps.onDragStart = (e) => {
        if (!nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))) {
          return;
        }

        cancel(e);
      };
    }

    return pressProps;
  }, [
    addGlobalListener,
    isDisabled,
    preventFocusOnPress,
    removeAllGlobalListeners,
    allowTextSelectionOnPress,
    cancel,
    cancelOnPointerExit,
    triggerPressEnd,
    triggerPressStart,
    triggerPressUp
  ]);

  // Remove user-select: none in case component unmounts immediately after pressStart

  useEffect(() => {
    return () => {
      if (!allowTextSelectionOnPress) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        restoreTextSelection(ref.current.target ?? undefined);
      }
    };
  }, [allowTextSelectionOnPress]);

  return {
    isPressed: isPressedProp || isPressed,
    pressProps: mergeProps(domProps, pressProps)
  };
}

function isHTMLAnchorLink(target: Element): target is HTMLAnchorElement {
  return target.tagName === 'A' && target.hasAttribute('href');
}

function isValidKeyboardEvent(event: KeyboardEvent, currentTarget: Element): boolean {
  const {key, code} = event;
  const element = currentTarget as HTMLElement;
  const role = element.getAttribute('role');
  // Accessibility for keyboards. Space and Enter only.
  // "Spacebar" is for IE 11
  return (
    (key === 'Enter' || key === ' ' || key === 'Spacebar' || code === 'Space') &&
    !((element instanceof getOwnerWindow(element).HTMLInputElement && !isValidInputKey(element, key)) ||
      element instanceof getOwnerWindow(element).HTMLTextAreaElement ||
      element.isContentEditable) &&
    // Links should only trigger with Enter key
    !((role === 'link' || (!role && isHTMLAnchorLink(element))) && key !== 'Enter')
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

function createTouchEvent(target: FocusableElement, e: RTouchEvent<FocusableElement>): EventBase {
  let clientX = 0;
  let clientY = 0;
  if (e.targetTouches && e.targetTouches.length === 1) {
    clientX = e.targetTouches[0].clientX;
    clientY = e.targetTouches[0].clientY;
  }
  return {
    currentTarget: target,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    altKey: e.altKey,
    clientX,
    clientY
  };
}

function createEvent(target: FocusableElement, e: EventBase): EventBase {
  let clientX = e.clientX;
  let clientY = e.clientY;
  return {
    currentTarget: target,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    altKey: e.altKey,
    clientX,
    clientY
  };
}

interface Rect {
  top: number,
  right: number,
  bottom: number,
  left: number
}

interface EventPoint {
  clientX: number,
  clientY: number,
  width?: number,
  height?: number,
  radiusX?: number,
  radiusY?: number
}

function getPointClientRect(point: EventPoint): Rect {
  let offsetX = 0;
  let offsetY = 0;
  if (point.width !== undefined) {
    offsetX = (point.width / 2);
  } else if (point.radiusX !== undefined) {
    offsetX = point.radiusX;
  }
  if (point.height !== undefined) {
    offsetY = (point.height / 2);
  } else if (point.radiusY !== undefined) {
    offsetY = point.radiusY;
  }

  return {
    top: point.clientY - offsetY,
    right: point.clientX + offsetX,
    bottom: point.clientY + offsetY,
    left: point.clientX - offsetX
  };
}

function areRectanglesOverlapping(a: Rect, b: Rect) {
  // check if they cannot overlap on x axis
  if (a.left > b.right || b.left > a.right) {
    return false;
  }
  // check if they cannot overlap on y axis
  if (a.top > b.bottom || b.top > a.bottom) {
    return false;
  }
  return true;
}

function isOverTarget(point: EventPoint, target: Element) {
  let rect = target.getBoundingClientRect();
  let pointRect = getPointClientRect(point);
  return areRectanglesOverlapping(rect, pointRect);
}

function shouldPreventDefaultDown(target: Element) {
  // We cannot prevent default if the target is a draggable element.
  return !(target instanceof HTMLElement) || !target.hasAttribute('draggable');
}

function shouldPreventDefaultUp(target: Element) {
  if (target instanceof HTMLInputElement) {
    return false;
  }

  if (target instanceof HTMLButtonElement) {
    return target.type !== 'submit' && target.type !== 'reset';
  }

  if (isHTMLAnchorLink(target)) {
    return false;
  }

  return true;
}

function shouldPreventDefaultKeyboard(target: Element, key: string) {
  if (target instanceof HTMLInputElement) {
    return !isValidInputKey(target, key);
  }

  return shouldPreventDefaultUp(target);
}

const nonTextInputTypes = new Set([
  'checkbox',
  'radio',
  'range',
  'color',
  'file',
  'image',
  'button',
  'submit',
  'reset'
]);

function isValidInputKey(target: HTMLInputElement, key: string) {
  // Only space should toggle checkboxes and radios, not enter.
  return target.type === 'checkbox' || target.type === 'radio'
    ? key === ' '
    : nonTextInputTypes.has(target.type);
}
