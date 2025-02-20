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

import {classNames} from '@react-spectrum/utils';
import {Color} from '@react-types/color';
import {DOMProps, RefObject} from '@react-types/shared';
import {Overlay} from '@react-spectrum/overlays';
import React, {CSSProperties, ReactElement, useRef, useState} from 'react';
import stylesHandle from '@adobe/spectrum-css-temp/components/colorhandle/vars.css';
import stylesLoupe from '@adobe/spectrum-css-temp/components/colorloupe/vars.css';
import {useId, useLayoutEffect} from '@react-aria/utils';
import {useProvider} from '@react-spectrum/provider';

interface ColorThumbProps extends DOMProps {
  value: Color,
  isDisabled?: boolean,
  isDragging?: boolean, // shows the color loupe
  isFocused?: boolean, // makes the circle larger
  className?: string,
  children?: ReactElement,
  style?: CSSProperties,
  containerRef?: RefObject<HTMLElement | null>
}

function ColorThumb(props: ColorThumbProps): ReactElement {
  let {value, isDisabled, isDragging, isFocused, children, className = '', style, containerRef, ...otherProps} = props;

  let valueCSS = value.toString('css');
  let loupeRef = useRef<HTMLElement | null>(null);
  let provider = useProvider();

  return (
    <div className={classNames(stylesHandle, 'spectrum-ColorHandle', {'is-focused': isFocused, 'is-disabled': isDisabled}) + ' ' + className} style={style} {...otherProps}>
      <div className={classNames(stylesHandle, 'spectrum-ColorHandle-color')} style={{backgroundColor: valueCSS}} />
      <Overlay isOpen={isDragging && provider != null} nodeRef={loupeRef}>
        <ColorLoupe valueCSS={valueCSS} containerRef={containerRef} loupeRef={loupeRef} style={style} />
      </Overlay>
      {children}
    </div>
  );
}

// ColorLoupe is rendered in a portal so that it breaks out of clipped/scrolling containers (e.g. popovers).
function ColorLoupe({isOpen, valueCSS, containerRef, loupeRef, style}: any) {
  let patternId = useId();

  // Get the bounding rectangle of the container (e.g. ColorArea/ColorSlider).
  let [containerRect, setContainerRect] = useState({top: 0, left: 0, width: 0, height: 0});
  useLayoutEffect(() => {
    let rect = containerRef.current?.getBoundingClientRect();
    setContainerRect({
      top: rect?.top || 0,
      left: rect?.left || 0,
      width: rect?.width || 0,
      height: rect?.height || 0
    });
  }, [containerRef]);

  // Compute the pixel position of the thumb.
  let thumbTop = style.top || '50%';
  if (typeof thumbTop === 'string' && thumbTop.endsWith('%')) {
    thumbTop = parseFloat(style.top || '50%') / 100 * containerRect.height;
  }

  let thumbLeft = style.left || '50%';
  if (typeof thumbLeft === 'string' && thumbLeft.endsWith('%')) {
    thumbLeft = parseFloat(thumbLeft || '50%') / 100 * containerRect.width;
  }

  return (
    <svg
      className={classNames(stylesLoupe, 'spectrum-ColorLoupe',  {'is-open': isOpen})}
      style={{
        // Position relative to the viewport.
        position: 'fixed',
        top: containerRect.top + thumbTop,
        left: containerRect.left + thumbLeft
      }}
      ref={loupeRef}
      aria-hidden="true">
      <pattern id={patternId} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect className={classNames(stylesLoupe, 'spectrum-ColorLoupe-inner-background')} x="0" y="0" width="16" height="16" />
        <rect className={classNames(stylesLoupe, 'spectrum-ColorLoupe-inner-checker')} x="0" y="0" width="8" height="8" />
        <rect className={classNames(stylesLoupe, 'spectrum-ColorLoupe-inner-checker')} x="8" y="8" width="8" height="8" />
      </pattern>
      <path
        className={classNames(stylesLoupe, 'spectrum-ColorLoupe-inner')}
        d="M25 1a24 24 0 0124 24c0 16.255-24 40-24 40S1 41.255 1 25A24 24 0 0125 1z"
        fill={`url(#${patternId})`} />
      <path
        className={classNames(stylesLoupe, 'spectrum-ColorLoupe-inner')}
        d="M25 1a24 24 0 0124 24c0 16.255-24 40-24 40S1 41.255 1 25A24 24 0 0125 1z"
        fill={valueCSS} />
      <path
        className={classNames(stylesLoupe, 'spectrum-ColorLoupe-outer')}
        d="M25 3A21.98 21.98 0 003 25c0 6.2 4 14.794 11.568 24.853A144.233 144.233 0 0025 62.132a144.085 144.085 0 0010.4-12.239C42.99 39.816 47 31.209 47 25A21.98 21.98 0 0025 3m0-2a24 24 0 0124 24c0 16.255-24 40-24 40S1 41.255 1 25A24 24 0 0125 1z" />
    </svg>
  );
}

export {ColorThumb};
