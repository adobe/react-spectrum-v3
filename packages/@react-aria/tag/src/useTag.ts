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

import {ButtonHTMLAttributes, KeyboardEvent} from 'react';
import {DOMAttributes} from '@react-types/shared';
import {filterDOMProps, mergeProps, useId} from '@react-aria/utils';
import {GridState} from '@react-stately/grid';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {TagProps} from '@react-types/tag';
import {useGridCell, useGridRow} from '@react-aria/grid';
import {useLocalizedStringFormatter} from '@react-aria/i18n';


export interface TagAria {
  labelProps: DOMAttributes,
  tagProps: DOMAttributes,
  tagRowProps: DOMAttributes,
  clearButtonProps: ButtonHTMLAttributes<HTMLButtonElement>
}

export function useTag(props: TagProps<any>, state: GridState<any, any>): TagAria {
  let {isFocused} = props;
  const {
    allowsRemoving,
    onRemove,
    item,
    tagRef,
    tagRowRef
  } = props;
  const stringFormatter = useLocalizedStringFormatter(intlMessages);
  const removeString = stringFormatter.format('remove');
  const labelId = useId();
  const buttonId = useId();

  let {rowProps} = useGridRow({
    node: item
  }, state, tagRowRef);
  // Don't want the row to be focusable or accessible via keyboard
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let {tabIndex, ...otherRowProps} = rowProps;

  let {gridCellProps} = useGridCell({
    node: [...item.childNodes][0],
    focusMode: 'cell'
  }, state, tagRef);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Delete' || e.key === 'Backspace' || e.key === ' ') {
      onRemove(gridCellProps['data-key']);
      e.preventDefault();
    }
  }
  const pressProps = {
    onPress: () => onRemove?.(gridCellProps['data-key'])
  };

  isFocused = isFocused || state.selectionManager.focusedKey === item.childNodes[0].key;
  let domProps = filterDOMProps(props);
  return {
    clearButtonProps: mergeProps(pressProps, {
      'aria-label': removeString,
      'aria-labelledby': `${buttonId} ${labelId}`,
      id: buttonId
    }),
    labelProps: {
      id: labelId
    },
    tagRowProps: otherRowProps,
    tagProps: mergeProps(domProps, gridCellProps, {
      'aria-errormessage': props['aria-errormessage'],
      'aria-label': props['aria-label'],
      onKeyDown: allowsRemoving ? onKeyDown : null,
      tabIndex: (isFocused || state.selectionManager.focusedKey == null) ? 0 : -1
    })
  };
}
