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

import {action} from '@storybook/addon-actions';
import {Item} from '@react-stately/collections';
import React, {useState} from 'react';
import {storiesOf} from '@storybook/react';
import {TagGroup} from '../src';

storiesOf('TagGroup', module)
  .add(
    'default',
    () => render({})
  )
  .add(
    'items',
    () => (
      <TagGroup items={[{key: '1', label: 'Cool Tag 1'}, {key: '2', label: 'Cool Tag 2'}]}>
        {item =>
          <Item key={item.key}>{item.label}</Item>
        }
      </TagGroup>
    )
  )
  // .add('icons', () => (
  //   <TagGroup>
  //     <Item>
  //       <Text>Tag 1</Text>
  //     </Item>
  //   </TagGroup>
  // ))
  .add(
    'onRemove',
    () => render({
      isRemovable: true,
      onRemove: action('onRemove')
    })
  )
  .add(
  'is Disabled',
  () => render({
    isDisabled: true
  }))
  .add(
    'with announcing',
    () => (
      <WithAnnouncing />
    )
  );

function render(props: any = {}) {
  return (
    <TagGroup {...props}>
      <Item>Cool Tag 1</Item>
      <Item>Cool Tag 2</Item>
      <Item>Cool Tag 3</Item>
    </TagGroup>
  );
}

function WithAnnouncing() {
  let [tags, setTags] = useState(['Tag']);

  function handleKeyDown(e) {
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      setTags([...tags, 'New Tag']);
    }
  }
  return (
    <React.Fragment>
      {/*
        // @ts-ignore */}
      <TagGroup onKeyDown={handleKeyDown}>
        {tags.map((t, index) => <Item key={index}>{t}</Item>)}
      </TagGroup>
    </React.Fragment>
  );
}
