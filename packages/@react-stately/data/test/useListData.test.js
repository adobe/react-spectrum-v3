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

import {actHook as act, renderHook} from '@react-spectrum/test-utils-internal';
import React from 'react';
import {useListData} from '../src/useListData';

const initial = [
  {name: 'David'},
  {name: 'Sam'},
  {name: 'Julia'}
];

const many = [
  {name: 'One'},
  {name: 'Two'},
  {name: 'Three'},
  {name: 'Four'},
  {name: 'Five'},
  {name: 'Six'},
  {name: 'Seven'},
  {name: 'Eight'},
  {name: 'Nine'},
  {name: 'Ten'},
  {name: 'Eleven'}
];

const grouped = [
  {
    name: 'One',
    children: [
      {name: 'Child 1'},
      {name: 'Child 2'}
    ]
  },
  {name: 'Two', children: [{name: 'Child 0'}]},
  {
    name: 'Three',
    children: [
      {name: 'Child 1'}
    ]
  }
];


let getKey = (item) => item.name;
let filter = (item, text) => item.name.includes(text);

describe('useListData', function () {
  it('should construct a list using initial data', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey, initialSelectedKeys: ['Sam', 'Julia']}));
    expect(result.current.items).toBe(initial);
    expect(result.current.selectedKeys).toEqual(new Set(['Sam', 'Julia']));
  });

  it('should get an item by key', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    expect(result.current.getItem('Sam')).toBe(initial[1]);
  });

  it('should insert an item at an index', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.insert(1, {name: 'Devon'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(4);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1]).toEqual({name: 'Devon'});
    expect(result.current.items[2]).toBe(initialResult.items[1]);
    expect(result.current.items[3]).toBe(initialResult.items[2]);
  });

  it('should insert multiple items at an index', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.insert(1, {name: 'Devon'}, {name: 'Danni'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(5);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1]).toEqual({name: 'Devon'});
    expect(result.current.items[2]).toEqual({name: 'Danni'});
    expect(result.current.items[3]).toBe(initialResult.items[1]);
    expect(result.current.items[4]).toBe(initialResult.items[2]);
  });

  it('should insert an item before another item', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.insertBefore('Sam', {name: 'Devon'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(4);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1]).toEqual({name: 'Devon'});
    expect(result.current.items[2]).toBe(initialResult.items[1]);
    expect(result.current.items[3]).toBe(initialResult.items[2]);
  });

  it('should insert multiple items before another item', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.insertBefore('Sam', {name: 'Devon'}, {name: 'Danni'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(5);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1]).toEqual({name: 'Devon'});
    expect(result.current.items[2]).toEqual({name: 'Danni'});
    expect(result.current.items[3]).toBe(initialResult.items[1]);
    expect(result.current.items[4]).toBe(initialResult.items[2]);
  });

  it('should insert an item after another item', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.insertAfter('David', {name: 'Devon'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(4);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1]).toEqual({name: 'Devon'});
    expect(result.current.items[2]).toBe(initialResult.items[1]);
    expect(result.current.items[3]).toBe(initialResult.items[2]);
  });

  it('should insert multiple items after another item', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.insertAfter('David', {name: 'Devon'}, {name: 'Danni'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(5);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1]).toEqual({name: 'Devon'});
    expect(result.current.items[2]).toEqual({name: 'Danni'});
    expect(result.current.items[3]).toBe(initialResult.items[1]);
    expect(result.current.items[4]).toBe(initialResult.items[2]);
  });

  it('should insert an prepend an item', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.prepend({name: 'Devon'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(4);
    expect(result.current.items[0]).toEqual({name: 'Devon'});
    expect(result.current.items[1]).toBe(initialResult.items[0]);
    expect(result.current.items[2]).toBe(initialResult.items[1]);
    expect(result.current.items[3]).toBe(initialResult.items[2]);
  });

  it('should insert an prepend multiple items', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.prepend({name: 'Devon'}, {name: 'Danni'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(5);
    expect(result.current.items[0]).toEqual({name: 'Devon'});
    expect(result.current.items[1]).toEqual({name: 'Danni'});
    expect(result.current.items[2]).toBe(initialResult.items[0]);
    expect(result.current.items[3]).toBe(initialResult.items[1]);
    expect(result.current.items[4]).toBe(initialResult.items[2]);
  });

  it('should insert an append an item', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.append({name: 'Devon'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(4);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1]).toBe(initialResult.items[1]);
    expect(result.current.items[2]).toBe(initialResult.items[2]);
    expect(result.current.items[3]).toEqual({name: 'Devon'});
  });

  it('should insert an append multiple items', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.append({name: 'Devon'}, {name: 'Danni'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(5);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1]).toBe(initialResult.items[1]);
    expect(result.current.items[2]).toBe(initialResult.items[2]);
    expect(result.current.items[3]).toEqual({name: 'Devon'});
    expect(result.current.items[4]).toEqual({name: 'Danni'});
  });

  it('should not wipe the list state when inserting before with a target key that doesn\'t exist', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey, initialSelectedKeys: ['Sam', 'Julia'], initialFilterText: 'test'}));
    let initialResult = result.current;
    expect(initialResult.items).toBe(initial);
    expect(initialResult.selectedKeys).toEqual(new Set(['Sam', 'Julia']));
    expect(initialResult.filterText).toBe('test');

    act(() => {
      result.current.insertBefore('fakeKey', {name: 'Devon'});
    });

    expect(result.current.items).toBe(initialResult.items);
    expect(result.current.selectedKeys).toBe(initialResult.selectedKeys);
    expect(result.current.filterText).toBe(initialResult.filterText);
  });

  it('should not wipe the list state when inserting before with a target key that doesn\'t exist', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey, initialSelectedKeys: ['Sam', 'Julia'], initialFilterText: 'test'}));
    let initialResult = result.current;
    expect(initialResult.items).toBe(initial);
    expect(initialResult.selectedKeys).toEqual(new Set(['Sam', 'Julia']));
    expect(initialResult.filterText).toBe('test');

    act(() => {
      result.current.insertAfter('fakeKey', {name: 'Devon'});
    });

    expect(result.current.items).toBe(initialResult.items);
    expect(result.current.selectedKeys).toBe(initialResult.selectedKeys);
    expect(result.current.filterText).toBe(initialResult.filterText);
  });

  it('should insert items into a empty list regardless of the target key provided (insertBefore)', function () {
    let {result} = renderHook(() => useListData({initialItems: [], getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.insertBefore('fakeKey', {name: 'Devon'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({name: 'Devon'});
  });

  it('should insert items into a empty list regardless of the target key provided (insertAfter)', function () {
    let {result} = renderHook(() => useListData({initialItems: [], getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.insertAfter('fakeKey', {name: 'Devon'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({name: 'Devon'});
  });

  it('should remove an item', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey, initialSelectedKeys: ['Sam', 'Julia']}));
    let initialResult = result.current;

    act(() => {
      result.current.remove('Sam');
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1]).toBe(initialResult.items[2]);
    expect(result.current.selectedKeys).not.toBe(initialResult.selectedKeys);
    expect(result.current.selectedKeys).toEqual(new Set(['Julia']));
  });

  it('should preserve all selected value through a remove call', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey, initialSelectedKeys: 'all'}));

    act(() => {
      result.current.remove('Sam');
    });

    expect(result.current.selectedKeys).toEqual('all');
  });

  it('should change all selection to empty set if last item is removed', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey, initialSelectedKeys: 'all'}));

    act(() => {
      result.current.remove('Sam');
      result.current.remove('David');
      result.current.remove('Julia');
    });

    expect(result.current.selectedKeys).toEqual(new Set());
  });

  it('should remove multiple items', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey, initialSelectedKeys: ['Sam', 'David', 'Julia']}));
    let initialResult = result.current;

    act(() => {
      result.current.remove('Sam', 'David');
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toBe(initialResult.items[2]);
    expect(result.current.selectedKeys).not.toBe(initialResult.selectedKeys);
    expect(result.current.selectedKeys).toEqual(new Set(['Julia']));
  });

  it('should remove the selected items', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey, initialSelectedKeys: ['Sam', 'Julia']}));
    let initialResult = result.current;

    act(() => {
      result.current.removeSelectedItems();
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.selectedKeys).not.toBe(initialResult.selectedKeys);
    expect(result.current.selectedKeys).toEqual(new Set());
  });

  it('should remove the selected items with select all', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey, initialSelectedKeys: 'all'}));
    let initialResult = result.current;

    act(() => {
      result.current.removeSelectedItems();
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(0);
    expect(result.current.selectedKeys).not.toBe(initialResult.selectedKeys);
    expect(result.current.selectedKeys).toEqual(new Set());
  });

  it('should update an item', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.update('Sam', {name: 'Devon'});
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1]).not.toBe(initialResult.items[1]);
    expect(result.current.items[1]).toEqual({name: 'Devon'});
    expect(result.current.items[2]).toBe(initialResult.items[2]);
  });

  it('should move an item', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
    let initialResult = result.current;

    act(() => {
      result.current.move('Sam', 0);
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0]).toBe(initialResult.items[1]);
    expect(result.current.items[1]).toBe(initialResult.items[0]);
    expect(result.current.items[2]).toBe(initialResult.items[2]);
  });

  describe('moveBefore', function () {
    it('should move an item before another item from before', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveBefore('Three', ['One']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[1],
        many[0],
        many[2],
        many[3],
        many[4],
        many[5],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move an item before another item from after', function () {
      let {result} = renderHook(() => useListData({initialItems: initial, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveBefore('Sam', ['Julia']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(3);
      expect(result.current.items).toEqual([
        initial[0],
        initial[2],
        initial[1]
      ]);
    });

    it('should move multiple subsequent items before another item from before', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveBefore('Five', ['Two', 'Three']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[0],
        many[3],
        many[1],
        many[2],
        many[4],
        many[5],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move multiple subsequent items before another item from after', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveBefore('Two', ['Five', 'Six']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[0],
        many[4],
        many[5],
        many[1],
        many[2],
        many[3],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move multiple non-subsequent items before another item from before', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveBefore('Five', ['One', 'Three']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[1],
        many[3],
        many[0],
        many[2],
        many[4],
        many[5],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move multiple non-subsequent items before another item from after', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveBefore('Two', ['Four', 'Six']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[0],
        many[3],
        many[5],
        many[1],
        many[2],
        many[4],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move multiple items before another item from both before and after', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveBefore('Three', ['One', 'Five']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[1],
        many[0],
        many[4],
        many[2],
        many[3],
        many[5],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });
  });

  describe('moveAfter', function () {
    it('should move an item before another item from before', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveAfter('Three', ['One']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[1],
        many[2],
        many[0],
        many[3],
        many[4],
        many[5],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move an item before another item from after', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveAfter('Three', ['Five']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[0],
        many[1],
        many[2],
        many[4],
        many[3],
        many[5],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move multiple subsequent items before another item from before', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveAfter('Five', ['Two', 'Three']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[0],
        many[3],
        many[4],
        many[1],
        many[2],
        many[5],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move multiple subsequent items before another item from after', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveAfter('Two', ['Five', 'Six']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[0],
        many[1],
        many[4],
        many[5],
        many[2],
        many[3],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move multiple non-subsequent items before another item from before', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveAfter('Five', ['One', 'Three']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[1],
        many[3],
        many[4],
        many[0],
        many[2],
        many[5],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move multiple non-subsequent items before another item from after', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveAfter('Two', ['Four', 'Six']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[0],
        many[1],
        many[3],
        many[5],
        many[2],
        many[4],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move multiple items before another item from both before and after', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveAfter('Three', ['One', 'Five']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[1],
        many[2],
        many[0],
        many[4],
        many[3],
        many[5],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move multiple items before another item to after that item', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveAfter('Five', ['Two', 'Three', 'Four']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[0],
        many[4],
        many[1],
        many[2],
        many[3],
        many[5],
        many[6],
        many[7],
        many[8],
        many[9],
        many[10]
      ]);
    });

    it('should move multiple items after that item', function () {
      let {result} = renderHook(() => useListData({initialItems: many, getKey}));
      let initialResult = result.current;

      act(() => {
        result.current.moveAfter('Seven', ['Nine', 'Ten', 'Eleven']);
      });

      expect(result.current.items).not.toBe(initialResult.items);
      expect(result.current.items).toHaveLength(11);
      expect(result.current.items).toEqual([
        many[0],
        many[1],
        many[2],
        many[3],
        many[4],
        many[5],
        many[6],
        many[8],
        many[9],
        many[10],
        many[7]
      ]);
    });
  });

  it('should support filtering', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, filter, initialFilterText: 'Sa'}));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({name: 'Sam'});
  });

  it('should support updating the filter text', function () {
    let {result} = renderHook(() => useListData({initialItems: initial, filter}));

    expect(result.current.items).toHaveLength(3);
    expect(result.current.items).toEqual(initial);

    act(() => {
      result.current.setFilterText('Da');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({name: 'David'});
  });

  it('should support filtering items across sections', function () {
    let {result} = renderHook(() => useListData({initialItems: grouped, getKey, filter, initialFilterText: 'Child 1', filterKey: 'children'}));

    expect(result.current.items).toEqual([
      {name: 'One', children: [{name: 'Child 1'}]},
      {name: 'Three', children: [{name: 'Child 1'}]}
    ]);
  });
});
