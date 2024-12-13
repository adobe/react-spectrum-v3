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

import {act, fireEvent, mockClickDefault, pointerMap, renderv3 as renderComponent, within} from '@react-spectrum/test-utils-internal';
import {ActionGroup, Item} from '@react-spectrum/actiongroup';
import {Content} from '@react-spectrum/view';
import Delete from '@spectrum-icons/workflow/Delete';
import Edit from '@spectrum-icons/workflow/Edit';
import Folder from '@spectrum-icons/workflow/Folder';
import {Heading, Text} from '@react-spectrum/text';
import {IllustratedMessage} from '@react-spectrum/illustratedmessage';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import {TreeView, TreeViewItem} from '../';
import userEvent from '@testing-library/user-event';

let onSelectionChange = jest.fn();
let onAction = jest.fn();
let onExpandedChange = jest.fn();

let StaticTree = ({treeProps = {}, rowProps = {}}) => (
  <TreeView defaultExpandedKeys={new Set(['Projects', 'Projects-1'])} aria-label="test tree" onExpandedChange={onExpandedChange} onSelectionChange={onSelectionChange} {...treeProps}>
    <TreeViewItem id="Photos" textValue="Photos" {...rowProps}>
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
    </TreeViewItem>
    <TreeViewItem id="Projects" textValue="Projects" {...rowProps}>
      <Text>Projects</Text>
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
      <TreeViewItem id="Projects-1" textValue="Projects-1" {...rowProps}>
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
        <TreeViewItem id="Projects-1A" textValue="Projects-1A" {...rowProps}>
          <Text>Projects-1A</Text>
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
        </TreeViewItem>
      </TreeViewItem>
      <TreeViewItem id="Projects-2" textValue="Projects-2" {...rowProps}>
        <Text>Projects-2</Text>
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
      </TreeViewItem>
      <TreeViewItem id="Projects-3" textValue="Projects-3" {...rowProps}>
        <Text>Projects-3</Text>
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
      </TreeViewItem>
    </TreeViewItem>
  </TreeView>
);

let rows = [
  {id: 'Projects', name: 'Projects', childItems: [
    {id: 'Project-1', name: 'Project 1'},
    {id: 'Project-2', name: 'Project 2', childItems: [
      {id: 'Project-2A', name: 'Project 2A'},
      {id: 'Project-2B', name: 'Project 2B'},
      {id: 'Project-2C', name: 'Project 2C'}
    ]},
    {id: 'Project-3', name: 'Project 3'},
    {id: 'Project-4', name: 'Project 4'},
    {id: 'Project-5', name: 'Project 5', childItems: [
      {id: 'Project-5A', name: 'Project 5A'},
      {id: 'Project-5B', name: 'Project 5B'},
      {id: 'Project-5C', name: 'Project 5C'}
    ]}
  ]},
  {id: 'Reports', name: 'Reports', childItems: [
    {id: 'Reports-1', name: 'Reports 1', childItems: [
      {id: 'Reports-1A', name: 'Reports 1A', childItems: [
        {id: 'Reports-1AB', name: 'Reports 1AB', childItems: [
          {id: 'Reports-1ABC', name: 'Reports 1ABC'}
        ]}
      ]},
      {id: 'Reports-1B', name: 'Reports 1B'},
      {id: 'Reports-1C', name: 'Reports 1C'}
    ]},
    {id: 'Reports-2', name: 'Reports 2'}
  ]}
];

let DynamicTree = ({treeProps = {}, rowProps = {}}) => (
  <TreeView defaultExpandedKeys={new Set(['Projects', 'Project-2', 'Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB'])} aria-label="test dynamic tree" items={rows} onExpandedChange={onExpandedChange} onSelectionChange={onSelectionChange} {...treeProps}>
    {(item: any) => (
      <TreeViewItem childItems={item.childItems} textValue={item.name} {...rowProps}>
        <Text>{item.name}</Text>
        {item.icon}
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
      </TreeViewItem>
    )}
  </TreeView>
);

