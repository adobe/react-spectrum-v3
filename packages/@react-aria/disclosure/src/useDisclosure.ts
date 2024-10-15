/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaButtonProps} from '@react-types/button';
import {DisclosureGroupState, DisclosureState} from '@react-stately/disclosure';
import {HTMLAttributes, RefObject, useCallback, useEffect} from 'react';
import {Key} from '@react-types/shared';
import {useEvent, useId} from '@react-aria/utils';
import {useIsSSR} from '@react-aria/ssr';

export interface AriaDisclosureProps {
  /** Whether the disclosure is disabled. */
  isDisabled?: boolean,
  /** Handler that is called when the disclosure's expanded state changes. */
  onExpandedChange?: (isExpanded: boolean) => void,
  /** Whether the disclosure is expanded (controlled). */
  isExpanded?: boolean,
  /** Whether the disclosure is expanded by default (uncontrolled). */
  defaultExpanded?: boolean,
  /** Unique id for the disclosure. Useful if used in a disclosure group. */
  id?: Key
}

export interface DisclosureAria {
  /** Props for the disclosure button. */
  buttonProps: AriaButtonProps,
  /** Props for the disclosure panel. */
  panelProps: HTMLAttributes<HTMLElement>
}

/**
 * Provides the behavior and accessibility implementation for a disclosure component.
 * @param props - Props for the disclosure.
 * @param state - State for the disclosure, as returned by `useDisclosureState`.
 * @param ref - A ref for the disclosure content.
 */
export function useDisclosure(
  props: AriaDisclosureProps,
  state: DisclosureState,
  ref: RefObject<Element | null>,
  groupState?: DisclosureGroupState
): DisclosureAria {
  let {
    isDisabled,
    id
  } = props;
  let triggerId = useId();
  let contentId = useId();
  let isSSR = useIsSSR();
  let supportsBeforeMatch = !isSSR && 'onbeforematch' in document.body;

  let handleBeforeMatch = useCallback((e: Event) => {
    if (groupState && id !== null) {
      if (groupState.allowsMultipleExpanded) {
        groupState.toggleKey(id);
      } else {
        groupState.setExpandedKeys(new Set([id]));
      }
    } else {
      state.toggle();
    }
    requestAnimationFrame(() => {
      if (props.isExpanded) {
        (e.target as Element).removeAttribute('hidden');
      } else if (!props.isExpanded) {
        (e.target as Element).setAttribute('hidden', 'until-found');
      }
    });
  }, [groupState, id, props.isExpanded, state]);

  // @ts-ignore https://github.com/facebook/react/pull/24741
  useEvent(ref, 'beforematch', supportsBeforeMatch ? handleBeforeMatch : null);

  useEffect(() => {
    // Until React supports hidden="until-found": https://github.com/facebook/react/pull/24741
    if (supportsBeforeMatch && ref?.current && !isDisabled) {
      if (state.isExpanded) {
        ref.current.removeAttribute('hidden');
      } else {
        ref.current.setAttribute('hidden', 'until-found');
      }
    }
  }, [ref, props.isExpanded, state.isExpanded, supportsBeforeMatch, isDisabled]);

  return {
    buttonProps: {
      id: triggerId,
      'aria-expanded': state.isExpanded,
      'aria-controls': contentId,
      onPress: (e) => {
        if (!isDisabled && e.pointerType !== 'keyboard') {
          state.toggle();
        }
      },
      isDisabled,
      onKeyDown(e) {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          state.toggle();
        }
      }
    },
    panelProps: {
      id: contentId,
      // This can be overridden at the panel element level.
      role: 'group',
      'aria-labelledby': triggerId,
      hidden: (!supportsBeforeMatch) ? !state.isExpanded : true
    }
  };
}
