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
import {createArbitraryProperty, createColorProperty, createMappedProperty, createTheme} from './style-macro';
import type * as CSS from 'csstype';

const color = {
  transparent: 'transparent',
  black: 'black',
  white: 'white',

  'gray-50': 'var(--spectrum-gray-50)',
  'gray-75': 'var(--spectrum-gray-75)',
  'gray-100': 'var(--spectrum-gray-100)',
  'gray-200': 'var(--spectrum-gray-200)',
  'gray-300': 'var(--spectrum-gray-300)',
  'gray-400': 'var(--spectrum-gray-400)',
  'gray-500': 'var(--spectrum-gray-500)',
  'gray-600': 'var(--spectrum-gray-600)',
  'gray-700': 'var(--spectrum-gray-700)',
  'gray-800': 'var(--spectrum-gray-800)',
  'gray-900': 'var(--spectrum-gray-900)',

  'blue-100': 'var(--spectrum-blue-100)',
  'blue-200': 'var(--spectrum-blue-200)',
  'blue-300': 'var(--spectrum-blue-300)',
  'blue-400': 'var(--spectrum-blue-400)',
  'blue-500': 'var(--spectrum-blue-500)',
  'blue-600': 'var(--spectrum-blue-600)',
  'blue-700': 'var(--spectrum-blue-700)',
  'blue-800': 'var(--spectrum-blue-800)',
  'blue-900': 'var(--spectrum-blue-900)',
  'blue-1000': 'var(--spectrum-blue-1000)',
  'blue-1100': 'var(--spectrum-blue-1100)',
  'blue-1200': 'var(--spectrum-blue-1200)',
  'blue-1300': 'var(--spectrum-blue-1300)',
  'blue-1400': 'var(--spectrum-blue-1400)',

  'green-100': 'var(--spectrum-green-100)',
  'green-200': 'var(--spectrum-green-200)',
  'green-300': 'var(--spectrum-green-300)',
  'green-400': 'var(--spectrum-green-400)',
  'green-500': 'var(--spectrum-green-500)',
  'green-600': 'var(--spectrum-green-600)',
  'green-700': 'var(--spectrum-green-700)',
  'green-800': 'var(--spectrum-green-800)',
  'green-900': 'var(--spectrum-green-900)',
  'green-1000': 'var(--spectrum-green-1000)',
  'green-1100': 'var(--spectrum-green-1100)',
  'green-1200': 'var(--spectrum-green-1200)',
  'green-1300': 'var(--spectrum-green-1300)',
  'green-1400': 'var(--spectrum-green-1400)',

  'orange-100': 'var(--spectrum-orange-100)',
  'orange-200': 'var(--spectrum-orange-200)',
  'orange-300': 'var(--spectrum-orange-300)',
  'orange-400': 'var(--spectrum-orange-400)',
  'orange-500': 'var(--spectrum-orange-500)',
  'orange-600': 'var(--spectrum-orange-600)',
  'orange-700': 'var(--spectrum-orange-700)',
  'orange-800': 'var(--spectrum-orange-800)',
  'orange-900': 'var(--spectrum-orange-900)',
  'orange-1000': 'var(--spectrum-orange-1000)',
  'orange-1100': 'var(--spectrum-orange-1100)',
  'orange-1200': 'var(--spectrum-orange-1200)',
  'orange-1300': 'var(--spectrum-orange-1300)',
  'orange-1400': 'var(--spectrum-orange-1400)',

  'red-100': 'var(--spectrum-red-100)',
  'red-200': 'var(--spectrum-red-200)',
  'red-300': 'var(--spectrum-red-300)',
  'red-400': 'var(--spectrum-red-400)',
  'red-500': 'var(--spectrum-red-500)',
  'red-600': 'var(--spectrum-red-600)',
  'red-700': 'var(--spectrum-red-700)',
  'red-800': 'var(--spectrum-red-800)',
  'red-900': 'var(--spectrum-red-900)',
  'red-1000': 'var(--spectrum-red-1000)',
  'red-1100': 'var(--spectrum-red-1100)',
  'red-1200': 'var(--spectrum-red-1200)',
  'red-1300': 'var(--spectrum-red-1300)',
  'red-1400': 'var(--spectrum-red-1400)',

  'celery-100': 'var(--spectrum-celery-100)',
  'celery-200': 'var(--spectrum-celery-200)',
  'celery-300': 'var(--spectrum-celery-300)',
  'celery-400': 'var(--spectrum-celery-400)',
  'celery-500': 'var(--spectrum-celery-500)',
  'celery-600': 'var(--spectrum-celery-600)',
  'celery-700': 'var(--spectrum-celery-700)',
  'celery-800': 'var(--spectrum-celery-800)',
  'celery-900': 'var(--spectrum-celery-900)',
  'celery-1000': 'var(--spectrum-celery-1000)',
  'celery-1100': 'var(--spectrum-celery-1100)',
  'celery-1200': 'var(--spectrum-celery-1200)',
  'celery-1300': 'var(--spectrum-celery-1300)',
  'celery-1400': 'var(--spectrum-celery-1400)',

  'chartreuse-100': 'var(--spectrum-chartreuse-100)',
  'chartreuse-200': 'var(--spectrum-chartreuse-200)',
  'chartreuse-300': 'var(--spectrum-chartreuse-300)',
  'chartreuse-400': 'var(--spectrum-chartreuse-400)',
  'chartreuse-500': 'var(--spectrum-chartreuse-500)',
  'chartreuse-600': 'var(--spectrum-chartreuse-600)',
  'chartreuse-700': 'var(--spectrum-chartreuse-700)',
  'chartreuse-800': 'var(--spectrum-chartreuse-800)',
  'chartreuse-900': 'var(--spectrum-chartreuse-900)',
  'chartreuse-1000': 'var(--spectrum-chartreuse-1000)',
  'chartreuse-1100': 'var(--spectrum-chartreuse-1100)',
  'chartreuse-1200': 'var(--spectrum-chartreuse-1200)',
  'chartreuse-1300': 'var(--spectrum-chartreuse-1300)',
  'chartreuse-1400': 'var(--spectrum-chartreuse-1400)',

  'cyan-100': 'var(--spectrum-cyan-100)',
  'cyan-200': 'var(--spectrum-cyan-200)',
  'cyan-300': 'var(--spectrum-cyan-300)',
  'cyan-400': 'var(--spectrum-cyan-400)',
  'cyan-500': 'var(--spectrum-cyan-500)',
  'cyan-600': 'var(--spectrum-cyan-600)',
  'cyan-700': 'var(--spectrum-cyan-700)',
  'cyan-800': 'var(--spectrum-cyan-800)',
  'cyan-900': 'var(--spectrum-cyan-900)',
  'cyan-1000': 'var(--spectrum-cyan-1000)',
  'cyan-1100': 'var(--spectrum-cyan-1100)',
  'cyan-1200': 'var(--spectrum-cyan-1200)',
  'cyan-1300': 'var(--spectrum-cyan-1300)',
  'cyan-1400': 'var(--spectrum-cyan-1400)',

  'fuchsia-100': 'var(--spectrum-fuchsia-100)',
  'fuchsia-200': 'var(--spectrum-fuchsia-200)',
  'fuchsia-300': 'var(--spectrum-fuchsia-300)',
  'fuchsia-400': 'var(--spectrum-fuchsia-400)',
  'fuchsia-500': 'var(--spectrum-fuchsia-500)',
  'fuchsia-600': 'var(--spectrum-fuchsia-600)',
  'fuchsia-700': 'var(--spectrum-fuchsia-700)',
  'fuchsia-800': 'var(--spectrum-fuchsia-800)',
  'fuchsia-900': 'var(--spectrum-fuchsia-900)',
  'fuchsia-1000': 'var(--spectrum-fuchsia-1000)',
  'fuchsia-1100': 'var(--spectrum-fuchsia-1100)',
  'fuchsia-1200': 'var(--spectrum-fuchsia-1200)',
  'fuchsia-1300': 'var(--spectrum-fuchsia-1300)',
  'fuchsia-1400': 'var(--spectrum-fuchsia-1400)',

  'indigo-100': 'var(--spectrum-indigo-100)',
  'indigo-200': 'var(--spectrum-indigo-200)',
  'indigo-300': 'var(--spectrum-indigo-300)',
  'indigo-400': 'var(--spectrum-indigo-400)',
  'indigo-500': 'var(--spectrum-indigo-500)',
  'indigo-600': 'var(--spectrum-indigo-600)',
  'indigo-700': 'var(--spectrum-indigo-700)',
  'indigo-800': 'var(--spectrum-indigo-800)',
  'indigo-900': 'var(--spectrum-indigo-900)',
  'indigo-1000': 'var(--spectrum-indigo-1000)',
  'indigo-1100': 'var(--spectrum-indigo-1100)',
  'indigo-1200': 'var(--spectrum-indigo-1200)',
  'indigo-1300': 'var(--spectrum-indigo-1300)',
  'indigo-1400': 'var(--spectrum-indigo-1400)',

  'magenta-100': 'var(--spectrum-magenta-100)',
  'magenta-200': 'var(--spectrum-magenta-200)',
  'magenta-300': 'var(--spectrum-magenta-300)',
  'magenta-400': 'var(--spectrum-magenta-400)',
  'magenta-500': 'var(--spectrum-magenta-500)',
  'magenta-600': 'var(--spectrum-magenta-600)',
  'magenta-700': 'var(--spectrum-magenta-700)',
  'magenta-800': 'var(--spectrum-magenta-800)',
  'magenta-900': 'var(--spectrum-magenta-900)',
  'magenta-1000': 'var(--spectrum-magenta-1000)',
  'magenta-1100': 'var(--spectrum-magenta-1100)',
  'magenta-1200': 'var(--spectrum-magenta-1200)',
  'magenta-1300': 'var(--spectrum-magenta-1300)',
  'magenta-1400': 'var(--spectrum-magenta-1400)',

  'purple-100': 'var(--spectrum-purple-100)',
  'purple-200': 'var(--spectrum-purple-200)',
  'purple-300': 'var(--spectrum-purple-300)',
  'purple-400': 'var(--spectrum-purple-400)',
  'purple-500': 'var(--spectrum-purple-500)',
  'purple-600': 'var(--spectrum-purple-600)',
  'purple-700': 'var(--spectrum-purple-700)',
  'purple-800': 'var(--spectrum-purple-800)',
  'purple-900': 'var(--spectrum-purple-900)',
  'purple-1000': 'var(--spectrum-purple-1000)',
  'purple-1100': 'var(--spectrum-purple-1100)',
  'purple-1200': 'var(--spectrum-purple-1200)',
  'purple-1300': 'var(--spectrum-purple-1300)',
  'purple-1400': 'var(--spectrum-purple-1400)',

  'seafoam-100': 'var(--spectrum-seafoam-100)',
  'seafoam-200': 'var(--spectrum-seafoam-200)',
  'seafoam-300': 'var(--spectrum-seafoam-300)',
  'seafoam-400': 'var(--spectrum-seafoam-400)',
  'seafoam-500': 'var(--spectrum-seafoam-500)',
  'seafoam-600': 'var(--spectrum-seafoam-600)',
  'seafoam-700': 'var(--spectrum-seafoam-700)',
  'seafoam-800': 'var(--spectrum-seafoam-800)',
  'seafoam-900': 'var(--spectrum-seafoam-900)',
  'seafoam-1000': 'var(--spectrum-seafoam-1000)',
  'seafoam-1100': 'var(--spectrum-seafoam-1100)',
  'seafoam-1200': 'var(--spectrum-seafoam-1200)',
  'seafoam-1300': 'var(--spectrum-seafoam-1300)',
  'seafoam-1400': 'var(--spectrum-seafoam-1400)',

  'yellow-100': 'var(--spectrum-yellow-100)',
  'yellow-200': 'var(--spectrum-yellow-200)',
  'yellow-300': 'var(--spectrum-yellow-300)',
  'yellow-400': 'var(--spectrum-yellow-400)',
  'yellow-500': 'var(--spectrum-yellow-500)',
  'yellow-600': 'var(--spectrum-yellow-600)',
  'yellow-700': 'var(--spectrum-yellow-700)',
  'yellow-800': 'var(--spectrum-yellow-800)',
  'yellow-900': 'var(--spectrum-yellow-900)',
  'yellow-1000': 'var(--spectrum-yellow-1000)',
  'yellow-1100': 'var(--spectrum-yellow-1100)',
  'yellow-1200': 'var(--spectrum-yellow-1200)',
  'yellow-1300': 'var(--spectrum-yellow-1300)',
  'yellow-1400': 'var(--spectrum-yellow-1400)',

  'accent-100': 'var(--spectrum-accent-color-100)',
  'accent-200': 'var(--spectrum-accent-color-200)',
  'accent-300': 'var(--spectrum-accent-color-300)',
  'accent-400': 'var(--spectrum-accent-color-400)',
  'accent-500': 'var(--spectrum-accent-color-500)',
  'accent-600': 'var(--spectrum-accent-color-600)',
  'accent-700': 'var(--spectrum-accent-color-700)',
  'accent-800': 'var(--spectrum-accent-color-800)',
  'accent-900': 'var(--spectrum-accent-color-900)',
  'accent-1000': 'var(--spectrum-accent-color-1000)',
  'accent-1100': 'var(--spectrum-accent-color-1100)',
  'accent-1200': 'var(--spectrum-accent-color-1200)',
  'accent-1300': 'var(--spectrum-accent-color-1300)',
  'accent-1400': 'var(--spectrum-accent-color-1400)',

  // High contrast mode.
  Background: 'Background',
  ButtonBorder: 'ButtonBorder',
  ButtonFace: 'ButtonFace',
  ButtonText: 'ButtonText',
  Field: 'Field',
  Highlight: 'Highlight',
  HighlightText: 'HighlightText',
  GrayText: 'GrayText',
  Mark: 'Mark',
  LinkText: 'LinkText'
};

