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
import {Key} from 'react';
import {KeyboardDelegate, Node} from '@react-types/shared';
import {LayoutInfo, Rect, Size} from '@react-stately/virtualizer';

export interface GridLayoutOptions extends BaseLayoutOptions {
  /**
   * The card size in the grid.
   */
  cardSize?: 'S' | 'M' | 'L',
  /**
   * The minimum item size.
   * @default 208 x 208
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
   * @default 24 x 48
   */
  minSpace?: Size,
  /**
   * The maximum number of columns.
   * @default Infinity
   */
  maxColumns?: number,
  /**
   * The vertical padding for an item.
   * @default 52
   */
  itemPadding?: number
}

// TODO: copied from V2, update this with the proper spectrum values
// Should these be affected by Scale as well?
const DEFAULT_OPTIONS = {
  S: {
    itemPadding: 20,
    minItemSize: new Size(96, 96),
    maxItemSize: new Size(Infinity, Infinity),
    margin: 8,
    minSpace: new Size(8, 16),
    maxColumns: Infinity,
    dropSpacing: 50
  },
  L: {
    // TODO: for now bumping this higher since the new cards have more stuff in the content area.
    // Will need to ask Spectrum what these values should be. Used to be 52. Do the same for S above
    itemPadding: 100,
    minItemSize: new Size(208, 208),
    maxItemSize: new Size(Infinity, Infinity),
    margin: 24,
    minSpace: new Size(24, 48),
    maxColumns: Infinity,
    dropSpacing: 100
  }
};

export class GridLayout<T> extends BaseLayout<T> implements KeyboardDelegate {
  protected minItemSize: Size;
  protected maxItemSize: Size;
  protected margin: number;
  protected minSpace: Size;
  protected maxColumns: number;
  protected itemPadding: number;
  protected itemSize: Size;
  protected numColumns: number;
  protected numRows: number;
  protected horizontalSpacing: number;

  constructor(options: GridLayoutOptions = {}) {
    super(options);
    let cardSize = options.cardSize || 'L';
    this.minItemSize = options.minItemSize || DEFAULT_OPTIONS[cardSize].minItemSize;
    this.maxItemSize = options.maxItemSize || DEFAULT_OPTIONS[cardSize].maxItemSize;
    this.margin = options.margin != null ? options.margin : DEFAULT_OPTIONS[cardSize].margin;
    this.minSpace = options.minSpace || DEFAULT_OPTIONS[cardSize].minSpace;
    this.maxColumns = options.maxColumns || DEFAULT_OPTIONS[cardSize].maxColumns;
    this.itemPadding = options.itemPadding != null ? options.itemPadding : DEFAULT_OPTIONS[cardSize].itemPadding;
    this.itemSize = null;
    this.numColumns = 0;
    this.numRows = 0;
    this.horizontalSpacing = 0;
  }

  get layoutType() {
    return 'grid';
  }

  // TODO: Below functions From V2 Maybe don't need this? Might be a short cut for getting all visible rects since otherwise we'd have to iterate across all nodes
  getIndexAtPoint(x, y, allowInsertingAtEnd = false) {
    let itemHeight = this.itemSize.height + this.minSpace.height;
    let itemWidth = this.itemSize.width + this.horizontalSpacing;
    return Math.max(0,
      Math.min(
        this.collection.size + (allowInsertingAtEnd ? 1 : 0),
        Math.floor(y / itemHeight) * this.numColumns + Math.floor((x - this.horizontalSpacing) / itemWidth)
      )
    );
  }

  getVisibleLayoutInfos(rect) {
    let res: LayoutInfo[] = [];
    let numItems = this.collection.size;
    if (numItems <= 0 || !this.itemSize) {
      // If there aren't any items in the collection, we are in a loader/placeholder state. Return those layoutInfos as
      // the currently visible items
      if (this.layoutInfos.size > 0) {
        for (let layoutInfo of this.layoutInfos.values()) {
          if (this.isVisible(layoutInfo, rect)) {
            res.push(layoutInfo);
          }
        }
      }
    } else {
      // The approach from v2 uses indexes where other v3 layouts iterate through every node/root node. This feels more efficient
      let firstVisibleItem = this.getIndexAtPoint(rect.x, rect.y);
      let lastVisibleItem = this.getIndexAtPoint(rect.maxX, rect.maxY);

      for (let index = firstVisibleItem; index < lastVisibleItem; index++) {
        let keyFromIndex = this.collection.at(index).key;
        let layoutInfo = this.layoutInfos.get(keyFromIndex);
        if (this.isVisible(layoutInfo, rect)) {
          res.push(layoutInfo);
        }
      }

      // Check if loader is in view and add to res if so
      let loader = this.layoutInfos.get('loader');
      if (loader && this.isVisible(loader, rect)) {
        res.push(loader);
      }
    }

    return res;
  }

