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

import {fireEvent, installPointerEvent, render, waitFor} from '@react-spectrum/test-utils-internal';
import React, {useEffect, useRef} from 'react';
import ReactDOM, {createPortal, render as ReactDOMRender} from 'react-dom';
import {useInteractOutside} from '../';

function Example(props) {
  let ref = useRef();
  useInteractOutside({ref, ...props});
  return <div ref={ref} data-testid="example">test</div>;
}

function pointerEvent(type, opts) {
  let evt = new Event(type, {bubbles: true, cancelable: true});
  Object.assign(evt, opts);
  return evt;
}

describe('useInteractOutside', function () {
  // TODO: JSDOM doesn't yet support pointer events. Once they do, convert these tests.
  // https://github.com/jsdom/jsdom/issues/2527
  describe('pointer events', function () {
    installPointerEvent();

    it('should fire interact outside events based on pointer events', function () {
      let onInteractOutside = jest.fn();
      let res = render(
        <Example onInteractOutside={onInteractOutside} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown'));
      fireEvent(el, pointerEvent('pointerup'));
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent(document.body, pointerEvent('pointerdown'));
      fireEvent(document.body, pointerEvent('pointerup'));
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should only listen for the left mouse button', function () {
      let onInteractOutside = jest.fn();
      render(
        <Example onInteractOutside={onInteractOutside} />
      );

      fireEvent(document.body, pointerEvent('pointerdown', {button: 1}));
      fireEvent(document.body, pointerEvent('pointerup', {button: 1}));
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent(document.body, pointerEvent('pointerdown', {button: 0}));
      fireEvent(document.body, pointerEvent('pointerup', {button: 0}));
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should not fire interact outside if there is a pointer up event without a pointer down first', function () {
      // Fire pointer down before component with useInteractOutside is mounted
      fireEvent(document.body, pointerEvent('pointerdown'));

      let onInteractOutside = jest.fn();
      render(
        <Example onInteractOutside={onInteractOutside} />
      );

      fireEvent(document.body, pointerEvent('pointerup'));
      expect(onInteractOutside).not.toHaveBeenCalled();
    });
  });

  describe('mouse events', function () {
    it('should fire interact outside events based on mouse events', function () {
      let onInteractOutside = jest.fn();
      let res = render(
        <Example onInteractOutside={onInteractOutside} />
      );

      let el = res.getByText('test');
      fireEvent.mouseDown(el);
      fireEvent.mouseUp(el);
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent.mouseDown(document.body);
      fireEvent.mouseUp(document.body);
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should only listen for the left mouse button', function () {
      let onInteractOutside = jest.fn();
      render(
        <Example onInteractOutside={onInteractOutside} />
      );

      fireEvent.mouseDown(document.body, {button: 1});
      fireEvent.mouseUp(document.body, {button: 1});
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent.mouseDown(document.body, {button: 0});
      fireEvent.mouseUp(document.body, {button: 0});
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should not fire interact outside if there is a mouse up event without a mouse down first', function () {
      // Fire mouse down before component with useInteractOutside is mounted
      fireEvent.mouseDown(document.body);

      let onInteractOutside = jest.fn();
      render(
        <Example onInteractOutside={onInteractOutside} />
      );

      fireEvent.mouseUp(document.body);
      expect(onInteractOutside).not.toHaveBeenCalled();
    });
  });

  describe('touch events', function () {
    it('should fire interact outside events based on mouse events', function () {
      let onInteractOutside = jest.fn();
      let res = render(
        <Example onInteractOutside={onInteractOutside} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el);
      fireEvent.touchEnd(el);
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent.touchStart(document.body);
      fireEvent.touchEnd(document.body);
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should ignore emulated mouse events', function () {
      let onInteractOutside = jest.fn();
      let res = render(
        <Example onInteractOutside={onInteractOutside} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el);
      fireEvent.touchEnd(el);
      fireEvent.mouseUp(el);
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent.touchStart(document.body);
      fireEvent.touchEnd(document.body);
      fireEvent.mouseUp(document.body);
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should not fire interact outside if there is a touch end event without a touch start first', function () {
      // Fire mouse down before component with useInteractOutside is mounted
      fireEvent.touchStart(document.body);

      let onInteractOutside = jest.fn();
      render(
        <Example onInteractOutside={onInteractOutside} />
      );

      fireEvent.touchEnd(document.body);
      expect(onInteractOutside).not.toHaveBeenCalled();
    });
  });
  describe('disable interact outside events', function () {
    it('does not handle pointer events if disabled', function () {
      let onInteractOutside = jest.fn();
      render(
        <Example isDisabled onInteractOutside={onInteractOutside} />
      );

      fireEvent(document.body, pointerEvent('mousedown'));
      fireEvent(document.body, pointerEvent('mouseup'));
      expect(onInteractOutside).not.toHaveBeenCalled();
    });

    it('does not handle touch events if disabled', function () {
      let onInteractOutside = jest.fn();
      render(
        <Example isDisabled onInteractOutside={onInteractOutside} />
      );

      fireEvent.touchStart(document.body);
      fireEvent.touchEnd(document.body);
      expect(onInteractOutside).not.toHaveBeenCalled();
    });

    it('does not handle mouse events if disabled', function () {
      let onInteractOutside = jest.fn();
      render(
        <Example isDisabled onInteractOutside={onInteractOutside} />
      );

      fireEvent.mouseDown(document.body);
      fireEvent.mouseUp(document.body);
      expect(onInteractOutside).not.toHaveBeenCalled();
    });
  });
});

describe('useInteractOutside (iframes)', function () {
  let iframe;
  let iframeRoot;
  let iframeDocument;
  beforeEach(() => {
    iframe = document.createElement('iframe');
    window.document.body.appendChild(iframe);
    iframeDocument = iframe.contentWindow.document;
    iframeRoot = iframeDocument.createElement('div');
    iframeDocument.body.appendChild(iframeRoot);
  });

  afterEach(() => {
    iframe.remove();
  });

  const IframeExample = (props) => {
    return createPortal(<Example {...props} />, iframeRoot);
  };

  // TODO: JSDOM doesn't yet support pointer events. Once they do, convert these tests.
  // https://github.com/jsdom/jsdom/issues/2527
  describe('pointer events', function () {
    installPointerEvent();

    it('should fire interact outside events based on pointer events', async function () {
      let onInteractOutside = jest.fn();
      render(
        <IframeExample onInteractOutside={onInteractOutside} />
      );

      await waitFor(() => {
        expect(document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
      });

      const el = document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]');
      fireEvent(el, pointerEvent('pointerdown'));
      fireEvent(el, pointerEvent('pointerup'));
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent(iframeDocument.body, pointerEvent('pointerdown'));
      fireEvent(iframeDocument.body, pointerEvent('pointerup'));
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should only listen for the left mouse button', async function () {
      let onInteractOutside = jest.fn();
      render(
        <IframeExample onInteractOutside={onInteractOutside} />
      );

      await waitFor(() => {
        expect(document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
      });

      fireEvent(iframeDocument.body, pointerEvent('pointerdown', {button: 1}));
      fireEvent(iframeDocument.body, pointerEvent('pointerup', {button: 1}));
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent(iframeDocument.body, pointerEvent('pointerdown', {button: 0}));
      fireEvent(iframeDocument.body, pointerEvent('pointerup', {button: 0}));
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should not fire interact outside if there is a pointer up event without a pointer down first', async function () {
      // Fire pointer down before component with useInteractOutside is mounted
      fireEvent(iframeDocument.body, pointerEvent('pointerdown'));

      let onInteractOutside = jest.fn();
      render(
        <IframeExample onInteractOutside={onInteractOutside} />
      );

      await waitFor(() => {
        expect(document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
      });
      fireEvent(iframeDocument.body, pointerEvent('pointerup'));
      expect(onInteractOutside).not.toHaveBeenCalled();
    });
  });

  describe('mouse events', function () {
    it('should fire interact outside events based on mouse events', async function () {
      let onInteractOutside = jest.fn();
      render(
        <IframeExample onInteractOutside={onInteractOutside} />
      );

      await waitFor(() => {
        expect(document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
      });

      const el = document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]');
      fireEvent.mouseDown(el);
      fireEvent.mouseUp(el);
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent.mouseDown(iframeDocument.body);
      fireEvent.mouseUp(iframeDocument.body);
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should only listen for the left mouse button', async function () {
      let onInteractOutside = jest.fn();
      render(
        <IframeExample onInteractOutside={onInteractOutside} />
      );

      await waitFor(() => {
        expect(document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
      });

      fireEvent.mouseDown(iframeDocument.body, {button: 1});
      fireEvent.mouseUp(iframeDocument.body, {button: 1});
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent.mouseDown(iframeDocument.body, {button: 0});
      fireEvent.mouseUp(iframeDocument.body, {button: 0});
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should not fire interact outside if there is a mouse up event without a mouse down first', async function () {
      // Fire mouse down before component with useInteractOutside is mounted
      fireEvent.mouseDown(iframeDocument.body);

      let onInteractOutside = jest.fn();
      render(
        <IframeExample onInteractOutside={onInteractOutside} />
      );

      await waitFor(() => {
        expect(document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
      });
      fireEvent.mouseUp(iframeDocument.body);
      expect(onInteractOutside).not.toHaveBeenCalled();
    });
  });

  describe('touch events', function () {
    it('should fire interact outside events based on mouse events', async function () {
      let onInteractOutside = jest.fn();
      render(
        <IframeExample onInteractOutside={onInteractOutside} />
      );

      await waitFor(() => {
        expect(document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
      });

      const el = document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]');
      fireEvent.touchStart(el);
      fireEvent.touchEnd(el);
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent.touchStart(iframeDocument.body);
      fireEvent.touchEnd(iframeDocument.body);
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should ignore emulated mouse events', async function () {
      let onInteractOutside = jest.fn();
      render(
        <IframeExample onInteractOutside={onInteractOutside} />
      );

      await waitFor(() => {
        expect(document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]')).toBeTruthy();
      });

      const el = document.querySelector('iframe').contentWindow.document.body.querySelector('div[data-testid="example"]');
      fireEvent.touchStart(el);
      fireEvent.touchEnd(el);
      fireEvent.mouseUp(el);
      expect(onInteractOutside).not.toHaveBeenCalled();

      fireEvent.touchStart(iframeDocument.body);
      fireEvent.touchEnd(iframeDocument.body);
      fireEvent.mouseUp(iframeDocument.body);
      expect(onInteractOutside).toHaveBeenCalledTimes(1);
    });

    it('should not fire interact outside if there is a touch end event without a touch start first', function () {
      // Fire mouse down before component with useInteractOutside is mounted
      fireEvent.touchStart(iframeDocument.body);

      let onInteractOutside = jest.fn();
      render(
        <IframeExample onInteractOutside={onInteractOutside} />
      );

      fireEvent.touchEnd(iframeDocument.body);
      expect(onInteractOutside).not.toHaveBeenCalled();
    });
  });

  describe('disable interact outside events', function () {
    it('does not handle pointer events if disabled', function () {
      let onInteractOutside = jest.fn();
      render(
        <IframeExample isDisabled onInteractOutside={onInteractOutside} />
      );

      fireEvent(iframeDocument.body, pointerEvent('mousedown'));
      fireEvent(iframeDocument.body, pointerEvent('mouseup'));
      expect(onInteractOutside).not.toHaveBeenCalled();
    });

    it('does not handle touch events if disabled', function () {
      let onInteractOutside = jest.fn();
      render(
        <IframeExample isDisabled onInteractOutside={onInteractOutside} />
      );

      fireEvent.touchStart(iframeDocument.body);
      fireEvent.touchEnd(iframeDocument.body);
      expect(onInteractOutside).not.toHaveBeenCalled();
    });

    it('does not handle mouse events if disabled', function () {
      let onInteractOutside = jest.fn();
      render(
        <IframeExample isDisabled onInteractOutside={onInteractOutside} />
      );

      fireEvent.mouseDown(iframeDocument.body);
      fireEvent.mouseUp(iframeDocument.body);
      expect(onInteractOutside).not.toHaveBeenCalled();
    });
  });
});

describe('useInteractOutside shadow DOM', function () {
  // Helper function to create a shadow root and render the component inside it
  function createShadowRootAndRender(ui) {
    const shadowHost = document.createElement('div');
    document.body.appendChild(shadowHost);
    const shadowRoot = shadowHost.attachShadow({mode: 'open'});

    function WrapperComponent() {
      return ReactDOM.createPortal(ui, shadowRoot);
    }

    render(<WrapperComponent />);
    return {shadowRoot, cleanup: () => document.body.removeChild(shadowHost)};
  }

  function App({onInteractOutside}) {
    const ref = useRef(null);
    useInteractOutside({ref, onInteractOutside});

    return (
      <div>
        <div id="outside-popover" />
        <div id="popover" ref={ref}>
          <div id="inside-popover" />
        </div>
      </div>
    );
  }

  it('does not trigger when clicking inside popover', function () {
    const onInteractOutside = jest.fn();
    const {shadowRoot, cleanup} = createShadowRootAndRender(
      <App onInteractOutside={onInteractOutside} />
    );

    const insidePopover = shadowRoot.getElementById('inside-popover');
    fireEvent.mouseDown(insidePopover);
    fireEvent.mouseUp(insidePopover);

    expect(onInteractOutside).not.toHaveBeenCalled();
    cleanup();
  });

  it('does not trigger when clicking the popover', function () {
    const onInteractOutside = jest.fn();
    const {shadowRoot, cleanup} = createShadowRootAndRender(
      <App onInteractOutside={onInteractOutside} />
    );

    const popover = shadowRoot.getElementById('popover');
    fireEvent.mouseDown(popover);
    fireEvent.mouseUp(popover);

    expect(onInteractOutside).not.toHaveBeenCalled();
    cleanup();
  });

  it('triggers when clicking outside the popover', function () {
    const onInteractOutside = jest.fn();
    const  {cleanup} = createShadowRootAndRender(
      <App onInteractOutside={onInteractOutside} />
    );

    // Clicking on the document body outside the shadow DOM
    fireEvent.mouseDown(document.body);
    fireEvent.mouseUp(document.body);

    expect(onInteractOutside).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('triggers when clicking a button outside the shadow dom altogether', function () {
    const onInteractOutside = jest.fn();
    const {cleanup} = createShadowRootAndRender(
      <App onInteractOutside={onInteractOutside} />
    );
    // Button outside shadow DOM and component
    const button = document.createElement('button');
    document.body.appendChild(button);

    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);

    expect(onInteractOutside).toHaveBeenCalledTimes(1);
    document.body.removeChild(button);
    cleanup();
  });
});

describe('useInteractOutside shadow DOM extended tests', function () {
  // Setup function similar to previous tests, but includes a dynamic element scenario
  function createShadowRootAndRender(ui) {
    const shadowHost = document.createElement('div');
    document.body.appendChild(shadowHost);
    const shadowRoot = shadowHost.attachShadow({mode: 'open'});

    function WrapperComponent() {
      return ReactDOM.createPortal(ui, shadowRoot);
    }

    render(<WrapperComponent />);
    return {shadowRoot, cleanup: () => document.body.removeChild(shadowHost)};
  }

  function App({onInteractOutside, includeDynamicElement = false}) {
    const ref = useRef(null);
    useInteractOutside({ref, onInteractOutside});

    useEffect(() => {
      if (includeDynamicElement) {
        const dynamicEl = document.createElement('div');
        dynamicEl.id = 'dynamic-outside';
        document.body.appendChild(dynamicEl);

        return () => document.body.removeChild(dynamicEl);
      }
    }, [includeDynamicElement]);

    return (
      <div>
        <div id="outside-popover" />
        <div id="popover" ref={ref}>
          <div id="inside-popover" />
        </div>
      </div>
    );
  }

  it('correctly identifies interaction with dynamically added external elements', function () {
    jest.useFakeTimers();
    const onInteractOutside = jest.fn();
    const {cleanup} = createShadowRootAndRender(
      <App onInteractOutside={onInteractOutside} includeDynamicElement />
    );

    const dynamicEl = document.getElementById('dynamic-outside');
    fireEvent.mouseDown(dynamicEl);
    fireEvent.mouseUp(dynamicEl);

    expect(onInteractOutside).toHaveBeenCalledTimes(1);

    cleanup();
  });
});
