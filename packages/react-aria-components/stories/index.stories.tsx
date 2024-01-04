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

import {action} from '@storybook/addon-actions';
import {Button, Calendar, CalendarCell, CalendarGrid, Checkbox, DateField, DateInput, DatePicker, DateRangePicker, DateSegment, Dialog, DialogTrigger, DropZone, FileTrigger, Group, Header, Heading, Input, Keyboard, Label, Link, ListBox, ListBoxItem, ListBoxProps, Menu, MenuTrigger, Modal, ModalOverlay, NumberField, OverlayArrow, Popover, Radio, RadioGroup, RangeCalendar, SearchField, Section, Select, SelectValue, Separator, Slider, SliderOutput, SliderThumb, SliderTrack, Switch, Text, TextField, TimeField, ToggleButton, Toolbar, Tooltip, TooltipTrigger, useDragAndDrop} from 'react-aria-components';
import {classNames} from '@react-spectrum/utils';
import clsx from 'clsx';
import {FocusRing, mergeProps, useButton, useClipboard, useDrag} from 'react-aria';
import {MyListBoxItem, MyMenuItem} from './utils';
import React, {useRef} from 'react';
import styles from '../example/index.css';
import {useListData} from 'react-stately';

export default {
  title: 'React Aria Components'
};

export const ListBoxExample = (args) => (
  <ListBox className={styles.menu} {...args} aria-label="test listbox">
    <MyListBoxItem>Foo</MyListBoxItem>
    <MyListBoxItem>Bar</MyListBoxItem>
    <MyListBoxItem>Baz</MyListBoxItem>
    <MyListBoxItem href="http://google.com">Google</MyListBoxItem>
  </ListBox>
);

ListBoxExample.story = {
  args: {
    selectionMode: 'none',
    selectionBehavior: 'toggle'
  },
  argTypes: {
    selectionMode: {
      control: {
        type: 'radio',
        options: ['none', 'single', 'multiple']
      }
    },
    selectionBehavior: {
      control: {
        type: 'radio',
        options: ['toggle', 'replace']
      }
    }
  }
};

// Known accessibility false positive: https://github.com/adobe/react-spectrum/wiki/Known-accessibility-false-positives#listbox
// also has a aXe landmark error, not sure what it means
export const ListBoxSections = () => (
  <ListBox className={styles.menu} selectionMode="multiple" selectionBehavior="replace" aria-label="test listbox with section">
    <Section className={styles.group}>
      <Header style={{fontSize: '1.2em'}}>Section 1</Header>
      <MyListBoxItem>Foo</MyListBoxItem>
      <MyListBoxItem>Bar</MyListBoxItem>
      <MyListBoxItem>Baz</MyListBoxItem>
    </Section>
    <Separator style={{borderTop: '1px solid gray', margin: '2px 5px'}} />
    <Section className={styles.group}>
      <Header style={{fontSize: '1.2em'}}>Section 1</Header>
      <MyListBoxItem>Foo</MyListBoxItem>
      <MyListBoxItem>Bar</MyListBoxItem>
      <MyListBoxItem>Baz</MyListBoxItem>
    </Section>
  </ListBox>
);

export const ListBoxComplex = () => (
  <ListBox className={styles.menu} selectionMode="multiple" selectionBehavior="replace" aria-label="listbox complex">
    <MyListBoxItem>
      <Text slot="label">Item 1</Text>
      <Text slot="description">Description</Text>
    </MyListBoxItem>
    <MyListBoxItem>
      <Text slot="label">Item 2</Text>
      <Text slot="description">Description</Text>
    </MyListBoxItem>
    <MyListBoxItem>
      <Text slot="label">Item 3</Text>
      <Text slot="description">Description</Text>
    </MyListBoxItem>
  </ListBox>
);

