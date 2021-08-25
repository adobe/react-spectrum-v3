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

import {getRowLabelledBy} from './utils';
import {GridRowAria, GridRowProps, useGridRow} from '@react-aria/grid';
import {RefObject, useMemo} from 'react';
import {TableCollection} from '@react-types/table';
import {TableState} from '@react-stately/table';

/**
 * Provides the behavior and accessibility implementation for a row in a table.
 * @param props - Props for the row.
 * @param state - State of the table, as returned by `useTableState`.
 */
export function useTableRow<T>(props: GridRowProps<T>, state: TableState<T>, ref: RefObject<HTMLElement>): GridRowAria {
  let {node} = props;
  let {rowProps} = useGridRow<T, TableCollection<T>, TableState<T>>(props, state, ref);
  // Not entirely sure why I needed this, but this fixed the tests... Weird cuz the aria-labelledby values didn't seem to be a problem in storybook
  let rowLabel = useMemo(() => getRowLabelledBy(state, node.key), [state, node.key]);
  return {
    rowProps: {
      ...rowProps,
      'aria-labelledby': rowLabel
    }
  };
}
