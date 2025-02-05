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

import {getScrollParents} from './getScrollParents';

interface ScrollIntoViewportOpts {
  /** The optional containing element of the target to be centered in the viewport. */
  containingElement?: Element | null
}

/**
 * Scrolls `scrollView` so that `element` is visible.
 * Similar to `element.scrollIntoView({block: 'nearest'})` (not supported in Edge),
 * but doesn't affect parents above `scrollView`.
 */
export function scrollIntoView(scrollView: HTMLElement, element: HTMLElement) {
  let offsetX = relativeOffset(scrollView, element, 'left');
  let offsetY = relativeOffset(scrollView, element, 'top');
  let width = element.offsetWidth;
  let height = element.offsetHeight;
  let x = scrollView.scrollLeft;
  let y = scrollView.scrollTop;

  // Account for top/left border offsetting the scroll top/Left + scroll padding
  let {
    borderTopWidth,
    borderLeftWidth,
    scrollPaddingTop,
    scrollPaddingRight,
    scrollPaddingBottom,
    scrollPaddingLeft
  } = getComputedStyle(scrollView);

  let borderAdjustedX = x + parseInt(borderLeftWidth, 10);
  let borderAdjustedY = y + parseInt(borderTopWidth, 10);
  // Ignore end/bottom border via clientHeight/Width instead of offsetHeight/Width
  let maxX = borderAdjustedX + scrollView.clientWidth;
  let maxY = borderAdjustedY + scrollView.clientHeight;

  // Get scroll padding values as pixels - defaults to 0 if no scroll padding
  // is used.
  let scrollPaddingTopNumber = parseInt(scrollPaddingTop, 10) || 0;
  let scrollPaddingBottomNumber = parseInt(scrollPaddingBottom, 10) || 0;
  let scrollPaddingRightNumber = parseInt(scrollPaddingRight, 10) || 0;
  let scrollPaddingLeftNumber = parseInt(scrollPaddingLeft, 10) || 0;

  if (offsetX <= x + scrollPaddingLeftNumber) {
    x = offsetX - parseInt(borderLeftWidth, 10) - scrollPaddingLeftNumber;
  } else if (offsetX + width > maxX - scrollPaddingRightNumber) {
    x += offsetX + width - maxX + scrollPaddingRightNumber;
  }
  if (offsetY <= borderAdjustedY + scrollPaddingTopNumber) {
    y = offsetY - parseInt(borderTopWidth, 10) - scrollPaddingTopNumber;
  } else if (offsetY + height > maxY - scrollPaddingBottomNumber) {
    y += offsetY + height - maxY + scrollPaddingBottomNumber;
  }

  scrollView.scrollLeft = x;
  scrollView.scrollTop = y;
}

/**
 * Computes the offset left or top from child to ancestor by accumulating
 * offsetLeft or offsetTop through intervening offsetParents.
 */
function relativeOffset(ancestor: HTMLElement, child: HTMLElement, axis: 'left'|'top') {
  let childRect = child.getBoundingClientRect();
  let ancestorRect = ancestor.getBoundingClientRect();
  
  let viewportOffset = axis === 'left' 
      ? childRect.left - ancestorRect.left 
      : childRect.top - ancestorRect.top;

  let scrollAdjustment = axis === 'left' 
      ? ancestor.scrollLeft 
      : ancestor.scrollTop;

  return viewportOffset + scrollAdjustment;
}

/**
 * Scrolls the `targetElement` so it is visible in the viewport. Accepts an optional `opts.containingElement`
 * that will be centered in the viewport prior to scrolling the targetElement into view. If scrolling is prevented on
 * the body (e.g. targetElement is in a popover), this will only scroll the scroll parents of the targetElement up to but not including the body itself.
 */
export function scrollIntoViewport(targetElement: Element | null, opts?: ScrollIntoViewportOpts) {
  if (targetElement && document.contains(targetElement)) {
    let root = document.scrollingElement || document.documentElement;
    let isScrollPrevented = window.getComputedStyle(root).overflow === 'hidden';
    // If scrolling is not currently prevented then we aren’t in a overlay nor is a overlay open, just use element.scrollIntoView to bring the element into view
    if (!isScrollPrevented) {
      let {left: originalLeft, top: originalTop} = targetElement.getBoundingClientRect();

      // use scrollIntoView({block: 'nearest'}) instead of .focus to check if the element is fully in view or not since .focus()
      // won't cause a scroll if the element is already focused and doesn't behave consistently when an element is partially out of view horizontally vs vertically
      targetElement?.scrollIntoView?.({block: 'nearest'});
      let {left: newLeft, top: newTop} = targetElement.getBoundingClientRect();
      // Account for sub pixel differences from rounding
      if ((Math.abs(originalLeft - newLeft) > 1) || (Math.abs(originalTop - newTop) > 1)) {
        opts?.containingElement?.scrollIntoView?.({block: 'center', inline: 'center'});
        targetElement.scrollIntoView?.({block: 'nearest'});
      }
    } else {
      let scrollParents = getScrollParents(targetElement);
      // If scrolling is prevented, we don't want to scroll the body since it might move the overlay partially offscreen and the user can't scroll it back into view.
      for (let scrollParent of scrollParents) {
        scrollIntoView(scrollParent as HTMLElement, targetElement as HTMLElement);
      }
    }
  }
}
