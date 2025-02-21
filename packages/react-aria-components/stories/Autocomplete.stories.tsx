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

import {action} from '@storybook/addon-actions';
import {UNSTABLE_Autocomplete as Autocomplete, Button, Collection, DialogTrigger, Header, Input, Keyboard, Label, ListBox, ListBoxSection, ListLayout, Menu, MenuItem, MenuSection, MenuTrigger, Popover, SearchField, Select, SelectValue, Separator, SubmenuTrigger, Text, TextField, Virtualizer} from 'react-aria-components';
import {MyListBoxItem, MyMenuItem} from './utils';
import React from 'react';
import styles from '../example/index.css';
import {useAsyncList, useListData, useTreeData} from 'react-stately';
import {useFilter} from 'react-aria';

export default {
  title: 'React Aria Components',
  args: {
    onAction: action('onAction'),
    selectionMode: 'multiple'
  },
  argTypes: {
    onAction: {
      table: {
        disable: true
      }
    },
    onSelectionChange: {
      table: {
        disable: true
      }
    },
    selectionMode: {
      control: 'radio',
      options: ['none', 'single', 'multiple']
    }
  }
};

let StaticMenu = (props) => {
  return (
    <Menu className={styles.menu} {...props}>
      <MenuSection className={styles.group} aria-label={'Section 1'}>
        <MyMenuItem>Foo</MyMenuItem>
        <MyMenuItem>Bar</MyMenuItem>
        <MyMenuItem>Baz</MyMenuItem>
        <MyMenuItem href="http://google.com">Google</MyMenuItem>
        <SubmenuTrigger>
          <MyMenuItem>With subdialog</MyMenuItem>
          <Popover
            style={{
              background: 'Canvas',
              color: 'CanvasText',
              border: '1px solid gray',
              padding: 5
            }}>
            <AutocompleteWrapper>
              <TextField autoFocus>
                <Label style={{display: 'block'}}>Search</Label>
                <Input />
                <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
              </TextField>
              <Menu className={styles.menu} {...props}>
                <MyMenuItem>Subdialog Foo</MyMenuItem>
                <MyMenuItem>Subdialog Bar</MyMenuItem>
                <MyMenuItem>Subdialog Baz</MyMenuItem>
              </Menu>
            </AutocompleteWrapper>
          </Popover>
        </SubmenuTrigger>
        <MyMenuItem>Option</MyMenuItem>
        <MyMenuItem>Option with a space</MyMenuItem>
      </MenuSection>
      <Separator style={{borderTop: '1px solid gray', margin: '2px 5px'}} />
      <MenuSection className={styles.group}>
        <Header style={{fontSize: '1.2em'}}>Section 2</Header>
        <MyMenuItem textValue="Copy">
          <Text slot="label">Copy</Text>
          <Text slot="description">Description</Text>
          <Keyboard>⌘C</Keyboard>
        </MyMenuItem>
        <MyMenuItem textValue="Cut">
          <Text slot="label">Cut</Text>
          <Text slot="description">Description</Text>
          <Keyboard>⌘X</Keyboard>
        </MyMenuItem>
        <MyMenuItem textValue="Paste">
          <Text slot="label">Paste</Text>
          <Text slot="description">Description</Text>
          <Keyboard>⌘V</Keyboard>
        </MyMenuItem>
      </MenuSection>
    </Menu>
  );
};

function AutocompleteWrapper(props) {
  let {contains} = useFilter({sensitivity: 'base'});
  let filter = (textValue, inputValue) => contains(textValue, inputValue);
  return (
    <Autocomplete filter={filter} {...props} />
  );
}

export const AutocompleteExample = {
  render: (args) => {
    let {onAction, onSelectionChange, selectionMode} = args;

    return (
      <AutocompleteWrapper>
        <div>
          <TextField autoFocus data-testid="autocomplete-example">
            <Label style={{display: 'block'}}>Test</Label>
            <Input />
            <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
          </TextField>
          <StaticMenu onAction={onAction} onSelectionChange={onSelectionChange} selectionMode={selectionMode} />
        </div>
      </AutocompleteWrapper>
    );
  },
  name: 'Autocomplete complex static with textfield'
};

