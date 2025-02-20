/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {CollectionBase, DropTargetDelegate, ItemDropTarget, Key, LayoutDelegate, RefObject} from '@react-types/shared';
import {createBranchComponent, useCachedChildren} from '@react-aria/collections';
import {Collection as ICollection, Node, SelectionBehavior, SelectionMode, SectionProps as SharedSectionProps} from 'react-stately';
import React, {createContext, ForwardedRef, HTMLAttributes, JSX, ReactElement, ReactNode, useContext, useMemo} from 'react';
import {StyleProps} from './utils';

export interface CollectionProps<T> extends Omit<CollectionBase<T>, 'children'> {
  /** The contents of the collection. */
  children?: ReactNode | ((item: T) => ReactNode),
  /** Values that should invalidate the item cache when using dynamic collections. */
  dependencies?: ReadonlyArray<any>
}

export interface ItemRenderProps {
  /**
   * Whether the item is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean,
  /**
   * Whether the item is currently in a pressed state.
   * @selector [data-pressed]
   */
  isPressed: boolean,
  /**
   * Whether the item is currently selected.
   * @selector [data-selected]
   */
  isSelected: boolean,
  /**
   * Whether the item is currently focused.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the item is currently keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the item is non-interactive, i.e. both selection and actions are disabled and the item may
   * not be focused. Dependent on `disabledKeys` and `disabledBehavior`.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * The type of selection that is allowed in the collection.
   * @selector [data-selection-mode="single | multiple"]
   */
  selectionMode: SelectionMode,
  /** The selection behavior for the collection. */
  selectionBehavior: SelectionBehavior,
  /**
   * Whether the item allows dragging.
   * @note This property is only available in collection components that support drag and drop.
   * @selector [data-allows-dragging]
   */
  allowsDragging?: boolean,
  /**
   * Whether the item is currently being dragged.
   * @note This property is only available in collection components that support drag and drop.
   * @selector [data-dragging]
   */
  isDragging?: boolean,
  /**
   * Whether the item is currently an active drop target.
   * @note This property is only available in collection components that support drag and drop.
   * @selector [data-drop-target]
   */
  isDropTarget?: boolean
}

export interface SectionProps<T> extends Omit<SharedSectionProps<T>, 'children' | 'title'>, StyleProps {
  /** The unique id of the section. */
  id?: Key,
  /** The object value that this section represents. When using dynamic collections, this is set automatically. */
  value?: T,
  /** Static child items or a function to render children. */
  children?: ReactNode | ((item: T) => ReactElement),
  /** Values that should invalidate the item cache when using dynamic collections. */
  dependencies?: ReadonlyArray<any>
}

interface SectionContextValue {
  name: string,
  render: (props: SectionProps<any>, ref: ForwardedRef<HTMLElement>, section: Node<any>, className?: string) => ReactElement
}

export const SectionContext = createContext<SectionContextValue | null>(null);

/** @deprecated */
export const Section = /*#__PURE__*/ createBranchComponent('section', <T extends object>(props: SectionProps<T>, ref: ForwardedRef<HTMLElement>, section: Node<T>): JSX.Element => {
  let {name, render} = useContext(SectionContext)!;
  console.warn(`<Section> is deprecated. Please use <${name}> instead.`);
  return render(props, ref, section, 'react-aria-Section');
});

export interface CollectionBranchProps {
  /** The collection of items to render. */
  collection: ICollection<Node<unknown>>,
  /** The parent node of the items to render. */
  parent: Node<unknown>,
  /** A function that renders a drop indicator between items. */
  renderDropIndicator?: (target: ItemDropTarget) => ReactNode
}

export interface CollectionRootProps extends HTMLAttributes<HTMLElement> {
  /** The collection of items to render. */
  collection: ICollection<Node<unknown>>,
  /** A set of keys for items that should always be persisted in the DOM. */
  persistedKeys?: Set<Key> | null,
  /** A ref to the scroll container for the collection. */
  scrollRef?: RefObject<HTMLElement | null>,
  /** A function that renders a drop indicator between items. */
  renderDropIndicator?: (target: ItemDropTarget) => ReactNode
}

export interface CollectionRenderer {
  /** Whether this is a virtualized collection. */
  isVirtualized?: boolean,
  /** A delegate object that provides layout information for items in the collection. */
  layoutDelegate?: LayoutDelegate,
  /** A delegate object that provides drop targets for pointer coordinates within the collection. */
  dropTargetDelegate?: DropTargetDelegate,
  /** A component that renders the root collection items. */
  CollectionRoot: React.ComponentType<CollectionRootProps>,
   /** A component that renders the child collection items. */
  CollectionBranch: React.ComponentType<CollectionBranchProps>
}

export const DefaultCollectionRenderer: CollectionRenderer = {
  CollectionRoot({collection, renderDropIndicator}) {
    return useCollectionRender(collection, null, renderDropIndicator);
  },
  CollectionBranch({collection, parent, renderDropIndicator}) {
    return useCollectionRender(collection, parent, renderDropIndicator);
  }
};

function useCollectionRender(
  collection: ICollection<Node<unknown>>,
  parent: Node<unknown> | null,
  renderDropIndicator?: (target: ItemDropTarget) => ReactNode
) {
  return useCachedChildren({
    items: parent ? collection.getChildren!(parent.key) : collection,
    dependencies: [renderDropIndicator],
    children(node) {
      let rendered = node.render!(node);
      if (!renderDropIndicator || node.type !== 'item') {
        return rendered;
      }

      let key = node.key;
      let keyAfter = collection.getKeyAfter(key);
      return (
        <>
          {renderDropIndicator({type: 'item', key, dropPosition: 'before'})}
          {rendered}
          {((keyAfter == null || collection.getItem(keyAfter)?.type !== 'item')) && renderDropIndicator({type: 'item', key, dropPosition: 'after'})}
        </>
      );
    }
  });
}

export const CollectionRendererContext = createContext<CollectionRenderer>(DefaultCollectionRenderer);

type PersistedKeysReturnValue = Set<Key> | null;
export function usePersistedKeys(focusedKey: Key | null): PersistedKeysReturnValue {
  return useMemo(() => focusedKey != null ? new Set([focusedKey]) : null, [focusedKey]);
}
