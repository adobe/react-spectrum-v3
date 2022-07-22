import {configureActions} from '@storybook/addon-actions';
import React from 'react';
import {VerticalCenter} from './layout';
import {withProviderSwitcher} from './custom-addons/provider';
import {withStrictModeSwitcher} from './custom-addons/strictmode';

// decorator order matters, the last one will be the outer most

configureActions({
  depth: 10
});

export const parameters = {
  options: {
    storySort: (a, b) => a[1].kind === b[1].kind ? 0 : a[1].id.localeCompare(b[1].id, undefined, { numeric: true }),
  },
  a11y: {},
  layout: 'fullscreen',
  args: {
    isQuiet: false
  },
  argType: {
    isQuiet: {
      control: {type: 'boolean'}
    },
  },
  controls: {}
};

export const globalTypes = {
  strictMode: {
    name: 'strictMode',
    description: 'Global tracker for strict mode',
    defaultValue: false
  },
};

export const decorators = [
  story => (
    <VerticalCenter style={{alignItems: 'center', minHeight: '100vh', boxSizing: 'border-box', display: 'flex', justifyContent: 'center'}}>
      {story()}
    </VerticalCenter>
  ),
  withStrictModeSwitcher,
  withProviderSwitcher
];
