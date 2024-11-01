/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, fireEvent, pointerMap, render, within} from '@react-spectrum/test-utils-internal';
import {Button, Dialog, DialogTrigger, FieldError, Label, Modal, Radio, RadioContext, RadioGroup, RadioGroupContext, Text} from '../';
import React from 'react';
import userEvent from '@testing-library/user-event';

let TestRadioGroup = ({groupProps, radioProps}) => (
  <RadioGroup {...groupProps}>
    <Label>Test</Label>
    <Radio {...radioProps} value="a">A</Radio>
    <Radio {...radioProps} value="b">B</Radio>
    <Radio {...radioProps} value="c">C</Radio>
  </RadioGroup>
);

let renderGroup = (groupProps, radioProps) => render(<TestRadioGroup {...{groupProps, radioProps}} />);

describe('RadioGroup', () => {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  it('should render a radio group with default classes', () => {
    let {getByRole, getAllByRole} = renderGroup();
    let group = getByRole('radiogroup');
    expect(group).toHaveAttribute('class', 'react-aria-RadioGroup');
    expect(group).toHaveAttribute('aria-labelledby');
    expect(document.getElementById(group.getAttribute('aria-labelledby'))).toHaveTextContent('Test');

    let radios = getAllByRole('radio');
    for (let radio of radios) {
      let label = radio.closest('label');
      expect(label).toHaveAttribute('class', 'react-aria-Radio');
    }
  });

  it('should render a radio group with custom classes', () => {
    let {getByRole, getAllByRole} = renderGroup({className: 'group'}, {className: 'radio'});
    let group = getByRole('radiogroup');
    expect(group).toHaveAttribute('class', 'group');
    let radios = getAllByRole('radio');
    for (let radio of radios) {
      let label = radio.closest('label');
      expect(label).toHaveAttribute('class', 'radio');
    }
  });

  it('should support DOM props', () => {
    let {getByRole, getAllByRole} = renderGroup({'data-foo': 'bar'}, {'data-test': 'test'});
    let group = getByRole('radiogroup');
    expect(group).toHaveAttribute('data-foo', 'bar');
    for (let radio of getAllByRole('radio')) {
      expect(radio.closest('label')).toHaveAttribute('data-test', 'test');
    }
  });

  it('should support render props', () => {
    let {getByRole} = render(
      <RadioGroup isRequired>
        {({isRequired}) => (
          <>
            <Label data-required={isRequired}>Test</Label>
            <Radio value="a">A</Radio>
            <Radio value="b">B</Radio>
            <Radio value="c">C</Radio>
          </>
        )}
      </RadioGroup>
    );
    let group = getByRole('radiogroup');
    let label = document.getElementById(group.getAttribute('aria-labelledby'));
    expect(label).toHaveAttribute('data-required', 'true');
  });

  it('should support Radio render props', async () => {
    let {getAllByRole} = render(
      <RadioGroup defaultValue="a">
        <Label>Test</Label>
        <Radio value="a">
          {({isSelected}) => isSelected ? 'A (selected)' : 'A'}
        </Radio>
        <Radio value="b">
          {({isSelected}) => isSelected ? 'B (selected)' : 'B'}
        </Radio>
      </RadioGroup>
    );
    let radios = getAllByRole('radio');
    expect(radios[0].closest('label')).toHaveTextContent('A (selected)');
    expect(radios[1].closest('label')).toHaveTextContent('B');
    await user.click(radios[1]);
    expect(radios[0].closest('label')).toHaveTextContent('A');
    expect(radios[1].closest('label')).toHaveTextContent('B (selected)');
  });

  it('should support slot', () => {
    let {getByRole, getAllByText} = render(
      <RadioGroupContext.Provider
        value={{slots: {test: {'aria-label': 'test'}}}}>
        <RadioContext.Provider value={{'data-test': 'test'}}>
          <TestRadioGroup groupProps={{slot: 'test'}} />
        </RadioContext.Provider>
      </RadioGroupContext.Provider>
    );

    let group = getByRole('radiogroup');
    expect(group).toHaveAttribute('slot', 'test');
    expect(group).toHaveAttribute('aria-label', 'test');

    // label elements were not being found with getAllByRole('label')
    let labels = getAllByText(/A|B|C/i);
    for (let label of labels) {
      expect(label).toHaveAttribute('data-test', 'test');
    }
  });

  it('should support hover', async () => {
    let hoverStartSpy = jest.fn();
    let hoverChangeSpy = jest.fn();
    let hoverEndSpy = jest.fn();
    let {getAllByRole} = renderGroup({}, {className: ({isHovered}) => isHovered ? 'hover' : '', onHoverStart: hoverStartSpy, onHoverChange: hoverChangeSpy, onHoverEnd: hoverEndSpy});
    let radio = getAllByRole('radio')[0].closest('label');

    expect(radio).not.toHaveAttribute('data-hovered');
    expect(radio).not.toHaveClass('hover');

    await user.hover(radio);
    expect(radio).toHaveAttribute('data-hovered', 'true');
    expect(radio).toHaveClass('hover');
    expect(hoverStartSpy).toHaveBeenCalledTimes(1);
    expect(hoverChangeSpy).toHaveBeenCalledTimes(1);

    await user.unhover(radio);
    expect(radio).not.toHaveAttribute('data-hovered');
    expect(radio).not.toHaveClass('hover');
    expect(hoverEndSpy).toHaveBeenCalledTimes(1);
    expect(hoverChangeSpy).toHaveBeenCalledTimes(2);
  });

  it('should support focus ring', async () => {
    let {getAllByRole} = renderGroup({}, {className: ({isFocusVisible}) => isFocusVisible ? 'focus' : ''});
    let radio = getAllByRole('radio')[0];
    let label = radio.closest('label');

    expect(label).not.toHaveAttribute('data-focus-visible');
    expect(label).not.toHaveClass('focus');

    await user.tab();
    expect(document.activeElement).toBe(radio);
    expect(label).toHaveAttribute('data-focus-visible', 'true');
    expect(label).toHaveClass('focus');

    await user.tab();
    expect(label).not.toHaveAttribute('data-focus-visible');
    expect(label).not.toHaveClass('focus');
  });

  it('should support press state', () => {
    let {getAllByRole} = renderGroup({}, {className: ({isPressed}) => isPressed ? 'pressed' : ''});
    let radio = getAllByRole('radio')[0].closest('label');

    expect(radio).not.toHaveAttribute('data-pressed');
    expect(radio).not.toHaveClass('pressed');

    fireEvent.mouseDown(radio);
    expect(radio).toHaveAttribute('data-pressed', 'true');
    expect(radio).toHaveClass('pressed');

    fireEvent.mouseUp(radio);
    expect(radio).not.toHaveAttribute('data-pressed');
    expect(radio).not.toHaveClass('pressed');
  });

  it('should support disabled state on radio', () => {
    let {getAllByRole} = renderGroup({}, {isDisabled: true, className: ({isDisabled}) => isDisabled ? 'disabled' : ''});
    let radio = getAllByRole('radio')[0];
    let label = radio.closest('label');

    expect(radio).toBeDisabled();
    expect(label).toHaveAttribute('data-disabled', 'true');
    expect(label).toHaveClass('disabled');
  });

  it('should support disabled state on group', () => {
    let className = ({isDisabled}) => isDisabled ? 'disabled' : '';
    let {getByRole, getAllByRole} = renderGroup({isDisabled: true, className}, {className});
    let group = getByRole('radiogroup');
    let radio = getAllByRole('radio')[0];
    let label = radio.closest('label');

    expect(group).toHaveAttribute('aria-disabled');
    expect(group).toHaveClass('disabled');

    expect(radio).toBeDisabled();
    expect(label).toHaveAttribute('data-disabled', 'true');
    expect(label).toHaveClass('disabled');
  });

  it('should support selected state', async () => {
    let onChange = jest.fn();
    let {getAllByRole} = renderGroup({onChange}, {className: ({isSelected}) => isSelected ? 'selected' : ''});
    let radios = getAllByRole('radio');
    let label = radios[0].closest('label');

    expect(radios[0]).not.toBeChecked();
    expect(label).not.toHaveAttribute('data-selected');
    expect(label).not.toHaveClass('selected');

    await user.click(radios[0]);
    expect(onChange).toHaveBeenLastCalledWith('a');
    expect(radios[0]).toBeChecked();
    expect(label).toHaveAttribute('data-selected', 'true');
    expect(label).toHaveClass('selected');

    await user.click(radios[1]);
    expect(onChange).toHaveBeenLastCalledWith('b');
    expect(radios[0]).not.toBeChecked();
    expect(label).not.toHaveAttribute('data-selected');
    expect(label).not.toHaveClass('selected');
  });

  it('should support read only state', () => {
    let className = ({isReadOnly}) => isReadOnly ? 'readonly' : '';
    let {getByRole, getAllByRole} = renderGroup({isReadOnly: true, className}, {className});
    let group = getByRole('radiogroup');
    let label = getAllByRole('radio')[0].closest('label');

    expect(group).toHaveAttribute('aria-readonly');
    expect(group).toHaveClass('readonly');

    expect(label).toHaveAttribute('data-readonly');
    expect(label).toHaveClass('readonly');
  });

  it('should support invalid state', () => {
    let className = ({isInvalid}) => isInvalid ? 'invalid' : null;
    let {getByRole, getAllByRole} = renderGroup({isInvalid: true, className}, {className});
    let group = getByRole('radiogroup');
    let radio = getAllByRole('radio')[0];
    let label = radio.closest('label');

    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveClass('invalid');

    expect(label).toHaveAttribute('data-invalid', 'true');
    expect(label).toHaveClass('invalid');
  });

  it('should support required state', () => {
    let className = ({isRequired}) => isRequired ? 'required' : '';
    let {getByRole, getAllByRole} = renderGroup({isRequired: true, className}, {className});
    let group = getByRole('radiogroup');
    let radio = getAllByRole('radio')[0];
    let label = radio.closest('label');

    expect(group).toHaveAttribute('aria-required', 'true');
    expect(group).toHaveClass('required');

    expect(label).toHaveAttribute('data-required', 'true');
    expect(label).toHaveClass('required');
  });

  it('should support orientation', () => {
    let {getByRole} = renderGroup({orientation: 'horizontal', className: ({orientation}) => orientation});
    let group = getByRole('radiogroup');

    expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    expect(group).toHaveClass('horizontal');
  });

  it('supports help text', () => {
    let {getByRole, getAllByRole} = render(
      <RadioGroup isInvalid>
        <Label>Test</Label>
        <Radio value="a">A</Radio>
        <Text slot="description">Description</Text>
        <Text slot="errorMessage">Error</Text>
      </RadioGroup>
    );

    let group = getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-describedby');
    expect(group.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ')).toBe('Description Error');

    let radio = getAllByRole('radio')[0];
    expect(radio).toHaveAttribute('aria-describedby');
    expect(radio.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ')).toBe('Error Description');
  });

  it('should not navigate within the group using Tab', async () => {
    let {getAllByRole} = renderGroup({}, {className: ({isFocusVisible}) => isFocusVisible ? 'focus' : ''});
    let radios = getAllByRole('radio');
    let labelA = radios[0].closest('label');
    let labelB = radios[1].closest('label');
    let labelC = radios[2].closest('label');

    const expectNotFocused = (...labels) => {
      labels.forEach((label) => {
        expect(label).not.toHaveAttribute('data-focus-visible');
        expect(label).not.toHaveClass('focus');
      });
    };

    expectNotFocused(labelA, labelB, labelC);

    await user.tab();
    expect(document.activeElement).toBe(radios[0]);
    expect(labelA).toHaveAttribute('data-focus-visible', 'true');
    expect(labelA).toHaveClass('focus');
    expectNotFocused(labelB, labelC);

    await user.tab();
    expectNotFocused(labelA, labelB, labelC);

    await user.tab({shift: true});
    expect(document.activeElement).toBe(radios[2]);
    expect(labelC).toHaveAttribute('data-focus-visible', 'true');
    expect(labelC).toHaveClass('focus');
    expectNotFocused(labelA, labelB);
  });

  it('should not navigate within the group using Tab in Dialog', async () => {
    let {getByRole} = render(
      <DialogTrigger>
        <Button>Trigger</Button>
        <Modal data-test="modal">
          <Dialog role="alertdialog" data-test="dialog">
            {({close}) => (
              <>
                <TestRadioGroup radioProps={{className: ({isFocusVisible}) => isFocusVisible ? 'focus' : ''}} />
                <Button onPress={close}>Close</Button>
              </>
            )}
          </Dialog>
        </Modal>
      </DialogTrigger>
    );

    let trigger = getByRole('button');
    await user.click(trigger);

    let dialog = getByRole('alertdialog');

    let radios = within(dialog).getAllByRole('radio');
    let labelA = radios[0].closest('label');
    let labelB = radios[1].closest('label');
    let labelC = radios[2].closest('label');

    const expectNotFocused = (...labels) => {
      labels.forEach((label) => {
        expect(label).not.toHaveAttribute('data-focus-visible');
        expect(label).not.toHaveClass('focus');
      });
    };

    expectNotFocused(labelA, labelB, labelC);

    await user.tab();
    expect(document.activeElement).toBe(radios[0]);
    expect(labelA).toHaveAttribute('data-focus-visible', 'true');
    expect(labelA).toHaveClass('focus');
    expectNotFocused(labelB, labelC);

    await user.tab();
    let close = within(dialog).getByRole('button');
    expect(document.activeElement).toBe(close);
    expectNotFocused(labelA, labelB, labelC);

    await user.tab({shift: true});
    expect(document.activeElement).toBe(radios[2]);
    expect(labelC).toHaveAttribute('data-focus-visible', 'true');
    expect(labelC).toHaveClass('focus');
    expectNotFocused(labelA, labelB);
  });

  it('should support aria-describedby on a radio', () => {
    let {getAllByRole} = renderGroup({}, {'aria-describedby': 'test'});
    let radios = getAllByRole('radio');
    for (let radio of radios) {
      expect(radio).toHaveAttribute('aria-describedby', 'test');
    }
  });

  it('should render data- attributes only on the outer Radio element or RadioGroup', () => {
    let {getAllByTestId, getAllByRole} = render(
      <RadioGroup data-testid="radio-group">
        <Label>Test</Label>
        <Radio data-testid="radio-a" value="a">
          A
        </Radio>
        <Radio value="b">
          B
        </Radio>
        <Radio value="c">
          C
        </Radio>
      </RadioGroup>
    );
    let radio = getAllByTestId('radio-a');
    expect(radio).toHaveLength(1);
    expect(radio[0].nodeName).toBe('LABEL');
    let group = getAllByRole('radiogroup');
    expect(group).toHaveLength(1);
    expect(group[0]).toHaveAttribute('data-testid', 'radio-group');
  });

  it('supports validation errors', async () => {
    let {getByRole, getAllByRole, getByTestId} = render(
      <form data-testid="form">
        <RadioGroup isRequired>
          <Label>Test</Label>
          <Radio value="a">A</Radio>
          <FieldError />
        </RadioGroup>
      </form>
    );

    let group = getByRole('radiogroup');
    expect(group).not.toHaveAttribute('aria-describedby');
    expect(group).not.toHaveAttribute('data-invalid');

    let radios = getAllByRole('radio');
    for (let input of radios) {
      expect(input).toHaveAttribute('required');
      expect(input).not.toHaveAttribute('aria-required');
      expect(input.validity.valid).toBe(false);
    }

    act(() => {getByTestId('form').checkValidity();});

    expect(group).toHaveAttribute('aria-describedby');
    expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('Constraints not satisfied');
    expect(group).toHaveAttribute('data-invalid');
    expect(document.activeElement).toBe(radios[0]);

    await user.click(radios[0]);
    for (let input of radios) {
      expect(input.validity.valid).toBe(true);
    }

    expect(group).not.toHaveAttribute('aria-describedby');
    expect(group).not.toHaveAttribute('data-invalid');
  });

  it('should support focus events', async () => {
    let onBlur = jest.fn();
    let onFocus = jest.fn();
    let onFocusChange = jest.fn();

    let {getAllByRole} = renderGroup({onBlur, onFocus, onFocusChange});
    let radio = getAllByRole('radio')[0];

    await user.tab();
    expect(document.activeElement).toBe(radio);
    expect(onBlur).toHaveBeenCalledTimes(0);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocusChange).toHaveBeenCalledTimes(1);

    await user.keyboard('[ArrowRight]');
    expect(onBlur).toHaveBeenCalledTimes(0);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocusChange).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocusChange).toHaveBeenCalledTimes(2);
  });

  it('should support refs', () => {
    let groupRef = React.createRef();
    let radioRef = React.createRef();
    let {getByRole} = render(
      <RadioGroup ref={groupRef}>
        <Label>Test</Label>
        <Radio ref={radioRef} value="a">A</Radio>
      </RadioGroup>
    );
    expect(groupRef.current).toBe(getByRole('radiogroup'));
    expect(radioRef.current).toBe(getByRole('radio').closest('.react-aria-Radio'));
  });

  it('should support input ref', () => {
    let inputRef = React.createRef();
    let {getByRole} = render(
      <RadioGroup>
        <Label>Test</Label>
        <Radio inputRef={inputRef} value="a">A</Radio>
      </RadioGroup>
    );
    let radio = getByRole('radio');
    expect(inputRef.current).toBe(radio);
  });

  it('should support and merge input ref on context', () => {
    let inputRef = React.createRef();
    let contextInputRef = React.createRef();
    let {getByRole} = render(
      <RadioGroup>
        <Label>Test</Label>
        <RadioContext.Provider value={{inputRef: contextInputRef}}>
          <Radio inputRef={inputRef} value="a">A</Radio>
        </RadioContext.Provider>
      </RadioGroup>
    );
    let radio = getByRole('radio');
    expect(inputRef.current).toBe(radio);
    expect(contextInputRef.current).toBe(radio);
  });

  it('can have numeric values', async () => {
    let onChangeSpy = jest.fn();
    let {getAllByRole} = render(
      <RadioGroup onChange={onChangeSpy}>
        <Label>Test</Label>
        <Radio value={0}>Radio </Radio>
        <Radio value={1}>Radio 1</Radio>
      </RadioGroup>
    );

    let radios = getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('value', '0');
    expect(radios[1]).toHaveAttribute('value', '1');

    await user.click(radios[0]);
    expect(onChangeSpy).toHaveBeenCalledWith(0);
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();

    await user.click(radios[1]);
    expect(onChangeSpy).toHaveBeenCalledWith(1);
    expect(radios[1]).toBeChecked();
  });
});
