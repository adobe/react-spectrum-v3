/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {classNames, dimensionValue, useFocusableRef, useStyleProps} from '@react-spectrum/utils';
import {ColorThumb} from './ColorThumb';
import {FocusableRef} from '@react-types/shared';
import {mergeProps} from '@react-aria/utils';
import React, {ReactElement, useRef} from 'react';
import {SpectrumColorAreaProps} from '@react-types/color';
import styles from '@adobe/spectrum-css-temp/components/colorarea/vars.css';
import {useColorArea} from '@react-aria/color';
import {useColorAreaState} from '@react-stately/color';
import {useFocusRing} from '@react-aria/focus';
import {useProviderProps} from '@react-spectrum/provider';

function ColorArea(props: SpectrumColorAreaProps, ref: FocusableRef<HTMLDivElement>) {
  props = useProviderProps(props);

  let {isDisabled} = props;
  let size = props.size && dimensionValue(props.size);
  let {styleProps} = useStyleProps(props);

  let xInputRef = useRef(null);
  let yInputRef = useRef(null);
  let containerRef = useFocusableRef(ref, xInputRef);

  let state = useColorAreaState(props);

  let {
    colorAreaProps,
    gradientProps,
    xInputProps,
    yInputProps,
    thumbProps
  } = useColorArea(props, state, xInputRef, yInputRef, containerRef);

  let {focusProps, isFocusVisible} = useFocusRing();

  return (
    <div
      {...colorAreaProps}
      className={
        classNames(
          styles,
          'spectrum-ColorArea',
          {
            'is-disabled': isDisabled
          },
          styleProps.className
        )
      }
      ref={containerRef}
      style={{
        ...colorAreaProps.style,
        ...styleProps.style,
        // Workaround around https://github.com/adobe/spectrum-css/issues/1032
        // @ts-ignore
        width: size,
        height: size
      }}>
      <div {...gradientProps} className={classNames(styles, 'spectrum-ColorArea-gradient')} />
      <ColorThumb
        value={state.getDisplayColor()}
        isFocused={isFocusVisible}
        isDisabled={isDisabled}
        isDragging={state.isDragging}
        className={classNames(styles, 'spectrum-ColorArea-handle')}
        {...thumbProps}>
        <div>
          <input className={classNames(styles, 'spectrum-ColorArea-slider')} {...mergeProps(xInputProps, focusProps)} ref={xInputRef} />
          <input className={classNames(styles, 'spectrum-ColorArea-slider')} {...mergeProps(yInputProps, focusProps)} ref={yInputRef} />
        </div>
      </ColorThumb>
    </div>
  );
}

let _ColorArea = React.forwardRef(ColorArea) as (props: SpectrumColorAreaProps & {ref?: FocusableRef<HTMLDivElement>}) => ReactElement;
export {_ColorArea as ColorArea};
