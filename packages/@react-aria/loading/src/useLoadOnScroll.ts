/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {RefObject, useCallback, useMemo, useRef} from 'react';
import {useLayoutEffect} from '@react-aria/utils';

export interface LoadOnScrollProps {
  /** Whether data is currently being loaded. */
  isLoading?: boolean,
  /** Handler that is called when more items should be loaded, e.g. while scrolling near the bottom.  */
  onLoadMore?: () => void,
  // TODO: decide on default here
  /**
   * The amount of offset (in pixels) from the bottom of your scrollable region that should trigger load more.
   * @default 25
   */
  scrollOffset?: number
}

// TODO: discuss if it would be ok to just attach event to ref...
interface LoadOnScrollAria {
  /** Props for the scrollable region. */
  scrollViewProps: {
    onScroll: () => void
  }
}

export function useLoadOnScroll(props: LoadOnScrollProps, ref: RefObject<HTMLElement | null>): LoadOnScrollAria {
  let {isLoading, onLoadMore, scrollOffset = 25} = props;

  // Handle scrolling, and call onLoadMore when nearing the bottom.
  let isLoadingRef = useRef(isLoading);
  let prevProps = useRef(props);
  let onScroll = useCallback(() => {
    if (ref.current && !isLoadingRef.current && onLoadMore) {
      let shouldLoadMore = ref.current.scrollHeight - ref.current.scrollTop - ref.current.clientHeight < scrollOffset;

      if (shouldLoadMore) {
        isLoadingRef.current = true;
        onLoadMore();
      }

    }
  }, [onLoadMore, ref, scrollOffset]);

  let lastContentSize = useRef(0);
  useLayoutEffect(() => {
    // Only update isLoadingRef if props object actually changed,
    // not if a local state change occurred.
    let wasLoading = isLoadingRef.current;
    if (props !== prevProps.current) {
      isLoadingRef.current = isLoading;
      prevProps.current = props;
    }

    // TODO: this actually calls loadmore twice in succession on intial load because after the first load
    // the scrollable element hasn't yet recieved its new height with the newly loaded items... Because of RAC collection needing two renders?
    let shouldLoadMore = ref?.current
      && !isLoadingRef.current
      && onLoadMore
      && ref.current.clientHeight === ref.current.scrollHeight
      // Only try loading more if the content size changed, or if we just finished
      // loading and still have room for more items.
      && (wasLoading || ref.current.scrollHeight !== lastContentSize.current);

    if (shouldLoadMore) {
      isLoadingRef.current = true;
      onLoadMore?.();
    }
    lastContentSize.current = ref.current?.scrollHeight || 0;
  }, [isLoading, onLoadMore, props, ref]);


  return useMemo(() => ({
    scrollViewProps: {
      onScroll
    }
  }), [onScroll]);
}