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

import {Alignment, AriaLabelingProps, CollectionBase, DOMProps, FocusStrategy, MultipleSelection, StyleProps} from '@react-types/shared';
import {Key, ReactElement} from 'react';
import {OverlayTriggerProps} from '@react-types/overlays';

export type MenuTriggerType = 'press' | 'longPress'

export interface MenuTriggerProps extends OverlayTriggerProps {
  /**
   * Determines trigger behavior. When set to longPress, it opens the menu after a delay of 500ms and also enables using Alt+Arrow(Up/Down) as a long press gesture alternative.
   * @default 'press'
   */
  trigger?: MenuTriggerType,
  /**
   * Alignment of the menu relative to the trigger.
   * @default 'start'
   */
  align?: Alignment,
  /**
   * Where the Menu opens relative to its trigger.
   * @default 'bottom'
   */
  direction?: 'bottom' | 'top',
  /**
   * Whether the Menu closes when a selection is made.
   * @default true
   */
  closeOnSelect?: boolean,
  /**
   * Whether the menu should automatically flip direction when space is limited.
   * @default true
   */
  shouldFlip?: boolean
}

export interface SpectrumMenuTriggerProps extends MenuTriggerProps {
  /**
   * The contents of the MenuTrigger - a trigger and a Menu.
   */
  children: ReactElement[]
}

export interface MenuProps<T> extends CollectionBase<T>, MultipleSelection {
  /** Where the focus should be set. */
  autoFocus?: boolean | FocusStrategy,
  /** Whether keyboard navigation is circular. */
  shouldFocusWrap?: boolean,
  /** Handler that is called when an item is selected. */
  onAction?: (key: Key) => void
}

export interface AriaMenuProps<T> extends MenuProps<T>, DOMProps, AriaLabelingProps {}
export interface SpectrumMenuProps<T> extends AriaMenuProps<T>, StyleProps {}
