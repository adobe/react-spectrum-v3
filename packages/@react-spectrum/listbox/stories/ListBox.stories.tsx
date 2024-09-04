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
import {ActionGroup, AlertDialog, Avatar, Button, DialogContainer, Flex, Text, useFilter} from '@adobe/react-spectrum';
import AlignCenter from '@spectrum-icons/workflow/AlignCenter';
import AlignLeft from '@spectrum-icons/workflow/AlignLeft';
import AlignRight from '@spectrum-icons/workflow/AlignRight';
import Blower from '@spectrum-icons/workflow/Blower';
import Book from '@spectrum-icons/workflow/Book';
import Copy from '@spectrum-icons/workflow/Copy';
import Cut from '@spectrum-icons/workflow/Cut';
import Delete from '@spectrum-icons/workflow/Delete';
import {FocusScope} from '@react-aria/focus';
import {Item, ListBox, Section} from '../';
import {Label} from '@react-spectrum/label';
import Paste from '@spectrum-icons/workflow/Paste';
import React, {useRef, useState} from 'react';
import {TranslateListBox} from './../chromatic/ListBoxLanguages.stories';
import {useAsyncList, useListData, useTreeData} from '@react-stately/data';

let iconMap = {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Blower,
  Book,
  Copy,
  Cut,
  Paste
};

let hardModeProgrammatic = [
  {name: 'Section 1', children: [
    {name: 'Copy', icon: 'Copy'},
    {name: 'Cut', icon: 'Cut'},
    {name: 'Paste', icon: 'Paste'}
  ]},
  {name: 'Section 2', children: [
    {name: 'Puppy', icon: 'AlignLeft'},
    {name: 'Doggo', icon: 'AlignCenter'},
    {name: 'Floof', icon: 'AlignRight'}
  ]}
];

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

let itemsWithFalsyId = [
  {id: 0, name: 'key=0', children: [
    {id: 1, name: 'Aardvark'},
    {id: 2, name: 'Kangaroo'},
    {id: 3, name: 'Snake'}
  ]},
  {id: '', name: 'key=""', children: [
    {id: 4, name: 'Danni'},
    {id: 5, name: 'Devon'},
    {id: 6, name: 'Ross'}
  ]}
];

let lotsOfSections: any[] = [];
for (let i = 0; i < 50; i++) {
  let children = [];
  for (let j = 0; j < 50; j++) {
    children.push({name: `Section ${i}, Item ${j}`});
  }

  lotsOfSections.push({name: 'Section ' + i, children});
}

export default {
  title: 'ListBox',
  excludeStories: ['FocusExample']
};

function StoryDecorator(props) {
  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      <Label id="label">Choose an item</Label>
      <div
        style={{
          display: 'flex',
          minWidth: '200px',
          background: 'var(--spectrum-global-color-gray-50)',
          border: '1px solid lightgray',
          maxHeight: 300
        }}>
        {props.children}
      </div>
    </div>
  );
}

export const DefaultListBox = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label" items={flatOptions}>
      {(item) => <Item key={item.name}>{item.name}</Item>}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'Default ListBox'
};

export const ListBoxWSections = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label" items={withSection}>
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'ListBox w/ sections'
};

export const ListBoxWManySectionsAndSelection = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      selectionMode="multiple"
      items={lotsOfSections}
      onSelectionChange={action('onSelectionChange')}>
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item: any) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'ListBox w/ many sections and selection'
};

export const ListBoxWSectionsAndFalsyIds = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      items={itemsWithFalsyId}
      selectionMode="multiple"
      onSelectionChange={action('onSelectionChange')}>
      {(item) => (
        <Section items={item.children} title={item.name}>
          {(item) => <Item>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'ListBox w/ sections and falsy ids'
};

export const ListBoxWSectionsAndNoTitle = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label" items={withSection}>
      {(item) => (
        <Section key={item.name} items={item.children} aria-label={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'ListBox w/ sections and no title'
};

export const Static = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label">
      <Item>One</Item>
      <Item>Two</Item>
      <Item>Three</Item>
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )]
};

export const StaticWithSectionsAndSelection = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label" selectionMode="multiple">
      <Section title="Section 1">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Section>
      <Section title="Section 2">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Section>
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'Static with sections and selection'
};

