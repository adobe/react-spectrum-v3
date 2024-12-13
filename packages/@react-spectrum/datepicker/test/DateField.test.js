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

import {act, pointerMap, renderv3 as render_, within} from '@react-spectrum/test-utils-internal';
import {Button} from '@react-spectrum/button';
import {CalendarDate, CalendarDateTime, ZonedDateTime} from '@internationalized/date';
import {DateField} from '../';
import {Form} from '@react-spectrum/form';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

function render(el) {
  if (el.type === Provider) {
    return render_(el);
  }
  let res = render_(
    <Provider theme={theme}>
      {el}
    </Provider>
  );
  return {
    ...res,
    rerender(el) {
      return res.rerender(<Provider theme={theme}>{el}</Provider>);
    }
  };
}

describe('DateField', function () {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });
  describe('labeling', function () {
    it('should support labeling', function () {
      let {getAllByRole, getByText} = render(<DateField label="Date" />);

      let label = getByText('Date');

      let combobox = getAllByRole('group')[0];
      expect(combobox).toHaveAttribute('aria-labelledby', label.id);

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('id');
        let segmentId = segment.getAttribute('id');
        expect(segment).toHaveAttribute('aria-labelledby', `${segmentId} ${label.id}`);
      }
    });

    it('should support labeling with aria-label', function () {
      let {getByRole, getAllByRole} = render(<DateField aria-label="Birth date" />);

      let field = getByRole('group');
      expect(field).toHaveAttribute('aria-label', 'Birth date');
      expect(field).toHaveAttribute('id');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('id');
        expect(segment.getAttribute('aria-label').endsWith(' Birth date')).toBe(true);
        expect(segment).not.toHaveAttribute('aria-labelledby');
      }
    });

    it('should support labeling with aria-labelledby', function () {
      let {getByRole, getAllByRole} = render(<DateField aria-labelledby="foo" />);

      let combobox = getByRole('group');
      expect(combobox).not.toHaveAttribute('aria-label');
      expect(combobox).toHaveAttribute('aria-labelledby', 'foo');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('id');
        let segmentId = segment.getAttribute('id');
        expect(segment).toHaveAttribute('aria-labelledby', `${segmentId} foo`);
      }
    });

    it('should support help text description', function () {
      let {getByRole, getAllByRole} = render(<DateField label="Date" description="Help text" />);

      let group = getByRole('group');
      expect(group).toHaveAttribute('aria-describedby');

      let description = document.getElementById(group.getAttribute('aria-describedby'));
      expect(description).toHaveTextContent('Help text');

      let segments = getAllByRole('spinbutton');
      expect(segments[0]).toHaveAttribute('aria-describedby', group.getAttribute('aria-describedby'));

      for (let segment of segments.slice(1)) {
        expect(segment).not.toHaveAttribute('aria-describedby');
      }
    });

    it('should support error message', function () {
      let {getByRole, getAllByRole} = render(<DateField label="Date" errorMessage="Error message" validationState="invalid" />);

      let group = getByRole('group');
      expect(group).toHaveAttribute('aria-describedby');

      let description = document.getElementById(group.getAttribute('aria-describedby'));
      expect(description).toHaveTextContent('Error message');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('aria-describedby', group.getAttribute('aria-describedby'));
      }
    });

    it('should not display error message if not invalid', function () {
      let {getByRole, getAllByRole} = render(<DateField label="Date" errorMessage="Error message" />);

      let group = getByRole('group');
      expect(group).not.toHaveAttribute('aria-describedby');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).not.toHaveAttribute('aria-describedby');
      }
    });

    it('should support help text with a value', function () {
      let {getByRole, getAllByRole} = render(<DateField label="Date" description="Help text" value={new CalendarDate(2020, 2, 3)} />);

      let group = getByRole('group');
      expect(group).toHaveAttribute('aria-describedby');

      let description = group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
      expect(description).toBe('Selected Date: February 3, 2020 Help text');

      let segments = getAllByRole('spinbutton');
      expect(segments[0]).toHaveAttribute('aria-describedby', group.getAttribute('aria-describedby'));

      for (let segment of segments.slice(1)) {
        expect(segment).not.toHaveAttribute('aria-describedby');
      }
    });

    it('should support error message with a value', function () {
      let {getByRole, getAllByRole} = render(<DateField label="Date" errorMessage="Error message" validationState="invalid" value={new CalendarDate(2020, 2, 3)} />);

      let group = getByRole('group');
      expect(group).toHaveAttribute('aria-describedby');

      let description = group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
      expect(description).toBe('Selected Date: February 3, 2020 Error message');

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('aria-describedby', group.getAttribute('aria-describedby'));
      }
    });

    it('should support format help text', function () {
      let {getByRole, getByText, getAllByRole} = render(<DateField label="Date" showFormatHelpText />);

      // Not needed in aria-described by because each segment has a label already, so this would be duplicative.
      let group = getByRole('group');
      expect(group).not.toHaveAttribute('aria-describedby');

      expect(getByText('month / day / year')).toBeVisible();

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).not.toHaveAttribute('aria-describedby');
      }
    });
  });

  describe('basics', function () {
    it('should support focusing via a ref', function () {
      let ref = React.createRef();
      let {getAllByRole} = render(<DateField label="Date" ref={ref} />);
      expect(ref.current).toHaveProperty('focus');

      act(() => ref.current.focus());
      expect(document.activeElement).toBe(getAllByRole('spinbutton')[0]);
    });

    it('should support autoFocus', function () {
      let {getAllByRole} = render(<DateField label="Date" autoFocus />);
      expect(document.activeElement).toBe(getAllByRole('spinbutton')[0]);
    });

    it('should pass through data attributes', function () {
      let {getByTestId} = render(<DateField label="Date" data-testid="foo" />);
      expect(getByTestId('foo')).toHaveAttribute('role', 'group');
    });

    it('should return the outer most DOM element from the ref', function () {
      let ref = React.createRef();
      render(<DateField label="Date" ref={ref} />);
      expect(ref.current).toHaveProperty('UNSAFE_getDOMNode');

      let wrapper = ref.current.UNSAFE_getDOMNode();
      expect(wrapper).toBeInTheDocument();
      expect(within(wrapper).getByText('Date')).toBeInTheDocument();
      expect(within(wrapper).getAllByRole('spinbutton')[0]).toBeInTheDocument();
    });

    it('should respond to provider props', function () {
      let {getAllByRole} = render(
        <Provider theme={theme} isDisabled>
          <DateField label="Date" />
        </Provider>
      );

      let segments = getAllByRole('spinbutton');
      for (let segment of segments) {
        expect(segment).toHaveAttribute('aria-disabled', 'true');
      }
    });

    it('Shows as invalid if an unavailable date is given', async function () {
      let tree = render(
        <DateField
          aria-label="Enter date between jan 1 and jan 8, 1980"
          isDateUnavailable={(date) => {
            return date.compare(new CalendarDate(1980, 1, 1)) >= 0
              && date.compare(new CalendarDate(1980, 1, 8)) <= 0;
          }}
          errorMessage="Date unavailable." />
      );
      await user.tab();
      await user.keyboard('01011980');
      expect(tree.getByText('Date unavailable.')).toBeInTheDocument();
    });
  });

  describe('events', function () {
    let onBlurSpy = jest.fn();
    let onFocusChangeSpy = jest.fn();
    let onFocusSpy = jest.fn();
    let onKeyDownSpy = jest.fn();
    let onKeyUpSpy = jest.fn();

    afterEach(() => {
      onBlurSpy.mockClear();
      onFocusChangeSpy.mockClear();
      onFocusSpy.mockClear();
      onKeyDownSpy.mockClear();
      onKeyUpSpy.mockClear();
    });

    it('should focus field and switching segments via tab does not change focus', async function () {
      let {getAllByRole} = render(<DateField label="Date" onBlur={onBlurSpy} onFocus={onFocusSpy} onFocusChange={onFocusChangeSpy} />);
      let segments = getAllByRole('spinbutton');

      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).not.toHaveBeenCalled();
      expect(onFocusSpy).not.toHaveBeenCalled();

      await user.tab();
      expect(segments[0]).toHaveFocus();

      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(1);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);

      await user.tab();
      expect(segments[1]).toHaveFocus();
      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(1);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);
    });

    it('should call blur when focus leaves', async function () {
      let {getAllByRole} = render(<DateField label="Date" onBlur={onBlurSpy} onFocus={onFocusSpy} onFocusChange={onFocusChangeSpy} />);
      let segments = getAllByRole('spinbutton');
      // workaround bug in userEvent.tab(). hidden inputs aren't focusable.
      document.querySelector('input[type=hidden]').tabIndex = -1;

      expect(onBlurSpy).not.toHaveBeenCalled();
      expect(onFocusChangeSpy).not.toHaveBeenCalled();
      expect(onFocusSpy).not.toHaveBeenCalled();

      await user.tab();
      expect(segments[0]).toHaveFocus();

      await user.tab();
      expect(segments[1]).toHaveFocus();

      await user.tab();
      expect(segments[2]).toHaveFocus();
      expect(onBlurSpy).toHaveBeenCalledTimes(0);

      await user.tab();
      expect(onBlurSpy).toHaveBeenCalledTimes(1);
      expect(onFocusChangeSpy).toHaveBeenCalledTimes(2);
      expect(onFocusSpy).toHaveBeenCalledTimes(1);
    });

    it('should trigger right arrow key event for segment navigation', async function () {
      let {getAllByRole} = render(<DateField label="Date" onKeyDown={onKeyDownSpy} onKeyUp={onKeyUpSpy} />);
      let segments = getAllByRole('spinbutton');

      expect(onKeyDownSpy).not.toHaveBeenCalled();
      expect(onKeyUpSpy).not.toHaveBeenCalled();

      await user.tab();
      expect(segments[0]).toHaveFocus();
      expect(onKeyDownSpy).not.toHaveBeenCalled();
      expect(onKeyUpSpy).toHaveBeenCalledTimes(1);

      await user.keyboard('{ArrowRight}');
      expect(segments[1]).toHaveFocus();
      expect(onKeyDownSpy).toHaveBeenCalledTimes(1);
      expect(onKeyUpSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('forms', () => {
    it('supports form values', () => {
      let {rerender} = render(<DateField name="date" label="Date" value={new CalendarDate(2020, 2, 3)} />);
      let input = document.querySelector('input[name=date]');
      expect(input).toHaveValue('2020-02-03');

      rerender(<DateField name="date" label="Date" value={new CalendarDateTime(2020, 2, 3, 8, 30)} />);
      expect(input).toHaveValue('2020-02-03T08:30:00');

      rerender(<DateField name="date" label="Date" value={new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000, 12, 24, 45)} />);
      expect(input).toHaveValue('2020-02-03T12:24:45-08:00[America/Los_Angeles]');
    });

    it('supports form reset', async () => {
      function Test() {
        let [value, setValue] = React.useState(new CalendarDate(2020, 2, 3));
        return (
          <form>
            <DateField name="date" label="Value" value={value} onChange={setValue} />
            <input type="reset" data-testid="reset" />
          </form>
        );
      }

      let {getByTestId, getByRole} = render(<Test />);
      let group = getByRole('group');
      let input = document.querySelector('input[name=date]');

      let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
      expect(getDescription()).toBe('Selected Date: February 3, 2020');

      expect(input).toHaveValue('2020-02-03');
      expect(input).toHaveAttribute('name', 'date');
      await user.tab();
      await user.keyboard('{ArrowUp}');
      expect(getDescription()).toBe('Selected Date: March 3, 2020');
      expect(input).toHaveValue('2020-03-03');

      let button = getByTestId('reset');
      await user.click(button);
      expect(getDescription()).toBe('Selected Date: February 3, 2020');
      expect(input).toHaveValue('2020-02-03');
    });

    describe('validation', () => {
      describe('validationBehavior=native', () => {
        it('supports isRequired', async () => {
          let {getByRole, getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DateField label="Date" name="date" isRequired validationBehavior="native" />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          let input = document.querySelector('input[name=date]');
          expect(input).toHaveAttribute('required');
          expect(input.validity.valid).toBe(false);
          expect(group).not.toHaveAttribute('aria-describedby');

          act(() => {getByTestId('form').checkValidity();});

          expect(group).toHaveAttribute('aria-describedby');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).toContain('Constraints not satisfied');
          expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);

          await user.keyboard('[ArrowUp][Tab][ArrowUp][Tab][ArrowUp]');

          expect(getDescription()).toContain('Constraints not satisfied');
          expect(input.validity.valid).toBe(true);

          await user.tab();

          expect(getDescription()).not.toContain('Constraints not satisfied');
        });

        it('supports minValue and maxValue', async () => {
          let {getByRole, getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DateField label="Date" name="date" minValue={new CalendarDate(2020, 2, 3)} maxValue={new CalendarDate(2024, 2, 3)} defaultValue={new CalendarDate(2019, 2, 3)} validationBehavior="native" />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          let input = document.querySelector('input[name=date]');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(input.validity.valid).toBe(false);
          expect(getDescription()).not.toContain('Value must be 2/3/2020 or later.');

          act(() => {getByTestId('form').checkValidity();});

          expect(group).toHaveAttribute('aria-describedby');
          expect(getDescription()).toContain('Value must be 2/3/2020 or later.');
          expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);

          await user.keyboard('[Tab][Tab][ArrowUp]');

          expect(getDescription()).toContain('Value must be 2/3/2020 or later.');
          expect(input.validity.valid).toBe(true);

          await user.tab();

          expect(getDescription()).not.toContain('Value must be 2/3/2020 or later.');

          await user.tab({shift: true});
          await user.keyboard('2025');
          expect(getDescription()).not.toContain('Value must be 2/3/2024 or earlier.');
          expect(input.validity.valid).toBe(false);
          await user.tab();

          act(() => {getByTestId('form').checkValidity();});
          expect(getDescription()).toContain('Value must be 2/3/2024 or earlier.');
          expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);

          await user.keyboard('[Tab][Tab][ArrowDown]');
          expect(getDescription()).toContain('Value must be 2/3/2024 or earlier.');
          expect(input.validity.valid).toBe(true);
          await user.tab();

          expect(getDescription()).not.toContain('Value must be 2/3/2024 or earlier.');
        });

        it('supports validate function', async () => {
          let {getByRole, getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DateField name="date" label="Value" defaultValue={new CalendarDate(2020, 2, 3)} validationBehavior="native" validate={v => v.year < 2022 ? 'Invalid value' : null} />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          let input = document.querySelector('input[name=date]');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).not.toContain('Invalid value');
          expect(input.validity.valid).toBe(false);

          act(() => {getByTestId('form').checkValidity();});

          expect(group).toHaveAttribute('aria-describedby');
          expect(getDescription()).toContain('Invalid value');
          expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);

          await user.keyboard('[ArrowRight][ArrowRight]2024');

          expect(getDescription()).toContain('Invalid value');
          expect(input.validity.valid).toBe(true);

          await user.tab();

          expect(getDescription()).not.toContain('Invalid value');
          expect(input.validity.valid).toBe(true);
        });

        it('supports server validation', async () => {
          function Test() {
            let [serverErrors, setServerErrors] = React.useState({});
            let onSubmit = e => {
              e.preventDefault();
              setServerErrors({
                date: 'Invalid value'
              });
            };

            return (
              <Provider theme={theme}>
                <Form onSubmit={onSubmit} validationErrors={serverErrors}>
                  <DateField name="date" label="Value" validationBehavior="native" />
                  <Button type="submit" data-testid="submit">Submit</Button>
                </Form>
              </Provider>
            );
          }

          let {getByTestId, getByRole} = render(<Test />);

          let group = getByRole('group');
          let input = document.querySelector('input[name=date]');
          expect(group).not.toHaveAttribute('aria-describedby');

          await user.click(getByTestId('submit'));

          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).toContain('Invalid value');
          expect(input.validity.valid).toBe(false);

          await user.tab({shift: true});
          await user.keyboard('2024[ArrowLeft]2[ArrowLeft]2');
          act(() => document.activeElement.blur());

          expect(getDescription()).not.toContain('Invalid value');
          expect(input.validity.valid).toBe(true);
        });

        it('supports customizing native error messages', async () => {
          let {getByTestId, getByRole} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DateField name="date" label="Value" isRequired validationBehavior="native" errorMessage={e => e.validationDetails.valueMissing ? 'Please enter a value' : null} />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          expect(group).not.toHaveAttribute('aria-describedby');

          act(() => {getByTestId('form').checkValidity();});
          expect(group).toHaveAttribute('aria-describedby');
          expect(document.getElementById(group.getAttribute('aria-describedby'))).toHaveTextContent('Please enter a value');
        });

        it('clears validation on form reset', async () => {
          let {getByRole, getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DateField label="Date" name="date" isRequired validationBehavior="native" />
                <Button type="reset" data-testid="reset">Reset</Button>
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          let input = document.querySelector('input[name=date]');
          expect(input).toHaveAttribute('required');
          expect(input.validity.valid).toBe(false);
          expect(group).not.toHaveAttribute('aria-describedby');

          act(() => {getByTestId('form').checkValidity();});

          expect(group).toHaveAttribute('aria-describedby');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).toContain('Constraints not satisfied');

          await user.click(getByTestId('reset'));

          expect(group).not.toHaveAttribute('aria-describedby');
        });

        it('only commits on blur if the value changed', async () => {
          let {getByRole, getByTestId} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DateField label="Date" name="date" isRequired validationBehavior="native" />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          let input = document.querySelector('input[name=date]');
          expect(input).toHaveAttribute('required');
          expect(input.validity.valid).toBe(false);
          expect(group).not.toHaveAttribute('aria-describedby');

          await user.tab();
          await user.tab({shift: true});
          expect(group).not.toHaveAttribute('aria-describedby');

          act(() => {getByTestId('form').checkValidity();});

          expect(group).toHaveAttribute('aria-describedby');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).toContain('Constraints not satisfied');
          expect(document.activeElement).toBe(within(group).getAllByRole('spinbutton')[0]);

          await user.keyboard('232023');

          expect(group).toHaveAttribute('aria-describedby');
          expect(input.validity.valid).toBe(true);

          await user.tab();
          expect(getDescription()).not.toContain('Constraints not satisfied');
        });
      });

      describe('validationBehavior=aria', () => {
        it('supports minValue and maxValue', async () => {
          let {getByRole} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DateField label="Date" name="date" minValue={new CalendarDate(2020, 2, 3)} maxValue={new CalendarDate(2024, 2, 3)} defaultValue={new CalendarDate(2019, 2, 3)} />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).toContain('Value must be 2/3/2020 or later.');

          await user.keyboard('[Tab][Tab][Tab][ArrowUp]');
          expect(getDescription()).not.toContain('Value must be 2/3/2020 or later.');

          await user.keyboard('[ArrowUp][ArrowUp][ArrowUp][ArrowUp][ArrowUp]');
          expect(getDescription()).toContain('Value must be 2/3/2024 or earlier.');

          await user.keyboard('[ArrowDown]');
          expect(getDescription()).not.toContain('Value must be 2/3/2024 or earlier.');
        });

        it('supports validate function', async () => {
          let {getByRole} = render(
            <Provider theme={theme}>
              <Form data-testid="form">
                <DateField label="Value" defaultValue={new CalendarDate(2020, 2, 3)} validate={v => v.year < 2022 ? 'Invalid value' : null} />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          expect(group).toHaveAttribute('aria-describedby');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).toContain('Invalid value');

          await user.keyboard('[Tab][ArrowRight][ArrowRight]2024');
          expect(getDescription()).not.toContain('Invalid value');
        });

        it('supports server validation', async () => {
          let {getByRole} = render(
            <Provider theme={theme}>
              <Form validationErrors={{value: 'Invalid value'}}>
                <DateField label="Value" name="value" defaultValue={new CalendarDate(2020, 2, 3)} />
              </Form>
            </Provider>
          );

          let group = getByRole('group');
          expect(group).toHaveAttribute('aria-describedby');
          let getDescription = () => group.getAttribute('aria-describedby').split(' ').map(d => document.getElementById(d).textContent).join(' ');
          expect(getDescription()).toContain('Invalid value');

          await user.keyboard('[Tab][ArrowRight][ArrowRight]2024[Tab]');
          expect(getDescription()).not.toContain('Invalid value');
        });
      });
    });
  });
});
