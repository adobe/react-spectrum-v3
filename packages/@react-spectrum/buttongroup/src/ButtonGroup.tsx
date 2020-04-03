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

import {classNames, filterDOMProps, SlotProvider, useDOMRef, useSlotProps, useStyleProps} from '@react-spectrum/utils';
import {DOMRef} from '@react-types/shared';
import React, {useCallback, useEffect, useState} from 'react';
import {SpectrumButtonGroupProps} from '@react-types/buttongroup';
import styles from '@adobe/spectrum-css-temp/components/buttongroup/vars.css';
import {useProvider, useProviderProps} from '@react-spectrum/provider';

let lastScale;

function ButtonGroup(props: SpectrumButtonGroupProps, ref: DOMRef<HTMLDivElement>) {
  let {scale} = useProvider();
  props = useProviderProps(props);
  props = useSlotProps(props, 'buttonGroup');

  let {
    children,
    orientation = 'horizontal',
    isDisabled,
    ...otherProps
  } = props;

  let {styleProps} = useStyleProps(otherProps);
  let domRef = useDOMRef(ref);
  let [hasOverflow, setHasOverflow] = useState(false);

  let checkForOverflow = useCallback(() => {
    if (domRef.current && orientation === 'horizontal') {
      setHasOverflow(false);
      let buttonGroupChildren = Array.from(domRef.current.children);
      let childrenY = buttonGroupChildren.map(child => child.getBoundingClientRect().top);
      // If any button's top is different from the others, overflow is happening
      if (!childrenY.every(itemY => itemY === childrenY[0])) {
        setHasOverflow(true);
      }
    }
  }, [domRef, orientation]);

  useEffect(() => {
    if (orientation !== 'vertical') {
      if (scale !== lastScale) {
        if (lastScale === 'large' && scale === 'medium') {
          setHasOverflow(false);
        } else {
          checkForOverflow();
        }
      }
      lastScale = scale;
    }
  }, [setHasOverflow, checkForOverflow, scale, orientation]);

  useEffect(() => {
    if (orientation !== 'vertical') {
      // I think performance could be optimized here by creating a global, debounced hook for listening to resize
      // events rather than creating an event-listener per component.
      window.addEventListener('resize', checkForOverflow);
      checkForOverflow();
      return () => {
        window.removeEventListener('resize', checkForOverflow);
      };
    }
  }, [checkForOverflow, orientation]);

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
            'spectrum-ButtonGroup--vertical': hasOverflow || orientation === 'vertical'
          },
          styleProps.className
        )
      }>
      <SlotProvider
        slots={{
          button: {
            isDisabled,
            UNSAFE_className: classNames(styles, '.spectrum-ButtonGroup-Button')
          }
        }}>
        {children}
      </SlotProvider>
    </div>
  );
}

/**
 * Buttons allow users to perform an action or to navigate to another page.
 * They have multiple styles for various needs, and are ideal for calling attention to
 * where a user needs to do something in order to move forward in a flow.
 */
let _ButtonGroup = React.forwardRef(ButtonGroup);
export {_ButtonGroup as ButtonGroup};
