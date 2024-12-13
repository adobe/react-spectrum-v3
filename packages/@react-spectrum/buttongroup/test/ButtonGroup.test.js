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

import {act, pointerMap, renderv3 as render, within} from '@react-spectrum/test-utils-internal';
import {Button} from '@react-spectrum/button';
import {ButtonGroup} from '../';
import {Provider} from '@react-spectrum/provider';
import React, {useEffect, useRef} from 'react';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

let buttonGroupId = 'button-group';
let onPressSpy1 = jest.fn();
let onPressSpy2 = jest.fn();
let onPressSpy3 = jest.fn();

function renderComponent(Component, props = {}) {
  return render(
    <Provider theme={theme}>
      <ButtonGroup data-testid={buttonGroupId} {...props}>
        <Button onPress={onPressSpy1} variant="primary">
          Button1
        </Button>
        <Button onPress={onPressSpy2} variant="primary">
          Button2
        </Button>
        <Button onPress={onPressSpy3} variant="primary">
          Button3
        </Button>
      </ButtonGroup>
    </Provider>
  );
}

describe('ButtonGroup', function () {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each`
    Name               | Component        | props
    ${'ButtonGroup'}   | ${ButtonGroup}   | ${{}}
  `('$Name renders multiple buttons', async function ({Component, props}) {
    let user = userEvent.setup({delay: null, pointerMap});
    let tree = renderComponent(Component, props);
    let buttonGroup = tree.getByTestId(buttonGroupId);
    expect(buttonGroup).toBeTruthy();

    let button1 = within(buttonGroup).getByText('Button1');
    let button2 = within(buttonGroup).getByText('Button2');
    let button3 = within(buttonGroup).getByText('Button3');

    expect(button1).toBeTruthy();
    expect(button2).toBeTruthy();
    expect(button3).toBeTruthy();

    await user.click(button1);
    await user.click(button2);
    await user.click(button3);

    expect(onPressSpy1).toHaveBeenCalledTimes(1);
    expect(onPressSpy2).toHaveBeenCalledTimes(1);
    expect(onPressSpy3).toHaveBeenCalledTimes(1);
  });

  it.each`
    Name               | Component        | props
    ${'ButtonGroup'}   | ${ButtonGroup}   | ${{UNSAFE_className: 'custom class'}}
  `('$Name supports UNSAFE_className', function ({Component, props}) {
    let tree = renderComponent(Component, props);
    let buttonGroup = tree.getByTestId(buttonGroupId);
    expect(buttonGroup).toBeTruthy();
    expect(buttonGroup).toHaveAttribute('class', expect.stringContaining('custom class'));
  });

  it.each`
    Name               | Component        | props
    ${'ButtonGroup'}   | ${ButtonGroup}   | ${{}}
  `('$Name supports attaching a ref to the button group', function ({Component}) {
    let ref = React.createRef();
    let tree = renderComponent(Component, {ref});
    let buttonGroup = tree.getByTestId(buttonGroupId);
    expect(buttonGroup).toEqual(ref.current.UNSAFE_getDOMNode());
  });

  it.each`
    Name               | Component        | props
    ${'ButtonGroup'}   | ${ButtonGroup}   | ${{isDisabled: true}}
  `('$Name supports disabling all buttons within via isDisabled', async function ({Component, props}) {
    let user = userEvent.setup({delay: null, pointerMap});
    let tree = renderComponent(Component, props);
    let buttonGroup = tree.getByTestId(buttonGroupId);
    expect(buttonGroup).toBeTruthy();

    let button1 = within(buttonGroup).getByText('Button1');
    let button2 = within(buttonGroup).getByText('Button2');
    let button3 = within(buttonGroup).getByText('Button3');

    await user.click(button1);
    await user.click(button2);
    await user.click(button3);

    expect(onPressSpy1).toHaveBeenCalledTimes(0);
    expect(onPressSpy2).toHaveBeenCalledTimes(0);
    expect(onPressSpy3).toHaveBeenCalledTimes(0);
  });

  // TODO: Retool this one to check for aria-orientation when ButtonGroup is finalized
  it.each`
    Name               | Component        | props
    ${'ButtonGroup'}   | ${ButtonGroup}   | ${{orientation: 'vertical'}}
  `('$Name supports vertical orientation', function ({Component, props}) {
    let tree = renderComponent(Component, props);
    let buttonGroup = tree.getByTestId(buttonGroupId);
    expect(buttonGroup).toBeTruthy();
    expect(buttonGroup).toHaveAttribute('class', expect.stringContaining('spectrum-ButtonGroup--vertical'));
  });

  describe('resizing', () => {
    it('goes vertical if there is not enough room after buttongroup gets a new size', () => {
      let setUp = ({buttonGroup, button1, button2, button3}) => {
        jest.spyOn(buttonGroup, 'offsetWidth', 'get').mockImplementationOnce(() => 88).mockImplementation(() => 90);
        jest.spyOn(button1, 'offsetLeft', 'get').mockImplementation(() => 0);
        jest.spyOn(button1, 'offsetWidth', 'get').mockImplementation(() => 30);
        jest.spyOn(button2, 'offsetLeft', 'get').mockImplementation(() => 30);
        jest.spyOn(button2, 'offsetWidth', 'get').mockImplementation(() => 30);
        jest.spyOn(button3, 'offsetLeft', 'get').mockImplementation(() => 60);
        jest.spyOn(button3, 'offsetWidth', 'get').mockImplementation(() => 30);

      };
      let {getByTestId} = render(<ButtonGroupWithRefs setUp={setUp} />);
      let buttonGroup = getByTestId(buttonGroupId);

      // ResizeObserver not actually implemented in jsdom, so rely on the fallback to window resize listener
      act(() => {window.dispatchEvent(new Event('resize'));});
      expect(buttonGroup).toHaveAttribute('class', expect.stringContaining('spectrum-ButtonGroup--vertical'));

      act(() => {window.dispatchEvent(new Event('resize'));});
      expect(buttonGroup).not.toHaveAttribute('class', expect.stringContaining('spectrum-ButtonGroup--vertical'));
    });
    // can't test children being added because i don't have access to the ref in time
  });

// Test that it handles the useEffect wrapping?
});

function ButtonGroupWithRefs(props) {
  let buttonGroup = useRef();
  let button1 = useRef();
  let button2 = useRef();
  let button3 = useRef();
  useEffect(() => {
    props.setUp({
      buttonGroup: buttonGroup.current.UNSAFE_getDOMNode(),
      button1: button1.current.UNSAFE_getDOMNode(),
      button2: button2.current.UNSAFE_getDOMNode(),
      button3: button3.current.UNSAFE_getDOMNode()
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Provider theme={theme}>
      <ButtonGroup ref={buttonGroup} data-testid={buttonGroupId} {...props}>
        <Button ref={button1} onPress={onPressSpy1} variant="primary">
          Button1
        </Button>
        <Button ref={button2} onPress={onPressSpy2} variant="primary">
          Button2
        </Button>
        <Button ref={button3} onPress={onPressSpy3} variant="primary">
          Button3
        </Button>
      </ButtonGroup>
    </Provider>
  );
}
