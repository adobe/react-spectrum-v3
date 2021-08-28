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
import {chain} from '@react-aria/utils';
import {Flex} from '@react-spectrum/layout';
import {Form} from '@react-spectrum/form';
import {Item, Picker} from '@react-spectrum/picker';
import {NumberField} from '../src';
import {NumberFormatter, NumberParser} from '@internationalized/number';
import React, {useState} from 'react';
import {storiesOf} from '@storybook/react';

storiesOf('NumberField', module)
  .addParameters({providerSwitcher: {status: 'notice'}})
  .addDecorator(story => (
    <ErrorBoundary>{story()}</ErrorBoundary>
  ))
  .add(
    'default',
    () => render({})
  )
  .add(
    'defaultValue: 10',
    () => render({defaultValue: 10})
  )
  .add(
    'value: 10',
    () => render({value: 10})
  )
  .add(
    'maximumFractionDigits = 0',
    () => render({formatOptions: {maximumFractionDigits: 0}})
  )
  .add(
    'currency',
    () => render({formatOptions: {style: 'currency', currency: 'EUR'}, label: 'Price'})
  )
  .add(
    'percent',
    () => render({formatOptions: {style: 'percent'}, label: 'Tax'})
  )
  .add(
    'percent min = 2 max = 2 fraction digits',
    () => render({formatOptions: {style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2}, label: 'Tax'})
  )
  .add(
    'percent min = 2 max = 3 fraction digits',
    () => render({formatOptions: {style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 3}, label: 'Tax'})
  )
  .add(
    'minValue = 0, 0 fraction digits',
    () => render({minValue: 0, formatOptions: {maximumFractionDigits: 0}})
  )
  .add(
    'percent using sign',
    () => render({formatOptions: {style: 'percent', signDisplay: 'always'}, label: 'Tax'})
  )
  .add(
    'disabled',
    () => render({isDisabled: true})
  )
  .add(
    'readonly',
    () => render({defaultValue: 10, isReadOnly: true})
  )
  .add(
    'isQuiet',
    () => render({isQuiet: true})
  )
  .add(
    'quiet disabled',
    () => render({isQuiet: true, isDisabled: true, defaultValue: 10})
  )
  .add(
    'quiet readonly',
    () => render({isQuiet: true, isReadOnly: true, defaultValue: 10})
  )
  .add(
    'validationState: invalid',
    () => render({validationState: 'invalid'})
  )
  .add(
    'validationState: valid',
    () => render({validationState: 'valid'})
  )
  .add(
    'validationState: invalid, isQuiet',
    () => render({validationState: 'invalid', isQuiet: true})
  )
  .add(
    'validationState: valid, isQuiet',
    () => render({validationState: 'valid', isQuiet: true})
  )
  .add(
    'minValue = 0, maxValue = 20',
    () => render({minValue: 0, maxValue: 20})
  )
  .add(
    'minValue = 0, maxValue = 20, quiet',
    () => render({isQuiet: true, minValue: 0, maxValue: 20})
  )
  .add(
    'minValue = -50, maxValue = -20',
    () => render({minValue: -50, maxValue: -20})
  )
  .add(
    'minValue = 20, maxValue = 50',
    () => render({minValue: 20, maxValue: 50})
  )
  .add(
    'minValue = 0, defaultValue = 0',
    () => render({minValue: 0, defaultValue: 0})
  )
  .add(
    'step = 5',
    () => render({step: 5})
  )
  .add(
    'step = 3 with min = 2, max = 21',
    () => render({step: 3, minValue: 2, maxValue: 21})
  )
  .add(
    'autoFocus',
    () => render({autoFocus: true})
  )
  .add(
    'hideStepper',
    () => render({hideStepper: true})
  )
  .add(
    'isQuiet, hideStepper',
    () => render({isQuiet: true, hideStepper: true})
  )
  .add(
    'required',
    () => render({isRequired: true})
  )
  .add(
    'optional',
    () => render({necessityIndicator: 'label'})
  )
  .add(
    'required with label',
    () => render({isRequired: true, necessityIndicator: 'label'})
  )
  .add(
    'label top end',
    () => render({isRequired: true, labelPosition: 'top', labelAlign: 'end'})
  )
  .add(
    'label side',
    () => render({isRequired: true, labelPosition: 'side'})
  )
  .add(
    'no visible label',
    () => renderNoLabel({isRequired: true, 'aria-label': 'Width'})
  )
  .add(
    'quiet no visible label',
    () => renderNoLabel({isQuiet: true, isRequired: true, 'aria-label': 'Width'})
  )
  .add(
    'quiet no visible label hidestepper',
    () => renderNoLabel({hideStepper: true, isQuiet: true, isRequired: true, 'aria-label': 'Width'})
  )
  .add(
    'aria-labelledby',
    () => (
      <>
        <label htmlFor="numberfield" id="label">Width</label>
        {renderNoLabel({isRequired: true, id: 'numberfield', 'aria-labelledby': 'label'})}
      </>
    )
  )
  .add(
    'custom width',
    () => render({width: 'size-3000'})
  )
  .add(
    'quiet custom width',
    () => render({isQuiet: true, width: 'size-3000'})
  )
  .add(
    'custom width no visible label',
    () => renderNoLabel({width: 'size-3000', isRequired: true, 'aria-label': 'Width'})
  )
  .add(
    'custom width, labelPosition=side',
    () => render({width: 'size-3000', labelPosition: 'side'})
  )
  .add(
    'controlled',
    () => <NumberFieldControlled />
  )
  .add(
    'currency switcher',
    () => <NumberFieldWithCurrencySelect />
  )
  .add(
    'flexed',
    () => renderSet()
  )
  .add(
    'min width',
    () => render({width: 0})
  )
  .add(
    'focus events',
    () => render({onBlur: action('onBlur'), onFocus: action('onFocus'), onFocusChange: action('onFocusChange'), onKeyDown: action('onKeyDown'), onKeyUp: action('onKeyUp')})
  );

