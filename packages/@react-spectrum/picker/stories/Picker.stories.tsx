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
import {ActionButton} from '@react-spectrum/button';
import AlignCenter from '@spectrum-icons/workflow/AlignCenter';
import AlignLeft from '@spectrum-icons/workflow/AlignLeft';
import AlignRight from '@spectrum-icons/workflow/AlignRight';
import Copy from '@spectrum-icons/workflow/Copy';
import Cut from '@spectrum-icons/workflow/Cut';
import {Flex} from '@react-spectrum/layout';
import {Item, Picker, Section} from '../';
import Paste from '@spectrum-icons/workflow/Paste';
import React, {useState} from 'react';
import {storiesOf} from '@storybook/react';
import {Text} from '@react-spectrum/text';
import {useAsyncList} from '@react-stately/data';
import {View} from '@react-spectrum/view';


let flatOptions = [
  {id: 1, name: 'Aardvark'},
  {id: 2, name: 'Kangaroo'},
  {id: 3, name: 'Snake'},
  {id: 4, name: 'Danni'},
  {id: 5, name: 'Devon'},
  {id: 6, name: 'Ross'},
  {id: 7, name: 'Puppy'},
  {id: 8, name: 'Doggo'},
  {id: 9, name: 'Floof'}
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
      <Picker label="Test" onSelectionChange={action('selectionChange')}>
        <Item key="rarely">Short</Item>
        <Item key="sometimes">Normal</Item>
        <Item key="always">This item is very long and word wraps poorly</Item>
      </Picker>
    )
  )
  .add(
    'sections',
    () => (
      <Picker label="Test" onSelectionChange={action('selectionChange')}>
        <Section title="Animals">
          <Item key="Aardvark">Aardvark</Item>
          <Item key="Kangaroo">Kangaroo</Item>
          <Item key="Snake">Snake</Item>
        </Section>
        <Section title="People">
          <Item key="Danni">Danni</Item>
          <Item key="Devon">Devon</Item>
          <Item key="Ross">Ross</Item>
        </Section>
      </Picker>
    )
  )
  .add(
    'dynamic',
    () => (
      <Picker label="Test" items={flatOptions} onSelectionChange={action('selectionChange')}>
        {item => <Item>{item.name}</Item>}
      </Picker>
    )
  )
  .add(
    'dynamic with sections',
    () => (
      <Picker label="Test" items={withSection} onSelectionChange={action('selectionChange')}>
        {item => (
          <Section key={item.name} items={item.children} title={item.name}>
            {item => <Item key={item.name}>{item.name}</Item>}
          </Section>
        )}
      </Picker>
    )
  )
  .add(
    'isDisabled',
    () => (
      <Picker label="Test" isDisabled onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'isDisabled, selectedKey',
    () => (
      <Picker label="Test" isDisabled selectedKey="One" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'labelAlign: end',
    () => (
      <Picker direction="top" label="Test" labelAlign="end" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'labelPosition: side',
    () => (
      <Picker label="Test" labelPosition="side" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'isRequired',
    () => (
      <Picker label="Test" isRequired onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'isRequired, necessityIndicator: label',
    () => (
      <Picker label="Test" isRequired necessityIndicator="label" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'optional, necessityIndicator: label',
    () => (
      <Picker label="Test" necessityIndicator="label" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'validationState: invalid',
    () => (
      <Picker label="Test" validationState="invalid" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'isQuiet',
    () => (
      <Picker isQuiet label="Test" onSelectionChange={action('selectionChange')}>
        <Item key="100">One hundred</Item>
        <Item key="2012">Two thousand and twelve</Item>
        <Item key="3">Three</Item>
      </Picker>
    )
  )
  .add(
    'isQuiet, isDisabled',
    () => (
      <Picker label="Test" isQuiet isDisabled onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two million">Two million</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'isQuiet, labelAlign: end',
    () => (
      <Picker label="Test" isQuiet labelAlign="end" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="two">Two dollary-doos</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'isQuiet, labelPosition: side',
    () => (
      <Picker label="Test" isQuiet labelPosition="side" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'isQuiet, isRequired',
    () => (
      <Picker label="Test" isQuiet isRequired onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'isQuiet, isRequired, necessityIndicator: label',
    () => (
      <Picker label="Test" isQuiet isRequired necessityIndicator="label" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'isQuiet, optional, necessityIndicator: label',
    () => (
      <Picker label="Test" isQuiet necessityIndicator="label" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'isQuiet, validationState: invalid',
    () => (
      <Picker label="Test" isQuiet validationState="invalid" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'complex items',
    () => (
      <Picker label="Test" onSelectionChange={action('selectionChange')}>
        <Section title="Section 1">
          <Item textValue="Copy">
            <Copy />
            <Text>Copy</Text>
          </Item>
          <Item textValue="Cut">
            <Cut />
            <Text>Cut</Text>
          </Item>
          <Item textValue="Paste">
            <Paste />
            <Text>Paste</Text>
          </Item>
        </Section>
        <Section title="Section 2">
          <Item textValue="Puppy">
            <AlignLeft />
            <Text>Puppy</Text>
            <Text slot="description">Puppy description super long as well geez</Text>
          </Item>
          <Item textValue="Doggo with really really really long long long text">
            <AlignCenter />
            <Text>Doggo with really really really long long long text</Text>
          </Item>
          <Item textValue="Floof">
            <AlignRight />
            <Text>Floof</Text>
          </Item>
        </Section>
      </Picker>
    )
  )
  .add(
    'long item text',
    () => (
      <Picker label="Test" onSelectionChange={action('selectionChange')}>
        <Item key="short">One</Item>
        <Item key="long">your text here long long long long</Item>
        <Item key="underscores">your_text_here_long_long_long_long</Item>
        <Item key="hyphens">your-text-here-long-long-long-long</Item>
        <Item key="singleWord">supercalifragilisticexpialidocious</Item>
        <Item key="always">This item is very long and word wraps poorly</Item>
      </Picker>
    )
  )
  .add(
    'falsy item key',
    () => (
      <Picker label="Test" onSelectionChange={action('selectionChange')}>
        <Item key="">None</Item>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'no visible label',
    () => (
      <Picker aria-label="Test" onSelectionChange={action('selectionChange')}>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'with description',
    () => (
      <Picker label="Test" description="Please select an item." onSelectionChange={action('selectionChange')}>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'with error message',
    () => (
      <Picker label="Test" errorMessage="Please select a valid item." validationState="invalid" onSelectionChange={action('selectionChange')}>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'isQuiet, no visible label',
    () => (
      <Picker aria-label="Test" isQuiet onSelectionChange={action('selectionChange')}>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'isQuiet, align: end',
    () => (
      <Picker aria-label="Test" isQuiet align="end" onSelectionChange={action('selectionChange')}>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'custom widths',
    () => (
      <Flex direction="column">
        <Picker label="Test" width="size-1200" onSelectionChange={action('selectionChange')}>
          <Item>One</Item>
          <Item>Two</Item>
          <Item>Three</Item>
        </Picker>
        <Picker label="Test" width="size-6000" onSelectionChange={action('selectionChange')}>
          <Item>One</Item>
          <Item>Two</Item>
          <Item>Three</Item>
        </Picker>
      </Flex>
    )
  )
  .add(
    'custom widths, labelPosition: side',
    () => (
      <Flex direction="column">
        <Picker label="Test" width="size-1200" labelPosition="side" onSelectionChange={action('selectionChange')}>
          <Item>One</Item>
          <Item>Two</Item>
          <Item>Three</Item>
        </Picker>
        <Picker label="Test" width="size-6000" labelPosition="side" onSelectionChange={action('selectionChange')}>
          <Item>One</Item>
          <Item>Two</Item>
          <Item>Three</Item>
        </Picker>
      </Flex>
    )
  )
  .add(
    'custom menu widths',
    () => (
      <Flex direction="column">
        <Picker label="Test" menuWidth="size-1000" onSelectionChange={action('selectionChange')}>
          <Item>One</Item>
          <Item>Two</Item>
          <Item>Three</Item>
        </Picker>
        <Picker label="Test" menuWidth="size-6000" onSelectionChange={action('selectionChange')}>
          <Item>One</Item>
          <Item>Two</Item>
          <Item>Three</Item>
        </Picker>
      </Flex>
    )
  )
  .add(
    'custom menu widths, isQuiet',
    () => (
      <Flex direction="column">
        <Picker label="Test" menuWidth="size-400" isQuiet onSelectionChange={action('selectionChange')}>
          <Item>One</Item>
          <Item>Two</Item>
          <Item>Three</Item>
        </Picker>
        <Picker label="Test" menuWidth="size-6000" isQuiet onSelectionChange={action('selectionChange')}>
          <Item>One</Item>
          <Item>Two</Item>
          <Item>Three</Item>
        </Picker>
      </Flex>
    )
  )
  .add(
    'custom menu width, align: end',
    () => (
      <Picker label="Test" menuWidth="size-6000" align="end" onSelectionChange={action('selectionChange')}>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'isOpen (controlled)',
    () => (
      <Picker label="Test" isOpen onOpenChange={action('onOpenChange')} onSelectionChange={action('selectionChange')}>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'defaultOpen (uncontrolled)',
    () => (
      <Picker label="Test" defaultOpen onOpenChange={action('onOpenChange')} onSelectionChange={action('selectionChange')}>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Picker>
    )
  )
  .add(
    'selectedKey (controlled)',
    () => (
      <Picker label="Test" selectedKey="One" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'defaultSelectedKey (uncontrolled)',
    () => (
      <Picker label="Test" defaultSelectedKey="One" onSelectionChange={action('selectionChange')}>
        <Item key="One">One</Item>
        <Item key="Two">Two</Item>
        <Item key="Three">Three</Item>
      </Picker>
    )
  )
  .add(
    'picker closes on blur',
    () => (
      <>
        <div style={{display: 'flex', width: 'auto', margin: '250px 0'}}>
          <input placeholder="Shift tab here" />
          <Picker label="Test" defaultSelectedKey="One" onSelectionChange={action('selectionChange')}>
            <Item key="One">One</Item>
            <Item key="Two">Two</Item>
            <Item key="Three">Three</Item>
          </Picker>
          <input placeholder="Tab here" />
        </div>
      </>
    )
  )
  .add(
    'isLoading',
    () => (
      <Picker label="Test" isLoading items={[]}>
        {item => <Item>{item.name}</Item>}
      </Picker>
    )
  )
  .add(
    'isLoading, isQuiet',
    () => (
      <Picker label="Test" isLoading isQuiet items={[]}>
        {item => <Item>{item.name}</Item>}
      </Picker>
    )
  )
  .add(
    'isLoading more',
    () => (
      <Picker label="Test" isLoading items={flatOptions}>
        {item => <Item>{item.name}</Item>}
      </Picker>
    )
  )
  .add(
    'async loading',
    () => (
      <AsyncLoadingExample />
    )
  ).add(
    'focus',
    () => (
      <div style={{display: 'flex', width: 'auto', margin: '250px 0'}}>
        <input placeholder="Shift tab here" />
        <Picker label="Focus-Test" items={flatOptions} autoFocus onFocus={action('focus')} onBlur={action('blur')} onKeyDown={action('keydown')} onKeyUp={action('keyup')}>
          {item => <Item>{item.name}</Item>}
        </Picker>
        <input placeholder="Tab here" />
      </div>
    )
  )
  .add('resize', () => <ResizePicker />)
  .add('autofocus', () => (
    <Picker label="Test" autoFocus>
      <Item key="One">One</Item>
      <Item key="Two">Two</Item>
      <Item key="Three">Three</Item>
    </Picker>
  ))
  .add('scrolling container', () => (
    <View width="300px" height="size-500" overflow="auto">
      <View width="500px">
        <Picker label="Test" autoFocus>
          <Item key="One">One</Item>
          <Item key="Two">Two</Item>
          <Item key="Three">Three</Item>
        </Picker>
      </View>
    </View>
  ));

function AsyncLoadingExample() {
  interface Pokemon {
    name: string,
    url: string
  }

  let list = useAsyncList<Pokemon>({
    async load({signal, cursor}) {
      let res = await fetch(cursor || 'https://pokeapi.co/api/v2/pokemon', {signal});
      let json = await res.json();
      // The API is too fast sometimes, so make it take longer so we can see the spinner
      await new Promise(resolve => setTimeout(resolve, cursor ? 500 : 1000));
      return {
        items: json.results,
        cursor: json.next
      };
    }
  });

  return (
    <Picker label="Pick a Pokemon" items={list.items} isLoading={list.isLoading} onLoadMore={list.loadMore}>
      {item => <Item key={item.name}>{item.name}</Item>}
    </Picker>
  );
}

function ResizePicker() {
  const [state, setState] = useState(true);

  return (
    <Flex direction="column" gap="size-200" alignItems="start">
      <div style={{width: state ? '200px' : '300px'}}>
        <Picker label="Choose A" width="100%">
          <Item key="rarely">A1</Item>
          <Item key="sometimes">A2</Item>
          <Item key="always">A3</Item>
        </Picker>
      </div>
      <ActionButton onPress={() => setState(!state)}>Toggle size</ActionButton>
    </Flex>
  );
}
