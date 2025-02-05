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
import {DOMAttributes, FocusableElement, RefObject} from '@react-types/shared';
import {filterDOMProps, useSlotId} from '@react-aria/utils';
import {focusSafely} from '@react-aria/interactions';
import {useEffect, useRef} from 'react';
import {useOverlayFocusContain} from '@react-aria/overlays';

export interface DialogAria {
  /** Props for the dialog container element. */
  dialogProps: DOMAttributes,

  /** Props for the dialog title element. */
  titleProps: DOMAttributes
}

/**
 * Provides the behavior and accessibility implementation for a dialog component.
 * A dialog is an overlay shown above other content in an application.
 */
export function useDialog(props: AriaDialogProps, ref: RefObject<FocusableElement | null>): DialogAria {
  let {role = 'dialog'} = props;
  let titleId: string | undefined = useSlotId();
  titleId = props['aria-label'] ? undefined : titleId;

  let isRefocusing = useRef(false);

  // Focus the dialog itself on mount, unless a child element is already focused.
  useEffect(() => {
    if (ref.current && !ref.current.contains(document.activeElement)) {
      focusSafely(ref.current);

      // Safari on iOS does not move the VoiceOver cursor to the dialog
      // or announce that it has opened until it has rendered. A workaround
      // is to wait for half a second, then blur and re-focus the dialog.
      let timeout = setTimeout(() => {
        if (document.activeElement === ref.current) {
          isRefocusing.current = true;
          if (ref.current) {
            ref.current.blur();
            focusSafely(ref.current);
          }
          isRefocusing.current = false;
        }
      }, 500);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [ref]);

  useOverlayFocusContain();

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
      'aria-labelledby': props['aria-labelledby'] || titleId,
      // Prevent blur events from reaching useOverlay, which may cause
      // popovers to close. Since focus is contained within the dialog,
      // we don't want this to occur due to the above useEffect.
      onBlur: e => {
        if (isRefocusing.current) {
          e.stopPropagation();
        }
      }
    },
    titleProps: {
      id: titleId
    }
  };
}
