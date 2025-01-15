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
import {BaseCollection, Collection, CollectionBuilder, createBranchComponent, createLeafComponent} from '@react-aria/collections';
import {MenuTriggerProps as BaseMenuTriggerProps, Collection as ICollection, Node, TreeState, useMenuTriggerState, useTreeState} from 'react-stately';
import {CollectionProps, CollectionRendererContext, ItemRenderProps, SectionContext, SectionProps, usePersistedKeys} from './Collection';
import {ContextValue, Provider, RenderProps, ScrollableProps, SlotProps, StyleProps, useContextProps, useRenderProps, useSlot, useSlottedContext} from './utils';
import {DialogContext, OverlayTriggerStateContext} from './Dialog';
import {filterDOMProps, mergeRefs, useObjectRef, useResizeObserver} from '@react-aria/utils';
import {FocusStrategy, forwardRefType, HoverEvents, Key, LinkDOMProps, MultipleSelection} from '@react-types/shared';
import {HeaderContext} from './Header';
import {KeyboardContext} from './Keyboard';
import {MultipleSelectionState, SelectionManager, useMultipleSelectionState} from '@react-stately/selection';
import {PopoverContext} from './Popover';
import {PressResponder, useHover} from '@react-aria/interactions';
import React, {
  createContext,
  ForwardedRef,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react';
import {RootMenuTriggerState, useSubmenuTriggerState} from '@react-stately/menu';
import {SeparatorContext} from './Separator';
import {TextContext} from './Text';
import {UNSTABLE_InternalAutocompleteContext} from './Autocomplete';
import {useSubmenuTrigger} from '@react-aria/menu';

export const MenuContext = createContext<ContextValue<MenuProps<any>, HTMLDivElement>>(null);
export const MenuStateContext = createContext<TreeState<any> | null>(null);
export const RootMenuTriggerStateContext = createContext<RootMenuTriggerState | null>(null);
const SelectionManagerContext = createContext<SelectionManager | null>(null);

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

  // TODO: may need to do the same as below? Will need it if the subdialog shouldn't have data-react-aria-top-layer
  // // Close when clicking outside the root menu when a submenu is open.
  // let rootOverlayRef = useRef(null);
  // let rootOverlayDomRef = unwrapDOMRef(rootOverlayRef);
  // useInteractOutside({
  //   ref: rootOverlayDomRef,
  //   onInteractOutside: () => {
  //     state?.close();
  //   },
  //   isDisabled: !state.isOpen || state.expandedKeysStack.length === 0
  // });

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

const SubmenuTriggerContext = createContext<{parentMenuRef: RefObject<HTMLElement | null>, isVirtualFocus?: boolean} | null>(null);

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
  let {parentMenuRef, isVirtualFocus} = useContext(SubmenuTriggerContext)!;
  let {submenuTriggerProps, submenuProps, popoverProps} = useSubmenuTrigger({
    parentMenuRef,
    submenuRef,
    delay: props.delay,
    isVirtualFocus
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
          // Prevent parent popover from hiding submenu.
          // @ts-ignore
          'data-react-aria-top-layer': true,
          ...popoverProps
        }]
      ]}>
      <CollectionBranch collection={state.collection} parent={item} />
      {props.children[1]}
    </Provider>
  );
}, props => props.children[0]);

// TODO: at the moment is basically submenutrigger, except it has type: 'dialog', maybe we should expose a prop on SubmenuTrigger instead of having another component?
export interface SubdialogTriggerProps {
  /**
   * The contents of the SubdialogTrigger. The first child should be an Item (the trigger) and the second child should be the Popover (for the subdialog).
   */
  children: ReactElement[],
  /**
   * The delay time in milliseconds for the subdialog to appear after hovering over the trigger.
   * @default 200
   */
  delay?: number
}

/**
 * A subdialog trigger is used to wrap a subdialog's trigger item and the subdialog itself.
 *
 * @version alpha
 */
