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

import {act, fireEvent, installMouseEvent, pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import {press, testKeypresses} from './utils';
import {Provider} from '@adobe/react-spectrum';
import React, {useCallback, useState} from 'react';
import {Slider} from '../';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

describe('Slider', function () {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  it('supports aria-label', function () {
    let {getByRole} = render(<Slider aria-label="The Label" />);

    let group = getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'The Label');

    // No label/value
    expect(group.textContent).toBeFalsy();

    let slider = getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuetext', '0');
  });

  it('supports label', function () {
    let {getByRole} = render(<Slider label="The Label" />);

    let group = getByRole('group');
    let labelId = group.getAttribute('aria-labelledby')!;
    let slider = getByRole('slider');
    expect(slider.getAttribute('aria-labelledby')).toBe(labelId);
    expect(slider).toHaveAttribute('aria-valuetext', '0');

    let label = document.getElementById(labelId);
    expect(label).toHaveTextContent(/^The Label$/);
    // https://bugs.webkit.org/show_bug.cgi?id=172464
    // expect(label).toHaveAttribute('for', getByRole('slider').id);
    expect(label).not.toHaveAttribute('for');

    // Shows value as well
    let output = getByRole('status');
    expect(output).toHaveTextContent('0');
    expect(output).toHaveAttribute('for', getByRole('slider').id);
    expect(output).not.toHaveAttribute('aria-labelledby');
    expect(output).toHaveAttribute('aria-live', 'off');
  });

  it('supports showValueLabel: false', function () {
    let {getByRole, queryByRole} = render(<Slider label="The Label" showValueLabel={false} />);
    let group = getByRole('group');
    expect(group.textContent).toBe('The Label');

    let slider = getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuetext', '0');
    expect(queryByRole('status')).toBeNull();
  });

  it('supports disabled', async function () {
    let {getByRole, getAllByRole} = render(<div>
      <button>A</button>
      <Slider label="The Label" defaultValue={20} isDisabled />
      <button>B</button>
    </div>);

    let slider = getByRole('slider');
    let [buttonA, buttonB] = getAllByRole('button');
    expect(slider).toBeDisabled();

    await user.tab();
    expect(document.activeElement).toBe(buttonA);
    await user.tab();
    expect(document.activeElement).toBe(buttonB);
  });

  it('can be focused', async function () {
    let {getByRole, getAllByRole} = render(<div>
      <button>A</button>
      <Slider label="The Label" defaultValue={20} />
      <button>B</button>
    </div>);

    let slider = getByRole('slider');
    let [buttonA, buttonB] = getAllByRole('button');
    act(() => {
      slider.focus();
    });

    expect(document.activeElement).toBe(slider);
    await user.tab();
    expect(document.activeElement).toBe(buttonB);
    await user.tab({shift: true});
    await user.tab({shift: true});
    expect(document.activeElement).toBe(buttonA);
  });

  it('supports defaultValue', function () {
    let {getByRole} = render(<Slider label="The Label" defaultValue={20} />);

    let slider = getByRole('slider');
    let output = getByRole('status');

    expect(slider).toHaveProperty('value', '20');
    expect(slider).toHaveAttribute('aria-valuetext', '20');
    expect(output).toHaveTextContent('20');
    fireEvent.change(slider, {target: {value: '40'}});
    expect(slider).toHaveProperty('value', '40');
    expect(slider).toHaveAttribute('aria-valuetext', '40');
    expect(output).toHaveTextContent('40');
  });

  it.each`
  Name                            | props                                        | expected
  ${'defaultValue minValue'}      | ${{defaultValue: 20, minValue: 50}}          | ${'50'}
  ${'defaultValue maxValue'}      | ${{defaultValue: 20, maxValue: 10}}          | ${'10'}
  ${'defaultValue minValue step'} | ${{defaultValue: 20, minValue: 50, step: 3}} | ${'50'}
  ${'defaultValue maxValue step'} | ${{defaultValue: 20, maxValue: 10, step: 3}} | ${'9'}
  ${'value minValue'}             | ${{value: 20, minValue: 50}}                 | ${'50'}
  ${'value maxValue'}             | ${{value: 20, maxValue: 10}}                 | ${'10'}
  ${'value minValue step'}        | ${{value: 20, minValue: 50, step: 3}}        | ${'50'}
  ${'value maxValue step'}        | ${{value: 20, maxValue: 10, step: 3}}        | ${'9'}
  `('clamps value & defaultValue to the allowed range $Name', function ({props, expected}) {
    let {getByRole} = render(<Slider label="The Label" {...props} />);

    let slider = getByRole('slider');
    let output = getByRole('status');

    expect(slider).toHaveProperty('value', expected);
    expect(slider).toHaveAttribute('aria-valuetext', expected);
    expect(output).toHaveTextContent(expected);
  });

  it('can be controlled', function () {
    let setValues: any[] = [];

    function Test() {
      let [value, _setValue] = useState(50);
      let setValue = useCallback((val) => {
        setValues.push(val);
        _setValue(val);
      }, [_setValue]);

      return (<Slider label="The Label" value={value} onChange={setValue} />);
    }

    let {getByRole} = render(<Test />);

    let output = getByRole('status');
    let slider = getByRole('slider');

    expect(slider).toHaveProperty('value', '50');
    expect(slider).toHaveAttribute('aria-valuetext', '50');
    expect(output).toHaveTextContent('50');
    fireEvent.change(slider, {target: {value: '55'}});
    expect(slider).toHaveProperty('value', '55');
    expect(slider).toHaveAttribute('aria-valuetext', '55');
    expect(output).toHaveTextContent('55');

    expect(setValues).toStrictEqual([55]);
  });

  it('supports a custom getValueLabel', function () {
    function Test() {
      let [value, setValue] = useState(50);
      return (<Slider label="The Label" value={value} onChange={setValue} getValueLabel={value => `A${value}B`} />);
    }

    let {getByRole} = render(<Test />);

    let output = getByRole('status');
    let slider = getByRole('slider');

    expect(output).toHaveTextContent('A50B');
    // TODO should aria-valuetext be formatted as well?
    expect(slider).toHaveAttribute('aria-valuetext', '50');
    fireEvent.change(slider, {target: {value: '55'}});
    expect(output).toHaveTextContent('A55B');
    expect(slider).toHaveAttribute('aria-valuetext', '55');
  });

  it('supports form name', () => {
    let {getByRole} = render(<Slider label="Value" value={10} name="cookies" />);
    let input = getByRole('slider');
    expect(input).toHaveAttribute('name', 'cookies');
    expect(input).toHaveValue('10');
  });

  it('supports form reset', async () => {
    function Test() {
      let [value, setValue] = React.useState(10);
      return (
        <Provider theme={theme}>
          <form>
            <Slider label="Value" value={value} onChange={setValue} />
            <input type="reset" data-testid="reset" />
          </form>
        </Provider>
      );
    }

    let {getByTestId, getByRole} = render(<Test />);
    let input = getByRole('slider');

    expect(input).toHaveValue('10');
    fireEvent.change(input, {target: {value: '55'}});
    expect(input).toHaveValue('55');

    let button = getByTestId('reset');
    await user.click(button);
    expect(input).toHaveValue('10');
  });

  describe('formatOptions', () => {
    it('prefixes the value with a plus sign if needed', function () {
      let {getByRole} = render(
        <Slider
          label="The Label"
          minValue={-50}
          maxValue={50}
          defaultValue={10} />
      );

      let output = getByRole('status');
      let slider = getByRole('slider');

      expect(output).toHaveTextContent('+10');
      expect(slider).toHaveAttribute('aria-valuetext', '+10');
      fireEvent.change(slider, {target: {value: '0'}});
      expect(output).toHaveTextContent('0');
      expect(slider).toHaveAttribute('aria-valuetext', '0');
    });

    it('supports setting custom formatOptions', function () {
      let {getByRole} = render(
        <Slider
          label="The Label"
          minValue={0}
          maxValue={1}
          step={0.01}
          defaultValue={0.2}
          formatOptions={{style: 'percent'}} />
      );

      let output = getByRole('status');
      let slider = getByRole('slider');

      expect(output).toHaveTextContent('20%');
      expect(slider).toHaveAttribute('aria-valuetext', '20%');
      fireEvent.change(slider, {target: {value: 0.5}});
      expect(output).toHaveTextContent('50%');
      expect(slider).toHaveAttribute('aria-valuetext', '50%');
    });
  });

  describe('keyboard interactions', () => {
    it.each`
      Name                                 | props                                 | commands
      ${'(left/right arrows, ltr)'}        | ${{locale: 'de-DE'}}                  | ${[{left: press.ArrowRight, result: +1}, {left: press.ArrowLeft, result: -1}]}
      ${'(left/right arrows, rtl)'}        | ${{locale: 'ar-AE'}}                  | ${[{left: press.ArrowRight, result: -1}, {left: press.ArrowLeft, result: +1}]}
      ${'(left/right arrows, isDisabled)'} | ${{locale: 'de-DE', isDisabled: true}}| ${[{left: press.ArrowRight, result: 0}, {left: press.ArrowLeft, result: 0}]}
      ${'(up/down arrows, ltr)'}           | ${{locale: 'de-DE'}}                  | ${[{left: press.ArrowUp, result: +1}, {left: press.ArrowDown, result: -1}]}
      ${'(up/down arrows, rtl)'}           | ${{locale: 'ar-AE'}}                  | ${[{left: press.ArrowUp, result: +1}, {left: press.ArrowDown, result: -1}]}
      ${'(page up/down, ltr)'}             | ${{locale: 'de-DE'}}                  | ${[{left: press.PageUp, result: +10}, {left: press.PageDown, result: -10}]}
      ${'(page up/down, rtl)'}             | ${{locale: 'ar-AE'}}                  | ${[{left: press.PageUp, result: +10}, {left: press.PageDown, result: -10}]}
      ${'(home/end, ltr)'}                 | ${{locale: 'de-DE'}}                  | ${[{left: press.Home, result: -50}, {left: press.End, result: +100}]}
      ${'(home/end, rtl)'}                 | ${{locale: 'ar-AE'}}                  | ${[{left: press.Home, result: -50}, {left: press.End, result: +100}]}
    `('$Name moves the slider in the correct direction', function ({props, commands}) {
      let tree = render(
        <Slider label="Label" defaultValue={50} minValue={0} maxValue={100} />
      , undefined, props);
      let slider = tree.getByRole('slider');
      testKeypresses([slider, slider], commands);
    });

    it.each`
      Name                                 | props                                 | commands
      ${'(left/right arrows, ltr)'}        | ${{locale: 'de-DE'}}                  | ${[{left: press.ArrowRight, result: +1}, {left: press.ArrowLeft, result: -1}]}
      ${'(left/right arrows, rtl)'}        | ${{locale: 'ar-AE'}}                  | ${[{left: press.ArrowRight, result: -1}, {left: press.ArrowLeft, result: +1}]}
      ${'(left/right arrows, isDisabled)'} | ${{locale: 'de-DE', isDisabled: true}}| ${[{left: press.ArrowRight, result: 0}, {left: press.ArrowLeft, result: 0}]}
      ${'(up/down arrows, ltr)'}           | ${{locale: 'de-DE'}}                  | ${[{left: press.ArrowUp, result: +1}, {left: press.ArrowDown, result: -1}]}
      ${'(up/down arrows, rtl)'}           | ${{locale: 'ar-AE'}}                  | ${[{left: press.ArrowUp, result: +1}, {left: press.ArrowDown, result: -1}]}
      ${'(page up/down, ltr)'}             | ${{locale: 'de-DE'}}                  | ${[{left: press.PageUp, result: +10}, {left: press.PageDown, result: -10}]}
      ${'(page up/down, rtl)'}             | ${{locale: 'ar-AE'}}                  | ${[{left: press.PageUp, result: +10}, {left: press.PageDown, result: -10}]}
      ${'(home/end, ltr)'}                 | ${{locale: 'de-DE'}}                  | ${[{left: press.Home, result: -50}, {left: press.End, result: +100}]}
      ${'(home/end, rtl)'}                 | ${{locale: 'ar-AE'}}                  | ${[{left: press.Home, result: -50}, {left: press.End, result: +100}]}
    `('$Name moves the slider in the correct direction orientation vertical', function ({props, commands}) {
      let tree = render(
        <Slider label="Label" defaultValue={50} minValue={0} maxValue={100} orientation="vertical" />
      , undefined, props);
      let slider = tree.getByRole('slider');
      testKeypresses([slider, slider], commands);
    });

    it.each`
      Name                          | props                 | commands
      ${'(left/right arrows, ltr)'} | ${{locale: 'de-DE'}}  | ${[{left: press.ArrowRight, result: +20}, {left: press.ArrowLeft, result: -20}]}
      ${'(left/right arrows, rtl)'} | ${{locale: 'ar-AE'}}  | ${[{left: press.ArrowRight, result: -20}, {left: press.ArrowLeft, result: +20}]}
      ${'(page up/down, ltr)'}      | ${{locale: 'de-DE'}}  | ${[{left: press.PageUp, result: +20}, {left: press.PageDown, result: -20}]}
      ${'(page up/down, rtl)'}      | ${{locale: 'ar-AE'}}  | ${[{left: press.PageUp, result: +20}, {left: press.PageDown, result: -20}]}
    `('$Name respects the step size', function ({props, commands}) {
      let tree = render(
        <Slider label="Label" step={20} defaultValue={40} />
      , undefined, props);
      let slider = tree.getByRole('slider');
      testKeypresses([slider, slider], commands);
    });

    it.each`
      Name                          | props                 | commands
      ${'(left/right arrows, ltr)'} | ${{locale: 'de-DE'}}  | ${[{left: press.ArrowRight, result: +10}, {left: press.ArrowLeft, result: -10}]}
      ${'(left/right arrows, rtl)'} | ${{locale: 'ar-AE'}}  | ${[{left: press.ArrowRight, result: -10}, {left: press.ArrowLeft, result: +10}]}
      ${'(page up/down, ltr)'}      | ${{locale: 'de-DE'}}  | ${[{left: press.PageUp, result: +20}, {left: press.PageDown, result: -20}]}
      ${'(page up/down, rtl)'}      | ${{locale: 'ar-AE'}}  | ${[{left: press.PageUp, result: +20}, {left: press.PageDown, result: -20}]}
    `('$Name sets page size to a multiple of step', function ({props, commands}) {
      let tree = render(
        <Slider label="Label" minValue={0} maxValue={230} defaultValue={50} step={10} />
      , undefined, props);
      // The slider page size should be initially calulated as 230/10 = 23 and then snapped to 20 so it is a multiple of the step
      let slider = tree.getByRole('slider');
      testKeypresses([slider, slider], commands);
    });

    it.each`
      Name                          | props                 | commands
      ${'(left/right arrows, ltr)'} | ${{locale: 'de-DE'}}  | ${[{left: press.ArrowRight, result: +2}, {left: press.ArrowLeft, result: -2}]}
      ${'(left/right arrows, rtl)'} | ${{locale: 'ar-AE'}}  | ${[{left: press.ArrowRight, result: -2}, {left: press.ArrowLeft, result: +2}]}
      ${'(page up/down, ltr)'}      | ${{locale: 'de-DE'}}  | ${[{left: press.PageUp, result: +2}, {left: press.PageDown, result: -2}]}
      ${'(page up/down, rtl)'}      | ${{locale: 'ar-AE'}}  | ${[{left: press.PageUp, result: +2}, {left: press.PageDown, result: -2}]}
    `('$Name sets page size to a multiple of step (scenario: step is less than min)', function ({props, commands}) {
      let tree = render(
        <Slider label="Label" minValue={50} maxValue={75} defaultValue={60} step={2} />
      , undefined, props);
      // The slider page size should be initially calulated as 25/10 = 2.5, snaps to 2
      let slider = tree.getByRole('slider');
      testKeypresses([slider, slider], commands);
    });

    it.each`
    Name                          | props                 | commands
      ${'(left/right arrows, ltr)'} | ${{locale: 'de-DE'}}  | ${[{left: press.ArrowRight, result: +2}, {left: press.ArrowLeft, result: -2}]}
      ${'(left/right arrows, rtl)'} | ${{locale: 'ar-AE'}}  | ${[{left: press.ArrowRight, result: -2}, {left: press.ArrowLeft, result: +2}]}
      ${'(page up/down, ltr)'}      | ${{locale: 'de-DE'}}  | ${[{left: press.PageUp, result: +4}, {left: press.PageDown, result: -4}]}
      ${'(page up/down, rtl)'}      | ${{locale: 'ar-AE'}}  | ${[{left: press.PageUp, result: +4}, {left: press.PageDown, result: -4}]}
    `('$Name sets page size to a multiple of step (scenario: step is greater than max)', function ({props, commands}) {
      let tree = render(
        <Slider label="Label" minValue={-50} maxValue={-15} defaultValue={-40} step={2} />
      , undefined, props);
      // The slider page size should be initially calulated as 35/10 = 3.5, snaps to 4
      let slider = tree.getByRole('slider');
      testKeypresses([slider, slider], commands);
    });

    it.each`
      Name                          | props                 | commands
      ${'(left/right arrows, ltr)'} | ${{locale: 'de-DE'}}  | ${[{left: press.ArrowLeft, result: -1}, {left: press.ArrowLeft, result: 0}]}
      ${'(left/right arrows, rtl)'} | ${{locale: 'ar-AE'}}  | ${[{left: press.ArrowRight, result: -1}, {left: press.ArrowRight, result: 0}]}
    `('$Name is clamped by min/max', function ({props, commands}) {
      let tree = render(
        <Provider theme={theme} {...props}>
          <Slider label="Label" minValue={-1} defaultValue={0} maxValue={1} />
        </Provider>
      , undefined, props);
      let slider = tree.getByRole('slider');
      testKeypresses([slider, slider], commands);
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

    installMouseEvent();

    it('can click and drag handle', () => {
      let onChangeSpy = jest.fn();
      let {getByRole} = render(
        <Slider
          label="The Label"
          onChange={onChangeSpy}
          defaultValue={50} />
      );

      let slider = getByRole('slider');
      let thumb = slider.parentElement!;
      fireEvent.mouseDown(thumb, {clientX: 50, pageX: 50});
      expect(onChangeSpy).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(slider);

      fireEvent.mouseMove(thumb, {pageX: 10});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenLastCalledWith(10);
      fireEvent.mouseMove(thumb, {pageX: -10});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy).toHaveBeenLastCalledWith(0);
      fireEvent.mouseMove(thumb, {pageX: 120});
      expect(onChangeSpy).toHaveBeenCalledTimes(3);
      expect(onChangeSpy).toHaveBeenLastCalledWith(100);
      fireEvent.mouseUp(thumb, {pageX: 120});
      expect(onChangeSpy).toHaveBeenCalledTimes(3);
    });

    it('cannot click and drag handle when disabled', () => {
      let onChangeSpy = jest.fn();
      let {getByRole} = render(
        <Slider
          label="The Label"
          onChange={onChangeSpy}
          defaultValue={50}
          isDisabled />
      );

      let slider = getByRole('slider');
      let thumb = slider.parentElement!;
      fireEvent.mouseDown(thumb, {clientX: 50, pageX: 50});
      expect(onChangeSpy).not.toHaveBeenCalled();
      expect(document.activeElement).not.toBe(slider);
      fireEvent.mouseMove(thumb, {pageX: 10});
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseUp(thumb, {pageX: 10});
      expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('can click on track to move handle', () => {
      let onChangeSpy = jest.fn();
      let {getByRole} = render(
        <Slider
          label="The Label"
          onChange={onChangeSpy}
          defaultValue={50} />
      );

      let slider = getByRole('slider');
      let thumb = slider.parentElement!.parentElement!;
      let [leftTrack, rightTrack] = [...thumb.parentElement!.children].filter(c => c !== thumb);

      // left track
      fireEvent.mouseDown(leftTrack, {clientX: 20, pageX: 20});
      expect(document.activeElement).toBe(slider);
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenLastCalledWith(20);
      fireEvent.mouseUp(thumb, {pageX: 20});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);

      // right track
      onChangeSpy.mockClear();
      fireEvent.mouseDown(rightTrack, {clientX: 70, pageX: 70});
      expect(document.activeElement).toBe(slider);
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenLastCalledWith(70);
      fireEvent.mouseUp(thumb, {pageX: 70});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('cannot click on track to move handle when disabled', () => {
      let onChangeSpy = jest.fn();
      let {getByRole} = render(
        <Slider
          label="The Label"
          onChange={onChangeSpy}
          defaultValue={50}
          isDisabled />
      );

      let slider = getByRole('slider');
      let thumb = slider.parentElement!.parentElement!;
      let [leftTrack, rightTrack] = [...thumb.parentElement!.children].filter(c => c !== thumb);

      // left track
      fireEvent.mouseDown(leftTrack, {clientX: 20, pageX: 20});
      expect(document.activeElement).not.toBe(slider);
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseUp(thumb, {pageX: 20});
      expect(onChangeSpy).not.toHaveBeenCalled();

      // right track
      onChangeSpy.mockClear();
      fireEvent.mouseDown(rightTrack, {clientX: 70, pageX: 70});
      expect(document.activeElement).not.toBe(slider);
      expect(onChangeSpy).not.toHaveBeenCalled();
      fireEvent.mouseUp(thumb, {pageX: 70});
      expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('clicking on the label should focus the first thumb', () => {
      let {getByText, getByRole} = render(
        <Slider label="The Label" />
      );

      let label = getByText('The Label');
      let thumb = getByRole('slider');

      fireEvent.click(label);
      expect(document.activeElement).toBe(thumb);
    });
  });

  describe('touch interactions', () => {
    beforeAll(() => {
      // @ts-ignore
      jest.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({top: 0, left: 0, width: 100, height: 100}));
    });

    it('doesn\'t jump to second touch on track while already dragging', () => {
      let onChangeSpy = jest.fn();
      let {getByRole} = render(
        <Slider
          label="The Label"
          onChange={onChangeSpy}
          defaultValue={50} />
      );

      let slider = getByRole('slider');
      let thumb = slider.parentElement!.parentElement!;
      let [, rightTrack] = [...thumb.parentElement!.children].filter(c => c !== thumb);

      fireEvent.touchStart(thumb, {changedTouches: [{identifier: 1, clientX: 50, pageX: 50}]});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);

      fireEvent.touchStart(rightTrack, {changedTouches: [{identifier: 2, clientX: 60, pageX: 60}]});
      fireEvent.touchMove(rightTrack, {changedTouches: [{identifier: 2, clientX: 70, pageX: 70}]});
      fireEvent.touchEnd(rightTrack, {changedTouches: [{identifier: 2, clientX: 70, pageX: 70}]});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);

      fireEvent.touchMove(thumb, {changedTouches: [{identifier: 1, clientX: 30, pageX: 30}]});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenLastCalledWith(30);

      fireEvent.touchEnd(thumb, {changedTouches: [{identifier: 1, clientX: 30, pageX: 30}]});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
