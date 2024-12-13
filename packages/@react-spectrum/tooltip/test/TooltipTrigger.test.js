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

import {act, fireEvent, pointerMap, renderv3 as render} from '@react-spectrum/test-utils-internal';
import {ActionButton} from '@react-spectrum/button';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import {Tooltip, TooltipTrigger} from '../';
import {UNSTABLE_PortalProvider} from '@react-aria/overlays';
import userEvent from '@testing-library/user-event';

// Sync with useTooltipTriggerState.ts
const TOOLTIP_DELAY = 1500;

let CLOSE_TIME = 350;

describe('TooltipTrigger', function () {
  let onOpenChange = jest.fn();
  let user;

  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });

  beforeEach(() => {
    // by firing an event at the beginning of each test, we can put ourselves into
    // keyboard modality for the test
    fireEvent.keyDown(document.body, {key: 'Tab'});
    fireEvent.keyUp(document.body, {key: 'Tab'});
  });

  afterEach(() => {
    onOpenChange.mockClear();
    // there's global state, so we need to make sure to run out the cooldown for every test
    act(() => {jest.runAllTimers();});
  });

  describe('immediate', () => {
    it('opens for focus',  () => {
      let {getByRole, queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange} delay={0}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      expect(queryByRole('tooltip')).toBeNull();

      let button = getByLabelText('trigger');
      act(() => {
        button.focus();
      });
      expect(onOpenChange).toHaveBeenCalledWith(true);
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      act(() => {
        button.blur();
      });
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(tooltip).not.toBeInTheDocument();
    });

    it('opens for hover',  async () => {
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange} delay={0}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      await user.click(document.body);

      let button = getByLabelText('trigger');
      await user.hover(button);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      await user.unhover(button);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).toBeVisible();
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(tooltip).not.toBeInTheDocument();
    });

    it('if hovered and focused, will hide if hover leaves',  async () => {
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange} delay={0}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let button = getByLabelText('trigger');
      // add focus
      await user.tab();
      expect(onOpenChange).toHaveBeenCalledWith(true);
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      await user.hover(button);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toBeVisible();

      await user.unhover(button);
      act(() => {
        jest.runAllTimers();
      });
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toBeInTheDocument();

      // remove focus
      act(() => {
        button.blur();
      });
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
    });

    it('if hovered and focused, will hide if focus leaves',  async () => {
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange} delay={0}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let button = getByLabelText('trigger');
      await user.tab();
      expect(onOpenChange).toHaveBeenCalledWith(true);
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      // add hover
      await user.hover(button);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toBeVisible();

      // remove focus
      act(() => {
        button.blur();
      });
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toBeInTheDocument();

      // remove hover
      await user.unhover(button);
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
    });

    it('can be keyboard force closed',  async () => {
      let {queryByRole, getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange} delay={0}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let button = getByLabelText('trigger');
      await user.tab();
      expect(onOpenChange).toHaveBeenCalledWith(true);
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      fireEvent.keyDown(document.activeElement, {key: 'Escape'});
      fireEvent.keyUp(document.activeElement, {key: 'Escape'});
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
      act(() => {
        button.blur();
      });
      act(() => {
        jest.runAllTimers();
      });
      expect(queryByRole('tooltip')).toBeNull();
    });

    it('can be keyboard force closed from anywhere',  async () => {
      let {getByRole, queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange} delay={0}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
          <input type="text" />
        </Provider>
      );
      await user.click(document.body);

      let button = getByLabelText('trigger');
      let input = getByRole('textbox');
      act(() => {
        input.focus();
      });
      await user.hover(button);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      fireEvent.keyDown(document.activeElement, {key: 'Escape'});
      fireEvent.keyUp(document.activeElement, {key: 'Escape'});
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
      act(() => {
        input.blur();
      });
      await user.unhover(button);
      act(() => {
        jest.runAllTimers();
      });
      expect(queryByRole('tooltip')).toBeNull();
    });

    it('is closed if the trigger is clicked',  async () => {
      let {getByRole, queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange} delay={0}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      await user.click(document.body);

      let button = getByLabelText('trigger');
      await user.hover(button);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      await user.click(button);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
      act(() => {
        button.blur();
      });
      act(() => {
        jest.runAllTimers();
      });
      expect(queryByRole('tooltip')).toBeNull();
    });
  });

  it('is closed if the trigger is clicked with the keyboard',  async () => {
    let {getByRole, queryByRole, getByLabelText} = render(
      <Provider theme={theme}>
        <TooltipTrigger onOpenChange={onOpenChange} delay={0}>
          <ActionButton aria-label="trigger" />
          <Tooltip>Helpful information.</Tooltip>
        </TooltipTrigger>
      </Provider>
    );

    let button = getByLabelText('trigger');
    await user.tab();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    let tooltip = getByRole('tooltip');
    expect(tooltip).toBeVisible();
    fireEvent.keyDown(button, {key: 'Enter'});
    fireEvent.keyUp(button, {key: 'Enter'});
    expect(onOpenChange).toHaveBeenCalledWith(false);
    act(() => {
      jest.advanceTimersByTime(CLOSE_TIME);
    });
    expect(tooltip).not.toBeInTheDocument();
    act(() => {
      button.blur();
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByRole('tooltip')).toBeNull();
  });

  describe('delay', () => {
    it('opens immediately for focus',  () => {
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let button = getByLabelText('trigger');
      act(() => {
        button.focus();
      });
      expect(onOpenChange).toHaveBeenCalled();
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      act(() => {
        button.blur();
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
    });

    it('opens for hover',  () => {
      let {getByRole, queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      fireEvent.mouseDown(document.body);
      fireEvent.mouseUp(document.body);

      let button = getByLabelText('trigger');
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(queryByRole('tooltip')).toBeNull();
      // run half way through the timers and see if it's appeared
      act(() => {jest.advanceTimersByTime(TOOLTIP_DELAY / 2);});
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(queryByRole('tooltip')).toBeNull();
      // finish the full amount of time, now it should be visible
      act(() => {jest.advanceTimersByTime(TOOLTIP_DELAY / 2);});
      expect(onOpenChange).toHaveBeenCalledWith(true);
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      fireEvent.mouseLeave(button);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).toBeVisible();
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
    });

    it('never opens if blurred before it opens',  () => {
      let {queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let button = getByLabelText('trigger');
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(queryByRole('tooltip')).toBeNull();
      // run half way through the timers and see if it's appeared
      act(() => {jest.advanceTimersByTime(TOOLTIP_DELAY / 2);});
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(queryByRole('tooltip')).toBeNull();
      fireEvent.mouseLeave(button);
      expect(onOpenChange).not.toHaveBeenCalled();
      act(() => {
        jest.runAllTimers();
      });
      expect(queryByRole('tooltip')).toBeNull();
    });

    it('opens for focus even if the delay was already in process',  () => {
      let {getByRole, queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let button = getByLabelText('trigger');
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);
      expect(queryByRole('tooltip')).toBeNull();
      // run half way through the timers and see if it's appeared
      act(() => {jest.advanceTimersByTime(TOOLTIP_DELAY / 2);});
      expect(queryByRole('tooltip')).toBeNull();
      // halfway through, now add a focus
      // trigger modality to keyboard first
      fireEvent.keyDown(document.body, {key: 'Tab'});
      fireEvent.keyUp(document.body, {key: 'Tab'});
      act(() => {
        button.focus();
      });
      expect(onOpenChange).toHaveBeenCalledWith(true);
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      // finish the full amount of time started by hover
      act(() => {jest.advanceTimersByTime(TOOLTIP_DELAY / 2);});
      expect(tooltip).toBeVisible();
      act(() => {
        button.blur();
      });
      fireEvent.mouseLeave(button);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
    });

    it('once opened, it can be closed and opened instantly for a period of time',  () => {
      let {getByRole, queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      fireEvent.mouseDown(document.body);
      fireEvent.mouseUp(document.body);

      let button = getByLabelText('trigger');
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);
      expect(queryByRole('tooltip')).toBeNull();
      // run half way through the timers and see if it's appeared
      act(() => {jest.advanceTimersByTime(TOOLTIP_DELAY / 2);});
      expect(queryByRole('tooltip')).toBeNull();
      // finish the full amount of time, now it should be visible
      act(() => {jest.advanceTimersByTime(TOOLTIP_DELAY / 2);});
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      fireEvent.mouseLeave(button);
      fireEvent.keyDown(document.activeElement, {key: 'Escape'});
      fireEvent.keyUp(document.activeElement, {key: 'Escape'});

      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
      // change to pointer modality again
      fireEvent.mouseMove(document.body);
      // it's been warmed up, so we can now instantly reopen for a short time
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);
      tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();

      // close again
      fireEvent.mouseLeave(button);
      // if we wait too long, we'll have to wait the full delay again
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toBeInTheDocument();

      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);
      expect(queryByRole('tooltip')).toBeNull();
      act(() => {jest.advanceTimersByTime(TOOLTIP_DELAY / 2);});
      expect(queryByRole('tooltip')).toBeNull();
      act(() => {jest.advanceTimersByTime(TOOLTIP_DELAY / 2);});
      tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();

      // close again
      fireEvent.mouseLeave(button);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toBeInTheDocument();
    });
  });

  describe('custom delay', () => {
    it('opens immediately for focus',  () => {
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange} delay={350}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let button = getByLabelText('trigger');
      act(() => {
        button.focus();
      });
      expect(onOpenChange).toHaveBeenCalled();
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      act(() => {
        button.blur();
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
    });

    it('opens for hover',  () => {
      let {getByRole, queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger onOpenChange={onOpenChange} delay={350}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      fireEvent.mouseDown(document.body);
      fireEvent.mouseUp(document.body);

      let button = getByLabelText('trigger');
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(queryByRole('tooltip')).toBeNull();
      // run half way through the timers and see if it's appeared
      act(() => {jest.advanceTimersByTime(350 / 2);});
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(queryByRole('tooltip')).toBeNull();
      // finish the full amount of time, now it should be visible, note this is still way before the default opening time
      act(() => {jest.advanceTimersByTime(350 / 2);});
      expect(onOpenChange).toHaveBeenCalledWith(true);
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();
      fireEvent.mouseLeave(button);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME / 2);
      });
      expect(tooltip).toBeVisible();
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
    });
  });


  describe('multiple tooltips', () => {
    it('can only show one tooltip at a time', () => {
      let helpfulText = 'Helpful information.';
      let unHelpfulText = 'Unhelpful information.';
      let {getByLabelText, getByText} = render(
        <Provider theme={theme}>
          <TooltipTrigger delay={0}>
            <ActionButton aria-label="good-trigger" />
            <Tooltip>{helpfulText}</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger delay={0}>
            <ActionButton aria-label="bad-trigger" />
            <Tooltip>{unHelpfulText}</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let goodButton = getByLabelText('good-trigger');
      let badButton = getByLabelText('bad-trigger');
      act(() => {
        goodButton.focus();
      });
      let goodTooltip = getByText(helpfulText);
      expect(goodTooltip).toBeVisible();
      expect(() => getByText(unHelpfulText)).toThrow();
      act(() => {
        goodButton.blur();
      });
      act(() => {
        badButton.focus();
      });
      let badTooltip = getByText(unHelpfulText);
      expect(badTooltip).toBeVisible();
      expect(() => getByText(helpfulText)).toThrow();
      act(() => {
        badButton.blur();
      });
    });

    it('will not show a tooltip if the trigger is left during warmup, nor will warmup complete', () => {
      let helpfulText = 'Helpful information.';
      let unHelpfulText = 'Unhelpful information.';
      let {getByLabelText, getByText} = render(
        <Provider theme={theme}>
          <TooltipTrigger>
            <ActionButton aria-label="good-trigger" />
            <Tooltip>{helpfulText}</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger>
            <ActionButton aria-label="bad-trigger" />
            <Tooltip>{unHelpfulText}</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let goodButton = getByLabelText('good-trigger');
      let badButton = getByLabelText('bad-trigger');
      fireEvent.mouseEnter(goodButton);
      fireEvent.mouseMove(goodButton);
      act(() => {
        jest.advanceTimersByTime(TOOLTIP_DELAY / 2);
      });
      fireEvent.mouseLeave(goodButton);
      expect(() => getByText(helpfulText)).toThrow();
      expect(() => getByText(unHelpfulText)).toThrow();
      fireEvent.mouseEnter(badButton);
      fireEvent.mouseMove(badButton);
      act(() => {
        jest.advanceTimersByTime(TOOLTIP_DELAY / 2);
      });
      expect(() => getByText(helpfulText)).toThrow();
      expect(() => getByText(unHelpfulText)).toThrow();
      act(() => {
        jest.advanceTimersByTime(TOOLTIP_DELAY / 2);
      });
      let badTooltip = getByText(unHelpfulText);
      expect(badTooltip).toBeVisible();
      expect(() => getByText(helpfulText)).toThrow();
      fireEvent.mouseLeave(badButton);
    });

    it('should hide tooltip on scroll', () => {
      let {getByLabelText, getByText, getByTestId} = render(
        <Provider theme={theme}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '30px',
              overflow: 'scroll',
              height: '200px'
            }}
            data-testid="scroll-container">
            {new Array(10).fill().map((_, idx) => (
              <TooltipTrigger key={idx}>
                <ActionButton aria-label={`trigger-${idx}`} />
                <Tooltip>{`Tooltip-${idx}`}</Tooltip>
              </TooltipTrigger>
            ))}
          </div>
        </Provider>
      );

      // Tooltip should be visible on focus
      let button1 = getByLabelText('trigger-1');
      act(() => {
        button1.focus();
      });
      let tooltip1 = getByText('Tooltip-1');
      expect(tooltip1).toBeVisible();

      // Tooltip should not be visible on scroll
      let scrollContainer = getByTestId('scroll-container');
      expect(scrollContainer).toBeInTheDocument();
      fireEvent.scroll(scrollContainer, {target: {top: 100}});
      expect(tooltip1).not.toBeVisible();
    });
  });

  it('supports a ref on the Tooltip', () => {
    let ref = React.createRef();
    let {getByRole} = render(
      <Provider theme={theme}>
        <TooltipTrigger>
          <ActionButton>Trigger</ActionButton>
          <Tooltip ref={ref}>Helpful information.</Tooltip>
        </TooltipTrigger>
      </Provider>
    );

    let button = getByRole('button');
    act(() => {
      button.focus();
    });

    let tooltip = getByRole('tooltip');
    expect(ref.current.UNSAFE_getDOMNode()).toBe(tooltip);
  });

  describe('overlay properties', () => {
    it('can be controlled open', () => {
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger isOpen delay={0} onOpenChange={onOpenChange}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      expect(onOpenChange).not.toHaveBeenCalled();
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();

      let button = getByLabelText('trigger');
      act(() => {
        button.focus();
      });
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(tooltip).toBeVisible();
      act(() => {
        button.blur();
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).toBeVisible();
    });

    it('can be controlled hidden', () => {
      let {queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger isOpen={false} delay={0} onOpenChange={onOpenChange}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(queryByRole('tooltip')).toBeNull();

      let button = getByLabelText('trigger');
      act(() => {
        button.focus();
      });
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(queryByRole('tooltip')).toBeNull();
      act(() => {
        button.blur();
      });
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(queryByRole('tooltip')).toBeNull();
    });

    it('can be uncontrolled open', () => {
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger defaultOpen delay={0}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();

      let button = getByLabelText('trigger');
      act(() => {
        button.focus();
      });
      expect(tooltip).toBeVisible();
      act(() => {
        button.blur();
      });
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
      expect(tooltip).not.toBeInTheDocument();
    });
  });

  describe('concurrently open tooltips', () => {
    it('does not allow more than one tooltip open at a time', () => {
      let helpfulText = 'Helpful information.';
      let unHelpfulText = 'Unhelpful information.';
      let {getByLabelText, getByText} = render(
        <Provider theme={theme}>
          <TooltipTrigger delay={0}>
            <ActionButton aria-label="good-trigger" />
            <Tooltip>{helpfulText}</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger delay={0}>
            <ActionButton aria-label="bad-trigger" />
            <Tooltip>{unHelpfulText}</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let goodButton = getByLabelText('good-trigger');
      let badButton = getByLabelText('bad-trigger');
      act(() => {
        goodButton.focus();
      });
      expect(getByText(helpfulText)).toBeVisible();

      fireEvent.mouseMove(document.body);
      // we've used focus to open one, now we can use hover to try and open a second one
      fireEvent.mouseEnter(badButton);
      fireEvent.mouseMove(badButton);

      expect(() => getByText(helpfulText)).toThrow();
      expect(getByText(unHelpfulText)).toBeVisible();
    });

    it('two can be open at once if in controlled open state', () => {
      let helpfulText = 'Helpful information.';
      let unHelpfulText = 'Unhelpful information.';
      let {getByLabelText, getByText} = render(
        <Provider theme={theme}>
          <TooltipTrigger isOpen delay={0}>
            <ActionButton aria-label="good-trigger" />
            <Tooltip>{helpfulText}</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger delay={0}>
            <ActionButton aria-label="bad-trigger" />
            <Tooltip>{unHelpfulText}</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let badButton = getByLabelText('bad-trigger');
      expect(getByText(helpfulText)).toBeVisible();

      fireEvent.mouseMove(document.body);
      // open a second one through interaction
      fireEvent.mouseEnter(badButton);
      fireEvent.mouseMove(badButton);

      expect(getByText(helpfulText)).toBeVisible();
      expect(getByText(unHelpfulText)).toBeVisible();
    });
  });
  describe('disabled', () => {
    it('can be disabled from the TooltipTrigger', () => {
      let {queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger isDisabled delay={0}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      let button = getByLabelText('trigger');
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);

      expect(queryByRole('tooltip')).toBeNull();
      fireEvent.mouseLeave(button);
    });

    // Given that a disabled button cannot be focused, i assume we want to stop this.
    // isDisabled on TooltipTrigger disables the tooltip, not the Button, this one makes some sense, though maybe a bad prop name?
    // isDisabled on the Button disables the Button, but not the tooltip, this one seems wrong
    //    should we disable mouse events on everything that is disabled?
    it('can be disabled from the trigger', () => {
      let {queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger delay={0}>
            <ActionButton aria-label="trigger" isDisabled />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      let button = getByLabelText('trigger');
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);

      expect(queryByRole('tooltip')).toBeNull();
      fireEvent.mouseLeave(button);
    });
  });

  describe('accessibility', () => {
    it('has a trigger described by the tooltip when open', () => {
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger delay={0}>
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      fireEvent.mouseMove(document.body);
      let button = getByLabelText('trigger');
      expect(button).not.toHaveAttribute('aria-describedBy');
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);
      let tooltip = getByRole('tooltip');
      expect(button).toHaveAttribute('aria-describedBy', tooltip.id);
      fireEvent.mouseLeave(button);
      act(jest.runAllTimers);
      expect(button).not.toHaveAttribute('aria-describedBy');
    });
  });

  describe('trigger = focus', () => {
    it('will open for focus', () => {
      let {getByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger delay={0} trigger="focus">
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );

      let button = getByLabelText('trigger');
      act(() => {
        button.focus();
      });
      let tooltip = getByRole('tooltip');
      expect(tooltip).toBeVisible();

      // won't close if the mouse hovers and leaves
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);
      fireEvent.mouseLeave(button);
      expect(tooltip).toBeVisible();
      act(() => {
        button.blur();
      });
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });

      expect(tooltip).not.toBeInTheDocument();
    });

    it('will not open for hover', () => {
      let {queryByRole, getByLabelText} = render(
        <Provider theme={theme}>
          <TooltipTrigger delay={0} trigger="focus">
            <ActionButton aria-label="trigger" />
            <Tooltip>Helpful information.</Tooltip>
          </TooltipTrigger>
        </Provider>
      );
      fireEvent.mouseMove(document.body);
      let button = getByLabelText('trigger');
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);
      expect(queryByRole('tooltip')).toBeNull();
    });
  });

  describe('portalContainer', () => {
    function InfoTooltip(props) {
      return (
        <UNSTABLE_PortalProvider getContainer={() => props.container.current}>
          <TooltipTrigger>
            <ActionButton aria-label="trigger" />
            <Tooltip>
              <div data-testid="content">hello</div>
            </Tooltip>
          </TooltipTrigger>
        </UNSTABLE_PortalProvider>
      );
    }

    function App() {
      let container = React.useRef(null);
      return (
        <>
          <InfoTooltip container={container} />
          <div ref={container} data-testid="custom-container" />
        </>
      );
    }

    it('should render the tooltip in the portal container', async () => {
      let {getByRole, getByTestId} = render(
        <Provider theme={theme}>
          <App />
        </Provider>
      );

      let button = getByRole('button');
      act(() => {
        button.focus();
      });

      expect(getByTestId('content').closest('[data-testid="custom-container"]')).toBe(getByTestId('custom-container'));
      act(() => {
        button.blur();
      });
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
    });
  });

  describe('portalContainer overwrite', () => {
    function InfoTooltip(props) {
      return (
        <UNSTABLE_PortalProvider getContainer={null}>
          <TooltipTrigger>
            <ActionButton aria-label="trigger" />
            <Tooltip>
              <div data-testid="content">hello</div>
            </Tooltip>
          </TooltipTrigger>
        </UNSTABLE_PortalProvider>
      );
    }
    function App() {
      let container = React.useRef(null);
      return (
        <>
          <UNSTABLE_PortalProvider getContainer={() => container.current}>
            <InfoTooltip container={container} />
            <div ref={container} data-testid="custom-container" />
          </UNSTABLE_PortalProvider>
        </>
      );
    }
    it('should no longer render the tooltip in the portal container', async () => {
      let {getByRole, getByTestId} = render(
        <Provider theme={theme}>
          <App />
        </Provider>
      );

      let button = getByRole('button');
      act(() => {
        button.focus();
      });

      expect(getByTestId('content').closest('[data-testid="custom-container"]')).not.toBe(getByTestId('custom-container'));
      act(() => {
        button.blur();
      });
      act(() => {
        jest.advanceTimersByTime(CLOSE_TIME);
      });
    });
  });
});
