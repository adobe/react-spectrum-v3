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

import {ActionButtonGroup} from './ActionButtonGroup';
import {announce} from '@react-aria/live-announcer';
import {CloseButton} from './CloseButton';
import {ContextValue, SlotProps} from 'react-aria-components';
import {createContext, ForwardedRef, forwardRef, ReactElement, ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {DOMRef, DOMRefValue, Key} from '@react-types/shared';
import {FocusScope, useKeyboard} from 'react-aria';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {style} from '../style' with {type: 'macro'};
import {useControlledState} from '@react-stately/utils';
import {useDOMRef} from '@react-spectrum/utils';
import {useEnterAnimation, useExitAnimation, useObjectRef, useResizeObserver} from '@react-aria/utils';
import {useLocalizedStringFormatter} from '@react-aria/i18n';
import {useSpectrumContextProps} from './useSpectrumContextProps';

const actionBarStyles = style({
  borderRadius: 'lg',
  '--s2-container-bg': {
    type: 'backgroundColor',
    value: {
      default: 'elevated',
      isEmphasized: 'neutral'
    }
  },
  backgroundColor: '--s2-container-bg',
  boxShadow: 'elevated',
  boxSizing: 'border-box',
  outlineStyle: 'solid',
  outlineWidth: 1,
  outlineOffset: -1,
  outlineColor: {
    default: 'gray-200',
    isEmphasized: 'transparent',
    forcedColors: 'ButtonBorder'
  },
  paddingX: 8,
  paddingY: 12,
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  position: {
    isInContainer: 'absolute'
  },
  bottom: 0,
  insetStart: 8,
  '--insetEnd': {
    type: 'insetEnd',
    value: 8
  },
  width: {
    default: 'full',
    isInContainer: 'auto'
  },
  marginX: 'auto',
  maxWidth: 960,
  transition: 'transform',
  transitionDuration: 200,
  translateY: {
    default: -8,
    isEntering: 'full',
    isExiting: 'full'
  }
});

export interface ActionBarProps extends SlotProps {
  /** A list of ActionButtons to display. */
  children: ReactNode,
  /** Whether the ActionBar should be displayed with a emphasized style. */
  isEmphasized?: boolean,
  /** The number of selected items that the ActionBar is currently linked to. If 0, the ActionBar is hidden. */
  selectedItemCount?: number | 'all',
  /** Handler that is called when the ActionBar clear button is pressed. */
  onClearSelection?: () => void,
  /** A ref to the scrollable element the ActionBar appears above. */
  scrollRef?: RefObject<HTMLElement | null>
}

export const ActionBarContext = createContext<ContextValue<Partial<ActionBarProps>, DOMRefValue<HTMLDivElement>>>(null);

export const ActionBar = forwardRef(function ActionBar(props: ActionBarProps, ref: DOMRef<HTMLDivElement>) {
  [props, ref] = useSpectrumContextProps(props, ref, ActionBarContext);
  let domRef = useDOMRef(ref);

  let isOpen = props.selectedItemCount !== 0;
  let isExiting = useExitAnimation(domRef, isOpen && props.scrollRef != null);
  if (!isOpen && !isExiting) {
    return null;
  }

  return <ActionBarInner {...props} ref={domRef} isExiting={isExiting} />;
});

const ActionBarInner = forwardRef(function ActionBarInner(props: ActionBarProps & {isExiting: boolean}, ref: ForwardedRef<HTMLDivElement | null>) {
  let {isEmphasized, selectedItemCount = 0, children, onClearSelection, isExiting} = props;
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/s2');

  // Store the last count greater than zero so that we can retain it while rendering the fade-out animation.
  let [lastCount, setLastCount] = useState(selectedItemCount);
  if ((selectedItemCount === 'all' || selectedItemCount > 0) && selectedItemCount !== lastCount) {
    setLastCount(selectedItemCount);
  }

  // Measure the width of the collection's scrollbar and offset the action bar by that amount.
  let scrollRef = props.scrollRef;
  let [scrollbarWidth, setScrollbarWidth] = useState(0);
  let updateScrollbarWidth = useCallback(() => {
    let el = scrollRef?.current;
    if (el) {
      let w = el.offsetWidth - el.clientWidth;
      setScrollbarWidth(w);
    }
  }, [scrollRef]);

  useResizeObserver({
    ref: scrollRef,
    onResize: updateScrollbarWidth
  });

  let {keyboardProps} = useKeyboard({
    onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClearSelection?.();
      } else {
        e.continuePropagation();
      }
    }
  });

  // Announce "actions available" on mount.
  let isInitial = useRef(true);
  useEffect(() => {
    if (isInitial.current && scrollRef) {
      isInitial.current = false;
      announce(stringFormatter.format('actionbar.actionsAvailable'));
    }
  }, [stringFormatter, scrollRef]);

  let objectRef = useObjectRef(ref);
  let isEntering = useEnterAnimation(objectRef, !!scrollRef);

  return (
    <FocusScope restoreFocus>
      <div
        ref={objectRef}
        {...keyboardProps}
        className={actionBarStyles({isEmphasized, isInContainer: !!scrollRef, isEntering, isExiting})}
        style={{insetInlineEnd: `calc(var(--insetEnd) + ${scrollbarWidth}px)`}}>
        <div className={style({order: 1, marginStart: 'auto'})}>
          <ActionButtonGroup
            staticColor={isEmphasized ? 'auto' : undefined}
            isQuiet
            aria-label={stringFormatter.format('actionbar.actions')}>
            {children}
          </ActionButtonGroup>
        </div>
        <div className={style({order: 0, display: 'flex', alignItems: 'center', gap: 4})}>
          <CloseButton
            staticColor={isEmphasized ? 'auto' : undefined}
            aria-label={stringFormatter.format('actionbar.clearSelection')}
            onPress={() => onClearSelection?.()} />
          <span className={style({font: 'ui', color: {default: 'neutral', isEmphasized: 'gray-25'}})({isEmphasized})}>
            {lastCount === 'all'
              ? stringFormatter.format('actionbar.selectedAll')
              : stringFormatter.format('actionbar.selected', {count: lastCount})}
          </span>
        </div>
      </div>
    </FocusScope>
  );
});

