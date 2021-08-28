
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
import {Item, SearchAutocomplete} from '@react-spectrum/searchfield';
import {mergeProps} from '@react-aria/utils';
import React from 'react';

export default {
  title: 'SearchAutocomplete'
};

let options = [
  {id: 1, name: 'Aerospace'},
  {id: 2, name: 'Mechanical'},
  {id: 3, name: 'Civil'},
  {id: 4, name: 'Biomedical'},
  {id: 5, name: 'Nuclear'},
  {id: 6, name: 'Industrial'},
  {id: 7, name: 'Chemical'},
  {id: 8, name: 'Agricultural'},
  {id: 9, name: 'Electrical'}
];

let actions = {
  onOpenChange: action('onOpenChange'),
  onInputChange: action('onInputChange'),
  onSelectionChange: action('onSelectionChange'),
  onBlur: action('onBlur'),
  onFocus: action('onFocus'),
  onChange: action('onChange'),
  onSubmit: action('onSubmit')
};

function render(props = {}) {
  return (
    <SearchAutocomplete label="Search with Autocomplete" {...mergeProps(props, actions)}>
      <Item>Aerospace</Item>
      <Item>Mechanical</Item>
      <Item>Civil</Item>
      <Item>Biomedical</Item>
      <Item>Nuclear</Item>
      <Item>Industrial</Item>
      <Item>Chemical</Item>
      <Item>Agricultural</Item>
      <Item>Electrical</Item>
    </SearchAutocomplete>
  );
}

function renderDynamic(props = {}, items: any[] = options) {
  return (
    <SearchAutocomplete defaultItems={items} label="Search with Autocomplete" {...mergeProps(props, actions)}>
      {(item: any) => <Item>{item.name}</Item>}
    </SearchAutocomplete>
  );
}

function renderMapped(props = {}, items = options) {
  return (
    <SearchAutocomplete label="Search with Autocomplete" {...mergeProps(props, actions)}>
      {items.map((item) => (
        <Item key={item.id}>
          {item.name}
        </Item>
      ))}
    </SearchAutocomplete>
  );
}

export const Static = () => render();
Static.storyName = 'static items';

export const Dynamic = () => renderDynamic();
Dynamic.storyName = 'dynamic items';

export const NoItems = () => renderDynamic({}, []);
NoItems.storyName = 'no items';

export const MappedItems = () => renderMapped();
MappedItems.storyName = 'with mapped items';

export const MenuTriggerFocus = () => render({menuTrigger: 'focus'});
MenuTriggerFocus.storyName = 'menuTrigger: focus';

export const MenuTriggerManual = () => render({menuTrigger: 'manual'});
MenuTriggerManual.storyName = 'menuTrigger: manual';

export const isQuiet = () => render({isQuiet: true});
isQuiet.storyName = 'isQuiet';

export const isDisabled = () => render({isDisabled: true});
isDisabled.storyName = 'isDisabled';

export const isReadOnly = () => render({isReadOnly: true, value: 'Read only'});
isReadOnly.storyName = 'isReadOnly';

export const labelAlignEnd = () => render({labelAlign: 'end'});
labelAlignEnd.storyName = 'labelPosition: top, labelAlign: end';

export const labelPositionSide = () => render({labelPosition: 'side'});
labelPositionSide.storyName = 'labelPosition: side';

export const noVisibleLabel = () => render({label: undefined, 'aria-label': 'Search Autocomplete'});
noVisibleLabel.storyName = 'No visible label';

export const noVisibleLabelIsQuiet = () => render({label: undefined, 'aria-label': 'Search Autocomplete', isQuiet: true});
noVisibleLabelIsQuiet.storyName = 'No visible label, isQuiet';

export const isRequired = () => render({isRequired: true});
isRequired.storyName = 'isRequired';

export const isRequiredNecessityIndicatorLabel = () => render({isRequired: true, necessityIndicator: 'label'});
isRequiredNecessityIndicatorLabel.storyName = 'isRequired, necessityIndicator: label';

export const validationStateInvalid = () => render({validationState: 'invalid'});
validationStateInvalid.storyName = 'validationState: invalid';

export const validationStateValid = () => render({validationState: 'valid'});
validationStateValid.storyName = 'validationState: valid';

export const validationStateInvalidIsQuiet = () => render({validationState: 'invalid', isQuiet: true});
validationStateInvalidIsQuiet.storyName = 'validationState: invalid, isQuiet';

export const validationStateValidIsQuiet = () => render({validationState: 'valid', isQuiet: true});
validationStateValidIsQuiet.storyName = 'validationState: valid, isQuiet';

export const placeholder = () => render({placeholder: 'Select an item...'});
placeholder.storyName = 'placeholder';

export const autoFocus = () => render({autoFocus: true});
autoFocus.storyName = 'autoFocus: true';

export const directionTop = () => render({direction: 'top'});
directionTop.storyName = 'direction: top';

export const customWidth500 = () => render({width: 'size-500'});
customWidth500.storyName = 'custom width: size-500';

export const customWidth3000 = () => render({width: 'size-3000'});
customWidth3000.storyName = 'custom width: size-3000';

export const customWidth6000 = () => render({width: 'size-6000'});
customWidth6000.storyName = 'custom width: size-6000';
