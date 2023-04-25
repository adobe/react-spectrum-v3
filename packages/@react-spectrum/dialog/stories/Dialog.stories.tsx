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
import {ActionButton, Button} from '@react-spectrum/button';
import {AlertDialog, Dialog, DialogTrigger} from '../';
import {ButtonGroup} from '@react-spectrum/buttongroup';
import {Checkbox} from '@react-spectrum/checkbox';
import {Content, Footer, Header} from '@react-spectrum/view';
import {Divider} from '@react-spectrum/divider';
import {Flex} from '@react-spectrum/layout';
import {Form} from '@react-spectrum/form';
import {Heading, Text} from '@react-spectrum/text';
import {Image} from '@react-spectrum/image';
import {Item, Picker} from '@react-spectrum/picker';
import {Radio, RadioGroup} from '@react-spectrum/radio';
import React, {useState} from 'react';
import {SpectrumAlertDialogProps} from '@react-types/dialog';
import {storiesOf} from '@storybook/react';
import {TextField} from '@react-spectrum/textfield';

storiesOf('Dialog', module)
  .addParameters({providerSwitcher: {status: 'notice'}})
  .add(
    'default',
    () => render({})
  )
  .add(
  'isDismissable',
  () => render({isDismissable: true})
  )
  .add(
    'long content',
    () => renderLongContent({})
  )
  .add(
    'with hero',
    () => renderHero({})
  )
  .add(
    'with hero, isDimissable',
    () => renderHero({isDismissable: true})
  )
  .add(
    'with footer',
    () => renderFooter({})
  )
  .add(
    'small',
    () => render({size: 'S'})
  )
  .add(
    'medium',
    () => render({size: 'M'})
  )
  .add(
    'large',
    () => render({size: 'L'})
  )
  .add(
    'form',
    () => renderWithForm({})
  )
  .add(
    'fullscreenTakeover form',
    () => renderWithForm({type: 'fullscreenTakeover'})
  )
  .add(
    'three buttons',
    () => renderWithThreeButtons({})
  )
  .add(
    'three buttons, vertical orientation',
    () => renderWithThreeButtonsVertical({})
  )
  .add(
    'three buttons, footer',
    () => <RenderWithThreeButtonsAndFooter />
  )
  .add(
    'cleared content',
    () => renderWithDividerInContent({})
  )
  .add(
    'with iframe',
    () => renderIframe({})
  );

