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

import {AriaMenuProps, FocusScope, mergeProps, useFocusRing, useMenu, useMenuItem, useMenuSection, useMenuTrigger} from 'react-aria';
import {AutocompleteStateContext, InternalAutocompleteContext} from './Autocomplete';
import {BaseCollection, Collection, CollectionBuilder, createBranchComponent, createLeafComponent} from '@react-aria/collections';
import {MenuTriggerProps as BaseMenuTriggerProps, Collection as ICollection, Node, TreeState, useMenuTriggerState, useTreeState} from 'react-stately';
import {CollectionProps, CollectionRendererContext, ItemRenderProps, SectionContext, SectionProps, usePersistedKeys} from './Collection';
import {ContextValue, Provider, RenderProps, ScrollableProps, SlotProps, StyleProps, useContextProps, useRenderProps, useSlot, useSlottedContext} from './utils';
import {filterDOMProps, useEffectEvent, useObjectRef, useResizeObserver} from '@react-aria/utils';
import {forwardRefType, HoverEvents, Key, LinkDOMProps} from '@react-types/shared';
import {getItemId, useSubmenuTrigger} from '@react-aria/menu';
import {HeaderContext} from './Header';
import {KeyboardContext} from './Keyboard';
import {OverlayTriggerStateContext} from './Dialog';
import {PopoverContext, PopoverProps} from './Popover';
import {PressResponder, useHover, useInteractOutside} from '@react-aria/interactions';
import React, {
  createContext,
  ForwardedRef,
  forwardRef,
  ReactElement,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {RootMenuTriggerState, useSubmenuTriggerState} from '@react-stately/menu';
import {SeparatorContext} from './Separator';
import {TextContext} from './Text';

export const MenuContext = createContext<ContextValue<MenuProps<any>, HTMLDivElement>>(null);
export const MenuStateContext = createContext<TreeState<any> | null>(null);
export const RootMenuTriggerStateContext = createContext<RootMenuTriggerState | null>(null);

export interface MenuTriggerProps extends BaseMenuTriggerProps {
  children: ReactNode
}

export function MenuTrigger(props: MenuTriggerProps) {
  let state = useMenuTriggerState(props);
  let ref = useRef<HTMLButtonElement>(null);
  let {menuTriggerProps, menuProps} = useMenuTrigger({
    ...props,
    type: 'menu'
  }, state, ref);
  // Allows menu width to match button
  let [buttonWidth, setButtonWidth] = useState<string | null>(null);
  let onResize = useCallback(() => {
    if (ref.current) {
      setButtonWidth(ref.current.offsetWidth + 'px');
    }
  }, [ref]);

  useResizeObserver({
    ref: ref,
    onResize: onResize
  });

  let scrollRef = useRef(null);

  return (
    <Provider
      values={[
        [MenuContext, {...menuProps, ref: scrollRef}],
        [OverlayTriggerStateContext, state],
        [RootMenuTriggerStateContext, state],
        [PopoverContext, {
          trigger: 'MenuTrigger',
          triggerRef: ref,
          scrollRef,
          placement: 'bottom start',
          style: {'--trigger-width': buttonWidth} as React.CSSProperties
        }]
      ]}>
      <PressResponder {...menuTriggerProps} ref={ref} isPressed={state.isOpen}>
        {props.children}
      </PressResponder>
    </Provider>
  );
}

export interface SubmenuTriggerProps {
  /**
   * The contents of the SubmenuTrigger. The first child should be an Item (the trigger) and the second child should be the Popover (for the submenu).
   */
  children: ReactElement[],
  /**
   * The delay time in milliseconds for the submenu to appear after hovering over the trigger.
   * @default 200
   */
  delay?: number
}

const SubmenuTriggerContext = createContext<{parentMenuRef: RefObject<HTMLElement | null>} | null>(null);

/**
 * A submenu trigger is used to wrap a submenu's trigger item and the submenu itself.
 *
 * @version alpha
 */
export const SubmenuTrigger =  /*#__PURE__*/ createBranchComponent('submenutrigger', (props: SubmenuTriggerProps, ref: ForwardedRef<HTMLDivElement>, item) => {
  let {CollectionBranch} = useContext(CollectionRendererContext);
  let state = useContext(MenuStateContext)!;
  let rootMenuTriggerState = useContext(RootMenuTriggerStateContext)!;
  let submenuTriggerState = useSubmenuTriggerState({triggerKey: item.key}, rootMenuTriggerState);
  let submenuRef = useRef<HTMLDivElement>(null);
  let itemRef = useObjectRef(ref);
  let popoverContext = useSlottedContext(PopoverContext)!;
  let {parentMenuRef} = useContext(SubmenuTriggerContext)!;
  let {submenuTriggerProps, submenuProps, popoverProps} = useSubmenuTrigger({
    parentMenuRef,
    submenuRef,
    delay: props.delay
  }, submenuTriggerState, itemRef);

  return (
    <Provider
      values={[
        [MenuItemContext, {...submenuTriggerProps, onAction: undefined, ref: itemRef}],
        [MenuContext, submenuProps],
        [OverlayTriggerStateContext, submenuTriggerState],
        [PopoverContext, {
          ref: submenuRef,
          trigger: 'SubmenuTrigger',
          triggerRef: itemRef,
          placement: 'end top',
          UNSTABLE_portalContainer: popoverContext.UNSTABLE_portalContainer || undefined,
          ...popoverProps
        }]
      ]}>
      <CollectionBranch collection={state.collection} parent={item} />
      {props.children[1]}
    </Provider>
  );
}, props => props.children[0]);

export interface MenuProps<T> extends Omit<AriaMenuProps<T>, 'children'>, CollectionProps<T>, StyleProps, SlotProps, ScrollableProps<HTMLDivElement> {}

function Menu<T extends object>(props: MenuProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, MenuContext);

  // Delay rendering the actual menu until we have the collection so that auto focus works properly.
  return (
    <CollectionBuilder content={<Collection {...props} />}>
      {collection => collection.size > 0 && <MenuInner props={props} collection={collection} menuRef={ref} />}
    </CollectionBuilder>
  );
}

