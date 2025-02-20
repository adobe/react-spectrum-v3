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

import {
  actHook as act,
  renderHook,
} from "@react-spectrum/test-utils-internal";
import React from "react";
import { useTreeData } from "../src/useTreeData";

const initial = [
  {
    name: "David",
    children: [
      { name: "John", children: [{ name: "Suzie" }] },
      { name: "Sam", children: [{ name: "Stacy" }, { name: "Brad" }] },
      { name: "Jane" },
    ],
  },
];

let getKey = (item) => item.name;
let getChildren = (item) => item.children;

describe("useTreeData", function () {
  it("should construct a tree using initial data", function () {
    let { result } = renderHook(() =>
      useTreeData({
        initialItems: initial,
        getChildren,
        getKey,
        initialSelectedKeys: ["John", "Stacy"],
      })
    );
    expect(result.current.items[0].value).toBe(initial[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0].value).toBe(
      initial[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(1);
    expect(result.current.items[0].children[1].children).toHaveLength(2);
    expect(result.current.items[0].children[2].children).toHaveLength(0);
    expect(result.current.selectedKeys).toEqual(new Set(["John", "Stacy"]));
  });

  it("should get a node by key", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    expect(result.current.getItem("Sam").value).toBe(initial[0].children[1]);
    expect(result.current.getItem("David").value).toBe(initial[0]);
  });

  it("should insert an item into a child node", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insert("John", 1, { name: "Devon" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(2);
    expect(result.current.items[0].children[0].children[0]).toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[0].children[1].value).toEqual({
      name: "Devon",
    });
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should insert multiple items into a child node", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insert("John", 1, { name: "Devon" }, { name: "Danni" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0].children[0]).toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[0].children[1].value).toEqual({
      name: "Devon",
    });
    expect(result.current.items[0].children[0].children[2].value).toEqual({
      name: "Danni",
    });
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should insert an item into the root", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insert(null, 1, { name: "Devon" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1].value).toEqual({ name: "Devon" });
  });

  it("should insert multiple items into the root", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insert(null, 1, { name: "Devon" }, { name: "Danni" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1].value).toEqual({ name: "Devon" });
    expect(result.current.items[2].value).toEqual({ name: "Danni" });
  });

  it("should insert an item into a child node before another item", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insertBefore("Suzie", { name: "Devon" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(2);
    expect(result.current.items[0].children[0].children[0].value).toEqual({
      name: "Devon",
    });
    expect(result.current.items[0].children[0].children[1]).toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should insert multiple items into a child node before another item", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insertBefore(
        "Suzie",
        { name: "Devon" },
        { name: "Danni" }
      );
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0].children[0].value).toEqual({
      name: "Devon",
    });
    expect(result.current.items[0].children[0].children[1].value).toEqual({
      name: "Danni",
    });
    expect(result.current.items[0].children[0].children[2]).toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should insert an item into the root before another item", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insertBefore("David", { name: "Devon" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].value).toEqual({ name: "Devon" });
    expect(result.current.items[1]).toBe(initialResult.items[0]);
  });

  it("should insert multiple items into the root before another item", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insertBefore(
        "David",
        { name: "Devon" },
        { name: "Danni" }
      );
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0].value).toEqual({ name: "Devon" });
    expect(result.current.items[1].value).toEqual({ name: "Danni" });
    expect(result.current.items[2]).toBe(initialResult.items[0]);
  });

  it("should insert an item into a child node after another item", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insertAfter("Suzie", { name: "Devon" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(2);
    expect(result.current.items[0].children[0].children[0]).toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[0].children[1].value).toEqual({
      name: "Devon",
    });
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should insert multiple items into a child node after another item", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insertAfter("Suzie", { name: "Devon" }, { name: "Danni" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0].children[0]).toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[0].children[1].value).toEqual({
      name: "Devon",
    });
    expect(result.current.items[0].children[0].children[2].value).toEqual({
      name: "Danni",
    });
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should insert an item into the root after another item", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insertAfter("David", { name: "Devon" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1].value).toEqual({ name: "Devon" });
  });

  it("should insert multiple items into the root after another item", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.insertAfter("David", { name: "Devon" }, { name: "Danni" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1].value).toEqual({ name: "Devon" });
    expect(result.current.items[2].value).toEqual({ name: "Danni" });
  });

  it("should prepend an item into a child node", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.prepend("John", { name: "Devon" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(2);
    expect(result.current.items[0].children[0].children[0].value).toEqual({
      name: "Devon",
    });
    expect(result.current.items[0].children[0].children[1]).toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should prepend multiple items into a child node", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.prepend("John", { name: "Devon" }, { name: "Danni" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0].children[0].value).toEqual({
      name: "Devon",
    });
    expect(result.current.items[0].children[0].children[1].value).toEqual({
      name: "Danni",
    });
    expect(result.current.items[0].children[0].children[2]).toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should prepend an item into the root", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.prepend(null, { name: "Devon" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].value).toEqual({ name: "Devon" });
    expect(result.current.items[1]).toBe(initialResult.items[0]);
  });

  it("should prepend multiple items into the root", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.prepend(null, { name: "Devon" }, { name: "Danni" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0].value).toEqual({ name: "Devon" });
    expect(result.current.items[1].value).toEqual({ name: "Danni" });
    expect(result.current.items[2]).toBe(initialResult.items[0]);
  });

  it("should append an item into a child node", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.append("John", { name: "Devon" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(2);
    expect(result.current.items[0].children[0].children[0]).toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[0].children[1].value).toEqual({
      name: "Devon",
    });
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should append multiple items into a child node", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.append("John", { name: "Devon" }, { name: "Danni" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0].children[0]).toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[0].children[1].value).toEqual({
      name: "Devon",
    });
    expect(result.current.items[0].children[0].children[2].value).toEqual({
      name: "Danni",
    });
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should append an item into the root", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.append(null, { name: "Devon" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1].value).toEqual({ name: "Devon" });
  });

  it("should append multiple items into the root", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.append(null, { name: "Devon" }, { name: "Danni" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0]).toBe(initialResult.items[0]);
    expect(result.current.items[1].value).toEqual({ name: "Devon" });
    expect(result.current.items[2].value).toEqual({ name: "Danni" });
  });

  it("should remove an item", function () {
    let { result } = renderHook(() =>
      useTreeData({
        initialItems: initial,
        getChildren,
        getKey,
        initialSelectedKeys: ["Suzie", "Sam"],
      })
    );
    let initialResult = result.current;

    act(() => {
      result.current.remove("Suzie");
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(0);
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
    expect(result.current.selectedKeys).not.toBe(initialResult.selectedKeys);
    expect(result.current.selectedKeys).toEqual(new Set(["Sam"]));
  });

  it("should remove multiple items", function () {
    let { result } = renderHook(() =>
      useTreeData({
        initialItems: initial,
        getChildren,
        getKey,
        initialSelectedKeys: ["Brad", "Sam"],
      })
    );
    let initialResult = result.current;

    act(() => {
      result.current.remove("Suzie", "Brad");
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(0);
    expect(result.current.items[0].children[1]).not.toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[1].children).toHaveLength(1);
    expect(result.current.items[0].children[1].children[0]).toBe(
      initialResult.items[0].children[1].children[0]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
    expect(result.current.selectedKeys).not.toBe(initialResult.selectedKeys);
    expect(result.current.selectedKeys).toEqual(new Set(["Sam"]));
  });

  it("should remove an item from the root", function () {
    let { result } = renderHook(() =>
      useTreeData({
        initialItems: initial,
        getChildren,
        getKey,
        initialSelectedKeys: ["David", "Suzie"],
      })
    );
    let initialResult = result.current;

    act(() => {
      result.current.remove("David");
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(0);
    expect(result.current.selectedKeys).not.toBe(initialResult.selectedKeys);
    expect(result.current.selectedKeys).toEqual(new Set());
  });

  it("should remove the selected items", function () {
    let { result } = renderHook(() =>
      useTreeData({
        initialItems: initial,
        getChildren,
        getKey,
        initialSelectedKeys: ["Suzie", "Brad"],
      })
    );
    let initialResult = result.current;

    act(() => {
      result.current.removeSelectedItems();
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(0);
    expect(result.current.items[0].children[1]).not.toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[1].children).toHaveLength(1);
    expect(result.current.items[0].children[1].children[0]).toBe(
      initialResult.items[0].children[1].children[0]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
    expect(result.current.selectedKeys).not.toBe(initialResult.selectedKeys);
    expect(result.current.selectedKeys).toEqual(new Set());
  });

  it("should update an root item", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.update("David", { expanded: true, name: "Danny" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].value).toEqual({
      expanded: true,
      name: "Danny",
    });
    expect(result.current.items[0].parentKey).toBeUndefined();
  });

  it("should update an item", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.update("Suzie", { name: "Devon" });
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(1);
    expect(result.current.items[0].children[0].children[0]).not.toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[0].children[0].value).toEqual({
      name: "Devon",
    });
    expect(result.current.items[0].children[1]).toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should move an item within the same parent", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.move("Brad", "Sam", 0);
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[1]).not.toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[1].children).toHaveLength(2);
    expect(result.current.items[0].children[1].children[0]).toEqual(
      initialResult.items[0].children[1].children[1]
    );
    expect(result.current.items[0].children[1].children[1]).toBe(
      initialResult.items[0].children[1].children[0]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("update parentKey when a node is moved to another parent", function () {
    const { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );

    act(() => {
      result.current.move("Brad", "John", 0);
    });

    const john = result.current.items[0].children[0];
    const brad = john.children[0];
    expect(brad.parentKey).toBe(john.key);
  });

  it("should move an item to a different parent", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.move("Brad", "John", 0);
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(3);
    expect(result.current.items[0].children[0]).not.toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[0].children[0].children).toHaveLength(2);
    expect(result.current.items[0].children[0].children[0].value).toBe(
      initialResult.items[0].children[1].children[1].value
    );
    expect(result.current.items[0].children[0].children[1]).toBe(
      initialResult.items[0].children[0].children[0]
    );
    expect(result.current.items[0].children[1]).not.toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[0].children[1].children).toHaveLength(1);
    expect(result.current.items[0].children[1].children[0]).toBe(
      initialResult.items[0].children[1].children[0]
    );
    expect(result.current.items[0].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should move an item to the root", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.move("Stacy", null, 0);
    });

    expect(result.current.items).not.toBe(initialResult.items);
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]).not.toBe(initialResult.items[0]);
    expect(result.current.items[0].children).toHaveLength(0);
    expect(result.current.items[0].value).toEqual({ name: "Stacy" });
    expect(result.current.items[1]).not.toBe(initialResult.items[0]);
    expect(result.current.items[1].children).toHaveLength(3);
    expect(result.current.items[1].children[0]).toBe(
      initialResult.items[0].children[0]
    );
    expect(result.current.items[1].children[1]).not.toBe(
      initialResult.items[0].children[1]
    );
    expect(result.current.items[1].children[1].children).toHaveLength(1);
    expect(result.current.items[1].children[1].children[0]).toEqual(
      initialResult.items[0].children[1].children[1]
    );
    expect(result.current.items[1].children[2]).toBe(
      initialResult.items[0].children[2]
    );
  });

  it("should move an item to a new index within its current parent", function () {
    let { result } = renderHook(() =>
      useTreeData({ initialItems: initial, getChildren, getKey })
    );

    expect(result.current.items[0].children[0].key).toBe("John");
    expect(result.current.items[0].children[1].key).toBe("Sam");
    expect(result.current.items[0].children[2].key).toBe("Jane");

    act(() => {
      result.current.move("Sam", "David", 2);
    });

    expect(result.current.items[0].children[0].key).toBe("John");
    expect(result.current.items[0].children[1].key).toBe("Jane");
    expect(result.current.items[0].children[2].key).toBe("Sam");

    act(() => {
      result.current.move("Sam", "David", 0);
    });

    expect(result.current.items[0].children[0].key).toBe("Sam");
    expect(result.current.items[0].children[1].key).toBe("John");
    expect(result.current.items[0].children[2].key).toBe("Jane");

    act(() => {
      result.current.move("Sam", "David", 1);
    });

    expect(result.current.items[0].children[0].key).toBe("John");
    expect(result.current.items[0].children[1].key).toBe("Sam");
    expect(result.current.items[0].children[2].key).toBe("Jane");
  });

  it("should move an item to a new index within the root", function () {
    const initialItems = [...initial, { name: "Emily" }, { name: "Eli" }];

    let { result } = renderHook(() =>
      useTreeData({ initialItems, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.move("Eli", null, 1);
    });

    expect(result.current.items).not.toEqual(initialResult.items);
    expect(result.current.items).toHaveLength(initialResult.items.length);
    expect(result.current.items[0]).toEqual(initialResult.items[0]);
    expect(result.current.items[1].children).toEqual(
      initialResult.items[2].children
    );
    expect(result.current.items[1].key).toEqual(initialResult.items[2].key);
    expect(result.current.items[1].parentKey).toEqual(null);
    expect(result.current.items[1].value).toEqual(initialResult.items[2].value);
    expect(result.current.items[2]).toEqual(initialResult.items[1]);
  });

  it("should move an item multiple times within the root", function () {
    const initialItems = [...initial, { name: "Emily" }, { name: "Eli" }];

    let { result } = renderHook(() =>
      useTreeData({ initialItems, getChildren, getKey })
    );
    let initialResult = result.current;

    act(() => {
      result.current.move("Eli", null, 2);
      result.current.move("Eli", null, 3);
      result.current.move("Eli", null, 1);
    });

    expect(result.current.items).not.toEqual(initialResult.items);
    expect(result.current.items).toHaveLength(initialResult.items.length);
    expect(result.current.items[0]).toEqual(initialResult.items[0]);
    expect(result.current.items[1].children).toEqual(
      initialResult.items[2].children
    );
    expect(result.current.items[1].key).toEqual(initialResult.items[2].key);
    expect(result.current.items[1].parentKey).toEqual(null);
    expect(result.current.items[1].value).toEqual(initialResult.items[2].value);
    expect(result.current.items[2]).toEqual(initialResult.items[1]);
  });

  it("should move an item within its same level before the target", function () {
    const initialItems = [...initial, { name: "Emily" }, { name: "Eli" }];

    let { result } = renderHook(() =>
      useTreeData({ initialItems, getChildren, getKey })
    );
    act(() => {
      result.current.moveBefore("Eli", null, 0);
    });
    expect(result.current.items[0].key).toEqual("Eli");
    expect(result.current.items[1].key).toEqual("David");
    expect(result.current.items[2].key).toEqual("Emily");
    expect(result.current.items.length).toEqual(initialItems.length);
  });

  it("should move an item to a different level before the target", function () {
    const initialItems = [...initial, { name: "Emily" }, { name: "Eli" }];

    let { result } = renderHook(() =>
      useTreeData({ initialItems, getChildren, getKey })
    );
    act(() => {
      result.current.moveBefore("Eli", "David", 1);
    });
    expect(result.current.items[0].key).toEqual("David");
    expect(result.current.items[0].children[0].key).toEqual("John");
    expect(result.current.items[0].children[1].key).toEqual("Eli");
    expect(result.current.items[1].key).toEqual("Emily");
    expect(result.current.items.length).toEqual(2);
  });

  it("should move an item to a different level after the target", function () {
    const initialItems = [...initial, { name: "Emily" }, { name: "Eli" }];
    let { result } = renderHook(() =>
      useTreeData({ initialItems, getChildren, getKey })
    );

    act(() => {
      result.current.moveAfter("Eli", "David", 1);
    });
    expect(result.current.items[0].key).toEqual("David");

    expect(result.current.items[0].children[0].key).toEqual("John");
    expect(result.current.items[0].children[1].key).toEqual("Sam");
    expect(result.current.items[0].children[2].key).toEqual("Eli");
    expect(result.current.items[1].key).toEqual("Emily");
    expect(result.current.items.length).toEqual(2);
  });

  it("should move an item to a different level at the end when the index is greater than the node list length", function () {
    const initialItems = [...initial, { name: "Emily" }, { name: "Eli" }];
    let { result } = renderHook(() =>
      useTreeData({ initialItems, getChildren, getKey })
    );

    act(() => {
      result.current.moveAfter("Eli", "David", 100);
    });
    expect(result.current.items[0].key).toEqual("David");

    expect(result.current.items[0].children[0].key).toEqual("John");
    expect(result.current.items[0].children[1].key).toEqual("Sam");
    expect(result.current.items[0].children[2].key).toEqual("Jane");
    expect(result.current.items[0].children[3].key).toEqual("Eli");
    expect(result.current.items[1].key).toEqual("Emily");
    expect(result.current.items.length).toEqual(2);
  });

  it("gets the decentants of a node", function () {
    const initialItems = [...initial, { name: "Emily" }, { name: "Eli" }];
    let { result } = renderHook(() =>
      useTreeData({ initialItems, getChildren, getKey })
    );
    let decendants;
    act(() => {
      const top = result.current.getItem("David");
      decendants = result.current.getDescendantKeys(top);
    });
    expect(decendants).toEqual([
      "John",
      "Suzie",
      "Sam",
      "Stacy",
      "Brad",
      "Jane",
    ]);
  });

  it("gets the decentants of a child node", function () {
    const initialItems = [...initial, { name: "Emily" }, { name: "Eli" }];
    let { result } = renderHook(() =>
      useTreeData({ initialItems, getChildren, getKey })
    );
    let descendants;
    act(() => {
      const top = result.current.getItem("Sam");
      descendants = result.current.getDescendantKeys(top);
    });
    expect(descendants).toEqual(["Stacy", "Brad"]);
  });

  it("returns an empty array when getting the decendant keys for a leaf node", function () {
    const initialItems = [...initial, { name: "Emily" }, { name: "Eli" }];
    let { result } = renderHook(() =>
      useTreeData({ initialItems, getChildren, getKey })
    );
    let descendants;
    act(() => {
      const top = result.current.getItem("Eli");
      descendants = result.current.getDescendantKeys(top);
    });
    expect(descendants).toEqual([]);
  });

  it("returns an empty array when an undefined key is supplied", function () {
    const initialItems = [...initial, { name: "Emily" }, { name: "Eli" }];
    let { result } = renderHook(() =>
      useTreeData({ initialItems, getChildren, getKey })
    );
    let descendants;
    act(() => {
      descendants = result.current.getDescendantKeys(undefined);
    });
    expect(descendants).toEqual([]);
  });
});
