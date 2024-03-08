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

import {ariaHideOutside} from './ariaHideOutside';
import {AriaOverlayProps, useOverlay} from './useOverlay';
import {DOMAttributes} from '@react-types/shared';
import {mergeProps} from '@react-aria/utils';
import {OverlayTriggerState} from '@react-stately/overlays';
import {RefObject, useEffect} from 'react';
import {useOverlayFocusContain} from './Overlay';
import {usePreventScroll} from './usePreventScroll';

export interface AriaModalOverlayProps extends AriaOverlayProps {}

export interface ModalOverlayAria {
  /** Props for the modal element. */
  modalProps: DOMAttributes,
  /** Props for the underlay element. */
  underlayProps: DOMAttributes
}

/**
 * Provides the behavior and accessibility implementation for a modal component.
 * A modal is an overlay element which blocks interaction with elements outside it.
 */
export function useModalOverlay(props: AriaModalOverlayProps, state: OverlayTriggerState, ref: RefObject<HTMLElement>): ModalOverlayAria {
  let {overlayProps, underlayProps} = useOverlay({
    ...props,
    isOpen: state.isOpen,
    onClose: state.close
  }, ref);

  usePreventScroll({
    isDisabled: !state.isOpen
  });

  useOverlayFocusContain();

  useEffect(() => {
    if (state.isOpen) {
      return ariaHideOutside([ref.current]);
    }
  }, [state.isOpen, ref]);

  return {
    modalProps: mergeProps(overlayProps),
    underlayProps
  };
}