storiesOf('Dialog/Alert', module)
  .add(
    'destructive',
    () => renderAlert({
      variant: 'destructive',
      title: 'Warning Destructive',
      children: singleParagraph(),
      primaryActionLabel: 'Accept',
      cancelLabel: 'Cancel',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel')
    })
  )
  .add(
    'confirmation',
    () => renderAlert({
      variant: 'confirmation',
      title: 'Confirmation Required',
      children: singleParagraph(),
      primaryActionLabel: 'Accept',
      cancelLabel: 'Cancel',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel')
    })
  )
  .add(
    'information',
    () => renderAlert({
      variant: 'information',
      title: 'Informative Alert',
      children: singleParagraph(),
      primaryActionLabel: 'Accept',
      cancelLabel: 'Cancel',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel')
    })
  )
  .add(
    'error',
    () => renderAlert({
      variant: 'error',
      title: 'Error: Danger Will Robinson',
      children: singleParagraph(),
      primaryActionLabel: 'Accept',
      cancelLabel: 'Cancel',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel')
    })
  )
  .add(
    'warning',
    () => renderAlert({
      variant: 'warning',
      title: 'This is a warning',
      children: singleParagraph(),
      primaryActionLabel: 'Accept',
      cancelLabel: 'Cancel',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel')
    })
  )
  .add(
    'primary disabled',
    () => renderAlert({
      variant: 'error',
      title: 'Error: Danger Will Robinson',
      children: singleParagraph(),
      primaryActionLabel: 'Accept',
      cancelLabel: 'Cancel',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel'),
      isPrimaryActionDisabled: true
    })
  )
  .add(
    'autoFocus primary',
    () => renderAlert({
      variant: 'error',
      title: 'Error: Danger Will Robinson',
      children: singleParagraph(),
      primaryActionLabel: 'Accept',
      cancelLabel: 'Cancel',
      secondaryActionLabel: 'Secondary button',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel'),
      autoFocusButton: 'primary'
    })
  )
  .add(
    'secondary disabled',
    () => renderAlert({
      variant: 'error',
      title: 'Error: Danger Will Robinson',
      children: singleParagraph(),
      primaryActionLabel: 'Accept',
      secondaryActionLabel: 'Secondary button',
      cancelLabel: 'Cancel',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel'),
      isSecondaryActionDisabled: true
    })
  )
  .add(
    'autoFocus secondary',
    () => renderAlert({
      variant: 'error',
      title: 'Error: Danger Will Robinson',
      children: singleParagraph(),
      primaryActionLabel: 'Accept',
      cancelLabel: 'Cancel',
      secondaryActionLabel: 'Secondary button',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel'),
      autoFocusButton: 'secondary'
    })
  )
  .add(
    'autoFocus cancel',
    () => renderAlert({
      variant: 'error',
      title: 'Error: Danger Will Robinson',
      children: singleParagraph(),
      primaryActionLabel: 'Accept',
      cancelLabel: 'Cancel',
      secondaryActionLabel: 'Secondary button',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel'),
      autoFocusButton: 'cancel'
    })
  )
  .add(
    'allowsKeyboardConfirmation',
    () => renderAlert({
      variant: 'error',
      title: 'Error: Danger Will Robinson',
      children: singleParagraph(),
      primaryActionLabel: 'Accept',
      cancelLabel: 'Cancel',
      secondaryActionLabel: 'Secondary button',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel'),
      allowsKeyboardConfirmation: true
    })
  )
  .add(
    'alert with content actions',
    () => renderWithContentButtons({
      variant: 'error',
      title: 'Error: Danger Will Robinson',
      primaryActionLabel: 'Accept',
      cancelLabel: 'Cancel',
      onPrimaryAction: action('primary'),
      onSecondaryAction: action('secondary'),
      onCancel: action('cancel'),
      allowsKeyboardConfirmation: true
    }),
    {description: {data: 'Pressing enter when focused on the counter button should not keyboard confirm the dialog.'}}
  );

function renderWithContentButtons(props) {
  return (
    <div style={{display: 'flex', width: 'auto', margin: '100px 0'}}>
      <DialogTrigger defaultOpen>
        <ActionButton>Trigger</ActionButton>
        <AlertDialog {...props} onPrimaryAction={action('primary')} onSecondaryAction={action('secondary')} onCancel={props.onCancel}>
          <Counter />
        </AlertDialog>
      </DialogTrigger>
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0);

  const handleIncrement = () => {
    setCount(prevCount => prevCount + 1);
  };

  const handleDecrement = () => {
    setCount(prevCount => prevCount - 1);
  };

  return (
    <div>
      <Flex gap={'size-300'} direction="column" alignItems="center">
        <Flex>
          <div>Count is {count}</div>
        </Flex>
        <Flex gap={'size-100'} direction="row">
          <button onClick={handleDecrement}>-</button>
          <button onClick={handleIncrement}>+</button>
        </Flex>
        <Flex>
          <button onClick={() => setCount(0)}>Reset</button>
        </Flex>
      </Flex>
    </div>
  );
}

function render({width = 'auto', isDismissable = undefined, ...props}) {
  return (
    <div style={{display: 'flex', width, margin: '100px 0'}}>
      <DialogTrigger isDismissable={isDismissable} defaultOpen>
        <ActionButton>Trigger</ActionButton>
        {(close) => (
          <Dialog {...props}>
            <Heading>The Heading</Heading>
            <Header>The Header</Header>
            <Divider />
            <Content>{singleParagraph()}</Content>
            {!isDismissable &&
              <ButtonGroup>
                <Button variant="secondary" onPress={close}>Cancel</Button>
                <Button variant="cta" onPress={close}>Confirm</Button>
              </ButtonGroup>}
          </Dialog>
        )}
      </DialogTrigger>
    </div>
  );
}

