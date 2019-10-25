import {useMemo, useState, Key, useLayoutEffect} from 'react';
import { CollectionManager } from './CollectionManager';
import { Rect } from './Rect';
import { Size } from './Size';
import { Layout } from './Layout';
import { Collection } from './types';
import { DOMProps } from '@react-types/shared';
import { ReusableView } from './ReusableView';

interface CollectionProps<T, V, W> extends DOMProps {
  renderView(type: string, content: T): V,
  renderWrapper(reusableView: ReusableView<T, V>): W,
  layout: Layout<T>,
  collection: Collection<T>,
  getScrollAnchor?(rect: Rect): Key
}

interface CollectionState<T, V, W> {
  visibleViews: Set<W>,
  visibleRect: Rect,
  setVisibleRect: (rect: Rect) => void,
  contentSize: Size,
  isAnimating: boolean,
  collectionManager: CollectionManager<T, V, W>
}

export function useCollectionState<T, V, W>(opts: CollectionProps<T, V, W>): CollectionState<T, V, W> {
  let [visibleViews, setVisibleViews] = useState(new Set<W>());
  let [visibleRect, setVisibleRect] = useState(new Rect());
  let [contentSize, setContentSize] = useState(new Size());
  let [isAnimating, setAnimating] = useState(false);
  let collectionManager = useMemo(() => new CollectionManager<T, V, W>(), []);

  collectionManager.delegate = {
    setVisibleViews,
    setVisibleRect,
    setContentSize,
    renderView: opts.renderView,
    renderWrapper: opts.renderWrapper,
    beginAnimations: () => setAnimating(true),
    endAnimations: () => setAnimating(false),
    getScrollAnchor: opts.getScrollAnchor
  };

  collectionManager.layout = opts.layout;
  collectionManager.collection = opts.collection;
  collectionManager.visibleRect = visibleRect;

  useLayoutEffect(() => {
    collectionManager.afterRender();
  });

  return {
    collectionManager,
    visibleViews,
    visibleRect,
    setVisibleRect,
    contentSize,
    isAnimating
  };
}