export const StaticWithSectionsAndNoTitle = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label">
      <Section aria-label="Section 1">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Section>
      <Section aria-label="Section 2">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Section>
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'Static with sections and no title'
};

export const WithDefaultSelectedOption = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      selectionMode="multiple"
      onSelectionChange={action('onSelectionChange')}
      items={withSection}
      defaultSelectedKeys={['Kangaroo']}>
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'with default selected option'
};

export const SingleSelectionWithDefaultSelectedOption = {
  render: () => (
    <ListBox
      flexGrow={1}
      selectionMode="single"
      onSelectionChange={action('onSelectionChange')}
      aria-labelledby="label"
      items={flatOptions}
      defaultSelectedKeys={['Kangaroo']}>
      {(item) => <Item key={item.name}>{item.name}</Item>}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'single selection with default selected option'
};

export const StaticWithDefaultSelectedOptions = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      selectionMode="multiple"
      onSelectionChange={action('onSelectionChange')}
      defaultSelectedKeys={['2', '3']}>
      <Section title="Section 1">
        <Item key="1">One</Item>
        <Item key="2">Two</Item>
        <Item key="3">Three</Item>
      </Section>
      <Section title="Section 2">
        <Item key="4">Four</Item>
        <Item key="5">Five</Item>
        <Item key="6">Six</Item>
        <Item key="7">Seven</Item>
      </Section>
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'static with default selected options'
};

export const WithSelectedOptionsControlled = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      selectionMode="multiple"
      onSelectionChange={action('onSelectionChange')}
      items={withSection}
      selectedKeys={['Kangaroo']}>
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'with selected options (controlled)'
};

export const StaticWithSelectedOptionsControlled = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      selectionMode="multiple"
      onSelectionChange={action('onSelectionChange')}
      selectedKeys={['2']}>
      <Section title="Section 1">
        <Item key="1">One</Item>
        <Item key="2">Two</Item>
        <Item key="3">Three</Item>
      </Section>
      <Section title="Section 2">
        <Item key="4">Four</Item>
        <Item key="5">Five</Item>
        <Item key="6">Six</Item>
        <Item key="7">Seven</Item>
      </Section>
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'static with selected options (controlled)'
};

export const WithDisabledOptions = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      items={withSection}
      disabledKeys={['Kangaroo', 'Ross']}>
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'with disabled options'
};

export const StaticWithDisabledOptions = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label" disabledKeys={['3', '5']}>
      <Section title="Section 1">
        <Item key="1">One</Item>
        <Item key="2">Two</Item>
        <Item key="3">Three</Item>
      </Section>
      <Section title="Section 2">
        <Item key="4">Four</Item>
        <Item key="5">Five</Item>
        <Item key="6">Six</Item>
        <Item key="7">Seven</Item>
      </Section>
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'static with disabled options'
};

export const MultipleSelection = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      items={withSection}
      onSelectionChange={action('onSelectionChange')}
      selectionMode="multiple"
      defaultSelectedKeys={['Aardvark', 'Snake']}
      disabledKeys={['Kangaroo', 'Ross']}>
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'Multiple selection'
};

export const MultipleSelectionStatic = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      onSelectionChange={action('onSelectionChange')}
      selectionMode="multiple"
      defaultSelectedKeys={['2', '5']}
      disabledKeys={['1', '3']}>
      <Section title="Section 1">
        <Item key="1">One</Item>
        <Item key="2">Two</Item>
        <Item key="3">Three</Item>
      </Section>
      <Section title="Section 2">
        <Item key="4">Four</Item>
        <Item key="5">Five</Item>
        <Item key="6">Six</Item>
      </Section>
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'Multiple selection, static'
};

export const NoSelectionAllowed = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label" items={withSection}>
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'No selection allowed'
};

export const NoSelectionAllowedStatic = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label">
      <Section title="Section 1">
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Section>
      <Section title="Section 2">
        <Item>Four</Item>
        <Item>Five</Item>
        <Item>Six</Item>
      </Section>
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'No selection allowed, static'
};

