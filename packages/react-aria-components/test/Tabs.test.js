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

import {Button, Collection, Tab, TabList, TabPanel, Tabs} from '../';
import {fireEvent, pointerMap, render, waitFor, within} from '@react-spectrum/test-utils-internal';
import React, {useState} from 'react';
import {TabsExample} from '../stories/Tabs.stories';
import {User} from '@react-aria/test-utils';
import userEvent from '@testing-library/user-event';

let renderTabs = (tabsProps, tablistProps, tabProps, tabpanelProps) => render(
  <Tabs {...tabsProps} data-testid="tabs-wrapper">
    <TabList {...tablistProps} aria-label="Test">
      <Tab {...tabProps} id="a">A</Tab>
      <Tab {...tabProps} id="b">B</Tab>
      <Tab {...tabProps} id="c">C</Tab>
    </TabList>
    <TabPanel {...tabpanelProps} id="a">A</TabPanel>
    <TabPanel {...tabpanelProps} id="b">B</TabPanel>
    <TabPanel {...tabpanelProps} id="c">C</TabPanel>
  </Tabs>
);

describe('Tabs', () => {
  let user;
  let testUtilUser = new User();

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  it('should render tabs with default classes', () => {
    let {getByTestId} = renderTabs();
    let tabs = getByTestId('tabs-wrapper');
    let tabsTester = testUtilUser.createTester('Tabs', {root: tabs});
    let tablist = tabsTester.tablist;
    expect(tabs).toBeInTheDocument();
    expect(tablist).toHaveAttribute('class', 'react-aria-TabList');
    expect(tablist).toHaveAttribute('aria-label', 'Test');

    for (let tab of tabsTester.tabs) {
      expect(tab).toHaveAttribute('class', 'react-aria-Tab');
    }

    expect(tabsTester.tabpanels[0]).toHaveAttribute('class', 'react-aria-TabPanel');
  });

  it('should render tabs with custom classes', () => {
    let {getByRole, getAllByRole} = renderTabs({className: 'tabs'}, {className: 'tablist'}, {className: 'tab'}, {className: 'tabpanel'});
    let tablist = getByRole('tablist');
    let tabs = tablist.closest('.tabs');
    expect(tabs).toBeInTheDocument();
    expect(tablist).toHaveAttribute('class', 'tablist');
    for (let tab of getAllByRole('tab')) {
      expect(tab).toHaveAttribute('class', 'tab');
    }

    let tabpanel = getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('class', 'tabpanel');
  });

  it('should support DOM props', () => {
    let {getByRole, getAllByRole} = renderTabs({'data-test': 'tabs'}, {'data-test': 'tablist'}, {'data-test': 'tab'}, {'data-test': 'tabpanel'});
    let tablist = getByRole('tablist');
    let tabs = tablist.closest('.react-aria-Tabs');
    expect(tabs).toHaveAttribute('data-test', 'tabs');
    expect(tablist).toHaveAttribute('data-test', 'tablist');
    for (let tab of getAllByRole('tab')) {
      expect(tab).toHaveAttribute('data-test', 'tab');
    }

    let tabpanel = getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('data-test', 'tabpanel');
  });

  it('should support aria props on the tabs', () => {
    let {getAllByRole} = renderTabs({}, {}, {
      'aria-label': 'label',
      'aria-labelledby': 'labelledby',
      'aria-describedby': 'describedby',
      'aria-details': 'details'
    }, {});
    for (let tab of getAllByRole('tab')) {
      expect(tab).toHaveAttribute('aria-label', 'label');
      expect(tab).toHaveAttribute('aria-labelledby', 'labelledby');
      expect(tab).toHaveAttribute('aria-describedby', 'describedby');
      expect(tab).toHaveAttribute('aria-details', 'details');
    }
  });

  it('should support render props', () => {
    let {getByRole} = render(
      <Tabs orientation="horizontal">
        {({orientation}) => (
          <>
            <TabList aria-label={`Test ${orientation}`}>
              <Tab id="a">A</Tab>
              <Tab id="b">B</Tab>
              <Tab id="c">C</Tab>
            </TabList>
            <TabPanel id="a">A</TabPanel>
            <TabPanel id="b">B</TabPanel>
            <TabPanel id="c">C</TabPanel>
          </>
        )}
      </Tabs>
    );
    let tablist = getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Test horizontal');
  });

  it('should support hover', async () => {
    let onHoverStart = jest.fn();
    let onHoverChange = jest.fn();
    let onHoverEnd = jest.fn();
    let {getAllByRole} = renderTabs({}, {}, {className: ({isHovered}) => isHovered ? 'hover' : '', onHoverStart, onHoverChange, onHoverEnd});
    let tab = getAllByRole('tab')[0];

    expect(tab).not.toHaveAttribute('data-hovered');
    expect(tab).not.toHaveClass('hover');

    await user.hover(tab);
    expect(tab).toHaveAttribute('data-hovered', 'true');
    expect(tab).toHaveClass('hover');
    expect(onHoverStart).toHaveBeenCalledTimes(1);
    expect(onHoverChange).toHaveBeenCalledTimes(1);

    await user.unhover(tab);
    expect(tab).not.toHaveAttribute('data-hovered');
    expect(tab).not.toHaveClass('hover');
    expect(onHoverEnd).toHaveBeenCalledTimes(1);
    expect(onHoverChange).toHaveBeenCalledTimes(2);
  });

  it('should not show hover state when item is not interactive', async () => {
    let onHoverStart = jest.fn();
    let onHoverChange = jest.fn();
    let onHoverEnd = jest.fn();
    let {getAllByRole} = renderTabs({disabledKeys: ['a', 'b', 'c']}, {}, {className: ({isHovered}) => isHovered ? 'hover' : '', onHoverStart, onHoverChange, onHoverEnd});
    let tab = getAllByRole('tab')[0];

    expect(tab).not.toHaveAttribute('data-hovered');
    expect(tab).not.toHaveClass('hover');
    expect(onHoverStart).not.toHaveBeenCalled();
    expect(onHoverChange).not.toHaveBeenCalled();
    expect(onHoverEnd).not.toHaveBeenCalled();

    await user.hover(tab);
    expect(tab).not.toHaveAttribute('data-hovered');
    expect(tab).not.toHaveClass('hover');
    expect(onHoverStart).not.toHaveBeenCalled();
    expect(onHoverChange).not.toHaveBeenCalled();
    expect(onHoverEnd).not.toHaveBeenCalled();
  });

  it('should support press', () => {
    let onPress = jest.fn();
    let onPressChange = jest.fn();
    let onPressEnd = jest.fn();
    let onPressStart = jest.fn();
    let onPressUp = jest.fn();
    let {getAllByRole} = renderTabs({}, {}, {className: ({isPressed}) => isPressed ? 'press' : '', onPress, onPressChange, onPressEnd, onPressStart, onPressUp});
    let tab = getAllByRole('tab')[0];

    expect(tab).not.toHaveAttribute('data-pressed');
    expect(tab).not.toHaveClass('press');

    fireEvent.mouseDown(tab);
    expect(tab).toHaveAttribute('data-pressed', 'true');
    expect(tab).toHaveClass('press');
    expect(onPressStart).toHaveBeenCalledTimes(1);
    expect(onPressChange).toHaveBeenCalledTimes(1);

    fireEvent.mouseUp(tab);
    expect(tab).not.toHaveAttribute('data-pressed');
    expect(tab).not.toHaveClass('press');
    expect(onPressUp).toHaveBeenCalledTimes(1);
    expect(onPressEnd).toHaveBeenCalledTimes(1);
    expect(onPressChange).toHaveBeenCalledTimes(2);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not show press state when item is not interactive', () => {
    let onPress = jest.fn();
    let onPressChange = jest.fn();
    let onPressEnd = jest.fn();
    let onPressStart = jest.fn();
    let onPressUp = jest.fn();
    let {getAllByRole} = renderTabs({disabledKeys: ['a', 'b', 'c']}, {}, {className: ({isPressed}) => isPressed ? 'press' : '', onPress, onPressChange, onPressEnd, onPressStart, onPressUp});
    let tab = getAllByRole('tab')[0];

    expect(tab).not.toHaveAttribute('data-pressed');
    expect(tab).not.toHaveClass('press');
    expect(onPress).not.toHaveBeenCalled();
    expect(onPressStart).not.toHaveBeenCalled();
    expect(onPressChange).not.toHaveBeenCalled();
    expect(onPressUp).not.toHaveBeenCalled();
    expect(onPressEnd).not.toHaveBeenCalled();

    fireEvent.mouseDown(tab);
    expect(tab).not.toHaveAttribute('data-pressed');
    expect(tab).not.toHaveClass('press');

    fireEvent.mouseUp(tab);
    expect(onPress).not.toHaveBeenCalled();
    expect(onPressStart).not.toHaveBeenCalled();
    expect(onPressChange).not.toHaveBeenCalled();
    expect(onPressUp).not.toHaveBeenCalled();
    expect(onPressEnd).not.toHaveBeenCalled();
  });

  it('should support focus ring', async () => {
    let {getAllByRole} = renderTabs({}, {}, {className: ({isFocusVisible}) => isFocusVisible ? 'focus' : ''});
    let tab = getAllByRole('tab')[0];

    expect(tab).not.toHaveAttribute('data-focus-visible');
    expect(tab).not.toHaveClass('focus');

    await user.tab();
    expect(document.activeElement).toBe(tab);
    expect(tab).toHaveAttribute('data-focus-visible', 'true');
    expect(tab).toHaveAttribute('data-focused', 'true');
    expect(tab).toHaveClass('focus');

    await user.tab();
    expect(tab).not.toHaveAttribute('data-focus-visible');
    expect(tab).not.toHaveClass('focus');
  });

  it('should support press state', async () => {
    let {getAllByRole} = renderTabs({}, {}, {className: ({isPressed}) => isPressed ? 'pressed' : ''});
    let tab = getAllByRole('tab')[0];

    expect(tab).not.toHaveAttribute('data-pressed');
    expect(tab).not.toHaveClass('pressed');

    await user.pointer({target: tab, keys: '[MouseLeft>]'});
    expect(tab).toHaveAttribute('data-pressed', 'true');
    expect(tab).toHaveClass('pressed');

    await user.pointer({target: tab, keys: '[/MouseLeft]'});
    expect(tab).not.toHaveAttribute('data-pressed');
    expect(tab).not.toHaveClass('pressed');
  });

  it('should support disabled state on all tabs', () => {
    let {getAllByRole} = renderTabs({isDisabled: true}, {}, {className: ({isDisabled}) => isDisabled ? 'disabled' : ''});
    let tab = getAllByRole('tab')[0];

    expect(tab).toHaveAttribute('aria-disabled', 'true');
    expect(tab).toHaveClass('disabled');
  });

  it('should support disabled state on tab', () => {
    let className = ({isDisabled}) => isDisabled ? 'disabled' : '';
    let {getAllByRole} = renderTabs({disabledKeys: ['a']}, {className}, {className});
    let tab = getAllByRole('tab')[0];

    expect(tab).toHaveAttribute('aria-disabled', 'true');
    expect(tab).toHaveClass('disabled');
  });

  it('should support isDisabled prop on tab', async () => {
    let {getAllByRole} = render(
      <Tabs>
        <TabList aria-label="Test">
          <Tab id="a">A</Tab>
          <Tab id="b" isDisabled>B</Tab>
          <Tab id="c">C</Tab>
        </TabList>
        <TabPanel id="a">A</TabPanel>
        <TabPanel id="b">B</TabPanel>
        <TabPanel id="c">C</TabPanel>
      </Tabs>
    );
    let items = getAllByRole('tab');
    expect(items[1]).toHaveAttribute('aria-disabled', 'true');

    await user.tab();
    expect(document.activeElement).toBe(items[0]);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(items[2]);
  });

  it('finds the first non-disabled tab', async () => {
    let {getAllByRole} = render(
      <Tabs>
        <TabList aria-label="Test">
          <Tab id="a" isDisabled>A</Tab>
          <Tab id="b">B</Tab>
          <Tab id="c">C</Tab>
        </TabList>
        <TabPanel id="a">A</TabPanel>
        <TabPanel id="b">B</TabPanel>
        <TabPanel id="c">C</TabPanel>
      </Tabs>
    );
    let items = getAllByRole('tab');
    expect(items[0]).toHaveAttribute('aria-disabled', 'true');

    await user.tab();
    expect(document.activeElement).toBe(items[1]);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(items[2]);
  });

  it('selects first tab if all tabs are disabled', async () => {
    let {getByRole} = renderTabs({}, {}, {isDisabled: true});
    let tabsTester = testUtilUser.createTester('Tabs', {root: getByRole('tablist')});
    await user.tab();

    expect(tabsTester.selectedTab).toBe(tabsTester.tabs[0]);
    expect(document.activeElement).toBe(tabsTester.tabpanels[0]);
  });

  it('should support selected state', async () => {
    let onSelectionChange = jest.fn();
    let {getByRole} = renderTabs({onSelectionChange}, {}, {className: ({isSelected}) => isSelected ? 'selected' : ''});
    let tabsTester = testUtilUser.createTester('Tabs', {root: getByRole('tablist')});
    let tabs = tabsTester.tabs;

    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveClass('selected');

    await tabsTester.triggerTab({tab: 1});
    expect(onSelectionChange).toHaveBeenLastCalledWith('b');
    expect(tabs[0]).not.toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).not.toHaveClass('selected');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveClass('selected');

    await tabsTester.triggerTab({tab: 0});
    expect(onSelectionChange).toHaveBeenLastCalledWith('a');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveClass('selected');
  });

  it('should update TabPanel ID when current tab is changed', async () => {
    let onSelectionChange = jest.fn();
    let {getByRole} = render(
      <Tabs onSelectionChange={onSelectionChange}>
        <TabList>
          <Tab id="first-element">First</Tab>
          <Tab id="second-element">Second</Tab>
          <Tab id="third-element">Third</Tab>
        </TabList>
        <TabPanel id="first-element">First</TabPanel>
        <TabPanel id="second-element">Second</TabPanel>
        <TabPanel id="third-element">Third</TabPanel>
      </Tabs>
    );

    let tabsTester = testUtilUser.createTester('Tabs', {root: getByRole('tablist')});
    expect(tabsTester.activeTabpanel.getAttribute('id')).toContain('first-element');

    await tabsTester.triggerTab({tab: 1});
    expect(onSelectionChange).toHaveBeenCalled();
    expect(tabsTester.activeTabpanel.getAttribute('id')).toContain('second-element');

    await tabsTester.triggerTab({tab: 2});
    expect(onSelectionChange).toHaveBeenCalled();
    expect(tabsTester.activeTabpanel.getAttribute('id')).toContain('third-element');
  });

  it('should support orientation', () => {
    let className = ({orientation}) => orientation;
    let {getByRole} = renderTabs({orientation: 'vertical', className}, {className});
    let tablist = getByRole('tablist');
    let tabs = tablist.parentElement;

    expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
    expect(tablist).toHaveClass('vertical');

    expect(tabs).toHaveAttribute('data-orientation', 'vertical');
    expect(tabs).toHaveClass('vertical');
  });

  it.each`
    interactionType
    ${'mouse'}
    ${'keyboard'}
    ${'touch'}
  `('should support changing the selected tab regardless of interaction type, interactionType: $interactionType ', async ({interactionType}) => {
    let {getByRole} = renderTabs({orientation: 'vertical'});
    let tabsTester = testUtilUser.createTester('Tabs', {root: getByRole('tablist'), interactionType});
    let tabs = tabsTester.tabs;

    await tabsTester.triggerTab({tab: 0});
    expect(tabsTester.selectedTab).toBe(tabs[0]);
    expect(tabsTester.activeTabpanel.getAttribute('aria-labelledby')).toBe(tabs[0].id);

    await tabsTester.triggerTab({tab: 1});
    expect(tabsTester.selectedTab).toBe(tabs[1]);
    expect(tabsTester.activeTabpanel.getAttribute('aria-labelledby')).toBe(tabs[1].id);

    await tabsTester.triggerTab({tab: 2});
    expect(tabsTester.selectedTab).toBe(tabs[2]);
    expect(tabsTester.activeTabpanel.getAttribute('aria-labelledby')).toBe(tabs[2].id);

    await tabsTester.triggerTab({tab: 1});
    expect(tabsTester.selectedTab).toBe(tabs[1]);
    expect(tabsTester.activeTabpanel.getAttribute('aria-labelledby')).toBe(tabs[1].id);
  });

  it('should support refs', () => {
    let tabsRef = React.createRef();
    let tabListRef = React.createRef();
    let tabRef = React.createRef();
    let tabPanelRef = React.createRef();
    render(
      <Tabs ref={tabsRef}>
        <TabList ref={tabListRef}>
          <Tab id="a" ref={tabRef}>A</Tab>
          <Tab id="b">B</Tab>
          <Tab id="c">C</Tab>
        </TabList>
        <TabPanel id="a" ref={tabPanelRef}>A</TabPanel>
        <TabPanel id="b">B</TabPanel>
        <TabPanel id="c">C</TabPanel>
      </Tabs>
    );
    expect(tabsRef.current).toBeInstanceOf(HTMLElement);
    expect(tabListRef.current).toBeInstanceOf(HTMLElement);
    expect(tabRef.current).toBeInstanceOf(HTMLElement);
    expect(tabPanelRef.current).toBeInstanceOf(HTMLElement);
  });

  it('should support shouldForceMount', async () => {
    // Mock console.error for React Canary "Received the string `true` for the boolean attribute `inert`." warning
    // In current React 18 version (18.1.0), the opposite error is thrown where it expects a non-boolean value for the same `inert` attribute
    const consoleError = console.error;
    console.error = jest.fn();

    let {getAllByRole} = renderTabs({}, {}, {}, {shouldForceMount: true});
    let tabpanels = document.querySelectorAll('.react-aria-TabPanel');
    expect(tabpanels).toHaveLength(3);
    expect(tabpanels[0]).not.toHaveAttribute('inert');
    expect(tabpanels[1]).toHaveAttribute('inert');
    expect(tabpanels[2]).toHaveAttribute('inert');

    let tabs = getAllByRole('tab');
    await user.click(tabs[1]);

    expect(tabpanels[0]).toHaveAttribute('inert');
    expect(tabpanels[1]).not.toHaveAttribute('inert');
    expect(tabpanels[2]).toHaveAttribute('inert');
    console.error = consoleError;
  });

  it('should support keyboardActivation=manual', async () => {
    let onSelectionChange = jest.fn();
    let {getByRole} = renderTabs({keyboardActivation: 'manual', onSelectionChange, defaultSelectedKey: 'a'});
    let tabsTester = testUtilUser.createTester('Tabs', {root: getByRole('tablist'), interactionType: 'keyboard'});

    let tabs = tabsTester.tabs;
    await tabsTester.triggerTab({tab: 0});

    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await tabsTester.triggerTab({tab: 1});
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(document.activeElement).toBe(tabs[1]);
    await tabsTester.triggerTab({tab: 2});
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    expect(document.activeElement).toBe(tabs[2]);
    await tabsTester.triggerTab({tab: 2, manualActivation: true});
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');

    expect(onSelectionChange).toBeCalledTimes(1);
  });

  it('should support tabs as links', async function () {
    let {getAllByRole} = render(<TabsExample />);

    let tabs = getAllByRole('tab');
    expect(tabs[0].tagName).toBe('A');
    expect(tabs[0]).toHaveAttribute('href', '/FoR');
    expect(tabs[1].tagName).toBe('A');
    expect(tabs[1]).toHaveAttribute('href', '/MaR');
    expect(tabs[2].tagName).toBe('A');
    expect(tabs[2]).toHaveAttribute('href', '/Emp');

    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await user.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(tabs[1], {key: 'ArrowRight'});
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('should render tab with aria-label', () => {
    let {getAllByRole} = render(
      <Tabs>
        <TabList>
          <Tab id="a" aria-label="Tab A">A</Tab>
          <Tab id="b" aria-label="Tab B">B</Tab>
          <Tab id="c" aria-label="Tab C">C</Tab>
        </TabList>
        <TabPanel id="a">A</TabPanel>
        <TabPanel id="b">B</TabPanel>
        <TabPanel id="c">C</TabPanel>
      </Tabs>
    );

    let tabs = getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-label', 'Tab A');
    expect(tabs[1]).toHaveAttribute('aria-label', 'Tab B');
    expect(tabs[2]).toHaveAttribute('aria-label', 'Tab C');
  });

  it('supports nested tabs', async () => {
    let {getAllByRole} = render(
      <Tabs>
        <TabList>
          <Tab id="foo">Foo</Tab>
          <Tab id="bar">Bar</Tab>
        </TabList>
        <TabPanel id="foo">
          <Tabs>
            <TabList>
              <Tab id="one">One</Tab>
              <Tab id="two">Two</Tab>
            </TabList>
            <TabPanel id="one">One</TabPanel>
            <TabPanel id="two">Two</TabPanel>
          </Tabs>
        </TabPanel>
        <TabPanel id="bar">Bar</TabPanel>
      </Tabs>
    );

    // Wait a tick for MutationObserver in useHasTabbableChild to fire.
    // This avoids React's "update not wrapped in act" warning.
    await waitFor(() => Promise.resolve());

    let rootTabs = within(getAllByRole('tablist')[0]).getAllByRole('tab');
    expect(rootTabs).toHaveLength(2);
    expect(rootTabs[0]).toHaveTextContent('Foo');
    expect(rootTabs[1]).toHaveTextContent('Bar');

    let innerTabs = within(getAllByRole('tabpanel')[0]).getAllByRole('tab');
    expect(innerTabs).toHaveLength(2);
    expect(innerTabs[0]).toHaveTextContent('One');
    expect(innerTabs[1]).toHaveTextContent('Two');
  });

  it('can add tabs and keep the current selected key', async () => {
    let onSelectionChange = jest.fn();
    function Example(props) {
      let [tabs, setTabs] = useState([
        {id: 1, title: 'Tab 1', content: 'Tab body 1'},
        {id: 2, title: 'Tab 2', content: 'Tab body 2'},
        {id: 3, title: 'Tab 3', content: 'Tab body 3'}
      ]);

      const [selectedTabId, setSelectedTabId] = useState(tabs[0].id);

      let addTab = () => {
        const tabId = tabs.length + 1;

        setTabs((prevTabs) => [
          ...prevTabs,
          {
            id: tabId,
            title: `Tab ${tabId}`,
            content: `Tab body ${tabId}`
          }
        ]);

        // Use functional update to ensure you're working with the most recent state
        setSelectedTabId(tabId);
      };

      let removeTab = () => {
        if (tabs.length > 1) {
          setTabs((prevTabs) => {
            const updatedTabs = prevTabs.slice(0, -1);
            // Update selectedTabId to the last remaining tab's ID if the current selected tab is removed
            const newSelectedTabId = updatedTabs[updatedTabs.length - 1].id;
            setSelectedTabId(newSelectedTabId);
            return updatedTabs;
          });
        }
      };

      const onSelectionChange = (value) => {
        setSelectedTabId(value);
        props.onSelectionChange(value);
      };

      return (
        <Tabs selectedKey={selectedTabId} onSelectionChange={onSelectionChange}>
          <div style={{display: 'flex'}}>
            <TabList aria-label="Dynamic tabs" items={tabs} style={{flex: 1}}>
              {(item) => (
                <Tab>
                  {({isSelected}) => (
                    <p
                      style={{
                        color: isSelected ? 'red' : 'black'
                      }}>
                      {item.title}
                    </p>
                  )}
                </Tab>
              )}
            </TabList>
            <div className="button-group">
              <Button onPress={addTab}>Add tab</Button>
              <Button onPress={removeTab}>Remove tab</Button>
            </div>
          </div>
          <Collection items={tabs}>
            {(item) => (
              <TabPanel
                style={{
                  borderTop: '2px solid black'
                }}>
                {item.content}
              </TabPanel>
            )}
          </Collection>
        </Tabs>
      );
    }
    let {getAllByRole} = render(<Example onSelectionChange={onSelectionChange} />);
    let tabs = getAllByRole('tab');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    await user.tab();
    onSelectionChange.mockClear();
    await user.keyboard('{Enter}');
    expect(onSelectionChange).not.toHaveBeenCalled();
    tabs = getAllByRole('tab');
    expect(tabs[3]).toHaveAttribute('aria-selected', 'true');

    await user.tab();
    await user.keyboard('{Enter}');
    expect(onSelectionChange).not.toHaveBeenCalled();
    tabs = getAllByRole('tab');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
  });
});
