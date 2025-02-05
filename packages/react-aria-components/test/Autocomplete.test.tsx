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

import {AriaAutocompleteTests} from './AriaAutocomplete.test-util';
import {Button, Dialog, DialogTrigger, Header, Input, Label, ListBox, ListBoxItem, ListBoxSection, Menu, MenuItem, MenuSection, Popover, SearchField, Separator, Text, TextField, UNSTABLE_Autocomplete} from '..';
import {pointerMap, render, within} from '@react-spectrum/test-utils-internal';
import React, {ReactNode} from 'react';
import {useAsyncList} from 'react-stately';
import {useFilter} from '@react-aria/i18n';
import userEvent from '@testing-library/user-event';

interface AutocompleteItem {
  id: string,
  name: string
}

let items: AutocompleteItem[] = [{id: '1', name: 'Foo'}, {id: '2', name: 'Bar'}, {id: '3', name: 'Baz'}];
let onAction = jest.fn();
let onSelectionChange = jest.fn();

let StaticMenu = (props) => (
  <Menu {...props}>
    <MenuItem id="1">Foo</MenuItem>
    <MenuItem id="2">Bar</MenuItem>
    <MenuItem id="3">Baz</MenuItem>
  </Menu>
);

let DynamicMenu = (props) => (
  <Menu {...props} items={items}>
    {(item: AutocompleteItem) => <MenuItem id={item.id}>{item.name}</MenuItem>}
  </Menu>
);

let MenuWithLinks = (props) => (
  <Menu {...props}>
    <MenuItem id="1">Foo</MenuItem>
    <MenuItem id="2">Bar</MenuItem>
    <MenuItem id="3" href="https://google.com">Google</MenuItem>
  </Menu>
);

let MenuWithSections = (props) => (
  <Menu {...props}>
    <MenuSection id="sec1">
      <Header>MenuSection 1</Header>
      <MenuItem id="1">Foo</MenuItem>
      <MenuItem id="2">Bar</MenuItem>
      <MenuItem id="3">Baz</MenuItem>
    </MenuSection>
    <Separator />
    <MenuSection id="sec2">
      <Header>MenuSection 2</Header>
      <MenuItem id="4">Copy</MenuItem>
      <MenuItem id="5">Cut</MenuItem>
      <MenuItem id="6">Paste</MenuItem>
    </MenuSection>
  </Menu>
);

let StaticListbox = (props) => (
  <ListBox {...props}>
    <ListBoxItem id="1">Foo</ListBoxItem>
    <ListBoxItem id="2">Bar</ListBoxItem>
    <ListBoxItem id="3">Baz</ListBoxItem>
  </ListBox>
);

let ListBoxWithLinks = (props) => (
  <ListBox {...props}>
    <ListBoxItem id="1">Foo</ListBoxItem>
    <ListBoxItem id="2">Bar</ListBoxItem>
    <ListBoxItem id="3" href="https://google.com">Google</ListBoxItem>
  </ListBox>
);

let ListBoxWithSections = (props) => (
  <ListBox {...props}>
    <ListBoxSection id="sec1">
      <Header>ListBox Section 1</Header>
      <ListBoxItem id="1">Foo</ListBoxItem>
      <ListBoxItem id="2">Bar</ListBoxItem>
      <ListBoxItem id="3">Baz</ListBoxItem>
    </ListBoxSection>
    <Separator />
    <ListBoxSection id="sec2">
      <Header>ListBox Section 2</Header>
      <ListBoxItem id="4">Copy</ListBoxItem>
      <ListBoxItem id="5">Cut</ListBoxItem>
      <ListBoxItem id="6">Paste</ListBoxItem>
    </ListBoxSection>
  </ListBox>
);

let AutocompleteWrapper = ({autocompleteProps = {}, inputProps = {}, children}: {autocompleteProps?: any, inputProps?: any, children?: ReactNode}) => {
  let {contains} = useFilter({sensitivity: 'base'});
  let filter = (textValue, inputValue) => contains(textValue, inputValue);

  return (
    <UNSTABLE_Autocomplete filter={filter} {...autocompleteProps}>
      <SearchField {...inputProps}>
        <Label style={{display: 'block'}}>Test</Label>
        <Input />
        <Button>✕</Button>
        <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
      </SearchField>
      {children}
    </UNSTABLE_Autocomplete>
  );
};

let ControlledAutocomplete = ({autocompleteProps = {}, inputProps = {}, children}: {autocompleteProps?: any, inputProps?: any, children?: ReactNode}) => {
  let [inputValue, setInputValue] = React.useState('');
  let {contains} = useFilter({sensitivity: 'base'});
  let filter = (textValue, inputValue) => contains(textValue, inputValue);

  return (
    <UNSTABLE_Autocomplete inputValue={inputValue} onInputChange={setInputValue} filter={filter} {...autocompleteProps}>
      <SearchField {...inputProps}>
        <Label style={{display: 'block'}}>Test</Label>
        <Input />
        <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
      </SearchField>
      {children}
    </UNSTABLE_Autocomplete>
  );
};

