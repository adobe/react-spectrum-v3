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
import {ColorAxes, ColorChannel, ColorChannelRange, ColorFormat, ColorSpace, Color as IColor} from '@react-types/color';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {LocalizedStringDictionary, LocalizedStringFormatter} from '@internationalized/string';
import {NumberFormatter} from '@internationalized/number';

let dictionary = new LocalizedStringDictionary(intlMessages);

/** Parses a color from a string value. Throws an error if the string could not be parsed. */
export function parseColor(value: string): IColor {
  let res = RGBColor.parse(value) || HSBColor.parse(value) || HSLColor.parse(value);
  if (res) {
    return res;
  }

  throw new Error('Invalid color value: ' + value);
}

export function normalizeColor(v: string | IColor): IColor {
  if (typeof v === 'string') {
    return parseColor(v);
  } else {
    return v;
  }
}

/** Returns a list of color channels for a given color space. */
export function getColorChannels(colorSpace: ColorSpace): [ColorChannel, ColorChannel, ColorChannel] {
  switch (colorSpace) {
    case 'rgb':
      return RGBColor.colorChannels;
    case 'hsl':
      return HSLColor.colorChannels;
    case 'hsb':
      return HSBColor.colorChannels;
  }
}

/**
 * Returns the hue value normalized to the range of 0 to 360.
 */
export function normalizeHue(hue: number): number {
  if (hue === 360) {
    return hue;
  }

  return ((hue % 360) + 360) % 360;
}

// Lightness threshold between orange and brown.
const ORANGE_LIGHTNESS_THRESHOLD = 0.68;
// Lightness threshold between pure yellow and "yellow green".
const YELLOW_GREEN_LIGHTNESS_THRESHOLD = 0.85;
// The maximum lightness considered to be "dark".
const MAX_DARK_LIGHTNESS = 0.55;
// The chroma threshold between gray and color.
const GRAY_THRESHOLD = 0.001;
const OKLCH_HUES: [number, string][] = [
  [0, 'pink'],
  [15, 'red'],
  [48, 'orange'],
  [94, 'yellow'],
  [135, 'green'],
  [175, 'cyan'],
  [264, 'blue'],
  [284, 'purple'],
  [320, 'magenta'],
  [349, 'pink']
];

