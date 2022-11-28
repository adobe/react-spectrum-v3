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

import {act, fireEvent, installPointerEvent} from '@react-spectrum/test-utils';
import {Cell, Column, Row, TableBody, TableHeader} from '@react-stately/table';
import {composeStories} from '@storybook/testing-react';
import React, {Key} from 'react';
import {render} from '@testing-library/react';
import {Table as ResizingTable} from '../stories/example-resizing';
import * as stories from '../stories/useTable.stories';
import {within} from '@testing-library/dom';

let {TableWithSomeResizingFRsControlled} = composeStories(stories);

let rows = [
  {id: 1, name: 'Charizard', type: 'Fire, Flying', level: '67', weight: '200lbs', height: '5\'7"'},
  {id: 2, name: 'Blastoise', type: 'Water', level: '56', weight: '188lbs', height: '5\'3"'},
  {id: 3, name: 'Venusaur', type: 'Grass, Poison', level: '83', weight: '220lbs', height: '6\'7"'},
  {id: 4, name: 'Pikachu', type: 'Electric', level: '100', weight: '13lbs', height: '1\'4"'},
  {id: 5, name: 'Charizard', type: 'Fire, Flying', level: '67', weight: '200lbs', height: '5\'7"'},
  {id: 6, name: 'Blastoise', type: 'Water', level: '56', weight: '188lbs', height: '5\'3"'},
  {id: 7, name: 'Venusaur', type: 'Grass, Poison', level: '83', weight: '220lbs', height: '6\'7"'},
  {id: 8, name: 'Pikachu', type: 'Electric', level: '100', weight: '13lbs', height: '1\'4"'},
  {id: 9, name: 'Charizard', type: 'Fire, Flying', level: '67', weight: '200lbs', height: '5\'7"'},
  {id: 10, name: 'Blastoise', type: 'Water', level: '56', weight: '188lbs', height: '5\'3"'},
  {id: 11, name: 'Venusaur', type: 'Grass, Poison', level: '83', weight: '220lbs', height: '6\'7"'},
  {id: 12, name: 'Pikachu', type: 'Electric', level: '100', weight: '13lbs', height: '1\'4"'}
];

function getColumnWidths(tree) {
  let rows = tree.getAllByRole('row') as HTMLElement[];
  return Array.from(rows[0].childNodes).map((cell: HTMLElement) => Number(cell.style.width.replace('px', '')));
}

// I'd use tree.getByRole(role, {name: text}) here, but it's unbearably slow.
function getColumn(tree, name) {
  // Find by text, then go up to the element with the cell role.
  let el = tree.getByText(name);
  while (el && !/columnheader/.test(el.getAttribute('role'))) {
    el = el.parentElement;
  }

  return el;
}

function resizeCol(tree, col, delta) {
  let column = getColumn(tree, col);
  let resizer = within(column).getByRole('slider');

  fireEvent.pointerEnter(resizer);

  // actual locations do not matter, the delta matters between events for the calculation of useMove
  fireEvent.pointerDown(resizer, {pointerType: 'mouse', pointerId: 1, pageX: 0, pageY: 30});
  fireEvent.pointerMove(resizer, {pointerType: 'mouse', pointerId: 1, pageX: delta, pageY: 25});
  fireEvent.pointerUp(resizer, {pointerType: 'mouse', pointerId: 1});
}

