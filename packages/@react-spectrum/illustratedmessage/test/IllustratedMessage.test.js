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

import {Content} from '@react-spectrum/view';
import {Heading} from '@react-spectrum/text';
import {IllustratedMessage} from '../';
import React from 'react';
import {renderv3 as render} from '@react-spectrum/test-utils-internal';

let dataTestId = 'IMsvg1';

function Image(props) {
  return (<svg {...props} data-testid={dataTestId}><path /></svg>);
}

function renderIllustratedMessage(Component, props) {
  let {
    heading,
    description,
    illustration,
    ...otherProps
  } = props;
  if (Component === IllustratedMessage) {
    return render(
      <Component {...otherProps}>
        {description && <Content>{description}</Content>}
        {heading && <Heading>{heading}</Heading>}
        {illustration}
      </Component>
    );
  } else {
    return render(<Component {...props} />);
  }
}

describe('IllustratedMessage', function () {
  it.each`
    Name                       | Component               | props
    ${'IllustratedMessage'}    | ${IllustratedMessage}   | ${{heading: 'foo', description: 'bar', illustration: <Image />}}
  `('$Name should render all parts of an IllustratedMessage', function ({Component, props}) {
    let {getByTestId, getByText} = renderIllustratedMessage(Component, props);

    getByTestId(dataTestId);
    getByText('foo');
    getByText('bar');
  });

  it.each`
    Name                       | Component               | props
    ${'IllustratedMessage'}    | ${IllustratedMessage}   | ${{illustration: <Image />}}
  `('$Name should render only an svg', function ({Component, props}) {
    let {queryAllByText, getByTestId} = renderIllustratedMessage(Component, props);

    getByTestId(dataTestId);
    expect(queryAllByText('foo').length).toBe(0);
    expect(queryAllByText('bar').length).toBe(0);
  });

  it.each`
    Name                       | Component               | props
    ${'IllustratedMessage'}    | ${IllustratedMessage}   | ${{heading: 'foo', description: 'bar'}}
  `('$Name should render heading and description without an svg', function ({Component, props}) {
    let {queryAllByTestId, getByText} = renderIllustratedMessage(Component, props);

    expect(queryAllByTestId(dataTestId).length).toBe(0);
    getByText('foo');
    getByText('bar');
  });
});
