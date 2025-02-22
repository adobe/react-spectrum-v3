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

import {act, createShadowRoot, fireEvent, installMouseEvent, installPointerEvent, render, waitFor} from '@react-spectrum/test-utils-internal';
import {ActionButton} from '@react-spectrum/button';
import {Dialog, DialogTrigger} from '@react-spectrum/dialog';
import {enableShadowDOM} from '@react-stately/flags';
import MatchMediaMock from 'jest-matchmedia-mock';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import ReactDOM, {createPortal} from 'react-dom';
import {theme} from '@react-spectrum/theme-default';
import {usePress} from '../';

function Example(props) {
  let {elementType: ElementType = 'div', style, draggable, ...otherProps} = props;
  let {pressProps} = usePress(otherProps);
  return <ElementType {...pressProps} style={style} tabIndex="0" draggable={draggable} id="testElement">{ElementType !== 'input' ? props.children || 'test' : undefined}</ElementType>;
}

function pointerEvent(type, opts) {
  let evt = new Event(type, {bubbles: true, cancelable: true, composed: true});
  Object.assign(evt, {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    button: opts.button || 0,
    width: 1,
    height: 1
  }, opts);
  return evt;
}

describe('usePress', function () {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {jest.runAllTimers();});
  });

  // TODO: JSDOM doesn't yet support pointer events. Once they do, convert these tests.
  // https://github.com/jsdom/jsdom/issues/2527
  describe('pointer events', function () {
    installPointerEvent();

    it('should fire press events based on pointer events with pointerType=mouse', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerover', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      let shouldFireMouseEvents = fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      expect(shouldFireMouseEvents).toBe(true);

      let shouldFocus = fireEvent.mouseDown(el);
      expect(shouldFocus).toBe(true);
      act(() => el.focus());

      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent.mouseUp(el);

      let shouldClick = fireEvent.click(el);
      expect(shouldClick).toBe(true);
      fireEvent(el, pointerEvent('pointerout', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      // How else to get the DOM node it renders the hook to?
      // let el = events[0].target;
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should fire press events based on pointer events with pointerType=touch', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      // Touch devices fire events in a different sequence than mouse.
      // mousedown and focus is delayed until after pointerup.
      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerover', {pointerId: 1, pointerType: 'touch', clientX: 0, clientY: 0}));

      let shouldFireCompatibilityEvents = fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'touch', clientX: 0, clientY: 0}));
      expect(shouldFireCompatibilityEvents).toBe(true);

      let shouldFocus = true;
      shouldFocus = shouldFireCompatibilityEvents = fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      expect(shouldFireCompatibilityEvents).toBe(true);
      expect(shouldFocus).toBe(true);

      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerout', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      shouldFocus = fireEvent.touchEnd(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      shouldFocus = fireEvent.mouseDown(el);
      expect(shouldFocus).toBe(true);
      act(() => el.focus());

      fireEvent.mouseUp(el);
      fireEvent.click(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should fire press events on long press even if onClick is not fired by the browser', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerover', {pointerId: 1, pointerType: 'touch', clientX: 0, clientY: 0}));

      let shouldFireCompatibilityEvents = fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'touch', clientX: 0, clientY: 0}));
      expect(shouldFireCompatibilityEvents).toBe(true);

      shouldFireCompatibilityEvents = fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      expect(shouldFireCompatibilityEvents).toBe(true);

      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerout', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      let shouldFocus = fireEvent.touchEnd(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      expect(shouldFocus).toBe(true);

      // Mouse events are not fired in this case, and the browser does not focus the element.
      act(() => jest.advanceTimersByTime(70));
      expect(document.activeElement).toBe(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should cancel press if onClick propagation is stopped', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent}>
          {/* eslint-disable-next-line */}
          <div data-testid="inner" onClick={e => e.stopPropagation()} />
        </Example>
      );

      let el = res.getByTestId('inner');
      fireEvent(el, pointerEvent('pointerover', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      let shouldFireMouseEvents = fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      expect(shouldFireMouseEvents).toBe(true);

      let shouldFocus = fireEvent.mouseDown(el);
      expect(shouldFocus).toBe(true);
      act(() => el.focus());

      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent.mouseUp(el);

      let shouldClick = fireEvent.click(el);
      expect(shouldClick).toBe(true);
      fireEvent(el, pointerEvent('pointerout', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      act(() => jest.advanceTimersByTime(70));

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el.parentElement,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el.parentElement,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el.parentElement,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });

    it('should fire press change events when moving pointer outside target', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      el.releasePointerCapture = jest.fn();
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      expect(el.releasePointerCapture).toHaveBeenCalled();
      // react listens for pointerout and pointerover instead of pointerleave and pointerenter...
      fireEvent(el, pointerEvent('pointerout', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(document, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(el, pointerEvent('pointerover', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 100,
          y: 100
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);

      events = [];
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      // react listens for pointerout and pointerover instead of pointerleave and pointerenter...
      fireEvent(el, pointerEvent('pointerout', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(el, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerover', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent.click(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 100,
          y: 100
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should handle pointer cancel events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointercancel', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });

    it('should cancel press on dragstart', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, new MouseEvent('dragstart', {bubbles: true, cancelable: true, composed: true}));

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });

    it('should cancel press when moving outside and the shouldCancelOnPointerExit option is set', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          shouldCancelOnPointerExit
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(el, pointerEvent('pointerout', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(el, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerover', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 100,
          y: 100
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });

    it('should handle modifier keys', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', shiftKey: true, clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', ctrlKey: true, clientX: 0, clientY: 0}));
      fireEvent.click(el, {ctrlKey: true});

      // How else to get the DOM node it renders the hook to?
      // let el = events[0].target;
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: true,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should only handle left clicks', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', button: 1}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', button: 1, clientX: 0, clientY: 0}));
      fireEvent.click(el, {button: 1});
      expect(events).toEqual([]);
    });

    it('should not focus the target on click if preventFocusOnPress is true', function () {
      let res = render(
        <Example preventFocusOnPress />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      expect(document.activeElement).not.toBe(el);
    });

    it('should ignore virtual pointer events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', width: 0, height: 0, clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', width: 0, height: 0, clientX: 0, clientY: 0}));

      expect(events).toEqual([]);

      fireEvent.click(el);
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'press',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should not ignore virtual pointer events on android ', function () {
      let uaMock = jest.spyOn(navigator, 'userAgent', 'get').mockImplementation(() => 'Android');

      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', width: 0, height: 0, clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', width: 0, height: 0, clientX: 0, clientY: 0}));
      fireEvent.click(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);

      uaMock.mockRestore();
    });

    it('should detect Android TalkBack double tap', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      // Android TalkBack will occasionally fire a pointer down event with "width: 1, height: 1" instead of "width: 0, height: 0".
      // Make sure we can still determine that this is a virtual event by checking the pressure, detail, and height/width.
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, width: 1, height: 1, pressure: 0, detail: 0, pointerType: 'mouse'}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, width: 1, height: 1, pressure: 0, detail: 0, pointerType: 'mouse'}));
      expect(events).toEqual([]);

      // Virtual pointer event sets pointerType and onClick handles the rest
      fireEvent.click(el, {pointerType: 'mouse', width: 1, height: 1, detail: 1});
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'press',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should not fire press events for disabled elements', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          isDisabled
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      expect(events).toEqual([]);
    });

    it('should fire press event when pointerup close to the target', function () {
      let spy = jest.fn();
      let res = render(<Example onPress={spy} />);

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0, width: 20, height: 20}));
      fireEvent(el, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 10, clientY: 10, width: 20, height: 20}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 10, clientY: 10, width: 20, height: 20}));
      fireEvent.click(el);

      expect(spy).toHaveBeenCalled();
    });

    it('should add/remove user-select: none to the element on pointer down/up', function () {
      let res = render(
        <Example />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      expect(el).toHaveStyle('user-select: none');
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent.click(el);
      expect(el).not.toHaveStyle('user-select: none');
    });
  });

  describe('mouse events', function () {
    it('should fire press events based on mouse events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      let shouldFocus = fireEvent.mouseDown(el, {detail: 1});
      expect(shouldFocus).toBe(true);
      act(() => el.focus());
      fireEvent.mouseUp(el, {detail: 1});
      let shouldClick = fireEvent.click(el, {detail: 1});
      expect(shouldClick).toBe(true);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should fire press change events when moving mouse outside target', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.mouseDown(el, {detail: 1});
      fireEvent.mouseLeave(el);
      fireEvent.mouseUp(document.body, {detail: 1, clientX: 100, clientY: 100});
      fireEvent.mouseEnter(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);

      events = [];
      fireEvent.mouseDown(el, {detail: 1});
      fireEvent.mouseLeave(el);
      fireEvent.mouseEnter(el);
      fireEvent.mouseUp(el, {detail: 1});
      fireEvent.click(el, {detail: 1});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should cancel press when moving outside and the shouldCancelOnPointerExit option is set', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          shouldCancelOnPointerExit
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.mouseDown(el, {detail: 1});
      fireEvent.mouseLeave(el);
      fireEvent.mouseEnter(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });

    it('should handle modifier keys', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.mouseDown(el, {detail: 1, metaKey: true});
      fireEvent.mouseUp(el, {detail: 1, shiftKey: true});
      fireEvent.click(el, {detail: 1, shiftKey: true});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: true,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: true,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: true,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: true,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should only handle left clicks', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.mouseDown(el, {detail: 1, button: 1});
      fireEvent.mouseUp(el, {detail: 1, button: 1});
      fireEvent.click(el, {detail: 1, button: 1});

      expect(events).toEqual([]);
    });

    it('should not focus the element on click if preventFocusOnPress is true', function () {
      let res = render(
        <Example preventFocusOnPress />
      );

      let el = res.getByText('test');
      fireEvent.mouseDown(el);
      fireEvent.mouseUp(el);
      fireEvent.click(el);

      expect(document.activeElement).not.toBe(el);
    });

    it('should focus the element on click by default', function () {
      let res = render(
        <Example />
      );

      let el = res.getByText('test');
      let shouldFocus = fireEvent.mouseDown(el);
      if (shouldFocus) {
        act(() => el.focus());
      }
      fireEvent.mouseUp(el);
      fireEvent.click(el);

      expect(document.activeElement).toBe(el);
    });

    it('should cancel press on dragstart', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.mouseDown(el, {detail: 1});
      fireEvent(el, new MouseEvent('dragstart', {bubbles: true, cancelable: true, composed: true}));

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });
  });

  describe('touch events', function () {
    it('should fire press events based on touch events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should fire press change events when moving touch outside target', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);

      events = [];
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should cancel press when moving outside and the shouldCancelOnPointerExit option is set', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          shouldCancelOnPointerExit
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });

    it('should ignore emulated mouse events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.mouseDown(el);
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});
      fireEvent.mouseLeave(el);
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.mouseEnter(el);
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.mouseUp(el);
      fireEvent.click(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should handle touch cancel events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.touchCancel(el);
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });

    it('should cancel press after scroll events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.scroll(document.body);
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });

    it('should not cancel press after scroll events in unrelated scrollable regions', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <>
          <Example
            onPressStart={addEvent}
            onPressEnd={addEvent}
            onPressChange={pressed => addEvent({type: 'presschange', pressed})}
            onPress={addEvent}
            onPressUp={addEvent} />
          <div data-testid="scrollable" />
        </>
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});

      let scrollable = res.getByTestId('scrollable');
      fireEvent.scroll(scrollable);

      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should cancel press on dragstart', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent(el, new MouseEvent('dragstart', {bubbles: true, cancelable: true, composed: true}));

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });

    it('should not focus the target if preventFocusOnPress is true', function () {
      let res = render(
        <Example preventFocusOnPress />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});

      expect(document.activeElement).not.toBe(el);
    });

    it('should focus the target on touch by default', function () {
      let res = render(
        <Example />
      );

      let el = res.getByText('test');
      let shouldFocus = fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      let shouldFocus2 = fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      if (shouldFocus && shouldFocus2) {
        act(() => el.focus());
      }

      expect(document.activeElement).toBe(el);
    });

    it('should fire press event when touchup close to the target', function () {
      let spy = jest.fn();
      let res = render(<Example onPress={spy} />);

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 0, clientY: 0, radiusX: 15, radiusY: 15}]});
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 10, clientY: 10, radiusX: 15, radiusY: 15}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 10, clientY: 10, radiusX: 15, radiusY: 15}]});

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('keyboard events', function () {
    it('should fire press events when the element is not a link', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = getByText('test');
      fireEvent.keyDown(el, {key: ' '});
      fireEvent.keyUp(el, {key: ' '});
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should fire press events when the element is a link', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          elementType="a"
          href="#"
          onClick={e => {e.preventDefault(); addEvent({type: 'click'});}}
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = getByText('test');
      fireEvent.keyDown(el, {key: ' '});
      fireEvent.keyUp(el, {key: ' '});

      // Space key handled should do nothing on a link
      expect(events).toEqual([]);

      let shouldContinue = fireEvent.keyDown(el, {key: 'Enter'});
      if (shouldContinue) {
        // Browser fires click event as default action of keydown event.
        fireEvent.click(el);
      }
      fireEvent.keyUp(el, {key: 'Enter'});

      // Click event, which is called when Enter key on a link is handled natively, should trigger a click.
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'click'
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should fire press events on Enter when the element role is link', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          role="link"
          onClick={e => {e.preventDefault(); addEvent({type: 'click'});}}
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = getByText('test');
      fireEvent.keyDown(el, {key: ' '});
      fireEvent.keyUp(el, {key: ' '});

      // Space key should do nothing on an element with role="link"
      expect(events).toEqual([]);

      fireEvent.keyDown(el, {key: 'Enter'});
      fireEvent.keyUp(el, {key: 'Enter'});

      // Enter key should trigger press events on element with role="link"
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should explicitly call click method when Space key is triggered on a link with href and role="button"', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          elementType="a"
          role="button"
          href="#"
          onClick={e => {e.preventDefault(); addEvent({type: 'click'});}}
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = getByText('test');

      // Space key handled by explicitly calling click
      fireEvent.keyDown(el, {key: ' '});
      fireEvent.keyUp(el, {key: ' '});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'click'
        }
      ]);
    });

    it('should handle modifier keys', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.keyDown(el, {key: ' ', shiftKey: true});
      fireEvent.keyUp(el, {key: ' ', ctrlKey: true});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: true,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should fire press events when Meta key is held to work around macOS bug', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let spy = jest.spyOn(window.navigator, 'platform', 'get').mockImplementation(() => 'Mac');

      let el = res.getByText('test');
      fireEvent.keyDown(el, {key: 'Meta'});
      fireEvent.keyDown(el, {key: 'Enter', metaKey: true});
      // macOS doesn't fire keyup events while Meta key is held.
      // we simulate this when the Meta key itself is released.
      fireEvent.keyUp(el, {key: 'Meta'});
      spy.mockRestore();

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: true,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: true,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: true,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: true,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should handle when focus moves between keydown and keyup', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = getByText('test');
      fireEvent.keyDown(el, {key: ' '});
      fireEvent.keyUp(document.body, {key: ' '});

      fireEvent.keyDown(el, {key: ' '});
      fireEvent.keyUp(el, {key: ' '});

      expect(events).toEqual([
        // First sequence. Ensure the key up on the body causes a press end.
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },

        // Second sequence. Ensure `isPressed` is reset to false on key up.
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should ignore repeating keyboard events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = getByText('test');
      fireEvent.keyDown(el, {key: ' ', repeat: true});
      fireEvent.keyUp(document.body, {key: ' '});

      expect(events).toEqual([]);
    });

    it('should fire press events on checkboxes but not prevent default', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByRole} = render(
        <Example
          elementType="input"
          type="checkbox"
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = getByRole('checkbox');
      fireEvent.keyDown(el, {key: 'Enter'});
      fireEvent.keyUp(el, {key: 'Enter'});

      // Enter key handled should do nothing on a checkbox
      expect(events).toEqual([]);

      let allow = fireEvent.keyDown(el, {key: ' '});
      expect(allow).toBeTruthy();
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        }
      ]);

      allow = fireEvent.keyUp(el, {key: ' '});
      expect(allow).toBeTruthy();
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });
  });

  describe('virtual click events', function () {
    it('should fire press events events for virtual click events from screen readers', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = getByText('test');
      fireEvent.click(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    it('should ignore synthetic events fired during an onPressUp event', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={e => {
            addEvent(e);
            e.target.click();
          }} />
      );

      let el = getByText('test');
      // no on mouse down because this is simulating it coming from another element.
      fireEvent.mouseUp(el, {detail: 1});

      expect(events).toEqual([
        {
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });
  });

  it('should not focus the target if preventFocusOnPress is true', function () {
    let {getByText} = render(
      <Example preventFocusOnPress />
    );

    let el = getByText('test');
    fireEvent.click(el);

    expect(document.activeElement).not.toBe(el);
  });

  describe('disable text-selection when pressed', function () {
    let handler = jest.fn();
    let mockUserSelect = 'contain';
    let oldUserSelect = document.documentElement.style.webkitUserSelect;
    let platformGetter;

    function TestStyleChange(props) {
      let {styleToApply, ...otherProps} = props;
      let [show, setShow] = React.useState(false);
      let {pressProps} = usePress({...otherProps, onPressStart: () => setTimeout(() => setShow(true), 3000)});
      return (
        <div style={show ? styleToApply : {}} {...pressProps}>test</div>
      );
    }

    beforeAll(() => {
      platformGetter = jest.spyOn(window.navigator, 'platform', 'get');
    });

    afterAll(() => {
      handler.mockClear();
      jest.restoreAllMocks();
    });

    beforeEach(() => {
      document.documentElement.style.webkitUserSelect = mockUserSelect;
      platformGetter.mockReturnValue('iPhone');
    });
    afterEach(() => {
      document.documentElement.style.webkitUserSelect = oldUserSelect;
    });

    it('should add user-select: none to the page on press start (iOS)', function () {
      let {getByText} = render(
        <Example
          onPressStart={handler}
          onPressEnd={handler}
          onPressChange={handler}
          onPress={handler}
          onPressUp={handler} />
      );

      let el = getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      expect(document.documentElement.style.webkitUserSelect).toBe('none');
      expect(el).not.toHaveStyle('user-select: none');
      fireEvent.touchEnd(el, {targetTouches: [{identifier: 1}]});
    });

    it('should not add user-select: none to the page when press start (non-iOS)', function () {
      platformGetter.mockReturnValue('Android');
      let {getByText} = render(
        <Example
          onPressStart={handler}
          onPressEnd={handler}
          onPressChange={handler}
          onPress={handler}
          onPressUp={handler} />
      );

      let el = getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      expect(document.documentElement.style.webkitUserSelect).toBe(mockUserSelect);
      expect(el).toHaveStyle('user-select: none');
    });

    it('should remove user-select: none from the page when press end (iOS)', function () {
      let {getByText} = render(
        <Example
          onPressStart={handler}
          onPressEnd={handler}
          onPressChange={handler}
          onPress={handler}
          onPressUp={handler} />
      );

      let el = getByText('test');

      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1}]});

      act(() => {jest.advanceTimersByTime(316);});
      expect(document.documentElement.style.webkitUserSelect).toBe(mockUserSelect);

      // Checkbox doesn't remove `user-select: none;` style from HTML Element issue
      // see https://github.com/adobe/react-spectrum/issues/862
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1}]});
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});
      act(() => {jest.advanceTimersByTime(300);});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});
      act(() => {jest.advanceTimersByTime(300);});

      expect(document.documentElement.style.webkitUserSelect).toBe(mockUserSelect);
    });

    it('should remove user-select: none from the element when press end (non-iOS)', function () {
      platformGetter.mockReturnValue('Android');
      let {getByText} = render(
        <Example
          style={{userSelect: 'text'}}
          onPressStart={handler}
          onPressEnd={handler}
          onPressChange={handler}
          onPress={handler}
          onPressUp={handler} />
      );

      let el = getByText('test');

      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      expect(el).toHaveStyle('user-select: none');
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1}]});
      expect(el).toHaveStyle('user-select: text');

      // Checkbox doesn't remove `user-select: none;` style from HTML Element issue
      // see https://github.com/adobe/react-spectrum/issues/862
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1}]});
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});
      expect(el).toHaveStyle('user-select: text');
    });

    it('should not remove user-select: none when pressing two different elements quickly (iOS)', function () {
      let {getAllByText} = render(
        <>
          <Example
            onPressStart={handler}
            onPressEnd={handler}
            onPressChange={handler}
            onPress={handler}
            onPressUp={handler} />
          <Example
            onPressStart={handler}
            onPressEnd={handler}
            onPressChange={handler}
            onPress={handler}
            onPressUp={handler} />
        </>
      );

      let els = getAllByText('test');

      fireEvent.touchStart(els[0], {targetTouches: [{identifier: 1}]});
      fireEvent.touchEnd(els[0], {changedTouches: [{identifier: 1}]});

      expect(document.documentElement.style.webkitUserSelect).toBe('none');

      fireEvent.touchStart(els[1], {targetTouches: [{identifier: 1}]});

      act(() => {jest.advanceTimersByTime(300);});
      expect(document.documentElement.style.webkitUserSelect).toBe('none');

      fireEvent.touchEnd(els[1], {changedTouches: [{identifier: 1}]});

      act(() => {jest.advanceTimersByTime(300);});
      expect(document.documentElement.style.webkitUserSelect).toBe(mockUserSelect);
    });

    it('should not remove user-select: none when pressing two different elements quickly (iOS)', function () {
      let {getAllByText} = render(
        <>
          <Example
            onPressStart={handler}
            onPressEnd={handler}
            onPressChange={handler}
            onPress={handler}
            onPressUp={handler} />
          <Example
            onPressStart={handler}
            onPressEnd={handler}
            onPressChange={handler}
            onPress={handler}
            onPressUp={handler} />
        </>
      );

      let els = getAllByText('test');

      fireEvent.touchStart(els[0], {targetTouches: [{identifier: 1}]});
      fireEvent.touchEnd(els[0], {changedTouches: [{identifier: 1}]});

      expect(document.documentElement.style.webkitUserSelect).toBe('none');

      fireEvent.touchStart(els[1], {targetTouches: [{identifier: 1}]});

      act(() => {jest.advanceTimersByTime(300);});
      expect(document.documentElement.style.webkitUserSelect).toBe('none');

      fireEvent.touchEnd(els[1], {changedTouches: [{identifier: 1}]});

      act(() => {jest.advanceTimersByTime(300);});
      expect(document.documentElement.style.webkitUserSelect).toBe(mockUserSelect);
    });

    it('should clean up user-select: none when pressing and releasing two different elements (non-iOS)', function () {
      platformGetter.mockReturnValue('Android');
      let {getAllByText} = render(
        <>
          <Example
            style={{userSelect: 'text'}}
            onPressStart={handler}
            onPressEnd={handler}
            onPressChange={handler}
            onPress={handler}
            onPressUp={handler} />
          <Example
            style={{userSelect: 'text'}}
            onPressStart={handler}
            onPressEnd={handler}
            onPressChange={handler}
            onPress={handler}
            onPressUp={handler} />
        </>
      );

      let els = getAllByText('test');

      fireEvent.touchStart(els[0], {targetTouches: [{identifier: 1}]});
      fireEvent.touchStart(els[1], {targetTouches: [{identifier: 2}]});

      expect(els[0]).toHaveStyle('user-select: none');
      expect(els[1]).toHaveStyle('user-select: none');

      fireEvent.touchEnd(els[0], {changedTouches: [{identifier: 1}]});
      expect(els[0]).toHaveStyle('user-select: text');
      expect(els[1]).toHaveStyle('user-select: none');

      fireEvent.touchEnd(els[1], {changedTouches: [{identifier: 2}]});
      expect(els[0]).toHaveStyle('user-select: text');
      expect(els[1]).toHaveStyle('user-select: text');
    });

    it('should remove user-select: none from the page if pressable component unmounts (iOS)', function () {
      let {getByText, unmount} = render(
        <Example
          onPressStart={handler}
          onPressEnd={handler}
          onPressChange={handler}
          onPress={handler}
          onPressUp={handler} />
      );

      let el = getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      expect(document.documentElement.style.webkitUserSelect).toBe('none');

      unmount();
      act(() => {jest.advanceTimersByTime(316);});
      expect(document.documentElement.style.webkitUserSelect).toBe(mockUserSelect);
    });

    it('non related style changes during press down shouldn\'t overwrite user-select on press end (non-iOS)', function () {
      platformGetter.mockReturnValue('Android');
      let {getByText} = render(
        <TestStyleChange
          styleToApply={{background: 'red'}}
          onPressStart={handler}
          onPressEnd={handler}
          onPressChange={handler}
          onPress={handler}
          onPressUp={handler} />
      );

      let el = getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      expect(el).toHaveStyle(`
        user-select: none;
      `);

      act(() => jest.runAllTimers());

      expect(el).toHaveStyle(`
        user-select: none;
        background: red;
      `);

      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1}]});
      expect(el).toHaveStyle(`
        background: red;
      `);
    });

    it('changes to user-select during press down remain on press end (non-iOS)', function () {
      platformGetter.mockReturnValue('Android');
      let {getByText} = render(
        <TestStyleChange
          styleToApply={{background: 'red', userSelect: 'text'}}
          onPressStart={handler}
          onPressEnd={handler}
          onPressChange={handler}
          onPress={handler}
          onPressUp={handler} />
      );

      let el = getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      expect(el).toHaveStyle(`
        user-select: none;
      `);

      act(() => jest.runAllTimers());

      expect(el).toHaveStyle(`
        user-select: text;
        background: red;
      `);

      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1}]});
      expect(el).toHaveStyle(`
        user-select: text;
        background: red;
      `);
    });
  });

  describe('event bubbling', () => {
    function Pressable(props) {
      let {pressProps} = usePress(props);
      return (
        <div {...pressProps} data-testid={props['data-testid']}>
          {props.children}
        </div>
      );
    }

    describe.each`
      type                | prepare               | actions
      ${'Mouse Events'}   | ${installMouseEvent}  | ${[
        (el) => fireEvent.mouseDown(el, {button: 0}),
        (el) => fireEvent.mouseUp(el, {button: 0})
      ]}
      ${'Pointer Events'} | ${installPointerEvent}| ${[
        (el) => fireEvent.pointerDown(el, {button: 0, pointerId: 1}),
        (el) => fireEvent.pointerUp(el, {button: 0, pointerId: 1})
      ]}
      ${'Touch Events'}   | ${() => {}}           | ${[
        (el) => fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]}),
        (el) => fireEvent.touchEnd(el, {changedTouches: [{identifier: 1}]})
      ]}
    `('$type', ({actions: [start, end], prepare}) => {
      prepare();

      it('should stop propagation by default', () => {
        let outerPressMock = jest.fn();
        let innerPressMock = jest.fn();
        let res = render(
          <Pressable
            onPressStart={outerPressMock}
            onPressEnd={outerPressMock}
            onPress={outerPressMock}>
            <Pressable
              data-testid="test"
              onPressStart={innerPressMock}
              onPressEnd={innerPressMock}
              onPress={innerPressMock}>
              inner
            </Pressable>
          </Pressable>
        );

        let el = res.getByTestId('test');
        start(el);
        end(el);
        fireEvent.click(el);
        expect(outerPressMock.mock.calls).toHaveLength(0);
        expect(innerPressMock.mock.calls).toHaveLength(3);
      });

      it('should allow propagation if continuePropagation is called', () => {
        let outerPressMock = jest.fn();
        let innerPressMock = jest.fn().mockImplementation(e => e.continuePropagation());
        let res = render(
          <Pressable
            onPressStart={outerPressMock}
            onPressEnd={outerPressMock}
            onPress={outerPressMock}
            onPressUp={outerPressMock}>
            <Pressable
              data-testid="test"
              onPressStart={innerPressMock}
              onPressEnd={innerPressMock}
              onPress={innerPressMock}
              onPressUp={innerPressMock}>
              inner
            </Pressable>
          </Pressable>
        );

        let el = res.getByTestId('test');
        start(el);
        end(el);
        fireEvent.click(el);
        expect(outerPressMock.mock.calls).toHaveLength(4);
        expect(innerPressMock.mock.calls).toHaveLength(4);
      });
    });
  });

  describe('portal event bubbling', () => {
    function PortalExample(props) {
      let {elementType: ElementType = 'div', ...otherProps} = props;
      let {pressProps} = usePress(otherProps);
      return (
        <Provider theme={theme}>
          <ElementType {...pressProps} tabIndex="0">
            <DialogTrigger>
              <ActionButton>open</ActionButton>
              <Dialog>
                test
              </Dialog>
            </DialogTrigger>
          </ElementType>
        </Provider>
      );
    }

    beforeAll(() => {
      jest.useFakeTimers();
    });

    let matchMedia;
    beforeEach(() => {
      matchMedia = new MatchMediaMock();
    });

    afterEach(() => {
      // Ensure we close any dialogs before unmounting to avoid warning.
      let dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        fireEvent.keyDown(dialog, {key: 'Escape'});
        fireEvent.keyUp(dialog, {key: 'Escape'});
        act(() => {
          jest.runAllTimers();
        });
      }

      matchMedia.clear();
    });

    describe.each`
      type                | prepare               | actions
      ${'Mouse Events'}   | ${installMouseEvent}  | ${[
        (el) => fireEvent.mouseDown(el, {button: 0}),
        (el) => fireEvent.mouseUp(el, {button: 0})
      ]}
      ${'Pointer Events'} | ${installPointerEvent}| ${[
        (el) => fireEvent.pointerDown(el, {button: 0, pointerId: 1}),
        (el) => fireEvent.pointerUp(el, {button: 0, pointerId: 1})
      ]}
      ${'Touch Events'}   | ${() => {}}           | ${[
        (el) => fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]}),
        (el) => fireEvent.touchEnd(el, {changedTouches: [{identifier: 1}]})
      ]}
    `('$type', ({actions: [start, end], prepare}) => {
      prepare();

      it('stop event bubbling through portal', () => {
        const pressMock = jest.fn();
        let res = render(
          <PortalExample
            onPressStart={pressMock}
            onPressEnd={pressMock}
            onPressChange={pressMock}
            onPress={pressMock}
            onPressUp={pressMock} />
        );

        fireEvent.click(res.getByText('open'));

        act(() => {
          jest.runAllTimers();
        });

        let el = res.getByText('test');
        start(el);
        end(el);
        expect(pressMock.mock.calls).toHaveLength(0);
      });
    });
  });

  describe('Owner document and window', () => {
    let iframe;
    let iframeRoot;
    beforeEach(() => {
      iframe = document.createElement('iframe');
      window.document.body.appendChild(iframe);
      iframeRoot = iframe.contentWindow.document.createElement('div');
      iframe.contentWindow.document.body.appendChild(iframeRoot);
    });

    afterEach(() => {
      iframe.remove();
    });

    const IframeExample = (props) => {
      return createPortal(<Example
        {...props}
        data-testid="example" />, iframeRoot);
    };

    describe('Pointer events', () => {
      installPointerEvent();

      test('should fire press events based on pointer events', async () => {
        let events = [];
        let addEvent = (e) => events.push(e);
        render(
          <IframeExample
            onPressStart={addEvent}
            onPressEnd={addEvent}
            onPressChange={pressed => addEvent({type: 'presschange', pressed})}
            onPress={addEvent}
            onPressUp={addEvent} />
        );

        await waitFor(() => {
          expect(document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
        });

        const el = document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]');
        fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
        fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
        fireEvent.click(el);

        expect(events).toEqual([
          {
            type: 'pressstart',
            target: el,
            pointerType: 'mouse',
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            altKey: false,
            x: 0,
            y: 0
          },
          {
            type: 'presschange',
            pressed: true
          },
          {
            type: 'pressup',
            target: el,
            pointerType: 'mouse',
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            altKey: false,
            x: 0,
            y: 0
          },
          {
            type: 'pressend',
            target: el,
            pointerType: 'mouse',
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            altKey: false,
            x: 0,
            y: 0
          },
          {
            type: 'presschange',
            pressed: false
          },
          {
            type: 'press',
            target: el,
            pointerType: 'mouse',
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            altKey: false,
            x: 0,
            y: 0
          }
        ]);
      });
    });

    test('should handle keyboard events', async function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      render(
        <IframeExample
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      await waitFor(() => {
        expect(iframe.contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
      });

      const el = iframe.contentWindow.document.body.querySelector('div[data-testid="example"]');
      fireEvent.keyDown(el, {key: ' '});
      fireEvent.keyUp(el, {key: ' '});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });

    describe('Mouse events', () => {
      installMouseEvent();

      test('should fire press events based on mouse events', async () => {
        let events = [];
        let addEvent = (e) => events.push(e);
        render(
          <IframeExample
            onPressStart={addEvent}
            onPressEnd={addEvent}
            onPressChange={pressed => addEvent({type: 'presschange', pressed})}
            onPress={addEvent}
            onPressUp={addEvent} />
        );

        await waitFor(() => {
          expect(document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
        });

        const el = document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]');
        fireEvent.mouseDown(el, {detail: 1});
        fireEvent.mouseUp(el, {detail: 1});
        fireEvent.click(el, {detail: 1});

        expect(events).toEqual([
          {
            type: 'pressstart',
            target: el,
            pointerType: 'mouse',
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            altKey: false,
            x: 0,
            y: 0
          },
          {
            type: 'presschange',
            pressed: true
          },
          {
            type: 'pressup',
            target: el,
            pointerType: 'mouse',
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            altKey: false,
            x: 0,
            y: 0
          },
          {
            type: 'pressend',
            target: el,
            pointerType: 'mouse',
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            altKey: false,
            x: 0,
            y: 0
          },
          {
            type: 'presschange',
            pressed: false
          },
          {
            type: 'press',
            target: el,
            pointerType: 'mouse',
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            altKey: false,
            x: 0,
            y: 0
          }
        ]);
      });

    });

    test('should fire press events events for virtual click events from screen readers', async () => {
      let events = [];
      let addEvent = (e) => events.push(e);
      render(
        <IframeExample
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      await waitFor(() => {
        expect(document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
      });

      const el = document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]');

      fireEvent.click(el);
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        },
        {
          type: 'press',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }
      ]);
    });
  });

  describe('usePress with Shadow DOM', function () {
    installPointerEvent();
    let unmount;
    let events = [];
    let addEvent = (e) => events.push(e);

    function setupShadowDOMTest(extraProps = {}, isDraggable = false) {
      const {shadowRoot} = createShadowRoot();
      events = [];
      addEvent = (e) => events.push(e);
      const ExampleComponent = () => ReactDOM.createPortal(
        <div draggable={isDraggable}>
          <Example
            onPressStart={addEvent}
            onPressEnd={addEvent}
            onPressChange={pressed => addEvent({type: 'presschange', pressed})}
            onPress={addEvent}
            onPressUp={addEvent}
            {...extraProps} />
        </div>,
        shadowRoot
      );

      const {unmount: _unmount} = render(<ExampleComponent />);
      unmount = _unmount;

      return shadowRoot;
    }

    beforeAll(() => {
      enableShadowDOM();
      jest.useFakeTimers();
    });

    afterEach(() => {
      act(() => {jest.runAllTimers();});
      unmount();
    });

    it('should fire press events based on pointer events', function () {
      const shadowRoot = setupShadowDOMTest();

      const el = shadowRoot.getElementById('testElement');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent.click(el);

      expect(events).toEqual([
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: true
        }),
        expect.objectContaining({
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: false
        }),
        expect.objectContaining({
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        })
      ]);
    });

    it('should fire press change events when moving pointer outside target', function () {
      const shadowRoot = setupShadowDOMTest();

      const el = shadowRoot.getElementById('testElement');
      el.releasePointerCapture = jest.fn();
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      expect(el.releasePointerCapture).toHaveBeenCalled();
      // react listens for pointerout and pointerover instead of pointerleave and pointerenter...
      fireEvent(el, pointerEvent('pointerout', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(document, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(el, pointerEvent('pointerover', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      expect(events).toEqual([
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: true
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: false
        })
      ]);

      events = [];
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      // react listens for pointerout and pointerover instead of pointerleave and pointerenter...
      fireEvent(el, pointerEvent('pointerout', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(el, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerover', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent.click(el);

      expect(events).toEqual([
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: true
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: false
        }),
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: true
        }),
        expect.objectContaining({
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: false
        }),
        expect.objectContaining({
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        })
      ]);
    });

    it('should handle pointer cancel events', function () {
      const shadowRoot = setupShadowDOMTest();

      const el = shadowRoot.getElementById('testElement');

      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(el, pointerEvent('pointercancel', {pointerId: 1, pointerType: 'mouse'}));

      expect(events).toEqual([
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: true
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: false
        })
      ]);
    });

    it('should cancel press on dragstart', function () {
      const shadowRoot = setupShadowDOMTest();

      const el = shadowRoot.getElementById('testElement');

      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(el, new MouseEvent('dragstart', {bubbles: true, cancelable: true, composed: true}));

      expect(events).toEqual([
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: true
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: false
        })
      ]);
    });

    it('should clean up press state if pointerup was outside the shadow dom', function () {
      const shadowRoot = setupShadowDOMTest({shouldCancelOnPointerExit: true});

      const el = shadowRoot.getElementById('testElement');

      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(el, pointerEvent('pointerout', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(document.body, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(document.body, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      expect(events).toEqual([
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: true
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: false
        }),
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: true
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: false
        })
      ]);
    });

    it('should cancel press when moving outside and the shouldCancelOnPointerExit option is set', function () {
      const shadowRoot = setupShadowDOMTest({shouldCancelOnPointerExit: true});

      const el = shadowRoot.getElementById('testElement');

      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(el, pointerEvent('pointerout', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(el, pointerEvent('pointerover', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      expect(events).toEqual([
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: true
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: false
        })
      ]);
    });

    it('should handle modifier keys', function () {
      const shadowRoot = setupShadowDOMTest();

      const el = shadowRoot.getElementById('testElement');

      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', shiftKey: true, clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', ctrlKey: true, clientX: 0, clientY: 0}));
      fireEvent.click(el, {ctrlKey: true});

      expect(events).toEqual([
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: true,
          altKey: false,
          x: 0,
          y: 0
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: true
        }),
        expect.objectContaining({
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'presschange',
          pressed: false
        }),
        expect.objectContaining({
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
          altKey: false
        })
      ]);
    });

    it('should only handle left clicks', function () {
      const shadowRoot = setupShadowDOMTest();

      const el = shadowRoot.getElementById('testElement');

      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', button: 1}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', button: 1, clientX: 0, clientY: 0}));
      expect(events).toEqual([]);
    });

    it('should ignore virtual pointer events', function () {
      const shadowRoot = setupShadowDOMTest({onPressChange: null});

      const el = shadowRoot.getElementById('testElement');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', width: 0, height: 0}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', width: 0, height: 0, clientX: 0, clientY: 0}));

      expect(events).toEqual([]);

      fireEvent.click(el);
      expect(events).toEqual([
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }),
        expect.objectContaining({
          type: 'pressup',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'press',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        })
      ]);
    });

    it('should not ignore virtual pointer events on android ', function () {
      let uaMock = jest.spyOn(navigator, 'userAgent', 'get').mockImplementation(() => 'Android');

      const shadowRoot = setupShadowDOMTest({onPressChange: null});

      const el = shadowRoot.getElementById('testElement');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', width: 0, height: 0}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', width: 0, height: 0, clientX: 0, clientY: 0}));
      fireEvent.click(el);

      expect(events).toEqual([
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }),
        expect.objectContaining({
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        })
      ]);

      uaMock.mockRestore();
    });

    it('should detect Android TalkBack double tap', function () {
      const shadowRoot = setupShadowDOMTest({onPressChange: null});

      const el = shadowRoot.getElementById('testElement');
      // Android TalkBack will occasionally fire a pointer down event with "width: 1, height: 1" instead of "width: 0, height: 0".
      // Make sure we can still determine that this is a virtual event by checking the pressure, detail, and height/width.
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, width: 1, height: 1, pressure: 0, detail: 0, pointerType: 'mouse'}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, width: 1, height: 1, pressure: 0, detail: 0, pointerType: 'mouse'}));
      expect(events).toEqual([]);

      // Virtual pointer event sets pointerType and onClick handles the rest
      fireEvent.click(el, {pointerType: 'mouse', width: 1, height: 1, detail: 1});
      expect(events).toEqual([
        expect.objectContaining({
          type: 'pressstart',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 0,
          y: 0
        }),
        expect.objectContaining({
          type: 'pressup',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'pressend',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        }),
        expect.objectContaining({
          type: 'press',
          target: el,
          pointerType: 'virtual',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false
        })
      ]);
    });

    it('should not fire press events for disabled elements', function () {
      const shadowRoot = setupShadowDOMTest({isDisabled: true});

      const el = shadowRoot.getElementById('testElement');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      expect(events).toEqual([]);
    });

    it('should fire press event when pointerup close to the target', function () {
      let spy = jest.fn();
      const shadowRoot = setupShadowDOMTest({onPress: spy});

      const el = shadowRoot.getElementById('testElement');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0, width: 20, height: 20}));
      fireEvent(el, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 10, clientY: 10, width: 20, height: 20}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 10, clientY: 10, width: 20, height: 20}));
      fireEvent.click(el, {clientX: 10, clientY: 10});

      expect(spy).toHaveBeenCalled();
    });

    it('should add/remove user-select: none to the element on pointer down/up', function () {
      const shadowRoot = setupShadowDOMTest();

      const el = shadowRoot.getElementById('testElement');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      expect(el).toHaveStyle('user-select: none');
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent.click(el);
      expect(el).not.toHaveStyle('user-select: none');
    });
  });
});


