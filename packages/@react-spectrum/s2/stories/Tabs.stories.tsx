/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import Bell from '../s2wf-icons/S2_Icon_Bell_20_N.svg';
import {Collection, Text} from '@react-spectrum/s2';
import Edit from '../s2wf-icons/S2_Icon_Edit_20_N.svg';
import Heart from '../s2wf-icons/S2_Icon_Heart_20_N.svg';
import type {Meta} from '@storybook/react';
import {style} from '../style' with { type: 'macro' };
import {Tab, TabList, TabPanel, Tabs} from '../src/Tabs';

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  title: 'Tabs'
};

export default meta;

export const Example = (args: any) => (
  <div className={style({width: '[450px]', height: 256, resize: 'horizontal', overflow: 'hidden', padding: 8})}>
    <Tabs {...args} styles={style({width: 'full'})}>
      <TabList aria-label="History of Ancient Rome">
        <Tab id="FoR" data-tab><Edit /><Text>Founding of Rome</Text></Tab>
        <Tab id="MaR" data-tab>Monarchy and Republic</Tab>
        <Tab id="Emp" data-tab>Empire</Tab>
      </TabList>
      <TabPanel id="FoR" UNSAFE_style={{display: 'flex'}} data-panel>
        <div style={{overflow: 'auto'}}>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum non rutrum augue, a dictum est. Sed ultricies vel orci in blandit. Morbi sed tempor leo. Phasellus et sollicitudin nunc, a volutpat est. In volutpat molestie velit, nec rhoncus felis vulputate porttitor. In efficitur nibh tortor, maximus imperdiet libero sollicitudin sed. Pellentesque dictum, quam id scelerisque rutrum, lorem augue suscipit est, nec ultricies ligula lorem id dui. Cras lacus tortor, fringilla nec ligula quis, semper imperdiet ex.</p>
        </div>
      </TabPanel>
      <TabPanel id="MaR" UNSAFE_style={{display: 'flex'}} data-panel>
        <div style={{overflow: 'auto'}}>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut vulputate justo. Suspendisse potenti. Nunc id fringilla leo, at luctus quam. Maecenas et ipsum nisi. Curabitur in porta purus, a pretium est. Fusce eu urna diam. Sed nunc neque, consectetur ut purus nec, consequat elementum libero. Sed ut diam in quam maximus condimentum at non erat. Vestibulum sagittis rutrum velit, vitae suscipit arcu. Nulla ac feugiat ante, vitae laoreet ligula. Maecenas sed molestie ligula. Nulla sed fringilla ex. Nulla viverra tortor at enim condimentum egestas. Nulla sed tristique sapien. Integer ligula quam, vulputate eget mollis eu, interdum sit amet justo.</p>
          <p>Vivamus dignissim tortor ut sapien congue tristique. Sed ac aliquet mauris. Nulla metus dui, elementum sit amet luctus eu, condimentum id elit. Praesent id nibh sed ligula congue venenatis. Pellentesque urna turpis, eleifend id pellentesque a, auctor nec neque. Vestibulum ipsum mauris, rutrum sit amet magna et, aliquet mollis tellus. Pellentesque nec ultricies nibh, at tempus massa. Phasellus dictum turpis et interdum scelerisque. Aliquam fermentum tincidunt ipsum sit amet suscipit. Fusce non dui sed diam lacinia mattis fermentum eu urna. Cras pretium id nunc in elementum. Mauris laoreet odio vitae laoreet dictum. In non justo nec nunc vehicula posuere non non ligula. Nullam eleifend scelerisque nibh, in sollicitudin tortor ullamcorper vel. Praesent sagittis risus in erat dignissim, non lacinia elit efficitur. Quisque maximus nulla vel luctus pharetra.</p>
        </div>
      </TabPanel>
      <TabPanel id="Emp" UNSAFE_style={{display: 'flex'}} data-panel>
        <div style={{overflow: 'auto'}}>
          <p>Alea jacta est.</p>
        </div>
      </TabPanel>
    </Tabs>
  </div>
);

export const Disabled = (args: any) => (
  <Tabs {...args} styles={style({width: '[450px]', height: 144})} disabledKeys={['FoR', 'MaR', 'Emp']}>
    <TabList aria-label="History of Ancient Rome">
      <Tab id="FoR"><Edit /><Text>Founding of Rome</Text></Tab>
      <Tab id="MaR">Monarchy and Republic</Tab>
      <Tab id="Emp">Empire</Tab>
    </TabList>
    <TabPanel id="FoR">
      Arma virumque cano, Troiae qui primus ab oris.
    </TabPanel>
    <TabPanel id="MaR">
      Senatus Populusque Romanus.
    </TabPanel>
    <TabPanel id="Emp">
      Alea jacta est.
    </TabPanel>
  </Tabs>
);

export const Icons = (args: any) => (
  <Tabs {...args} styles={style({width: 208, height: 144})}>
    <TabList aria-label="History of Ancient Rome">
      <Tab id="FoR" aria-label="Edit"><Edit /></Tab>
      <Tab id="MaR" aria-label="Notifications"><Bell /></Tab>
      <Tab id="Emp" aria-label="Likes"><Heart /></Tab>
    </TabList>
    <TabPanel id="FoR">
      Arma virumque cano, Troiae qui primus ab oris.
    </TabPanel>
    <TabPanel id="MaR">
      Senatus Populusque Romanus.
    </TabPanel>
    <TabPanel id="Emp">
      Alea jacta est.
    </TabPanel>
  </Tabs>
);

interface Item {
  id: number,
  title: string,
  description: string
}
let items: Item[] = [
  {id: 1, title: 'Mouse settings', description: 'Adjust the sensitivity and speed of your mouse.'},
  {id: 2, title: 'Keyboard settings', description: 'Customize the layout and function of your keyboard.'},
  {id: 3, title: 'Gamepad settings', description: 'Configure the buttons and triggers on your gamepad.'}
];

export const Dynamic = (args: any) => (
  <Tabs {...args} styles={style({width: '[450px]', height: 256})}>
    <TabList aria-label="History of Ancient Rome" items={items}>
      {item => <Tab>{item.title}</Tab>}
    </TabList>
    <Collection items={items}>
      {item => (
        <TabPanel>
          {item.description}
        </TabPanel>
      )}
    </Collection>
  </Tabs>
);
