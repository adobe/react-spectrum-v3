/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {classNames} from '@react-spectrum/utils';
import {Flex} from '@react-spectrum/layout';
import React, {ReactElement} from 'react';
import styles from '@adobe/spectrum-css-temp/components/table/vars.css';
import stylesOverrides from './table.css';

interface DragPreviewProps {
  itemText: string,
  itemCount: number,
  height: number,
  maxWidth: number
}

export function DragPreview(props: DragPreviewProps): ReactElement {
  let {
    itemText,
    itemCount,
    height,
    maxWidth
  } = props;
  let isDraggingMultiple = itemCount > 1;
  return (
    <Flex
      justifyContent="space-between"
      height={height}
      maxWidth={maxWidth}
      UNSAFE_className={
        classNames(
          styles,
          'spectrum-Table-row',
          classNames(
            stylesOverrides,
            'react-spectrum-Table-row',
            'react-spectrum-Table-row-dragPreview',
            {'react-spectrum-Table-row-dragPreview--multiple': isDraggingMultiple}
          )
        )
      }>
      <div
        className={
        classNames(
          styles,
          'spectrum-Table-cell',
          classNames(
            stylesOverrides,
            'react-spectrum-Table-cell'
          )
        )
      }>
        <span
          className={
            classNames(
              styles,
              'spectrum-Table-cellContents'
            )
        }>
          {itemText}
        </span>
      </div>
      {isDraggingMultiple &&
        <div className={classNames(stylesOverrides, 'react-spectrum-Table-row-badge')}>{itemCount}</div>
      }
    </Flex>
  );
}
