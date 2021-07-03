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
import {ActionButton} from '@react-spectrum/button';
import {BreadcrumbItem} from './BreadcrumbItem';
import {classNames, useDOMRef, useStyleProps, useValueEffect} from '@react-spectrum/utils';
import {DOMRef} from '@react-types/shared';
import FolderBreadcrumb from '@spectrum-icons/ui/FolderBreadcrumb';
import {Menu, MenuTrigger} from '@react-spectrum/menu';
import React, {Key, ReactElement, useCallback, useRef} from 'react';
import {SpectrumBreadcrumbsProps} from '@react-types/breadcrumbs';
import styles from '@adobe/spectrum-css-temp/components/breadcrumb/vars.css';
import {useBreadcrumbs} from '@react-aria/breadcrumbs';
import {useLayoutEffect} from '@react-aria/utils';
import {useProviderProps} from '@react-spectrum/provider';
import {useResizeObserver} from '@react-aria/utils';

const MIN_VISIBLE_ITEMS = 1;
const MAX_VISIBLE_ITEMS = 4;

function Breadcrumbs<T>(props: SpectrumBreadcrumbsProps<T>, ref: DOMRef) {
  props = useProviderProps(props);
  let {
    size = 'L',
    isMultiline,
    children,
    showRoot,
    isDisabled,
    onAction,
    ...otherProps
  } = props;

  // Not using React.Children.toArray because it mutates the key prop.
  let childArray: ReactElement[] = [];
  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      childArray.push(child);
    }
  });

  let domRef = useDOMRef(ref);
  let listRef = useRef<HTMLUListElement>(null);

  let [visibleItems, setVisibleItems] = useValueEffect(childArray.length);

  let {navProps} = useBreadcrumbs(props);
  let {styleProps} = useStyleProps(otherProps);

  let updateOverflow = useCallback(() => {
    let computeVisibleItems = (visibleItems: number) => {
      let listItems = Array.from(listRef.current.children) as HTMLLIElement[];
      let containerWidth = listRef.current.offsetWidth;
      let isShowingMenu = childArray.length > visibleItems;
      let calculatedWidth = 0;
      let newVisibleItems = 0;
      let maxVisibleItems = MAX_VISIBLE_ITEMS;

      if (showRoot) {
        calculatedWidth += listItems.shift().offsetWidth;
        newVisibleItems++;
      }

      if (isShowingMenu) {
        calculatedWidth += listItems.shift().offsetWidth;
        maxVisibleItems--;
      }

      if (showRoot && calculatedWidth >= containerWidth) {
        newVisibleItems--;
      }

      // TODO: what if multiline and only one breadcrumb??
      if (isMultiline) {
        listItems.pop();
        newVisibleItems++;
      } else {
        // Ensure the last breadcrumb isn't truncated when we measure it.
        let last = listItems.pop();
        last.style.overflow = 'visible';

        calculatedWidth += last.offsetWidth;
        if (calculatedWidth < containerWidth) {
          newVisibleItems++;
        }

        last.style.overflow = '';
      }

      for (let breadcrumb of listItems.reverse()) {
        calculatedWidth += breadcrumb.offsetWidth;
        if (calculatedWidth < containerWidth) {
          newVisibleItems++;
        }
      }

      return Math.max(MIN_VISIBLE_ITEMS, Math.min(maxVisibleItems, newVisibleItems));
    };

    setVisibleItems(function *() {
      // Update to show all items.
      yield childArray.length;

      // Measure, and update to show the items that fit.
      let newVisibleItems = computeVisibleItems(childArray.length);
      yield newVisibleItems;

      // If the number of items is less than the number of children,
      // then update again to ensure that the menu fits.
      if (newVisibleItems < childArray.length && newVisibleItems > 1) {
        yield computeVisibleItems(newVisibleItems);
      }
    });
  // Don't need to include childArray.length in dep array cuz children is already in array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listRef, children, setVisibleItems, showRoot, isMultiline]);

  useResizeObserver({ref: domRef, onResize: updateOverflow});

  useLayoutEffect(updateOverflow, [updateOverflow]);

  let contents = childArray;
  if (childArray.length > visibleItems) {
    let selectedItem = childArray[childArray.length - 1];
    let selectedKey = selectedItem.key ?? childArray.length - 1;
    let onMenuAction = (key: Key) => {
      // Don't fire onAction when clicking on the last item
      if (key !== selectedKey && onAction) {
        onAction(key);
      }
    };

    let menuItem = (
      <BreadcrumbItem key="menu">
        <MenuTrigger>
          <ActionButton
            aria-label="…"
            isQuiet
            isDisabled={isDisabled}>
            <FolderBreadcrumb />
          </ActionButton>
          <Menu selectionMode="single" selectedKeys={[selectedKey]} onAction={onMenuAction}>
            {childArray}
          </Menu>
        </MenuTrigger>
      </BreadcrumbItem>
    );

    contents = [menuItem];
    let breadcrumbs = [...childArray];
    let endItems = visibleItems;
    if (showRoot && visibleItems > 1) {
      contents.unshift(breadcrumbs.shift());
      endItems--;
    }
    contents.push(...breadcrumbs.slice(-endItems));
  }

  let lastIndex = contents.length - 1;
  let breadcrumbItems = contents.map((child, index) => {
    let isCurrent = index === lastIndex;
    let key = child.key ?? index;
    let onPress = () => {
      if (onAction) {
        onAction(key);
      }
    };

    return (
      <li
        key={key}
        className={
          classNames(
            styles,
            'spectrum-Breadcrumbs-item'
          )
        }>
        <BreadcrumbItem
          isCurrent={isCurrent}
          isDisabled={isDisabled}
          onPress={onPress}>
          {child.props.children}
        </BreadcrumbItem>
      </li>
    );
  });

  return (
    <nav
      {...styleProps}
      {...navProps}
      ref={domRef}>
      <ul
        ref={listRef}
        className={
          classNames(
            styles,
            'spectrum-Breadcrumbs',
            {
              'spectrum-Breadcrumbs--small': size === 'S',
              'spectrum-Breadcrumbs--medium': size === 'M',
              'spectrum-Breadcrumbs--multiline': isMultiline,
              'spectrum-Breadcrumbs--showRoot': showRoot,
              'is-disabled': isDisabled
            },
            styleProps.className
          )
        }>
        {breadcrumbItems}
      </ul>
    </nav>
  );
}

/**
 * Breadcrumbs show hierarchy and navigational context for a user’s location within an application.
 */
let _Breadcrumbs = React.forwardRef(Breadcrumbs);
export {_Breadcrumbs as Breadcrumbs};
