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

import {AriaStepListProps, StepListState} from '@react-types/steplist';
import {Collection, Node} from '@react-types/shared';
import {Key, useMemo} from 'react';
import {useControlledState} from '@react-stately/utils';
import {useSingleSelectListState} from '@react-stately/list';

export function useStepListState<T extends object>(props: AriaStepListProps<T>): StepListState<T> {
  let selectState = useSingleSelectListState<T>(props);
  let [lastCompletedStep, setLastCompletedStep] = useControlledState<Key>(props.lastCompletedStep, props.defaultLastCompletedStep, props.onLastCompletedStepChange);
  const {setSelectedKey: realSetSelectedKey, selectedKey, collection} = selectState;
  const {prevKeyMap, indexMap} = useMemo(() => buildKeysMaps(collection), [collection]);
  const disabledKeys = useMemo(() => new Set(props.disabledKeys), [props.disabledKeys]);
  const selectedIdx = indexMap.get(selectedKey);
  if (selectedIdx > 0 && selectedIdx > (indexMap.get(lastCompletedStep) ?? -1) + 1) {
    setLastCompletedStep(prevKeyMap.get(selectedKey));
  }
  
  function isCompleted(step: Key) {
    if (step === undefined) {
      return false;
    }
    return indexMap.get(step) <= indexMap.get(lastCompletedStep);
  }

  function isNavigable(step: Key) {
    return !props.isDisabled && !disabledKeys.has(step) && !props.isReadOnly &&
    (isCompleted(step) || isCompleted(prevKeyMap.get(step)));
  }

  function setSelectedKey(key: Key) {
    const prevKey = prevKeyMap.get(key);
    if (prevKey && !isCompleted(prevKey)) {
      setLastCompletedStep(prevKey);  
    }
    realSetSelectedKey(key);
  }

  return {
    ...selectState,
    setSelectedKey,
    setLastCompletedStep,
    isCompleted,
    isNavigable
  };
}

function buildKeysMaps<T>(coll: Collection<Node<T>>): { indexMap: Map<Key, number>, prevKeyMap: Map<Key, Key> } {
  const indexMap = new Map<Key, number>();
  const prevKeyMap = new Map<Key, Key>();
  let i = 0;
  let prev: Node<T> = undefined;
  for (const item of coll) {
    indexMap.set(item.key, i);
    prevKeyMap.set(item.key, prev?.key);
    prev = item;
    i++;
  }
  return {
    indexMap,
    prevKeyMap
  };
}
