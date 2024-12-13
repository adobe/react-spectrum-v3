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

import {Divider} from '../';
import React from 'react';
import {renderv3 as render} from '@react-spectrum/test-utils-internal';

describe('Divider', function () {
  it.each`
    Name                 | Component  | props
    ${'Divider default'} | ${Divider} | ${{}}
    ${'Divider medium'}  | ${Divider} | ${{size: 'M'}}
    ${'Divider small'}   | ${Divider} | ${{size: 'S'}}
  `('$Name handles defaults', function ({Component, props}) {
    let {getByRole} = render(<Component {...props} aria-label="divides" />);

    let divider = getByRole('separator');
    expect(divider).toBeTruthy();
    expect(divider).not.toHaveAttribute('aria-orientation');
    expect(divider).toHaveAttribute('aria-label', 'divides');
  });

  it.each`
    Name                 | Component  | props
    ${'Divider default'} | ${Divider} | ${{orientation: 'vertical'}}
    ${'Divider medium'}  | ${Divider} | ${{orientation: 'vertical', size: 'M'}}
    ${'Divider small'}   | ${Divider} | ${{orientation: 'vertical', size: 'S'}}
  `('$Name can be vertical', function ({Component, props}) {
    let {getByRole} = render(<Component {...props} aria-label="divides" />);

    let divider = getByRole('separator');
    expect(divider).toBeTruthy();
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    expect(divider).toHaveAttribute('aria-label', 'divides');
  });

  it.each`
    Name                 | Component  | props
    ${'Divider default'} | ${Divider} | ${{orientation: 'vertical'}}
    ${'Divider medium'}  | ${Divider} | ${{orientation: 'vertical', size: 'M'}}
    ${'Divider small'}   | ${Divider} | ${{orientation: 'vertical', size: 'S'}}
  `('$Name supports aria-labelledby', function ({Component, props}) {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Component {...props} aria-labelledby="test" />
      </>
    );

    let divider = getByRole('separator');
    expect(divider).toHaveAttribute('aria-labelledby', 'test');
  });

  it.each`
    Name                 | Component  | props
    ${'Divider default'} | ${Divider} | ${{orientation: 'vertical'}}
    ${'Divider medium'}  | ${Divider} | ${{orientation: 'vertical', size: 'M'}}
    ${'Divider small'}   | ${Divider} | ${{orientation: 'vertical', size: 'S'}}
  `('$Name supports custom data attributes', function ({Component, props}) {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Component {...props} data-testid="test" />
      </>
    );

    let divider = getByRole('separator');
    expect(divider).toHaveAttribute('data-testid', 'test');
  });

  it.each`
    Name         | Component
    ${'Divider'} | ${Divider}
  `('$Name should not include implicit attributes', function ({Component}) {
    let {getByRole} = render(<Component aria-label="divides" />);

    let divider = getByRole('separator');
    expect(divider).not.toHaveAttribute('aria-orientation');
  });

  it.each`
    Name         | Component
    ${'Divider'} | ${Divider}
  `('$Name forwards the ref', function ({Component}) {
    let ref = React.createRef();
    let {getByRole} = render(<Component aria-label="divides" ref={ref} />);

    let divider = getByRole('separator');
    expect(divider).toBe(ref.current.UNSAFE_getDOMNode());
  });
});
