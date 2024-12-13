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
import {ToggleButton} from '../';
import userEvent from '@testing-library/user-event';

describe('ToggleButton', function () {
  it('handles defaults', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let onPress = jest.fn();
    let onChange = jest.fn();
    let {getByRole} = render(<ToggleButton onPress={onPress} onChange={onChange}>Click Me</ToggleButton>);

    let button = getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports defaultSelected', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let onPress = jest.fn();
    let onChange = jest.fn();
    let {getByRole} = render(<ToggleButton defaultSelected onPress={onPress} onChange={onChange}>Click Me</ToggleButton>);

    let button = getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');

    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('supports isSelected', async function () {
    let user = userEvent.setup({delay: null, pointerMap});
    let onPress = jest.fn();
    let onChange = jest.fn();
    let {getByRole} = render(<ToggleButton isSelected onPress={onPress} onChange={onChange}>Click Me</ToggleButton>);

    let button = getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');

    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('allows custom props to be passed through to the button', function () {
    let {getByRole} = render(<ToggleButton data-foo="bar">Click Me</ToggleButton>);

    let button = getByRole('button');
    expect(button).toHaveAttribute('data-foo', 'bar');
  });
});
