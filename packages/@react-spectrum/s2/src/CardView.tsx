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

import {
  GridList as AriaGridList,
  ContextValue,
  GridLayout,
  GridListItem,
  GridListProps,
  Virtualizer,
  WaterfallLayout
} from 'react-aria-components';
import {CardContext, InternalCardViewContext} from './Card';
import {createContext, forwardRef, ReactElement, useMemo, useRef, useState} from 'react';
import {DOMRef, DOMRefValue, forwardRefType, Key, LoadingState} from '@react-types/shared';
import {focusRing, style} from '../style' with {type: 'macro'};
import {getAllowedOverrides, StylesPropWithHeight, UnsafeStyles} from './style-utils' with {type: 'macro'};
import {ImageCoordinator} from './ImageCoordinator';
import {mergeStyles} from '../style/runtime';
import {Size} from '@react-stately/virtualizer';
import {useActionBarContainer} from './ActionBar';
import {useDOMRef} from '@react-spectrum/utils';
import {useEffectEvent, useLayoutEffect, useLoadMore, useResizeObserver} from '@react-aria/utils';
import {useSpectrumContextProps} from './useSpectrumContextProps';

export interface CardViewProps<T> extends Omit<GridListProps<T>, 'layout' | 'keyboardNavigationBehavior' | 'selectionBehavior' | 'className' | 'style'>, UnsafeStyles {
  /**
   * The layout of the cards.
   * @default 'grid'
   */
  layout?: 'grid' | 'waterfall',
  /**
   * The size of the cards.
   * @default 'M'
   */
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL',
  /**
   * The amount of space between the cards.
   * @default 'regular'
   */
  density?: 'compact' | 'regular' | 'spacious',
  /**
   * The visual style of the cards.
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'quiet',
  /**
   * How selection should be displayed.
   * @default 'checkbox'
   */
  selectionStyle?: 'checkbox' | 'highlight',
  /** The loading state of the CardView. */
  loadingState?: LoadingState,
  /** Handler that is called when more items should be loaded, e.g. while scrolling near the bottom. */
  onLoadMore?: () => void,
  /** Spectrum-defined styles, returned by the `style()` macro. */
  styles?: StylesPropWithHeight,
  /** Provides the ActionBar to render when cards are selected in the CardView. */
  renderActionBar?: (selectedKeys: 'all' | Set<Key>) => ReactElement
}

