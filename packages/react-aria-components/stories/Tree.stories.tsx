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
import {Button, Checkbox, CheckboxProps, Collection, Key, UNSTABLE_ListLayout as ListLayout, Menu, MenuTrigger, Popover, Text, TreeItemProps, TreeProps, UNSTABLE_Tree, UNSTABLE_TreeItem, UNSTABLE_TreeItemContent, UNSTABLE_Virtualizer as Virtualizer} from 'react-aria-components';
import {classNames} from '@react-spectrum/utils';
import {MyMenuItem} from './utils';
import React, {ReactNode, useMemo} from 'react';
import styles from '../example/index.css';
import {UNSTABLE_TreeLoadingIndicator} from '../src/Tree';

export default {
  title: 'React Aria Components'
};

interface StaticTreeItemProps extends TreeItemProps {
  title?: string,
  children: ReactNode
}

function MyCheckbox({children, ...props}: CheckboxProps) {
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
}

const StaticTreeItem = (props: StaticTreeItemProps) => {
  return (
    <UNSTABLE_TreeItem
      {...props}
      className={({isFocused, isSelected, isHovered, isFocusVisible}) => classNames(styles, 'tree-item', {
        focused: isFocused,
        'focus-visible': isFocusVisible,
        selected: isSelected,
        hovered: isHovered
      })}>
      <UNSTABLE_TreeItemContent>
        {({isExpanded, hasChildRows, level, selectionMode, selectionBehavior}) => (
          <>
            {selectionMode !== 'none' && selectionBehavior === 'toggle' && (
              <MyCheckbox slot="selection" />
            )}
            <div
              className={classNames(styles, 'content-wrapper')}
              style={{marginInlineStart: `${(!hasChildRows ? 20 : 0) + (level - 1) * 15}px`}}>
              {hasChildRows && <Button className={styles.chevron} slot="chevron">{isExpanded ? '⏷' : '⏵'}</Button>}
              <Text className={styles.title}>{props.title || props.children}</Text>
              <Button className={styles.button} aria-label="Info" onPress={action('Info press')}>ⓘ</Button>
              <MenuTrigger>
                <Button aria-label="Menu">☰</Button>
                <Popover>
                  <Menu className={styles.menu} onAction={action('menu action')}>
                    <MyMenuItem>Foo</MyMenuItem>
                    <MyMenuItem>Bar</MyMenuItem>
                    <MyMenuItem>Baz</MyMenuItem>
                  </Menu>
                </Popover>
              </MenuTrigger>
            </div>
          </>
        )}
      </UNSTABLE_TreeItemContent>
      {props.title && props.children}
    </UNSTABLE_TreeItem>
  );
};

const TreeExampleStaticRender = (args) => (
  <UNSTABLE_Tree className={styles.tree} {...args} disabledKeys={['projects']} aria-label="test static tree" onExpandedChange={action('onExpandedChange')} onSelectionChange={action('onSelectionChange')}>
    <StaticTreeItem id="Photos" textValue="Photos">Photos</StaticTreeItem>
    <StaticTreeItem id="projects" textValue="Projects" title="Projects">
      <StaticTreeItem id="projects-1" textValue="Projects-1" title="Projects-1">
        <StaticTreeItem id="projects-1A" textValue="Projects-1A">
          Projects-1A
        </StaticTreeItem>
      </StaticTreeItem>
      <StaticTreeItem id="projects-2" textValue="Projects-2">
        Projects-2
      </StaticTreeItem>
      <StaticTreeItem id="projects-3" textValue="Projects-3">
        Projects-3
      </StaticTreeItem>
    </StaticTreeItem>
    <UNSTABLE_TreeItem
      id="reports"
      textValue="Reports"
      className={({isFocused, isSelected, isHovered, isFocusVisible}) => classNames(styles, 'tree-item', {
        focused: isFocused,
        'focus-visible': isFocusVisible,
        selected: isSelected,
        hovered: isHovered
      })}>
      <UNSTABLE_TreeItemContent>
        Reports
      </UNSTABLE_TreeItemContent>
    </UNSTABLE_TreeItem>
    <UNSTABLE_TreeItem
      id="Tests"
      textValue="Tests"
      className={({isFocused, isSelected, isHovered, isFocusVisible}) => classNames(styles, 'tree-item', {
        focused: isFocused,
        'focus-visible': isFocusVisible,
        selected: isSelected,
        hovered: isHovered
      })}>
      <UNSTABLE_TreeItemContent>
        {({isFocused}) => (
          <Text>{`${isFocused} Tests`}</Text>
        )}
      </UNSTABLE_TreeItemContent>
    </UNSTABLE_TreeItem>
  </UNSTABLE_Tree>
);

