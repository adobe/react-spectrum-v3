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

import {cloneElement, createContext, CSSProperties, ReactElement, ReactNode, Ref, useCallback, useContext, useRef} from 'react';
import {colorToken} from '../style/tokens' with {type: 'macro'};
import {inertValue, mergeRefs} from '@react-aria/utils';
import {mergeStyles} from '../style/runtime';
import {raw} from '../style/style-macro' with {type: 'macro'};
import {style} from '../style' with {type: 'macro'};
import {StyleString} from '../style/types';

let reduceMotion = typeof window?.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

export function useLoadingAnimation(isAnimating: boolean) {
  let animationRef = useRef<Animation | null>(null);
  return useCallback((element: HTMLElement | null) => {
    if (isAnimating && !animationRef.current && element && !reduceMotion) {
      // Use web animation API instead of CSS animations so that we can
      // synchronize it between all loading elements on the page (via startTime).
      animationRef.current = element.animate(
        [
          {backgroundPosition: '100%'},
          {backgroundPosition: '0%'}
        ],
        {
          duration: 2000,
          iterations: Infinity,
          easing: 'ease-in-out'
        }
      );
      animationRef.current.startTime = 0;
    } else if (!isAnimating && animationRef.current) {
      animationRef.current.cancel();
      animationRef.current = null;
    }
  }, [isAnimating]);
}

export type SkeletonElement = ReactElement<{
  children?: ReactNode,
  className?: string,
  ref?: Ref<HTMLElement>,
  inert?: boolean | 'true'
}>;

export const SkeletonContext = createContext<boolean | null>(null);
export function useIsSkeleton(): boolean {
  return useContext(SkeletonContext) || false;
}

export interface SkeletonProps {
  children: ReactNode,
  isLoading: boolean
}

/**
 * A Skeleton wraps around content to render it as a placeholder.
 */
export function Skeleton({children, isLoading}: SkeletonProps) {
  // Disable all form components inside a skeleton.
  return (
    <SkeletonContext.Provider value={isLoading}>
      {children}
    </SkeletonContext.Provider>
  );
}

export const loadingStyle = raw(`
  background-image: linear-gradient(to right, ${colorToken('gray-100')} 33%, light-dark(${colorToken('gray-25')}, ${colorToken('gray-300')}), ${colorToken('gray-100')} 66%);
  background-size: 300%;
  * {
    visibility: hidden;
  }
`, 'UNSAFE_overrides');

export function useSkeletonText(children: ReactNode, style: CSSProperties | undefined): [ReactNode, CSSProperties | undefined] {
  let isSkeleton = useContext(SkeletonContext);
  if (isSkeleton) {
    children = <SkeletonText>{children}</SkeletonText>;
    style = {
      ...style,
      // This ensures the ellipsis on truncated text is also hidden.
      // -webkit-text-fill-color overrides any `color` property that is also set.
      WebkitTextFillColor: 'transparent'
    };
  }
  return [children, style];
}

// Rendered inside <Text> to create skeleton line boxes via box-decoration-break.
export function SkeletonText({children}) {
  return (
    <span
      // @ts-ignore - compatibility with React < 19
      inert={inertValue(true)}
      ref={useLoadingAnimation(true)}
      className={loadingStyle + style({
        color: 'transparent',
        boxDecorationBreak: 'clone',
        borderRadius: 'sm'
      })}>
      {children}
    </span>
  );
}

// Clones the child element and displays it with skeleton styling.
export function SkeletonWrapper({children}: {children: SkeletonElement}) {
  let isLoading = useContext(SkeletonContext);
  let animation = useLoadingAnimation(isLoading || false);
  if (isLoading == null) {
    return children;
  }

  let childRef = 'ref' in children ? children.ref as any : children.props.ref;
  return (
    <SkeletonContext.Provider value={null}>
      {isLoading ? cloneElement(children, {
        ref: mergeRefs(childRef, animation),
        className: (children.props.className || '') + ' ' + loadingStyle,
        inert: 'true'
      }) : children}
    </SkeletonContext.Provider>
  );
}

// Adds default border radius around icons when displayed in a skeleton.
export function useSkeletonIcon(styles: StyleString): StyleString {
  let isSkeleton = useContext(SkeletonContext);
  if (isSkeleton) {
    return mergeStyles(style({borderRadius: 'sm'}), styles);
  }
  return styles || '' as StyleString;
}
