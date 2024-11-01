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

import {AriaRadioGroupProps} from '@react-types/radio';
import {DOMAttributes, ValidationResult} from '@react-types/shared';
import {filterDOMProps, mergeProps, useId} from '@react-aria/utils';
import {getFocusableTreeWalker} from '@react-aria/focus';
import {radioGroupData} from './utils';
import {RadioGroupState} from '@react-stately/radio';
import {useField} from '@react-aria/label';
import {useFocusWithin} from '@react-aria/interactions';
import {useLocale} from '@react-aria/i18n';

export interface RadioGroupAria extends ValidationResult {
  /** Props for the radio group wrapper element. */
  radioGroupProps: DOMAttributes,
  /** Props for the radio group's visible label (if any). */
  labelProps: DOMAttributes,
  /** Props for the radio group description element, if any. */
  descriptionProps: DOMAttributes,
  /** Props for the radio group error message element, if any. */
  errorMessageProps: DOMAttributes
}

/**
 * Provides the behavior and accessibility implementation for a radio group component.
 * Radio groups allow users to select a single item from a list of mutually exclusive options.
 * @param props - Props for the radio group.
 * @param state - State for the radio group, as returned by `useRadioGroupState`.
 */
export function useRadioGroup(props: AriaRadioGroupProps, state: RadioGroupState): RadioGroupAria {
  let {
    name,
    isReadOnly,
    isRequired,
    isDisabled,
    orientation = 'vertical',
    validationBehavior = 'aria'
  } = props;
  let {direction} = useLocale();

  let {isInvalid, validationErrors, validationDetails} = state.displayValidation;
  let {labelProps, fieldProps, descriptionProps, errorMessageProps} = useField({
    ...props,
    // Radio group is not an HTML input element so it
    // shouldn't be labeled by a <label> element.
    labelElementType: 'span',
    isInvalid: state.isInvalid,
    errorMessage: props.errorMessage || validationErrors
  });

  let domProps = filterDOMProps(props, {labelable: true});

  // When the radio group loses focus, reset the focusable radio to null if
  // there is no selection. This allows tabbing into the group from either
  // direction to go to the first or last radio.
  let {focusWithinProps} = useFocusWithin({
    onBlurWithin(e) {
      props.onBlur?.(e);
      if (state.selectedValue == null) {
        state.setLastFocusedValue(null);
      }
    },
    onFocusWithin: props.onFocus,
    onFocusWithinChange: props.onFocusChange
  });

  let onKeyDown = (e) => {
    let nextDir;
    switch (e.key) {
      case 'ArrowRight':
        if (direction === 'rtl' && orientation !== 'vertical') {
          nextDir = 'prev';
        } else {
          nextDir = 'next';
        }
        break;
      case 'ArrowLeft':
        if (direction === 'rtl' && orientation !== 'vertical') {
          nextDir = 'next';
        } else {
          nextDir = 'prev';
        }
        break;
      case 'ArrowDown':
        nextDir = 'next';
        break;
      case 'ArrowUp':
        nextDir = 'prev';
        break;
      default:
        return;
    }
    e.preventDefault();
    let walker = getFocusableTreeWalker(e.currentTarget, {from: e.target});
    let nextElem;
    if (nextDir === 'next') {
      nextElem = walker.nextNode();
      if (!nextElem) {
        walker.currentNode = e.currentTarget;
        nextElem = walker.firstChild();
      }
    } else {
      nextElem = walker.previousNode();
      if (!nextElem) {
        walker.currentNode = e.currentTarget;
        nextElem = walker.lastChild();
      }
    }
    if (nextElem) {
      // Call focus on nextElem so that keyboard navigation scrolls the radio into view
      nextElem.focus();
      state.setSelectedValue(nextElem.value);
    }
  };

  let groupName = useId(name);
  radioGroupData.set(state, {
    name: groupName,
    descriptionId: descriptionProps.id,
    errorMessageId: errorMessageProps.id,
    validationBehavior
  });

  return {
    radioGroupProps: mergeProps(domProps, {
      // https://www.w3.org/TR/wai-aria-1.2/#radiogroup
      role: 'radiogroup',
      onKeyDown,
      'aria-invalid': state.isInvalid || undefined,
      'aria-errormessage': props['aria-errormessage'],
      'aria-readonly': isReadOnly || undefined,
      'aria-required': isRequired || undefined,
      'aria-disabled': isDisabled || undefined,
      'aria-orientation': orientation,
      ...fieldProps,
      ...focusWithinProps
    }),
    labelProps,
    descriptionProps,
    errorMessageProps,
    isInvalid,
    validationErrors,
    validationDetails
  };
}
