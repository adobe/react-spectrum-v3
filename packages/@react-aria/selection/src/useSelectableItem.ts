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

import {DOMAttributes, FocusableElement, Key, LongPressEvent, PressEvent, RefObject} from '@react-types/shared';
import {focusSafely, getFocusableTreeWalker} from '@react-aria/focus';
import {isCtrlKeyPressed, isNonContiguousSelectionModifier} from './utils';
import {mergeProps, openLink, useRouter} from '@react-aria/utils';
import {MultipleSelectionManager} from '@react-stately/selection';
import {PressProps, useLongPress, usePress} from '@react-aria/interactions';
import {useEffect, useRef} from 'react';

export interface SelectableItemOptions {
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
  ref: RefObject<FocusableElement | null>,
  /**
   * By default, selection occurs on pointer down. This can be strange if selecting an
   * item causes the UI to disappear immediately (e.g. menus).
   */
  shouldSelectOnPressUp?: boolean,
  /**
   * Whether selection requires the pointer/mouse down and up events to occur on the same target or triggers selection on
   * the target of the pointer/mouse up event.
   */
  allowsDifferentPressOrigin?: boolean,
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
  shouldUseVirtualFocus?: boolean,
  /** Whether the item is disabled. */
  isDisabled?: boolean,
  /**
   * Handler that is called when a user performs an action on the item. The exact user event depends on
   * the collection's `selectionBehavior` prop and the interaction modality.
   */
  onAction?: () => void,
  /**
   * The behavior of links in the collection.
   * - 'action': link behaves like onAction.
   * - 'selection': link follows selection interactions (e.g. if URL drives selection).
   * - 'override': links override all other interactions (link items are not selectable).
   * - 'none': links are disabled for both selection and actions (e.g. handled elsewhere).
   * @default 'action'
   */
  linkBehavior?: 'action' | 'selection' | 'override' | 'none',
  /**
   * Whether last focus was caused by keyboard or not.
   */
  isKeyboard?: RefObject<boolean>,
  /**
   * Whether tabbing backwards or forwards.
   */
  isForwardTab?: RefObject<boolean>,
  /**
   * Whether focus is contained or not.
   */
  isFocusWithin?: RefObject<boolean>
}

export interface SelectableItemStates {
  /** Whether the item is currently in a pressed state. */
  isPressed: boolean,
  /** Whether the item is currently selected. */
  isSelected: boolean,
  /** Whether the item is currently focused. */
  isFocused: boolean,
  /**
   * Whether the item is non-interactive, i.e. both selection and actions are disabled and the item may
   * not be focused. Dependent on `disabledKeys` and `disabledBehavior`.
   */
  isDisabled: boolean,
  /**
   * Whether the item may be selected, dependent on `selectionMode`, `disabledKeys`, and `disabledBehavior`.
   */
  allowsSelection: boolean,
  /**
   * Whether the item has an action, dependent on `onAction`, `disabledKeys`,
   * and `disabledBehavior`. It may also change depending on the current selection state
   * of the list (e.g. when selection is primary). This can be used to enable or disable hover
   * styles or other visual indications of interactivity.
   */
  hasAction: boolean
}

