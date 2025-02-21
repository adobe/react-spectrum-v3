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

import {AriaLabelingProps, forwardRefType, RefObject} from '@react-types/shared';
import {AriaPopoverProps, DismissButton, Overlay, PlacementAxis, PositionProps, useLocale, usePopover} from 'react-aria';
import {ContextValue, RenderProps, SlotProps, useContextProps, useRenderProps} from './utils';
import {filterDOMProps, mergeProps, useEnterAnimation, useExitAnimation, useLayoutEffect} from '@react-aria/utils';
import {focusSafely} from '@react-aria/interactions';
import {OverlayArrowContext} from './OverlayArrow';
import {OverlayTriggerProps, OverlayTriggerState, useOverlayTriggerState} from 'react-stately';
import {OverlayTriggerStateContext} from './Dialog';
import React, {createContext, ForwardedRef, forwardRef, useContext, useEffect, useRef, useState} from 'react';
import {useIsHidden} from '@react-aria/collections';

export interface PopoverProps extends Omit<PositionProps, 'isOpen'>, Omit<AriaPopoverProps, 'popoverRef' | 'triggerRef' | 'groupRef' | 'offset' | 'arrowSize'>, OverlayTriggerProps, RenderProps<PopoverRenderProps>, SlotProps, AriaLabelingProps {
  /**
   * The name of the component that triggered the popover. This is reflected on the element
   * as the `data-trigger` attribute, and can be used to provide specific
   * styles for the popover depending on which element triggered it.
   */
  trigger?: string,
  /**
   * The ref for the element which the popover positions itself with respect to.
   *
   * When used within a trigger component such as DialogTrigger, MenuTrigger, Select, etc.,
   * this is set automatically. It is only required when used standalone.
   */
  triggerRef?: RefObject<Element | null>,
  /**
   * Whether the popover is currently performing an entry animation.
   */
  isEntering?: boolean,
  /**
   * Whether the popover is currently performing an exit animation.
   */
  isExiting?: boolean,
  /**
   * The container element in which the overlay portal will be placed. This may have unknown behavior depending on where it is portalled to.
   * @default document.body
   */
  UNSTABLE_portalContainer?: Element,
  /**
   * The additional offset applied along the main axis between the element and its
   * anchor element.
   * @default 8
   */
  offset?: number
}

export interface PopoverRenderProps {
  /**
   * The name of the component that triggered the popover, e.g. "DialogTrigger" or "ComboBox".
   * @selector [data-trigger="..."]
   */
  trigger: string | null,
  /**
   * The placement of the popover relative to the trigger.
   * @selector [data-placement="left | right | top | bottom"]
   */
  placement: PlacementAxis | null,
  /**
   * Whether the popover is currently entering. Use this to apply animations.
   * @selector [data-entering]
   */
  isEntering: boolean,
  /**
   * Whether the popover is currently exiting. Use this to apply animations.
   * @selector [data-exiting]
   */
  isExiting: boolean
}

export const PopoverContext = createContext<ContextValue<PopoverProps, HTMLElement>>(null);

// Stores a ref for the portal container for a group of popovers (e.g. submenus).
const PopoverGroupContext = createContext<RefObject<Element | null> | null>(null);

/**
 * A popover is an overlay element positioned relative to a trigger.
 */
export const Popover = /*#__PURE__*/ (forwardRef as forwardRefType)(function Popover(props: PopoverProps, ref: ForwardedRef<HTMLElement>) {
  [props, ref] = useContextProps(props, ref, PopoverContext);
  let contextState = useContext(OverlayTriggerStateContext);
  let localState = useOverlayTriggerState(props);
  let state = props.isOpen != null || props.defaultOpen != null || !contextState ? localState : contextState;
  let isExiting = useExitAnimation(ref, state.isOpen) || props.isExiting || false;
  let isHidden = useIsHidden();
  let {direction} = useLocale();

  // If we are in a hidden tree, we still need to preserve our children.
  if (isHidden) {
    let children = props.children;
    if (typeof children === 'function') {
      children = children({
        trigger: props.trigger || null,
        placement: 'bottom',
        isEntering: false,
        isExiting: false,
        defaultChildren: null
      });
    }

    return <>{children}</>;
  }

  if (state && !state.isOpen && !isExiting) {
    return null;
  }

  return (
    <PopoverInner
      {...props}
      triggerRef={props.triggerRef!}
      state={state}
      popoverRef={ref}
      isExiting={isExiting}
      dir={direction} />
  );
});

