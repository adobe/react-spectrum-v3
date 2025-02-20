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

import {AriaTagProps, useTag} from '@react-aria/tag';
import {classNames, ClearSlots, SlotProvider, useStyleProps} from '@react-spectrum/utils';
import {ClearButton} from '@react-spectrum/button';
import type {ListState} from '@react-stately/list';
import {mergeProps} from '@react-aria/utils';
import React, {ReactElement, useRef} from 'react';
import styles from '@adobe/spectrum-css-temp/components/tags/vars.css';
import {Text} from '@react-spectrum/text';
import {useFocusRing} from '@react-aria/focus';
import {useHover} from '@react-aria/interactions';

export interface SpectrumTagProps<T> extends AriaTagProps<T> {
  state: ListState<T>
}

export function Tag<T>(props: SpectrumTagProps<T>): ReactElement {
  const {
    item,
    state,
    ...otherProps
  } = props;

  // @ts-ignore
  let {styleProps} = useStyleProps(otherProps);
  let {hoverProps, isHovered} = useHover({});
  let {isFocused, isFocusVisible, focusProps} = useFocusRing({within: true});
  let ref = useRef(null);
  let {removeButtonProps, gridCellProps, rowProps, allowsRemoving} = useTag({
    ...props,
    item
  }, state, ref);

  return (
    <div
      {...mergeProps(rowProps, hoverProps, focusProps)}
      className={classNames(
          styles,
          'spectrum-Tag',
        {
          'focus-ring': isFocusVisible,
          'is-focused': isFocused,
          'is-hovered': isHovered,
          'spectrum-Tag--removable': allowsRemoving
        },
          styleProps.className
        )}
      ref={ref}>
      <div
        className={classNames(styles, 'spectrum-Tag-cell')}
        {...gridCellProps}>
        <SlotProvider
          slots={{
            icon: {UNSAFE_className: classNames(styles, 'spectrum-Tag-icon'), size: 'XS'},
            text: {UNSAFE_className: classNames(styles, 'spectrum-Tag-content')},
            avatar: {UNSAFE_className: classNames(styles, 'spectrum-Tag-avatar'), size: 'avatar-size-50'}
          }}>
          {typeof item.rendered === 'string' ? <Text>{item.rendered}</Text> : item.rendered}
          <ClearSlots>
            {allowsRemoving && <TagRemoveButton item={item} {...removeButtonProps} UNSAFE_className={classNames(styles, 'spectrum-Tag-removeButton')} />}
          </ClearSlots>
        </SlotProvider>
      </div>
    </div>
  );
}

function TagRemoveButton(props) {
  let {styleProps} = useStyleProps(props);

  return (
    <span {...styleProps}>
      <ClearButton {...props} />
    </span>
  );
}
