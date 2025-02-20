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
  Collection, DisabledBehavior,
  FocusStrategy,
  Selection as ISelection,
  Key,
  LayoutDelegate,
  LongPressEvent,
  Node,
  PressEvent,
  SelectionBehavior,
  SelectionMode
} from '@react-types/shared';
import {compareNodeOrder, getChildNodes, getFirstItem} from '@react-stately/collections';
import {MultipleSelectionManager, MultipleSelectionState} from './types';
import {Selection} from './Selection';

interface SelectionManagerOptions {
  allowsCellSelection?: boolean,
  layoutDelegate?: LayoutDelegate
}

/**
 * An interface for reading and updating multiple selection state.
 */
export class SelectionManager implements MultipleSelectionManager {
  collection: Collection<Node<unknown>>;
  private state: MultipleSelectionState;
  private allowsCellSelection: boolean;
  private _isSelectAll: boolean | null;
  private layoutDelegate: LayoutDelegate | null;

  constructor(collection: Collection<Node<unknown>>, state: MultipleSelectionState, options?: SelectionManagerOptions) {
    this.collection = collection;
    this.state = state;
    this.allowsCellSelection = options?.allowsCellSelection ?? false;
    this._isSelectAll = null;
    this.layoutDelegate = options?.layoutDelegate || null;
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
   * The selection behavior for the collection.
   */
  get selectionBehavior(): SelectionBehavior {
    return this.state.selectionBehavior;
  }

  /**
   * Sets the selection behavior for the collection.
   */
  setSelectionBehavior(selectionBehavior: SelectionBehavior): void {
    this.state.setSelectionBehavior(selectionBehavior);
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
  setFocused(isFocused: boolean): void {
    this.state.setFocused(isFocused);
  }

  /**
   * The current focused key in the collection.
   */
  get focusedKey(): Key | null {
    return this.state.focusedKey;
  }

  /** Whether the first or last child of the focused key should receive focus. */
  get childFocusStrategy(): FocusStrategy | null {
    return this.state.childFocusStrategy;
  }

  /**
   * Sets the focused key.
   */
  setFocusedKey(key: Key | null, childFocusStrategy?: FocusStrategy): void {
    if (key == null || this.collection.getItem(key)) {
      this.state.setFocusedKey(key, childFocusStrategy);
    }
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
  isSelected(key: Key): boolean {
    if (this.state.selectionMode === 'none') {
      return false;
    }

    let mappedKey = this.getKey(key);
    if (mappedKey == null) {
      return false;
    }
    return this.state.selectedKeys === 'all'
      ? this.canSelectItem(mappedKey)
      : this.state.selectedKeys.has(mappedKey);
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
      if (!first || (item && compareNodeOrder(this.collection, item, first) < 0)) {
        first = item;
      }
    }

    return first?.key ?? null;
  }

  get lastSelectedKey(): Key | null {
    let last: Node<unknown> | null = null;
    for (let key of this.state.selectedKeys) {
      let item = this.collection.getItem(key);
      if (!last || (item && compareNodeOrder(this.collection, item, last) > 0)) {
        last = item;
      }
    }

    return last?.key ?? null;
  }

  get disabledKeys(): Set<Key> {
    return this.state.disabledKeys;
  }

  get disabledBehavior(): DisabledBehavior {
    return this.state.disabledBehavior;
  }

  /**
   * Extends the selection to the given key.
   */
  extendSelection(toKey: Key): void {
    if (this.selectionMode === 'none') {
      return;
    }

    if (this.selectionMode === 'single') {
      this.replaceSelection(toKey);
      return;
    }

    let mappedToKey = this.getKey(toKey);
    if (mappedToKey == null) {
      return;
    }

    let selection: Selection;

    // Only select the one key if coming from a select all.
    if (this.state.selectedKeys === 'all') {
      selection = new Selection([mappedToKey], mappedToKey, mappedToKey);
    } else {
      let selectedKeys = this.state.selectedKeys as Selection;
      let anchorKey = selectedKeys.anchorKey ?? mappedToKey;
      selection = new Selection(selectedKeys, anchorKey, mappedToKey);
      for (let key of this.getKeyRange(anchorKey, selectedKeys.currentKey ?? mappedToKey)) {
        selection.delete(key);
      }

      for (let key of this.getKeyRange(mappedToKey, anchorKey)) {
        if (this.canSelectItem(key)) {
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
      if (compareNodeOrder(this.collection, fromItem, toItem) <= 0) {
        return this.getKeyRangeInternal(from, to);
      }

      return this.getKeyRangeInternal(to, from);
    }

    return [];
  }

  private getKeyRangeInternal(from: Key, to: Key) {
    if (this.layoutDelegate?.getKeyRange) {
      return this.layoutDelegate.getKeyRange(from, to);
    }

    let keys: Key[] = [];
    let key: Key | null = from;
    while (key != null) {
      let item = this.collection.getItem(key);
      if (item && (item.type === 'item' || (item.type === 'cell' && this.allowsCellSelection))) {
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
    while (item && item.type !== 'item' && item.parentKey != null) {
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
  toggleSelection(key: Key): void {
    if (this.selectionMode === 'none') {
      return;
    }

    if (this.selectionMode === 'single' && !this.isSelected(key)) {
      this.replaceSelection(key);
      return;
    }

    let mappedKey = this.getKey(key);
    if (mappedKey == null) {
      return;
    }

    let keys = new Selection(this.state.selectedKeys === 'all' ? this.getSelectAllKeys() : this.state.selectedKeys);
    if (keys.has(mappedKey)) {
      keys.delete(mappedKey);
      // TODO: move anchor to last selected key...
      // Does `current` need to move here too?
    } else if (this.canSelectItem(mappedKey)) {
      keys.add(mappedKey);
      keys.anchorKey = mappedKey;
      keys.currentKey = mappedKey;
    }

    if (this.disallowEmptySelection && keys.size === 0) {
      return;
    }

    this.state.setSelectedKeys(keys);
  }

  /**
   * Replaces the selection with only the given key.
   */
  replaceSelection(key: Key): void {
    if (this.selectionMode === 'none') {
      return;
    }

    let mappedKey = this.getKey(key);
    if (mappedKey == null) {
      return;
    }

    let selection = this.canSelectItem(mappedKey)
      ? new Selection([mappedKey], mappedKey, mappedKey)
      : new Selection();

    this.state.setSelectedKeys(selection);
  }

  /**
   * Replaces the selection with the given keys.
   */
  setSelectedKeys(keys: Iterable<Key>): void {
    if (this.selectionMode === 'none') {
      return;
    }

    let selection = new Selection();
    for (let key of keys) {
      let mappedKey = this.getKey(key);
      if (mappedKey != null) {
        selection.add(mappedKey);
        if (this.selectionMode === 'single') {
          break;
        }
      }
    }

    this.state.setSelectedKeys(selection);
  }

  private getSelectAllKeys() {
    let keys: Key[] = [];
    let addKeys = (key: Key | null) => {
      while (key != null) {
        if (this.canSelectItem(key)) {
          let item = this.collection.getItem(key);
          if (item?.type === 'item') {
            keys.push(key);
          }

          // Add child keys. If cell selection is allowed, then include item children too.
          if (item?.hasChildNodes && (this.allowsCellSelection || item.type !== 'item')) {
            addKeys(getFirstItem(getChildNodes(item, this.collection))?.key ?? null);
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
  selectAll(): void {
    if (!this.isSelectAll && this.selectionMode === 'multiple') {
      this.state.setSelectedKeys('all');
    }
  }

  /**
   * Removes all keys from the selection.
   */
  clearSelection(): void {
    if (!this.disallowEmptySelection && (this.state.selectedKeys === 'all' || this.state.selectedKeys.size > 0)) {
      this.state.setSelectedKeys(new Selection());
    }
  }

  /**
   * Toggles between select all and an empty selection.
   */
  toggleSelectAll(): void {
    if (this.isSelectAll) {
      this.clearSelection();
    } else {
      this.selectAll();
    }
  }

  select(key: Key, e?: PressEvent | LongPressEvent | PointerEvent): void {
    if (this.selectionMode === 'none') {
      return;
    }

    if (this.selectionMode === 'single') {
      if (this.isSelected(key) && !this.disallowEmptySelection) {
        this.toggleSelection(key);
      } else {
        this.replaceSelection(key);
      }
    } else if (this.selectionBehavior === 'toggle' || (e && (e.pointerType === 'touch' || e.pointerType === 'virtual'))) {
      // if touch or virtual (VO) then we just want to toggle, otherwise it's impossible to multi select because they don't have modifier keys
      this.toggleSelection(key);
    } else {
      this.replaceSelection(key);
    }
  }

  /**
   * Returns whether the current selection is equal to the given selection.
   */
  isSelectionEqual(selection: Set<Key>): boolean {
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

  canSelectItem(key: Key): boolean {
    if (this.state.selectionMode === 'none' || this.state.disabledKeys.has(key)) {
      return false;
    }

    let item = this.collection.getItem(key);
    if (!item || item?.props?.isDisabled || (item.type === 'cell' && !this.allowsCellSelection)) {
      return false;
    }

    return true;
  }

  isDisabled(key: Key): boolean {
    return this.state.disabledBehavior === 'all' && (this.state.disabledKeys.has(key) || !!this.collection.getItem(key)?.props?.isDisabled);
  }

  isLink(key: Key): boolean {
    return !!this.collection.getItem(key)?.props?.href;
  }

  getItemProps(key: Key): any {
    return this.collection.getItem(key)?.props;
  }
}
