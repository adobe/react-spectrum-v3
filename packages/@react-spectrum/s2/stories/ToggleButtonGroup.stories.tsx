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

import Bold from '../s2wf-icons/S2_Icon_TextBold_20_N.svg';
import {categorizeArgTypes, StaticColorDecorator} from './utils';
import Italic from '../s2wf-icons/S2_Icon_TextItalic_20_N.svg';
import type {Meta, StoryFn} from '@storybook/react';
import {style} from '../style' with {type: 'macro'};
import {Text, ToggleButton, ToggleButtonGroup} from '../src';
import Underline from '../s2wf-icons/S2_Icon_TextUnderline_20_N.svg';

const meta: Meta<typeof ToggleButtonGroup> = {
  component: ToggleButtonGroup,
  parameters: {
    layout: 'centered'
  },
  decorators: [StaticColorDecorator],
  tags: ['autodocs'],
  argTypes: {
    ...categorizeArgTypes('Events', ['onSelectionChange'])
  },
  title: 'ToggleButtonGroup'
};

export default meta;

let justifiedStyle = style({
  width: {
    default: '[500px]',
    orientation: {
      vertical: 'auto'
    }
  },
  height: {
    orientation: {
      vertical: '[500px]'
    }
  }
});

export const Example: StoryFn<typeof ToggleButtonGroup> = (args) => (
  <ToggleButtonGroup {...args} styles={args.isJustified ? justifiedStyle(args) : undefined}>
    <ToggleButton value={1}><Bold /><Text slot="label">Bold</Text></ToggleButton>
    <ToggleButton value={2}><Italic /><Text slot="label">Italic</Text></ToggleButton>
    <ToggleButton value={3}><Underline /><Text slot="label">Underline</Text></ToggleButton>
  </ToggleButtonGroup>
);

export const IconOnly: StoryFn<typeof ToggleButtonGroup> = (args) => (
  <ToggleButtonGroup {...args} styles={args.isJustified ? justifiedStyle(args) : undefined}>
    <ToggleButton value={1}><Bold /></ToggleButton>
    <ToggleButton value={2}><Italic /></ToggleButton>
    <ToggleButton value={3}><Underline /></ToggleButton>
  </ToggleButtonGroup>
);
