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

import AlignCenter from '@spectrum-icons/workflow/AlignCenter';
import AlignLeft from '@spectrum-icons/workflow/AlignLeft';
import AlignRight from '@spectrum-icons/workflow/AlignRight';
import Copy from '@spectrum-icons/workflow/Copy';
import Cut from '@spectrum-icons/workflow/Cut';
import {Item, Picker, Section} from '../';
import Paste from '@spectrum-icons/workflow/Paste';
import React from 'react';
import {storiesOf} from '@storybook/react';
import {Text} from '@react-spectrum/typography';

let flatOptions = [
  {name: 'Aardvark'},
  {name: 'Kangaroo'},
  {name: 'Snake'},
  {name: 'Danni'},
  {name: 'Devon'},
  {name: 'Ross'},
  {name: 'Puppy'},
  {name: 'Doggo'},
  {name: 'Floof'}
];

let withSection = [
  {name: 'Animals', children: [
    {name: 'Aardvark'},
    {name: 'Kangaroo'},
    {name: 'Snake'}
  ]},
  {name: 'People', children: [
    {name: 'Danni'},
    {name: 'Devon'},
    {name: 'Ross'}
  ]}
];


storiesOf('Picker', module)
  .add(
    'default',
    () => (
      <Picker label="Test">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'sections',
    () => (
      <Picker label="Test">
        <Section title="Animals">
          <Item>Aardvark</Item>
          <Item>Kangaroo</Item>
          <Item>Snake</Item>
        </Section>
        <Section title="People">
          <Item>Danni</Item>
          <Item>Devon</Item>
          <Item>Ross</Item>
        </Section>
      </Picker>
    )
  )
  .add(
    'dynamic',
    () => (
      <Picker label="Test" items={flatOptions} itemKey="name">
        {item => <Item>{item.name}</Item>}
      </Picker>
    )
  )
  .add(
    'dynamic with sections',
    () => (
      <Picker label="Test" items={withSection} itemKey="name">
        {item => (
          <Section items={item.children} title={item.name}>
            {item => <Item>{item.name}</Item>}
          </Section>
        )}
      </Picker>
    )
  )
  .add(
    'isDisabled',
    () => (
      <Picker label="Test" isDisabled>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'isQuiet',
    () => (
      <Picker isQuiet label="Test">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'labelAlign: end',
    () => (
      <Picker label="Test" labelAlign="end">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'labelPosition: side',
    () => (
      <Picker label="Test" labelPosition="side">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'isRequired',
    () => (
      <Picker label="Test" isRequired>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'isRequired, necessityIndicator: label',
    () => (
      <Picker label="Test" isRequired necessityIndicator="label">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'optional, necessityIndicator: label',
    () => (
      <Picker label="Test" necessityIndicator="label">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'validationState: invalid',
    () => (
      <Picker label="Test" validationState="invalid">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'complex items',
    () => (
      <Picker label="Test">
        <Section title="Section 1">
          <Item textValue="Copy">
            <Copy size="S" />
            <Text>Copy</Text>
          </Item>
          <Item textValue="Cut">
            <Cut size="S" />
            <Text>Cut</Text>
          </Item>
          <Item textValue="Paste">
            <Paste size="S" />
            <Text>Paste</Text>
          </Item>
        </Section>
        <Section title="Section 2">
          <Item textValue="Puppy">
            <AlignLeft size="S" />
            <Text>Puppy</Text>
            <Text slot="description">Puppy description super long as well geez</Text>
          </Item>
          <Item textValue="Doggo with really really really long long long text">
            <AlignCenter size="S" />
            <Text>Doggo with really really really long long long text</Text>
          </Item>
          <Item textValue="Floof">
            <AlignRight size="S" />
            <Text>Floof</Text>
          </Item>
        </Section>
      </Picker>
    )
  );
