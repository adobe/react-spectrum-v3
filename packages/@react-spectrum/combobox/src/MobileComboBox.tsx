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

import AlertMedium from '@spectrum-icons/ui/AlertMedium';
import {AriaButtonProps} from '@react-types/button';
import buttonStyles from '@adobe/spectrum-css-temp/components/button/vars.css';
import CheckmarkMedium from '@spectrum-icons/ui/CheckmarkMedium';
import ChevronDownMedium from '@spectrum-icons/ui/ChevronDownMedium';
import {classNames, unwrapDOMRef, useFocusableRef} from '@react-spectrum/utils';
import {ClearButton} from '@react-spectrum/button';
import {ComboBoxState, useComboBoxState} from '@react-stately/combobox';
import comboboxStyles from './combobox.css';
import {DismissButton, useOverlayTrigger} from '@react-aria/overlays';
import {Field} from '@react-spectrum/label';
import {FocusableRef, FocusableRefValue, ValidationState} from '@react-types/shared';
import {FocusRing, FocusScope} from '@react-aria/focus';
import {focusSafely, setInteractionModality, useHover} from '@react-aria/interactions';
// @ts-ignore
import intlMessages from '../intl/*.json';
import labelStyles from '@adobe/spectrum-css-temp/components/fieldlabel/vars.css';
import {ListBoxBase, useListBoxLayout} from '@react-spectrum/listbox';
import {mergeProps, useFormReset, useId, useObjectRef} from '@react-aria/utils';
import {ProgressCircle} from '@react-spectrum/progress';
import React, {ForwardedRef, HTMLAttributes, InputHTMLAttributes, ReactElement, ReactNode, useCallback, useEffect, useRef, useState} from 'react';
import searchStyles from '@adobe/spectrum-css-temp/components/search/vars.css';
import {SpectrumComboBoxProps} from '@react-types/combobox';
import styles from '@adobe/spectrum-css-temp/components/inputgroup/vars.css';
import {TextFieldBase} from '@react-spectrum/textfield';
import textfieldStyles from '@adobe/spectrum-css-temp/components/textfield/vars.css';
import {Tray} from '@react-spectrum/overlays';
import {useButton} from '@react-aria/button';
import {useComboBox} from '@react-aria/combobox';
import {useDialog} from '@react-aria/dialog';
import {useField} from '@react-aria/label';
import {useFilter, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useFormValidation} from '@react-aria/form';
import {useProviderProps} from '@react-spectrum/provider';

export const MobileComboBox = React.forwardRef(function MobileComboBox(props: SpectrumComboBoxProps<any>, ref: FocusableRef<HTMLElement>) {
  props = useProviderProps(props);

  let {
    isQuiet,
    isDisabled,
    isReadOnly,
    isRequired,
    validationBehavior,
    name,
    formValue = 'text',
    allowsCustomValue
  } = props;
  if (allowsCustomValue) {
    formValue = 'text';
  }

  let {contains} = useFilter({sensitivity: 'base'});
  let state = useComboBoxState({
    ...props,
    defaultFilter: contains,
    allowsEmptyCollection: true,
    // Needs to be false here otherwise we double up on commitSelection/commitCustomValue calls when
    // user taps on underlay (i.e. initial tap will call setFocused(false) -> commitSelection/commitCustomValue via onBlur,
    // then the closing of the tray will call setFocused(false) again due to cleanup effect)
    shouldCloseOnBlur: false
  });

  let buttonRef = useRef<HTMLDivElement>(null);
  let domRef = useFocusableRef(ref, buttonRef);
  let {triggerProps, overlayProps} = useOverlayTrigger({type: 'listbox'}, state, buttonRef);

  let inputRef = useRef<HTMLInputElement>(null);
  useFormValidation({
    ...props,
    focus: () => buttonRef.current?.focus()
  }, state, inputRef);
  let {isInvalid, validationErrors, validationDetails} = state.displayValidation;
  let validationState = props.validationState || (isInvalid ? 'invalid' : undefined);
  let errorMessage = props.errorMessage ?? validationErrors.join(' ');

  let {labelProps, fieldProps, descriptionProps, errorMessageProps} = useField({
    ...props,
    labelElementType: 'span',
    isInvalid,
    errorMessage
  });

  // Focus the button and show focus ring when clicking on the label
  labelProps.onClick = () => {
    if (!props.isDisabled) {
      buttonRef.current?.focus();
      setInteractionModality('keyboard');
    }
  };

  let inputProps: InputHTMLAttributes<HTMLInputElement> = {
    type: 'hidden',
    name,
    value: formValue === 'text' ? state.inputValue : String(state.selectedKey)
  };

  if (validationBehavior === 'native') {
    // Use a hidden <input type="text"> rather than <input type="hidden">
    // so that an empty value blocks HTML form submission when the field is required.
    inputProps.type = 'text';
    inputProps.hidden = true;
    inputProps.required = isRequired;
    // Ignore react warning.
    inputProps.onChange = () => {};
  }

  useFormReset(inputRef, String(inputProps.value ?? ''), formValue === 'text' ? state.setInputValue : state.setSelectedKey);

  return (
    <>
      <Field
        {...props}
        labelProps={labelProps}
        descriptionProps={descriptionProps}
        errorMessageProps={errorMessageProps}
        validationState={validationState}
        isInvalid={isInvalid}
        validationErrors={validationErrors}
        validationDetails={validationDetails}
        elementType="span"
        ref={domRef}
        includeNecessityIndicatorInAccessibilityName>
        <ComboBoxButton
          {...mergeProps(triggerProps, fieldProps, {autoFocus: props.autoFocus})}
          ref={buttonRef}
          isQuiet={isQuiet}
          isDisabled={isDisabled}
          isPlaceholder={!state.inputValue}
          validationState={validationState}
          onPress={() => !isReadOnly && state.open(null, 'manual')}>
          {state.inputValue || props.placeholder || ''}
        </ComboBoxButton>
      </Field>
      <input {...inputProps} ref={inputRef} />
      <Tray state={state} isFixedHeight {...overlayProps}>
        <ComboBoxTray
          {...props}
          onClose={state.close}
          overlayProps={overlayProps}
          state={state} />
      </Tray>
    </>
  );
});

