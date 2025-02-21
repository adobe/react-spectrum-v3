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

import {AriaSelectProps, HiddenSelect, useFocusRing, useLocalizedStringFormatter, useSelect} from 'react-aria';
import {ButtonContext} from './Button';
import {Collection, Node, SelectState, useSelectState} from 'react-stately';
import {CollectionBuilder} from '@react-aria/collections';
import {ContextValue, Provider, RACValidation, removeDataAttributes, RenderProps, SlotProps, useContextProps, useRenderProps, useSlot, useSlottedContext} from './utils';
import {FieldErrorContext} from './FieldError';
import {filterDOMProps, useResizeObserver} from '@react-aria/utils';
import {FormContext} from './Form';
import {forwardRefType} from '@react-types/shared';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {ItemRenderProps} from './Collection';
import {LabelContext} from './Label';
import {ListBoxContext, ListStateContext} from './ListBox';
import {OverlayTriggerStateContext} from './Dialog';
import {PopoverContext} from './Popover';
import React, {createContext, ForwardedRef, forwardRef, HTMLAttributes, ReactNode, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {TextContext} from './Text';

export interface SelectRenderProps {
  /**
   * Whether the select is focused, either via a mouse or keyboard.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the select is keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the select is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * Whether the select is currently open.
   * @selector [data-open]
   */
  isOpen: boolean,
  /**
   * Whether the select is invalid.
   * @selector [data-invalid]
   */
  isInvalid: boolean,
  /**
   * Whether the select is required.
   * @selector [data-required]
   */
  isRequired: boolean
}

export interface SelectProps<T extends object = {}> extends Omit<AriaSelectProps<T>, 'children' | 'label' | 'description' | 'errorMessage' | 'validationState' | 'validationBehavior' | 'items'>, RACValidation, RenderProps<SelectRenderProps>, SlotProps {}

export const SelectContext = createContext<ContextValue<SelectProps<any>, HTMLDivElement>>(null);
export const SelectStateContext = createContext<SelectState<unknown> | null>(null);

/**
 * A select displays a collapsible list of options and allows a user to select one of them.
 */
export const Select = /*#__PURE__*/ (forwardRef as forwardRefType)(function Select<T extends object = {}>(props: SelectProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, SelectContext);
  let {children, isDisabled = false, isInvalid = false, isRequired = false} = props;
  let content = useMemo(() => (
    typeof children === 'function'
      ? children({
        isOpen: false,
        isDisabled,
        isInvalid,
        isRequired,
        isFocused: false,
        isFocusVisible: false,
        defaultChildren: null
      })
      : children
  ), [children, isDisabled, isInvalid, isRequired]);

  return (
    <CollectionBuilder content={content}>
      {collection => <SelectInner props={props} collection={collection} selectRef={ref} />}
    </CollectionBuilder>
  );
});

interface SelectInnerProps<T extends object> {
  props: SelectProps<T>,
  selectRef: ForwardedRef<HTMLDivElement>,
  collection: Collection<Node<T>>
}

