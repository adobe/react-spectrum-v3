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

import {FocusableRef} from '@react-types/shared';
import React, {ElementType, ReactElement} from 'react';
import {SpectrumButtonProps} from '@react-types/button';
import {Text} from '@react-spectrum/text';
import {useButton} from '@react-aria/button';
import {useFocusableRef} from '@react-spectrum/utils';

function Button<T extends ElementType = 'button'>(props: SpectrumButtonProps<T>, ref: FocusableRef<HTMLElement>) {
  // props = useProviderProps(props);
  // props = useSlotProps(props, 'button');
  let {
    elementType: ElementType = 'sp-button', // uxp
    children,
    variant,
    isQuiet,
    ...otherProps
  } = props;
  let domRef = useFocusableRef(ref);
  let {buttonProps} = useButton(props, domRef);

  return (
    <ElementType
      {...buttonProps}
      {...otherProps}
      ref={domRef}
      quiet={isQuiet}   // uxp
      variant={variant}>
      {typeof children === 'string'
        ? <Text>{children}</Text>
        : children}
    </ElementType>
  );
}

/**
 * Buttons allow users to perform an action or to navigate to another page.
 * They have multiple styles for various needs, and are ideal for calling attention to
 * where a user needs to do something in order to move forward in a flow.
 */
let _Button = React.forwardRef(Button) as <T extends ElementType = 'button'>(props: SpectrumButtonProps<T> & {ref?: FocusableRef<HTMLElement>}) => ReactElement;
export {_Button as Button};
