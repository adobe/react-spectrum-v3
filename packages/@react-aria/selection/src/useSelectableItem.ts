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

import {focusSafely} from '@react-aria/focus';
import {HTMLAttributes, Key, RefObject, useEffect} from 'react';
import {MultipleSelectionManager} from '@react-stately/selection';
import {PressEvent} from '@react-types/shared';
import {PressProps} from '@react-aria/interactions';

interface SelectableItemOptions {
  /**
   * An interface for reading and updating multiple selection state.
   */
  selectionManager: MultipleSelectionManager,
  /**
   * A unique key for the item.
   */
  key: Key,
  /**
   * Ref to the item.
   */
  ref: RefObject<HTMLElement>,
  /**
   * By default, selection occurs on pointer down. This can be strange if selecting an
   * item causes the UI to disappear immediately (e.g. menus).
   */
  shouldSelectOnPressUp?: boolean,
  /**
   * Whether the option is contained in a virtual scroller.
   */
  isVirtualized?: boolean,
  /**
   * Function to focus the item.
   */
  focus?: () => void,
  /**
   * Whether the option should use virtual focus instead of being focused directly.
   */
  shouldUseVirtualFocus?: boolean
}

interface SelectableItemAria {
  /**
   * Props to be spread on the item root node.
   */
  itemProps: HTMLAttributes<HTMLElement> & PressProps
}

/**
 * Handles interactions with an item in a selectable collection.
 */
export function useSelectableItem(options: SelectableItemOptions): SelectableItemAria {
  let {
    selectionManager: manager,
    key,
    ref,
    shouldSelectOnPressUp,
    isVirtualized,
    shouldUseVirtualFocus,
    focus
  } = options;

  let onSelect = (e: PressEvent | PointerEvent) => manager.select(key, e);

  // Focus the associated DOM node when this item becomes the focusedKey
  let isFocused = key === manager.focusedKey;
  useEffect(() => {
    if (isFocused && manager.isFocused && !shouldUseVirtualFocus && document.activeElement !== ref.current) {
      if (focus) {
        focus();
      } else {
        focusSafely(ref.current);
      }
    }
  }, [ref, isFocused, manager.focusedKey, manager.childFocusStrategy, manager.isFocused, shouldUseVirtualFocus, focus]);

  // Set tabIndex to 0 if the element is focused, or -1 otherwise so that only the last focused
  // item is tabbable.  If using virtual focus, don't set a tabIndex at all so that VoiceOver
  // on iOS 14 doesn't try to move real DOM focus to the item anyway.
  let itemProps: SelectableItemAria['itemProps'] = {};
  if (!shouldUseVirtualFocus) {
    itemProps = {
      tabIndex: isFocused ? 0 : -1,
      onFocus(e) {
        if (e.target === ref.current) {
          manager.setFocusedKey(key);
        }
      }
    };
  }

  // By default, selection occurs on pointer down. This can be strange if selecting an
  // item causes the UI to disappear immediately (e.g. menus).
  // If shouldSelectOnPressUp is true, we use onPressUp instead of onPressStart.
  // onPress requires a pointer down event on the same element as pointer up. For menus,
  // we want to be able to have the pointer down on the trigger that opens the menu and
  // the pointer up on the menu item rather than requiring a separate press.
  // For keyboard events, selection still occurs on key down.
  if (shouldSelectOnPressUp) {
    itemProps.onPressStart = (e) => {
      if (e.pointerType === 'keyboard') {
        onSelect(e);
      }
    };

    itemProps.onPressUp = (e) => {
      if (e.pointerType !== 'keyboard') {
        onSelect(e);
      }
    };
  } else {
    // On touch, it feels strange to select on touch down, so we special case this.
    itemProps.onPressStart = (e) => {
      if (e.pointerType !== 'touch') {
        onSelect(e);
      }
    };

    itemProps.onPress = (e) => {
      if (e.pointerType === 'touch') {
        onSelect(e);
      }
    };
  }

  if (!isVirtualized) {
    itemProps['data-key'] = key;
  }

  return {
    itemProps
  };
}
