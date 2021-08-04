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

import ChevronLeftMedium from '@spectrum-icons/ui/ChevronLeftMedium';
import ChevronRightMedium from '@spectrum-icons/ui/ChevronRightMedium';
import {classNames, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import {DOMRef, Node} from '@react-types/shared';
import {filterDOMProps, mergeProps} from '@react-aria/utils';
import {FocusRing} from '@react-aria/focus';
import React, {useRef} from 'react';
import {SpectrumAccordionProps} from '@react-types/accordion';
import styles from '@spectrum-css/accordion';
import {TreeState, useTreeState} from '@react-stately/tree';
import {useAccordion, useAccordionItem} from '@react-aria/accordion';
import {useHover} from '@react-aria/interactions';
import {useLocale} from '@react-aria/i18n';
import {useProviderProps} from '@react-spectrum/provider';

function Accordion<T extends object>(props: SpectrumAccordionProps<T>, ref: DOMRef<HTMLDivElement>) {
  props = useProviderProps(props);
  let state = useTreeState<T>(props);
  let {styleProps} = useStyleProps(props);
  let domRef = useDOMRef(ref);
  let {accordionProps} = useAccordion(props, state, domRef);

  return (
    <div
      {...filterDOMProps(props)}
      {...accordionProps}
      {...styleProps}
      ref={domRef}
      className={classNames(styles, 'spectrum-Accordion', styleProps.className)}>
      {[...state.collection].map(item => (
        <AccordionItem<T> key={item.key} item={item} state={state} />
      ))}
    </div>
  );
}

interface AccordionItemProps<T> {
  item: Node<T>,
  state: TreeState<T>
}

function AccordionItem<T>(props: AccordionItemProps<T>) {
  props = useProviderProps(props);
  let ref = useRef<HTMLButtonElement>();
  let {state, item} = props;
  let {buttonProps, regionProps} = useAccordionItem<T>(props, state, ref);
  let isOpen = state.expandedKeys.has(item.key);
  let isDisabled = state.disabledKeys.has(item.key);
  let {isHovered, hoverProps} = useHover({isDisabled});
  let {direction} = useLocale();

  return (
    <div
      className={classNames(styles, 'spectrum-Accordion-item', {
        'is-open': isOpen,
        'is-disabled': isDisabled
      })}>
      <h3 className={classNames(styles, 'spectrum-Accordion-itemHeading')}>
        <FocusRing within focusRingClass={classNames(styles, 'focus-ring')}>
          <button
            {...mergeProps(buttonProps, hoverProps)}
            ref={ref}
            className={classNames(styles, 'spectrum-Accordion-itemHeader', {
              'is-hovered': isHovered
            })}>
            {direction === 'ltr' ? (
              <ChevronRightMedium
                aria-hidden="true"
                UNSAFE_className={classNames(styles, 'spectrum-Accordion-itemIndicator')} />
              ) : (
                <ChevronLeftMedium
                  aria-hidden="true"
                  UNSAFE_className={classNames(styles, 'spectrum-Accordion-itemIndicator')} />
              )}
            {item.props.title}
          </button>
        </FocusRing>
      </h3>
      <div {...regionProps} className={classNames(styles, 'spectrum-Accordion-itemContent')}>
        {item.props.children}
      </div>
    </div>
  );
}

const _Accordion = React.forwardRef(Accordion);
export {_Accordion as Accordion};
