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
import ArrowDownSmall from '@spectrum-icons/ui/ArrowDownSmall';
import {classNames, useDOMRef, useIsMobileDevice, useStyleProps} from '@react-spectrum/utils';
import {DOMRef} from '@react-types/shared';
import {FocusScope} from '@react-aria/focus';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {MenuContext, MenuStateContext, useMenuStateContext} from './context';
import {MenuItem} from './MenuItem';
import {MenuSection} from './MenuSection';
import {mergeProps, useLayoutEffect, useSlotId, useSyncRef} from '@react-aria/utils';
import React, {KeyboardEventHandler, ReactElement, ReactNode, RefObject, useContext, useEffect, useRef, useState} from 'react';
import {RootMenuTriggerState} from '@react-stately/menu';
import {SpectrumMenuProps} from '@react-types/menu';
import styles from '@adobe/spectrum-css-temp/components/menu/vars.css';
import {TreeState, useTreeState} from '@react-stately/tree';
import {useLocale, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useMenu} from '@react-aria/menu';

/**
 * Menus display a list of actions or options that a user can choose.
 */
// forwardRef doesn't support generic parameters, so cast the result to the correct type
// https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
export const Menu = React.forwardRef(function Menu<T extends object>(props: SpectrumMenuProps<T>, ref: DOMRef<HTMLDivElement>) {
  let isSubmenu = true;
  let contextProps = useContext(MenuContext);
  let parentMenuContext = useMenuStateContext();
  let {rootMenuTriggerState, state: parentMenuTreeState} = parentMenuContext || {rootMenuTriggerState: contextProps.state};
  if (!parentMenuContext) {
    isSubmenu = false;
  }
  let completeProps = {
    ...mergeProps(contextProps, props)
  };
  let domRef = useDOMRef(ref);
  let [popoverContainer, setPopoverContainer] = useState<HTMLElement | null>(null);
  let trayContainerRef = useRef<HTMLDivElement | null>(null);
  let state = useTreeState(completeProps);
  let submenuRef = useRef<HTMLDivElement>(null);
  let {menuProps} = useMenu(completeProps, state, domRef);
  let {styleProps} = useStyleProps(completeProps);
  useSyncRef(contextProps, domRef);
  let [leftOffset, setLeftOffset] = useState({left: 0});
  let prevPopoverContainer = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (popoverContainer && prevPopoverContainer.current !== popoverContainer && leftOffset.left === 0) {
      prevPopoverContainer.current = popoverContainer;
      let {left} = popoverContainer.getBoundingClientRect();
      setLeftOffset({left: -1 * left});
    }
  }, [leftOffset, popoverContainer]);

  let menuLevel = contextProps.submenuLevel ?? -1;
  let nextMenuLevelKey = rootMenuTriggerState?.expandedKeysStack[menuLevel + 1];
  let hasOpenSubmenu = false;
  if (nextMenuLevelKey != null) {
    let nextMenuLevel = state.collection.getItem(nextMenuLevelKey);
    hasOpenSubmenu = nextMenuLevel != null;
  }

  return (
    <MenuStateContext.Provider value={{popoverContainer, trayContainerRef, menu: domRef, submenu: submenuRef, rootMenuTriggerState, state}}>
      <div style={{height: hasOpenSubmenu ? '100%' : undefined}} ref={trayContainerRef} />
      <FocusScope>
        <TrayHeaderWrapper
          onBackButtonPress={contextProps.onBackButtonPress}
          hasOpenSubmenu={hasOpenSubmenu}
          isSubmenu={isSubmenu}
          parentMenuTreeState={parentMenuTreeState}
          rootMenuTriggerState={rootMenuTriggerState}
          menuRef={domRef}>
          <div
            {...menuProps}
            style={mergeProps(styleProps.style, menuProps.style)}
            ref={domRef}
            className={
              classNames(
                styles,
                'spectrum-Menu',
                styleProps.className
              )
            }>
            {[...state.collection].map(item => {
              if (item.type === 'section') {
                return (
                  <MenuSection
                    key={item.key}
                    item={item}
                    state={state} />
                );
              }

              let menuItem = (
                <MenuItem
                  key={item.key}
                  item={item}
                  state={state} />
              );

              if (item.wrapper) {
                menuItem = item.wrapper(menuItem);
              }

              return menuItem;
            })}
          </div>
        </TrayHeaderWrapper>
        {rootMenuTriggerState?.isOpen && <div ref={setPopoverContainer} style={{width: '100vw', position: 'absolute', top: -5, ...leftOffset}} /> }
      </FocusScope>
    </MenuStateContext.Provider>
  );
}) as <T>(props: SpectrumMenuProps<T> & {ref?: DOMRef<HTMLDivElement>}) => ReactElement;

