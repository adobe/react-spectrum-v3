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

import {ProgressBar} from '../';
import React from 'react';
import {renderv3 as render} from '@react-spectrum/test-utils-internal';


describe('ProgressBar', function () {
  it.each`
    Name               | Component
    ${'ProgressBar'}   | ${ProgressBar}
  `('$Name handles defaults', function ({Component}) {
    let {getByRole} = render(<Component label="Progress Bar" />);
    let progressBar = getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    expect(progressBar).toHaveAttribute('aria-valuetext', '0%');

    let labelId = progressBar.getAttribute('aria-labelledby');
    expect(labelId).toBeDefined();
    let label = document.getElementById(labelId);
    expect(label).toHaveTextContent('Progress Bar');
  });

  it.each`
    Name               | Component        | props
    ${'ProgressBar'}   | ${ProgressBar}   | ${{value: 30}}
  `('$Name update all fileds by value', function ({Component, props}) {
    let {getByRole} = render(<Component {...props} label="Progress Bar" />);
    let progressBar = getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-valuenow', '30');
    expect(progressBar).toHaveAttribute('aria-valuetext', '30%');
  });

  it.each`
    Name               | Component        | props
    ${'ProgressBar'}   | ${ProgressBar}   | ${{value: -1}}
  `('$Name clamps values to 0', function ({Component, props}) {
    let {getByRole} = render(<Component {...props} label="Progress Bar" />);
    let progressBar = getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    expect(progressBar).toHaveAttribute('aria-valuetext', '0%');
  });

  it.each`
    Name               | Component        | props
    ${'ProgressBar'}   | ${ProgressBar}   | ${{value: 1000}}
  `('$Name clamps values to 100', function ({Component, props}) {
    let {getByRole} = render(<Component {...props} label="Progress Bar" />);
    let progressBar = getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    expect(progressBar).toHaveAttribute('aria-valuetext', '100%');
  });

  it.each`
    Name               | Component        | props
    ${'ProgressBar'}   | ${ProgressBar}   | ${{size: 'S', UNSAFE_className: 'testClass'}}
  `('$Name supports UNSAFE_className', function ({Component, props}) {
    let {getByRole} = render(<Component {...props} label="Progress Bar" />);
    let progressBar = getByRole('progressbar');
    expect(progressBar).toHaveAttribute('class', expect.stringContaining('testClass'));
  });

  it('Can handle negative values', () => {
    let {getByRole} = render(<ProgressBar value={0} minValue={-5} maxValue={5} label="Progress Bar" />);
    let progressBar = getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    expect(progressBar).toHaveAttribute('aria-valuetext', '50%');
  });

  it('warns user if no aria-label is provided', () => {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<ProgressBar value={25} />);
    expect(spyWarn).toHaveBeenCalledWith('If you do not provide a visible label via children, you must specify an aria-label or aria-labelledby attribute for accessibility');
  });

  it('supports custom DOM props', function () {
    let {getByTestId} = render(<ProgressBar label="Meter" data-testid="test" />);
    let progressBar = getByTestId('test');
    expect(progressBar).toBeInTheDocument();
  });
});
