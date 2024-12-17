/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaLabelingProps, RefObject,  DOMProps as SharedDOMProps} from '@react-types/shared';
import {mergeProps, mergeRefs, useLayoutEffect, useObjectRef} from '@react-aria/utils';
import React, {Context, CSSProperties, ForwardedRef, JSX, ReactNode, RefCallback, UIEvent, useCallback, useContext, useMemo, useRef, useState} from 'react';
import ReactDOM from 'react-dom';

export const DEFAULT_SLOT = Symbol('default');

interface SlottedValue<T> {
  slots?: Record<string | symbol, T>
}

export type SlottedContextValue<T> = SlottedValue<T> | T | null | undefined;
export type ContextValue<T, E> = SlottedContextValue<WithRef<T, E>>;

type ProviderValue<T> = [Context<T>, T];
type ProviderValues<A, B, C, D, E, F, G, H, I, J, K> =
  | [ProviderValue<A>]
  | [ProviderValue<A>, ProviderValue<B>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>, ProviderValue<E>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>, ProviderValue<E>, ProviderValue<F>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>, ProviderValue<E>, ProviderValue<F>, ProviderValue<G>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>, ProviderValue<E>, ProviderValue<F>, ProviderValue<G>, ProviderValue<H>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>, ProviderValue<E>, ProviderValue<F>, ProviderValue<G>, ProviderValue<H>, ProviderValue<I>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>, ProviderValue<E>, ProviderValue<F>, ProviderValue<G>, ProviderValue<H>, ProviderValue<I>, ProviderValue<J>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>, ProviderValue<E>, ProviderValue<F>, ProviderValue<G>, ProviderValue<H>, ProviderValue<I>, ProviderValue<J>, ProviderValue<K>];

interface ProviderProps<A, B, C, D, E, F, G, H, I, J, K> {
  values: ProviderValues<A, B, C, D, E, F, G, H, I, J, K>,
  children: ReactNode
}

export function Provider<A, B, C, D, E, F, G, H, I, J, K>({values, children}: ProviderProps<A, B, C, D, E, F, G, H, I, J, K>): JSX.Element {
  for (let [Context, value] of values) {
    // @ts-ignore
    children = <Context.Provider value={value}>{children}</Context.Provider>;
  }

  return children as JSX.Element;
}

export interface StyleProps {
  /** The CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. */
  className?: string,
  /** The inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. */
  style?: CSSProperties
}

export interface DOMProps extends StyleProps, SharedDOMProps {
  /** The children of the component. */
  children?: ReactNode
}

export interface ScrollableProps<T extends Element> {
  /** Handler that is called when a user scrolls. See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scroll_event). */
  onScroll?: (e: UIEvent<T>) => void
}

export interface StyleRenderProps<T> {
  /** The CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. A function may be provided to compute the class based on component state. */
  className?: string | ((values: T & {defaultClassName: string | undefined}) => string),
  /** The inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. A function may be provided to compute the style based on component state. */
  style?: CSSProperties | ((values: T & {defaultStyle: CSSProperties}) => CSSProperties | undefined)
}

export interface RenderProps<T> extends StyleRenderProps<T> {
  /** The children of the component. A function may be provided to alter the children based on component state. */
  children?: ReactNode | ((values: T & {defaultChildren: ReactNode | undefined}) => ReactNode)
}

interface RenderPropsHookOptions<T> extends RenderProps<T>, SharedDOMProps, AriaLabelingProps {
  values: T,
  defaultChildren?: ReactNode,
  defaultClassName?: string,
  defaultStyle?: CSSProperties
}

