/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */


import {act, createShadowRoot, render} from '@react-spectrum/test-utils-internal';
import {focusSafely} from '../';
import React from 'react';
import * as ReactAriaUtils from '@react-aria/utils';
import ReactDOM from 'react-dom';
import {setInteractionModality} from '@react-aria/interactions';

jest.mock('@react-aria/utils', () => {
  let original = jest.requireActual('@react-aria/utils');
  return {
    ...original,
    focusWithoutScrolling: jest.fn()
  };
});

jest.useFakeTimers();

describe('focusSafely', () => {
  it("should not focus on the element if it's no longer connected", async function () {
    setInteractionModality('virtual');

    const Example = () => <button>Button</button>;
    const {unmount} = render(<Example />);

    const button = document.body.querySelector('button');

    requestAnimationFrame(() => {
      unmount();
    });
    expect(button).toBeTruthy();
    focusSafely(button);

    act(() => {
      jest.runAllTimers();
    });

    expect(ReactAriaUtils.focusWithoutScrolling).toBeCalledTimes(0);
  });

  it("should focus on the element if it's connected", async function () {
    setInteractionModality('virtual');

    const Example = () => <button>Button</button>;
    render(<Example />);

    const button = document.body.querySelector('button');

    expect(button).toBeTruthy();
    focusSafely(button);

    act(() => {
      jest.runAllTimers();
    });

    expect(ReactAriaUtils.focusWithoutScrolling).toBeCalledTimes(1);
  });

  describe('focusSafely with Shadow DOM', function () {
    const focusWithoutScrollingSpy = jest.spyOn(ReactAriaUtils, 'focusWithoutScrolling').mockImplementation(() => {});

    it("should not focus on the element if it's no longer connected within shadow DOM", async function () {
      const {shadowRoot, shadowHost} = createShadowRoot();
      setInteractionModality('virtual');

      const Example = () => ReactDOM.createPortal(<button>Button</button>, shadowRoot);

      const {unmount} = render(<Example />);

      const button = shadowRoot.querySelector('button');

      requestAnimationFrame(() => {
        unmount();
        document.body.removeChild(shadowHost);
      });
      expect(button).toBeTruthy();
      focusSafely(button);

      act(() => {
        jest.runAllTimers();
      });

      expect(focusWithoutScrollingSpy).toBeCalledTimes(0);
    });

    it("should focus on the element if it's connected within shadow DOM", async function () {
      const {shadowRoot} = createShadowRoot();
      setInteractionModality('virtual');

      const Example = () => ReactDOM.createPortal(<button>Button</button>, shadowRoot);

      const {unmount} = render(<Example />);

      const button = shadowRoot.querySelector('button');

      expect(button).toBeTruthy();
      focusSafely(button);

      act(() => {
        jest.runAllTimers();
      });

      expect(focusWithoutScrollingSpy).toBeCalledTimes(1);

      unmount();
      shadowRoot.host.remove();
    });
  });
});
