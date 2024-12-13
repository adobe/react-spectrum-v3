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
import {UIIcon} from '../';

let FakeIcon = (props) => <svg {...props}><path d="M 10,150 L 70,10 L 130,150 z" /></svg>;

describe('UIIcon', function () {
  it.each`
    Name        | Component
    ${'UIIcon'} | ${UIIcon}
  `('handle defaults', function ({Component}) {
    let {getByRole, rerender} = render(<Component aria-label="labelled icon"><FakeIcon /></Component>);

    let icon = getByRole('img');
    expect(icon).toHaveAttribute('focusable', 'false');
    expect(icon).toHaveAttribute('aria-label', 'labelled icon');

    rerender(<Component><FakeIcon /></Component>);
    icon = getByRole('img', {hidden: true});
    expect(icon).not.toHaveAttribute('aria-label');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it.each`
    Name        | Component
    ${'UIIcon'} | ${UIIcon}
  `('$Name supports aria-hidden prop', function ({Component}) {
    let {getByRole, rerender} = render(<Component aria-label="explicitly hidden aria-label" aria-hidden><FakeIcon /></Component>);

    let icon = getByRole('img', {hidden: true});
    expect(icon).toHaveAttribute('aria-label', 'explicitly hidden aria-label');
    expect(icon).toHaveAttribute('aria-hidden', 'true');

    rerender(<Component aria-label="explicitly not hidden aria-label" aria-hidden={false}><FakeIcon /></Component>);
    icon = getByRole('img');
    expect(icon).toHaveAttribute('aria-label', 'explicitly not hidden aria-label');
    expect(icon).not.toHaveAttribute('aria-hidden');
  });
});
