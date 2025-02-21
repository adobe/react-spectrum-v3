/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaMenuItemProps} from './useMenuItem';
import {AriaMenuOptions} from './useMenu';
import type {AriaPopoverProps, OverlayProps} from '@react-aria/overlays';
import {FocusableElement, FocusStrategy, KeyboardEvent, Node, PressEvent, RefObject} from '@react-types/shared';
import {focusWithoutScrolling, useEffectEvent, useId, useLayoutEffect} from '@react-aria/utils';
import {getInteractionModality} from '@react-aria/interactions';
import type {SubmenuTriggerState} from '@react-stately/menu';
import {useCallback, useRef} from 'react';
import {useLocale} from '@react-aria/i18n';
import {useSafelyMouseToSubmenu} from './useSafelyMouseToSubmenu';

export interface AriaSubmenuTriggerProps {
  /**
   * An object representing the submenu trigger menu item. Contains all the relevant information that makes up the menu item.
   * @deprecated
   */
  node?: Node<unknown>,
  /** Whether the submenu trigger is disabled. */
  isDisabled?: boolean,
  /** The type of the contents that the submenu trigger opens. */
  type?: 'dialog' | 'menu',
  /** Ref of the menu that contains the submenu trigger. */
  parentMenuRef: RefObject<HTMLElement | null>,
  /** Ref of the submenu opened by the submenu trigger. */
  submenuRef: RefObject<HTMLElement | null>,
  /**
   * The delay time in milliseconds for the submenu to appear after hovering over the trigger.
   * @default 200
   */
  delay?: number,
  /** Whether the submenu trigger uses virtual focus. */
  shouldUseVirtualFocus?: boolean
}

interface SubmenuTriggerProps extends Omit<AriaMenuItemProps, 'key'> {
  /** Whether the submenu trigger is in an expanded state. */
  isOpen: boolean
}

interface SubmenuProps<T> extends AriaMenuOptions<T> {
  /** The level of the submenu. */
  submenuLevel: number
}

export interface SubmenuTriggerAria<T> {
  /** Props for the submenu trigger menu item. */
  submenuTriggerProps: SubmenuTriggerProps,
  /** Props for the submenu controlled by the submenu trigger menu item. */
  submenuProps: SubmenuProps<T>,
  /** Props for the submenu's popover container. */
  popoverProps: Pick<AriaPopoverProps, 'isNonModal' | 'shouldCloseOnInteractOutside'> & Pick<OverlayProps, 'disableFocusManagement'>
}

/**
 * Provides the behavior and accessibility implementation for a submenu trigger and its associated submenu.
 * @param props - Props for the submenu trigger and refs attach to its submenu and parent menu.
 * @param state - State for the submenu trigger.
 * @param ref - Ref to the submenu trigger element.
 */
