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

import {classNames} from '@react-spectrum/utils';
import {getChildNodes} from '@react-stately/collections';
import {MenuItem} from './MenuItem';
import {Node} from '@react-types/shared';
import React, {Fragment, ReactElement} from 'react';
import styles from '@adobe/spectrum-css-temp/components/menu/vars.css';
import {TreeState} from '@react-stately/tree';
import {useMenuSection} from '@react-aria/menu';
import {useSeparator} from '@react-aria/separator';

interface MenuSectionProps<T> {
  item: Node<T>,
  state: TreeState<T>
}

/** @private */
export function MenuSection<T>(props: MenuSectionProps<T>): ReactElement {
  let {item, state} = props;
  let {itemProps, headingProps, groupProps} = useMenuSection({
    heading: item.rendered,
    'aria-label': item['aria-label']
  });

  let {separatorProps} = useSeparator({
    elementType: 'div'
  });

  let firstSectionKey = state.collection.getFirstKey();
  let lastSectionKey = [...state.collection].filter(node => node.type === 'section').at(-1)?.key;
  let sectionIsFirst = firstSectionKey === item.key && state.collection.getFirstKey() === firstSectionKey;
  let lastKey = state.collection.getLastKey();
  let sectionIsLast = lastSectionKey === item.key && lastKey != null && state.collection.getItem(lastKey)!.parentKey === lastSectionKey;

  return (
    <Fragment>
      {item.key !== state.collection.getFirstKey() &&
        <div
          {...separatorProps}
          className={classNames(
            styles,
            'spectrum-Menu-divider'
          )} />
      }
      <div {...itemProps}>
        {item.rendered &&
          <span
            {...headingProps}
            className={
              classNames(
                styles,
                'spectrum-Menu-sectionHeading'
              )
            }>
            {item.rendered}
          </span>
        }
        <div
          {...groupProps}
          className={
            classNames(
              styles,
                'spectrum-Menu',
              {
                'spectrum-Menu-section--noHeading': item.rendered == null,
                'spectrum-Menu-section--isFirst': sectionIsFirst,
                'spectrum-Menu-section--isLast': sectionIsLast
              }
            )
          }>
          {[...getChildNodes(item, state.collection)].map(node => {
            let item = (
              <MenuItem
                key={node.key}
                item={node}
                state={state} />
            );

            if (node.wrapper) {
              item = node.wrapper(item);
            }

            return item;
          })}
        </div>
      </div>
    </Fragment>
  );
}