export const SubdialogTrigger =  /*#__PURE__*/ createBranchComponent('subdialogtrigger', (props: SubdialogTriggerProps, ref: ForwardedRef<HTMLDivElement>, item) => {
  let {CollectionBranch} = useContext(CollectionRendererContext);
  let state = useContext(MenuStateContext)!;
  let rootMenuTriggerState = useContext(RootMenuTriggerStateContext)!;
  let submenuTriggerState = useSubmenuTriggerState({triggerKey: item.key}, rootMenuTriggerState);
  let subdialogRef = useRef<HTMLDivElement>(null);
  let itemRef = useObjectRef(ref);
  let {parentMenuRef} = useContext(SubmenuTriggerContext)!;
  let {submenuTriggerProps, submenuProps, popoverProps} = useSubmenuTrigger({
    parentMenuRef,
    submenuRef: subdialogRef,
    type: 'dialog',
    delay: props.delay
    // TODO: might need to have something like isUnavailable like we do for ContextualHelpTrigger
  }, submenuTriggerState, itemRef);


  // TODO this was in contextual help trigger, see what it is needed for. It was provided to the Popover along with onDismissButtonPress
  // let onBlurWithin = (e) => {
  //   if (e.relatedTarget && popoverRef.current && (!popoverRef.current.UNSAFE_getDOMNode()?.contains(e.relatedTarget) && !(e.relatedTarget === triggerRef.current && getInteractionModality() === 'pointer'))) {
  //     if (submenuTriggerState.isOpen) {
  //       submenuTriggerState.close();
  //     }
  //   }
  // };

  // let onDismissButtonPress = () => {
  //   submenuTriggerState.close();
  //   parentMenuRef.current?.focus();
  // };

  return (
    <Provider
      values={[
        [MenuItemContext, {...submenuTriggerProps, onAction: undefined, ref: itemRef}],
        // TODO make this dialog context? Or do we neeed submenuProps? RSP Contextual help doesn't use submenuProps at all
        // meaning things like the id for aria-controls aren't hooked up. This might be ok since if I remember correctly that
        // attribute doesn't do anything screenreader wise. However, currently due to data-react-aria-top-layer=true we need to handle Esc at the Dialog level
        // Also this feels like it should cover more than Dialog?
        [DialogContext, submenuProps],
        [OverlayTriggerStateContext, submenuTriggerState],
        [PopoverContext, {
          ref: subdialogRef,
          // TODO: figure out if this is important, think it is just so user can control the offset like in Popover tailwind
          trigger: 'SubdialogTrigger',
          triggerRef: itemRef,
          placement: 'end top',
          // TODO: if we apply this data attribute then the dialog won't close on ESC via useOverlay due to logic in usePopover preventing it from being added
          // to the visibleOverlays list in useOverlay because isOpen is false, thus not calling onHide nor useInteractOutside. We do want this data attribute
          // because we want it to not get clipped similar to https://github.com/adobe/react-spectrum/pull/7352#discussion_r1837109265
          // Hypothertically, if we were to get rid of this data attribute then Esc will work but not clicking outside to close because this popover
          // has isNonModal = true, meaning it isn't dismissible. To resolve this we could make a custom useInteractOutside in MenuTrigger like we do in RSP
          // Prevent parent popover from hiding subdialog.
          // @ts-ignore
          'data-react-aria-top-layer': true,
          ...popoverProps
        }]
      ]}>
      <CollectionBranch collection={state.collection} parent={item} />
      {/* TODO: perhaps this should render a container or sorts? */}
      {props.children[1]}
    </Provider>
  );
}, props => props.children[0]);

export interface MenuProps<T> extends Omit<AriaMenuProps<T>, 'children'>, CollectionProps<T>, StyleProps, SlotProps, ScrollableProps<HTMLDivElement> {}

/**
 * A menu displays a list of actions or options that a user can choose.
 */
export const Menu = /*#__PURE__*/ (forwardRef as forwardRefType)(function Menu<T extends object>(props: MenuProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, MenuContext);

  // Delay rendering the actual menu until we have the collection so that auto focus works properly.
  return (
    <CollectionBuilder content={<Collection {...props} />}>
      {collection => collection.size > 0 && <MenuInner props={props} collection={collection} menuRef={ref} />}
    </CollectionBuilder>
  );
});

interface MenuInnerProps<T> {
  props: MenuProps<T>,
  collection: BaseCollection<object>,
  menuRef: RefObject<HTMLDivElement | null>
}

