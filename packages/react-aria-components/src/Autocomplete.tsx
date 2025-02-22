/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaAutocompleteProps, CollectionOptions, useAutocomplete} from '@react-aria/autocomplete';
import {AutocompleteState, useAutocompleteState} from '@react-stately/autocomplete';
import {InputContext} from './Input';
import {mergeProps} from '@react-aria/utils';
import {Provider, removeDataAttributes, SlotProps, SlottedContextValue, useSlottedContext} from './utils';
import React, {createContext, RefObject, useRef} from 'react';
import {SearchFieldContext} from './SearchField';
import {TextFieldContext} from './TextField';

export interface AutocompleteProps extends AriaAutocompleteProps, SlotProps {}

interface InternalAutocompleteContextValue {
  filterFn?: (nodeTextValue: string) => boolean,
  collectionProps: CollectionOptions,
  collectionRef: RefObject<HTMLElement | null>
}

export const AutocompleteContext = createContext<SlottedContextValue<Partial<AutocompleteProps>>>(null);
export const AutocompleteStateContext = createContext<AutocompleteState | null>(null);
// This context is to pass the register and filter down to whatever collection component is wrapped by the Autocomplete
// TODO: export from RAC, but rename to something more appropriate
export const UNSTABLE_InternalAutocompleteContext = createContext<InternalAutocompleteContextValue | null>(null);

/**
 * An autocomplete combines a text input with a menu, allowing users to filter a list of options to items matching a query.
 */
export function Autocomplete(props: AutocompleteProps) {
  let ctx = useSlottedContext(AutocompleteContext, props.slot);
  props = mergeProps(ctx, props);
  let {filter, shouldFocusOnSearch} = props;
  let state = useAutocompleteState(props);
  let inputRef = useRef<HTMLInputElement | null>(null);
  let collectionRef = useRef<HTMLElement>(null);
  let {
    textFieldProps,
    collectionProps,
    collectionRef: mergedCollectionRef,
    filterFn
  } = useAutocomplete({
    ...removeDataAttributes(props),
    filter,
    shouldFocusOnSearch,
    inputRef,
    collectionRef
  }, state);

  return (
    <Provider
      values={[
        [AutocompleteStateContext, state],
        [SearchFieldContext, textFieldProps],
        [TextFieldContext, textFieldProps],
        [InputContext, {ref: inputRef}],
        [UNSTABLE_InternalAutocompleteContext, {
          filterFn,
          collectionProps,
          collectionRef: mergedCollectionRef
        }]
      ]}>
      {props.children}
    </Provider>
  );
};
