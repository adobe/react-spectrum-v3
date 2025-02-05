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

import {act, fireEvent, pointerMap, render} from '@react-spectrum/test-utils-internal';
import {Button, Focusable, OverlayArrow, Pressable, Tooltip, TooltipTrigger} from 'react-aria-components';
import React from 'react';
import userEvent from '@testing-library/user-event';

function TestTooltip(props) {
  return (
    <TooltipTrigger delay={0}>
      <Button><span aria-hidden="true">✏️</span></Button>
      <Tooltip data-test="tooltip" {...props}>
        <OverlayArrow>
          <svg width={8} height={8}>
            <path d="M0 0,L4 4,L8 0" />
          </svg>
        </OverlayArrow>
        Edit
      </Tooltip>
    </TooltipTrigger>
  );
}

let renderTooltip = (props) => render(<TestTooltip {...props} />);

describe('Tooltip', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup({delay: null, pointerMap});
    jest.useFakeTimers();
  });

  it('shows on hover', async () => {
    let {getByRole} = renderTooltip();
    let button = getByRole('button');

    fireEvent.mouseMove(document.body);
    await user.hover(button);
    act(() => jest.runAllTimers());

    let tooltip = getByRole('tooltip');
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveClass('react-aria-Tooltip');
    expect(tooltip).toHaveAttribute('data-placement', 'top');
    expect(tooltip).toHaveStyle('position: absolute');
    expect(tooltip).toHaveAttribute('data-test', 'tooltip');

    let arrow = tooltip.querySelector('.react-aria-OverlayArrow');
    expect(arrow).toHaveStyle('position: absolute');
  });

  it('shows on focus', async () => {
    let {getByRole} = renderTooltip();
    let button = getByRole('button');

    await user.tab();

    let tooltip = getByRole('tooltip');
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveClass('react-aria-Tooltip');
    expect(tooltip).toHaveAttribute('data-placement', 'top');
    expect(tooltip).toHaveStyle('position: absolute');

    let arrow = tooltip.querySelector('.react-aria-OverlayArrow');
    expect(arrow).toHaveStyle('position: absolute');
  });

  it('should support render props', async () => {
    const {getByRole} = render(
      <TooltipTrigger delay={0}>
        <Button><span aria-hidden="true">✏️</span></Button>
        <Tooltip placement="bottom start">{({placement}) => `Content at ${placement}`}</Tooltip>
      </TooltipTrigger>
    );

    await user.tab();

    let tooltip = getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Content at bottom');
  });

  it('supports isEntering and isExiting props', async () => {
    let {getByRole, rerender} = render(<TestTooltip isEntering />);

    let button = getByRole('button');

    fireEvent.mouseMove(document.body);
    await user.hover(button);
    act(() => jest.runAllTimers());

    let tooltip = getByRole('tooltip');
    expect(tooltip).toHaveAttribute('data-entering');

    rerender(<TestTooltip />);
    expect(tooltip).not.toHaveAttribute('data-entering');

    rerender(<TestTooltip isExiting />);
    await user.unhover(button);
    act(() => jest.runAllTimers());

    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveAttribute('data-exiting');

    rerender(<TestTooltip />);
    expect(tooltip).not.toBeInTheDocument();
  });

  it('supports overriding styles', async () => {
    let {getByRole} = render(<TestTooltip style={{zIndex: 5}} />);

    let button = getByRole('button');

    fireEvent.mouseMove(document.body);
    await user.hover(button);
    act(() => jest.runAllTimers());

    let tooltip = getByRole('tooltip');
    expect(tooltip).toHaveAttribute('style', expect.stringContaining('z-index: 5'));

    await user.unhover(button);
    act(() => jest.runAllTimers());
  });

  it('should hide tooltip on scroll', async () => {
    let {getByLabelText, getByText, getByTestId} = render(
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
          <TooltipTrigger delay={0} key={idx}>
            <Button aria-label={`trigger-${idx}`}><span aria-hidden="true">✏️</span></Button>
            <Tooltip>{`Tooltip-${idx}`}</Tooltip>
          </TooltipTrigger>
        ))}
      </div>
    );

    // Tooltip should be visible on focus
    let button1 = getByLabelText('trigger-1');
    fireEvent.mouseMove(document.body);
    await user.hover(button1);
    act(() => jest.runAllTimers());

    let tooltip1 = getByText('Tooltip-1');
    expect(tooltip1).toBeVisible();

    // Tooltip should not be visible on scroll
    let scrollContainer = getByTestId('scroll-container');
    expect(scrollContainer).toBeInTheDocument();
    fireEvent.scroll(scrollContainer, {target: {top: 100}});
    expect(tooltip1).not.toBeVisible();
  });

  describe('portalContainer', () => {
    function InfoTooltip(props) {
      return (
        <TooltipTrigger delay={0}>
          <Button><span aria-hidden="true">✏️</span></Button>
          <Tooltip UNSTABLE_portalContainer={props.container} data-test="tooltip" {...props}>
            <OverlayArrow>
              <svg width={8} height={8}>
                <path d="M0 0,L4 4,L8 0" />
              </svg>
            </OverlayArrow>
            Edit
          </Tooltip>
        </TooltipTrigger>
      );
    }
    function App() {
      let [container, setContainer] = React.useState();
      return (
        <>
          <InfoTooltip container={container} />
          <div ref={setContainer} data-testid="custom-container" />
        </>
      );
    }
    it('should render the tooltip in the portal container', async () => {
      let {getByRole, getByTestId} = render(<App />);
      let button = getByRole('button');

      fireEvent.mouseMove(document.body);
      await user.hover(button);
      act(() => jest.runAllTimers());

      expect(getByRole('tooltip').closest('[data-testid="custom-container"]')).toBe(getByTestId('custom-container'));

      await user.unhover(button);
      act(() => jest.runAllTimers());
    });
  });

  it('should support custom Focusable trigger on hover', async () => {
    let {getByRole} = render(
      <TooltipTrigger>
        <Focusable>
          <span role="button">Trigger</span>
        </Focusable>
        <Tooltip>Test</Tooltip>
      </TooltipTrigger>
    );

    let button = getByRole('button');
    expect(button).toHaveAttribute('tabindex', '0');

    await user.tab();
    expect(document.activeElement).toBe(button);

    let tooltip = getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('should support custom Focusable trigger on focus', async () => {
    let {getByRole} = render(
      <TooltipTrigger>
        <Focusable>
          <span role="button">Trigger</span>
        </Focusable>
        <Tooltip>Test</Tooltip>
      </TooltipTrigger>
    );

    let button = getByRole('button');
    expect(button).toHaveAttribute('tabindex', '0');

    fireEvent.mouseMove(document.body);
    await user.hover(button);
    act(() => jest.runAllTimers());

    let tooltip = getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('should support custom Pressable trigger', async () => {
    let {getByRole} = render(
      <TooltipTrigger>
        <Pressable>
          <span role="button">Trigger</span>
        </Pressable>
        <Tooltip>Test</Tooltip>
      </TooltipTrigger>
    );

    let button = getByRole('button');

    fireEvent.mouseMove(document.body);
    await user.hover(button);
    act(() => jest.runAllTimers());

    let tooltip = getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
  });
});
