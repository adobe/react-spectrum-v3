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
import {Button, Tab, TabList, TabPanel, TabProps, Tabs, TabsProps} from 'react-aria-components';
import React, {useState} from 'react';
import {RouterProvider} from '@react-aria/utils';

export default {
  title: 'React Aria Components'
};

export const TabsExample = () => {
  let [url, setUrl] = useState('/FoR');

  return (
    <RouterProvider navigate={setUrl}>
      <Tabs selectedKey={url} onSelectionChange={action('onSelectionChange')}>
        <TabList aria-label="History of Ancient Rome" style={{display: 'flex', gap: 8}}>
          <CustomTab id="/FoR" href="/FoR">Founding of Rome</CustomTab>
          <CustomTab id="/MaR" href="/MaR">Monarchy and Republic</CustomTab>
          <CustomTab id="/Emp" href="/Emp">Empire</CustomTab>
        </TabList>
        <TabPanel id="/FoR">
          Arma virumque cano, Troiae qui primus ab oris.
        </TabPanel>
        <TabPanel id="/MaR">
          Senatus Populusque Romanus.
        </TabPanel>
        <TabPanel id="/Emp">
          Alea jacta est.
        </TabPanel>
      </Tabs>
    </RouterProvider>
  );
};

// Has error with invalid aria-controls, bug documented here: https://github.com/adobe/react-spectrum/issues/4781#issuecomment-1641057070
export const TabsRenderProps = () => {
  const [tabOrientation, setTabOrientation] = useState<TabsProps['orientation']>('vertical');

  return (
    <div style={{display: 'flex', flexDirection: 'row', gap: 8}}>
      <Button onPress={() => setTabOrientation((current) => current === 'vertical' ? 'horizontal' : 'vertical')}>
        Change Orientation
      </Button>
      <Tabs orientation={tabOrientation} onSelectionChange={action('onSelectionChange')}>
        {({orientation}) => (
          <div>
            <div style={{display: 'flex', flexDirection: orientation === 'vertical' ? 'row' : 'column', gap: 8}}>
              <TabList
                aria-label="History of Ancient Rome"
                style={{display: 'flex', flexDirection: orientation === 'vertical' ? 'column' : 'row', gap: 8}}>
                <CustomTab id="FoR">Founding of Rome</CustomTab>
                <CustomTab id="MaR">Monarchy and Republic</CustomTab>
                <CustomTab id="Emp">Empire</CustomTab>
              </TabList>
              <TabPanel id="FoR">
                Arma virumque cano, Troiae qui primus ab oris.
              </TabPanel>
              <TabPanel id="MaR">
                Senatus Populusque Romanus.
              </TabPanel>
              <TabPanel id="Emp">
                Alea jacta est.
              </TabPanel>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
};

const CustomTab = (props: TabProps) => {
  return (
    <Tab
      {...props}
      style={({isSelected}) => ({
        borderBottom: '2px solid ' + (isSelected ? 'slateblue' : 'transparent')
      })}
      onHoverChange={action('onHoverChange')}
      onHoverEnd={action('onHoverEnd')}
      onHoverStart={action('onHoverStart')}
      onPress={action('onPress')}
      onPressChange={action('onPressChange')}
      onPressEnd={action('onPressEnd')}
      onPressStart={action('onPressStart')}
      onPressUp={action('onPressUp')} />
  );
};

export const NestedTabs = () => (
  <Tabs onSelectionChange={action('onSelectionChange')}>
    <TabList style={{display: 'flex', gap: 8}}>
      <CustomTab id="foo">Foo</CustomTab>
      <CustomTab id="bar">Bar</CustomTab>
    </TabList>
    <TabPanel id="foo">
      <Tabs>
        <TabList style={{display: 'flex', gap: 8}}>
          <CustomTab id="one">One</CustomTab>
          <CustomTab id="two">Two</CustomTab>
        </TabList>
        <TabPanel id="one">One</TabPanel>
        <TabPanel id="two">Two</TabPanel>
      </Tabs>
    </TabPanel>
    <TabPanel id="bar">Bar</TabPanel>
  </Tabs>
);
