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

import {ChangeEvent, useCallback, useEffect, useRef} from 'react';
import {ColumnSize} from '@react-types/table';
import {DOMAttributes, FocusableElement, Key, RefObject} from '@react-types/shared';
import {focusSafely, useInteractionModality, useKeyboard, useMove, usePress} from '@react-aria/interactions';
import {getColumnHeaderId} from './utils';
import {GridNode} from '@react-types/grid';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {mergeProps, useDescription, useEffectEvent, useId} from '@react-aria/utils';
import {TableColumnResizeState} from '@react-stately/table';
import {useLocale, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useVisuallyHidden} from '@react-aria/visually-hidden';

export interface TableColumnResizeAria {
  /** Props for the visually hidden input element. */
  inputProps: DOMAttributes,
  /** Props for the resizer element. */
  resizerProps: DOMAttributes,
  /** Whether this column is currently being resized. */
  isResizing: boolean
}

export interface AriaTableColumnResizeProps<T> {
  /** An object representing the [column header](https://www.w3.org/TR/wai-aria-1.1/#columnheader). Contains all the relevant information that makes up the column header. */
  column: GridNode<T>,
  /** Aria label for the hidden input. Gets read when resizing. */
  'aria-label': string,
  /**
   * Ref to the trigger if resizing was started from a column header menu. If it's provided,
   * focus will be returned there when resizing is done. If it isn't provided, it is assumed that the resizer is
   * visible at all time and keyboard resizing is started via pressing Enter on the resizer and not on focus.
   * */
  triggerRef?: RefObject<FocusableElement | null>,
  /** If resizing is disabled. */
  isDisabled?: boolean,
  /** Called when resizing starts. */
  onResizeStart?: (widths: Map<Key, ColumnSize>) => void,
  /** Called for every resize event that results in new column sizes. */
  onResize?: (widths: Map<Key, ColumnSize>) => void,
  /** Called when resizing ends. */
  onResizeEnd?: (widths: Map<Key, ColumnSize>) => void
}

/**
 * Provides the behavior and accessibility implementation for a table column resizer element.
 * @param props - Props for the resizer.
 * @param state - State for the table's resizable columns, as returned by `useTableColumnResizeState`.
 * @param ref - The ref attached to the resizer's visually hidden input element.
 */
