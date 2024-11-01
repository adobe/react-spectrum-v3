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
import {Button} from '@react-spectrum/button';
import {ButtonGroup} from '@react-spectrum/buttongroup';
import {CalendarDate} from '@internationalized/date';
import {chain} from '@react-aria/utils';
import {Checkbox, CheckboxGroup} from '@react-spectrum/checkbox';
import {ColorField} from '@react-spectrum/color';
import {ComboBox} from '@react-spectrum/combobox';
import {Content, Header} from '@react-spectrum/view';
import {ContextualHelp} from '@react-spectrum/contextualhelp';
import {countries, states} from './data';
import {DateField, DatePicker, DateRangePicker, TimeField} from '@react-spectrum/datepicker';
import {Flex} from '@react-spectrum/layout';
import {Form} from '../';
import {FormTranslatedText} from './../chromatic/FormLanguages.stories';
import {Heading} from '@react-spectrum/text';
import {InlineAlert} from '@react-spectrum/inlinealert';
import {Item, Picker} from '@react-spectrum/picker';
import {Key, ValidationState} from '@react-types/shared';
import {NumberField} from '@react-spectrum/numberfield';
import {Radio, RadioGroup} from '@react-spectrum/radio';
import React, {useEffect, useState} from 'react';
import {SearchAutocomplete} from '@react-spectrum/autocomplete';
import {SearchField} from '@react-spectrum/searchfield';
import {Slider} from '@react-spectrum/slider';
import {StatusLight} from '@react-spectrum/statuslight';
import {Switch} from '@react-spectrum/switch';
import {TagGroup} from '@react-spectrum/tag';
import {TextArea, TextField} from '@react-spectrum/textfield';
import typographyStyles from '@adobe/spectrum-css-temp/components/typography/vars.css';
import {Well} from '@react-spectrum/well';

export default {
  title: 'Form',
  providerSwitcher: {status: 'positive'}
};

export const Default = () => render({});
export const LabelPositionSide = () => render({labelPosition: 'side'});

LabelPositionSide.story = {
  name: 'labelPosition: side'
};

export const CustomWidth = () => render({width: 400});

CustomWidth.story = {
  name: 'custom width'
};

export const CustomWidthLabelPositionSide = () => render({width: 400, labelPosition: 'side'});

CustomWidthLabelPositionSide.story = {
  name: 'custom width, labelPosition: side'
};

export const LabelAlignEnd = () => render({width: 400, labelAlign: 'end'});

LabelAlignEnd.story = {
  name: 'labelAlign: end'
};

export const LabelPositionSideLabelAlignEnd = () =>
  render({width: 400, labelPosition: 'side', labelAlign: 'end'});

LabelPositionSideLabelAlignEnd.story = {
  name: 'labelPosition: side, labelAlign: end'
};

export const FieldsNextToEachOther = () => (
  <Form>
    <Flex>
      <TextField
        label="First Name"
        marginEnd="size-100"
        flex={1}
        description="Please enter your first name." />
      <TextField label="Last Name" flex={1} description="Please enter your last name." />
    </Flex>
    <TextField label="Street Address" description="Please include apartment or suite number." />
    <Flex>
      <TextField
        label="City"
        marginEnd="size-100"
        flex={1}
        description="Please enter the city you live in." />
      <Picker label="State" items={states} marginEnd="size-100" flex={1}>
        {(item) => <Item key={item.abbr}>{item.name}</Item>}
      </Picker>
      <TextField label="Zip code" flex={1} description="Please enter a five-digit zip code." />
    </Flex>
  </Form>
);

FieldsNextToEachOther.story = {
  name: 'fields next to each other'
};

