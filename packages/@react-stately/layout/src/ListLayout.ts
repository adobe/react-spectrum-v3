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

import {Collection, DropTarget, DropTargetDelegate, ItemDropTarget, Key, Node} from '@react-types/shared';
import {getChildNodes} from '@react-stately/collections';
import {InvalidationContext, Layout, LayoutInfo, Point, Rect, Size} from '@react-stately/virtualizer';

export interface ListLayoutOptions {
  /**
   * The fixed height of a row in px.
   * @default 48
   */
  rowHeight?: number,
  /** The estimated height of a row, when row heights are variable. */
  estimatedRowHeight?: number,
  /**
   * The fixed height of a section header in px.
   * @default 48
   */
  headingHeight?: number,
  /** The estimated height of a section header, when the height is variable. */
  estimatedHeadingHeight?: number,
  /** 
   * The fixed height of a loader element in px. This loader is specifically for
   * "load more" elements rendered when loading more rows at the root level or inside nested row/sections.
   * @default 48
   */
  loaderHeight?: number,
  /**
   * The thickness of the drop indicator.
   * @default 2
   */
  dropIndicatorThickness?: number,
  /**
   * The gap between items.
   * @default 0
   */
  gap?: number,
  /**
   * The padding around the list.
   * @default 0
   */
  padding?: number
}

// A wrapper around LayoutInfo that supports hierarchy
export interface LayoutNode {
  node?: Node<unknown>,
  layoutInfo: LayoutInfo,
  children?: LayoutNode[],
  validRect: Rect,
  index?: number
}

const DEFAULT_HEIGHT = 48;

/**
 * ListLayout is a virtualizer Layout implementation
 * that arranges its items in a vertical stack. It supports both fixed
 * and variable height items.
 */
export class ListLayout<T, O = any> extends Layout<Node<T>, O> implements DropTargetDelegate {
  protected rowHeight: number | null;
  protected estimatedRowHeight: number | null;
  protected headingHeight: number | null;
  protected estimatedHeadingHeight: number | null;
  protected loaderHeight: number | null;
  protected dropIndicatorThickness: number;
  protected gap: number;
  protected padding: number;
  protected layoutNodes: Map<Key, LayoutNode>;
  protected contentSize: Size;
  protected lastCollection: Collection<Node<T>> | null;
  private lastWidth: number;
  protected rootNodes: LayoutNode[];
  private invalidateEverything: boolean;
  /** The rectangle containing currently valid layout infos. */
  protected validRect: Rect;
  /** The rectangle of requested layout infos so far. */
  protected requestedRect: Rect;

  /**
   * Creates a new ListLayout with options. See the list of properties below for a description
   * of the options that can be provided.
   */
  constructor(options: ListLayoutOptions = {}) {
    super();
    this.rowHeight = options.rowHeight ?? null;
    this.estimatedRowHeight = options.estimatedRowHeight ?? null;
    this.headingHeight = options.headingHeight ?? null;
    this.estimatedHeadingHeight = options.estimatedHeadingHeight ?? null;
    this.loaderHeight = options.loaderHeight ?? null;
    this.dropIndicatorThickness = options.dropIndicatorThickness || 2;
    this.gap = options.gap || 0;
    this.padding = options.padding || 0;
    this.layoutNodes = new Map();
    this.rootNodes = [];
    this.lastWidth = 0;
    this.lastCollection = null;
    this.invalidateEverything = false;
    this.validRect = new Rect();
    this.requestedRect = new Rect();
    this.contentSize = new Size();
  }

  // Backward compatibility for subclassing.
  protected get collection(): Collection<Node<T>> {
    return this.virtualizer!.collection;
  }

  getLayoutInfo(key: Key): LayoutInfo | null {
    this.ensureLayoutInfo(key);
    return this.layoutNodes.get(key)?.layoutInfo || null;
  }

  getVisibleLayoutInfos(rect: Rect): LayoutInfo[] {
    // Adjust rect to keep number of visible rows consistent.
    // (only if height > 1 for getDropTargetFromPoint)
    if (rect.height > 1) {
      let rowHeight = (this.rowHeight ?? this.estimatedRowHeight ?? DEFAULT_HEIGHT) + this.gap;
      rect.y = Math.floor(rect.y / rowHeight) * rowHeight;
      rect.height = Math.ceil(rect.height / rowHeight) * rowHeight;
    }

    // If layout hasn't yet been done for the requested rect, union the
    // new rect with the existing valid rect, and recompute.
    this.layoutIfNeeded(rect);

    let res: LayoutInfo[] = [];

    let addNodes = (nodes: LayoutNode[]) => {
      for (let node of nodes) {
        if (this.isVisible(node, rect)) {
          res.push(node.layoutInfo);

          if (node.children) {
            addNodes(node.children);
          }
        }
      }
    };

    addNodes(this.rootNodes);
    return res;
  }

