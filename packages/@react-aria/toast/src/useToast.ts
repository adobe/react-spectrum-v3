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

import {AriaButtonProps} from '@react-types/button';
import {AriaLabelingProps, DOMAttributes, FocusableElement, RefObject} from '@react-types/shared';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {QueuedToast, ToastState} from '@react-stately/toast';
import {useEffect} from 'react';
import {useId, useSlotId} from '@react-aria/utils';
import {useLocalizedStringFormatter} from '@react-aria/i18n';

export interface AriaToastProps<T> extends AriaLabelingProps {
  /** The toast object. */
  toast: QueuedToast<T>
}

export interface ToastAria {
  /** Props for the toast container, non-modal dialog element. */
  toastProps: DOMAttributes,
  /** Props for the toast content alert message. */
  contentProps: DOMAttributes,
  /** Props for the toast title element. */
  titleProps: DOMAttributes,
  /** Props for the toast description element, if any. */
  descriptionProps: DOMAttributes,
  /** Props for the toast close button. */
  closeButtonProps: AriaButtonProps
}

/**
 * Provides the behavior and accessibility implementation for a toast component.
 * Toasts display brief, temporary notifications of actions, errors, or other events in an application.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useToast<T>(props: AriaToastProps<T>, state: ToastState<T>, ref: RefObject<FocusableElement | null>): ToastAria {
  let {
    key,
    timer,
    timeout
  } = props.toast;

  useEffect(() => {
    if (timer == null || timeout == null) {
      return;
    }

    timer.reset(timeout);
    return () => {
      timer.pause();
    };
  }, [timer, timeout]);

  let titleId = useId();
  let descriptionId = useSlotId();
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-aria/toast');

  return {
    toastProps: {
      role: 'alertdialog',
      'aria-modal': 'false',
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'] || titleId,
      'aria-describedby': props['aria-describedby'] || descriptionId,
      'aria-details': props['aria-details'],
      tabIndex: 0
    },
    contentProps: {
      role: 'alert',
      'aria-atomic': 'true'
    },
    titleProps: {
      id: titleId
    },
    descriptionProps: {
      id: descriptionId
    },
    closeButtonProps: {
      'aria-label': stringFormatter.format('close'),
      onPress: () => state.close(key)
    }
  };
}
