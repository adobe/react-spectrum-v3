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

import {Overlay} from '../';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {renderv3 as render} from '@react-spectrum/test-utils-internal';
import {theme} from '@react-spectrum/theme-default';

function _ExampleOverlay(props, ref) {
  return <span data-testid="contents" ref={ref}>Overlay</span>;
}
let ExampleOverlay = React.forwardRef(_ExampleOverlay);

describe('Overlay', function () {
  it('should render nothing if isOpen is not set', function () {
    let overlayRef = React.createRef();
    let modalRef = React.createRef();
    render(
      <Provider theme={theme}>
        <Overlay ref={overlayRef} nodeRef={modalRef}>
          <ExampleOverlay ref={modalRef} />
        </Overlay>
      </Provider>
    );

    expect(overlayRef.current).toBe(null);
  });

  it('should render into a portal in the body', function () {
    let providerRef = React.createRef();
    let overlayRef = React.createRef();
    let modalRef = React.createRef();
    render(
      <Provider theme={theme} ref={providerRef}>
        <Overlay isOpen ref={overlayRef} nodeRef={modalRef}>
          <ExampleOverlay ref={modalRef} />
        </Overlay>
      </Provider>
    );

    let overlayNode = overlayRef.current.UNSAFE_getDOMNode();
    expect(overlayNode).not.toBe(providerRef.current);
    expect(overlayNode.parentNode).toBe(document.body);
  });
});
