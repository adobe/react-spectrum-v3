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

import {action} from '@storybook/addon-actions';
import {ActionButton, Button} from '@react-spectrum/button';
import Add from '@spectrum-icons/workflow/Add';
import Alert from '@spectrum-icons/workflow/Alert';
import Bell from '@spectrum-icons/workflow/Bell';
import {ButtonGroup} from '@react-spectrum/buttongroup';
import {chain} from '@react-aria/utils';
import {ComboBox, Item, Section} from '../';
import {ComponentMeta, ComponentStoryObj} from '@storybook/react';
import {Content} from '@react-spectrum/view';
import {ContextualHelp} from '@react-spectrum/contextualhelp';
import Copy from '@spectrum-icons/workflow/Copy';
import {Dialog, DialogTrigger} from '@react-spectrum/dialog';
import Draw from '@spectrum-icons/workflow/Draw';
import {Flex} from '@react-spectrum/layout';
import {Heading, Text} from '@react-spectrum/text';
import {Link} from '@react-spectrum/link';
import React, {useRef, useState} from 'react';
import {useAsyncList, useListData, useTreeData} from '@react-stately/data';
import {useFilter} from '@react-aria/i18n';

let items = [
  {name: 'Aardvark', id: '1'},
  {name: 'Kangaroo', id: '2'},
  {name: 'Snake', id: '3'}
];

let withSection = [
  {name: 'Animals', id: 's1', children: [
    {name: 'Aardvark', id: '1'},
    {name: 'Kangaroo', id: '2'},
    {name: 'Snake', id: '3'}
  ]},
  {name: 'People', id: 's2', children: [
    {name: 'Danni', id: '4'},
    {name: 'Devon', id: '5'},
    {name: 'Ross', id: '6'}
  ]}
];

let lotsOfSections: any[] = [];
for (let i = 0; i < 50; i++) {
  let children = [];
  for (let j = 0; j < 50; j++) {
    children.push({name: `Section ${i}, Item ${j}`});
  }

  lotsOfSections.push({name: 'Section ' + i, children});
}

export type ComboBoxStory = ComponentStoryObj<typeof ComboBox>;

export default {
  title: 'ComboBox',
  component: ComboBox,
  args: {
    label: 'Combobox',
    onOpenChange: action('onOpenChange'),
    onInputChange: action('onInputChange'),
    onSelectionChange: action('onSelectionChange'),
    onBlur: action('onBlur'),
    onFocus: action('onFocus')
  },
  argTypes: {
    defaultItems: {
      table: {
        disable: true
      }
    },
    contextualHelp: {
      table: {
        disable: true
      }
    },
    onOpenChange: {
      table: {
        disable: true
      }
    },
    disabledKeys: {
      table: {
        disable: true
      }
    },
    inputValue: {
      table: {
        disable: true
      }
    },
    defaultInputValue: {
      table: {
        disable: true
      }
    },
    defaultSelectedKey: {
      table: {
        disable: true
      }
    },
    selectedKey: {
      table: {
        disable: true
      }
    },
    onInputChange: {
      table: {
        disable: true
      }
    },
    onSelectionChange: {
      table: {
        disable: true
      }
    },
    onBlur: {
      table: {
        disable: true
      }
    },
    onFocus: {
      table: {
        disable: true
      }
    },
    label: {
      control: 'text'
    },
    'aria-label': {
      control: 'text'
    },
    isDisabled: {
      control: 'boolean'
    },
    isQuiet: {
      control: 'boolean'
    },
    isReadOnly: {
      control: 'boolean'
    },
    autoFocus: {
      control: 'boolean'
    },
    isRequired: {
      control: 'boolean'
    },
    necessityIndicator: {
      control: 'select',
      options: ['icon', 'label']
    },
    labelAlign: {
      control: 'select',
      options: ['end', 'start']
    },
    labelPosition: {
      control: 'select',
      options: ['top', 'side']
    },
    validationState: {
      control: 'select',
      options: [null, 'valid', 'invalid']
    },
    description: {
      control: 'text'
    },
    errorMessage: {
      control: 'text'
    },
    menuTrigger: {
      control: 'select',
      options: ['focus', 'manual']
    },
    direction: {
      control: 'select',
      options: ['top', 'bottom']
    },
    allowsCustomValue: {
      control: 'boolean'
    },
    width: {
      control: 'text'
    }
  }
} as ComponentMeta<typeof ComboBox>;

