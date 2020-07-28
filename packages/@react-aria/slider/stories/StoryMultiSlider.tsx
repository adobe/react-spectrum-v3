import {classNames} from '@react-spectrum/utils';
import {CommonSliderThumbProps, SliderProps, SliderThumbProps} from '@react-types/slider';
import {FocusRing} from '@react-aria/focus';
import React from 'react';
import {SliderState, useSliderState} from '@react-stately/slider';
import styles from './story-slider.css';
import {useSlider, useSliderThumb} from '@react-aria/slider';
import {VisuallyHidden} from '@react-aria/visually-hidden';


interface StoryMultiSliderProps extends SliderProps {
  children: React.ReactNode
}

export function StoryMultiSlider(props: StoryMultiSliderProps) {
  const {children} = props;
  const trackRef = React.useRef<HTMLDivElement>(null);
  const state = useSliderState(props);
  const {
    trackProps, labelProps, commonThumbProps, containerProps
  } = useSlider(props, state, trackRef);

  const numThumbs = React.Children.count(children);
  if (numThumbs !== state.values.length) {
    throw new Error('You must have the same number of StoryThumb as the number of values in `defaultValue` or `value`.');
  }

  return (
    <div {...containerProps} className={styles.slider}>
      <div className={styles.sliderLabel}>
        {props.label && <label {...labelProps} className={styles.label}>{props.label}</label>}
        <div className={styles.value}>{JSON.stringify(state.values)}</div>
      </div>
      <div className={styles.trackContainer}>
        <div className={styles.rail} />
        <div {...trackProps} ref={trackRef} className={styles.track} />
        {React.Children.map(children, ((child, index) => 
          React.cloneElement(child as React.ReactElement, {
            __context: {
              sliderProps: props,
              state,
              trackRef,
              index,
              commonThumbProps
            }
          } as any)))}
      </div>
    </div>
  );
}


interface StoryThumbProps extends Omit<SliderThumbProps, 'index'|'labelId'> {
}

interface SliderStateContext {
  sliderProps: StoryMultiSliderProps,
  state: SliderState,
  trackRef: React.RefObject<HTMLElement>,
  index: number,
  commonThumbProps: CommonSliderThumbProps
}

export function StoryThumb(props: StoryThumbProps) {
  if (!(props as any).__context) {
    throw new Error('Cannot use StoryThumb outside of a StoryMultiSlider!');
  }
  
  const {label, isDisabled} = props;
  const context = (props as any).__context as SliderStateContext;
  const {index, state, commonThumbProps} = context;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const {inputProps, thumbProps, labelProps} = useSliderThumb({
    sliderProps: context.sliderProps,
    thumbProps: {...props, index, ...commonThumbProps},
    trackRef: context.trackRef,
    inputRef
  }, state);

  return (
    <FocusRing within focusRingClass={styles.thumbFocusVisible} focusClass={styles.thumbFocused}>
      <div 
        {...thumbProps} 
        className={classNames(styles, 'thumb', {thumbDisabled: isDisabled})}
        style={{
          'left': `${state.getOffsetPercentForIndex(index) * 100}%`
        }}>
        <VisuallyHidden isFocusable><input className={styles.input} ref={inputRef} {...inputProps} /></VisuallyHidden>
        {label && <label {...labelProps}>{label}</label>}
      </div>
    </FocusRing>
  );
}
