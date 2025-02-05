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

import {Direction, DisabledBehavior, Key, KeyboardDelegate, LayoutDelegate, Node, Rect, RefObject, Size} from '@react-types/shared';
import {DOMLayoutDelegate} from '@react-aria/selection';
import {getChildNodes, getFirstItem, getLastItem, getNthItem} from '@react-stately/collections';
import {GridCollection, GridNode} from '@react-types/grid';

export interface GridKeyboardDelegateOptions<C> {
  collection: C,
  disabledKeys: Set<Key>,
  disabledBehavior?: DisabledBehavior,
  ref?: RefObject<HTMLElement | null>,
  direction: Direction,
  collator?: Intl.Collator,
  layoutDelegate?: LayoutDelegate,
  /** @deprecated - Use layoutDelegate instead. */
  layout?: DeprecatedLayout,
  focusMode?: 'row' | 'cell'
}

export class GridKeyboardDelegate<T, C extends GridCollection<T>> implements KeyboardDelegate {
  collection: C;
  protected disabledKeys: Set<Key>;
  protected disabledBehavior: DisabledBehavior;
  protected direction: Direction;
  protected collator: Intl.Collator | undefined;
  protected layoutDelegate: LayoutDelegate;
  protected focusMode;

  constructor(options: GridKeyboardDelegateOptions<C>) {
    this.collection = options.collection;
    this.disabledKeys = options.disabledKeys;
    this.disabledBehavior = options.disabledBehavior || 'all';
    this.direction = options.direction;
    this.collator = options.collator;
    if (!options.layout && !options.ref) {
      throw new Error('Either a layout or a ref must be specified.');
    }
    this.layoutDelegate = options.layoutDelegate || (options.layout ? new DeprecatedLayoutDelegate(options.layout) : new DOMLayoutDelegate(options.ref!));
    this.focusMode = options.focusMode || 'row';
  }

  protected isCell(node: Node<T>) {
    return node.type === 'cell';
  }

  protected isRow(node: Node<T>) {
    return node.type === 'row' || node.type === 'item';
  }

  private isDisabled(item: Node<unknown>) {
    return this.disabledBehavior === 'all' && (item.props?.isDisabled || this.disabledKeys.has(item.key));
  }

  protected findPreviousKey(fromKey?: Key, pred?: (item: Node<T>) => boolean) {
    let key = fromKey != null
      ? this.collection.getKeyBefore(fromKey)
      : this.collection.getLastKey();

    while (key != null) {
      let item = this.collection.getItem(key);
      if (!item) {
        return null;
      }
      if (!this.isDisabled(item) && (!pred || pred(item))) {
        return key;
      }

      key = this.collection.getKeyBefore(key);
    }
    return null;
  }

  protected findNextKey(fromKey?: Key, pred?: (item: Node<T>) => boolean) {
    let key = fromKey != null
      ? this.collection.getKeyAfter(fromKey)
      : this.collection.getFirstKey();

    while (key != null) {
      let item = this.collection.getItem(key);
      if (!item) {
        return null;
      }
      if (!this.isDisabled(item) && (!pred || pred(item))) {
        return key;
      }

      key = this.collection.getKeyAfter(key);
      if (key == null) {
        return null;
      }
    }
    return null;
  }

  protected getKeyForItemInRowByIndex(key: Key, index: number = 0): Key | null {
    if (index < 0) {
      return null;
    }

    let item = this.collection.getItem(key);
    if (!item) {
      return null;
    }

    let i = 0;
    for (let child of getChildNodes(item, this.collection) as Iterable<GridNode<T>>) {
      if (child.colspan && child.colspan + i > index) {
        return child.key ?? null;
      }

      if (child.colspan) {
        i = i + child.colspan - 1;
      }

      if (i === index) {
        return child.key ?? null;
      }

      i++;
    }
    return null;
  }

  getKeyBelow(fromKey: Key) {
    let key: Key | null = fromKey;
    let startItem = this.collection.getItem(key);
    if (!startItem) {
      return null;
    }

    // If focus was on a cell, start searching from the parent row
    if (this.isCell(startItem)) {
      key = startItem.parentKey ?? null;
    }
    if (key == null) {
      return null;
    }

    // Find the next item
    key = this.findNextKey(key, (item => item.type === 'item'));
    if (key != null) {
      // If focus was on a cell, focus the cell with the same index in the next row.
      if (this.isCell(startItem)) {
        let startIndex = startItem.colIndex ? startItem.colIndex : startItem.index;
        return this.getKeyForItemInRowByIndex(key, startIndex);
      }

      // Otherwise, focus the next row
      if (this.focusMode === 'row') {
        return key;
      }
    }
    return null;
  }