function MenuInner<T extends object>({props, collection, menuRef: ref}: MenuInnerProps<T>) {
  let {filterFn, collectionProps: autocompleteMenuProps, collectionRef} = useContext(UNSTABLE_InternalAutocompleteContext) || {};
  // Memoed so that useAutocomplete callback ref is properly only called once on mount and not everytime a rerender happens
  ref = useObjectRef(useMemo(() => mergeRefs(ref, collectionRef !== undefined ? collectionRef as RefObject<HTMLDivElement> : null), [collectionRef, ref]));
  let filteredCollection = useMemo(() => filterFn ? collection.filter(filterFn) : collection, [collection, filterFn]);
  let state = useTreeState({
    ...props,
    collection: filteredCollection as ICollection<Node<object>>,
    children: undefined
  });
  let triggerState = useContext(RootMenuTriggerStateContext);
  let {isVirtualized, CollectionRoot} = useContext(CollectionRendererContext);
  let {menuProps} = useMenu({...props, ...autocompleteMenuProps, isVirtualized, onClose: props.onClose || triggerState?.close}, state, ref);
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
            [SectionContext, {name: 'MenuSection', render: MenuSectionInner}],
            [SubmenuTriggerContext, {parentMenuRef: ref, isVirtualFocus: autocompleteMenuProps?.shouldUseVirtualFocus}],
            [MenuItemContext, null],
            [UNSTABLE_InternalAutocompleteContext, null],
            [SelectionManagerContext, state.selectionManager]
          ]}>
          <CollectionRoot
            collection={state.collection}
            persistedKeys={usePersistedKeys(state.selectionManager.focusedKey)}
            scrollRef={ref} />
        </Provider>
      </div>
    </FocusScope>
  );
}

export interface MenuSectionProps<T> extends SectionProps<T>, MultipleSelection {}

// A subclass of SelectionManager that forwards focus-related properties to the parent,
// but has its own local selection state.
class GroupSelectionManager extends SelectionManager {
  private parent: SelectionManager;

  constructor(parent: SelectionManager, state: MultipleSelectionState) {
    super(parent.collection, state);
    this.parent = parent;
  }

  get focusedKey() {
    return this.parent.focusedKey;
  }

  get isFocused() {
    return this.parent.isFocused;
  }

  setFocusedKey(key: Key | null, childFocusStrategy?: FocusStrategy): void {
    return this.parent.setFocusedKey(key, childFocusStrategy);
  }

  setFocused(isFocused: boolean): void {
    this.parent.setFocused(isFocused);
  }

  get childFocusStrategy() {
    return this.parent.childFocusStrategy;
  }
}

function MenuSectionInner<T extends object>(props: MenuSectionProps<T>, ref: ForwardedRef<HTMLElement>, section: Node<T>, className = 'react-aria-MenuSection') {
  let state = useContext(MenuStateContext)!;
  let {CollectionBranch} = useContext(CollectionRendererContext);
  let [headingRef, heading] = useSlot();
  let {headingProps, groupProps} = useMenuSection({
    heading,
    'aria-label': section.props['aria-label'] ?? undefined
  });
  let renderProps = useRenderProps({
    defaultClassName: className,
    className: section.props?.className,
    style: section.props?.style,
    values: {}
  });

  let parent = useContext(SelectionManagerContext)!;
  let selectionState = useMultipleSelectionState(props);
  let manager = props.selectionMode != null ? new GroupSelectionManager(parent, selectionState) : parent;

  return (
    <section
      {...filterDOMProps(props as any)}
      {...groupProps}
      {...renderProps}
      ref={ref}>
      <Provider
        values={[
          [HeaderContext, {...headingProps, ref: headingRef}],
          [SelectionManagerContext, manager]
        ]}>
        <CollectionBranch collection={state.collection} parent={section} />
      </Provider>
    </section>
  );
}

/**
 * A MenuSection represents a section within a Menu.
 */
export const MenuSection = /*#__PURE__*/ createBranchComponent('section', MenuSectionInner);

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
  let selectionManager = useContext(SelectionManagerContext)!;

  let {menuItemProps, labelProps, descriptionProps, keyboardShortcutProps, ...states} = useMenuItem({
    ...props,
    id,
    key: item.key,
    selectionManager
  }, state, ref);

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
      selectionMode: selectionManager.selectionMode,
      selectionBehavior: selectionManager.selectionBehavior,
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
      data-selection-mode={selectionManager.selectionMode === 'none' ? undefined : selectionManager.selectionMode}
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
