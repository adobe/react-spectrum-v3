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

import {pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import React from 'react';
import {TextArea} from '../';
import userEvent from '@testing-library/user-event';

let testId = 'test-id';
let mockScrollHeight = 500;

function renderComponent(Component, props) {
  return render(<Component aria-label="megatron" {...props} data-testid={testId} />);
}

describe('TextArea', () => {
  let onChange = jest.fn();
  let oldScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
  let user;

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {configurable: true, value: mockScrollHeight});
  });

  afterEach(() => {
    if (oldScrollHeight === undefined) {
      delete HTMLElement.prototype.scrollHeight;
    } else {
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', oldScrollHeight);
    }
    onChange.mockClear();
  });

  // The quiet variant of the textarea doesn't have a internal vertical scroller when the
  // user inputs more than two lines of text. To workaround this on user text input the height style of the textarea is set to
  // "auto" to get the scroller to appear, then the height is set equal to scrollHeight to remove the scroller
  // and properly adjust the height of the textarea to match the currently input text
  it.each`
    Name                               | Component        | props
    ${'v3 TextArea default'}           | ${TextArea}      | ${{isQuiet: true, onChange}}
    ${'v3 TextArea (controlled)'}      | ${TextArea}      | ${{isQuiet: true, onChange, value: 'foo'}}
    ${'v3 TextArea (uncontrolled)'}    | ${TextArea}      | ${{isQuiet: true, onChange, defaultValue: 'foo'}}
  `('$Name quiet variant automatically adjusts its vertical height on mount', ({Component, props}) => {
    let tree = renderComponent(Component, props);
    let input = tree.getByTestId(testId);

    expect(input.style.height).toBe(`${mockScrollHeight}px`);
  });

  it('isQuiet can adjust after text "grows"', async () => {
    let tree = renderComponent(TextArea, {isQuiet: true});
    let input = tree.getByTestId(testId);
    let newScrollHeight = 1000;
    expect(input.style.height).toBe(`${mockScrollHeight}px`);
    // this will be cleaned up in the afterEach
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {configurable: true, value: newScrollHeight});
    await user.tab();
    await user.keyboard('15');
    expect(input.style.height).toBe(`${newScrollHeight}px`);
  });

  it('default can adjust after text "grows"', async () => {
    let tree = renderComponent(TextArea, {});
    let input = tree.getByTestId(testId);
    let newScrollHeight = 1000;
    expect(input.style.height).toBe(`${mockScrollHeight}px`);
    // this will be cleaned up in the afterEach
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {configurable: true, value: newScrollHeight});
    await user.tab();
    await user.keyboard('15');
    expect(input.style.height).toBe(`${newScrollHeight}px`);
  });

  it('default does not change height when a height prop is set', async () => {
    let tree = renderComponent(TextArea, {height: 'size-2000'});
    let input = tree.getByTestId(testId);
    expect(input.style.height).toBe('');
    await user.tab();
    await user.keyboard('15');
    expect(input.style.height).toBe('');
  });
});
