import {Button} from '@react-spectrum/button';
import {Checkbox} from '@react-spectrum/checkbox';
import customTheme from './custom-theme.css';
import {DatePicker} from '@react-spectrum/datepicker';
import {Form} from '@react-spectrum/form';
import {Provider} from '../';
import {Radio, RadioGroup} from '@react-spectrum/radio';
import React from 'react';
import scaleLarge from '@adobe/spectrum-css-temp/vars/spectrum-large-unique.css';
import scaleMedium from '@adobe/spectrum-css-temp/vars/spectrum-medium-unique.css';
import {storiesOf} from '@storybook/react';
import {Switch} from '@react-spectrum/switch';
import {TextField} from '@react-spectrum/textfield';

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
    'isEmphasized',
    () => render({isEmphasized: true})
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
    'isRequired',
    () => render({isRequired: true})
  )
  .add(
    'custom theme',
    () => render({theme: THEME})
  );

function render(props = {}) {
  return (
    <Provider {...props} UNSAFE_style={{padding: 50}}>
      <Form>
        <div> {/* Extra div so that the button does not expand to 100% width */}
          <Button variant="primary">I am a button</Button>
        </div>
        <TextField label="A text field" placeholder="Something" marginTop="size-100" />
        <Checkbox>Cats!</Checkbox>
        <Switch>Dogs!</Switch>
        <RadioGroup label="A radio group">
          <Radio value="dogs">Dogs</Radio>
          <Radio value="cats">Cats</Radio>
          <Radio value="horses">Horses</Radio>
        </RadioGroup>
        <DatePicker label="A date picker" marginTop="size-100" />
      </Form>
    </Provider>
  );
}
