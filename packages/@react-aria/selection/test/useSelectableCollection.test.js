/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {fireEvent, render} from '@testing-library/react';
import {installPointerEvent} from '@react-spectrum/test-utils';
import {Item} from '@react-stately/collections';
import {List} from '../stories/List';
import React from 'react';
import userEvent from '@testing-library/user-event';


describe('useSelectableCollection', () => {
  beforeEach(() => {
    jest.spyOn(window.screen, 'width', 'get').mockImplementation(() => 750);
  });

  it('selects the first item it focuses if selectOnFocus', () => {
    let {getAllByRole} = render(
      <List selectionMode="single">
        <Item>Paco de Lucia</Item>
        <Item>Vicente Amigo</Item>
        <Item>Gerardo Nunez</Item>
      </List>
    );
    let options = getAllByRole('option');
    expect(options[0]).not.toHaveAttribute('aria-selected');
    userEvent.tab();
    expect(document.activeElement).toBe(options[0]);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('can navigate without replacing the selection in multiple selection selectOnFocus', () => {
    let {getAllByRole} = render(
      <List selectionMode="multiple" selectionBehavior="replace">
        <Item>Paco de Lucia</Item>
        <Item>Vicente Amigo</Item>
        <Item>Gerardo Nunez</Item>
      </List>
    );
    let options = getAllByRole('option');
    expect(options[0]).not.toHaveAttribute('aria-selected');
    userEvent.tab();
    expect(document.activeElement).toBe(options[0]);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).not.toHaveAttribute('aria-selected');
    expect(options[2]).not.toHaveAttribute('aria-selected');
    fireEvent.keyDown(document.activeElement, {key: 'ArrowDown', ctrlKey: true});
    fireEvent.keyUp(document.activeElement, {key: 'ArrowDown', ctrlKey: true});
    expect(document.activeElement).toBe(options[1]);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).not.toHaveAttribute('aria-selected');
    expect(options[2]).not.toHaveAttribute('aria-selected');
    fireEvent.keyDown(document.activeElement, {key: 'ArrowDown', ctrlKey: true});
    fireEvent.keyUp(document.activeElement, {key: 'ArrowDown', ctrlKey: true});
    expect(document.activeElement).toBe(options[2]);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).not.toHaveAttribute('aria-selected');
    expect(options[2]).not.toHaveAttribute('aria-selected');
    fireEvent.keyDown(document.activeElement, {key: ' '});
    fireEvent.keyUp(document.activeElement, {key: ' '});
    expect(options[0]).not.toHaveAttribute('aria-selected');
    expect(options[1]).not.toHaveAttribute('aria-selected');
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
  });

  describe.each`
    type                     | prepare               | actions
    ${'VO Events'}           | ${installPointerEvent}| ${[
      (el) => fireEvent.pointerDown(el, {button: 0, pointerType: 'virtual'}),
      (el) => fireEvent.pointerUp(el, {button: 0, pointerType: 'virtual'})
    ]}
    ${'Touch Pointer Events'} | ${installPointerEvent}| ${[
      (el) => fireEvent.pointerDown(el, {button: 0, pointerType: 'touch', pointerId: 1}),
      (el) => fireEvent.pointerUp(el, {button: 0, pointerType: 'touch', pointerId: 1})
    ]}
  `('always uses toggle for $type', ({prepare, actions: [start, end]}) => {
    prepare();
    it('uses toggle mode when the interaction is touch', () => {
      jest.spyOn(window.screen, 'width', 'get').mockImplementation(() => 600);
      let {getAllByRole} = render(
        <List selectionMode="multiple" selectionBehavior="replace">
          <Item>Paco de Lucia</Item>
          <Item>Vicente Amigo</Item>
          <Item>Gerardo Nunez</Item>
        </List>
      );
      let options = getAllByRole('option');
      expect(options[0]).not.toHaveAttribute('aria-selected');
      start(options[0]);
      end(options[0]);
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).not.toHaveAttribute('aria-selected');
      expect(options[2]).not.toHaveAttribute('aria-selected');
      start(options[2]);
      end(options[2]);
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).not.toHaveAttribute('aria-selected');
      expect(options[2]).toHaveAttribute('aria-selected', 'true');
    });
  });
});
