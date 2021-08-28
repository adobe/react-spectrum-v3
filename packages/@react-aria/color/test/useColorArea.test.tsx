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

import {act, fireEvent, render} from '@testing-library/react';
import {ColorAreaProps} from '@react-types/color';
import {installMouseEvent, installPointerEvent} from '@react-spectrum/test-utils';
import {parseColor, useColorAreaState} from '@react-stately/color';
import React, {useRef} from 'react';
import {useColorArea} from '../';
import userEvent from '@testing-library/user-event';

const SIZE = 100;
const CENTER = SIZE / 2;
const THUMB_RADIUS = 10;

const getBoundingClientRect = () => ({
  width: SIZE, height: SIZE,
  x: 0, y: 0,
  top: 0, left: 0,
  bottom: SIZE, right: SIZE,
  toJSON() { return this; }
});

function ColorArea(props: ColorAreaProps) {
  let state = useColorAreaState(props);
  let xInputRef = useRef(null);
  let yInputRef = useRef(null);
  let containerRef = useRef(null);

  let {
    colorAreaProps,
    gradientProps,
    xInputProps,
    yInputProps,
    thumbProps
  } = useColorArea(props, state, xInputRef, yInputRef, containerRef);

  return (<div data-testid="container" {...colorAreaProps} ref={containerRef}>
    <div data-testid="gradient" {...gradientProps} />
    <div data-testid="thumb" {...thumbProps}>
      <input {...xInputProps} ref={xInputRef} />
      <input {...yInputProps} ref={xInputRef} />
    </div>
  </div>);
}

