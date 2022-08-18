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

import {CalendarDate, CalendarDateTime, Time, ZonedDateTime} from '@internationalized/date';
import React from 'react';
import {render, within} from '@react-spectrum/test-utils';
import {StaticField} from '../src';

describe('StaticField', function () {
  it('renders a label', function () {
    let {getByText} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value="test" />
    );

    let labelText = getByText('Field label');
    expect(labelText).toBeTruthy();
  });

  it('renders correctly with string value', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value="test" />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('test');
  });

  it('renders correctly with string array value', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={['wow', 'cool', 'awesome']} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('wow, cool, and awesome');
  });

  it('renders correctly with CalendarDate value', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={new CalendarDate(2019, 6, 5)} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('6/5/2019');
  });

  it('renders correctly with CalendarDate value with user provided format options', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={new CalendarDate(2019, 6, 5)}
        formatOptions={{dateStyle: 'long'}} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('June 5, 2019');
  });
  

  it('renders correctly with CalendarDateTime value', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={new CalendarDateTime(2020, 2, 3, 12, 23, 24, 120)} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('2/3/2020');
  });

  it('renders correctly with CalendarDateTime value with user provided format options', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={new CalendarDateTime(2020, 2, 3, 12, 23, 24, 120)}
        formatOptions={{dateStyle: 'medium', timeStyle: 'medium'}} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('Feb 3, 2020, 12:23:24 PM');
  });

  it('renders correctly with ZonedDateTime value', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000)} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('2/3/2020');
  });

  it('renders correctly with ZonedDateTime value with user provided format options', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={new ZonedDateTime(2020, 3, 3, 'America/Los_Angeles', -28800000)}
        formatOptions={{dateStyle: 'full', timeStyle: 'short'}} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('Tuesday, March 3, 2020 at 3:00 AM');
  });

  it('renders correctly with Date value', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={new Date(2000, 5, 5)} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('6/5/2000');
  });

  it('renders correctly with Date value with user provided format options', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={new Date(2000, 5, 5)} 
        formatOptions={{dateStyle: 'full'}} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('Monday, June 5, 2000');
  });

  it('renders correctly with Time value', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={new Time(9, 45)} 
        formatOptions={{timeStyle: 'short'}} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('9:45 AM');
  });

  it('renders correctly with RangeValue<Date>', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={{start: new Date(2019, 6, 5), end: new Date(2019, 6, 10)}} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('7/5/2019 – 7/10/2019');
  });

  it('renders correctly with RangeValue<Time>', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={{start: new Time(9, 45), end: new Time(10, 45)}} 
        formatOptions={{timeStyle: 'short'}} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('9:45 – 10:45 AM');
  });

  it('renders correctly with RangeValue<ZonedDateTime>', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={{start: new ZonedDateTime(2020, 2, 3, 'America/Los_Angeles', -28800000), end: new ZonedDateTime(2020, 3, 3, 'America/Los_Angeles', -28800000)}} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('2/3/2020 – 3/3/2020');
  });

  it('renders correctly with RangeValue<CalendarDateTime>', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={{start: new CalendarDateTime(2020, 2, 3, 12, 23, 24, 120), end: new CalendarDateTime(2020, 3, 3, 12, 23, 24, 120)}} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('2/3/2020 – 3/3/2020');
  });

  it('renders correctly with RangeValue<CalendarDate>', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={{start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 7, 5)}} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('6/5/2019 – 7/5/2019');
  });

  it('renders correctly with number value', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={10} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('10');
    
  });

  it('renders correctly with RangeValue<NumberValue>', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        value={{start: 10, end: 20}} />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('10 – 20');
  });

  it('attaches a user provided ref to the outer div', function () {
    let ref = React.createRef();
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        ref={ref}
        value="test" />
    );

    let staticField = getByTestId('test-id');
    expect(ref.current).toBe(staticField);
  });

  it('attaches a user provided ref to the outer div with a label', function () {
    let ref = React.createRef();
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        ref={ref}
        value="test" />
    );

    let staticField = getByTestId('test-id');
    expect(ref.current).toBe(staticField);
    expect(within(ref.current).getByText('Field label')).toBeInTheDocument();
  });

  it('labelPosition: side supports a ref', function () {
    let ref = React.createRef();
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        label="Field label"
        labelPosition="side"
        ref={ref}
        value="test" />
    );

    let staticField = getByTestId('test-id');
    expect(ref.current).toBe(staticField);
    expect(within(ref.current).getByText('Field label')).toBeInTheDocument();
  });

  it('renders when no visible label is provided', function () {
    let {getByTestId} = render(
      <StaticField
        data-testid="test-id"
        value="test" />
    );

    let staticField = getByTestId('test-id');
    expect(staticField).toBeInTheDocument();
    expect(staticField).toHaveTextContent('test');
  });
});
