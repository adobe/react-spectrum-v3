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

import {
  Breadcrumb as AriaBreadcrumb,
  BreadcrumbsProps as AriaBreadcrumbsProps,
  CollectionRenderer,
  ContextValue,
  HeadingContext,
  Link,
  Provider,
  Breadcrumbs as RACBreadcrumbs,
  UNSTABLE_CollectionRendererContext,
  UNSTABLE_DefaultCollectionRenderer
} from 'react-aria-components';
import {AriaBreadcrumbItemProps, useLocale} from 'react-aria';
import ChevronIcon from '../ui-icons/Chevron';
import {Collection, DOMRef, DOMRefValue, LinkDOMProps, Node} from '@react-types/shared';
import {createContext, forwardRef, Fragment, ReactNode, RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {focusRing, getAllowedOverrides, StyleProps} from './style-utils' with {type: 'macro'};
import FolderIcon from '../s2wf-icons/S2_Icon_FolderBreadcrumb_20_N.svg';
import {forwardRefType} from './types';
import {Menu, MenuItem, MenuTrigger} from './Menu';
import {ActionButton as S2ActionButton} from './ActionButton';
import {size, style} from '../style/spectrum-theme' with { type: 'macro' };
import {Text} from './Content';
import {useDOMRef, useResizeObserver} from '@react-spectrum/utils';
import {useLayoutEffect} from '@react-aria/utils';
import {useSpectrumContextProps} from './useSpectrumContextProps';

const MIN_VISIBLE_ITEMS = 1;
const MAX_VISIBLE_ITEMS = 4;

interface BreadcrumbsStyleProps {
  /**
   * Size of the Breadcrumbs including spacing and layout.
   *
   * @default 'M'
   */
  size?: 'M' | 'L',
  /** Whether the breadcrumbs are disabled. */
  isDisabled?: boolean
  /**
   * Whether to place the last Breadcrumb item onto a new line.
   */
  // TODO: isMultiline?: boolean
  /** Whether to always show the root item if the items are collapsed. */
  // TODO: showRoot?: boolean,
}

export interface BreadcrumbsProps<T> extends Omit<AriaBreadcrumbsProps<T>, 'children' | 'items' | 'style' | 'className'>, BreadcrumbsStyleProps, StyleProps {
  /** The children of the Breadcrumbs. */
  children?: ReactNode
}

export const BreadcrumbsContext = createContext<ContextValue<BreadcrumbsProps<any>, DOMRefValue<HTMLOListElement>>>(null);

const wrapper = style<BreadcrumbsStyleProps>({
  position: 'relative',
  display: 'flex',
  justifyContent: 'start',
  listStyleType: 'none',
  flexWrap: 'nowrap',
  flexGrow: 1,
  flexShrink: 0,
  flexBasis: 0,
  gap: {
    size: {
      M: size(6), // breadcrumbs-text-to-separator-medium
      L: size(9) // breadcrumbs-text-to-separator-large
    }
  },
  padding: 0,
  transition: 'default',
  marginTop: 0,
  marginBottom: 0,
  marginStart: {
    size: {
      M: size(6),
      L: size(9)
    }
  }
}, getAllowedOverrides());

const InternalBreadcrumbsContext = createContext<BreadcrumbsProps<any>>({});

function Breadcrumbs<T extends object>(props: BreadcrumbsProps<T>, ref: DOMRef<HTMLOListElement>) {
  [props, ref] = useSpectrumContextProps(props, ref, BreadcrumbsContext);
  let domRef = useDOMRef(ref);
  let {
    UNSAFE_className = '',
    UNSAFE_style,
    styles,
    size = 'M',
    children,
    isDisabled,
    ...otherProps
  } = props;

  return (
    <Provider
      values={[
        [InternalBreadcrumbsContext, {size, isDisabled}]
      ]}>
      <CollapsingCollection containerRef={domRef} onAction={props.onAction}>
        <RACBreadcrumbs
          {...otherProps}
          isDisabled={isDisabled}
          ref={domRef}
          style={UNSAFE_style}
          className={UNSAFE_className + wrapper({
            size
          }, styles)}>
          {children}
        </RACBreadcrumbs>
      </CollapsingCollection>
    </Provider>
  );
}

let BreadcrumbMenu = (props: {items: Array<Node<any>>, onAction: BreadcrumbsProps<unknown>['onAction']}) => {
  let {items, onAction} = props;
  let {direction} = useLocale();
  let {size, isDisabled} = useContext(InternalBreadcrumbsContext);
  // TODO localize See more
  // somehow remove the "link out" icon in Menus?
  return (
    <UNSTABLE_CollectionRendererContext.Provider value={UNSTABLE_DefaultCollectionRenderer}>
      <li className={breadcrumbStyles({size, isDisabled, isMenu: true})}>
        <MenuTrigger>
          <S2ActionButton isDisabled={isDisabled} isQuiet aria-label="See more"><FolderIcon /></S2ActionButton>
          {/* @ts-ignore - how are these onAction's not compatible? */}
          <Menu items={items} onAction={onAction}>
            {(item: Node<any>) => (
              <MenuItem
                {...item.props.originalProps}
                key={item.key}>
                <Text slot="label">
                  {item.props.children({size, isInCtx: true, isCurrent: false, isMenu: true})}
                </Text>
              </MenuItem>
            )}
          </Menu>
        </MenuTrigger>
        <ChevronIcon
          size={size}
          className={chevronStyles({direction, isMenu: true})} />
      </li>
    </UNSTABLE_CollectionRendererContext.Provider>
  );
};

/** Breadcrumbs show hierarchy and navigational context for a user’s location within an application. */
let _Breadcrumbs = /*#__PURE__*/ (forwardRef as forwardRefType)(Breadcrumbs);
export {_Breadcrumbs as Breadcrumbs};

let HiddenBreadcrumbs = function (props: {listRef: RefObject<HTMLDivElement | null>, items: Array<Node<any>>, size: string}) {
  let {listRef, items, size} = props;
  return (
    <div
      // @ts-ignore
      inert="true"
      ref={listRef}
      className={style({
        display: '[inherit]',
        gap: '[inherit]',
        flexWrap: '[inherit]',
        position: 'absolute',
        top: 0,
        bottom: 0,
        start: 0,
        end: 0,
        visibility: 'hidden',
        overflow: 'hidden',
        opacity: 0
      })}>
      {items.map((item, idx) => {
        // pull off individual props as an allow list, don't want refs or other props getting through
        return (
          <div
            data-hidden-breadcrumb
            style={item.props.UNSAFE_style}
            key={item.key}
            className={item.props.className({size, isCurrent: idx === items.length - 1})}>
            {item.props.children({size, isInCtx: true, isCurrent: idx === items.length - 1})}
          </div>
        );
      })}
      <S2ActionButton data-hidden-button isQuiet><FolderIcon /></S2ActionButton>
    </div>
  );
};

const breadcrumbStyles = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'start',
  height: 'control',
  transition: 'default',
  position: 'relative',
  flexShrink: 0,
  color: {
    default: 'neutral',
    isDisabled: 'disabled',
    forcedColors: {
      default: 'ButtonText',
      isDisabled: 'GrayText'
    }
  },
  borderStyle: 'none',
  marginStart: {
    // adjusts with the parent flex gap
    isMenu: size(-6)
  }
});

