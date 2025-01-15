
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
import {
  DialogTriggerProps as AriaDialogTriggerProps,
  Popover as AriaPopover,
  DEFAULT_SLOT,
  DialogContext,
  OverlayTriggerStateContext,
  PopoverContext,
  PopoverProps,
  Provider,
  RootMenuTriggerStateContext
} from 'react-aria-components';
import {ButtonContext} from './Button';
import {Card} from './Card';
import {CheckboxContext} from './Checkbox';
import {colorScheme, getAllowedOverrides} from './style-utils' with {type: 'macro'};
import {ColorSchemeContext} from './Provider';
import {ContentContext, FooterContext, KeyboardContext, TextContext} from './Content';
import {DividerContext} from './Divider';
import {ForwardedRef, forwardRef, ReactNode, useContext, useRef, useState} from 'react';
import {forwardRefType} from './types';
import {ImageContext} from './Image';
import {ImageCoordinator} from './ImageCoordinator';
import {keyframes, raw} from '../style/style-macro' with {type: 'macro'};
import {mergeStyles} from '../style/runtime';
import {PressResponder} from '@react-aria/interactions';
import {SliderContext} from './Slider';
import {space, style} from '../style' with {type: 'macro'};
import {useId, useOverlayTrigger} from 'react-aria';
import {useMenuTriggerState} from '@react-stately/menu';

export interface CoachMarkProps extends Omit<PopoverProps, 'children'> {
  /** The children of the coach mark. */
  children: ReactNode | ((renderProps: { size: 'XS' | 'S' | 'M' | 'L' | 'XL' }) => ReactNode),

  size?: 'S' | 'M' | 'L' | 'XL'
}

const fadeKeyframes = keyframes(`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`);
const slideUpKeyframes = keyframes(`
  from {
    transform: translateY(-4px);
  }

  to {
    transform: translateY(0);
  }
`);
const slideDownKeyframes = keyframes(`
  from {
    transform: translateY(4px);
  }

  to {
    transform: translateY(0);
  }
`);
const slideRightKeyframes = keyframes(`
  from {
    transform: translateX(4px);
  }

  to {
    transform: translateX(0);
  }
`);
const slideLeftKeyframes = keyframes(`
  from {
    transform: translateX(-4px);
  }

  to {
    transform: translateX(0);
  }
`);

let popover = style({
  ...colorScheme(),
  '--s2-container-bg': {
    type: 'backgroundColor',
    value: 'layer-2'
  },
  backgroundColor: '--s2-container-bg',
  borderRadius: 'lg',
  filter: {
    isArrowShown: 'elevated'
  },
  // Use box-shadow instead of filter when an arrow is not shown.
  // This fixes the shadow stacking problem with submenus.
  boxShadow: {
    default: 'elevated',
    isArrowShown: 'none'
  },
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: {
    default: 'gray-200',
    forcedColors: 'ButtonBorder'
  },
  width: {
    size: {
      // Copied from designs, not sure if correct.
      S: 336,
      M: 416,
      L: 576
    }
  },
  // Don't be larger than full screen minus 2 * containerPadding
  maxWidth: '[calc(100vw - 24px)]',
  boxSizing: 'border-box',
  translateY: {
    placement: {
      bottom: {
        isArrowShown: 8 // TODO: not defined yet should this change with font size? need boolean support for 'hideArrow' prop
      },
      top: {
        isArrowShown: -8
      }
    }
  },
  translateX: {
    placement: {
      left: {
        isArrowShown: -8
      },
      right: {
        isArrowShown: 8
      }
    }
  },
  animation: {
    placement: {
      top: {
        isEntering: `${slideDownKeyframes}, ${fadeKeyframes}`,
        isExiting: `${slideDownKeyframes}, ${fadeKeyframes}`
      },
      bottom: {
        isEntering: `${slideUpKeyframes}, ${fadeKeyframes}`,
        isExiting: `${slideUpKeyframes}, ${fadeKeyframes}`
      },
      left: {
        isEntering: `${slideRightKeyframes}, ${fadeKeyframes}`,
        isExiting: `${slideRightKeyframes}, ${fadeKeyframes}`
      },
      right: {
        isEntering: `${slideLeftKeyframes}, ${fadeKeyframes}`,
        isExiting: `${slideLeftKeyframes}, ${fadeKeyframes}`
      }
    },
    isSubmenu: {
      isEntering: fadeKeyframes,
      isExiting: fadeKeyframes
    }
  },
  animationDuration: {
    isEntering: 200,
    isExiting: 200
  },
  animationDirection: {
    isEntering: 'normal',
    isExiting: 'reverse'
  },
  animationTimingFunction: {
    isExiting: 'in'
  },
  transition: '[opacity, transform]',
  willChange: '[opacity, transform]',
  isolation: 'isolate',
  pointerEvents: {
    isExiting: 'none'
  }
}, getAllowedOverrides());

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