interface MenuInnerProps<T> {
  props: MenuProps<T>,
  collection: BaseCollection<object>,
  menuRef: RefObject<HTMLDivElement | null>
}

function MenuInner<T extends object>({props, collection, menuRef: ref}: MenuInnerProps<T>) {
  let {register, filterFn, inputValue, menuProps: autocompleteMenuProps} = useContext(InternalAutocompleteContext) || {};
  // TODO: Since menu only has `items` and not `defaultItems`, this means the user can't have completly controlled items like in ComboBox,
  // we always perform the filtering for them.
  let {setFocusedNodeId} = useContext(AutocompleteStateContext) || {};
  let filteredCollection = useMemo(() => filterFn ? collection.filter(filterFn) : collection, [collection, filterFn]);
  let state = useTreeState({
    ...props,
    collection: filteredCollection as ICollection<Node<object>>,
    children: undefined
  });

  let [popoverContainer, setPopoverContainer] = useState<HTMLDivElement | null>(null);
  let {isVirtualized, CollectionRoot} = useContext(CollectionRendererContext);
  let {menuProps} = useMenu({...props, ...autocompleteMenuProps, isVirtualized}, state, ref);
  let rootMenuTriggerState = useContext(RootMenuTriggerStateContext)!;
  let popoverContext = useContext(PopoverContext)!;
  let isSubmenu = (popoverContext as PopoverProps)?.trigger === 'SubmenuTrigger';
  useInteractOutside({
    ref,
    onInteractOutside: (e) => {
      if (rootMenuTriggerState && !popoverContainer?.contains(e.target as HTMLElement)) {
        rootMenuTriggerState.close();
      }
    },
    isDisabled: isSubmenu || rootMenuTriggerState?.expandedKeysStack.length === 0
  });

  let prevPopoverContainer = useRef<HTMLDivElement | null>(null) ;
  let [leftOffset, setLeftOffset] = useState({left: 0});
  useEffect(() => {
    if (popoverContainer && prevPopoverContainer.current !== popoverContainer && leftOffset.left === 0) {
      prevPopoverContainer.current = popoverContainer;
      let {left} = popoverContainer.getBoundingClientRect();
      setLeftOffset({left: -1 * left});
    }
  }, [leftOffset, popoverContainer]);

  let {id: menuId} = menuProps;
  useEffect(() => {
    if (register) {
      register((e: ReactKeyboardEvent) => {
        switch (e.key) {
          case 'ArrowDown':
          case 'ArrowUp':
          case 'Home':
          case 'End':
          case 'PageDown':
          case 'PageUp':
            if (!state.selectionManager.isFocused) {
              state.selectionManager.setFocused(true);
            }
            break;
          case 'ArrowLeft':
          case 'ArrowRight':
            // TODO: will need to special case this so it doesn't clear the focused key if we are currently
            // focused on a submenutrigger
            if (state.selectionManager.isFocused) {
              state.selectionManager.setFocused(false);
              state.selectionManager.setFocusedKey(null);
            }
            break;
          case 'Escape':
            // If hitting Escape, don't dispatch any events since useAutocomplete will handle whether or not
            // to continuePropagation to the overlay depending on the inputValue
            return;
        }

        let focusedId;
        if (state.selectionManager.focusedKey == null) {
          // TODO: calling menuProps.onKeyDown as an alternative to this doesn't quite work because of the check we do to prevent events from bubbling down. Perhaps
          // dispatch the event as well to the menu since I don't think we want tot change the check in useSelectableCollection
          // since we wouldn't want events to bubble through to the table
          ref.current?.dispatchEvent(
            new KeyboardEvent(e.nativeEvent.type, e.nativeEvent)
          );
        } else {
          // If there is a focused key, dispatch an event to the menu item in question. This allows us to excute any existing onAction or link navigations
          // that would have happen in a non-virtual focus case.
          focusedId = getItemId(state, state.selectionManager.focusedKey);
          let item = ref.current?.querySelector(`#${CSS.escape(focusedId)}`);
          item?.dispatchEvent(
            new KeyboardEvent(e.nativeEvent.type, e.nativeEvent)
          );
        }
        focusedId = state.selectionManager.focusedKey ? getItemId(state, state.selectionManager.focusedKey) : null;
        return focusedId;
      });
    }
  }, [register, state, menuId, ref]);

  let timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Update the focused key to be the first item in the menu only if the input value changes (aka match spotlight/other implementations).
  let focusFirstItem = useEffectEvent(() => {
    // TODO: the below is pretty much what the listkeyboard delegate would do when finding the first key
    state.selectionManager.setFocused(true);
    let focusedNode = state.collection.getItem(state.selectionManager.focusedKey);
    if (focusedNode == null || focusedNode.prevKey != null) {
      let key = state.collection.getFirstKey();
      while (key != null) {
        let item = state.collection.getItem(key);
        if (item?.type === 'item' && !state.selectionManager.isDisabled(key)) {
          break;
        }
        key = state.collection.getKeyAfter(key);
      }

      clearTimeout(timeout.current);
      state.selectionManager.setFocusedKey(key);
      timeout.current = setTimeout(() => {
        setFocusedNodeId && setFocusedNodeId(key == null ? null : getItemId(state, key));
        console.log('set focused id')
      }, 500);
    }
  });

  let clearVirtualFocus = useEffectEvent(() => {
    state.selectionManager.setFocused(false);
    state.selectionManager.setFocusedKey(null);
    setFocusedNodeId && setFocusedNodeId(null);
  });

  let lastInputValue = useRef<string | null>(null);
  useEffect(() => {
    // inputValue will always be at least "" if menu is in a Autocomplete, null is not an accepted value for inputValue
    if (inputValue != null) {
      if (lastInputValue.current != null && lastInputValue.current !== inputValue && lastInputValue.current?.length <= inputValue.length) {
        focusFirstItem();
      } else {
        clearVirtualFocus();
      }

      lastInputValue.current = inputValue;
    }
  }, [inputValue, focusFirstItem, clearVirtualFocus]);

  let renderProps = useRenderProps({
    defaultClassName: 'react-aria-Menu',
    className: props.className,
    style: props.style,
    values: {}
  });

  return (
    <FocusScope>
      <div
        {...filterDOMProps(props)}
        {...menuProps}
        {...renderProps}
        ref={ref}
        slot={props.slot || undefined}
        onScroll={props.onScroll}>
        <Provider
          values={[
            [MenuStateContext, state],
            [SeparatorContext, {elementType: 'div'}],
            [PopoverContext, {UNSTABLE_portalContainer: popoverContainer || undefined}],
            [SectionContext, {render: MenuSection}],
            [SubmenuTriggerContext, {parentMenuRef: ref}],
            [MenuItemContext, null]
          ]}>
          <CollectionRoot
            collection={state.collection}
            persistedKeys={usePersistedKeys(state.selectionManager.focusedKey)}
            scrollRef={ref} />
        </Provider>
      </div>
      <div ref={setPopoverContainer} style={{width: '100vw', position: 'absolute', top: 0, ...leftOffset}} />
    </FocusScope>
  );
}

