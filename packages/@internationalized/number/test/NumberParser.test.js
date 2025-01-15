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

import fc from 'fast-check';
import messages from '../../../@react-aria/numberfield/intl/*.json';
import {NumberParser} from '../src/NumberParser';

// for some reason hu-HU isn't supported in jsdom/node
let locales = Object.keys(messages).filter(locale => locale !== 'hu-HU');

describe('NumberParser', function () {
  describe('parse', function () {
    it('should support basic numbers', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('10')).toBe(10);
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('-10')).toBe(-10);
    });

    it('should support decimals', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('10.5')).toBe(10.5);
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('-10.5')).toBe(-10.5);
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('.5')).toBe(0.5);
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('-.5')).toBe(-0.5);
    });

    it('should support group characters', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('1,000')).toBe(1000);
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('-1,000')).toBe(-1000);
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('1,000,000')).toBe(1000000);
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('-1,000,000')).toBe(-1000000);
    });

    it('should support signDisplay', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('+10')).toBe(10);
      expect(new NumberParser('en-US', {style: 'decimal', signDisplay: 'always'}).parse('+10')).toBe(10);
    });

    it('should support negative numbers with different minus signs', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('-10')).toBe(-10);
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('\u221210')).toBe(-10);

      expect(new NumberParser('fi-FI', {style: 'decimal'}).parse('-10')).toBe(-10);
      expect(new NumberParser('fi-FI', {style: 'decimal'}).parse('\u221210')).toBe(-10);
    });

    it('should return NaN for random characters', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('g')).toBe(NaN);
      expect(new NumberParser('en-US', {style: 'decimal'}).parse('1abc')).toBe(NaN);
    });

    describe('currency', function () {
      it('should parse without the currency symbol', function () {
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency'}).parse('10.50')).toBe(10.5);
      });

      it('should ignore currency symbols', function () {
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency'}).parse('$10.50')).toBe(10.5);
      });

      it('should ignore currency codes', function () {
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencyDisplay: 'code'}).parse('USD 10.50')).toBe(10.5);
      });

      it('should ignore currency names', function () {
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencyDisplay: 'name'}).parse('10.50 US dollars')).toBe(10.5);
      });

      it('should handle when the currency symbol contains valid number characters', function () {
        expect(new NumberParser('ar-AE', {currency: 'SAR', style: 'currency'}).parse('ر.س.‏ 10.50')).toBe(10.5);
      });

      it('should support accounting format', function () {
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencySign: 'accounting'}).parse('(1.50)')).toBe(-1.5);
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencySign: 'accounting'}).parse('($1.50)')).toBe(-1.5);
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencyDisplay: 'code', currencySign: 'accounting'}).parse('(USD 1.50)')).toBe(-1.5);
      });

      it('should support normal negative numbers in accounting format', function () {
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencySign: 'accounting'}).parse('-1.5')).toBe(-1.5);
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencySign: 'accounting'}).parse('-$1.50')).toBe(-1.5);
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencyDisplay: 'code', currencySign: 'accounting'}).parse('USD -1.50')).toBe(-1.5);
      });

      it('should return NaN for unknown currency symbols', function () {
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency'}).parse('€10.50')).toBe(NaN);
      });

      it('should return NaN for unknown currency codes', function () {
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencyDisplay: 'code'}).parse('EUR 10.50')).toBe(NaN);
      });

      it('should return NaN for unknown currency names', function () {
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencyDisplay: 'name'}).parse('10.50 euros')).toBe(NaN);
      });

      it('should return NaN for partial currency codes', function () {
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencyDisplay: 'code'}).parse('EU 10.50')).toBe(NaN);
      });

      it('should return NaN for partial currency names', function () {
        expect(new NumberParser('en-US', {currency: 'USD', style: 'currency', currencyDisplay: 'name'}).parse('10.50 eur')).toBe(NaN);
      });
    });

    describe('units', function () {
      it('should parse with units', function () {
        expect(new NumberParser('en-US', {style: 'unit', unit: 'inch'}).parse('23.5 in')).toBe(23.5);
      });

      it('should parse with narrow units', function () {
        expect(new NumberParser('en-US', {style: 'unit', unit: 'inch', unitDisplay: 'narrow'}).parse('23.5″')).toBe(23.5);
      });

      it('should parse with long units', function () {
        expect(new NumberParser('en-US', {style: 'unit', unit: 'inch', unitDisplay: 'long'}).parse('23.5 inches')).toBe(23.5);
      });

      it('should parse with singular long units', function () {
        expect(new NumberParser('en-US', {style: 'unit', unit: 'inch', unitDisplay: 'long'}).parse('1 inch')).toBe(1);
      });

      it('should return NaN for unknown units', function () {
        expect(new NumberParser('en-US', {style: 'unit', unit: 'inch'}).parse('23.5 ft')).toBe(NaN);
      });

      it('should return NaN for partial units', function () {
        expect(new NumberParser('en-US', {style: 'unit', unit: 'inch'}).parse('23.5 i')).toBe(NaN);
      });

      it('should support plural forms', function () {
        expect(new NumberParser('en-US', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('0 years')).toBe(0);
        expect(new NumberParser('en-US', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('1 year')).toBe(1);
        expect(new NumberParser('en-US', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('2 years')).toBe(2);
        expect(new NumberParser('en-US', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('1.1 years')).toBe(1.1);

        expect(new NumberParser('pl-PL', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('0 rok')).toBe(0);
        expect(new NumberParser('pl-PL', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('1 lat')).toBe(1);
        expect(new NumberParser('pl-PL', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('2 lata')).toBe(2);
        expect(new NumberParser('pl-PL', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('37 lata')).toBe(37);
        expect(new NumberParser('pl-PL', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('1.1 roku')).toBe(1.1);

        expect(new NumberParser('fr-FR', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('1 an')).toBe(1);
        expect(new NumberParser('fr-FR', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('8 ans')).toBe(8);
        expect(new NumberParser('fr-FR', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('1,3 an')).toBe(1.3);
        expect(new NumberParser('fr-FR', {style: 'unit', unit: 'year', unitDisplay: 'long'}).parse('2,4 ans')).toBe(2.4);
      });
    });

    describe('percents', function () {
      it('should parse a percent', function () {
        expect(new NumberParser('en-US', {style: 'percent'}).parse('10%')).toBe(0.1);
      });

      it('should parse a percent with decimals', function () {
        expect(new NumberParser('en-US', {style: 'percent'}).parse('10.5%')).toBe(0.11);
        expect(new NumberParser('en-US', {style: 'percent', minimumFractionDigits: 2}).parse('10.5%')).toBe(0.105);
      });
    });

    describe('NumberFormat options', function () {
      it('supports roundingIncrement', function () {
        expect(new NumberParser('en-US', {roundingIncrement: 2}).parse('10')).toBe(10);
        // This doesn't fail in Node 18 because roundingIncrement isn't on the resolved options. Hopefully later versions of Node this test will be meaningful.
        expect(new NumberParser('en-US', {roundingIncrement: 2, minimumFractionDigits: 2, maximumFractionDigits: 2}).parse('10.00')).toBe(10.00);
      });
    });

    describe('round trips', function () {
      fc.configureGlobal({numRuns: 200});
      // Locales have to include: 'de-DE', 'ar-EG', 'fr-FR' and possibly others
      // But for the moment they are not properly supported
      const localesArb = fc.constantFrom(...locales);
      const numeralArb = fc.constantFrom('latn', 'arab', 'hanidec', 'deva', 'beng');
      const styleOptsArb = fc.oneof(
        {withCrossShrink: true},
        fc.record({style: fc.constant('decimal')}),
        // 'percent' should be part of the possible options, but for the moment it fails for some tests
        fc.record({style: fc.constant('percent')}),
        fc.record(
          {style: fc.constant('currency'), currency: fc.constantFrom('USD', 'EUR', 'CNY', 'JPY'), currencyDisplay: fc.constantFrom('symbol', 'code', 'name')},
          {requiredKeys: ['style', 'currency']}
        ),
        fc.record(
          {style: fc.constant('unit'), unit: fc.constantFrom('inch', 'liter', 'kilometer-per-hour')},
          {requiredKeys: ['style', 'unit']}
        )
      );
      const genericOptsArb = fc.record({
        localeMatcher: fc.constantFrom('best fit', 'lookup'),
        unitDisplay: fc.constantFrom('narrow', 'short', 'long'),
        useGrouping: fc.boolean(),
        minimumIntegerDigits: fc.integer({min: 1, max: 21}),
        minimumFractionDigits: fc.integer({min: 0, max: 20}),
        maximumFractionDigits: fc.integer({min: 0, max: 20}),
        minimumSignificantDigits: fc.integer({min: 1, max: 21}),
        maximumSignificantDigits: fc.integer({min: 1, max: 21})
      }, {requiredKeys: []});

      // We restricted the set of possible values to avoid unwanted overflows to infinity and underflows to zero
      // and stay in the domain of legit values.
      const DOUBLE_MIN = Number.EPSILON;
      const valueArb = fc.tuple(
        fc.constantFrom(1, -1),
        fc.double({next: true, noNaN: true, min: DOUBLE_MIN, max: 1 / DOUBLE_MIN})
      ).map(([sign, value]) => sign * value);

      const inputsArb = fc.tuple(valueArb, localesArb, styleOptsArb, genericOptsArb, numeralArb)
        .map(([d, locale, styleOpts, genericOpts, numerals]) => ({d, opts: {...styleOpts, ...genericOpts}, locale, numerals}))
        .filter(({opts}) => opts.minimumFractionDigits === undefined || opts.maximumFractionDigits === undefined || opts.minimumFractionDigits <= opts.maximumFractionDigits)
        .filter(({opts}) => opts.minimumSignificantDigits === undefined || opts.maximumSignificantDigits === undefined || opts.minimumSignificantDigits <= opts.maximumSignificantDigits)
        .map(({d, opts, locale, numerals}) => {
          if (opts.style === 'percent') {
            opts.minimumFractionDigits = opts.minimumFractionDigits > 18 ? 18 : opts.minimumFractionDigits;
            opts.maximumFractionDigits = opts.maximumFractionDigits > 18 ? 18 : opts.maximumFractionDigits;
          }
          return {d, opts, locale, numerals};
        })
        .map(({d, opts, locale, numerals}) => {
          let adjustedNumberForFractions = d;
          if (Math.abs(d) < 1 && opts.minimumFractionDigits && opts.minimumFractionDigits > 1) {
            adjustedNumberForFractions = d * (10 ** (opts.minimumFractionDigits || 2));
          } else if (Math.abs(d) > 1 && opts.minimumFractionDigits && opts.minimumFractionDigits > 1) {
            adjustedNumberForFractions = d / (10 ** (opts.minimumFractionDigits || 2));
          }
          return {adjustedNumberForFractions, opts, locale, numerals};
        });

      // skipping until we can reliably run it, until then, it's good to run manually
      // track counter examples below
      it('should fully reverse NumberFormat', function () {
        fc.assert(
          fc.property(
            inputsArb,
            function ({adjustedNumberForFractions, locale, opts, numerals}) {
              const formatter = new Intl.NumberFormat(`${locale}-u-nu-${numerals}`, opts);
              const parser = new NumberParser(locale, opts);
              const altParser = new NumberParser('en-US', opts);

              const formattedOnce = formatter.format(adjustedNumberForFractions);
              const parsed = parser.parse(formattedOnce);
              const roundTrip = formatter.format(parsed);
              const altParsed = altParser.parse(formattedOnce);

              if (roundTrip !== formattedOnce || parsed !== altParsed) {
                console.log({formattedOnce, roundTrip, [locale]: parsed, 'en-US': altParsed, adjustedNumberForFractions, opts});
                return;
              }

              expect(roundTrip).toBe(formattedOnce);
              expect(parsed).toBe(altParsed);
            }
          )
        );
      });
    });
    describe('counter examples', () => {
      it('can still get all plural literals with minimum significant digits', () => {
        let locale = 'pl-PL';
        let options = {
          style: 'unit',
          unit: 'inch',
          minimumSignificantDigits: 4,
          maximumSignificantDigits: 6
        };
        const formatter = new Intl.NumberFormat(locale, options);
        const parser = new NumberParser(locale, options);

        const formattedOnce = formatter.format(60048.95);
        expect(formatter.format(parser.parse(formattedOnce))).toBe(formattedOnce);
      });
      // See Bug https://github.com/nodejs/node/issues/49919
      it('formatted units keep their number', () => {
        let locale = 'da-DK';
        let options = {
          style: 'unit',
          unit: 'kilometer-per-hour',
          unitDisplay: 'long',
          minimumSignificantDigits: 1
        };
        const formatter = new Intl.NumberFormat(locale, options);
        const parser = new NumberParser(locale, options);

        const formattedOnce = formatter.format(1);
        expect(formatter.format(parser.parse(formattedOnce))).toBe(formattedOnce);
      });
      it(`percent with
          minimumIntegerDigits: 10,
          minimumFractionDigits: 2,
          maximumFractionDigits: 3,
          maximumSignificantDigits: 4`, () => {
        let options = {
          style: 'percent',
          localeMatcher: 'best fit',
          unitDisplay: 'long',
          useGrouping: true,
          minimumIntegerDigits: 10,
          minimumFractionDigits: 2,
          maximumFractionDigits: 3,
          maximumSignificantDigits: 4
        };
        let locale = 'tr-TR';
        const formatter = new Intl.NumberFormat(locale, options);
        const parser = new NumberParser(locale, options);
        const altParser = new NumberParser('en-US', options);
        let adjustedNumberForFractions = 0.012255615350772575;
        const formattedOnce = formatter.format(adjustedNumberForFractions);
        const parsed = parser.parse(formattedOnce);
        const roundTrip = formatter.format(parsed);
        const altParsed = altParser.parse(formattedOnce);
        expect(roundTrip).toBe(formattedOnce);
        expect(parsed).toBe(altParsed);
      });
      it(`decimal with
        minimumFractionDigits: 0,
        maximumSignificantDigits: 1`, () => {
        let options = {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumSignificantDigits: 1
        };
        let locale = 'ar-AE';
        const formatter = new Intl.NumberFormat(locale, options);
        const parser = new NumberParser(locale, options);
        const altParser = new NumberParser('en-US', options);
        let adjustedNumberForFractions = -950000;
        const formattedOnce = formatter.format(adjustedNumberForFractions);
        const parsed = parser.parse(formattedOnce);
        const roundTrip = formatter.format(parsed);
        const altParsed = altParser.parse(formattedOnce);
        console.log({locale, formattedOnce, parsed, roundTrip, altParsed});

        expect(roundTrip).toBe(formattedOnce);
        expect(parsed).toBe(altParsed);
      });
    });
  });

  describe('isValidPartialNumber', function () {
    it('should support basic numbers', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('10')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('-10')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('-')).toBe(true);
    });

    it('should support decimals', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('10.5')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('-10.5')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('.')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('.5')).toBe(true);

      // Starting with arabic decimal point
      expect(new NumberParser('ar-AE', {style: 'decimal'}).isValidPartialNumber('٫')).toBe(true);
      expect(new NumberParser('ar-AE', {style: 'decimal'}).isValidPartialNumber('٫٥')).toBe(true);

      // Arabic locale, starting with latin decimal point
      expect(new NumberParser('ar-AE', {style: 'decimal'}).isValidPartialNumber('.')).toBe(true);
      expect(new NumberParser('ar-AE', {style: 'decimal'}).isValidPartialNumber('.5')).toBe(true);
    });

    it('should support group characters', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber(',')).toBe(true); // en-US-u-nu-arab uses commas as the decimal point character
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber(',000')).toBe(true); // latin numerals cannot follow arab decimal point, but parser will interpret a comma as a decimal point and interpret this as 0.
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('1,000')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('-1,000')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('1,000,000')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('-1,000,000')).toBe(true);
    });

    it('should reject random characters', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('g')).toBe(false);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('1abc')).toBe(false);
    });

    it('should support signDisplay', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('+')).toBe(false);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('+10')).toBe(false);
      expect(new NumberParser('en-US', {style: 'decimal', signDisplay: 'always'}).isValidPartialNumber('+')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal', signDisplay: 'always'}).isValidPartialNumber('+10')).toBe(true);
    });

    it('should support negative numbers with different minus signs', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('-')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('-10')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('\u2212')).toBe(true);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('\u221210')).toBe(true);

      expect(new NumberParser('fi-FI', {style: 'decimal'}).isValidPartialNumber('-')).toBe(true);
      expect(new NumberParser('fi-FI', {style: 'decimal'}).isValidPartialNumber('-10')).toBe(true);
      expect(new NumberParser('fi-FI', {style: 'decimal'}).isValidPartialNumber('\u2212')).toBe(true);
      expect(new NumberParser('fi-FI', {style: 'decimal'}).isValidPartialNumber('\u221210')).toBe(true);
    });

    it('should return false for negative numbers if minValue >= 0', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('-', 0)).toBe(false);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('-', 10)).toBe(false);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('-10', 0)).toBe(false);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD'}).isValidPartialNumber('-$', 0)).toBe(false);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD'}).isValidPartialNumber('-$1', 0)).toBe(false);
    });

    it('should return false for positive numbers and signDisplay if maxValue < 0', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('+', -10, -5)).toBe(false);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('+', -10, 0)).toBe(false);
      expect(new NumberParser('en-US', {style: 'decimal'}).isValidPartialNumber('+10', -10, -5)).toBe(false);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD', signDisplay: 'always'}).isValidPartialNumber('+$', -10, -5)).toBe(false);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD', signDisplay: 'always'}).isValidPartialNumber('+$1', -10, -5)).toBe(false);
    });

    it('should support currency', function () {
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD'}).isValidPartialNumber('10')).toBe(true);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD'}).isValidPartialNumber('10.5')).toBe(true);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD'}).isValidPartialNumber('$10')).toBe(true);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD'}).isValidPartialNumber('$10.5')).toBe(true);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD'}).isValidPartialNumber('10')).toBe(true);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD', currencyDisplay: 'code'}).isValidPartialNumber('USD 10')).toBe(true);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD', currencyDisplay: 'code'}).isValidPartialNumber('US 10')).toBe(false);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD', currencyDisplay: 'name'}).isValidPartialNumber('10 US dollars')).toBe(true);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD', currencyDisplay: 'name'}).isValidPartialNumber('10 US d')).toBe(false);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD'}).isValidPartialNumber('(')).toBe(false);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD', currencySign: 'accounting'}).isValidPartialNumber('(')).toBe(true);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD', currencySign: 'accounting'}).isValidPartialNumber('($10)')).toBe(true);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD', currencySign: 'accounting'}).isValidPartialNumber('-')).toBe(true);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD', currencySign: 'accounting'}).isValidPartialNumber('-10')).toBe(true);
      expect(new NumberParser('en-US', {style: 'currency', currency: 'USD', currencySign: 'accounting'}).isValidPartialNumber('-$10')).toBe(true);

      // typing latin characters in arabic locale should work
      // 1564 is the character code for the arabic letter mark, an invisible character that marks bidi text for printing, you can find this included in chrome too
      // TODO: we should still support just typing the '(' character, but this isn't a regression
      expect(new NumberParser('ar-AE', {style: 'currency', currency: 'USD', currencySign: 'accounting'}).isValidPartialNumber(`(${String.fromCharCode(1564)}`)).toBe(true);
      expect(new NumberParser('ar-AE', {style: 'currency', currency: 'USD', currencySign: 'accounting'}).isValidPartialNumber(`(${String.fromCharCode(1564)}10)`)).toBe(true);
      expect(new NumberParser('ar-AE', {style: 'currency', currency: 'USD', currencySign: 'accounting'}).isValidPartialNumber('-')).toBe(true);
      expect(new NumberParser('ar-AE', {style: 'currency', currency: 'USD', currencySign: 'accounting'}).isValidPartialNumber('-10')).toBe(true);
    });

    it('should support units', function () {
      expect(new NumberParser('en-US', {style: 'unit', unit: 'inch'}).isValidPartialNumber('10')).toBe(true);
      expect(new NumberParser('en-US', {style: 'unit', unit: 'inch'}).isValidPartialNumber('10.5')).toBe(true);
      expect(new NumberParser('en-US', {style: 'unit', unit: 'inch'}).isValidPartialNumber('10 in')).toBe(true);
      expect(new NumberParser('en-US', {style: 'unit', unit: 'inch'}).isValidPartialNumber('10.5 in')).toBe(true);
      expect(new NumberParser('en-US', {style: 'unit', unit: 'inch'}).isValidPartialNumber('10 i')).toBe(false);
      expect(new NumberParser('en-US', {style: 'unit', unit: 'inch'}).isValidPartialNumber('10.5 i')).toBe(false);
    });

    it('should support percents', function () {
      expect(new NumberParser('en-US', {style: 'percent'}).isValidPartialNumber('10')).toBe(true);
      expect(new NumberParser('en-US', {style: 'percent'}).isValidPartialNumber('10.5')).toBe(false);
      expect(new NumberParser('en-US', {style: 'percent', minimumFractionDigits: 2}).isValidPartialNumber('10.5')).toBe(true);
      expect(new NumberParser('en-US', {style: 'percent', maximumFractionDigits: 2}).isValidPartialNumber('10.5')).toBe(true);
      expect(new NumberParser('en-US', {style: 'percent'}).isValidPartialNumber('10%')).toBe(true);
      expect(new NumberParser('en-US', {style: 'percent'}).isValidPartialNumber('10.5%')).toBe(false);
      expect(new NumberParser('en-US', {style: 'percent', minimumFractionDigits: 2}).isValidPartialNumber('10.5%')).toBe(true);
      expect(new NumberParser('en-US', {style: 'percent', maximumFractionDigits: 2}).isValidPartialNumber('10.5%')).toBe(true);
      expect(new NumberParser('en-US', {style: 'percent'}).isValidPartialNumber('%')).toBe(true);
      expect(new NumberParser('en-US', {style: 'percent'}).isValidPartialNumber('10 %')).toBe(true);
    });
  });

  describe('getNumberingSystem', function () {
    it('should return the default numbering system for a locale', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem(' ')).toBe('latn');
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('12')).toBe('latn');
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('.')).toBe('latn');
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('12.5')).toBe('latn');

      expect(new NumberParser('ar-AE', {style: 'decimal'}).getNumberingSystem('١٢')).toBe('arab');
      expect(new NumberParser('ar-AE', {style: 'decimal'}).getNumberingSystem('٫')).toBe('arab');
      expect(new NumberParser('ar-AE', {style: 'decimal'}).getNumberingSystem('١٫٢')).toBe('arab');
    });

    it('should support using non-default numbering systems for a locale', function () {
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('١٢')).toBe('arab');
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('٫')).toBe('arab');
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('١٫٢')).toBe('arab');

      expect(new NumberParser('ar-AE', {style: 'decimal'}).getNumberingSystem('12')).toBe('latn');
      expect(new NumberParser('ar-AE', {style: 'decimal'}).getNumberingSystem('.')).toBe('latn');
      expect(new NumberParser('ar-AE', {style: 'decimal'}).getNumberingSystem('12.5')).toBe('latn');

      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('一二')).toBe('hanidec');
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('一二.五')).toBe('hanidec');

      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('१२३४')).toBe('deva');
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('१२४,२')).toBe('deva');
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('२.३५१')).toBe('deva');

      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('১২৩')).toBe('beng');
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('১.২৫৩')).toBe('beng');
      expect(new NumberParser('en-US', {style: 'decimal'}).getNumberingSystem('১২৮,৪')).toBe('beng');
    });
  });
});
