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

import {classNames, useStyleProps} from '@react-spectrum/utils';
import {ClearButton} from '@react-spectrum/button';
import {mergeProps} from '@react-aria/utils';
import React, {useRef} from 'react';
import styles from '@adobe/spectrum-css-temp/components/tags/vars.css';
import {useFocusRing} from '@react-aria/focus';
import {useGridCell} from '@react-aria/grid';
import {useHover} from '@react-aria/interactions';
import {useTag} from '@react-aria/tag';

export function Tag(props) {
  const {
    isDisabled,
    isRemovable,
    item,
    state,
    onRemove,
    ...otherProps
  } = props;
  let {styleProps} = useStyleProps(otherProps);
  let {hoverProps, isHovered} = useHover({isDisabled});
  let {isFocusVisible, focusProps} = useFocusRing({within: true});
  let {clearButtonProps, labelProps, tagProps} = useTag({
    ...props,
    isRemovable,
    isDisabled,
    item,
    onRemove
  }, state);
  // TODO: handle icon (any way to use slots?)

  return (
    <div
      {...styleProps}
      {...mergeProps(tagProps, hoverProps)}
      className={classNames(
        styles,
        'spectrum-Tags-item',
        {
          'is-disabled': isDisabled,
          'focus-ring': isFocusVisible,
          'is-focused': isFocusVisible,
          'spectrum-Tags-item--removable': isRemovable,
          'is-hovered': isHovered
        },
        styleProps.className
      )}>
      <span
        {...mergeProps(focusProps, labelProps)}
        className={classNames(styles, 'spectrum-Tags-itemLabel')}>
        {props.children}
      </span>
      {isRemovable && <TagRemoveButton item={item} state={state} {...clearButtonProps} />}
    </div>
  );
}

function TagRemoveButton(props) {
  let {item, state, ...otherProps} = props;

  let clearBtnRef = useRef();
  let {gridCellProps} = useGridCell({
    node: item.childNodes[1],
    ref: clearBtnRef
  }, state);

  return (
    <span
      {...mergeProps(props, gridCellProps)}
      ref={clearBtnRef}>
      <ClearButton
        focusClassName={classNames(styles, 'focus-ring')}
        UNSAFE_className={classNames(styles, 'spectrum-Tags-itemClearButton')}
        {...otherProps} />
    </span>
  );
}