let AsyncFiltering = ({autocompleteProps = {}, inputProps = {}}: {autocompleteProps?: any, inputProps?: any, children?: ReactNode}) => {
  let list = useAsyncList<AutocompleteItem>({
    async load({filterText}) {
      let json = await new Promise(resolve => {
        setTimeout(() => {
          resolve(filterText ? items.filter(item => {
            let name = item.name.toLowerCase();
            for (let filterChar of filterText.toLowerCase()) {
              if (!name.includes(filterChar)) {
                return false;
              }
              name = name.replace(filterChar, '');
            }
            return true;
          }) : items);
        }, 300);
      }) as AutocompleteItem[];

      return {
        items: json
      };
    }
  });

  return (
    <UNSTABLE_Autocomplete inputValue={list.filterText} onInputChange={list.setFilterText} {...autocompleteProps}>
      <SearchField {...inputProps}>
        <Label style={{display: 'block'}}>Test</Label>
        <Input />
        <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
      </SearchField>
      <Menu
        items={list.items}
        onAction={onAction}
        onSelectionChange={onSelectionChange}>
        {item => <MenuItem id={item.id}>{item.name}</MenuItem>}
      </Menu>
    </UNSTABLE_Autocomplete>
  );
};

describe('Autocomplete', () => {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  // Skipping since arrow keys will still leak out from useSelectableCollection, re-enable when that gets fixed
  it.skip('should prevent key presses from leaking out of the Autocomplete', async () => {
    let onKeyDown = jest.fn();
    let {getByRole} = render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div onKeyDown={onKeyDown}>
        <AutocompleteWrapper>
          <StaticMenu />
        </AutocompleteWrapper>
      </div>
    );

    let input = getByRole('searchbox');
    await user.tab();
    expect(document.activeElement).toBe(input);
    await user.keyboard('{ArrowDown}');
    expect(onKeyDown).not.toHaveBeenCalled();
    onKeyDown.mockReset();
  });

  it('should clear the input field when clicking on the clear button', async () => {
    let {getByRole} = render(
      <AutocompleteWrapper>
        <StaticMenu />
      </AutocompleteWrapper>
    );

    let input = getByRole('searchbox');
    await user.tab();
    expect(document.activeElement).toBe(input);
    await user.keyboard('Foo');
    expect(input).toHaveValue('Foo');

    let button = getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Clear search');
    await user.click(button);

    expect(input).toHaveValue('');
  });

  it('should apply focusVisible/focused to virtually focused menu items when keyboard navigating', async () => {
    let {getByRole} = render(
      <AutocompleteWrapper>
        <StaticMenu />
      </AutocompleteWrapper>
    );

    let input = getByRole('searchbox');
    await user.tab();
    expect(document.activeElement).toBe(input);
    await user.keyboard('{ArrowDown}');
    let menu = getByRole('menu');
    let options = within(menu).getAllByRole('menuitem');
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    expect(options[0]).toHaveAttribute('data-focus-visible');

    await user.click(input);
    await user.hover(options[1]);
    options = within(menu).getAllByRole('menuitem');
    expect(options[1]).toHaveAttribute('data-focused');
    expect(options[1]).not.toHaveAttribute('data-focus-visible');
  });

  it('should be able to tab inside a focus scope that contains', async () => {
    const MyMenu = () => {
      let {contains} = useFilter({sensitivity: 'base'});

      return (
        <DialogTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Dialog>
              <Button>First</Button>
              <Button>Second</Button>
              <UNSTABLE_Autocomplete filter={contains}>
                <TextField autoFocus aria-label="Search">
                  <Input />
                </TextField>
                <Menu>
                  <MenuItem>Open</MenuItem>
                  <MenuItem>
                    Rename…
                  </MenuItem>
                  <MenuItem>
                    Duplicate
                  </MenuItem>
                </Menu>
              </UNSTABLE_Autocomplete>
            </Dialog>
          </Popover>
        </DialogTrigger>
      );
    };

    function App() {
      return (
        <div>
          <input />
          <div>
            <MyMenu />
          </div>
          <input />
        </div>
      );
    }

    let {getByRole} = render(<App />);
    let trigger = getByRole('button', {name: 'Menu'});
    await user.click(trigger);
    let firstButton = getByRole('button', {name: 'First'});
    let secondButton = getByRole('button', {name: 'Second'});
    let input = getByRole('textbox');

    expect(document.activeElement).toBe(input);

    await user.tab();

    expect(document.activeElement).toBe(firstButton);

    await user.tab({shift: true});

    expect(document.activeElement).toBe(input);

    await user.tab({shift: true});

    expect(document.activeElement).toBe(secondButton);
  });

  it('should be able to tab inside a focus scope that contains', async () => {
    const MyMenu = () => {
      let {contains} = useFilter({sensitivity: 'base'});

      return (
        <DialogTrigger>
          <Button aria-label="Menu">☰</Button>
          <Popover>
            <Dialog>
              <UNSTABLE_Autocomplete filter={contains}>
                <TextField autoFocus aria-label="Search">
                  <Input />
                </TextField>
                <Menu>
                  <MenuItem>Open</MenuItem>
                  <MenuItem>
                    Rename…
                  </MenuItem>
                  <MenuItem>
                    Duplicate
                  </MenuItem>
                </Menu>
              </UNSTABLE_Autocomplete>
              <Button>First</Button>
              <Button>Second</Button>
            </Dialog>
          </Popover>
        </DialogTrigger>
      );
    };

    function App() {
      return (
        <div>
          <input />
          <div>
            <MyMenu />
          </div>
          <input />
        </div>
      );
    }

    let {getByRole} = render(<App />);
    let trigger = getByRole('button', {name: 'Menu'});
    await user.click(trigger);
    let firstButton = getByRole('button', {name: 'First'});
    let secondButton = getByRole('button', {name: 'Second'});
    let input = getByRole('textbox');

    expect(document.activeElement).toBe(input);

    await user.tab();

    expect(document.activeElement).toBe(firstButton);

    await user.tab({shift: true});

    expect(document.activeElement).toBe(input);

    await user.tab({shift: true});

    expect(document.activeElement).toBe(secondButton);
  });
});

