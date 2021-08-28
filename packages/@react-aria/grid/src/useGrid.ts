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
import {AriaLabelingProps, DOMProps, KeyboardDelegate, Selection} from '@react-types/shared';
import {filterDOMProps, mergeProps, useId, useUpdateEffect} from '@react-aria/utils';
import {GridCollection} from '@react-types/grid';
import {GridKeyboardDelegate} from './GridKeyboardDelegate';
import {gridKeyboardDelegates} from './utils';
import {GridState} from '@react-stately/grid';
import {HTMLAttributes, Key, RefObject, useMemo, useRef} from 'react';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {useCollator, useLocale, useMessageFormatter} from '@react-aria/i18n';
import {useSelectableCollection} from '@react-aria/selection';

export interface GridProps extends DOMProps, AriaLabelingProps {
  /** Whether the grid uses virtual scrolling. */
  isVirtualized?: boolean,
  /**
   * An optional keyboard delegate implementation for type to select,
   * to override the default.
   */
  keyboardDelegate?: KeyboardDelegate,
  /**
   * Whether initial grid focus should be placed on the grid row or grid cell.
   * @default 'row'
   */
  focusMode?: 'row' | 'cell',
  /**
   * A function that returns the text that should be announced by assistive technology when a row is added or removed from selection.
   * @default (key) => state.collection.getItem(key)?.textValue
   */
  getRowText?: (key: Key) => string,
  /**
   * The ref attached to the scrollable body. Used to provided automatic scrolling on item focus for non-virtualized grids.
   */
  scrollRef?: RefObject<HTMLElement>
}

export interface GridAria {
  /** Props for the grid element. */
  gridProps: HTMLAttributes<HTMLElement>,
  /** Props for the grid's scrollable region. */
  scrollBodyProps: HTMLAttributes<HTMLElement>
}

/**
 * Provides the behavior and accessibility implementation for a grid component.
 * A grid displays data in one or more rows and columns and enables a user to navigate its contents via directional navigation keys.
 * @param props - Props for the grid.
 * @param state - State for the grid, as returned by `useGridState`.
 * @param ref - The ref attached to the grid element.
 */
export function useGrid<T>(props: GridProps, state: GridState<T, GridCollection<T>>, ref: RefObject<HTMLElement>): GridAria {
  let {
    isVirtualized,
    keyboardDelegate,
    focusMode,
    getRowText = (key) => state.collection.getItem(key)?.textValue,
    scrollRef
  } = props;
  let formatMessage = useMessageFormatter(intlMessages);

  if (!props['aria-label'] && !props['aria-labelledby']) {
    console.warn('An aria-label or aria-labelledby prop is required for accessibility.');
  }

  // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
  // When virtualized, the layout object will be passed in as a prop and override this.
  let collator = useCollator({usage: 'search', sensitivity: 'base'});
  let {direction} = useLocale();
  let delegate = useMemo(() => keyboardDelegate || new GridKeyboardDelegate({
    collection: state.collection,
    disabledKeys: state.disabledKeys,
    ref,
    direction,
    collator,
    focusMode
  }), [keyboardDelegate, state.collection, state.disabledKeys, ref, direction, collator, focusMode]);
  let {collectionProps, scrollBodyProps} = useSelectableCollection({
    ref,
    selectionManager: state.selectionManager,
    keyboardDelegate: delegate,
    isVirtualized,
    scrollRef
  });

  let id = useId();
  gridKeyboardDelegates.set(state, delegate);

  let domProps = filterDOMProps(props, {labelable: true});
  let gridProps: HTMLAttributes<HTMLElement> = mergeProps(domProps, {
    role: 'grid',
    id,
    'aria-multiselectable': state.selectionManager.selectionMode === 'multiple' ? 'true' : undefined,
    ...collectionProps
  });

  if (isVirtualized) {
    gridProps['aria-rowcount'] = state.collection.size;
    gridProps['aria-colcount'] = state.collection.columnCount;
  }

  // Many screen readers do not announce when items in a grid are selected/deselected.
  // We do this using an ARIA live region.
  let selection = state.selectionManager.rawSelection;
  let lastSelection = useRef(selection);
  useUpdateEffect(() => {
    if (!state.selectionManager.isFocused) {
      return;
    }

    let addedKeys = diffSelection(selection, lastSelection.current);
    let removedKeys = diffSelection(lastSelection.current, selection);

    // If adding or removing a single row from the selection, announce the name of that item.
    let messages = [];
    if (addedKeys.size === 1 && removedKeys.size === 0) {
      let addedText = getRowText(addedKeys.keys().next().value);
      if (addedText) {
        messages.push(formatMessage('selectedItem', {item: addedText}));
      }
    } else if (removedKeys.size === 1 && addedKeys.size === 0) {
      let removedText = getRowText(removedKeys.keys().next().value);
      if (removedText) {
        messages.push(formatMessage('deselectedItem', {item: removedText}));
      }
    }

    // Announce how many items are selected, except when selecting the first item.
    if (state.selectionManager.selectionMode === 'multiple') {
      if (messages.length === 0 || selection === 'all' || selection.size > 1 || lastSelection.current === 'all' || lastSelection.current.size > 1) {
        messages.push(selection === 'all'
          ? formatMessage('selectedAll')
          : formatMessage('selectedCount', {count: selection.size})
        );
      }
    }

    if (messages.length > 0) {
      announce(messages.join(' '));
    }

    lastSelection.current = selection;
  }, [selection]);

  return {
    gridProps,
    scrollBodyProps
  };
}

function diffSelection(a: Selection, b: Selection): Set<Key> {
  let res = new Set<Key>();
  if (a === 'all' || b === 'all') {
    return res;
  }

  for (let key of a.keys()) {
    if (!b.has(key)) {
      res.add(key);
    }
  }

  return res;
}
