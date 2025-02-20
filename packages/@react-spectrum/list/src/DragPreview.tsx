/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {classNames, SlotProvider} from '@react-spectrum/utils';
import {Grid} from '@react-spectrum/layout';
import {GridNode} from '@react-types/grid';
import listStyles from './styles.css';
import React, {ReactElement} from 'react';
import type {SpectrumListViewProps} from './ListView';
import {Text} from '@react-spectrum/text';

interface DragPreviewProps<T> {
  item: GridNode<any>,
  itemCount: number,
  itemHeight: number,
  density: SpectrumListViewProps<T>['density']
}

export function DragPreview(props: DragPreviewProps<unknown>): ReactElement {
  let {
    item,
    itemCount,
    itemHeight,
    density
  } = props;

  let isDraggingMultiple = itemCount > 1;

  return (
    <div
      style={{height: itemHeight}}
      className={
        classNames(
          listStyles,
          'react-spectrum-ListViewItem',
          'react-spectrum-ListViewItem-dragPreview',
          {'react-spectrum-ListViewItem-dragPreview--multiple': isDraggingMultiple},
          `react-spectrum-ListViewItem-dragPreview--${density}`
          )
      }>
      <Grid UNSAFE_className={listStyles['react-spectrum-ListViewItem-grid']}>
        <SlotProvider
          slots={{
            text: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-content']},
            description: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-description']},
            illustration: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-thumbnail']},
            image: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-thumbnail']},
            actionButton: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-actions'], isQuiet: true},
            actionGroup: {
              UNSAFE_className: listStyles['react-spectrum-ListViewItem-actions'],
              isQuiet: true,
              density: 'compact'
            },
            actionMenu: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-actionmenu'], isQuiet: true}
          }}>
          {typeof item.rendered === 'string' ? <Text>{item.rendered}</Text> : item.rendered}
          {isDraggingMultiple &&
            <div className={classNames(listStyles, 'react-spectrum-ListViewItem-badge')}>{itemCount}</div>
          }
        </SlotProvider>
      </Grid>
    </div>
  );
}
