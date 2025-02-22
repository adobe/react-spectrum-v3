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

import {getOwnerDocument, getOwnerWindow, isMac, isVirtualClick} from '@react-aria/utils';
import {ignoreFocusEvent} from './utils';
import {useEffect, useState} from 'react';
import {useIsSSR} from '@react-aria/ssr';

export type Modality = 'keyboard' | 'pointer' | 'virtual';
type HandlerEvent = PointerEvent | MouseEvent | KeyboardEvent | FocusEvent | null;
type Handler = (modality: Modality, e: HandlerEvent) => void;
export type FocusVisibleHandler = (isFocusVisible: boolean) => void;
export interface FocusVisibleProps {
  /**
   * Whether the element is a text input.
   * @deprecated This is no longer necessary.
   */
  isTextInput?: boolean,
  /** Whether the element will be auto focused. */
  autoFocus?: boolean
}

export interface FocusVisibleResult {
  /** Whether keyboard focus is visible globally. */
  isFocusVisible: boolean
}

let currentModality: null | Modality = null;
let changeHandlers = new Set<Handler>();
interface GlobalListenerData {
  focus: () => void
}
export let hasSetupGlobalListeners = new Map<Window, GlobalListenerData>(); // We use a map here to support setting event listeners across multiple document objects.
let hasEventBeforeFocus = false;
let hasBlurredWindowRecently = false;

// Only Tab or Esc keys will make focus visible on text input elements
const FOCUS_VISIBLE_INPUT_KEYS = {
  Tab: true,
  Escape: true
};

function triggerChangeHandlers(modality: Modality, e: HandlerEvent) {
  for (let handler of changeHandlers) {
    handler(modality, e);
  }
}

/**
 * Helper function to determine if a KeyboardEvent is unmodified and could make keyboard focus styles visible.
 */
function isValidKey(e: KeyboardEvent) {
  // Control and Shift keys trigger when navigating back to the tab with keyboard.
  return !(e.metaKey || (!isMac() && e.altKey) || e.ctrlKey || e.key === 'Control' || e.key === 'Shift' || e.key === 'Meta');
}


function handleKeyboardEvent(e: KeyboardEvent) {
  hasEventBeforeFocus = true;
  if (isValidKey(e)) {
    currentModality = 'keyboard';
    triggerChangeHandlers('keyboard', e);
  }
}

function handlePointerEvent(e: PointerEvent | MouseEvent) {
  currentModality = 'pointer';
  if (e.type === 'mousedown' || e.type === 'pointerdown') {
    hasEventBeforeFocus = true;
    triggerChangeHandlers('pointer', e);
  }
}

function handleClickEvent(e: MouseEvent) {
  if (isVirtualClick(e)) {
    hasEventBeforeFocus = true;
    currentModality = 'virtual';
  }
}

function handleFocusEvent(e: FocusEvent) {
  // Firefox fires two extra focus events when the user first clicks into an iframe:
  // first on the window, then on the document. We ignore these events so they don't
  // cause keyboard focus rings to appear.
  if (e.target === window || e.target === document || ignoreFocusEvent || !e.isTrusted) {
    return;
  }

  // If a focus event occurs without a preceding keyboard or pointer event, switch to virtual modality.
  // This occurs, for example, when navigating a form with the next/previous buttons on iOS.
  if (!hasEventBeforeFocus && !hasBlurredWindowRecently) {
    currentModality = 'virtual';
    triggerChangeHandlers('virtual', e);
  }

  hasEventBeforeFocus = false;
  hasBlurredWindowRecently = false;
}

function handleWindowBlur() {
  if (ignoreFocusEvent) {
    return;
  }

  // When the window is blurred, reset state. This is necessary when tabbing out of the window,
  // for example, since a subsequent focus event won't be fired.
  hasEventBeforeFocus = false;
  hasBlurredWindowRecently = true;
}

/**
 * Setup global event listeners to control when keyboard focus style should be visible.
 */
