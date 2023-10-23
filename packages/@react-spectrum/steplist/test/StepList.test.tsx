/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {DOMRefValue} from '@react-types/shared';
import {Item} from '@react-stately/collections';
import {pointerMap, render, within} from '@react-spectrum/test-utils';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {StepList} from '../';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';
import {act} from '@testing-library/react';

const items = [
  {key: 'step-one', value: 'Step 1'},
  {key: 'step-two', value: 'Step 2'},
  {key: 'step-three', value: 'Step 3'},
  {key: 'step-four', value: 'Step 4'}
];

type StepListProps = Omit<typeof StepList, 'children'>;

function renderComponent(props: StepListProps = {} as StepListProps) {
  return render(
    <Provider theme={theme}>
      <StepList id="steplist-id" aria-label="steplist-test" {...props}>
        {items.map(item => (<Item key={item.key}>{item.value}</Item>))}
      </StepList>
    </Provider>
  );
}

describe('StepList', function () {
  let onSelectionChange = jest.fn();
  let user;

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });
  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
  });

  it('renders', function () {
    const tree = renderComponent({onSelectionChange});
    const stepListItems = tree.getAllByRole('link');
    expect(stepListItems.length).toBe(4);

    const stepOne = stepListItems[0];
    expect(stepOne).toHaveAttribute('aria-current', 'step');
    expect(stepOne).not.toHaveAttribute('tabindex');
    expect(stepOne.firstElementChild.textContent).not.toContain('Completed');
    expect(onSelectionChange).toHaveBeenCalled();
    expect(onSelectionChange).toHaveBeenCalledWith('step-one');

    for (let i = 1; i < stepListItems.length; i++) {
      expect(stepListItems[i]).toHaveAttribute('aria-disabled', 'true');
      expect(stepListItems[i].firstElementChild.textContent).toContain('Not');
    }

    const stepList = tree.getByLabelText('steplist-test');
    expect(stepList).toHaveAttribute('id', 'steplist-id');
  });

  it('attaches a user provided ref', function () {
    const ref = React.createRef<DOMRefValue<HTMLDivElement>>();
    const container = renderComponent({ref});
    const stepList = container.getByLabelText('steplist-test');

    expect(ref.current.UNSAFE_getDOMNode()).toBe(stepList);
  });

  it('allows user to click completed steps and immediate next step only', async function () {
    const tree = renderComponent({defaultLastCompletedStep: 'step-two', defaultSelectedKey: 'step-three', onSelectionChange});
    const stepList = tree.getByLabelText('steplist-test');
    const stepListItems =  within(stepList).getAllByRole('link');

    // select previously completed step
    const stepOne = stepListItems[0];
    expect(stepOne).not.toHaveAttribute('aria-current');
    expect(stepOne.firstElementChild.textContent).toContain('Completed');
    await user.click(stepOne);
    expect(stepOne).toHaveAttribute('aria-current', 'step');
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenLastCalledWith('step-one');

    // select immediate next step (step after last completed step)
    const stepThree = stepListItems[2];
    expect(stepThree).not.toHaveAttribute('aria-current');
    expect(stepOne.firstElementChild.textContent).toContain('Current');
    await user.click(stepThree);
    expect(stepThree).toHaveAttribute('aria-current');
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(onSelectionChange).toHaveBeenLastCalledWith('step-three');
    onSelectionChange.mockReset();

    // try to select step after immediate next step
    const stepFour = stepListItems[3];
    expect(stepFour).not.toHaveAttribute('aria-current');
    await user.click(stepFour);
    expect(stepFour).not.toHaveAttribute('aria-current');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  // TODO address bug, we should be able to tab to the default selected key
  it.skip('allows user to change selected step via tab key only', async function () {
    const tree = renderComponent({defaultLastCompletedStep: 'step-two', defaultSelectedKey: 'step-three', onSelectionChange});
    const stepList = tree.getByLabelText('steplist-test');
    const stepListItems =  within(stepList).getAllByRole('link');

    expect(stepListItems[2]).toHaveAttribute('aria-current', 'step');

    await user.tab();
    expect(document.activeElement).toBe(stepListItems[0]);
    await user.tab();
    expect(document.activeElement).toBe(stepListItems[1]);
    await user.tab();
    expect(document.activeElement).toBe(stepListItems[2]);

    await user.tab({shift: true});
    expect(document.activeElement).toBe(stepListItems[1]);
    await user.keyboard('{Enter}');
    expect(onSelectionChange).toHaveBeenCalled();
    expect(onSelectionChange).toHaveBeenCalledWith('step-two');
    expect(stepListItems[1]).toHaveAttribute('aria-current');
    onSelectionChange.mockReset();

    await user.keyboard('{ArrowUp}');
    expect(stepListItems[1]).toHaveAttribute('aria-current');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should not allow user to click on disabled steps', async function () {
    const tree = renderComponent({defaultLastCompletedStep: 'step-two', defaultSelectedKey: 'step-three', disabledKeys: ['step-one'], onSelectionChange});
    const stepList = tree.getByLabelText('steplist-test');
    const stepListItems =  within(stepList).getAllByRole('link');

    const stepOne = stepListItems[0];

    await user.click(stepOne);
    expect(stepOne).not.toHaveAttribute('aria-current');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  // TODO address bug shown in React 17 test, I think if we match a bit more with useTabListState, it'll get fixed
  it.skip('should disable all steps when step list is disabled', function () {
    const tree = renderComponent({defaultLastCompletedStep: 'step-two', isDisabled: true, onSelectionChange});
    // TODO is this the right selection given a defaultLastCompletedStep of 2?
    // the call to onSelectionChange is correct, see https://github.com/adobe/react-spectrum/issues/5013#issuecomment-1703101568
    expect(onSelectionChange).toHaveBeenLastCalledWith('step-one');
    onSelectionChange.mockReset();
    const stepList = tree.getByLabelText('steplist-test');
    const stepListItems =  within(stepList).getAllByRole('link');

    for (let stepListItem of stepListItems) {
      expect(stepListItem).toHaveAttribute('aria-disabled', 'true');
    }

    const stepOne = stepListItems[0];
    expect(stepOne).toHaveAttribute('aria-current');

    const stepTwo = stepListItems[1];
    user.click(stepTwo);
    expect(stepTwo).not.toHaveAttribute('aria-current');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should not allow user to click previous steps when step list is readonly', function () {
    const tree = renderComponent({defaultSelectedKey: 'step-four', defaultLastCompletedStep: 'step-three', isReadOnly: true, onSelectionChange});
    const stepList = tree.getByLabelText('steplist-test');
    const stepListItems =  within(stepList).getAllByRole('link');

    for (let stepListItem of stepListItems) {
      expect(stepListItem).toHaveAttribute('aria-disabled', 'true');
    }

    const stepFour = stepListItems[3];
    expect(stepFour).toHaveAttribute('aria-current');

    const stepOne = stepListItems[0];
    user.click(stepOne);
    expect(stepOne).not.toHaveAttribute('aria-current');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  // TODO address bug, I think we missed a call to onLastCompletedStepChange
  it.skip('updates the last completed step automatically (uncontrollled) when the selected step is updated', function () {
    const onLastCompletedStepChange = jest.fn();
    const {getByLabelText, rerender} = render(
      <StepList
        id="steplist-id"
        aria-label="steplist-test"
        defaultLastCompletedStep="step-one"
        onLastCompletedStepChange={onLastCompletedStepChange}
        selectedKey="step-one">
        {items.map(item => (<Item key={item.key}>{item.value}</Item>))}
      </StepList>
    );
    const stepList = getByLabelText('steplist-test');
    const stepListItems =  within(stepList).getAllByRole('link');

    expect(stepListItems[0]).toHaveAttribute('aria-current');
    expect(stepListItems[0].textContent).toContain('Current');
    expect(onLastCompletedStepChange).not.toHaveBeenCalled();

    rerender(
      <StepList
        id="steplist-id"
        aria-label="steplist-test"
        onLastCompletedStepChange={onLastCompletedStepChange}
        selectedKey="step-two">
        {items.map(item => (<Item key={item.key}>{item.value}</Item>))}
      </StepList>
    );

    expect(onLastCompletedStepChange).toHaveBeenCalledWith('step-one');
    expect(stepListItems[0].textContent).toContain('Completed');

    rerender(
      <StepList
        id="steplist-id"
        aria-label="steplist-test"
        onLastCompletedStepChange={onLastCompletedStepChange}
        selectedKey="step-three">
        {items.map(item => (<Item key={item.key}>{item.value}</Item>))}
      </StepList>
    );

    expect(onLastCompletedStepChange).toHaveBeenCalledWith('step-two');
    expect(stepListItems[1].textContent).toContain('Completed');
  });

  // TODO: fix me
  it.skip('does not update selected step when last completed step is controlled', function () {
    const onSelectionChange = jest.fn();
    const {getByLabelText, rerender} = render(
      <StepList
        id="steplist-id"
        aria-label="steplist-test"
        lastCompletedStep={'step-one'}
        onSelectionChange={onSelectionChange}>
        {items.map(item => (<Item key={item.key}>{item.value}</Item>))}
      </StepList>
    );
    const stepList = getByLabelText('steplist-test');
    const stepListItems =  within(stepList).getAllByRole('link');

    rerender(
      <StepList
        id="steplist-id"
        aria-label="steplist-test"
        onSelectionChange={onSelectionChange}
        lastCompletedStep="step-two">
        {items.map(item => (<Item key={item.key}>{item.value}</Item>))}
      </StepList>
    );

    rerender(
      <StepList
        id="steplist-id"
        aria-label="steplist-test"
        onSelectionChange={onSelectionChange}
        lastCompletedStep="step-three">
        {items.map(item => (<Item key={item.key}>{item.value}</Item>))}
      </StepList>
    );

    expect(onSelectionChange).toHaveBeenCalledTimes(0);
    expect(stepListItems[0]).toHaveAttribute('aria-current');
    expect(stepListItems[1].textContent).toContain('Completed');
    expect(stepListItems[2].textContent).toContain('Completed');
  });
});
