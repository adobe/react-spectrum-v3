/*************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 * Copyright 2024 Adobe
 * All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 **************************************************************************/

import Bell from '../s2wf-icons/S2_Icon_Bell_20_N.svg';
import Heart from '../s2wf-icons/S2_Icon_Heart_20_N.svg';
import type {Meta, StoryObj} from '@storybook/react';
import {SelectBox} from '../src/SelectBox';
import {SelectBoxGroup} from '../src/SelectBoxGroup';
import {Text} from '../src';

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
          <Bell />
          <Text slot="label">Bells</Text>
        </SelectBox>
        <SelectBox value="Heart">
          <Heart />
          <Text slot="label">Heart</Text>
        </SelectBox>
      </SelectBoxGroup>
    );
  },
  args: {
    label: 'Select an icon'
  }
};
