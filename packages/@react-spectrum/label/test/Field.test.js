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

import {Field} from '../';
import React from 'react';
import {render} from '@testing-library/react';
import {useField} from '@react-aria/label';

let defaultProps = {
  label: 'Field label'
};

let ExampleField = React.forwardRef((props = {}, ref) => {
  props = {...defaultProps, ...props};
  let {labelProps, fieldProps, descriptionProps, errorMessageProps} = useField(props);

  return (
    <Field
      {...props}
      labelProps={labelProps}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      ref={ref}>
      <input {...fieldProps} />
    </Field>
  );
});

function renderField(props = {}) {
  return render(<ExampleField {...props} />);
}

describe('Field', function () {
  it('renders correctly', function () {
    let {getByLabelText} = renderField();

    let labelledField = getByLabelText('Field label');
    expect(labelledField).toBeInTheDocument();
    expect(labelledField).not.toHaveAttribute('aria-describedby');
  });
  it('supports a ref', function () {
    let ref = React.createRef();
    let {getByRole} = renderField({ref});
    let field = getByRole('textbox').closest('div');

    expect(ref.current).toBe(field);
  });
  describe('help text', function () {
    describe('description', function () {
      it('renders when description is provided', function () {
        let {getByRole, getByText} = renderField({description: 'Help text'});

        let helpText = getByText('Help text');
        expect(helpText).toBeInTheDocument();
        let input = getByRole('textbox');
        expect(input).toHaveAttribute('aria-describedby', helpText.id);
      });

      it('renders when description and error message are provided but validationState is not invalid', function () {
        let {getByRole, getByText} = renderField({description: 'Help text', errorMessage: 'Error message'});

        let helpText = getByText('Help text');
        expect(helpText).toBeInTheDocument();
        let input = getByRole('textbox');
        expect(input).toHaveAttribute('aria-describedby', helpText.id);
      });

      it('renders when description is provided and validationState is invalid but no error message is provided', function () {
        let {getByRole, getByText} = renderField({description: 'Help text', validationState: 'invalid'});

        let helpText = getByText('Help text');
        expect(helpText).toBeInTheDocument();
        let input = getByRole('textbox');
        expect(input).toHaveAttribute('aria-describedby', helpText.id);
      });

      it('does not render when no description is provided', function () {
        let {getByRole} = renderField();

        let input = getByRole('textbox');
        expect(input).not.toHaveAttribute('aria-describedby');
      });

      it('renders when no visible label is provided', () => {
        let {getByRole, getByText} = renderField({label: null, 'aria-label': 'Field label', description: 'Help text'});

        let helpText = getByText('Help text');
        expect(helpText).toBeInTheDocument();
        let input = getByRole('textbox');
        expect(input).toHaveAttribute('aria-describedby', helpText.id);
      });
    });

    describe('error message', function () {
      it('renders when error message is provided and validationState is invalid', function () {
        let {getByRole, getByText} = renderField({errorMessage: 'Error message', validationState: 'invalid'});

        let errorMessage = getByText('Error message');
        expect(errorMessage).toBeInTheDocument();
        let input = getByRole('textbox');
        expect(input).toHaveAttribute('aria-describedby', errorMessage.id);
      });

      it('does not render when error message is provided but validationState is not invalid', function () {
        let {getByRole, queryByText} = renderField({errorMessage: 'Error message'});

        let errorMessage = queryByText('Error message');
        expect(errorMessage).toBeNull();
        let input = getByRole('textbox');
        expect(input).not.toHaveAttribute('aria-describedby');
      });

      it('does not render when validationState is invalid but no error message is provided', function () {
        let {getByRole} = renderField({validationState: 'invalid'});

        let input = getByRole('textbox');
        expect(input).not.toHaveAttribute('aria-describedby');
      });
    });
  });
});
