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

import {Collection, CollectionStateBase, Key, Node} from '@react-types/shared';
import {ListCollection} from './ListCollection';
import {MultipleSelectionStateProps, SelectionManager, useMultipleSelectionState} from '@react-stately/selection';
import {useCallback, useEffect, useMemo, useRef} from 'react';
import {useCollection} from '@react-stately/collections';

export interface ListProps<T> extends CollectionStateBase<T>, MultipleSelectionStateProps {
  /** Filter function to generate a filtered list of nodes. */
  filter?: (nodes: Iterable<Node<T>>) => Iterable<Node<T>>,
  /** @private */
  suppressTextValueWarning?: boolean
}

export interface ListState<T> {
  /** A collection of items in the list. */
  collection: Collection<Node<T>>,

  /** A set of items that are disabled. */
  disabledKeys: Set<Key>,

  /** A selection manager to read and update multiple selection state. */
  selectionManager: SelectionManager
}

/**
 * Provides state management for list-like components. Handles building a collection
 * of items from props, and manages multiple selection state.
 */
export function useListState<T extends object>(props: ListProps<T>): ListState<T>  {
  let {filter} = props;

  let selectionState = useMultipleSelectionState(props);
  let disabledKeys = useMemo(() =>
    props.disabledKeys ? new Set(props.disabledKeys) : new Set<Key>()
  , [props.disabledKeys]);

  let factory = useCallback(nodes => filter ? new ListCollection(filter(nodes)) : new ListCollection(nodes as Iterable<Node<T>>), [filter]);
  let context = useMemo(() => ({suppressTextValueWarning: props.suppressTextValueWarning}), [props.suppressTextValueWarning]);

  let collection = useCollection(props, factory, context);

  let selectionManager = useMemo(() =>
    new SelectionManager(collection, selectionState)
    , [collection, selectionState]
  );

  // Reset focused key if that item is deleted from the collection.
  const cachedCollection = useRef(null);
  useEffect(() => {
    if (selectionState.focusedKey != null && !collection.getItem(selectionState.focusedKey)) {
      const startItem = cachedCollection.current.getItem(selectionState.focusedKey);
      const cachedItemNodes = [...cachedCollection.current.getKeys()].map(
        key => {
          const itemNode = cachedCollection.current.getItem(key);
          return itemNode.type === 'item' ? itemNode : null;
        }
      ).filter(node => node !== null);
      const itemNodes = [...collection.getKeys()].map(
        key => {
          const itemNode = collection.getItem(key);
          return itemNode.type === 'item' ? itemNode : null;
        }
      ).filter(node => node !== null);
      const diff = cachedItemNodes.length - itemNodes.length;
      let index = Math.min(
        (
          diff > 1 ?
          Math.max((startItem?.index ?? 0) - diff + 1, 0) :
          startItem?.index ?? 0
        ),
        itemNodes.length - 1);
      let newNode:Node<T>;
      while (index >= 0) {
        if (!selectionManager.isDisabled(itemNodes[index].key)) {
          newNode = itemNodes[index];
          break;
        }
        // Find next, not disabled item.
        if (index < itemNodes.length - 1) {
          index++;
        // Otherwise, find previous, not disabled item.
        } else {
          if (index > startItem?.index ?? 0) {
            index = startItem?.index ?? 0;
          }
          index--;
        }
      }
      selectionState.setFocusedKey(newNode ? newNode.key : null);
    }
    cachedCollection.current = collection;
  }, [collection, selectionManager, selectionState, selectionState.focusedKey]);

  return {
    collection,
    disabledKeys,
    selectionManager
  };
}
