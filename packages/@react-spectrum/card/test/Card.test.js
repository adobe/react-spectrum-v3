/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Card} from '../src';
import {composeStories} from '@storybook/react';
import * as defaultStories from '../chromatic/Card.stories';
import {pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import * as quietStories from '../chromatic/QuietCard.stories';
import React from 'react';
import userEvent from '@testing-library/user-event';

let {Default, DefaultPreviewAlt, NoDescription} = composeStories(defaultStories);
let {Quiet} = composeStories(quietStories);

let isOldReact = parseInt(React.version, 10) < 18;

describe('Card', function () {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });
  it('Default is labelled and described', async function () {
    let {getByRole, getByLabelText, getAllByRole} = render(<Card {...Default.args} />);
    let card = getByRole('article');
    let heading = getByRole('heading', {level: 3});
    let images = getAllByRole(isOldReact ? 'img' : 'presentation');
    let labelledCard = getByLabelText(heading.textContent);
    expect(card).toBe(labelledCard);
    expect(card).toHaveAccessibleDescription('Description');
    expect(images[0]).not.toHaveAccessibleName();

    await user.tab();
    expect(card).toBe(document.activeElement);

    await user.tab();
    expect(document.body).toBe(document.activeElement);
  });

  it('NoDescription is labelled and not described', function () {
    let {getByRole, queryByRole} = render(<Card {...NoDescription.args} />);
    let card = getByRole('article');
    let heading = getByRole('heading', {level: 3});
    let section = queryByRole('section');
    expect(section).toBeNull();
    expect(card).toHaveAttribute('aria-labelledby', heading.id);
    expect(card).not.toHaveAccessibleDescription();
  });

  it('DefaultPreviewAlt has a labelled image', function () {
    let {getAllByRole} = render(<Card {...DefaultPreviewAlt.args} />);
    let images = getAllByRole('img');
    expect(images[0]).toHaveAccessibleName('preview');
  });

  it('Quiet has no footer buttons', async function () {
    let {getByRole, getAllByRole, getByLabelText} = render(<Card {...Quiet.args} />);
    let card = getByRole('article');
    let heading = getByRole('heading', {level: 3});
    let images = getAllByRole(isOldReact ? 'img' : 'presentation');
    let labelledCard = getByLabelText(heading.textContent);
    expect(card).toBe(labelledCard);
    expect(card).toHaveAccessibleDescription('Description');
    expect(images[0]).not.toHaveAccessibleName();

    await user.tab();
    expect(card).toBe(document.activeElement);
  });
});
