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

import {InvalidationContext} from './types';
import {ItemDropTarget, Key, LayoutDelegate, Node} from '@react-types/shared';
import {LayoutInfo} from './LayoutInfo';
import {Rect} from './Rect';
import {Size} from './Size';
import {Virtualizer} from './Virtualizer';

/**
 * Virtualizer supports arbitrary layout objects, which compute what items are visible, and how
 * to position and style them. However, layouts do not render items directly. Instead,
 * layouts produce lightweight LayoutInfo objects which describe various properties of an item,
 * such as its position and size. The Virtualizer is then responsible for creating the actual
 * views as needed, based on this layout information.
 *
 * Every layout extends from the Layout abstract base class. Layouts must implement the `getVisibleLayoutInfos`,
 * `getLayoutInfo`, and `getContentSize` methods. All other methods can be optionally overridden to implement custom behavior.
 */
export abstract class Layout<T extends object = Node<any>, O = any> implements LayoutDelegate {
  /** The Virtualizer the layout is currently attached to. */
  virtualizer: Virtualizer<T, any> | null = null;

  /**
   * Returns an array of `LayoutInfo` objects which are inside the given rectangle.
   * Should be implemented by subclasses.
   * @param rect The rectangle that should contain the returned LayoutInfo objects.
   */
  abstract getVisibleLayoutInfos(rect: Rect): LayoutInfo[];

  /**
   * Returns a `LayoutInfo` for the given key.
   * Should be implemented by subclasses.
   * @param key The key of the LayoutInfo to retrieve.
   */
  abstract getLayoutInfo(key: Key): LayoutInfo | null;

  /**
   * Returns size of the content. By default, it returns virtualizer's size.
   */
  abstract getContentSize(): Size;  

  /**
   * Returns whether the layout should invalidate in response to
   * visible rectangle changes. By default, it only invalidates
   * when the virtualizer's size changes. Return true always
   * to make the layout invalidate while scrolling (e.g. sticky headers).
   */
  shouldInvalidate(newRect: Rect, oldRect: Rect): boolean {
    // By default, invalidate when the size changes
    return newRect.width !== oldRect.width
        || newRect.height !== oldRect.height;
  }

  /**
   * This method allows the layout to perform any pre-computation
   * it needs to in order to prepare LayoutInfos for retrieval.
   * Called by the virtualizer before `getVisibleLayoutInfos`
   * or `getLayoutInfo` are called.
   */
  update(invalidationContext: InvalidationContext<O>): void {} // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
   * Updates the size of the given item.
   */
  updateItemSize?(key: Key, size: Size): boolean;

  /**
   * Returns a `LayoutInfo` for the given drop target.
   */
  getDropTargetLayoutInfo?(target: ItemDropTarget): LayoutInfo;

  /** @private */
  getItemRect(key: Key): Rect | null {
    return this.getLayoutInfo(key)?.rect ?? null;
  }

  /** @private */
  getVisibleRect(): Rect {
    return this.virtualizer!.visibleRect;
  }
}
