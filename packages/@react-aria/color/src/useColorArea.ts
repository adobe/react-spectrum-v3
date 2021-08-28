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

import {AriaColorAreaProps} from '@react-types/color';
import {clamp, focusWithoutScrolling, mergeProps, useGlobalListeners, useLabels} from '@react-aria/utils';
import {ColorAreaState} from '@react-stately/color';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {MessageDictionary} from '@internationalized/message';
import React, {ChangeEvent, HTMLAttributes, InputHTMLAttributes, RefObject, useCallback, useRef} from 'react';
import {useKeyboard, useMove} from '@react-aria/interactions';
import {useLocale} from '@react-aria/i18n';
import {useVisuallyHidden} from '@react-aria/visually-hidden';

const messages = new MessageDictionary(intlMessages);

interface ColorAreaAria {
  /** Props for the color area container element. */
  colorAreaProps: HTMLAttributes<HTMLElement>,
  /** Props for the color area gradient foreground element. */
  gradientProps: HTMLAttributes<HTMLElement>,
  /** Props for the thumb element. */
  thumbProps: HTMLAttributes<HTMLElement>,
  /** Props for the visually hidden horizontal range input element. */
  xInputProps: InputHTMLAttributes<HTMLInputElement>,
  /** Props for the visually hidden vertical range input element. */
  yInputProps: InputHTMLAttributes<HTMLInputElement>
}

const PERCENT_STEP_SIZE = 10;
const HUE_STEP_SIZE = 15;
const RGB_STEP_SIZE = 16;
const CHANNEL_STEP_SIZE = {
  hue: HUE_STEP_SIZE,
  saturation: PERCENT_STEP_SIZE,
  brightness: PERCENT_STEP_SIZE,
  lightness: PERCENT_STEP_SIZE,
  red: RGB_STEP_SIZE,
  green: RGB_STEP_SIZE,
  blue: RGB_STEP_SIZE
};


function maxMinOrZero(value1: number, value2: number): number {
  if (value1 === 0) {
    return 0;
  }
  return value1 < 0 ? Math.min(value1, -1 * value2) : Math.max(value1, value2);
}

/**
 * Provides the behavior and accessibility implementation for a color wheel component.
 * Color wheels allow users to adjust the hue of an HSL or HSB color value on a circular track.
 */
