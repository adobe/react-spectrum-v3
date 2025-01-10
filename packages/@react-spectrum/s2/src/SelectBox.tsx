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
  Checkbox as AriaCheckbox,
  Radio as AriaRadio,
  GridListItemProps,
  Provider,
  TextContext
} from 'react-aria-components';
import {Checkbox} from './Checkbox';
import {FocusableRef} from '@react-types/shared';
import {focusRing, size, style}  from '../style' with {type: 'macro'};
import {IconContext} from './Icon';
import {Radio} from './Radio';
import React, {forwardRef, ReactNode, useRef} from 'react';
import {StyleProps}  from './style-utils' with {type: 'macro'};
import {useFocusableRef} from '@react-spectrum/utils';
import {useSelectBoxGroupProvider} from './SelectBoxGroup';

export interface SelectBoxProps extends Omit<GridListItemProps, 'className' | 'style' | 'children' | 'onHoverChange' | 'onHoverStart' | 'onHoverEnd' | 'value'>, StyleProps {
  children: ReactNode | ((renderProps: SelectBoxProps) => ReactNode),
  value: string
}

const selectBoxStyle = style({
  ...focusRing(),
  aspectRatio: {
    orientation: {
      vertical: 'square'
    }
  },
  backgroundColor: {
    default: 'white',
    isDisabled: 'disabled'
  },
  borderWidth: 2,
  borderStyle: {
    default: 'solid',
    isDisabled: 'none'
  },
  borderColor: {
    default: 'gray-25',
    isSelected: 'black'
  },
  borderRadius: 'lg',
  boxShadow: 'elevated',
  boxSizing: 'border-box',
  color: {
    default: 'neutral',
    isDisabled: 'disabled'
  },
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  maxHeight: {
    orientation: {
      horizontal: {
        size: {
          XS: size(74),
          S: size(90),
          M: size(106),
          L: size(122),
          XL: size(138)
        }
      },
      vertical: {
        size: {
          XS: size(168),
          S: size(184),
          M: size(200),
          L: size(216),
          XL: size(232)
        }
      }
    }
  },
  minHeight: {
    orientation: {
      horizontal: {
        size: {
          XS: size(74),
          S: size(90),
          M: size(106),
          L: size(122),
          XL: size(138)
        }
      },
      vertical: {
        size: {
          XS: size(100),
          S: size(128),
          M: size(144),
          L: size(160),
          XL: size(192)
        }
      }
    }
  },
  maxWidth: {
    orientation: {
      horizontal: {
        size: {
          XS: 192,
          S: size(312),
          M: size(368),
          L: size(424),
          XL: size(480)
        }
      },
      vertical: {
        size: {
          XS: size(168),
          S: size(184),
          M: size(200),
          L: size(216),
          XL: size(232)
        }
      }
    }
  },
  minWidth: {
    orientation: {
      horizontal: {
        size: {
          XS: 256,
          S: size(312),
          M: size(368),
          L: size(424),
          XL: size(480)
        }
      },
      vertical: {
        size: {
          XS: size(100),
          S: size(128),
          M: size(144),
          L: size(160),
          XL: size(192)
        }
      }
    }
  },
  outlineColor: {
    default: 'focus-ring',
    forcedColors: 'Highlight'
  },
  padding: {
    orientation: {
      horizontal: {
        size: {
          XS: 8,
          S: 12,
          M: 16,
          L: 20,
          XL: 24
        }
      }
    }
  },
  position: 'relative'
});

const selectBoxContentStyle = style({
  alignContent: 'center',
  alignItems: 'center',
  display: 'grid',
  gap: {
    orientation: {
      horizontal: {
        size: {
          S: 0,
          M: size(2)
        },
        vertical: size(8)
      }
    }
  },
  gridTemplateAreas: {
    orientation: {
      horizontal: ['icon label', 'icon description'],
      vertical: ['. icon .', '. label .']
    }
  },
  gridTemplateColumns: {
    orientation: {
      horizontal: {
        size: {
          XS: ['36px', '1fr'],
          S: ['42px', '1fr'],
          M: ['48px', '1fr'],
          L: ['54px', '1fr'],
          XL: ['60px', '1fr']
        }
      }
    }
  },
  height: 'full',
  justifyItems: {
    orientation: {
      horizontal: 'flex-start',
      vertical: 'center'
    }
  },
  paddingStart: {
    orientation: {
      horizontal: {
        size: {
          XS: 4,
          S: 8,
          M: 12,
          L: 16,
          XL: 20
        }
      },
      vertical: 0
    }
  },
  width: 'auto'
});

const selectBoxIconStyle = style({
  fill: {
    default: 'currentColor',
    isDisabled: 'gray-400'
  },
  gridArea: 'icon',
  marginBottom: {
    orientation: {
      horizontal: 0,
      vertical: 8
    }
  },
  flexShrink: 0
});

const selectBoxLabelStyle = style({
  gridArea: 'label',
  color: {
    default: 'neutral',
    isDisabled: 'disabled'
  },
  fontSize: {
    size: {
      XS: 'body-sm',
      M: 'body-lg',
      L: 'body-xl',
      XL: 'body-2xl'
    }
  }
});

const selectorStyle = style({
  display: 'block',
  position: 'absolute',
  top: {
    orientation: {
      vertical: 16,
      horizontal: '50%'
    }
  },
  right: 16,
  visibility: {
    default: 'hidden',
    isHovered: 'visible',
    isSelected: 'visible'
  }
});

const SelectBox = (props: SelectBoxProps, ref: FocusableRef<HTMLLabelElement>) => {
  const {orientation, selectionMode, size} = useSelectBoxGroupProvider();
  const AriaSelector = selectionMode === 'single' ? AriaRadio : AriaCheckbox;
  const Selector = selectionMode === 'single' ? Radio : Checkbox;
  const domRef = useFocusableRef<HTMLLabelElement>(ref);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {UNSAFE_className, UNSAFE_style} = props;

  return (
    <AriaSelector
      className={renderProps => UNSAFE_className + selectBoxStyle({...renderProps, orientation, size})}
      inputRef={inputRef}
      ref={domRef}
      style={UNSAFE_style}
      value={props.value}
      isDisabled={props.isDisabled}>
      {renderProps => (
        <span className={selectBoxContentStyle({orientation, size})}>
          <Selector
            UNSAFE_className={selectorStyle({
              isHovered: renderProps.isHovered,
              isSelected: renderProps.isSelected,
              orientation
            })}
            value={props.value} />
          <Provider
            values={[
              [
                IconContext,
                {
                  styles: selectBoxIconStyle({...renderProps, orientation})
                }
              ],
              [
                TextContext,
                {
                  slots: {
                    description: {
                      className: style({
                        color: 'gray-600',
                        fontSize: 'body-sm',
                        gridArea: 'description'
                      })
                    },
                    label: {
                      className: selectBoxLabelStyle({...renderProps, size})
                    }
                  }
                }
              ]
            ]}>
            {typeof props.children === 'function' ? props.children(renderProps) : props.children}
          </Provider>
        </span>
      )}
    </AriaSelector>
  );
};

const _SelectBox = forwardRef(SelectBox);
_SelectBox.displayName = 'SelectBox';
export {_SelectBox as SelectBox};
