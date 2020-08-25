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

import {action} from '@storybook/addon-actions';
import Bell from '@spectrum-icons/workflow/Bell';
import {Button} from '../';
import {Flex} from '@react-spectrum/layout';
import React, {useEffect, useRef, useState} from 'react';
import {storiesOf} from '@storybook/react';
import {Text} from '@react-spectrum/text';
import {View} from '@react-spectrum/view';

storiesOf('Button', module)
  .addParameters({providerSwitcher: {status: 'positive'}})
  .add(
    'variant: cta',
    () => render({variant: 'cta'})
  )
  .add(
    'with icon',
    () => (
      <Flex gap="size-200">
        <Button
          onPress={action('press')}
          onPressStart={action('pressstart')}
          onPressEnd={action('pressend')}
          variant="primary">
          <Bell />
          <Text>Default</Text>
        </Button>
        <Button
          onPress={action('press')}
          onPressStart={action('pressstart')}
          onPressEnd={action('pressend')}
          isDisabled
          variant="primary">
          <Text>Disabled</Text>
          <Bell />
        </Button>
        <Button
          onPress={action('press')}
          onPressStart={action('pressstart')}
          onPressEnd={action('pressend')}
          isQuiet
          variant="primary">
          <Bell />
          <Text>Quiet</Text>
        </Button>
      </Flex>
    )
  )
  .add(
    'variant: overBackground',
    () => render({variant: 'overBackground'})
  )
  .add(
    'variant: primary',
    () => render({variant: 'primary'})
  )
  .add(
    'variant: secondary',
    () => render({variant: 'secondary'})
  )
  .add(
    'variant: negative',
    () => render({variant: 'negative'})
  )
  .add(
    'element: a',
    () => render({elementType: 'a', variant: 'primary'})
  )
  .add(
    'element: a, href: \'//example.com\', target: \'_self\'',
    () => render({elementType: 'a', href: '//example.com', target: '_self', variant: 'primary'})
  )
  .add(
    'element: a, rel: \'noopener noreferrer\'',
    () => render({elementType: 'a', href: '//example.com', rel: 'noopener noreferrer', variant: 'primary'})
  )
  .add(
    'is pending',
    () => {
      let timeout = useRef<ReturnType<typeof setTimeout>>();
      let [isPending, setPending] = useState(false);
      let handlePress = (e) => {
        setPending(true);
        action('press')(e);

        timeout.current = setTimeout(() => {
          setPending(false);
        }, 3000);
      };

      useEffect(() => () => clearTimeout(timeout.current), []);

      let variants = ['cta', 'primary', 'secondary', 'negative', 'overBackground'];

      return (
        <Flex direction="column">
          {variants.map(variant =>
            render({
              onPress: handlePress,
              variant,
              isPending
            }, {
              key: variant,
              padding: 'size-300'
            })
          )}
        </Flex>
      );
    }
  );

function render(props: any = {}, viewProps: any = {}) {
  let backgroundProps = {...props.variant === 'overBackground' && {backgroundColor: 'blue-700', padding: 'size-400'}};

  return (
    <View {...backgroundProps} {...viewProps}>
      <Flex gap="size-200">
        <Button
          onPress={action('press')}
          onPressStart={action('pressstart')}
          onPressEnd={action('pressend')}
          {...props}>
          Default
        </Button>
        <Button
          onPress={action('press')}
          onPressStart={action('pressstart')}
          onPressEnd={action('pressend')}
          isDisabled
          {...props}>
          Disabled
        </Button>
        {props.variant !== 'cta' && (
        <Button
          onPress={action('press')}
          onPressStart={action('pressstart')}
          onPressEnd={action('pressend')}
          isQuiet
          {...props}>
          Quiet
        </Button>
        )}
      </Flex>
    </View>
  );
}
