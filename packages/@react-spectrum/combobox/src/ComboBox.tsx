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
import ChevronDownMedium from '@spectrum-icons/ui/ChevronDownMedium';
import {
  classNames,
  dimensionValue,
  useFocusableRef,
  useIsMobileDevice,
  useResizeObserver,
  useUnwrapDOMRef
} from '@react-spectrum/utils';
import comboboxStyles from './combobox.css';
import {DOMRefValue, FocusableRef, FocusableRefValue} from '@react-types/shared';
import {Field} from '@react-spectrum/label';
import {FieldButton} from '@react-spectrum/button';
import {FocusRing} from '@react-aria/focus';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {ListBoxBase, useListBoxLayout} from '@react-spectrum/listbox';
import {MobileComboBox} from './MobileComboBox';
import {Popover} from '@react-spectrum/overlays';
import {PressResponder, useHover} from '@react-aria/interactions';
import {ProgressCircle} from '@react-spectrum/progress';
import React, {
  ForwardedRef,
  InputHTMLAttributes,
  ReactElement,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import {SpectrumComboBoxProps} from '@react-types/combobox';
import styles from '@adobe/spectrum-css-temp/components/inputgroup/vars.css';
import {TextFieldBase} from '@react-spectrum/textfield';
import textfieldStyles from '@adobe/spectrum-css-temp/components/textfield/vars.css';
import {useComboBox} from '@react-aria/combobox';
import {useComboBoxState} from '@react-stately/combobox';
import {useFilter, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useFormProps} from '@react-spectrum/form';
import {useLayoutEffect} from '@react-aria/utils';
import {useProvider, useProviderProps} from '@react-spectrum/provider';

/**
 * ComboBoxes combine a text entry with a picker menu, allowing users to filter longer lists to only the selections matching a query.
 */
export const ComboBox = React.forwardRef(function ComboBox<T extends object>(props: SpectrumComboBoxProps<T>, ref: FocusableRef<HTMLElement>) {
  props = useProviderProps(props);
  props = useFormProps(props);

  if (props.placeholder) {
    console.warn('Placeholders are deprecated due to accessibility issues. Please use help text instead. See the docs for details: https://react-spectrum.adobe.com/react-spectrum/ComboBox.html#help-text');
  }

  let isMobile = useIsMobileDevice();
  if (isMobile) {
    // menuTrigger=focus/manual don't apply to mobile combobox
    return <MobileComboBox {...props} menuTrigger="input" ref={ref} />;
  } else {
    return <ComboBoxBase {...props} ref={ref} />;
  }
}) as <T>(props: SpectrumComboBoxProps<T> & {ref?: FocusableRef<HTMLElement>}) => ReactElement;

const ComboBoxBase = React.forwardRef(function ComboBoxBase(props: SpectrumComboBoxProps<any>, ref: FocusableRef<HTMLElement>) {
  let {
    menuTrigger = 'input',
    shouldFlip = true,
    direction = 'bottom',
    align = 'start',
    isQuiet,
    loadingState,
    onLoadMore,
    allowsCustomValue,
    menuWidth: customMenuWidth,
    name,
    formValue = 'text'
  } = props;
  if (allowsCustomValue) {
    formValue = 'text';
  }

  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/combobox');
  let isAsync = loadingState != null;
  let popoverRef = useRef<DOMRefValue<HTMLDivElement>>(null);
  let unwrappedPopoverRef = useUnwrapDOMRef(popoverRef);
  let buttonRef = useRef<FocusableRefValue<HTMLElement>>(null);
  let unwrappedButtonRef = useUnwrapDOMRef(buttonRef);
  let listBoxRef = useRef(null);
  let inputRef = useRef<HTMLInputElement>(null);
  // serve as the new popover `triggerRef` instead of `unwrappedButtonRef` before for better positioning.
  let inputGroupRef = useRef<HTMLDivElement>(null);
  let domRef = useFocusableRef(ref, inputRef);

  let {contains} = useFilter({sensitivity: 'base'});
  let state = useComboBoxState(
    {
      ...props,
      defaultFilter: contains,
      allowsEmptyCollection: isAsync
    }
  );
  let layout = useListBoxLayout();

  let {buttonProps, inputProps, listBoxProps, labelProps, descriptionProps, errorMessageProps, isInvalid, validationErrors, validationDetails} = useComboBox(
    {
      ...props,
      layoutDelegate: layout,
      buttonRef: unwrappedButtonRef,
      popoverRef: unwrappedPopoverRef,
      listBoxRef,
      inputRef: inputRef,
      menuTrigger,
      name: formValue === 'text' ? name : undefined
    },
    state
  );

  // Measure the width of the inputfield and the button to inform the width of the menu (below).
  let [menuWidth, setMenuWidth] = useState<number | undefined>(undefined);
  let {scale} = useProvider();

  let onResize = useCallback(() => {
    if (unwrappedButtonRef.current && inputRef.current) {
      let buttonWidth = unwrappedButtonRef.current.offsetWidth;
      let inputWidth = inputRef.current.offsetWidth;
      setMenuWidth(buttonWidth + inputWidth);
    }
  }, [unwrappedButtonRef, inputRef, setMenuWidth]);

  useResizeObserver({
    ref: domRef,
    onResize: onResize
  });

  useLayoutEffect(onResize, [scale, onResize]);

  let width = isQuiet ? undefined : menuWidth;
  let style = {
    width: customMenuWidth ? dimensionValue(customMenuWidth) : width,
    minWidth: isQuiet ? `calc(${menuWidth}px + calc(2 * var(--spectrum-dropdown-quiet-offset)))` : menuWidth
  };
  let cbInputProps = {...props, children: null};

  return (
    <>
      <Field
        {...props}
        descriptionProps={descriptionProps}
        errorMessageProps={errorMessageProps}
        isInvalid={isInvalid}
        validationErrors={validationErrors}
        validationDetails={validationDetails}
        labelProps={labelProps}
        ref={domRef}>
        <ComboBoxInput
          {...cbInputProps}
          isOpen={state.isOpen}
          loadingState={loadingState}
          inputProps={inputProps}
          inputRef={inputRef}
          triggerProps={buttonProps}
          triggerRef={buttonRef}
          validationState={props.validationState || (isInvalid ? 'invalid' : undefined)}
          ref={inputGroupRef} />
      </Field>
      {name && formValue === 'key' && <input type="hidden" name={name} value={state.selectedKey ?? ''} />}
      <Popover
        state={state}
        UNSAFE_style={style}
        UNSAFE_className={classNames(styles, 'spectrum-InputGroup-popover', {'spectrum-InputGroup-popover--quiet': isQuiet})}
        ref={popoverRef}
        triggerRef={inputGroupRef}
        scrollRef={listBoxRef}
        placement={`${direction} ${align}`}
        hideArrow
        isNonModal
        shouldFlip={shouldFlip}>
        <ListBoxBase
          {...listBoxProps}
          ref={listBoxRef}
          disallowEmptySelection
          autoFocus={state.focusStrategy ?? undefined}
          shouldSelectOnPressUp
          focusOnPointerEnter
          layout={layout}
          state={state}
          shouldUseVirtualFocus
          isLoading={loadingState === 'loading' || loadingState === 'loadingMore'}
          showLoadingSpinner={loadingState === 'loadingMore'}
          onLoadMore={onLoadMore}
          renderEmptyState={() => isAsync && (
            <span className={classNames(comboboxStyles, 'no-results')}>
              {loadingState === 'loading' ? stringFormatter.format('loading') :  stringFormatter.format('noResults')}
            </span>
          )} />
      </Popover>
    </>
  );
});

interface ComboBoxInputProps extends SpectrumComboBoxProps<unknown> {
  inputProps: InputHTMLAttributes<HTMLInputElement>,
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  triggerProps: AriaButtonProps,
  triggerRef: RefObject<FocusableRefValue<HTMLElement> | null>,
  style?: React.CSSProperties,
  className?: string,
  isOpen?: boolean
}

const ComboBoxInput = React.forwardRef(function ComboBoxInput(props: ComboBoxInputProps, ref: ForwardedRef<HTMLElement | null>) {
  let {
    isQuiet,
    isDisabled,
    validationState,
    inputProps,
    inputRef,
    triggerProps,
    triggerRef,
    autoFocus,
    style,
    className,
    loadingState,
    isOpen,
    menuTrigger
  } = props;
  let {hoverProps, isHovered} = useHover({});
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/combobox');
  let timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  let [showLoading, setShowLoading] = useState(false);

  let loadingCircle = (
    <ProgressCircle
      aria-label={stringFormatter.format('loading')}
      size="S"
      isIndeterminate
      UNSAFE_className={classNames(
        textfieldStyles,
        'spectrum-Textfield-circleLoader',
        classNames(
          styles,
          'spectrum-InputGroup-input-circleLoader'
        )
      )} />
  );

  let isLoading = loadingState === 'loading' || loadingState === 'filtering';
  let inputValue = inputProps.value;
  let lastInputValue = useRef(inputValue);
  useEffect(() => {
    if (isLoading && !showLoading) {
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
    } else if (!isLoading) {
      // If loading is no longer happening, clear any timers and hide the loading circle
      setShowLoading(false);
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = null;
    }

    lastInputValue.current = inputValue;
  }, [isLoading, showLoading, inputValue]);

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = null;
    };
  }, []);

  return (
    (<FocusRing
      within
      focusClass={classNames(styles, 'is-focused')}
      focusRingClass={classNames(styles, 'focus-ring')}
      autoFocus={autoFocus}>
      <div
        {...hoverProps}
        ref={ref as RefObject<HTMLDivElement | null>}
        style={style}
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
            className
          )
        }>
        <TextFieldBase
          inputProps={inputProps}
          inputRef={inputRef}
          UNSAFE_className={
            classNames(
              styles,
              'spectrum-InputGroup-field'
            )
          }
          inputClassName={
            classNames(
              styles,
              'spectrum-InputGroup-input'
            )
          }
          validationIconClassName={
            classNames(
              styles,
              'spectrum-InputGroup-input-validationIcon'
            )
          }
          isDisabled={isDisabled}
          isQuiet={isQuiet}
          validationState={validationState}
          // loading circle should only be displayed if menu is open, if menuTrigger is "manual", or first time load (to stop circle from showing up when user selects an option)
          // TODO: add special case for completionMode: complete as well
          isLoading={showLoading && (isOpen || menuTrigger === 'manual' || loadingState === 'loading')}
          loadingIndicator={loadingState != null ? loadingCircle : undefined}
          disableFocusRing />
        <PressResponder preventFocusOnPress isPressed={isOpen}>
          <FieldButton
            {...triggerProps}
            ref={triggerRef}
            UNSAFE_className={
              classNames(
                styles,
                'spectrum-FieldButton'
              )
            }
            isQuiet={isQuiet}
            validationState={validationState}>
            <ChevronDownMedium UNSAFE_className={classNames(styles, 'spectrum-Dropdown-chevron')} />
          </FieldButton>
        </PressResponder>
      </div>
    </FocusRing>)
  );
});
