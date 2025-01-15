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

import {ArbitraryValue, CSSProperties, CSSValue, PropertyValueMap} from './types';
import {autoStaticColor, colorScale, colorToken, fontSizeToken, generateOverlayColorScale, getToken, simpleColorScale, weirdColorToken} from './tokens' with {type: 'macro'};
import {Color, createArbitraryProperty, createColorProperty, createMappedProperty, createRenamedProperty, createSizingProperty, createTheme, parseArbitraryValue} from './style-macro';
import type * as CSS from 'csstype';

interface MacroContext {
  addAsset(asset: {type: string, content: string}): void
}

function pxToRem(px: string | number) {
  if (typeof px === 'string') {
    px = parseFloat(px);
  }
  return px / 16 + 'rem';
}

const color = {
  transparent: 'transparent',
  black: 'black',
  white: 'white',

  ...colorScale('gray'),
  ...colorScale('blue'),
  ...colorScale('red'),
  ...colorScale('orange'),
  ...colorScale('yellow'),
  ...colorScale('chartreuse'),
  ...colorScale('celery'),
  ...colorScale('green'),
  ...colorScale('seafoam'),
  ...colorScale('cyan'),
  ...colorScale('indigo'),
  ...colorScale('purple'),
  ...colorScale('fuchsia'),
  ...colorScale('magenta'),
  ...colorScale('pink'),
  ...colorScale('turquoise'),
  ...colorScale('brown'),
  ...colorScale('silver'),
  ...colorScale('cinnamon'),

  ...colorScale('accent-color'),
  ...colorScale('informative-color'),
  ...colorScale('negative-color'),
  ...colorScale('notice-color'),
  ...colorScale('positive-color'),

  ...simpleColorScale('transparent-white'),
  ...simpleColorScale('transparent-black'),
  ...generateOverlayColorScale(),

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

export function baseColor(base: keyof typeof color) {
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

type SpectrumColor = Color<keyof typeof color> | ArbitraryValue;
function parseColor(value: SpectrumColor) {
  let arbitrary = parseArbitraryValue(value);
  if (arbitrary) {
    return arbitrary[0];
  }
  let [colorValue, opacity] = value.split('/');
  colorValue = color[colorValue];
  if (opacity) {
    colorValue = `rgb(from ${colorValue} r g b / ${opacity}%)`;
  }
  return colorValue;
}

export function lightDark(light: SpectrumColor, dark: SpectrumColor): `[${string}]` {
  return `[light-dark(${parseColor(light)}, ${parseColor(dark)})]`;
}

export function colorMix(a: SpectrumColor, b: SpectrumColor, percent: number): `[${string}]` {
  return `[color-mix(in srgb, ${parseColor(a)}, ${parseColor(b)} ${percent}%)]`;
}

interface LinearGradient {
  type: 'linear-gradient',
  angle: string,
  stops: [SpectrumColor, number][]
}

export function linearGradient(this: MacroContext | void, angle: string, ...tokens: [SpectrumColor, number][]): [LinearGradient] {
  // Generate @property rules for each gradient stop color. This allows the gradient to be animated.
  let propertyDefinitions: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    propertyDefinitions.push(`@property --g${i} {
  syntax: '<color>';
  initial-value: #0000;
  inherits: false;
}`);
  }

  if (this && typeof this.addAsset === 'function') {
    this.addAsset({
      type: 'css',
      content: propertyDefinitions.join('\n\n')
    });
  }

  return [{
    type: 'linear-gradient',
    angle,
    stops: tokens
  }];
}

function generateSpacing<K extends number[]>(px: K): {[P in K[number]]: string} {
  let res: any = {};
  for (let p of px) {
    res[p] = pxToRem(p);
  }
  return res;
}

const baseSpacing = generateSpacing([
  0,
  2, // spacing-50
  4, // spacing-75
  8, // spacing-100
  12, // spacing-200
  16, // spacing-300
  20,
  24, // spacing-400
  28,
  32, // spacing-500
  36,
  40, // spacing-600
  44,
  48, // spacing-700
  56,
  // From here onward the values are mostly spaced by 1rem (16px)
  64, // spacing-800
  80, // spacing-900
  96, // spacing-1000
  // TODO: should these only be available as sizes rather than spacing?
  112,
  128,
  144,
  160,
  176,
  192,
  208,
  224,
  240,
  256,
  288,
  320,
  384
] as const);

// This should match the above, but negative. There's no way to negate a number
// type in typescript so this has to be done manually for now.
const negativeSpacing = generateSpacing([
  // -2, // spacing-50 !! TODO: should we support this?
  -4, // spacing-75
  -8, // spacing-100
  -12, // spacing-200
  -16, // spacing-300
  -20,
  -24, // spacing-400
  -28,
  -32, // spacing-500
  -36,
  -40, // spacing-600
  -44,
  -48, // spacing-700
  -56,
  // From here onward the values are mostly spaced by 1rem (16px)
  -64, // spacing-800
  -80, // spacing-900
  -96, // spacing-1000
  // TODO: should these only be available as sizes rather than spacing?
  -112,
  -128,
  -144,
  -160,
  -176,
  -192,
  -208,
  -224,
  -240,
  -256,
  -288,
  -320,
  -384
] as const);

export function fontRelative(this: MacroContext | void, base: number, baseFontSize = 14) {
  return (base / baseFontSize) + 'em';
}

export function edgeToText(this: MacroContext | void, height: keyof typeof baseSpacing) {
  return `calc(${baseSpacing[height]} * 3 / 8)`;
}

export function space(this: MacroContext | void, px: number) {
  return pxToRem(px);
}

const spacing = {
  ...baseSpacing,

  // font-size relative values
  'text-to-control': fontRelative(10),
  'text-to-visual': {
    default: fontRelative(6), // -> 5px, 5px, 6px, 7px, 8px
    touch: fontRelative(8, 17) // -> 6px, 7px, 8px, 9px, 10px, should be 7px, 7px, 8px, 9px, 11px
  },
  // height relative values
  'edge-to-text': 'calc(self(height, self(minHeight)) * 3 / 8)',
  'pill': 'calc(self(height, self(minHeight)) / 2)'
};

export function size(this: MacroContext | void, px: number) {
  return `calc(${pxToRem(px)} * var(--s2-scale))`;
}

const sizing = {
  auto: 'auto',
  full: '100%',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content',

  control: {
    default: size(32),
    size: {
      XS: size(20),
      S: size(24),
      L: size(40),
      XL: size(48)
    }
  },
  // With browser support for round() we could do this:
  // 'control-sm': `round(${16 / 14}em, 2px)`
  'control-sm': {
    default: size(16),
    size: {
      S: size(14),
      L: size(18),
      XL: size(20)
    }
  }
};

const height = {
  ...sizing,
  screen: '100vh'
};

const width = {
  ...sizing,
  screen: '100vw'
};

function createSpectrumSizingProperty<T extends CSSValue>(values: PropertyValueMap<T>) {
  return createSizingProperty(values, px => `calc(${pxToRem(px)} * var(--s2-scale))`);
}

const margin = {
  ...spacing,
  ...negativeSpacing,
  auto: 'auto'
};

const inset = {
  ...baseSpacing,
  auto: 'auto',
  full: '100%'
};

const translate = {
  ...baseSpacing,
  ...negativeSpacing,
  full: '100%'
};

const borderWidth = {
  0: '0px',
  1: getToken('border-width-100'),
  2: getToken('border-width-200'),
  4: getToken('border-width-400')
};

const borderColor = createColorProperty({
  ...color,
  negative: {
    default: colorToken('negative-border-color-default'),
    isHovered: colorToken('negative-border-color-hover'),
    isFocusVisible: colorToken('negative-border-color-key-focus'),
    isPressed: colorToken('negative-border-color-down')
  },
  disabled: colorToken('disabled-border-color')
    // forcedColors: 'GrayText'

});

const radius = {
  none: getToken('corner-radius-none'), // 0px
  sm: pxToRem(getToken('corner-radius-small-default')), // 4px
  default: pxToRem(getToken('corner-radius-medium-default')), // 8px
  lg: pxToRem(getToken('corner-radius-large-default')), // 10px
  xl: pxToRem(getToken('corner-radius-extra-large-default')), // 16px
  full: '9999px',
  pill: 'calc(self(height, self(minHeight, 9999px)) / 2)',
  control: fontRelative(8), // automatic based on font size (e.g. t-shirt size logarithmic scale)
  'control-sm': fontRelative(4)
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

const transitionProperty = {
  // var(--gp) is generated by the backgroundImage property when setting a gradient.
  // It includes a list of all of the custom properties used for each color stop.
  default: 'color, background-color, var(--gp), border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, backdrop-filter',
  colors: 'color, background-color, var(--gp), border-color, text-decoration-color, fill, stroke',
  opacity: 'opacity',
  shadow: 'box-shadow',
  transform: 'transform, translate, scale, rotate',
  all: 'all',
  none: 'none'
};

// TODO
const timingFunction = {
  default: 'cubic-bezier(0.45, 0, 0.4, 1)',
  linear: 'linear',
  in: 'cubic-bezier(0.5, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.40, 1)',
  'in-out': 'cubic-bezier(0.45, 0, 0.4, 1)'
};

// TODO: do these need tokens or are arbitrary values ok?
let durationProperty = createArbitraryProperty((value: number | string, property) => ({[property]: typeof value === 'number' ? value + 'ms' : value}));

// const colorWithAlpha = createColorProperty(color);

const fontWeightBase = {
  light: '300',
  // TODO: spectrum calls this "regular" but CSS calls it "normal". We also call other properties "default". What do we want to match?
  normal: '400',
  medium: '500',
  bold: '700',
  'extra-bold': '800',
  black: '900'
} as const;

const i18nFonts = {
  ':lang(ar)': 'myriad-arabic, ui-sans-serif, system-ui, sans-serif',
  ':lang(he)': 'myriad-hebrew, ui-sans-serif, system-ui, sans-serif',
  ':lang(ja)': "adobe-clean-han-japanese, 'Hiragino Kaku Gothic ProN', 'ヒラギノ角ゴ ProN W3', Osaka, YuGothic, 'Yu Gothic', 'メイリオ', Meiryo, 'ＭＳ Ｐゴシック', 'MS PGothic', sans-serif",
  ':lang(ko)': "adobe-clean-han-korean, source-han-korean, 'Malgun Gothic', 'Apple Gothic', sans-serif",
  ':lang(zh)': "adobe-clean-han-traditional, source-han-traditional, 'MingLiu', 'Heiti TC Light', sans-serif",
  // TODO: are these fallbacks supposed to be different than above?
  ':lang(zh-hant)': "adobe-clean-han-traditional, source-han-traditional, 'MingLiu', 'Microsoft JhengHei UI', 'Microsoft JhengHei', 'Heiti TC Light', sans-serif",
  ':lang(zh-Hans, zh-CN, zh-SG)': "adobe-clean-han-simplified-c, source-han-simplified-c, 'SimSun', 'Heiti SC Light', sans-serif"
} as const;

const fontSize = {
  // The default font size scale is for use within UI components.
  'ui-xs': fontSizeToken('font-size-50'),
  'ui-sm': fontSizeToken('font-size-75'),
  ui: fontSizeToken('font-size-100'),
  'ui-lg': fontSizeToken('font-size-200'),
  'ui-xl': fontSizeToken('font-size-300'),
  'ui-2xl': fontSizeToken('font-size-400'),
  'ui-3xl': fontSizeToken('font-size-500'),

  control: {
    default: fontSizeToken('font-size-100'),
    size: {
      XS: fontSizeToken('font-size-50'),
      S: fontSizeToken('font-size-75'),
      L: fontSizeToken('font-size-200'),
      XL: fontSizeToken('font-size-300')
    }
  },

  'heading-2xs': fontSizeToken('heading-size-xxs'),
  'heading-xs': fontSizeToken('heading-size-xs'),
  'heading-sm': fontSizeToken('heading-size-s'),
  heading: fontSizeToken('heading-size-m'),
  'heading-lg': fontSizeToken('heading-size-l'),
  'heading-xl': fontSizeToken('heading-size-xl'),
  'heading-2xl': fontSizeToken('heading-size-xxl'),
  'heading-3xl': fontSizeToken('heading-size-xxxl'),

  'title-xs': fontSizeToken('title-size-xs'),
  'title-sm': fontSizeToken('title-size-s'),
  title: fontSizeToken('title-size-m'),
  'title-lg': fontSizeToken('title-size-l'),
  'title-xl': fontSizeToken('title-size-xl'),
  'title-2xl': fontSizeToken('title-size-xxl'),
  'title-3xl': fontSizeToken('title-size-xxxl'),

  // Body is for large blocks of text, e.g. paragraphs, not in UI components.
  'body-2xs': fontSizeToken('font-size-50'), // TODO: seems like there is no token for this
  'body-xs': fontSizeToken('body-size-xs'),
  'body-sm': fontSizeToken('body-size-s'),
  body: fontSizeToken('body-size-m'),
  'body-lg': fontSizeToken('body-size-l'),
  'body-xl': fontSizeToken('body-size-xl'),
  'body-2xl': fontSizeToken('body-size-xxl'),
  'body-3xl': fontSizeToken('body-size-xxxl'),

  'detail-sm': fontSizeToken('detail-size-s'),
  detail: fontSizeToken('detail-size-m'),
  'detail-lg': fontSizeToken('detail-size-l'),
  'detail-xl': fontSizeToken('detail-size-xl'),

  'code-xs': fontSizeToken('code-size-xs'),
  'code-sm': fontSizeToken('code-size-s'),
  code: fontSizeToken('code-size-m'),
  'code-lg': fontSizeToken('code-size-l'),
  'code-xl': fontSizeToken('code-size-xl')
} as const;

export const style = createTheme({
  properties: {
    // colors
    color: createColorProperty({
      ...color,
      accent: {
        default: colorToken('accent-content-color-default'),
        isHovered: colorToken('accent-content-color-hover'),
        isFocusVisible: colorToken('accent-content-color-key-focus'),
        isPressed: colorToken('accent-content-color-down')
        // isSelected: colorToken('accent-content-color-selected'), // same as pressed
      },
      neutral: {
        default: colorToken('neutral-content-color-default'),
        isHovered: colorToken('neutral-content-color-hover'),
        isFocusVisible: colorToken('neutral-content-color-key-focus'),
        isPressed: colorToken('neutral-content-color-down')
        // isSelected: colorToken('neutral-subdued-content-color-selected'),
      },
      'neutral-subdued': {
        default: colorToken('neutral-subdued-content-color-default'),
        isHovered: colorToken('neutral-subdued-content-color-hover'),
        isFocusVisible: colorToken('neutral-subdued-content-color-key-focus'),
        isPressed: colorToken('neutral-subdued-content-color-down')
        // isSelected: colorToken('neutral-subdued-content-color-selected'),
      },
      negative: {
        default: colorToken('negative-content-color-default'),
        isHovered: colorToken('negative-content-color-hover'),
        isFocusVisible: colorToken('negative-content-color-key-focus'),
        isPressed: colorToken('negative-content-color-down')
      },
      disabled: {
        default: colorToken('disabled-content-color')
        // forcedColors: 'GrayText'
      },
      heading: colorToken('heading-color'),
      title: colorToken('title-color'),
      body: colorToken('body-color'),
      detail: colorToken('detail-color'),
      code: colorToken('code-color'),
      auto: autoStaticColor('self(backgroundColor, var(--s2-container-bg))')
    }),
    backgroundColor: createColorProperty({
      ...color,
      accent: {
        default: weirdColorToken('accent-background-color-default'),
        isHovered: weirdColorToken('accent-background-color-hover'),
        isFocusVisible: weirdColorToken('accent-background-color-key-focus'),
        isPressed: weirdColorToken('accent-background-color-down')
      },
      'accent-subtle': weirdColorToken('accent-subtle-background-color-default'),
      neutral: {
        default: colorToken('neutral-background-color-default'),
        isHovered: colorToken('neutral-background-color-hover'),
        isFocusVisible: colorToken('neutral-background-color-key-focus'),
        isPressed: colorToken('neutral-background-color-down')
      },
      'neutral-subdued': {
        default: weirdColorToken('neutral-subdued-background-color-default'),
        isHovered: weirdColorToken('neutral-subdued-background-color-hover'),
        isFocusVisible: weirdColorToken('neutral-subdued-background-color-key-focus'),
        isPressed: weirdColorToken('neutral-subdued-background-color-down')
      },
      'neutral-subtle': weirdColorToken('neutral-subtle-background-color-default'),
      negative: {
        default: weirdColorToken('negative-background-color-default'),
        isHovered: weirdColorToken('negative-background-color-hover'),
        isFocusVisible: weirdColorToken('negative-background-color-key-focus'),
        isPressed: weirdColorToken('negative-background-color-down')
      },
      'negative-subtle': weirdColorToken('negative-subtle-background-color-default'),
      informative: {
        default: weirdColorToken('informative-background-color-default'),
        isHovered: weirdColorToken('informative-background-color-hover'),
        isFocusVisible: weirdColorToken('informative-background-color-key-focus'),
        isPressed: weirdColorToken('informative-background-color-down')
      },
      'informative-subtle': weirdColorToken('informative-subtle-background-color-default'),
      positive: {
        default: weirdColorToken('positive-background-color-default'),
        isHovered: weirdColorToken('positive-background-color-hover'),
        isFocusVisible: weirdColorToken('positive-background-color-key-focus'),
        isPressed: weirdColorToken('positive-background-color-down')
      },
      'positive-subtle': weirdColorToken('positive-subtle-background-color-default'),
      notice: weirdColorToken('notice-background-color-default'),
      'notice-subtle': weirdColorToken('notice-subtle-background-color-default'),
      gray: weirdColorToken('gray-background-color-default'),
      'gray-subtle': weirdColorToken('gray-subtle-background-color-default'),
      red: weirdColorToken('red-background-color-default'),
      'red-subtle': weirdColorToken('red-subtle-background-color-default'),
      orange: weirdColorToken('orange-background-color-default'),
      'orange-subtle': weirdColorToken('orange-subtle-background-color-default'),
      yellow: weirdColorToken('yellow-background-color-default'),
      'yellow-subtle': weirdColorToken('yellow-subtle-background-color-default'),
      chartreuse: weirdColorToken('chartreuse-background-color-default'),
      'chartreuse-subtle': weirdColorToken('chartreuse-subtle-background-color-default'),
      celery: weirdColorToken('celery-background-color-default'),
      'celery-subtle': weirdColorToken('celery-subtle-background-color-default'),
      green: weirdColorToken('green-background-color-default'),
      'green-subtle': weirdColorToken('green-subtle-background-color-default'),
      seafoam: weirdColorToken('seafoam-background-color-default'),
      'seafoam-subtle': weirdColorToken('seafoam-subtle-background-color-default'),
      cyan: weirdColorToken('cyan-background-color-default'),
      'cyan-subtle': weirdColorToken('cyan-subtle-background-color-default'),
      blue: weirdColorToken('blue-background-color-default'),
      'blue-subtle': weirdColorToken('blue-subtle-background-color-default'),
      indigo: weirdColorToken('indigo-background-color-default'),
      'indigo-subtle': weirdColorToken('indigo-subtle-background-color-default'),
      purple: weirdColorToken('purple-background-color-default'),
      'purple-subtle': weirdColorToken('purple-subtle-background-color-default'),
      fuchsia: weirdColorToken('fuchsia-background-color-default'),
      'fuchsia-subtle': weirdColorToken('fuchsia-subtle-background-color-default'),
      magenta: weirdColorToken('magenta-background-color-default'),
      'magenta-subtle': weirdColorToken('magenta-subtle-background-color-default'),
      pink: weirdColorToken('pink-background-color-default'),
      'pink-subtle': weirdColorToken('pink-subtle-background-color-default'),
      turquoise: weirdColorToken('turquoise-background-color-default'),
      'turquoise-subtle': weirdColorToken('turquoise-subtle-background-color-default'),
      cinnamon: weirdColorToken('cinnamon-background-color-default'),
      'cinnamon-subtle': weirdColorToken('cinnamon-subtle-background-color-default'),
      brown: weirdColorToken('brown-background-color-default'),
      'brown-subtle': weirdColorToken('brown-subtle-background-color-default'),
      silver: weirdColorToken('silver-background-color-default'),
      'silver-subtle': weirdColorToken('silver-subtle-background-color-default'),
      disabled: colorToken('disabled-background-color'),
      base: colorToken('background-base-color'),
      'layer-1': colorToken('background-layer-1-color'),
      'layer-2': weirdColorToken('background-layer-2-color'),
      pasteboard: weirdColorToken('background-pasteboard-color'),
      elevated: weirdColorToken('background-elevated-color')
    }),

    outlineColor: createColorProperty({
      ...color,
      'focus-ring': {
        default: colorToken('focus-indicator-color'),
        forcedColors: 'Highlight'
      }
    }),
    // textDecorationColor: colorWithAlpha,
    // accentColor: colorWithAlpha,
    // caretColor: colorWithAlpha,
    fill: createColorProperty({
      none: 'none',
      currentColor: 'currentColor',
      accent: weirdColorToken('accent-visual-color'),
      neutral: weirdColorToken('neutral-visual-color'),
      negative: weirdColorToken('negative-visual-color'),
      informative: weirdColorToken('informative-visual-color'),
      positive: weirdColorToken('positive-visual-color'),
      notice: weirdColorToken('notice-visual-color'),
      gray: weirdColorToken('gray-visual-color'),
      red: weirdColorToken('red-visual-color'),
      orange: weirdColorToken('orange-visual-color'),
      yellow: weirdColorToken('yellow-visual-color'),
      chartreuse: weirdColorToken('chartreuse-visual-color'),
      celery: weirdColorToken('celery-visual-color'),
      green: weirdColorToken('green-visual-color'),
      seafoam: weirdColorToken('seafoam-visual-color'),
      cyan: weirdColorToken('cyan-visual-color'),
      blue: weirdColorToken('blue-visual-color'),
      indigo: weirdColorToken('indigo-visual-color'),
      purple: weirdColorToken('purple-visual-color'),
      fuchsia: weirdColorToken('fuchsia-visual-color'),
      magenta: weirdColorToken('magenta-visual-color'),
      pink: weirdColorToken('pink-visual-color'),
      turquoise: weirdColorToken('turquoise-visual-color'),
      cinnamon: weirdColorToken('cinnamon-visual-color'),
      brown: weirdColorToken('brown-visual-color'),
      silver: weirdColorToken('silver-visual-color'),
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
    height: createSpectrumSizingProperty(height),
    width: createSpectrumSizingProperty(width),
    containIntrinsicWidth: createSpectrumSizingProperty(width),
    containIntrinsicHeight: createSpectrumSizingProperty(height),
    minHeight: createSpectrumSizingProperty(height),
    maxHeight: createSpectrumSizingProperty({
      ...height,
      none: 'none'
    }),
    minWidth: createSpectrumSizingProperty(width),
    maxWidth: createSpectrumSizingProperty({
      ...width,
      none: 'none'
    }),
    borderStartWidth: createRenamedProperty('borderInlineStartWidth', borderWidth),
    borderEndWidth: createRenamedProperty('borderInlineEndWidth', borderWidth),
    borderTopWidth: borderWidth,
    borderBottomWidth: borderWidth,
    borderInlineStartColor: borderColor, // don't know why i can't use renamed
    borderInlineEndColor: borderColor,
    borderTopColor: borderColor,
    borderBottomColor: borderColor,
    borderStyle: ['solid', 'dashed', 'dotted', 'double', 'hidden', 'none'] as const,
    strokeWidth: {
      0: '0',
      1: '1',
      2: '2'
    },
    marginStart: createRenamedProperty('marginInlineStart', margin),
    marginEnd: createRenamedProperty('marginInlineEnd', margin),
    marginTop: margin,
    marginBottom: margin,
    paddingStart: createRenamedProperty('paddingInlineStart', spacing),
    paddingEnd: createRenamedProperty('paddingInlineEnd', spacing),
    paddingTop: spacing,
    paddingBottom: spacing,
    scrollMarginStart: createRenamedProperty('scrollMarginInlineStart', baseSpacing),
    scrollMarginEnd: createRenamedProperty('scrollMarginInlineEnd', baseSpacing),
    scrollMarginTop: baseSpacing,
    scrollMarginBottom: baseSpacing,
    scrollPaddingStart: createRenamedProperty('scrollPaddingInlineStart', baseSpacing),
    scrollPaddingEnd: createRenamedProperty('scrollPaddingInlineEnd', baseSpacing),
    scrollPaddingTop: baseSpacing,
    scrollPaddingBottom: baseSpacing,
    textIndent: baseSpacing,
    translateX: createMappedProperty(value => ({
      '--translateX': value,
      translate: 'var(--translateX, 0) var(--translateY, 0)'
    }), translate),
    translateY: createMappedProperty(value => ({
      '--translateY': value,
      translate: 'var(--translateX, 0) var(--translateY, 0)'
    }), translate),
    rotate: createArbitraryProperty((value: number | `${number}deg` | `${number}rad` | `${number}grad` | `${number}turn`, property) => ({[property]: typeof value === 'number' ? `${value}deg` : value})),
    scaleX: createArbitraryProperty<number>(value => ({
      '--scaleX': value,
      scale: 'var(--scaleX, 1) var(--scaleY, 1)'
    })),
    scaleY: createArbitraryProperty<number>(value => ({
      '--scaleY': value,
      scale: 'var(--scaleX, 1) var(--scaleY, 1)'
    })),
    transform: createArbitraryProperty<string>(),
    position: ['absolute', 'fixed', 'relative', 'sticky', 'static'] as const,
    insetStart: createRenamedProperty('insetInlineStart', inset),
    insetEnd: createRenamedProperty('insetInlineEnd', inset),
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
        default: 'adobe-clean-variable, adobe-clean, ui-sans-serif, system-ui, sans-serif',
        ...i18nFonts
      },
      serif: {
        default: 'adobe-clean-serif, "Source Serif", Georgia, serif',
        ...i18nFonts
      },
      code: 'source-code-pro, "Source Code Pro", Monaco, monospace'
    },
    fontSize,
    fontWeight: createMappedProperty((value, property) => {
      if (property === 'fontWeight') {
        return {
          // Set font-variation-settings in addition to font-weight to work around typekit issue.
          fontVariationSettings: value === 'inherit' ? 'inherit' : `"wght" ${value}`,
          fontWeight: value as any,
          fontSynthesisWeight: 'none'
        };
      }

      return {[property]: value};
    }, {
      ...fontWeightBase,
      heading: {
        default: fontWeightBase[getToken('heading-sans-serif-font-weight') as keyof typeof fontWeightBase],
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': fontWeightBase[getToken('heading-cjk-font-weight') as keyof typeof fontWeightBase]
      },
      title: {
        default: fontWeightBase[getToken('title-sans-serif-font-weight') as keyof typeof fontWeightBase],
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': fontWeightBase[getToken('title-cjk-font-weight') as keyof typeof fontWeightBase]
      },
      detail: {
        default: fontWeightBase[getToken('detail-sans-serif-font-weight') as keyof typeof fontWeightBase],
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': fontWeightBase[getToken('detail-cjk-font-weight') as keyof typeof fontWeightBase]
      }
    }),
    lineHeight: {
      // See https://spectrum.corp.adobe.com/page/typography/#Line-height
      ui: {
        default: getToken('line-height-100'),
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': getToken('line-height-200')
      },
      heading: {
        default: getToken('heading-line-height'),
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': getToken('heading-cjk-line-height')
      },
      title: {
        default: getToken('title-line-height'),
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': getToken('title-cjk-line-height')
      },
      body: {
        default: getToken('body-line-height'),
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': getToken('body-cjk-line-height')
      },
      detail: {
        default: getToken('detail-line-height'),
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': getToken('detail-cjk-line-height')
      },
      code: {
        default: getToken('code-line-height'),
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': getToken('code-cjk-line-height')
      }
    },
    listStyleType: ['none', 'dist', 'decimal'] as const,
    listStylePosition: ['inside', 'outside'] as const,
    textTransform: ['uppercase', 'lowercase', 'capitalize', 'none'] as const,
    textAlign: ['start', 'center', 'end', 'justify'] as const,
    verticalAlign: ['baseline', 'top', 'middle', 'bottom', 'text-top', 'text-bottom', 'sub', 'super'] as const,
    textDecoration: createMappedProperty((value) => ({
      textDecoration: value === 'none' ? 'none' : `${value} ${getToken('text-underline-thickness')}`,
      textUnderlineOffset: value === 'underline' ? getToken('text-underline-gap') : undefined
    }), ['underline', 'overline', 'line-through', 'none'] as const),
    textOverflow: ['ellipsis', 'clip'] as const,
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
      emphasized: `${getToken('drop-shadow-emphasized-default-x')} ${getToken('drop-shadow-emphasized-default-y')} ${getToken('drop-shadow-emphasized-default-blur')} ${colorToken('drop-shadow-emphasized-default-color')}`,
      elevated: `${getToken('drop-shadow-elevated-x')} ${getToken('drop-shadow-elevated-y')} ${getToken('drop-shadow-elevated-blur')} ${colorToken('drop-shadow-elevated-color')}`,
      dragged: `${getToken('drop-shadow-dragged-x')} ${getToken('drop-shadow-dragged-y')} ${getToken('drop-shadow-dragged-blur')} ${colorToken('drop-shadow-dragged-color')}`,
      none: 'none'
    },
    filter: {
      emphasized: `drop-shadow(${getToken('drop-shadow-emphasized-default-x')} ${getToken('drop-shadow-emphasized-default-y')} ${getToken('drop-shadow-emphasized-default-blur')} ${colorToken('drop-shadow-emphasized-default-color')})`,
      elevated: `drop-shadow(${getToken('drop-shadow-elevated-x')} ${getToken('drop-shadow-elevated-y')} ${getToken('drop-shadow-elevated-blur')} ${colorToken('drop-shadow-elevated-color')})`,
      dragged: `drop-shadow${getToken('drop-shadow-dragged-x')} ${getToken('drop-shadow-dragged-y')} ${getToken('drop-shadow-dragged-blur')} ${colorToken('drop-shadow-dragged-color')}`,
      none: 'none'
    },
    borderTopStartRadius: createRenamedProperty('borderStartStartRadius', radius),
    borderTopEndRadius: createRenamedProperty('borderStartEndRadius', radius),
    borderBottomStartRadius: createRenamedProperty('borderEndStartRadius', radius),
    borderBottomEndRadius: createRenamedProperty('borderEndEndRadius', radius),
    forcedColorAdjust: ['auto', 'none'] as const,
    colorScheme: ['light', 'dark', 'light dark'] as const,
    backgroundImage: createArbitraryProperty<string | [LinearGradient]>((value, property) => {
      if (typeof value === 'string') {
        return {[property]: value};
      } else if (Array.isArray(value) && value[0]?.type === 'linear-gradient') {
        let values: CSSProperties = {
          [property]: `linear-gradient(${value[0].angle}, ${value[0].stops.map(([, stop], i) => `var(--g${i}) ${stop}%`)})`
        };

        // Create a CSS var for each color stop so the gradient can be transitioned.
        // These are registered via @property in the `linearGradient` macro.
        let properties: string[] = [];
        value[0].stops.forEach(([color], i) => {
          properties.push(`--g${i}`);
          values[`--g${i}`] = parseColor(color);
        });

        // This is used by transition-property so we automatically transition all of the color stops.
        values['--gp'] = properties.join(', ');
        return values;
      } else {
        throw new Error('Unexpected backgroundImage value: ' + JSON.stringify(value));
      }
    }),
    // TODO: do we need separate x and y properties?
    backgroundPosition: ['bottom', 'center', 'left', 'left bottom', 'left top', 'right', 'right bottom', 'right top', 'top'] as const,
    backgroundSize: ['auto', 'cover', 'contain'] as const,
    backgroundAttachment: ['fixed', 'local', 'scroll'] as const,
    backgroundClip: ['border-box', 'padding-box', 'content-box', 'text'] as const,
    backgroundRepeat: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'round', 'space'] as const,
    backgroundOrigin: ['border-box', 'padding-box', 'content-box'] as const,
    backgroundBlendMode: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'] as const,
    mixBlendMode: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity', 'plus-darker', 'plus-lighter'] as const,
    opacity: createArbitraryProperty<number>(),

    outlineStyle: ['none', 'solid', 'dashed', 'dotted', 'double', 'inset'] as const,
    outlineOffset: createArbitraryProperty<number>((v, property) => ({[property]: `${v}px`})),
    outlineWidth: borderWidth,

    transition: createRenamedProperty('transitionProperty', transitionProperty),
    transitionDelay: durationProperty,
    transitionDuration: durationProperty,
    transitionTimingFunction: timingFunction,
    animation: createArbitraryProperty((value: string, property) => ({[property === 'animation' ? 'animationName' : property]: value})),
    animationDuration: durationProperty,
    animationDelay: durationProperty,
    animationDirection: ['normal', 'reverse', 'alternate', 'alternate-reverse'] as const,
    animationFillMode: ['none', 'forwards', 'backwards', 'both'] as const,
    animationIterationCount: createArbitraryProperty<string>(),
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
    flexShrink: createArbitraryProperty<CSS.Property.FlexShrink>(),
    flexGrow: createArbitraryProperty<CSS.Property.FlexGrow>(),
    gridColumnStart: createArbitraryProperty<CSS.Property.GridColumnStart>(),
    gridColumnEnd: createArbitraryProperty<CSS.Property.GridColumnEnd>(),
    gridRowStart: createArbitraryProperty<CSS.Property.GridRowStart>(),
    gridRowEnd: createArbitraryProperty<CSS.Property.GridRowEnd>(),
    gridAutoFlow: ['row', 'column', 'dense', 'row dense', 'column dense'] as const,
    gridAutoRows: createArbitraryProperty((value: GridTrackSize, property) => ({[property]: gridTrackSize(value)})),
    gridAutoColumns: createArbitraryProperty((value: GridTrackSize, property) => ({[property]: gridTrackSize(value)})),
    gridTemplateColumns: createArbitraryProperty((value: GridTrack, property) => ({[property]: gridTrack(value)})),
    gridTemplateRows: createArbitraryProperty((value: GridTrack, property) => ({[property]: gridTrack(value)})),
    gridTemplateAreas: createArbitraryProperty((value: readonly string[], property) => ({[property]: value.map(v => `"${v}"`).join('')})),
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
      // TODO: what should these sizes be?
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
    order: createArbitraryProperty<number>(),

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
    zIndex: createArbitraryProperty<number>(),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    disableTapHighlight: createArbitraryProperty((_value: true) => ({
      '-webkit-tap-highlight-color': 'rgba(0,0,0,0)'
    }))
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
    borderColor: ['borderTopColor', 'borderBottomColor', 'borderInlineStartColor', 'borderInlineEndColor'] as const,
    borderXWidth: ['borderStartWidth', 'borderEndWidth'] as const,
    borderYWidth: ['borderTopWidth', 'borderBottomWidth'] as const,
    borderRadius: ['borderTopStartRadius', 'borderTopEndRadius', 'borderBottomStartRadius', 'borderBottomEndRadius'] as const,
    borderTopRadius: ['borderTopStartRadius', 'borderTopEndRadius'] as const,
    borderBottomRadius: ['borderBottomStartRadius', 'borderBottomEndRadius'] as const,
    borderStartRadius: ['borderTopStartRadius', 'borderBottomStartRadius'] as const,
    borderEndRadius: ['borderTopEndRadius', 'borderBottomEndRadius'] as const,
    translate: ['translateX', 'translateY'] as const,
    scale: ['scaleX', 'scaleY'] as const,
    inset: ['top', 'bottom', 'insetStart', 'insetEnd'] as const,
    insetX: ['insetStart', 'insetEnd'] as const,
    insetY: ['top', 'bottom'] as const,
    placeItems: ['alignItems', 'justifyItems'] as const,
    placeContent: ['alignContent', 'justifyContent'] as const,
    placeSelf: ['alignSelf', 'justifySelf'] as const,
    gap: ['rowGap', 'columnGap'] as const,
    size: ['width', 'height'] as const,
    minSize: ['minWidth', 'minHeight'] as const,
    maxSize: ['maxWidth', 'maxHeight'] as const,
    overflow: ['overflowX', 'overflowY'] as const,
    overscrollBehavior: ['overscrollBehaviorX', 'overscrollBehaviorY'] as const,
    gridArea: ['gridColumnStart', 'gridColumnEnd', 'gridRowStart', 'gridRowEnd'] as const,
    transition: (value: keyof typeof transitionProperty) => ({
      transition: value,
      transitionDuration: 150,
      transitionTimingFunction: 'default'
    }),
    animation: (value: string) => ({
      animation: value,
      animationDuration: 150,
      animationTimingFunction: 'default'
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    truncate: (_value: true) => ({
      overflowX: 'hidden',
      overflowY: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }),
    font: (value: keyof typeof fontSize) => {
      let type = value.split('-')[0];
      if (type === 'control') {
        type = 'ui';
      }
      return {
        fontFamily: type === 'code' ? 'code' : 'sans',
        fontSize: value,
        fontWeight: type === 'heading' || type === 'title' || type === 'detail' ? type : 'normal',
        lineHeight: type,
        color: type === 'ui' ? 'body' : type
      };
    }
  },
  conditions: {
    forcedColors: '@media (forced-colors: active)',
    // This detects touch primary devices as best as we can.
    // Ideally we'd use (pointer: course) but browser/device support is inconsistent.
    // Samsung Android devices claim to be mice at the hardware/OS level: (any-pointer: fine), (any-hover: hover), (hover: hover), and nothing for pointer.
    // More details: https://www.ctrl.blog/entry/css-media-hover-samsung.html
    // iPhone matches (any-hover: none), (hover: none), and nothing for any-pointer or pointer.
    // If a trackpad or Apple Pencil is connected to iPad, it matches (any-pointer: fine), (any-hover: hover), (hover: none).
    // Windows tablet matches the same as iPhone. No difference when a mouse is connected.
    // Windows touch laptop matches same as macOS: (any-pointer: fine), (pointer: fine), (any-hover: hover), (hover: hover).
    touch: '@media not ((hover: hover) and (pointer: fine))',
    // TODO
    sm: '@media (min-width: 640px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    '2xl': '@media (min-width: 1536px)'
  }
});
