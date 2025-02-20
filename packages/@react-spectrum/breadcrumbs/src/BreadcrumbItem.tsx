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

import {BreadcrumbItemProps} from '@react-types/breadcrumbs';
import ChevronRightSmall from '@spectrum-icons/ui/ChevronRightSmall';
import {classNames} from '@react-spectrum/utils';
import {FocusRing} from '@react-aria/focus';
import {mergeProps} from '@react-aria/utils';
import React, {Fragment, ReactElement, useRef} from 'react';
import styles from '@adobe/spectrum-css-temp/components/breadcrumb/vars.css';
import {useBreadcrumbItem} from '@react-aria/breadcrumbs';
import {useHover} from '@react-aria/interactions';
import {useLocale} from '@react-aria/i18n';

interface SpectrumBreadcrumbItemProps extends BreadcrumbItemProps {
  isMenu?: boolean
}

export function BreadcrumbItem(props: SpectrumBreadcrumbItemProps): ReactElement {
  let {
    children,
    isCurrent,
    isDisabled,
    isMenu
  } = props;

  let {direction} = useLocale();
  let ref = useRef(null);
  let ElementType: React.ElementType = props.href ? 'a' : 'span';
  let {itemProps} = useBreadcrumbItem({
    ...props,
    elementType: ElementType
  }, ref);
  let {hoverProps, isHovered} = useHover(props);

  // If this item contains a menu button, then it shouldn't be a link.
  if (isMenu) {
    itemProps = {};
  }

  return (
    <Fragment>
      <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
        <ElementType
          {...mergeProps(itemProps, hoverProps)}
          ref={ref}
          className={
            classNames(
              styles,
              {
                'spectrum-Breadcrumbs-itemLink': !isMenu,
                'is-disabled': !isCurrent && isDisabled,
                'is-hovered': isHovered
              }
            )
          }>
          {children}
        </ElementType>
      </FocusRing>
      <ChevronRightSmall
        UNSAFE_className={
          classNames(
            styles,
            'spectrum-Breadcrumbs-itemSeparator',
            {
              'is-reversed': direction === 'rtl'
            }
          )
        } />
    </Fragment>
  );
}
