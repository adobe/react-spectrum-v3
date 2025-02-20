import {AriaColorWheelOptions, useColorWheel} from '@react-aria/color';
import {ColorWheelContext} from './RSPContexts';
import {ColorWheelState, useColorWheelState} from '@react-stately/color';
import {ContextValue, Provider, RenderProps, SlotProps, StyleRenderProps, useContextProps, useRenderProps} from './utils';
import {DOMProps} from '@react-types/shared';
import {filterDOMProps} from '@react-aria/utils';
import {InternalColorThumbContext} from './ColorThumb';
import React, {createContext, ForwardedRef, forwardRef, HTMLAttributes, useContext, useRef} from 'react';

export interface ColorWheelRenderProps {
  /**
   * Whether the color wheel is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * State of the color color wheel.
   */
  state: ColorWheelState
}

export interface ColorWheelProps extends AriaColorWheelOptions, RenderProps<ColorWheelRenderProps>, SlotProps {}

export const ColorWheelStateContext = createContext<ColorWheelState | null>(null);

/**
 * A color wheel allows users to adjust the hue of an HSL or HSB color value on a circular track.
 */
export const ColorWheel = forwardRef(function ColorWheel(props: ColorWheelProps, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, ColorWheelContext);
  let state = useColorWheelState(props);
  let inputRef = useRef(null);
  let {trackProps, inputProps, thumbProps} = useColorWheel(props, state, inputRef);

  let renderProps = useRenderProps({
    ...props,
    values: {
      state,
      isDisabled: props.isDisabled || false
    },
    defaultClassName: 'react-aria-ColorWheel',
    defaultStyle: {
      position: 'relative'
    }
  });

  let DOMProps = filterDOMProps(props);
  delete DOMProps.id;

  return (
    <div
      {...DOMProps}
      {...renderProps}
      ref={ref}
      slot={props.slot || undefined}
      data-disabled={props.isDisabled || undefined}>
      <Provider
        values={[
          [ColorWheelStateContext, state],
          [ColorWheelTrackContext, trackProps],
          [InternalColorThumbContext, {state, thumbProps, inputXRef: inputRef, xInputProps: inputProps, isDisabled: props.isDisabled}]
        ]}>
        {renderProps.children}
      </Provider>
    </div>
  );
});

export interface ColorWheelTrackRenderProps extends ColorWheelRenderProps {}
export interface ColorWheelTrackProps extends StyleRenderProps<ColorWheelTrackRenderProps>, DOMProps {}
interface ColorWheelTrackContextValue extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'className' | 'style'>, ColorWheelTrackProps {}

export const ColorWheelTrackContext = createContext<ContextValue<ColorWheelTrackContextValue, HTMLDivElement>>(null);

/**
 * A color wheel track renders a circular gradient track.
 */
export const ColorWheelTrack = forwardRef(function ColorWheelTrack(props: ColorWheelTrackProps, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, ColorWheelTrackContext);
  let state = useContext(ColorWheelStateContext)!;

  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-ColorWheelTrack',
    values: {
      isDisabled: state.isDisabled,
      state
    }
  });
  let DOMProps = filterDOMProps(props);

  return (
    <div
      {...DOMProps}
      {...renderProps}
      ref={ref}
      data-disabled={state.isDisabled || undefined} />
  );
});