export const AutocompleteSearchfield = {
  render: (args) => {
    let {onAction, onSelectionChange, selectionMode} = args;
    return (
      <AutocompleteWrapper defaultInputValue="Ba">
        <div>
          <SearchField autoFocus data-testid="autocomplete-example">
            <Label style={{display: 'block'}}>Test</Label>
            <Input />
            <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
          </SearchField>
          <StaticMenu onAction={onAction} onSelectionChange={onSelectionChange} selectionMode={selectionMode} />
        </div>
      </AutocompleteWrapper>
    );
  },
  name: 'Autocomplete complex static with searchfield',
  parameters: {
    description: {
      data: 'Note that on mobile, trying to type into the subdialog inputs may cause scrolling and thus cause the subdialog to close. Please test in landscape mode.'
    }
  }
};

// Note that the trigger items in this array MUST have an id, even if the underlying MenuItem might apply its own
// id. If it is omitted, we can't build the collection node for the trigger node and an error will throw
let dynamicAutocompleteSubdialog = [
  {name: 'Section 1', isSection: true, children: [
    {name: 'Command Palette'},
    {name: 'Open View'}
  ]},
  {name: 'Section 2', isSection: true, children: [
    {name: 'Appearance', id: 'appearance', children: [
      {name: 'Sub Section 1', isSection: true, children: [
        {name: 'Move Primary Side Bar Right'},
        {name: 'Activity Bar Position', id: 'activity', isMenu: true, children: [
          {name: 'Default'},
          {name: 'Top'},
          {name: 'Bottom'},
          {name: 'Hidden'},
          {name: 'Subdialog test', id: 'sub', children: [
            {name: 'A'},
            {name: 'B'},
            {name: 'C'},
            {name: 'D'}
          ]},
          {name: 'Submenu test', id: 'sub2', isMenu: true, children: [
            {name: 'A'},
            {name: 'B'},
            {name: 'C'},
            {name: 'D'}
          ]}
        ]},
        {name: 'Panel Position', id: 'position', children: [
          {name: 'Top'},
          {name: 'Left'},
          {name: 'Right'},
          {name: 'Bottom'}
        ]}
      ]}
    ]},
    {name: 'Editor Layout', id: 'editor', children: [
      {name: 'Sub Section 1', isSection: true, children: [
        {name: 'Split up'},
        {name: 'Split down'},
        {name: 'Split left'},
        {name: 'Split right'}
      ]},
      {name: 'Sub Section 2', isSection: true, children: [
        {name: 'Single'},
        {name: 'Two columns'},
        {name: 'Three columns'},
        {name: 'Two rows'},
        {name: 'Three rows'}
      ]}
    ]}
  ]}
];

interface ItemNode {
  name?: string,
  textValue?: string,
  isSection?: boolean,
  isMenu?: boolean,
  children?: ItemNode[]
}

let dynamicRenderTrigger = (item: ItemNode) => {
  if (item.isMenu) {
    return (
      <SubmenuTrigger>
        <MyMenuItem key={item.name}>{item.name}</MyMenuItem>
        <Popover className={styles.popover}>
          <Menu items={item.children} className={styles.menu} onAction={action(`${item.name} onAction`)}>
            {(item) => dynamicRenderFuncSections(item)}
          </Menu>
        </Popover>
      </SubmenuTrigger>
    );
  } else {
    return (
      <SubmenuTrigger>
        <MyMenuItem id={item.name} textValue={item.name}>
          {item.name}
        </MyMenuItem>
        <Popover
          style={{
            background: 'Canvas',
            color: 'CanvasText',
            border: '1px solid gray',
            padding: 5
          }}>
          <AutocompleteWrapper>
            <SearchField autoFocus>
              <Label style={{display: 'block'}}>Search</Label>
              <Input />
              <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
            </SearchField>
            <Menu className={styles.menu} items={item.children} onAction={action(`${item.name} onAction`)}>
              {(item) => dynamicRenderFuncSections(item)}
            </Menu>
          </AutocompleteWrapper>
        </Popover>
      </SubmenuTrigger>
    );
  }
};