export const TreeExampleStatic = {
  render: TreeExampleStaticRender,
  args: {
    selectionMode: 'none',
    selectionBehavior: 'toggle',
    disabledBehavior: 'selection'
  },
  argTypes: {
    selectionMode: {
      control: 'radio',
      options: ['none', 'single', 'multiple']
    },
    selectionBehavior: {
      control: 'radio',
      options: ['toggle', 'replace']
    },
    disabledBehavior: {
      control: 'radio',
      options: ['selection', 'all']
    }
  },
  parameters: {
    description: {
      data: 'Note that the last two items are just to test bare minimum UNSTABLE_TreeItem and thus dont have the checkbox or any of the other contents that the other items have. The last item tests the isFocused renderProp'
    }
  }
};

let rows = [
  {id: 'projects', name: 'Projects', childItems: [
    {id: 'project-1', name: 'Project 1'},
    {id: 'project-2', name: 'Project 2', childItems: [
      {id: 'project-2A', name: 'Project 2A'},
      {id: 'project-2B', name: 'Project 2B'},
      {id: 'project-2C', name: 'Project 2C'}
    ]},
    {id: 'project-3', name: 'Project 3'},
    {id: 'project-4', name: 'Project 4'},
    {id: 'project-5', name: 'Project 5', childItems: [
      {id: 'project-5A', name: 'Project 5A'},
      {id: 'project-5B', name: 'Project 5B'},
      {id: 'project-5C', name: 'Project 5C'}
    ]}
  ]},
  {id: 'reports', name: 'Reports', childItems: [
    {id: 'reports-1', name: 'Reports 1', childItems: [
      {id: 'reports-1A', name: 'Reports 1A', childItems: [
        {id: 'reports-1AB', name: 'Reports 1AB', childItems: [
          {id: 'reports-1ABC', name: 'Reports 1ABC'}
        ]}
      ]},
      {id: 'reports-1B', name: 'Reports 1B'},
      {id: 'reports-1C', name: 'Reports 1C'}
    ]},
    {id: 'reports-2', name: 'Reports 2'}
  ]}
];

const MyTreeLoader = () => {
  return (
    <UNSTABLE_TreeLoadingIndicator>
      {({level}) => {
        let message = `Level ${level} loading spinner`;
        if (level === 1) {
          message = 'Load more spinner';
        }
        return (
          <span style={{marginInlineStart: `${(level > 1 ? 25 : 0) + (level - 1) * 15}px`}}>
            {message}
          </span>
        );
      }}
    </UNSTABLE_TreeLoadingIndicator>
  );
};

interface DynamicTreeItemProps extends TreeItemProps<object> {
  children: ReactNode,
  childItems?: Iterable<object>,
  isLoading?: boolean,
  renderLoader?: (id: Key | undefined) => boolean
}

const DynamicTreeItem = (props: DynamicTreeItemProps) => {
  let {childItems, renderLoader} = props;
  return (
    <>
      <UNSTABLE_TreeItem
        {...props}
        className={({isFocused, isSelected, isHovered, isFocusVisible}) => classNames(styles, 'tree-item', {
          focused: isFocused,
          'focus-visible': isFocusVisible,
          selected: isSelected,
          hovered: isHovered
        })}>
        <UNSTABLE_TreeItemContent>
          {({isExpanded, hasChildRows, level, selectionBehavior, selectionMode}) => (
            <>
              {selectionMode !== 'none' && selectionBehavior === 'toggle' && (
                <MyCheckbox slot="selection" />
              )}
              <div className={styles['content-wrapper']} style={{marginInlineStart: `${(!hasChildRows ? 20 : 0) + (level - 1) * 15}px`}}>
                {hasChildRows && <Button slot="chevron">{isExpanded ? '⏷' : '⏵'}</Button>}
                <Text>{props.children}</Text>
                <Button className={styles.button} aria-label="Info" onPress={action('Info press')}>ⓘ</Button>
                <MenuTrigger>
                  <Button aria-label="Menu">☰</Button>
                  <Popover>
                    <Menu className={styles.menu} onAction={action('menu action')}>
                      <MyMenuItem>Foo</MyMenuItem>
                      <MyMenuItem>Bar</MyMenuItem>
                      <MyMenuItem>Baz</MyMenuItem>
                    </Menu>
                  </Popover>
                </MenuTrigger>
              </div>
            </>
          )}
        </UNSTABLE_TreeItemContent>
        <Collection items={childItems}>
          {(item: any) => (
            <DynamicTreeItem renderLoader={renderLoader} isLoading={props.isLoading} id={item.id} childItems={item.childItems} textValue={item.name} href={props.href}>
              {item.name}
            </DynamicTreeItem>
          )}
        </Collection>
      </UNSTABLE_TreeItem>
      {/* TODO this would need to check if the parent was loading and then the user would insert this tree loader after last row of that section.
        theoretically this would look like (loadingKeys.includes(parentKey) && props.id === last key of parent) &&....
        both the parentKey of a given item as well as checking if the current tree item is the last item of said parent would need to be done by the user outside of this tree item?
      */}
      {props.isLoading && renderLoader?.(props.id) && <MyTreeLoader /> }
    </>
  );
};

