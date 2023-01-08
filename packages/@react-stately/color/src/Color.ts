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

import {clamp, toFixedNumber} from '@react-stately/utils';
import {ColorAxes, ColorChannel, ColorChannelRange, ColorFormat, Color as IColor} from '@react-types/color';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {LocalizedStringDictionary} from '@internationalized/string';
import {NumberFormatter} from '@internationalized/number';

const strings = new LocalizedStringDictionary(intlMessages);

/** Parses a color from a string value. Throws an error if the string could not be parsed. */
export function parseColor(value: string): IColor {
  let res = RGBColor.parse(value) || HSBColor.parse(value) || HSLColor.parse(value);
  if (res) {
    return res;
  }

  throw new Error('Invalid color value: ' + value);
}

export function normalizeColor(v: string | IColor) {
  if (typeof v === 'string') {
    return parseColor(v);
  } else {
    return v;
  }
}

abstract class Color implements IColor {
  abstract toFormat(format: ColorFormat): IColor;
  abstract toString(format: ColorFormat | 'css'): string;
  abstract clone(): IColor;
  abstract getChannelRange(channel: ColorChannel): ColorChannelRange;
  abstract formatChannelValue(channel: ColorChannel, locale: string): string;

  toHexInt(): number {
    return this.toFormat('rgb').toHexInt();
  }

  getChannelValue(channel: ColorChannel): number {
    if (channel in this) {
      return this[channel];
    }

    throw new Error('Unsupported color channel: ' + channel);
  }

  withChannelValue(channel: ColorChannel, value: number): IColor {
    if (channel in this) {
      let x = this.clone();
      x[channel] = value;
      return x;
    }

    throw new Error('Unsupported color channel: ' + channel);
  }

  getChannelName(channel: ColorChannel, locale: string) {
    return strings.getStringForLocale(channel, locale);
  }

  abstract getColorSpace(): ColorFormat
  getColorSpaceAxes(xyChannels: {xChannel?: ColorChannel, yChannel?: ColorChannel}): ColorAxes {
    let {xChannel, yChannel} = xyChannels;
    let xCh = xChannel || this.getColorChannels().find(c => c !== yChannel);
    let yCh = yChannel || this.getColorChannels().find(c => c !== xCh);
    let zCh = this.getColorChannels().find(c => c !== xCh && c !== yCh);

    return {xChannel: xCh, yChannel: yCh, zChannel: zCh};
  }
  abstract getColorChannels(): [ColorChannel, ColorChannel, ColorChannel]
}
class RGBColor extends Color {
  constructor(private red: number, private green: number, private blue: number, private alpha: number = 1) {
    super();
  }