  protected layoutIfNeeded(rect: Rect): void {
    if (!this.lastCollection) {
      return;
    }

    if (!this.requestedRect.containsRect(rect)) {
      this.requestedRect = this.requestedRect.union(rect);
      this.rootNodes = this.buildCollection();
    }

    // Ensure all of the persisted keys are available.
    for (let key of this.virtualizer!.persistedKeys) {
      if (this.ensureLayoutInfo(key)) {
        return;
      }
    }
  }

  private ensureLayoutInfo(key: Key) {
    // If the layout info wasn't found, it might be outside the bounds of the area that we've
    // computed layout for so far. This can happen when accessing a random key, e.g pressing Home/End.
    // Compute the full layout and try again.
    if (!this.layoutNodes.has(key) && this.requestedRect.area < this.contentSize.area && this.lastCollection) {
      this.requestedRect = new Rect(0, 0, Infinity, Infinity);
      this.rootNodes = this.buildCollection();
      this.requestedRect = new Rect(0, 0, this.contentSize.width, this.contentSize.height);
      return true;
    }

    return false;
  }

  protected isVisible(node: LayoutNode, rect: Rect): boolean {
    return node.layoutInfo.rect.intersects(rect) || node.layoutInfo.isSticky || node.layoutInfo.type === 'header' || this.virtualizer!.isPersistedKey(node.layoutInfo.key);
  }

  protected shouldInvalidateEverything(invalidationContext: InvalidationContext<O>): boolean {
    // Invalidate cache if the size of the collection changed.
    // In this case, we need to recalculate the entire layout.
    return invalidationContext.sizeChanged || false;
  }

  update(invalidationContext: InvalidationContext<O>): void {
    let collection = this.virtualizer!.collection;

    // Reset valid rect if we will have to invalidate everything.
    // Otherwise we can reuse cached layout infos outside the current visible rect.
    this.invalidateEverything = this.shouldInvalidateEverything(invalidationContext);
    if (this.invalidateEverything) {
      this.requestedRect = this.virtualizer!.visibleRect.copy();
      this.layoutNodes.clear();
    }

    this.rootNodes = this.buildCollection();

    // Remove deleted layout nodes
    if (this.lastCollection && collection !== this.lastCollection) {
      for (let key of this.lastCollection.getKeys()) {
        if (!collection.getItem(key)) {
          let layoutNode = this.layoutNodes.get(key);
          if (layoutNode) {
            this.layoutNodes.delete(key);
          }
        }
      }
    }

    this.lastWidth = this.virtualizer!.visibleRect.width;
    this.lastCollection = collection;
    this.invalidateEverything = false;
    this.validRect = this.requestedRect.copy();
  }

  protected buildCollection(y = this.padding): LayoutNode[] {
    let collection = this.virtualizer!.collection;
    let skipped = 0;
    let nodes: LayoutNode[] = [];
    for (let node of collection) {
      let rowHeight = (this.rowHeight ?? this.estimatedRowHeight ?? DEFAULT_HEIGHT) + this.gap;

      // Skip rows before the valid rectangle unless they are already cached.
      if (node.type === 'item' && y + rowHeight < this.requestedRect.y && !this.isValid(node, y)) {
        y += rowHeight;
        skipped++;
        continue;
      }

      let layoutNode = this.buildChild(node, this.padding, y, null);
      y = layoutNode.layoutInfo.rect.maxY + this.gap;
      nodes.push(layoutNode);

      if (node.type === 'item' && y > this.requestedRect.maxY) {
        y += (collection.size - (nodes.length + skipped)) * rowHeight;
        break;
      }
    }

    y -= this.gap;
    y += this.padding;
    this.contentSize = new Size(this.virtualizer!.visibleRect.width, y);
    return nodes;
  }

  protected isValid(node: Node<T>, y: number): boolean {
    let cached = this.layoutNodes.get(node.key);
    return (
      !this.invalidateEverything &&
      !!cached &&
      cached.node === node &&
      y === cached.layoutInfo.rect.y &&
      cached.layoutInfo.rect.intersects(this.validRect) &&
      cached.validRect.containsRect(cached.layoutInfo.rect.intersection(this.requestedRect))
    );
  }

