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

import {
  clearGlobalDnDState,
  DIRECTORY_DRAG_TYPE,
  droppableCollectionMap,
  getTypes,
  globalDndState,
  isInternalDropOperation,
  setDropCollectionRef
} from './utils';
import {
  Collection,
  DOMProps,
  DropEvent,
  DropOperation,
  DroppableCollectionDropEvent,
  DroppableCollectionProps,
  DropPosition,
  DropTarget,
  DropTargetDelegate,
  Key,
  KeyboardDelegate,
  Node,
  RefObject
} from '@react-types/shared';
import * as DragManager from './DragManager';
import {DroppableCollectionState} from '@react-stately/dnd';
import {HTMLAttributes, useCallback, useEffect, useRef} from 'react';
import {mergeProps, useId, useLayoutEffect} from '@react-aria/utils';
import {setInteractionModality} from '@react-aria/interactions';
import {useAutoScroll} from './useAutoScroll';
import {useDrop} from './useDrop';
import {useLocale} from '@react-aria/i18n';

export interface DroppableCollectionOptions extends DOMProps, DroppableCollectionProps {
  /** A delegate object that implements behavior for keyboard focus movement. */
  keyboardDelegate: KeyboardDelegate,
  /** A delegate object that provides drop targets for pointer coordinates within the collection. */
  dropTargetDelegate: DropTargetDelegate
}

export interface DroppableCollectionResult {
  /** Props for the collection element. */
  collectionProps: HTMLAttributes<HTMLElement>
}

interface DroppingState {
  collection: Collection<Node<unknown>>,
  focusedKey: Key | null,
  selectedKeys: Set<Key>,
  target: DropTarget,
  draggingKeys: Set<Key | null | undefined>,
  isInternal: boolean,
  timeout: ReturnType<typeof setTimeout> | undefined
}

const DROP_POSITIONS: DropPosition[] = ['before', 'on', 'after'];
const DROP_POSITIONS_RTL: DropPosition[] = ['after', 'on', 'before'];

/**
 * Handles drop interactions for a collection component, with support for traditional mouse and touch
 * based drag and drop, in addition to full parity for keyboard and screen reader users.
 */
