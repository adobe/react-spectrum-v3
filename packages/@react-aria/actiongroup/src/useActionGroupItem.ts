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

import {HTMLAttributes, Key, RefObject, useEffect, useRef, useState} from 'react';
import {ListState} from '@react-stately/list';
import {mergeProps} from '@react-aria/utils';
import {PressProps} from '@react-aria/interactions';

interface ActionGroupItemProps {
  key: Key
}

interface ActionGroupItemAria {
  buttonProps: HTMLAttributes<HTMLElement> & PressProps
}

const BUTTON_ROLES = {
  'none': null,
  'single': 'radio',
  'multiple': 'checkbox'
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useActionGroupItem<T>(props: ActionGroupItemProps, state: ListState<T>, ref?: RefObject<HTMLElement>): ActionGroupItemAria {
  let {key} = props;
  let selectionMode = state.selectionManager.selectionMode;
  let buttonProps = {
    role: BUTTON_ROLES[selectionMode]
  };

  // Cause rerender when focus key changes. Default state to null so intitial
  // focus within the actionGroup properly updates ALL actiongroup item tab index
  let [isFocused, setFocused] = useState(null);
  useEffect(() => {
    let handler = (focusedKey) => {
      let isFocused = key === focusedKey;
      setFocused(isFocused);
    };

    state.selectionManager.subscribeToFocusKeyChange(handler);
    return () => {
      state.selectionManager.unsubscribeToFocusKeyChange(handler);
    };
  }, [state.selectionManager, key]);

  if (selectionMode !== 'none') {
    let isSelected = state.selectionManager.isSelected(props.key);
    buttonProps['aria-checked'] = isSelected;
  }

  let lastRender = useRef({isFocused, state});
  lastRender.current = {isFocused, state};

  // If the focused item is removed from the DOM, reset the focused key to null.
  // eslint-disable-next-line arrow-body-style
  useEffect(() => {
    return () => {
      if (lastRender.current.isFocused) {
        lastRender.current.state.selectionManager.setFocusedKey(null);
      }
    };
  }, []);

  return {
    buttonProps: mergeProps(buttonProps, {
      tabIndex: isFocused || state.selectionManager.focusedKey == null ? 0 : -1,
      onFocus() {
        state.selectionManager.setFocusedKey(props.key);
      },
      onPress() {
        state.selectionManager.select(props.key);
      }
    })
  };
}
