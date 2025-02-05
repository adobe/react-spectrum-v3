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

import {DOMAttributes, FocusableDOMProps, FocusableElement, FocusableProps, RefObject} from '@react-types/shared';
import {focusSafely} from './';
import {isFocusable, mergeProps, mergeRefs, useObjectRef, useSyncRef} from '@react-aria/utils';
import React, {ForwardedRef, forwardRef, MutableRefObject, ReactElement, ReactNode, useContext, useEffect, useRef} from 'react';
import {useFocus} from './useFocus';
import {useKeyboard} from './useKeyboard';

export interface FocusableOptions<T = FocusableElement> extends FocusableProps<T>, FocusableDOMProps {
  /** Whether focus should be disabled. */
  isDisabled?: boolean
}

export interface FocusableProviderProps extends DOMAttributes {
  /** The child element to provide DOM props to. */
  children?: ReactNode
}

interface FocusableContextValue extends FocusableProviderProps {
  ref?: MutableRefObject<FocusableElement | null>
}

let FocusableContext = React.createContext<FocusableContextValue | null>(null);

function useFocusableContext(ref: RefObject<FocusableElement | null>): FocusableContextValue {
  let context = useContext(FocusableContext) || {};
  useSyncRef(context, ref);

  // eslint-disable-next-line
  let {ref: _, ...otherProps} = context;
  return otherProps;
}

/**
 * Provides DOM props to the nearest focusable child.
 */
export const FocusableProvider = React.forwardRef(function FocusableProvider(props: FocusableProviderProps, ref: ForwardedRef<FocusableElement>) {
  let {children, ...otherProps} = props;
  let objRef = useObjectRef(ref);
  let context = {
    ...otherProps,
    ref: objRef
  };

  return (
    <FocusableContext.Provider value={context}>
      {children}
    </FocusableContext.Provider>
  );
});

export interface FocusableAria {
  /** Props for the focusable element. */
  focusableProps: DOMAttributes
}

/**
 * Used to make an element focusable and capable of auto focus.
 */
export function useFocusable<T extends FocusableElement = FocusableElement>(props: FocusableOptions<T>, domRef: RefObject<FocusableElement | null>): FocusableAria {
  let {focusProps} = useFocus(props);
  let {keyboardProps} = useKeyboard(props);
  let interactions = mergeProps(focusProps, keyboardProps);
  let domProps = useFocusableContext(domRef);
  let interactionProps = props.isDisabled ? {} : domProps;
  let autoFocusRef = useRef(props.autoFocus);

  useEffect(() => {
    if (autoFocusRef.current && domRef.current) {
      focusSafely(domRef.current);
    }
    autoFocusRef.current = false;
  }, [domRef]);

  // Always set a tabIndex so that Safari allows focusing native buttons and inputs.
  let tabIndex: number | undefined = props.excludeFromTabOrder ? -1 : 0;
  if (props.isDisabled) {
    tabIndex = undefined;
  }

  return {
    focusableProps: mergeProps(
      {
        ...interactions,
        tabIndex
      },
      interactionProps
    )
  };
}

export interface FocusableComponentProps extends FocusableOptions {
  children: ReactElement<DOMAttributes, string>
}

export const Focusable = forwardRef(({children, ...props}: FocusableComponentProps, ref: ForwardedRef<FocusableElement>) => {
  ref = useObjectRef(ref);
  let {focusableProps} = useFocusable(props, ref);
  let child = React.Children.only(children);

  useEffect(() => {
    let el = ref.current;
    if (!el || !(el instanceof Element)) {
      console.error('<Focusable> child must forward its ref to a DOM element.');
      return;
    }

    if (!props.isDisabled && !isFocusable(el)) {
      console.warn('<Focusable> child must be focusable. Please ensure the tabIndex prop is passed through.');
      return;
    }

    if (
      el.localName !== 'button' &&
      el.localName !== 'input' &&
      el.localName !== 'select' &&
      el.localName !== 'textarea' &&
      el.localName !== 'a' &&
      el.localName !== 'area' &&
      el.localName !== 'summary' &&
      el.localName !== 'img' &&
      el.localName !== 'svg'
    ) {
      let role = el.getAttribute('role');
      if (!role) {
        console.warn('<Focusable> child must have an interactive ARIA role.');
      } else if (
        // https://w3c.github.io/aria/#widget_roles
        role !== 'application' &&
        role !== 'button' &&
        role !== 'checkbox' &&
        role !== 'combobox' &&
        role !== 'gridcell' &&
        role !== 'link' &&
        role !== 'menuitem' &&
        role !== 'menuitemcheckbox' &&
        role !== 'menuitemradio' &&
        role !== 'option' &&
        role !== 'radio' &&
        role !== 'searchbox' &&
        role !== 'separator' &&
        role !== 'slider' &&
        role !== 'spinbutton' &&
        role !== 'switch' &&
        role !== 'tab' &&
        role !== 'tabpanel' &&
        role !== 'textbox' &&
        role !== 'treeitem' &&
        // aria-describedby is also announced on these roles
        role !== 'img' &&
        role !== 'meter' &&
        role !== 'progressbar'
      ) {
        console.warn(`<Focusable> child must have an interactive ARIA role. Got "${role}".`);
      }
    }
  }, [ref, props.isDisabled]);

  // @ts-ignore
  let childRef = parseInt(React.version, 10) < 19 ? child.ref : child.props.ref;

  return React.cloneElement(
    child,
    {
      ...mergeProps(focusableProps, child.props),
      // @ts-ignore
      ref: mergeRefs(childRef, ref)
    }
  );
});
