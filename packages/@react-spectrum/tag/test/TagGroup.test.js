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
import {Tag, TagGroup} from '../src';

describe.skip('TagGroup', function () {
  let onRemoveSpy = jest.fn();

  afterEach(() => {
    onRemoveSpy.mockClear();
  });

  it('provides context for Tag component', function () {
    let {container} = render(
      <TagGroup onRemove={onRemoveSpy}>
        <div>
          <Tag isRemovable>Tag 1</Tag>
        </div>
        <div>
          <Tag isRemovable>Tag 2</Tag>
        </div>
        <div>
          <Tag isRemovable>Tag 3</Tag>
        </div>
      </TagGroup>
    );
    let tags = container.querySelectorAll('[role="row"');
    expect(tags.length).toBe(3);

    fireEvent.keyDown(tags[1], {key: 'Delete'});
    expect(onRemoveSpy).toHaveBeenCalledWith(['Tag 2']);
  });

  it.each`
   Name           | Component     | TagComponent | props
   ${'TagGroup'}  | ${TagGroup}   | ${Tag}       | ${{isReadOnly: true, isRemovable: true, onRemove: onRemoveSpy}}
  `('$Name can be read only', ({Component, TagComponent, props}) => {
    let {getByText} = render(
      <Component {...props}>
        <TagComponent>Tag 1</TagComponent>
      </Component>
    );
    let tag = getByText('Tag 1');
    fireEvent.keyDown(tag, {key: 'Delete', keyCode: 46});
    expect(onRemoveSpy).not.toHaveBeenCalledWith('Tag 1', expect.anything());
  });

  it.each`
   Name           | Component         | props
   ${'TagGroup'}  | ${TagGroup}       | ${{}}
  `('$Name have correct accessibility roles', ({Component, props}) => {
    let {container, getByText} = render(
      <Component {...props}>
        <Tag>Tag 1</Tag>
      </Component>
    );
    let tagGroup = container.children[0];
    expect(tagGroup).toHaveAttribute('role', 'grid');
    let tag = tagGroup.children[0];
    expect(tag).toHaveAttribute('role', 'row');
    let tagContent = getByText('Tag 1');
    expect(tagContent).toHaveAttribute('role', 'gridcell');
  });
});