const chevronStyles = style({
  scale: {
    direction: {
      rtl: -1
    }
  },
  marginStart: {
    default: 'text-to-visual',
    isMenu: 0
  },
  '--iconPrimary': {
    type: 'fill',
    value: 'currentColor'
  }
});

const linkStyles = style({
  ...focusRing(),
  borderRadius: 'sm',
  color: {
    default: 'neutral-subdued',
    isDisabled: 'disabled',
    isCurrent: 'neutral',
    forcedColors: {
      default: 'LinkText',
      isDisabled: 'GrayText'
    }
  },
  transition: 'default',
  font: 'control',
  fontWeight: {
    default: 'normal',
    isCurrent: 'bold'
  },
  textDecoration: {
    default: 'none',
    isHovered: 'underline',
    isFocusVisible: 'underline',
    isDisabled: 'none'
  },
  cursor: {
    default: 'pointer',
    isDisabled: 'default'
  },
  outlineColor: {
    default: 'focus-ring',
    forcedColors: 'Highlight'
  },
  disableTapHighlight: true
});

const currentStyles = style<{size: string}>({
  font: 'control',
  fontWeight: 'bold'
});

// TODO: support user heading size customization, for now just set it to large
const heading = style({
  margin: 0,
  font: 'heading-lg',
  fontWeight: 'extra-bold'
});

export interface BreadcrumbProps extends Omit<AriaBreadcrumbItemProps, 'children' | 'style' | 'className' | 'autoFocus'>, LinkDOMProps {
  /** The children of the breadcrumb item. */
  children?: ReactNode
}

function Breadcrumb({children, ...props}: BreadcrumbProps, ref: DOMRef<HTMLLIElement>) {
  let {href, target, rel, download, ping, referrerPolicy} = props;
  let {size = 'M'} = useContext(InternalBreadcrumbsContext) ?? {};
  let domRef = useDOMRef(ref);
  let {direction} = useLocale();
  return (
    <AriaBreadcrumb
      {...props}
      ref={domRef}
      // @ts-ignore
      originalProps={props}
      className={({isCurrent, isDisabled}) => breadcrumbStyles({size, isCurrent, isDisabled})}>
      {({
        isCurrent,
        isDisabled,
        // @ts-ignore
        isMenu
      }) => {
        if (isMenu) {
          return children;
        }
        return (
          isCurrent ?
            <div
              className={currentStyles({size})}>
              <Provider
                values={[
                  [HeadingContext, {className: heading}]
                ]}>
                {children}
              </Provider>
            </div>
            : (
              <>
                <Link
                  style={({isFocusVisible}) => ({clipPath: isFocusVisible ? 'none' : 'margin-box'})}
                  href={href}
                  target={target}
                  rel={rel}
                  download={download}
                  ping={ping}
                  referrerPolicy={referrerPolicy}
                  isDisabled={isDisabled || isCurrent}
                  className={({isFocused, isFocusVisible, isHovered, isDisabled, isPressed}) => linkStyles({isFocused, isFocusVisible, isHovered, isDisabled, size, isCurrent, isPressed})}>
                  {children}
                </Link>
                <ChevronIcon
                  size="M"
                  className={chevronStyles({direction})} />
              </>
            )
        );
      }}
    </AriaBreadcrumb>
  );
}

