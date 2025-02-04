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
import {classNames, dimensionValue, useFocusableRef, useIsMobileDevice, useResizeObserver, useUnwrapDOMRef} from '@react-spectrum/utils';
import {ClearButton} from '@react-spectrum/button';
import {DOMRefValue, FocusableRef} from '@react-types/shared';
import {Field} from '@react-spectrum/label';
import {filterDOMProps, useLayoutEffect} from '@react-aria/utils';
import {FocusRing} from '@react-aria/focus';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {ListBoxBase, useListBoxLayout} from '@react-spectrum/listbox';
import Magnifier from '@spectrum-icons/ui/Magnifier';
import {MobileSearchAutocomplete} from './MobileSearchAutocomplete';
import {Popover} from '@react-spectrum/overlays';
import {ProgressCircle} from '@react-spectrum/progress';
import React, {
  forwardRef,
  InputHTMLAttributes,
  ReactElement,
  RefObject,
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
import {useComboBoxState} from '@react-stately/combobox';
import {useFilter, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useFormProps} from '@react-spectrum/form';
import {useHover} from '@react-aria/interactions';
import {useProvider, useProviderProps} from '@react-spectrum/provider';
import {useSearchAutocomplete} from '@react-aria/autocomplete';

function SearchAutocomplete<T extends object>(props: SpectrumSearchAutocompleteProps<T>, ref: FocusableRef<HTMLElement>) {
  props = useProviderProps(props);
  props = useFormProps(props);

  if (props.placeholder) {
    console.warn('Placeholders are deprecated due to accessibility issues. Please use help text instead.');
  }

  let isMobile = useIsMobileDevice();
  if (isMobile) {
    // menuTrigger=focus/manual don't apply to mobile searchwithin
    return <MobileSearchAutocomplete {...props} menuTrigger="input" ref={ref} />;
  } else {
    return <SearchAutocompleteBase {...props} ref={ref} />;
  }
}

function ForwardSearchAutocompleteBase<T extends object>(props: SpectrumSearchAutocompleteProps<T>, ref: FocusableRef<HTMLElement>) {
  props = useProviderProps(props);

  let {
    menuTrigger = 'input',
    shouldFlip = true,
    direction = 'bottom',
    align = 'start',
    isQuiet,
    menuWidth: customMenuWidth,
    loadingState,
    onLoadMore,
    onSubmit = () => {},
    validate
  } = props;

  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/autocomplete');
  let isAsync = loadingState != null;
  let popoverRef = useRef<DOMRefValue<HTMLDivElement>>(null);
  let unwrappedPopoverRef = useUnwrapDOMRef(popoverRef);
  let listBoxRef = useRef(null);
  let inputRef = useRef<HTMLInputElement>(null);
  let domRef = useFocusableRef(ref, inputRef);

  let {contains} = useFilter({sensitivity: 'base'});
  let state = useComboBoxState(
    {
      ...props,
      defaultFilter: contains,
      allowsEmptyCollection: isAsync,
      allowsCustomValue: true,
      onSelectionChange: (key) => key !== null && onSubmit(null, key),
      selectedKey: undefined,
      defaultSelectedKey: undefined,
      validate: useCallback(v => validate?.(v.inputValue), [validate])
    }
  );
  let layout = useListBoxLayout();

  let {inputProps, listBoxProps, labelProps, clearButtonProps, descriptionProps, errorMessageProps, isInvalid, validationErrors, validationDetails} = useSearchAutocomplete(
    {
      ...props,
      layoutDelegate: layout,
      popoverRef: unwrappedPopoverRef,
      listBoxRef,
      inputRef,
      menuTrigger
    },
    state
  );

  // Measure the width of the inputfield to inform the width of the menu (below).
  let [menuWidth, setMenuWidth] = useState<number>(0);
  let {scale} = useProvider();

  let onResize = useCallback(() => {
    if (inputRef.current) {
      let inputWidth = inputRef.current.offsetWidth;
      setMenuWidth(inputWidth);
    }
  }, [inputRef, setMenuWidth]);

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

  return (
    <>
      <Field
        {...props}
        descriptionProps={descriptionProps}
        errorMessageProps={errorMessageProps}
        labelProps={labelProps}
        isInvalid={isInvalid}
        validationErrors={validationErrors}
        validationDetails={validationDetails}
        ref={domRef}>
        <SearchAutocompleteInput
          {...props}
          isOpen={state.isOpen}
          loadingState={loadingState}
          inputProps={inputProps}
          inputRef={inputRef}
          clearButtonProps={clearButtonProps}
          validationState={props.validationState || (isInvalid ? 'invalid' : undefined)} />
      </Field>
      <Popover
        state={state}
        UNSAFE_style={style}
        UNSAFE_className={classNames(styles, 'spectrum-InputGroup-popover', {'spectrum-InputGroup-popover--quiet': isQuiet})}
        ref={popoverRef}
        triggerRef={inputRef}
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
            <span className={classNames(searchAutocompleteStyles, 'no-results')}>
              {stringFormatter.format('noResults')}
            </span>
          )} />
      </Popover>
    </>
  );
}

