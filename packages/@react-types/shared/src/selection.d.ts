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

import {Key} from 'react';

export interface SingleSelection {
  /** Whether the collection allows empty selection. */
  disallowEmptySelection?: boolean,
  /** The currently selected key in the collection (controlled). */
  selectedKey?: Key,
  /** The initial selected key in the collection (uncontrolled). */
  defaultSelectedKey?: Key,
  /** Handler that is called when the selection changes. */
  onSelectionChange?: (key: Key) => any
}

export type SelectionMode = 'none' | 'single' | 'multiple';
export type SelectionBehavior = 'toggle' | 'replace';
export type Selection = 'all' | Set<Key>;
export interface MultipleSelection {
  /** The type of selection that is allowed in the collection. */
  selectionMode?: SelectionMode,
  /** How multiple selection works in the collection. */
  selectionBehavior?: SelectionBehavior,
  /** Whether the collection allows empty selection. */
  disallowEmptySelection?: boolean,
  /** The currently selected keys in the collection (controlled). */
  selectedKeys?: 'all' | Iterable<Key>,
  /** The initial selected keys in the collection (uncontrolled). */
  defaultSelectedKeys?: 'all' | Iterable<Key>,
  /** Handler that is called when the selection changes. */
  onSelectionChange?: (keys: Selection) => any,
  /** The currently disabled keys in the collection (controlled). */
  disabledKeys?: Iterable<Key>
}

export type FocusStrategy = 'first' | 'last';
