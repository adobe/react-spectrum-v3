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

import _clsx from 'clsx';

export let shouldKeepSpectrumClassNames = false;

export function keepSpectrumClassNames(): void {
  shouldKeepSpectrumClassNames = true;
  console.warn(
    'Legacy spectrum-prefixed class names enabled for backward compatibility. ' +
    'We recommend replacing instances of CSS overrides targeting spectrum selectors ' +
    'in your app with custom class names of your own, and disabling this flag.'
  );
}

export function classNames(cssModule: {[key: string]: string}, ...values: Array<string | Object | undefined>): string {
  let classes: Array<{} | undefined> = [];
  for (let value of values) {
    if (typeof value === 'object' && value) {
      let mapped = {};
      for (let key in value) {
        if (cssModule[key]) {
          mapped[cssModule[key]] = value[key];
        }

        if (shouldKeepSpectrumClassNames || !cssModule[key]) {
          mapped[key] = value[key];
        }
      }

      classes.push(mapped);
    } else if (typeof value === 'string') {
      if (cssModule[value]) {
        classes.push(cssModule[value]);
      }

      if (shouldKeepSpectrumClassNames || !cssModule[value]) {
        classes.push(value);
      }
    } else {
      classes.push(value);
    }
  }

  return _clsx(...classes);
}
