/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {chain, getScrollParent, mergeProps, scrollIntoViewport, useSlotId, useSyntheticLinkProps} from '@react-aria/utils';
import {DOMAttributes, FocusableElement, Key, RefObject, Node as RSNode} from '@react-types/shared';
import {focusSafely, getFocusableTreeWalker} from '@react-aria/focus';
import {getLastItem} from '@react-stately/collections';
import {getNodeKey} from '@react-aria/collections';
import {getRowId, listMap} from './utils';
import {HTMLAttributes, KeyboardEvent as ReactKeyboardEvent, useRef} from 'react';
import {isFocusVisible} from '@react-aria/interactions';
import type {ListState} from '@react-stately/list';
import {SelectableItemStates, useSelectableItem} from '@react-aria/selection';
import type {TreeState} from '@react-stately/tree';
import {useLocale} from '@react-aria/i18n';

export interface AriaGridListItemOptions {
  /** An object representing the list item. Contains all the relevant information that makes up the list row. */
  node: RSNode<unknown>,
  /** Whether the list row is contained in a virtual scroller. */
  isVirtualized?: boolean,
  /** Whether selection should occur on press up instead of press down. */
  shouldSelectOnPressUp?: boolean
}

export interface GridListItemAria extends SelectableItemStates {
  /** Props for the list row element. */
  rowProps: DOMAttributes,
  /** Props for the grid cell element within the list row. */
  gridCellProps: DOMAttributes,
  /** Props for the list item description element, if any. */
  descriptionProps: DOMAttributes
}

const EXPANSION_KEYS = {
  'expand': {
    ltr: 'ArrowRight',
    rtl: 'ArrowLeft'
  },
  'collapse': {
    ltr: 'ArrowLeft',
    rtl: 'ArrowRight'
  }
};

/**
 * Provides the behavior and accessibility implementation for a row in a grid list.
 * @param props - Props for the row.
 * @param state - State of the parent list, as returned by `useListState`.
 * @param ref - The ref attached to the row element.
 */
