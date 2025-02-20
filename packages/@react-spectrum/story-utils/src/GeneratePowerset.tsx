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

import {mergeProps} from '@react-aria/utils';

// Generate a powerset from a given array of states/options,
export function generatePowerset(states: Array<object>, exclude?: (merged) => boolean): any[] {
  let combinations: any[] = [{}];
  for (let i = 0; i < states.length; i++) {
    let len = combinations.length;
    for (let j = 0; j < len; j++) {
      let [key, value] = Object.entries(states[i])[0];

      // If one of the states/options has multiple values, create a combination for each
      if (Array.isArray(value)) {
        value.forEach(state => {
          let merged = mergeProps(combinations[j], {[key]: state});
          if (!(exclude && exclude(merged))) {
            combinations.push(merged);
          }
        });
      } else {
        let merged = mergeProps(combinations[j], states[i]);
        let s = JSON.stringify(merged);
        if (combinations.some(c => JSON.stringify(c) === s)) {
          continue;
        }

        if (!(exclude && exclude(merged))) {
          combinations.push(merged);
        }
      }
    }
  }

  return combinations;
}
