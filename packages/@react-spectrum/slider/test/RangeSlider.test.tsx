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

import {fireEvent, pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import {press, testKeypresses} from './utils';
import {Provider} from '@adobe/react-spectrum';
import {RangeSlider} from '../';
import React, {useCallback, useState} from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';


describe('RangeSlider', function () {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  it('supports aria-label', function () {
    let {getByRole} = render(<RangeSlider aria-label="The Label" />);

    let group = getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'The Label');

    // No label/value
    expect(group.textContent).toBeFalsy();
  });

  it('supports label', function () {
    let {getAllByRole, getByRole} = render(<RangeSlider label="The Label" />);

    let group = getByRole('group');
    let labelId = group.getAttribute('aria-labelledby')!;
    let [leftSlider, rightSlider] = getAllByRole('slider');
    expect(leftSlider.getAttribute('aria-label')).toBe('Minimum');
    expect(rightSlider.getAttribute('aria-label')).toBe('Maximum');
    expect(leftSlider.getAttribute('aria-labelledby')).toBe(`${leftSlider.id} ${labelId}`);
    expect(rightSlider.getAttribute('aria-labelledby')).toBe(`${rightSlider.id} ${labelId}`);

    let label = document.getElementById(labelId);
    expect(label).toHaveTextContent('The Label');
    // https://bugs.webkit.org/show_bug.cgi?id=172464
    // expect(label).toHaveAttribute('for', getAllByRole('slider')[0].id);
    expect(label).not.toHaveAttribute('for');

    // Shows value as well
    let output = getByRole('status');
    expect(output).toHaveTextContent('0 – 100');
    expect(output).toHaveAttribute('for', getAllByRole('slider').map(s => s.id).join(' '));
    expect(output).not.toHaveAttribute('aria-labelledby');
    expect(output).toHaveAttribute('aria-live', 'off');
  });

  it('supports showValueLabel: false', function () {
    let {getByRole, queryByRole} = render(<RangeSlider label="The Label" showValueLabel={false} />);
    let group = getByRole('group');

    expect(group.textContent).toBe('The Label');
    expect(queryByRole('status')).toBeNull();
  });

  it('supports disabled', async function () {
    let {getAllByRole} = render(<div>
      <button>A</button>
      <RangeSlider label="The Label" isDisabled />
      <button>B</button>
    </div>);

    let [leftSlider, rightSlider] = getAllByRole('slider');
    expect(leftSlider).toBeDisabled();
    expect(rightSlider).toBeDisabled();
    let [buttonA, buttonB] = getAllByRole('button');

    await user.tab();
    expect(document.activeElement).toBe(buttonA);
    await user.tab();
    expect(document.activeElement).toBe(buttonB);
  });

  it('can be focused', async function () {
    let {getAllByRole} = render(<div>
      <button>A</button>
      <RangeSlider label="The Label" defaultValue={{start: 20, end: 50}} />
      <button>B</button>
    </div>);

    let [sliderLeft, sliderRight] = getAllByRole('slider');
    let [buttonA, buttonB] = getAllByRole('button');

    await user.tab();
    expect(document.activeElement).toBe(buttonA);
    await user.tab();
    expect(document.activeElement).toBe(sliderLeft);
    await user.tab();
    expect(document.activeElement).toBe(sliderRight);
    await user.tab();
    expect(document.activeElement).toBe(buttonB);
    await user.tab({shift: true});
    expect(document.activeElement).toBe(sliderRight);
    await user.tab({shift: true});
    expect(document.activeElement).toBe(sliderLeft);
    await user.tab({shift: true});
    expect(document.activeElement).toBe(buttonA);
  });

  it('supports defaultValue', function () {
    let {getAllByRole, getByRole} = render(<RangeSlider label="The Label" defaultValue={{start: 20, end: 40}} />);

    let [sliderLeft, sliderRight] = getAllByRole('slider');

    let output = getByRole('status');
    expect(output).toHaveTextContent('20 – 40');

    expect(sliderLeft).toHaveProperty('value', '20');
    expect(sliderRight).toHaveProperty('value', '40');
    fireEvent.change(sliderLeft, {target: {value: '30'}});
    expect(sliderLeft).toHaveProperty('value', '30');
    expect(output).toHaveTextContent('30 – 40');
    fireEvent.change(sliderRight, {target: {value: '50'}});
    expect(sliderRight).toHaveProperty('value', '50');
    expect(output).toHaveTextContent('30 – 50');
  });

  it('can be controlled', function () {
    let setValues: any[] = [];

    function Test() {
      let [value, _setValue] = useState({start: 20, end: 40});
      let setValue = useCallback((val) => {
        setValues.push(val);
        _setValue(val);
      }, [_setValue]);

      return (<RangeSlider label="The Label" value={value} onChange={setValue} />);
    }

    let {getAllByRole, getByRole} = render(<Test />);
    let [sliderLeft, sliderRight] = getAllByRole('slider');

    let output = getByRole('status');
    expect(output).toHaveTextContent('20 – 40');

    expect(sliderLeft).toHaveProperty('value', '20');
    expect(sliderLeft).toHaveAttribute('aria-valuetext', '20');
    expect(sliderRight).toHaveProperty('value', '40');
    expect(sliderRight).toHaveAttribute('aria-valuetext', '40');
    fireEvent.change(sliderLeft, {target: {value: '30'}});
    expect(sliderLeft).toHaveProperty('value', '30');
    expect(sliderLeft).toHaveAttribute('aria-valuetext', '30');
    expect(output).toHaveTextContent('30 – 40');
    fireEvent.change(sliderRight, {target: {value: '50'}});
    expect(sliderRight).toHaveProperty('value', '50');
    expect(sliderRight).toHaveAttribute('aria-valuetext', '50');
    expect(output).toHaveTextContent('30 – 50');

    expect(setValues).toStrictEqual([{start: 30, end: 40}, {start: 30, end: 50}]);
  });

  it('supports a custom valueLabel', function () {
    function Test() {
      let [value, setValue] = useState({start: 10, end: 40});
      return (<RangeSlider label="The Label" value={value} onChange={setValue} getValueLabel={value => `A${value.start}B${value.end}C`} />);
    }

    let {getAllByRole, getByRole} = render(<Test />);

    let [sliderLeft, sliderRight] = getAllByRole('slider');

    let output = getByRole('status');
    expect(output).toHaveTextContent('A10B40C');

    expect(sliderLeft).toHaveAttribute('aria-valuetext', '10');
    expect(sliderRight).toHaveAttribute('aria-valuetext', '40');
    fireEvent.change(sliderLeft, {target: {value: '5'}});
    expect(sliderLeft).toHaveAttribute('aria-valuetext', '5');
    expect(output).toHaveTextContent('A5B40C');
    fireEvent.change(sliderRight, {target: {value: '60'}});
    expect(output).toHaveTextContent('A5B60C');
    expect(sliderRight).toHaveAttribute('aria-valuetext', '60');
  });

  it('supports form name', () => {
    let {getAllByRole} = render(<RangeSlider label="Value" value={{start: 10, end: 40}} startName="minCookies" endName="maxCookies" />);
    let inputs = getAllByRole('slider');
    expect(inputs[0]).toHaveAttribute('name', 'minCookies');
    expect(inputs[0]).toHaveValue('10');
    expect(inputs[1]).toHaveAttribute('name', 'maxCookies');
    expect(inputs[1]).toHaveValue('40');
  });

  it('supports form reset', async () => {
    function Test() {
      let [value, setValue] = React.useState({start: 10, end: 40});
      return (
        <Provider theme={theme}>
          <form>
            <RangeSlider label="Value" value={value} onChange={setValue} />
            <input type="reset" data-testid="reset" />
          </form>
        </Provider>
      );
    }

    let {getByTestId, getAllByRole} = render(<Test />);
    let inputs = getAllByRole('slider');

    expect(inputs[0]).toHaveValue('10');
    expect(inputs[1]).toHaveValue('40');
    fireEvent.change(inputs[0], {target: {value: '30'}});
    fireEvent.change(inputs[1], {target: {value: '60'}});
    expect(inputs[0]).toHaveValue('30');
    expect(inputs[1]).toHaveValue('60');

    let button = getByTestId('reset');
    await user.click(button);
    expect(inputs[0]).toHaveValue('10');
    expect(inputs[1]).toHaveValue('40');
  });

  describe('formatOptions', () => {
    it('prefixes the value with a plus sign if needed', function () {
      let {getAllByRole, getByRole} = render(
        <RangeSlider
          label="The Label"
          minValue={-50}
          maxValue={50}
          defaultValue={{start: 10, end: 20}} />
      );

      let [sliderLeft, sliderRight] = getAllByRole('slider');

      let output = getByRole('status');
      expect(output).toHaveTextContent('+10 – +20');

      expect(sliderLeft).toHaveAttribute('aria-valuetext', '+10');
      expect(sliderRight).toHaveAttribute('aria-valuetext', '+20');
      fireEvent.change(sliderLeft, {target: {value: '-35'}});
      expect(sliderLeft).toHaveAttribute('aria-valuetext', '-35');
      expect(output).toHaveTextContent('-35 – +20');
      fireEvent.change(sliderRight, {target: {value: '0'}});
      expect(output).toHaveTextContent('-35 – 0');
      expect(sliderRight).toHaveAttribute('aria-valuetext', '0');
    });

    it('supports setting custom formatOptions', function () {
      let {getAllByRole, getByRole} = render(
        <RangeSlider
          label="The Label"
          minValue={0}
          maxValue={1}
          step={0.01}
          defaultValue={{start: 0.2, end: 0.6}}
          formatOptions={{style: 'percent'}} />
      );

      let [sliderLeft, sliderRight] = getAllByRole('slider');

      let output = getByRole('status');
      expect(output).toHaveTextContent('20% – 60%');

      expect(sliderLeft).toHaveAttribute('aria-valuetext', '20%');
      expect(sliderRight).toHaveAttribute('aria-valuetext', '60%');
      fireEvent.change(sliderLeft, {target: {value: '0.3'}});
      expect(output).toHaveTextContent('30% – 60%');
      expect(sliderLeft).toHaveAttribute('aria-valuetext', '30%');
      fireEvent.change(sliderRight, {target: {value: '0.7'}});
      expect(output).toHaveTextContent('30% – 70%');
      expect(sliderRight).toHaveAttribute('aria-valuetext', '70%');
    });
  });

  describe('keyboard interactions', () => {
    // Can't test arrow/page up/down, home/end arrows because they are handled by the browser and JSDOM doesn't feel like it.

    it.each`
      Name                                 | props                                 | commands
      ${'(left/right arrows, ltr)'}        | ${{locale: 'de-DE'}}                  | ${[{left: press.ArrowRight, result: +1}, {left: press.ArrowLeft, result: -1}, {right: press.ArrowRight, result: +1}, {right: press.ArrowLeft, result: -1}]}
      ${'(left/right arrows, rtl)'}        | ${{locale: 'ar-AE'}}                  | ${[{left: press.ArrowRight, result: -1}, {left: press.ArrowLeft, result: +1}, {right: press.ArrowRight, result: -1}, {right: press.ArrowLeft, result: +1}]}
      ${'(left/right arrows, isDisabled)'} | ${{locale: 'de-DE', isDisabled: true}}| ${[{left: press.ArrowRight, result: 0}, {left: press.ArrowLeft, result: 0}, {right: press.ArrowRight, result: 0}, {right: press.ArrowLeft, result: 0}]}
    `('$Name moves the slider in the correct direction', function ({props, commands}) {
      let tree = render(
        <RangeSlider label="Label" defaultValue={{start: 20, end: 50}} minValue={0} maxValue={100} />
      , undefined, props);
      let sliders = tree.getAllByRole('slider') as [HTMLInputElement, HTMLInputElement];
      testKeypresses(sliders, commands);
    });

    it.each`
      Name                          | props                 | commands
      ${'(left/right arrows, ltr)'} | ${{locale: 'de-DE'}}  | ${[{left: press.ArrowRight, result: +10}, {left: press.ArrowLeft, result: -10}, {right: press.ArrowRight, result: +10}, {right: press.ArrowLeft, result: -10}]}
      ${'(left/right arrows, rtl)'} | ${{locale: 'ar-AE'}}  | ${[{left: press.ArrowRight, result: -10}, {left: press.ArrowLeft, result: +10}, {right: press.ArrowRight, result: -10}, {right: press.ArrowLeft, result: +10}]}
    `('$Name respects the step size', function ({props, commands}) {
      let tree = render(
        <RangeSlider label="Label" step={10} defaultValue={{start: 20, end: 50}} />
      , undefined, props);
      let sliders = tree.getAllByRole('slider') as [HTMLInputElement, HTMLInputElement];
      testKeypresses(sliders, commands);
    });

    it.each`
      Name                          | props                 | commands
      ${'(left/right arrows, ltr)'} | ${{locale: 'de-DE'}}  | ${[{left: press.ArrowLeft, result: -1}, {left: press.ArrowLeft, result: 0}, {right: press.ArrowRight, result: +1}, {right: press.ArrowRight, result: 0}]}
      ${'(left/right arrows, rtl)'} | ${{locale: 'ar-AE'}}  | ${[{left: press.ArrowRight, result: -1}, {left: press.ArrowRight, result: 0}, {right: press.ArrowLeft, result: +1}, {right: press.ArrowLeft, result: 0}]}
    `('$Name is clamped by min/max', function ({props, commands}) {
      let tree = render(
        <RangeSlider label="Label" minValue={-5} defaultValue={{start: -4, end: 4}} maxValue={5} />
      , undefined, props);
      let sliders = tree.getAllByRole('slider') as [HTMLInputElement, HTMLInputElement];
      testKeypresses(sliders, commands);
    });
  });

  describe('mouse interactions', () => {
    beforeAll(() => {
      let originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect;
      jest.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        let rect = originalGetBoundingClientRect.call(this);
        return {...rect, top: 0, left: 0, width: 100, height: 100};
      });
    });

    let oldMouseEvent = MouseEvent;
    beforeAll(() => {
      // @ts-ignore
      global.MouseEvent = class FakeMouseEvent extends MouseEvent {
        _init: {pageX: number, pageY: number};
        constructor(name, init) {
          super(name, init);
          this._init = init;
        }
        get pageX() {
          return this._init.pageX;
        }
        get pageY() {
          return this._init.pageY;
        }
      };
    });
    afterAll(() => {
      global.MouseEvent = oldMouseEvent;
    });

    it('can click and drag handle', () => {
      let onChangeSpy = jest.fn();
      let {getAllByRole} = render(
        <RangeSlider
          label="The Label"
          onChange={onChangeSpy}
          defaultValue={{start: 20, end: 50}} />
      );

      let [sliderLeft, sliderRight] = getAllByRole('slider');
      let [thumbLeft, thumbRight] = [sliderLeft.parentElement!.parentElement!, sliderRight.parentElement!.parentElement!];

      fireEvent.mouseDown(thumbLeft, {clientX: 20, pageX: 20});
      expect(onChangeSpy).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(sliderLeft);
      fireEvent.mouseMove(thumbLeft, {pageX: 10});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenLastCalledWith({start: 10, end: 50});
      fireEvent.mouseMove(thumbLeft, {pageX: -10});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy).toHaveBeenLastCalledWith({start: 0, end: 50});
      fireEvent.mouseMove(thumbLeft, {pageX: 120});
      expect(onChangeSpy).toHaveBeenCalledTimes(3);
      expect(onChangeSpy).toHaveBeenLastCalledWith({start: 50, end: 50});
      fireEvent.mouseUp(thumbLeft, {pageX: 120});
      expect(onChangeSpy).toHaveBeenCalledTimes(3);

      onChangeSpy.mockClear();

      fireEvent.mouseDown(thumbRight, {clientX: 50, pageX: 50});
      expect(onChangeSpy).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(sliderRight);
      fireEvent.mouseMove(thumbRight, {pageX: 60});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenLastCalledWith({start: 50, end: 60});
      fireEvent.mouseMove(thumbRight, {pageX: -10});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy).toHaveBeenLastCalledWith({start: 50, end: 50});
      fireEvent.mouseMove(thumbRight, {pageX: 120});
      expect(onChangeSpy).toHaveBeenCalledTimes(3);
      expect(onChangeSpy).toHaveBeenLastCalledWith({start: 50, end: 100});
      fireEvent.mouseUp(thumbRight, {pageX: 120});
      expect(onChangeSpy).toHaveBeenCalledTimes(3);
    });

    it('cannot click and drag handle when disabled', () => {
      let onChangeSpy = jest.fn();
      let {getAllByRole} = render(
        <RangeSlider
          label="The Label"
          onChange={onChangeSpy}
          defaultValue={{start: 20, end: 50}}
          isDisabled />
      );

      let [sliderLeft, sliderRight] = getAllByRole('slider');
      let [thumbLeft, thumbRight] = [sliderLeft.parentElement!.parentElement!, sliderRight.parentElement!.parentElement!];

      fireEvent.mouseDown(thumbLeft, {clientX: 20, pageX: 20});
      expect(onChangeSpy).not.toHaveBeenCalled();
      expect(document.activeElement).not.toBe(sliderLeft);
      fireEvent.mouseMove(thumbLeft, {pageX: 10});
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseMove(thumbLeft, {pageX: -10});
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseMove(thumbLeft, {pageX: 120});
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseUp(thumbLeft, {pageX: 120});
      expect(onChangeSpy).not.toHaveBeenCalled();

      onChangeSpy.mockClear();

      fireEvent.mouseDown(thumbRight, {clientX: 50, pageX: 20});
      expect(onChangeSpy).not.toHaveBeenCalled();
      expect(document.activeElement).not.toBe(sliderRight);
      fireEvent.mouseMove(thumbRight, {pageX: 60});
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseMove(thumbRight, {pageX: -10});
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseMove(thumbRight, {pageX: 120});
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseUp(thumbRight, {pageX: 120});
      expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('can click on track to move nearest handle', () => {
      let onChangeSpy = jest.fn();
      let {getAllByRole} = render(
        <RangeSlider
          label="The Label"
          onChange={onChangeSpy}
          defaultValue={{start: 40, end: 70}} />
      );

      let [sliderLeft, sliderRight] = getAllByRole('slider');
      let [thumbLeft, thumbRight] = [sliderLeft.parentElement!.parentElement!, sliderRight.parentElement!.parentElement!];

      let [leftTrack, middleTrack, rightTrack] = [...thumbLeft.parentElement!.children].filter(c => c !== thumbLeft && c !== thumbRight);

      // left track
      fireEvent.mouseDown(leftTrack, {clientX: 20, pageX: 20});
      expect(document.activeElement).toBe(sliderLeft);
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenLastCalledWith({start: 20, end: 70});
      fireEvent.mouseUp(thumbLeft, {pageX: 20});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);

      // middle track, near left slider
      onChangeSpy.mockClear();
      fireEvent.mouseDown(middleTrack, {clientX: 40, pageX: 40});
      expect(document.activeElement).toBe(sliderLeft);
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenLastCalledWith({start: 40, end: 70});
      fireEvent.mouseUp(thumbLeft, {pageX: 40});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);

      // middle track, near right slider
      onChangeSpy.mockClear();
      fireEvent.mouseDown(middleTrack, {clientX: 60, pageX: 40});
      expect(document.activeElement).toBe(sliderRight);
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenLastCalledWith({start: 40, end: 60});
      fireEvent.mouseUp(thumbRight, {pageX: 60});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);

      // right track
      onChangeSpy.mockClear();
      fireEvent.mouseDown(rightTrack, {clientX: 90, pageX: 90});
      expect(document.activeElement).toBe(sliderRight);
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenLastCalledWith({start: 40, end: 90});
      fireEvent.mouseUp(thumbRight, {pageX: 90});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('cannot click on track to move nearest handle when disabled', () => {
      let onChangeSpy = jest.fn();
      let {getAllByRole} = render(
        <RangeSlider
          label="The Label"
          onChange={onChangeSpy}
          defaultValue={{start: 40, end: 70}}
          isDisabled />
      );

      let [sliderLeft, sliderRight] = getAllByRole('slider');
      let [thumbLeft, thumbRight] = [sliderLeft.parentElement!.parentElement!, sliderRight.parentElement!.parentElement!];

      let [leftTrack, middleTrack, rightTrack] = [...thumbLeft.parentElement!.children].filter(c => c !== thumbLeft && c !== thumbRight);

      // left track
      fireEvent.mouseDown(leftTrack, {clientX: 20, pageX: 20});
      expect(document.activeElement).not.toBe(sliderLeft);
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseUp(thumbLeft, {pageX: 20});
      expect(onChangeSpy).not.toHaveBeenCalled();

      // middle track, near left slider
      onChangeSpy.mockClear();
      fireEvent.mouseDown(middleTrack, {clientX: 40, pageX: 40});
      expect(document.activeElement).not.toBe(sliderLeft);
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseUp(thumbLeft, {pageX: 40});
      expect(onChangeSpy).not.toHaveBeenCalled();

      // middle track, near right slider
      onChangeSpy.mockClear();
      fireEvent.mouseDown(middleTrack, {clientX: 60, pageX: 60});
      expect(document.activeElement).not.toBe(sliderRight);
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseUp(thumbRight, {pageX: 60});
      expect(onChangeSpy).not.toHaveBeenCalled();

      // right track
      onChangeSpy.mockClear();
      fireEvent.mouseDown(rightTrack, {clientX: 90, pageX: 90});
      expect(document.activeElement).not.toBe(sliderRight);
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseUp(thumbRight, {pageX: 90});
      expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('clicking on the label should focus the first thumb', () => {
      let {getByText, getAllByRole} = render(
        <RangeSlider
          label="The Label"
          defaultValue={{start: 40, end: 70}} />
      );

      let label = getByText('The Label');
      let thumbs = getAllByRole('slider');

      fireEvent.click(label);
      expect(document.activeElement).toBe(thumbs[0]);
    });
  });
});
