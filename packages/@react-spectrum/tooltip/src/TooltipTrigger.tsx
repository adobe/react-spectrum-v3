/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {FocusableProvider} from '@react-aria/focus';
import {Overlay} from '@react-spectrum/overlays';
import React, {ReactElement, useRef} from 'react';
import {SpectrumTooltipTriggerProps} from '@react-types/tooltip';
import {TooltipContext} from './context';
import {unwrapDOMRef} from '@react-spectrum/utils';
import {useOverlayPosition} from '@react-aria/overlays';
import {useTooltipTrigger} from '@react-aria/tooltip';
import {useTooltipTriggerState} from '@react-stately/tooltip';

const DEFAULT_OFFSET = 7; // Closest visual match to Spectrum's mocks
const DEFAULT_CROSS_OFFSET = 0;

function TooltipTrigger(props: SpectrumTooltipTriggerProps) {
  let {
    children,
    crossOffset = DEFAULT_CROSS_OFFSET,
    isDisabled,
    offset = DEFAULT_OFFSET,
    trigger: triggerAction
  } = props;

  let tooltipRef = useRef();

  let [trigger, tooltip] = React.Children.toArray(children) as [ReactElement, ReactElement];

  // this does mean that we can't have some element wrapping the Tooltip
  // we'd need to do it through context if we wanted to allow for that
  let tooltipWithRef = React.cloneElement(tooltip, {
    ref: node => {
      tooltipRef.current = node;
      // @ts-ignore react forwardRef doesn't get typed quite right, so we ignore these two warnings about accessing ref
      if (tooltip.ref) {
        // @ts-ignore
        tooltip.ref.current = node;
      }
    }
  });

  let state = useTooltipTriggerState(props);

  let tooltipTriggerRef = useRef<HTMLElement>();
  let overlayRef = useRef<HTMLDivElement>();

  let {triggerProps, tooltipProps} = useTooltipTrigger({
    isDisabled,
    trigger: triggerAction
  }, state, tooltipTriggerRef);

  let {overlayProps, arrowProps, placement} = useOverlayPosition({
    placement: props.placement || 'top',
    targetRef: tooltipTriggerRef,
    overlayRef,
    offset,
    crossOffset,
    isOpen: state.isOpen
  });

  return (
    <FocusableProvider
      {...triggerProps}
      ref={tooltipTriggerRef}>
      {trigger}
      <TooltipContext.Provider
        value={{
          state,
          placement,
          ref: overlayRef,
          UNSAFE_style: overlayProps.style,
          arrowProps,
          ...tooltipProps
        }}>
        <Overlay isOpen={state.isOpen} nodeRef={unwrapDOMRef(tooltipRef)}>
          {tooltipWithRef}
        </Overlay>
      </TooltipContext.Provider>
    </FocusableProvider>
  );
}

// Support TooltipTrigger inside components using CollectionBuilder.
TooltipTrigger.getCollectionNode = function* (props: SpectrumTooltipTriggerProps) {
  // Replaced the use of React.Childern.toArray because it mutates the key prop.
  let childArray: ReactElement[] = [];
  React.Children.forEach(props.children, child => {
    if (React.isValidElement(child)) {
      childArray.push(child);
    }
  });
  let [trigger, tooltip] = childArray;
  yield {
    element: trigger,
    wrapper: (element) => (
      <TooltipTrigger key={element.key} {...props}>
        {element}
        {tooltip}
      </TooltipTrigger>
    )
  };
};

/**
 * TooltipTrigger wraps around a trigger element and a Tooltip. It handles opening and closing
 * the Tooltip when the user hovers over or focuses the trigger, and positioning the Tooltip
 * relative to the trigger.
 */
// We don't want getCollectionNode to show up in the type definition
let _TooltipTrigger = TooltipTrigger as (props: SpectrumTooltipTriggerProps) => JSX.Element;
export {_TooltipTrigger as TooltipTrigger};
