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

import React from 'react';
import {useTab, useTabList, useTabPanel} from '@react-aria/tabs';
import {useTabListState} from '@react-stately/tabs';

export function Tabs(props) {
  let state = useTabListState(props);
  let ref = React.useRef();
  let {tabListProps} = useTabList(props, state, ref);
  return (
    <div style={{height: '150px'}}>
      <div {...tabListProps} ref={ref} style={{display: 'flex', borderBottom: '1px solid grey', maxWidth: '400px', overflow: 'auto'}}>
        {[...state.collection].map((item) => (
          <Tab key={item.key} item={item} state={state} />
        ))}
      </div>
      <TabPanel key={state.selectedItem?.key} state={state} />
    </div>
  );
}

function Tab({item, state}) {
  let {key, rendered} = item;
  let ref = React.useRef();
  let {tabProps} = useTab({key}, state, ref);
  let isSelected = state.selectedKey === key;
  let isDisabled = state.disabledKeys.has(key);
  return (
    <div
      {...tabProps}
      ref={ref}
      style={{
        padding: '10px',
        borderBottom: isSelected ? '3px solid blue' : undefined,
        opacity: isDisabled ? '0.5' : undefined
      }}>
      {rendered}
    </div>
  );
}

function TabPanel({state, ...props}) {
  let ref = React.useRef();
  let {tabPanelProps} = useTabPanel(props, state, ref);
  return (
    <div {...tabPanelProps} ref={ref} style={{padding: '10px'}}>
      {state.selectedItem?.props.children}
    </div>
  );
}
