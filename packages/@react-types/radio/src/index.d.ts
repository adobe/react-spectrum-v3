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

import {
  AriaLabelingProps,
  AriaValidationProps,
  DOMProps,
  FocusableProps,
  FocusEvents,
  HelpTextProps,
  InputBase,
  InputDOMProps,
  LabelableProps,
  Orientation,
  SpectrumHelpTextProps,
  SpectrumLabelableProps,
  StyleProps,
  Validation,
  ValueBase
} from '@react-types/shared';
import {ReactElement, ReactNode} from 'react';

export interface RadioGroupProps extends ValueBase<string | number | null, string | number>, InputBase, InputDOMProps, Validation<string | number | null>, LabelableProps, HelpTextProps, FocusEvents {
  /**
   * The axis the Radio Button(s) should align with.
   * @default 'vertical'
   */
  orientation?: Orientation
}

export interface RadioProps extends FocusableProps {
  /**
   * The value of the radio button, used when submitting an HTML form.
   * See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio#Value).
   */
  value: string | number,
  /**
   * The label for the Radio. Accepts any renderable node.
   */
  children?: ReactNode,
  /**
   * Whether the radio button is disabled or not.
   * Shows that a selection exists, but is not available in that circumstance.
   */
  isDisabled?: boolean
}

export interface AriaRadioGroupProps extends RadioGroupProps, DOMProps, AriaLabelingProps, AriaValidationProps {}
export interface SpectrumRadioGroupProps extends AriaRadioGroupProps, SpectrumLabelableProps, StyleProps, SpectrumHelpTextProps {
  /**
   * The Radio(s) contained within the RadioGroup.
   */
  children: ReactElement<RadioProps> | ReactElement<RadioProps>[],
  /**
   * By default, radio buttons are not emphasized (gray).
   * The emphasized (blue) version provides visual prominence.
   */
  isEmphasized?: boolean
}

export interface AriaRadioProps extends RadioProps, DOMProps, AriaLabelingProps {}
export interface SpectrumRadioProps extends AriaRadioProps, StyleProps {}