  static parse(value: string) {
    let colors = [];
    // matching #rgb, #rgba, #rrggbb, #rrggbbaa
    if (/^#[\da-f]+$/i.test(value) && [4, 5, 7, 9].includes(value.length)) {
      const values = (value.length < 6 ? value.replace(/[^#]/gi, '$&$&') : value).slice(1).split('');
      while (values.length > 0) {
        colors.push(parseInt(values.splice(0, 2).join(''), 16));
      }
      colors[3] = colors[3] !== undefined ? colors[3] / 255 : 1;
    }

    // matching rgb(rrr, ggg, bbb), rgba(rrr, ggg, bbb, 0.a)
    const match = value.match(/^rgba?\((.*)\)$/);
    if (match?.[1]) {
      colors = match[1].split(',').map(value => Number(value.trim()));
      colors = colors.map((num, i) => clamp(num, 0, i < 3 ? 255 : 1));
    }

    return colors.length < 3 ? undefined : new RGBColor(colors[0], colors[1], colors[2], colors[3] ?? 1);
  }


  toString(format: ColorFormat | 'css') {
    switch (format) {
      case 'hex':
        return '#' + (this.red.toString(16).padStart(2, '0') + this.green.toString(16).padStart(2, '0') + this.blue.toString(16).padStart(2, '0')).toUpperCase();
      case 'hexa':
        return '#' + (this.red.toString(16).padStart(2, '0') + this.green.toString(16).padStart(2, '0') + this.blue.toString(16).padStart(2, '0') + Math.round(this.alpha * 255).toString(16).padStart(2, '0')).toUpperCase();
      case 'rgb':
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
      case 'css':
      case 'rgba':
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
      case undefined:
        return this.toString('rgba');
      default:
        return this.toFormat(format).toString(format);
    }
  }

  toFormat(format: ColorFormat): IColor {
    switch (format) {
      case 'hex':
      case 'hexa':
      case 'rgb':
      case 'rgba':
        return this;
      case 'hsb':
      case 'hsba':
        return this.toHSB();
      case 'hsl':
      case 'hsla':
        return this.toHSL();
      default:
        throw new Error('Unsupported color conversion: rgb -> ' + format);
    }
  }

  toHexInt(): number {
    // can't do bitwise operations including alpha because bitwise operations drop out of 64 to 32 bits
    return (this.red * 0x1000000) + (this.green * 0x10000) + (this.blue * 0x100) + Math.round(this.alpha * 255);
  }

  /**
   * Converts an RGB color value to HSB.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB.
   * @returns An HSBColor object.
   */
  private toHSB(): IColor {
    const red = this.red / 255;
    const green = this.green / 255;
    const blue = this.blue / 255;
    const min = Math.min(red, green, blue);
    const brightness = Math.max(red, green, blue);
    const chroma = brightness - min;
    const saturation = brightness === 0 ? 0 : chroma / brightness;
    let hue = 0; // achromatic

    if (chroma !== 0) {
      switch (brightness) {
        case red:
          hue = (green - blue) / chroma + (green < blue ? 6 : 0);
          break;
        case green:
          hue = (blue - red) / chroma + 2;
          break;
        case blue:
          hue = (red - green) / chroma + 4;
          break;
      }

      hue /= 6;
    }

    return new HSBColor(
      toFixedNumber(hue * 360, 2),
      toFixedNumber(saturation * 100, 2),
      toFixedNumber(brightness * 100, 2),
      this.alpha
    );
  }

  /**
   * Converts an RGB color value to HSL.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB.
   * @returns An HSLColor object.
   */
  private toHSL(): IColor {
    const red = this.red / 255;
    const green = this.green / 255;
    const blue = this.blue / 255;
    const min = Math.min(red, green, blue);
    const max = Math.max(red, green, blue);
    const lightness = (max + min) / 2;
    const chroma = max - min;
    let hue: number;
    let saturation: number;

    if (chroma === 0) {
      hue = saturation = 0; // achromatic
    } else {
      saturation = chroma / (lightness < .5 ? max + min : 2 - max - min);

      switch (max) {
        case red:
          hue = (green - blue) / chroma + (green < blue ? 6 : 0);
          break;
        case green:
          hue = (blue - red) / chroma + 2;
          break;
        case blue:
          hue = (red - green) / chroma + 4;
          break;
      }

      hue /= 6;
    }

    return new HSLColor(
      toFixedNumber(hue * 360, 2),
      toFixedNumber(saturation * 100, 2),
      toFixedNumber(lightness * 100, 2),
      this.alpha);
  }

  clone(): IColor {
    return new RGBColor(this.red, this.green, this.blue, this.alpha);
  }

  getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case 'red':
      case 'green':
      case 'blue':
        return {minValue: 0x0, maxValue: 0xFF, step: 0x1, pageSize: 0x11};
      case 'alpha':
        return {minValue: 0, maxValue: 1, step: 0.01, pageSize: 0.1};
      default:
        throw new Error('Unknown color channel: ' + channel);
    }
  }

  formatChannelValue(channel: ColorChannel, locale: string) {
    let options: Intl.NumberFormatOptions;
    let value = this.getChannelValue(channel);
    switch (channel) {
      case 'red':
      case 'green':
      case 'blue':
        options = {style: 'decimal'};
        break;
      case 'alpha':
        options = {style: 'percent'};
        break;
      default:
        throw new Error('Unknown color channel: ' + channel);
    }
    return new NumberFormatter(locale, options).format(value);
  }

  getColorSpace(): ColorFormat {
    return 'rgb';
  }

  private static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = ['red', 'green', 'blue'];
  getColorChannels(): [ColorChannel, ColorChannel, ColorChannel] {
    return RGBColor.colorChannels;
  }
}

// X = <negative/positive number with/without decimal places>
// before/after a comma, 0 or more whitespaces are allowed
// - hsb(X, X%, X%)
// - hsba(X, X%, X%, X)
const HSB_REGEX = /hsb\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%)\)|hsba\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d(.\d+)?)\)/;

class HSBColor extends Color {
  constructor(private hue: number, private saturation: number, private brightness: number, private alpha: number) {
    super();
  }

