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

import {NumberFormatter} from './NumberFormatter';

interface Symbols {
  minusSign?: string,
  plusSign?: string,
  decimal?: string,
  group?: string,
  literals: RegExp,
  numeral: RegExp,
  index: (v: string) => string
}

let supportedLocales: string[] = [
  'ar-AE', // Arabic (United Arab Emirates)
  'bg-BG', // Bulgarian (Bulgaria)
  'zh-CN', // Chinese (Simplified)
  'zh-TW', // Chinese (Traditional)
  'hr-HR', // Croatian (Croatia)
  'cs-CZ', // Czech (Czech Republic)
  'da-DK', // Danish (Denmark)
  'nl-NL', // Dutch (Netherlands)
  'en-GB', // English (Great Britain)
  'en-US', // English (United States)
  'et-EE', // Estonian (Estonia)
  'fi-FI', // Finnish (Finland)
  'fr-CA', // French (Canada)
  'fr-FR', // French (France)
  'de-DE', // German (Germany)
  'el-GR', // Greek (Greece)
  'he-IL', // Hebrew (Israel)
  'hu-HU', // Hungarian (Hungary)
  'it-IT', // Italian (Italy)
  'ja-JP', // Japanese (Japan)
  'ko-KR', // Korean (Korea)
  'lv-LV', // Latvian (Latvia)
  'lt-LT', // Lithuanian (Lithuania)
  'no-NO', // Norwegian (Norway)
  'pl-PL', // Polish (Poland)
  'pt-BR', // Portuguese (Brazil)
  'ro-RO', // Romanian (Romania)
  'ru-RU', // Russian (Russia)
  'sr-RS', // Serbian (Serbia)
  'sk-SK', // Slovakian (Slovakia)
  'sl-SI', // Slovenian (Slovenia)
  'es-ES', // Spanish (Spain)
  'sv-SE', // Swedish (Sweden)
  'tr-TR', // Turkish (Turkey)
  'uk-UA'  // Ukrainian (Ukraine)
];

const CURRENCY_SIGN_REGEX = new RegExp('^.*\\(.*\\).*$');
const NUMBERING_SYSTEMS = ['latn', 'arab', 'hanidec', 'deva', 'beng'];
const MINUS_SIGN_SYMBOLS = '\u002D\u2212';
const MINUS_SIGN_REGEX = new RegExp(`[${MINUS_SIGN_SYMBOLS}]`, 'g');
const AMBIGUOUS_SYMBOLS = ',.';
const ARABIC_THOUSANDS_SEPARATOR = '\u066C';
const ARABIC_DECIMAL_SEPARATOR = '\u066B';
const LRM_RLM_REGEX = /[\u200E\u200F]/g;
const DECIMAL_SYMBOLS = `${AMBIGUOUS_SYMBOLS}${ARABIC_DECIMAL_SEPARATOR}`;
const NUMERALS_LATN = '0123456789';
const NUMERALS_ARAB = '\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669';
const NUMERALS_HANIDEC = '\u3007\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D';
const NUMERALS_PATTERN = `[${NUMERALS_LATN}]|[${NUMERALS_ARAB}]|[${NUMERALS_HANIDEC}]`;
const NUMERALS_REGEX = new RegExp(NUMERALS_PATTERN, 'g');
const NON_AMBIGUOUS_GROUPING_SYMBOLS = ` \u00A0\u202F${ARABIC_THOUSANDS_SEPARATOR}\u2019`;
const NON_AMBIGUOUS_GROUPING_SYMBOLS_REGEX = new RegExp(`[${NON_AMBIGUOUS_GROUPING_SYMBOLS}]`, 'g');
const GROUPING_SYMBOLS = `${AMBIGUOUS_SYMBOLS}${NON_AMBIGUOUS_GROUPING_SYMBOLS}`;
const GROUPING_SYMBOLS_REGEX = new RegExp(`[${GROUPING_SYMBOLS}]`, 'g');
const DECIMAL_PART_REGEX = new RegExp(`(?<part>(?:(?<symbol>(?:[${DECIMAL_SYMBOLS}]))(?<digits>(?:${NUMERALS_PATTERN})*)))?$`, 'u');
const LEADING_ZERO_REGEX = /^[0\u0660\u3007]+/g;

