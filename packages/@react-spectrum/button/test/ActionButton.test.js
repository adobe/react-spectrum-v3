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

import {ActionButton} from '../';
import {pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import React from 'react';
import userEvent from '@testing-library/user-event';

describe('ActionButton', function () {
  let onPressSpy = jest.fn();

  afterEach(() => {
    onPressSpy.mockClear();
  });

  it.each`
    Name              | Component        | props
    ${'ActionButton'} | ${ActionButton}  | ${{onPress: onPressSpy}}
  `('$Name handles defaults', async function ({Component, props}) {
    let user = userEvent.setup({delay: null, pointerMap});
    let {getByRole} = render(<Component {...props}>Click Me</Component>);

    let button = getByRole('button');
    await user.click(button);
    expect(onPressSpy).toHaveBeenCalledTimes(1);
    expect(button).not.toHaveAttribute('aria-pressed');
    expect(button).not.toHaveAttribute('aria-checked');
  });

  it.each`
    Name              | Component        | props
    ${'ActionButton'} | ${ActionButton}  | ${{}}
  `('$Name allows custom props to be passed through to the button', function ({Component, props}) {
    let {getByRole} = render(<Component {...props} data-foo="bar">Click Me</Component>);

    let button = getByRole('button', {hidden: true});
    expect(button).toHaveAttribute('data-foo', 'bar');
  });
});
