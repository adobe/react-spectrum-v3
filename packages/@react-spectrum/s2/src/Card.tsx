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

import {ActionMenuContext} from './ActionMenu';
import {AvatarContext} from './Avatar';
import {ButtonContext, LinkButtonContext} from './Button';
import {Checkbox} from './Checkbox';
import {colorToken} from '../style/tokens' with {type: 'macro'};
import {composeRenderProps, ContextValue, DEFAULT_SLOT, type GridListItem, GridListItemProps, Provider} from 'react-aria-components';
import {ContentContext, FooterContext, TextContext} from './Content';
import {createContext, CSSProperties, forwardRef, ReactNode, useContext} from 'react';
import {DividerContext} from './Divider';
import {DOMProps, DOMRef, DOMRefValue} from '@react-types/shared';
import {filterDOMProps, inertValue} from '@react-aria/utils';
import {focusRing, lightDark, space, style} from '../style' with {type: 'macro'};
import {getAllowedOverrides, StyleProps, UnsafeStyles} from './style-utils' with {type: 'macro'};
import {IllustrationContext} from './Icon';
import {ImageContext} from './Image';
import {ImageCoordinator} from './ImageCoordinator';
import {mergeStyles} from '../style/runtime';
import {pressScale} from './pressScale';
import {SkeletonContext, SkeletonWrapper, useIsSkeleton} from './Skeleton';
import {useDOMRef} from '@react-spectrum/utils';
import {useSpectrumContextProps} from './useSpectrumContextProps';

interface CardRenderProps {
  /** The size of the Card. */
  size: 'XS' | 'S' | 'M' | 'L' | 'XL'
}

