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

import {act, fireEvent, mockClickDefault, pointerMap, render, within} from '@react-spectrum/test-utils-internal';
import {
  Button,
  Checkbox,
  Dialog,
  DialogTrigger,
  DropIndicator,
  GridList,
  GridListContext,
  GridListItem,
  Label,
  UNSTABLE_ListLayout as ListLayout,
  Modal,
  RouterProvider,
  Tag,
  TagGroup,
  TagList,
  useDragAndDrop,
  UNSTABLE_Virtualizer as Virtualizer
} from '../';
import React from 'react';
import {User} from '@react-aria/test-utils';
import userEvent from '@testing-library/user-event';

let TestGridList = ({listBoxProps, itemProps}) => (
  <GridList aria-label="Test" {...listBoxProps}>
    <GridListItem {...itemProps} id="cat" textValue="Cat"><Checkbox slot="selection" /> Cat</GridListItem>
    <GridListItem {...itemProps} id="dog" textValue="Dog"><Checkbox slot="selection" /> Dog</GridListItem>
    <GridListItem {...itemProps} id="kangaroo" textValue="Kangaroo"><Checkbox slot="selection" /> Kangaroo</GridListItem>
  </GridList>
);

let DraggableGridList = (props) => {
  let {dragAndDropHooks} = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({'text/plain': key})),
    ...props
  });

  return (
    <GridList aria-label="Test" dragAndDropHooks={dragAndDropHooks}>
      <GridListItem id="cat" textValue="Cat"><Button slot="drag">≡</Button><Checkbox slot="selection" /> Cat</GridListItem>
      <GridListItem id="dog" textValue="Dog"><Button slot="drag">≡</Button><Checkbox slot="selection" /> Dog</GridListItem>
      <GridListItem id="kangaroo" textValue="Kangaroo"><Button slot="drag">≡</Button><Checkbox slot="selection" /> Kangaroo</GridListItem>
    </GridList>
  );
};

let renderGridList = (listBoxProps, itemProps) => render(<TestGridList {...{listBoxProps, itemProps}} />);

