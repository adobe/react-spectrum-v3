/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {classNames, dimensionValue, useDOMRef, useSlotProps, useStyleProps} from '@react-spectrum/utils';
import {DOMRef} from '@react-types/shared';
import {filterDOMProps} from '@react-aria/utils';
import React, {forwardRef} from 'react';
import {SpectrumAvatarProps} from '@react-types/avatar';
import styles from '@adobe/spectrum-css-temp/components/avatar/vars.css';
import {useProviderProps} from '@react-spectrum/provider';

const DEFAULT_SIZE = 'avatar-size-100';
const SIZE_RE = /^size-\d+/;

function Avatar(props: SpectrumAvatarProps, ref: DOMRef<HTMLImageElement>) {
  props = useSlotProps(props, 'avatar');
  const {
    alt = '',
    isDisabled,
    size,
    src,
    ...otherProps
  } = useProviderProps(props);

  const {styleProps} = useStyleProps(otherProps);
  const domRef = useDOMRef(ref);

  const domProps = filterDOMProps(otherProps);

  // Casting `size` as `any` since `isNaN` expects a `number`, but we want it
  // to handle `string` numbers; e.g. '300' as opposed to 300
  const sizeValue = typeof size !== 'number' && (SIZE_RE.test(size) || !isNaN(size as any))
    ? dimensionValue(DEFAULT_SIZE) // override disallowed size values
    : dimensionValue(size || DEFAULT_SIZE);

  return (
    <img
      {...styleProps}
      {...domProps}
      alt={alt}
      className={classNames(
        styles,
        'spectrum-Avatar',
        {
          'is-disabled': isDisabled
        },
        styleProps.className)}
      ref={domRef}
      src={src}
      style={{
        ...styleProps.style,
        ...(sizeValue && {height: sizeValue, width: sizeValue})
      }} />
  );
}

/**
 * An avatar is a thumbnail representation of an entity, such as a user or an organization.
 */
const _Avatar = forwardRef(Avatar);
export {_Avatar as Avatar};
