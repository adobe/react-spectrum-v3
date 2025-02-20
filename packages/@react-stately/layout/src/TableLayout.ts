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

import {DropTarget, ItemDropTarget, Key} from '@react-types/shared';
import {getChildNodes} from '@react-stately/collections';
import {GridNode} from '@react-types/grid';
import {InvalidationContext, LayoutInfo, Point, Rect, Size} from '@react-stately/virtualizer';
import {LayoutNode, ListLayout, ListLayoutOptions} from './ListLayout';
import {TableCollection} from '@react-types/table';
import {TableColumnLayout} from '@react-stately/table';

export interface TableLayoutProps {
  columnWidths?: Map<Key, number>
}

const DEFAULT_ROW_HEIGHT = 48;

/**
 * TableLayout is a virtualizer Layout implementation that arranges
 * items in rows and columns.
 */
export class TableLayout<T, O extends TableLayoutProps = TableLayoutProps> extends ListLayout<T, O> {
  protected lastCollection: TableCollection<T> | null = null;
  private columnWidths: Map<Key, number> = new Map();
  private stickyColumnIndices: number[];
  private lastPersistedKeys: Set<Key> | null = null;
  private persistedIndices: Map<Key, number[]> = new Map();

  constructor(options: ListLayoutOptions) {
    super(options);
    this.stickyColumnIndices = [];
  }

  // Backward compatibility for subclassing.
  protected get collection(): TableCollection<T> {
    return this.virtualizer!.collection as TableCollection<T>;
  }

  private columnsChanged(newCollection: TableCollection<T>, oldCollection: TableCollection<T> | null) {
    return !oldCollection ||
      newCollection.columns !== oldCollection.columns &&
      newCollection.columns.length !== oldCollection.columns.length ||
      newCollection.columns.some((c, i) =>
        c.key !== oldCollection.columns[i].key ||
        c.props.width !== oldCollection.columns[i].props.width ||
        c.props.minWidth !== oldCollection.columns[i].props.minWidth ||
        c.props.maxWidth !== oldCollection.columns[i].props.maxWidth
      );
  }

  update(invalidationContext: InvalidationContext<O>): void {
    let newCollection = this.virtualizer!.collection as TableCollection<T>;

    // If columnWidths were provided via layoutOptions, update those.
    // Otherwise, calculate column widths ourselves.
    if (invalidationContext.layoutOptions?.columnWidths) {
      if (invalidationContext.layoutOptions.columnWidths !== this.columnWidths) {
        this.columnWidths = invalidationContext.layoutOptions.columnWidths;
        invalidationContext.sizeChanged = true;
      }
    } else if (invalidationContext.sizeChanged || this.columnsChanged(newCollection, this.lastCollection)) {
      let columnLayout = new TableColumnLayout({});
      this.columnWidths = columnLayout.buildColumnWidths(this.virtualizer!.visibleRect.width - this.padding * 2, newCollection, new Map());
      invalidationContext.sizeChanged = true;
    }

    super.update(invalidationContext);
  }

  protected buildCollection(): LayoutNode[] {
    this.stickyColumnIndices = [];

    let collection = this.virtualizer!.collection as TableCollection<T>;
    for (let column of collection.columns) {
      // The selection cell and any other sticky columns always need to be visible.
      // In addition, row headers need to be in the DOM for accessibility labeling.
      if (this.isStickyColumn(column) || collection.rowHeaderColumnKeys.has(column.key)) {
        this.stickyColumnIndices.push(column.index);
      }
    }

    let header = this.buildTableHeader();
    this.layoutNodes.set(header.layoutInfo.key, header);
    let body = this.buildBody(header.layoutInfo.rect.maxY + this.gap);
    this.lastPersistedKeys = null;

    body.layoutInfo.rect.width = Math.max(header.layoutInfo.rect.width, body.layoutInfo.rect.width);
    this.contentSize = new Size(body.layoutInfo.rect.width + this.padding * 2, body.layoutInfo.rect.maxY + this.padding);
    return [
      header,
      body
    ];
  }

