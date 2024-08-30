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

import {act, pointerMap, render, within} from '@react-spectrum/test-utils-internal';
import {Button, FieldError, Label, ListBox, ListBoxItem, Popover, Select, SelectContext, SelectValue, Text} from '../';
import React from 'react';
import {User} from '@react-aria/test-utils';
import userEvent from '@testing-library/user-event';

let TestSelect = (props) => (
  <Select data-testid="select" data-foo="bar" {...props}>
    <Label>Favorite Animal</Label>
    <Button>
      <SelectValue />
    </Button>
    <Text slot="description">Description</Text>
    <Text slot="errorMessage">Error</Text>
    <Popover>
      <ListBox>
        <ListBoxItem>Cat</ListBoxItem>
        <ListBoxItem>Dog</ListBoxItem>
        <ListBoxItem>Kangaroo</ListBoxItem>
      </ListBox>
    </Popover>
  </Select>
);

describe('Select', () => {
  let user;
  let testUtilUser = new User();

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  it('provides slots', async () => {
    let {getByTestId} = render(<TestSelect />);
    let {setElement, open, getTrigger, getOptions, getListbox} = testUtilUser.createTester('SelectTester');
    let wrapper = getByTestId('select');
    setElement(wrapper);

    let trigger = getTrigger();
    expect(trigger).toHaveTextContent('Select an item');
    expect(trigger).not.toHaveAttribute('data-pressed');

    expect(wrapper).toHaveAttribute('data-foo', 'bar');

    expect(trigger).toHaveAttribute('aria-labelledby');
    let label = document.getElementById(trigger.getAttribute('aria-labelledby').split(' ')[1]);
    expect(label).toHaveAttribute('class', 'react-aria-Label');
    expect(label).toHaveTextContent('Favorite Animal');

    let valueOrPlaceholder = document.getElementById(trigger.getAttribute('aria-labelledby').split(' ')[0]);
    expect(valueOrPlaceholder).toHaveAttribute('class', 'react-aria-SelectValue');
    expect(valueOrPlaceholder).toHaveTextContent('Select an item');

    expect(trigger).toHaveAttribute('aria-describedby');
    expect(trigger.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ')).toBe('Description Error');

    await open();

    expect(trigger).toHaveAttribute('data-pressed', 'true');
    let listbox = getListbox();
    expect(listbox).toHaveAttribute('class', 'react-aria-ListBox');
    expect(listbox.closest('.react-aria-Popover')).toBeInTheDocument();
    expect(listbox.closest('.react-aria-Popover')).toHaveAttribute('data-trigger', 'Select');

    let options = getOptions();
    expect(options).toHaveLength(3);

    await user.click(options[1]);
    expect(trigger).toHaveTextContent('Dog');
  });

  it('should support slot', () => {
    let {getByTestId} = render(
      <SelectContext.Provider value={{slots: {test: {'aria-label': 'test'}}}}>
        <TestSelect slot="test" />
      </SelectContext.Provider>
    );

    let {setElement, getTrigger} = testUtilUser.createTester('SelectTester');
    setElement(getByTestId('select'));
    let trigger = getTrigger();
    expect(trigger.closest('.react-aria-Select')).toHaveAttribute('slot', 'test');
    expect(trigger).toHaveAttribute('aria-label', 'test');
  });

  it('supports items with render props', () => {
    let MyItem = (props) => (
      <ListBoxItem {...props}>
        {({isSelected}) => (
          <>
            {props.children}
            {isSelected ? ' (selected)' : ''}
          </>
        )}
      </ListBoxItem>
    );

    let {getByTestId} = render(
      <Select data-testid="select" defaultSelectedKey="cat">
        <Label>Favorite Animal</Label>
        <Button>
          <SelectValue />
        </Button>
        <Popover>
          <ListBox>
            <MyItem id="cat">Cat</MyItem>
            <MyItem id="dog">Dog</MyItem>
            <MyItem id="kangaroo">Kangaroo</MyItem>
          </ListBox>
        </Popover>
      </Select>
    );

    let {setElement, getTrigger} = testUtilUser.createTester('SelectTester');
    setElement(getByTestId('select'));
    let trigger = getTrigger();
    expect(trigger).toHaveTextContent('Cat');
  });

  it('supports custom select value', () => {
    let items = [
      {id: 1, name: 'Cat'},
      {id: 2, name: 'Dog'}
    ];

    let {getByTestId} = render(
      <Select data-testid="select" defaultSelectedKey={1}>
        <Label>Favorite Animal</Label>
        <Button>
          <SelectValue>
            {({selectedItem, selectedText}) => (
              <span>{selectedItem ? `${selectedItem.id} - ${selectedText}` : ''}</span>
            )}
          </SelectValue>
        </Button>
        <Popover>
          <ListBox items={items}>
            {item => <ListBoxItem>{item.name}</ListBoxItem>}
          </ListBox>
        </Popover>
      </Select>
    );

    let {setElement, getTrigger} = testUtilUser.createTester('SelectTester');
    setElement(getByTestId('select'));
    let trigger = getTrigger();
    expect(trigger).toHaveTextContent('1 - Cat');
  });

  it('supports placeholder', () => {
    let {getByTestId} = render(<TestSelect placeholder="Select an animal" />);
    let {setElement, getTrigger} = testUtilUser.createTester('SelectTester');
    setElement(getByTestId('select'));
    let trigger = getTrigger();
    expect(trigger).toHaveTextContent('Select an animal');
  });

  it('should support render props', async () => {
    let {getByTestId} = render(
      <Select data-testid="select">
        {({isOpen}) => (
          <>
            <Label>Favorite Animal</Label>
            <Button>
              <SelectValue />
              <span aria-hidden>{isOpen ? 'close' : 'open'}</span>
            </Button>
            <Popover>
              <ListBox>
                <ListBoxItem>Cat</ListBoxItem>
                <ListBoxItem>Dog</ListBoxItem>
                <ListBoxItem>Kangaroo</ListBoxItem>
              </ListBox>
            </Popover>
          </>
        )}
      </Select>
    );

    let {setElement, open, getTrigger} = testUtilUser.createTester('SelectTester');
    setElement(getByTestId('select'));
    let trigger = getTrigger();
    expect(trigger).toHaveTextContent('open');

    await open();
    expect(trigger).toHaveTextContent('close');
  });

  it('should send disabled prop to the hidden field', () => {
    render(
      <TestSelect name="select" isDisabled />
    );

    let input = document.querySelector('[name=select]');
    expect(input).toBeDisabled();
  });

  it('should render data- attributes only on the outer element', () => {
    let {getAllByTestId} = render(<TestSelect data-testid="select-test" />);
    let outerEl = getAllByTestId('select-test');
    expect(outerEl).toHaveLength(1);
    expect(outerEl[0]).toHaveClass('react-aria-Select');
  });

  it('supports validation errors', async () => {
    let {getByTestId} = render(
      <form data-testid="form">
        <Select data-testid="test-select" name="select" isRequired>
          <Label>Favorite Animal</Label>
          <Button>
            <SelectValue />
          </Button>
          <FieldError />
          <Popover>
            <ListBox>
              <ListBoxItem>Cat</ListBoxItem>
              <ListBoxItem>Dog</ListBoxItem>
              <ListBoxItem>Kangaroo</ListBoxItem>
            </ListBox>
          </Popover>
        </Select>
      </form>
    );

    let {setElement, getTrigger, selectOption} = testUtilUser.createTester('SelectTester');
    let wrapper = getByTestId('test-select');
    setElement(getByTestId('test-select'));
    let trigger = getTrigger();
    let select = wrapper;
    let input = document.querySelector('[name=select]');
    expect(input).toHaveAttribute('required');
    expect(trigger).not.toHaveAttribute('aria-describedby');
    expect(input.validity.valid).toBe(false);
    expect(select).not.toHaveAttribute('data-invalid');

    act(() => {getByTestId('form').checkValidity();});

    expect(trigger).toHaveAttribute('aria-describedby');
    expect(document.getElementById(trigger.getAttribute('aria-describedby'))).toHaveTextContent('Constraints not satisfied');
    expect(select).toHaveAttribute('data-invalid');
    expect(document.activeElement).toBe(trigger);

    await selectOption('Cat');
    expect(getTrigger()).not.toHaveAttribute('aria-describedby');
    expect(select).not.toHaveAttribute('data-invalid');
  });

  it('should support falsy (0) as a valid default value', async () => {
    let {getByRole} = render(
      <Select placeholder="pick a number">
        <Label>Pick a number</Label>
        <Button>
          <SelectValue />
        </Button>
        <Popover>
          <ListBox
            items={Array.from({length: 5}).map((_, i) => ({
              id: i,
              label: i
            }))}>
            {(item) => <ListBoxItem id={item.id} textValue={`${item.label}`}>{item.label}</ListBoxItem>}
          </ListBox>
        </Popover>
      </Select>
    );

    let button = getByRole('button');
    await user.click(button);

    let listbox = getByRole('listbox');
    let options = within(listbox).getAllByRole('option');
    await user.click(options[0]);

    expect(button).toHaveTextContent('0');
  });
});
