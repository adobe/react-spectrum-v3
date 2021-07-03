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

import {classNames, SlotProvider, useDOMRef, useStyleProps, useUnwrapDOMRef, useValueEffect} from '@react-spectrum/utils';
import {DOMProps, DOMRef, Node, Orientation} from '@react-types/shared';
import {filterDOMProps} from '@react-aria/utils';
import {FocusRing} from '@react-aria/focus';
import {Item, Picker} from '@react-spectrum/picker';
import {ListCollection, SingleSelectListState} from '@react-stately/list';
import {mergeProps, useId, useLayoutEffect} from '@react-aria/utils';
import React, {Key, MutableRefObject, ReactElement, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {SpectrumPickerProps} from '@react-types/select';
import {SpectrumTabListProps, SpectrumTabPanelsProps, SpectrumTabsProps} from '@react-types/tabs';
import styles from '@adobe/spectrum-css-temp/components/tabs/vars.css';
import {TabListState, useTabListState} from '@react-stately/tabs';
import {Text} from '@react-spectrum/text';
import {useCollection} from '@react-stately/collections';
import {useHover} from '@react-aria/interactions';
import {useLocale} from '@react-aria/i18n';
import {useProvider, useProviderProps} from '@react-spectrum/provider';
import {useResizeObserver} from '@react-aria/utils';
import {useTab, useTabList, useTabPanel} from '@react-aria/tabs';

interface TabsContext<T> {
  tabProps: SpectrumTabsProps<T>,
  tabState: {
    tabListState: TabListState<T>,
    setTabListState: (state: TabListState<T>) => void,
    selectedTab: HTMLElement,
    collapse: boolean
  },
  refs: {
    wrapperRef: MutableRefObject<HTMLDivElement>,
    tablistRef: MutableRefObject<HTMLDivElement>
  },
  tabPanelProps: {
    'aria-labelledby': string
  }
}

const TabContext = React.createContext<TabsContext<any>>(null);

function Tabs<T extends object>(props: SpectrumTabsProps<T>, ref: DOMRef<HTMLDivElement>) {
  props = useProviderProps(props);
  let {
    orientation = 'horizontal' as Orientation,
    density = 'regular',
    children,
    ...otherProps
  } = props;

  let domRef = useDOMRef(ref);
  let tablistRef = useRef<HTMLDivElement>();
  let wrapperRef = useRef<HTMLDivElement>();

  let {direction} = useLocale();
  let {styleProps} = useStyleProps(otherProps);
  let [collapse, setCollapse] = useValueEffect(false);
  let [selectedTab, setSelectedTab] = useState<HTMLElement>();
  const [tabListState, setTabListState] = useState<TabListState<T>>(null);

  useEffect(() => {
    if (tablistRef.current) {
      let selectedTab: HTMLElement = tablistRef.current.querySelector(`[data-key="${tabListState?.selectedKey}"]`);

      if (selectedTab != null) {
        setSelectedTab(selectedTab);
      }
    }
    // collapse is in the dep array so selectedTab can be updated for TabLine positioning
  }, [children, tabListState?.selectedKey, collapse, tablistRef]);

  let checkShouldCollapse = useCallback(() => {
    let computeShouldCollapse = () => {
      if (wrapperRef.current) {
        let tabsComponent = wrapperRef.current;
        let tabs = tablistRef.current.querySelectorAll('[role="tab"]');
        let lastTab = tabs[tabs.length - 1];

        let end = direction === 'rtl' ? 'left' : 'right';
        let farEdgeTabList = tabsComponent.getBoundingClientRect()[end];
        let farEdgeLastTab = lastTab?.getBoundingClientRect()[end];
        let shouldCollapse = direction === 'rtl' ? farEdgeLastTab < farEdgeTabList : farEdgeTabList < farEdgeLastTab;

        return shouldCollapse;
      }
    };

    if (orientation !== 'vertical') {
      setCollapse(function* () {
        // Make Tabs render in non-collapsed state
        yield false;

        // Compute if Tabs should collapse and update
        yield computeShouldCollapse();
      });
    }
  }, [tablistRef, wrapperRef, direction, orientation, setCollapse]);

  useEffect(() => {
    checkShouldCollapse();
  }, [children, checkShouldCollapse]);

  useResizeObserver({ref: wrapperRef, onResize: checkShouldCollapse});

  let tabPanelProps = {
    'aria-labelledby': undefined
  };

  // When the tabs are collapsed, the tabPanel should be labelled by the Picker button element.
  let collapsibleTabListId = useId();
  if (collapse && orientation !== 'vertical') {
    tabPanelProps['aria-labelledby'] = collapsibleTabListId;
  }
  return (
    <TabContext.Provider
      value={{
        tabProps: {...props, orientation, density},
        tabState: {tabListState, setTabListState, selectedTab, collapse},
        refs: {tablistRef, wrapperRef},
        tabPanelProps
      }}>
      <div
        {...filterDOMProps(otherProps)}
        {...styleProps}
        ref={domRef}
        className={classNames(
          styles,
          'spectrum-TabsPanel',
          `spectrum-TabsPanel--${orientation}`,
          styleProps.className
        )}>
        {props.children}
      </div>
    </TabContext.Provider>
  );
}

interface TabProps<T> extends DOMProps {
  item: Node<T>,
  state: SingleSelectListState<T>,
  isDisabled?: boolean,
  orientation?: Orientation
}

// @private
function Tab<T>(props: TabProps<T>) {
  let {item, state, isDisabled: propsDisabled} = props;
  let {key, rendered} = item;
  let isDisabled = propsDisabled || state.disabledKeys.has(key);

  let ref = useRef<HTMLDivElement>();
  let {tabProps} = useTab({key, isDisabled}, state, ref);

  let {hoverProps, isHovered} = useHover({
    ...props
  });
  let isSelected = state.selectedKey === key;

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...mergeProps(tabProps, hoverProps)}
        ref={ref}
        className={classNames(
          styles,
          'spectrum-Tabs-item',
          {
            'is-selected': isSelected,
            'is-disabled': isDisabled,
            'is-hovered': isHovered
          }
        )}>
        <SlotProvider
          slots={{
            icon: {
              size: 'S',
              UNSAFE_className: classNames(styles, 'spectrum-Icon')
            },
            text: {
              UNSAFE_className: classNames(styles, 'spectrum-Tabs-itemLabel')
            }
          }}>
          {typeof rendered === 'string'
            ? <Text>{rendered}</Text>
            : rendered}
        </SlotProvider>
      </div>
    </FocusRing>
  );
}

