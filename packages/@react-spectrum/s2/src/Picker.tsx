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

import {
  ListBoxSection as AriaListBoxSection,
  PopoverProps as AriaPopoverProps,
  Select as AriaSelect,
  SelectProps as AriaSelectProps,
  SelectRenderProps as AriaSelectRenderProps,
  Button,
  ButtonRenderProps,
  ContextValue,
  ListBox,
  ListBoxItem,
  ListBoxItemProps,
  ListBoxProps,
  Provider,
  SectionProps,
  SelectValue
} from 'react-aria-components';
import {baseColor, edgeToText, focusRing, style} from '../style' with {type: 'macro'};
import {centerBaseline} from './CenterBaseline';
import {
  checkmark,
  description,
  Divider,
  icon,
  iconCenterWrapper,
  label,
  menuitem,
  section,
  sectionHeader,
  sectionHeading
} from './Menu';
import CheckmarkIcon from '../ui-icons/Checkmark';
import ChevronIcon from '../ui-icons/Chevron';
import {field, fieldInput, getAllowedOverrides, StyleProps} from './style-utils' with {type: 'macro'};
import {
  FieldErrorIcon,
  FieldLabel,
  HelpText
} from './Field';
import {FocusableRef, FocusableRefValue, HelpTextProps, SpectrumLabelableProps} from '@react-types/shared';
import {FormContext, useFormProps} from './Form';
import {forwardRefType} from './types';
import {HeaderContext, HeadingContext, Text, TextContext} from './Content';
import {IconContext} from './Icon';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {Placement} from 'react-aria';
import {PopoverBase} from './Popover';
import {pressScale} from './pressScale';
import {raw} from '../style/style-macro' with {type: 'macro'};
import React, {createContext, forwardRef, ReactNode, useContext, useRef} from 'react';
import {useFocusableRef} from '@react-spectrum/utils';
import {useLocalizedStringFormatter} from '@react-aria/i18n';
import {useSpectrumContextProps} from './useSpectrumContextProps';


export interface PickerStyleProps {
  /**
   * The size of the Picker.
   *
   * @default 'M'
   */
  size?: 'S' | 'M' | 'L' | 'XL',
  /**
   * Whether the picker should be displayed with a quiet style.
   * @private
   */
  isQuiet?: boolean
}

export interface PickerProps<T extends object> extends
  Omit<AriaSelectProps<T>, 'children' | 'style' | 'className'>,
  PickerStyleProps,
  StyleProps,
  SpectrumLabelableProps,
  HelpTextProps,
  Pick<ListBoxProps<T>, 'items'>,
  Pick<AriaPopoverProps, 'shouldFlip'> {
    /** The contents of the collection. */
    children: ReactNode | ((item: T) => ReactNode),
    /**
     * Direction the menu will render relative to the Picker.
     *
     * @default 'bottom'
     */
    direction?: 'bottom' | 'top',
    /**
     * Alignment of the menu relative to the input target.
     *
     * @default 'start'
     */
    align?: 'start' | 'end',
    /** Width of the menu. By default, matches width of the trigger. Note that the minimum width of the dropdown is always equal to the trigger's width. */
    menuWidth?: number
}

interface PickerButtonProps extends PickerStyleProps, ButtonRenderProps {}

export const PickerContext = createContext<ContextValue<Partial<PickerProps<any>>, FocusableRefValue<HTMLButtonElement>>>(null);

const inputButton = style<PickerButtonProps | AriaSelectRenderProps>({
  ...focusRing(),
  ...fieldInput(),
  outlineStyle: {
    default: 'none',
    isFocusVisible: 'solid',
    isQuiet: 'none'
  },
  position: 'relative',
  font: 'control',
  display: 'flex',
  textAlign: 'start',
  borderStyle: {
    default: 'none',
    forcedColors: 'solid'
  },
  borderColor: {
    forcedColors: {
      default: 'ButtonText',
      isDisabled: 'GrayText'
    }
  },
  borderRadius: 'control',
  alignItems: 'center',
  height: 'control',
  transition: 'default',
  columnGap: {
    default: 'text-to-control',
    isQuiet: 'text-to-visual'
  },
  paddingX: {
    default: 'edge-to-text',
    isQuiet: 0
  },
  backgroundColor: {
    default: baseColor('gray-100'),
    isOpen: 'gray-200',
    isDisabled: 'disabled',
    isQuiet: 'transparent'
  },
  color: {
    default: 'neutral',
    isDisabled: 'disabled'
  },
  maxWidth: {
    isQuiet: 'max'
  },
  disableTapHighlight: true
});

