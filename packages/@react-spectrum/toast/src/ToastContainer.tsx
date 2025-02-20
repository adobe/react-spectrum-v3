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

import {AriaToastRegionProps} from '@react-aria/toast';
import {classNames} from '@react-spectrum/utils';
import {DOMProps} from '@react-types/shared';
import {filterDOMProps} from '@react-aria/utils';
import {flushSync} from 'react-dom';
import React, {ReactElement, useEffect, useMemo, useRef} from 'react';
import {SpectrumToastValue, Toast} from './Toast';
import toastContainerStyles from './toastContainer.css';
import {Toaster} from './Toaster';
import {ToastOptions, ToastQueue, useToastQueue} from '@react-stately/toast';
import {useSyncExternalStore} from 'use-sync-external-store/shim/index.js';

export type ToastPlacement = 'top' | 'top end' | 'bottom' | 'bottom end';

export interface SpectrumToastContainerProps extends AriaToastRegionProps {
  placement?: ToastPlacement
}

export interface SpectrumToastOptions extends Omit<ToastOptions, 'priority'>, DOMProps {
  /** A label for the action button within the toast. */
  actionLabel?: string,
  /** Handler that is called when the action button is pressed. */
  onAction?: () => void,
  /** Whether the toast should automatically close when an action is performed. */
  shouldCloseOnAction?: boolean
}

type CloseFunction = () => void;

function wrapInViewTransition<R>(fn: () => R): R {
  if ('startViewTransition' in document) {
    let result: R;
    // @ts-expect-error
    document.startViewTransition(() => {
      flushSync(() => {
        result = fn();
      });
    }).ready.catch(() => {});
    // @ts-ignore
    return result;
  } else {
    return fn();
  }
}

// There is a single global toast queue instance for the whole app, initialized lazily.
let globalToastQueue: ToastQueue<SpectrumToastValue> | null = null;
function getGlobalToastQueue() {
  if (!globalToastQueue) {
    globalToastQueue = new ToastQueue({
      maxVisibleToasts: Infinity,
      wrapUpdate: wrapInViewTransition
    });
  }

  return globalToastQueue;
}

// For testing. Not exported from the package index.
export function clearToastQueue(): void {
  globalToastQueue = null;
}

let toastProviders = new Set();
let subscriptions = new Set<() => void>();
function subscribe(fn: () => void) {
  subscriptions.add(fn);
  return () => subscriptions.delete(fn);
}

function triggerSubscriptions() {
  for (let fn of subscriptions) {
    fn();
  }
}

function getActiveToastContainer() {
  return toastProviders.values().next().value;
}

function useActiveToastContainer() {
  return useSyncExternalStore(subscribe, getActiveToastContainer, getActiveToastContainer);
}

/**
 * A ToastContainer renders the queued toasts in an application. It should be placed
 * at the root of the app.
 */
export function ToastContainer(props: SpectrumToastContainerProps): ReactElement | null {
  // Track all toast provider instances in a set.
  // Only the first one will actually render.
  // We use a ref to do this, since it will have a stable identity
  // over the lifetime of the component.
  let ref = useRef(null);


  useEffect(() => {
    toastProviders.add(ref);
    triggerSubscriptions();

    return () => {
      // Remove this toast provider, and call subscriptions.
      // This will cause all other instances to re-render,
      // and the first one to become the new active toast provider.
      toastProviders.delete(ref);
      triggerSubscriptions();
    };
  }, []);

  // Only render if this is the active toast provider instance, and there are visible toasts.
  let activeToastContainer = useActiveToastContainer();
  let state = useToastQueue(getGlobalToastQueue());

  let {placement, isCentered} = useMemo(() => {
    let placements = (props.placement ?? 'bottom').split(' ');
    let placement = placements[placements.length - 1];
    let isCentered = placements.length === 1;
    return {placement, isCentered};
  }, [props.placement]);

  if (ref === activeToastContainer && state.visibleToasts.length > 0) {
    return (
      <Toaster state={state} {...props}>
        <ol className={classNames(toastContainerStyles, 'spectrum-ToastContainer-list')}>
          {state.visibleToasts.slice().reverse().map((toast, index) => {
            let shouldFade = isCentered && index !== 0;
            return (
              <li
                key={toast.key}
                className={classNames(toastContainerStyles, 'spectrum-ToastContainer-listitem')}
                style={{
                  // @ts-expect-error
                  viewTransitionName: `_${toast.key.slice(2)}`,
                  viewTransitionClass: classNames(
                    toastContainerStyles,
                    'toast',
                    placement,
                    {'fadeOnly': shouldFade}
                  )
                }}>
                <Toast
                  toast={toast}
                  state={state} />
              </li>
            );
          })}
        </ol>
      </Toaster>
    );
  }

  return null;
}

function addToast(children: string, variant: SpectrumToastValue['variant'], options: SpectrumToastOptions = {}) {
  // Dispatch a custom event so that toasts can be intercepted and re-targeted, e.g. when inside an iframe.
  if (typeof CustomEvent !== 'undefined' && typeof window !== 'undefined') {
    let event = new CustomEvent('react-spectrum-toast', {
      cancelable: true,
      bubbles: true,
      detail: {
        children,
        variant,
        options
      }
    });

    let shouldContinue = window.dispatchEvent(event);
    if (!shouldContinue) {
      return () => {};
    }
  }

  let value = {
    children,
    variant,
    actionLabel: options.actionLabel,
    onAction: options.onAction,
    shouldCloseOnAction: options.shouldCloseOnAction,
    ...filterDOMProps(options)
  };

  // Minimum time of 5s from https://spectrum.adobe.com/page/toast/#Auto-dismissible
  // Actionable toasts cannot be auto dismissed. That would fail WCAG SC 2.2.1.
  // It is debatable whether non-actionable toasts would also fail.
  let timeout = options.timeout && !options.onAction ? Math.max(options.timeout, 5000) : undefined;
  let queue = getGlobalToastQueue();
  let key = queue.add(value, {timeout, onClose: options.onClose});
  return () => queue.close(key);
}

const SpectrumToastQueue = {
  /** Queues a neutral toast. */
  neutral(children: string, options: SpectrumToastOptions = {}): CloseFunction {
    return addToast(children, 'neutral', options);
  },
  /** Queues a positive toast. */
  positive(children: string, options: SpectrumToastOptions = {}): CloseFunction {
    return addToast(children, 'positive', options);
  },
  /** Queues a negative toast. */
  negative(children: string, options: SpectrumToastOptions = {}): CloseFunction {
    return addToast(children, 'negative', options);
  },
  /** Queues an informational toast. */
  info(children: string, options: SpectrumToastOptions = {}): CloseFunction {
    return addToast(children, 'info', options);
  }
};

export {SpectrumToastQueue as ToastQueue};
