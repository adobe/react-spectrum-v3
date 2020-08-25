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

import {AriaLabelingProps, DOMProps, LabelPosition, StyleProps} from '@react-types/shared';
import {ReactNode} from 'react';

interface ProgressBaseProps {
  /**
   * The current value (controlled).
   * @default 0
   */
  value?: number,
  /**
   * The smallest value allowed for the input.
   * @default 0
   */
  minValue?: number,
  /**
   * The largest value allowed for the input.
   * @default 100
   */
  maxValue?: number
}

export interface ProgressBarBaseProps extends ProgressBaseProps {
  /** The content to display as the label. */
  label?: ReactNode,
  /** Whether the value's label is displayed. True by default if there's a label, false by default if not. */
  showValueLabel?: boolean,
  /**
   * The display format of the value label.
   * @default {style: 'percent'}
   */
  formatOptions?: Intl.NumberFormatOptions,
  /** The content to display as the value's label (e.g. 1 of 4). */
  valueLabel?: ReactNode
}

export interface AriaProgressBarBaseProps extends ProgressBarBaseProps, DOMProps, AriaLabelingProps {}

export interface ProgressBarProps extends ProgressBarBaseProps {
  /**
   * Whether presentation is indeterminate when progress isn't known.
   */
  isIndeterminate?: boolean
}

export interface AriaProgressBarProps extends ProgressBarProps, DOMProps, AriaLabelingProps {}

export interface ProgressCircleProps extends ProgressBaseProps {
  /**
   * Whether presentation is indeterminate when progress isn't known.
   */
  isIndeterminate?: boolean
}

export interface AriaProgressCircleProps extends ProgressCircleProps, DOMProps, AriaLabelingProps {
  /**
   * Whether the ProgressCircle should be hidden from assistive technology.
   */
  'aria-hidden'?: boolean
}
export interface SpectrumProgressCircleProps extends AriaProgressCircleProps, StyleProps {
  /**
   * What the ProgressCircle's diameter should be.
   * @default 'M'
   */
  size?: 'S' | 'M' | 'L',
  /** The [visual style](https://spectrum.adobe.com/page/progress-circle/#Over-background-variant) of the ProgressCircle. */
  variant?: 'overBackground'
}

export interface SpectrumProgressBarBaseProps extends AriaProgressBarBaseProps, StyleProps {
  /**
   * How thick the bar should be.
   * @default 'L'
   */
  size?: 'S' | 'L',
  /**
   * The label's overall position relative to the element it is labeling.
   * @default 'top'
   */
  labelPosition?: LabelPosition
}

export interface SpectrumProgressBarProps extends SpectrumProgressBarBaseProps, ProgressBarProps {
  /** The [visual style](https://spectrum.adobe.com/page/progress-bar/#Over-background-variant) of the ProgressBar. */
  variant?: 'overBackground'
}
