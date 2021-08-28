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

import {ActionButton} from '../';
import Add from '@spectrum-icons/workflow/Add';
import {Flex} from '@react-spectrum/layout';
import React from 'react';
import {storiesOf} from '@storybook/react';
import {Text} from '@react-spectrum/text';
import {View} from '@react-spectrum/view';

storiesOf('Button/ActionButton', module)
  .addParameters({chromaticProvider: {locales: ['en-US', 'ar-AE', 'ja-JP']}})
  .add(
    'text',
    () => (
      <Flex gap="size-100">
        <ActionButton>
          Default
        </ActionButton>
        <ActionButton isQuiet>
          Quiet
        </ActionButton>
        <ActionButton isDisabled>
          Disabled
        </ActionButton>
      </Flex>
    )
  )
  .add(
    'icon + text',
    () => (
      <Flex gap="size-100">
        <ActionButton>
          <Add />
          <Text>Default</Text>
        </ActionButton>
        <ActionButton isQuiet>
          <Add />
          <Text>Quiet</Text>
        </ActionButton>
        <ActionButton isDisabled>
          <Text>Disabled</Text>
          <Add />
        </ActionButton>
      </Flex>
    )
  )
  .add(
    'icon only',
    () => (
      <Flex gap="size-100">
        <ActionButton>
          <Add />
        </ActionButton>
        <ActionButton isQuiet>
          <Add />
        </ActionButton>
        <ActionButton isDisabled>
          <Add />
        </ActionButton>
      </Flex>
    )
  )
  .add(
    'staticColor: white',
    () => (
      <View backgroundColor="static-seafoam-600" padding="size-1000">
        <Flex direction="column" rowGap="size-150">
          <ActionButton staticColor="white">
            <Add />
            <Text>Default</Text>
          </ActionButton>
          <ActionButton staticColor="white" isQuiet>
            <Add />
            <Text>Quiet</Text>
          </ActionButton>
          <ActionButton staticColor="white" isDisabled>
            <Text>Disabled</Text>
            <Add />
          </ActionButton>
        </Flex>
      </View>
    )
  )
  .add(
    'staticColor: black',
    () => (
      <View backgroundColor="static-yellow-400" padding="size-1000">
        <Flex direction="column" rowGap="size-150">
          <ActionButton staticColor="black">
            <Add />
            <Text>Default</Text>
          </ActionButton>
          <ActionButton staticColor="black" isQuiet>
            <Add />
            <Text>Quiet</Text>
          </ActionButton>
          <ActionButton staticColor="black" isDisabled>
            <Text>Disabled</Text>
            <Add />
          </ActionButton>
        </Flex>
      </View>
    )
  )
  .add(
    'Japanese, icon + text, staticColor: white',
    () => (
      <View backgroundColor="static-seafoam-600" padding="size-1000">
        <Flex direction="column" rowGap="size-150">
          <ActionButton staticColor="white">
            <Add />
            <Text>ディフォルト</Text>
          </ActionButton>
          <ActionButton staticColor="white" isQuiet>
            <Add />
            <Text>静かな</Text>
          </ActionButton>
          <ActionButton staticColor="white" isDisabled>
            <Text>無効</Text>
            <Add />
          </ActionButton>
        </Flex>
      </View>
    )
  );
