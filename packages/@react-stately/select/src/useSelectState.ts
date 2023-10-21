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

import {CollectionStateBase} from '@react-types/shared';
import {FormValidationState, useFormValidationState} from '@react-stately/form';
import {Key, useEffect, useRef, useState} from 'react';
import {MenuTriggerState, useMenuTriggerState} from '@react-stately/menu';
import {SelectProps} from '@react-types/select';
import {SingleSelectListState, useSingleSelectListState} from '@react-stately/list';

export interface SelectStateOptions<T> extends Omit<SelectProps<T>, 'children'>, CollectionStateBase<T> {}

export interface SelectState<T> extends SingleSelectListState<T>, MenuTriggerState, FormValidationState<Key> {
  /** Whether the select is currently focused. */
  readonly isFocused: boolean,

  /** Sets whether the select is focused. */
  setFocused(isFocused: boolean): void
}

/**
 * Provides state management for a select component. Handles building a collection
 * of items from props, handles the open state for the popup menu, and manages
 * multiple selection state.
 */
export function useSelectState<T extends object>(props: SelectStateOptions<T>): SelectState<T>  {
  let triggerState = useMenuTriggerState(props);
  let didCommit = useRef(false);
  let listState = useSingleSelectListState({
    ...props,
    onSelectionChange: (key) => {
      if (props.onSelectionChange != null) {
        props.onSelectionChange(key);
      }

      triggerState.close();
      didCommit.current = true;
    }
  });

  // Commit validation the next render after the value changes so that
  // the native input has time to update its validation state.
  useEffect(() => {
    if (didCommit.current) {
      didCommit.current = false;
      validationState.commitValidation();
    }
  });

  let validationState = useFormValidationState({
    ...props,
    value: listState.selectedKey
  });

  let [isFocused, setFocused] = useState(false);

  return {
    ...validationState,
    ...listState,
    ...triggerState,
    open() {
      // Don't open if the collection is empty.
      if (listState.collection.size !== 0) {
        triggerState.open();
      }
    },
    toggle(focusStrategy) {
      if (listState.collection.size !== 0) {
        triggerState.toggle(focusStrategy);
      }
    },
    isFocused,
    setFocused
  };
}
