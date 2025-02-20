/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {DropTarget, DropTargetDelegate, ItemDropTarget, Key, Node} from '@react-types/shared';
import {Layout, LayoutInfo, Rect, Size} from '@react-stately/virtualizer';

export interface GridLayoutOptions {
  /**
   * The minimum item size.
   * @default 200 x 200
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
   * The thickness of the drop indicator.
   * @default 2
   */
  dropIndicatorThickness?: number
}

/**
 * GridLayout is a virtualizer Layout implementation
 * that arranges its items in an equal sized grid. 
 * The items are sized between a minimum and maximum size
 * depending on the width of the container.
 */
export class GridLayout<T, O = any> extends Layout<Node<T>, O> implements DropTargetDelegate {
  protected minItemSize: Size;
  protected maxItemSize: Size;
  protected minSpace: Size;
  protected maxColumns: number;
  protected dropIndicatorThickness: number;
  protected itemSize: Size = new Size();
  protected numColumns: number = 0;
  protected horizontalSpacing: number = 0;
  protected layoutInfos: LayoutInfo[] = [];

  constructor(options: GridLayoutOptions) {
    super();
    this.minItemSize = options.minItemSize || new Size(200, 200);
    this.maxItemSize = options.maxItemSize || new Size(Infinity, Infinity);
    this.minSpace = options.minSpace || new Size(18, 18);
    this.maxColumns = options.maxColumns || Infinity;
    this.dropIndicatorThickness = options.dropIndicatorThickness || 2;
  }

  update(): void {
    let visibleWidth = this.virtualizer!.visibleRect.width;

    // The max item width is always the entire viewport.
    // If the max item height is infinity, scale in proportion to the max width.
    let maxItemWidth = Math.min(this.maxItemSize.width, visibleWidth);
    let maxItemHeight = Number.isFinite(this.maxItemSize.height)
      ? this.maxItemSize.height
      : Math.floor((this.minItemSize.height / this.minItemSize.width) * maxItemWidth);

    // Compute the number of rows and columns needed to display the content
    let columns = Math.floor(visibleWidth / (this.minItemSize.width + this.minSpace.width));
    this.numColumns = Math.max(1, Math.min(this.maxColumns, columns));

    // Compute the available width (minus the space between items)
    let width = visibleWidth - (this.minSpace.width * Math.max(0, this.numColumns));

    // Compute the item width based on the space available
    let itemWidth = Math.floor(width / this.numColumns);
    itemWidth = Math.max(this.minItemSize.width, Math.min(maxItemWidth, itemWidth));

    // Compute the item height, which is proportional to the item width
    let t = ((itemWidth - this.minItemSize.width) / Math.max(1, maxItemWidth - this.minItemSize.width));
    let itemHeight = this.minItemSize.height +  Math.floor((maxItemHeight - this.minItemSize.height) * t);
    itemHeight = Math.max(this.minItemSize.height, Math.min(maxItemHeight, itemHeight));
    this.itemSize = new Size(itemWidth, itemHeight);

    // Compute the horizontal spacing and content height
    this.horizontalSpacing = Math.floor((visibleWidth - this.numColumns * this.itemSize.width) / (this.numColumns + 1));

    this.layoutInfos = [];
    for (let node of this.virtualizer!.collection) {
      this.layoutInfos.push(this.getLayoutInfoForNode(node));
    }
  }

  getVisibleLayoutInfos(rect: Rect): LayoutInfo[] {
    let firstVisibleItem = this.getIndexAtPoint(rect.x, rect.y);
    let lastVisibleItem = this.getIndexAtPoint(rect.maxX, rect.maxY);
    let result = this.layoutInfos.slice(firstVisibleItem, lastVisibleItem + 1);
    let persistedIndices: number[] = [];
    for (let key of this.virtualizer!.persistedKeys) {
      let item = this.virtualizer!.collection.getItem(key);
      if (item?.index != null) {
        persistedIndices.push(item.index);
      }
    }
    persistedIndices.sort((a, b) => a - b);

    let persistedBefore: LayoutInfo[] = [];
    for (let index of persistedIndices) {
      if (index < firstVisibleItem) {
        persistedBefore.push(this.layoutInfos[index]);
      } else if (index > lastVisibleItem) {
        result.push(this.layoutInfos[index]);
      }
    }
    result.unshift(...persistedBefore);
    return result;
  }