export interface SelectableItemAria extends SelectableItemStates {
  /**
   * Props to be spread on the item root node.
   */
  itemProps: DOMAttributes
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
    shouldUseVirtualFocus,
    focus,
    isDisabled,
    onAction,
    allowsDifferentPressOrigin,
    linkBehavior = 'action',
    isKeyboard,
    isForwardTab,
    isFocusWithin
  } = options;
  let router = useRouter();

  let onSelect = (e: PressEvent | LongPressEvent | PointerEvent) => {
    if (e.pointerType === 'keyboard' && isNonContiguousSelectionModifier(e)) {
      manager.toggleSelection(key);
    } else {
      if (manager.selectionMode === 'none') {
        return;
      }

      if (manager.isLink(key)) {
        if (linkBehavior === 'selection') {
          let itemProps = manager.getItemProps(key);
          router.open(ref.current, e, itemProps.href, itemProps.routerOptions);
          // Always set selected keys back to what they were so that select and combobox close.
          manager.setSelectedKeys(manager.selectedKeys);
          return;
        } else if (linkBehavior === 'override' || linkBehavior === 'none') {
          return;
        }
      }

      if (manager.selectionMode === 'single') {
        if (manager.isSelected(key) && !manager.disallowEmptySelection) {
          manager.toggleSelection(key);
        } else {
          manager.replaceSelection(key);
        }
      } else if (e && e.shiftKey) {
        manager.extendSelection(key);
      } else if (manager.selectionBehavior === 'toggle' || (e && (isCtrlKeyPressed(e) || e.pointerType === 'touch' || e.pointerType === 'virtual'))) {
        // if touch or virtual (VO) then we just want to toggle, otherwise it's impossible to multi select because they don't have modifier keys
        manager.toggleSelection(key);
      } else {
        manager.replaceSelection(key);
      }
    }
  };

  // Focus the associated DOM node when this item becomes the focusedKey
  useEffect(() => {
    let isFocused = key === manager.focusedKey;
    if (isFocused && manager.isFocused && !shouldUseVirtualFocus) {
      if (focus) {
        focus();
      } else if (
          isForwardTab && !isForwardTab.current &&
          isFocusWithin && !isFocusWithin?.current &&
          isKeyboard && isKeyboard?.current) {
        let walker = getFocusableTreeWalker(ref.current, {tabbable: true});
        let next: FocusableElement;
        let last: FocusableElement;
        do {
          last = walker.lastChild() as FocusableElement;
          if (last) {
            next = last;
          }
        } while (last);

        focusSafely(next);
      } else if (document.activeElement !== ref.current) {
        focusSafely(ref.current);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, key, manager.focusedKey, manager.childFocusStrategy, manager.isFocused, shouldUseVirtualFocus]);

  isDisabled = isDisabled || manager.isDisabled(key);
  // Set tabIndex to 0 if the element is focused, or -1 otherwise so that only the last focused
  // item is tabbable.  If using virtual focus, don't set a tabIndex at all so that VoiceOver
  // on iOS 14 doesn't try to move real DOM focus to the item anyway.
  let itemProps: SelectableItemAria['itemProps'] = {};
  if (!shouldUseVirtualFocus && !isDisabled) {
    itemProps = {
      tabIndex: key === manager.focusedKey ? 0 : -1,
      onFocus(e) {
        if (e.target === ref.current) {
          manager.setFocusedKey(key);
        }
      }
    };
  } else if (isDisabled) {
    itemProps.onMouseDown = (e) => {
      // Prevent focus going to the body when clicking on a disabled item.
      e.preventDefault();
    };
  }

  // With checkbox selection, onAction (i.e. navigation) becomes primary, and occurs on a single click of the row.
  // Clicking the checkbox enters selection mode, after which clicking anywhere on any row toggles selection for that row.
  // With highlight selection, onAction is secondary, and occurs on double click. Single click selects the row.
  // With touch, onAction occurs on single tap, and long press enters selection mode.
  let isLinkOverride = manager.isLink(key) && linkBehavior === 'override';
  let hasLinkAction = manager.isLink(key) && linkBehavior !== 'selection' && linkBehavior !== 'none';
  let allowsSelection = !isDisabled && manager.canSelectItem(key) && !isLinkOverride;
  let allowsActions = (onAction || hasLinkAction) && !isDisabled;
  let hasPrimaryAction = allowsActions && (
    manager.selectionBehavior === 'replace'
      ? !allowsSelection
      : !allowsSelection || manager.isEmpty
  );
  let hasSecondaryAction = allowsActions && allowsSelection && manager.selectionBehavior === 'replace';
  let hasAction = hasPrimaryAction || hasSecondaryAction;
  let modality = useRef(null);

  let longPressEnabled = hasAction && allowsSelection;
  let longPressEnabledOnPressStart = useRef(false);
  let hadPrimaryActionOnPressStart = useRef(false);

  let performAction = (e) => {
    if (onAction) {
      onAction();
    }

    if (hasLinkAction) {
      let itemProps = manager.getItemProps(key);
      router.open(ref.current, e, itemProps.href, itemProps.routerOptions);
    }
  };

  // By default, selection occurs on pointer down. This can be strange if selecting an
  // item causes the UI to disappear immediately (e.g. menus).
  // If shouldSelectOnPressUp is true, we use onPressUp instead of onPressStart.
  // onPress requires a pointer down event on the same element as pointer up. For menus,
  // we want to be able to have the pointer down on the trigger that opens the menu and
  // the pointer up on the menu item rather than requiring a separate press.
  // For keyboard events, selection still occurs on key down.
  let itemPressProps: PressProps = {};
  if (shouldSelectOnPressUp) {
    itemPressProps.onPressStart = (e) => {
      modality.current = e.pointerType;
      longPressEnabledOnPressStart.current = longPressEnabled;
      if (e.pointerType === 'keyboard' && (!hasAction || isSelectionKey())) {
        onSelect(e);
      }
    };

    // If allowsDifferentPressOrigin, make selection happen on pressUp (e.g. open menu on press down, selection on menu item happens on press up.)
    // Otherwise, have selection happen onPress (prevents listview row selection when clicking on interactable elements in the row)
    if (!allowsDifferentPressOrigin) {
      itemPressProps.onPress = (e) => {
        if (hasPrimaryAction || (hasSecondaryAction && e.pointerType !== 'mouse')) {
          if (e.pointerType === 'keyboard' && !isActionKey()) {
            return;
          }

          performAction(e);
        } else if (e.pointerType !== 'keyboard' && allowsSelection) {
          onSelect(e);
        }
      };
    } else {
      itemPressProps.onPressUp = hasPrimaryAction ? null : (e) => {
        if (e.pointerType !== 'keyboard' && allowsSelection) {
          onSelect(e);
        }
      };

      itemPressProps.onPress = hasPrimaryAction ? performAction : null;
    }
  } else {
    itemPressProps.onPressStart = (e) => {
      modality.current = e.pointerType;
      longPressEnabledOnPressStart.current = longPressEnabled;
      hadPrimaryActionOnPressStart.current = hasPrimaryAction;

      // Select on mouse down unless there is a primary action which will occur on mouse up.
      // For keyboard, select on key down. If there is an action, the Space key selects on key down,
      // and the Enter key performs onAction on key up.
      if (
        allowsSelection && (
          (e.pointerType === 'mouse' && !hasPrimaryAction) ||
          (e.pointerType === 'keyboard' && (!allowsActions || isSelectionKey()))
        )
      ) {
        onSelect(e);
      }
    };

    itemPressProps.onPress = (e) => {
      // Selection occurs on touch up. Primary actions always occur on pointer up.
      // Both primary and secondary actions occur on Enter key up. The only exception
      // is secondary actions, which occur on double click with a mouse.
      if (
        e.pointerType === 'touch' ||
        e.pointerType === 'pen' ||
        e.pointerType === 'virtual' ||
        (e.pointerType === 'keyboard' && hasAction && isActionKey()) ||
        (e.pointerType === 'mouse' && hadPrimaryActionOnPressStart.current)
      ) {
        if (hasAction) {
          performAction(e);
        } else if (allowsSelection) {
          onSelect(e);
        }
      }
    };
  }

  itemProps['data-key'] = key;
  itemPressProps.preventFocusOnPress = shouldUseVirtualFocus;
  let {pressProps, isPressed} = usePress(itemPressProps);

  // Double clicking with a mouse with selectionBehavior = 'replace' performs an action.
  let onDoubleClick = hasSecondaryAction ? (e) => {
    if (modality.current === 'mouse') {
      e.stopPropagation();
      e.preventDefault();
      performAction(e);
    }
  } : undefined;

  // Long pressing an item with touch when selectionBehavior = 'replace' switches the selection behavior
  // to 'toggle'. This changes the single tap behavior from performing an action (i.e. navigating) to
  // selecting, and may toggle the appearance of a UI affordance like checkboxes on each item.
  let {longPressProps} = useLongPress({
    isDisabled: !longPressEnabled,
    onLongPress(e) {
      if (e.pointerType === 'touch') {
        onSelect(e);
        manager.setSelectionBehavior('toggle');
      }
    }
  });

  // Prevent native drag and drop on long press if we also select on long press.
  // Once the user is in selection mode, they can long press again to drag.
  // Use a capturing listener to ensure this runs before useDrag, regardless of
  // the order the props get merged.
  let onDragStartCapture = e => {
    if (modality.current === 'touch' && longPressEnabledOnPressStart.current) {
      e.preventDefault();
    }
  };

  // Prevent default on link clicks so that we control exactly
  // when they open (to match selection behavior).
  let onClick = manager.isLink(key) ? e => {
    if (!(openLink as any).isOpening) {
      e.preventDefault();
    }
  } : undefined;

  return {
    itemProps: mergeProps(
      itemProps,
      allowsSelection || hasPrimaryAction ? pressProps : {},
      longPressEnabled ? longPressProps : {},
      {onDoubleClick, onDragStartCapture, onClick}
    ),
    isPressed,
    isSelected: manager.isSelected(key),
    isFocused: manager.isFocused && manager.focusedKey === key,
    isDisabled,
    allowsSelection,
    hasAction
  };
}

function isActionKey() {
  let event = window.event as KeyboardEvent;
  return event?.key === 'Enter';
}

function isSelectionKey() {
  let event = window.event as KeyboardEvent;
  return event?.key === ' ' || event?.code === 'Space';
}
