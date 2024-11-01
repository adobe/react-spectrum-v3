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
import {Breadcrumbs, Item} from '@react-spectrum/breadcrumbs';
import {ButtonGroup} from '@react-spectrum/buttongroup';
import {Cell, Column, Row, SpectrumTableProps, TableBody, TableHeader, TableView} from '../';
import {ComponentMeta, ComponentStoryObj} from '@storybook/react';
import {Content, View} from '@react-spectrum/view';
import {ControllingResize, PokemonColumn} from './ControllingResize';
import {CRUDExample} from './CRUDExample';
import Delete from '@spectrum-icons/workflow/Delete';
import {Dialog, DialogTrigger} from '@react-spectrum/dialog';
import {Divider} from '@react-spectrum/divider';
import {Flex} from '@react-spectrum/layout';
import {Heading} from '@react-spectrum/text';
import {HidingColumns} from './HidingColumns';
import {HidingColumnsAllowsResizing} from './HidingColumnsAllowsResizing';
import {IllustratedMessage} from '@react-spectrum/illustratedmessage';
import {Key, LoadingState} from '@react-types/shared';
import {Link} from '@react-spectrum/link';
import NoSearchResults from '@spectrum-icons/illustrations/NoSearchResults';
import {Picker} from '@react-spectrum/picker';
import {Radio, RadioGroup} from '@react-spectrum/radio';
import React, {useCallback, useState} from 'react';
import {SearchField} from '@react-spectrum/searchfield';
import {Switch} from '@react-spectrum/switch';
import {TextField} from '@react-spectrum/textfield';
import {useAsyncList, useListData} from '@react-stately/data';
import {useFilter} from '@react-aria/i18n';

export default {
  title: 'TableView',
  excludeStories: ['columns', 'renderEmptyState', 'EmptyStateTable'],
  component: TableView,
  args: {
    onAction: action('onAction'),
    onResizeStart: action('onResizeStart'),
    onResize: action('onResize'),
    onResizeEnd: action('onResizeEnd'),
    onSelectionChange: action('onSelectionChange'),
    onSortChange: action('onSortChange')
  },
  argTypes: {
    // intentionally added so that we can unset the default value
    // there is no argType for function
    // use the controls reset button to undo it
    // https://storybook.js.org/docs/react/essentials/controls#annotation
    onAction: {
      control: 'select',
      options: [undefined]
    },
    onResizeStart: {
      table: {
        disable: true
      }
    },
    onResize: {
      table: {
        disable: true
      }
    },
    onResizeEnd: {
      table: {
        disable: true
      }
    },
    onSelectionChange: {
      table: {
        disable: true
      }
    },
    onSortChange: {
      table: {
        disable: true
      }
    },
    disabledKeys: {
      table: {
        disable: true
      }
    },
    selectedKeys: {
      table: {
        disable: true
      }
    },
    density: {
      control: 'select',
      options: ['compact', 'regular', 'spacious']
    },
    overflowMode: {
      control: 'select',
      options: ['wrap', 'truncate']
    },
    isQuiet: {
      control: 'boolean'
    },
    selectionMode: {
      control: 'select',
      options: ['none', 'single', 'multiple']
    },
    selectionStyle: {
      control: 'select',
      options: ['checkbox', 'highlight']
    },
    disallowEmptySelection: {
      control: 'boolean'
    },
    disabledBehavior: {
      control: 'select',
      options: ['all', 'selection']
    }
  }
} as ComponentMeta<typeof TableView>;

export type TableStory = ComponentStoryObj<typeof TableView>;