let dynamicRenderItem = (item) => (
  <MyMenuItem id={item.name} textValue={item.name}>
    {item.name}
  </MyMenuItem>
);

let dynamicRenderFuncSections = (item: ItemNode) => {
  if (item.children) {
    if (item.isSection) {
      return (
        <MenuSection className={styles.group} id={item.name} items={item.children}>
          {item.name != null && <Header style={{fontSize: '1.2em'}}>{item.name}</Header>}
          <Collection items={item.children ?? []}>
            {(item) => {
              if (item.children) {
                return dynamicRenderTrigger(item);
              } else {
                return dynamicRenderItem(item);
              }
            }}
          </Collection>
        </MenuSection>
      );
    } else {
      return dynamicRenderTrigger(item);
    }
  } else {
    return dynamicRenderItem(item);
  }
};

export const AutocompleteMenuDynamic = {
  render: (args) => {
    let {onAction, onSelectionChange, selectionMode} = args;

    return (
      <>
        <input />
        <AutocompleteWrapper>
          <div>
            <SearchField autoFocus>
              <Label style={{display: 'block'}}>Test</Label>
              <Input />
              <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
            </SearchField>
            <Menu className={styles.menu} items={dynamicAutocompleteSubdialog} onAction={onAction} onSelectionChange={onSelectionChange} selectionMode={selectionMode}>
              {item => dynamicRenderFuncSections(item)}
            </Menu>
          </div>
        </AutocompleteWrapper>
        <input />
      </>
    );
  },
  name: 'Autocomplete, dynamic menu'
};

export const AutocompleteOnActionOnMenuItems = {
  render: (args) => {
    let {onSelectionChange, selectionMode} = args;
    return (
      <AutocompleteWrapper>
        <div>
          <SearchField autoFocus>
            <Label style={{display: 'block'}}>Test</Label>
            <Input />
            <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
          </SearchField>
          <Menu className={styles.menu} onSelectionChange={onSelectionChange} selectionMode={selectionMode}>
            <MyMenuItem onAction={action('Foo action')}>Foo</MyMenuItem>
            <MyMenuItem onAction={action('Bar action')}>Bar</MyMenuItem>
            <MyMenuItem onAction={action('Baz action')}>Baz</MyMenuItem>
          </Menu>
        </div>
      </AutocompleteWrapper>
    );
  },
  name: 'Autocomplete, onAction on menu items'
};

interface AutocompleteItem {
  id: string,
  name: string
}

let items: AutocompleteItem[] = [{id: '1', name: 'Foo'}, {id: '2', name: 'Bar'}, {id: '3', name: 'Baz'}];

export const AutocompleteDisabledKeys = {
  render: (args) => {
    let {onAction, onSelectionChange, selectionMode} = args;
    return (
      <AutocompleteWrapper>
        <div>
          <SearchField autoFocus>
            <Label style={{display: 'block'}}>Test</Label>
            <Input />
            <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
          </SearchField>
          <Menu className={styles.menu} items={items} onAction={onAction} disabledKeys={['2']} onSelectionChange={onSelectionChange} selectionMode={selectionMode}>
            {item => <MyMenuItem id={item.id}>{item.name}</MyMenuItem>}
          </Menu>
        </div>
      </AutocompleteWrapper>
    );
  },
  name: 'Autocomplete, disabled key'
};

const AsyncExample = (args) => {
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
  let {onSelectionChange, selectionMode, includeLoadState} = args;
  let renderEmptyState;
  if (includeLoadState) {
    renderEmptyState = list.isLoading ? () => 'Loading' : () => 'No results found.';
  }

  return (
    <Autocomplete inputValue={list.filterText} onInputChange={list.setFilterText}>
      <div>
        <SearchField autoFocus>
          <Label style={{display: 'block'}}>Test</Label>
          <Input />
          <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
        </SearchField>
        <ListBox<AutocompleteItem>
          renderEmptyState={renderEmptyState}
          items={includeLoadState && list.isLoading ? [] : list.items}
          className={styles.menu}
          onSelectionChange={onSelectionChange}
          selectionMode={selectionMode}>
          {item => <MyListBoxItem>{item.name}</MyListBoxItem>}
        </ListBox>
      </div>
    </Autocomplete>
  );
};