  protected buildTableHeader(): LayoutNode {
    let collection = this.virtualizer!.collection as TableCollection<T>;
    let rect = new Rect(this.padding, this.padding, 0, 0);
    let layoutInfo = new LayoutInfo('header', collection.head?.key ?? 'header', rect);
    layoutInfo.isSticky = true;
    layoutInfo.zIndex = 1;

    let y = this.padding;
    let width = 0;
    let children: LayoutNode[] = [];
    for (let headerRow of collection.headerRows) {
      let layoutNode = this.buildChild(headerRow, this.padding, y, layoutInfo.key);
      layoutNode.layoutInfo.parentKey = layoutInfo.key;
      y = layoutNode.layoutInfo.rect.maxY;
      width = Math.max(width, layoutNode.layoutInfo.rect.width);
      layoutNode.index = children.length;
      children.push(layoutNode);
    }

    rect.width = width;
    rect.height = y - this.padding;

    return {
      layoutInfo,
      children,
      validRect: layoutInfo.rect,
      node: collection.head
    };
  }

  protected buildHeaderRow(headerRow: GridNode<T>, x: number, y: number): LayoutNode {
    let rect = new Rect(x, y, 0, 0);
    let row = new LayoutInfo('headerrow', headerRow.key, rect);

    let height = 0;
    let columns: LayoutNode[] = [];
    for (let cell of getChildNodes(headerRow, this.virtualizer!.collection)) {
      let layoutNode = this.buildChild(cell, x, y, row.key);
      layoutNode.layoutInfo.parentKey = row.key;
      x = layoutNode.layoutInfo.rect.maxX;
      height = Math.max(height, layoutNode.layoutInfo.rect.height);
      layoutNode.index = columns.length;
      columns.push(layoutNode);
    }
    for (let [i, layout] of columns.entries()) {
      layout.layoutInfo.zIndex = columns.length - i + 1;
    }

    this.setChildHeights(columns, height);

    rect.height = height;
    rect.width = x - rect.x;

    return {
      layoutInfo: row,
      children: columns,
      validRect: rect,
      node: headerRow
    };
  }

  private setChildHeights(children: LayoutNode[], height: number) {
    for (let child of children) {
      if (child.layoutInfo.rect.height !== height) {
        // Need to copy the layout info before we mutate it.
        child.layoutInfo = child.layoutInfo.copy();
        child.layoutInfo.rect.height = height;
      }
    }
  }

  // used to get the column widths when rendering to the DOM
  private getRenderedColumnWidth(node: GridNode<T>) {
    let collection = this.virtualizer!.collection as TableCollection<T>;
    let colSpan = node.colSpan ?? 1;
    let colIndex = node.colIndex ?? node.index;
    let width = 0;
    for (let i = colIndex; i < colIndex + colSpan; i++) {
      let column = collection.columns[i];
      if (column?.key != null) {
        width += this.columnWidths.get(column.key) ?? 0;
      }
    }

    return width;
  }

  private getEstimatedHeight(node: GridNode<T>, width: number, height: number | null, estimatedHeight: number | null) {
    let isEstimated = false;

    // If no explicit height is available, use an estimated height.
    if (height == null) {
      // If a previous version of this layout info exists, reuse its height.
      // Mark as estimated if the size of the overall collection view changed,
      // or the content of the item changed.
      let previousLayoutNode = this.layoutNodes.get(node.key);
      if (previousLayoutNode) {
        height = previousLayoutNode.layoutInfo.rect.height;
        isEstimated = node !== previousLayoutNode.node || width !== previousLayoutNode.layoutInfo.rect.width || previousLayoutNode.layoutInfo.estimatedSize;
      } else {
        height = estimatedHeight ?? DEFAULT_ROW_HEIGHT;
        isEstimated = true;
      }
    }

    return {height, isEstimated};
  }

  protected getEstimatedRowHeight(): number {
    return this.rowHeight ?? this.estimatedRowHeight ?? DEFAULT_ROW_HEIGHT;
  }

  protected buildColumn(node: GridNode<T>, x: number, y: number): LayoutNode {
    let width = this.getRenderedColumnWidth(node);
    let {height, isEstimated} = this.getEstimatedHeight(node, width, this.headingHeight ?? this.rowHeight, this.estimatedHeadingHeight ?? this.estimatedRowHeight);
    let rect = new Rect(x, y, width, height);
    let layoutInfo = new LayoutInfo(node.type, node.key, rect);
    layoutInfo.isSticky = this.isStickyColumn(node);
    layoutInfo.zIndex = layoutInfo.isSticky ? 2 : 1;
    layoutInfo.estimatedSize = isEstimated;

    return {
      layoutInfo,
      children: [],
      validRect: layoutInfo.rect,
      node
    };
  }

