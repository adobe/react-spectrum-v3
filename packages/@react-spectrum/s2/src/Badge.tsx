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

import {AriaLabelingProps, DOMProps, DOMRef, DOMRefValue} from '@react-types/shared';
import {centerBaseline} from './CenterBaseline';
import {centerPadding, getAllowedOverrides, StyleProps} from './style-utils' with {type: 'macro'};
import {ContextValue, Provider, TextContext as RACTextContext, SlotProps} from 'react-aria-components';
import {filterDOMProps} from '@react-aria/utils';
import {fontRelative, lightDark, style} from '../style' with {type: 'macro'};
import {IconContext} from './Icon';
import React, {createContext, forwardRef, ReactNode} from 'react';
import {SkeletonWrapper} from './Skeleton';
import {Text, TextContext} from './Content';
import {useDOMRef} from '@react-spectrum/utils';
import {useSpectrumContextProps} from './useSpectrumContextProps';

export interface BadgeStyleProps {
  /**
   * The size of the badge.
   *
   * @default 'S'
   */
  size?: 'S' | 'M' | 'L' | 'XL',
  /**
   * The variant changes the background color of the badge. When badge has a semantic meaning, they should use the variant for semantic colors.
   *
   * @default 'neutral'
   */
  variant?: 'accent' | 'informative' | 'neutral' | 'positive' | 'notice' | 'negative' | 'gray' | 'red' | 'orange' | 'yellow' | 'chartreuse' | 'celery' | 'green' | 'seafoam' | 'cyan' | 'blue' | 'indigo' | 'purple' | 'fuchsia' | 'magenta' | 'pink' | 'turquoise' | 'brown' | 'cinnamon' | 'silver',
  /**
   * The fill of the badge.
   * @default 'bold'
   */
  fillStyle?: 'bold' | 'subtle' | 'outline',
  /**
   * Sets the text behavior for the contents.
   * @default 'wrap'
   */
  overflowMode?: 'wrap' | 'truncate'
}

export interface BadgeProps extends DOMProps, AriaLabelingProps, StyleProps, BadgeStyleProps, SlotProps {
  /**
   * The content to display in the badge.
   */
  children: ReactNode
}

export const BadgeContext = createContext<ContextValue<Partial<BadgeProps>, DOMRefValue<HTMLDivElement>>>(null);