/**
 * A menu displays a list of actions or options that a user can choose.
 */
const _Menu = /*#__PURE__*/ (forwardRef as forwardRefType)(Menu);
export {_Menu as Menu};

function MenuSection<T extends object>(props: SectionProps<T>, ref: ForwardedRef<HTMLElement>, section: Node<T>) {
  let state = useContext(MenuStateContext)!;
  let {CollectionBranch} = useContext(CollectionRendererContext);
  let [headingRef, heading] = useSlot();
  let {headingProps, groupProps} = useMenuSection({
    heading,
    'aria-label': section.props['aria-label'] ?? undefined
  });
  let renderProps = useRenderProps({
    defaultClassName: 'react-aria-Section',
    className: section.props?.className,
    style: section.props?.style,
    values: {}
  });

  return (
    <section
      {...filterDOMProps(props as any)}
      {...groupProps}
      {...renderProps}
      ref={ref}>
      <HeaderContext.Provider value={{...headingProps, ref: headingRef}}>
        <CollectionBranch collection={state.collection} parent={section} />
      </HeaderContext.Provider>
    </section>
  );
}

export interface MenuItemRenderProps extends ItemRenderProps {
  /**
   * Whether the item has a submenu.
   *
   * @selector [data-has-submenu]
   */
  hasSubmenu: boolean,
  /**
   * Whether the item's submenu is open.
   *
   * @selector [data-open]
   */
  isOpen: boolean
}