  static parse(value: string): HSBColor | void {
    let m: RegExpMatchArray | void;
    if ((m = value.match(HSB_REGEX))) {
      const [h, s, b, a] = (m[1] ?? m[2]).split(',').map(n => Number(n.trim().replace('%', '')));
      return new HSBColor(mod(h, 360), clamp(s, 0, 100), clamp(b, 0, 100), clamp(a ?? 1, 0, 1));
    }
  }

  toString(format: ColorFormat | 'css') {
    switch (format) {
      case 'css':
        return this.toHSL().toString('css');
      case 'hex':
        return this.toRGB().toString('hex');
      case 'hexa':
        return this.toRGB().toString('hexa');
      case 'hsb':
        return `hsb(${this.hue}, ${toFixedNumber(this.saturation, 2)}%, ${toFixedNumber(this.brightness, 2)}%)`;
      case 'hsba':
        return `hsba(${this.hue}, ${toFixedNumber(this.saturation, 2)}%, ${toFixedNumber(this.brightness, 2)}%, ${this.alpha})`;
      case undefined:
        return this.toString('hsba');
      default:
        return this.toFormat(format).toString(format);
    }
  }

  toFormat(format: ColorFormat): IColor {
    switch (format) {
      case 'hsb':
      case 'hsba':
        return this;
      case 'hsl':
      case 'hsla':
        return this.toHSL();
      case 'rgb':
      case 'rgba':
        return this.toRGB();
      default:
        throw new Error('Unsupported color conversion: hsb -> ' + format);
    }
  }

  /**
   * Converts a HSB color to HSL.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_HSL.
   * @returns An HSLColor object.
   */
  private toHSL(): IColor {
    let saturation = this.saturation / 100;
    let brightness = this.brightness / 100;
    let lightness = brightness * (1 - saturation / 2);
    saturation = lightness === 0 || lightness === 1 ? 0 : (brightness - lightness) / Math.min(lightness, 1 - lightness);

    return new HSLColor(
      toFixedNumber(this.hue, 2),
      toFixedNumber(saturation * 100, 2),
        toFixedNumber(lightness * 100, 2),
      this.alpha
    );
  }

  /**
   * Converts a HSV color value to RGB.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB_alternative.
   * @returns An RGBColor object.
   */
  private toRGB(): IColor {
    let hue = this.hue;
    let saturation = this.saturation / 100;
    let brightness = this.brightness / 100;
    let fn = (n: number, k = (n + hue / 60) % 6) => brightness - saturation * brightness * Math.max(Math.min(k, 4 - k, 1), 0);
    return new RGBColor(
      Math.round(fn(5) * 255),
      Math.round(fn(3) * 255),
      Math.round(fn(1) * 255),
      this.alpha
    );
  }

  clone(): IColor {
    return new HSBColor(this.hue, this.saturation, this.brightness, this.alpha);
  }

  getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case 'hue':
        return {minValue: 0, maxValue: 360, step: 1, pageSize: 15};
      case 'saturation':
      case 'brightness':
        return {minValue: 0, maxValue: 100, step: 1, pageSize: 10};
      case 'alpha':
        return {minValue: 0, maxValue: 1, step: 0.01, pageSize: 0.1};
      default:
        throw new Error('Unknown color channel: ' + channel);
    }
  }

  formatChannelValue(channel: ColorChannel, locale: string) {
    let options: Intl.NumberFormatOptions;
    let value = this.getChannelValue(channel);
    switch (channel) {
      case 'hue':
        options = {style: 'unit', unit: 'degree', unitDisplay: 'narrow'};
        break;
      case 'saturation':
      case 'brightness':
        options = {style: 'percent'};
        value /= 100;
        break;
      case 'alpha':
        options = {style: 'percent'};
        break;
      default:
        throw new Error('Unknown color channel: ' + channel);
    }
    return new NumberFormatter(locale, options).format(value);
  }

  getColorSpace(): ColorFormat {
    return 'hsb';
  }

  private static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = ['hue', 'saturation', 'brightness'];
  getColorChannels(): [ColorChannel, ColorChannel, ColorChannel] {
    return HSBColor.colorChannels;
  }
}

// X = <negative/positive number with/without decimal places>
// before/after a comma, 0 or more whitespaces are allowed
// - hsl(X, X%, X%)
// - hsla(X, X%, X%, X)
const HSL_REGEX = /hsl\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%)\)|hsla\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d(.\d+)?)\)/;

