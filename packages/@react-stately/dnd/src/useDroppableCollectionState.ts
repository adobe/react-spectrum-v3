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

import {Collection, DragTypes, DropOperation, DroppableCollectionProps, DropTarget, ItemDropTarget, Key, Node} from '@react-types/shared';
import {MultipleSelectionManager} from '@react-stately/selection';
import {useCallback, useRef, useState} from 'react';

interface DropOperationEvent {
  target: DropTarget,
  types: DragTypes,
  allowedOperations: DropOperation[],
  isInternal: boolean,
  draggingKeys: Set<Key>
}

export interface DroppableCollectionStateOptions extends Omit<DroppableCollectionProps, 'onDropMove' | 'onDropActivate'> {
  /** A collection of items. */
  collection: Collection<Node<unknown>>,
  /** An interface for reading and updating multiple selection state. */
  selectionManager: MultipleSelectionManager,
  /** Whether the drop events should be disabled. */
  isDisabled?: boolean
}

export interface DroppableCollectionState {
  /** A collection of items. */
  collection: Collection<Node<unknown>>,
  /** An interface for reading and updating multiple selection state. */
  selectionManager: MultipleSelectionManager,
  /** The current drop target. */
  target: DropTarget | null,
  /** Whether drop events are disabled. */
  isDisabled?: boolean,
  /** Sets the current drop target. */
  setTarget(target: DropTarget | null): void,
  /** Returns whether the given target is equivalent to the current drop target. */
  isDropTarget(target: DropTarget | null): boolean,
  /** Returns the drop operation for the given parameters. */
  getDropOperation(e: DropOperationEvent): DropOperation
}

/**
 * Manages state for a droppable collection.
 */
export function useDroppableCollectionState(props: DroppableCollectionStateOptions): DroppableCollectionState  {
  let {
    acceptedDragTypes = 'all',
    isDisabled,
    onInsert,
    onRootDrop,
    onItemDrop,
    onReorder,
    shouldAcceptItemDrop,
    collection,
    selectionManager,
    onDropEnter,
    getDropOperation,
    onDrop
  } = props;
  let [target, setTarget] = useState<DropTarget | null>(null);
  let targetRef = useRef<DropTarget | null>(null);

  let getOppositeTarget = (target: ItemDropTarget): ItemDropTarget | null => {
    if (target.dropPosition === 'before') {
      let key = collection.getKeyBefore(target.key);
      return key != null ? {type: 'item', key, dropPosition: 'after'} : null;
    } else if (target.dropPosition === 'after') {
      let key = collection.getKeyAfter(target.key);
      return key != null ? {type: 'item', key, dropPosition: 'before'} : null;
    }
    return null;
  };

  let defaultGetDropOperation = useCallback((e: DropOperationEvent) => {
    let {
      target,
      types,
      allowedOperations,
      isInternal,
      draggingKeys
    } = e;

    if (isDisabled || !target) {
      return 'cancel';
    }

    if (acceptedDragTypes === 'all' || acceptedDragTypes.some(type => types.has(type))) {
      let isValidInsert = onInsert && target.type === 'item' && !isInternal && (target.dropPosition === 'before' || target.dropPosition === 'after');
      let isValidReorder = onReorder && target.type === 'item' && isInternal && (target.dropPosition === 'before' || target.dropPosition === 'after');
      // Feedback was that internal root drop was weird so preventing that from happening
      let isValidRootDrop = onRootDrop && target.type === 'root' && !isInternal;
      // Automatically prevent items (i.e. folders) from being dropped on themselves.
      let isValidOnItemDrop = onItemDrop && target.type === 'item' && target.dropPosition === 'on' && !(isInternal && target.key != null && draggingKeys.has(target.key)) && (!shouldAcceptItemDrop || shouldAcceptItemDrop(target, types)) && !selectionManager.isDisabled(target.key);

      if (onDrop || isValidInsert || isValidReorder || isValidRootDrop || isValidOnItemDrop) {
        if (getDropOperation) {
          return getDropOperation(target, types, allowedOperations);
        } else {
          return allowedOperations[0];
        }
      }
    }

    return 'cancel';
  }, [isDisabled, acceptedDragTypes, getDropOperation, onInsert, onRootDrop, onItemDrop, shouldAcceptItemDrop, onReorder, onDrop, selectionManager]);

  return {
    collection,
    selectionManager,
    isDisabled,
    target,
    setTarget(newTarget) {
      if (this.isDropTarget(newTarget)) {
        return;
      }

      let target = targetRef.current;
      if (target && typeof props.onDropExit === 'function') {
        props.onDropExit({
          type: 'dropexit',
          x: 0, // todo
          y: 0,
          target
        });
      }

      if (newTarget && typeof onDropEnter === 'function') {
        onDropEnter({
          type: 'dropenter',
          x: 0, // todo
          y: 0,
          target: newTarget
        });
      }

      targetRef.current = newTarget ?? null;
      setTarget(newTarget ?? null);
    },
    isDropTarget(dropTarget) {
      let target = targetRef.current;
      if (!target || !dropTarget) {
        return false;
      }
      if (isEqualDropTarget(dropTarget, target)) {
        return true;
      }

      // Check if the targets point at the same point between two items, one referring before, and the other after.
      if (
        dropTarget?.type === 'item' &&
        target?.type === 'item' &&
        dropTarget.key !== target.key &&
        dropTarget.dropPosition !== target.dropPosition &&
        dropTarget.dropPosition !== 'on' &&
        target.dropPosition !== 'on'
      ) {
        return isEqualDropTarget(getOppositeTarget(dropTarget), target) ||
          isEqualDropTarget(dropTarget, getOppositeTarget(target));
      }

      return false;
    },
    getDropOperation(e) {
      return defaultGetDropOperation(e);
    }
  };
}

function isEqualDropTarget(a?: DropTarget | null, b?: DropTarget | null) {
  if (!a) {
    return !b;
  }

  switch (a.type) {
    case 'root':
      return b?.type === 'root';
    case 'item':
      return b?.type === 'item' && b?.key === a.key && b?.dropPosition === a.dropPosition;
  }
}
