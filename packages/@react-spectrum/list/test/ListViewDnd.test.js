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
  fireEvent,
  installPointerEvent,
  pointerMap,
  render as renderComponent,
  waitFor,
  within
} from '@react-spectrum/test-utils-internal';
import {CUSTOM_DRAG_TYPE} from '@react-aria/dnd/src/constants';
import {DataTransfer, DataTransferItem, DragEvent, FileSystemDirectoryEntry, FileSystemFileEntry} from '@react-aria/dnd/test/mocks';
import {DIRECTORY_DRAG_TYPE} from '@react-aria/dnd';
import {DragBetweenListsComplex} from '../stories/ListViewDnDUtilExamples';
import {DragBetweenListsExample, DragBetweenListsRootOnlyExample, DragExample, DragIntoItemExample, ReorderExample} from '../stories/ListViewDnDExamples';
import {Droppable} from '@react-aria/dnd/test/examples';
import {Flex} from '@react-spectrum/layout';
import {globalDndState} from '@react-aria/dnd/src/utils';
import {Item, ListView} from '../';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {Text} from '@react-spectrum/text';
import {theme} from '@react-spectrum/theme-default';
import {useDragAndDrop} from '@react-spectrum/dnd';
import {useListData} from '@react-stately/data';
import userEvent from '@testing-library/user-event';

let isReact18 = parseInt(React.version, 10) === 18;
let isReact19 = parseInt(React.version, 10) === 19;

