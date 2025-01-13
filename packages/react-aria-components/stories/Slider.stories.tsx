/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Label, Slider, SliderOutput, SliderProps, SliderThumb, SliderTrack} from 'react-aria-components';
import React from 'react';
import styles from '../example/index.css';

export default {
  title: 'React Aria Components'
};

export const SliderExample = () => {
  const [value, setValue] = React.useState([30, 60]);
  return (
    <div>
      <Slider<number[]>
        data-testid="slider-example"
        value={value}
        onChange={setValue}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 300
        }}>
        <div style={{display: 'flex', alignSelf: 'stretch'}}>
          <Label>Test</Label>
          <SliderOutput style={{flex: '1 0 auto', textAlign: 'end'}}>
            {({state}) => `${state.getThumbValueLabel(0)} - ${state.getThumbValueLabel(1)}`}
          </SliderOutput>
        </div>
        <SliderTrack
          style={{
            position: 'relative',
            height: 30,
            width: '100%'
          }}>
          <div
            style={{
              position: 'absolute',
              backgroundColor: 'gray',
              height: 3,
              top: 13,
              width: '100%'
            }} />
          <CustomThumb index={0}>
            <Label>A</Label>
          </CustomThumb>
          <CustomThumb index={1}>
            <Label>B</Label>
          </CustomThumb>
        </SliderTrack>
      </Slider>
      <button onClick={() => setValue([0, 100])}>reset</button>
    </div>
  );
};

export const SliderCSS = (props: SliderProps) => (
  <Slider {...props} defaultValue={30} className={styles.slider}>
    <div className={styles.label}>
      <Label>Test</Label>
      <SliderOutput />
    </div>
    <SliderTrack className={styles.track}>
      <SliderThumb className={styles.thumb} />
    </SliderTrack>
  </Slider>
);

SliderCSS.args = {
  orientation: 'horizontal',
  isDisabled: false,
  minValue: 0,
  maxValue: 100,
  step: 1
};

SliderCSS.argTypes = {
  orientation: {
    control: {
      type: 'inline-radio',
      options: ['horizontal', 'vertical']
    }
  }
};

interface SliderCustomFormatProps<T = number | number[]> extends SliderProps<T> {
  fahrenheit: boolean,
  showAlternative: boolean
}

function temperatureUnitFormat(fahrenheit: boolean): Intl.NumberFormatOptions {
  return {
    style: 'unit',
    unit: fahrenheit ? 'fahrenheit' : 'celsius',
    maximumFractionDigits: 1
  };
}

export const SliderCustomFormat = ({fahrenheit, showAlternative, ...props}: SliderCustomFormatProps) => {
  const mainFormat = temperatureUnitFormat(fahrenheit);
  let format: Intl.NumberFormatOptions | ((value: number, locale: string) => string) = mainFormat;

  if (showAlternative) {
    format = (value, locale) => {
      const formatter = new Intl.NumberFormat(locale, mainFormat);
      const altValue = fahrenheit ? value * 9 / 5 + 32 : (value - 32) * 5 / 9;
      const altFormat = temperatureUnitFormat(!fahrenheit);
      const altFormatter = new Intl.NumberFormat(locale, altFormat);
      return `${formatter.format(value)} (${altFormatter.format(altValue)})`;
    };
  }

  return (
    <Slider {...props} defaultValue={32} className={styles.slider} format={format}>
      <div className={styles.label}>
        <Label>Temperature</Label>
        <SliderOutput />
      </div>
      <SliderTrack className={styles.track}>
        <SliderThumb className={styles.thumb} />
      </SliderTrack>
    </Slider>
  );
};

SliderCustomFormat.args = {
  fahrenheit: false,
  showAlternative: false,
  isDisabled: false,
  minValue: 0,
  maxValue: 100,
  step: 1
};

const CustomThumb = ({index, children}: {index: number, children: React.ReactNode}) => {
  return (
    <SliderThumb
      index={index}
      style={({isDragging, isFocusVisible}) => ({
        width: 20,
        height: 20,
        borderRadius: '50%',
        top: '50%',
        // eslint-disable-next-line
        backgroundColor: isFocusVisible ? 'orange' : isDragging
          ? 'dimgrey'
          : 'gray'
      })}>
      {children}
    </SliderThumb>
  );
};
