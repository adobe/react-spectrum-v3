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

import React from 'react';
import {Toast} from '../src/Toast';
import {useToastState} from '@react-stately/toast';

function FakeToast(props) {
  let state = useToastState<any>();
  return <Toast toast={{content: props, key: 'toast'}} state={state} />;
}

export default {
  title: 'Toast',
  component: FakeToast
};

export const Default = {
  args: {children: 'Neutral toast'}
};

export const Info = {
  args: {variant: 'info', children: 'Neutral toast'}
};

export const Positive = {
  args: {variant: 'positive', children: 'Neutral toast'}
};

export const Negative = {
  args: {variant: 'negative', children: 'Neutral toast'}
};

export const Action = {
  args: {variant: 'positive', children: 'Neutral toast', actionLabel: 'Undo'}
};

export const LongContent = {
  args: {variant: 'positive', children: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.'}
};

export const LongContentAction = {
  args: {variant: 'positive', children: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.', actionLabel: 'Undo'}
};
