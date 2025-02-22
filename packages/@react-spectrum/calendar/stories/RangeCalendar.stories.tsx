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

import {action} from '@storybook/addon-actions';
import {CalendarDate, CalendarDateTime, getLocalTimeZone, isWeekend, parseZonedDateTime, today} from '@internationalized/date';
import {ComponentMeta, ComponentStoryObj} from '@storybook/react';
import {Custom454Calendar} from '@internationalized/date/tests/customCalendarImpl';
import {DateValue} from '@react-types/calendar';
import {Flex} from '@react-spectrum/layout';
import {RangeCalendar} from '../';
import React, {useState} from 'react';
import {TimeField} from '@react-spectrum/datepicker';
import {useLocale} from '@react-aria/i18n';
import {View} from '@react-spectrum/view';

export type RangeCalendarStory = ComponentStoryObj<typeof RangeCalendar>;

export default {
  title: 'Date and Time/RangeCalendar',
  component: RangeCalendar,
  args: {
    onChange: action('onChange')
  },
  argTypes: {
    onChange: {
      table: {
        disable: true
      }
    },
    defaultValue: {
      table: {
        disable: true
      }
    },
    minValue: {
      table: {
        disable: true
      }
    },
    value: {
      table: {
        disable: true
      }
    },
    maxValue: {
      table: {
        disable: true
      }
    },
    isDisabled: {
      control: 'boolean'
    },
    isReadOnly: {
      control: 'boolean'
    },
    allowsNonContiguousRanges: {
      control: 'boolean'
    },
    autoFocus: {
      control: 'boolean'
    },
    visibleMonths: {
      control: 'number'
    },
    pageBehavior: {
      control: 'select',
      options: [null, 'single', 'visible']
    },
    firstDayOfWeek: {
      control: 'select',
      options: [undefined, 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    },
    isInvalid: {
      control: 'boolean'
    },
    errorMessage: {
      control: 'text'
    }
  }
} as ComponentMeta<typeof RangeCalendar>;

export const Default: RangeCalendarStory = {
  render: (args) => render(args)
};

export const DefaultValue: RangeCalendarStory = {
  ...Default,
  args: {defaultValue: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}
};

export const ControlledValue: RangeCalendarStory = {
  ...Default,
  args: {value: {start: new CalendarDate(2019, 6, 5), end: new CalendarDate(2019, 6, 10)}}
};

export const WithTime: RangeCalendarStory = {
  render: (args) => <RangeCalendarWithTime {...args} />
};

export const ZonedTime: RangeCalendarStory = {
  render: (args) => <RangeCalendarWithZonedTime {...args} />,
  name: 'with zoned time'
};

export const OneWeek: RangeCalendarStory = {
  ...Default,
  args: {minValue: today(getLocalTimeZone()), maxValue: today(getLocalTimeZone()).add({weeks: 1})},
  name: 'minValue: today, maxValue: 1 week from now'
};

export const DefaultMinMax: RangeCalendarStory = {
  ...Default,
  args: {defaultValue: {start: new CalendarDate(2019, 6, 10), end: new CalendarDate(2019, 6, 12)}, minValue: new CalendarDate(2019, 6, 5), maxValue: new CalendarDate(2019, 6, 20)},
  name: 'defaultValue + minValue + maxValue'
};

export const DateUnavailable: RangeCalendarStory = {
  ...Default,
  args: {isDateUnavailable: (date: DateValue) => {
    const disabledIntervals = [[today(getLocalTimeZone()), today(getLocalTimeZone()).add({weeks: 1})], [today(getLocalTimeZone()).add({weeks: 2}), today(getLocalTimeZone()).add({weeks: 3})]];
    return disabledIntervals.some((interval) => date.compare(interval[0]) > 0 && date.compare(interval[1]) < 0);
  }},
  name: 'isDateUnavailable'
};

export const MinValue: RangeCalendarStory = {
  ...Default,
  args: {minValue: today(getLocalTimeZone())},
  name: 'minValue: today'
};

export const DefaultValVisibleMonths: RangeCalendarStory = {
  ...Default,
  args: {visibleMonths: 3, defaultValue: {start: new CalendarDate(2021, 10, 5), end: new CalendarDate(2021, 12, 10)}},
  name: 'defaultValue, visibleMonths: 3'
};

export const DateUnavailableInvalid: RangeCalendarStory = {
  render: (args) => <DateUnavailableAndInvalid {...args} />,
  name: 'isDateUnavailable, invalid'
};

export const Custom454Story: RangeCalendarStory = {
  ...Default,
  name: 'Custom calendar',
  render: (args) => <Custom454RangedCalendar {...args} />
};

function render(props) {
  return (
    <View maxWidth="100vw" overflow="auto">
      <RangeCalendar {...props} />
    </View>
  );
}

function RangeCalendarWithTime(props) {
  let [value, setValue] = useState({start: new CalendarDateTime(2019, 6, 5, 8), end: new CalendarDateTime(2019, 6, 10, 12)});
  let onChange = (v) => {
    setValue(v);
    props?.onChange?.(v);
  };

  return (
    <Flex direction="column">
      <RangeCalendar {...props} value={value} onChange={onChange} />
      <Flex gap="size-100">
        <TimeField label="Start time" value={value.start} onChange={v => onChange({...value, start: v})} />
        <TimeField label="End time" value={value.end} onChange={v => onChange({...value, end: v})} />
      </Flex>
    </Flex>
  );
}

function RangeCalendarWithZonedTime(props) {
  let [value, setValue] = useState({start: parseZonedDateTime('2021-03-10T00:45-05:00[America/New_York]'), end: parseZonedDateTime('2021-03-26T18:05-07:00[America/Los_Angeles]')});
  let onChange = (v) => {
    setValue(v);
    props?.onChange?.(v);
  };

  return (
    <Flex direction="column">
      <RangeCalendar {...props} value={value} onChange={onChange} />
      <Flex gap="size-100">
        <TimeField label="Start time" value={value.start} onChange={v => onChange({...value, start: v})} />
        <TimeField label="End time" value={value.end} onChange={v => onChange({...value, end: v})} />
      </Flex>
    </Flex>
  );
}

function DateUnavailableAndInvalid(props) {
  let {locale} = useLocale();
  return (
    render({...props, isDateUnavailable: (date: DateValue) => isWeekend(date, locale), allowsNonContiguousRanges: true, defaultValue: {start: new CalendarDate(2021, 10, 3), end: new CalendarDate(2021, 10, 16)}})
  );
}

function Custom454RangedCalendar(props) {
  return render({...props, createCalendar: () => new Custom454Calendar(), visibleMonths: 3, defaultValue: {start: new CalendarDate(2023, 8, 6), end: new CalendarDate(2023, 10, 7)}});
}
