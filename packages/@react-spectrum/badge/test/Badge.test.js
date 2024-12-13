/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Badge} from '../';
import CheckmarkCircle from '@spectrum-icons/workflow/CheckmarkCircle';
import React from 'react';
import {renderv3 as render} from '@react-spectrum/test-utils-internal';
import {Text} from '@react-spectrum/text';
import {within} from '@testing-library/dom';


describe('Badge', function () {
  it.each`
    Name         | Component  | props
    ${'Badge'}   | ${Badge}   | ${{}}
  `('$Name text-only', function ({Component, props}) {
    let {getByTestId} = render(<Component {...props} data-testid="badge">Badge of honor</Component>);

    let badge = getByTestId('badge');
    expect(within(badge).getByText('Badge of honor')).toBeInTheDocument();
  });

  it.each`
    Name         | Component  | props
    ${'Badge'}   | ${Badge}   | ${{}}
  `('$Name icon-only', function ({Component, props}) {
    let {getByTestId} = render(<Component {...props} data-testid="badge"><CheckmarkCircle /></Component>);

    let badge = getByTestId('badge');
    expect(within(badge).getByRole('img', {hidden: true})).toBeInTheDocument();
  });

  it.each`
    Name         | Component  | props
    ${'Badge'}   | ${Badge}   | ${{}}
  `('$Name icon-text pair', function ({Component, props}) {
    let {getByTestId} = render(<Component {...props} data-testid="badge"><CheckmarkCircle /><Text>Badge of honor</Text></Component>);

    let badge = getByTestId('badge');
    expect(within(badge).getByRole('img', {hidden: true})).toBeInTheDocument();
    expect(within(badge).getByText('Badge of honor')).toBeInTheDocument();
  });

  it.each`
    Name         | Component  | props
    ${'Badge'}   | ${Badge}   | ${{}}
  `('$Name forwards ref', function ({Component, props}) {
    let ref = React.createRef();
    let {getByTestId} = render(<Component {...props} ref={ref} data-testid="badge">Badge of honor</Component>);

    let badge = getByTestId('badge');
    expect(badge).toBe(ref.current.UNSAFE_getDOMNode());
  });
});
