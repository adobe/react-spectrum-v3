/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaCardProps, SpectrumCardProps} from '@react-types/card';
import {Checkbox} from '@react-spectrum/checkbox';
import {classNames, SlotProvider, useDOMRef, useHasChild, useStyleProps} from '@react-spectrum/utils';
import {DOMRef, Node} from '@react-types/shared';
import {filterDOMProps, mergeProps, useLayoutEffect, useResizeObserver, useSlotId} from '@react-aria/utils';
import {FocusRing, getFocusableTreeWalker} from '@react-aria/focus';
import React, {HTMLAttributes, useCallback, useMemo, useRef, useState} from 'react';
import styles from '@adobe/spectrum-css-temp/components/card/vars.css';
import {useCardViewContext} from './CardViewContext';
import {useFocusWithin, useHover} from '@react-aria/interactions';
import {useProviderProps} from '@react-spectrum/provider';

interface CardBaseProps<T> extends SpectrumCardProps {
  articleProps?: HTMLAttributes<HTMLElement>,
  item?: Node<T>
}

function CardBase<T extends object>(props: CardBaseProps<T>, ref: DOMRef<HTMLDivElement>) {
  props = useProviderProps(props);
  let context = useCardViewContext() || {}; // we can call again here, won't change from Card.tsx
  let {state} = context;
  let manager = state?.selectionManager;
  let {
    isQuiet,
    orientation = 'vertical',
    articleProps = {},
    item,
    layout,
    children
  } = props;

  let key = item?.key;
  let isSelected = manager?.isSelected(key);
  let isDisabled = state?.disabledKeys.has(key);
  let onChange = () => manager?.select(key);

  let {styleProps} = useStyleProps(props);
  let {cardProps, titleProps, contentProps} = useCard(props);
  let domRef = useDOMRef(ref);
  let gridRef = useRef<HTMLDivElement>();
  let checkboxRef = useRef(null);

  // cards are only interactive if there is a selection manager and it allows selection
  let {hoverProps, isHovered} = useHover({isDisabled: manager === undefined || manager?.selectionMode === 'none' || isDisabled});
  let [isFocused, setIsFocused] = useState(false);
  let {focusWithinProps} = useFocusWithin({
    onFocusWithinChange: setIsFocused,
    isDisabled
  });

  // ToDo: see css for comment about avatar under selector .spectrum-Card--noLayout.spectrum-Card--default
  let hasPreviewImage = useHasChild(`.${styles['spectrum-Card-image']}`, gridRef);
  let hasPreviewIllustration = useHasChild(`.${styles['spectrum-Card-illustration']}`, gridRef);
  let hasPreview = hasPreviewImage || hasPreviewIllustration;

  // this is for horizontal cards
  let [height, setHeight] = useState(NaN);
  let updateHeight = useCallback(() => {
    if (orientation !== 'horizontal') {
      return;
    }

    let cardHeight = gridRef.current.getBoundingClientRect().height;
    setHeight(cardHeight);
  }, [orientation, gridRef, setHeight]);
  useResizeObserver({ref: gridRef, onResize: updateHeight});

  let aspectRatioEnforce = undefined;
  if (orientation === 'horizontal' && !isNaN(height)) {
    aspectRatioEnforce = {
      height: `${height}px`,
      width: `${height}px`
    };
  }

  let slots = useMemo(() => ({
    image: {UNSAFE_className: classNames(styles, 'spectrum-Card-image'), objectFit: orientation === 'horizontal' ? 'cover' : 'contain', alt: '', ...aspectRatioEnforce},
    illustration: {UNSAFE_className: classNames(styles, 'spectrum-Card-illustration'), ...aspectRatioEnforce},
    avatar: {UNSAFE_className: classNames(styles, 'spectrum-Card-avatar'), size: 'avatar-size-400'},
    heading: {UNSAFE_className: classNames(styles, 'spectrum-Card-heading'), ...titleProps},
    content: {UNSAFE_className: classNames(styles, 'spectrum-Card-content'), ...contentProps},
    detail: {UNSAFE_className: classNames(styles, 'spectrum-Card-detail')}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [titleProps, contentProps, height, isQuiet, orientation]);

  useLayoutEffect(() => {
    if (gridRef?.current) {
      let walker = getFocusableTreeWalker(gridRef.current);
      let nextNode = walker.nextNode();
      while (nextNode != null) {
        if (checkboxRef.current && !checkboxRef.current.UNSAFE_getDOMNode().contains(nextNode)) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Card does not support focusable elements, please contact the team regarding your use case.');
          }
          break;
        }
        nextNode = walker.nextNode();
      }
    }
  }, [children]);

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <article
        {...styleProps}
        {...mergeProps(cardProps, focusWithinProps, hoverProps, filterDOMProps(props), articleProps)}
        ref={domRef}
        className={classNames(styles, 'spectrum-Card', {
          'spectrum-Card--default': !isQuiet && orientation !== 'horizontal',
          'spectrum-Card--isQuiet': isQuiet && orientation !== 'horizontal',
          'spectrum-Card--horizontal': orientation === 'horizontal',
          'spectrum-Card--noPreview': !hasPreview,
          'is-hovered': isHovered,
          'is-focused': isFocused,
          'is-selected': isSelected,
          'spectrum-Card--waterfall': layout === 'waterfall',
          'spectrum-Card--gallery': layout === 'gallery',
          'spectrum-Card--grid': layout === 'grid',
          'spectrum-Card--noLayout': layout !== 'waterfall' && layout !== 'gallery' && layout !== 'grid'
        }, styleProps.className)}>
        <div ref={gridRef} className={classNames(styles, 'spectrum-Card-grid')}>
          {manager && manager.selectionMode !== 'none' && (
            <div className={classNames(styles, 'spectrum-Card-checkboxWrapper')}>
              <Checkbox
                ref={checkboxRef}
                isDisabled={isDisabled}
                excludeFromTabOrder
                isSelected={isSelected}
                onChange={onChange}
                UNSAFE_className={classNames(styles, 'spectrum-Card-checkbox')}
                isEmphasized
                aria-label="select" />
            </div>
          )}
          <SlotProvider slots={slots}>
            {children}
          </SlotProvider>
          <div className={classNames(styles, 'spectrum-Card-decoration')} />
        </div>
      </article>
    </FocusRing>
  );
}

interface AriaCardOptions extends AriaCardProps {
}

interface CardAria {
  cardProps: HTMLAttributes<HTMLDivElement>,
  titleProps: HTMLAttributes<HTMLDivElement>,
  contentProps: HTMLAttributes<HTMLDivElement>
}

function useCard(props: AriaCardOptions): CardAria {
  let titleId = useSlotId();
  let descriptionId = useSlotId();
  let titleProps = useMemo(() => ({
    id: titleId
  }), [titleId]);
  let contentProps = useMemo(() => ({
    id: descriptionId
  }), [descriptionId]);

  return {
    cardProps: {
      ...filterDOMProps(props),
      'aria-labelledby': titleId,
      'aria-describedby': descriptionId,
      tabIndex: 0
    },
    titleProps,
    contentProps
  };
}

/**
 * TODO: Add description of component here.
 */
const _CardBase = React.forwardRef(CardBase);
export {_CardBase as CardBase};
