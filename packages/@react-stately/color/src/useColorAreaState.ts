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

import {clamp, snapValueToStep} from '@react-aria/utils';
import {Color, ColorAreaProps, ColorChannel} from '@react-types/color';
import {parseColor} from './Color';
import {useControlledState} from '@react-stately/utils';
import {useRef, useState} from 'react';

export interface ColorAreaState {
  /** The current color value displayed by the color area. */
  readonly value: Color,
  /** Sets the current color value. If a string is passed, it will be parsed to a Color. */
  setValue(value: string | Color): void,

  /** The current value of the horizontal axis channel displayed by the color area. */
  xValue: number,
  /** Sets the value for the horizontal axis channel displayed by the color area, and triggers `onChange`. */
  setXValue(value: number): void,

  /** The current value of the vertical axis channel displayed by the color area. */
  yValue: number,
  /** Sets the value for the vertical axis channel displayed by the color area, and triggers `onChange`. */
  setYValue(value: number): void,

  /** Sets the x and y channels of the current color value based on a percentage of the width and height of the color area, and triggers `onChange`. */
  setColorFromPoint(x: number, y: number): void,
  /** Returns the coordinates of the thumb relative to the upper left corner of the color area as a percentage. */
  getThumbPosition(): {x: number, y: number},

  /** Increments the value of the horizontal axis channel by the given amount (defaults to 1). */
  incrementX(minStepSize?: number): void,
  /** Decrements the value of the horizontal axis channel by the given amount (defaults to 1). */
  decrementX(minStepSize?: number): void,

  /** Increments the value of the vertical axis channel by the given amount (defaults to 1). */
  incrementY(minStepSize?: number): void,
  /** Decrements the value of the vertical axis channel by the given amount (defaults to 1). */
  decrementY(minStepSize?: number): void,

  /** Whether the color area is currently being dragged. */
  readonly isDragging: boolean,
  /** Sets whether the color area is being dragged. */
  setDragging(value: boolean): void,

  /** Returns the xChannel, yChannel and zChannel names based on the color value. */
  getChannels(): {xChannel: ColorChannel, yChannel: ColorChannel, zChannel: ColorChannel},

  /** Returns the color that should be displayed in the color area thumb instead of `value`. */
  getDisplayColor(): Color
}

function normalizeColor(v: string | Color) {
  if (typeof v === 'string') {
    return parseColor(v);
  } else {
    return v;
  }
}

const DEFAULT_COLOR = parseColor('hsb(0, 100%, 100%)');

/**
 * Provides state management for a color area component.
 * Color area allows users to adjust two channels of an HSL, HSB or RGB color value against a two-dimensional gradient background.
 */