export const AutocompleteAsyncLoadingExample = {
  render: (args) => {
    return <AsyncExample {...args} />;
  },
  name: 'Autocomplete, useAsync level filtering with load state',
  args: {
    includeLoadState: true
  }
};

const CaseSensitiveFilter = (args) => {
  let {contains} = useFilter({
    sensitivity: 'case'
  });
  let defaultFilter = (itemText, input) => contains(itemText, input);
  let {onAction, onSelectionChange, selectionMode} = args;
  return (
    <Autocomplete filter={defaultFilter}>
      <div>
        <SearchField autoFocus>
          <Label style={{display: 'block'}}>Test</Label>
          <Input />
          <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
        </SearchField>
        <Menu className={styles.menu} items={items} onAction={onAction} onSelectionChange={onSelectionChange} selectionMode={selectionMode}>
          {item => <MyMenuItem id={item.id}>{item.name}</MyMenuItem>}
        </Menu>
      </div>
    </Autocomplete>
  );
};

export const AutocompleteCaseSensitive = {
  render: (args) => {
    return <CaseSensitiveFilter {...args} />;
  },
  name: 'Autocomplete, case sensitive filter'
};

export const AutocompleteWithListbox = {
  render: (args) => {
    let {onSelectionChange, selectionMode} = args;
    return (
      <AutocompleteWrapper defaultInputValue="Ba">
        <div>
          <SearchField autoFocus>
            <Label style={{display: 'block'}}>Test</Label>
            <Input />
            <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
          </SearchField>
          <ListBox className={styles.menu} onSelectionChange={onSelectionChange} selectionMode={selectionMode} aria-label="test listbox with section">
            <ListBoxSection className={styles.group}>
              <Header style={{fontSize: '1.2em'}}>Section 1</Header>
              <MyListBoxItem>Foo</MyListBoxItem>
              <MyListBoxItem>Bar</MyListBoxItem>
              <MyListBoxItem>Baz</MyListBoxItem>
              <MyListBoxItem href="http://google.com">Google</MyListBoxItem>
            </ListBoxSection>
            <Separator style={{borderTop: '1px solid gray', margin: '2px 5px'}} />
            <ListBoxSection className={styles.group} aria-label="Section 2">
              <MyListBoxItem>Copy</MyListBoxItem>
              <MyListBoxItem>Paste</MyListBoxItem>
              <MyListBoxItem>Cut</MyListBoxItem>
            </ListBoxSection>
          </ListBox>
        </div>
      </AutocompleteWrapper>
    );
  },
  name: 'Autocomplete with ListBox'
};

function VirtualizedListBox(props) {
  let items: {id: number, name: string}[] = [];
  for (let i = 0; i < 10000; i++) {
    items.push({id: i, name: `Item ${i}`});
  }

  let list = useListData({
    initialItems: items
  });

  let {onSelectionChange, selectionMode} = props;

  return (
    <Virtualizer layout={ListLayout} layoutOptions={{rowHeight: 25}}>
      <ListBox
        onSelectionChange={onSelectionChange}
        selectionMode={selectionMode}
        className={styles.menu}
        style={{height: 400}}
        aria-label="virtualized listbox"
        items={list.items}>
        {item => <MyListBoxItem>{item.name}</MyListBoxItem>}
      </ListBox>
    </Virtualizer>
  );
}

export const AutocompleteWithVirtualizedListbox = {
  render: (args) => {
    let {onSelectionChange, selectionMode} = args;
    return (
      <AutocompleteWrapper>
        <div>
          <SearchField autoFocus>
            <Label style={{display: 'block'}}>Test</Label>
            <Input />
            <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
          </SearchField>
          <VirtualizedListBox onSelectionChange={onSelectionChange} selectionMode={selectionMode} />
        </div>
      </AutocompleteWrapper>
    );
  },
  name: 'Autocomplete with ListBox, virtualized'
};

