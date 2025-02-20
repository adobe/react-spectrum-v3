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

import {BaseLayout, BaseLayoutOptions} from './BaseLayout';
import {getChildNodes, getFirstItem} from '@react-stately/collections';
import {InvalidationContext, LayoutInfo, Rect, Size} from '@react-stately/virtualizer';
import {Key, KeyboardDelegate} from '@react-types/shared';

export interface WaterfallLayoutOptions extends BaseLayoutOptions {
  /**
   * The minimum item size.
   * @default 240 x 136
   */
  minItemSize?: Size,
  /**
   * The maximum item size.
   * @default Infinity
   */
  maxItemSize?: Size,
  /**
   * The minimum space required between items.
   * @default 18 x 18
   */
  minSpace?: Size,
  /**
   * The maximum number of columns.
   * @default Infinity
   */
  maxColumns?: number
}

// TODO: this didn't have any options that varied with card size, should it have?
export class WaterfallLayout<T> extends BaseLayout<T> implements KeyboardDelegate {
  protected minItemSize: Size;
  protected maxItemSize: Size;
  protected minSpace: Size;
  protected maxColumns: number;
  protected numColumns: number;
  protected itemWidth: number;
  protected horizontalSpacing: number;

  constructor(options: WaterfallLayoutOptions = {}) {
    // TODO: WaterfallLayout doesn't use card size in v2, but perhaps it should support it? Perhaps it would modify
    // minItemSize defaults or other things
    super(options);
    this.minItemSize = options.minItemSize || new Size(240, 136);
    this.maxItemSize = options.maxItemSize || new Size(Infinity, Infinity);
    this.margin = options.margin != null ? options.margin : 24;
    this.minSpace = options.minSpace || new Size(18, 18);
    this.maxColumns = options.maxColumns || Infinity;

    this.itemWidth = 0;
    this.numColumns = 0;

    this.lastCollection = null;
    this.collator = options.collator;
  }

  get layoutType(): string {
    return 'waterfall';
  }

  buildCollection(invalidationContext: InvalidationContext): void {
    // Compute the number of columns needed to display the content
    let visibleWidth = this.virtualizer.visibleRect.width;
    let availableWidth = visibleWidth - this.margin * 2;
    let columns = Math.floor((availableWidth + this.minSpace.width) / (this.minItemSize.width + this.minSpace.width));
    this.numColumns = Math.max(1, Math.min(this.maxColumns, columns));


    // Compute the available width (minus the space between items)
    let width = availableWidth - (this.minSpace.width * (this.numColumns - 1));

    // Compute the item width based on the space available
    let itemWidth = Math.round(width / this.numColumns);
    itemWidth = Math.max(this.minItemSize.width, Math.min(this.maxItemSize.width, itemWidth));
    this.itemWidth = itemWidth;

    // Compute the horizontal spacing
    // if only one column, we cannot divide by zero, so set it to 1
    let horizontalSpacing = Math.round((availableWidth - this.numColumns * itemWidth) / Math.max(1, this.numColumns - 1));
    this.horizontalSpacing = horizontalSpacing;

    // Setup an array of column heights
    let columnHeights = Array(this.numColumns).fill(this.margin);
    for (let node of this.collection) {
      let key = node.key;
      // Compute the height of the item. Use the existing height if available,
      // otherwise call the delegate to estimate the size.
      let oldLayoutInfo = this.layoutInfos.get(key);
      let height;
      let estimatedSize = true;
      if (oldLayoutInfo) {
        height = oldLayoutInfo.rect.height;
        estimatedSize = invalidationContext.sizeChanged || oldLayoutInfo.estimatedSize;
      } else if (node.props.width && node.props.height) {
        let nodeWidth = node.props.width;
        let nodeHeight = node.props.height;
        let scaledHeight = Math.round(nodeHeight * ((itemWidth) / nodeWidth));
        height = Math.max(this.minItemSize.height, Math.min(this.maxItemSize.height, scaledHeight));
      } else {
        height = itemWidth;
      }

      // Figure out which column to place the item in, and compute its position.
      let column = this.getNextColumnIndex(columnHeights);
      let x = this.margin + column * (itemWidth + horizontalSpacing);
      let y = columnHeights[column];

      let rect = new Rect(x, y, itemWidth, height);
      let layoutInfo = new LayoutInfo(node.type, key, rect);
      layoutInfo.estimatedSize = estimatedSize;
      layoutInfo.allowOverflow = true;
      this.layoutInfos.set(key, layoutInfo);

      // TODO: From v2 figure out this bit, when does this get called and what to replace this.collectionView._transaction with?
      // Removing it from v2 doesn't seem to do anything?
      // if (layoutInfo.estimatedSize && !invalidationContext.contentChanged && !this.collectionView._transaction) {
      //   this.updateItemSize(new IndexPath(section, i));
      // }

      columnHeights[column] += layoutInfo.rect.height + this.minSpace.height;
    }

    // Reset all columns to the maximum for the next section
    let maxHeight = Math.max.apply(Math, columnHeights) - this.minSpace.height + this.margin;
    columnHeights.fill(maxHeight);
    let y = columnHeights[0];

    if (this.isLoading) {
      let loaderY = y;
      let loaderHeight = 60;
      // If there aren't any items, make loader take all avaliable room and remove margin from y calculation
      // so it doesn't scroll
      if (this.collection.size === 0) {
        loaderY = 0;
        loaderHeight = this.virtualizer.visibleRect.height || 60;
      }

      let rect = new Rect(0, loaderY, this.virtualizer.visibleRect.width, loaderHeight);
      let loader = new LayoutInfo('loader', 'loader', rect);
      this.layoutInfos.set('loader', loader);
      y = loader.rect.maxY;
    }

    if (this.collection.size === 0 && !this.isLoading) {
      let rect = new Rect(0, 0, this.virtualizer.visibleRect.width, this.virtualizer.visibleRect.height);
      let placeholder = new LayoutInfo('placeholder', 'placeholder', rect);
      this.layoutInfos.set('placeholder', placeholder);
      y = placeholder.rect.maxY;
    }

    this.contentSize = new Size(this.virtualizer.visibleRect.width, y);
  }

