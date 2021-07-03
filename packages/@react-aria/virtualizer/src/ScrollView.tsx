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

// @ts-ignore
import {flushSync} from 'react-dom';
import {getScrollLeft} from './utils';
import React, {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import {Rect, Size} from '@react-stately/virtualizer';
import {useLayoutEffect} from '@react-aria/utils';
import {useLocale} from '@react-aria/i18n';
import {useResizeObserver} from '@react-aria/utils';

interface ScrollViewProps extends HTMLAttributes<HTMLElement> {
  contentSize: Size,
  onVisibleRectChange: (rect: Rect) => void,
  children: ReactNode,
  innerStyle?: CSSProperties,
  sizeToFit?: 'width' | 'height',
  onScrollStart?: () => void,
  onScrollEnd?: () => void,
  scrollDirection?: 'horizontal' | 'vertical' | 'both'
}

function ScrollView(props: ScrollViewProps, ref: RefObject<HTMLDivElement>) {
  let {
    contentSize,
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
    height: 0,
    isScrolling: false
  }).current;
  let {direction} = useLocale();

  let [isScrolling, setScrolling] = useState(false);
  let onScroll = useCallback((e) => {
    if (e.target !== e.currentTarget) {
      return;
    }

    if (props.onScroll) {
      props.onScroll(e);
    }

    flushSync(() => {
      let scrollTop = e.currentTarget.scrollTop;
      let scrollLeft = getScrollLeft(e.currentTarget, direction);

      // Prevent rubber band scrolling from shaking when scrolling out of bounds
      state.scrollTop = Math.max(0, Math.min(scrollTop, contentSize.height - state.height));
      state.scrollLeft = Math.max(0, Math.min(scrollLeft, contentSize.width - state.width));

      onVisibleRectChange(new Rect(state.scrollLeft, state.scrollTop, state.width, state.height));

      if (!state.isScrolling) {
        state.isScrolling = true;
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
          state.isScrolling = false;
          setScrolling(false);
          state.scrollTimeout = null;

          if (onScrollEnd) {
            onScrollEnd();
          }
        }, 300);
      }
    });
  }, [props, direction, state, contentSize, onVisibleRectChange, onScrollStart, onScrollEnd]);

  // eslint-disable-next-line arrow-body-style
  useEffect(() => {
    return () => {
      clearTimeout(state.scrollTimeout);
    };
  // We only need to cleanup state.scrollTimeout on unmount here, don't want to constantly clearTimeout by including state.scrollTimeout in dep array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let updateSize = useCallback(() => {
    let dom = ref.current;
    if (!dom) {
      return;
    }

    let w = dom.clientWidth;
    let h = dom.clientHeight;
    if (sizeToFit && contentSize.width > 0 && contentSize.height > 0) {
      if (sizeToFit === 'width') {
        w = Math.min(w, contentSize.width);
      } else if (sizeToFit === 'height') {
        h = Math.min(h, contentSize.height);
      }
    }

    if (state.width !== w || state.height !== h) {
      state.width = w;
      state.height = h;
      onVisibleRectChange(new Rect(state.scrollLeft, state.scrollTop, w, h));
    }
  }, [onVisibleRectChange, ref, state, sizeToFit, contentSize]);

  useLayoutEffect(() => {
    updateSize();
  }, [updateSize]);
  useResizeObserver({ref, onResize: updateSize});

  let style: React.CSSProperties = {
    // Reset padding so that relative positioning works correctly. Padding will be done in JS layout.
    padding: 0,
    ...otherProps.style
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
      <div role="presentation" style={{width: contentSize.width, height: contentSize.height, pointerEvents: isScrolling ? 'none' : 'auto', position: 'relative', ...innerStyle}}>
        {children}
      </div>
    </div>
  );
}

const ScrollViewForwardRef = React.forwardRef(ScrollView);
export {ScrollViewForwardRef as ScrollView};
