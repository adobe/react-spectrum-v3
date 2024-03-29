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

import {CheckboxGroupContext} from './context';
import CheckmarkSmall from '@spectrum-icons/ui/CheckmarkSmall';
import {classNames, useFocusableRef, useStyleProps} from '@react-spectrum/utils';
import DashSmall from '@spectrum-icons/ui/DashSmall';
import {FocusableRef} from '@react-types/shared';
import {FocusRing} from '@react-aria/focus';
import React, {forwardRef, useContext, useRef} from 'react';
import {SpectrumCheckboxProps} from '@react-types/checkbox';
import styles from '@adobe/spectrum-css-temp/components/checkbox/vars.css';
import {useCheckbox, useCheckboxGroupItem} from '@react-aria/checkbox';
import {useFormProps} from '@react-spectrum/form';
import {useHover} from '@react-aria/interactions';
import {useProviderProps} from '@react-spectrum/provider';
import {useToggleState} from '@react-stately/toggle';

function Checkbox(props: SpectrumCheckboxProps, ref: FocusableRef<HTMLLabelElement>) {
  let originalProps = props;
  props = useProviderProps(props);
  props = useFormProps(props);
  let {
    isIndeterminate = false,
    isEmphasized = false,
    autoFocus,
    children,
    ...otherProps
  } = props;
  let {styleProps} = useStyleProps(otherProps);

  let inputRef = useRef<HTMLInputElement>(null);
  let domRef = useFocusableRef(ref, inputRef);

  // Swap hooks depending on whether this checkbox is inside a CheckboxGroup.
  // This is a bit unorthodox. Typically, hooks cannot be called in a conditional,
  // but since the checkbox won't move in and out of a group, it should be safe.
  let groupState = useContext(CheckboxGroupContext);
  let {inputProps, isInvalid, isDisabled} = groupState
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ? useCheckboxGroupItem({
      ...props,
      // Value is optional for standalone checkboxes, but required for CheckboxGroup items;
      // it's passed explicitly here to avoid typescript error (requires ignore).
      // @ts-ignore
      value: props.value,
      // Only pass isRequired and validationState to react-aria if they came from
      // the props for this individual checkbox, and not from the group via context.
      isRequired: originalProps.isRequired,
      validationState: originalProps.validationState,
      isInvalid: originalProps.isInvalid
    }, groupState, inputRef)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    : useCheckbox(props, useToggleState(props), inputRef);

  let {hoverProps, isHovered} = useHover({isDisabled});

  let markIcon = isIndeterminate
    ? <DashSmall UNSAFE_className={classNames(styles, 'spectrum-Checkbox-partialCheckmark')} />
    : <CheckmarkSmall UNSAFE_className={classNames(styles, 'spectrum-Checkbox-checkmark')} />;

  if (process.env.NODE_ENV !== 'production') {
    if (groupState) {
      for (let key of ['isSelected', 'defaultSelected', 'isEmphasized']) {
        if (originalProps[key] != null) {
          console.warn(`${key} is unsupported on individual <Checkbox> elements within a <CheckboxGroup>. Please apply these props to the group instead.`);
        }
      }
      if (props.value == null) {
        console.warn('A <Checkbox> element within a <CheckboxGroup> requires a `value` property.');
      }
    }
  }

  return (
    <label
      {...styleProps}
      {...hoverProps}
      ref={domRef}
      className={
        classNames(
          styles,
          'spectrum-Checkbox',
          {
            'is-checked': inputProps.checked,
            'is-indeterminate': isIndeterminate,
            'spectrum-Checkbox--quiet': !isEmphasized,
            'is-invalid': isInvalid,
            'is-disabled': isDisabled,
            'is-hovered': isHovered
          },
          styleProps.className
        )
      }>
      <FocusRing focusRingClass={classNames(styles, 'focus-ring')} autoFocus={autoFocus}>
        <input
          {...inputProps}
          ref={inputRef}
          className={classNames(styles, 'spectrum-Checkbox-input')} />
      </FocusRing>
      <span className={classNames(styles, 'spectrum-Checkbox-box')}>{markIcon}</span>
      {children && (
        <span className={classNames(styles, 'spectrum-Checkbox-label')}>
          {children}
        </span>
      )}
    </label>
  );
}
/**
 * Checkboxes allow users to select multiple items from a list of individual items,
 * or to mark one individual item as selected.
 */
let _Checkbox = forwardRef(Checkbox);
export {_Checkbox as Checkbox};