function setupGlobalFocusEvents(element?: HTMLElement | null) {
  if (typeof window === 'undefined' || hasSetupGlobalListeners.get(getOwnerWindow(element))) {
    return;
  }

  const windowObject = getOwnerWindow(element);
  const documentObject = getOwnerDocument(element);

  // Programmatic focus() calls shouldn't affect the current input modality.
  // However, we need to detect other cases when a focus event occurs without
  // a preceding user event (e.g. screen reader focus). Overriding the focus
  // method on HTMLElement.prototype is a bit hacky, but works.
  let focus = windowObject.HTMLElement.prototype.focus;
  windowObject.HTMLElement.prototype.focus = function () {
    hasEventBeforeFocus = true;
    focus.apply(this, arguments as unknown as [options?: FocusOptions | undefined]);
  };

  documentObject.addEventListener('keydown', handleKeyboardEvent, true);
  documentObject.addEventListener('keyup', handleKeyboardEvent, true);
  documentObject.addEventListener('click', handleClickEvent, true);

  // Register focus events on the window so they are sure to happen
  // before React's event listeners (registered on the document).
  windowObject.addEventListener('focus', handleFocusEvent, true);
  windowObject.addEventListener('blur', handleWindowBlur, false);

  if (typeof PointerEvent !== 'undefined') {
    documentObject.addEventListener('pointerdown', handlePointerEvent, true);
    documentObject.addEventListener('pointermove', handlePointerEvent, true);
    documentObject.addEventListener('pointerup', handlePointerEvent, true);
  } else {
    documentObject.addEventListener('mousedown', handlePointerEvent, true);
    documentObject.addEventListener('mousemove', handlePointerEvent, true);
    documentObject.addEventListener('mouseup', handlePointerEvent, true);
  }

  // Add unmount handler
  windowObject.addEventListener('beforeunload', () => {
    tearDownWindowFocusTracking(element);
  }, {once: true});

  hasSetupGlobalListeners.set(windowObject, {focus});
}

const tearDownWindowFocusTracking = (element, loadListener?: () => void) => {
  const windowObject = getOwnerWindow(element);
  const documentObject = getOwnerDocument(element);
  if (loadListener) {
    documentObject.removeEventListener('DOMContentLoaded', loadListener);
  }
  if (!hasSetupGlobalListeners.has(windowObject)) {
    return;
  }
  windowObject.HTMLElement.prototype.focus = hasSetupGlobalListeners.get(windowObject)!.focus;

  documentObject.removeEventListener('keydown', handleKeyboardEvent, true);
  documentObject.removeEventListener('keyup', handleKeyboardEvent, true);
  documentObject.removeEventListener('click', handleClickEvent, true);

  windowObject.removeEventListener('focus', handleFocusEvent, true);
  windowObject.removeEventListener('blur', handleWindowBlur, false);

  if (typeof PointerEvent !== 'undefined') {
    documentObject.removeEventListener('pointerdown', handlePointerEvent, true);
    documentObject.removeEventListener('pointermove', handlePointerEvent, true);
    documentObject.removeEventListener('pointerup', handlePointerEvent, true);
  } else {
    documentObject.removeEventListener('mousedown', handlePointerEvent, true);
    documentObject.removeEventListener('mousemove', handlePointerEvent, true);
    documentObject.removeEventListener('mouseup', handlePointerEvent, true);
  }

  hasSetupGlobalListeners.delete(windowObject);
};

/**
 * EXPERIMENTAL
 * Adds a window (i.e. iframe) to the list of windows that are being tracked for focus visible.
 *
 * Sometimes apps render portions of their tree into an iframe. In this case, we cannot accurately track if the focus
 * is visible because we cannot see interactions inside the iframe. If you have this in your application's architecture,
 * then this function will attach event listeners inside the iframe. You should call `addWindowFocusTracking` with an
 * element from inside the window you wish to add. We'll retrieve the relevant elements based on that.
 * Note, you do not need to call this for the default window, as we call it for you.
 *
 * When you are ready to stop listening, but you do not wish to unmount the iframe, you may call the cleanup function
 * returned by `addWindowFocusTracking`. Otherwise, when you unmount the iframe, all listeners and state will be cleaned
 * up automatically for you.
 *
 * @param element @default document.body - The element provided will be used to get the window to add.
 * @returns A function to remove the event listeners and cleanup the state.
 */
