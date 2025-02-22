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
import {ActionButton} from '@react-spectrum/button';
import {Calendar} from '../';
import {CalendarDate, CalendarDateTime, getLocalTimeZone, parseZonedDateTime, today, ZonedDateTime} from '@internationalized/date';
import {ComponentMeta, ComponentStoryObj} from '@storybook/react';
import {Custom454Calendar} from '@internationalized/date/tests/customCalendarImpl';
import {DateValue} from '@react-types/calendar';
import {Flex} from '@react-spectrum/layout';
import {Item, Picker, Section} from '@react-spectrum/picker';
import {Key} from '@react-types/shared';
import {Provider} from '@react-spectrum/provider';
import React, {useState} from 'react';
import {TimeField} from '@react-spectrum/datepicker';
import {useLocale} from '@react-aria/i18n';
import {View} from '@react-spectrum/view';

export type CalendarStory = ComponentStoryObj<typeof Calendar>;

export default {
  title: 'Date and Time/Calendar',
  component: Calendar,
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
    defaultFocusedValue: {
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
    'aria-label': {
      control: 'text'
    },
    errorMessage: {
      control: 'text'
    }
  }
} as ComponentMeta<typeof Calendar>;

export const Default: CalendarStory = {
  render: (args) => <Example {...args} />
};

export const DefaultValue: CalendarStory = {
  ...Default,
  args: {defaultValue: new CalendarDate(2019, 6, 5)}
};

export const ControlledValue: CalendarStory = {
  ...Default,
  args: {value: new CalendarDate(2019, 5, 5)}
};

export const WithTime: CalendarStory = {
  render: (args) => <CalendarWithTime {...args} />
};

export const ZonedTime: CalendarStory = {
  render: (args) => <CalendarWithZonedTime {...args} />,
  name: 'with zoned time'
};

export const OneWeek: CalendarStory = {
  ...Default,
  args: {minValue: today(getLocalTimeZone()), maxValue: today(getLocalTimeZone()).add({weeks: 1})},
  name: 'minValue: today, maxValue: 1 week from now'
};

export const DefaultMinMax: CalendarStory = {
  ...Default,
  args: {defaultValue: new CalendarDate(2019, 6, 10), minValue: new CalendarDate(2019, 6, 5), maxValue: new CalendarDate(2019, 6, 20)},
  name: 'defaultValue + minValue + maxValue'
};

export const DateUnavailable: CalendarStory = {
  render: (args) => (
    <Example
      {...args}
      defaultValue={today(getLocalTimeZone()).add({days: 1})}
      isDateUnavailable={(date: DateValue) => {
        const disabledIntervals = [[today(getLocalTimeZone()), today(getLocalTimeZone()).add({weeks: 1})], [today(getLocalTimeZone()).add({weeks: 2}), today(getLocalTimeZone()).add({weeks: 3})]];
        return disabledIntervals.some((interval) => date.compare(interval[0]) > 0 && date.compare(interval[1]) < 0);
      }} />
  ),
  name: 'isDateUnavailable'
};

export const MinValue: CalendarStory = {
  ...Default,
  args: {minValue: today(getLocalTimeZone())},
  name: 'minValue: today'
};

export const MinValueDefaultVal: CalendarStory = {
  ...Default,
  args: {minValue: today(getLocalTimeZone()), defaultValue: new CalendarDate(2019, 6, 5)},
  name: 'minValue: today, defaultValue'
};

export const DefaultFocusedValue: CalendarStory = {
  ...Default,
  args: {defaultFocusedValue: new CalendarDate(2019, 6, 5)},
  name: 'defaultFocusedValue'
};

export const FocusedValue: CalendarStory = {
  render: (args) => <ControlledFocus {...args} />,
  name: 'focusedValue'
};

export const Custom454Example : CalendarStory = {
  ...Default,
  name: 'Custom calendar',
  render: (args) => <CustomCalendar {...args} />
};

// https://github.com/unicode-org/cldr/blob/22af90ae3bb04263f651323ce3d9a71747a75ffb/common/supplemental/supplementalData.xml#L4649-L4664
const preferences = [
  {locale: '', label: 'Default', ordering: 'gregory'},
  {label: 'Arabic (Algeria)', locale: 'ar-DZ', territories: 'DJ DZ EH ER IQ JO KM LB LY MA MR OM PS SD SY TD TN YE', ordering: 'gregory islamic islamic-civil islamic-tbla'},
  {label: 'Arabic (United Arab Emirates)', locale: 'ar-AE', territories: 'AE BH KW QA', ordering: 'gregory islamic-umalqura islamic islamic-civil islamic-tbla'},
  {label: 'Arabic (Egypt)', locale: 'AR-EG', territories: 'EG', ordering: 'gregory coptic islamic islamic-civil islamic-tbla'},
  {label: 'Arabic (Saudi Arabia)', locale: 'ar-SA', territories: 'SA', ordering: 'islamic-umalqura gregory islamic islamic-rgsa'},
  {label: 'Farsi (Afghanistan)', locale: 'fa-AF', territories: 'AF IR', ordering: 'persian gregory islamic islamic-civil islamic-tbla'},
  // {territories: 'CN CX HK MO SG', ordering: 'gregory chinese'},
  {label: 'Amharic (Ethiopia)', locale: 'am-ET', territories: 'ET', ordering: 'gregory ethiopic ethioaa'},
  {label: 'Hebrew (Israel)', locale: 'he-IL', territories: 'IL', ordering: 'gregory hebrew islamic islamic-civil islamic-tbla'},
  {label: 'Hindi (India)', locale: 'hi-IN', territories: 'IN', ordering: 'gregory indian'},
  {label: 'Japanese (Japan)', locale: 'ja-JP', territories: 'JP', ordering: 'gregory japanese'},
  // {territories: 'KR', ordering: 'gregory dangi'},
  {label: 'Thai (Thailand)', locale: 'th-TH', territories: 'TH', ordering: 'buddhist gregory'},
  {label: 'Chinese (Taiwan)', locale: 'zh-TW', territories: 'TW', ordering: 'gregory roc chinese'}
];

