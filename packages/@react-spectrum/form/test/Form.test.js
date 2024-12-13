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

import {act} from 'react-dom/test-utils';
import {Button} from '@react-spectrum/button';
import {Content, Header} from '@react-spectrum/view';
import {ContextualHelp} from '@react-spectrum/contextualhelp';
import {Form} from '../';
import {Item, Picker} from '@react-spectrum/picker';
import {pointerMap, renderv3 as render, simulateMobile} from '@react-spectrum/test-utils-internal';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {TextField} from '@react-spectrum/textfield';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';
import {within} from '@testing-library/dom';

describe('Form', function () {
  let user;

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
    simulateMobile();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should render a form', () => {
    let {getByRole} = render(
      <Provider theme={theme}>
        <Form aria-label="Home" />
      </Provider>
    );

    let form = getByRole('form');
    expect(form).toBeTruthy();
    expect(form).toHaveAttribute('novalidate');
  });

  it('should render children inside the form', () => {
    let {getByRole} = render(
      <Provider theme={theme}>
        <Form aria-label="Home">
          <button>Test</button>
        </Form>
      </Provider>
    );

    let button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('should attach a optional user provided ref to the form', () => {
    let ref = React.createRef();
    let {getByRole} = render(
      <Provider theme={theme}>
        <Form aria-label="Home" ref={ref} />
      </Provider>
    );

    let form = getByRole('form');
    expect(form).toBe(ref.current.UNSAFE_getDOMNode());
  });

  it('should context props should be overridden by child', () => {
    let testId = 'tfid4';
    let tree = render(
      <Provider theme={theme}>
        <Form necessityIndicator={undefined}>
          <TextField label="A text field" necessityIndicator="label" data-testid={testId} />
        </Form>
      </Provider>
    );

    let input = tree.getByTestId(testId);
    let labelId = input.getAttribute('aria-labelledby');
    expect(labelId).toBeDefined();
    let label = document.getElementById(labelId);
    expect(label).toHaveTextContent('A text field ​(optional)');
  });

  it('supports form attributes', async () => {
    let onSubmit = jest.fn().mockImplementation(e => e.preventDefault());
    let {getByLabelText, getByRole} = render(
      <Provider theme={theme}>
        <Form
          aria-label="Test"
          onSubmit={onSubmit}
          action="/action_page.php"
          method="get"
          target="_self"
          encType="text/plain"
          autoComplete="on">
          <Button variant="primary" type="submit" aria-label="Submit" />
        </Form>
      </Provider>
    );

    let form = getByRole('form');
    expect(form).toHaveAttribute('action', '/action_page.php');
    expect(form).toHaveAttribute('method', 'get');
    expect(form).toHaveAttribute('target', '_self');
    expect(form).toHaveAttribute('encType', 'text/plain');
    expect(form).toHaveAttribute('autoComplete', 'on');
    let submit = getByLabelText('Submit');
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('supports aria-label', () => {
    let {getByRole} = render(
      <Provider theme={theme}>
        <Form aria-label="Test" />
      </Provider>
    );

    let form = getByRole('form');
    expect(form).toHaveAttribute('aria-label', 'Test');
  });

  it('supports aria-labelledby', () => {
    let {getByRole} = render(
      <Provider theme={theme}>
        <span id="test">Test</span>
        <Form aria-labelledby="test" />
      </Provider>
    );

    let form = getByRole('form');
    expect(form).toHaveAttribute('aria-labelledby', 'test');
  });

  it('supports aria-describedby', () => {
    let {getByRole} = render(
      <Provider theme={theme}>
        <span id="test">Test</span>
        <Form aria-label="Test" aria-describedby="test" />
      </Provider>
    );

    let form = getByRole('form');
    expect(form).toHaveAttribute('aria-describedby', 'test');
  });

  it('supports custom data attributes', () => {
    let {getByRole} = render(
      <Provider theme={theme}>
        <Form aria-label="Test" data-testid="test" />
      </Provider>
    );

    let form = getByRole('form');
    expect(form).toHaveAttribute('data-testid', 'test');
  });

  describe('values', () => {
    it('default value of a picker is empty', () => {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Form aria-label="Test">
            <Picker name="picker" label="Test Picker">
              <Item key="one">One</Item>
              <Item key="two">Two</Item>
              <Item key="three">Three</Item>
            </Picker>
          </Form>
        </Provider>
      );

      let form = getByRole('form');
      expect(form.elements['picker'].value).toEqual('');
    });

    it('value of a picker can be set', () => {
      let {getByRole} = render(
        <Provider theme={theme}>
          <Form aria-label="Test">
            <Picker name="picker" defaultSelectedKey="one" label="Test Picker">
              <Item key="one">One</Item>
              <Item key="two">Two</Item>
              <Item key="three">Three</Item>
            </Picker>
          </Form>
        </Provider>
      );

      let form = getByRole('form');
      expect(form.elements['picker'].value).toEqual('one');
    });

    it('contextual help should not be disabled nor should its dismiss button be disabled', async () => {
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <Form aria-label="Test" isDisabled>
            <Picker
              name="picker"
              defaultSelectedKey="one"
              label="Test Picker"
              contextualHelp={(
                <ContextualHelp>
                  <Header>What is it good for?</Header>
                  <Content>Absolutely nothing.</Content>
                </ContextualHelp>
              )}>
              <Item key="one">One</Item>
              <Item key="two">Two</Item>
              <Item key="three">Three</Item>
            </Picker>
          </Form>
        </Provider>
      );

      let button = getByLabelText('Help');
      await user.click(button);

      let dialog = getByRole('dialog');
      await user.tab();

      let dismissButton = within(dialog).getByRole('button');
      expect(document.activeElement).toBe(dismissButton);

      await user.click(dismissButton);
      act(() => {jest.runAllTimers();});
      act(() => {jest.runAllTimers();});

      expect(document.activeElement).toBe(button);
    });
  });
});
