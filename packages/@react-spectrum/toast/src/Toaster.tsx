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

import {AriaToastRegionProps, useToastRegion} from '@react-aria/toast';
import {classNames} from '@react-spectrum/utils';
import {FocusScope, useFocusRing} from '@react-aria/focus';
import {mergeProps} from '@react-aria/utils';
import {Provider} from '@react-spectrum/provider';
import React, {createContext, ReactElement, ReactNode, useMemo, useRef} from 'react';
import ReactDOM from 'react-dom';
import toastContainerStyles from './toastContainer.css';
import type {ToastPlacement} from './ToastContainer';
import {ToastState} from '@react-stately/toast';
import {useUNSTABLE_PortalContext} from '@react-aria/overlays';

interface ToastContainerProps extends AriaToastRegionProps {
  children: ReactNode,
  state: ToastState<unknown>,
  placement?: ToastPlacement
}

export const ToasterContext = createContext(false);

export function Toaster(props: ToastContainerProps): ReactElement {
  let {
    children,
    state
  } = props;

  let ref = useRef(null);
  let {regionProps} = useToastRegion(props, state, ref);
  let {focusProps, isFocusVisible} = useFocusRing();
  let {getContainer} = useUNSTABLE_PortalContext();

  let [position, placement] = useMemo(() => {
    let [pos = 'bottom', place = 'center'] = props.placement?.split(' ') || [];
    return [pos, place];
  }, [props.placement]);

  let contents = (
    <Provider UNSAFE_style={{background: 'transparent'}}>
      <FocusScope>
        <ToasterContext.Provider value={isFocusVisible}>
          <div
            {...mergeProps(regionProps, focusProps)}
            ref={ref}
            data-position={position}
            data-placement={placement}
            className={classNames(
              toastContainerStyles,
              'react-spectrum-ToastContainer',
              {'focus-ring': isFocusVisible}
            )}>
            {children}
          </div>
        </ToasterContext.Provider>
      </FocusScope>
    </Provider>
  );

  return ReactDOM.createPortal(contents, getContainer?.() ?? document.body);
}
