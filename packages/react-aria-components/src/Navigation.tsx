/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {ContextValue, Provider, RenderProps, SlotProps, useContextProps, useRenderProps, useSlot, useSlottedContext} from './utils';
import {DOMAttributes, DOMProps, forwardRefType, Key, MultipleSelection} from '@react-types/shared';
import {filterDOMProps, useId} from '@react-aria/utils';
import {HeaderContext} from './Header';
import {LinkContext} from './Link';
import {Node} from 'react-stately';
import {Orientation} from 'react-aria';
import React, {createContext, ForwardedRef, forwardRef, ReactElement, ReactNode} from 'react';

// TODO: Replace NavigationRenderProps with AriaNavigationProps, once it exists
export interface NavigationProps extends NavigationRenderProps, RenderProps<NavigationRenderProps>, DOMProps, SlotProps {
  /** Whether the navigation is disabled. */
  isDisabled?: boolean,
  /** Handler that is called when a navigation item is clicked. */
  onAction?: (key: Key) => void
}

export interface NavigationRenderProps {
  /**
   * Whether the navigation is disabled.
   * @selector [data-disabled]
   */
  isDisabled?: boolean,
  /**
   * The orientation of the navigation.
   * @selector [data-orientation="horizontal | vertical"]
   */
  orientation: Orientation
}

// TODO: HTMLDivElement is the wrong type
export const NavigationContext = createContext<ContextValue<NavigationProps, HTMLDivElement>>(null);

function Navigation(props: NavigationProps, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, NavigationContext);

  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-Navigation',
    values: {
      isDisabled: props.isDisabled,
      orientation: props.orientation || 'horizontal'
    }
  });

  let domProps = filterDOMProps(props);

  return (
    <nav
      aria-label="Navigation"
      {...domProps}
      {...renderProps}
      ref={ref}
      data-disabled={props.isDisabled || undefined}>
      <NavigationContext.Provider value={props}>
        <ol
          className="react-aria-NavigationList"
          data-orientation={props.orientation || 'horizontal'}>
          {renderProps.children}
        </ol>
      </NavigationContext.Provider>
    </nav>
  );

}

// TODO: Remove NavigationItemRenderProps and use AriaNavigationItemProps when it exists
export interface NavigationItemProps extends NavigationItemRenderProps, RenderProps<NavigationItemRenderProps> {
  /** A unique id for the navigation item, which will be passed to `onAction` when the breadcrumb is pressed. */
  id?: Key
}

export interface NavigationItemRenderProps {
  /**
   * Whether the navigation item is for the current page.
   * @selector [data-current]
   */
  isCurrent: boolean,
  /**
   * Whether the navigation item is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean
}

// TODO: Does this need a context?

function NavigationItem(props: NavigationItemProps, ref: ForwardedRef<HTMLDivElement>) {
  let {
    id,
    isCurrent,
    ...otherProps
  } = props;
  let {isDisabled, onAction} = useSlottedContext(NavigationContext)!;

  // Generate an id if one wasn't provided.
  // (can't pass id into useId since it can also be a number)
  let defaultId = useId();
  id ||= defaultId;

  let linkProps = {
    'aria-current': isCurrent ? 'page' : null,
    isDisabled: isDisabled || otherProps.isDisabled || isCurrent,
    onPress: () => onAction?.(id)
  };

  let renderProps = useRenderProps({
    ...otherProps,
    defaultClassName: 'react-aria-NavigationItem',
    values: {
      isDisabled: isDisabled || isCurrent,
      isCurrent
    }
  });

  let domProps = filterDOMProps(otherProps as any);

  return (
    <li
      {...domProps}
      {...renderProps}
      ref={ref}
      data-current={isCurrent || undefined}
      data-disabled={isDisabled || isCurrent || undefined}>
      <LinkContext.Provider value={linkProps}>
        {renderProps.children}
      </LinkContext.Provider>
    </li>
  );
}

// TODO: Remove the Node<T>
export interface NavigationSectionProps<T> extends Node<T>, MultipleSelection {
  // TODO: describe or refactor
  children: ReactNode | ((item: object) => ReactElement)
}

function NavigationSection<T extends object>(props: NavigationSectionProps<T>, ref: ForwardedRef<HTMLElement>, section: Node<T>, className = 'react-aria-MenuSection') {
  // TODO: State for selection
  let [headingRef] = useSlot();
  // TODO: Do we need a use hook for NavigationSection?
  let renderProps = useRenderProps({
    defaultClassName: className,
    // className: section.props?.className,
    // style: section.props?.style,
    values: {}
  });

  return (
    <section
      {...filterDOMProps(props as any)}
      {...renderProps}
      ref={ref}>
      <Provider
        values={[
          [HeaderContext, {...{role: 'presentation'} as DOMAttributes, ref: headingRef}]
        ]}>
        {props.children}
      </Provider>
    </section>
  );
}

/**
 * A navigation is a grouping of navigation links.
 */
const _Navigation = /*#__PURE__*/ (forwardRef as forwardRefType)(Navigation);
export {_Navigation as Navigation};

/**
 * A navigation item is a navigation link.
 */
const _NavigationItem = /*#__PURE__*/ (forwardRef as forwardRefType)(NavigationItem);
export {_NavigationItem as NavigationItem};

/**
 * A NavigationSection represents a section within a navigation.
 */
const _NavigationSection = /*#__PURE__*/ /*#__PURE__*/ (forwardRef as forwardRefType)(NavigationSection);
export {_NavigationSection as NavigationSection};
