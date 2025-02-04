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

import {AriaSliderProps, AriaSliderThumbProps, HoverEvents, mergeProps, Orientation, useFocusRing, useHover, useNumberFormatter, useSlider, useSliderThumb, VisuallyHidden} from 'react-aria';
import {ContextValue, Provider, RenderProps, SlotProps, useContextProps, useRenderProps, useSlot, useSlottedContext} from './utils';
import {filterDOMProps} from '@react-aria/utils';
import {forwardRefType, RefObject} from '@react-types/shared';
import {LabelContext} from './Label';
import React, {createContext, ForwardedRef, forwardRef, HTMLAttributes, OutputHTMLAttributes, useContext, useRef} from 'react';
import {SliderState, useSliderState} from 'react-stately';

export interface SliderProps<T = number | number[]> extends Omit<AriaSliderProps<T>, 'label'>, RenderProps<SliderRenderProps>, SlotProps {
  /**
   * The display format of the value label.
   */
  format?: Intl.NumberFormatOptions | ((value: number, locale: string) => string),
  /**
   * The display format of the value label.
   * @deprecated Use `format` instead.
   */
  formatOptions?: Intl.NumberFormatOptions
}

export const SliderContext = createContext<ContextValue<SliderProps, HTMLDivElement>>(null);
export const SliderStateContext = createContext<SliderState | null>(null);
export const SliderTrackContext = createContext<ContextValue<SliderTrackContextValue, HTMLDivElement>>(null);
export const SliderOutputContext = createContext<ContextValue<SliderOutputContextValue, HTMLOutputElement>>(null);

export interface SliderRenderProps {
  /**
   * The orientation of the slider.
   * @selector [data-orientation="horizontal | vertical"]
   */
  orientation: Orientation,
  /**
   * Whether the slider is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * State of the slider.
   */
  state: SliderState
}

/**
 * A slider allows a user to select one or more values within a range.
 */
export const Slider = /*#__PURE__*/ (forwardRef as forwardRefType)(function Slider<T extends number | number[]>(props: SliderProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, SliderContext);
  let trackRef = useRef<HTMLDivElement>(null);
  let numberFormatter = useNumberFormatter(props.format ?? props.formatOptions);
  let state = useSliderState({...props, numberFormatter});
  let [labelRef, label] = useSlot(
    !props['aria-label'] && !props['aria-labelledby']
  );
  let {
    groupProps,
    trackProps,
    labelProps,
    outputProps
  } = useSlider({...props, label}, state, trackRef);

  let renderProps = useRenderProps({
    ...props,
    values: {
      orientation: state.orientation,
      isDisabled: state.isDisabled,
      state
    },
    defaultClassName: 'react-aria-Slider'
  });

  let DOMProps = filterDOMProps(props);
  delete DOMProps.id;

  return (
    <Provider
      values={[
        [SliderStateContext, state],
        [SliderTrackContext, {...trackProps, ref: trackRef}],
        [SliderOutputContext, outputProps],
        [LabelContext, {...labelProps, ref: labelRef}]
      ]}>
      <div
        {...DOMProps}
        {...groupProps}
        {...renderProps}
        ref={ref}
        slot={props.slot || undefined}
        data-orientation={state.orientation}
        data-disabled={state.isDisabled || undefined} />
    </Provider>
  );
});

export interface SliderOutputProps extends RenderProps<SliderRenderProps> {}
interface SliderOutputContextValue extends Omit<OutputHTMLAttributes<HTMLOutputElement>, 'children' | 'className' | 'style'>, SliderOutputProps {}

/**
 * A slider output displays the current value of a slider as text.
 */
export const SliderOutput = /*#__PURE__*/ (forwardRef as forwardRefType)(function SliderOutput(props: SliderOutputProps, ref: ForwardedRef<HTMLOutputElement>) {
  [props, ref] = useContextProps(props, ref, SliderOutputContext);
  let {children, style, className, ...otherProps} = props;
  let state = useContext(SliderStateContext)!;
  let renderProps = useRenderProps({
    className,
    style,
    children,
    defaultChildren: state.getThumbValueLabel(0),
    defaultClassName: 'react-aria-SliderOutput',
    values: {
      orientation: state.orientation,
      isDisabled: state.isDisabled,
      state
    }
  });

  return (
    <output
      {...otherProps}
      {...renderProps}
      ref={ref}
      data-orientation={state.orientation || undefined}
      data-disabled={state.isDisabled || undefined} />
  );
});

