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
import {useState} from 'react';

export interface TreeOptions<T extends object> {
  /** Initial root items in the tree. */
  initialItems?: T[],
  /** The keys for the initially selected items. */
  initialSelectedKeys?: Iterable<Key>,
  /** A function that returns a unique key for an item object. */
  getKey?: (item: T) => Key,
  /** A function that returns the children for an item object. */
  getChildren?: (item: T) => T[]
}

interface TreeNode<T extends object> {
  /** A unique key for the tree node. */
  key: Key,
  /** The key of the parent node. */
  parentKey?: Key | null,
  /** The value object for the tree node. */
  value: T,
  /** Children of the tree node. */
  children: TreeNode<T>[] | null
}

export interface TreeData<T extends object> {
  /** The root nodes in the tree. */
  items: TreeNode<T>[],

  /** The keys of the currently selected items in the tree. */
  selectedKeys: Set<Key>,

  /** Sets the selected keys. */
  setSelectedKeys(keys: Set<Key>): void,

  /**
   * Gets a node from the tree by key.
   * @param key - The key of the item to retrieve.
   */
  getItem(key: Key): TreeNode<T> | undefined,

  getDescendantKeys(node?: TreeNode<T>): Key[],
  /**
   * Inserts an item into a parent node as a child.
   * @param parentKey - The key of the parent item to insert into. `null` for the root.
   * @param index - The index within the parent to insert into.
   * @param value - The value to insert.
   */
  insert(parentKey: Key | null, index: number, ...values: T[]): void,

  /**
   * Inserts items into the list before the item at the given key.
   * @param key - The key of the item to insert before.
   * @param values - The values to insert.
   */
  insertBefore(key: Key, ...values: T[]): void,

  /**
   * Inserts items into the list after the item at the given key.
   * @param key - The key of the item to insert after.
   * @param values - The values to insert.
   */
  insertAfter(key: Key, ...values: T[]): void,

  /**
   * Appends an item into a parent node as a child.
   * @param parentKey - The key of the parent item to insert into. `null` for the root.
   * @param value - The value to insert.
   */
  append(parentKey: Key | null, ...values: T[]): void,

  /**
   * Prepends an item into a parent node as a child.
   * @param parentKey - The key of the parent item to insert into. `null` for the root.
   * @param value - The value to insert.
   */
  prepend(parentKey: Key | null, ...value: T[]): void,

  /**
   * Removes an item from the tree by its key.
   * @param key - The key of the item to remove.
   */
  remove(...keys: Key[]): void,

  /**
   * Removes all items from the tree that are currently
   * in the set of selected items.
   */
  removeSelectedItems(): void,

  /**
   * Moves an item within the tree.
   * @param key - The key of the item to move.
   * @param toParentKey - The key of the new parent to insert into. `null` for the root.
   * @param index - The index within the new parent to insert at.
   */
  move(key: Key, toParentKey: Key | null, index: number): void,

  /**
   * Moves an item before a node within the tree.
   * @param key - The key of the item to move.
   * @param toParentKey - The key of the new parent to insert into. `null` for the root.
   * @param index - The index within the new parent to insert before.
   */
  moveBefore(key: Key, toParentKey: Key | null, index: number): void,

  /**
   * Moves an item after a node within the tree.
   * @param key - The key of the item to move.
   * @param toParentKey - The key of the new parent to insert into. `null` for the root.
   * @param index - The index within the new parent to insert after.
   */
  moveAfter(key: Key, toParentKey: Key | null, index: number): void,

  /**
   * Updates an item in the tree.
   * @param key - The key of the item to update.
   * @param newValue - The new value for the item.
   */
  update(key: Key, newValue: T): void
}

/**
 * Manages state for an immutable tree data structure, and provides convenience methods to
 * update the data over time.
 */
