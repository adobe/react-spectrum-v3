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

import {act, createShadowRoot, fireEvent, pointerMap, render, waitFor} from '@react-spectrum/test-utils-internal';
import {defaultTheme} from '@adobe/react-spectrum';
import {DialogContainer} from '@react-spectrum/dialog';
import {enableShadowDOM} from '@react-stately/flags';
import {FocusScope, useFocusManager} from '../';
import {focusScopeTree} from '../src/FocusScope';
import {Provider} from '@react-spectrum/provider';
import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import {Example as StorybookExample} from '../stories/FocusScope.stories';
import {useEvent} from '@react-aria/utils';
import userEvent from '@testing-library/user-event';

describe('FocusScope', function () {
  let user;

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    // make sure to clean up any raf's that may be running to restore focus on unmount
    act(() => {jest.runAllTimers();});
  });

  describe('focus containment', function () {
    it('should contain focus within the scope', async function () {
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

      await user.tab();
      expect(document.activeElement).toBe(input2);

      await user.tab();
      expect(document.activeElement).toBe(input3);

      await user.tab();
      expect(document.activeElement).toBe(input1);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input3);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input2);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input1);
    });

    it('should work with nested elements', async function () {
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

      await user.tab();
      expect(document.activeElement).toBe(input2);

      await user.tab();
      expect(document.activeElement).toBe(input3);

      await user.tab();
      expect(document.activeElement).toBe(input1);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input3);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input2);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input1);
    });

    it('should skip non-tabbable elements', async function () {
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

      await user.tab();
      expect(document.activeElement).toBe(input2);

      await user.tab();
      expect(document.activeElement).toBe(input3);

      await user.tab();
      expect(document.activeElement).toBe(input1);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input3);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input2);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input1);
    });

    it('should only skip content editable which are false', async function () {
      let {getByTestId} = render(
        <FocusScope contain>
          <input data-testid="input1" />
          <span contentEditable data-testid="input2" />
          <span contentEditable="false" />
          <span contentEditable={false} />
          <span contentEditable="plaintext-only" data-testid="input3" />
          <input data-testid="input4" />
        </FocusScope>
      );

      let input1 = getByTestId('input1');
      let input2 = getByTestId('input2');
      let input3 = getByTestId('input3');
      let input4 = getByTestId('input4');

      act(() => {input1.focus();});
      expect(document.activeElement).toBe(input1);

      await user.tab();
      expect(document.activeElement).toBe(input2);

      await user.tab();
      expect(document.activeElement).toBe(input3);

      await user.tab();
      expect(document.activeElement).toBe(input4);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input3);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input2);

      await user.tab({shift: true});
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

    it('should work with multiple focus scopes', async function () {
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

      await user.tab();
      expect(document.activeElement).toBe(input2);

      await user.tab();
      expect(document.activeElement).toBe(input3);

      await user.tab();
      expect(document.activeElement).toBe(input1);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input3);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input2);

      await user.tab({shift: true});
      expect(document.activeElement).toBe(input1);

      act(() => {input4.focus();});
      expect(document.activeElement).toBe(input1);
    });

    it('should restore focus to the last focused element in the scope when re-entering the browser', async function () {
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

      await user.tab();
      fireEvent.focusIn(input2);
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(input2);

      act(() => {input2.blur();});
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(input2);

      act(() => {outside.focus();});
      fireEvent.focusIn(outside);
      expect(document.activeElement).toBe(input2);
    });

    it('should restore focus to the last focused element in the scope on focus out', async function () {
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

      await user.tab();
      fireEvent.focusIn(input2);
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(input2);

      act(() => {input2.blur();});
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(input2);
      fireEvent.focusOut(input2);
      expect(document.activeElement).toBe(input2);
    });

    // This test setup is a bit contrived to just purely simulate the blur/focus events that would happen in a case like this
    it('focus properly moves into child iframe on click', function () {
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
      act(() => {jest.runAllTimers();});

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
      act(() => {jest.runAllTimers();});

      expect(document.activeElement).toBe(outside);
    });

    it('should move focus after the previously focused node when tabbing away from a scope with autoFocus', async function () {
      function Test({show}) {
        return (
          <div>
            <input data-testid="before" />
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

      await user.tab();
      expect(document.activeElement).toBe(getByTestId('after'));
    });

    it('should move focus before the previously focused node when tabbing away from a scope with Shift+Tab', async function () {
      function Test({show}) {
        return (
          <div>
            <input data-testid="before" />
            <input data-testid="outside" />
            <input data-testid="after" />
            {show &&
              <FocusScope restoreFocus>
                <input data-testid="input1" autoFocus />
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

      await user.tab({shift: true});
      expect(document.activeElement).toBe(getByTestId('before'));
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
      act(() => {jest.runAllTimers();});

      expect(document.activeElement).toBe(outside);
    });

    it('should move focus to the element after the previously focused node on Tab', async function () {
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

      await user.tab();
      expect(document.activeElement).toBe(getByTestId('after'));
    });

    it('should move focus to the previous element after the previously focused node on Shift+Tab', async function () {
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

      await user.tab({shift: true});
      expect(document.activeElement).toBe(getByTestId('before'));
    });

    it('should skip over elements within the scope when moving focus to the next element', async function () {
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

      await user.tab();
      expect(document.activeElement).toBe(getByTestId('after'));
    });

    it('should not handle tabbing if the focus scope does not restore focus', async function () {
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

      await user.tab();
      expect(document.activeElement).toBe(getByTestId('after'));
    });

    it.each`
      contain  | isPortaled
      ${false} | ${false}
      ${true}  | ${false}
      ${false} | ${true}
      ${true}  | ${true}
    `('contain=$contain, isPortaled=$isPortaled should restore focus to previous nodeToRestore when the nodeToRestore for the unmounting scope in no longer in the DOM',
    async function ({contain, isPortaled}) {
      expect(focusScopeTree.size).toBe(1);
      let {getAllByText, getAllByRole} = render(<StorybookExample contain={contain} isPortaled={isPortaled} />);
      expect(focusScopeTree.size).toBe(1);
      act(() => {getAllByText('Open dialog')[0].focus();});
      await user.click(document.activeElement);
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(getAllByRole('textbox')[2]);
      act(() => {getAllByText('Open dialog')[1].focus();});
      await user.click(document.activeElement);
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(getAllByRole('textbox')[5]);
      act(() => {getAllByText('Open dialog')[2].focus();});
      await user.click(document.activeElement);
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(getAllByRole('textbox')[8]);
      expect(focusScopeTree.size).toBe(4);
      if (!contain) {
        act(() => {
          getAllByText('close')[1].focus();
        });
        await user.click(document.activeElement);
      } else {
        fireEvent.click(getAllByText('close')[1]);
      }
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(getAllByText('Open dialog')[1]);
      act(() => {getAllByText('close')[0].focus();});
      await user.click(document.activeElement);
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(getAllByText('Open dialog')[0]);
      expect(focusScopeTree.size).toBe(1);
    });

    describe('focusable first in scope', function () {
      it('should restore focus to the first focusable or tabbable element within the scope when focus is lost within the scope', async function () {
        let {getByTestId} = render(
          <div>
            <FocusScope contain>
              <div role="dialog" data-testid="focusable" tabIndex={-1}>
                <Item data-testid="tabbable1" autoFocus tabIndex={null}>Remove me!</Item>
                <Item data-testid="item1" tabIndex={0}>Remove me, too!</Item>
                <Item data-testid="item2" tabIndex={-1}>Remove me, three!</Item>
              </div>
            </FocusScope>
          </div>
        );

        function Item(props) {
          let focusManager = useFocusManager();
          let onClick = e => {
            focusManager.focusNext();
            act(() => {
              // remove fails to fire blur event in jest-dom
              e.target.blur();
              e.target.remove();
              jest.runAllTimers();
            });
          };
          return <button tabIndex={-1} {...props} onClick={onClick} />;
        }
        let focusable = getByTestId('focusable');
        let tabbable1 = getByTestId('tabbable1');
        let item1 = getByTestId('item1');
        let item2 = getByTestId('item2');
        expect(document.activeElement).toBe(tabbable1);
        await user.click(tabbable1);
        expect(tabbable1).not.toBeInTheDocument();
        await waitFor(() => expect(document.activeElement).toBe(item1));
        await user.click(item1);
        expect(item1).not.toBeInTheDocument();
        await waitFor(() => expect(document.activeElement).toBe(item2));
        await user.click(item2);
        expect(item2).not.toBeInTheDocument();
        await waitFor(() => expect(document.activeElement).toBe(focusable));
      });
    });

    it('should not not restore focus when active element is outside the scope', async function () {
      function Test() {
        const [display, setDisplay] = useState(false);
        useEffect(() => {
          let handleKeyDown = (e) => {
            if (e.key === 'Escape') {
              setDisplay(false);
            }
          };
          document.body.addEventListener('keyup', handleKeyDown);
          return () => {
            document.body.removeEventListener('keyup', handleKeyDown);
          };
        }, []);

        return (
          <div>
            <button
              data-testid="button1"
              type="button"
              onClick={() => setDisplay((state) => !state)}>
              {display ? 'Close dialog' : 'Open dialog'}
            </button>
            <button
              data-testid="button2"
              type="button"
              onClick={() => setDisplay((state) => !state)}>
              {display ? 'Close dialog' : 'Open dialog'}
            </button>{' '}
            {display && (
              <FocusScope restoreFocus>
                <input data-testid="input1" />
              </FocusScope>
            )}
          </div>
        );
      }

      let {getByTestId} = render(<Test />);
      let button1 = getByTestId('button1');
      let button2 = getByTestId('button2');
      await user.click(button1);
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(button1);
      let input1 = getByTestId('input1');
      expect(input1).toBeVisible();

      await user.click(button2);
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(button2);
      expect(input1).not.toBeInTheDocument();

      await user.click(button1);
      act(() => {jest.runAllTimers();});
      input1 = getByTestId('input1');
      expect(input1).toBeVisible();
      await user.tab();
      fireEvent.keyDown(document.activeElement, {key: 'Escape'});
      fireEvent.keyUp(document.activeElement, {key: 'Escape'});
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(button2);
      expect(input1).not.toBeInTheDocument();
    });

    it('should allow restoration to be overridden with a custom event', async function () {
      function Test() {
        let [show, setShow] = React.useState(false);
        let ref = React.useRef(null);
        useEvent(ref, 'react-aria-focus-scope-restore', e => {
          e.preventDefault();
        });

        return (
          <div ref={ref}>
            <button onClick={() => setShow(true)}>Show</button>
            {show && <FocusScope restoreFocus>
              <input autoFocus onKeyDown={() => setShow(false)} />
            </FocusScope>}
          </div>
        );
      }

      let {getByRole} = render(<Test />);
      let button = getByRole('button');
      await user.click(button);

      let input = getByRole('textbox');
      expect(document.activeElement).toBe(input);

      await user.keyboard('{Escape}');
      act(() => jest.runAllTimers());
      expect(input).not.toBeInTheDocument();
      expect(document.activeElement).toBe(document.body);
    });

    it('should not bubble focus scope restoration event out of nested focus scopes', async function () {
      function Test() {
        let [show, setShow] = React.useState(false);
        let ref = React.useRef(null);
        useEvent(ref, 'react-aria-focus-scope-restore', e => {
          e.preventDefault();
        });

        return (
          <div ref={ref}>
            <FocusScope>
              <button onClick={() => setShow(true)}>Show</button>
              {show && <FocusScope restoreFocus>
                <input autoFocus onKeyDown={() => setShow(false)} />
              </FocusScope>}
            </FocusScope>
          </div>
        );
      }

      let {getByRole} = render(<Test />);
      let button = getByRole('button');
      await user.click(button);

      let input = getByRole('textbox');
      expect(document.activeElement).toBe(input);

      await user.keyboard('{Escape}');
      act(() => jest.runAllTimers());
      expect(input).not.toBeInTheDocument();
      expect(document.activeElement).toBe(button);
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

      act(() => {jest.runAllTimers();});

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
    it('should move focus forward', async function () {
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

      await user.click(item1);
      expect(document.activeElement).toBe(item2);

      await user.click(item2);
      expect(document.activeElement).toBe(item3);

      await user.click(item3);
      expect(document.activeElement).toBe(item3);
    });

    it('should move focus forward and wrap around', async function () {
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

      await user.click(item1);
      expect(document.activeElement).toBe(item2);

      await user.click(item2);
      expect(document.activeElement).toBe(item3);

      await user.click(item3);
      expect(document.activeElement).toBe(item1);
    });

    it('should move focus forward but only to tabbable elements', async function () {
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

      await user.click(item1);
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

    it('should move focus forward and allow users to skip certain elements', async function () {
      function Test() {
        return (
          <FocusScope>
            <Item data-testid="item1" />
            <Item data-testid="item2" data-skip />
            <Item data-testid="item3" />
          </FocusScope>
        );
      }

      function Item(props) {
        let focusManager = useFocusManager();
        let onClick = () => {
          focusManager.focusNext({
            wrap: true,
            accept: (e) => !e.getAttribute('data-skip')
          });
        };
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        return <div {...props} tabIndex={-1} role="button" onClick={onClick} />;
      }

      let {getByTestId} = render(<Test />);
      let item1 = getByTestId('item1');
      let item3 = getByTestId('item3');

      act(() => {item1.focus();});

      await user.click(item1);
      expect(document.activeElement).toBe(item3);

      await user.click(item3);
      expect(document.activeElement).toBe(item1);
    });

    it('should move focus backward', async function () {
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

      await user.click(item3);
      expect(document.activeElement).toBe(item2);

      await user.click(item2);
      expect(document.activeElement).toBe(item1);

      await user.click(item1);
      expect(document.activeElement).toBe(item1);
    });

    it('should move focus backward and wrap around', async function () {
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

      await user.click(item3);
      expect(document.activeElement).toBe(item2);

      await user.click(item2);
      expect(document.activeElement).toBe(item1);

      await user.click(item1);
      expect(document.activeElement).toBe(item3);
    });

    it('should move focus backward but only to tabbable elements', async function () {
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

      await user.click(item3);
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

    it('should move focus backward and allow users to skip certain elements', async function () {
      function Test() {
        return (
          <FocusScope>
            <Item data-testid="item1" />
            <Item data-testid="item2" data-skip />
            <Item data-testid="item3" />
          </FocusScope>
        );
      }

      function Item(props) {
        let focusManager = useFocusManager();
        let onClick = () => {
          focusManager.focusPrevious({
            wrap: true,
            accept: (e) => !e.getAttribute('data-skip')
          });
        };
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        return <div {...props} tabIndex={-1} role="button" onClick={onClick} />;
      }

      let {getByTestId} = render(<Test />);
      let item1 = getByTestId('item1');
      let item3 = getByTestId('item3');

      act(() => {item1.focus();});

      await user.click(item1);
      expect(document.activeElement).toBe(item3);

      await user.click(item3);
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

    it('should lock tab navigation inside direct child focus scope', async function () {
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

      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(child1);
      await user.tab();
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(child2);
      await user.tab();
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(child3);
      await user.tab();
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(child1);
      await user.tab({shift: true});
      act(() => {jest.runAllTimers();});
      expect(document.activeElement).toBe(child3);
    });

    it('should lock tab navigation inside nested child focus scope', async function () {
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
      await user.tab();
      expect(document.activeElement).toBe(child2);
      await user.tab();
      expect(document.activeElement).toBe(child3);
      await user.tab();
      expect(document.activeElement).toBe(child1);
      await user.tab({shift: true});
      expect(document.activeElement).toBe(child3);
    });

    it('should not lock tab navigation inside a nested focus scope without contain', async function () {
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
      await user.tab();
      expect(document.activeElement).toBe(child1);
      await user.tab();
      expect(document.activeElement).toBe(child2);
      await user.tab();
      expect(document.activeElement).toBe(child3);
      await user.tab();
      expect(document.activeElement).toBe(parent);
      await user.tab({shift: true});
      expect(document.activeElement).toBe(child3);
    });

    it('should not lock tab navigation inside a nested focus scope with restore and not contain', async function () {
      function Test() {
        return (
          <div>
            <input data-testid="outside" />
            <FocusScope autoFocus restoreFocus contain>
              <input data-testid="parent" />
              <div>
                <div>
                  <FocusScope restoreFocus>
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
      await user.tab();
      expect(document.activeElement).toBe(child1);
      await user.tab();
      expect(document.activeElement).toBe(child2);
      await user.tab();
      expect(document.activeElement).toBe(child3);
      await user.tab();
      expect(document.activeElement).toBe(parent);
      await user.tab({shift: true});
      expect(document.activeElement).toBe(child3);
    });

    it('should restore to the correct scope on unmount', async function () {
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
      await user.tab();
      expect(document.activeElement).toBe(child1);

      act(() => parent.focus());
      expect(document.activeElement).toBe(child1);

      rerender(<Test show1 show2 />);
      expect(document.activeElement).toBe(child1);

      let child2 = getByTestId('child2');
      await user.tab();
      expect(document.activeElement).toBe(child2);

      act(() => child1.focus());
      expect(document.activeElement).toBe(child2);

      act(() => parent.focus());
      expect(document.activeElement).toBe(child2);

      rerender(<Test show1 show2 show3 />);

      let child3 = getByTestId('child3');
      await user.tab();
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
    it('should navigate in and out of scope in DOM order when the nodeToRestore is the document.body', async function () {
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
      await user.tab();
      expect(document.activeElement).toBe(afterScope);
      act(() => {inScope.focus();});
      await user.tab({shift: true});
      expect(document.activeElement).toBe(beforeScope);
    });
  });
  describe('node to restore edge cases', () => {
    it('tracks node to restore if the node to restore was removed in another part of the tree', async () => {
      function Test() {
        let [showMenu, setShowMenu] = useState(false);
        let [showDialog, setShowDialog] = useState(false);
        let onClick = () => {
          setShowMenu(false);
          setShowDialog(true);
        };
        return (
          <Provider theme={defaultTheme}>
            <label htmlFor="foo">Extra input to disambiguate focus</label>
            <input id="foo" />
            <FocusScope>
              <button onKeyDown={() => setShowMenu(true)}>Open Menu</button>
              <DialogContainer onDismiss={() => {}}>
                {showMenu && (
                  <FocusScope contain restoreFocus autoFocus>
                    <button onKeyDown={onClick}>Open Dialog</button>
                  </FocusScope>
                )}
              </DialogContainer>
            </FocusScope>
            <DialogContainer onDismiss={() => {}}>
              {showDialog && (
                <FocusScope contain restoreFocus autoFocus>
                  <button onKeyDown={() => setShowDialog(false)}>Close</button>
                </FocusScope>
              )}
            </DialogContainer>
          </Provider>
        );
      }

      render(<Test />);
      expect(document.activeElement).toBe(document.body);
      act(() => {
        jest.runAllTimers();
      });
      await user.tab();
      await user.tab();
      expect(document.activeElement.textContent).toBe('Open Menu');

      await user.keyboard('[Enter]');
      act(() => {
        jest.runAllTimers();
      });

      expect(document.activeElement.textContent).toBe('Open Dialog');

      await user.keyboard('[Enter]');

      // Needed for onBlur raf in useFocusContainment
      act(() => {
        jest.runAllTimers();
      });
      // Needed for useRestoreFocus layout cleanup raf
      act(() => {
        jest.runAllTimers();
      });

      expect(document.activeElement.textContent).toBe('Close');

      await user.keyboard('[Enter]');
      act(() => {
        jest.runAllTimers();
      });
      act(() => {
        jest.runAllTimers();
      });

      expect(document.activeElement).not.toBe(document.body);
      expect(document.activeElement.textContent).toBe('Open Menu');
    });
  });
});

describe('FocusScope with Shadow DOM', function () {
  let user;

  beforeAll(() => {
    enableShadowDOM();
    user = userEvent.setup({delay: null, pointerMap});
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    // make sure to clean up any raf's that may be running to restore focus on unmount
    act(() => {jest.runAllTimers();});
  });

  it('should contain focus within the shadow DOM scope', async function () {
    const {shadowRoot} = createShadowRoot();
    const FocusableComponent = () => ReactDOM.createPortal(
      <FocusScope contain>
        <input data-testid="input1" />
        <input data-testid="input2" />
        <input data-testid="input3" />
      </FocusScope>,
      shadowRoot
    );

    const {unmount} = render(<FocusableComponent />);

    const input1 = shadowRoot.querySelector('[data-testid="input1"]');
    const input2 = shadowRoot.querySelector('[data-testid="input2"]');
    const input3 = shadowRoot.querySelector('[data-testid="input3"]');

    // Simulate focusing the first input
    act(() => {input1.focus();});
    expect(document.activeElement).toBe(shadowRoot.host);
    expect(shadowRoot.activeElement).toBe(input1);

    // Simulate tabbing through inputs
    await user.tab();
    expect(shadowRoot.activeElement).toBe(input2);

    await user.tab();
    expect(shadowRoot.activeElement).toBe(input3);

    // Simulate tabbing back to the first input
    await user.tab();
    expect(shadowRoot.activeElement).toBe(input1);

    // Cleanup
    unmount();
    document.body.removeChild(shadowRoot.host);
  });

  it('should manage focus within nested shadow DOMs', async function () {
    const {shadowRoot: parentShadowRoot} = createShadowRoot();
    const nestedDiv = document.createElement('div');
    parentShadowRoot.appendChild(nestedDiv);
    const childShadowRoot = nestedDiv.attachShadow({mode: 'open'});

    const FocusableComponent = () =>  ReactDOM.createPortal(<FocusScope contain>
      <input data-testid="input1" />
      <input data-testid="input2" />
    </FocusScope>, childShadowRoot);

    const {unmount} = render(<FocusableComponent />);

    const input1 = childShadowRoot.querySelector('[data-testid=input1]');
    const input2 = childShadowRoot.querySelector('[data-testid=input2]');

    act(() => {input1.focus();});
    expect(childShadowRoot.activeElement).toBe(input1);

    await user.tab();
    expect(childShadowRoot.activeElement).toBe(input2);

    // Cleanup
    unmount();
    document.body.removeChild(parentShadowRoot.host);
  });

  /**
   * document.body
   * ├── div#outside-shadow (contains <FocusScope restoreFocus>)
   * │   ├── input (focus can be restored here)
   * │   └── shadow-root
   * │       └── Your custom elements and focusable elements here
   * └── Other elements
   */
  it('should restore focus to the element outside shadow DOM on unmount, with FocusScope outside as well', async () => {
    const App = () => (
      <>
        <FocusScope restoreFocus>
          <input data-testid="outside" />
        </FocusScope>
        <div id="shadow-host" />
      </>
    );

    const {getByTestId} = render(<App />);
    const shadowHost = document.getElementById('shadow-host');
    const shadowRoot = shadowHost.attachShadow({mode: 'open'});

    const FocusableComponent = () => ReactDOM.createPortal(
      <FocusScope restoreFocus>
        <input data-testid="input1" />
        <input data-testid="input2" />
        <input data-testid="input3" />
      </FocusScope>,
      shadowRoot
    );

    const {unmount} = render(<FocusableComponent />);

    const input1 = shadowRoot.querySelector('[data-testid="input1"]');
    act(() => { input1.focus(); });
    expect(shadowRoot.activeElement).toBe(input1);

    const externalInput = getByTestId('outside');
    act(() => { externalInput.focus(); });
    expect(document.activeElement).toBe(externalInput);

    act(() => {
      jest.runAllTimers();
    });

    unmount();

    expect(document.activeElement).toBe(externalInput);
  });

  /**
   * Test case: https://github.com/adobe/react-spectrum/issues/1472
   */
  it('should autofocus and lock tab navigation inside shadow DOM', async function () {
    const {shadowRoot, shadowHost} = createShadowRoot();

    const FocusableComponent = () => ReactDOM.createPortal(
      <FocusScope contain>
        <input data-testid="input1" />
        <input data-testid="input2" />
        <button data-testid="button">Button</button>
      </FocusScope>,
      shadowRoot
    );

    const {unmount} = render(<FocusableComponent />);

    const input1 = shadowRoot.querySelector('[data-testid="input1"]');
    const input2 = shadowRoot.querySelector('[data-testid="input2"]');
    const button = shadowRoot.querySelector('[data-testid="button"]');

    // Simulate focusing the first input and tab through the elements
    act(() => {input1.focus();});
    expect(shadowRoot.activeElement).toBe(input1);

    // Hit TAB key
    await user.tab();
    expect(shadowRoot.activeElement).toBe(input2);

    // Hit TAB key
    await user.tab();
    expect(shadowRoot.activeElement).toBe(button);

    // Simulate tab again to check if focus loops back to the first input
    await user.tab();
    expect(shadowRoot.activeElement).toBe(input1);

    // Cleanup
    unmount();
    document.body.removeChild(shadowHost);
  });
});

describe('Unmounting cleanup', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.runAllTimers();
  });

  // this test will fail in the 'afterAll' if there are any rafs left over
  it('should not leak request animation frames',  () => {
    let tree = render(
      <FocusScope restoreFocus contain>
        <button>Focus me</button>
        <button>Then Focus me</button>
      </FocusScope>
    );
    let buttons = tree.getAllByRole('button');
    act(() => buttons[0].focus());
    act(() => buttons[1].focus());
    act(() => buttons[1].blur());
  });
});
