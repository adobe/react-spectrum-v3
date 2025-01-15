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

import {AriaAutocompleteProps, CollectionOptions, UNSTABLE_useAutocomplete} from '@react-aria/autocomplete';
import {AutocompleteState, UNSTABLE_useAutocompleteState} from '@react-stately/autocomplete';
import {mergeProps} from '@react-aria/utils';
import {Provider, removeDataAttributes, SlotProps, SlottedContextValue, useSlottedContext} from './utils';
import React, {createContext, RefObject, useContext, useRef} from 'react';
import {RootMenuTriggerStateContext} from './Menu';
import {SearchFieldContext} from './SearchField';
import {TextFieldContext} from './TextField';
import {useMenuTriggerState} from 'react-stately';

export interface AutocompleteProps extends AriaAutocompleteProps, SlotProps {}

interface InternalAutocompleteContextValue {
  filterFn?: (nodeTextValue: string) => boolean,
  collectionProps: CollectionOptions,
  collectionRef: RefObject<HTMLElement | null>
}

export const UNSTABLE_AutocompleteContext = createContext<SlottedContextValue<AutocompleteProps>>(null);
export const UNSTABLE_AutocompleteStateContext = createContext<AutocompleteState | null>(null);
// This context is to pass the register and filter down to whatever collection component is wrapped by the Autocomplete
// TODO: export from RAC, but rename to something more appropriate
export const UNSTABLE_InternalAutocompleteContext = createContext<InternalAutocompleteContextValue | null>(null);

/**
 * A autocomplete combines a text input with a menu, allowing users to filter a list of options to items matching a query.
 */
export function UNSTABLE_Autocomplete(props: AutocompleteProps) {
  let ctx = useSlottedContext(UNSTABLE_AutocompleteContext, props.slot);
  props = mergeProps(ctx, props);
  let {filter} = props;
  let state = UNSTABLE_useAutocompleteState(props);
  let collectionRef = useRef<HTMLElement>(null);
  let {
    textFieldProps,
    collectionProps,
    collectionRef: mergedCollectionRef,
    filterFn
  } = UNSTABLE_useAutocomplete({
    ...removeDataAttributes(props),
    filter,
    collectionRef
  }, state);
  // TODO: we need some sore of root menu state for any sub dialogs even though the autocomplete itself isn't actually a trigger
  // Alternatively, we could assume that the Autocomplete will always be within a MenuTrigger/DialogTrigger
  let rootMenuTriggerState = useContext(RootMenuTriggerStateContext);
  let menuState = useMenuTriggerState({});

  return (
    <Provider
      values={[
        [UNSTABLE_AutocompleteStateContext, state],
        [SearchFieldContext, textFieldProps],
        [TextFieldContext, textFieldProps],
        [UNSTABLE_InternalAutocompleteContext, {
          filterFn,
          collectionProps,
          collectionRef: mergedCollectionRef
        }],
        [RootMenuTriggerStateContext, rootMenuTriggerState ? rootMenuTriggerState : menuState]
      ]}>
      {props.children}
    </Provider>
  );
};