AriaAutocompleteTests({
  prefix: 'rac-static-menu',
  renderers: {
    standard: () => render(
      <AutocompleteWrapper>
        <StaticMenu />
      </AutocompleteWrapper>
    ),
    links: () => render(
      <AutocompleteWrapper>
        <MenuWithLinks />
      </AutocompleteWrapper>
    ),
    sections: () => render(
      <AutocompleteWrapper>
        <MenuWithSections />
      </AutocompleteWrapper>
    ),
    controlled: () => render(
      <ControlledAutocomplete>
        <StaticMenu />
      </ControlledAutocomplete>
    ),
    itemActions: () => render(
      <AutocompleteWrapper>
        <StaticMenu onAction={onAction} />
      </AutocompleteWrapper>
    ),
    multipleSelection: () => render(
      <AutocompleteWrapper>
        <StaticMenu selectionMode="multiple" onSelectionChange={onSelectionChange} />
      </AutocompleteWrapper>
    ),
    disabledItems: () => render(
      <AutocompleteWrapper>
        <StaticMenu onAction={onAction} disabledKeys={['2']} />
      </AutocompleteWrapper>
    ),
    defaultValue: () => render(
      <AutocompleteWrapper autocompleteProps={{defaultInputValue: 'Ba'}}>
        <StaticMenu />
      </AutocompleteWrapper>
    )
  },
  actionListener: onAction,
  selectionListener: onSelectionChange
});

AriaAutocompleteTests({
  prefix: 'rac-dynamic-menu',
  renderers: {
    standard: () => render(
      <AutocompleteWrapper>
        <DynamicMenu />
      </AutocompleteWrapper>
    ),
    asyncFiltering: () => render(
      <AsyncFiltering />
    )
  }
});

AriaAutocompleteTests({
  prefix: 'rac-static-listbox',
  renderers: {
    standard: () => render(
      <AutocompleteWrapper>
        <StaticListbox />
      </AutocompleteWrapper>
    ),
    links: () => render(
      <AutocompleteWrapper>
        <ListBoxWithLinks />
      </AutocompleteWrapper>
    ),
    sections: () => render(
      <AutocompleteWrapper>
        <ListBoxWithSections />
      </AutocompleteWrapper>
    ),
    controlled: () => render(
      <ControlledAutocomplete>
        <StaticListbox />
      </ControlledAutocomplete>
    ),
    multipleSelection: () => render(
      <AutocompleteWrapper>
        <StaticListbox selectionMode="multiple" onSelectionChange={onSelectionChange} />
      </AutocompleteWrapper>
    ),
    disabledItems: () => render(
      <AutocompleteWrapper>
        <StaticListbox onAction={onAction} disabledKeys={['2']} />
      </AutocompleteWrapper>
    ),
    defaultValue: () => render(
      <AutocompleteWrapper autocompleteProps={{defaultInputValue: 'Ba'}}>
        <StaticListbox />
      </AutocompleteWrapper>
    )
  },
  ariaPattern: 'listbox',
  actionListener: onAction,
  selectionListener: onSelectionChange
});