export const Default: ComboBoxStory = {
  render: (args) => render(args),
  name: 'static items'
};

export const Dynamic: ComboBoxStory = {
  args: {defaultItems: items},
  render: (args) => (
    <ComboBox {...args}>
      {(item: any) => <Item>{item.name}</Item>}
    </ComboBox>
  ),
  name: 'dynamic items'
};

export const NoItems: ComboBoxStory = {
  ...Dynamic,
  args: {defaultItems: []},
  name: 'no items'
};

export const MappedItems: ComboBoxStory = {
  args: {defaultSelectedKey: '2'},
  render: (args) => <ComboBoxWithMap {...args} />,
  name: 'with mapped items (defaultItem and items undef)'
};

export const Sections: ComboBoxStory = {
  args: {defaultItems: withSection},
  render: (args) => (
    <ComboBox {...args}>
      {(item: any) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item: any) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ComboBox>
  ),
  name: 'with sections'
};

export const ManySections: ComboBoxStory = {
  ...Sections,
  args: {defaultItems: lotsOfSections},
  name: 'with many sections'
};

export const ComplexItems: ComboBoxStory = {
  args: {label: 'Select action'},
  render: (args) => (
    <ComboBox {...args}>
      <Item textValue="Add to queue">
        <Add />
        <Text>Add to queue</Text>
        <Text slot="description">Add to current watch queue.</Text>
      </Item>
      <Item textValue="Add review">
        <Draw />
        <Text>Add review</Text>
        <Text slot="description">Post a review for the episode.</Text>
      </Item>
      <Item textValue="Subscribe to series">
        <Bell />
        <Text>Subscribe to series</Text>
        <Text slot="description">
          Add series to your subscription list and be notified when a new episode
          airs.
        </Text>
      </Item>
      <Item textValue="Report">
        <Alert />
        <Text>Report</Text>
        <Text slot="description">Report an issue/violation.</Text>
      </Item>
    </ComboBox>
  )
};

export const UserProvidedLabel: ComboBoxStory = {
  args: {label: 'Select action'},
  render: (args) => (
    <Flex direction="column" width="size-3000">
      <label id="test-label" htmlFor="test-id">Combobox</label>
      <ComboBox  {...args} id="test-id" aria-labelledby="test-label">
        <Item key="one">Item One</Item>
        <Item key="two" textValue="Item Two">
          <Copy size="S" />
          <Text>Item Two</Text>
        </Item>
        <Item key="three">Item Three</Item>
      </ComboBox>
    </Flex>
  )
};

export const DisabledKeys: ComboBoxStory = {
  args: {defaultItems: withSection, label: 'Combobox', disabledKeys: ['Snake', 'Ross']},
  render: (args) => (
    <ComboBox {...args}>
      {(item: any) => (
        <Section key={item.name} items={item.children} title={item.name}>
          {(item: any) => <Item key={item.name}>{item.name}</Item>}
        </Section>
      )}
    </ComboBox>
  )
};

export const ContextualHelpStory: ComboBoxStory = {
  ...Default,
  args: {
    ...Default.args,
    contextualHelp: (
      <ContextualHelp>
        <Heading>What is a segment?</Heading>
        <Content>Segments identify who your visitors are, what devices and services they use, where they navigated from, and much more.</Content>
      </ContextualHelp>
    )
  },
  name: 'contextual help'
};

export const Resize: ComboBoxStory = {
  render: (args) => <ResizeCombobox {...args} />
};

export const SmallDiv: ComboBoxStory = {
  render: (args) => (
    <Flex width="size-500">
      {render(args)}
    </Flex>
  ),
  name: 'in small div'
};