export function useDroppableCollection(props: DroppableCollectionOptions, state: DroppableCollectionState, ref: RefObject<HTMLElement | null>): DroppableCollectionResult {
  let localState = useRef<{
    props: DroppableCollectionOptions,
    state: DroppableCollectionState,
    nextTarget: DropTarget | null,
    dropOperation: DropOperation | null
  }>({
    props,
    state,
    nextTarget: null,
    dropOperation: null
  }).current;
  localState.props = props;
  localState.state = state;

  let defaultOnDrop = useCallback(async (e: DroppableCollectionDropEvent) => {
    let {
      onInsert,
      onRootDrop,
      onItemDrop,
      onReorder,
      acceptedDragTypes = 'all',
      shouldAcceptItemDrop
    } = localState.props;

    let {draggingKeys} = globalDndState;
    let isInternal = isInternalDropOperation(ref);
    let {
      target,
      dropOperation,
      items
    } = e;

    let filteredItems = items;
    if (acceptedDragTypes !== 'all' || shouldAcceptItemDrop) {
      filteredItems = items.filter(item => {
        let itemTypes: Set<string | symbol>;
        if (item.kind === 'directory') {
          itemTypes = new Set([DIRECTORY_DRAG_TYPE]);
        } else {
          itemTypes = item.kind === 'file' ? new Set([item.type]) : item.types;
        }

        if (acceptedDragTypes === 'all' || acceptedDragTypes.some(type => itemTypes.has(type))) {
          // If we are performing a on item drop, check if the item in question accepts the dropped item since the item may have heavier restrictions
          // than the droppable collection itself
          if (target.type === 'item' && target.dropPosition === 'on' && shouldAcceptItemDrop) {
            return shouldAcceptItemDrop(target, itemTypes);
          }
          return true;
        }

        return false;
      });
    }

    if (filteredItems.length > 0) {
      if (target.type === 'root' && onRootDrop) {
        await onRootDrop({items: filteredItems, dropOperation});
      }

      if (target.type === 'item') {
        if (target.dropPosition === 'on' && onItemDrop) {
          await onItemDrop({items: filteredItems, dropOperation, isInternal, target});
        }

        if (target.dropPosition !== 'on') {
          if (!isInternal && onInsert) {
            await onInsert({items: filteredItems, dropOperation, target});
          }

          if (isInternal && onReorder) {
            await onReorder({keys: draggingKeys, dropOperation, target});
          }
        }
      }
    }
  }, [localState, ref]);

  let autoScroll = useAutoScroll(ref);
  let {dropProps} = useDrop({
    ref,
    onDropEnter() {
      if (localState.nextTarget != null) {
        state.setTarget(localState.nextTarget);
      }
    },
    onDropMove(e) {
      if (localState.nextTarget != null) {
        state.setTarget(localState.nextTarget);
      }
      autoScroll.move(e.x, e.y);
    },
    getDropOperationForPoint(types, allowedOperations, x, y) {
      let {draggingKeys, dropCollectionRef} = globalDndState;
      let isInternal = isInternalDropOperation(ref);
      let isValidDropTarget = (target) => state.getDropOperation({target, types, allowedOperations, isInternal, draggingKeys}) !== 'cancel';
      let target = props.dropTargetDelegate.getDropTargetFromPoint(x, y, isValidDropTarget);
      if (!target) {
        localState.dropOperation = 'cancel';
        localState.nextTarget = null;
        return 'cancel';
      }

      localState.dropOperation = state.getDropOperation({target, types, allowedOperations, isInternal, draggingKeys});

      // If the target doesn't accept the drop, see if the root accepts it instead.
      if (localState.dropOperation === 'cancel') {
        let rootTarget: DropTarget = {type: 'root'};
        let dropOperation = state.getDropOperation({target: rootTarget, types, allowedOperations, isInternal, draggingKeys});
        if (dropOperation !== 'cancel') {
          target = rootTarget;
          localState.dropOperation = dropOperation;
        }
      }

      // Only set dropCollectionRef if there is a valid drop target since we cleanup dropCollectionRef in onDropExit
      // which only runs when leaving a valid drop target or if the dropEffect become none (mouse dnd only).
      if (target && localState.dropOperation !== 'cancel' && ref?.current !== dropCollectionRef?.current) {
        setDropCollectionRef(ref);
      }
      localState.nextTarget = localState.dropOperation === 'cancel' ? null : target;
      return localState.dropOperation;
    },
    onDropExit() {
      setDropCollectionRef(undefined);
      state.setTarget(null);
      autoScroll.stop();
    },
    onDropActivate(e) {
      if (state.target?.type === 'item' && state.target?.dropPosition === 'on' && typeof props.onDropActivate === 'function') {
        props.onDropActivate({
          type: 'dropactivate',
          x: e.x, // todo
          y: e.y,
          target: state.target
        });
      }
    },
    onDrop(e) {
      setDropCollectionRef(ref);
      if (state.target) {
        onDrop(e, state.target);
      }

      // If there wasn't a collection being tracked as a dragged collection, then we are in a case where a non RSP drag is dropped on a
      // RSP collection and thus we don't need to preserve the global DnD state for onDragEnd
      let {draggingCollectionRef} = globalDndState;
      if (draggingCollectionRef == null) {
        clearGlobalDnDState();
      }
    }
  });

  let droppingState = useRef<DroppingState>(null);
  let updateFocusAfterDrop = useCallback(() => {
    let {state} = localState;
    if (droppingState.current) {
      let {
        target,
        collection: prevCollection,
        selectedKeys: prevSelectedKeys,
        focusedKey: prevFocusedKey,
        isInternal,
        draggingKeys
      } = droppingState.current;

      // If an insert occurs during a drop, we want to immediately select these items to give
      // feedback to the user that a drop occurred. Only do this if the selection didn't change
      // since the drop started so we don't override if the user or application did something.
      if (
        state.collection.size > prevCollection.size &&
        state.selectionManager.isSelectionEqual(prevSelectedKeys)
      ) {
        let newKeys = new Set<Key>();
        for (let key of state.collection.getKeys()) {
          if (!prevCollection.getItem(key)) {
            newKeys.add(key);
          }
        }

        state.selectionManager.setSelectedKeys(newKeys);

        // If the focused item didn't change since the drop occurred, also focus the first
        // inserted item. If selection is disabled, then also show the focus ring so there
        // is some indication that items were added.
        if (state.selectionManager.focusedKey === prevFocusedKey) {
          let first = newKeys.keys().next().value;
          let item = state.collection.getItem(first);

          // If this is a cell, focus the parent row.
          if (item?.type === 'cell') {
            first = item.parentKey;
          }

          state.selectionManager.setFocusedKey(first);

          if (state.selectionManager.selectionMode === 'none') {
            setInteractionModality('keyboard');
          }
        }
      } else if (
        prevFocusedKey != null &&
        state.selectionManager.focusedKey === prevFocusedKey &&
        isInternal &&
        target.type === 'item' &&
        target.dropPosition !== 'on' &&
        draggingKeys.has(state.collection.getItem(prevFocusedKey)?.parentKey)
      ) {
        // Focus row instead of cell when reordering.
        state.selectionManager.setFocusedKey(state.collection.getItem(prevFocusedKey)?.parentKey ?? null);
        setInteractionModality('keyboard');
      } else if (
        state.selectionManager.focusedKey === prevFocusedKey &&
        target.type === 'item' &&
        target.dropPosition === 'on' &&
        state.collection.getItem(target.key) != null
      ) {
        // If focus didn't move already (e.g. due to an insert), and the user dropped on an item,
        // focus that item and show the focus ring to give the user feedback that the drop occurred.
        // Also show the focus ring if the focused key is not selected, e.g. in case of a reorder.
        state.selectionManager.setFocusedKey(target.key);
        setInteractionModality('keyboard');
      } else if (state.selectionManager.focusedKey != null && !state.selectionManager.isSelected(state.selectionManager.focusedKey)) {
        setInteractionModality('keyboard');
      }

      state.selectionManager.setFocused(true);
    }
  }, [localState]);

  let onDrop = useCallback((e: DropEvent, target: DropTarget) => {
    let {state} = localState;

    // Save some state of the collection/selection before the drop occurs so we can compare later.
    droppingState.current = {
      timeout: undefined,
      focusedKey: state.selectionManager.focusedKey,
      collection: state.collection,
      selectedKeys: state.selectionManager.selectedKeys,
      draggingKeys: globalDndState.draggingKeys,
      isInternal: isInternalDropOperation(ref),
      target
    };

    let onDropFn = localState.props.onDrop || defaultOnDrop;
    onDropFn({
      type: 'drop',
      x: e.x, // todo
      y: e.y,
      target,
      items: e.items,
      dropOperation: e.dropOperation
    });

    // Wait for a short time period after the onDrop is called to allow the data to be read asynchronously
    // and for React to re-render. If the collection didn't already change during this time (handled below),
    // update the focused key here.
    droppingState.current.timeout = setTimeout(() => {
      updateFocusAfterDrop();
      droppingState.current = null;
    }, 50);
  }, [localState, defaultOnDrop, ref, updateFocusAfterDrop]);

   
  useEffect(() => {
    return () => {
      if (droppingState.current) {
        clearTimeout(droppingState.current.timeout);
      }
    };
  }, []);

  useLayoutEffect(() => {
    // If the collection changed after a drop, update the focused key.
    if (droppingState.current && state.collection !== droppingState.current.collection) {
      updateFocusAfterDrop();
    }
  });

  let {direction} = useLocale();
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    let getNextTarget = (target: DropTarget | null | undefined, wrap = true, horizontal = false): DropTarget | null => {
      if (!target) {
        return {
          type: 'root'
        };
      }

      let {keyboardDelegate} = localState.props;
      let nextKey: Key | null | undefined;
      if (target?.type === 'item') {
        nextKey = horizontal ? keyboardDelegate.getKeyRightOf?.(target.key) : keyboardDelegate.getKeyBelow?.(target.key);
      } else {
        nextKey = horizontal && direction === 'rtl' ? keyboardDelegate.getLastKey?.() : keyboardDelegate.getFirstKey?.();
      }
      let dropPositions = horizontal && direction === 'rtl' ? DROP_POSITIONS_RTL : DROP_POSITIONS;
      let dropPosition: DropPosition = dropPositions[0];

      if (target.type === 'item') {
        // If the the keyboard delegate returned the next key in the collection,
        // first try the other positions in the current key. Otherwise (e.g. in a grid layout),
        // jump to the same drop position in the new key.
        let nextCollectionKey = horizontal && direction === 'rtl' ? localState.state.collection.getKeyBefore(target.key) : localState.state.collection.getKeyAfter(target.key);
        let isNextDisabled = nextCollectionKey && localState.state.selectionManager.isDisabled(nextCollectionKey);
        if (nextKey == null || nextKey === nextCollectionKey || isNextDisabled) {
          let positionIndex = dropPositions.indexOf(target.dropPosition);
          let nextDropPosition = dropPositions[positionIndex + 1];
          if (positionIndex < dropPositions.length - 1 && (!(nextDropPosition === dropPositions[2] && nextKey != null) || isNextDisabled)) {
            return {
              type: 'item',
              key: target.key,
              dropPosition: nextDropPosition
            };
          }

          if (isNextDisabled) {
            nextKey = nextCollectionKey;
          }

          // If the last drop position was 'after', then 'before' on the next key is equivalent.
          // Switch to 'on' instead.
          if (target.dropPosition === dropPositions[2]) {
            dropPosition = 'on';
          }
        } else {
          dropPosition = target.dropPosition;
        }
      }

      if (nextKey == null) {
        if (wrap) {
          return {
            type: 'root'
          };
        }

        return null;
      }

      return {
        type: 'item',
        key: nextKey,
        dropPosition
      };
    };

    let getPreviousTarget = (target: DropTarget | null | undefined, wrap = true, horizontal = false): DropTarget | null => {
      let {keyboardDelegate} = localState.props;
      let nextKey: Key | null | undefined;
      if (target?.type === 'item') {
        nextKey = horizontal ? keyboardDelegate.getKeyLeftOf?.(target.key) : keyboardDelegate.getKeyAbove?.(target.key);
      } else {
        nextKey = horizontal && direction === 'rtl' ? keyboardDelegate.getFirstKey?.() : keyboardDelegate.getLastKey?.();
      }
      let dropPositions = horizontal && direction === 'rtl' ? DROP_POSITIONS_RTL : DROP_POSITIONS;
      let dropPosition: DropPosition = !target || target.type === 'root' ? dropPositions[2] : 'on';

      if (target?.type === 'item') {
        // If the the keyboard delegate returned the previous key in the collection,
        // first try the other positions in the current key. Otherwise (e.g. in a grid layout),
        // jump to the same drop position in the new key.
        let prevCollectionKey = horizontal && direction === 'rtl' ? localState.state.collection.getKeyAfter(target.key) : localState.state.collection.getKeyBefore(target.key);
        let isPrevDisabled = prevCollectionKey && localState.state.selectionManager.isDisabled(prevCollectionKey);
        if (nextKey == null || nextKey === prevCollectionKey || isPrevDisabled) {
          let positionIndex = dropPositions.indexOf(target.dropPosition);
          let nextDropPosition = dropPositions[positionIndex - 1];
          if (positionIndex > 0 && (nextDropPosition !== dropPositions[2] || isPrevDisabled)) {
            return {
              type: 'item',
              key: target.key,
              dropPosition: nextDropPosition
            };
          }

          if (isPrevDisabled) {
            nextKey = prevCollectionKey;
          }

          // If the last drop position was 'before', then 'after' on the previous key is equivalent.
          // Switch to 'on' instead.
          if (target.dropPosition === dropPositions[0]) {
            dropPosition = 'on';
          }
        } else {
          dropPosition = target.dropPosition;
        }
      }

      if (nextKey == null) {
        if (wrap) {
          return {
            type: 'root'
          };
        }

        return null;
      }

      return {
        type: 'item',
        key: nextKey,
        dropPosition
      };
    };

    let nextValidTarget = (
      target: DropTarget | null | undefined,
      types: Set<string>,
      allowedDropOperations: DropOperation[],
      getNextTarget: (target: DropTarget | null | undefined, wrap: boolean) => DropTarget | null,
      wrap = true
    ): DropTarget | null => {
      let seenRoot = 0;
      let operation: DropOperation;
      let {draggingKeys} = globalDndState;
      let isInternal = isInternalDropOperation(ref);
      do {
        let nextTarget = getNextTarget(target, wrap);
        if (!nextTarget) {
          return null;
        }
        target = nextTarget;
        operation = localState.state.getDropOperation({target: nextTarget, types, allowedOperations: allowedDropOperations, isInternal, draggingKeys});
        if (target.type === 'root') {
          seenRoot++;
        }
      } while (
        operation === 'cancel' &&
        !localState.state.isDropTarget(target) &&
        seenRoot < 2
      );

      if (operation === 'cancel') {
        return null;
      }

      return target;
    };

    return DragManager.registerDropTarget({
      element: ref.current,
      preventFocusOnDrop: true,
      getDropOperation(types, allowedOperations) {
        if (localState.state.target) {
          let {draggingKeys} = globalDndState;
          let isInternal = isInternalDropOperation(ref);
          return localState.state.getDropOperation({target: localState.state.target, types, allowedOperations, isInternal, draggingKeys});
        }

        // Check if any of the targets accept the drop.
        // TODO: should we have a faster way of doing this or e.g. for pagination?
        let target = nextValidTarget(null, types, allowedOperations, getNextTarget);
        return target ? 'move' : 'cancel';
      },
      onDropEnter(e, drag) {
        let types = getTypes(drag.items);
        let selectionManager = localState.state.selectionManager;
        let target: DropTarget | null = null;
        // Update the drop collection ref tracker for useDroppableItem's getDropOperation isInternal check
        setDropCollectionRef(ref);

        // When entering the droppable collection for the first time, the default drop target
        // is after the focused key.
        let key: Key | null | undefined = selectionManager.focusedKey;
        let dropPosition: DropPosition = 'after';

        // If the focused key is a cell, get the parent item instead.
        // For now, we assume that individual cells cannot be dropped on.
        let item = key != null ? localState.state.collection.getItem(key) : null;
        if (item?.type === 'cell') {
          key = item.parentKey;
        }

        // If the focused item is also selected, the default drop target is after the last selected item.
        // But if the focused key is the first selected item, then default to before the first selected item.
        // This is to make reordering lists slightly easier. If you select top down, we assume you want to
        // move the items down. If you select bottom up, we assume you want to move the items up.
        if (key != null && selectionManager.isSelected(key)) {
          if (selectionManager.selectedKeys.size > 1 && selectionManager.firstSelectedKey === key) {
            dropPosition = 'before';
          } else {
            key = selectionManager.lastSelectedKey;
          }
        }

        if (key != null) {
          target = {
            type: 'item',
            key,
            dropPosition
          };

          let {draggingKeys} = globalDndState;
          let isInternal = isInternalDropOperation(ref);
          // If the default target is not valid, find the next one that is.
          if (localState.state.getDropOperation({target, types, allowedOperations: drag.allowedDropOperations, isInternal, draggingKeys}) === 'cancel') {
            target = nextValidTarget(target, types, drag.allowedDropOperations, getNextTarget, false)
              ?? nextValidTarget(target, types, drag.allowedDropOperations, getPreviousTarget, false);
          }
        }

        // If no focused key, then start from the root.
        if (!target) {
          target = nextValidTarget(null, types, drag.allowedDropOperations, getNextTarget);
        }

        localState.state.setTarget(target);
      },
      onDropExit() {
        setDropCollectionRef(undefined);
        localState.state.setTarget(null);
      },
      onDropTargetEnter(target) {
        localState.state.setTarget(target);
      },
      onDropActivate(e) {
        if (
          localState.state.target?.type === 'item' &&
          localState.state.target?.dropPosition === 'on' &&
          typeof localState.props.onDropActivate === 'function'
        ) {
          localState.props.onDropActivate({
            type: 'dropactivate',
            x: e.x, // todo
            y: e.y,
            target: localState.state.target
          });
        }
      },
      onDrop(e, target) {
        setDropCollectionRef(ref);
        if (localState.state.target) {
          onDrop(e, target || localState.state.target);
        }
      },
      onKeyDown(e, drag) {
        let {keyboardDelegate} = localState.props;
        let types = getTypes(drag.items);
        switch (e.key) {
          case 'ArrowDown': {
            if (keyboardDelegate.getKeyBelow) {
              let target = nextValidTarget(localState.state.target, types, drag.allowedDropOperations, getNextTarget);
              localState.state.setTarget(target);
            }
            break;
          }
          case 'ArrowUp': {
            if (keyboardDelegate.getKeyAbove) {
              let target = nextValidTarget(localState.state.target, types, drag.allowedDropOperations, getPreviousTarget);
              localState.state.setTarget(target);
            }
            break;
          }
          case 'ArrowLeft': {
            if (keyboardDelegate.getKeyLeftOf) {
              let target = nextValidTarget(localState.state.target, types, drag.allowedDropOperations, (target, wrap) => getPreviousTarget(target, wrap, true));
              localState.state.setTarget(target);
            }
            break;
          }
          case 'ArrowRight': {
            if (keyboardDelegate.getKeyRightOf) {
              let target = nextValidTarget(localState.state.target, types, drag.allowedDropOperations, (target, wrap) => getNextTarget(target, wrap, true));
              localState.state.setTarget(target);
            }
            break;
          }
          case 'Home': {
            if (keyboardDelegate.getFirstKey) {
              let target = nextValidTarget(null, types, drag.allowedDropOperations, getNextTarget);
              localState.state.setTarget(target);
            }
            break;
          }
          case 'End': {
            if (keyboardDelegate.getLastKey) {
              let target = nextValidTarget(null, types, drag.allowedDropOperations, getPreviousTarget);
              localState.state.setTarget(target);
            }
            break;
          }
          case 'PageDown': {
            if (keyboardDelegate.getKeyPageBelow) {
              let target = localState.state.target;
              if (!target) {
                target = nextValidTarget(null, types, drag.allowedDropOperations, getNextTarget);
              } else {
                // If on the root, go to the item a page below the top. Otherwise a page below the current item.
                let targetKey = keyboardDelegate.getFirstKey?.();
                if (target.type === 'item') {
                  targetKey = target.key;
                }
                let nextKey: Key | null = null;
                if (targetKey != null) {
                  nextKey = keyboardDelegate.getKeyPageBelow(targetKey);
                }
                let dropPosition = target.type === 'item' ? target.dropPosition : 'after';

                // If there is no next key, or we are starting on the last key, jump to the last possible position.
                if (nextKey == null || (target.type === 'item' && target.key === keyboardDelegate.getLastKey?.())) {
                  nextKey = keyboardDelegate.getLastKey?.() ?? null;
                  dropPosition = 'after';
                }

                if (nextKey == null) {
                  break;
                }
                target = {
                  type: 'item',
                  key: nextKey,
                  dropPosition
                };

                // If the target does not accept the drop, find the next valid target.
                // If no next valid target, find the previous valid target.
                let {draggingCollectionRef, draggingKeys} = globalDndState;
                let isInternal = draggingCollectionRef?.current === ref?.current;
                let operation = localState.state.getDropOperation({target, types, allowedOperations: drag.allowedDropOperations, isInternal, draggingKeys});
                if (operation === 'cancel') {
                  target = nextValidTarget(target, types, drag.allowedDropOperations, getNextTarget, false)
                    ?? nextValidTarget(target, types, drag.allowedDropOperations, getPreviousTarget, false);
                }
              }

              localState.state.setTarget(target ?? localState.state.target);
            }
            break;
          }
          case 'PageUp': {
            if (!keyboardDelegate.getKeyPageAbove) {
              break;
            }

            let target = localState.state.target;
            if (!target) {
              target = nextValidTarget(null, types, drag.allowedDropOperations, getPreviousTarget);
            } else if (target.type === 'item') {
              // If at the top already, switch to the root. Otherwise navigate a page up.
              if (target.key === keyboardDelegate.getFirstKey?.()) {
                target = {
                  type: 'root'
                };
              } else {
                let nextKey: Key | null | undefined = keyboardDelegate.getKeyPageAbove(target.key);
                let dropPosition = target.dropPosition;
                if (nextKey == null) {
                  nextKey = keyboardDelegate.getFirstKey?.();
                  dropPosition = 'before';
                }

                if (nextKey == null) {
                  break;
                }
                target = {
                  type: 'item',
                  key: nextKey,
                  dropPosition
                };
              }

              // If the target does not accept the drop, find the previous valid target.
              // If no next valid target, find the next valid target.
              let {draggingKeys} = globalDndState;
              let isInternal = isInternalDropOperation(ref);
              let operation = localState.state.getDropOperation({target, types, allowedOperations: drag.allowedDropOperations, isInternal, draggingKeys});
              if (operation === 'cancel') {
                target = nextValidTarget(target, types, drag.allowedDropOperations, getPreviousTarget, false)
                  ?? nextValidTarget(target, types, drag.allowedDropOperations, getNextTarget, false);
              }
            }

            localState.state.setTarget(target ?? localState.state.target);
            break;
          }
        }
      }
    });
  }, [localState, ref, onDrop, direction]);

  let id = useId(props.id);
  droppableCollectionMap.set(state, {id, ref});
  return {
    collectionProps: mergeProps(dropProps, {
      id,
      // Remove description from collection element. If dropping on the entire collection,
      // there should be a drop indicator that has this description, so no need to double announce.
      'aria-describedby': null
    })
  };
}
