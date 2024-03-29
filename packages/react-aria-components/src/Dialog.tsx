/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {AriaDialogProps, useDialog, useId, useOverlayTrigger} from 'react-aria';
import {ContextValue, DEFAULT_SLOT, forwardRefType, Provider, SlotProps, StyleProps, useContextProps} from './utils';
import {filterDOMProps} from '@react-aria/utils';
import {HeadingContext} from './Heading';
import {OverlayTriggerProps, OverlayTriggerState, useOverlayTriggerState} from 'react-stately';
import {PopoverContext} from './Popover';
import {PressResponder} from '@react-aria/interactions';
import React, {createContext, ForwardedRef, forwardRef, ReactNode, useContext, useRef} from 'react';

export interface DialogTriggerProps extends OverlayTriggerProps {
  children: ReactNode
}

interface DialogRenderProps {
  close: () => void
}

export interface DialogProps extends AriaDialogProps, StyleProps, SlotProps {
  /** Children of the dialog. A function may be provided to access a function to close the dialog. */
  children?: ReactNode | ((opts: DialogRenderProps) => ReactNode)
}

export const DialogContext = createContext<ContextValue<DialogProps, HTMLElement>>(null);
export const OverlayTriggerStateContext = createContext<OverlayTriggerState | null>(null);

/**
 * A DialogTrigger opens a dialog when a trigger element is pressed.
 */
export function DialogTrigger(props: DialogTriggerProps) {
  let state = useOverlayTriggerState(props);

  let buttonRef = useRef<HTMLButtonElement>(null);
  let {triggerProps, overlayProps} = useOverlayTrigger({type: 'dialog'}, state, buttonRef);

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
        [DialogContext, overlayProps],
        [PopoverContext, {trigger: 'DialogTrigger', triggerRef: buttonRef}]
      ]}>
      <PressResponder {...triggerProps} ref={buttonRef} isPressed={state.isOpen}>
        {props.children}
      </PressResponder>
    </Provider>
  );
}

function Dialog(props: DialogProps, ref: ForwardedRef<HTMLElement>) {
  let originalAriaLabelledby = props['aria-labelledby'];
  [props, ref] = useContextProps(props, ref, DialogContext);
  let {dialogProps, titleProps} = useDialog({
    ...props,
    // Only pass aria-labelledby from props, not context.
    // Context is used as a fallback below.
    'aria-labelledby': originalAriaLabelledby
  }, ref);
  let state = useContext(OverlayTriggerStateContext);

  let children = props.children;
  if (typeof children === 'function') {
    children = children({
      close: state?.close || (() => {})
    });
  }

  if (!dialogProps['aria-label'] && !dialogProps['aria-labelledby']) {
    // If aria-labelledby exists on props, we know it came from context.
    // Use that as a fallback in case there is no title slot.
    if (props['aria-labelledby']) {
      dialogProps['aria-labelledby'] = props['aria-labelledby'];
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('If a Dialog does not contain a <Heading slot="title">, it must have an aria-label or aria-labelledby attribute for accessibility.');
      }
    }
  }

  return (
    <section
      {...filterDOMProps(props)}
      {...dialogProps}
      ref={ref}
      slot={props.slot || undefined}
      style={props.style}
      className={props.className ?? 'react-aria-Dialog'}>
      <Provider
        values={[
          [HeadingContext, {
            slots: {
              [DEFAULT_SLOT]: {},
              title: {...titleProps, level: 2}
            }
          }]
        ]}>
        {children}
      </Provider>
    </section>
  );
}

/**
 * A dialog is an overlay shown above other content in an application.
 */
const _Dialog = /*#__PURE__*/ (forwardRef as forwardRefType)(Dialog);
export {_Dialog as Dialog};