export const ControlledInputValueStory: ComboBoxStory = {
  args: {inputValue: 'Snake', disabledKeys: ['2', '6']},
  render: (args) => <ControlledValueComboBox {...args} />,
  name: 'inputValue (controlled)'
};

export const DefaultInputValue: ComboBoxStory = {
  ...Default,
  args: {defaultInputValue: 'Item Three', disabledKeys: ['two']},
  name: 'defaultInputValue (uncontrolled)'
};

export const ControlledSelectedKey: ComboBoxStory = {
  args: {selectedKey: '4', disabledKeys: ['2', '6']},
  render: (args) => <ControlledKeyComboBox {...args} />,
  name: 'selectedKey (controlled)'
};

export const DefaultSelectedKey: ComboBoxStory = {
  ...Default,
  args: {defaultSelectedKey: 'two', disabledKeys: ['one']},
  name: 'defaultSelectedKey (uncontrolled)'
};

export const AllControlled: ComboBoxStory = {
  args: {selectedKey: '2', inputValue: 'Kangaroo', disabledKeys: ['2', '6']},
  render: (args) => <AllControlledComboBox {...args} />,
  name: 'inputValue and selectedKey (controlled)'
};

export const DefaultInputAndKey: ComboBoxStory = {
  ...Default,
  args: {defaultInputValue: 'Item Two', defaultSelectedKey: 'two', disabledKeys: ['two']},
  name: 'defaultInputValue and defaultSelectedKey (uncontrolled)'
};

export const ControlledInputDefaultKey: ComboBoxStory = {
  ...ControlledInputValueStory,
  args: {inputValue: 'K', defaultSelectedKey: 'two', disabledKeys: ['2', '6']},
  name: 'inputValue and defaultSelectedKey (controlled by inputvalue)'
};

export const ControlledInputValue: ComboBoxStory = {
  ...ControlledSelectedKey,
  args: {defaultInputValue: 'Blah', selectedKey: '2', disabledKeys: ['2', '6']},
  name: 'defaultInputValue and selectedKey (controlled by selectedKey)'
};

export const CustomFilter: ComboBoxStory = {
  render: (args) => <CustomFilterComboBox {...args} />
};

export const LoadingState: ComboBoxStory = {
  render: (args) => <LoadingExamples {...args} />
};

export const FilteringListData: ComboBoxStory = {
  render: (args) => <ListDataExample {...args} />,
  name: 'filtering with useListData'
};

export const SeverSideFiltering: ComboBoxStory = {
  render: (args) => <AsyncLoadingExample {...args} />,
  name: 'server side filtering with useAsyncList'
};

export const SeverSideFilteringControlled: ComboBoxStory = {
  render: (args) => <AsyncLoadingExampleControlledKey {...args} />,
  name: 'server side filtering with useAsyncList (controlled key)'
};

export const SeverSideFilteringControlledReset: ComboBoxStory = {
  render: (args) => <AsyncLoadingExampleControlledKeyWithReset {...args} />,
  name: 'server side filtering with controlled key and inputValue reset if not focused'
};

export const InDialog: ComboBoxStory = {
  render: (args) => <ComboBoxWithinDialog {...args} />,
  name: 'within a dialog'
};

export const WHCM: ComboBoxStory = {
  render: () => (
    <Flex direction="column" gap="size-200">
      <Flex gap="size-200">Shows the different states from <Link><a href="https://spectrum.adobe.com/static/Windows-High-Contrast-Kits/Combobox-WindowsHighContrast.xd">spectrum</a></Link></Flex>
      {renderRow({placeholder: 'Type here...'})}
      {renderRow()}
      {renderRow({labelPosition: 'side'})}
      {renderRow({isQuiet: true, placeholder: 'Type here...'})}
      {renderRow({isQuiet: true})}
      {renderRow({isRequired: true})}
      {renderRow({isRequired: true, isQuiet: true})}
      {renderRow({validationState: 'invalid'})}
      {renderRow({validationState: 'invalid', isQuiet: true})}
    </Flex>
  )
};

