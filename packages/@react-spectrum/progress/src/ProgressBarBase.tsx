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

import {clamp} from '@react-aria/utils';
import {classNames, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import {DOMRef} from '@react-types/shared';
import {ProgressBarProps, SpectrumProgressBarBaseProps} from '@react-types/progress';
import React, {CSSProperties, HTMLAttributes} from 'react';
import styles from '@adobe/spectrum-css-temp/components/barloader/vars.css';

interface ProgressBarBaseProps extends SpectrumProgressBarBaseProps, ProgressBarProps {
  barClassName?: string,
  barProps?: HTMLAttributes<HTMLDivElement>,
  labelProps?: HTMLAttributes<HTMLLabelElement>
}

// Base ProgressBar component shared with Meter.
function ProgressBarBase(props: ProgressBarBaseProps, ref: DOMRef<HTMLDivElement>) {
  let {
    value = 0,
    minValue = 0,
    maxValue = 100,
    size = 'L',
    label,
    barClassName,
    showValueLabel = !!label,
    labelPosition = 'top',
    isIndeterminate = false,
    barProps,
    labelProps,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    ...otherProps
  } = props;
  let domRef = useDOMRef(ref);
  let {styleProps} = useStyleProps(otherProps);

  value = clamp(value, minValue, maxValue);

  let barStyle: CSSProperties = {};
  if (!isIndeterminate) {
    let percentage = (value - minValue) / (maxValue - minValue);
    barStyle.width = `${Math.round(percentage * 100)}%`;
  }

  if (process.env.NODE_ENV !== 'production') {
  // Ideally this should be in useProgressBar, but children
  // are not supported in ProgressCircle which shares that hook...
    if (!label && !ariaLabel && !ariaLabelledby) {
      console.warn('If you do not provide a visible label via children, you must specify an aria-label or aria-labelledby attribute for accessibility');
    }
  }
  // use inline style for fit-content because cssnano is too smart for us and will strip out the -moz prefix in css files
  return (
    <div
      {...barProps}
      ref={domRef}
      className={
        classNames(
          styles,
          'spectrum-BarLoader',
          {
            'spectrum-BarLoader--small': size === 'S',
            'spectrum-BarLoader--large': size === 'L',
            'spectrum-BarLoader--indeterminate': isIndeterminate,
            'spectrum-BarLoader--sideLabel': labelPosition === 'side'
          },
          barClassName,
          styleProps.className
        )
      }
      style={{minWidth: '-moz-fit-content', ...styleProps.style}}>
      {label &&
        <span
          {...labelProps}
          className={classNames(styles, 'spectrum-BarLoader-label')}>
            {label}
        </span>
      }
      {showValueLabel && barProps && 
        <div className={classNames(styles, 'spectrum-BarLoader-percentage')}>
          {barProps['aria-valuetext']}
        </div>
      }
      <div className={classNames(styles, 'spectrum-BarLoader-track')}>
        <div
          className={classNames(styles, 'spectrum-BarLoader-fill')}
          style={barStyle} />
      </div>
    </div>
  );
}

let _ProgressBarBase = React.forwardRef(ProgressBarBase);
export {_ProgressBarBase as ProgressBarBase};