export const FieldsWithAutoCompleteProperty = () => {
  const [checked, setChecked] = useState(true);
  return (
    <Form>
      <Well role="group" aria-labelledby="billing-legend">
        <h2 id="billing-legend" className={typographyStyles['spectrum-Heading4']}>
          Billing address
        </h2>
        <Flex>
          <TextField
            autoComplete="billing given-name"
            name="firstName"
            isRequired
            label="First Name"
            marginEnd="size-100"
            flex={1} />
          <TextField
            autoComplete="billing family-name"
            name="lastName"
            isRequired
            label="Last Name"
            flex={1} />
        </Flex>
        <Flex>
          <TextArea
            autoComplete="billing street-address"
            name="streetAddress"
            isRequired
            label="Street Address"
            flex={1} />
        </Flex>
        <Flex>
          <TextField
            autoComplete="billing address-level2"
            name="city"
            isRequired
            label="City"
            marginEnd="size-100"
            flex={1} />
          <Picker
            autoComplete="billing address-level1"
            name="state"
            isRequired
            label="State"
            items={states}
            marginEnd="size-100"
            flex={1}>
            {(item) => <Item key={item.abbr}>{item.name}</Item>}
          </Picker>
          <TextField
            autoComplete="billing postal-code"
            name="zip"
            isRequired
            label="Zip code"
            flex={1} />
        </Flex>
        <Flex>
          <Picker
            autoComplete="billing country"
            name="country"
            isRequired
            label="Country"
            items={countries}
            marginEnd="size-100"
            flex={1}>
            {(item) => <Item key={item.code}>{item.name}</Item>}
          </Picker>
        </Flex>
        <Flex>
          <TextField
            autoComplete="billing tel"
            type="tel"
            name="phone"
            label="Phone number"
            marginEnd="size-100"
            flex={1} />
          <TextField
            autoComplete="billing email"
            type="email"
            name="email"
            isRequired
            label="Email address"
            marginEnd="size-100"
            flex={1} />
        </Flex>
      </Well>
      <Well role="group" aria-labelledby="shipping-legend">
        <h2 id="shipping-legend" className={typographyStyles['spectrum-Heading4']}>
          Shipping address
        </h2>
        <Checkbox isSelected={checked} onChange={setChecked}>
          Same as billing address
        </Checkbox>
        {!checked && (
          <>
            <Flex>
              <TextField
                autoComplete="shipping given-name"
                name="shippingFirstName"
                isRequired
                label="First Name"
                marginEnd="size-100"
                flex={1} />
              <TextField
                autoComplete="shipping family-name"
                name="shippingLastName"
                isRequired
                label="Last Name"
                flex={1} />
            </Flex>
            <Flex>
              <TextArea
                autoComplete="shipping street-address"
                name="shippingStreetAddress"
                isRequired
                label="Street Address"
                flex={1} />
            </Flex>
            <Flex>
              <TextField
                autoComplete="shipping address-level2"
                name="shippingCity"
                isRequired
                label="City"
                marginEnd="size-100"
                flex={1} />
              <Picker
                autoComplete="shipping address-level1"
                name="shippingState"
                isRequired
                label="State"
                items={states}
                marginEnd="size-100"
                flex={1}>
                {(item) => <Item key={item.abbr}>{item.name}</Item>}
              </Picker>
              <TextField
                autoComplete="shipping postal-code"
                name="shippingZip"
                isRequired
                label="Zip code"
                flex={1} />
            </Flex>
            <Flex>
              <Picker
                autoComplete="shipping country"
                name="shippingCountry"
                isRequired
                label="Country"
                items={countries}
                marginEnd="size-100"
                flex={1}>
                {(item) => <Item key={item.code}>{item.name}</Item>}
              </Picker>
            </Flex>
            <Flex>
              <TextField
                autoComplete="shipping tel"
                type="tel"
                name="shippingPhone"
                label="Phone number"
                marginEnd="size-100"
                flex={1} />
              <TextField
                autoComplete="shipping email"
                type="email"
                name="shippingEmail"
                isRequired
                label="Email address"
                marginEnd="size-100"
                flex={1} />
            </Flex>
          </>
        )}
      </Well>
    </Form>
  );
};

FieldsWithAutoCompleteProperty.story = {
  name: 'fields with autoComplete property'
};

export const IsRequiredTrue = () => render({isRequired: true});

IsRequiredTrue.story = {
  name: 'isRequired: true'
};

export const IsRequiredTrueNecessityIndicatorLabel = () =>
  render({isRequired: true, necessityIndicator: 'label'});

IsRequiredTrueNecessityIndicatorLabel.story = {
  name: 'isRequired: true, necessityIndicator: label'
};

export const IsRequiredFalseNecessityIndicatorLabel = () =>
  render({isRequired: false, necessityIndicator: 'label'});

IsRequiredFalseNecessityIndicatorLabel.story = {
  name: 'isRequired: false, necessityIndicator: label'
};