export interface CardProps extends Omit<GridListItemProps, 'className' | 'style' | 'children' | 'onHoverChange' | 'onHoverStart' | 'onHoverEnd'>, StyleProps {
  /** The children of the Card. */
  children: ReactNode | ((renderProps: CardRenderProps) => ReactNode),
  /**
   * The size of the Card.
   * @default 'M'
   */
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL',
  /**
   * The amount of internal padding within the Card.
   * @default 'regular'
   */
  density?: 'compact' | 'regular' | 'spacious',
  /**
   * The visual style of the Card.
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'quiet'
}

const borderRadius = {
  default: 'lg',
  size: {
    XS: 'default',
    S: 'default'
  }
} as const;

let card = style({
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  borderRadius,
  '--s2-container-bg': {
    type: 'backgroundColor',
    value: {
      variant: {
        primary: 'elevated',
        secondary: 'layer-1'
      },
      forcedColors: 'ButtonFace'
    }
  },
  backgroundColor: {
    default: '--s2-container-bg',
    variant: {
      tertiary: 'transparent',
      quiet: 'transparent'
    }
  },
  boxShadow: {
    default: 'emphasized',
    isHovered: 'elevated',
    isFocusVisible: 'elevated',
    isSelected: 'elevated',
    forcedColors: '[0 0 0 1px ButtonBorder]',
    variant: {
      tertiary: {
        // Render border with box-shadow to avoid affecting layout.
        default: `[0 0 0 1px ${colorToken('gray-100')}]`,
        isHovered: `[0 0 0 1px ${colorToken('gray-200')}]`,
        isFocusVisible: `[0 0 0 1px ${colorToken('gray-200')}]`,
        isSelected: 'none',
        forcedColors: '[0 0 0 1px ButtonBorder]'
      },
      quiet: 'none'
    }
  },
  forcedColorAdjust: 'none',
  transition: 'default',
  fontFamily: 'sans',
  overflow: {
    default: 'clip',
    variant: {
      quiet: 'visible'
    }
  },
  contain: 'layout',
  disableTapHighlight: true,
  userSelect: {
    isCardView: 'none'
  },
  cursor: {
    isLink: 'pointer'
  },
  width: {
    size: {
      XS: 112,
      S: 192,
      M: 240,
      L: 320,
      XL: 400
    },
    isCardView: 'full'
  },
  height: 'full',
  '--card-spacing': {
    type: 'paddingTop',
    value: {
      density: {
        compact: {
          size: {
            XS: 6,
            S: 8,
            M: 12,
            L: 16,
            XL: 20
          }
        },
        regular: {
          size: {
            XS: 8,
            S: 12,
            M: 16,
            L: 20,
            XL: 24
          }
        },
        spacious: {
          size: {
            XS: 12,
            S: 16,
            M: 20,
            L: 24,
            XL: 28
          }
        }
      }
    }
  },
  '--card-padding-y': {
    type: 'paddingTop',
    value: {
      default: '--card-spacing',
      variant: {
        quiet: 0
      }
    }
  },
  '--card-padding-x': {
    type: 'paddingStart',
    value: {
      default: '--card-spacing',
      variant: {
        quiet: 0
      }
    }
  },
  paddingY: '--card-padding-y',
  paddingX: '--card-padding-x',
  boxSizing: 'border-box',
  ...focusRing(),
  outlineStyle: {
    default: 'none',
    isFocusVisible: 'solid',
    // Focus ring moves to preview when quiet.
    variant: {
      quiet: 'none'
    }
  }
}, getAllowedOverrides());

let selectionIndicator = style({
  position: 'absolute',
  inset: 0,
  zIndex: 2,
  borderRadius,
  pointerEvents: 'none',
  borderWidth: 2,
  borderStyle: 'solid',
  borderColor: 'gray-1000',
  transition: 'default',
  opacity: {
    default: 0,
    isSelected: 1
  },
  // Quiet cards with no checkbox have an extra inner stroke
  // to distinguish the selection indicator from the preview.
  outlineColor: lightDark('transparent-white-600', 'transparent-black-600'),
  outlineOffset: -4,
  outlineStyle: {
    default: 'none',
    isStrokeInner: 'solid'
  },
  outlineWidth: 2
});

let preview = style({
  position: 'relative',
  transition: 'default',
  overflow: 'clip',
  marginX: '[calc(var(--card-padding-x) * -1)]',
  marginTop: '[calc(var(--card-padding-y) * -1)]',
  marginBottom: {
    ':last-child': '[calc(var(--card-padding-y) * -1)]'
  },
  borderRadius: {
    isQuiet: borderRadius
  },
  boxShadow: {
    isQuiet: {
      isHovered: 'elevated',
      isFocusVisible: 'elevated',
      isSelected: 'elevated'
    }
  },
  ...focusRing(),
  outlineStyle: {
    default: 'none',
    isQuiet: {
      isFocusVisible: 'solid'
    }
  }
});

const image = style({
  width: 'full',
  aspectRatio: '[3/2]',
  objectFit: 'cover',
  userSelect: 'none',
  pointerEvents: 'none'
});

let title = style({
  font: 'title',
  fontSize: {
    size: {
      XS: 'title-xs',
      S: 'title-xs',
      M: 'title-sm',
      L: 'title',
      XL: 'title-lg'
    }
  },
  lineClamp: 3,
  gridArea: 'title'
});

let description = style({
  font: 'body',
  fontSize: {
    size: {
      XS: 'body-2xs',
      S: 'body-2xs',
      M: 'body-xs',
      L: 'body-sm',
      XL: 'body'
    }
  },
  lineClamp: 3,
  gridArea: 'description'
});

let content = style({
  display: 'grid',
  // By default, all elements are displayed in a stack.
  // If an action menu is present, place it next to the title.
  gridTemplateColumns: {
    default: ['1fr'],
    ':has([data-slot=menu])': ['minmax(0, 1fr)', 'auto']
  },
  gridTemplateAreas: {
    default: [
      'title',
      'description'
    ],
    ':has([data-slot=menu])': [
      'title menu',
      'description description'
    ]
  },
  columnGap: 4,
  flexGrow: 1,
  alignItems: 'baseline',
  alignContent: 'space-between',
  rowGap: {
    size: {
      XS: 4,
      S: 4,
      M: space(6),
      L: space(6),
      XL: 8
    }
  },
  paddingTop: {
    default: '--card-spacing',
    ':first-child': 0
  },
  paddingBottom: {
    default: '[calc(var(--card-spacing) * 1.5 / 2)]',
    ':last-child': 0
  }
});

let actionMenu = style({
  gridArea: 'menu',
  // Don't cause the row to expand, preserve gap between title and description text.
  // Would use -100% here but it doesn't work in Firefox.
  marginY: '[calc(-1 * self(height))]'
});

let footer = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'end',
  justifyContent: 'space-between',
  gap: 8,
  paddingTop: '[calc(var(--card-spacing) * 1.5 / 2)]'
});

export const InternalCardViewContext = createContext<'div' | typeof GridListItem>('div');
export const CardContext = createContext<ContextValue<Partial<CardProps>, DOMRefValue<HTMLDivElement>>>(null);

interface InternalCardContextValue {
  isQuiet: boolean,
  size: 'XS' | 'S' | 'M' | 'L' | 'XL',
  isSelected: boolean,
  isHovered: boolean,
  isFocusVisible: boolean,
  isPressed: boolean,
  isCheckboxSelection: boolean
}

const InternalCardContext = createContext<InternalCardContextValue>({
  isQuiet: false,
  size: 'M',
  isSelected: false,
  isHovered: false,
  isFocusVisible: false,
  isPressed: false,
  isCheckboxSelection: true
});

const actionButtonSize = {
  XS: 'XS',
  S: 'XS',
  M: 'S',
  L: 'M',
  XL: 'L'
} as const;

export const Card = forwardRef(function Card(props: CardProps, ref: DOMRef<HTMLDivElement>) {
  [props] = useSpectrumContextProps(props, ref, CardContext);
  let domRef = useDOMRef(ref);
  let {density = 'regular', size = 'M', variant = 'primary', UNSAFE_className = '', UNSAFE_style, styles, id, ...otherProps} = props;
  let isQuiet = variant === 'quiet';
  let isSkeleton = useIsSkeleton();
  let children = (
    <Provider
      values={[
        [ImageContext, {alt: '', styles: image}],
        [TextContext, {
          slots: {
            [DEFAULT_SLOT]: {},
            title: {styles: title({size})},
            description: {styles: description({size})}
          }
        }],
        [ContentContext, {styles: content({size})}],
        [DividerContext, {size: 'S'}],
        [FooterContext, {styles: footer}],
        [ActionMenuContext, {
          isQuiet: true,
          size: actionButtonSize[size],
          isDisabled: isSkeleton,
          // @ts-ignore
          'data-slot': 'menu',
          styles: actionMenu
        }],
        [SkeletonContext, isSkeleton]
      ]}>
      <ImageCoordinator>
        {typeof props.children === 'function' ? props.children({size}) : props.children}
      </ImageCoordinator>
    </Provider>
  );

  let ElementType = useContext(InternalCardViewContext);
  if (ElementType === 'div' || isSkeleton) {
    return (
      <div
        {...filterDOMProps(otherProps)}
        id={id != null ? String(id) : undefined}
        // @ts-ignore - React < 19 compat
        inert={inertValue(isSkeleton)}
        ref={domRef}
        className={UNSAFE_className + card({size, density, variant, isCardView: ElementType !== 'div'}, styles)}
        style={UNSAFE_style}>
        <InternalCardContext.Provider value={{size, isQuiet, isCheckboxSelection: false, isHovered: false, isFocusVisible: false, isSelected: false, isPressed: false}}>
          {children}
        </InternalCardContext.Provider>
      </div>
    );
  }

  let press = pressScale(domRef, UNSAFE_style);
  return (
    <ElementType
      {...props}
      ref={domRef}
      className={renderProps => UNSAFE_className + card({...renderProps, isCardView: true, isLink: !!props.href, size, density, variant}, styles)}
      style={renderProps =>
        // Only the preview in quiet cards scales down on press
        variant === 'quiet' ? UNSAFE_style : press(renderProps)
      }>
      {({selectionMode, selectionBehavior, isHovered, isFocusVisible, isSelected, isPressed}) => (
        <InternalCardContext.Provider value={{size, isQuiet, isCheckboxSelection: selectionMode !== 'none' && selectionBehavior === 'toggle', isHovered, isFocusVisible, isSelected, isPressed}}>
          {/* Selection indicator and checkbox move inside the preview for quiet cards */}
          {!isQuiet && <SelectionIndicator />}
          {!isQuiet && selectionMode !== 'none' && selectionBehavior === 'toggle' &&
            <CardCheckbox />
          }
          {/* this makes the :first-child selector work even with the checkbox */}
          <div className={style({display: 'contents'})}>
            {children}
          </div>
        </InternalCardContext.Provider>
      )}
    </ElementType>
  );
});

