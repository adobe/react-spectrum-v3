/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {ActionMenu, Item} from '@react-spectrum/menu';
import {Button} from '@react-spectrum/button';
import {Card, CardView, GalleryLayout, GridLayout, WaterfallLayout} from '../';
import {Content, Footer} from '@react-spectrum/view';
import {Heading, Text} from '@react-spectrum/text';
import {Image} from '@react-spectrum/image';
import {Meta, Story} from '@storybook/react';
import React, {useMemo} from 'react';
import {SpectrumCardViewProps} from '@react-types/cards';
import {useCollator} from '@react-aria/i18n';

const meta: Meta<SpectrumCardViewProps<object>> = {
  title: 'CardView'
};

export default meta;

let itemsLowVariance = [
  {width: 1001, height: 381, src: 'https://i.imgur.com/Z7AzH2c.jpg', id: 1, title: 'Bob 1'},
  {width: 640, height: 640, src: 'https://i.imgur.com/DhygPot.jpg', id: 2, title: 'Joe 1'},
  {width: 314, height: 1009, src: 'https://i.imgur.com/3lzeoK7.jpg', id: 3, title: 'Jane 1'},
  {width: 1516, height: 1009, src: 'https://i.imgur.com/1nScMIH.jpg', id: 4, title: 'Bob 2'},
  {width: 640, height: 640, src: 'https://i.imgur.com/DhygPot.jpg', id: 5, title: 'Joe 2'},
  {width: 1516, height: 1009, src: 'https://i.imgur.com/1nScMIH.jpg', id: 6, title: 'Jane 2'},
  {width: 1001, height: 381, src: 'https://i.imgur.com/Z7AzH2c.jpg', id: 7, title: 'Bob 3'},
  {width: 314, height: 1009, src: 'https://i.imgur.com/3lzeoK7.jpg', id: 8, title: 'Joe 3'},
  {width: 314, height: 1009, src: 'https://i.imgur.com/3lzeoK7.jpg', id: 9, title: 'Jane 3'},
  {width: 1516, height: 1009, src: 'https://i.imgur.com/1nScMIH.jpg', id: 10, title: 'Bob 4'},
  {width: 314, height: 1009, src: 'https://i.imgur.com/3lzeoK7.jpg', id: 11, title: 'Joe 4'},
  {width: 1001, height: 381, src: 'https://i.imgur.com/Z7AzH2c.jpg', id: 12, title: 'Jane 4'},
  {width: 314, height: 1009, src: 'https://i.imgur.com/3lzeoK7.jpg', id: 13, title: 'Bob 5'},
  {width: 1516, height: 1009, src: 'https://i.imgur.com/1nScMIH.jpg', id: 14, title: 'Joe 5'},
  {width: 314, height: 1009, src: 'https://i.imgur.com/3lzeoK7.jpg', id: 15, title: 'Jane 5'},
  {width: 1516, height: 1009, src: 'https://i.imgur.com/1nScMIH.jpg', id: 16, title: 'Bob 6'},
  {width: 314, height: 1009, src: 'https://i.imgur.com/3lzeoK7.jpg', id: 17, title: 'Joe 6'},
  {width: 640, height: 640, src: 'https://i.imgur.com/DhygPot.jpg', id: 18, title: 'Jane 6'},
  {width: 314, height: 1009, src: 'https://i.imgur.com/3lzeoK7.jpg', id: 19, title: 'Bob 7'},
  {width: 1001, height: 381, src: 'https://i.imgur.com/Z7AzH2c.jpg', id: 20, title: 'Joe 7'},
  {width: 1516, height: 1009, src: 'https://i.imgur.com/1nScMIH.jpg', id: 21, title: 'Jane 7'},
  {width: 314, height: 1009, src: 'https://i.imgur.com/3lzeoK7.jpg', id: 22, title: 'Bob 8'}
];

function DynamicCardView(props: SpectrumCardViewProps<object>) {
  let collator = useCollator({usage: 'search', sensitivity: 'base'});
  let gridLayout = useMemo(() => new GridLayout({collator}), [collator]);
  let {
    layout = gridLayout,
    items
  } = props;

  return (
    <CardView {...props} items={items} layout={layout} width="800px" height="800px" UNSAFE_style={{background: 'white'}} aria-label="Test CardView" selectionMode="multiple">
      {(item: any) => (
        <Card key={item.title} textValue={item.title} width={item.width} height={item.height}>
          <Image src={item.src} />
          <Heading>{item.title}</Heading>
          <Text slot="detail">PNG</Text>
          <Content>Description</Content>
          <ActionMenu>
            <Item>Action 1</Item>
            <Item>Action 2</Item>
          </ActionMenu>
          <Footer>
            <Button variant="primary">Something</Button>
          </Footer>
        </Card>
      )}
    </CardView>
  );
}

const Template = (): Story<SpectrumCardViewProps<object>> => (props) => <DynamicCardView {...props} />;


export const DefaultGrid = Template().bind({});
DefaultGrid.args = {items: itemsLowVariance};

export const DefaultGallery = Template().bind({});
DefaultGallery.args = {items: itemsLowVariance, layout: GalleryLayout};

export const DefaultWaterfall = Template().bind({});
DefaultWaterfall.args = {items: itemsLowVariance, layout: WaterfallLayout};
