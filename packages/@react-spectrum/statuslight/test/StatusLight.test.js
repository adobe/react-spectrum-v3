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

import React from 'react';
import {renderv3 as render} from '@react-spectrum/test-utils-internal';
import {StatusLight} from '../';


describe('StatusLight', function () {
  it.each`
    Name               | Component        | props
    ${'StatusLight'}   | ${StatusLight}   | ${{}}
  `('$Name default', function ({Component, props}) {
    let {getByText} = render(<Component {...props} id="status-light">StatusLight of Love</Component>);

    let statuslight = getByText('StatusLight of Love');
    expect(statuslight).toHaveAttribute('id', 'status-light');
  });

  it.each`
    Name               | Component        | props
    ${'StatusLight'}   | ${StatusLight}   | ${{variant: 'celery'}}
  `('$Name supports variant and aria-label', function ({Component, props}) {
    let {getByLabelText} = render(<Component {...props} id="status-light" role="status" aria-label="StatusLight of Love" />);

    let statuslight = getByLabelText('StatusLight of Love');
    expect(statuslight).toHaveAttribute('id', 'status-light');
  });

  it.each`
    Name               | Component        | props
    ${'StatusLight'}   | ${StatusLight}   | ${{variant: 'celery'}}
  `('$Name warns user if no label is provided', function ({Component, props}) {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Component {...props} id="status-light" />);
    expect(spyWarn).toHaveBeenCalledWith('If no children are provided, an aria-label must be specified');
  });

  it.each`
    Name               | Component        | props
    ${'StatusLight'}   | ${StatusLight}   | ${{variant: 'celery'}}
  `('$Name warns user if label is provided without a role', function ({Component, props}) {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Component {...props} aria-label="test" id="status-light" />);
    expect(spyWarn).toHaveBeenCalledWith('A labelled StatusLight must have a role.');
  });

  it.each`
    Name               | Component        | props
    ${'StatusLight'}   | ${StatusLight}   | ${{isDisabled: true}}
  `('$Name disabled, its css only, so this just makes sure it does not blow up', function ({Component, props}) {
    let {getByText} = render(<Component {...props} id="status-light">StatusLight of Love</Component>);

    let statuslight = getByText('StatusLight of Love');
    expect(statuslight).toHaveAttribute('id', 'status-light');
  });

  it.each`
    Name               | Component        | props
    ${'StatusLight'}   | ${StatusLight}   | ${{}}
  `('$Name forwards ref', function ({Component, props}) {
    let ref = React.createRef();
    let {getByText} = render(<Component {...props} ref={ref}>StatusLight of Love</Component>);

    let statuslight = getByText('StatusLight of Love');
    expect(statuslight).toBe(ref.current.UNSAFE_getDOMNode());
  });
});