describe('Tree', () => {
  let user;

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    act(() => {jest.runAllTimers();});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  let render = (children) => {
    let tree = renderComponent(
      <Provider theme={theme} scale="medium">
        {children}
      </Provider>
    );
    return tree;
  };

  let rerender = (tree, children) => {
    let newTree = tree.rerender(
      <Provider theme={theme} scale="medium">
        {children}
      </Provider>
    );
    return newTree;
  };

  it('should support DOM props', () => {
    let {getByRole, getAllByRole} = render(<StaticTree treeProps={{'data-testid': 'test-tree'}} rowProps={{'data-testid': 'test-row'}} />);
    let tree = getByRole('treegrid');
    expect(tree).toHaveAttribute('data-testid', 'test-tree');

    for (let row of getAllByRole('row')) {
      expect(row).toHaveAttribute('data-testid', 'test-row');
    }
  });

  it('should have the base set of aria and data attributes', () => {
    let {getByRole, getAllByRole} = render(<StaticTree treeProps={{defaultExpandedKeys: 'none'}} />);
    let tree = getByRole('treegrid');
    expect(tree).toHaveAttribute('data-rac');
    expect(tree).toHaveAttribute('aria-label', 'test tree');
    expect(tree).not.toHaveAttribute('data-empty');
    expect(tree).not.toHaveAttribute('data-focused');
    expect(tree).not.toHaveAttribute('data-focus-visible');

    for (let row of getAllByRole('row')) {
      expect(row).toHaveAttribute('aria-level');
      expect(row).toHaveAttribute('data-level');
      expect(row).toHaveAttribute('aria-posinset');
      expect(row).toHaveAttribute('aria-setsize');
      expect(row).toHaveAttribute('data-rac');
      expect(row).not.toHaveAttribute('data-selected');
      expect(row).not.toHaveAttribute('data-disabled');
      expect(row).not.toHaveAttribute('data-hovered');
      expect(row).not.toHaveAttribute('data-focused');
      expect(row).not.toHaveAttribute('data-focus-visible');
      expect(row).not.toHaveAttribute('data-pressed');
      expect(row).not.toHaveAttribute('data-selection-mode');
    }
  });

  it('should have the expected attributes on the rows', () => {
    let {getAllByRole} = render(<StaticTree />);

    let rows = getAllByRole('row');
    let rowNoChild = rows[0];
    expect(rowNoChild).toHaveAttribute('aria-label', 'Photos');
    expect(rowNoChild).not.toHaveAttribute('aria-expanded');
    expect(rowNoChild).not.toHaveAttribute('data-expanded');
    expect(rowNoChild).toHaveAttribute('aria-level', '1');
    expect(rowNoChild).toHaveAttribute('data-level', '1');
    expect(rowNoChild).toHaveAttribute('aria-posinset', '1');
    expect(rowNoChild).toHaveAttribute('aria-setsize', '2');
    expect(rowNoChild).not.toHaveAttribute('data-has-child-rows');
    expect(rowNoChild).toHaveAttribute('data-rac');

    let rowWithChildren = rows[1];
    // Row has action since it is expandable but not selectable.
    expect(rowWithChildren).toHaveAttribute('aria-label', 'Projects');
    expect(rowWithChildren).toHaveAttribute('aria-expanded', 'true');
    expect(rowWithChildren).toHaveAttribute('data-expanded', 'true');
    expect(rowWithChildren).toHaveAttribute('aria-level', '1');
    expect(rowWithChildren).toHaveAttribute('data-level', '1');
    expect(rowWithChildren).toHaveAttribute('aria-posinset', '2');
    expect(rowWithChildren).toHaveAttribute('aria-setsize', '2');
    expect(rowWithChildren).toHaveAttribute('data-has-child-rows', 'true');
    expect(rowWithChildren).toHaveAttribute('data-rac');

    let level2ChildRow = rows[2];
    expect(level2ChildRow).toHaveAttribute('aria-label', 'Projects-1');
    expect(level2ChildRow).toHaveAttribute('aria-expanded', 'true');
    expect(level2ChildRow).toHaveAttribute('data-expanded', 'true');
    expect(level2ChildRow).toHaveAttribute('aria-level', '2');
    expect(level2ChildRow).toHaveAttribute('data-level', '2');
    expect(level2ChildRow).toHaveAttribute('aria-posinset', '1');
    expect(level2ChildRow).toHaveAttribute('aria-setsize', '3');
    expect(level2ChildRow).toHaveAttribute('data-has-child-rows', 'true');
    expect(level2ChildRow).toHaveAttribute('data-rac');

    let level3ChildRow = rows[3];
    expect(level3ChildRow).toHaveAttribute('aria-label', 'Projects-1A');
    expect(level3ChildRow).not.toHaveAttribute('aria-expanded');
    expect(level3ChildRow).not.toHaveAttribute('data-expanded');
    expect(level3ChildRow).toHaveAttribute('aria-level', '3');
    expect(level3ChildRow).toHaveAttribute('data-level', '3');
    expect(level3ChildRow).toHaveAttribute('aria-posinset', '1');
    expect(level3ChildRow).toHaveAttribute('aria-setsize', '1');
    expect(level3ChildRow).not.toHaveAttribute('data-has-child-rows');
    expect(level3ChildRow).toHaveAttribute('data-rac');

    let level2ChildRow2 = rows[4];
    expect(level2ChildRow2).toHaveAttribute('aria-label', 'Projects-2');
    expect(level2ChildRow2).not.toHaveAttribute('aria-expanded');
    expect(level2ChildRow2).not.toHaveAttribute('data-expanded');
    expect(level2ChildRow2).toHaveAttribute('aria-level', '2');
    expect(level2ChildRow2).toHaveAttribute('data-level', '2');
    expect(level2ChildRow2).toHaveAttribute('aria-posinset', '2');
    expect(level2ChildRow2).toHaveAttribute('aria-setsize', '3');
    expect(level2ChildRow2).not.toHaveAttribute('data-has-child-rows');
    expect(level2ChildRow2).toHaveAttribute('data-rac');

    let level2ChildRow3 = rows[5];
    expect(level2ChildRow3).toHaveAttribute('aria-label', 'Projects-3');
    expect(level2ChildRow3).not.toHaveAttribute('aria-expanded');
    expect(level2ChildRow3).not.toHaveAttribute('data-expanded');
    expect(level2ChildRow3).toHaveAttribute('aria-level', '2');
    expect(level2ChildRow3).toHaveAttribute('data-level', '2');
    expect(level2ChildRow3).toHaveAttribute('aria-posinset', '3');
    expect(level2ChildRow3).toHaveAttribute('aria-setsize', '3');
    expect(level2ChildRow3).not.toHaveAttribute('data-has-child-rows');
    expect(level2ChildRow3).toHaveAttribute('data-rac');
  });

  it('should not label an expandable row as having an action if it supports selection', () => {
    let {getAllByRole} = render(<StaticTree treeProps={{selectionMode: 'single'}} />);

    let rows = getAllByRole('row');
    expect(rows[1]).toHaveAttribute('aria-label', 'Projects');
    expect(rows[1]).toHaveAttribute('data-has-child-rows', 'true');
    expect(rows[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('should support dynamic trees', () => {
    let {getAllByRole} = render(<DynamicTree />);
    let rows = getAllByRole('row');
    expect(rows).toHaveLength(20);

    // Check the rough structure to make sure dynamic rows are rendering as expected (just checks the expandable rows and their attributes)
    expect(rows[0]).toHaveAttribute('aria-label', 'Projects');
    expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
    expect(rows[0]).toHaveAttribute('aria-level', '1');
    expect(rows[0]).toHaveAttribute('aria-posinset', '1');
    expect(rows[0]).toHaveAttribute('aria-setsize', '2');
    expect(rows[0]).toHaveAttribute('data-has-child-rows', 'true');

    expect(rows[2]).toHaveAttribute('aria-label', 'Project 2');
    expect(rows[2]).toHaveAttribute('aria-expanded', 'true');
    expect(rows[2]).toHaveAttribute('aria-level', '2');
    expect(rows[2]).toHaveAttribute('aria-posinset', '2');
    expect(rows[2]).toHaveAttribute('aria-setsize', '5');
    expect(rows[2]).toHaveAttribute('data-has-child-rows', 'true');

    expect(rows[8]).toHaveAttribute('aria-label', 'Project 5');
    expect(rows[8]).toHaveAttribute('aria-expanded', 'true');
    expect(rows[8]).toHaveAttribute('aria-level', '2');
    expect(rows[8]).toHaveAttribute('aria-posinset', '5');
    expect(rows[8]).toHaveAttribute('aria-setsize', '5');
    expect(rows[8]).toHaveAttribute('data-has-child-rows', 'true');

    expect(rows[12]).toHaveAttribute('aria-label', 'Reports');
    expect(rows[12]).toHaveAttribute('aria-expanded', 'true');
    expect(rows[12]).toHaveAttribute('aria-level', '1');
    expect(rows[12]).toHaveAttribute('aria-posinset', '2');
    expect(rows[12]).toHaveAttribute('aria-setsize', '2');
    expect(rows[12]).toHaveAttribute('data-has-child-rows', 'true');

    expect(rows[16]).toHaveAttribute('aria-label', 'Reports 1ABC');
    expect(rows[16]).toHaveAttribute('aria-level', '5');
    expect(rows[16]).toHaveAttribute('aria-posinset', '1');
    expect(rows[16]).toHaveAttribute('aria-setsize', '1');
  });

  it('should render checkboxes for selection', async () => {
    let {getByRole, getAllByRole} = render(<StaticTree treeProps={{selectionMode: 'single'}} rowProps={{href: 'https://google.com'}} />);
    let tree = getByRole('treegrid');
    expect(tree).not.toHaveAttribute('aria-multiselectable');

    for (let row of getAllByRole('row')) {
      let checkbox = within(row).getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
      expect(checkbox).toHaveAttribute('aria-label', 'Select');
      expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${row.id}`);
      expect(row).toHaveAttribute('aria-selected', 'false');
      expect(row).not.toHaveAttribute('data-selected');
      expect(row).toHaveAttribute('data-selection-mode', 'single');
    }

    let row = getAllByRole('row')[2];
    let checkbox = within(row).getByRole('checkbox');
    await user.click(checkbox);
    expect(row).toHaveAttribute('aria-selected', 'true');
    expect(row).toHaveAttribute('data-selected', 'true');
    expect(checkbox).toBeChecked();
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(['Projects-1']));
  });

  it('should not render checkboxes for selection with selectionStyle=highlight', async () => {
    let {getByRole, getAllByRole} = render(<StaticTree treeProps={{selectionMode: 'multiple', selectionStyle: 'highlight'}} />);
    let tree = getByRole('treegrid');
    expect(tree).toHaveAttribute('aria-multiselectable', 'true');

    for (let row of getAllByRole('row')) {
      let checkbox = within(row).queryByRole('checkbox');
      expect(checkbox).toBeNull();
      expect(row).toHaveAttribute('aria-selected', 'false');
      expect(row).not.toHaveAttribute('data-selected');
      expect(row).toHaveAttribute('data-selection-mode', 'multiple');
    }

    let row2 = getAllByRole('row')[2];
    await user.click(row2);
    expect(row2).toHaveAttribute('aria-selected', 'true');
    expect(row2).toHaveAttribute('data-selected', 'true');
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(['Projects-1']));

    let row1 = getAllByRole('row')[1];
    await user.click(row1);
    expect(row1).toHaveAttribute('aria-selected', 'true');
    expect(row1).toHaveAttribute('data-selected', 'true');
    expect(row2).toHaveAttribute('aria-selected', 'false');
    expect(row2).not.toHaveAttribute('data-selected');
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(new Set(onSelectionChange.mock.calls[1][0])).toEqual(new Set(['Projects']));
  });

  it('should render a chevron for an expandable row marked with hasChildRows', () => {
    let {getAllByRole} = render(
      <TreeView aria-label="test tree">
        <TreeViewItem textValue="Test" hasChildItems>
          <Text>Test</Text>
        </TreeViewItem>
      </TreeView>
    );
    let rows = getAllByRole('row');
    let chevron = within(rows[0]).getAllByRole('button')[0];
    expect(rows).toHaveLength(1);

    expect(rows[0]).toHaveAttribute('aria-label', 'Test');
    // Until the row gets children, don't mark it with the aria/data attributes.
    expect(rows[0]).not.toHaveAttribute('aria-expanded');
    expect(rows[0]).not.toHaveAttribute('data-has-child-rows');
    expect(chevron).toBeTruthy();
  });

  it('should apply a user aria-label to the tree row if provided', () => {
    let {getAllByRole} = render(
      <TreeView aria-label="test tree">
        <TreeViewItem textValue="Test" aria-label="test row">
          <Text>Test</Text>
        </TreeViewItem>
      </TreeView>
    );
    let rows = getAllByRole('row');
    expect(rows).toHaveLength(1);

    expect(rows[0]).toHaveAttribute('aria-label', 'Test');
  });

  describe('general interactions', () => {
    it('should support hover on rows', async () => {
      let tree = render(<StaticTree treeProps={{selectionMode: 'multiple'}} />);

      let row = tree.getAllByRole('row')[0];
      expect(row).not.toHaveAttribute('data-hovered');

      await user.hover(row);
      expect(row).toHaveAttribute('data-hovered', 'true');

      await user.unhover(row);
      expect(row).not.toHaveAttribute('data-hovered');

      rerender(tree, <StaticTree treeProps={{selectionMode: 'none', onAction: jest.fn()}} />);
      row = tree.getAllByRole('row')[0];
      expect(row).not.toHaveAttribute('data-hovered');

      await user.hover(row);
      expect(row).toHaveAttribute('data-hovered', 'true');

      await user.unhover(row);
      expect(row).not.toHaveAttribute('data-hovered');
    });

    it('should not update the hover state if the row is not interactive', async () => {
      let tree = render(<StaticTree treeProps={{selectionMode: 'none'}} />);

      let row = tree.getAllByRole('row')[0];
      expect(row).not.toHaveAttribute('data-hovered');

      await user.hover(row);
      expect(row).not.toHaveAttribute('data-hovered');

      let expandableRow = tree.getAllByRole('row')[1];
      expect(expandableRow).not.toHaveAttribute('data-hovered');

      await user.hover(expandableRow);
      expect(expandableRow).toHaveAttribute('data-hovered', 'true');

      await user.unhover(expandableRow);
      expect(expandableRow).not.toHaveAttribute('data-hovered');

      // Test a completely inert expandable row
      // Note the disabledBehavior setting here, by default we make disableKey keys NOT restrict expandablity of the row. Similar pattern to Table
      rerender(tree, <StaticTree treeProps={{selectionMode: 'none', disabledBehavior: 'all', disabledKeys: ['Projects']}} />);

      expandableRow = tree.getAllByRole('row')[1];
      expect(expandableRow).toHaveAttribute('data-disabled', 'true');
      expect(expandableRow).not.toHaveAttribute('data-hovered');

      await user.hover(expandableRow);
      expect(expandableRow).not.toHaveAttribute('data-hovered');
    });

    it('should support press on rows', async () => {
      let tree = render(<StaticTree treeProps={{selectionMode: 'multiple'}} />);

      let row = tree.getAllByRole('row')[0];
      expect(row).not.toHaveAttribute('data-pressed');

      fireEvent.mouseDown(row);
      expect(row).toHaveAttribute('data-pressed', 'true');

      fireEvent.mouseUp(row);
      expect(row).not.toHaveAttribute('data-pressed');

      rerender(tree, <StaticTree treeProps={{selectionMode: 'none', onAction: jest.fn()}} />);
      row = tree.getAllByRole('row')[0];
      expect(row).not.toHaveAttribute('data-pressed');

      fireEvent.mouseDown(row);
      expect(row).toHaveAttribute('data-pressed', 'true');

      fireEvent.mouseUp(row);
      expect(row).not.toHaveAttribute('data-pressed');
    });

    it('should not update the press state if the row is not interactive', () => {
      let tree = render(<StaticTree treeProps={{selectionMode: 'none'}} />);

      let row = tree.getAllByRole('row')[0];
      expect(row).not.toHaveAttribute('data-pressed');

      fireEvent.mouseDown(row);
      expect(row).not.toHaveAttribute('data-pressed');
      fireEvent.mouseUp(row);

      let expandableRow = tree.getAllByRole('row')[1];
      expect(expandableRow).not.toHaveAttribute('data-pressed');

      fireEvent.mouseDown(expandableRow);
      expect(expandableRow).toHaveAttribute('data-pressed', 'true');

      fireEvent.mouseUp(expandableRow);
      expect(expandableRow).not.toHaveAttribute('data-pressed');

      // Test a completely inert expandable row
      rerender(tree, <StaticTree treeProps={{selectionMode: 'none', disabledBehavior: 'all',  disabledKeys: ['Projects']}} />);
      expandableRow = tree.getAllByRole('row')[1];
      expect(expandableRow).toHaveAttribute('data-disabled', 'true');
      expect(expandableRow).not.toHaveAttribute('data-pressed');

      fireEvent.mouseDown(expandableRow);
      expect(expandableRow).not.toHaveAttribute('data-pressed');
      fireEvent.mouseUp(expandableRow);
    });

    it('should support focus', async () => {
      let tree = render(<StaticTree treeProps={{selectionMode: 'multiple', disabledKeys: ['Projects']}} />);

      let row = tree.getAllByRole('row')[0];
      expect(row).not.toHaveAttribute('data-focused');

      await user.click(row);
      expect(row).toHaveAttribute('data-focused');

      rerender(tree, <StaticTree treeProps={{selectionMode: 'multiple', disabledKeys: ['Projects']}} />);
      row = tree.getAllByRole('row')[0];
      expect(row).not.toHaveAttribute('data-focus-visible');

      await user.click(row);
      expect(row).not.toHaveAttribute('data-focus-visible');

      await user.keyboard('{Enter}');
      expect(row).toHaveAttribute('data-focus-visible', 'true');

      let disabledRow = tree.getAllByRole('row')[1];
      expect(disabledRow).not.toHaveAttribute('data-disabled', 'true');
      expect(disabledRow).not.toHaveAttribute('data-focus-visible');

      await user.keyboard('{ArrowDown}');
      disabledRow = tree.getAllByRole('row')[1];
      // Note that the row is able to be focused because default disabledBehavior is 'selection'
      expect(disabledRow).toHaveAttribute('data-focus-visible', 'true');
      expect(row).not.toHaveAttribute('data-focus-visible');
    });

    it('should support actions on rows', async () => {
      let {getAllByRole} = render(<StaticTree treeProps={{selectionMode: 'multiple', disabledBehavior: 'all', onAction, disabledKeys: ['Projects']}}  />);

      let row = getAllByRole('row')[0];
      await user.click(row);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenLastCalledWith('Photos');
      expect(onSelectionChange).toHaveBeenCalledTimes(0);

      // Due to disabledBehavior being set to 'all' this expandable row has its action disabled
      let disabledRow = getAllByRole('row')[1];
      expect(disabledRow).toHaveAttribute('data-disabled', 'true');
      await user.click(disabledRow);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledTimes(0);

      let expandableRow = getAllByRole('row')[2];
      await user.click(expandableRow);
      expect(onAction).toHaveBeenCalledTimes(2);
      expect(onAction).toHaveBeenLastCalledWith('Projects-1');
      expect(onSelectionChange).toHaveBeenCalledTimes(0);

      await user.keyboard('{Enter}');
      expect(onAction).toHaveBeenCalledTimes(3);
      expect(onAction).toHaveBeenLastCalledWith('Projects-1');
      expect(onSelectionChange).toHaveBeenCalledTimes(0);
    });

    it('should support onScroll', () => {
      let onScroll = jest.fn();
      let {getByRole} = render(<StaticTree treeProps={{onScroll}} />);
      let tree = getByRole('treegrid');
      fireEvent.scroll(tree);
      expect(onScroll).toHaveBeenCalled();
    });

    describe('links', function () {
      describe.each(['mouse', 'keyboard'])('%s', (type) => {
        let trigger = async (item, key = 'Enter') => {
          if (type === 'mouse') {
            await user.click(item);
          } else {
            await user.keyboard(`{${key}}`);
          }
        };

        it('should support links with selectionMode="none"', async () => {
          let {getAllByRole} = render(<StaticTree treeProps={{selectionMode: 'none'}} rowProps={{href: 'https://google.com/'}} />);
          let items = getAllByRole('row');
          for (let item of items) {
            expect(item.tagName).not.toBe('A');
            expect(item).toHaveAttribute('data-href');
          }

          if (type === 'keyboard') {
            await user.tab();
          }

          let onClick = mockClickDefault();
          await trigger(items[0]);
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
          expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');
        });

        it.each(['single', 'multiple'])('should support links with selectionStyle="checkbox" selectionMode="%s"', async (selectionMode) => {
          let {getAllByRole} = render(<StaticTree treeProps={{selectionMode}} rowProps={{href: 'https://google.com/'}} />);
          let items = getAllByRole('row');
          for (let item of items) {
            expect(item.tagName).not.toBe('A');
            expect(item).toHaveAttribute('data-href');
          }

          if (type === 'keyboard') {
            await user.tab();
          }

          let onClick = mockClickDefault();
          await trigger(items[0]);
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
          expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');

          await user.click(within(items[0]).getByRole('checkbox'));
          expect(items[0]).toHaveAttribute('aria-selected', 'true');

          if (type === 'keyboard') {
            await user.keyboard('{ArrowLeft}');
            await user.keyboard('{ArrowDown}');
          }
          await trigger(items[1], ' ');
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(items[1]).toHaveAttribute('aria-selected', 'true');
        });

        it.each(['single', 'multiple'])('should support links with selectionStyle="highlight" selectionMode="%s"', async (selectionMode) => {
          let {getAllByRole} = render(<StaticTree treeProps={{selectionMode, selectionStyle: 'highlight'}} rowProps={{href: 'https://google.com/'}} />);

          let items = getAllByRole('row');
          for (let item of items) {
            expect(item.tagName).not.toBe('A');
            expect(item).toHaveAttribute('data-href');
          }

          let onClick = mockClickDefault();
          if (type === 'mouse') {
            await user.click(items[0]);
          } else {
            await user.tab();
            await user.keyboard('{Space}');
          }
          expect(onClick).not.toHaveBeenCalled();
          expect(items[0]).toHaveAttribute('aria-selected', 'true');

          if (type === 'mouse') {
            await user.dblClick(items[0], {pointerType: 'mouse'});
          } else {
            await user.keyboard('{Enter}');
          }
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
          expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');
        });
      });
    });

    describe('keyboard interactions', () => {
      it('left and right arrows should navigate between interactive elements in the row', async () => {
        let {getAllByRole} = render(<DynamicTree treeProps={{selectionMode: 'multiple'}} />);
        let expandableRow = getAllByRole('row')[0];
        let buttons = within(expandableRow).getAllByRole('button');
        let checkbox = within(expandableRow).getByRole('checkbox');

        await user.tab();
        expect(expandableRow).toHaveAttribute('aria-expanded', 'true');
        expect(document.activeElement).toBe(expandableRow);
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(checkbox);
        await user.keyboard('{ArrowRight}');
        // Skips the chevron button
        expect(document.activeElement).toBe(buttons[1]);
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(buttons[2]);
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(expandableRow);

        // Test that if focus is on the row that right/left will expand/collapse if it isn't already
        await user.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(expandableRow);
        expect(expandableRow).toHaveAttribute('aria-expanded', 'false');

        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(expandableRow);
        expect(expandableRow).toHaveAttribute('aria-expanded', 'true');

        // Resume testing navigation to interacive elements
        await user.keyboard('{ArrowLeft}');
        await user.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(buttons[2]);
        await user.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(buttons[1]);
        await user.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(checkbox);
      });

      it('should support type ahead', async () => {
        let {getAllByRole, queryByText} = render(<DynamicTree />);
        await user.tab();
        let rows = getAllByRole('row');
        expect(document.activeElement).toBe(rows[0]);
        await user.keyboard('Reports 1ABC');
        expect(document.activeElement).toBe(rows[16]);

        act(() => {jest.runAllTimers();});
        await user.keyboard('Pro');
        expect(document.activeElement).toBe(rows[0]);

        // Test typeahead doesn't match against hidden rows
        await user.click(rows[12]);
        expect(queryByText('Reports 1ABC')).toBeFalsy();
        await user.keyboard('Reports 1ABC');
        expect(document.activeElement).toBe(rows[12]);
        expect(rows[12]).toHaveAttribute('aria-label', 'Reports');
      });

      it('should navigate between visible rows when using Arrow Up/Down', async () => {
        let {getAllByRole} = render(<DynamicTree />);
        await user.tab();
        let rows = getAllByRole('row');
        expect(rows).toHaveLength(20);
        expect(document.activeElement).toBe(rows[0]);
        await user.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(rows[1]);
        expect(rows[1]).toHaveAttribute('aria-label', 'Project 1');
        await user.keyboard('{ArrowUp}');

        // Collapse parent row and try arrow navigation again
        await user.keyboard('{ArrowLeft}');
        rows = getAllByRole('row');
        expect(rows).toHaveLength(9);
        await user.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(rows[1]);
        expect(rows[1]).toHaveAttribute('aria-label', 'Reports');
        await user.keyboard('{ArrowUp}');
        expect(document.activeElement).toBe(rows[0]);
        expect(rows[0]).toHaveAttribute('aria-label', 'Projects');
      });

      it('should navigate between visible rows when using Home/End', async () => {
        let {getAllByRole} = render(<DynamicTree />);
        await user.tab();
        let rows = getAllByRole('row');
        expect(rows).toHaveLength(20);
        expect(document.activeElement).toBe(rows[0]);
        await user.keyboard('{End}');
        expect(document.activeElement).toBe(rows[19]);
        expect(rows[19]).toHaveAttribute('aria-label', 'Reports 2');
        await user.keyboard('{Home}');
        expect(document.activeElement).toBe(rows[0]);

        // Collapse the 2nd top level row and try End/Home again
        await user.click(rows[12]);
        rows = getAllByRole('row');
        expect(rows).toHaveLength(13);
        await user.keyboard('{Home}');
        await user.keyboard('{End}');
        expect(document.activeElement).toBe(rows[12]);
        expect(rows[12]).toHaveAttribute('aria-label', 'Reports');
      });
    });
  });

  describe('expanding and collapsing', () => {
    describe.each(['mouse', 'keyboard'])('%s', (type) => {
      let trigger = async (item, key = 'ArrowRight') => {
        if (type === 'mouse') {
          await user.click(item);
        } else {
          await user.keyboard(`{${key}}`);
        }
      };

      it('should expand/collapse a row when clicking/using Enter on the row itself and there arent any other primary actions', async () => {
        let {getAllByRole} = render(<DynamicTree />);
        let rows = getAllByRole('row');
        expect(rows).toHaveLength(20);

        await user.tab();
        expect(document.activeElement).toBe(rows[0]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(rows[0]).toHaveAttribute('aria-level', '1');
        expect(rows[0]).toHaveAttribute('aria-posinset', '1');
        expect(rows[0]).toHaveAttribute('aria-setsize', '2');
        expect(rows[0]).toHaveAttribute('data-has-child-rows', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);

        // Check we can open/close a top level row
        await trigger(rows[0], 'Enter');
        expect(document.activeElement).toBe(rows[0]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'false');
        expect(rows[0]).not.toHaveAttribute('data-expanded');
        expect(rows[0]).toHaveAttribute('aria-level', '1');
        expect(rows[0]).toHaveAttribute('aria-posinset', '1');
        expect(rows[0]).toHaveAttribute('aria-setsize', '2');
        expect(rows[0]).toHaveAttribute('data-has-child-rows', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        // Note that the children of the parent row will still be in the "expanded" array
        expect(new Set(onExpandedChange.mock.calls[0][0])).toEqual(new Set(['Project-2', 'Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB']));
        rows = getAllByRole('row');
        expect(rows).toHaveLength(9);

        await trigger(rows[0], 'Enter');
        expect(document.activeElement).toBe(rows[0]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(rows[0]).toHaveAttribute('aria-level', '1');
        expect(rows[0]).toHaveAttribute('aria-posinset', '1');
        expect(rows[0]).toHaveAttribute('aria-setsize', '2');
        expect(rows[0]).toHaveAttribute('data-has-child-rows', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(2);
        expect(new Set(onExpandedChange.mock.calls[1][0])).toEqual(new Set(['Projects', 'Project-2', 'Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB']));
        rows = getAllByRole('row');
        expect(rows).toHaveLength(20);

        await user.keyboard('{ArrowDown}');
        await user.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(rows[2]);
        expect(rows[2]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[2]).toHaveAttribute('data-expanded', 'true');
        expect(rows[2]).toHaveAttribute('aria-level', '2');
        expect(rows[2]).toHaveAttribute('aria-posinset', '2');
        expect(rows[2]).toHaveAttribute('aria-setsize', '5');
        expect(rows[2]).toHaveAttribute('data-has-child-rows', 'true');

        // Check we can close a nested row and it doesn't affect the parent
        await trigger(rows[2], 'ArrowLeft');
        expect(document.activeElement).toBe(rows[2]);
        expect(rows[2]).toHaveAttribute('aria-expanded', 'false');
        expect(rows[2]).not.toHaveAttribute('data-expanded');
        expect(rows[2]).toHaveAttribute('aria-level', '2');
        expect(rows[2]).toHaveAttribute('aria-posinset', '2');
        expect(rows[2]).toHaveAttribute('aria-setsize', '5');
        expect(rows[2]).toHaveAttribute('data-has-child-rows', 'true');
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(rows[0]).toHaveAttribute('aria-level', '1');
        expect(rows[0]).toHaveAttribute('aria-posinset', '1');
        expect(rows[0]).toHaveAttribute('aria-setsize', '2');
        expect(rows[0]).toHaveAttribute('data-has-child-rows', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(3);
        expect(new Set(onExpandedChange.mock.calls[2][0])).toEqual(new Set(['Projects', 'Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB']));
        rows = getAllByRole('row');
        expect(rows).toHaveLength(17);

        // Check behavior of onExpandedChange when a nested row is already closed and the parent is collapsed
        await user.keyboard('{ArrowUp}');
        await user.keyboard('{ArrowUp}');
        await trigger(rows[0], 'ArrowLeft');
        expect(document.activeElement).toBe(rows[0]);
        expect(onExpandedChange).toHaveBeenCalledTimes(4);
        expect(new Set(onExpandedChange.mock.calls[3][0])).toEqual(new Set(['Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB']));
        rows = getAllByRole('row');
        expect(rows).toHaveLength(9);

        // Check that the nested collapsed row is still closed when the parent is reexpanded
        await trigger(rows[0], 'ArrowRight');
        expect(document.activeElement).toBe(rows[0]);
        expect(onExpandedChange).toHaveBeenCalledTimes(5);
        expect(new Set(onExpandedChange.mock.calls[4][0])).toEqual(new Set(['Projects', 'Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB']));
        rows = getAllByRole('row');
        expect(rows).toHaveLength(17);
      });

      it('should not expand/collapse if disabledBehavior is "all" and the row is disabled', async () => {
        let tree = render(<DynamicTree treeProps={{disabledKeys: ['Projects'], disabledBehavior: 'all', expandedKeys: new Set(['Projects', 'Project-2', 'Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB'])}} />);
        let rows = tree.getAllByRole('row');
        expect(rows).toHaveLength(20);

        await user.tab();
        // Since first row is disabled, we can't keyboard focus it
        expect(document.activeElement).toBe(rows[1]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(rows[0]).toHaveAttribute('aria-disabled', 'true');
        expect(rows[0]).toHaveAttribute('data-disabled', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);

        // Try clicking on first row
        await trigger(rows[0], 'Space');
        expect(document.activeElement).toBe(rows[1]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);

        rerender(tree, <DynamicTree treeProps={{disabledKeys: ['Projects'], disabledBehavior: 'all', expandedKeys: []}} />);
        await user.tab();
        rows = tree.getAllByRole('row');
        expect(rows[0]).toHaveAttribute('aria-expanded', 'false');
        expect(rows[0]).not.toHaveAttribute('data-expanded');
        expect(rows[0]).toHaveAttribute('aria-disabled', 'true');
        expect(rows[0]).toHaveAttribute('data-disabled', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);

        await trigger(rows[0], 'Space');
        expect(rows[0]).toHaveAttribute('aria-expanded', 'false');
        expect(rows[0]).not.toHaveAttribute('data-expanded');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);
      });

      it('should expand/collapse if disabledBehavior is "selection" and the row is disabled', async () => {
        let {getAllByRole} = render(<DynamicTree treeProps={{disabledKeys: ['Projects'], disabledBehavior: 'selection', selectionMode: 'multiple'}} />);
        let rows = getAllByRole('row');

        await user.tab();
        expect(document.activeElement).toBe(rows[0]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);
        expect(onSelectionChange).toHaveBeenCalledTimes(0);

        // Since selection is enabled, we need to click the chevron even for disabled rows since it is still regarded as the primary action
        let chevron = within(rows[0]).getAllByRole('button')[0];
        await trigger(chevron, 'ArrowLeft');
        expect(document.activeElement).toBe(rows[0]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'false');
        expect(rows[0]).not.toHaveAttribute('data-expanded');
        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(new Set(onExpandedChange.mock.calls[0][0])).toEqual(new Set(['Project-2', 'Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB']));
        expect(onSelectionChange).toHaveBeenCalledTimes(0);

        await trigger(chevron);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(2);
        expect(new Set(onExpandedChange.mock.calls[1][0])).toEqual(new Set(['Projects', 'Project-2', 'Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB']));
        expect(onSelectionChange).toHaveBeenCalledTimes(0);

        let disabledCheckbox = within(rows[0]).getByRole('checkbox');
        expect(disabledCheckbox).toHaveAttribute('disabled');
      });

      it('should not expand when clicking/using Enter on the row if the row is selectable', async () => {
        let {getAllByRole} = render(<DynamicTree treeProps={{selectionMode: 'multiple'}} />);
        let rows = getAllByRole('row');

        await user.tab();
        expect(document.activeElement).toBe(rows[0]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);
        expect(onSelectionChange).toHaveBeenCalledTimes(0);

        await trigger(rows[0], 'Enter');
        expect(document.activeElement).toBe(rows[0]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(['Projects']));

        await trigger(rows[0], 'Enter');
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);
        expect(onSelectionChange).toHaveBeenCalledTimes(2);
        expect(new Set(onSelectionChange.mock.calls[1][0])).toEqual(new Set([]));

        let chevron = within(rows[0]).getAllByRole('button')[0];
        await trigger(chevron, 'ArrowLeft');
        expect(rows[0]).toHaveAttribute('aria-expanded', 'false');
        expect(rows[0]).not.toHaveAttribute('data-expanded');
        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(new Set(onExpandedChange.mock.calls[0][0])).toEqual(new Set(['Project-2', 'Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB']));
        expect(onSelectionChange).toHaveBeenCalledTimes(2);
      });

      it('should not expand when clicking/using Enter on the row if the row has an action', async () => {
        let {getAllByRole} = render(<DynamicTree treeProps={{onAction}} />);
        let rows = getAllByRole('row');

        await user.tab();
        expect(document.activeElement).toBe(rows[0]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);
        expect(onAction).toHaveBeenCalledTimes(0);

        await trigger(rows[0], 'Enter');
        expect(document.activeElement).toBe(rows[0]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenLastCalledWith('Projects');

        let chevron = within(rows[0]).getAllByRole('button')[0];
        await trigger(chevron, 'ArrowLeft');
        expect(rows[0]).toHaveAttribute('aria-expanded', 'false');
        expect(rows[0]).not.toHaveAttribute('data-expanded');
        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(new Set(onExpandedChange.mock.calls[0][0])).toEqual(new Set(['Project-2', 'Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB']));
        expect(onAction).toHaveBeenCalledTimes(1);
      });

      it('should not expand when clicking/using Enter on the row if the row has a link', async () => {
        let {getAllByRole} = render(<DynamicTree rowProps={{href: 'https://google.com'}} />);
        let rows = getAllByRole('row');
        expect(rows[0]).toHaveAttribute('data-href');

        await user.tab();
        expect(document.activeElement).toBe(rows[0]);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);

        let onClick = mockClickDefault();
        await trigger(rows[0], 'Enter');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
        expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[0]).toHaveAttribute('data-expanded', 'true');
        expect(onExpandedChange).toHaveBeenCalledTimes(0);
        expect(document.activeElement).toBe(document.body);

        await user.tab();
        let chevron = within(rows[0]).getAllByRole('button')[0];
        await trigger(chevron, 'ArrowLeft');
        expect(rows[0]).toHaveAttribute('aria-expanded', 'false');
        expect(rows[0]).not.toHaveAttribute('data-expanded');
        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(new Set(onExpandedChange.mock.calls[0][0])).toEqual(new Set(['Project-2', 'Project-5', 'Reports', 'Reports-1', 'Reports-1A', 'Reports-1AB']));
      });
    });

    it('should support controlled expansion', async () => {
      function ControlledTree() {
        let [expandedKeys, setExpandedKeys] = React.useState(new Set([]));

        return (
          <DynamicTree treeProps={{expandedKeys, onExpandedChange: setExpandedKeys}} />
        );
      }

      let {getAllByRole} = render(<ControlledTree />);
      let rows = getAllByRole('row');
      expect(rows).toHaveLength(2);

      await user.tab();
      expect(document.activeElement).toBe(rows[0]);
      expect(rows[0]).toHaveAttribute('aria-expanded', 'false');
      expect(rows[0]).not.toHaveAttribute('data-expanded');

      await user.click(rows[0]);
      rows = getAllByRole('row');
      expect(rows).toHaveLength(7);

      await user.click(rows[0]);
      expect(rows[0]).toHaveAttribute('aria-expanded', 'false');
      expect(rows[0]).not.toHaveAttribute('data-expanded');
      rows = getAllByRole('row');
      expect(rows).toHaveLength(2);
    });

    it('should apply the proper attributes to the chevron', async () => {
      let {getAllByRole} = render(<DynamicTree />);
      let rows = getAllByRole('row');
      let chevron = within(rows[0]).getAllByRole('button')[0];

      await user.tab();
      expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
      expect(chevron).toHaveAttribute('aria-label', 'Collapse');

      await user.click(rows[0]);
      expect(rows[0]).toHaveAttribute('aria-expanded', 'false');
      expect(chevron).toHaveAttribute('aria-label', 'Expand');
    });
  });

  describe('empty state', () => {
    it('should allow the user to tab to the empty tree', async () => {
      function renderEmptyState() {
        return (
          <IllustratedMessage>
            <svg width="150" height="103" viewBox="0 0 150 103">
              <path d="M133.7,8.5h-118c-1.9,0-3.5,1.6-3.5,3.5v27c0,0.8,0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5V23.5h119V92c0,0.3-0.2,0.5-0.5,0.5h-118c-0.3,0-0.5-0.2-0.5-0.5V69c0-0.8-0.7-1.5-1.5-1.5s-1.5,0.7-1.5,1.5v23c0,1.9,1.6,3.5,3.5,3.5h118c1.9,0,3.5-1.6,3.5-3.5V12C137.2,10.1,135.6,8.5,133.7,8.5z M15.2,21.5V12c0-0.3,0.2-0.5,0.5-0.5h118c0.3,0,0.5,0.2,0.5,0.5v9.5H15.2z M32.6,16.5c0,0.6-0.4,1-1,1h-10c-0.6,0-1-0.4-1-1s0.4-1,1-1h10C32.2,15.5,32.6,15.9,32.6,16.5z M13.6,56.1l-8.6,8.5C4.8,65,4.4,65.1,4,65.1c-0.4,0-0.8-0.1-1.1-0.4c-0.6-0.6-0.6-1.5,0-2.1l8.6-8.5l-8.6-8.5c-0.6-0.6-0.6-1.5,0-2.1c0.6-0.6,1.5-0.6,2.1,0l8.6,8.5l8.6-8.5c0.6-0.6,1.5-0.6,2.1,0c0.6,0.6,0.6,1.5,0,2.1L15.8,54l8.6,8.5c0.6,0.6,0.6,1.5,0,2.1c-0.3,0.3-0.7,0.4-1.1,0.4c-0.4,0-0.8-0.1-1.1-0.4L13.6,56.1z" />
            </svg>
            <Heading>No results</Heading>
            <Content>No results found.</Content>
          </IllustratedMessage>
        );
      }

      let {getAllByRole, getByRole} = render(
        <TreeView
          aria-label="test empty tree"
          items={[]}
          renderEmptyState={renderEmptyState}>
          {() => (
            <TreeViewItem textValue="dummy value">
              <Text>dummy content</Text>
            </TreeViewItem>
          )}
        </TreeView>
      );

      let tree = getByRole('treegrid');
      expect(tree).toHaveAttribute('data-empty', 'true');
      expect(tree).not.toHaveAttribute('data-focused');
      expect(tree).not.toHaveAttribute('data-focus-visible');

      let row = getAllByRole('row')[0];
      expect(row).toHaveAttribute('aria-level', '1');
      expect(row).toHaveAttribute('aria-posinset', '1');
      expect(row).toHaveAttribute('aria-setsize', '1');
      let gridCell = within(row).getByRole('gridcell');
      expect(gridCell).toHaveTextContent('No resultsNo results found.');

      await user.tab();
      expect(document.activeElement).toBe(tree);
    });
  });

  describe('android talkback', () => {
    let uaMock;
    beforeAll(() => {
      uaMock = jest.spyOn(navigator, 'userAgent', 'get').mockImplementation(() => 'Android');
    });

    afterAll(() => {
      uaMock.mockRestore();
    });

    it('should add a tab index to the chevron if the row isnt completely disabled', () => {
      let tree = render(
        <TreeView aria-label="test tree" selectionMode="multiple">
          <TreeViewItem id="Test" textValue="Test" hasChildItems>
            <Text>Test</Text>
          </TreeViewItem>
        </TreeView>
      );
      let rows = tree.getAllByRole('row');
      let chevron = within(rows[0]).getAllByRole('button')[0];
      expect(chevron).toHaveAttribute('tabIndex', '-1');

      rerender(
        tree,
        <TreeView aria-label="test tree" selectionMode="multiple" disabledKeys={['Test']}>
          <TreeViewItem id="Test" textValue="Test" hasChildItems>
            <Text>Test</Text>
          </TreeViewItem>
        </TreeView>
      );
      rows = tree.getAllByRole('row');
      chevron = within(rows[0]).getAllByRole('button')[0];
      expect(chevron).toHaveAttribute('tabIndex', '-1');

      rerender(
        tree,
        <TreeView aria-label="test tree" selectionMode="multiple" disabledBehavior="all" disabledKeys={['Test']}>
          <TreeViewItem id="Test" textValue="Test" hasChildItems>
            <Text>Test</Text>
          </TreeViewItem>
        </TreeView>
      );
      rows = tree.getAllByRole('row');
      chevron = within(rows[0]).getAllByRole('button')[0];
      expect(chevron).not.toHaveAttribute('tabIndex');
    });
  });
});
