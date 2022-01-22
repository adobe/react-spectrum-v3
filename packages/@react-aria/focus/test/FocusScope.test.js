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

import {act, fireEvent, render} from '@testing-library/react';
import {FocusScope, useFocusManager} from '../';
import React, {useRef} from 'react';
import ReactDOM from 'react-dom';
import userEvent from '@testing-library/user-event';

describe('FocusScope', function () {
  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb());
  });

  afterEach(() => {
    window.requestAnimationFrame.mockRestore();
  });

  describe('focus containment', function () {
    it('should contain focus within the scope', function () {
      let {getByTestId} = render(
        <FocusScope contain>
          <input data-testid="input1" />
          <input data-testid="input2" />
          <input data-testid="input3" />
        </FocusScope>
      );

      let input1 = getByTestId('input1');
      let input2 = getByTestId('input2');
      let input3 = getByTestId('input3');

      act(() => {input1.focus();});
      expect(document.activeElement).toBe(input1);

      userEvent.tab();
      expect(document.activeElement).toBe(input2);

      userEvent.tab();
      expect(document.activeElement).toBe(input3);

      userEvent.tab();
      expect(document.activeElement).toBe(input1);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input3);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input2);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input1);
    });

    it('should work with nested elements', function () {
      let {getByTestId} = render(
        <FocusScope contain>
          <input data-testid="input1" />
          <div>
            <input data-testid="input2" />
            <div>
              <input data-testid="input3" />
            </div>
          </div>
        </FocusScope>
      );

      let input1 = getByTestId('input1');
      let input2 = getByTestId('input2');
      let input3 = getByTestId('input3');

      act(() => {input1.focus();});
      expect(document.activeElement).toBe(input1);

      userEvent.tab();
      expect(document.activeElement).toBe(input2);

      userEvent.tab();
      expect(document.activeElement).toBe(input3);

      userEvent.tab();
      expect(document.activeElement).toBe(input1);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input3);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input2);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input1);
    });

    it('should skip non-tabbable elements', function () {
      let {getByTestId} = render(
        <FocusScope contain>
          <input data-testid="input1" />
          <div />
          <input data-testid="input2" />
          <input data-testid="hiddenInput1" hidden />
          <input style={{display: 'none'}} />
          <input style={{visibility: 'hidden'}} />
          <input style={{visibility: 'collapse'}} />
          <div tabIndex={-1} />
          <input disabled tabIndex={0} />
          <input data-testid="input3" />
        </FocusScope>
      );

      let input1 = getByTestId('input1');
      let input2 = getByTestId('input2');
      let input3 = getByTestId('input3');

      act(() => {input1.focus();});
      expect(document.activeElement).toBe(input1);

      userEvent.tab();
      expect(document.activeElement).toBe(input2);

      userEvent.tab();
      expect(document.activeElement).toBe(input3);

      userEvent.tab();
      expect(document.activeElement).toBe(input1);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input3);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input2);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input1);
    });

    it('should do nothing if a modifier key is pressed', function () {
      let {getByTestId} = render(
        <FocusScope contain>
          <input data-testid="input1" />
          <input data-testid="input2" />
          <input data-testid="input3" />
        </FocusScope>
      );

      let input1 = getByTestId('input1');

      act(() => {input1.focus();});
      expect(document.activeElement).toBe(input1);

      fireEvent.keyDown(document.activeElement, {key: 'Tab', altKey: true});
      expect(document.activeElement).toBe(input1);
    });

    it('should work with multiple focus scopes', function () {
      let {getByTestId} = render(
        <div>
          <FocusScope contain>
            <input data-testid="input1" />
            <input data-testid="input2" />
            <input style={{display: 'none'}} />
            <input style={{visibility: 'hidden'}} />
            <input style={{visibility: 'collapse'}} />
            <input data-testid="input3" />
          </FocusScope>
          <FocusScope contain>
            <input data-testid="input4" />
            <input data-testid="input5" />
            <input style={{display: 'none'}} />
            <input style={{visibility: 'hidden'}} />
            <input style={{visibility: 'collapse'}} />
            <input data-testid="input6" />
          </FocusScope>
        </div>
      );

      let input1 = getByTestId('input1');
      let input2 = getByTestId('input2');
      let input3 = getByTestId('input3');
      let input4 = getByTestId('input4');

      act(() => {input1.focus();});
      expect(document.activeElement).toBe(input1);

      userEvent.tab();
      expect(document.activeElement).toBe(input2);

      userEvent.tab();
      expect(document.activeElement).toBe(input3);

      userEvent.tab();
      expect(document.activeElement).toBe(input1);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input3);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input2);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(input1);

      act(() => {input4.focus();});
      expect(document.activeElement).toBe(input1);
    });

    it('should restore focus to the last focused element in the scope when re-entering the browser', function () {
      let {getByTestId} = render(
        <div>
          <input data-testid="outside" />
          <FocusScope contain>
            <input data-testid="input1" />
            <input data-testid="input2" />
            <input data-testid="input3" />
          </FocusScope>
        </div>
      );

      let input1 = getByTestId('input1');
      let input2 = getByTestId('input2');
      let outside = getByTestId('outside');

      act(() => {input1.focus();});
      fireEvent.focusIn(input1); // jsdom doesn't fire this automatically
      expect(document.activeElement).toBe(input1);

      userEvent.tab();
      fireEvent.focusIn(input2);
      expect(document.activeElement).toBe(input2);

      act(() => {input2.blur();});
      expect(document.activeElement).toBe(input2);

      act(() => {outside.focus();});
      fireEvent.focusIn(outside);
      expect(document.activeElement).toBe(input2);
    });

    it('should restore focus to the last focused element in the scope on focus out', function () {
      let {getByTestId} = render(
        <div>
          <FocusScope contain>
            <input data-testid="input1" />
            <input data-testid="input2" />
          </FocusScope>
        </div>
      );

      let input1 = getByTestId('input1');
      let input2 = getByTestId('input2');

      act(() => {input1.focus();});
      fireEvent.focusIn(input1); // jsdom doesn't fire this automatically
      expect(document.activeElement).toBe(input1);

      userEvent.tab();
      fireEvent.focusIn(input2);
      expect(document.activeElement).toBe(input2);

      act(() => {input2.blur();});
      expect(document.activeElement).toBe(input2);
      fireEvent.focusOut(input2);
      expect(document.activeElement).toBe(input2);
    });

    it('uses document.activeElement instead of e.relatedTarget on blur to determine if focus is still in scope', function () {
      let {getByTestId} = render(
        <div>
          <FocusScope contain>
            <input data-testid="input1" />
            <input data-testid="input2" />
          </FocusScope>
        </div>
      );

      let input1 = getByTestId('input1');
      let input2 = getByTestId('input2');

      act(() => {input1.focus();});
      fireEvent.focusIn(input1); // jsdom doesn't fire this automatically
      expect(document.activeElement).toBe(input1);

      act(() => {
        // set document.activeElement to input2
        input2.focus();
        // if onBlur didn't fallback to checking document.activeElement, this would reset focus to input1
        fireEvent.blur(input1, {relatedTarget: null});
      });

      expect(document.activeElement).toBe(input2);
    });
  });

  describe('focus restoration', function () {
    it('should restore focus to the previously focused node on unmount', function () {
      function Test({show}) {
        return (
          <div>
            <input data-testid="outside" />
            {show &&
              <FocusScope restoreFocus autoFocus>
                <input data-testid="input1" />
                <input data-testid="input2" />
                <input data-testid="input3" />
              </FocusScope>
            }
          </div>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let outside = getByTestId('outside');
      act(() => {outside.focus();});

      rerender(<Test show />);

      let input1 = getByTestId('input1');
      expect(document.activeElement).toBe(input1);

      rerender(<Test />);

      expect(document.activeElement).toBe(outside);
    });

    it('should restore focus to the previously focused node after a child with autoFocus unmounts', function () {
      function Test({show}) {
        return (
          <div>
            <input data-testid="outside" />
            {show &&
              <FocusScope restoreFocus>
                <input data-testid="input1" />
                <input data-testid="input2" autoFocus />
                <input data-testid="input3" />
              </FocusScope>
            }
          </div>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let outside = getByTestId('outside');
      act(() => {outside.focus();});

      rerender(<Test show />);

      let input2 = getByTestId('input2');
      expect(document.activeElement).toBe(input2);

      rerender(<Test />);

      expect(document.activeElement).toBe(outside);
    });

    it('should restore focus to the previously focused node when tabbing away from a child with autoFocus', function () {
      function Test({show}) {
        return (
          <div>
            <input data-testid="outside" />
            <input data-testid="after" />
            {show &&
              <FocusScope restoreFocus>
                <input data-testid="input1" />
                <input data-testid="input2" />
                <input data-testid="input3" autoFocus />
              </FocusScope>
            }
          </div>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let outside = getByTestId('outside');
      act(() => {outside.focus();});

      rerender(<Test show />);

      let input3 = getByTestId('input3');
      expect(document.activeElement).toBe(input3);

      userEvent.tab();
      expect(document.activeElement).toBe(getByTestId('after'));
    });

    it('should restore focus to the previously focused node after children change', function () {
      function Test({show, showChild}) {
        return (
          <div>
            <input data-testid="outside" />
            {show &&
              <FocusScope restoreFocus autoFocus>
                <input data-testid="input1" />
                {showChild && <input data-testid="dynamic" />}
              </FocusScope>
            }
          </div>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let outside = getByTestId('outside');
      act(() => {outside.focus();});

      rerender(<Test show />);
      rerender(<Test show showChild />);

      let dynamic = getByTestId('dynamic');
      act(() => {dynamic.focus();});
      expect(document.activeElement).toBe(dynamic);

      rerender(<Test />);

      expect(document.activeElement).toBe(outside);
    });

    it('should move focus to the next element after the previously focused node on Tab', function () {
      function Test({show}) {
        return (
          <div>
            <input data-testid="before" />
            <button data-testid="trigger" />
            <input data-testid="after" />
            {show &&
              <FocusScope restoreFocus autoFocus>
                <input data-testid="input1" />
                <input data-testid="input2" />
                <input data-testid="input3" />
              </FocusScope>
            }
          </div>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let trigger = getByTestId('trigger');
      act(() => {trigger.focus();});

      rerender(<Test show />);

      let input1 = getByTestId('input1');
      expect(document.activeElement).toBe(input1);

      let input3 = getByTestId('input3');
      act(() => {input3.focus();});

      userEvent.tab();
      expect(document.activeElement).toBe(getByTestId('after'));
    });

    it('should move focus to the previous element after the previously focused node on Shift+Tab', function () {
      function Test({show}) {
        return (
          <div>
            <input data-testid="before" />
            <button data-testid="trigger" />
            <input data-testid="after" />
            {show &&
              <FocusScope restoreFocus autoFocus>
                <input data-testid="input1" />
                <input data-testid="input2" />
                <input data-testid="input3" />
              </FocusScope>
            }
          </div>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let trigger = getByTestId('trigger');
      act(() => {trigger.focus();});

      rerender(<Test show />);

      let input1 = getByTestId('input1');
      expect(document.activeElement).toBe(input1);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(getByTestId('before'));
    });

    it('should move focus to the trigger element on Shift+Tab with tabOrder="after-trigger"', function () {
      function Test({show}) {
        return (
          <div>
            <input data-testid="before" />
            <button data-testid="trigger" />
            <input data-testid="after" />
            {show &&
              <FocusScope restoreFocus autoFocus tabOrder="after-trigger">
                <input data-testid="input1" />
                <input data-testid="input2" />
                <input data-testid="input3" />
              </FocusScope>
            }
          </div>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let trigger = getByTestId('trigger');
      act(() => {trigger.focus();});

      rerender(<Test show />);

      let input1 = getByTestId('input1');
      expect(document.activeElement).toBe(input1);

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(getByTestId('trigger'));
    });

    it('should move focus to the next element on Tab with tabOrder="after-trigger"', function () {
      function Test({show}) {
        return (
          <div>
            <input data-testid="before" />
            <button data-testid="trigger" />
            <input data-testid="after" />
            {show &&
              <FocusScope restoreFocus autoFocus tabOrder="after-trigger">
                <input data-testid="input1" />
                <input data-testid="input2" />
                <input data-testid="input3" />
              </FocusScope>
            }
          </div>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let trigger = getByTestId('trigger');
      act(() => {trigger.focus();});

      rerender(<Test show />);

      let input1 = getByTestId('input1');
      expect(document.activeElement).toBe(input1);

      let input3 = getByTestId('input3');
      act(() => {input3.focus();});

      userEvent.tab();
      expect(document.activeElement).toBe(getByTestId('after'));
    });

    it('should skip over elements within the scope when moving focus to the next element', function () {
      function Test({show}) {
        return (
          <div>
            <input data-testid="before" />
            <button data-testid="trigger" />
            {show &&
              <FocusScope restoreFocus autoFocus>
                <input data-testid="input1" />
                <input data-testid="input2" />
                <input data-testid="input3" />
              </FocusScope>
            }
            <input data-testid="after" />
          </div>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let trigger = getByTestId('trigger');
      act(() => {trigger.focus();});

      rerender(<Test show />);

      let input1 = getByTestId('input1');
      expect(document.activeElement).toBe(input1);

      let input3 = getByTestId('input3');
      act(() => {input3.focus();});

      userEvent.tab();
      expect(document.activeElement).toBe(getByTestId('after'));
    });

    it('should not handle tabbing if the focus scope does not restore focus', function () {
      function Test({show}) {
        return (
          <div>
            <input data-testid="before" />
            <button data-testid="trigger" />
            <input data-testid="after-trigger" />
            {show &&
              <FocusScope autoFocus>
                <input data-testid="input1" />
                <input data-testid="input2" />
                <input data-testid="input3" />
              </FocusScope>
            }
            <input data-testid="after" />
          </div>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let trigger = getByTestId('trigger');
      act(() => {trigger.focus();});

      rerender(<Test show />);

      let input1 = getByTestId('input1');
      expect(document.activeElement).toBe(input1);

      let input3 = getByTestId('input3');
      act(() => {input3.focus();});

      userEvent.tab();
      expect(document.activeElement).toBe(getByTestId('after'));
    });

    it('should move focus to the element after a reference location on Tab', function () {
      function Test({show}) {
        const tabRef = useRef();
        return (
          <>
            <div>
              <button data-testid="trigger" />
              <input data-testid="before" />
              <div ref={tabRef} tabIndex={-1} />
              <input data-testid="after" />
            </div>
            {show &&
              <div>
                <FocusScope restoreFocus autoFocus tabOrder={tabRef}>
                  <input data-testid="input1" />
                  <input data-testid="input2" />
                  <input data-testid="input3" />
                </FocusScope>
              </div>
            }
          </>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let trigger = getByTestId('trigger');
      act(() => {trigger.focus();});

      rerender(<Test show />);

      let input1 = getByTestId('input1');
      expect(document.activeElement).toBe(input1);

      let input3 = getByTestId('input3');
      act(() => {input3.focus();});

      userEvent.tab();
      expect(document.activeElement).toBe(getByTestId('after'));
    });

    it('should move focus to the element before a reference location on Shift+Tab', function () {
      function Test({show}) {
        let tabRef = useRef();
        return (
          <>
            <div>
              <button data-testid="trigger" />
              <input data-testid="before" />
              <div ref={tabRef} tabIndex={-1} />
              <input data-testid="after" />
            </div>
            {show &&
            <div>
              <FocusScope restoreFocus autoFocus tabOrder={tabRef}>
                <input data-testid="input1" />
                <input data-testid="input2" />
                <input data-testid="input3" />
              </FocusScope>

            </div>
            }
          </>
        );
      }

      let {getByTestId, rerender} = render(<Test />);

      let trigger = getByTestId('trigger');
      act(() => {trigger.focus();});

      rerender(<Test show />);

      let input1 = getByTestId('input1');
      expect(document.activeElement).toBe(input1);

      let input3 = getByTestId('input3');
      act(() => {input3.focus();});

      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(getByTestId('before'));
    });
  });

  describe('auto focus', function () {
    it('should auto focus the first tabbable element in the scope on mount', function () {
      let {getByTestId} = render(
        <FocusScope autoFocus>
          <div />
          <input data-testid="input1" />
          <input data-testid="input2" />
          <input data-testid="input3" />
        </FocusScope>
      );

      let input1 = getByTestId('input1');
      expect(document.activeElement).toBe(input1);
    });

    it('should do nothing if something is already focused in the scope', function () {
      let {getByTestId} = render(
        <FocusScope autoFocus>
          <div />
          <input data-testid="input1" />
          <input data-testid="input2" autoFocus />
          <input data-testid="input3" />
        </FocusScope>
      );

      let input2 = getByTestId('input2');
      expect(document.activeElement).toBe(input2);
    });
  });

  describe('focus manager', function () {
    it('should move focus forward', function () {
      function Test() {
        return (
          <FocusScope>
            <Item data-testid="item1" />
            <Item data-testid="item2" />
            <Item data-testid="item3" />
          </FocusScope>
        );
      }

      function Item(props) {
        let focusManager = useFocusManager();
        let onClick = () => {
          focusManager.focusNext();
        };
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        return <div {...props} tabIndex={-1} role="button" onClick={onClick} />;
      }

      let {getByTestId} = render(<Test />);
      let item1 = getByTestId('item1');
      let item2 = getByTestId('item2');
      let item3 = getByTestId('item3');

      act(() => {item1.focus();});

      fireEvent.click(item1);
      expect(document.activeElement).toBe(item2);

      fireEvent.click(item2);
      expect(document.activeElement).toBe(item3);

      fireEvent.click(item3);
      expect(document.activeElement).toBe(item3);
    });

    it('should move focus forward and wrap around', function () {
      function Test() {
        return (
          <FocusScope>
            <Item data-testid="item1" />
            <Item data-testid="item2" />
            <Item data-testid="item3" />
          </FocusScope>
        );
      }

      function Item(props) {
        let focusManager = useFocusManager();
        let onClick = () => {
          focusManager.focusNext({wrap: true});
        };
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        return <div {...props} tabIndex={-1} role="button" onClick={onClick} />;
      }

      let {getByTestId} = render(<Test />);
      let item1 = getByTestId('item1');
      let item2 = getByTestId('item2');
      let item3 = getByTestId('item3');

      act(() => {item1.focus();});

      fireEvent.click(item1);
      expect(document.activeElement).toBe(item2);

      fireEvent.click(item2);
      expect(document.activeElement).toBe(item3);

      fireEvent.click(item3);
      expect(document.activeElement).toBe(item1);
    });

    it('should move focus forward but only to tabbable elements', function () {
      function Test() {
        return (
          <FocusScope>
            <Item data-testid="item1" tabIndex={0} />
            <Item data-testid="item2" tabIndex={-1} />
            <Item style={{display: 'none'}} />
            <Item style={{visibility: 'hidden'}} />
            <Item style={{visibility: 'collapse'}} />
            <Item data-testid="item3" tabIndex={0} />
          </FocusScope>
        );
      }

      function Item(props) {
        let focusManager = useFocusManager();
        let onClick = () => {
          focusManager.focusNext({tabbable: true});
        };
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        return <div tabIndex={0} {...props} role="button" onClick={onClick} />;
      }

      let {getByTestId} = render(<Test />);
      let item1 = getByTestId('item1');
      let item3 = getByTestId('item3');

      act(() => {item1.focus();});

      fireEvent.click(item1);
      expect(document.activeElement).toBe(item3);
    });

    it('should move focus forward but only to tabbable elements while accounting for container elements within the scope', function () {
      function Test() {
        return (
          <FocusScope>
            <Group data-testid="group1">
              <Item data-testid="item1" tabIndex={-1} />
              <Item data-testid="item2" tabIndex={0} />
              <Item style={{display: 'none'}} />
            </Group>
            <Group data-testid="group2">
              <Item style={{visibility: 'hidden'}} />
              <Item style={{visibility: 'collapse'}} />
              <Item data-testid="item3" tabIndex={0} />
            </Group>
          </FocusScope>
        );
      }

      function Item(props) {
        return <div {...props} role="button" />;
      }

      function Group(props) {
        let focusManager = useFocusManager();
        let onMouseDown = e => {
          focusManager.focusNext({from: e.target, tabbable: true});
        };
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        return <div {...props} role="group" onMouseDown={onMouseDown} />;
      }

      let {getByTestId} = render(<Test />);
      let group1 = getByTestId('group1');
      let group2 = getByTestId('group2');
      let item2 = getByTestId('item2');
      let item3 = getByTestId('item3');

      fireEvent.mouseDown(group2);
      expect(document.activeElement).toBe(item3);

      fireEvent.mouseDown(group1);
      expect(document.activeElement).toBe(item2);
    });

    it('should move focus backward', function () {
      function Test() {
        return (
          <FocusScope>
            <Item data-testid="item1" />
            <Item data-testid="item2" />
            <Item data-testid="item3" />
          </FocusScope>
        );
      }

      function Item(props) {
        let focusManager = useFocusManager();
        let onClick = () => {
          focusManager.focusPrevious();
        };
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        return <div {...props} tabIndex={-1} role="button" onClick={onClick} />;
      }

      let {getByTestId} = render(<Test />);
      let item1 = getByTestId('item1');
      let item2 = getByTestId('item2');
      let item3 = getByTestId('item3');

      act(() => {item3.focus();});

      fireEvent.click(item3);
      expect(document.activeElement).toBe(item2);

      fireEvent.click(item2);
      expect(document.activeElement).toBe(item1);

      fireEvent.click(item1);
      expect(document.activeElement).toBe(item1);
    });

    it('should move focus backward and wrap around', function () {
      function Test() {
        return (
          <FocusScope>
            <Item data-testid="item1" />
            <Item data-testid="item2" />
            <Item data-testid="item3" />
          </FocusScope>
        );
      }

      function Item(props) {
        let focusManager = useFocusManager();
        let onClick = () => {
          focusManager.focusPrevious({wrap: true});
        };
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        return <div {...props} tabIndex={-1} role="button" onClick={onClick} />;
      }

      let {getByTestId} = render(<Test />);
      let item1 = getByTestId('item1');
      let item2 = getByTestId('item2');
      let item3 = getByTestId('item3');

      act(() => {item3.focus();});

      fireEvent.click(item3);
      expect(document.activeElement).toBe(item2);

      fireEvent.click(item2);
      expect(document.activeElement).toBe(item1);

      fireEvent.click(item1);
      expect(document.activeElement).toBe(item3);
    });

    it('should move focus backward but only to tabbable elements', function () {
      function Test() {
        return (
          <FocusScope>
            <Item data-testid="item1" tabIndex={0} />
            <Item data-testid="item2" tabIndex={-1} />
            <Item style={{display: 'none'}} />
            <Item style={{visibility: 'hidden'}} />
            <Item style={{visibility: 'collapse'}} />
            <Item data-testid="item3" tabIndex={0} />
          </FocusScope>
        );
      }

      function Item(props) {
        let focusManager = useFocusManager();
        let onClick = () => {
          focusManager.focusPrevious({tabbable: true});
        };
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        return <div tabIndex={0} {...props} role="button" onClick={onClick} />;
      }

      let {getByTestId} = render(<Test />);
      let item1 = getByTestId('item1');
      let item3 = getByTestId('item3');

      act(() => {item3.focus();});

      fireEvent.click(item3);
      expect(document.activeElement).toBe(item1);
    });

    it('should move focus backward but only to tabbable elements while accounting for container elements within the scope', function () {
      function Test() {
        return (
          <FocusScope>
            <Group data-testid="group1">
              <Item data-testid="item1" tabIndex={0} />
              <Item data-testid="item2" tabIndex={-1} />
              <Item style={{display: 'none'}} />
            </Group>
            <Group data-testid="group2">
              <Item style={{visibility: 'hidden'}} />
              <Item style={{visibility: 'collapse'}} />
              <Item data-testid="item3" tabIndex={0} />
            </Group>
          </FocusScope>
        );
      }

      function Item(props) {
        return <div {...props} role="button" />;
      }

      function Group(props) {
        let focusManager = useFocusManager();
        let onMouseDown = e => {
          focusManager.focusPrevious({from: e.target, tabbable: true});
        };
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        return <div {...props} role="group" onMouseDown={onMouseDown} />;
      }

      let {getByTestId} = render(<Test />);
      let group1 = getByTestId('group1');
      let group2 = getByTestId('group2');
      let item1 = getByTestId('item1');

      fireEvent.mouseDown(group2);
      expect(document.activeElement).toBe(item1);

      fireEvent.mouseDown(group1);
      // focus should remain unchanged,
      // because there is no focusable element in scope before group1,
      // and wrap is false
      expect(document.activeElement).toBe(item1);
    });
  });

  describe('nested focus scopes', function () {
    it('should make child FocusScopes the active scope regardless of DOM structure', function () {
      function ChildComponent(props) {
        return ReactDOM.createPortal(props.children, document.body);
      }

      function Test({show}) {
        return (
          <div>
            <input data-testid="outside" />
            <FocusScope restoreFocus contain>
              <input data-testid="input1" />
              {show &&
                <ChildComponent>
                  <FocusScope restoreFocus contain>
                    <input data-testid="input3" />
                  </FocusScope>
                </ChildComponent>
              }
            </FocusScope>
          </div>
        );
      }

      let {getByTestId, rerender} = render(<Test />);
      // Set a focused node and make first FocusScope the active scope
      let input1 = getByTestId('input1');
      act(() => {input1.focus();});
      fireEvent.focusIn(input1);
      expect(document.activeElement).toBe(input1);

      rerender(<Test show />);
      expect(document.activeElement).toBe(input1);
      let input3 = getByTestId('input3');
      act(() => {input3.focus();});
      fireEvent.focusIn(input3);
      expect(document.activeElement).toBe(input3);
    });

    it('should lock tab navigation inside direct child focus scope', function () {
      function Test() {
        return (
          <div>
            <input data-testid="outside" />
            <FocusScope autoFocus restoreFocus contain>
              <input data-testid="parent1" />
              <input data-testid="parent2" />
              <input data-testid="parent3" />
              <FocusScope autoFocus restoreFocus contain>
                <input data-testid="child1" />
                <input data-testid="child2" />
                <input data-testid="child3" />
              </FocusScope>
            </FocusScope>
          </div>
        );
      }

      let {getByTestId} = render(<Test />);
      let child1 = getByTestId('child1');
      let child2 = getByTestId('child2');
      let child3 = getByTestId('child3');

      expect(document.activeElement).toBe(child1);
      userEvent.tab();
      expect(document.activeElement).toBe(child2);
      userEvent.tab();
      expect(document.activeElement).toBe(child3);
      userEvent.tab();
      expect(document.activeElement).toBe(child1);
      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(child3);
    });

    it('should lock tab navigation inside nested child focus scope', function () {
      function Test() {
        return (
          <div>
            <input data-testid="outside" />
            <FocusScope autoFocus restoreFocus contain>
              <input data-testid="parent1" />
              <input data-testid="parent2" />
              <input data-testid="parent3" />
              <div>
                <div>
                  <FocusScope autoFocus restoreFocus contain>
                    <input data-testid="child1" />
                    <input data-testid="child2" />
                    <input data-testid="child3" />
                  </FocusScope>
                </div>
              </div>
            </FocusScope>
          </div>
        );
      }

      let {getByTestId} = render(<Test />);
      let child1 = getByTestId('child1');
      let child2 = getByTestId('child2');
      let child3 = getByTestId('child3');

      expect(document.activeElement).toBe(child1);
      userEvent.tab();
      expect(document.activeElement).toBe(child2);
      userEvent.tab();
      expect(document.activeElement).toBe(child3);
      userEvent.tab();
      expect(document.activeElement).toBe(child1);
      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(child3);
    });

    it('should not lock tab navigation inside a nested focus scope without contain', function () {
      function Test() {
        return (
          <div>
            <input data-testid="outside" />
            <FocusScope autoFocus restoreFocus contain>
              <input data-testid="parent" />
              <div>
                <div>
                  <FocusScope>
                    <input data-testid="child1" />
                    <input data-testid="child2" />
                    <input data-testid="child3" />
                  </FocusScope>
                </div>
              </div>
            </FocusScope>
          </div>
        );
      }

      let {getByTestId} = render(<Test />);
      let parent = getByTestId('parent');
      let child1 = getByTestId('child1');
      let child2 = getByTestId('child2');
      let child3 = getByTestId('child3');

      expect(document.activeElement).toBe(parent);
      userEvent.tab();
      expect(document.activeElement).toBe(child1);
      userEvent.tab();
      expect(document.activeElement).toBe(child2);
      userEvent.tab();
      expect(document.activeElement).toBe(child3);
      userEvent.tab();
      expect(document.activeElement).toBe(parent);
      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(child3);
    });

    it('should restore to the correct scope on unmount', function () {
      function Test({show1, show2, show3}) {
        return (
          <div>
            <input data-testid="outside" />
            <FocusScope autoFocus restoreFocus contain>
              <input data-testid="parent" />
              {show1 &&
                <FocusScope contain>
                  <input data-testid="child1" />
                  {show2 &&
                    <FocusScope contain>
                      <input data-testid="child2" />
                      {show3 &&
                        <FocusScope contain>
                          <input data-testid="child3" />
                        </FocusScope>
                      }
                    </FocusScope>
                  }
                </FocusScope>
              }
            </FocusScope>
          </div>
        );
      }

      let {rerender, getByTestId} = render(<Test />);
      let parent = getByTestId('parent');

      expect(document.activeElement).toBe(parent);

      act(() => rerender(<Test show1 />));
      expect(document.activeElement).toBe(parent);

      // Can move into a child, but not out.
      let child1 = getByTestId('child1');
      userEvent.tab();
      expect(document.activeElement).toBe(child1);

      act(() => parent.focus());
      expect(document.activeElement).toBe(child1);

      rerender(<Test show1 show2 />);
      expect(document.activeElement).toBe(child1);

      let child2 = getByTestId('child2');
      userEvent.tab();
      expect(document.activeElement).toBe(child2);

      act(() => child1.focus());
      expect(document.activeElement).toBe(child2);

      act(() => parent.focus());
      expect(document.activeElement).toBe(child2);

      rerender(<Test show1 show2 show3 />);

      let child3 = getByTestId('child3');
      userEvent.tab();
      expect(document.activeElement).toBe(child3);

      rerender(<Test show1 />);

      act(() => child1.focus());
      expect(document.activeElement).toBe(child1);

      act(() => parent.focus());
      expect(document.activeElement).toBe(child1);
    });

    it('should not lock focus inside a focus scope with a child scope in a portal', function () {
      function Portal(props) {
        return ReactDOM.createPortal(props.children, document.body);
      }

      function Test() {
        return (
          <div>
            <FocusScope autoFocus restoreFocus contain>
              <input data-testid="parent" />
              <div>
                <Portal>
                  <FocusScope>
                    <input data-testid="child" />
                  </FocusScope>
                </Portal>
              </div>
            </FocusScope>
          </div>
        );
      }

      let {getByTestId} = render(<Test />);
      let parent = getByTestId('parent');
      let child = getByTestId('child');

      expect(document.activeElement).toBe(parent);
      act(() => child.focus());
      expect(document.activeElement).toBe(child);
      act(() => parent.focus());
      expect(document.activeElement).toBe(parent);
    });

    it('should lock focus inside a child focus scope with contain in a portal', function () {
      function Portal(props) {
        return ReactDOM.createPortal(props.children, document.body);
      }

      function Test() {
        return (
          <div>
            <FocusScope autoFocus restoreFocus contain>
              <input data-testid="parent" />
              <div>
                <Portal>
                  <FocusScope contain>
                    <input data-testid="child" />
                  </FocusScope>
                </Portal>
              </div>
            </FocusScope>
          </div>
        );
      }

      let {getByTestId} = render(<Test />);
      let parent = getByTestId('parent');
      let child = getByTestId('child');

      expect(document.activeElement).toBe(parent);
      act(() => child.focus());
      expect(document.activeElement).toBe(child);
      act(() => parent.focus());
      expect(document.activeElement).toBe(child);
    });
  });

  describe('scope child of document.body', function () {
    it('should navigate in and out of scope in DOM order when the nodeToRestore is the document.body', function () {
      function Test() {
        return (
          <div>
            <input data-testid="beforeScope" />
            <FocusScope>
              <input data-testid="inScope" />
            </FocusScope>
            <input data-testid="afterScope" />
          </div>
        );
      }

      let {getByTestId} = render(<Test />);
      let beforeScope = getByTestId('beforeScope');
      let inScope = getByTestId('inScope');
      let afterScope = getByTestId('afterScope');

      act(() => {inScope.focus();});
      userEvent.tab();
      expect(document.activeElement).toBe(afterScope);
      act(() => {inScope.focus();});
      userEvent.tab({shift: true});
      expect(document.activeElement).toBe(beforeScope);
    });
  });
});
