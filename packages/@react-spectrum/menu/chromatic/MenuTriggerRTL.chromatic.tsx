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

import {Meta} from '@storybook/react';
import React from 'react';

// Open MenuTriggers behave funny if rendered off screen, especially with the offset stories
const meta: Meta = {
  title: 'MenuTriggerRTL',
  parameters: {
    chromaticProvider: {colorSchemes: ['light'], locales: ['ar-AE'], scales: ['medium'], disableAnimations: true},
    // chromatic needs a bit more time than disableAnimations allows
    chromatic: {pauseAnimationAtEnd: true}
  },
  decorators: [Story => <div style={{display: 'flex', width: 'auto', margin: '250px 0'}}><Story /></div>]
};

export default meta;

export {
  Default,
  WithSections,
  Complex,
  AlignEnd,
  DirectionTop,
  DirectionBottom,
  DirectionStart,
  DirectionStartEnd,
  DirectionEnd,
  DirectionLeft,
  DirectionLeftEnd,
  DirectionRight,
  DirectionRightEnd,
  ArabicComplex
} from './MenuTrigger.chromatic';