  // For subclasses.
  // eslint-disable-next-line
  protected isStickyColumn(node: GridNode<T>) {
    return false;
  }

  protected buildBody(y: number): LayoutNode {
    let collection = this.virtualizer!.collection as TableCollection<T>;
    let rect = new Rect(this.padding, y, 0, 0);
    let layoutInfo = new LayoutInfo('rowgroup', collection.body.key, rect);

    let startY = y;
    let skipped = 0;
    let width = 0;
    let children: LayoutNode[] = [];
    let rowHeight = this.getEstimatedRowHeight() + this.gap;
    for (let node of getChildNodes(collection.body, collection)) {
      // Skip rows before the valid rectangle unless they are already cached.
      if (y + rowHeight < this.requestedRect.y && !this.isValid(node, y)) {
        y += rowHeight;
        skipped++;
        continue;
      }

      let layoutNode = this.buildChild(node, this.padding, y, layoutInfo.key);
      layoutNode.layoutInfo.parentKey = layoutInfo.key;
      layoutNode.index = children.length;
      y = layoutNode.layoutInfo.rect.maxY + this.gap;
      width = Math.max(width, layoutNode.layoutInfo.rect.width);
      children.push(layoutNode);

      if (y > this.requestedRect.maxY) {
        // Estimate the remaining height for rows that we don't need to layout right now.
        y += (collection.size - (skipped + children.length)) * rowHeight;
        break;
      }
    }

    if (children.length === 0) {
      y = this.virtualizer!.visibleRect.maxY;
    } else {
      y -= this.gap;
    }

    rect.width = width;
    rect.height = y - startY;

    return {
      layoutInfo,
      children,
      validRect: layoutInfo.rect.intersection(this.requestedRect),
      node: collection.body
    };
  }

  protected buildNode(node: GridNode<T>, x: number, y: number): LayoutNode {
    switch (node.type) {
      case 'headerrow':
        return this.buildHeaderRow(node, x, y);
      case 'item':
        return this.buildRow(node, x, y);
      case 'column':
      case 'placeholder':
        return this.buildColumn(node, x, y);
      case 'cell':
        return this.buildCell(node, x, y);
      case 'loader':
        return this.buildLoader(node, x, y);
      default:
        throw new Error('Unknown node type ' + node.type);
    }
  }

  protected buildRow(node: GridNode<T>, x: number, y: number): LayoutNode {
    let collection = this.virtualizer!.collection as TableCollection<T>;
    let rect = new Rect(x, y, 0, 0);
    let layoutInfo = new LayoutInfo('row', node.key, rect);

    let children: LayoutNode[] = [];
    let height = 0;
    for (let child of getChildNodes(node, collection)) {
      if (child.type === 'cell') {
        if (x > this.requestedRect.maxX) {
          // Adjust existing cached layoutInfo to ensure that it is out of view.
          // This can happen due to column resizing.
          let layoutNode = this.layoutNodes.get(child.key);
          if (layoutNode) {
            layoutNode.layoutInfo.rect.x = x;
            x += layoutNode.layoutInfo.rect.width;
          } else {
            break;
          }
        } else {
          let layoutNode = this.buildChild(child, x, y, layoutInfo.key);
          x = layoutNode.layoutInfo.rect.maxX;
          height = Math.max(height, layoutNode.layoutInfo.rect.height);
          layoutNode.index = children.length;
          children.push(layoutNode);
        }
      }
    }

    this.setChildHeights(children, height);

    rect.width = this.layoutNodes.get(collection.head?.key ?? 'header')!.layoutInfo.rect.width;
    rect.height = height;

    return {
      layoutInfo,
      children,
      validRect: rect.intersection(this.requestedRect),
      node
    };
  }

  protected buildCell(node: GridNode<T>, x: number, y: number): LayoutNode {
    let width = this.getRenderedColumnWidth(node);
    let {height, isEstimated} = this.getEstimatedHeight(node, width, this.rowHeight, this.estimatedRowHeight);
    let rect = new Rect(x, y, width, height);
    let layoutInfo = new LayoutInfo(node.type, node.key, rect);
    layoutInfo.isSticky = this.isStickyColumn(node);
    layoutInfo.zIndex = layoutInfo.isSticky ? 2 : 1;
    layoutInfo.estimatedSize = isEstimated;

    return {
      layoutInfo,
      children: [],
      validRect: rect,
      node
    };
  }

