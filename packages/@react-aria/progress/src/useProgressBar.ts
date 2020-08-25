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

import {AriaProgressBarProps} from '@react-types/progress';
import {clamp, filterDOMProps, mergeProps} from '@react-aria/utils';
import {HTMLAttributes} from 'react';
import {useLabel} from '@react-aria/label';
import {useNumberFormatter} from '@react-aria/i18n';

interface ProgressBarAria {
  /** Props for the progress bar container element. */
  progressBarProps: HTMLAttributes<HTMLElement>,
  /** Props for the progress bar's visual label element (if any). */
  labelProps: HTMLAttributes<HTMLElement>
}

/**
 * Provides the accessibility implementation for a progress bar component.
 * Progress bars show either determinate or indeterminate progress of an operation
 * over time.
 */
export function useProgressBar(props: AriaProgressBarProps): ProgressBarAria {
  let {
    value = 0,
    minValue = 0,
    maxValue = 100,
    valueLabel,
    isIndeterminate,
    formatOptions = {
      style: 'percent'
    }
  } = props;

  let domProps = filterDOMProps(props, {labelable: true, propNames: new Set(['aria-hidden'])});
  let {labelProps, fieldProps} = useLabel({
    ...props,
    // Progress bar is not an HTML input element so it
    // shouldn't be labeled by a <label> element.
    labelElementType: 'span'
  });

  value = clamp(value, minValue, maxValue);
  let percentage = (value - minValue) / (maxValue - minValue);
  let formatter = useNumberFormatter(formatOptions);

  if (!isIndeterminate && !valueLabel) {
    let valueToFormat = formatOptions.style === 'percent' ? percentage : value;
    valueLabel = formatter.format(valueToFormat);
  }

  return {
    progressBarProps: mergeProps(domProps, {
      ...fieldProps,
      'aria-valuenow': isIndeterminate ? undefined : value,
      'aria-valuemin': minValue,
      'aria-valuemax': maxValue,
      'aria-valuetext': isIndeterminate ? undefined : valueLabel as string,
      role: 'progressbar'
    }),
    labelProps
  };
}
