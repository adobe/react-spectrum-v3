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
import {Button} from '@react-spectrum/button';
import {Checkbox, CheckboxGroup} from '../';
import {Form} from '@react-spectrum/form';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

describe('CheckboxGroup', () => {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  it('handles defaults', async () => {
    let onChangeSpy = jest.fn();
    let {getByRole, getAllByRole, getByLabelText} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" onChange={onChangeSpy}>
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let checkboxGroup = getByRole('group', {exact: true});
    let checkboxes = getAllByRole('checkbox');
    expect(checkboxGroup).toBeInTheDocument();
    expect(checkboxes.length).toBe(3);

    expect(checkboxes[0]).not.toHaveAttribute('name');
    expect(checkboxes[1]).not.toHaveAttribute('name');
    expect(checkboxes[2]).not.toHaveAttribute('name');

    expect(checkboxes[0].value).toBe('dogs');
    expect(checkboxes[1].value).toBe('cats');
    expect(checkboxes[2].value).toBe('dragons');

    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(false);
    expect(checkboxes[2].checked).toBe(false);

    let dragons = getByLabelText('Dragons');
    await user.click(dragons);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(['dragons']);

    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(false);
    expect(checkboxes[2].checked).toBe(true);
  });

  it('can have a default value', () => {
    let {getByLabelText} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" value={['cats']}>
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    expect(getByLabelText('Cats').checked).toBe(true);
  });

  it('name can be controlled', () => {
    let {getAllByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" name="awesome-react-aria">
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let checkboxes = getAllByRole('checkbox');

    expect(checkboxes[0]).toHaveAttribute('name', 'awesome-react-aria');
    expect(checkboxes[1]).toHaveAttribute('name', 'awesome-react-aria');
    expect(checkboxes[2]).toHaveAttribute('name', 'awesome-react-aria');
  });

  it('supports labeling', () => {
    let {getByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet">
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );
    let checkboxGroup = getByRole('group', {exact: true});

    let labelId = checkboxGroup.getAttribute('aria-labelledby');
    expect(labelId).toBeDefined();
    let label = document.getElementById(labelId);
    expect(label).toHaveTextContent('Favorite Pet');
  });

  it('supports aria-label', () => {
    let {getByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup aria-label="My Favorite Pet">
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );
    let checkboxGroup = getByRole('group', {exact: true});

    expect(checkboxGroup).toHaveAttribute('aria-label', 'My Favorite Pet');
  });

  it('supports custom props', () => {
    let {getByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" data-testid="favorite-pet">
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );
    let checkboxGroup = getByRole('group', {exact: true});

    expect(checkboxGroup).toHaveAttribute('data-testid', 'favorite-pet');
  });

  it('sets aria-disabled when isDisabled is true', () => {
    let {getAllByRole, getByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" isDisabled>
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let checkboxGroup = getByRole('group', {exact: true});
    expect(checkboxGroup).toHaveAttribute('aria-disabled', 'true');

    let checkboxes = getAllByRole('checkbox');
    expect(checkboxes[0]).toHaveAttribute('disabled');
    expect(checkboxes[1]).toHaveAttribute('disabled');
    expect(checkboxes[2]).toHaveAttribute('disabled');
  });

  it('doesn\'t set aria-disabled by default', () => {
    let {getAllByRole, getByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet">
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let checkboxGroup = getByRole('group', {exact: true});
    expect(checkboxGroup).not.toHaveAttribute('aria-disabled');

    let checkboxes = getAllByRole('checkbox');
    expect(checkboxes[0]).not.toHaveAttribute('disabled');
    expect(checkboxes[1]).not.toHaveAttribute('disabled');
    expect(checkboxes[2]).not.toHaveAttribute('disabled');
  });

  it('doesn\'t set aria-disabled when isDisabled is false', () => {
    let {getAllByRole, getByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" isDisabled={false}>
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let checkboxGroup = getByRole('group', {exact: true});
    expect(checkboxGroup).not.toHaveAttribute('aria-disabled');

    let checkboxes = getAllByRole('checkbox');
    expect(checkboxes[0]).not.toHaveAttribute('disabled');
    expect(checkboxes[1]).not.toHaveAttribute('disabled');
    expect(checkboxes[2]).not.toHaveAttribute('disabled');
  });

  it('sets aria-readonly="true" on each checkbox', () => {
    let {getAllByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" isReadOnly>
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let checkboxes = getAllByRole('checkbox');
    expect(checkboxes[0]).toHaveAttribute('aria-readonly', 'true');
    expect(checkboxes[1]).toHaveAttribute('aria-readonly', 'true');
    expect(checkboxes[2]).toHaveAttribute('aria-readonly', 'true');
  });

  it('should not update state for readonly checkbox', async () => {
    let groupOnChangeSpy = jest.fn();
    let checkboxOnChangeSpy = jest.fn();
    let {getAllByRole, getByLabelText} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" onChange={groupOnChangeSpy}>
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons" isReadOnly onChange={checkboxOnChangeSpy}>Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let checkboxes = getAllByRole('checkbox');
    let dragons = getByLabelText('Dragons');

    await user.click(dragons);

    expect(groupOnChangeSpy).toHaveBeenCalledTimes(0);
    expect(checkboxOnChangeSpy).toHaveBeenCalledTimes(0);
    expect(checkboxes[2].checked).toBe(false);
  });

  it('adds required to group label', () => {
    let {getAllByRole, getByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" isRequired>
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let checkboxGroup = getByRole('group', {exact: true});
    let labelId = checkboxGroup.getAttribute('aria-labelledby');
    let label = document.getElementById(labelId);
    expect(label).toHaveTextContent('Favorite Pet');

    let necessityIndicator = within(label).getByRole('img');
    expect(necessityIndicator).toHaveAttribute('aria-label', '(required)');

    let checkboxes = getAllByRole('checkbox');
    expect(checkboxes[0]).not.toHaveAttribute('required');
    expect(checkboxes[1]).not.toHaveAttribute('required');
    expect(checkboxes[2]).not.toHaveAttribute('required');
  });

  it('supports isRequired on individual checkboxes', () => {
    let {getAllByRole, getByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Agree to the following" isRequired>
          <Checkbox value="terms" isRequired>Terms and conditions</Checkbox>
          <Checkbox value="cookies" isRequired>Cookies</Checkbox>
          <Checkbox value="privacy" isRequired>Privacy policy</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let checkboxGroup = getByRole('group', {exact: true});
    let labelId = checkboxGroup.getAttribute('aria-labelledby');
    let label = document.getElementById(labelId);
    expect(label).toHaveTextContent('Agree to the following');

    let necessityIndicator = within(label).getByRole('img');
    expect(necessityIndicator).toHaveAttribute('aria-label', '(required)');

    let checkboxes = getAllByRole('checkbox');
    expect(checkboxes[0]).toHaveAttribute('aria-required');
    expect(checkboxes[1]).toHaveAttribute('aria-required');
    expect(checkboxes[2]).toHaveAttribute('aria-required');
  });

  it('adds aria-invalid to all checkboxes when the group is invalid', () => {
    let {getAllByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" isInvalid>
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let checkboxes = getAllByRole('checkbox');
    expect(checkboxes[0]).toHaveAttribute('aria-invalid');
    expect(checkboxes[1]).toHaveAttribute('aria-invalid');
    expect(checkboxes[2]).toHaveAttribute('aria-invalid');
  });

  it('supports invalid state on individual checkboxes', () => {
    let {getAllByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Agree to the following">
          <Checkbox value="terms" isInvalid>Terms and conditions</Checkbox>
          <Checkbox value="cookies" isInvalid>Cookies</Checkbox>
          <Checkbox value="privacy">Privacy policy</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let checkboxes = getAllByRole('checkbox');
    expect(checkboxes[0]).toHaveAttribute('aria-invalid', 'true');
    expect(checkboxes[1]).toHaveAttribute('aria-invalid', 'true');
    expect(checkboxes[2]).not.toHaveAttribute('aria-invalid');
  });

  it.each(['isSelected', 'defaultSelected', 'isEmphasized'])('warns if %s is passed to an individual checkbox', (prop) => {
    let props = {[prop]: true};
    let spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet">
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats" {...props}>Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    expect(spy).toHaveBeenCalledWith(`${prop} is unsupported on individual <Checkbox> elements within a <CheckboxGroup>. Please apply these props to the group instead.`);
  });

  it('should support help text description', function () {
    let {getByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" description="Help text">
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let group = getByRole('group');
    expect(group).toHaveAttribute('aria-describedby');

    let description = document.getElementById(group.getAttribute('aria-describedby'));
    expect(description).toHaveTextContent('Help text');
  });

  it('should support error message', function () {
    let {getByRole} = render(
      <Provider theme={theme}>
        <CheckboxGroup label="Favorite Pet" errorMessage="Error message" isInvalid>
          <Checkbox value="dogs">Dogs</Checkbox>
          <Checkbox value="cats">Cats</Checkbox>
          <Checkbox value="dragons">Dragons</Checkbox>
        </CheckboxGroup>
      </Provider>
    );

    let group = getByRole('group');
    expect(group).toHaveAttribute('aria-describedby');

    let description = document.getElementById(group.getAttribute('aria-describedby'));
    expect(description).toHaveTextContent('Error message');
  });

  it('supports form reset', async () => {
    function Test() {
      let [value, setValue] = React.useState(['dogs']);
      return (
        <Provider theme={theme}>
          <form>
            <CheckboxGroup name="pets" label="Pets" value={value} onChange={setValue}>
              <Checkbox value="dogs">Dogs</Checkbox>
              <Checkbox value="cats">Cats</Checkbox>
              <Checkbox value="dragons">Dragons</Checkbox>
            </CheckboxGroup>
            <input type="reset" data-testid="reset" />
          </form>
        </Provider>
      );
    }

    let {getAllByRole, getByTestId} = render(<Test />);
    let checkboxes = getAllByRole('checkbox');

    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
    await user.click(checkboxes[1]);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();

    let button = getByTestId('reset');
    await user.click(button);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });

  describe('validation', () => {
    describe('validationBehavior=native', () => {
      it('supports group level isRequired', async () => {
        let {getAllByRole, getByRole, getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <CheckboxGroup label="Agree to the following" isRequired validationBehavior="native">
                <Checkbox value="terms">Terms and conditions</Checkbox>
                <Checkbox value="cookies">Cookies</Checkbox>
                <Checkbox value="privacy">Privacy policy</Checkbox>
              </CheckboxGroup>
            </Form>
          </Provider>
        );

        let group = getByRole('group');
        expect(group).not.toHaveAttribute('aria-describedby');

        let checkboxes = getAllByRole('checkbox');
        for (let input of checkboxes) {
          expect(input).toHaveAttribute('required');
          expect(input).not.toHaveAttribute('aria-required');
          expect(input.validity.valid).toBe(false);
        }

        act(() => {getByTestId('form').checkValidity();});

        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('Constraints not satisfied');

        await user.click(checkboxes[0]);
        for (let input of checkboxes) {
          expect(input).not.toHaveAttribute('required');
          expect(input).not.toHaveAttribute('aria-required');
          expect(input.validity.valid).toBe(true);
        }

        expect(group).not.toHaveAttribute('aria-describedby');
      });

      it('supports checkbox level isRequired', async () => {
        let {getAllByRole, getByRole, getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <CheckboxGroup label="Agree to the following" validationBehavior="native">
                <Checkbox value="terms" isRequired>Terms and conditions</Checkbox>
                <Checkbox value="cookies" isRequired>Cookies</Checkbox>
                <Checkbox value="privacy">Privacy policy</Checkbox>
              </CheckboxGroup>
            </Form>
          </Provider>
        );

        let group = getByRole('group');
        expect(group).not.toHaveAttribute('aria-describedby');

        let checkboxes = getAllByRole('checkbox');
        for (let input of checkboxes.slice(0, 2)) {
          expect(input).toHaveAttribute('required');
          expect(input).not.toHaveAttribute('aria-required');
          expect(input.validity.valid).toBe(false);
        }
        expect(checkboxes[2]).not.toHaveAttribute('required');
        expect(checkboxes[2]).not.toHaveAttribute('aria-required');
        expect(checkboxes[2].validity.valid).toBe(true);

        act(() => {getByTestId('form').checkValidity();});

        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('Constraints not satisfied');
        expect(document.activeElement).toBe(checkboxes[0]);

        await user.click(checkboxes[0]);
        expect(checkboxes[0].validity.valid).toBe(true);
        expect(checkboxes[1].validity.valid).toBe(false);
        expect(group).toHaveAttribute('aria-describedby');

        await user.click(checkboxes[1]);
        expect(checkboxes[1].validity.valid).toBe(true);
        expect(group).not.toHaveAttribute('aria-describedby');
      });

      it('supports group level validate function', async () => {
        let {getAllByRole, getByRole, getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <CheckboxGroup label="Agree to the following" validationBehavior="native" validate={v => v.length < 3 ? 'You must accept all terms' : null}>
                <Checkbox value="terms">Terms and conditions</Checkbox>
                <Checkbox value="cookies">Cookies</Checkbox>
                <Checkbox value="privacy">Privacy policy</Checkbox>
              </CheckboxGroup>
            </Form>
          </Provider>
        );

        let group = getByRole('group');
        expect(group).not.toHaveAttribute('aria-describedby');

        let checkboxes = getAllByRole('checkbox');
        for (let input of checkboxes) {
          expect(input).not.toHaveAttribute('required');
          expect(input).not.toHaveAttribute('aria-required');
          expect(input.validity.valid).toBe(false);
        }

        act(() => {getByTestId('form').checkValidity();});

        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent(['You must accept all terms']);
        expect(document.activeElement).toBe(checkboxes[0]);

        await user.click(checkboxes[0]);
        expect(group).toHaveAttribute('aria-describedby');
        for (let input of checkboxes) {
          expect(input.validity.valid).toBe(false);
        }

        await user.click(checkboxes[1]);
        expect(group).toHaveAttribute('aria-describedby');
        for (let input of checkboxes) {
          expect(input.validity.valid).toBe(false);
        }

        await user.click(checkboxes[2]);
        expect(group).not.toHaveAttribute('aria-describedby');
        for (let input of checkboxes) {
          expect(input.validity.valid).toBe(true);
        }
      });

      it('supports checkbox level validate function', async () => {
        let {getAllByRole, getByRole, getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <CheckboxGroup label="Agree to the following" validationBehavior="native">
                <Checkbox value="terms" validate={v => !v ? 'You must accept the terms.' : null}>Terms and conditions</Checkbox>
                <Checkbox value="cookies" validate={v => !v ? 'You must accept the cookies.' : null}>Cookies</Checkbox>
                <Checkbox value="privacy">Privacy policy</Checkbox>
              </CheckboxGroup>
            </Form>
          </Provider>
        );

        let group = getByRole('group');
        expect(group).not.toHaveAttribute('aria-describedby');

        let checkboxes = getAllByRole('checkbox');
        expect(checkboxes[0].validity.valid).toBe(false);
        expect(checkboxes[1].validity.valid).toBe(false);
        expect(checkboxes[2].validity.valid).toBe(true);

        act(() => {getByTestId('form').checkValidity();});

        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('You must accept the terms. You must accept the cookies.');
        expect(document.activeElement).toBe(checkboxes[0]);

        await user.click(checkboxes[0]);
        expect(checkboxes[0].validity.valid).toBe(true);
        expect(checkboxes[1].validity.valid).toBe(false);

        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('You must accept the cookies.');

        await user.click(checkboxes[1]);
        expect(checkboxes[0].validity.valid).toBe(true);
        expect(checkboxes[1].validity.valid).toBe(true);
        expect(group).not.toHaveAttribute('aria-describedby');
      });

      it('supports server validation', async () => {
        function Test() {
          let [serverErrors, setServerErrors] = React.useState({});
          let onSubmit = e => {
            e.preventDefault();
            setServerErrors({
              terms: 'You must accept the terms.'
            });
          };

          return (
            <Provider theme={theme}>
              <Form onSubmit={onSubmit} validationErrors={serverErrors}>
                <CheckboxGroup name="terms" label="Agree to the following" validationBehavior="native">
                  <Checkbox value="terms">Terms and conditions</Checkbox>
                  <Checkbox value="cookies">Cookies</Checkbox>
                  <Checkbox value="privacy">Privacy policy</Checkbox>
                </CheckboxGroup>
                <Button type="submit">Submit</Button>
              </Form>
            </Provider>
          );
        }

        let {getAllByRole, getByRole} = render(<Test />);

        let group = getByRole('group');
        expect(group).not.toHaveAttribute('aria-describedby');

        await user.click(getByRole('button'));

        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('You must accept the terms.');

        let checkboxes = getAllByRole('checkbox');
        for (let input of checkboxes) {
          expect(input.validity.valid).toBe(false);
        }

        await user.click(checkboxes[0]);
        expect(group).not.toHaveAttribute('aria-describedby');
        for (let input of checkboxes) {
          expect(input.validity.valid).toBe(true);
        }
      });

      it('supports customizing native error messages', async () => {
        let {getByRole, getByTestId} = render(
          <Provider theme={theme}>
            <Form data-testid="form">
              <CheckboxGroup label="Agree to the following" isRequired validationBehavior="native" errorMessage={e => e.validationDetails.valueMissing ? 'Please select at least one item' : null}>
                <Checkbox value="terms">Terms and conditions</Checkbox>
                <Checkbox value="cookies">Cookies</Checkbox>
                <Checkbox value="privacy">Privacy policy</Checkbox>
              </CheckboxGroup>
            </Form>
          </Provider>
        );

        let group = getByRole('group');
        expect(group).not.toHaveAttribute('aria-describedby');

        act(() => {getByTestId('form').checkValidity();});
        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('Please select at least one item');
      });
    });

    describe('validationBehavior=aria', () => {
      it('supports group level validate function', async () => {
        let {getAllByRole, getByRole} = render(
          <Provider theme={theme}>
            <CheckboxGroup label="Agree to the following" validate={v => v.length < 3 ? 'You must accept all terms' : null}>
              <Checkbox value="terms">Terms and conditions</Checkbox>
              <Checkbox value="cookies">Cookies</Checkbox>
              <Checkbox value="privacy">Privacy policy</Checkbox>
            </CheckboxGroup>
          </Provider>
        );

        let group = getByRole('group');
        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('You must accept all terms');

        let checkboxes = getAllByRole('checkbox');
        for (let input of checkboxes) {
          expect(input).toHaveAttribute('aria-invalid', 'true');
          expect(input.validity.valid).toBe(true);
        }

        await user.click(checkboxes[0]);
        expect(group).toHaveAttribute('aria-describedby');

        await user.click(checkboxes[1]);
        expect(group).toHaveAttribute('aria-describedby');

        await user.click(checkboxes[2]);
        expect(group).not.toHaveAttribute('aria-describedby');
      });

      it('supports checkbox level validate function', async () => {
        let {getAllByRole, getByRole} = render(
          <Provider theme={theme}>
            <CheckboxGroup label="Agree to the following">
              <Checkbox value="terms" validate={v => !v ? 'You must accept the terms.' : null}>Terms and conditions</Checkbox>
              <Checkbox value="cookies" validate={v => !v ? 'You must accept the cookies.' : null}>Cookies</Checkbox>
              <Checkbox value="privacy">Privacy policy</Checkbox>
            </CheckboxGroup>
          </Provider>
        );

        let checkboxes = getAllByRole('checkbox');
        for (let input of checkboxes) {
          if (input.value !== 'privacy') {
            expect(input).toHaveAttribute('aria-invalid', 'true');
          }
          expect(input.validity.valid).toBe(true);
        }

        let group = getByRole('group');
        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('You must accept the terms. You must accept the cookies.');

        await user.click(checkboxes[0]);
        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('You must accept the cookies.');

        await user.click(checkboxes[1]);
        expect(group).not.toHaveAttribute('aria-describedby');
      });

      it('supports server validation', async () => {
        let {getAllByRole, getByRole} = render(
          <Provider theme={theme}>
            <Form validationErrors={{terms: 'You must accept the terms'}}>
              <CheckboxGroup name="terms" label="Agree to the following">
                <Checkbox value="terms">Terms and conditions</Checkbox>
                <Checkbox value="cookies">Cookies</Checkbox>
                <Checkbox value="privacy">Privacy policy</Checkbox>
              </CheckboxGroup>
            </Form>
          </Provider>
        );

        let group = getByRole('group');
        expect(group).toHaveAttribute('aria-describedby');
        expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('You must accept the terms');

        let checkboxes = getAllByRole('checkbox');
        for (let input of checkboxes) {
          expect(input).toHaveAttribute('aria-invalid', 'true');
        }

        await user.click(checkboxes[0]);
        expect(group).not.toHaveAttribute('aria-describedby');
      });
    });
  });
});
