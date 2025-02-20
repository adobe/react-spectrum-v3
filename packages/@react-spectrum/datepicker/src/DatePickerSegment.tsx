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

import {classNames} from '@react-spectrum/utils';
import {DateFieldState, DateSegment} from '@react-stately/datepicker';
import {DatePickerBase, DateValue} from '@react-types/datepicker';
import React, {ReactElement, useRef} from 'react';
import styles from './styles.css';
import {useDateSegment} from '@react-aria/datepicker';

interface DatePickerSegmentProps extends DatePickerBase<DateValue> {
  segment: DateSegment,
  state: DateFieldState
}

interface LiteralSegmentProps {
  segment: DateSegment
}

export function DatePickerSegment({segment, state, ...otherProps}: DatePickerSegmentProps): ReactElement {
  switch (segment.type) {
    // A separator, e.g. punctuation
    case 'literal':
      return <LiteralSegment segment={segment} />;

    // Editable segment
    default:
      return <EditableSegment segment={segment} state={state} {...otherProps} />;
  }
}

function LiteralSegment({segment}: LiteralSegmentProps) {
  return (
    <span
      aria-hidden="true"
      className={classNames(styles, 'react-spectrum-Datepicker-literal')}
      data-testid={segment.type === 'literal' ? undefined : segment.type}>
      {segment.text}
    </span>
  );
}

function EditableSegment({segment, state}: DatePickerSegmentProps) {
  let ref = useRef<HTMLDivElement | null>(null);
  let {segmentProps} = useDateSegment(segment, state, ref);

  return (
    <span
      {...segmentProps}
      ref={ref}
      className={classNames(styles, 'react-spectrum-DatePicker-cell', {
        'is-placeholder': segment.isPlaceholder,
        'is-read-only': !segment.isEditable
      })}
      style={segmentProps.style}
      data-testid={segment.type}>
      {segment.isPlaceholder ? <span aria-hidden="true" className={classNames(styles, 'react-spectrum-DatePicker-placeholder')}>{segment.placeholder}</span> : segment.text}
    </span>
  );
}
