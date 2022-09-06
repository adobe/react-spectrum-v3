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

import {Collection, DropEvent, DropOperation, DroppableCollectionDropEvent, DroppableCollectionProps, DropPosition, DropTarget, DropTargetDelegate, KeyboardDelegate, Node} from '@react-types/shared';
import * as DragManager from './DragManager';
import {DroppableCollectionState} from '@react-stately/dnd';
import {getDnDState, setDropCollectionRef, useDroppableCollectionId} from './utils';
import {getTypes} from './utils';
import {HTMLAttributes, Key, RefObject, useCallback, useEffect, useRef} from 'react';
import {mergeProps, useLayoutEffect} from '@react-aria/utils';
import {setInteractionModality} from '@react-aria/interactions';
import {useAutoScroll} from './useAutoScroll';
import {useDrop} from './useDrop';

export interface DroppableCollectionOptions extends Omit<DroppableCollectionProps, 'onDropEnter' | 'onDropMove' | 'onDropExit' | 'getDropOperations'> {
  keyboardDelegate: KeyboardDelegate,
  dropTargetDelegate: DropTargetDelegate
}

export interface DroppableCollectionResult {
  collectionProps: HTMLAttributes<HTMLElement>
}

interface DroppingState {
  collection: Collection<Node<unknown>>,
  focusedKey: Key,
  selectedKeys: Set<Key>,
  timeout: ReturnType<typeof setTimeout>
}

const DROP_POSITIONS: DropPosition[] = ['before', 'on', 'after'];

