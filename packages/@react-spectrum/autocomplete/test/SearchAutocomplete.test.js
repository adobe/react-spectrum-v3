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

jest.mock('@react-aria/live-announcer');
import {act, fireEvent, pointerMap, render, screen, triggerPress, waitFor, within} from '@react-spectrum/test-utils';
import {announce} from '@react-aria/live-announcer';
import {Button} from '@react-spectrum/button';
import Filter from '@spectrum-icons/workflow/Filter';
import {Item, SearchAutocomplete, Section} from '../';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import scaleMedium from '@adobe/spectrum-css-temp/vars/spectrum-medium-unique.css';
import themeLight from '@adobe/spectrum-css-temp/vars/spectrum-light-unique.css';
import userEvent from '@testing-library/user-event';

let theme = {
  light: themeLight,
  medium: scaleMedium
};

let onOpenChange = jest.fn();
let onInputChange = jest.fn();
let outerBlur = jest.fn();
let onFocus = jest.fn();
let onBlur = jest.fn();
let onClear = jest.fn();

let defaultProps = {
  label: 'Test',
  onOpenChange,
  onInputChange,
  onFocus,
  onBlur,
  onClear
};

const ExampleSearchAutocomplete = React.forwardRef((props = {}, ref) => (
  <Provider theme={theme}>
    <SearchAutocomplete {...defaultProps} {...props} ref={ref}>
      <Item key="1">One</Item>
      <Item key="2">Two</Item>
      <Item key="3">Three</Item>
    </SearchAutocomplete>
  </Provider>
  ));

function renderSearchAutocomplete(props = {}) {
  return render(<ExampleSearchAutocomplete {...props} />);
}

function renderSectionSearchAutocomplete(props = {}) {
  return render(
    <Provider theme={theme}>
      <SearchAutocomplete {...defaultProps} {...props}>
        <Section title="Section One" key="section 1">
          <Item key="1">One</Item>
          <Item key="2">Two</Item>
          <Item key="3">Three</Item>
        </Section>
        <Section title="Section Two" key="section 2">
          <Item key="4">Four</Item>
          <Item key="5">Five</Item>
          <Item key="6">Six</Item>
        </Section>
      </SearchAutocomplete>
    </Provider>
  );
}

let items = [
  {name: 'One', id: '1'},
  {name: 'Two', id: '2'},
  {name: 'Three', id: '3'}
];

function ControlledValueSearchAutocomplete(props) {
  let [inputValue, setInputValue] = React.useState('');

  return (
    <Provider theme={theme}>
      <SearchAutocomplete {...defaultProps} label="SearchAutocomplete" defaultItems={items} inputValue={inputValue} onInputChange={setInputValue} {...props}>
        {(item) => <Item>{item.name}</Item>}
      </SearchAutocomplete>
    </Provider>
  );
}

let initialFilterItems = [
  {name: 'Aardvark', id: '1'},
  {name: 'Kangaroo', id: '2'},
  {name: 'Snake', id: '3'}
];

function testSearchAutocompleteOpen(searchAutocomplete, listbox, focusedItemIndex) {
  let searchAutocompleteLabelledBy = searchAutocomplete.getAttribute('aria-labelledby');

  expect(listbox).toBeVisible();
  expect(listbox).toHaveAttribute('aria-label', 'Suggestions');
  expect(listbox).toHaveAttribute('aria-labelledby', `${listbox.id} ${searchAutocompleteLabelledBy}`);
  expect(searchAutocomplete).toHaveAttribute('aria-controls', listbox.id);
  expect(searchAutocomplete).toHaveAttribute('aria-expanded', 'true');

  let items = within(listbox).getAllByRole('option');
  expect(items).toHaveLength(3);
  expect(items[0]).toHaveTextContent('One');
  expect(items[1]).toHaveTextContent('Two');
  expect(items[2]).toHaveTextContent('Three');

  expect(listbox).toHaveAttribute('tabIndex', typeof focusedItemIndex === 'undefined' ? '0' : '-1');
  for (let item of items) {
    expect(item)
    .toHaveAttribute(
      'tabIndex',
      typeof focusedItemIndex !== 'undefined' && item === items[focusedItemIndex] ? '0' : '-1'
    );
  }

  expect(document.activeElement).toBe(searchAutocomplete);

  if (typeof focusedItemIndex === 'undefined') {
    expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');

    act(() => {
      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      jest.runAllTimers();
    });

    expect(searchAutocomplete).toHaveAttribute('aria-activedescendant', items[0].id);
  } else {
    expect(searchAutocomplete).toHaveAttribute('aria-activedescendant', items[focusedItemIndex].id);
  }
}

