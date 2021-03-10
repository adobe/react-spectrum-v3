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
import Blower from '@spectrum-icons/workflow/Blower';
import Book from '@spectrum-icons/workflow/Book';
import Copy from '@spectrum-icons/workflow/Copy';
import Cut from '@spectrum-icons/workflow/Cut';
import {Item, Menu, MenuTrigger, Section} from '../';
import {Keyboard, Text} from '@react-spectrum/text';
import Paste from '@spectrum-icons/workflow/Paste';
import React from 'react';
import {storiesOf} from '@storybook/react';

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
    {name: 'Ross', children: [
      {name: 'Tests', children: [
        {name: 'blah'}
      ]}
    ]}
  ]}
];

storiesOf('MenuTrigger', module)
  .add(
    'default menu (static)',
    () => render(
      <Menu onAction={action('onAction')}>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Menu>
    )
  )
  .add(
    'default menu (generative)',
    () => render(
      <Menu items={flatMenu} onAction={action('onAction')}>
        {item => <Item key={item.name}>{item.name}</Item>}
      </Menu>
    )
  )
  .add(
    'default menu w/ section (static)',
    () => render(
      <Menu onAction={action('onAction')}>
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
      </Menu>
    )
  )
  .add(
    'default menu w/ section (generative)',
    () => render(defaultMenu)
  )
  .add(
    'default menu w/ titleless sections (static)',
    () => render(
      <Menu onAction={action('onAction')}>
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
      </Menu>
    )
  )
  .add(
    'default menu w/ titleless sections (generative)',
    () => render(
      <Menu items={withSection} onAction={action('onAction')}>
        {item => (
          <Section key={item.name} items={item.children} aria-label={item.name}>
            {item => <Item key={item.name}>{item.name}</Item>}
          </Section>
        )}
      </Menu>
    )
  )
  .add(
    'single selected key (controlled, static)',
    () => render(
      <Menu selectionMode="single" onAction={action('onAction')} selectedKeys={['2']}>
        <Section title="Section 1">
          <Item key="1">
            One
          </Item>
          <Item key="2">
            Two
          </Item>
          <Item key="3">
            Three
          </Item>
        </Section>
        <Section title="Section 2">
          <Item key="4">
            Four
          </Item>
          <Item key="5">
            Five
          </Item>
          <Item key="6">
            Six
          </Item>
          <Item key="7">
            Seven
          </Item>
        </Section>
      </Menu>
    )
  )
  .add(
    'single selected key (controlled, generative)',
    () => render(defaultMenu, {}, {selectedKeys: ['Kangaroo'], selectionMode: 'single'})
  )
  .add(
    'single default selected key (uncontrolled, static)',
    () => render(
      <Menu selectionMode="single" onAction={action('onAction')} defaultSelectedKeys={['2']}>
        <Section title="Section 1">
          <Item key="1">
            One
          </Item>
          <Item key="2">
            Two
          </Item>
          <Item key="3">
            Three
          </Item>
        </Section>
        <Section title="Section 2">
          <Item key="4">
            Four
          </Item>
          <Item key="5">
            Five
          </Item>
          <Item key="6">
            Six
          </Item>
          <Item key="7">
            Seven
          </Item>
        </Section>
      </Menu>
    )
  )
  .add(
    'single default selected key (uncontrolled, generative)',
    () => render(defaultMenu, {}, {defaultSelectedKeys: ['Kangaroo'], selectionMode: 'single'})
  )
  .add(
    'multiple default selected key (controlled, static)',
    () => render(
      <Menu onAction={action('onAction')} selectionMode="multiple" selectedKeys={['2', '5']} disabledKeys={['1', '3']}>
        <Section title="Section 1">
          <Item key="1">
            One
          </Item>
          <Item key="2">
            Two
          </Item>
          <Item key="3">
            Three
          </Item>
        </Section>
        <Section title="Section 2">
          <Item key="4">
            Four
          </Item>
          <Item key="5">
            Five
          </Item>
          <Item key="6">
            Six
          </Item>
        </Section>
      </Menu>
    )
  )
  .add(
    'multiple selected key (controlled, generative)',
    () => render(defaultMenu, {}, {selectedKeys: ['Kangaroo', 'Devon'], selectionMode: 'multiple'})
  )
  .add(
    'multiple default selected key (uncontrolled, static)',
    () => render(
      <Menu onAction={action('onAction')} selectionMode="multiple" defaultSelectedKeys={['2', '5']} disabledKeys={['1', '3']}>
        <Section title="Section 1">
          <Item key="1">
            One
          </Item>
          <Item key="2">
            Two
          </Item>
          <Item key="3">
            Three
          </Item>
        </Section>
        <Section title="Section 2">
          <Item key="4">
            Four
          </Item>
          <Item key="5">
            Five
          </Item>
          <Item key="6">
            Six
          </Item>
        </Section>
      </Menu>
    )
  )
  .add(
    'multiple default selected key (uncontrolled, generative)',
    () => render(defaultMenu, {}, {defaultSelectedKeys: ['Kangaroo', 'Devon'], selectionMode: 'multiple'})
  )
  .add(
    'Menu with autoFocus=true',
    () => render(defaultMenu, {}, {autoFocus: true})
  )
  .add(
    'Menu with autoFocus=false',
    () => render(defaultMenu, {}, {autoFocus: false})
  )
  .add(
    'Menu with autoFocus=true, default selected key (uncontrolled), selectionMode single',
    () => render(defaultMenu, {}, {autoFocus: true, selectionMode: 'single', defaultSelectedKeys: ['Kangaroo']})
  )
  .add(
    'Menu with autoFocus="first"',
    () => render(defaultMenu, {}, {autoFocus: 'first'})
  )
  .add(
    'Menu with autoFocus="last"',
    () => render(defaultMenu, {}, {autoFocus: 'last'})
  )
  .add(
    'Menu with keyboard selection wrapping false',
    () => render(defaultMenu, {}, {shouldFocusWrap: false})
  )
  .add(
    'align="end"',
    () => render(
      <Menu onAction={action('onAction')}>
        <Item>One</Item>
        <Item>Two</Item>
        <Item>Three</Item>
      </Menu>
    , {align: 'end'})
  )
  .add(
    'direction="top"',
    () => render(defaultMenu, {direction: 'top'})
  )
  .add(
    'shouldFlip',
    () => render(defaultMenu, {shouldFlip: true})
  )
  .add(
    'isOpen',
    () => render(defaultMenu, {isOpen: true})
  )
  .add(
    'defaultOpen',
    () => render(defaultMenu, {defaultOpen: true})
  )
  .add(
    'disabled button',
    () => render(defaultMenu, {isDisabled: true})
  )
  .add(
    'multiselect menu',
    () => render(defaultMenu, {}, {selectionMode: 'multiple'})
  )
  .add(
    'no selection allowed menu',
    () => render(defaultMenu, {}, {selectionMode: 'none'})
  )
  .add(
    'closeOnSelect=false',
    () => render(defaultMenu, {closeOnSelect: false}, {})
  )
  .add(
    'menu with semantic elements (static)',
    () => (
      <div style={{display: 'flex', width: 'auto', margin: '250px 0'}}>
        <MenuTrigger onOpenChange={action('onOpenChange')}>
          <ActionButton
            onPress={action('press')}
            onPressStart={action('pressstart')}
            onPressEnd={action('pressend')}>
            Menu Button
          </ActionButton>
          <Menu onAction={action('action')}>
            <Section title="Section 1">
              <Item textValue="Copy">
                <Copy size="S" />
                <Text>Copy</Text>
                <Keyboard>⌘C</Keyboard>
              </Item>
              <Item textValue="Cut">
                <Cut size="S" />
                <Text>Cut</Text>
                <Keyboard>⌘X</Keyboard>
              </Item>
              <Item textValue="Paste">
                <Paste size="S" />
                <Text>Paste</Text>
                <Keyboard>⌘V</Keyboard>
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
                <Text slot="end">Value</Text>
              </Item>
              <Item textValue="Floof">
                <AlignRight size="S" />
                <Text>Floof</Text>
              </Item>
              <Item>
                Basic Item
              </Item>
            </Section>
          </Menu>
        </MenuTrigger>
      </div>
    )
  )
  .add(
    'menu with semantic elements (generative)',
    () => render(
      <Menu items={hardModeProgrammatic} onAction={action('onAction')}>
        {item => (
          <Section key={item.name} items={item.children} title={item.name}>
            {item => customMenuItem(item)}
          </Section>
        )}
      </Menu>
    )
  )
  .add(
    'menu closes on scroll',
    () => (
      <div style={{height: 100, display: 'flex'}}>
        <div style={{paddingTop: 100, height: 100, overflow: 'auto', background: 'antiquewhite'}}>
          <div style={{height: 200}}>
            <div>Scrolling here will close the Menu</div>
            <MenuTrigger onOpenChange={action('onOpenChange')} defaultOpen>
              <ActionButton
                onPress={action('press')}
                onPressStart={action('pressstart')}
                onPressEnd={action('pressend')}>
                Menu Button
              </ActionButton>
              <Menu items={withSection} onAction={action('action')}>
                {item => (
                  <Section key={item.name} items={item.children} title={item.name}>
                    {item => <Item key={item.name} childItems={item.children}>{item.name}</Item>}
                  </Section>
                )}
              </Menu>
            </MenuTrigger>
          </div>
        </div>
        <div style={{paddingTop: 100, height: 100, overflow: 'auto', flex: 1, background: 'grey'}}>
          <div style={{height: 200}}>
            Scrolling here won't close the Menu
          </div>
        </div>
      </div>
    )
  )
  .add(
    'menu closes on blur',
    () => (
      <>
        <div style={{display: 'flex', width: 'auto', margin: '250px 0'}}>
          <input placeholder="Shift tab here" />
          <MenuTrigger onOpenChange={action('onOpenChange')}>
            <ActionButton
              onPress={action('press')}
              onPressStart={action('pressstart')}
              onPressEnd={action('pressend')}>
              Menu Button
            </ActionButton>
            <Menu items={withSection} onAction={action('action')} disabledKeys={['Snake', 'Ross']}>
              {item => (
                <Section key={item.name} items={item.children} title={item.name}>
                  {item => <Item key={item.name} childItems={item.children}>{item.name}</Item>}
                </Section>
              )}
            </Menu>
          </MenuTrigger>
          <input placeholder="Tab here" />
        </div>
      </>
    )
  )
  .add(
    'with falsy key',
    () => render(
      <Menu onAction={action('onAction')}>
        <Item key="1">One</Item>
        <Item key="">Two</Item>
        <Item key="3">Three</Item>
      </Menu>
    )
  )
  .add(
    'MenuTrigger with trigger="longPress"',
    () => (
      <>
        <div style={{display: 'flex', width: 'auto', margin: '250px 0'}}>
          <MenuTrigger onOpenChange={action('onOpenChange')} trigger="longPress">
            <ActionButton
              onPress={action('press')}
              onPressStart={action('pressstart')}
              onPressEnd={action('pressend')}>
              Menu Button
            </ActionButton>
            {defaultMenu}
          </MenuTrigger>
        </div>
      </>
    )
  );

