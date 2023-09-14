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

import {DOMAttributes, FocusableElement, FocusStrategy, KeyboardDelegate} from '@react-types/shared';
import {FocusEvent, Key, KeyboardEvent, RefObject, useEffect, useRef} from 'react';
import {focusSafely, getFocusableTreeWalker} from '@react-aria/focus';
import {focusWithoutScrolling, isAndroid, isIOS, mergeProps, scrollIntoView, scrollIntoViewport, useEvent} from '@react-aria/utils';
import {getInteractionModality} from '@react-aria/interactions';
import {isCtrlKeyPressed, isNonContiguousSelectionModifier} from './utils';
import {MultipleSelectionManager} from '@react-stately/selection';
import {useLocale} from '@react-aria/i18n';
import {useTypeSelect} from './useTypeSelect';

export interface AriaSelectableCollectionOptions {
  /**
   * An interface for reading and updating multiple selection state.
   */
  selectionManager: MultipleSelectionManager,
  /**
   * A delegate object that implements behavior for keyboard focus movement.
   */
  keyboardDelegate: KeyboardDelegate,
  /**
   * The ref attached to the element representing the collection.
   */
  ref: RefObject<HTMLElement>,
  /**
   * Whether the collection or one of its items should be automatically focused upon render.
   * @default false
   */
  autoFocus?: boolean | FocusStrategy,
  /**
   * Whether focus should wrap around when the end/start is reached.
   * @default false
   */
  shouldFocusWrap?: boolean,
  /**
   * Whether the collection allows empty selection.
   * @default false
   */
  disallowEmptySelection?: boolean,
  /**
   * Whether the collection allows the user to select all items via keyboard shortcut.
   * @default false
   */
  disallowSelectAll?: boolean,
  /**
   * Whether selection should occur automatically on focus.
   * @default false
   */
  selectOnFocus?: boolean,
  /**
   * Whether typeahead is disabled.
   * @default false
   */
  disallowTypeAhead?: boolean,
  /**
   * Whether the collection items should use virtual focus instead of being focused directly.
   */
  shouldUseVirtualFocus?: boolean,
  /**
   * Whether navigation through tab key is enabled.
   */
  allowsTabNavigation?: boolean,
  /**
   * Whether the collection items are contained in a virtual scroller.
   */
  isVirtualized?: boolean,
  /**
   * The ref attached to the scrollable body. Used to provide automatic scrolling on item focus for non-virtualized collections.
   * If not provided, defaults to the collection ref.
   */
  scrollRef?: RefObject<HTMLElement>
}

export interface SelectableCollectionAria {
  /** Props for the collection element. */
  collectionProps: DOMAttributes
}

/**
 * Handles interactions with selectable collections.
 */