function renderIframe({width = 'auto', isDismissable = undefined, ...props}) {
  return (
    <div style={{display: 'flex', width, margin: '100px 0'}}>
      <DialogTrigger isDismissable={isDismissable} defaultOpen>
        <ActionButton>Trigger</ActionButton>
        {(close) => (
          <Dialog {...props}>
            <Heading>The Heading</Heading>
            <Header>The Header</Header>
            <Divider />
            <Content>
              <iframe width="100%" title="wikipedia" src="https://wikipedia.org/wiki/Main_Page" />
            </Content>
            {!isDismissable &&
              <ButtonGroup>
                <Button variant="secondary" onPress={close}>Cancel</Button>
                <Button variant="cta" onPress={close}>Confirm</Button>
              </ButtonGroup>}
          </Dialog>
        )}
      </DialogTrigger>
    </div>
  );
}

function renderHero({width = 'auto', isDismissable = undefined, ...props}) {
  return (
    <div style={{display: 'flex', width, margin: '100px 0'}}>
      <DialogTrigger isDismissable={isDismissable} defaultOpen>
        <ActionButton>Trigger</ActionButton>
        {(close) => (
          <Dialog {...props}>
            <Image slot="hero" alt="" src="https://i.imgur.com/Z7AzH2c.png" objectFit="cover" />
            <Heading>The Heading</Heading>
            <Header>The Header</Header>
            <Divider />
            <Content>{singleParagraph()}</Content>
            {!isDismissable &&
              <ButtonGroup>
                <Button variant="secondary" onPress={close}>Cancel</Button>
                <Button variant="cta" onPress={close}>Confirm</Button>
              </ButtonGroup>}
          </Dialog>
          )}
      </DialogTrigger>
    </div>
  );
}

function renderFooter({width = 'auto', isDismissable = undefined, ...props}) {
  return (
    <div style={{display: 'flex', width, margin: '100px 0'}}>
      <DialogTrigger isDismissable={isDismissable} defaultOpen>
        <ActionButton>Trigger</ActionButton>
        {(close) => (
          <Dialog {...props}>
            <Heading>The Heading</Heading>
            <Header>The Header</Header>
            <Divider />
            <Content>{singleParagraph()}</Content>
            <Footer><Checkbox>I accept</Checkbox></Footer>
            {!isDismissable &&
            <ButtonGroup>
              <Button variant="secondary" onPress={close}>Cancel</Button>
              <Button variant="cta" onPress={close}>Confirm</Button>
            </ButtonGroup>}
          </Dialog>
        )}
      </DialogTrigger>
    </div>
  );
}

function renderAlert({...props}: SpectrumAlertDialogProps) {
  return (
    <div style={{display: 'flex', width: 'auto', margin: '100px 0'}}>
      <DialogTrigger defaultOpen>
        <ActionButton>Trigger</ActionButton>
        <AlertDialog {...props} onPrimaryAction={action('primary')} onSecondaryAction={action('secondary')} onCancel={props.onCancel} />
      </DialogTrigger>
    </div>
  );
}