export function addWindowFocusTracking(element?: HTMLElement | null): () => void {
  const documentObject = getOwnerDocument(element);
  let loadListener;
  if (documentObject.readyState !== 'loading') {
    setupGlobalFocusEvents(element);
  } else {
    loadListener = () => {
      setupGlobalFocusEvents(element);
    };
    documentObject.addEventListener('DOMContentLoaded', loadListener);
  }

  return () => tearDownWindowFocusTracking(element, loadListener);
}

// Server-side rendering does not have the document object defined
// eslint-disable-next-line no-restricted-globals
if (typeof document !== 'undefined') {
  addWindowFocusTracking();
}

/**
 * If true, keyboard focus is visible.
 */
export function isFocusVisible(): boolean {
  return currentModality !== 'pointer';
}

export function getInteractionModality(): Modality | null {
  return currentModality;
}

export function setInteractionModality(modality: Modality) {
  currentModality = modality;
  triggerChangeHandlers(modality, null);
}

/**
 * Keeps state of the current modality.
 */
export function useInteractionModality(): Modality | null {
  setupGlobalFocusEvents();

  let [modality, setModality] = useState(currentModality);
  useEffect(() => {
    let handler = () => {
      setModality(currentModality);
    };

    changeHandlers.add(handler);
    return () => {
      changeHandlers.delete(handler);
    };
  }, []);

  return useIsSSR() ? null : modality;
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

/**
 * If this is attached to text input component, return if the event is a focus event (Tab/Escape keys pressed) so that
 * focus visible style can be properly set.
 */
function isKeyboardFocusEvent(isTextInput: boolean, modality: Modality, e: HandlerEvent) {
  let document = getOwnerDocument(e?.target as Element);
  const IHTMLInputElement = typeof window !== 'undefined' ? getOwnerWindow(e?.target as Element).HTMLInputElement : HTMLInputElement;
  const IHTMLTextAreaElement = typeof window !== 'undefined' ? getOwnerWindow(e?.target as Element).HTMLTextAreaElement : HTMLTextAreaElement;
  const IHTMLElement = typeof window !== 'undefined' ? getOwnerWindow(e?.target as Element).HTMLElement : HTMLElement;
  const IKeyboardEvent = typeof window !== 'undefined' ? getOwnerWindow(e?.target as Element).KeyboardEvent : KeyboardEvent;

  // For keyboard events that occur on a non-input element that will move focus into input element (aka ArrowLeft going from Datepicker button to the main input group)
  // we need to rely on the user passing isTextInput into here. This way we can skip toggling focus visiblity for said input element
  isTextInput = isTextInput ||
    (document.activeElement instanceof IHTMLInputElement && !nonTextInputTypes.has(document.activeElement.type)) ||
    document.activeElement instanceof IHTMLTextAreaElement ||
    (document.activeElement instanceof IHTMLElement && document.activeElement.isContentEditable);
  return !(isTextInput && modality === 'keyboard' && e instanceof IKeyboardEvent && !FOCUS_VISIBLE_INPUT_KEYS[e.key]);
}

/**
 * Manages focus visible state for the page, and subscribes individual components for updates.
 */
export function useFocusVisible(props: FocusVisibleProps = {}): FocusVisibleResult {
  let {isTextInput, autoFocus} = props;
  let [isFocusVisibleState, setFocusVisible] = useState(autoFocus || isFocusVisible());
  useFocusVisibleListener((isFocusVisible) => {
    setFocusVisible(isFocusVisible);
  }, [isTextInput], {isTextInput});

  return {isFocusVisible: isFocusVisibleState};
}

/**
 * Listens for trigger change and reports if focus is visible (i.e., modality is not pointer).
 */
export function useFocusVisibleListener(fn: FocusVisibleHandler, deps: ReadonlyArray<any>, opts?: {isTextInput?: boolean}): void {
  setupGlobalFocusEvents();

  useEffect(() => {
    let handler = (modality: Modality, e: HandlerEvent) => {
      // We want to early return for any keyboard events that occur inside text inputs EXCEPT for Tab and Escape
      if (!isKeyboardFocusEvent(!!(opts?.isTextInput), modality, e)) {
        return;
      }
      fn(isFocusVisible());
    };
    changeHandlers.add(handler);
    return () => {
      changeHandlers.delete(handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