  protected getIndexAtPoint(x: number, y: number): number {
    let itemHeight = this.itemSize.height + this.minSpace.height;
    let itemWidth = this.itemSize.width + this.horizontalSpacing;
    return Math.max(0,
      Math.min(
        this.virtualizer!.collection.size - 1,
        Math.floor(y / itemHeight) * this.numColumns + Math.floor((x - this.horizontalSpacing) / itemWidth)
      )
    );
  }

  getLayoutInfo(key: Key): LayoutInfo | null {
    let node = this.virtualizer!.collection.getItem(key);
    return node ? this.layoutInfos[node.index] : null;
  }

  protected getLayoutInfoForNode(node: Node<T>): LayoutInfo {
    let idx = node.index;
    let row = Math.floor(idx / this.numColumns);
    let column = idx % this.numColumns;
    let x = this.horizontalSpacing + column * (this.itemSize.width + this.horizontalSpacing);
    let y = this.minSpace.height + row * (this.itemSize.height + this.minSpace.height);
    let rect = new Rect(x, y, this.itemSize.width, this.itemSize.height);
    return new LayoutInfo(node.type, node.key, rect);
  }

  getContentSize(): Size {
    let numRows = Math.ceil(this.virtualizer!.collection.size / this.numColumns);
    let contentHeight = this.minSpace.height + numRows * (this.itemSize.height + this.minSpace.height);
    return new Size(this.virtualizer!.visibleRect.width, contentHeight);
  }

  getDropTargetFromPoint(x: number, y: number, isValidDropTarget: (target: DropTarget) => boolean): DropTarget {
    if (this.layoutInfos.length === 0) {
      return {type: 'root'};
    }

    x += this.virtualizer!.visibleRect.x;
    y += this.virtualizer!.visibleRect.y;
    let index = this.getIndexAtPoint(x, y);

    let layoutInfo = this.layoutInfos[index];
    let target: DropTarget =  {
      type: 'item',
      key: layoutInfo.key,
      dropPosition: 'on'
    };

    let pos = this.numColumns === 1 ? y : x;
    let layoutInfoPos = this.numColumns === 1 ? layoutInfo.rect.y : layoutInfo.rect.x;
    let size = this.numColumns === 1 ? layoutInfo.rect.height : layoutInfo.rect.width;
    if (isValidDropTarget(target)) {
      // If dropping on the item is accepted, try the before/after positions
      // if within 5px of the start or end of the item.
      if (pos < layoutInfoPos + 5) {
        target.dropPosition = 'before';
      } else if (pos > layoutInfoPos + size - 5) {
        target.dropPosition = 'after';
      }
    } else {
      // If dropping on the item isn't accepted, try the target before or after depending on the position.
      let mid = layoutInfoPos + size / 2;
      if (pos <= mid && isValidDropTarget({...target, dropPosition: 'before'})) {
        target.dropPosition = 'before';
      } else if (pos >= mid && isValidDropTarget({...target, dropPosition: 'after'})) {
        target.dropPosition = 'after';
      }
    }

    return target;
  }

  getDropTargetLayoutInfo(target: ItemDropTarget): LayoutInfo {
    let layoutInfo = this.getLayoutInfo(target.key)!;
    let rect: Rect;
    if (this.numColumns === 1) {
      // Flip from vertical to horizontal if only one column is visible.
      rect = new Rect(
        layoutInfo.rect.x,
        target.dropPosition === 'before'
          ? layoutInfo.rect.y - this.minSpace.height / 2 - this.dropIndicatorThickness / 2
          : layoutInfo.rect.maxY + this.minSpace.height / 2 - this.dropIndicatorThickness / 2,
        layoutInfo.rect.width,
        this.dropIndicatorThickness
      );
    } else {
      rect = new Rect(
        target.dropPosition === 'before'
          ? layoutInfo.rect.x - this.horizontalSpacing / 2 - this.dropIndicatorThickness / 2
          : layoutInfo.rect.maxX + this.horizontalSpacing / 2 - this.dropIndicatorThickness / 2,
        layoutInfo.rect.y,
        this.dropIndicatorThickness,
        layoutInfo.rect.height
      );
    }

    return new LayoutInfo('dropIndicator', target.key + ':' + target.dropPosition, rect);
  }
}
