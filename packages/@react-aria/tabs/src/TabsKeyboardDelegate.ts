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

import {Collection, Direction, Key, KeyboardDelegate, Node, Orientation} from '@react-types/shared';

export class TabsKeyboardDelegate<T> implements KeyboardDelegate {
  private collection: Collection<Node<T>>;
  private flipDirection: boolean;
  private disabledKeys: Set<Key>;
  private tabDirection: boolean;

  protected isTab(node: Node<T>) {
    return node.type === 'item';
  }

  constructor(collection: Collection<Node<T>>, direction: Direction, orientation: Orientation, disabledKeys: Set<Key> = new Set()) {
    this.collection = collection;
    this.flipDirection = direction === 'rtl' && orientation === 'horizontal';
    this.disabledKeys = disabledKeys;
    this.tabDirection = orientation === 'horizontal';
  }

  protected findPreviousKey(fromKey?: Key, pred?: (item: Node<T>) => boolean) {
    let key = fromKey != null
      ? this.collection.getKeyBefore(fromKey)
      : this.collection.getLastKey();

    while (key != null) {
      let item = this.collection.getItem(key)!;
      if (!this.isDisabled(item) && (!pred || pred(item))) {
        return key;
      }

      key = this.collection.getKeyBefore(key);
    }
    key = this.findPreviousKey(undefined, pred);
    return key;
  }

  protected findNextKey(fromKey?: Key, pred?: (item: Node<T>) => boolean) {
    let key = fromKey != null
      ? this.collection.getKeyAfter(fromKey)
      : this.collection.getFirstKey();

    while (key != null) {
      let item = this.collection.getItem(key)!;
      if (!this.isDisabled(item) && (!pred || pred(item))) {
        return key;
      }

      key = this.collection.getKeyAfter(key);
    }
    key = this.findNextKey(undefined, pred);
    return key;
  }

  private isDisabled(item: Node<unknown>) {
    return (item.props?.isDisabled || this.disabledKeys.has(item.key));
  }

  getKeyLeftOf(key: Key) {
    if (this.flipDirection) {
      return this.findNextKey(key, (item => item.type === 'item'));
    }
    return this.findPreviousKey(key, (item => item.type === 'item'));
  }

  getKeyRightOf(key: Key) {
    if (this.flipDirection) {
      return this.findPreviousKey(key, (item => item.type === 'item'));
    }
    return this.findNextKey(key, (item => item.type === 'item'));
  }

  getFirstKey() {
    let key = this.collection.getFirstKey();
    if (key != null) {
      let item = this.collection.getItem(key)!;
      if (this.isDisabled(item) || item.type !== 'item') {
        key = this.findNextKey(key);
      }
    }
    return key;
  }

  getLastKey() {
    let key = this.collection.getLastKey();
    if (key != null) {
      let item = this.collection.getItem(key)!;
      if (this.isDisabled(item) || item.type !== 'item') {
        key = this.findPreviousKey(key);
      }
    }
    return key;
  }

  getKeyAbove(key: Key) {
    if (this.tabDirection) {
      return null;
    }
    return this.findPreviousKey(key, (item => item.type === 'item'));
  }

  getKeyBelow(key: Key) {
    if (this.tabDirection) {
      return null;
    }
    return this.findNextKey(key, (item => item.type === 'item'));
  }

  getNextKey(key) {
    do {
      key = this.collection.getKeyAfter(key);
      if (key == null) {
        key = this.collection.getFirstKey();
      }
    } while (this.isDisabled(key));
    return key;
  }

  getPreviousKey(key) {
    do {
      key = this.collection.getKeyBefore(key);
      if (key == null) {
        key = this.collection.getLastKey();
      }
    } while (this.isDisabled(key));
    return key;
  }
}
