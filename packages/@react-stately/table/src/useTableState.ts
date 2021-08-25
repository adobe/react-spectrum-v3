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

import {CollectionBase, MultipleSelection, Node, SelectionMode, Sortable, SortDescriptor, SortDirection} from '@react-types/shared';
import {GridState, useGridState} from '@react-stately/grid';
import {TableCollection as ITableCollection} from '@react-types/table';
import {Key, useMemo} from 'react';
import {TableCollection} from './TableCollection';
import {useCollection} from '@react-stately/collections';

export interface TableState<T> extends GridState<T, ITableCollection<T>> {
  /** A collection of rows and columns in the table. */
  collection: ITableCollection<T>,
  /** Whether the row selection checkboxes should be displayed. */
  showSelectionCheckboxes: boolean,
  /** The current sorted column and direction. */
  sortDescriptor: SortDescriptor,
  /** Calls the provided onSortChange handler with the provided column key and sort direction. */
  sort(columnKey: Key): void
}

export interface CollectionBuilderContext<T> {
  showSelectionCheckboxes: boolean,
  selectionMode: SelectionMode,
  columns: Node<T>[]
}

export interface TableStateProps<T> extends CollectionBase<T>, MultipleSelection, Sortable {
  /** Whether the row selection checkboxes should be displayed. */
  showSelectionCheckboxes?: boolean
}

const OPPOSITE_SORT_DIRECTION = {
  ascending: 'descending' as SortDirection,
  descending: 'ascending' as SortDirection
};

/**
 * Provides state management for a table component. Handles building a collection
 * of columns and rows from props. In addition, it tracks row selection and manages sort order changes.
 */
export function useTableState<T extends object>(props: TableStateProps<T>): TableState<T>  {
  let {selectionMode = 'none', showSelectionCheckboxes, sortDescriptor, onSortChange, children} = props;

  let context = useMemo(() => ({
    showSelectionCheckboxes: showSelectionCheckboxes && selectionMode !== 'none',
    selectionMode,
    columns: []
  }), [children, showSelectionCheckboxes, selectionMode]);

  let collection = useCollection<T, TableCollection<T>>(
    props,
    (nodes, prev) => new TableCollection(nodes, prev, context),
    context
  );
  let {disabledKeys, selectionManager} = useGridState({...props, collection});

  let state = useMemo(() => ({
    collection,
    disabledKeys,
    selectionManager,
    showSelectionCheckboxes: showSelectionCheckboxes || false,
    sortDescriptor,
    sort(columnKey: Key) {
      onSortChange({
        column: columnKey,
        direction: sortDescriptor?.column === columnKey
          ? OPPOSITE_SORT_DIRECTION[sortDescriptor.direction]
          : 'ascending'
      });
    }
  }), [collection, disabledKeys, selectionManager, showSelectionCheckboxes, sortDescriptor, onSortChange]);

  return state;
}