export interface SliderTrackRenderProps extends SliderRenderProps {
  /**
   * Whether the slider track is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean
}

export interface SliderTrackProps extends HoverEvents, RenderProps<SliderTrackRenderProps> {}
interface SliderTrackContextValue extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'className' | 'style'>, SliderTrackProps {}

/**
 * A slider track is a container for one or more slider thumbs.
 */
export const SliderTrack = /*#__PURE__*/ (forwardRef as forwardRefType)(function SliderTrack(props: SliderTrackProps, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, SliderTrackContext);
  let state = useContext(SliderStateContext)!;
  let {onHoverStart, onHoverEnd, onHoverChange, ...otherProps} = props;
  let {hoverProps, isHovered} = useHover({onHoverStart, onHoverEnd, onHoverChange});
  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-SliderTrack',
    values: {
      orientation: state.orientation,
      isDisabled: state.isDisabled,
      isHovered,
      state
    }
  });

  return (
    <div
      {...mergeProps(otherProps, hoverProps)}
      {...renderProps}
      ref={ref}
      data-hovered={isHovered || undefined}
      data-orientation={state.orientation || undefined}
      data-disabled={state.isDisabled || undefined} />
  );
});

export interface SliderThumbRenderProps {
  /**
   * State of the slider.
   */
  state: SliderState,
  /**
   * Whether this thumb is currently being dragged.
   * @selector [data-dragging]
   */
  isDragging: boolean,
  /**
   * Whether the thumb is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean,
  /**
   * Whether the thumb is currently focused.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the thumb is keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the thumb is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean
}

export interface SliderThumbProps extends Omit<AriaSliderThumbProps, 'label' | 'validationState'>, HoverEvents, RenderProps<SliderThumbRenderProps> {
  /**
   * A ref for the HTML input element.
   */
  inputRef?: RefObject<HTMLInputElement | null>
}

/**
 * A slider thumb represents an individual value that the user can adjust within a slider track.
 */
export const SliderThumb = /*#__PURE__*/ (forwardRef as forwardRefType)(function SliderThumb(props: SliderThumbProps, ref: ForwardedRef<HTMLDivElement>) {
  let {
    inputRef: userInputRef = null
  } = props;
  let state = useContext(SliderStateContext)!;
  let {ref: trackRef} = useSlottedContext(SliderTrackContext)!;
  let {index = 0} = props;
  let defaultInputRef = useRef<HTMLInputElement>(null);
  let inputRef = userInputRef || defaultInputRef;
  let [labelRef, label] = useSlot(
    !props['aria-label'] && !props['aria-labelledby']
  );
  let {thumbProps, inputProps, labelProps, isDragging, isFocused, isDisabled} = useSliderThumb({
    ...props,
    index,
    trackRef: trackRef as RefObject<HTMLDivElement | null>,
    inputRef,
    label
  }, state);

  let {focusProps, isFocusVisible} = useFocusRing();
  let {hoverProps, isHovered} = useHover(props);

  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-SliderThumb',
    values: {
      state,
      isHovered,
      isDragging,
      isFocused,
      isFocusVisible,
      isDisabled
    }
  });

  let DOMProps = filterDOMProps(props);
  delete DOMProps.id;

  return (
    <div
      {...mergeProps(DOMProps, thumbProps, hoverProps)}
      {...renderProps}
      ref={ref}
      style={{...thumbProps.style, ...renderProps.style}}
      data-hovered={isHovered || undefined}
      data-dragging={isDragging || undefined}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-disabled={isDisabled || undefined}>
      <VisuallyHidden>
        <input ref={inputRef} {...mergeProps(inputProps, focusProps)} />
      </VisuallyHidden>
      <Provider
        values={[
          [LabelContext, {...labelProps, ref: labelRef}]
        ]}>
        {renderProps.children}
      </Provider>
    </div>
  );
});