// Known accessibility issue that will be caught by aXe: https://github.com/adobe/react-spectrum/wiki/Known-accessibility-false-positives#tableview
export const Static: TableStory = {
  args: {
    'aria-label': 'TableView with static contents',
    width: 300,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column key="foo">Foo</Column>
        <Column key="bar">Bar</Column>
        <Column key="baz">Baz</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>One</Cell>
          <Cell>Two</Cell>
          <Cell>Three</Cell>
        </Row>
        <Row>
          <Cell>One</Cell>
          <Cell>Two</Cell>
          <Cell>Three</Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'static'
};

export let columns = [
  {name: 'Foo', key: 'foo'},
  {name: 'Bar', key: 'bar'},
  {name: 'Baz', key: 'baz'}
];

let items = [
  {test: 'Test 1', foo: 'Foo 1', bar: 'Bar 1', yay: 'Yay 1', baz: 'Baz 1'},
  {test: 'Test 2', foo: 'Foo 2', bar: 'Bar 2', yay: 'Yay 2', baz: 'Baz 2'},
  {test: 'Test 1', foo: 'Foo 3', bar: 'Bar 1', yay: 'Yay 1', baz: 'Baz 1'},
  {test: 'Test 2', foo: 'Foo 4', bar: 'Bar 2', yay: 'Yay 2', baz: 'Baz 2'},
  {test: 'Test 1', foo: 'Foo 5', bar: 'Bar 1', yay: 'Yay 1', baz: 'Baz 1'},
  {test: 'Test 2', foo: 'Foo 6', bar: 'Bar 2', yay: 'Yay 2', baz: 'Baz 2'},
  {test: 'Test 1', foo: 'Foo 7', bar: 'Bar 1', yay: 'Yay 1', baz: 'Baz 1'},
  {test: 'Test 2', foo: 'Foo 8', bar: 'Bar 2', yay: 'Yay 2', baz: 'Baz 2'}
];

export const Dynamic: TableStory = {
  args: {
    'aria-label': 'TableView with static contents',
    width: 300,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader columns={columns}>
        {column => <Column>{column.name}</Column>}
      </TableHeader>
      <TableBody items={items}>
        {item =>
          (<Row key={item.foo}>
            {key => <Cell>{item[key]}</Cell>}
          </Row>)
        }
      </TableBody>
    </TableView>
  ),
  name: 'dynamic'
};

let itemsWithFalsyId = [
  {test: 'Test 1', foo: 'Foo 1', bar: 'Bar 1', yay: 'Yay 1', baz: 'Baz 1', id: 0},
  {test: 'Test 1', foo: 'Foo 2', bar: 'Bar 1', yay: 'Yay 1', baz: 'Baz 1', id: 1}
];

export const DynamicFalsyRowKeys: TableStory = {
  args: {
    'aria-label': 'TableView with dynamic contents',
    width: 300,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader columns={columns}>
        {column => <Column>{column.name}</Column>}
      </TableHeader>
      <TableBody items={itemsWithFalsyId}>
        {item =>
          (<Row>
            {key => <Cell>{item[key]}</Cell>}
          </Row>)
        }
      </TableBody>
    </TableView>
  ),
  name: 'dynamic, falsy row keys'
};

export const HorizontalScrollingOnly: TableStory = {
  args: {
    'aria-label': 'TableView with dynamic contents',
    width: 200,
    height: 220
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader columns={columns}>
        {column => <Column>{column.name}</Column>}
      </TableHeader>
      <TableBody items={items.slice(0, 3)}>
        {item =>
          (<Row key={item.foo}>
            {key => <Cell>{item[key]}</Cell>}
          </Row>)
        }
      </TableBody>
    </TableView>
  ),
  name: 'horizontal scrolling only'
};

export const HorizontalScrollingOnlyFlushBottom: TableStory = {
  args: {
    'aria-label': 'TableView with dynamic contents',
    width: 200,
    height: 174
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader columns={columns}>
        {column => <Column>{column.name}</Column>}
      </TableHeader>
      <TableBody items={items.slice(0, 3)}>
        {item =>
          (<Row key={item.foo}>
            {key => <Cell>{item[key]}</Cell>}
          </Row>)
        }
      </TableBody>
    </TableView>
  ),
  name: 'horizontal scrolling only flush bottom'
};

export const DynamicWithDisabledKeys: TableStory = {
  ...Dynamic,
  args: {
    ...Dynamic.args,
    disabledKeys: new Set(['Foo 1', 'Foo 3'])
  },
  name: 'dynamic with disabled keys'
};

export const DynamicShowDividers: TableStory = {
  args: {
    'aria-label': 'TableView with static contents',
    width: 300,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader columns={columns}>
        {column => <Column showDivider>{column.name}</Column>}
      </TableHeader>
      <TableBody items={items}>
        {item =>
          (<Row key={item.foo}>
            {key => <Cell>{item[key]}</Cell>}
          </Row>)
        }
      </TableBody>
    </TableView>
  ),
  name: 'dynamic showDividers'
};

export const DynamicSelectedKeys: TableStory = {
  ...Dynamic,
  args: {
    ...Dynamic.args,
    selectedKeys: new Set(['Foo 1', 'Foo 3']),
    selectionMode: 'multiple'
  },
  name: 'selectedKeys',
  parameters: {
    controls: {
      exclude: /selectionMode/
    }
  }
};

export const StaticNestedColumns: TableStory = {
  args: {
    'aria-label': 'TableView with nested columns',
    width: 500,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column key="test">Test</Column>
        <Column title="Blah">
          <Column title="Group 1">
            <Column key="foo">Foo</Column>
            <Column key="bar">Bar</Column>
          </Column>
          <Column title="Group 2">
            <Column key="baz">Baz</Column>
          </Column>
        </Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>Test1</Cell>
          <Cell>One</Cell>
          <Cell>Two</Cell>
          <Cell>Three</Cell>
        </Row>
        <Row>
          <Cell>Test2</Cell>
          <Cell>One</Cell>
          <Cell>Two</Cell>
          <Cell>Three</Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'static with nested columns'
};

let nestedColumns = [
  {name: 'Test', key: 'test'},
  {name: 'Tiered One Header', key: 'tier1', children: [
    {name: 'Tier Two Header A', key: 'tier2a', children: [
      {name: 'Foo', key: 'foo'},
      {name: 'Bar', key: 'bar'}
    ]},
    {name: 'Yay', key: 'yay'},
    {name: 'Tier Two Header B', key: 'tier2b', children: [
      {name: 'Baz', key: 'baz'}
    ]}
  ]}
];

export const DynamicNestedColumns: TableStory = {
  args: {
    'aria-label': 'TableView with nested columns',
    width: 700,
    height: 300
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader columns={nestedColumns}>
        {column =>
          <Column childColumns={column.children} textValue={column.name}>{column.name}</Column>
        }
      </TableHeader>
      <TableBody items={items}>
        {item =>
          (<Row key={item.foo}>
            {key => <Cell>{item[key]}</Cell>}
          </Row>)
        }
      </TableBody>
    </TableView>
  ),
  name: 'dynamic with nested columns'
};

export const DynamicNestedColumnsWithResizing: TableStory = {
  args: {
    'aria-label': 'TableView with nested columns',
    width: 700,
    height: 300
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader columns={nestedColumns}>
        {column =>
          <Column allowsResizing childColumns={column.children}>{column.name}</Column>
        }
      </TableHeader>
      <TableBody items={items}>
        {item =>
          (<Row key={item.foo}>
            {key => <Cell>{item[key]}</Cell>}
          </Row>)
        }
      </TableBody>
    </TableView>
  ),
  name: 'dynamic with nested columns with resizing'
};

export const FocusableCells: TableStory = {
  args: {
    'aria-label': 'TableView with focusable cells',
    width: 450,
    height: 200
  },
  render: (args) => (
    <Flex direction="column">
      <label htmlFor="focus-before">Focus before</label>
      <input id="focus-before" />
      <TableView {...args}>
        <TableHeader>
          <Column key="foo">Foo</Column>
          <Column key="bar">Bar</Column>
          <Column key="baz">baz</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell><Switch aria-label="Foo" /></Cell>
            <Cell><Link><a href="https://yahoo.com" target="_blank">Yahoo</a></Link></Cell>
            <Cell>Three</Cell>
          </Row>
          <Row>
            <Cell><Switch aria-label="Foo" /><Switch aria-label="Bar" /></Cell>
            <Cell><Link><a href="https://google.com" target="_blank">Google</a></Link></Cell>
            <Cell>Three</Cell>
          </Row>
          <Row>
            <Cell><Switch aria-label="Foo" /></Cell>
            <Cell><Link><a href="https://yahoo.com" target="_blank">Yahoo</a></Link></Cell>
            <Cell>Three</Cell>
          </Row>
          <Row>
            <Cell><Switch aria-label="Foo" /></Cell>
            <Cell>
              <Picker aria-label="Search engine" placeholder="Search with:" width={'100%'} isQuiet>
                <Item key="Yahoo">Yahoo</Item>
                <Item key="Google">Google</Item>
                <Item key="DuckDuckGo">DuckDuckGo</Item>
              </Picker>
            </Cell>
            <Cell>Three</Cell>
          </Row>
        </TableBody>
      </TableView>
      <label htmlFor="focus-after">Focus after</label>
      <input id="focus-after" />
    </Flex>
  ),
  name: 'focusable cells'
};

interface ItemValue {
  name: string,
  key: string
}

let manyColunns: Array<ItemValue> = [];
for (let i = 0; i < 100; i++) {
  manyColunns.push({name: 'Column ' + i, key: 'C' + i});
}

interface RowValue {
  key: string,
  [key: string]: string
}

let manyRows: Array<RowValue> = [];
for (let i = 0; i < 1000; i++) {
  let row = {key: 'R' + i};
  for (let j = 0; j < 100; j++) {
    row['C' + j] = `${i}, ${j}`;
  }

  manyRows.push(row);
}

export const ManyColumnsAndRows: TableStory = {
  args: {
    'aria-label': 'TableView with many columns and rows',
    width: 700,
    height: 500
  },
  render: (args) => (
    <>
      <label htmlFor="focus-before">Focus before</label>
      <input id="focus-before" />
      <TableView {...args}>
        <TableHeader columns={manyColunns}>
          {column =>
            <Column minWidth={100}>{column.name}</Column>
          }
        </TableHeader>
        <TableBody items={manyRows}>
          {item =>
            (<Row key={item.foo}>
              {key => <Cell>{item[key]}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
      <label htmlFor="focus-after">Focus after</label>
      <input id="focus-after" />
    </>
  ),
  name: 'many columns and rows'
};

const TableViewFilledCellWidths = (props: SpectrumTableProps<unknown> & {allowsResizing: boolean}) => {
  let {allowsResizing, ...otherProps} = props;
  return (
    <TableView {...otherProps}>
      <TableHeader>
        <Column allowsResizing={allowsResizing}>File Name</Column>
        <Column allowsResizing={allowsResizing} align="center">Type</Column>
        <Column allowsResizing={allowsResizing} align="end">Size</Column>
        <Column allowsResizing={allowsResizing}>Description</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>2018 Proposal</Cell>
          <Cell>PDF</Cell>
          <Cell>214 KB</Cell>
          <Cell>very very very very very very long long long long long description</Cell>
        </Row>
        <Row>
          <Cell>
            <View
              width="100%"
              backgroundColor="gray-200">
              100%
            </View>
          </Cell>
          <Cell>
            <View
              UNSAFE_style={{margin: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
              width="100%"
              backgroundColor="gray-200">
              100%
            </View>
          </Cell>
          <Cell>
            <View
              UNSAFE_style={{marginInlineStart: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
              width="100%"
              backgroundColor="gray-200">
              100%
            </View>
          </Cell>
          <Cell>
            <View
              UNSAFE_style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
              width="100%"
              backgroundColor="gray-200">
              very very very very very very long long long long long description
            </View>
          </Cell>
        </Row>
        <Row>
          <Cell>
            <View
              UNSAFE_style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
              width="50%"
              backgroundColor="gray-200">
              50% div
            </View>
          </Cell>
          <Cell>
            <View
              UNSAFE_style={{margin: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
              width="70%"
              backgroundColor="gray-200">
              70% div
            </View>
          </Cell>
          <Cell>
            <View
              UNSAFE_style={{float: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
              width="70%"
              backgroundColor="gray-200">
              70% div
            </View>
          </Cell>
          <Cell>
            <View
              UNSAFE_style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
              width="70%"
              backgroundColor="gray-200">
              very very very very very very long long long long long description
            </View>
          </Cell>
        </Row>
        <Row>
          <Cell>
            <span style={{backgroundColor: 'var(--spectrum-global-color-gray-200'}}>
              span child
            </span>
          </Cell>
          <Cell>
            <span style={{backgroundColor: 'var(--spectrum-global-color-gray-200'}}>
              span child
            </span>
          </Cell>
          <Cell>
            <span style={{backgroundColor: 'var(--spectrum-global-color-gray-200'}}>
              span child
            </span>
          </Cell>
          <Cell>
            <span style={{backgroundColor: 'var(--spectrum-global-color-gray-200'}}>
              very very very very very very long long long long long description
            </span>
          </Cell>
        </Row>
      </TableBody>
    </TableView>
  );
};

export const ShouldFillCellWidth: ComponentStoryObj<typeof TableViewFilledCellWidths> = {
  args: {
    'aria-label': 'TableView with filled cells',
    width: 500,
    height: 200
  },
  render: (args) => <TableViewFilledCellWidths {...args} />,
  name: 'should fill cell width',
  argTypes: {
    allowsResizing: {type: 'boolean'}
  }
};


export const ColumnWidthsAndDividers: TableStory = {
  args: {
    'aria-label': 'TableView with column widths and dividers',
    width: 500,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column width={250} showDivider>File Name</Column>
        <Column>Type</Column>
        <Column align="end">Size</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>2018 Proposal</Cell>
          <Cell>PDF</Cell>
          <Cell>214 KB</Cell>
        </Row>
        <Row>
          <Cell>Budget</Cell>
          <Cell>XLS</Cell>
          <Cell>120 KB</Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'column widths and dividers'
};


export const CellWithLongContent: TableStory = {
  args: {
    'aria-label': 'TableView with column widths and dividers',
    width: 500,
    height: 300
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column width={250} showDivider>File Name</Column>
        <Column>Type</Column>
        <Column align="end">Size</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>2018 Proposal with very very very very very very long long long long long filename</Cell>
          <Cell>PDF</Cell>
          <Cell>214 KB</Cell>
        </Row>
        <Row>
          <Cell>Budget</Cell>
          <Cell>XLS</Cell>
          <Cell>120 KB</Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'cell with long content',
  parameters: {
    description: {
      data: 'After changing overflowMode, refresh page to see the change.'
    }
  }
};

export const CustomRowHeaderLabeling: TableStory = {
  args: {
    'aria-label': 'TableView with custom row header labeling',
    width: 500,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column isRowHeader>First Name</Column>
        <Column isRowHeader>Last Name</Column>
        <Column>Birthday</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>Sam</Cell>
          <Cell>Smith</Cell>
          <Cell>May 3</Cell>
        </Row>
        <Row>
          <Cell>Julia</Cell>
          <Cell>Jones</Cell>
          <Cell>February 10</Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'custom isRowHeader labeling',
  parameters: {
    description: {
      content: 'Changes how the screen reader labels rows.'
    }
  }
};

export const CRUD: TableStory = {
  render: (args) => <CRUDExample {...args} />,
  name: 'CRUD'
};

function DeletableRowsTable(props: SpectrumTableProps<unknown>) {
  let list = useListData({
    initialItems: [
      {id: 1, firstName: 'Sam', lastName: 'Smith', birthday: 'May 3'},
      {id: 2, firstName: 'Julia', lastName: 'Jones', birthday: 'February 10'}
    ]
  });
  let onSelectionChange = useCallback((keys) => {
    props.onSelectionChange?.(keys);
    list.setSelectedKeys(keys);
  }, [props, list]);

  return (
    <TableView
      {...props}
      selectedKeys={list.selectedKeys}
      onSelectionChange={onSelectionChange}
      renderEmptyState={list.items.length === 0 ? () => <EmptyState /> : undefined}>
      <TableHeader>
        <Column isRowHeader key="firstName">First Name</Column>
        <Column isRowHeader key="lastName">Last Name</Column>
        <Column key="birthday">Birthday</Column>
        <Column key="actions" align="end">Actions</Column>
      </TableHeader>
      <TableBody items={list.items}>
        {item =>
          (<Row>
            {column =>
              (<Cell>
                {column === 'actions'
                  ? <ActionButton onPress={() => list.remove(item.id)}>Delete</ActionButton>
                  : item[column]
                }
              </Cell>)
            }
          </Row>)
        }
      </TableBody>
    </TableView>
  );
}

export const InlineDeleteButtons: TableStory = {
  args: {
    'aria-label': 'People',
    width: 500,
    height: 300
  },
  render: (args) => <DeletableRowsTable {...args} />,
  name: 'Inline delete buttons'
};

export const HidingColumnsExample: TableStory = {
  render: (args) => <HidingColumns {...args} />,
  name: 'hiding columns'
};

export const IsLoading: TableStory = {
  args: {
    'aria-label': 'TableView loading',
    width: 700,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader columns={manyColunns}>
        {column =>
          <Column minWidth={100}>{column.name}</Column>
        }
      </TableHeader>
      <TableBody items={[] as Array<{foo: string}>} loadingState="loading">
        {item =>
          (<Row key={item.foo}>
            {key => <Cell>{item[key]}</Cell>}
          </Row>)
        }
      </TableBody>
    </TableView>
  ),
  name: 'isLoading'
};

export const IsLoadingMore: TableStory = {
  args: {
    'aria-label': 'TableView loading more',
    width: 700,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader columns={manyColunns}>
        {column =>
          <Column minWidth={100}>{column.name}</Column>
        }
      </TableHeader>
      <TableBody items={[] as Array<{foo: string}>} loadingState="loadingMore">
        {item =>
          (<Row key={item.foo}>
            {key => <Cell>{item[key]}</Cell>}
          </Row>)
        }
      </TableBody>
    </TableView>
  ),
  name: 'isLoading more'
};

export const Filtering: TableStory = {
  args: {
    'aria-label': 'TableView filtering',
    width: 700,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader columns={columns}>
        {column =>
          <Column minWidth={100}>{column.name}</Column>
        }
      </TableHeader>
      <TableBody items={items} loadingState="filtering">
        {item =>
          (<Row key={item.foo}>
            {key => <Cell>{item[key]}</Cell>}
          </Row>)
        }
      </TableBody>
    </TableView>
  ),
  name: 'filtering'
};

function renderEmptyState() {
  return (
    <IllustratedMessage>
      <svg width="150" height="103" viewBox="0 0 150 103">
        <path d="M133.7,8.5h-118c-1.9,0-3.5,1.6-3.5,3.5v27c0,0.8,0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5V23.5h119V92c0,0.3-0.2,0.5-0.5,0.5h-118c-0.3,0-0.5-0.2-0.5-0.5V69c0-0.8-0.7-1.5-1.5-1.5s-1.5,0.7-1.5,1.5v23c0,1.9,1.6,3.5,3.5,3.5h118c1.9,0,3.5-1.6,3.5-3.5V12C137.2,10.1,135.6,8.5,133.7,8.5z M15.2,21.5V12c0-0.3,0.2-0.5,0.5-0.5h118c0.3,0,0.5,0.2,0.5,0.5v9.5H15.2z M32.6,16.5c0,0.6-0.4,1-1,1h-10c-0.6,0-1-0.4-1-1s0.4-1,1-1h10C32.2,15.5,32.6,15.9,32.6,16.5z M13.6,56.1l-8.6,8.5C4.8,65,4.4,65.1,4,65.1c-0.4,0-0.8-0.1-1.1-0.4c-0.6-0.6-0.6-1.5,0-2.1l8.6-8.5l-8.6-8.5c-0.6-0.6-0.6-1.5,0-2.1c0.6-0.6,1.5-0.6,2.1,0l8.6,8.5l8.6-8.5c0.6-0.6,1.5-0.6,2.1,0c0.6,0.6,0.6,1.5,0,2.1L15.8,54l8.6,8.5c0.6,0.6,0.6,1.5,0,2.1c-0.3,0.3-0.7,0.4-1.1,0.4c-0.4,0-0.8-0.1-1.1-0.4L13.6,56.1z" />
      </svg>
      <Heading>No results</Heading>
      <Content>No results found, press <Link onPress={action('linkPress')}>here</Link> for more info.</Content>
    </IllustratedMessage>
  );
}

export function EmptyStateTable(props) {
  let {items, columns, allowsSorting, ...otherProps} = props;
  let [show, setShow] = useState(false);
  let [sortDescriptor, setSortDescriptor] = useState({});
  return (
    <Flex direction="column">
      <ActionButton width="100px" onPress={() => setShow(show => !show)}>Toggle items</ActionButton>
      <TableView aria-label="TableView with empty state" width={700} height={400} renderEmptyState={renderEmptyState} selectionMode="multiple" sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor} {...otherProps}>
        <TableHeader columns={columns ?? manyColunns}>
          {(column: any) =>
            <Column allowsResizing allowsSorting={allowsSorting} minWidth={100}>{column.name}</Column>
          }
        </TableHeader>
        <TableBody items={show ? items ?? manyRows : []}>
          {(item: any) =>
            (<Row key={item.foo} UNSTABLE_childItems={item.childRows}>
              {key => <Cell>{item[key]}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
    </Flex>
  );
}

export const EmptyStateStory: TableStory = {
  render: (args) => <EmptyStateTable {...args} />,
  name: 'renderEmptyState'
};


function AsyncLoadingExample(props) {
  const {isResizable} = props;
  interface Item {
    data: {
      id: string,
      url: string,
      title: string
    }
  }

  let list = useAsyncList<Item>({
    getKey: (item) => item.data.id,
    async load({signal, cursor}) {
      let url = new URL('https://www.reddit.com/r/upliftingnews.json');
      if (cursor) {
        url.searchParams.append('after', cursor);
      }
      let res = await fetch(url.toString(), {signal});
      let json = await res.json();
      return {items: json.data.children, cursor: json.data.after};
    },
    sort({items, sortDescriptor}) {
      return {
        items: items.slice().sort((a, b) => {
          let cmp = a.data[sortDescriptor.column] < b.data[sortDescriptor.column] ? -1 : 1;
          if (sortDescriptor.direction === 'descending') {
            cmp *= -1;
          }
          return cmp;
        })
      };
    }
  });

  return (
    <div>
      <ActionButton marginBottom={10} onPress={() => list.remove(list.items[0].data.id)}>Remove first item</ActionButton>
      <TableView {...props} sortDescriptor={list.sortDescriptor} onSortChange={list.sort} selectedKeys={list.selectedKeys} onSelectionChange={list.setSelectedKeys}>
        <TableHeader>
          <Column key="score" defaultWidth={100} allowsResizing={isResizable} allowsSorting>Score</Column>
          <Column key="title" isRowHeader allowsResizing={isResizable} allowsSorting>Title</Column>
          <Column key="author" defaultWidth={200} allowsResizing={isResizable} allowsSorting>Author</Column>
          <Column key="num_comments" defaultWidth={100} allowsResizing={isResizable} allowsSorting>Comments</Column>
        </TableHeader>
        <TableBody items={list.items} loadingState={list.loadingState} onLoadMore={list.loadMore}>
          {item =>
            (<Row key={item.data.id}>
              {key =>
                key === 'title'
                  ? <Cell textValue={item.data.title}><Link isQuiet><a href={item.data.url} target="_blank">{item.data.title}</a></Link></Cell>
                  : <Cell>{item.data[key]}</Cell>
              }
            </Row>)
          }
        </TableBody>
      </TableView>
    </div>
  );
}

export const AsyncLoading: TableStory = {
  args: {
    'aria-label': 'Top news from Reddit',
    selectionMode: 'multiple',
    width: 1000,
    height: 400
  },
  render: (args) => <AsyncLoadingExample {...args} />,
  name: 'async loading'
};

async function fakeFetch() {
  return new Promise(
    (resolve) => {
      setTimeout(() => resolve({json: async function () {
        return {data: {children: [
          {data: {id: 'foo', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}},
          {data: {id: 'fooo', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}},
          {data: {id: 'foooo', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}},
          {data: {id: 'fooooo', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}},
          {data: {id: 'foooooo', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}},
          {data: {id: 'doo', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}},
          {data: {id: '1', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}},
          {data: {id: '2', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}},
          {data: {id: '3', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}},
          {data: {id: '4', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}},
          {data: {id: '5', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}},
          {data: {id: '6', thumbnail: 'https://i.imgur.com/Z7AzH2c.jpg', ups: '7', title: 'cats', created: Date.now()}}
        ]}};
      }}), 1000);
    }
  );
}

export const AsyncLoadingQuarryTest: TableStory = {
  args: {
    'aria-label': 'Top news from Reddit',
    selectionMode: 'multiple',
    height: 400,
    width: '100%'
  },
  render: (args) => <AsyncLoadingExampleQuarryTest {...args} />,
  name: 'async reload on sort'
};

function AsyncLoadingExampleQuarryTest(props) {
  let [filters, setFilters] = React.useState({});

  const rColumns = [
    {
      key: 'title',
      label: 'Title'
    },
    {
      key: 'ups',
      label: 'Upvotes',
      width: 200
    },
    {
      key: 'created',
      label: 'Created',
      width: 350
    }
  ];
  interface Post {
    id: string,
    key: string,
    preview?: string,
    ups: number,
    title: string,
    created: string,
    url: string
  }

  let list = useAsyncList<Post>({
    getKey: (item) => item.id,
    async load({cursor}) {
      const url = new URL('https://www.reddit.com/r/aww.json');

      if (cursor) {
        url.searchParams.append('after', cursor);
      }

      const res = await fakeFetch();
      // @ts-ignore
      const json = await res.json();
      const items = json.data.children.map((item) => {
        return {
          id: item.data.id,
          preview: item.data.thumbnail,
          ups: item.data.ups,
          title: item.data.title,
          created: new Date(item.data.created * 1000).toISOString()
        };
      });
      return {
        items,
        cursor: json.data.after,
        total: 987
      };
    },
    async sort({items, sortDescriptor}) {
      return {
        items: items.slice().sort((a, b) => {
          let cmp = a[sortDescriptor.column!] < b[sortDescriptor.column!] ? -1 : 1;

          if (sortDescriptor.direction === 'descending') {
            cmp *= -1;
          }

          return cmp;
        })

      };
    }
  });

  let reloadDeps = [filters];

  useMountEffect((): void => {
    list.reload();
  }, reloadDeps);

  return (
    <TableView {...props} width="90vw" sortDescriptor={list.sortDescriptor} selectedKeys={list.selectedKeys} onSelectionChange={list.setSelectedKeys} onSortChange={setFilters}>
      <TableHeader columns={rColumns}>
        {(column) => (
          <Column key={column.key} allowsSorting>
            {column.label}
          </Column>
        )}
      </TableHeader>
      <TableBody items={list.items} loadingState={list.loadingState} onLoadMore={list.loadMore}>
        {item =>
          (<Row key={item.id}>
            {key =>
              key === 'title'
                ? <Cell textValue={item.title}><Link isQuiet><a href={item.url} target="_blank">{item.title}</a></Link></Cell>
                : <Cell>{item[key]}</Cell>
            }
          </Row>)
        }
      </TableBody>
    </TableView>
  );
}

function useMountEffect(fn: () => void, deps: Array<unknown>): void {
  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (mounted.current) {
      fn();
    } else {
      mounted.current = true;
    }
  }, deps);
}

export const HideHeader: TableStory = {
  args: {
    'aria-label': 'TableView with static contents',
    width: 350,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column key="foo">
          Foo
        </Column>
        <Column key="addAction" hideHeader>
          Add Info
        </Column>
        <Column key="deleteAction" hideHeader showDivider>
          Delete Item
        </Column>
        <Column key="bar">Bar</Column>
        <Column key="baz">Baz</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>One</Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Add Info">
              <Add />
            </ActionButton>
          </Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Delete">
              <Delete />
            </ActionButton>
          </Cell>
          <Cell>Two</Cell>
          <Cell>Three</Cell>
        </Row>
        <Row>
          <Cell>One</Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Add Info">
              <Add />
            </ActionButton>
          </Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Delete">
              <Delete />
            </ActionButton>
          </Cell>
          <Cell>Two</Cell>
          <Cell>Three</Cell>
        </Row>
        <Row>
          <Cell>One</Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Add Info">
              <Add />
            </ActionButton>
          </Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Delete">
              <Delete />
            </ActionButton>
          </Cell>
          <Cell>Two</Cell>
          <Cell>Three</Cell>
        </Row>
        <Row>
          <Cell>One</Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Add Info">
              <Add />
            </ActionButton>
          </Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Delete">
              <Delete />
            </ActionButton>
          </Cell>
          <Cell>Two</Cell>
          <Cell>Three</Cell>
        </Row>
        <Row>
          <Cell>One</Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Add Info">
              <Add />
            </ActionButton>
          </Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Delete">
              <Delete />
            </ActionButton>
          </Cell>
          <Cell>Two</Cell>
          <Cell>Three</Cell>
        </Row>
        <Row>
          <Cell>One</Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Add Info">
              <Add />
            </ActionButton>
          </Cell>
          <Cell>
            <ActionButton isQuiet aria-label="Delete">
              <Delete />
            </ActionButton>
          </Cell>
          <Cell>Two</Cell>
          <Cell>Three</Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'hideHeader'
};

let COLUMNS = [
  {
    name: 'Name',
    key: 'name',
    minWidth: 200
  },
  {
    name: 'Owner',
    key: 'ownerName'
  }
];

async function getCollectionItems(): Promise<any> {
  const result = [
    {
      id: 'xx',
      name: 'abc',
      ownerName: 'xx'
    },
    {
      id: 'aa',
      name: 'efg',
      ownerName: 'aa'
    },
    {
      id: 'yy',
      name: 'abcd',
      ownerName: 'yy'
    },
    {
      id: 'bb',
      name: 'efgh',
      ownerName: 'bb'
    },
    {
      id: 'zz',
      name: 'abce',
      ownerName: 'zz'
    },
    {
      id: 'cc',
      name: 'efgi',
      ownerName: 'cc'
    }
  ];
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(result);
    }, 5);
  });
}

function ProjectListTable(props) {
  interface Item {
    id: string,
    name: string,
    ownerName: string
  }

  let {contains} = useFilter({sensitivity: 'base'});
  let [filterText, setFilterText] = React.useState('');
  let list = useAsyncList<Item>({
    async load() {
      let projects = await getCollectionItems();
      return {items: projects};
    }
  });
  let filteredItems = React.useMemo(() => list.items.filter(item => contains(item.name, filterText)), [list.items, filterText, contains]);
  const onChange = (value) => {
    setFilterText(value);
  };

  return (
    <div>
      <SearchField
        marginStart={'size-200'}
        marginBottom={'size-200'}
        marginTop={'size-200'}
        width={'size-3600'}
        aria-label={'Search by name'}
        value={filterText}
        onChange={(onChange)} />
      <View flexGrow={1} height={700} overflow="hidden">
        <TableView
          aria-label={'Project list'}
          {...props}
          height={'100%'}
          sortDescriptor={list.sortDescriptor}
          onSortChange={list.sort}>
          <TableHeader columns={COLUMNS}>
            {(column) => {
              const {name, ...columnProps} = column;
              return <Column {...columnProps}>{name}</Column>;
            }}
          </TableHeader>
          <TableBody
            items={filteredItems}
            loadingState={list.loadingState}>
            {(item) => (
              <Row key={item.id}>{(key) => <Cell>{item[key]}</Cell>}</Row>
            )}
          </TableBody>
        </TableView>
      </View>
    </div>
  );
}

export const AsyncLoadingClientFiltering: TableStory = {
  render: (args) => <ProjectListTable {...args} />,
  name: 'async client side filter loading'
};


function AsyncServerFilterTable(props) {
  interface Item {
    name: string,
    height: string,
    mass: string
  }

  let columns = [
    {
      name: 'Name',
      key: 'name',
      minWidth: 200
    },
    {
      name: 'Height',
      key: 'height'
    },
    {
      name: 'Mass',
      key: 'mass'
    }
  ];

  let list = useAsyncList<Item>({
    getKey: (item) => item.name,
    async load({signal, cursor, filterText}) {
      if (cursor) {
        cursor = cursor.replace(/^http:\/\//i, 'https://');
      }

      let res = await fetch(cursor || `https://swapi.py4e.com/api/people/?search=${filterText}`, {signal});
      let json = await res.json();

      return {
        items: json.results,
        cursor: json.next
      };
    }
  });

  const onChange = (value) => {
    list.setFilterText(value);
  };

  return (
    <div>
      <SearchField
        marginStart={'size-200'}
        marginBottom={'size-200'}
        marginTop={'size-200'}
        width={'size-3600'}
        aria-label={'Search by name'}
        defaultValue={list.filterText}
        onChange={(onChange)} />
      <TableView
        aria-label={'Star Wars Characters'}
        height={200}
        width={600}
        {...props}
        sortDescriptor={list.sortDescriptor}
        onSortChange={list.sort}>
        <TableHeader columns={columns}>
          {(column) => {
            const {name, ...columnProps} = column;
            return <Column {...columnProps}>{name}</Column>;
          }}
        </TableHeader>
        <TableBody
          items={list.items}
          loadingState={list.loadingState}
          onLoadMore={list.loadMore}>
          {(item) => (
            <Row key={item.name}>{(key) => <Cell>{item[key]}</Cell>}</Row>
          )}
        </TableBody>
      </TableView>
    </div>
  );
}

export const AsyncLoadingServerFiltering: TableStory = {
  render: (args) => <AsyncServerFilterTable {...args} />,
  name: 'async server side filter loading'
};

export const AsyncLoadingServerFilteringLoadMore: TableStory = {
  args: {
    height: 500
  },
  render: (args) => <AsyncServerFilterTable {...args} />,
  name: 'loads more on scroll when contentSize.height < rect.height * 2'
};

export const WithDialogTrigger: TableStory = {
  args: {
    'aria-label': 'TableView with static contents',
    width: 300,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column key="foo">Foo</Column>
        <Column key="bar">Bar</Column>
        <Column key="baz">Baz</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>One</Cell>
          <Cell>Two</Cell>
          <Cell>
            <DialogTrigger>
              <ActionButton aria-label="Add"><Add /></ActionButton>
              {close => (
                <Dialog>
                  <Heading>The Heading</Heading>
                  <Divider />
                  <Content>
                    <TextField label="Last Words" />
                  </Content>
                  <ButtonGroup>
                    <Button variant="secondary" onPress={close}>Cancel</Button>
                    <Button variant="cta" onPress={close}>Confirm</Button>
                  </ButtonGroup>
                </Dialog>
              )}
            </DialogTrigger>
          </Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'with dialog trigger'
};


function TableWithBreadcrumbs(props) {
  const fs = [
    {key: 'a', name: 'Folder A', type: 'folder'},
    {key: 'b', name: 'File B', value: '10 MB'},
    {key: 'c', name: 'File C', value: '10 MB', parent: 'a'},
    {key: 'd', name: 'File D', value: '10 MB', parent: 'a'}
  ];

  const [loadingState, setLoadingState] = useState<LoadingState>('idle' as 'idle');
  const [selection, setSelection] = useState<'all' | Iterable<Key>>(new Set([]));
  const [items, setItems] = useState(() => fs.filter(item => !item.parent));
  const changeFolder = (folder) => {
    setItems([]);
    setLoadingState('loading' as 'loading');

    // mimic loading behavior
    setTimeout(() => {
      setLoadingState('idle');
      setItems(fs.filter(item =>  folder ? item.parent === folder : !item.parent));
    }, 700);
    setSelection(new Set([]));
  };

  return (
    <Flex direction="column" width="400px">
      <div>The TableView should not error if row selection changes due to items changes from external navigation (breadcrumbs).</div>
      <Breadcrumbs
        onAction={item => {
          if (item === 'root') {
            changeFolder('');
          }
        }}>
        <Item key="root">root</Item>
        <Item>a</Item>
      </Breadcrumbs>
      <TableView
        width="400px"
        height="300px"
        aria-label="table"
        {...props}
        selectedKeys={selection}
        onSelectionChange={(sel) => setSelection(sel)}>
        <TableHeader>
          <Column key="name" isRowHeader>Name</Column>
          <Column key="value">Value</Column>
        </TableHeader>
        <TableBody items={items} loadingState={loadingState}>
          {(item) => (
            <Row key={item.key}>
              {(column) => {
                if (item.type === 'folder' && column === 'name') {
                  return (
                    <Cell textValue={item[column]}>
                      <Link onPress={() => changeFolder(item.key)}>
                        {item[column]}
                      </Link>
                    </Cell>
                  );
                }
                return <Cell>{item[column]}</Cell>;
              }}
            </Row>
          )}
        </TableBody>
      </TableView>
      <ActionButton onPress={() => setSelection(items.some(item => item.key === 'd') ? new Set(['d']) : new Set([]))}>Select D</ActionButton>
    </Flex>
  );
}

export const WithBreadcrumbNavigation: TableStory = {
  args: {
    // onAction is attached to everything by default now, but that changes the behavior of TableView
    // our tests using this component expect the non-onAction behavior
    onAction: undefined
  },
  render: (args) => <TableWithBreadcrumbs {...args} />,
  name: 'table with breadcrumb navigation'
};

export const ResizingUncontrolledDynamicWidths: TableStory = {
  args: {
    'aria-label': 'TableView with resizable columns',
    width: 800,
    height: 200
  },
  render: (args) => (
    <>
      <label htmlFor="focusable-before">Focusable before</label>
      <input id="focusable-before" />
      <TableView {...args}>
        <TableHeader>
          <Column allowsResizing defaultWidth="1fr">File Name</Column>
          <Column allowsResizing defaultWidth="2fr">Type</Column>
          <Column allowsResizing defaultWidth="2fr">Size</Column>
          <Column allowsResizing defaultWidth="1fr">Weight</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>2018 Proposal</Cell>
            <Cell>PDF</Cell>
            <Cell>214 KB</Cell>
            <Cell>1 LB</Cell>
          </Row>
          <Row>
            <Cell>Budget</Cell>
            <Cell>XLS</Cell>
            <Cell>120 KB</Cell>
            <Cell>20 LB</Cell>
          </Row>
        </TableBody>
      </TableView>
      <label htmlFor="focusable-after">Focusable after</label>
      <input id="focusable-after" />
    </>
  ),
  name: 'allowsResizing, uncontrolled, dynamic widths'
};

export const ResizingUncontrolledStaticWidths: TableStory = {
  args: {
    'aria-label': 'TableView with resizable columns',
    width: 800,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column allowsResizing defaultWidth="50%">File Name</Column>
        <Column allowsResizing defaultWidth="20%">Type</Column>
        <Column allowsResizing defaultWidth={239}>Size</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>2018 Proposal</Cell>
          <Cell>PDF</Cell>
          <Cell>214 KB</Cell>
        </Row>
        <Row>
          <Cell>Budget</Cell>
          <Cell>XLS</Cell>
          <Cell>120 KB</Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'allowsResizing, uncontrolled, static widths'
};

export const ResizingUncontrolledColumnDivider: TableStory = {
  args: {
    'aria-label': 'TableView with resizable columns and divider',
    width: 800,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column allowsResizing showDivider>File Name</Column>
        <Column allowsResizing defaultWidth="3fr">Type</Column>
        <Column allowsResizing>Size</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>2018 Proposal</Cell>
          <Cell>PDF</Cell>
          <Cell>214 KB</Cell>
        </Row>
        <Row>
          <Cell>Budget</Cell>
          <Cell>XLS</Cell>
          <Cell>120 KB</Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'allowsResizing, uncontrolled, column divider'
};

export const ResizingUncontrolledMinMax: TableStory = {
  args: {
    'aria-label': 'TableView with resizable columns',
    width: 800,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column allowsResizing defaultWidth={200} minWidth={175} maxWidth={300}>File Name</Column>
        <Column allowsResizing defaultWidth="1fr" minWidth={175} maxWidth={500}>Size</Column>
        <Column allowsResizing defaultWidth={200} minWidth={175} maxWidth={300}>Type</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>2018 Proposal</Cell>
          <Cell>PDF</Cell>
          <Cell>214 KB</Cell>
        </Row>
        <Row>
          <Cell>Budget</Cell>
          <Cell>XLS</Cell>
          <Cell>120 KB</Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'allowsResizing, uncontrolled, min/max widths'
};

export const ResizingUncontrolledSomeNotAllowed: TableStory = {
  args: {
    'aria-label': 'TableView with resizable columns',
    width: 800,
    height: 200
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column allowsResizing >File Name</Column>
        <Column defaultWidth="1fr">Type</Column>
        <Column defaultWidth="2fr">Size</Column>
        <Column allowsResizing defaultWidth="2fr">Weight</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>2018 Proposal</Cell>
          <Cell>PDF</Cell>
          <Cell>214 KB</Cell>
          <Cell>1 LB</Cell>
        </Row>
        <Row>
          <Cell>Budget</Cell>
          <Cell>XLS</Cell>
          <Cell>120 KB</Cell>
          <Cell>20 LB</Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'allowsResizing, uncontrolled, some columns not allowed resizing'
};

export const ResizingUncontrolledNoHeightWidth: TableStory = {
  args: {
    'aria-label': 'TableView with resizable columns and no width or height set'
  },
  render: (args) => (
    <TableView {...args}>
      <TableHeader>
        <Column allowsResizing defaultWidth={150}>File Name</Column>
        <Column allowsResizing defaultWidth={100}>Type</Column>
        <Column allowsResizing defaultWidth={100}>Size</Column>
        <Column allowsResizing defaultWidth={100}>Weight</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>2018 Proposal</Cell>
          <Cell>PDF</Cell>
          <Cell>214 KB</Cell>
          <Cell>1 LB</Cell>
        </Row>
        <Row>
          <Cell>Budget</Cell>
          <Cell>XLS</Cell>
          <Cell>120 KB</Cell>
          <Cell>20 LB</Cell>
        </Row>
      </TableBody>
    </TableView>
  ),
  name: 'allowsResizing, uncontrolled, undefined table width and height'
};

export const ResizingUncontrolledSortableColumns: TableStory = {
  args: {
    width: 1000,
    height: 400
  },
  render: (args) => <AsyncLoadingExample isResizable {...args} />,
  name: 'allowsResizing, uncontrolled, sortable columns'
};

export const ResizingManyColumnsRows: TableStory = {
  args: {
    'aria-label': 'TableView with many columns and rows',
    width: 700,
    height: 500
  },
  render: (args) => (
    <>
      <label htmlFor="focusable-before">Focusable before</label>
      <input id="focusable-before" />
      <TableView {...args}>
        <TableHeader columns={manyColunns}>
          {column =>
            <Column allowsResizing minWidth={100}>{column.name}</Column>
          }
        </TableHeader>
        <TableBody items={manyRows}>
          {item =>
            (<Row key={item.foo}>
              {key => <Cell>{item[key]}</Cell>}
            </Row>)
          }
        </TableBody>
      </TableView>
      <label htmlFor="focusable-after">Focusable after</label>
      <input id="focusable-after" />
    </>
  ),
  name: 'allowsResizing, many columns and rows'
};

export const ResizingHidingColumns: TableStory = {
  render: (args) => <HidingColumnsAllowsResizing {...args} />,
  name: 'allowsResizing, hiding columns'
};

function EmptyState() {
  return (
    <IllustratedMessage>
      <NoSearchResults />
      <Heading>No results</Heading>
    </IllustratedMessage>
  );
}

function ZoomResizing(props) {
  const [child, setChild] = useState<string | number>('loader');

  return (
    <div className="App" style={{height: '100vh'}}>
      <RadioGroup
        label="Child type"
        orientation="horizontal"
        value={child}
        onChange={setChild}>
        <Radio value="loader">Loading state</Radio>
        <Radio value="empty">Empty state</Radio>
      </RadioGroup>
      <Flex height="100%">
        <TableView
          height="100%"
          width="100%"
          {...props}
          renderEmptyState={child === 'empty' ? () => <EmptyState /> : undefined}>
          <TableHeader>
            <Column>column</Column>
          </TableHeader>
          <TableBody
            items={[]}
            loadingState={child === 'loader' ? 'loading' : undefined}>
            {(item) => <Row>{(column) => <Cell>{item[column]}</Cell>}</Row>}
          </TableBody>
        </TableView>
      </Flex>
    </div>
  );
}

export const ResizingZoom: TableStory = {
  render: (args) => (
    <div style={{position: 'absolute', height: 'calc(100vh-32px)', width: 'calc(100vw - 32px)'}}>
      <ZoomResizing {...args} />
    </div>
  ),
  name: 'zoom resizing table',
  parameters: {description: {data: 'Using browser zoom should not trigger an infinite resizing loop. CMD+"+" to zoom in and CMD+"-" to zoom out.'}}
};

let uncontrolledColumns: PokemonColumn[] = [
  {name: 'Name', uid: 'name'},
  {name: 'Type', uid: 'type'},
  {name: 'Height', uid: 'height'},
  {name: 'Weight', uid: 'weight'},
  {name: 'Level', uid: 'level'}
];

export const ResizingControlledNoInitialWidths: TableStory = {
  render: (args) =>
    <ControllingResize {...args} width={900} columns={uncontrolledColumns} />,
  name: 'allowsResizing, controlled, no widths',
  parameters: {description: {data: `
    You can use the buttons to save and restore the column widths. When restoring,
    you will notice that the entire table reverts, this is because no columns are controlled.
  `}}
};

let columnsSomeFR: PokemonColumn[] = [
  {name: 'Name', uid: 'name', width: '1fr'},
  {name: 'Type', uid: 'type', width: '1fr'},
  {name: 'Height', uid: 'height'},
  {name: 'Weight', uid: 'weight'},
  {name: 'Level', uid: 'level', width: '4fr'}
];

export const ResizingControlledSomeInitialWidths: TableStory = {
  render: (args) => (
    <ControllingResize {...args} width={900} columns={columnsSomeFR} />
  ),
  name: 'allowsResizing, controlled, some widths',
  parameters: {description: {data: `
    You can use the buttons to save and restore the column widths. When restoring,
    you will see a quick flash because the entire table is re-rendered. This
    mimics what would happen if an app reloaded the whole page and restored a saved
    column width state. This is a "some widths" controlled story. It cannot restore
    the widths of the columns that it does not manage. Height and weight are uncontrolled.
  `}}
};

let columnsFR: PokemonColumn[] = [
  {name: 'Name', uid: 'name', width: '1fr'},
  {name: 'Type', uid: 'type', width: '1fr'},
  {name: 'Level', uid: 'level', width: '4fr'}
];

export const ResizingControlledAllInitialWidths: TableStory = {
  render: (args) => (
    <ControllingResize {...args} width={900} columns={columnsFR} />
  ),
  name: 'allowsResizing, controlled, all widths',
  parameters: {description: {data: `
    You can use the buttons to save and restore the column widths. When restoring,
    you will see a quick flash because the entire table is re-rendered. This
    mimics what would happen if an app reloaded the whole page and restored a saved
    column width state.
  `}}
};

let columnsFRHideHeaders: PokemonColumn[] = [
  {name: 'Name', uid: 'name', hideHeader: true},
  {name: 'Type', uid: 'type', width: 300,  hideHeader: true},
  {name: 'Level', uid: 'level', width: '4fr'}
];

export const ResizingControlledHideHeader: TableStory = {
  render: (args) => (
    <ControllingResize {...args} width={900} columns={columnsFRHideHeaders} />
  ),
  name: 'allowsResizing, controlled, hideHeader',
  parameters: {description: {data: `
    Hide headers columns should not be resizable.
  `}}
};

let typeAheadColumns = [
  {name: 'First Name', id: 'firstname', isRowHeader: true},
  {name: 'Last Name', id: 'lastname', isRowHeader: true},
  {name: 'Birthday', id: 'birthday'},
  {name: 'Edit', id: 'edit'}
];
let typeAheadRows = [
  ...Array.from({length: 100}, (v, i) => ({id: i, firstname: 'Aubrey', lastname: 'Sheppard', birthday: 'May 7'})),
  {id: 101, firstname: 'John', lastname: 'Doe', birthday: 'May 7'}
];

export const TypeaheadWithDialog: TableStory = {
  render: (args) => (
    <div style={{height: '90vh'}}>
      <TableView aria-label="Table" selectionMode="none" height="100%" {...args}>
        <TableHeader columns={typeAheadColumns}>
          {(col) => (
            <Column key={col.id} isRowHeader={col.isRowHeader}>{col.name}</Column>
          )}
        </TableHeader>
        <TableBody items={typeAheadRows}>
          {(item) => (
            <Row key={item.id}>
              {(key) =>
                key === 'edit' ? (
                  <Cell>
                    <DialogTrigger>
                      <ActionButton aria-label="Add Info">
                        <Add />
                      </ActionButton>
                      <Dialog>
                        <Heading>Add Info</Heading>
                        <Divider />
                        <Content>
                          <TextField label="Enter a J" />
                        </Content>
                      </Dialog>
                    </DialogTrigger>
                  </Cell>
                ) : (
                  <Cell>{item[key]}</Cell>
                )
              }
            </Row>
          )}
        </TableBody>
      </TableView>
    </div>
  )
};

export const Links = (args) => {
  return (
    <TableView {...args} aria-label="Bookmarks table" onSelectionChange={action('onSelectionChange')}>
      <TableHeader>
        <Column>Name</Column>
        <Column>URL</Column>
        <Column>Date added</Column>
      </TableHeader>
      <TableBody>
        <Row key="https://adobe.com/" href="https://adobe.com/">
          <Cell>Adobe</Cell>
          <Cell>https://adobe.com/</Cell>
          <Cell>January 28, 2023</Cell>
        </Row>
        <Row key="https://google.com/" href="https://google.com/">
          <Cell>Google</Cell>
          <Cell>https://google.com/</Cell>
          <Cell>April 5, 2023</Cell>
        </Row>
        <Row key="https://apple.com/" href="https://apple.com/">
          <Cell>Apple</Cell>
          <Cell>https://apple.com/</Cell>
          <Cell>June 5, 2023</Cell>
        </Row>
        <Row key="https://nytimes.com/" href="https://nytimes.com/">
          <Cell>New York Times</Cell>
          <Cell>https://nytimes.com/</Cell>
          <Cell>July 12, 2023</Cell>
        </Row>
      </TableBody>
    </TableView>
  );
};

export const ColumnHeaderFocusRingTable = {
  render: () => <LoadingTable />,
  name: 'column header focus after loading',
  parameters: {
    description: {
      data: 'Column header should remain focused even if the table collections empties/loading state changes to loading'
    }
  }
};

const allItems = [
  {key: 'sam', name: 'Sam', height: 66, birthday: 'May 3'},
  {key: 'julia', name: 'Julia', height: 70, birthday: 'February 10'}
];

function LoadingTable() {
  const [items, setItems] = useState(allItems);
  const [loadingState, setLoadingState] = useState(undefined);
  const onSortChange = () => {
    setItems([]);
    setLoadingState('loading');
    setTimeout(() => {
      setItems(items.length > 1 ? [...items.slice(0, 1)] : []);
      setLoadingState(undefined);
    }, 1000);
  };

  return (
    <TableView aria-label="Table" selectionMode="multiple" onSortChange={onSortChange} height={300}>
      <TableHeader>
        <Column key="name">Name</Column>
        <Column key="height" allowsSorting>Height</Column>
        <Column key="birthday">Birthday</Column>
      </TableHeader>
      <TableBody items={items} loadingState={loadingState}>
        {item => (
          <Row key={item.key}>
            {column => <Cell>{item[column]}</Cell>}
          </Row>
        )}
      </TableBody>
    </TableView>
  );
}

export {Performance} from './Performance';
