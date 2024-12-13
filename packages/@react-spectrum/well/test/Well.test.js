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

import React, {useRef} from 'react';
import {renderv3 as render} from '@react-spectrum/test-utils-internal';
import {Well} from '../';

let refExists = (ComponentToCheck, children, props) => {
  let ref;
  let dataTestId = props['data-testid'] || 'refTestId';
  let Component = () => {
    ref = useRef();
    return (<ComponentToCheck ref={ref} {...props} data-testid={dataTestId}>{children}</ComponentToCheck>);
  };

  let {getByText, getByTestId} = render(<Component />);
  expect(ref.current.UNSAFE_getDOMNode()).toEqual(getByTestId(dataTestId));

  return {getByText, ref};
};

describe('Well', () => {
  it.each`
    Name      | Component   | props
    ${'v3'}   | ${Well}     | ${{UNSAFE_className: 'myClass', 'data-testid': 'wellV3'}}
  `('$Name supports UNSAFE_className', ({Component, props}) => {
    let {getByTestId} = render(<Component {...props}>My Well</Component>);
    let className = getByTestId(props['data-testid']).className;
    expect(className.includes('spectrum-Well')).toBeTruthy();
    expect(className.includes('myClass')).toBeTruthy();
  });

  it.each`
    Name      | Component   | props
    ${'v3'}   | ${Well}     | ${{'data-testid': 'wellV3'}}
  `('$Name supports additional properties', ({Component, props}) => {
    let {getByTestId} = render(<Component {...props}>My Well</Component>);
    expect(getByTestId(props['data-testid'])).toHaveAttribute('data-testid', props['data-testid']);
  });

  it.each`
    Name      | Component
    ${'v3'}   | ${Well}
  `('$Name supports children', ({Component}) => {
    let {getByText} = render(<Component>My Well</Component>);
    expect(getByText('My Well')).toBeTruthy();
  });

  it('v3 forward ref exists and supports children and props', function () {
    let {ref} = refExists(Well, 'Well Text', {'data-testid': 'wellForwardRef'});
    expect(ref.current.UNSAFE_getDOMNode()).toHaveAttribute('data-testid', 'wellForwardRef');
    expect(ref.current.UNSAFE_getDOMNode().textContent.includes('Well Text')).toBeTruthy();
  });

  it('v3 supports aria-label with a role', function () {
    let {getByText} = render(<Well role="region" aria-label="well">Well</Well>);
    let well = getByText('Well');
    expect(well).toHaveAttribute('role', 'region');
    expect(well).toHaveAttribute('aria-label', 'well');
  });

  it('v3 warns user if label is provided without a role', function () {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Well aria-label="well">Well</Well>);
    expect(spyWarn).toHaveBeenCalledWith('A labelled Well must have a role.');
  });
});