export const MenuExample = () => (
  <MenuTrigger>
    <Button aria-label="Menu">☰</Button>
    <Popover>
      <Menu className={styles.menu} onAction={action('onAction')}>
        <Section className={styles.group}>
          <Header style={{fontSize: '1.2em'}}>Section 1</Header>
          <MyMenuItem>Foo</MyMenuItem>
          <MyMenuItem>Bar</MyMenuItem>
          <MyMenuItem>Baz</MyMenuItem>
          <MyMenuItem href="https://google.com">Google</MyMenuItem>
        </Section>
        <Separator style={{borderTop: '1px solid gray', margin: '2px 5px'}} />
        <Section className={styles.group}>
          <Header style={{fontSize: '1.2em'}}>Section 2</Header>
          <MyMenuItem>Foo</MyMenuItem>
          <MyMenuItem>Bar</MyMenuItem>
          <MyMenuItem>Baz</MyMenuItem>
        </Section>
      </Menu>
    </Popover>
  </MenuTrigger>
);

export const MenuComplex = () => (
  <MenuTrigger>
    <Button aria-label="Menu">☰</Button>
    <Popover>
      <Menu className={styles.menu}>
        <MyMenuItem>
          <Text slot="label">Copy</Text>
          <Text slot="description">Description</Text>
          <Keyboard>⌘C</Keyboard>
        </MyMenuItem>
        <MyMenuItem>
          <Text slot="label">Cut</Text>
          <Text slot="description">Description</Text>
          <Keyboard>⌘X</Keyboard>
        </MyMenuItem>
        <MyMenuItem>
          <Text slot="label">Paste</Text>
          <Text slot="description">Description</Text>
          <Keyboard>⌘V</Keyboard>
        </MyMenuItem>
      </Menu>
    </Popover>
  </MenuTrigger>
);

export const NumberFieldExample = () => (
  <NumberField data-testid="number-field-example" formatOptions={{style: 'currency', currency: 'USD'}}>
    <Label>Test</Label>
    <Group style={{display: 'flex'}}>
      <Button slot="decrement">-</Button>
      <Input />
      <Button slot="increment">+</Button>
    </Group>
  </NumberField>
);

