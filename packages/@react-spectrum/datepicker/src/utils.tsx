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
import {createDOMRef} from '@react-spectrum/utils';
import {createFocusManager} from '@react-aria/focus';
import {DateFormatter, useDateFormatter, useLocale} from '@react-aria/i18n';
import {FocusableRef} from '@react-types/shared';
import {FormatterOptions} from '@react-stately/datepicker';
import React, {ReactNode, useImperativeHandle, useMemo, useRef, useState} from 'react';
import {SpectrumDatePickerBase} from '@react-types/datepicker';
import {useDisplayNames} from '@react-aria/datepicker';
import {useLayoutEffect} from '@react-aria/utils';
import {useProvider} from '@react-spectrum/provider';

export function useFormatHelpText(props: Pick<SpectrumDatePickerBase<any>, 'description' | 'showFormatHelpText'>): ReactNode {
  let formatter = useDateFormatter({dateStyle: 'short'});
  let displayNames = useDisplayNames();
  return useMemo(() => {
    if (props.description) {
      return props.description;
    }

    if (props.showFormatHelpText) {
      return (
        formatter.formatToParts(new Date()).map((s, i) => {
          if (s.type === 'literal') {
            return <span key={i}>{` ${s.value} `}</span>;
          }

          return <span key={i} style={{unicodeBidi: 'embed', direction: 'ltr'}}>{displayNames.of(s.type)}</span>;
        })
      );
    }

    return '';
  }, [props.description, props.showFormatHelpText, formatter, displayNames]);
}

export function useVisibleMonths(maxVisibleMonths: number): number {
  let {scale} = useProvider()!;
  let [visibleMonths, setVisibleMonths] = useState(getVisibleMonths(scale));
  useLayoutEffect(() => {
    let onResize = () => setVisibleMonths(getVisibleMonths(scale));
    onResize();

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [scale]);

  return Math.max(1, Math.min(visibleMonths, maxVisibleMonths, 3));
}

function getVisibleMonths(scale) {
  if (typeof window === 'undefined') {
    return 1;
  }
  let monthWidth = scale === 'large' ? 336 : 280;
  let gap = scale === 'large' ? 30 : 24;
  let popoverPadding = scale === 'large' ? 32 : 48;
  return Math.floor((window.innerWidth - popoverPadding * 2) / (monthWidth + gap));
}

export function useFocusManagerRef(ref: FocusableRef<HTMLElement>): React.RefObject<HTMLElement | null> {
  let domRef = useRef<HTMLElement | null>(null);
  useImperativeHandle(ref, () => ({
    ...createDOMRef(domRef),
    focus() {
      createFocusManager(domRef).focusFirst({tabbable: true});
    }
  }));
  return domRef;
}

export function useFormattedDateWidth(state: {getDateFormatter: (locale: string, formatOptions: FormatterOptions) => DateFormatter}): number {
  let locale = useLocale()?.locale;
  let currentDate = new Date();
  let formatedDate = state.getDateFormatter(locale, {shouldForceLeadingZeros: true}).format(currentDate);
  let totalCharacters =  formatedDate.length;

  // The max of two is for times with only hours.
  // As the length of a date grows we need to proportionally increase the width.
  // We use the character count with 'ch' units and add extra padding to accomate for
  // dates with months and time dashes, which are wider characters.
  return (totalCharacters + Math.max(Math.floor(totalCharacters / 5), 2));
}
