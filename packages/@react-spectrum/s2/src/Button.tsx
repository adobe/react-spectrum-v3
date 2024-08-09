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

import {baseColor, fontRelative, style} from '../style/spectrum-theme' with {type: 'macro'};
import {ButtonRenderProps, Link, LinkProps, OverlayTriggerStateContext, Provider, Button as RACButton, ButtonProps as RACButtonProps} from 'react-aria-components';
import {centerBaseline} from './CenterBaseline';
import {centerPadding, focusRing, getAllowedOverrides, StyleProps} from './style-utils' with {type: 'macro'};
import {createContext, forwardRef, ReactNode, useContext} from 'react';
import {FocusableRef} from '@react-types/shared';
import {IconContext} from './Icon';
import {mergeProps} from 'react-aria';
import {pressScale} from './pressScale';
import {Text, TextContext} from './Content';
import {useFocusableRef} from '@react-spectrum/utils';

interface ButtonStyleProps {
  /**
   * The [visual style](https://spectrum.adobe.com/page/button/#Options) of the button.
   *
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'accent' | 'negative',
  /**
   * The background style of the Button.
   *
   * @default 'fill'
   */
  fillStyle?: 'fill' | 'outline',
  /**
   * The size of the Button.
   *
   * @default 'M'
   */
  size?: 'S' | 'M' | 'L' | 'XL',
  /** The static color style to apply. Useful when the Button appears over a color background. */
  staticColor?: 'white' | 'black'
}

export interface ButtonProps extends Omit<RACButtonProps, 'className' | 'style' | 'children' | 'onHover' | 'onHoverStart' | 'onHoverEnd' | 'onHoverChange'>, StyleProps, ButtonStyleProps {
  /** The content to display in the Button. */
  children?: ReactNode
}

export interface LinkButtonProps extends Omit<LinkProps, 'className' | 'style' | 'children'>, StyleProps, ButtonStyleProps {
  /** The content to display in the Button. */
  children?: ReactNode
}

interface ButtonContextValue extends ButtonStyleProps, StyleProps {
  /** Whether the Button is disabled. */
  isDisabled?: boolean
}

export const ButtonContext = createContext<ButtonContextValue>({});

const button = style<ButtonRenderProps & ButtonStyleProps>({
  ...focusRing(),
  display: 'flex',
  alignItems: {
    default: 'baseline',
    ':has([slot=icon]:only-child)': 'center'
  },
  justifyContent: 'center',
  textAlign: 'start',
  columnGap: 'text-to-visual',
  font: 'control',
  fontWeight: 'bold',
  userSelect: 'none',
  minHeight: 'control',
  minWidth: {
    ':has([slot=icon]:only-child)': 'control'
  },
  borderRadius: 'pill',
  boxSizing: 'border-box',
  width: 'fit',
  textDecoration: 'none', // for link buttons
  paddingX: {
    default: 'pill',
    ':has([slot=icon]:only-child)': 0
  },
  paddingY: 0,
  aspectRatio: {
    ':has([slot=icon]:only-child)': 'square'
  },
  transition: 'default',
  borderStyle: 'solid',
  borderWidth: {
    fillStyle: {
      fill: 0,
      outline: 2
    }
  },
  '--labelPadding': {
    type: 'paddingTop',
    value: centerPadding()
  },
  '--iconMargin': {
    type: 'marginTop',
    value: {
      default: fontRelative(-2),
      ':has([slot=icon]:only-child)': 0
    }
  },
  borderColor: {
    variant: {
      primary: baseColor('gray-800'),
      secondary: baseColor('gray-300')
    },
    isDisabled: 'disabled',
    staticColor: {
      white: {
        variant: {
          primary: baseColor('transparent-white-800'),
          secondary: baseColor('transparent-white-300')
        },
        isDisabled: 'transparent-white-300'
      },
      black: {
        variant: {
          primary: baseColor('transparent-black-800'),
          secondary: baseColor('transparent-black-300')
        },
        isDisabled: 'transparent-black-300'
      }
    },
    forcedColors: {
      default: 'ButtonBorder',
      isHovered: 'Highlight',
      isDisabled: 'GrayText'
    }
  },
  backgroundColor: {
    fillStyle: {
      fill: {
        variant: {
          primary: 'neutral',
          secondary: baseColor('gray-100'),
          accent: 'accent',
          negative: 'negative'
        },
        isDisabled: 'disabled'
      },
      outline: {
        default: 'transparent',
        isHovered: 'gray-100',
        isPressed: 'gray-100',
        isFocusVisible: 'gray-100'
      }
    },
    staticColor: {
      white: {
        fillStyle: {
          fill: {
            variant: {
              primary: baseColor('transparent-white-800'),
              secondary: baseColor('transparent-white-100')
            },
            isDisabled: 'transparent-white-100'
          },
          outline: {
            default: 'transparent',
            isHovered: 'transparent-white-100',
            isPressed: 'transparent-white-100',
            isFocusVisible: 'transparent-white-100'
          }
        }
      },
      black: {
        fillStyle: {
          fill: {
            variant: {
              primary: baseColor('transparent-black-800'),
              secondary: baseColor('transparent-black-100')
            },
            isDisabled: 'transparent-black-100'
          },
          outline: {
            default: 'transparent',
            isHovered: 'transparent-black-100',
            isPressed: 'transparent-black-100',
            isFocusVisible: 'transparent-black-100'
          }
        }
      }
    },
    forcedColors: {
      fillStyle: {
        fill: {
          default: 'ButtonText',
          isHovered: 'Highlight',
          isDisabled: 'GrayText'
        },
        outline: 'ButtonFace'
      }
    }
  },
  color: {
    fillStyle: {
      fill: {
        variant: {
          primary: 'gray-25',
          secondary: 'neutral',
          accent: 'white',
          negative: 'white'
        },
        isDisabled: 'disabled'
      },
      outline: {
        default: 'neutral',
        isDisabled: 'disabled'
      }
    },
    staticColor: {
      white: {
        fillStyle: {
          fill: {
            variant: {
              primary: 'black',
              secondary: baseColor('transparent-white-800')
            }
          },
          outline: baseColor('transparent-white-800')
        },
        isDisabled: 'transparent-white-400'
      },
      black: {
        fillStyle: {
          fill: {
            variant: {
              primary: 'white',
              secondary: baseColor('transparent-black-800')
            }
          },
          outline: baseColor('transparent-black-800')
        },
        isDisabled: 'transparent-black-400'
      }
    },
    forcedColors: {
      fillStyle: {
        fill: {
          default: 'ButtonFace',
          isDisabled: 'HighlightText'
        },
        outline: {
          default: 'ButtonText',
          isDisabled: 'GrayText'
        }
      }
    }
  },
  '--iconPrimary': {
    type: 'fill',
    value: 'currentColor'
  },
  outlineColor: {
    default: 'focus-ring',
    staticColor: {
      white: 'white',
      black: 'black'
    },
    forcedColors: 'Highlight'
  },
  forcedColorAdjust: 'none',
  disableTapHighlight: true
}, getAllowedOverrides());

