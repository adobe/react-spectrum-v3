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
import {ColorChannel, ColorChannelRange, ColorFormat, Color as IColor} from '@react-types/color';
import deltaE from 'delta-e';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {MessageDictionary} from '@internationalized/message';
import {NumberFormatter} from '@internationalized/number';

const messages = new MessageDictionary(intlMessages);
const HUE_STEP = 15 / 2;

/** Parses a color from a string value. Throws an error if the string could not be parsed. */
export function parseColor(value: string): IColor {
  let res = RGBColor.parse(value) || HSBColor.parse(value) || HSLColor.parse(value);
  if (res) {
    return res;
  }

  throw new Error('Invalid color value: ' + value);
}

function toXYZ(color:Color): {x: number, y: number, z: number} {
  let rgb = color.toFormat('rgb'),
    r = rgb.getChannelValue('red') / 255,
    g = rgb.getChannelValue('green')  / 255,
    b = rgb.getChannelValue('blue') / 255;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) * 100 / 95.047,
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b,
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) * 100 / 108.883;
  return {x, y, z};
}

function toLAB(color:Color): {L: number, A: number, B: number} {
  let {x, y, z} = toXYZ(color);
  const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 0.1379,
    fy = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 0.1379,
    fz = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 0.1379,
    L = (116 * fy - 16) / 100.00,
    A = (500 * (fx - fy) + 0x80) / 0xFF,
    B = (200 * (fy - fz) + 0x80) / 0xFF;
  return {L, A, B};
}

abstract class Color implements IColor {
  abstract toFormat(format: ColorFormat): IColor;
  abstract toString(format: ColorFormat | 'css'): string;
  abstract clone(): Color;
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
    return messages.getStringForLocale(channel, locale);
  }

  getColorSpace(): ColorFormat {
    return null;
  }

  getDeltaE(color:Color) {
    return deltaE.getDeltaE00(toLAB(this), toLAB(color));
  }

  getColorName(locale:string): string {
    let name = undefined;
    let hsl = this.toFormat('hsl');
    let hue = hsl.getChannelValue('hue');
    let saturation = hsl.getChannelValue('saturation');
    let lightness = hsl.getChannelValue('lightness');

    switch (lightness) {
      case 0:
        return messages.getStringForLocale('black', locale);
      case 100:
        return messages.getStringForLocale('white', locale);
      default:
        if (saturation === 0) {
          return `${messages.getStringForLocale('gray', locale)} ${new NumberFormatter(locale, {style: 'percent'}).format(Math.round(lightness) / 100)}`;
        }
    }

    // get closest hue name
    let hueName = this.getHueName(locale) || '';
    
    // get closest bang color name from HSL
    let deltaE = Infinity;
    let d = Infinity;
    for (const [prefix, [saturation, lightness]] of PREFIXES) {
      d = this.getDeltaE(parseColor(`hsl(${hue}, ${saturation}%, ${lightness}%)`));
      if (d <= 0.15 && d < deltaE) {
        deltaE = d;
        name = `${messages.getStringForLocale(prefix, locale)} ${hueName}`.trim();
      }
    }

    // check for closer bang color outlier
    for (const [key, value] of BANG_COLOR_OUTLIERS) {
      if (value === this.toString('hex')) {
        name = messages.getStringForLocale(key, locale);
      } else {
        d = this.getDeltaE(parseColor(value));
        if (d <= 0.1 && d < deltaE) {
          deltaE = d;
          name = messages.getStringForLocale(key, locale);
        }
      }
    }

    // check for exact match of css color name
    for (const [key, value] of CSS_COLOR_NAMES) {
      if (value === this.toString('hex')) {
        name = messages.getStringForLocale(key, locale);
      }
    }

    return name;
  }

  getHueName(locale:string): string {
    let hue = this.toFormat('hsl').getChannelValue('hue');
    let name = undefined;
    let range = HUE_STEP / 2;
    if (hue > 360 - range) {
      hue -= 360;
    }
    for (const [key, value] of HUES) {
      if (Math.abs(value - hue) < range) {
        name = messages.getStringForLocale(key, locale);
        break;
      }
    }
    return name;
  }
}

const HEX_REGEX = /^#(?:([0-9a-f]{3})|([0-9a-f]{6}))$/i;

// X = <negative/positive number with/without decimal places>
// before/after a comma, 0 or more whitespaces are allowed
// - rgb(X, X, X)
// - rgba(X, X, X, X)
const RGB_REGEX = /rgb\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?)\)|rgba\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d(.\d+)?)\)/;

