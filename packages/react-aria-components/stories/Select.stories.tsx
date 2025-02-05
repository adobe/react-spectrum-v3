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

import {Button, Label, ListBox, ListLayout, OverlayArrow, Popover, Select, SelectValue, Virtualizer} from 'react-aria-components';
import {MyListBoxItem} from './utils';
import React from 'react';
import styles from '../example/index.css';

export default {
  title: 'React Aria Components'
};

export const SelectExample = () => (
  <Select data-testid="select-example" id="select-example-id">
    <Label style={{display: 'block'}}>Test</Label>
    <Button>
      <SelectValue />
      <span aria-hidden="true" style={{paddingLeft: 5}}>▼</span>
    </Button>
    <Popover>
      <OverlayArrow>
        <svg width={12} height={12}><path d="M0 0,L6 6,L12 0" /></svg>
      </OverlayArrow>
      <ListBox className={styles.menu}>
        <MyListBoxItem>Foo</MyListBoxItem>
        <MyListBoxItem>Bar</MyListBoxItem>
        <MyListBoxItem>Baz</MyListBoxItem>
        <MyListBoxItem href="http://google.com">Google</MyListBoxItem>
      </ListBox>
    </Popover>
  </Select>
);

export const SelectRenderProps = () => (
  <Select data-testid="select-render-props">
    {({isOpen}) => (
      <>
        <Label style={{display: 'block'}}>Test</Label>
        <Button>
          <SelectValue />
          <span aria-hidden="true" style={{paddingLeft: 5}}>{isOpen ? '▲' : '▼'}</span>
        </Button>
        <Popover>
          <ListBox className={styles.menu}>
            <MyListBoxItem>Foo</MyListBoxItem>
            <MyListBoxItem>Bar</MyListBoxItem>
            <MyListBoxItem>Baz</MyListBoxItem>
            <MyListBoxItem href="http://google.com">Google</MyListBoxItem>
          </ListBox>
        </Popover>
      </>
    )}
  </Select>
);

let manyItems = [...Array(100)].map((_, i) => ({id: i, name: `Item ${i}`}));

export const SelectManyItems = () => (
  <Select>
    <Label style={{display: 'block'}}>Test</Label>
    <Button>
      <SelectValue />
      <span aria-hidden="true" style={{paddingLeft: 5}}>▼</span>
    </Button>
    <Popover>
      <OverlayArrow>
        <svg width={12} height={12}><path d="M0 0,L6 6,L12 0" /></svg>
      </OverlayArrow>
      <ListBox items={manyItems} className={styles.menu}>
        {item => <MyListBoxItem>{item.name}</MyListBoxItem>}
      </ListBox>
    </Popover>
  </Select>
);

export const VirtualizedSelect = () => (
  <Select>
    <Label style={{display: 'block'}}>Test</Label>
    <Button>
      <SelectValue />
      <span aria-hidden="true" style={{paddingLeft: 5}}>▼</span>
    </Button>
    <Popover>
      <OverlayArrow>
        <svg width={12} height={12}><path d="M0 0,L6 6,L12 0" /></svg>
      </OverlayArrow>
      <Virtualizer layout={new ListLayout({rowHeight: 25})}>
        <ListBox items={manyItems} className={styles.menu}>
          {item => <MyListBoxItem>{item.name}</MyListBoxItem>}
        </ListBox>
      </Virtualizer>
    </Popover>
  </Select>
);
