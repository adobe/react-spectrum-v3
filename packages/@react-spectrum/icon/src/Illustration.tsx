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
import {filterDOMProps} from '@react-aria/utils';
import React, {ReactElement} from 'react';
import {useSlotProps, useStyleProps} from '@react-spectrum/utils';

export interface IllustrationProps extends DOMProps, AriaLabelingProps, StyleProps {
  /**
   * A screen reader only label for the Illustration.
   */
  'aria-label'?: string,
  /**
   * The content to display. Should be an SVG.
   */
  children: ReactElement<any>,
  /**
   * A slot to place the illustration in.
   * @default 'illustration'
   */
  slot?: string,
  /**
   * Indicates whether the element is exposed to an accessibility API.
   */
  'aria-hidden'?: boolean | 'false' | 'true'
}

export type IllustrationPropsWithoutChildren = Omit<IllustrationProps, 'children'>;

/**
 * Wrapper component for illustrations. Use this to wrap your svg element for a custom illustration.
 */
export function Illustration(props: IllustrationProps): ReactElement {
  props = useSlotProps(props, 'illustration');
  let {
    children,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-hidden': ariaHidden,
    ...otherProps
  } = props;
  let {styleProps} = useStyleProps(otherProps);

  let hasLabel = ariaLabel || ariaLabelledby;

  if (!ariaHidden) {
    ariaHidden = undefined;
  }

  return React.cloneElement(children, {
    ...filterDOMProps(otherProps),
    ...styleProps,
    focusable: 'false',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-hidden': ariaHidden,
    role: hasLabel ? 'img' : undefined
  });
}
