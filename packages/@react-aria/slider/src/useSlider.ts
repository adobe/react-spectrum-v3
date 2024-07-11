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

import {AriaSliderProps} from '@react-types/slider';
import {clamp, mergeProps, useGlobalListeners} from '@react-aria/utils';
import {DOMAttributes} from '@react-types/shared';
import {getSliderThumbId, getStuckThumbsIndexes, sliderData} from './utils';
import React, {LabelHTMLAttributes, OutputHTMLAttributes, RefObject, useRef} from 'react';
import {setInteractionModality, useMove} from '@react-aria/interactions';
import {SliderState} from '@react-stately/slider';
import {useLabel} from '@react-aria/label';
import {useLocale} from '@react-aria/i18n';


export interface SliderAria {
  /** Props for the label element. */
  labelProps: LabelHTMLAttributes<HTMLLabelElement>,

  /** Props for the root element of the slider component; groups slider inputs. */
  groupProps: DOMAttributes,

  /** Props for the track element. */
  trackProps: DOMAttributes,

  /** Props for the output element, displaying the value of the slider thumbs. */
  outputProps: OutputHTMLAttributes<HTMLOutputElement>
}

/**
 * Provides the behavior and accessibility implementation for a slider component representing one or more values.
 *
 * @param props Props for the slider.
 * @param state State for the slider, as returned by `useSliderState`.
 * @param trackRef Ref for the "track" element.  The width of this element provides the "length"
 * of the track -- the span of one dimensional space that the slider thumb can be.  It also
 * accepts click and drag motions, so that the closest thumb will follow clicks and drags on
 * the track.
 */
