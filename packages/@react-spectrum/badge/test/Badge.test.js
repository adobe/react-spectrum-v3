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

import {Badge} from '../';
import React from 'react';
import {render} from '@testing-library/react';

/**
 * So far, everything about this component is a visual style, so we just check that it renders at all.
 */
describe('Badge', function () {
  it.each`
    Name | Component      | props
    ${'Badge'} | ${Badge}| ${{}}
  `('$Name handles defaults', function ({Component, props}) {
    let {getByText} = render(<Component variant="neutral" {...props}>Brave new badge</Component>);
    let badge = getByText('Brave new badge');
    expect(badge).toBeInTheDocument();
  });
});
