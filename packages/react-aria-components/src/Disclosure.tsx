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

import {AriaDisclosureProps, useDisclosure} from '@react-aria/disclosure';
import {ButtonContext} from './Button';
import {ContextValue, Provider, RenderProps, SlotProps, useContextProps, useRenderProps} from './utils';
import {DisclosureState, useDisclosureState} from '@react-stately/disclosure';
import {forwardRefType} from '@react-types/shared';
import {HoverEvents, useFocusRing} from 'react-aria';
import {mergeProps, mergeRefs, useObjectRef} from '@react-aria/utils';
import React, {createContext, DOMAttributes, ForwardedRef, forwardRef, ReactNode, useContext, useRef} from 'react';

export interface DisclosureProps extends Omit<AriaDisclosureProps, 'children' | 'contentRef'>, HoverEvents, RenderProps<DisclosureRenderProps>, SlotProps {}

export interface DisclosureRenderProps {
  /**
   * Whether the disclosure is expanded.
   * @selector [data-expanded]
   */
  isExpanded: boolean,
  /**
   * Whether the disclosure has keyboard focus.
   * @selector [data-focus-visible-within]
   */
  isFocusVisibleWithin: boolean,
  /**
   * Whether the disclosure is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * State of the disclosure.
   */
  state: DisclosureState
}

export const DisclosureContext = createContext<ContextValue<DisclosureProps, HTMLDivElement>>(null);
export const DisclosureStateContext = createContext<DisclosureState | null>(null);

interface InternalDisclosureContextValue {
  contentProps: DOMAttributes<HTMLElement>,
  contentRef: React.RefObject<HTMLElement | null>
}

const InternalDisclosureContext = createContext<InternalDisclosureContextValue | null>(null);

function Disclosure(props: DisclosureProps, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, DisclosureContext);
  let state = useDisclosureState(props);
  let contentRef = useRef<HTMLElement>(null);
  let {buttonProps, contentProps} = useDisclosure({...props, contentRef}, state);
  let {
    isFocusVisible: isFocusVisibleWithin,
    focusProps: focusWithinProps
  } = useFocusRing({within: true});

  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-Disclosure',
    values: {
      isExpanded: state.isExpanded,
      isDisabled: props.isDisabled || false,
      isFocusVisibleWithin,
      state
    }
  });

  return (
    <Provider
      values={[
        [ButtonContext, {
          slots: {
            trigger: buttonProps
          }
        }],
        [InternalDisclosureContext, {contentProps, contentRef}],
        [DisclosureStateContext, state]
      ]}>
      <div
        ref={ref}
        data-expanded={state.isExpanded || undefined}
        data-disabled={props.isDisabled || undefined}
        data-focus-visible-within={isFocusVisibleWithin || undefined}
        {...focusWithinProps}
        {...renderProps}>
        {renderProps.children}
      </div>
    </Provider>
  );
}

export interface DisclosurePanelProps extends RenderProps<{}> {
  /**
   * The accessibility role for the disclosure's panel.
   * @default 'group'
   */
  role?: 'group' | 'region',
  children: ReactNode
}

function DisclosurePanel(props: DisclosurePanelProps, ref: ForwardedRef<HTMLElement>) {
  let {role = 'group'} = props;
  let {contentProps, contentRef} = useContext(InternalDisclosureContext)!;
  let {
    isFocusVisible: isFocusVisibleWithin,
    focusProps: focusWithinProps
  } = useFocusRing({within: true});
  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-DisclosurePanel',
    values: {
      isFocusVisibleWithin
    }
  });
  let mergedRef = useObjectRef(mergeRefs(contentRef, ref));
  return (
    <div
      role={role}
      // @ts-ignore
      ref={mergedRef}
      {...mergeProps(contentProps, focusWithinProps)}
      {...renderProps}
      data-focus-visible-within={isFocusVisibleWithin || undefined}>
      <Provider
        values={[
          [ButtonContext, null]
        ]}>
        {props.children}
      </Provider>
    </div>
  );
}

/**
 * A disclosure is a collapsible section of content. It is composed of a a header with a heading and trigger button, and a panel that contains the content.
 */
const _Disclosure = /*#__PURE__*/ (forwardRef as forwardRefType)(Disclosure);
export {_Disclosure as Disclosure};

const _DisclosurePanel = /*#__PURE__*/ (forwardRef as forwardRefType)(DisclosurePanel);
export {_DisclosurePanel as DisclosurePanel};