export const FixedPositioning: ComboBoxStory = {
  render: () => (
    <>
      <div
        style={{
          position: 'fixed',
          top: 'calc(50vh - var(--spectrum-global-dimension-size-400) - 1.3 * var(--spectrum-global-dimension-size-150)'
        }}>
        <AsyncLoadingExample />
      </div>
      <div
        style={{
          position: 'relative',
          height: '200vh'
        }}>
        <div
          style={{
            position: 'absolute',
            top: '0'
          }}>
          Top
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '0'
          }}>
          Bottom
        </div>
      </div>
    </>
  ),
  name: 'Fixed positioning'
};

function LoadingExamples(props) {
  return (
    <Flex gap="size-300" direction="column" >
      <ComboBox {...props} label="Combobox (loading)" loadingState="loading" defaultItems={items} >
        {(item: any) => <Item>{item.name}</Item>}
      </ComboBox>
      <ComboBox {...props} label="Combobox (filtering)" loadingState="filtering" defaultItems={items}>
        {(item: any) => <Item>{item.name}</Item>}
      </ComboBox>
      <ComboBox {...props} label="Combobox (loading + menuTrigger manual)" loadingState="loading" menuTrigger="manual" defaultItems={items} >
        {(item: any) => <Item>{item.name}</Item>}
      </ComboBox>
      <ComboBox {...props} label="Combobox (loading more)" loadingState="loadingMore" defaultItems={items}>
        {(item: any) => <Item>{item.name}</Item>}
      </ComboBox>
    </Flex>
  );
}

function ListDataExample(props) {
  let {contains} = useFilter({sensitivity: 'base'});
  let list = useListData({
    initialItems: items,
    initialFilterText: 'Snake',
    filter(item, text) {
      return contains(item.name, text);
    }
  });

  let [showAll, setShowAll] = useState(false);

  return (
    <Flex gap="size-300" direction="column" >
      <ComboBox
        {...props}
        onOpenChange={(open, reason) => {
          if (reason === 'manual' && open) {
            setShowAll(true);
          }
        }}
        label="ComboBox (show all on open)"
        items={showAll ? items : list.items}
        inputValue={list.filterText}
        onInputChange={(value) => {
          setShowAll(false);
          list.setFilterText(value);
        }}>
        {(item: any) => <Item>{item.name}</Item>}
      </ComboBox>
      <ComboBox
        {...props}
        label="ComboBox (default controlled items behavior)"
        items={list.items}
        inputValue={list.filterText}
        onInputChange={list.setFilterText}>
        {(item: any) => <Item>{item.name}</Item>}
      </ComboBox>
    </Flex>
  );
}

