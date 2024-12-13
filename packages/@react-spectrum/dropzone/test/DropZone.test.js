/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, fireEvent, renderv3 as render} from '@react-spectrum/test-utils-internal';
import {Button} from '@react-spectrum/button';
import {Content} from '@react-spectrum/view';
import {DataTransfer, DataTransferItem, DragEvent} from '@react-aria/dnd/test/mocks';
import {Draggable} from '@react-aria/dnd/test/examples';
import {DropZone} from '../';
import {FileTrigger} from 'react-aria-components';
import {Heading} from '@react-spectrum/text';
import {IllustratedMessage} from '@react-spectrum/illustratedmessage';
import {Link} from '@react-spectrum/link';
import React from 'react';

describe('DropZone', () => {
  it('should attach a ref on the outer most div', () => {
    let dropzoneRef = React.createRef();

    let tree = render(
      <DropZone ref={dropzoneRef} data-testid="bar">
        <IllustratedMessage>
          <Heading>No files</Heading>
          <Content>
            <FileTrigger>
              <Button data-testid="foo" variant="primary">Select a file</Button>
            </FileTrigger>
          </Content>
        </IllustratedMessage>
      </DropZone>
    );

    let dropzone = tree.getByTestId('bar');
    let button = tree.getByTestId('foo');
    expect(dropzone).toBe(tree.container.firstChild.firstChild);
    expect(dropzoneRef.current.UNSAFE_getDOMNode()).toBe(dropzone);
    expect(dropzone).not.toBe(button);
  });
});

describe('drag and drop', function () {
  beforeEach(() => {
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      left: 0,
      top: 0,
      x: 0,
      y: 0,
      width: 100,
      height: 50
    }));

    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => jest.runAllTimers());
  });

  let onDragStart = jest.fn();
  let onDragMove = jest.fn();
  let onDragEnd = jest.fn();
  let onDropEnter = jest.fn();
  let onDropMove = jest.fn();
  let onDrop = jest.fn();

  describe('via mouse', function () {
    it('should show banner when filled', async () => {
      let tree = render(
        <>
          <Draggable onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd} />
          <DropZone data-testid="foo" isFilled onDropEnter={onDropEnter} onDrop={onDrop} onDropMove={onDropMove} >
            <IllustratedMessage>
              <Heading>No files</Heading>
              <Content>
                <FileTrigger>
                  <Link>Select a file</Link>from your computer
                </FileTrigger>
              </Content>
            </IllustratedMessage>
          </DropZone>
        </>
      );
      let dropzone = tree.getByTestId('foo');
      let draggable = tree.getByText('Drag me');
      expect(draggable).toHaveAttribute('draggable', 'true');
      expect(draggable).toHaveAttribute('data-dragging', 'false');
      expect(dropzone).not.toHaveAttribute('data-drop-target');

      let dataTransfer = new DataTransfer();
      fireEvent(draggable, new DragEvent('dragstart', {dataTransfer, clientX: 0, clientY: 0}));
      expect(dataTransfer.dropEffect).toBe('none');
      expect(dataTransfer.effectAllowed).toBe('all');
      expect([...dataTransfer.items]).toEqual([new DataTransferItem('text/plain', 'hello world')]);
      expect(dataTransfer._dragImage).toBeUndefined();

      act(() => jest.runAllTimers());
      expect(draggable).toHaveAttribute('data-dragging', 'true');

      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragStart).toHaveBeenCalledWith({
        type: 'dragstart',
        x: 0,
        y: 0
      });

      fireEvent(draggable, new DragEvent('drag', {dataTransfer, clientX: 1, clientY: 1}));
      expect(onDragMove).toHaveBeenCalledTimes(1);
      expect(onDragMove).toHaveBeenCalledWith({
        type: 'dragmove',
        x: 1,
        y: 1
      });

      fireEvent(dropzone, new DragEvent('dragenter', {dataTransfer, clientX: 1, clientY: 1}));
      expect(onDropEnter).toHaveBeenCalledTimes(1);
      expect(onDropEnter).toHaveBeenCalledWith({
        type: 'dropenter',
        x: 1,
        y: 1
      });

      expect(dataTransfer.dropEffect).toBe('move');
      expect(dropzone).toHaveAttribute('data-drop-target', 'true');

      fireEvent(dropzone, new DragEvent('dragover', {dataTransfer, clientX: 2, clientY: 2}));
      expect(onDropMove).toHaveBeenCalledTimes(1);
      expect(onDropMove).toHaveBeenCalledWith({
        type: 'dropmove',
        x: 2,
        y: 2
      });

      expect(dataTransfer.dropEffect).toBe('move');
      expect(dropzone).toHaveAttribute('data-drop-target', 'true');

      fireEvent(dropzone, new DragEvent('drop', {dataTransfer, clientX: 2, clientY: 2}));
      act(() => jest.runAllTimers());
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop).toHaveBeenCalledWith({
        type: 'drop',
        x: 2,
        y: 2,
        dropOperation: 'move',
        items: [
          {
            kind: 'text',
            types: new Set(['text/plain']),
            getText: expect.any(Function)
          }
        ]
      });

      expect(await onDrop.mock.calls[0][0].items[0].getText('text/plain')).toBe('hello world');

      fireEvent(draggable, new DragEvent('dragend', {dataTransfer, clientX: 2, clientY: 2}));
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd).toHaveBeenCalledWith({
        type: 'dragend',
        x: 2,
        y: 2,
        dropOperation: 'move'
      });

      expect(dropzone).not.toHaveAttribute('data-drop-target');

    });
  });
});
