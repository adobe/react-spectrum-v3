// @ts-nocheck
/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Direction, Key, KeyboardDelegate, Node} from '@react-types/shared';
import {getChildNodes, getFirstItem} from '@react-stately/collections';
import {GridCollection} from '@react-stately/grid';
import {InvalidationContext, Layout, LayoutInfo, Rect, Size} from '@react-stately/virtualizer';
import {Scale} from '@react-types/provider';

export interface BaseLayoutOptions {
  collator?: Intl.Collator,
  // TODO: is this valid or is scale a spectrum specific thing that should be left out of the layouts?
  scale?: Scale,
  /**
   * The margin around the grid view between the edges and the items.
   * @default 24
   */
  margin?: number
}

interface CardViewLayoutOptions {
  isLoading: boolean,
  direction: Direction
}

export class BaseLayout<T> extends Layout<Node<T>, CardViewLayoutOptions> implements KeyboardDelegate {
  protected contentSize: Size;
  protected layoutInfos: Map<Key, LayoutInfo>;
  protected collator: Intl.Collator;
  protected lastCollection: GridCollection<T>;
  collection:  GridCollection<T>;
  isLoading: boolean;
  disabledKeys: Set<Key> = new Set();
  direction: Direction;
  scale: Scale;
  margin: number;

  constructor(options: BaseLayoutOptions = {}) {
    super();
    this.layoutInfos = new Map();
    this.collator = options.collator;
    this.lastCollection = null;
    this.scale = options.scale || 'medium';
    this.margin = options.margin || 24;
  }