export const ListBoxWithAutoFocusTrue = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label" items={withSection} autoFocus>
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'ListBox with autoFocus=true'
};

export const ListBoxWithAutoFocusComplex = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      items={withSection}
      autoFocus
      defaultSelectedKeys={['Snake']}
      selectionMode="single">
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'ListBox with autoFocus=true, selectionMode=single, default selected key (uncontrolled)'
};

export const ListBoxWithAutoFocusFirst = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      items={withSection}
      selectionMode="multiple"
      onSelectionChange={action('onSelectionChange')}
      autoFocus="first">
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'ListBox with autoFocus="first"'
};

export const ListBoxWithAutoFocusLast = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      items={withSection}
      selectionMode="multiple"
      onSelectionChange={action('onSelectionChange')}
      autoFocus="last">
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'ListBox with autoFocus="last"'
};

export const ListBoxWithKeyboardSelectionWrapping = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      items={withSection}
      selectionMode="multiple"
      onSelectionChange={action('onSelectionChange')}
      shouldFocusWrap>
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'ListBox with keyboard selection wrapping'
};

export const WithSemanticElementsStatic = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      selectionMode="multiple"
      disabledKeys={['paste', 'floof']}
      onSelectionChange={action('onSelectionChange')}>
      <Section title="Section 1">
        <Item key="copy" textValue="Copy">
          <Copy size="S" />
          <Text>Copy</Text>
        </Item>
        <Item key="cut" textValue="Cut">
          <Cut size="S" />
          <Text>Cut</Text>
        </Item>
        <Item key="paste" textValue="Paste">
          <Paste size="S" />
          <Text>Paste</Text>
        </Item>
      </Section>
      <Section title="Section 2">
        <Item key="puppy" textValue="Puppy">
          <AlignLeft size="S" />
          <Text>Puppy</Text>
          <Text slot="description">Puppy description super long as well geez</Text>
        </Item>
        <Item key="floof" textValue="Floof">
          <AlignRight size="S" />
          <Text>Floof</Text>
          <Text slot="description">Floof medium description</Text>
        </Item>
        <Item key="doggo" textValue="Doggo with really really really long long long text">
          <AlignCenter size="S" />
          <Text>Doggo with really really really long long long text</Text>
        </Item>
        <Item key="basic">Basic Item</Item>
      </Section>
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'with semantic elements (static)'
};

export const WithSemanticElementsGenerativeMultipleSelection = {
  render: () => (
    <ListBox
      flexGrow={1}
      aria-labelledby="label"
      items={hardModeProgrammatic}
      onSelectionChange={action('onSelectionChange')}
      selectionMode="multiple">
      {(item) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item) => customOption(item)}
        </Section>
      )}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'with semantic elements (generative), multiple selection'
};

export const IsLoading = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label" items={[]} isLoading>
      {(item) => <Item>{item.name}</Item>}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'isLoading'
};

