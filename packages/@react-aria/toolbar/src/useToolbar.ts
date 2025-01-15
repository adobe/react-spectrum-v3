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

import {AriaLabelingProps, Orientation, RefObject} from '@react-types/shared';
import {createFocusManager} from '@react-aria/focus';
import {filterDOMProps, scrollIntoViewport, useLayoutEffect} from '@react-aria/utils';
import {getInteractionModality} from '@react-aria/interactions';
import {HTMLAttributes, KeyboardEventHandler, useRef, useState} from 'react';
import {useLocale} from '@react-aria/i18n';

export interface AriaToolbarProps extends AriaLabelingProps {
  /**
   * The orientation of the entire toolbar.
   * @default 'horizontal'
   */
  orientation?: Orientation
}

export interface ToolbarAria {
  /**
   * Props for the toolbar container.
   */
  toolbarProps: HTMLAttributes<HTMLElement>
}

/**
 * Provides the behavior and accessibility implementation for a toolbar.
 * A toolbar is a container for a set of interactive controls with arrow key navigation.
 * @param props - Props to be applied to the toolbar.
 * @param ref - A ref to a DOM element for the toolbar.
 */
export function useToolbar(props: AriaToolbarProps, ref: RefObject<HTMLElement | null>): ToolbarAria {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    orientation = 'horizontal'
  } = props;
  let [isInToolbar, setInToolbar] = useState(false);
  // should be safe because re-calling set state with the same value it already has is a no-op
  // this will allow us to react should a parent re-render and change its role though
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    setInToolbar(!!(ref.current && ref.current.parentElement?.closest('[role="toolbar"]')));
  });
  const {direction} = useLocale();
  const shouldReverse = direction === 'rtl' && orientation === 'horizontal';
  let focusManager = createFocusManager(ref);

  const onKeyDown: KeyboardEventHandler = (e) => {
    // don't handle portalled events
    if (!e.currentTarget.contains(e.target as HTMLElement)) {
      return;
    }
    if (
      (orientation === 'horizontal' && e.key === 'ArrowRight')
      || (orientation === 'vertical' && e.key === 'ArrowDown')) {
      if (shouldReverse) {
        focusManager.focusPrevious();
      } else {
        focusManager.focusNext();
      }
    } else if (
      (orientation === 'horizontal' && e.key === 'ArrowLeft')
      || (orientation === 'vertical' && e.key === 'ArrowUp')) {
      if (shouldReverse) {
        focusManager.focusNext();
      } else {
        focusManager.focusPrevious();
      }
    } else if (e.key === 'Tab') {
      // When the tab key is pressed, we want to move focus
      // out of the entire toolbar. To do this, move focus
      // to the first or last focusable child, and let the
      // browser handle the Tab key as usual from there.
      e.stopPropagation();
      lastFocused.current = document.activeElement as HTMLElement;
      if (e.shiftKey) {
        focusManager.focusFirst();
      } else {
        focusManager.focusLast();
      }
      return;
    } else {
      // if we didn't handle anything, return early so we don't preventDefault
      return;
    }

    // Prevent arrow keys from being handled by nested action groups.
    e.stopPropagation();
    e.preventDefault();
  };

  // Record the last focused child when focus moves out of the toolbar.
  const lastFocused = useRef<HTMLElement | null>(null);
  const onBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget) && !lastFocused.current) {
      lastFocused.current = e.target;
    }
  };

  // Restore focus to the last focused child when focus returns into the toolbar.
  // If the element was removed, do nothing, either the first item in the first group,
  // or the last item in the last group will be focused, depending on direction.
  const onFocus = (e) => {
    let modality = getInteractionModality();
    if (lastFocused.current && !e.currentTarget.contains(e.relatedTarget) && ref.current?.contains(e.target)) {
      lastFocused.current?.focus();
      lastFocused.current = null;
    }
    if (modality === 'keyboard') {
      scrollIntoViewport(document.activeElement, {containingElement: ref.current});
    }
  };

  return {
    toolbarProps: {
      ...filterDOMProps(props, {labelable: true}),
      role: !isInToolbar ? 'toolbar' : 'group',
      'aria-orientation': orientation,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabel == null ? ariaLabelledBy : undefined,
      onKeyDownCapture: !isInToolbar ? onKeyDown : undefined,
      onFocusCapture: !isInToolbar ? onFocus : undefined,
      onBlurCapture: !isInToolbar ? onBlur : undefined
    }
  };
}
