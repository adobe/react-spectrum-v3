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
import {Card} from '../';
import {Content} from '@react-spectrum/view';
import {
  Default,
  DefaultSquare,
  DefaultTall,
  LongContent,
  LongDetail,
  LongTitle,
  NoActionMenu,
  NoDescription,
  NoDescriptionSquare,
  WithIllustration
} from './Card.stories';
import {getImage} from './utils';
import {Heading, Text} from '@react-spectrum/text';
import {Image} from '@react-spectrum/image';
import {Meta, Story} from '@storybook/react';
import React from 'react';
import {SpectrumCardProps} from '@react-types/cards';


const meta: Meta<SpectrumCardProps> = {
  title: 'Card/horizontal',
  component: Card
};

export default meta;


const Template = (): Story<SpectrumCardProps> => (args) => (
  <div style={{height: '90px'}}>
    <Card {...args} />
  </div>
);

export const Horizontal = Template().bind({});
Horizontal.args = {...Default.args, orientation: 'horizontal'};

export const HorizontalSquare = Template().bind({});
HorizontalSquare.args = {...Horizontal.args, ...DefaultSquare.args};

export const HorizontalTall = Template().bind({});
HorizontalTall.args = {...Horizontal.args, ...DefaultTall.args};

export const HorizontalNoDescription = Template().bind({});
HorizontalNoDescription.args = {...Horizontal.args, ...NoDescription.args};

export const HorizontalNoDescriptionSquare = Template().bind({});
HorizontalNoDescriptionSquare.args = {...Horizontal.args, ...NoDescriptionSquare.args};

export const HorizontalNoActionMenu = Template().bind({});
HorizontalNoActionMenu.args = {...Horizontal.args, ...NoActionMenu.args};

export const HorizontalWithIllustration = Template().bind({});
HorizontalWithIllustration.args = {...Horizontal.args, ...WithIllustration.args};

export const HorizontalLongTitle = Template().bind({});
HorizontalLongTitle.args = {...Horizontal.args, ...LongTitle.args};

export const HorizontalLongDescription = Template().bind({});
HorizontalLongDescription.args = {...Horizontal.args, ...LongContent.args};

export const HorizontalLongDetail = Template().bind({});
HorizontalLongDetail.args = {...Horizontal.args, ...LongDetail.args};

export const CardGrid = (props: SpectrumCardProps) => (
  <div
    style={{
      width: '100%',
      margin: '50px',
      display: 'grid',
      gap: '20px',
      gridTemplateColumns: 'repeat(auto-fit, 360px)',
      gridAutoRows: '104px'
    }}>
    {
      (new Array(15).fill(0)).map((_, index) => {
        let url = getImage(index);
        return (
          <Card {...Horizontal.args} {...props} layout="grid" key={`${index}${url}`}>
            <Image src={url} />
            <Heading>Title {index}</Heading>
            <Text slot="detail">PNG</Text>
            <Content>Description</Content>
            <ActionMenu>
              <Item>Action 1</Item>
              <Item>Action 2</Item>
            </ActionMenu>
          </Card>
        );
      })
    }
  </div>
);


export const CardFloat = (props: SpectrumCardProps) => (
  <div
    style={{
      width: '100%',
      margin: '50px'
    }}>
    {
      (new Array(15).fill(0)).map((_, index) => {
        let url = getImage(index);
        return (
          <div style={{float: 'left', margin: '10px'}}>
            <Card {...Horizontal.args} {...props} key={`${index}${url}`}>
              <Image src={url} />
              <Heading>Title {index}</Heading>
              <Text slot="detail">PNG</Text>
              <Content>Description</Content>
              <ActionMenu>
                <Item>Action 1</Item>
                <Item>Action 2</Item>
              </ActionMenu>
            </Card>
          </div>
        );
      })
    }
  </div>
);

export const CardGridTall = (props: SpectrumCardProps) => (
  <div
    style={{
      width: '100%',
      margin: '50px',
      display: 'grid',
      gap: '20px',
      gridTemplateColumns: 'repeat(auto-fit, 360px)',
      gridAutoRows: '150px'
    }}>
    {
      (new Array(15).fill(0)).map((_, index) => {
        let url = getImage(index);
        return (
          <Card {...Horizontal.args} {...props} layout="grid" key={`${index}${url}`}>
            <Image src={url} />
            <Heading>Title {index}</Heading>
            <Text slot="detail">PNG</Text>
            <Content>Description</Content>
            <ActionMenu>
              <Item>Action 1</Item>
              <Item>Action 2</Item>
            </ActionMenu>
          </Card>
        );
      })
    }
  </div>
);
