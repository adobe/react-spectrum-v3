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
import CheckmarkMedium from '@spectrum-icons/ui/CheckmarkMedium';
import {classNames, useFocusableRef} from '@react-spectrum/utils';
import {ClearButton} from '@react-spectrum/button';
import {ComboBoxState, useComboBoxState} from '@react-stately/combobox';
import {DismissButton, useOverlayTrigger} from '@react-aria/overlays';
import {Field} from '@react-spectrum/label';
import {FocusableRef, ValidationState} from '@react-types/shared';
import {focusSafely, setInteractionModality, useHover} from '@react-aria/interactions';
import {FocusScope, useFocusRing} from '@react-aria/focus';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {ListBoxBase, useListBoxLayout} from '@react-spectrum/listbox';
import Magnifier from '@spectrum-icons/ui/Magnifier';
import {mergeProps, useFormReset, useId} from '@react-aria/utils';
import {ProgressCircle} from '@react-spectrum/progress';
import React, {
  HTMLAttributes,
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import searchAutocompleteStyles from './searchautocomplete.css';
import searchStyles from '@adobe/spectrum-css-temp/components/search/vars.css';
import {SpectrumSearchAutocompleteProps} from '@react-types/autocomplete';
import styles from '@adobe/spectrum-css-temp/components/inputgroup/vars.css';
import {TextFieldBase} from '@react-spectrum/textfield';
import textfieldStyles from '@adobe/spectrum-css-temp/components/textfield/vars.css';
import {Tray} from '@react-spectrum/overlays';
import {useButton} from '@react-aria/button';
import {useDialog} from '@react-aria/dialog';
import {useField} from '@react-aria/label';
import {useFilter, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useFormValidation} from '@react-aria/form';
import {useProviderProps} from '@react-spectrum/provider';
import {useSearchAutocomplete} from '@react-aria/autocomplete';

function ForwardMobileSearchAutocomplete<T extends object>(props: SpectrumSearchAutocompleteProps<T>, ref: FocusableRef<HTMLElement>) {
  props = useProviderProps(props);

  let {
    isQuiet,
    isDisabled,
    isRequired,
    validationBehavior,
    validate,
    name,
    isReadOnly,
    onSubmit = () => {}
  } = props;

  let {contains} = useFilter({sensitivity: 'base'});
  let state = useComboBoxState({
    ...props,
    defaultFilter: contains,
    allowsEmptyCollection: true,
    // Needs to be false here otherwise we double up on commitSelection/commitCustomValue calls when
    // user taps on underlay (i.e. initial tap will call setFocused(false) -> commitSelection/commitCustomValue via onBlur,
    // then the closing of the tray will call setFocused(false) again due to cleanup effect)
    shouldCloseOnBlur: false,
    allowsCustomValue: true,
    onSelectionChange: (key) => key !== null && onSubmit(null, key),
    selectedKey: undefined,
    defaultSelectedKey: undefined,
    validate: useCallback(v => validate?.(v.inputValue), [validate])
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
    if (!props.isDisabled && buttonRef.current) {
      buttonRef.current.focus();
      setInteractionModality('keyboard');
    }
  };

  let inputProps: InputHTMLAttributes<HTMLInputElement> = {
    type: 'hidden',
    name,
    value: state.inputValue
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

  useFormReset(inputRef, state.inputValue, state.setInputValue);

  return (
    <>
      <Field
        {...props}
        labelProps={labelProps}
        descriptionProps={descriptionProps}
        errorMessageProps={errorMessageProps}
        isInvalid={isInvalid}
        validationErrors={validationErrors}
        validationDetails={validationDetails}
        elementType="span"
        ref={domRef}
        includeNecessityIndicatorInAccessibilityName>
        <SearchAutocompleteButton
          {...mergeProps(triggerProps, fieldProps, {autoFocus: props.autoFocus, icon: props.icon})}
          ref={buttonRef}
          isQuiet={isQuiet}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isPlaceholder={!state.inputValue}
          validationState={validationState}
          inputValue={state.inputValue}
          clearInput={() => state.setInputValue('')}
          onPress={() => !isReadOnly && state.open(null, 'manual')}>
          {state.inputValue || props.placeholder || ''}
        </SearchAutocompleteButton>
      </Field>
      <input {...inputProps} ref={inputRef} />
      <Tray state={state} isFixedHeight {...overlayProps}>
        <SearchAutocompleteTray
          {...props}
          onClose={state.close}
          overlayProps={overlayProps}
          state={state} />
      </Tray>
    </>
  );
}

export let MobileSearchAutocomplete = React.forwardRef(ForwardMobileSearchAutocomplete) as <T>(props: SpectrumSearchAutocompleteProps<T> & {ref?: FocusableRef<HTMLElement>}) => ReactElement;


interface SearchAutocompleteButtonProps extends AriaButtonProps {
  icon?: ReactElement | null,
  isQuiet?: boolean,
  isDisabled?: boolean,
  isReadOnly?: boolean,
  isPlaceholder?: boolean,
  validationState?: ValidationState,
  inputValue?: string,
  clearInput?: () => void,
  children?: ReactNode,
  style?: React.CSSProperties,
  className?: string
}

// any type is because we don't want to call useObjectRef because this is an internal component and we know
// we are always passing an object ref
const SearchAutocompleteButton = React.forwardRef(function SearchAutocompleteButton(props: SearchAutocompleteButtonProps, ref: any) {
  let searchIcon = (
    <Magnifier data-testid="searchicon" />
  );

  let {
    icon = searchIcon,
    isQuiet,
    isDisabled,
    isReadOnly,
    isPlaceholder,
    validationState,
    inputValue,
    clearInput,
    children,
    style,
    className
} = props;
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/autocomplete');
  let valueId = useId();
  let invalidId = useId();
  let validationIcon = validationState === 'invalid'
    ? <AlertMedium id={invalidId} aria-label={stringFormatter.format('invalid')} />
    : <CheckmarkMedium />;

  if (icon) {
    icon = React.cloneElement(icon, {
      UNSAFE_className: classNames(
        textfieldStyles,
        'spectrum-Textfield-icon'
      ),
      size: 'S'
    });
  }

  let clearButton = (
    <ClearButton
      onPress={(e) => {
        clearInput?.();
        props?.onPress?.(e);
      }}
      preventFocus
      aria-label={stringFormatter.format('clear')}
      excludeFromTabOrder
      UNSAFE_className={
        classNames(
          searchStyles,
          'spectrum-ClearButton'
        )
      }
      isDisabled={isDisabled} />
  );

  let validation = React.cloneElement(validationIcon, {
    UNSAFE_className: classNames(
      textfieldStyles,
      'spectrum-Textfield-validationIcon',
      classNames(
        styles,
        'spectrum-InputGroup-input-validationIcon'
      ),
      classNames(
        searchStyles,
        'spectrum-Search-validationIcon'
      )
    )
  });

  let {hoverProps, isHovered} = useHover({});
  let {isFocused, isFocusVisible, focusProps} = useFocusRing();
  let {buttonProps} = useButton({
    ...props,
    'aria-labelledby': [
      props['aria-labelledby'],
      props['aria-label'] && !props['aria-labelledby'] ? props.id : null,
      valueId,
      validationState === 'invalid' ? invalidId : null
    ].filter(Boolean).join(' '),
    elementType: 'div'
  }, ref);

  return (
    <div
      {...mergeProps(hoverProps, focusProps, buttonProps)}
      aria-haspopup="dialog"
      ref={ref}
      style={{...style, outline: 'none'}}
      className={
        classNames(
          styles,
          'spectrum-InputGroup',
          {
            'spectrum-InputGroup--quiet': isQuiet,
            'is-disabled': isDisabled,
            'spectrum-InputGroup--invalid': validationState === 'invalid' && !isDisabled,
            'is-hovered': isHovered,
            'is-focused': isFocused,
            'focus-ring': isFocusVisible
          },
          classNames(
            searchAutocompleteStyles,
            'searchautocomplete',
            'mobile-searchautocomplete'
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
              searchStyles,
              'spectrum-Search',
              'spectrum-Search--loadable',
              {
                'is-disabled': isDisabled,
                'is-quiet': isQuiet,
                'spectrum-Search--invalid': validationState === 'invalid' && !isDisabled,
                'spectrum-Search--valid': validationState === 'valid' && !isDisabled
              }
            ),
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
                'spectrum-Textfield-inputIcon': !!icon,
                'is-hovered': isHovered,
                'is-placeholder': isPlaceholder,
                'is-disabled': isDisabled,
                'is-quiet': isQuiet,
                'is-focused': isFocused
              },
              classNames(
                searchStyles,
                'spectrum-Search-input'
              ),
              classNames(
                searchAutocompleteStyles,
                'mobile-input'
              )
            )
          }>
          {icon}
          <span
            id={valueId}
            className={
              classNames(
                searchAutocompleteStyles,
                'mobile-value'
              )
            }>
            {children}
          </span>
        </div>
        {validationState && !isDisabled ? validation : null}
        {(inputValue !== '' || validationState != null) && !isReadOnly && clearButton}
      </div>
    </div>
  );
});

interface SearchAutocompleteTrayProps<T> extends SpectrumSearchAutocompleteProps<T> {
  state: ComboBoxState<T>,
  overlayProps: HTMLAttributes<HTMLElement>,
  loadingIndicator?: ReactElement,
  onClose: () => void
}

function SearchAutocompleteTray<T>(props: SearchAutocompleteTrayProps<T>) {
  let searchIcon = (
    <Magnifier data-testid="searchicon" />
  );

  let {
    // completionMode = 'suggest',
    state,
    icon = searchIcon,
    isDisabled,
    validationState,
    label,
    overlayProps,
    loadingState,
    onLoadMore,
    onClose,
    onSubmit
  } = props;

  let timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  let [showLoading, setShowLoading] = useState(false);
  let inputRef = useRef<HTMLInputElement>(null);
  let popoverRef = useRef<HTMLDivElement>(null);
  let listBoxRef = useRef<HTMLDivElement>(null);
  let isLoading = loadingState === 'loading' || loadingState === 'loadingMore';
  let layout = useListBoxLayout();
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/autocomplete');

  let {inputProps, listBoxProps, labelProps, clearButtonProps} = useSearchAutocomplete<T>(
    {
      ...props,
      layoutDelegate: layout,
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
  inputProps.role = 'searchbox';
  inputProps['aria-haspopup'] = 'listbox';
  delete inputProps.onTouchEnd;

  let clearButton = (
    <ClearButton
      {...clearButtonProps}
      preventFocus
      aria-label={stringFormatter.format('clear')}
      excludeFromTabOrder
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

    if (popoverRef.current) {
      popoverRef.current.focus();
    }
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
      if (timeout.current !== null) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
    }

    lastInputValue.current = inputValue;
  }, [loadingState, inputValue, showLoading]);

  let onKeyDown = (e) => {
    // Close virtual keyboard, close tray, and fire onSubmit if user hits Enter w/o any focused options
    if (e.key === 'Enter' && state.selectionManager.focusedKey == null) {
      popoverRef.current?.focus();
      if (onClose) {
        onClose();
      }
      if (onSubmit) {
        onSubmit(inputValue == null ? null : inputValue.toString(), null);
      }
    } else {
      if (inputProps.onKeyDown) {
        inputProps.onKeyDown(e);
      }
    }
  };

  if (icon) {
    icon = React.cloneElement(icon, {
      UNSAFE_className: classNames(
          textfieldStyles,
          'spectrum-Textfield-icon'
          ),
      size: 'S'
    });
  }

  return (
    <FocusScope restoreFocus contain>
      <div
        {...mergeProps(overlayProps, dialogProps)}
        ref={popoverRef}
        className={
          classNames(
            searchAutocompleteStyles,
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
          wrapperChildren={((state.inputValue !== '' || loadingState === 'filtering' || validationState != null) && !props.isReadOnly) ? clearButton : undefined}
          icon={icon}
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
                searchAutocompleteStyles,
                'tray-textfield',
                {
                  'has-label': !!props.label
                }
              )
            )
          }
          inputClassName={
            classNames(
              searchStyles,
              'spectrum-Search-input'
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
            <span className={classNames(searchAutocompleteStyles, 'no-results')}>
              {stringFormatter.format('noResults')}
            </span>
          )}
          UNSAFE_className={
            classNames(
              searchAutocompleteStyles,
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