describe('ListView', function () {
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
    installPointerEvent();

    function DraggableListView(props) {
      let {dragHookOptions, listViewProps} = props;
      return (
        <>
          <Droppable onDrop={onDrop} />
          <DragExample dragHookOptions={{onDragStart, onDragMove, onDragEnd, ...dragHookOptions}} listViewProps={{onSelectionChange, ...listViewProps}} />
        </>
      );
    }

    function Reorderable(props) {
      return (
        <ReorderExample disabledKeys={['1']} onDrop={onDrop} onDragStart={onDragStart} onDragEnd={onDragEnd} {...props} />
      );
    }

    function DragBetweenLists(props) {
      return (
        <DragBetweenListsExample onDrop={onDrop} onDragStart={onDragStart} onDragEnd={onDragEnd} {...props} />
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
        let {getAllByRole, getAllByText} = render(
          <DraggableListView />
        );

        let row = getAllByRole('row')[0];
        let cell = within(row).getByRole('gridcell');
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
        expect(cellText).toHaveLength(2);
        fireEvent.pointerUp(cell, {button: 0, pointerId: 1, clientX: 5, clientY: 5});
        fireEvent(cell, new DragEvent('dragend', {dataTransfer, clientX: 5, clientY: 5}));

        act(() => {jest.runAllTimers();});
        cellText = getAllByText(cell.textContent);
        expect(cellText).toHaveLength(1);
      });

      it('should render a custom drag preview', function () {
        let renderPreview = jest.fn().mockImplementation((keys, draggedKey) => <div>Custom preview for [{[...keys].join(', ')}] , while dragging {draggedKey}.</div>);
        let {getAllByRole} = render(
          <DraggableListView dragHookOptions={{renderPreview}} listViewProps={{selectedKeys: ['a', 'b']}} />
        );

        let row = getAllByRole('row')[0];
        let cell = within(row).getByRole('gridcell');

        let dataTransfer = new DataTransfer();

        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 5, clientY: 5});
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 5, clientY: 5}));
        expect(dataTransfer._dragImage.node.tagName).toBe('DIV');
        expect(dataTransfer._dragImage.node.textContent).toBe('Custom preview for [a, b] , while dragging a.');
        expect(dataTransfer._dragImage.x).toBe(5);
        expect(dataTransfer._dragImage.y).toBe(5);
      });

      it('should allow drag and drop of a single row', async function () {
        let {getAllByRole, getByText} = render(
          <DraggableListView />
        );

        let droppable = getByText('Drop here');
        let row = getAllByRole('row')[0];
        expect(row).toHaveAttribute('draggable', 'true');
        let cell = within(row).getByRole('gridcell');
        expect(cell).toHaveTextContent('Adobe Photoshop');

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        expect([...dataTransfer.items]).toEqual([new DataTransferItem('text/plain', 'Adobe Photoshop')]);

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

        expect(await onDrop.mock.calls[0][0].items[0].getText('text/plain')).toBe('Adobe Photoshop');
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
        let {getAllByRole, getByText} = render(
          <DraggableListView />
        );

        let droppable = getByText('Drop here');
        let rows = getAllByRole('row');

        await user.click(within(rows[0]).getByRole('checkbox'));
        await user.click(within(rows[1]).getByRole('checkbox'));
        await user.click(within(rows[2]).getByRole('checkbox'));
        await user.click(within(rows[3]).getByRole('checkbox'));
        // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
        // await user.click(within(rows[0]).getByRole('checkbox'));
        // await user.click(within(rows[1]).getByRole('checkbox'));
        // await user.click(within(rows[2]).getByRole('checkbox'));
        // await user.click(within(rows[3]).getByRole('checkbox'));

        expect(new Set(onSelectionChange.mock.calls[3][0])).toEqual(new Set(['a', 'b', 'c', 'd']));

        let cellA = within(rows[0]).getByRole('gridcell');
        expect(cellA).toHaveTextContent('Adobe Photoshop');
        expect(rows[0]).toHaveAttribute('draggable', 'true');

        let cellB = within(rows[1]).getByRole('gridcell');
        expect(cellB).toHaveTextContent('Adobe XD');
        expect(rows[1]).toHaveAttribute('draggable', 'true');

        let cellC = within(rows[2]).getByRole('gridcell');
        expect(cellC).toHaveTextContent('Documents');
        expect(rows[2]).toHaveAttribute('draggable', 'true');

        let cellD = within(rows[3]).getByRole('gridcell');
        expect(cellD).toHaveTextContent('Adobe InDesign');
        expect(rows[3]).toHaveAttribute('draggable', 'true');

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cellA, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(cellA, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        expect([...dataTransfer.items]).toEqual([
          new DataTransferItem('text/plain', 'Adobe Photoshop\nAdobe XD\nDocuments\nAdobe InDesign'),
          new DataTransferItem(
            CUSTOM_DRAG_TYPE,
            JSON.stringify([{'text/plain': 'Adobe Photoshop'}, {'text/plain': 'Adobe XD'}, {'text/plain': 'Documents'}, {'text/plain': 'Adobe InDesign'}]
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
        expect(await onDrop.mock.calls[0][0].items[0].getText('text/plain')).toBe('Adobe Photoshop');
        expect(await onDrop.mock.calls[0][0].items[1].getText('text/plain')).toBe('Adobe XD');
        expect(await onDrop.mock.calls[0][0].items[2].getText('text/plain')).toBe('Documents');
        expect(await onDrop.mock.calls[0][0].items[3].getText('text/plain')).toBe('Adobe InDesign');
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

      it('should not allow drag operations on a disabled row', function () {
        let {getAllByRole} = render(
          <DraggableListView listViewProps={{disabledKeys: ['a']}} />
      );

        let row = getAllByRole('row')[0];
        let cell = within(row).getByRole('gridcell');
        expect(cell).toHaveTextContent('Adobe Photoshop');
        expect(row).not.toHaveAttribute('draggable', 'true');

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        expect(onDragStart).toHaveBeenCalledTimes(0);
      });

      it('should allow drag operations on a disabled row with disabledBehavior="selection"', function () {
        let {getAllByRole} = render(
          <DraggableListView listViewProps={{disabledKeys: ['a'], disabledBehavior: 'selection'}} />
      );

        let row = getAllByRole('row')[0];
        let cell = within(row).getByRole('gridcell');
        expect(cell).toHaveTextContent('Adobe Photoshop');
        expect(row).toHaveAttribute('draggable', 'true');

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        expect([...dataTransfer.items]).toEqual([new DataTransferItem('text/plain', 'Adobe Photoshop')]);
        expect(onDragStart).toHaveBeenCalledTimes(1);
      });

      it('should not allow dragging when not selected when it conflicts with onAction', function () {
        let onAction = jest.fn();
        let {getAllByRole} = render(
          <DraggableListView listViewProps={{onAction}} />
      );

        let rows = getAllByRole('row');
        let cell = within(rows[2]).getByRole('gridcell');
        let dataTransfer = new DataTransfer();
        let event = new DragEvent('dragstart', {dataTransfer, clientX: 5, clientY: 5});

        fireEvent.pointerDown(cell, {pointerType: 'touch', button: 0, pointerId: 1, clientX: 5, clientY: 5});
        fireEvent(cell, event);

        expect(event.defaultPrevented).toBe(true);
        expect(dataTransfer.items._items).toHaveLength(0);
      });

      it('should allow moving one item within a list', async function () {
        let {getAllByRole, getByRole} =  render(<Reorderable />);

        let grid = getByRole('grid');
        let rows = getAllByRole('row');
        let cell = within(rows[1]).getByRole('gridcell');
        expect(within(rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(rows[1]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(rows[2]).getByRole('gridcell')).toHaveTextContent('Item Three');

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        act(() => rows[1].focus());
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        expect(onDragStart).toHaveBeenCalledTimes(1);

        fireEvent.pointerMove(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 110});
        fireEvent(cell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 110}));
        fireEvent(grid, new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 110}));
        fireEvent.pointerUp(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 110});

        fireEvent(grid, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 110}));
        act(() => jest.runAllTimers());
        await act(async () => Promise.resolve());

        expect(onDrop).toHaveBeenCalledTimes(1);

        fireEvent(cell, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 110}));
        // TODO: fix in strict mode, due to https://github.com/facebook/react/issues/29585
        if (isReact19) {
          expect(onDragEnd).toHaveBeenCalledTimes(2);
        } else {
          expect(onDragEnd).toHaveBeenCalledTimes(1);
        }

        act(() => jest.runAllTimers());

        rows = getAllByRole('row');
        expect(within(rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(rows[1]).getByRole('gridcell')).toHaveTextContent('Item Three');
        expect(within(rows[2]).getByRole('gridcell')).toHaveTextContent('Item Two');

        expect(document.activeElement).toBe(rows[2]);
      });

      it('should allow moving multiple items within a list', async function () {
        let {getAllByRole, getByRole} =  render(<Reorderable />);

        let grid = getByRole('grid');
        let rows = getAllByRole('row');
        let cell = within(rows[1]).getByRole('gridcell');
        expect(within(rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(rows[1]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(rows[2]).getByRole('gridcell')).toHaveTextContent('Item Three');
        expect(within(rows[3]).getByRole('gridcell')).toHaveTextContent('Item Four');

        await user.click(within(rows[1]).getByRole('checkbox'));
        await user.click(within(rows[2]).getByRole('checkbox'));
        // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
        // await user.click(within(rows[1]).getByRole('checkbox'));
        // await user.click(within(rows[2]).getByRole('checkbox'));

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        act(() => rows[1].focus());
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        expect(onDragStart).toHaveBeenCalledTimes(1);

        fireEvent.pointerMove(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 150});
        fireEvent(cell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 150}));
        fireEvent(grid, new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 150}));
        fireEvent.pointerUp(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 150});

        fireEvent(grid, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 150}));
        act(() => jest.runAllTimers());
        await act(async () => Promise.resolve());
        if (isReact19) {
          expect(onDrop).toHaveBeenCalledTimes(1);
        } else {
          expect(onDrop).toHaveBeenCalledTimes(1);
        }

        fireEvent(cell, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 150}));
        if (isReact19) {
          expect(onDragEnd).toHaveBeenCalledTimes(2);
        } else {
          expect(onDragEnd).toHaveBeenCalledTimes(1);
        }

        act(() => jest.runAllTimers());

        rows = getAllByRole('row');
        expect(within(rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(rows[1]).getByRole('gridcell')).toHaveTextContent('Item Four');
        expect(within(rows[2]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(rows[3]).getByRole('gridcell')).toHaveTextContent('Item Three');

        expect(document.activeElement).toBe(rows[2]);
      });

      it('should allow moving one item into another list', async function () {
        let {getAllByRole} =  render(<DragBetweenLists />);

        let grid1 = getAllByRole('grid')[0];
        let grid2 = getAllByRole('grid')[1];
        let list1rows = within(grid1).getAllByRole('row');
        let list2rows = within(grid2).getAllByRole('row');

        expect(within(list1rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(list1rows[1]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(list1rows[2]).getByRole('gridcell')).toHaveTextContent('Item Three');

        expect(within(list2rows[0]).getByRole('gridcell')).toHaveTextContent('Item Seven');
        expect(within(list2rows[1]).getByRole('gridcell')).toHaveTextContent('Item Eight');
        expect(within(list2rows[2]).getByRole('gridcell')).toHaveTextContent('Item Nine');

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(list1rows[0], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(list1rows[0], new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        act(() => {jest.runAllTimers();});
        fireEvent(list1rows[0], new DragEvent('drag', {dataTransfer, clientX: 0, clientY: 0}));
        fireEvent(list1rows[0], new DragEvent('dragenter', {dataTransfer, clientX: 0, clientY: 0}));
        fireEvent(grid2, new DragEvent('dragover', {dataTransfer, clientX: 0, clientY: 0}));
        expect(onDragStart).toHaveBeenCalledTimes(1);

        fireEvent.pointerMove(list1rows[0], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 200, clientY: -1});
        fireEvent(list1rows[0], new DragEvent('drag', {dataTransfer, clientX: 200, clientY: -1}));
        fireEvent(list1rows[0], new DragEvent('dragenter', {dataTransfer, clientX: 200, clientY: -1}));
        fireEvent(grid1, new DragEvent('dragleave', {dataTransfer, clientX: 200, clientY: -1}));
        fireEvent(grid2, new DragEvent('dragover', {dataTransfer, clientX: 200, clientY: -1}));
        fireEvent.pointerUp(list1rows[0], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 200, clientY: -1});
        fireEvent(grid2, new DragEvent('drop', {dataTransfer, clientX: 200, clientY: -1}));
        // resolve async drop, don't fire dragend to simulate browser bug:https://bugzilla.mozilla.org/show_bug.cgi?id=460801
        // onDragEnd will be called by our cleanup instead
        await act(async () => Promise.resolve());
        act(() => {jest.runAllTimers();});

        expect(onDragEnd).toHaveBeenCalledTimes(1);
        expect(onDrop).toHaveBeenCalledTimes(1);

        grid1 = getAllByRole('grid')[0];
        grid2 = getAllByRole('grid')[1];
        list1rows = within(grid1).getAllByRole('row');
        list2rows = within(grid2).getAllByRole('row');

        expect(within(list1rows[0]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(list1rows[1]).getByRole('gridcell')).toHaveTextContent('Item Three');
        expect(within(list1rows[2]).getByRole('gridcell')).toHaveTextContent('Item Four');

        expect(within(list2rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(list2rows[1]).getByRole('gridcell')).toHaveTextContent('Item Seven');
        expect(within(list2rows[2]).getByRole('gridcell')).toHaveTextContent('Item Eight');

        expect(document.activeElement).toBe(list2rows[0]);
      });

      it('should allow moving multiple items into another list', async function () {
        let {getAllByRole} =  render(<DragBetweenLists />);

        let grid1 = getAllByRole('grid')[0];
        let grid2 = getAllByRole('grid')[1];
        let list1rows = within(grid1).getAllByRole('row');
        let list2rows = within(grid2).getAllByRole('row');

        expect(within(list1rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(list1rows[1]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(list1rows[2]).getByRole('gridcell')).toHaveTextContent('Item Three');

        expect(within(list2rows[0]).getByRole('gridcell')).toHaveTextContent('Item Seven');
        expect(within(list2rows[1]).getByRole('gridcell')).toHaveTextContent('Item Eight');
        expect(within(list2rows[2]).getByRole('gridcell')).toHaveTextContent('Item Nine');

        await user.click(within(list1rows[0]).getByRole('checkbox'));
        await user.click(within(list1rows[2]).getByRole('checkbox'));
        // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
        // await user.click(within(list1rows[0]).getByRole('checkbox'));
        // await user.click(within(list1rows[2]).getByRole('checkbox'));

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(list1rows[0], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(list1rows[0], new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        act(() => {jest.runAllTimers();});
        fireEvent(list1rows[0], new DragEvent('drag', {dataTransfer, clientX: 0, clientY: 0}));
        fireEvent(list1rows[0], new DragEvent('dragenter', {dataTransfer, clientX: 0, clientY: 0}));
        fireEvent(grid2, new DragEvent('dragover', {dataTransfer, clientX: 0, clientY: 0}));
        expect(onDragStart).toHaveBeenCalledTimes(1);

        fireEvent.pointerMove(list1rows[0], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 200, clientY: -1});
        fireEvent(list1rows[0], new DragEvent('drag', {dataTransfer, clientX: 200, clientY: -1}));
        fireEvent(list1rows[0], new DragEvent('dragenter', {dataTransfer, clientX: 200, clientY: -1}));
        fireEvent(grid1, new DragEvent('dragleave', {dataTransfer, clientX: 200, clientY: -1}));
        fireEvent(grid2, new DragEvent('dragover', {dataTransfer, clientX: 200, clientY: -1}));
        fireEvent.pointerUp(list1rows[0], {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 200, clientY: -1});
        fireEvent(grid2, new DragEvent('drop', {dataTransfer, clientX: 200, clientY: -1}));
        if (!isReact18) {
          // not sure why but in React 17 this blur happens in the browser but not in the test
          act(() => list1rows[0].blur());
        }
        // resolve async drop, don't fire dragend to simulate browser bug:https://bugzilla.mozilla.org/show_bug.cgi?id=460801
        // onDragEnd will be called by our cleanup instead
        await act(async () => Promise.resolve());
        act(() => {jest.runAllTimers();});

        grid1 = getAllByRole('grid')[0];
        grid2 = getAllByRole('grid')[1];
        list1rows = within(grid1).getAllByRole('row');
        list2rows = within(grid2).getAllByRole('row');

        expect(within(list1rows[0]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(list1rows[1]).getByRole('gridcell')).toHaveTextContent('Item Four');
        expect(within(list1rows[2]).getByRole('gridcell')).toHaveTextContent('Item Five');

        expect(within(list2rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(list2rows[1]).getByRole('gridcell')).toHaveTextContent('Item Three');
        expect(within(list2rows[2]).getByRole('gridcell')).toHaveTextContent('Item Seven');

        expect(document.activeElement).toBe(list2rows[0]);
      });

      it('should automatically focus an item after if it has been dropped on', async function () {
        let {getByRole, getAllByRole} = render(
          <DragIntoItemExample dragHookOptions={{onDragStart, onDragEnd}} listViewProps={{onSelectionChange, disabledKeys: []}} dropHookOptions={{onDrop}} />
        );

        let grid = getByRole('grid');
        let rows = getAllByRole('row');
        let cell = within(rows[1]).getByRole('gridcell');
        expect(within(rows[0]).getByRole('gridcell')).toHaveTextContent('Folder 1 (Drop items here)');
        expect(within(rows[1]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(rows[2]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(rows).toHaveLength(9);

        let dataTransfer = new DataTransfer();
        fireEvent.pointerDown(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
        fireEvent(cell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
        expect(onDragStart).toHaveBeenCalledTimes(1);

        fireEvent.pointerMove(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 350});
        fireEvent(cell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 350}));
        fireEvent(grid, new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 350}));
        fireEvent.pointerUp(cell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 350});

        fireEvent(grid, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 350}));
        act(() => jest.runAllTimers());
        await act(async () => Promise.resolve());
        expect(onDrop).toHaveBeenCalledTimes(1);

        fireEvent(cell, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 350}));
        expect(onDragEnd).toHaveBeenCalledTimes(1);

        act(() => jest.runAllTimers());

        rows = getAllByRole('row');
        expect(within(rows[0]).getByRole('gridcell')).toHaveTextContent('Folder 1 (Drop items here)');
        expect(within(rows[1]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(rows[2]).getByRole('gridcell')).toHaveTextContent('Item Three');

        expect(rows).toHaveLength(8);
        expect(document.activeElement).toBe(rows[7]);
      });

      it('should update the global DnD state properly if dropping on a non-collection', async function () {
        let {getAllByRole, getByRole, getByText} = render(
          <DraggableListView />
        );

        let grid = getByRole('grid');
        let droppable = getByText('Drop here');
        let rows = getAllByRole('row');
        await user.click(within(rows[0]).getByRole('checkbox'));
        await user.click(within(rows[1]).getByRole('checkbox'));
        await user.click(within(rows[2]).getByRole('checkbox'));
        await user.click(within(rows[3]).getByRole('checkbox'));
        // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
        // await user.click(within(rows[0]).getByRole('checkbox'));
        // await user.click(within(rows[1]).getByRole('checkbox'));
        // await user.click(within(rows[2]).getByRole('checkbox'));
        // await user.click(within(rows[3]).getByRole('checkbox'));

        expect(new Set(onSelectionChange.mock.calls[3][0])).toEqual(new Set(['a', 'b', 'c', 'd']));

        let cellA = within(rows[0]).getByRole('gridcell');

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
        let {getAllByRole, getByRole} = render(
          <DraggableListView />
        );

        let grid = getByRole('grid');
        let rows = getAllByRole('row');
        await user.click(within(rows[0]).getByRole('checkbox'));
        // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
        // await user.click(within(rows[0]).getByRole('checkbox'));
        let cellA = within(rows[0]).getByRole('gridcell');

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
          <DragBetweenListsComplex secondListDnDOptions={{getDropOperation: () => 'copy', onDrop, acceptedDragTypes: 'all'}} />
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
          <DragBetweenListsComplex />
        );

        let list = getAllByRole('grid')[0];
        let rows = within(list).getAllByRole('row');
        let internalFolder = rows[2];

        await user.click(within(rows[0]).getByRole('checkbox'));
        // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
        // await user.click(within(rows[0]).getByRole('checkbox'));
        let dragCell = within(rows[0]).getByRole('gridcell');
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
        expect(dndState.dropCollectionRef.current).toBe(list);

        // Leaving a valid drop target should clear the dropCollectionRef
        fireEvent(internalFolder, new DragEvent('dragleave', {dataTransfer, clientX: 1, clientY: 100}));
        dndState = globalDndState;
        expect(dndState.dropCollectionRef).toBeFalsy();
      });

      describe('using util handlers', function () {
        async function dragWithinList(rows, dropTarget, targetX = 1, targetY = 1) {
          await user.click(within(rows[0]).getByRole('checkbox'));
          await user.click(within(rows[1]).getByRole('checkbox'));
          // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
          // await user.click(within(rows[0]).getByRole('checkbox'));
          // await user.click(within(rows[1]).getByRole('checkbox'));
          let dragCell = within(rows[0]).getByRole('gridcell');

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
          // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
          // await user.click(within(sourceRows[0]).getByRole('checkbox'));
          // await user.click(within(sourceRows[1]).getByRole('checkbox'));
          let dragCell = within(sourceRows[0]).getByRole('gridcell');

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

        it('should call onInsert when dropping between items in a different list', async function () {
          let {getAllByRole} = render(
            <DragBetweenListsComplex firstListDnDOptions={mockUtilityOptions} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = within(grids[0]).getAllByRole('row')[0];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget);

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
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, getAllowedDropOperations: () => ['copy']}} />
          );

          let grids = getAllByRole('grid');
          let rows = within(grids[0]).getAllByRole('row');
          let dropTarget = rows[4];
          await dragWithinList(rows, dropTarget, 1, 150);

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

        it('should call onReorder when performing a insert drop in the source list', async function () {
          let {getAllByRole} = render(
            <DragBetweenListsComplex firstListDnDOptions={mockUtilityOptions} />
          );

          let grids = getAllByRole('grid');
          let rows = within(grids[0]).getAllByRole('row');
          let dropTarget = rows[4];
          await dragWithinList(rows, dropTarget, 1, 150);
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

        it('should call onRootDrop when dropping on the list root', async function () {
          // make onInsert null otherwise it will attempt to do insert operations
          let {getAllByRole} = render(
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, onInsert: null}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = grids[0];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget);
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

        it('should call onRootDrop when dropping on a empty list', async function () {
          function Example() {
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

            let {dragAndDropHooks: list1Hooks} = useDragAndDrop({
              ...mockUtilityOptions,
              acceptedDragTypes: 'all'
            });

            let {dragAndDropHooks: list2Hooks} = useDragAndDrop({
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
                <ListView
                  aria-label="Droppable listview"
                  width="size-3600"
                  height="size-3600"
                  items={list1.items}
                  dragAndDropHooks={list1Hooks}>
                  {(item) => (
                    <Item textValue={item.name}>
                      <Text>{item.name}</Text>
                    </Item>
                  )}
                </ListView>
                <ListView
                  aria-label="Draggable ListView"
                  selectionMode="multiple"
                  width="size-3600"
                  height="size-3600"
                  items={list2.items}
                  dragAndDropHooks={list2Hooks}>
                  {(item) => (
                    <Item textValue={item.name}>
                      <Text>{item.name}</Text>
                    </Item>
                  )}
                </ListView>
              </Flex>
            );
          }

          let {getAllByRole} = render(
            <Example />
          );
          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = grids[0];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget);
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

        it('should call onItemDrop when dropping on a folder in the list', async function () {
          let {getAllByRole} = render(
            <DragBetweenListsComplex firstListDnDOptions={mockUtilityOptions} secondListDnDOptions={{onDragEnd}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = within(grids[0]).getAllByRole('row')[4];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget, 1, 185);
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

          let list1Rows = within(grids[0]).getAllByRole('row');
          dropTarget = within(grids[0]).getAllByRole('row')[2];
          await dragWithinList(list1Rows, dropTarget, 1, 100);
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

        it('should allow acceptedDragTypes to specify what drag items the list should accept', async function () {
          let {getAllByRole} = render(
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, acceptedDragTypes: ['randomType']}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = within(grids[0]).getAllByRole('row')[0];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget);
          // Shouldn't allow a insert because the type from 2nd list isn't of "randomType"
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
        });

        it('should default acceptedDragTypes to "all" if not provided by the user', async function () {
          let shouldAcceptItemDrop = jest.fn();
          shouldAcceptItemDrop.mockReturnValue(true);
          let {getAllByRole} = render(
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, acceptedDragTypes: undefined, shouldAcceptItemDrop}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = within(grids[0]).getAllByRole('row')[4];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget, 1, 185);

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

          // Called twice from getDropOperation and twice in onDrop when performing item filtering
          expect(shouldAcceptItemDrop).toHaveBeenCalledTimes(4);
          expect(shouldAcceptItemDrop.mock.calls[0][0]).toEqual({key: '5', dropPosition: 'on', type: 'item'});
          expect(shouldAcceptItemDrop.mock.calls[1][0]).toEqual({key: '5', dropPosition: 'on', type: 'item'});
          expect(shouldAcceptItemDrop.mock.calls[2][0]).toEqual({key: '5', dropPosition: 'on', type: 'item'});
          expect(shouldAcceptItemDrop.mock.calls[2][1]).toEqual(new Set(['text/plain', 'folder']));
          expect(shouldAcceptItemDrop.mock.calls[3][0]).toEqual({key: '5', dropPosition: 'on', type: 'item'});
          expect(shouldAcceptItemDrop.mock.calls[3][1]).toEqual(new Set(['text/plain', 'file']));
        });

        it('should allow the user to specify what a valid drop target is via shouldAcceptItemDrop', async function () {
          let {getAllByRole} = render(
            <DragBetweenListsComplex
              firstListDnDOptions={{...mockUtilityOptions, shouldAcceptItemDrop: () => false}}
              secondListDnDOptions={{onDragEnd}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          // Perform same drop operation as the onItemDrop test, but this time it should do a insertion drop since we are disallowing all "on" drops
          let dropTarget = within(grids[0]).getAllByRole('row')[4];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget, 1, 185);
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
              key: '5',
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
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, onReorder: null, onItemDrop: null, onRootDrop: null, onInsert: null}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = within(grids[0]).getAllByRole('row')[4];
          let list1Rows = within(grids[0]).getAllByRole('row', {hidden: true});
          expect(list1Rows).toHaveLength(6);
          let list2Rows = within(grids[1]).getAllByRole('row');
          await user.click(within(list2Rows[0]).getByRole('checkbox'));
          await user.click(within(list2Rows[1]).getByRole('checkbox'));
          // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
          // await user.click(within(list2Rows[0]).getByRole('checkbox'));
          // await user.click(within(list2Rows[1]).getByRole('checkbox'));
          let dragCell = within(list2Rows[0]).getByRole('gridcell');

          let dataTransfer = new DataTransfer();
          fireEvent.pointerDown(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
          fireEvent(dragCell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));

          act(() => jest.runAllTimers());
          expect(onInsert).toHaveBeenCalledTimes(0);
          fireEvent.pointerMove(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
          fireEvent(dragCell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent(dropTarget, new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent.pointerUp(dragCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});

          list1Rows = within(grids[0]).getAllByRole('row', {hidden: true});
          // Row number shouldn't increase since the utility handlers have been disabled and thus drop indicators don't appear
          expect(list1Rows).toHaveLength(6);
        });

        it('should allow the user to override the util handlers via onDrop and getDropOperations', async function () {
          let getDropOperationMock = () => {
            getDropOperation();
            return 'copy';
          };
          let {getAllByRole} = render(
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, onDrop, getDropOperation: getDropOperationMock}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);
          expect(getDropOperation).toHaveBeenCalledTimes(0);

          let dropTarget = within(grids[0]).getAllByRole('row')[0];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget);

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onDrop).toHaveBeenCalledTimes(1);
          expect(getDropOperation.mock.calls.length).toBeGreaterThan(0);
        });

        it('should be able to perform drops if onDrop is provided without getDropOperation', async function () {
          let {getAllByRole} = render(
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, onDrop, acceptedDragTypes: 'all'}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = within(grids[0]).getAllByRole('row')[0];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget);

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
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, getDropOperation: getDropOperationMock}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);
          expect(getDropOperation).toHaveBeenCalledTimes(0);

          let dropTarget = within(grids[0]).getAllByRole('row')[0];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget);

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
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, acceptedDragTypes: 'all'}} />
          );

          let grids = getAllByRole('grid');
          let list1Rows = within(grids[0]).getAllByRole('row', {hidden: true});
          expect(list1Rows).toHaveLength(6);

          let dropTarget = within(grids[0]).getAllByRole('row')[0];
          let dataTransfer = new DataTransfer();
          let file = new File(['hello world'], 'test.abc', {type: ''});
          dataTransfer.items.add(file);

          fireEvent(dropTarget, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 1}));
          list1Rows = within(grids[0]).getAllByRole('row', {hidden: true});
          expect(list1Rows).toHaveLength(7);
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
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

          fireEvent(dropTarget, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
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
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, acceptedDragTypes: [DIRECTORY_DRAG_TYPE]}} />
          );

          let grids = getAllByRole('grid');
          let dropTarget = within(grids[0]).getAllByRole('row')[4];
          let dataTransfer = new DataTransfer();
          let dir = new FileSystemDirectoryEntry('test', [
            new FileSystemFileEntry(new File(['hello world'], 'test.txt', {type: 'text/plain'})),
            new FileSystemDirectoryEntry('nested', [
              new FileSystemFileEntry(new File(['<p>foo</p>'], 'foo.html', {type: 'text/html'}))
            ])
          ]);
          dataTransfer.items.add(dir);

          fireEvent(dropTarget, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 185}));
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 185}));
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
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, acceptedDragTypes: ['file', 'folder']}} secondListDnDOptions={{onDragEnd}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = within(grids[0]).getAllByRole('row')[0];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await user.click(within(list2Rows[0]).getByRole('checkbox'));
          await user.click(within(list2Rows[6]).getByRole('checkbox'));
          // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
          // await user.click(within(list2Rows[0]).getByRole('checkbox'));
          // await user.click(within(list2Rows[6]).getByRole('checkbox'));
          let dragCell = within(list2Rows[0]).getByRole('gridcell');

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
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onDragEnd).toHaveBeenCalledTimes(1);
          expect(onDragEnd).toHaveBeenCalledWith({
            type: 'dragend',
            keys: new Set(['7', '13']),
            x: 1,
            y: 1,
            dropOperation: 'move',
            isInternal: false
          });
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
              }
            ]
          });
          // Doesn't include the item w/ identifier 13 since that has a disallowed drag type
          let items = await Promise.all(onInsert.mock.calls[0][0].items.map(async (item) => JSON.parse(await item.getText(item.types.values().next().value))));
          expect(items).toContainObject({
            identifier: '7',
            type: 'folder',
            name: 'Pictures',
            childNodes: []
          });
        });

        it('should accept a drop that contains a mix of allowed and disallowed drag types (directories and file case)', function () {
          let {getAllByRole} = render(
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, onInsert: null, acceptedDragTypes: [DIRECTORY_DRAG_TYPE, 'text/plain']}} />
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
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, onInsert: null, acceptedDragTypes: ['text/plain'], getDropOperation: getDropOperation}} />
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
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, onInsert: null, acceptedDragTypes: ['text/plain'], onDrop}} />
          );

          let grids = getAllByRole('grid');
          let dropTarget = grids[0];
          let dataTransfer = new DataTransfer();
          let fileA = new File(['hello world'], 'test.html', {type: 'text/html'});
          let fileB = new File(['testing'], 'blah.txt', {type: 'text/plain'});
          dataTransfer.items.add(fileA);
          dataTransfer.items.add(fileB);

          fireEvent(dropTarget, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 1}));
          fireEvent(dropTarget, new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
          act(() => jest.runAllTimers());
          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(0);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onInsert).toHaveBeenCalledTimes(0);
          expect(onDrop).toHaveBeenCalledTimes(1);
          expect(onDrop).toHaveBeenCalledWith({
            type: 'drop',
            x: 1,
            y: 1,
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
          // All items for list 1 should be valid drop targets but it should only accept file type items
          let shouldAcceptItemDrop = (target, types) => target.type === 'item' && types.has('file');
          let {getAllByRole} = render(
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, shouldAcceptItemDrop}} secondListDnDOptions={{onDragEnd}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = within(grids[0]).getAllByRole('row')[4];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget, 1, 185);

          expect(onReorder).toHaveBeenCalledTimes(0);
          expect(onItemDrop).toHaveBeenCalledTimes(1);
          expect(onRootDrop).toHaveBeenCalledTimes(0);
          expect(onDragEnd).toHaveBeenCalledTimes(1);
          expect(onDragEnd).toHaveBeenCalledWith({
            type: 'dragend',
            keys: new Set(['7', '8']),
            x: 1,
            y: 185,
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
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, getDropOperation}} secondListDnDOptions={{getAllowedDropOperations: () => ['move', 'link']}} />
          );

          let grids = getAllByRole('grid');
          expect(grids).toHaveLength(2);

          let dropTarget = within(grids[0]).getAllByRole('row')[0];
          let list2Rows = within(grids[1]).getAllByRole('row');
          await dragBetweenLists(list2Rows, dropTarget);

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
        let {getAllByRole, getByText} = render(
          <DraggableListView />
        );

        let droppable = getByText('Drop here');
        let row = getAllByRole('row')[0];
        let cell = within(row).getByRole('gridcell');
        expect(cell).toHaveTextContent('Adobe Photoshop');
        expect(row).toHaveAttribute('draggable', 'true');

        await user.tab();
        await user.tab();
        let draghandle = within(cell).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();
        expect(draghandle).toHaveAttribute('draggable', 'true');

        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(draghandle);
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
        expect(await onDrop.mock.calls[0][0].items[0].getText('text/plain')).toBe('Adobe Photoshop');

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
        let {getAllByRole, getByText} = render(
          <DraggableListView listViewProps={{selectedKeys: ['a', 'b', 'c', 'd']}} />
      );

        await user.tab();

        let droppable = getByText('Drop here');
        let rows = getAllByRole('row');

        let cellA = within(rows[0]).getByRole('gridcell');
        expect(cellA).toHaveTextContent('Adobe Photoshop');
        expect(rows[0]).toHaveAttribute('draggable', 'true');

        let cellB = within(rows[1]).getByRole('gridcell');
        expect(cellB).toHaveTextContent('Adobe XD');
        expect(rows[1]).toHaveAttribute('draggable', 'true');

        let cellC = within(rows[2]).getByRole('gridcell');
        expect(cellC).toHaveTextContent('Documents');
        expect(rows[2]).toHaveAttribute('draggable', 'true');

        let cellD = within(rows[3]).getByRole('gridcell');
        expect(cellD).toHaveTextContent('Adobe InDesign');
        expect(rows[3]).toHaveAttribute('draggable', 'true');
        let draghandle = within(cellA).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();

        await user.tab();
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
        expect(await onDrop.mock.calls[0][0].items[0].getText('text/plain')).toBe('Adobe Photoshop');
        expect(await onDrop.mock.calls[0][0].items[1].getText('text/plain')).toBe('Adobe XD');
        expect(await onDrop.mock.calls[0][0].items[2].getText('text/plain')).toBe('Documents');
        expect(await onDrop.mock.calls[0][0].items[3].getText('text/plain')).toBe('Adobe InDesign');

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
        let {getAllByRole, getByRole, getByText} = render(
          <DraggableListView listViewProps={{selectedKeys: ['a', 'b', 'c', 'd']}} />
        );

        let grid = getByRole('grid');
        let droppable = getByText('Drop here');
        let rows = getAllByRole('row');

        let cellA = within(rows[0]).getByRole('gridcell');
        await user.tab();
        let draghandle = within(cellA).getAllByRole('button')[0];
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
        let {getAllByRole, getByRole, getByText} = render(
          <DraggableListView listViewProps={{selectedKeys: ['a', 'b', 'c', 'd']}} />
        );

        let grid = getByRole('grid');
        let droppable = getByText('Drop here');
        let rows = getAllByRole('row');

        let cellA = within(rows[0]).getByRole('gridcell');
        await user.tab();
        let draghandle = within(cellA).getAllByRole('button')[0];
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
          <DragBetweenListsComplex firstListDnDOptions={{onDragEnd}} />
        );

        let list = getAllByRole('grid')[0];
        let rows = within(list).getAllByRole('row');
        let cell = within(rows[0]).getByRole('gridcell');

        await user.tab();
        let draghandle = within(cell).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();
        expect(draghandle).toHaveAttribute('draggable', 'true');
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(draghandle);
        await user.keyboard('{Enter}');
        act(() => jest.runAllTimers());

        // First drop target should be an internal folder, hence setting dropCollectionRef
        let dndState = globalDndState;
        expect(dndState.dropCollectionRef.current).toBe(list);

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
          let row = within(grids[0]).getAllByRole('row')[0];
          let cell = within(row).getByRole('gridcell');
          expect(cell).toHaveTextContent('Adobe Photoshop');
          expect(row).toHaveAttribute('draggable', 'true');

          await user.tab();
          let draghandle = within(cell).getAllByRole('button')[0];
          expect(draghandle).toBeTruthy();
          expect(draghandle).toHaveAttribute('draggable', 'true');
          await user.keyboard('{ArrowRight}');
          expect(document.activeElement).toBe(draghandle);
          await user.keyboard('{Enter}');
          act(() => jest.runAllTimers());
        }

        it('should call onInsert when dropping between items in a different list', async function () {
          let tree = render(
            <DragBetweenListsComplex secondListDnDOptions={mockUtilityOptions} />
          );

          await beginDrag(tree);
          // Move to 2nd list's first insert indicator
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

        it('should call onReorder when performing a insert drop in the source list', async function () {
          let tree = render(
            <DragBetweenListsComplex firstListDnDOptions={mockUtilityOptions} />
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

        it('should call onRootDrop when dropping on the list root', async function () {
          let tree = render(
            <DragBetweenListsComplex firstListDnDOptions={{onDragEnd}} secondListDnDOptions={mockUtilityOptions} />
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

        it('should call onItemDrop when dropping on a folder in the list', async function () {
          let tree = render(
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, onDragEnd}} secondListDnDOptions={mockUtilityOptions} />
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

          // Drop on folder in same list
          await beginDrag(tree);
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
          expect(document.activeElement).toHaveAttribute('aria-label', 'Drop on Documents');
          fireEvent.keyDown(document.activeElement, {key: 'Enter'});
          fireEvent.keyUp(document.activeElement, {key: 'Enter'});

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

        it('should allow acceptedDragTypes to specify what drag items the list should accept', async function () {
          let tree = render(
            <DragBetweenListsComplex firstListDnDOptions={{...mockUtilityOptions, acceptedDragTypes: ['randomType']}} secondListDnDOptions={{acceptedDragTypes: ['randomType']}} />
          );

          let totalRows = tree.getAllByRole('row', {hidden: true});
          expect(totalRows).toHaveLength(13);
          await beginDrag(tree);
          // No drop indicators should appear
          totalRows = tree.getAllByRole('row', {hidden: true});
          expect(totalRows).toHaveLength(13);
        });

        it('should allow the user to specify what a valid drop target is via shouldAcceptItemDrop', async function () {
          let tree = render(
            <DragBetweenListsComplex
              firstListDnDOptions={{onDragEnd}}
              secondListDnDOptions={{...mockUtilityOptions, shouldAcceptItemDrop: (target) => target.type === 'item'}} />
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
            <DragBetweenListsComplex firstListDnDOptions={mockUtilityOptions} />
          );

          await beginDrag(tree);
          await user.tab();
          await user.keyboard('{ArrowDown}');
          // Should allow insert since we provide all handlers
          expect(document.activeElement).toHaveAttribute('aria-label', 'Insert before Pictures');
          await user.keyboard('{Escape}');

          tree.rerender(<DragBetweenListsComplex secondListDnDOptions={{...mockUtilityOptions, onRootDrop: null, onInsert: null}} />);
          await user.tab({shift: true});
          await user.tab({shift: true});
          await beginDrag(tree);
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
            <DragBetweenListsComplex secondListDnDOptions={{...mockUtilityOptions, onDrop: onDrop, getDropOperation: getDropOperationMock}} />
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
            <DragBetweenListsComplex secondListDnDOptions={{...mockUtilityOptions, onDrop, acceptedDragTypes: 'all'}} />
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
            <DragBetweenListsComplex secondListDnDOptions={{...mockUtilityOptions, getDropOperation: getDropOperationMock}} />
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
            <DragBetweenListsComplex
              listViewProps={{selectedKeys: ['1', '3']}}
              firstListDnDOptions={{onDragEnd}}
              secondListDnDOptions={{...mockUtilityOptions, acceptedDragTypes: ['file']}} />
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
            <DragBetweenListsComplex listViewProps={{selectedKeys: ['1', '3']}} firstListDnDOptions={{...mockUtilityOptions, onDragEnd}} secondListDnDOptions={{...mockUtilityOptions, shouldAcceptItemDrop}} />
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
            <DragBetweenListsComplex firstListDnDOptions={{getAllowedDropOperations: () => ['move', 'link']}} secondListDnDOptions={{...mockUtilityOptions, getDropOperation}} />
          );

          await beginDrag(tree);
          // Move to 2nd list's first insert indicator
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

      it('should allow moving one item within a list', async function () {
        let {getAllByRole} =  render(<Reorderable />);

        let rows = getAllByRole('row');
        expect(within(rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(rows[1]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(rows[2]).getByRole('gridcell')).toHaveTextContent('Item Three');

        await user.tab();
        let draghandle = within(getAllByRole('row')[1]).getAllByRole('button')[0];
        expect(draghandle).toBeTruthy();

        fireEvent.keyDown(document.activeElement, {key: 'ArrowRight'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowRight'});

        expect(document.activeElement).toBe(draghandle);

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        act(() => jest.runAllTimers());

        fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

        expect(document.activeElement).toHaveAttribute('aria-label', 'Insert between Item Three and Item Four');

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        await act(async () => Promise.resolve());
        expect(onDrop).toHaveBeenCalledTimes(1);

        rows = getAllByRole('row');
        expect(within(rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(rows[1]).getByRole('gridcell')).toHaveTextContent('Item Three');
        expect(within(rows[2]).getByRole('gridcell')).toHaveTextContent('Item Two');

        expect(document.activeElement).toBe(rows[2]);
      });

      it('should allow moving multiple items within a list', async function () {
        let {getAllByRole} =  render(<Reorderable />);

        let rows = getAllByRole('row');
        expect(within(rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(rows[1]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(rows[2]).getByRole('gridcell')).toHaveTextContent('Item Three');
        expect(within(rows[3]).getByRole('gridcell')).toHaveTextContent('Item Four');

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

        expect(document.activeElement).toHaveAttribute('aria-label', 'Insert between Item Four and Item Five');

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        await act(async () => Promise.resolve());
        expect(onDrop).toHaveBeenCalledTimes(1);

        rows = getAllByRole('row');
        expect(within(rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(rows[1]).getByRole('gridcell')).toHaveTextContent('Item Four');
        expect(within(rows[2]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(rows[3]).getByRole('gridcell')).toHaveTextContent('Item Three');

        expect(document.activeElement).toBe(rows[3]);
      });

      it('should allow moving one item into another list', async function () {
        let {getAllByRole} =  render(<DragBetweenLists />);

        let list1 = getAllByRole('grid')[0];
        let list2 = getAllByRole('grid')[1];

        let list1rows = within(list1).getAllByRole('row');
        let list2rows = within(list2).getAllByRole('row');
        expect(within(list1rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(list1rows[1]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(list1rows[2]).getByRole('gridcell')).toHaveTextContent('Item Three');

        expect(within(list2rows[0]).getByRole('gridcell')).toHaveTextContent('Item Seven');
        expect(within(list2rows[1]).getByRole('gridcell')).toHaveTextContent('Item Eight');
        expect(within(list2rows[2]).getByRole('gridcell')).toHaveTextContent('Item Nine');

        await user.tab();

        let draghandle = within(getAllByRole('row')[0]).getAllByRole('button')[0];
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

        list1 = getAllByRole('grid')[0];
        list2 = getAllByRole('grid')[1];
        list1rows = within(list1).getAllByRole('row');
        list2rows = within(list2).getAllByRole('row');

        expect(within(list1rows[0]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(list1rows[1]).getByRole('gridcell')).toHaveTextContent('Item Three');
        expect(within(list1rows[2]).getByRole('gridcell')).toHaveTextContent('Item Four');

        expect(within(list2rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(list2rows[1]).getByRole('gridcell')).toHaveTextContent('Item Seven');
        expect(within(list2rows[2]).getByRole('gridcell')).toHaveTextContent('Item Eight');

        expect(document.activeElement).toBe(list2rows[0]);
      });

      it('should allow moving multiple items into another list', async function () {
        let {getAllByRole} =  render(<DragBetweenLists />);

        let list1 = getAllByRole('grid')[0];
        let list2 = getAllByRole('grid')[1];

        let list1rows = within(list1).getAllByRole('row');
        let list2rows = within(list2).getAllByRole('row');

        expect(within(list1rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(list1rows[1]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(list1rows[2]).getByRole('gridcell')).toHaveTextContent('Item Three');

        expect(within(list2rows[0]).getByRole('gridcell')).toHaveTextContent('Item Seven');
        expect(within(list2rows[1]).getByRole('gridcell')).toHaveTextContent('Item Eight');
        expect(within(list2rows[2]).getByRole('gridcell')).toHaveTextContent('Item Nine');

        await user.tab();

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});

        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        fireEvent.keyUp(document.activeElement, {key: 'Enter'});

        let draghandle = within(list1rows[0]).getAllByRole('button')[0];
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

        list1 = getAllByRole('grid')[0];
        list2 = getAllByRole('grid')[1];
        list1rows = within(list1).getAllByRole('row');
        list2rows = within(list2).getAllByRole('row');

        expect(within(list1rows[0]).getByRole('gridcell')).toHaveTextContent('Item Two');
        expect(within(list1rows[1]).getByRole('gridcell')).toHaveTextContent('Item Four');
        expect(within(list1rows[2]).getByRole('gridcell')).toHaveTextContent('Item Five');

        expect(within(list2rows[0]).getByRole('gridcell')).toHaveTextContent('Item One');
        expect(within(list2rows[1]).getByRole('gridcell')).toHaveTextContent('Item Three');
        expect(within(list2rows[2]).getByRole('gridcell')).toHaveTextContent('Item Seven');

        expect(document.activeElement).toBe(list2rows[0]);
      });

      it('should automatically focus an item after if it has been dropped on', async function () {
        let {getByRole} = render(
          <DragIntoItemExample dragHookOptions={{onDragStart, onDragEnd}} listViewProps={{onSelectionChange, disabledKeys: []}} dropHookOptions={{onDrop}} />
        );

        let grid = getByRole('grid');
        let rows = within(grid).getAllByRole('row');
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
        rows = within(grid).getAllByRole('row');
        expect(rows).toHaveLength(8);

        expect(document.activeElement).toBe(rows[7]);
      });
    });

    it('should make row selection happen on pressUp if list is draggable', function () {
      let {getAllByRole} = render(
        <DraggableListView />
      );

      let rows = getAllByRole('row');
      let draggableRow = rows[0];
      expect(draggableRow).toHaveAttribute('aria-selected', 'false');
      fireEvent.pointerDown(draggableRow, {pointerType: 'mouse'});
      expect(draggableRow).toHaveAttribute('aria-selected', 'false');
      expect(onSelectionChange).toHaveBeenCalledTimes(0);
      fireEvent.pointerUp(draggableRow, {pointerType: 'mouse'});
      fireEvent.click(draggableRow, {detail: 1});
      expect(draggableRow).toHaveAttribute('aria-selected', 'true');
      checkSelection(onSelectionChange, ['a']);
    });

    it('should toggle selection upon clicking the row checkbox', async function () {
      let {getAllByRole} = render(
        <DraggableListView />
      );

      let row = getAllByRole('row')[0];
      expect(row).toHaveAttribute('aria-selected', 'false');
      expect(row).toHaveAttribute('draggable', 'true');
      await user.click(within(row).getByRole('checkbox'));
      // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
      // await user.click(within(row).getByRole('checkbox'));
      expect(row).toHaveAttribute('aria-selected', 'true');
      expect(onDragStart).toHaveBeenCalledTimes(0);
      checkSelection(onSelectionChange, ['a']);
    });

    it('should only display the drag handle on keyboard focus for dragggable items', async function () {
      let {getAllByRole} = render(
        <DraggableListView listViewProps={{selectionMode: 'single'}} />
    );

      let rows = getAllByRole('row');
      let cellA = within(rows[0]).getByRole('gridcell');
      await user.click(cellA, {pointerType: 'mouse'});
      expect(document.activeElement).toBe(rows[0]);
      let dragHandle = within(cellA).getAllByRole('button')[0];
      // If the dragHandle has a style applied, it is visually hidden
      expect(dragHandle.style).toBeTruthy();
      expect(dragHandle.style.position).toBe('absolute');

      fireEvent.pointerDown(rows[0], {pointerType: 'mouse', button: 0, pointerId: 1});
      dragHandle = within(cellA).getAllByRole('button')[0];
      expect(dragHandle.style).toBeTruthy();
      expect(dragHandle.style.position).toBe('absolute');
      fireEvent.pointerUp(rows[0], {button: 0, pointerId: 1});

      fireEvent.pointerEnter(rows[0], {pointerType: 'mouse'});
      dragHandle = within(cellA).getAllByRole('button')[0];
      expect(dragHandle.style).toBeTruthy();
      expect(dragHandle.style.position).toBe('absolute');

      // If dragHandle doesn't have a position applied, it isn't visually hidden
      fireEvent.keyDown(rows[0], {key: 'Enter'});
      fireEvent.keyUp(rows[0], {key: 'Enter'});
      dragHandle = within(cellA).getAllByRole('button')[0];
      expect(dragHandle.style.position).toBe('');
    });

    it('should not display the drag handle on hover, press, or keyboard focus for disabled/non dragggable items', async function () {
      function hasDragHandle(el) {
        let buttons = within(el).getAllByRole('button');
        return buttons[0].getAttribute('draggable');
      }

      let {getAllByRole} = render(
        <DraggableListView listViewProps={{disabledKeys: ['a']}} />
    );

      let rows = getAllByRole('row');
      let cellA = within(rows[0]).getByRole('gridcell');
      let cellB = within(rows[1]).getByRole('gridcell');

      await user.tab();
      expect(hasDragHandle(cellA)).toBeFalsy();
      moveFocus('ArrowDown');
      expect(hasDragHandle(cellB)).toBeTruthy();

      fireEvent.pointerDown(cellA, {button: 0, pointerId: 1});
      expect(hasDragHandle(cellA)).toBeFalsy();
      fireEvent.pointerUp(cellA, {button: 0, pointerId: 1});

      fireEvent.pointerDown(cellB, {button: 0, pointerId: 1});
      expect(hasDragHandle(cellB)).toBeTruthy();
      fireEvent.pointerUp(cellB, {button: 0, pointerId: 1});

      fireEvent.pointerEnter(cellA);
      expect(hasDragHandle(cellA)).toBeFalsy();
      fireEvent.pointerEnter(cellB);
      expect(hasDragHandle(cellB)).toBeTruthy();
    });

    it('should display the drag handle on hover, press, or keyboard focus for disabled/non dragggable items with disabledBehavior="selection"', async function () {
      function hasDragHandle(el) {
        let buttons = within(el).getAllByRole('button');
        return buttons[0].getAttribute('draggable');
      }

      let {getAllByRole} = render(
        <DraggableListView listViewProps={{disabledKeys: ['a'], disabledBehavior: 'selection'}} />
    );

      let rows = getAllByRole('row');
      let cellA = within(rows[0]).getByRole('gridcell');
      let cellB = within(rows[1]).getByRole('gridcell');

      await user.tab();
      expect(hasDragHandle(cellA)).toBeTruthy();
      moveFocus('ArrowDown');
      expect(hasDragHandle(cellB)).toBeTruthy();

      fireEvent.pointerDown(cellA, {button: 0, pointerId: 1});
      expect(hasDragHandle(cellA)).toBeTruthy();
      fireEvent.pointerUp(cellA, {button: 0, pointerId: 1});

      fireEvent.pointerDown(cellB, {button: 0, pointerId: 1});
      expect(hasDragHandle(cellB)).toBeTruthy();
      fireEvent.pointerUp(cellB, {button: 0, pointerId: 1});

      fireEvent.pointerEnter(cellA);
      expect(hasDragHandle(cellA)).toBeTruthy();
      fireEvent.pointerEnter(cellB);
      expect(hasDragHandle(cellB)).toBeTruthy();
    });

    it('should open a menu upon click', async function () {
      let {getAllByRole, getByRole} = render(
        <DraggableListView />
      );

      let row = getAllByRole('row')[0];
      expect(row).toHaveAttribute('aria-selected', 'false');
      expect(row).toHaveAttribute('draggable', 'true');

      let menuButton = within(row).getAllByRole('button')[1];
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(menuButton, {pointerType: 'mouse'});
      act(() => {jest.runAllTimers();});

      let menu = getByRole('menu');
      expect(menu).toBeTruthy();
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(row).toHaveAttribute('aria-selected', 'false');
      expect(onDragStart).toHaveBeenCalledTimes(0);
      expect(onSelectionChange).toHaveBeenCalledTimes(0);
    });

    // disabledKeys 1 means we actually start on item 2 and drag that, so everything is offset by 1 and it wraps one early
    it.each`
    disabledKeys | itemLabels
    ${['1']}     | ${['Two', 'Three', 'Four', 'Five', 'Six', 'before', 'One', 'Two']}
    ${['2']}     | ${['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'before']}
    ${['3']}     | ${['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'before']}
    ${['4']}     | ${['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'before']}
    ${['5']}     | ${['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'before']}
    ${['6']}     | ${['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'before']}
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

      for (let i = 0; i <= 6; i++) {
        if (itemLabels[i] === 'Six') {
          expect(document.activeElement).toHaveAttribute('aria-label', 'Insert after Item Six');
        } else if (itemLabels[i] === 'before') {
          expect(document.activeElement).toHaveAttribute('aria-label', 'Insert before Item One');
        } else {
          expect(document.activeElement).toHaveAttribute('aria-label', `Insert between Item ${itemLabels[i]} and Item ${itemLabels[i + 1]}`);
        }
        fireEvent.keyDown(document.activeElement, {key: 'ArrowDown'});
        fireEvent.keyUp(document.activeElement, {key: 'ArrowDown'});
      }

      fireEvent.keyDown(document.activeElement, {key: 'Escape'});
      fireEvent.keyUp(document.activeElement, {key: 'Escape'});

      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('should only count the selected keys that exist in the collection when dragging and dropping', async function () {
      let {getAllByRole} = render(
        <DragIntoItemExample dragHookOptions={{onDragStart, onDragEnd}} listViewProps={{onSelectionChange, disabledKeys: []}} dropHookOptions={{onDrop}} />
      );

      await user.tab();
      let rows = getAllByRole('row');
      expect(rows).toHaveLength(9);
      let droppable = rows[8];
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(new Set(onSelectionChange.mock.calls[2][0])).toEqual(new Set(['1', '2', '3']));
      let draghandle = within(rows[3]).getAllByRole('button')[0];
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
      let droppableButton = await within(droppable).findByLabelText('Drop on Folder 2', {hidden: true});
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

      rows = getAllByRole('row');
      expect(rows).toHaveLength(6);

      // Select the folder and perform a drag. Drag start shouldn't include the previously selected items
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      // Selection change event still has all keys
      expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(['1', '2', '3', '8']));

      draghandle = within(rows[0]).getAllByRole('button')[0];
      expect(draghandle).toBeTruthy();
      expect(draghandle).toHaveAttribute('draggable', 'true');
      await user.keyboard('{ArrowUp}'.repeat(5));
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(draghandle);
      await user.keyboard('{Enter}');
      act(() => jest.runAllTimers());

      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragStart).toHaveBeenCalledWith({
        type: 'dragstart',
        keys: new Set(['0']),
        x: 50,
        y: 25
      });

      await user.keyboard('{Escape}');
    });

    it('should automatically focus the newly added dropped item', async function () {
      let {getAllByRole} = render(
        <DragBetweenListsRootOnlyExample dragHookOptions={{onDragStart, onDragEnd}} listViewProps={{onSelectionChange, disabledKeys: []}} dropHookOptions={{onDrop}} />
      );

      let grids = getAllByRole('grid');
      expect(grids).toHaveLength(2);
      let firstListRows = within(grids[0]).getAllByRole('row');
      let draggedCell = within(firstListRows[0]).getByRole('gridcell');
      let secondListRows = within(grids[1]).getAllByRole('row');
      expect(firstListRows).toHaveLength(6);
      expect(secondListRows).toHaveLength(6);

      let dataTransfer = new DataTransfer();
      fireEvent.pointerDown(draggedCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
      fireEvent(draggedCell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));

      act(() => jest.runAllTimers());
      expect(onDragStart).toHaveBeenCalledTimes(1);
      fireEvent.pointerMove(draggedCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
      fireEvent(draggedCell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
      fireEvent(grids[1], new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 1}));
      fireEvent(grids[1], new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
      fireEvent.pointerUp(draggedCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
      fireEvent(draggedCell, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 1}));

      await waitFor(() => expect(within(grids[1]).getAllByRole('row')).toHaveLength(7), {interval: 10});
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDragEnd).toHaveBeenCalledTimes(1);

      act(() => jest.runAllTimers());
      grids = getAllByRole('grid');
      firstListRows = within(grids[0]).getAllByRole('row');
      secondListRows = within(grids[1]).getAllByRole('row');
      expect(firstListRows).toHaveLength(5);
      expect(secondListRows).toHaveLength(7);

      // The newly added row in the second list should be the active element
      expect(secondListRows[6]).toBe(document.activeElement);
      expect(secondListRows[6]).toHaveTextContent('Item One');

      for (let [index, row] of secondListRows.entries()) {
        if (index !== 6) {
          expect(row).toHaveAttribute('tabIndex', '-1');
        } else {
          expect(row).toHaveAttribute('tabIndex', '0');
        }
      }

      draggedCell = firstListRows[3];
      dataTransfer = new DataTransfer();
      fireEvent.pointerDown(draggedCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 0, clientY: 0});
      fireEvent(draggedCell, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));

      act(() => jest.runAllTimers());
      expect(onDragStart).toHaveBeenCalledTimes(2);
      fireEvent.pointerMove(draggedCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
      fireEvent(draggedCell, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
      fireEvent(grids[1], new DragEvent('dragover', {dataTransfer, clientX: 1, clientY: 2}));
      fireEvent.pointerUp(draggedCell, {pointerType: 'mouse', button: 0, pointerId: 1, clientX: 1, clientY: 1});
      fireEvent(grids[1], new DragEvent('drop', {dataTransfer, clientX: 1, clientY: 1}));
      fireEvent(draggedCell, new DragEvent('dragend', {dataTransfer, clientX: 1, clientY: 1}));

      act(() => jest.advanceTimersByTime(0));
      await waitFor(() => expect(within(grids[1]).getAllByRole('row')).toHaveLength(8), {interval: 10});
      expect(onDrop).toHaveBeenCalledTimes(2);
      expect(onDragEnd).toHaveBeenCalledTimes(2);

      act(() => jest.runAllTimers());
      grids = getAllByRole('grid');
      firstListRows = within(grids[0]).getAllByRole('row');
      secondListRows = within(grids[1]).getAllByRole('row');
      expect(firstListRows).toHaveLength(4);
      expect(secondListRows).toHaveLength(8);

      // The 2nd newly added row in the second list should still be the active element
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
      let {getAllByRole, getByText} = render(
        <DraggableListView dragHookOptions={{getAllowedDropOperations}} />
        );

      let droppable = getByText('Drop here');
      let row = getAllByRole('row')[0];
      let cell = within(row).getByRole('gridcell');

      await user.tab();
      let draghandle = within(cell).getAllByRole('button')[0];

      await user.tab();
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

        let {getAllByRole} = render(
          <DraggableListView listViewProps={{defaultSelectedKeys: ['a', 'b', 'c']}} />
        );

        let rows = getAllByRole('row');
        expect(rows[0]).toHaveAttribute('draggable', 'true');
        let cellA = within(rows[0]).getByRole('gridcell');
        let dragButtonA = within(cellA).getAllByRole('button')[0];
        expect(dragButtonA).toHaveAttribute('aria-label', 'Drag 3 selected items');

        expect(rows[1]).toHaveAttribute('draggable', 'true');
        let cellB = within(rows[1]).getByRole('gridcell');
        let dragButtonB = within(cellB).getAllByRole('button')[0];
        expect(dragButtonB).toHaveAttribute('aria-label', 'Drag 3 selected items');

        expect(rows[2]).toHaveAttribute('draggable');

        expect(rows[3]).toHaveAttribute('draggable', 'true');
        let cellD = within(rows[3]).getByRole('gridcell');
        let dragButtonD = within(cellD).getAllByRole('button')[0];
        expect(dragButtonD).toHaveAttribute('aria-label', 'Drag Adobe InDesign');

        // After selecting row 4, the aria-label should reflect 4 selected items rather than just "Drag Adobe InDesign"
        await user.click(within(rows[3]).getByRole('checkbox'));
        // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
        // await user.click(within(rows[3]).getByRole('checkbox'));
        expect(dragButtonA).toHaveAttribute('aria-label', 'Drag 4 selected items');
        expect(dragButtonB).toHaveAttribute('aria-label', 'Drag 4 selected items');
        expect(dragButtonD).toHaveAttribute('aria-label', 'Drag 4 selected items');

        await user.click(within(rows[0]).getByRole('checkbox'));
        // TODO: reinstate these when https://github.com/testing-library/user-event/issues/1119 is fixed
        // await user.click(within(rows[0]).getByRole('checkbox'));
        expect(dragButtonA).toHaveAttribute('aria-label', 'Drag Adobe Photoshop');
        expect(dragButtonB).toHaveAttribute('aria-label', 'Drag 3 selected items');
        expect(dragButtonD).toHaveAttribute('aria-label', 'Drag 3 selected items');
      });

      it('disabled rows and invalid drop targets should become aria-hidden when keyboard drag session starts', async function () {
        let {getAllByRole} = render(
          <ReorderExample listViewProps={{disabledKeys: ['2']}} />
        );

        let rows = getAllByRole('row');
        for (let row of rows) {
          expect(row).not.toHaveAttribute('aria-hidden');
        }

        let row = rows[0];
        let cell = within(row).getByRole('gridcell');
        let draghandle = within(cell).getAllByRole('button')[0];
        expect(row).toHaveAttribute('draggable', 'true');
        await user.tab();
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(draghandle);
        await user.keyboard('{Enter}');
        act(() => jest.runAllTimers());

        for (let [index, row] of rows.entries()) {
          let cell = within(row).getByRole('gridcell', {hidden: true});
          // We hide the cell for iOS Safari and remove the row tab index so TalkBack doesn't focus the row
          expect(row).not.toHaveAttribute('tabindex');
          if (index === 0) {
            expect(row).not.toHaveAttribute('aria-hidden', 'true');
            expect(cell).not.toHaveAttribute('aria-hidden', 'true');
          } else {
            expect(row).toHaveAttribute('aria-hidden', 'true');
            expect(cell).toHaveAttribute('aria-hidden', 'true');
          }
        }

        await user.keyboard('{Escape}');
      });
    });
  });
});
