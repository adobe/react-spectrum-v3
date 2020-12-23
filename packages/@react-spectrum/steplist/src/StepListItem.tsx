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

 /* eslint-disable jsx-a11y/anchor-is-valid */

import ChevronRightMedium from '@spectrum-icons/ui/ChevronRightMedium';
import {classNames} from '@react-spectrum/utils';
import {FocusRing} from '@react-aria/focus';
import {mergeProps} from '@react-aria/utils';
import React from 'react';
import {StepListItemProps} from '@react-types/steplist';
import styles from '@adobe/spectrum-css-temp/components/steplist/vars.css';
import {useHover} from '@react-aria/interactions';
import {useStepListItem} from '@react-aria/steplist';
import {VisuallyHidden} from '@react-aria/visually-hidden';
// import {useLocale} from '@react-aria/i18n';

export function StepListItem<T>(props: StepListItemProps<T>) {
  let {
    isDisabled,
    isEmphasized,
    item,
    state
  } = props;


  // let {direction} = useLocale();
  let {linkProps, stepStateProps, stepStateText} = useStepListItem({...props}, state);
  let {hoverProps, isHovered} = useHover(props);
  const itemKey = item.key;
  const isCompleted = state.isCompleted(itemKey);
  const isSelected = state.selectedKey === itemKey;  
  const isNavigable = state.isNavigable(itemKey);
  const isItemDisabled = state.disabledKeys.has(itemKey);
  return (
    <FocusRing within focusRingClass={classNames(styles, 'is-keyboard-focused')} focusClass={classNames(styles, 'is-focused')}>
      <li
        {...mergeProps(hoverProps)}
        className={classNames(
          styles,
          'spectrum-Steplist-item',
          {
            'is-selected': isSelected,
            'is-disabled': !isSelected && (isDisabled || isItemDisabled),
            'is-hovered': isHovered,
            'is-emphasized': isEmphasized && isSelected,
            'is-complete': isCompleted,
            'is-navigable': isNavigable
          }
        )}>
        <a className={classNames(styles, 'spectrum-Steplist-link')} {...linkProps}>
          <VisuallyHidden {...stepStateProps}>{stepStateText}</VisuallyHidden>
          <span className={classNames(styles, 'spectrum-Steplist-label')}>
            {item.rendered}
          </span>
          <span className={classNames(styles, 'spectrum-Steplist-marker-focus')}>
            <span className={classNames(styles, 'spectrum-Steplist-marker')}>{(item.index || 0) + 1}</span>
          </span>
        </a>
        <span className={classNames(styles, 'spectrum-Steplist-segment')} >
          <ChevronRightMedium UNSAFE_className={classNames(styles, 'spectrum-Steplist-chevron')} />
        </span>
      </li>
    </FocusRing>
  );
}
