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
import {AsyncLoadable, DOMRef, Key, LoadingState, SpectrumSelectionProps, StyleProps} from '@react-types/shared';
import {classNames, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import type {DragAndDropHooks} from '@react-spectrum/dnd';
import type {DraggableCollectionState, DroppableCollectionState} from '@react-stately/dnd';
import type {DroppableCollectionResult} from '@react-aria/dnd';
import {filterDOMProps, mergeProps, useLayoutEffect} from '@react-aria/utils';
import {FocusRing, FocusScope} from '@react-aria/focus';
import InsertionIndicator from './InsertionIndicator';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {ListLayout} from '@react-stately/layout';
import {ListState, useListState} from '@react-stately/list';
import listStyles from './styles.css';
import {ListViewItem} from './ListViewItem';
import {ProgressCircle} from '@react-spectrum/progress';
import React, {JSX, ReactElement, useContext, useEffect, useMemo, useRef, useState} from 'react';
import RootDropIndicator from './RootDropIndicator';
import {DragPreview as SpectrumDragPreview} from './DragPreview';
import {useCollator, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useProvider} from '@react-spectrum/provider';
import {Virtualizer} from '@react-aria/virtualizer';

export interface SpectrumListViewProps<T> extends AriaGridListProps<T>, StyleProps, SpectrumSelectionProps, Omit<AsyncLoadable, 'isLoading'> {
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
  dragState: DraggableCollectionState,
  dropState: DroppableCollectionState,
  dragAndDropHooks: DragAndDropHooks['dragAndDropHooks'],
  onAction:(key: Key) => void,
  isListDraggable: boolean,
  isListDroppable: boolean,
  layout: ListLayout<T>,
  loadingState: LoadingState
}

export const ListViewContext = React.createContext<ListViewContextValue<unknown>>(null);

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
  let collator = useCollator({usage: 'search', sensitivity: 'base'});
  let isEmpty = state.collection.size === 0;
  let layout = useMemo(() =>
    new ListLayout<T>({
      estimatedRowHeight: ROW_HEIGHTS[density][scale],
      padding: 0,
      collator,
      loaderHeight: isEmpty ? null : ROW_HEIGHTS[density][scale]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , [collator, scale, density, isEmpty, overflowMode]);

  layout.collection = state.collection;
  layout.disabledKeys = state.disabledKeys;
  return layout;
}

function ListView<T extends object>(props: SpectrumListViewProps<T>, ref: DOMRef<HTMLDivElement>) {
  let {
    density = 'regular',
    loadingState,
    onLoadMore,
    isQuiet,
    overflowMode = 'truncate',
    onAction,
    dragAndDropHooks,
    ...otherProps
  } = props;
  let isListDraggable = !!dragAndDropHooks?.useDraggableCollectionState;
  let isListDroppable = !!dragAndDropHooks?.useDroppableCollectionState;
  let dragHooksProvided = useRef(isListDraggable);
  let dropHooksProvided = useRef(isListDroppable);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (dragHooksProvided.current !== isListDraggable) {
        console.warn('Drag hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
      }
      if (dropHooksProvided.current !== isListDroppable) {
        console.warn('Drop hooks were provided during one render, but not another. This should be avoided as it may produce unexpected behavior.');
      }
    }
  }, [isListDraggable, isListDroppable]);

  let domRef = useDOMRef(ref);
  let state = useListState({
    ...props,
    selectionBehavior: props.selectionStyle === 'highlight' ? 'replace' : 'toggle'
  });
  let {collection, selectionManager} = state;
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/list');
  let isLoading = loadingState === 'loading' || loadingState === 'loadingMore';

  let {styleProps} = useStyleProps(props);
  let dragState: DraggableCollectionState;
  let preview = useRef(null);
  if (isListDraggable) {
    dragState = dragAndDropHooks.useDraggableCollectionState({
      collection,
      selectionManager,
      preview
    });
    dragAndDropHooks.useDraggableCollection({}, dragState, domRef);
  }
  let layout = useListLayout(
    state,
    props.density || 'regular',
    overflowMode
  );
  // !!0 is false, so we can cast size or undefined and they'll be falsy
  layout.allowDisabledKeyFocus = state.selectionManager.disabledBehavior === 'selection' || !!dragState?.draggingKeys.size;


  let DragPreview = dragAndDropHooks?.DragPreview;
  let dropState: DroppableCollectionState;
  let droppableCollection: DroppableCollectionResult;
  let isRootDropTarget: boolean;
  if (isListDroppable) {
    dropState = dragAndDropHooks.useDroppableCollectionState({
      collection,
      selectionManager
    });
    droppableCollection = dragAndDropHooks.useDroppableCollection({
      keyboardDelegate: layout,
      dropTargetDelegate: layout
    }, dropState, domRef);

    isRootDropTarget = dropState.isDropTarget({type: 'root'});
  }

  let {gridProps} = useGridList({
    ...props,
    isVirtualized: true,
    keyboardDelegate: layout,
    onAction
  }, state, domRef);

  // Sync loading state into the layout.
  layout.isLoading = isLoading;

  let focusedKey = selectionManager.focusedKey;
  if (dropState?.target?.type === 'item') {
    focusedKey = dropState.target.key;
  }

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
    <ListViewContext.Provider value={{state, dragState, dropState, dragAndDropHooks, onAction, isListDraggable, isListDroppable, layout, loadingState}}>
      <FocusScope>
        <FocusRing focusRingClass={classNames(listStyles, 'focus-ring')}>
          <Virtualizer
            {...mergeProps(isListDroppable && droppableCollection?.collectionProps, gridProps)}
            {...filterDOMProps(otherProps)}
            {...gridProps}
            {...styleProps}
            isLoading={isLoading}
            onLoadMore={onLoadMore}
            ref={domRef}
            focusedKey={focusedKey}
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
            collection={collection}
            transitionDuration={isLoading ? 160 : 220}>
            {(type, item) => {
              if (type === 'item') {
                return (
                  <>
                    {isListDroppable && collection.getKeyBefore(item.key) == null &&
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
                        isPresentationOnly={collection.getKeyAfter(item.key) != null} />
                    }
                  </>
                );
              } else if (type === 'loader') {
                return (
                  <CenteredWrapper>
                    <ProgressCircle
                      isIndeterminate
                      aria-label={collection.size > 0 ? stringFormatter.format('loadingMore') : stringFormatter.format('loading')} />
                  </CenteredWrapper>
                );
              } else if (type === 'placeholder') {
                let emptyState = props.renderEmptyState ? props.renderEmptyState() : null;
                if (emptyState == null) {
                  return null;
                }

                return (
                  <CenteredWrapper>
                    {emptyState}
                  </CenteredWrapper>
                );
              }

            }}
          </Virtualizer>
        </FocusRing>
      </FocusScope>
      {DragPreview && isListDraggable &&
        <DragPreview ref={preview}>
          {() => {
            if (dragAndDropHooks.renderPreview) {
              return dragAndDropHooks.renderPreview(dragState.draggingKeys, dragState.draggedKey);
            }
            let item = state.collection.getItem(dragState.draggedKey);
            let itemCount = dragState.draggingKeys.size;
            let itemHeight = layout.getLayoutInfo(dragState.draggedKey).rect.height;
            return <SpectrumDragPreview item={item} itemCount={itemCount} itemHeight={itemHeight} density={density}  />;
          }}
        </DragPreview>
      }
    </ListViewContext.Provider>
  );
}

function CenteredWrapper({children}) {
  let {state} = useContext(ListViewContext);
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

/**
 * A ListView displays a list of interactive items, and allows a user to navigate, select, or perform an action.
 */
const _ListView = React.forwardRef(ListView) as <T>(props: SpectrumListViewProps<T> & {ref?: DOMRef<HTMLDivElement>}) => ReactElement;
export {_ListView as ListView};
