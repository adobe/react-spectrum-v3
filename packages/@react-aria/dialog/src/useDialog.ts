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

import {AriaDialogProps} from '@react-types/dialog';
import {filterDOMProps, useSlotId} from '@react-aria/utils';
import {focusSafely} from '@react-aria/focus';
import {HTMLAttributes, RefObject, useEffect} from 'react';

interface DialogAria<D, T> {
  /** Props for the dialog container element. */
  dialogProps: HTMLAttributes<D>,

  /** Props for the dialog title element. */
  titleProps: HTMLAttributes<T>,
}

/**
 * Provides the behavior and accessibility implementation for a dialog component.
 * A dialog is an overlay shown above other content in an application.
 */
export function useDialog<D extends HTMLElement, T extends HTMLElement>(
  props: AriaDialogProps,
  ref: RefObject<HTMLElement>
): DialogAria<D, T> {
  let {role = 'dialog'} = props;
  let titleId = useSlotId();
  titleId = props['aria-label'] ? undefined : titleId;

  // Focus the dialog itself on mount, unless a child element is already focused.
  useEffect(() => {
    if (ref.current && !ref.current.contains(document.activeElement)) {
      focusSafely(ref.current);

      // Safari on iOS does not move the VoiceOver cursor to the dialog
      // or announce that it has opened until it has rendered. A workaround
      // is to wait for half a second, then blur and re-focus the dialog.
      let timeout = setTimeout(() => {
        if (document.activeElement === ref.current) {
          ref.current.blur();
          focusSafely(ref.current);
        }
      }, 500);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [ref]);

  // We do not use aria-modal due to a Safari bug which forces the first focusable element to be focused
  // on mount when inside an iframe, no matter which element we programmatically focus.
  // See https://bugs.webkit.org/show_bug.cgi?id=211934.
  // useModal sets aria-hidden on all elements outside the dialog, so the dialog will behave as a modal
  // even without aria-modal on the dialog itself.
  return {
    dialogProps: {
      ...filterDOMProps(props, {labelable: true}),
      role,
      tabIndex: -1,
      'aria-labelledby': props['aria-labelledby'] || titleId
    },
    titleProps: {
      id: titleId
    }
  };
}