export function useTreeData<T extends object>(options: TreeOptions<T>): TreeData<T> {
  let {
    initialItems = [],
    initialSelectedKeys,
    getKey = (item: any) => item.id ?? item.key,
    getChildren = (item: any) => item.children
  } = options;

  // We only want to compute this on initial render.
  let [tree, setItems] = useState<{items: TreeNode<T>[], nodeMap: Map<Key, TreeNode<T>>}>(() => buildTree(initialItems, new Map()));
  let {items, nodeMap} = tree;

  let [selectedKeys, setSelectedKeys] = useState(new Set<Key>(initialSelectedKeys || []));

  function buildTree(initialItems: T[] | null = [], map: Map<Key, TreeNode<T>>, parentKey?: Key | null) {
    if (initialItems == null) {
      initialItems = [];
    }
    return {
      items: initialItems.map(item => {
        let node: TreeNode<T> = {
          key: getKey(item),
          parentKey: parentKey,
          value: item,
          children: null
        };

        node.children = buildTree(getChildren(item), map, node.key).items;
        map.set(node.key, node);
        return node;
      }),
      nodeMap: map
    };
  }

  function updateTree(items: TreeNode<T>[], key: Key, update: (node: TreeNode<T>) => TreeNode<T> | null, originalMap: Map<Key, TreeNode<T>>) {
    let node = originalMap.get(key);
    if (!node) {
      return {items, nodeMap: originalMap};
    }
    let map = new Map<Key, TreeNode<T>>(originalMap);

    // Create a new node. If null, then delete the node, otherwise replace.
    let newNode = update(node);
    if (newNode == null) {
      deleteNode(node, map);
    } else {
      addNode(newNode, map);
    }

    // Walk up the tree and update each parent to refer to the new children.
    while (node && node.parentKey) {
      let nextParent = map.get(node.parentKey)!;
      let copy: TreeNode<T> = {
        key: nextParent.key,
        parentKey: nextParent.parentKey,
        value: nextParent.value,
        children: null
      };

      let children = nextParent.children;
      if (newNode == null && children) {
        children = children.filter(c => c !== node);
      }

      copy.children = children?.map(child => {
        if (child === node) {
          // newNode cannot be null here due to the above filter.
          return newNode!;
        }

        return child;
      }) ?? null;

      map.set(copy.key, copy);

      newNode = copy;
      node = nextParent;
    }

    if (newNode == null) {
      items = items.filter(c => c !== node);
    }

    return {
      items: items.map(item => {
        if (item === node) {
          // newNode cannot be null here due to the above filter.
          return newNode!;
        }

        return item;
      }),
      nodeMap: map
    };
  }

  function addNode(node: TreeNode<T>, map: Map<Key, TreeNode<T>>) {
    map.set(node.key, node);
    if (node.children) {
      for (let child of node.children) {
        addNode(child, map);
      }
    }
  }

  function deleteNode(node: TreeNode<T>, map: Map<Key, TreeNode<T>>) {
    map.delete(node.key);
    if (node.children) {
      for (let child of node.children) {
        deleteNode(child, map);
      }
    }
  }

  function getDescendantKeys(node?: TreeNode<T>): Key[] {
    let descendantKeys: Key[] = [];
    if (!node) {
      return descendantKeys;
    }
    function recurse(currentNode: TreeNode<T>) {
      if (currentNode.children) {
        for (let child of currentNode.children) {
          descendantKeys.push(child.key);
          recurse(child);
        }
      }
    }
  
    recurse(node);
    return descendantKeys;
  }
  
  return {
    items,
    selectedKeys,
    setSelectedKeys,
    getDescendantKeys,
    getItem(key: Key) {
      return nodeMap.get(key);
    },
    insert(parentKey: Key | null, index: number, ...values: T[]) {
      setItems(({items, nodeMap: originalMap}) => {
        let {items: newNodes, nodeMap: newMap} = buildTree(values, originalMap, parentKey);

        // If parentKey is null, insert into the root.
        if (parentKey == null) {
          return {
            items: [
              ...items.slice(0, index),
              ...newNodes,
              ...items.slice(index)
            ],
            nodeMap: newMap
          };
        }

        // Otherwise, update the parent node and its ancestors.
        return updateTree(items, parentKey, parentNode => ({
          key: parentNode.key,
          parentKey: parentNode.parentKey,
          value: parentNode.value,
          children: [
            ...parentNode.children!.slice(0, index),
            ...newNodes,
            ...parentNode.children!.slice(index)
          ]
        }), newMap);
      });
    },
    insertBefore(key: Key, ...values: T[]): void {
      let node = nodeMap.get(key);
      if (!node) {
        return;
      }

      let parentNode = nodeMap.get(node.parentKey!);
      let nodes = parentNode ? parentNode.children : items;
      let index = nodes!.indexOf(node);
      this.insert(parentNode?.key ?? null, index, ...values);
    },
    insertAfter(key: Key, ...values: T[]): void {
      let node = nodeMap.get(key);
      if (!node) {
        return;
      }

      let parentNode = nodeMap.get(node.parentKey!);
      let nodes = parentNode ? parentNode.children : items;
      let index = nodes!.indexOf(node);
      this.insert(parentNode?.key ?? null, index + 1, ...values);
    },
    prepend(parentKey: Key | null, ...values: T[]) {
      this.insert(parentKey, 0, ...values);
    },
    append(parentKey: Key | null, ...values: T[]) {
      if (parentKey == null) {
        this.insert(null, items.length, ...values);
      } else {
        let parentNode = nodeMap.get(parentKey);
        if (!parentNode) {
          return;
        }

        this.insert(parentKey, parentNode.children!.length, ...values);
      }
    },
    remove(...keys: Key[]) {
      if (keys.length === 0) {
        return;
      }

      let newItems = items;
      let prevMap = nodeMap;
      let newTree;
      for (let key of keys) {
        newTree = updateTree(newItems, key, () => null, prevMap);
        prevMap = newTree.nodeMap;
        newItems = newTree.items;
      }

      setItems(newTree);

      let selection = new Set(selectedKeys);
      for (let key of selectedKeys) {
        if (!newTree.nodeMap.has(key)) {
          selection.delete(key);
        }
      }

      setSelectedKeys(selection);
    },
    removeSelectedItems() {
      this.remove(...selectedKeys);
    },
    move(key: Key, toParentKey: Key | null, index: number) {
      setItems(({items, nodeMap: originalMap}) => {
        let node = originalMap.get(key);
        if (!node) {
          return {items, nodeMap: originalMap};
        }

        let {items: newItems, nodeMap: newMap} = updateTree(items, key, () => null, originalMap);


        const movedNode = {
          ...node,
          parentKey: toParentKey
        };

        // If parentKey is null, insert into the root.
        if (toParentKey == null) {
          newMap.set(movedNode.key, movedNode);
          return {items: [
            ...newItems.slice(0, index),
            movedNode,
            ...newItems.slice(index)
          ], nodeMap: newMap};
        }

        // Otherwise, update the parent node and its ancestors.
        return updateTree(newItems, toParentKey, parentNode => ({
          key: parentNode.key,
          parentKey: parentNode.parentKey,
          value: parentNode.value,
          children: [
            ...parentNode.children!.slice(0, index),
            movedNode,
            ...parentNode.children!.slice(index)
          ]
        }), newMap);
      });
    },
    moveBefore(key: Key, toParentKey: Key | null, index: number) {
      this.move(key, toParentKey, index);
    },
    moveAfter(key: Key, toParentKey: Key | null, index: number) {
      setItems(({items, nodeMap: originalMap}) => {
        let node = originalMap.get(key);
        if (!node) {
          return {items, nodeMap: originalMap};
        }

        let {items: newItems, nodeMap: newMap} = updateTree(items, key, () => null, originalMap);

        const movedNode = {
          ...node,
          parentKey: toParentKey
        };

        const afterIndex = items.length === index ? index : index + 1;
        // If parentKey is null, insert into the root.
        if (toParentKey == null) {
          newMap.set(movedNode.key, movedNode);
          return {items: [
            ...newItems.slice(0, afterIndex),
            movedNode,
            ...newItems.slice(afterIndex)
          ], nodeMap: newMap};
        }

        // Otherwise, update the parent node and its ancestors.
        return updateTree(newItems, toParentKey, parentNode => {
          const c = [
            ...parentNode.children!.slice(0, afterIndex),
            movedNode,
            ...parentNode.children!.slice(afterIndex)
          ];
          return {
            key: parentNode.key,
            parentKey: parentNode.parentKey,
            value: parentNode.value,
            children: c
          };
        }, newMap);
      });
    },
    update(oldKey: Key, newValue: T) {
      setItems(({items, nodeMap: originalMap}) => updateTree(items, oldKey, oldNode => {
        let node: TreeNode<T> = {
          key: oldNode.key,
          parentKey: oldNode.parentKey,
          value: newValue,
          children: null
        };

        let tree = buildTree(getChildren(newValue), originalMap, node.key);
        node.children = tree.items;
        return node;
      }, originalMap));
    }
  };
}
