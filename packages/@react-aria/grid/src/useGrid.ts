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

import {AriaLabelingProps, DOMAttributes, DOMProps, Key, KeyboardDelegate, RefObject} from '@react-types/shared';
import {filterDOMProps, mergeProps, useId} from '@react-aria/utils';
import {GridCollection} from '@react-types/grid';
import {GridKeyboardDelegate} from './GridKeyboardDelegate';
import {gridMap} from './utils';
import {GridState} from '@react-stately/grid';
import {useCallback, useMemo} from 'react';
import {useCollator, useLocale} from '@react-aria/i18n';
import {useGridSelectionAnnouncement} from './useGridSelectionAnnouncement';
import {useHasTabbableChild} from '@react-aria/focus';
import {useHighlightSelectionDescription} from './useHighlightSelectionDescription';
import {useSelectableCollection} from '@react-aria/selection';

export interface GridProps extends DOMProps, AriaLabelingProps {
  /** Whether the grid uses virtual scrolling. */
  isVirtualized?: boolean,
  /**
   * Whether typeahead navigation is disabled.
   * @default false
   */
  disallowTypeAhead?: boolean,
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
  scrollRef?: RefObject<HTMLElement | null>,
  /** Handler that is called when a user performs an action on the row. */
  onRowAction?: (key: Key) => void,
  /** Handler that is called when a user performs an action on the cell. */
  onCellAction?: (key: Key) => void
}

export interface GridAria {
  /** Props for the grid element. */
  gridProps: DOMAttributes
}

/**
 * Provides the behavior and accessibility implementation for a grid component.
 * A grid displays data in one or more rows and columns and enables a user to navigate its contents via directional navigation keys.
 * @param props - Props for the grid.
 * @param state - State for the grid, as returned by `useGridState`.
 * @param ref - The ref attached to the grid element.
 */
export function useGrid<T>(props: GridProps, state: GridState<T, GridCollection<T>>, ref: RefObject<HTMLElement | null>): GridAria {
  let {
    isVirtualized,
    disallowTypeAhead,
    keyboardDelegate,
    focusMode,
    scrollRef,
    getRowText,
    onRowAction,
    onCellAction
  } = props;
  let {selectionManager: manager} = state;

  if (!props['aria-label'] && !props['aria-labelledby']) {
    console.warn('An aria-label or aria-labelledby prop is required for accessibility.');
  }

  // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
  // When virtualized, the layout object will be passed in as a prop and override this.
  let collator = useCollator({usage: 'search', sensitivity: 'base'});
  let {direction} = useLocale();
  let disabledBehavior = state.selectionManager.disabledBehavior;
  let delegate = useMemo(() => keyboardDelegate || new GridKeyboardDelegate({
    collection: state.collection,
    disabledKeys: state.disabledKeys,
    disabledBehavior,
    ref,
    direction,
    collator,
    focusMode
  }), [keyboardDelegate, state.collection, state.disabledKeys, disabledBehavior, ref, direction, collator, focusMode]);

  let id = useId(props.id);
  gridMap.set(state, {id, keyboardDelegate: delegate, actions: {onRowAction, onCellAction}});
  
  let {collectionProps} = useSelectableCollection({
    ref,
    idScope: id,
    selectionManager: manager,
    keyboardDelegate: delegate,
    isVirtualized,
    scrollRef,
    disallowTypeAhead
  });

  let descriptionProps = useHighlightSelectionDescription({
    selectionManager: manager,
    hasItemActions: !!(onRowAction || onCellAction)
  });

  let domProps = filterDOMProps(props, {labelable: true});

  let onFocus = useCallback((e) => {
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
  }, [manager]);

  // Continue to track collection focused state even if keyboard navigation is disabled
  let navDisabledHandlers = useMemo(() => ({
    onBlur: collectionProps.onBlur,
    onFocus
  }), [onFocus, collectionProps.onBlur]);

  let hasTabbableChild = useHasTabbableChild(ref, {
    isDisabled: state.collection.size !== 0
  });

  let gridProps: DOMAttributes = mergeProps(
    domProps,
    {
      role: 'grid',
      id,
      'aria-multiselectable': manager.selectionMode === 'multiple' ? 'true' : undefined
    },
    state.isKeyboardNavigationDisabled ? navDisabledHandlers : collectionProps,
    // If collection is empty, make sure the grid is tabbable unless there is a child tabbable element.
    (state.collection.size === 0 && {tabIndex: hasTabbableChild ? -1 : 0}) || undefined,
    descriptionProps
  );

  if (isVirtualized) {
    gridProps['aria-rowcount'] = state.collection.size;
    gridProps['aria-colcount'] = state.collection.columnCount;
  }

  useGridSelectionAnnouncement({getRowText}, state);
  return {
    gridProps
  };
}
