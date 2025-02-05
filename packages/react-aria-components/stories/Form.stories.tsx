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
import {Button, FileTrigger, Form, Group, Input, Label, ListBox, ListBoxItem, Link, NumberField, Popover, Select, SelectValue, TextField} from 'react-aria-components';
import React from 'react';

export default {
  title: 'React Aria Components'
};


export const FormAutoFillExample = () => {
  return (
    <Form
      aria-label="Shipping information"
      onSubmit={e => {
        action('onSubmit')(Object.fromEntries(new FormData(e.target as HTMLFormElement).entries()));
        e.preventDefault();
    }}>
      <TextField>
        <Label>Address</Label>
        <Input name="streetAddress" type="text" id="streetAddress" autoComplete='shipping street-address'/>
      </TextField>
      <TextField>
        <Label>City</Label>
        <Input name="city" type="text" id="city" autoComplete='shipping address-level2'/>
      </TextField>
      <TextField>
        <Label>State</Label>
        <Input name="state" type="text" id="state" autoComplete='shipping address-level1'/>
      </TextField>
      <TextField>
        <Label>Zip</Label>
        <Input name="city" type="text" id="city" autoComplete='shipping postal-code'/>
      </TextField>
      <Select name="country" id="country" autoComplete='shipping country'>
        <Label>Country</Label>
        <Button>
          <SelectValue />
          <span aria-hidden="true">▼</span>
        </Button>
        <Popover>
          <ListBox>
            <ListBoxItem>Greece</ListBoxItem>
            <ListBoxItem>Italy</ListBoxItem>
            <ListBoxItem>Spain</ListBoxItem>
            <ListBoxItem>Mexico</ListBoxItem>
            <ListBoxItem>Canada</ListBoxItem>
            <ListBoxItem>United States</ListBoxItem>
          </ListBox>
        </Popover>
      </Select>
      <Button type="submit">Submit</Button>
    </Form>
  );
};