/**
 * A NumberParser can be used to perform locale-aware parsing of numbers from Unicode strings,
 * as well as validation of partial user input. It automatically detects the numbering system
 * used in the input, and supports parsing decimals, percentages, currency values, and units
 * according to the locale.
 */
export class NumberParser {
  private locale: string;
  private options: Intl.NumberFormatOptions;

  constructor(locale: string, options: Intl.NumberFormatOptions = {}) {
    this.locale = locale;
    this.options = options;
  }

  /**
   * Parses the given string to a number. Returns NaN if a valid number could not be parsed.
   */
  parse(value: string): number {
    let parser = getNumberParserImpl(this.locale, this.options, value);
    let number = parser.parse(value);

    if (isNaN(number)) {
      // If the number couldn't be parsed, try again using other locales.
      for (let locale of supportedLocales.filter(l => l !== this.locale)) {
        parser = getNumberParserImpl(locale, this.options, value);
        number = parser.parse(value);
        if (!isNaN(number)) {
          return number;
        }
        // If the number still couldn't be parsed, try again using other numbering systems.
        for (let numberingSystem of NUMBERING_SYSTEMS) {
          locale = locale + (locale.includes('-u-') ? '-nu-' : '-u-nu-') + numberingSystem;
          parser = getNumberParserImpl(locale, this.options, value);
          number = parser.parse(value);
          if (!isNaN(number)) {
            return number;
          }
        }
      }
      // console.log(number, value, {locale: this.locale, options: this.options});
    }

    return number;
  }

  /**
   * Returns whether the given string could potentially be a valid number. This should be used to
   * validate user input as the user types. If a `minValue` or `maxValue` is provided, the validity
   * of the minus/plus sign characters can be checked.
   */
  isValidPartialNumber(value: string, minValue?: number, maxValue?: number): boolean {
    return getNumberParserImpl(this.locale, this.options, value).isValidPartialNumber(value, minValue, maxValue);
  }

  /**
   * Returns a numbering system for which the given string is valid in the current locale.
   * If no numbering system could be detected, the default numbering system for the current
   * locale is returned.
   */
  getNumberingSystem(value: string): string {
    return getNumberParserImpl(this.locale, this.options, value).options.numberingSystem;
  }
}

const numberParserCache = new Map<string, NumberParserImpl>();
function getNumberParserImpl(locale: string, options: Intl.NumberFormatOptions, value: string) {
  // First try the default numbering system for the provided locale
  let defaultParser = getCachedNumberParser(locale, options);

  // If that doesn't match, and the locale doesn't include a hard coded numbering system,
  // try each of the other supported numbering systems until we find one that matches.
  if (!locale.includes('-nu-') && !defaultParser.isValidPartialNumber(value)) {
    for (let numberingSystem of NUMBERING_SYSTEMS) {
      if (numberingSystem !== defaultParser.options.numberingSystem) {
        let parser = getCachedNumberParser(locale + (locale.includes('-u-') ? '-nu-' : '-u-nu-') + numberingSystem, options);
        if (parser.isValidPartialNumber(value)) {
          return parser;
        }
      }
    }
  }

  return defaultParser;
}

function getCachedNumberParser(locale: string, options: Intl.NumberFormatOptions) {
  let cacheKey = locale + (options ? Object.entries(options).sort((a, b) => a[0] < b[0] ? -1 : 1).join() : '');
  let parser = numberParserCache.get(cacheKey);
  if (!parser) {
    parser = new NumberParserImpl(locale, options);
    numberParserCache.set(cacheKey, parser);
  }

  return parser;
}

// The actual number parser implementation. Instances of this class are cached
// based on the locale, options, and detected numbering system.
class NumberParserImpl {
  formatter: Intl.NumberFormat;
  options: Intl.ResolvedNumberFormatOptions;
  symbols: Symbols;
  locale: string;

  constructor(locale: string, options: Intl.NumberFormatOptions = {}) {
    this.locale = locale;
    this.formatter = new Intl.NumberFormat(locale, options);
    this.options = this.formatter.resolvedOptions();
    this.symbols = getSymbols(locale, this.formatter, this.options, options);
    if (this.options.style === 'percent' && ((this.options.minimumFractionDigits ?? 0) > 18 || (this.options.maximumFractionDigits ?? 0) > 18)) {
      console.warn('NumberParser cannot handle percentages with greater than 18 decimal places, please reduce the number in your options.');
    }
  }