interface ComboBoxButtonProps extends AriaButtonProps {
  isQuiet?: boolean,
  isDisabled?: boolean,
  isPlaceholder?: boolean,
  validationState?: ValidationState,
  children?: ReactNode,
  style?: React.CSSProperties,
  className?: string
}

export const ComboBoxButton = React.forwardRef(function ComboBoxButton(props: ComboBoxButtonProps, ref: ForwardedRef<HTMLDivElement>) {
  let {
    isQuiet,
    isDisabled,
    isPlaceholder,
    validationState,
    children,
    style,
    className
  } = props;
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/combobox');
  let valueId = useId();
  let invalidId = useId();
  let validationIcon = validationState === 'invalid'
    ? <AlertMedium id={invalidId} aria-label={stringFormatter.format('invalid')} />
    : <CheckmarkMedium />;

  let validation = React.cloneElement(validationIcon, {
    UNSAFE_className: classNames(
      textfieldStyles,
      'spectrum-Textfield-validationIcon',
      classNames(
        styles,
        'spectrum-InputGroup-input-validationIcon'
      )
    )
  });

  let objRef = useObjectRef(ref);
  let {hoverProps, isHovered} = useHover({});
  let {buttonProps, isPressed} = useButton({
    ...props,
    'aria-labelledby': [
      props['aria-labelledby'],
      props['aria-label'] && !props['aria-labelledby'] ? props.id : null,
      valueId,
      validationState === 'invalid' ? invalidId : null
    ].filter(Boolean).join(' '),
    elementType: 'div'
  }, objRef);

  return (
    (<FocusRing
      focusClass={classNames(styles, 'is-focused')}
      focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...mergeProps(hoverProps, buttonProps)}
        aria-haspopup="dialog"
        ref={objRef}
        style={{...style, outline: 'none'}}
        className={
          classNames(
            styles,
            'spectrum-InputGroup',
            {
              'spectrum-InputGroup--quiet': isQuiet,
              'is-disabled': isDisabled,
              'spectrum-InputGroup--invalid': validationState === 'invalid' && !isDisabled,
              'is-hovered': isHovered
            },
            classNames(
              comboboxStyles,
              'mobile-combobox'
            ),
            className
          )
        }>
        <div
          className={
            classNames(
              textfieldStyles,
              'spectrum-Textfield',
              {
                'spectrum-Textfield--invalid': validationState === 'invalid' && !isDisabled,
                'spectrum-Textfield--valid': validationState === 'valid' && !isDisabled,
                'spectrum-Textfield--quiet': isQuiet
              },
              classNames(
                styles,
                'spectrum-InputGroup-field'
              )
            )
          }>
          <div
            className={
              classNames(
                textfieldStyles,
                'spectrum-Textfield-input',
                {
                  'is-hovered': isHovered,
                  'is-placeholder': isPlaceholder,
                  'is-disabled': isDisabled
                },
                classNames(
                  styles,
                  'spectrum-InputGroup-input',
                  classNames(labelStyles, 'spectrum-Field-field')
                ),
                classNames(
                  comboboxStyles,
                  'mobile-input'
                )
              )
            }>
            <span
              id={valueId}
              className={
                classNames(
                  comboboxStyles,
                  'mobile-value'
                )
              }>
              {children}
            </span>
          </div>
          {validationState && !isDisabled ? validation : null}
        </div>
        <div
          className={
            classNames(
              buttonStyles,
              'spectrum-FieldButton',
              {
                'spectrum-FieldButton--quiet': isQuiet,
                'is-active': isPressed,
                'is-disabled': isDisabled,
                'spectrum-FieldButton--invalid': validationState === 'invalid' && !isDisabled,
                'is-hovered': isHovered
              },
              classNames(
                styles,
                'spectrum-FieldButton'
              )
            )
          }>
          <ChevronDownMedium UNSAFE_className={classNames(styles, 'spectrum-Dropdown-chevron')} />
        </div>
      </div>
    </FocusRing>)
  );
});

