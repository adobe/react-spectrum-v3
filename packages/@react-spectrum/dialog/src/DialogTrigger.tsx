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

import {DialogContext} from './context';
import {Modal, Popover, Tray} from '@react-spectrum/overlays';
import {OverlayTriggerState, useOverlayTriggerState} from '@react-stately/overlays';
import {PressResponder} from '@react-aria/interactions';
import React, {Fragment, JSX, ReactElement, useEffect, useRef} from 'react';
import {SpectrumDialogClose, SpectrumDialogProps, SpectrumDialogTriggerProps} from '@react-types/dialog';
import {useIsMobileDevice} from '@react-spectrum/utils';
import {useOverlayTrigger} from '@react-aria/overlays';

function DialogTrigger(props: SpectrumDialogTriggerProps) {
  let {
    children,
    type = 'modal',
    mobileType = type === 'popover' ? 'modal' : type,
    hideArrow,
    targetRef,
    isDismissable,
    isKeyboardDismissDisabled,
    ...positionProps
  } = props;
  if (!Array.isArray(children) || children.length > 2) {
    throw new Error('DialogTrigger must have exactly 2 children');
  }
  // if a function is passed as the second child, it won't appear in toArray
  let [trigger, content] = children as [ReactElement, SpectrumDialogClose];

  // On small devices, show a modal or tray instead of a popover.
  let isMobile = useIsMobileDevice();
  if (isMobile) {
    // handle cases where desktop popovers need a close button for the mobile modal view
    if (type !== 'modal' && mobileType === 'modal') {
      isDismissable = true;
    }

    type = mobileType;
  }

  let state = useOverlayTriggerState(props);
  let wasOpen = useRef(false);
  useEffect(() => {
    wasOpen.current = state.isOpen;
  }, [state.isOpen]);

  let isExiting = useRef(false);
  let onExiting = () => isExiting.current = true;
  let onExited = () => isExiting.current = false;

  // eslint-disable-next-line arrow-body-style
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return () => {
        if ((wasOpen.current || isExiting.current) && type !== 'popover' && type !== 'tray') {
          console.warn('A DialogTrigger unmounted while open. This is likely due to being placed within a trigger that unmounts or inside a conditional. Consider using a DialogContainer instead.');
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (type === 'popover') {
    return (
      <PopoverTrigger
        {...positionProps}
        state={state}
        targetRef={targetRef}
        trigger={trigger}
        content={content}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
        hideArrow={hideArrow} />
    );
  }

  let renderOverlay = () => {
    switch (type) {
      case 'fullscreen':
      case 'fullscreenTakeover':
      case 'modal':
        return (
          <Modal
            state={state}
            isDismissable={type === 'modal' ? isDismissable : false}
            type={type}
            isKeyboardDismissDisabled={isKeyboardDismissDisabled}
            onExiting={onExiting}
            onExited={onExited}>
            {typeof content === 'function' ? content(state.close) : content}
          </Modal>
        );
      case 'tray':
        return (
          <Tray
            state={state}
            isKeyboardDismissDisabled={isKeyboardDismissDisabled}>
            {typeof content === 'function' ? content(state.close) : content}
          </Tray>
        );
    }
  };

  return (
    <DialogTriggerBase
      type={type}
      state={state}
      isDismissable={isDismissable}
      trigger={trigger}
      overlay={renderOverlay()} />
  );
}

// Support DialogTrigger inside components using CollectionBuilder.
DialogTrigger.getCollectionNode = function* (props: SpectrumDialogTriggerProps) {
  // @ts-ignore - seems like types are wrong. Function children work fine.
  let [trigger] = React.Children.toArray(props.children);
  let [, content] = props.children as [ReactElement, SpectrumDialogClose];
  yield {
    element: trigger,
    wrapper: (element) => (
      <DialogTrigger key={element.key} {...props}>
        {element}
        {content}
      </DialogTrigger>
    )
  };
};

/**
 * DialogTrigger serves as a wrapper around a Dialog and its associated trigger, linking the Dialog's
 * open state with the trigger's press state. Additionally, it allows you to customize the type and
 * positioning of the Dialog.
 */

// We don't want getCollectionNode to show up in the type definition
let _DialogTrigger = DialogTrigger as (props: SpectrumDialogTriggerProps) => JSX.Element;
export {_DialogTrigger as DialogTrigger};

function PopoverTrigger({state, targetRef, trigger, content, hideArrow, ...props}) {
  let triggerRef = useRef<HTMLElement>(null);
  let {triggerProps, overlayProps} = useOverlayTrigger({type: 'dialog'}, state, triggerRef);

  let triggerPropsWithRef = {
    ...triggerProps,
    ref: targetRef ? undefined : triggerRef
  };

  let overlay = (
    <Popover
      {...props}
      hideArrow={hideArrow}
      triggerRef={targetRef || triggerRef}
      state={state}>
      {typeof content === 'function' ? content(state.close) : content}
    </Popover>
  );

  return (
    <DialogTriggerBase
      type="popover"
      state={state}
      triggerProps={triggerPropsWithRef}
      dialogProps={overlayProps}
      trigger={trigger}
      overlay={overlay} />
  );
}

interface SpectrumDialogTriggerBase {
  type: 'modal' | 'popover' | 'tray' | 'fullscreen' | 'fullscreenTakeover',
  state: OverlayTriggerState,
  isDismissable?: boolean,
  dialogProps?: SpectrumDialogProps | {},
  triggerProps?: any,
  overlay?: ReactElement,
  trigger: ReactElement
}

function DialogTriggerBase({type, state, isDismissable, dialogProps = {}, triggerProps = {}, overlay, trigger}: SpectrumDialogTriggerBase) {
  let context = {
    type,
    onClose: state.close,
    isDismissable,
    ...dialogProps
  };

  return (
    <Fragment>
      <PressResponder
        {...triggerProps}
        onPress={state.toggle}
        isPressed={state.isOpen && type !== 'modal' && type !== 'fullscreen' && type !== 'fullscreenTakeover'}>
        {trigger}
      </PressResponder>
      <DialogContext.Provider value={context}>
        {overlay}
      </DialogContext.Provider>
    </Fragment>
  );
}
