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
  Collection,
  FocusStrategy,
  Selection as ISelection,
  Node,
  PressEvent,
  SelectionBehavior,
  SelectionMode
} from '@react-types/shared';
import {Key} from 'react';
import {MultipleSelectionManager, MultipleSelectionState} from './types';
import {Selection} from './Selection';

interface SelectionManagerOptions {
  allowsCellSelection?: boolean,
  selectionBehavior?: SelectionBehavior
}

/**
 * An interface for reading and updating multiple selection state.
 */
export class SelectionManager implements MultipleSelectionManager {
  private collection: Collection<Node<unknown>>;
  private state: MultipleSelectionState;
  private allowsCellSelection: boolean;
  private _isSelectAll: boolean;
  private selectionBehavior: SelectionBehavior;

  constructor(collection: Collection<Node<unknown>>, state: MultipleSelectionState, options?: SelectionManagerOptions) {
    this.collection = collection;
    this.state = state;
    this.allowsCellSelection = options?.allowsCellSelection ?? false;
    this.selectionBehavior = options?.selectionBehavior || 'toggle';
    this._isSelectAll = null;
  }

  /**
   * The type of selection that is allowed in the collection.
   */
  get selectionMode(): SelectionMode {
    return this.state.selectionMode;
  }

  /**
   * Whether the collection allows empty selection.
   */
  get disallowEmptySelection(): boolean {
    return this.state.disallowEmptySelection;
  }

  /**
   * Whether the collection is currently focused.
   */
  get isFocused(): boolean {
    return this.state.isFocused;
  }

  /**
   * Sets whether the collection is focused.
   */
  setFocused(isFocused: boolean) {
    this.state.setFocused(isFocused);
  }

  /**
   * The current focused key in the collection.
   */
  get focusedKey(): Key {
    return this.state.focusedKey;
  }

  /** Whether the first or last child of the focused key should receive focus. */
  get childFocusStrategy(): FocusStrategy {
    return this.state.childFocusStrategy;
  }

  /**
   * Sets the focused key.
   */
  setFocusedKey(key: Key, childFocusStrategy?: FocusStrategy) {
    this.state.setFocusedKey(key, childFocusStrategy);
  }

  /**
   * The currently selected keys in the collection.
   */
  get selectedKeys(): Set<Key> {
    return this.state.selectedKeys === 'all'
      ? new Set(this.getSelectAllKeys())
      : this.state.selectedKeys;
  }

  /**
   * The raw selection value for the collection.
   * Either 'all' for select all, or a set of keys.
   */
  get rawSelection(): ISelection {
    return this.state.selectedKeys;
  }

  /**
   * Returns whether a key is selected.
   */
  isSelected(key: Key) {
    if (this.state.selectionMode === 'none') {
      return false;
    }

    key = this.getKey(key);
    return this.state.selectedKeys === 'all'
      ? !this.state.disabledKeys.has(key)
      : this.state.selectedKeys.has(key);
  }

  /**
   * Whether the selection is empty.
   */
  get isEmpty(): boolean {
    return this.state.selectedKeys !== 'all' && this.state.selectedKeys.size === 0;
  }

  /**
   * Whether all items in the collection are selected.
   */
  get isSelectAll(): boolean {
    if (this.isEmpty) {
      return false;
    }

    if (this.state.selectedKeys === 'all') {
      return true;
    }

    if (this._isSelectAll != null) {
      return this._isSelectAll;
    }

    let allKeys = this.getSelectAllKeys();
    let selectedKeys = this.state.selectedKeys;
    this._isSelectAll = allKeys.every(k => selectedKeys.has(k));
    return this._isSelectAll;
  }

  get firstSelectedKey(): Key | null {
    let first: Node<unknown> | null = null;
    for (let key of this.state.selectedKeys) {
      let item = this.collection.getItem(key);
      if (!first || item?.index < first.index) {
        first = item;
      }
    }

    return first?.key;
  }

  get lastSelectedKey(): Key | null {
    let last: Node<unknown> | null = null;
    for (let key of this.state.selectedKeys) {
      let item = this.collection.getItem(key);
      if (!last || item?.index > last.index) {
        last = item;
      }
    }

    return last?.key;
  }

  /**
   * Extends the selection to the given key.
   */
  extendSelection(toKey: Key) {
    toKey = this.getKey(toKey);

    let selection: Selection;

    // Only select the one key if coming from a select all.
    if (this.state.selectedKeys === 'all') {
      selection = new Selection([toKey], toKey, toKey);
    } else {
      let selectedKeys = this.state.selectedKeys as Selection;
      let anchorKey = selectedKeys.anchorKey || toKey;
      selection = new Selection(selectedKeys, anchorKey, toKey);
      for (let key of this.getKeyRange(anchorKey, selectedKeys.currentKey || toKey)) {
        selection.delete(key);
      }

      for (let key of this.getKeyRange(toKey, anchorKey)) {
        if (!this.state.disabledKeys.has(key)) {
          selection.add(key);
        }
      }
    }

    this.state.setSelectedKeys(selection);
  }

