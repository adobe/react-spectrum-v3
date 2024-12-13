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

jest.mock('@react-aria/utils/src/scrollIntoView');
import {act, fireEvent, mockClickDefault, pointerMap, renderv3 as render, simulateDesktop, within} from '@react-spectrum/test-utils-internal';
import AlignCenter from '@spectrum-icons/workflow/AlignCenter';
import AlignLeft from '@spectrum-icons/workflow/AlignLeft';
import AlignRight from '@spectrum-icons/workflow/AlignRight';
import {Button} from '@react-spectrum/button';
import Copy from '@spectrum-icons/workflow/Copy';
import Cut from '@spectrum-icons/workflow/Cut';
import {Form} from '@react-spectrum/form';
import {Item, Picker, Section} from '../src';
import Paste from '@spectrum-icons/workflow/Paste';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {scrollIntoView} from '@react-aria/utils';
import {states} from './data';
import {Text} from '@react-spectrum/text';
import {theme} from '@react-spectrum/theme-default';
import {User} from '@react-aria/test-utils';
import userEvent from '@testing-library/user-event';

describe('Picker', function () {
  let offsetWidth, offsetHeight;
  let onSelectionChange = jest.fn();
  let testUtilUser = new User();
  let user;

  beforeAll(function () {
    user = userEvent.setup({delay: null, pointerMap});
    offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    simulateDesktop();
    jest.useFakeTimers();
  });

  afterAll(function () {
    offsetWidth.mockReset();
    offsetHeight.mockReset();
  });

  afterEach(() => {
    act(() => jest.runAllTimers());
  });

  it('renders correctly', function () {
    let {getAllByText, getByText, getByRole} = render(
      <Provider theme={theme}>
        <Picker label="Test" data-testid="test" onSelectionChange={onSelectionChange}>
          <Item>One</Item>
          <Item>Two</Item>
          <Item>Three</Item>
        </Picker>
      </Provider>
    );

    let picker = getByRole('button');
    expect(picker).toHaveAttribute('aria-haspopup', 'listbox');
    expect(picker).toHaveAttribute('data-testid', 'test');

    let label = getAllByText('Test')[0];
    let value = getByText('Select…');
    expect(label).toBeVisible();
    expect(value).toBeVisible();
  });

  describe('opening', function () {
    it('can be opened on mouse down', async function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
      expect(queryByRole('listbox')).toBeNull();

      let picker = selectTester.trigger;
      await selectTester.open();

      let listbox = selectTester.listbox;
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      let items = selectTester.options;
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(listbox);
    });

    // TODO: skipping conversion of this since it runs a check inbetween the touch events
    // also skipping tests conversions for tests that don't have many interactions
    it('can be opened on touch up', function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();

      let picker = getByRole('button');
      fireEvent.touchStart(picker, {targetTouches: [{identifier: 1}]});
      act(() => jest.runAllTimers());

      expect(queryByRole('listbox')).toBeNull();

      fireEvent.touchEnd(picker, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(listbox);
    });

    it('can be opened on Space key down', function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();

      let picker = getByRole('button');
      fireEvent.keyDown(picker, {key: ' '});
      fireEvent.keyUp(picker, {key: ' '});
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(items[0]);
    });

    it('can be opened on Enter key down', async function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();
      let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
      selectTester.setInteractionType('keyboard');
      let picker = selectTester.trigger;

      await selectTester.open();

      let listbox = selectTester.listbox;
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      let items = selectTester.options;
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(items[0]);
    });

    it('can be opened on ArrowDown key down and auto focuses the first item', function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();
      let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
      let picker = selectTester.trigger;
      // TODO: for these keyboard event, IMO we don't have to include in the test utils since the user can pretty
      // easily define what specific keyboard interactions they want to do. We can handle firing the various intermediate interactions
      // for basic flows (aka we will handle firing Enter in selectTester.open())
      fireEvent.keyDown(picker, {key: 'ArrowDown'});
      fireEvent.keyUp(picker, {key: 'ArrowDown'});
      act(() => jest.runAllTimers());

      let listbox = selectTester.listbox;
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      let items = selectTester.options;
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(items[0]);
    });

    it('can be opened on ArrowUp key down and auto focuses the last item', function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();

      let picker = getByRole('button');
      fireEvent.keyDown(picker, {key: 'ArrowUp'});
      fireEvent.keyUp(picker, {key: 'ArrowUp'});
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(items[2]);
    });

    it('can change item focus with arrow keys, even for item key=""', function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item key="1">One</Item>
            <Item key="">Two</Item>
            <Item key="3">Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();

      let picker = getByRole('button');
      fireEvent.keyDown(picker, {key: 'ArrowDown'});
      fireEvent.keyUp(picker, {key: 'ArrowDown'});
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(items[0]);

      fireEvent.keyDown(listbox, {key: 'ArrowDown'});
      fireEvent.keyUp(listbox, {key: 'ArrowDown'});
      act(() => jest.runAllTimers());

      expect(document.activeElement).toBe(items[1]);

      fireEvent.keyDown(listbox, {key: 'ArrowDown'});
      fireEvent.keyUp(listbox, {key: 'ArrowDown'});
      act(() => jest.runAllTimers());

      expect(document.activeElement).toBe(items[2]);

      fireEvent.keyDown(listbox, {key: 'ArrowUp'});
      fireEvent.keyUp(listbox, {key: 'ArrowUp'});
      act(() => jest.runAllTimers());

      expect(document.activeElement).toBe(items[1]);
    });

    it('supports controlled open state', function () {
      let onOpenChange = jest.fn();
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <Picker label="Test" isOpen onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).not.toBeCalled();

      let picker = getByLabelText('Select…');
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(listbox);
    });

    it('supports default open state', function () {
      let onOpenChange = jest.fn();
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <Picker label="Test" defaultOpen onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).not.toBeCalled();

      let picker = getByLabelText('Select…');
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(listbox);
    });

    it('scrolls the selected item into view on menu open', async function () {
      // Mock scroll height so that the picker heights actually have a value
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" selectedKey="four">
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
            <Item key="four">Four</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();
      let picker = getByRole('button');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(within(listbox).getAllByRole('option')[3]);
      expect(scrollIntoView).toHaveBeenLastCalledWith(listbox, document.activeElement);
    });
  });

  describe('closing', function () {
    it('can be closed by clicking on the button', async function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();

      let picker = getByRole('button');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      await user.click(picker);
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);

      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(picker);
    });

    it('can be closed by clicking outside', async function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();

      let picker = getByRole('button');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      await user.click(document.body);
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('can be closed by pressing the Escape key', async function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();
      let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
      let picker = selectTester.trigger;
      await selectTester.open();

      let listbox = selectTester.listbox;
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      await selectTester.close();

      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);

      expect(document.activeElement).toBe(picker);
    });

    it('closes on blur', async function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();

      let picker = getByRole('button');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      act(() => {document.activeElement.blur();});
      act(() => jest.runAllTimers());
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);

      expect(document.activeElement).toBe(picker);
    });

    it('tabs to the next element after the trigger and closes the menu', async function () {
      let onOpenChange = jest.fn();
      let {getByRole, getByTestId} = render(
        <Provider theme={theme}>
          <input data-testid="before-input" />
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
          <input data-testid="after-input" />
        </Provider>
      );

      let picker = getByRole('button');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      fireEvent.keyDown(document.activeElement, {key: 'Tab'});
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);

      expect(document.activeElement).toBe(getByTestId('after-input'));
    });

    it('shift tabs to the previous element before the trigger and closes the menu', async function () {
      let onOpenChange = jest.fn();
      let {getByRole, getByTestId} = render(
        <Provider theme={theme}>
          <input data-testid="before-input" />
          <Picker label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
          <input data-testid="after-input" />
        </Provider>
      );

      let picker = getByRole('button');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      fireEvent.keyDown(document.activeElement, {key: 'Tab', shiftKey: true});
      fireEvent.keyUp(document.activeElement, {key: 'Tab', shiftKey: true});
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);

      expect(document.activeElement).toBe(getByTestId('before-input'));
    });

    it('should have a hidden dismiss button for screen readers', async function () {
      let onOpenChange = jest.fn();
      let {getByRole, getAllByLabelText, getAllByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange} onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      expect(getAllByRole('button').length).toBe(2);
      let dismissButtons = getAllByLabelText('Dismiss');
      expect(dismissButtons.length).toBe(2);
      expect(dismissButtons[0]).toHaveAttribute('aria-label', 'Dismiss');
      expect(dismissButtons[1]).toHaveAttribute('aria-label', 'Dismiss');

      await user.click(dismissButtons[0]);
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);

      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(picker);
    });

    it('does not close in controlled open state', function () {
      let onOpenChange = jest.fn();
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <Picker label="Test" isOpen onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).not.toBeCalled();

      let picker = getByLabelText('Select…');
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      fireEvent.keyDown(listbox, {key: 'Escape'});
      fireEvent.keyUp(listbox, {key: 'Escape'});
      act(() => jest.runAllTimers());

      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes in default open state', function () {
      let onOpenChange = jest.fn();
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <Picker label="Test" defaultOpen onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      act(() => jest.runAllTimers());

      expect(getByRole('listbox')).toBeVisible();
      expect(onOpenChange).not.toBeCalled();

      let picker = getByLabelText('Select…');
      expect(picker).toHaveAttribute('aria-expanded', 'true');

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      fireEvent.keyDown(listbox, {key: 'Escape'});
      fireEvent.keyUp(listbox, {key: 'Escape'});
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('labeling', function () {
    it('focuses on the picker when you click the label', function () {
      let {getAllByText, getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      let label = getAllByText('Test')[0];
      act(() => label.click());

      let picker = getByRole('button');
      expect(document.activeElement).toBe(picker);
    });

    it('supports labeling with a visible label', async function () {
      let {getAllByText, getByText, getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      expect(picker).toHaveAttribute('aria-haspopup', 'listbox');

      let label = getAllByText('Test')[0];
      let value = getByText('Select…');
      expect(label).toHaveAttribute('id');
      expect(value).toHaveAttribute('id');
      expect(picker).toHaveAttribute('aria-labelledby', `${value.id} ${label.id}`);

      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(listbox).toHaveAttribute('aria-labelledby', label.id);
    });

    it('supports labeling via aria-label', async function () {
      let {getByText, getByRole} = render(
        <Provider theme={theme}>
          <Picker aria-label="Test" onSelectionChange={onSelectionChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      let value = getByText('Select…');
      expect(picker).toHaveAttribute('id');
      expect(value).toHaveAttribute('id');
      expect(picker).toHaveAttribute('aria-label', 'Test');
      expect(picker).toHaveAttribute('aria-labelledby', `${value.id} ${picker.id}`);

      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(listbox).toHaveAttribute('aria-labelledby', picker.id);
    });

    it('supports labeling via aria-labelledby', async function () {
      let {getByText, getByRole} = render(
        <Provider theme={theme}>
          <Picker aria-labelledby="foo" onSelectionChange={onSelectionChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      let value = getByText('Select…');
      expect(picker).toHaveAttribute('id');
      expect(value).toHaveAttribute('id');
      expect(picker).toHaveAttribute('aria-labelledby', `${value.id} foo`);

      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(listbox).toHaveAttribute('aria-labelledby', 'foo');
    });

    it('supports labeling via aria-label and aria-labelledby', async function () {
      let {getByText, getByRole} = render(
        <Provider theme={theme}>
          <Picker aria-label="Test" aria-labelledby="foo" onSelectionChange={onSelectionChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      let value = getByText('Select…');
      expect(picker).toHaveAttribute('id');
      expect(value).toHaveAttribute('id');
      expect(picker).toHaveAttribute('aria-label', 'Test');
      expect(picker).toHaveAttribute('aria-labelledby', `${value.id} ${picker.id} foo`);

      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(listbox).toHaveAttribute('aria-labelledby', `${picker.id} foo`);
    });

    describe('isRequired', function () {
      it('supports labeling with a visible label that includes the necessity indicator', async function () {
        let {getByText, getByRole} = render(
          <Provider theme={theme}>
            <Picker label="Test 2" isRequired necessityIndicator="label" onSelectionChange={onSelectionChange}>
              <Item>One</Item>
              <Item>Two</Item>
              <Item>Three</Item>
            </Picker>
          </Provider>
        );

        let picker = getByRole('button');
        expect(picker).toHaveAttribute('aria-haspopup', 'listbox');


        let span = getByText('(required)');
        expect(span).not.toHaveAttribute('aria-hidden');

        let label = span.parentElement;
        let value = getByText('Select…');
        expect(label).toHaveAttribute('id');
        expect(value).toHaveAttribute('id');
        expect(picker).toHaveAttribute('aria-labelledby', `${value.id} ${label.id}`);

        await user.click(picker);
        act(() => jest.runAllTimers());

        let listbox = getByRole('listbox');
        expect(listbox).toBeVisible();
        expect(listbox).toHaveAttribute('aria-labelledby', label.id);
      });
    });

    describe('help text', function () {
      it('supports description', function () {
        let {getByText, getByRole} = render(
          <Provider theme={theme}>
            <Picker label="Test" description="Please select an item." onSelectionChange={onSelectionChange}>
              <Item>One</Item>
              <Item>Two</Item>
              <Item>Three</Item>
            </Picker>
          </Provider>
        );

        let picker = getByRole('button');
        let description = getByText('Please select an item.');
        expect(description).toHaveAttribute('id');
        expect(picker).toHaveAttribute('aria-describedby', `${description.id}`);
      });

      it('supports error message', function () {
        let {getByText, getByRole} = render(
          <Provider theme={theme}>
            <Picker label="Test" errorMessage="Please select a valid item." isInvalid onSelectionChange={onSelectionChange}>
              <Item>One</Item>
              <Item>Two</Item>
              <Item>Three</Item>
            </Picker>
          </Provider>
        );

        let picker = getByRole('button');
        let errorMessage = getByText('Please select a valid item.');
        expect(errorMessage).toHaveAttribute('id');
        expect(picker).toHaveAttribute('aria-describedby', `${errorMessage.id}`);
      });
    });
  });

  describe('selection', function () {
    it('can select items on press', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );
      let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
      let picker = selectTester.trigger;
      expect(picker).toHaveTextContent('Select…');
      await selectTester.open();

      let listbox = selectTester.listbox;
      let items = selectTester.options;
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(listbox);

      await selectTester.selectOption({optionText: 'Three'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('three');

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Three');
    });

    it('can select items with falsy keys', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="">Empty</Item>
            <Item key={0}>Zero</Item>
            <Item key={false}>False</Item>
          </Picker>
        </Provider>
      );
      let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
      let picker = selectTester.trigger;
      expect(picker).toHaveTextContent('Select…');
      await selectTester.open();

      let listbox = selectTester.listbox;
      let items = selectTester.options;
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('Empty');
      expect(items[1]).toHaveTextContent('Zero');
      expect(items[2]).toHaveTextContent('False');

      expect(document.activeElement).toBe(listbox);

      await selectTester.selectOption({optionText: 'Empty'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('');
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Empty');

      await selectTester.selectOption({optionText: 'Zero'});
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(onSelectionChange).toHaveBeenLastCalledWith('0');
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Zero');

      await selectTester.selectOption({optionText: 'False'});
      expect(onSelectionChange).toHaveBeenCalledTimes(3);
      expect(onSelectionChange).toHaveBeenLastCalledWith('false');
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('False');

    });

    it('can select items with the Space key', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      expect(picker).toHaveTextContent('Select…');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(listbox);

      fireEvent.keyDown(listbox, {key: 'ArrowDown'});
      fireEvent.keyUp(listbox, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(items[0]);

      fireEvent.keyDown(listbox, {key: 'ArrowDown'});
      fireEvent.keyUp(listbox, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(items[1]);

      fireEvent.keyDown(document.activeElement, {key: ' '});
      fireEvent.keyUp(document.activeElement, {key: ' '});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('two');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Two');
    });

    it('can select items with the Enter key', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );
      let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
      selectTester.setInteractionType('keyboard');
      let picker = selectTester.trigger;

      expect(picker).toHaveTextContent('Select…');
      await selectTester.open();

      let items = selectTester.options;
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      await selectTester.selectOption({optionText: 'Two'});

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('two');
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Two');
    });

    it('focuses items on hover', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      expect(picker).toHaveTextContent('Select…');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(listbox);

      fireEvent.mouseEnter(items[1]);
      expect(document.activeElement).toBe(items[1]);

      fireEvent.keyDown(listbox, {key: 'ArrowDown'});
      fireEvent.keyUp(listbox, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(items[2]);

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('three');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Three');
    });

    it('does not clear selection on escape closing the listbox', async function () {
      let onOpenChangeSpy = jest.fn();
      let {getAllByText, getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange} onOpenChange={onOpenChangeSpy}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );
      let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
      let picker = selectTester.trigger;
      expect(picker).toHaveTextContent('Select…');
      expect(onOpenChangeSpy).toHaveBeenCalledTimes(0);
      await selectTester.open();
      expect(onOpenChangeSpy).toHaveBeenCalledTimes(1);

      let listbox = selectTester.listbox;
      let label = getAllByText('Test')[0];
      expect(listbox).toBeVisible();
      expect(listbox).toHaveAttribute('aria-labelledby', label.id);

      let items = selectTester.options;
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      await selectTester.selectOption({optionText: 'Three'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onOpenChangeSpy).toHaveBeenCalledTimes(2);

      await selectTester.open();
      expect(onOpenChangeSpy).toHaveBeenCalledTimes(3);
      await selectTester.close();

      expect(onSelectionChange).toHaveBeenCalledTimes(1); // still expecting it to have only been called once
      expect(onOpenChangeSpy).toHaveBeenCalledTimes(4);
      expect(queryByRole('listbox')).toBeNull();

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Three');
    });

    it('supports controlled selection', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" selectedKey="two" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      expect(picker).toHaveTextContent('Two');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(items[1]);
      expect(items[1]).toHaveAttribute('aria-selected', 'true');
      expect(within(items[1]).getByRole('img', {hidden: true})).toBeVisible(); // checkmark

      fireEvent.keyDown(listbox, {key: 'ArrowUp'});
      fireEvent.keyUp(listbox, {key: 'ArrowUp'});
      expect(document.activeElement).toBe(items[0]);

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('one');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Two');
    });

    it('supports default selection', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" defaultSelectedKey="two" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      expect(picker).toHaveTextContent('Two');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(items[1]);
      expect(items[1]).toHaveAttribute('aria-selected', 'true');
      expect(within(items[1]).getByRole('img', {hidden: true})).toBeVisible(); // checkmark

      fireEvent.keyDown(listbox, {key: 'ArrowUp'});
      fireEvent.keyUp(listbox, {key: 'ArrowUp'});
      expect(document.activeElement).toBe(items[0]);

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('one');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('One');
    });

    it('skips disabled items', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange} disabledKeys={['two']}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      expect(picker).toHaveTextContent('Select…');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(listbox);

      fireEvent.keyDown(listbox, {key: 'ArrowDown'});
      fireEvent.keyUp(listbox, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(items[0]);
      expect(items[1]).toHaveAttribute('aria-disabled', 'true');

      fireEvent.keyDown(listbox, {key: 'ArrowDown'});
      fireEvent.keyUp(listbox, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(items[2]);

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('three');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Three');
    });

    it('supports sections and complex items', async function () {
      let {getAllByRole, getByRole, getByText} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Section title="Section 1">
              <Item textValue="Copy" key="copy">
                <Copy size="S" />
                <Text>Copy</Text>
              </Item>
              <Item textValue="Cut" key="cut">
                <Cut size="S" />
                <Text>Cut</Text>
              </Item>
              <Item textValue="Paste" key="paste">
                <Paste size="S" />
                <Text>Paste</Text>
              </Item>
            </Section>
            <Section title="Section 2">
              <Item textValue="Puppy" key="puppy">
                <AlignLeft size="S" />
                <Text>Puppy</Text>
                <Text slot="description">Puppy description super long as well geez</Text>
              </Item>
              <Item textValue="Doggo with really really really long long long text" key="doggo">
                <AlignCenter size="S" />
                <Text>Doggo with really really really long long long text</Text>
              </Item>
              <Item textValue="Floof" key="floof">
                <AlignRight size="S" />
                <Text>Floof</Text>
              </Item>
            </Section>
          </Picker>
        </Provider>
      );
      let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
      let picker = selectTester.trigger;
      expect(picker).toHaveTextContent('Select…');
      await selectTester.open();

      let listbox = selectTester.listbox;
      let items = selectTester.options;
      expect(items.length).toBe(6);

      let groups = selectTester.sections;
      expect(groups).toHaveLength(2);
      expect(groups[0]).toHaveAttribute('aria-labelledby', getByText('Section 1').id);

      expect(items[0]).toHaveAttribute('aria-labelledby', within(items[0]).getByText('Copy').id);
      expect(groups[0]).toContainElement(items[0]);
      expect(items[1]).toHaveAttribute('aria-labelledby', within(items[1]).getByText('Cut').id);
      expect(groups[0]).toContainElement(items[1]);
      expect(items[2]).toHaveAttribute('aria-labelledby', within(items[2]).getByText('Paste').id);
      expect(groups[0]).toContainElement(items[2]);
      expect(items[3]).toHaveAttribute('aria-labelledby', within(items[3]).getByText('Puppy').id);
      expect(items[3]).toHaveAttribute('aria-describedby', within(items[3]).getByText('Puppy description super long as well geez').id);
      expect(groups[1]).toContainElement(items[3]);
      expect(items[4]).toHaveAttribute('aria-labelledby', within(items[4]).getByText('Doggo with really really really long long long text').id);
      expect(groups[1]).toContainElement(items[4]);
      expect(items[5]).toHaveAttribute('aria-labelledby', within(items[5]).getByText('Floof').id);
      expect(groups[1]).toContainElement(items[5]);

      expect(getByText('Section 1')).toHaveAttribute('role', 'presentation');
      expect(groups[1]).toHaveAttribute('aria-labelledby', getByText('Section 2').id);
      expect(getByText('Section 2')).toHaveAttribute('role', 'presentation');

      expect(document.activeElement).toBe(listbox);

      fireEvent.keyDown(listbox, {key: 'ArrowDown'});
      fireEvent.keyUp(listbox, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(items[0]);

      fireEvent.keyDown(listbox, {key: 'ArrowDown'});
      fireEvent.keyUp(listbox, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(items[1]);

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('cut');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Cut');
      expect(getAllByRole('img', {hidden: true})).toHaveLength(2);

      // Open again
      await selectTester.open();

      listbox = selectTester.listbox;
      items = selectTester.options;
      expect(items.length).toBe(6);

      expect(document.activeElement).toBe(items[1]);
      expect(items[1]).toHaveAttribute('aria-selected', 'true');
      expect(within(items[1]).getAllByRole('img', {hidden: true})).toHaveLength(2); // checkmark

      fireEvent.keyDown(listbox, {key: 'ArrowDown'});
      fireEvent.keyUp(listbox, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(items[2]);

      fireEvent.keyDown(listbox, {key: 'ArrowDown'});
      fireEvent.keyUp(listbox, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(items[3]);

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(onSelectionChange).toHaveBeenLastCalledWith('puppy');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Puppy');
      expect(getAllByRole('img', {hidden: true})).toHaveLength(2);
      expect(getByText('Puppy description super long as well geez')).not.toBeVisible();
    });

    it('supports type to select', function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
            <Item key="">None</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      act(() => {picker.focus();});
      expect(picker).toHaveTextContent('Select…');
      fireEvent.keyDown(picker, {key: 'ArrowDown'});
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(4);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(items[0]);

      fireEvent.keyDown(listbox, {key: 't'});
      fireEvent.keyUp(listbox, {key: 't'});
      expect(document.activeElement).toBe(items[1]);

      fireEvent.keyDown(listbox, {key: 'h'});
      fireEvent.keyUp(listbox, {key: 'h'});
      expect(document.activeElement).toBe(items[2]);

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('three');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Three');

      act(() => jest.advanceTimersByTime(500));
      act(() => picker.focus());
      fireEvent.keyDown(picker, {key: 'ArrowDown'});
      act(() => jest.runAllTimers());
      listbox = getByRole('listbox');
      items = within(listbox).getAllByRole('option');
      expect(document.activeElement).toBe(items[2]);
      fireEvent.keyDown(listbox, {key: 'n'});
      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveTextContent('None');
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(onSelectionChange).toHaveBeenLastCalledWith('');
    });

    it('does not deselect when pressing an already selected item', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" defaultSelectedKey="two" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );
      let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
      let picker = selectTester.trigger;
      expect(picker).toHaveTextContent('Two');
      await selectTester.open();

      let items = selectTester.options;
      expect(document.activeElement).toBe(items[1]);

      await selectTester.selectOption({optionText: 'Two'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith('two');

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Two');
    });

    it('move selection on Arrow-Left/Right', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      await user.tab();
      expect(picker).toHaveTextContent('Select…');
      await user.keyboard('{ArrowLeft}');
      act(() => jest.runAllTimers());
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('one');
      expect(picker).toHaveTextContent('One');

      await user.keyboard('{ArrowLeft}');
      expect(picker).toHaveTextContent('One');

      await user.keyboard('{ArrowRight}');
      expect(picker).toHaveTextContent('Two');
      expect(onSelectionChange).toHaveBeenCalledTimes(2);

      await user.keyboard('{ArrowRight}');
      expect(picker).toHaveTextContent('Three');
      expect(onSelectionChange).toHaveBeenCalledTimes(3);

      await user.keyboard('{ArrowRight}');
      expect(picker).toHaveTextContent('Three');
      expect(onSelectionChange).toHaveBeenCalledTimes(3);

      await user.keyboard('{ArrowLeft}');
      expect(picker).toHaveTextContent('Two');
      expect(onSelectionChange).toHaveBeenCalledTimes(4);

      await user.keyboard('{ArrowLeft}');
      expect(picker).toHaveTextContent('One');
      expect(onSelectionChange).toHaveBeenCalledTimes(5);
    });
  });

  describe('type to select', function () {
    it('supports focusing items by typing letters in rapid succession without opening the menu', function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      act(() => {picker.focus();});
      expect(picker).toHaveTextContent('Select…');

      fireEvent.keyDown(picker, {key: 't'});
      fireEvent.keyUp(picker, {key: 't'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('two');
      expect(picker).toHaveTextContent('Two');

      fireEvent.keyDown(picker, {key: 'h'});
      fireEvent.keyUp(picker, {key: 'h'});
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(onSelectionChange).toHaveBeenLastCalledWith('three');
      expect(picker).toHaveTextContent('Three');
    });

    it('resets the search text after a timeout', function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      act(() => {picker.focus();});
      expect(picker).toHaveTextContent('Select…');

      fireEvent.keyDown(picker, {key: 't'});
      fireEvent.keyUp(picker, {key: 't'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('two');
      expect(picker).toHaveTextContent('Two');

      act(() => {jest.runAllTimers();});

      fireEvent.keyDown(picker, {key: 'h'});
      fireEvent.keyUp(picker, {key: 'h'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(picker).toHaveTextContent('Two');
    });

    it('wraps around when no items past the current one match', function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      act(() => {picker.focus();});
      expect(picker).toHaveTextContent('Select…');

      fireEvent.keyDown(picker, {key: 't'});
      fireEvent.keyUp(picker, {key: 't'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('two');
      expect(picker).toHaveTextContent('Two');

      act(() => {jest.runAllTimers();});

      fireEvent.keyDown(picker, {key: 'o'});
      fireEvent.keyUp(picker, {key: 'o'});
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(picker).toHaveTextContent('One');
    });
  });

  describe('autofill', function () {
    it('should have a hidden select element for form autocomplete', function () {
      let {getByText, getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" autoComplete="address-level1" items={states} onSelectionChange={onSelectionChange}>
            {item => <Item key={item.abbr}>{item.name}</Item>}
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      expect(picker).toHaveTextContent('Select…');

      let hiddenLabel = getByText('Test', {hidden: true, selector: 'label'});
      expect(hiddenLabel.tagName).toBe('LABEL');
      expect(hiddenLabel.parentElement).toHaveAttribute('aria-hidden', 'true');

      let hiddenSelect = getByRole('combobox', {hidden: true});
      expect(hiddenSelect.parentElement).toBe(hiddenLabel);
      expect(hiddenSelect).toHaveAttribute('tabIndex', '-1');
      expect(hiddenSelect).toHaveAttribute('autoComplete', 'address-level1');

      let options = within(hiddenSelect).getAllByRole('option', {hidden: true});
      expect(options.length).toBe(60);
      options.forEach((option, index) => index > 0 && expect(option).toHaveTextContent(states[index - 1].name));

      fireEvent.change(hiddenSelect, {target: {value: 'CA'}});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('CA');
      expect(picker).toHaveTextContent('California');
    });
  });

  describe('async loading', function () {
    it('should display a spinner while loading', function () {
      let {getByRole, getByText, rerender} = render(
        <Provider theme={theme}>
          <Picker label="Test" items={[]} isLoading>
            {item => <Item>{item.name}</Item>}
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      let progressbar = within(picker).getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Loading…');
      expect(progressbar).not.toHaveAttribute('aria-valuenow');
      expect(picker).toHaveAttribute('aria-describedby', `${progressbar.id}`);

      rerender(
        <Provider theme={theme}>
          <Picker label="Test" items={[]}>
            {item => <Item>{item.name}</Item>}
          </Picker>
        </Provider>
      );

      expect(progressbar).not.toBeInTheDocument();
      expect(picker).not.toHaveAttribute('aria-describedby');

      rerender(
        <Provider theme={theme}>
          <Picker label="Test" description="Please select an item." items={[]} isLoading>
            {item => <Item>{item.name}</Item>}
          </Picker>
        </Provider>
      );

      let description = getByText('Please select an item.');
      expect(description).toHaveAttribute('id');
      expect(picker).toHaveAttribute('aria-describedby', `${description.id} ${progressbar.id}`);

      rerender(
        <Provider theme={theme}>
          <Picker label="Test" description="Please select an item." items={[]}>
            {item => <Item>{item.name}</Item>}
          </Picker>
        </Provider>
      );

      expect(progressbar).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-describedby', `${description.id}`);
    });

    it('should display a spinner inside the listbox when loading more', async function () {
      let items = [{name: 'Foo'}, {name: 'Bar'}];
      let {getByRole, rerender} = render(
        <Provider theme={theme}>
          <Picker label="Test" items={items} isLoading>
            {item => <Item key={item.name}>{item.name}</Item>}
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(options.length).toBe(3);

      let progressbar = within(options[2]).getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Loading more…');
      expect(progressbar).not.toHaveAttribute('aria-valuenow');

      rerender(
        <Provider theme={theme}>
          <Picker label="Test" items={items}>
            {item => <Item key={item.name}>{item.name}</Item>}
          </Picker>
        </Provider>
      );

      options = within(listbox).getAllByRole('option');
      expect(options.length).toBe(2);
      expect(progressbar).not.toBeInTheDocument();
    });
  });

  describe('disabled', function () {
    it('does not open on mouse down when isDisabled is true', async function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker isDisabled label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();

      let picker = getByRole('button');
      await user.click(picker);
      act(() => jest.runAllTimers());

      expect(queryByRole('listbox')).toBeNull();

      expect(onOpenChange).toBeCalledTimes(0);

      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).not.toBe(picker);
    });

    it('does not open on Space key press when isDisabled is true', function () {
      let onOpenChange = jest.fn();
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker isDisabled label="Test" onOpenChange={onOpenChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();

      let picker = getByRole('button');
      fireEvent.keyDown(picker, {key: ' '});
      fireEvent.keyUp(picker, {key: ' '});
      act(() => jest.runAllTimers());

      expect(queryByRole('listbox')).toBeNull();

      expect(onOpenChange).toBeCalledTimes(0);

      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).not.toBe(picker);
    });
  });

  describe('focus', function () {
    let focusSpies;

    beforeEach(() => {
      focusSpies = {
        onFocus: jest.fn(),
        onBlur: jest.fn(),
        onFocusChange: jest.fn()
      };
    });

    it('supports autofocus', function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" {...focusSpies} autoFocus>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
            <Item key="">None</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      expect(document.activeElement).toBe(picker);
      expect(focusSpies.onFocus).toHaveBeenCalled();
      expect(focusSpies.onFocusChange).toHaveBeenCalledWith(true);
    });

    it('calls onBlur and onFocus for the closed Picker', async function () {
      let {getByTestId} = render(
        <Provider theme={theme}>
          <button data-testid="before" />
          <Picker data-testid="picker" label="Test" {...focusSpies} autoFocus>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
            <Item key="">None</Item>
          </Picker>
          <button data-testid="after" />
        </Provider>
      );
      let beforeBtn = getByTestId('before');
      let afterBtn = getByTestId('after');
      let picker = getByTestId('picker');
      expect(document.activeElement).toBe(picker);
      expect(focusSpies.onFocus).toHaveBeenCalledTimes(1);
      expect(focusSpies.onFocusChange).toHaveBeenCalledTimes(1);
      expect(focusSpies.onFocusChange).toHaveBeenNthCalledWith(1, true);

      await user.tab();
      expect(document.activeElement).toBe(afterBtn);
      expect(focusSpies.onBlur).toHaveBeenCalledTimes(1);
      expect(focusSpies.onFocusChange).toHaveBeenCalledTimes(2);
      expect(focusSpies.onFocusChange).toHaveBeenNthCalledWith(2, false);

      await user.tab({shift: true});
      expect(focusSpies.onFocus).toHaveBeenCalledTimes(2);
      expect(focusSpies.onFocusChange).toHaveBeenNthCalledWith(3, true);

      await user.tab({shift: true});
      expect(focusSpies.onBlur).toHaveBeenCalledTimes(2);
      expect(focusSpies.onFocusChange).toHaveBeenNthCalledWith(4, false);
      expect(document.activeElement).toBe(beforeBtn);
    });

    it('calls onBlur and onFocus for the open Picker', async function () {
      let {getByRole, getByTestId} = render(
        <Provider theme={theme}>
          <button data-testid="before" />
          <Picker data-testid="picker" label="Test" {...focusSpies} autoFocus>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
            <Item key="">None</Item>
          </Picker>
          <button data-testid="after" />
        </Provider>
      );
      let beforeBtn = getByTestId('before');
      let afterBtn = getByTestId('after');
      let picker = getByTestId('picker');

      fireEvent.keyDown(picker, {key: 'ArrowDown'});
      fireEvent.keyUp(picker, {key: 'ArrowDown'});
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      let items = within(listbox).getAllByRole('option');
      expect(document.activeElement).toBe(items[0]);

      await user.tab();
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(afterBtn);
      expect(focusSpies.onBlur).toHaveBeenCalledTimes(1);

      await user.tab({shift: true});
      expect(focusSpies.onFocus).toHaveBeenCalledTimes(2);
      expect(focusSpies.onFocusChange).toHaveBeenNthCalledWith(1, true);
      expect(focusSpies.onFocusChange).toHaveBeenNthCalledWith(2, false);
      expect(focusSpies.onFocusChange).toHaveBeenNthCalledWith(3, true);

      fireEvent.keyDown(picker, {key: 'ArrowDown'});
      fireEvent.keyUp(picker, {key: 'ArrowDown'});
      act(() => jest.runAllTimers());
      listbox = getByRole('listbox');
      items = within(listbox).getAllByRole('option');
      expect(document.activeElement).toBe(items[0]);

      await user.tab({shift: true});
      act(() => jest.runAllTimers());
      expect(focusSpies.onBlur).toHaveBeenCalledTimes(2);
      expect(focusSpies.onFocusChange).toHaveBeenNthCalledWith(4, false);

      expect(document.activeElement).toBe(beforeBtn);
    });

    it('does not call blur when an item is selected', function () {
      let otherButtonFocus = jest.fn();
      let {getByRole, getByTestId} = render(
        <Provider theme={theme}>
          <button data-testid="before" onFocus={otherButtonFocus} />
          <Picker data-testid="picker" label="Test" {...focusSpies} autoFocus>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
            <Item key="">None</Item>
          </Picker>
          <button data-testid="after" onFocus={otherButtonFocus} />
        </Provider>
      );
      let picker = getByTestId('picker');
      expect(focusSpies.onFocus).toHaveBeenCalledTimes(1);
      expect(focusSpies.onFocusChange).toHaveBeenCalledTimes(1);
      expect(focusSpies.onFocusChange).toHaveBeenCalledWith(true);
      fireEvent.keyDown(picker, {key: 'ArrowDown'});
      fireEvent.keyUp(picker, {key: 'ArrowDown'});
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      let items = within(listbox).getAllByRole('option');
      expect(document.activeElement).toBe(items[0]);
      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      expect(focusSpies.onFocus).toHaveBeenCalledTimes(1);
      expect(focusSpies.onFocusChange).toHaveBeenCalledTimes(1);
      expect(focusSpies.onFocusChange).toHaveBeenCalledWith(true);

      expect(focusSpies.onBlur).not.toHaveBeenCalled();
      expect(otherButtonFocus).not.toHaveBeenCalled();
    });
  });

  describe('form', function () {
    it('Should submit empty option by default', function () {
      let value;
      let onSubmit = jest.fn(e => {
        e.preventDefault();
        let formData = new FormData(e.currentTarget);
        value = Object.fromEntries(formData).picker;
      });
      let {getByTestId} = render(
        <Provider theme={theme}>
          <form data-testid="form" onSubmit={onSubmit}>
            <Picker name="picker" label="Test" autoFocus>
              <Item key="one">One</Item>
              <Item key="two">Two</Item>
              <Item key="three">Three</Item>
            </Picker>
            <button type="submit" data-testid="submit">
              submit
            </button>
          </form>
        </Provider>
      );
      fireEvent.submit(getByTestId('form'));
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(value).toEqual('');
    });

    it('Should submit default option', function () {
      let value;
      let onSubmit = jest.fn(e => {
        e.preventDefault();
        let formData = new FormData(e.currentTarget);
        value = Object.fromEntries(formData).picker;
      });
      let {getByTestId} = render(
        <Provider theme={theme}>
          <form data-testid="form" onSubmit={onSubmit}>
            <Picker defaultSelectedKey="one" name="picker" label="Test" autoFocus>
              <Item key="one">One</Item>
              <Item key="two">Two</Item>
              <Item key="three">Three</Item>
            </Picker>
            <button type="submit" data-testid="submit">
              submit
            </button>
          </form>
        </Provider>
      );
      fireEvent.submit(getByTestId('form'));
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(value).toEqual('one');
    });

    it('supports form reset', async () => {
      function Test() {
        let [value, setValue] = React.useState('one');
        return (
          <Provider theme={theme}>
            <form>
              <Picker name="picker" data-testid="picker" label="Test" selectedKey={value} onSelectionChange={setValue}>
                <Item key="one">One</Item>
                <Item key="two">Two</Item>
                <Item key="three">Three</Item>
              </Picker>
              <input type="reset" data-testid="reset" />
            </form>
          </Provider>
        );
      }

      let {getByTestId, getByRole} = render(<Test />);
      let picker = getByTestId('picker');
      let input = document.querySelector('[name=picker]');

      expect(input).toHaveValue('one');
      await user.click(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      await user.click(items[1]);
      expect(input).toHaveValue('two');

      let button = getByTestId('reset');
      await user.click(button);
      expect(input).toHaveValue('one');
    });

    describe('validation', () => {
      describe('validationBehavior=native', () => {
        it('supports isRequired', async () => {
          let {getByTestId, getByRole} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <Picker name="picker" data-testid="picker" label="Test" isRequired validationBehavior="native">
                  <Item key="one">One</Item>
                  <Item key="two">Two</Item>
                  <Item key="three">Three</Item>
                </Picker>
              </Form>
            </Provider>
          );
          let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
          let picker = selectTester.trigger;
          let input = document.querySelector('[name=picker]');
          expect(input).toHaveAttribute('required');
          expect(picker).not.toHaveAttribute('aria-describedby');
          expect(input.validity.valid).toBe(false);

          act(() => {getByTestId('form').checkValidity();});

          expect(picker).toHaveAttribute('aria-describedby');
          expect(document.getElementById(picker.getAttribute('aria-describedby'))).toHaveTextContent('Constraints not satisfied');
          expect(document.activeElement).toBe(picker);

          await selectTester.selectOption({optionText: 'One'});
          expect(picker).not.toHaveAttribute('aria-describedby');
        });

        it('supports validate function', async () => {
          let {getByTestId, getByRole} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <Picker name="picker" data-testid="picker" label="Test" defaultSelectedKey="two" validationBehavior="native" validate={v => v === 'two' ? 'Invalid value' : null}>
                  <Item key="one">One</Item>
                  <Item key="two">Two</Item>
                  <Item key="three">Three</Item>
                </Picker>
              </Form>
            </Provider>
          );
          let selectTester = testUtilUser.createTester('Select', {root: getByRole('button')});
          let picker = selectTester.trigger;
          let input = document.querySelector('[name=picker]');
          expect(picker).not.toHaveAttribute('aria-describedby');
          expect(input.validity.valid).toBe(false);

          act(() => {getByTestId('form').checkValidity();});

          expect(picker).toHaveAttribute('aria-describedby');
          expect(document.getElementById(picker.getAttribute('aria-describedby'))).toHaveTextContent('Invalid value');
          expect(document.activeElement).toBe(picker);

          await selectTester.selectOption({optionText: 'One'});
          expect(picker).not.toHaveAttribute('aria-describedby');
        });

        it('supports server validation', async () => {
          function Test() {
            let [serverErrors, setServerErrors] = React.useState({});
            let onSubmit = e => {
              e.preventDefault();
              setServerErrors({
                picker: 'Invalid value.'
              });
            };

            return (
              <Provider theme={theme}>
                <Form onSubmit={onSubmit} validationErrors={serverErrors}>
                  <Picker name="picker" data-testid="picker" label="Test" validationBehavior="native" >
                    <Item key="one">One</Item>
                    <Item key="two">Two</Item>
                    <Item key="three">Three</Item>
                  </Picker>
                  <Button type="submit" data-testid="submit">Submit</Button>
                </Form>
              </Provider>
            );
          }

          let {getByTestId} = render(<Test />);
          let selectTester = testUtilUser.createTester('Select', {root: getByTestId('picker')});
          let picker = selectTester.trigger;
          let input = document.querySelector('[name=picker]');
          expect(picker).not.toHaveAttribute('aria-describedby');

          await user.click(getByTestId('submit'));

          expect(picker).toHaveAttribute('aria-describedby');
          expect(document.getElementById(picker.getAttribute('aria-describedby'))).toHaveTextContent('Invalid value.');
          expect(input.validity.valid).toBe(false);

          await selectTester.selectOption({optionText: 'One'});
          expect(picker).not.toHaveAttribute('aria-describedby');
          expect(input.validity.valid).toBe(true);
        });

        it('supports customizing native error messages', async () => {
          let {getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <Picker name="picker" data-testid="picker" label="Test" isRequired validationBehavior="native" errorMessage={e => e.validationDetails.valueMissing ? 'Please enter a value' : null}>
                  <Item key="one">One</Item>
                  <Item key="two">Two</Item>
                  <Item key="three">Three</Item>
                </Picker>
              </Form>
            </Provider>
          );

          let picker = getByTestId('picker');
          expect(picker).not.toHaveAttribute('aria-describedby');

          act(() => {getByTestId('form').checkValidity();});
          expect(picker).toHaveAttribute('aria-describedby');
          expect(document.getElementById(picker.getAttribute('aria-describedby'))).toHaveTextContent('Please enter a value');
        });

        it('clears validation on reset', async () => {
          let {getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <Picker name="picker" data-testid="picker" label="Test" isRequired validationBehavior="native">
                  <Item key="one">One</Item>
                  <Item key="two">Two</Item>
                  <Item key="three">Three</Item>
                </Picker>
                <Button data-testid="reset" type="reset">Reset</Button>
              </Form>
            </Provider>
          );
          let selectTester = testUtilUser.createTester('Select', {root: getByTestId('picker')});
          let picker = selectTester.trigger;
          let input = document.querySelector('[name=picker]');
          expect(input).toHaveAttribute('required');
          expect(picker).not.toHaveAttribute('aria-describedby');
          expect(input.validity.valid).toBe(false);

          act(() => {getByTestId('form').checkValidity();});

          expect(picker).toHaveAttribute('aria-describedby');
          expect(document.getElementById(picker.getAttribute('aria-describedby'))).toHaveTextContent('Constraints not satisfied');

          await selectTester.selectOption({optionText: 'One'});
          expect(picker).not.toHaveAttribute('aria-describedby');

          await user.click(getByTestId('reset'));
          expect(picker).not.toHaveAttribute('aria-describedby');
        });
      });

      describe('validationBehavior=aria', () => {
        it('supports validate function', async () => {
          let {getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <Picker name="picker" data-testid="picker" label="Test" defaultSelectedKey="two" validate={v => v === 'two' ? 'Invalid value' : null}>
                  <Item key="one">One</Item>
                  <Item key="two">Two</Item>
                  <Item key="three">Three</Item>
                </Picker>
              </Form>
            </Provider>
          );
          let selectTester = testUtilUser.createTester('Select', {root: getByTestId('picker')});
          let picker = selectTester.trigger;
          let input = document.querySelector('[name=picker]');
          expect(picker).toHaveAttribute('aria-describedby');
          expect(document.getElementById(picker.getAttribute('aria-describedby'))).toHaveTextContent('Invalid value');
          expect(input.validity.valid).toBe(true);

          await selectTester.selectOption({optionText: 'One'});
          expect(picker).not.toHaveAttribute('aria-describedby');
        });

        it('supports server validation', async () => {
          let {getByTestId} = render(
            <Provider theme={theme}>
              <Form validationErrors={{picker: 'Invalid value'}}>
                <Picker name="picker" data-testid="picker" label="Test">
                  <Item key="one">One</Item>
                  <Item key="two">Two</Item>
                  <Item key="three">Three</Item>
                </Picker>
              </Form>
            </Provider>
          );
          let selectTester = testUtilUser.createTester('Select', {root: getByTestId('picker')});
          let picker = selectTester.trigger;
          expect(picker).toHaveAttribute('aria-describedby');
          expect(document.getElementById(picker.getAttribute('aria-describedby'))).toHaveTextContent('Invalid value');

          await selectTester.selectOption({optionText: 'One'});
          expect(picker).not.toHaveAttribute('aria-describedby');
        });
      });
    });
  });

  describe('links', () => {
    it.each(['mouse', 'keyboard'])('supports links on items with %s', async (type) => {
      let tree = render(
        <Provider theme={theme}>
          <Picker label="Picker with links">
            <Item href="https://google.com">One</Item>
            <Item href="https://adobe.com">Two</Item>
          </Picker>
        </Provider>
      );

      let button = tree.getByRole('button');
      await user.click(button);
      act(() => {
        jest.runAllTimers();
      });

      let listbox = tree.getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items).toHaveLength(2);
      expect(items[0].tagName).toBe('A');
      expect(items[0]).toHaveAttribute('href', 'https://google.com');
      expect(items[1].tagName).toBe('A');
      expect(items[1]).toHaveAttribute('href', 'https://adobe.com');

      let onClick = jest.fn().mockImplementation(e => e.preventDefault());
      window.addEventListener('click', onClick);
      if (type === 'mouse') {
        await user.click(items[0]);
      } else {
        fireEvent.keyDown(items[0], {key: 'Enter'});
        fireEvent.keyUp(items[0], {key: 'Enter'});
      }
      act(() => {
        jest.runAllTimers();
      });

      expect(button).toHaveTextContent('Select…');
      expect(listbox).not.toBeInTheDocument();
      expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
      expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');
      window.removeEventListener('click', onClick);
    });

    it('works with RouterProvider', async () => {
      let navigate = jest.fn();
      let useHref = href => '/base' + href;
      let tree = render(
        <Provider theme={theme} router={{navigate, useHref}}>
          <Picker label="Picker with links">
            <Item href="/one" routerOptions={{foo: 'bar'}}>One</Item>
            <Item href="https://adobe.com">Two</Item>
          </Picker>
        </Provider>
      );

      let button = tree.getByRole('button');
      await user.click(button);
      act(() => {
        jest.runAllTimers();
      });

      let listbox = tree.getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items[0]).toHaveAttribute('href', '/base/one');
      mockClickDefault();
      await user.click(items[0]);
      expect(navigate).toHaveBeenCalledWith('/one', {foo: 'bar'});
    });
  });
});
