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

import React from 'react';
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
    'labelPosition: side',
    () => render({
      description: 'Password must be at least 8 characters.',
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
  );

function render(props: SpectrumTextFieldProps = {}) {
  return (
    <TextField label="Password" {...props} />
  );
}