abstract class Color implements IColor {
  abstract toFormat(format: ColorFormat): IColor;
  abstract toString(format: ColorFormat | 'css'): string;
  abstract clone(): IColor;
  abstract getChannelRange(channel: ColorChannel): ColorChannelRange;
  abstract getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions;
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
    let strings = LocalizedStringDictionary.getGlobalDictionaryForPackage('@react-stately/color') || dictionary;
    return strings.getStringForLocale(channel, locale);
  }

  abstract getColorSpace(): ColorSpace;

  getColorSpaceAxes(xyChannels: {xChannel?: ColorChannel, yChannel?: ColorChannel}): ColorAxes {
    let {xChannel, yChannel} = xyChannels;
    let xCh = xChannel || this.getColorChannels().find(c => c !== yChannel)!;
    let yCh = yChannel || this.getColorChannels().find(c => c !== xCh)!;
    let zCh = this.getColorChannels().find(c => c !== xCh && c !== yCh)!;

    return {xChannel: xCh, yChannel: yCh, zChannel: zCh};
  }

  abstract getColorChannels(): [ColorChannel, ColorChannel, ColorChannel]

  getColorName(locale: string): string {
    // Convert to oklch color space, which has perceptually uniform lightness across all hues.
    let [l, c, h] = toOKLCH(this);

    let strings = LocalizedStringDictionary.getGlobalDictionaryForPackage('@react-stately/color') || dictionary;
    if (l > 0.999) {
      return strings.getStringForLocale('white', locale);
    }

    if (l < 0.001) {
      return strings.getStringForLocale('black', locale);
    }

    let hue: string;
    [hue, l] = this.getOklchHue(l, c, h, locale);

    let lightness = '';
    let chroma = '';
    if (c <= 0.1 && c >= GRAY_THRESHOLD) {
      if (l >= 0.7) {
        chroma = 'pale';
      } else {
        chroma = 'grayish';
      }
    } else if (c >= 0.15) {
      chroma = 'vibrant';
    }

    if (l < 0.3) {
      lightness = 'very dark';
    } else if (l < MAX_DARK_LIGHTNESS) {
      lightness = 'dark';
    } else if (l < 0.7) {
      // none
    } else if (l < 0.85) {
      lightness = 'light';
    } else {
      lightness = 'very light';
    }

    if (chroma) {
      chroma = strings.getStringForLocale(chroma, locale);
    }

    if (lightness) {
      lightness = strings.getStringForLocale(lightness, locale);
    }

    let alpha = this.getChannelValue('alpha');
    let formatter = new LocalizedStringFormatter(locale, strings);
    if (alpha < 1) {
      let percentTransparent = new NumberFormatter(locale, {style: 'percent'}).format(1 - alpha);
      return formatter.format('transparentColorName', {
        lightness,
        chroma,
        hue,
        percentTransparent
      }).replace(/\s+/g, ' ').trim();
    } else {
      return formatter.format('colorName', {
        lightness,
        chroma,
        hue
      }).replace(/\s+/g, ' ').trim();
    }
  }

  private getOklchHue(l: number, c: number, h: number, locale: string): [string, number] {
    let strings = LocalizedStringDictionary.getGlobalDictionaryForPackage('@react-stately/color') || dictionary;
    if (c < GRAY_THRESHOLD) {
      return [strings.getStringForLocale('gray', locale), l];
    }

    for (let i = 0; i < OKLCH_HUES.length; i++) {
      let [hue, hueName] = OKLCH_HUES[i];
      let [nextHue, nextHueName] = OKLCH_HUES[i + 1] || [360, 'pink'];
      if (h >= hue && h < nextHue) {
        // Split orange hue into brown/orange depending on lightness.
        if (hueName === 'orange') {
          if (l < ORANGE_LIGHTNESS_THRESHOLD) {
            hueName = 'brown';
          } else {
            // Adjust lightness.
            l = (l - ORANGE_LIGHTNESS_THRESHOLD) + MAX_DARK_LIGHTNESS;
          }
        }

        // If the hue is at least halfway to the next hue, add the next hue name as well.
        if (h > hue + (nextHue - hue) / 2 && hueName !== nextHueName) {
          hueName = `${hueName} ${nextHueName}`;
        } else if (hueName === 'yellow' && l < YELLOW_GREEN_LIGHTNESS_THRESHOLD) {
          // Yellow shifts toward green at lower lightnesses.
          hueName = 'yellow green';
        }

        let name = strings.getStringForLocale(hueName, locale).toLocaleLowerCase(locale);
        return [name, l];
      }
    }

    throw new Error('Unexpected hue');
  }

  getHueName(locale: string): string {
    let [l, c, h] = toOKLCH(this);
    let [name] = this.getOklchHue(l, c, h, locale);
    return name;
  }
}

class RGBColor extends Color {
  constructor(private red: number, private green: number, private blue: number, private alpha: number) {
    super();
  }

