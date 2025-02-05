/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

jest.mock('@react-aria/live-announcer');
import {
  act,
  fireEvent, installPointerEvent,
  pointerMap,
  render as renderComponent,
  waitFor,
  within
} from '@react-spectrum/test-utils-internal';
import {Cell, Column, Row, TableBody, TableHeader, TableView} from '../';
import {CUSTOM_DRAG_TYPE} from '@react-aria/dnd/src/constants';
import {DataTransfer, DataTransferItem, DragEvent, FileSystemDirectoryEntry, FileSystemFileEntry} from '@react-aria/dnd/test/mocks';
import {DIRECTORY_DRAG_TYPE} from '@react-aria/dnd';
import {DragBetweenTablesComplex} from '../stories/TableDnDUtilExamples';
import {DragBetweenTablesExample, DragBetweenTablesRootOnlyExample, DragExample, DragOntoRowExample, DragWithoutRowHeaderExample, ReorderExample} from '../stories/TableDnDExamples';
import {Droppable} from '@react-aria/dnd/test/examples';
import {Flex} from '@react-spectrum/layout';
import {globalDndState} from '@react-aria/dnd/src/utils';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import {useDragAndDrop} from '@react-spectrum/dnd';
import {useListData} from '@react-stately/data';
import userEvent from '@testing-library/user-event';

let isReact18 = parseInt(React.version, 10) >= 18;

