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
  createShadowRoot,
  fireEvent,
  installMouseEvent,
  installPointerEvent,
  render
} from '@react-spectrum/test-utils-internal';
import {enableShadowDOM} from '@react-stately/flags';
import {mergeProps} from '@react-aria/utils';
import React, {useRef} from 'react';
import ReactDOM from 'react-dom';
import {useOverlay} from '../';

function Example(props) {
  let ref = useRef();
  let {overlayProps, underlayProps} = useOverlay(props, ref);
  return (
    <div
      {...mergeProps(underlayProps, props.underlayProps || {})}
      data-testid={'underlay'}>
      <div
        ref={ref}
        {...overlayProps}
        data-testid={props['data-testid'] || 'test'}>
        {props.children}
      </div>
    </div>
  );
}

describe('useOverlay', function () {
  describe.each`
    type                | prepare                | actions
    ${'Mouse Events'}   | ${installMouseEvent}   | ${[(el) => fireEvent.mouseDown(el, {button: 0}), (el) => fireEvent.mouseUp(el, {button: 0})]}
    ${'Pointer Events'} | ${installPointerEvent} | ${[(el) => fireEvent.pointerDown(el, {button: 0, pointerId: 1}), (el) => fireEvent.pointerUp(el, {button: 0, pointerId: 1})]}
    ${'Touch Events'}   | ${() => {}}            | ${[(el) => fireEvent.touchStart(el, {changedTouches: [{identifier: 1}]}), (el) => fireEvent.touchEnd(el, {changedTouches: [{identifier: 1}]})]}
  `('$type', ({actions: [pressStart, pressEnd], prepare}) => {
    prepare();

    it('should not focus the overlay if a child is focused', function () {
      let res = render(
        <Example isOpen>
          <input autoFocus data-testid="input" />
        </Example>
      );

      let input = res.getByTestId('input');
      expect(document.activeElement).toBe(input);
    });

    it('should hide the overlay when clicking outside if isDismissable is true', function () {
      let onClose = jest.fn();
      render(<Example isOpen onClose={onClose} isDismissable />);
      pressStart(document.body);
      pressEnd(document.body);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should hide the overlay when clicking outside if shouldCloseOnInteractOutside returns true', function () {
      let onClose = jest.fn();
      render(
        <Example
          isOpen
          onClose={onClose}
          isDismissable
          shouldCloseOnInteractOutside={(target) => target === document.body} />
      );
      pressStart(document.body);
      pressEnd(document.body);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not hide the overlay when clicking outside if shouldCloseOnInteractOutside returns false', function () {
      let onClose = jest.fn();
      render(
        <Example
          isOpen
          onClose={onClose}
          isDismissable
          shouldCloseOnInteractOutside={(target) => target !== document.body} />
      );
      pressStart(document.body);
      pressEnd(document.body);
      expect(onClose).toHaveBeenCalledTimes(0);
    });

    it('should not hide the overlay when clicking outside if isDismissable is false', function () {
      let onClose = jest.fn();
      render(<Example isOpen onClose={onClose} isDismissable={false} />);
      pressStart(document.body);
      pressEnd(document.body);
      expect(onClose).toHaveBeenCalledTimes(0);
    });

    it('should only hide the top-most overlay', function () {
      let onCloseFirst = jest.fn();
      let onCloseSecond = jest.fn();
      render(<Example isOpen onClose={onCloseFirst} isDismissable />);
      let second = render(
        <Example isOpen onClose={onCloseSecond} isDismissable />
      );

      pressStart(document.body);
      pressEnd(document.body);
      expect(onCloseSecond).toHaveBeenCalledTimes(1);
      expect(onCloseFirst).not.toHaveBeenCalled();

      second.unmount();

      pressStart(document.body);
      pressEnd(document.body);
      expect(onCloseFirst).toHaveBeenCalledTimes(1);
    });
  });

  it('should hide the overlay when pressing the escape key', function () {
    let onClose = jest.fn();
    let res = render(<Example isOpen onClose={onClose} />);
    let el = res.getByTestId('test');
    fireEvent.keyDown(el, {key: 'Escape'});
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should still hide the overlay when pressing the escape key if isDismissable is false', function () {
    let onClose = jest.fn();
    let res = render(
      <Example isOpen onClose={onClose} isDismissable={false} />
    );
    let el = res.getByTestId('test');
    fireEvent.keyDown(el, {key: 'Escape'});
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('firefox bug', () => {
    installPointerEvent();
    it('should prevent default on pointer down on the underlay', function () {
      let underlayRef = React.createRef();
      render(
        <Example isOpen isDismissable underlayProps={{ref: underlayRef}} />
      );
      let isPrevented = fireEvent.pointerDown(underlayRef.current, {
        button: 0,
        pointerId: 1
      });
      fireEvent.pointerUp(document.body);
      expect(isPrevented).toBeFalsy(); // meaning the event had preventDefault called
    });
  });
});

describe('useOverlay with shadow dom', () => {
  beforeAll(() => {
    enableShadowDOM();
  });

  describe.each`
    type                | prepare                | actions
    ${'Mouse Events'}   | ${installMouseEvent}   | ${[(el) => fireEvent.mouseDown(el, {button: 0}), (el) => fireEvent.mouseUp(el, {button: 0})]}
    ${'Pointer Events'} | ${installPointerEvent} | ${[(el) => fireEvent.pointerDown(el, {button: 0, pointerId: 1}), (el) => fireEvent.pointerUp(el, {button: 0, pointerId: 1})]}
    ${'Touch Events'}   | ${() => {}}            | ${[(el) => fireEvent.touchStart(el, {changedTouches: [{identifier: 1}]}), (el) => fireEvent.touchEnd(el, {changedTouches: [{identifier: 1}]})]}
  `('$type', ({actions: [pressStart, pressEnd], prepare}) => {
    prepare();

    it('should not close the overlay when clicking outside if shouldCloseOnInteractOutside returns true', function () {
      const {shadowRoot, shadowHost} = createShadowRoot();

      let onClose = jest.fn();
      let underlay;

      const WrapperComponent = () =>
        ReactDOM.createPortal(
          <Example
            isOpen
            onClose={onClose}
            isDismissable
            shouldCloseOnInteractOutside={(target) => {
              return target === underlay;
            }} />,
          shadowRoot
        );

      const {unmount} = render(<WrapperComponent />);

      underlay = shadowRoot.querySelector("[data-testid='underlay']");

      pressStart(underlay);
      pressEnd(underlay);
      expect(onClose).toHaveBeenCalled();

      // Cleanup
      unmount();
      document.body.removeChild(shadowHost);
    });

    it('should not close the overlay when clicking outside if shouldCloseOnInteractOutside returns false', function () {
      const {shadowRoot, shadowHost} = createShadowRoot();

      let onClose = jest.fn();
      let underlay;

      const WrapperComponent = () =>
        ReactDOM.createPortal(
          <Example
            isOpen
            onClose={onClose}
            isDismissable
            shouldCloseOnInteractOutside={(target) => target !== underlay} />,
          shadowRoot
        );

      const {unmount} = render(<WrapperComponent />);

      underlay = shadowRoot.querySelector("[data-testid='underlay']");

      pressStart(underlay);
      pressEnd(underlay);
      expect(onClose).not.toHaveBeenCalled();

      // Cleanup
      unmount();
      document.body.removeChild(shadowHost);
    });
  });
});