  protected buildChild(node: Node<T>, x: number, y: number, parentKey: Key | null): LayoutNode {
    if (this.isValid(node, y)) {
      return this.layoutNodes.get(node.key)!;
    }

    let layoutNode = this.buildNode(node, x, y);

    layoutNode.layoutInfo.parentKey = parentKey ?? null;
    this.layoutNodes.set(node.key, layoutNode);
    return layoutNode;
  }

  protected buildNode(node: Node<T>, x: number, y: number): LayoutNode {
    switch (node.type) {
      case 'section':
        return this.buildSection(node, x, y);
      case 'item':
        return this.buildItem(node, x, y);
      case 'header':
        return this.buildSectionHeader(node, x, y);
      case 'loader':
        return this.buildLoader(node, x, y);
      default:
        throw new Error('Unsupported node type: ' + node.type);
    }
  }

  protected buildLoader(node: Node<T>, x: number, y: number): LayoutNode {
    let rect = new Rect(x, y, this.padding, 0);
    let layoutInfo = new LayoutInfo('loader', node.key, rect);
    rect.width = this.virtualizer!.contentSize.width - this.padding - x;
    rect.height = this.loaderHeight || this.rowHeight || this.estimatedRowHeight || DEFAULT_HEIGHT;

    return {
      layoutInfo,
      validRect: rect.intersection(this.requestedRect)
    };
  }

  protected buildSection(node: Node<T>, x: number, y: number): LayoutNode {
    let collection = this.virtualizer!.collection;
    let width = this.virtualizer!.visibleRect.width - this.padding;
    let rect = new Rect(x, y, width - x, 0);
    let layoutInfo = new LayoutInfo(node.type, node.key, rect);

    let startY = y;
    let skipped = 0;
    let children: LayoutNode[] = [];
    for (let child of getChildNodes(node, collection)) {
      let rowHeight = (this.rowHeight ?? this.estimatedRowHeight ?? DEFAULT_HEIGHT) + this.gap;

      // Skip rows before the valid rectangle unless they are already cached.
      if (y + rowHeight < this.requestedRect.y && !this.isValid(node, y)) {
        y += rowHeight;
        skipped++;
        continue;
      }

      let layoutNode = this.buildChild(child, x, y, layoutInfo.key);
      y = layoutNode.layoutInfo.rect.maxY + this.gap;
      children.push(layoutNode);

      if (y > this.requestedRect.maxY) {
        // Estimate the remaining height for rows that we don't need to layout right now.
        y += ([...getChildNodes(node, collection)].length - (children.length + skipped)) * rowHeight;
        break;
      }
    }

    y -= this.gap;
    rect.height = y - startY;

    return {
      layoutInfo,
      children,
      validRect: layoutInfo.rect.intersection(this.requestedRect),
      node
    };
  }

  protected buildSectionHeader(node: Node<T>, x: number, y: number): LayoutNode {
    let width = this.virtualizer!.visibleRect.width - this.padding;
    let rectHeight = this.headingHeight;
    let isEstimated = false;

    // If no explicit height is available, use an estimated height.
    if (rectHeight == null) {
      // If a previous version of this layout info exists, reuse its height.
      // Mark as estimated if the size of the overall virtualizer changed,
      // or the content of the item changed.
      let previousLayoutNode = this.layoutNodes.get(node.key);
      let previousLayoutInfo = previousLayoutNode?.layoutInfo;
      if (previousLayoutInfo) {
        let curNode = this.virtualizer!.collection.getItem(node.key);
        let lastNode = this.lastCollection ? this.lastCollection.getItem(node.key) : null;
        rectHeight = previousLayoutInfo.rect.height;
        isEstimated = width !== this.lastWidth || curNode !== lastNode || previousLayoutInfo.estimatedSize;
      } else {
        rectHeight = (node.rendered ? this.estimatedHeadingHeight : 0);
        isEstimated = true;
      }
    }

    if (rectHeight == null) {
      rectHeight = DEFAULT_HEIGHT;
    }

    let headerRect = new Rect(x, y, width - x, rectHeight);
    let header = new LayoutInfo('header', node.key, headerRect);
    header.estimatedSize = isEstimated;
    return {
      layoutInfo: header,
      children: [],
      validRect: header.rect.intersection(this.requestedRect),
      node
    };
  }

