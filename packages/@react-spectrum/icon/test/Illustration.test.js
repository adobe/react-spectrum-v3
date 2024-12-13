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

import {Illustration} from '../';
import React from 'react';
import {renderv3 as render} from '@react-spectrum/test-utils-internal';

let CustomIllustration = (props) => <svg {...props}><path d="M 10,150 L 70,10 L 130,150 z" /></svg>;

describe('Illustration', function () {
  it.each`
    Name      | Component
    ${'Illustration'} | ${Illustration}
  `('$Name handles aria label', function ({Component}) {
    let {getByRole} = render(<Component aria-label="custom illustration"><CustomIllustration /></Component>);

    let illustration = getByRole('img');
    expect(illustration).toHaveAttribute('focusable', 'false');
    expect(illustration).toHaveAttribute('aria-label', 'custom illustration');
  });

  it.each`
    Name      | Component
    ${'Illustration'} | ${Illustration}
  `('$Name handles no aria label', function ({Component}) {
    let {container} = render(<Component><CustomIllustration /></Component>);

    let illustration = container.querySelector('svg');
    expect(illustration).not.toHaveAttribute('aria-label');
    expect(illustration).not.toHaveAttribute('aria-hidden');
  });

  it.each`
    Name      | Component
    ${'Illustration'} | ${Illustration}
  `('$Name supports aria-hidden prop', function ({Component}) {
    let {getByRole, rerender} = render(<Component aria-label="explicitly hidden aria-label" aria-hidden><CustomIllustration /></Component>);

    let illustration = getByRole('img', {hidden: true});
    expect(illustration).toHaveAttribute('aria-label', 'explicitly hidden aria-label');
    expect(illustration).toHaveAttribute('aria-hidden', 'true');

    rerender(<Component aria-label="explicitly not hidden aria-label" aria-hidden={false}><CustomIllustration /></Component>);
    illustration = getByRole('img');
    expect(illustration).toHaveAttribute('aria-label', 'explicitly not hidden aria-label');
    expect(illustration).not.toHaveAttribute('aria-hidden');
  });
});
