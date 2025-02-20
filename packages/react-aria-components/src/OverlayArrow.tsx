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

import {ContextValue, RenderProps, useContextProps, useRenderProps} from './utils';
import {DOMProps, forwardRefType} from '@react-types/shared';
import {filterDOMProps} from '@react-aria/utils';
import {PlacementAxis} from 'react-aria';
import React, {createContext, CSSProperties, ForwardedRef, forwardRef, HTMLAttributes} from 'react';

interface OverlayArrowContextValue extends OverlayArrowProps {
  placement: PlacementAxis | null
}

export const OverlayArrowContext = createContext<ContextValue<OverlayArrowContextValue, HTMLDivElement>>({
  placement: 'bottom'
});

export interface OverlayArrowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style' | 'children'>, RenderProps<OverlayArrowRenderProps>, DOMProps {}

export interface OverlayArrowRenderProps {
  /**
   * The placement of the overlay relative to the trigger.
   * @selector [data-placement="left | right | top | bottom"]
   */
  placement: PlacementAxis | null
}

/**
 * An OverlayArrow renders a custom arrow element relative to an overlay element
 * such as a popover or tooltip such that it aligns with a trigger element.
 */
export const OverlayArrow = /*#__PURE__*/ (forwardRef as forwardRefType)(function OverlayArrow(props: OverlayArrowProps, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, OverlayArrowContext);
  let placement = (props as OverlayArrowContextValue).placement;
  let style: CSSProperties = {
    position: 'absolute',
    transform: placement === 'top' || placement === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)'
  };
  if (placement != null) {
    style[placement] = '100%';
  }

  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-OverlayArrow',
    values: {
      placement
    }
  });
  // remove undefined values from renderProps.style object so that it can be
  // spread merged with the other style object
  if (renderProps.style) {
    Object.keys(renderProps.style).forEach(key => renderProps.style![key] === undefined && delete renderProps.style![key]);
  }

  let DOMProps = filterDOMProps(props);

  return (
    <div
      {...DOMProps}
      {...renderProps}
      style={{
        ...style,
        ...renderProps.style
      }}
      ref={ref}
      data-placement={placement} />
  );
});
