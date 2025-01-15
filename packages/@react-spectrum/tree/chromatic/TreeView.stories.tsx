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

import {ActionGroup, Item} from '@react-spectrum/actiongroup';
import {ActionMenu} from '@react-spectrum/menu';
import Add from '@spectrum-icons/workflow/Add';
import {Content, View} from '@react-spectrum/view';
import Delete from '@spectrum-icons/workflow/Delete';
import Edit from '@spectrum-icons/workflow/Edit';
import FileTxt from '@spectrum-icons/workflow/FileTxt';
import Folder from '@spectrum-icons/workflow/Folder';
import {generatePowerset} from '@react-spectrum/story-utils';
import {Grid, repeat} from '@react-spectrum/layout';
import {Heading, Text} from '@react-spectrum/text';
import {IllustratedMessage} from '@react-spectrum/illustratedmessage';
import {Meta} from '@storybook/react';
import React from 'react';
import {SpectrumTreeViewProps, TreeItemContent, TreeView, TreeViewItem} from '../src';

let states = [
  {selectionMode: ['multiple', 'single']},
  {disabledBehavior: ['none', 'all']},
  {selectionStyle: ['checkbox', 'highlight']}
];

let combinations = generatePowerset(states);
let chunkSize = Math.ceil(combinations.length / 3);
let combo1 = combinations.slice(0, chunkSize);
let combo2 = combinations.slice(chunkSize, chunkSize * 2);
let combo3 = combinations.slice(chunkSize * 2, chunkSize * 3);

function shortName(key, value) {
  let returnVal = '';
  switch (key) {
    case 'selectionMode':
      returnVal = `sm: ${value === undefined ? 'none' : value}`;
      break;
    case 'disabledBehavior':
      returnVal = `disB: ${value}`;
      break;
    case 'selectionStyle':
      returnVal = `secStyle: ${value}`;
      break;
  }
  return returnVal;
}

const meta: Meta<SpectrumTreeViewProps<object>> = {
  title: 'TreeView',
  component: TreeView,
  parameters: {
    chromaticProvider: {colorSchemes: ['light'], locales: ['en-US'], scales: ['medium'], disableAnimations: true},

    chromatic: {delay: 4000}
  }
};

export default meta;

const Template = ({combos}) => (
  <Grid columns={repeat(3, '1fr')} autoFlow="row" gap="size-300">
    {combos.map(c => {
      let key = Object.keys(c).map(k => shortName(k, c[k])).join(' ');
      if (!key) {
        key = 'empty';
      }

      return (
        <View flexGrow={1} maxWidth="size-5000" maxHeight={700}>
          <TreeView {...c} disabledKeys={['projects-1']} defaultExpandedKeys={['Photos', 'projects', 'projects-1']} aria-label="test static tree">
            <TreeViewItem href="https://adobe.com/" id="Photos" textValue="Photos">
              <TreeItemContent>
                <Text>Photos</Text>
                <Folder />
                <ActionGroup>
                  <Item key="edit">
                    <Edit />
                    <Text>Edit</Text>
                  </Item>
                  <Item key="delete">
                    <Delete />
                    <Text>Delete</Text>
                  </Item>
                </ActionGroup>
              </TreeItemContent>
            </TreeViewItem>
            <TreeViewItem id="projects" textValue="Projects">
              <TreeItemContent>
                <Text>Projects</Text>
                <Folder />
                <ActionMenu>
                  <Item key="add">
                    <Add />
                    <Text>Add</Text>
                  </Item>
                  <Item key="delete">
                    <Delete />
                    <Text>Delete</Text>
                  </Item>
                </ActionMenu>
              </TreeItemContent>
              <TreeViewItem id="projects-1" textValue="Projects-1">
                <TreeItemContent>
                  <Text>Projects-1</Text>
                  <Folder />
                  <ActionGroup>
                    <Item key="edit">
                      <Edit />
                      <Text>Edit</Text>
                    </Item>
                    <Item key="delete">
                      <Delete />
                      <Text>Delete</Text>
                    </Item>
                  </ActionGroup>
                </TreeItemContent>
                <TreeViewItem id="projects-1A" textValue="Projects-1A">
                  <TreeItemContent>
                    <Text>Projects-1A</Text>
                    <FileTxt />
                    <ActionMenu>
                      <Item key="add">
                        <Add />
                        <Text>Add</Text>
                      </Item>
                      <Item key="delete">
                        <Delete />
                        <Text>Delete</Text>
                      </Item>
                    </ActionMenu>
                  </TreeItemContent>
                </TreeViewItem>
              </TreeViewItem>
              <TreeViewItem id="projects-2" textValue="Projects-2">
                <TreeItemContent>
                  <Text>Projects-2</Text>
                  <FileTxt />
                  <ActionGroup>
                    <Item key="edit">
                      <Edit />
                      <Text>Edit</Text>
                    </Item>
                    <Item key="delete">
                      <Delete />
                      <Text>Delete</Text>
                    </Item>
                  </ActionGroup>
                </TreeItemContent>
              </TreeViewItem>
              <TreeViewItem id="projects-3" textValue="Projects-3">
                <TreeItemContent>
                  <Text>Projects-3</Text>
                  <FileTxt />
                </TreeItemContent>
              </TreeViewItem>
            </TreeViewItem>
          </TreeView>
        </View>
      );
    })}
  </Grid>
);

