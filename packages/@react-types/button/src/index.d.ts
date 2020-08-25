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

import {AriaLabelingProps, FocusableDOMProps, FocusableProps, PressEvents, StyleProps} from '@react-types/shared';
import {JSXElementConstructor, ReactNode} from 'react';

interface ButtonProps extends PressEvents, FocusableProps {
  /** Whether the button is disabled. */
  isDisabled?: boolean,
  /** The content to display in the button. */
  children?: ReactNode
}

interface ToggleButtonProps extends ButtonProps {
  /** Whether the element should be selected (controlled). */
  isSelected?: boolean,
  /** Whether the element should be selected (uncontrolled). */
  defaultSelected?: boolean,
  /** Handler that is called when the element's selection state changes. */
  onChange?: (isSelected: boolean) => void
}

export interface LinkButtonProps {
  /**
   * The HTML element or React element used to render the button, e.g. 'div', 'a', or `RouterLink`.
   * @default 'button'
   */
  elementType?: string | JSXElementConstructor<any>,
  /** A URL to link to if elementType="a". */
  href?: string,
  /** The target window for the link. */
  target?: string,
  /** The relationship between the linked resource and the current page. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel). */
  rel?: string
}

interface AriaBaseButtonProps extends FocusableDOMProps, AriaLabelingProps {
  /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
  'aria-expanded'?: boolean,
  /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog',
  /** Identifies the element (or elements) whose contents or presence are controlled by the current element. */
  'aria-controls'?: string,
  /** Indicates the current "pressed" state of toggle buttons. */
  'aria-pressed'?: boolean,
  /**
   * The behavior of the button when used in an HTML form.
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset'
}

export interface AriaButtonProps extends ButtonProps, LinkButtonProps, AriaBaseButtonProps {
  /** Whether the button should have press events temporarily disabled. */
  isPending?: boolean
}
export interface AriaToggleButtonProps extends ToggleButtonProps, AriaBaseButtonProps {}

export interface SpectrumButtonProps extends AriaBaseButtonProps, ButtonProps, LinkButtonProps, StyleProps {
  /** The [visual style](https://spectrum.adobe.com/page/button/#Options) of the button. */
  variant: 'cta' | 'overBackground' | 'primary' | 'secondary' | 'negative',
  /** Whether the button should be displayed with a quiet style. */
  isQuiet?: boolean,
  /** Whether the button should have press events temporarily disabled. */
  isPending?: boolean
}

export interface SpectrumActionButtonProps extends AriaBaseButtonProps, ButtonProps, StyleProps {
  /** Whether the button should be displayed with a [quiet style](https://spectrum.adobe.com/page/action-button/#Quiet). */
  isQuiet?: boolean
}

export interface SpectrumLogicButtonProps extends AriaBaseButtonProps, ButtonProps, StyleProps {
  /** The type of boolean sequence to be represented by the LogicButton. */
  variant: 'and' | 'or'
}

export interface SpectrumToggleButtonProps extends ToggleButtonProps, SpectrumActionButtonProps {
  /** Whether the button should be displayed with an [emphasized style](https://spectrum.adobe.com/page/action-button/#Emphasis). */
  isEmphasized?: boolean
}