export const IsDisabled = () => render({isDisabled: true});

IsDisabled.story = {
  name: 'isDisabled'
};

export const IsQuiet = () => render({isQuiet: true});

IsQuiet.story = {
  name: 'isQuiet'
};

export const IsQuietLabelPositionSide = () => render({isQuiet: true, labelPosition: 'side'});

IsQuietLabelPositionSide.story = {
  name: 'isQuiet, labelPosition: side'
};

export const IsEmphasized = () => render({isEmphasized: true});

IsEmphasized.story = {
  name: 'isEmphasized'
};

export const ValidationStateInvalid = () => render({validationState: 'invalid'});

ValidationStateInvalid.story = {
  name: 'validationState: invalid'
};

export const ValidationStateValid = () => render({validationState: 'valid'});

ValidationStateValid.story = {
  name: 'validationState: valid'
};

export const ValidationStateInvalidIsQuietTrue = () =>
  render({validationState: 'invalid', isQuiet: true});

ValidationStateInvalidIsQuietTrue.story = {
  name: 'validationState: invalid, isQuiet: true'
};

export const ValidationStateValidIsQuietTrue = () =>
  render({validationState: 'valid', isQuiet: true});

ValidationStateValidIsQuietTrue.story = {
  name: 'validationState: valid, isQuiet: true'
};

export const FormWithReset = () => <FormWithControls />;

FormWithReset.story = {
  name: 'form with reset'
};


export const _FormWithSubmit = () => <FormWithSubmit />;

_FormWithSubmit.story = {
  name: 'form with submit'
};

export const FormWithNumberfieldAndLocaleArAe = () => (
  <Flex gap="size-100">
    <NumberField label="Outside form" description="Hello" />
    <Form>
      <NumberField label="Inside form" />
    </Form>
    <Form>
      <TextField label="First Name" />
    </Form>
    <Form>
      <TextField label="First Name" />
      <NumberField label="Inside form" />
    </Form>
  </Flex>
);

FormWithNumberfieldAndLocaleArAe.story = {
  name: 'form with numberfield and locale=ar-AE'
};

export const WithTranslations = () => <FormTranslatedText />;

WithTranslations.story = {
  name: 'with translations',
  parameters: {description: {data: 'Translations included for: Arabic, English, Hebrew, Japanese, Korean, Simplified Chinese, and Traditional Chinese.'}}
};

function render(props: any = {}) {
  return (
    <Form {...props}>
      <CheckboxGroup label="Pets" name="pets" validate={v => v.includes('dogs') ? 'No dogs' : null}>
        <Checkbox value="dogs">Dogs</Checkbox>
        <Checkbox value="cats">Cats</Checkbox>
        <Checkbox value="dragons">Dragons</Checkbox>
      </CheckboxGroup>
      <ComboBox label="More Animals" name="combobox">
        <Item key="red panda">Red Panda</Item>
        <Item key="aardvark">Aardvark</Item>
        <Item key="kangaroo">Kangaroo</Item>
        <Item key="snake">Snake</Item>
      </ComboBox>
      <SearchAutocomplete label="Search Animals" name="searchAutocomplete">
        <Item key="red panda">Red Panda</Item>
        <Item key="aardvark">Aardvark</Item>
        <Item key="kangaroo">Kangaroo</Item>
        <Item key="snake">Snake</Item>
      </SearchAutocomplete>
      <NumberField label="Years lived there" name="years" />
      <Picker label="State" items={states} name="state">
        {item => <Item key={item.abbr}>{item.name}</Item>}
      </Picker>
      <Picker label="Country" items={countries} name="country">
        {item => <Item key={item.name}>{item.name}</Item>}
      </Picker>
      <Picker label="Favorite color" name="color" description="Select any color you like." errorMessage="Please select a nicer color.">
        <Item>Red</Item>
        <Item>Orange</Item>
        <Item>Yellow</Item>
        <Item>Green</Item>
        <Item>Blue</Item>
        <Item>Purple</Item>
      </Picker>
      <RadioGroup label="Favorite pet" name="favorite-pet-group">
        <Radio value="dogs">Dogs</Radio>
        <Radio value="cats">Cats</Radio>
        <Radio value="dragons">Dragons</Radio>
      </RadioGroup>
      <SearchField label="Search" name="search" />
      <Switch name="switch">Low power mode</Switch>
      <TextArea name="comments" label="Comments" description="Express yourself!" errorMessage="No wrong answers, except for this one." />
      <TextField
        label="City"
        name="city"
        contextualHelp={(
          <ContextualHelp>
            <Heading>What is a segment?</Heading>
            <Content>Segments identify who your visitors are, what devices and services they use, where they navigated from, and much more.</Content>
          </ContextualHelp>
        )} />
      <TextField label="Zip code" description="Please enter a five-digit zip code." pattern="[0-9]{5}" name="zip" />
      <TagGroup label="Favorite tags" description="Select your favorite tags." errorMessage="Incorrect combination of tags.">
        <Item key="1">Cool Tag 1</Item>
        <Item key="2">Cool Tag 2</Item>
        <Item key="3">Cool Tag 3</Item>
        <Item key="4">Cool Tag 4</Item>
        <Item key="5">Cool Tag 5</Item>
        <Item key="6">Cool Tag 6</Item>
      </TagGroup>
      <ColorField label="Color" name="color" />
      <DateField label="Date" granularity="minute" name="date" />
      <TimeField label="Time" name="time" />
      <DatePicker label="Date picker" name="datePicker" />
      <DateRangePicker label="Date range" startName="startDate" endName="endDate" />
      <TextField type="email" label="Email" name="email" />
      {props.showSubmit && (
        <ButtonGroup>
          <Button variant="primary" type="submit">Submit</Button>
          <Button variant="secondary" type="reset">Reset</Button>
        </ButtonGroup>
      )}
    </Form>
  );
}

