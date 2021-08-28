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
import {Flex} from '@react-spectrum/layout';
import React from 'react';
import Refresh from '@spectrum-icons/workflow/Refresh';
import {SearchField} from '../';
import {storiesOf} from '@storybook/react';

const info = 'A containing element with `role="search"` has been added to define a **search** landmark region.';

storiesOf('SearchField', module)
  .addParameters({providerSwitcher: {status: 'positive'}})
  .add(
    'Default',
    () => renderSearchLandmark(render()),
    {info}
  )
  .add(
    'defaultValue (uncontrolled)',
    () => renderSearchLandmark(render({defaultValue: 'React'})),
    {info}
  )
  .add(
    'value (controlled)',
    () => renderSearchLandmark(render({value: 'React'})),
    {info}
  )
  .add(
    'isQuiet: true',
    () => renderSearchLandmark(render({isQuiet: true})),
    {info}
  )
  .add(
    'isDisabled: true',
    () => renderSearchLandmark(render({defaultValue: 'React', isDisabled: true})),
    {info}
  )
  .add(
    'isQuiet, isDisabled',
    () => renderSearchLandmark(render({defaultValue: 'React', isQuiet: true, isDisabled: true})),
    {info}
  )
  .add(
    'isReadOnly',
    () => renderSearchLandmark(render({defaultValue: 'React', isReadOnly: true})),
    {info}
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
    'icon: refresh',
    () => renderSearchLandmark(render({defaultValue: 'React', icon: <Refresh />})),
    {info}
  )
  .add(
    'isQuiet, icon: refresh',
    () => renderSearchLandmark(render({defaultValue: 'React', icon: <Refresh />, isQuiet: true})),
    {info}
  )
  .add(
    'validationState=invalid',
    () => renderSearchLandmark(render({defaultValue: 'React', validationState: 'invalid'})),
    {info}
  )
  .add(
    'validationState=valid',
    () => renderSearchLandmark(render({defaultValue: 'React', validationState: 'valid'})),
    {info}
  )
  .add(
    'onClear',
    () => renderSearchLandmark(render({onClear: action('clear')})),
    {info}
  )
  .add(
    'autoFocus',
    () => renderSearchLandmark(render({autoFocus: true})),
    {info}
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
    () => render({description: 'Enter a search term.'})
  )
  .add('with error message',
    () => render({errorMessage: 'Remove special characters.', validationState: 'invalid'})
  )
  .add('custom width',
    () => render({width: 300})
  )
  .add('custom width, quiet',
    () => render({width: 300, isQuiet: true})
  )
  .add('custom width, labelPosition: side',
    () => render({width: 300, labelPosition: 'side'})
  )
  .add('custom width and narrow container',
    () => (
      <Flex direction="column" width="30px">
        {render({defaultValue: 'React', validationState: 'valid'})}
        {render({defaultValue: 'React', width: 30})}
        {render({defaultValue: 'React', width: 30, validationState: 'valid'})}
      </Flex>
    )
  );

function renderSearchLandmark(child) {
  return <div role="search">{child}</div>;
}

function render(props = {}) {
  return (
    <SearchField
      UNSAFE_className="custom_classname"
      label="Search"
      placeholder="Enter text"
      {...props}
      onChange={action('change')}
      onSubmit={action('submit')} />
  );
}
