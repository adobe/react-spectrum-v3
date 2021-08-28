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

import {parseColor} from '../src/Color';

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

    it('should throw on invalid hex value', function () {
      expect(() => parseColor('#ggg')).toThrow('Invalid color value: #ggg');
    });
  });

  it('should convert a color to its equivalent hex value in decimal format', function () {
    const color = parseColor('#abcdef');
    expect(color.toHexInt()).toBe(0xABCDEF);
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

    it('should convert color values to HSL or HSB and back successfully', () => {
      let rgbColor = parseColor('rgb(0, 0, 0)');
      let rangeR = rgbColor.getChannelRange('red');
      let rangeG = rgbColor.getChannelRange('green');
      let rangeB = rgbColor.getChannelRange('blue');
      let r = rangeR.minValue;
      let g = rangeG.minValue;
      let b = rangeB.minValue;
      let rgbString = rgbColor.toString('rgb');
      for (r; r < rangeR.maxValue; r += rangeR.step) {
        rgbColor = rgbColor.withChannelValue('red', r);
        rgbString = rgbColor.toString('rgb');
        expect(rgbColor.toFormat('hsl').toString('rgb')).toEqual(rgbString);
        expect(rgbColor.toFormat('hsb').toString('rgb')).toEqual(rgbString);
        for (g; g < rangeG.maxValue; g += rangeG.step) {
          rgbColor = rgbColor.withChannelValue('green', g);
          rgbString = rgbColor.toString('rgb');
          expect(rgbColor.toFormat('hsl').toString('rgb')).toEqual(rgbString);
          expect(rgbColor.toFormat('hsb').toString('rgb')).toEqual(rgbString);
          for (b; b < rangeB.maxValue; b += rangeB.step) {
            rgbColor = rgbColor.withChannelValue('blue', b);
            rgbString = rgbColor.toString('rgb');
            expect(rgbColor.toFormat('hsl').toString('rgb')).toEqual(rgbString);
            expect(rgbColor.toFormat('hsb').toString('rgb')).toEqual(rgbString);
          }
        }
      }
    });

    it('withChannelValue', () => {
      let color = parseColor('rgb(120, 225, 150)');
      let newColor = color.withChannelValue('red', 200);
      expect(newColor.getChannelValue('red')).toBe(200);
      expect(newColor.getChannelValue('green')).toBe(color.getChannelValue('green'));
      expect(newColor.getChannelValue('blue')).toBe(color.getChannelValue('blue'));
      expect(newColor.getChannelValue('alpha')).toBe(color.getChannelValue('alpha'));
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

    it('should convert color values to HSB or RGB and back successfully', () => {
      let hslColor = parseColor('hsl(0, 0%, 0%)');

      let rangeH = hslColor.getChannelRange('hue');
      let rangeS = hslColor.getChannelRange('saturation');
      let rangeL = hslColor.getChannelRange('lightness');

      let h = rangeH.minValue;
      let s = rangeS.minValue;
      let l = rangeL.minValue;

      hslColor = hslColor.withChannelValue('hue', h);
      hslColor = hslColor.withChannelValue('saturation', s);
      hslColor = hslColor.withChannelValue('lightness', l);

      for (h; h < rangeH.maxValue; h += rangeH.step) {
        hslColor = hslColor.withChannelValue('hue', h);
        expect(hslColor.toFormat('hsb').toString('hsl')).toEqual(hslColor.toString('hsl'));
        expect(hslColor.toFormat('rgb').toFormat('hsl').getDeltaE(hslColor) <= .8).toBeTruthy();
        for (s; s < rangeS.maxValue; s += rangeS.step) {
          hslColor = hslColor.withChannelValue('saturation', s);
          expect(hslColor.toFormat('hsb').toString('hsl')).toEqual(hslColor.toString('hsl'));
          expect(hslColor.toFormat('rgb').toFormat('hsl').getDeltaE(hslColor) <= .8).toBeTruthy();
          for (l; l < rangeL.maxValue; l += rangeL.step) {
            hslColor = hslColor.withChannelValue('lightness', l);
            expect(hslColor.toFormat('hsb').toString('hsl')).toEqual(hslColor.toString('hsl'));
            expect(hslColor.toFormat('rgb').toFormat('hsl').getDeltaE(hslColor) <= .8).toBeTruthy();
          }
        }
      }
    });

    it('withChannelValue', () => {
      let color = parseColor('hsl(120, 100%, 50%)');
      let newColor = color.withChannelValue('hue', 200);
      expect(newColor.getChannelValue('hue')).toBe(200);
      expect(newColor.getChannelValue('saturation')).toBe(color.getChannelValue('saturation'));
      expect(newColor.getChannelValue('lightness')).toBe(color.getChannelValue('lightness'));
      expect(newColor.getChannelValue('alpha')).toBe(color.getChannelValue('alpha'));
    });
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

    it('should convert color values to HSL or RGB and back successfully', () => {
      let hsbColor = parseColor('hsb(0, 0%, 0%)');
      let rangeH = hsbColor.getChannelRange('hue');
      let rangeS = hsbColor.getChannelRange('saturation');
      let rangeB = hsbColor.getChannelRange('brightness');

      let h = rangeH.minValue;
      let s = rangeS.minValue;
      let b = rangeB.minValue;

      hsbColor = hsbColor.withChannelValue('hue', h);
      hsbColor = hsbColor.withChannelValue('saturation', s);
      hsbColor = hsbColor.withChannelValue('brightness', b);

      for (h; h < rangeH.maxValue - 1; h += rangeH.step) {
        hsbColor = hsbColor.withChannelValue('hue', h);
        expect(hsbColor.toFormat('hsl').toString('hsb')).toEqual(hsbColor.toString('hsb'));
        expect(hsbColor.toFormat('rgb').toFormat('hsb').getDeltaE(hsbColor) <= .8).toBeTruthy();
        for (s; s < rangeS.maxValue - 1; s += rangeS.step) {
          hsbColor = hsbColor.withChannelValue('saturation', s);
          expect(hsbColor.toFormat('hsl').toString('hsb')).toEqual(hsbColor.toString('hsb'));
          expect(hsbColor.toFormat('rgb').toFormat('hsb').getDeltaE(hsbColor) <= .8).toBeTruthy();
          for (b; b < rangeB.maxValue - 1; b += rangeB.step) {
            hsbColor = hsbColor.withChannelValue('brightness', b);
            expect(hsbColor.toFormat('hsl').toString('hsb')).toEqual(hsbColor.toString('hsb'));
            expect(hsbColor.toFormat('rgb').toFormat('hsb').getDeltaE(hsbColor) <= .8).toBeTruthy();
          }
        }
      }
    });

    it('withChannelValue', () => {
      let color = parseColor('hsb(120, 100%, 50%)');
      let newColor = color.withChannelValue('hue', 200);
      expect(newColor.getChannelValue('hue')).toBe(200);
      expect(newColor.getChannelValue('saturation')).toBe(color.getChannelValue('saturation'));
      expect(newColor.getChannelValue('brightness')).toBe(color.getChannelValue('brightness'));
      expect(newColor.getChannelValue('alpha')).toBe(color.getChannelValue('alpha'));
    });
  });

  describe('css color name', function () {
    it('should parse a css color name', function () {
      let color = parseColor('papayawhip');
      expect(color.getChannelValue('red')).toBe(255);
      expect(color.getChannelValue('green')).toBe(239);
      expect(color.getChannelValue('blue')).toBe(213);
      expect(color.getChannelValue('alpha')).toBe(1);
      expect(color.toString('hex')).toBe('#FFEFD5');
      expect(color.toString('rgba')).toBe('rgba(255, 239, 213, 1)');
      expect(color.toString('css')).toBe('rgba(255, 239, 213, 1)');
    });

    it('should throw on invalid css colorname value', function () {
      expect(() => parseColor('bluebish')).toThrow('Invalid color value: bluebish');
    });
  });

  describe('#getColorName', function () {
    it('should return localized color name', function () {
      let color = parseColor('papayawhip');
      expect(color.getColorName('en-US')).toBe('Papaya Whip');
      color = parseColor('hsl(30, 0%, 22.5%)');
      expect(color.getColorName('en-US')).toBe('Gray 23%');
      color = parseColor('hsl(30, 50%, 100%)');
      expect(color.getColorName('en-US')).toBe('White');
      color = parseColor('hsl(30, 100%, 0%)');
      expect(color.getColorName('en-US')).toBe('Black');
      color = parseColor('#E78B8B');
      expect(color.getColorName('en-US')).toBe('Pink');
      color = parseColor('#E7E7B8');
      expect(color.getColorName('en-US')).toBe('Pale, Light Grayish Olive');
      color = parseColor('hsl(30, 39%, 25%)');
      expect(color.getColorName('en-US')).toBe('Brown');
      color = parseColor('hsb(200, 60%, 62%)');
      expect(color.getColorName('en-US')).toBe('Moderate Cornflower Blue');
    });
  });
});
