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
import {FocusableElement, ItemDropTarget} from '@react-types/shared';
import React, {DOMAttributes, HTMLAttributes, ReactElement, useRef} from 'react';
import styles from './table.css';
import {useTableContext} from './TableViewBase';
import {useVisuallyHidden} from '@react-aria/visually-hidden';

interface InsertionIndicatorProps {
  target: ItemDropTarget,
  rowProps: HTMLAttributes<HTMLElement> & DOMAttributes<FocusableElement>
}

export function InsertionIndicator(props: InsertionIndicatorProps): ReactElement | null {
  let {dropState, dragAndDropHooks} = useTableContext();
  const {target, rowProps} = props;

  let ref = useRef<HTMLDivElement | null>(null);
  let {dropIndicatorProps} = dragAndDropHooks!.useDropIndicator!(props, dropState!, ref);
  let {visuallyHiddenProps} = useVisuallyHidden();

  let isDropTarget = dropState!.isDropTarget(target);

  if (!isDropTarget && dropIndicatorProps['aria-hidden']) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: typeof rowProps.style?.top === 'number' && typeof rowProps.style?.height === 'number' ? rowProps.style.top + (target.dropPosition === 'after' ? rowProps.style.height : 0) : 0,
        width: rowProps.style?.width
      }}
      role="row"
      aria-hidden={dropIndicatorProps['aria-hidden']}>
      <div
        role="gridcell"
        className={
          classNames(
            styles,
            'react-spectrum-Table-InsertionIndicator',
            {
              'react-spectrum-Table-InsertionIndicator--dropTarget': isDropTarget
            }
        )}>
        <div {...visuallyHiddenProps} role="button" {...dropIndicatorProps} ref={ref} />
      </div>
    </div>
  );
}
