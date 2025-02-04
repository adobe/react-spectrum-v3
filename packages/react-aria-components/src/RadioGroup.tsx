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

import {AriaRadioGroupProps, AriaRadioProps, HoverEvents, Orientation, useFocusable, useFocusRing, useHover, useRadio, useRadioGroup, VisuallyHidden} from 'react-aria';
import {ContextValue, Provider, RACValidation, removeDataAttributes, RenderProps, SlotProps, useContextProps, useRenderProps, useSlot, useSlottedContext} from './utils';
import {FieldErrorContext} from './FieldError';
import {filterDOMProps, mergeProps, mergeRefs, useObjectRef} from '@react-aria/utils';
import {FormContext} from './Form';
import {forwardRefType, RefObject} from '@react-types/shared';
import {LabelContext} from './Label';
import {RadioGroupState, useRadioGroupState} from 'react-stately';
import React, {createContext, ForwardedRef, forwardRef} from 'react';
import {TextContext} from './Text';

export interface RadioGroupProps extends Omit<AriaRadioGroupProps, 'children' | 'label' | 'description' | 'errorMessage' | 'validationState' | 'validationBehavior'>, RACValidation, RenderProps<RadioGroupRenderProps>, SlotProps {}
export interface RadioProps extends Omit<AriaRadioProps, 'children'>, HoverEvents, RenderProps<RadioRenderProps>, SlotProps {
  /**
   * A ref for the HTML input element.
   */
  inputRef?: RefObject<HTMLInputElement | null>
}

export interface RadioGroupRenderProps {
  /**
   * The orientation of the radio group.
   * @selector [data-orientation="horizontal | vertical"]
   */
  orientation: Orientation,
  /**
   * Whether the radio group is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * Whether the radio group is read only.
   * @selector [data-readonly]
   */
  isReadOnly: boolean,
  /**
   * Whether the radio group is required.
   * @selector [data-required]
   */
  isRequired: boolean,
  /**
   * Whether the radio group is invalid.
   * @selector [data-invalid]
   */
  isInvalid: boolean,
  /**
   * State of the radio group.
   */
  state: RadioGroupState
}

export interface RadioRenderProps {
  /**
   * Whether the radio is selected.
   * @selector [data-selected]
   */
  isSelected: boolean,
  /**
   * Whether the radio is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean,
  /**
   * Whether the radio is currently in a pressed state.
   * @selector [data-pressed]
   */
  isPressed: boolean,
  /**
   * Whether the radio is focused, either via a mouse or keyboard.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the radio is keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the radio is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * Whether the radio is read only.
   * @selector [data-readonly]
   */
  isReadOnly: boolean,
  /**
   * Whether the radio is invalid.
   * @selector [data-invalid]
   */
  isInvalid: boolean,
  /**
   * Whether the checkbox is required.
   * @selector [data-required]
   */
  isRequired: boolean
}

export const RadioGroupContext = createContext<ContextValue<RadioGroupProps, HTMLDivElement>>(null);
export const RadioContext = createContext<ContextValue<Partial<RadioProps>, HTMLLabelElement>>(null);
export const RadioGroupStateContext = createContext<RadioGroupState | null>(null);

/**
 * A radio group allows a user to select a single item from a list of mutually exclusive options.
 */
export const RadioGroup = /*#__PURE__*/ (forwardRef as forwardRefType)(function RadioGroup(props: RadioGroupProps, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, RadioGroupContext);
  let {validationBehavior: formValidationBehavior} = useSlottedContext(FormContext) || {};
  let validationBehavior = props.validationBehavior ?? formValidationBehavior ?? 'native';
  let state = useRadioGroupState({
    ...props,
    validationBehavior
  });

  let [labelRef, label] = useSlot(
    !props['aria-label'] && !props['aria-labelledby']
  );
  let {radioGroupProps, labelProps, descriptionProps, errorMessageProps, ...validation} = useRadioGroup({
    ...props,
    label,
    validationBehavior
  }, state);

  let renderProps = useRenderProps({
    ...props,
    values: {
      orientation: props.orientation || 'vertical',
      isDisabled: state.isDisabled,
      isReadOnly: state.isReadOnly,
      isRequired: state.isRequired,
      isInvalid: state.isInvalid,
      state
    },
    defaultClassName: 'react-aria-RadioGroup'
  });

  return (
    <div
      {...radioGroupProps}
      {...renderProps}
      ref={ref}
      slot={props.slot || undefined}
      data-orientation={props.orientation || 'vertical'}
      data-invalid={state.isInvalid || undefined}
      data-disabled={state.isDisabled || undefined}
      data-readonly={state.isReadOnly || undefined}
      data-required={state.isRequired || undefined}>
      <Provider
        values={[
          [RadioGroupStateContext, state],
          [LabelContext, {...labelProps, ref: labelRef, elementType: 'span'}],
          [TextContext, {
            slots: {
              description: descriptionProps,
              errorMessage: errorMessageProps
            }
          }],
          [FieldErrorContext, validation]
        ]}>
        {renderProps.children}
      </Provider>
    </div>
  );
});

/**
 * A radio represents an individual option within a radio group.
 */
export const Radio = /*#__PURE__*/ (forwardRef as forwardRefType)(function Radio(props: RadioProps, ref: ForwardedRef<HTMLLabelElement>) {
  let {
    inputRef: userProvidedInputRef = null,
    ...otherProps
  } = props;
  [props, ref] = useContextProps(otherProps, ref, RadioContext);
  let state = React.useContext(RadioGroupStateContext)!;
  let inputRef = useObjectRef(mergeRefs(userProvidedInputRef, props.inputRef !== undefined ? props.inputRef : null));
  let {labelProps, inputProps, isSelected, isDisabled, isPressed} = useRadio({
    ...removeDataAttributes<RadioProps>(props),
    // ReactNode type doesn't allow function children.
    children: typeof props.children === 'function' ? true : props.children
  }, state, inputRef);
  let {isFocused, isFocusVisible, focusProps} = useFocusRing();
  let interactionDisabled = isDisabled || state.isReadOnly;
  let {focusableProps} = useFocusable(props, ref);
  let {hoverProps, isHovered} = useHover({
    ...props,
    isDisabled: interactionDisabled
  });

  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-Radio',
    values: {
      isSelected,
      isPressed,
      isHovered,
      isFocused,
      isFocusVisible,
      isDisabled,
      isReadOnly: state.isReadOnly,
      isInvalid: state.isInvalid,
      isRequired: state.isRequired
    }
  });

  let DOMProps = filterDOMProps(props);
  delete DOMProps.id;

  return (
    <label
      {...mergeProps(DOMProps, labelProps, hoverProps, focusableProps, renderProps)}
      ref={ref}
      data-selected={isSelected || undefined}
      data-pressed={isPressed || undefined}
      data-hovered={isHovered || undefined}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-disabled={isDisabled || undefined}
      data-readonly={state.isReadOnly || undefined}
      data-invalid={state.isInvalid || undefined}
      data-required={state.isRequired || undefined}>
      <VisuallyHidden elementType="span">
        <input {...mergeProps(inputProps, focusProps)} ref={inputRef} />
      </VisuallyHidden>
      {renderProps.children}
    </label>
  );
});
