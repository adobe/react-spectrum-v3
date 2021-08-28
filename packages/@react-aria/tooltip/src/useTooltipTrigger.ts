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

import {FocusEvents} from '@react-types/shared';
import {getInteractionModality, HoverProps, isFocusVisible, PressProps, usePress} from '@react-aria/interactions';
import {HTMLAttributes, RefObject, useEffect, useRef} from 'react';
import {mergeProps, useId} from '@react-aria/utils';
import {TooltipTriggerProps} from '@react-types/tooltip';
import {TooltipTriggerState} from '@react-stately/tooltip';
import {useFocusable} from '@react-aria/focus';
import {useHover} from '@react-aria/interactions';

interface TooltipTriggerAria {
  /**
   * Props for the trigger element.
   */
  triggerProps: HTMLAttributes<HTMLElement> & PressProps & HoverProps & FocusEvents,

  /**
   * Props for the overlay container element.
   */
  tooltipProps: HTMLAttributes<HTMLElement>
}

/**
 * Provides the behavior and accessibility implementation for a tooltip trigger, e.g. a button
 * that shows a description when focused or hovered.
 */
export function useTooltipTrigger(props: TooltipTriggerProps, state: TooltipTriggerState, ref: RefObject<HTMLElement>) : TooltipTriggerAria {
  let {
    isDisabled,
    trigger
  } = props;

  let tooltipId = useId();

  let isHovered = useRef(false);
  let isFocused = useRef(false);

  let handleShow = () => {
    if (isHovered.current || isFocused.current) {
      state.open(isFocused.current);
    }
  };

  let handleHide = (immediate?: boolean) => {
    if (!isHovered.current && !isFocused.current) {
      state.close(immediate);
    }
  };

  useEffect(() => {
    let onKeyDown = (e) => {
      if (ref && ref.current) {
        // Escape after clicking something can give it keyboard focus
        // dismiss tooltip on esc key press
        if (e.key === 'Escape') {
          state.close(true);
        }
      }
    };
    if (state.isOpen) {
      document.addEventListener('keydown', onKeyDown, true);
      return () => {
        document.removeEventListener('keydown', onKeyDown, true);
      };
    }
  }, [ref, state]);

  let onHoverStart = () => {
    if (trigger === 'focus') {
      return;
    }
    // In chrome, if you hover a trigger, then another element obscures it, due to keyboard
    // interactions for example, hover will end. When hover is restored after that element disappears,
    // focus moves on for example, then the tooltip will reopen. We check the modality to know if the hover
    // is the result of moving the mouse.
    if (getInteractionModality() === 'pointer') {
      isHovered.current = true;
    } else {
      isHovered.current = false;
    }
    handleShow();
  };

  let onHoverEnd = () => {
    if (trigger === 'focus') {
      return;
    }
    // no matter how the trigger is left, we should close the tooltip
    isFocused.current = false;
    isHovered.current = false;
    handleHide();
  };

  let onPressStart = () => {
    // no matter how the trigger is pressed, we should close the tooltip
    isFocused.current = false;
    isHovered.current = false;
    handleHide(true);
  };

  let onFocus = () => {
    let isVisible = isFocusVisible();
    if (isVisible) {
      isFocused.current = true;
      handleShow();
    }
  };

  let onBlur = () => {
    isFocused.current = false;
    isHovered.current = false;
    handleHide(true);
  };

  let {hoverProps} = useHover({
    isDisabled,
    onHoverStart,
    onHoverEnd
  });

  let {pressProps} = usePress({onPressStart});

  let {focusableProps} = useFocusable({
    isDisabled,
    onFocus,
    onBlur
  }, ref);

  return {
    triggerProps: {
      'aria-describedby': !isDisabled ? tooltipId : undefined,
      ...mergeProps(focusableProps, hoverProps, pressProps)
    },
    tooltipProps: {
      id: tooltipId
    }
  };
}