  static parse(value: string) {
    let colors: Array<number | undefined> = [];
    // matching #rgb, #rgba, #rrggbb, #rrggbbaa
    if (/^#[\da-f]+$/i.test(value) && [4, 5, 7, 9].includes(value.length)) {
      const values = (value.length < 6 ? value.replace(/[^#]/gi, '$&$&') : value).slice(1).split('');
      while (values.length > 0) {
        colors.push(parseInt(values.splice(0, 2).join(''), 16));
      }
      colors[3] = colors[3] !== undefined ? colors[3] / 255 : undefined;
    }

    // matching rgb(rrr, ggg, bbb), rgba(rrr, ggg, bbb, 0.a)
    const match = value.match(/^rgba?\((.*)\)$/);
    if (match?.[1]) {
      colors = match[1].split(',').map(value => Number(value.trim()));
      colors = colors.map((num, i) => {
        return clamp(num ?? 0, 0, i < 3 ? 255 : 1);
      });
    }
    if (colors[0] === undefined || colors[1] === undefined || colors[2] === undefined) {
      return undefined;
    }

    return colors.length < 3 ? undefined : new RGBColor(colors[0], colors[1], colors[2], colors[3] ?? 1);
  }

  toString(format: ColorFormat | 'css' = 'css') {
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
    return this.red << 16 | this.green << 8 | this.blue;
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
        default:
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

  getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions {
    switch (channel) {
      case 'red':
      case 'green':
      case 'blue':
        return {style: 'decimal'};
      case 'alpha':
        return {style: 'percent'};
      default:
        throw new Error('Unknown color channel: ' + channel);
    }
  }

  formatChannelValue(channel: ColorChannel, locale: string) {
    let options = this.getChannelFormatOptions(channel);
    let value = this.getChannelValue(channel);
    return new NumberFormatter(locale, options).format(value);
  }

  getColorSpace(): ColorSpace {
    return 'rgb';
  }

  static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = ['red', 'green', 'blue'];
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
    let m: RegExpMatchArray | null;
    if ((m = value.match(HSB_REGEX))) {
      const [h, s, b, a] = (m[1] ?? m[2]).split(',').map(n => Number(n.trim().replace('%', '')));
      return new HSBColor(normalizeHue(h), clamp(s, 0, 100), clamp(b, 0, 100), clamp(a ?? 1, 0, 1));
    }
  }

  toString(format: ColorFormat | 'css' = 'css') {
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

  getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions {
    switch (channel) {
      case 'hue':
        return {style: 'unit', unit: 'degree', unitDisplay: 'narrow'};
      case 'saturation':
      case 'brightness':
      case 'alpha':
        return {style: 'percent'};
      default:
        throw new Error('Unknown color channel: ' + channel);
    }
  }

  formatChannelValue(channel: ColorChannel, locale: string) {
    let options = this.getChannelFormatOptions(channel);
    let value = this.getChannelValue(channel);
    if (channel === 'saturation' || channel === 'brightness') {
      value /= 100;
    }
    return new NumberFormatter(locale, options).format(value);
  }

  getColorSpace(): ColorSpace {
    return 'hsb';
  }

  static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = ['hue', 'saturation', 'brightness'];
  getColorChannels(): [ColorChannel, ColorChannel, ColorChannel] {
    return HSBColor.colorChannels;
  }
}

// X = <negative/positive number with/without decimal places>
// before/after a comma, 0 or more whitespaces are allowed
// - hsl(X, X%, X%)
// - hsla(X, X%, X%, X)
const HSL_REGEX = /hsl\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%)\)|hsla\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d(.\d+)?)\)/;

class HSLColor extends Color {
  constructor(private hue: number, private saturation: number, private lightness: number, private alpha: number) {
    super();
  }

  static parse(value: string): HSLColor | void {
    let m: RegExpMatchArray | null;
    if ((m = value.match(HSL_REGEX))) {
      const [h, s, l, a] = (m[1] ?? m[2]).split(',').map(n => Number(n.trim().replace('%', '')));
      return new HSLColor(normalizeHue(h), clamp(s, 0, 100), clamp(l, 0, 100), clamp(a ?? 1, 0, 1));
    }
  }