function FormWithControls(props: any = {}) {
  let [firstName, setFirstName] = useState('hello');
  let [isHunter, setIsHunter] = useState(true);
  let [favoritePet, setFavoritePet] = useState<string | number>('cats');
  let [favoriteColor, setFavoriteColor] = useState('green' as Key);
  let [howIFeel, setHowIFeel] = useState('I feel good, o I feel so good!');
  let [birthday, setBirthday] = useState(new CalendarDate(1732, 2, 22));
  let [money, setMoney] = useState(50);
  let [superSpeed, setSuperSpeed] = useState(true);

  return (
    <Form
      onSubmit={e => {
        action('onSubmit')(Object.fromEntries(new FormData(e.target as HTMLFormElement).entries()));
        e.preventDefault();
      }}
      {...props}>
      <TextField name="first-name" label="First Name (controlled)" value={firstName} onChange={setFirstName} />
      <TextField name="last-name" label="Last Name (uncontrolled)" defaultValue="world" />
      <TextField name="street-address" label="Street Address (uncontrolled)" />
      <Picker name="country" label="Country (uncontrolled)" items={countries}>
        {item => <Item key={item.name}>{item.name}</Item>}
      </Picker>
      <NumberField name="age" label="Age (uncontrolled)" />
      <NumberField name="money" label="Money (controlled)" formatOptions={{style: 'currency', currency: 'USD'}} value={money} onChange={setMoney} />
      <Picker name="favorite-color" label="Favorite color (controlled)" selectedKey={favoriteColor} onSelectionChange={setFavoriteColor}>
        <Item key="red">Red</Item>
        <Item key="orange">Orange</Item>
        <Item key="yellow">Yellow</Item>
        <Item key="green">Green</Item>
        <Item key="blue">Blue</Item>
        <Item key="purple">Purple</Item>
      </Picker>
      <Checkbox name="is-hunter" isSelected={isHunter} onChange={setIsHunter}>I am a hunter! (controlled)</Checkbox>
      <Checkbox name="is-wizard" defaultSelected>I am a wizard! (uncontrolled)</Checkbox>
      <Switch name="airplane-mode">Airplane mode (uncontrolled)</Switch>
      <Switch name="super-speed" isSelected={superSpeed} onChange={setSuperSpeed}>Super speed (controlled)</Switch>
      <RadioGroup label="Favorite pet (controlled)" name="favorite-pet-group" value={favoritePet} onChange={setFavoritePet}>
        <Radio value="dogs">Dogs</Radio>
        <Radio value="cats">Cats</Radio>
        <Radio value="dragons">Dragons</Radio>
      </RadioGroup>
      <RadioGroup label="Favorite pet (uncontrolled)" name="favorite-pet-group2" defaultValue="cats">
        <Radio value="dogs">Dogs</Radio>
        <Radio value="cats">Cats</Radio>
        <Radio value="dragons">Dragons</Radio>
      </RadioGroup>
      <TextArea name="comments-controlled" label="Comments (controlled)" value={howIFeel} onChange={setHowIFeel} />
      <TextArea name="comments-uncontrolled" label="Comments (uncontrolled)" defaultValue="hello" />
      <ComboBox label="Favorite Animal (uncontrolled)" name="favorite-animal" formValue="key">
        <Item key="red panda">Red Panda</Item>
        <Item key="aardvark">Aardvark</Item>
        <Item key="kangaroo">Kangaroo</Item>
        <Item key="snake">Snake</Item>
      </ComboBox>
      <DateField name="date-uncontrolled" label="Birth date (uncontrolled)" />
      <DateField name="date-controlled" label="Birth date (controlled)" value={birthday} onChange={setBirthday} />
      <DateRangePicker startName="trip-start" endName="trip-end" label="Trip dates (uncontrolled)" />
      <Slider name="cookies" label="Cookies (uncontrolled)" defaultValue={50} />
      <ButtonGroup>
        <Button variant="primary" type="submit">Submit</Button>
        <Button variant="secondary" type="reset">Reset</Button>
      </ButtonGroup>
    </Form>
  );
}