describe('useColorArea', () => {
  let onChangeSpy = jest.fn();

  afterEach(() => {
    onChangeSpy.mockClear();
  });

  beforeAll(() => {
    // @ts-ignore
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => cb());
    // @ts-ignore
    jest.spyOn(window, 'setTimeout').mockImplementation((cb) => cb());
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
    // @ts-ignore
    window.requestAnimationFrame.mockRestore();
    // @ts-ignore
    window.setTimeout.mockRestore();
  });

  afterEach(() => {
    // for restoreTextSelection
    jest.runAllTimers();
  });

  it('sets input props', () => {
    let {getAllByRole} = render(<ColorArea />);
    let sliders = getAllByRole('slider');

    sliders.forEach((slider, i) => {
      expect(slider).toHaveAttribute('type', 'range');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '100');
      expect(slider).toHaveAttribute('step', '1');
      expect(slider).toHaveAttribute('value', '100');
      expect(slider).toHaveAttribute('aria-label', 'Saturation / Brightness');
      expect(slider).toHaveAttribute('aria-roledescription', '2D slider');
      expect(slider).toHaveAttribute('aria-valuetext', i === 0 ? 'Saturation: 100%, Brightness: 100%' : 'Brightness: 100%, Saturation: 100%');
      expect(slider).toHaveAttribute('title', 'Red, Hue: 0°, Saturation: 100%, Brightness: 100%');
      expect(slider).toHaveAttribute('tabindex', i === 0 ? '0' : '-1');
      expect(slider).toHaveAttribute('style', 'border: 0px; clip-path: inset(50%); height: 100%; margin: 0px -1px -1px 0px; overflow: hidden; padding: 0px; position: absolute; width: 100%; white-space: nowrap; opacity: 0.0001; pointer-events: none;');
      if (i === 1) {
        expect(slider).toHaveAttribute('aria-orientation', 'vertical');
      } else {
        expect(slider).not.toHaveAttribute('aria-orientation');
      }
    });
  });

  it('the horizontal slider is focusable', () => {
    let {getAllByRole} = render(<div>
      <button>A</button>
      <ColorArea />
      <button>B</button>
    </div>);
    let slider = getAllByRole('slider');
    let [buttonA, buttonB] = getAllByRole('button');

    userEvent.tab();
    expect(document.activeElement).toBe(buttonA);
    userEvent.tab();
    expect(document.activeElement).toBe(slider[0]);
    userEvent.tab();
    expect(document.activeElement).toBe(buttonB);
    userEvent.tab({shift: true});
    expect(document.activeElement).toBe(slider[0]);
  });

  it('disabled', () => {
    let {getAllByRole} = render(<div>
      <button>A</button>
      <ColorArea isDisabled />
      <button>B</button>
    </div>);
    let sliders = getAllByRole('slider');
    let [buttonA, buttonB] = getAllByRole('button');
    sliders.forEach(slider => expect(slider).toHaveAttribute('disabled'));

    userEvent.tab();
    expect(document.activeElement).toBe(buttonA);
    userEvent.tab();
    expect(document.activeElement).toBe(buttonB);
    userEvent.tab({shift: true});
    expect(document.activeElement).toBe(buttonA);
  });

  describe('keyboard events', () => {
    it('left/right works', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {getAllByRole, getByTestId} = render(<ColorArea defaultValue={defaultColor} onChange={onChangeSpy} />);
      let sliders = getAllByRole('slider');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;
      act(() => sliders[0].focus());

      fireEvent.keyDown(sliders[0], {key: 'ArrowLeft'});
      act(() => jest.runAllTimers());
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 99).toString('hsla'));
      expect(sliders[0]).toHaveAttribute('value', '99');
      fireEvent.keyDown(sliders[0], {key: 'ArrowRight'});
      act(() => jest.runAllTimers());
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).toString('hsla'));
      expect(sliders[0]).toHaveAttribute('value', '100');
    });

    it('up/down works', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {getAllByRole, getByTestId} = render(<ColorArea defaultValue={defaultColor} onChange={onChangeSpy} />);
      let sliders = getAllByRole('slider');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;
      act(() => {sliders[0].focus();});

      fireEvent.keyDown(sliders[0], {key: 'ArrowDown'});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('lightness', 49).toString('hsla'));
      expect(sliders[1]).toHaveAttribute('value', '49');
      fireEvent.keyDown(sliders[1], {key: 'ArrowUp'});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('lightness', 50).toString('hsla'));
      expect(sliders[1]).toHaveAttribute('value', '50');
    });

    it('doesn\'t work when disabled', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {getAllByRole, getByTestId} = render(<ColorArea defaultValue={defaultColor} onChange={onChangeSpy} isDisabled />);
      let slider = getAllByRole('slider')[0];
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;
      act(() => {slider.focus();});

      fireEvent.keyDown(slider, {key: 'ArrowRight'});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      fireEvent.keyDown(slider, {key: 'ArrowLeft'});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
    });

    it('respects step', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {getAllByRole, getByTestId} = render(<ColorArea defaultValue={defaultColor} onChange={onChangeSpy} xChannelStep={20} yChannelStep={20} />);
      let sliders = getAllByRole('slider');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;
      act(() => {sliders[0].focus();});

      fireEvent.keyDown(sliders[0], {key: 'ArrowLeft'});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 80).toString('hsla'));
      expect(sliders[0]).toHaveAttribute('value', '80');
      fireEvent.keyDown(sliders[0], {key: 'ArrowRight'});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).toString('hsla'));
      expect(sliders[0]).toHaveAttribute('value', '100');
    });

    describe('page up/page down/shift + up/shift + down, home/end/shift + left/shift + right', () => {
      it('Hue defaults to step=15', () => {
        let defaultColor = parseColor('hsb(0, 100%, 50%)');
        let {getAllByRole, getByTestId} = render(<ColorArea defaultValue={defaultColor} xChannel={'hue'} yChannel={'brightness'} onChange={onChangeSpy} />);
        let sliders = getAllByRole('slider');
        let container = getByTestId('container');
        container.getBoundingClientRect = getBoundingClientRect;
        act(() => {sliders[0].focus();});

        fireEvent.keyDown(sliders[0], {key: 'PageDown'});
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 0).withChannelValue('brightness', 40).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '40');
        fireEvent.keyDown(sliders[1], {key: 'End'});
        expect(onChangeSpy).toHaveBeenCalledTimes(2);
        expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 15).withChannelValue('brightness', 40).toString('hsla'));
        expect(sliders[0]).toHaveAttribute('value', '15');
        fireEvent.keyDown(sliders[0], {key: 'PageUp'});
        expect(onChangeSpy).toHaveBeenCalledTimes(3);
        expect(onChangeSpy.mock.calls[2][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 15).withChannelValue('brightness', 50).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '50');
        fireEvent.keyDown(sliders[1], {key: 'Home'});
        expect(onChangeSpy).toHaveBeenCalledTimes(4);
        expect(onChangeSpy.mock.calls[3][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 0).withChannelValue('brightness', 50).toString('hsla'));
        expect(sliders[0]).toHaveAttribute('value', '0');
      });

      it('RGB defaults to step=16', () => {
        let defaultColor = parseColor('rgb(128, 0, 0)');
        let {getAllByRole, getByTestId} = render(<ColorArea defaultValue={defaultColor} xChannel={'blue'} yChannel={'green'} onChange={onChangeSpy} />);
        let sliders = getAllByRole('slider');
        let container = getByTestId('container');
        container.getBoundingClientRect = getBoundingClientRect;
        act(() => {sliders[0].focus();});

        fireEvent.keyDown(sliders[0], {key: 'PageUp'});
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        expect(onChangeSpy.mock.calls[0][0].toString('rgba')).toBe(defaultColor.withChannelValue('blue', 0).withChannelValue('green', 16).toString('rgba'));
        expect(sliders[1]).toHaveAttribute('value', '16');
        fireEvent.keyDown(sliders[1], {key: 'End'});
        expect(onChangeSpy).toHaveBeenCalledTimes(2);
        expect(onChangeSpy.mock.calls[1][0].toString('rgba')).toBe(defaultColor.withChannelValue('blue', 16).withChannelValue('green', 16).toString('rgba'));
        expect(sliders[0]).toHaveAttribute('value', '16');
        fireEvent.keyDown(sliders[0], {key: 'PageDown'});
        expect(onChangeSpy).toHaveBeenCalledTimes(3);
        expect(onChangeSpy.mock.calls[2][0].toString('rgba')).toBe(defaultColor.withChannelValue('blue', 16).withChannelValue('green', 0).toString('rgba'));
        expect(sliders[1]).toHaveAttribute('value', '0');
        fireEvent.keyDown(sliders[1], {key: 'Home'});
        expect(onChangeSpy).toHaveBeenCalledTimes(4);
        expect(onChangeSpy.mock.calls[3][0].toString('rgba')).toBe(defaultColor.withChannelValue('blue', 0).withChannelValue('green', 0).toString('rgba'));
        expect(sliders[0]).toHaveAttribute('value', '0');
      });

      it('Saturation/Brightness defaults to step=10', () => {
        let defaultColor = parseColor('hsb(0, 100%, 50%)');
        let {getAllByRole, getByTestId} = render(<ColorArea defaultValue={defaultColor} onChange={onChangeSpy} />);
        let sliders = getAllByRole('slider');
        let container = getByTestId('container');
        container.getBoundingClientRect = getBoundingClientRect;

        act(() => {sliders[0].focus();});
        fireEvent.keyDown(sliders[0], {key: 'PageDown'});
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).withChannelValue('brightness', 40).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '40');
        fireEvent.keyDown(sliders[1], {key: 'Home'});
        expect(onChangeSpy).toHaveBeenCalledTimes(2);
        expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 90).withChannelValue('brightness', 40).toString('hsla'));
        expect(sliders[0]).toHaveAttribute('value', '90');
        fireEvent.keyDown(sliders[0], {key: 'PageUp'});
        expect(onChangeSpy).toHaveBeenCalledTimes(3);
        expect(onChangeSpy.mock.calls[2][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 90).withChannelValue('brightness', 50).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '50');
        fireEvent.keyDown(sliders[1], {key: 'End'});
        expect(onChangeSpy).toHaveBeenCalledTimes(4);
        expect(onChangeSpy.mock.calls[3][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).withChannelValue('brightness', 50).toString('hsla'));
        expect(sliders[0]).toHaveAttribute('value', '100');

        onChangeSpy.mockClear();
        fireEvent.keyDown(sliders[0], {key: 'ArrowDown', shiftKey: true});
        expect(onChangeSpy).toHaveBeenCalledTimes(2);
        expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).withChannelValue('brightness', 49).toString('hsla'));
        expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).withChannelValue('brightness', 40).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '40');
        fireEvent.keyDown(sliders[1], {key: 'ArrowLeft', shiftKey: true});
        expect(onChangeSpy).toHaveBeenCalledTimes(4);
        expect(onChangeSpy.mock.calls[2][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 99).withChannelValue('brightness', 40).toString('hsla'));
        expect(onChangeSpy.mock.calls[3][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 90).withChannelValue('brightness', 40).toString('hsla'));
        expect(sliders[0]).toHaveAttribute('value', '90');
        fireEvent.keyDown(sliders[0], {key: 'ArrowUp', shiftKey: true});
        expect(onChangeSpy).toHaveBeenCalledTimes(6);
        expect(onChangeSpy.mock.calls[4][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 90).withChannelValue('brightness', 41).toString('hsla'));
        expect(onChangeSpy.mock.calls[5][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 90).withChannelValue('brightness', 50).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '50');
        fireEvent.keyDown(sliders[1], {key: 'ArrowRight', shiftKey: true});
        expect(onChangeSpy).toHaveBeenCalledTimes(8);
        expect(onChangeSpy.mock.calls[6][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 91).withChannelValue('brightness', 50).toString('hsla'));
        expect(onChangeSpy.mock.calls[7][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).withChannelValue('brightness', 50).toString('hsla'));
        expect(sliders[0]).toHaveAttribute('value', '100');
      });

      it('Saturation/Lightness defaults to step=10', () => {
        let defaultColor = parseColor('hsl(0, 100%, 50%)');
        let {getAllByRole, getByTestId} = render(<ColorArea defaultValue={defaultColor} onChange={onChangeSpy} />);
        let sliders = getAllByRole('slider');
        let container = getByTestId('container');
        container.getBoundingClientRect = getBoundingClientRect;

        act(() => {sliders[0].focus();});
        fireEvent.keyDown(sliders[0], {key: 'PageDown'});
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).withChannelValue('lightness', 40).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '40');
        fireEvent.keyDown(sliders[1], {key: 'Home'});
        expect(onChangeSpy).toHaveBeenCalledTimes(2);
        expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 90).withChannelValue('lightness', 40).toString('hsla'));
        expect(sliders[0]).toHaveAttribute('value', '90');
        fireEvent.keyDown(sliders[0], {key: 'PageUp'});
        expect(onChangeSpy).toHaveBeenCalledTimes(3);
        expect(onChangeSpy.mock.calls[2][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 90).withChannelValue('lightness', 50).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '50');
        fireEvent.keyDown(sliders[1], {key: 'End'});
        expect(onChangeSpy).toHaveBeenCalledTimes(4);
        expect(onChangeSpy.mock.calls[3][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).withChannelValue('lightness', 50).toString('hsla'));
        expect(sliders[0]).toHaveAttribute('value', '100');

        onChangeSpy.mockClear();
        fireEvent.keyDown(sliders[0], {key: 'ArrowDown', shiftKey: true});
        expect(onChangeSpy).toHaveBeenCalledTimes(2);
        expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).withChannelValue('lightness', 49).toString('hsla'));
        expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).withChannelValue('lightness', 40).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '40');
        fireEvent.keyDown(sliders[1], {key: 'ArrowLeft', shiftKey: true});
        expect(onChangeSpy).toHaveBeenCalledTimes(4);
        expect(onChangeSpy.mock.calls[2][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 99).withChannelValue('lightness', 40).toString('hsla'));
        expect(onChangeSpy.mock.calls[3][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 90).withChannelValue('lightness', 40).toString('hsla'));
        expect(sliders[0]).toHaveAttribute('value', '90');
        fireEvent.keyDown(sliders[0], {key: 'ArrowUp', shiftKey: true});
        expect(onChangeSpy).toHaveBeenCalledTimes(6);
        expect(onChangeSpy.mock.calls[4][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 90).withChannelValue('lightness', 41).toString('hsla'));
        expect(onChangeSpy.mock.calls[5][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 90).withChannelValue('lightness', 50).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '50');
        fireEvent.keyDown(sliders[1], {key: 'ArrowRight', shiftKey: true});
        expect(onChangeSpy).toHaveBeenCalledTimes(8);
        expect(onChangeSpy.mock.calls[6][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 91).withChannelValue('lightness', 50).toString('hsla'));
        expect(onChangeSpy.mock.calls[7][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 100).withChannelValue('lightness', 50).toString('hsla'));
        expect(sliders[0]).toHaveAttribute('value', '100');
      });

      it('favors max of step vs default step for channel', () => {
        let defaultColor = parseColor('hsl(0, 100%, 50%)');
        let {getAllByRole, getByTestId} = render(<ColorArea defaultValue={defaultColor} onChange={onChangeSpy} xChannelStep={25} yChannelStep={25} />);
        let sliders = getAllByRole('slider');
        let container = getByTestId('container');
        container.getBoundingClientRect = getBoundingClientRect;
        act(() => {sliders[0].focus();});
  
        fireEvent.keyDown(sliders[0], {key: 'PageDown'});
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('lightness', 25).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '25');
        fireEvent.keyDown(sliders[1], {key: 'PageUp'});
        expect(onChangeSpy).toHaveBeenCalledTimes(2);
        expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('lightness', 50).toString('hsla'));
        expect(sliders[1]).toHaveAttribute('value', '50');
      });
    }); 
  });

  describe.each`
  type                | prepare               | actions
  ${'Mouse Events'}   | ${installMouseEvent}  | ${[
    (el, {pageX, pageY}) => fireEvent.mouseDown(el, {button: 0, pageX, pageY, clientX: pageX, clientY: pageY}),
    (el, {pageX, pageY}) => fireEvent.mouseMove(el, {button: 0, pageX, pageY, clientX: pageX, clientY: pageY}),
    (el, {pageX, pageY}) => fireEvent.mouseUp(el, {button: 0, pageX, pageY, clientX: pageX, clientY: pageY})
  ]}
  ${'Pointer Events'} | ${installPointerEvent}| ${[
    (el, {pageX, pageY}) => fireEvent.pointerDown(el, {button: 0, pointerId: 1, pageX, pageY, clientX: pageX, clientY: pageY}),
    (el, {pageX, pageY}) => fireEvent.pointerMove(el, {button: 0, pointerId: 1, pageX, pageY, clientX: pageX, clientY: pageY}),
    (el, {pageX, pageY}) => fireEvent.pointerUp(el, {button: 0, pointerId: 1, pageX, pageY, clientX: pageX, clientY: pageY})
  ]}
  ${'Touch Events'}   | ${() => {}}           | ${[
    (el, {pageX, pageY}) => fireEvent.touchStart(el, {changedTouches: [{identifier: 1, pageX, pageY, clientX: pageX, clientY: pageY}]}),
    (el, {pageX, pageY}) => fireEvent.touchMove(el, {changedTouches: [{identifier: 1, pageX, pageY, clientX: pageX, clientY: pageY}]}),
    (el, {pageX, pageY}) => fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, pageX, pageY, clientX: pageX, clientY: pageY}]})
  ]}
  `('$type', ({actions: [start, move, end], prepare}) => {
    prepare();

    it('dragging the thumb works', () => {
      let defaultColor = parseColor('hsl(0, 50%, 50%)');
      let {getAllByRole, getByTestId} = render(<ColorArea defaultValue={defaultColor} onChange={onChangeSpy} />);
      let thumb = getByTestId('thumb');
      let sliders = getAllByRole('slider');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      start(thumb, {pageX: CENTER, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);

      move(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('lightness', 40).toString('hsla'));
      expect(sliders[1]).toHaveAttribute('value', '40');

      move(thumb, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 40).toString('hsla'));
      expect(sliders[0]).toHaveAttribute('value', '40');

      end(thumb, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
    });

    it('dragging the thumb doesn\'t work when disabled', () => {
      let defaultColor = parseColor('hsl(0, 50%, 50%)');
      let {getAllByRole, getByTestId} = render(<ColorArea isDisabled defaultValue={defaultColor} onChange={onChangeSpy} />);
      let thumb = getByTestId('thumb');
      let slider = getAllByRole('slider')[0];
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      expect(document.activeElement).not.toBe(slider);
      start(thumb, {pageX: CENTER + THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);

      move(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);

      end(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);
    });

    it('dragging the thumb respects the step', () => {
      let defaultColor = parseColor('hsl(0, 50%, 50%)');
      let {getAllByRole, getByTestId} = render(<ColorArea xChannelStep={10} yChannelStep={10} defaultValue={defaultColor} onChange={onChangeSpy} xChannel="saturation" yChannel="lightness" />);
      let thumb = getByTestId('thumb');
      let sliders = getAllByRole('slider');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      start(thumb, {pageX: CENTER, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);

      move(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('lightness', 40).toString('hsla'));
      expect(sliders[1]).toHaveAttribute('value', '40');

      move(thumb, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 40).toString('hsla'));
      expect(sliders[0]).toHaveAttribute('value', '40');

      end(thumb, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
    });

    it('clicking and dragging on the color area works', () => {
      let defaultColor = parseColor('hsl(0, 50%, 50%)');
      let {getAllByRole, getByTestId} = render(<ColorArea defaultValue={defaultColor} onChange={onChangeSpy} />);
      let sliders = getAllByRole('slider');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      start(container, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('lightness', 40).toString('hsla'));
      expect(sliders[1]).toHaveAttribute('value', '40');

      move(container, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 40).toString('hsla'));
      expect(sliders[0]).toHaveAttribute('value', '40');

      end(container, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
    });

    it('clicking and dragging on the color area doesn\'t work when disabled', () => {
      let defaultColor = parseColor('hsl(0, 50%, 50%)');
      let {getAllByRole, getByTestId} = render(<ColorArea isDisabled defaultValue={defaultColor} onChange={onChangeSpy} />);
      let slider = getAllByRole('slider')[0];
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      expect(document.activeElement).not.toBe(slider);
      start(container, {pageX: CENTER + THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);

      move(container, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);

      end(container, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);
    });

    it('clicking and dragging on the color area respects the step', () => {
      let defaultColor = parseColor('hsl(0, 100%, 100%)');
      let {getAllByRole, getByTestId} = render(<ColorArea xChannelStep={10} yChannelStep={10} defaultValue={defaultColor} onChange={onChangeSpy} xChannel="saturation" yChannel="lightness" />);
      let sliders = getAllByRole('slider');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      start(container, {pageX: SIZE, pageY: 0});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);

      move(container, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 50).withChannelValue('lightness', 40).toString('hsla'));
      expect(sliders[0]).toHaveAttribute('value', '50');
      expect(sliders[1]).toHaveAttribute('value', '40');

      move(container, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('saturation', 40).withChannelValue('lightness', 50).toString('hsla'));
      expect(sliders[0]).toHaveAttribute('value', '40');
      expect(sliders[1]).toHaveAttribute('value', '50');

      end(container, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
    });
  });
});