  toString(format: ColorFormat | 'css' = 'css') {
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

  getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions {
    switch (channel) {
      case 'hue':
        return {style: 'unit', unit: 'degree', unitDisplay: 'narrow'};
      case 'saturation':
      case 'lightness':
      case 'alpha':
        return {style: 'percent'};
      default:
        throw new Error('Unknown color channel: ' + channel);
    }
  }

  formatChannelValue(channel: ColorChannel, locale: string) {
    let options = this.getChannelFormatOptions(channel);
    let value = this.getChannelValue(channel);
    if (channel === 'saturation' || channel === 'lightness') {
      value /= 100;
    }
    return new NumberFormatter(locale, options).format(value);
  }

  getColorSpace(): ColorSpace {
    return 'hsl';
  }

  static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = ['hue', 'saturation', 'lightness'];
  getColorChannels(): [ColorChannel, ColorChannel, ColorChannel] {
    return HSLColor.colorChannels;
  }
}

// https://www.w3.org/TR/css-color-4/#color-conversion-code
function toOKLCH(color: Color) {
  let rgb = color.toFormat('rgb');
  let red = rgb.getChannelValue('red') / 255;
  let green = rgb.getChannelValue('green') / 255;
  let blue = rgb.getChannelValue('blue') / 255;
  [red, green, blue] = lin_sRGB(red, green, blue);
  let [x, y, z] = lin_sRGB_to_XYZ(red, green, blue);
  let [l, a, b] = XYZ_to_OKLab(x, y, z);
  return OKLab_to_OKLCH(l, a, b);
}

function OKLab_to_OKLCH(l: number, a: number, b: number): [number, number, number] {
  var hue = Math.atan2(b, a) * 180 / Math.PI;
  return [
    l,
    Math.sqrt(a ** 2 + b ** 2), // Chroma
    hue >= 0 ? hue : hue + 360 // Hue, in degrees [0 to 360)
  ];
}

function lin_sRGB(r: number, g: number, b: number): [number, number, number] {
  // convert an array of sRGB values
  // where in-gamut values are in the range [0 - 1]
  // to linear light (un-companded) form.
  // https://en.wikipedia.org/wiki/SRGB
  // Extended transfer function:
  // for negative values,  linear portion is extended on reflection of axis,
  // then reflected power function is used.
  return [lin_sRGB_component(r), lin_sRGB_component(g), lin_sRGB_component(b)];
}

function lin_sRGB_component(val: number) {
  let sign = val < 0 ? -1 : 1;
  let abs = Math.abs(val);

  if (abs <= 0.04045) {
    return val / 12.92;
  }

  return sign * (Math.pow((abs + 0.055) / 1.055, 2.4));
}

function lin_sRGB_to_XYZ(r: number, g: number, b: number) {
  // convert an array of linear-light sRGB values to CIE XYZ
  // using sRGB's own white, D65 (no chromatic adaptation)
  const M = [
    506752 / 1228815, 87881 / 245763,  12673 / 70218,
    87098 / 409605,   175762 / 245763, 12673 / 175545,
    7918 / 409605,    87881 / 737289,  1001167 / 1053270
  ];
  return multiplyMatrix(M, r, g, b);
}

function XYZ_to_OKLab(x: number, y: number, z: number) {
  // Given XYZ relative to D65, convert to OKLab
  const XYZtoLMS = [
    0.8190224379967030, 0.3619062600528904, -0.1288737815209879,
    0.0329836539323885, 0.9292868615863434,  0.0361446663506424,
    0.0481771893596242, 0.2642395317527308,  0.6335478284694309
  ];
  const LMStoOKLab = [
    0.2104542683093140,  0.7936177747023054, -0.0040720430116193,
    1.9779985324311684, -2.4285922420485799,  0.4505937096174110,
    0.0259040424655478,  0.7827717124575296, -0.8086757549230774
  ];

  let [a, b, c] = multiplyMatrix(XYZtoLMS, x, y, z);
  return multiplyMatrix(LMStoOKLab, Math.cbrt(a), Math.cbrt(b), Math.cbrt(c));
}

function multiplyMatrix(m: number[], x: number, y: number, z: number): [number, number, number] {
  let a = m[0] * x + m[1] * y + m[2] * z;
  let b = m[3] * x + m[4] * y + m[5] * z;
  let c = m[6] * x + m[7] * y + m[8] * z;
  return [a, b, c];
}
