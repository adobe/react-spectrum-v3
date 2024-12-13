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

import {act, pointerMap, renderv3 as render, within} from '@react-spectrum/test-utils-internal';
import {Breadcrumbs} from '../';
import {Item} from '@react-stately/collections';
import {Provider} from '@react-spectrum/provider';
import React, {useRef} from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

describe('Breadcrumbs', function () {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });
  beforeEach(() => {
    jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () {
      if (this instanceof HTMLUListElement) {
        return 500;
      }

      return 100;
    });

    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    HTMLElement.prototype.scrollIntoView.mockRestore();
  });

  it('$Name handles defaults', function () {
    let {getByLabelText} = render(
      <Breadcrumbs id="breadcrumbs-id" aria-label="breadcrumbs-test">
        <Item>Folder 1</Item>
      </Breadcrumbs>
    );

    let breadcrumbs = getByLabelText('breadcrumbs-test');
    expect(breadcrumbs).toHaveAttribute('id', 'breadcrumbs-id');
  });

  // v3 functionality, omitting v2 component
  it('Handles UNSAFE_className', () => {
    let {getByRole} = render(
      <Breadcrumbs UNSAFE_className="test-class">
        <Item>Folder 1</Item>
      </Breadcrumbs>
    );
    let breadcrumbs = getByRole('list');
    expect(breadcrumbs).toHaveAttribute('class', expect.stringContaining('test-class'));
  });

  it('Handles multiple items', () => {
    let {getByText} = render(
      <Breadcrumbs UNSAFE_className="test-class">
        <Item>Folder 1</Item>
        <Item>Folder 2</Item>
        <Item>Folder 3</Item>
      </Breadcrumbs>
    );
    let item1 = getByText('Folder 1');
    expect(item1.tabIndex).toBe(0);
    expect(item1).not.toHaveAttribute('aria-current');
    let item2 = getByText('Folder 2');
    expect(item2.tabIndex).toBe(0);
    expect(item2).not.toHaveAttribute('aria-current');
    let item3 = getByText('Folder 3');
    expect(item3.tabIndex).toBe(-1);
    expect(item3).toHaveAttribute('aria-current', 'page');
  });

  it('Handles single item and showRoot', () => {
    let {getByText} = render(
      <Breadcrumbs showRoot>
        <Item key="Folder-1">Folder 1</Item>
      </Breadcrumbs>
    );
    let item = getByText('Folder 1');
    expect(item).toBeTruthy();
    expect(item.tabIndex).toBe(-1);
  });

  it('Should handle forward ref', function () {
    let ref;
    let Component = () => {
      ref = useRef();
      return (
        <Breadcrumbs ref={ref} aria-label="breadcrumbs-test">
          <Item>Folder 1</Item>
        </Breadcrumbs>
      );
    };
    let {getByLabelText} = render(<Component />);
    let breadcrumb = getByLabelText('breadcrumbs-test');
    expect(breadcrumb).toBe(ref.current.UNSAFE_getDOMNode());
  });

  it('Handles size="S"', () => {
    let {getByRole} = render(
      <Breadcrumbs size="S">
        <Item>Folder 1</Item>
      </Breadcrumbs>
    );
    let breadcrumbs = getByRole('list');
    expect(breadcrumbs).toHaveAttribute('class', expect.stringContaining('--small'));
  });

  it('Handles size="M"', () => {
    let {getByRole} = render(
      <Breadcrumbs size="M">
        <Item>Folder 1</Item>
      </Breadcrumbs>
    );
    let breadcrumbs = getByRole('list');
    expect(breadcrumbs).toHaveAttribute('class', expect.stringContaining('--medium'));
  });

  it('shows four items with no menu', () => {
    let {getByText, getByRole} = render(
      <Provider theme={theme}>
        <Breadcrumbs>
          <Item>Folder 1</Item>
          <Item>Folder 2</Item>
          <Item>Folder 3</Item>
          <Item>Folder 4</Item>
        </Breadcrumbs>
      </Provider>
    );
    let {children} = getByRole('list');
    expect(within(children[0]).queryByRole('button')).toBeNull();
    expect(getByText('Folder 1')).toBeTruthy();
    expect(getByText('Folder 2')).toBeTruthy();
    expect(getByText('Folder 3')).toBeTruthy();
    expect(getByText('Folder 4')).toBeTruthy();
  });

  it('shows a maximum of 4 items', () => {
    let {getByText, getByRole} = render(
      <Provider theme={theme}>
        <Breadcrumbs>
          <Item>Folder 1</Item>
          <Item>Folder 2</Item>
          <Item>Folder 3</Item>
          <Item>Folder 4</Item>
          <Item>Folder 5</Item>
        </Breadcrumbs>
      </Provider>
    );
    let {children} = getByRole('list');
    expect(within(children[0]).getByRole('button')).toBeTruthy();
    expect(() => getByText('Folder 1')).toThrow();
    expect(() => getByText('Folder 2')).toThrow();
    expect(getByText('Folder 3')).toBeTruthy();
    expect(getByText('Folder 4')).toBeTruthy();
    expect(getByText('Folder 5')).toBeTruthy();
  });

  it('shows a maximum of 4 items with showRoot', () => {
    let {getByText, getByRole} = render(
      <Provider theme={theme}>
        <Breadcrumbs showRoot>
          <Item>Folder 1</Item>
          <Item>Folder 2</Item>
          <Item>Folder 3</Item>
          <Item>Folder 4</Item>
          <Item>Folder 5</Item>
        </Breadcrumbs>
      </Provider>
    );
    let {children} = getByRole('list');
    expect(getByText('Folder 1')).toBeTruthy();
    expect(within(children[1]).getByRole('button')).toBeTruthy();
    expect(() => getByText('Folder 2')).toThrow();
    expect(() => getByText('Folder 3')).toThrow();
    expect(getByText('Folder 4')).toBeTruthy();
    expect(getByText('Folder 5')).toBeTruthy();
  });

  it('Handles isDisabled', () => {
    let {getByText} = render(
      <Breadcrumbs isDisabled>
        <Item>Folder 1</Item>
        <Item>Folder 2</Item>
      </Breadcrumbs>
    );

    let item1 = getByText('Folder 1');
    expect(item1).toHaveAttribute('aria-disabled', 'true');
    let item2 = getByText('Folder 2');
    expect(item2).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows less than 4 items if they do not fit', () => {
    jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () {
      if (this instanceof HTMLUListElement) {
        return 300;
      }

      return 100;
    });

    let {getByText, getByRole} = render(
      <Provider theme={theme}>
        <Breadcrumbs>
          <Item>Folder 1</Item>
          <Item>Folder 2</Item>
          <Item>Folder 3</Item>
          <Item>Folder 4</Item>
          <Item>Folder 5</Item>
        </Breadcrumbs>
      </Provider>
    );

    let {children} = getByRole('list');
    expect(within(children[0]).getByRole('button')).toBeTruthy();
    expect(() => getByText('Folder 1')).toThrow();
    expect(() => getByText('Folder 2')).toThrow();
    expect(() => getByText('Folder 3')).toThrow();
    expect(() => getByText('Folder 4')).toThrow();
    expect(getByText('Folder 5')).toBeTruthy();
  });

  it('collapses root item if it does not fit', () => {
    jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () {
      if (this instanceof HTMLUListElement) {
        return 300;
      }

      return 100;
    });

    let {getByText, getByRole} = render(
      <Provider theme={theme}>
        <Breadcrumbs showRoot>
          <Item>Folder 1</Item>
          <Item>Folder 2</Item>
          <Item>Folder 3</Item>
          <Item>Folder 4</Item>
          <Item>Folder 5</Item>
        </Breadcrumbs>
      </Provider>
    );

    let {children} = getByRole('list');
    expect(() => getByText('Folder 1')).toThrow();
    expect(within(children[0]).getByRole('button')).toBeTruthy();
    expect(() => getByText('Folder 2')).toThrow();
    expect(() => getByText('Folder 3')).toThrow();
    expect(() => getByText('Folder 4')).toThrow();
    expect(getByText('Folder 5')).toBeTruthy();
  });

  it('Handles showRoot and folders of different widths', () => {
    // Change the width of "Folder 1" from 100px to 200px, which means there's only room for 1 other breadcrumb.
    jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () {
      if (this instanceof HTMLUListElement) {
        return 500;
      }

      if (this.textContent === 'Folder 1') {
        return 200;
      }

      return 100;
    });

    let {getByText, getByRole} = render(
      <Provider theme={theme}>
        <Breadcrumbs showRoot>
          <Item>Folder 1</Item>
          <Item>Folder 2</Item>
          <Item>Folder 3</Item>
          <Item>Folder 4</Item>
          <Item>Folder 5</Item>
        </Breadcrumbs>
      </Provider>
    );

    let {children} = getByRole('list');
    expect(within(children[1]).getByRole('button')).toBeTruthy();
    expect(getByText('Folder 1')).toBeTruthy();
    expect(() => getByText('Folder 2')).toThrow();
    expect(() => getByText('Folder 3')).toThrow();
    expect(() => getByText('Folder 4')).toThrow();
    expect(getByText('Folder 5')).toBeTruthy();
  });


  it('can open the menu', async () => {
    let onAction = jest.fn();
    let {getAllByText, getByRole, getAllByRole} = render(
      <Provider theme={theme}>
        <Breadcrumbs showRoot onAction={onAction}>
          <Item key="Folder 1">Folder 1</Item>
          <Item>Folder 2</Item>
          <Item>Folder 3</Item>
          <Item>Folder 4</Item>
          <Item>Folder 5</Item>
        </Breadcrumbs>
      </Provider>
    );

    let menuButton = getByRole('button');
    await user.click(menuButton);
    act(() => {jest.runAllTimers();});

    let menu = getByRole('menu');
    expect(menu).toBeTruthy();
    // menu contains all breadcrumb items
    expect(getAllByRole('menuitemradio').length).toBe(5);

    let item1 = getAllByText('Folder 1');
    expect(item1.length).toBe(2);

    // breadcrumb root item
    expect(item1[0]).toHaveAttribute('role', 'link');
    await user.click(item1[0]);
    // first press closes the menu, second press
    act(() => {jest.runAllTimers();});
    await user.click(item1[0]);
    expect(onAction).toHaveBeenCalledWith('Folder 1');

    // menu item
    expect(item1[1]).toHaveAttribute('role', 'none');
    await user.click(item1[1]);
    expect(onAction).toHaveBeenCalledWith('Folder 1');
  });

  it('clicking on current folder does not trigger onAction', async () => {
    let onAction = jest.fn();
    let {getByRole, getAllByRole} = render(
      <Provider theme={theme}>
        <Breadcrumbs showRoot onAction={onAction}>
          <Item key="Folder 1">Folder 1</Item>
          <Item key="Folder 2">Folder 2</Item>
          <Item key="Folder 3">Folder 3</Item>
          <Item key="Folder 4">Folder 4</Item>
          <Item key="Folder 5">Folder 5</Item>
        </Breadcrumbs>
      </Provider>
    );

    let menuButton = getByRole('button');
    await user.click(menuButton);

    let menu = getByRole('menu');
    expect(menu).toBeTruthy();

    let menuItems = getAllByRole('menuitemradio');
    // menu contains all breadcrumb items
    expect(menuItems.length).toBe(5);

    let item = menuItems[4];
    expect(item).toHaveAttribute('aria-checked', 'true');
    await user.click(item);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('supports aria-label', function () {
    let {getByRole} = render(
      <Breadcrumbs aria-label="Test">
        <Item>Folder 1</Item>
      </Breadcrumbs>
    );
    let breadcrumbs = getByRole('navigation');
    expect(breadcrumbs).toHaveAttribute('aria-label', 'Test');
  });

  it('supports aria-labelledby', function () {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Breadcrumbs aria-labelledby="test">
          <Item>Folder 1</Item>
        </Breadcrumbs>
      </>
    );
    let breadcrumbs = getByRole('navigation');
    expect(breadcrumbs).toHaveAttribute('aria-labelledby', 'test');
  });

  it('supports aria-describedby', function () {
    let {getByRole} = render(
      <>
        <span id="test">Test</span>
        <Breadcrumbs aria-describedby="test">
          <Item>Folder 1</Item>
        </Breadcrumbs>
      </>
    );
    let breadcrumbs = getByRole('navigation');
    expect(breadcrumbs).toHaveAttribute('aria-describedby', 'test');
  });

  it('supports custom props', function () {
    let {getByRole} = render(
      <Breadcrumbs data-testid="test">
        <Item>Folder 1</Item>
      </Breadcrumbs>
    );
    let breadcrumbs = getByRole('navigation');
    expect(breadcrumbs).toHaveAttribute('data-testid', 'test');
  });

  it('should support links', async function () {
    let {getByRole, getAllByRole} = render(
      <Provider theme={theme}>
        <Breadcrumbs>
          <Item href="https://example.com">Example.com</Item>
          <Item href="https://example.com/foo">Foo</Item>
          <Item href="https://example.com/foo/bar">Bar</Item>
          <Item href="https://example.com/foo/bar/baz">Baz</Item>
          <Item href="https://example.com/foo/bar/baz/qux">Qux</Item>
        </Breadcrumbs>
      </Provider>
    );

    let links = getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', 'https://example.com/foo/bar');
    expect(links[1]).toHaveAttribute('href', 'https://example.com/foo/bar/baz');
    expect(links[2]).toHaveAttribute('href', 'https://example.com/foo/bar/baz/qux');

    let menuButton = getByRole('button');
    await user.click(menuButton);
    act(() => {jest.runAllTimers();});

    let menu = getByRole('menu');
    let items = within(menu).getAllByRole('menuitemradio');
    expect(items).toHaveLength(5);
    expect(items[0].tagName).toBe('A');
    expect(items[0]).toHaveAttribute('href', 'https://example.com');
  });

  it('should support RouterProvider', async () => {
    let navigate = jest.fn();
    let useHref = href => '/base' + href;
    let {getByRole, getAllByRole} = render(
      <Provider theme={theme} router={{navigate, useHref}}>
        <Breadcrumbs>
          <Item href="/" routerOptions={{foo: 'bar'}}>Example.com</Item>
          <Item href="/foo" routerOptions={{foo: 'foo'}}>Foo</Item>
          <Item href="/foo/bar" routerOptions={{foo: 'bar'}}>Bar</Item>
          <Item href="/foo/bar/baz" routerOptions={{foo: 'bar'}}>Baz</Item>
          <Item href="/foo/bar/baz/qux" routerOptions={{foo: 'bar'}}>Qux</Item>
        </Breadcrumbs>
      </Provider>
    );

    let links = getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/base/foo/bar');
    await user.click(links[0]);
    expect(navigate).toHaveBeenCalledWith('/foo/bar', {foo: 'bar'});
    navigate.mockReset();

    let menuButton = getByRole('button');
    await user.click(menuButton);
    act(() => {jest.runAllTimers();});

    let menu = getByRole('menu');
    let items = within(menu).getAllByRole('menuitemradio');
    expect(items[1]).toHaveAttribute('href', '/base/foo');
    await user.click(items[1]);
    expect(navigate).toHaveBeenCalledWith('/foo', {foo: 'foo'});
  });
});
