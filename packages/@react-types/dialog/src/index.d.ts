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

import {AriaLabelingProps, DOMProps, StyleProps} from '@react-types/shared';
import {OverlayTriggerProps, PositionProps} from '@react-types/overlays';
import {ReactElement, ReactNode, RefObject} from 'react';

export type SpectrumDialogClose = (close: () => void) => ReactElement;

export interface SpectrumDialogTriggerProps extends OverlayTriggerProps, PositionProps {
  /** The Dialog and its trigger element. See the DialogTrigger [Content section](#content) for more information on what to provide as children. */
  children: [ReactElement, SpectrumDialogClose | ReactElement],
  /**
   * The type of Dialog that should be rendered. See the DialogTrigger [types section](#dialog-types) for an explanation on each.
   * @default 'modal'
   */
  type?: 'modal' | 'popover' | 'tray' | 'fullscreen' | 'fullscreenTakeover',
  /** The type of Dialog that should be rendered when on a mobile device. See DialogTrigger [types section](#dialog-types) for an explanation on each. */
  mobileType?: 'modal' | 'tray' | 'fullscreen' | 'fullscreenTakeover',
  /**
   * Whether a popover type Dialog's arrow should be hidden.
   */
  hideArrow?: boolean,
  /** The ref of the element the Dialog should visually attach itself to. Defaults to the trigger button if not defined. */
  targetRef?: RefObject<HTMLElement>,
  /** Whether a modal type Dialog should be dismissable. */
  isDismissable?: boolean,
  /** Whether pressing the escape key to close the dialog should be disabled. */
  isKeyboardDismissDisabled?: boolean
}

export interface SpectrumDialogContainerProps {
  /** The Dialog to display, if any. */
  children: ReactNode,
  /** Handler that is called when the 'x' button of a dismissable Dialog is clicked. */
  onDismiss: () => void,
  /**
   * The type of Dialog that should be rendered. See the visual options below for examples of each.
   * @default 'modal'
   */
  type?: 'modal' | 'fullscreen' | 'fullscreenTakeover',
  /** Whether the Dialog is dismissable. See the [Dialog docs](Dialog.html#dismissable-dialogs) for more details. */
  isDismissable?: boolean,
  /** Whether pressing the escape key to close the dialog should be disabled. */
  isKeyboardDismissDisabled?: boolean
}

export interface AriaDialogProps extends DOMProps, AriaLabelingProps {
  /**
   * The accessibility role for the dialog.
   * @default 'dialog'
   */
  role?: 'dialog' | 'alertdialog'
}

export interface SpectrumDialogProps extends AriaDialogProps, StyleProps {
  /** The contents of the Dialog. */
  children: ReactNode,
  /** The size of the Dialog. Only applies to "modal" type Dialogs. */
  size?: 'S' | 'M' | 'L',
  /** Whether the Dialog is dismissable. See the [examples](#examples) for more details. */
  isDismissable?: boolean,
  /** Handler that is called when the 'x' button of a dismissable Dialog is clicked. */
  onDismiss?: () => void
}

export interface SpectrumAlertDialogProps extends DOMProps, StyleProps {
  /** The [visual style](https://spectrum.adobe.com/page/alert-dialog/#Options) of the AlertDialog.  */
  variant?: 'confirmation' | 'information' | 'destructive' | 'error' | 'warning',
  /** The title of the AlertDialog. */
  title: string,
  /** The contents of the AlertDialog. */
  children: ReactNode,
  /** The label to display within the cancel button. */
  cancelLabel?: string,
  /** The label to display within the confirm button. */
  primaryActionLabel: string,
  /** The label to display within the secondary button. */
  secondaryActionLabel?: string,
  /** Whether the primary button is disabled. */
  isPrimaryActionDisabled?: boolean,
  /** Whether the secondary button is disabled. */
  isSecondaryActionDisabled?: boolean,
  /** Handler that is called when the cancel button is pressed. */
  onCancel?: () => void,
  /** Handler that is called when the primary button is pressed. */
  onPrimaryAction?: () => void,
  /** Handler that is called when the secondary button is pressed. */
  onSecondaryAction?: () => void,
  /** Button to focus by default when the dialog opens. */
  autoFocusButton?: 'cancel' | 'primary' | 'secondary',
  /** Triggers primary action when the Enter key is pressed for AlertDialog. */
  allowsKeyboardConfirmation?: boolean
}
