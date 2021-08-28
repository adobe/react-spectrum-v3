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

import {announce} from '@react-aria/live-announcer';
import {AriaButtonProps} from '@react-types/button';
import {ariaHideOutside} from '@react-aria/overlays';
import {AriaListBoxOptions, getItemId, listData} from '@react-aria/listbox';
import {chain, isAppleDevice, mergeProps, useLabels} from '@react-aria/utils';
import {ComboBoxProps} from '@react-types/combobox';
import {ComboBoxState} from '@react-stately/combobox';
import {FocusEvent, HTMLAttributes, InputHTMLAttributes, KeyboardEvent, RefObject, TouchEvent, useEffect, useMemo, useRef} from 'react';
import {getItemCount} from '@react-stately/collections';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {KeyboardDelegate, PressEvent} from '@react-types/shared';
import {ListKeyboardDelegate, useSelectableCollection} from '@react-aria/selection';
import {useMenuTrigger} from '@react-aria/menu';
import {useMessageFormatter} from '@react-aria/i18n';
import {useTextField} from '@react-aria/textfield';

interface AriaComboBoxProps<T> extends ComboBoxProps<T> {
  /** The ref for the input element. */
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
  /** The ref for the list box popover. */
  popoverRef: RefObject<HTMLDivElement>,
  /** The ref for the list box. */
  listBoxRef: RefObject<HTMLElement>,
  /** The ref for the optional list box popup trigger button.  */
  buttonRef?: RefObject<HTMLElement>,
  /** An optional keyboard delegate implementation, to override the default. */
  keyboardDelegate?: KeyboardDelegate
}

interface ComboBoxAria<T> {
  /** Props for the label element. */
  labelProps: HTMLAttributes<HTMLElement>,
  /** Props for the combo box input element. */
  inputProps: InputHTMLAttributes<HTMLInputElement>,
  /** Props for the list box, to be passed to [useListBox](useListBox.html). */
  listBoxProps: AriaListBoxOptions<T>,
  /** Props for the optional trigger button, to be passed to [useButton](useButton.html). */
  buttonProps: AriaButtonProps,
  /** Props for the combo box description element, if any. */
  descriptionProps: HTMLAttributes<HTMLElement>,
  /** Props for the combo box error message element, if any. */
  errorMessageProps: HTMLAttributes<HTMLElement>
}

/**
 * Provides the behavior and accessibility implementation for a combo box component.
 * A combo box combines a text input with a listbox, allowing users to filter a list of options to items matching a query.
 * @param props - Props for the combo box.
 * @param state - State for the select, as returned by `useComboBoxState`.
 */
