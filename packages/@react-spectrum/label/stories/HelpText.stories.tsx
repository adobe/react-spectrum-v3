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

import {Flex} from '@react-spectrum/layout';
import React, {useState} from 'react';
import {SpectrumTextFieldProps} from '@react-types/textfield';
import {storiesOf} from '@storybook/react';
import {TextField} from '@react-spectrum/textfield';

storiesOf('HelpText', module)
  .addParameters({providerSwitcher: {status: 'positive'}})
  .add(
    'description',
    () => render({description: 'Password must be at least 8 characters.'})
  )
  .add(
    'error message',
    () => render({errorMessage: 'Create a password with at least 8 characters.', validationState: 'invalid'})
  )
  .add(
    'description and error message',
    () => {
      let [value, setValue] = useState('');

      return (
        <TextField
          label="Empty field"
          description="This input is only valid when it's empty."
          errorMessage="Remove input."
          value={value}
          onChange={setValue}
          validationState={value.length ? 'invalid' : undefined} />
      );
    }
  )
  .add(
    'description, validationState: valid',
    () => render({
      label: 'Nickname',
      description: 'Enter your nickname, or leave blank if you don\'t have one.',
      validationState: 'valid'
    })
  )
  .add(
    'description and error message, validationState: valid',
    () => render({
      label: 'Valid field',
      description: 'The error message will never render because validationState is "valid".',
      errorMessage: 'Uninformative error message', // Won't render
      validationState: 'valid'
    })
  )
  .add(
    'showErrorIcon: true',
    () => render({
      errorMessage: 'Create a password with at least 8 characters.',
      validationState: 'invalid',
      showErrorIcon: true
    })
  )
  .add(
    'disabled',
    () => render({description: 'Password must be at least 8 characters.', isDisabled: true})
  )
  .add(
    'labelAlign: end',
    () => render({
      description: 'Password must be at least 8 characters.',
      labelAlign: 'end'
    })
  )
  .add(
    'labelAlign: end, showErrorIcon: true',
    () => render({
      errorMessage: 'Create a password with at least 8 characters.',
      validationState: 'invalid',
      showErrorIcon: true,
      labelAlign: 'end'
    })
  )
  .add(
    'labelPosition: side',
    () => render({
      description: 'Password must be at least 8 characters.',
      labelPosition: 'side'
    })
  )
  .add(
    'labelAlign: end, labelPosition: side',
    () => render({
      description: 'Password must be at least 8 characters.',
      labelAlign: 'end',
      labelPosition: 'side'
    })
  )
  .add(
    'no visible label',
    () => render({
      label: null,
      'aria-label': 'Password',
      description: 'Password must be at least 8 characters.'
    })
  )
  .add(
    'no visible label, labelPosition: side',
    () => render({
      label: null,
      'aria-label': 'Password',
      description: 'Password must be at least 8 characters.',
      labelPosition: 'side'
    })
  )
  .add(
    'custom width',
    () => render({
      label: 'Password',
      description: 'Password must be at least 8 characters.',
      width: '100px'
    })
  )
  .add(
    'custom width, labelPosition: side',
    () => render({
      label: 'Password',
      description: 'Password must be at least 8 characters.',
      width: '440px',
      labelPosition: 'side'
    })
  )
  .add(
    'description and custom description',
    () => renderCustomDescription({description: 'Password must be at least 8 characters.'})
  );

function render(props: SpectrumTextFieldProps = {}) {
  return (
    <TextField label="Password" {...props} />
  );
}

function renderCustomDescription(props: SpectrumTextFieldProps = {}) {
  return (
    <Flex direction="column" gap="size-125">
      <TextField label="Password" {...props} aria-describedby="custom-description" />
      <p id="custom-description">Custom description.</p>
    </Flex>
  );
}
