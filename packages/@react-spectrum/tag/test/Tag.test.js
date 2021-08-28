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

import {fireEvent} from '@testing-library/react';
import React from 'react';
import {render} from '@testing-library/react';
import {Tag} from '../';


describe.skip('Tag', function () {
  let onRemoveSpy = jest.fn();
  afterEach(() => {
    onRemoveSpy.mockClear();
  });

  it.each`
   Name          | Component         | props
   ${'Tag'}      | ${Tag}            | ${{}}
  `('$Name allows custom props to be passed through to the tag', function ({Component, props}) {
    let {container} = render(<Component {...props} data-foo="bar">Cool Tag</Component>);

    let tag = container.firstElementChild;
    expect(tag).toHaveAttribute('data-foo', 'bar');
  });

  it.each`
   Name         | Component         | props
   ${'Tag'}     | ${Tag}            | ${{isRemovable: true, onRemove: onRemoveSpy}}
  `('$Name handles appropriate key down in order to delete tag', function ({Component, props}) {
    let {getByText} = render(<Component {...props}>Cool Tag</Component>);

    let tag = getByText('Cool Tag');

    fireEvent.keyDown(tag, {key: 'Delete', keyCode: 46});
    expect(onRemoveSpy).toHaveBeenCalledWith('Cool Tag', expect.anything());
    onRemoveSpy.mockReset();

    fireEvent.keyDown(tag, {key: 'Backspace', keyCode: 8});
    expect(onRemoveSpy).toHaveBeenCalledWith('Cool Tag', expect.anything());
  });

  it.each`
   Name          | Component         | props
   ${'Tag'}      | ${Tag}            | ${{isDisabled: true, isRemovable: true, onRemove: onRemoveSpy}}
  `('$Name can be disabled', function ({Component, props}) {
    let {getByText} = render(<Component {...props}>Cool Tag</Component>);

    let tag = getByText('Cool Tag');

    fireEvent.keyDown(tag, {key: 'Delete'});
    expect(onRemoveSpy).not.toHaveBeenCalledWith('Cool Tag', expect.anything());
  });

  it.each`
   Name          | Component         | props
   ${'Tag'}      | ${Tag}            | ${{validationState: 'invalid'}}
  `('$Name can be invalid', function ({Component, props}) {
    let {getByText} = render(<Component {...props}>Cool Tag</Component>);

    let tag = getByText('Cool Tag');
    tag = tag.parentElement;

    expect(tag).toHaveAttribute('aria-invalid', 'true');
  });
});
