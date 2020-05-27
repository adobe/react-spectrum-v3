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

import {AriaMenuProps} from '@react-types/menu';
import {filterDOMProps, mergeProps} from '@react-aria/utils';
import {HTMLAttributes, RefObject} from 'react';
import {KeyboardDelegate} from '@react-types/shared';
import {TreeState} from '@react-stately/tree';
import {useSelectableList} from '@react-aria/selection';

interface MenuAria {
  /** Props for the menu element */
  menuProps: HTMLAttributes<HTMLElement>
}

interface AriaMenuOptions<T> extends AriaMenuProps<T> {
  /** A ref to the menu container element. */
  ref?: RefObject<HTMLElement>,

  /** Whether the menu uses virtual scrolling. */
  isVirtualized?: boolean,

  /** 
   * An optional keyboard delegate implementation for type to select,
   * to override the default.
   */
  keyboardDelegate?: KeyboardDelegate
}

/**
 * Provides the behavior and accessibility implementation for a menu component.
 * A menu displays a list of actions or options and allows a user to choose one.
 * @param props - props for the menu
 * @param state - state for the menu, as returned by `useListState`
 */
export function useMenu<T>(props: AriaMenuOptions<T>, state: TreeState<T>): MenuAria {
  let {
    shouldFocusWrap = true,
    ...otherProps
  } = props;

  let domProps = filterDOMProps(props, {labelable: true});
  let {listProps} = useSelectableList({
    ...otherProps,
    selectionManager: state.selectionManager,
    collection: state.collection,
    disabledKeys: state.disabledKeys,
    shouldFocusWrap
  });

  return {
    menuProps: mergeProps(domProps, {
      role: 'menu',
      ...listProps
    })
  };
}