function SelectionIndicator() {
  let {size, isSelected, isQuiet, isCheckboxSelection} = useContext(InternalCardContext);
  return (
    <div
      className={selectionIndicator({
        size,
        isSelected,
        // Add an inner stroke only for quiet cards with no checkbox to
        // help distinguish the selected state from the preview.
        isStrokeInner: isQuiet && !isCheckboxSelection
      })} />
  );
}

function CardCheckbox() {
  let {size} = useContext(InternalCardContext);
  return (
    <div
      className={style({
        position: 'absolute',
        top: '--card-spacing',
        insetStart: '--card-spacing',
        zIndex: 2,
        padding: 4,
        backgroundColor: lightDark('transparent-white-600', 'transparent-black-600'),
        borderRadius: 'default',
        boxShadow: 'emphasized'
      })}>
      <Checkbox
        slot="selection"
        excludeFromTabOrder
        size={size === 'XS' ? 'S' : size} />
    </div>
  );
}

export interface CardPreviewProps extends UnsafeStyles, DOMProps {
  children: ReactNode
}

export const CardPreview = forwardRef(function CardPreview(props: CardPreviewProps, ref: DOMRef<HTMLDivElement>) {
  let {size, isQuiet, isHovered, isFocusVisible, isSelected, isPressed, isCheckboxSelection} = useContext(InternalCardContext);
  let {UNSAFE_className, UNSAFE_style} = props;
  let domRef = useDOMRef(ref);
  return (
    <div
      {...filterDOMProps(props)}
      slot="preview"
      ref={domRef}
      className={UNSAFE_className + preview({size, isQuiet, isHovered, isFocusVisible, isSelected})}
      style={isQuiet ? pressScale(domRef)({isPressed}) : UNSAFE_style}>
      {isQuiet && <SelectionIndicator />}
      {isQuiet && isCheckboxSelection && <CardCheckbox />}
      <div className={style({borderRadius: '[inherit]', overflow: 'clip'})}>
        {props.children}
      </div>
    </div>
  );
});

