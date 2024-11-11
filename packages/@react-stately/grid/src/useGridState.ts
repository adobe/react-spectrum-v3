import {getChildNodes, getFirstItem, getLastItem} from '@react-stately/collections';
import {GridCollection, GridNode} from '@react-types/grid';
import {GridEditStateOptions, useGridEditState} from './useGridEditState';
import {GridManager} from './GridManager';
import {Key} from '@react-types/shared';
import {MultipleSelectionState, MultipleSelectionStateProps, useMultipleSelectionState} from '@react-stately/selection';
import {useEffect, useMemo, useRef} from 'react';

export interface GridState<T, C extends GridCollection<T>> {
  collection: C,
  /** A set of keys for rows that are disabled. */
  disabledKeys: Set<Key>,
  /** A manager to read and update row selection and cell editing state. */
  gridManager: GridManager,
  /** 
   * A selection manager to read and update row selection state. 
   * @deprecated Use `gridManager` instead.
   */
  selectionManager: GridManager,
  /** 
   * Whether keyboard navigation is disabled, such as when the arrow keys should be handled by a component within a cell.
   * @deprecated Use `gridManager.keyboardNavigationBehavior === 'tab'` instead.
   */
  isKeyboardNavigationDisabled: boolean,
  /** 
   * Set whether keyboard navigation is disabled, such as when the arrow keys should be handled by a component within a cell. 
   * @deprecated Use `gridManager.enableKeyboardNavigation` and `gridManager.disableKeyboardNavigation` instead.
   */
  setKeyboardNavigationDisabled: (val: boolean) => void
}

export interface GridStateOptions<T, C extends GridCollection<T>> extends MultipleSelectionStateProps, GridEditStateOptions {
  collection: C,
  disabledKeys?: Iterable<Key>,
  focusMode?: 'row' | 'cell',
  /** @private - do not use unless you know what you're doing. */
  UNSAFE_selectionState?: MultipleSelectionState
}

/**
 * Provides state management for a grid component. Handles row selection and focusing a grid cell's focusable child if applicable.
 */
export function useGridState<T extends object, C extends GridCollection<T>>(props: GridStateOptions<T, C>): GridState<T, C> {
  let {collection, focusMode} = props;
  let editState = useGridEditState(props);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  let selectionState = props.UNSAFE_selectionState || useMultipleSelectionState(props);
  let disabledKeys = useMemo(() =>
      props.disabledKeys ? new Set(props.disabledKeys) : new Set<Key>()
    , [props.disabledKeys]);

  let setFocusedKey = selectionState.setFocusedKey;
  selectionState.setFocusedKey = (key, child) => {
    // If focusMode is cell and an item is focused, focus a child cell instead.
    if (focusMode === 'cell' && key != null) {
      let item = collection.getItem(key);
      if (item?.type === 'item') {
        let children = getChildNodes(item, collection);
        if (child === 'last') {
          key = getLastItem(children)?.key;
        } else {
          key = getFirstItem(children)?.key;
        }
      }
    }

    setFocusedKey(key, child);
  };

  let gridManager = useMemo(() =>
    // @ts-expect-error
    new GridManager(collection, selectionState, editState)
    , [collection, selectionState, editState]
  );

  // Reset focused key if that item is deleted from the collection.
  const cachedCollection = useRef(null);
  useEffect(() => {
    if (selectionState.focusedKey != null && !collection.getItem(selectionState.focusedKey)) {
      const node = cachedCollection.current.getItem(selectionState.focusedKey);
      const parentNode =
        node.parentKey != null && (node.type === 'cell' || node.type === 'rowheader' || node.type === 'column') ?
        cachedCollection.current.getItem(node.parentKey) :
        node;
      const cachedRows = cachedCollection.current.rows;
      const rows = collection.rows;
      const diff = cachedRows.length - rows.length;
      let index = Math.min(
        (
          diff > 1 ?
          Math.max(parentNode.index - diff + 1, 0) :
          parentNode.index
        ),
        rows.length - 1);
      let newRow:GridNode<T>;
      while (index >= 0) {
        if (!gridManager.isDisabled(rows[index].key) && rows[index].type !== 'headerrow') {
          newRow = rows[index];
          break;
        }
        // Find next, not disabled row.
        if (index < rows.length - 1) {
          index++;
        // Otherwise, find previous, not disabled row.
        } else {
          if (index > parentNode.index) {
            index = parentNode.index;
          }
          index--;
        }
      }
      if (newRow) {
        const childNodes = newRow.hasChildNodes ? [...getChildNodes(newRow, collection)] : [];
        const keyToFocus =
          newRow.hasChildNodes &&
          parentNode !== node &&
          node.index < childNodes.length ?
          childNodes[node.index].key :
          newRow.key;
        selectionState.setFocusedKey(keyToFocus);
      } else {
        selectionState.setFocusedKey(null);
      }
    }
    cachedCollection.current = collection;
  }, [collection, gridManager, selectionState, selectionState.focusedKey]);

  return {
    collection,
    disabledKeys,
    gridManager,
    selectionManager: gridManager,
    isKeyboardNavigationDisabled: editState.keyboardNavigationBehavior === 'tab',
    setKeyboardNavigationDisabled: () => editState.setKeyboardNavigationBehavior('tab')
  };
}
