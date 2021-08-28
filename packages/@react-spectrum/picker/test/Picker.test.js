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

import {act, fireEvent, render, within} from '@testing-library/react';
import AlignCenter from '@spectrum-icons/workflow/AlignCenter';
import AlignLeft from '@spectrum-icons/workflow/AlignLeft';
import AlignRight from '@spectrum-icons/workflow/AlignRight';
import Copy from '@spectrum-icons/workflow/Copy';
import Cut from '@spectrum-icons/workflow/Cut';
import {Item, Picker, Section} from '../src';
import Paste from '@spectrum-icons/workflow/Paste';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {Text} from '@react-spectrum/text';
import {theme} from '@react-spectrum/theme-default';
import {triggerPress} from '@react-spectrum/test-utils';
import userEvent from '@testing-library/user-event';

describe('Picker', function () {
  let offsetWidth, offsetHeight;
  let onSelectionChange = jest.fn();

  beforeAll(function () {
    offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    jest.spyOn(window.screen, 'width', 'get').mockImplementation(() => 1024);
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 0));
    jest.useFakeTimers();
  });

  afterAll(function () {
    jest.useRealTimers();
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

    let select = getByRole('textbox', {hidden: true});
    expect(select).not.toBeDisabled();

    let picker = getByRole('button');
    expect(picker).toHaveAttribute('aria-haspopup', 'listbox');
    expect(picker).toHaveAttribute('data-testid', 'test');

    let label = getAllByText('Test')[0];
    let value = getByText('Select an option…');
    expect(label).toBeVisible();
    expect(value).toBeVisible();
  });

  describe('opening', function () {
    it('can be opened on mouse down', function () {
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
      // make sure to run through mousedown AND mouseup, like would really happen, otherwise a mouseup listener
      // sits around until the component is unmounted
      triggerPress(picker);
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

    it('can be opened on Enter key down', function () {
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
      fireEvent.keyDown(picker, {key: 'Enter'});
      fireEvent.keyUp(picker, {key: 'Enter'});
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

      let picker = getByLabelText('Select an option…');
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

      let picker = getByLabelText('Select an option…');
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(listbox);
    });
  });

  describe('closing', function () {
    it('can be closed by clicking on the button', function () {
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
      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      triggerPress(picker);
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);

      expect(document.activeElement).toBe(picker);
    });

    it('can be closed by clicking outside', function () {
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
      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      triggerPress(document.body);
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('can be closed by pressing the Escape key', function () {
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
      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      fireEvent.keyDown(listbox, {key: 'Escape'});
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);

      expect(document.activeElement).toBe(picker);
    });

    it('closes on blur', function () {
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
      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      act(() => {document.activeElement.blur();});
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);

      expect(document.activeElement).not.toBe(picker);
    });

    it('closes on scroll on a parent element', function () {
      let onOpenChange = jest.fn();
      let {getByRole, getByTestId, queryByRole} = render(
        <Provider theme={theme}>
          <div data-testid="scrollable">
            <Picker label="Test" onOpenChange={onOpenChange}>
              <Item>One</Item>
              <Item>Two</Item>
              <Item>Three</Item>
            </Picker>
          </div>
        </Provider>
      );

      expect(queryByRole('listbox')).toBeNull();

      let picker = getByRole('button');
      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(onOpenChange).toBeCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(picker).toHaveAttribute('aria-expanded', 'true');
      expect(picker).toHaveAttribute('aria-controls', listbox.id);

      let scrollable = getByTestId('scrollable');
      fireEvent.scroll(scrollable);
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);

      expect(document.activeElement).toBe(picker);
    });

    it('tabs to the next element after the trigger and closes the menu', function () {
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
      triggerPress(picker);
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

    it('shift tabs to the previous element before the trigger and closes the menu', function () {
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
      triggerPress(picker);
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
      triggerPress(picker);
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

      triggerPress(dismissButtons[0]);
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      act(() => jest.runAllTimers());

      expect(listbox).not.toBeInTheDocument();
      expect(picker).toHaveAttribute('aria-expanded', 'false');
      expect(picker).not.toHaveAttribute('aria-controls');
      expect(onOpenChange).toBeCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);

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

      let picker = getByLabelText('Select an option…');
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

      let picker = getByLabelText('Select an option…');
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
      label.click();

      let picker = getByRole('button');
      expect(document.activeElement).toBe(picker);
    });

    it('supports labeling with a visible label', function () {
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
      let value = getByText('Select an option…');
      expect(label).toHaveAttribute('id');
      expect(value).toHaveAttribute('id');
      expect(picker).toHaveAttribute('aria-labelledby', `${label.id} ${value.id}`);

      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(listbox).toHaveAttribute('aria-labelledby', label.id);
    });

    it('supports labeling via aria-label', function () {
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
      let value = getByText('Select an option…');
      expect(picker).toHaveAttribute('id');
      expect(value).toHaveAttribute('id');
      expect(picker).toHaveAttribute('aria-label', 'Test');
      expect(picker).toHaveAttribute('aria-labelledby', `${picker.id} ${value.id}`);

      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(listbox).toHaveAttribute('aria-labelledby', picker.id);
    });

    it('supports labeling via aria-labelledby', function () {
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
      let value = getByText('Select an option…');
      expect(picker).toHaveAttribute('id');
      expect(value).toHaveAttribute('id');
      expect(picker).toHaveAttribute('aria-labelledby', `foo ${value.id}`);

      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(listbox).toHaveAttribute('aria-labelledby', 'foo');
    });

    it('supports labeling via aria-label and aria-labelledby', function () {
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
      let value = getByText('Select an option…');
      expect(picker).toHaveAttribute('id');
      expect(value).toHaveAttribute('id');
      expect(picker).toHaveAttribute('aria-label', 'Test');
      expect(picker).toHaveAttribute('aria-labelledby', `foo ${picker.id} ${value.id}`);

      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(listbox).toHaveAttribute('aria-labelledby', `foo ${picker.id}`);
    });

    describe('isRequired', function () {
      it('supports labeling with a visible label that includes the necessity indicator', function () {
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
        let value = getByText('Select an option…');
        expect(label).toHaveAttribute('id');
        expect(value).toHaveAttribute('id');
        expect(picker).toHaveAttribute('aria-labelledby', `${label.id} ${value.id}`);

        triggerPress(picker);
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
            <Picker label="Test" errorMessage="Please select a valid item." validationState="invalid" onSelectionChange={onSelectionChange}>
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
    it('can select items on press', function () {
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
      expect(picker).toHaveTextContent('Select an option…');
      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(listbox);

      triggerPress(items[2]);
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('three');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Three');
    });

    it('can select items with falsy keys', function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="">Empty</Item>
            <Item key={0}>Zero</Item>
            <Item key={false}>False</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      expect(picker).toHaveTextContent('Select an option…');
      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('Empty');
      expect(items[1]).toHaveTextContent('Zero');
      expect(items[2]).toHaveTextContent('False');

      expect(document.activeElement).toBe(listbox);

      triggerPress(items[0]);
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Empty');

      triggerPress(picker);
      act(() => jest.runAllTimers());

      listbox = getByRole('listbox');
      let item1 = within(listbox).getByText('Zero');

      triggerPress(item1);
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(onSelectionChange).toHaveBeenLastCalledWith('0');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Zero');

      triggerPress(picker);
      act(() => jest.runAllTimers());

      listbox = getByRole('listbox');
      let item2 = within(listbox).getByText('False');

      triggerPress(item2);
      expect(onSelectionChange).toHaveBeenCalledTimes(3);
      expect(onSelectionChange).toHaveBeenLastCalledWith('false');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('False');
    });


    it('can select items with the Space key', function () {
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
      expect(picker).toHaveTextContent('Select an option…');
      triggerPress(picker);
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

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Two');
    });

    it('can select items with the Enter key', function () {
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
      expect(picker).toHaveTextContent('Select an option…');
      act(() => {picker.focus();});

      fireEvent.keyDown(picker, {key: 'ArrowUp'});
      fireEvent.keyUp(picker, {key: 'ArrowUp'});
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(items[2]);

      fireEvent.keyDown(listbox, {key: 'ArrowUp'});
      fireEvent.keyUp(listbox, {key: 'ArrowUp'});
      expect(document.activeElement).toBe(items[1]);

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('two');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Two');
    });

    it('focuses items on hover', function () {
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
      expect(picker).toHaveTextContent('Select an option…');
      triggerPress(picker);
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

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Three');
    });

    it('does not clear selection on escape closing the listbox', function () {
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

      let picker = getByRole('button');
      expect(picker).toHaveTextContent('Select an option…');
      expect(onOpenChangeSpy).toHaveBeenCalledTimes(0);
      triggerPress(picker);
      act(() => jest.runAllTimers());
      expect(onOpenChangeSpy).toHaveBeenCalledTimes(1);

      let listbox = getByRole('listbox');
      let label = getAllByText('Test')[0];
      expect(listbox).toBeVisible();
      expect(listbox).toHaveAttribute('aria-labelledby', label.id);

      let item1 = within(listbox).getByText('One');
      let item2 = within(listbox).getByText('Two');
      let item3 = within(listbox).getByText('Three');
      expect(item1).toBeTruthy();
      expect(item2).toBeTruthy();
      expect(item3).toBeTruthy();

      triggerPress(item3);
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      act(() => jest.runAllTimers());
      expect(onOpenChangeSpy).toHaveBeenCalledTimes(2);
      expect(queryByRole('listbox')).toBeNull();


      triggerPress(picker);
      act(() => jest.runAllTimers());
      expect(onOpenChangeSpy).toHaveBeenCalledTimes(3);

      listbox = getByRole('listbox');
      item1 = within(listbox).getByText('One');

      // act callback must return a Promise or undefined, so we return undefined here
      act(() => {
        fireEvent.keyDown(item1, {key: 'Escape'});
      });
      expect(onSelectionChange).toHaveBeenCalledTimes(1); // still expecting it to have only been called once
      act(() => jest.runAllTimers());
      expect(onOpenChangeSpy).toHaveBeenCalledTimes(4);
      expect(queryByRole('listbox')).toBeNull();

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Three');
    });

    it('supports controlled selection', function () {
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
      triggerPress(picker);
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

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Two');
    });

    it('supports default selection', function () {
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
      triggerPress(picker);
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

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('One');
    });

    it('skips disabled items', function () {
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
      expect(picker).toHaveTextContent('Select an option…');
      triggerPress(picker);
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

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Three');
    });

    it('supports sections and complex items', function () {
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

      let picker = getByRole('button');
      expect(picker).toHaveTextContent('Select an option…');
      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(6);

      let groups = within(listbox).getAllByRole('group');
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

      expect(getByText('Section 1')).toHaveAttribute('aria-hidden', 'true');
      expect(groups[1]).toHaveAttribute('aria-labelledby', getByText('Section 2').id);
      expect(getByText('Section 2')).toHaveAttribute('aria-hidden', 'true');

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

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Cut');
      expect(getAllByRole('img', {hidden: true})).toHaveLength(2);

      // Open again
      triggerPress(picker);
      act(() => jest.runAllTimers());

      listbox = getByRole('listbox');
      items = within(listbox).getAllByRole('option', {hidden: true});
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
      expect(picker).toHaveTextContent('Select an option…');
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

    it('does not deselect when pressing an already selected item', function () {
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
      triggerPress(picker);
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');

      expect(document.activeElement).toBe(items[1]);

      triggerPress(items[1]);
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith('two');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Two');
    });

    it('move selection on Arrow-Left/Right', function () {
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
      expect(picker).toHaveTextContent('Select an option…');
      fireEvent.keyDown(picker, {key: 'ArrowLeft'});
      act(() => jest.runAllTimers());
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(picker).toHaveTextContent('One');

      fireEvent.keyDown(picker, {key: 'ArrowLeft'});
      expect(picker).toHaveTextContent('One');

      fireEvent.keyDown(picker, {key: 'ArrowRight'});
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(picker).toHaveTextContent('Two');

      fireEvent.keyDown(picker, {key: 'ArrowRight'});
      expect(onSelectionChange).toHaveBeenCalledTimes(3);
      expect(picker).toHaveTextContent('Three');

      fireEvent.keyDown(picker, {key: 'ArrowRight'});
      expect(onSelectionChange).toHaveBeenCalledTimes(3);
      expect(picker).toHaveTextContent('Three');

      fireEvent.keyDown(picker, {key: 'ArrowLeft'});
      expect(onSelectionChange).toHaveBeenCalledTimes(4);
      expect(picker).toHaveTextContent('Two');

      fireEvent.keyDown(picker, {key: 'ArrowLeft'});
      expect(onSelectionChange).toHaveBeenCalledTimes(5);
      expect(picker).toHaveTextContent('One');
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
      expect(picker).toHaveTextContent('Select an option…');

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
      expect(picker).toHaveTextContent('Select an option…');

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
      expect(picker).toHaveTextContent('Select an option…');

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
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      expect(picker).toHaveTextContent('Select an option…');

      let hiddenLabel = getByText('Test', {hidden: true, selector: 'label'});
      expect(hiddenLabel.tagName).toBe('LABEL');
      expect(hiddenLabel.parentElement).toHaveAttribute('aria-hidden', 'true');

      // For anyone else who comes through this listbox/combobox path
      // I can't use combobox here because there is a size attribute on the html select
      // everything below this line is the path i followed to get to the correct role:
      //   not sure why i can't use listbox https://github.com/A11yance/aria-query#elements-to-roles
      //   however, i think this is correct based on https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles
      //   which says "The listbox role is used for lists from which a user may select one or more items which are static and, unlike HTML <select> elements, may contain images."
      //   Also, this test in react testing library seems to indicate something about size which we do not currently have, probably a bug
      //   https://github.com/testing-library/dom-testing-library/blob/master/src/__tests__/element-queries.js#L548
      let hiddenSelect = getByRole('listbox', {hidden: true});
      expect(hiddenSelect.parentElement).toBe(hiddenLabel);
      expect(hiddenSelect).toHaveAttribute('tabIndex', '-1');

      let options = within(hiddenSelect).getAllByRole('option', {hidden: true});
      expect(options.length).toBe(4);
      expect(options[0]).toHaveTextContent('');
      expect(options[1]).toHaveTextContent('One');
      expect(options[2]).toHaveTextContent('Two');
      expect(options[3]).toHaveTextContent('Three');

      fireEvent.change(hiddenSelect, {target: {value: 'two'}});
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('two');
      expect(picker).toHaveTextContent('Two');
    });

    it('should have a hidden input to marshall focus to the button', function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" onSelectionChange={onSelectionChange}>
            <Item>One</Item>
            <Item>Two</Item>
            <Item>Three</Item>
          </Picker>
        </Provider>
      );

      let hiddenInput = getByRole('textbox', {hidden: true}); // get the hidden ones
      expect(hiddenInput).toHaveAttribute('tabIndex', '0');
      expect(hiddenInput).toHaveAttribute('style', 'font-size: 16px;');
      expect(hiddenInput.parentElement).toHaveAttribute('aria-hidden', 'true');

      act(() => hiddenInput.focus());

      let button = getByRole('button');
      expect(document.activeElement).toBe(button);
      expect(hiddenInput).toHaveAttribute('tabIndex', '-1');

      act(() => button.blur());

      expect(hiddenInput).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('async loading', function () {
    it('should display a spinner while loading', function () {
      let {getByRole, rerender} = render(
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

      rerender(
        <Provider theme={theme}>
          <Picker label="Test" items={[]}>
            {item => <Item>{item.name}</Item>}
          </Picker>
        </Provider>
      );

      expect(progressbar).not.toBeInTheDocument();
    });

    it('should display a spinner inside the listbox when loading more', function () {
      let items = [{name: 'Foo'}, {name: 'Bar'}];
      let {getByRole, rerender} = render(
        <Provider theme={theme}>
          <Picker label="Test" items={items} isLoading>
            {item => <Item key={item.name}>{item.name}</Item>}
          </Picker>
        </Provider>
      );

      let picker = getByRole('button');
      triggerPress(picker);
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
    it('disables the hidden select when isDisabled is true', function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Picker isDisabled label="Test" onSelectionChange={onSelectionChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let select = getByRole('textbox', {hidden: true});

      expect(select).toBeDisabled();
    });

    it('does not open on mouse down when isDisabled is true', function () {
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
      triggerPress(picker);
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
        onBlur: jest.fn()
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
    });

    it('calls onBlur and onFocus for the closed Picker', function () {
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

      userEvent.tab();
      expect(document.activeElement).toBe(afterBtn);
      expect(focusSpies.onBlur).toHaveBeenCalledTimes(1);
      userEvent.tab({shift: true});
      expect(focusSpies.onFocus).toHaveBeenCalledTimes(2);
      userEvent.tab({shift: true});
      expect(focusSpies.onBlur).toHaveBeenCalledTimes(2);
      expect(document.activeElement).toBe(beforeBtn);
    });

    it('calls onBlur and onFocus for the open Picker', function () {
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

      userEvent.tab();
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(afterBtn);
      expect(focusSpies.onBlur).toHaveBeenCalledTimes(1);

      userEvent.tab({shift: true});
      expect(focusSpies.onFocus).toHaveBeenCalledTimes(2);
      fireEvent.keyDown(picker, {key: 'ArrowDown'});
      fireEvent.keyUp(picker, {key: 'ArrowDown'});
      act(() => jest.runAllTimers());
      listbox = getByRole('listbox');
      items = within(listbox).getAllByRole('option');
      expect(document.activeElement).toBe(items[0]);

      userEvent.tab({shift: true});
      act(() => jest.runAllTimers());
      expect(focusSpies.onBlur).toHaveBeenCalledTimes(2);
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
  });
});
