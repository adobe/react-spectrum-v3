/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Content, Header} from '@react-spectrum/view';
import {InlineAlert} from '../';
import React from 'react';
import {renderv3 as render} from '@react-spectrum/test-utils-internal';

describe('InlineAlert', function () {
  it('has alert role', function () {
    let {getByRole} = render(
      <InlineAlert>
        <Header>Title</Header>
        <Content>Content</Content>
      </InlineAlert>
    );

    let alert = getByRole('alert');
    expect(alert).toBeVisible();
  });

  it('has a header', function () {
    let {getByTestId} = render(
      <InlineAlert>
        <Header data-testid="testid1">Test Title</Header>
        <Content>Content</Content>
      </InlineAlert>
    );

    let header = getByTestId('testid1');
    expect(header).toBeVisible();
    expect(header).toHaveTextContent('Test Title');
  });

  it('has body content', function () {
    let {getByTestId} = render(
      <InlineAlert>
        <Header>Title</Header>
        <Content data-testid="testid1">Test Content</Content>
      </InlineAlert>
    );

    let content = getByTestId('testid1');
    expect(content).toBeVisible();
    expect(content).toHaveTextContent('Test Content');
  });

  it.each`
      variant
      ${'neutral'}
      ${'info'}
      ${'positive'}
      ${'notice'}
      ${'negative'}
    `('$variant variant renders correctly', function ({variant}) {
      let {getByTestId} = render(
        <InlineAlert variant={variant} data-testid="testid1">
          <Header>Title</Header>
          <Content>Content</Content>
        </InlineAlert>
      );
      let alert = getByTestId('testid1');
      expect(alert).toHaveClass(`spectrum-InLineAlert--${variant}`);
    });

  it('supports autoFocus', () => {
    let {getByRole} = render(
      <InlineAlert autoFocus>
        <Header>Title</Header>
        <Content>Content</Content>
      </InlineAlert>
    );

    let alert = getByRole('alert');
    expect(alert).toHaveAttribute('tabIndex', '-1');
    expect(document.activeElement).toBe(alert);
  });
});
