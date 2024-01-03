import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuItemProps,
  MenuProps as AriaMenuProps,
  Separator,
  SeparatorProps,
  composeRenderProps
} from 'react-aria-components';
import { Popover, PopoverProps } from './Popover';
import { Check } from 'lucide-react';
import React from 'react';
import { dropdownItemStyles } from './ListBox';

interface MenuProps<T> extends AriaMenuProps<T> {
  placement?: PopoverProps['placement']
}

export function Menu<T extends object>(props: MenuProps<T>) {
  return (
    <Popover placement={props.placement} className="min-w-[150px]">
      <AriaMenu {...props} className="p-1 outline outline-0 max-h-[inherit] overflow-auto" />
    </Popover>
  );
}

export function MenuItem(props: MenuItemProps) {
  return (
    <AriaMenuItem {...props} className={dropdownItemStyles}>
      {composeRenderProps(props.children, (children, {selectionMode, isSelected}) => <>
        {selectionMode !== 'none' && (
          <span className="w-4 flex items-center">
            {isSelected && <Check aria-hidden className="w-4 h-4" />}
          </span>
        )}
        <span className="flex-1 flex items-center gap-2 truncate font-normal group-selected:font-semibold">
          {children}
        </span>
      </>)}
    </AriaMenuItem>
  );
}

export function MenuSeparator(props: SeparatorProps) {
  return <Separator {...props} className="border-b border-gray-300 dark:border-zinc-700 mx-3 my-1" />
}
