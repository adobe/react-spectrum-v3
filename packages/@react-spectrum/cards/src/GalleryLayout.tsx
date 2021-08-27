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
import {KeyboardDelegate} from '@react-types/shared';
import {LayoutInfo, Rect, Size} from '@react-stately/virtualizer';

export interface GalleryLayoutOptions<T> extends BaseLayoutOptions<T> {
  /**
   * The card size in the grid.
   */
  cardSize?: 'S' | 'M' | 'L',
  /**
   * The the default row height.
   * @default 208
   */
  idealRowHeight?: number,
  /**
   * The spacing between items.
   * @default 24 x 24
   */
  itemSpacing?: Size,
  /**
   * The vertical padding for an item.
   * @default 32
   */
  itemPadding?: Size
}

// TODO: copied from V2, update this with the proper spectrum values
// Should these be affected by Scale as well?
const DEFAULT_OPTIONS = {
  S: {
    idealRowHeight: 112,
    minItemSize: new Size(96, 96),
    itemSpacing: new Size(8, 16),
    // TODO: will need to update as well
    itemPadding: 24,
    dropSpacing: 50
  },
  L: {
    idealRowHeight: 208,
    minItemSize: new Size(136, 136),
    itemSpacing: new Size(24, 32),
    // TODO: updated to work with new v3 cards (there is additional space required for the descriptions if there is a description)
    itemPadding: 114,
    dropSpacing: 100
  }
};

export class GalleryLayout<T> extends BaseLayout<T> implements KeyboardDelegate {
  protected idealRowHeight: number;
  // TODO: should this have had a margin option? v2 seems to use itemSpacing
  protected itemSpacing: Size;
  protected itemPadding: number;

  constructor(options: GalleryLayoutOptions<T> = {}) {
    super(options);
    let cardSize = options.cardSize || 'L';
    this.idealRowHeight = options.idealRowHeight || DEFAULT_OPTIONS[cardSize].idealRowHeight;
    this.itemSpacing = options.itemSpacing || DEFAULT_OPTIONS[cardSize].itemSpacing;
    this.itemPadding = options.itemPadding != null ? options.itemPadding : DEFAULT_OPTIONS[cardSize].itemPadding;
  }

  get layoutType() {
    return 'gallery';
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

      if (!this.isLoading) {
        this.layoutInfos.delete('loader')
      }
    }

    this.lastCollection = this.collection;
  }

  buildCollection() {
    let visibleWidth = this.virtualizer.visibleRect.width;
    let visibleHeight = this.virtualizer.visibleRect.height;
    let y = this.itemSpacing.height;
    let availableWidth = visibleWidth - this.itemSpacing.width * 2;

    // Compute aspect ratios for all of the items, and the total width if all items were on in a single row.
    let ratios = [];
    let totalWidth = 0;
    for (let node of this.collection) {
      let ratio = node.props.width / node.props.height;
      ratios.push(ratio);
      totalWidth += ratio * this.idealRowHeight;
    }

    // Determine how many rows we'll need, and partition the items into rows
    // using the aspect ratios as weights.
    let rows = Math.max(1, Math.round(totalWidth / availableWidth));
    let partition = linearPartition(ratios, rows);

    let index = 0;
    for (let row of partition) {
      // Compute the total weight for this row
      let totalWeight = 0;
      for (let j = index; j < index + row.length; j++) {
        totalWeight += ratios[j];
      }

      // Determine the row height based on the total available width and weight of this row.
      let rowHeight = (availableWidth - (row.length - 1) * this.itemSpacing.width) / totalWeight;
      if (row === partition[partition.length - 1] && rowHeight > this.idealRowHeight * 2) {
        rowHeight = this.idealRowHeight;
      }

      let itemHeight = Math.round(rowHeight) + this.itemPadding;
      let x = this.itemSpacing.width;

      // Create items for this row.
      for (let j = index; j < index + row.length; j++) {
        let node = this.collection.at(j);
        let itemWidth = Math.round(rowHeight * ratios[j]);
        let rect = new Rect(x, y, itemWidth, itemHeight);
        let layoutInfo = new LayoutInfo(node.type, node.key, rect);
        this.layoutInfos.set(node.key, layoutInfo);
        x += itemWidth + this.itemSpacing.width;
      }

      y += itemHeight + this.itemSpacing.height;
      index += row.length;
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
}

// https://www8.cs.umu.se/kurser/TDBA77/VT06/algorithms/BOOK/BOOK2/NODE45.HTM
function linearPartition(seq, k) {
  let n = seq.length;
  if (k <= 0) {
    return [];
  }

  if (k >= n) {
    return seq.map(x => [x]);
  }

  if (n === 1) {
    return [seq];
  }

  let table = Array(n).fill(0).map(() => Array(k).fill(0));
  let solution = Array(n - 1).fill(0).map(() => Array(k - 1).fill(0));

  for (let i = 0; i < n; i++) {
    table[i][0] = seq[i] + (i > 0 ? table[i - 1][0] : 0);
  }

  for (let i = 0; i < k; i++) {
    table[0][i] = seq[0];
  }

  for (let i = 1; i < n; i++) {
    for (let j = 1; j < k; j++) {
      let currentMin = 0;
      let minX = Infinity;

      for (let x = 0; x < i; x++) {
        let c1 = table[x][j - 1];
        let c2 = table[i][0] - table[x][0];
        let cost = Math.max(c1, c2);

        if (!x || cost < currentMin) {
          currentMin = cost;
          minX = x;
        }
      }

      table[i][j] = currentMin;
      solution[i - 1][j - 1] = minX;
    }
  }

  n = n - 1;
  k = k - 2;

  let result = [];
  while (k >= 0) {
    if (n >= 1) {
      let row = [];
      for (let i = solution[n - 1][k] + 1; i < n + 1; i++) {
        row.push(seq[i]);
      }

      result.unshift(row);
      n = solution[n - 1][k];
    }

    k--;
  }

  let row = [];
  for (let i = 0; i < n + 1; i++) {
    row.push(seq[i]);
  }

  result.unshift(row);

  return result;
}
