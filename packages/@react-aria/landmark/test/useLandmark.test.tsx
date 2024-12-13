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

import {act, fireEvent, pointerMap, renderv3 as render, within} from '@react-spectrum/test-utils-internal';
import {ActionGroup, Item} from '@react-spectrum/actiongroup';
import {Button} from '@react-spectrum/button';
import {Cell, Column, Row, TableBody, TableHeader, TableView} from '@react-spectrum/table';
import {Checkbox} from '@react-spectrum/checkbox';
import {createLandmarkController, useLandmark} from '../';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {TextField} from '@react-spectrum/textfield';
import {theme} from '@react-spectrum/theme-default';
import {useFocusableRef} from '@react-spectrum/utils';
import userEvent from '@testing-library/user-event';

function Main(props) {
  let ref = useFocusableRef(null);
  let {landmarkProps} = useLandmark({...props, role: 'main'}, ref);
  return <main ref={ref} {...landmarkProps}>{props.children}</main>;
}

function Navigation(props) {
  let ref = useFocusableRef(null);
  let {landmarkProps} = useLandmark({...props, role: 'navigation'}, ref);
  return <nav ref={ref} {...landmarkProps}>{props.children}</nav>;
}

function Region(props) {
  let ref = useFocusableRef(null);
  let {landmarkProps} = useLandmark({...props, role: 'region'}, ref);
  return <article ref={ref} {...landmarkProps}>{props.children}</article>;
}

// taken from useFocusVisible tests
function toggleBrowserTabs() {
  // this describes Chrome behaviour only, for other browsers visibilitychange fires after all focus events.
  // leave tab
  const lastActiveElement = document.activeElement!;
  fireEvent(lastActiveElement, new Event('blur'));
  fireEvent(window, new Event('blur'));
  Object.defineProperty(document, 'visibilityState', {
    value: 'hidden',
    writable: true
  });
  Object.defineProperty(document, 'hidden', {value: true, writable: true});
  fireEvent(document, new Event('visibilitychange'));
  // return to tab
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    writable: true
  });
  Object.defineProperty(document, 'hidden', {value: false, writable: true});
  fireEvent(document, new Event('visibilitychange'));
  fireEvent(window, new Event('focus'));
  fireEvent(lastActiveElement, new Event('focus'));
}

function toggleBrowserWindow() {
  fireEvent(window, new Event('blur'));
  fireEvent(window, new Event('focus'));
}


