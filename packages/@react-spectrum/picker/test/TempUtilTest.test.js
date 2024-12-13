/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, pointerMap, renderv3 as render, screen, simulateDesktop, simulateMobile, waitFor, waitForElementToBeRemoved, within} from '@react-spectrum/test-utils-internal';
import {Button, Label, ListBox, ListBoxItem, Popover, Select, SelectValue, Text} from 'react-aria-components';
import {Item, Picker} from '../src';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import {User} from '@react-aria/test-utils';
import userEvent from '@testing-library/user-event';

describe('Picker/Select ', function () {
  let testUtilUser = new User();
  let onSelectionChange = jest.fn();
  let onOpenChange = jest.fn();
  let user;

  beforeAll(function () {
    user = userEvent.setup({delay: null, pointerMap});
    simulateDesktop();
  });

  describe('with real timers', function () {
    beforeAll(function () {
      jest.useRealTimers();
    });

    afterEach(function () {
      jest.clearAllMocks();
    });

    it('basic flow without test util helpers', async function () {
      let {getAllByText, getByText, getByRole, findByRole, queryByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" data-testid="test" onSelectionChange={onSelectionChange} onOpenChange={onOpenChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
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

      await user.click(picker);

      let listbox = await findByRole('listbox');
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

      await user.click(items[2]);

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('three');
      await waitForElementToBeRemoved(() => queryByRole('listbox'));
      await waitFor(() => {
        expect(document.activeElement).toBe(picker);
      }, {interval: 10});

      expect(picker).toHaveTextContent('Three');
    });

    it('basic flow with test util user', async function () {
      render(
        <Provider theme={theme}>
          <div role="listbox">blah</div>
          <Picker label="Test" data-testid="test" onSelectionChange={onSelectionChange} onOpenChange={onOpenChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let selectTester = testUtilUser.createTester('Select', {root: screen.getByTestId('test')});
      await selectTester.selectOption({optionText: 'Three'});
      expect(selectTester.trigger).toHaveTextContent('Three');
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('three');
    });

    it('works with RAC Select', async function () {
      render(
        <Select data-testid="test" onSelectionChange={onSelectionChange}>
          <Label>Favorite Animal</Label>
          <Button>
            <SelectValue />
          </Button>
          <Text slot="description">Description</Text>
          <Text slot="errorMessage">Error</Text>
          <Popover>
            <ListBox>
              <ListBoxItem id="cat">Cat</ListBoxItem>
              <ListBoxItem id="dog">Dog</ListBoxItem>
              <ListBoxItem id="kangaroo">Kangaroo</ListBoxItem>
            </ListBox>
          </Popover>
        </Select>
      );

      let selectTester = testUtilUser.createTester('Select', {root: screen.getByTestId('test')});
      await selectTester.selectOption({optionText: 'Cat'});
      expect(selectTester.trigger).toHaveTextContent('Cat');
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('cat');
    });
  });

  describe('with fake timers', function () {
    beforeAll(function () {
      jest.useFakeTimers();
    });

    afterEach(function () {
      act(() => jest.runAllTimers());
      jest.clearAllMocks();
    });

    it('basic flow without test util helpers', async function () {
      let {getAllByText, getByText, getByRole} = render(
        <Provider theme={theme}>
          <Picker label="Test" data-testid="test" onSelectionChange={onSelectionChange} onOpenChange={onOpenChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
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

      await user.click(picker);
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

      await user.click(items[2]);

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('three');
      act(() => jest.runAllTimers());
      expect(listbox).not.toBeInTheDocument();

      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(picker);
      expect(picker).toHaveTextContent('Three');
    });

    it('basic flow with test util user', async function () {
      render(
        <Provider theme={theme}>
          <Picker label="Test" data-testid="test" onSelectionChange={onSelectionChange} onOpenChange={onOpenChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let selectTester = testUtilUser.createTester('Select', {root: screen.getByTestId('test')});
      await selectTester.selectOption({optionText: 'Three'});
      expect(selectTester.trigger).toHaveTextContent('Three');
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('three');
    });

    it('works with RAC Select', async function () {
      render(
        <Select data-testid="test" onSelectionChange={onSelectionChange}>
          <Label>Favorite Animal</Label>
          <Button>
            <SelectValue />
          </Button>
          <Text slot="description">Description</Text>
          <Text slot="errorMessage">Error</Text>
          <Popover>
            <ListBox>
              <ListBoxItem id="cat">Cat</ListBoxItem>
              <ListBoxItem id="dog">Dog</ListBoxItem>
              <ListBoxItem id="kangaroo">Kangaroo</ListBoxItem>
            </ListBox>
          </Popover>
        </Select>
      );

      let selectTester = testUtilUser.createTester('Select', {root: screen.getAllByTestId('test')[0]});
      await selectTester.selectOption({optionText: 'Cat'});
      expect(selectTester.trigger).toHaveTextContent('Cat');
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith('cat');
    });
  });

  describe('test simulateMobile', function () {
    beforeAll(function () {
      simulateMobile();
      jest.useRealTimers();
    });

    it('check for tray', async function () {
      render(
        <Provider theme={theme}>
          <div role="listbox">blah</div>
          <Picker label="Test" data-testid="test" onSelectionChange={onSelectionChange} onOpenChange={onOpenChange}>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Picker>
        </Provider>
      );

      let selectTester = testUtilUser.createTester('Select', {root: screen.getByTestId('test')});
      await selectTester.open();
      expect(await screen.findByTestId('tray')).toContainElement(selectTester.listbox);
    });
  });
});
