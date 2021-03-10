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

import {classNames, unwrapDOMRef, useDOMRef, useIsMobileDevice} from '@react-spectrum/utils';
import {DismissButton, useOverlayPosition} from '@react-aria/overlays';
import {DOMRef, DOMRefValue} from '@react-types/shared';
import {FocusScope} from '@react-aria/focus';
import {MenuContext} from './context';
import {Placement} from '@react-types/overlays';
import {Popover, Tray} from '@react-spectrum/overlays';
import {PressResponder} from '@react-aria/interactions';
import React, {forwardRef, Fragment, useRef} from 'react';
import {SpectrumMenuTriggerProps} from '@react-types/menu';
import styles from '@adobe/spectrum-css-temp/components/menu/vars.css';
import {useMenuTrigger} from '@react-aria/menu';
import {useMenuTriggerState} from '@react-stately/menu';

function MenuTrigger(props: SpectrumMenuTriggerProps, ref: DOMRef<HTMLElement>) {
  let menuPopoverRef = useRef<DOMRefValue<HTMLDivElement>>();
  let triggerRef = useRef<HTMLElement>();
  let domRef = useDOMRef(ref);
  let menuTriggerRef = domRef || triggerRef;
  let menuRef = useRef<HTMLUListElement>();
  let {
    children,
    align = 'start',
    shouldFlip = true,
    direction = 'bottom',
    closeOnSelect = true,
    trigger = 'press'
  } = props;

  let [menuTrigger, menu] = React.Children.toArray(children);
  let state = useMenuTriggerState(props);

  let {menuTriggerProps, menuProps} = useMenuTrigger({trigger}, state, menuTriggerRef);

  let isMobile = useIsMobileDevice();
  let {overlayProps: positionProps, placement} = useOverlayPosition({
    targetRef: menuTriggerRef,
    overlayRef: unwrapDOMRef(menuPopoverRef),
    scrollRef: menuRef,
    placement: `${direction} ${align}` as Placement,
    shouldFlip: shouldFlip,
    isOpen: state.isOpen && !isMobile,
    onClose: state.close
  });

  let menuContext = {
    ...menuProps,
    ref: menuRef,
    onClose: state.close,
    closeOnSelect,
    autoFocus: state.focusStrategy || true,
    UNSAFE_style: isMobile ? {
      width: '100%',
      maxHeight: 'inherit'
    } : undefined,
    UNSAFE_className: classNames(styles, {'spectrum-Menu-popover': !isMobile})
  };

  let contents = (
    <FocusScope restoreFocus>
      <DismissButton onDismiss={state.close} />
      {menu}
      <DismissButton onDismiss={state.close} />
    </FocusScope>
  );

  // On small screen devices, the menu is rendered in a tray, otherwise a popover.
  let overlay;
  if (isMobile) {
    overlay = (
      <Tray isOpen={state.isOpen} onClose={state.close} shouldCloseOnBlur>
        {contents}
      </Tray>
    );
  } else {
    overlay = (
      <Popover
        isOpen={state.isOpen}
        UNSAFE_style={positionProps.style}
        ref={menuPopoverRef}
        placement={placement}
        hideArrow
        onClose={state.close}
        shouldCloseOnBlur>
        {contents}
      </Popover>
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

/**
 * The MenuTrigger serves as a wrapper around a Menu and its associated trigger,
 * linking the Menu's open state with the trigger's press state.
 */
let _MenuTrigger = forwardRef(MenuTrigger);
export {_MenuTrigger as MenuTrigger};
