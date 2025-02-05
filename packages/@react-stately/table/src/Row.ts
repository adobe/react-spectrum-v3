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

import {CollectionBuilderContext} from './useTableState';
import {PartialNode} from '@react-stately/collections';
import React, {JSX, ReactElement} from 'react';
import {RowProps} from '@react-types/table';

function Row<T>(props: RowProps<T>): ReactElement | null { // eslint-disable-line @typescript-eslint/no-unused-vars
  return null;
}

Row.getCollectionNode = function* getCollectionNode<T>(props: RowProps<T>, context: CollectionBuilderContext<T>): Generator<PartialNode<T>> {
  let {children, textValue, UNSTABLE_childItems} = props;

  yield {
    type: 'item',
    props: props,
    textValue,
    'aria-label': props['aria-label'],
    hasChildNodes: true,
    *childNodes() {
      // Process cells first
      if (context.showDragButtons) {
        yield {
          type: 'cell',
          key: 'header-drag', // this is combined with the row key by CollectionBuilder
          props: {
            isDragButtonCell: true
          }
        };
      }

      if (context.showSelectionCheckboxes && context.selectionMode !== 'none') {
        yield {
          type: 'cell',
          key: 'header', // this is combined with the row key by CollectionBuilder
          props: {
            isSelectionCell: true
          }
        };
      }

      if (typeof children === 'function') {
        for (let column of context.columns) {
          yield {
            type: 'cell',
            element: children(column.key),
            key: column.key // this is combined with the row key by CollectionBuilder
          };
        }

        if (UNSTABLE_childItems) {
          for (let child of UNSTABLE_childItems) {
            // Note: in order to reuse the render function of TableBody for our child rows, we just need to yield a type and a value here. CollectionBuilder will then look up
            // the parent renderer and use that to build the full node of this child row, using the value provided here to generate the cells
            yield {
              type: 'item',
              value: child
            };
          }
        }
      } else {
        let cells: PartialNode<T>[] = [];
        let childRows: PartialNode<T>[] = [];
        React.Children.forEach(children, node => {
          if (node.type === Row) {
            if (cells.length < context.columns.length) {
              throw new Error('All of a Row\'s child Cells must be positioned before any child Rows.');
            }

            childRows.push({
              type: 'item',
              element: node
            });
          } else {
            cells.push({
              type: 'cell',
              element: node
            });
          }
        });

        yield* cells;
        yield* childRows;
      }
    },
    shouldInvalidate(newContext: CollectionBuilderContext<T>) {
      // Invalidate all rows if the columns changed.
      return newContext.columns.length !== context.columns.length ||
        newContext.columns.some((c, i) => c.key !== context.columns[i].key) ||
        newContext.showSelectionCheckboxes !== context.showSelectionCheckboxes ||
        newContext.showDragButtons !== context.showDragButtons ||
        newContext.selectionMode !== context.selectionMode;
    }
  };
};

/**
 * A Row represents a single item in a Table and contains Cell elements for each column.
 * Cells can be statically defined as children, or generated dynamically using a function
 * based on the columns defined in the TableHeader.
 */
// We don't want getCollectionNode to show up in the type definition
let _Row = Row as <T>(props: RowProps<T>) => JSX.Element;
export {_Row as Row};
