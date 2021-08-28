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

import {Badge} from '../';
import CheckmarkCircle from '@spectrum-icons/workflow/src/CheckmarkCircle';
import {Meta, Story} from '@storybook/react';
import React from 'react';
import {SpectrumBadgeProps} from '@react-types/badge';
import {Text} from '@react-spectrum/text';

let meta: Meta<SpectrumBadgeProps> = {
  title: 'Badge',
  component: Badge
};

export default meta;

let Template = (): Story<SpectrumBadgeProps> => (args) => (
  <Badge {...args} />
);

export let BadgeTextOnly = Template().bind({});
BadgeTextOnly.args = {variant: 'neutral', children: 'Badge of honor'};

export let BadgeWithIcon = Template().bind({});
BadgeWithIcon.args = {variant: 'neutral', children: <><CheckmarkCircle /><Text>Badge of honor</Text></>};

export let BadgeReverseOrderIcon = Template().bind({});
BadgeReverseOrderIcon.args = {variant: 'neutral', children: <><Text>Badge of honor</Text><CheckmarkCircle /></>};

export let BadgeYellow = Template().bind({});
BadgeYellow.args = {...BadgeWithIcon.args, variant: 'yellow'};

export let BadgeFuchsia = Template().bind({});
BadgeFuchsia.args = {...BadgeWithIcon.args, variant: 'fuchsia'};

export let BadgeIndigo = Template().bind({});
BadgeIndigo.args = {...BadgeWithIcon.args, variant: 'indigo'};

export let BadgeSeafoam = Template().bind({});
BadgeSeafoam.args = {...BadgeWithIcon.args, variant: 'seafoam'};

export let BadgeMagenta = Template().bind({});
BadgeMagenta.args = {...BadgeWithIcon.args, variant: 'magenta'};

export let BadgePurple = Template().bind({});
BadgePurple.args = {...BadgeWithIcon.args, variant: 'purple'};

export let BadgeNeutral = Template().bind({});
BadgeNeutral.args = {...BadgeWithIcon.args, variant: 'neutral'};

export let BadgeInfo = Template().bind({});
BadgeInfo.args = {...BadgeWithIcon.args, variant: 'info'};

export let BadgePositive = Template().bind({});
BadgePositive.args = {...BadgeWithIcon.args, variant: 'positive'};

export let BadgeNegative = Template().bind({});
BadgeNegative.args = {...BadgeWithIcon.args, variant: 'negative'};

export let BadgeAnchorTop = Template().bind({});
BadgeAnchorTop.args = {...BadgeWithIcon.args, anchorEdge: 'top'};

export let BadgeAnchorRight = Template().bind({});
BadgeAnchorRight.args = {...BadgeWithIcon.args, anchorEdge: 'right'};

export let BadgeAnchorBottom = Template().bind({});
BadgeAnchorBottom.args = {...BadgeWithIcon.args, anchorEdge: 'bottom'};

export let BadgeAnchorLeft = Template().bind({});
BadgeAnchorLeft.args = {...BadgeWithIcon.args, anchorEdge: 'left'};

export let BadgeSizeLarge = Template().bind({});
BadgeSizeLarge.args = {...BadgeWithIcon.args, size: 'L'};
