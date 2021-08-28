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

import {classNames} from '@react-spectrum/utils';
import {generatePowerset} from '@react-spectrum/story-utils';
import {Grid, repeat, View} from '@adobe/react-spectrum';
import React from 'react';
import {storiesOf} from '@storybook/react';
import styles from '@adobe/spectrum-css-temp/components/button/vars.css';
import {ToggleButton} from '../';

let states = [
  {isQuiet: true},
  {isEmphasized: true},
  {isSelected: true},
  {isDisabled: true},
  {UNSAFE_className: classNames(styles, 'is-active')},
  {UNSAFE_className: classNames(styles, 'is-hovered')},
  {UNSAFE_className: classNames(styles, 'focus-ring')}
];

let combinations = generatePowerset(states, (merged) => merged.isDisabled && merged.UNSAFE_className);

storiesOf('Button/ToggleButton', module)
  .addParameters({providerSwitcher: {status: 'positive'}})
  .add('all possible states', () => (
    <Grid columns={repeat(states.length, '1fr')} autoFlow="row" gap="size-300">
      {combinations.map(c => <ToggleButton {...c}>Button</ToggleButton>)}
    </Grid>
  ))
  .add('staticColor = white', () => (
    <View backgroundColor="static-seafoam-600" padding="size-1000">
      <Grid columns={repeat(states.length, '1fr')} autoFlow="row" gap="size-300">
        {combinations.map(c => <ToggleButton {...c} staticColor="white">Button</ToggleButton>)}
      </Grid>
    </View>
  ))
  .add('staticColor = black', () => (
    <View backgroundColor="static-yellow-400" padding="size-1000">
      <Grid columns={repeat(states.length, '1fr')} autoFlow="row" gap="size-300">
        {combinations.map(c => <ToggleButton {...c} staticColor="black">Button</ToggleButton>)}
      </Grid>
    </View>
  ))
  .add('Arabic', () => (
    <Grid columns={repeat(states.length, '1fr')} autoFlow="row" gap="size-300">
      {combinations.map(c => <ToggleButton {...c}>زر</ToggleButton>)}
    </Grid>
  ));