const quietFocusLine = style({
  width: 'full',
  // Use pixels since we are emulating a border.
  height: '[2px]',
  position: 'absolute',
  bottom: 0,
  borderRadius: 'full',
  backgroundColor: {
    default: 'blue-800',
    forcedColors: 'Highlight'
  }
});

export let menu = style({
  outlineStyle: 'none',
  display: 'grid',
  width: 'full',
  gridTemplateColumns: {
    size: {
      S: [edgeToText(24), 'auto', 'auto', 'minmax(0, 1fr)', 'auto', 'auto', 'auto', edgeToText(24)],
      M: [edgeToText(32), 'auto', 'auto', 'minmax(0, 1fr)', 'auto', 'auto', 'auto', edgeToText(32)],
      L: [edgeToText(40), 'auto', 'auto', 'minmax(0, 1fr)', 'auto', 'auto', 'auto', edgeToText(40)],
      XL: [edgeToText(48), 'auto', 'auto', 'minmax(0, 1fr)', 'auto', 'auto', 'auto', edgeToText(48)]
    }
  },
  boxSizing: 'border-box',
  maxHeight: '[inherit]',
  overflow: 'auto',
  padding: 8,
  fontFamily: 'sans',
  fontSize: 'control'
});

const invalidBorder = style({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  pointerEvents: 'none',
  borderRadius: 'control',
  borderStyle: 'solid',
  borderWidth: 2,
  borderColor: 'negative',
  transition: 'default'
});

const valueStyles = style({
  flexGrow: {
    default: 1,
    isQuiet: 0
  },
  truncate: true,
  display: 'flex',
  alignItems: 'center'
});

const iconStyles = style({
  flexShrink: 0,
  rotate: 90,
  '--iconPrimary': {
    type: 'fill',
    value: 'currentColor'
  }
});

let InternalPickerContext = createContext<{size: 'S' | 'M' | 'L' | 'XL'}>({size: 'M'});
let InsideSelectValueContext = createContext(false);

/**
 * Pickers allow users to choose a single option from a collapsible list of options when space is limited.
 */
export const Picker = /*#__PURE__*/ (forwardRef as forwardRefType)(function Picker<T extends object>(props: PickerProps<T>, ref: FocusableRef<HTMLButtonElement>) {
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/s2');
  [props, ref] = useSpectrumContextProps(props, ref, PickerContext);
  let domRef = useFocusableRef(ref);
  let formContext = useContext(FormContext);
  props = useFormProps(props);
  let {
    direction = 'bottom',
    align = 'start',
    shouldFlip = true,
    menuWidth,
    label,
    description: descriptionMessage,
    errorMessage,
    children,
    items,
    size = 'M',
    labelPosition = 'top',
    labelAlign = 'start',
    necessityIndicator,
    UNSAFE_className = '',
    UNSAFE_style,
    placeholder = stringFormatter.format('picker.placeholder'),
    isQuiet,
    ...pickerProps
  } = props;

  // Better way to encode this into a style? need to account for flipping
  let menuOffset: number;
  if (size === 'S') {
    menuOffset = 6;
  } else if (size === 'M') {
    menuOffset = 6;
  } else if (size === 'L') {
    menuOffset = 7;
  } else {
    menuOffset = 8;
  }

  return (
    <AriaSelect
      {...pickerProps}
      placeholder={placeholder}
      style={UNSAFE_style}
      className={UNSAFE_className + style(field(), getAllowedOverrides())({
        isInForm: !!formContext,
        labelPosition,
        size
      }, props.styles)}>
      {({isDisabled, isOpen, isFocusVisible, isInvalid, isRequired}) => (
        <>
          <InternalPickerContext.Provider value={{size}}>
            <FieldLabel
              isDisabled={isDisabled}
              isRequired={isRequired}
              size={size}
              labelPosition={labelPosition}
              labelAlign={labelAlign}
              isQuiet={isQuiet}
              necessityIndicator={necessityIndicator}
              contextualHelp={props.contextualHelp}>
              {label}
            </FieldLabel>
            <Button
              ref={domRef}
              style={renderProps => pressScale(domRef)(renderProps)}
              // Prevent press scale from sticking while Picker is open.
              // @ts-ignore
              isPressed={false}
              className={renderProps => inputButton({
                ...renderProps,
                size: size,
                isOpen,
                isQuiet
              })}>
              {(renderProps) => (
                <>
                  <SelectValue className={valueStyles({isQuiet}) + ' ' + raw('&> * {display: none;}')}>
                    {({defaultChildren}) => {
                      return (
                        <Provider
                          values={[
                            [IconContext, {
                              slots: {
                                icon: {
                                  render: centerBaseline({slot: 'icon', styles: iconCenterWrapper}),
                                  styles: icon
                                }
                              }
                            }],
                            [TextContext, {
                              slots: {
                                description: {},
                                label: {styles: style({
                                  display: 'block',
                                  flexGrow: 1,
                                  truncate: true
                                })}
                              }
                            }],
                            [InsideSelectValueContext, true]
                          ]}>
                          {defaultChildren}
                        </Provider>
                      );
                    }}
                  </SelectValue>
                  {isInvalid && (
                    <FieldErrorIcon isDisabled={isDisabled} />
                  )}
                  <ChevronIcon
                    size={size}
                    className={iconStyles} />
                  {isFocusVisible && isQuiet && <span className={quietFocusLine} /> }
                  {isInvalid && !isDisabled && !isQuiet &&
                    // @ts-ignore known limitation detecting functions from the theme
                    <div className={invalidBorder({...renderProps, size})} />
                  }
                </>
              )}
            </Button>
            <HelpText
              size={size}
              isDisabled={isDisabled}
              isInvalid={isInvalid}
              description={descriptionMessage}>
              {errorMessage}
            </HelpText>
            <PopoverBase
              hideArrow
              offset={menuOffset}
              placement={`${direction} ${align}` as Placement}
              shouldFlip={shouldFlip}
              UNSAFE_style={{
                width: menuWidth && !isQuiet ? `${menuWidth}px` : undefined
              }}
              styles={style({
                marginStart: {
                  isQuiet: -12
                },
                minWidth: {
                  default: '[var(--trigger-width)]',
                  isQuiet: 192
                },
                width: {
                  default: '[var(--trigger-width)]',
                  isQuiet: '[calc(var(--trigger-width) + (-2 * self(marginStart)))]'
                }
              })(props)}>
              <Provider
                values={[
                  [HeaderContext, {styles: sectionHeader({size})}],
                  [HeadingContext, {styles: sectionHeading}],
                  [TextContext, {
                    slots: {
                      description: {styles: description({size})}
                    }
                  }]
                ]}>
                <ListBox
                  items={items}
                  className={menu({size})}>
                  {children}
                </ListBox>
              </Provider>
            </PopoverBase>
          </InternalPickerContext.Provider>
        </>
      )}
    </AriaSelect>
  );
});

