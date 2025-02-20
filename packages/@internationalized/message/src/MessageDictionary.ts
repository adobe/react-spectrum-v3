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

export type LocalizedStrings = {
  [lang: string]: {
    [key: string]: string
  }
};

/**
 * Stores a mapping of localized strings. Can be used to find the
 * closest available string for a given locale.
 */
export class MessageDictionary {
  private messages: LocalizedStrings;
  private defaultLocale: string;

  constructor(messages: LocalizedStrings, defaultLocale: string = 'en-US') {
    // Clone messages so we don't modify the original object.
    // Filter out entries with falsy values which may have been caused by applying optimize-locales-plugin.
    this.messages = Object.fromEntries(
      Object.entries(messages).filter(([, v]) => v)
    );
    this.defaultLocale = defaultLocale;
  }

  getStringForLocale(key: string, locale: string): string {
    let strings = this.messages[locale];
    if (!strings) {
      strings = getStringsForLocale(locale, this.messages, this.defaultLocale);
      this.messages[locale] = strings;
    }

    let string = strings[key];
    if (!string) {
      throw new Error(`Could not find intl message ${key} in ${locale} locale`);
    }

    return string;
  }
}

function getStringsForLocale(locale: string, strings: LocalizedStrings, defaultLocale = 'en-US') {
  // If there is an exact match, use it.
  if (strings[locale]) {
    return strings[locale];
  }

  // Attempt to find the closest match by language.
  // For example, if the locale is fr-CA (French Canadian), but there is only
  // an fr-FR (France) set of strings, use that.
  // This could be replaced with Intl.LocaleMatcher once it is supported.
  // https://github.com/tc39/proposal-intl-localematcher
  let language = getLanguage(locale);
  if (strings[language]) {
    return strings[language];
  }

  for (let key in strings) {
    if (key.startsWith(language + '-')) {
      return strings[key];
    }
  }

  // Nothing close, use english.
  return strings[defaultLocale];
}

function getLanguage(locale: string) {
  if (Intl.Locale) {
    return new Intl.Locale(locale).language;
  }

  return locale.split('-')[0];
}
