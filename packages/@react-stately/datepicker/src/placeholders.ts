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

import {LocalizedStringDictionary} from '@internationalized/string';

// These placeholders are based on the strings used by the <input type="date">
// implementations in Chrome and Firefox. Additional languages are supported
// here than React Spectrum's typical translations.
const placeholders = new LocalizedStringDictionary({
  ach: {year: 'mwaka', month: 'dwe', day: 'nino'},
  af: {year: 'jjjj', month: 'mm', day: 'dd'},
  am: {year: 'ዓዓዓዓ', month: 'ሚሜ', day: 'ቀቀ'},
  an: {year: 'aaaa', month: 'mm', day: 'dd'},
  ar: {year: 'سنة', month: 'شهر', day: 'يوم'},
  ast: {year: 'aaaa', month: 'mm', day: 'dd'},
  az: {year: 'iiii', month: 'aa', day: 'gg'},
  be: {year: 'гггг', month: 'мм', day: 'дд'},
  bg: {year: 'гггг', month: 'мм', day: 'дд'},
  bn: {year: 'yyyy', month: 'মিমি', day: 'dd'},
  br: {year: 'bbbb', month: 'mm', day: 'dd'},
  bs: {year: 'gggg', month: 'mm', day: 'dd'},
  ca: {year: 'aaaa', month: 'mm', day: 'dd'},
  cak: {year: 'jjjj', month: 'ii', day: "q'q'"},
  ckb: {year: 'ساڵ', month: 'مانگ', day: 'ڕۆژ'},
  cs: {year: 'rrrr', month: 'mm', day: 'dd'},
  cy: {year: 'bbbb', month: 'mm', day: 'dd'},
  da: {year: 'åååå', month: 'mm', day: 'dd'},
  de: {year: 'jjjj', month: 'mm', day: 'tt'},
  dsb: {year: 'llll', month: 'mm', day: 'źź'},
  el: {year: 'εεεε', month: 'μμ', day: 'ηη'},
  en: {year: 'yyyy', month: 'mm', day: 'dd'},
  eo: {year: 'jjjj', month: 'mm', day: 'tt'},
  es: {year: 'aaaa', month: 'mm', day: 'dd'},
  et: {year: 'aaaa', month: 'kk', day: 'pp'},
  eu: {year: 'uuuu', month: 'hh', day: 'ee'},
  fa: {year: 'سال', month: 'ماه', day: 'روز'},
  ff: {year: 'hhhh', month: 'll', day: 'ññ'},
  fi: {year: 'vvvv', month: 'kk', day: 'pp'},
  fr: {year: 'aaaa', month: 'mm', day: 'jj'},
  fy: {year: 'jjjj', month: 'mm', day: 'dd'},
  ga: {year: 'bbbb', month: 'mm', day: 'll'},
  gd: {year: 'bbbb', month: 'mm', day: 'll'},
  gl: {year: 'aaaa', month: 'mm', day: 'dd'},
  he: {year: 'שנה', month: 'חודש', day: 'יום'},
  hr: {year: 'gggg', month: 'mm', day: 'dd'},
  hsb: {year: 'llll', month: 'mm', day: 'dd'},
  hu: {year: 'éééé', month: 'hh', day: 'nn'},
  ia: {year: 'aaaa', month: 'mm', day: 'dd'},
  id: {year: 'tttt', month: 'bb', day: 'hh'},
  it: {year: 'aaaa', month: 'mm', day: 'gg'},
  ja: {year: '年', month: '月', day: '日'},
  ka: {year: 'წწწწ', month: 'თთ', day: 'რრ'},
  kk: {year: 'жжжж', month: 'аа', day: 'кк'},
  kn: {year: 'ವವವವ', month: 'ಮಿಮೀ', day: 'ದಿದಿ'},
  ko: {year: '연도', month: '월', day: '일'},
  lb: {year: 'jjjj', month: 'mm', day: 'dd'},
  lo: {year: 'ປປປປ', month: 'ດດ', day: 'ວວ'},
  lt: {year: 'mmmm', month: 'mm', day: 'dd'},
  lv: {year: 'gggg', month: 'mm', day: 'dd'},
  meh: {year: 'aaaa', month: 'mm', day: 'dd'},
  ml: {year: 'വർഷം', month: 'മാസം', day: 'തീയതി'},
  ms: {year: 'tttt', month: 'mm', day: 'hh'},
  nl: {year: 'jjjj', month: 'mm', day: 'dd'},
  nn: {year: 'åååå', month: 'mm', day: 'dd'},
  no: {year: 'åååå', month: 'mm', day: 'dd'},
  oc: {year: 'aaaa', month: 'mm', day: 'jj'},
  pl: {year: 'rrrr', month: 'mm', day: 'dd'},
  pt: {year: 'aaaa', month: 'mm', day: 'dd'},
  rm: {year: 'oooo', month: 'mm', day: 'dd'},
  ro: {year: 'aaaa', month: 'll', day: 'zz'},
  ru: {year: 'гггг', month: 'мм', day: 'дд'},
  sc: {year: 'aaaa', month: 'mm', day: 'dd'},
  scn: {year: 'aaaa', month: 'mm', day: 'jj'},
  sk: {year: 'rrrr', month: 'mm', day: 'dd'},
  sl: {year: 'llll', month: 'mm', day: 'dd'},
  sr: {year: 'гггг', month: 'мм', day: 'дд'},
  sv: {year: 'åååå', month: 'mm', day: 'dd'},
  szl: {year: 'rrrr', month: 'mm', day: 'dd'},
  tg: {year: 'сссс', month: 'мм', day: 'рр'},
  th: {year: 'ปปปป', month: 'ดด', day: 'วว'},
  tr: {year: 'yyyy', month: 'aa', day: 'gg'},
  uk: {year: 'рррр', month: 'мм', day: 'дд'},
  'zh-CN': {year: '年', month: '月', day: '日'},
  'zh-TW': {year: '年', month: '月', day: '日'}
}, 'en');

export function getPlaceholder(field: string, value: string, locale: string) {
  // Use the actual placeholder value for the era and day period fields.
  if (field === 'era' || field === 'dayPeriod') {
    return value;
  }

  if (field === 'year' || field === 'month' || field === 'day') {
    return placeholders.getStringForLocale(field, locale);
  }

  // For time fields (e.g. hour, minute, etc.), use two dashes as the placeholder.
  return '––';
}