let defaultExpandedKeys = new Set(['projects', 'project-2', 'project-5', 'reports', 'reports-1', 'reports-1A', 'reports-1AB']);

const TreeExampleDynamicRender = (args: TreeProps<unknown>) => (
  <UNSTABLE_Tree {...args} defaultExpandedKeys={defaultExpandedKeys} disabledKeys={['reports-1AB']} className={styles.tree} aria-label="test dynamic tree" items={rows} onExpandedChange={action('onExpandedChange')} onSelectionChange={action('onSelectionChange')}>
    {(item) => (
      <DynamicTreeItem id={item.id} childItems={item.childItems} textValue={item.name}>
        {item.name}
      </DynamicTreeItem>
    )}
  </UNSTABLE_Tree>
);

export const TreeExampleDynamic = {
  ...TreeExampleStatic,
  render: TreeExampleDynamicRender,
  parameters: null
};

export const WithActions = {
  ...TreeExampleDynamic,
  args: {
    onAction: action('onAction'),
    ...TreeExampleDynamic.args
  },
  name: 'UNSTABLE_Tree with actions'
};

const WithLinksRender = (args: TreeProps<unknown>) => (
  <UNSTABLE_Tree {...args} defaultExpandedKeys={defaultExpandedKeys} className={styles.tree} aria-label="test dynamic tree" items={rows} onExpandedChange={action('onExpandedChange')} onSelectionChange={action('onSelectionChange')}>
    {(item) => (
      <DynamicTreeItem href="https://adobe.com/" childItems={item.childItems} textValue={item.name}>
        {item.name}
      </DynamicTreeItem>
    )}
  </UNSTABLE_Tree>
);

export const WithLinks = {
  ...TreeExampleDynamic,
  render: WithLinksRender,
  name: 'UNSTABLE_Tree with links',
  parameters: {
    description: {
      data: 'every tree item should link to adobe.com'
    }
  }
};

function renderEmptyLoader({isLoading}) {
  return isLoading ? 'Root level loading spinner' : 'Nothing in tree';
}

const EmptyTreeStatic = (args: {isLoading: boolean}) => (
  <UNSTABLE_Tree
    {...args}
    className={styles.tree}
    aria-label="test empty static tree"
    renderEmptyState={() => renderEmptyLoader({isLoading: args.isLoading})}>
    <Collection items={[]} dependencies={[args.isLoading]}>
      {(item: any) => (
        <DynamicTreeItem renderLoader={(id) => id === 'project-2C'} isLoading={args.isLoading} id={item.id} childItems={item.childItems} textValue={item.name}>
          {item.name}
        </DynamicTreeItem>
      )}
    </Collection>
  </UNSTABLE_Tree>
);

export const EmptyTreeStaticStory = {
  render: EmptyTreeStatic,
  args: {
    isLoading: false
  },
  name: 'Empty/Loading Tree rendered with TreeLoader collection element'
};

function LoadingStoryDepOnCollection(args) {
  return (
    <UNSTABLE_Tree {...args} defaultExpandedKeys={defaultExpandedKeys} disabledKeys={['reports-1AB']} className={styles.tree} aria-label="test dynamic tree" onExpandedChange={action('onExpandedChange')} onSelectionChange={action('onSelectionChange')}>
      <Collection items={rows} dependencies={[args.isLoading]}>
        {(item) => (
          <DynamicTreeItem renderLoader={(id) => id === 'project-2C'} isLoading={args.isLoading} id={item.id} childItems={item.childItems} textValue={item.name}>
            {item.name}
          </DynamicTreeItem>
        )}
      </Collection>
      {args.isLoading && <MyTreeLoader />}
    </UNSTABLE_Tree>
  );
}

export const LoadingStoryDepOnCollectionStory = {
  render: LoadingStoryDepOnCollection,
  args: {
    isLoading: false
  },
  name: 'Loading, static root loader and dynamic rows',
  parameters: {
    description: {
      data: 'Test that Level 3 loading spinner and the root level load spinner appear when toggling isLoading in the controls'
    }
  }
};

