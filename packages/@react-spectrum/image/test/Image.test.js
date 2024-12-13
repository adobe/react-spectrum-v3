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
import {fireEvent, renderv3 as render, screen} from '@react-spectrum/test-utils-internal';
import {Image} from '../src';
import React from 'react';

describe('Image', () => {
  test('renders correctly', () => {
    render(<Image src="https://i.imgur.com/Z7AzH2c.png" alt="Sky and roof" />);

    expect(
      screen.getByRole('img', {
        name: /sky and roof/i
      })
    ).toBeInTheDocument();
  });

  test('on error callback', () => {
    const mockOnErrorCallback = jest.fn();

    render(
      <Image
        src="https://i.imgur.com/Z7AzH2c.png"
        alt="Sky and roof"
        onError={mockOnErrorCallback} />
    );
    fireEvent.error(screen.getByAltText('Sky and roof'));

    expect(mockOnErrorCallback).toBeCalled();
  });
});