// assumption with all these tests, the controlling values we pass in aren't actually controlling
// the sizes, they are instead more like the default values that the controlling logic uses
describe('Aria Table Resizing', () => {
  installPointerEvent();
  let offsetWidth, offsetHeight;
  let onResize;

  beforeEach(function () {
    offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 900);
    offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    jest.useFakeTimers();
    onResize = jest.fn();
  });

  afterEach(function () {
    act(() => {jest.runAllTimers();});
    offsetWidth.mockReset();
    offsetHeight.mockReset();
    onResize = null;
  });

  describe.each`
    allowsResizing
    ${undefined}
    ${true}
  `('initial column sizes allowsResizing=$allowsResizing', ({allowsResizing}) => {
    it('should handle no value if table was written with default widths', () => {
      let columns = [
        {name: 'Name', id: 'name', allowsResizing},
        {name: 'Type', id: 'type', allowsResizing},
        {name: 'Level', id: 'level', allowsResizing}
      ];
      let tree = render(<Table columns={columns} rows={rows} />);
      expect(getColumnWidths(tree)).toStrictEqual([150, 150, 150]);
    });
    it('should handle default pixel widths', () => {
      let columns = [
        {name: 'Name', id: 'name', defaultWidth: 100, allowsResizing},
        {name: 'Type', id: 'type', defaultWidth: 100, allowsResizing},
        {name: 'Level', id: 'level', defaultWidth: 400, allowsResizing}
      ];
      let tree = render(<Table columns={columns} rows={rows} />);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 400]);
    });
    it('should handle default percent widths', () => {
      let columns = [
        {name: 'Name', id: 'name', defaultWidth: '50%', allowsResizing},
        {name: 'Type', id: 'type', defaultWidth: '16%', allowsResizing},
        {name: 'Level', id: 'level', defaultWidth: '33%', allowsResizing}
      ];
      let tree = render(<Table columns={columns} rows={rows} />);
      expect(getColumnWidths(tree)).toStrictEqual([450, 144, 297]);
    });
    it('should handle default fr widths', () => {
      let columns = [
        {name: 'Name', id: 'name', defaultWidth: '4fr', allowsResizing},
        {name: 'Type', id: 'type', defaultWidth: '3fr', allowsResizing},
        {name: 'Level', id: 'level', defaultWidth: '2fr', allowsResizing}
      ];
      let tree = render(<Table columns={columns} rows={rows} />);
      expect(getColumnWidths(tree)).toStrictEqual([400, 300, 200]);
    });
    it('should handle a mix of default widths', () => {
      let columns = [
        {name: 'Name', id: 'name', defaultWidth: '50%', allowsResizing},
        {name: 'Type', id: 'type', defaultWidth: '2fr', allowsResizing},
        {name: 'Level', id: 'level', defaultWidth: 100, allowsResizing},
        {name: 'Height', id: 'height', allowsResizing}
      ];
      let tree = render(<Table columns={columns} rows={rows} />);
      expect(getColumnWidths(tree)).toStrictEqual([450, 200, 100, 150]);
    });
    it('any single remaining column with an FR will take the remaining space, regardless of how many FRs it is "worth"', () => {
      let columns = [
        {name: 'Name', id: 'name', defaultWidth: '50%', allowsResizing},
        {name: 'Type', id: 'type', defaultWidth: '1fr', allowsResizing},
        {name: 'Level', id: 'level', defaultWidth: 100, allowsResizing},
        {name: 'Height', id: 'height', allowsResizing}
      ];
      let tree = render(<Table columns={columns} rows={rows} />);
      expect(getColumnWidths(tree)).toStrictEqual([450, 200, 100, 150]);
    });
    it('cannot size less than the minWidth', () => {
      let columns = [
        {name: 'Name', id: 'name', minWidth: 500, defaultWidth: '50%', allowsResizing},
        {name: 'Type', id: 'type', minWidth: 100, defaultWidth: '1fr', allowsResizing},
        {name: 'Level', id: 'level', minWidth: 150, defaultWidth: 100, allowsResizing},
        {name: 'Height', id: 'height', minWidth: 200, allowsResizing}
      ];
      let tree = render(<Table columns={columns} rows={rows} />);
      expect(getColumnWidths(tree)).toStrictEqual([500, 100, 150, 200]);
    });
    it('cannot size more than the maxWidth', () => {
      let columns = [
        {name: 'Name', id: 'name', maxWidth: 400, defaultWidth: '50%', allowsResizing},
        {name: 'Type', id: 'type', maxWidth: 50, defaultWidth: '1fr', allowsResizing},
        {name: 'Level', id: 'level', maxWidth: 50, defaultWidth: 100, allowsResizing},
        {name: 'Height', id: 'height', maxWidth: 100, allowsResizing}
      ];
      let tree = render(<Table columns={columns} rows={rows} />);
      expect(getColumnWidths(tree)).toStrictEqual([400, 50, 50, 100]);
    });
    it('minWidth can be a percent', () => {
      let columns = [
        {name: 'Name', id: 'name', minWidth: '50%', defaultWidth: '30%', allowsResizing},
        {name: 'Type', id: 'type', maxWidth: 50, defaultWidth: '1fr', allowsResizing},
        {name: 'Level', id: 'level', maxWidth: 50, defaultWidth: 100, allowsResizing},
        {name: 'Height', id: 'height', maxWidth: 100, allowsResizing}
      ];
      let tree = render(<Table columns={columns} rows={rows} />);
      expect(getColumnWidths(tree)).toStrictEqual([450, 50, 50, 100]);
    });
    it('maxWidth can be a percent', () => {
      let columns = [
        {name: 'Name', id: 'name', maxWidth: '50%', defaultWidth: '70%', allowsResizing},
        {name: 'Type', id: 'type', maxWidth: 50, defaultWidth: '1fr', allowsResizing},
        {name: 'Level', id: 'level', maxWidth: 50, defaultWidth: 100, allowsResizing},
        {name: 'Height', id: 'height', maxWidth: 100, allowsResizing}
      ];
      let tree = render(<Table columns={columns} rows={rows} />);
      expect(getColumnWidths(tree)).toStrictEqual([450, 50, 50, 100]);
    });
  });

  describe('resizing', () => {
    function mapFromWidths(columnNames, widths) {
      return new Map(widths.map((width, i) => [columnNames[i].toLowerCase(), width]));
    }
    it.each`
      col         | delta  | expected                     | expectedOnResize
      ${'Name'}   | ${-50} | ${[50, 110, 150, 150, 440]}  | ${[50, '1fr', 150, 150, '4fr']}
      ${'Name'}   | ${50}  | ${[150, 90, 150, 150, 360]}  | ${[150, '1fr', 150, 150, '4fr']}
      ${'Type'}   | ${-50} | ${[100, 50, 150, 150, 450]}  | ${[100, 50, 150, 150, '4fr']}
      ${'Type'}   | ${50}  | ${[100, 150, 150, 150, 350]} | ${[100, 150, 150, 150, '4fr']}
      ${'Height'} | ${-50} | ${[100, 100, 100, 150, 450]} | ${[100, 100, 100, 150, '4fr']}
      ${'Height'} | ${50}  | ${[100, 100, 200, 150, 350]} | ${[100, 100, 200, 150, '4fr']}
      ${'Weight'} | ${-50} | ${[100, 100, 150, 100, 450]} | ${[100, 100, 150, 100, '4fr']}
      ${'Weight'} | ${50}  | ${[100, 100, 150, 200, 350]} | ${[100, 100, 150, 200, '4fr']}
      ${'Level'}  | ${-50} | ${[100, 100, 150, 150, 350]} | ${[100, 100, 150, 150, 350]}
      ${'Level'}  | ${50}  | ${[100, 100, 150, 150, 450]} | ${[100, 100, 150, 150, 450]}
    `('can resize $col to be $delta px different',
      function ({col, delta, expected, expectedOnResize}) {
        let columnNames = ['Name', 'Type', 'Height', 'Weight', 'Level'];
        let tree = render(<TableWithSomeResizingFRsControlled onResize={onResize} />);
        resizeCol(tree, col, delta);
        expect(getColumnWidths(tree)).toStrictEqual(expected);
        expect(onResize).toHaveBeenCalledTimes(1);
        expect(onResize).toHaveBeenCalledWith(mapFromWidths(columnNames, expectedOnResize));
      });

    it('cannot resize to be less than a minWidth, from start to end', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr', minWidth: 100},
        {name: 'Type', uid: 'type', width: '1fr', minWidth: 100},
        {name: 'Height', uid: 'height', minWidth: 100},
        {name: 'Weight', uid: 'weight', minWidth: 100},
        {name: 'Level', uid: 'level', width: '4fr', minWidth: 100}
      ];
      let columnNames = ['Name', 'Type', 'Height', 'Weight', 'Level'];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} onResize={onResize} />);
      resizeCol(tree, 'Name', -50); // first column
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 400]);
      expect(onResize).toHaveBeenCalledTimes(1);
      expect(onResize).toHaveBeenCalledWith(mapFromWidths(columnNames, [100, '1fr', 150, 150, '4fr']));
      resizeCol(tree, 'Type', -50);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 400]);
      expect(onResize).toHaveBeenCalledTimes(2);
      expect(onResize).toHaveBeenCalledWith(mapFromWidths(columnNames, [100, 100, 150, 150, '4fr']));
      resizeCol(tree, 'Height', -100);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 100, 150, 450]);
      expect(onResize).toHaveBeenCalledTimes(3);
      expect(onResize).toHaveBeenCalledWith(mapFromWidths(columnNames, [100, 100, 100, 150, '4fr']));
      resizeCol(tree, 'Weight', -100);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 100, 100, 500]);
      expect(onResize).toHaveBeenCalledTimes(4);
      expect(onResize).toHaveBeenCalledWith(mapFromWidths(columnNames, [100, 100, 100, 100, '4fr']));
      resizeCol(tree, 'Level', -500); // last column
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 100, 100, 100]);
      expect(onResize).toHaveBeenCalledTimes(5);
      expect(onResize).toHaveBeenCalledWith(mapFromWidths(columnNames, [100, 100, 100, 100, 100]));
    });

    it('cannot resize to be less than a minWidth, from end to start', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr', minWidth: 100},
        {name: 'Type', uid: 'type', width: '1fr', minWidth: 100},
        {name: 'Height', uid: 'height', minWidth: 100},
        {name: 'Weight', uid: 'weight', minWidth: 100},
        {name: 'Level', uid: 'level', width: '4fr', minWidth: 100}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      resizeCol(tree, 'Level', -500); // last column
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 100]);
      resizeCol(tree, 'Weight', -100);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 100, 100]);
      resizeCol(tree, 'Height', -100);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 100, 100, 100]);
      resizeCol(tree, 'Type', -100);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 100, 100, 100]);
      resizeCol(tree, 'Name', -500); // first column
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 100, 100, 100]);
    });

    it('cannot resize to be more than a maxWidth, from start to end', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr', maxWidth: 150},
        {name: 'Type', uid: 'type', width: '1fr', maxWidth: 150},
        {name: 'Height', uid: 'height', maxWidth: 200},
        {name: 'Weight', uid: 'weight', maxWidth: 200},
        {name: 'Level', uid: 'level', width: '4fr', maxWidth: 500}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      resizeCol(tree, 'Name', 150);
      expect(getColumnWidths(tree)).toStrictEqual([150, 90, 150, 150, 360]);
      resizeCol(tree, 'Type', 150);
      expect(getColumnWidths(tree)).toStrictEqual([150, 150, 150, 150, 300]);
      resizeCol(tree, 'Height', 100);
      expect(getColumnWidths(tree)).toStrictEqual([150, 150, 200, 150, 250]);
      resizeCol(tree, 'Weight', 100);
      expect(getColumnWidths(tree)).toStrictEqual([150, 150, 200, 200, 200]);
      resizeCol(tree, 'Level', 400);
      expect(getColumnWidths(tree)).toStrictEqual([150, 150, 200, 200, 500]);
    });

    it('cannot resize to be more than a maxWidth, from end to start', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr', maxWidth: 150},
        {name: 'Type', uid: 'type', width: '1fr', maxWidth: 150},
        {name: 'Height', uid: 'height', maxWidth: 200},
        {name: 'Weight', uid: 'weight', maxWidth: 200},
        {name: 'Level', uid: 'level', width: '4fr', maxWidth: 500}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      resizeCol(tree, 'Level', 150);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 500]);
      resizeCol(tree, 'Weight', 150);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 200, 500]);
      resizeCol(tree, 'Height', 100);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 200, 200, 500]);
      resizeCol(tree, 'Type', 100);
      expect(getColumnWidths(tree)).toStrictEqual([100, 150, 200, 200, 500]);
      resizeCol(tree, 'Name', 400);
      expect(getColumnWidths(tree)).toStrictEqual([150, 150, 200, 200, 500]);
    });

    it('resizing the starter column will preserve fr column ratios to the right', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      resizeCol(tree, 'Name', -50);
      expect(getColumnWidths(tree)).toStrictEqual([50, 110, 150, 150, 440]);
      resizeCol(tree, 'Name', 50);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 400]);
    });

    it('resizing the last column will lock columns to pixels to the left', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      resizeCol(tree, 'Level', -50);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 350]);
      resizeCol(tree, 'Level', 50);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 400]);
    });

    it('can handle removing a column', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 400]);
      let newColumns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];
      tree.rerender(<TableWithSomeResizingFRsControlled columns={newColumns} />);
      expect(getColumnWidths(tree)).toStrictEqual([125, 125, 150, 500]);
    });

    it('can handle adding a column', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      expect(getColumnWidths(tree)).toStrictEqual([125, 125, 150, 500]);
      let newColumns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];
      tree.rerender(<TableWithSomeResizingFRsControlled columns={newColumns} />);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 400]);
    });

    it('can handle resizing, then removing an uncontrolled column, then adding the column again', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      resizeCol(tree, 'Name', -50);
      expect(getColumnWidths(tree)).toStrictEqual([50, 110, 150, 150, 440]);
      let newColumns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];
      tree.rerender(<TableWithSomeResizingFRsControlled columns={newColumns} />);
      expect(getColumnWidths(tree)).toStrictEqual([50, 140, 150, 560]);
      tree.rerender(<TableWithSomeResizingFRsControlled columns={columns} />);
      expect(getColumnWidths(tree)).toStrictEqual([50, 110, 150, 150, 440]);
    });

    it('can handle resizing, then removing an controlled column, then adding the column again', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      resizeCol(tree, 'Name', -50);
      expect(getColumnWidths(tree)).toStrictEqual([50, 110, 150, 150, 440]);
      let newColumns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'}
      ];
      tree.rerender(<TableWithSomeResizingFRsControlled columns={newColumns} />);
      expect(getColumnWidths(tree)).toStrictEqual([50, 550, 150, 150]);
      tree.rerender(<TableWithSomeResizingFRsControlled columns={columns} />);
      expect(getColumnWidths(tree)).toStrictEqual([50, 110, 150, 150, 440]);
    });

    it('can add new columns after resizing', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      resizeCol(tree, 'Name', -50);
      expect(getColumnWidths(tree)).toStrictEqual([325, 425, 150]);
      let newColumns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];
      tree.rerender(<TableWithSomeResizingFRsControlled columns={newColumns} />);
      expect(getColumnWidths(tree)).toStrictEqual([325, 125, 150, 150, 150]);
    });

    it('can remove and re-add the resized column', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      resizeCol(tree, 'Type', -50);
      expect(getColumnWidths(tree)).toStrictEqual([100, 50, 150, 150, 450]);
      let newColumns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];
      tree.rerender(<TableWithSomeResizingFRsControlled columns={newColumns} />);
      expect(getColumnWidths(tree)).toStrictEqual([100, 150, 150, 500]);
      tree.rerender(<TableWithSomeResizingFRsControlled columns={columns} />);
      expect(getColumnWidths(tree)).toStrictEqual([100, 50, 150, 150, 450]);
    });

    it('can resize smaller if the minWidth gets smaller', function () {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr', minWidth: 100},
        {name: 'Type', uid: 'type', width: '1fr', minWidth: 100},
        {name: 'Height', uid: 'height', minWidth: 100},
        {name: 'Weight', uid: 'weight', minWidth: 100},
        {name: 'Level', uid: 'level', width: '4fr', minWidth: 100}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 400]);
      resizeCol(tree, 'Type', -100);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 400]);
      let newColumns = [
        {name: 'Name', uid: 'name', width: '1fr', minWidth: 100},
        {name: 'Type', uid: 'type', width: '1fr', minWidth: 50},
        {name: 'Height', uid: 'height', minWidth: 100},
        {name: 'Weight', uid: 'weight', minWidth: 100},
        {name: 'Level', uid: 'level', width: '4fr', minWidth: 100}
      ];
      tree.rerender(<TableWithSomeResizingFRsControlled columns={newColumns} />);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 400]);
      resizeCol(tree, 'Type', -100);
      expect(getColumnWidths(tree)).toStrictEqual([100, 50, 150, 150, 450]);
    });
  });

  describe('resizing table', () => {
    it('will not affect pixel widths', () => {
      let columns = [
        {name: 'Name', uid: 'name', width: 100},
        {name: 'Type', uid: 'type', width: 100},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: 400}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      offsetWidth.mockImplementation(() => 1000);
      fireEvent(window, new Event('resize'));
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 400]);
    });

    it('will resize all percent columns', () => {
      let columns = [
        {name: 'Name', uid: 'name', width: '20%'},
        {name: 'Type', uid: 'type', width: '20%'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '40%'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      expect(getColumnWidths(tree)).toStrictEqual([180, 180, 150, 150, 360]);
      offsetWidth.mockImplementation(() => 1000);
      fireEvent(window, new Event('resize'));
      expect(getColumnWidths(tree)).toStrictEqual([200, 200, 150, 150, 400]);
    });

    it('will resize all fr columns', () => {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '1fr'},
        {name: 'Height', uid: 'height'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      expect(getColumnWidths(tree)).toStrictEqual([100, 100, 150, 150, 400]);
      offsetWidth.mockImplementation(() => 1000);
      fireEvent(window, new Event('resize'));
      expect(getColumnWidths(tree)).toStrictEqual([117, 117, 150, 150, 466]);
    });

    it('will resize all fr columns only after percent columns', () => {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '20%'},
        {name: 'Height', uid: 'height', width: '20%'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      expect(getColumnWidths(tree)).toStrictEqual([78, 180, 180, 150, 312]);
      offsetWidth.mockImplementation(() => 1000);
      fireEvent(window, new Event('resize'));
      expect(getColumnWidths(tree)).toStrictEqual([90, 200, 200, 150, 360]);
    });

    it('will resize all fr columns only after percent columns', () => {
      let columns = [
        {name: 'Name', uid: 'name', width: '1fr'},
        {name: 'Type', uid: 'type', width: '20%'},
        {name: 'Height', uid: 'height', width: '20%'},
        {name: 'Weight', uid: 'weight'},
        {name: 'Level', uid: 'level', width: '4fr'}
      ];

      let tree = render(<TableWithSomeResizingFRsControlled columns={columns} />);
      expect(getColumnWidths(tree)).toStrictEqual([78, 180, 180, 150, 312]);
      offsetWidth.mockImplementation(() => 1000);
      fireEvent(window, new Event('resize'));
      expect(getColumnWidths(tree)).toStrictEqual([90, 200, 200, 150, 360]);
    });
  });
});

function Table(props: {columns: {id: Key, name: string}[], rows}) {
  let {columns, rows, ...args} = props;
  return (
    <ResizingTable {...args}>
      <TableHeader columns={columns}>
        {column => (
          <Column {...column}>
            {column.name}
          </Column>
        )}
      </TableHeader>
      <TableBody items={rows}>
        {item => (
          <Row>
            {columnKey => <Cell>{item[columnKey]}</Cell>}
          </Row>
        )}
      </TableBody>
    </ResizingTable>
  );
}