let SearchAutocompleteBase = React.forwardRef(ForwardSearchAutocompleteBase) as <T>(props: SpectrumSearchAutocompleteProps<T> & {ref?: FocusableRef<HTMLElement>}) => ReactElement;


interface SearchAutocompleteInputProps<T> extends SpectrumSearchAutocompleteProps<T> {
  inputProps: InputHTMLAttributes<HTMLInputElement>,
  inputRef: RefObject<HTMLInputElement | null>,
  style?: React.CSSProperties,
  className?: string,
  isOpen?: boolean,
  clearButtonProps: AriaButtonProps
}

// any type is because we don't want to call useObjectRef because this is an internal component and we know
// we are always passing an object ref
function ForwardSearchAutocompleteInput<T>(props: SearchAutocompleteInputProps<T>, ref: any) {
  let searchIcon = (
    <Magnifier data-testid="searchicon" />
  );

  let {
    icon = searchIcon,
    isQuiet,
    isDisabled,
    isReadOnly,
    validationState,
    inputProps,
    inputRef,
    autoFocus,
    style,
    className,
    loadingState,
    isOpen,
    menuTrigger,
    clearButtonProps
  } = props;
  let {hoverProps, isHovered} = useHover({});
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/autocomplete');
  let domProps = filterDOMProps(props);
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
        ),
        classNames(
          searchStyles,
          'spectrum-Search-circleLoader'
        )
      )} />
  );

  let clearButton = (
    <ClearButton
      {...clearButtonProps}
      preventFocus
      UNSAFE_className={
        classNames(
          searchStyles,
          'spectrum-ClearButton'
        )
      }
      isDisabled={isDisabled} />
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
      if (timeout.current != null) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
    }

    lastInputValue.current = inputValue;
  }, [isLoading, showLoading, inputValue]);

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
            classNames(
              searchAutocompleteStyles,
              'searchautocomplete'
            ),
            className
          )
        }>
        <TextFieldBase
          {...domProps}
          inputProps={inputProps}
          inputRef={inputRef}
          UNSAFE_className={
            classNames(
              searchStyles,
              'spectrum-Search',
              'spectrum-Search--loadable',
              'spectrum-Textfield',
              {
                'is-disabled': isDisabled,
                'is-quiet': isQuiet,
                'spectrum-Search--invalid': validationState === 'invalid' && !isDisabled,
                'spectrum-Search--valid': validationState === 'valid' && !isDisabled
              },
              classNames(
                styles,
                'spectrum-InputGroup-field'
              )
            )
          }
          inputClassName={classNames(searchStyles, 'spectrum-Search-input')}
          validationIconClassName={
            classNames(
              searchStyles,
              'spectrum-Search-validationIcon'
            )
          }
          isDisabled={isDisabled}
          isQuiet={isQuiet}
          validationState={validationState}
          isLoading={showLoading && (isOpen || menuTrigger === 'manual' || loadingState === 'loading')}
          loadingIndicator={loadingState != null ? loadingCircle : undefined}
          icon={icon}
          wrapperChildren={(inputValue !== '' || loadingState === 'filtering' || validationState != null) && !isReadOnly ? clearButton : undefined}
          disableFocusRing />
      </div>
    </FocusRing>)
  );
}

let SearchAutocompleteInput = React.forwardRef(ForwardSearchAutocompleteInput) as <T>(props: SearchAutocompleteInputProps<T> & {ref?: any}) => ReactElement;


/**
 * A SearchAutocomplete is a searchfield that supports a dynamic list of suggestions.
 */
let ForwardSearchAutocomplete = forwardRef(SearchAutocomplete) as <T>(props: SpectrumSearchAutocompleteProps<T> & {ref?: FocusableRef<HTMLElement>}) => ReactElement;
export {ForwardSearchAutocomplete as SearchAutocomplete};
