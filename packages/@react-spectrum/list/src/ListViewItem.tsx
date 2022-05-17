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
import {Checkbox} from '@react-spectrum/checkbox';
import ChevronLeftMedium from '@spectrum-icons/ui/ChevronLeftMedium';
import ChevronRightMedium from '@spectrum-icons/ui/ChevronRightMedium';
import {classNames, ClearSlots, SlotProvider} from '@react-spectrum/utils';
import {Content} from '@react-spectrum/view';
import {CSSTransition} from 'react-transition-group';
import type {DraggableItemResult, DroppableItemResult} from '@react-aria/dnd';
import {DropTarget, Node} from '@react-types/shared';
import {FocusRing, useFocusRing} from '@react-aria/focus';
import {Grid} from '@react-spectrum/layout';
import {isFocusVisible as isGlobalFocusVisible, useHover, usePress} from '@react-aria/interactions';
import ListGripper from '@spectrum-icons/ui/ListGripper';
import listStyles from './styles.css';
import {ListViewContext} from './ListView';
import {mergeProps} from '@react-aria/utils';
import {Provider} from '@react-spectrum/provider';
import React, {useContext, useRef} from 'react';
import {useButton} from '@react-aria/button';
import {useGridCell, useGridSelectionCheckbox} from '@react-aria/grid';
import {useLocale} from '@react-aria/i18n';
import {useVisuallyHidden} from '@react-aria/visually-hidden';

interface ListViewItemProps {
  item: Node<any>,
  isEmphasized: boolean,
  hasActions: boolean
}

