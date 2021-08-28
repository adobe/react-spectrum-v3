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
import {render} from '@testing-library/react';
import {usePreventScroll} from '..';

function Example(props) {
  usePreventScroll(props);
  return (
    <div />
  );
}

describe('usePreventScroll', function () {
  it('should set overflow: hidden on the body on mount and remove on unmount', function () {
    expect(document.documentElement).not.toHaveStyle('overflow: hidden');

    let res = render(<Example />);
    expect(document.documentElement).toHaveStyle('overflow: hidden');
    expect(document.body).toHaveStyle('overflow: hidden')

    res.unmount();
    expect(document.documentElement).not.toHaveStyle('overflow: hidden');
    expect(document.body).not.toHaveStyle('overflow: hidden');
  });

  it('should work with nested modals', function () {
    expect(document.documentElement).not.toHaveStyle('overflow: hidden');
    expect(document.body).not.toHaveStyle('overflow: hidden');

    let one = render(<Example />);
    expect(document.documentElement).toHaveStyle('overflow: hidden');
    expect(document.body).toHaveStyle('overflow: hidden')

    let two = render(<Example />);
    expect(document.documentElement).toHaveStyle('overflow: hidden');
    expect(document.body).toHaveStyle('overflow: hidden')

    two.unmount();
    expect(document.documentElement).toHaveStyle('overflow: hidden');
    expect(document.body).toHaveStyle('overflow: hidden')

    one.unmount();
    expect(document.documentElement).not.toHaveStyle('overflow: hidden');
    expect(document.body).not.toHaveStyle('overflow: hidden')
  });

  it('should remove overflow: hidden when isDisabled option is true', function () {
    expect(document.documentElement).not.toHaveStyle('overflow: hidden');
    expect(document.body).not.toHaveStyle('overflow: hidden');

    let res = render(<Example />);
    expect(document.documentElement).toHaveStyle('overflow: hidden');
    expect(document.body).toHaveStyle('overflow: hidden');


    res.rerender(<Example isDisabled />);
    expect(document.documentElement).not.toHaveStyle('overflow: hidden');
    expect(document.body).not.toHaveStyle('overflow: hidden');
  });
});