export function useColorArea(props: AriaColorAreaProps, state: ColorAreaState, inputXRef: RefObject<HTMLElement>, inputYRef: RefObject<HTMLElement>, containerRef: RefObject<HTMLElement>): ColorAreaAria {
  let {
    isDisabled,
    xChannel,
    yChannel,
    xChannelStep,
    yChannelStep
  } = props;

  let {addGlobalListener, removeGlobalListener} = useGlobalListeners();

  let {direction, locale} = useLocale();

  let focusedInputRef = useRef<HTMLElement>(null);

  let focusInput = useCallback((inputRef:RefObject<HTMLElement> = inputXRef) => {
    if (inputRef.current) {
      focusWithoutScrolling(inputRef.current);
    }
  }, [inputXRef]);

  let stateRef = useRef<ColorAreaState>(null);
  stateRef.current = state;
  let channels = stateRef.current.getChannels();
  if (!xChannel || !yChannel) {
    xChannel = channels.xChannel;
    yChannel = channels.yChannel;
  }
  let zChannel = channels.zChannel;

  if (!xChannelStep) {
    xChannelStep = stateRef.current.value.getChannelRange(xChannel).step;
  }

  if (!yChannelStep) {
    yChannelStep = stateRef.current.value.getChannelRange(yChannel).step;
  }

  let currentPosition = useRef<{x: number, y: number}>(null);

  let {keyboardProps} = useKeyboard({
    onKeyDown(e) {
      if (!e.shiftKey && /^Arrow(?:Right|Left|Up|Down)$/.test(e.key)) {
        return;
      }
      let stepSize = Math.max(xChannelStep, CHANNEL_STEP_SIZE[xChannel]);
      let range = stateRef.current.value.getChannelRange(xChannel);
      switch (e.key) {
        case 'PageUp':
        case 'ArrowUp':
          range = stateRef.current.value.getChannelRange(yChannel);
          stepSize = Math.max(yChannelStep, CHANNEL_STEP_SIZE[yChannel]);
          stateRef.current.setYValue(
            clamp(
              (Math.floor(stateRef.current.yValue / stepSize) + 1) * stepSize,
              range.minValue,
              range.maxValue
            )
          );
          focusedInputRef.current = inputYRef.current;
          break;
        case 'PageDown':
        case 'ArrowDown':
          range = stateRef.current.value.getChannelRange(yChannel);
          stepSize = Math.max(yChannelStep, CHANNEL_STEP_SIZE[yChannel]);
          stateRef.current.setYValue(
            clamp(
              (Math.ceil(stateRef.current.yValue / stepSize) - 1) * stepSize,
              range.minValue,
              range.maxValue
            )
          );
          focusedInputRef.current = inputYRef.current;
          break;
        case 'Home':
        case 'ArrowLeft':
          stateRef.current.setXValue(
            clamp(
              (Math[direction === 'rtl' ? 'floor' : 'ceil'](stateRef.current.xValue / stepSize) + (direction === 'rtl' ? 1 : -1)) * stepSize,
              range.minValue,
              range.maxValue
            )
          );
          focusedInputRef.current = inputXRef.current;
          break;
        case 'End':
        case 'ArrowRight':
          stateRef.current.setXValue(
            clamp(
              (Math[direction === 'rtl' ? 'floor' : 'ceil'](stateRef.current.xValue / stepSize) + (direction === 'rtl' ? -1 : 1)) * stepSize,
              range.minValue,
              range.maxValue
            )
          );
          focusedInputRef.current = inputXRef.current;
          break;
      }
      if (focusedInputRef.current) {
        e.preventDefault();
        focusInput(focusedInputRef.current ? focusedInputRef : inputXRef);
        focusedInputRef.current = undefined;
      }
    }
  });

  let moveHandler = {
    onMoveStart() {
      currentPosition.current = null;
      state.setDragging(true);  
    },
    onMove({deltaX, deltaY, pointerType}) {
      if (currentPosition.current == null) {
        currentPosition.current = stateRef.current.getThumbPosition();
      }
      let {width, height} = containerRef.current.getBoundingClientRect();
      if (pointerType === 'keyboard') {
        deltaX = maxMinOrZero(deltaX, xChannelStep);
        deltaY = maxMinOrZero(deltaY, yChannelStep);
        if (deltaX !== 0) {
          stateRef.current[`${deltaX > 0 ? 'increment' : 'decrement'}X`](Math.abs(deltaX));
        }
        if (deltaY !== 0) {
          stateRef.current[`${deltaY < 0 ? 'increment' : 'decrement'}Y`](Math.abs(deltaY));
        }
        // set the focused input based on which axis has the greater delta
        focusedInputRef.current = (deltaX !== 0 || deltaY !== 0) && Math.abs(deltaY) > Math.abs(deltaX) ? inputYRef.current : inputXRef.current;
      }
      currentPosition.current.x += (direction === 'rtl' ? -1 : 1) * deltaX / width ;
      currentPosition.current.y += deltaY / height;
      if (pointerType !== 'keyboard') {
        stateRef.current.setColorFromPoint(currentPosition.current.x, currentPosition.current.y);
      }
    },
    onMoveEnd() {
      isOnColorArea.current = undefined;
      state.setDragging(false);
      focusInput(focusedInputRef.current ? focusedInputRef : inputXRef);
      focusedInputRef.current = undefined;
    }
  };
  let {moveProps: movePropsThumb} = useMove(moveHandler);

  let currentPointer = useRef<number | null | undefined>(undefined);
  let isOnColorArea = useRef<boolean>(false);
  let {moveProps: movePropsContainer} = useMove({
    onMoveStart() {
      if (isOnColorArea.current) {
        moveHandler.onMoveStart();
      }
    },
    onMove(e) {
      if (isOnColorArea.current) {
        moveHandler.onMove(e);
      }
    },
    onMoveEnd() {
      if (isOnColorArea.current) {
        moveHandler.onMoveEnd();
      }
    }
  });

  let onThumbDown = (id: number | null) => {
    if (!state.isDragging) {
      currentPointer.current = id;
      focusInput();
      state.setDragging(true);
      addGlobalListener(window, 'mouseup', onThumbUp, false);
      addGlobalListener(window, 'touchend', onThumbUp, false);
      addGlobalListener(window, 'pointerup', onThumbUp, false);
    }
  };

  let onThumbUp = (e) => {
    let id = e.pointerId ?? e.changedTouches?.[0].identifier;
    if (id === currentPointer.current) {
      focusInput();
      state.setDragging(false);
      currentPointer.current = undefined;
      isOnColorArea.current = false;

      removeGlobalListener(window, 'mouseup', onThumbUp, false);
      removeGlobalListener(window, 'touchend', onThumbUp, false);
      removeGlobalListener(window, 'pointerup', onThumbUp, false);
    }
  };

  let onColorAreaDown = (colorArea: Element, id: number | null, clientX: number, clientY: number) => {
    let rect = colorArea.getBoundingClientRect();
    let {width, height} = rect;
    let x = (clientX - rect.x) / width;
    let y = (clientY - rect.y) / height;
    if (direction === 'rtl') {
      x = 1 - x;
    }
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1 && !state.isDragging && currentPointer.current === undefined) {
      isOnColorArea.current = true;
      currentPointer.current = id;
      state.setColorFromPoint(x, y);

      focusInput();
      state.setDragging(true);

      addGlobalListener(window, 'mouseup', onColorAreaUp, false);
      addGlobalListener(window, 'touchend', onColorAreaUp, false);
      addGlobalListener(window, 'pointerup', onColorAreaUp, false);
    }
  };

  let onColorAreaUp = (e) => {
    let id = e.pointerId ?? e.changedTouches?.[0].identifier;
    if (isOnColorArea.current && id === currentPointer.current) {
      isOnColorArea.current = false;
      currentPointer.current = undefined;
      state.setDragging(false);
      focusInput();

      removeGlobalListener(window, 'mouseup', onColorAreaUp, false);
      removeGlobalListener(window, 'touchend', onColorAreaUp, false);
      removeGlobalListener(window, 'pointerup', onColorAreaUp, false);
    }
  };

  let colorAreaInteractions = isDisabled ? {} : mergeProps({
    onMouseDown: (e: React.MouseEvent) => {
      if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }
      onColorAreaDown(e.currentTarget, undefined, e.clientX, e.clientY);
    },
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey)) {
        return;
      }
      onColorAreaDown(e.currentTarget, e.pointerId, e.clientX, e.clientY);
    },
    onTouchStart: (e: React.TouchEvent) => {
      onColorAreaDown(e.currentTarget, e.changedTouches[0].identifier, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  }, movePropsContainer);

  let thumbInteractions = isDisabled ? {} : mergeProps({
    onMouseDown: (e: React.MouseEvent) => {
      if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }
      onThumbDown(undefined);
    },
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey)) {
        return;
      }
      onThumbDown(e.pointerId);
    },
    onTouchStart: (e: React.TouchEvent) => {
      onThumbDown(e.changedTouches[0].identifier);
    }
  }, movePropsThumb, keyboardProps);

  let {x, y} = stateRef.current.getThumbPosition();

  if (direction === 'rtl') {
    x = 1 - x;
  }

  let inputLabellingProps = useLabels({
    ...props,
    'aria-label': `${state.value.getChannelName(xChannel, locale)} / ${state.value.getChannelName(yChannel, locale)}`
  });

  let colorAriaLabellingProps = useLabels(props);

  let getValueTitle = () => {
    let title = null;
    switch (state.value.getColorSpace()) {
      case 'hsb':
        title = [
          `${state.value.getChannelName('hue', locale)}: ${state.value.formatChannelValue('hue', locale)}`,
          `${state.value.getChannelName('saturation', locale)}: ${state.value.formatChannelValue('saturation', locale)}`,
          `${state.value.getChannelName('brightness', locale)}: ${state.value.formatChannelValue('brightness', locale)}`
        ].join(', ');
        break;
      case 'hsl':
        title = [
          `${state.value.getChannelName('hue', locale)}: ${state.value.formatChannelValue('hue', locale)}`,
          `${state.value.getChannelName('saturation', locale)}: ${state.value.formatChannelValue('saturation', locale)}`,
          `${state.value.getChannelName('lightness', locale)}: ${state.value.formatChannelValue('lightness', locale)}`
        ].join(', ');
        break;
      case 'rgb':
        title = [
          `${state.value.getChannelName('red', locale)}: ${state.value.formatChannelValue('red', locale)}`,
          `${state.value.getChannelName('green', locale)}: ${state.value.formatChannelValue('green', locale)}`,
          `${state.value.getChannelName('blue', locale)}: ${state.value.formatChannelValue('blue', locale)}`
        ].join(', ');
        break;
    }
    const colorName = state.value.getColorName(locale);
    return colorName ? `${colorName}, ${title}` : title;
  };

  let generateBackground = () => {
    let orientation = ['top', direction === 'rtl' ? 'left' : 'right'];
    let dir: boolean | number = 0;
    let background = {colorAreaStyles: {}, gradientStyles: {}};
    let zValue = state.value.getChannelValue(zChannel);
    let {minValue: zMin, maxValue: zMax} = state.value.getChannelRange(zChannel);
    let isHSL = state.value.getColorSpace() === 'hsl';
    let a = (zValue - zMin) / (zMax - zMin);
    let l = zValue;
    let maskImage;
    switch (zChannel) {
      case 'hue': {
        dir = xChannel !== 'saturation';
        l = isHSL ? 50 : 100;
        background.gradientStyles = {
          background: [
            (isHSL
              /* for HSL, foreground gradient represents lightness,
              from black to transparent to white */
              ? `linear-gradient(to ${orientation[Number(dir)]}, hsla(0,0%,0%,1) 0%, hsla(0,0%,0%,0) 50%, hsla(0,0%,100%,0) 50%, hsla(0,0%,100%,1) 100%)`
              /* for HSB, foreground gradient represents brightness,
              from black to transparent */
              : `linear-gradient(to ${orientation[Number(dir)]},hsl(0,0%,0%),hsla(0,0%,0%,0))`),
            /* background gradient represents saturation,
            from gray to transparent for HSL,
            or from white to transparent for HSB */
            `linear-gradient(to ${orientation[Number(!dir)]},hsl(0,0%,${l}%),hsla(0,0%,${l}%,0))`,
            /* background color is the hue at full saturation and brightness */
            `hsl(${zValue}, 100%, 50%)`
          ].join(',')
        };
        break;
      }
      case 'saturation': {
        dir = xChannel === 'hue';
        background.gradientStyles = {
          background: [
            (isHSL
              /* for HSL, foreground gradient represents lightness, 
              from black to transparent to white, with alpha set to saturation value */
              ? `linear-gradient(to ${orientation[Number(!dir)]}, hsla(0,0%,0%,${a}) 0%, hsla(0,0%,0%,0) 50%, hsla(0,0%,100%,0) 50%, hsla(0,0%,100%,${a}) 100%)`
              /* for HSB, foreground gradient represents brightness,
              from black to transparent, with alpha set to saturation value */
              : `linear-gradient(to ${orientation[Number(!dir)]},hsla(0,0%,0%,${a}),hsla(0,0%,0%,0))`),
            /* background gradient represents the hue,
            from 0 to 360, with alpha set to saturation value */
            `linear-gradient(to ${orientation[Number(dir)]},hsla(0,100%,50%,${a}),hsla(60,100%,50%,${a}),hsla(120,100%,50%,${a}),hsla(180,100%,50%,${a}),hsla(240,100%,50%,${a}),hsla(300,100%,50%,${a}),hsla(359,100%,50%,${a}))`,
            (isHSL
              /* for HSL, the alpha transparency representing saturation 
              of the gradients above overlay a solid gray background */
              ? 'hsl(0, 0%, 50%)'
              /* for HSB, the alpha transparency representing saturation, 
              of the gradients above overlay a gradient from black to white */
              : `linear-gradient(to ${orientation[Number(!dir)]},hsl(0,0%,0%),hsl(0,0%,100%))`)
          ].join(',')
        };
        break;
      }
      case 'brightness': {
        dir = xChannel === 'hue';
        background.gradientStyles = {
          background: [
            /* foreground gradient represents saturation,
            from white to transparent, with alpha set to brightness value */
            `linear-gradient(to ${orientation[Number(!dir)]},hsla(0,0%,100%,${a}),hsla(0,0%,100%,0))`,
            /* background gradient represents the hue,
            from 0 to 360, with alpha set to brightness value */
            `linear-gradient(to ${orientation[Number(dir)]},hsla(0,100%,50%,${a}),hsla(60,100%,50%,${a}),hsla(120,100%,50%,${a}),hsla(180,100%,50%,${a}),hsla(240,100%,50%,${a}),hsla(300,100%,50%,${a}),hsla(359,100%,50%,${a}))`,
            /* for HSB, the alpha transparency representing brightness
            of the gradients above overlay a solid black background */
            '#000'
          ].join(',')
        };
        break;
      }
      case 'lightness': {
        dir = xChannel === 'hue';
        background.gradientStyles = {
          backgroundImage: [
            /* foreground gradient represents the color saturation from 0 to 100,
            adjusted by the lightness value */
            `linear-gradient(to ${orientation[Number(!dir)]},hsl(0,0%,${l}%),hsla(0,0%,${l}%,0))`,
            /* background gradient represents the hue, from 0 to 360,
            adjusted by the lightness value */
            `linear-gradient(to ${orientation[Number(dir)]},hsl(0,100%,${l}%),hsl(60,100%,${l}%),hsl(120,100%,${l}%),hsl(180,100%,${l}%),hsl(240,100%,${l}%),hsl(300,100%,${l}%),hsl(360,100%,${l}%))`
          ].join(',')
        };
        break;
      }
      case 'red': {
        dir = xChannel === 'green';
        maskImage = `linear-gradient(to ${orientation[Number(!dir)]}, transparent, #000)`;
        background.colorAreaStyles = {
          /* the background represents the green channel as a linear gradient from min to max,
          with the blue channel minimized, adjusted by the red channel value. */
          backgroundImage: `linear-gradient(to ${orientation[Number(dir)]},rgb(${zValue},0,0),rgb(${zValue},255,0))`
        };
        background.gradientStyles = {
          /* the foreground represents the green channel as a linear gradient from min to max,
          with the blue channel maximized, adjusted by the red channel value. */
          backgroundImage: `linear-gradient(to ${orientation[Number(dir)]},rgb(${zValue},0,255),rgb(${zValue},255,255))`,
          /* the foreground gradient is masked by a perpendicular linear gradient from black to white */
          'WebkitMaskImage': maskImage,
          maskImage
        };
        break;
      }
      case 'green': {
        dir = xChannel === 'red';
        maskImage = `linear-gradient(to ${orientation[Number(!dir)]}, transparent, #000)`;
        background.colorAreaStyles = {
          /* the background represents the red channel as a linear gradient from min to max,
          with the blue channel minimized, adjusted by the green channel value. */
          backgroundImage: `linear-gradient(to ${orientation[Number(dir)]},rgb(0,${zValue},0),rgb(255,${zValue},0))`
        };
        background.gradientStyles = {
          /* the foreground represents the red channel as a linear gradient from min to max,
          with the blue channel maximized, adjusted by the green channel value. */
          backgroundImage: `linear-gradient(to ${orientation[Number(dir)]},rgb(0,${zValue},255),rgb(255,${zValue},255))`,
          /* the foreground gradient is masked by a perpendicular linear gradient from black to white */
          'WebkitMaskImage': maskImage,
          maskImage
        };
        break;
      }
      case 'blue': {
        dir = xChannel === 'red';
        maskImage = `linear-gradient(to ${orientation[Number(!dir)]}, transparent, #000)`;
        background.colorAreaStyles = {
          /* the background represents the red channel as a linear gradient from min to max,
          with the green channel minimized, adjusted by the blue channel value. */
          backgroundImage: `linear-gradient(to ${orientation[Number(dir)]},rgb(0,0,${zValue}),rgb(255,0,${zValue}))`
        };
        background.gradientStyles = {
          /* the foreground represents the red channel as a linear gradient from min to max,
          with the green channel maximized, adjusted by the blue channel value. */
          backgroundImage: `linear-gradient(to ${orientation[Number(dir)]},rgb(0,255,${zValue}),rgb(255,255,${zValue}))`,
          /* the foreground gradient is masked by a perpendicular linear gradient from black to white */
          'WebkitMaskImage': maskImage,
          maskImage
        };
        break;
      }
    }
    return background;
  };

  let background = generateBackground();
  let ariaRoleDescription = messages.getStringForLocale('twoDimensionalSlider', locale);
  
  let {visuallyHiddenProps} = useVisuallyHidden();
  visuallyHiddenProps.style = mergeProps(
    visuallyHiddenProps.style,
    {
      opacity: '0.0001',
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    }
  );

  return {
    colorAreaProps: {
      ...colorAriaLabellingProps,
      ...colorAreaInteractions,
      role: 'group',
      style: {
        position: 'relative',
        touchAction: 'none',
        ...background.colorAreaStyles
      }
    },
    gradientProps: {
      style: {
        touchAction: 'none',
        ...background.gradientStyles
      }
    },
    thumbProps: {
      ...thumbInteractions,
      style: {
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: 'translate(0%, 0%)',
        touchAction: 'none'
      }
    },
    xInputProps: {
      ...inputLabellingProps,
      ...visuallyHiddenProps,
      type: 'range',
      min: state.value.getChannelRange(xChannel).minValue,
      max: state.value.getChannelRange(xChannel).maxValue,
      step: xChannelStep,
      'aria-roledescription': ariaRoleDescription,
      'aria-valuetext': [
        `${state.value.getChannelName(xChannel, locale)}: ${state.value.formatChannelValue(xChannel, locale)}`,
        `${state.value.getChannelName(yChannel, locale)}: ${state.value.formatChannelValue(yChannel, locale)}`
      ].join(', '),
      title: getValueTitle(),
      disabled: isDisabled,
      value: state.value.getChannelValue(xChannel),
      tabIndex: 0,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        state.setXValue(parseFloat(e.target.value));
      }
    },
    yInputProps: {
      ...inputLabellingProps,
      ...visuallyHiddenProps,
      type: 'range',
      min: state.value.getChannelRange(yChannel).minValue,
      max: state.value.getChannelRange(yChannel).maxValue,
      step: yChannelStep,
      'aria-roledescription': ariaRoleDescription,
      'aria-valuetext': [
        `${state.value.getChannelName(yChannel, locale)}: ${state.value.formatChannelValue(yChannel, locale)}`,
        `${state.value.getChannelName(xChannel, locale)}: ${state.value.formatChannelValue(xChannel, locale)}`
      ].join(', '),
      'aria-orientation': 'vertical',
      title: getValueTitle(),
      disabled: isDisabled,
      value: state.value.getChannelValue(yChannel),
      tabIndex: -1,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        state.setYValue(parseFloat(e.target.value));
      }
    }
  };
}
