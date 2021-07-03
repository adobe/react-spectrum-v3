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
import React, {useContext, useMemo} from 'react';

interface SlotProps {
  slot?: string
}

let SlotContext = React.createContext(null);

export function useSlotProps<T>(props: T, defaultSlot?: string): T {
  let slot = (props as SlotProps).slot || defaultSlot;
  let {[slot]: slotProps = {}} = useContext(SlotContext) || {};
  return mergeProps(slotProps, props);
}

export function cssModuleToSlots(cssModule) {
  return Object.keys(cssModule).reduce((acc, slot) => {
    acc[slot] = {UNSAFE_className: cssModule[slot]};
    return acc;
  }, {});
}

export function SlotProvider(props) {
  let parentSlots = useContext(SlotContext);
  let {slots = {}, children} = props;

  // Merge props for each slot from parent context and props
  let value = useMemo(() => {
    let slotObj = parentSlots || {};
    return (
      Object.keys(slotObj)
      .concat(Object.keys(slots))
      .reduce((o, p) => ({
        ...o,
        [p]: mergeProps(slotObj[p] || {}, slots[p] || {})}), {})
    );
  }, [parentSlots, slots]);

  return (
    <SlotContext.Provider value={value}>
      {children}
    </SlotContext.Provider>
  );
}

export function ClearSlots(props) {
  let {children, ...otherProps} = props;
  let content = children;
  if (React.Children.toArray(children).length <= 1) {
    if (typeof children === 'function') { // need to know if the node is a string or something else that react can render that doesn't get props
      content = React.cloneElement(React.Children.only(children), otherProps);
    }
  }
  return (
    <SlotContext.Provider value={{}}>
      {content}
    </SlotContext.Provider>
  );
}
