/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {FocusableElement} from '@react-types/shared';
import {
  focusWithoutScrolling,
  getActiveElement,
  getOwnerDocument,
  runAfterTransition
} from '@react-aria/utils';
import {getInteractionModality} from '@react-aria/interactions';

/**
 * A utility function that focuses an element while avoiding undesired side effects such
 * as page scrolling and screen reader issues with CSS transitions.
 */
export function focusSafely(element: FocusableElement) {
  // If the user is interacting with a virtual cursor, e.g. screen reader, then
  // wait until after any animated transitions that are currently occurring on
  // the page before shifting focus. This avoids issues with VoiceOver on iOS
  // causing the page to scroll when moving focus if the element is transitioning
  // from off the screen.
  const ownerDocument = getOwnerDocument(element);
  const activeElement = getActiveElement(ownerDocument);
  if (getInteractionModality() === 'virtual') {
    let lastFocusedElement = activeElement;
    runAfterTransition(() => {
      // If focus did not move and the element is still in the document, focus it.
      if (getActiveElement(ownerDocument) === lastFocusedElement && element.isConnected) {
        focusWithoutScrolling(element);
      }
    });
  } else {
    focusWithoutScrolling(element);
  }
}
