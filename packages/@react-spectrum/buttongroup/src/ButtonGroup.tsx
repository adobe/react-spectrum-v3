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

import {
  classNames,
  SlotProvider,
  useDOMRef,
  useResizeObserver,
  useSlotProps,
  useStyleProps,
  useValueEffect
} from '@react-spectrum/utils';
import {DOMRef} from '@react-types/shared';
import {filterDOMProps} from '@react-aria/utils';
import React, {useCallback, useEffect, useRef} from 'react';
import {SpectrumButtonGroupProps} from '@react-types/buttongroup';
import styles from '@adobe/spectrum-css-temp/components/buttongroup/vars.css';
import {useProvider, useProviderProps} from '@react-spectrum/provider';

function ButtonGroup(props: SpectrumButtonGroupProps, ref: DOMRef<HTMLDivElement>) {
  let {scale} = useProvider();
  props = useProviderProps(props);
  props = useSlotProps(props, 'buttonGroup');

  let {
    children,
    orientation = 'horizontal',
    isDisabled,
    align = 'start',
    ...otherProps
  } = props;

  let {styleProps} = useStyleProps(otherProps);
  let domRef = useDOMRef(ref);
  let [hasOverflow, setHasOverflow] = useValueEffect(false);

  let checkForOverflow = useCallback(() => {
    let computeHasOverflow = () => {
      if (domRef.current && orientation === 'horizontal') {
        let buttonGroupChildren = Array.from(domRef.current.children) as HTMLElement[];
        let maxX = domRef.current.offsetWidth + 1; // + 1 to account for rounding errors
        // If any buttons have negative X positions (align="end") or extend beyond
        // the width of the button group (align="start"), then switch to vertical.
        if (buttonGroupChildren.some(child => child.offsetLeft < 0 || child.offsetLeft + child.offsetWidth > maxX)) {
          return true;
        }
        return false;
      }
    };
    if (orientation === 'horizontal') {
      setHasOverflow(function* () {
        // Force to horizontal for measurement.
        yield false;

        // Measure, and update if there is overflow.
        yield computeHasOverflow();
      });
    }
  // We need scale and children in dependency array since it will affect overflow calcuation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domRef, orientation, scale, setHasOverflow, children]);

  // There are two main reasons we need to remeasure:
  // 1. Internal changes: Check for initial overflow or when orientation/scale/children change (from checkForOverflow dep array)
  useEffect(() => {
    checkForOverflow();
  }, [checkForOverflow]);

  // 2. External changes: buttongroup won't change size due to any parents changing size, so listen to its container for size changes to figure out if we should remeasure
  let parent = useRef<HTMLElement>();
  useEffect(() => {
    parent.current = domRef.current.parentElement;
  }, [domRef]);
  useResizeObserver({ref: parent, onResize: checkForOverflow});

  return (
    <div
      {...filterDOMProps(otherProps)}
      {...styleProps}
      ref={domRef}
      className={
        classNames(
          styles,
          'spectrum-ButtonGroup',
          {
            'spectrum-ButtonGroup--vertical': orientation === 'vertical' || hasOverflow,
            'spectrum-ButtonGroup--alignEnd': align === 'end',
            'spectrum-ButtonGroup--alignCenter': align === 'center'
          },
          styleProps.className
        )
      }>
      <SlotProvider
        slots={{
          button: {
            isDisabled,
            UNSAFE_className: classNames(styles, 'spectrum-ButtonGroup-Button')
          }
        }}>
        {children}
      </SlotProvider>
    </div>
  );
}

/**
 * ButtonGroup handles overflow for a grouping of buttons whose actions are related to each other.
 */
let _ButtonGroup = React.forwardRef(ButtonGroup);
export {_ButtonGroup as ButtonGroup};
