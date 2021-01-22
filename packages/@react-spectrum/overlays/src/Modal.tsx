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

import {classNames, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import {DOMRef} from '@react-types/shared';
import {mergeProps, useViewportSize} from '@react-aria/utils';
import {ModalProps} from '@react-types/overlays';
import modalStyles from '@adobe/spectrum-css-temp/components/modal/vars.css';
import {Overlay} from './Overlay';
import overrideStyles from './overlays.css';
import React, {forwardRef, HTMLAttributes, ReactNode, RefObject, useRef} from 'react';
import {Underlay} from './Underlay';
import {useModal, useOverlay, usePreventScroll} from '@react-aria/overlays';

interface ModalWrapperProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode,
  isOpen?: boolean,
  onClose?: () => void,
  type?: 'modal' | 'fullscreen' | 'fullscreenTakeover',
  isDismissable?: boolean,
  isKeyboardDismissDisabled?: boolean
}

function Modal(props: ModalProps, ref: DOMRef<HTMLDivElement>) {
  let {children, onClose, type, isDismissable, isKeyboardDismissDisabled, ...otherProps} = props;
  let domRef = useDOMRef(ref);
  let {styleProps} = useStyleProps(props);

  let underlayRef = useRef(null);

  return (
    <Overlay {...otherProps} nodeRef={underlayRef}>
      <Underlay ref={underlayRef} />
      <ModalWrapper
        {...styleProps}
        onClose={onClose}
        type={type}
        isDismissable={isDismissable}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
        ref={domRef}>
        {children}
      </ModalWrapper>
    </Overlay>
  );
}

let typeMap = {
  fullscreen: 'fullscreen',
  fullscreenTakeover: 'fullscreenTakeover'
};

let ModalWrapper = forwardRef(function (props: ModalWrapperProps, ref: RefObject<HTMLDivElement>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let {children, isOpen, type, isDismissable, isKeyboardDismissDisabled, ...otherProps} = props;
  let typeVariant = typeMap[type];

  let {overlayProps} = useOverlay(props, ref);
  usePreventScroll();
  let {modalProps} = useModal();

  let wrapperClassName = classNames(
    modalStyles,
    'spectrum-Modal-wrapper',
    classNames(
      overrideStyles,
      'spectrum-Modal-wrapper',
      'react-spectrum-Modal-wrapper'
    )
  );

  let modalClassName = classNames(
    modalStyles,
    'spectrum-Modal',
    {
      'is-open': isOpen
    },
    classNames(
      overrideStyles,
      'spectrum-Modal',
      'react-spectrum-Modal'
    ),
    {[`spectrum-Modal--${typeVariant}`]: typeVariant},
    otherProps.className
  );

  let viewport = useViewportSize();
  let style: any = {
    '--spectrum-visual-viewport-height': viewport.height + 'px'
  };

  return (
    <div className={wrapperClassName} style={style}>
      <div
        {...mergeProps(otherProps, overlayProps, modalProps)}
        ref={ref}
        className={modalClassName}
        data-testid="modal">
        {children}
      </div>
    </div>
  );
});

let _Modal = forwardRef(Modal);
export {_Modal as Modal};