interface ColorStates {
  default: keyof typeof color,
  isHovered: keyof typeof color,
  isFocusVisible: keyof typeof color,
  isPressed: keyof typeof color
}

export function baseColor(base: keyof typeof color): ColorStates {
  let keys = Object.keys(color) as (keyof typeof color)[];
  let index = keys.indexOf(base);
  if (index === -1) {
    throw new Error('Invalid base color ' + base);
  }

  return {
    default: base,
    isHovered: keys[index + 1],
    isFocusVisible: keys[index + 1],
    isPressed: keys[index + 1]
  };
}

export function lightDark(light: keyof typeof color, dark: keyof typeof color): `[${string}]` {
  return `[light-dark(${color[light]}, ${color[dark]})]`;
}

const baseSpacing = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem', // 2px - spacing-50
  1: '0.25rem', // 4px - spacing-75
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px - spacing-100
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px - spacing-200
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px - spacing-300
  4.5: '1.125rem', // 18px
  5: '1.25rem', // 20px
  5.5: '1.375rem', // 22px
  6: '1.5rem', // 24px - spacing-400
  6.5: '1.625rem', // 26px
  7: '1.75rem', // 28px
  8: '2rem', // 32px - spacing-500
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px - spacing-600
  11: '2.75rem', // 44px
  12: '3rem', // 48px - spacing-700
  14: '3.5rem', // 56px
  16: '4rem', // 64px - spacing-800
  20: '5rem', // 80px - spacing-900
  24: '6rem', // 96px - spacing-1000
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem'
};