export interface MenuItemProps<T = object> extends RenderProps<MenuItemRenderProps>, LinkDOMProps, HoverEvents {
  /** The unique id of the item. */
  id?: Key,
  /** The object value that this item represents. When using dynamic collections, this is set automatically. */
  value?: T,
  /** A string representation of the item's contents, used for features like typeahead. */
  textValue?: string,
  /** An accessibility label for this item. */
  'aria-label'?: string,
  /** Whether the item is disabled. */
  isDisabled?: boolean,
  /** Handler that is called when the item is selected. */
  onAction?: () => void
}

const MenuItemContext = createContext<ContextValue<MenuItemProps, HTMLDivElement>>(null);

/**
 * A MenuItem represents an individual action in a Menu.
 */
export const MenuItem = /*#__PURE__*/ createLeafComponent('item', function MenuItem<T extends object>(props: MenuItemProps<T>, forwardedRef: ForwardedRef<HTMLDivElement>, item: Node<T>) {
  [props, forwardedRef] = useContextProps(props, forwardedRef, MenuItemContext);
  let id = useSlottedContext(MenuItemContext)?.id as string;
  let state = useContext(MenuStateContext)!;
  let ref = useObjectRef<any>(forwardedRef);

  let {menuItemProps, labelProps, descriptionProps, keyboardShortcutProps, ...states} = useMenuItem({...props, id, key: item.key}, state, ref);

  let {isFocusVisible, focusProps} = useFocusRing();
  let {hoverProps, isHovered} = useHover({
    isDisabled: states.isDisabled
  });
  let renderProps = useRenderProps({
    ...props,
    id: undefined,
    children: item.rendered,
    defaultClassName: 'react-aria-MenuItem',
    values: {
      ...states,
      isHovered,
      isFocusVisible,
      selectionMode: state.selectionManager.selectionMode,
      selectionBehavior: state.selectionManager.selectionBehavior,
      hasSubmenu: !!props['aria-haspopup'],
      isOpen: props['aria-expanded'] === 'true'
    }
  });

  let ElementType: React.ElementType = props.href ? 'a' : 'div';

  return (
    <ElementType
      {...mergeProps(menuItemProps, focusProps, hoverProps)}
      {...renderProps}
      ref={ref}
      data-disabled={states.isDisabled || undefined}
      data-hovered={isHovered || undefined}
      data-focused={states.isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-pressed={states.isPressed || undefined}
      data-selected={states.isSelected || undefined}
      data-selection-mode={state.selectionManager.selectionMode === 'none' ? undefined : state.selectionManager.selectionMode}
      data-has-submenu={!!props['aria-haspopup'] || undefined}
      data-open={props['aria-expanded'] === 'true' || undefined}>
      <Provider
        values={[
          [TextContext, {
            slots: {
              label: labelProps,
              description: descriptionProps
            }
          }],
          [KeyboardContext, keyboardShortcutProps]
        ]}>
        {renderProps.children}
      </Provider>
    </ElementType>
  );
});
