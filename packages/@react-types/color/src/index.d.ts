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
  DimensionValue,
  DOMProps,
  FocusableDOMProps,
  FocusableProps,
  InputBase,
  LabelableProps,
  SpectrumLabelableProps,
  StyleProps,
  TextInputBase,
  TextInputDOMProps,
  Validation,
  ValueBase
} from '@react-types/shared';
import {SliderProps} from '@react-types/slider';

/** A list of supported color formats. */
export type ColorFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsb' | 'hsba';

/** A list of color channels. */
export type ColorChannel = 'hue' | 'saturation' | 'brightness' | 'lightness' | 'red' | 'green' | 'blue' | 'alpha';

export interface ColorChannelRange {
  /** The minimum value of the color channel. */
  minValue: number,
  /** The maximum value of the color channel. */
  maxValue: number,
  /** The step value of the color channel, used when incrementing and decrementing. */
  step: number
}

/** Represents a color value. */
export interface Color {
  /** Converts the color to the given color format, and returns a new Color object. */
  toFormat(format: ColorFormat): Color,
  /** Converts the color to a string in the given format. */
  toString(format: ColorFormat | 'css'): string,
  /** Returns a duplicate of the color value. */
  clone(): Color,
  /** Converts the color to hex, and returns an integer representation. */
  toHexInt(): number,
  /**
   * Returns the numeric value for a given channel.
   * Throws an error if the channel is unsupported in the current color format.
   */
  getChannelValue(channel: ColorChannel): number,
  /**
   * Sets the numeric value for a given channel, and returns a new Color object.
   * Throws an error if the channel is unsupported in the current color format.
   */
  withChannelValue(channel: ColorChannel, value: number): Color,
  /**
   * Returns the minimum, maximum, and step values for a given channel.
   */
  getChannelRange(channel: ColorChannel): ColorChannelRange,
  /**
   * Returns a localized color channel name for a given channel and locale,
   * for use in visual or accessibility labels.
   */
  getChannelName(channel: ColorChannel, locale: string): string,
  /**
   * Formats the numeric value for a given channel for display according to the provided locale.
   */
  formatChannelValue(channel: ColorChannel, locale: string): string,
  /**
   * Returns the color space, 'rgb', 'hsb' or 'hsl', for the current color.
   */
  getColorSpace(): ColorFormat,
  /**
   * Returns the difference between the color and a given color using the CIE2000 color difference algorithm, 
   * http://en.wikipedia.org/wiki/Color_difference#CIEDE2000.
   */
  getDeltaE(color:Color): number,
  /**
   * Returns a localized name for the color, for use in visual or accessibility labels.
   */
  getColorName(locale: string): string,
  /**
   * Returns a localized name for the hue, for use in visual or accessibility labels.
   */
  getHueName(locale: string): string
}

export interface ColorFieldProps extends ValueBase<string | Color>, InputBase, Validation, FocusableProps, TextInputBase, LabelableProps {
  /** Handler that is called when the value changes. */
  onChange?: (color: Color) => void,
  /**
   * The step value to increment and decrement the color by when using the arrow keys.
   * @default 1
   */
  step?: number
}

export interface AriaColorFieldProps extends ColorFieldProps, AriaLabelingProps, FocusableDOMProps, Omit<TextInputDOMProps, 'minLength' | 'maxLength' | 'pattern' | 'type' | 'inputMode' | 'autoComplete'>, AriaValidationProps {}

export interface SpectrumColorFieldProps extends AriaColorFieldProps, SpectrumLabelableProps, StyleProps {
  /** Whether the ColorField should be displayed with a quiet style. */
  isQuiet?: boolean
}

export interface ColorWheelProps extends ValueBase<string | Color> {
  /** Whether the ColorWheel is disabled. */
  isDisabled?: boolean,
  /** Handler that is called when the value changes, as the user drags. */
  onChange?: (value: Color) => void,
  /** Handler that is called when the user stops dragging. */
  onChangeEnd?: (value: Color) => void,
  /**
   * The ColorWheel's step value.
   * @default 1
   */
  step?: number,
  /**
   * The default value (uncontrolled).
   * @default 'hsl(0, 100%, 50%)'
   */
  defaultValue?: string | Color
}

export interface AriaColorWheelProps extends ColorWheelProps, DOMProps, AriaLabelingProps {}

export interface SpectrumColorWheelProps extends AriaColorWheelProps, Omit<StyleProps, 'width' | 'height'> {
  /** The outer diameter of the ColorWheel. */
  size?: DimensionValue
}

export interface ColorSliderProps extends Omit<SliderProps<string | Color>, 'minValue' | 'maxValue'> {
  /** The color channel that the slider manipulates. */
  channel: ColorChannel,
  /** Handler that is called when the value changes, as the user drags. */
  onChange?: (value: Color) => void,
  /** Handler that is called when the user stops dragging. */
  onChangeEnd?: (value: Color) => void
}

export interface AriaColorSliderProps extends ColorSliderProps, DOMProps, AriaLabelingProps {}

export interface SpectrumColorSliderProps extends AriaColorSliderProps, StyleProps {
  /** Whether the value label is displayed. True by default if there is a label, false by default if not. */
  showValueLabel?: boolean
}

export interface ColorAreaProps extends ValueBase<string | Color> {
  /** Color channel for the horizontal axis. */
  xChannel?: ColorChannel,
  /** Color channel for the vertical axis. */
  yChannel?: ColorChannel,
  /** Whether the ColorArea is disabled. */
  isDisabled?: boolean,
  /** Handler that is called when the value changes, as the user drags. */
  onChange?: (value: Color) => void,
  /** Handler that is called when the user stops dragging. */
  onChangeEnd?: (value: Color) => void,
  /**
   * The step value for the xChannel.
   * @default 1
   */
  xChannelStep?: number,
   /**
    * The step value for the yChannel.
    * @default 1
    */
  yChannelStep?: number
}

export interface AriaColorAreaProps extends ColorAreaProps, DOMProps, AriaLabelingProps {}


export interface SpectrumColorAreaProps extends AriaColorAreaProps, Omit<StyleProps, 'width' | 'height'> {
  size?: DimensionValue
}