  getKeyAbove(fromKey: Key) {
    let key: Key | null = fromKey;
    let startItem = this.collection.getItem(key);
    if (!startItem) {
      return null;
    }

    // If focus is on a cell, start searching from the parent row
    if (this.isCell(startItem)) {
      key = startItem.parentKey ?? null;
    }
    if (key == null) {
      return null;
    }

    // Find the previous item
    key = this.findPreviousKey(key, item => item.type === 'item');
    if (key != null) {
      // If focus was on a cell, focus the cell with the same index in the previous row.
      if (this.isCell(startItem)) {
        let startIndex = startItem.colIndex ? startItem.colIndex : startItem.index;
        return this.getKeyForItemInRowByIndex(key, startIndex);
      }

      // Otherwise, focus the previous row
      if (this.focusMode === 'row') {
        return key;
      }
    }
    return null;
  }

  getKeyRightOf(key: Key) {
    let item = this.collection.getItem(key);
    if (!item) {
      return null;
    }

    // If focus is on a row, focus the first child cell.
    if (this.isRow(item)) {
      let children = getChildNodes(item, this.collection);
      return (this.direction === 'rtl'
        ? getLastItem(children)?.key
        : getFirstItem(children)?.key) ?? null;
    }

    // If focus is on a cell, focus the next cell if any,
    // otherwise focus the parent row.
    if (this.isCell(item) && item.parentKey != null) {
      let parent = this.collection.getItem(item.parentKey);
      if (!parent) {
        return null;
      }
      let children = getChildNodes(parent, this.collection);
      let next = (this.direction === 'rtl'
        ? getNthItem(children, item.index - 1)
        : getNthItem(children, item.index + 1)) ?? null;

      if (next) {
        return next.key ?? null;
      }

      // focus row only if focusMode is set to row
      if (this.focusMode === 'row') {
        return item.parentKey ?? null;
      }

      return (this.direction === 'rtl' ? this.getFirstKey(key) : this.getLastKey(key)) ?? null;
    }
    return null;
  }

  getKeyLeftOf(key: Key) {
    let item = this.collection.getItem(key);
    if (!item) {
      return null;
    }

    // If focus is on a row, focus the last child cell.
    if (this.isRow(item)) {
      let children = getChildNodes(item, this.collection);
      return (this.direction === 'rtl'
        ? getFirstItem(children)?.key
        : getLastItem(children)?.key) ?? null;
    }

    // If focus is on a cell, focus the previous cell if any,
    // otherwise focus the parent row.
    if (this.isCell(item) && item.parentKey != null) {
      let parent = this.collection.getItem(item.parentKey);
      if (!parent) {
        return null;
      }
      let children = getChildNodes(parent, this.collection);
      let prev = (this.direction === 'rtl'
        ? getNthItem(children, item.index + 1)
        : getNthItem(children, item.index - 1)) ?? null;

      if (prev) {
        return prev.key ?? null;
      }

      // focus row only if focusMode is set to row
      if (this.focusMode === 'row') {
        return item.parentKey ?? null;
      }

      return (this.direction === 'rtl' ? this.getLastKey(key) : this.getFirstKey(key)) ?? null;
    }
    return null;
  }

  getFirstKey(fromKey?: Key, global?: boolean) {
    let key: Key | null = fromKey ?? null;
    let item: Node<T> | undefined | null;
    if (key != null) {
      item = this.collection.getItem(key);
      if (!item) {
        return null;
      }

      // If global flag is not set, and a cell is currently focused,
      // move focus to the first cell in the parent row.
      if (this.isCell(item) && !global && item.parentKey != null) {
        let parent = this.collection.getItem(item.parentKey);
        if (!parent) {
          return null;
        }
        return getFirstItem(getChildNodes(parent, this.collection))?.key ?? null;
      }
    }

    // Find the first row
    key = this.findNextKey(undefined, item => item.type === 'item');

    // If global flag is set (or if focus mode is cell), focus the first cell in the first row.
    if (key != null && ((item && this.isCell(item) && global) || this.focusMode === 'cell')) {
      let item = this.collection.getItem(key);
      if (!item) {
        return null;
      }
      key = getFirstItem(getChildNodes(item, this.collection))?.key ?? null;
    }

    // Otherwise, focus the row itself.
    return key;
  }

