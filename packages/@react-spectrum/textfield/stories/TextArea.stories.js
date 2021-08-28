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
import {Button} from '@react-spectrum/button';
import {Flex} from '@react-spectrum/layout';
import {Form} from '@react-spectrum/form';
import Info from '@spectrum-icons/workflow/Info';
import React, {useState} from 'react';
import {storiesOf} from '@storybook/react';
import {TextArea} from '../';

storiesOf('TextArea', module)
  .addParameters({providerSwitcher: {status: 'positive'}})
  .add(
    'Default',
    () => render()
  )
  .add(
    'value: Test (controlled)',
    () => render({value: 'Test'})
  )
  .add(
    'defaultValue: Test (uncontrolled)',
    () => render({defaultValue: 'Test'})
  )
  .add(
    'isQuiet: true',
    () => render({isQuiet: true})
  )
  .add(
    'isQuiet, defaultValue',
    () => render({isQuiet: true, defaultValue: 'foo  '.repeat(10)})
  )
  .add(
    'isQuiet, value',
    () => render({isQuiet: true, value: 'foo  '.repeat(10)})
  )
  .add(
    'isDisabled: true',
    () => render({isDisabled: true})
  )
  .add(
    'isDisabled, isQuiet',
    () => render({isDisabled: true, isQuiet: true})
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
    'isReadOnly: true, value: read only value',
    () => render({value: 'Read only value', isReadOnly: true})
  )
  .add(
    'isRequired: true',
    () => render({isRequired: true})
  )
  .add(
    'isRequired: true, necessityIndicator: label',
    () => render({isRequired: true, necessityIndicator: 'label'})
  )
  .add(
    'isRequired: false, necessityIndicator: label',
    () => render({isRequired: false, necessityIndicator: 'label'})
  )
  .add(
    'autoFocus: true',
    () => render({autoFocus: true})
  )
  .add(
    'icon: Info',
    () => render({icon: <Info />})
  )
  .add(
    'icon: Info, isQuiet',
    () => render({icon: <Info />, isQuiet: true})
  )
  .add(
    'icon: Info, isDisabled',
    () => render({icon: <Info />, isDisabled: true})
  )
  .add(
    'icon: Info, isQuiet, isDisabled',
    () => render({icon: <Info />, isQuiet: true, isDisabled: true})
  )
  .add(
    'icon: Info, validationState: invalid, isQuiet',
    () => render({icon: <Info />, validationState: 'invalid', isQuiet: true})
  )
  .add(
    'labelAlign: end',
    () => render({labelAlign: 'end'})
  )
  .add(
    'labelPosition: side',
    () => render({labelPosition: 'side'})
  )
  .add(
    'no visible label',
    () => render({label: null, 'aria-label': 'Street address'})
  )
  .add('with description',
    () => render({description: 'Enter product feedback.'})
  )
  .add('with error message',
    () => render({errorMessage: 'Enter at least 250 characters.', validationState: 'invalid'})
  )
  .add('custom width',
    () => render({icon: <Info />, validationState: 'invalid', width: '300px'})
  )
  .add('custom width small',
    () => render({icon: <Info />, validationState: 'invalid', width: '30px'})
  )
  .add('custom width, quiet',
    () => render({icon: <Info />, validationState: 'invalid', width: '300px', isQuiet: true})
  )
  .add(
    'custom height with label',
    () => (
      <Form>
        <TextArea label="Height size-2000" height="size-2000" />
        <TextArea label="Height size-2000" height="size-2000" isQuiet />
        <TextArea labelPosition="side" label="Height size-2000" height="size-2000" />
        <TextArea labelPosition="side" label="Height size-2000" height="size-2000" isQuiet />
      </Form>
    )
  )
  .add('controlled interactive',
    () => <ControlledTextArea />
  )
  .add('in flex', () => renderInFlexRowAndBlock())
  .add('in flex validation state', () => renderInFlexRowAndBlock({validationState: 'invalid'}));

function render(props = {}) {
  return (
    <TextArea
      label="Comments"
      placeholder="React"
      onChange={action('change')}
      onFocus={action('focus')}
      onBlur={action('blur')}
      UNSAFE_className="custom_classname"
      {...props} />
  );
}

function ControlledTextArea(props) {
  let [value, setValue] = useState('');
  return (
    <>
      <TextArea label="megatron" value={value} onChange={setValue} {...props} isQuiet />
      <Button variant="primary" onPress={() => setValue('decepticons are evil transformers and should be kicked out of earth')}>Set Text</Button>
    </>
  );
}

function renderInFlexRowAndBlock(props = {}) {
  return (
    <Flex direction="column" gap="size-300">
      Align stretch
      <Flex gap="size-100">
        <TextArea
          label="Default"
          placeholder="React"
          {...props} />
        <TextArea
          label="Quiet"
          placeholder="React"
          isQuiet
          {...props} />
        <TextArea
          label="Quiet"
          placeholder="React"
          isQuiet
          {...props} />
      </Flex>
      Align end
      <Flex gap="size-100" alignItems="end">
        <TextArea
          label="Default"
          placeholder="React"
          {...props} />
        <TextArea
          label="Quiet"
          placeholder="React"
          isQuiet
          {...props} />
        <TextArea
          label="Quiet"
          placeholder="React"
          isQuiet
          {...props} />
      </Flex>
      Display block
      <div>
        <TextArea
          label="Default"
          placeholder="React"
          {...props} />
        <TextArea
          label="Quiet"
          placeholder="React"
          isQuiet
          {...props} />
        <TextArea
          label="Quiet"
          placeholder="React"
          isQuiet
          {...props} />
      </div>
    </Flex>
  );
}