// temporarily taking over the function so it's easier to debug crazy setups
// should probably put together something to combine them into a real story like our currency one but bigger
// eslint-disable-next-line
function render(props: any = {}) {
  // eslint-disable-next-line
  let formatter = new NumberFormatter('da-DK', {"style":"unit","unit":"kilometer-per-hour", "unitDisplay":"long","maximumSignificantDigits":1});
  console.log('initial format', formatter.format(2.220446049250313e-16));
  // eslint-disable-next-line
  let parser = new NumberParser('da-DK', {"style":"unit","unit":"kilometer-per-hour", "unitDisplay":"long","maximumSignificantDigits":1});
  console.log('result', parser.parse(formatter.format(2.220446049250313e-16)));
  console.log('final', formatter.format(parser.parse(formatter.format(2.220446049250313e-16))));
  // return (
  //   <NumberField onChange={action('onChange')} UNSAFE_className="custom_classname" label="Width" {...props} />
  // );
  return <div />;
}

function renderNoLabel(props: any = {}) {
  return (
    <NumberField {...props} onChange={action('onChange')} UNSAFE_className="custom_classname" />
  );
}

function renderSet() {
  return (
    <Flex width="100%" gap="size-200" alignItems="end">
      <NumberField label="Grows" flexGrow={1} />
      <NumberField label="Static" />
      <NumberField aria-label="Grows" flexGrow={1} />
      <NumberField aria-label="Static" />
    </Flex>
  );
}

function NumberFieldControlled(props) {
  let [value, setValue] = useState(10);
  return <NumberField {...props} formatOptions={{style: 'currency', currency: 'EUR'}} value={value} onChange={chain(setValue, action('onChange'))} label="Price" />;
}

function NumberFieldWithCurrencySelect(props) {
  let [value, setValue] = useState(10);
  let [currency, setCurrency] = useState('EUR');
  let [currencySign, setCurrencySign] = useState('standard');
  let [currencyDisplay, setCurrencyDisplay] = useState('symbol');
  return (
    <Form>
      <NumberField label="Price" {...props} formatOptions={{style: 'currency', currency, currencySign, currencyDisplay}} value={value} onChange={chain(setValue, action('onChange'))} />
      <Picker
        onSelectionChange={item => setCurrency(String(item))}
        label="Choose Currency"
        selectedKey={currency}
        items={[{label: 'Euro', value: 'EUR'}, {label: 'US Dollar', value: 'USD'}, {label: 'Japanese Yen', value: 'JPY'}, {label: 'Saudi Riyal', value: 'SAR'}]}>
        {item => <Item key={item.value}>{item.label}</Item>}
      </Picker>
      <Picker
        onSelectionChange={item => setCurrencySign(String(item))}
        label="Currency Sign"
        selectedKey={currencySign}
        items={[{label: 'Standard', value: 'standard'}, {label: 'Accounting', value: 'accounting'}]}>
        {item => <Item key={item.value}>{item.label}</Item>}
      </Picker>
      <Picker
        onSelectionChange={item => setCurrencyDisplay(String(item))}
        label="Currency Display"
        selectedKey={currencyDisplay}
        items={[{label: 'Symbol', value: 'symbol'}, {label: 'Narrow Symbol', value: 'narrowSymbol'}, {label: 'Code', value: 'code'}, {label: 'Name', value: 'name'}]}>
        {item => <Item key={item.value}>{item.label}</Item>}
      </Picker>
    </Form>
  );
}

class ErrorBoundary extends React.Component<{}, {hasError: boolean}> {
  constructor(props) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return {hasError: true};
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <div>Your browser may not support this set of Intl.Format options.</div>;
    }

    return this.props.children;
  }
}
