/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {DismissButton, useOverlay} from '@react-aria/overlays';
import {FocusScope} from '@react-aria/focus';
import React from 'react';
import {useButton} from '@react-aria/button';
import {useComboBox} from '@react-aria/combobox';
import {useComboBoxState} from '@react-stately/combobox';
import {useFilter} from '@react-aria/i18n';
import {useListBox, useOption} from '@react-aria/listbox';

export function ComboBox(props) {
  // Setup filter function and state.
  let {contains} = useFilter({sensitivity: 'base'});
  let state = useComboBoxState({...props, defaultFilter: contains});

  // Setup refs and get props for child elements.
  let buttonRef = React.useRef(null);
  let inputRef = React.useRef(null);
  let listBoxRef = React.useRef(null);
  let popoverRef = React.useRef(null);

  let {buttonProps: triggerProps, inputProps, listBoxProps, labelProps} = useComboBox(
    {
      ...props,
      inputRef,
      buttonRef,
      listBoxRef,
      popoverRef
    },
    state
  );

  // Call useButton to get props for the button element. Alternatively, you can
  // pass the triggerProps to a separate Button component using useButton
  // that you might already have in your component library.
  let {buttonProps} = useButton(triggerProps, buttonRef);

  return (
    <div style={{display: 'inline-flex', flexDirection: 'column'}}>
      <label {...labelProps}>{props.label}</label>
      <div style={{position: 'relative', display: 'inline-block'}}>
        <input
          {...inputProps}
          ref={inputRef}
          style={{
            height: 24,
            boxSizing: 'border-box',
            marginRight: 0,
            fontSize: 16
          }} />
        <button
          {...buttonProps}
          ref={buttonRef}
          style={{
            height: 24,
            marginLeft: 0
          }}>
          <span
            aria-hidden="true"
            style={{padding: '0 2px'}}>
            ▼
          </span>
        </button>
        {state.isOpen &&
          <Popover popoverRef={popoverRef} isOpen={state.isOpen} onClose={state.close}>
            <ListBox
              {...listBoxProps}
              listBoxRef={listBoxRef}
              state={state} />
          </Popover>
        }
      </div>
    </div>
  );
}

function Popover(props) {
  let ref = React.useRef(null);
  let {
    popoverRef = ref,
    isOpen,
    onClose,
    children
  } = props;

  // Handle events that should cause the popup to close,
  // e.g. blur, clicking outside, or pressing the escape key.
  let {overlayProps} = useOverlay({
    isOpen,
    onClose,
    shouldCloseOnBlur: true,
    isDismissable: true
  }, popoverRef);

  // Add a hidden <DismissButton> component at the end of the popover
  // to allow screen reader users to dismiss the popup easily.
  return (
    <FocusScope restoreFocus>
      <div
        {...overlayProps}
        ref={popoverRef}
        style={{
          position: 'absolute',
          width: '100%',
          border: '1px solid gray',
          background: 'lightgray',
          marginTop: 4
        }}>
        {children}
        <DismissButton onDismiss={onClose} />
      </div>
    </FocusScope>
  );
}


function ListBox(props) {
  let ref = React.useRef();
  let {listBoxRef = ref, state} = props;
  let {listBoxProps} = useListBox(props, state, listBoxRef);

  return (
    <ul
      {...listBoxProps}
      ref={listBoxRef}
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        maxHeight: '150px',
        overflow: 'auto'
      }}>
      {[...state.collection].map(item => (
        <Option
          key={item.key}
          item={item}
          state={state} />
      ))}
    </ul>
  );
}

function Option({item, state}) {
  let ref = React.useRef<HTMLLIElement>(null);
  let {optionProps, isSelected, isFocused, isDisabled} = useOption({key: item.key}, state, ref);

  let backgroundColor;
  let color = 'black';

  if (isSelected) {
    backgroundColor = 'blueviolet';
    color = 'white';
  } else if (isFocused) {
    backgroundColor = 'gray';
  } else if (isDisabled) {
    backgroundColor = 'transparent';
    color = 'gray';
  }

  return (
    <li
      {...optionProps}
      ref={ref}
      style={{
        background: backgroundColor,
        color: color,
        padding: '2px 5px',
        outline: 'none',
        cursor: 'pointer'
      }}>
      {item.rendered}
    </li>
  );
}