interface TabLineProps {
  orientation?: Orientation,
  selectedTab?: HTMLElement,
  selectedKey?: Key
}

// @private
function TabLine(props: TabLineProps) {
  let {
    orientation,
    // Is either the tab node (non-collapsed) or the picker node (collapsed)
    selectedTab,
    // selectedKey is provided so that the TabLine styles are updated when the TabPicker's width updates from a selection change
    selectedKey
  } = props;

  let {direction} = useLocale();
  let {scale} = useProvider();

  let [style, setStyle] = useState({
    width: undefined,
    height: undefined
  });

  useLayoutEffect(() => {
    if (selectedTab) {
      let styleObj = {transform: undefined, width: undefined, height: undefined};
      // In RTL, calculate the transform from the right edge of the tablist so that resizing the window doesn't break the Tabline position due to offsetLeft changes
      let offset = direction === 'rtl' ? -1 * ((selectedTab.offsetParent as HTMLElement)?.offsetWidth - selectedTab.offsetWidth - selectedTab.offsetLeft) : selectedTab.offsetLeft;
      styleObj.transform = orientation === 'vertical'
        ? `translateY(${selectedTab.offsetTop}px)`
        : `translateX(${offset}px)`;

      if (orientation === 'horizontal') {
        styleObj.width = `${selectedTab.offsetWidth}px`;
      } else {
        styleObj.height = `${selectedTab.offsetHeight}px`;
      }
      setStyle(styleObj);
    }

  }, [direction, setStyle, selectedTab, orientation, scale, selectedKey]);

  return <div className={classNames(styles, 'spectrum-Tabs-selectionIndicator')} role="presentation" style={style} />;
}

/**
 * A TabList is used within Tabs to group tabs that a user can switch between.
 * The keys of the items within the <TabList> must match up with a corresponding item inside the <TabPanels>.
 */