interface ComboBoxTrayProps extends SpectrumComboBoxProps<any> {
  state: ComboBoxState<any>,
  overlayProps: HTMLAttributes<HTMLElement>,
  loadingIndicator?: ReactElement,
  onClose: () => void
}

function ComboBoxTray(props: ComboBoxTrayProps) {
  let {
    // completionMode = 'suggest',
    state,
    isDisabled,
    validationState,
    label,
    overlayProps,
    loadingState,
    onLoadMore,
    onClose
  } = props;

  let timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  let [showLoading, setShowLoading] = useState(false);
  let inputRef = useRef<HTMLInputElement>(null);
  let buttonRef = useRef<FocusableRefValue<HTMLElement>>(null);
  let popoverRef = useRef<HTMLDivElement>(null);
  let listBoxRef = useRef<HTMLDivElement>(null);
  let isLoading = loadingState === 'loading' || loadingState === 'loadingMore';
  let layout = useListBoxLayout();
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/combobox');

  let {inputProps, listBoxProps, labelProps} = useComboBox(
    {
      ...props,
      // completionMode,
      layoutDelegate: layout,
      buttonRef: unwrapDOMRef(buttonRef),
      popoverRef: popoverRef,
      listBoxRef,
      inputRef,
      // Handled outside the tray.
      name: undefined
    },
    state
  );

  React.useEffect(() => {
    if (inputRef.current) {
      focusSafely(inputRef.current);
    }
  }, []);

  React.useEffect(() => {
    // When the tray closes, set state.isFocused (i.e. the tray input's focus tracker) to false.
    // This is to prevent state.isFocused from being set to true when the tray closes via tapping on the underlay
    // (FocusScope attempts to restore focus to the tray input when tapping outside the tray due to "contain")
    // Have to do this manually since React doesn't call onBlur when a component is unmounted: https://github.com/facebook/react/issues/12363
    if (!state.isOpen && state.isFocused) {
      state.setFocused(false);
    }
  });

  let {dialogProps} = useDialog({
    'aria-labelledby': useId(labelProps.id)
  }, popoverRef);

  // Override the role of the input to "searchbox" instead of "combobox".
  // Since the listbox is always visible, the combobox role doesn't really give us anything.
  // VoiceOver on iOS reads "double tap to collapse" when focused on the input rather than
  // "double tap to edit text", as with a textbox or searchbox. We'd like double tapping to
  // open the virtual keyboard rather than closing the tray.
  // Unlike "combobox", "aria-expanded" is not a valid attribute on "searchbox".
  inputProps.role = 'searchbox';
  inputProps['aria-haspopup'] = 'listbox';
  delete inputProps['aria-expanded'];
  delete inputProps.onTouchEnd;

  let clearButton = (
    <ClearButton
      preventFocus
      aria-label={stringFormatter.format('clear')}
      excludeFromTabOrder
      onPress={() => {
        state.setInputValue('');
        inputRef.current?.focus();
      }}
      UNSAFE_className={
        classNames(
          searchStyles,
          'spectrum-ClearButton'
        )
      }
      isDisabled={isDisabled} />
  );

  let loadingCircle = (
    <ProgressCircle
      aria-label={stringFormatter.format('loading')}
      size="S"
      isIndeterminate
      UNSAFE_className={classNames(
        searchStyles,
        'spectrum-Search-circleLoader',
        classNames(
          textfieldStyles,
          'spectrum-Textfield-circleLoader'
        )
      )} />
  );

  // Close the software keyboard on scroll to give the user a bigger area to scroll.
  // But only do this if scrolling with touch, otherwise it can cause issues with touch
  // screen readers.
  let isTouchDown = useRef(false);
  let onTouchStart = () => {
    isTouchDown.current = true;
  };

  let onTouchEnd = () => {
    isTouchDown.current = false;
  };

  let onScroll = useCallback(() => {
    if (!inputRef.current || document.activeElement !== inputRef.current || !isTouchDown.current) {
      return;
    }

    popoverRef.current?.focus();
  }, [inputRef, popoverRef, isTouchDown]);

  let inputValue = inputProps.value;
  let lastInputValue = useRef(inputValue);
  useEffect(() => {
    if (loadingState === 'filtering' && !showLoading) {
      if (timeout.current === null) {
        timeout.current = setTimeout(() => {
          setShowLoading(true);
        }, 500);
      }

      // If user is typing, clear the timer and restart since it is a new request
      if (inputValue !== lastInputValue.current) {
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
          setShowLoading(true);
        }, 500);
      }
    } else if (loadingState !== 'filtering') {
      // If loading is no longer happening, clear any timers and hide the loading circle
      setShowLoading(false);
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = null;
    }

    lastInputValue.current = inputValue;
  }, [loadingState, inputValue, showLoading]);

  let onKeyDown = (e) => {
    // Close virtual keyboard if user hits Enter w/o any focused options
    if (e.key === 'Enter' && state.selectionManager.focusedKey == null) {
      popoverRef.current?.focus();
    } else {
      inputProps.onKeyDown?.(e);
    }
  };

  return (
    <FocusScope restoreFocus contain>
      <div
        {...mergeProps(overlayProps, dialogProps)}
        ref={popoverRef}
        className={
          classNames(
            comboboxStyles,
            'tray-dialog'
          )
        }>
        <DismissButton onDismiss={onClose} />
        <TextFieldBase
          label={label}
          labelProps={labelProps}
          inputProps={{...inputProps, onKeyDown}}
          inputRef={inputRef}
          isDisabled={isDisabled}
          isLoading={showLoading && loadingState === 'filtering'}
          loadingIndicator={loadingState != null ? loadingCircle : undefined}
          validationState={validationState}
          labelAlign="start"
          labelPosition="top"
          wrapperChildren={(state.inputValue !== '' || loadingState === 'filtering' || validationState != null) && !props.isReadOnly ? clearButton : undefined}
          UNSAFE_className={
            classNames(
              searchStyles,
              'spectrum-Search',
              'spectrum-Textfield',
              'spectrum-Search--loadable',
              {
                'spectrum-Search--invalid': validationState === 'invalid' && !isDisabled,
                'spectrum-Search--valid': validationState === 'valid' && !isDisabled
              },
              classNames(
                comboboxStyles,
                'tray-textfield',
                {
                  'has-label': !!props.label
                }
              )
            )
          }
          inputClassName={
            classNames(
              comboboxStyles,
              'tray-textfield-input',
              classNames(
                searchStyles,
                'spectrum-Search-input'
              )
            )
          }
          validationIconClassName={
            classNames(
              searchStyles,
              'spectrum-Search-validationIcon'
            )
          } />
        <ListBoxBase
          {...listBoxProps}
          domProps={{onTouchStart, onTouchEnd}}
          disallowEmptySelection
          shouldSelectOnPressUp
          focusOnPointerEnter
          layout={layout}
          state={state}
          shouldUseVirtualFocus
          renderEmptyState={() => loadingState !== 'loading' && (
            <span className={classNames(comboboxStyles, 'no-results')}>
              {stringFormatter.format('noResults')}
            </span>
          )}
          UNSAFE_className={
            classNames(
              comboboxStyles,
              'tray-listbox'
            )
          }
          ref={listBoxRef}
          onScroll={onScroll}
          onLoadMore={onLoadMore}
          isLoading={isLoading} />
        <DismissButton onDismiss={onClose} />
      </div>
    </FocusScope>
  );
}
