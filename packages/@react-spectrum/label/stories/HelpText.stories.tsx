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
import {ComponentMeta, ComponentStoryObj} from '@storybook/react';
import {Flex} from '@react-spectrum/layout';
import {Radio, RadioGroup} from '@react-spectrum/radio';
import React, {useState} from 'react';
import {SpectrumTextFieldProps} from '@react-types/textfield';
import {TextField} from '@react-spectrum/textfield';

type HelpTextStory = ComponentStoryObj<typeof TextField>;

const argTypes = {
  label: {
    control: 'text'
  },
  description: {
    control: 'text'
  },
  errorMessage: {
    control: 'text'
  },
  validationState: {
    control: 'radio',
    options: ['invalid', 'valid']
  },
  isDisabled: {
    control: 'boolean'
  },
  labelAlign: {
    control: 'radio',
    options: ['end', 'start']
  },
  labelPosition: {
    control: 'radio',
    options: ['side', 'top']
  },
  width: {
    control: 'radio',
    options: ['100px', '440px', 'var(--spectrum-global-dimension-top, var(--spectrum-alias-top))']
  }
};

export default {
  title: 'HelpText',
  component: TextField,
  args: {
    label: 'Password',
    description: 'Password must be at least 8 characters.'
  },
  argTypes: argTypes
} as ComponentMeta<typeof TextField>;

export let Default: HelpTextStory = {};

export let WithState: HelpTextStory = {
  args: {
    label: 'Empty field',
    description: 'This input is only valid when it\'s empty.',
    errorMessage: 'Remove input.'
  },
  argTypes: {validationState: {control: {disable: true}}},
  render: (props) => <TextFieldWithValidationState {...props} />
};

export let AriaLabel: HelpTextStory = {
  args: {
    label: null,
    'aria-label': 'Password'
  },
  argTypes: {
    label: {
      control: {disable: true}
    },
    'aria-label': {
      control: 'text'
    }
  }
};

export const DescriptionAndCustomDescription = {
  args: {
    customDescription: 'Custom description.',
    'aria-describedby': 'custom-description'
  },
  argTypes: {
    customDescription: {
      control: 'text'
    },
    'aria-describedby': {control: {disable: true}}
  },
  decorators: [(Story, Context) => (
    <Flex direction="column" gap="size-125">
      <Story />
      <p id={Context.args['aria-describedby']}>{Context.args.customDescription}</p>
    </Flex>
  )]
};

export let AriaLabelWithDynamicHelpText: HelpTextStory = {
  args: {
    label: null,
    'aria-label': 'Password',
    description: undefined
  },
  render: (props) => <TextFieldWithAriaLabelAndDynamicHelpText {...props} />,
  parameters: {description: {data: 'For the case when there is no label and help text is added or removed dynamically. Focus should remain in the text field as the user types and the help text gets added or removed.'}}
};

function TextFieldWithValidationState(props: SpectrumTextFieldProps) {
  let [value, setValue] = useState('');
  let [valid, setValid] = useState<string | number | undefined>(undefined);

  let validState;
  if (value.length) {
    validState = 'invalid';
  } else if (valid === 'valid') {
    validState = 'valid';
  } else {
    validState = undefined;
  }

  return (
    <Flex
      direction="column"
      gap="size-200">
      <TextField
        {...props}
        value={value}
        onChange={setValue}
        validationState={validState} />
      <RadioGroup
        label="Valid State"
        value={valid ? valid : ''}
        onChange={setValid}>
        <Radio value="valid">Valid</Radio>
        <Radio value="">undefined</Radio>
      </RadioGroup>
    </Flex>
  );
}

function TextFieldWithAriaLabelAndDynamicHelpText(props: SpectrumTextFieldProps) {
  let [value, setValue] = useState('');

  return (
    <TextField
      {...props}
      value={value}
      onChange={setValue}
      validationState={value.length ? 'invalid' : undefined}
      errorMessage="Invalid length." />
  );
}
