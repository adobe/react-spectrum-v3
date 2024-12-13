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

import {AriaLabelingProps, DOMProps, IconColorValue, StyleProps} from '@react-types/shared';
import {baseStyleProps, classNames, StyleHandlers, useSlotProps, useStyleProps} from '@react-spectrum/utils';
import {filterDOMProps} from '@react-aria/utils';
import React, {ReactElement} from 'react';
import styles from '@adobe/spectrum-css-temp/components/icon/vars.css';
import {useProvider} from '@react-spectrum/provider';

export interface IconProps extends DOMProps, AriaLabelingProps, StyleProps {
  /**
   * A screen reader only label for the Icon.
   */
  'aria-label'?: string,
  /**
   * The content to display. Should be an SVG.
   */
  children: ReactElement<any>,
  /**
   * Size of Icon (changes based on scale).
   */
  size?: 'XXS' | 'XS' | 'S' | 'M' | 'L' |'XL' | 'XXL',
  /**
   * A slot to place the icon in.
   * @default 'icon'
   */
  slot?: string,
  /**
   * Indicates whether the element is exposed to an accessibility API.
   */
  'aria-hidden'?: boolean | 'false' | 'true',
  /**
   * Color of the Icon.
   */
  color?: IconColorValue
}

export type IconPropsWithoutChildren = Omit<IconProps, 'children'>;

function iconColorValue(value: IconColorValue) {
  return `var(--spectrum-semantic-${value}-color-icon)`;
}

const iconStyleProps: StyleHandlers = {
  ...baseStyleProps,
  color: ['color', iconColorValue]
};

/**
 * Spectrum icons are clear, minimal, and consistent across platforms. They follow the focused and rational principles of the design system in both metaphor and style.
 */
export function Icon(props: IconProps) {
  props = useSlotProps(props, 'icon');
  let {
    children,
    size,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    ...otherProps
  } = props;
  let {styleProps} = useStyleProps(otherProps, iconStyleProps);

  let provider = useProvider();
  let scale = 'M';
  if (provider !== null) {
    scale = provider.scale === 'large' ? 'L' : 'M';
  }
  if (!ariaHidden) {
    ariaHidden = undefined;
  }

  // Use user specified size, falling back to provider scale if size is undef
  let iconSize = size ? size : scale;

  return React.cloneElement(children, {
    ...filterDOMProps(otherProps),
    ...styleProps,
    focusable: 'false',
    'aria-label': ariaLabel,
    'aria-hidden': (ariaLabel ? (ariaHidden || undefined) : true),
    role: 'img',
    className: classNames(
      styles,
      children.props.className,
      'spectrum-Icon',
      `spectrum-Icon--size${iconSize}`,
      styleProps.className)
  });
}