  getVisibleLayoutInfos(rect: Rect): LayoutInfo[] {
    // Adjust rect to keep number of visible rows consistent.
    // (only if height > 1 for getDropTargetFromPoint)
    if (rect.height > 1) {
      let rowHeight = this.getEstimatedRowHeight();
      rect.y = Math.floor(rect.y / rowHeight) * rowHeight;
      rect.height = Math.ceil(rect.height / rowHeight) * rowHeight;
    }

    // If layout hasn't yet been done for the requested rect, union the
    // new rect with the existing valid rect, and recompute.
    this.layoutIfNeeded(rect);

    let res: LayoutInfo[] = [];

    this.buildPersistedIndices();
    for (let node of this.rootNodes) {
      res.push(node.layoutInfo);
      this.addVisibleLayoutInfos(res, node, rect);
    }

    return res;
  }

  private addVisibleLayoutInfos(res: LayoutInfo[], node: LayoutNode, rect: Rect) {
    if (!node.children || node.children.length === 0) {
      return;
    }

    switch (node.layoutInfo.type) {
      case 'header': {
        for (let child of node.children) {
          res.push(child.layoutInfo);
          this.addVisibleLayoutInfos(res, child, rect);
        }
        break;
      }
      case 'rowgroup': {
        let firstVisibleRow = this.binarySearch(node.children, rect.topLeft, 'y');
        let lastVisibleRow = this.binarySearch(node.children, rect.bottomRight, 'y');

        // Add persisted rows before the visible rows.
        let persistedRowIndices = this.persistedIndices.get(node.layoutInfo.key);
        let persistIndex = 0;
        while (
          persistedRowIndices &&
          persistIndex < persistedRowIndices.length &&
          persistedRowIndices[persistIndex] < firstVisibleRow
        ) {
          let idx = persistedRowIndices[persistIndex];
          if (idx < node.children.length) {
            res.push(node.children[idx].layoutInfo);
            this.addVisibleLayoutInfos(res, node.children[idx], rect);
          }
          persistIndex++;
        }

        for (let i = firstVisibleRow; i <= lastVisibleRow; i++) {
          // Skip persisted rows that overlap with visible cells.
          while (persistedRowIndices && persistIndex < persistedRowIndices.length && persistedRowIndices[persistIndex] < i) {
            persistIndex++;
          }

          res.push(node.children[i].layoutInfo);
          this.addVisibleLayoutInfos(res, node.children[i], rect);
        }

        // Add persisted rows after the visible rows.
        while (persistedRowIndices && persistIndex < persistedRowIndices.length) {
          let idx = persistedRowIndices[persistIndex++];
          if (idx < node.children.length) {
            res.push(node.children[idx].layoutInfo);
            this.addVisibleLayoutInfos(res, node.children[idx], rect);
          }
        }
        break;
      }
      case 'headerrow':
      case 'row': {
        let firstVisibleCell = this.binarySearch(node.children, rect.topLeft, 'x');
        let lastVisibleCell = this.binarySearch(node.children, rect.topRight, 'x');
        let stickyIndex = 0;

        // Add persisted/sticky cells before the visible cells.
        let persistedCellIndices = this.persistedIndices.get(node.layoutInfo.key) || this.stickyColumnIndices;
        while (stickyIndex < persistedCellIndices.length && persistedCellIndices[stickyIndex] < firstVisibleCell) {
          let idx = persistedCellIndices[stickyIndex];
          if (idx < node.children.length) {
            res.push(node.children[idx].layoutInfo);
          }
          stickyIndex++;
        }

        for (let i = firstVisibleCell; i <= lastVisibleCell; i++) {
          // Skip sticky cells that overlap with visible cells.
          while (stickyIndex < persistedCellIndices.length && persistedCellIndices[stickyIndex] < i) {
            stickyIndex++;
          }

          res.push(node.children[i].layoutInfo);
        }

        // Add any remaining sticky cells after the visible cells.
        while (stickyIndex < persistedCellIndices.length) {
          let idx = persistedCellIndices[stickyIndex++];
          if (idx < node.children.length) {
            res.push(node.children[idx].layoutInfo);
          }
        }
        break;
      }
      default:
        throw new Error('Unknown node type ' + node.layoutInfo.type);
    }
  }

