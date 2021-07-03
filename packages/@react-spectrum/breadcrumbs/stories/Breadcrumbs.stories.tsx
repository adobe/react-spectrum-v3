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
import {Breadcrumbs} from '../';
import {Button} from '@react-spectrum/button';
import {ButtonGroup} from '@react-spectrum/buttongroup';
// import {Heading} from '@react-spectrum/text';
import {Item} from '@react-stately/collections';
import React from 'react';
import {storiesOf} from '@storybook/react';

let styles = {
  width: '100vw'
};
const CenterDecorator = storyFn => <div style={styles}><div>{storyFn()}</div></div>;

storiesOf('Breadcrumbs', module)
  .addDecorator(CenterDecorator)
  .addParameters({providerSwitcher: {status: 'negative'}})
  .add(
    'Default (with 3 items)',
    () => render()
  )
  .add(
    'Default (with 7 items)',
    () => renderMany({})
  )
  .add(
    'isMultiline',
    () => render({isMultiline: true})
  )
  .add(
    'size: S',
    () => render({size: 'S'})
  )
  .add(
    'size: S, isMultiline',
    () => render({size: 'S', isMultiline: true})
  )
  .add(
    'size: M',
    () => render({size: 'M'})
  )
  .add(
    'size: M, isMultiline',
    () => render({size: 'M', isMultiline: true})
  )
  .add(
    'truncated',
    () => (
      <div style={{width: '120px'}}>
        {render({})}
      </div>
    )
  )
  .add(
    'truncated, isMultiline',
    () => (
      <div style={{width: '100px'}}>
        {render({isMultiline: true})}
      </div>
    )
  )
  .add(
    'many items, showRoot: true',
    () => renderMany({showRoot: true})
  )
  .add(
    'many items, isMultiline',
    () => renderMany({isMultiline: true})
  )
  .add(
    'many items, isMultiline, showRoot: true',
    () => renderMany({maxVisibleItems: 'auto', isMultiline: true, showRoot: true})
  )
  .add(
    'isDisabled: true',
    () => render({isDisabled: true})
  )
  .add(
    'isDisabled: true, isMultiline',
    () => render({isDisabled: true, isMultiline: true})
  )
  .add(
    'resizeable',
    () => (
      <div style={{minWidth: '100px', width: '300px', padding: '10px', resize: 'horizontal', overflow: 'auto', backgroundColor: 'var(--spectrum-global-color-gray-50)'}}>
        {renderMany({})}
      </div>
    )
  )
  // .add(
  //   'last item Heading',
  //   () => renderHeading()
  // )
  // .add(
  //   'last item Heading, size: S',
  //   () => renderHeading({size: 'S'})
  // )
  // .add(
  //   'last item Heading, size: M',
  //   () => renderHeading({size: 'M'})
  // )
  // .add(
  //   'last item Heading, isMultiline',
  //   () => renderHeading({isMultiline: true})
  // )
  // .add(
  //   'last item Heading, size: S, isMultiline',
  //   () => renderHeading({isMultiline: true, size: 'S'})
  // )
  // .add(
  //   'last item Heading, size: M, isMultiline',
  //   () => renderHeading({isMultiline: true, size: 'M'})
  // )
  .add(
    'Only one item',
    () => (
      <Breadcrumbs>
        <Item>Root</Item>
      </Breadcrumbs>
    )
  )
  .add(
    'Only one item, isMultiline',
    () => (
      <Breadcrumbs isMultiline>
        <Item>Root</Item>
      </Breadcrumbs>
    )
  )
  .add(
    'adding breadcrumbs',
    () => <DynamicBreadcrumbs />
  );

function render(props = {}) {
  return (
    <Breadcrumbs {...props} onAction={action('onAction')}>
      <Item key="Folder 1">The quick brown fox jumps over</Item>
      <Item key="Folder 2">My Documents</Item>
      <Item key="Folder 3">Kangaroos jump high</Item>
    </Breadcrumbs>
  );
}

// function renderHeading(props = {}) {
//   return (
//     <Breadcrumbs {...props} onAction={action('onAction')}>
//       <Item key="Folder 1">
//         The quick brown fox jumps over
//       </Item>
//       <Item key="Folder 2">
//         My Documents
//       </Item>
//       <Item key="Folder 3">
//         <Heading level={1}>
//           Kangaroos jump high
//         </Heading>
//       </Item>
//     </Breadcrumbs>
//   );
// }

function renderMany(props = {}) {
  return (
    <Breadcrumbs {...props} onAction={action('onAction')}>
      <Item key="Folder 1">The quick brown fox jumps over</Item>
      <Item key="Folder 2">My Documents</Item>
      <Item key="Folder 3">Kangaroos jump high</Item>
      <Item key="Folder 4">Koalas are very cute</Item>
      <Item key="Folder 5">Wombat's noses</Item>
      <Item key="Folder 6">Wattle trees</Item>
      <Item key="Folder 7">April 7</Item>
    </Breadcrumbs>
  );
}

let folders = [
  {id: 1, label: 'Home'},
  {id: 2, label: 'Trendy'},
  {id: 3, label: 'March 2020 Assets'}
];

let DynamicBreadcrumbs = () => {
  let [breadcrumbs, setBreadcrumbs] = React.useState(folders);
  let addBreadcrumb = () => {
    let newBreadcrumbs = [...breadcrumbs];
    newBreadcrumbs.push({
      id: breadcrumbs.length + 1,
      label: `Breadcrumb ${breadcrumbs.length + 1}`
    });

    setBreadcrumbs(newBreadcrumbs);
  };

  let removeBreadcrumb = () => {
    let newBreadcrumbs = [...breadcrumbs];
    newBreadcrumbs.pop();
    setBreadcrumbs(newBreadcrumbs);
  };

  return (
    <div>
      <Breadcrumbs>
        {breadcrumbs.map(f => <Item key={f.id}>{f.label}</Item>)}
      </Breadcrumbs>
      <ButtonGroup marginEnd="30px">
        <Button variant="secondary" onPress={() => addBreadcrumb()}>
          Add Breadcrumb
        </Button>
        <Button variant="secondary" onPress={() => removeBreadcrumb()}>
          Remove Breadcrumb
        </Button>
      </ButtonGroup>
    </div>
  );
};
