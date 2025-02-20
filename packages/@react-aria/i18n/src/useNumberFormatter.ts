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

import {NumberFormatOptions, NumberFormatter} from '@internationalized/number';
import {useLocale} from './context';
import {useMemo} from 'react';

export type NumberFormatFunction = (value: number, locale: string) => string;

export type CustomNumberFormat = {format(value: number): string};

/**
 * Provides localized number formatting for the current locale. Automatically updates when the locale changes,
 * and handles caching of the number formatter for performance.
 * @param format - Formatting options or function.
 */
export function useNumberFormatter(format?: NumberFormatOptions): Intl.NumberFormat
export function useNumberFormatter(format?: NumberFormatOptions | NumberFormatFunction): CustomNumberFormat
export function useNumberFormatter(format: NumberFormatOptions | NumberFormatFunction = {}): CustomNumberFormat {
  let {locale} = useLocale();
  return useMemo(
    () =>
      typeof format === 'function'
        ? {format: (value) => format(value, locale)}
        : new NumberFormatter(locale, format),
    [locale, format]
  );
}
