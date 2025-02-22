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

'use client'

import React, { useState } from "react";
import "@react-spectrum/s2/page.css";
import {
  ActionButton,
  ActionButtonGroup,
  ActionMenu,
  Button,
  ButtonGroup,
  Cell,
  Column,
  Divider,
  Heading,
  LinkButton,
  Menu,
  MenuItem,
  MenuTrigger,
  Picker,
  PickerItem,
  Row,
  SubmenuTrigger,
  TableBody,
  TableHeader,
  TableView,
  Text,
  ToggleButton,
  ToggleButtonGroup
} from "@react-spectrum/s2";
import Edit from "@react-spectrum/s2/icons/Edit";
import Section from "./components/Section";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { CardViewExample } from "./components/CardViewExample";
import { CollectionCardsExample } from "./components/CollectionCardsExample";

const Lazy = React.lazy(() => import('./Lazy.js'));

function App() {
  let [isLazyLoaded, setLazyLoaded] = useState(false);
  let [cardViewState, setCardViewState] = useState({
    layout: 'grid',
    loadingState: 'idle',
  });
  let cardViewLoadingOptions = [
    {id: 'idle', label: 'Idle'},
    {id: 'loading', label: 'Loading'},
    {id: 'sorting', label: 'Sorting'},
    {id: 'loadingMore', label: 'Loading More'},
    {id: 'error', label: 'Error'},
  ];
  let cardViewLayoutOptions = [
    {id: 'grid', label: 'Grid'},
    {id: 'waterfall', label: 'Waterfall'}
  ];
  return (
    <main>
      <Heading
        styles={style({ font: "heading-xl", textAlign: "center" })}
        level={1}
      >
        Spectrum 2 + Next.js
      </Heading>
      <div
        className={style({
          maxWidth: 288,
          margin: "auto",
        })}
      >
        <Divider />
      </div>
      <div
        className={style({
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center"
        })}
      >
        <Section title="Buttons">
          <ButtonGroup align="center" styles={style({maxWidth: '[100vw]'})}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <ActionButton>
              <Edit />
              <Text>Action Button</Text>
            </ActionButton>
            <ToggleButton>Toggle Button</ToggleButton>
            <LinkButton
              variant="primary"
              href="https://adobe.com"
              target="_blank"
            >
              Link Button
            </LinkButton>
            <ActionButtonGroup density="compact">
              <ActionButton>Cut</ActionButton>
              <ActionButton>Copy</ActionButton>
              <ActionButton>Paste</ActionButton>
            </ActionButtonGroup>
            <ToggleButtonGroup density="compact" selectionMode="multiple">
              <ToggleButton id="bold">Bold</ToggleButton>
              <ToggleButton id="italic">Italic</ToggleButton>
              <ToggleButton id="underline">Underline</ToggleButton>
            </ToggleButtonGroup>
          </ButtonGroup>
        </Section>

        <Section title="Collections">
          <ActionMenu>
            <MenuItem>Action Menu Item 1</MenuItem>
            <MenuItem>Action Menu Item 2</MenuItem>
            <MenuItem>Action Menu Item 3</MenuItem>
          </ActionMenu>
          <Picker
            label="CardView Loading State"
            items={cardViewLoadingOptions}
            selectedKey={cardViewState.loadingState}
            onSelectionChange={loadingState => setCardViewState({...cardViewState, layout: loadingState.toString()})}>
            {item => <PickerItem id={item.id}>{item.label}</PickerItem>}
          </Picker>
          <Picker
            label="CardView Layout"
            items={cardViewLayoutOptions}
            selectedKey={cardViewState.layout}
            onSelectionChange={layout => setCardViewState({...cardViewState, layout: layout.toString()})}>
            {item => <PickerItem id={item.id}>{item.label}</PickerItem>}
          </Picker>
          <CardViewExample {...cardViewState} />
          <Divider styles={style({maxWidth: 320, width: 'full', marginX: 'auto'})} />
          <CollectionCardsExample loadingState={cardViewState.loadingState} />
          <MenuTrigger>
            <ActionButton>Menu</ActionButton>
            <Menu onAction={(key) => alert(key.toString())}>
              <MenuItem id="cut">Cut</MenuItem>
              <MenuItem id="copy">Copy</MenuItem>
              <MenuItem id="paste">Paste</MenuItem>
              <MenuItem id="replace">Replace</MenuItem>
              <SubmenuTrigger>
                <MenuItem id="share">Share</MenuItem>
                <Menu onAction={(key) => alert(key.toString())}>
                  <MenuItem id="copy-ink">Copy Link</MenuItem>
                  <SubmenuTrigger>
                    <MenuItem id="email">Email</MenuItem>
                    <Menu onAction={(key) => alert(key.toString())}>
                      <MenuItem id="attachment">Email as Attachment</MenuItem>
                      <MenuItem id="link">Email as Link</MenuItem>
                    </Menu>
                  </SubmenuTrigger>
                  <MenuItem id="sms">SMS</MenuItem>
                </Menu>
              </SubmenuTrigger>
              <MenuItem id="delete">Delete</MenuItem>
            </Menu>
          </MenuTrigger>
          <MenuTrigger>
            <ActionButton>Menu Trigger</ActionButton>
            <Menu>
              <MenuItem href="/foo" routerOptions={{ scroll: false }}>
                Link to /foo
              </MenuItem>
              <MenuItem>Cut</MenuItem>
              <MenuItem>Copy</MenuItem>
              <MenuItem>Paste</MenuItem>
            </Menu>
          </MenuTrigger>
          <TableView aria-label="Files" styles={style({width: 320, height: 320})}>
            <TableHeader>
              <Column isRowHeader>Name</Column>
              <Column>Type</Column>
              <Column>Date Modified</Column>
              <Column>A</Column>
              <Column>B</Column>
            </TableHeader>
            <TableBody>
              <Row id="1">
                <Cell>Games</Cell>
                <Cell>File folder</Cell>
                <Cell>6/7/2020</Cell>
                <Cell>Dummy content</Cell>
                <Cell>Long long long long long long long cell</Cell>
              </Row>
              <Row id="2">
                <Cell>Program Files</Cell>
                <Cell>File folder</Cell>
                <Cell>4/7/2021</Cell>
                <Cell>Dummy content</Cell>
                <Cell>Long long long long long long long cell</Cell>
              </Row>
              <Row id="3">
                <Cell>bootmgr</Cell>
                <Cell>System file</Cell>
                <Cell>11/20/2010</Cell>
                <Cell>Dummy content</Cell>
                <Cell>Long long long long long long long cell</Cell>
              </Row>
            </TableBody>
          </TableView>
        </Section>

        {!isLazyLoaded && <ActionButton onPress={() => setLazyLoaded(true)}>Load more</ActionButton>}
        {isLazyLoaded && <React.Suspense fallback={<>Loading</>}>
          <Lazy />
        </React.Suspense>}
      </div>
    </main>
  );
}

export default App;