let lotsOfSections: any[] = [];
for (let i = 0; i < 50; i++) {
  let children: {name: string, id: string}[] = [];
  for (let j = 0; j < 50; j++) {
    children.push({name: `Section ${i}, Item ${j}`, id: `item_${i}_${j}`});
  }

  lotsOfSections.push({name: 'Section ' + i, id: `section_${i}`, children});
}
lotsOfSections = [{name: 'Recently visited', id: 'recent', children: []}].concat(lotsOfSections);

function ShellExample() {
  let tree = useTreeData<any>({
    initialItems: lotsOfSections,
    getKey: item => item.id,
    getChildren: item => item.children || null
  });

  let onSelectionChange = (keys) => {
    tree.move([...keys][0], 'recent', 0);
  };

  return (
    <Virtualizer
      layout={ListLayout}
      layoutOptions={{
        rowHeight: 25,
        headingHeight: 25
      }}>
      <ListBox
        onSelectionChange={onSelectionChange}
        selectionMode="single"
        className={styles.menu}
        style={{height: 200}}
        aria-label="virtualized listbox"
        items={tree.items}>
        {section => {
          return (
            <ListBoxSection id={section.value.id} className={styles.group}>
              {section.value.name != null && <Header style={{fontSize: '1.2em'}}>{section.value.name}</Header>}
              <Collection items={section.children ?? []}>
                {item => <MyListBoxItem id={item.value.id}>{item.value.name}</MyListBoxItem>}
              </Collection>
            </ListBoxSection>
          );
        }}
      </ListBox>
    </Virtualizer>
  );
}

export const AutocompleteInPopover = {
  render: () => {
    return (
      <MenuTrigger>
        <Button>
          Open popover
        </Button>
        <Popover
          placement="bottom start"
          style={{
            background: 'Canvas',
            color: 'CanvasText',
            border: '1px solid gray',
            padding: 20,
            height: 250
          }}>
          <AutocompleteWrapper>
            <div>
              <SearchField autoFocus>
                <Label style={{display: 'block'}}>Test</Label>
                <Input />
                <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
              </SearchField>
              <ShellExample />
            </div>
          </AutocompleteWrapper>
        </Popover>
      </MenuTrigger>
    );
  },
  name: 'Autocomplete in popover (menu trigger), shell example',
  argTypes: {
    selectionMode: {
      table: {
        disable: true
      }
    }
  },
  parameters: {
    description: {
      data: 'Menu is single selection so only the latest selected option will show the selected style'
    }
  }
};

export const AutocompleteInPopoverDialogTrigger = {
  render: () => {
    return (
      <DialogTrigger>
        <Button>
          Open popover
        </Button>
        <Popover
          placement="bottom start"
          style={{
            background: 'Canvas',
            color: 'CanvasText',
            border: '1px solid gray',
            padding: 20,
            height: 250
          }}>
          {() => (
            <AutocompleteWrapper>
              <div>
                <SearchField autoFocus>
                  <Label style={{display: 'block'}}>Test</Label>
                  <Input />
                  <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
                </SearchField>
                <ShellExample />
              </div>
            </AutocompleteWrapper>
          )}
        </Popover>
      </DialogTrigger>
    );
  },
  name: 'Autocomplete in popover (dialog trigger), shell example',
  argTypes: {
    selectionMode: {
      table: {
        disable: true
      }
    }
  },
  parameters: {
    description: {
      data: 'Menu is single selection so only the latest selected option will show the selected style'
    }
  }
};

