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
import {Overlay} from './Overlay';
import overrideStyles from './overlays.css';
import React, {forwardRef, HTMLAttributes, ReactNode, RefObject, useEffect, useRef, useState} from 'react';
import {TrayProps} from '@react-types/overlays';
import trayStyles from '@adobe/spectrum-css-temp/components/tray/vars.css';
import {Underlay} from './Underlay';
import {useModal, useOverlay, usePreventScroll} from '@react-aria/overlays';

interface TrayWrapperProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode,
  isOpen?: boolean,
  onClose?: () => void,
  isFixedHeight?: boolean,
  isNonModal?: boolean,
  overlayProps: HTMLAttributes<HTMLElement>
}

function Tray(props: TrayProps, ref: DOMRef<HTMLDivElement>) {
  let {children, onClose, isFixedHeight, isNonModal, ...otherProps} = props;
  let domRef = useDOMRef(ref);
  let {styleProps} = useStyleProps(props);
  let {overlayProps, underlayProps} = useOverlay({...props, isDismissable: true}, domRef);
  let underlayRef = useRef(null);

  return (
    <Overlay {...otherProps} nodeRef={underlayRef}>
      <Underlay {...underlayProps} ref={underlayRef} />
      <TrayWrapper
        {...styleProps}
        onClose={onClose}
        ref={domRef}
        overlayProps={overlayProps}
        isFixedHeight={isFixedHeight}
        isNonModal={isNonModal}>
        {children}
      </TrayWrapper>
    </Overlay>
  );
}

let TrayWrapper = forwardRef(function (props: TrayWrapperProps, ref: RefObject<HTMLDivElement>) {
  let {
    children,
    isOpen,
    isFixedHeight,
    isNonModal,
    overlayProps,
    ...otherProps
  } = props;
  usePreventScroll();
  let {modalProps} = useModal({
    isDisabled: isNonModal
  });

  // We need to measure the window's height in JS rather than using percentages in CSS
  // so that contents (e.g. menu) can inherit the max-height properly. Using percentages
  // does not work properly because there is nothing to base the percentage on.
  // We cannot use vh units because mobile browsers adjust the window height dynamically
  // when the address bar/bottom toolbars show and hide on scroll and vh units are fixed.
  // Also, the visual viewport is smaller than the layout viewport when the virtual keyboard
  // is up, so use the VisualViewport API to ensure the tray is displayed above the keyboard.
  let viewport = useViewportSize();
  let [height, setHeight] = useState(viewport.height);
  let timeoutRef = useRef<any>();

  useEffect(() => {
    clearTimeout(timeoutRef.current);

    // When the height is decreasing, and the keyboard is visible
    // (visual viewport smaller than layout viewport), delay setting
    // the new max height until after the animation is complete
    // so that there isn't an empty space under the tray briefly.
    if (viewport.height < height && viewport.height < window.innerHeight) {
      timeoutRef.current = setTimeout(() => {
        setHeight(viewport.height);
      }, 500);
    } else {
      setHeight(viewport.height);
    }
  }, [height, viewport.height]);

  let wrapperStyle: any = {
    '--spectrum-visual-viewport-height': height + 'px'
  };

  let wrapperClassName = classNames(
    trayStyles,
    'spectrum-Tray-wrapper'
  );

  let className = classNames(
    trayStyles,
    'spectrum-Tray',
    {
      'is-open': isOpen,
      'spectrum-Tray--fixedHeight': isFixedHeight
    },
    classNames(
      overrideStyles,
      'spectrum-Tray',
      'react-spectrum-Tray'
    ),
    otherProps.className
  );

  let domProps = mergeProps(otherProps, overlayProps);

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      <div
        {...domProps}
        {...modalProps}
        className={className}
        ref={ref}
        data-testid="tray">
        {children}
      </div>
    </div>
  );
});

let _Tray = forwardRef(Tray);
export {_Tray as Tray};
