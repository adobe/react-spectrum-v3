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

import {classNames, filterDOMProps, flexStyleProps, useSlotProvider, useStyleProps} from '@react-spectrum/utils';
import {FlexProps} from '@react-types/layout';
import {HTMLElement} from 'react-dom';
import React, {RefObject} from 'react';

export const Flex = React.forwardRef((props: FlexProps, ref: RefObject<HTMLElement>) => {
  let {
    children,
    slot,
    ...otherProps
  } = props;
  let {styleProps} = useStyleProps(otherProps, flexStyleProps);
  let slotProps = useSlotProvider(slot);

  styleProps.style.display = 'flex'; // inline-flex?

  return (
    <div {...filterDOMProps(otherProps)} {...styleProps} className={classNames({}, styleProps.className, slotProps.className)} ref={ref}>
      {children}
    </div>
  );
});