const MyMenu = () => {
  let {contains} = useFilter({sensitivity: 'base'});

  return (
    <MenuTrigger>
      <Button aria-label="Menu">☰</Button>
      <Popover>
        <Button>First</Button>
        <Button>Second</Button>
        <Autocomplete filter={contains}>
          <TextField autoFocus>
            <Input />
          </TextField>
          <Menu>
            <MenuItem onAction={() => console.log('open')}>Open</MenuItem>
            <MenuItem onAction={() => console.log('rename')}>
              Rename…
            </MenuItem>
            <MenuItem onAction={() => console.log('duplicate')}>
              Duplicate
            </MenuItem>
            <MenuItem onAction={() => console.log('share')}>Share…</MenuItem>
            <MenuItem onAction={() => console.log('delete')}>
              Delete…
            </MenuItem>
          </Menu>
        </Autocomplete>
      </Popover>
    </MenuTrigger>
  );
};

const MyMenu2 = () => {
  let {contains} = useFilter({sensitivity: 'base'});

  return (
    <MenuTrigger>
      <Button aria-label="Menu">☰</Button>
      <Popover>
        <Autocomplete filter={contains}>
          <TextField autoFocus>
            <Input />
          </TextField>
          <Menu>
            <MenuItem onAction={() => console.log('open')}>Open</MenuItem>
            <MenuItem onAction={() => console.log('rename')}>
              Rename…
            </MenuItem>
            <MenuItem onAction={() => console.log('duplicate')}>
              Duplicate
            </MenuItem>
            <MenuItem onAction={() => console.log('share')}>Share…</MenuItem>
            <MenuItem onAction={() => console.log('delete')}>
              Delete…
            </MenuItem>
          </Menu>
        </Autocomplete>
        <Button>First</Button>
        <Button>Second</Button>
      </Popover>
    </MenuTrigger>
  );
};

export function AutocompleteWithExtraButtons() {
  return (
    <div>
      <input />
      <div style={{display: 'flex', gap: '200px'}}>
        <MyMenu />
        <MyMenu2 />
      </div>
      <input />
    </div>
  );
}

export const AutocompleteMenuInPopoverDialogTrigger = {
  render: (args) => {
    let {onAction, onSelectionChange, selectionMode} = args;
    return (
      <DialogTrigger>
        <Button>
          Open popover
        </Button>
        <Popover
          placement="bottom start"
          style={{
            background: 'Canvas',
            color: 'CanvasText',
            border: '1px solid gray',
            padding: 20,
            height: 250
          }}>
          <AutocompleteWrapper>
            <div>
              <SearchField autoFocus>
                <Label style={{display: 'block'}}>Test</Label>
                <Input />
                <Text style={{display: 'block'}} slot="description">Please select an option below.</Text>
              </SearchField>
              <Menu className={styles.menu} items={dynamicAutocompleteSubdialog}  onAction={onAction} onSelectionChange={onSelectionChange} selectionMode={selectionMode}>
                {item => dynamicRenderFuncSections(item)}
              </Menu>
            </div>
          </AutocompleteWrapper>
        </Popover>
      </DialogTrigger>
    );
  },
  name: 'Autocomplete in popover (dialog trigger), rendering dynamic autocomplete menu',
  argTypes: {
    selectionMode: {
      table: {
        disable: true
      }
    }
  }
};

let manyItems = [...Array(100)].map((_, i) => ({id: i, name: `Item ${i}`}));

export const AutocompleteSelect = () => (
  <Select style={{marginBottom: 40}}>
    <Label style={{display: 'block'}}>Test</Label>
    <Button>
      <SelectValue />
      <span aria-hidden="true" style={{paddingLeft: 5}}>▼</span>
    </Button>
    <Popover style={{background: 'Canvas', border: '1px solid ButtonBorder', padding: 5, boxSizing: 'border-box', display: 'flex'}}>
      <Autocomplete filter={useFilter({sensitivity: 'base'}).contains}>
        <SearchField aria-label="Search" autoFocus style={{display: 'flex', flexDirection: 'column'}}>
          <Input />
        </SearchField>
        <ListBox items={manyItems} className={styles.menu} style={{flex: 1}}>
          {item => <MyListBoxItem>{item.name}</MyListBoxItem>}
        </ListBox>
      </Autocomplete>
    </Popover>
  </Select>
);
