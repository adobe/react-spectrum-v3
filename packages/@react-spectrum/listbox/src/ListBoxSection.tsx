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
import {LayoutInfo} from '@react-stately/virtualizer';
import {layoutInfoToStyle, useVirtualizerItem, VirtualizerItemOptions} from '@react-aria/virtualizer';
import {ListBoxContext} from './ListBoxContext';
import {Node} from '@react-types/shared';
import React, {Fragment, ReactElement, ReactNode, useContext, useRef} from 'react';
import styles from '@adobe/spectrum-css-temp/components/menu/vars.css';
import {useListBoxSection} from '@react-aria/listbox';
import {useLocale} from '@react-aria/i18n';

interface ListBoxSectionProps<T> extends Omit<VirtualizerItemOptions, 'ref' | 'layoutInfo'> {
  layoutInfo: LayoutInfo,
  headerLayoutInfo: LayoutInfo | null,
  item: Node<T>,
  children?: ReactNode
}

/** @private */
export function ListBoxSection<T>(props: ListBoxSectionProps<T>): ReactElement {
  let {children, layoutInfo, headerLayoutInfo, virtualizer, item} = props;
  let {headingProps, groupProps} = useListBoxSection({
    heading: item.rendered,
    'aria-label': item['aria-label']
  });

  let headerRef = useRef<HTMLDivElement | null>(null);
  useVirtualizerItem({
    layoutInfo: headerLayoutInfo,
    virtualizer,
    ref: headerRef
  });

  let {direction} = useLocale();
  let {state} = useContext(ListBoxContext)!;

  return (
    <Fragment>
      {headerLayoutInfo && <div role="presentation" ref={headerRef} style={layoutInfoToStyle(headerLayoutInfo, direction)}>
        {item.key !== state.collection.getFirstKey() &&
          <div
            role="presentation"
            className={classNames(
              styles,
              'spectrum-Menu-divider'
            )} />
        }
        {item.rendered &&
          <div
            {...headingProps}
            className={
              classNames(
                styles,
                'spectrum-Menu-sectionHeading'
              )
            }>
            {item.rendered}
          </div>
        }
      </div>}
      <div
        {...groupProps}
        style={layoutInfoToStyle(layoutInfo, direction)}
        className={
          classNames(
            styles,
            'spectrum-Menu'
          )
        }>
        {children}
      </div>
    </Fragment>
  );
}