export function TrayHeaderWrapper(props: {
  children: ReactNode,
  isSubmenu?: boolean,
  hasOpenSubmenu?: boolean,
  parentMenuTreeState?: TreeState<any>,
  rootMenuTriggerState?: RootMenuTriggerState,
  onBackButtonPress?: (() => void),
  wrapperKeyDown?: KeyboardEventHandler<HTMLDivElement> | undefined,
  menuRef?: RefObject<HTMLDivElement | null>
}): ReactElement {
  let {children, isSubmenu, hasOpenSubmenu, parentMenuTreeState, rootMenuTriggerState, onBackButtonPress, wrapperKeyDown, menuRef} = props;
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/menu');
  let lastKey = rootMenuTriggerState?.expandedKeysStack.slice(-1)[0];
  let backButtonText = '';
  if (lastKey != null) {
    backButtonText = parentMenuTreeState?.collection.getItem(lastKey)?.textValue ?? '';
  }
  let backButtonLabel = stringFormatter.format('backButton', {
    prevMenuButton: backButtonText ?? ''
  });
  let headingId = useSlotId();
  let isMobile = useIsMobileDevice();
  let {direction} = useLocale();

  let [traySubmenuAnimation, setTraySubmenuAnimation] = useState('');
  useLayoutEffect(() => {
    if (!hasOpenSubmenu) {
      setTraySubmenuAnimation('spectrum-TraySubmenu-enter');
    }
  }, [hasOpenSubmenu, isMobile]);

  let timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  let handleBackButtonPress = () => {
    setTraySubmenuAnimation('spectrum-TraySubmenu-exit');
    timeoutRef.current = setTimeout(() => {
      onBackButtonPress?.();
    }, 220); // Matches transition duration
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // When opening submenu in tray, focus the first item in the submenu after animation completes
  // This fixes an issue with iOS VO where the closed submenu was getting focus
  let focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isMobile && isSubmenu && !hasOpenSubmenu && traySubmenuAnimation === 'spectrum-TraySubmenu-enter') {
      focusTimeoutRef.current = setTimeout(() => {
        let firstItem = menuRef?.current?.querySelector('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]') as HTMLElement;
        firstItem?.focus();
      }, 220);
    }
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [hasOpenSubmenu, isMobile, isSubmenu, menuRef, traySubmenuAnimation]);

  return (
    <>
      <div
        role={headingId ? 'dialog' : undefined}
        aria-labelledby={headingId}
        aria-hidden={isMobile && hasOpenSubmenu}
        data-testid="menu-wrapper"
        className={
          classNames(
            styles,
            'spectrum-Menu-wrapper',
            {
              'spectrum-Menu-wrapper--isMobile': isMobile,
              'is-expanded': hasOpenSubmenu,
              [traySubmenuAnimation]: isMobile
            }
          )
        }>
        <div role="presentation" className={classNames(styles, 'spectrum-Submenu-wrapper', {'spectrum-Submenu-wrapper--isMobile': isMobile})} onKeyDown={wrapperKeyDown}>
          {isMobile && isSubmenu && !hasOpenSubmenu && (
            <div className={classNames(styles, 'spectrum-Submenu-headingWrapper')}>
              <ActionButton
                aria-label={backButtonLabel}
                isQuiet
                onPress={handleBackButtonPress}>
                {/* We don't have a ArrowLeftSmall so make due with ArrowDownSmall and transforms */}
                {direction === 'rtl' ? <ArrowDownSmall UNSAFE_style={{rotate: '270deg'}} /> : <ArrowDownSmall UNSAFE_style={{rotate: '90deg'}} />}
              </ActionButton>
              <h1 id={headingId} className={classNames(styles, 'spectrum-Submenu-heading')}>{backButtonText}</h1>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}
