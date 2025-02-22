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

import {Button, Checkbox, CheckboxProps, DropIndicator, GridLayout, GridList, GridListItem, GridListItemProps, ListLayout, Size, Tag, TagGroup, TagList, useDragAndDrop, Virtualizer} from 'react-aria-components';
import {classNames} from '@react-spectrum/utils';
import React from 'react';
import styles from '../example/index.css';
import {useListData} from 'react-stately';

export default {
  title: 'React Aria Components'
};

export const GridListExample = (args) => (
  <GridList
    {...args}
    className={styles.menu}
    aria-label="test gridlist"
    style={{
      width: 300,
      height: 300,
      display: 'grid',
      gridTemplate: args.layout === 'grid' ? 'repeat(3, 1fr) / repeat(3, 1fr)' : 'auto / 1fr',
      gridAutoFlow: 'row'
    }}>
    <MyGridListItem>1,1 <Button>Actions</Button></MyGridListItem>
    <MyGridListItem>1,2 <Button>Actions</Button></MyGridListItem>
    <MyGridListItem>1,3 <Button>Actions</Button></MyGridListItem>
    <MyGridListItem>2,1 <Button>Actions</Button></MyGridListItem>
    <MyGridListItem>2,2 <Button>Actions</Button></MyGridListItem>
    <MyGridListItem>2,3 <Button>Actions</Button></MyGridListItem>
    <MyGridListItem>3,1 <Button>Actions</Button></MyGridListItem>
    <MyGridListItem>3,2 <Button>Actions</Button></MyGridListItem>
    <MyGridListItem>3,3 <Button>Actions</Button></MyGridListItem>
  </GridList>
);

const MyGridListItem = (props: GridListItemProps) => {
  return (
    <GridListItem
      {...props}
      style={{display: 'flex', alignItems: 'center', gap: 8}}
      className={({isFocused, isSelected, isHovered}) => classNames(styles, 'item', {
        focused: isFocused,
        selected: isSelected,
        hovered: isHovered
      })}>
      {({selectionMode, allowsDragging}) => (<>
        {allowsDragging && <Button slot="drag">≡</Button>}
        {selectionMode !== 'none' ? <MyCheckbox slot="selection" /> : null}
        {props.children as any}
      </>)}
    </GridListItem>
  );
};

GridListExample.story = {
  args: {
    layout: 'stack'
  },
  argTypes: {
    layout: {
      control: 'radio',
      options: ['stack', 'grid']
    },
    keyboardNavigationBehavior: {
      control: 'radio',
      options: ['arrow', 'tab']
    },
    selectionMode: {
      control: 'radio',
      options: ['none', 'single', 'multiple']
    },
    selectionBehavior: {
      control: 'radio',
      options: ['toggle', 'replace']
    }
  }
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

export function VirtualizedGridList() {
  let items: {id: number, name: string}[] = [];
  for (let i = 0; i < 10000; i++) {
    items.push({id: i, name: `Item ${i}`});
  }

  let list = useListData({
    initialItems: items
  });

  let {dragAndDropHooks} = useDragAndDrop({
    getItems: (keys) => {
      return [...keys].map(key => ({'text/plain': list.getItem(key)?.name ?? ''}));
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
    <Virtualizer
      layout={ListLayout}
      layoutOptions={{
        rowHeight: 25
      }}>
      <GridList
        className={styles.menu}
        selectionMode="multiple"
        dragAndDropHooks={dragAndDropHooks}
        style={{height: 400}}
        aria-label="virtualized listbox"
        items={list.items}>
        {item => <MyGridListItem>{item.name}</MyGridListItem>}
      </GridList>
    </Virtualizer>
  );
}

export function VirtualizedGridListGrid() {
  let items: {id: number, name: string}[] = [];
  for (let i = 0; i < 10000; i++) {
    items.push({id: i, name: `Item ${i}`});
  }

  return (
    <Virtualizer 
      layout={GridLayout}
      layoutOptions={{
        minItemSize: new Size(40, 40)
      }}>
      <GridList className={styles.menu} layout="grid" style={{height: 400, width: 400}} aria-label="virtualized listbox" items={items}>
        {item => <MyGridListItem>{item.name}</MyGridListItem>}
      </GridList>
    </Virtualizer>
  );
}

export function TagGroupInsideGridList() {
  return (
    <GridList
      className={styles.menu}
      aria-label="Grid list with tag group"
      keyboardNavigationBehavior="tab"
      style={{
        width: 300,
        height: 300
      }}>
      <MyGridListItem textValue="Tags">
        1,1
        <TagGroup aria-label="Tag group">
          <TagList style={{display: 'flex', gap: 10}}>
            <Tag key="1">Tag 1</Tag>
            <Tag key="2">Tag 2</Tag>
            <Tag key="3">Tag 3</Tag>
          </TagList>
        </TagGroup>
      </MyGridListItem>
      <MyGridListItem>
        1,2 <Button>Actions</Button>
      </MyGridListItem>
      <MyGridListItem>
        1,3         
        <TagGroup aria-label="Tag group">
          <TagList style={{display: 'flex', gap: 10}}>
            <Tag key="1">Tag 1</Tag>
            <Tag key="2">Tag 2</Tag>
            <Tag key="3">Tag 3</Tag>
          </TagList>
        </TagGroup>
      </MyGridListItem>
    </GridList>
  );
}

export function GridListScrollIntoView() {
  let items: {id: number, name: string}[] = [];
  for (let i = 0; i < 100; i++) {
    items.push({id: i, name: `Item ${i}`});
  }

  let list = useListData({
    initialItems: items
  });

  const getElement = (id: number) => document.querySelector(`[data-key="${id}"]`) as HTMLElement;

  const rowHeight = 25;

  return (
    <>
      <div style={{height: 500, overflow: 'auto'}}>
        <GridList
          className={styles.menu}
          selectionMode="multiple"
          aria-label="virtualized listbox"
          items={list.items}
          style={{
            position: 'relative',
            overflow: 'hidden',
            width: 100,
            height: list.items.length * rowHeight
          }}>
          {item => (
            <GridListItem
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                overflow: 'visible',
                transform: `translateY(${item.id * rowHeight}px)`
              }}>
              {item.name}
            </GridListItem>)}
        </GridList>
      </div>
      <button onClick={() => getElement(40)?.scrollIntoView({block: 'start'})}>Scroll to item 40</button>
      <button
        tabIndex={0}
        onKeyDown={() => {
          getElement(70)?.focus();
        }}>
        Click, press ESC key focus item 70
      </button>
    </>
  );
}
