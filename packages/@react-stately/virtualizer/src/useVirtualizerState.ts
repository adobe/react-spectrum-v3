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

import {Collection} from '@react-types/shared';
import {Key, useCallback, useEffect, useMemo, useState} from 'react';
import {Layout} from './Layout';
import {Rect} from './Rect';
import {ReusableView} from './ReusableView';
import {Size} from './Size';
import {useLayoutEffect} from '@react-aria/utils';
import {Virtualizer} from './Virtualizer';

interface VirtualizerProps<T extends object, V, W> {
  renderView(type: string, content: T): V,
  renderWrapper(
    parent: ReusableView<T, V> | null,
    reusableView: ReusableView<T, V>,
    children: ReusableView<T, V>[],
    renderChildren: (views: ReusableView<T, V>[]) => W[]
  ): W,
  layout: Layout<T>,
  collection: Collection<T>,
  onVisibleRectChange(rect: Rect): void,
  getScrollAnchor?(rect: Rect): Key,
  transitionDuration?: number
}

export interface VirtualizerState<T extends object, V, W> {
  visibleViews: W[],
  setVisibleRect: (rect: Rect) => void,
  contentSize: Size,
  isAnimating: boolean,
  virtualizer: Virtualizer<T, V, W>,
  isScrolling: boolean,
  startScrolling: () => void,
  endScrolling: () => void
}

export function useVirtualizerState<T extends object, V, W>(opts: VirtualizerProps<T, V, W>): VirtualizerState<T, V, W> {
  let [visibleViews, setVisibleViews] = useState<W[]>([]);
  let [contentSize, setContentSize] = useState(new Size());
  let [isAnimating, setAnimating] = useState(false);
  let [isScrolling, setScrolling] = useState(false);
  let virtualizer = useMemo(() => new Virtualizer<T, V, W>(), []);

  virtualizer.delegate = {
    setVisibleViews,
    setVisibleRect(rect) {
      virtualizer.visibleRect = rect;
      opts.onVisibleRectChange(rect);
    },
    setContentSize,
    renderView: opts.renderView,
    renderWrapper: opts.renderWrapper,
    beginAnimations: () => setAnimating(true),
    endAnimations: () => setAnimating(false),
    getScrollAnchor: opts.getScrollAnchor
  };

  virtualizer.layout = opts.layout;
  virtualizer.collection = opts.collection;
  virtualizer.transitionDuration = opts.transitionDuration;

  useLayoutEffect(() => {
    virtualizer.afterRender();
  });

  // eslint-disable-next-line arrow-body-style
  useEffect(() => {
    return () => virtualizer.willUnmount();
  // We only need to cleanup the raf on unmount hence the empty dep array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    virtualizer,
    visibleViews,
    setVisibleRect: useCallback((rect) => {
      virtualizer.visibleRect = rect;
    }, [virtualizer]),
    contentSize,
    isAnimating,
    isScrolling,
    startScrolling: useCallback(() => {
      virtualizer.startScrolling();
      setScrolling(true);
    }, [virtualizer]),
    endScrolling: useCallback(() => {
      virtualizer.endScrolling();
      setScrolling(false);
    }, [virtualizer])
  };
}
