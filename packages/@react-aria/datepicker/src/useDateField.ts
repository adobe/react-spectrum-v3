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

import {AriaDatePickerProps, DateValue} from '@react-types/datepicker';
import {createFocusManager} from '@react-aria/focus';
import {DatePickerFieldState} from '@react-stately/datepicker';
import {HTMLAttributes, LabelHTMLAttributes, RefObject} from 'react';
import {mergeProps, useDescription} from '@react-aria/utils';
import {useDateFormatter} from '@react-aria/i18n';
import {useField} from '@react-aria/label';
import {useFocusWithin, usePress} from '@react-aria/interactions';

interface DateFieldAria {
  labelProps: LabelHTMLAttributes<HTMLLabelElement>,
  fieldProps: HTMLAttributes<HTMLElement>,
  /** Props for the description element, if any. */
  descriptionProps: HTMLAttributes<HTMLElement>,
  /** Props for the error message element, if any. */
  errorMessageProps: HTMLAttributes<HTMLElement>
}

export const labelIds = new WeakMap<DatePickerFieldState, string>();

export function useDateField<T extends DateValue>(props: AriaDatePickerProps<T>, state: DatePickerFieldState, ref: RefObject<HTMLElement>): DateFieldAria {
  let {labelProps, fieldProps, descriptionProps, errorMessageProps} = useField({
    ...props,
    labelElementType: 'span'
  });

  // Focus the first placeholder segment from the end on mouse down/touch up in the field.
  let focusLast = () => {
    let segments = state.segments.filter(s => s.isEditable);
    let index = segments.length - 1;
    while (index >= 0 && segments[index].isPlaceholder) {
      index--;
    }
    index = Math.min(index + 1, segments.length - 1);
    let element = ref.current.querySelectorAll('[role="spinbutton"]')[index] as HTMLElement;
    if (element) {
      element.focus();
    }
  };

  let {pressProps} = usePress({
    onPressStart(e) {
      if (e.pointerType === 'mouse') {
        focusLast();
      }
    },
    onPress(e) {
      if (e.pointerType !== 'mouse') {
        focusLast();
      }
    }
  });

  let {focusWithinProps} = useFocusWithin({
    onBlurWithin() {
      state.confirmPlaceholder();
    }
  });

  let formatter = useDateFormatter(state.getFormatOptions({month: 'long'}));
  let descProps = useDescription(state.value ? formatter.format(state.dateValue) : null);

  labelIds.set(state, fieldProps['aria-labelledby'] || fieldProps.id);

  return {
    labelProps: {
      ...labelProps,
      onClick: () => {
        let focusManager = createFocusManager(ref);
        focusManager.focusFirst();
      }
    },
    fieldProps: mergeProps(fieldProps, descProps, pressProps, focusWithinProps, {
      role: 'group',
      'aria-disabled': props.isDisabled || undefined,
      'aria-describedby': [descProps['aria-describedby'], fieldProps['aria-describedby']].filter(Boolean).join(' ') || undefined
    }),
    descriptionProps,
    errorMessageProps
  };
}