const spacing = {
  ...baseSpacing,

  // font-size relative values
  'text-to-control': (10 / 14) + 'em',
  'text-to-visual': (8 / 14) + 'em', // -> 6px, 7px, 8px, 9px, 10px
  'edge-to-text': 'calc(self(height, self(minHeight)) * 3 / 8)',
  'pill': 'calc(self(height, self(minHeight)) / 2)'
};

const scaledSpacing: {[key in keyof typeof baseSpacing]: string} =
  Object.fromEntries(Object.entries(baseSpacing).map(([k, v]) =>
    [k, `calc(${v} * var(--spectrum-global-dimension-scale-factor))`])
  ) as any;

const sizing = {
  ...scaledSpacing,
  auto: 'auto',
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
  '1/5': '20%',
  '2/5': '40%',
  '3/5': '60%',
  '4/5': '80%',
  '1/6': '16.666667%',
  '2/6': '33.333333%',
  '3/6': '50%',
  '4/6': '66.666667%',
  '5/6': '83.333333%',
  full: '100%',
  screen: '100vh',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content'
};

// TODO: make the keys into numbers in typescript somehow?
const negativeSpacing: {[Key in keyof typeof scaledSpacing as `-${Key}`]: (typeof scaledSpacing)[Key]} =
  Object.fromEntries(Object.entries(scaledSpacing).map(([k, v]) =>
    [`-${k}`, `calc(${v} * -1)`]
  )) as any;

