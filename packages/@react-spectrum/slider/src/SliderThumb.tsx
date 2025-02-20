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

import {AriaSliderThumbProps} from '@react-types/slider';
import {classNames} from '@react-spectrum/utils';
import {FocusRing} from '@react-aria/focus';
import {mergeProps} from '@react-aria/utils';
import React, {ReactElement, useRef} from 'react';
import {RefObject} from '@react-types/shared';
import {SliderState} from '@react-stately/slider';
import styles from '@adobe/spectrum-css-temp/components/slider/vars.css';
import {useHover} from '@react-aria/interactions';
import {useSliderThumb} from '@react-aria/slider';
import {VisuallyHidden} from '@react-aria/visually-hidden';

interface SliderThumbProps extends AriaSliderThumbProps {
  trackRef: RefObject<HTMLElement | null>,
  inputRef?: RefObject<HTMLInputElement | null>,
  state: SliderState
}

export function SliderThumb(props: SliderThumbProps): ReactElement {
  let {
    inputRef,
    state
  } = props;
  let backupRef = useRef<HTMLInputElement | null>(null);
  inputRef = inputRef || backupRef;

  let {thumbProps, inputProps, isDragging, isFocused} = useSliderThumb({
    ...props,
    inputRef
  }, state);

  let {hoverProps, isHovered} = useHover({});

  return (
    <FocusRing within focusRingClass={classNames(styles, 'is-focused')}>
      <div
        className={
          classNames(
            styles,
            'spectrum-Slider-handle',
            {
              'is-hovered': isHovered,
              'is-dragged': isDragging,
              'is-tophandle': isFocused
            }
          )
        }
        {...mergeProps(thumbProps, hoverProps)}
        role="presentation">
        <VisuallyHidden>
          <input className={classNames(styles, 'spectrum-Slider-input')} ref={inputRef} {...inputProps} />
        </VisuallyHidden>
      </div>
    </FocusRing>
  );
}
