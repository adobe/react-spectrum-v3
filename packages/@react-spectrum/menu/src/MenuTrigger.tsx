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

import {DismissButton, useOverlayPosition} from '@react-aria/overlays';
import {DOMRefValue} from '@react-types/shared';
import {FocusScope} from '@react-aria/focus';
import {MenuContext} from './context';
import {Overlay, Popover, Tray} from '@react-spectrum/overlays';
import {Placement} from '@react-types/overlays';
import {PressResponder} from '@react-aria/interactions';
import React, {Fragment, useRef} from 'react';
import {SpectrumMenuTriggerProps} from '@react-types/menu';
import {unwrapDOMRef, useMediaQuery} from '@react-spectrum/utils';
import {useMenuTrigger} from '@react-aria/menu';
import {useMenuTriggerState} from '@react-stately/menu';
import {useOverlayPosition} from '@react-aria/overlays';

export function MenuTrigger(props: SpectrumMenuTriggerProps) {
  let menuPopoverRef = useRef<DOMRefValue<HTMLDivElement>>();
  let menuTriggerRef = useRef<HTMLElement>();
  let menuRef = useRef<HTMLUListElement>();
  let {
    children,
    align = 'start',
    shouldFlip = true,
    direction = 'bottom',
    closeOnSelect = true
  } = props;

  let [menuTrigger, menu] = React.Children.toArray(children);
  let state = useMenuTriggerState(props);

  let {menuTriggerProps, overlayProps, menuProps} = useMenuTrigger(
    {
      ref: menuTriggerRef
    },
    state
  );

  let {overlayProps: positionProps, placement} = useOverlayPosition({
    targetRef: menuTriggerRef,
    overlayRef: unwrapDOMRef(menuPopoverRef),
    scrollRef: menuRef,
    placement: `${direction} ${align}` as Placement,
    shouldFlip: shouldFlip,
    isOpen: state.isOpen
  });

  let isMobile = useMediaQuery('(max-width: 700px)');
  let menuContext = {
    ...menuProps,
    ref: menuRef,
    onClose: state.close,
    closeOnSelect,
    autoFocus: state.focusStrategy,
    UNSAFE_style: {
      width: isMobile ? '100%' : undefined
    }
  };

  let contents = (
    <FocusScope restoreFocus>
      <DismissButton onDismiss={onClose} />
      {menu}
      <DismissButton onDismiss={onClose} />
    </FocusScope>
  );

  // On small screen devices, the menu is rendered in a tray, otherwise a popover.
  let overlay;
  if (isMobile) {
    overlay = (
      <Tray isOpen={state.isOpen} onClose={state.close}>
        {contents}
      </Tray>
    );
  } else {
    overlay = (
      <Overlay isOpen={state.isOpen}>
        <Popover
          UNSAFE_style={positionProps.style}
          ref={menuPopoverRef}
          placement={placement}
          hideArrow
          onClose={state.close}>
          {contents}
        </Popover>
      </Overlay>
    );
  }

  return (
    <Fragment>
      <PressResponder {...menuTriggerProps} ref={menuTriggerRef} isPressed={state.isOpen}>
        {menuTrigger}
      </PressResponder>
      <MenuContext.Provider value={menuContext}>
        {overlay}
      </MenuContext.Provider>
    </Fragment>
  );
}