export const IsLoadingMore = {
  render: () => (
    <ListBox flexGrow={1} aria-labelledby="label" items={flatOptions} isLoading>
      {(item) => <Item key={item.name}>{item.name}</Item>}
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'isLoading more'
};

export const AsyncLoading = {
  render: () => (
    <AsyncLoadingExample />
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  name: 'async loading'
};

export const AsyncLoadingResizable = {
  render: () => (
    <div style={{display: 'flex', height: '200px', flexGrow: 1, minWidth: '200px', padding: '10px', resize: 'both', overflow: 'auto'}}>
      <AsyncLoadingExample />
    </div>
  ),
  decorators: [(Story) => (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      <Label id="label">Choose an item</Label>
      <div style={{display: 'flex', minWidth: '200px', background: 'var(--spectrum-global-color-gray-50)', border: '1px solid lightgray'}}>
        <Story />
      </div>
    </div>
  )],
  name: 'async loading, resizable'
};

export const ListboxContainers = {
  render: () => <App />,
  decorators: null,
  name: 'listbox containers'
};

export const RestoreFocusExample = {
  render: (args) => <FocusExample {...args} />,
  decorators: null,
  name: 'restore focus after deleting selected items'
};

export const WithTranslations = {
  render: () => <TranslateListBox />,
  decorators: null,
  name: 'with translations',
  parameters: {description: {data: 'Translations included for: Arabic, English, Hebrew, Japanese, Korean, Simplified Chinese, and Traditional Chinese.'}}
};

let customOption = (item) => {
  let Icon = iconMap[item.icon];
  return (
    <Item textValue={item.name} key={item.name}>
      {item.icon && <Icon size="S" />}
      <Text>{item.name}</Text>
    </Item>
  );
};

function AsyncLoadingExample() {
  interface Pokemon {
    name: string,
    url: string
  }

  let list = useAsyncList<Pokemon>({
    async load({signal, cursor}) {
      let res = await fetch(cursor || 'https://pokeapi.co/api/v2/pokemon', {signal});
      let json = await res.json();
      return {
        items: json.results,
        cursor: json.next
      };
    }
  });

  return (
    <ListBox flexGrow={1} aria-labelledby="label" items={list.items} isLoading={list.isLoading} onLoadMore={list.loadMore}>
      {item => <Item key={item.name}>{item.name}</Item>}
    </ListBox>
  );
}

let itemsForDemo = Array.from(new Array(100)).map((val, index) => ({val, index}));
function App() {
  let [size, setSize] = useState('700px');

  const toggleSize = () => {
    if (size === '700px') {
      setSize('300px');
    } else {
      setSize('700px');
    }
  };

  return (
    <>
      <Button variant="primary" onPress={toggleSize}> Toggle Size</Button>
      <div style={{display: 'flex', height: size, overflow: 'hidden'}}>
        <Flex maxHeight="300px">
          <Text id="label1">Max-Height: 300px</Text>
          <ListBox width="150px" items={itemsForDemo} aria-labelledby="label1">
            { item => (
              <Item textValue={String(item.index)} key={item.index}>
                <Text>IDX: {item.index}</Text>
              </Item>
            )}
          </ListBox>
        </Flex>
        <Flex>
          <Text id="label2">None</Text>
          <ListBox width="150px" items={itemsForDemo} aria-labelledby="label2">
            { item => (
              <Item textValue={String(item.index)} key={item.index}>
                <Text>IDX: {item.index}</Text>
              </Item>
            )}
          </ListBox>
        </Flex>
        <Flex maxHeight="700px">
          <Text id="label3">Max-Height: 700px</Text>
          <ListBox width="150px" items={itemsForDemo} aria-labelledby="label3">
            { item => (
              <Item textValue={String(item.index)} key={item.index}>
                <Text>IDX: {item.index}</Text>
              </Item>
            )}
          </ListBox>
        </Flex>
        <Flex maxHeight="100%">
          <Text id="label4">MaxHeight: 100%</Text>
          <ListBox width="150px" items={itemsForDemo} aria-labelledby="label4">
            { item => (
              <Item textValue={String(item.index)} key={item.index}>
                <Text>IDX: {item.index}</Text>
              </Item>
            )}
          </ListBox>
        </Flex>
        <Flex maxHeight="50%">
          <Text id="label5">MaxHeight: 50%</Text>
          <ListBox width="150px" items={itemsForDemo} aria-labelledby="label5">
            { item => (
              <Item textValue={String(item.index)} key={item.index}>
                <Text>IDX: {item.index}</Text>
              </Item>
            )}
          </ListBox>
        </Flex>
        <Flex height="700px">
          <Text id="label6">Height: 700px</Text>
          <ListBox width="150px" items={itemsForDemo} aria-labelledby="label6">
            { item => (
              <Item textValue={String(item.index)} key={item.index}>
                <Text>IDX: {item.index}</Text>
              </Item>
            )}
          </ListBox>
        </Flex>
        <Flex height="100%">
          <Text id="label7">Height: 100%</Text>
          <ListBox width="150px" items={itemsForDemo} aria-labelledby="label7">
            { item => (
              <Item textValue={String(item.index)} key={item.index}>
                <Text>IDX: {item.index}</Text>
              </Item>
            )}
          </ListBox>
        </Flex>
      </div>
    </>
  );
}

export function FocusExample(args = {}) {
  let tree = useTreeData({
    initialItems: withSection,
    getKey: (item) => item.name,
    getChildren: (item:{name:string, children?:{name:string, children?:{name:string}[]}[]}) => item.children
  });

  let [dialog, setDialog] = useState(null);
  let ref = useRef(null);
  return (
    <FocusScope>
      <Flex direction={'column'}>
        <ActionGroup marginBottom={8} onAction={action => setDialog({action})}>
          {tree.selectedKeys.size > 0 &&
            <Item key="bulk-delete" aria-label="Delete selected items"><Delete /></Item>
          }
        </ActionGroup>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <Label id="label">Choose items</Label>
          <div style={{display: 'flex', minWidth: '200px', background: 'var(--spectrum-global-color-gray-50)', border: '1px solid lightgray', maxHeight: 300}}>
            {
              <ListBox
                ref={ref}
                flexGrow={1}
                aria-labelledby="label"
                items={tree.items}
                selectedKeys={tree.selectedKeys}
                onSelectionChange={tree.setSelectedKeys}
                selectionMode="multiple"
                {...args}>
                {item => item.children.length && (
                  <Section key={item.value.name} items={item.children} title={item.value.name}>
                    {item => <Item key={item.value.name}>{item.value.name}</Item>}
                  </Section>
                )}
              </ListBox>
            }
          </div>
        </div>
        <DialogContainer onDismiss={() => setDialog(null)}>
          {dialog?.action === 'bulk-delete' &&
            <AlertDialog
              title="Delete"
              variant="destructive"
              primaryActionLabel="Delete"
              onPrimaryAction={() => tree.removeSelectedItems()}>
              Are you sure you want to delete {tree.selectedKeys.size === 1 ? '1 item' : `${tree.selectedKeys.size} items`}?
            </AlertDialog>
          }
        </DialogContainer>
      </Flex>
    </FocusScope>
  );
}

export const Links = (args) => {
  return (
    <ListBox aria-label="ListBox with links" width="250px" height={400} onSelectionChange={action('onSelectionChange')} {...args}>
      <Item key="https://adobe.com/" href="https://adobe.com/">Adobe</Item>
      <Item key="https://google.com/" href="https://google.com/">Google</Item>
      <Item key="https://apple.com/" href="https://apple.com/">Apple</Item>
      <Item key="https://nytimes.com/" href="https://nytimes.com/">New York Times</Item>
      <Item>Non link</Item>
    </ListBox>
  );
};

Links.story = {
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )],
  args: {
    selectionMode: 'none'
  },
  argTypes: {
    selectionMode: {
      control: {
        type: 'radio',
        options: ['none', 'single', 'multiple']
      }
    }
  }
};

