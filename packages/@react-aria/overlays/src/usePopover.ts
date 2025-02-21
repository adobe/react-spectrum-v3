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

import {ariaHideOutside, keepVisible} from './ariaHideOutside';
import {AriaPositionProps, useOverlayPosition} from './useOverlayPosition';
import {DOMAttributes, RefObject} from '@react-types/shared';
import {mergeProps, useLayoutEffect} from '@react-aria/utils';
import {OverlayTriggerState} from '@react-stately/overlays';
import {PlacementAxis} from '@react-types/overlays';
import {useOverlay} from './useOverlay';
import {usePreventScroll} from './usePreventScroll';

export interface AriaPopoverProps extends Omit<AriaPositionProps, 'isOpen' | 'onClose' | 'targetRef' | 'overlayRef'> {
  /**
   * The ref for the element which the popover positions itself with respect to.
   */
  triggerRef: RefObject<Element | null>,
  /**
   * The ref for the popover element.
   */
  popoverRef: RefObject<Element | null>,
  /**
   * An optional ref for a group of popovers, e.g. submenus.
   * When provided, this element is used to detect outside interactions
   * and hiding elements from assistive technologies instead of the popoverRef.
   */
  groupRef?: RefObject<Element | null>,
  /**
   * Whether the popover is non-modal, i.e. elements outside the popover may be
   * interacted with by assistive technologies.
   *
   * Most popovers should not use this option as it may negatively impact the screen
   * reader experience. Only use with components such as combobox, which are designed
   * to handle this situation carefully.
   */
  isNonModal?: boolean,
  /**
   * Whether pressing the escape key to close the popover should be disabled.
   *
   * Most popovers should not use this option. When set to true, an alternative
   * way to close the popover with a keyboard must be provided.
   *
   * @default false
   */
  isKeyboardDismissDisabled?: boolean,
  /**
   * When user interacts with the argument element outside of the popover ref,
   * return true if onClose should be called. This gives you a chance to filter
   * out interaction with elements that should not dismiss the popover.
   * By default, onClose will always be called on interaction outside the popover ref.
   */
  shouldCloseOnInteractOutside?: (element: Element) => boolean
}

export interface PopoverAria {
  /** Props for the popover element. */
  popoverProps: DOMAttributes,
  /** Props for the popover tip arrow if any. */
  arrowProps: DOMAttributes,
  /** Props to apply to the underlay element, if any. */
  underlayProps: DOMAttributes,
  /** Placement of the popover with respect to the trigger. */
  placement: PlacementAxis | null
}

/**
 * Provides the behavior and accessibility implementation for a popover component.
 * A popover is an overlay element positioned relative to a trigger.
 */
export function usePopover(props: AriaPopoverProps, state: OverlayTriggerState): PopoverAria {
  let {
    triggerRef,
    popoverRef,
    groupRef,
    isNonModal,
    isKeyboardDismissDisabled,
    shouldCloseOnInteractOutside,
    ...otherProps
  } = props;

  let isSubmenu = otherProps['trigger'] === 'SubmenuTrigger';

  let {overlayProps, underlayProps} = useOverlay(
    {
      isOpen: state.isOpen,
      onClose: state.close,
      shouldCloseOnBlur: true,
      isDismissable: !isNonModal || isSubmenu,
      isKeyboardDismissDisabled,
      shouldCloseOnInteractOutside
    },
    groupRef ?? popoverRef
  );

  let {overlayProps: positionProps, arrowProps, placement} = useOverlayPosition({
    ...otherProps,
    targetRef: triggerRef,
    overlayRef: popoverRef,
    isOpen: state.isOpen,
    onClose: isNonModal ? state.close : null
  });

  usePreventScroll({
    isDisabled: isNonModal || !state.isOpen
  });

  useLayoutEffect(() => {
    if (state.isOpen && popoverRef.current) {
      if (isNonModal) {
        return keepVisible(groupRef?.current ?? popoverRef.current);
      } else {
        return ariaHideOutside([groupRef?.current ?? popoverRef.current]);
      }
    }
  }, [isNonModal, state.isOpen, popoverRef, groupRef]);

  return {
    popoverProps: mergeProps(overlayProps, positionProps),
    arrowProps,
    underlayProps,
    placement
  };
}