export function useGridListItem<T>(props: AriaGridListItemOptions, state: ListState<T> | TreeState<T>, ref: RefObject<FocusableElement | null>): GridListItemAria {
  // Copied from useGridCell + some modifications to make it not so grid specific
  let {
    node,
    isVirtualized,
    shouldSelectOnPressUp
  } = props;

  // let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-aria/gridlist');
  let {direction} = useLocale();
  let {id, onAction, linkBehavior, keyboardNavigationBehavior} = listMap.get(state)!;
  let descriptionId = useSlotId();

  // We need to track the key of the item at the time it was last focused so that we force
  // focus to go to the item when the DOM node is reused for a different item in a virtualizer.
  let keyWhenFocused = useRef<Key | null>(null);
  let focus = () => {
    // Don't shift focus to the row if the active element is a element within the row already
    // (e.g. clicking on a row button)
    if (
      ref.current !== null &&
      ((keyWhenFocused.current != null && node.key !== keyWhenFocused.current) ||
      !ref.current?.contains(document.activeElement))
    ) {
      focusSafely(ref.current);
    }
  };

  let treeGridRowProps: HTMLAttributes<HTMLElement> = {};
  let hasChildRows;
  let hasLink = state.selectionManager.isLink(node.key);
  if (node != null && 'expandedKeys' in state) {
    // TODO: ideally node.hasChildNodes would be a way to tell if a row has child nodes, but the row's contents make it so that value is always
    // true...
    let children = state.collection.getChildren?.(node.key);
    hasChildRows = [...(children ?? [])].length > 1;
    if (onAction == null && !hasLink && state.selectionManager.selectionMode === 'none' && hasChildRows) {
      onAction = () => state.toggleKey(node.key);
    }

    let isExpanded = hasChildRows ? state.expandedKeys.has(node.key) : undefined;
    let setSize = 1;
    if (node.level > 0 && node?.parentKey != null) {
      let parent = state.collection.getItem(node.parentKey);
      if (parent) {
        // siblings must exist because our original node exists, same with lastItem
        let siblings = state.collection.getChildren?.(parent.key)!;
        setSize = getLastItem(siblings)!.index + 1;
      }
    } else {
      setSize = ([...state.collection].filter(row => row.level === 0).at(-1)?.index ?? 0) + 1;
    }
    treeGridRowProps = {
      'aria-expanded': isExpanded,
      'aria-level': node.level + 1,
      'aria-posinset': node?.index + 1,
      'aria-setsize': setSize
    };
  }

  let {itemProps, ...itemStates} = useSelectableItem({
    selectionManager: state.selectionManager,
    key: node.key,
    ref,
    isVirtualized,
    shouldSelectOnPressUp,
    onAction: onAction || node.props?.onAction ? chain(node.props?.onAction, onAction ? () => onAction(node.key) : undefined) : undefined,
    focus,
    linkBehavior
  });

  let onKeyDown = (e: ReactKeyboardEvent) => {
    if (!e.currentTarget.contains(e.target as Element) || !ref.current || !document.activeElement) {
      return;
    }

    let walker = getFocusableTreeWalker(ref.current);
    walker.currentNode = document.activeElement;

    if ('expandedKeys' in state && document.activeElement === ref.current) {
      if ((e.key === EXPANSION_KEYS['expand'][direction]) && state.selectionManager.focusedKey === node.key && hasChildRows && !state.expandedKeys.has(node.key)) {
        state.toggleKey(node.key);
        e.stopPropagation();
        return;
      } else if ((e.key === EXPANSION_KEYS['collapse'][direction]) && state.selectionManager.focusedKey === node.key && hasChildRows && state.expandedKeys.has(node.key)) {
        state.toggleKey(node.key);
        e.stopPropagation();
        return;
      }
    }

    switch (e.key) {
      case 'ArrowLeft': {
        if (keyboardNavigationBehavior === 'arrow') {
          // Find the next focusable element within the row.
          let focusable = direction === 'rtl'
            ? walker.nextNode() as FocusableElement
            : walker.previousNode() as FocusableElement;

          if (focusable) {
            e.preventDefault();
            e.stopPropagation();
            focusSafely(focusable);
            scrollIntoViewport(focusable, {containingElement: getScrollParent(ref.current)});
          } else {
            // If there is no next focusable child, then return focus back to the row
            e.preventDefault();
            e.stopPropagation();
            if (direction === 'rtl') {
              focusSafely(ref.current);
              scrollIntoViewport(ref.current, {containingElement: getScrollParent(ref.current)});
            } else {
              walker.currentNode = ref.current;
              let lastElement = last(walker);
              if (lastElement) {
                focusSafely(lastElement);
                scrollIntoViewport(lastElement, {containingElement: getScrollParent(ref.current)});
              }
            }
          }
        }
        break;
      }
      case 'ArrowRight': {
        if (keyboardNavigationBehavior === 'arrow') {
          let focusable = direction === 'rtl'
            ? walker.previousNode() as FocusableElement
            : walker.nextNode() as FocusableElement;

          if (focusable) {
            e.preventDefault();
            e.stopPropagation();
            focusSafely(focusable);
            scrollIntoViewport(focusable, {containingElement: getScrollParent(ref.current)});
          } else {
            e.preventDefault();
            e.stopPropagation();
            if (direction === 'ltr') {
              focusSafely(ref.current);
              scrollIntoViewport(ref.current, {containingElement: getScrollParent(ref.current)});
            } else {
              walker.currentNode = ref.current;
              let lastElement = last(walker);
              if (lastElement) {
                focusSafely(lastElement);
                scrollIntoViewport(lastElement, {containingElement: getScrollParent(ref.current)});
              }
            }
          }
        }
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown':
        // Prevent this event from reaching row children, e.g. menu buttons. We want arrow keys to navigate
        // to the row above/below instead. We need to re-dispatch the event from a higher parent so it still
        // bubbles and gets handled by useSelectableCollection.
        if (!e.altKey && ref.current.contains(e.target as Element)) {
          e.stopPropagation();
          e.preventDefault();
          ref.current.parentElement?.dispatchEvent(
            new KeyboardEvent(e.nativeEvent.type, e.nativeEvent)
          );
        }
        break;
      case 'Tab': {
        if (keyboardNavigationBehavior === 'tab') {
          // If there is another focusable element within this item, stop propagation so the tab key
          // is handled by the browser and not by useSelectableCollection (which would take us out of the list).
          let walker = getFocusableTreeWalker(ref.current, {tabbable: true});
          walker.currentNode = document.activeElement;
          let next = e.shiftKey ? walker.previousNode() : walker.nextNode();
          if (next) {
            e.stopPropagation();
          }
        }
      }
    }
  };

  let onFocus = (e) => {
    keyWhenFocused.current = node.key;
    if (e.target !== ref.current) {
      // useSelectableItem only handles setting the focused key when
      // the focused element is the row itself. We also want to
      // set the focused key when a child element receives focus.
      // If focus is currently visible (e.g. the user is navigating with the keyboard),
      // then skip this. We want to restore focus to the previously focused row
      // in that case since the list should act like a single tab stop.
      if (!isFocusVisible()) {
        state.selectionManager.setFocusedKey(node.key);
      }
      return;
    }
  };

  let syntheticLinkProps = useSyntheticLinkProps(node.props);
  let linkProps = itemStates.hasAction ? syntheticLinkProps : {};
  // TODO: re-add when we get translations and fix this for iOS VO
  // let rowAnnouncement;
  // if (onAction) {
  //   rowAnnouncement = stringFormatter.format('hasActionAnnouncement');
  // } else if (hasLink) {
  //   rowAnnouncement = stringFormatter.format('hasLinkAnnouncement', {
  //     link: node.props.href
  //   });
  // }

  let rowProps: DOMAttributes = mergeProps(itemProps, linkProps, {
    role: 'row',
    onKeyDownCapture: onKeyDown,
    onFocus,
    // 'aria-label': [(node.textValue || undefined), rowAnnouncement].filter(Boolean).join(', '),
    'aria-label': node.textValue || undefined,
    'aria-selected': itemStates.allowsSelection ? itemStates.isSelected : undefined,
    'aria-disabled': itemStates.isDisabled || undefined,
    'aria-labelledby': descriptionId && node.textValue ? `${getRowId(state, node.key)} ${descriptionId}` : undefined,
    id: getRowId(state, node.key),
    'data-key': getNodeKey(node.key, id)
  });

  if (isVirtualized) {
    rowProps['aria-rowindex'] = node.index + 1;
  }

  let gridCellProps = {
    role: 'gridcell',
    'aria-colindex': 1
  };

  // TODO: should isExpanded and hasChildRows be a item state that gets returned by the hook?
  return {
    rowProps: {...mergeProps(rowProps, treeGridRowProps)},
    gridCellProps,
    descriptionProps: {
      id: descriptionId
    },
    ...itemStates
  };
}

function last(walker: TreeWalker) {
  let next: FocusableElement | null = null;
  let last: FocusableElement | null = null;
  do {
    last = walker.lastChild() as FocusableElement | null;
    if (last) {
      next = last;
    }
  } while (last);
  return next;
}
