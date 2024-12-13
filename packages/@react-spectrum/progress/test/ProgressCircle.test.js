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

import {ProgressCircle} from '../';
import React from 'react';
import {renderv3 as render} from '@react-spectrum/test-utils-internal';


describe('ProgressCircle', function () {
  it.each`
    Name                  | Component           | props
    ${'ProgressCircle'}   | ${ProgressCircle}   | ${{}}
  `('$Name handles defaults', function ({Component, props}) {
    let {getByRole} = render(<Component aria-label="Progress" {...props}>Progress Circle</Component>);
    let progressCircle = getByRole('progressbar');
    expect(progressCircle).toHaveAttribute('aria-valuemin', '0');
    expect(progressCircle).toHaveAttribute('aria-valuemax', '100');
    expect(progressCircle).toHaveAttribute('aria-valuenow', '0');
  });

  it.each`
    Name                  | Component           | props
    ${'ProgressCircle'}   | ${ProgressCircle}   | ${{isIndeterminate: true}}
  `('$Name handles indeterminate', function ({Component, props}) {
    let {getByRole} = render(<Component aria-label="Progress" {...props}>Progress Circle</Component>);
    let progressCircle = getByRole('progressbar');
    expect(progressCircle).toHaveAttribute('aria-valuemin', '0');
    expect(progressCircle).toHaveAttribute('aria-valuemax', '100');
    expect(progressCircle).not.toHaveAttribute('aria-valuenow');
  });

  it.each`
    Name                  | Component           | props
    ${'ProgressCircle'}   | ${ProgressCircle}   | ${{value: 30}}
  `('$Name handles controlled value', function ({Component, props}) {
    let {getByRole} = render(<Component aria-label="Progress" {...props}>Progress Circle</Component>);
    let progressCircle = getByRole('progressbar');
    expect(progressCircle).toHaveAttribute('aria-valuemin', '0');
    expect(progressCircle).toHaveAttribute('aria-valuemax', '100');
    expect(progressCircle).toHaveAttribute('aria-valuenow', '30');
  });

  it.each`
    Name               | Component        | props
    ${'ProgressCircle'}   | ${ProgressCircle}   | ${{value: -1}}
  `('$Name clamps values to 0', function ({Component, props}) {
    let {getByRole} = render(<Component aria-label="Progress" {...props}>Progress Circle</Component>);
    let progressCircle = getByRole('progressbar');
    expect(progressCircle).toHaveAttribute('aria-valuenow', '0');
  });

  it.each`
    Name               | Component        | props
    ${'ProgressCircle'}   | ${ProgressCircle}   | ${{value: 1000}}
  `('$Name clamps values to 100', function ({Component, props}) {
    let {getByRole} = render(<Component aria-label="Progress" {...props}>Progress Circle</Component>);
    let progressCircle = getByRole('progressbar');
    expect(progressCircle).toHaveAttribute('aria-valuenow', '100');
  });

  it.each`
    Name                  | Component           | props
    ${'ProgressCircle'}   | ${ProgressCircle}   | ${{UNSAFE_className: 'testClass'}}
  `('$Name supports UNSAFE_className', function ({Component, props}) {
    let {getByRole} = render(<Component aria-label="Progress" {...props}>Progress Circle</Component>);
    let progressCircle = getByRole('progressbar');
    expect(progressCircle).toHaveAttribute('class', expect.stringContaining('testClass'));
  });

  // These tests only work against v3 for data-testid
  it('handles submask defaults', () => {
    let {getByRole, getByTestId} = render(<ProgressCircle aria-label="Progress" value={0}>Progress Bar</ProgressCircle>);
    let progressCircle = getByRole('progressbar');
    expect(progressCircle).toHaveAttribute('aria-valuenow', '0');
    expect(progressCircle).toHaveAttribute('aria-valuetext', '0%');
    expect(getByTestId('fillSubMask1')).toBeDefined();
    expect(getByTestId('fillSubMask2')).toBeDefined();
    expect(getByTestId('fillSubMask1')).not.toHaveAttribute('style');
    expect(getByTestId('fillSubMask2')).not.toHaveAttribute('style');
  });

  it('shows none of the circle for 0%', () => {
    let {getByTestId} = render(<ProgressCircle aria-label="Progress" value={0} />);
    expect(getByTestId('fillSubMask1')).not.toHaveAttribute('style');
    expect(getByTestId('fillSubMask2')).not.toHaveAttribute('style');
  });

  it('shows quarter of the circle for 25%', () => {
    let {getByTestId} = render(<ProgressCircle aria-label="Progress" value={25} />);
    expect(getByTestId('fillSubMask1')).toHaveAttribute(
      'style',
      'transform: rotate(-90deg);'
    );
    expect(getByTestId('fillSubMask2')).toHaveAttribute(
      'style',
      'transform: rotate(-180deg);'
    );
  });

  it('shows half the circle for 50%', () => {
    let {getByTestId} = render(<ProgressCircle aria-label="Progress" value={50} />);
    expect(getByTestId('fillSubMask1')).toHaveAttribute(
      'style',
      'transform: rotate(0deg);'
    );
    expect(getByTestId('fillSubMask2')).toHaveAttribute(
      'style',
      'transform: rotate(-180deg);'
    );
  });

  it('shows quarter of the circle for 75%', () => {
    let {getByTestId} = render(<ProgressCircle aria-label="Progress" value={75} />);
    expect(getByTestId('fillSubMask1')).toHaveAttribute(
      'style',
      'transform: rotate(0deg);'
    );
    expect(getByTestId('fillSubMask2')).toHaveAttribute(
      'style',
      'transform: rotate(-90deg);'
    );
  });

  it('shows all of the circle for 100%', () => {
    let {getByTestId} = render(<ProgressCircle aria-label="Progress" value={100} />);
    expect(getByTestId('fillSubMask1')).toHaveAttribute(
      'style',
      'transform: rotate(0deg);'
    );
    expect(getByTestId('fillSubMask2')).toHaveAttribute(
      'style',
      'transform: rotate(0deg);'
    );
  });

  it('can handle negative values with minValue and maxValue', () => {
    let {getByRole} = render(<ProgressCircle aria-label="Progress" value={0} minValue={-5} maxValue={5} />);
    let progressBar = getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    expect(progressBar).toHaveAttribute('aria-valuetext', '50%');
  });

  it('warns user if no aria-label is provided', () => {
    let spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<ProgressCircle value={25} />);
    expect(spyWarn).toHaveBeenCalledWith('ProgressCircle requires an aria-label or aria-labelledby attribute for accessibility');
  });

  it('supports custom DOM props', function () {
    let {getByTestId} = render(<ProgressCircle value={25} aria-label="Progress" data-testid="test" />);
    let progressBar = getByTestId('test');
    expect(progressBar).toBeInTheDocument();
  });
});
