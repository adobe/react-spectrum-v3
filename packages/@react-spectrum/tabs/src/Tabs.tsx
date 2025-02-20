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

import {AriaTabPanelProps, SpectrumTabListProps, SpectrumTabPanelsProps, SpectrumTabsProps} from '@react-types/tabs';
import {classNames, SlotProvider, unwrapDOMRef, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import {DOMProps, DOMRef, DOMRefValue, Key, Node, Orientation, RefObject, StyleProps} from '@react-types/shared';
import {filterDOMProps, mergeProps, useId, useLayoutEffect, useResizeObserver} from '@react-aria/utils';
import {FocusRing} from '@react-aria/focus';
import {Item, Picker} from '@react-spectrum/picker';
import {ListCollection} from '@react-stately/list';
import React, {
  CSSProperties,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import {SpectrumPickerProps} from '@react-types/select';
import styles from '@adobe/spectrum-css-temp/components/tabs/vars.css';
import {TabListState, useTabListState} from '@react-stately/tabs';
import {Text} from '@react-spectrum/text';
import {useCollection} from '@react-stately/collections';
import {useHover} from '@react-aria/interactions';
import {useLocale} from '@react-aria/i18n';
import {useProvider, useProviderProps} from '@react-spectrum/provider';
import {useTab, useTabList, useTabPanel} from '@react-aria/tabs';

interface TabsContext<T> {
  tabProps: SpectrumTabsProps<T>,
  tabState: {
    tabListState: TabListState<T> | null,
    setTabListState: (state: TabListState<T>) => void,
    selectedTab: HTMLElement | null,
    collapsed: boolean
  },
  refs: {
    wrapperRef: RefObject<HTMLDivElement | null>,
    tablistRef: RefObject<HTMLDivElement | null>
  },
  tabPanelProps: HTMLAttributes<HTMLElement>,
  tabLineState: Array<DOMRect>
}

const TabContext = React.createContext<TabsContext<any> | null>(null);

/**
 * Tabs organize content into multiple sections and allow users to navigate between them. The content under the set of tabs should be related and form a coherent unit.
 */
// forwardRef doesn't support generic parameters, so cast the result to the correct type
// https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
export const Tabs = React.forwardRef(function Tabs<T extends object>(props: SpectrumTabsProps<T>, ref: DOMRef<HTMLDivElement>) {
  props = useProviderProps(props);
  let {
    orientation = 'horizontal' as Orientation,
    density = 'regular',
    children,
    ...otherProps
  } = props;

  let domRef = useDOMRef(ref);
  let tablistRef = useRef<HTMLDivElement>(null);
  let wrapperRef = useRef<HTMLDivElement>(null);

  let {direction} = useLocale();
  let {styleProps} = useStyleProps(otherProps);
  let [collapsed, setCollapsed] = useState(false);
  let [selectedTab, setSelectedTab] = useState<HTMLElement | null>(null);
  const [tabListState, setTabListState] = useState<TabListState<T> | null>(null);
  let [tabPositions, setTabPositions] = useState<DOMRect[]>([]);
  let prevTabPositions = useRef<DOMRect[]>(tabPositions);

  useEffect(() => {
    if (tablistRef.current) {
      let selectedTab: HTMLElement | null = tablistRef.current.querySelector(`[data-key="${CSS.escape(tabListState?.selectedKey?.toString() ?? '')}"]`);

      if (selectedTab != null) {
        setSelectedTab(selectedTab);
      }
    }
    // collapse is in the dep array so selectedTab can be updated for TabLine positioning
  }, [children, tabListState?.selectedKey, collapsed, tablistRef]);

  let checkShouldCollapse = useCallback(() => {
    if (wrapperRef.current && orientation !== 'vertical') {
      let tabsComponent = wrapperRef.current;
      let tabs: NodeListOf<Element> = tablistRef.current?.querySelectorAll('[role="tab"]') ?? new NodeList() as NodeListOf<Element>;
      let tabDimensions = [...tabs].map((tab: Element) => tab.getBoundingClientRect());

      let end = direction === 'rtl' ? 'left' : 'right';
      let farEdgeTabList = tabsComponent.getBoundingClientRect()[end];
      let farEdgeLastTab = tabDimensions[tabDimensions.length - 1][end];
      let shouldCollapse = direction === 'rtl' ? farEdgeLastTab < farEdgeTabList : farEdgeTabList < farEdgeLastTab;
      setCollapsed(shouldCollapse);
      if (tabDimensions.length !== prevTabPositions.current.length
        || tabDimensions.some((box, index) => box?.left !== prevTabPositions.current[index]?.left || box?.right !== prevTabPositions.current[index]?.right)) {
        setTabPositions(tabDimensions);
        prevTabPositions.current = tabDimensions;
      }
    }
  }, [tablistRef, wrapperRef, direction, orientation, setCollapsed, prevTabPositions, setTabPositions]);

  useEffect(() => {
    checkShouldCollapse();
  }, [children, checkShouldCollapse]);

  useResizeObserver({ref: wrapperRef, onResize: checkShouldCollapse});

  let tabPanelProps: HTMLAttributes<HTMLElement> = {
    'aria-labelledby': undefined
  };

  // When the tabs are collapsed, the tabPanel should be labelled by the Picker button element.
  let collapsibleTabListId = useId();
  if (collapsed && orientation !== 'vertical') {
    tabPanelProps['aria-labelledby'] = collapsibleTabListId;
  }
  return (
    <TabContext.Provider
      value={{
        tabProps: {...props, orientation, density},
        tabState: {tabListState, setTabListState, selectedTab, collapsed},
        refs: {tablistRef, wrapperRef},
        tabPanelProps,
        tabLineState: tabPositions
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
}) as <T>(props: SpectrumTabsProps<T> & {ref?: DOMRef<HTMLDivElement>}) => ReactElement;

interface TabProps<T> extends DOMProps {
  item: Node<T>,
  state: TabListState<T>,
  isDisabled?: boolean,
  orientation?: Orientation
}

// @private
function Tab<T>(props: TabProps<T>) {
  let {item, state} = props;
  let {key, rendered} = item;

  let ref = useRef<any>(undefined);
  let {tabProps, isSelected, isDisabled} = useTab({key}, state, ref);

  let {hoverProps, isHovered} = useHover({
    ...props
  });
  let ElementType: React.ElementType = item.props.href ? 'a' : 'div';

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <ElementType
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
      </ElementType>
    </FocusRing>
  );
}

interface TabLineProps {
  orientation?: Orientation,
  selectedTab?: HTMLElement | null,
  selectedKey?: Key | null
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
  let {tabLineState} = useContext(TabContext)!;

  let [style, setStyle] = useState<CSSProperties>({
    width: undefined,
    height: undefined
  });

  let onResize = useCallback(() => {
    if (selectedTab) {
      let styleObj: CSSProperties = {transform: undefined, width: undefined, height: undefined};
      // In RTL, calculate the transform from the right edge of the tablist so that resizing the window doesn't break the Tabline position due to offsetLeft changes
      let offset = direction === 'rtl' ?
        -1 * ((selectedTab.offsetParent as HTMLElement)?.offsetWidth - selectedTab.offsetWidth - selectedTab.offsetLeft) :
        selectedTab.offsetLeft;
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
  }, [direction, setStyle, selectedTab, orientation]);

  useLayoutEffect(() => {
    onResize();
  }, [onResize, scale, selectedKey, tabLineState]);

  return <div className={classNames(styles, 'spectrum-Tabs-selectionIndicator')} role="presentation" style={style} />;
}

/**
 * A TabList is used within Tabs to group tabs that a user can switch between.
 * The keys of the items within the <TabList> must match up with a corresponding item inside the <TabPanels>.
 */
export function TabList<T>(props: SpectrumTabListProps<T>): ReactElement {
  const tabContext = useContext(TabContext)!;
  const {refs, tabState, tabProps, tabPanelProps} = tabContext;
  const {isQuiet, density, isEmphasized, orientation} = tabProps;
  const {selectedTab, collapsed, setTabListState} = tabState;
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

  let collapseStyle : React.CSSProperties = collapsed && orientation !== 'vertical' ? {maxWidth: 'calc(100% + 1px)', overflow: 'hidden', visibility: 'hidden', position: 'absolute'} : {maxWidth: 'calc(100% + 1px)'};
  let stylePropsFinal = orientation === 'vertical' ? styleProps : {style: collapseStyle};

  if (collapsed && orientation !== 'vertical') {
    tabListProps['aria-hidden'] = true;
  }

  let tabListclassName = classNames(styles, 'spectrum-TabsPanel-tabs');

  const tabContent = (
    <div
      {...stylePropsFinal}
      {...tabListProps}
      ref={tablistRef}
      className={classNames(
        styles,
        'spectrum-Tabs',
        `spectrum-Tabs--${orientation}`,
        tabListclassName,
        {
          'spectrum-Tabs--quiet': isQuiet,
          'spectrum-Tabs--emphasized': isEmphasized,
          ['spectrum-Tabs--compact']: density === 'compact'
        },
        orientation === 'vertical' && styleProps.className
      )
      }>
      {[...state.collection].map((item) => (
        <Tab key={item.key} item={item} state={state} orientation={orientation} />
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
        <TabPicker {...props} {...tabProps} visible={collapsed} id={tabPanelProps['aria-labelledby']} state={state} className={tabListclassName} />
        {tabContent}
      </div>
    );
  }
}

/**
 * TabPanels is used within Tabs as a container for the content of each tab.
 * The keys of the items within the <TabPanels> must match up with a corresponding item inside the <TabList>.
 */
export function TabPanels<T extends object>(props: SpectrumTabPanelsProps<T>): ReactElement {
  const {tabState, tabProps} = useContext(TabContext)!;
  const {tabListState} = tabState;

  const factory = useCallback((nodes: Iterable<Node<T>>) => new ListCollection(nodes), []);
  const collection = useCollection({items: tabProps.items, ...props}, factory, {suppressTextValueWarning: true});
  const selectedItem = tabListState && tabListState.selectedKey != null ? collection.getItem(tabListState.selectedKey) : null;

  return (
    <TabPanel {...props} key={tabListState?.selectedKey}>
      {selectedItem && selectedItem.props.children}
    </TabPanel>
  );
}

interface TabPanelProps extends AriaTabPanelProps, StyleProps {
  children?: ReactNode
}

// @private
function TabPanel(props: TabPanelProps) {
  const {tabState, tabPanelProps: ctxTabPanelProps} = useContext(TabContext)!;
  const {tabListState} = tabState;
  let ref = useRef<HTMLDivElement | null>(null);
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
  isEmphasized?: boolean,
  state: TabListState<T>,
  className?: string,
  visible: boolean
}

function TabPicker<T>(props: TabPickerProps<T>) {
  let {
    isDisabled,
    isEmphasized,
    isQuiet,
    state,
    'aria-labelledby': ariaLabeledBy,
    'aria-label': ariaLabel,
    density,
    className,
    id,
    visible
  } = props;

  let ref = useRef<DOMRefValue<HTMLDivElement>>(null);
  let [pickerNode, setPickerNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let node = unwrapDOMRef(ref);
    setPickerNode(node.current);
  }, [ref]);

  let items = [...state.collection];
  let pickerProps = {
    'aria-labelledby': ariaLabeledBy,
    'aria-label': ariaLabel
  };

  const style : React.CSSProperties = visible ? {} : {visibility: 'hidden', position: 'absolute'};

  return (
    <div
      className={classNames(
        styles,
        'spectrum-Tabs',
        'spectrum-Tabs--horizontal',
        'spectrum-Tabs--isCollapsed',
        {
          'spectrum-Tabs--quiet': isQuiet,
          ['spectrum-Tabs--compact']: density === 'compact',
          'spectrum-Tabs--emphasized': isEmphasized
        },
        className
      )}
      style={style}
      aria-hidden={visible ? undefined : true}>
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
          isDisabled={!visible || isDisabled}
          selectedKey={state.selectedKey}
          disabledKeys={state.disabledKeys}
          onSelectionChange={state.setSelectedKey}
          UNSAFE_className={classNames(styles, 'spectrum-Tabs-picker')}>
          {item => <Item {...item.props}>{item.rendered}</Item>}
        </Picker>
        {pickerNode && <TabLine orientation="horizontal" selectedTab={pickerNode} selectedKey={state.selectedKey} />}
      </SlotProvider>
    </div>
  );
}