let customMenuItem = (item) => {
  let Icon = iconMap[item.icon];
  return (
    <Item childItems={item.children} textValue={item.name} key={item.name}>
      {item.icon && <Icon size="S" />}
      <Text>{item.name}</Text>
      {item.shortcut && <Keyboard>{item.shortcut}</Keyboard>}
    </Item>
  );
};

function render(menu, {isDisabled, ...props}: any = {}, menuProps = {}) {
  let menuRender = React.cloneElement(menu, menuProps);
  return (
    <div style={{display: 'flex', width: 'auto', margin: '250px 0'}}>
      <MenuTrigger onOpenChange={action('onOpenChange')} {...props}>
        <ActionButton
          isDisabled={isDisabled}
          onPress={action('press')}
          onPressStart={action('pressstart')}
          onPressEnd={action('pressend')}>
          Menu Button
        </ActionButton>
        {menuRender}
      </MenuTrigger>
    </div>
  );
}

let defaultMenu = (
  <Menu items={withSection} onAction={action('action')} disabledKeys={['Snake', 'Ross']}>
    {(item: any) => (
      <Section key={item.name} items={item.children} title={item.name}>
        {(item: any) => <Item key={item.name} childItems={item.children}>{item.name}</Item>}
      </Section>
    )}
  </Menu>
);
