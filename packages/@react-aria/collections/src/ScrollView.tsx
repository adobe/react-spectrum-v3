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

// @ts-ignore - todo it's after midnight, figure out later, it's just a warning
import {flushSync} from 'react-dom';
import React, {CSSProperties, HTMLAttributes, ReactNode, RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Rect, Size} from '@react-stately/collections';

interface ScrollViewProps extends HTMLAttributes<HTMLElement> {
  contentSize: Size,
  visibleRect: Rect,
  onVisibleRectChange: (rect: Rect) => void,
  children: ReactNode,
  innerStyle: CSSProperties,
  sizeToFit: 'width' | 'height',
  onScrollStart?: () => void,
  onScrollEnd?: () => void,
  scrollDirection?: 'horizontal' | 'vertical' | 'both'
}

function ScrollView(props: ScrollViewProps, ref: RefObject<HTMLDivElement>) {
  let {
    contentSize,
    visibleRect,
    onVisibleRectChange,
    children,
    innerStyle,
    sizeToFit,
    onScrollStart,
    onScrollEnd,
    scrollDirection = 'both',
    ...otherProps
  } = props;

  let defaultRef = useRef();
  ref = ref || defaultRef;
  let state = useRef({
    scrollTop: 0,
    scrollLeft: 0,
    scrollEndTime: 0,
    scrollTimeout: null,
    width: 0,
    height: 0
  }).current;

  let [isScrolling, setScrolling] = useState(false);
  let onScroll = useCallback((e) => {
    flushSync(() => {
      let {scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth} = e.currentTarget;

      // Prevent rubber band scrolling from shaking when scrolling out of bounds
      state.scrollTop = Math.max(0, Math.min(scrollTop, scrollHeight - clientHeight));
      state.scrollLeft = Math.max(0, Math.min(scrollLeft, scrollWidth - clientWidth));

      onVisibleRectChange(new Rect(state.scrollLeft, state.scrollTop, state.width, state.height));

      if (!isScrolling) {
        setScrolling(true);

        if (onScrollStart) {
          onScrollStart();
        }
      }

      // So we don't constantly call clearTimeout and setTimeout,
      // keep track of the current timeout time and only reschedule
      // the timer when it is getting close.
      let now = Date.now();
      if (state.scrollEndTime <= now + 50) {
        state.scrollEndTime = now + 300;

        clearTimeout(state.scrollTimeout);
        state.scrollTimeout = setTimeout(() => {
          setScrolling(false);
          state.scrollTimeout = null;

          if (onScrollEnd) {
            onScrollEnd();
          }
        }, 300);
      }
    });
  }, [isScrolling, onScrollEnd, onScrollStart, onVisibleRectChange, state.height, state.scrollEndTime, state.scrollLeft, state.scrollTimeout, state.scrollTop, state.width]);

  useEffect(() => {
    // TODO: resize observer
    // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
    let updateSize = () => {
      let dom = ref.current;
      if (!dom) {
        return;
      }

      let w = dom.clientWidth;
      let h = dom.clientHeight;
      if (sizeToFit && contentSize.width > 0 && contentSize.height > 0) {
        let style = window.getComputedStyle(dom);

        if (sizeToFit === 'width') {
          w = contentSize.width;

          let maxWidth = parseInt(style.maxWidth, 10);
          if (!isNaN(maxWidth)) {
            w = Math.min(maxWidth, w);
          }
        } else if (sizeToFit === 'height') {
          h = contentSize.height;

          let maxHeight = parseInt(style.maxHeight, 10);
          if (!isNaN(maxHeight)) {
            h = Math.min(maxHeight, h);
          }
        }
      }

      if (state.width !== w || state.height !== h) {
        state.width = w;
        state.height = h;
        onVisibleRectChange(new Rect(state.scrollLeft, state.scrollTop, w, h));
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize, false);
    return () => {
      window.removeEventListener('resize', updateSize, false);
    };
  }, [onVisibleRectChange, ref, state.height, state.scrollLeft, state.scrollTop, state.width, sizeToFit, contentSize.width, contentSize.height]);

  useLayoutEffect(() => {
    let dom = ref.current;
    if (!dom) {
      return;
    }

    if (visibleRect.x !== state.scrollLeft) {
      state.scrollLeft = visibleRect.x;
      dom.scrollLeft = visibleRect.x;
    }

    if (visibleRect.y !== state.scrollTop) {
      state.scrollTop = visibleRect.y;
      dom.scrollTop = visibleRect.y;
    }
  }, [ref, state.scrollLeft, state.scrollTop, visibleRect.x, visibleRect.y]);

  let style: React.CSSProperties = {
    ...otherProps.style,
    position: 'relative',
    // Reset padding so that relative positioning works correctly. Padding will be done in JS layout.
    padding: 0
  };

  if (scrollDirection === 'horizontal') {
    style.overflowX = 'auto';
    style.overflowY = 'hidden';
  } else if (scrollDirection === 'vertical') {
    style.overflowY = 'auto';
    style.overflowX = 'hidden';
  } else {
    style.overflow = 'auto';
  }

  return (
    <div {...otherProps} style={style} ref={ref} onScroll={onScroll}>
      <div role="presentation" style={{width: contentSize.width, height: contentSize.height, pointerEvents: isScrolling ? 'none' : 'auto', ...innerStyle}}>
        {children}
      </div>
    </div>
  );
}

const ScrollViewForwardRef = React.forwardRef(ScrollView);
export {ScrollViewForwardRef as ScrollView};