  parse(value: string) {
    // to parse the number, we need to remove anything that isn't actually part of the number, for example we want '-10.40' not '-10.40 USD'
    let fullySanitizedValue = this.sanitize(value);

    if (this.symbols.group) {
      // Remove group characters, and replace decimal points and numerals with ASCII values.
      fullySanitizedValue = replaceAll(fullySanitizedValue, this.symbols.group, '');
    }
    if (this.symbols.decimal) {
      fullySanitizedValue = fullySanitizedValue.replace(this.symbols.decimal!, '.');
    }
    if (this.symbols.minusSign) {
      fullySanitizedValue = fullySanitizedValue.replace(this.symbols.minusSign!, '-');
    }
    fullySanitizedValue = fullySanitizedValue.replace(this.symbols.numeral, this.symbols.index);

    if (this.options.style === 'percent') {
      // javascript is bad at dividing by 100 and maintaining the same significant figures, so perform it on the string before parsing
      let isNegative = fullySanitizedValue.indexOf('-');
      fullySanitizedValue = fullySanitizedValue.replace('-', '');
      let index = fullySanitizedValue.indexOf('.');
      if (index === -1) {
        index = fullySanitizedValue.length;
      }
      fullySanitizedValue = fullySanitizedValue.replace('.', '');
      if (index - 2 === 0) {
        fullySanitizedValue = `0.${fullySanitizedValue}`;
      } else if (index - 2 === -1) {
        fullySanitizedValue = `0.0${fullySanitizedValue}`;
      } else if (index - 2 === -2) {
        fullySanitizedValue = '0.00';
      } else if (fullySanitizedValue.slice(index - 2) !== '') {
        fullySanitizedValue = `${fullySanitizedValue.slice(0, index - 2)}.${fullySanitizedValue.slice(index - 2)}`;
      }
      if (isNegative > -1) {
        fullySanitizedValue = `-${fullySanitizedValue}`;
      }
    }

    // Remove LRM and RLM characters, which are used in some locales to control text direction.
    fullySanitizedValue = fullySanitizedValue?.replace(LRM_RLM_REGEX, '');

    let newValue = fullySanitizedValue ? +fullySanitizedValue : NaN;
    if (isNaN(newValue)) {
      return NaN;
    }

    if (this.options.style === 'percent') {
      // extra step for rounding percents to what our formatter would output
      let options = {
        ...this.options,
        style: 'decimal' as const,
        minimumFractionDigits: Math.min((this.options.minimumFractionDigits ?? 0) + 2, 20),
        maximumFractionDigits: Math.min((this.options.maximumFractionDigits ?? 0) + 2, 20)
      };
      return (new NumberParser(this.locale, options)).parse(new NumberFormatter(this.locale, options).format(newValue));
    }

    // accounting will always be stripped to a positive number, so if it's accounting and has a () around everything, then we need to make it negative again
    if (this.options.currencySign === 'accounting' && CURRENCY_SIGN_REGEX.test(value)) {
      newValue = -1 * newValue;
    }

    return newValue;
  }

