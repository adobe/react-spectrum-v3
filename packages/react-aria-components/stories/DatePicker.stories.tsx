/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Button, Calendar, CalendarCell, CalendarGrid, DateInput, DatePicker, DateRangePicker, DateSegment, Dialog, Group, Heading, Label, Popover, RangeCalendar} from 'react-aria-components';
import clsx from 'clsx';
import React from 'react';
import styles from '../example/index.css';

export default {
  title: 'React Aria Components',
  argTypes: {
    isFixedWeeks: {control: 'boolean'}
  }
};

export const DatePickerExample = (args) => (
  <DatePicker data-testid="date-picker-example">
    <Label style={{display: 'block'}}>Date</Label>
    <Group style={{display: 'inline-flex'}}>
      <DateInput className={styles.field}>
        {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
      </DateInput>
      <Button>🗓</Button>
    </Group>
    <Popover
      placement="bottom start"
      style={{
        background: 'Canvas',
        color: 'CanvasText',
        border: '1px solid gray',
        padding: 20
      }}>
      <Dialog>
        <Calendar style={{width: 220}} isFixedWeeks={args.isFixedWeeks}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Button slot="previous">&lt;</Button>
            <Heading style={{flex: 1, textAlign: 'center'}} />
            <Button slot="next">&gt;</Button>
          </div>
          <CalendarGrid style={{width: '100%'}}>
            {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth && !args.isFixedWeeks ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
          </CalendarGrid>
        </Calendar>
      </Dialog>
    </Popover>
  </DatePicker>
);

DatePickerExample.args = {
  isFixedWeeks: false
};

export const DatePickerTriggerWidthExample = () => (
  <DatePicker data-testid="date-picker-example">
    <Label style={{display: 'block'}}>Date</Label>
    <Group style={{display: 'inline-flex', width: 300}}>
      <DateInput className={styles.field} style={{flex: 1}}>
        {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
      </DateInput>
      <Button>🗓</Button>
    </Group>
    <Popover
      placement="bottom start"
      style={{
        background: 'Canvas',
        color: 'CanvasText',
        border: '1px solid gray',
        padding: 20,
        boxSizing: 'border-box',
        width: 'var(--trigger-width)'
      }}>
      <Dialog>
        <Calendar>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Button slot="previous">&lt;</Button>
            <Heading style={{flex: 1, textAlign: 'center'}} />
            <Button slot="next">&gt;</Button>
          </div>
          <CalendarGrid style={{width: '100%'}}>
            {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
          </CalendarGrid>
        </Calendar>
      </Dialog>
    </Popover>
  </DatePicker>
);

export const DateRangePickerExample = (args) => (
  <DateRangePicker data-testid="date-range-picker-example">
    <Label style={{display: 'block'}}>Date</Label>
    <Group style={{display: 'inline-flex'}}>
      <div className={styles.field}>
        <DateInput data-testid="date-range-picker-date-input" slot="start" style={{display: 'inline-flex'}}>
          {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
        </DateInput>
        <span aria-hidden="true" style={{padding: '0 4px'}}>–</span>
        <DateInput slot="end" style={{display: 'inline-flex'}}>
          {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
        </DateInput>
      </div>
      <Button>🗓</Button>
    </Group>
    <Popover
      placement="bottom start"
      style={{
        background: 'Canvas',
        color: 'CanvasText',
        border: '1px solid gray',
        padding: 20
      }}>
      <Dialog>
        <RangeCalendar style={{width: 220}} isFixedWeeks={args.isFixedWeeks}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Button slot="previous">&lt;</Button>
            <Heading style={{flex: 1, textAlign: 'center'}} />
            <Button slot="next">&gt;</Button>
          </div>
          <CalendarGrid style={{width: '100%'}}>
            {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth && !args.isFixedWeeks ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
          </CalendarGrid>
        </RangeCalendar>
      </Dialog>
    </Popover>
  </DateRangePicker>
);

DateRangePickerExample.args = {
  isFixedWeeks: false
};

export const DateRangePickerTriggerWidthExample = () => (
  <DateRangePicker data-testid="date-range-picker-example">
    <Label style={{display: 'block'}}>Date</Label>
    <Group style={{display: 'inline-flex', width: 300}}>
      <div className={styles.field} style={{flex: 1}}>
        <DateInput data-testid="date-range-picker-date-input" slot="start" style={{display: 'inline-flex'}}>
          {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
        </DateInput>
        <span aria-hidden="true" style={{padding: '0 4px'}}>–</span>
        <DateInput slot="end" style={{display: 'inline-flex'}}>
          {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
        </DateInput>
      </div>
      <Button>🗓</Button>
    </Group>
    <Popover
      placement="bottom start"
      style={{
        background: 'Canvas',
        color: 'CanvasText',
        border: '1px solid gray',
        padding: 20,
        boxSizing: 'border-box',
        width: 'var(--trigger-width)'
      }}>
      <Dialog>
        <RangeCalendar>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Button slot="previous">&lt;</Button>
            <Heading style={{flex: 1, textAlign: 'center'}} />
            <Button slot="next">&gt;</Button>
          </div>
          <CalendarGrid style={{width: '100%'}}>
            {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
          </CalendarGrid>
        </RangeCalendar>
      </Dialog>
    </Popover>
  </DateRangePicker>
);
