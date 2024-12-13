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

import {act, createEvent, fireEvent, mockImplementation, pointerMap, renderv3 as render, waitFor, within} from '@react-spectrum/test-utils-internal';
import {Item, TabList, TabPanels, Tabs} from '../src';
import {Links as LinksExample} from '../stories/Tabs.stories';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

let defaultItems = [
  {name: 'Tab 1', children: 'Tab 1 body'},
  {name: '', children: 'Tab 2 body'},
  {name: 'Tab 3', children: 'Tab 3 body'}
];

function renderComponent(props = {}, itemProps) {
  let {items = defaultItems} = props;
  return render(
    <Provider theme={theme}>
      <Tabs aria-label="Tab Sample" {...props} items={items}>
        <TabList>
          {item => (
            <Item {...itemProps} key={item.name} title={item.name || item.children} />
          )}
        </TabList>
        <TabPanels>
          {item => (
            <Item key={item.name} title={item.name}>
              {item.children}
            </Item>
          )}
        </TabPanels>
      </Tabs>
    </Provider>
  );
}

describe('Tabs', function () {
  let onSelectionChange = jest.fn();
  let user;

  beforeAll(function () {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    act(() => jest.runAllTimers());
  });

  afterAll(function () {
    jest.restoreAllMocks();
  });

  it('renders properly', function () {
    let container = renderComponent();
    let tablist = container.getByRole('tablist');
    expect(tablist).toBeTruthy();

    expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

    let tabs = within(tablist).getAllByRole('tab');
    expect(tabs.length).toBe(3);

    for (let tab of tabs) {
      expect(tab).toHaveAttribute('tabindex');
      expect(tab).toHaveAttribute('aria-selected');
      let isSelected = tab.getAttribute('aria-selected') === 'true';
      if (isSelected) {
        expect(tab).toHaveAttribute('aria-controls');
        let tabpanel = document.getElementById(tab.getAttribute('aria-controls'));
        expect(tabpanel).toBeTruthy();
        expect(tabpanel).toHaveAttribute('aria-labelledby', tab.id);
        expect(tabpanel).toHaveAttribute('role', 'tabpanel');
        expect(tabpanel).toHaveTextContent(defaultItems[0].children);
      }
    }
  });

  it('attaches a user provided ref to the outer div', function () {
    let ref = React.createRef();
    let container = renderComponent({ref});
    let tablist = container.getByRole('tablist');

    expect(ref.current.UNSAFE_getDOMNode()).toBe(tablist.parentElement.parentElement);
  });

  it('allows user to change tab item select via arrow keys with horizontal tabs', function () {
    let container = renderComponent({orientation: 'horizontal'});
    let tablist = container.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    let selectedItem = tabs[0];
    expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

    expect(selectedItem).toHaveAttribute('aria-selected', 'true');
    act(() => {selectedItem.focus();});
    let arrowRight = createEvent.keyDown(selectedItem, {key: 'ArrowRight', code: 39, charCode: 39});
    fireEvent(selectedItem, arrowRight);
    let nextSelectedItem = tabs[1];
    expect(nextSelectedItem).toHaveAttribute('aria-selected', 'true');
    expect(arrowRight.defaultPrevented).toBe(true);
    let arrowLeft = createEvent.keyDown(nextSelectedItem, {key: 'ArrowLeft', code: 37, charCode: 37});
    fireEvent(nextSelectedItem, arrowLeft);
    expect(selectedItem).toHaveAttribute('aria-selected', 'true');
    expect(arrowLeft.defaultPrevented).toBe(true);

    /** prevent changing tabs for horizontal orientations in aria-selected */
    let arrowUp = createEvent.keyDown(selectedItem, {key: 'ArrowUp', code: 38, charCode: 38});
    fireEvent(selectedItem, arrowUp);
    expect(selectedItem).toHaveAttribute('aria-selected', 'true');
    expect(arrowUp.defaultPrevented).toBe(false);
    let arrowDown = createEvent.keyDown(selectedItem, {key: 'ArrowDown', code: 40, charCode: 40});
    fireEvent(selectedItem, arrowDown);
    expect(selectedItem).toHaveAttribute('aria-selected', 'true');
    expect(arrowDown.defaultPrevented).toBe(false);
  });

  it('allows user to change tab item select via arrow keys with vertical tabs', function () {
    let container = renderComponent({orientation: 'vertical'});
    let tablist = container.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    let selectedItem = tabs[0];
    act(() => {selectedItem.focus();});

    expect(tablist).toHaveAttribute('aria-orientation', 'vertical');

    let nextSelectedItem = tabs[1];
    expect(selectedItem).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(selectedItem, {key: 'ArrowDown', code: 40, charCode: 40});
    expect(nextSelectedItem).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(nextSelectedItem, {key: 'ArrowUp', code: 38, charCode: 38});
    expect(selectedItem).toHaveAttribute('aria-selected', 'true');

    /** Changes selection regardless if it's vertical tabs. */
    fireEvent.keyDown(selectedItem, {key: 'ArrowLeft', code: 37, charCode: 37});
    nextSelectedItem = tabs[2];
    expect(nextSelectedItem).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(selectedItem, {key: 'ArrowRight', code: 39, charCode: 39});
    expect(selectedItem).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps focus from first to last/last to first item', function () {
    let container = renderComponent({orientation: 'horizontal'});
    let tablist = container.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    let firstItem = tabs[0];
    act(() => {firstItem.focus();});

    expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

    expect(firstItem).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(firstItem, {key: 'ArrowLeft', code: 37, charCode: 37});
    let lastItem = tabs[tabs.length - 1];
    expect(lastItem).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(lastItem, {key: 'ArrowRight', code: 39, charCode: 39});
    expect(firstItem).toHaveAttribute('aria-selected', 'true');
  });

  it('select last item via end key / select first item via home key', function () {
    let container = renderComponent({orientation: 'vertical'});
    let tablist = container.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    let firstItem = tabs[0];
    act(() => {firstItem.focus();});

    expect(tablist).toHaveAttribute('aria-orientation', 'vertical');

    expect(firstItem).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(firstItem, {key: 'End', code: 35, charCode: 35});
    let lastItem = tabs[tabs.length - 1];
    expect(lastItem).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(lastItem, {key: 'Home', code: 36, charCode: 36});
    expect(firstItem).toHaveAttribute('aria-selected', 'true');
  });

  it('not select via left / right keys if keyboardActivation is manual, select on enter / spacebar', function () {
    let container = renderComponent({keyboardActivation: 'manual', defaultSelectedKey: defaultItems[0].name, onSelectionChange});
    let tablist = container.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    let firstItem = tabs[0];
    let secondItem = tabs[1];
    let thirdItem = tabs[2];
    act(() => {firstItem.focus();});
    expect(firstItem).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(firstItem, {key: 'ArrowRight', code: 39, charCode: 39});
    fireEvent.keyUp(document.activeElement, {key: 'ArrowRight', code: 39, charCode: 39});
    expect(secondItem).toHaveAttribute('aria-selected', 'false');
    expect(document.activeElement).toBe(secondItem);
    fireEvent.keyDown(secondItem, {key: 'ArrowRight', code: 39, charCode: 39});
    fireEvent.keyUp(document.activeElement, {key: 'ArrowRight', code: 39, charCode: 39});
    expect(thirdItem).toHaveAttribute('aria-selected', 'false');
    expect(document.activeElement).toBe(thirdItem);
    fireEvent.keyDown(thirdItem, {key: 'Enter', code: 13, charCode: 13});
    fireEvent.keyUp(document.activeElement, {key: 'Enter', code: 13, charCode: 13});
    expect(firstItem).toHaveAttribute('aria-selected', 'false');
    expect(secondItem).toHaveAttribute('aria-selected', 'false');
    expect(thirdItem).toHaveAttribute('aria-selected', 'true');

    expect(onSelectionChange).toBeCalledTimes(1);
  });

  it('supports using click to change tab', async function () {
    let container = renderComponent({keyboardActivation: 'manual', defaultSelectedKey: defaultItems[0].name, onSelectionChange});
    let tablist = container.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    let firstItem = tabs[0];
    expect(firstItem).toHaveAttribute('aria-selected', 'true');

    let secondItem = tabs[1];
    await user.click(secondItem);
    expect(secondItem).toHaveAttribute('aria-selected', 'true');
    expect(secondItem).toHaveAttribute('aria-controls');
    let tabpanel = document.getElementById(secondItem.getAttribute('aria-controls'));
    expect(tabpanel).toBeTruthy();
    expect(tabpanel).toHaveAttribute('aria-labelledby', secondItem.id);
    expect(tabpanel).toHaveAttribute('role', 'tabpanel');
    expect(tabpanel).toHaveTextContent(defaultItems[1].children);
    expect(onSelectionChange).toBeCalledTimes(1);
  });

  it('does not generate conflicting ids between multiple tabs instances', function () {
    let tree = render(
      <Provider theme={theme}>
        <Tabs aria-label="Tab Sample">
          <TabList>
            {defaultItems.map(item => (
              <Item key={item.name} title={item.name || item.children} />
            ))}
          </TabList>
          <TabPanels>
            {defaultItems.map(item => (
              <Item key={item.name}>
                {item.children}
              </Item>
            ))}
          </TabPanels>
        </Tabs>
        <Tabs aria-label="Tab Sample 2">
          <TabList>
            {defaultItems.map(item => (
              <Item key={item.name} title={item.name || item.children} />
            ))}
          </TabList>
          <TabPanels>
            {defaultItems.map(item => (
              <Item key={item.name}>
                {item.children}
              </Item>
            ))}
          </TabPanels>
        </Tabs>
      </Provider>
    );

    let tablists = tree.getAllByRole('tablist');
    let tabs1 = within(tablists[0]).getAllByRole('tab');
    let tabs2 = within(tablists[1]).getAllByRole('tab');

    for (let i = 0; i < tabs1.length; i++) {
      expect(tabs1[i].id).not.toBe(tabs2[i].id);
    }
  });

  it('should focus the selected tab when tabbing in for the first time', async function () {
    let tree = renderComponent({defaultSelectedKey: defaultItems[1].name});
    await user.tab();

    let tablist = tree.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('should not focus any tabs when isDisabled tabbing in for the first time', async function () {
    let tree = renderComponent({defaultSelectedKey: defaultItems[1].name, isDisabled: true});
    await user.tab();

    let tabpanel = tree.getByRole('tabpanel');
    expect(document.activeElement).toBe(tabpanel);

    let tablist = tree.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    await user.click(tabs[0]);
  });

  it('disabled tabs cannot be keyboard navigated to', async function () {
    let tree = renderComponent({defaultSelectedKey: defaultItems[0].name, disabledKeys: [defaultItems[1].name], onSelectionChange});
    await user.tab();

    let tablist = tree.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    expect(document.activeElement).toBe(tabs[0]);
    fireEvent.keyDown(tabs[1], {key: 'ArrowRight'});
    fireEvent.keyUp(tabs[1], {key: 'ArrowRight'});
    expect(onSelectionChange).toBeCalledWith(defaultItems[2].name);
  });

  it('disabled tabs cannot be pressed', async function () {
    let tree = renderComponent({defaultSelectedKey: defaultItems[0].name, disabledKeys: [defaultItems[1].name], onSelectionChange});
    await user.tab();

    let tablist = tree.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    expect(document.activeElement).toBe(tabs[0]);
    await user.click(tabs[1]);
    expect(onSelectionChange).not.toBeCalled();
  });

  it('finds the first non-disabled tab if the currently selected one is removed', async function () {
    let tree = renderComponent({disabledKeys: [defaultItems[0].name], onSelectionChange, items: defaultItems});
    await user.tab();

    let tablist = tree.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    expect(document.activeElement).toBe(tabs[1]);
    fireEvent.keyDown(tabs[1], {key: 'ArrowRight'});
    fireEvent.keyUp(tabs[1], {key: 'ArrowRight'});
    expect(onSelectionChange).toBeCalledWith(defaultItems[2].name);

    tree.rerender(
      <Provider theme={theme}>
        <Tabs aria-label="Tab Example" disabledKeys={[defaultItems[0].name]} onSelectionChange={onSelectionChange} items={defaultItems.slice(0, 1)}>
          <TabList>
            {item => (
              <Item key={item.name} title={item.name || item.children} />
            )}
          </TabList>
          <TabPanels>
            {item => (
              <Item key={item.name} title={item.name}>
                {item.children}
              </Item>
            )}
          </TabPanels>
        </Tabs>
      </Provider>
    );
    expect(onSelectionChange).toBeCalledWith(defaultItems[1].name);
  });

  it('selects first tab if all tabs are disabled', async function () {
    let tree = renderComponent({disabledKeys: defaultItems.map(item => item.name), onSelectionChange, items: defaultItems});
    await user.tab();

    let tablist = tree.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    let tabpanel = tree.getByRole('tabpanel');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(onSelectionChange).toBeCalledWith(defaultItems[0].name);
    expect(document.activeElement).toBe(tabpanel);
  });

  it('collapses when it can\'t render all the tabs horizontally', async function () {
    let target = [HTMLDivElement.prototype, 'getBoundingClientRect'];
    let mockCalls = [
      function () {
        return {
          left: 0,
          right: 100
        };
      },
      function () {
        return {
          left: 100,
          right: 400
        };
      },
      function () {
        return {
          left: 400,
          right: 700
        };
      },
      function () {
        return {
          right: 500
        };
      }
    ];

    mockImplementation(target, mockCalls, false);

    let {getByRole, queryByRole} = renderComponent({
      'aria-label': 'Test Tabs',
      'aria-labelledby': 'external label',
      onSelectionChange,
      defaultSelectedKey: defaultItems[0].name
    });

    expect(queryByRole('tablist')).toBeNull();
    let tabpanel = getByRole('tabpanel');
    expect(tabpanel).toBeTruthy();
    expect(tabpanel).toHaveTextContent(defaultItems[0].children);

    let picker = getByRole('button');
    let pickerLabel = within(picker).getByText('Tab 1');
    expect(picker).toHaveAttribute('aria-label', 'Test Tabs');
    expect(picker).toHaveAttribute('aria-labelledby', `${pickerLabel.id} ${picker.id} external label`);

    await user.click(picker);
    act(() => jest.runAllTimers());
    let listbox = getByRole('listbox');
    let option = within(listbox).getByText('Tab 3');
    await user.click(option);
    act(() => jest.runAllTimers());

    expect(onSelectionChange).toBeCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith('Tab 3');

    tabpanel = getByRole('tabpanel');
    expect(tabpanel).toHaveTextContent(defaultItems[2].children);
    expect(tabpanel).toHaveAttribute('aria-labelledby', `${picker.id}`);
  });

  it('doesn\'t collapse when it can render all the tabs horizontally', function () {
    jest.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockImplementationOnce(function () {
      return {
        right: 500
      };
    }).mockImplementationOnce(function () {
      return {
        right: 400
      };
    });

    let {getByRole, queryByRole} = renderComponent();
    let tablist = getByRole('tablist');
    expect(tablist).toBeTruthy();
    expect(queryByRole('button')).toBeNull();
  });

  it('dynamically collapses and expands on tab addition/subtraction', function () {
    let target = [HTMLDivElement.prototype, 'getBoundingClientRect'];
    let mockCalls = [
      function () {
        return {
          left: 0,
          right: 200
        };
      },
      function () {
        return {
          left: 200,
          right: 300
        };
      },
      function () {
        return {
          left: 300,
          right: 400
        };
      },
      function () {
        return {
          right: 500
        };
      }
    ];

    let spy = mockImplementation(target, mockCalls, false);

    let {getByRole, queryByRole, rerender} = render(
      <Provider theme={theme}>
        <Tabs aria-label="Test Tabs" items={defaultItems}>
          <TabList>
            {item => (
              <Item key={item.name} title={item.name || item.children} />
            )}
          </TabList>
          <TabPanels>
            {item => (
              <Item key={item.name}>
                {item.children}
              </Item>
            )}
          </TabPanels>
        </Tabs>
      </Provider>
    );
    let tablist = getByRole('tablist');
    expect(tablist).toBeTruthy();
    expect(queryByRole('button')).toBeNull();

    spy.mockImplementationOnce(function () {
      return {
        left: 0,
        right: 200
      };
    }).mockImplementationOnce(function () {
      return {
        left: 200,
        right: 300
      };
    }).mockImplementationOnce(function () {
      return {
        left: 300,
        right: 400
      };
    }).mockImplementationOnce(function () {
      return {
        left: 400,
        right: 700
      };
    }).mockImplementationOnce(function () {
      return {
        right: 500
      };
    });

    let newItems = [...defaultItems];
    newItems.push({name: 'Tab 4', children: 'Tab 4 body'});
    rerender(
      <Provider theme={theme}>
        <Tabs aria-label="Test Tabs" items={newItems}>
          <TabList>
            {item => (
              <Item key={item.name} title={item.name || item.children} />
            )}
          </TabList>
          <TabPanels>
            {item => (
              <Item key={item.name}>
                {item.children}
              </Item>
            )}
          </TabPanels>
        </Tabs>
      </Provider>
    );

    expect(queryByRole('tablist')).toBeNull();
    let tabpanel = getByRole('tabpanel');
    expect(tabpanel).toBeTruthy();
    expect(tabpanel).toHaveTextContent(defaultItems[0].children);

    let picker = getByRole('button');
    expect(picker).toBeTruthy();
    expect(tabpanel).toHaveAttribute('aria-labelledby', `${picker.id}`);

    spy.mockImplementationOnce(function () {
      return {
        left: 0,
        right: 200
      };
    }).mockImplementationOnce(function () {
      return {
        left: 200,
        right: 300
      };
    }).mockImplementationOnce(function () {
      return {
        left: 300,
        right: 400
      };
    }).mockImplementationOnce(function () {
      return {
        left: 400,
        right: 700
      };
    }).mockImplementationOnce(function () {
      return {
        right: 500
      };
    });

    rerender(
      <Provider theme={theme}>
        <Tabs aria-label="Tab Example" items={newItems} orientation="vertical">
          <TabList>
            {item => (
              <Item key={item.name} title={item.name || item.children} />
            )}
          </TabList>
          <TabPanels>
            {item => (
              <Item key={item.name}>
                {item.children}
              </Item>
            )}
          </TabPanels>
        </Tabs>
      </Provider>
    );

    tablist = getByRole('tablist');
    expect(tablist).toBeTruthy();
    expect(queryByRole('button')).toBeNull();

    tabpanel = getByRole('tabpanel');
    expect(tabpanel).toBeTruthy();
    expect(tabpanel).toHaveTextContent(defaultItems[0].children);
    expect(tabpanel).toHaveAttribute('aria-labelledby', defaultItems[0].id);

    spy.mockImplementationOnce(function () {
      return {
        left: 0,
        right: 200
      };
    }).mockImplementationOnce(function () {
      return {
        left: 200,
        right: 300
      };
    }).mockImplementationOnce(function () {
      return {
        left: 300,
        right: 400
      };
    }).mockImplementationOnce(function () {
      return {
        right: 500
      };
    });

    newItems = [...defaultItems];
    newItems.splice(0, 1);
    rerender(
      <Provider theme={theme}>
        <Tabs aria-label="Test Tabs" items={newItems}>
          <TabList>
            {item => (
              <Item key={item.name} title={item.name} />
            )}
          </TabList>
          <TabPanels>
            {item => (
              <Item key={item.name}>
                {item.children}
              </Item>
            )}
          </TabPanels>
        </Tabs>
      </Provider>
    );

    tabpanel = getByRole('tabpanel');
    expect(tabpanel).toBeTruthy();
    expect(tabpanel).toHaveTextContent(defaultItems[1].children);
    expect(tabpanel).toHaveAttribute('aria-labelledby', defaultItems[1].id);

    tablist = getByRole('tablist');
    expect(tablist).toBeTruthy();
    expect(queryByRole('button')).toBeNull();

  });

  it('disabled tabs cannot be selected via collapse picker', async function () {
    let target = [HTMLDivElement.prototype, 'getBoundingClientRect'];
    let mockCalls = [
      function () {
        return {
          left: 0,
          right: 100
        };
      },
      function () {
        return {
          left: 100,
          right: 400
        };
      },
      function () {
        return {
          left: 400,
          right: 700
        };
      },
      function () {
        return {
          right: 500
        };
      }
    ];

    mockImplementation(target, mockCalls);

    let {getByRole, queryByRole} = renderComponent({
      'aria-label': 'Test Tabs',
      onSelectionChange,
      defaultSelectedKey: defaultItems[0].name,
      disabledKeys: ['Tab 3']
    });

    expect(queryByRole('tablist')).toBeNull();
    let tabpanel = getByRole('tabpanel');
    expect(tabpanel).toBeTruthy();
    expect(tabpanel).toHaveTextContent(defaultItems[0].children);

    let picker = getByRole('button');

    await user.click(picker);
    act(() => jest.runAllTimers());
    let listbox = getByRole('listbox');
    let option = within(listbox).getByText('Tab 3');
    await user.click(option);
    act(() => jest.runAllTimers());
    expect(onSelectionChange).not.toHaveBeenCalled();

    option = within(listbox).getByText('Tab 2 body');
    await user.click(option);
    act(() => jest.runAllTimers());
    expect(onSelectionChange).toHaveBeenCalledWith('');
    tabpanel = getByRole('tabpanel');
    expect(tabpanel).toHaveTextContent(defaultItems[1].children);
  });

  it('tabpanel should have tabIndex=0 only when there are no focusable elements', async function () {
    let {getByRole, getAllByRole} = render(
      <Provider theme={theme}>
        <Tabs aria-label="Tab Example" maxWidth={500}>
          <TabList>
            <Item>Tab 1</Item>
            <Item>Tab 2</Item>
          </TabList>
          <TabPanels>
            <Item>
              <input />
            </Item>
            <Item>
              <input disabled />
            </Item>
          </TabPanels>
        </Tabs>
      </Provider>
    );

    let tabpanel = getByRole('tabpanel');
    await waitFor(() => expect(tabpanel).not.toHaveAttribute('tabindex'));

    let tabs = getAllByRole('tab');
    await user.click(tabs[1]);
    tabpanel = getByRole('tabpanel');

    await waitFor(() => expect(tabpanel).toHaveAttribute('tabindex', '0'));

    await user.click(tabs[0]);
    tabpanel = getByRole('tabpanel');

    await waitFor(() => expect(tabpanel).not.toHaveAttribute('tabindex'));
  });

  it('TabPanel children do not share values between panels', async () => {
    let {getByDisplayValue, getAllByRole, getByTestId} = render(
      <Provider theme={theme}>
        <Tabs aria-label="Tab Example" maxWidth={500}>
          <TabList>
            <Item>Tab 1</Item>
            <Item>Tab 2</Item>
          </TabList>
          <TabPanels>
            <Item>
              <input data-testid="panel1_input" />
            </Item>
            <Item>
              <input disabled data-testid="panel2_input" />
            </Item>
          </TabPanels>
        </Tabs>
      </Provider>
    );

    let tabPanelInput = getByTestId('panel1_input');
    expect(tabPanelInput.value).toBe('');
    tabPanelInput.value = 'A String';
    expect(getByDisplayValue('A String')).toBeTruthy();

    let tabs = getAllByRole('tab');
    await user.click(tabs[1]);

    tabPanelInput = getByTestId('panel2_input');
    expect(tabPanelInput.value).toBe('');
  });

  it('Tabs can be aria-labelled', () => {
    let {getAllByRole, getByLabelText} = render(
      <Provider theme={theme}>
        <Tabs aria-label="Tab Example" maxWidth={500}>
          <TabList>
            <Item aria-label="Foo">Tab 1</Item>
            <Item>Tab 2</Item>
          </TabList>
          <TabPanels>
            <Item>
              <input data-testid="panel1_input" />
            </Item>
            <Item>
              <input disabled data-testid="panel2_input" />
            </Item>
          </TabPanels>
        </Tabs>
      </Provider>
    );

    let tab = getByLabelText('Foo');
    expect(tab).toBe(getAllByRole('tab')[0]);
  });

  it('supports custom props for parent tabs element', function () {
    let {getByTestId} = renderComponent({'data-testid': 'tabs1'});
    let tabs = getByTestId('tabs1');
    expect(tabs).toBeInTheDocument();
  });

  it('supports custom props for tab items', function () {
    let {getAllByTestId} = renderComponent({}, {
      'data-testid': 'tabItems',
      'data-instance-id': 'instance-id',
      'id': 'id-1'
    });
    let tabItems = getAllByTestId('tabItems');
    expect(tabItems).toHaveLength(3);
    for (let tabItem of tabItems) {
      expect(tabItem).toHaveAttribute('data-instance-id', 'instance-id');
      expect(tabItem).not.toHaveAttribute('id', 'id-1');
      expect(tabItem).toBeInTheDocument();
    }
  });

  it('fires onSelectionChange when clicking on the current tab', async function () {
    let container = renderComponent({defaultSelectedKey: defaultItems[0].name, onSelectionChange});
    let tablist = container.getByRole('tablist');
    let tabs = within(tablist).getAllByRole('tab');
    let firstItem = tabs[0];
    expect(firstItem).toHaveAttribute('aria-selected', 'true');

    await user.click(firstItem);
    expect(onSelectionChange).toBeCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith(defaultItems[0].name);
  });

  it('updates the tab index of the selected tab if programatically changed', function () {
    let Example = (props) => (
      <Provider theme={theme}>
        <Tabs aria-label="Test Tabs" items={defaultItems} selectedKey={props.selectedKey}>
          <TabList>
            {item => (
              <Item key={item.name} title={item.name || item.children} />
            )}
          </TabList>
          <TabPanels>
            {item => (
              <Item key={item.name}>
                {item.children}
              </Item>
            )}
          </TabPanels>
        </Tabs>
      </Provider>
    );
    let {getAllByRole, rerender} = render(<Example selectedKey="Tab 3" />);

    let tabs = getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('tabindex', '-1');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    expect(tabs[2]).toHaveAttribute('tabindex', '0');

    rerender(<Example selectedKey="Tab 1" />);
    tabs = getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    expect(tabs[2]).toHaveAttribute('tabindex', '-1');
  });

  it('should support tabs as links', async function () {
    let {getAllByRole} = render(<Provider theme={theme}><LinksExample /></Provider>);

    let tabs = getAllByRole('tab');
    expect(tabs[0].tagName).toBe('A');
    expect(tabs[0]).toHaveAttribute('href', '/one');
    expect(tabs[1].tagName).toBe('A');
    expect(tabs[1]).toHaveAttribute('href', '/two');
    expect(tabs[2].tagName).toBe('A');
    expect(tabs[2]).toHaveAttribute('href', '/three');

    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await user.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(tabs[1], {key: 'ArrowRight'});
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
  });

  describe('when using fragments', function () {
    it('renders fragment with children properly', function () {
      let container = render(
        <Provider theme={theme}>
          <Tabs aria-label="Tab Example" maxWidth={500}>
            <TabList>
              <>
                <Item>Tab 1</Item>
                <Item>Tab 2</Item>
              </>
            </TabList>
            <TabPanels>
              <>
                <Item>
                  Tab 1 content
                </Item>
                <Item>
                  Tab 2 content
                </Item>
              </>
            </TabPanels>
          </Tabs>
        </Provider>
      );

      let tablist = container.getByRole('tablist');
      expect(tablist).toBeTruthy();

      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

      let tabs = within(tablist).getAllByRole('tab');
      expect(tabs.length).toBe(2);

      for (let tab of tabs) {
        expect(tab).toHaveAttribute('tabindex');
        expect(tab).toHaveAttribute('aria-selected');
        let isSelected = tab.getAttribute('aria-selected') === 'true';
        if (isSelected) {
          expect(tab).toHaveAttribute('aria-controls');
          let tabpanel = document.getElementById(tab.getAttribute('aria-controls'));
          expect(tabpanel).toBeTruthy();
          expect(tabpanel).toHaveAttribute('aria-labelledby', tab.id);
          expect(tabpanel).toHaveAttribute('role', 'tabpanel');
          expect(tabpanel).toHaveTextContent('Tab 1 content');
        }
      }
    });

    it('renders beginning fragment sibling properly', function () {
      let container = render(
        <Provider theme={theme}>
          <Tabs aria-label="Tab Example" maxWidth={500}>
            <TabList>
              <>
                <Item>Tab 1</Item>
              </>
              <Item>Tab 2</Item>
            </TabList>
            <TabPanels>
              <>
                <Item>
                  Tab 1 content
                </Item>
              </>
              <Item>
                Tab 2 content
              </Item>
            </TabPanels>
          </Tabs>
        </Provider>
      );

      let tablist = container.getByRole('tablist');
      expect(tablist).toBeTruthy();

      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

      let tabs = within(tablist).getAllByRole('tab');
      expect(tabs.length).toBe(2);

      for (let tab of tabs) {
        expect(tab).toHaveAttribute('tabindex');
        expect(tab).toHaveAttribute('aria-selected');
        let isSelected = tab.getAttribute('aria-selected') === 'true';
        if (isSelected) {
          expect(tab).toHaveAttribute('aria-controls');
          let tabpanel = document.getElementById(tab.getAttribute('aria-controls'));
          expect(tabpanel).toBeTruthy();
          expect(tabpanel).toHaveAttribute('aria-labelledby', tab.id);
          expect(tabpanel).toHaveAttribute('role', 'tabpanel');
          expect(tabpanel).toHaveTextContent('Tab 1 content');
        }
      }
    });

    it('renders middle fragment sibling properly', function () {
      let container = render(
        <Provider theme={theme}>
          <Tabs aria-label="Tab Example" maxWidth={500}>
            <TabList>
              <Item>Tab 1</Item>
              <>
                <Item>Tab 2</Item>
              </>
              <Item>Tab 3</Item>
            </TabList>
            <TabPanels>
              <Item>
                Tab 1 content
              </Item>
              <>
                <Item>
                  Tab 2 content
                </Item>
              </>
              <Item>
                Tab 3 content
              </Item>
            </TabPanels>
          </Tabs>
        </Provider>
      );

      let tablist = container.getByRole('tablist');
      expect(tablist).toBeTruthy();

      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

      let tabs = within(tablist).getAllByRole('tab');
      expect(tabs.length).toBe(3);

      for (let tab of tabs) {
        expect(tab).toHaveAttribute('tabindex');
        expect(tab).toHaveAttribute('aria-selected');
        let isSelected = tab.getAttribute('aria-selected') === 'true';
        if (isSelected) {
          expect(tab).toHaveAttribute('aria-controls');
          let tabpanel = document.getElementById(tab.getAttribute('aria-controls'));
          expect(tabpanel).toBeTruthy();
          expect(tabpanel).toHaveAttribute('aria-labelledby', tab.id);
          expect(tabpanel).toHaveAttribute('role', 'tabpanel');
          expect(tabpanel).toHaveTextContent('Tab 1 content');
        }
      }
    });

    it('renders ending fragment sibling properly', function () {
      let container = render(
        <Provider theme={theme}>
          <Tabs aria-label="Tab Example" maxWidth={500}>
            <TabList>
              <Item>Tab 1</Item>
              <>
                <Item>Tab 2</Item>
              </>
            </TabList>
            <TabPanels>
              <Item>
                Tab 1 content
              </Item>
              <>
                <Item>
                  Tab 2 content
                </Item>
              </>
            </TabPanels>
          </Tabs>
        </Provider>
      );

      let tablist = container.getByRole('tablist');
      expect(tablist).toBeTruthy();

      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

      let tabs = within(tablist).getAllByRole('tab');
      expect(tabs.length).toBe(2);

      for (let tab of tabs) {
        expect(tab).toHaveAttribute('tabindex');
        expect(tab).toHaveAttribute('aria-selected');
        let isSelected = tab.getAttribute('aria-selected') === 'true';
        if (isSelected) {
          expect(tab).toHaveAttribute('aria-controls');
          let tabpanel = document.getElementById(tab.getAttribute('aria-controls'));
          expect(tabpanel).toBeTruthy();
          expect(tabpanel).toHaveAttribute('aria-labelledby', tab.id);
          expect(tabpanel).toHaveAttribute('role', 'tabpanel');
          expect(tabpanel).toHaveTextContent('Tab 1 content');
        }
      }
    });

    it('renders list and panel fragment siblings in non-matching positions properly, list fragment first', function () {
      let container = render(
        <Provider theme={theme}>
          <Tabs aria-label="Tab Example" maxWidth={500}>
            <TabList>
              <>
                <Item>Tab 1</Item>
              </>
              <Item>Tab 2</Item>
            </TabList>
            <TabPanels>
              <Item>
                Tab 1 content
              </Item>
              <>
                <Item>
                  Tab 2 content
                </Item>
              </>
            </TabPanels>
          </Tabs>
        </Provider>
      );

      let tablist = container.getByRole('tablist');
      expect(tablist).toBeTruthy();

      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

      let tabs = within(tablist).getAllByRole('tab');
      expect(tabs.length).toBe(2);

      for (let tab of tabs) {
        expect(tab).toHaveAttribute('tabindex');
        expect(tab).toHaveAttribute('aria-selected');
        let isSelected = tab.getAttribute('aria-selected') === 'true';
        if (isSelected) {
          expect(tab).toHaveAttribute('aria-controls');
          let tabpanel = document.getElementById(tab.getAttribute('aria-controls'));
          expect(tabpanel).toBeTruthy();
          expect(tabpanel).toHaveAttribute('aria-labelledby', tab.id);
          expect(tabpanel).toHaveAttribute('role', 'tabpanel');
          expect(tabpanel).toHaveTextContent('Tab 1 content');
        }
      }
    });

    it('renders list and panel fragment siblings in non-matching positions properly, panel fragment first', function () {
      let container = render(
        <Provider theme={theme}>
          <Tabs aria-label="Tab Example" maxWidth={500}>
            <TabList>
              <Item>Tab 1</Item>
              <>
                <Item>Tab 2</Item>
              </>
            </TabList>
            <TabPanels>
              <>
                <Item>
                  Tab 1 content
                </Item>
              </>
              <Item>
                Tab 2 content
              </Item>
            </TabPanels>
          </Tabs>
        </Provider>
      );

      let tablist = container.getByRole('tablist');
      expect(tablist).toBeTruthy();

      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

      let tabs = within(tablist).getAllByRole('tab');
      expect(tabs.length).toBe(2);

      for (let tab of tabs) {
        expect(tab).toHaveAttribute('tabindex');
        expect(tab).toHaveAttribute('aria-selected');
        let isSelected = tab.getAttribute('aria-selected') === 'true';
        if (isSelected) {
          expect(tab).toHaveAttribute('aria-controls');
          let tabpanel = document.getElementById(tab.getAttribute('aria-controls'));
          expect(tabpanel).toBeTruthy();
          expect(tabpanel).toHaveAttribute('aria-labelledby', tab.id);
          expect(tabpanel).toHaveAttribute('role', 'tabpanel');
          expect(tabpanel).toHaveTextContent('Tab 1 content');
        }
      }
    });

    it('renders fragment with renderer properly', function () {
      let container = render(
        <Provider theme={theme}>
          <Tabs aria-label="Tab Sample" items={defaultItems}>
            <TabList>
              <>
                {item => (
                  <Item key={item.name} title={item.name || item.children} />
                )}
              </>
            </TabList>
            <TabPanels>
              <>
                {item => (
                  <Item key={item.name} title={item.name}>
                    {item.children}
                  </Item>
                )}
              </>
            </TabPanels>
          </Tabs>
        </Provider>
      );

      let tablist = container.getByRole('tablist');
      expect(tablist).toBeTruthy();

      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

      let tabs = within(tablist).getAllByRole('tab');
      expect(tabs.length).toBe(3);

      for (let tab of tabs) {
        expect(tab).toHaveAttribute('tabindex');
        expect(tab).toHaveAttribute('aria-selected');
        let isSelected = tab.getAttribute('aria-selected') === 'true';
        if (isSelected) {
          expect(tab).toHaveAttribute('aria-controls');
          let tabpanel = document.getElementById(tab.getAttribute('aria-controls'));
          expect(tabpanel).toBeTruthy();
          expect(tabpanel).toHaveAttribute('aria-labelledby', tab.id);
          expect(tabpanel).toHaveAttribute('role', 'tabpanel');
          expect(tabpanel).toHaveTextContent(defaultItems[0].children);
        }
      }
    });

    it('renders fragment with mapper properly', function () {
      let container = render(
        <Provider theme={theme}>
          <Tabs aria-label="Tab Sample">
            <TabList>
              <>
                {defaultItems.map(item => (
                  <Item key={item.name} title={item.name || item.children} />
                ))}
              </>
            </TabList>
            <TabPanels>
              <>
                {defaultItems.map(item => (
                  <Item key={item.name}>
                    {item.children}
                  </Item>
                ))}
              </>
            </TabPanels>
          </Tabs>
        </Provider>
      );

      let tablist = container.getByRole('tablist');
      expect(tablist).toBeTruthy();

      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

      let tabs = within(tablist).getAllByRole('tab');
      expect(tabs.length).toBe(3);

      for (let tab of tabs) {
        expect(tab).toHaveAttribute('tabindex');
        expect(tab).toHaveAttribute('aria-selected');
        let isSelected = tab.getAttribute('aria-selected') === 'true';
        if (isSelected) {
          expect(tab).toHaveAttribute('aria-controls');
          let tabpanel = document.getElementById(tab.getAttribute('aria-controls'));
          expect(tabpanel).toBeTruthy();
          expect(tabpanel).toHaveAttribute('aria-labelledby', tab.id);
          expect(tabpanel).toHaveAttribute('role', 'tabpanel');
          expect(tabpanel).toHaveTextContent(defaultItems[0].children);
        }
      }
    });
  });
});
