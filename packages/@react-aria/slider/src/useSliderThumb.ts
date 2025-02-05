import {AriaSliderThumbProps} from '@react-types/slider';
import {clamp, focusWithoutScrolling, mergeProps, useFormReset, useGlobalListeners} from '@react-aria/utils';
import {DOMAttributes, RefObject} from '@react-types/shared';
import {getSliderThumbId, sliderData} from './utils';
import React, {ChangeEvent, InputHTMLAttributes, LabelHTMLAttributes, useCallback, useEffect, useRef} from 'react';
import {SliderState} from '@react-stately/slider';
import {useFocusable, useKeyboard, useMove} from '@react-aria/interactions';
import {useLabel} from '@react-aria/label';
import {useLocale} from '@react-aria/i18n';

export interface SliderThumbAria {
  /** Props for the root thumb element; handles the dragging motion. */
  thumbProps: DOMAttributes,

  /** Props for the visually hidden range input element. */
  inputProps: InputHTMLAttributes<HTMLInputElement>,

  /** Props for the label element for this thumb (optional). */
  labelProps: LabelHTMLAttributes<HTMLLabelElement>,

  /** Whether this thumb is currently being dragged. */
  isDragging: boolean,
  /** Whether the thumb is currently focused. */
  isFocused: boolean,
  /** Whether the thumb is disabled. */
  isDisabled: boolean
}

export interface AriaSliderThumbOptions extends AriaSliderThumbProps {
  /** A ref to the track element. */
  trackRef: RefObject<Element | null>,
  /** A ref to the thumb input element. */
  inputRef: RefObject<HTMLInputElement | null>
}

/**
 * Provides behavior and accessibility for a thumb of a slider component.
 *
 * @param opts Options for this Slider thumb.
 * @param state Slider state, created via `useSliderState`.
 */