describe('TableView', function () {
  let offsetWidth, offsetHeight, scrollHeight;
  let onSelectionChange = jest.fn();
  let onDragStart = jest.fn();
  let onDragMove = jest.fn();
  let onDragEnd = jest.fn();
  let onDrop = jest.fn();
  let onReorder = jest.fn();
  let onInsert = jest.fn();
  let onItemDrop = jest.fn();
  let onRootDrop = jest.fn();
  let getDropOperation = jest.fn();
  let mockUtilityOptions = {
    onInsert: async (e) => onInsert(e),
    onReorder: async (e) => onReorder(e),
    onItemDrop: async (e) => onItemDrop(e),
    onRootDrop: async (e) => onRootDrop(e)
  };
  let user;

  let checkSelection = (onSelectionChange, selectedKeys) => {
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(selectedKeys));
  };

  beforeAll(function () {
    user = userEvent.setup({delay: null, pointerMap});
    offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    scrollHeight = jest.spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => 40);
    jest.useFakeTimers();
  });

  afterEach(function () {
    fireEvent.keyDown(document.activeElement, {key: 'Escape'});
    fireEvent.keyUp(document.activeElement, {key: 'Escape'});
    jest.clearAllMocks();
  });

  afterAll(function () {
    offsetWidth.mockReset();
    offsetHeight.mockReset();
    scrollHeight.mockReset();
  });

  let render = (children, locale = 'en-US', scale = 'medium') => {
    let tree = renderComponent(
      <Provider theme={theme} scale={scale} locale={locale}>
        {children}
      </Provider>
  );
    // Allow for Virtualizer layout to update
    act(() => {jest.runAllTimers();});
    return {
      ...tree,
      rerender(el) {
        return tree.rerender(<Provider theme={theme} scale={scale} locale={locale}>{el}</Provider>);
      }
    };
  };

  let moveFocus = (key, opts = {}) => {
    fireEvent.keyDown(document.activeElement, {key, ...opts});
    fireEvent.keyUp(document.activeElement, {key, ...opts});
  };

  describe('drag and drop', function () {
    function DraggableTableView(props) {
      let {dragHookOptions, tableViewProps} = props;
      return (
        <>
          <Droppable onDrop={onDrop} />
          <DragExample dragHookOptions={{onDragStart, onDragMove, onDragEnd, ...dragHookOptions}} tableViewProps={{onSelectionChange, ...tableViewProps}} />
        </>
      );
    }

    function DraggbleWithoutRowHeader(props) {
      return (
        <DragWithoutRowHeaderExample onDrop={onDrop} onDragStart={onDragStart} onDragEnd={onDragEnd} {...props} />
      );
    }

    function Reorderable(props) {
      return (
        <ReorderExample disabledKeys={['a']} onDrop={onDrop} onDragStart={onDragStart} onDragEnd={onDragEnd} {...props} />
      );
    }

    function DragBetweenTables(props) {
      return (
        <DragBetweenTablesExample onDrop={onDrop} onDragStart={onDragStart} onDragEnd={onDragEnd} {...props} />
      );
    }

    beforeEach(() => {
      jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        left: 0,
        top: 0,
        x: 0,
        y: 0,
        width: 100,
        height: 50
      }));
    });

    afterEach(() => {
      act(() => {jest.runAllTimers();});
      jest.clearAllMocks();
    });

    describe('via mouse', function () {
      it('should show a default drag preview on drag', function () {
        let {getByRole, getAllByText} = render(
          <DraggableTableView />
        );

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let row = rows[0];
        let cell = within(row).getAllByRole('rowheader')[0];
        let cellText = getAllByText(cell.textContent);
        expect(cellText).toHaveLength(1);

        let dataTransfer = new DataTransfer();

        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 5, clientY: 5});
        // TODO: fireEvent.dragStart(cell, {dataTransfer, clientX: 5, clientY: 5}) doesn't propagate the clientX and Y values,
        // test if upgrading testing library/jsdom fixes issue
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 5, clientY: 5}));
        expect(dataTransfer._dragImage.x).toBe(5);
        expect(dataTransfer._dragImage.y).toBe(5);

        cellText = getAllByText(cell.textContent);
        expect(cellText).toHaveLength(1);
        fireEvent.pointerUp(cell, {button: 0, pointerId: 1, clientX: 5, clientY: 5});
        fireEvent(cell, new DragEvent('dragend', {dataTransfer, clientX: 5, clientY: 5}));

        act(() => {jest.runAllTimers();});
        cellText = getAllByText(cell.textContent);
        expect(cellText).toHaveLength(1);
      });

      it('should render a custom drag preview', function () {
        let renderPreview = jest.fn().mockImplementation((keys, draggedKey) => <div>Custom preview for [{[...keys].join(', ')}] , while dragging {draggedKey}.</div>);
        let {getByRole} = render(
          <DraggableTableView dragHookOptions={{renderPreview}} tableViewProps={{selectedKeys: ['a', 'b']}} />
        );

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let row = rows[0];
        let cell = within(row).getAllByRole('rowheader')[0];

        let dataTransfer = new DataTransfer();

        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 5, clientY: 5});
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 5, clientY: 5}));
        expect(dataTransfer._dragImage.node.tagName).toBe('DIV');
        expect(dataTransfer._dragImage.node.textContent).toBe('Custom preview for [a, b] , while dragging a.');
        expect(dataTransfer._dragImage.x).toBe(5);
        expect(dataTransfer._dragImage.y).toBe(5);
      });

      it('should render a drag preview with highlight selection style', function () {
        let {getByRole, getAllByText} = render(
          <DraggbleWithoutRowHeader tableViewProps={{selectedKeys: ['a'], selectionStyle: 'highlight'}} />
        );

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let row = rows[0];
        let cell = within(row).getAllByRole('rowheader')[0];
        let cellText = getAllByText(cell.textContent);
        expect(cellText).toHaveLength(1);

        let dataTransfer = new DataTransfer();

        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 5, clientY: 5});
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 5, clientY: 5}));
        expect(dataTransfer._dragImage.node.tagName).toBe('DIV');

        // Verify that when no rowHeader is set, the drag preview displays the text of the first element of the row
        expect(dataTransfer._dragImage.node.textContent).toBe('Vin');
        expect(dataTransfer._dragImage.x).toBe(5);
        expect(dataTransfer._dragImage.y).toBe(5);
      });

      it('should render a drag preview with checkbox selection style', function () {
        let {getByRole, getAllByText} = render(
          <DraggbleWithoutRowHeader tableViewProps={{selectedKeys: ['a'], selectionStyle: 'checkbox'}} />
        );

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let row = rows[0];
        let cell = within(row).getAllByRole('rowheader')[0];
        let cellText = getAllByText(cell.textContent);
        expect(cellText).toHaveLength(1);

        let dataTransfer = new DataTransfer();

        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 5, clientY: 5});
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 5, clientY: 5}));

        // Verify that when no rowHeader is set, the drag preview displays the text of the first element of the row
        expect(dataTransfer._dragImage.node.tagName).toBe('DIV');
        expect(dataTransfer._dragImage.node.textContent).toBe('Vin');
        expect(dataTransfer._dragImage.x).toBe(5);
        expect(dataTransfer._dragImage.y).toBe(5);
      });


      it('should allow drag and drop of a single row', async function () {
        let {getByRole, getByText} = render(
          <DraggableTableView />
        );

        let droppable = getByText('Drop here');
        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let row = rows[0];
        expect(row).toHaveAttribute('draggable', 'true');
        let cell = within(row).getAllByRole('rowheader')[0];
        expect(cell).toHaveTextContent('Vin');

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        expect([...dataTransfer.items]).toEqual([new DataTransferItem('text/plain', 'Vin Charlet')]);

        act(() => jest.runAllTimers());

        expect(onDragStart).toHaveBeenCalledTimes(1);
        expect(onDragStart).toHaveBeenCalledWith({
          type: 'dragstart',
          keys: new Set('a'),
          x: 0,
          y: 0
        });

        fireEvent.pointerMove(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
        fireEvent(cell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
        expect(onDragMove).toHaveBeenCalledTimes(1);
        expect(onDragMove).toHaveBeenCalledWith({
          type: 'dragmove',
          keys: new Set('a'),
          x: 1,
          y: 1
        });

        fireEvent(droppable, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 1}));
        fireEvent.pointerUp(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
        fireEvent(droppable, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
        fireEvent(cell, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 1}));
        act(() => jest.runAllTimers());
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop).toHaveBeenCalledWith({
          type: 'drop',
          x: 1,
          y: 1,
          dropOperation: 'move',
          items: [
            {
              kind: 'text',
              types: new Set(['text/plain']),
              getText: expect.any(Function)
            }
          ]
        });

        expect(await onDrop.mock.calls[0][0].items[0].getText('text/plain')).toBe('Vin Charlet');
        expect(onDragEnd).toHaveBeenCalledTimes(1);
        expect(onDragEnd).toHaveBeenCalledWith({
          type: 'dragend',
          keys: new Set('a'),
          x: 1,
          y: 1,
          dropOperation: 'move',
          isInternal: false
        });
      });

      it('should allow drag and drop of multiple rows', async function () {
        let {getByRole, getByText} = render(
          <DraggableTableView />
        );

        let droppable = getByText('Drop here');
        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');

        let cellA = within(rows[0]).getAllByRole('rowheader')[0];
        expect(cellA).toHaveTextContent('Vin');
        expect(rows[0]).toHaveAttribute('draggable', 'true');

        let cellB = within(rows[1]).getAllByRole('rowheader')[0];
        expect(cellB).toHaveTextContent('Lexy');
        expect(rows[1]).toHaveAttribute('draggable', 'true');

        let cellC = within(rows[2]).getAllByRole('rowheader')[0];
        expect(cellC).toHaveTextContent('Robbi');
        expect(rows[2]).toHaveAttribute('draggable', 'true');

        let cellD = within(rows[3]).getAllByRole('rowheader')[0];
        expect(cellD).toHaveTextContent('Dodie');
        expect(rows[3]).toHaveAttribute('draggable', 'true');

        await user.click(within(rows[0]).getByRole('checkbox'));
        await user.click(within(rows[1]).getByRole('checkbox'));
        await user.click(within(rows[2]).getByRole('checkbox'));
        await user.click(within(rows[3]).getByRole('checkbox'));

        expect(new Set(onSelectionChange.mock.calls[3][0])).toEqual(new Set(['a', 'b', 'c', 'd']));


        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cellA, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(cellA, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        expect([...dataTransfer.items]).toEqual([
          new DataTransferItem('text/plain', 'Vin Charlet\nLexy Maddison\nRobbi Persence\nDodie Hurworth'),
          new DataTransferItem(
            CUSTOM_DRAG_TYPE,
            JSON.stringify([{'text/plain': 'Vin Charlet'}, {'text/plain': 'Lexy Maddison'}, {'text/plain': 'Robbi Persence'}, {'text/plain': 'Dodie Hurworth'}]
            ))
        ]);

        act(() => jest.runAllTimers());

        expect(onDragStart).toHaveBeenCalledTimes(1);
        expect(onDragStart).toHaveBeenCalledWith({
          type: 'dragstart',
          keys: new Set(['a', 'b', 'c', 'd']),
          x: 0,
          y: 0
        });

        fireEvent.pointerMove(cellA, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
        fireEvent(cellA, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
        expect(onDragMove).toHaveBeenCalledTimes(1);
        expect(onDragMove).toHaveBeenCalledWith({
          type: 'dragmove',
          keys: new Set(['a', 'b', 'c', 'd']),
          x: 1,
          y: 1
        });

        fireEvent(droppable, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 1}));
        fireEvent.pointerUp(cellA, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
        fireEvent(droppable, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
        fireEvent(cellA, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 1}));

        act(() => jest.runAllTimers());
        expect(onDrop).toHaveBeenCalledTimes(1);

        expect(await onDrop.mock.calls[0][0].items).toHaveLength(4);
        expect(await onDrop.mock.calls[0][0].items[0].getText('text/plain')).toBe('Vin Charlet');
        expect(await onDrop.mock.calls[0][0].items[1].getText('text/plain')).toBe('Lexy Maddison');
        expect(await onDrop.mock.calls[0][0].items[2].getText('text/plain')).toBe('Robbi Persence');
        expect(await onDrop.mock.calls[0][0].items[3].getText('text/plain')).toBe('Dodie Hurworth');
        expect(onDragEnd).toHaveBeenCalledTimes(1);
        expect(onDragEnd).toHaveBeenCalledWith({
          type: 'dragend',
          keys: new Set(['a', 'b', 'c', 'd']),
          x: 1,
          y: 1,
          dropOperation: 'move',
          isInternal: false
        });
      });

      it('should allow drag operations on a disabled row with disabledBehavior="selection"', function () {
        let {getByRole} = render(
          <DraggableTableView tableViewProps={{disabledBehavior: 'selection', disabledKeys: ['a']}} />
        );

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let row = rows[0];
        let cell = within(row).getAllByRole('rowheader')[0];
        expect(cell).toHaveTextContent('Vin');
        expect(row).toHaveAttribute('draggable', 'true');

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        expect(onDragStart).toHaveBeenCalledTimes(1);
      });

      it('should not allow drag operations on a disabled row with disabledBehavior="all"', function () {
        let {getByRole} = render(
          <DraggableTableView tableViewProps={{disabledBehavior: 'all', disabledKeys: ['a']}} />
        );

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let row = rows[0];
        let cell = within(row).getAllByRole('rowheader')[0];
        expect(cell).toHaveTextContent('Vin');
        expect(row).not.toHaveAttribute('draggable', 'true');

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        expect(onDragStart).toHaveBeenCalledTimes(0);
      });

      describe('pointer event implementation needed for this', () => {
        installPointerEvent();
        it('should not allow dragging when not selected when it conflicts with onAction', async function () {
          let onAction = jest.fn();
          let {getByRole} = render(
            <DraggableTableView tableViewProps={{onAction}} />
          );

          let grid = getByRole('grid');
          let rowgroups = within(grid).getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = within(rows[2]).getAllByRole('rowheader')[0];
          let dataTransfer = new DataTransfer();
          let event = new DragEvent('dragstart', {dataTransfer, clientX: 5, clientY: 5});

          fireEvent.pointerDown(cell, {pointerType: 'touch', button: 0, pointerId: 1, clientX: 5, clientY: 5});
          fireEvent(cell, event);

          expect(event.defaultPrevented).toBe(true);
          expect(dataTransfer.items._items).toHaveLength(0);
        });
      });

      it('should update the global DnD state properly if dropping on a non-collection', async function () {
        let {getByRole, getByText} = render(
          <DraggableTableView />
        );

        let droppable = getByText('Drop here');
        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');

        await user.click(within(rows[0]).getByRole('checkbox'));
        await user.click(within(rows[1]).getByRole('checkbox'));
        await user.click(within(rows[2]).getByRole('checkbox'));
        await user.click(within(rows[3]).getByRole('checkbox'));

        expect(new Set(onSelectionChange.mock.calls[3][0])).toEqual(new Set(['a', 'b', 'c', 'd']));

        let cellA = within(rows[0]).getAllByRole('rowheader')[0];

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cellA, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(cellA, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));

        let dndState = globalDndState;
        expect(dndState).toEqual({draggingCollectionRef: expect.any(Object), draggingKeys: new Set(['a', 'b', 'c', 'd'])});
        expect(dndState.draggingCollectionRef.current).toBe(grid);
        act(() => jest.runAllTimers());

        fireEvent.pointerMove(cellA, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
        fireEvent(cellA, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));

        fireEvent(droppable, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 1}));
        dndState = globalDndState;
        expect(dndState).toEqual({draggingCollectionRef: expect.any(Object), draggingKeys: new Set(['a', 'b', 'c', 'd'])});
        expect(dndState.draggingCollectionRef.current).toBe(grid);
        fireEvent.pointerUp(cellA, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
        fireEvent(droppable, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
        fireEvent(cellA, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 1}));

        act(() => jest.runAllTimers());
        dndState = globalDndState;
        expect(dndState).toEqual({draggingKeys: new Set()});
        expect(onDragEnd).toHaveBeenCalledTimes(1);
      });

      it('should reset the global drop state on drag end even if a drop doesn\'t happen', async function () {
        let {getByRole} = render(
          <DraggableTableView />
        );

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        await user.click(within(rows[0]).getByRole('checkbox'));
        let cellA = within(rows[0]).getAllByRole('rowheader')[0];

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cellA, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(cellA, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));

        let dndState = globalDndState;
        expect(dndState).toEqual({draggingCollectionRef: expect.any(Object), draggingKeys: new Set(['a'])});
        expect(dndState.draggingCollectionRef.current).toBe(grid);
        act(() => jest.runAllTimers());

        fireEvent.pointerMove(cellA, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
        fireEvent(cellA, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));

        fireEvent.pointerUp(cellA, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
        fireEvent(cellA, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 1}));
        act(() => jest.runAllTimers());
        dndState = globalDndState;
        expect(dndState).toEqual({draggingKeys: new Set()});
        expect(onDragEnd).toHaveBeenCalledTimes(1);
      });

      it('should reset the global drop state on drop if a dragged item is a non RSP drag target', function () {
        let {getAllByRole} = render(
          <DragBetweenTablesComplex secondTableDnDOptions={{getDropOperation: () => 'copy', onDrop, acceptedDragTypes: 'all'}} />
        );

        let grids = getAllByRole('grid');
        let dataTransfer = new DataTransfer();
        let file = new File(['hello world'], 'test.abc', {type: ''});
        dataTransfer.items.add(file);

        fireEvent(grids[1], new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 1}));
        let dndState = globalDndState;
        expect(dndState).toEqual({draggingKeys: new Set(), dropCollectionRef: expect.any(Object)});
        expect(dndState.dropCollectionRef.current).toBe(grids[1]);

        fireEvent(grids[1], new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
        act(() => jest.runAllTimers());
        dndState = globalDndState;
        expect(dndState).toEqual({
          draggingKeys: new Set()
        });
      });

      it('should update the dropCollectionRef during drag operations', async function () {
        let {getAllByRole} = render(
          <DragBetweenTablesComplex />
        );

        let grid = getAllByRole('grid')[0];
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let internalFolder = rows[2];

        await user.click(within(rows[0]).getByRole('checkbox'));
        let dragCell = within(rows[0]).getAllByRole('rowheader')[0];
        let dataTransfer = new DataTransfer();

        // Dragging over a invalid drop target should not update dropCollectionRef
        fireEvent.pointerDown(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(dragCell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        act(() => jest.runAllTimers());
        fireEvent.pointerMove(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
        fireEvent(dragCell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
        fireEvent(rows[1], new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 50}));

        let dndState = globalDndState;
        expect(dndState.dropCollectionRef).toBeFalsy();

        // Dragging over a valid drop target should update dropCollectionRef
        fireEvent(internalFolder, new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 100}));
        dndState = globalDndState;
        // TODO
        // expect(dndState.dropCollectionRef.current).toBe(grid);

        // Leaving a valid drop target should clear the dropCollectionRef
        fireEvent(internalFolder, new DragEvent('dragleave', {dataTransfer, clientX: 1, clientY: 100}));
        dndState = globalDndState;
        expect(dndState.dropCollectionRef).toBeFalsy();
      });

      describe('using util handlers', function () {
        async function dragWithinList(rows, dropTarget, targetX = 1, targetY = 1) {
          await user.click(within(rows[0]).getByRole('checkbox'));
          await user.click(within(rows[1]).getByRole('checkbox'));
          let dragCell = within(rows[0]).getAllByRole('rowheader')[0];

          let dataTransfer = new DataTransfer();
          fireEvent.pointerDown(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
          fireEvent(dragCell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));

          act(() => jest.runAllTimers());
          expect(onReorder).toHaveBeenCalledTimes(0);
          fireEvent.pointerMove(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
          fireEvent(dragCell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent(dropTarget, new DragEvent('dragover', {dataTransfer, clientX: targetX, clientY: targetY}));
          fireEvent.pointerUp(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: targetX, clientY: targetY}));
          fireEvent(dragCell, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 1}));
          act(() => jest.runAllTimers());
        }

        async function dragBetweenLists(sourceRows, dropTarget, targetX = 1, targetY = 1) {
          await user.click(within(sourceRows[0]).getByRole('checkbox'));
          await user.click(within(sourceRows[1]).getByRole('checkbox'));

          let dragCell = within(sourceRows[0]).getAllByRole('rowheader')[0];

          let dataTransfer = new DataTransfer();
          fireEvent.pointerDown(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
          fireEvent(dragCell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));

          act(() => jest.runAllTimers());
          expect(onInsert).toHaveBeenCalledTimes(0);
          fireEvent.pointerMove(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
          fireEvent(dragCell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent(dropTarget, new DragEvent('dragover', {dataTransfer, clientX: targetX, clientY: targetY}));
          fireEvent.pointerUp(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: targetX, clientY: targetY}));
          fireEvent(dragCell, new DragEvent('dragend', {dataTransfer, clientX: targetX, clientY: targetY}));
          act(() => jest.runAllTimers());
        }

        it('should call onInsert when dropping between rows in a different table', async function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={mockUtilityOptions} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');

          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[0];
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget, 1, 35);

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(1);
          expect(onInsert).toHaveBeenCalledWith({
            dropOperation: 'move',
            target: {
              key: '1',
              dropPosition: 'before',
              type: 'item'
            },
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'folder']),
                getText: expect.any(Function)
              },
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          let items = await Promise.all(onInsert.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).toContainObject({
            identifier: '7',
            type: 'folder',
            name: 'Pictures',
            childNodes: []
          });
          expect(items).toContainObject({
            identifier: '8',
            type: 'file',
            name: 'Adobe Fresco'
          });
        });

        it('should allow a user to perform an internal copy drop operation', async function () {
          // The real world scenario is a user dragging an item within the source collection while holding the option key to perform a copy drop
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, getAllowedDropOperations: () => ['copy']}} />
          );

          let grids = getAllByRole('grid');
          let rowgroups = within(grids[0]).getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let dropTarget = rows[4];
          await dragWithinList(rows, dropTarget, 1, 185);

          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onReorder).toHaveBeenCalledTimes(1);
          expect(onReorder).toHaveBeenCalledWith({
            target: {
              key: '4',
              dropPosition: 'after',
              type: 'item'
            },
            keys: new Set(['1', '2']),
            dropOperation: 'copy'
          });
        });

        it('should call onReorder when performing a insert drop in the source table', async function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={mockUtilityOptions} />
          );

          let grids = getAllByRole('grid');
          let rowgroups = within(grids[0]).getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let dropTarget = rows[4];
          await dragWithinList(rows, dropTarget, 1, 185);
          expect(onReorder).toHaveBeenCalledTimes(1);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onReorder).toHaveBeenCalledWith({
            target: {
              key: '4',
              dropPosition: 'after',
              type: 'item'
            },
            keys: new Set(['1', '2']),
            dropOperation: 'move'
          });
        });

        it('should call onRootDrop when dropping on the table root', async function () {
          // make onInsert null otherwise it will attempt to do insert operations
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, onInsert: null}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = grids[0];
          let rowgroups = within(grids[1]).getAllByRole('rowgroup');
          let table2Rows = within(rowgroups[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget);
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(1);
          expect(onRootDrop).toHaveBeenCalledWith({
            dropOperation: 'move',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'folder']),
                getText: expect.any(Function)
              },
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          let items = await Promise.all(onRootDrop.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).toContainObject({
            identifier: '7',
            type: 'folder',
            name: 'Pictures',
            childNodes: []
          });
          expect(items).toContainObject({
            identifier: '8',
            type: 'file',
            name: 'Adobe Fresco'
          });
        });

        it('should call onRootDrop when dropping on a empty table', async function () {
          function Example() {
            let columns = [
              {id: 'id', value: 'ID'},
              {id: 'name', value: 'Name'},
              {id: 'type', value: 'Type'}
            ];

            let list1 = useListData({
              initialItems: []
            });

            let list2 = useListData({
              initialItems: [
                {id: '7', type: 'folder', name: 'Pictures'},
                {id: '8', type: 'file', name: 'Adobe Fresco'},
                {id: '9', type: 'folder', name: 'Apps'},
                {id: '10', type: 'file', name: 'Adobe Illustrator'},
                {id: '11', type: 'file', name: 'Adobe Lightroom'},
                {id: '12', type: 'file', name: 'Adobe Dreamweaver'}
              ]
            });

            let {dragAndDropHooks: table1Hooks} = useDragAndDrop({
              ...mockUtilityOptions,
              acceptedDragTypes: 'all'
            });

            let {dragAndDropHooks: table2Hooks} = useDragAndDrop({
              getItems: (keys) => [...keys].map(key => {
                let item = list2.getItem(key);
                return {
                  [`${item.type}`]: JSON.stringify(item),
                  'text/plain': JSON.stringify(item)
                };
              })
            });

            return (
              <Flex wrap gap="size-300">
                <TableView
                  aria-label="Droppable TableView"
                  selectionMode="multiple"
                  width="size-3600"
                  height="size-3600"
                  dragAndDropHooks={table1Hooks}>
                  <TableHeader columns={columns}>
                    {column => <Column minWidth={100} isRowHeader={column.id === 'name'}>{column.name}</Column>}
                  </TableHeader>
                  <TableBody items={list1.items}>
                    {item => (
                      <Row key={item.id} textValue={item.name}>
                        {key => <Cell>{item[key]}</Cell>}
                      </Row>
                    )}
                  </TableBody>
                </TableView>
                <TableView
                  aria-label="Draggable TableView"
                  selectionMode="multiple"
                  width="size-3600"
                  height="size-3600"
                  dragAndDropHooks={table2Hooks}>
                  <TableHeader columns={columns}>
                    {column => <Column minWidth={100} isRowHeader={column.id === 'name'}>{column.name}</Column>}
                  </TableHeader>
                  <TableBody items={list2.items}>
                    {item => (
                      <Row key={item.id} textValue={`${item.first_name} ${item.last_name}`}>
                        {key => <Cell>{item[key]}</Cell>}
                      </Row>
                    )}
                  </TableBody>
                </TableView>
              </Flex>
            );
          }

          let {getAllByRole} = render(
            <Example />
          );
          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = grids[0];
          let rowgroups = within(grids[1]).getAllByRole('rowgroup');
          let table2Rows = within(rowgroups[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget);
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(1);
          expect(onRootDrop).toHaveBeenCalledWith({
            dropOperation: 'move',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'folder']),
                getText: expect.any(Function)
              },
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          let items = await Promise.all(onRootDrop.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).toContainObject({
            id: '7',
            type: 'folder',
            name: 'Pictures'
          });
          expect(items).toContainObject({
            id: '8',
            type: 'file',
            name: 'Adobe Fresco'
          });
        });

        it('should call onItemDrop when dropping on a folder in the table', async function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={mockUtilityOptions} secondTableDnDOptions={{onDragEnd}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[4];
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget, 1, 220);
          expect(onDragEnd).toHaveBeenCalledTimes(1);
          expect(onDragEnd).toHaveBeenCalledWith({
            type: 'dragend',
            keys: new Set(['7', '8']),
            x: 1,
            y: 220,
            dropOperation: 'move',
            isInternal: false
          });
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(1);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledWith({
            target: {
              key: '5',
              dropPosition: 'on',
              type: 'item'
            },
            isInternal: false,
            dropOperation: 'move',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'folder']),
                getText: expect.any(Function)
              },
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          let items = await Promise.all(onItemDrop.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).toContainObject({
            identifier: '7',
            type: 'folder',
            name: 'Pictures',
            childNodes: []
          });
          expect(items).toContainObject({
            identifier: '8',
            type: 'file',
            name: 'Adobe Fresco'
          });

          let table1Rows = within(rowgroups1[1]).getAllByRole('row');
          dropTarget = within(rowgroups1[1]).getAllByRole('row')[2];
          await dragWithinList(table1Rows, dropTarget, 1, 135);
          expect(onItemDrop).toHaveBeenCalledWith({
            target: {
              key: '3',
              dropPosition: 'on',
              type: 'item'
            },
            isInternal: true,
            dropOperation: 'move',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              },
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          items = await Promise.all(onItemDrop.mock.calls[1][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).toContainObject({
            identifier: '1',
            type: 'file',
            name: 'Adobe Photoshop'
          });
          expect(items).toContainObject({
            identifier: '2',
            type: 'file',
            name: 'Adobe XD'
          });
        });

        it('should allow acceptedDragTypes to specify what drag items the table should accept', async function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, acceptedDragTypes: ['randomType']}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[0];
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget);
          // Shouldn't allow a insert because the type from 2nd table isn't of "randomType"
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
        });

        it('should default acceptedDragTypes to "all" if not provided by the user', async function () {
          let shouldAcceptItemDrop = jest.fn();
          shouldAcceptItemDrop.mockReturnValue(true);
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, acceptedDragTypes: undefined, shouldAcceptItemDrop}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[4];
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget, 1, 185);

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(1);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledWith({
            target: {
              key: '4',
              dropPosition: 'on',
              type: 'item'
            },
            isInternal: false,
            dropOperation: 'move',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'folder']),
                getText: expect.any(Function)
              },
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });

          // // Called twice from getDropOperation and twice in onDrop when performing item filtering
          expect(shouldAcceptItemDrop).toHaveBeenCalledTimes(4);
          expect(shouldAcceptItemDrop.mock.calls[0][0]).toEqual({key: '4', dropPosition: 'on', type: 'item'});
          expect(shouldAcceptItemDrop.mock.calls[1][0]).toEqual({key: '4', dropPosition: 'on', type: 'item'});
          expect(shouldAcceptItemDrop.mock.calls[2][0]).toEqual({key: '4', dropPosition: 'on', type: 'item'});
          expect(shouldAcceptItemDrop.mock.calls[2][1]).toEqual(new Set(['text/plain', 'folder']));
          expect(shouldAcceptItemDrop.mock.calls[3][0]).toEqual({key: '4', dropPosition: 'on', type: 'item'});
          expect(shouldAcceptItemDrop.mock.calls[3][1]).toEqual(new Set(['text/plain', 'file']));
        });

        it('should allow the user to specify what a valid drop target is via shouldAcceptItemDrop', async function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex
              firstTableDnDOptions={{...mockUtilityOptions, shouldAcceptItemDrop: () => false}}
              secondTableDnDOptions={{onDragEnd}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          // Perform same drop operation as the onItemDrop test, but this time it should do a insertion drop since we are disallowing all "on" drops
          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[4];
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget, 1, 185);
          expect(onDragEnd).toHaveBeenCalledTimes(1);
          expect(onDragEnd).toHaveBeenCalledWith({
            type: 'dragend',
            keys: new Set(['7', '8']),
            x: 1,
            y: 185,
            dropOperation: 'move',
            isInternal: false
          });
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);

          expect(onInsert).toHaveBeenCalledTimes(1);
          expect(onInsert).toHaveBeenCalledWith({
            dropOperation: 'move',
            target: {
              key: '4',
              dropPosition: 'after',
              type: 'item'
            },
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'folder']),
                getText: expect.any(Function)
              },
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
        });

        it('should automatically disallow various drops if their respective util handler isn\'t provided', async function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, onReorder: null, onItemDrop: null, onRootDrop: null, onInsert: null}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[4];
          let table1Rows = within(rowgroups1[1]).getAllByRole('row', {hidden: true});
          expect(table1Rows).toHaveLength(6);
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await user.click(within(table2Rows[0]).getByRole('checkbox'));
          await user.click(within(table2Rows[1]).getByRole('checkbox'));
          let dragCell = within(table2Rows[0]).getAllByRole('rowheader')[0];

          let dataTransfer = new DataTransfer();
          fireEvent.pointerDown(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
          fireEvent(dragCell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));

          act(() => jest.runAllTimers());
          expect(onInsert).toHaveBeenCalledTimes(0);
          fireEvent.pointerMove(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
          fireEvent(dragCell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent(dropTarget, new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent.pointerUp(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});

          grids = getAllByRole('grid');
          rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          table1Rows = within(rowgroups1[1]).getAllByRole('row', {hidden: true});
          // Row number shouldn't increase since the utility handlers have been disabled and thus drop indicators don't appear
          expect(table1Rows).toHaveLength(6);
        });

        it('should allow the user to override the util handlers via onDrop and getDropOperations', async function () {
          let getDropOperationMock = () => {
            getDropOperation();
            return 'copy';
          };
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, onDrop, getDropOperation: getDropOperationMock}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);
          expect(getDropOperation).toHaveBeenCalledTimes(0);

          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[0];
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget);

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onDrop).toHaveBeenCalledTimes(1);
          expect(getDropOperation.mock.calls.length).toBeGreaterThan(0);
        });

        it('should be able to perform drops if onDrop is provided without getDropOperation', async function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, onDrop, acceptedDragTypes: 'all'}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[0];
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget);

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onDrop).toHaveBeenCalledTimes(1);
        });

        it('should be able to perform drops if getDropOperation is provided without onDrop', async function () {
          let getDropOperationMock = () => {
            getDropOperation();
            return 'copy';
          };
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, getDropOperation: getDropOperationMock}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);
          expect(getDropOperation).toHaveBeenCalledTimes(0);

          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[0];
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget, 1, 35);

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(1);
          expect(onInsert).toHaveBeenCalledWith({
            dropOperation: 'copy',
            target: {
              key: '1',
              dropPosition: 'before',
              type: 'item'
            },
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'folder']),
                getText: expect.any(Function)
              },
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          expect(getDropOperation.mock.calls.length).toBeGreaterThan(0);
        });

        it('should accept generic types/folder drops if acceptedDragTypes is "all"', async function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, acceptedDragTypes: 'all'}} />
          );

          let grids = getAllByRole('grid');
          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let table1Rows = within(rowgroups1[1]).getAllByRole('row', {hidden: true});
          expect(table1Rows).toHaveLength(6);

          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[0];
          let dataTransfer = new DataTransfer();
          let file = new File(['hello world'], 'test.abc', {type: ''});
          dataTransfer.items.add(file);

          fireEvent(dropTarget, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 35}));
          table1Rows = within(rowgroups1[1]).getAllByRole('row', {hidden: true});
          expect(table1Rows).toHaveLength(7);
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 35}));
          act(() => jest.runAllTimers());
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(1);
          expect(onInsert).toHaveBeenCalledWith({
            dropOperation: 'move',
            target: {
              key: '1',
              dropPosition: 'before',
              type: 'item'
            },
            items: [
              {
                kind: 'file',
                name: 'test.abc',
                type: 'application/octet-stream',
                getText: expect.any(Function),
                getFile: expect.any(Function)
              }
            ]
          });
          expect(await onInsert.mock.calls[0][0].items[0].getText()).toBe('hello world');
          expect(await onInsert.mock.calls[0][0].items[0].getFile()).toBe(file);

          dataTransfer = new DataTransfer();
          let dir = new FileSystemDirectoryEntry('test', [
            new FileSystemFileEntry(new File(['hello world'], 'test.txt', {type: 'text/plain'})),
            new FileSystemDirectoryEntry('nested', [
              new FileSystemFileEntry(new File(['<p>foo</p>'], 'foo.html', {type: 'text/html'}))
            ])
          ]);
          dataTransfer.items.add(dir);

          fireEvent(dropTarget, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 35}));
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 35}));
          act(() => jest.runAllTimers());
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(2);
          expect(onInsert).toHaveBeenLastCalledWith({
            dropOperation: 'move',
            target: {
              key: '1',
              dropPosition: 'before',
              type: 'item'
            },
            items: [
              {
                kind: 'directory',
                name: 'test',
                getEntries: expect.any(Function)
              }
            ]
          });

          let collect = async (dir) => {
            let entries = [];
            for await (let entry of dir.getEntries()) {
              entries.push(entry);
            }
            return entries;
          };

          let entries = await collect(onInsert.mock.calls[1][0].items[0]);
          expect(entries).toEqual([
            {
              kind: 'file',
              type: 'text/plain',
              name: 'test.txt',
              getText: expect.any(Function),
              getFile: expect.any(Function)
            },
            {
              kind: 'directory',
              name: 'nested',
              getEntries: expect.any(Function)
            }
          ]);

          expect(await entries[0].getText()).toBe('hello world');
          expect(await collect(entries[1])).toEqual([
            {
              kind: 'file',
              type: 'text/html',
              name: 'foo.html',
              getText: expect.any(Function),
              getFile: expect.any(Function)
            }
          ]);
        });

        it('should accept Folder drops if acceptedDragTypes contains the DIRECTORY_DRAG_TYPE', async function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, acceptedDragTypes: [DIRECTORY_DRAG_TYPE]}} />
          );

          let grids = getAllByRole('grid');
          let rowgroups = within(grids[0]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups[1]).getAllByRole('row')[4];
          let dataTransfer = new DataTransfer();
          let dir = new FileSystemDirectoryEntry('test', [
            new FileSystemFileEntry(new File(['hello world'], 'test.txt', {type: 'text/plain'})),
            new FileSystemDirectoryEntry('nested', [
              new FileSystemFileEntry(new File(['<p>foo</p>'], 'foo.html', {type: 'text/html'}))
            ])
          ]);
          dataTransfer.items.add(dir);

          fireEvent(dropTarget, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 219}));
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 219}));
          act(() => jest.runAllTimers());
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(1);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenLastCalledWith({
            target: {
              key: '5',
              dropPosition: 'on',
              type: 'item'
            },
            isInternal: false,
            dropOperation: 'move',
            items: [
              {
                kind: 'directory',
                name: 'test',
                getEntries: expect.any(Function)
              }
            ]
          });
        });

        it('should accept a drop that contains a mix of allowed and disallowed drag types', async function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, acceptedDragTypes: ['file', 'folder']}} secondTableDnDOptions={{onDragEnd}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[0];
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await user.click(within(table2Rows[0]).getByRole('checkbox'));
          await user.click(within(table2Rows[6]).getByRole('checkbox'));
          let dragCell = within(table2Rows[0]).getAllByRole('rowheader')[0];

          let dataTransfer = new DataTransfer();
          fireEvent.pointerDown(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
          fireEvent(dragCell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));

          act(() => jest.runAllTimers());
          expect(onInsert).toHaveBeenCalledTimes(0);
          fireEvent.pointerMove(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
          fireEvent(dragCell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent(dropTarget, new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent.pointerUp(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent(dragCell, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 1}));
          act(() => jest.runAllTimers());

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          // expect(onRootDrop).toHaveBeenCalledTimes(0);
          // expect(onDragEnd).toHaveBeenCalledTimes(1);
          // expect(onDragEnd).toHaveBeenCalledWith({
          //   type: 'dragend',
          //   keys: new Set(['7', '13']),
          //   x: 1,
          //   y: 1,
          //   dropOperation: 'move',
          //   isInternal: false
          // });
          // expect(onInsert).toHaveBeenCalledTimes(1);
          // expect(onInsert).toHaveBeenCalledWith({
          //   dropOperation: 'move',
          //   target: {
          //     key: '1',
          //     dropPosition: 'before',
          //     type: 'item'
          //   },
          //   items: [
          //     {
          //       kind: 'text',
          //       types: new Set(['text/plain', 'folder']),
          //       getText: expect.any(Function)
          //     }
          //   ]
          // });
          // // Doesn't include the item w/ identifier 13 since that has a disallowed drag type
          // let items = await Promise.all(onInsert.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText(item.types.values().next().value))));
          // expect(items).toContainObject({
          //   identifier: '7',
          //   type: 'folder',
          //   name: 'Pictures',
          //   childNodes: []
          // });
        });

        it('should accept a drop that contains a mix of allowed and disallowed drag types (directories and file case)', function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, onInsert: null, acceptedDragTypes: [DIRECTORY_DRAG_TYPE, 'text/plain']}} />
          );

          let grids = getAllByRole('grid');
          let dropTarget = grids[0];
          let dataTransfer = new DataTransfer();
          let fileA = new File(['hello world'], 'test.abc', {type: ''});
          let fileB = new File(['testing'], 'blah.txt', {type: 'text/plain'});
          let dir = new FileSystemDirectoryEntry('test', [
            new FileSystemFileEntry(new File(['hello world'], 'test.txt', {type: 'text/plain'})),
            new FileSystemDirectoryEntry('nested', [
              new FileSystemFileEntry(new File(['<p>foo</p>'], 'foo.html', {type: 'text/html'}))
            ])
          ]);
          dataTransfer.items.add(fileA);
          dataTransfer.items.add(fileB);
          dataTransfer.items.add(dir);

          fireEvent(dropTarget, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
          act(() => jest.runAllTimers());
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(1);
          expect(onInsert).toHaveBeenCalledTimes(0);
          // Doesn't include fileA because it doesn't match types
          expect(onRootDrop).toHaveBeenCalledWith({
            dropOperation: 'move',
            items: [
              {
                kind: 'file',
                name: 'blah.txt',
                type: 'text/plain',
                getText: expect.any(Function),
                getFile: expect.any(Function)
              },
              {
                kind: 'directory',
                name: 'test',
                getEntries: expect.any(Function)
              }
            ]
          });
        });

        it('should use acceptedDragTypes to filter items provided to the drop util handlers even if getDropOperation is provided', function () {
          let getDropOperation = (target) => {
            if (target.type === 'root') {
              return 'move';
            }

            return 'cancel';
          };
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, onInsert: null, acceptedDragTypes: ['text/plain'], getDropOperation: getDropOperation}} />
          );

          let grids = getAllByRole('grid');
          let dropTarget = grids[0];
          let dataTransfer = new DataTransfer();
          let fileA = new File(['hello world'], 'test.abc', {type: ''});
          let fileB = new File(['testing'], 'blah.txt', {type: 'text/plain'});
          dataTransfer.items.add(fileA);
          dataTransfer.items.add(fileB);

          fireEvent(dropTarget, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
          act(() => jest.runAllTimers());
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(1);
          expect(onInsert).toHaveBeenCalledTimes(0);
          // Doesn't include fileA because it doesn't match types
          expect(onRootDrop).toHaveBeenCalledWith({
            dropOperation: 'move',
            items: [
              {
                kind: 'file',
                name: 'blah.txt',
                type: 'text/plain',
                getText: expect.any(Function),
                getFile: expect.any(Function)
              }
            ]
          });
        });

        it('should perform no item filtering for user provided onDrop', function () {
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, onInsert: null, acceptedDragTypes: ['text/plain'], onDrop}} />
          );

          let grids = getAllByRole('grid');
          let dropTarget = grids[0];
          let dataTransfer = new DataTransfer();
          let fileA = new File(['hello world'], 'test.html', {type: 'text/html'});
          let fileB = new File(['testing'], 'blah.txt', {type: 'text/plain'});
          dataTransfer.items.add(fileA);
          dataTransfer.items.add(fileB);

          fireEvent(dropTarget, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 35}));
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 35}));
          act(() => jest.runAllTimers());
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onDrop).toHaveBeenCalledTimes(1);
          expect(onDrop).toHaveBeenCalledWith({
            type: 'drop',
            x: 1,
            y: 35,
            dropOperation: 'move',
            target: {
              'dropPosition': 'before',
              'key': '1',
              'type': 'item'
            },
            items: [
              {
                kind: 'file',
                name: 'test.html',
                type: 'text/html',
                getText: expect.any(Function),
                getFile: expect.any(Function)
              },
              {
                kind: 'file',
                name: 'blah.txt',
                type: 'text/plain',
                getText: expect.any(Function),
                getFile: expect.any(Function)
              }
            ]
          });
        });

        it('should use shouldAcceptItem to filter out items to provide to onItemDrop', async function () {
          // All items for table 1 should be valid drop targets but it should only accept file type items
          let shouldAcceptItemDrop = (target, types) => target.type === 'item' && types.has('file');
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, shouldAcceptItemDrop}} secondTableDnDOptions={{onDragEnd}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[4];
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget, 1, 220);

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(1);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onDragEnd).toHaveBeenCalledTimes(1);
          expect(onDragEnd).toHaveBeenCalledWith({
            type: 'dragend',
            keys: new Set(['7', '8']),
            x: 1,
            y: 220,
            dropOperation: 'move',
            isInternal: false
          });
          expect(onInsert).toHaveBeenCalledTimes(0);
          // Only has the file in onItemDrop, the folder item should have been filtered out
          expect(onItemDrop).toHaveBeenCalledWith({
            target: {
              key: '5',
              dropPosition: 'on',
              type: 'item'
            },
            isInternal: false,
            dropOperation: 'move',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          let items = await Promise.all(onItemDrop.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).not.toContainObject({
            identifier: '7',
            type: 'folder',
            name: 'Pictures',
            childNodes: []
          });
          expect(items).toContainObject({
            identifier: '8',
            type: 'file',
            name: 'Adobe Fresco'
          });
        });

        it('should use user provided getDropOperation to determine default drop operation if provided', async function () {
          // Take what ever drop operation is allowed except move
          let getDropOperation = (_, __, allowedOperations) => allowedOperations.filter(op => op !== 'move')[0];
          let {getAllByRole} = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, getDropOperation}} secondTableDnDOptions={{getAllowedDropOperations: () => ['move', 'link']}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let rowgroups1 = within(grids[0]).getAllByRole('rowgroup');
          let rowgroups2 = within(grids[1]).getAllByRole('rowgroup');
          let dropTarget = within(rowgroups1[1]).getAllByRole('row')[0];
          let table2Rows = within(rowgroups2[1]).getAllByRole('row');
          await dragBetweenLists(table2Rows, dropTarget, 1, 35);

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(1);
          expect(onInsert).toHaveBeenCalledWith({
            dropOperation: 'link',
            target: {
              key: '1',
              dropPosition: 'before',
              type: 'item'
            },
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'folder']),
                getText: expect.any(Function)
              },
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
        });
      });
    });

    describe('via keyboard', function () {
      afterEach(() => {
        fireEvent.keyDown(document.body, {key: 'Escape'});
        fireEvent.keyUp(document.body, {key: 'Escape'});
      });

      it('should allow drag and drop of a single row', async function () {
        let {getByRole, getByText} = render(
          <DraggableTableView />
        );

        let droppable = getByText('Drop here');
        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let row = rows[0];
        let cell = within(row).getAllByRole('rowheader')[0];
        expect(cell).toHaveTextContent('Vin');
        expect(row).toHaveAttribute('draggable', 'true');

        await user.tab();
        let draghandle = within(row).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();
        expect(draghandle).toHaveAttribute('draggable', 'true');

        await user.tab();
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Enter}');

        expect(onDragStart).toHaveBeenCalledTimes(1);
        expect(onDragStart).toHaveBeenCalledWith({
          type: 'dragstart',
          keys: new Set('a'),
          x: 50,
          y: 25
        });

        act(() => jest.runAllTimers());
        expect(document.activeElement).toBe(droppable);
        await user.keyboard('{Enter}');

        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(await onDrop.mock.calls[0][0].items[0].getText('text/plain')).toBe('Vin Charlet');

        expect(onDragEnd).toHaveBeenCalledTimes(1);
        expect(onDragEnd).toHaveBeenCalledWith({
          type: 'dragend',
          keys: new Set('a'),
          x: 50,
          y: 25,
          dropOperation: 'move',
          isInternal: false
        });
      });

      it('should allow drag and drop of multiple rows', async function () {
        let {getByRole, getByText} = render(
          <DraggableTableView tableViewProps={{selectedKeys: ['a', 'b', 'c', 'd']}} />
        );

        let droppable = getByText('Drop here');
        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');

        let cellA = within(rows[0]).getAllByRole('rowheader')[0];
        expect(cellA).toHaveTextContent('Vin');
        expect(rows[0]).toHaveAttribute('draggable', 'true');

        let cellB = within(rows[1]).getAllByRole('rowheader')[0];
        expect(cellB).toHaveTextContent('Lexy');
        expect(rows[1]).toHaveAttribute('draggable', 'true');

        let cellC = within(rows[2]).getAllByRole('rowheader')[0];
        expect(cellC).toHaveTextContent('Robbi');
        expect(rows[2]).toHaveAttribute('draggable', 'true');

        let cellD = within(rows[3]).getAllByRole('rowheader')[0];
        expect(cellD).toHaveTextContent('Dodie');
        expect(rows[3]).toHaveAttribute('draggable', 'true');

        await user.tab();
        await user.tab();
        let draghandle = within(rows[0]).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();

        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(draghandle);
        await user.keyboard('{Enter}');

        expect(onDragStart).toHaveBeenCalledTimes(1);
        expect(onDragStart).toHaveBeenCalledWith({
          type: 'dragstart',
          keys: new Set(['a', 'b', 'c', 'd']),
          x: 50,
          y: 25
        });

        act(() => jest.runAllTimers());
        expect(document.activeElement).toBe(droppable);
        await user.keyboard('{Enter}');

        expect(onDrop).toHaveBeenCalledTimes(1);

        expect(await onDrop.mock.calls[0][0].items).toHaveLength(4);
        expect(await onDrop.mock.calls[0][0].items[0].getText('text/plain')).toBe('Vin Charlet');
        expect(await onDrop.mock.calls[0][0].items[1].getText('text/plain')).toBe('Lexy Maddison');
        expect(await onDrop.mock.calls[0][0].items[2].getText('text/plain')).toBe('Robbi Persence');
        expect(await onDrop.mock.calls[0][0].items[3].getText('text/plain')).toBe('Dodie Hurworth');

        expect(onDragEnd).toHaveBeenCalledTimes(1);
        expect(onDragEnd).toHaveBeenCalledWith({
          type: 'dragend',
          keys: new Set(['a', 'b', 'c', 'd']),
          x: 50,
          y: 25,
          dropOperation: 'move',
          isInternal: false
        });
      });

      it('should update the global DnD state properly if dropping on a non-collection', async function () {
        let {getByRole, getByText} = render(
          <DraggableTableView tableViewProps={{selectedKeys: ['a', 'b', 'c', 'd']}} />
        );

        let droppable = getByText('Drop here');
        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');

        await user.tab();
        let draghandle = within(rows[0]).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();

        await user.tab();
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(draghandle);
        await user.keyboard('{Enter}');

        let dndState = globalDndState;
        expect(dndState).toEqual({draggingCollectionRef: expect.any(Object), draggingKeys: new Set(['a', 'b', 'c', 'd'])});
        expect(dndState.draggingCollectionRef.current).toBe(grid);
        act(() => jest.runAllTimers());

        expect(document.activeElement).toBe(droppable);
        await user.keyboard('{Enter}');

        dndState = globalDndState;
        expect(dndState).toEqual({draggingKeys: new Set()});
        expect(onDragEnd).toHaveBeenCalledWith({
          type: 'dragend',
          keys: new Set(['a', 'b', 'c', 'd']),
          x: 50,
          y: 25,
          dropOperation: 'move',
          isInternal: false
        });
      });

      it('should reset the global drop state on drag end even if a drop doesn\'t happen', async function () {
        let {getByRole, getByText} = render(
          <DraggableTableView tableViewProps={{selectedKeys: ['a', 'b', 'c', 'd']}} />
        );

        let droppable = getByText('Drop here');
        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');

        await user.tab();
        let draghandle = within(rows[0]).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();

        await user.tab();
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(draghandle);
        await user.keyboard('{Enter}');

        let dndState = globalDndState;
        expect(dndState).toEqual({draggingCollectionRef: expect.any(Object), draggingKeys: new Set(['a', 'b', 'c', 'd'])});
        expect(dndState.draggingCollectionRef.current).toBe(grid);
        act(() => jest.runAllTimers());

        expect(document.activeElement).toBe(droppable);
        await user.keyboard('{Escape}');

        dndState = globalDndState;
        expect(dndState).toEqual({draggingKeys: new Set()});
      });

      it('should update the dropCollectionRef during drag operations', async function () {
        let {getAllByRole} = render(
          <DragBetweenTablesComplex firstTableDnDOptions={{onDragEnd}} />
        );

        let table = getAllByRole('grid')[0];
        let rowgroups = within(table).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');

        await user.tab();
        let draghandle = within(rows[0]).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();
        expect(draghandle).toHaveAttribute('draggable', 'true');
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Enter}');
        act(() => jest.runAllTimers());

        // First drop target should be an internal folder, hence setting dropCollectionRef
        let dndState = globalDndState;
        expect(dndState.dropCollectionRef.current).toBe(table);

        // Canceling the drop operation should clear dropCollectionRef before onDragEnd fires, resulting in isInternal = false
        await user.keyboard('{Escape}');
        dndState = globalDndState;
        expect(dndState.dropCollectionRef).toBeFalsy();
        expect(onDragEnd).toHaveBeenCalledTimes(1);
        expect(onDragEnd).toHaveBeenCalledWith({
          type: 'dragend',
          keys: new Set(['1']),
          x: 50,
          y: 25,
          dropOperation: 'cancel',
          isInternal: false
        });
      });

      describe('using util handlers', function () {
        async function beginDrag(tree) {
          let grids = tree.getAllByRole('grid');
          let rowgroup = within(grids[0]).getAllByRole('rowgroup')[1];
          let row = within(rowgroup).getAllByRole('row')[0];
          let cell = within(row).getAllByRole('rowheader')[0];
          expect(cell).toHaveTextContent('Adobe Photoshop');
          expect(row).toHaveAttribute('draggable', 'true');

          await user.tab();
          let draghandle = within(row).getAllByRole('button')[0];
          expect(draghandle).toBeTruthy();
          expect(draghandle).toHaveAttribute('draggable', 'true');
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(draghandle);
          await user.keyboard('{Enter}');
          act(() => jest.runAllTimers());
        }

        it('should call onInsert when dropping between rows in a different table', async function () {
          let tree = render(
            <DragBetweenTablesComplex secondTableDnDOptions={mockUtilityOptions} />
          );

          await beginDrag(tree);
          // Move to 2nd table's first insert indicator
          await user.tab();
          await user.keyboard('{ArrowDown}');
          expect(document.activeElement).toHaveAttribute('aria-label', 'Insert before Pictures');
          await user.keyboard('{Enter}');

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(1);
          expect(onInsert).toHaveBeenCalledWith({
            dropOperation: 'move',
            target: {
              key: '7',
              dropPosition: 'before',
              type: 'item'
            },
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          let items = await Promise.all(onInsert.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).toContainObject({
            identifier: '1',
            type: 'file',
            name: 'Adobe Photoshop'
          });
        });

        it('should call onReorder when performing a insert drop in the source table', async function () {
          let tree = render(
            <DragBetweenTablesComplex firstTableDnDOptions={mockUtilityOptions} />
          );

          await beginDrag(tree);
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

          expect(document.activeElement).toHaveAttribute('aria-label', 'Insert between Adobe XD and Documents');
          fireEvent.keyDown(document.activeElement, {key: 'Enter'});
          fireEvent.keyUp(document.activeElement, {key: 'Enter'});

          expect(onReorder).toHaveBeenCalledTimes(1);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onReorder).toHaveBeenCalledWith({
            target: {
              key: '3',
              dropPosition: 'before',
              type: 'item'
            },
            keys: new Set(['1']),
            dropOperation: 'move'
          });
        });

        it('should call onRootDrop when dropping on the table root', async function () {
          let tree = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{onDragEnd}} secondTableDnDOptions={mockUtilityOptions} />
          );

          await beginDrag(tree);
          await user.tab();

          expect(document.activeElement).toHaveAttribute('aria-label', 'Drop on');
          fireEvent.keyDown(document.activeElement, {key: 'Enter'});
          fireEvent.keyUp(document.activeElement, {key: 'Enter'});

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(1);
          expect(onDragEnd).toHaveBeenCalledTimes(1);
          expect(onDragEnd).toHaveBeenCalledWith({
            type: 'dragend',
            keys: new Set(['1']),
            x: 50,
            y: 25,
            dropOperation: 'move',
            isInternal: false
          });
          expect(onRootDrop).toHaveBeenCalledWith({
            dropOperation: 'move',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          let items = await Promise.all(onRootDrop.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).toContainObject({
            identifier: '1',
            type: 'file',
            name: 'Adobe Photoshop'
          });
        });

        it('should call onItemDrop when dropping on a folder in the table', async function () {
          let tree = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, onDragEnd}} secondTableDnDOptions={mockUtilityOptions} />
          );

          await beginDrag(tree);
          await user.tab();
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');

          expect(document.activeElement).toHaveAttribute('aria-label', 'Drop on Pictures');
          await user.keyboard('{Enter}');

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(1);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onDragEnd).toHaveBeenCalledTimes(1);
          expect(onDragEnd).toHaveBeenCalledWith({
            type: 'dragend',
            keys: new Set(['1']),
            x: 50,
            y: 25,
            dropOperation: 'move',
            isInternal: false
          });
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledWith({
            target: {
              key: '7',
              dropPosition: 'on',
              type: 'item'
            },
            isInternal: false,
            dropOperation: 'move',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          let items = await Promise.all(onItemDrop.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).toContainObject({
            identifier: '1',
            type: 'file',
            name: 'Adobe Photoshop'
          });
          act(() => jest.runAllTimers());
          await user.tab({shift: true});
          await user.tab({shift: true});
          await user.keyboard('{ArrowLeft}');

          // Drop on folder in same table
          async function beginDrag2(tree) {
            let grids = tree.getAllByRole('grid');
            let rowgroup = within(grids[0]).getAllByRole('rowgroup')[1];
            let row = within(rowgroup).getAllByRole('row')[0];
            let cell = within(row).getAllByRole('rowheader')[0];
            expect(cell).toHaveTextContent('Adobe Photoshop');
            expect(row).toHaveAttribute('draggable', 'true');

            let draghandle = within(row).getAllByRole('button')[0];
            expect(draghandle).toBeTruthy();
            expect(draghandle).toHaveAttribute('draggable', 'true');
            await user.keyboard('{ArrowRight}');
            expect(document.activeElement).toBe(draghandle);
            await user.keyboard('{Enter}');
            act(() => jest.runAllTimers());
          }

          await beginDrag2(tree);
          await user.keyboard('{ArrowDown}');
          await user.keyboard('{ArrowDown}');
          expect(document.activeElement).toHaveAttribute('aria-label', 'Drop on Documents');
          await user.keyboard('{Enter}');

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(2);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onDragEnd).toHaveBeenCalledTimes(2);
          expect(onDragEnd).toHaveBeenLastCalledWith({
            type: 'dragend',
            keys: new Set(['1']),
            x: 50,
            y: 25,
            dropOperation: 'move',
            isInternal: true
          });
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenLastCalledWith({
            target: {
              key: '3',
              dropPosition: 'on',
              type: 'item'
            },
            isInternal: true,
            dropOperation: 'move',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          items = await Promise.all(onItemDrop.mock.calls[1][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).toContainObject({
            identifier: '1',
            type: 'file',
            name: 'Adobe Photoshop'
          });
        });

        it('should allow acceptedDragTypes to specify what drag items the table should accept', async function () {
          let tree = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{...mockUtilityOptions, acceptedDragTypes: ['randomType']}} secondTableDnDOptions={{acceptedDragTypes: ['randomType']}} />
          );

          let grid1 = tree.getAllByRole('grid')[0];
          let grid2 = tree.getAllByRole('grid')[1];
          let rowgroup1 = within(grid1).getAllByRole('rowgroup')[1];
          let rowgroup2 = within(grid2).getAllByRole('rowgroup')[1];
          let totalRows = [
            ...within(rowgroup1).getAllByRole('row', {hidden: true}),
            ...within(rowgroup2).getAllByRole('row', {hidden: true})
          ];
          expect(totalRows).toHaveLength(13);
          await beginDrag(tree);
          // No drop indicators should appear
          expect(totalRows).toHaveLength(13);
        });

        it('should allow the user to specify what a valid drop target is via shouldAcceptItemDrop', async function () {
          let tree = render(
            <DragBetweenTablesComplex
              firstTableDnDOptions={{onDragEnd}}
              secondTableDnDOptions={{...mockUtilityOptions, shouldAcceptItemDrop: (target) => target.type === 'item'}} />
          );

          await beginDrag(tree);
          await user.tab();
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

          // Dropping on a non-folder item should now be enabled
          expect(document.activeElement).toHaveAttribute('aria-label', 'Drop on Adobe Fresco');
          fireEvent.keyDown(document.activeElement, {key: 'Enter'});
          fireEvent.keyUp(document.activeElement, {key: 'Enter'});

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(1);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onDragEnd).toHaveBeenCalledTimes(1);
          expect(onDragEnd).toHaveBeenCalledWith({
            type: 'dragend',
            keys: new Set(['1']),
            x: 50,
            y: 25,
            dropOperation: 'move',
            isInternal: false
          });
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledWith({
            target: {
              key: '8',
              dropPosition: 'on',
              type: 'item'
            },
            isInternal: false,
            dropOperation: 'move',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          let items = await Promise.all(onItemDrop.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).toContainObject({
            identifier: '1',
            type: 'file',
            name: 'Adobe Photoshop'
          });
        });

        it('should automatically disallow various drops if their respective util handler isn\'t provided', async function () {
          let tree = render(
            <DragBetweenTablesComplex firstTableDnDOptions={mockUtilityOptions} />
          );

          await beginDrag(tree);
          await user.tab();
          await user.keyboard('{ArrowDown}');
          // Should allow insert since we provide all handlers
          expect(document.activeElement).toHaveAttribute('aria-label', 'Insert before Pictures');
          await user.keyboard('{Escape}');

          tree.rerender(<DragBetweenTablesComplex secondTableDnDOptions={{...mockUtilityOptions, onRootDrop: null, onInsert: null}} />);
          await user.tab({shift: true});
          await user.tab({shift: true});
          await user.keyboard('{ArrowLeft}');
          await user.keyboard('{ArrowRight}');

          let grids = tree.getAllByRole('grid');
          let rowgroup = within(grids[0]).getAllByRole('rowgroup')[1];
          let row = within(rowgroup).getAllByRole('row')[0];
          let cell = within(row).getAllByRole('rowheader')[0];
          expect(cell).toHaveTextContent('Adobe Photoshop');
          expect(row).toHaveAttribute('draggable', 'true');

          let draghandle = within(row).getAllByRole('button')[0];
          expect(draghandle).toBeTruthy();
          expect(draghandle).toHaveAttribute('draggable', 'true');
          expect(document.activeElement).toBe(draghandle);
          await user.keyboard('{Enter}');
          act(() => jest.runAllTimers());
          await user.tab();
          // Should automatically jump to the folder target since we didn't provide onRootDrop and onInsert
          expect(document.activeElement).toHaveAttribute('aria-label', 'Drop on Pictures');
          await user.keyboard('{ArrowDown}');
          expect(document.activeElement).toHaveAttribute('aria-label', 'Drop on Apps');
        });

        it('should allow the user to override the util handlers via onDrop and getDropOperations', async function () {
          let getDropOperationMock = () => {
            getDropOperation();
            return 'copy';
          };
          let tree = render(
            <DragBetweenTablesComplex secondTableDnDOptions={{...mockUtilityOptions, onDrop: onDrop, getDropOperation: getDropOperationMock}} />
          );

          expect(getDropOperation).toHaveBeenCalledTimes(0);
          await beginDrag(tree);
          await user.tab();
          fireEvent.keyDown(document.activeElement, {key: 'Enter'});
          fireEvent.keyUp(document.activeElement, {key: 'Enter'});

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onDrop).toHaveBeenCalledTimes(1);
          expect(getDropOperation.mock.calls.length).toBeGreaterThan(0);
        });

        it('should be able to perform drops if onDrop is provided without getDropOperation', async function () {
          let tree = render(
            <DragBetweenTablesComplex secondTableDnDOptions={{...mockUtilityOptions, onDrop, acceptedDragTypes: 'all'}} />
          );

          await beginDrag(tree);
          await user.tab();
          fireEvent.keyDown(document.activeElement, {key: 'Enter'});
          fireEvent.keyUp(document.activeElement, {key: 'Enter'});

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onDrop).toHaveBeenCalledTimes(1);
        });

        it('should be able to perform drops if getDropOperation is provided without onDrop', async function () {
          let getDropOperationMock = () => {
            getDropOperation();
            return 'copy';
          };
          let tree = render(
            <DragBetweenTablesComplex secondTableDnDOptions={{...mockUtilityOptions, getDropOperation: getDropOperationMock}} />
          );

          await beginDrag(tree);
          await user.tab();
          fireEvent.keyDown(document.activeElement, {key: 'Enter'});
          fireEvent.keyUp(document.activeElement, {key: 'Enter'});

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(1);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledWith({
            dropOperation: 'copy',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          expect(getDropOperation.mock.calls.length).toBeGreaterThan(0);
        });

        it('should accept a drop that contains a mix of allowed and disallowed drag types', async function () {
          let tree = render(
            <DragBetweenTablesComplex
              tableViewProps={{selectedKeys: ['1', '3']}}
              firstTableDnDOptions={{onDragEnd}}
              secondTableDnDOptions={{...mockUtilityOptions, acceptedDragTypes: ['file']}} />
          );

          await beginDrag(tree);
          await user.tab();
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
          expect(document.activeElement).toHaveAttribute('aria-label', 'Insert before Pictures');
          fireEvent.keyDown(document.activeElement, {key: 'Enter'});
          fireEvent.keyUp(document.activeElement, {key: 'Enter'});

          expect(onDragEnd).toHaveBeenCalledTimes(1);
          expect(onDragEnd).toHaveBeenCalledWith({
            type: 'dragend',
            keys: new Set(['1', '3']),
            x: 50,
            y: 25,
            dropOperation: 'move',
            isInternal: false
          });
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(1);
          expect(onInsert).toHaveBeenCalledWith({
            dropOperation: 'move',
            target: {
              key: '7',
              dropPosition: 'before',
              type: 'item'
            },
            items: [

              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          let items = await Promise.all(onInsert.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText(item.types.values().next().value))));
          expect(items).toContainObject({
            identifier: '1',
            type: 'file',
            name: 'Adobe Photoshop'
          });
        });

        it('should use shouldAcceptItem to filter out items to provide to onItemDrop', async function () {
          let shouldAcceptItemDrop = (target, types) => target.type === 'item' && types.has('file');
          let tree = render(
            <DragBetweenTablesComplex tableViewProps={{selectedKeys: ['1', '3']}} firstTableDnDOptions={{...mockUtilityOptions, onDragEnd}} secondTableDnDOptions={{...mockUtilityOptions, shouldAcceptItemDrop}} />
          );

          await beginDrag(tree);
          await user.tab();
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

          expect(document.activeElement).toHaveAttribute('aria-label', 'Drop on Pictures');
          fireEvent.keyDown(document.activeElement, {key: 'Enter'});
          fireEvent.keyUp(document.activeElement, {key: 'Enter'});

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(1);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onDragEnd).toHaveBeenCalledTimes(1);
          expect(onDragEnd).toHaveBeenCalledWith({
            type: 'dragend',
            keys: new Set(['1', '3']),
            x: 50,
            y: 25,
            dropOperation: 'move',
            isInternal: false
          });
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledWith({
            target: {
              key: '7',
              dropPosition: 'on',
              type: 'item'
            },
            isInternal: false,
            dropOperation: 'move',
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
          let items = await Promise.all(onItemDrop.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText('text/plain'))));
          expect(items).toContainObject({
            identifier: '1',
            type: 'file',
            name: 'Adobe Photoshop'
          });
        });

        it('should use user provided getDropOperation to determine default drop operation if provided', async function () {
          // Take what ever drop operation is allowed except move
          let getDropOperation = (_, __, allowedOperations) => allowedOperations.filter(op => op !== 'move')[0];
          let tree = render(
            <DragBetweenTablesComplex firstTableDnDOptions={{getAllowedDropOperations: () => ['move', 'link']}} secondTableDnDOptions={{...mockUtilityOptions, getDropOperation}} />
          );

          await beginDrag(tree);
          // Move to 2nd table's first insert indicator
          await user.tab();
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

          expect(document.activeElement).toHaveAttribute('aria-label', 'Insert before Pictures');
          fireEvent.keyDown(document.activeElement, {key: 'Enter'});
          fireEvent.keyUp(document.activeElement, {key: 'Enter'});

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(1);
          expect(onInsert).toHaveBeenCalledWith({
            dropOperation: 'link',
            target: {
              key: '7',
              dropPosition: 'before',
              type: 'item'
            },
            items: [
              {
                kind: 'text',
                types: new Set(['text/plain', 'file']),
                getText: expect.any(Function)
              }
            ]
          });
        });
      });

      it('should allow moving one row within a table', async function () {
        let {getByRole} =  render(<Reorderable />);

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        expect(within(rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Vin');
        expect(within(rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Lexy');
        expect(within(rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Robbi');

        await user.tab();
        let draghandle = within(rows[0]).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();

        fireEvent.keyDown(document.activeElement, {key: 'ArrowRight'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowRight'});

        expect(document.activeElement).toBe(draghandle);

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        act(() => jest.runAllTimers());

        fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

        expect(document.activeElement).toHaveAttribute('aria-label', 'Insert between Lexy Maddison and Robbi Persence');

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        await act(async () => Promise.resolve());
        expect(onDrop).toHaveBeenCalledTimes(1);

        grid = getByRole('grid');
        rowgroups = within(grid).getAllByRole('rowgroup');
        rows = within(rowgroups[1]).getAllByRole('row');
        // TODO
        // expect(within(rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Lexy');
        // expect(within(rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Vin');
        // expect(within(rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Robbi');

        // expect(document.activeElement).toBe(rows[1]);
      });

      it('should allow moving multiple rows within a table', async function () {
        let {getAllByRole, getByRole} =  render(<Reorderable />);

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        expect(within(rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Vin');
        expect(within(rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Lexy');
        expect(within(rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Robbi');
        expect(within(rows[3]).getAllByRole('rowheader')[0]).toHaveTextContent('Dodie');

        await user.tab();

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        let draghandle = within(getAllByRole('row')[2]).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();

        fireEvent.keyDown(document.activeElement, {key: 'ArrowRight'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowRight'});

        expect(document.activeElement).toBe(draghandle);

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        act(() => jest.runAllTimers());

        fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

        expect(document.activeElement).toHaveAttribute('aria-label', 'Insert between Robbi Persence and Dodie Hurworth');

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        await act(async () => Promise.resolve());
        expect(onDrop).toHaveBeenCalledTimes(1);

        grid = getByRole('grid');
        rowgroups = within(grid).getAllByRole('rowgroup');
        rows = within(rowgroups[1]).getAllByRole('row');
        expect(within(rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Robbi');
        expect(within(rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Vin');
        expect(within(rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Lexy');
        expect(within(rows[3]).getAllByRole('rowheader')[0]).toHaveTextContent('Dodie');
        expect(document.activeElement).toBe(rows[2]);
      });

      it('should allow moving one row into another table', async function () {
        let {getAllByRole} =  render(<DragBetweenTables />);

        let table1 = getAllByRole('grid')[0];
        let table2 = getAllByRole('grid')[1];

        let rowgroups1 = within(table1).getAllByRole('rowgroup');
        let rowgroups2 = within(table2).getAllByRole('rowgroup');
        let table1rows = within(rowgroups1[1]).getAllByRole('row');
        let table2rows = within(rowgroups2[1]).getAllByRole('row');
        expect(within(table1rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Item One');
        expect(within(table1rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Two');
        expect(within(table1rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Three');

        expect(within(table2rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Seven');
        expect(within(table2rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Eight');
        expect(within(table2rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Nine');

        await user.tab();

        let draghandle = within(table1rows[0]).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();

        fireEvent.keyDown(document.activeElement, {key: 'ArrowRight'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowRight'});

        expect(document.activeElement).toBe(draghandle);

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        act(() => jest.runAllTimers());

        await user.tab();
        expect(document.activeElement).toHaveAttribute('aria-label', 'Insert before Item Seven');

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        await act(async () => Promise.resolve());
        expect(onDrop).toHaveBeenCalledTimes(1);

        act(() => jest.runAllTimers());


        table1 = getAllByRole('grid')[0];
        table2 = getAllByRole('grid')[1];
        rowgroups1 = within(table1).getAllByRole('rowgroup');
        rowgroups2 = within(table2).getAllByRole('rowgroup');
        table1rows = within(rowgroups1[1]).getAllByRole('row');
        table2rows = within(rowgroups2[1]).getAllByRole('row');

        expect(within(table1rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Two');
        expect(within(table1rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Three');
        expect(within(table1rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Four');

        expect(within(table2rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Item One');
        expect(within(table2rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Seven');
        expect(within(table2rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Eight');

        expect(document.activeElement).toBe(table2rows[0]);
      });

      it('should allow moving multiple rows into another table', async function () {
        let {getAllByRole} =  render(<DragBetweenTables />);

        let table1 = getAllByRole('grid')[0];
        let table2 = getAllByRole('grid')[1];

        let rowgroups1 = within(table1).getAllByRole('rowgroup');
        let rowgroups2 = within(table2).getAllByRole('rowgroup');

        let table1rows = within(rowgroups1[1]).getAllByRole('row');
        let table2rows = within(rowgroups2[1]).getAllByRole('row');

        expect(within(table1rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Item One');
        expect(within(table1rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Two');
        expect(within(table1rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Three');

        expect(within(table2rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Seven');
        expect(within(table2rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Eight');
        expect(within(table2rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Nine');

        await user.tab();

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        let draghandle = within(table1rows[0]).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();

        fireEvent.keyDown(document.activeElement, {key: 'ArrowRight'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowRight'});

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        act(() => jest.runAllTimers());

        await user.tab();
        expect(document.activeElement).toHaveAttribute('aria-label', 'Insert before Item Seven');

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        await act(async () => Promise.resolve());
        expect(onDrop).toHaveBeenCalledTimes(1);

        act(() => jest.runAllTimers());

        table1 = getAllByRole('grid')[0];
        table2 = getAllByRole('grid')[1];
        rowgroups1 = within(table1).getAllByRole('rowgroup');
        rowgroups2 = within(table2).getAllByRole('rowgroup');
        table1rows = within(rowgroups1[1]).getAllByRole('row');
        table2rows = within(rowgroups2[1]).getAllByRole('row');

        // TODO
        // expect(within(table1rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Two');
        // expect(within(table1rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Four');
        // expect(within(table1rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Five');

        // expect(within(table2rows[0]).getAllByRole('rowheader')[0]).toHaveTextContent('Item One');
        // expect(within(table2rows[1]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Three');
        // expect(within(table2rows[2]).getAllByRole('rowheader')[0]).toHaveTextContent('Item Seven');

        // expect(document.activeElement).toBe(table2rows[0]);
      });

      it('should automatically focus an item after if it has been dropped on', async function () {
        let {getByRole} = render(
          <DragOntoRowExample dragHookOptions={{onDragStart, onDragEnd}} tableViewProps={{onSelectionChange, disabledKeys: []}} dropHookOptions={{onDrop}} />
        );

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        expect(rows).toHaveLength(9);

        await user.tab();

        fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

        expect(document.activeElement).toBe(rows[1]);

        fireEvent.keyDown(document.activeElement, {key: 'ArrowRight'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowRight'});

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        expect(onDragStart).toHaveBeenCalledTimes(1);
        act(() => jest.runAllTimers());

        expect(document.activeElement).toHaveAttribute('aria-label', 'Drop on Folder 2');

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        await act(async () => Promise.resolve());
        expect(onDrop).toHaveBeenCalledTimes(1);

        act(() => jest.runAllTimers());

        grid = getByRole('grid');
        rowgroups = within(grid).getAllByRole('rowgroup');
        rows = within(rowgroups[1]).getAllByRole('row');
        expect(rows).toHaveLength(8);

        expect(document.activeElement).toBe(rows[7]);
      });
    });

    describe('pointer event implementation needed for this one too', () => {
      installPointerEvent();
      it('should make row selection happen on pressUp if table is draggable', function () {
        let {getByRole} = render(
          <DraggableTableView />
        );

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let draggableRow = rows[0];
        expect(draggableRow).toHaveAttribute('aria-selected', 'false');
        fireEvent.pointerDown(draggableRow, {pointerType: 'mouse'});
        expect(draggableRow).toHaveAttribute('aria-selected', 'false');
        expect(onSelectionChange).toHaveBeenCalledTimes(0);
        fireEvent.pointerUp(draggableRow, {pointerType: 'mouse'});
        fireEvent.click(draggableRow);
        expect(draggableRow).toHaveAttribute('aria-selected', 'true');
        checkSelection(onSelectionChange, ['a']);
      });
    });

    it('should toggle selection upon clicking the row checkbox', async function () {
      let {getByRole} = render(
        <DraggableTableView />
      );

      let grid = getByRole('grid');
      let rowgroups = within(grid).getAllByRole('rowgroup');
      let rows = within(rowgroups[1]).getAllByRole('row');
      let row = rows[0];
      expect(row).toHaveAttribute('aria-selected', 'false');
      expect(row).toHaveAttribute('draggable', 'true');

      await user.click(within(row).getByRole('checkbox'));
      expect(row).toHaveAttribute('aria-selected', 'true');
      expect(onDragStart).toHaveBeenCalledTimes(0);
      checkSelection(onSelectionChange, ['a']);
    });

    it('should only display the drag handle on keyboard focus for dragggable items', async function () {
      let {getByRole} = render(
        <DraggableTableView tableViewProps={{selectionMode: 'single'}} />
    );

      let grid = getByRole('grid');
      let rowgroups = within(grid).getAllByRole('rowgroup');
      let rows = within(rowgroups[1]).getAllByRole('row');
      let cellA = within(rows[0]).getAllByRole('rowheader')[0];
      await user.click(cellA, {pointerType: 'mouse'});
      expect(document.activeElement).toBe(cellA);
      let dragHandle = within(rows[0]).getAllByRole('button')[0];
      // If the dragHandle has a style applied, it is visually hidden
      expect(dragHandle.style).toBeTruthy();
      expect(dragHandle.style.position).toBe('absolute');

      await user.pointer({target: rows[0], keys: '[MouseLeft>]'});
      dragHandle = within(rows[0]).getAllByRole('button')[0];
      expect(dragHandle.style).toBeTruthy();
      expect(dragHandle.style.position).toBe('absolute');
      await user.pointer({target: rows[0], keys: '[/MouseLeft]'});

      fireEvent.pointerEnter(rows[0], {pointerType: 'mouse'});
      dragHandle = within(rows[0]).getAllByRole('button')[0];
      expect(dragHandle.style).toBeTruthy();
      expect(dragHandle.style.position).toBe('absolute');

      // If dragHandle doesn't have a position applied, it isn't visually hidden
      await user.keyboard('{Enter}');
      dragHandle = within(rows[0]).getAllByRole('button')[0];
      expect(dragHandle.style.position).toBe('');
    });

    it('should display the drag handle on hover, press, or keyboard focus for disabled/non dragggable items with disabledBehavior="select"', async function () {
      function hasDragHandle(el) {
        let buttons = within(el).queryAllByRole('button');
        if (buttons.length === 0) {
          return false;
        }
        return buttons[0].getAttribute('draggable');
      }

      let {getByRole} = render(
        <DraggableTableView tableViewProps={{disabledBehavior: 'select', disabledKeys: ['a']}} />
      );

      let grid = getByRole('grid');
      let rowgroups = within(grid).getAllByRole('rowgroup');
      let rows = within(rowgroups[1]).getAllByRole('row');

      await user.tab();
      expect(hasDragHandle(rows[0])).toBeTruthy();
      moveFocus('ArrowDown');
      expect(hasDragHandle(rows[1])).toBeTruthy();

      await user.pointer({target: rows[0], keys: '[MouseLeft>]'});
      expect(hasDragHandle(rows[0])).toBeTruthy();
      await user.pointer({target: rows[0], keys: '[/MouseLeft]'});

      await user.pointer({target: rows[1], keys: '[MouseLeft>]'});
      expect(hasDragHandle(rows[1])).toBeTruthy();
      await user.pointer({target: rows[1], keys: '[/MouseLeft]'});

      fireEvent.pointerEnter(rows[0]);
      expect(hasDragHandle(rows[0])).toBeTruthy();
      fireEvent.pointerEnter(rows[1]);
      expect(hasDragHandle(rows[1])).toBeTruthy();
    });

    it('should not display the drag handle on hover, press, or keyboard focus for disabled/non dragggable items with disabledBehavior="all"', async function () {
      function hasDragHandle(el) {
        let buttons = within(el).queryAllByRole('button');
        if (buttons.length === 0) {
          return false;
        }
        return buttons[0].getAttribute('draggable');
      }

      let {getByRole} = render(
        <DraggableTableView tableViewProps={{disabledBehavior: 'all', disabledKeys: ['a']}} />
      );

      let grid = getByRole('grid');
      let rowgroups = within(grid).getAllByRole('rowgroup');
      let rows = within(rowgroups[1]).getAllByRole('row');

      await user.tab();
      expect(hasDragHandle(rows[0])).toBeFalsy();
      moveFocus('ArrowDown');
      expect(hasDragHandle(rows[1])).toBeTruthy();

      fireEvent.pointerDown(rows[0], {button: 0, pointerId: 1});
      expect(hasDragHandle(rows[0])).toBeFalsy();
      fireEvent.pointerUp(rows[0], {button: 0, pointerId: 1});

      fireEvent.pointerDown(rows[1], {button: 0, pointerId: 1});
      expect(hasDragHandle(rows[1])).toBeTruthy();
      fireEvent.pointerUp(rows[1], {button: 0, pointerId: 1});

      fireEvent.pointerEnter(rows[0]);
      expect(hasDragHandle(rows[0])).toBeFalsy();
      fireEvent.pointerEnter(rows[1]);
      expect(hasDragHandle(rows[1])).toBeTruthy();
    });

    // disabledKeys a means we actually start on item 2 and drag that, so everything is offset by 1 and it wraps one early
    let labels = ['Vin Charlet', 'Lexy Maddison', 'Robbi Persence', 'Dodie Hurworth', 'Audrye Hember', 'Beau Oller', 'Roarke Gration', 'Cathy Lishman', 'Enrika Soitoux', 'Aloise Tuxsell', 'before'];
    it.each`
      disabledKeys | itemLabels
      ${['a']}     | ${labels}
      ${['b']}     | ${labels}
      ${['c']}     | ${labels}
      ${['d']}     | ${labels}
      ${['e']}     | ${labels}
      ${['f']}     | ${labels}
      ${['g']}     | ${labels}
      ${['h']}     | ${labels}
      ${['i']}     | ${labels}
      ${['j']}     | ${labels}
    `('should be able to insert next to a disabled key, disabled key is $disabledKeys', async function ({disabledKeys, itemLabels}) {
      render(
        <Reorderable disabledKeys={disabledKeys} />
      );

      await user.tab();

      fireEvent.keyDown(document.activeElement, {key: 'ArrowRight'});
      fireEvent.keyUp(document.activeElement, {key: 'ArrowRight'});

      fireEvent.keyDown(document.activeElement, {key: 'Enter'});
      fireEvent.keyUp(document.activeElement, {key: 'Enter'});

      expect(onDragStart).toHaveBeenCalledTimes(1);
      act(() => jest.runAllTimers());

      for (let i = 0; i <= 10; i++) {
        if (itemLabels[i] === 'Aloise Tuxsell') {
          expect(document.activeElement).toHaveAttribute('aria-label', 'Insert after Aloise Tuxsell');
        } else if (itemLabels[i] === 'before') {
          expect(document.activeElement).toHaveAttribute('aria-label', 'Insert before Vin Charlet');
        } else {
          expect(document.activeElement).toHaveAttribute('aria-label', `Insert between ${itemLabels[i]} and ${itemLabels[i + 1]}`);
        }
        fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
      }

      fireEvent.keyDown(document.activeElement, {key: 'Escape'});
      fireEvent.keyUp(document.activeElement, {key: 'Escape'});

      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('should only count the selected keys that exist in the collection when dragging and dropping', async function () {
      let {getByRole} = render(
        <DragOntoRowExample dragHookOptions={{onDragStart, onDragEnd}} tableViewProps={{onSelectionChange, disabledKeys: []}} dropHookOptions={{onDrop}} />
      );

      await user.tab();
      let grid = getByRole('grid');
      let rowgroups = within(grid).getAllByRole('rowgroup');
      let rows = within(rowgroups[1]).getAllByRole('row');
      expect(rows).toHaveLength(9);
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(new Set(onSelectionChange.mock.calls[2][0])).toEqual(new Set(['1', '2', '3']));
      let draghandle = within(rows[2]).getAllByRole('button')[0];
      expect(draghandle).toBeTruthy();
      expect(draghandle).toHaveAttribute('draggable', 'true');

      await user.keyboard('{ArrowRight}');
      await user.keyboard('{Enter}');

      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragStart).toHaveBeenCalledWith({
        type: 'dragstart',
        keys: new Set(['1', '2', '3']),
        x: 50,
        y: 25
      });

      act(() => jest.runAllTimers());
      let droppableButton = await within(document).findByLabelText('Drop on Folder 2', {hidden: true});
      expect(document.activeElement).toBe(droppableButton);

      await user.keyboard('{Enter}');
      await act(async () => Promise.resolve());
      act(() => jest.runAllTimers());

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(await onDrop.mock.calls[0][0].items).toHaveLength(3);
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd).toHaveBeenCalledWith({
        type: 'dragend',
        keys: new Set(['1', '2', '3']),
        x: 50,
        y: 25,
        dropOperation: 'move',
        isInternal: true
      });
      onSelectionChange.mockClear();
      onDragStart.mockClear();


      grid = getByRole('grid');
      rowgroups = within(grid).getAllByRole('rowgroup');
      rows = within(rowgroups[1]).getAllByRole('row');
      expect(rows).toHaveLength(6);

      // Select the folder and perform a drag on a different item that isn't selected. Drag start shouldn't include the previously selected items/folders
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      // Selection change event still has all keys
      expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(['1', '2', '3', '8']));

      draghandle = within(rows[4]).getAllByRole('button')[0];
      expect(draghandle).toBeTruthy();
      expect(draghandle).toHaveAttribute('draggable', 'true');

      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{Enter}');
      act(() => jest.runAllTimers());

      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragStart).toHaveBeenCalledWith({
        type: 'dragstart',
        keys: new Set(['6']),
        x: 50,
        y: 25
      });

      fireEvent.keyDown(document.body, {key: 'Escape'});
      fireEvent.keyUp(document.body, {key: 'Escape'});
    });

    it('should automatically focus the newly added dropped item', async function () {
      let {getAllByRole} = render(
        <DragBetweenTablesRootOnlyExample dragHookOptions={{onDragStart, onDragEnd}} tableViewProps={{onSelectionChange, disabledKeys: []}} dropHookOptions={{onDrop}} />
      );

      let grids = getAllByRole('grid');
      expect(grids).toHaveLength(2);
      let firstListRowGroups = within(grids[0]).getAllByRole('rowgroup');
      let secondListRowGroups = within(grids[1]).getAllByRole('rowgroup');
      let firstListRows = within(firstListRowGroups[1]).getAllByRole('row');
      let secondListRows = within(secondListRowGroups[1]).getAllByRole('row');
      expect(firstListRows).toHaveLength(6);
      expect(secondListRows).toHaveLength(6);

      let dataTransfer = new DataTransfer();
      fireEvent.pointerDown(firstListRows[0], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 40});
      fireEvent(firstListRows[0], new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 40}));

      act(() => jest.runAllTimers());
      expect(onDragStart).toHaveBeenCalledTimes(1);
      fireEvent.pointerMove(firstListRows[0], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 40});
      fireEvent(firstListRows[0], new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 40}));
      fireEvent(grids[1], new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 40}));
      fireEvent(grids[1], new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 40}));
      fireEvent.pointerUp(firstListRows[0], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 40});
      fireEvent(firstListRows[0], new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 40}));

      await waitFor(() => expect(within(within(grids[1]).getAllByRole('rowgroup')[1]).getAllByRole('row')).toHaveLength(7), {interval: 10});
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDragEnd).toHaveBeenCalledTimes(1);

      act(() => jest.runAllTimers());
      grids = getAllByRole('grid');
      firstListRowGroups = within(grids[0]).getAllByRole('rowgroup');
      secondListRowGroups = within(grids[1]).getAllByRole('rowgroup');
      firstListRows = within(firstListRowGroups[1]).getAllByRole('row');
      secondListRows = within(secondListRowGroups[1]).getAllByRole('row');
      expect(firstListRows.map(row => row.textContent)).toHaveLength(5);
      expect(secondListRows.map(row => row.textContent)).toHaveLength(7);

      // The newly added row in the second table should be the active element
      expect(secondListRows[6]).toBe(document.activeElement);
      expect(secondListRows[6]).toHaveTextContent('Item One');

      for (let [index, row] of secondListRows.entries()) {
        if (index !== 6) {
          expect(row).toHaveAttribute('tabIndex', '-1');
        } else {
          expect(row).toHaveAttribute('tabIndex', '0');
        }
      }

      dataTransfer = new DataTransfer();
      fireEvent.pointerDown(firstListRows[3], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
      fireEvent(firstListRows[3], new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));

      act(() => jest.runAllTimers());
      expect(onDragStart).toHaveBeenCalledTimes(2);
      fireEvent.pointerMove(firstListRows[3], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
      fireEvent(firstListRows[3], new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
      fireEvent(grids[1], new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 2}));
      fireEvent.pointerUp(firstListRows[3], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
      fireEvent(grids[1], new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
      fireEvent(firstListRows[3], new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 1}));

      act(() => jest.advanceTimersByTime(0));
      await waitFor(() => expect(within(within(grids[1]).getAllByRole('rowgroup')[1]).getAllByRole('row')).toHaveLength(8), {interval: 10});
      expect(onDrop).toHaveBeenCalledTimes(2);
      expect(onDragEnd).toHaveBeenCalledTimes(2);

      act(() => jest.runAllTimers());
      grids = getAllByRole('grid');
      firstListRowGroups = within(grids[0]).getAllByRole('rowgroup');
      secondListRowGroups = within(grids[1]).getAllByRole('rowgroup');
      firstListRows = within(firstListRowGroups[1]).getAllByRole('row');
      secondListRows = within(secondListRowGroups[1]).getAllByRole('row');
      expect(firstListRows).toHaveLength(4);
      expect(secondListRows).toHaveLength(8);

      // The 2nd newly added row in the second table should still be the active element
      expect(secondListRows[7]).toBe(document.activeElement);
      expect(secondListRows[7]).toHaveTextContent('Item Five');

      for (let [index, row] of secondListRows.entries()) {
        if (index !== 7) {
          expect(row).toHaveAttribute('tabIndex', '-1');
        } else {
          expect(row).toHaveAttribute('tabIndex', '0');
        }
      }
    });

    it('should support getAllowedDropOperations to limit allowed operations', async () => {
      let getAllowedDropOperations = jest.fn().mockImplementation(() => ['copy']);
      let {getByRole, getByText} = render(
        <DraggableTableView dragHookOptions={{getAllowedDropOperations}} />
        );

      let droppable = getByText('Drop here');
      let grid = getByRole('grid');
      let rowgroups = within(grid).getAllByRole('rowgroup');
      let rows = within(rowgroups[1]).getAllByRole('row');
      let row = rows[0];

      await user.tab();
      await user.tab();
      let draghandle = within(row).getAllByRole('button')[0];
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(draghandle);
      await user.keyboard('{Enter}');

      act(() => jest.runAllTimers());
      expect(document.activeElement).toBe(droppable);
      await user.keyboard('{Enter}');

      expect(getAllowedDropOperations).toHaveBeenCalledTimes(1);

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop).toHaveBeenCalledWith({
        type: 'drop',
        x: 50,
        y: 25,
        dropOperation: 'copy',
        items: [
          {
            kind: 'text',
            types: new Set(['text/plain']),
            getText: expect.any(Function)
          }
        ]
      });
    });

    describe('accessibility', function () {
      it('drag handle should reflect the correct number of draggable rows',  async function () {

        let {getByRole} = render(
          <DraggableTableView tableViewProps={{defaultSelectedKeys: ['a', 'b', 'c']}} />
        );

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        expect(rows[0]).toHaveAttribute('draggable', 'true');
        let dragButtonA = within(rows[0]).getAllByRole('button')[0];
        expect(dragButtonA).toHaveAttribute('aria-label', 'Drag 3 selected items');

        expect(rows[1]).toHaveAttribute('draggable', 'true');
        let dragButtonB = within(rows[1]).getAllByRole('button')[0];
        expect(dragButtonB).toHaveAttribute('aria-label', 'Drag 3 selected items');

        expect(rows[2]).toHaveAttribute('draggable');

        expect(rows[3]).toHaveAttribute('draggable', 'true');
        let dragButtonD = within(rows[3]).getAllByRole('button')[0];
        expect(dragButtonD).toHaveAttribute('aria-label', 'Drag Dodie Hurworth');

        // After selecting row 4, the aria-label should reflect 4 selected items rather than just "Drag Dodie Hurworth"
        await user.click(within(rows[3]).getByRole('checkbox'));
        expect(dragButtonA).toHaveAttribute('aria-label', 'Drag 4 selected items');
        expect(dragButtonB).toHaveAttribute('aria-label', 'Drag 4 selected items');
        expect(dragButtonD).toHaveAttribute('aria-label', 'Drag 4 selected items');

        await user.click(within(rows[0]).getByRole('checkbox'));
        expect(dragButtonA).toHaveAttribute('aria-label', 'Drag Vin Charlet');
        expect(dragButtonB).toHaveAttribute('aria-label', 'Drag 3 selected items');
        expect(dragButtonD).toHaveAttribute('aria-label', 'Drag 3 selected items');
      });

      it('disabled rows and invalid drop targets should become aria-hidden when keyboard drag session starts', async function () {
        let {getByRole} = render(
          <ReorderExample tableViewProps={{disabledKeys: ['2']}} />
        );

        let grid = getByRole('grid');
        let rowgroups = within(grid).getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        for (let row of rows) {
          expect(row).not.toHaveAttribute('aria-hidden');
        }

        let row = rows[0];
        let draghandle = within(row).getAllByRole('button')[0];
        expect(row).toHaveAttribute('draggable', 'true');
        await user.tab();
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(draghandle);
        await user.keyboard('{Enter}');
        act(() => jest.runAllTimers());

        for (let [index, row] of rows.entries()) {
          // We hide the cell for iOS Safari and remove the row tab index so TalkBack doesn't focus the row
          expect(row).not.toHaveAttribute('tabindex');
          if (index === 0) {
            expect(row).not.toHaveAttribute('aria-hidden', 'true');
          } else {
            expect(row).toHaveAttribute('aria-hidden', 'true');
          }
        }

        fireEvent.keyDown(document.body, {key: 'Escape'});
        fireEvent.keyUp(document.body, {key: 'Escape'});
      });
    });
  });
});