export interface PickerItemProps extends Omit<ListBoxItemProps, 'children' | 'style' | 'className'>, StyleProps {
  children: ReactNode
}

const checkmarkIconSize = {
  S: 'XS',
  M: 'M',
  L: 'L',
  XL: 'XL'
} as const;

export function PickerItem(props: PickerItemProps) {
  let ref = useRef(null);
  let isLink = props.href != null;
  let {size} = useContext(InternalPickerContext);
  return (
    <ListBoxItem
      {...props}
      ref={ref}
      textValue={props.textValue || (typeof props.children === 'string' ? props.children as string : undefined)}
      style={pressScale(ref, props.UNSAFE_style)}
      className={renderProps => (props.UNSAFE_className || '') + menuitem({...renderProps, size, isLink}, props.styles)}>
      {(renderProps) => {
        let {children} = props;
        return (
          <DefaultProvider
            context={IconContext}
            value={{slots: {
              icon: {render: centerBaseline({slot: 'icon', styles: iconCenterWrapper}), styles: icon}
            }}}>
            <DefaultProvider
              context={TextContext}
              value={{
                slots: {
                  label: {styles: label({size})},
                  description: {styles: description({...renderProps, size})}
                }
              }}>
              {!isLink && <CheckmarkIcon size={checkmarkIconSize[size]} className={checkmark({...renderProps, size})} />}
              {typeof children === 'string' ? <Text slot="label">{children}</Text> : children}
            </DefaultProvider>
          </DefaultProvider>
        );
      }}
    </ListBoxItem>
  );
}

// A Context.Provider that only sets a value if not inside SelectValue.
function DefaultProvider({context, value, children}: {context: React.Context<any>, value: any, children: any}) {
  let inSelectValue = useContext(InsideSelectValueContext);
  if (inSelectValue) {
    return children;
  }

  return <context.Provider value={value}>{children}</context.Provider>;
}

export interface PickerSectionProps<T extends object> extends SectionProps<T> {}
export function PickerSection<T extends object>(props: PickerSectionProps<T>) {
  let {size} = useContext(InternalPickerContext);
  return (
    <>
      <AriaListBoxSection
        {...props}
        className={section({size})}>
        {props.children}
      </AriaListBoxSection>
      <Divider />
    </>
  );
}
