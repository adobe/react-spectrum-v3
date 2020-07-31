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

import {
  FocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  SyntheticEvent
} from 'react';

// Event bubbling can be problematic in real-world applications, so the default for React Spectrum components
// is not to propagate. This can be overridden by calling continuePropagation() on the event.
export type BaseEvent<T extends SyntheticEvent> = T & {
  /** @deprecated Use continuePropagation. */
  stopPropagation(): void,
  continuePropagation(): void
}

export type KeyboardEvent<T extends HTMLElement = HTMLElement> = BaseEvent<ReactKeyboardEvent<T>>;

export type PointerType = 'mouse' | 'pen' | 'touch' | 'keyboard' | 'virtual';

export interface PressEvent {
  /** The type of press event being fired. */
  type: 'pressstart' | 'pressend' | 'pressup' | 'press',
  /** The pointer type that triggered the press event. */
  pointerType: PointerType,
  /** The target element of the press event. */
  target: HTMLElement,
  /** Whether the shift keyboard modifier was held during the press event. */
  shiftKey: boolean,
  /** Whether the ctrl keyboard modifier was held during the press event. */
  ctrlKey: boolean,
  /** Whether the meta keyboard modifier was held during the press event. */
  metaKey: boolean
}

export interface HoverEvent {
  /** The type of hover event being fired. */
  type: 'hoverstart' | 'hoverend',
  /** The pointer type that triggered the hover event. */
  pointerType: 'mouse' | 'pen',
  /** The target element of the hover event. */
  target: HTMLElement
}

export interface KeyboardEvents<T extends HTMLElement = HTMLElement> {
  /** Handler that is called when a key is pressed. */
  onKeyDown?: (e: KeyboardEvent<T>) => void,
  /** Handler that is called when a key is released. */
  onKeyUp?: (e: KeyboardEvent<T>) => void
}

export interface FocusEvents<T extends HTMLElement = HTMLElement> {
  /** Handler that is called when the element receives focus. */
  onFocus?: (e: FocusEvent<T>) => void,
  /** Handler that is called when the element loses focus. */
  onBlur?: (e: FocusEvent<T>) => void,
  /** Handler that is called when the element's focus status changes. */
  onFocusChange?: (isFocused: boolean) => void
}

export interface HoverEvents {
  /** Handler that is called when a hover interaction starts. */
  onHoverStart?: (e: HoverEvent) => void,
  /** Handler that is called when a hover interaction ends. */
  onHoverEnd?: (e: HoverEvent) => void,
  /** Handler that is called when the hover state changes. */
  onHoverChange?: (isHovering: boolean) => void
}

export interface PressEvents {
  /** Handler that is called when the press is released over the target. */
  onPress?: (e: PressEvent) => void,
  /** Handler that is called when a press interaction starts. */
  onPressStart?: (e: PressEvent) => void,
  /**
   * Handler that is called when a press interaction ends, either
   * over the target or when the pointer leaves the target.
   */
  onPressEnd?: (e: PressEvent) => void,
  /** Handler that is called when the press state changes. */
  onPressChange?: (isPressed: boolean) => void,
  /**
   * Handler that is called when a press is released over the target, regardless of
   * whether it started on the target or not.
   */
  onPressUp?: (e: PressEvent) => void
}

export interface FocusableProps<T extends HTMLElement = HTMLElement> extends FocusEvents<T>, KeyboardEvents<T> {
  autoFocus?: boolean
}