describe('SearchAutocomplete', function () {
  let user;

  beforeAll(function () {
    user = userEvent.setup({delay: null, pointerMap});
    jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    jest.spyOn(window.screen, 'width', 'get').mockImplementation(() => 1024);
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
    let {getAllByText, getByRole} = renderSearchAutocomplete();

    let searchAutocomplete = getByRole('combobox');
    expect(searchAutocomplete).toHaveAttribute('autoCorrect', 'off');
    expect(searchAutocomplete).toHaveAttribute('spellCheck', 'false');
    expect(searchAutocomplete).toHaveAttribute('autoComplete', 'off');

    let label = getAllByText('Test')[0];
    expect(label).toBeVisible();
  });

  it('should support custom icons', function () {
    let {getByTestId} = renderSearchAutocomplete({icon: <Filter data-testid="filtericon" />});

    expect(getByTestId('filtericon')).toBeTruthy();
  });

  it('should support no icons', function () {
    let {queryByTestId} = renderSearchAutocomplete({icon: null});

    expect(queryByTestId('searchicon')).toBeNull();
  });

  it('renders with placeholder text and shows warning', function () {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let {getByPlaceholderText, getByRole} = renderSearchAutocomplete({placeholder: 'Test placeholder'});

    let searchAutocomplete = getByRole('combobox');

    expect(getByPlaceholderText('Test placeholder')).toBeTruthy();
    expect(searchAutocomplete.placeholder).toBe('Test placeholder');
    expect(spyWarn).toHaveBeenCalledWith('Placeholders are deprecated due to accessibility issues. Please use help text instead.');
  });

  it('can be disabled', async function () {
    let {getByRole, queryByRole} = renderSearchAutocomplete({isDisabled: true});

    let searchAutocomplete = getByRole('combobox');
    act(() => {
      searchAutocomplete.focus();
    });
    await user.keyboard('One');
    act(() => {
      jest.runAllTimers();
    });

    expect(queryByRole('listbox')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onFocus).not.toHaveBeenCalled();

    fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
    fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
    act(() => {
      jest.runAllTimers();
    });

    expect(queryByRole('listbox')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('can be readonly', async function () {
    let {getByRole, queryByRole} = renderSearchAutocomplete({isReadOnly: true, defaultInputValue: 'Blargh'});

    let searchAutocomplete = getByRole('combobox');
    act(() => {
      searchAutocomplete.focus();
    });
    await user.keyboard('One');
    act(() => {
      jest.runAllTimers();
    });

    expect(queryByRole('listbox')).toBeNull();
    expect(searchAutocomplete.value).toBe('Blargh');
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onFocus).toHaveBeenCalled();

    fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
    fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
    act(() => {
      jest.runAllTimers();
    });

    expect(queryByRole('listbox')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('features default behavior of completionMode suggest and menuTrigger input', async function () {
    let {getByRole} = renderSearchAutocomplete();

    let searchAutocomplete = getByRole('combobox');
    expect(searchAutocomplete).not.toHaveAttribute('aria-controls');
    expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');
    expect(searchAutocomplete).toHaveAttribute('aria-autocomplete', 'list');

    act(() => {
      searchAutocomplete.focus();
    });
    await user.keyboard('On');
    act(() => {
      jest.runAllTimers();
    });

    let listbox = getByRole('listbox');

    let items = within(listbox).getAllByRole('option');
    expect(items).toHaveLength(1);

    expect(searchAutocomplete.value).toBe('On');
    expect(items[0]).toHaveTextContent('One');
    expect(searchAutocomplete).toHaveAttribute('aria-controls', listbox.id);
    expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');

    fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
    fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
    act(() => {
      jest.runAllTimers();
    });

    expect(searchAutocomplete).toHaveAttribute('aria-activedescendant', items[0].id);
  });

  it('supports custom data attributes', function () {
    let {getByRole} = renderSearchAutocomplete({'data-testid': 'test'});

    let searchAutocomplete = getByRole('combobox');
    expect(searchAutocomplete).toHaveAttribute('data-testid', 'test');
  });

  describe('refs', function () {
    it('attaches a ref to the label wrapper', function () {
      let ref = React.createRef();
      let {getByText} = renderSearchAutocomplete({ref});

      expect(ref.current.UNSAFE_getDOMNode()).toBe(getByText('Test').parentElement);
    });

    it('attaches a ref to the searchAutocomplete wrapper if no label', function () {
      let ref = React.createRef();
      let {getByRole} = renderSearchAutocomplete({ref, label: null, 'aria-label': 'test'});

      expect(ref.current.UNSAFE_getDOMNode()).toBe(getByRole('combobox').parentElement.parentElement.parentElement.parentElement);
    });

    it('calling focus() on the ref focuses the input field', function () {
      let ref = React.createRef();
      let {getByRole} = renderSearchAutocomplete({ref});

      act(() => {ref.current.focus();});
      expect(document.activeElement).toBe(getByRole('combobox'));
    });
  });

  describe('opening', function () {
    describe('menuTrigger = focus', function () {
      it('opens menu when searchAutocomplete is focused', function () {
        let {getByRole} = renderSearchAutocomplete({menuTrigger: 'focus'});

        let searchAutocomplete = getByRole('combobox');
        act(() => {
          searchAutocomplete.focus();
        });
        act(() => {
          jest.runAllTimers();
        });

        let listbox = getByRole('listbox');
        expect(onOpenChange).toBeCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(true, 'focus');
        testSearchAutocompleteOpen(searchAutocomplete, listbox);
      });
    });

    describe('keyboard input', function () {
      it('opens the menu on down arrow press', function () {
        let {getByRole, queryByRole} = renderSearchAutocomplete();

        let searchAutocomplete = getByRole('combobox');
        act(() => {searchAutocomplete.focus();});
        expect(queryByRole('listbox')).toBeNull();
        expect(onOpenChange).not.toHaveBeenCalled();

        fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
        fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
        act(() => {
          jest.runAllTimers();
        });

        let listbox = getByRole('listbox');
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(true, 'manual');
        testSearchAutocompleteOpen(searchAutocomplete, listbox, 0);
      });

      it('opens the menu on up arrow press', function () {
        let {getByRole, queryByRole} = renderSearchAutocomplete();

        let searchAutocomplete = getByRole('combobox');
        act(() => {searchAutocomplete.focus();});
        expect(queryByRole('listbox')).toBeNull();
        expect(onOpenChange).not.toHaveBeenCalled();

        fireEvent.keyDown(searchAutocomplete, {key: 'ArrowUp', code: 38, charCode: 38});
        fireEvent.keyUp(searchAutocomplete, {key: 'ArrowUp', code: 38, charCode: 38});
        act(() => {
          jest.runAllTimers();
        });

        let listbox = getByRole('listbox');
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(true, 'manual');
        testSearchAutocompleteOpen(searchAutocomplete, listbox, 2);
      });

      it('opens the menu on user typing', async function () {
        let {getByRole, queryByRole} = renderSearchAutocomplete();

        let searchAutocomplete = getByRole('combobox');
        act(() => {searchAutocomplete.focus();});
        expect(queryByRole('listbox')).toBeNull();
        expect(onOpenChange).not.toHaveBeenCalled();

        await user.keyboard('Two');
        act(() => {
          jest.runAllTimers();
        });

        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(true, 'input');

        let listbox = getByRole('listbox');
        expect(listbox).toBeVisible();
        expect(searchAutocomplete).toHaveAttribute('aria-controls', listbox.id);
        expect(searchAutocomplete).toHaveAttribute('aria-expanded', 'true');

        let items = within(listbox).getAllByRole('option');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('Two');

        expect(document.activeElement).toBe(searchAutocomplete);
        expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');
      });

      it('doesn\'t select an item on matching input if it is a disabled key', async function () {
        let {getByRole} = renderSearchAutocomplete({disabledKeys: ['2']});
        let searchAutocomplete = getByRole('combobox');
        act(() => {searchAutocomplete.focus();});
        expect(onOpenChange).not.toHaveBeenCalled();
        await user.keyboard('Two');

        act(() => {
          jest.runAllTimers();
        });

        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(true, 'input');

        let listbox = getByRole('listbox');
        expect(listbox).toBeVisible();

        let items = within(listbox).getAllByRole('option');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('Two');

        expect(document.activeElement).toBe(searchAutocomplete);
        expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');
      });

      it('closes the menu if there are no matching items', async function () {
        let {getByRole, queryByRole} = renderSearchAutocomplete();

        let searchAutocomplete = getByRole('combobox');
        expect(onOpenChange).not.toHaveBeenCalled();
        act(() => {searchAutocomplete.focus();});
        await user.keyboard('One');
        act(() => jest.runAllTimers());

        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(true, 'input');

        let listbox = getByRole('listbox');
        let items = within(listbox).getAllByRole('option');
        expect(items).toHaveLength(1);

        await user.keyboard('z');
        act(() => jest.runAllTimers());
        expect(queryByRole('listbox')).toBeNull();
        expect(searchAutocomplete).not.toHaveAttribute('aria-controls');
        expect(searchAutocomplete).toHaveAttribute('aria-expanded', 'false');
      });

      it('doesn\'t open the menu if no items match', async function () {
        let {getByRole, queryByRole} = renderSearchAutocomplete();

        let searchAutocomplete = getByRole('combobox');
        act(() => searchAutocomplete.focus());
        await user.keyboard('X', {skipClick: true});
        act(() => {
          jest.runAllTimers();
        });

        expect(queryByRole('listbox')).toBeNull();
        expect(onOpenChange).not.toHaveBeenCalled();
      });
    });
  });
  describe('showing menu', function () {
    it('keeps the menu open if the user clears the input field if menuTrigger = focus', async function () {
      let {getByRole} = renderSearchAutocomplete({menuTrigger: 'focus'});

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('Two');
      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items).toHaveLength(1);

      fireEvent.change(searchAutocomplete, {target: {value: ''}});
      act(() => {
        jest.runAllTimers();
      });

      listbox = getByRole('listbox');
      items = within(listbox).getAllByRole('option');
      expect(listbox).toBeVisible();
      expect(searchAutocomplete).toHaveAttribute('aria-controls', listbox.id);
      expect(searchAutocomplete).toHaveAttribute('aria-expanded', 'true');
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(searchAutocomplete);
      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');
    });

    it('allows the user to navigate the menu via arrow keys', async function () {
      let {getByRole} = renderSearchAutocomplete();

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('o');
      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');

      expect(document.activeElement).toBe(searchAutocomplete);
      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');

      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});

      expect(searchAutocomplete).toHaveAttribute('aria-activedescendant', items[0].id);

      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});

      expect(searchAutocomplete).toHaveAttribute('aria-activedescendant', items[1].id);

      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowUp', code: 38, charCode: 38});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowUp', code: 38, charCode: 38});

      expect(searchAutocomplete).toHaveAttribute('aria-activedescendant', items[0].id);
    });

    it('allows the user to select an item via Enter', async function () {
      let {getByRole, queryByRole} = renderSearchAutocomplete();

      let searchAutocomplete = getByRole('combobox');
      expect(searchAutocomplete.value).toBe('');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('o');
      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');

      expect(document.activeElement).toBe(searchAutocomplete);
      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');

      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});

      expect(searchAutocomplete).toHaveAttribute('aria-activedescendant', items[0].id);

      fireEvent.keyDown(searchAutocomplete, {key: 'Enter', code: 13, charCode: 13});
      fireEvent.keyUp(searchAutocomplete, {key: 'Enter', code: 13, charCode: 13});
      act(() => {
        jest.runAllTimers();
      });

      expect(queryByRole('listbox')).toBeNull();
      expect(searchAutocomplete.value).toBe('One');
    });

    it('doesn\'t focus the first key if the previously focused key is filtered out of the list', async function () {
      let {getByRole} = renderSearchAutocomplete();

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('O');
      act(() => {
        jest.runAllTimers();
      });
      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items).toHaveLength(2);
      expect(searchAutocomplete).toHaveAttribute('aria-activedescendant', items[1].id);
      expect(items[1].textContent).toBe('Two');

      await user.keyboard('n');
      act(() => {
        jest.runAllTimers();
      });

      listbox = getByRole('listbox');
      items = within(listbox).getAllByRole('option');
      expect(searchAutocomplete.value).toBe('On');
      expect(items).toHaveLength(1);
      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');
      expect(items[0].textContent).toBe('One');
    });

    it('closes menu when pressing Enter on an already selected item', function () {
      let {getByRole, queryByRole} = renderSearchAutocomplete();

      let searchAutocomplete = getByRole('combobox');
      act(() => searchAutocomplete.focus());
      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      expect(listbox).toBeTruthy();

      fireEvent.keyDown(searchAutocomplete, {key: 'Enter', code: 13, charCode: 13});
      fireEvent.keyUp(searchAutocomplete, {key: 'Enter', code: 13, charCode: 13});
      act(() => {
        jest.runAllTimers();
      });

      expect(queryByRole('listbox')).toBeNull();
    });
  });

  describe('typing in the textfield', function () {
    it('can be uncontrolled', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <SearchAutocomplete label="Test" onOpenChange={onOpenChange}>
            <Item key="1">Bulbasaur</Item>
            <Item key="2">Squirtle</Item>
            <Item key="3">Charmander</Item>
          </SearchAutocomplete>
        </Provider>
      );

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('Bul');

      expect(onOpenChange).toHaveBeenCalled();
    });

    it('can select by mouse', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <SearchAutocomplete label="Test" onOpenChange={onOpenChange}>
            <Item key="1">Cheer</Item>
            <Item key="2">Cheerio</Item>
            <Item key="3">Cheeriest</Item>
          </SearchAutocomplete>
        </Provider>
      );

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('Che');

      act(() => {
        jest.runAllTimers();
      });

      expect(onOpenChange).toHaveBeenCalled();

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      triggerPress(items[1]);
      act(() => {
        jest.runAllTimers();
      });
    });

    it('filters searchAutocomplete items using contains strategy', async function () {
      let {getByRole} = renderSearchAutocomplete();

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('o');

      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(searchAutocomplete).toHaveAttribute('aria-controls', listbox.id);

      let items = within(listbox).getAllByRole('option');
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
    });

    it('should not match any items if input is just a space', async function () {
      let {getByRole, queryByRole} = renderSearchAutocomplete();

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard(' ');

      act(() => {
        jest.runAllTimers();
      });

      expect(queryByRole('listbox')).toBeNull();
    });

    it('doesn\'t focus the first item in searchAutocomplete menu if you completely clear your textfield and menuTrigger = focus', async function () {
      let {getByRole} = renderSearchAutocomplete({menuTrigger: 'focus'});

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('o');
      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();

      let items = within(listbox).getAllByRole('option');
      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');

      await user.clear(searchAutocomplete);
      act(() => {
        jest.runAllTimers();
      });

      listbox = getByRole('listbox');
      items = within(listbox).getAllByRole('option');
      expect(listbox).toBeVisible();
      expect(items).toHaveLength(3);
      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');
    });

    it('doesn\'t closes the menu if you completely clear your textfield and menuTrigger != focus', async function () {
      let {getByRole} = renderSearchAutocomplete();

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('o');

      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();

      fireEvent.change(searchAutocomplete, {target: {value: ''}});
      act(() => {
        jest.runAllTimers();
      });

      listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
    });

    it('clears prior item focus when input no longer matches existing value if allowsCustomValue is true', function () {
      let {getByRole} = renderSearchAutocomplete({allowsCustomValue: true});
      let searchAutocomplete = getByRole('combobox');
      // Change input value to something matching a searchAutocomplete value
      act(() => searchAutocomplete.focus());
      fireEvent.change(searchAutocomplete, {target: {value: 'Two'}});
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(listbox).toBeVisible();
      expect(items).toHaveLength(1);
      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');
      expect(items[0].textContent).toBe('Two');

      // Change input text to something that doesn't match any searchAutocomplete items but still shows the menu
      act(() => searchAutocomplete.focus());
      fireEvent.change(searchAutocomplete, {target: {value: 'Tw'}});
      act(() => jest.runAllTimers());

      // check that no item is focused in the menu
      listbox = getByRole('listbox');
      items = within(listbox).getAllByRole('option');
      expect(listbox).toBeVisible();
      expect(items).toHaveLength(1);
      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');
      expect(items[0].textContent).toBe('Two');
    });

    it('should close the menu when no items match', async function () {
      let {getByRole, queryByRole} = renderSearchAutocomplete();

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('O');

      act(() => {
        jest.runAllTimers();
      });

      expect(getByRole('listbox')).toBeVisible();
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true, 'input');

      await user.keyboard('x');

      act(() => {
        searchAutocomplete.focus();
      });
      fireEvent.change(searchAutocomplete, {target: {value: 'x'}});
      act(() => {
        jest.runAllTimers();
      });

      expect(queryByRole('listbox')).toBeNull();
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenLastCalledWith(false, undefined);
    });

    it('should clear the focused item when typing', async function () {
      let {getByRole} = renderSearchAutocomplete();

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('w');

      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      let items = within(listbox).getAllByRole('option');
      expect(items).toHaveLength(1);
      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');

      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});

      expect(searchAutocomplete).toHaveAttribute('aria-activedescendant', items[0].id);

      await user.keyboard('o');

      items = within(listbox).getAllByRole('option');
      expect(items).toHaveLength(1);
      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');
    });

    it('input events are only fired once', async function () {
      let onKeyDown = jest.fn();
      let onKeyUp = jest.fn();
      let onFocus = jest.fn();
      let onInputChange = jest.fn();
      let onFocusChange = jest.fn();
      let onBlur = jest.fn();
      let {getByRole} = renderSearchAutocomplete({onKeyDown, onKeyUp, onFocus, onInputChange, onBlur, onFocusChange});

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('w');

      act(() => {
        jest.runAllTimers();
      });

      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyUp).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onInputChange).toHaveBeenCalledTimes(1);
      expect(onFocusChange).toHaveBeenCalledTimes(1);
      expect(onBlur).toHaveBeenCalledTimes(0);

      await user.tab();

      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('blur', function () {
    it('closes and commits selection on blur (clicking to blur)', async function () {
      let {queryByRole, getByRole} = render(
        <Provider theme={theme}>
          <SearchAutocomplete label="Test" onOpenChange={onOpenChange} onInputChange={onInputChange}>
            <Item key="1">Bulbasaur</Item>
            <Item key="2">Squirtle</Item>
            <Item key="3">Charmander</Item>
          </SearchAutocomplete>
          <Button variant="secondary">Focus move</Button>
        </Provider>
      );

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('b');
      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();

      fireEvent.change(searchAutocomplete, {target: {value: 'Bulba'}});
      act(() => {
        jest.runAllTimers();
      });
      act(() => {
        searchAutocomplete.blur();
      });
      act(() => {
        jest.runAllTimers();
      });

      // SearchAutocomplete value should reset to the selected key value and menu should be closed
      expect(onOpenChange).toHaveBeenLastCalledWith(false, undefined);
      expect(onInputChange).toHaveBeenLastCalledWith('Bulba');
      expect(searchAutocomplete.value).toBe('Bulba');
      expect(queryByRole('listbox')).toBeFalsy();
    });

    it('closes and commits custom value', async function () {
      let {getByRole, queryByRole} = render(
        <Provider theme={theme}>
          <SearchAutocomplete label="Test" allowsCustomValue onOpenChange={onOpenChange}>
            <Item key="1">Bulbasaur</Item>
            <Item key="2">Squirtle</Item>
            <Item key="3">Charmander</Item>
          </SearchAutocomplete>
        </Provider>
      );

      let searchAutocomplete = getByRole('combobox');
      await user.click(searchAutocomplete);
      act(() => {
        jest.runAllTimers();
      });
      fireEvent.change(searchAutocomplete, {target: {value: 'Bulba'}});
      act(() => {
        jest.runAllTimers();
      });
      expect(onOpenChange).toHaveBeenLastCalledWith(true, 'input');

      act(() => {
        searchAutocomplete.blur();
      });
      act(() => {
        jest.runAllTimers();
      });

      expect(onOpenChange).toHaveBeenLastCalledWith(false, undefined);

      expect(queryByRole('listbox')).toBeNull();
    });

    it('retains selected key on blur if input value matches', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <SearchAutocomplete label="Test" allowsCustomValue onOpenChange={onOpenChange}>
            <Item key="1">Bulbasaur</Item>
            <Item key="2">Squirtle</Item>
            <Item key="3">Charmander</Item>
          </SearchAutocomplete>
        </Provider>
      );

      let searchAutocomplete = getByRole('combobox');

      await user.click(searchAutocomplete);
      act(() => {
        jest.runAllTimers();
      });

      expect(document.activeElement).toBe(searchAutocomplete);

      act(() => {
        searchAutocomplete.blur();
      });
      act(() => {
        jest.runAllTimers();
      });

    });

    it('propagates blur event outside of the component', async function () {
      let {getByRole} = render(
        <Provider theme={theme}>
          <div onBlur={outerBlur}>
            <SearchAutocomplete label="Test" autoFocus onBlur={onBlur}>
              <Item key="1">Bulbasaur</Item>
              <Item key="2">Squirtle</Item>
              <Item key="3">Charmander</Item>
            </SearchAutocomplete>
            <Button variant="primary">Second focus</Button>
          </div>
        </Provider>
      );

      let searchAutocomplete = getByRole('combobox');
      expect(document.activeElement).toBe(searchAutocomplete);

      expect(onBlur).toHaveBeenCalledTimes(0);
      expect(outerBlur).toHaveBeenCalledTimes(0);

      await user.tab();

      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(outerBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('controlled searchAutocomplete', function () {
    describe('controlled by inputValue', function () {
      it('updates inputValue changes', function () {
        let {getByRole, rerender} = render(<ExampleSearchAutocomplete inputValue="Two" />);
        let searchAutocomplete = getByRole('combobox');
        expect(searchAutocomplete.value).toBe('Two');

        rerender(<ExampleSearchAutocomplete inputValue="One" />);
        expect(searchAutocomplete.value).toBe('One');

        rerender(<ExampleSearchAutocomplete inputValue="" />);
        expect(searchAutocomplete.value).toBe('');
      });
    });

    describe('controlled by inputValue', function () {
      it('updates the input field when inputValue prop changes', function () {
        let {getByRole, rerender} = render(<ExampleSearchAutocomplete inputValue="T" />);
        let searchAutocomplete = getByRole('combobox');
        expect(searchAutocomplete.value).toBe('T');

        rerender(<ExampleSearchAutocomplete inputValue="Tw" />);
        expect(searchAutocomplete.value).toBe('Tw');
      });
    });

    describe('custom filter', function () {
      it('updates items with custom filter onInputChange', async () => {
        let customFilterItems = [
          {name: 'The first item', id: '1'},
          {name: 'The second item', id: '2'},
          {name: 'The third item', id: '3'}
        ];

        let CustomFilterSearchAutocomplete = () => {
          let [list, setList] = React.useState(customFilterItems);
          let onInputChange = (value) => {
            setList(customFilterItems.filter(item => item.name.includes(value)));
          };

          return (
            <SearchAutocomplete items={list} label="SearchAutocomplete" onInputChange={onInputChange}>
              {(item) => <Item>{item.name}</Item>}
            </SearchAutocomplete>
          );
        };
        let {getByRole} = render(
          <Provider theme={theme}>
            <CustomFilterSearchAutocomplete />
          </Provider>
        );

        let searchAutocomplete = getByRole('combobox');
        act(() => {
          searchAutocomplete.focus();
        });
        await user.keyboard('second');
        act(() => {
          jest.runAllTimers();
        });

        let listbox = getByRole('listbox');
        let items = within(listbox).getAllByRole('option');
        expect(items).toHaveLength(1);
      });
    });

    it('updates the list of items when items update', async function () {
      let {getByRole, rerender} = render(<ControlledValueSearchAutocomplete items={initialFilterItems} />);
      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('o');
      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);

      expect(items[0].textContent).toBe('Aardvark');
      expect(items[1].textContent).toBe('Kangaroo');
      expect(items[2].textContent).toBe('Snake');

      let newItems = [
        {name: 'New Text', id: '1'},
        {name: 'Item 2', id: '2'},
        {name: 'Item 3', id: '3'}
      ];

      rerender(<ControlledValueSearchAutocomplete items={newItems} />);

      expect(listbox).toBeVisible();
      items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);

      expect(items[0].textContent).toBe('New Text');
      expect(items[1].textContent).toBe('Item 2');
      expect(items[2].textContent).toBe('Item 3');
    });

    it('updates the list of items when items update (items provided by map)', async function () {
      function SearchAutocompleteWithMap(props) {
        let defaultItems = initialFilterItems;
        let {
          listItems = defaultItems
        } = props;
        return (
          <Provider theme={theme}>
            <SearchAutocomplete label="SearchAutocomplete" {...props}>
              {listItems.map((item) => (
                <Item key={item.id}>
                  {item.name}
                </Item>
              ))}
            </SearchAutocomplete>
          </Provider>
        );
      }

      let {getByRole, rerender} = render(<SearchAutocompleteWithMap />);
      let searchAutocomplete = getByRole('combobox');

      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('a');
      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      let items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);

      expect(items[0].textContent).toBe('Aardvark');
      expect(items[1].textContent).toBe('Kangaroo');
      expect(items[2].textContent).toBe('Snake');

      triggerPress(items[0]);
      act(() => {
        jest.runAllTimers();
      });

      expect(searchAutocomplete.value).toBe('Aardvark');

      act(() => {
        searchAutocomplete.blur();
      });
      act(() => {
        jest.runAllTimers();
      });
      expect(document.activeElement).not.toBe(searchAutocomplete);

      let newItems = [
        {name: 'New Text', id: '1'},
        {name: 'Item 2', id: '2'},
        {name: 'Item 3', id: '3'}
      ];

      rerender(<SearchAutocompleteWithMap listItems={newItems} />);
      expect(searchAutocomplete.value).toBe('New Text');

      act(() => {
        searchAutocomplete.focus();
      });
      fireEvent.change(searchAutocomplete, {target: {value: ''}});
      act(() => {
        jest.runAllTimers();
      });

      listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      items = within(listbox).getAllByRole('option');
      expect(items.length).toBe(3);

      expect(items[0].textContent).toBe('New Text');
      expect(items[1].textContent).toBe('Item 2');
      expect(items[2].textContent).toBe('Item 3');
    });
  });

  describe('uncontrolled searchAutocomplete', function () {
    it('should update both input value and selected item freely', async function () {
      let {getByRole, queryByRole} = renderSearchAutocomplete();
      let searchAutocomplete = getByRole('combobox');
      expect(searchAutocomplete.value).toBe('');

      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('T');
      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      let items = within(listbox).getAllByRole('option');
      expect(items).toHaveLength(2);
      await user.keyboard('wo');

      act(() => {
        jest.runAllTimers();
      });

      expect(searchAutocomplete.value).toBe('Two');
      expect(onInputChange).toHaveBeenCalledTimes(3);
      expect(onInputChange).toHaveBeenCalledWith('Two');

      fireEvent.change(searchAutocomplete, {target: {value: ''}});
      act(() => {
        jest.runAllTimers();
      });

      expect(searchAutocomplete.value).toBe('');
      expect(onInputChange).toHaveBeenCalledTimes(4);
      expect(onInputChange).toHaveBeenCalledWith('');

      listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      items = within(listbox).getAllByRole('option');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[1]).not.toHaveAttribute('aria-selected', 'true');

      triggerPress(items[0]);
      act(() => {
        jest.runAllTimers();
      });

      expect(searchAutocomplete.value).toBe('One');
      expect(queryByRole('listbox')).toBeNull();
      expect(onInputChange).toHaveBeenCalledTimes(5);
      expect(onInputChange).toHaveBeenCalledWith('One');

      fireEvent.change(searchAutocomplete, {target: {value: 'o'}});
      act(() => {
        jest.runAllTimers();
      });

      listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      items = within(listbox).getAllByRole('option');
      expect(items[0]).toHaveTextContent('One');
      expect(items[0]).toHaveAttribute('aria-selected', 'true');

      // Reset selection
      fireEvent.change(searchAutocomplete, {target: {value: ''}});
      act(() => {
        jest.runAllTimers();
      });

      expect(searchAutocomplete.value).toBe('');
      expect(onInputChange).toHaveBeenCalledTimes(7);
      expect(onInputChange).toHaveBeenCalledWith('');
    });

    it('defaultInputValue should not set selected item', async function () {
      let {getByRole} = renderSearchAutocomplete({defaultInputValue: 'Tw'});
      let searchAutocomplete = getByRole('combobox');
      expect(searchAutocomplete.value).toBe('Tw');

      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('o');
      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      let items = within(listbox).getAllByRole('option');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Two');
      expect(items[0]).toHaveAttribute('aria-selected', 'false');
    });
  });

  it('should have aria-invalid when validationState="invalid"', function () {
    let {getByRole} = renderSearchAutocomplete({validationState: 'invalid'});
    let searchAutocomplete = getByRole('combobox');
    expect(searchAutocomplete).toHaveAttribute('aria-invalid', 'true');
  });

  describe('loadingState', function () {
    it('searchAutocomplete should not render a loading circle if menu is not open', function () {
      let {getByRole, queryByRole, rerender} = render(<ExampleSearchAutocomplete loadingState="loading" />);
      act(() => {jest.advanceTimersByTime(500);});
      // First time load will show progress bar so user can know that items are being fetched
      expect(getByRole('progressbar')).toBeTruthy();

      rerender(<ExampleSearchAutocomplete loadingState="filtering" />);

      expect(queryByRole('progressbar')).toBeNull();
    });

    it('searchAutocomplete should render a loading circle if menu is not open but menuTrigger is "manual"', function () {
      let {getByRole, queryByRole, rerender} = render(<ExampleSearchAutocomplete loadingState="loading" menuTrigger="manual" />);
      let searchAutocomplete = getByRole('combobox');
      expect(queryByRole('progressbar')).toBeNull();

      act(() => {jest.advanceTimersByTime(500);});
      expect(() => within(searchAutocomplete).getByRole('progressbar')).toBeTruthy();

      rerender(<ExampleSearchAutocomplete loadingState="filtering" menuTrigger="manual" />);
      expect(() => within(searchAutocomplete).getByRole('progressbar')).toBeTruthy();

      rerender(<ExampleSearchAutocomplete loadingState="filtering" />);
      expect(queryByRole('progressbar')).toBeNull();
    });

    it('searchAutocomplete should not render a loading circle until a delay of 500ms passes (loadingState: loading)', async function () {
      let {getByRole, queryByRole} = renderSearchAutocomplete({loadingState: 'loading'});
      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });

      act(() => {jest.advanceTimersByTime(250);});
      expect(queryByRole('progressbar')).toBeNull();

      act(() => {jest.advanceTimersByTime(250);});
      expect(() => within(searchAutocomplete).getByRole('progressbar')).toBeTruthy();

      await user.keyboard('o');
      act(() => {
        jest.runAllTimers();
      });
      expect(() => within(searchAutocomplete).getByRole('progressbar')).toBeTruthy();
    });

    it('searchAutocomplete should not render a loading circle until a delay of 500ms passes and the menu is open (loadingState: filtering)', async function () {
      let {getByRole, queryByRole} = renderSearchAutocomplete({loadingState: 'filtering'});
      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });

      act(() => {jest.advanceTimersByTime(500);});
      expect(queryByRole('progressbar')).toBeNull();

      await user.keyboard('o');
      act(() => {
        jest.runAllTimers();
      });
      expect(() => within(searchAutocomplete).getByRole('progressbar')).toBeTruthy();
    });

    it('searchAutocomplete should hide the loading circle when loadingState changes to a non-loading state', async function () {
      let {getByRole, queryByRole, rerender} = render(<ExampleSearchAutocomplete loadingState="filtering" />);
      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      expect(queryByRole('progressbar')).toBeNull();

      await user.keyboard('o');
      act(() => {
        jest.runAllTimers();
      });
      act(() => {jest.advanceTimersByTime(500);});
      expect(() => within(searchAutocomplete).getByRole('progressbar')).toBeTruthy();

      rerender(<ExampleSearchAutocomplete loadingState="idle" />);
      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(queryByRole('progressbar')).toBeNull();
    });

    it('searchAutocomplete should hide the loading circle when if the menu closes', async function () {
      let {getByRole, queryByRole} = render(<ExampleSearchAutocomplete loadingState="filtering" />);
      let searchAutocomplete = getByRole('combobox');

      expect(queryByRole('progressbar')).toBeNull();

      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('o');
      act(() => {
        jest.runAllTimers();
      });
      act(() => {jest.advanceTimersByTime(500);});
      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(() => within(searchAutocomplete).getByRole('progressbar')).toBeTruthy();

      act(() => {
        searchAutocomplete.blur();
      });
      act(() => {
        jest.runAllTimers();
      });
      expect(queryByRole('progressbar')).toBeNull();
      expect(queryByRole('listbox')).toBeNull();
    });

    it('searchAutocomplete cancels the 500ms progress circle delay timer if the loading finishes first', function () {
      let {queryByRole, rerender} = render(<ExampleSearchAutocomplete loadingState="loading" menuTrigger="manual" />);
      expect(queryByRole('progressbar')).toBeNull();
      act(() => {jest.advanceTimersByTime(250);});
      expect(queryByRole('progressbar')).toBeNull();

      rerender(<ExampleSearchAutocomplete loadingState="idle" />);
      act(() => {jest.advanceTimersByTime(250);});
      expect(queryByRole('progressbar')).toBeNull();
    });

    it('searchAutocomplete should not reset the 500ms progress circle delay timer when loadingState changes from loading to filtering', function () {
      let {getByRole, queryByRole, rerender} = render(<ExampleSearchAutocomplete loadingState="loading" menuTrigger="manual" />);
      let searchAutocomplete = getByRole('combobox');

      act(() => {jest.advanceTimersByTime(250);});
      expect(queryByRole('progressbar')).toBeNull();

      rerender(<ExampleSearchAutocomplete loadingState="filtering" menuTrigger="manual" />);
      expect(queryByRole('progressbar')).toBeNull();
      act(() => {jest.advanceTimersByTime(250);});
      expect(() => within(searchAutocomplete).getByRole('progressbar')).toBeTruthy();
    });

    it('searchAutocomplete should reset the 500ms progress circle delay timer when input text changes', async function () {
      let {getByRole, queryByRole} = render(<ExampleSearchAutocomplete loadingState="loading" menuTrigger="manual" />);
      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });

      act(() => {jest.advanceTimersByTime(250);});
      expect(queryByRole('progressbar')).toBeNull();

      await user.keyboard('O');
      act(() => {jest.advanceTimersByTime(250);});
      expect(queryByRole('progressbar')).toBeNull();

      act(() => {jest.advanceTimersByTime(250);});
      expect(() => within(searchAutocomplete).getByRole('progressbar')).toBeTruthy();
    });

    it.each`
      LoadingState   | ValidationState
      ${'loading'}   | ${null}
      ${'filtering'} | ${null}
      ${'loading'}   | ${'invalid'}
      ${'filtering'} | ${'invalid'}
    `('should render the loading swirl in the input field when loadingState="$LoadingState" and validationState="$ValidationState"', async ({LoadingState, ValidationState}) => {
      let {getByRole} = renderSearchAutocomplete({loadingState: LoadingState, validationState: ValidationState});
      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      act(() => {jest.advanceTimersByTime(500);});

      if (ValidationState) {
        expect(searchAutocomplete).toHaveAttribute('aria-invalid', 'true');
      }

      // validation icon should not be present
      expect(within(searchAutocomplete).queryByRole('img', {hidden: true})).toBeNull();

      await user.keyboard('o');
      act(() => {
        jest.runAllTimers();
      });

      let progressSpinner = getByRole('progressbar', {hidden: true});
      expect(progressSpinner).toBeTruthy();
      expect(progressSpinner).toHaveAttribute('aria-label', 'Loading...');

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(within(listbox).queryByRole('progressbar')).toBeNull();
    });

    it('should render the loading swirl in the listbox when loadingState="loadingMore"', async function () {
      let {getByRole, queryByRole} = renderSearchAutocomplete({loadingState: 'loadingMore'});
      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });

      expect(queryByRole('progressbar')).toBeNull();

      await user.keyboard('o');
      act(() => jest.runAllTimers());

      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();

      let progressSpinner = within(listbox).getByRole('progressbar');
      expect(progressSpinner).toBeTruthy();
      expect(progressSpinner).toHaveAttribute('aria-label', 'Loading more…');
    });
  });

  describe('mobile searchAutocomplete', function () {
    beforeEach(() => {
      jest.spyOn(window.screen, 'width', 'get').mockImplementation(() => 700);
    });

    afterEach(() => {
      act(() => jest.runAllTimers());
      jest.clearAllMocks();
    });

    function testSearchAutocompleteTrayOpen(input, tray, listbox, focusedItemIndex) {
      expect(tray).toBeVisible();

      let dialog = within(tray).getByRole('dialog');
      expect(input).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-labelledby', input.getAttribute('aria-labelledby'));

      expect(input).toHaveAttribute('role', 'searchbox');
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveAttribute('aria-controls', listbox.id);
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');

      let items = within(listbox).getAllByRole('option');
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent('One');
      expect(items[1]).toHaveTextContent('Two');
      expect(items[2]).toHaveTextContent('Three');

      expect(document.activeElement).toBe(input);

      if (typeof focusedItemIndex === 'undefined') {
        expect(input).not.toHaveAttribute('aria-activedescendant');

        act(() => {
          fireEvent.keyDown(input, {key: 'ArrowDown', code: 40, charCode: 40});
          fireEvent.keyUp(input, {key: 'ArrowDown', code: 40, charCode: 40});
          jest.runAllTimers();
        });

        expect(input).toHaveAttribute('aria-activedescendant', items[0].id);
      } else {
        expect(input).toHaveAttribute('aria-activedescendant', items[focusedItemIndex].id);
      }
    }

    it('should render a button to open the tray', function () {
      let {getByRole, getByText} = renderSearchAutocomplete({});
      let button = getByRole('button');

      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-labelledby', `${getByText('Test').id} ${button.getElementsByTagName('span')[0].id}`);
    });

    it('button should be labelled by external label', function () {
      let {getByRole} = renderSearchAutocomplete({label: null, 'aria-labelledby': 'label-id'});
      let button = getByRole('button');

      expect(button).toHaveAttribute('aria-labelledby', `label-id ${button.getElementsByTagName('span')[0].id}`);
    });

    it('button should be labelled by aria-label', function () {
      let {getByRole} = renderSearchAutocomplete({label: null, 'aria-label': 'Label'});
      let button = getByRole('button');

      expect(button).toHaveAttribute('aria-label', 'Label');
      expect(button).toHaveAttribute('aria-labelledby', `${button.id} ${button.getElementsByTagName('span')[0].id}`);
    });

    it('button should be labelled by external label and builtin label', function () {
      let {getByRole, getByText} = renderSearchAutocomplete({'aria-labelledby': 'label-id'});
      let button = getByRole('button');

      expect(button).toHaveAttribute('aria-labelledby', `${getByText('Test').id} label-id ${button.getElementsByTagName('span')[0].id}`);
    });

    it('readonly searchAutocomplete should not open on press', function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete({isReadOnly: true});
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(() => getByTestId('tray')).toThrow();
    });

    it('opening the tray autofocuses the tray input', function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete();
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      expect(button).toHaveAttribute('aria-expanded', 'true');

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let listbox = getByRole('listbox');

      let trayInput = within(tray).getByRole('searchbox');
      testSearchAutocompleteTrayOpen(trayInput, tray, listbox);
    });

    it('closing the tray autofocuses the button', function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete();
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();

      let input = within(tray).getByRole('searchbox');

      fireEvent.keyDown(input, {key: 'Escape', code: 27, charCode: 27});
      fireEvent.keyUp(input, {key: 'Escape', code: 27, charCode: 27});
      act(() => {
        jest.runAllTimers();
      });

      expect(() => getByTestId('tray')).toThrow();
      // run restore focus rAF
      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(button);
    });

    it('height of the tray remains fixed even if the number of items changes', async function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete();
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();

      let items = within(tray).getAllByRole('option');
      expect(items.length).toBe(3);

      let trayInput = within(tray).getByRole('searchbox');
      // Save the height style for comparison later
      let style = tray.getAttribute('style');
      act(() => {
        trayInput.focus();
      });
      await user.keyboard('One');

      act(() => {
        jest.runAllTimers();
      });

      items = within(tray).getAllByRole('option');
      expect(items.length).toBe(1);
      tray = getByTestId('tray');
      expect(tray.getAttribute('style')).toBe(style);
    });

    it('up/down arrows still traverse the items in the tray', function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete();

      let button = getByRole('button');
      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();

      let input = within(tray).getByRole('searchbox');
      expect(document.activeElement).toBe(input);

      fireEvent.keyDown(input, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyUp(input, {key: 'ArrowDown', code: 40, charCode: 40});
      act(() => {
        jest.runAllTimers();
      });

      let listbox = getByRole('listbox');
      testSearchAutocompleteTrayOpen(input, tray, listbox, 0);

      fireEvent.keyDown(input, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyUp(input, {key: 'ArrowDown', code: 40, charCode: 40});
      act(() => {
        jest.runAllTimers();
      });

      let items = within(tray).getAllByRole('option');

      expect(input).toHaveAttribute('aria-activedescendant', items[1].id);

      fireEvent.keyDown(input, {key: 'ArrowUp', code: 38, charCode: 38});
      fireEvent.keyUp(input, {key: 'ArrowUp', code: 38, charCode: 38});
      act(() => {
        jest.runAllTimers();
      });

      expect(input).toHaveAttribute('aria-activedescendant', items[0].id);
    });

    it('user can filter the menu options by typing in the tray input', async function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete();
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let listbox = getByRole('listbox');
      let trayInput = within(tray).getByRole('searchbox');

      testSearchAutocompleteTrayOpen(trayInput, tray, listbox);
      act(() => {
        trayInput.focus();
      });
      await user.keyboard('r');

      act(() => {
        jest.runAllTimers();
      });

      let items = within(tray).getAllByRole('option');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toBe('Three');

      act(() => {
        fireEvent.change(trayInput, {target: {value: ''}});
        jest.runAllTimers();
      });

      items = within(tray).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[0].textContent).toBe('One');
      expect(items[1].textContent).toBe('Two');
      expect(items[2].textContent).toBe('Three');
    });

    it('tray input can be cleared using a clear button', async function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete();
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let listbox = getByRole('listbox');
      let trayInput = within(tray).getByRole('searchbox');

      expect(() => within(tray).getByLabelText('Clear')).toThrow();

      testSearchAutocompleteTrayOpen(trayInput, tray, listbox);
      act(() => {
        trayInput.focus();
      });
      await user.keyboard('r');

      act(() => {
        jest.runAllTimers();
      });

      expect(document.activeElement).toBe(trayInput);
      expect(trayInput.value).toBe('r');

      let clearButton = within(tray).getByLabelText('Clear');
      expect(clearButton.tagName).toBe('DIV');
      expect(clearButton).not.toHaveAttribute('tabIndex');
      triggerPress(clearButton);
      expect(onClear).toHaveBeenCalledTimes(1);

      act(() => {
        jest.runAllTimers();
      });

      expect(document.activeElement).toBe(trayInput);
      expect(trayInput.value).toBe('');
    });

    it('"No results" placeholder is shown if user types something that doesnt match any of the available options', async function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete();
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let listbox = getByRole('listbox');

      let trayInput = within(tray).getByRole('searchbox');
      testSearchAutocompleteTrayOpen(trayInput, tray, listbox);
      act(() => {
        trayInput.focus();
      });
      await user.keyboard('blah');

      act(() => {
        jest.runAllTimers();
      });

      // check that tray is still visible and placeholder text exists
      expect(tray).toBeVisible();
      let items = within(tray).getAllByRole('option');
      expect(items.length).toBe(1);

      let placeholderText = within(items[0]).getByText('No results');
      expect(placeholderText).toBeVisible();


      fireEvent.change(trayInput, {target: {value: ''}});
      act(() => {
        jest.runAllTimers();
      });

      items = within(tray).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(() => within(tray).getByText('No results')).toThrow();
    });

    it('user can select options by pressing them', function () {
      let {getByRole, getByText, getByTestId} = renderSearchAutocomplete();
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      expect(onOpenChange).toHaveBeenCalledWith(true, 'manual');
      expect(onOpenChange).toHaveBeenCalledTimes(1);

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let listbox = getByRole('listbox');
      let trayInput = within(tray).getByRole('searchbox');
      testSearchAutocompleteTrayOpen(trayInput, tray, listbox);

      let items = within(tray).getAllByRole('option');

      triggerPress(items[1]);
      act(() => {
        jest.runAllTimers();
      });

      expect(onInputChange).toHaveBeenCalledWith('Two');
      expect(onInputChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false, undefined);
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(() => getByTestId('tray')).toThrow();
      expect(button).toHaveAttribute('aria-labelledby', `${getByText('Test').id} ${getByText('Two').id}`);

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      tray = getByTestId('tray');
      expect(tray).toBeVisible();
      trayInput = within(tray).getByRole('searchbox');
      items = within(tray).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[1].textContent).toBe('Two');
      expect(trayInput).not.toHaveAttribute('aria-activedescendant');
      expect(trayInput.value).toBe('Two');
      expect(items[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('user can select options by focusing them and hitting enter', function () {
      let {getByRole, getByText, getByTestId} = renderSearchAutocomplete();
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let listbox = getByRole('listbox');

      let trayInput = within(tray).getByRole('searchbox');

      fireEvent.keyDown(trayInput, {key: 'ArrowUp', code: 38, charCode: 38});
      fireEvent.keyUp(trayInput, {key: 'ArrowUp', code: 38, charCode: 38});
      act(() => {
        jest.runAllTimers();
      });

      expect(onOpenChange).toHaveBeenCalledWith(true, 'manual');
      expect(onOpenChange).toHaveBeenCalledTimes(1);

      testSearchAutocompleteTrayOpen(trayInput, tray, listbox, 2);

      fireEvent.keyDown(trayInput, {key: 'Enter', code: 13, charCode: 13});
      fireEvent.keyUp(trayInput, {key: 'Enter', code: 13, charCode: 13});
      act(() => {
        jest.runAllTimers();
      });

      expect(onInputChange).toHaveBeenCalledWith('Three');
      expect(onInputChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false, undefined);
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(() => getByTestId('tray')).toThrow();
      expect(button).toHaveAttribute('aria-labelledby', `${getByText('Test').id} ${getByText('Three').id}`);

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      tray = getByTestId('tray');
      expect(tray).toBeVisible();
      trayInput = within(tray).getByRole('searchbox');
      let items = within(tray).getAllByRole('option');
      expect(items.length).toBe(3);
      expect(items[2].textContent).toBe('Three');
      expect(trayInput).not.toHaveAttribute('aria-activedescendant');
      expect(trayInput.value).toBe('Three');
      expect(items[2]).toHaveAttribute('aria-selected', 'true');
    });

    it('input is blurred when the user scrolls the listbox with touch', function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete();
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let listbox = getByRole('listbox');

      let trayInput = within(tray).getByRole('searchbox');

      act(() => {
        trayInput.focus();
      });
      act(() => {
        jest.runAllTimers();
      });

      expect(document.activeElement).toBe(trayInput);

      fireEvent.touchStart(listbox);
      fireEvent.scroll(listbox);
      act(() => {
        jest.runAllTimers();
      });

      expect(document.activeElement).not.toBe(trayInput);
    });

    it('label of the tray input should match label of button', function () {
      let {getByRole, getByTestId, getByText} = renderSearchAutocomplete();
      let button = getByRole('button');
      let label = getByText(defaultProps.label);

      expect(button).toHaveAttribute('aria-labelledby', `${label.id} ${button.getElementsByTagName('span')[0].id}`);

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let trayInput = within(tray).getByRole('searchbox');
      let trayInputLabel = within(tray).getByText(defaultProps.label);
      expect(trayInput).toHaveAttribute('aria-labelledby', trayInputLabel.id);
    });

    it('tray input should recieve the same aria-labelledby as the button if an external label is provided', function () {
      let {getByRole, getByTestId, getByText} = render(
        <Provider theme={theme}>
          <label id="test-label" htmlFor="test-id">SearchAutocomplete</label>
          <SearchAutocomplete id="test-id" aria-labelledby="test-label">
            <Item key="one">Item One</Item>
          </SearchAutocomplete>
        </Provider>
      );

      let button = getByRole('button');
      let label = getByText('SearchAutocomplete');

      expect(button).toHaveAttribute('aria-labelledby', `${label.id} ${button.getElementsByClassName('mobile-value')[0].id}`);

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let listbox = getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-label', 'Suggestions');
      expect(listbox).toHaveAttribute('aria-labelledby', `${listbox.id} ${label.id}`);
      let trayInput = within(tray).getByRole('searchbox');
      expect(trayInput).toHaveAttribute('aria-labelledby', label.id);
    });

    it('user can open the tray even if there aren\'t any items to show', function () {
      let {getAllByRole, getByTestId} = render(
        <Provider theme={theme}>
          <SearchAutocomplete label="SearchAutocomplete" items={[]} inputValue="blah">
            {(item) => <Item>{item.name}</Item>}
          </SearchAutocomplete>
        </Provider>
      );
      let button = getAllByRole('button')[0];

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();

      let items = within(tray).getAllByRole('option');
      expect(items.length).toBe(1);

      let placeholderText = within(items[0]).getByText('No results');
      expect(placeholderText).toBeVisible();
    });

    it('searchAutocomplete tray remains open on blur', function () {
      let {getAllByRole, getByTestId} = renderSearchAutocomplete({defaultInputValue: 'Blah'});
      let button = getAllByRole('button')[0];

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let trayInput = within(tray).getByRole('searchbox');
      expect(trayInput.value).toBe('Blah');

      act(() => {
        trayInput.blur();
      });
      act(() => {
        jest.runAllTimers();
      });

      tray = getByTestId('tray');
      expect(tray).toBeVisible();
      expect(trayInput.value).toBe('Blah'); // does not reset on blur
    });

    it('searchAutocomplete tray can be closed using the dismiss buttons', function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete();
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let dismissButtons = within(tray).getAllByRole('button');
      expect(dismissButtons.length).toBe(2);
      expect(dismissButtons[0]).toHaveAttribute('aria-label', 'Dismiss');
      expect(dismissButtons[1]).toHaveAttribute('aria-label', 'Dismiss');

      triggerPress(dismissButtons[0]);
      act(() => {
        jest.runAllTimers();
      });

      expect(() => getByTestId('tray')).toThrow();
    });

    it('searchAutocomplete tray doesn\'t close when tray input is virtually clicked', function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete();
      let button = getByRole('button');

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let trayInput = within(tray).getByRole('searchbox');

      jest.spyOn(trayInput, 'getBoundingClientRect').mockImplementation(() => ({
        left: 100,
        top: 100,
        width: 100,
        height: 50
      }));

      // virtual click on the exact center
      fireEvent.touchEnd(trayInput, {
        changedTouches: [{
          clientX: 150,
          clientY: 125
        }]
      });
      act(() => {
        jest.runAllTimers();
      });

      expect(() => getByTestId('tray')).not.toThrow();
    });

    it('should focus the button when clicking on the label', async function () {
      let {getByRole, getByText} = renderSearchAutocomplete();
      let label = getByText('Test');
      let button = getByRole('button');

      await user.click(label);
      act(() => {
        jest.runAllTimers();
      });

      expect(document.activeElement).toBe(button);
    });

    it('should include invalid in label when validationState="invalid"', function () {
      let {getAllByRole, getByText, getByLabelText} = renderSearchAutocomplete({validationState: 'invalid'});
      let button = getAllByRole('button')[0];
      expect(button).toHaveAttribute('aria-labelledby', `${getByText('Test').id} ${button.getElementsByTagName('span')[0].id} ${getByLabelText('(invalid)').id}`);
    });

    it('menutrigger=focus doesn\'t reopen the tray on close', function () {
      let {getByRole, getByTestId} = renderSearchAutocomplete({menuTrigger: 'focus'});
      let button = getByRole('button');

      act(() => {
        button.focus();
      });
      act(() => {
        jest.runAllTimers();
      });

      // menutrigger = focus is inapplicable for mobile SearchAutocomplete
      expect(() => getByTestId('tray')).toThrow();

      triggerPress(button);
      act(() => {
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let trayInput = within(tray).getByRole('searchbox');

      act(() => {
        trayInput.blur();
      });
      triggerPress(document.body);
      act(() => {
        jest.runAllTimers();
      });

      expect(() => getByTestId('tray')).toThrow();
    });

    it('searchAutocomplete button is focused when autoFocus is true', function () {
      let {getByRole} = renderSearchAutocomplete({autoFocus: true});
      let button = getByRole('button');
      expect(document.activeElement).toBe(button);
    });

    it('searchAutocomplete tray doesn\'t open when controlled input value is updated', function () {
      let {getAllByRole, rerender, getByTestId} = render(<ExampleSearchAutocomplete inputValue="One" />);
      let button = getAllByRole('button')[0];

      act(() => {
        button.focus();
        triggerPress(button);
        jest.runAllTimers();
      });

      let tray = getByTestId('tray');
      expect(tray).toBeVisible();
      let trayInput = within(tray).getByRole('searchbox');

      act(() => {
        trayInput.blur();
      });
      triggerPress(document.body);
      act(() => {
        jest.runAllTimers();
      });

      expect(() => getByTestId('tray')).toThrow();

      act(() => {
        button.blur();
      });
      act(() => {
        jest.runAllTimers();
      });

      rerender(<ExampleSearchAutocomplete inputValue="Two" />);
      act(() => {
        jest.runAllTimers();
      });

      expect(() => getByTestId('tray')).toThrow();
    });

    describe('refs', function () {
      it('attaches a ref to the label wrapper', function () {
        let ref = React.createRef();
        let {getByText} = renderSearchAutocomplete({ref});

        expect(ref.current.UNSAFE_getDOMNode()).toBe(getByText('Test').parentElement);
      });

      it('attaches a ref to wrapper if no label', function () {
        let ref = React.createRef();
        let {getByRole} = renderSearchAutocomplete({ref, label: null, 'aria-label': 'test'});

        expect(ref.current.UNSAFE_getDOMNode()).toBe(getByRole('button').parentElement);
      });

      it('calling focus() on the ref focuses the button', function () {
        let ref = React.createRef();
        let {getByRole} = renderSearchAutocomplete({ref});

        act(() => {ref.current.focus();});
        expect(document.activeElement).toBe(getByRole('button'));
      });
    });

    describe('isLoading', function () {
      it('tray input should render a loading circle after a delay of 500ms if loadingState="filtering"', function () {
        let {getByRole, queryByRole, getByTestId, rerender} = render(<ExampleSearchAutocomplete loadingState="loading" />);
        let button = getByRole('button');
        act(() => {jest.advanceTimersByTime(500);});
        expect(queryByRole('progressbar')).toBeNull();

        triggerPress(button);
        act(() => {
          jest.runAllTimers();
        });

        let tray = getByTestId('tray');
        expect(tray).toBeVisible();
        let listbox = getByRole('listbox');
        expect(within(listbox).getByRole('progressbar')).toBeTruthy();
        expect(within(tray).getAllByRole('progressbar').length).toBe(1);

        rerender(<ExampleSearchAutocomplete loadingState="filtering" />);
        act(() => {jest.advanceTimersByTime(500);});

        expect(within(tray).getByRole('progressbar')).toBeTruthy();
        expect(within(listbox).queryByRole('progressbar')).toBeNull();
      });

      it('tray input should hide the loading circle if loadingState is no longer "filtering"', function () {
        let {getByRole, queryByRole, getByTestId, rerender} = render(<ExampleSearchAutocomplete loadingState="filtering" />);
        let button = getByRole('button');
        act(() => {jest.advanceTimersByTime(500);});
        expect(queryByRole('progressbar')).toBeNull();

        triggerPress(button);
        act(() => {
          jest.runAllTimers();
        });

        let tray = getByTestId('tray');
        expect(tray).toBeVisible();
        let listbox = getByRole('listbox');
        expect(within(tray).getByRole('progressbar')).toBeTruthy();
        expect(within(listbox).queryByRole('progressbar')).toBeNull();

        rerender(<ExampleSearchAutocomplete loadingState="idle" />);
        expect(within(tray).queryByRole('progressbar')).toBeNull();
      });

      it('tray input loading circle timer should reset on input value change', async function () {
        let {getByRole, getByTestId, rerender} = render(<ExampleSearchAutocomplete />);
        let button = getByRole('button');

        act(() => {
          triggerPress(button);
          jest.runAllTimers();
        });

        rerender(<ExampleSearchAutocomplete loadingState="filtering" />);
        let tray = getByTestId('tray');
        expect(tray).toBeVisible();
        expect(within(tray).queryByRole('progressbar')).toBeNull();
        act(() => {jest.advanceTimersByTime(250);});

        let trayInput = within(tray).getByRole('searchbox');
        act(() => {
          trayInput.focus();
        });
        await user.keyboard('One');
        act(() => {jest.advanceTimersByTime(250);});
        expect(within(tray).queryByRole('progressbar')).toBeNull();

        act(() => {jest.advanceTimersByTime(250);});
        expect(within(tray).getByRole('progressbar')).toBeTruthy();
      });

      it.each`
      LoadingState   | ValidationState
      ${'loading'}   | ${null}
      ${'filtering'} | ${null}
      ${'loading'}   | ${'invalid'}
      ${'filtering'} | ${'invalid'}
      `('should render the loading swirl in the tray input field when loadingState="$LoadingState" and validationState="$ValidationState"', ({LoadingState, ValidationState}) => {
        let {getAllByRole, getByRole, getByTestId} = renderSearchAutocomplete({loadingState: LoadingState, validationState: ValidationState, defaultInputValue: 'O'});
        let button = getAllByRole('button')[0];
        act(() => {jest.advanceTimersByTime(500);});

        triggerPress(button);
        act(() => {
          jest.runAllTimers();
        });

        let tray = getByTestId('tray');
        expect(tray).toBeVisible();

        let trayProgressSpinner = within(tray).getByRole('progressbar');
        expect(trayProgressSpinner).toBeTruthy();

        if (LoadingState === 'loading') {
          expect(trayProgressSpinner).toHaveAttribute('aria-label', 'Loading more…');
        } else {
          expect(trayProgressSpinner).toHaveAttribute('aria-label', 'Loading...');
        }

        let clearButton = within(tray).getByLabelText('Clear');
        expect(clearButton).toBeTruthy();

        let listbox = getByRole('listbox');

        if (LoadingState === 'loading') {
          expect(within(listbox).getByRole('progressbar')).toBeTruthy();
        } else {
          expect(within(listbox).queryByRole('progressbar')).toBeNull();
        }

        if (ValidationState) {
          let trayInput = within(tray).getByRole('searchbox');
          expect(trayInput).toHaveAttribute('aria-invalid', 'true');
        }

        if (ValidationState && LoadingState === 'loading') {
          // validation icon should be present along with the clear button and search icon
          expect(within(tray).getAllByRole('img', {hidden: true})).toHaveLength(3);
        } else {
          // validation icon should not be present, only imgs are the clear button and search icon
          expect(within(tray).getAllByRole('img', {hidden: true})).toHaveLength(2);
        }
      });

      it('should render the loading swirl in the listbox when loadingState="loadingMore"', function () {
        let {getAllByRole, getByRole, queryByRole, getByTestId} = renderSearchAutocomplete({loadingState: 'loadingMore', validationState: 'invalid'});
        let button = getAllByRole('button')[0];

        expect(queryByRole('progressbar')).toBeNull();

        triggerPress(button);
        act(() => {
          jest.runAllTimers();
        });

        let tray = getByTestId('tray');
        expect(tray).toBeVisible();

        let allProgressSpinners = within(tray).getAllByRole('progressbar');
        expect(allProgressSpinners.length).toBe(1);

        let icons = within(tray).getAllByRole('img', {hidden: true});
        expect(icons.length).toBe(3);

        let clearButton = within(tray).getByLabelText('Clear');
        expect(clearButton).toBeTruthy();

        expect(within(clearButton).getByRole('img', {hidden: true})).toBe(icons[2]);

        let trayInput = within(tray).getByRole('searchbox');
        expect(trayInput).toHaveAttribute('aria-invalid', 'true');

        let listbox = getByRole('listbox');
        let progressSpinner = within(listbox).getByRole('progressbar');
        expect(progressSpinner).toBeTruthy();
        expect(progressSpinner).toHaveAttribute('aria-label', 'Loading more…');
      });
    });
  });

  describe('accessibility', function () {
    beforeAll(function () {
      jest.spyOn(window.screen, 'width', 'get').mockImplementation(() => 1024);
    });

    afterAll(function () {
      jest.restoreAllMocks();
    });
    // NVDA workaround so that letters are read out when user presses left/right arrow to navigate through what they typed
    it('clears aria-activedescendant when user presses left/right arrow (NVDA fix)', async function () {
      let {getByRole} = renderSearchAutocomplete();

      let searchAutocomplete = getByRole('combobox');
      act(() => {
        searchAutocomplete.focus();
      });
      await user.keyboard('One');
      act(() => {
        jest.runAllTimers();
      });
      let listbox = getByRole('listbox');
      expect(listbox).toBeVisible();
      expect(searchAutocomplete).toHaveAttribute('aria-controls', listbox.id);

      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      act(() => {
        jest.runAllTimers();
      });

      let items = within(listbox).getAllByRole('option');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('One');
      expect(searchAutocomplete).toHaveAttribute('aria-activedescendant', items[0].id);

      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowLeft', code: 37, charCode: 37});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowLeft', code: 37, charCode: 37});
      act(() => {
        jest.runAllTimers();
      });

      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');

      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown', code: 40, charCode: 40});
      act(() => {
        jest.runAllTimers();
      });

      expect(searchAutocomplete).toHaveAttribute('aria-activedescendant', items[0].id);

      fireEvent.keyDown(searchAutocomplete, {key: 'ArrowRight', code: 39, charCode: 39});
      fireEvent.keyUp(searchAutocomplete, {key: 'ArrowRight', code: 39, charCode: 39});
      act(() => {
        jest.runAllTimers();
      });

      expect(searchAutocomplete).not.toHaveAttribute('aria-activedescendant');
    });

    describe('announcements', function () {
      // Live announcer is (mostly) only used on apple devices for VoiceOver.
      // Mock navigator.platform so we take that codepath.
      let platformMock;
      beforeEach(() => {
        platformMock = jest.spyOn(navigator, 'platform', 'get').mockImplementation(() => 'MacIntel');
      });

      afterEach(() => {
        platformMock.mockRestore();
      });

      describe('keyboard navigating', function () {
        it('should announce items when navigating with the arrow keys', function () {
          let {getByRole} = renderSearchAutocomplete();
          let searchAutocomplete = getByRole('combobox');

          fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
          fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
          act(() => {
            jest.runAllTimers();
          });

          expect(announce).toHaveBeenLastCalledWith('One');

          fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
          fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
          act(() => {
            jest.runAllTimers();
          });

          expect(announce).toHaveBeenLastCalledWith('Two');
        });

        it('should announce when navigating into a section with multiple items', function () {
          let {getByRole} = renderSectionSearchAutocomplete();
          let searchAutocomplete = getByRole('combobox');

          fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
          fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
          act(() => {
            jest.runAllTimers();
          });

          expect(announce).toHaveBeenLastCalledWith('Entered group Section One, with 3 options. One');

          fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
          fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
          act(() => {
            jest.runAllTimers();
          });

          expect(announce).toHaveBeenLastCalledWith('Two');
        });

        it('should announce when navigating into a section with a single item', async function () {
          let {getByRole} = renderSectionSearchAutocomplete({defaultInputValue: 'Tw'});
          let searchAutocomplete = getByRole('combobox');
          act(() => {
            searchAutocomplete.focus();
          });

          await user.keyboard('o');
          act(() => {
            jest.runAllTimers();
          });
          fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
          fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
          act(() => {
            jest.runAllTimers();
          });

          expect(announce).toHaveBeenLastCalledWith('Entered group Section One, with 1 option. Two');
        });
      });

      describe('filtering', function () {
        it('should announce the number of options available when filtering', async function () {
          let {getByRole} = renderSearchAutocomplete();
          let searchAutocomplete = getByRole('combobox');
          act(() => {
            searchAutocomplete.focus();
          });

          await user.keyboard('o');
          act(() => {
            jest.runAllTimers();
          });

          expect(announce).toHaveBeenLastCalledWith('2 options available.');

          await user.keyboard('n');
          act(() => {
            jest.runAllTimers();
          });

          expect(announce).toHaveBeenLastCalledWith('1 option available.');
        });

        it('should announce the number of options available when opening the menu', async function () {
          let {getByRole} = renderSearchAutocomplete();
          let searchAutocomplete = getByRole('combobox');
          act(() => {
            searchAutocomplete.focus();
          });

          await user.keyboard('o');
          act(() => {
            jest.runAllTimers();
          });

          expect(announce).toHaveBeenCalledWith('2 options available.');
        });
      });

      describe('selection', function () {
        it('should announce when a selection occurs', function () {
          let {getByRole} = renderSearchAutocomplete();
          let searchAutocomplete = getByRole('combobox');

          act(() => {
            searchAutocomplete.focus();
          });
          fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
          fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
          act(() => {
            jest.runAllTimers();
          });

          expect(announce).toHaveBeenLastCalledWith('One');

          fireEvent.keyDown(searchAutocomplete, {key: 'Enter'});
          fireEvent.keyUp(searchAutocomplete, {key: 'Enter'});
          act(() => {
            jest.runAllTimers();
          });

          expect(announce).toHaveBeenLastCalledWith('One, selected');
        });
      });
    });

    describe('hiding surrounding content', function () {
      it('should hide elements outside the searchAutocomplete with aria-hidden', function () {
        let {getByRole, queryAllByRole, getAllByRole} = render(
          <>
            <input type="checkbox" />
            <ExampleSearchAutocomplete />
            <input type="checkbox" />
          </>
        );

        let outside = getAllByRole('checkbox');
        let searchAutocomplete = getByRole('combobox');

        expect(outside).toHaveLength(2);

        act(() => {
          searchAutocomplete.focus();
        });
        fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
        fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
        act(() => {
          jest.runAllTimers();
        });

        let listbox = getByRole('listbox');
        expect(listbox).toBeVisible();
        expect(outside[0]).toHaveAttribute('aria-hidden', 'true');
        expect(outside[1]).toHaveAttribute('aria-hidden', 'true');

        expect(queryAllByRole('checkbox')).toEqual([]);
        expect(getByRole('combobox')).toBeVisible();
      });

      it('should not traverse into a hidden container', function () {
        let {getByRole, queryAllByRole, getAllByRole} = render(
          <>
            <div>
              <input type="checkbox" />
            </div>
            <ExampleSearchAutocomplete />
            <input type="checkbox" />
          </>
        );

        let outside = getAllByRole('checkbox');
        let searchAutocomplete = getByRole('combobox');

        expect(outside).toHaveLength(2);

        act(() => {
          searchAutocomplete.focus();
          fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
          fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
          jest.runAllTimers();
        });

        let listbox = getByRole('listbox');
        expect(listbox).toBeVisible();
        expect(outside[0].parentElement).toHaveAttribute('aria-hidden', 'true');
        expect(outside[0]).not.toHaveAttribute('aria-hidden', 'true');
        expect(outside[1]).toHaveAttribute('aria-hidden', 'true');

        expect(queryAllByRole('checkbox')).toEqual([]);
        expect(getByRole('combobox')).toBeVisible();
      });

      it('should not hide the live announcer element', function () {
        let platformMock = jest.spyOn(navigator, 'platform', 'get').mockImplementation(() => 'MacIntel');
        let {getByRole} = render(<ExampleSearchAutocomplete />);

        // Use the real live announcer implementation just for this one test
        let {announce: realAnnounce} = jest.requireActual('@react-aria/live-announcer');
        announce.mockImplementationOnce(realAnnounce);

        let searchAutocomplete = getByRole('combobox');

        act(() => {
          searchAutocomplete.focus();
          fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
          fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
          jest.runAllTimers();
        });

        let listbox = getByRole('listbox');
        expect(listbox).toBeVisible();
        expect(screen.getAllByRole('log')).toHaveLength(2);
        platformMock.mockRestore();
      });

      it('should handle when a new element is added outside while open', async function () {
        let Test = (props) => (
          <div>
            {props.show && <input type="checkbox" />}
            <ExampleSearchAutocomplete />
            {props.show && <input type="checkbox" />}
          </div>
        );

        let {getByRole, getAllByRole, queryAllByRole, rerender} = render(<Test />);

        let searchAutocomplete = getByRole('combobox');

        act(() => {
          searchAutocomplete.focus();
          fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
          fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
          jest.runAllTimers();
        });

        let listbox = getByRole('listbox');
        expect(listbox).toBeVisible();

        rerender(<Test show />);

        await waitFor(() => expect(queryAllByRole('checkbox')).toEqual([]));
        expect(getByRole('combobox')).toBeVisible();
        expect(getByRole('listbox')).toBeVisible();

        let outside = getAllByRole('checkbox', {hidden: true});
        expect(outside[0]).toHaveAttribute('aria-hidden', 'true');
        expect(outside[1]).toHaveAttribute('aria-hidden', 'true');
      });

      it('should handle when a new element is added to an already hidden container', async function () {
        let Test = (props) => (
          <div>
            <div data-testid="test">
              {props.show && <input type="checkbox" />}
            </div>
            <ExampleSearchAutocomplete />
            {props.show && <input type="checkbox" />}
          </div>
        );

        let {getByRole, getAllByRole, queryAllByRole, getByTestId, rerender} = render(<Test />);

        let searchAutocomplete = getByRole('combobox');
        let outer = getByTestId('test');

        act(() => {
          searchAutocomplete.focus();
          fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
          fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
          jest.runAllTimers();
        });

        let listbox = getByRole('listbox');

        expect(listbox).toBeVisible();
        expect(outer).toHaveAttribute('aria-hidden', 'true');

        rerender(<Test show />);

        await waitFor(() => expect(queryAllByRole('checkbox')).toEqual([]));
        expect(getByRole('combobox')).toBeVisible();
        expect(getByRole('listbox')).toBeVisible();

        let outside = getAllByRole('checkbox', {hidden: true});
        expect(outer).toHaveAttribute('aria-hidden', 'true');
        expect(outside[0]).not.toHaveAttribute('aria-hidden');
        expect(outside[1]).toHaveAttribute('aria-hidden', 'true');
      });

      it('should handle when a new element is added inside the listbox', async function () {
        let Test = (props) => (
          <div>
            <input type="checkbox" />
            <Provider theme={theme}>
              <SearchAutocomplete label="SearchAutocomplete" {...props}>
                {item => <Item>{item.name}</Item>}
              </SearchAutocomplete>
            </Provider>
            <input type="checkbox" />
          </div>
        );

        let {getByRole, queryAllByRole, rerender} = render(
          <Test items={[{id: 1, name: 'One'}]} />
        );

        let searchAutocomplete = getByRole('combobox');

        act(() => {
          searchAutocomplete.focus();
        });
        fireEvent.keyDown(searchAutocomplete, {key: 'ArrowDown'});
        fireEvent.keyUp(searchAutocomplete, {key: 'ArrowDown'});
        act(() => {
          jest.runAllTimers();
        });

        let listbox = getByRole('listbox');
        let options = within(listbox).getAllByRole('option');
        expect(options).toHaveLength(1);
        expect(queryAllByRole('checkbox')).toEqual([]);

        rerender(<Test items={[{id: 1, name: 'One'}, {id: 2, name: 'Two'}]} />);

        // Wait for mutation observer tick
        await Promise.resolve();

        options = within(listbox).getAllByRole('option');
        expect(options).toHaveLength(2);

        expect(queryAllByRole('checkbox')).toEqual([]);
        expect(getByRole('combobox')).toBeVisible();
        expect(getByRole('listbox')).toBeVisible();
      });
    });
  });
});