describe('LandmarkManager', function () {
  let offsetWidth, offsetHeight;
  let user;

  beforeAll(function () {
    user = userEvent.setup({delay: null, pointerMap});
    offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    jest.useFakeTimers();
  });

  afterAll(function () {
    offsetWidth.mockRestore();
    offsetHeight.mockReset();
  });

  afterEach(() => {
    act(() => {jest.runAllTimers();});
  });

  it('can tab into a landmark region', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let navigation = tree.getByRole('navigation');
    let main = tree.getByRole('main');
    expect(navigation).toBeInTheDocument();
    expect(main).toBeInTheDocument();

    await user.tab();
    expect(document.activeElement!).toBe(tree.getAllByRole('link')[0]);
  });

  it('can F6 to a landmark region', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let navigation = tree.getByRole('navigation');
    let main = tree.getByRole('main');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(navigation);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);
  });

  it('can F6 to a landmark region when there is only one landmark', async function () {
    let tree = render(
      <div>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let main = tree.getByRole('main');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);
  });

  it('can F6 to a nested landmark region that is first', async function () {
    let tree = render(
      <div>
        <Main>
          <Region>
            <Checkbox>Checkbox label</Checkbox>
          </Region>

          <TextField label="First Name" />
        </Main>
      </div>
    );
    let main = tree.getByRole('main');
    let region = tree.getByRole('region');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(region);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(region);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(region);
  });

  it('can F6 to a nested landmark region that is last', async function () {
    let tree = render(
      <div>
        <Main>
          <TextField label="First Name" />

          <Region>
            <Checkbox>Checkbox label</Checkbox>
          </Region>
        </Main>
      </div>
    );
    let main = tree.getByRole('main');
    let region = tree.getByRole('region');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(region);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(region);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(region);
  });

  it('goes in dom order with two nested landmarks', async function () {
    let tree = render(
      <div>
        <Main>
          <Region aria-label="Region 1">
            <Checkbox>Checkbox label 1</Checkbox>
          </Region>

          <TextField label="First Name" />

          <Region aria-label="Region 2">
            <Checkbox>Checkbox label 2</Checkbox>
          </Region>

          <TextField label="Last Name" />
        </Main>
      </div>
    );
    let main = tree.getByRole('main');
    let region1 = tree.getAllByRole('region')[0];
    let region2 = tree.getAllByRole('region')[1];

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(region1);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(region2);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(region2);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(region1);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(main);
  });

  it('can F6 to the next landmark region', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let main = tree.getByRole('main');

    await user.tab();
    expect(document.activeElement!).toBe(tree.getAllByRole('link')[0]);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);
  });


  it('landmark navigation forward wraps', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let main = tree.getByRole('main');

    await user.tab();
    expect(document.activeElement!).toBe(tree.getAllByRole('link')[0]);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(tree.getAllByRole('link')[0]);
  });

  it('can shift+tab into a landmark region', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );

    await user.tab({shift: true});
    expect(document.activeElement!).toBe(tree.getByRole('textbox'));

    await user.tab({shift: true});
    expect(document.activeElement!).toBe(tree.getAllByRole('link')[2]);
  });

  it('can shift+F6 to a landmark region', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let navigation = tree.getByRole('navigation');
    let main = tree.getByRole('main');

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(navigation);
  });

  it('can shift+F6 to the previous landmark region', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );

    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(document.activeElement!).toBe(tree.getByRole('textbox'));

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(tree.getAllByRole('link')[2]);
  });

  it('landmark navigation backward wraps', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let main = tree.getByRole('main');

    await user.tab();
    expect(document.activeElement!).toBe(tree.getAllByRole('link')[0]);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(main);
  });

  it('F6 should focus the last focused element in a landmark region', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );

    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(document.activeElement!).toBe(tree.getByRole('textbox'));

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(tree.getAllByRole('link')[2]);
  });

  it('components that already handle focus management, should handle focus themselves', async function () {
    let tree = render(
      <Provider theme={theme}>
        <div>
          <Navigation>
            <ActionGroup>
              <Item>One</Item>
              <Item>Two</Item>
              <Item>Three</Item>
            </ActionGroup>
          </Navigation>
          <Main>
            <TableView aria-label="Table">
              <TableHeader>
                <Column key="foo" allowsSorting>Foo</Column>
                <Column key="bar" allowsSorting>Bar</Column>
                <Column key="baz">Baz</Column>
              </TableHeader>
              <TableBody>
                <Row>
                  <Cell>Foo 1</Cell>
                  <Cell>Bar 1</Cell>
                  <Cell>Baz 1</Cell>
                </Row>
                <Row>
                  <Cell>Foo 2</Cell>
                  <Cell>Bar 2</Cell>
                  <Cell>Baz 2</Cell>
                </Row>
                <Row>
                  <Cell>Foo 3</Cell>
                  <Cell>Bar 3</Cell>
                  <Cell>Baz 3</Cell>
                </Row>
              </TableBody>
            </TableView>
          </Main>
        </div>
      </Provider>
    );
    act(() => {jest.runAllTimers();});
    let buttons = tree.getAllByRole('button');
    let table = tree.getByRole('grid');
    let rows = within(table).getAllByRole('row');
    let cells = within(rows[1]).getAllByRole('gridcell');

    await user.tab();
    expect(document.activeElement!).toBe(buttons[0]);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement!).toBe(buttons[1]);

    await user.tab();
    expect(document.activeElement!).toBe(rows[1]);
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement!).toBe(cells[0]);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(buttons[1]);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(cells[0]);
  });

  it('Should allow 2+ landmarks with same role if they are labelled.', function () {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <div>
        <Navigation aria-label="First nav">
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Navigation aria-label="Second nav">
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );

    expect(spyWarn).not.toHaveBeenCalled();
  });

  it('Should warn if 2+ landmarks with same role are used but not labelled.', function () {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );

    let navs = tree.getAllByRole('navigation');

    expect(spyWarn).toHaveBeenCalledWith('Page contains more than one landmark with the \'navigation\' role. If two or more landmarks on a page share the same role, all must be labeled with an aria-label or aria-labelledby attribute: ', navs);
  });

  it('Should warn if 2+ landmarks with same role and same label', function () {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    let tree = render(
      <div>
        <Navigation aria-label="First nav">
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Navigation aria-label="First nav">
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let navs = tree.getAllByRole('navigation');

    expect(spyWarn).toHaveBeenCalledWith('Page contains more than one landmark with the \'navigation\' role and \'First nav\' label. If two or more landmarks on a page share the same role, they must have unique labels: ', navs);
  });

  it('Should not navigate to a landmark that has been removed from the DOM', async function () {

    function Container(props) {
      return (
        <div>
          <Navigation>
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </Navigation>
          {props.children}
          <Main>
            <TextField label="Last Name" />
          </Main>
        </div>
      );
    }

    let tree = render(
      <Container>
        <Region>
          <TextField label="First Name" />
        </Region>
      </Container>
    );

    let navigation = tree.getByRole('navigation');
    let region = tree.getByRole('region');
    let main = tree.getByRole('main');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(navigation);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(region);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);


    tree.rerender(<Container />);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(navigation);
  });

  it('Should navigate to a landmark that has been added to the DOM', async function () {

    function Container(props) {
      return (
        <div>
          <Navigation>
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </Navigation>
          <Main>
            <TextField label="Last Name" />
          </Main>
          {props.children}
        </div>
      );
    }

    let tree = render(<Container />);
    let navigation = tree.getByRole('navigation');
    let main = tree.getByRole('main');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(navigation);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    tree.rerender(
      <Container>
        <Region>
          <TextField label="First Name" />
        </Region>
      </Container>
    );

    let region = tree.getByRole('region');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(region);
  });

  it('Should navigate to a landmark that has been added as a child to an existing landmark.', async function () {

    function Container(props) {
      return (
        <div>
          <Navigation>
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </Navigation>
          <Main>
            <TextField label="Last Name" />
            {props.children}
          </Main>
        </div>
      );
    }
    let tree = render(<Container />);

    tree.rerender(
      <Container>
        <Region>
          <TextField label="First Name" />
        </Region>
      </Container>
    );
    let main = tree.getByRole('main');
    let navigation = tree.getByRole('navigation');
    let region = tree.getByRole('region');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(navigation);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(region);
  });

  it('Should navigate to a landmark that has been added as a parent to an existing landmark.', async function () {

    function Contained() {
      return (
        <div>
          <Navigation>
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </Navigation>
          <Region>
            <TextField label="Last Name" />
          </Region>
        </div>
      );
    }

    let tree = render(<Contained />);

    tree.rerender(
      <Main>
        <TextField label="Last Name" />
        <Contained />
      </Main>
    );

    let main = tree.getByRole('main');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);
  });

  it('can alt+F6 to main landmark', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Region>
          <TextField label="Last Name" />
        </Region>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
      );
    let navigation = tree.getByRole('navigation');
    let main = tree.getByRole('main');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(navigation);

    await user.keyboard('{Alt>}{F6}{/Alt}}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{Alt>}{F6}{/Alt}}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(navigation);
  });

  it('alt+F6 does nothing if no main landmark', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Region>
          <TextField label="Last Name" />
        </Region>
      </div>
      );
    let navigation = tree.getByRole('navigation');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(navigation);

    await user.keyboard('{Alt>}{F6}{/Alt}}');
    expect(document.activeElement!).toBe(navigation);
  });

  it('can alt+F6 to main landmark if main is the only landmark', async function () {
    let tree = render(
      <div>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
      );
    let main = tree.getByRole('main');

    await user.keyboard('{Alt>}{F6}{/Alt}}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{Alt>}{F6}{/Alt}}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);
  });

  it('landmark has tabIndex="-1" when focused', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
      );
    let navigation = tree.getByRole('navigation');
    let main = tree.getByRole('main');
    expect(navigation).not.toHaveAttribute('tabIndex');
    expect(main).not.toHaveAttribute('tabIndex');

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(navigation);
    expect(navigation).toHaveAttribute('tabIndex', '-1');
    expect(main).not.toHaveAttribute('tabIndex');

    await user.keyboard('{F6}');
    expect(main).toHaveAttribute('tabIndex', '-1');
    expect(navigation).not.toHaveAttribute('tabIndex');
  });

  it('cannot focus landmark with mouse', function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let navigation = tree.getByRole('navigation');

    fireEvent.mouseDown(navigation);
    fireEvent.mouseUp(navigation);

    expect(document.activeElement!).toBe(document.body);
  });

  it('focuses the landmark again after toggling browser tabs', async function () {
    let {getByRole} = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let nav = getByRole('navigation');

    await user.keyboard('{F6}');
    expect(nav).toHaveAttribute('tabIndex', '-1');
    expect(document.activeElement!).toBe(nav);

    toggleBrowserTabs();

    expect(document.activeElement!).toBe(nav);
    expect(nav).toHaveAttribute('tabIndex', '-1');
  });

  it('focuses the landmark again after toggling browser windows', async function () {
    let {getByRole} = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let nav = getByRole('navigation');

    await user.keyboard('{F6}');
    expect(nav).toHaveAttribute('tabIndex', '-1');
    expect(document.activeElement!).toBe(nav);

    toggleBrowserWindow();

    expect(document.activeElement!).toBe(nav);
    expect(nav).toHaveAttribute('tabIndex', '-1');
  });

  it('loses the tabIndex=-1 if something else is focused', async function () {
    let {getByRole, getAllByRole} = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let nav = getByRole('navigation');

    await user.keyboard('{F6}');
    expect(nav).toHaveAttribute('tabIndex', '-1');
    expect(document.activeElement!).toBe(nav);

    await user.tab();

    expect(document.activeElement!).toBe(getAllByRole('link')[0]);
    expect(nav).not.toHaveAttribute('tabIndex');
  });

  it('cleans up event listeners if all landmarks are unmounted', async function () {
    // Because our listener stops propagation of the F6 key to prevent anything
    // else from handling it, we can render with landmarks to make sure the propagation is stopped
    // and then when everything is unmounted, we can check again.
    let onKeyDown = jest.fn();
    let {getByRole, rerender} = render(
      <div>
        <Button onKeyDown={onKeyDown} variant="cta">Focusable</Button>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
      </div>
    );
    let nav = getByRole('navigation');
    let button = getByRole('button');

    act(() => {
      button.focus();
    });
    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(nav);

    expect(onKeyDown).not.toHaveBeenCalled();

    rerender(
      <div>
        <Button onKeyDown={onKeyDown} variant="cta">Focusable</Button>
      </div>
    );
    button = getByRole('button');

    act(() => {
      button.focus();
    });
    await user.keyboard('{F6}');

    expect(onKeyDown).toHaveBeenCalled();
  });

  it('updates the landmark if the label changes', function () {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let tree = render(
      <div>
        <Navigation aria-label="nav label 1">
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Navigation aria-label="nav label 2">
          <ul>
            <li><a href="/product">Product</a></li>
            <li><a href="/support">Support</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let navs = tree.getAllByRole('navigation');

    expect(spyWarn).not.toHaveBeenCalled();
    tree.rerender(
      <div>
        <Navigation aria-label="nav label 1">
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Navigation aria-label="nav label 1">
          <ul>
            <li><a href="/product">Product</a></li>
            <li><a href="/support">Support</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    expect(spyWarn).toHaveBeenCalledWith('Page contains more than one landmark with the \'navigation\' role and \'nav label 1\' label. If two or more landmarks on a page share the same role, they must have unique labels: ', navs);
  });

  it('focus restores to previously focused landmark after blur and F6.', async function () {
    let {getByRole} = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let nav = getByRole('navigation');

    await user.keyboard('{F6}');
    expect(nav).toHaveAttribute('tabIndex', '-1');
    expect(document.activeElement).toBe(nav);

    act(() => {
      (document.activeElement as HTMLElement).blur();
    });
    expect(nav).not.toHaveAttribute('tabIndex', '-1');
    expect(document.activeElement!).toBe(document.body);

    await user.keyboard('{F6}');
    expect(nav).toHaveAttribute('tabIndex', '-1');
    expect(document.activeElement!).toBe(nav);
  });

  it('landmark navigation fires custom event when wrapping forward', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );
    let main = tree.getByRole('main');

    let onLandmarkNavigation = jest.fn().mockImplementation(e => e.preventDefault());
    window.addEventListener('react-aria-landmark-navigation', onLandmarkNavigation);

    await user.tab();
    expect(document.activeElement!).toBe(tree.getAllByRole('link')[0]);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{F6}');

    expect(document.activeElement!).toBe(main);

    expect(onLandmarkNavigation).toHaveBeenCalledTimes(1);
    expect(onLandmarkNavigation.mock.calls[0][0].detail).toEqual({
      direction: 'forward'
    });

    window.removeEventListener('react-aria-landmark-navigation', onLandmarkNavigation);
  });

  it('landmark navigation fires custom event when wrapping backward', async function () {
    let tree = render(
      <div>
        <Navigation>
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Navigation>
        <Main>
          <TextField label="First Name" />
        </Main>
      </div>
    );

    let onLandmarkNavigation = jest.fn().mockImplementation(e => e.preventDefault());
    window.addEventListener('react-aria-landmark-navigation', onLandmarkNavigation);

    await user.tab();
    expect(document.activeElement!).toBe(tree.getAllByRole('link')[0]);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(tree.getAllByRole('link')[0]);

    expect(onLandmarkNavigation).toHaveBeenCalledTimes(1);
    expect(onLandmarkNavigation.mock.calls[0][0].detail).toEqual({
      direction: 'backward'
    });

    window.removeEventListener('react-aria-landmark-navigation', onLandmarkNavigation);
  });

  it('skips over aria-hidden landmarks', async function () {
    let tree = render(
      <div>
        <Main>
          <div aria-hidden="true">
            <Region aria-label="Region 1">
              <Checkbox>Checkbox label 1</Checkbox>
            </Region>
          </div>

          <TextField label="First Name" />

          <Region aria-label="Region 2">
            <Checkbox>Checkbox label 2</Checkbox>
          </Region>

          <TextField label="Last Name" />
        </Main>
      </div>
    );
    let main = tree.getByRole('main');
    let region2 = tree.getAllByRole('region')[0];

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(region2);

    await user.keyboard('{F6}');
    expect(document.activeElement!).toBe(main);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(region2);

    await user.keyboard('{Shift>}{F6}{/Shift}}');
    expect(document.activeElement!).toBe(main);
  });

  describe('LandmarkController', function () {
    it('should ensure keyboard listeners are active', async function () {
      let onLandmarkNavigation = jest.fn().mockImplementation(e => e.preventDefault());
      window.addEventListener('react-aria-landmark-navigation', onLandmarkNavigation);

      await user.keyboard('{F6}');
      expect(onLandmarkNavigation).not.toHaveBeenCalled();

      let controller = createLandmarkController();

      await user.keyboard('{F6}');
      expect(onLandmarkNavigation).toHaveBeenCalledTimes(1);

      controller.dispose();
      onLandmarkNavigation.mockReset();

      await user.keyboard('{F6}');
      expect(onLandmarkNavigation).not.toHaveBeenCalled();

      window.removeEventListener('react-aria-landmark-navigation', onLandmarkNavigation);
    });

    it('should navigate forward', async function () {
      let tree = render(
        <div>
          <Navigation>
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </Navigation>
          <Main>
            <TextField label="First Name" />
          </Main>
        </div>
      );

      await user.tab();
      expect(document.activeElement).toBe(tree.getAllByRole('link')[0]);

      let controller = createLandmarkController();

      act(() => {controller.focusNext();});
      expect(document.activeElement).toBe(tree.getByRole('main'));

      act(() => {controller.navigate('forward');});
      expect(document.activeElement).toBe(tree.getAllByRole('link')[0]);

      controller.dispose();
    });

    it('should navigate backward', function () {
      let tree = render(
        <div>
          <Navigation>
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </Navigation>
          <Main>
            <TextField label="First Name" />
          </Main>
        </div>
      );

      act(() => tree.getByRole('textbox').focus());

      let controller = createLandmarkController();

      act(() => {controller.focusPrevious();});
      expect(document.activeElement).toBe(tree.getByRole('navigation'));

      act(() => {controller.navigate('backward');});
      expect(document.activeElement).toBe(tree.getByRole('textbox'));

      controller.dispose();
    });

    it('should focus main', function () {
      let tree = render(
        <div>
          <Navigation>
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </Navigation>
          <Main>
            <TextField label="First Name" />
          </Main>
        </div>
      );

      act(() => tree.getByRole('textbox').focus());

      let controller = createLandmarkController();

      act(() => {controller.focusMain();});
      expect(document.activeElement).toBe(tree.getByRole('main'));

      controller.dispose();
    });
  });

  describe('singleton', function () {
    it('should store the landmark manager on the document', function () {
      // ensure a manager exists.
      let controller = createLandmarkController();
      let manager = document[Symbol.for('react-aria-landmark-manager')];
      expect(manager).toBeDefined();
      expect(typeof manager.version).toBe('number');
      expect(typeof manager.createLandmarkController).toBe('function');
      expect(typeof manager.registerLandmark).toBe('function');
      controller.dispose();
    });

    it('should replace the singleton with a new version', function () {
      let tree = render(
        <div>
          <Main>
            <TextField label="First Name" />
          </Main>
        </div>
      );

      let controller = createLandmarkController();
      let newController = {
        navigate: jest.fn(),
        focusNext: jest.fn(),
        focusPrevious: jest.fn(),
        focusMain: jest.fn(),
        dispose: jest.fn()
      };

      let manager = document[Symbol.for('react-aria-landmark-manager')];
      let unregister = jest.fn();
      let testLandmarkManager = {
        version: manager.version + 1,
        createLandmarkController: jest.fn().mockReturnValue(newController),
        registerLandmark: jest.fn().mockReturnValue(unregister)
      };

      document[Symbol.for('react-aria-landmark-manager')] = testLandmarkManager;
      act(() => {
        document.dispatchEvent(new CustomEvent('react-aria-landmark-manager-change'));
      });

      expect(testLandmarkManager.registerLandmark).toHaveBeenCalledTimes(1);
      expect(testLandmarkManager.createLandmarkController).toHaveBeenCalledTimes(1);

      // Controller should now proxy to the new version.
      controller.navigate('forward');
      expect(newController.navigate).toHaveBeenCalledTimes(1);
      expect(newController.navigate).toHaveBeenCalledWith('forward', undefined);

      controller.focusNext();
      expect(newController.focusNext).toHaveBeenCalledTimes(1);

      controller.focusPrevious();
      expect(newController.focusNext).toHaveBeenCalledTimes(1);

      controller.focusMain();
      expect(newController.focusMain).toHaveBeenCalledTimes(1);

      controller.dispose();
      expect(newController.dispose).toHaveBeenCalledTimes(1);

      // Component should now point to the new manager.
      tree.unmount();
      expect(unregister).toHaveBeenCalledTimes(1);
    });
  });
});