  protected buildItem(node: Node<T>, x: number, y: number): LayoutNode {
    let width = this.virtualizer!.visibleRect.width - this.padding;
    let rectHeight = this.rowHeight;
    let isEstimated = false;

    // If no explicit height is available, use an estimated height.
    if (rectHeight == null) {
      // If a previous version of this layout info exists, reuse its height.
      // Mark as estimated if the size of the overall virtualizer changed,
      // or the content of the item changed.
      let previousLayoutNode = this.layoutNodes.get(node.key);
      if (previousLayoutNode) {
        rectHeight = previousLayoutNode.layoutInfo.rect.height;
        isEstimated = width !== this.lastWidth || node !== previousLayoutNode.node || previousLayoutNode.layoutInfo.estimatedSize;
      } else {
        rectHeight = this.estimatedRowHeight;
        isEstimated = true;
      }
    }

    if (rectHeight == null) {
      rectHeight = DEFAULT_HEIGHT;
    }

    let rect = new Rect(x, y, width - x, rectHeight);
    let layoutInfo = new LayoutInfo(node.type, node.key, rect);
    layoutInfo.estimatedSize = isEstimated;
    return {
      layoutInfo,
      children: [],
      validRect: layoutInfo.rect,
      node
    };
  }

  updateItemSize(key: Key, size: Size): boolean {
    let layoutNode = this.layoutNodes.get(key);
    // If no layoutInfo, item has been deleted/removed.
    if (!layoutNode) {
      return false;
    }

    let collection = this.virtualizer!.collection;
    let layoutInfo = layoutNode.layoutInfo;
    layoutInfo.estimatedSize = false;
    if (layoutInfo.rect.height !== size.height) {
      // Copy layout info rather than mutating so that later caches are invalidated.
      let newLayoutInfo = layoutInfo.copy();
      newLayoutInfo.rect.height = size.height;
      layoutNode.layoutInfo = newLayoutInfo;

      // Items after this layoutInfo will need to be repositioned to account for the new height.
      // Adjust the validRect so that only items above remain valid.
      this.validRect.height = Math.min(this.validRect.height, layoutInfo.rect.y - this.validRect.y);

      // The requestedRect also needs to be adjusted to account for the height difference.
      this.requestedRect.height += newLayoutInfo.rect.height - layoutInfo.rect.height;

      // Invalidate layout for this layout node and all parents
      this.updateLayoutNode(key, layoutInfo, newLayoutInfo);

      let node = layoutInfo.parentKey != null ? collection.getItem(layoutInfo.parentKey) : null;
      while (node) {
        this.updateLayoutNode(node.key, layoutInfo, newLayoutInfo);
        node = node.parentKey != null ? collection.getItem(node.parentKey) : null;
      }

      return true;
    }

    return false;
  }

  private updateLayoutNode(key: Key, oldLayoutInfo: LayoutInfo, newLayoutInfo: LayoutInfo) {
    let n = this.layoutNodes.get(key);
    if (n) {
      // Invalidate by intersecting the validRect of this node with the overall validRect.
      n.validRect = n.validRect.intersection(this.validRect);

      // Replace layout info in LayoutNode
      if (n.layoutInfo === oldLayoutInfo) {
        n.layoutInfo = newLayoutInfo;
      }
    }
  }

  getContentSize(): Size {
    return this.contentSize;
  }

  getDropTargetFromPoint(x: number, y: number, isValidDropTarget: (target: DropTarget) => boolean): DropTarget | null {
    x += this.virtualizer!.visibleRect.x;
    y += this.virtualizer!.visibleRect.y;

    let key = this.virtualizer!.keyAtPoint(new Point(x, y));
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
    let layoutInfo = this.getLayoutInfo(target.key)!;
    let rect: Rect;
    if (target.dropPosition === 'before') {
      rect = new Rect(layoutInfo.rect.x, layoutInfo.rect.y - this.dropIndicatorThickness / 2, layoutInfo.rect.width, this.dropIndicatorThickness);
    } else if (target.dropPosition === 'after') {
      rect = new Rect(layoutInfo.rect.x, layoutInfo.rect.maxY - this.dropIndicatorThickness / 2, layoutInfo.rect.width, this.dropIndicatorThickness);
    } else {
      rect = layoutInfo.rect;
    }

    return new LayoutInfo('dropIndicator', target.key + ':' + target.dropPosition, rect);
  }
}