export function useSliderThumb(
  opts: AriaSliderThumbOptions,
  state: SliderState
): SliderThumbAria {
  let {
    index = 0,
    isRequired,
    validationState,
    isInvalid,
    trackRef,
    inputRef,
    orientation = state.orientation,
    name
  } = opts;

  let isDisabled = opts.isDisabled || state.isDisabled;
  let isVertical = orientation === 'vertical';

  let {direction} = useLocale();
  let {addGlobalListener, removeGlobalListener} = useGlobalListeners();

  let data = sliderData.get(state)!;
  const {labelProps, fieldProps} = useLabel({
    ...opts,
    id: getSliderThumbId(state, index),
    'aria-labelledby': `${data.id} ${opts['aria-labelledby'] ?? ''}`.trim()
  });

  const value = state.values[index];

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      focusWithoutScrolling(inputRef.current);
    }
  }, [inputRef]);

  const isFocused = state.focusedThumb === index;

  useEffect(() => {
    if (isFocused) {
      focusInput();
    }
  }, [isFocused, focusInput]);

  let reverseX = direction === 'rtl';
  let currentPosition = useRef<number>(null);

  let {keyboardProps} = useKeyboard({
    onKeyDown(e) {
      let {
        getThumbMaxValue,
        getThumbMinValue,
        decrementThumb,
        incrementThumb,
        setThumbValue,
        setThumbDragging,
        pageSize
      } = state;
      // these are the cases that useMove or useSlider don't handle
      if (!/^(PageUp|PageDown|Home|End)$/.test(e.key)) {
        e.continuePropagation();
        return;
      }
      // same handling as useMove, stopPropagation to prevent useSlider from handling the event as well.
      e.preventDefault();
      // remember to set this so that onChangeEnd is fired
      setThumbDragging(index, true);
      switch (e.key) {
        case 'PageUp':
          incrementThumb(index, pageSize);
          break;
        case 'PageDown':
          decrementThumb(index, pageSize);
          break;
        case 'Home':
          setThumbValue(index, getThumbMinValue(index));
          break;
        case 'End':
          setThumbValue(index, getThumbMaxValue(index));
          break;
      }
      setThumbDragging(index, false);
    }
  });

  let {moveProps} = useMove({
    onMoveStart() {
      currentPosition.current = null;
      state.setThumbDragging(index, true);
    },
    onMove({deltaX, deltaY, pointerType, shiftKey}) {
      const {
        getThumbPercent,
        setThumbPercent,
        decrementThumb,
        incrementThumb,
        step,
        pageSize
      } = state;
      if (!trackRef.current) {
        return;
      }
      let {width, height} = trackRef.current.getBoundingClientRect();
      let size = isVertical ? height : width;

      if (currentPosition.current == null) {
        currentPosition.current = getThumbPercent(index) * size;
      }
      if (pointerType === 'keyboard') {
        if ((deltaX > 0 && reverseX) || (deltaX < 0 && !reverseX) || deltaY > 0) {
          decrementThumb(index, shiftKey ? pageSize : step);
        } else {
          incrementThumb(index, shiftKey ? pageSize : step);
        }
      } else {
        let delta = isVertical ? deltaY : deltaX;
        if (isVertical || reverseX) {
          delta = -delta;
        }

        currentPosition.current += delta;
        setThumbPercent(index, clamp(currentPosition.current / size, 0, 1));
      }
    },
    onMoveEnd() {
      state.setThumbDragging(index, false);
    }
  });

  // Immediately register editability with the state
  state.setThumbEditable(index, !isDisabled);

  const {focusableProps} = useFocusable(
    mergeProps(opts, {
      onFocus: () => state.setFocusedThumb(index),
      onBlur: () => state.setFocusedThumb(undefined)
    }),
    inputRef
  );

  let currentPointer = useRef<number | undefined>(undefined);
  let onDown = (id?: number) => {
    focusInput();
    currentPointer.current = id;
    state.setThumbDragging(index, true);

    addGlobalListener(window, 'mouseup', onUp, false);
    addGlobalListener(window, 'touchend', onUp, false);
    addGlobalListener(window, 'pointerup', onUp, false);

  };

  let onUp = (e) => {
    let id = e.pointerId ?? e.changedTouches?.[0].identifier;
    if (id === currentPointer.current) {
      focusInput();
      state.setThumbDragging(index, false);
      removeGlobalListener(window, 'mouseup', onUp, false);
      removeGlobalListener(window, 'touchend', onUp, false);
      removeGlobalListener(window, 'pointerup', onUp, false);
    }
  };

  let thumbPosition = state.getThumbPercent(index);
  if (isVertical || direction === 'rtl') {
    thumbPosition = 1 - thumbPosition;
  }

  let interactions = !isDisabled ? mergeProps(
    keyboardProps,
    moveProps,
    {
      onMouseDown: (e: React.MouseEvent) => {
        if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) {
          return;
        }
        onDown();
      },
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) {
          return;
        }
        onDown(e.pointerId);
      },
      onTouchStart: (e: React.TouchEvent) => {onDown(e.changedTouches[0].identifier);}
    }
  ) : {};

  useFormReset(inputRef, value, (v) => {
    state.setThumbValue(index, v);
  });

  // We install mouse handlers for the drag motion on the thumb div, but
  // not the key handler for moving the thumb with the slider.  Instead,
  // we focus the range input, and let the browser handle the keyboard
  // interactions; we then listen to input's onChange to update state.
  return {
    inputProps: mergeProps(focusableProps, fieldProps, {
      type: 'range',
      tabIndex: !isDisabled ? 0 : undefined,
      min: state.getThumbMinValue(index),
      max: state.getThumbMaxValue(index),
      step: state.step,
      value: value,
      name,
      disabled: isDisabled,
      'aria-orientation': orientation,
      'aria-valuetext': state.getThumbValueLabel(index),
      'aria-required': isRequired || undefined,
      'aria-invalid': isInvalid || validationState === 'invalid' || undefined,
      'aria-errormessage': opts['aria-errormessage'],
      'aria-describedby': [data['aria-describedby'], opts['aria-describedby']].filter(Boolean).join(' '),
      'aria-details': [data['aria-details'], opts['aria-details']].filter(Boolean).join(' '),
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        state.setThumbValue(index, parseFloat(e.target.value));
      }
    }),
    thumbProps: {
      ...interactions,
      style: {
        position: 'absolute',
        [isVertical ? 'top' : 'left']: `${thumbPosition * 100}%`,
        transform: 'translate(-50%, -50%)',
        touchAction: 'none'
      }
    },
    labelProps,
    isDragging: state.isThumbDragging(index),
    isDisabled,
    isFocused
  };
}
