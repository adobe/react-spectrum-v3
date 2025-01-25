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

import {cloneElement, ReactElement, ReactNode, useMemo} from 'react';
import {getNodeKey} from './utils';
import {Key} from '@react-types/shared';

export interface CachedChildrenOptions<T> {
  /** Item objects in the collection. */
  items?: Iterable<T>,
  /** The contents of the collection. */
  children?: ReactNode | ((item: T) => ReactNode),
  /** Values that should invalidate the item cache when using dynamic collections. */
  dependencies?: any[],
  /** A scope to prepend to all child item ids to ensure they are unique. */
  idScope?: Key,
  /** Whether to add `id` and `value` props to all child items. */
  addIdAndValue?: boolean
}

/**
 * Maps over a list of items and renders React elements for them. Each rendered item is
 * cached based on object identity, and React keys are generated from the `key` or `id` property.
 */
export function useCachedChildren<T extends object>(props: CachedChildrenOptions<T>): ReactNode {
  let {children, items, idScope, addIdAndValue, dependencies = []} = props;

  // Invalidate the cache whenever the parent value changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  let cache = useMemo(() => new WeakMap(), dependencies);
  return useMemo(() => {
    if (items && typeof children === 'function') {
      let res: ReactElement[] = [];
      for (let item of items) {
        let rendered = cache.get(item);
        if (!rendered) {
          rendered = children(item);
          // @ts-ignore
          let key = rendered.props.id ?? item.key ?? item.id;
           
          if (key == null) {
            throw new Error('Could not determine key for item');
          }
           
          if (idScope) {
            key = getNodeKey(key, idScope);
          }
          // Note: only works if wrapped Item passes through id...
          rendered = cloneElement(
            rendered,
            addIdAndValue ? {key, id: key, value: item} : {key}
          );
          cache.set(item, rendered);
        }
        res.push(rendered);
      }
      return res;
    } else if (typeof children !== 'function') {
      return children;
    }
  }, [children, items, cache, idScope, addIdAndValue]);
}
