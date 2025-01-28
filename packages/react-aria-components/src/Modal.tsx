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

import {AnimationProps, DOMAttributes, forwardRefType, RefObject} from '@react-types/shared';
import {AriaModalOverlayProps, DismissButton, Overlay, useIsSSR, useModalOverlay} from 'react-aria';
import {ContextValue, Provider, RenderProps, SlotProps, useContextProps, useRenderProps} from './utils';
import {filterDOMProps, mergeProps, mergeRefs, useEnterAnimation, useExitAnimation, useObjectRef, useViewportSize} from '@react-aria/utils';
import {OverlayTriggerProps, OverlayTriggerState, useOverlayTriggerState} from 'react-stately';
import {OverlayTriggerStateContext} from './Dialog';
import React, {createContext, ForwardedRef, forwardRef, useContext, useMemo, useRef} from 'react';

export interface ModalOverlayProps extends AriaModalOverlayProps, OverlayTriggerProps, RenderProps<ModalRenderProps>, SlotProps, AnimationProps {
  /**
   * The container element in which the overlay portal will be placed. This may have unknown behavior depending on where it is portalled to.
   * @default document.body
   */
  UNSTABLE_portalContainer?: Element
}

interface InternalModalContextValue {
  modalProps: DOMAttributes,
  modalRef: RefObject<HTMLDivElement | null>,
  isExiting: boolean,
  isDismissable?: boolean
}

export const ModalContext = createContext<ContextValue<ModalOverlayProps, HTMLDivElement>>(null);
const InternalModalContext = createContext<InternalModalContextValue | null>(null);

export interface ModalRenderProps {
  /**
   * Whether the modal is currently entering. Use this to apply animations.
   * @selector [data-entering]
   */
  isEntering: boolean,
  /**
   * Whether the modal is currently exiting. Use this to apply animations.
   * @selector [data-exiting]
   */
  isExiting: boolean,
  /**
   * State of the modal.
   */
  state: OverlayTriggerState
}

/**
 * A modal is an overlay element which blocks interaction with elements outside it.
 */
export const Modal = /*#__PURE__*/ (forwardRef as forwardRefType)(function Modal(props: ModalOverlayProps, ref: ForwardedRef<HTMLDivElement>) {
  let ctx = useContext(InternalModalContext);

  if (ctx) {
    return <ModalContent {...props} modalRef={ref}>{props.children}</ModalContent>;
  }

  let {
    isDismissable,
    isKeyboardDismissDisabled,
    isOpen,
    defaultOpen,
    onOpenChange,
    children,
    isEntering,
    isExiting,
    UNSTABLE_portalContainer,
    shouldCloseOnInteractOutside,
    ...otherProps
  } = props;

  return (
    <ModalOverlay
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isEntering={isEntering}
      isExiting={isExiting}
      UNSTABLE_portalContainer={UNSTABLE_portalContainer}
      shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}>
      <ModalContent {...otherProps} modalRef={ref}>
        {children}
      </ModalContent>
    </ModalOverlay>
  );
});

interface ModalOverlayInnerProps extends ModalOverlayProps {
  overlayRef: RefObject<HTMLDivElement | null>,
  modalRef: RefObject<HTMLDivElement | null>,
  state: OverlayTriggerState,
  isExiting: boolean
}

function ModalOverlayWithForwardRef(props: ModalOverlayProps, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, ModalContext);
  let contextState = useContext(OverlayTriggerStateContext);
  let localState = useOverlayTriggerState(props);
  let state = props.isOpen != null || props.defaultOpen != null || !contextState ? localState : contextState;

  let objectRef = useObjectRef(ref);
  let modalRef = useRef<HTMLDivElement>(null);
  let isOverlayExiting = useExitAnimation(objectRef, state.isOpen, props.onExitComplete);
  let isModalExiting = useExitAnimation(modalRef, state.isOpen, props.onEnterComplete);
  let isExiting = isOverlayExiting || isModalExiting || props.isExiting || false;
  let isSSR = useIsSSR();

  if ((!state.isOpen && !isExiting) || isSSR) {
    return null;
  }

  return (
    <ModalOverlayInner
      {...props}
      state={state}
      isExiting={isExiting}
      overlayRef={objectRef}
      modalRef={modalRef} />
  );
}

/**
 * A ModalOverlay is a wrapper for a Modal which allows customizing the backdrop element.
 */
export const ModalOverlay = /*#__PURE__*/ (forwardRef as forwardRefType)(ModalOverlayWithForwardRef);

function ModalOverlayInner({UNSTABLE_portalContainer, ...props}: ModalOverlayInnerProps) {
  let modalRef = props.modalRef;
  let {state} = props;
  let {modalProps, underlayProps} = useModalOverlay(props, state, modalRef);

  let entering = useEnterAnimation(props.overlayRef, undefined, props.onEnterComplete) || props.isEntering || false;
  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-ModalOverlay',
    values: {
      isEntering: entering,
      isExiting: props.isExiting,
      state
    }
  });

  let viewport = useViewportSize();
  let style = {
    ...renderProps.style,
    '--visual-viewport-height': viewport.height + 'px'
  };

  return (
    <Overlay isExiting={props.isExiting} portalContainer={UNSTABLE_portalContainer}>
      <div
        {...mergeProps(filterDOMProps(props as any), underlayProps)}
        {...renderProps}
        style={style}
        ref={props.overlayRef}
        data-entering={entering || undefined}
        data-exiting={props.isExiting || undefined}>
        <Provider
          values={[
            [InternalModalContext, {modalProps, modalRef, isExiting: props.isExiting, isDismissable: props.isDismissable}],
            [OverlayTriggerStateContext, state]
          ]}>
          {renderProps.children}
        </Provider>
      </div>
    </Overlay>
  );
}

interface ModalContentProps extends RenderProps<ModalRenderProps>, AnimationProps {
  modalRef: ForwardedRef<HTMLDivElement>
}

function ModalContent(props: ModalContentProps) {
  let {modalProps, modalRef, isExiting, isDismissable} = useContext(InternalModalContext)!;
  let state = useContext(OverlayTriggerStateContext)!;
  let mergedRefs = useMemo(() => mergeRefs(props.modalRef, modalRef), [props.modalRef, modalRef]);

  let ref = useObjectRef(mergedRefs);
  let entering = useEnterAnimation(ref, undefined, props.onEnterComplete);
  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-Modal',
    values: {
      isEntering: entering,
      isExiting,
      state
    }
  });

  return (
    <div
      {...mergeProps(filterDOMProps(props as any), modalProps)}
      {...renderProps}
      ref={ref}
      data-entering={entering || undefined}
      data-exiting={isExiting || undefined}>
      {isDismissable &&
        <DismissButton onDismiss={state.close} />
      }
      {renderProps.children}
    </div>
  );
}
