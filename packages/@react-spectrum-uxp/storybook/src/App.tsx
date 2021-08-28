import {theme as defaultTheme} from '@react-spectrum/theme-default';
import Header from './@storybook/Storybook/Header';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import Sample from './Sample';
import Storybook from './@storybook/Storybook';
import './App.css';

export default function App() {
  return (<div>
    <Header />,
    <Provider id="storybook" key="provider" theme={defaultTheme}>
      <Sample />
    </Provider>,
    <Storybook key="storybook" />
  </div>);
}
