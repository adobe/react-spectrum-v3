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

import {AriaButtonProps} from '@react-types/button';
import {DragEndEvent, DragItem, DragMoveEvent, DragPreviewRenderer, DragStartEvent, DropOperation, PressEvent} from '@react-types/shared';
import {DragEvent, HTMLAttributes, RefObject, useRef, useState} from 'react';
import * as DragManager from './DragManager';
import {DROP_EFFECT_TO_DROP_OPERATION, DROP_OPERATION, EFFECT_ALLOWED} from './constants';
import {globalDropEffect, setGlobalAllowedDropOperations, setGlobalDropEffect, useDragModality, writeToDataTransfer} from './utils';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {isVirtualClick, isVirtualPointerEvent, useDescription, useGlobalListeners, useLayoutEffect} from '@react-aria/utils';
import {useLocalizedStringFormatter} from '@react-aria/i18n';

export interface DragOptions {
  /** Handler that is called when a drag operation is started. */
  onDragStart?: (e: DragStartEvent) => void,
  /** Handler that is called when the drag is moved. */
  onDragMove?: (e: DragMoveEvent) => void,
  /** Handler that is called when the drag operation is ended, either as a result of a drop or a cancellation. */
  onDragEnd?: (e: DragEndEvent) => void,
  /** A function that returns the items being dragged. */
  getItems: () => DragItem[],
  /** The ref of the element that will be rendered as the drag preview while dragging. */
  preview?: RefObject<DragPreviewRenderer>,
  /** Function that returns the drop operations that are allowed for the dragged items. If not provided, all drop operations are allowed. */
  getAllowedDropOperations?: () => DropOperation[],
  /**
   * Whether the item has an explicit focusable drag affordance to initiate accessible drag and drop mode.
   * If true, the dragProps will omit these event handlers, and they will be applied to dragButtonProps instead.
   */
  hasDragButton?: boolean
}

export interface DragResult {
  /** Props for the draggable element. */
  dragProps: HTMLAttributes<HTMLElement>,
  /** Props for the explicit drag button affordance, if any. */
  dragButtonProps: AriaButtonProps,
  /** Whether the element is currently being dragged. */
  isDragging: boolean
}

const MESSAGES = {
  keyboard: {
    start: 'dragDescriptionKeyboard',
    end: 'endDragKeyboard'
  },
  touch: {
    start: 'dragDescriptionTouch',
    end: 'endDragTouch'
  },
  virtual: {
    start: 'dragDescriptionVirtual',
    end: 'endDragVirtual'
  }
};

/**
 * Handles drag interactions for an element, with support for traditional mouse and touch
 * based drag and drop, in addition to full parity for keyboard and screen reader users.
 */