function renderWithForm({width = 'auto', ...props}) {
  return (
    <div style={{display: 'flex', width, margin: '100px 0'}}>
      <DialogTrigger defaultOpen type={props.type}>
        <ActionButton>Trigger</ActionButton>
        {(close) => (
          <Dialog {...props}>
            <Heading>The Heading</Heading>
            <Header>The Header</Header>
            <Divider />
            <Content>
              <Form>
                <TextField label="Last Words" autoFocus />
                <Checkbox>Acknowledge robot overlords</Checkbox>
                <Picker isDisabled>
                  <Item key="Aardvark">Aardvark</Item>
                  <Item key="Kangaroo">Kangaroo</Item>
                  <Item key="Snake">Snake</Item>
                </Picker>
                <Button UNSAFE_style={{display: 'none'}} variant="primary">Hidden</Button>
                <Button UNSAFE_style={{visibility: 'hidden', position: 'absolute'}} variant="primary">Hidden</Button>
                <RadioGroup label="Preferred Job" name="jobs">
                  <Radio value="battery">Battery</Radio>
                  <Radio value="storage">Information Storage</Radio>
                  <Radio value="processor">Processor</Radio>
                  <Radio value="zoo">Zoo stock</Radio>
                  <Radio value="translator">Emotional Translator</Radio>
                  <Radio value="hunter">Bounty Hunter</Radio>
                  <Radio value="actor">Actor</Radio>
                  <Radio value="tester">Waterslide Tester</Radio>
                  <Radio value="psychiatrist">Psychiatrist</Radio>
                </RadioGroup>
              </Form>
            </Content>
            <ButtonGroup>
              <Button variant="secondary" onPress={close}>Cancel</Button>
              <Button variant="cta" onPress={close}>Confirm</Button>
            </ButtonGroup>
          </Dialog>
        )}
      </DialogTrigger>
    </div>
  );
}
let singleParagraph = () => <Text>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sit amet tristique risus. In sit amet suscipit lorem. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In condimentum imperdiet metus non condimentum. Duis eu velit et quam accumsan tempus at id velit. Duis elementum elementum purus, id tempus mauris posuere a. Nunc vestibulum sapien pellentesque lectus commodo ornare.</Text>;
let fiveParagraphs = () => (
  <React.Fragment>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mi proin sed libero enim. Mattis ullamcorper velit sed ullamcorper morbi tincidunt. Sed enim ut sem viverra aliquet eget sit amet tellus. Diam quis enim lobortis scelerisque fermentum dui faucibus in ornare. Diam quam nulla porttitor massa id. Eleifend mi in nulla posuere sollicitudin. Turpis nunc eget lorem dolor sed viverra ipsum nunc. Faucibus in ornare quam viverra. Risus commodo viverra maecenas accumsan lacus vel facilisis volutpat est. Nam libero justo laoreet sit amet cursus sit. Netus et malesuada fames ac. Dictum fusce ut placerat orci nulla pellentesque dignissim enim sit. Eros donec ac odio tempor orci. Ut etiam sit amet nisl purus in mollis nunc. Nisl rhoncus mattis rhoncus urna neque viverra. Convallis aenean et tortor at risus. Diam phasellus vestibulum lorem sed risus ultricies.</p>
    <p>Eleifend quam adipiscing vitae proin sagittis nisl. Diam donec adipiscing tristique risus. In fermentum posuere urna nec tincidunt praesent semper. Suspendisse in est ante in. Egestas diam in arcu cursus euismod quis viverra nibh cras. Aliquam sem fringilla ut morbi tincidunt augue interdum. Lacus sed turpis tincidunt id aliquet risus feugiat. Praesent semper feugiat nibh sed pulvinar proin. In massa tempor nec feugiat nisl pretium fusce id velit. Non nisi est sit amet facilisis. Mi in nulla posuere sollicitudin aliquam ultrices. Morbi leo urna molestie at elementum. Laoreet non curabitur gravida arcu ac tortor dignissim convallis. Risus quis varius quam quisque id. Platea dictumst quisque sagittis purus. Etiam non quam lacus suspendisse faucibus interdum posuere. Semper feugiat nibh sed pulvinar proin gravida hendrerit lectus.</p>
    <p>Risus ultricies tristique nulla aliquet enim tortor at. Ac placerat vestibulum lectus mauris. Sed viverra tellus in hac habitasse platea dictumst vestibulum rhoncus. Suspendisse ultrices gravida dictum fusce ut placerat orci nulla pellentesque. Sit amet nulla facilisi morbi tempus iaculis urna. Ut etiam sit amet nisl purus in. Risus at ultrices mi tempus imperdiet. Magna fermentum iaculis eu non diam phasellus. Orci sagittis eu volutpat odio. Volutpat blandit aliquam etiam erat velit scelerisque in dictum non. Amet nulla facilisi morbi tempus iaculis urna id. Iaculis eu non diam phasellus. Eu lobortis elementum nibh tellus molestie nunc. At tempor commodo ullamcorper a lacus vestibulum sed. Mi sit amet mauris commodo quis. Tellus elementum sagittis vitae et leo duis. Vel risus commodo viverra maecenas accumsan lacus.</p>
    <p>Ut porttitor leo a diam sollicitudin tempor id eu nisl. Tristique senectus et netus et malesuada fames ac turpis egestas. Tellus in hac habitasse platea dictumst vestibulum rhoncus est. Integer feugiat scelerisque varius morbi enim nunc faucibus a. Tempus quam pellentesque nec nam aliquam sem et. Quam viverra orci sagittis eu volutpat odio facilisis mauris. Nunc lobortis mattis aliquam faucibus purus in massa tempor. Tincidunt dui ut ornare lectus sit amet est. Magna fermentum iaculis eu non. Posuere sollicitudin aliquam ultrices sagittis orci a scelerisque. Vitae aliquet nec ullamcorper sit amet risus nullam eget felis. Vitae proin sagittis nisl rhoncus mattis rhoncus. Nunc vel risus commodo viverra maecenas. Diam in arcu cursus euismod. Dolor morbi non arcu risus quis varius quam. Amet nisl suscipit adipiscing bibendum. Nulla pellentesque dignissim enim sit amet venenatis. Nunc congue nisi vitae suscipit tellus mauris a diam maecenas. In hac habitasse platea dictumst vestibulum rhoncus est pellentesque elit</p>
    <p>Cras semper auctor neque vitae tempus quam pellentesque nec. Maecenas ultricies mi eget mauris pharetra et ultrices neque ornare. Vulputate enim nulla aliquet porttitor lacus luctus accumsan tortor posuere. Pellentesque habitant morbi tristique senectus et. Ipsum dolor sit amet consectetur adipiscing elit pellentesque. Sem et tortor consequat id porta nibh venenatis. Viverra nibh cras pulvinar mattis nunc sed blandit. Urna porttitor rhoncus dolor purus. Vivamus arcu felis bibendum ut. Cras sed felis eget velit aliquet. Sed tempus urna et pharetra pharetra. Viverra adipiscing at in tellus integer feugiat scelerisque varius morbi. Ac tortor vitae purus faucibus ornare suspendisse sed nisi lacus. Ultrices neque ornare aenean euismod elementum nisi quis eleifend quam. Vel turpis nunc eget lorem. Quisque egestas diam in arcu cursus euismod quis viverra. At tempor commodo ullamcorper a lacus vestibulum sed. Id aliquet lectus proin nibh nisl condimentum id venenatis. Quis viverra nibh cras pulvinar. Purus in mollis nunc sed.</p>
  </React.Fragment>
);

