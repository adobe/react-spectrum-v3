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

import {AriaLabelingProps, AsyncLoadable, CollectionBase, DOMProps, LoadingState, MultipleSelection, Node, StyleProps} from '@react-types/shared';
import {Layout} from '@react-stately/virtualizer';
import {ReactNode} from 'react';

interface AriaCardProps extends AriaLabelingProps {}

interface SpectrumCardProps extends AriaCardProps, StyleProps, DOMProps {
  children: ReactNode,
  isQuiet?: boolean,
  layout?: 'grid' | 'waterfall' | 'gallery',
  size?: 'S' | 'M' | 'L',
  // not needed for quiet cards
  orientation?: 'horizontal' | 'vertical'
}

interface LayoutOptions {
  cardSize?: 'S' | 'M' | 'L',
  cardOrientation?: 'horizontal' | 'vertical',
  collator?: Intl.Collator
}

export interface LayoutConstructor<T> {
  new (options?: LayoutOptions): Layout<Node<T>>
}

interface CardViewProps<T> extends CollectionBase<T>, MultipleSelection, Omit<AsyncLoadable, 'isLoading'> {
  // TODO: Does LayoutContructor and Layout give enough info for a user to know what to put in their own custom layout?
  layout: LayoutConstructor<T> | Layout<Node<T>>,
  cardSize?: 'S' | 'M' | 'L',
  cardOrientation?: 'horizontal' | 'vertical',
  isQuiet?: boolean,
  renderEmptyState?: () => ReactNode,
  loadingState?: LoadingState
}

export interface AriaCardViewProps<T> extends CardViewProps<T>, DOMProps, AriaLabelingProps {}

export interface SpectrumCardViewProps<T> extends AriaCardViewProps<T>, StyleProps {}
