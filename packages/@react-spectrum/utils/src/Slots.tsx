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

import {mergeProps} from '@react-aria/utils';
import React, {ReactElement, ReactNode, useContext, useMemo} from 'react';

interface SlotProps {
  slot?: string
}

let SlotContext = React.createContext<{} | null>(null);

export function useSlotProps<T>(props: T & {id?: string}, defaultSlot?: string): T {
  let slot = (props as SlotProps).slot || defaultSlot;
  // @ts-ignore TODO why is slot an object and not just string or undefined?
  let {[slot]: slotProps = {}} = useContext(SlotContext) || {};

  return mergeProps(props, mergeProps(slotProps, {id: props.id}));
}

export function cssModuleToSlots(cssModule: {[cssmodule: string]: string}): {[slot: string]: {UNSAFE_className: string}} {
  return Object.keys(cssModule).reduce((acc, slot) => {
    acc[slot] = {UNSAFE_className: cssModule[slot]};
    return acc;
  }, {});
}

export function SlotProvider(props: {slots?: {[slot: string]: object}, children?: ReactNode}): ReactElement {
  const emptyObj = useMemo(() => ({}), []);

  let parentSlots = useContext(SlotContext) || emptyObj;
  let {slots = emptyObj, children} = props;

  // Merge props for each slot from parent context and props
  let value = useMemo(() =>
    Object.keys(parentSlots)
      .concat(Object.keys(slots))
      .reduce((o, p) => ({
        ...o,
        [p]: mergeProps(parentSlots[p] || {}, slots[p] || {})}), {})
      , [parentSlots, slots]);

  return (
    <SlotContext.Provider value={value}>
      {children}
    </SlotContext.Provider>
  );
}

export function ClearSlots(props: {children?: ReactNode}): ReactElement {
  let {children, ...otherProps} = props;

  const emptyObj = useMemo(() => ({}), []);

  let content = children;
  if (React.Children.toArray(children).length <= 1) {
    if (typeof children === 'function') { // need to know if the node is a string or something else that react can render that doesn't get props
      content = React.cloneElement(React.Children.only(children), otherProps);
    }
  }
  return (
    <SlotContext.Provider value={emptyObj}>
      {content}
    </SlotContext.Provider>
  );
}
