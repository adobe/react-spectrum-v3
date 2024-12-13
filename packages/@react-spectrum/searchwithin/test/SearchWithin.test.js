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
import Filter from '@spectrum-icons/workflow/Filter';
import {Item, Picker} from '@react-spectrum/picker';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {SearchField} from '@react-spectrum/searchfield';
import {SearchWithin} from '../src';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

let defaultProps = {
  label: 'Test'
};

function renderSearchWithin(props = {}, searchFieldProps = {}, pickerProps = {}) {
  return render(
    <Provider theme={theme}>
      <SearchWithin {...defaultProps} {...props}>
        <SearchField {...searchFieldProps} />
        <Picker defaultSelectedKey="all" {...pickerProps}>
          <Item key="all">All</Item>
          <Item key="campaigns">Campaigns</Item>
          <Item key="audiences">Audiences</Item>
          <Item key="tags">Tags</Item>
        </Picker>
      </SearchWithin>
    </Provider>
  );
}

describe('SearchWithin', function () {
  let user;

  beforeAll(function () {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    act(() => jest.runAllTimers());
  });

  afterAll(function () {
    jest.restoreAllMocks();
  });

  it('renders correctly', function () {
    let {getAllByText, getByRole} = renderSearchWithin();

    let searchfield = getByRole('searchbox');
    expect(searchfield).toBeVisible();
    expect(searchfield).toHaveAttribute('type', 'search');

    let button = getByRole('button');
    expect(button).toBeVisible();
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');

    let label = getAllByText('Test')[0];
    expect(label).toBeVisible();
  });

  it('should support custom icon', function () {
    let {getByTestId} = renderSearchWithin({}, {icon: <Filter data-testid="filtericon" />});

    expect(getByTestId('filtericon')).toBeTruthy();
  });

  it('should support no icon', function () {
    let {queryByTestId} = renderSearchWithin({}, {icon: null});

    expect(queryByTestId('searchicon')).toBeNull();
  });

  it('can type in search and get onChange', async function () {
    let onChange = jest.fn();
    let {getByRole} = renderSearchWithin({}, {onChange});
    let searchfield = getByRole('searchbox');
    expect(searchfield).toHaveAttribute('value', '');

    act(() => {searchfield.focus();});
    await user.keyboard('test search');
    act(() => {searchfield.blur();});
    expect(searchfield).toHaveAttribute('value', 'test search');
    expect(onChange).toBeCalledTimes(11);
  });

  it('can open menu and get onChange', async function () {
    let onOpenChange = jest.fn();
    let {getByRole} = renderSearchWithin({}, {}, {onOpenChange});

    let picker = getByRole('button');
    await user.click(picker);

    let listbox = getByRole('listbox');
    expect(listbox).toBeVisible();
    expect(onOpenChange).toBeCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('searchfield and picker are labelled correctly', async function () {
    let {getByRole, getAllByText, getByText} = renderSearchWithin();

    let searchfield = getByRole('searchbox');
    let picker = getByRole('button');
    let group = getByRole('group');
    let hiddenLabel = getByText('Search within');
    await user.click(picker);

    let listbox = getByRole('listbox');
    let label = getAllByText('Test')[0];
    expect(listbox).toHaveAttribute('aria-labelledby', `${label.id} ${hiddenLabel.id}`);
    expect(searchfield).toHaveAttribute('aria-labelledby', `${label.id} ${hiddenLabel.id} ${picker.id}`);
    expect(group).toHaveAttribute('aria-labelledby', label.id);
  });

  it('isDisabled=true disables both the searchfield and picker', function () {
    let {getByRole} = renderSearchWithin({isDisabled: true});

    let searchfield = getByRole('searchbox');
    let picker = getByRole('button');

    expect(searchfield).toHaveAttribute('disabled');
    expect(picker).toHaveAttribute('disabled');
  });

  it('autoFocus=true on searchfield will automatically focus the input', function () {
    let {getByRole} = renderSearchWithin({}, {autoFocus: true});

    let searchfield = getByRole('searchbox');

    expect(searchfield).toHaveFocus();
  });

  it('autoFocus=true on picker will automatically focus the picker', function () {
    let {getByRole} = renderSearchWithin({}, {}, {autoFocus: true});

    let picker = getByRole('button');

    expect(picker).toHaveFocus();
  });

  it('slot props override props provided to children', async function () {
    let {getByRole, getAllByText, getByText} = renderSearchWithin(
      {isDisabled: true, isRequired: false, label: 'Test1'},
      {isDisabled: false, isRequired: true, label: 'Test2', isQuiet: true},
      {isDisabled: false, isRequired: true, label: 'Test3', isQuiet: true}
    );

    let searchfield = getByRole('searchbox');
    let picker = getByRole('button');
    let group = getByRole('group');
    let hiddenLabel = getByText('Search within');
    await user.click(picker);
    let label = getAllByText('Test1')[0];

    expect(searchfield).toHaveAttribute('disabled');
    expect(picker).toHaveAttribute('disabled');

    expect(searchfield).not.toHaveAttribute('aria-required');

    expect(searchfield).toHaveAttribute('aria-labelledby', `${label.id} ${hiddenLabel.id} ${picker.id}`);
    expect(group).toHaveAttribute('aria-labelledby', label.id);

    expect(searchfield.classList.contains('is-quiet')).toBeFalsy();
    expect(picker.classList.contains('spectrum-Dropdown--quiet')).toBeFalsy();
  });
});

describe('SearchWithin labeling', function () {
  it('no label - default', function () {
    let {getByRole, getByText} = renderSearchWithin({label: undefined});

    let group = getByRole('group');
    let searchfield = getByRole('searchbox');
    let picker = getByRole('button');
    let hiddenLabel = getByText('Search within');

    expect(group).toHaveAttribute('aria-label', 'Search');

    expect(group).not.toHaveAttribute('aria-labelledby');
    expect(searchfield).toHaveAttribute('aria-labelledby', `${hiddenLabel.id} ${picker.id}`);
    expect(picker).toHaveAttribute('aria-labelledby', `${picker.childNodes[0].id} ${hiddenLabel.id}`);
  });

  it('label = foo', function () {
    let {getByRole, getByText} = renderSearchWithin({label: 'foo'});

    let group = getByRole('group');
    let searchfield = getByRole('searchbox');
    let picker = getByRole('button');
    let label = getByText('foo');
    let hiddenLabel = getByText('Search within');

    expect(group).not.toHaveAttribute('aria-label');

    expect(group).toHaveAttribute('aria-labelledby', label.id);
    expect(searchfield).toHaveAttribute('aria-labelledby', `${label.id} ${hiddenLabel.id} ${picker.id}`);
    expect(picker).toHaveAttribute('aria-labelledby', `${picker.childNodes[0].id} ${label.id} ${hiddenLabel.id}`);

    expect(label).toHaveAttribute('for', searchfield.id);
  });

  it('aria-label = bar', function () {
    let {getByRole, getByText} = renderSearchWithin({'aria-label': 'bar', label: undefined});

    let group = getByRole('group');
    let searchfield = getByRole('searchbox');
    let picker = getByRole('button');
    let hiddenLabel = getByText('Search within');

    expect(group).toHaveAttribute('aria-label', 'bar');

    expect(group).not.toHaveAttribute('aria-labelledby');
    expect(searchfield).toHaveAttribute('aria-labelledby', `${group.id} ${hiddenLabel.id} ${picker.id}`);
    expect(picker).toHaveAttribute('aria-labelledby', `${picker.childNodes[0].id} ${group.id} ${hiddenLabel.id}`);
  });

  it('aria-labelledby = {id}', function () {
    let {getByRole, getByText} = render(
      <Provider theme={theme}>
        <label id="id-foo-label" htmlFor="id-searchfield">
          Foo
        </label>
        <SearchWithin aria-labelledby="id-foo-label">
          <SearchField id="id-searchfield" />
          <Picker defaultSelectedKey="all">
            <Item key="all">All</Item>
            <Item key="campaigns">Campaigns</Item>
            <Item key="audiences">Audiences</Item>
            <Item key="tags">Tags</Item>
          </Picker>
        </SearchWithin>
      </Provider>
    );

    let group = getByRole('group');
    let searchfield = getByRole('searchbox');
    let picker = getByRole('button');
    let hiddenLabel = getByText('Search within');

    expect(group).not.toHaveAttribute('aria-label');

    expect(group).toHaveAttribute('aria-labelledby', 'id-foo-label');
    expect(searchfield).toHaveAttribute('aria-labelledby', `id-foo-label ${hiddenLabel.id} ${picker.id}`);
    expect(searchfield).toHaveAttribute('id', 'id-searchfield');
    expect(picker).toHaveAttribute('aria-labelledby', `${picker.childNodes[0].id} id-foo-label ${hiddenLabel.id}`);
  });
});
