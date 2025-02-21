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

import {ClearPressResponder} from '@react-aria/interactions';
import {FocusScope} from '@react-aria/focus';
import React, {ReactNode, useContext, useMemo, useState} from 'react';
import ReactDOM from 'react-dom';
import {useIsSSR} from '@react-aria/ssr';
import {useLayoutEffect} from '@react-aria/utils';
import {useUNSTABLE_PortalContext} from './PortalProvider';

export interface OverlayProps {
  /**
   * The container element in which the overlay portal will be placed.
   * @default document.body
   */
  portalContainer?: Element,
  /** The overlay to render in the portal. */
  children: ReactNode,
  /**
   * Disables default focus management for the overlay, including containment and restoration.
   * This option should be used very carefully. When focus management is disabled, you must
   * implement focus containment and restoration to ensure the overlay is keyboard accessible.
   */
  disableFocusManagement?: boolean,
  /**
   * Whether to contain focus within the overlay.
   */
  shouldContainFocus?: boolean,
  /**
   * Whether the overlay is currently performing an exit animation. When true,
   * focus is allowed to move outside.
   */
  isExiting?: boolean
}

export const OverlayContext = React.createContext<{contain: boolean, setContain: React.Dispatch<React.SetStateAction<boolean>>} | null>(null);

/**
 * A container which renders an overlay such as a popover or modal in a portal,
 * and provides a focus scope for the child elements.
 */
export function Overlay(props: OverlayProps) {
  let isSSR = useIsSSR();
  let {portalContainer = isSSR ? null : document.body, isExiting} = props;
  let [contain, setContain] = useState(false);
  let contextValue = useMemo(() => ({contain, setContain}), [contain, setContain]);

  let {getContainer} = useUNSTABLE_PortalContext();
  if  (!props.portalContainer && getContainer) {
    portalContainer = getContainer();
  }

  if (!portalContainer) {
    return null;
  }

  let contents = props.children;
  if (!props.disableFocusManagement) {
    contents = (
      <FocusScope restoreFocus contain={(props.shouldContainFocus || contain) && !isExiting}>
        {contents}
      </FocusScope>
    );
  }

  contents = (
    <OverlayContext.Provider value={contextValue}>
      <ClearPressResponder>
        {contents}
      </ClearPressResponder>
    </OverlayContext.Provider>
  );

  return ReactDOM.createPortal(contents, portalContainer);
}

/** @private */
export function useOverlayFocusContain() {
  let ctx = useContext(OverlayContext);
  let setContain = ctx?.setContain;
  useLayoutEffect(() => {
    setContain?.(true);
  }, [setContain]);
}
