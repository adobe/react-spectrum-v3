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
import { Content } from '@react-spectrum/view';
import { Heading } from '@react-spectrum/text';
import { IllustratedMessage } from '../';
import NotFound from '@spectrum-icons/illustrations/src/NotFound';
import React from 'react';
export default {
  title: 'IllustratedMessage',
};
export const _NotFound = {
  render: () =>
    render({
      heading: 'Error 404: Page not found.',
      description: 'This page isn’t available. Try checking the URL or visit a different page.',
      illustration: <NotFound />,
    }),
  name: 'Not found',
};
export const NoHeadingOrDescription = {
  render: () =>
    render({
      illustration: <NotFound aria-label="No Results" />,
    }),
  name: 'No heading or description',
};

function render(props: any = {}) {
  let { illustration, heading, description, ...otherProps } = props;
  return (
    <IllustratedMessage {...otherProps}>
      {description && <Content>{description}</Content>}
      {heading && <Heading>{heading}</Heading>}
      {illustration}
    </IllustratedMessage>
  );
}
