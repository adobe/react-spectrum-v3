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
import {Color, SpectrumColorFieldProps} from '@react-types/color';
import {ColorField} from '../';
import {ComponentMeta, ComponentStoryObj} from '@storybook/react';
import {Content} from '@react-spectrum/view';
import {ContextualHelp} from '@react-spectrum/contextualhelp';
import {Flex} from '@react-spectrum/layout';
import {Heading} from '@react-spectrum/text';
import {parseColor} from '@react-stately/color';
import React, {useState} from 'react';
import {useId} from '@react-aria/utils';
import {View} from '@react-spectrum/view';
import {VisuallyHidden} from '@react-aria/visually-hidden';

export default {
  title: 'ColorField',
  component: ColorField,
  argTypes: {
    onChange: {
      action: 'change'
    }
  },
  args: {
    allowsAlpha: false,
    isQuiet: false,
    isReadOnly: false,
    isDisabled: false
  }
} as ComponentMeta<typeof ColorField>;

export type ColorFieldStory = ComponentStoryObj<typeof ColorField>;

export const Default: ColorFieldStory = {
  args: {label: 'Primary Color'}
};

export const DefaultValue: ColorFieldStory = {
  args: {...Default.args, defaultValue: '#abcdef'},
  name: 'has default value'
};

export const Value: ColorFieldStory = {
  args: {...Default.args, value: '#FF00AA'},
  name: 'value'
};

export const ValidationStateValid: ColorFieldStory = {
  args: {...Default.args, validationState: 'valid'},
  name: 'validationState valid'
};

export const ValidationStateInvalid: ColorFieldStory = {
  args: {...Default.args, validationState: 'invalid'},
  name: 'validationState invalid'
};

export const RequiredLabelOptional: ColorFieldStory = {
  args: {...Default.args},
  render: (args) => (
    <Flex direction="column" gap="size-100">
      {render({...args, isRequired: 'true'})}
      {render({...args, isRequired: 'true', necessityIndicator: 'label'})}
      {render({...args, necessityIndicator: 'label'})}
    </Flex>
  ),
  name: 'required, label, optional'
};

export const ControlledValue: ColorFieldStory = {
  args: {...Default.args},
  render: (args) => (
    <ControlledColorField
      {...args}
      value={parseColor('#FF00AA')} />
  ),
  name: 'controlled value'
};

export const AutoFocus: ColorFieldStory = {
  args: {...Default.args, autoFocus: true},
  name: 'autofocus'
};

export const LabelSide: ColorFieldStory = {
  args: {...Default.args, labelPosition: 'side'},
  name: 'label side'
};

export const NoVisibleLabel: ColorFieldStory = {
  args: {isRequired: true, 'aria-label': 'Primary Color'},
  name: 'no visible label'
};

export const LabelledBy: ColorFieldStory = {
  args: {},
  render: (args) => (
    <>
      <label htmlFor="colorfield" id="label">Primary Color</label>
      {renderNoLabel({...args, isRequired: true, id: 'colorfield', 'aria-labelledby': 'label'})}
    </>
  ),
  name: 'aria-labelledby'
};

export const ContextualHelpStory: ColorFieldStory = {
  args: {
    ...Default.args,
    contextualHelp: (
      <ContextualHelp>
        <Heading>What is a segment?</Heading>
        <Content>Segments identify who your visitors are, what devices and services they use, where they navigated from, and much more.</Content>
      </ContextualHelp>
    )
  },
  name: 'contextual help'
};


export const CustomWidth: ColorFieldStory = {
  args: {...Default.args, width: 'size-3000'},
  name: 'custom width'
};

export const CustomWidthNoVisibleLabel: ColorFieldStory = {
  args: {...NoVisibleLabel.args, width: 'size-3000'},
  name: 'custom width no visible label'
};

export const CustomWidthLabelPositionSide: ColorFieldStory = {
  args: {...Default.args, width: 'size-3000', labelPosition: 'side'},
  name: 'custom width, labelPosition=side'
};

export const CustomWidth10pxMin: ColorFieldStory = {
  args: {...Default.args},
  render: (args) => (
    <Flex direction="column" gap="size-100">
      {render({...args, width: '10px'})}
      <div style={{width: '10px'}}>
        {render(args)}
      </div>
    </Flex>
  ),
  name: 'custom width, 10px for min-width'
};


function ControlledColorField(props: SpectrumColorFieldProps) {
  let [color, setColor] = useState<string | Color | null | undefined>(props.value);
  let onChange = (color: Color | null) => {
    setColor(color);
    if (props.onChange) { props.onChange(color); }
  };
  let style = color ? {backgroundColor: color.toString('rgb')} : {};
  let id = useId();
  return (
    <Flex direction="row" gap="size-100" alignItems="end">
      <ColorField
        id={id}
        label="Primary Color"
        onChange={onChange}
        value={color} />
      <View width="size-400" height="size-400" UNSAFE_style={style}>
        <VisuallyHidden>
          <output htmlFor={id} aria-live="off">
            {color ? color.toString('hex') : ''}
          </output>
        </VisuallyHidden>
      </View>
    </Flex>
  );
}

function render(props: any = {}) {
  return (
    <ColorField
      label="Primary Color"
      onChange={action('change')}
      {...props} />
  );
}

function renderNoLabel(props: any = {}) {
  return (
    <ColorField {...props} onChange={action('onChange')} />
  );
}
