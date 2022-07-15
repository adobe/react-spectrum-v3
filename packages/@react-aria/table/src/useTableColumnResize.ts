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

import {ChangeEvent, HTMLAttributes, RefObject, useRef} from 'react';
import {ColumnResizeState, TableState} from '@react-stately/table';
import {focusSafely} from '@react-aria/focus';
import {GridNode} from '@react-types/grid';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {mergeProps} from '@react-aria/utils';
import {useKeyboard, useMove} from '@react-aria/interactions';
import {useLocale, useMessageFormatter} from '@react-aria/i18n';

interface ResizerAria {
  resizerProps: HTMLAttributes<HTMLElement>
}

interface ResizerProps<T> {
  column: GridNode<T>,
  showResizer: boolean,
  label: string,
  triggerRef: RefObject<HTMLDivElement>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useTableColumnResize<T>(props: ResizerProps<T>, state: TableState<T> & ColumnResizeState<T>, ref: RefObject<HTMLDivElement>): ResizerAria {
  let {column: item, showResizer, triggerRef} = props;
  const stateRef = useRef(null);
  // keep track of what the cursor on the body is so it can be restored back to that when done resizing
  const cursor = useRef(null);
  stateRef.current = state;
  const formatMessage = useMessageFormatter(intlMessages);

  let {direction} = useLocale();
  let {keyboardProps} = useKeyboard({
    onKeyDown: (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'Tab') {
        e.preventDefault();
        // switch focus back to the column header on anything that ends edit mode
        focusSafely(triggerRef.current);
      }
    }
  });

  const columnResizeWidthRef = useRef(null);
  const {moveProps} = useMove({
    onMoveStart() {
      columnResizeWidthRef.current = stateRef.current.getColumnWidth(item.key);
      cursor.current = document.body.style.cursor;
    },
    onMove({deltaX, pointerType}) {
      if (direction === 'rtl') {
        deltaX *= -1;
      }
      // if moving up/down only, no need to resize
      if (deltaX !== 0) {
        if (pointerType === 'keyboard') {
          deltaX *= 10;
        }
        columnResizeWidthRef.current += deltaX;
        stateRef.current.onColumnResize(item, columnResizeWidthRef.current);
        if (stateRef.current.getColumnMinWidth(item.key) >= stateRef.current.getColumnWidth(item.key)) {
          document.body.style.setProperty('cursor', direction === 'rtl' ? 'w-resize' : 'e-resize');
        } else if (stateRef.current.getColumnMaxWidth(item.key) <= stateRef.current.getColumnWidth(item.key)) {
          document.body.style.setProperty('cursor', direction === 'rtl' ? 'e-resize' : 'w-resize');
        } else {
          document.body.style.setProperty('cursor', 'col-resize');
        }
      }
    },
    onMoveEnd() {
      columnResizeWidthRef.current = 0;
      document.body.style.cursor = cursor.current;
    }
  });

  let ariaProps = {
    'aria-label': props.label,
    'aria-orientation': 'horizontal',
    'aria-labelledby': item.key,
    'aria-valuenow': Math.floor(stateRef.current.getColumnWidth(item.key)),
    'aria-valuetext': formatMessage('columnSize', {value: Math.floor(stateRef.current.getColumnWidth(item.key))}),
    'aria-valuemin': stateRef.current.getColumnMinWidth(item.key),
    'aria-valuemax': 10000,
    min: stateRef.current.getColumnMinWidth(item.key),
    max: 10000,
    value: stateRef.current.getColumnWidth(item.key)
  };


  let onChange = (e: ChangeEvent<HTMLInputElement>) => {
    let currentWidth = stateRef.current.getColumnWidth(item.key);
    let nextValue = parseFloat(e.target.value);

    if (nextValue > currentWidth) {
      nextValue = currentWidth + 10;
    } else {
      nextValue = currentWidth - 10;

    }
    stateRef.current.onColumnResize(item, nextValue);
  };

  return {
    resizerProps: {
      ...mergeProps(
        moveProps,
        {
          onFocus: () => {
            // useMove calls onMoveStart for every keypress, but we want resize start to only be called when we start resize mode
            // call instead during focus and blur
            stateRef.current.onColumnResizeStart(item);
            state.setKeyboardNavigationDisabled(true);
          },
          onBlur: () => {
            stateRef.current.onColumnResizeEnd(item);
            state.setKeyboardNavigationDisabled(false);
          },
          tabIndex: showResizer ? 0 : undefined
        },
        keyboardProps,
        ariaProps,
        {onChange}
      )
    }
  };
}
