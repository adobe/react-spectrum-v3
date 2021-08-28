import './Storybook.css';
import '../importStories';
import {theme as defaultTheme} from '@react-spectrum/theme-default';
import MainContent from './MainContent';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import Sidebar from './Sidebar';

export default function Storybook() {
  return (
    <Provider id="storybook" key="provider" theme={defaultTheme}>
      <div style={{display: 'flex', flexDirection: 'row'}}>
        <Sidebar />
        <MainContent />
      </div>
    </Provider>
  );
}