const badge = style<BadgeStyleProps>({
  display: 'flex',
  font: 'control',
  justifyContent: 'center',
  alignItems: {
    default: 'baseline',
    ':has([slot=icon]:only-child)': 'center'
  },
  borderRadius: 'control',
  minHeight: 'control',
  paddingX: {
    default: 'edge-to-text',
    ':has([slot=icon]:only-child)': 0
  },
  '--labelPadding': {
    type: 'paddingTop',
    value: centerPadding()
  },
  aspectRatio: {
    ':has([slot=icon]:only-child)': 'square'
  },
  '--iconMargin': {
    type: 'marginTop',
    value: {
      default: fontRelative(-2),
      ':has([slot=icon]:only-child)': 0
    }
  },
  columnGap: 'text-to-visual',
  color: {
    fillStyle: {
      bold: {
        default: 'white',
        variant: {
          notice: 'black',
          orange: 'black',
          yellow: 'black',
          chartreuse: 'black',
          celery: 'black'
        }
      },
      subtle: 'gray-1000',
      outline: 'gray-1000'
    }
  },
  backgroundColor: {
    fillStyle: {
      bold: {
        variant: {
          accent: 'accent',
          informative: 'informative',
          neutral: 'neutral-subdued',
          positive: 'positive',
          notice: 'notice',
          negative: 'negative',
          gray: 'gray',
          red: 'red',
          orange: 'orange',
          yellow: 'yellow',
          chartreuse: 'chartreuse',
          celery: 'celery',
          green: 'green',
          seafoam: 'seafoam',
          cyan: 'cyan',
          blue: 'blue',
          indigo: 'indigo',
          purple: 'purple',
          fuchsia: 'fuchsia',
          magenta: 'magenta',
          pink: 'pink',
          turquoise: 'turquoise',
          brown: 'brown',
          cinnamon: 'cinnamon',
          silver: 'silver'
        }
      },
      subtle: {
        variant: {
          accent: 'accent-subtle',
          informative: 'informative-subtle',
          neutral: 'neutral-subtle',
          positive: 'positive-subtle',
          notice: 'notice-subtle',
          negative: 'negative-subtle',
          gray: 'gray-subtle',
          red: 'red-subtle',
          orange: 'orange-subtle',
          yellow: 'yellow-subtle',
          chartreuse: 'chartreuse-subtle',
          celery: 'celery-subtle',
          green: 'green-subtle',
          seafoam: 'seafoam-subtle',
          cyan: 'cyan-subtle',
          blue: 'blue-subtle',
          indigo: 'indigo-subtle',
          purple: 'purple-subtle',
          fuchsia: 'fuchsia-subtle',
          magenta: 'magenta-subtle',
          pink: 'pink-subtle',
          turquoise: 'turquoise-subtle',
          brown: 'brown-subtle',
          cinnamon: 'cinnamon-subtle',
          silver: 'silver-subtle'
        }
      },
      outline: 'layer-2'
    }
  },
  borderStyle: 'solid',
  boxSizing: 'border-box',
  borderWidth: 2,
  borderColor: {
    default: 'transparent',
    fillStyle: {
      outline: {
        variant: {
          accent: lightDark('accent-800', 'accent-900'), // accent-visual-color
          informative: lightDark('informative-800', 'informative-900'), // informative-visual-color
          neutral: lightDark('gray-500', 'gray-600'), // neutral-visual-color
          positive: lightDark('positive-800', 'positive-900'), // positive-visual-color
          notice: lightDark('notice-800', 'notice-900'), // notice-visual-color
          negative: lightDark('negative-800', 'negative-900') // negative-visual-color
        }
      }
    }
  },
  '--iconPrimary': {
    type: 'fill',
    value: 'currentColor'
  }
}, getAllowedOverrides());

/**
 * Badges are used for showing a small amount of color-categorized metadata, ideal for getting a user's attention.
 */
export const Badge = forwardRef(function Badge(props: BadgeProps, ref: DOMRef<HTMLDivElement>) {
  [props, ref] = useSpectrumContextProps(props, ref, BadgeContext);
  let {
    children,
    variant = 'neutral',
    size = 'S',
    fillStyle = 'bold',
    overflowMode = 'wrap',
    ...otherProps
  } = props; // useProviderProps(props) in v3
  let domRef = useDOMRef(ref);
  let isTextOnly = React.Children.toArray(props.children).every(c => !React.isValidElement(c));

  return (
    <Provider
      values={[
        [TextContext, {
          styles: style({
            paddingY: '--labelPadding',
            order: 1,
            overflowX: 'hidden',
            overflowY: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: {overflowMode: {truncate: 'nowrap', wrap: 'normal'}}
          })({overflowMode})
        }],
        [RACTextContext, {}],
        [IconContext, {
          render: centerBaseline({slot: 'icon', styles: style({order: 0})}),
          styles: style({size: fontRelative(20), marginStart: '--iconMargin', flexShrink: 0})
        }]
      ]}>
      <SkeletonWrapper>
        <span
          {...filterDOMProps(otherProps)}
          role="presentation"
          className={(props.UNSAFE_className || '') + badge({variant, size, fillStyle}, props.styles)}
          style={props.UNSAFE_style}
          ref={domRef}>
          {
            typeof children === 'string' || isTextOnly
              ? <Text>{children}</Text>
              : children
          }
        </span>
      </SkeletonWrapper>
    </Provider>
  );
});