function mod(n, m) {
  return ((n % m) + m) % m;
}

class HSLColor extends Color {
  constructor(private hue: number, private saturation: number, private lightness: number, private alpha: number) {
    super();
  }

  static parse(value: string): HSLColor | void {
    let m: RegExpMatchArray | void;
    if ((m = value.match(HSL_REGEX))) {
      const [h, s, l, a] = (m[1] ?? m[2]).split(',').map(n => Number(n.trim().replace('%', '')));
      return new HSLColor(mod(h, 360), clamp(s, 0, 100), clamp(l, 0, 100), clamp(a ?? 1, 0, 1));
    }
  }

  toString(format: ColorFormat | 'css') {
    switch (format) {
      case 'hex':
        return this.toRGB().toString('hex');
      case 'hexa':
        return this.toRGB().toString('hexa');
      case 'hsl':
        return `hsl(${this.hue}, ${toFixedNumber(this.saturation, 2)}%, ${toFixedNumber(this.lightness, 2)}%)`;
      case 'css':
      case 'hsla':
        return `hsla(${this.hue}, ${toFixedNumber(this.saturation, 2)}%, ${toFixedNumber(this.lightness, 2)}%, ${this.alpha})`;
      case undefined:
        return this.toString('hsla');
      default:
        return this.toFormat(format).toString(format);
    }
  }
  toFormat(format: ColorFormat): IColor {
    switch (format) {
      case 'hsl':
      case 'hsla':
        return this;
      case 'hsb':
      case 'hsba':
        return this.toHSB();
      case 'rgb':
      case 'rgba':
        return this.toRGB();
      default:
        throw new Error('Unsupported color conversion: hsl -> ' + format);
    }
  }

  /**
   * Converts a HSL color to HSB.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_HSV.
   * @returns An HSBColor object.
   */
  private toHSB(): IColor {
    let saturation = this.saturation / 100;
    let lightness = this.lightness / 100;
    let brightness = lightness + saturation * Math.min(lightness, 1 - lightness);
    saturation = brightness === 0 ? 0 : 2 * (1 - lightness / brightness);
    return new HSBColor(
      toFixedNumber(this.hue, 2),
      toFixedNumber(saturation * 100, 2),
      toFixedNumber(brightness * 100, 2),
      this.alpha
    );
  }

  /**
   * Converts a HSL color to RGB.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative.
   * @returns An RGBColor object.
   */
  private toRGB(): IColor {
    let hue = this.hue;
    let saturation = this.saturation / 100;
    let lightness = this.lightness / 100;
    let a = saturation * Math.min(lightness, 1 - lightness);
    let fn = (n: number, k = (n + hue / 30) % 12) => lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return new RGBColor(
      Math.round(fn(0) * 255),
      Math.round(fn(8) * 255),
      Math.round(fn(4) * 255),
      this.alpha
    );
  }

  clone(): IColor {
    return new HSLColor(this.hue, this.saturation, this.lightness, this.alpha);
  }

  getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case 'hue':
        return {minValue: 0, maxValue: 360, step: 1, pageSize: 15};
      case 'saturation':
      case 'lightness':
        return {minValue: 0, maxValue: 100, step: 1, pageSize: 10};
      case 'alpha':
        return {minValue: 0, maxValue: 1, step: 0.01, pageSize: 0.1};
      default:
        throw new Error('Unknown color channel: ' + channel);
    }
  }

  formatChannelValue(channel: ColorChannel, locale: string) {
    let options: Intl.NumberFormatOptions;
    let value = this.getChannelValue(channel);
    switch (channel) {
      case 'hue':
        options = {style: 'unit', unit: 'degree', unitDisplay: 'narrow'};
        break;
      case 'saturation':
      case 'lightness':
        options = {style: 'percent'};
        value /= 100;
        break;
      case 'alpha':
        options = {style: 'percent'};
        break;
      default:
        throw new Error('Unknown color channel: ' + channel);
    }
    return new NumberFormatter(locale, options).format(value);
  }

  getColorSpace(): ColorFormat {
    return 'hsl';
  }

  private static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = ['hue', 'saturation', 'lightness'];
  getColorChannels(): [ColorChannel, ColorChannel, ColorChannel] {
    return HSLColor.colorChannels;
  }
}