const collection = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: {
    default: 4,
    size: {
      XS: 2,
      S: 2
    }
  }
});

const collectionImage = style({
  width: 'full',
  aspectRatio: {
    default: 'square',
    ':nth-last-child(4):first-child': '[3/2]'
  },
  gridColumnEnd: {
    ':nth-last-child(4):first-child': 'span 3'
  },
  objectFit: 'cover',
  pointerEvents: 'none',
  userSelect: 'none'
});

export const CollectionCardPreview = forwardRef(function CollectionCardPreview(props: CardPreviewProps, ref: DOMRef<HTMLDivElement>) {
  let {size} = useContext(InternalCardContext)!;
  return (
    <CardPreview {...props} ref={ref}>
      <div className={collection({size})}>
        <ImageContext.Provider value={{styles: collectionImage}}>
          {props.children}
        </ImageContext.Provider>
      </div>
    </CardPreview>
  );
});

export interface AssetCardProps extends Omit<CardProps, 'density'> {}

export const AssetCard = forwardRef(function AssetCard(props: AssetCardProps, ref: DOMRef<HTMLDivElement>) {
  return (
    <Card {...props} ref={ref} density="regular">
      {composeRenderProps(props.children, children => (
        <Provider
          values={[
            [ImageContext, {
              alt: '',
              styles: style({
                width: 'full',
                aspectRatio: 'square',
                objectFit: 'contain',
                pointerEvents: 'none',
                userSelect: 'none'
              })
            }],
            [IllustrationContext, {
              render(icon) {
                return (
                  <SkeletonWrapper>
                    <div
                      className={style({
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'gray-100',
                        aspectRatio: 'square'
                      })}>
                      {icon}
                    </div>
                  </SkeletonWrapper>
                );
              },
              styles: style({
                height: 'auto',
                maxSize: 160,
                // TODO: this is made up.
                width: '[50%]'
              })
            }]
          ]}>
          {children}
        </Provider>
      ))}
    </Card>
  );
});

