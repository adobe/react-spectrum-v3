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

import {FormatXMLElementFn, PrimitiveType} from 'intl-messageformat/src/formatters';
import IntlMessageFormat from 'intl-messageformat';
import {MessageDictionary} from './MessageDictionary';

/**
 * Formats ICU Message strings to create localized strings from a MessageDictionary.
 */
export class MessageFormatter {
  private locale: string;
  private messages: MessageDictionary;
  private cache: {[key: string]: IntlMessageFormat};

  constructor(locale: string, messages: MessageDictionary) {
    this.locale = locale;
    this.messages = messages;
    this.cache = {};
  }

  format<T = void>(key: string, variables: Record<string, PrimitiveType | T | FormatXMLElementFn<T, string | T | (string | T)[]>> | undefined): string | T | (string | T)[] {
    let message = this.cache[key];
    if (!message) {
      let msg = this.messages.getStringForLocale(key, this.locale);
      if (!msg) {
        throw new Error(`Could not find intl message ${key} in ${this.locale} locale`);
      }

      message = new IntlMessageFormat(msg, this.locale);
      this.cache[key] = message;
    }
    let varCopy: Record<string, PrimitiveType | T | FormatXMLElementFn<T, string | T | (string | T)[]>> | undefined;
    if (variables) {
      varCopy = Object.keys(variables).reduce((acc, key) => {
        acc[key] = variables[key] == null ? false : variables[key];
        return acc;
      }, {});
    }

    return message.format(varCopy);
  }
}