export function useSelectableCollection(options: AriaSelectableCollectionOptions): SelectableCollectionAria {
  let {
    selectionManager: manager,
    keyboardDelegate: delegate,
    ref,
    autoFocus = false,
    shouldFocusWrap = false,
    disallowEmptySelection = false,
    disallowSelectAll = false,
    selectOnFocus = manager.selectionBehavior === 'replace',
    disallowTypeAhead = false,
    shouldUseVirtualFocus,
    allowsTabNavigation = false,
    isVirtualized,
    // If no scrollRef is provided, assume the collection ref is the scrollable region
    scrollRef = ref
  } = options;
  let {direction} = useLocale();


  let onKeyDown = (e: KeyboardEvent) => {
    // Prevent option + tab from doing anything since it doesn't move focus to the cells, only buttons/checkboxes
    if (e.altKey && e.key === 'Tab') {
      e.preventDefault();
    }

    // Keyboard events bubble through portals. Don't handle keyboard events
    // for elements outside the collection (e.g. menus).
    if (!ref.current.contains(e.target as Element)) {
      return;
    }

    const navigateToKey = (key: Key | undefined, childFocus?: FocusStrategy) => {
      if (key != null) {
        manager.setFocusedKey(key, childFocus);

        if (e.shiftKey && manager.selectionMode === 'multiple') {
          manager.extendSelection(key);
        } else if (selectOnFocus && !isNonContiguousSelectionModifier(e)) {
          manager.replaceSelection(key);
        }
      }
    };

    switch (e.key) {
      case 'ArrowDown': {
        if (delegate.getKeyBelow) {
          e.preventDefault();
          let nextKey = manager.focusedKey != null
              ? delegate.getKeyBelow(manager.focusedKey)
              : delegate.getFirstKey?.();
          if (nextKey == null && shouldFocusWrap) {
            nextKey = delegate.getFirstKey?.(manager.focusedKey);
          }
          navigateToKey(nextKey);
        }
        break;
      }
      case 'ArrowUp': {
        if (delegate.getKeyAbove) {
          e.preventDefault();
          let nextKey = manager.focusedKey != null
              ? delegate.getKeyAbove(manager.focusedKey)
              : delegate.getLastKey?.();
          if (nextKey == null && shouldFocusWrap) {
            nextKey = delegate.getLastKey?.(manager.focusedKey);
          }
          navigateToKey(nextKey);
        }
        break;
      }
      case 'ArrowLeft': {
        if (delegate.getKeyLeftOf) {
          e.preventDefault();
          let nextKey = delegate.getKeyLeftOf(manager.focusedKey);
          if (nextKey == null && shouldFocusWrap) {
            nextKey = direction === 'rtl' ? delegate.getFirstKey?.(manager.focusedKey) : delegate.getLastKey?.(manager.focusedKey);
          }
          navigateToKey(nextKey, direction === 'rtl' ? 'first' : 'last');
        }
        break;
      }
      case 'ArrowRight': {
        if (delegate.getKeyRightOf) {
          e.preventDefault();
          let nextKey = delegate.getKeyRightOf(manager.focusedKey);
          if (nextKey == null && shouldFocusWrap) {
            nextKey = direction === 'rtl' ? delegate.getLastKey?.(manager.focusedKey) : delegate.getFirstKey?.(manager.focusedKey);
          }
          navigateToKey(nextKey, direction === 'rtl' ? 'last' : 'first');
        }
        break;
      }
      case 'Home':
        if (delegate.getFirstKey) {
          e.preventDefault();
          let firstKey = delegate.getFirstKey(manager.focusedKey, isCtrlKeyPressed(e));
          manager.setFocusedKey(firstKey);
          if (isCtrlKeyPressed(e) && e.shiftKey && manager.selectionMode === 'multiple') {
            manager.extendSelection(firstKey);
          } else if (selectOnFocus) {
            manager.replaceSelection(firstKey);
          }
        }
        break;
      case 'End':
        if (delegate.getLastKey) {
          e.preventDefault();
          let lastKey = delegate.getLastKey(manager.focusedKey, isCtrlKeyPressed(e));
          manager.setFocusedKey(lastKey);
          if (isCtrlKeyPressed(e) && e.shiftKey && manager.selectionMode === 'multiple') {
            manager.extendSelection(lastKey);
          } else if (selectOnFocus) {
            manager.replaceSelection(lastKey);
          }
        }
        break;
      case 'PageDown':
        if (delegate.getKeyPageBelow) {
          e.preventDefault();
          let nextKey = delegate.getKeyPageBelow(manager.focusedKey);
          navigateToKey(nextKey);
        }
        break;
      case 'PageUp':
        if (delegate.getKeyPageAbove) {
          e.preventDefault();
          let nextKey = delegate.getKeyPageAbove(manager.focusedKey);
          navigateToKey(nextKey);
        }
        break;
      case 'a':
        if (isCtrlKeyPressed(e) && manager.selectionMode === 'multiple' && disallowSelectAll !== true) {
          e.preventDefault();
          manager.selectAll();
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (!disallowEmptySelection) {
          manager.clearSelection();
        }
        break;
      case 'Tab': {
        if (!allowsTabNavigation) {
          // There may be elements that are "tabbable" inside a collection (e.g. in a grid cell).
          // However, collections should be treated as a single tab stop, with arrow key navigation internally.
          // We don't control the rendering of these, so we can't override the tabIndex to prevent tabbing.
          // Instead, we handle the Tab key, and move focus manually to the first/last tabbable element
          // in the collection, so that the browser default behavior will apply starting from that element
          // rather than the currently focused one.
          if (e.shiftKey) {
            ref.current.focus();
          } else {
            let walker = getFocusableTreeWalker(ref.current, {tabbable: true});
            let next: FocusableElement;
            let last: FocusableElement;
            do {
              last = walker.lastChild() as FocusableElement;
              if (last) {
                next = last;
              }
            } while (last);

            if (next && !next.contains(document.activeElement)) {
              focusWithoutScrolling(next);
            }
          }
          break;
        }
      }
    }
  };

  // Store the scroll position so we can restore it later.
  let scrollPos = useRef({top: 0, left: 0});
  useEvent(scrollRef, 'scroll', isVirtualized ? null : () => {
    scrollPos.current = {
      top: scrollRef.current.scrollTop,
      left: scrollRef.current.scrollLeft
    };
  });

  let onFocus = (e: FocusEvent) => {
    if (manager.isFocused) {
      // If a focus event bubbled through a portal, reset focus state.
      if (!e.currentTarget.contains(e.target)) {
        manager.setFocused(false);
      }

      return;
    }

    // Focus events can bubble through portals. Ignore these events.
    if (!e.currentTarget.contains(e.target)) {
      return;
    }

    manager.setFocused(true);

    if (manager.focusedKey == null) {
      let navigateToFirstKey = (key: Key | undefined) => {
        if (key != null) {
          manager.setFocusedKey(key);
          if (selectOnFocus) {
            manager.replaceSelection(key);
          }
        }
      };
      // If the user hasn't yet interacted with the collection, there will be no focusedKey set.
      // Attempt to detect whether the user is tabbing forward or backward into the collection
      // and either focus the first or last item accordingly.
      let relatedTarget = e.relatedTarget as Element;
      if (relatedTarget && (e.currentTarget.compareDocumentPosition(relatedTarget) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        navigateToFirstKey(manager.lastSelectedKey ?? delegate.getLastKey());
      } else {
        navigateToFirstKey(manager.firstSelectedKey ?? delegate.getFirstKey());
      }
    } else if (!isVirtualized) {
      // Restore the scroll position to what it was before.
      scrollRef.current.scrollTop = scrollPos.current.top;
      scrollRef.current.scrollLeft = scrollPos.current.left;
    }

    if (!isVirtualized && manager.focusedKey != null) {
      // Refocus and scroll the focused item into view if it exists within the scrollable region.
      let element = scrollRef.current.querySelector(`[data-key="${manager.focusedKey}"]`) as HTMLElement;
      if (element) {
        // This prevents a flash of focus on the first/last element in the collection, or the collection itself.
        if (!element.contains(document.activeElement)) {
          focusWithoutScrolling(element);
        }

        let modality = getInteractionModality();
        if (modality === 'keyboard') {
          scrollIntoViewport(element, {containingElement: ref.current});
        }
      }
    }
  };

  let onBlur = (e) => {
    // Don't set blurred and then focused again if moving focus within the collection.
    if (!e.currentTarget.contains(e.relatedTarget as HTMLElement)) {
      manager.setFocused(false);
    }
  };

  const autoFocusRef = useRef(autoFocus);
  useEffect(() => {
    if (autoFocusRef.current) {
      let focusedKey = null;

      // Check focus strategy to determine which item to focus
      if (autoFocus === 'first') {
        focusedKey = delegate.getFirstKey();
      } if (autoFocus === 'last') {
        focusedKey = delegate.getLastKey();
      }

      // If there are any selected keys, make the first one the new focus target
      let selectedKeys = manager.selectedKeys;
      if (selectedKeys.size) {
        focusedKey = selectedKeys.values().next().value;
      }

      manager.setFocused(true);
      manager.setFocusedKey(focusedKey);

      // If no default focus key is selected, focus the collection itself.
      if (focusedKey == null && !shouldUseVirtualFocus) {
        focusSafely(ref.current);
      }
    }
    autoFocusRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If not virtualized, scroll the focused element into view when the focusedKey changes.
  // When virtualized, Virtualizer handles this internally.
  let lastFocusedKey = useRef(manager.focusedKey);
  useEffect(() => {
    let modality = getInteractionModality();
    if (manager.isFocused && manager.focusedKey != null && scrollRef?.current) {
      let element = scrollRef.current.querySelector(`[data-key="${manager.focusedKey}"]`) as HTMLElement;
      if (element && modality === 'keyboard') {
        if (!isVirtualized) {
          scrollIntoView(scrollRef.current, element);
        }
        scrollIntoViewport(element, {containingElement: ref.current});
      }
    }

    // If the focused key becomes null (e.g. the last item is deleted), focus the whole collection.
    if (manager.isFocused && manager.focusedKey == null && lastFocusedKey.current != null) {
      focusSafely(ref.current);
    }

    lastFocusedKey.current = manager.focusedKey;
  }, [isVirtualized, scrollRef, manager.focusedKey, manager.isFocused, ref]);

  let handlers = {
    onKeyDown,
    onFocus,
    onBlur,
    onMouseDown(e) {
      // Ignore events that bubbled through portals.
      if (scrollRef.current === e.target) {
        // Prevent focus going to the collection when clicking on the scrollbar.
        e.preventDefault();
      }
    }
  };

  let {typeSelectProps} = useTypeSelect({
    keyboardDelegate: delegate,
    selectionManager: manager
  });

  if (!disallowTypeAhead) {
    handlers = mergeProps(typeSelectProps, handlers);
  }

  let tabIndex: number;
  let isMobile = isAndroid() || isIOS();
  if (!isMobile) {
    tabIndex = manager.focusedKey == null ? 0 : -1;
  }

  return {
    collectionProps: {
      ...handlers,
      tabIndex
    }
  };
}