export function useSlider<T extends number | number[]>(
  props: AriaSliderProps<T>,
  state: SliderState,
  trackRef: RefObject<Element | null>
): SliderAria {
  let {labelProps, fieldProps} = useLabel(props);

  let isVertical = props.orientation === 'vertical';

  // Attach id of the label to the state so it can be accessed by useSliderThumb.
  sliderData.set(state, {
    id: labelProps.id ?? fieldProps.id,
    'aria-describedby': props['aria-describedby'],
    'aria-details': props['aria-details']
  });

  let {direction} = useLocale();

  let {addGlobalListener, removeGlobalListener} = useGlobalListeners();

  // When the user clicks or drags the track, we want the motion to set and drag the
  // closest thumb.  Hence we also need to install useMove() on the track element.
  // Here, we keep track of which index is the "closest" to the drag start point.
  // It is set onMouseDown/onTouchDown; see trackProps below.
  const realTimeTrackDraggingIndex = useRef<number | null>(null);

  const isBeingStuckBeforeDragging = useRef<boolean | undefined>(undefined);

  const reverseX = direction === 'rtl';
  const currentPosition = useRef<number | null>(null);
  const {moveProps} = useMove({
    onMoveStart() {
      currentPosition.current = null;
    },
    onMove({deltaX, deltaY}) {
      const {
        getThumbPercent, 
        getThumbValue,
        getPercentValue, 
        isThumbEditable, 
        setThumbPercent, 
        setThumbDragging, 
        setFocusedThumb,
        swapEnabled
      } = state;

      let {height, width} = trackRef.current.getBoundingClientRect();
      let size = isVertical ? height : width;

      let controlledThumbIndex = realTimeTrackDraggingIndex.current;

      if (currentPosition.current == null) {
        currentPosition.current = getThumbPercent(controlledThumbIndex) * size;
      }

      let delta = isVertical ? deltaY : deltaX;

      if (isVertical || reverseX) {
        delta = -delta;
      }

      currentPosition.current += delta;

      const percent = clamp(currentPosition.current / size, 0, 1);

      const value = getThumbValue(controlledThumbIndex);

      const isValueMustBeDecreasing = getPercentValue(percent) < value;
      const isValueMustBeChanged = getPercentValue(percent) !== value;

      const stuckThumbsIndexes = getStuckThumbsIndexes(state, controlledThumbIndex);
      const isNeededToSwap = stuckThumbsIndexes !== null;

      if (isNeededToSwap && isValueMustBeChanged) {
        const possibleIndexesForSwap = stuckThumbsIndexes.filter((i) => 
            isValueMustBeDecreasing
              ? i < controlledThumbIndex && isThumbEditable(i)
              : i > controlledThumbIndex && isThumbEditable(i)
        );

        // Select the most initial thumb or the most recent one from the array of stuck ones
        // (depending on the increase or decrease in value)
        // so that the order of thumbs works correctly
        const indexForSwap = isValueMustBeDecreasing
            ? possibleIndexesForSwap[0]
            : possibleIndexesForSwap[possibleIndexesForSwap.length - 1];

        if (indexForSwap !== undefined && swapEnabled) {
          controlledThumbIndex = indexForSwap;
        }
  
        // This allows to select the controlled thumb once and when it gets stuck again 
        // as you move in other thumbs, then control will remain over it.
        if (!swapEnabled && isBeingStuckBeforeDragging.current) {
          controlledThumbIndex = indexForSwap ?? controlledThumbIndex;
          isBeingStuckBeforeDragging.current = false;
        }
      }

      if (
        realTimeTrackDraggingIndex.current !== null &&
        realTimeTrackDraggingIndex.current !== controlledThumbIndex
      ) {
        setThumbDragging(controlledThumbIndex, true);
        setThumbDragging(realTimeTrackDraggingIndex.current, false);

        setFocusedThumb(controlledThumbIndex);

        realTimeTrackDraggingIndex.current = controlledThumbIndex;
      }

      if (controlledThumbIndex !== null && trackRef.current && isValueMustBeChanged) {
        setThumbPercent(controlledThumbIndex, percent);
      }
    },
    onMoveEnd() {
      const controlledThumbIndex = realTimeTrackDraggingIndex.current;

      if (controlledThumbIndex !== null) {
        realTimeTrackDraggingIndex.current = null;
        isBeingStuckBeforeDragging.current = undefined;

        state.setThumbDragging(controlledThumbIndex, false);
      }
    }
  });

  let currentPointer = useRef<number | null | undefined>(undefined);
  let onDownTrack = (
    e: React.UIEvent,
    id: number,
    clientX: number,
    clientY: number
  ) => {
    // We only trigger track-dragging if the user clicks on the track itself and nothing is currently being dragged.
    if (
      trackRef.current &&
      !props.isDisabled &&
      !state.values.some((_, i) => state.isThumbDragging(i))
    ) {
      let {height, width, top, left} =
        trackRef.current.getBoundingClientRect();
      let size = isVertical ? height : width;
      // Find the closest thumb
      const trackPosition = isVertical ? top : left;
      const clickPosition = isVertical ? clientY : clientX;
      const offset = clickPosition - trackPosition;
      let percent = offset / size;

      if (direction === 'rtl' || isVertical) {
        percent = 1 - percent;
      }
      let value = state.getPercentValue(percent);

      // to find the closet thumb we split the array based on the first thumb position to the "right/end" of the click.
      let closestThumb;
      let split = state.values.findIndex((v) => value - v < 0);

      if (split === 0) {
        // If the index is zero then the closetThumb is the first one
        closestThumb = split;
      } else if (split === -1) {
        // If no index is found they've clicked past all the thumbs
        closestThumb = state.values.length - 1;
      } else {
        let lastLeft = state.values[split - 1];
        let firstRight = state.values[split];

        // Pick the last left/start thumb, unless they are stacked on top of each other, then pick the right/end one
        if (Math.abs(lastLeft - value) < Math.abs(firstRight - value)) {
          closestThumb = split - 1;
        } else {
          closestThumb = split;
        }
      }

      // Confirm that the found closest thumb is editable, not disabled, and move it
      if (closestThumb >= 0 && state.isThumbEditable(closestThumb)) {
        // Don't unfocus anything
        e.preventDefault();
        realTimeTrackDraggingIndex.current = closestThumb;
        state.setFocusedThumb(closestThumb);
        currentPointer.current = id;

        isBeingStuckBeforeDragging.current =
            getStuckThumbsIndexes(state, realTimeTrackDraggingIndex.current) !== null;

        state.setThumbDragging(realTimeTrackDraggingIndex.current, true);
        state.setThumbValue(closestThumb, value);

        addGlobalListener(window, 'mouseup', onUpTrack, false);
        addGlobalListener(window, 'touchend', onUpTrack, false);
        addGlobalListener(window, 'pointerup', onUpTrack, false);
      } else {
        realTimeTrackDraggingIndex.current = null;
        isBeingStuckBeforeDragging.current = undefined;
      }
    }
  };

  let onUpTrack = (e) => {
    let id = e.pointerId ?? e.changedTouches?.[0].identifier;

    if (id === currentPointer.current) {
      if (realTimeTrackDraggingIndex.current != null) {
        state.setThumbDragging(realTimeTrackDraggingIndex.current, false);
        realTimeTrackDraggingIndex.current = null;

        isBeingStuckBeforeDragging.current = undefined;
      }

      removeGlobalListener(window, 'mouseup', onUpTrack, false);
      removeGlobalListener(window, 'touchend', onUpTrack, false);
      removeGlobalListener(window, 'pointerup', onUpTrack, false);
    }
  };

  if ('htmlFor' in labelProps && labelProps.htmlFor) {
    // Ideally the `for` attribute should point to the first thumb, but VoiceOver on iOS
    // causes this to override the `aria-labelledby` on the thumb. This causes the first
    // thumb to only be announced as the slider label rather than its individual name as well.
    // See https://bugs.webkit.org/show_bug.cgi?id=172464.
    delete labelProps.htmlFor;
    labelProps.onClick = () => {
      // Safari does not focus <input type="range"> elements when clicking on an associated <label>,
      // so do it manually. In addition, make sure we show the focus ring.
      document.getElementById(getSliderThumbId(state, 0))?.focus();
      setInteractionModality('keyboard');
    };
  }

  return {
    labelProps,
    // The root element of the Slider will have role="group" to group together
    // all the thumb inputs in the Slider.  The label of the Slider will
    // be used to label the group.
    groupProps: {
      role: 'group',
      ...fieldProps
    },
    trackProps: mergeProps(
      {
        onMouseDown(e: React.MouseEvent) {
          if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) {
            return;
          }

          onDownTrack(e, undefined, e.clientX, e.clientY);
        },
        onPointerDown(e: React.PointerEvent) {
          if (
            e.pointerType === 'mouse' &&
            (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey)
          ) {
            return;
          }
          onDownTrack(e, e.pointerId, e.clientX, e.clientY);
        },
        onTouchStart(e: React.TouchEvent) {
          onDownTrack(
            e,
            e.changedTouches[0].identifier,
            e.changedTouches[0].clientX,
            e.changedTouches[0].clientY
          );
        },
        style: {
          position: 'relative',
          touchAction: 'none'
        }
      },
      moveProps
    ),
    outputProps: {
      htmlFor: state.values
        .map((_, index) => getSliderThumbId(state, index))
        .join(' '),
      'aria-live': 'off'
    }
  };
}
