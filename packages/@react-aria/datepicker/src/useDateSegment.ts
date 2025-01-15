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

import {CalendarDate, toCalendar} from '@internationalized/date';
import {DateFieldState, DateSegment} from '@react-stately/datepicker';
import {getScrollParent, isIOS, isMac, mergeProps, scrollIntoViewport, useEvent, useId, useLabels, useLayoutEffect} from '@react-aria/utils';
import {hookData} from './useDateField';
import {NumberParser} from '@internationalized/number';
import React, {CSSProperties, useMemo, useRef} from 'react';
import {RefObject} from '@react-types/shared';
import {useDateFormatter, useFilter, useLocale} from '@react-aria/i18n';
import {useDisplayNames} from './useDisplayNames';
import {useSpinButton} from '@react-aria/spinbutton';

export interface DateSegmentAria {
  /** Props for the segment element. */
  segmentProps: React.HTMLAttributes<HTMLDivElement>
}

/**
 * Provides the behavior and accessibility implementation for a segment in a date field.
 * A date segment displays an individual unit of a date and time, and allows users to edit
 * the value by typing or using the arrow keys to increment and decrement.
 */
export function useDateSegment(segment: DateSegment, state: DateFieldState, ref: RefObject<HTMLElement | null>): DateSegmentAria {
  let enteredKeys = useRef('');
  let {locale, direction} = useLocale();
  let displayNames = useDisplayNames();
  let {ariaLabel, ariaLabelledBy, ariaDescribedBy, focusManager} = hookData.get(state)!;

  let textValue = segment.isPlaceholder ? '' : segment.text;
  let options = useMemo(() => state.dateFormatter.resolvedOptions(), [state.dateFormatter]);
  let monthDateFormatter = useDateFormatter({month: 'long', timeZone: options.timeZone});
  let hourDateFormatter = useDateFormatter({
    hour: 'numeric',
    hour12: options.hour12,
    timeZone: options.timeZone
  });

  if (segment.type === 'month' && !segment.isPlaceholder) {
    let monthTextValue = monthDateFormatter.format(state.dateValue);
    textValue = monthTextValue !== textValue ? `${textValue} – ${monthTextValue}` : monthTextValue;
  } else if (segment.type === 'hour' && !segment.isPlaceholder) {
    textValue = hourDateFormatter.format(state.dateValue);
  }

  let {spinButtonProps} = useSpinButton({
    // The ARIA spec says aria-valuenow is optional if there's no value, but aXe seems to require it.
    // This doesn't seem to have any negative effects with real AT since we also use aria-valuetext.
    // https://github.com/dequelabs/axe-core/issues/3505
    value: segment.value,
    textValue,
    minValue: segment.minValue,
    maxValue: segment.maxValue,
    isDisabled: state.isDisabled,
    isReadOnly: state.isReadOnly || !segment.isEditable,
    isRequired: state.isRequired,
    onIncrement: () => {
      enteredKeys.current = '';
      state.increment(segment.type);
    },
    onDecrement: () => {
      enteredKeys.current = '';
      state.decrement(segment.type);
    },
    onIncrementPage: () => {
      enteredKeys.current = '';
      state.incrementPage(segment.type);
    },
    onDecrementPage: () => {
      enteredKeys.current = '';
      state.decrementPage(segment.type);
    },
    onIncrementToMax: () => {
      enteredKeys.current = '';
      if (segment.maxValue !== undefined) {
        state.setSegment(segment.type, segment.maxValue);
      }
    },
    onDecrementToMin: () => {
      enteredKeys.current = '';
      if (segment.minValue !== undefined) {
        state.setSegment(segment.type, segment.minValue);
      }
    }
  });

  let parser = useMemo(() => new NumberParser(locale, {maximumFractionDigits: 0}), [locale]);

  let backspace = () => {
    if (segment.text === segment.placeholder) {
      focusManager.focusPrevious();
    }
    if (parser.isValidPartialNumber(segment.text) && !state.isReadOnly && !segment.isPlaceholder) {
      let newValue = segment.text.slice(0, -1);
      let parsed = parser.parse(newValue);
      newValue = parsed === 0 ? '' : newValue;
      if (newValue.length === 0 || parsed === 0) {
        state.clearSegment(segment.type);
      } else {
        state.setSegment(segment.type, parsed);
      }
      enteredKeys.current = newValue;
    } else if (segment.type === 'dayPeriod') {
      state.clearSegment(segment.type);
    }
  };

  let onKeyDown = (e) => {
    // Firefox does not fire selectstart for Ctrl/Cmd + A
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1742153
    if (e.key === 'a' && (isMac() ? e.metaKey : e.ctrlKey)) {
      e.preventDefault();
    }

    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }

    switch (e.key) {
      case 'Backspace':
      case 'Delete': {
        // Safari on iOS does not fire beforeinput for the backspace key because the cursor is at the start.
        e.preventDefault();
        e.stopPropagation();
        backspace();
        break;
      }
    }
  };

  // Safari dayPeriod option doesn't work...
  let {startsWith} = useFilter({sensitivity: 'base'});
  let amPmFormatter = useDateFormatter({hour: 'numeric', hour12: true});
  let am = useMemo(() => {
    let date = new Date();
    date.setHours(0);
    return amPmFormatter.formatToParts(date).find(part => part.type === 'dayPeriod')!.value;
  }, [amPmFormatter]);

  let pm = useMemo(() => {
    let date = new Date();
    date.setHours(12);
    return amPmFormatter.formatToParts(date).find(part => part.type === 'dayPeriod')!.value;
  }, [amPmFormatter]);

  // Get a list of formatted era names so users can type the first character to choose one.
  let eraFormatter = useDateFormatter({year: 'numeric', era: 'narrow', timeZone: 'UTC'});
  let eras = useMemo(() => {
    if (segment.type !== 'era') {
      return [];
    }

    let date = toCalendar(new CalendarDate(1, 1, 1), state.calendar);
    let eras = state.calendar.getEras().map(era => {
      let eraDate = date.set({year: 1, month: 1, day: 1, era}).toDate('UTC');
      let parts = eraFormatter.formatToParts(eraDate);
      let formatted = parts.find(p => p.type === 'era')!.value;
      return {era, formatted};
    });

    // Remove the common prefix from formatted values. This is so that in calendars with eras like
    // ERA0 and ERA1 (e.g. Ethiopic), users can press "0" and "1" to select an era. In other cases,
    // the first letter is used.
    let prefixLength = commonPrefixLength(eras.map(era => era.formatted));
    if (prefixLength) {
      for (let era of eras) {
        era.formatted = era.formatted.slice(prefixLength);
      }
    }

    return eras;
  }, [eraFormatter, state.calendar, segment.type]);

  let onInput = (key: string) => {
    if (state.isDisabled || state.isReadOnly) {
      return;
    }

    let newValue = enteredKeys.current + key;

    switch (segment.type) {
      case 'dayPeriod':
        if (startsWith(am, key)) {
          state.setSegment('dayPeriod', 0);
        } else if (startsWith(pm, key)) {
          state.setSegment('dayPeriod', 12);
        } else {
          break;
        }
        focusManager.focusNext();
        break;
      case 'era': {
        let matched = eras.find(e => startsWith(e.formatted, key));
        if (matched) {
          state.setSegment('era', matched.era);
          focusManager.focusNext();
        }
        break;
      }
      case 'day':
      case 'hour':
      case 'minute':
      case 'second':
      case 'month':
      case 'year': {
        if (!parser.isValidPartialNumber(newValue)) {
          return;
        }

        let numberValue = parser.parse(newValue);
        let segmentValue = numberValue;
        let allowsZero = segment.minValue === 0;
        if (segment.type === 'hour' && state.dateFormatter.resolvedOptions().hour12) {
          switch (state.dateFormatter.resolvedOptions().hourCycle) {
            case 'h11':
              if (numberValue > 11) {
                segmentValue = parser.parse(key);
              }
              break;
            case 'h12':
              allowsZero = false;
              if (numberValue > 12) {
                segmentValue = parser.parse(key);
              }
              break;
          }

          if (segment.value !== undefined && segment.value >= 12 && numberValue > 1) {
            numberValue += 12;
          }
        } else if (segment.maxValue !== undefined && numberValue > segment.maxValue) {
          segmentValue = parser.parse(key);
        }

        if (isNaN(numberValue)) {
          return;
        }

        let shouldSetValue = segmentValue !== 0 || allowsZero;
        if (shouldSetValue) {
          state.setSegment(segment.type, segmentValue);
        }

        if (segment.maxValue !== undefined && (Number(numberValue + '0') > segment.maxValue || newValue.length >= String(segment.maxValue).length)) {
          enteredKeys.current = '';
          if (shouldSetValue) {
            focusManager.focusNext();
          }
        } else {
          enteredKeys.current = newValue;
        }
        break;
      }
    }
  };

  let onFocus = () => {
    enteredKeys.current = '';
    if (ref.current) {
      scrollIntoViewport(ref.current, {containingElement: getScrollParent(ref.current)});
    }

    // Collapse selection to start or Chrome won't fire input events.
    let selection = window.getSelection();
    selection?.collapse(ref.current);
  };

  let documentRef = useRef(typeof document !== 'undefined' ? document : null);
  useEvent(documentRef, 'selectionchange', () => {
    // Enforce that the selection is collapsed when inside a date segment.
    // Otherwise, when tapping on a segment in Android Chrome and then entering text,
    // composition events will be fired that break the DOM structure and crash the page.
    let selection = window.getSelection();
    if (selection?.anchorNode && ref.current?.contains(selection?.anchorNode)) {
      selection.collapse(ref.current);
    }
  });

  let compositionRef = useRef<string | null>('');
  useEvent(ref, 'beforeinput', e => {
    if (!ref.current) {
      return;
    }
    e.preventDefault();

    switch (e.inputType) {
      case 'deleteContentBackward':
      case 'deleteContentForward':
        if (parser.isValidPartialNumber(segment.text) && !state.isReadOnly) {
          backspace();
        }
        break;
      case 'insertCompositionText':
        // insertCompositionText cannot be canceled.
        // Record the current state of the element so we can restore it in the `input` event below.
        compositionRef.current = ref.current.textContent;

        // Safari gets stuck in a composition state unless we also assign to the value here.
        // eslint-disable-next-line no-self-assign
        ref.current.textContent = ref.current.textContent;
        break;
      default:
        if (e.data != null) {
          onInput(e.data);
        }
        break;
    }
  });

  useEvent(ref, 'input', e => {
    let {inputType, data} = e as InputEvent;
    switch (inputType) {
      case 'insertCompositionText':
        // Reset the DOM to how it was in the beforeinput event.
        if (ref.current) {
          ref.current.textContent = compositionRef.current;
        }

        // Android sometimes fires key presses of letters as composition events. Need to handle am/pm keys here too.
        // Can also happen e.g. with Pinyin keyboard on iOS.
        if (data != null && (startsWith(am, data) || startsWith(pm, data))) {
          onInput(data);
        }
        break;
    }
  });

  useLayoutEffect(() => {
    let element = ref.current;
    return () => {
      // If the focused segment is removed, focus the previous one, or the next one if there was no previous one.
      if (document.activeElement === element) {
        let prev = focusManager.focusPrevious();
        if (!prev) {
          focusManager.focusNext();
        }
      }
    };
  }, [ref, focusManager]);

  // spinbuttons cannot be focused with VoiceOver on iOS.
  let touchPropOverrides = isIOS() || segment.type === 'timeZoneName' ? {
    role: 'textbox',
    'aria-valuemax': null,
    'aria-valuemin': null,
    'aria-valuetext': null,
    'aria-valuenow': null
  } : {};

  // Only apply aria-describedby to the first segment, unless the field is invalid. This avoids it being
  // read every time the user navigates to a new segment.
  let firstSegment = useMemo(() => state.segments.find(s => s.isEditable), [state.segments]);
  if (segment !== firstSegment && !state.isInvalid) {
    ariaDescribedBy = undefined;
  }

  let id = useId();
  let isEditable = !state.isDisabled && !state.isReadOnly && segment.isEditable;

  // Prepend the label passed from the field to each segment name.
  // This is needed because VoiceOver on iOS does not announce groups.
  let name = segment.type === 'literal' ? '' : displayNames.of(segment.type);
  let labelProps = useLabels({
    'aria-label': `${name}${ariaLabel ? `, ${ariaLabel}` : ''}${ariaLabelledBy ? ', ' : ''}`,
    'aria-labelledby': ariaLabelledBy
  });

  // Literal segments should not be visible to screen readers. We don't really need any of the above,
  // but the rules of hooks mean hooks cannot be conditional so we have to put this condition here.
  if (segment.type === 'literal') {
    return {
      segmentProps: {
        'aria-hidden': true
      }
    };
  }

  let dateSegments = ['day', 'month', 'year'];
  let segmentStyle : CSSProperties = {caretColor: 'transparent'};
  if (direction === 'rtl') {
    if (dateSegments.includes(segment.type)) {
      segmentStyle = {caretColor: 'transparent', direction: 'ltr', unicodeBidi: 'embed'};
    } else if (segment.type === 'timeZoneName') {
      segmentStyle = {caretColor: 'transparent', unicodeBidi: 'embed'};
    }
  }

  return {
    segmentProps: mergeProps(spinButtonProps, labelProps, {
      id,
      ...touchPropOverrides,
      'aria-invalid': state.isInvalid ? 'true' : undefined,
      'aria-describedby': ariaDescribedBy,
      'aria-readonly': state.isReadOnly || !segment.isEditable ? 'true' : undefined,
      'data-placeholder': segment.isPlaceholder || undefined,
      contentEditable: isEditable,
      suppressContentEditableWarning: isEditable,
      spellCheck: isEditable ? 'false' : undefined,
      autoCorrect: isEditable ? 'off' : undefined,
      // Capitalization was changed in React 17...
      [parseInt(React.version, 10) >= 17 ? 'enterKeyHint' : 'enterkeyhint']: isEditable ? 'next' : undefined,
      inputMode: state.isDisabled || segment.type === 'dayPeriod' || segment.type === 'era' || !isEditable ? undefined : 'numeric',
      tabIndex: state.isDisabled ? undefined : 0,
      onKeyDown,
      onFocus,
      style: segmentStyle,
      // Prevent pointer events from reaching useDatePickerGroup, and allow native browser behavior to focus the segment.
      onPointerDown(e) {
        e.stopPropagation();
      },
      onMouseDown(e) {
        e.stopPropagation();
      }
    })
  };
}

function commonPrefixLength(strings: string[]): number {
  // Sort the strings, and compare the characters in the first and last to find the common prefix.
  strings.sort();
  let first = strings[0];
  let last = strings[strings.length - 1];
  for (let i = 0; i < first.length; i++) {
    if (first[i] !== last[i]) {
      return i;
    }
  }
  return 0;
}