const calendars = [
  {key: 'gregory', name: 'Gregorian'},
  {key: 'japanese', name: 'Japanese'},
  {key: 'buddhist', name: 'Buddhist'},
  {key: 'roc', name: 'Taiwan'},
  {key: 'persian', name: 'Persian'},
  {key: 'indian', name: 'Indian'},
  {key: 'islamic-umalqura', name: 'Islamic (Umm al-Qura)'},
  {key: 'islamic-civil', name: 'Islamic Civil'},
  {key: 'islamic-tbla', name: 'Islamic Tabular'},
  {key: 'hebrew', name: 'Hebrew'},
  {key: 'coptic', name: 'Coptic'},
  {key: 'ethiopic', name: 'Ethiopic'},
  {key: 'ethioaa', name: 'Ethiopic (Amete Alem)'}
];

function Example(props) {
  let [locale, setLocale] = React.useState('');
  let [calendar, setCalendar] = React.useState<Key>(calendars[0].key);
  let {locale: defaultLocale} = useLocale();

  let pref = preferences.find(p => p.locale === locale)!;
  let preferredCalendars = React.useMemo(() => pref ? pref.ordering.split(' ').map(p => calendars.find(c => c.key === p)).filter(Boolean) : [calendars[0]], [pref]);
  let otherCalendars = React.useMemo(() => calendars.filter(c => !preferredCalendars.some(p => p!.key === c.key)), [preferredCalendars]);

  let updateLocale = locale => {
    setLocale(locale);
    let pref = preferences.find(p => p.locale === locale);
    if (pref) {
      setCalendar(pref.ordering.split(' ')[0]);
    }
  };

  return (
    <Flex direction="column" gap="size-600" alignItems="center">
      <Flex direction="column" gap="size-150" wrap>
        <Picker label="Locale" items={preferences} selectedKey={locale} onSelectionChange={updateLocale}>
          {item => <Item key={item.locale}>{item.label}</Item>}
        </Picker>
        <Picker label="Calendar" selectedKey={calendar} onSelectionChange={setCalendar}>
          <Section title="Preferred" items={preferredCalendars}>
            {item => <Item>{item!.name}</Item>}
          </Section>
          <Section title="Other" items={otherCalendars}>
            {item => <Item>{item.name}</Item>}
          </Section>
        </Picker>
      </Flex>
      <Provider locale={(locale || defaultLocale) + (calendar && calendar !== preferredCalendars![0]!.key ? '-u-ca-' + calendar : '')}>
        <View maxWidth="100vw" padding="size-10" overflow="auto">
          <Calendar {...props} />
        </View>
      </Provider>
    </Flex>
  );
}

function CalendarWithTime(props) {
  let [value, setValue] = useState<CalendarDateTime | null>(new CalendarDateTime(2019, 6, 5, 8));
  let onChange = (v: CalendarDateTime | null) => {
    setValue(v);
    props?.onChange?.(v);
  };

  return (
    <Flex direction="column">
      <Calendar {...props} value={value} onChange={onChange} />
      <TimeField label="Time" value={value} onChange={onChange} />
    </Flex>
  );
}

function CalendarWithZonedTime(props) {
  let [value, setValue] = useState<ZonedDateTime | null>(parseZonedDateTime('2021-03-14T00:45-08:00[America/Los_Angeles]'));
  let onChange = (v: ZonedDateTime | null) => {
    setValue(v);
    props?.onChange?.(v);
  };

  return (
    <Flex direction="column">
      <Calendar {...props} value={value} onChange={onChange} />
      <TimeField label="Time" value={value} onChange={onChange} />
    </Flex>
  );
}

function ControlledFocus(props) {
  const defaultFocusedDate = props.focusedValue ?? new CalendarDate(2019, 6, 5);
  let [focusedDate, setFocusedDate] = useState(defaultFocusedDate);
  return (
    <Flex direction="column" alignItems="start" gap="size-200">
      <ActionButton onPress={() => setFocusedDate(defaultFocusedDate)}>Reset focused date</ActionButton>
      <Calendar {...props} focusedValue={focusedDate} onFocusChange={setFocusedDate} />
    </Flex>
  );
}

function CustomCalendar(props) { 
  return (
    <ControlledFocus {...props} createCalendar={() => new Custom454Calendar()} focusedValue={new CalendarDate(2023, 2, 5)} />
  );
}
