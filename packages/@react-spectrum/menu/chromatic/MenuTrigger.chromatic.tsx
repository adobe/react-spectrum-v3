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

import {ActionButton} from '@react-spectrum/button';
import AlignCenter from '@spectrum-icons/workflow/AlignCenter';
import AlignLeft from '@spectrum-icons/workflow/AlignLeft';
import AlignRight from '@spectrum-icons/workflow/AlignRight';
import Blower from '@spectrum-icons/workflow/Blower';
import Book from '@spectrum-icons/workflow/Book';
import Copy from '@spectrum-icons/workflow/Copy';
import Cut from '@spectrum-icons/workflow/Cut';
import {Item, Menu, MenuTrigger, Section} from '../';
import {Keyboard, Text} from '@react-spectrum/text';
import {Meta, Story} from '@storybook/react';
import Paste from '@spectrum-icons/workflow/Paste';
import React from 'react';
import {SpectrumMenuTriggerProps} from '@react-types/menu';

const meta: Meta<SpectrumMenuTriggerProps> = {
  title: 'MenuTrigger',
  component: MenuTrigger,
  parameters: {
    chromaticProvider: {colorSchemes: ['light'], locales: ['en-US'], scales: ['medium'], disableAnimations: true},
    // chromatic needs a bit more time than disableAnimations allows
    chromatic: {pauseAnimationAtEnd: true}
  },
  decorators: [Story => <div style={{display: 'flex', width: 'auto', margin: '250px 0'}}><Story /></div>]
};

export default meta;

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
    {name: 'Copy', icon: 'Copy', shortcut: '⌘C'},
    {name: 'Cut', icon: 'Cut', shortcut: '⌘X'},
    {name: 'Paste', icon: 'Paste', shortcut: '⌘V'}
  ]},
  {name: 'Section 2', children: [
    {name: 'Puppy', icon: 'AlignLeft', shortcut: '⌘P'},
    {name: 'Doggo', icon: 'AlignCenter', shortcut: '⌘D'},
    {name: 'Floof', icon: 'AlignRight', shortcut: '⌘F'},
    {name: 'hasChildren', children: [
      {name: 'Thailand', icon: 'Blower', shortcut: '⌘T'},
      {name: 'Germany', icon: 'Book', shortcut: '⌘G'}
    ]}
  ]}
];

let flatMenu = [
  {name: 'One'},
  {name: 'Two'},
  {name: 'Three'},
  {name: 'Four'},
  {name: 'Five'}
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
    {name: 'Ross', children: [
      {name: 'Tests', children: [
        {name: 'blah'}
      ]}
    ]}
  ]}
];

let withArabic = [
  {name: 'نسخ', icon: 'Copy', shortcut: '⌘C'},
  {name: 'قص', icon: 'Cut', shortcut: '⌘X'},
  {name: 'لصق', icon: 'Paste', shortcut: '⌘V'}
];

const Template = (): Story<SpectrumMenuTriggerProps> => (args) => (
  <MenuTrigger {...args} isOpen>
    <ActionButton>
      Menu Button
    </ActionButton>
    <Menu items={flatMenu} disabledKeys={['One', 'Three']} selectedKeys={['Two', 'Five']} selectionMode="multiple">
      {item => <Item key={item.name}>{item.name}</Item>}
    </Menu>
  </MenuTrigger>
);

const TemplateWithSections = (): Story<SpectrumMenuTriggerProps> => (args) => (
  <MenuTrigger {...args} isOpen>
    <ActionButton>
      Menu Button
    </ActionButton>
    <Menu items={withSection} disabledKeys={['Snake', 'Ross']} selectedKeys={['Aardvark', 'Devon']} selectionMode="multiple">
      {(item: any) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item: any) => <Item key={item.name} childItems={item.children}>{item.name}</Item>}
        </Section>
      )}
    </Menu>
  </MenuTrigger>
);

const customMenuItem = (item) => {
  let Icon = iconMap[item.icon];
  return (
    <Item childItems={item.children} textValue={item.name} key={item.name}>
      {item.icon && <Icon size="S" />}
      <Text>{item.name}</Text>
      {item.shortcut && <Keyboard>{item.shortcut}</Keyboard>}
    </Item>
  );
};

const TemplateWithIcons = (): Story<SpectrumMenuTriggerProps> => (args) => (
  <MenuTrigger {...args} isOpen>
    <ActionButton>
      Menu Button
    </ActionButton>
    <Menu items={hardModeProgrammatic} disabledKeys={['Cut', 'Doggo']} selectedKeys={['Floof', 'Copy']} selectionMode="multiple">
      {item => (
        <Section key={item.name} items={item.children} title={item.name}>
          {item => customMenuItem(item)}
        </Section>
      )}
    </Menu>
  </MenuTrigger>
);

const TemplateArabicWithIcons = (): Story<SpectrumMenuTriggerProps> => (args) => (
  <MenuTrigger {...args} isOpen>
    <ActionButton>
      Menu Button
    </ActionButton>
    <Menu items={withArabic}>
      {item => customMenuItem(item)}
    </Menu>
  </MenuTrigger>
);

export const Default = Template().bind({});
Default.storyName = 'flat list';

export const WithSections = TemplateWithSections().bind({});
WithSections.storyName = 'with sections';

export const Complex = TemplateWithIcons().bind({});
Complex.storyName = 'complex items';

export const AlignEnd = Template().bind({});
AlignEnd.storyName = 'align="end"';
AlignEnd.args = {align: 'end'};

export const DirectionTop = Template().bind({});
DirectionTop.storyName = 'direction="top"';
DirectionTop.args = {direction: 'top'};

export const DirectionBottom = Template().bind({});
DirectionBottom.storyName = 'direction="bottom"';
DirectionBottom.args = {direction: 'bottom'};

export const DirectionStart = Template().bind({});
DirectionStart.storyName = 'direction="start"';
DirectionStart.args = {direction: 'start'};

export const DirectionStartEnd = Template().bind({});
DirectionStartEnd.storyName = 'direction="start", align="end"';
DirectionStartEnd.args = {direction: 'start', align: 'end'};

export const DirectionEnd = Template().bind({});
DirectionEnd.storyName = 'direction="end"';
DirectionEnd.args = {direction: 'end'};

export const DirectionEndEnd = Template().bind({});
DirectionEndEnd.storyName = 'direction="end" align="end"';
DirectionEndEnd.args = {direction: 'end', align: 'end'};

export const DirectionLeft = Template().bind({});
DirectionLeft.storyName = 'direction="left"';
DirectionLeft.args = {direction: 'left'};

export const DirectionLeftEnd = Template().bind({});
DirectionLeftEnd.storyName = 'direction="left", align="end"';
DirectionLeftEnd.args = {direction: 'left', align: 'end'};

export const DirectionRight = Template().bind({});
DirectionRight.storyName = 'direction="right"';
DirectionRight.args = {direction: 'right'};

export const DirectionRightEnd = Template().bind({});
DirectionRightEnd.storyName = 'direction="right", align="end"';
DirectionRightEnd.args = {direction: 'right', align: 'end'};

export const ArabicComplex = TemplateArabicWithIcons().bind({});
ArabicComplex.storyName = 'Arabic complex items';
