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

import {act, fireEvent, pointerMap, renderv3 as render, within} from '@react-spectrum/test-utils-internal';
import Checkmark from '@spectrum-icons/workflow/Checkmark';
import React from 'react';
import {SearchField} from '../';
import userEvent from '@testing-library/user-event';

let testId = 'test-id';
let inputText = 'blah';

function renderComponent(Component, props) {
  return render(<Component aria-label="the label" {...props} data-testid={testId} />);
}

// Note: Running this test suite will result in some warnings of the following class:
// 1. "Textfield contains an input of type search with both value and defaultValue props.  This is a v2 SearchField issue
// 2. "An update to ForwardRef inside a test was not wrapped in act(...)". See https://github.com/testing-library/react-testing-library/issues/281
// 3. Various warnings about componentWillReceiveProps and componentDidUpdate. Prob a TODO to update v2 components so we don't use these renamed/deprecated lifecycle methods

describe('Search', () => {
  let onChange = jest.fn();
  let onFocus = jest.fn();
  let onSubmit = jest.fn();
  let onClear = jest.fn();
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });


  afterEach(() => {
    onChange.mockClear();
    onFocus.mockClear();
    onSubmit.mockClear();
    onClear.mockClear();
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name default behavior check', ({Component}) => {
    let tree = renderComponent(Component);
    let outerDiv = tree.container;
    expect(outerDiv).toBeTruthy();

    let input = within(outerDiv).getByTestId(testId);
    expect(input).toHaveAttribute('type', 'search');

    let clearButton = within(outerDiv).queryByRole('button');
    expect(clearButton).toBeNull();
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name should support custom icons', ({Component}) => {
    let icon = <Checkmark data-testid="testicon" />;
    let tree = renderComponent(Component, {icon});
    expect(tree.getByTestId('testicon')).toBeTruthy();
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name should support no icons', ({Component}) => {
    let tree = renderComponent(Component, {icon: ''});
    expect(tree.queryByTestId('searchicon')).toBeNull();
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name should display the clear button icon only if text is present', async ({Component}) => {
    let tree = renderComponent(Component, {defaultValue: inputText});
    let clearButton = tree.getByLabelText('Clear search');
    expect(clearButton).toBeTruthy();

    let input = tree.getByTestId(testId);
    fireEvent.change(input, {target: {value: ''}});
    clearButton = tree.queryByLabelText('Clear search');
    expect(clearButton).toBeNull();
    act(() => {
      input.focus();
    });

    await user.keyboard('bleh');
    clearButton = tree.queryByLabelText('Clear search');
    expect(clearButton).toBeTruthy();
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name submits the textfield value when enter is pressed', ({Component}) => {
    let tree = renderComponent(Component, {defaultValue: inputText, onSubmit});
    let input = tree.getByTestId(testId);
    fireEvent.keyDown(input, {key: 'Enter', code: 13, charCode: 13});
    expect(onSubmit).toBeCalledTimes(1);
    expect(onSubmit).toHaveBeenLastCalledWith(inputText);

    act(() => {
      fireEvent.change(input, {target: {value: ''}});
    });
    act(() => {
      fireEvent.keyDown(input, {key: 'Enter', code: 13, charCode: 13});
    });
    expect(onSubmit).toBeCalledTimes(2);
    expect(onSubmit).toHaveBeenLastCalledWith('');
  });

  it.each`
    Name                | Component        | props
    ${'v3 SearchField'} | ${SearchField}   | ${{isDisabled: true}}
  `('$Name doesn\'t submit the textfield value when enter is pressed but field is disabled', ({Component, props}) => {
    let tree = renderComponent(Component, {defaultValue: inputText, onSubmit, ...props});
    let input = tree.getByTestId(testId);
    fireEvent.keyDown(input, {key: 'Enter', code: 13, charCode: 13});
    expect(onSubmit).toBeCalledTimes(0);
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name clears the input field if the escape key is pressed and the field is uncontrolled', ({Component}) => {
    let tree = renderComponent(Component, {defaultValue: inputText, onChange, onClear});
    let input = tree.getByTestId(testId);
    expect(input.value).toBe(inputText);
    fireEvent.keyDown(input, {key: 'Escape', code: 27, charCode: 27});
    expect(onChange).toBeCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(document.body);

    // onClear was added in v3
    if (Component === SearchField) {
      expect(onClear).toBeCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(expect.anything());
    }
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name doesn\'t clear the input field if the escape key is pressed and the field is controlled', ({Component}) => {
    let tree = renderComponent(Component, {value: inputText, onChange, onClear});
    let input = tree.getByTestId(testId);
    expect(input.value).toBe(inputText);
    fireEvent.keyDown(input, {key: 'Escape', code: 27, charCode: 27});
    expect(onChange).toBeCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(input.value).toBe(inputText);
    expect(document.activeElement).toBe(document.body);

    expect(onClear).toBeCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(expect.anything());
  });

  it.each`
    Name                | Component        | props
    ${'v3 SearchField'} | ${SearchField}   | ${{isDisabled: true}}
  `('$Name doesn\'t clear the input field if the escape key is pressed and the field is disabled', ({Component, props}) => {
    let tree = renderComponent(Component, {defaultValue: inputText, onChange, onClear, ...props});
    let input = tree.getByTestId(testId);
    expect(input.value).toBe(inputText);
    fireEvent.keyDown(input, {key: 'Escape', code: 27, charCode: 27});
    expect(onChange).toBeCalledTimes(0);
    expect(input.value).toBe(inputText);

    expect(onClear).toBeCalledTimes(0);
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name clears the input field if the clear button is pressed and the field is uncontrolled', async ({Component}) => {
    let user = userEvent.setup({delay: null, pointerMap});
    let tree = renderComponent(Component, {defaultValue: inputText, onChange, onClear});
    let input = tree.getByTestId(testId);
    let clearButton = tree.getByLabelText('Clear search');
    expect(input.value).toBe(inputText);
    await user.click(clearButton);
    expect(onChange).toBeCalledTimes(1);

    expect(onChange).toHaveBeenLastCalledWith('');

    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);

    expect(onClear).toBeCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(expect.anything());
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name doesn\'t clear the input field if the clear button is pressed and the field is controlled', async ({Component}) => {
    let tree = renderComponent(Component, {value: inputText, onChange, onClear});
    let input = tree.getByTestId(testId);
    let clearButton = tree.getByLabelText('Clear search');
    expect(input.value).toBe(inputText);
    await user.click(clearButton);
    expect(onChange).toBeCalledTimes(1);

    expect(onChange).toHaveBeenLastCalledWith('');

    expect(input.value).toBe(inputText);
    expect(document.activeElement).toBe(input);

    expect(onClear).toBeCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(expect.anything());
  });

  it.each`
    Name                | Component        | props
    ${'v3 SearchField'} | ${SearchField}   | ${{isDisabled: true}}
  `('$Name doesn\'t clear the input field if the clear button is pressed and the field is disabled', async ({Component, props}) => {
    let tree = renderComponent(Component, {defaultValue: inputText, onChange, onClear, ...props});
    let input = tree.getByTestId(testId);
    let clearButton = tree.getByLabelText('Clear search');
    expect(input.value).toBe(inputText);
    await user.click(clearButton);
    expect(onChange).toBeCalledTimes(0);
    expect(input.value).toBe(inputText);

    expect(onClear).toBeCalledTimes(0);
  });

  it('SearchField doesn\'t show clear button if isReadOnly is true', () => {
    let tree = renderComponent(SearchField, {isReadOnly: true, value: 'puppy'});
    let clearButton = tree.queryByLabelText('Clear search');
    expect(clearButton).toBe(null);
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name should support description', ({Component}) => {
    let tree = renderComponent(Component, {description: 'Enter a search term.'});
    let input = tree.getByTestId(testId);
    let description = tree.getByText('Enter a search term.');
    expect(description).toHaveAttribute('id');
    expect(input).toHaveAttribute('aria-describedby', `${description.id}`);
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name should support error message', ({Component}) => {
    let tree = renderComponent(Component, {errorMessage: 'Remove special characters.', validationState: 'invalid'});
    let input = tree.getByTestId(testId);
    let errorMessage = tree.getByText('Remove special characters.');
    expect(errorMessage).toHaveAttribute('id');
    expect(input).toHaveAttribute('aria-describedby', `${errorMessage.id}`);
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name should support aria-label', ({Component}) => {
    let tree = renderComponent(Component, {'aria-label': 'Test'});
    expect(tree.getByRole('searchbox')).toHaveAttribute('aria-label', 'Test');
  });

  it.each`
    Name                | Component
    ${'v3 SearchField'} | ${SearchField}
  `('$Name should support excludeFromTabOrder', ({Component}) => {
    let tree = renderComponent(Component, {excludeFromTabOrder: true});
    expect(tree.getByRole('searchbox')).toHaveAttribute('tabIndex', '-1');
  });
});
