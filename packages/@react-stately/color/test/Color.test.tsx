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

import {ColorFormat} from '@react-types/color';
import fc from 'fast-check';
import {getDeltaE00} from 'delta-e';
import {parseColor} from '../src/Color';
import space from 'color-space';

describe('Color', function () {
  describe('hex', function () {
    it('should parse a short hex color', function () {
      let color = parseColor('#abc');
      expect(color.getChannelValue('red')).toBe(170);
      expect(color.getChannelValue('green')).toBe(187);
      expect(color.getChannelValue('blue')).toBe(204);
      expect(color.getChannelValue('alpha')).toBe(1);
      expect(color.toString('hex')).toBe('#AABBCC');
      expect(color.toString('rgb')).toBe('rgb(170, 187, 204)');
      expect(color.toString('rgba')).toBe('rgba(170, 187, 204, 1)');
      expect(color.toString('css')).toBe('rgba(170, 187, 204, 1)');
    });

    it('should parse a short hexa color', function () {
      let color = parseColor('#abc9');
      expect(color.getChannelValue('red')).toBe(170);
      expect(color.getChannelValue('green')).toBe(187);
      expect(color.getChannelValue('blue')).toBe(204);
      expect(color.getChannelValue('alpha')).toBe(0.6);
      expect(color.toString('hex')).toBe('#AABBCC');
      expect(color.toString('rgb')).toBe('rgb(170, 187, 204)');
      expect(color.toString('rgba')).toBe('rgba(170, 187, 204, 0.6)');
      expect(color.toString('css')).toBe('rgba(170, 187, 204, 0.6)');
    });

    it('should parse a long hex color', function () {
      let color = parseColor('#abcdef');
      expect(color.getChannelValue('red')).toBe(171);
      expect(color.getChannelValue('green')).toBe(205);
      expect(color.getChannelValue('blue')).toBe(239);
      expect(color.getChannelValue('alpha')).toBe(1);
      expect(color.toString('hex')).toBe('#ABCDEF');
      expect(color.toString('rgb')).toBe('rgb(171, 205, 239)');
      expect(color.toString('rgba')).toBe('rgba(171, 205, 239, 1)');
      expect(color.toString('css')).toBe('rgba(171, 205, 239, 1)');
    });

    it('should parse a long hexa color', function () {
      let color = parseColor('#abcdef99');
      expect(color.getChannelValue('red')).toBe(171);
      expect(color.getChannelValue('green')).toBe(205);
      expect(color.getChannelValue('blue')).toBe(239);
      expect(color.getChannelValue('alpha')).toBe(0.6);
      expect(color.toString('hex')).toBe('#ABCDEF');
      expect(color.toString('rgb')).toBe('rgb(171, 205, 239)');
      expect(color.toString('rgba')).toBe('rgba(171, 205, 239, 0.6)');
      expect(color.toString('css')).toBe('rgba(171, 205, 239, 0.6)');
    });

    it('should throw on invalid hex value', function () {
      expect(() => parseColor('#ggg')).toThrow('Invalid color value: #ggg');
    });
  });

  it('should convert a color to its equivalent hex value in decimal format', function () {
    const color = parseColor('#abcdef');
    expect(color.toHexInt()).toBe(0xABCDEFFF);
  });

  describe('rgb', function () {
    it('should parse a rgb color', function () {
      let color = parseColor('rgb(128, 128, 0)');
      expect(color.getChannelValue('red')).toBe(128);
      expect(color.getChannelValue('green')).toBe(128);
      expect(color.getChannelValue('blue')).toBe(0);
      expect(color.getChannelValue('alpha')).toBe(1);
      expect(color.toString('rgb')).toBe('rgb(128, 128, 0)');
      expect(color.toString('rgba')).toBe('rgba(128, 128, 0, 1)');
      expect(color.toString('css')).toBe('rgba(128, 128, 0, 1)');
    });

    it('should parse a rgba color', function () {
      let color = parseColor('rgba(128, 128, 0, 0.5)');
      expect(color.getChannelValue('red')).toBe(128);
      expect(color.getChannelValue('green')).toBe(128);
      expect(color.getChannelValue('blue')).toBe(0);
      expect(color.getChannelValue('alpha')).toBe(0.5);
      expect(color.toString('rgb')).toBe('rgb(128, 128, 0)');
      expect(color.toString('rgba')).toBe('rgba(128, 128, 0, 0.5)');
      expect(color.toString('css')).toBe('rgba(128, 128, 0, 0.5)');
    });

    it('normalizes rgba value by clamping', function () {
      let color = parseColor('rgba(300, -10, 0, 4)');
      expect(color.getChannelValue('red')).toBe(255);
      expect(color.getChannelValue('green')).toBe(0);
      expect(color.getChannelValue('blue')).toBe(0);
      expect(color.getChannelValue('alpha')).toBe(1);
      expect(color.toString('rgba')).toBe('rgba(255, 0, 0, 1)');
    });
  });

  describe('hsl', function () {
    it('should parse a hsl color', function () {
      let color = parseColor('hsl(120, 100%, 50%)');
      expect(color.getChannelValue('hue')).toBe(120);
      expect(color.getChannelValue('saturation')).toBe(100);
      expect(color.getChannelValue('lightness')).toBe(50);
      expect(color.getChannelValue('alpha')).toBe(1);
      expect(color.toString('hsl')).toBe('hsl(120, 100%, 50%)');
      expect(color.toString('hsla')).toBe('hsla(120, 100%, 50%, 1)');
      expect(color.toString('css')).toBe('hsla(120, 100%, 50%, 1)');
    });

    it('should parse a hsla color', function () {
      let color = parseColor('hsla(120, 100%, 50%, 0.5)');
      expect(color.getChannelValue('hue')).toBe(120);
      expect(color.getChannelValue('saturation')).toBe(100);
      expect(color.getChannelValue('lightness')).toBe(50);
      expect(color.getChannelValue('alpha')).toBe(0.5);
      expect(color.toString('hsl')).toBe('hsl(120, 100%, 50%)');
      expect(color.toString('hsla')).toBe('hsla(120, 100%, 50%, 0.5)');
      expect(color.toString('css')).toBe('hsla(120, 100%, 50%, 0.5)');
    });

    it('normalizes hsla value by clamping', function () {
      let color = parseColor('hsla(-400, 120%, -4%, -1)');
      expect(color.getChannelValue('hue')).toBe(320);
      expect(color.getChannelValue('saturation')).toBe(100);
      expect(color.getChannelValue('lightness')).toBe(0);
      expect(color.getChannelValue('alpha')).toBe(0);
      expect(color.toString('hsla')).toBe('hsla(320, 100%, 0%, 0)');
    });
  });

  it('withChannelValue', () => {
    let color = parseColor('hsl(120, 100%, 50%)');
    let newColor = color.withChannelValue('hue', 200);
    expect(newColor.getChannelValue('hue')).toBe(200);
    expect(newColor.getChannelValue('saturation')).toBe(color.getChannelValue('saturation'));
    expect(newColor.getChannelValue('lightness')).toBe(color.getChannelValue('lightness'));
    expect(newColor.getChannelValue('alpha')).toBe(color.getChannelValue('alpha'));
  });

  describe('hsb', function () {
    it('should parse a hsb color', function () {
      let color = parseColor('hsb(120, 100%, 50%)');
      expect(color.getChannelValue('hue')).toBe(120);
      expect(color.getChannelValue('saturation')).toBe(100);
      expect(color.getChannelValue('brightness')).toBe(50);
      expect(color.getChannelValue('alpha')).toBe(1);
      expect(color.toString('hsb')).toBe('hsb(120, 100%, 50%)');
      expect(color.toString('hsba')).toBe('hsba(120, 100%, 50%, 1)');
    });

    it('should parse a hsba color', function () {
      let color = parseColor('hsba(120, 100%, 50%, 0.5)');
      expect(color.getChannelValue('hue')).toBe(120);
      expect(color.getChannelValue('saturation')).toBe(100);
      expect(color.getChannelValue('brightness')).toBe(50);
      expect(color.getChannelValue('alpha')).toBe(0.5);
      expect(color.toString('hsb')).toBe('hsb(120, 100%, 50%)');
      expect(color.toString('hsba')).toBe('hsba(120, 100%, 50%, 0.5)');
    });

    it('normalizes hsba value by clamping', function () {
      let color = parseColor('hsba(-400, 120%, -4%, -1)');
      expect(color.getChannelValue('hue')).toBe(320);
      expect(color.getChannelValue('saturation')).toBe(100);
      expect(color.getChannelValue('brightness')).toBe(0);
      expect(color.getChannelValue('alpha')).toBe(0);
      expect(color.toString('hsba')).toBe('hsba(320, 100%, 0%, 0)');
    });
  });

  describe('conversions', () => {
    // Since color spaces can represent unique values that don't exist in other spaces we can't test round trips easily.
    // For example: hsl 0, 1%, 0 -> rgb is 0, 0, 0 -> hsl 0, 0%, 0%
    // In order to test round trips, we can use delta-e, a way of telling the difference/distance between two colors.
    // We can use a conversion to LAB as the common ground to get the delta-e.


    let rgb = fc.tuple(fc.integer({min: 0, max: 255}), fc.integer({min: 0, max: 255}), fc.integer({min: 0, max: 255}))
      .map(([r, g, b]) => (['rgb', `rgb(${r}, ${g}, ${b})`, [r, g, b]]));
    let hsl = fc.tuple(fc.integer({min: 0, max: 360}), fc.integer({min: 0, max: 100}), fc.integer({min: 0, max: 100}))
      .map(([h, s, l]) => (['hsl', `hsl(${h}, ${s}%, ${l}%)`, [h, s, l]]));
    let hsb = fc.tuple(fc.integer({min: 0, max: 360}), fc.integer({min: 0, max: 100}), fc.integer({min: 0, max: 100}))
      .map(([h, s, b]) => (['hsb', `hsb(${h}, ${s}%, ${b}%)`, [h, s, b]]));
    let options = fc.record({
      colorSpace: fc.oneof(fc.constant('rgb'), fc.constant('hsl'), fc.constant('hsb')),
      color: fc.oneof(rgb, hsl, hsb)
    });
    let parse = {
      rgb: (rgbString) => {
        let rgbRegex = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/;
        return rgbString.match(rgbRegex).slice(1).map(Number);
      },
      hsl: (hslString) => {
        let hslRegex = /^hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)$/;
        return hslString.match(hslRegex).slice(1).map(Number);
      },
      hsb: (hsbString) => {
        let hsbRegex = /^hsb\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)$/;
        return hsbString.match(hsbRegex).slice(1).map(Number);
      }
    };
    let positionMap = {0: 'L', 1: 'A', 2: 'B'};
    let arrayToLab = (acc, item, index) => {
      acc[positionMap[index]] = item;
      return acc;
    };

    it('can perform round trips', () => {
      fc.assert(fc.property(options, ({colorSpace, color}: {colorSpace: ColorFormat, color: [string, string, number[]]}) => {
        let testColor = parseColor(color[1]);
        let convertedColor = testColor.toString(colorSpace);
        let convertedColorObj = parse[colorSpace](convertedColor);
        let labConvertedResult = space[colorSpace === 'hsb' ? 'hsv' : colorSpace].lab(convertedColorObj).reduce(arrayToLab, {});
        let labConvertedStart = space[color[0] === 'hsb' ? 'hsv' : color[0]].lab(color[2]).reduce(arrayToLab, {});
        // 1.5 chosen because that's about the limit of what humans can detect and 1.1 was the largest I found when running 100k runs of this
        // gives us a little over 30% tolerance to changes
        expect(getDeltaE00(labConvertedStart, labConvertedResult)).toBeLessThan(1.5);
      }));
    });

    // check a bare minimum that it won't blow up
    it('hsl to rgb', () => {
      expect(parseColor('hsl(0, 0%, 0%)').toString('rgb')).toBe('rgb(0, 0, 0)');
      expect(parseColor('hsl(0, 1%, 0%)').toString('rgb')).toBe('rgb(0, 0, 0)');
      expect(parseColor('hsl(0, 0%, 100%)').toString('rgb')).toBe('rgb(255, 255, 255)');
    });

    it('hsb to rgb', () => {
      expect(parseColor('hsb(0, 0%, 0%)').toString('rgb')).toBe('rgb(0, 0, 0)');
      expect(parseColor('hsb(0, 1%, 0%)').toString('rgb')).toBe('rgb(0, 0, 0)');
      expect(parseColor('hsb(0, 0%, 100%)').toString('rgb')).toBe('rgb(255, 255, 255)');
    });

    it('rgb to hsl', () => {
      expect(parseColor('rgb(0, 0, 0)').toString('hsl')).toBe('hsl(0, 0%, 0%)');
      expect(parseColor('rgb(0, 1, 0)').toString('hsl')).toBe('hsl(120, 100%, 0.2%)');
      expect(parseColor('rgb(20, 40, 60)').toString('hsl')).toBe('hsl(210, 50%, 15.69%)');
    });

    it('rgb to hsb', () => {
      expect(parseColor('rgb(0, 0, 0)').toString('hsb')).toBe('hsb(0, 0%, 0%)');
      expect(parseColor('rgb(0, 1, 0)').toString('hsb')).toBe('hsb(120, 100%, 0.39%)');
      expect(parseColor('rgb(20, 40, 60)').toString('hsb')).toBe('hsb(210, 66.67%, 23.53%)');
    });

    it('hsl to hsb', () => {
      expect(parseColor('hsl(0, 0%, 0%)').toString('hsb')).toBe('hsb(0, 0%, 0%)');
      expect(parseColor('hsl(0, 1%, 0%)').toString('hsb')).toBe('hsb(0, 0%, 0%)');
    });

    it('hsb to hsl', () => {
      expect(parseColor('hsb(0, 0%, 0%)').toString('hsl')).toBe('hsl(0, 0%, 0%)');
      expect(parseColor('hsb(0, 1%, 0%)').toString('hsl')).toBe('hsl(0, 0%, 0%)');
    });
  });
});