const margin = {
  ...spacing,
  ...negativeSpacing,
  auto: 'auto'
};

const inset = {
  ...baseSpacing,
  auto: 'auto',
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
  full: '100%'
};

const borderWidth = {
  0: '0px',
  1: 'var(--spectrum-alias-border-size-thin)',
  2: 'var(--spectrum-alias-border-size-thick)',
  4: 'var(--spectrum-alias-border-size-thicker)'
};

const radius = {
  none: '0px',
  sm: 'var(--spectrum-alias-border-radius-small)',
  default: 'var(--spectrum-alias-border-radius-regular)',
  lg: 'var(--spectrum-alias-border-radius-medium)',
  xl: 'var(--spectrum-alias-border-radius-large)',
  full: '9999px',
  pill: 'calc(self(height, self(minHeight, 9999px)) / 2)'
};

type GridTrack = 'none' | 'subgrid' | (string & {}) | readonly GridTrackSize[];
type GridTrackSize = 'auto' | 'min-content' | 'max-content' | `${number}fr` | `minmax(${string}, ${string})` | keyof typeof baseSpacing | (string & {});

let gridTrack = (value: GridTrack) => {
  if (typeof value === 'string') {
    return value;
  }
  return value.map(v => gridTrackSize(v)).join(' ');
};

let gridTrackSize = (value: GridTrackSize) => {
  return value in baseSpacing ? baseSpacing[value] : value;
};

// TODO
const transitionProperty = {
  default: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, scale, filter, backdrop-filter',
  colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
  opacity: 'opacity',
  shadow: 'box-shadow',
  transform: 'transform',
  all: 'all',
  none: 'none'
};

// TODO
const timingFunction = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
};

// TODO: do these need tokens or are arbitrary values ok?
let durationProperty = createArbitraryProperty((value: number | string, property) => ({[property]: typeof value === 'number' ? value + 'ms' : value}));

const colorWithAlpha = createColorProperty(color);

