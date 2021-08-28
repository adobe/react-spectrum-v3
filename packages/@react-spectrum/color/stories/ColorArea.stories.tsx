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
import {ColorArea, ColorSlider, ColorWheel} from '../';
import {Flex} from '@adobe/react-spectrum';
import {parseColor} from '@react-stately/color';
import React, {useState} from 'react';
import {storiesOf} from '@storybook/react';
import {Text} from '@react-spectrum/text';
import {useLocale} from '@react-aria/i18n';

storiesOf('ColorArea', module)
  .add(
    'default (HSB xChannel="saturation" yChannel="brightness")',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsb(0, 100%, 100%)'));
      return (<div role="group" aria-label="HSB Color Picker">
        <Flex gap="size-500">
          <Flex direction="row" alignContent={'center'} alignItems={'center'} gap="size-200" height={'size-2000'}>
            <div style={{position: 'relative'}}>
              <ColorWheel
                value={color}
                onChange={setColor}
                UNSAFE_style={{
                  position: 'relative',
                  left: 'calc(50% - calc(var(--spectrum-global-dimension-size-125) * 8))',
                  top: 'calc(50% - calc(var(--spectrum-global-dimension-size-125) * 8))'
                }} />
              <ColorArea
                value={color}
                onChange={(e) => {
                  action('change')(e);
                  setColor(e);
                }}
                size={'size-900'}
                UNSAFE_style={{
                  position: 'absolute',
                  margin: '0',
                  left: 'calc(50% - calc(var(--spectrum-global-dimension-size-900) / 2))',
                  top: 'calc(50% - calc(var(--spectrum-global-dimension-size-900) / 2))'
                }} />
            </div>
            <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
              <div role="img" aria-label={`color swatch: ${color.toString('hsb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
              <Text>{color.toString('hsb')}</Text>
              <Text>{color.getColorName(locale)}</Text>
            </Flex>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'HSB xChannel="brightness" yChannel="saturation"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsb(0, 100%, 100%)'));
      return (<div role="group" aria-label="HSB Color Picker">
        <Flex gap="size-500">
          <Flex direction="row" alignContent={'center'} alignItems={'center'} gap="size-200" height={'size-2000'}>
            <div style={{position: 'relative'}}>
              <ColorWheel
                value={color}
                onChange={setColor}
                UNSAFE_style={{
                  position: 'relative',
                  left: 'calc(50% - calc(var(--spectrum-global-dimension-size-125) * 8))',
                  top: 'calc(50% - calc(var(--spectrum-global-dimension-size-125) * 8))'
                }} />
              <ColorArea
                value={color}
                onChange={(e) => {
                  action('change')(e);
                  setColor(e);
                }}
                size={'size-900'}
                UNSAFE_style={{
                  position: 'absolute',
                  margin: '0',
                  left: 'calc(50% - calc(var(--spectrum-global-dimension-size-900) / 2))',
                  top: 'calc(50% - calc(var(--spectrum-global-dimension-size-900) / 2))'
                }}
                xChannel={'brightness'}
                yChannel={'saturation'} />
            </div>
            <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
              <div role="img" aria-label={`color swatch: ${color.toString('hsb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
              <Text>{color.toString('hsb')}</Text>
              <Text>{color.getColorName(locale)}</Text>
            </Flex>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'HSB xChannel="hue", yChannel="brightness"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsb(0, 100%, 100%)'));
      return (<div role="group" aria-label="HSB Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'hue'}
              yChannel={'brightness'} />
            <ColorSlider value={color} onChange={setColor} channel={'saturation'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('hsb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hsb')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'HSB xChannel="brightness", yChannel="hue"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsb(0, 100%, 100%)'));
      return (<div role="group" aria-label="HSB Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'brightness'}
              yChannel={'hue'} />
            <ColorSlider value={color} onChange={setColor} channel={'saturation'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('hsb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hsb')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'HSB xChannel="hue", yChannel="saturation"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsb(0, 100%, 100%)'));
      return (<div role="group" aria-label="HSB Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'hue'}
              yChannel={'saturation'} />
            <ColorSlider value={color} onChange={setColor} channel={'brightness'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('hsb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hsb')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'HSB xChannel="saturation", yChannel="hue"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsb(0, 100%, 100%)'));
      return (<div role="group" aria-label="HSB Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'saturation'}
              yChannel={'hue'} />
            <ColorSlider value={color} onChange={setColor} channel={'brightness'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('hsb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hsb')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'RGB xChannel="blue", yChannel="green"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('#ff00ff'));
      return (<div role="group" aria-label="RGB Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'blue'}
              yChannel={'green'} />
            <ColorSlider value={color} onChange={setColor} channel={'red'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap="size-100" minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('rgb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hex')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'RGB xChannel="green", yChannel="blue"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('#ff00ff'));
      return (<div role="group" aria-label="RGB Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'green'}
              yChannel={'blue'} />
            <ColorSlider value={color} onChange={setColor} channel={'red'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap="size-100" minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('rgb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hex')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'RGB xChannel="blue", yChannel="red"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('#ff00ff'));
      return (<div role="group" aria-label="RGB Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'blue'}
              yChannel={'red'} />
            <ColorSlider value={color} onChange={setColor} channel={'green'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap="size-100" minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('rgb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hex')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'RGB xChannel="red", yChannel="blue"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('#ff00ff'));
      return (<div role="group" aria-label="RGB Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'red'}
              yChannel={'blue'} />
            <ColorSlider value={color} onChange={setColor} channel={'green'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap="size-100" minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('rgb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hex')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'RGB xChannel="red", yChannel="green"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('#ff00ff'));
      return (<div role="group" aria-label="RGB Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'red'}
              yChannel={'green'} />
            <ColorSlider value={color} onChange={setColor} channel={'blue'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap="size-100" minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('rgb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hex')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'RGB xChannel="green", yChannel="red"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('#ff00ff'));
      return (<div role="group" aria-label="RGB Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'green'}
              yChannel={'red'} />
            <ColorSlider value={color} onChange={setColor} channel={'blue'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap="size-100" minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('rgb')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hex')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'HSL xChannel="saturation", yChannel="lightness"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsl(0, 100%, 50%)'));
      return (<div role="group" aria-label="HSL Color Picker">
        <Flex gap="size-500">
          <Flex direction="row" alignContent={'center'} alignItems={'center'} gap="size-200">
            <div style={{position: 'relative'}}>
              <ColorWheel
                value={color}
                onChange={(e) => {
                  action('change')(e);
                  setColor(e);
                }}
                UNSAFE_style={{
                  position: 'relative',
                  left: 'calc(50% - calc(var(--spectrum-global-dimension-size-125) * 8))',
                  top: 'calc(50% - calc(var(--spectrum-global-dimension-size-125) * 8))'
                }} />
              <ColorArea
                value={color}
                onChange={setColor}
                size={'size-900'}
                UNSAFE_style={{
                  position: 'absolute',
                  margin: '0',
                  left: 'calc(50% - calc(var(--spectrum-global-dimension-size-900, var(--spectrum-alias-size-900)) / 2))',
                  top: 'calc(50% - calc(var(--spectrum-global-dimension-size-900, var(--spectrum-alias-size-900)) / 2))'
                }} />
            </div>
            <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
              <div role="img" aria-label={`color swatch: ${color.toString('hsl')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
              <Text>{color.toString('hsl')}</Text>
              <Text>{color.getColorName(locale)}</Text>
            </Flex>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'HSL xChannel="lightness", yChannel="saturation"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsl(0, 100%, 50%)'));
      return (<div role="group" aria-label="HSL Color Picker">
        <Flex gap="size-500">
          <Flex direction="row" alignContent={'center'} alignItems={'center'} gap="size-200">
            <div style={{position: 'relative'}}>
              <ColorWheel
                value={color}
                onChange={(e) => {
                  action('change')(e);
                  setColor(e);
                }}
                UNSAFE_style={{
                  position: 'relative',
                  left: 'calc(50% - calc(var(--spectrum-global-dimension-size-125) * 8))',
                  top: 'calc(50% - calc(var(--spectrum-global-dimension-size-125) * 8))'
                }} />
              <ColorArea
                value={color}
                onChange={setColor}
                size={'size-900'}
                UNSAFE_style={{
                  position: 'absolute',
                  margin: '0',
                  left: 'calc(50% - calc(var(--spectrum-global-dimension-size-900, var(--spectrum-alias-size-900)) / 2))',
                  top: 'calc(50% - calc(var(--spectrum-global-dimension-size-900, var(--spectrum-alias-size-900)) / 2))'
                }}
                xChannel={'lightness'}
                yChannel={'saturation'} />
            </div>
            <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
              <div role="img" aria-label={`color swatch: ${color.toString('hsl')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
              <Text>{color.toString('hsl')}</Text>
              <Text>{color.getColorName(locale)}</Text>
            </Flex>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'HSL xChannel="hue", yChannel="lightness"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsl(0, 100%, 50%)'));
      return (<div role="group" aria-label="HSL Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'hue'}
              yChannel={'lightness'} />
            <ColorSlider value={color} onChange={setColor} channel={'saturation'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('hsl')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hsl')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'HSL xChannel="lightness", yChannel="hue"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsl(0, 100%, 50%)'));
      return (<div role="group" aria-label="HSL Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'lightness'}
              yChannel={'hue'} />
            <ColorSlider value={color} onChange={setColor} channel={'saturation'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('hsl')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hsl')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'HSL xChannel="hue", yChannel="saturation"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsl(0, 100%, 50%)'));
      return (<div role="group" aria-label="HSL Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'hue'}
              yChannel={'saturation'} />
            <ColorSlider value={color} onChange={setColor} channel={'lightness'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('hsl')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hsl')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'HSL xChannel="saturation", yChannel="hue"',
    () => {
      let {locale} = useLocale();
      let [color, setColor] = useState(parseColor('hsl(0, 100%, 50%)'));
      return (<div role="group" aria-label="HSL Color Picker">
        <Flex gap="size-500" alignItems="center">
          <Flex direction="column" gap="size-50" width={'size-2000'}>
            <ColorArea
              value={color}
              onChange={(e) => {
                action('change')(e);
                setColor(e);
              }}
              xChannel={'saturation'}
              yChannel={'hue'} />
            <ColorSlider value={color} onChange={setColor} channel={'lightness'} />
          </Flex>
          <Flex direction="column" alignItems="center" gap={'size-100'} minWidth={'size-2000'}>
            <div role="img" aria-label={`color swatch: ${color.toString('hsl')}`} title={`${color.getColorName(locale)}`} style={{width: '100px', height: '100px', background: color.toString('css')}} />
            <Text>{color.toString('hsl')}</Text>
            <Text>{color.getColorName(locale)}</Text>
          </Flex>
        </Flex>
      </div>);
    }
  )
  .add(
    'disabled',
    () => <ColorArea isDisabled defaultValue="hsl(0, 100%, 50%)" />
  )
  .add(
    'step',
    () => <ColorArea xChannelStep={5} yChannelStep={7.5} onChange={action('change')} defaultValue="hsl(0, 100%, 50%)" yChannel="hue" xChannel="lightness" />
  )
  .add(
    'custom size',
    () => {
      let [size, setSize] = useState('size-2400');
      return (<Flex direction="column" alignItems="center" gap="size-200">
        <Flex direction="row">
          <button onClick={() => setSize('size-2400')}>size-2400</button>
          <button onClick={() => setSize('size-5000')}>size-5000</button>
          <button onClick={() => setSize('50vh')}>50vh</button>
        </Flex>
        <ColorArea defaultValue="hsb(180, 100%, 100%)" size={size} onChange={action('change')} />
      </Flex>);
    }
  )
  .add(
    'controlled',
    () => {
      let [color, setColor] = useState(parseColor('hsl(0, 100%, 50%)'));
      let colorCSS = color.toString('css');
      return (<Flex gap={'size-500'} direction="row" alignItems="center">
        <ColorArea
          onChange={(e) => {
            action('change')(e);
            setColor(e);
          }}
          value={color} />
        <div style={{width: '50px', height: '50px', backgroundColor: colorCSS, border: '1px solid black'}} />
      </Flex>);
    }
  );
