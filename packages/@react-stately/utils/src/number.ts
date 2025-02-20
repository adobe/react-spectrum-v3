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

/**
 * Takes a value and forces it to the closest min/max if it's outside. Also forces it to the closest valid step.
 */
export function clamp(value: number, min: number = -Infinity, max: number = Infinity): number {
  let newValue = Math.min(Math.max(value, min), max);
  return newValue;
}

export function roundToStepPrecision(value: number, step: number): number {
  let roundedValue = value;
  let stepString = step.toString();
  let pointIndex = stepString.indexOf('.');
  let precision = pointIndex >= 0 ? stepString.length - pointIndex : 0;
  if (precision > 0) {
    let pow = Math.pow(10, precision);
    roundedValue = Math.round(roundedValue * pow) / pow;
  }
  return roundedValue;
}

export function snapValueToStep(value: number, min: number | undefined, max: number | undefined, step: number): number {
  min = Number(min);
  max = Number(max);
  let remainder = ((value - (isNaN(min) ? 0 : min)) % step);
  let snappedValue = roundToStepPrecision(Math.abs(remainder) * 2 >= step
    ? value + Math.sign(remainder) * (step - Math.abs(remainder))
    : value - remainder, step);

  if (!isNaN(min)) {
    if (snappedValue < min) {
      snappedValue = min;
    } else if (!isNaN(max) && snappedValue > max) {
      snappedValue = min + Math.floor(roundToStepPrecision((max - min) / step, step)) * step;
    }
  } else if (!isNaN(max) && snappedValue > max) {
    snappedValue = Math.floor(roundToStepPrecision(max / step, step)) * step;
  }

  // correct floating point behavior by rounding to step precision
  snappedValue = roundToStepPrecision(snappedValue, step);

  return snappedValue;
}

/* Takes a value and rounds off to the number of digits. */
export function toFixedNumber(value: number, digits: number, base: number = 10): number {
  const pow = Math.pow(base, digits);

  return Math.round(value * pow) / pow;
}