  validate() {
    this.collection = this.virtualizer.collection;
    this.buildCollection();

    // Remove layout info that doesn't exist in new collection
    if (this.lastCollection) {
      for (let key of this.lastCollection.getKeys()) {
        if (!this.collection.getItem(key)) {
          this.layoutInfos.delete(key);
        }
      }

      // TODO: dunno why I had to add this but it gets rid of the loading spinner, otherwise it remains on initial async load
      // Can't figure out why ListLayout didn't need that
      if (!this.isLoading) {
        this.layoutInfos.delete('loader')
      }
    }

    this.lastCollection = this.collection;
  }

  buildCollection() {
    let visibleWidth = this.virtualizer.visibleRect.width;
    let visibleHeight = this.virtualizer.visibleRect.height;

    // Compute the number of rows and columns needed to display the content
    let availableWidth = visibleWidth - this.margin * 2;
    let columns = Math.floor(availableWidth / (this.minItemSize.width + this.minSpace.width));
    this.numColumns = Math.max(1, Math.min(this.maxColumns, columns));
    this.numRows = Math.ceil(this.collection.size / this.numColumns);

    // Compute the available width (minus the space between items)
    let width = availableWidth - (this.minSpace.width * Math.max(0, this.numColumns - 1));

    // Compute the item width based on the space available
    let itemWidth = Math.floor(width / this.numColumns);
    itemWidth = Math.max(this.minItemSize.width, Math.min(this.maxItemSize.width, itemWidth));

    // Compute the item height, which is proportional to the item width
    let t = ((itemWidth - this.minItemSize.width) / this.minItemSize.width);
    let itemHeight = this.minItemSize.height + this.minItemSize.height * t;
    itemHeight = Math.max(this.minItemSize.height, Math.min(this.maxItemSize.height, itemHeight)) + this.itemPadding;

    this.itemSize = new Size(itemWidth, itemHeight);

    // Compute the horizontal spacing and content height
    this.horizontalSpacing = Math.floor((visibleWidth - this.numColumns * this.itemSize.width) / (this.numColumns + 1));

    let y = this.margin;
    let index = 0;
    for (let node of this.collection) {
      let layoutInfo = this.buildChild(node, y, index);
      y = layoutInfo.rect.maxY;
      index++;
    }

    if (this.isLoading) {
      let loaderY = y;
      let loaderHeight = 60;
      // If there aren't any items, make loader take all avaliable room and remove margin from y calculation
      // so it doesn't scroll
      if (this.collection.size === 0) {
        loaderY = 0;
        loaderHeight = visibleHeight || 60;
      }

      let rect = new Rect(0, loaderY, visibleWidth, loaderHeight);
      let loader = new LayoutInfo('loader', 'loader', rect);
      this.layoutInfos.set('loader', loader);
      y = loader.rect.maxY;
    }

    if (this.collection.size === 0 && !this.isLoading) {
      let rect = new Rect(0, 0, visibleWidth, visibleHeight);
      let placeholder = new LayoutInfo('placeholder', 'placeholder', rect);
      this.layoutInfos.set('placeholder', placeholder);
      y = placeholder.rect.maxY;
    }

    this.contentSize = new Size(visibleWidth, y);
  }

  buildChild(node: Node<T>, y: number, index: number): LayoutInfo {
    let row = Math.floor(index / this.numColumns);
    let column = index % this.numColumns;
    let x = this.margin + column * (this.itemSize.width + this.horizontalSpacing);
    y = this.margin + row * (this.itemSize.height + this.minSpace.height);

    let rect = new Rect(x, y, this.itemSize.width, this.itemSize.height);
    let layoutInfo = new LayoutInfo(node.type, node.key, rect);
    this.layoutInfos.set(node.key, layoutInfo);
    return layoutInfo;
  }

  // Since the collection doesn't represent the visual layout, need to calculate what row and column the current key is in,
  // then return the key that occupies the row + column below. This can be done by figuring out how many cards exist per column then dividing the
  // collection contents by that number (which will give us the row distribution)
  getKeyBelow(key: Key) {
    let indexRowBelow;
    let keyArray = [...this.collection.getKeys()];
    let index = keyArray.findIndex(k => k === key);
    if (index !== -1) {
      indexRowBelow = index + this.numColumns;
    } else {
      return null;
    }

    return this.collection.at(indexRowBelow)?.key || null;
  }

  getKeyAbove(key: Key) {
    let indexRowAbove;
    let keyArray = [...this.collection.getKeys()];
    let index = keyArray.findIndex(k => k === key);
    if (index !== -1) {
      indexRowAbove = index - this.numColumns;
    } else {
      return null;
    }

    return this.collection.at(indexRowAbove)?.key || null;
  }
}
