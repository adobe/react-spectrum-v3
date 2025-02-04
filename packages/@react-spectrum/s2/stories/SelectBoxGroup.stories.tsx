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

import type {Meta, StoryObj} from '@storybook/react';
import {SelectBox, SelectBoxGroup, Text} from '../src';
import Server from '../spectrum-illustrations/linear/Server';

const meta: Meta<typeof SelectBoxGroup> = {
  component: SelectBoxGroup,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    onChange: {table: {category: 'Events'}},
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical']
    },
    selectionMode: {
      control: 'radio',
      options: ['single', 'multiple']
    }
  },
  title: 'SelectBoxGroup'
};

export default meta;

type Story = StoryObj<typeof SelectBoxGroup>;

export const Example: Story = {
  render(args) {
    return (
      <SelectBoxGroup {...args}>
        <SelectBox value="Bells">
          <Server />
          <Text slot="label">Bells</Text>
        </SelectBox>
        <SelectBox value="Heart">
          <Server />
          <Text slot="label">Select box label</Text>
          <Text slot="description">A description that explains more context and details, to supplement the message of the label.</Text>
        </SelectBox>
      </SelectBoxGroup>
    );
  },
  args: {
    label: 'Select an icon'
  }
};

export const LongTitleManyItems: Story = {
  render(args) {
    return (
      <SelectBoxGroup {...args}>
        <SelectBox value="one">
          <Server />
          <Text slot="label">Bells</Text>
        </SelectBox>
        <SelectBox value="two">
          <Server />
          <Text slot="label">This is a long title that will wrap and shouldn't cause any issues</Text>
          <Text slot="description">A description that explains more context and details, to supplement the message of the label. This shouldn't be very long like this or cause any wrapping or height issues.</Text>
        </SelectBox>
        <SelectBox value="three">
          <Server />
          <Text slot="label">Bells</Text>
        </SelectBox>
        <SelectBox value="four">
          <Server />
          <Text slot="label">Bells</Text>
        </SelectBox>
        <SelectBox value="five">
          <Server />
          <Text slot="label">Bells</Text>
        </SelectBox>
        <SelectBox value="size">
          <Server />
          <Text slot="label">Bells</Text>
        </SelectBox>
        <SelectBox value="seven">
          <Server />
          <Text slot="label">Bells</Text>
        </SelectBox>
        <SelectBox value="eight">
          <Server />
          <Text slot="label">Bells</Text>
        </SelectBox>
        <SelectBox value="nine">
          <Server />
          <Text slot="label">Select box label</Text>
          <Text slot="description">A description that explains more context and details, to supplement the message of the label.</Text>
        </SelectBox>
      </SelectBoxGroup>
    );
  },
  args: {
    label: 'Select an icon'
  }
};