function SelectInner<T extends object>({props, selectRef: ref, collection}: SelectInnerProps<T>) {
  let {validationBehavior: formValidationBehavior} = useSlottedContext(FormContext) || {};
  let validationBehavior = props.validationBehavior ?? formValidationBehavior ?? 'native';
  let state = useSelectState({
    ...props,
    collection,
    children: undefined,
    validationBehavior
  });

  let {isFocusVisible, focusProps} = useFocusRing({within: true});

  // Get props for child elements from useSelect
  let buttonRef = useRef<HTMLButtonElement>(null);
  let [labelRef, label] = useSlot(
    !props['aria-label'] && !props['aria-labelledby']
  );
  let {
    labelProps,
    triggerProps,
    valueProps,
    menuProps,
    descriptionProps,
    errorMessageProps,
    ...validation
  } = useSelect({
    ...removeDataAttributes(props),
    label,
    validationBehavior
  }, state, buttonRef);

  // Make menu width match input + button
  let [buttonWidth, setButtonWidth] = useState<string | null>(null);
  let onResize = useCallback(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth + 'px');
    }
  }, [buttonRef]);

  useResizeObserver({
    ref: buttonRef,
    onResize: onResize
  });

  // Only expose a subset of state to renderProps function to avoid infinite render loop
  let renderPropsState = useMemo(() => ({
    isOpen: state.isOpen,
    isFocused: state.isFocused,
    isFocusVisible,
    isDisabled: props.isDisabled || false,
    isInvalid: validation.isInvalid || false,
    isRequired: props.isRequired || false
  }), [state.isOpen, state.isFocused, isFocusVisible, props.isDisabled, validation.isInvalid, props.isRequired]);

  let renderProps = useRenderProps({
    ...props,
    values: renderPropsState,
    defaultClassName: 'react-aria-Select'
  });

  let DOMProps = filterDOMProps(props);
  delete DOMProps.id;

  let scrollRef = useRef(null);

  return (
    <Provider
      values={[
        [SelectContext, props],
        [SelectStateContext, state],
        [SelectValueContext, valueProps],
        [LabelContext, {...labelProps, ref: labelRef, elementType: 'span'}],
        [ButtonContext, {...triggerProps, ref: buttonRef, isPressed: state.isOpen}],
        [OverlayTriggerStateContext, state],
        [PopoverContext, {
          trigger: 'Select',
          triggerRef: buttonRef,
          scrollRef,
          placement: 'bottom start',
          style: {'--trigger-width': buttonWidth} as React.CSSProperties,
          'aria-labelledby': menuProps['aria-labelledby']
        }],
        [ListBoxContext, {...menuProps, ref: scrollRef}],
        [ListStateContext, state],
        [TextContext, {
          slots: {
            description: descriptionProps,
            errorMessage: errorMessageProps
          }
        }],
        [FieldErrorContext, validation]
      ]}>
      <div
        {...DOMProps}
        {...renderProps}
        {...focusProps}
        ref={ref}
        slot={props.slot || undefined}
        data-focused={state.isFocused || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-open={state.isOpen || undefined}
        data-disabled={props.isDisabled || undefined}
        data-invalid={validation.isInvalid || undefined}
        data-required={props.isRequired || undefined} />
      <HiddenSelect
        autoComplete={props.autoComplete}
        state={state}
        triggerRef={buttonRef}
        label={label}
        name={props.name}
        isDisabled={props.isDisabled} />
    </Provider>
  );
}

export interface SelectValueRenderProps<T> {
  /**
   * Whether the value is a placeholder.
   * @selector [data-placeholder]
   */
  isPlaceholder: boolean,
  /** The object value of the currently selected item. */
  selectedItem: T | null,
  /** The textValue of the currently selected item. */
  selectedText: string | null
}

export interface SelectValueProps<T extends object> extends Omit<HTMLAttributes<HTMLElement>, keyof RenderProps<unknown>>, RenderProps<SelectValueRenderProps<T>> {}

export const SelectValueContext = createContext<ContextValue<SelectValueProps<any>, HTMLSpanElement>>(null);

/**
 * SelectValue renders the current value of a Select, or a placeholder if no value is selected.
 * It is usually placed within the button element.
 */
export const SelectValue = /*#__PURE__*/ (forwardRef as forwardRefType)(function SelectValue<T extends object>(props: SelectValueProps<T>, ref: ForwardedRef<HTMLSpanElement>) {
  [props, ref] = useContextProps(props, ref, SelectValueContext);
  let state = useContext(SelectStateContext)!;
  let {placeholder} = useSlottedContext(SelectContext)!;
  let selectedItem = state.selectedKey != null
    ? state.collection.getItem(state.selectedKey)
    : null;
  let rendered = selectedItem?.props.children;
  if (typeof rendered === 'function') {
    // If the selected item has a function as a child, we need to call it to render to React.JSX.
    let fn = rendered as (s: ItemRenderProps) => ReactNode;
    rendered = fn({
      isHovered: false,
      isPressed: false,
      isSelected: false,
      isFocused: false,
      isFocusVisible: false,
      isDisabled: false,
      selectionMode: 'single',
      selectionBehavior: 'toggle'
    });
  }

  let stringFormatter = useLocalizedStringFormatter(intlMessages, 'react-aria-components');

  let renderProps = useRenderProps({
    ...props,
    defaultChildren: rendered ?? placeholder ?? stringFormatter.format('selectPlaceholder'),
    defaultClassName: 'react-aria-SelectValue',
    values: {
      selectedItem: state.selectedItem?.value as T ?? null,
      selectedText: state.selectedItem?.textValue ?? null,
      isPlaceholder: !selectedItem
    }
  });

  let DOMProps = filterDOMProps(props);

  return (
    <span ref={ref} {...DOMProps} {...renderProps} data-placeholder={!selectedItem || undefined}>
      {/* clear description and error message slots */}
      <TextContext.Provider value={undefined}>
        {renderProps.children}
      </TextContext.Provider>
    </span>
  );
});
