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

import {ActionButton} from '@react-spectrum/button';
import {filterDOMProps} from '@react-aria/utils';
import {FocusableRef} from '@react-types/shared';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {Menu} from './Menu';
import {MenuTrigger} from './MenuTrigger';
import More from '@spectrum-icons/workflow/More';
import React from 'react';
import {SpectrumActionMenuProps} from '@react-types/menu';
import {useMessageFormatter} from '@react-aria/i18n';

function ActionMenu<T extends object>(props: SpectrumActionMenuProps<T>, ref: FocusableRef<HTMLButtonElement>) {
  let formatMessage = useMessageFormatter(intlMessages);
  let buttonProps = filterDOMProps(props, {labelable: true});
  if (buttonProps['aria-label'] === undefined) {
    buttonProps['aria-label'] = formatMessage('moreActions');
  }

  return (
    <MenuTrigger
      align={props.align}
      direction={props.direction}
      shouldFlip={props.shouldFlip}>
      <ActionButton
        ref={ref}
        {...buttonProps}
        isDisabled={props.isDisabled}
        isQuiet={props.isQuiet}
        autoFocus={props.autoFocus}>
        <More />
      </ActionButton>
      <Menu
        children={props.children}
        items={props.items}
        disabledKeys={props.disabledKeys}
        onAction={props.onAction} />
    </MenuTrigger>
  );
}

/**
 * ActionMenu combines an ActionButton with a Menu for simple "more actions" use cases.
 */
let _ActionMenu = React.forwardRef(ActionMenu);
export {_ActionMenu as ActionMenu};
