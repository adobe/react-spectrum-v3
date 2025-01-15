/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  ActionButton, ActionMenu,
  Button,
  CardPreview,
  Checkbox,
  CoachMark,
  CoachMarkTrigger,
  Content, Footer, Image, Keyboard, MenuItem,
  Slider,
  Text, useTour
} from '../src';
import Filter from '../s2wf-icons/S2_Icon_Filter_20_N.svg';
import type {Meta} from '@storybook/react';
import {Placement} from '@react-types/overlays';
import {style} from '../style' with {type: 'macro'};
import TextAdd from '../s2wf-icons/S2_Icon_TextAdd_20_N.svg';
import TextBold from '../s2wf-icons/S2_Icon_TextBold_20_N.svg';
import TextIcon from '../s2wf-icons/S2_Icon_Text_20_N.svg';
import {Toolbar} from 'react-aria-components';

const meta: Meta<typeof CoachMark> = {
  component: CoachMark,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'radio',
      options: ['top', 'left', 'left top', 'right', 'right top', 'bottom']
    }
  },
  title: 'CoachMark'
};

export default meta;

export const CoachMarkExample = (args) => (
  <CoachMarkTrigger isOpen>
    <Checkbox>Sync with CC</Checkbox>
    <CoachMark placement="right top" {...args}>
      <CardPreview>
        <Image src={new URL('assets/preview.png', import.meta.url).toString()} />
      </CardPreview>
      <Content>
        <Text slot="title">Hello</Text>
        <ActionMenu>
          <MenuItem>Skip tour</MenuItem>
          <MenuItem>Restart tour</MenuItem>
        </ActionMenu>
        <Keyboard>Command + B</Keyboard>
        <Text slot="description">This is the description</Text>
      </Content>
      <Footer>
        <Text slot="steps">1 of 10</Text>
        <Button fillStyle="outline" variant="secondary">Previous</Button>
        <Button variant="primary">Next</Button>
      </Footer>
    </CoachMark>
  </CoachMarkTrigger>
);

function CoachMarkBase({step, currentStep, totalSteps, description = '', skipTour, restartTour, advanceStep, previousStep, hasPressAction = false, placement = 'right top' as Placement}) {
  const onAction = actionKey => {
    if (actionKey === 'skip') {
      skipTour();
    } else if (actionKey === 'restart') {
      restartTour();
    }
  };
  return (
    <CoachMark placement={placement}>
      <CardPreview>
        <Image src={new URL('assets/preview.png', import.meta.url).toString()} />
      </CardPreview>
      <Content>
        <Text slot="title">Coach mark title</Text>
        <ActionMenu onAction={onAction}>
          <MenuItem id="skip">Skip tour</MenuItem>
          {step !== 1 && <MenuItem id="restart">Restart tour</MenuItem>}
        </ActionMenu>
        <Keyboard>Command + B</Keyboard>
        <Text slot="description">{description || 'This is the description'}</Text>
      </Content>
      <Footer>
        <Text slot="steps">{currentStep} of {totalSteps}</Text>
        {step !== 1 && <Button fillStyle="outline" variant="secondary" onPress={previousStep}>Previous</Button>}
        {step !== totalSteps && !hasPressAction && <Button variant="primary" onPress={advanceStep}>Next</Button>}
        {step === totalSteps && !hasPressAction && <Button variant="primary" onPress={advanceStep}>Finish</Button>}
      </Footer>
    </CoachMark>
  );
}

export const TourExample = () => {
  let {coachMarkTriggerProps, ...otherTourProps} = useTour({});
  return (<div className={style({display: 'flex'})}>
    <div className={style({display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 16})}>
      <CoachMarkTrigger {...coachMarkTriggerProps(1)}>
        <ActionButton >
          <Filter />
        </ActionButton>
        <CoachMarkBase step={1} {...otherTourProps} description="This is the action button." />
      </CoachMarkTrigger>

      <CoachMarkTrigger {...coachMarkTriggerProps(3)}>
        <Slider label="Horizontal position" labelPosition="top" />
        <CoachMarkBase step={3} {...otherTourProps} description="Adjust this slider to change the value." />
      </CoachMarkTrigger>

      <CoachMarkTrigger {...coachMarkTriggerProps(4)}>
        <Checkbox>Sync with CC</Checkbox>
        <CoachMarkBase step={4} {...otherTourProps} description="Check this box to sync with Creative Cloud" />
      </CoachMarkTrigger>
    </div>
    <div style={{width: 500}} />
    <div className={style({display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'end'})}>
      <CoachMarkTrigger {...coachMarkTriggerProps(2)}>
        <Button onPress={otherTourProps.advanceStep}>
          Apply
        </Button>
        <CoachMarkBase
          step={2}
          placement="left top"
          {...otherTourProps}
          description="This is the Apply button. Press it to continue the tour."
          hasPressAction />
      </CoachMarkTrigger>

      <CoachMarkTrigger {...coachMarkTriggerProps(5)}>
        <Toolbar orientation="vertical">
          <ActionButton isQuiet>
            <TextIcon />
          </ActionButton>
          <ActionButton isQuiet>
            <TextAdd />
          </ActionButton>
          <ActionButton isQuiet>
            <TextBold />
          </ActionButton>
        </Toolbar>
        <CoachMarkBase
          step={5}
          placement="left top"
          {...otherTourProps}
          description="Use this toolbar to adjust text values." />
      </CoachMarkTrigger>
    </div>
  </div>);
};