function Button(props: ButtonProps, ref: FocusableRef<HTMLButtonElement>) {
  let domRef = useFocusableRef(ref);
  let ctx = useContext(ButtonContext);
  props = mergeProps(ctx, props);
  let overlayTriggerState = useContext(OverlayTriggerStateContext);

  return (
    <RACButton
      {...props}
      ref={domRef}
      style={pressScale(domRef, props.UNSAFE_style)}
      className={renderProps => (props.UNSAFE_className || '') + button({
        ...renderProps,
        // Retain hover styles when an overlay is open.
        isHovered: renderProps.isHovered || overlayTriggerState?.isOpen || false,
        variant: props.variant || 'primary',
        fillStyle: props.fillStyle || 'fill',
        size: props.size || 'M',
        staticColor: props.staticColor
      }, props.styles)}>
      <Provider
        values={[
          [TextContext, {className: style({paddingY: '--labelPadding', order: 1})}],
          [IconContext, {
            render: centerBaseline({slot: 'icon', className: style({order: 0})}),
            styles: style({size: fontRelative(20), marginStart: '--iconMargin', flexShrink: 0})
          }]
        ]}>
        {typeof props.children === 'string' ? <Text>{props.children}</Text> : props.children}
      </Provider>
    </RACButton>
  );
}

/**
 * Buttons allow users to perform an action.
 * They have multiple styles for various needs, and are ideal for calling attention to
 * where a user needs to do something in order to move forward in a flow.
 */
let _Button = forwardRef(Button);
export {_Button as Button};

function LinkButton(props: LinkButtonProps, ref: FocusableRef<HTMLAnchorElement>) {
  let domRef = useFocusableRef(ref);
  let ctx = useContext(ButtonContext);
  props = mergeProps(ctx, props);
  let overlayTriggerState = useContext(OverlayTriggerStateContext);

  return (
    <Link
      {...props}
      ref={domRef}
      style={pressScale(domRef, props.UNSAFE_style)}
      className={renderProps => (props.UNSAFE_className || '') + button({
        ...renderProps,
        // Retain hover styles when an overlay is open.
        isHovered: renderProps.isHovered || overlayTriggerState?.isOpen || false,
        variant: props.variant || 'primary',
        fillStyle: props.fillStyle || 'fill',
        size: props.size || 'M',
        staticColor: props.staticColor
      }, props.styles)}>
      <Provider
        values={[
          [TextContext, {className: style({paddingY: '--labelPadding', order: 1})}],
          [IconContext, {
            render: centerBaseline({slot: 'icon', className: style({order: 0})}),
            styles: style({size: fontRelative(20), marginStart: '--iconMargin', flexShrink: 0})
          }]
        ]}>
        {typeof props.children === 'string' ? <Text>{props.children}</Text> : props.children}
      </Provider>
    </Link>
  );
}

/**
 * A LinkButton combines the functionality of a link with the appearance of a button. Useful for allowing users to navigate to another page.
 */
let _LinkButton = forwardRef(LinkButton);
export {_LinkButton as LinkButton};
