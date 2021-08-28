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

import {FocusEvent, HTMLAttributes, Key, KeyboardEvent, RefObject, useCallback, useEffect, useRef} from 'react';
import {focusSafely, getFocusableTreeWalker} from '@react-aria/focus';
import {FocusStrategy, KeyboardDelegate} from '@react-types/shared';
import {focusWithoutScrolling, isMac, mergeProps} from '@react-aria/utils';
import {MultipleSelectionManager} from '@react-stately/selection';
import {useLocale} from '@react-aria/i18n';
import {useTypeSelect} from './useTypeSelect';

function isCtrlKeyPressed(e: KeyboardEvent) {
  if (isMac()) {
    return e.metaKey;
  }

  return e.ctrlKey;
}

interface SelectableCollectionOptions {
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

interface SelectableCollectionAria {
  /** Props for the collection element. */
  collectionProps: HTMLAttributes<HTMLElement>,
  /** Props for the collection element's scrollable region. */
  scrollBodyProps: HTMLAttributes<HTMLElement>
}

/**
 * Handles interactions with selectable collections.
 */
export function useSelectableCollection(options: SelectableCollectionOptions): SelectableCollectionAria {
  let {
    selectionManager: manager,
    keyboardDelegate: delegate,
    ref,
    autoFocus = false,
    shouldFocusWrap = false,
    disallowEmptySelection = false,
    disallowSelectAll = false,
    selectOnFocus = false,
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

    // Let child element (e.g. menu button) handle the event if the Alt key is pressed.
    // Keyboard events bubble through portals. Don't handle keyboard events
    // for elements outside the collection (e.g. menus).
    if (e.altKey || !ref.current.contains(e.target as HTMLElement)) {
      return;
    }

    const navigateToKey = (key: Key | undefined, childFocus?: FocusStrategy) => {
      if (key != null) {
        manager.setFocusedKey(key, childFocus);

        if (e.shiftKey && manager.selectionMode === 'multiple') {
          manager.extendSelection(key);
        } else if (selectOnFocus) {
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
          navigateToKey(nextKey, direction === 'rtl' ? 'first' : 'last');
        }
        break;
      }
      case 'ArrowRight': {
        if (delegate.getKeyRightOf) {
          e.preventDefault();
          let nextKey = delegate.getKeyRightOf(manager.focusedKey);
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
            let next: HTMLElement;
            let last: HTMLElement;
            do {
              last = walker.lastChild() as HTMLElement;
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
      // If the user hasn't yet interacted with the collection, there will be no focusedKey set.
      // Attempt to detect whether the user is tabbing forward or backward into the collection
      // and either focus the first or last item accordingly.
      let relatedTarget = e.relatedTarget as Element;
      if (relatedTarget && (e.currentTarget.compareDocumentPosition(relatedTarget) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        manager.setFocusedKey(manager.lastSelectedKey ?? delegate.getLastKey());
      } else {
        manager.setFocusedKey(manager.firstSelectedKey ?? delegate.getFirstKey());
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
  useEffect(() => {
    if (!isVirtualized && manager.focusedKey && scrollRef?.current) {
      let element = scrollRef.current.querySelector(`[data-key="${manager.focusedKey}"]`) as HTMLElement;
      if (element) {
        scrollIntoView(scrollRef.current, element);
      }
    }
  }, [isVirtualized, scrollRef, manager.focusedKey]);

  let prevScroll = useRef({scrollTop: scrollRef?.current?.scrollTop || 0, scrollLeft: scrollRef?.current?.scrollLeft || 0});
  // Bring focused key into view if focus enters the collection from outside. Only for non virtualized collections,
  // virtualized collections should handle this in their virtualizer or get this for free via our Virtualizer component
  useEffect(() => {
    let onFocus = (e) => {
      // Note: we can get away with only checking if the target is in the scrollable region only because the keydown capturing listener below
      // will prevent tab/shift tab from focusing the select all checkbox and instead focus the last focused key.
      if ((e.target instanceof HTMLElement && scrollRef.current?.contains(e.target)) && !isVirtualized && !manager.isFocused) {
        if (manager.focusedKey) {
          let element = scrollRef.current.querySelector(`[data-key="${manager.focusedKey}"]`) as HTMLElement;
          if (element) {
            // Figure out if element is out of view
            let scrollContainerTop = scrollRef.current.offsetTop + prevScroll.current.scrollTop;
            let scrollContainerBottom = scrollRef.current.offsetTop + prevScroll.current.scrollTop + scrollRef.current.offsetHeight;
            let scrollContainerLeft = scrollRef.current.offsetLeft + prevScroll.current.scrollLeft;
            let scrollContainerRight = scrollRef.current.offsetLeft + prevScroll.current.scrollLeft + scrollRef.current.offsetWidth;
            let elementTop = element.offsetTop;
            let elementBottom = element.offsetTop + element.clientHeight;
            let elementLeft = element.offsetLeft;
            let elementRight = element.offsetLeft + element.clientWidth;

            let elementOutOfView = elementTop <= scrollContainerTop || elementBottom >= scrollContainerBottom || elementRight >= scrollContainerRight || elementLeft <= scrollContainerLeft;
            // If focused key is out of view and is in the scrollable region, scroll it into view when re-entering the table
            if (scrollRef.current?.contains(element) && elementOutOfView) {
              scrollIntoView(scrollRef.current, element);
            } else {
              // If focusedkey is already in view, override the scroll that may happen from shift tabbing (browser will focus last focusable element in the table which may be out of view, causing a scroll)
              scrollRef.current.scrollTop = prevScroll.current.scrollTop;
              scrollRef.current.scrollLeft = prevScroll.current.scrollLeft;
            }
          }
        }
      }
    };

    window.addEventListener('focus', onFocus, true);
    return () => {
      window.removeEventListener('focus', onFocus, true);
    };
  }, [manager.focusedKey, scrollRef, isVirtualized]);

  // Save the previous scroll position
  let onScroll = useCallback(() => {
    prevScroll.current = {scrollTop: scrollRef.current.scrollTop, scrollLeft: scrollRef.current.scrollLeft};
  }, [scrollRef]);

  useEffect(() => {
    let onKeyDown = (e) => {
      // The consts here can be removed if we export them from FocusScope
      const focusableElements = [
        'input:not([disabled]):not([type=hidden])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'a[href]',
        'area[href]',
        'summary',
        'iframe',
        'object',
        'embed',
        'audio[controls]',
        'video[controls]',
        '[contenteditable]'
      ];

      focusableElements.push('[tabindex]:not([tabindex="-1"]):not([disabled])');
      const TABBABLE_ELEMENT_SELECTOR = focusableElements.join(':not([hidden]):not([tabindex="-1"]),');

      if (e.key === 'Tab' && !ref.current.contains(e.target as HTMLElement) && !isVirtualized) {
        let tabbableElements = Array.from(document.querySelectorAll(TABBABLE_ELEMENT_SELECTOR));
        let index = tabbableElements.findIndex(node => node === e.target);
        let nodeToFocus;
        if (e.shiftKey) {
          nodeToFocus = tabbableElements[index - 1];
        } else {
          nodeToFocus = tabbableElements[index + 1];
        }

        if (ref.current.contains(nodeToFocus) && manager.focusedKey) {
          e.preventDefault();
          let element = ref.current.querySelector(`[data-key="${manager.focusedKey}"]`) as HTMLElement;
          element && focusSafely(element);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [manager.focusedKey, ref, isVirtualized]);

  let handlers = {
    onKeyDown,
    onFocus,
    onBlur,
    onMouseDown(e) {
      // Ignore events that bubbled through portals.
      if (e.currentTarget.contains(e.target)) {
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
  // If using virtual focus, don't set a tabIndex at all so that VoiceOver on iOS 14 doesn't try
  // to move real DOM focus to the element anyway.
  let tabIndex: number;
  if (!shouldUseVirtualFocus) {
    tabIndex = manager.focusedKey == null ? 0 : -1;
  }

  return {
    collectionProps: {
      ...handlers,
      tabIndex
    },
    scrollBodyProps: {
      onScroll
    }
  };
}

/**
 * Scrolls `scrollView` so that `element` is visible.
 * Similar to `element.scrollIntoView({block: 'nearest'})` (not supported in Edge),
 * but doesn't affect parents above `scrollView`.
 */
function scrollIntoView(scrollView: HTMLElement, element: HTMLElement) {
  let offsetX = relativeOffset(scrollView, element, 'left');
  let offsetY = relativeOffset(scrollView, element, 'top');
  let width = element.offsetWidth;
  let height = element.offsetHeight;
  let x = scrollView.scrollLeft;
  let y = scrollView.scrollTop;
  let maxX = x + scrollView.offsetWidth;
  let maxY = y + scrollView.offsetHeight;

  if (offsetX <= x) {
    x = offsetX;
  } else if (offsetX + width > maxX) {
    x += offsetX + width - maxX;
  }
  if (offsetY <= y) {
    y = offsetY;
  } else if (offsetY + height > maxY) {
    y += offsetY + height - maxY;
  }

  scrollView.scrollLeft = x;
  scrollView.scrollTop = y;
}

/**
 * Computes the offset left or top from child to ancestor by accumulating
 * offsetLeft or offsetTop through intervening offsetParents.
 */
function relativeOffset(ancestor: HTMLElement, child: HTMLElement, axis: 'left'|'top') {
  const prop = axis === 'left' ? 'offsetLeft' : 'offsetTop';
  let sum = 0;
  while (child.offsetParent) {
    sum += child[prop];
    if (child.offsetParent === ancestor) {
      // Stop once we have found the ancestor we are interested in.
      break;
    } else if (child.offsetParent.contains(ancestor)) {
      // If the ancestor is not `position:relative`, then we stop at
      // _its_ offset parent, and we subtract off _its_ offset, so that
      // we end up with the proper offset from child to ancestor.
      sum -= ancestor[prop];
      break;
    }
    child = child.offsetParent as HTMLElement;
  }
  return sum;
}