function renderLongContent({width = 'auto', ...props}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'start', width, padding: '0 20px'}}>
      <p>
        Test instructions on mobile:
        <ol>
          <li>Scroll down and open dialog.</li>
          <li>Tap on the top input. Dialog should resize when the keyboard comes up and remain at the top of the screen. The rest of the page should not scroll (the first time you do this it may scroll slightly due to the bottom toolbar showing).</li>
          <li>Close the software keyboard.</li>
          <li>Scroll down and tap on the bottom input. Dialog should resize as before, and focused input should scroll into view.</li>
          <li>Tap the previous button in the software keyboard. Focus should move to the first input in the dialog. Dialog should not move and page should not scroll.</li>
          <li>Tap the previous button again. Focus should stay on the first input in the dialog and not move out to the textfield outside the dialog. The page may jump slightly, and come back but there is nothing we can do about this.</li>
        </ol>
        Note: all this only works outside the storybook iframe due to VisualViewport limitations.
      </p>
      <TextField label="Outer textfield" />
      {fiveParagraphs()}
      <DialogTrigger>
        <ActionButton>Trigger</ActionButton>
        {(close) => (
          <Dialog {...props}>
            <Heading>The Heading is also very long and demonstrates what happens if there is no Header</Heading>
            <Divider />
            <Content>
              <TextField label="Top textfield" />
              {fiveParagraphs()}
              <TextField label="Bottom textfield" />
            </Content>
            <ButtonGroup>
              <Button variant="secondary" onPress={close}>Cancel</Button>
              <Button variant="cta" onPress={close} autoFocus>Confirm</Button>
            </ButtonGroup>
          </Dialog>
        )}
      </DialogTrigger>
      {fiveParagraphs()}
    </div>
  );
}