export function useSubmenuTrigger<T>(props: AriaSubmenuTriggerProps, state: SubmenuTriggerState, ref: RefObject<FocusableElement | null>): SubmenuTriggerAria<T> {
  let {parentMenuRef, submenuRef, type = 'menu', isDisabled, delay = 200, shouldUseVirtualFocus} = props;
  let submenuTriggerId = useId();
  let overlayId = useId();
  let {direction} = useLocale();
  let openTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  let cancelOpenTimeout = useCallback(() => {
    if (openTimeout.current) {
      clearTimeout(openTimeout.current);
      openTimeout.current = undefined;
    }
  }, [openTimeout]);

  let onSubmenuOpen = useEffectEvent((focusStrategy?: FocusStrategy) => {
    cancelOpenTimeout();
    state.open(focusStrategy);
  });

  let onSubmenuClose = useEffectEvent(() => {
    cancelOpenTimeout();
    state.close();
  });

  useLayoutEffect(() => {
    return () => {
      cancelOpenTimeout();
    };
  }, [cancelOpenTimeout]);

  let submenuKeyDown = (e: KeyboardEvent) => {
    // If focus is not within the menu, assume virtual focus is being used.
    // This means some other input element is also within the popover, so we shouldn't close the menu.
    if (!e.currentTarget.contains(document.activeElement)) {
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        if (direction === 'ltr' && e.currentTarget.contains(e.target as Element)) {
          e.preventDefault();
          e.stopPropagation();
          onSubmenuClose();
          if (!shouldUseVirtualFocus && ref.current) {
            focusWithoutScrolling(ref.current);
          }
        }
        break;
      case 'ArrowRight':
        if (direction === 'rtl' && e.currentTarget.contains(e.target as Element)) {
          e.preventDefault();
          e.stopPropagation();
          onSubmenuClose();
          if (!shouldUseVirtualFocus && ref.current) {
            focusWithoutScrolling(ref.current);
          }
        }
        break;
      case 'Escape':
        // TODO: can remove this when we fix collection event leaks
        if (submenuRef.current?.contains(e.target as Element)) {
          e.stopPropagation();
          onSubmenuClose();
          if (!shouldUseVirtualFocus && ref.current) {
            focusWithoutScrolling(ref.current);
          }
        }
        break;
    }
  };

  let submenuProps = {
    id: overlayId,
    'aria-labelledby': submenuTriggerId,
    submenuLevel: state.submenuLevel,
    ...(type === 'menu' && {
      onClose: state.closeAll,
      autoFocus: state.focusStrategy ?? undefined,
      onKeyDown: submenuKeyDown
    })
  };

  let submenuTriggerKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        if (!isDisabled) {
          if (direction === 'ltr') {
            e.preventDefault();
            if (!state.isOpen) {
              onSubmenuOpen('first');
            }

            if (type === 'menu' && !!submenuRef?.current && document.activeElement === ref?.current) {
              focusWithoutScrolling(submenuRef.current);
            }
          } else if (state.isOpen) {
            onSubmenuClose();
          } else {
            e.continuePropagation();
          }
        }

        break;
      case 'ArrowLeft':
        if (!isDisabled) {
          if (direction === 'rtl') {
            e.preventDefault();
            if (!state.isOpen) {
              onSubmenuOpen('first');
            }

            if (type === 'menu' && !!submenuRef?.current && document.activeElement === ref?.current) {
              focusWithoutScrolling(submenuRef.current);
            }
          } else if (state.isOpen) {
            onSubmenuClose();
          } else {
            e.continuePropagation();
          }
        }
        break;
      default:
        e.continuePropagation();
        break;
    }
  };

  let onPressStart = (e: PressEvent) => {
    if (!isDisabled && (e.pointerType === 'virtual' || e.pointerType === 'keyboard')) {
      // If opened with a screen reader or keyboard, auto focus the first submenu item.
      onSubmenuOpen('first');
    }
  };

  let onPress = (e: PressEvent) => {
    if (!isDisabled && (e.pointerType === 'touch' || e.pointerType === 'mouse')) {
      // For touch or on a desktop device with a small screen open on press up to possible problems with
      // press up happening on the newly opened tray items
      onSubmenuOpen();
    }
  };

  let onHoverChange = (isHovered) => {
    if (!isDisabled) {
      if (isHovered && !state.isOpen) {
        if (!openTimeout.current) {
          openTimeout.current = setTimeout(() => {
            onSubmenuOpen();
          }, delay);
        }
      } else if (!isHovered) {
        cancelOpenTimeout();
      }
    }
  };

  let onBlur = (e) => {
    if (state.isOpen && (parentMenuRef.current?.contains(e.relatedTarget))) {
      onSubmenuClose();
    }
  };

  let shouldCloseOnInteractOutside = (target) => {
    if (target !== ref.current) {
      return true;
    }

    return false;
  };

  useSafelyMouseToSubmenu({menuRef: parentMenuRef, submenuRef, isOpen: state.isOpen, isDisabled: isDisabled});

  return {
    submenuTriggerProps: {
      id: submenuTriggerId,
      'aria-controls': state.isOpen ? overlayId : undefined,
      'aria-haspopup': !isDisabled ? type : undefined,
      'aria-expanded': state.isOpen ? 'true' : 'false',
      onPressStart,
      onPress,
      onHoverChange,
      onKeyDown: submenuTriggerKeyDown,
      onBlur,
      isOpen: state.isOpen
    },
    submenuProps,
    popoverProps: {
      isNonModal: true,
      // We will manually coerce focus back to the triggers for mobile screen readers and non virtual focus use cases (aka submenus outside of autocomplete) so turn off
      // FocusScope then. For virtual focus use cases (Autocomplete subdialogs/menu) and subdialogs we want to keep FocusScope restoreFocus to automatically
      // send focus to parent subdialog input fields and/or tab containment
      disableFocusManagement: !shouldUseVirtualFocus && (getInteractionModality() === 'virtual'),
      shouldCloseOnInteractOutside
    }
  };
}
