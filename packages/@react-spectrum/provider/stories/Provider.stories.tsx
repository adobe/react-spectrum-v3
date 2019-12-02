import {Button} from '@react-spectrum/button';
import customTheme from './custom-theme.css';
import {Provider} from '../';
import React from 'react';
import scaleLarge from '@adobe/spectrum-css-temp/vars/spectrum-large-unique.css';
import scaleMedium from '@adobe/spectrum-css-temp/vars/spectrum-medium-unique.css';
import {storiesOf} from '@storybook/react';

const THEME = {
  light: customTheme,
  medium: scaleMedium,
  large: scaleLarge
};

storiesOf('Provider', module)
  .add(
    'colorScheme: dark',
    () => render({colorScheme: 'dark', style: {padding: 50, textAlign: 'center', width: 500}})
  )
  .add(
    'scale: large',
    () => render({scale: 'large'})
  )
  .add(
    'nested color schemes',
    () => (
      <Provider colorScheme="dark" UNSAFE_style={{padding: 50, textAlign: 'center', width: 500}}>
        <Button variant="primary">I am a dark button</Button>
        <Provider colorScheme="light" UNSAFE_style={{padding: 50, margin: 50, textAlign: 'center'}}>
          <Button variant="primary">I am a light button</Button>
        </Provider>
      </Provider>
    )
  )
  .add(
    'locale: cs-CZ',
    () => render({locale: 'cs-CZ'})
  )
  .add(
    'isQuiet',
    () => render({isQuiet: true})
  )
  .add(
    'isDisabled',
    () => render({isDisabled: true})
  )
  .add(
    'isReadOnly',
    () => render({isReadOnly: true})
  )
  .add(
    'custom theme',
    () => render({theme: THEME})
  );

function render(props = {}) {
  return (
    <Provider {...props}>
      <Button variant="primary">I am a button</Button>
    </Provider>
  );
}