export function TabList<T>(props: SpectrumTabListProps<T>) {
  const tabContext = useContext(TabContext);
  const {refs, tabState, tabProps, tabPanelProps} = tabContext;
  const {isQuiet, density, isDisabled, orientation} = tabProps;
  const {selectedTab, collapse, setTabListState} = tabState;
  const {tablistRef, wrapperRef} = refs;
  // Pass original Tab props but override children to create the collection.
  const state = useTabListState({...tabProps, children: props.children});

  let {styleProps} = useStyleProps(props);
  const {tabListProps} = useTabList({...tabProps, ...props}, state, tablistRef);

  useEffect(() => {
    // Passing back to root as useTabPanel needs the TabListState
    setTabListState(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.disabledKeys, state.selectedItem, state.selectedKey, props.children]);
  let stylePropsForVertical = orientation === 'vertical' ? styleProps : {};

  let tabListclassName = classNames(styles, 'spectrum-TabsPanel-tabs');
  const tabContent = (
    <div
      {...stylePropsForVertical}
      {...tabListProps}
      ref={tablistRef}
      className={classNames(
        styles,
        'spectrum-Tabs',
        `spectrum-Tabs--${orientation}`,
        tabListclassName,
        {
          'spectrum-Tabs--quiet': isQuiet,
          ['spectrum-Tabs--compact']: density === 'compact'
        },
        orientation === 'vertical' && styleProps.className
      )
      }>
      {[...state.collection].map((item) => (
        <Tab key={item.key} item={item} state={state} isDisabled={isDisabled} orientation={orientation} />
      ))}
      <TabLine orientation={orientation} selectedTab={selectedTab} />
    </div>
  );


  if (orientation === 'vertical') {
    return tabContent;
  } else {
    return (
      <div
        {...styleProps}
        ref={wrapperRef}
        className={classNames(
          styles,
          'spectrum-TabsPanel-collapseWrapper',
          styleProps.className
        )}>
        {collapse ? <TabPicker {...props} {...tabProps} id={tabPanelProps['aria-labelledby']} state={state} className={tabListclassName} /> : tabContent}
      </div>
    );
  }
}

/**
 * TabPanels is used within Tabs as a container for the content of each tab.
 * The keys of the items within the <TabPanels> must match up with a corresponding item inside the <TabList>.
 */
export function TabPanels<T>(props: SpectrumTabPanelsProps<T>) {
  const {tabState, tabProps} = useContext(TabContext);
  const {tabListState} = tabState;

  const factory = nodes => new ListCollection(nodes);
  const collection = useCollection({items: tabProps.items, ...props}, factory, {suppressTextValueWarning: true});
  const selectedItem = tabListState ? collection.getItem(tabListState.selectedKey) : null;

  return (
    <TabPanel {...props} key={tabListState?.selectedKey}>
      {selectedItem && selectedItem.props.children}
    </TabPanel>
  );
}

// @private
function TabPanel<T>(props: SpectrumTabPanelsProps<T>) {
  const {tabState, tabPanelProps: ctxTabPanelProps} = useContext(TabContext);
  const {tabListState} = tabState;
  let ref = useRef();
  const {tabPanelProps} = useTabPanel(props, tabListState, ref);
  let {styleProps} = useStyleProps(props);

  if (ctxTabPanelProps['aria-labelledby']) {
    tabPanelProps['aria-labelledby'] = ctxTabPanelProps['aria-labelledby'];
  }

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div {...styleProps} {...tabPanelProps} ref={ref} className={classNames(styles, 'spectrum-TabsPanel-tabpanel', styleProps.className)}>
        {props.children}
      </div>
    </FocusRing>
  );
}

interface TabPickerProps<T> extends Omit<SpectrumPickerProps<T>, 'children'> {
  density?: 'compact' | 'regular',
  state: SingleSelectListState<T>,
  className?: string
}

function TabPicker<T>(props: TabPickerProps<T>) {
  let {
    isDisabled,
    isQuiet,
    state,
    'aria-labelledby': ariaLabeledBy,
    'aria-label': ariaLabel,
    density,
    className,
    id
  } = props;

  let ref = useRef();
  let unwrappedRef = useUnwrapDOMRef(ref);
  let [pickerNode, setPickerNode] = useState(null);

  useEffect(() => {
    setPickerNode(unwrappedRef);
  }, [unwrappedRef]);

  let items = [...state.collection].map((item) => ({
    rendered: item.rendered,
    textValue: item.textValue,
    id: item.key
  }));

  let pickerProps = {
    'aria-labelledby': ariaLabeledBy,
    'aria-label': ariaLabel
  };

  // TODO: Figure out if tabListProps should go onto the div here, v2 doesn't do it
  return (
    <div
      className={classNames(
        styles,
        'spectrum-Tabs',
        'spectrum-Tabs--horizontal',
        'spectrum-Tabs--isCollapsed',
        {
          'spectrum-Tabs--quiet': isQuiet,
          ['spectrum-Tabs--compact']: density === 'compact'
        },
        className
      )}>
      <SlotProvider
        slots={{
          icon: {
            size: 'S',
            UNSAFE_className: classNames(styles, 'spectrum-Icon')
          },
          button: {
            focusRingClass: classNames(styles, 'focus-ring')
          }
        }}>
        <Picker
          {...pickerProps}
          id={id}
          items={items}
          ref={ref}
          isQuiet
          isDisabled={isDisabled}
          selectedKey={state.selectedKey}
          disabledKeys={state.disabledKeys}
          onSelectionChange={state.setSelectedKey}>
          {item => <Item textValue={item.textValue}>{item.rendered}</Item>}
        </Picker>
        {pickerNode && <TabLine orientation="horizontal" selectedTab={pickerNode} selectedKey={state.selectedKey} />}
      </SlotProvider>
    </div>
  );
}

/**
 * Tabs organize content into multiple sections and allow users to navigate between them. The content under the set of tabs should be related and form a coherent unit.
 */
// forwardRef doesn't support generic parameters, so cast the result to the correct type
// https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
const _Tabs = React.forwardRef(Tabs) as <T>(props: SpectrumTabsProps<T> & {ref?: DOMRef<HTMLDivElement>}) => ReactElement;
export {_Tabs as Tabs};
