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
import {Flex} from '../../layout';
import React from 'react';
import Refresh from '@spectrum-icons/workflow/Refresh';
import {SearchField} from '../';
import {storiesOf} from '@storybook/react';

const info = 'A containing element with `role="search"` has been added to define a **search** landmark region.';
// not quite duplicate of Textfield, has things like clear button
storiesOf('SearchField', module)
  .add(
    'Default',
    () => renderSearchLandmark(render()),
    {info}
  )
  .add(
    'value',
    () => renderSearchLandmark(render({value: 'React'})),
    {info}
  )
  .add(
    'isDisabled',
    () => renderSearchLandmark(render({value: 'React', isDisabled: true})),
    {info}
  )
  .add(
    'isReadOnly',
    () => renderSearchLandmark(render({value: 'React', isReadOnly: true})),
    {info}
  )
  // don't need to test label positions or required, covered by Textfield
  .add(
    'icon: refresh',
    () => renderSearchLandmark(render({defaultValue: 'React', icon: <Refresh />})),
    {info}
  )
  .add('custom width',
    () => render({defaultValue: 'React', width: 275})
  );

function renderSearchLandmark(child) {
  return <div role="search">{child}</div>;
}

function render(props = {}) {
  return (
    <Flex gap="size-100">
      <SearchField
        label="Default"
        placeholder="React"
        {...props} />
      <SearchField
        label="Quiet"
        placeholder="React"
        isQuiet
        {...props} />
      <SearchField
        label="Disabled"
        placeholder="React"
        isDisabled
        {...props} />
      <SearchField
        label="Quiet + Disabled"
        placeholder="React"
        isQuiet
        isDisabled
        {...props} />
    </Flex>
  );
}