export function useDroppableCollection(props: DroppableCollectionOptions, state: DroppableCollectionState, ref: RefObject<HTMLElement>): DroppableCollectionResult {
  let localState = useRef({
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
      acceptedDragTypes
      // isValidDropTarget
    } = localState.props;

    let {draggingCollectionRef, draggingKeys} = getDnDState();
    let isInternalDrop = draggingCollectionRef?.current === ref?.current;
    let {
      target,
      dropOperation,
      items
    } = e;

    let filteredItems = items;
    if (acceptedDragTypes) {
      filteredItems = items.filter((item) => {
        let itemTypes = [];
        if (item.kind === 'directory') {
          return acceptedDragTypes === 'all' || acceptedDragTypes.includes('directory');
        } else {
          itemTypes = item.kind === 'file' ? [item.type] : [...item.types];
        }

        // TODO: fix this logic, maybe adjust what isValidDropTarget accepts. We need to in case the dropped on folder has extra restriction compared to the collection itself.
        // check to see if there is a way to convert back to dragTypes. Maybe add another prop call? Or add another arg to isValidDropTarget for item which would only be defined during onDrop but not
        // getDropOperation
        return acceptedDragTypes === 'all' || itemTypes.some(type => acceptedDragTypes.includes(type));
        // if (validDragType) {
        //   // return (target.type === 'root' || target.dropPosition !== 'on' || (target.dropPosition === 'on' && isValidDropTarget(target, itemTypes)));
        // }
      });
    }

    if (target.type === 'root' && onRootDrop) {
      await onRootDrop({items: filteredItems, dropOperation});
    }

    if (target.type === 'item') {
      if (target.dropPosition === 'on' && onItemDrop) {
        await onItemDrop({items: filteredItems, dropOperation, isInternalDrop, target: {key: target.key, dropPosition: 'on'}});
      }

      if (target.dropPosition !== 'on') {
        if (!isInternalDrop && onInsert) {
          await onInsert({items: filteredItems, dropOperation, target: {key: target.key, dropPosition: target.dropPosition}});
        }

        if (isInternalDrop && e.dropOperation === 'move' && onReorder) {
          // TODO: get rid of e.dropOperation === 'move' restriction if we want onReorder to handle internal copy dnd operations?
          await onReorder({keys: draggingKeys, target: {key: target.key, dropPosition: target.dropPosition}});
        }
      }
    }
  }, [localState, ref]);

  let autoScroll = useAutoScroll(ref);
  let {dropProps} = useDrop({
    ref,
    onDropEnter() {
      state.setTarget(localState.nextTarget);
    },
    onDropMove(e) {
      state.setTarget(localState.nextTarget);
      autoScroll.move(e.x, e.y);
    },
    getDropOperationForPoint(types, allowedOperations, x, y) {
      let {draggingCollectionRef, draggingKeys, dropCollectionRef} = getDnDState();
      let isInternalDrop = draggingCollectionRef?.current === ref?.current;
      let isValidDropTarget = (target) => state.getDropOperation({target, types, allowedOperations, isInternalDrop, draggingKeys}) !== 'cancel';
      let target = props.dropTargetDelegate.getDropTargetFromPoint(x, y, isValidDropTarget);
      if (!target) {
        localState.dropOperation = 'cancel';
        localState.nextTarget = null;
        return 'cancel';
      }

      localState.dropOperation = state.getDropOperation({target, types, allowedOperations, isInternalDrop, draggingKeys});

      // If the target doesn't accept the drop, see if the root accepts it instead.
      if (localState.dropOperation === 'cancel') {
        let rootTarget: DropTarget = {type: 'root'};
        let dropOperation = state.getDropOperation({target: rootTarget, types, allowedOperations, isInternalDrop, draggingKeys});
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
    }
  });

  let droppingState = useRef<DroppingState>(null);
  let onDrop = useCallback((e: DropEvent, target: DropTarget) => {
    let {state} = localState;

    // Focus the collection.
    state.selectionManager.setFocused(true);

    // Save some state of the collection/selection before the drop occurs so we can compare later.
    let focusedKey = state.selectionManager.focusedKey;
    droppingState.current = {
      timeout: null,
      focusedKey,
      collection: state.collection,
      selectedKeys: state.selectionManager.selectedKeys
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
    // and for React to re-render. If an insert occurs during this time, it will be selected/focused below.
    // If items are not "immediately" inserted by the onDrop handler, the application will need to handle
    // selecting and focusing those items themselves.
    droppingState.current.timeout = setTimeout(() => {
      // If focus didn't move already (e.g. due to an insert), and the user dropped on an item,
      // focus that item and show the focus ring to give the user feedback that the drop occurred.
      // Also show the focus ring if the focused key is not selected, e.g. in case of a reorder.
      let {state} = localState;
      if (state.selectionManager.focusedKey === focusedKey) {
        if (target.type === 'item' && target.dropPosition === 'on' && state.collection.getItem(target.key) != null) {
          state.selectionManager.setFocusedKey(target.key);
          state.selectionManager.setFocused(true);
          setInteractionModality('keyboard');
        } else if (!state.selectionManager.isSelected(focusedKey)) {
          setInteractionModality('keyboard');
        }
      }

      droppingState.current = null;
    }, 50);
  }, [localState, defaultOnDrop]);

  // eslint-disable-next-line arrow-body-style
  useEffect(() => {
    return () => {
      if (droppingState.current) {
        clearTimeout(droppingState.current.timeout);
      }
    };
  }, []);

  useLayoutEffect(() => {
    // If an insert occurs during a drop, we want to immediately select these items to give
    // feedback to the user that a drop occurred. Only do this if the selection didn't change
    // since the drop started so we don't override if the user or application did something.
    if (
      droppingState.current &&
      state.selectionManager.isFocused &&
      state.collection.size > droppingState.current.collection.size &&
      state.selectionManager.isSelectionEqual(droppingState.current.selectedKeys)
    ) {
      let newKeys = new Set<Key>();
      for (let key of state.collection.getKeys()) {
        if (!droppingState.current.collection.getItem(key)) {
          newKeys.add(key);
        }
      }

      state.selectionManager.setSelectedKeys(newKeys);

      // If the focused item didn't change since the drop occurred, also focus the first
      // inserted item. If selection is disabled, then also show the focus ring so there
      // is some indication that items were added.
      if (state.selectionManager.focusedKey === droppingState.current.focusedKey) {
        let first = newKeys.keys().next().value;
        state.selectionManager.setFocusedKey(first);

        if (state.selectionManager.selectionMode === 'none') {
          setInteractionModality('keyboard');
        }
      }

      droppingState.current = null;
    }
  });

  useEffect(() => {
    let getNextTarget = (target: DropTarget, wrap = true): DropTarget => {
      if (!target) {
        return {
          type: 'root'
        };
      }

      let {keyboardDelegate} = localState.props;
      let nextKey = target.type === 'item'
        ? keyboardDelegate.getKeyBelow(target.key)
        : keyboardDelegate.getFirstKey();
      let dropPosition: DropPosition = 'before';

      if (target.type === 'item') {
        let positionIndex = DROP_POSITIONS.indexOf(target.dropPosition);
        let nextDropPosition = DROP_POSITIONS[positionIndex + 1];
        if (positionIndex < DROP_POSITIONS.length - 1 && !(nextDropPosition === 'after' && nextKey != null)) {
          return {
            type: 'item',
            key: target.key,
            dropPosition: nextDropPosition
          };
        }

        // If the last drop position was 'after', then 'before' on the next key is equivalent.
        // Switch to 'on' instead.
        if (target.dropPosition === 'after') {
          dropPosition = 'on';
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

    let getPreviousTarget = (target: DropTarget, wrap = true): DropTarget => {
      let {keyboardDelegate} = localState.props;
      let nextKey = target?.type === 'item'
        ? keyboardDelegate.getKeyAbove(target.key)
        : keyboardDelegate.getLastKey();
      let dropPosition: DropPosition = !target || target.type === 'root' ? 'after' : 'on';

      if (target?.type === 'item') {
        let positionIndex = DROP_POSITIONS.indexOf(target.dropPosition);
        let nextDropPosition = DROP_POSITIONS[positionIndex - 1];
        if (positionIndex > 0 && nextDropPosition !== 'after') {
          return {
            type: 'item',
            key: target.key,
            dropPosition: nextDropPosition
          };
        }

        // If the last drop position was 'before', then 'after' on the previous key is equivalent.
        // Switch to 'on' instead.
        if (target.dropPosition === 'before') {
          dropPosition = 'on';
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
      target: DropTarget,
      types: Set<string>,
      allowedDropOperations: DropOperation[],
      getNextTarget: (target: DropTarget, wrap: boolean) => DropTarget,
      wrap = true
    ): DropTarget => {
      let seenRoot = 0;
      let operation: DropOperation;
      let {draggingCollectionRef, draggingKeys} = getDnDState();
      let isInternalDrop = draggingCollectionRef?.current === ref?.current;
      do {
        let nextTarget = getNextTarget(target, wrap);
        if (!nextTarget) {
          return null;
        }
        target = nextTarget;
        operation = localState.state.getDropOperation({target: nextTarget, types, allowedOperations: allowedDropOperations, isInternalDrop, draggingKeys});
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
      getDropOperation(types, allowedOperations) {
        if (localState.state.target) {
          let {draggingCollectionRef, draggingKeys} = getDnDState();
          let isInternalDrop = draggingCollectionRef?.current === ref?.current;
          return localState.state.getDropOperation({target: localState.state.target, types, allowedOperations, isInternalDrop, draggingKeys});
        }

        // Check if any of the targets accept the drop.
        // TODO: should we have a faster way of doing this or e.g. for pagination?
        let target = nextValidTarget(null, types, allowedOperations, getNextTarget);
        return target ? 'move' : 'cancel';
      },
      onDropEnter(e, drag) {
        let types = getTypes(drag.items);
        let selectionManager = localState.state.selectionManager;
        let target: DropTarget;
        // Update the drop collection ref tracker for useDroppableItem's getDropOperation isInternalDrop check
        setDropCollectionRef(ref);

        // When entering the droppable collection for the first time, the default drop target
        // is after the focused key.
        let key = selectionManager.focusedKey;
        let dropPosition: DropPosition = 'after';

        // If the focused key is a cell, get the parent item instead.
        // For now, we assume that individual cells cannot be dropped on.
        let item = localState.state.collection.getItem(key);
        if (item?.type === 'cell') {
          key = item.parentKey;
        }

        // If the focused item is also selected, the default drop target is after the last selected item.
        // But if the focused key is the first selected item, then default to before the first selected item.
        // This is to make reordering lists slightly easier. If you select top down, we assume you want to
        // move the items down. If you select bottom up, we assume you want to move the items up.
        if (selectionManager.isSelected(key)) {
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

          let {draggingCollectionRef, draggingKeys} = getDnDState();
          let isInternalDrop = draggingCollectionRef?.current === ref?.current;
          // If the default target is not valid, find the next one that is.
          if (localState.state.getDropOperation({target, types, allowedOperations: drag.allowedDropOperations, isInternalDrop, draggingKeys}) === 'cancel') {
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
                let nextKey = keyboardDelegate.getKeyPageBelow(
                  target.type === 'item'
                    ? target.key
                    : keyboardDelegate.getFirstKey()
                );
                let dropPosition = target.type === 'item' ? target.dropPosition : 'after';

                // If there is no next key, or we are starting on the last key, jump to the last possible position.
                if (nextKey == null || (target.type === 'item' && target.key === keyboardDelegate.getLastKey())) {
                  nextKey = keyboardDelegate.getLastKey();
                  dropPosition = 'after';
                }

                target = {
                  type: 'item',
                  key: nextKey,
                  dropPosition
                };

                // If the target does not accept the drop, find the next valid target.
                // If no next valid target, find the previous valid target.
                let {draggingCollectionRef, draggingKeys} = getDnDState();
                let isInternalDrop = draggingCollectionRef?.current === ref?.current;
                let operation = localState.state.getDropOperation({target, types, allowedOperations: drag.allowedDropOperations, isInternalDrop, draggingKeys});
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
              if (target.key === keyboardDelegate.getFirstKey()) {
                target = {
                  type: 'root'
                };
              } else {
                let nextKey = keyboardDelegate.getKeyPageAbove(target.key);
                let dropPosition = target.dropPosition;
                if (nextKey == null) {
                  nextKey = keyboardDelegate.getFirstKey();
                  dropPosition = 'before';
                }

                target = {
                  type: 'item',
                  key: nextKey,
                  dropPosition
                };
              }

              // If the target does not accept the drop, find the previous valid target.
              // If no next valid target, find the next valid target.
              let {draggingCollectionRef, draggingKeys} = getDnDState();
              let isInternalDrop = draggingCollectionRef?.current === ref?.current;
              let operation = localState.state.getDropOperation({target, types, allowedOperations: drag.allowedDropOperations, isInternalDrop, draggingKeys});
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
  }, [localState, ref, onDrop]);

  let id = useDroppableCollectionId(state);
  return {
    collectionProps: mergeProps(dropProps, {
      id,
      // Remove description from collection element. If dropping on the entire collection,
      // there should be a drop indicator that has this description, so no need to double announce.
      'aria-describedby': null
    })
  };
}
