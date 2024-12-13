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

import {AriaLabelingProps, DOMProps, StyleProps} from '@react-types/shared';
import {classNames, useSlotProps, useStyleProps} from '@react-spectrum/utils';
import {filterDOMProps} from '@react-aria/utils';
import React, {ReactElement} from 'react';
import styles from '@adobe/spectrum-css-temp/components/icon/vars.css';
import {useProvider} from '@react-spectrum/provider';

export interface UIIconProps extends DOMProps, AriaLabelingProps, StyleProps {
  children: ReactElement<any>,
  slot?: string,
  /**
   * Indicates whether the element is exposed to an accessibility API.
   */
  'aria-hidden'?: boolean | 'false' | 'true'
}

export type UIIconPropsWithoutChildren = Omit<UIIconProps, 'children'>;

export function UIIcon(props: UIIconProps) {
  props = useSlotProps(props, 'icon');
  let {
    children,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    ...otherProps
  } = props;

  let {styleProps} = useStyleProps(otherProps);
  let provider = useProvider();
  let scale = 'M';
  if (provider !== null) {
    scale = provider.scale === 'large' ? 'L' : 'M';
  }

  if (!ariaHidden) {
    ariaHidden = undefined;
  }

  return React.cloneElement(children, {
    ...filterDOMProps(otherProps),
    ...styleProps,
    scale,
    focusable: 'false',
    'aria-label': ariaLabel,
    'aria-hidden': (ariaLabel ? (ariaHidden || undefined) : true),
    role: 'img',
    className: classNames(
      styles,
      children.props.className,
      'spectrum-Icon',
      {
        [`spectrum-UIIcon-${children.type['displayName']}`]: children.type['displayName']
      },
      styleProps.className)
  });
}