export function useRenderProps<T>(props: RenderPropsHookOptions<T>) {
  let {
    className,
    style,
    children,
    defaultClassName = undefined,
    defaultChildren = undefined,
    defaultStyle,
    values
  } = props;

  return useMemo(() => {
    let computedClassName: string | undefined;
    let computedStyle: React.CSSProperties | undefined;
    let computedChildren: React.ReactNode | undefined;

    if (typeof className === 'function') {
      computedClassName = className({...values, defaultClassName});
    } else {
      computedClassName = className;
    }

    if (typeof style === 'function') {
      computedStyle = style({...values, defaultStyle: defaultStyle || {}});
    } else {
      computedStyle = style;
    }

    if (typeof children === 'function') {
      computedChildren = children({...values, defaultChildren});
    } else if (children == null) {
      computedChildren = defaultChildren;
    } else {
      computedChildren = children;
    }

    return {
      className: computedClassName ?? defaultClassName,
      style: (computedStyle || defaultStyle) ? {...defaultStyle, ...computedStyle} : undefined,
      children: computedChildren ?? defaultChildren,
      'data-rac': ''
    };
  }, [className, style, children, defaultClassName, defaultChildren, defaultStyle, values]);
}

/**
 * A helper function that accepts a user-provided render prop value (either a static value or a function),
 * and combines it with another value to create a final result.
 */
export function composeRenderProps<T, U, V extends T>(
  // https://stackoverflow.com/questions/60898079/typescript-type-t-or-function-t-usage
  value: T extends any ? (T | ((renderProps: U) => V)) : never,
  wrap: (prevValue: T, renderProps: U) => V
): (renderProps: U) => V {
  return (renderProps) => wrap(typeof value === 'function' ? value(renderProps) : value, renderProps);
}

export type WithRef<T, E> = T & {ref?: ForwardedRef<E>};
export interface SlotProps {
  /**
   * A slot name for the component. Slots allow the component to receive props from a parent component.
   * An explicit `null` value indicates that the local props completely override all props received from a parent.
   */
  slot?: string | null
}

export function useSlottedContext<T>(context: Context<SlottedContextValue<T>>, slot?: string | null): T | null | undefined {
  let ctx = useContext(context);
  if (slot === null) {
    // An explicit `null` slot means don't use context.
    return null;
  }
  if (ctx && typeof ctx === 'object' && 'slots' in ctx && ctx.slots) {
    let availableSlots = new Intl.ListFormat().format(Object.keys(ctx.slots).map(p => `"${p}"`));

    if (!slot && !ctx.slots[DEFAULT_SLOT]) {
      throw new Error(`A slot prop is required. Valid slot names are ${availableSlots}.`);
    }
    let slotKey = slot || DEFAULT_SLOT;
    if (!ctx.slots[slotKey]) {
      // @ts-ignore
      throw new Error(`Invalid slot "${slot}". Valid slot names are ${availableSlots}.`);
    }
    return ctx.slots[slotKey];
  }
  // @ts-ignore
  return ctx;
}

export function useContextProps<T, U extends SlotProps, E extends Element>(props: T & SlotProps, ref: ForwardedRef<E>, context: Context<ContextValue<U, E>>): [T, RefObject<E | null>] {
  let ctx = useSlottedContext(context, props.slot) || {};
  // @ts-ignore - TS says "Type 'unique symbol' cannot be used as an index type." but not sure why.
  let {ref: contextRef, ...contextProps} = ctx as any;
  let mergedRef = useObjectRef(useMemo(() => mergeRefs(ref, contextRef), [ref, contextRef]));
  let mergedProps = mergeProps(contextProps, props) as unknown as T;

  // mergeProps does not merge `style`. Adding this there might be a breaking change.
  if (
    'style' in contextProps &&
    contextProps.style &&
    'style' in props &&
    props.style
  ) {
    if (typeof contextProps.style === 'function' || typeof props.style === 'function') {
      // @ts-ignore
      mergedProps.style = (renderProps) => {
        let contextStyle = typeof contextProps.style === 'function' ? contextProps.style(renderProps) : contextProps.style;
        let defaultStyle = {...renderProps.defaultStyle, ...contextStyle};
        let style = typeof props.style === 'function'
          ? props.style({...renderProps, defaultStyle})
          : props.style;
        return {...defaultStyle, ...style};
      };
    } else {
      // @ts-ignore
      mergedProps.style = {...contextProps.style, ...props.style};
    }
  }

  return [mergedProps, mergedRef];
}

