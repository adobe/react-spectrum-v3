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

import {mergeProps} from '@react-aria/utils';
import {Placement} from '@react-types/overlays';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {storiesOf} from '@storybook/react';
import {useOverlayPosition, useOverlayTrigger} from '../src';
import {useOverlayTriggerState} from '@react-stately/overlays';

function Trigger(props: {
  withPortal: boolean,
  placement: Placement,
  buttonWidth?: number
}) {
  const {withPortal, placement, buttonWidth = 300} = props;
  const targetRef = React.useRef<HTMLButtonElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const state = useOverlayTriggerState({
    defaultOpen: false
  });
  const {triggerProps, overlayProps} = useOverlayTrigger({
    type: 'menu'
  }, state, targetRef);
  const {overlayProps: overlayPositionProps} = useOverlayPosition({
    targetRef,
    overlayRef,
    shouldFlip: false,
    isOpen: state.isOpen,
    offset: 10,
    placement
  });

  let overlay = (
    <div
      ref={overlayRef}
      {...mergeProps(overlayProps, overlayPositionProps)}
      style={{
        ...overlayPositionProps.style,
        boxShadow: '0 0 4px 0 rgba(0,0,0,0.25)',
        backgroundColor: 'white',
        overflow: 'auto'
      }}>
      <ul
        style={{
          padding: 10,
          margin: 0,
          listStyleType: 'none'
        }}>
        <li>Hello Hello</li>
        <li>Hello Hello</li>
        <li>Hello</li>
        <li>Hello Hello</li>
        <li>Hello</li>
      </ul>
    </div>
  );

  if (withPortal) {
    overlay = ReactDOM.createPortal(overlay, document.body);
  }
  return (
    <div style={{position: 'relative', margin: 'auto', padding: 12}}>
      <button ref={targetRef} {...triggerProps} style={{width: buttonWidth}} onClick={() => state.toggle()}>Trigger<br />(open: {`${state.isOpen}`})</button>
      {state.isOpen && overlay}
    </div>
  );
}

storiesOf('UseOverlayPosition', module)
  .add('document.body container bottom', () => <Trigger withPortal placement="bottom" />)
  .add('document.body container bottom left', () => <Trigger withPortal placement="bottom left" />)
  .add('document.body container bottom right', () => <Trigger withPortal placement="bottom right" />)
  .add('document.body small trigger bottom left', () => <Trigger buttonWidth={80} withPortal placement="bottom left" />)
  .add('document.body small trigger bottom right', () => <Trigger buttonWidth={80} withPortal placement="bottom right" />)
  .add('document.body container top', () => <Trigger withPortal placement="top" />)
  .add('positioned container bottom', () => <Trigger withPortal={false} placement="bottom" />)
  .add('positioned container bottom left', () => <Trigger withPortal={false} placement="bottom left" />)
  .add('positioned container bottom right', () => <Trigger withPortal={false} placement="bottom right" />)
  .add('positioned container top', () => <Trigger withPortal={false} placement="top" />);
