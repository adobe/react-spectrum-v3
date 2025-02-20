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
import {LayoutInfo, Rect, Size} from '@react-stately/virtualizer';

export interface GalleryLayoutOptions extends BaseLayoutOptions {
  // /**
  //  * The card size in the grid.
  //  */
  // cardSize?: 'S' | 'M' | 'L',
  /**
   * The the default row height. Note this must be larger than the min item height.
   * @default 208
   */
  idealRowHeight?: number,
  /**
   * The spacing between items.
   * @default 18 x 18
   */
  itemSpacing?: Size,
  /**
   * The vertical padding for an item.
   * @default 78
   */
  itemPadding?: number,
  /**
   * Minimum size for a item in the grid.
   * @default 136 x 136
   */
  minItemSize?: Size,
  /**
   * Target for adding extra weight to elements during linear partitioning. Anything with an aspect ratio smaler than this value
   * will be targeted.
   * @type {number}
   */
  threshold?: number
}

const DEFAULT_OPTIONS = {
  S: {
    idealRowHeight: 112,
    minItemSize: new Size(96, 96),
    itemSpacing: new Size(8, 16),
    itemPadding: 24,
    dropSpacing: 50,
    margin: 8
  },
  L: {
    idealRowHeight: 208,
    minItemSize: new Size(136, 136),
    itemSpacing: new Size(18, 18),
    itemPadding: {
      'medium': 78,
      'large': 99
    },
    dropSpacing: 100,
    margin: 24
  }
};

export class GalleryLayout<T> extends BaseLayout<T> {
  protected idealRowHeight: number;
  protected itemSpacing: Size;
  itemPadding: number;
  protected minItemSize: Size;
  protected threshold: number;

  constructor(options: GalleryLayoutOptions = {}) {
    super(options);
    let cardSize = 'L';
    this.idealRowHeight = options.idealRowHeight || DEFAULT_OPTIONS[cardSize].idealRowHeight;
    this.itemSpacing = options.itemSpacing || DEFAULT_OPTIONS[cardSize].itemSpacing;
    this.itemPadding = options.itemPadding != null ? options.itemPadding : DEFAULT_OPTIONS[cardSize].itemPadding[this.scale];
    this.minItemSize = options.minItemSize || DEFAULT_OPTIONS[cardSize].minItemSize;
    this.threshold = options.threshold || 1;
    this.margin = options.margin != null ? options.margin : DEFAULT_OPTIONS[cardSize].margin;
  }

  get layoutType(): string {
    return 'gallery';
  }

  /**
   * Takes a row of widths and if there are any widths smaller than the min-width, leech width starting from
   * the widest in the row until it can't give anymore, then move to the second widest and so forth.
   * Do this until all assets meet the min-width.
   * */
  _distributeWidths(widths: number[]): boolean {
    // create a copy of the widths array and sort it largest to smallest
    let sortedWidths = widths.concat().sort((a, b) => a[1] > b[1] ? -1 : 1);
    for (let width of widths) {
      // for each width, if it's smaller than the min width
      if (width[1] < this.minItemSize.width) {
        // then figure out how much smaller
        let delta = this.minItemSize.width - width[1];
        for (let item of sortedWidths) {
          // go from the largest width in the row to the smallest
          // if the width is greater than the min width
          if (widths[item[0]][1] > this.minItemSize.width) {
            // subtract the delta from the width, if it's still greater than the min width
            // then we have finished, subtract the delta permanently from that width
            // eslint-disable-next-line max-depth
            if (widths[item[0]][1] - delta > this.minItemSize.width) {
              widths[item[0]][1] -= delta;
              delta = 0;
              break;
            } else {
              // otherwise, we take as much as we can from the current width and then move on to
              // the next largest and take some width from it
              let maxChange = widths[item[0]][1] - this.minItemSize.width;
              delta -= maxChange;
              widths[item[0]][1] -= maxChange;
            }
          }
        }
        if (delta > 0) {
          return false;
        }
        // force the width to be the min width that we just rebalanced for
        width[1] = this.minItemSize.width;
      }
    }
    return true;
  }

  buildCollection(): void {
    let visibleWidth = this.virtualizer.visibleRect.width;
    let visibleHeight = this.virtualizer.visibleRect.height;
    let y = this.margin;
    let availableWidth = visibleWidth - this.margin * 2;

    // If available width is not greater than 0, skip node layout calculations
    if (availableWidth > 0) {
      // Compute aspect ratios for all of the items, and the total width if all items were on in a single row.
      let ratios = [];
      let totalWidth = 0;
      let minRatio = this.minItemSize.width / this.minItemSize.height;
      let maxRatio = availableWidth / this.minItemSize.height;

      for (let node of this.collection) {
        let ratio = node.props.width / node.props.height;
        if (ratio < minRatio) {
          ratio = minRatio;
        } else if (ratio > maxRatio && ratio !== minRatio) {
          ratio = maxRatio;
        }

        let itemWidth = ratio * this.minItemSize.height;
        ratios.push(ratio);
        totalWidth += itemWidth;
      }

      totalWidth += this.itemSpacing.width * (this.collection.size - 1);

      // Determine how many rows we'll need, and partition the items into rows
      // using the aspect ratios as weights.
      let rows = Math.max(1, Math.ceil(totalWidth / availableWidth));
      // if the available width can't hold two items, then every item will get its own row
      // this leads to a faster run through linear partition and more dependable output for small row widths
      if (availableWidth <= (this.minItemSize.width * 2) + (this.itemPadding * 2)) {
        rows = this.collection.size;
      }

      let weightedRatios = ratios.map(ratio => ratio < this.threshold ? ratio + (0.5 * (1 / ratio)) : ratio);
      let partition = linearPartition(weightedRatios, rows);

      let index = 0;
      for (let row of partition) {
        // Compute the total weight for this row
        let totalWeight = 0;
        for (let j = index; j < index + row.length; j++) {
          totalWeight += ratios[j];
        }

        // Determine the row height based on the total available width and weight of this row.
        let bestRowHeight = (availableWidth - (row.length - 1) * this.itemSpacing.width) / totalWeight;

        // if this is the last row and the row height is >2x the ideal row height, then cap to the ideal height
        // probably doing this because if the last row has one extremely tall image, then the row becomes huge
        // though that can happen anywhere if a row has lots of tall images... so i'm not sure why this one matters
        if (row === partition[partition.length - 1] && bestRowHeight > this.idealRowHeight * 2) {
          bestRowHeight = this.idealRowHeight;
        }
        let itemHeight = Math.round(bestRowHeight) + this.itemPadding;
        let x = this.margin;

        // if any items are going to end up too small, add a bit of width to them and subtract it from wider objects
        let widths = [];
        for (let j = index; j < index + row.length; j++) {
          let width = Math.round(bestRowHeight * ratios[j]);
          widths.push([j - index, width]);
        }
        this._distributeWidths(widths);

        // Create items for this row.
        for (let j = index; j < index + row.length; j++) {
          let node = this.collection.rows[j];
          let itemWidth = Math.max(widths[j - index][1], this.minItemSize.width);
          let rect = new Rect(x, y, itemWidth, itemHeight);
          let layoutInfo = new LayoutInfo(node.type, node.key, rect);
          layoutInfo.allowOverflow = true;
          this.layoutInfos.set(node.key, layoutInfo);
          x += itemWidth + this.itemSpacing.width;
        }

        y += itemHeight + this.itemSpacing.height;
        index += row.length;
      }

      if (this.isLoading) {
        let loaderY = y;
        let loaderHeight = 60;
        // If there aren't any items, make loader take all available room and remove margin from y calculation
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