export function useSlot(): [RefCallback<Element>, boolean] {
  // Assume we do have the slot in the initial render.
  let [hasSlot, setHasSlot] = useState(true);
  let hasRun = useRef(false);

  // A callback ref which will run when the slotted element mounts.
  // This should happen before the useLayoutEffect below.
  let ref = useCallback(el => {
    hasRun.current = true;
    setHasSlot(!!el);
  }, []);

  // If the callback hasn't been called, then reset to false.
  useLayoutEffect(() => {
    if (!hasRun.current) {
      setHasSlot(false);
    }
  }, []);

  return [ref, hasSlot];
}

export function useEnterAnimation(ref: RefObject<HTMLElement | null>, isReady: boolean = true) {
  let [isEntering, setEntering] = useState(true);
  useAnimation(ref, isEntering && isReady, useCallback(() => setEntering(false), []));
  return isEntering && isReady;
}

export function useExitAnimation(ref: RefObject<HTMLElement | null>, isOpen: boolean) {
  // State to trigger a re-render after animation is complete, which causes the element to be removed from the DOM.
  // Ref to track the state we're in, so we don't immediately reset isExiting to true after the animation.
  let [isExiting, setExiting] = useState(false);
  let [exitState, setExitState] = useState('idle');

  // If isOpen becomes false, set isExiting to true.
  if (!isOpen && ref.current && exitState === 'idle') {
    isExiting = true;
    setExiting(true);
    setExitState('exiting');
  }

  // If we exited, and the element has been removed, reset exit state to idle.
  if (!ref.current && exitState === 'exited') {
    setExitState('idle');
  }

  useAnimation(
    ref,
    isExiting,
    useCallback(() => {
      setExitState('exited');
      setExiting(false);
    }, [])
  );

  return isExiting;
}

function useAnimation(ref: RefObject<HTMLElement | null>, isActive: boolean, onEnd: () => void) {
  let prevAnimation = useRef<string | null>(null);
  if (isActive && ref.current) {
    // This is ok because we only read it in the layout effect below, immediately after the commit phase.
    // We could move this to another effect that runs every render, but this would be unnecessarily slow.
    // We only need the computed style right before the animation becomes active.
    prevAnimation.current = window.getComputedStyle(ref.current).animation;
  }

  useLayoutEffect(() => {
    if (isActive && ref.current) {
      // Make sure there's actually an animation, and it wasn't there before we triggered the update.
      let computedStyle = window.getComputedStyle(ref.current);
      if (computedStyle.animationName && computedStyle.animationName !== 'none' && computedStyle.animation !== prevAnimation.current) {
        let onAnimationEnd = (e: AnimationEvent) => {
          if (e.target === ref.current) {
            element.removeEventListener('animationend', onAnimationEnd);
            ReactDOM.flushSync(() => {onEnd();});
          }
        };

        let element = ref.current;
        element.addEventListener('animationend', onAnimationEnd);
        return () => {
          element.removeEventListener('animationend', onAnimationEnd);
        };
      } else {
        onEnd();
      }
    }
  }, [ref, isActive, onEnd]);
}

/**
 * Filters out `data-*` attributes to keep them from being passed down and duplicated.
 * @param props
 */
export function removeDataAttributes<T>(props: T): T {
  const prefix = /^(data-.*)$/;
  let filteredProps = {} as T;

  for (const prop in props) {
    if (!prefix.test(prop)) {
      filteredProps[prop] = props[prop];
    }
  }

  return filteredProps;
}

// Override base type to change the default.
export interface RACValidation {
  /**
   * Whether to use native HTML form validation to prevent form submission
   * when the value is missing or invalid, or mark the field as required
   * or invalid via ARIA.
   * @default 'native'
   */
  validationBehavior?: 'native' | 'aria'
}
