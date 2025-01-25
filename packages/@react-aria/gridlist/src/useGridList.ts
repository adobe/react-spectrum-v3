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

import {
  AriaLabelingProps,
  CollectionBase,
  DisabledBehavior,
  DOMAttributes,
  DOMProps,
  Key,
  KeyboardDelegate,
  LayoutDelegate,
  MultipleSelection,
  RefObject
} from '@react-types/shared';
import {filterDOMProps, mergeProps, useId} from '@react-aria/utils';
import {listMap} from './utils';
import {ListState} from '@react-stately/list';
import {useGridSelectionAnnouncement, useHighlightSelectionDescription} from '@react-aria/grid';
import {useHasTabbableChild} from '@react-aria/focus';
import {useSelectableList} from '@react-aria/selection';

export interface GridListProps<T> extends CollectionBase<T>, MultipleSelection {
  /**
   * Handler that is called when a user performs an action on an item. The exact user event depends on
   * the collection's `selectionBehavior` prop and the interaction modality.
   */
  onAction?: (key: Key) => void,
  /** Whether `disabledKeys` applies to all interactions, or only selection. */
  disabledBehavior?: DisabledBehavior
}

export interface AriaGridListProps<T> extends GridListProps<T>, DOMProps, AriaLabelingProps {
  /**
   * Whether keyboard navigation to focusable elements within grid list items is
   * via the left/right arrow keys or the tab key.
   * @default 'arrow'
   */
  keyboardNavigationBehavior?: 'arrow' | 'tab'
}

export interface AriaGridListOptions<T> extends Omit<AriaGridListProps<T>, 'children'> {
  /** Whether the list uses virtual scrolling. */
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
   * A delegate object that provides layout information for items in the collection.
   * By default this uses the DOM, but this can be overridden to implement things like
   * virtualized scrolling.
   */
  layoutDelegate?: LayoutDelegate,
  /**
   * Whether focus should wrap around when the end/start is reached.
   * @default false
   */
  shouldFocusWrap?: boolean,
  /**
   * The behavior of links in the collection.
   * - 'action': link behaves like onAction.
   * - 'selection': link follows selection interactions (e.g. if URL drives selection).
   * - 'override': links override all other interactions (link items are not selectable).
   * @default 'action'
   */
  linkBehavior?: 'action' | 'selection' | 'override'
}

export interface GridListAria {
  /** Props for the grid element. */
  gridProps: DOMAttributes
}

/**
 * Provides the behavior and accessibility implementation for a list component with interactive children.
 * A grid list displays data in a single column and enables a user to navigate its contents via directional navigation keys.
 * @param props - Props for the list.
 * @param state - State for the list, as returned by `useListState`.
 * @param ref - The ref attached to the list element.
 */
export function useGridList<T>(props: AriaGridListOptions<T>, state: ListState<T>, ref: RefObject<HTMLElement | null>): GridListAria {
  let {
    isVirtualized,
    keyboardDelegate,
    layoutDelegate,
    onAction,
    disallowTypeAhead,
    linkBehavior = 'action',
    keyboardNavigationBehavior = 'arrow'
  } = props;

  if (!props['aria-label'] && !props['aria-labelledby']) {
    console.warn('An aria-label or aria-labelledby prop is required for accessibility.');
  }

  let id = useId(props.id);
  listMap.set(state, {id, onAction, linkBehavior, keyboardNavigationBehavior});

  let {listProps} = useSelectableList({
    selectionManager: state.selectionManager,
    collection: state.collection,
    disabledKeys: state.disabledKeys,
    ref,
    idScope: id,
    keyboardDelegate,
    layoutDelegate,
    isVirtualized,
    selectOnFocus: state.selectionManager.selectionBehavior === 'replace',
    shouldFocusWrap: props.shouldFocusWrap,
    linkBehavior,
    disallowTypeAhead
  });


  let descriptionProps = useHighlightSelectionDescription({
    selectionManager: state.selectionManager,
    hasItemActions: !!onAction
  });

  let hasTabbableChild = useHasTabbableChild(ref, {
    isDisabled: state.collection.size !== 0
  });

  let domProps = filterDOMProps(props, {labelable: true});
  let gridProps: DOMAttributes = mergeProps(
    domProps,
    {
      role: 'grid',
      id,
      'aria-multiselectable': state.selectionManager.selectionMode === 'multiple' ? 'true' : undefined
    },
    // If collection is empty, make sure the grid is tabbable unless there is a child tabbable element.
    state.collection.size === 0 ? {tabIndex: hasTabbableChild ? -1 : 0} : listProps,
    descriptionProps
  );

  if (isVirtualized) {
    gridProps['aria-rowcount'] = state.collection.size;
    gridProps['aria-colcount'] = 1;
  }

  useGridSelectionAnnouncement({}, state);

  return {
    gridProps
  };
}