  sanitize(value: string) {
    let sanitizedValue = value.trim();

    let numeralMatches = sanitizedValue.match(NUMERALS_REGEX);

    if (numeralMatches) {
      let lastNumeralMatch = numeralMatches[numeralMatches.length - 1];
      let indexOfLastNumeral = sanitizedValue.lastIndexOf(lastNumeralMatch);
      let afterAbs = sanitizedValue.slice(indexOfLastNumeral + 1);
      let abs = sanitizedValue.slice(0, indexOfLastNumeral + 1);
      // remove any non-ambiguous grouping symbols.
      abs = abs.replace(NON_AMBIGUOUS_GROUPING_SYMBOLS_REGEX, '');
      numeralMatches = abs.match(NUMERALS_REGEX);
      let firstNumeralMatch = numeralMatches?.[0] ?? '';
      let indexOfFirstNumeral = abs.indexOf(firstNumeralMatch);
      indexOfLastNumeral = abs.length - 1;

      let decimalPartMatches = abs.match(DECIMAL_PART_REGEX);
      let groupSymbolMatch:Array<string> | undefined = abs.match(GROUPING_SYMBOLS_REGEX)?.filter((s: string) => abs.indexOf(s) >= indexOfFirstNumeral - 1);
      if (decimalPartMatches?.groups?.symbol && groupSymbolMatch?.[groupSymbolMatch.length - 1] === decimalPartMatches.groups?.symbol) {
        if (groupSymbolMatch.length === 1) {
          groupSymbolMatch = undefined;
        } else {
          abs = replaceAll(abs, groupSymbolMatch[0], '');
        }
        decimalPartMatches = abs.match(DECIMAL_PART_REGEX);
      }

      let decimalPart: string | undefined = decimalPartMatches?.[0];
      let integerPart: string | undefined = decimalPart && decimalPart !== '' ? abs.slice(0, abs.lastIndexOf(decimalPart)) : abs;
      let beforeAbs: string = '';
      if (decimalPart && indexOfFirstNumeral > integerPart.length - 1) {
        beforeAbs = integerPart;
        integerPart = '';
      } else {
        beforeAbs = integerPart.slice(0, indexOfFirstNumeral);
        integerPart = integerPart.slice(indexOfFirstNumeral, integerPart.length);
      }

      integerPart = integerPart.replace(GROUPING_SYMBOLS_REGEX, '');

      if (
        decimalPartMatches?.groups?.digits &&
        decimalPartMatches?.groups?.symbol !== (this.symbols.decimal ?? '.') &&
        (
          decimalPartMatches?.groups?.digits?.length < 3 ||
          decimalPartMatches?.groups?.digits?.length > 3 ||
          integerPart.length > 3 ||
          (integerPart.length === 0 && decimalPartMatches?.groups?.digits?.length === 3) ||
          (integerPart === '0' || integerPart === '\u0660' || integerPart === '\u3007')
        )
      ) {
        decimalPart = decimalPart?.replace(decimalPartMatches?.groups?.symbol, this.symbols.decimal ?? '.') ?? '';
      }

      integerPart.replace(LEADING_ZERO_REGEX, '');

      abs = `${integerPart}${decimalPart}`;

      // With accounting, the number is negative if it's wrapped in parentheses,
      // so we want to keep the parentheses and remove everything else after the last numeral.
      sanitizedValue = `${
        beforeAbs
      }${
        abs
      }${
        CURRENCY_SIGN_REGEX.test(value) ? afterAbs.replace(/[^)]/g, '') : afterAbs
      }`;
    }

    // Remove literals and whitespace, which are allowed anywhere in the string
    sanitizedValue = sanitizedValue.replace(this.symbols.literals, '');

    // Replace the ASCII minus sign with the minus sign used in the current locale
    // so that both are allowed in case the user's keyboard doesn't have the locale's minus sign.
    if (this.symbols.minusSign) {
      sanitizedValue = sanitizedValue.replace(MINUS_SIGN_REGEX, this.symbols.minusSign);
    }

    // In arab numeral system, their decimal character is 1643, but most keyboards don't type that
    // instead they use the , (44) character or apparently the (1548) character.
    if (this.options.numberingSystem === 'arab') {
      if (this.symbols.decimal) {
        sanitizedValue = sanitizedValue.replace(',', this.symbols.decimal);
        sanitizedValue = sanitizedValue.replace(String.fromCharCode(1548), this.symbols.decimal);
      }
      if (this.symbols.group) {
        sanitizedValue = replaceAll(sanitizedValue, '.', this.symbols.group);
      }
    }

    // fr-FR group character is char code 8239, but that's not a key on the french keyboard,
    // so allow 'period' as a group char and replace it with a space
    if (this.options.locale === 'fr-FR') {
      sanitizedValue = replaceAll(sanitizedValue, '.', String.fromCharCode(8239));
    }

    return sanitizedValue;
  }

  isValidPartialNumber(value: string, minValue: number = -Infinity, maxValue: number = Infinity): boolean {
    value = this.sanitize(value);

    // Remove minus or plus sign, which must be at the start of the string.
    if (this.symbols.minusSign && value.startsWith(this.symbols.minusSign) && minValue < 0) {
      value = value.slice(this.symbols.minusSign.length);
    } else if (this.symbols.plusSign && value.startsWith(this.symbols.plusSign) && maxValue > 0) {
      value = value.slice(this.symbols.plusSign.length);
    }

    // Numbers cannot start with a group separator
    if (this.symbols.group && value.startsWith(this.symbols.group)) {
      return false;
    }

    // Numbers that can't have any decimal values fail if a decimal character is typed
    if (this.symbols.decimal && value.indexOf(this.symbols.decimal) > -1 && this.options.maximumFractionDigits === 0) {
      return false;
    }

    // Remove numerals, groups, and decimals
    if (this.symbols.group) {
      value = replaceAll(value, this.symbols.group, '');
    }
    value = value.replace(this.symbols.numeral, '');
    if (this.symbols.decimal) {
      value = value.replace(this.symbols.decimal, '');
    }

    // The number is valid if there are no remaining characters
    return value.length === 0;
  }
}

