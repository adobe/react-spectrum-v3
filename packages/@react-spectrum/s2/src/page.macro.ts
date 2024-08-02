/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {MacroContext} from '@parcel/macros';
import tokens from '@adobe/spectrum-tokens/dist/json/variables.json';

function colorToken(token: typeof tokens['gray-25']) {
  return `light-dark(${token.sets.light.value}, ${token.sets.dark.value})`;
}

function weirdColorToken(token: typeof tokens['background-layer-2-color']) {
  return `light-dark(${token.sets.light.sets.light.value}, ${token.sets.dark.sets.dark.value})`;
}

export function generatePageStyles(this: MacroContext | void) {
  if (this && typeof this.addAsset === 'function') {
    this.addAsset({
      type: 'css',
      content: `html {
        color-scheme: light dark;
        background: ${colorToken(tokens['background-base-color'])};

        &[data-color-scheme=light] {
          color-scheme: light;
        }

        &[data-color-scheme=dark] {
          color-scheme: dark;
        }

        &[data-background=layer-1] {
          background: ${colorToken(tokens['background-layer-1-color'])};
        }

        &[data-background=layer-2] {
          background: ${weirdColorToken(tokens['background-layer-2-color'])};
        }
      }`
    });
  }
}