  update(invalidationContext: InvalidationContext<CardViewLayoutOptions>): void {
    this.collection = this.virtualizer.collection as GridCollection<T>;
    this.isLoading = invalidationContext.layoutOptions?.isLoading || false;
    this.direction = invalidationContext.layoutOptions?.direction || 'ltr';
    this.buildCollection(invalidationContext);

    // Remove layout info that doesn't exist in new collection
    if (this.lastCollection) {
      for (let key of this.lastCollection.getKeys()) {
        if (!this.collection.getItem(key)) {
          this.layoutInfos.delete(key);
        }
      }

      if (!this.isLoading) {
        this.layoutInfos.delete('loader');
      }

      if (this.collection.size > 0) {
        this.layoutInfos.delete('placeholder');
      }
    }

    this.lastCollection = this.collection;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  buildCollection(invalidationContext?: InvalidationContext): void {}

  getContentSize(): number {
    return this.contentSize;
  }

  getLayoutInfo(key: Key): LayoutInfo {
    return this.layoutInfos.get(key)!;
  }

  getVisibleLayoutInfos(rect: Rect, excludePersistedKeys = false): LayoutInfo[] {
    let res: LayoutInfo[] = [];

    for (let layoutInfo of this.layoutInfos.values()) {
      if (this.isVisible(layoutInfo, rect, excludePersistedKeys)) {
        res.push(layoutInfo);
      }
    }

    return res;
  }

  isVisible(layoutInfo: LayoutInfo, rect: Rect, excludePersistedKeys: boolean): boolean {
    if (layoutInfo.rect.intersects(rect)) {
      return true;
    }

    if (!excludePersistedKeys) {
      return this.virtualizer.isPersistedKey(layoutInfo.key);
    }

    return false;
  }

  _findClosestLayoutInfo(target: Rect, rect: Rect): LayoutInfo | null {
    let layoutInfos = this.getVisibleLayoutInfos(rect, true);
    let best = null;
    let bestDistance = Infinity;

    // Calculates distance as the distance between the center of 2 rects.
    for (let cur of layoutInfos) {
      if (cur.type === 'item') {
        let curRect = cur.rect;
        let targetMidX = (target.x + target.maxX) / 2;
        let targetMidY = (target.y + target.maxY) / 2;
        let curMidX = (curRect.x + curRect.maxX) / 2;
        let curMidY = (curRect.y + curRect.maxY) / 2;
        let dist = Math.pow(targetMidX - curMidX, 2) + Math.pow(targetMidY - curMidY, 2);
        if (dist < bestDistance) {
          best = cur;
          bestDistance = dist;
        }
      }
    }

    return best;
  }

  _findClosest(target: Rect, rect: Rect): LayoutInfo | null {
    let best = this._findClosestLayoutInfo(target, rect);
    return best || null;
  }

  getKeyBelow(key: Key): Node<T> | undefined {
    // Expected key is the currently focused cell so we need the parent row key
    let parentRowKey = this.collection.getItem(key).parentKey;
    let layoutInfo = this.getLayoutInfo(parentRowKey);
    let rect = new Rect(layoutInfo.rect.x, layoutInfo.rect.maxY + 1, layoutInfo.rect.width, this.virtualizer.visibleRect.height);
    let closestRow = this.collection.getItem(this._findClosest(layoutInfo.rect, rect)?.key);
    return getFirstItem(getChildNodes(closestRow, this.collection))?.key;
  }

  getKeyAbove(key: Key): Node<T> | undefined {
    // Expected key is the currently focused cell so we need the parent row key
    let parentRowKey = this.collection.getItem(key).parentKey;
    let layoutInfo = this.getLayoutInfo(parentRowKey);
    let rect = new Rect(layoutInfo.rect.x, 0, layoutInfo.rect.width, layoutInfo.rect.y - 1);
    let closestRow = this.collection.getItem(this._findClosest(layoutInfo.rect, rect)?.key);
    return getFirstItem(getChildNodes(closestRow, this.collection))?.key;
  }

  getKeyRightOf(key: Key): Node<T> | undefined {
    // Expected key is the currently focused cell so we need the parent row key
    let parentRowKey = this.collection.getItem(key).parentKey;
    key = this.direction === 'rtl' ?  this.collection.getKeyBefore(parentRowKey) : this.collection.getKeyAfter(parentRowKey);

    while (key != null) {
      let item = this.collection.getItem(key);
      // Don't check if item is disabled because we want to be able to focus disabled items in a grid (double check this)
      if (item.type === 'item') {
        return getFirstItem(getChildNodes(item, this.collection))?.key;
      }
      key = this.direction === 'rtl' ?  this.collection.getKeyBefore(key) : this.collection.getKeyAfter(key);
    }
  }

  getKeyLeftOf(key: Key): Node<T> | undefined {
    // Expected key is the currently focused cell so we need the parent row key
    let parentRowKey = this.collection.getItem(key).parentKey;
    key = this.direction === 'rtl' ?  this.collection.getKeyAfter(parentRowKey) : this.collection.getKeyBefore(parentRowKey);
    while (key != null) {
      let item = this.collection.getItem(key);
      // Don't check if item is disabled because we want to be able to focus disabled items in a grid (double check this)
      if (item.type === 'item') {
        return getFirstItem(getChildNodes(item, this.collection))?.key;
      }

      key = this.direction === 'rtl' ?  this.collection.getKeyAfter(key) : this.collection.getKeyBefore(key);
    }
  }

  getFirstKey(): Node<T> | undefined {
    let firstRow = this.collection.getItem(this.collection.getFirstKey());
    return getFirstItem(getChildNodes(firstRow, this.collection))?.key;
  }

  getLastKey(): Node<T> | undefined {
    let lastRow = this.collection.getItem(this.collection.getLastKey());
    return getFirstItem(getChildNodes(lastRow, this.collection))?.key;
  }

  // TODO: pretty unwieldy because it needs to bounce back and forth between the parent key and the child key
  // Perhaps have layoutInfo store childKey as well so we don't need to do this? Or maybe make the layoutInfos be the cells instead of the rows?
  getKeyPageAbove(key: Key): Node<T> | undefined {
    // Expected key is the currently focused cell so we need the parent row key
    let parentRowKey = this.collection.getItem(key).parentKey;
    let layoutInfo = this.getLayoutInfo(parentRowKey);

    if (layoutInfo) {
      let pageY = Math.max(0, layoutInfo.rect.y + layoutInfo.rect.height - this.virtualizer.visibleRect.height);
      // If the node is so large that it spans multiple page heights, return the key of the item immediately above
      // Otherwise keep going up until we exceed a single page height worth of nodes
      let keyAbove = this.collection.getItem(this.getKeyAbove(key))?.parentKey;
      layoutInfo = this.getLayoutInfo(keyAbove);

      if (layoutInfo && layoutInfo.rect.y > pageY) {
        while (layoutInfo && layoutInfo.rect.y > pageY) {
          let childKey = getFirstItem(getChildNodes(this.collection.getItem(layoutInfo.key), this.collection))?.key;
          let keyAbove = this.collection.getItem(this.getKeyAbove(childKey))?.parentKey;
          layoutInfo = this.getLayoutInfo(keyAbove);
        }
      }

      if (layoutInfo) {
        let childKey = getFirstItem(getChildNodes(this.collection.getItem(layoutInfo.key), this.collection))?.key;
        return childKey;
      }
    }

    return this.getFirstKey();
  }

  // TODO: pretty unwieldy because it needs to bounce back and forth between the parent key and the child key
  // Perhaps have layoutInfo store childKey as well so we don't need to do this?
  getKeyPageBelow(key: Key): Node<T> | undefined {
    // Expected key is the currently focused cell so we need the parent row key
    let parentRowKey = this.collection.getItem(key).parentKey;
    let layoutInfo = this.getLayoutInfo(parentRowKey);
    if (layoutInfo) {
      let pageY = Math.min(this.virtualizer.contentSize.height, layoutInfo.rect.y - layoutInfo.rect.height + this.virtualizer.visibleRect.height);
      // If the node is so large that it spans multiple page heights, return the key of the item immediately below
      // Otherwise keep going up until we exceed a single page height worth of nodes
      let keyBelow =  this.collection.getItem(this.getKeyBelow(key))?.parentKey;
      layoutInfo = this.getLayoutInfo(keyBelow);
      if (layoutInfo && layoutInfo.rect.y < pageY) {
        while (layoutInfo && layoutInfo.rect.y < pageY) {
          let childKey = getFirstItem(getChildNodes(this.collection.getItem(layoutInfo.key), this.collection))?.key;
          let keyBelow = this.collection.getItem(this.getKeyBelow(childKey))?.parentKey;
          layoutInfo = this.getLayoutInfo(keyBelow);
        }
      }

      if (layoutInfo) {
        let childKey = getFirstItem(getChildNodes(this.collection.getItem(layoutInfo.key), this.collection))?.key;
        return childKey;
      }
    }

    return this.getLastKey();
  }

  getKeyForSearch(search: string, fromKey?: Key): Node<T> | undefined | null {
    if (!this.collator) {
      return null;
    }

    let collection = this.collection;
    let key = fromKey ?? this.getFirstKey();

    let startItem = collection.getItem(key);
    key = startItem.parentKey;

    while (key != null) {
      let item = collection.getItem(key);
      if (item.textValue) {
        let substring = item.textValue.slice(0, search.length);
        if (this.collator.compare(substring, search) === 0) {
          return getFirstItem(getChildNodes(item, this.collection))?.key;
        }
      }

      key = this.collection.getKeyAfter(key);
    }

    return null;
  }
}