describe('coordinates', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {jest.runAllTimers();});
  });

  const DEFAULT_SIZE = 100;
  const getBoundingClientRect = ({
    width = DEFAULT_SIZE,
    height = DEFAULT_SIZE,
    x = 0,
    y = 0,
    top = 0,
    left = 0,
    bottom = y + DEFAULT_SIZE,
    right = x + DEFAULT_SIZE
  }) => ({
    width,
    height,
    x,
    y,
    top,
    left,
    bottom,
    right,
    toJSON() { return this; }
  });
  describe('pointer', () => {
    installPointerEvent();

    it('mouse pointer events should have coordinates', function () {
      jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
        () => getBoundingClientRect({})
      );
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', clientX: 25, clientY: 0}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 75, clientY: 75}));
      fireEvent.click(el, {clientX: 75, clientY: 75});

      // How else to get the DOM node it renders the hook to?
      // let el = events[0].target;
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 25,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 75,
          y: 75
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 75,
          y: 75
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 75,
          y: 75
        }
      ]);
    });

    it('pointer touch events should have coordinates', function () {
      jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
        () => getBoundingClientRect({})
      );
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent}
          onPressUp={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'touch', clientX: 25, clientY: 0}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'touch', clientX: 75, clientY: 75}));
      fireEvent.click(el, {clientX: 75, clientY: 75});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 25,
          y: 0
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressup',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 75,
          y: 75
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 75,
          y: 75
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
          x: 75,
          y: 75
        }
      ]);
    });
  });

  it('should return the center of the element when keyboard pressed', function () {
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => getBoundingClientRect({})
    );
    let events = [];
    let addEvent = (e) => events.push(e);
    let {getByText} = render(
      <Example
        onPressStart={addEvent}
        onPressEnd={addEvent}
        onPressChange={pressed => addEvent({type: 'presschange', pressed})}
        onPress={addEvent}
        onPressUp={addEvent} />
    );

    let el = getByText('test');
    fireEvent.keyDown(el, {key: ' '});
    fireEvent.keyUp(el, {key: ' '});
    expect(events).toEqual([
      {
        type: 'pressstart',
        target: el,
        pointerType: 'keyboard',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        x: 50,
        y: 50
      },
      {
        type: 'presschange',
        pressed: true
      },
      {
        type: 'pressup',
        target: el,
        pointerType: 'keyboard',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        x: 50,
        y: 50
      },
      {
        type: 'pressend',
        target: el,
        pointerType: 'keyboard',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        x: 50,
        y: 50
      },
      {
        type: 'presschange',
        pressed: false
      },
      {
        type: 'press',
        target: el,
        pointerType: 'keyboard',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        x: 50,
        y: 50
      }
    ]);
  });

  it('cancel from scroll events should have coordinates', function () {
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => getBoundingClientRect({})
    );
    let events = [];
    let addEvent = (e) => events.push(e);
    let res = render(
      <Example
        onPressStart={addEvent}
        onPressEnd={addEvent}
        onPressChange={pressed => addEvent({type: 'presschange', pressed})}
        onPress={addEvent}
        onPressUp={addEvent} />
    );

    let el = res.getByText('test');
    fireEvent.touchStart(el, {targetTouches: [{identifier: 1, clientX: 25, clientY: 25}]});
    fireEvent.scroll(document.body);
    fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 25, clientY: 0}]});

    expect(events).toEqual([
      {
        type: 'pressstart',
        target: el,
        pointerType: 'touch',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        x: 25,
        y: 25
      },
      {
        type: 'presschange',
        pressed: true
      },
      {
        type: 'pressend',
        target: el,
        pointerType: 'touch',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        // center because the event was canceled by scroll, not by the touchEnd
        x: 50,
        y: 50
      },
      {
        type: 'presschange',
        pressed: false
      }
    ]);
  });
});
