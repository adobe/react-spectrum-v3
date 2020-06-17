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

import {AriaLabelingProps, DOMProps, PressEvents, StyleProps} from '@react-types/shared';
import {ItemProps} from '@react-types/shared';
import {Key, ReactElement, ReactNode} from 'react';

export interface BreadcrumbItemProps extends PressEvents {
  /** Whether the breadcrumb item represents the current page. */
  isCurrent?: boolean,
  /**
   * The type of current location the breadcrumb item represents, if `isCurrent` is true.
   * @default 'page'
   */
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean | 'true' | 'false',
  /** Whether the breadcrumb item is disabled. */
  isDisabled?: boolean,
  /** The contents of the breadcrumb item. */
  children: ReactNode
}

export interface BreadcrumbsProps<T> {
  /** The breadcrumb items. */
  children: ReactElement<ItemProps<T>> | ReactElement<ItemProps<T>>[],
  /** Whether the Breadcrumbs are disabled. */
  isDisabled?: boolean,
  /** Called when an item is acted upon (usually selection via press). */
  onAction?: (key: Key) => void
}

export interface AriaBreadcrumbsProps<T> extends BreadcrumbsProps<T>, DOMProps, AriaLabelingProps {}

export interface SpectrumBreadcrumbsProps<T> extends AriaBreadcrumbsProps<T>, StyleProps {
  /**
   * Size of the Breadcrumbs including spacing and layout.
   * @default 'L'
   */
  size?: 'S' | 'M' | 'L',
  /** Whether to always show the root item if the items are collapsed. */
  showRoot?: boolean,
  /**
   * Whether to place the last Breadcrumb item onto a new line.
   */
  isMultiline?: boolean
}
