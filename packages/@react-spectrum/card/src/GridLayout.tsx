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
import {Key, Node, Orientation} from '@react-types/shared';
import {LayoutInfo, Rect, Size} from '@react-stately/virtualizer';

export interface GridLayoutOptions extends BaseLayoutOptions {
  // /**
  //  * The card size in the grid.
  //  */
  // cardSize?: 'S' | 'M' | 'L',
  /**
   * The minimum item size.
   * @default 208 x 208 for horizontal card orientation. 102 x 102 for vertical card orientation.
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
  maxColumns?: number,
  /**
   * The additional padding along the card's main axis. Affects the sizing of the content area following the card image.
   * @default 95
   */
  itemPadding?: number,
  /**
   * The orientation of the cards withn the grid.
   * @default vertical
   */
  cardOrientation?: Orientation
}

const DEFAULT_OPTIONS = {
  S: {
    itemPadding: 20,
    minItemSize: {
      'vertical': new Size(96, 96)
    },
    maxItemSize: new Size(Infinity, Infinity),
    margin: 8,
    minSpace: new Size(6, 6),
    maxColumns: Infinity,
    dropSpacing: 50
  },
  L: {
    itemPadding: {
      'vertical': {
        'medium': 78,
        'large': 98
      },
      'horizontal': {
        'medium': 150,
        'large': 170
      }
    },
    minItemSize: {
      'vertical': new Size(208, 208),
      'horizontal': new Size(102, 102)
    },
    maxItemSize: new Size(Infinity, Infinity),
    margin: 24,
    minSpace: new Size(18, 18),
    maxColumns: Infinity,
    dropSpacing: 100
  }
};

export class GridLayout<T> extends BaseLayout<T> {
  protected minItemSize: Size;
  protected maxItemSize: Size;
  protected minSpace: Size;
  protected maxColumns: number;
  itemPadding: number;
  cardOrientation: Orientation;
  protected itemSize: Size;
  protected numColumns: number;
  protected numRows: number;
  protected horizontalSpacing: number;

  constructor(options: GridLayoutOptions = {}) {
    super(options);
    let cardSize = 'L';
    this.cardOrientation = options.cardOrientation || 'vertical';
    this.minItemSize = options.minItemSize || DEFAULT_OPTIONS[cardSize].minItemSize[this.cardOrientation];
    this.maxItemSize = options.maxItemSize || DEFAULT_OPTIONS[cardSize].maxItemSize;
    this.margin = options.margin != null ? options.margin : DEFAULT_OPTIONS[cardSize].margin;
    this.minSpace = options.minSpace || DEFAULT_OPTIONS[cardSize].minSpace;
    this.maxColumns = options.maxColumns || DEFAULT_OPTIONS[cardSize].maxColumns;
    this.itemPadding = options.itemPadding != null ? options.itemPadding : DEFAULT_OPTIONS[cardSize].itemPadding[this.cardOrientation][this.scale];
    this.itemSize = null;
    this.numColumns = 0;
    this.numRows = 0;
    this.horizontalSpacing = 0;
  }

  get layoutType(): string {
    return 'grid';
  }

  getIndexAtPoint(x: number, y: number, allowInsertingAtEnd = false): number {
    let itemHeight = this.itemSize.height + this.minSpace.height;
    let itemWidth = this.itemSize.width + this.horizontalSpacing;
    return Math.max(0,
      Math.min(
        this.collection.size - (allowInsertingAtEnd ? 0 : 1),
        Math.floor(y / itemHeight) * this.numColumns + Math.floor((x - this.horizontalSpacing) / itemWidth)
      )
    );
  }

  buildCollection(): void {
    let visibleWidth = this.virtualizer.visibleRect.width;
    let visibleHeight = this.virtualizer.visibleRect.height;
    let horizontalItemPadding = this.cardOrientation === 'horizontal' ? this.itemPadding : 0;
    let verticalItemPadding = this.cardOrientation === 'vertical' ? this.itemPadding : 0;
    let minCardWidth = this.minItemSize.width + horizontalItemPadding;

    // Compute the number of rows and columns needed to display the content
    let availableWidth = visibleWidth - this.margin * 2;
    let columns = Math.floor((availableWidth + this.minSpace.width) / (minCardWidth + this.minSpace.width));
    this.numColumns = Math.max(1, Math.min(this.maxColumns, columns));
    this.numRows = Math.ceil(this.collection.size / this.numColumns);

    // Compute the available width (minus the space between items)
    let width = availableWidth - (this.minSpace.width * Math.max(0, this.numColumns - 1));

    // Compute the item width based on the space available
    let itemWidth = Math.floor(width / this.numColumns);
    itemWidth = Math.max(minCardWidth, Math.min(this.maxItemSize.width, itemWidth));
    // Compute the item height, which is proportional to the item width
    let t = ((itemWidth - minCardWidth) / minCardWidth);
    let itemHeight = Math.floor(this.minItemSize.height + this.minItemSize.height * t);
    itemHeight = Math.max(this.minItemSize.height, Math.min(this.maxItemSize.height, itemHeight)) + verticalItemPadding;
    this.itemSize = new Size(itemWidth, itemHeight);

    // Compute the horizontal spacing and content height
    this.horizontalSpacing = this.numColumns < 2 ? 0 : Math.floor((availableWidth - this.numColumns * this.itemSize.width) / (this.numColumns - 1));

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
    // TODO: Perhaps have it so that the child key for each row is stored with the layoutInfo?
    let layoutInfo = new LayoutInfo(node.type, node.key, rect);
    layoutInfo.allowOverflow = true;
    this.layoutInfos.set(node.key, layoutInfo);
    return layoutInfo;
  }

  // Since the collection doesn't represent the visual layout, need to calculate what row and column the current key is in,
  // then return the key that occupies the row + column below. This can be done by figuring out how many cards exist per column then dividing the
  // collection contents by that number (which will give us the row distribution)
  getKeyBelow(key: Key): Node<T> | undefined | null {
    // Expected key is the currently focused cell so we need the parent row key
    let parentRowKey = this.collection.getItem(key).parentKey;
    let indexRowBelow;
    let index = this.collection.rows.findIndex(card => card.key === parentRowKey);
    if (index !== -1) {
      indexRowBelow = index + this.numColumns;
    } else {
      return null;
    }

    let row = this.collection.rows[indexRowBelow];
    return row ? getFirstItem(getChildNodes(row, this.collection))?.key : null;
  }

  getKeyAbove(key: Key): Node<T> | undefined | null {
    // Expected key is the currently focused cell so we need the parent row key
    let parentRowKey = this.collection.getItem(key).parentKey;
    let indexRowAbove;
    let index = this.collection.rows.findIndex(card => card.key === parentRowKey);
    if (index !== -1) {
      indexRowAbove = index - this.numColumns;
    } else {
      return null;
    }

    let row = this.collection.rows[indexRowAbove];
    return row ? getFirstItem(getChildNodes(row, this.collection))?.key : null;
  }
}
