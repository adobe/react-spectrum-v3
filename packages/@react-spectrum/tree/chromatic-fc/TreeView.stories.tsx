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
import Delete from '@spectrum-icons/workflow/Delete';
import Edit from '@spectrum-icons/workflow/Edit';
import FileTxt from '@spectrum-icons/workflow/FileTxt';
import Folder from '@spectrum-icons/workflow/Folder';
import React from 'react';
import {Text} from '@react-spectrum/text';
import {TreeItemContent, TreeView, TreeViewItem} from '../src';

export default {
  title: 'TreeView'
};

function TestTree(props) {
  return (
    <div style={{width: '300px', height: '800px'}}>
      <TreeView {...props} disabledKeys={['projects-1']} defaultExpandedKeys={['Photos', 'projects', 'projects-1']} aria-label="test static tree">
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
    </div>
  );
}

export const Default = () => (
  <TestTree />
);

export const SelectionMode = () => (
  <TestTree selectionMode="multiple" />
);

export const DisabledBehaviorAll = () => (
  <TestTree disabledBehavior="all" selectionMode="multiple" />
);

export const HiglightSelectionWithDisabledBehaviorAll = () => (
  <TestTree selectionStyle="highlight" selectionMode="multiple" disabledBehavior="all" />
);
