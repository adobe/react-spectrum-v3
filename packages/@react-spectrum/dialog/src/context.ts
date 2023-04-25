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

import React, {HTMLAttributes} from 'react';

export interface DialogContextValue extends HTMLAttributes<HTMLElement> {
  type: 'modal' | 'popover' | 'tray' | 'fullscreen' | 'fullscreenTakeover',
  isDismissable?: boolean,
  onClose: () => void
}

export const DialogContext = React.createContext<DialogContextValue>(null);

export interface AlertDialogContextValue {
  onKeyDown: (e: KeyboardEvent) => void
}

export const AlertDialogContext = React.createContext<AlertDialogContextValue>(null);