export function useColorAreaState(props: ColorAreaProps): ColorAreaState {
  let {value, defaultValue, xChannel, yChannel, onChange, onChangeEnd, xChannelStep = 1, yChannelStep = 1} = props;

  if (!value && !defaultValue) {
    defaultValue = DEFAULT_COLOR;
  }

  let [color, setColor] = useControlledState(value && normalizeColor(value), defaultValue && normalizeColor(defaultValue), onChange);
  let valueRef = useRef(color);
  valueRef.current = color;

  let getChannels = () => {
    // determine the color space from the color value
    let colorSpace = valueRef.current.getColorSpace();
    let zChannel: ColorChannel;
    let xyChannels: Array<ColorChannel>;

    if (colorSpace === 'rgb') {
      if (!xChannel) {
        switch (yChannel) {
          case 'red':
          case 'green':
            xChannel = 'blue';
            break;
          case 'blue':
            xChannel = 'red';
            break;
          default:
            xChannel = 'blue';
            yChannel = 'green';
        }
      } else if (!yChannel) {
        switch (xChannel) {
          case 'red':
            yChannel = 'green';
            break;
          case 'blue':
            yChannel = 'red';
            break;
          default: 
            xChannel = 'blue';
            yChannel = 'green';
        }
      }
      xyChannels = [xChannel, yChannel];
      if (xyChannels.includes('red')) {
        zChannel = xyChannels.includes('green') ? 'blue' : 'green';
      } else if (xyChannels.includes('green')) {
        zChannel = xyChannels.includes('blue') ? 'red' : 'blue';
      } else if (xyChannels.includes('blue')) {
        zChannel = xyChannels.includes('green') ? 'red' : 'green';
      }
    } else if (colorSpace === 'hsb') {
      if (!xChannel) {
        switch (yChannel) {
          case 'hue':
            xChannel = 'brightness';
            break;
          case 'brightness':
            xChannel = 'saturation';
            break;
          default:
            xChannel = 'saturation';
            yChannel = 'brightness';
            break;
        }
      } else if (!yChannel) {
        switch (xChannel) {
          case 'hue':
            yChannel = 'brightness';
            break;
          case 'brightness':
            yChannel = 'saturation';
            break;
          default:
            xChannel = 'saturation';
            yChannel = 'brightness';
            break;
        }
      }
      xyChannels = [xChannel, yChannel];
      if (xyChannels.includes('hue')) {
        zChannel = xyChannels.includes('saturation') ? 'brightness' : 'saturation';
      } else if (xyChannels.includes('saturation')) {
        zChannel = xyChannels.includes('hue') ? 'brightness' : 'hue';
      } else if (xyChannels.includes('brightness')) {
        zChannel = xyChannels.includes('hue') ? 'saturation' : 'hue';
      }
    } else if (colorSpace === 'hsl') {
      if (!xChannel) {
        switch (yChannel) {
          case 'hue':
            xChannel = 'lightness';
            break;
          case 'lightness':
            xChannel = 'saturation';
          default:
            xChannel = 'saturation';
            yChannel = 'lightness';
            break;
        }
      } else if (!yChannel) {
        switch (xChannel) {
          case 'hue':
            yChannel = 'lightness';
            break;
          case 'lightness':
            yChannel = 'saturation';
          default:
            xChannel = 'saturation';
            yChannel = 'lightness';
            break;
        }
      }
      xyChannels = [xChannel, yChannel];
      if (xyChannels.includes('hue')) {
        zChannel = xyChannels.includes('saturation') ? 'lightness' : 'saturation';
      } else if (xyChannels.includes('saturation')) {
        zChannel = xyChannels.includes('hue') ? 'lightness' : 'hue';
      } else if (xyChannels.includes('lightness')) {
        zChannel = xyChannels.includes('hue') ? 'saturation' : 'hue';
      }
    }

    return {xChannel, yChannel, zChannel};
  };

  let channels = getChannels();
  if (!xChannel || !yChannel) {
    xChannel = channels.xChannel;
    yChannel = channels.yChannel;
  }

  let [isDragging, setDragging] = useState(false);

  let xValue = color.getChannelValue(xChannel);
  let yValue = color.getChannelValue(yChannel);
  let setXValue = (v: number) => setColor(color.withChannelValue(xChannel, v));
  let setYValue = (v: number) => setColor(color.withChannelValue(yChannel, v));

  return {
    value: color,
    setValue(value) {
      let c = normalizeColor(value);
      valueRef.current = c;
      setColor(c);
    },
    xValue,
    setXValue,
    yValue,
    setYValue,
    setColorFromPoint(x: number, y: number) {
      let {minValue: minValueX, maxValue: maxValueX} = color.getChannelRange(xChannel);
      let {minValue: minValueY, maxValue: maxValueY} = color.getChannelRange(yChannel);
      let newXValue = minValueX + clamp(x, 0, 1) * (maxValueX - minValueX);
      let newYValue = minValueY + (1 - clamp(y, 0, 1)) * (maxValueY - minValueY);
      let newColor:Color;
      if (newXValue !== xValue) {
        // Round new value to multiple of step, clamp value between min and max
        newXValue = snapValueToStep(newXValue, minValueX, maxValueX, xChannelStep);
        newColor = color.withChannelValue(xChannel, newXValue);
      }
      if (newYValue !== yValue) {
        // Round new value to multiple of step, clamp value between min and max
        newYValue = snapValueToStep(newYValue, minValueY, maxValueY, yChannelStep);
        newColor = (newColor || color).withChannelValue(yChannel, newYValue);
      }
      if (newColor) {
        setColor(newColor);
      }
    },
    getThumbPosition() {
      let {minValue, maxValue} = color.getChannelRange(xChannel);
      let {minValue: minValueY, maxValue: maxValueY} = color.getChannelRange(yChannel);
      let x = (xValue - minValue) / (maxValue - minValue);
      let y = 1 - (yValue - minValueY) / (maxValueY - minValueY);
      return {x, y};
    },
    incrementX(minStepSize: number = 0) {
      let s = Math.max(minStepSize, xChannelStep);
      let {maxValue} = color.getChannelRange(xChannel);
      if (xValue < maxValue) {
        setXValue(Math.min(xValue + s, maxValue));
      }
    },
    incrementY(minStepSize: number = 0) {
      let s = Math.max(minStepSize, yChannelStep);
      let {maxValue} = color.getChannelRange(yChannel);
      if (yValue < maxValue) {
        setYValue(Math.min(yValue + s, maxValue));
      }
    },
    decrementX(minStepSize: number = 0) {
      let s = Math.max(minStepSize, xChannelStep);
      let {minValue} = color.getChannelRange(xChannel);
      if (xValue > minValue) {
        setXValue(Math.max(xValue - s, minValue));
      }
    },
    decrementY(minStepSize: number = 0) {
      let s = Math.max(minStepSize, yChannelStep);
      let {minValue} = color.getChannelRange(yChannel);
      if (yValue > minValue) {
        setYValue(Math.max(yValue - s, minValue));
      }
    },
    setDragging(isDragging) {
      setDragging(wasDragging => {
        if (onChangeEnd && !isDragging && wasDragging) {
          onChangeEnd(valueRef.current);
        }

        return isDragging;
      });
    },
    isDragging,
    getChannels,
    getDisplayColor() {
      return color.withChannelValue('alpha', 1);
    }
  };
}
