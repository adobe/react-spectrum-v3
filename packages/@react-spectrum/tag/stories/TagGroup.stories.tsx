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
import Audio from '@spectrum-icons/workflow/Audio';
import {Item, TagGroup} from '../src';
import React, {useState} from 'react';
import {storiesOf} from '@storybook/react';
import {Text} from '@react-spectrum/text';

let items = [{key: '1', label: 'Cool Tag 1'}, {key: '2', label: 'Cool Tag 2'}];

storiesOf('TagGroup', module)
  .add(
    'default',
    () => render({})
  )
  .add('icons', () => (
    <TagGroup aria-label="Tag group with icons" items={items}>
      {item => (
        <Item key={item.key} textValue={item.label}>
          <Audio />
          <Text>{item.label}</Text>
        </Item>
      )}
    </TagGroup>
  ))
  .add(
    'onRemove',
    () => {
      let [items, setItems] = useState([
        {id: 1, label: 'Cool Tag 1'},
        {id: 2, label: 'Another cool tag'},
        {id: 3, label: 'This tag'},
        {id: 4, label: 'What tag?'},
        {id: 5, label: 'This tag is cool too'},
        {id: 6, label: 'Shy tag'}
      ]);

      let removeItem = (key) => {
        setItems(prevItems => prevItems.filter((item) => key !== item.id));
      };

      return (
        <TagGroup allowsRemoving aria-label="Tag group with removable tags" items={items} onRemove={removeItem}>
          {item => <Item>{item.label}</Item>}
        </TagGroup>
      );
    }
  )
  .add('wrapping', () => (
    <div style={{width: '200px'}}>
      <TagGroup aria-label="Tag group with wrapping">
        <Item key="1">Cool Tag 1</Item>
        <Item key="2">Another cool tag</Item>
        <Item key="3">This tag</Item>
        <Item key="4">What tag?</Item>
        <Item key="5">This tag is cool too</Item>
        <Item key="6">Shy tag</Item>
      </TagGroup>
    </div>
    )
  )
  .add('label truncation', () => (
    <div style={{width: '100px'}}>
      <TagGroup aria-label="Tag group with label truncation">
        <Item key="1">Cool Tag 1 with a really long label</Item>
        <Item key="2">Another long cool tag label</Item>
        <Item key="3">This tag</Item>
      </TagGroup>
    </div>
    )
  )
  .add(
    'dynamic items',
    () => (
      <TagGroup aria-label="Tag group with dynamic items" items={items}>
        {item => <Item key={item.key} textValue={item.label}><Text>{item.label}</Text></Item>}
      </TagGroup>
    )
  );

function render(props: any = {}) {
  return (
    <TagGroup {...props} aria-label="Tag group">
      <Item key="1">Cool Tag 1</Item>
      <Item key="2">Cool Tag 2</Item>
      <Item key="3">Cool Tag 3</Item>
    </TagGroup>
  );
}

