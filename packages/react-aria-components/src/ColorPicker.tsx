/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Color} from '@react-types/color';
import {ColorAreaContext, ColorFieldContext, ColorSliderContext, ColorWheelContext} from './RSPContexts';
import {ColorPickerState, ColorPickerProps as StatelyColorPickerProps, useColorPickerState} from '@react-stately/color';
import {ColorSwatchContext} from './ColorSwatch';
import {ColorSwatchPickerContext} from './ColorSwatchPicker';
import {mergeProps} from 'react-aria';
import {Provider, RenderProps, SlotProps, SlottedContextValue, useRenderProps, useSlottedContext} from './utils';
import React, {createContext, ReactElement} from 'react';

export interface ColorPickerRenderProps {
  /** The currently selected color. */
  color: Color
}

export interface ColorPickerProps extends StatelyColorPickerProps, SlotProps, Pick<RenderProps<ColorPickerRenderProps>, 'children'> {}

export const ColorPickerContext = createContext<SlottedContextValue<ColorPickerProps>>(null);
export const ColorPickerStateContext = createContext<ColorPickerState | null>(null);

/**
 * A ColorPicker synchronizes a color value between multiple React Aria color components.
 * It simplifies building color pickers with customizable layouts via composition.
 */
export function ColorPicker(props: ColorPickerProps): ReactElement {
  let ctx = useSlottedContext(ColorPickerContext, props.slot);
  props = mergeProps(ctx, props);
  let state = useColorPickerState(props);
  let renderProps = useRenderProps({
    ...props,
    values: {
      color: state.color
    }
  });

  return (
    <Provider
      values={[
        [ColorPickerStateContext, state],
        [ColorSliderContext, {value: state.color, onChange: state.setColor}],
        [ColorAreaContext, {value: state.color, onChange: state.setColor}],
        [ColorWheelContext, {value: state.color, onChange: state.setColor}],
        [ColorFieldContext, {value: state.color, onChange: state.setColor}],
        [ColorSwatchContext, {color: state.color}],
        [ColorSwatchPickerContext, {value: state.color, onChange: state.setColor}]
      ]}>
      {renderProps.children}
    </Provider>
  );
}
