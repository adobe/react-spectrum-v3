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

import {AriaLinkProps} from '@react-types/link';
import {DOMAttributes, FocusableElement, RefObject} from '@react-types/shared';
import {filterDOMProps, mergeProps, shouldClientNavigate, useLinkProps, useRouter} from '@react-aria/utils';
import React from 'react';
import {useFocusable, usePress} from '@react-aria/interactions';

export interface AriaLinkOptions extends AriaLinkProps {
  /** Whether the link is disabled. */
  isDisabled?: boolean,
  /**
   * The HTML element used to render the link, e.g. 'a', or 'span'.
   * @default 'a'
   */
  elementType?: string
}

export interface LinkAria {
  /** Props for the link element. */
  linkProps: DOMAttributes,
  /** Whether the link is currently pressed. */
  isPressed: boolean
}

/**
 * Provides the behavior and accessibility implementation for a link component.
 * A link allows a user to navigate to another page or resource within a web page
 * or application.
 */
export function useLink(props: AriaLinkOptions, ref: RefObject<FocusableElement | null>): LinkAria {
  let {
    elementType = 'a',
    onPress,
    onPressStart,
    onPressEnd,
    // @ts-ignore
    onClick: deprecatedOnClick,
    isDisabled,
    ...otherProps
  } = props;

  let linkProps: DOMAttributes = {};
  if (elementType !== 'a') {
    linkProps = {
      role: 'link',
      tabIndex: !isDisabled ? 0 : undefined
    };
  }
  let {focusableProps} = useFocusable(props, ref);
  let {pressProps, isPressed} = usePress({onPress, onPressStart, onPressEnd, isDisabled, ref});
  let domProps = filterDOMProps(otherProps, {labelable: true});
  let interactionHandlers = mergeProps(focusableProps, pressProps);
  let router = useRouter();
  let routerLinkProps = useLinkProps(props);

  return {
    isPressed, // Used to indicate press state for visual
    linkProps: mergeProps(domProps, routerLinkProps, {
      ...interactionHandlers,
      ...linkProps,
      'aria-disabled': isDisabled || undefined,
      'aria-current': props['aria-current'],
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        pressProps.onClick?.(e);
        if (deprecatedOnClick) {
          deprecatedOnClick(e);
          console.warn('onClick is deprecated, please use onPress');
        }

        // If a custom router is provided, prevent default and forward if this link should client navigate.
        if (
          !router.isNative &&
          e.currentTarget instanceof HTMLAnchorElement &&
          e.currentTarget.href &&
          // If props are applied to a router Link component, it may have already prevented default.
          !e.isDefaultPrevented() &&
          shouldClientNavigate(e.currentTarget, e) &&
          props.href
        ) {
          e.preventDefault();
          router.open(e.currentTarget, e, props.href, props.routerOptions);
        }
      }
    })
  };
}