interface PopoverInnerProps extends AriaPopoverProps, RenderProps<PopoverRenderProps>, SlotProps {
  state: OverlayTriggerState,
  isEntering?: boolean,
  isExiting: boolean,
  UNSTABLE_portalContainer?: Element,
  trigger?: string,
  dir?: 'ltr' | 'rtl'
}

function PopoverInner({state, isExiting, UNSTABLE_portalContainer, ...props}: PopoverInnerProps) {
  // Calculate the arrow size internally (and remove props.arrowSize from PopoverProps)
  // Referenced from: packages/@react-spectrum/tooltip/src/TooltipTrigger.tsx
  let arrowRef = useRef<HTMLDivElement>(null);
  let [arrowWidth, setArrowWidth] = useState(0);
  let containerRef = useRef<HTMLDivElement | null>(null);
  let groupCtx = useContext(PopoverGroupContext);
  let isSubPopover = groupCtx && props.trigger === 'SubmenuTrigger';
  useLayoutEffect(() => {
    if (arrowRef.current && state.isOpen) {
      setArrowWidth(arrowRef.current.getBoundingClientRect().width);
    }
  }, [state.isOpen, arrowRef]);

  let {popoverProps, underlayProps, arrowProps, placement} = usePopover({
    ...props,
    offset: props.offset ?? 8,
    arrowSize: arrowWidth,
    // If this is a submenu/subdialog, use the root popover's container 
    // to detect outside interaction and add aria-hidden.
    groupRef: isSubPopover ? groupCtx! : containerRef
  }, state);

  let ref = props.popoverRef as RefObject<HTMLDivElement | null>;
  let isEntering = useEnterAnimation(ref, !!placement) || props.isEntering || false;
  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-Popover',
    values: {
      trigger: props.trigger || null,
      placement,
      isEntering,
      isExiting
    }
  });

  // Automatically render Popover with role=dialog except when isNonModal is true,
  // or a dialog is already nested inside the popover.
  let shouldBeDialog = !props.isNonModal || props.trigger === 'SubmenuTrigger';
  let [isDialog, setDialog] = useState(false);
  useLayoutEffect(() => {
    if (ref.current) {
      setDialog(shouldBeDialog && !ref.current.querySelector('[role=dialog]'));
    }
  }, [ref, shouldBeDialog]);

  // Focus the popover itself on mount, unless a child element is already focused.
  useEffect(() => {
    if (isDialog && ref.current && !ref.current.contains(document.activeElement)) {
      focusSafely(ref.current);
    }
  }, [isDialog, ref]);

  let style = {...popoverProps.style, ...renderProps.style};
  let overlay = (
    <div
      {...mergeProps(filterDOMProps(props as any), popoverProps)}
      {...renderProps}
      role={isDialog ? 'dialog' : undefined}
      tabIndex={isDialog ? -1 : undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      ref={ref}
      slot={props.slot || undefined}
      style={style}
      dir={props.dir}
      data-trigger={props.trigger}
      data-placement={placement}
      data-entering={isEntering || undefined}
      data-exiting={isExiting || undefined}>
      {!props.isNonModal && <DismissButton onDismiss={state.close} />}
      <OverlayArrowContext.Provider value={{...arrowProps, placement, ref: arrowRef}}>
        {renderProps.children}
      </OverlayArrowContext.Provider>
      <DismissButton onDismiss={state.close} />
    </div>
  );

  // If this is a root popover, render an extra div to act as the portal container for submenus/subdialogs.
  if (!isSubPopover) {
    return (
      <Overlay {...props} shouldContainFocus={isDialog} isExiting={isExiting} portalContainer={UNSTABLE_portalContainer}>
        {!props.isNonModal && state.isOpen && <div data-testid="underlay" {...underlayProps} style={{position: 'fixed', inset: 0}} />}
        <div ref={containerRef} style={{display: 'contents'}}>
          <PopoverGroupContext.Provider value={containerRef}>
            {overlay}
          </PopoverGroupContext.Provider>
        </div>
      </Overlay>
    );
  }

  // Submenus/subdialogs are mounted into the root popover's container.
  return (
    <Overlay {...props} shouldContainFocus={isDialog} isExiting={isExiting} portalContainer={UNSTABLE_portalContainer ?? groupCtx?.current ?? undefined}>
      {overlay}
    </Overlay>
  );
}