export function useComboBox<T>(props: AriaComboBoxProps<T>, state: ComboBoxState<T>): ComboBoxAria<T> {
  let {
    buttonRef,
    popoverRef,
    inputRef,
    listBoxRef,
    keyboardDelegate,
    // completionMode = 'suggest',
    isReadOnly,
    isDisabled
  } = props;

  let formatMessage = useMessageFormatter(intlMessages);
  let {menuTriggerProps, menuProps} = useMenuTrigger(
    {
      type: 'listbox'
    },
    state,
    buttonRef
  );

  // Set listbox id so it can be used when calling getItemId later
  listData.set(state, {id: menuProps.id});

  // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
  // When virtualized, the layout object will be passed in as a prop and override this.
  let delegate = useMemo(() =>
    keyboardDelegate ||
    new ListKeyboardDelegate(state.collection, state.disabledKeys, listBoxRef)
  , [keyboardDelegate, state.collection, state.disabledKeys, listBoxRef]);

  // Use useSelectableCollection to get the keyboard handlers to apply to the textfield
  let {collectionProps} = useSelectableCollection({
    selectionManager: state.selectionManager,
    keyboardDelegate: delegate,
    disallowTypeAhead: true,
    disallowEmptySelection: true,
    ref: inputRef,
    // Prevent item scroll behavior from being applied here, should be handled in the user's Popover + ListBox component
    isVirtualized: true
  });

  // For textfield specific keydown operations
  let onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case 'Tab':
        // Prevent form submission if menu is open since we may be selecting a option
        if (state.isOpen && e.key === 'Enter') {
          e.preventDefault();
        }

        state.commit();
        break;
      case 'Escape':
        state.revert();
        break;
      case 'ArrowDown':
        state.open('first', 'manual');
        break;
      case 'ArrowUp':
        state.open('last', 'manual');
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        state.selectionManager.setFocusedKey(null);
        break;
    }
  };

  let onBlur = (e: FocusEvent) => {
    // Ignore blur if focused moved to the button or into the popover.
    if (e.relatedTarget === buttonRef?.current || popoverRef.current?.contains(e.relatedTarget as HTMLElement)) {
      return;
    }

    if (props.onBlur) {
      props.onBlur(e);
    }

    state.setFocused(false);
  };

  let onFocus = (e: FocusEvent) => {
    if (state.isFocused) {
      return;
    }

    if (props.onFocus) {
      props.onFocus(e);
    }

    state.setFocused(true);
  };

  let {labelProps, inputProps, descriptionProps, errorMessageProps} = useTextField({
    ...props,
    onChange: state.setInputValue,
    onKeyDown: !isReadOnly && chain(state.isOpen && collectionProps.onKeyDown, onKeyDown),
    onBlur,
    value: state.inputValue,
    onFocus,
    autoComplete: 'off'
  }, inputRef);

  // Press handlers for the ComboBox button
  let onPress = (e: PressEvent) => {
    if (e.pointerType === 'touch') {
      // Focus the input field in case it isn't focused yet
      inputRef.current.focus();
      state.toggle(null, 'manual');
    }
  };

  let onPressStart = (e: PressEvent) => {
    if (e.pointerType !== 'touch') {
      inputRef.current.focus();
      state.toggle((e.pointerType === 'keyboard' || e.pointerType === 'virtual') ? 'first' : null, 'manual');
    }
  };

  let triggerLabelProps = useLabels({
    id: menuTriggerProps.id,
    'aria-label': formatMessage('buttonLabel'),
    'aria-labelledby': props['aria-labelledby'] || labelProps.id
  });

  let listBoxProps = useLabels({
    id: menuProps.id,
    'aria-label': formatMessage('listboxLabel'),
    'aria-labelledby': props['aria-labelledby'] || labelProps.id
  });

  // If a touch happens on direct center of ComboBox input, might be virtual click from iPad so open ComboBox menu
  let lastEventTime = useRef(0);
  let onTouchEnd = (e: TouchEvent) => {
    if (isDisabled || isReadOnly) {
      return;
    }

    // Sometimes VoiceOver on iOS fires two touchend events in quick succession. Ignore the second one.
    if (e.timeStamp - lastEventTime.current < 500) {
      e.preventDefault();
      inputRef.current.focus();
      return;
    }

    let rect = (e.target as HTMLElement).getBoundingClientRect();
    let touch = e.changedTouches[0];

    let centerX = Math.ceil(rect.left + .5 * rect.width);
    let centerY = Math.ceil(rect.top + .5 * rect.height);

    if (touch.clientX === centerX && touch.clientY === centerY) {
      e.preventDefault();
      inputRef.current.focus();
      state.toggle(null, 'manual');

      lastEventTime.current = e.timeStamp;
    }
  };

  // VoiceOver has issues with announcing aria-activedescendant properly on change
  // (especially on iOS). We use a live region announcer to announce focus changes
  // manually. In addition, section titles are announced when navigating into a new section.
  let focusedItem = state.selectionManager.focusedKey != null && state.isOpen
    ? state.collection.getItem(state.selectionManager.focusedKey)
    : undefined;
  let sectionKey = focusedItem?.parentKey ?? null;
  let itemKey = state.selectionManager.focusedKey ?? null;
  let lastSection = useRef(sectionKey);
  let lastItem = useRef(itemKey);
  useEffect(() => {
    if (isAppleDevice() && focusedItem != null && itemKey !== lastItem.current) {
      let isSelected = state.selectionManager.isSelected(itemKey);
      let section = sectionKey != null ? state.collection.getItem(sectionKey) : null;
      let sectionTitle = section?.['aria-label'] || (typeof section?.rendered === 'string' ? section.rendered : '') || '';

      let announcement = formatMessage('focusAnnouncement', {
        isGroupChange: section && sectionKey !== lastSection.current,
        groupTitle: sectionTitle,
        groupCount: section ? [...section.childNodes].length : 0,
        optionText: focusedItem['aria-label'] || focusedItem.textValue || '',
        isSelected
      });

      announce(announcement);
    }

    lastSection.current = sectionKey;
    lastItem.current = itemKey;
  });

  // Announce the number of available suggestions when it changes
  let optionCount = getItemCount(state.collection);
  let lastSize = useRef(optionCount);
  let lastOpen = useRef(state.isOpen);
  useEffect(() => {
    // Only announce the number of options available when the menu opens if there is no
    // focused item, otherwise screen readers will typically read e.g. "1 of 6".
    // The exception is VoiceOver since this isn't included in the message above.
    let didOpenWithoutFocusedItem =
      state.isOpen !== lastOpen.current &&
      (state.selectionManager.focusedKey == null || isAppleDevice());

    if (state.isOpen && (didOpenWithoutFocusedItem || optionCount !== lastSize.current)) {
      let announcement = formatMessage('countAnnouncement', {optionCount});
      announce(announcement);
    }

    lastSize.current = optionCount;
    lastOpen.current = state.isOpen;
  });

  // Announce when a selection occurs for VoiceOver. Other screen readers typically do this automatically.
  let lastSelectedKey = useRef(state.selectedKey);
  useEffect(() => {
    if (isAppleDevice() && state.isFocused && state.selectedItem && state.selectedKey !== lastSelectedKey.current) {
      let optionText = state.selectedItem['aria-label'] || state.selectedItem.textValue || '';
      let announcement = formatMessage('selectedAnnouncement', {optionText});
      announce(announcement);
    }

    lastSelectedKey.current = state.selectedKey;
  });

  useEffect(() => {
    if (state.isOpen) {
      return ariaHideOutside([inputRef.current, popoverRef.current]);
    }
  }, [state.isOpen, inputRef, popoverRef]);

  return {
    labelProps,
    buttonProps: {
      ...menuTriggerProps,
      ...triggerLabelProps,
      excludeFromTabOrder: true,
      onPress,
      onPressStart
    },
    inputProps: mergeProps(inputProps, {
      role: 'combobox',
      'aria-expanded': menuTriggerProps['aria-expanded'],
      'aria-controls': state.isOpen ? menuProps.id : undefined,
      // TODO: readd proper logic for completionMode = complete (aria-autocomplete: both)
      'aria-autocomplete': 'list',
      'aria-activedescendant': focusedItem ? getItemId(state, focusedItem.key) : undefined,
      onTouchEnd,
      // This disable's iOS's autocorrect suggestions, since the combo box provides its own suggestions.
      autoCorrect: 'off',
      // This disable's the macOS Safari spell check auto corrections.
      spellCheck: 'false'
    }),
    listBoxProps: mergeProps(menuProps, listBoxProps, {
      autoFocus: state.focusStrategy,
      shouldUseVirtualFocus: true,
      shouldSelectOnPressUp: true,
      shouldFocusOnHover: true
    }),
    descriptionProps,
    errorMessageProps
  };
}