export function ListViewItem(props: ListViewItemProps) {
  let {
    item,
    isEmphasized,
    hasActions
  } = props;
  let {state, dragState, dropState, isListDraggable, isListDroppable, layout, dragHooks, dropHooks} = useContext(ListViewContext);
  let {direction} = useLocale();
  let rowRef = useRef<HTMLDivElement>();
  let {
    isFocusVisible: isFocusVisibleWithin,
    focusProps: focusWithinProps
  } = useFocusRing({within: true});
  let {isFocusVisible, focusProps} = useFocusRing();
  let allowsSelection = state.selectionManager.canSelectItem(item.key);
  let allowsActions = state.selectionManager.allowsActions(item.key);
  let isDisabled = state.disabledKeys.has(item.key) && state.selectionManager.disabledBehavior === 'all';
  let isDroppable = isListDroppable && !allowsActions;
  let allowsInteraction = allowsSelection || (hasActions && allowsActions);
  let {hoverProps, isHovered} = useHover({isDisabled: !allowsInteraction});
  let {pressProps, isPressed} = usePress({isDisabled: !allowsInteraction});

  // We only make use of useGridCell here to allow for keyboard navigation to the focusable children of the row.
  // The actual grid cell of the ListView is inert since we don't want to ever focus it to decrease screenreader
  // verbosity, so we pretend the row node is the cell for interaction purposes. useGridRow is never used since
  // it would conflict with useGridCell if applied to the same node.
  let {gridCellProps} = useGridCell({
    node: item,
    focusMode: 'cell',
    isVirtualized: true,
    shouldSelectOnPressUp: isListDraggable
  }, state, rowRef);
  delete gridCellProps['aria-colindex'];

  let draggableItem: DraggableItemResult;
  if (isListDraggable) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    draggableItem = dragHooks.useDraggableItem({key: item.key}, dragState);
    if (!allowsActions) {
      draggableItem = null;
    }
  }
  let droppableItem: DroppableItemResult;
  let isDropTarget: boolean;
  if (isListDroppable) {
    let target = {type: 'item', key: item.key, dropPosition: 'on'} as DropTarget;
    isDropTarget = dropState.isDropTarget(target);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    droppableItem = dropHooks.useDroppableItem({target}, dropState, rowRef);
  }

  let {checkboxProps} = useGridSelectionCheckbox({...props, key: item.key}, state);
  let dragButtonRef = React.useRef();
  let {buttonProps} = useButton({
    ...draggableItem?.dragButtonProps,
    elementType: 'div'
  }, dragButtonRef);

  let chevron = direction === 'ltr'
    ? (
      <ChevronRightMedium
        aria-hidden="true"
        UNSAFE_className={
          classNames(
            listStyles,
            'react-spectrum-ListViewItem-parentIndicator',
            {
              'react-spectrum-ListViewItem-parentIndicator--hasChildItems': item.props.hasChildItems,
              'is-disabled': !allowsActions
            }
          )
        } />
    )
    : (
      <ChevronLeftMedium
        aria-hidden="true"
        UNSAFE_className={
          classNames(
            listStyles,
            'react-spectrum-ListViewItem-parentIndicator',
            {
              'react-spectrum-ListViewItem-parentIndicator--hasChildItems': item.props.hasChildItems,
              'is-disabled': !allowsActions
            }
          )
        } />
    );

  let showCheckbox = state.selectionManager.selectionMode !== 'none' && state.selectionManager.selectionBehavior === 'toggle';
  let isSelected = state.selectionManager.isSelected(item.key);
  let {visuallyHiddenProps} = useVisuallyHidden();
  let rowProps = {
    role: 'row',
    'aria-label': item.textValue,
    'aria-selected': state.selectionManager.selectionMode !== 'none' ? isSelected : undefined,
    'aria-rowindex': item.index + 1
  };

  const mergedProps = mergeProps(
    gridCellProps,
    rowProps,
    pressProps,
    draggableItem?.dragProps,
    isDroppable && droppableItem?.dropProps,
    hoverProps,
    focusWithinProps,
    focusProps
  );

  let isFirstRow = item.prevKey == null;
  let isLastRow = item.nextKey == null;
  // Figure out if the ListView content is equal or greater in height to the container. If so, we'll need to round the bottom
  // border corners of the last row when selected and we can get rid of the bottom border if it isn't selected to avoid border overlap
  // with bottom border
  let isFlushWithContainerBottom = false;
  if (isLastRow) {
    if (layout.getContentSize()?.height >= layout.virtualizer?.getVisibleRect().height) {
      isFlushWithContainerBottom = true;
    }
  }
  // previous item isn't selected
  // and the previous item isn't focused or, if it is focused, then if focus globally isn't visible or just focus isn't in the listview
  let roundTops = (!state.selectionManager.isSelected(item.prevKey)
    && (state.selectionManager.focusedKey !== item.prevKey || !(isGlobalFocusVisible() && state.selectionManager.isFocused)));
  let roundBottoms = (!state.selectionManager.isSelected(item.nextKey)
    && (state.selectionManager.focusedKey !== item.nextKey || !(isGlobalFocusVisible() && state.selectionManager.isFocused)));

  let content = typeof item.rendered === 'string' ? <Content>{item.rendered}</Content> : item.rendered;
  if (!allowsActions) {
    content = <Provider isDisabled>{content}</Provider>;
  }

  return (
    <div
      {...mergedProps}
      className={
        classNames(
          listStyles,
          'react-spectrum-ListView-row',
          {
            'focus-ring': isFocusVisible,
            'round-tops':
              roundTops || (isHovered && !state.selectionManager.isSelected(item.key) && state.selectionManager.focusedKey !== item.key),
            'round-bottoms':
              roundBottoms || (isHovered && !state.selectionManager.isSelected(item.key) && state.selectionManager.focusedKey !== item.key)
          }
        )
      }
      ref={rowRef}>
      <div
        // TODO: refactor the css here now that we are focusing the row?
        className={
          classNames(
            listStyles,
            'react-spectrum-ListViewItem',
            {
              'is-active': isPressed,
              'is-focused': isFocusVisibleWithin,
              'focus-ring': isFocusVisible,
              'is-hovered': isHovered,
              'is-selected': isSelected,
              'is-disabled': isDisabled,
              'is-prev-selected': state.selectionManager.isSelected(item.prevKey),
              'is-next-selected': state.selectionManager.isSelected(item.nextKey),
              'react-spectrum-ListViewItem--highlightSelection': state.selectionManager.selectionBehavior === 'replace' && (isSelected || state.selectionManager.isSelected(item.nextKey)),
              'react-spectrum-ListViewItem--dropTarget': !!isDropTarget,
              'react-spectrum-ListViewItem--firstRow': isFirstRow,
              'react-spectrum-ListViewItem--lastRow': isLastRow,
              'react-spectrum-ListViewItem--isFlushBottom': isFlushWithContainerBottom
            }
          )
        }
        role="gridcell"
        aria-colindex={1}>
        <Grid UNSAFE_className={listStyles['react-spectrum-ListViewItem-grid']}>
          {isListDraggable &&
            <div className={listStyles['react-spectrum-ListViewItem-draghandle-container']}>
              {!isDisabled &&
                <FocusRing focusRingClass={classNames(listStyles, 'focus-ring')}>
                  <div
                    {...buttonProps as React.HTMLAttributes<HTMLElement>}
                    className={
                      classNames(
                        listStyles,
                        'react-spectrum-ListViewItem-draghandle-button'
                      )
                    }
                    style={!isFocusVisibleWithin ? {...visuallyHiddenProps.style} : {}}
                    ref={dragButtonRef}
                    draggable="true">
                    <ListGripper />
                  </div>
                </FocusRing>
              }
            </div>
          }
          <CSSTransition
            in={showCheckbox}
            unmountOnExit
            classNames={{
              enter: listStyles['react-spectrum-ListViewItem-checkbox--enter'],
              enterActive: listStyles['react-spectrum-ListViewItem-checkbox--enterActive'],
              exit: listStyles['react-spectrum-ListViewItem-checkbox--exit'],
              exitActive: listStyles['react-spectrum-ListViewItem-checkbox--exitActive']
            }}
            timeout={160} >
            <div className={listStyles['react-spectrum-ListViewItem-checkboxWrapper']}>
              <Checkbox
                {...checkboxProps}
                UNSAFE_className={listStyles['react-spectrum-ListViewItem-checkbox']}
                isEmphasized={isEmphasized} />
            </div>
          </CSSTransition>
          <SlotProvider
            slots={{
              content: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-content']},
              text: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-content']},
              description: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-description']},
              icon: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-icon'], size: 'M'},
              image: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-image']},
              link: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-content'], isQuiet: true},
              actionButton: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-actions'], isQuiet: true},
              actionGroup: {
                UNSAFE_className: listStyles['react-spectrum-ListViewItem-actions'],
                isQuiet: true,
                density: 'compact'
              },
              actionMenu: {UNSAFE_className: listStyles['react-spectrum-ListViewItem-actionmenu'], isQuiet: true}
            }}>
            {content}
            <ClearSlots>
              {chevron}
            </ClearSlots>
          </SlotProvider>
        </Grid>
      </div>
    </div>
  );
}