export function useTableColumnResize<T>(props: AriaTableColumnResizeProps<T>, state: TableColumnResizeState<T>, ref: RefObject<HTMLInputElement | null>): TableColumnResizeAria {
  let {column: item, triggerRef, isDisabled, onResizeStart, onResize, onResizeEnd, 'aria-label': ariaLabel} = props;
  const stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-aria/table');
  let id = useId();
  let isResizing = state.resizingColumn === item.key;
  let isResizingRef = useRef(isResizing);
  let lastSize = useRef<Map<Key, ColumnSize> | null>(null);
  let wasFocusedOnResizeStart = useRef(false);
  let editModeEnabled = state.tableState.isKeyboardNavigationDisabled;

  let {direction} = useLocale();
  let {keyboardProps} = useKeyboard({
    onKeyDown: (e) => {
      if (editModeEnabled) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'Tab') {
          e.preventDefault();
          endResize(item);
        }
      } else {
        // Continue propagation on keydown events so they still bubbles to useSelectableCollection and are handled there
        e.continuePropagation();

        if (e.key === 'Enter') {
          startResize(item);
        }
      }
    }
  });

  let startResize = useEffectEvent((item) => {
    if (!isResizingRef.current) {
      lastSize.current = state.updateResizedColumns(item.key, state.getColumnWidth(item.key));
      state.startResize(item.key);
      state.tableState.setKeyboardNavigationDisabled(true);
      onResizeStart?.(lastSize.current);
    }
    isResizingRef.current = true;
  });

  let resize = useEffectEvent((item, newWidth) => {
    let sizes = state.updateResizedColumns(item.key, newWidth);
    onResize?.(sizes);
    lastSize.current = sizes;
  });

  let endResize = useEffectEvent((item) => {
    if (isResizingRef.current) {
      if (lastSize.current == null) {
        lastSize.current = state.updateResizedColumns(item.key, state.getColumnWidth(item.key));
      }

      state.endResize();
      state.tableState.setKeyboardNavigationDisabled(false);
      onResizeEnd?.(lastSize.current);
      isResizingRef.current = false;

      if (triggerRef?.current && !wasFocusedOnResizeStart.current) {
        // switch focus back to the column header unless the resizer was already focused when resizing started.
        focusSafely(triggerRef.current);
      }
    }
    lastSize.current = null;
  });

  const columnResizeWidthRef = useRef<number>(0);
  const {moveProps} = useMove({
    onMoveStart() {
      columnResizeWidthRef.current = state.getColumnWidth(item.key);
      startResize(item);
    },
    onMove(e) {
      let {deltaX, deltaY, pointerType} = e;
      if (direction === 'rtl') {
        deltaX *= -1;
      }
      if (pointerType === 'keyboard') {
        if (deltaY !== 0 && deltaX === 0) {
          deltaX = deltaY * -1;
        }
        deltaX *= 10;
      }
      // if moving up/down only, no need to resize
      if (deltaX !== 0) {
        columnResizeWidthRef.current += deltaX;
        resize(item, columnResizeWidthRef.current);
      }
    },
    onMoveEnd(e) {
      let {pointerType} = e;
      columnResizeWidthRef.current = 0;
      if (pointerType === 'mouse' || (pointerType === 'touch' && wasFocusedOnResizeStart.current)) {
        endResize(item);
      }
    }
  });

  let onKeyDown = useCallback((e) => {
    if (editModeEnabled) {
      moveProps.onKeyDown?.(e);
    }
  }, [editModeEnabled, moveProps]);


  let min = Math.floor(state.getColumnMinWidth(item.key));
  let max = Math.floor(state.getColumnMaxWidth(item.key));
  if (max === Infinity) {
    max = Number.MAX_SAFE_INTEGER;
  }
  let value = Math.floor(state.getColumnWidth(item.key));
  let modality: string | null = useInteractionModality();
  if (modality === 'virtual' &&  (typeof window !== 'undefined' && 'ontouchstart' in window)) {
    modality = 'touch';
  }
  let description = triggerRef?.current == null && (modality === 'keyboard' || modality === 'virtual') && !isResizing ? stringFormatter.format('resizerDescription') : undefined;
  let descriptionProps = useDescription(description);
  let ariaProps = {
    'aria-label': ariaLabel,
    'aria-orientation': 'horizontal' as 'horizontal',
    'aria-labelledby': `${id} ${getColumnHeaderId(state.tableState, item.key)}`,
    'aria-valuetext': stringFormatter.format('columnSize', {value}),
    'type': 'range',
    min,
    max,
    value,
    ...descriptionProps
  };

  const focusInput = useCallback(() => {
    if (ref.current) {
      focusSafely(ref.current);
    }
  }, [ref]);

  let resizingColumn = state.resizingColumn;
  let prevResizingColumn = useRef<Key | null>(null);
  useEffect(() => {
    if (prevResizingColumn.current !== resizingColumn && resizingColumn != null && resizingColumn === item.key) {
      wasFocusedOnResizeStart.current = document.activeElement === ref.current;
      startResize(item);
      // Delay focusing input until Android Chrome's delayed click after touchend happens: https://bugs.chromium.org/p/chromium/issues/detail?id=1150073
      let timeout = setTimeout(() => focusInput(), 0);
      // VoiceOver on iOS has problems focusing the input from a menu.
      let VOTimeout = setTimeout(focusInput, 400);
      return () => {
        clearTimeout(timeout);
        clearTimeout(VOTimeout);
      };
    }
    prevResizingColumn.current = resizingColumn;
  }, [resizingColumn, item, focusInput, ref, startResize]);

  let onChange = (e: ChangeEvent<HTMLInputElement>) => {
    let currentWidth = state.getColumnWidth(item.key);
    let nextValue = parseFloat(e.target.value);

    if (nextValue > currentWidth) {
      nextValue = currentWidth + 10;
    } else {
      nextValue = currentWidth - 10;
    }
    resize(item, nextValue);
  };

  let {pressProps} = usePress({
    preventFocusOnPress: true,
    onPressStart: (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || e.pointerType === 'keyboard') {
        return;
      }
      if (e.pointerType === 'virtual' && state.resizingColumn != null) {
        endResize(item);
        return;
      }

      // Sometimes onPress won't trigger for quick taps on mobile so we want to focus the input so blurring away
      // can cancel resize mode for us.
      focusInput();

      // If resizer is always visible, mobile screenreader user can access the visually hidden resizer directly and thus we don't need
      // to handle a virtual click to start the resizer.
      if (e.pointerType !== 'virtual') {
        startResize(item);
      }
    },
    onPress: (e) => {
      if (((e.pointerType === 'touch' && wasFocusedOnResizeStart.current) || e.pointerType === 'mouse') && state.resizingColumn != null) {
        endResize(item);
      }
    }
  });
  let {visuallyHiddenProps} = useVisuallyHidden();

  return {
    resizerProps: mergeProps(
      keyboardProps,
      {...moveProps, onKeyDown},
      pressProps,
      {style: {touchAction: 'none'}}
    ),
    inputProps: mergeProps(
      visuallyHiddenProps,
      {
        id,
        onBlur: () => {
          endResize(item);
        },
        onChange,
        disabled: isDisabled
      },
      ariaProps
    ),
    isResizing
  };
}
