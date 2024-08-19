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

import {Collection, Key, Node} from '@react-types/shared';

export class TreeCollection<T> implements Collection<Node<T>> {
  private keyMap: Map<Key, Node<T>> = new Map();
  private iterable: Iterable<Node<T>>;
  private firstKey: Key;
  private lastKey: Key;

  constructor(nodes: Iterable<Node<T>>, {expandedKeys}: {expandedKeys?: Set<Key>} = {}) {
    this.iterable = nodes;
    expandedKeys = expandedKeys || new Set();

    let visit = (node: Node<T>) => {
      this.keyMap.set(node.key, node);

      if (node.childNodes && (node.type === 'section' || expandedKeys.has(node.key))) {
        for (let child of node.childNodes) {
          visit(child);
        }
      }
    };

    for (let node of nodes) {
      visit(node);
    }

    let last: Node<T>;
    let index = 0;
    for (let [key, node] of this.keyMap) {
      if (last) {
        last.nextKey = key;
        node.prevKey = last.key;
      } else {
        this.firstKey = key;
        node.prevKey = undefined;
      }

      if (node.type === 'item') {
        node.index = index++;
      }

      last = node;

      // Set nextKey as undefined since this might be the last node
      // If it isn't the last node, last.nextKey will properly set at start of new loop
      last.nextKey = undefined;
    }

    this.lastKey = last?.key;
  }

  *[Symbol.iterator]() {
    yield* this.iterable;
  }

  get size() {
    return this.keyMap.size;
  }

  getKeys() {
    return this.keyMap.keys();
  }

  getKeyBefore(key: Key) {
    let node = this.keyMap.get(key);
    return node?.prevKey ?? null;
  }

  getKeyAfter(key: Key) {
    let node = this.keyMap.get(key);
    return node?.nextKey ?? null;
  }

  getFirstKey() {
    return this.firstKey;
  }

  getLastKey() {
    return this.lastKey;
  }

  getItem(key: Key) {
    return this.keyMap.get(key);
  }

  at(idx: number) {
    const keys = [...this.getKeys()];
    return this.getItem(keys[idx]);
  }
}