let keyboard = style({
  gridArea: 'keyboard',
  font: 'ui',
  fontWeight: 'light',
  color: 'gray-600',
  background: 'gray-25',
  unicodeBidi: 'plaintext'
});

let steps = style({
  font: 'detail',
  fontSize: 'detail-sm',
  alignSelf: 'center'
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
      'title keyboard',
      'description keyboard'
    ],
    ':has([data-slot=menu])': [
      'title menu',
      'keyboard keyboard',
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

const actionButtonSize = {
  XS: 'XS',
  S: 'XS',
  M: 'S',
  L: 'M',
  XL: 'L'
} as const;

export function CoachMark(props: CoachMarkProps) {
  let colorScheme = useContext(ColorSchemeContext);
  let {size = 'M'} = props;

  let children = (
    <Provider
      values={[
        [ImageContext, {alt: '', styles: image}],
        [TextContext, {
          slots: {
            [DEFAULT_SLOT]: {},
            title: {styles: title({size})},
            description: {styles: description({size})},
            steps: {styles: steps}
          }
        }],
        [KeyboardContext, {styles: keyboard}],
        [ContentContext, {styles: content({size})}],
        [DividerContext, {size: 'S'}],
        [FooterContext, {styles: footer}],
        [ActionMenuContext, {
          isQuiet: true,
          size: actionButtonSize[size],
          // @ts-ignore
          'data-slot': 'menu',
          styles: actionMenu
        }]
      ]}>
      <ImageCoordinator>
        {typeof props.children === 'function' ? props.children({size}) : props.children}
      </ImageCoordinator>
    </Provider>
  );
  return (
    <AriaPopover
      {...props}
      // ref={popoverRef}
      style={{
        // ...UNSAFE_style,
        // Override default z-index from useOverlayPosition. We use isolation: isolate instead.
        zIndex: undefined
      }}
      className={(renderProps) =>  mergeStyles(popover({...renderProps, colorScheme}))}>
      <Card>
        {/* }// Reset OverlayTriggerStateContext so the buttons inside the dialog don't retain their hover state. */}
        <OverlayTriggerStateContext.Provider value={null}>
          {children}
        </OverlayTriggerStateContext.Provider>
      </Card>
    </AriaPopover>
  );
}


export interface CoachMarkTriggerProps extends AriaDialogTriggerProps {
}

/**
 * DialogTrigger serves as a wrapper around a Dialog and its associated trigger, linking the Dialog's
 * open state with the trigger's press state. Additionally, it allows you to customize the type and
 * positioning of the Dialog.
 */
export function CoachMarkTrigger(props: CoachMarkTriggerProps) {
  // Use useMenuTriggerState instead of useOverlayTriggerState in case a menu is embedded in the dialog.
  // This is needed to handle submenus.
  let state = useMenuTriggerState(props);

  let containerRef = useRef<HTMLDivElement>(null);
  let {triggerProps, overlayProps} = useOverlayTrigger({type: 'dialog'}, state, containerRef);

  // Label dialog by the trigger as a fallback if there is no title slot.
  // This is done in RAC instead of hooks because otherwise we cannot distinguish
  // between context and props. Normally aria-labelledby overrides the title
  // but when sent by context we want the title to win.
  triggerProps.id = useId();
  overlayProps['aria-labelledby'] = triggerProps.id;


  return (
    <Provider
      values={[
          [OverlayTriggerStateContext, state],
          [RootMenuTriggerStateContext, state],
          [DialogContext, overlayProps],
          [PopoverContext, {trigger: 'DialogTrigger', triggerRef: containerRef, isNonModal: true}]
      ]}>
      <PressResponder {...triggerProps}  isPressed={state.isOpen}>
        <CoachIndicator ref={containerRef} isActive={props.isOpen}>
          {props.children}
        </CoachIndicator>
      </PressResponder>
    </Provider>
  );
}
// export function CoachMarkTrigger(props: CoachMarkTriggerProps) {
//   return (
//     <AriaDialogTrigger {...props}>
//       {/* RAC sets isPressed via PressResponder when the dialog is open.
//           We don't want press scaling to appear to get "stuck", so override this. */}
//       <PressResponder isPressed={false}>
//         <CoachIndicator isActive={props.isOpen}>
//           {props.children}
//         </CoachIndicator>
//       </PressResponder>
//     </AriaDialogTrigger>
//   );
// }


// TODO better way to calculate 4px transform? (not 4%?)
const pulseAnimation = keyframes(`
  0% {
    box-shadow: 0 0 0 4px rgba(20, 115, 230, 0.40);
    transform: scale(calc(100%));
  }
  50% {
     box-shadow: 0 0 0 10px rgba(20, 115, 230, 0.20);
     transform: scale(104%);
  }
  100% {
     box-shadow: 0 0 0 4px rgba(20, 115, 230, 0.40);
     transform: scale(calc(100%));
  }
`);


const indicator = style({
  animationDuration: 1000,
  animationIterationCount: 'infinite',
  animationFillMode: 'forwards',
  animationTimingFunction: 'in-out',
  position: 'relative',
  '--activeElement': {
    type: 'outlineColor',
    value: {
      default: 'focus-ring',
      forcedColors: 'Highlight'
    }
  },
  '--borderOffset': {
    type: 'top',
    value: {
      default: '[-2px]',
      ':has([data-trigger=checkbox])': '[-6px]',
      ':has([data-trigger=slider])': '[-8px]',
      offset: {
        M: '[-6px]',
        L: '[-8px]'
      }
    }
  },
  '--ringRadius': {
    type: 'top', // is there a generic for pixel values?
    value: {
      default: '[10px]',
      ':has([data-trigger=button])': '[18px]',
      ':has([data-trigger=checkbox])': '[6px]'
    }
  }
});

const pulse = raw(`&:before { content: ""; display: inline-block; position: absolute; top: var(--borderOffset); bottom:  var(--borderOffset); left: var(--borderOffset); right: var(--borderOffset); border-radius: var(--ringRadius); outline-style: solid; outline-color: var(--activeElement); outline-width: 4px; animation-duration: 2s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; animation-fill-mode: forwards; animation-name: ${pulseAnimation}}`);

interface CoachIndicatorProps {
  children: ReactNode,
  isActive?: boolean
}
export const CoachIndicator = /*#__PURE__*/ (forwardRef as forwardRefType)(function CoachIndicator(props: CoachIndicatorProps, ref: ForwardedRef<HTMLDivElement>) {
// export const CoachIndicator = forwardRef((props, ref) => {
  const {children, isActive} = props;

  return (
    <div ref={ref} className={indicator({isActive}) + ' ' + (isActive ? pulse : '')}>
      <Provider
        values={[
          [ButtonContext, {
            // @ts-ignore
            'data-trigger': 'button'
          }],
          [CheckboxContext, {
            // @ts-ignore
            'data-trigger': 'checkbox'
          }],
          [SliderContext, {
            // @ts-ignore
            'data-trigger': 'slider'
          }]
        ]}>
        {children}
      </Provider>
    </div>
  );
});

// FUTURE: support multiple tours on a page?
export function useTour({defaultStep = 1, defaultComplete = false}) {
  const [isComplete, setIsComplete] = useState(defaultComplete);
  const [currentStep, setCurrentStep] = useState(defaultStep);
  const [totalSteps, setTotalSteps] = useState(0);
  const advanceStep = () => {
    if (currentStep + 1 > totalSteps) {
      setIsComplete(true);
    }
    setCurrentStep(currentStep < totalSteps ? currentStep + 1 : totalSteps);
  };
  const previousStep = () => setCurrentStep(currentStep > 0 ? currentStep - 1 : 0);
  const skipTour = () => setIsComplete(true);
  const restartTour = () => {
    setIsComplete(false);
    setCurrentStep(1);
  };

  const coachMarkTriggerProps = (step: number) => {
    // TODO find a better way for this so it's not run on every rerender
    if (step > totalSteps) {
      setTotalSteps(step);
    }
    return {
      isOpen: !isComplete && step === currentStep
    };
  };

  return {
    coachMarkTriggerProps,
    currentStep,
    totalSteps,
    advanceStep,
    previousStep,
    skipTour,
    restartTour
  };
}
