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

import {AriaColorSliderProps} from '@react-types/color';
import {ColorSliderState} from '@react-stately/color';
import {HTMLAttributes, RefObject} from 'react';
import {mergeProps} from '@react-aria/utils';
import {useLocale} from '@react-aria/i18n';
import {useSlider, useSliderThumb} from '@react-aria/slider';

interface ColorSliderAriaOptions extends AriaColorSliderProps {
  /** A ref for the track element. */
  trackRef: RefObject<HTMLElement>,
  /** A ref for the input element. */
  inputRef: RefObject<HTMLInputElement>
}

interface ColorSliderAria {
  /** Props for the label element. */
  labelProps: HTMLAttributes<HTMLElement>,
  /** Props for the track element. */
  trackProps: HTMLAttributes<HTMLElement>,
  /** Props for the thumb element. */
  thumbProps: HTMLAttributes<HTMLElement>,
  /** Props for the visually hidden range input element. */
  inputProps: HTMLAttributes<HTMLElement>,
  /** Props for the output element, displaying the value of the color slider. */
  outputProps: HTMLAttributes<HTMLElement>
}

/**
 * Provides the behavior and accessibility implementation for a color slider component.
 * Color sliders allow users to adjust an individual channel of a color value.
 */
export function useColorSlider(props: ColorSliderAriaOptions, state: ColorSliderState): ColorSliderAria {
  let {trackRef, inputRef, orientation, channel, 'aria-label': ariaLabel} = props;

  let {locale, direction} = useLocale();

  // Provide a default aria-label if there is no other label provided.
  if (!props.label && !ariaLabel && !props['aria-labelledby']) {
    ariaLabel = state.value.getChannelName(channel, locale);
  }

  // @ts-ignore - ignore unused incompatible props
  let {groupProps, trackProps, labelProps, outputProps} = useSlider({...props, 'aria-label': ariaLabel}, state, trackRef);
  let {inputProps, thumbProps} = useSliderThumb({
    index: 0,
    orientation,
    isDisabled: props.isDisabled,
    trackRef,
    inputRef
  }, state);

  let generateBackground = () => {
    let value = state.getDisplayColor();
    let to: string;
    if (orientation === 'vertical') {
      to = 'top';
    } else if (direction === 'ltr') {
      to = 'right';
    } else {
      to = 'left';
    }
    switch (channel) {
      case 'hue':
        return `linear-gradient(to ${to}, rgb(255, 0, 0) 0%, rgb(255, 255, 0) 17%, rgb(0, 255, 0) 33%, rgb(0, 255, 255) 50%, rgb(0, 0, 255) 67%, rgb(255, 0, 255) 83%, rgb(255, 0, 0) 100%)`;
      case 'lightness': {
        // We have to add an extra color stop in the middle so that the hue shows up at all.
        // Otherwise it will always just be black to white.
        let min = state.getThumbMinValue(0);
        let max = state.getThumbMaxValue(0);
        let start = value.withChannelValue(channel, min).toString('css');
        let middle = value.withChannelValue(channel, (max - min) / 2).toString('css');
        let end = value.withChannelValue(channel, max).toString('css');
        return `linear-gradient(to ${to}, ${start}, ${middle}, ${end})`;
      }
      case 'saturation':
      case 'brightness':
      case 'red':
      case 'green':
      case 'blue':
      case 'alpha': {
        let start = value.withChannelValue(channel, state.getThumbMinValue(0)).toString('css');
        let end = value.withChannelValue(channel, state.getThumbMaxValue(0)).toString('css');
        return `linear-gradient(to ${to}, ${start}, ${end})`;
      }
      default:
        throw new Error('Unknown color channel: ' + channel);
    }
  };

  let thumbPosition = state.getThumbPercent(0);
  if (orientation === 'vertical' || direction === 'rtl') {
    thumbPosition = 1 - thumbPosition;
  }

  return {
    trackProps: {
      ...mergeProps(groupProps, trackProps),
      style: {
        position: 'relative',
        touchAction: 'none',
        background: generateBackground()
      }
    },
    inputProps: {
      ...inputProps,
      title: (channel === 'hue' ? state.value.getHueName(locale) : null)
    },
    thumbProps: {
      ...thumbProps,
      style: {
        touchAction: 'none',
        position: 'absolute',
        [orientation === 'vertical' ? 'top' : 'left']: `${thumbPosition * 100}%`,
        transform: 'translate(-50%, -50%)'
      }
    },
    labelProps,
    outputProps
  };
}
