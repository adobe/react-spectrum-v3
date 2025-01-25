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

import {ActionButton} from '@react-spectrum/button';
import {AriaTagGroupProps, useTagGroup} from '@react-aria/tag';
import {classNames, useDOMRef} from '@react-spectrum/utils';
import {Collection, DOMRef, Node, SpectrumLabelableProps, StyleProps, Validation} from '@react-types/shared';
import {Field} from '@react-spectrum/label';
import {FocusRing, FocusScope} from '@react-aria/focus';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {ListCollection, useListState} from '@react-stately/list';
import {ListKeyboardDelegate} from '@react-aria/selection';
import {Provider, useProvider, useProviderProps} from '@react-spectrum/provider';
import React, {JSX, ReactElement, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import styles from '@adobe/spectrum-css-temp/components/tags/vars.css';
import {Tag} from './Tag';
import {useFormProps} from '@react-spectrum/form';
import {useId, useLayoutEffect, useResizeObserver, useValueEffect} from '@react-aria/utils';
import {useLocale, useLocalizedStringFormatter} from '@react-aria/i18n';

const TAG_STYLES = {
  medium: {
    height: 24,
    margin: 4
  },
  large: {
    height: 30,
    margin: 5
  }
};

export interface SpectrumTagGroupProps<T> extends Omit<AriaTagGroupProps<T>, 'selectionMode' | 'disallowEmptySelection' | 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange' | 'selectionBehavior' | 'disabledKeys'>, StyleProps, Omit<SpectrumLabelableProps, 'isRequired' | 'necessityIndicator'>, Pick<Validation<any>, 'isInvalid' | 'validationState'> {
  /** The label to display on the action button.  */
  actionLabel?: string,
  /** Handler that is called when the action button is pressed. */
  onAction?: () => void,
  /** Sets what the TagGroup should render when there are no tags to display. */
  renderEmptyState?: () => JSX.Element,
  /** Limit the number of rows initially shown. This will render a button that allows the user to expand to show all tags. */
  maxRows?: number
}