class RGBColor extends Color {
  constructor(private red: number, private green: number, private blue: number, private alpha: number) {
    super();
  }

  static parse(value: string): RGBColor | void {
    let m;
    if ((m = value.match(HEX_REGEX))) {
      if (m[1]) {
        let r = parseInt(m[1][0] + m[1][0], 16);
        let g = parseInt(m[1][1] + m[1][1], 16);
        let b = parseInt(m[1][2] + m[1][2], 16);
        return new RGBColor(r, g, b, 1);
      } else if (m[2]) {
        let r = parseInt(m[2][0] + m[2][1], 16);
        let g = parseInt(m[2][2] + m[2][3], 16);
        let b = parseInt(m[2][4] + m[2][5], 16);
        return new RGBColor(r, g, b, 1);
      }
    }
    
    if ((m = value.match(RGB_REGEX))) {
      const [r, g, b, a] = (m[1] ?? m[2]).split(',').map(n => Number(n.trim()));
      return new RGBColor(clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255), clamp(a ?? 1, 0, 1));
    }

    if (CSS_COLOR_NAMES.has(value)) {
      return RGBColor.parse(CSS_COLOR_NAMES.get(value));
    }
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

  private toHSB(): Color {
    let r = this.red / 255;
    let g = this.green / 255;
    let b = this.blue / 255;
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h: number;
    let s: number;
    let d = max - min;

    s = max === 0 ? 0 : d / max;

    if (d === 0) {
      h = 0; // achromatic
    } else {
      switch (max) {
        case r: 
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return new HSBColor(
      h * 360,
      s * 100,
      b * 100,
      this.alpha
    );
  }

  private toHSL(): Color {
    let r = this.red / 255;
    let g = this.green / 255;
    let b = this.blue / 255;
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h: number;
    let s: number;
    let l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      let d = max - min;
      s = d / (l < .5 ? max + min : 2 - max - min);

      switch (max) {
        case r: 
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return new HSLColor(
      h * 360,
      s * 100,
      l * 100,
      this.alpha);
  }

  clone(): Color {
    return new RGBColor(this.red, this.green, this.blue, this.alpha);
  }

  getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case 'red':
      case 'green':
      case 'blue':
        return {minValue: 0, maxValue: 255, step: 1};
      case 'alpha':
        return {minValue: 0, maxValue: 1, step: 0.01};
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
        return `hsb(${this.hue}, ${Math.round(this.saturation)}%, ${Math.round(this.brightness)}%)`;
      case 'hsba':
        return `hsba(${this.hue}, ${Math.round(this.saturation)}%, ${Math.round(this.brightness)}%, ${this.alpha})`;
      
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
  private toHSL(): Color {
    let s = this.saturation / 100;
    let v = this.brightness / 100;
    let l = v * (1 - s / 2);
    s = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l); 

    return new HSLColor(
      this.hue,
      s * 100,
      l * 100,
      this.alpha
    );
  }

  /**
   * Converts a HSV color value to RGB.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB_alternative.
   * @returns An RGBColor object.
   */
  private toRGB(): Color {
    let h = this.hue;
    let s = this.saturation / 100;
    let v = this.brightness / 100;
    let fn = (n: number, k = (n + h / 60) % 6) => v - s * v * Math.max(Math.min(k, 4 - k, 1), 0);
    return new RGBColor(
      Math.round(fn(5) * 255),
      Math.round(fn(3) * 255),
      Math.round(fn(1) * 255),
      this.alpha
    );
  }

  clone(): Color {
    return new HSBColor(this.hue, this.saturation, this.brightness, this.alpha);
  }

  getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case 'hue':
        return {minValue: 0, maxValue: 360, step: 1};
      case 'saturation':
      case 'brightness':
        return {minValue: 0, maxValue: 100, step: 1};
      case 'alpha':
        return {minValue: 0, maxValue: 1, step: 0.01};
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
}

// X = <negative/positive number with/without decimal places>
// before/after a comma, 0 or more whitespaces are allowed
// - hsl(X, X%, X%)
// - hsla(X, X%, X%, X)
const HSL_REGEX = /hsl\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%)\)|hsla\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d(.\d+)?)\)/;

