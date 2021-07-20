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

import {classNames, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import {DOMRef} from '@react-types/shared';
import {MenuContext} from './context';
import {MenuItem} from './MenuItem';
import {MenuSection} from './MenuSection';
import {mergeProps, useSyncRef} from '@react-aria/utils';
import React, {ReactElement, useContext} from 'react';
import {SpectrumMenuProps} from '@react-types/menu';
import styles from '@adobe/spectrum-css-temp/components/menu/vars.css';
import {useMenu} from '@react-aria/menu';
import {useTreeState} from '@react-stately/tree';
import {MenuSelectionGroup} from './MenuSelectionGroup';

function Menu<T extends object>(props: SpectrumMenuProps<T>, ref: DOMRef<HTMLUListElement>) {
  let contextProps = useContext(MenuContext);
  let completeProps = {
    ...mergeProps(contextProps, props)
  };

  let domRef = useDOMRef(ref);
  let state = useTreeState(completeProps);
  let {menuProps} = useMenu(completeProps, state, domRef);
  let {styleProps} = useStyleProps(completeProps);
  useSyncRef(contextProps, domRef);

  return (
    <ul
      {...menuProps}
      {...styleProps}
      ref={domRef}
      className={
        classNames(
          styles,
          'spectrum-Menu',
          styleProps.className
        )
      }>
      {[...state.collection].map(item => {
        if (item.type === 'selectionGroup') {
          return <MenuSelectionGroup item={item} state={state} {...item.props} />
        }

        if (item.type === 'section') {
          return (
            <MenuSection
              key={item.key}
              item={item}
              state={state}
              onAction={completeProps.onAction} />
          );
        }

        let menuItem = (
          <MenuItem
            key={item.key}
            item={item}
            state={state}
            onAction={completeProps.onAction} />
        );

        if (item.wrapper) {
          menuItem = item.wrapper(menuItem);
        }

        return menuItem;
      })}
    </ul>
  );
}

/**
 * Menus display a list of actions or options that a user can choose.
 */
// forwardRef doesn't support generic parameters, so cast the result to the correct type
// https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
const _Menu = React.forwardRef(Menu) as <T>(props: SpectrumMenuProps<T> & {ref?: DOMRef<HTMLUListElement>}) => ReactElement;
export {_Menu as Menu};
