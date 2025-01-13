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

import {ContextValue, Keyboard as KeyboardAria, Header as RACHeader, Heading as RACHeading, TextContext as RACTextContext, SlotProps, Text as TextAria} from 'react-aria-components';
import {createContext, forwardRef, ReactNode, useContext} from 'react';
import {DOMRef, DOMRefValue} from '@react-types/shared';
import {inertValue} from '@react-aria/utils';
import {StyleString} from '../style/types';
import {UnsafeStyles} from './style-utils';
import {useDOMRef} from '@react-spectrum/utils';
import {useIsSkeleton, useSkeletonText} from './Skeleton';
import {useSpectrumContextProps} from './useSpectrumContextProps';

interface ContentProps extends UnsafeStyles, SlotProps {
  children?: ReactNode,
  styles?: StyleString,
  isHidden?: boolean
}

interface HeadingProps extends ContentProps {
  level?: number
}

export const HeadingContext = createContext<ContextValue<HeadingProps, DOMRefValue<HTMLHeadingElement>>>(null);

export const Heading = forwardRef(// Wrapper around RAC Heading to unmount when hidden.
function Heading(props: HeadingProps, ref: DOMRef<HTMLHeadingElement>) {
  [props, ref] = useSpectrumContextProps(props, ref, HeadingContext);
  let domRef = useDOMRef(ref);
  let {UNSAFE_className = '', UNSAFE_style, styles, isHidden, slot, ...otherProps} = props;
  if (isHidden) {
    return null;
  }

  return (
    <RACHeading
      {...otherProps}
      ref={domRef}
      className={UNSAFE_className + styles}
      style={UNSAFE_style}
      slot={slot || undefined} />
  );
});

export const HeaderContext = createContext<ContextValue<ContentProps, DOMRefValue<HTMLElement>>>(null);

export const Header = forwardRef(function Header(props: ContentProps, ref: DOMRef) {
  [props, ref] = useSpectrumContextProps(props, ref, HeaderContext);
  let domRef = useDOMRef(ref);
  let {UNSAFE_className = '', UNSAFE_style, styles, isHidden, slot, ...otherProps} = props;
  if (isHidden) {
    return null;
  }

  return (
    <RACHeader
      {...otherProps}
      ref={domRef}
      className={UNSAFE_className + styles}
      style={UNSAFE_style}
      slot={slot || undefined} />
  );
});

export const ContentContext = createContext<ContextValue<ContentProps, DOMRefValue<HTMLDivElement>>>(null);

export const Content = forwardRef(function Content(props: ContentProps, ref: DOMRef<HTMLDivElement>) {
  [props, ref] = useSpectrumContextProps(props, ref, ContentContext);
  let domRef = useDOMRef(ref);
  let {UNSAFE_className = '', UNSAFE_style, styles, isHidden, slot, ...otherProps} = props;
  if (isHidden) {
    return null;
  }
  return (
    <div
      {...otherProps}
      ref={domRef}
      className={UNSAFE_className + styles}
      style={UNSAFE_style}
      slot={slot || undefined} />
  );
});

export const TextContext = createContext<ContextValue<ContentProps, DOMRefValue>>(null);

export const Text = forwardRef(function Text(props: ContentProps, ref: DOMRef) {
  [props, ref] = useSpectrumContextProps(props, ref, TextContext);
  let domRef = useDOMRef(ref);
  let {UNSAFE_className = '', UNSAFE_style, styles, isHidden, slot, children, ...otherProps} = props;
  let racContext = useContext(RACTextContext);
  let isSkeleton = useIsSkeleton();
  [children, UNSAFE_style] = useSkeletonText(children, UNSAFE_style);
  if (isHidden) {
    return null;
  }

  let text = (
    <TextAria
      {...otherProps}
      ref={domRef}
      // @ts-ignore - compatibility with React < 19
      inert={inertValue(isSkeleton)}
      className={UNSAFE_className + styles}
      style={UNSAFE_style}
      slot={slot || undefined}
      data-rsp-slot="text">
      {children}
    </TextAria>
  );

  if (slot && racContext && 'slots' in racContext && !racContext.slots?.[slot]) {
    return <RACTextContext.Provider value={null}>{text}</RACTextContext.Provider>;
  }

  return text;
});

export const KeyboardContext = createContext<ContextValue<ContentProps, DOMRefValue>>({});

export const Keyboard = forwardRef(function Keyboard(props: ContentProps, ref: DOMRef) {
  [props, ref] = useSpectrumContextProps(props, ref, KeyboardContext);
  let domRef = useDOMRef(ref);
  let {UNSAFE_className = '', UNSAFE_style, styles, isHidden, slot, ...otherProps} = props;
  if (isHidden) {
    return null;
  }
  return (
    <KeyboardAria
      {...otherProps}
      ref={domRef}
      className={UNSAFE_className + styles}
      style={UNSAFE_style}
      slot={slot || undefined} />
  );
});

export const FooterContext = createContext<ContextValue<ContentProps, DOMRefValue>>({});

export const Footer = forwardRef(function Footer(props: ContentProps, ref: DOMRef) {
  [props, ref] = useSpectrumContextProps(props, ref, FooterContext);
  let domRef = useDOMRef(ref);
  let {UNSAFE_className = '', UNSAFE_style, styles, isHidden, slot, ...otherProps} = props;
  if (isHidden) {
    return null;
  }
  return (
    <footer
      {...otherProps}
      ref={domRef}
      className={UNSAFE_className + styles}
      style={UNSAFE_style}
      slot={slot || undefined} />
  );
});
