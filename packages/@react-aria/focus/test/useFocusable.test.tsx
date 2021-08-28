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

import React from 'react';
import {render} from '@testing-library/react';
import {useFocusable} from '../';

describe('useFocusable', function () {
  it('handles defaults', function () {
    function Test() {
      const ref = React.useRef(null);
      const {focusableProps} = useFocusable({}, ref);

      return (
        <button {...focusableProps}>{'Click me!'}</button>
      );
    }

    expect(() => render(<Test />)).not.toThrow();
  });

  it('provides `tabIndex: -1` when `excludeFromTabOrder` is used', function () {
    function Test() {
      const ref = React.useRef(null);
      const {focusableProps} = useFocusable({excludeFromTabOrder: true}, ref);

      return (
        <h1 {...focusableProps}>{'Title'}</h1>
      );
    }

    const {container} = render(<Test />);
    expect(container.firstElementChild.getAttribute('tabIndex')).toBe('-1');
  });

  it('doesn\'t provide `tabIndex` when `excludeFromTabOrder` is used together with `isDisabled`', function () {
    function Test() {
      const ref = React.useRef(null);
      const {focusableProps} = useFocusable({excludeFromTabOrder: true, isDisabled: true}, ref);

      return (
        <h1 {...focusableProps}>{'Title'}</h1>
      );
    }

    const {container} = render(<Test />);
    expect((container.firstElementChild).getAttribute('tabIndex')).toBe(null);
  });

  it('accepts `tabIndex`', function () {
    function Test() {
      const ref = React.useRef(null);
      const {focusableProps} = useFocusable({tabIndex: 0}, ref);

      return (
        <h1 {...focusableProps}>{'Title'}</h1>
      );
    }

    const {container} = render(<Test />);
    expect((container.firstElementChild).getAttribute('tabIndex')).toBe('0');
  });
});
