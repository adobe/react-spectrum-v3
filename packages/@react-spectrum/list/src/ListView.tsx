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

import {AriaGridListProps, useGridList} from '@react-aria/gridlist';
import {AsyncLoadable, DOMRef, Key, LoadingState, Node, SpectrumSelectionProps, StyleProps} from '@react-types/shared';
import {classNames, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import type {DragAndDropHooks} from '@react-spectrum/dnd';
import type {DraggableCollectionState, DroppableCollectionState} from '@react-stately/dnd';
import type {DroppableCollectionResult} from '@react-aria/dnd';
import {filterDOMProps, mergeProps, useLayoutEffect} from '@react-aria/utils';
import {FocusRing, FocusScope} from '@react-aria/focus';
import InsertionIndicator from './InsertionIndicator';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {ListKeyboardDelegate} from '@react-aria/selection';
import {ListState, useListState} from '@react-stately/list';
import listStyles from './styles.css';
import {ListViewItem} from './ListViewItem';
import {ListViewLayout} from './ListViewLayout';
import {ProgressCircle} from '@react-spectrum/progress';
import React, {JSX, ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import RootDropIndicator from './RootDropIndicator';
import {DragPreview as SpectrumDragPreview} from './DragPreview';
import {useLocalizedStringFormatter} from '@react-aria/i18n';
import {useProvider} from '@react-spectrum/provider';
import {Virtualizer} from '@react-aria/virtualizer';

export interface SpectrumListViewProps<T> extends Omit<AriaGridListProps<T>, 'keyboardNavigationBehavior'>, StyleProps, SpectrumSelectionProps, Omit<AsyncLoadable, 'isLoading'> {
  /**
   * Sets the amount of vertical padding within each cell.
   * @default 'regular'
   */
  density?: 'compact' | 'regular' | 'spacious',
  /** Whether the ListView should be displayed with a quiet style. */
  isQuiet?: boolean,
  /** The current loading state of the ListView. Determines whether or not the progress circle should be shown. */
  loadingState?: LoadingState,
  /**
   * Sets the text behavior for the row contents.
   * @default 'truncate'
   */
  overflowMode?: 'truncate' | 'wrap',
  /** Sets what the ListView should render when there is no content to display. */
  renderEmptyState?: () => JSX.Element,
  /**
   * Handler that is called when a user performs an action on an item. The exact user event depends on
   * the collection's `selectionStyle` prop and the interaction modality.
   */
  onAction?: (key: Key) => void,
  /**
   * The drag and drop hooks returned by `useDragAndDrop` used to enable drag and drop behavior for the ListView.
   */
  dragAndDropHooks?: DragAndDropHooks['dragAndDropHooks']
}

interface ListViewContextValue<T> {
  state: ListState<T>,
  dragState: DraggableCollectionState | null,
  dropState: DroppableCollectionState | null,
  dragAndDropHooks?: DragAndDropHooks['dragAndDropHooks'],
  onAction?: (key: Key) => void,
  isListDraggable: boolean,
  isListDroppable: boolean,
  layout: ListViewLayout<T>,
  loadingState?: LoadingState,
  renderEmptyState?: () => JSX.Element
}

export const ListViewContext = React.createContext<ListViewContextValue<unknown> | null>(null);

const ROW_HEIGHTS = {
  compact: {
    medium: 32,
    large: 40
  },
  regular: {
    medium: 40,
    large: 50
  },
  spacious: {
    medium: 48,
    large: 60
  }
};

function useListLayout<T>(state: ListState<T>, density: SpectrumListViewProps<T>['density'], overflowMode: SpectrumListViewProps<T>['overflowMode']) {
  let {scale} = useProvider();
  let layout = useMemo(() =>
    new ListViewLayout<T>({
      estimatedRowHeight: ROW_HEIGHTS[density || 'regular'][scale]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , [scale, density, overflowMode]);

  return layout;
}

/**
 * A ListView displays a list of interactive items, and allows a user to navigate, select, or perform an action.
 */
export const ListView = React.forwardRef(function ListView<T extends object>(props: SpectrumListViewProps<T>, ref: DOMRef<HTMLDivElement>) {
  let {
    density = 'regular',
    loadingState,
    onLoadMore,
    isQuiet,
    overflowMode = 'truncate',
    onAction,
    dragAndDropHooks,
    renderEmptyState,
    ...otherProps
  } = props;
  let isListDraggable = !!dragAndDropHooks?.useDraggableCollectionState;
  let isListDroppable = !!dragAndDropHooks?.useDroppableCollectionState;
  let dragHooksProvided = useRef(isListDraggable);
  let dropHooksProvided = useRef(isListDroppable);
  useEffect(() => {
    if (dragHooksProvided.current !== isListDraggable) {
      console.warn('Drag hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
    }
    if (dropHooksProvided.current !== isListDroppable) {
      console.warn('Drop hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
    }
  }, [isListDraggable, isListDroppable]);

  let domRef = useDOMRef(ref);
  let state = useListState({
    ...props,
    selectionBehavior: props.selectionStyle === 'highlight' ? 'replace' : 'toggle'
  });
  let {collection, selectionManager} = state;
  let isLoading = loadingState === 'loading' || loadingState === 'loadingMore';

  let {styleProps} = useStyleProps(props);
  let dragState: DraggableCollectionState | null = null;
  let preview = useRef(null);
  if (isListDraggable && dragAndDropHooks) {
    dragState = dragAndDropHooks.useDraggableCollectionState!({
      collection,
      selectionManager,
      preview
    });
    dragAndDropHooks.useDraggableCollection!({}, dragState, domRef);
  }
  let layout = useListLayout(
    state,
    props.density || 'regular',
    overflowMode
  );

  let DragPreview = dragAndDropHooks?.DragPreview;
  let dropState: DroppableCollectionState | null = null;
  let droppableCollection: DroppableCollectionResult | null = null;
  let isRootDropTarget = false;
  if (isListDroppable && dragAndDropHooks) {
    dropState = dragAndDropHooks.useDroppableCollectionState!({
      collection,
      selectionManager
    });
    droppableCollection = dragAndDropHooks.useDroppableCollection!({
      id: props.id,
      keyboardDelegate: new ListKeyboardDelegate({
        collection,
        disabledKeys: dragState?.draggingKeys.size ? undefined : selectionManager.disabledKeys,
        ref: domRef,
        layoutDelegate: layout
      }),
      dropTargetDelegate: layout
    }, dropState, domRef);

    isRootDropTarget = dropState.isDropTarget({type: 'root'});
  }

  let {gridProps} = useGridList({
    ...props,
    isVirtualized: true,
    layoutDelegate: layout,
    onAction
  }, state, domRef);

  let focusedKey = selectionManager.focusedKey;
  let dropTargetKey: Key | null = null;
  if (dropState?.target?.type === 'item') {
    dropTargetKey = dropState.target.key;
    if (dropState.target.dropPosition === 'after') {
      // Normalize to the "before" drop position since we only render those in the DOM.
      dropTargetKey = state.collection.getKeyAfter(dropTargetKey) ?? dropTargetKey;
    }
  }

  let persistedKeys = useMemo(() => {
    return new Set([focusedKey, dropTargetKey].filter(k => k !== null));
  }, [focusedKey, dropTargetKey]);

  // wait for layout to get accurate measurements
  let [isVerticalScrollbarVisible, setVerticalScollbarVisible] = useState(false);
  let [isHorizontalScrollbarVisible, setHorizontalScollbarVisible] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (domRef.current) {
      // 2 is the width of the border which is not part of the box size
      setVerticalScollbarVisible(domRef.current.clientWidth + 2 < domRef.current.offsetWidth);
      setHorizontalScollbarVisible(domRef.current.clientHeight + 2 < domRef.current.offsetHeight);
    }
  });

  let hasAnyChildren = useMemo(() => [...collection].some(item => item.hasChildNodes), [collection]);

  return (
    <ListViewContext.Provider value={{state, dragState, dropState, dragAndDropHooks, onAction, isListDraggable, isListDroppable, layout, loadingState, renderEmptyState}}>
      <FocusScope>
        <FocusRing focusRingClass={classNames(listStyles, 'focus-ring')}>
          <Virtualizer
            {...mergeProps(isListDroppable ? droppableCollection?.collectionProps : null, gridProps)}
            {...filterDOMProps(otherProps)}
            {...gridProps}
            {...styleProps}
            isLoading={isLoading}
            onLoadMore={onLoadMore}
            ref={domRef}
            persistedKeys={persistedKeys}
            scrollDirection="vertical"
            className={
              classNames(
                listStyles,
                'react-spectrum-ListView',
                `react-spectrum-ListView--${density}`,
                'react-spectrum-ListView--emphasized',
                {
                  'react-spectrum-ListView--quiet': isQuiet,
                  'react-spectrum-ListView--loadingMore': loadingState === 'loadingMore',
                  'react-spectrum-ListView--draggable': !!isListDraggable,
                  'react-spectrum-ListView--dropTarget': !!isRootDropTarget,
                  'react-spectrum-ListView--isVerticalScrollbarVisible': isVerticalScrollbarVisible,
                  'react-spectrum-ListView--isHorizontalScrollbarVisible': isHorizontalScrollbarVisible,
                  'react-spectrum-ListView--hasAnyChildren': hasAnyChildren,
                  'react-spectrum-ListView--wrap': overflowMode === 'wrap'
                },
                styleProps.className
              )
            }
            layout={layout}
            layoutOptions={useMemo(() => ({isLoading}), [isLoading])}
            collection={collection}>
            {useCallback((type, item: Node<T>) => {
              if (type === 'item') {
                return <Item item={item} />;
              } else if (type === 'loader') {
                return <LoadingView />;
              } else if (type === 'placeholder') {
                return <EmptyState />;
              }
            }, [])}
          </Virtualizer>
        </FocusRing>
      </FocusScope>
      {DragPreview && isListDraggable && dragAndDropHooks && dragState &&
        <DragPreview ref={preview}>
          {() => {
            if (dragState.draggedKey == null) {
              return null;
            }
            if (dragAndDropHooks.renderPreview) {
              return dragAndDropHooks.renderPreview(dragState.draggingKeys, dragState.draggedKey);
            }
            let item = state.collection.getItem(dragState.draggedKey);
            if (!item) {
              return null;
            }
            let itemCount = dragState.draggingKeys.size;
            let itemHeight = layout.getLayoutInfo(dragState.draggedKey)?.rect.height ?? 0;
            return <SpectrumDragPreview item={item} itemCount={itemCount} itemHeight={itemHeight} density={density}  />;
          }}
        </DragPreview>
      }
    </ListViewContext.Provider>
  );
}) as <T>(props: SpectrumListViewProps<T> & {ref?: DOMRef<HTMLDivElement>}) => ReactElement;

function Item({item}: {item: Node<unknown>}) {
  let {isListDroppable, state, onAction} = useContext(ListViewContext)!;
  return (
    <>
      {isListDroppable && state.collection.getKeyBefore(item.key) == null &&
        <RootDropIndicator key="root" />
      }
      {isListDroppable &&
        <InsertionIndicator
          key={`${item.key}-before`}
          target={{key: item.key, type: 'item', dropPosition: 'before'}} />
      }
      <ListViewItem item={item} isEmphasized hasActions={!!onAction} />
      {isListDroppable &&
        <InsertionIndicator
          key={`${item.key}-after`}
          target={{key: item.key, type: 'item', dropPosition: 'after'}}
          isPresentationOnly={state.collection.getKeyAfter(item.key) != null} />
      }
    </>
  );
}

function LoadingView() {
  let {state} = useContext(ListViewContext)!;
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/list');
  return (
    <CenteredWrapper>
      <ProgressCircle
        isIndeterminate
        aria-label={state.collection.size > 0 ? stringFormatter.format('loadingMore') : stringFormatter.format('loading')} />
    </CenteredWrapper>
  );
}

function EmptyState() {
  let {renderEmptyState} = useContext(ListViewContext)!;
  let emptyState = renderEmptyState ? renderEmptyState() : null;
  if (emptyState == null) {
    return null;
  }

  return (
    <CenteredWrapper>
      {emptyState}
    </CenteredWrapper>
  );
}

function CenteredWrapper({children}) {
  let {state} = useContext(ListViewContext)!;
  return (
    <div
      role="row"
      aria-rowindex={state.collection.size + 1}
      className={
        classNames(
          listStyles,
          'react-spectrum-ListView-centeredWrapper',
          {
            'react-spectrum-ListView-centeredWrapper--loadingMore': state.collection.size > 0
          }
        )}>
      <div role="gridcell">
        {children}
      </div>
    </div>
  );
}