export function useDrag(options: DragOptions): DragResult {
  let {hasDragButton} = options;
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-aria/dnd');
  let state = useRef({
    options,
    x: 0,
    y: 0
  }).current;
  state.options = options;
  let isDraggingRef = useRef(false);
  let [isDragging, setDraggingState] = useState(false);
  let setDragging = (isDragging) => {
    isDraggingRef.current = isDragging;
    setDraggingState(isDragging);
  };
  let {addGlobalListener, removeAllGlobalListeners} = useGlobalListeners();
  let modalityOnPointerDown = useRef<string>(null);

  let onDragStart = (e: DragEvent) => {
    if (e.defaultPrevented) {
      return;
    }

    // Prevent the drag event from propagating to any parent draggables
    e.stopPropagation();

    // If this drag was initiated by a mobile screen reader (e.g. VoiceOver or TalkBack), enter virtual dragging mode.
    if (modalityOnPointerDown.current === 'virtual') {
      e.preventDefault();
      startDragging(e.target as HTMLElement);
      modalityOnPointerDown.current = null;
      return;
    }

    if (typeof options.onDragStart === 'function') {
      options.onDragStart({
        type: 'dragstart',
        x: e.clientX,
        y: e.clientY
      });
    }

    let items = options.getItems();
    writeToDataTransfer(e.dataTransfer, items);

    let allowed = DROP_OPERATION.all;
    if (typeof options.getAllowedDropOperations === 'function') {
      let allowedOperations = options.getAllowedDropOperations();
      allowed = DROP_OPERATION.none;
      for (let operation of allowedOperations) {
        allowed |= DROP_OPERATION[operation] || DROP_OPERATION.none;
      }
    }

    setGlobalAllowedDropOperations(allowed);
    e.dataTransfer.effectAllowed = EFFECT_ALLOWED[allowed] || 'none';

    // If there is a preview option, use it to render a custom preview image that will
    // appear under the pointer while dragging. If not, the element itself is dragged by the browser.
    if (typeof options.preview?.current === 'function') {
      options.preview.current(items, node => {
        // Compute the offset that the preview will appear under the mouse.
        // If possible, this is based on the point the user clicked on the target.
        // If the preview is much smaller, then just use the center point of the preview.
        let size = node.getBoundingClientRect();
        let rect = e.currentTarget.getBoundingClientRect();
        let x = e.clientX - rect.x;
        let y = e.clientY - rect.y;
        if (x > size.width || y > size.height) {
          x = size.width / 2;
          y = size.height / 2;
        }

        // Rounding height to an even number prevents blurry preview seen on some screens
        let height = 2 * Math.round(size.height / 2);
        node.style.height = `${height}px`;

        e.dataTransfer.setDragImage(node, x, y);
      });
    }

    // Enforce that drops are handled by useDrop.
    addGlobalListener(window, 'drop', e => {
      e.preventDefault();
      e.stopPropagation();
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Drags initiated from the React Aria useDrag hook may only be dropped on a target created with useDrop. This ensures that a keyboard and screen reader accessible alternative is available.');
      }
    }, {once: true});
    state.x = e.clientX;
    state.y = e.clientY;

    // Wait a frame before we set dragging to true so that the browser has time to
    // render the preview image before we update the element that has been dragged.
    requestAnimationFrame(() => {
      setDragging(true);
    });
  };

  let onDrag = (e: DragEvent) => {
    // Prevent the drag event from propagating to any parent draggables
    e.stopPropagation();

    if (e.clientX === state.x && e.clientY === state.y) {
      return;
    }

    if (typeof options.onDragMove === 'function') {
      options.onDragMove({
        type: 'dragmove',
        x: e.clientX,
        y: e.clientY
      });
    }

    state.x = e.clientX;
    state.y = e.clientY;
  };

  let onDragEnd = (e: DragEvent) => {
    // Prevent the drag event from propagating to any parent draggables
    e.stopPropagation();

    if (typeof options.onDragEnd === 'function') {
      let event: DragEndEvent = {
        type: 'dragend',
        x: e.clientX,
        y: e.clientY,
        dropOperation: DROP_EFFECT_TO_DROP_OPERATION[e.dataTransfer.dropEffect]
      };

      // Chrome Android always returns none as its dropEffect so we use the drop effect set in useDrop via
      // onDragEnter/onDragOver instead. https://bugs.chromium.org/p/chromium/issues/detail?id=1353951
      if (globalDropEffect) {
        event.dropOperation = DROP_EFFECT_TO_DROP_OPERATION[globalDropEffect];
      }
      options.onDragEnd(event);
    }

    setDragging(false);
    removeAllGlobalListeners();
    setGlobalAllowedDropOperations(DROP_OPERATION.none);
    setGlobalDropEffect(undefined);
  };

  // If the dragged element is removed from the DOM via onDrop, onDragEnd won't fire: https://bugzilla.mozilla.org/show_bug.cgi?id=460801
  // In this case, we need to manually call onDragEnd on cleanup
  // eslint-disable-next-line arrow-body-style
  useLayoutEffect(() => {
    return () => {
      if (isDraggingRef.current) {
        if (typeof state.options.onDragEnd === 'function') {
          let event: DragEndEvent = {
            type: 'dragend',
            x: 0,
            y: 0,
            dropOperation: DROP_EFFECT_TO_DROP_OPERATION[globalDropEffect || 'none']
          };
          state.options.onDragEnd(event);
        }

        setDragging(false);
        setGlobalAllowedDropOperations(DROP_OPERATION.none);
        setGlobalDropEffect(undefined);
      }
    };
  }, [state]);

  let onPress = (e: PressEvent) => {
    if (e.pointerType !== 'keyboard' && e.pointerType !== 'virtual') {
      return;
    }

    startDragging(e.target as HTMLElement);
  };

  let startDragging = (target: HTMLElement) => {
    if (typeof state.options.onDragStart === 'function') {
      let rect = target.getBoundingClientRect();
      state.options.onDragStart({
        type: 'dragstart',
        x: rect.x + (rect.width / 2),
        y: rect.y + (rect.height / 2)
      });
    }

    DragManager.beginDragging({
      element: target,
      items: state.options.getItems(),
      allowedDropOperations: typeof state.options.getAllowedDropOperations === 'function'
        ? state.options.getAllowedDropOperations()
        : ['move', 'copy', 'link'],
      onDragEnd(e) {
        setDragging(false);
        if (typeof state.options.onDragEnd === 'function') {
          state.options.onDragEnd(e);
        }
      }
    }, stringFormatter);

    setDragging(true);
  };

  let modality = useDragModality();
  let message = !isDragging ? MESSAGES[modality].start : MESSAGES[modality].end;

  let descriptionProps = useDescription(stringFormatter.format(message));

  let interactions: HTMLAttributes<HTMLElement>;
  if (!hasDragButton) {
    // If there's no separate button to trigger accessible drag and drop mode,
    // then add event handlers to the draggable element itself to start dragging.
    // For keyboard, we use the Enter key in a capturing listener to prevent other
    // events such as selection from also occurring. We attempt to infer whether a
    // pointer event (e.g. long press) came from a touch screen reader, and then initiate
    // dragging in the native onDragStart listener above.

    interactions = {
      ...descriptionProps,
      onPointerDown(e) {
        modalityOnPointerDown.current = isVirtualPointerEvent(e.nativeEvent) ? 'virtual' : e.pointerType;

        // Try to detect virtual drag passthrough gestures.
        if (e.width < 1 && e.height < 1) {
          // iOS VoiceOver.
          modalityOnPointerDown.current = 'virtual';
        } else {
          let rect = e.currentTarget.getBoundingClientRect();
          let offsetX = e.clientX - rect.x;
          let offsetY = e.clientY - rect.y;
          let centerX = rect.width / 2;
          let centerY = rect.height / 2;

          if (Math.abs(offsetX - centerX) <= 0.5 && Math.abs(offsetY - centerY) <= 0.5) {
            // Android TalkBack.
            modalityOnPointerDown.current = 'virtual';
          } else {
            modalityOnPointerDown.current = e.pointerType;
          }
        }
      },
      onKeyDownCapture(e) {
        if (e.target === e.currentTarget && e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      onKeyUpCapture(e) {
        if (e.target === e.currentTarget && e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          startDragging(e.target as HTMLElement);
        }
      },
      onClick(e) {
        // Handle NVDA/JAWS in browse mode, and touch screen readers. In this case, no keyboard events are fired.
        if (isVirtualClick(e.nativeEvent) || modalityOnPointerDown.current === 'virtual') {
          e.preventDefault();
          e.stopPropagation();
          startDragging(e.target as HTMLElement);
        }
      }
    };
  }

  return {
    dragProps: {
      ...interactions,
      draggable: 'true',
      onDragStart,
      onDrag,
      onDragEnd
    },
    dragButtonProps: {
      ...descriptionProps,
      onPress
    },
    isDragging
  };
}
