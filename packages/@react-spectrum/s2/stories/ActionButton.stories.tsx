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

import {ActionButton, Avatar, Text} from '../src';
import {categorizeArgTypes, StaticColorDecorator} from './utils';
import type {Meta, StoryObj} from '@storybook/react';
import NewIcon from '../s2wf-icons/S2_Icon_New_20_N.svg';
import {style} from '../style' with { type: 'macro' };
import './unsafe.css';

const meta: Meta<typeof ActionButton> = {
  component: ActionButton,
  parameters: {
    layout: 'centered'
  },
  decorators: [StaticColorDecorator],
  tags: ['autodocs'],
  argTypes: {
    ...categorizeArgTypes('Events', ['onPress', 'onPressChange', 'onPressEnd', 'onPressStart', 'onPressUp'])
  },
  title: 'ActionButton'
};

export default meta;

type Story = StoryObj<typeof ActionButton>;
export const Example: Story = {
  render: (args) => {
    return (
      <div style={{display: 'flex', gap: 8, padding: 8, justifyContent: 'center', overflow: 'auto'}}>
        <ActionButton aria-label="Press me" {...args}><NewIcon /></ActionButton>
        <ActionButton {...args}>Press me</ActionButton>
        <ActionButton {...args}><NewIcon /><Text>Press me</Text></ActionButton>
        <ActionButton {...args}><Text>Press me</Text><NewIcon /></ActionButton>
      </div>
    );
  }
};

export const ResizingExample: Story = {
  render: (args) => {
    return (
      <div className={style({display: 'flex', gap: 8, justifyContent: 'center', resize: 'horizontal', overflow: 'auto'})}>
        <ActionButton aria-label="Press me" {...args}><NewIcon /></ActionButton>
        <ActionButton {...args}>Press me</ActionButton>
        <ActionButton {...args}><NewIcon /><Text>Press me</Text></ActionButton>
        <ActionButton {...args}><Text>Press me</Text><NewIcon /></ActionButton>
      </div>
    );
  },
  parameters: {
    docs: {
      disable: true
    }
  }
};

const messages = {
  'ar-AR': {
    'button': 'يحرر',
    'copy': 'ينسخ',
    'cut': 'يقطع',
    'paste': 'معجون'
  },
  'en-US': {
    'button': 'Edit',
    'copy': 'Copy',
    'cut': 'Cut',
    'paste': 'Paste'
  },
  'he-IL': {
    'button': 'לַעֲרוֹך',
    'copy': 'עותק',
    'cut': 'גזירה',
    'paste': 'לְהַדבִּיק'
  },
  'ja-JP': {
    'button': '編集',
    'copy': 'コピー',
    'cut': '切る',
    'paste': 'ペースト'
  },
  'ko-KR': {
    'button': '편집하다',
    'copy': '복사',
    'cut': '자르다',
    'paste': '반죽'
  },
  'zh-CN': {
    'button': '编辑',
    'copy': '复制',
    'cut': '切',
    'paste': '粘贴'
  },
  'zh-TW': {
    'button': '編輯',
    'copy': '複製',
    'cut': '切',
    'paste': '粘貼'
  }
};

export const Fonts: Story = {
  render(args) {
    return (
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, auto)', alignItems: 'center', justifyItems: 'start', gap: 8}}>
        <div lang="en-US" style={{display: 'contents'}}>
          English (adobe-clean-vf)
          <ActionButton {...args}><NewIcon /><Text>{messages['en-US'].button}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['en-US'].copy}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['en-US'].cut}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['en-US'].paste}</Text></ActionButton>
        </div>
        <div lang="ar-AR" dir="rtl" style={{display: 'contents'}}>
          Arabic (myriad-arabic)
          <ActionButton {...args}><NewIcon /><Text>{messages['ar-AR'].button}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['ar-AR'].copy}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['ar-AR'].cut}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['ar-AR'].paste}</Text></ActionButton>
        </div>
        <div lang="he-IL" dir="rtl" style={{display: 'contents'}}>
          Hebrew (myriad-hebrew)
          <ActionButton {...args}><NewIcon /><Text>{messages['he-IL'].button}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['he-IL'].copy}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['he-IL'].cut}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['he-IL'].paste}</Text></ActionButton>
        </div>
        <div lang="ja-JP" style={{display: 'contents'}}>
          Japanese (adobe-clean-han-japanese)
          <ActionButton {...args}><NewIcon /><Text>{messages['ja-JP'].button}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['ja-JP'].copy}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['ja-JP'].cut}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['ja-JP'].paste}</Text></ActionButton>
        </div>
        <div lang="ko-KR" style={{display: 'contents'}}>
          Korean (adobe-clean-han-korean)
          <ActionButton {...args}><NewIcon /><Text>{messages['ko-KR'].button}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['ko-KR'].copy}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['ko-KR'].cut}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['ko-KR'].paste}</Text></ActionButton>
        </div>
        <div lang="zh-Hans" style={{display: 'contents'}}>
          Simplified Chinese (adobe-clean-han-simplified-c)
          <ActionButton {...args}><NewIcon /><Text>{messages['zh-CN'].button}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['zh-CN'].copy}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['zh-CN'].cut}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['zh-CN'].paste}</Text></ActionButton>
        </div>
        <div lang="zh-Hant" style={{display: 'contents'}}>
          Traditional Chinese (adobe-clean-han-traditional)
          <ActionButton {...args}><NewIcon /><Text>{messages['zh-TW'].button}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['zh-TW'].copy}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['zh-TW'].cut}</Text></ActionButton>
          <ActionButton {...args}><NewIcon /><Text>{messages['zh-TW'].paste}</Text></ActionButton>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      disable: true
    }
  }
};

export const UnsafeClassName: Story = {
  render: (args) => {
    return (
      <div className={style({display: 'flex', gap: 8, justifyContent: 'center', overflow: 'auto'})}>
        <ActionButton {...args} UNSAFE_className="unsafe2">UNSAFE_className works</ActionButton>
      </div>
    );
  },
  parameters: {
    docs: {
      disable: true
    }
  }
};

export const Avatars: Story = {
  render: (args) => {
    return (
      <div style={{display: 'flex', gap: 8, padding: 8, justifyContent: 'center', overflow: 'auto'}}>
        <ActionButton aria-label="Press me" {...args}><Avatar src="https://i.imgur.com/xIe7Wlb.png" /></ActionButton>
        <ActionButton {...args}><Avatar src="https://i.imgur.com/xIe7Wlb.png" /><Text>Press me</Text></ActionButton>
        <ActionButton {...args}><Text>Press me</Text><Avatar src="https://i.imgur.com/xIe7Wlb.png" /></ActionButton>
      </div>
    );
  }
};
