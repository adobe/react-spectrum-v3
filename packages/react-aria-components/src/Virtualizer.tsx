/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {CollectionBranchProps, CollectionRenderer, CollectionRendererContext, CollectionRootProps} from './Collection';
import {DropPosition, DropTarget, DropTargetDelegate, ItemDropTarget, Node} from '@react-types/shared';
import {Layout, ReusableView, useVirtualizerState, VirtualizerState} from '@react-stately/virtualizer';
import React, {createContext, ReactElement, ReactNode, useContext, useMemo} from 'react';
import {useScrollView, VirtualizerItem} from '@react-aria/virtualizer';

type View = ReusableView<Node<unknown>, ReactNode>;

export interface LayoutOptionsDelegate<O> {
  useLayoutOptions?(): O
}

interface ILayout<O> extends Layout<Node<unknown>, O>, Partial<DropTargetDelegate>, LayoutOptionsDelegate<O> {}

export interface VirtualizerProps<O> {
  /** The child collection to virtualize (e.g. ListBox, GridList, or Table). */
  children: ReactNode,
  /** The layout object that determines the position and size of the visible elements. */
  layout: ILayout<O>,
  /** Options for the layout. */
  layoutOptions?: O
}

const VirtualizerContext = createContext<VirtualizerState<any, any> | null>(null);
const LayoutContext = createContext<Pick<VirtualizerProps<any>, 'layout' | 'layoutOptions'> | null>(null);

/**
 * A Virtualizer renders a scrollable collection of data using customizable layouts.
 * It supports very large collections by only rendering visible items to the DOM, reusing
 * them as the user scrolls.
 */
export function Virtualizer<O>(props: VirtualizerProps<O>): ReactElement {
  let {children, layout, layoutOptions} = props;
  let renderer: CollectionRenderer = useMemo(() => ({
    isVirtualized: true,
    layoutDelegate: layout,
    dropTargetDelegate: layout.getDropTargetFromPoint ? layout as DropTargetDelegate : undefined,
    CollectionRoot,
    CollectionBranch
  }), [layout]);

  return (
    <CollectionRendererContext.Provider value={renderer}>
      <LayoutContext.Provider value={{layout, layoutOptions}}>
        {children}
      </LayoutContext.Provider>
    </CollectionRendererContext.Provider>
  );
}

function CollectionRoot({collection, persistedKeys, scrollRef, renderDropIndicator}: CollectionRootProps) {
  let {layout, layoutOptions} = useContext(LayoutContext)!;
  let layoutOptions2 = layout.useLayoutOptions?.();
  let state = useVirtualizerState({
    layout,
    collection,
    renderView: (type, item) => {
      return item?.render?.(item);
    },
    onVisibleRectChange(rect) {
      let element = scrollRef?.current;
      if (element) {
        element.scrollLeft = rect.x;
        element.scrollTop = rect.y;
      }
    },
    persistedKeys,
    layoutOptions: useMemo(() => {
      if (layoutOptions && layoutOptions2) {
        return {...layoutOptions, ...layoutOptions2};
      }
      return layoutOptions || layoutOptions2;
    }, [layoutOptions, layoutOptions2])
  });

  let {contentProps} = useScrollView({
    onVisibleRectChange: state.setVisibleRect,
    contentSize: state.contentSize,
    onScrollStart: state.startScrolling,
    onScrollEnd: state.endScrolling
  }, scrollRef!);

  if (state.contentSize.area === 0) {
    return null;
  }

  return (
    <div {...contentProps}>
      <VirtualizerContext.Provider value={state}>
        {renderChildren(null, state.visibleViews, renderDropIndicator)}
      </VirtualizerContext.Provider>
    </div>
  );
}

function CollectionBranch({parent, renderDropIndicator}: CollectionBranchProps) {
  let virtualizer = useContext(VirtualizerContext);
  let parentView = virtualizer!.virtualizer.getVisibleView(parent.key)!;
  return renderChildren(parentView, Array.from(parentView.children), renderDropIndicator);
}

function renderChildren(parent: View | null, children: View[], renderDropIndicator?: (target: ItemDropTarget) => ReactNode) {
  return children.map(view => renderWrapper(parent, view, renderDropIndicator));
}

function renderWrapper(
  parent: View | null,
  reusableView: View,
  renderDropIndicator?: (target: ItemDropTarget) => ReactNode
): ReactElement {
  let rendered = (
    <VirtualizerItem
      key={reusableView.key}
      layoutInfo={reusableView.layoutInfo!}
      virtualizer={reusableView.virtualizer}
      parent={parent?.layoutInfo}>
      {reusableView.rendered}
    </VirtualizerItem>
  );

  let {collection, layout} = reusableView.virtualizer;
  let {key, type} = reusableView.content!;
  if (type === 'item' && renderDropIndicator && layout.getDropTargetLayoutInfo) {
    rendered = (
      <React.Fragment key={reusableView.key}>
        {renderDropIndicatorWrapper(parent, reusableView, 'before', renderDropIndicator)}
        {rendered}
        {collection.getKeyAfter(key) == null && renderDropIndicatorWrapper(parent, reusableView, 'after', renderDropIndicator)}
      </React.Fragment>
    );
  }

  return rendered;
}

function renderDropIndicatorWrapper(
  parent: View | null,
  reusableView: View,
  dropPosition: DropPosition,
  renderDropIndicator: (target: ItemDropTarget) => ReactNode
) {
  let target: DropTarget = {type: 'item', key: reusableView.content!.key, dropPosition};
  let indicator = renderDropIndicator(target);
  if (indicator) {
    let layoutInfo = reusableView.virtualizer.layout.getDropTargetLayoutInfo!(target);
    indicator = (
      <VirtualizerItem
        layoutInfo={layoutInfo}
        virtualizer={reusableView.virtualizer}
        parent={parent?.layoutInfo}>
        {indicator}
      </VirtualizerItem>
    );
  }

  return indicator;
}
