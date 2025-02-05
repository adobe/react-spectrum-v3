/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {ActionButton, Avatar, Button, Card, CardPreview, Content, DialogTrigger, Divider, Form, Image, Menu, MenuItem, MenuSection, Popover, SearchField, SubmenuTrigger, Switch, Tab, TabList, TabPanel, Tabs, Text, TextField} from '../src';
import Cloud from '../s2wf-icons/S2_Icon_Cloud_20_N.svg';
import Education from '../s2wf-icons/S2_Icon_Education_20_N.svg';
import File from '../s2wf-icons/S2_Icon_File_20_N.svg';
import Help from '../s2wf-icons/S2_Icon_HelpCircle_20_N.svg';
import Lightbulb from '../s2wf-icons/S2_Icon_Lightbulb_20_N.svg';
import type {Meta} from '@storybook/react';
import Org from '../s2wf-icons/S2_Icon_Buildings_20_N.svg';
import Settings from '../s2wf-icons/S2_Icon_Settings_20_N.svg';
import {style} from '../style/spectrum-theme' with {type: 'macro'};
import {UNSTABLE_Autocomplete, useFilter} from 'react-aria-components';
import User from '../s2wf-icons/S2_Icon_User_20_N.svg';
import Users from '../s2wf-icons/S2_Icon_UserGroup_20_N.svg';

const meta: Meta<typeof Popover> = {
  component: Popover,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  title: 'Popover'
};

export default meta;

export const HelpCenter = (args: any) => (
  <DialogTrigger {...args}>
    <ActionButton aria-label="Help" styles={style({marginX: 'auto'})}>
      <Help />
    </ActionButton>
    <Popover {...args}>
      <Tabs density="compact" aria-label="Support and assistance tabs">
        <TabList styles={style({marginX: 12})}>
          <Tab id="help">Help</Tab>
          <Tab id="support">Support</Tab>
          <Tab id="feedback">Feedback</Tab>
        </TabList>
        <TabPanel id="help">
          <div className={style({marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12})}>
            <SearchField label="Search" styles={style({marginX: 12})} />
            <Menu aria-label="Help">
              <MenuSection>
                <MenuItem href="#">
                  <File />
                  <Text slot="label">Documentation</Text>
                </MenuItem>
              </MenuSection>
              <MenuSection>
                <MenuItem href="#">
                  <Education />
                  <Text slot="label">Learning</Text>
                </MenuItem>
                <MenuItem href="#">
                  <Users />
                  <Text slot="label">Community</Text>
                </MenuItem>
              </MenuSection>
              <MenuSection>
                <MenuItem href="#">
                  <User />
                  <Text slot="label">Customer Care</Text>
                </MenuItem>
                <MenuItem href="#">
                  <Cloud />
                  <Text slot="label">Status</Text>
                </MenuItem>
                <MenuItem href="#">
                  <Lightbulb />
                  <Text slot="label">Developer Connection</Text>
                </MenuItem>
              </MenuSection>
            </Menu>
          </div>
        </TabPanel>
        <TabPanel id="support" styles={style({margin: 12})}>
          <Card size="L" styles={style({width: 'full'})}>
            <CardPreview>
              <Image src="https://react-spectrum.adobe.com/ReactSpectrumHome_976x445_2x.3eedfdc2.webp" />
            </CardPreview>
            <Content>
              <Text slot="title">Go to support</Text>
              <Text slot="description">Find support resources or submit a ticket</Text>
            </Content>
          </Card>
        </TabPanel>
        <TabPanel id="feedback" styles={style({margin: 12})}>
          <p className={style({font: 'body', marginTop: 0})}>How are we doing? Share your feedback here.</p>
          <Form>
            <TextField label="Subject" />
            <TextField label="Description" isRequired />
            <Switch>Adobe can contact me for further questions concerning this feedback</Switch>
            <Button styles={style({marginStart: 'auto'})}>Submit</Button>
          </Form>
        </TabPanel>
      </Tabs>
    </Popover>
  </DialogTrigger>
);

HelpCenter.parameters = {
  layout: 'padded'
};

HelpCenter.args = {
  size: 'S'
};

export const AccountMenu = (args: any) => (
  <DialogTrigger {...args}>
    <ActionButton aria-label="Account" styles={style({marginX: 'auto'})}>
      <Avatar src="https://i.imgur.com/xIe7Wlb.png" />
    </ActionButton>
    <Popover {...args} hideArrow placement="bottom end">
      <div className={style({paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 12})}>
        <div className={style({display: 'flex', gap: 12, alignItems: 'center', marginX: 12})}>
          <Avatar src="https://i.imgur.com/xIe7Wlb.png" size={56} />
          <div>
            <div className={style({font: 'title'})}>Devon Govett</div>
            <div className={style({font: 'ui'})}>user@example.com</div>
            <Switch styles={style({marginTop: 4})}>Dark theme</Switch>
          </div>
        </div>
        <Divider styles={style({marginX: 12})} />
        <Menu aria-label="Account">
          <MenuSection>
            <SubmenuTrigger>
              <MenuItem>
                <Org />
                <Text slot="label">Organization</Text>
                <Text slot="value">Nike</Text>
              </MenuItem>
              <Menu selectionMode="single" selectedKeys={['nike']}>
                <MenuItem id="adobe">Adobe</MenuItem>
                <MenuItem id="nike">Nike</MenuItem>
                <MenuItem id="apple">Apple</MenuItem>
              </Menu>
            </SubmenuTrigger>
            <MenuItem>
              <Settings />
              <Text slot="label">Settings</Text>
            </MenuItem>
          </MenuSection>
          <MenuSection>
            <MenuItem>Legal notices</MenuItem>
            <MenuItem>Sign out</MenuItem>
          </MenuSection>
        </Menu>
      </div>
    </Popover>
  </DialogTrigger>
);

AccountMenu.argTypes = {
  hideArrow: {table: {disable: true}},
  placement: {table: {disable: true}}
};


function Autocomplete(props) {
  let {contains} = useFilter({sensitivity: 'base'});
  return (
    <UNSTABLE_Autocomplete filter={contains} {...props} />
  );
}

export const AutocompletePopover = (args: any) => (
  <>
    <DialogTrigger {...args}>
      <ActionButton aria-label="Help" styles={style({marginX: 'auto'})}>
        <Help />
      </ActionButton>
      <Popover {...args}>
        <Autocomplete>
          <SearchField autoFocus label="Search" styles={style({marginTop: 12, marginX: 12})} />
          <Menu aria-label="test menu" styles={style({marginTop: 12})}>
            <MenuItem>Foo</MenuItem>
            <MenuItem>Bar</MenuItem>
            <MenuItem>Baz</MenuItem>
          </Menu>
        </Autocomplete>
      </Popover>
    </DialogTrigger>
  </>
);