interface ActionBarContainerHookProps {
  selectedKeys?: 'all' | Iterable<Key>,
  defaultSelectedKeys?: 'all' | Iterable<Key>,
  onSelectionChange?: (keys: Set<Key>) => void,
  renderActionBar?: (selectedKeys: 'all' | Set<Key>) => ReactElement,
  scrollRef?: RefObject<HTMLElement | null>
}

export function useActionBarContainer(props: ActionBarContainerHookProps) {
  let {renderActionBar, scrollRef} = props;
  let [selectedKeys, setSelectedKeys] = useControlledState(props.selectedKeys, props.defaultSelectedKeys || new Set(), props.onSelectionChange);
  let selectedKeysSet = useMemo(() => selectedKeys === 'all' ? selectedKeys as 'all' : new Set(selectedKeys), [selectedKeys]);
  let actionBar = useMemo(() => renderActionBar?.(selectedKeysSet), [renderActionBar, selectedKeysSet]);
  let selectedItemCount = selectedKeysSet === 'all' ? 'all' as const : selectedKeysSet.size;
  let [actionBarHeight, setActionBarHeight] = useState(0);
  let actionBarRef = useCallback((ref: DOMRefValue | null) => {
    let actionBar = ref?.UNSAFE_getDOMNode();
    if (actionBar) {
      setActionBarHeight(actionBar.offsetHeight + 8);
    } else {
      setActionBarHeight(0);
    }
  }, []);

  let actionBarContext = useMemo(() => ({
    ref: actionBarRef,
    scrollRef,
    selectedItemCount,
    onClearSelection: () => setSelectedKeys(new Set())
  }), [scrollRef, actionBarRef, selectedItemCount, setSelectedKeys]);

  let wrappedActionBar = useMemo(() => (
    <ActionBarContext.Provider value={actionBarContext}>
      {actionBar}
    </ActionBarContext.Provider>
  ), [actionBarContext, actionBar]);

  return {
    selectedKeys,
    onSelectionChange: setSelectedKeys,
    actionBar: wrappedActionBar,
    actionBarHeight
  };
}