  private getKeyRange(from: Key, to: Key) {
    let fromItem = this.collection.getItem(from);
    let toItem = this.collection.getItem(to);
    if (fromItem && toItem) {
      if (fromItem.index <= toItem.index) {
        return this.getKeyRangeInternal(from, to);
      }

      return this.getKeyRangeInternal(to, from);
    }

    return [];
  }

  private getKeyRangeInternal(from: Key, to: Key) {
    let keys: Key[] = [];
    let key = from;
    while (key) {
      let item = this.collection.getItem(key);
      if (item && item.type === 'item' || (item.type === 'cell' && this.allowsCellSelection)) {
        keys.push(key);
      }

      if (key === to) {
        return keys;
      }

      key = this.collection.getKeyAfter(key);
    }

    return [];
  }

  private getKey(key: Key) {
    let item = this.collection.getItem(key);
    if (!item) {
      // ¯\_(ツ)_/¯
      return key;
    }

    // If cell selection is allowed, just return the key.
    if (item.type === 'cell' && this.allowsCellSelection) {
      return key;
    }

    // Find a parent item to select
    while (item.type !== 'item' && item.parentKey) {
      item = this.collection.getItem(item.parentKey);
    }

    if (!item || item.type !== 'item') {
      return null;
    }

    return item.key;
  }

  /**
   * Toggles whether the given key is selected.
   */
  toggleSelection(key: Key) {
    key = this.getKey(key);
    if (key == null) {
      return;
    }

    let keys = new Selection(this.state.selectedKeys === 'all' ? this.getSelectAllKeys() : this.state.selectedKeys);
    if (keys.has(key)) {
      keys.delete(key);
      // TODO: move anchor to last selected key...
      // Does `current` need to move here too?
    } else {
      keys.add(key);
      keys.anchorKey = key;
      keys.currentKey = key;
    }

    if (this.disallowEmptySelection && keys.size === 0) {
      return;
    }

    this.state.setSelectedKeys(keys);
  }

  /**
   * Replaces the selection with only the given key.
   */
  replaceSelection(key: Key) {
    key = this.getKey(key);
    if (key == null) {
      return;
    }

    this.state.setSelectedKeys(new Selection([key], key, key));
  }

  /**
   * Replaces the selection with the given keys.
   */
  setSelectedKeys(keys: Iterable<Key>) {
    if (this.selectionMode === 'none') {
      return;
    }

    let selection = new Selection();
    for (let key of keys) {
      key = this.getKey(key);
      if (key != null) {
        selection.add(key);
        if (this.selectionMode === 'single') {
          break;
        }
      }
    }

    this.state.setSelectedKeys(selection);
  }

  private getSelectAllKeys() {
    let keys: Key[] = [];
    let addKeys = (key: Key) => {
      while (key) {
        if (!this.state.disabledKeys.has(key)) {
          let item = this.collection.getItem(key);
          if (item.type === 'item') {
            keys.push(key);
          }

          // Add child keys. If cell selection is allowed, then include item children too.
          if (item.hasChildNodes && (this.allowsCellSelection || item.type !== 'item')) {
            addKeys([...item.childNodes][0].key);
          }
        }

        key = this.collection.getKeyAfter(key);
      }
    };

    addKeys(this.collection.getFirstKey());
    return keys;
  }

  /**
   * Selects all items in the collection.
   */
  selectAll() {
    if (this.selectionMode === 'multiple') {
      this.state.setSelectedKeys('all');
    }
  }

  /**
   * Removes all keys from the selection.
   */
  clearSelection() {
    if (!this.disallowEmptySelection && (this.state.selectedKeys === 'all' || this.state.selectedKeys.size > 0)) {
      this.state.setSelectedKeys(new Selection());
    }
  }

  /**
   * Toggles between select all and an empty selection.
   */
  toggleSelectAll() {
    if (this.isSelectAll) {
      this.clearSelection();
    } else {
      this.selectAll();
    }
  }

  select(key: Key, e?: PressEvent | PointerEvent) {
    if (this.selectionMode === 'none') {
      return;
    }

    if (this.selectionMode === 'single') {
      if (this.isSelected(key) && !this.disallowEmptySelection) {
        this.toggleSelection(key);
      } else {
        this.replaceSelection(key);
      }
    } else if (e && e.shiftKey) {
      this.extendSelection(key);
    } else if (this.selectionBehavior === 'toggle' || (e && (e.metaKey || e.pointerType === 'touch' || e.pointerType === 'virtual'))) {
      // if touch or virtual (VO) then we just want to toggle, otherwise it's impossible to multi select because they don't have modifier keys
      this.toggleSelection(key);
    } else {
      this.replaceSelection(key);
    }
  }

  /**
   * Returns whether the current selection is equal to the given selection.
   */
  isSelectionEqual(selection: Set<Key>) {
    if (selection === this.state.selectedKeys) {
      return true;
    }

    // Check if the set of keys match.
    let selectedKeys = this.selectedKeys;
    if (selection.size !== selectedKeys.size) {
      return false;
    }

    for (let key of selection) {
      if (!selectedKeys.has(key)) {
        return false;
      }
    }

    for (let key of selectedKeys) {
      if (!selection.has(key)) {
        return false;
      }
    }

    return true;
  }
}