/** An individual Breadcrumb for Breadcrumbs. */
let _Breadcrumb = /*#__PURE__*/ (forwardRef as forwardRefType)(Breadcrumb);
export {_Breadcrumb as Breadcrumb};

// Context for passing the count for the custom renderer
let CollapseContext = createContext<{
  containerRef: RefObject<HTMLOListElement | null>,
  onAction: BreadcrumbsProps<unknown>['onAction']
} | null>(null);

function CollapsingCollection({children, containerRef, onAction}) {
  return (
    <CollapseContext.Provider value={{containerRef, onAction}}>
      <UNSTABLE_CollectionRendererContext.Provider value={CollapsingCollectionRenderer}>
        {children}
      </UNSTABLE_CollectionRendererContext.Provider>
    </CollapseContext.Provider>
  );
}

let CollapsingCollectionRenderer: CollectionRenderer = {
  CollectionRoot({collection}) {
    return useCollectionRender(collection);
  },
  CollectionBranch({collection}) {
    return useCollectionRender(collection);
  }
};

let useCollectionRender = (collection: Collection<Node<unknown>>) => {
  let {containerRef, onAction} = useContext(CollapseContext) ?? {};
  let [visibleItems, setVisibleItems] = useState(collection.size);

  let children = useMemo(() => {
    let result: Node<any>[] = [];
    for (let key of collection.getKeys()) {
      result.push(collection.getItem(key)!);
    }
    return result;
  }, [collection]);

  let listRef = useRef<HTMLDivElement | null>(null);
  let updateOverflow = useCallback(() => {
    let currListRef: HTMLDivElement | null = listRef.current;
    if (!currListRef) {
      setVisibleItems(collection.size);
      return;
    }
    let container = currListRef.parentElement;
    if (!container) {
      setVisibleItems(collection.size);
      return;
    }

    let listItems = Array.from(currListRef.querySelectorAll('[data-hidden-breadcrumb]')) as HTMLLIElement[];
    let folder = currListRef.querySelector('button') as HTMLButtonElement;
    if (listItems.length <= 0) {
      setVisibleItems(collection.size);
      return;
    }
    let containerWidth = container.offsetWidth;
    let containerGap = parseInt(getComputedStyle(container).gap, 10);
    let folderGap = parseInt(getComputedStyle(folder).marginInlineStart, 10);
    let newVisibleItems = 0;

    let widths: Array<number> = [];
    for (let breadcrumb of listItems) {
      let width = breadcrumb.offsetWidth + 1; // offsetWidth is rounded down
      widths.push(width);
    }

    // we know there is always at least one item because of the listItems.length check up above
    let widthOfFirst = widths.shift()!;
    let availableWidth = containerWidth - widthOfFirst - folderGap - folder.offsetWidth - containerGap;
    for (let width of widths.reverse()) {
      availableWidth -= width;
      if (availableWidth <= 0) {
        break;
      }
      availableWidth -= containerGap;
      newVisibleItems++;
    }

    setVisibleItems(Math.max(MIN_VISIBLE_ITEMS, Math.min(MAX_VISIBLE_ITEMS, newVisibleItems)));
  }, [collection.size, setVisibleItems]);

  // making bad assumption that i can listen to containerRef when it's declared in the parent?
  useResizeObserver({ref: containerRef, onResize: updateOverflow});

  useLayoutEffect(() => {
    if (collection.size > 0) {
      queueMicrotask(updateOverflow);
    }
  }, [collection.size, updateOverflow]);

  useEffect(() => {
    // Recalculate visible tags when fonts are loaded.
    document.fonts?.ready.then(() => updateOverflow());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  let sliceIndex = collection.size - visibleItems;

  return (
    <>
      <HiddenBreadcrumbs items={children} size="M" listRef={listRef} />
      {visibleItems < collection.size ? (
        <>
          {children[0].render?.(children[0])}
          {/* @ts-ignore - how are these onAction's not compatible? */}
          <BreadcrumbMenu items={children.slice(1, sliceIndex)} onAction={onAction} />
          {children.slice(sliceIndex).map(node => <Fragment key={node.key}>{node.render?.(node)}</Fragment >)}
        </>
      ) : (
        <>
          {children.map(node => node.render?.(node))}
        </>
      )}
    </>
  );
};