  private binarySearch(items: LayoutNode[], point: Point, axis: 'x' | 'y') {
    let low = 0;
    let high = items.length - 1;
    while (low <= high) {
      let mid = (low + high) >> 1;
      let item = items[mid];

      if ((axis === 'x' && item.layoutInfo.rect.maxX <= point.x) || (axis === 'y' && item.layoutInfo.rect.maxY <= point.y)) {
        low = mid + 1;
      } else if ((axis === 'x' && item.layoutInfo.rect.x > point.x) || (axis === 'y' && item.layoutInfo.rect.y > point.y)) {
        high = mid - 1;
      } else {
        return mid;
      }
    }

    return Math.max(0, Math.min(items.length - 1, low));
  }

  private buildPersistedIndices() {
    if (this.virtualizer!.persistedKeys === this.lastPersistedKeys) {
      return;
    }

    this.lastPersistedKeys = this.virtualizer!.persistedKeys;
    this.persistedIndices.clear();

    // Build a map of parentKey => indices of children to persist.
    for (let key of this.virtualizer!.persistedKeys) {
      let layoutInfo = this.layoutNodes.get(key)?.layoutInfo;

      // Walk up ancestors so parents are also persisted if children are.
      while (layoutInfo && layoutInfo.parentKey) {
        let collectionNode = this.virtualizer!.collection.getItem(layoutInfo.key);
        let indices = this.persistedIndices.get(layoutInfo.parentKey);
        if (!indices) {
          // stickyColumnIndices are always persisted along with any cells from persistedKeys.
          indices = collectionNode?.type === 'cell' || collectionNode?.type === 'column' ? [...this.stickyColumnIndices] : [];
          this.persistedIndices.set(layoutInfo.parentKey, indices);
        }

        let index = this.layoutNodes.get(layoutInfo.key)?.index;
        if (index != null && !indices.includes(index)) {
          indices.push(index);
        }

        layoutInfo = this.layoutNodes.get(layoutInfo.parentKey)?.layoutInfo;
      }
    }

    for (let indices of this.persistedIndices.values()) {
      indices.sort((a, b) => a - b);
    }
  }

  getDropTargetFromPoint(x: number, y: number, isValidDropTarget: (target: DropTarget) => boolean): DropTarget | null {
    x += this.virtualizer!.visibleRect.x;
    y += this.virtualizer!.visibleRect.y;

    // Custom variation of this.virtualizer.keyAtPoint that ignores body
    let key: Key | null = null;
    let point = new Point(x, y);
    let rectAtPoint = new Rect(point.x, point.y, 1, 1);
    let layoutInfos = this.virtualizer!.layout.getVisibleLayoutInfos(rectAtPoint).filter(info => info.type === 'row');

    // Layout may return multiple layout infos in the case of
    // persisted keys, so find the first one that actually intersects.
    for (let layoutInfo of layoutInfos) {
      if (layoutInfo.rect.intersects(rectAtPoint)) {
        key = layoutInfo.key;
      }
    }

    if (key == null || this.virtualizer!.collection.size === 0) {
      return {type: 'root'};
    }

    let layoutInfo = this.getLayoutInfo(key);
    if (!layoutInfo) {
      return null;
    }

    let rect = layoutInfo.rect;
    let target: DropTarget = {
      type: 'item',
      key: layoutInfo.key,
      dropPosition: 'on'
    };

    // If dropping on the item isn't accepted, try the target before or after depending on the y position.
    // Otherwise, if dropping on the item is accepted, still try the before/after positions if within 10px
    // of the top or bottom of the item.
    if (!isValidDropTarget(target)) {
      if (y <= rect.y + rect.height / 2 && isValidDropTarget({...target, dropPosition: 'before'})) {
        target.dropPosition = 'before';
      } else if (isValidDropTarget({...target, dropPosition: 'after'})) {
        target.dropPosition = 'after';
      }
    } else if (y <= rect.y + 10 && isValidDropTarget({...target, dropPosition: 'before'})) {
      target.dropPosition = 'before';
    } else if (y >= rect.maxY - 10 && isValidDropTarget({...target, dropPosition: 'after'})) {
      target.dropPosition = 'after';
    }

    return target;
  }

  getDropTargetLayoutInfo(target: ItemDropTarget): LayoutInfo {
    let layoutInfo = super.getDropTargetLayoutInfo(target);
    layoutInfo.parentKey = (this.virtualizer!.collection as TableCollection<T>).body.key;
    return layoutInfo;
  }
}