const avatarSize = {
  XS: 24,
  S: 48,
  M: 64,
  L: 64,
  XL: 80
} as const;

export interface UserCardProps extends Omit<CardProps, 'density' | 'variant'> {
  // Quiet is not supported due to lack of indent between preview and avatar.
  variant?: 'primary' | 'secondary' | 'tertiary'
}

export const UserCard = forwardRef(function UserCard(props: CardProps, ref: DOMRef<HTMLDivElement>) {
  let {size = 'M'} = props;
  return (
    <Card {...props} ref={ref} density="spacious">
      {composeRenderProps(props.children, children => (
        <Provider
          values={[
            [ImageContext, {
              alt: '',
              styles: style({
                width: 'full',
                aspectRatio: '[3/1]',
                objectFit: 'cover',
                pointerEvents: 'none',
                userSelect: 'none'
              })
            }],
            [AvatarContext, {
              size: avatarSize[size],
              UNSAFE_style: {
                '--size': avatarSize[size] + 'px'
              } as CSSProperties,
              styles: style({
                position: 'relative',
                marginTop: {
                  default: 0,
                  ':is([slot=preview] + &)': '[calc(var(--size) / -2)]'
                }
              }),
              isOverBackground: true
            }]
          ]}>
          {children}
        </Provider>
      ))}
    </Card>
  );
});

const buttonSize = {
  XS: 'S',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL'
} as const;

export interface ProductCardProps extends Omit<CardProps, 'density' | 'variant'> {
  // Quiet is not supported due to lack of indent between preview and thumbnail.
  variant?: 'primary' | 'secondary' | 'tertiary'
}

export const ProductCard = forwardRef(function ProductCard(props: ProductCardProps, ref: DOMRef<HTMLDivElement>) {
  let {size = 'M'} = props;
  return (
    <Card {...props} ref={ref} density="spacious">
      {composeRenderProps(props.children, children => (
        <Provider
          values={[
            [ImageContext, {
              slots: {
                preview: {
                  alt: '',
                  styles: style({
                    width: 'full',
                    aspectRatio: '[5/1]',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  })
                },
                thumbnail: {
                  alt: '',
                  styles: style({
                    position: 'relative',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    size: {
                      size: {
                        XS: 24,
                        S: 36,
                        M: 40,
                        L: 44,
                        XL: 56
                      }
                    },
                    borderRadius: {
                      default: 'default',
                      size: {
                        XS: 'sm',
                        S: 'sm'
                      }
                    },
                    objectFit: 'cover',
                    marginTop: {
                      default: 0,
                      ':is([slot=preview] + &)': '[calc(self(height) / -2)]'
                    },
                    outlineStyle: 'solid',
                    outlineWidth: {
                      default: 2,
                      size: {
                        XS: 1
                      }
                    },
                    outlineColor: '--s2-container-bg'
                  })({size})
                }
              }
            }],
            [FooterContext, {
              styles: mergeStyles(footer, style({
                justifyContent: 'end'
              }))
            }],
            [ButtonContext, {size: buttonSize[size]}],
            [LinkButtonContext, {size: buttonSize[size]}]
          ]}>
          {children}
        </Provider>
      ))}
    </Card>
  );
});
