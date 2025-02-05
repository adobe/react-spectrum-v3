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

import {DOMAttributes, FocusableElement} from '@react-types/shared';
import {isFocusable, mergeProps, mergeRefs, useObjectRef} from '@react-aria/utils';
import {PressProps, usePress} from './usePress';
import React, {ForwardedRef, ReactElement, useEffect} from 'react';
import {useFocusable} from './useFocusable';

interface PressableProps extends PressProps {
  children: ReactElement<DOMAttributes, string>
}

export const Pressable = React.forwardRef(({children, ...props}: PressableProps, ref: ForwardedRef<FocusableElement>) => {
  ref = useObjectRef(ref);
  let {pressProps} = usePress({...props, ref});
  let {focusableProps} = useFocusable(props, ref);
  let child = React.Children.only(children);

  useEffect(() => {
    let el = ref.current;
    if (!el || !(el instanceof Element)) {
      console.error('<Pressable> child must forward its ref to a DOM element.');
      return;
    }

    if (!isFocusable(el)) {
      console.warn('<Pressable> child must be focusable. Please ensure the tabIndex prop is passed through.');
      return;
    }

    if (
      el.localName !== 'button' &&
      el.localName !== 'input' &&
      el.localName !== 'select' &&
      el.localName !== 'textarea' &&
      el.localName !== 'a' &&
      el.localName !== 'area' &&
      el.localName !== 'summary'
    ) {
      let role = el.getAttribute('role');
      if (!role) {
        console.warn('<Pressable> child must have an interactive ARIA role.');
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
        role !== 'textbox' &&
        role !== 'treeitem'
      ) {
        console.warn(`<Pressable> child must have an interactive ARIA role. Got "${role}".`);
      }
    }
  }, [ref]);

  // @ts-ignore
  let childRef = parseInt(React.version, 10) < 19 ? child.ref : child.props.ref;

  return React.cloneElement(
    child,
    {
      ...mergeProps(pressProps, focusableProps, child.props),
      // @ts-ignore
      ref: mergeRefs(childRef, ref)
    }
  );
});
