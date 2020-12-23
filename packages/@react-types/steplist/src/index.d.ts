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

import {AriaLabelingProps, CollectionBase, Orientation, SingleSelection} from '@react-types/shared';
import {DOMProps, Node, StyleProps} from '@react-types/shared';
import {HTMLAttributes, Key} from 'react';
import {SingleSelectListState} from '@react-stately/list';

export interface SingleSelectListProps<T> extends CollectionBase<T>, SingleSelection {
  /** Filter function to generate a filtered list of nodes. */
  filter?: (nodes: Iterable<Node<T>>) => Iterable<Node<T>>
}

interface StepListProps<T> extends CollectionBase<T>, SingleSelection, SingleSelectListProps<T> {
  /** The key of the last completed step (controlled). */
  lastCompletedStep?: Key,
  /** The key of the initially last completed step (uncontrolled). */
  defaultLastCompletedStep?: Key,
  /** Callback for when the last completed step changes. */
  onLastCompletedStepChange?: (key: Key) => void,
  /** Whether the step list is disabled. Steps will not be focusable or interactive. */
  isDisabled?: boolean,
  /** Whether the step list is read only. Steps will be focusable but non-interactive. */
  isReadOnly?: boolean
}

interface AriaStepListProps<T> extends StepListProps<T>, AriaLabelingProps, DOMProps {}

interface SpectrumStepListProps<T> extends AriaStepListProps<T>, StyleProps {
  orientation?: Orientation,
  isEmphasized?: boolean,
  size: 'S' | 'M' | 'L' | 'XL'
}

interface StepListState<T> extends SingleSelectListState<T> {
  readonly lastCompletedStep?: Key,
  setLastCompletedStep(key: Key): void,
  isCompleted(key: Key): boolean,
  isNavigable(key: Key): boolean
}

interface StepListAria {
  listProps: HTMLAttributes<HTMLElement>
}

interface StepListItemProps<T> {
  isDisabled: boolean,
  isEmphasized: boolean,
  isReadOnly: boolean,
  state: StepListState<T>,
  item: Node<T>
}

interface StepListItemAria {
  /** Props for the step link element. */
  linkProps: HTMLAttributes<HTMLElement>,
  /** Props for the visually hidden element indicating the step state. */
  stepStateProps: HTMLAttributes<HTMLElement>,
  /** Text content for the visually hidden message indicating the status of the step state. */
  stepStateText: String
}