function FormWithSubmit() {
  let [policies, setPolicies] = useState<string[]>([]);
  let [policiesDirty, setPoliciesDirty] = useState(false);
  let [pet, setPet] = useState('');
  let [petDirty, setPetDirty] = useState(false);
  let [truth, setTruth] = useState(false);
  let [truthDirty, setTruthDirty] = useState(false);
  let [email, setEmail] = useState('');
  let [emailDirty, setEmailDirty] = useState(false);

  let [formStatus, setFormStatus] = useState<'progress' | 'invalid' | 'valid' | 'fixing'>('progress');
  let [isSubmitted, setSubmitted] = useState(false); // TODO: really should be isSectionInvalid / 'fixing' for each form field. once form is submitted with mistakes, unchecking an unrelated, previously valid field should not make it look invalid.

  let getValidationState = (isValid: boolean): ValidationState | undefined =>
    ['invalid', 'fixing'].includes(formStatus) && !isValid ? 'invalid' : undefined;

  useEffect(() => {
    let validate = (): boolean => policies.length === 3 && !!pet && truth && email.includes('@');
    let formDirty = policiesDirty || petDirty || truthDirty || emailDirty;

    if (isSubmitted) {
      if (formDirty) {
        setFormStatus('fixing');
      } else {
        setFormStatus(validate() ? 'valid' : 'invalid');
      }
    } else {
      setFormStatus('progress');
    }
  }, [policies, policiesDirty, pet, petDirty, truth, truthDirty, email, emailDirty, isSubmitted]);

  let Status = ({formStatus}) => {
    let [variant, setVariant] = useState<'info' | 'negative' | 'positive' | 'notice'>('info');

    useEffect(() => {
      switch (formStatus) {
        case 'invalid':
          return setVariant('negative');
        case 'valid':
          return setVariant('positive');
        case 'fixing':
          return setVariant('notice');
        default:
          return setVariant('info');
      }
    }, [formStatus]);

    return (
      <StatusLight variant={variant}>
        {formStatus === 'progress' && 'In progress'}
        {formStatus === 'valid' && 'Submitted successfully'}
        {formStatus === 'invalid' && 'Error'}
        {formStatus === 'fixing' && 'Fixing mistakes'}
      </StatusLight>
    );
  };

  let handleSubmit: React.FormEventHandler<Element> = (e) => {
    e.preventDefault();
    setPoliciesDirty(false);
    setTruthDirty(false);
    setPetDirty(false);
    setEmailDirty(false);
    setSubmitted(true);
    action('onSubmit')(e);
  };

  let reset = () => {
    setSubmitted(false);
    setPolicies([]);
    setPet('');
    setTruth(false);
    setPoliciesDirty(false);
    setPetDirty(false);
    setTruthDirty(false);
    setEmail('');
    setEmailDirty(false);
    setFormStatus('progress');
  };

  return (
    <Form onSubmit={handleSubmit} isReadOnly={formStatus === 'valid'}>
      <>
        {(formStatus === 'invalid' || formStatus === 'valid') &&
          <InlineAlert variant={formStatus === 'invalid' ? 'negative' : 'positive'}>
            <Header>{formStatus === 'invalid' ? 'Error' : 'Success'}</Header>
            <Content>{formStatus === 'invalid' ? 'There was an error with the form.' : 'Form was successfully completed.'}</Content>
          </InlineAlert>
        }
      </>
      <TextField
        label="Email address"
        type="email"
        value={email}
        onChange={chain(() => setEmailDirty(true), setEmail)}
        validationState={getValidationState(email.includes('@'))}
        errorMessage="Email address must contain @" />
      <CheckboxGroup
        label="Agree to the following"
        isRequired
        value={policies}
        onChange={chain(() => setPoliciesDirty(true), setPolicies)}>
        <Checkbox
          value="terms"
          isRequired
          isInvalid={getValidationState(policies.includes('terms')) === 'invalid'}>
          Terms and conditions
        </Checkbox>
        <Checkbox
          value="privacy"
          isRequired
          isInvalid={getValidationState(policies.includes('privacy')) === 'invalid'}>
          Privacy policy
        </Checkbox>
        <Checkbox
          value="cookies"
          isRequired
          isInvalid={getValidationState(policies.includes('cookies')) === 'invalid'}>
          Cookie policy
        </Checkbox>
      </CheckboxGroup>

      <Checkbox
        isRequired
        value="truth"
        isSelected={truth}
        onChange={(chain(() => setTruthDirty(true), setTruth))}
        isInvalid={getValidationState(truth) === 'invalid'}>
        I am telling the truth
      </Checkbox>

      <RadioGroup
        label="Favorite pet"
        isRequired
        value={pet}
        onChange={chain(() => setPetDirty(true), setPet)}
        isInvalid={getValidationState(Boolean(pet)) === 'invalid'}>
        <Radio value="dogs">
          Dogs
        </Radio>
        <Radio value="cats">
          Cats
        </Radio>
        <Radio value="dragons">
          Dragons
        </Radio>
      </RadioGroup>

      <TagGroup label="Favorite tags">
        <Item key="1">Cool Tag 1</Item>
        <Item key="2">Cool Tag 2</Item>
        <Item key="3">Cool Tag 3</Item>
        <Item key="4">Cool Tag 4</Item>
        <Item key="5">Cool Tag 5</Item>
        <Item key="6">Cool Tag 6</Item>
      </TagGroup>

      <Button variant="cta" type="submit" isDisabled={formStatus === 'valid'}>Submit</Button>
      <Button variant="secondary" type="reset" onPress={reset}>Reset</Button>
      <Status formStatus={formStatus} />
    </Form>
  );
}