function AsyncLoadingExample(props) {
  interface StarWarsChar {
    name: string,
    url: string
  }

  let list = useAsyncList<StarWarsChar>({
    async load({signal, cursor, filterText}) {
      if (cursor) {
        cursor = cursor.replace(/^http:\/\//i, 'https://');
      }

      // Slow down load so progress circle can appear
      await new Promise(resolve => setTimeout(resolve, 1500));
      let res = await fetch(cursor || `https://swapi.py4e.com/api/people/?search=${filterText}`, {signal});
      let json = await res.json();

      return {
        items: json.results,
        cursor: json.next
      };
    }
  });

  return (
    <ComboBox
      label="Star Wars Character Lookup"
      {...props}
      items={list.items}
      inputValue={list.filterText}
      onInputChange={list.setFilterText}
      loadingState={list.loadingState}
      onLoadMore={chain(props?.onLoadMore, list.loadMore)}>
      {(item: any) => <Item key={item.name}>{item.name}</Item>}
    </ComboBox>
  );
}

function AsyncLoadingExampleControlledKey(props) {
  interface StarWarsChar {
    name: string,
    url: string
  }

  let list = useAsyncList<StarWarsChar>({
    async load({signal, cursor, filterText}) {
      if (cursor) {
        cursor = cursor.replace(/^http:\/\//i, 'https://');
      }

      // Slow down load so progress circle can appear
      await new Promise(resolve => setTimeout(resolve, 1500));

      let res = await fetch(cursor || `https://swapi.py4e.com/api/people/?search=${filterText}`, {signal});
      let json = await res.json();

      return {
        items: json.results,
        cursor: json.next
      };
    },
    initialSelectedKeys: ['Luke Skywalker'],
    getKey: (item) => item.name
  });

  let onSelectionChange = (key) => {
    let itemText = list.getItem(key)?.name;
    list.setSelectedKeys(new Set([key]));
    list.setFilterText(itemText);
  };

  let onInputChange = (value) => {
    if (value === '') {
      list.setSelectedKeys(new Set([null]));
    }
    list.setFilterText(value);
  };

  let selectedKey = (list.selectedKeys as Set<React.Key>).values().next().value;
  return (
    <ComboBox
      label="Star Wars Character Lookup"
      {...props}
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange}
      items={list.items}
      inputValue={list.filterText}
      onInputChange={onInputChange}
      loadingState={list.loadingState}
      onLoadMore={list.loadMore}>
      {(item: any) => <Item key={item.name}>{item.name}</Item>}
    </ComboBox>
  );
}

function AsyncLoadingExampleControlledKeyWithReset(props) {
  interface StarWarsChar {
    name: string,
    url: string
  }
  let isFocused = useRef(false);
  let list = useAsyncList<StarWarsChar>({
    async load({signal, cursor, filterText, selectedKeys}) {
      if (cursor) {
        cursor = cursor.replace(/^http:\/\//i, 'https://');
      }

      // Slow down load so progress circle can appear
      await new Promise(resolve => setTimeout(resolve, 1500));

      let res = await fetch(cursor || `https://swapi.py4e.com/api/people/?search=${filterText}`, {signal});
      let json = await res.json();

      let selectedText;
      let selectedKey = (selectedKeys as Set<React.Key>).values().next().value;

      // If selectedKey exists and combobox is performing intial load, update the input value with the selected key text
      if (!isFocused.current && selectedKey) {
        let selectedItemName = json.results.find(item => item.name === selectedKey)?.name;
        if (selectedItemName != null && selectedItemName !== filterText) {
          selectedText = selectedItemName;
        }
      }
      return {
        items: json.results,
        cursor: json.next,
        filterText: selectedText ?? filterText
      };
    },
    initialSelectedKeys: ['Luke Skywalker'],
    getKey: (item) => item.name
  });

  let onSelectionChange = (key) => {
    let itemText = list.getItem(key)?.name;
    list.setSelectedKeys(new Set([key]));
    list.setFilterText(itemText);
  };

  let onInputChange = (value) => {
    if (value === '') {
      list.setSelectedKeys(new Set([null]));
    }
    list.setFilterText(value);
  };

  let selectedKey = (list.selectedKeys as Set<React.Key>).values().next().value;
  return (
    <ComboBox
      label="Star Wars Character Lookup"
      {...props}
      onFocusChange={(focus) => isFocused.current = focus}
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange}
      items={list.items}
      inputValue={list.filterText}
      onInputChange={onInputChange}
      loadingState={list.loadingState}
      onLoadMore={list.loadMore}>
      {(item: any) => <Item key={item.name}>{item.name}</Item>}
    </ComboBox>
  );
}

let customFilterItems = [
  {name: 'The first item', id: '1'},
  {name: 'The second item', id: '2'},
  {name: 'The third item', id: '3'}
];

let CustomFilterComboBox = (props) => {
  let {startsWith} = useFilter({sensitivity: 'base'});
  let [filterValue, setFilterValue] = React.useState('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  let filteredItems = React.useMemo(() => customFilterItems.filter(item => startsWith(item.name, filterValue)), [props.items, filterValue, startsWith]);

  return (
    <ComboBox
      label="Combobox"
      {...props}
      items={filteredItems}
      inputValue={filterValue}
      onInputChange={setFilterValue}>
      {(item: any) => <Item>{item.name}</Item>}
    </ComboBox>
  );
};

function AllControlledComboBox(props) {
  let [fieldState, setFieldState] = React.useState({
    selectedKey: props.selectedKey,
    inputValue: props.inputValue
  });

  let list = useTreeData({
    initialItems: withSection
  });

  let onSelectionChange = (key: React.Key) => {
    setFieldState(prevState => ({
      inputValue: list.getItem(key)?.value.name ?? (props.allowsCustomValue ? prevState.inputValue : ''),
      selectedKey: key
    }));
  };

  let onInputChange = (value: string) => {
    setFieldState(prevState => ({
      inputValue: value,
      selectedKey: value === '' ? null : prevState.selectedKey
    }));
  };

  let setSnake = () => {
    setFieldState({inputValue: 'Snake', selectedKey: '3'});
  };

  let setRoss = () => {
    setFieldState({inputValue: 'Ross', selectedKey: '6'});
  };

  let clearAll = () => {
    setFieldState({inputValue: '', selectedKey: null});
  };

  return (
    <div>
      <div>Current selectedKey: {fieldState.selectedKey}</div>
      <div>Current input value: {fieldState.inputValue}</div>
      <ButtonGroup marginEnd="30px">
        <Button variant="secondary" onPress={setSnake}>
          <Text>Snake</Text>
        </Button>
        <Button variant="secondary" onPress={setRoss}>
          <Text>Ross</Text>
        </Button>
        <Button variant="secondary" onPress={clearAll}>
          <Text>Clear key</Text>
        </Button>
      </ButtonGroup>
      <ComboBox label="Combobox" {...props} selectedKey={fieldState.selectedKey} inputValue={fieldState.inputValue} defaultItems={list.items} onInputChange={onInputChange} onSelectionChange={onSelectionChange}>
        {(item: any) => (
          <Section items={item.children} title={item.value.name}>
            {(item: any) => <Item>{item.value.name}</Item>}
          </Section>
        )}
      </ComboBox>
    </div>
  );
}

let ControlledKeyComboBox = (props) => {
  let [selectedKey, setSelectedKey] = React.useState(props.selectedKey);

  let onSelectionChange = (key) => {
    setSelectedKey(key);
  };

  let setSnake = () => {
    setSelectedKey('3');
  };

  let setRoss = () => {
    setSelectedKey('6');
  };

  return (
    <div>
      <div>Current selectedKey: {selectedKey}</div>
      <ButtonGroup marginEnd="30px">
        <Button variant="secondary" onPress={setSnake}>
          <Text>Snake</Text>
        </Button>
        <Button variant="secondary" onPress={setRoss}>
          <Text>Ross</Text>
        </Button>
        <Button variant="secondary" onPress={() => setSelectedKey(null)}>
          <Text>Clear key</Text>
        </Button>
      </ButtonGroup>
      <ComboBox label="Combobox" {...props} selectedKey={selectedKey} defaultItems={withSection} onSelectionChange={onSelectionChange}>
        {(item: any) => (
          <Section items={item.children} title={item.name}>
            {(item: any) => <Item>{item.name}</Item>}
          </Section>
        )}
      </ComboBox>
    </div>
  );
};

let ControlledValueComboBox = (props) => {
  let [value, setValue] = React.useState(props.inputValue);

  let onValueChange = (value) => {
    setValue(value);
  };

  return (
    <div>
      <div>Current input value: {value}</div>
      <ButtonGroup marginEnd="30px" UNSAFE_style={{verticalAlign: 'bottom'}}>
        <Button variant="secondary" onPress={() => setValue('Blah')}>
          <Text>Blah</Text>
        </Button>
        <Button variant="secondary" onPress={() => setValue('Kangaroo')}>
          <Text>Kangaroo</Text>
        </Button>
        <Button variant="secondary" onPress={() => setValue('')}>
          <Text>Clear field</Text>
        </Button>
      </ButtonGroup>
      <ComboBox label="Combobox" {...props} inputValue={value} defaultItems={withSection} onInputChange={onValueChange}>
        {(item: any) => (
          <Section items={item.children} title={item.name}>
            {(item: any) => <Item>{item.name}</Item>}
          </Section>
        )}
      </ComboBox>
    </div>
  );
};

function ResizeCombobox(props) {
  let [size, setSize] = useState(true);

  return (
    <Flex direction="column" gap="size-200" alignItems="start">
      <div style={{width: size ? '200px' : '300px'}}>
        <ComboBox label="Combobox" {...props} width="100%">
          <Item key="one">Item One</Item>
          <Item key="two" textValue="Item Two">
            <Copy size="S" />
            <Text>Item Two</Text>
          </Item>
          <Item key="three">Item Three</Item>
        </ComboBox>
      </div>
      <ActionButton onPress={() => setSize(prev => !prev)}>Toggle size</ActionButton>
    </Flex>
  );
}

function render(props = {}) {
  return (
    <ComboBox label="Combobox" {...props}>
      <Item key="one">Item One</Item>
      <Item key="two" textValue="Item Two">
        <Copy size="S" />
        <Text>Item Two</Text>
      </Item>
      <Item key="three">Item Three</Item>
    </ComboBox>
  );
}

function renderRow(props = {}) {
  return (
    <Flex gap="size-200">
      <ComboBox label="Label" {...props}>
        <Item key="one">Option 1</Item>
        <Item key="two" textValue="Item Two">
          <Copy size="S" />
          <Text>Option 2</Text>
        </Item>
        <Item key="three">Option 3</Item>
      </ComboBox>
      <ComboBox isDisabled label="Label" {...props}>
        <Item key="one">Option 1</Item>
        <Item key="two" textValue="Item Two">
          <Copy size="S" />
          <Text>Option 2</Text>
        </Item>
        <Item key="three">Option 3</Item>
      </ComboBox>
    </Flex>
  );
}

function ComboBoxWithMap(props) {
  let [items, setItems] = React.useState([
    {name: 'The first item', id: 'one'},
    {name: 'The second item', id: 'two'},
    {name: 'The third item', id: 'three'}
  ]);

  let onClick = () => {
    setItems([
      {name: 'The first item new text', id: 'one'},
      {name: 'The second item new text', id: 'two'},
      {name: 'The third item new text', id: 'three'}
    ]);
  };

  return (
    <Flex direction="column">
      <button onClick={onClick}>Press to change items</button>
      <ComboBox label="Combobox" {...props}>
        {items.map((item) => (
          <Item key={item.id}>
            {item.name}
          </Item>
        ))}
      </ComboBox>
    </Flex>
  );
}

function ComboBoxWithinDialog(props) {
  let {allowsCustomValue} = props;
  let items = [
    {name: 'Animals', id: 's1', children: [
      {name: 'Aardvark', id: '1'},
      {name: 'Kangaroo', id: '2'},
      {name: 'Snake', id: '3'}
    ]},
    {name: 'People', id: 's2', children: [
      {name: 'Danni', id: '4'},
      {name: 'Devon', id: '5'},
      {name: 'Ross', id: '6'}
    ]}
  ];
  let [selectedKey, setSelectedKey] = useState(null);
  return (
    <DialogTrigger>
      <ActionButton>Show ComboBox</ActionButton>
      {(close) => (
        <Dialog>
          <Content>
            <ComboBox
              label="Combo Box"
              {...props}
              defaultItems={items}
              placeholder="choose wisely"
              width="size-3000"
              allowsCustomValue={allowsCustomValue}
              selectedKey={selectedKey}
              onSelectionChange={setSelectedKey}
              onKeyDown={
                e => {
                  if (
                    e.key === 'Escape' &&
                    (
                      selectedKey !== null ||
                      (e.target as HTMLInputElement).value === '' ||
                      allowsCustomValue
                    )
                  ) {
                    e.continuePropagation();
                  }
                }
              }>
              {(item: any) => (
                <Section key={item.name} items={item.children} title={item.name}>
                  {(item: any) => <Item key={item.name}>{item.name}</Item>}
                </Section>
              )}
            </ComboBox>
          </Content>
          <ButtonGroup>
            <Button onPress={close} variant="secondary">
              Cancel
            </Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogTrigger>
  );
}
