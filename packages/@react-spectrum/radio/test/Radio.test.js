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

import {act, pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import {Button} from '@react-spectrum/button';
import {Form} from '@react-spectrum/form';
import {Provider} from '@react-spectrum/provider';
import {Radio, RadioGroup} from '../';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

function renderRadioGroup(ComponentGroup, Component, groupProps, radioProps) {
  return render(
    <ComponentGroup aria-label="favorite pet" {...groupProps}>
      <Component {...radioProps[0]} value="dogs">Dogs</Component>
      <Component {...radioProps[1]} value="cats">Cats</Component>
      <Component {...radioProps[2]} value="dragons">Dragons</Component>
    </ComponentGroup>
  );
}

function renderRadioGroupNoLabel(ComponentGroup, Component, groupProps, radioProps) {
  return render(
    <ComponentGroup {...groupProps}>
      <Component {...radioProps[0]} value="dogs">Dogs</Component>
      <Component {...radioProps[1]} value="cats">Cats</Component>
      <Component {...radioProps[2]} value="dragons">Dragons</Component>
    </ComponentGroup>
  );
}

// Describes the tabIndex values of radio 1 (column 1), 2, and 3 as focus is moved forward or back.
// e.g. radio2Focused describes button 2 having tabindex=0 while all other buttons have -1
let expectedFocus = {
  radio1Focused: ['0', '-1', '-1'],
  radio2Focused: ['-1', '0', '-1'],
  radio3Focused: ['-1', '-1', '0']
};

// Returns the expected radio tab index configuration from expectedFocus in response to focus moving `forward` or `backward`
class RadioBehavior {
  constructor() {
    this.index = 0;
    this.radio = expectedFocus;
    this.forward = this.forward.bind(this);
    this.backward = this.backward.bind(this);
  }
  forward() {
    this.index = (this.index + 1) % 3;
    return this.current();
  }
  backward() {
    this.index = (this.index + 3 - 1) % 3;
    return this.current();
  }
  current() {
    return this.radio[`radio${this.index + 1}Focused`];
  }
  reset() {
    this.index = 0;
  }
}
let radioBehavior = new RadioBehavior();


function verifyResult(radios, values, index) {
  expect(radios).checkRadioIndex(values, index);
}

// Custom error message for button index equality check
expect.extend({
  checkRadioIndex(received, tabIndices, i) {
    let index = received.findIndex((htmlElement, i) => {
      const receivedValue = htmlElement.getAttribute('tabIndex');

      return receivedValue !== tabIndices[i];
    });

    if (index !== -1) {
      return {
        message: () => `expected radio index configuration "radio${i + 1}Focused": got (${received.map((radio) => radio.getAttribute('tabIndex'))}) but expected ${tabIndices}`,
        pass: false
      };
    } else {
      return {
        pass: true
      };
    }
  }
});

describe('Radios', function () {
  let onChangeSpy = jest.fn();
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  afterEach(() => {
    onChangeSpy.mockClear();
  });

  let tab = async () => await user.tab();
  let pressArrowRight = async () => await user.keyboard('{ArrowRight}');
  let pressArrowLeft = async () => await user.keyboard('{ArrowLeft}');
  let pressArrowUp = async () => await user.keyboard('{ArrowUp}');
  let pressArrowDown = async () => await user.keyboard('{ArrowDown}');

  it.each`
    Name         | ComponentGroup  | Component  | groupProps                 | radioProps
    ${'Radio'}   | ${RadioGroup}   | ${Radio}   | ${{onChange: onChangeSpy}} | ${[{}, {}, {}]}
  `('$Name handles defaults', async function ({Name, ComponentGroup, Component, groupProps, radioProps}) {
    let {getByRole, getAllByRole, getByLabelText} = renderRadioGroup(ComponentGroup, Component, groupProps, radioProps);

    let radioGroup = getByRole('radiogroup');
    let radios = getAllByRole('radio');
    expect(radioGroup).toBeTruthy();
    expect(radios.length).toBe(3);

    let groupName = radios[0].getAttribute('name');
    radios.forEach(radio => {
      expect(radio).toHaveAttribute('name', groupName);
    });

    expect(radios[0].value).toBe('dogs');
    expect(radios[1].value).toBe('cats');
    expect(radios[2].value).toBe('dragons');

    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(false);
    expect(radios[2].checked).toBe(false);

    let dogs = getByLabelText('Dogs');
    await user.click(dogs);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith('dogs');

    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
    expect(radios[2].checked).toBe(false);
  });

  it.each`
    Name         | ComponentGroup  | Component  | groupProps | radioProps
    ${'Radio'}   | ${RadioGroup}   | ${Radio}   | ${{}}      | ${[{}, {}, {}]}
  `('$Name renders without labels', function ({Name, ComponentGroup, Component, groupProps, radioProps}) {
    let {getByRole, getAllByRole} = render(
      <ComponentGroup aria-label="favorite pet" {...groupProps}>
        <Component {...radioProps[0]} value="dogs" aria-label="dogs" />
        <Component {...radioProps[1]} value="cats" aria-label="cats" />
        <Component {...radioProps[2]} value="dragons" aria-label="dragons" />
      </ComponentGroup>
    );

    let radioGroup = getByRole('radiogroup');
    let radios = getAllByRole('radio');
    expect(radioGroup).toBeTruthy();
    expect(radios.length).toBe(3);

    let groupName = radios[0].getAttribute('name');
    radios.forEach(radio => {
      expect(radio).toHaveAttribute('name', groupName);
    });
  });

  it.each`
    Name         | ComponentGroup  | Component  | groupProps              | radioProps
    ${'Radio'}   | ${RadioGroup}   | ${Radio}   | ${{name: 'customName'}} | ${[{}, {}, {}]}
  `('$Name can be given a group name', function ({ComponentGroup, Component, groupProps, radioProps}) {
    let {getAllByRole} = renderRadioGroup(ComponentGroup, Component, groupProps, radioProps);

    let radios = getAllByRole('radio');
    radios.forEach(radio => {
      expect(radio).toHaveAttribute('name', groupProps.name);
    });
  });

  it.each`
    Name         | ComponentGroup  | Component  | groupProps | radioProps
    ${'Radio'}   | ${RadioGroup}   | ${Radio}   | ${{}}      | ${[{}, {}, {}]}
  `('$Name can be disabled via the Provider', function ({ComponentGroup, Component, groupProps, radioProps}) {
    let {getByRole, getAllByRole} = render(
      <Provider theme={theme} isDisabled>
        <ComponentGroup aria-label="favorite pet" {...groupProps}>
          <Component {...radioProps[0]} value="dogs">Dogs</Component>
          <Component {...radioProps[1]} value="cats">Cats</Component>
          <Component {...radioProps[2]} value="dragons">Dragons</Component>
        </ComponentGroup>
      </Provider>
    );

    let radioGroup = getByRole('radiogroup');
    let radios = getAllByRole('radio');
    expect(radioGroup).toBeTruthy();
    expect(radios.length).toBe(3);
    expect(radios[0]).toHaveAttribute('disabled');
    expect(radios[1]).toHaveAttribute('disabled');
    expect(radios[2]).toHaveAttribute('disabled');
  });

  it.each`
    Name         | ComponentGroup  | Component  | groupProps                 | radioProps
    ${'Radio'}   | ${RadioGroup}   | ${Radio}   | ${{onChange: onChangeSpy}} | ${[{}, {isDisabled: true}, {}]}
  `('$Name can have a single disabled radio', async function ({ComponentGroup, Component, groupProps, radioProps}) {
    let {getByRole, getByLabelText, getAllByRole} = renderRadioGroup(ComponentGroup, Component, groupProps, radioProps);

    let radioGroup = getByRole('radiogroup');
    let radios = getAllByRole('radio');
    expect(radioGroup).toBeTruthy();
    expect(radios.length).toBe(3);
    expect(radios[0]).not.toHaveAttribute('disabled');
    expect(radios[1]).toHaveAttribute('disabled');
    expect(radios[2]).not.toHaveAttribute('disabled');

    // have to click label or it won't work
    let dogs = getByLabelText('Dogs');
    let cats = getByLabelText('Cats');
    await user.click(cats);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(false);
    expect(radios[2].checked).toBe(false);
    await user.click(dogs);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith('dogs');
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
    expect(radios[2].checked).toBe(false);
  });

  it.each`
    Name         | ComponentGroup  | Component  | groupProps                                   | radioProps
    ${'Radio'}   | ${RadioGroup}   | ${Radio}   | ${{isReadOnly: true, onChange: onChangeSpy}} | ${[{}, {}, {}]}
  `('$Name can be readonly', async function ({ComponentGroup, Component, groupProps, radioProps}) {
    let {getByRole, getAllByRole, getByLabelText} = renderRadioGroup(ComponentGroup, Component, groupProps, radioProps);

    let radioGroup = getByRole('radiogroup');
    let radios = getAllByRole('radio');
    expect(radioGroup).toBeTruthy();
    expect(radioGroup).toHaveAttribute('aria-readonly', 'true');
    expect(radios.length).toBe(3);
    for (let radio of radios) {
      expect(radio).not.toHaveAttribute('aria-readonly');
    }

    let cats = getByLabelText('Cats');
    await user.click(cats);
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it.each`
    Name         | ComponentGroup  | Component  | groupProps                 | radioProps
    ${'Radio'}   | ${RadioGroup}   | ${Radio}   | ${{onChange: onChangeSpy}} | ${[{isReadOnly: true}, {}, {}]}
  `('$Name individual radios cannot be readonly', async function ({ComponentGroup, Component, groupProps, radioProps}) {
    let {getByRole, getAllByRole, getByLabelText} = renderRadioGroup(ComponentGroup, Component, groupProps, radioProps);

    let radioGroup = getByRole('radiogroup');
    let radios = getAllByRole('radio');
    expect(radioGroup).toBeTruthy();
    expect(radios.length).toBe(3);
    expect(radios[0]).not.toHaveAttribute('readonly');
    expect(radios[1]).not.toHaveAttribute('readonly');
    expect(radios[2]).not.toHaveAttribute('readonly');

    let dogs = getByLabelText('Dogs');
    await user.click(dogs);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
  });

  it.each`
    Name         | ComponentGroup  | Component  | groupProps                                                  | radioProps
    ${'Radio'}   | ${RadioGroup}   | ${Radio}   | ${{defaultValue: 'dragons', onChange: onChangeSpy}}         | ${[{}, {}, {}]}
  `('$Name can have a default value', async function ({ComponentGroup, Component, groupProps, radioProps}) {
    let {getByRole, getByLabelText, getAllByRole} = renderRadioGroup(ComponentGroup, Component, groupProps, radioProps);

    let radioGroup = getByRole('radiogroup');
    let radios = getAllByRole('radio');
    expect(radioGroup).toBeTruthy();
    expect(radios.length).toBe(3);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(false);
    expect(radios[2].checked).toBe(true);

    // have to click label or it won't work
    let dogs = getByLabelText('Dogs');
    await user.click(dogs);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith('dogs');
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
    expect(radios[2].checked).toBe(false);
  });

  it.each`
    Name         | ComponentGroup  | Component  | groupProps                                           | radioProps
    ${'Radio'}   | ${RadioGroup}   | ${Radio}   | ${{value: 'dragons', onChange: onChangeSpy}}         | ${[{}, {}, {}]}
  `('$Name can be controlled', async function ({ComponentGroup, Component, groupProps, radioProps}) {
    let {getByRole, getByLabelText, getAllByRole} = renderRadioGroup(ComponentGroup, Component, groupProps, radioProps);

    let radioGroup = getByRole('radiogroup');
    let radios = getAllByRole('radio');
    expect(radioGroup).toBeTruthy();
    expect(radios.length).toBe(3);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(false);
    expect(radios[2].checked).toBe(true);

    let dogs = getByLabelText('Dogs');
    await user.click(dogs);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith('dogs');
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(false);
    expect(radios[2].checked).toBe(true);
  });

  // don't need to test keyboard interactions, the above tests ensure that all the right things are in place
  // for the browser to handle it for us

  it('v3 RadioGroup supports labeling', () => {
    let {getByRole} = renderRadioGroupNoLabel(RadioGroup, Radio, {label: 'Favorite Pet'}, {});
    let radioGroup = getByRole('radiogroup');

    let labelId = radioGroup.getAttribute('aria-labelledby');
    expect(labelId).toBeDefined();
    let label = document.getElementById(labelId);
    expect(label).toHaveTextContent('Favorite Pet');
  });

  it('v3 RadioGroup supports aria-label', () => {
    let {getByRole} = renderRadioGroup(RadioGroup, Radio, {'aria-label': 'Favorite Pet'}, {});
    let radioGroup = getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-label', 'Favorite Pet');
  });

  it('v3 RadioGroup supports custom props', () => {
    let {getByRole} = renderRadioGroup(RadioGroup, Radio, {'data-testid': 'test'}, {});
    let radioGroup = getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('data-testid', 'test');
  });

  it('v3 Radio supports aria-label', () => {
    let {getAllByRole} = renderRadioGroup(RadioGroup, Radio, {label: 'Favorite Pet'}, [{'aria-label': 'Favorite Pet'}]);
    let radios = getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('aria-label', 'Favorite Pet');
  });

  it('v3 Radios supports custom props', () => {
    let {getAllByRole} = renderRadioGroup(RadioGroup, Radio, {label: 'Favorite Pet'}, [{'data-testid': 'test'}]);
    let radios = getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('data-testid', 'test');
  });

  it('v3 RadioGroup sets aria-orientation by default', () => {
    let {getByRole} = renderRadioGroup(RadioGroup, Radio, {label: 'Favorite Pet'}, []);
    let radioGroup = getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('v3 RadioGroup sets aria-orientation based on the orientation prop', () => {
    let {getByRole} = renderRadioGroup(RadioGroup, Radio, {label: 'Favorite Pet', orientation: 'horizontal'}, []);
    let radioGroup = getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('v3 RadioGroup sets aria-invalid when isInvalid', () => {
    let {getByRole} = renderRadioGroup(RadioGroup, Radio, {label: 'Favorite Pet', isInvalid: true}, []);
    let radioGroup = getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-invalid', 'true');
  });

  it('v3 RadioGroup passes through aria-errormessage', () => {
    let {getByRole} = renderRadioGroup(RadioGroup, Radio, {label: 'Favorite Pet', isInvalid: true, 'aria-errormessage': 'test'}, []);
    let radioGroup = getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-invalid', 'true');
    expect(radioGroup).toHaveAttribute('aria-errormessage', 'test');
  });

  it('v3 RadioGroup sets aria-required when isRequired is true', () => {
    let {getByRole, getAllByRole} = renderRadioGroup(RadioGroup, Radio, {label: 'Favorite Pet', isRequired: true}, []);
    let radioGroup = getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-required', 'true');

    let radios = getAllByRole('radio');
    for (let radio of radios) {
      expect(radio).not.toHaveAttribute('aria-required');
    }
  });

  it('v3 RadioGroup sets aria-disabled when isDisabled is true', () => {
    let {getByRole} = renderRadioGroup(RadioGroup, Radio, {label: 'Favorite Pet', isDisabled: true}, []);
    let radioGroup = getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-disabled', 'true');
  });

  it('should support help text description', function () {
    let {getByRole} = renderRadioGroup(RadioGroup, Radio, {label: 'Favorite Pet', description: 'Help text'}, []);

    let group = getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-describedby');

    let description = group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
    expect(description).toBe('Help text');
  });

  it('should support error message', function () {
    let {getByRole} = renderRadioGroup(RadioGroup, Radio, {label: 'Favorite Pet', errorMessage: 'Error message', isInvalid: true}, []);

    let group = getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-describedby');

    let description = document.getElementById(group.getAttribute('aria-describedby'));
    expect(description).toHaveTextContent('Error message');
  });

  it('supports form reset', async () => {
    function Test() {
      let [value, setValue] = React.useState('dogs');
      return (
        <Provider theme={theme}>
          <form>
            <RadioGroup name="pet" label="Favorite Pet" value={value} onChange={setValue}>
              <Radio value="dogs">Dogs</Radio>
              <Radio value="cats">Cats</Radio>
              <Radio value="dragons">Dragons</Radio>
            </RadioGroup>
            <input type="reset" data-testid="reset" />
          </form>
        </Provider>
      );
    }

    let {getAllByRole, getByTestId} = render(<Test />);
    let radios = getAllByRole('radio');

    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
    expect(radios[2]).not.toBeChecked();
    await user.click(radios[1]);
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeChecked();
    expect(radios[2]).not.toBeChecked();

    let button = getByTestId('reset');
    await user.click(button);
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
    expect(radios[2]).not.toBeChecked();
  });

  describe('Radio group supports roving tabIndex ', function () {
    afterEach(() => {
      radioBehavior.reset();
    });


    it('does not tab through individual radios', async () => {
      // this test gives a false sense of security, it doesn't catch the problem
      // where all keydown events were being stopped in the radio group
      let {getByRole, getAllByRole} = render(
        <Provider theme={theme} locale="en-US">
          <Button variant="primary" aria-label="extra button" />
          <RadioGroup aria-label="favorite pet" orientation="horizontal">
            <Radio value="dogs">Dogs</Radio>
            <Radio value="cats">Cats</Radio>
            <Radio value="dragons">Dragons</Radio>
          </RadioGroup>
        </Provider>
      );
      let radios = getAllByRole('radio');
      let button = getByRole('button');

      // 0. body/nothing is focused

      // 1. tab once to focus button before radiogroup
      await user.tab();
      expect(document.activeElement).toBe(button);
      expect(document.activeElement).not.toBe(radios[0]);
      expect(document.activeElement).not.toBe(radios[1]);
      expect(document.activeElement).not.toBe(radios[2]);

      // 2. tab once again to focus radiogroup (= first radiobutton)
      await user.tab();
      expect(document.activeElement).not.toBe(button);
      expect(document.activeElement).toBe(radios[0]);
      expect(document.activeElement).not.toBe(radios[1]);
      expect(document.activeElement).not.toBe(radios[2]);

      // 3. tab once again to focus the body, and again to wrap back around to the button
      await user.tab();
      await user.tab();
      expect(document.activeElement).toBe(button);
      expect(document.activeElement).not.toBe(radios[0]);
      expect(document.activeElement).not.toBe(radios[1]);
      expect(document.activeElement).not.toBe(radios[2]);
    });

    it('RadioGroup default roving tabIndex', async () => {
      let {getAllByRole} = renderRadioGroup(RadioGroup, Radio, {}, {});
      let radios = getAllByRole('radio');
      expect(radios[0]).toHaveAttribute('tabIndex', '0');
      expect(radios[1]).toHaveAttribute('tabIndex', '0');
      expect(radios[2]).toHaveAttribute('tabIndex', '0');

      act(() => {radios[0].focus();});
      expect(document.activeElement).toBe(radios[0]);

      await user.click(radios[1]);
      expect(document.activeElement).toBe(radios[1]);
      expect(radios[0]).toHaveAttribute('tabIndex', '-1');
      expect(radios[1]).toHaveAttribute('tabIndex', '0');
      expect(radios[2]).toHaveAttribute('tabIndex', '-1');
    });

    describe('roving tab timers', () => {
      beforeAll(() => {
        jest.useFakeTimers();
      });
      afterAll(() => {
        jest.useRealTimers();
      });
      it('RadioGroup roving tabIndex for controlled radios', async () => {
        function ControlledRadioGroup(props) {
          let [value, setValue] = React.useState(null);
          return (
            <>
              <Button variant="primary" onPress={() => setValue('cats')}>
                Make it "Two"
              </Button>
              <RadioGroup aria-label="favorite pet" value={value} onChange={setValue}>
                <Radio value="dogs">Dogs</Radio>
                <Radio value="cats">Cats</Radio>
                <Radio value="dragons">Dragons</Radio>
                <Radio value="unicorns">Unicorns</Radio>
              </RadioGroup>
              <Button variant="primary" onPress={() => setValue('dragons')}>
                Make it "Three"
              </Button>
            </>
          );
        }

        let {getAllByRole} = render(
          <ControlledRadioGroup />
        );
        let radios = getAllByRole('radio');
        let buttons = getAllByRole('button');
        expect(radios[0]).toHaveAttribute('tabIndex', '0');
        expect(radios[1]).toHaveAttribute('tabIndex', '0');
        expect(radios[2]).toHaveAttribute('tabIndex', '0');
        expect(radios[3]).toHaveAttribute('tabIndex', '0');

        await user.tab();
        act(() => {jest.runAllTimers();});
        expect(document.activeElement).toBe(buttons[0]);
        await user.keyboard('{Enter}');
        await user.tab();
        act(() => {jest.runAllTimers();});
        expect(document.activeElement).toBe(radios[1]);
        await user.tab();
        act(() => {jest.runAllTimers();});
        expect(document.activeElement).toBe(buttons[1]);
        await user.keyboard('{Enter}');

        expect(radios[0]).toHaveAttribute('tabIndex', '-1');
        expect(radios[1]).toHaveAttribute('tabIndex', '-1');
        expect(radios[2]).toHaveAttribute('tabIndex', '0');
        expect(radios[3]).toHaveAttribute('tabIndex', '-1');
      });

      it('RadioGroup roving tabIndex for autoFocus', async () => {
        let {getAllByRole} = renderRadioGroup(RadioGroup, Radio, {}, [{}, {autoFocus: true}, {}]);
        let radios = getAllByRole('radio');
        act(() => {jest.runAllTimers();});
        expect(radios[0]).toHaveAttribute('tabIndex', '-1');
        expect(radios[1]).toHaveAttribute('tabIndex', '0');
        expect(radios[2]).toHaveAttribute('tabIndex', '-1');
      });
    });

    it.each`
      Name                                                  | props                                           | orders
      ${'(left/right arrows, ltr + horizontal) RadioGroup'} | ${{locale: 'de-DE', orientation: 'horizontal'}} | ${[{action: tab, result: () => expectedFocus.radio1Focused}, {action: pressArrowRight, result: radioBehavior.forward}, {action: pressArrowLeft, result: radioBehavior.backward}, {action: pressArrowLeft, result: radioBehavior.backward}]}
      ${'(left/right arrows, rtl + horizontal) RadioGroup'} | ${{locale: 'ar-AE', orientation: 'horizontal'}} | ${[{action: tab, result: () => expectedFocus.radio1Focused}, {action: pressArrowRight, result: radioBehavior.backward}, {action: pressArrowLeft, result: radioBehavior.forward}, {action: pressArrowLeft, result: radioBehavior.forward}]}
      ${'(up/down arrows, ltr + horizontal) RadioGroup'}    | ${{locale: 'de-DE', orientation: 'horizontal'}} | ${[{action: tab, result: () => expectedFocus.radio1Focused}, {action: pressArrowDown, result: radioBehavior.forward}, {action: pressArrowUp, result: radioBehavior.backward}, {action: pressArrowUp, result: radioBehavior.backward}]}
      ${'(up/down arrows, rtl + horizontal) RadioGroup'}    | ${{locale: 'ar-AE', orientation: 'horizontal'}} | ${[{action: tab, result: () => expectedFocus.radio1Focused}, {action: pressArrowDown, result: radioBehavior.forward}, {action: pressArrowUp, result: radioBehavior.backward}, {action: pressArrowUp, result: radioBehavior.backward}]}
      ${'(left/right arrows, ltr + vertical) RadioGroup'}   | ${{locale: 'de-DE'}}                            | ${[{action: tab, result: () => expectedFocus.radio1Focused}, {action: pressArrowRight, result: radioBehavior.forward}, {action: pressArrowLeft, result: radioBehavior.backward}, {action: pressArrowLeft, result: radioBehavior.backward}]}
      ${'(left/right arrows, rtl + vertical) RadioGroup'}   | ${{locale: 'ar-AE'}}                            | ${[{action: tab, result: () => expectedFocus.radio1Focused}, {action: pressArrowRight, result: radioBehavior.forward}, {action: pressArrowLeft, result: radioBehavior.backward}, {action: pressArrowLeft, result: radioBehavior.backward}]}
      ${'(up/down arrows, ltr + vertical) RadioGroup'}      | ${{locale: 'de-DE'}}                            | ${[{action: tab, result: () => expectedFocus.radio1Focused}, {action: pressArrowDown, result: radioBehavior.forward}, {action: pressArrowUp, result: radioBehavior.backward}, {action: pressArrowUp, result: radioBehavior.backward}]}
      ${'(up/down arrows, rtl + vertical) RadioGroup'}      | ${{locale: 'ar-AE'}}                            | ${[{action: tab, result: () => expectedFocus.radio1Focused}, {action: pressArrowDown, result: radioBehavior.forward}, {action: pressArrowUp, result: radioBehavior.backward}, {action: pressArrowUp, result: radioBehavior.backward}]}
    `('$Name default keyboard navigation with wrapping', async ({props, orders}) => {
      let {getAllByRole} = render(
        <RadioGroup aria-label="favorite pet" orientation={props.orientation}>
          <Radio value="dogs">Dogs</Radio>
          <Radio value="cats">Cats</Radio>
          <Radio value="dragons">Dragons</Radio>
        </RadioGroup>
      , undefined, {locale: props.locale});

      let radios = getAllByRole('radio');

      let index = 0;
      for (let {action, result} of orders) {
        await action();
        verifyResult(radios, result(), index);
        index++;
      }
    });

    let und = null;
    it.each`
      Name                     | props                | disabledKeys  | orders
      ${'middle disabled'}     | ${{locale: 'de-DE'}} | ${[1]}        | ${[{action: tab, result: () => ['0', und, '-1']}, {action: pressArrowRight, result: () => ['-1', und, '0']}, {action: pressArrowRight, result: () => ['0', und, '-1']}, {action: pressArrowLeft, result: () => ['-1', und, '0']}, {action: pressArrowLeft, result: () => ['0', und, '-1']}]}
      ${'first disabled'}      | ${{locale: 'de-DE'}} | ${[0]}        | ${[{action: tab, result: () => [und, '0', '-1']}, {action: pressArrowRight, result: () => [und, '-1', '0']}, {action: pressArrowRight, result: () => [und, '0', '-1']}, {action: pressArrowLeft, result: () => [und, '-1', '0']}, {action: pressArrowLeft, result: () => [und, '0', '-1']}]}
      ${'last disabled'}       | ${{locale: 'de-DE'}} | ${[2]}        | ${[{action: tab, result: () => ['0', '-1', und]}, {action: pressArrowRight, result: () => ['-1', '0', und]}, {action: pressArrowRight, result: () => ['0', '-1', und]}, {action: pressArrowLeft, result: () => ['-1', '0', und]}, {action: pressArrowLeft, result: () => ['0', '-1', und]}]}
      ${'1&2 disabled'}        | ${{locale: 'de-DE'}} | ${[0, 1]}     | ${[{action: tab, result: () => [und, und, '0']}, {action: pressArrowRight, result: () => [und, und, '0']}, {action: pressArrowRight, result: () => [und, und, '0']}, {action: pressArrowLeft, result: () => [und, und, '0']}, {action: pressArrowLeft, result: () => [und, und, '0']}]}
      ${'rtl middle disabled'} | ${{locale: 'ar-AE'}} | ${[1]}        | ${[{action: tab, result: () => ['0', und, '-1']}, {action: pressArrowRight, result: () => ['-1', und, '0']}, {action: pressArrowRight, result: () => ['0', und, '-1']}, {action: pressArrowLeft, result: () => ['-1', und, '0']}, {action: pressArrowLeft, result: () => ['0', und, '-1']}]}
      ${'rtl first disabled'}  | ${{locale: 'ar-AE'}} | ${[0]}        | ${[{action: tab, result: () => [und, '0', '-1']}, {action: pressArrowRight, result: () => [und, '-1', '0']}, {action: pressArrowRight, result: () => [und, '0', '-1']}, {action: pressArrowLeft, result: () => [und, '-1', '0']}, {action: pressArrowLeft, result: () => [und, '0', '-1']}]}
      ${'rtl last disabled'}   | ${{locale: 'ar-AE'}} | ${[2]}        | ${[{action: tab, result: () => ['0', '-1', und]}, {action: pressArrowRight, result: () => ['-1', '0', und]}, {action: pressArrowRight, result: () => ['0', '-1', und]}, {action: pressArrowLeft, result: () => ['-1', '0', und]}, {action: pressArrowLeft, result: () => ['0', '-1', und]}]}
      ${'rtl 1&2 disabled'}    | ${{locale: 'ar-AE'}} | ${[0, 1]}     | ${[{action: tab, result: () => [und, und, '0']}, {action: pressArrowRight, result: () => [und, und, '0']}, {action: pressArrowRight, result: () => [und, und, '0']}, {action: pressArrowLeft, result: () => [und, und, '0']}, {action: pressArrowLeft, result: () => [und, und, '0']}]}
    `('$Name skips disabled radios', async function ({Name, props, disabledKeys, orders}) {
      let tree = render(
        <RadioGroup aria-label="favorite pet" orientation="horizontal">
          <Radio value="dogs" isDisabled={disabledKeys.includes(0)}>Dogs</Radio>
          <Radio value="cats" isDisabled={disabledKeys.includes(1)}>Cats</Radio>
          <Radio value="dragons" isDisabled={disabledKeys.includes(2)}>Dragons</Radio>
        </RadioGroup>
      , undefined, {locale: props.locale});

      let radios = tree.getAllByRole('radio');

      let index = 0;
      for (let {action, result} of orders) {
        await action();
        verifyResult(radios, result(), index);
        index++;
      }
    });

    it.each`
      Name                         | props                | disabledKeys | orders
      ${'middle two disabled'}     | ${{locale: 'de-DE'}} | ${[1, 2]}    | ${[{action: tab, result: () => ['0', und, und, '-1']}, {action: pressArrowRight, result: () => ['-1', und, und, '0']}, {action: pressArrowRight, result: () => ['0', und, und, '-1']}, {action: pressArrowLeft, result: () => ['-1', und, und, '0']}, {action: pressArrowLeft, result: () => ['0', und, und, '-1']}]}
      ${'rtl middle two disabled'} | ${{locale: 'de-DE'}} | ${[1, 2]}    | ${[{action: tab, result: () => ['0', und, und, '-1']}, {action: pressArrowRight, result: () => ['-1', und, und, '0']}, {action: pressArrowRight, result: () => ['0', und, und, '-1']}, {action: pressArrowLeft, result: () => ['-1', und, und, '0']}, {action: pressArrowLeft, result: () => ['0', und, und, '-1']}]}
    `('$Name skips multiple disabled radios', async function ({Name, props, disabledKeys, orders}) {
      let tree = render(
        <RadioGroup aria-label="favorite pet" orientation="horizontal">
          <Radio value="dogs" isDisabled={disabledKeys.includes(0)}>Dogs</Radio>
          <Radio value="cats" isDisabled={disabledKeys.includes(1)}>Cats</Radio>
          <Radio value="dragons" isDisabled={disabledKeys.includes(2)}>Dragons</Radio>
          <Radio value="unicorns" isDisabled={disabledKeys.includes(3)}>Unicorns</Radio>
        </RadioGroup>
      , undefined, {locale: props.locale});

      let radios = tree.getAllByRole('radio');

      let index = 0;
      for (let {action, result} of orders) {
        await action();
        verifyResult(radios, result(), index);
        index++;
      }
    });
  });

  describe('validation', () => {
    describe('validationBehavior=native', () => {
      it('supports isRequired', async () => {
        let {getAllByRole, getByRole, getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <RadioGroup aria-label="favorite pet" isRequired validationBehavior="native">
                <Radio value="dogs">Dogs</Radio>
                <Radio value="cats">Cats</Radio>
                <Radio value="dragons">Dragons</Radio>
              </RadioGroup>
            </Form>
          </Provider>
        );

        let group = getByRole('radiogroup');
        expect(group).not.toHaveAttribute('aria-describedby');

        let radios = getAllByRole('radio');
        for (let input of radios) {
          expect(input).toHaveAttribute('required');
          expect(input).not.toHaveAttribute('aria-required');
          expect(input.validity.valid).toBe(false);
        }

        act(() => {getByTestId('form').checkValidity();});

        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('Constraints not satisfied');
        expect(document.activeElement).toBe(radios[0]);

        await user.click(radios[0]);
        for (let input of radios) {
          expect(input.validity.valid).toBe(true);
        }

        expect(group).not.toHaveAttribute('aria-describedby');
      });

      it('updates validation state with the keyboard', async () => {
        let {getAllByRole, getByRole, getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <RadioGroup aria-label="favorite pet" isRequired validationBehavior="native">
                <Radio value="dogs">Dogs</Radio>
                <Radio value="cats">Cats</Radio>
                <Radio value="dragons">Dragons</Radio>
              </RadioGroup>
            </Form>
          </Provider>
        );

        let group = getByRole('radiogroup');
        expect(group).not.toHaveAttribute('aria-describedby');

        let radios = getAllByRole('radio');
        for (let input of radios) {
          expect(input).toHaveAttribute('required');
          expect(input).not.toHaveAttribute('aria-required');
          expect(input.validity.valid).toBe(false);
        }

        act(() => {getByTestId('form').checkValidity();});

        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('Constraints not satisfied');
        expect(document.activeElement).toBe(radios[0]);

        await user.keyboard('[ArrowDown]');
        for (let input of radios) {
          expect(input.validity.valid).toBe(true);
        }

        expect(group).not.toHaveAttribute('aria-describedby');
      });

      it('supports validate function', async () => {
        let {getAllByRole, getByRole, getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <RadioGroup aria-label="favorite pet" defaultValue="dragons" validationBehavior="native" validate={v => v === 'dragons' ? 'Too scary' : null}>
                <Radio value="dogs">Dogs</Radio>
                <Radio value="cats">Cats</Radio>
                <Radio value="dragons">Dragons</Radio>
              </RadioGroup>
            </Form>
          </Provider>
        );

        let group = getByRole('radiogroup');
        expect(group).not.toHaveAttribute('aria-describedby');

        let radios = getAllByRole('radio');
        for (let input of radios) {
          expect(input).not.toHaveAttribute('required');
          expect(input).not.toHaveAttribute('aria-required');
          expect(input.validity.valid).toBe(false);
        }

        act(() => {getByTestId('form').checkValidity();});

        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent(['Too scary']);
        expect(document.activeElement).toBe(radios[0]);

        await user.click(radios[0]);
        expect(group).not.toHaveAttribute('aria-describedby');
        for (let input of radios) {
          expect(input.validity.valid).toBe(true);
        }
      });

      it('supports server validation', async () => {
        function Test() {
          let [serverErrors, setServerErrors] = React.useState({});
          let onSubmit = e => {
            e.preventDefault();
            setServerErrors({
              pet: 'You must choose a pet.'
            });
          };

          return (
            <Provider theme={theme}>
              <Form onSubmit={onSubmit} validationErrors={serverErrors}>
                <RadioGroup aria-label="favorite pet" name="pet" validationBehavior="native">
                  <Radio value="dogs">Dogs</Radio>
                  <Radio value="cats">Cats</Radio>
                  <Radio value="dragons">Dragons</Radio>
                </RadioGroup>
                <Button type="submit">Submit</Button>
              </Form>
            </Provider>
          );
        }

        let {getAllByRole, getByRole} = render(<Test />);

        let group = getByRole('radiogroup');
        expect(group).not.toHaveAttribute('aria-describedby');

        await user.click(getByRole('button'));

        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('You must choose a pet.');

        let radios = getAllByRole('radio');
        for (let input of radios) {
          expect(input.validity.valid).toBe(false);
        }

        await user.click(radios[0]);
        expect(group).not.toHaveAttribute('aria-describedby');
        for (let input of radios) {
          expect(input.validity.valid).toBe(true);
        }
      });

      it('supports customizing native error messages', async () => {
        let {getByRole, getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <RadioGroup aria-label="favorite pet" name="pet" isRequired validationBehavior="native" errorMessage={e => e.validationDetails.valueMissing ? 'Please select a pet' : null}>
                <Radio value="dogs">Dogs</Radio>
                <Radio value="cats">Cats</Radio>
                <Radio value="dragons">Dragons</Radio>
              </RadioGroup>
            </Form>
          </Provider>
        );

        let group = getByRole('radiogroup');
        expect(group).not.toHaveAttribute('aria-describedby');

        act(() => {getByTestId('form').checkValidity();});
        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('Please select a pet');
      });
    });

    describe('validationBehavior=aria', () => {
      it('supports validate function', async () => {
        let {getAllByRole, getByRole} = render(
          <Provider theme={theme}>
            <RadioGroup aria-label="favorite pet" defaultValue="dragons" validate={v => v === 'dragons' ? 'Too scary' : null}>
              <Radio value="dogs">Dogs</Radio>
              <Radio value="cats">Cats</Radio>
              <Radio value="dragons">Dragons</Radio>
            </RadioGroup>
          </Provider>
        );

        let group = getByRole('radiogroup');
        expect(group).toHaveAttribute('aria-describedby');
        expect(group).toHaveAttribute('aria-invalid', 'true');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('Too scary');

        let radios = getAllByRole('radio');
        for (let input of radios) {
          expect(input.validity.valid).toBe(true);
        }

        await user.click(radios[0]);
        expect(group).not.toHaveAttribute('aria-describedby');
        expect(group).not.toHaveAttribute('aria-invalid');
      });

      it('supports server validation', async () => {
        let {getAllByRole, getByRole} = render(
          <Provider theme={theme}>
            <Form validationErrors={{pet: 'You must choose a pet'}}>
              <RadioGroup aria-label="favorite pet" name="pet">
                <Radio value="dogs">Dogs</Radio>
                <Radio value="cats">Cats</Radio>
                <Radio value="dragons">Dragons</Radio>
              </RadioGroup>
            </Form>
          </Provider>
        );

        let group = getByRole('radiogroup');
        expect(group).toHaveAttribute('aria-describedby');
        expect(group).toHaveAttribute('aria-invalid', 'true');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('You must choose a pet');

        let radios = getAllByRole('radio');

        await user.click(radios[0]);
        expect(group).not.toHaveAttribute('aria-describedby');
        expect(group).not.toHaveAttribute('aria-invalid');
      });
    });
  });
});