export const DateFieldExample = () => (
  <DateField data-testid="date-field-example">
    <Label style={{display: 'block'}}>Date</Label>
    <DateInput className={styles.field} data-testid2="date-input">
      {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
    </DateInput>
  </DateField>
);

export const TimeFieldExample = () => (
  <TimeField data-testid="time-field-example">
    <Label style={{display: 'block'}}>Time</Label>
    <DateInput className={styles.field}>
      {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
    </DateInput>
  </TimeField>
);

export const CalendarExample = () => (
  <Calendar style={{width: 220}}>
    <div style={{display: 'flex', alignItems: 'center'}}>
      <Button slot="previous">&lt;</Button>
      <Heading style={{flex: 1, textAlign: 'center'}} />
      <Button slot="next">&gt;</Button>
    </div>
    <CalendarGrid style={{width: '100%'}}>
      {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
    </CalendarGrid>
  </Calendar>
);

export const CalendarMultiMonth = () => (
  <Calendar style={{width: 500}} visibleDuration={{months: 2}}>
    <div style={{display: 'flex', alignItems: 'center'}}>
      <Button slot="previous">&lt;</Button>
      <Heading style={{flex: 1, textAlign: 'center'}} />
      <Button slot="next">&gt;</Button>
    </div>
    <div style={{display: 'flex', gap: 20}}>
      <CalendarGrid style={{flex: 1}}>
        {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
      </CalendarGrid>
      <CalendarGrid style={{flex: 1}} offset={{months: 1}}>
        {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
      </CalendarGrid>
    </div>
  </Calendar>
);

export const RangeCalendarExample = () => (
  <RangeCalendar style={{width: 220}}>
    <div style={{display: 'flex', alignItems: 'center'}}>
      <Button slot="previous">&lt;</Button>
      <Heading style={{flex: 1, textAlign: 'center'}} />
      <Button slot="next">&gt;</Button>
    </div>
    <CalendarGrid style={{width: '100%'}}>
      {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
    </CalendarGrid>
  </RangeCalendar>
);

export const DatePickerExample = () => (
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
        <Calendar style={{width: 220}}>
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

export const DateRangePickerExample = () => (
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
        <RangeCalendar style={{width: 220}}>
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

export const SliderExample = () => (
  <Slider
    data-testid="slider-example"
    defaultValue={[30, 60]}
    style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 300
    }}>
    <div style={{display: 'flex', alignSelf: 'stretch'}}>
      <Label>Test</Label>
      <SliderOutput style={{flex: '1 0 auto', textAlign: 'end'}}>
        {({state}) => `${state.getThumbValueLabel(0)} - ${state.getThumbValueLabel(1)}`}
      </SliderOutput>
    </div>
    <SliderTrack
      style={{
        position: 'relative',
        height: 30,
        width: '100%'
      }}>
      <div
        style={{
          position: 'absolute',
          backgroundColor: 'gray',
          height: 3,
          top: 13,
          width: '100%'
        }} />
      <CustomThumb index={0}>
        <Label>A</Label>
      </CustomThumb>
      <CustomThumb index={1}>
        <Label>B</Label>
      </CustomThumb>
    </SliderTrack>
  </Slider>
);

export const SliderCSS = (props) => (
  <Slider {...props} defaultValue={30} className={styles.slider}>
    <div className={styles.label}>
      <Label>Test</Label>
      <SliderOutput />
    </div>
    <SliderTrack className={styles.track}>
      <SliderThumb className={styles.thumb} />
    </SliderTrack>
  </Slider>
);

SliderCSS.args = {
  orientation: 'horizontal',
  isDisabled: false,
  minValue: 0,
  maxValue: 100,
  step: 1
};

SliderCSS.argTypes = {
  orientation: {
    control: {
      type: 'inline-radio',
      options: ['horizontal', 'vertical']
    }
  }
};

export const TooltipExample = () => (
  <TooltipTrigger>
    <Button>Tooltip trigger</Button>
    <Tooltip
      offset={5}
      style={{
        background: 'Canvas',
        color: 'CanvasText',
        border: '1px solid gray',
        padding: 5,
        borderRadius: 4
      }}>
      <OverlayArrow style={{transform: 'translateX(-50%)'}}>
        <svg width="8" height="8" style={{display: 'block'}}>
          <path d="M0 0,L4 4,L8 0" fill="white" strokeWidth={1} stroke="gray" />
        </svg>
      </OverlayArrow>
      I am a tooltip
    </Tooltip>
  </TooltipTrigger>
);

export const ModalExample = () => (
  <DialogTrigger>
    <Button>Open modal</Button>
    <ModalOverlay
      style={{
        position: 'fixed',
        zIndex: 100,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <Modal
        style={{
          background: 'Canvas',
          color: 'CanvasText',
          border: '1px solid gray',
          padding: 30
        }}>
        <Dialog>
          {({close}) => (
            <form style={{display: 'flex', flexDirection: 'column'}}>
              <Heading slot="title" style={{marginTop: 0}}>Sign up</Heading>
              <label>
                First Name: <input placeholder="John" />
              </label>
              <label>
                Last Name: <input placeholder="Smith" />
              </label>
              <Button onPress={close} style={{marginTop: 10}}>
                Submit
              </Button>
            </form>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  </DialogTrigger>
);

function CustomThumb({index, children}) {
  return (
    <SliderThumb
      index={index}
      style={({isDragging, isFocusVisible}) => ({
        width: 20,
        height: 20,
        borderRadius: '50%',
        top: '50%',
        // eslint-disable-next-line
        backgroundColor: isFocusVisible ? 'orange' : isDragging
          ? 'dimgrey'
          : 'gray'
      })}>
      {children}
    </SliderThumb>
  );
}

function Draggable() {
  let buttonRef = useRef(null);
  let {dragProps, isDragging} = useDrag({
    getItems() {
      return [{
        'text/plain': 'hello world'}];
    }
  });
  let {buttonProps} = useButton({elementType: 'div'}, buttonRef);

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...mergeProps(buttonProps, dragProps)}
        ref={buttonRef}
        className={classNames(styles, 'draggable', {['dragging']: isDragging})}>
        Drag me
      </div>
    </FocusRing>
  );
}

function Copyable() {
  let {clipboardProps} = useClipboard({
    getItems() {
      return [{
        'text/plain': 'hello world'
      }];
    }
  });

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...clipboardProps}
        role="textbox"
        aria-label="copyable element"
        tabIndex={0}
        className={styles.copyable}>
        Copy me
      </div>
    </FocusRing>
  );
}

export const DropzoneExampleWithFileTriggerLink = (props) => (
  <div>
    <DropZone
      {...props}
      aria-label={'testing aria-label'}
      className={styles.dropzone}
      data-testid="drop-zone-example-with-file-trigger-link"
      onDrop={action('OnDrop')}
      onDropEnter={action('OnDropEnter')}
      onDropExit={action('OnDropExit')}>
      <FileTrigger onSelect={action('onSelect')}>
        <Link>Upload</Link>
      </FileTrigger>
    </DropZone>
  </div>
);

export const DropzoneExampleWithFileTriggerButton = (props) => (
  <div>
    <DropZone
      {...props}
      className={styles.dropzone}
      onDrop={action('OnDrop')}
      onDropEnter={action('OnDropEnter')}
      onDropExit={action('OnDropExit')}>
      <FileTrigger onSelect={action('onSelect')} >
        <Button>Upload</Button>
      </FileTrigger>
    </DropZone>
  </div>
);

export const DropzoneExampleWithDraggableAndFileTrigger = (props) => (
  <div>
    <Draggable />
    <DropZone
      {...props}
      className={styles.dropzone}
      onDrop={action('OnDrop')}
      onDropEnter={action('OnDropEnter')}
      onDropExit={action('OnDropExit')}>
      <FileTrigger onSelect={action('onSelect')} >
        <Button>Browse</Button>
      </FileTrigger>
      Or drag into here
    </DropZone>
  </div>
);

export const DropZoneOnlyAcceptPNGWithFileTrigger = (props) => (
  <div>
    <DropZone
      {...props}
      getDropOperation={(types) =>  types.has('image/png') ? 'copy' : 'cancel'}
      className={styles.dropzone}
      onPress={action('OnPress')}
      onDrop={action('OnDrop')}
      onDropEnter={action('OnDropEnter')}
      onDropExit={action('OnDropExit')} >
      <FileTrigger onSelect={action('onSelect')} acceptedFileTypes={['image/png']}>
        <Button>Upload</Button>
      </FileTrigger>
    </DropZone>
  </div>
);

export const DropZoneWithCaptureMobileOnly = (props) => (
  <div>
    <DropZone
      {...props}
      getDropOperation={(types) =>  types.has('image/png') ? 'copy' : 'cancel'}
      className={styles.dropzone}
      onPress={action('OnPress')}
      onDrop={action('OnDrop')}
      onDropEnter={action('OnDropEnter')}
      onDropExit={action('OnDropExit')} >
      <FileTrigger onSelect={action('onSelect')} defaultCamera="environment">
        <Button>Upload</Button>
      </FileTrigger>
    </DropZone>
  </div>
);

export const DropzoneExampleWithDraggableObject = (props) => (
  <div>
    <Draggable />
    <DropZone
      {...props}
      className={styles.dropzone}
      onDrop={action('OnDrop')}
      onDropEnter={action('OnDropEnter')}
      onDropExit={action('OnDropExit')} >
      <Text slot="label">
        DropZone Area
      </Text>
    </DropZone>
  </div>
);

export const DropzoneExampleWithCopyableObject = (props) => (
  <div>
    <Copyable />
    <DropZone
      {...props}
      className={styles.dropzone}
      onDrop={action('OnDrop')}
      onDropEnter={action('OnDropEnter')}
      onDropExit={action('OnDropExit')}>
      <Text slot="label">
        DropZone Area
      </Text>
    </DropZone>
  </div>
);

export const DropzoneWithRenderProps = (props) => (
  <div>
    <Draggable />
    <Copyable />
    <DropZone
      {...props}
      className={styles.dropzone}
      onPress={action('OnPress')}
      onDrop={action('OnDrop')}
      onDropEnter={action('OnDropEnter')}
      onDropExit={action('OnDropExit')}>
      {({isHovered, isFocused, isFocusVisible, isDropTarget}) => (
        <div>
          <Text slot="label">
            DropzoneArea
          </Text>
          <div>isHovered: {isHovered ? 'true' : 'false'}</div>
          <div>isFocused: {isFocused ? 'true' : 'false'}</div>
          <div>isFocusVisible: {isFocusVisible ? 'true' : 'false'}</div>
          <div>isDropTarget: {isDropTarget ? 'true' : 'false'}</div>
        </div>
      )}
    </DropZone>
  </div>
);

export const FileTriggerButton = (props) => (
  <FileTrigger
    onSelect={action('onSelect')}
    data-testid="filetrigger-example"
    {...props} >
    <Button>Upload</Button>
  </FileTrigger>
);

export const FileTriggerDirectories = (props) => {
  let [files, setFiles] = React.useState<string[]>([]);

  return (
    <>
      <FileTrigger
        {...props}
        acceptDirectory
        onSelect={(e) => {
          if (e) {
            let fileList = [...e].map(file => file.webkitRelativePath !== '' ? file.webkitRelativePath : file.name);
            setFiles(fileList);
          }
        }} >
        <Button>Upload</Button>
      </FileTrigger>
      {files && <ul>
        {files.map((file, index) => (
          <li key={index}>{file}</li>
        ))}
      </ul>}
    </>
  );
};

export const FileTriggerLinkAllowsMultiple = (props) => (
  <FileTrigger
    {...props}
    onSelect={action('onSelect')}
    allowsMultiple >
    <Link>Select a file</Link>
  </FileTrigger>
);

let albums = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1593958812614-2db6a598c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZGlzY298ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=900&q=60',
    title: 'Euphoric Echoes',
    artist: 'Luna Solstice'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bmVvbnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=900&q=60',
    title: 'Neon Dreamscape',
    artist: 'Electra Skyline'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHNwYWNlfGVufDB8fDB8fHww&auto=format&fit=crop&w=900&q=60',
    title: 'Cosmic Serenade',
    artist: 'Orion\'s Symphony'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bXVzaWN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=900&q=60',
    title: 'Melancholy Melodies',
    artist: 'Violet Mistral'
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1608433319511-dfe8ea4cbd3c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGJlYXR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=900&q=60',
    title: 'Rhythmic Illusions',
    artist: 'Mirage Beats'
  }
];

export const ListBoxDnd = (props: ListBoxProps<typeof albums[0]>) => {
  let list = useListData({
    initialItems: albums
  });

  let {dragAndDropHooks} = useDragAndDrop({
    getItems: (keys) => [...keys].map(key => ({'text/plain': list.getItem(key).title})),
    onReorder(e) {
      if (e.target.dropPosition === 'before') {
        list.moveBefore(e.target.key, e.keys);
      } else if (e.target.dropPosition === 'after') {
        list.moveAfter(e.target.key, e.keys);
      }
    }
  });

  return (
    <ListBox
      {...props}
      aria-label="Albums"
      items={list.items}
      selectionMode="multiple"
      dragAndDropHooks={dragAndDropHooks}>
      {item => (
        <ListBoxItem>
          <img src={item.image} alt="" />
          <Text slot="label">{item.title}</Text>
          <Text slot="description">{item.artist}</Text>
        </ListBoxItem>
      )}
    </ListBox>
  );
};

ListBoxDnd.story = {
  args: {
    layout: 'stack',
    orientation: 'horizontal'
  },
  argTypes: {
    layout: {
      control: 'radio',
      options: ['stack', 'grid']
    },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical']
    }
  }
};

export const RadioGroupExample = () => {
  return (
    <RadioGroup
      data-testid="radio-group-example"
      className={styles.radiogroup}>
      <Label>Favorite pet</Label>
      <Radio className={styles.radio} value="dogs" data-testid="radio-dog">Dog</Radio>
      <Radio className={styles.radio} value="cats">Cat</Radio>
      <Radio className={styles.radio} value="dragon">Dragon</Radio>
    </RadioGroup>
  );
};

export const RadioGroupInDialogExample = () => {
  return (
    <DialogTrigger>
      <Button>Open dialog</Button>
      <ModalOverlay
        style={{
          position: 'fixed',
          zIndex: 100,
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <Modal
          style={{
            background: 'Canvas',
            color: 'CanvasText',
            border: '1px solid gray',
            padding: 30
          }}>
          <Dialog
            style={{
              outline: '2px solid transparent',
              outlineOffset: '2px',
              position: 'relative'
            }}>
            {({close}) => (
              <>
                <div>
                  <RadioGroupExample />
                </div>
                <div>
                  <Button onPress={close} style={{marginTop: 10}}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};

export const SearchFieldExample = () => {
  return (
    <SearchField className={classNames(styles, 'searchFieldExample')} data-testid="search-field-example">
      <Label>Search</Label>
      <Input />
      <Button>✕</Button>
    </SearchField>
  );
};

export const ButtonExample = () => {
  return (
    <Button data-testid="button-example" onPress={() => alert('Hello world!')}>Press me</Button>
  );
};

export const ToggleButtonExample = () => {
  return (
    <ToggleButton className={classNames(styles, 'toggleButtonExample')} data-testid="toggle-button-example">Toggle</ToggleButton>
  );
};

export const SwitchExample = () => {
  return (
    <Switch className={classNames(styles, 'switchExample')} data-testid="switch-example">
      <div className={classNames(styles, 'switchExample-indicator')} />
      Switch me
    </Switch>
  );
};

export const TextfieldExample = () => {
  return (
    <TextField data-testid="textfield-example">
      <Label>First name</Label>
      <Input />
    </TextField>
  );
};

export const LinkExample = () => {
  return (
    <Link data-testid="link-example"href="https://www.imdb.com/title/tt6348138/" target="_blank">
      The missing link
    </Link>
  );
};

export const ToolbarExample = (props) => {
  return (
    <div>
      <label htmlFor="before">Input Before Toolbar</label>
      <input id="before" type="text" />
      <Toolbar {...props}>
        <div role="group" aria-label="Text style">
          <ToggleButton className={classNames(styles, 'toggleButtonExample')}><strong>B</strong></ToggleButton>
          <ToggleButton className={classNames(styles, 'toggleButtonExample')}><div style={{textDecoration: 'underline'}}>U</div></ToggleButton>
          <ToggleButton className={classNames(styles, 'toggleButtonExample')}><i>I</i></ToggleButton>
        </div>
        <Checkbox>
          <div className="checkbox">
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <polyline points="1 9 7 14 15 4" />
            </svg>
          </div>
          Night Mode
        </Checkbox>
        <Link href="https://google.com">Help</Link>
      </Toolbar>
      <label htmlFor="after">Input After Toolbar</label>
      <input id="after" type="text" />
    </div>
  );
};

ToolbarExample.args = {
  orientation: 'horizontal'
};
ToolbarExample.argTypes = {
  orientation: {
    control: 'radio',
    options: ['horizontal', 'vertical']
  }
};