function mod(n, m) {
  return ((n % m) + m) % m;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class HSLColor extends Color {
  constructor(private hue: number, private saturation: number, private lightness: number, private alpha: number) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        return `hsl(${this.hue}, ${Math.round(this.saturation)}%, ${Math.round(this.lightness)}%)`;
      case 'css':
      case 'hsla':
        return `hsla(${this.hue}, ${Math.round(this.saturation)}%, ${Math.round(this.lightness)}%, ${this.alpha})`;
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
  private toHSB(): Color {
    let s = this.saturation / 100;
    let l = this.lightness / 100;
    let v = l + s * Math.min(l, 1 - l);
    s = v === 0 ? 0 : 2 * (1 - l / v);
    return new HSBColor(
      this.hue,
      s * 100,
      v * 100,
      this.alpha
    );
  }

  /**
   * Converts a HSL color to RGB.
   * Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative.
   * @returns An RGBColor object.
   */
  private toRGB(): Color {
    let h = this.hue;
    let s = this.saturation / 100;
    let l = this.lightness / 100;
    let a = s * Math.min(l, 1 - l);
    let fn = (n: number, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return new RGBColor(
      Math.round(fn(0) * 255),
      Math.round(fn(8) * 255),
      Math.round(fn(4) * 255),
      this.alpha
    );
  }

  clone(): Color {
    return new HSLColor(this.hue, this.saturation, this.lightness, this.alpha);
  }

  getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case 'hue':
        return {minValue: 0, maxValue: 360, step: 1};
      case 'saturation':
      case 'lightness':
        return {minValue: 0, maxValue: 100, step: 1};
      case 'alpha':
        return {minValue: 0, maxValue: 1, step: 0.01};
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
}

const HUES = new Map([
  ['red', 0],
  ['scarlet', 7.5],
  ['vermilion', 15],
  ['tangelo', 22.5],
  ['orange', 30],
  ['gamboge', 37.5],
  ['amber', 45],
  ['gold', 52.5],
  ['yellow', 60],
  ['apple_green', 67.5],
  ['lime_green', 75],
  ['spring_bud', 82.5],
  ['chartreuse_green', 90],
  ['pistachio', 97.5],
  ['harlequin', 105],
  ['sap_green', 112.5],
  ['green', 120],
  ['emerald_green', 127.5],
  ['malachite_green', 135],
  ['sea_green', 142.5],
  ['spring_green', 150],
  ['aquamarine', 157.5],
  ['turquoise', 165],
  ['opal', 172.5],
  ['cyan', 180],
  ['arctic_blue', 187.5],
  ['cerulean', 195],
  ['cornflower_blue', 202.5],
  ['azure', 210],
  ['cobalt_blue', 217.5],
  ['sapphire_blue', 225],
  ['phthalo_blue', 232.5],
  ['blue', 240],
  ['persian_blue', 247.5],
  ['indigo', 255],
  ['blue_violet', 262.5],
  ['violet', 270],
  ['purple', 277.5],
  ['mulberry', 285],
  ['heliotrope', 292.5],
  ['magenta', 300],
  ['orchid', 307.5],
  ['fuchsia', 315],
  ['cerise', 322.5],
  ['rose', 330],
  ['raspberry', 337.5],
  ['crimson', 345],
  ['amaranth', 352.5]
]);

const PREFIXES = new Map([
  ['very_pale', [100, 94.31372549019608]],
  ['pale', [100, 88.0392156862745]],
  ['pale_light_grayish', [49.4736842105263, 81.37254901960785]],
  ['very_light', [100, 80.98039215686275]],
  ['light', [65.71428571428571, 72.54901960784314]],
  ['light_brilliant', [100, 69.80392156862744]],
  ['brilliant', [75.75757575757575, 61.1764705882353]],
  ['grayish', [19.81566820276498, 57.45098039215686]],
  ['luminous_vivid', [100, 50]],
  ['moderate', [38.84297520661157, 47.45098039215686]],
  ['vivid', [100, 45.294117647058826]],
  ['strong', [100, 32.94117647058823]],
  ['dark_grayish', [14.838709677419345, 30.3921568627451]],
  ['dark', [39.06249999999999, 25.098039215686274]],
  ['deep', [100, 17.45098039215686]],
  ['very_dark', [26.08695652173913, 9.019607843137255]],
  ['very_deep', [100, 5.686274509803922]]
]);

const BANG_COLOR_OUTLIERS = new Map([
  ['pinkish_white', '#FFF6F6'],
  ['very_pale_pink', '#FFE2E2'],
  ['pale_pink', '#FFC2C2'],
  ['light_pink', '#FF9E9E'],
  ['pinkish_gray', '#E7DADA'],
  ['pale_grayish_pink', '#E7B8B8'],
  ['pink', '#E78B8B'],
  ['reddish_gray', '#A89C9C'],
  ['reddish_brownish_gray', '#595353'],
  ['dark_grayish_reddish_brown', '#594242'],
  ['reddish_brown', '#592727'],
  ['deep_reddish_brown', '#590000'],
  ['reddish_brownish_black', '#1D1A1A'],
  ['very_reddish_brown', '#1D1111'],
  ['very_deep_reddish_brown', '#1D0000'],
  ['pale_light_grayish_brown', '#E7D0B8'],
  ['grayish_brown', '#A8937D'],
  ['dark_grayish_brown', '#594E42'],
  ['brown', '#594027'],
  ['deep_brown', '#592D00'],
  ['very_brown', '#1D1711'],
  ['very_deep_brown', '#1D0E00'],
  ['yellowish_white', '#FFFFF6'],
  ['light_yellowish_gray', '#E7E7DA'],
  ['pale_light_grayish_olive', '#E7E7B8'],
  ['yellowish_gray', '#A8A89C'],
  ['grayish_olive', '#A8A87D'],
  ['moderate_olive', '#A8A84A'],
  ['strong_olive', '#A8A800'],
  ['dark_olivish_gray', '#595953'],
  ['dark_grayish_olive', '#595942'],
  ['dark_olive', '#595927'],
  ['deep_olive', '#595900'],
  ['yellowish_black', '#1D1D1A'],
  ['very_dark_olive', '#1D1D11'],
  ['very_deep_olive', '#1D1D00'],
  ['greenish_white', '#F6FFF6'],
  ['light_greenish_gray', '#DAE7DA'],
  ['greenish_gray', '#9CA89C'],
  ['dark_greenish_gray', '#535953'],
  ['greenish_black', '#1A1D1A'],
  ['cyanish_white', '#F6FFFF'],
  ['light_cyanish_gray', '#DAE7E7'],
  ['cyanish_gray', '#9CA8A8'],
  ['dark_cyanish_gray', '#535959'],
  ['cyanish_black', '#1A1D1D'],
  ['bluish_white', '#F6F6FF'],
  ['light_bluish_gray', '#DADAE7'],
  ['bluish_gray', '#9C9CA8'],
  ['dark_bluish_gray', '#535359'],
  ['bluish_black', '#1A1A1D'],
  ['magentaish_white', '#FFF6FF'],
  ['light_magentaish_gray', '#E7DAE7'],
  ['magentaish_gray', '#A89CA8'],
  ['dark_magentaish_gray', '#595359'],
  ['magentaish_black', '#1D1A1D']
]);

const CSS_COLOR_NAMES = new Map([
  ['aliceblue', '#F0F8FF'],
  ['antiquewhite', '#FAEBD7'],
  ['aqua', '#00FFFF'],
  ['aquamarine', '#7FFFD4'],
  ['azure', '#F0FFFF'],
  ['beige', '#F5F5DC'],
  ['bisque', '#FFE4C4'],
  ['black', '#000000'],
  ['blanchedalmond', '#FFEBCD'],
  ['blue', '#0000FF'],
  ['blueviolet', '#8A2BE2'],
  ['brown', '#A52A2A'],
  ['burlywood', '#DEB887'],
  ['cadetblue', '#5F9EA0'],
  ['chartreuse', '#7FFF00'],
  ['chocolate', '#D2691E'],
  ['coral', '#FF7F50'],
  ['cornflowerblue', '#6495ED'],
  ['cornsilk', '#FFF8DC'],
  ['crimson', '#DC143C'],
  ['cyan', '#00FFFF'],
  ['darkblue', '#00008B'],
  ['darkcyan', '#008B8B'],
  ['darkgoldenrod', '#B8860B'],
  ['darkgray', '#A9A9A9'],
  ['darkgreen', '#006400'],
  ['darkkhaki', '#BDB76B'],
  ['darkmagenta', '#8B008B'],
  ['darkolivegreen', '#556B2F'],
  ['darkorange', '#FF8C00'],
  ['darkorchid', '#9932CC'],
  ['darkred', '#8B0000'],
  ['darksalmon', '#E9967A'],
  ['darkseagreen', '#8FBC8F'],
  ['darkslateblue', '#483D8B'],
  ['darkslategray', '#2F4F4F'],
  ['darkturquoise', '#00CED1'],
  ['darkviolet', '#9400D3'],
  ['deeppink', '#FF1493'],
  ['deepskyblue', '#00BFFF'],
  ['dimgray', '#696969'],
  ['dodgerblue', '#1E90FF'],
  ['firebrick', '#B22222'],
  ['floralwhite', '#FFFAF0'],
  ['forestgreen', '#228B22'],
  ['gainsboro', '#DCDCDC'],
  ['ghostwhite', '#F8F8FF'],
  ['gold', '#FFD700'],
  ['goldenrod', '#DAA520'],
  ['gray', '#808080'],
  ['green', '#008000'],
  ['greenyellow', '#ADFF2F'],
  ['honeydew', '#F0FFF0'],
  ['hotpink', '#FF69B4'],
  ['indianred', '#CD5C5C'],
  ['indigo', '#4B0082'],
  ['ivory', '#FFFFF0'],
  ['khaki', '#F0E68C'],
  ['lavender', '#E6E6FA'],
  ['lavenderblush', '#FFF0F5'],
  ['lawngreen', '#7CFC00'],
  ['lemonchiffon', '#FFFACD'],
  ['lightblue', '#ADD8E6'],
  ['lightcoral', '#F08080'],
  ['lightcyan', '#E0FFFF'],
  ['lightgoldenrodyellow', '#FAFAD2'],
  ['lightgreen', '#D3D3D3'],
  ['lightgray', '#90EE90'],
  ['lightpink', '#FFB6C1'],
  ['lightsalmon', '#FFA07A'],
  ['lightseagreen', '#20B2AA'],
  ['lightskyblue', '#87CEFA'],
  ['lightslategray', '#778899'],
  ['lightsteelblue', '#B0C4DE'],
  ['lightyellow', '#FFFFE0'],
  ['lime', '#00FF00'],
  ['limegreen', '#32CD32'],
  ['linen', '#FAF0E6'],
  ['magenta', '#FF00FF'],
  ['maroon', '#800000'],
  ['mediumaquamarine', '#66CDAA'],
  ['mediumblue', '#0000CD'],
  ['mediumorchid', '#BA55D3'],
  ['mediumpurple', '#9370D8'],
  ['mediumseagreen', '#3CB371'],
  ['mediumslateblue', '#7B68EE'],
  ['mediumspringgreen', '#00FA9A'],
  ['mediumturquoise', '#48D1CC'],
  ['mediumvioletred', '#C71585'],
  ['midnightblue', '#191970'],
  ['mintcream', '#F5FFFA'],
  ['mistyrose', '#FFE4E1'],
  ['moccasin', '#FFE4B5'],
  ['navajowhite', '#FFDEAD'],
  ['navy', '#000080'],
  ['oldlace', '#FDF5E6'],
  ['olive', '#808000'],
  ['olivedrab', '#6B8E23'],
  ['orange', '#FFA500'],
  ['orangered', '#FF4500'],
  ['orchid', '#DA70D6'],
  ['palegoldenrod', '#EEE8AA'],
  ['palegreen', '#98FB98'],
  ['paleturquoise', '#AFEEEE'],
  ['palevioletred', '#D87093'],
  ['papayawhip', '#FFEFD5'],
  ['peachpuff', '#FFDAB9'],
  ['peru', '#CD853F'],
  ['pink', '#FFC0CB'],
  ['plum', '#DDA0DD'],
  ['powderblue', '#B0E0E6'],
  ['purple', '#800080'],
  ['rebeccapurple', '#663399'],
  ['red', '#FF0000'],
  ['rosybrown', '#BC8F8F'],
  ['royalblue', '#4169E1'],
  ['saddlebrown', '#8B4513'],
  ['salmon', '#FA8072'],
  ['sandybrown', '#F4A460'],
  ['seagreen', '#2E8B57'],
  ['seashell', '#FFF5EE'],
  ['sienna', '#A0522D'],
  ['silver', '#C0C0C0'],
  ['skyblue', '#87CEEB'],
  ['slateblue', '#6A5ACD'],
  ['slategray', '#708090'],
  ['snow', '#FFFAFA'],
  ['springgreen', '#00FF7F'],
  ['steelblue', '#4682B4'],
  ['tan', '#D2B48C'],
  ['teal', '#008080'],
  ['thistle', '#D8BFD8'],
  ['tomato', '#FF6347'],
  ['turquoise', '#40E0D0'],
  ['violet', '#EE82EE'],
  ['wheat', '#F5DEB3'],
  ['white', '#FFFFFF'],
  ['whitesmoke', '#F5F5F5'],
  ['yellow', '#FFFF00'],
  ['yellowgreen', '#9ACD32']
]);