describe('GridList', () => {
  let user;
  let testUtilUser = new User();

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {jest.runAllTimers();});
    jest.clearAllMocks();
  });

  it('should render with default classes', () => {
    let {getByRole} = renderGridList();
    let gridListTester = testUtilUser.createTester('GridList', {root: getByRole('grid')});

    expect(gridListTester.gridlist).toHaveAttribute('class', 'react-aria-GridList');

    for (let row of gridListTester.rows) {
      expect(row).toHaveAttribute('class', 'react-aria-GridListItem');
    }
  });

  it('should render with custom classes', () => {
    let {getByRole, getAllByRole} = renderGridList({className: 'gridlist'}, {className: 'item'});
    let grid = getByRole('grid');
    expect(grid).toHaveAttribute('class', 'gridlist');

    for (let row of getAllByRole('row')) {
      expect(row).toHaveAttribute('class', 'item');
    }
  });

  it('should support DOM props', () => {
    let {getByRole, getAllByRole} = renderGridList({'data-foo': 'bar'}, {'data-bar': 'foo'});
    let grid = getByRole('grid');
    expect(grid).toHaveAttribute('data-foo', 'bar');

    for (let row of getAllByRole('row')) {
      expect(row).toHaveAttribute('data-bar', 'foo');
    }
  });

  it('should support slot', () => {
    let {getByRole} = render(
      <GridListContext.Provider value={{slots: {test: {'aria-label': 'test'}}}}>
        <TestGridList listBoxProps={{slot: 'test', 'aria-label': undefined}} />
      </GridListContext.Provider>
    );

    let grid = getByRole('grid');
    expect(grid).toHaveAttribute('slot', 'test');
    expect(grid).toHaveAttribute('aria-label', 'test');
  });

  it('should support refs', () => {
    let listBoxRef = React.createRef();
    let itemRef = React.createRef();
    render(
      <GridList aria-label="Test" ref={listBoxRef}>
        <GridListItem ref={itemRef}>Cat</GridListItem>
      </GridList>
    );
    expect(listBoxRef.current).toBeInstanceOf(HTMLElement);
    expect(itemRef.current).toBeInstanceOf(HTMLElement);
  });

  it('should support hover', async () => {
    let onHoverStart = jest.fn();
    let onHoverChange = jest.fn();
    let onHoverEnd = jest.fn();
    let {getAllByRole} = renderGridList({selectionMode: 'multiple'}, {className: ({isHovered}) => isHovered ? 'hover' : '', onHoverStart, onHoverChange, onHoverEnd});
    let row = getAllByRole('row')[0];

    expect(row).not.toHaveAttribute('data-hovered');
    expect(row).not.toHaveClass('hover');

    await user.hover(row);
    expect(row).toHaveAttribute('data-hovered', 'true');
    expect(row).toHaveClass('hover');
    expect(onHoverStart).toHaveBeenCalledTimes(1);
    expect(onHoverChange).toHaveBeenCalledTimes(1);

    await user.unhover(row);
    expect(row).not.toHaveAttribute('data-hovered');
    expect(row).not.toHaveClass('hover');
    expect(onHoverEnd).toHaveBeenCalledTimes(1);
    expect(onHoverChange).toHaveBeenCalledTimes(2);
  });

  it('should not show hover state when item is not interactive', async () => {
    let onHoverStart = jest.fn();
    let onHoverChange = jest.fn();
    let onHoverEnd = jest.fn();
    let {getAllByRole} = renderGridList({}, {className: ({isHovered}) => isHovered ? 'hover' : '', onHoverStart, onHoverChange, onHoverEnd});
    let row = getAllByRole('row')[0];

    expect(row).not.toHaveAttribute('data-hovered');
    expect(row).not.toHaveClass('hover');
    expect(onHoverStart).not.toHaveBeenCalled();
    expect(onHoverChange).not.toHaveBeenCalled();
    expect(onHoverEnd).not.toHaveBeenCalled();

    await user.hover(row);
    expect(row).not.toHaveAttribute('data-hovered');
    expect(row).not.toHaveClass('hover');
    expect(onHoverStart).not.toHaveBeenCalled();
    expect(onHoverChange).not.toHaveBeenCalled();
    expect(onHoverEnd).not.toHaveBeenCalled();
  });

  it('should support focus ring', async () => {
    let {getAllByRole} = renderGridList({selectionMode: 'multiple'}, {className: ({isFocusVisible}) => isFocusVisible ? 'focus' : ''});
    let row = getAllByRole('row')[0];

    expect(row).not.toHaveAttribute('data-focus-visible');
    expect(row).not.toHaveClass('focus');

    await user.tab();
    expect(document.activeElement).toBe(row);
    expect(row).toHaveAttribute('data-focus-visible', 'true');
    expect(row).toHaveClass('focus');

    await user.tab();
    expect(row).not.toHaveAttribute('data-focus-visible');
    expect(row).not.toHaveClass('focus');
  });

  it('should support press state', async () => {
    let {getAllByRole} = renderGridList({selectionMode: 'multiple'}, {className: ({isPressed}) => isPressed ? 'pressed' : ''});
    let row = getAllByRole('row')[0];

    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');

    await user.pointer({target: row, keys: '[MouseLeft>]'});
    expect(row).toHaveAttribute('data-pressed', 'true');
    expect(row).toHaveClass('pressed');

    await user.pointer({target: row, keys: '[/MouseLeft]'});
    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');
  });

  it('should not show press state when not interactive', async () => {
    let {getAllByRole} = renderGridList({}, {className: ({isPressed}) => isPressed ? 'pressed' : ''});
    let row = getAllByRole('row')[0];

    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');

    await user.pointer({target: row, keys: '[MouseLeft>]'});
    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');

    await user.pointer({target: row, keys: '[/MouseLeft]'});
    expect(row).not.toHaveAttribute('data-pressed');
    expect(row).not.toHaveClass('pressed');
  });

  it('should support selection state', async () => {
    let {getByRole} = renderGridList({selectionMode: 'multiple'}, {className: ({isSelected}) => isSelected ? 'selected' : ''});
    let gridListTester = testUtilUser.createTester('GridList', {root: getByRole('grid')});

    let row = gridListTester.rows[0];
    expect(row).not.toHaveAttribute('aria-selected', 'true');
    expect(row).not.toHaveClass('selected');
    expect(within(row).getByRole('checkbox')).not.toBeChecked();

    await gridListTester.toggleRowSelection({row: 0});
    expect(row).toHaveAttribute('aria-selected', 'true');
    expect(row).toHaveClass('selected');
    expect(within(row).getByRole('checkbox')).toBeChecked();

    await gridListTester.toggleRowSelection({row: 0});
    expect(row).not.toHaveAttribute('aria-selected', 'true');
    expect(row).not.toHaveClass('selected');
    expect(within(row).getByRole('checkbox')).not.toBeChecked();
  });

  it('should support disabled state', () => {
    let {getAllByRole} = renderGridList({selectionMode: 'multiple', disabledKeys: ['cat']}, {className: ({isDisabled}) => isDisabled ? 'disabled' : ''});
    let row = getAllByRole('row')[0];

    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(row).toHaveClass('disabled');

    expect(within(row).getByRole('checkbox')).toBeDisabled();
  });

  it('should support isDisabled prop on items', async () => {
    let {getByRole} = render(
      <GridList aria-label="Test">
        <GridListItem id="cat">Cat</GridListItem>
        <GridListItem id="dog" textValue="Dog" isDisabled>Dog <Button aria-label="Info">ⓘ</Button></GridListItem>
        <GridListItem id="kangaroo">Kangaroo</GridListItem>
      </GridList>
    );

    let gridListTester = testUtilUser.createTester('GridList', {root: getByRole('grid')});
    let rows = gridListTester.rows;
    expect(rows[1]).toHaveAttribute('aria-disabled', 'true');
    expect(within(rows[1]).getByRole('button')).toBeDisabled();

    await user.tab();
    expect(document.activeElement).toBe(rows[0]);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(rows[2]);
  });

  it('should support onAction on items', async () => {
    let onAction = jest.fn();
    let {getAllByRole} = render(
      <GridList aria-label="Test">
        <GridListItem id="cat" onAction={onAction}>Cat</GridListItem>
        <GridListItem id="dog">Dog</GridListItem>
        <GridListItem id="kangaroo">Kangaroo</GridListItem>
      </GridList>
    );
    let items = getAllByRole('row');
    await user.click(items[0]);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should support onAction on list and list items', async () => {
    let onAction = jest.fn();
    let itemAction = jest.fn();
    let {getAllByRole} = render(
      <GridList aria-label="Test" onAction={onAction}>
        <GridListItem id="cat" onAction={itemAction}>Cat</GridListItem>
        <GridListItem id="dog">Dog</GridListItem>
        <GridListItem id="kangaroo">Kangaroo</GridListItem>
      </GridList>
    );
    let items = getAllByRole('row');
    await user.click(items[0]);
    expect(onAction).toHaveBeenCalledWith('cat');
    expect(itemAction).toHaveBeenCalledTimes(1);
  });

  it('should support empty state', () => {
    render(
      <GridList aria-label="Test" renderEmptyState={() => 'No results'}>
        {[]}
      </GridList>
    );
    // JSDOM seems to pretend to be WebKit so uses role="group" instead of role="grid".
    let gridList = document.querySelector('.react-aria-GridList');
    expect(gridList).toHaveAttribute('data-empty', 'true');
  });

  it('should support dynamic collections', () => {
    let items = [
      {id: 'cat', name: 'Cat'},
      {id: 'dog', name: 'Dog'}
    ];

    let {getByRole} = render(
      <GridList aria-label="Test" items={items}>
        {(item) => <GridListItem id={item.id}>{item.name}</GridListItem>}
      </GridList>
    );

    let gridList = getByRole('grid');
    expect(within(gridList).getAllByRole('row').map((r) => r.textContent)).toEqual(['Cat', 'Dog']);
  });

  it('should support onScroll', () => {
    let onScroll = jest.fn();
    let {getByRole} = renderGridList({onScroll});
    let grid = getByRole('grid');
    fireEvent.scroll(grid);
    expect(onScroll).toHaveBeenCalled();
  });

  it('should support grid layout', async () => {
    let buttonRef = React.createRef();
    let {getAllByRole} = render(
      <GridList aria-label="Test" layout="grid">
        <GridListItem id="cat">Cat</GridListItem>
        <GridListItem id="dog" textValue="Dog">Dog <Button aria-label="Info" ref={buttonRef}>ⓘ</Button></GridListItem>
        <GridListItem id="kangaroo">Kangaroo</GridListItem>
      </GridList>
    );

    let items = getAllByRole('row');

    await user.tab();
    expect(document.activeElement).toBe(items[0]);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(items[1]);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(items[2]);

    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(items[1]);

    await user.tab();
    expect(document.activeElement).toBe(buttonRef.current);

    await user.tab();
    expect(document.activeElement).toBe(document.body);
  });

  it('should support selectionMode="replace" with checkboxes', async () => {
    let {getAllByRole} = renderGridList({selectionMode: 'multiple', selectionBehavior: 'replace'});
    let items = getAllByRole('row');

    await user.click(items[0]);
    await user.click(items[1]);

    expect(items[0]).toHaveAttribute('aria-selected', 'false');
    expect(items[1]).toHaveAttribute('aria-selected', 'true');
    expect(items[2]).toHaveAttribute('aria-selected', 'false');

    await user.click(within(items[2]).getByRole('checkbox'));

    expect(items[0]).toHaveAttribute('aria-selected', 'false');
    expect(items[1]).toHaveAttribute('aria-selected', 'true');
    expect(items[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('should support virtualizer', async () => {
    let layout = new ListLayout({
      rowHeight: 25
    });

    let items = [];
    for (let i = 0; i < 50; i++) {
      items.push({id: i, name: 'Item ' + i});
    }

    jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 100);
    jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 100);

    let {getByRole, getAllByRole} = render(
      <Virtualizer layout={layout}>
        <GridList aria-label="Test" items={items}>
          {item => <GridListItem>{item.name}</GridListItem>}
        </GridList>
      </Virtualizer>
    );

    let rows = getAllByRole('row');
    expect(rows).toHaveLength(7);
    expect(rows.map(r => r.textContent)).toEqual(['Item 0', 'Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6']);
    for (let row of rows) {
      expect(row).toHaveAttribute('aria-rowindex');
    }

    let grid = getByRole('grid');
    grid.scrollTop = 200;
    fireEvent.scroll(grid);

    rows = getAllByRole('row');
    expect(rows).toHaveLength(8);
    expect(rows.map(r => r.textContent)).toEqual(['Item 7', 'Item 8', 'Item 9', 'Item 10', 'Item 11', 'Item 12', 'Item 13', 'Item 14']);

    await user.tab();
    await user.keyboard('{End}');

    rows = getAllByRole('row');
    expect(rows).toHaveLength(9);
    expect(rows.map(r => r.textContent)).toEqual(['Item 7', 'Item 8', 'Item 9', 'Item 10', 'Item 11', 'Item 12', 'Item 13', 'Item 14', 'Item 49']);
  });

  it('should support rendering a TagGroup inside a GridListItem', async () => {
    let buttonRef = React.createRef();
    let {getAllByRole} = render(
      <GridList aria-label="Test">
        <GridListItem data-test-id="grid-list" id="tags" textValue="tags">
          <TagGroup aria-label="Tag group">
            <TagList>
              <Tag key="1">Tag 1</Tag>
              <Tag key="2">Tag 2</Tag>
              <Tag key="3">Tag 3</Tag>
            </TagList>
          </TagGroup>
        </GridListItem>
        <GridListItem id="dog" textValue="Dog">Dog <Button aria-label="Info" ref={buttonRef}>ⓘ</Button></GridListItem>
        <GridListItem id="kangaroo">Kangaroo</GridListItem>
      </GridList>
    );

    let items = getAllByRole('grid')[0].children;
    let tags = within(items[0]).getAllByRole('row');

    await user.tab();
    expect(document.activeElement).toBe(items[0]);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tags[0]);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tags[1]);

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[1]);

    await user.tab();
    expect(document.activeElement).toBe(buttonRef.current);

    await user.tab();
    expect(document.activeElement).toBe(document.body);
  });

  it('should not propagate the checkbox context from selection into other cells', async () => {
    let tree = render(
      <GridList aria-label="Test" selectionMode="multiple">
        <GridListItem id="dialog" textValue="dialog">
          <DialogTrigger>
            <Button>Open</Button>
            <Modal>
              <Dialog>
                <Checkbox><Label>Agree</Label></Checkbox>
              </Dialog>
            </Modal>
          </DialogTrigger>
        </GridListItem>
        <GridListItem id="dog" textValue="Dog">Dog</GridListItem>
        <GridListItem id="kangaroo">Kangaroo</GridListItem>
      </GridList>
    );

    await user.click(tree.getByRole('button'));
    let checkbox = tree.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('should support nested collections with colliding keys', async () => {
    let {container} = render(
      <GridList aria-label="CardView" keyboardNavigationBehavior="Tab">
        <GridListItem id="1" textValue="Card">
          <GridList aria-label="Previews">
            <GridListItem id="1">Paco de Lucia</GridListItem>
          </GridList>
        </GridListItem>
      </GridList>
    );

    let itemMap = new Map();
    let items = container.querySelectorAll('[data-key]');

    for (let item of items) {
      if (item instanceof HTMLElement) {
        expect(itemMap.has(item.dataset.key)).toBe(false);
        itemMap.set(item.dataset.key, item);
      }
    }
  });

  describe('drag and drop', () => {
    it('should support drag button slot', () => {
      let {getAllByRole} = render(<DraggableGridList />);
      let button = getAllByRole('button')[0];
      expect(button).toHaveAttribute('aria-label', 'Drag Cat');
    });

    it('should render drop indicators', () => {
      let onReorder = jest.fn();
      let {getAllByRole} = render(<DraggableGridList onReorder={onReorder} renderDropIndicator={(target) => <DropIndicator target={target}>Test</DropIndicator>} />);
      let button = getAllByRole('button')[0];
      fireEvent.keyDown(button, {key: 'Enter'});
      fireEvent.keyUp(button, {key: 'Enter'});
      act(() => jest.runAllTimers());

      let rows = getAllByRole('row');
      expect(rows).toHaveLength(5);
      expect(rows[0]).toHaveAttribute('class', 'react-aria-DropIndicator');
      expect(rows[0]).toHaveAttribute('data-drop-target', 'true');
      expect(rows[0]).toHaveTextContent('Test');
      expect(within(rows[0]).getByRole('button')).toHaveAttribute('aria-label', 'Insert before Cat');
      expect(rows[2]).toHaveAttribute('class', 'react-aria-DropIndicator');
      expect(rows[2]).not.toHaveAttribute('data-drop-target');
      expect(within(rows[2]).getByRole('button')).toHaveAttribute('aria-label', 'Insert between Cat and Dog');
      expect(rows[3]).toHaveAttribute('class', 'react-aria-DropIndicator');
      expect(rows[3]).not.toHaveAttribute('data-drop-target');
      expect(within(rows[3]).getByRole('button')).toHaveAttribute('aria-label', 'Insert between Dog and Kangaroo');
      expect(rows[4]).toHaveAttribute('class', 'react-aria-DropIndicator');
      expect(rows[4]).not.toHaveAttribute('data-drop-target');
      expect(within(rows[4]).getByRole('button')).toHaveAttribute('aria-label', 'Insert after Kangaroo');

      fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
      fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

      expect(document.activeElement).toHaveAttribute('aria-label', 'Insert between Cat and Dog');
      expect(rows[0]).not.toHaveAttribute('data-drop-target', 'true');
      expect(rows[2]).toHaveAttribute('data-drop-target', 'true');

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      act(() => jest.runAllTimers());

      expect(onReorder).toHaveBeenCalledTimes(1);
    });

    it('should support dropping on rows', () => {
      let onItemDrop = jest.fn();
      let {getAllByRole} = render(<>
        <DraggableGridList />
        <DraggableGridList onItemDrop={onItemDrop} />
      </>);

      let button = getAllByRole('button')[0];
      fireEvent.keyDown(button, {key: 'Enter'});
      fireEvent.keyUp(button, {key: 'Enter'});
      act(() => jest.runAllTimers());

      let grids = getAllByRole('grid');
      let rows = within(grids[1]).getAllByRole('row');
      expect(rows).toHaveLength(3);
      expect(within(rows[0]).getByRole('button')).toHaveAttribute('aria-label', 'Drop on Cat');
      expect(rows[0].nextElementSibling).toHaveAttribute('data-drop-target', 'true');
      expect(within(rows[1]).getByRole('button')).toHaveAttribute('aria-label', 'Drop on Dog');
      expect(rows[1].nextElementSibling).not.toHaveAttribute('data-drop-target');
      expect(within(rows[2]).getByRole('button')).toHaveAttribute('aria-label', 'Drop on Kangaroo');
      expect(rows[2].nextElementSibling).not.toHaveAttribute('data-drop-target');

      expect(document.activeElement).toBe(within(rows[0]).getByRole('button'));

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      act(() => jest.runAllTimers());

      expect(onItemDrop).toHaveBeenCalledTimes(1);
    });

    it('should support dropping on the root', () => {
      let onRootDrop = jest.fn();
      let {getAllByRole} = render(<>
        <DraggableGridList />
        <DraggableGridList onRootDrop={onRootDrop} />
      </>);

      let button = getAllByRole('button')[0];
      fireEvent.keyDown(button, {key: 'Enter'});
      fireEvent.keyUp(button, {key: 'Enter'});
      act(() => jest.runAllTimers());

      let grids = getAllByRole('grid');
      let rows = within(grids[1]).getAllByRole('row');
      expect(rows).toHaveLength(1);
      expect(within(rows[0]).getByRole('button')).toHaveAttribute('aria-label', 'Drop on');
      expect(document.activeElement).toBe(within(rows[0]).getByRole('button'));
      expect(grids[1]).toHaveAttribute('data-drop-target', 'true');

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});
      act(() => jest.runAllTimers());

      expect(onRootDrop).toHaveBeenCalledTimes(1);
    });
  });

  describe('links', function () {
    describe.each(['mouse', 'keyboard'])('%s', (type) => {
      let trigger = async (item, key = 'Enter') => {
        if (type === 'mouse') {
          await user.click(item);
        } else {
          fireEvent.keyDown(item, {key});
          fireEvent.keyUp(item, {key});
        }
      };

      it('should support links with selectionMode="none"', async function () {
        let {getAllByRole} = render(
          <GridList aria-label="listview">
            <GridListItem href="https://google.com">One</GridListItem>
            <GridListItem href="https://adobe.com">Two</GridListItem>
          </GridList>
        );

        let items = getAllByRole('row');
        for (let item of items) {
          expect(item.tagName).not.toBe('A');
          expect(item).toHaveAttribute('data-href');
        }

        let onClick = mockClickDefault();
        await trigger(items[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
        expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');
      });

      it.each(['single', 'multiple'])('should support links with selectionBehavior="toggle" selectionMode="%s"', async function (selectionMode) {
        let {getAllByRole} = render(
          <GridList aria-label="listview" selectionMode={selectionMode}>
            <GridListItem href="https://google.com" textValue="one"><Checkbox slot="selection" /> One</GridListItem>
            <GridListItem href="https://adobe.com" textValue="two"><Checkbox slot="selection" /> Two</GridListItem>
          </GridList>
        );

        let items = getAllByRole('row');
        for (let item of items) {
          expect(item.tagName).not.toBe('A');
          expect(item).toHaveAttribute('data-href');
        }

        let onClick = mockClickDefault();
        await trigger(items[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
        expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');

        await user.click(within(items[0]).getByRole('checkbox'));
        expect(items[0]).toHaveAttribute('aria-selected', 'true');

        await trigger(items[1], ' ');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(items[1]).toHaveAttribute('aria-selected', 'true');
      });

      it.each(['single', 'multiple'])('should support links with selectionBehavior="replace" selectionMode="%s"', async function (selectionMode) {
        let {getAllByRole} = render(
          <GridList aria-label="listview" selectionMode={selectionMode} selectionBehavior="replace">
            <GridListItem href="https://google.com">One</GridListItem>
            <GridListItem href="https://adobe.com">Two</GridListItem>
          </GridList>
        );

        let items = getAllByRole('row');
        for (let item of items) {
          expect(item.tagName).not.toBe('A');
          expect(item).toHaveAttribute('data-href');
        }

        let onClick = mockClickDefault();
        if (type === 'mouse') {
          await user.click(items[0]);
        } else {
          fireEvent.keyDown(items[0], {key: ' '});
          fireEvent.keyUp(items[0], {key: ' '});
        }
        expect(onClick).not.toHaveBeenCalled();
        expect(items[0]).toHaveAttribute('aria-selected', 'true');

        if (type === 'mouse') {
          await user.dblClick(items[0], {pointerType: 'mouse'});
        } else {
          fireEvent.keyDown(items[0], {key: 'Enter'});
          fireEvent.keyUp(items[0], {key: 'Enter'});
        }
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].target).toBeInstanceOf(HTMLAnchorElement);
        expect(onClick.mock.calls[0][0].target.href).toBe('https://google.com/');
      });

      it('should work with RouterProvider', async () => {
        let navigate = jest.fn();
        let useHref = href => '/base' + href;
        let {getAllByRole} = render(
          <RouterProvider navigate={navigate} useHref={useHref}>
            <GridList aria-label="listview">
              <GridListItem href="/foo" routerOptions={{foo: 'bar'}}>One</GridListItem>
            </GridList>
          </RouterProvider>
        );

        let items = getAllByRole('row');
        expect(items[0]).toHaveAttribute('data-href', '/base/foo');
        await trigger(items[0]);
        expect(navigate).toHaveBeenCalledWith('/foo', {foo: 'bar'});
      });
    });
  });
});
