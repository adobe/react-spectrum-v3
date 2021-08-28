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

import {Color, ColorWheelProps} from '@react-types/color';
import {parseColor} from './Color';
import {snapValueToStep, useControlledState} from '@react-stately/utils';
import {useRef, useState} from 'react';

export interface ColorWheelState {
  /** The current color value represented by the color wheel. */
  readonly value: Color,
  /** Sets the color value represented by the color wheel, and triggers `onChange`. */
  setValue(value: string | Color): void,

  /** The current value of the hue channel displayed by the color wheel. */
  readonly hue: number,
  /** Sets the hue channel of the current color value and triggers `onChange`. */
  setHue(value: number): void,

  /** Sets the hue channel of the current color value based on the given coordinates and radius of the color wheel, and triggers `onChange`. */
  setHueFromPoint(x: number, y: number, radius: number): void,
  /** Returns the coordinates of the thumb relative to the center point of the color wheel. */
  getThumbPosition(radius: number): {x: number, y: number},

  /** Increments the hue by the given amount (defaults to 1). */
  increment(minStepSize?: number): void,
  /** Decrements the hue by the given amount (defaults to 1). */
  decrement(minStepSize?: number): void,

  /** Whether the color wheel is currently being dragged. */
  readonly isDragging: boolean,
  /** Sets whether the color wheel is being dragged. */
  setDragging(value: boolean): void,
  /** Returns the color that should be displayed in the color wheel instead of `value`. */
  getDisplayColor(): Color
}

function normalizeColor(v: string | Color) {
  if (typeof v === 'string') {
    return parseColor(v);
  } else {
    return v;
  }
}

const DEFAULT_COLOR = parseColor('hsl(0, 100%, 50%)');

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function roundDown(v: number) {
  let r = Math.floor(v);
  if (r === v) {
    return v - 1;
  } else {
    return r;
  }
}

function degToRad(deg: number) {
  return deg * Math.PI / 180;
}

function radToDeg(rad: number) {
  return rad * 180 / Math.PI;
}

// 0deg = 3 o'clock. increases clockwise
function angleToCartesian(angle: number, radius: number): {x: number, y: number} {
  let rad = degToRad(360 - angle + 90);
  let x = Math.sin(rad) * (radius);
  let y = Math.cos(rad) * (radius);
  return {x, y};
}

function cartesianToAngle(x: number, y: number, radius: number): number {
  let deg = radToDeg(Math.atan2(y / radius, x / radius));
  return (deg + 360) % 360;
}

/**
 * Provides state management for a color wheel component.
 * Color wheels allow users to adjust the hue of an HSL or HSB color value on a circular track.
 */
export function useColorWheelState(props: ColorWheelProps): ColorWheelState {
  let {defaultValue, onChange, onChangeEnd, step = 1} = props;

  if (!props.value && !defaultValue) {
    defaultValue = DEFAULT_COLOR;
  }

  let [value, setValue] = useControlledState(normalizeColor(props.value), normalizeColor(defaultValue), onChange);
  let valueRef = useRef(value);
  valueRef.current = value;

  let [isDragging, setDragging] = useState(false);

  let hue = value.getChannelValue('hue');
  function setHue(v: number) {
    if (v > 360) {
      // Make sure you can always get back to 0.
      v = 0;
    }
    v = roundToStep(mod(v, 360), step);
    if (hue !== v) {
      setValue(value.withChannelValue('hue', v));
    }
  }

  return {
    value,
    setValue(v) {
      let color = normalizeColor(v);
      valueRef.current = color;
      setValue(color);
    },
    hue,
    setHue,
    setHueFromPoint(x, y, radius) {
      setHue(cartesianToAngle(x, y, radius));
    },
    getThumbPosition(radius) {
      return angleToCartesian(value.getChannelValue('hue'), radius);
    },
    increment(minStepSize: number = 0) {
      let newValue = hue + Math.max(minStepSize, step);
      if (newValue > 360) {
        // Make sure you can always get back to 0.
        newValue = 0;
      }
      if (minStepSize > step) {
        let {minValue, maxValue} = value.getChannelRange('hue');
        newValue = snapValueToStep(newValue, minValue, maxValue, minStepSize);
      }
      setHue(newValue);
    },
    decrement(minStepSize: number = 0) {
      let s = Math.max(minStepSize, step);

      // We can't just subtract step because this might be the case:
      // |(previous step) - 0| < step size
      let newValue = hue === 0 ? roundDown(360 / s) * s : hue - s;
      if (minStepSize > step) {
        let {minValue, maxValue} = value.getChannelRange('hue');
        newValue = snapValueToStep(newValue, minValue, maxValue, minStepSize);
      }
      setHue(newValue);
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
    getDisplayColor() {
      return value.toFormat('hsl').withChannelValue('saturation', 100).withChannelValue('lightness', 50).withChannelValue('alpha', 1);
    }
  };
}