  updateItemSize(key: Key, size: Size): number {
    let layoutInfo = this.layoutInfos.get(key);
    if (!size || !layoutInfo) {
      return false;
    }

    if (size.height !== layoutInfo.rect.height) {
      // TODO: also not sure about copying layout info vs mutating it. Listlayout does the below
      // but I feel that is because it actually maintained a layoutNode map cache which this doesn't have
      let newLayoutInfo = layoutInfo.copy();
      newLayoutInfo.rect.height = size.height < 600 ? size.height : 600;
      newLayoutInfo.estimatedSize = false;
      this.layoutInfos.set(key, newLayoutInfo);
      return true;
    }

    return false;
  }

  getNextColumnIndex(columnHeights: number[]): number {
    let minIndex = 0;
    for (let i = 0; i < columnHeights.length; i++) {
      if (columnHeights[i] < columnHeights[minIndex]) {
        minIndex = i;
      }
    }

    return minIndex;
  }

  getClosestRight(key: Key): Node<T> | undefined {
    let layoutInfo = this.getLayoutInfo(key);
    // Refactored from v2. Current strategy is to find the closest card in the adjacent column.
    // This prevent the issue where it was possible that the closest layoutInfo would be two columns over due to the middle card being exceptionally tall
    // and thus the top corner to top corner distance was massive.

    // First look for a card to the immediate right of the current card. If we can't find any, look for the nearest card in the entire column to the right of the card
    let rect = new Rect(layoutInfo.rect.maxX + 1, layoutInfo.rect.y, layoutInfo.rect.width + this.horizontalSpacing, layoutInfo.rect.height);
    key = this._findClosest(layoutInfo.rect, rect)?.key;

    if (!key) {
      rect = new Rect(layoutInfo.rect.maxX + 1, 0, layoutInfo.rect.width + this.horizontalSpacing, this.virtualizer.contentSize.height);
      key = this._findClosest(layoutInfo.rect, rect)?.key;
    }

    let item = this.collection.getItem(key);
    return getFirstItem(getChildNodes(item, this.collection))?.key;
  }

  getClosestLeft(key: Key): Node<T> | undefined {
    let layoutInfo = this.getLayoutInfo(key);
     // First look for a card to the immediate left of the current card. If we can't find any, look for the nearest card in the entire column to the left of the card
    let rect = new Rect(layoutInfo.rect.x - layoutInfo.rect.width - this.horizontalSpacing - 1, layoutInfo.rect.y, layoutInfo.rect.width + this.horizontalSpacing, layoutInfo.rect.height);
    key = this._findClosest(layoutInfo.rect, rect)?.key;

    if (!key) {
      rect = new Rect(layoutInfo.rect.x - layoutInfo.rect.width - this.horizontalSpacing - 1, 0, layoutInfo.rect.width + this.horizontalSpacing, this.virtualizer.contentSize.height);
      key = this._findClosest(layoutInfo.rect, rect)?.key;
    }

    let item = this.collection.getItem(key);
    return getFirstItem(getChildNodes(item, this.collection))?.key;
  }

  getKeyRightOf(key: Key): Node<T> | undefined {
    // Expected key is the currently focused cell so we need the parent row key
    let parentRowKey = this.collection.getItem(key).parentKey;
    return this.direction === 'rtl' ?  this.getClosestLeft(parentRowKey) : this.getClosestRight(parentRowKey);
  }

  getKeyLeftOf(key: Key): Node<T> | undefined {
    // Expected key is the currently focused cell so we need the parent row key
    let parentRowKey = this.collection.getItem(key).parentKey;
    return this.direction === 'rtl' ?  this.getClosestRight(parentRowKey) : this.getClosestLeft(parentRowKey);
  }
}
