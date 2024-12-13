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
import {renderv3 as render} from '@react-spectrum/test-utils-internal';
import {Tooltip} from '../';

describe('Tooltip', function () {
  it('supports children', () => {
    let {getByRole} = render(<Tooltip>This is a tooltip</Tooltip>);
    let tooltip = getByRole('tooltip');
    expect(tooltip).toHaveAttribute('role', 'tooltip');
    expect(tooltip).toHaveTextContent('This is a tooltip');
  });

  it('supports aria-label', () => {
    let {getByRole} = render(<Tooltip aria-label="Tooltip" />);
    let tooltip = getByRole('tooltip');
    expect(tooltip).toHaveAttribute('aria-label', 'Tooltip');
  });

  it('supports aria-labelledby', () => {
    let {getByRole} = render(<Tooltip aria-labelledby="test" />);
    let tooltip = getByRole('tooltip');
    expect(tooltip).toHaveAttribute('aria-labelledby', 'test');
  });

  it('supports a ref', () => {
    let ref = React.createRef();
    let {getByRole} = render(<Tooltip ref={ref}>This is a tooltip</Tooltip>);
    let tooltip = getByRole('tooltip');
    expect(ref.current.UNSAFE_getDOMNode()).toBe(tooltip);
  });
});
