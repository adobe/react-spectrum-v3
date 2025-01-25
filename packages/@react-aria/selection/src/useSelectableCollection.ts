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

import {CLEAR_FOCUS_EVENT, FOCUS_EVENT, focusWithoutScrolling, isCtrlKeyPressed, mergeProps, scrollIntoView, scrollIntoViewport, UPDATE_ACTIVEDESCENDANT, useEffectEvent, useEvent, useRouter, useUpdateLayoutEffect} from '@react-aria/utils';
import {DOMAttributes, FocusableElement, FocusStrategy, Key, KeyboardDelegate, RefObject} from '@react-types/shared';
import {flushSync} from 'react-dom';
import {FocusEvent, KeyboardEvent, useEffect, useRef} from 'react';
import {focusSafely, getFocusableTreeWalker} from '@react-aria/focus';
import {getInteractionModality} from '@react-aria/interactions';
import {getNodeKey} from '@react-aria/collections';
import {isNonContiguousSelectionModifier} from './utils';
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
  ref: RefObject<HTMLElement | null>,
  /** A scope to prepend to all child node keys to ensure they are unique. */
  idScope?: Key,
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
  scrollRef?: RefObject<HTMLElement | null>,
  /**
   * The behavior of links in the collection.
   * - 'action': link behaves like onAction.
   * - 'selection': link follows selection interactions (e.g. if URL drives selection).
   * - 'override': links override all other interactions (link items are not selectable).
   * @default 'action'
   */
  linkBehavior?: 'action' | 'selection' | 'override'
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
    idScope,
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
    scrollRef = ref,
    linkBehavior = 'action'
  } = options;
  let {direction} = useLocale();
  let router = useRouter();

  let onKeyDown = (e: KeyboardEvent) => {
    // Prevent option + tab from doing anything since it doesn't move focus to the cells, only buttons/checkboxes
    if (e.altKey && e.key === 'Tab') {
      e.preventDefault();
    }

    // Keyboard events bubble through portals. Don't handle keyboard events
    // for elements outside the collection (e.g. menus).
    if (!ref.current?.contains(e.target as Element)) {
      return;
    }

    const navigateToKey = (key: Key | undefined, childFocus?: FocusStrategy) => {
      if (key != null) {
        if (manager.isLink(key) && linkBehavior === 'selection' && selectOnFocus && !isNonContiguousSelectionModifier(e)) {
          // Set focused key and re-render synchronously to bring item into view if needed.
          flushSync(() => {
            manager.setFocusedKey(key, childFocus);
          });

          let item = scrollRef.current?.querySelector(`[data-key="${CSS.escape(getNodeKey(key, idScope))}"]`);
          let itemProps = manager.getItemProps(key);
          if (item) {
            router.open(item, e, itemProps.href, itemProps.routerOptions);
          }

          return;
        }

        manager.setFocusedKey(key, childFocus);

        if (manager.isLink(key) && linkBehavior === 'override') {
          return;
        }

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
          let nextKey = manager.focusedKey != null
              ? delegate.getKeyBelow?.(manager.focusedKey)
              : delegate.getFirstKey?.();
          if (nextKey == null && shouldFocusWrap) {
            nextKey = delegate.getFirstKey?.(manager.focusedKey);
          }
          if (nextKey != null) {
            e.preventDefault();
            navigateToKey(nextKey);
          }
        }
        break;
      }
      case 'ArrowUp': {
        if (delegate.getKeyAbove) {
          let nextKey = manager.focusedKey != null
              ? delegate.getKeyAbove?.(manager.focusedKey)
              : delegate.getLastKey?.();
          if (nextKey == null && shouldFocusWrap) {
            nextKey = delegate.getLastKey?.(manager.focusedKey);
          }
          if (nextKey != null) {
            e.preventDefault();
            navigateToKey(nextKey);
          }
        }
        break;
      }
      case 'ArrowLeft': {
        if (delegate.getKeyLeftOf) {
          let nextKey: Key | undefined | null = manager.focusedKey != null ? delegate.getKeyLeftOf?.(manager.focusedKey) : null;
          if (nextKey == null && shouldFocusWrap) {
            nextKey = direction === 'rtl' ? delegate.getFirstKey?.(manager.focusedKey) : delegate.getLastKey?.(manager.focusedKey);
          }
          if (nextKey != null) {
            e.preventDefault();
            navigateToKey(nextKey, direction === 'rtl' ? 'first' : 'last');
          }
        }
        break;
      }
      case 'ArrowRight': {
        if (delegate.getKeyRightOf) {
          let nextKey: Key | undefined | null = manager.focusedKey != null ? delegate.getKeyRightOf?.(manager.focusedKey) : null;
          if (nextKey == null && shouldFocusWrap) {
            nextKey = direction === 'rtl' ? delegate.getLastKey?.(manager.focusedKey) : delegate.getFirstKey?.(manager.focusedKey);
          }
          if (nextKey != null) {
            e.preventDefault();
            navigateToKey(nextKey, direction === 'rtl' ? 'last' : 'first');
          }
        }
        break;
      }
      case 'Home':
        if (delegate.getFirstKey) {
          if (manager.focusedKey === null && e.shiftKey) {
            return;
          }
          e.preventDefault();
          let firstKey: Key | null = delegate.getFirstKey(manager.focusedKey, isCtrlKeyPressed(e));
          manager.setFocusedKey(firstKey);
          if (firstKey != null) {
            if (isCtrlKeyPressed(e) && e.shiftKey && manager.selectionMode === 'multiple') {
              manager.extendSelection(firstKey);
            } else if (selectOnFocus) {
              manager.replaceSelection(firstKey);
            }
          }
        }
        break;
      case 'End':
        if (delegate.getLastKey) {
          if (manager.focusedKey === null && e.shiftKey) {
            return;
          }
          e.preventDefault();
          let lastKey = delegate.getLastKey(manager.focusedKey, isCtrlKeyPressed(e));
          manager.setFocusedKey(lastKey);
          if (lastKey != null) {
            if (isCtrlKeyPressed(e) && e.shiftKey && manager.selectionMode === 'multiple') {
              manager.extendSelection(lastKey);
            } else if (selectOnFocus) {
              manager.replaceSelection(lastKey);
            }
          }
        }
        break;
      case 'PageDown':
        if (delegate.getKeyPageBelow && manager.focusedKey != null) {
          let nextKey = delegate.getKeyPageBelow(manager.focusedKey);
          if (nextKey != null) {
            e.preventDefault();
            navigateToKey(nextKey);
          }
        }
        break;
      case 'PageUp':
        if (delegate.getKeyPageAbove && manager.focusedKey != null) {
          let nextKey = delegate.getKeyPageAbove(manager.focusedKey);
          if (nextKey != null) {
            e.preventDefault();
            navigateToKey(nextKey);
          }
        }
        break;
      case 'a':
        if (isCtrlKeyPressed(e) && manager.selectionMode === 'multiple' && disallowSelectAll !== true) {
          e.preventDefault();
          manager.selectAll();
        }
        break;
      case 'Escape':
        if (!disallowEmptySelection && manager.selectedKeys.size !== 0) {
          e.stopPropagation();
          e.preventDefault();
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
            let next: FocusableElement | undefined = undefined;
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
  /// TODO: should this happen all the time??
  let scrollPos = useRef({top: 0, left: 0});
  useEvent(scrollRef, 'scroll', isVirtualized ? undefined : () => {
    scrollPos.current = {
      top: scrollRef.current?.scrollTop ?? 0,
      left: scrollRef.current?.scrollLeft ?? 0
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
      let navigateToKey = (key: Key | undefined | null) => {
        if (key != null) {
          manager.setFocusedKey(key);
          if (selectOnFocus && !manager.isSelected(key)) {
            manager.replaceSelection(key);
          }
        }
      };
      // If the user hasn't yet interacted with the collection, there will be no focusedKey set.
      // Attempt to detect whether the user is tabbing forward or backward into the collection
      // and either focus the first or last item accordingly.
      let relatedTarget = e.relatedTarget as Element;
      if (relatedTarget && (e.currentTarget.compareDocumentPosition(relatedTarget) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        navigateToKey(manager.lastSelectedKey ?? delegate.getLastKey?.());
      } else {
        navigateToKey(manager.firstSelectedKey ?? delegate.getFirstKey?.());
      }
    } else if (!isVirtualized && scrollRef.current) {
      // Restore the scroll position to what it was before.
      scrollRef.current.scrollTop = scrollPos.current.top;
      scrollRef.current.scrollLeft = scrollPos.current.left;
    }

    if (manager.focusedKey != null && scrollRef.current) {
      // Refocus and scroll the focused item into view if it exists within the scrollable region.
      let element = scrollRef.current.querySelector(`[data-key="${CSS.escape(getNodeKey(manager.focusedKey, idScope))}"]`) as HTMLElement;
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

  // Ref to track whether the first item in the collection should be automatically focused. Specifically used for autocomplete when user types
  // to focus the first key AFTER the collection updates.
  // TODO: potentially expand the usage of this
  let shouldVirtualFocusFirst = useRef(false);
  // Add event listeners for custom virtual events. These handle updating the focused key in response to various keyboard events
  // at the autocomplete level
  // TODO: fix type later
  useEvent(ref, FOCUS_EVENT, !shouldUseVirtualFocus ? undefined : (e: any) => {
    let {detail} = e;
    e.stopPropagation();
    manager.setFocused(true);

    // If the user is typing forwards, autofocus the first option in the list.
    if (detail?.focusStrategy === 'first') {
      shouldVirtualFocusFirst.current = true;
    }
  });

  let updateActiveDescendant = useEffectEvent(() => {
    let keyToFocus = delegate.getFirstKey?.() ?? null;

    // If no focusable items exist in the list, make sure to clear any activedescendant that may still exist
    if (keyToFocus == null) {
      ref.current?.dispatchEvent(
        new CustomEvent(UPDATE_ACTIVEDESCENDANT, {
          cancelable: true,
          bubbles: true
        })
      );

      // If there wasn't a focusable key but the collection had items, then that means we aren't in an intermediate load state and all keys are disabled.
      // Reset shouldVirtualFocusFirst so that we don't erronously autofocus an item when the collection is filtered again.
      if (manager.collection.size > 0) {
        shouldVirtualFocusFirst.current = false;
      }
    } else {
      manager.setFocusedKey(keyToFocus);
      // Only set shouldVirtualFocusFirst to false if we've successfully set the first key as the focused key
      // If there wasn't a key to focus, we might be in a temporary loading state so we'll want to still focus the first key
      // after the collection updates after load
      shouldVirtualFocusFirst.current = false;
    }
  });

  useUpdateLayoutEffect(() => {
    if (shouldVirtualFocusFirst.current) {
      updateActiveDescendant();
    }

  }, [manager.collection, updateActiveDescendant]);

  let resetFocusFirstFlag = useEffectEvent(() => {
    // If user causes the focused key to change in any other way, clear shouldVirtualFocusFirst so we don't
    // accidentally move focus from under them. Skip this if the collection was empty because we might be in a load
    // state and will still want to focus the first item after load
    if (manager.collection.size > 0) {
      shouldVirtualFocusFirst.current = false;
    }
  });

  useUpdateLayoutEffect(() => {
    resetFocusFirstFlag();
  }, [manager.focusedKey, resetFocusFirstFlag]);

  useEvent(ref, CLEAR_FOCUS_EVENT, !shouldUseVirtualFocus ? undefined : (e) => {
    e.stopPropagation();
    manager.setFocused(false);
    manager.setFocusedKey(null);
  });

  const autoFocusRef = useRef(autoFocus);
  useEffect(() => {
    if (autoFocusRef.current) {
      let focusedKey: Key | null = null;

      // Check focus strategy to determine which item to focus
      if (autoFocus === 'first') {
        focusedKey = delegate.getFirstKey?.() ?? null;
      } if (autoFocus === 'last') {
        focusedKey = delegate.getLastKey?.() ?? null;
      }

      // If there are any selected keys, make the first one the new focus target
      let selectedKeys = manager.selectedKeys;
      if (selectedKeys.size) {
        for (let key of selectedKeys) {
          if (manager.canSelectItem(key)) {
            focusedKey = key;
            break;
          }
        }
      }

      manager.setFocused(true);
      manager.setFocusedKey(focusedKey);

      // If no default focus key is selected, focus the collection itself.
      if (focusedKey == null && !shouldUseVirtualFocus && ref.current) {
        focusSafely(ref.current);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll the focused element into view when the focusedKey changes.
  let lastFocusedKey = useRef(manager.focusedKey);
  useEffect(() => {
    if (manager.isFocused && manager.focusedKey != null && (manager.focusedKey !== lastFocusedKey.current || autoFocusRef.current) && scrollRef.current && ref.current) {
      let modality = getInteractionModality();
      let element = ref.current.querySelector(`[data-key="${CSS.escape(getNodeKey(manager.focusedKey, idScope))}"]`) as HTMLElement;
      if (!element) {
        // If item element wasn't found, return early (don't update autoFocusRef and lastFocusedKey).
        // The collection may initially be empty (e.g. virtualizer), so wait until the element exists.
        return;
      }

      if (modality === 'keyboard' || autoFocusRef.current) {
        scrollIntoView(scrollRef.current, element);

        // Avoid scroll in iOS VO, since it may cause overlay to close (i.e. RAC submenu)
        if (modality !== 'virtual') {
          scrollIntoViewport(element, {containingElement: ref.current});
        }
      }
    }

    // If the focused key becomes null (e.g. the last item is deleted), focus the whole collection.
    if (!shouldUseVirtualFocus && manager.isFocused && manager.focusedKey == null && lastFocusedKey.current != null && ref.current) {
      focusSafely(ref.current);
    }

    lastFocusedKey.current = manager.focusedKey;
    autoFocusRef.current = false;
  });

  // Intercept FocusScope restoration since virtualized collections can reuse DOM nodes.
  useEvent(ref, 'react-aria-focus-scope-restore', e => {
    e.preventDefault();
    manager.setFocused(true);
  });

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

  // If nothing is focused within the collection, make the collection itself tabbable.
  // This will be marshalled to either the first or last item depending on where focus came from.
  let tabIndex: number | undefined = undefined;
  if (!shouldUseVirtualFocus) {
    tabIndex = manager.focusedKey == null ? 0 : -1;
  } else {
    tabIndex = -1;
  }

  return {
    collectionProps: mergeProps(handlers, {
      tabIndex,
      'data-scope': idScope
    })
  };
}