/** Tags allow users to categorize content. They can represent keywords or people, and are grouped to describe an item or a search request. */
export const TagGroup = React.forwardRef(function TagGroup<T extends object>(props: SpectrumTagGroupProps<T>, ref: DOMRef<HTMLDivElement>) {
  props = useProviderProps(props);
  props = useFormProps(props);
  let {
    maxRows,
    children,
    actionLabel,
    onAction,
    labelPosition,
    renderEmptyState = () => stringFormatter.format('noTags')
  } = props;
  let domRef = useDOMRef(ref);
  let containerRef = useRef<HTMLDivElement>(null);
  let tagsRef = useRef<HTMLDivElement | null>(null);
  let {direction} = useLocale();
  let {scale} = useProvider();
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/tag');
  let [isCollapsed, setIsCollapsed] = useState(maxRows != null);
  let state = useListState(props);
  let [tagState, setTagState] = useValueEffect({visibleTagCount: state.collection.size, showCollapseButton: false});
  let keyboardDelegate = useMemo(() => {
    let collection = (isCollapsed
      ? new ListCollection([...state.collection].slice(0, tagState.visibleTagCount))
      : new ListCollection([...state.collection])) as Collection<Node<T>>;
    return new ListKeyboardDelegate({
      collection,
      ref: tagsRef,
      direction,
      orientation: 'horizontal'
    });
  }, [direction, isCollapsed, state.collection, tagState.visibleTagCount, tagsRef]) as ListKeyboardDelegate<T>;
  // Remove onAction from props so it doesn't make it into useGridList.
  delete props.onAction;
  let {gridProps, labelProps, descriptionProps, errorMessageProps} = useTagGroup({...props, keyboardDelegate}, state, tagsRef);
  let actionsId = useId();
  let actionsRef = useRef<HTMLDivElement>(null);

  let updateVisibleTagCount = useCallback(() => {
    if (maxRows && maxRows > 0) {
      let computeVisibleTagCount = () => {
        // Refs can be null at runtime.
        let currContainerRef: HTMLDivElement | null = containerRef.current;
        let currTagsRef: HTMLDivElement | null = tagsRef.current;
        let currActionsRef: HTMLDivElement | null = actionsRef.current;
        if (!currContainerRef || !currTagsRef || !currActionsRef || state.collection.size === 0) {
          return {
            visibleTagCount: 0,
            showCollapseButton: false
          };
        }

        // Count rows and show tags until we hit the maxRows.
        let tags = [...currTagsRef.children];
        let currY = -Infinity;
        let rowCount = 0;
        let index = 0;
        let tagWidths: number[] = [];
        for (let tag of tags) {
          let {width, y} = tag.getBoundingClientRect();

          if (y !== currY) {
            currY = y;
            rowCount++;
          }

          if (maxRows && rowCount > maxRows) {
            break;
          }
          tagWidths.push(width);
          index++;
        }

        // Remove tags until there is space for the collapse button and action button (if present) on the last row.
        let buttons = [...currActionsRef.children];
        if (maxRows && buttons.length > 0 && rowCount >= maxRows && currContainerRef.parentElement) {
          let buttonsWidth = buttons.reduce((acc, curr) => acc += curr.getBoundingClientRect().width, 0);
          buttonsWidth += TAG_STYLES[scale].margin * 2 * buttons.length;
          let end = direction === 'ltr' ? 'right' : 'left';
          let containerEnd = currContainerRef.parentElement.getBoundingClientRect()[end];
          let lastTagEnd = tags[index - 1]?.getBoundingClientRect()[end];
          lastTagEnd += TAG_STYLES[scale].margin;
          let availableWidth = containerEnd - lastTagEnd;

          while (availableWidth < buttonsWidth && index > 0) {
            availableWidth += tagWidths.pop()!;
            index--;
          }
        }

        return {
          visibleTagCount: Math.max(index, 1),
          showCollapseButton: index < state.collection.size
        };
      };

      setTagState(function *() {
        // Update to show all items.
        yield {visibleTagCount: state.collection.size, showCollapseButton: true};

        // Measure, and update to show the items until maxRows is reached.
        yield computeVisibleTagCount();
      });
    }
  }, [maxRows, setTagState, direction, scale, state.collection.size]);

  useResizeObserver({ref: containerRef, onResize: updateVisibleTagCount});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(updateVisibleTagCount, [children]);

  useEffect(() => {
    // Recalculate visible tags when fonts are loaded.
    document.fonts?.ready.then(() => updateVisibleTagCount());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let visibleTags = useMemo(() =>
    [...state.collection].slice(0, isCollapsed ? tagState.visibleTagCount : state.collection.size),
    [isCollapsed, state.collection, tagState.visibleTagCount]
  );

  let handlePressCollapse = () => {
    // Prevents button from losing focus if focusedKey got collapsed.
    state.selectionManager.setFocusedKey(null);
    setIsCollapsed(prevCollapsed => !prevCollapsed);
  };

  let showActions = tagState.showCollapseButton || (actionLabel && onAction);
  let isEmpty = state.collection.size === 0;

  let containerStyle = useMemo(() => {
    if (maxRows == null || !isCollapsed || isEmpty) {
      return undefined;
    }
    let maxHeight = (TAG_STYLES[scale].height + (TAG_STYLES[scale].margin * 2)) * maxRows;
    return {maxHeight, overflow: 'hidden'};
  }, [isCollapsed, maxRows, isEmpty, scale]);

  return (
    <FocusScope>
      <Field
        {...props}
        labelProps={labelProps}
        descriptionProps={descriptionProps}
        errorMessageProps={errorMessageProps}
        showErrorIcon
        ref={domRef}
        elementType="span"
        wrapperClassName={
          classNames(
            styles,
            'spectrum-Tags-fieldWrapper',
            {
              'spectrum-Tags-fieldWrapper--positionSide': labelPosition === 'side'
            }
          )
        }>
        <div
          ref={containerRef}
          style={containerStyle}
          className={
            classNames(
              styles,
              'spectrum-Tags-container',
              {
                'spectrum-Tags-container--empty': isEmpty
              }
            )
          }>
          <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
            <div
              ref={tagsRef}
              {...gridProps}
              className={classNames(styles, 'spectrum-Tags')}>
              {visibleTags.map(item => (
                <Tag
                  {...item.props}
                  key={item.key}
                  item={item}
                  state={state}>
                  {item.rendered}
                </Tag>
              ))}
              {isEmpty && (
                <div className={classNames(styles, 'spectrum-Tags-empty-state')}>
                  {renderEmptyState()}
                </div>
              )}
            </div>
          </FocusRing>
          {showActions && !isEmpty &&
            <Provider isDisabled={false}>
              <div
                role="group"
                ref={actionsRef}
                id={actionsId}
                aria-label={stringFormatter.format('actions')}
                aria-labelledby={`${gridProps.id} ${actionsId}`}
                className={classNames(styles, 'spectrum-Tags-actions')}>
                {tagState.showCollapseButton &&
                  <ActionButton
                    isQuiet
                    onPress={handlePressCollapse}
                    UNSAFE_className={classNames(styles, 'spectrum-Tags-actionButton')}>
                    {isCollapsed ?
                      stringFormatter.format('showAllButtonLabel', {tagCount: state.collection.size}) :
                      stringFormatter.format('hideButtonLabel')
                    }
                  </ActionButton>
                }
                {actionLabel && onAction &&
                  <ActionButton
                    isQuiet
                    onPress={() => onAction?.()}
                    UNSAFE_className={classNames(styles, 'spectrum-Tags-actionButton')}>
                    {actionLabel}
                  </ActionButton>
                }
              </div>
            </Provider>
          }
        </div>
      </Field>
    </FocusScope>
  );
}) as <T>(props: SpectrumTagGroupProps<T> & {ref?: DOMRef<HTMLDivElement>}) => ReactElement;
