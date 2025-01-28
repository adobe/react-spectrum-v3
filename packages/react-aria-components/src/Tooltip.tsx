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

import {AnimationProps, AriaLabelingProps, FocusableElement, forwardRefType, RefObject} from '@react-types/shared';
import {AriaPositionProps, mergeProps, OverlayContainer, Placement, PlacementAxis, PositionProps, useOverlayPosition, useTooltip, useTooltipTrigger} from 'react-aria';
import {ContextValue, Provider, RenderProps, useContextProps, useRenderProps} from './utils';
import {FocusableProvider} from '@react-aria/focus';
import {OverlayArrowContext} from './OverlayArrow';
import {OverlayTriggerProps, TooltipTriggerProps, TooltipTriggerState, useTooltipTriggerState} from 'react-stately';
import React, {createContext, ForwardedRef, forwardRef, ReactNode, useContext, useRef, useState} from 'react';
import {useEnterAnimation, useExitAnimation, useLayoutEffect} from '@react-aria/utils';

export interface TooltipTriggerComponentProps extends TooltipTriggerProps {
  children: ReactNode
}

export interface TooltipProps extends PositionProps, Pick<AriaPositionProps, 'arrowBoundaryOffset'>, OverlayTriggerProps, AriaLabelingProps, RenderProps<TooltipRenderProps>, AnimationProps {
  /**
   * The ref for the element which the tooltip positions itself with respect to.
   *
   * When used within a TooltipTrigger this is set automatically. It is only required when used standalone.
   */
  triggerRef?: RefObject<Element | null>,
  /**
   * The container element in which the overlay portal will be placed. This may have unknown behavior depending on where it is portalled to.
   * @default document.body
   */
  UNSTABLE_portalContainer?: Element,
  /**
   * The placement of the tooltip with respect to the trigger.
   * @default 'top'
   */
  placement?: Placement
}

export interface TooltipRenderProps {
  /**
   * The placement of the tooltip relative to the trigger.
   * @selector [data-placement="left | right | top | bottom"]
   */
  placement: PlacementAxis | null,
  /**
   * Whether the tooltip is currently entering. Use this to apply animations.
   * @selector [data-entering]
   */
  isEntering: boolean,
  /**
   * Whether the tooltip is currently exiting. Use this to apply animations.
   * @selector [data-exiting]
   */
  isExiting: boolean,
  /**
   * State of the tooltip.
   */
  state: TooltipTriggerState
}

export const TooltipTriggerStateContext = createContext<TooltipTriggerState | null>(null);
export const TooltipContext = createContext<ContextValue<TooltipProps, HTMLDivElement>>(null);

/**
 * TooltipTrigger wraps around a trigger element and a Tooltip. It handles opening and closing
 * the Tooltip when the user hovers over or focuses the trigger, and positioning the Tooltip
 * relative to the trigger.
 */
export function TooltipTrigger(props: TooltipTriggerComponentProps) {
  let state = useTooltipTriggerState(props);
  let ref = useRef<FocusableElement>(null);
  let {triggerProps, tooltipProps} = useTooltipTrigger(props, state, ref);

  return (
    <Provider
      values={[
        [TooltipTriggerStateContext, state],
        [TooltipContext, {...tooltipProps, triggerRef: ref}]
      ]}>
      <FocusableProvider {...triggerProps} ref={ref}>
        {props.children}
      </FocusableProvider>
    </Provider>
  );
}

/**
 * A tooltip displays a description of an element on hover or focus.
 */
export const Tooltip = /*#__PURE__*/ (forwardRef as forwardRefType)(function Tooltip({UNSTABLE_portalContainer, ...props}: TooltipProps, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, TooltipContext);
  let contextState = useContext(TooltipTriggerStateContext);
  let localState = useTooltipTriggerState(props);
  let state = props.isOpen != null || props.defaultOpen != null || !contextState ? localState : contextState;
  let isExiting = useExitAnimation(ref, state.isOpen, props.onExitComplete) || props.isExiting || false;
  if (!state.isOpen && !isExiting) {
    return null;
  }

  return (
    <OverlayContainer portalContainer={UNSTABLE_portalContainer}>
      <TooltipInner {...props} tooltipRef={ref} isExiting={isExiting} />
    </OverlayContainer>
  );
});

function TooltipInner(props: TooltipProps & {isExiting: boolean, tooltipRef: RefObject<HTMLDivElement | null>}) {
  let state = useContext(TooltipTriggerStateContext)!;

  // Calculate the arrow size internally
  // Referenced from: packages/@react-spectrum/tooltip/src/TooltipTrigger.tsx
  let arrowRef = useRef<HTMLDivElement>(null);
  let [arrowWidth, setArrowWidth] = useState(0);
  useLayoutEffect(() => {
    if (arrowRef.current && state.isOpen) {
      setArrowWidth(arrowRef.current.getBoundingClientRect().width);
    }
  }, [state.isOpen, arrowRef]);

  let {overlayProps, arrowProps, placement} = useOverlayPosition({
    placement: props.placement || 'top',
    targetRef: props.triggerRef!,
    overlayRef: props.tooltipRef,
    offset: props.offset,
    crossOffset: props.crossOffset,
    isOpen: state.isOpen,
    arrowSize: arrowWidth,
    arrowBoundaryOffset: props.arrowBoundaryOffset,
    shouldFlip: props.shouldFlip,
    onClose: () => state.close(true)
  });

  let isEntering = useEnterAnimation(props.tooltipRef, !!placement, props.onEnterComplete) || props.isEntering || false;
  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-Tooltip',
    values: {
      placement,
      isEntering,
      isExiting: props.isExiting,
      state
    }
  });

  props = mergeProps(props, overlayProps);
  let {tooltipProps} = useTooltip(props, state);

  return (
    <div
      {...tooltipProps}
      ref={props.tooltipRef}
      {...renderProps}
      style={{...overlayProps.style, ...renderProps.style}}
      data-placement={placement ?? undefined}
      data-entering={isEntering || undefined}
      data-exiting={props.isExiting || undefined}>
      <OverlayArrowContext.Provider value={{...arrowProps, placement, ref: arrowRef}}>
        {renderProps.children}
      </OverlayArrowContext.Provider>
    </div>
  );
}