export const WithAvatars = {
  render: () => (
    <ListBox aria-label="Listbox with avatars" width="350px">
      <Item textValue="Person 1">
        <Text>Person 1</Text>
        <Avatar src="https://i.imgur.com/kJOwAdv.png" alt="default Adobe avatar" />
      </Item>
      <Item textValue="Person 1">
        <Text>Person 2</Text>
        <Avatar src="https://i.imgur.com/kJOwAdv.png" alt="default Adobe avatar" />
      </Item>
      <Item textValue="Person 1">
        <Text>Person 3</Text>
        <Avatar src="https://i.imgur.com/kJOwAdv.png" alt="default Adobe avatar" />
      </Item>
    </ListBox>
  ),
  decorators: [(Story) => (
    <StoryDecorator>
      <Story />
    </StoryDecorator>
  )]
};


export const FilterableListBox = {
  render: () => <SearchableListBox />,
  decorators: null,
  name: 'filterable listbox'
};

function SearchableListBox() {

  const {contains} = useFilter({sensitivity: 'base'});

  const list = useListData({
    initialItems: withSection,
    filterKey: 'children',
    filter: (item, text) => {
      return contains(item.name, text);
    }
  });

  return (
    <>
      <input type="text" onChange={(e) => list.setFilterText(e.target.value)} />
      <ListBox width="150px" items={list.items} aria-labelledby="labelSearchableListBox">
        {(item) => (
          <Section key={item.name} items={item.children} title={item.name}>
            {(item) => <Item key={item.name}>{item.name}</Item>}
          </Section>
        )}
      </ListBox >
    </>
  );
}
