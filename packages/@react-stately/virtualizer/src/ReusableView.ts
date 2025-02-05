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

import {Key} from '@react-types/shared';
import {LayoutInfo} from './LayoutInfo';
import {Virtualizer} from './Virtualizer';

let KEY = 0;

/**
 * `Virtualizer` creates instances of the `ReusableView` class to
 * represent views currently being displayed.
 */
export class ReusableView<T extends object, V> {
  /** The Virtualizer this view is a part of. */
  virtualizer: Virtualizer<T, V>;

  /** The LayoutInfo this view is currently representing. */
  layoutInfo: LayoutInfo | null;

  /** The content currently being displayed by this view, set by the virtualizer. */
  content: T | null;

  rendered: V | null;

  viewType: string;
  key: Key;

  children: Set<ChildView<T, V>>;
  reusableViews: Map<string, ChildView<T, V>[]>;

  constructor(virtualizer: Virtualizer<T, V>, viewType: string) {
    this.virtualizer = virtualizer;
    this.key = ++KEY;
    this.viewType = viewType;
    this.children = new Set();
    this.reusableViews = new Map();
    this.layoutInfo = null;
    this.content = null;
    this.rendered = null;
  }

  /**
   * Prepares the view for reuse. Called just before the view is removed from the DOM.
   */
  prepareForReuse() {
    this.content = null;
    this.rendered = null;
    this.layoutInfo = null;
  }

  getReusableView(reuseType: string) {
    // Reusable view queue should be FIFO so that DOM order remains consistent during scrolling.
    // For example, cells within a row should remain in the same order even if the row changes contents.
    // The cells within a row are removed from their parent in order. If the row is reused, the cells
    // should be reused in the new row in the same order they were before.
    let reusable = this.reusableViews.get(reuseType);
    let view = reusable && reusable.length > 0
      ? reusable.shift()!
      : new ChildView<T, V>(this.virtualizer, this, reuseType);

    return view;
  }

  reuseChild(child: ChildView<T, V>) {
    child.prepareForReuse();
    let reusable = this.reusableViews.get(child.viewType);
    if (!reusable) {
      reusable = [];
      this.reusableViews.set(child.viewType, reusable);
    }
    reusable.push(child);
  }
}

export class RootView<T extends object, V> extends ReusableView<T, V> {
  constructor(virtualizer: Virtualizer<T, V>) {
    super(virtualizer, 'root');
  }
}

export class ChildView<T extends object, V> extends ReusableView<T, V> {
  parent: ReusableView<T, V>;

  constructor(virtualizer: Virtualizer<T, V>, parent: ReusableView<T, V>, viewType: string) {
    super(virtualizer, viewType);
    this.parent = parent;
  }
}