const nonLiteralParts = new Set(['decimal', 'fraction', 'integer', 'minusSign', 'plusSign', 'group']);

// This list is derived from https://www.unicode.org/cldr/charts/43/supplemental/language_plural_rules.html#comparison and includes
// all unique numbers which we need to check in order to determine all the plural forms for a given locale.
// See: https://github.com/adobe/react-spectrum/pull/5134/files#r1337037855 for used script
const pluralNumbers = [
  0, 4, 2, 1, 11, 20, 3, 7, 100, 21, 0.1, 1.1
];

function getSymbols(locale: string, formatter: Intl.NumberFormat, intlOptions: Intl.ResolvedNumberFormatOptions, originalOptions: Intl.NumberFormatOptions): Symbols {
  // formatter needs access to all decimal places in order to generate the correct literal strings for the plural set
  let symbolFormatter = new Intl.NumberFormat(locale, {...intlOptions,
    // Resets so we get the full range of symbols
    minimumSignificantDigits: 1,
    maximumSignificantDigits: 21,
    roundingIncrement: 1,
    roundingPriority: 'auto',
    roundingMode: 'halfExpand'
  });
  // Note: some locale's don't add a group symbol until there is a ten thousands place
  let allParts = symbolFormatter.formatToParts(-10000.111);
  let posAllParts = symbolFormatter.formatToParts(10000.111);
  let pluralParts = pluralNumbers.map(n => symbolFormatter.formatToParts(n));

  let minusSign = allParts.find(p => p.type === 'minusSign')?.value ?? '-';
  let plusSign = posAllParts.find(p => p.type === 'plusSign')?.value;

  // Safari does not support the signDisplay option, but our number parser polyfills it.
  // If no plus sign was returned, but the original options contained signDisplay, default to the '+' character.
  if (!plusSign && (originalOptions?.signDisplay === 'exceptZero' || originalOptions?.signDisplay === 'always')) {
    plusSign = '+';
  }

  // If maximumSignificantDigits is 1 (the minimum) then we won't get decimal characters out of the above formatters
  // Percent also defaults to 0 fractionDigits, so we need to make a new one that isn't percent to get an accurate decimal
  let decimalParts = new Intl.NumberFormat(locale, {...intlOptions, minimumFractionDigits: 2, maximumFractionDigits: 2}).formatToParts(0.001);

  let decimal = decimalParts.find(p => p.type === 'decimal')?.value;
  let group = allParts.find(p => p.type === 'group')?.value;

  // this set is also for a regex, it's all literals that might be in the string we want to eventually parse that
  // don't contribute to the numerical value
  let allPartsLiterals = allParts.filter(p => !nonLiteralParts.has(p.type)).map(p => escapeRegex(p.value));
  let pluralPartsLiterals = pluralParts.flatMap(p => p.filter(p => !nonLiteralParts.has(p.type)).map(p => escapeRegex(p.value)));
  let sortedLiterals = [...new Set([...allPartsLiterals, ...pluralPartsLiterals])].sort((a, b) => b.length - a.length);

  let literals = sortedLiterals.length === 0 ?
      new RegExp('[\\p{White_Space}]', 'gu') :
      new RegExp(`${sortedLiterals.join('|')}|[\\p{White_Space}]`, 'gu');

  // These are for replacing non-latn characters with the latn equivalent
  let numerals = [...new Intl.NumberFormat(intlOptions.locale, {useGrouping: false}).format(9876543210)].reverse();
  let indexes = new Map(numerals.map((d, i) => [d, i]));
  let numeral = new RegExp(`[${numerals.join('')}]`, 'g');
  let index = d => String(indexes.get(d));

  return {minusSign, plusSign, decimal, group, literals, numeral, index};
}

function replaceAll(str: string, find: string, replace: string) {
  if (str.replaceAll) {
    return str.replaceAll(find, replace);
  }

  return str.split(find).join(replace);
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
