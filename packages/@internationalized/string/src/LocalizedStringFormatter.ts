/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import type {LocalizedStringDictionary} from './LocalizedStringDictionary';

export type Variables = Record<string, string | number | boolean> | undefined;
export type LocalizedString = string | ((args: Variables, formatter?: LocalizedStringFormatter<any, any>) => string);
type InternalString = string | (() => string);

const pluralRulesCache = new Map<string, Intl.PluralRules>();
const numberFormatCache = new Map<string, Intl.NumberFormat>();

/**
 * Formats localized strings from a LocalizedStringDictionary. Supports interpolating variables,
 * selecting the correct pluralization, and formatting numbers for the locale.
 */
export class LocalizedStringFormatter<K extends string = string, T extends LocalizedString = string> {
  private locale: string;
  private strings: LocalizedStringDictionary<K, T>;

  constructor(locale: string, strings: LocalizedStringDictionary<K, T>) {
    this.locale = locale;
    this.strings = strings;
  }

  /** Formats a localized string for the given key with the provided variables. */
  format(key: K, variables?: Variables): string {
    let message = this.strings.getStringForLocale(key, this.locale);
    return typeof message === 'function' ? message(variables, this) : message;
  }

  protected plural(count: number, options: Record<string, InternalString>, type: Intl.PluralRuleType = 'cardinal'): string {
    let opt = options['=' + count];
    if (opt) {
      return typeof opt === 'function' ? opt() : opt;
    }

    let key = this.locale + ':' + type;
    let pluralRules = pluralRulesCache.get(key);
    if (!pluralRules) {
      pluralRules = new Intl.PluralRules(this.locale, {type});
      pluralRulesCache.set(key, pluralRules);
    }

    let selected = pluralRules.select(count);
    opt = options[selected] || options.other;
    return typeof opt === 'function' ? opt() : opt;
  }

  protected number(value: number): string {
    let numberFormat = numberFormatCache.get(this.locale);
    if (!numberFormat) {
      numberFormat = new Intl.NumberFormat(this.locale);
      numberFormatCache.set(this.locale, numberFormat);
    }
    return numberFormat.format(value);
  }

  protected select(options: Record<string, InternalString>, value: string): string {
    let opt = options[value] || options.other;
    return typeof opt === 'function' ? opt() : opt;
  }
}
