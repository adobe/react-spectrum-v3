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

import {BaseLayout, BaseLayoutOptions} from './';
import {InvalidationContext, LayoutInfo, Rect, Size} from '@react-stately/virtualizer';
import {Key} from 'react';
import {KeyboardDelegate, Node} from '@react-types/shared';

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
   * The margin around the grid view between the edges and the items.
   * @default 24
   */
  margin?: number, // TODO: Perhaps should accept Responsive<DimensionValue>
  /**
   * The minimum space required between items.
   * @default 24 x 24
   */
  minSpace?: Size,
  /**
   * The maximum number of columns.
   * @default Infinity
   */
  maxColumns?: number,
  /**
   * The vertical padding for an item.
   * @default 56
   */
  itemPadding?: number
}

// TODO: this didn't have any options that varied with card size, should it have?
export class WaterfallLayout<T> extends BaseLayout<T> implements KeyboardDelegate {
  protected minItemSize: Size;
  protected maxItemSize: Size;
  protected margin: number;
  protected minSpace: Size;
  protected maxColumns: number;
  protected itemPadding: number;
  protected numColumns: number;
  protected itemWidth: number;
  protected horizontalSpacing: number;

  constructor(options: WaterfallLayoutOptions = {}) {
    // TODO: WaterfallLayout doesn't use card size in v2, but perhaps it should support it? Perhaps it would modify
    // minItemSize defaults or other things
    super(options);
    this.minItemSize = options.minItemSize || new Size(240, 136);
    this.maxItemSize = options.maxItemSize || new Size(Infinity, Infinity);
    this.margin = 24;
    this.minSpace = options.minSpace || new Size(24, 24);
    this.maxColumns = options.maxColumns || Infinity;
    this.itemPadding = options.itemPadding != null ? options.itemPadding : 56;

    this.itemWidth = 0;
    this.numColumns = 0;

    this.lastCollection = null;
    this.collator = options.collator;
  }

  get layoutType() {
    return 'waterfall';
  }

  validate(invalidationContext: InvalidationContext<Node<T>, unknown>) {
    this.collection = this.virtualizer.collection;
    this.buildCollection(invalidationContext);

    // Remove layout info that doesn't exist in new collection
    if (this.lastCollection) {
      for (let key of this.lastCollection.getKeys()) {
        if (!this.collection.getItem(key)) {
          this.layoutInfos.delete(key);
        }
      }

      if (!this.isLoading) {
        this.layoutInfos.delete('loader')
      }
    }

    this.lastCollection = this.collection;
  }

  buildCollection(invalidationContext: InvalidationContext<Node<T>, unknown>) {
    // Compute the number of columns needed to display the content
    let visibleWidth = this.virtualizer.visibleRect.width;
    let availableWidth = visibleWidth - this.margin * 2;
    let columns = Math.floor(visibleWidth / (this.minItemSize.width + this.minSpace.width));
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
        let scaledHeight = Math.round(nodeWidth * ((itemWidth) / nodeHeight));
        height = Math.max(this.minItemSize.height, Math.min(this.maxItemSize.height, scaledHeight)) + this.itemPadding;
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

  updateItemSize(key: Key, size: Size) {
    let layoutInfo = this.layoutInfos.get(key);
    if (!size || !layoutInfo) {
      return false;
    }

    if (size.height !== layoutInfo.rect.height) {
      // TODO: also not sure about copying layout info vs mutating it. Listlayout does the below
      // but I feel that is because it actually maintained a layoutNode map cache which this doesn't have
      let newLayoutInfo = layoutInfo.copy();
      newLayoutInfo.rect.height = size.height;
      this.layoutInfos.set(key, newLayoutInfo);
      // TODO: v2 had layoutInfo.estimatedSize = view.estimatedSize || false; but we can't do the same here?
      layoutInfo.estimatedSize = false;
      return true;
    }

    return false;
  }

  getNextColumnIndex(columnHeights) {
    let minIndex = 0;
    for (let i = 0; i < columnHeights.length; i++) {
      if (columnHeights[i] < columnHeights[minIndex]) {
        minIndex = i;
      }
    }

    return minIndex;
  }

  getClosestRight(key: Key) {
    let layoutInfo = this.getLayoutInfo(key);
    // Refactored from v2. Current strategy is to find the closest card in the adjacent column.
    // This prevent the issue where it was possible that the closest layoutInfo would be two columns over due to the middle card being exceptionally tall
    // and thus the top corner to top corner distance was massive
    let rect = new Rect(layoutInfo.rect.maxX + 1, 0, layoutInfo.rect.width + this.horizontalSpacing, this.virtualizer.contentSize.height);

    return this._findClosest(layoutInfo.rect, rect)?.key;
  }

  getClosestLeft(key: Key) {
    let layoutInfo = this.getLayoutInfo(key);
    let rect = new Rect(layoutInfo.rect.x - layoutInfo.rect.width - this.horizontalSpacing - 1, 0, layoutInfo.rect.width + this.horizontalSpacing, this.virtualizer.contentSize.height);

    return this._findClosest(layoutInfo.rect, rect)?.key;
  }

  getKeyRightOf(key: Key) {
    return this.direction === 'rtl' ?  this.getClosestLeft(key) : this.getClosestRight(key);
  }

  getKeyLeftOf(key: Key) {
    return this.direction === 'rtl' ?  this.getClosestRight(key) : this.getClosestLeft(key);
  }
}