export const NativeValidation = () => render({
  isRequired: true,
  validationBehavior: 'native',
  showSubmit: true,
  onSubmit: (e) => {
    e.preventDefault();
    action('onSubmit')(Object.fromEntries(new FormData(e.target as HTMLFormElement).entries()));
  }
});

NativeValidation.story = {
  parameters: {description: {data: 'This story is to test that client validation occurs on form submit and updates when the user commits changes to a field value (e.g. on blur).'}}
};

export function ServerValidation() {
  let [serverErrors, setServerErrors] = useState<any>({});
  let onSubmit = async (e) => {
    e.preventDefault();
    let errors = {};
    for (let el of e.target.elements) {
      errors[el.name] = `Invalid value for "${el.name}".`;
    }
    setServerErrors(errors);
  };

  return render({
    validationBehavior: 'native',
    onSubmit,
    validationErrors: serverErrors,
    showSubmit: true
  });
}

ServerValidation.story = {
  parameters: {description: {data: 'This story is to test that server errors appear after submission, and are cleared when a field is modified.'}}
};

export let NumberFieldFormSubmit = {
  render: () => {
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          action('submitted the form')();
        }}>
        <NumberField label="Number" name="number" />
      </Form>
    );
  },
  parameters: {description: {data: 'Try using "Enter" to submit the form from the NumberField. It should call an action in the actions panel.'}}
};
