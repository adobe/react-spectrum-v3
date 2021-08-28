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

import {Flex} from '@react-spectrum/layout';
import Info from '@spectrum-icons/workflow/Info';
import React from 'react';
import {storiesOf} from '@storybook/react';
import {TextField} from '../';

storiesOf('Textfield', module)
  .addParameters({chromaticProvider: {locales: ['en-US', 'ar-AE', 'zh-TW']}})
  .add(
    'Default',
    () => render()
  )
  .add(
    'value: Test',
    () => render({value: 'Test'})
  )
  .add(
    'validationState: invalid',
    () => render({validationState: 'invalid'})
  )
  .add(
    'validationState: valid',
    () => render({validationState: 'valid'})
  )
  .add(
    'isReadOnly: true',
    () => render({isReadOnly: true})
  )
  .add(
    'isReadOnly: true, with value',
    () => render({value: 'Read only value', isReadOnly: true})
  )
  .add(
    'isRequired: true',
    () => render({isRequired: true})
  )
  .add(
    'isRequired: true, necessityIndicator: label',
    () => render({isRequired: true, necessityIndicator: 'label'}, false)
  )
  .add(
    'isRequired: false, necessityIndicator: label',
    () => render({isRequired: false, necessityIndicator: 'label'}, false)
  )
  .add(
    'icon: Info',
    () => render({icon: <Info />})
  )
  .add(
    'icon: Info, validationState: invalid',
    () => render({icon: <Info />, validationState: 'invalid'})
  )
  .add(
    'labelAlign: end',
    () => render({labelAlign: 'end'}, false)
  )
  .add(
    'labelPosition: side',
    () => render({labelPosition: 'side'}, false)
  )
  .add(
    'labelAlign: end, labelPosition: side',
    () => render({labelAlign: 'end', labelPosition: 'side'}, false)
  )
  .add(
    'no visible label',
    () => render({label: null, 'aria-label': 'Street address'}, false)
  )
  .add('custom width',
    () => render({icon: <Info />, validationState: 'invalid', width: 275})
  )
  .add(
    'value: 測試, icon: Info, labelPosition: side, validationState: valid',
    () => render({value: '測試', icon: <Info />, labelPosition: 'side', validationState: 'valid'})
  )
  .add(
    'value: اختبار, isRequired: false, necessityIndicator: label',
    () => render({value: 'اختبار', isRequired: false, necessityIndicator: 'label'})
  );

// allow some stories where disabled styles probably won't affect anything to turn that off, mostly to reduce clutter
function render(props = {}, disabled = true) {
  return (
    <Flex gap="size-100">
      <TextField
        label="Default"
        placeholder="React"
        {...props} />
      <TextField
        label="Quiet"
        placeholder="React"
        isQuiet
        {...props} />
      {disabled && (
        <>
          <TextField
            label="Disabled"
            placeholder="React"
            isDisabled
            {...props} />
          <TextField
            label="Quiet + Disabled"
            placeholder="React"
            isQuiet
            isDisabled
            {...props} />
        </>
      )}
    </Flex>
  );
}