function LoadingStoryDepOnTop(args: TreeProps<unknown> & {isLoading: boolean}) {
  return (
    <UNSTABLE_Tree {...args} dependencies={[args.isLoading]} items={rows} defaultExpandedKeys={defaultExpandedKeys} disabledKeys={['reports-1AB']} className={styles.tree} aria-label="test dynamic tree" onExpandedChange={action('onExpandedChange')} onSelectionChange={action('onSelectionChange')}>
      {(item) => (
        <DynamicTreeItem renderLoader={(id) => (id === 'reports' || id === 'project-2C')} isLoading={args.isLoading} id={item.id} childItems={item.childItems} textValue={item.name}>
          {item.name}
        </DynamicTreeItem>
      )}
    </UNSTABLE_Tree>
  );
}

export const LoadingStoryDepOnTopStory = {
  render: LoadingStoryDepOnTop,
  args: {
    isLoading: false
  },
  name: 'Loading, dynamic rows, root loader rendered dynamically as well',
  parameters: {
    description: {
      data: 'Test that Level 3 loading spinner and the root level load spinner appear when toggling isLoading in the controls'
    }
  }
};

function ExpandButton(props) {
  let {isLoading, isExpanded} = props;
  let contents;
  if (!isLoading) {
    contents = isExpanded ? '⏷' : '⏵';
  } else {
    contents = '↻';
  }

  return (
    <Button slot="chevron">
      {contents}
    </Button>
  );
}

const DynamicTreeItemWithButtonLoader = (props: DynamicTreeItemProps) => {
  let {childItems, renderLoader, isLoading} = props;

  return (
    <>
      <UNSTABLE_TreeItem
        {...props}
        className={({isFocused, isSelected, isHovered, isFocusVisible}) => classNames(styles, 'tree-item', {
          focused: isFocused,
          'focus-visible': isFocusVisible,
          selected: isSelected,
          hovered: isHovered
        })}>
        <UNSTABLE_TreeItemContent>
          {({isExpanded, hasChildRows, level, selectionBehavior, selectionMode}) => (
            <>
              {selectionMode !== 'none' && selectionBehavior === 'toggle' && (
                <MyCheckbox slot="selection" />
              )}
              <div className={styles['content-wrapper']} style={{marginInlineStart: `${(!hasChildRows ? 20 : 0) + (level - 1) * 15}px`}}>
                {hasChildRows && <ExpandButton isLoading={isLoading && renderLoader && renderLoader(props.id)} isExpanded={isExpanded} />}
                <Text>{props.children}</Text>
                <Button className={styles.button} aria-label="Info" onPress={action('Info press')}>ⓘ</Button>
                <MenuTrigger>
                  <Button aria-label="Menu">☰</Button>
                  <Popover>
                    <Menu className={styles.menu} onAction={action('menu action')}>
                      <MyMenuItem>Foo</MyMenuItem>
                      <MyMenuItem>Bar</MyMenuItem>
                      <MyMenuItem>Baz</MyMenuItem>
                    </Menu>
                  </Popover>
                </MenuTrigger>
              </div>
            </>
          )}
        </UNSTABLE_TreeItemContent>
        <Collection items={childItems}>
          {(item: any) => (
            <DynamicTreeItemWithButtonLoader renderLoader={renderLoader} isLoading={props.isLoading} id={item.id} childItems={item.childItems} textValue={item.name} href={props.href}>
              {item.name}
            </DynamicTreeItemWithButtonLoader>
          )}
        </Collection>
      </UNSTABLE_TreeItem>
    </>
  );
};

function ButtonLoadingIndicator(args: TreeProps<unknown> & {isLoading: boolean}) {
  return (
    <UNSTABLE_Tree {...args} dependencies={[args.isLoading]} items={rows} defaultExpandedKeys={defaultExpandedKeys} disabledKeys={['reports-1AB']} className={styles.tree} aria-label="test dynamic tree" onExpandedChange={action('onExpandedChange')} onSelectionChange={action('onSelectionChange')}>
      {(item) => (
        <DynamicTreeItemWithButtonLoader renderLoader={(id) => (id === 'project-2' || id === 'project-5')} isLoading={args.isLoading} id={item.id} childItems={item.childItems} textValue={item.name}>
          {item.name}
        </DynamicTreeItemWithButtonLoader>
      )}
    </UNSTABLE_Tree>
  );
}

export const ButtonLoadingIndicatorStory = {
  render: ButtonLoadingIndicator,
  args: {
    isLoading: false
  },
  name: 'Loading, dynamic rows, spinner renders in button',
  parameters: {
    description: {
      data: 'Test that the expand icon for Project 2 and 5 change to spinner icons when isLoading is toggled on via controls'
    }
  }
};
function VirtualizedTreeRender(args) {
  let layout = useMemo(() => {
    return new ListLayout({
      rowHeight: 30
    });
  }, []);

  return (
    <Virtualizer layout={layout}>
      <TreeExampleDynamicRender {...args} />
    </Virtualizer>
  );
}

export const VirtualizedTree = {
  ...TreeExampleDynamic,
  render: VirtualizedTreeRender
};
