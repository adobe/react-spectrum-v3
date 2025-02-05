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

import {action} from '@storybook/addon-actions';
import {Button, Cell, Checkbox, CheckboxProps, Collection, Column, ColumnProps, ColumnResizer, Dialog, DialogTrigger, DropIndicator, Heading, Menu, MenuTrigger, Modal, ModalOverlay, Popover, ResizableTableContainer, Row, Table, TableBody, TableHeader, UNSTABLE_TableLayout as TableLayout, useDragAndDrop, UNSTABLE_Virtualizer as Virtualizer} from 'react-aria-components';
import {isTextDropItem} from 'react-aria';
import {MyMenuItem} from './utils';
import React, {useMemo, useRef} from 'react';
import styles from '../example/index.css';
import {UNSTABLE_TableLoadingIndicator} from '../src/Table';
import {useAsyncList, useListData} from 'react-stately';
import {useLoadMore} from '@react-aria/utils';

export default {
  title: 'React Aria Components',
  excludeStories: ['DndTable']
};

const ReorderableTable = ({initialItems}: {initialItems: {id: string, name: string}[]}) => {
  let list = useListData({initialItems});

  const {dragAndDropHooks} = useDragAndDrop({
    getItems: keys => {
      return [...keys].filter(k => !!list.getItem(k)).map(k => {
        const item = list.getItem(k);
        return {
          'text/plain': item!.id,
          item: JSON.stringify(item)
        };
      });
    },
    getDropOperation: () => 'move',
    onReorder: e => {
      if (e.target.dropPosition === 'before') {
        list.moveBefore(e.target.key, e.keys);
      } else if (e.target.dropPosition === 'after') {
        list.moveAfter(e.target.key, e.keys);
      }
    },
    onInsert: async e => {
      const processedItems = await Promise.all(
        e.items.filter(isTextDropItem).map(async item => JSON.parse(await item.getText('item')))
      );
      if (e.target.dropPosition === 'before') {
        list.insertBefore(e.target.key, ...processedItems);
      } else if (e.target.dropPosition === 'after') {
        list.insertAfter(e.target.key, ...processedItems);
      }
    },

    onDragEnd: e => {
      if (e.dropOperation === 'move' && !e.isInternal) {
        list.remove(...e.keys);
      }
    },

    onRootDrop: async e => {
      const processedItems = await Promise.all(
        e.items.filter(isTextDropItem).map(async item => JSON.parse(await item.getText('item')))
      );

      list.append(...processedItems);
    }
  });

  return (
    <Table aria-label="Reorderable table" dragAndDropHooks={dragAndDropHooks}>
      <TableHeader>
        <MyColumn isRowHeader defaultWidth="50%">Id</MyColumn>
        <MyColumn>Name</MyColumn>
      </TableHeader>
      <TableBody items={list.items} renderEmptyState={({isDropTarget}) => <span style={{color: isDropTarget ? 'red' : 'black'}}>Drop items here</span>}>
        {item => (
          <Row>
            <Cell>{item.id}</Cell>
            <Cell>{item.name}</Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
};

export const ReorderableTableExample = () => (
  <>
    <ResizableTableContainer style={{width: 300, overflow: 'auto'}}>
      <ReorderableTable initialItems={[{id: '1', name: 'Bob'}]} />
    </ResizableTableContainer>
    <ResizableTableContainer style={{width: 300, overflow: 'auto'}}>
      <ReorderableTable initialItems={[{id: '2', name: 'Alex'}]} />
    </ResizableTableContainer>
  </>
);

export const TableExample = () => {
  let list = useListData({
    initialItems: [
      {id: 1, name: 'Games', date: '6/7/2020', type: 'File folder'},
      {id: 2, name: 'Program Files', date: '4/7/2021', type: 'File folder'},
      {id: 3, name: 'bootmgr', date: '11/20/2010', type: 'System file'},
      {id: 4, name: 'log.txt', date: '1/18/2016', type: 'Text Document'}
    ]
  });

  return (
    <ResizableTableContainer style={{width: 300, overflow: 'auto'}}>
      <Table aria-label="Example table">
        <TableHeader>
          <MyColumn isRowHeader defaultWidth="50%">Name</MyColumn>
          <MyColumn>Type</MyColumn>
          <MyColumn>Date Modified</MyColumn>
          <MyColumn>Actions</MyColumn>
        </TableHeader>
        <TableBody items={list.items}>
          {item => (
            <Row>
              <Cell>{item.name}</Cell>
              <Cell>{item.type}</Cell>
              <Cell>{item.date}</Cell>
              <Cell>
                <DialogTrigger>
                  <Button>Delete</Button>
                  <ModalOverlay
                    style={{
                      position: 'fixed',
                      zIndex: 100,
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      background: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    <Modal
                      style={{
                        background: 'Canvas',
                        color: 'CanvasText',
                        border: '1px solid gray',
                        padding: 30
                      }}>
                      <Dialog>
                        {({close}) => (<>
                          <Heading slot="title">Delete item</Heading>
                          <p>Are you sure?</p>
                          <Button onPress={close}>Cancel</Button>
                          <Button
                            onPress={() => {
                              close();
                              list.remove(item.id);
                            }}>
                            Delete
                          </Button>
                        </>)}
                      </Dialog>
                    </Modal>
                  </ModalOverlay>
                </DialogTrigger>
              </Cell>
            </Row>
          )}
        </TableBody>
      </Table>
    </ResizableTableContainer>
  );
};

let columns = [
  {name: 'Name', id: 'name', isRowHeader: true},
  {name: 'Type', id: 'type'},
  {name: 'Date Modified', id: 'date'}
];

let rows = [
  {id: 1, name: 'Games', date: '6/7/2020', type: 'File folder'},
  {id: 2, name: 'Program Files', date: '4/7/2021', type: 'File folder'},
  {id: 3, name: 'bootmgr', date: '11/20/2010', type: 'System file'},
  {id: 4, name: 'log.txt', date: '1/18/20167', type: 'Text Document'}
];

export const TableDynamicExample = () => {
  return (
    <Table aria-label="Files">
      <TableHeader columns={columns}>
        {(column) => (
          <Column isRowHeader={column.isRowHeader}>{column.name}</Column>
        )}
      </TableHeader>
      <TableBody items={rows}>
        {(item) => (
          <Row columns={columns}>
            {(column) => {
              return <Cell>{item[column.id]}</Cell>;
            }}
          </Row>
        )}
      </TableBody>
    </Table>
  );
};

let timeTableColumns = [
  {name: 'Time', id: 'time', isRowHeader: true},
  {name: 'Monday', id: 'monday'},
  {name: 'Tuesday', id: 'tuesday'},
  {name: 'Wednesday', id: 'wednesday'},
  {name: 'Thursday', id: 'thursday'},
  {name: 'Friday', id: 'friday'}
];

let timeTableRows = [
  {id: 1, time: '08:00 - 09:00', monday: 'Math', tuesday: 'History', wednesday: 'Science', thursday: 'English', friday: 'Art'},
  {id: 2, time: '09:00 - 10:00', name: 'Break', type: 'break'},
  {id: 3, time: '10:00 - 11:00', monday: 'Math', tuesday: 'History', wednesday: 'Science', thursday: 'English', friday: 'Art'},
  {id: 4, time: '11:00 - 12:00', monday: 'Math', tuesday: 'History', wednesday: 'Science', thursday: 'English', friday: 'Art'},
  {id: 5, time: '12:00 - 13:00', name: 'Break', type: 'break'},
  {id: 6, time: '13:00 - 14:00', monday: 'History', tuesday: 'Math', wednesday: 'English', thursday: 'Science', friday: 'Art'}
];

export const TableCellColSpanExample = () => {
  return (
    <Table aria-label="Timetable">
      <TableHeader columns={timeTableColumns}>
        {(column) => (
          <Column isRowHeader={column.isRowHeader}>{column.name}</Column>
        )}
      </TableHeader>
      <TableBody items={timeTableRows}>
        {(item) => (
          <Row columns={columns}>
            {item.type === 'break' ? (
              <>
                <Cell>{item.time}</Cell>
                <Cell colSpan={5}>{item.name}</Cell>
              </>
            ) : (
              <>
                <Cell>{item.time}</Cell>
                <Cell>{item.monday}</Cell>
                <Cell>{item.tuesday}</Cell>
                <Cell>{item.wednesday}</Cell>
                <Cell>{item.thursday}</Cell>
                <Cell>{item.friday}</Cell>
              </>
            )}
          </Row>
        )}
      </TableBody>
    </Table>
  );
};

export const TableCellColSpanWithVariousSpansExample = () => {
  return (
    <Table aria-label="Table with various colspans">
      <TableHeader>
        <Column isRowHeader>Col 1</Column>
        <Column >Col 2</Column>
        <Column >Col 3</Column>
        <Column >Col 4</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>Cell</Cell>
          <Cell colSpan={2}>Span 2</Cell>
          <Cell>Cell</Cell>
        </Row>
        <Row>
          <Cell>Cell</Cell>
          <Cell>Cell</Cell>
          <Cell>Cell</Cell>
          <Cell>Cell</Cell>
        </Row>
        <Row>
          <Cell colSpan={4}>Span 4</Cell>
        </Row>
        <Row>
          <Cell>Cell</Cell>
          <Cell>Cell</Cell>
          <Cell>Cell</Cell>
          <Cell>Cell</Cell>
        </Row>
        <Row>
          <Cell colSpan={3}>Span 3</Cell>
          <Cell>Cell</Cell>
        </Row>
        <Row>
          <Cell>Cell</Cell>
          <Cell>Cell</Cell>
          <Cell>Cell</Cell>
          <Cell>Cell</Cell>
        </Row>
        <Row>
          <Cell>Cell</Cell>
          <Cell colSpan={3}>Span 3</Cell>
        </Row>
      </TableBody>
    </Table>
  );
};

const MyColumn = (props: ColumnProps) => {
  return (
    <Column {...props}>
      {({startResize}) => (
        <div style={{display: 'flex'}}>
          <MenuTrigger>
            <Button style={{flex: 1, textAlign: 'left'}}>{props.children as React.ReactNode}</Button>
            <Popover>
              <Menu className={styles.menu} onAction={() => startResize()}>
                <MyMenuItem id="resize">Resize</MyMenuItem>
              </Menu>
            </Popover>
          </MenuTrigger>
          <ColumnResizer onHoverStart={action('onHoverStart')} onHoverChange={action('onHoverChange')} onHoverEnd={action('onHoverEnd')}>
            ↔
          </ColumnResizer>
        </div>
      )}
    </Column>
  );
};

interface FileItem {
  id: string,
  name: string,
  type: string
}

interface DndTableProps {
  initialItems: FileItem[],
  'aria-label': string,
  isDisabled?: boolean,
  isLoading?: boolean,
  onSelectionChange?: (keys) => void
}

export const DndTable = (props: DndTableProps) => {
  let list = useListData({
    initialItems: props.initialItems
  });

  let {dragAndDropHooks} = useDragAndDrop({
    isDisabled: props.isDisabled,
    // Provide drag data in a custom format as well as plain text.
    getItems(keys) {
      return [...keys].filter(k => !!list.getItem(k)).map((key) => {
        let item = list.getItem(key);
        return {
          'custom-app-type': JSON.stringify(item),
          'text/plain': item!.name
        };
      });
    },

    // Accept drops with the custom format.
    acceptedDragTypes: ['custom-app-type'],

    // Ensure items are always moved rather than copied.
    getDropOperation: () => 'move',

    // Handle drops between items from other lists.
    async onInsert(e) {
      let processedItems = await Promise.all(
          e.items
            .filter(isTextDropItem)
            .map(async item => JSON.parse(await item.getText('custom-app-type')))
        );
      if (e.target.dropPosition === 'before') {
        list.insertBefore(e.target.key, ...processedItems);
      } else if (e.target.dropPosition === 'after') {
        list.insertAfter(e.target.key, ...processedItems);
      }
    },

    // Handle drops on the collection when empty.
    async onRootDrop(e) {
      let processedItems = await Promise.all(
          e.items
            .filter(isTextDropItem)
            .map(async item => JSON.parse(await item.getText('custom-app-type')))
        );
      list.append(...processedItems);
    },

    // Handle reordering items within the same list.
    onReorder(e) {
      if (e.target.dropPosition === 'before') {
        list.moveBefore(e.target.key, e.keys);
      } else if (e.target.dropPosition === 'after') {
        list.moveAfter(e.target.key, e.keys);
      }
    },

    // Remove the items from the source list on drop
    // if they were moved to a different list.
    onDragEnd(e) {
      if (e.dropOperation === 'move' && !e.isInternal) {
        list.remove(...e.keys);
      }
    }
  });

  return (
    <Table
      aria-label={props['aria-label']}
      selectionMode="multiple"
      selectedKeys={list.selectedKeys}
      onSelectionChange={(keys) => {
        props.onSelectionChange?.(keys);
        list.setSelectedKeys(keys);
      }}
      dragAndDropHooks={dragAndDropHooks}>
      <TableHeader>
        <Column />
        <Column><MyCheckbox slot="selection" /></Column>
        <Column>ID</Column>
        <Column isRowHeader>Name</Column>
        <Column>Type</Column>
      </TableHeader>
      <TableBody items={list.items} renderEmptyState={() => renderEmptyLoader({isLoading: props.isLoading, tableWidth: 200})}>
        <Collection items={list.items}>
          {item => (
            <Row>
              <Cell><Button slot="drag">≡</Button></Cell>
              <Cell><MyCheckbox slot="selection" /></Cell>
              <Cell>{item.id}</Cell>
              <Cell>{item.name}</Cell>
              <Cell>{item.type}</Cell>
            </Row>
          )}
        </Collection>
        {props.isLoading && list.items.length > 0 && <MyTableLoadingIndicator />}
      </TableBody>
    </Table>
  );
};

type DndTableExampleProps = {
  isDisabledFirstTable?: boolean,
  isDisabledSecondTable?: boolean,
  isLoading?: boolean
}

export const DndTableExample = (props: DndTableExampleProps) => {
  return (
    <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
      <DndTable
        isLoading={props.isLoading}
        initialItems={[
        {id: '1', type: 'file', name: 'Adobe Photoshop'},
        {id: '2', type: 'file', name: 'Adobe XD'},
        {id: '3', type: 'folder', name: 'Documents'},
        {id: '4', type: 'file', name: 'Adobe InDesign'},
        {id: '5', type: 'folder', name: 'Utilities'},
        {id: '6', type: 'file', name: 'Adobe AfterEffects'}
        ]}
        aria-label="First Table"
        isDisabled={props.isDisabledFirstTable} />
      <DndTable
        isLoading={props.isLoading}
        initialItems={[
        {id: '7', type: 'folder', name: 'Pictures'},
        {id: '8', type: 'file', name: 'Adobe Fresco'},
        {id: '9', type: 'folder', name: 'Apps'},
        {id: '10', type: 'file', name: 'Adobe Illustrator'},
        {id: '11', type: 'file', name: 'Adobe Lightroom'},
        {id: '12', type: 'file', name: 'Adobe Dreamweaver'}
        ]}
        aria-label="Second Table"
        isDisabled={props.isDisabledSecondTable} />
    </div>
  );
};

DndTableExample.args = {
  isDisabledFirstTable: false,
  isDisabledSecondTable: false,
  isLoading: false
};

const MyCheckbox = ({children, ...props}: CheckboxProps) => {
  return (
    <Checkbox {...props}>
      {({isIndeterminate}) => (
        <>
          <div className="checkbox">
            <svg viewBox="0 0 18 18" aria-hidden="true">
              {isIndeterminate
                ? <rect x={1} y={7.5} width={15} height={3} />
                : <polyline points="1 9 7 14 15 4" />}
            </svg>
          </div>
          {children}
        </>
      )}
    </Checkbox>
  );
};

const MyTableLoadingIndicator = ({tableWidth = 400}) => {
  return (
    // These styles will make the load more spinner sticky. A user would know if their table is virtualized and thus could control this styling if they wanted to
    // TODO: this doesn't work because the virtualizer wrapper around the table body has overflow: hidden. Perhaps could change this by extending the table layout and
    // making the layoutInfo for the table body have allowOverflow
    <UNSTABLE_TableLoadingIndicator style={{height: 'inherit', position: 'sticky', top: 0, left: 0, width: tableWidth}}>
      <span>
        Load more spinner
      </span>
    </UNSTABLE_TableLoadingIndicator>
  );
};

function MyTableBody(props) {
  let {rows, children, isLoadingMore, tableWidth, ...otherProps} = props;
  return (
    <TableBody {...otherProps}>
      <Collection items={rows}>
        {children}
      </Collection>
      {isLoadingMore && <MyTableLoadingIndicator tableWidth={tableWidth} />}
    </TableBody>
  );
}

const TableLoadingBodyWrapper = (args: {isLoadingMore: boolean}) => {
  return (
    <Table aria-label="Files">
      <TableHeader columns={columns}>
        {(column) => (
          <Column isRowHeader={column.isRowHeader}>{column.name}</Column>
        )}
      </TableHeader>
      <MyTableBody rows={rows} isLoadingMore={args.isLoadingMore}>
        {(item) => (
          <Row columns={columns}>
            {(column) => {
              return <Cell>{item[column.id]}</Cell>;
            }}
          </Row>
        )}
      </MyTableBody>
    </Table>
  );
};

export const TableLoadingBodyWrapperStory = {
  render: TableLoadingBodyWrapper,
  args: {
    isLoadingMore: false
  },
  name: 'Table loading, table body wrapper with collection'
};

function MyRow(props) {
  return (
    <>
      {/* Note that all the props are propagated from MyRow to Row, ensuring the id propagates */}
      <Row {...props} />
      {props.isLoadingMore && <MyTableLoadingIndicator />}
    </>
  );
}

const TableLoadingRowRenderWrapper = (args: {isLoadingMore: boolean}) => {
  return (
    <Table aria-label="Files">
      <TableHeader columns={columns}>
        {(column) => (
          <Column isRowHeader={column.isRowHeader}>{column.name}</Column>
        )}
      </TableHeader>
      <TableBody items={rows} dependencies={[args.isLoadingMore]}>
        {(item) => (
          <MyRow columns={columns} isLoadingMore={item.id === 4 && args.isLoadingMore}>
            {(column) => {
              return <Cell>{item[column.id]}</Cell>;
            }}
          </MyRow>
        )}
      </TableBody>
    </Table>
  );
};

export const TableLoadingRowRenderWrapperStory = {
  render: TableLoadingRowRenderWrapper,
  args: {
    isLoadingMore: false
  },
  name: 'Table loading, row renderer wrapper and dep array'
};


function renderEmptyLoader({isLoading, tableWidth = 400}) {
  let contents = isLoading ? 'Loading spinner' : 'No results found';
  return <div style={{height: 'inherit', position: 'sticky', top: 0, left: 0, width: tableWidth}}>{contents}</div>;
}

const RenderEmptyState = (args: {isLoading: boolean}) => {
  let {isLoading} = args;
  return (
    <Table aria-label="Files" selectionMode="multiple">
      <TableHeader columns={columns}>
        <Column><MyCheckbox slot="selection" /></Column>
        <Collection items={columns}>
          {(column) => (

            <Column isRowHeader={column.isRowHeader}>{column.name}</Column>
          )}
        </Collection>
      </TableHeader>
      <TableBody renderEmptyState={() => renderEmptyLoader({isLoading})}>
        <Collection items={[]}>
          {(item) => (
            <Row columns={columns}>
              {(column) => {
                return <Cell>{item[column.id]}</Cell>;
              }}
            </Row>
          )}
        </Collection>
      </TableBody>
    </Table>
  );
};

export const RenderEmptyStateStory  = {
  render: RenderEmptyState,
  args: {
    isLoading: false
  },
  name: 'Empty/Loading Table rendered with TableLoadingIndicator collection element'
};

interface Character {
  name: string,
  height: number,
  mass: number,
  birth_year: number
}

const OnLoadMoreTable = () => {
  let list = useAsyncList<Character>({
    async load({signal, cursor}) {
      if (cursor) {
        cursor = cursor.replace(/^http:\/\//i, 'https://');
      }

      // Slow down load so progress circle can appear
      await new Promise(resolve => setTimeout(resolve, 4000));
      let res = await fetch(cursor || 'https://swapi.py4e.com/api/people/?search=', {signal});
      let json = await res.json();
      return {
        items: json.results,
        cursor: json.next
      };
    }
  });

  let isLoading = list.loadingState === 'loading' || list.loadingState === 'loadingMore';
  let scrollRef = useRef<HTMLDivElement>(null);
  let memoedLoadMoreProps = useMemo(() => ({
    isLoading: isLoading,
    onLoadMore: list.loadMore,
    items: list.items
  }), [isLoading, list.loadMore, list.items]);
  useLoadMore(memoedLoadMoreProps, scrollRef);

  return (
    <ResizableTableContainer ref={scrollRef} style={{height: 150, width: 400, overflow: 'auto'}}>
      <Table aria-label="Load more table">
        <TableHeader>
          <Column id="name" isRowHeader style={{position: 'sticky', top: 0, backgroundColor: 'lightgray'}}>Name</Column>
          <Column id="height" style={{position: 'sticky', top: 0, backgroundColor: 'lightgray'}}>Height</Column>
          <Column id="mass" style={{position: 'sticky', top: 0, backgroundColor: 'lightgray'}}>Mass</Column>
          <Column id="birth_year" style={{position: 'sticky', top: 0, backgroundColor: 'lightgray'}}>Birth Year</Column>
        </TableHeader>
        <MyTableBody
          tableWidth={400}
          renderEmptyState={() => renderEmptyLoader({isLoading: list.loadingState === 'loading', tableWidth: 400})}
          isLoadingMore={list.loadingState === 'loadingMore'}
          rows={list.items}>
          {(item) => (
            <Row id={item.name} style={{width: 'inherit', height: 'inherit'}}>
              <Cell>{item.name}</Cell>
              <Cell>{item.height}</Cell>
              <Cell>{item.mass}</Cell>
              <Cell>{item.birth_year}</Cell>
            </Row>
          )}
        </MyTableBody>
      </Table>
    </ResizableTableContainer>
  );
};

export const OnLoadMoreTableStory  = {
  render: OnLoadMoreTable,
  name: 'onLoadMore table'
};

export function VirtualizedTable() {
  let items: {id: number, foo: string, bar: string, baz: string}[] = [];
  for (let i = 0; i < 1000; i++) {
    items.push({id: i, foo: `Foo ${i}`, bar: `Bar ${i}`, baz: `Baz ${i}`});
  }

  let layout = useMemo(() => {
    return new TableLayout({
      rowHeight: 25,
      headingHeight: 25
    });
  }, []);

  let list = useListData({
    initialItems: items
  });

  let {dragAndDropHooks} = useDragAndDrop({
    getItems: (keys) => {
      return [...keys].filter(k => !!list.getItem(k)).map(key => ({'text/plain': list.getItem(key)!.foo}));
    },
    onReorder(e) {
      if (e.target.dropPosition === 'before') {
        list.moveBefore(e.target.key, e.keys);
      } else if (e.target.dropPosition === 'after') {
        list.moveAfter(e.target.key, e.keys);
      }
    },
    renderDropIndicator(target) {
      return <DropIndicator target={target} style={({isDropTarget}) => ({width: '100%', height: '100%', background: isDropTarget ? 'blue' : 'transparent'})} />;
    }
  });

  return (
    <Virtualizer layout={layout}>
      <Table aria-label="virtualized table" selectionMode="multiple" dragAndDropHooks={dragAndDropHooks} style={{height: 400, width: 400, overflow: 'auto', scrollPaddingTop: 25}}>
        <TableHeader style={{background: 'var(--spectrum-gray-100)', width: '100%', height: '100%'}}>
          <Column width={30} minWidth={0} />
          <Column width={30} minWidth={0}><MyCheckbox slot="selection" /></Column>
          <Column isRowHeader><strong>Foo</strong></Column>
          <Column><strong>Bar</strong></Column>
          <Column><strong>Baz</strong></Column>
        </TableHeader>
        <TableBody items={list.items}>
          {item => (
            <Row style={{width: 'inherit', height: 'inherit'}}>
              <Cell><Button slot="drag">≡</Button></Cell>
              <Cell><MyCheckbox slot="selection" /></Cell>
              <Cell>{item.foo}</Cell>
              <Cell>{item.bar}</Cell>
              <Cell>{item.baz}</Cell>
            </Row>
          )}
        </TableBody>
      </Table>
    </Virtualizer>
  );
}

export function VirtualizedTableWithResizing() {
  let items: {id: number, foo: string, bar: string, baz: string}[] = [];
  for (let i = 0; i < 1000; i++) {
    items.push({id: i, foo: `Foo ${i}`, bar: `Bar ${i}`, baz: `Baz ${i}`});
  }

  let layout = useMemo(() => {
    return new TableLayout({
      rowHeight: 25,
      headingHeight: 25
    });
  }, []);

  return (
    <ResizableTableContainer style={{height: 400, width: 400, overflow: 'auto', scrollPaddingTop: 25}}>
      <Virtualizer layout={layout}>
        <Table aria-label="virtualized table">
          <TableHeader style={{background: 'var(--spectrum-gray-100)', width: '100%', height: '100%'}}>
            <MyColumn isRowHeader>Foo</MyColumn>
            <MyColumn>Bar</MyColumn>
            <MyColumn>Baz</MyColumn>
          </TableHeader>
          <TableBody items={items}>
            {item => (
              <Row style={{width: 'inherit', height: 'inherit'}}>
                <Cell>{item.foo}</Cell>
                <Cell>{item.bar}</Cell>
                <Cell>{item.baz}</Cell>
              </Row>
            )}
          </TableBody>
        </Table>
      </Virtualizer>
    </ResizableTableContainer>
  );
}

function VirtualizedTableWithEmptyState(args) {
  let layout = useMemo(() => {
    return new TableLayout({
      rowHeight: 25,
      headingHeight: 25
    });
  }, []);

  let rows = [
    {foo: 'Foo 1', bar: 'Bar 1', baz: 'Baz 1'},
    {foo: 'Foo 2', bar: 'Bar 2', baz: 'Baz 2'},
    {foo: 'Foo 3', bar: 'Bar 3', baz: 'Baz 3'},
    {foo: 'Foo 4', bar: 'Bar 4', baz: 'Baz 4'}
  ];

  return (
    <ResizableTableContainer style={{height: 400, width: 400, overflow: 'auto', scrollPaddingTop: 25}}>
      <Virtualizer layout={layout}>
        <Table aria-label="virtualized table">
          <TableHeader style={{background: 'var(--spectrum-gray-100)', width: '100%', height: '100%'}}>
            <MyColumn isRowHeader>Foo</MyColumn>
            <MyColumn>Bar</MyColumn>
            <MyColumn>Baz</MyColumn>
          </TableHeader>
          <MyTableBody
            isLoadingMore={args.showRows && args.isLoading}
            renderEmptyState={() => renderEmptyLoader({isLoading: !args.showRows && args.isLoading})}
            rows={!args.showRows ? [] : rows}>
            {(item) => (
              <Row id={item.foo} style={{width: 'inherit', height: 'inherit'}}>
                <Cell>{item.foo}</Cell>
                <Cell>{item.bar}</Cell>
                <Cell>{item.baz}</Cell>
              </Row>
            )}
          </MyTableBody>
        </Table>
      </Virtualizer>
    </ResizableTableContainer>
  );
}

export const VirtualizedTableWithEmptyStateStory  = {
  render: VirtualizedTableWithEmptyState,
  args: {
    isLoading: false,
    showRows: false
  },
  name: 'Virtualized Table With Empty State'
};

const OnLoadMoreTableVirtualized = () => {
  let list = useAsyncList<Character>({
    async load({signal, cursor}) {
      if (cursor) {
        cursor = cursor.replace(/^http:\/\//i, 'https://');
      }

      // Slow down load so progress circle can appear
      await new Promise(resolve => setTimeout(resolve, 4000));
      let res = await fetch(cursor || 'https://swapi.py4e.com/api/people/?search=', {signal});
      let json = await res.json();
      return {
        items: json.results,
        cursor: json.next
      };
    }
  });

  let layout = useMemo(() => {
    return new TableLayout({
      rowHeight: 25,
      headingHeight: 25
    });
  }, []);

  let isLoading = list.loadingState === 'loading' || list.loadingState === 'loadingMore';
  let scrollRef = useRef<HTMLTableElement>(null);
  let memoedLoadMoreProps = useMemo(() => ({
    isLoading: isLoading,
    onLoadMore: list.loadMore,
    items: list.items
  }), [isLoading, list.loadMore, list.items]);
  useLoadMore(memoedLoadMoreProps, scrollRef);

  return (
    <Virtualizer layout={layout}>
      <Table aria-label="Load more table virtualized" ref={scrollRef} style={{height: 150, width: 400, overflow: 'auto'}}>
        <TableHeader style={{background: 'var(--spectrum-gray-100)', width: '100%', height: '100%'}}>
          <Column id="name" isRowHeader>Name</Column>
          <Column id="height">Height</Column>
          <Column id="mass">Mass</Column>
          <Column id="birth_year">Birth Year</Column>
        </TableHeader>
        <MyTableBody
          renderEmptyState={() => renderEmptyLoader({isLoading: list.loadingState === 'loading'})}
          isLoadingMore={list.loadingState === 'loadingMore'}
          rows={list.items}>
          {(item) => (
            <Row id={item.name} style={{width: 'inherit', height: 'inherit'}}>
              <Cell>{item.name}</Cell>
              <Cell>{item.height}</Cell>
              <Cell>{item.mass}</Cell>
              <Cell>{item.birth_year}</Cell>
            </Row>
          )}
        </MyTableBody>
      </Table>
    </Virtualizer>
  );
};

export const OnLoadMoreTableStoryVirtualized  = {
  render: OnLoadMoreTableVirtualized,
  name: 'Virtualized Table with async loading'
};

const OnLoadMoreTableVirtualizedResizeWrapper = () => {
  let list = useAsyncList<Character>({
    async load({signal, cursor}) {
      if (cursor) {
        cursor = cursor.replace(/^http:\/\//i, 'https://');
      }

      // Slow down load so progress circle can appear
      await new Promise(resolve => setTimeout(resolve, 4000));
      let res = await fetch(cursor || 'https://swapi.py4e.com/api/people/?search=', {signal});
      let json = await res.json();
      return {
        items: json.results,
        cursor: json.next
      };
    }
  });

  let layout = useMemo(() => {
    return new TableLayout({
      rowHeight: 25,
      headingHeight: 25
    });
  }, []);

  let isLoading = list.loadingState === 'loading' || list.loadingState === 'loadingMore';
  let scrollRef = useRef<HTMLDivElement>(null);
  let memoedLoadMoreProps = useMemo(() => ({
    isLoading: isLoading,
    onLoadMore: list.loadMore,
    items: list.items
  }), [isLoading, list.loadMore, list.items]);
  useLoadMore(memoedLoadMoreProps, scrollRef);

  return (
    <ResizableTableContainer ref={scrollRef} style={{height: 150, width: 400, overflow: 'auto'}}>
      <Virtualizer layout={layout}>
        <Table aria-label="Load more table virtualized">
          <TableHeader style={{background: 'var(--spectrum-gray-100)', width: '100%', height: '100%'}}>
            <Column id="name" isRowHeader>Name</Column>
            <Column id="height">Height</Column>
            <Column id="mass">Mass</Column>
            <Column id="birth_year">Birth Year</Column>
          </TableHeader>
          <MyTableBody
            renderEmptyState={() => renderEmptyLoader({isLoading: list.loadingState === 'loading'})}
            isLoadingMore={list.loadingState === 'loadingMore'}
            rows={list.items}>
            {(item) => (
              <Row id={item.name} style={{width: 'inherit', height: 'inherit'}}>
                <Cell>{item.name}</Cell>
                <Cell>{item.height}</Cell>
                <Cell>{item.mass}</Cell>
                <Cell>{item.birth_year}</Cell>
              </Row>
            )}
          </MyTableBody>
        </Table>
      </Virtualizer>
    </ResizableTableContainer>
  );
};

export const OnLoadMoreTableVirtualizedResizeWrapperStory  = {
  render: OnLoadMoreTableVirtualizedResizeWrapper,
  name: 'Virtualized Table with async loading, resizable table container wrapper'
};
