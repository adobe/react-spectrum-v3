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

import {classNames, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import {DOMRef} from '@react-types/shared';
import {GridCollection, useGridState} from '@react-stately/grid';
import {GridKeyboardDelegate, useGrid} from '@react-aria/grid';
import {mergeProps} from '@react-aria/utils';
import React, {ReactElement, useMemo} from 'react';
import {SpectrumTagGroupProps} from '@react-types/tag';
import styles from '@adobe/spectrum-css-temp/components/tags/vars.css';
import {Tag} from './Tag';
import {useListState} from '@react-stately/list';
import {useLocale} from '@react-aria/i18n';
import {useProviderProps} from '@react-spectrum/provider';
import {useTagGroup} from '@react-aria/tag';


function TagGroup<T extends object>(props: SpectrumTagGroupProps<T>, ref: DOMRef<HTMLDivElement>) {
  props = useProviderProps(props);
  let {
    isDisabled,
    isRemovable,
    onRemove,
    ...otherProps
  } = props;

  let domRef = useDOMRef(ref);
  let {styleProps} = useStyleProps(otherProps);
  let {direction} = useLocale();
  const {tagGroupProps} = useTagGroup(props);
  let {collection} = useListState(props);
  let gridCollection = useMemo(() => new GridCollection({
    columnCount: isRemovable ? 2 : 1,
    items: [...collection].map(item => {
      let childNodes = [{
        ...item,
        index: 0,
        type: 'cell'
      }];

      // add column of clear buttons if removable
      if (isRemovable) {
        childNodes.push({
          key: `remove-${item.key}`,
          type: 'cell',
          index: 1,
          value: null,
          level: 0,
          rendered: null,
          textValue: item.textValue, // TODO localize?
          hasChildNodes: false,
          childNodes: []
        });
      }
      return {
        type: 'item',
        childNodes
      };
    })
  }), []);
  let state = useGridState({
    ...props,
    collection: gridCollection,
    focusMode: 'cell'
  });
  let keyboardDelegate = new GridKeyboardDelegate({
    collection: state.collection,
    disabledKeys: state.disabledKeys,
    ref: domRef,
    direction,
    focusMode: 'cell',
    cycleMode: 'between'
  });
  let {gridProps} = useGrid({
    ...props,
    isVirtualized: true,
    keyboardDelegate,
    ref: domRef
  }, state);

  return (
    <div
      className={
        classNames(
          styles,
          'spectrum-Tags',
          {
            'is-disabled': isDisabled
          },
          styleProps.className
        )
      }
      {...mergeProps(styleProps, tagGroupProps, gridProps)}
      ref={domRef}>
      {[...gridCollection].map(item => (
        <Tag
          item={item}
          state={state}
          isDisabled={isDisabled}
          isRemovable={isRemovable}
          onRemove={onRemove}>
          {item.childNodes[0].rendered}
        </Tag>
      ))}
    </div>
  );
}

const _TagGroup = React.forwardRef(TagGroup) as <T>(props: SpectrumTagGroupProps<T> & {ref?: DOMRef<HTMLDivElement>}) => ReactElement;
export {_TagGroup as TagGroup};