  getLastKey(fromKey?: Key, global?: boolean) {
    let key: Key | null = fromKey ?? null;
    let item: Node<T> | undefined | null;
    if (key != null) {
      item = this.collection.getItem(key);
      if (!item) {
        return null;
      }

      // If global flag is not set, and a cell is currently focused,
      // move focus to the last cell in the parent row.
      if (this.isCell(item) && !global && item.parentKey != null) {
        let parent = this.collection.getItem(item.parentKey);
        if (!parent) {
          return null;
        }
        let children = getChildNodes(parent, this.collection);
        return getLastItem(children)?.key ?? null;
      }
    }

    // Find the last row
    key = this.findPreviousKey(undefined, item => item.type === 'item');

    // If global flag is set (or if focus mode is cell), focus the last cell in the last row.
    if (key != null && ((item && this.isCell(item) && global) || this.focusMode === 'cell')) {
      let item = this.collection.getItem(key);
      if (!item) {
        return null;
      }
      let children = getChildNodes(item, this.collection);
      key = getLastItem(children)?.key ?? null;
    }

    // Otherwise, focus the row itself.
    return key;
  }

  getKeyPageAbove(fromKey: Key) {
    let key: Key | null = fromKey;
    let itemRect = this.layoutDelegate.getItemRect(key);
    if (!itemRect) {
      return null;
    }

    let pageY = Math.max(0, itemRect.y + itemRect.height - this.layoutDelegate.getVisibleRect().height);

    while (itemRect && itemRect.y > pageY && key != null) {
      key = this.getKeyAbove(key) ?? null;
      if (key == null) {
        break;
      }
      itemRect = this.layoutDelegate.getItemRect(key);
    }

    return key;
  }

  getKeyPageBelow(fromKey: Key) {
    let key: Key | null = fromKey;
    let itemRect = this.layoutDelegate.getItemRect(key);

    if (!itemRect) {
      return null;
    }

    let pageHeight = this.layoutDelegate.getVisibleRect().height;
    let pageY = Math.min(this.layoutDelegate.getContentSize().height, itemRect.y + pageHeight);

    while (itemRect && (itemRect.y + itemRect.height) < pageY) {
      let nextKey = this.getKeyBelow(key);
      // If nextKey is undefined, we've reached the last row already
      if (nextKey == null) {
        break;
      }

      itemRect = this.layoutDelegate.getItemRect(nextKey);
      key = nextKey;
    }

    return key;
  }

  getKeyForSearch(search: string, fromKey?: Key) {
    let key: Key | null = fromKey ?? null;
    if (!this.collator) {
      return null;
    }

    let collection = this.collection;
    key = fromKey ?? this.getFirstKey();
    if (key == null) {
      return null;
    }

    // If the starting key is a cell, search from its parent row.
    let startItem = collection.getItem(key);
    if (!startItem) {
      return null;
    }
    if (startItem.type === 'cell') {
      key = startItem.parentKey ?? null;
    }

    let hasWrapped = false;
    while (key != null) {
      let item = collection.getItem(key);
      if (!item) {
        return null;
      }

      // check row text value for match
      if (item.textValue) {
        let substring = item.textValue.slice(0, search.length);
        if (this.collator.compare(substring, search) === 0) {
          if (this.isRow(item) && this.focusMode === 'cell') {
            return getFirstItem(getChildNodes(item, this.collection))?.key ?? null;
          }

          return item.key;
        }
      }

      key = this.findNextKey(key, item => item.type === 'item');

      // Wrap around when reaching the end of the collection
      if (key == null && !hasWrapped) {
        key = this.getFirstKey();
        hasWrapped = true;
      }
    }

    return null;
  }
}

/* Backward compatibility for old Virtualizer Layout interface. */
interface DeprecatedLayout {
  getLayoutInfo(key: Key): DeprecatedLayoutInfo,
  getContentSize(): Size,
  virtualizer: DeprecatedVirtualizer
}

interface DeprecatedLayoutInfo {
  rect: Rect
}

interface DeprecatedVirtualizer {
  visibleRect: Rect
}

class DeprecatedLayoutDelegate implements LayoutDelegate {
  layout: DeprecatedLayout;

  constructor(layout: DeprecatedLayout) {
    this.layout = layout;
  }

  getContentSize(): Size {
    return this.layout.getContentSize();
  }

  getItemRect(key: Key): Rect | null {
    return this.layout.getLayoutInfo(key)?.rect || null;
  }

  getVisibleRect(): Rect {
    return this.layout.virtualizer.visibleRect;
  }
}
