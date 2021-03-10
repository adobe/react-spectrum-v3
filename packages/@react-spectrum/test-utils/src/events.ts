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

import {act, fireEvent} from '@testing-library/react';
import type {ITypeOpts} from '@testing-library/user-event';
import userEvent from '@testing-library/user-event';

const LONG_PRESS_DEFAULT_THRESHOLD_IN_MS = 500;
// Triggers a "press" event on an element.
// TODO: move to somewhere more common
export function triggerPress(element, opts = {}) {
  fireEvent.mouseDown(element, {detail: 1, ...opts});
  fireEvent.mouseUp(element, {detail: 1, ...opts});
  fireEvent.click(element, {detail: 1, ...opts});
}

/**
 * Enables reading pageX/pageY from fireEvent.mouse*(..., {pageX: ..., pageY: ...}).
 */
export function installMouseEvent() {
  beforeAll(() => {
    let oldMouseEvent = MouseEvent;
    // @ts-ignore
    global.MouseEvent = class FakeMouseEvent extends MouseEvent {
      _init: {pageX: number, pageY: number};
      constructor(name, init) {
        super(name, init);
        this._init = init;
      }
      get pageX() {
        return this._init.pageX;
      }
      get pageY() {
        return this._init.pageY;
      }
    };
    // @ts-ignore
    global.MouseEvent.oldMouseEvent = oldMouseEvent;
  });
  afterAll(() => {
    // @ts-ignore
    global.MouseEvent = global.MouseEvent.oldMouseEvent;
  });
}

export function installPointerEvent() {
  beforeAll(() => {
    // @ts-ignore
    global.PointerEvent = class FakePointerEvent extends MouseEvent {
      _init: {pageX: number, pageY: number, pointerType: string, pointerId: number};
      constructor(name, init) {
        super(name, init);
        this._init = init;
      }
      get pointerType() {
        return this._init.pointerType;
      }
      get pointerId() {
        return this._init.pointerId;
      }
      get pageX() {
        return this._init.pageX;
      }
      get pageY() {
        return this._init.pageY;
      }
    };
  });
  afterAll(() => {
    // @ts-ignore
    delete global.PointerEvent;
  });
}

export function triggerTouchPress(element) {
  act(() => {
    fireEvent.touchStart(element, {targetTouches: [{}]});
  });
  act(() => {
    fireEvent.touchEnd(element, {targetTouches: [{}]});
  });
}
/**
 * Must **not** be called inside an `act` callback!
 *
 * \@testing-library/user-event's `type` helper doesn't call `act` every keystroke.
 * But we want to run all event handles after every character.
 * @param el The input element to type into.
 * @param value The text.
 */
export function typeText(el: HTMLElement, value: string, opts?: ITypeOpts) {
  let skipClick = document.activeElement === el;
  for (let char of value) {
    act(() => {
      userEvent.type(el, char, {skipClick, ...opts});
    });

    skipClick = true;
  }
}


type pointerType = 'mouse' | 'touch'

export function triggerLongPress(button: HTMLElement, pointerType: pointerType) {
  act(() => {
    if (pointerType === 'touch') {
      fireEvent.touchStart(button, {targetTouches: [{}]});
      setTimeout(() => {
        fireEvent.touchEnd(button, {targetTouches: [{}]});
      }, LONG_PRESS_DEFAULT_THRESHOLD_IN_MS);
  
    } else {
      fireEvent.mouseDown(button, {detail: 1});
      setTimeout(() => {
        fireEvent.mouseUp(button, {detail: 1});
      }, LONG_PRESS_DEFAULT_THRESHOLD_IN_MS);
    }
  
    jest.advanceTimersByTime(LONG_PRESS_DEFAULT_THRESHOLD_IN_MS);
  
  });
}