function renderEmptyState() {
  return (
    <IllustratedMessage>
      <svg width="150" height="103" viewBox="0 0 150 103">
        <path d="M133.7,8.5h-118c-1.9,0-3.5,1.6-3.5,3.5v27c0,0.8,0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5V23.5h119V92c0,0.3-0.2,0.5-0.5,0.5h-118c-0.3,0-0.5-0.2-0.5-0.5V69c0-0.8-0.7-1.5-1.5-1.5s-1.5,0.7-1.5,1.5v23c0,1.9,1.6,3.5,3.5,3.5h118c1.9,0,3.5-1.6,3.5-3.5V12C137.2,10.1,135.6,8.5,133.7,8.5z M15.2,21.5V12c0-0.3,0.2-0.5,0.5-0.5h118c0.3,0,0.5,0.2,0.5,0.5v9.5H15.2z M32.6,16.5c0,0.6-0.4,1-1,1h-10c-0.6,0-1-0.4-1-1s0.4-1,1-1h10C32.2,15.5,32.6,15.9,32.6,16.5z M13.6,56.1l-8.6,8.5C4.8,65,4.4,65.1,4,65.1c-0.4,0-0.8-0.1-1.1-0.4c-0.6-0.6-0.6-1.5,0-2.1l8.6-8.5l-8.6-8.5c-0.6-0.6-0.6-1.5,0-2.1c0.6-0.6,1.5-0.6,2.1,0l8.6,8.5l8.6-8.5c0.6-0.6,1.5-0.6,2.1,0c0.6,0.6,0.6,1.5,0,2.1L15.8,54l8.6,8.5c0.6,0.6,0.6,1.5,0,2.1c-0.3,0.3-0.7,0.4-1.1,0.4c-0.4,0-0.8-0.1-1.1-0.4L13.6,56.1z" />
      </svg>
      <Heading>No results</Heading>
      <Content>No results found</Content>
    </IllustratedMessage>
  );
}

const EmptyTemplate = () =>
  (
    <TreeView
      aria-label="test empty tree"
      items={[]}
      renderEmptyState={renderEmptyState}>
      {() => (
        <TreeViewItem textValue="dummy value">
          <TreeItemContent>
            <Text>dummy content</Text>
          </TreeItemContent>
        </TreeViewItem>
      )}
    </TreeView>
  );

export const Default = {
  render: Template,
  name: '1 of 3',
  args: {combos: combo1}
};

export const DefaultPt2 = {
  render: Template,
  name: '2 of 3',
  args: {combos: combo2}
};

export const DefaultPt3 = {
  render: Template,
  name: '3 of 3',
  args: {combos: combo3}
};

export const Empty = {
  render: EmptyTemplate,
  name: 'empty tree',
  args: {}
};