function renderWithThreeButtons({width = 'auto', ...props}) {
  return (
    <div style={{display: 'flex', width, margin: '100px 0'}}>
      <DialogTrigger defaultOpen>
        <ActionButton>Trigger</ActionButton>
        {(close) => (
          <Dialog {...props}>
            <Heading>The Heading</Heading>
            <Header>The Header</Header>
            <Divider />
            <Content>{singleParagraph()}</Content>
            <ButtonGroup>
              <Button variant="secondary" onPress={close}>Secondary</Button>
              <Button variant="primary" onPress={close}>Primary</Button>
              <Button variant="cta" onPress={close} autoFocus>CTA</Button>
            </ButtonGroup>
          </Dialog>
        )}
      </DialogTrigger>
    </div>
  );
}

function renderWithThreeButtonsVertical({width = 'auto', ...props}) {
  return (
    <div style={{display: 'flex', width, margin: '100px 0'}}>
      <DialogTrigger defaultOpen>
        <ActionButton>Trigger</ActionButton>
        {(close) => (
          <Dialog {...props}>
            <Heading>The Heading</Heading>
            <Divider />
            <Content>{singleParagraph()}</Content>
            <ButtonGroup orientation="vertical">
              <Button variant="secondary" onPress={close}>Secondary</Button>
              <Button variant="primary" onPress={close}>Primary</Button>
              <Button variant="cta" onPress={close} autoFocus>CTA</Button>
            </ButtonGroup>
          </Dialog>
        )}
      </DialogTrigger>
    </div>
  );
}

function RenderWithThreeButtonsAndFooter({width = 'auto', ...props}) {
  let labels = [
    {
      heading: 'The Heading',
      checkboxLabel: 'I have read and accept',
      secondaryButtonLabel: 'Secondary',
      primaryButtonLabel: 'Primary'
    }, {
      heading: 'Terms of Service',
      checkboxLabel: 'I have read and accept the terms of use and privacy policy',
      secondaryButtonLabel: 'Secondary and best button',
      primaryButtonLabel: 'Primary and worst'
    }
  ];
  let [whichLabels, setWhichLabels] = useState(0);

  return (
    <div style={{display: 'flex', width, margin: '100px 0'}}>
      <Button variant="primary" onPress={() => {whichLabels ? setWhichLabels(0) : setWhichLabels(1);}}>Toggle labels</Button>
      <DialogTrigger defaultOpen>
        <ActionButton>Trigger</ActionButton>
        {(close) => (
          <Dialog {...props}>
            <Heading>{labels[whichLabels].heading}</Heading>
            <Header>The Header</Header>
            <Divider />
            <Content>{singleParagraph()}</Content>
            <Footer><Checkbox>{labels[whichLabels].checkboxLabel}</Checkbox></Footer>
            <ButtonGroup>
              <Button variant="secondary" onPress={close}>{labels[whichLabels].secondaryButtonLabel}</Button>
              <Button variant="primary" onPress={close}>{labels[whichLabels].primaryButtonLabel}</Button>
              <Button variant="cta" onPress={close} autoFocus>CTA</Button>
            </ButtonGroup>
          </Dialog>
        )}
      </DialogTrigger>
    </div>
  );
}

function renderWithDividerInContent({width = 'auto', ...props}) {
  return (
    <div style={{display: 'flex', width, margin: '100px 0'}}>
      <DialogTrigger defaultOpen>
        <ActionButton>Trigger</ActionButton>
        {(close) => (
          <Dialog {...props}>
            <Heading>The Heading</Heading>
            <Header>The Header</Header>
            <Divider />
            <Content>
              <Flex UNSAFE_style={{padding: '10px'}}>
                <Text flexGrow={1} flexBasis={0}>Column number one. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>
                <Divider flexShrink={0} marginStart={10} marginEnd={10} orientation="vertical" size="S" />
                <Text flexGrow={1} flexBasis={0}>Column number two. Eleifend quam adipiscing vitae proin sagittis nisl. Diam donec adipiscing tristique risus.</Text>
              </Flex>
            </Content>
            <ButtonGroup>
              <Button variant="primary" onPress={close}>Primary</Button>
              <Button variant="cta" onPress={close} autoFocus>CTA</Button>
            </ButtonGroup>
          </Dialog>
        )}
      </DialogTrigger>
    </div>
  );
}