const layoutOptions = {
  XS: {
    compact: {
      minSpace: new Size(6, 6),
      minItemSize: new Size(100, 100),
      maxItemSize: new Size(140, 140)
    },
    regular: {
      minSpace: new Size(8, 8),
      minItemSize: new Size(100, 100),
      maxItemSize: new Size(140, 140)
    },
    spacious: {
      minSpace: new Size(12, 12),
      minItemSize: new Size(100, 100),
      maxItemSize: new Size(140, 140)
    }
  },
  S: {
    compact: {
      minSpace: new Size(8, 8),
      minItemSize: new Size(150, 150),
      maxItemSize: new Size(210, 210)
    },
    regular: {
      minSpace: new Size(12, 12),
      minItemSize: new Size(150, 150),
      maxItemSize: new Size(210, 210)
    },
    spacious: {
      minSpace: new Size(16, 16),
      minItemSize: new Size(150, 150),
      maxItemSize: new Size(210, 210)
    }
  },
  M: {
    compact: {
      minSpace: new Size(12, 12),
      minItemSize: new Size(200, 200),
      maxItemSize: new Size(280, 280)
    },
    regular: {
      minSpace: new Size(16, 16),
      minItemSize: new Size(200, 200),
      maxItemSize: new Size(280, 280)
    },
    spacious: {
      minSpace: new Size(20, 20),
      minItemSize: new Size(200, 200),
      maxItemSize: new Size(280, 280)
    }
  },
  L: {
    compact: {
      minSpace: new Size(16, 16),
      minItemSize: new Size(270, 270),
      maxItemSize: new Size(370, 370)
    },
    regular: {
      minSpace: new Size(20, 20),
      minItemSize: new Size(270, 270),
      maxItemSize: new Size(370, 370)
    },
    spacious: {
      minSpace: new Size(24, 24),
      minItemSize: new Size(270, 270),
      maxItemSize: new Size(370, 370)
    }
  },
  XL: {
    compact: {
      minSpace: new Size(20, 20),
      minItemSize: new Size(340, 340),
      maxItemSize: new Size(460, 460)
    },
    regular: {
      minSpace: new Size(24, 24),
      minItemSize: new Size(340, 340),
      maxItemSize: new Size(460, 460)
    },
    spacious: {
      minSpace: new Size(28, 28),
      minItemSize: new Size(340, 340),
      maxItemSize: new Size(460, 460)
    }
  }
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;

const cardViewStyles = style({
  overflowY: {
    default: 'auto',
    isLoading: 'hidden'
  },
  display: {
    isEmpty: 'flex'
  },
  boxSizing: 'border-box',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  ...focusRing(),
  outlineStyle: {
    default: 'none',
    isEmpty: {
      isFocusVisible: 'solid'
    }
  },
  outlineOffset: -2
}, getAllowedOverrides({height: true}));

export const CardViewContext = createContext<ContextValue<Partial<CardViewProps<any>>, DOMRefValue<HTMLDivElement>>>(null);

export const CardView = /*#__PURE__*/ (forwardRef as forwardRefType)(function CardView<T extends object>(props: CardViewProps<T>, ref: DOMRef<HTMLDivElement>) {
  [props, ref] = useSpectrumContextProps(props, ref, CardViewContext);
  let {children, layout: layoutName = 'grid', size: sizeProp = 'M', density = 'regular', variant = 'primary', selectionStyle = 'checkbox', UNSAFE_className = '', UNSAFE_style, styles, ...otherProps} = props;
  let domRef = useDOMRef(ref);
  let innerRef = useRef(null);
  let scrollRef = props.renderActionBar ? innerRef : domRef;

  // This calculates the maximum t-shirt size where at least two columns fit in the available width.
  let [maxSizeIndex, setMaxSizeIndex] = useState(SIZES.length - 1);
  let updateSize = useEffectEvent(() => {
    let w = scrollRef.current?.clientWidth ?? 0;
    let i = SIZES.length - 1;
    while (i > 0) {
      let opts = layoutOptions[SIZES[i]][density];
      if (w >= opts.minItemSize.width * 2 + opts.minSpace.width * 3) {
        break;
      }
      i--;
    }
    setMaxSizeIndex(i);
  });

  useResizeObserver({
    ref: scrollRef,
    box: 'border-box',
    onResize: updateSize
  });

  useLayoutEffect(() => {
    updateSize();
  }, [updateSize]);

  // The actual rendered t-shirt size is the minimum between the size prop and the maximum possible size.
  let size = SIZES[Math.min(maxSizeIndex, SIZES.indexOf(sizeProp))];
  let layout = layoutName === 'waterfall' ? WaterfallLayout : GridLayout;
  let options = layoutOptions[size][density];

  useLoadMore({
    isLoading: props.loadingState !== 'idle' && props.loadingState !== 'error',
    items: props.items, // TODO: ideally this would be the collection. items won't exist for static collections, or those using <Collection>
    onLoadMore: props.onLoadMore
  }, scrollRef);

  let ctx = useMemo(() => ({size, variant}), [size, variant]);

  let {selectedKeys, onSelectionChange, actionBar, actionBarHeight} = useActionBarContainer({...props, scrollRef});

  let cardView = (
    <Virtualizer layout={layout} layoutOptions={options}>
      <InternalCardViewContext.Provider value={GridListItem}>
        <CardContext.Provider value={ctx}>
          <ImageCoordinator>
            <AriaGridList
              ref={scrollRef}
              {...otherProps}
              layout="grid"
              selectionBehavior={selectionStyle === 'highlight' ? 'replace' : 'toggle'}
              selectedKeys={selectedKeys}
              defaultSelectedKeys={undefined}
              onSelectionChange={onSelectionChange}
              style={{
                ...(!props.renderActionBar ? UNSAFE_style : {}),
                // Add padding at the bottom when the action bar is visible so users can scroll to the last items.
                // Also add scroll padding so keyboard navigating preserves the padding.
                paddingBottom: actionBarHeight > 0 ? actionBarHeight + options.minSpace.height : 0,
                scrollPadding: options.minSpace.height,
                scrollPaddingBottom: actionBarHeight + options.minSpace.height
              }}
              className={renderProps => (!props.renderActionBar ? UNSAFE_className + cardViewStyles({...renderProps, isLoading: props.loadingState === 'loading'}, styles) : '')}>
              {children}
            </AriaGridList>
          </ImageCoordinator>
        </CardContext.Provider>
      </InternalCardViewContext.Provider>
    </Virtualizer>
  );

  // Add extra wrapper if there is an action bar so we can position relative to it.
  // ActionBar cannot be inside the GridList due to ARIA and focus management requirements.
  if (props.renderActionBar) {
    return (
      <div ref={domRef} className={UNSAFE_className + mergeStyles(style({position: 'relative', overflow: 'clip', size: 'fit'}), styles)} style={UNSAFE_style}>
        {cardView}
        {actionBar}
      </div>
    );
  }

  return cardView;
});
