import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Calendar as AriaCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarProps as AriaCalendarProps,
  DateValue,
  Heading,
  Text,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
  useLocale
} from 'react-aria-components';
import { Button } from './Button';
import {focusRing} from './utils';
import React from 'react';
import {tv} from 'tailwind-variants';

const cellStyles = tv({
  extend: focusRing,
  base: 'w-9 h-9 text-sm cursor-default rounded-full flex items-center justify-center forced-color-adjust-none',
  variants: {
    isSelected: {
      false: 'text-zinc-900 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 pressed:bg-gray-200 dark:pressed:bg-zinc-600',
      true: 'bg-blue-600 text-white forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]'
    },
    isDisabled: {
      true: 'text-gray-300 dark:text-zinc-600 forced-colors:!text-[GrayText]'
    }
  }
});

export interface CalendarProps<T extends DateValue> extends AriaCalendarProps<T> {
  errorMessage?: string;
}

export function Calendar<T extends DateValue>(
  { errorMessage, ...props }: CalendarProps<T>
) {
  return (
    <AriaCalendar {...props}>
      <CalendarHeader />
      <CalendarGrid>
        <CalendarGridHeader />
        <CalendarGridBody>
          {(date) => <CalendarCell date={date} className={cellStyles} />}
        </CalendarGridBody>
      </CalendarGrid>
      {errorMessage && <Text slot="errorMessage" className="text-sm text-red-600">{errorMessage}</Text>}
    </AriaCalendar>
  );
}

export function CalendarHeader() {
  let {direction} = useLocale();

  return (
    <header className="flex items-center gap-1 pb-4 px-1 w-full">
      <Button variant="icon" slot="previous">{direction === 'rtl' ? <ChevronRight /> : <ChevronLeft />}</Button>
      <Heading className="flex-1 font-semibold text-xl text-center mx-2 text-zinc-900 dark:text-zinc-200" />
      <Button variant="icon" slot="next">{direction === 'rtl' ? <ChevronLeft /> : <ChevronRight />}</Button>
    </header>
  );
}

export function CalendarGridHeader() {
  return (
    <AriaCalendarGridHeader>
      {(day) => (
        <CalendarHeaderCell className="text-xs text-gray-500 font-semibold">
          {day}
        </CalendarHeaderCell>
      )}
    </AriaCalendarGridHeader>
  )
}
