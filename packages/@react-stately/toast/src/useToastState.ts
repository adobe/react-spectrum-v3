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

import {useCallback, useMemo} from 'react';
// Shim to support React 17 and below.
import {useSyncExternalStore} from 'use-sync-external-store/shim/index.js';

export interface ToastStateProps {
  /** The maximum number of toasts to display at a time. */
  maxVisibleToasts?: number,
  /** Function to wrap updates in (i.e. document.startViewTransition()). */
  wrapUpdate?: <R>(fn: () => R) => R
}

export interface ToastOptions {
  /** Handler that is called when the toast is closed, either by the user or after a timeout. */
  onClose?: () => void,
  /** A timeout to automatically close the toast after, in milliseconds. */
  timeout?: number,
  /** The priority of the toast relative to other toasts. Larger numbers indicate higher priority. */
  priority?: number
}

export interface QueuedToast<T> extends ToastOptions {
  /** The content of the toast. */
  content: T,
  /** A unique key for the toast. */
  key: string,
  /** A timer for the toast, if a timeout was set. */
  timer?: Timer
}

export interface ToastState<T> {
  /** Adds a new toast to the queue. */
  add(content: T, options?: ToastOptions): string,
  /**
   * Closes a toast.
   */
  close(key: string): void,
  /** Pauses the timers for all visible toasts. */
  pauseAll(): void,
  /** Resumes the timers for all visible toasts. */
  resumeAll(): void,
  /** The visible toasts. */
  visibleToasts: QueuedToast<T>[]
}

/**
 * Provides state management for a toast queue. Toasts display brief, temporary notifications
 * of actions, errors, or other events in an application.
 */
export function useToastState<T>(props: ToastStateProps = {}): ToastState<T> {
  let {maxVisibleToasts = 1} = props;
  let queue = useMemo(() => new ToastQueue<T>({maxVisibleToasts}), [maxVisibleToasts]);
  return useToastQueue(queue);
}

/**
 * Subscribes to a provided toast queue and provides methods to update it.
 */
export function useToastQueue<T>(queue: ToastQueue<T>): ToastState<T> {
  let subscribe = useCallback(fn => queue.subscribe(fn), [queue]);
  let getSnapshot = useCallback(() => queue.visibleToasts, [queue]);
  let visibleToasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    visibleToasts,
    add: (content, options) => queue.add(content, options),
    close: key => queue.close(key),
    pauseAll: () => queue.pauseAll(),
    resumeAll: () => queue.resumeAll()
  };
}

/**
 * A ToastQueue is a priority queue of toasts.
 */
export class ToastQueue<T> {
  private queue: QueuedToast<T>[] = [];
  private subscriptions: Set<() => void> = new Set();
  private maxVisibleToasts: number;
  private wrapUpdate?: <R>(fn: () => R) => R;
  /** The currently visible toasts. */
  visibleToasts: QueuedToast<T>[] = [];

  constructor(options?: ToastStateProps) {
    this.maxVisibleToasts = options?.maxVisibleToasts ?? 1;
    this.wrapUpdate = options?.wrapUpdate;
  }

  private runWithWrapUpdate<R>(fn: () => R): R {
    if (this.wrapUpdate) {
      return this.wrapUpdate(fn);
    } else {
      return fn();
    }
  }

  /** Subscribes to updates to the visible toasts. */
  subscribe(fn: () => void): () => boolean {
    this.subscriptions.add(fn);
    return (): boolean => this.subscriptions.delete(fn);
  }

  /** Adds a new toast to the queue. */
  add(content: T, options: ToastOptions = {}): string {
    let toastKey = Math.random().toString(36);
    let toast: QueuedToast<T> = {
      ...options,
      content,
      key: toastKey,
      timer: options.timeout ? new Timer(() => this.close(toastKey), options.timeout) : undefined
    };

    let low = 0;
    let high = this.queue.length;
    while (low < high) {
      let mid = Math.floor((low + high) / 2);
      if ((toast.priority || 0) > (this.queue[mid].priority || 0)) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }

    this.queue.splice(low, 0, toast);

    this.updateVisibleToasts();
    return toastKey;
  }

  /**
   * Closes a toast.
   */
  close(key: string): void {
    let index = this.queue.findIndex(t => t.key === key);
    if (index >= 0) {
      this.queue[index].onClose?.();
      this.queue.splice(index, 1);
    }

    this.updateVisibleToasts();
  }

  private updateVisibleToasts() {
    this.visibleToasts = this.queue.slice(0, this.maxVisibleToasts);

    for (let fn of this.subscriptions) {
      this.runWithWrapUpdate(fn);
    }
  }

  /** Pauses the timers for all visible toasts. */
  pauseAll(): void {
    for (let toast of this.visibleToasts) {
      if (toast.timer) {
        toast.timer.pause();
      }
    }
  }

  /** Resumes the timers for all visible toasts. */
  resumeAll(): void {
    for (let toast of this.visibleToasts) {
      if (toast.timer) {
        toast.timer.resume();
      }
    }
  }
}

class Timer {
  private timerId;
  private startTime: number | null = null;
  private remaining: number;
  private callback: () => void;

  constructor(callback: () => void, delay: number) {
    this.remaining = delay;
    this.callback = callback;
  }

  reset(delay: number) {
    this.remaining = delay;
    this.resume();
  }

  pause() {
    if (this.timerId == null) {
      return;
    }

    clearTimeout(this.timerId);
    this.timerId = null;
    this.remaining -= Date.now() - this.startTime!;
  }

  resume() {
    if (this.remaining <= 0) {
      return;
    }

    this.startTime = Date.now();
    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.remaining = 0;
      this.callback();
    }, this.remaining);
  }
}