export const style = createTheme({
  properties: {
    // colors
    color: createColorProperty({
      ...color,
      disabled: 'var(--spectrum-alias-text-color-disabled)',
      heading: 'var(--spectrum-alias-title-text-color)',
      body: 'var(--spectrum-alias-text-color)'
    }),
    backgroundColor: createColorProperty({
      ...color,
      accent: {
        default: 'var(--spectrum-accent-background-color-default)',
        isHovered: 'var(--spectrum-accent-background-color-hover)',
        isFocusVisible: 'var(--spectrum-accent-background-color-key-focus)',
        isPressed: 'var(--spectrum-accent-background-color-down)'
      },
      neutral: {
        default: 'var(--spectrum-neutral-background-color-default)',
        isHovered: 'var(--spectrum-neutral-background-color-hover)',
        isFocusVisible: 'var(--spectrum-neutral-background-color-key-focus)',
        isPressed: 'var(--spectrum-neutral-background-color-down)'
      },
      'neutral-subdued': {
        default: 'var(--spectrum-neutral-subdued-background-color-default)',
        isHovered: 'var(--spectrum-neutral-subdued-background-color-hover)',
        isFocusVisible: 'var(--spectrum-neutral-subdued-background-color-key-focus)',
        isPressed: 'var(--spectrum-neutral-subdued-background-color-down)'
      },
      negative: {
        default: 'var(--spectrum-negative-background-color-default)',
        isHovered: 'var(--spectrum-negative-background-color-hover)',
        isFocusVisible: 'var(--spectrum-negative-background-color-key-focus)',
        isPressed: 'var(--spectrum-negative-background-color-down)'
      },
      informative: {
        default: 'var(--spectrum-informative-background-color-default)',
        isHovered: 'var(--spectrum-informative-background-color-hover)',
        isFocusVisible: 'var(--spectrum-informative-background-color-key-focus)',
        isPressed: 'var(--spectrum-informative-background-color-down)'
      },
      positive: {
        default: 'var(--spectrum-positive-background-color-default)',
        isHovered: 'var(--spectrum-positive-background-color-hover)',
        isFocusVisible: 'var(--spectrum-positive-background-color-key-focus)',
        isPressed: 'var(--spectrum-positive-background-color-down)'
      },
      gray: 'var(--spectrum-gray-background-color-default)',
      red: 'var(--spectrum-red-background-color-default)',
      orange: 'var(--spectrum-orange-background-color-default)',
      yellow: 'var(--spectrum-yellow-background-color-default)',
      chartreuse: 'var(--spectrum-chartreuse-background-color-default)',
      celery: 'var(--spectrum-celery-background-color-default)',
      green: 'var(--spectrum-green-background-color-default)',
      seafoam: 'var(--spectrum-seafoam-background-color-default)',
      cyan: 'var(--spectrum-cyan-background-color-default)',
      blue: 'var(--spectrum-blue-background-color-default)',
      indigo: 'var(--spectrum-indigo-background-color-default)',
      purple: 'var(--spectrum-purple-background-color-default)',
      fuchsia: 'var(--spectrum-fuchsia-background-color-default)',
      magenta: 'var(--spectrum-magenta-background-color-default)',
      disabled: 'var(--spectrum-alias-background-color-disabled)'
    }),
    borderColor: createColorProperty({
      ...color,
      negative: 'var(--spectrum-semantic-negative-color-border)',
      disabled: 'var(--spectrum-alias-border-color-disabled)'
        // forcedColors: 'GrayText'

    }),
    outlineColor: createColorProperty({
      ...color,
      'focus-ring': {
        default: 'var(--spectrum-alias-focus-color)',
        forcedColors: 'Highlight'
      }
    }),
    textDecorationColor: colorWithAlpha,
    accentColor: colorWithAlpha,
    caretColor: colorWithAlpha,
    fill: createColorProperty({
      none: 'none',
      currentColor: 'currentColor',
      negative: 'var(--spectrum-negative-visual-color)',
      informative: 'var(--spectrum-informative-visual-color)',
      positive: 'var(--spectrum-positive-visual-color)',
      notice: 'var(--spectrum-notice-visual-color)',
      gray: 'var(--spectrum-gray-visual-color)',
      red: 'var(--spectrum-red-visual-color)',
      orange: 'var(--spectrum-orange-visual-color)',
      yellow: 'var(--spectrum-yellow-visual-color)',
      chartreuse: 'var(--spectrum-chartreuse-visual-color)',
      celery: 'var(--spectrum-celery-visual-color)',
      green: 'var(--spectrum-green-visual-color)',
      seafoam: 'var(--spectrum-seafoam-visual-color)',
      cyan: 'var(--spectrum-cyan-visual-color)',
      blue: 'var(--spectrum-blue-visual-color)',
      indigo: 'var(--spectrum-indigo-visual-color)',
      purple: 'var(--spectrum-purple-visual-color)',
      fuchsia: 'var(--spectrum-fuchsia-visual-color)',
      magenta: 'var(--spectrum-magenta-visual-color)',
      ...color
    }),
    stroke: createColorProperty({
      none: 'none',
      currentColor: 'currentColor',
      ...color
    }),

    // dimensions
    borderSpacing: baseSpacing, // TODO: separate x and y
    flexBasis: {
      auto: 'auto',
      full: '100%',
      ...baseSpacing
    },
    rowGap: spacing,
    columnGap: spacing,
    height: sizing,
    width: sizing,
    minHeight: sizing,
    maxHeight: {
      ...sizing,
      none: 'none'
    },
    minWidth: sizing,
    maxWidth: {
      ...sizing,
      none: 'none'
    },
    borderWidth,
    borderStartWidth: createMappedProperty(value => ({borderInlineStartWidth: value}), borderWidth),
    borderEndWidth: createMappedProperty(value => ({borderInlineEndWidth: value}), borderWidth),
    borderTopWidth: borderWidth,
    borderBottomWidth: borderWidth,
    borderXWidth: createMappedProperty(value => ({borderInlineWidth: value}), borderWidth),
    borderYWidth: createMappedProperty(value => ({borderBlockWidth: value}), borderWidth),
    borderStyle: ['solid', 'dashed', 'dotted', 'double', 'hidden', 'none'] as const,
    strokeWidth: {
      0: '0',
      1: '1',
      2: '2'
    },
    marginStart: createMappedProperty(value => ({marginInlineStart: value}), margin),
    marginEnd: createMappedProperty(value => ({marginInlineEnd: value}), margin),
    marginTop: margin,
    marginBottom: margin,
    paddingStart: createMappedProperty(value => ({paddingInlineStart: value}), spacing),
    paddingEnd: createMappedProperty(value => ({paddingInlineEnd: value}), spacing),
    paddingTop: spacing,
    paddingBottom: spacing,
    scrollMarginStart: createMappedProperty(value => ({scrollMarginInlineStart: value}), baseSpacing),
    scrollMarginEnd: createMappedProperty(value => ({scrollMarginInlineEnd: value}), baseSpacing),
    scrollMarginTop: baseSpacing,
    scrollMarginBottom: baseSpacing,
    scrollPaddingStart: createMappedProperty(value => ({scrollPaddingInlineStart: value}), baseSpacing),
    scrollPaddingEnd: createMappedProperty(value => ({scrollPaddingInlineEnd: value}), baseSpacing),
    scrollPaddingTop: baseSpacing,
    scrollPaddingBottom: baseSpacing,
    textIndent: baseSpacing,
    translate: {
      ...baseSpacing,
      ...negativeSpacing,
      '1/2': '50%',
      '1/3': '33.333333%',
      '2/3': '66.666667%',
      '1/4': '25%',
      '2/4': '50%',
      '3/4': '75%',
      full: '100%'
    },
    rotate: createArbitraryProperty((value: number | `${number}deg` | `${number}rad` | `${number}grad` | `${number}turn`) => ({rotate: typeof value === 'number' ? `${value}deg` : value})),
    scale: createArbitraryProperty((value: number) => ({scale: value})),
    transform: createArbitraryProperty((value: string) => ({transform: value})),
    position: ['absolute', 'fixed', 'relative', 'sticky', 'static'] as const,
    insetStart: createMappedProperty(value => ({insetInlineStart: value}), inset),
    insetEnd: createMappedProperty(value => ({insetInlineEnd: value}), inset),
    top: inset,
    left: inset,
    bottom: inset,
    right: inset,
    aspectRatio: {
      auto: 'auto',
      square: '1 / 1',
      video: '16 / 9'
    },

    // text
    fontFamily: {
      sans: {
        default: 'adobe-clean, ui-sans-serif, system-ui, sans-serif',
        ':lang(ar)': 'myriad-arabic, ui-sans-serif, system-ui, sans-serif',
        ':lang(he)': 'myriad-hebrew, ui-sans-serif, system-ui, sans-serif',
        ':lang(ja)': "adobe-clean-han-japanese, 'Hiragino Kaku Gothic ProN', 'ヒラギノ角ゴ ProN W3', Osaka, YuGothic, 'Yu Gothic', 'メイリオ', Meiryo, 'ＭＳ Ｐゴシック', 'MS PGothic', sans-serif",
        ':lang(ko)': "adobe-clean-han-korean, source-han-korean, 'Malgun Gothic', 'Apple Gothic', sans-serif",
        ':lang(zh)': "adobe-clean-han-traditional, source-han-traditional, 'MingLiu', 'Heiti TC Light', sans-serif",
        // TODO: are these fallbacks supposed to be different than above?
        ':lang(zh-hant)': "adobe-clean-han-traditional, source-han-traditional, 'MingLiu', 'Microsoft JhengHei UI', 'Microsoft JhengHei', 'Heiti TC Light', sans-serif",
        ':lang(zh-Hans, zh-CN, zh-SG)': "adobe-clean-han-simplified-c, source-han-simplified-c, 'SimSun', 'Heiti SC Light', sans-serif"
      },
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'ui-monospace, Menlo, Monaco, Consalas, "Courier New", monospace'
    },
    fontSize: {
      xs: 'var(--spectrum-global-dimension-font-size-50)',
      sm: 'var(--spectrum-global-dimension-font-size-75)',
      base: 'var(--spectrum-global-dimension-font-size-100)',
      lg: 'var(--spectrum-global-dimension-font-size-200)',
      xl: 'var(--spectrum-global-dimension-font-size-300)',
      '2xl': 'var(--spectrum-global-dimension-font-size-400)',
      '3xl': 'var(--spectrum-global-dimension-font-size-500)'
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },
    fontStyle: ['normal', 'italic'] as const,
    lineHeight: {
      // TODO: naming
      100: 'var(--spectrum-global-font-line-height-small)',
      200: 'var(--spectrum-global-font-line-height-medium)'
    },
    listStyleType: ['none', 'dist', 'decimal'] as const,
    listStylePosition: ['inside', 'outside'] as const,
    textTransform: ['uppercase', 'lowercase', 'capitalize', 'none'] as const,
    textAlign: ['start', 'center', 'end', 'justify'] as const,
    verticalAlign: ['baseline', 'top', 'middle', 'bottom', 'text-top', 'text-bottom', 'sub', 'super'] as const,
    textDecoration: createMappedProperty((value) => ({
      textDecoration: value === 'none' ? 'none' : `${value} 1px`,
      textUnderlineOffset: value === 'underline' ? '1px' : undefined
    }), ['underline', 'overline', 'line-through', 'none'] as const),
    textOverflow: ['ellipsis', 'clip'] as const,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    truncate: createArbitraryProperty((_value: true) => ({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    })),
    lineClamp: createArbitraryProperty((value: number) => ({
      overflow: 'hidden',
      display: '-webkit-box',
      '-webkit-box-orient': 'vertical',
      '-webkit-line-clamp': value
    })),
    hyphens: ['none', 'manual', 'auto'] as const,
    whiteSpace: ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'break-spaces'] as const,
    textWrap: ['wrap', 'nowrap', 'balance', 'pretty'] as const,
    wordBreak: ['normal', 'break-all', 'keep-all'] as const, // also overflowWrap??
    boxDecorationBreak: ['slice', 'clone'] as const,

    // effects
    boxShadow: {
      // TODO: these are not real.
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      none: 'none'
    },
    borderTopStartRadius: createMappedProperty(value => ({borderStartStartRadius: value}), radius),
    borderTopEndRadius: createMappedProperty(value => ({borderStartEndRadius: value}), radius),
    borderBottomStartRadius: createMappedProperty(value => ({borderEndStartRadius: value}), radius),
    borderBottomEndRadius: createMappedProperty(value => ({borderEndEndRadius: value}), radius),
    forcedColorAdjust: ['auto', 'none'] as const,
    colorScheme: ['light', 'dark', 'light dark'] as const,
    backgroundPosition: ['bottom', 'center', 'left', 'left bottom', 'left top', 'right', 'right bottom', 'right top', 'top'] as const,
    backgroundSize: ['auto', 'cover', 'contain'] as const,
    backgroundAttachment: ['fixed', 'local', 'scroll'] as const,
    backgroundClip: ['border-box', 'padding-box', 'content-box', 'text'] as const,
    backgroundRepeat: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'round', 'space'] as const,
    backgroundOrigin: ['border-box', 'padding-box', 'content-box'] as const,
    backgroundBlendMode: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'] as const,
    mixBlendMode: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity', 'plus-darker', 'plus-lighter'] as const,
    opacity: createArbitraryProperty((value: number) => ({opacity: value})),

    outlineStyle: ['none', 'solid', 'dashed', 'dotted', 'double'] as const,
    outlineOffset: borderWidth,
    outlineWidth: borderWidth,

    transition: createMappedProperty(value => ({
      transitionProperty: value,
      transitionDuration: '150ms',
      transitionTimingFunction: timingFunction.default
    }), transitionProperty),
    transitionDelay: durationProperty,
    transitionDuration: durationProperty,
    transitionTimingFunction: timingFunction,
    animation: createArbitraryProperty((value: string) => ({
      animationName: value,
      animationDuration: '150ms',
      animationTimingFunction: timingFunction.default
    })),
    animationDuration: durationProperty,
    animationDelay: durationProperty,
    animationDirection: ['normal', 'reverse', 'alternate', 'alternate-reverse'] as const,
    animationFillMode: ['none', 'forwards', 'backwards', 'both'] as const,
    animationIterationCount: createArbitraryProperty((value: string) => ({animationIterationCount: value})),
    animationTimingFunction: timingFunction,

    // layout
    display: ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'contents', 'list-item', 'none'] as const, // tables?
    alignContent: ['normal', 'center', 'start', 'end', 'space-between', 'space-around', 'space-evenly', 'baseline', 'stretch'] as const,
    alignItems: ['start', 'end', 'center', 'baseline', 'stretch'] as const,
    justifyContent: ['normal', 'start', 'end', 'center', 'space-between', 'space-around', 'space-evenly', 'stretch'] as const,
    justifyItems: ['start', 'end', 'center', 'stretch'] as const,
    alignSelf: ['auto', 'start', 'end', 'center', 'stretch', 'baseline'] as const,
    justifySelf: ['auto', 'start', 'end', 'center', 'stretch'] as const,
    flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'] as const,
    flexWrap: ['wrap', 'wrap-reverse', 'nowrap'] as const,
    flex: createArbitraryProperty((value: CSS.Property.Flex, property) => ({[property]: value})),
    flexShrink: createArbitraryProperty((value: CSS.Property.FlexShrink, property) => ({[property]: value})),
    flexGrow: createArbitraryProperty((value: CSS.Property.FlexGrow, property) => ({[property]: value})),
    gridColumn: createArbitraryProperty((value: CSS.Property.GridColumn, property) => ({[property]: value})),
    gridColumnStart: createArbitraryProperty((value: CSS.Property.GridColumnStart, property) => ({[property]: value})),
    gridColumnEnd: createArbitraryProperty((value: CSS.Property.GridColumnEnd, property) => ({[property]: value})),
    gridRow: createArbitraryProperty((value: CSS.Property.GridRow, property) => ({[property]: value})),
    gridRowStart: createArbitraryProperty((value: CSS.Property.GridRowStart, property) => ({[property]: value})),
    gridRowEnd: createArbitraryProperty((value: CSS.Property.GridRowEnd, property) => ({[property]: value})),
    gridAutoFlow: ['row', 'column', 'dense', 'row dense', 'column dense'] as const,
    gridAutoRows: createArbitraryProperty((value: GridTrackSize, property) => ({[property]: gridTrackSize(value)})),
    gridAutoColumns: createArbitraryProperty((value: GridTrackSize, property) => ({[property]: gridTrackSize(value)})),
    gridTemplateColumns: createArbitraryProperty((value: GridTrack, property) => ({[property]: gridTrack(value)})),
    gridTemplateRows: createArbitraryProperty((value: GridTrack, property) => ({[property]: gridTrack(value)})),
    gridTemplateAreas: createArbitraryProperty((value: readonly string[], property) => ({[property]: value.map(v => `"${v}"`).join('')})),
    gridArea: createArbitraryProperty((value: string, property) => ({[property]: value})),
    float: ['inline-start', 'inline-end', 'right', 'left', 'none'] as const,
    clear: ['inline-start', 'inline-end', 'left', 'right', 'both', 'none'] as const,
    contain: ['none', 'strict', 'content', 'size', 'inline-size', 'layout', 'style', 'paint'] as const,
    boxSizing: ['border-box', 'content-box'] as const,
    tableLayout: ['auto', 'fixed'] as const,
    captionSide: ['top', 'bottom'] as const,
    borderCollapse: ['collapse', 'separate'] as const,
    columns: {
      auto: 'auto',
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
      6: '6',
      7: '7',
      8: '8',
      9: '9',
      10: '10',
      11: '11',
      12: '12',
      '3xs': '16rem',
      '2xs': '18rem',
      xs: '20rem',
      sm: '24rem',
      md: '28rem',
      lg: '32rem',
      xl: '36rem',
      '2xl': '42rem',
      '3xl': '48rem',
      '4xl': '56rem',
      '5xl': '64rem',
      '6xl': '72rem',
      '7xl': '80rem'
    },
    breakBefore: ['auto', 'avoid', 'all', 'avoid-page', 'page', 'left', 'right', 'column'] as const,
    breakInside: ['auto', 'avoid', 'avoid-page', 'avoid-column'] as const,
    breakAfter: ['auto', 'avoid', 'all', 'avoid-page', 'page', 'left', 'right', 'column'] as const,
    overflowX: ['auto', 'hidden', 'clip', 'visible', 'scroll'] as const,
    overflowY: ['auto', 'hidden', 'clip', 'visible', 'scroll'] as const,
    overscrollBehaviorX: ['auto', 'contain', 'none'] as const,
    overscrollBehaviorY: ['auto', 'contain', 'none'] as const,
    scrollBehavior: ['auto', 'smooth'] as const,
    order: createArbitraryProperty((value: number) => ({order: value})),

    pointerEvents: ['none', 'auto'] as const,
    touchAction: ['auto', 'none', 'pan-x', 'pan-y', 'manipulation', 'pinch-zoom'] as const,
    userSelect: ['none', 'text', 'all', 'auto'] as const,
    visibility: ['visible', 'hidden', 'collapse'] as const,
    isolation: ['isolate', 'auto'] as const,
    transformOrigin: ['center', 'top', 'top right', 'right', 'bottom right', 'bottom', 'bottom left', 'left', 'top right'] as const,
    cursor: ['auto', 'default', 'pointer', 'wait', 'text', 'move', 'help', 'not-allowed', 'none', 'context-menu', 'progress', 'cell', 'crosshair', 'vertical-text', 'alias', 'copy', 'no-drop', 'grab', 'grabbing', 'all-scroll', 'col-resize', 'row-resize', 'n-resize', 'e-resize', 's-resize', 'w-resize', 'ne-resize', 'nw-resize', 'se-resize', 'ew-resize', 'ns-resize', 'nesw-resize', 'nwse-resize', 'zoom-in', 'zoom-out'] as const,
    resize: ['none', 'vertical', 'horizontal', 'both'] as const,
    scrollSnapType: ['x', 'y', 'both', 'x mandatory', 'y mandatory', 'both mandatory'] as const,
    scrollSnapAlign: ['start', 'end', 'center', 'none'] as const,
    scrollSnapStop: ['normal', 'always'] as const,
    appearance: ['none', 'auto'] as const,
    objectFit: ['contain', 'cover', 'fill', 'none', 'scale-down'] as const,
    objectPosition: ['bottom', 'center', 'left', 'left bottom', 'left top', 'right', 'right bottom', 'right top', 'top'] as const,
    willChange: ['auto', 'scroll-position', 'contents', 'transform'] as const,
    zIndex: createArbitraryProperty((value: number) => ({zIndex: value}))
  },
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingStart', 'paddingEnd'] as const,
    paddingX: ['paddingStart', 'paddingEnd'] as const,
    paddingY: ['paddingTop', 'paddingBottom'] as const,
    margin: ['marginTop', 'marginBottom', 'marginStart', 'marginEnd'] as const,
    marginX: ['marginStart', 'marginEnd'] as const,
    marginY: ['marginTop', 'marginBottom'] as const,
    scrollPadding: ['scrollPaddingTop', 'scrollPaddingBottom', 'scrollPaddingStart', 'scrollPaddingEnd'] as const,
    scrollPaddingX: ['scrollPaddingStart', 'scrollPaddingEnd'] as const,
    scrollPaddingY: ['scrollPaddingTop', 'scrollPaddingBottom'] as const,
    scrollMargin: ['scrollMarginTop', 'scrollMarginBottom', 'scrollMarginStart', 'scrollMarginEnd'] as const,
    scrollMarginX: ['scrollMarginStart', 'scrollMarginEnd'] as const,
    scrollMarginY: ['scrollMarginTop', 'scrollMarginBottom'] as const,
    borderWidth: ['borderTopWidth', 'borderBottomWidth', 'borderStartWidth', 'borderEndWidth'] as const,
    borderXWidth: ['borderStartWidth', 'borderEndWidth'] as const,
    borderYWidth: ['borderTopWidth', 'borderBottomWidth'] as const,
    borderRadius: ['borderTopStartRadius', 'borderTopEndRadius', 'borderBottomStartRadius', 'borderBottomEndRadius'] as const,
    borderTopRadius: ['borderTopStartRadius', 'borderTopEndRadius'] as const,
    borderBottomRadius: ['borderBottomStartRadius', 'borderBottomEndRadius'] as const,
    borderStartRadius: ['borderTopStartRadius', 'borderBottomStartRadius'] as const,
    borderEndRadius: ['borderTopEndRadius', 'borderBottomEndRadius'] as const,
    inset: ['top', 'bottom', 'left', 'right'] as const,
    insetX: ['insetStart', 'insetEnd'] as const,
    insetY: ['top', 'bottom'] as const,
    placeItems: ['alignItems', 'justifyItems'] as const,
    placeContent: ['alignContent', 'justifyContent'] as const,
    placeSelf: ['alignSelf', 'justifySelf'] as const,
    gap: ['rowGap', 'columnGap'] as const,
    size: ['width', 'height'] as const,
    overflow: ['overflowX', 'overflowY'] as const,
    overscrollBehavior: ['overscrollBehaviorX', 'overscrollBehaviorY'] as const
  },
  conditions: {
    forcedColors: '@media (forced-colors: active)',
    // TODO
    sm: '@media (min-width: 640px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    '2xl': '@media (min-width: 1536px)'
  }
});
