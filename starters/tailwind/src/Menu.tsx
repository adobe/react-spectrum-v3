import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuItemProps,
  MenuProps as AriaMenuProps,
  Separator,
  SeparatorProps
} from 'react-aria-components';
import { Popover, PopoverProps } from './Popover';
import { Check } from 'lucide-react';

interface MenuProps<T> extends AriaMenuProps<T> {
  placement?: PopoverProps['placement']
}

export function Menu<T extends object>(props: MenuProps<T>) {
  return (
    <Popover placement={props.placement} className="min-w-[150px]">
      <AriaMenu {...props} className="p-1 outline-none max-h-[inherit] overflow-auto" />
    </Popover>
  );
}

export function MenuItem(props: MenuItemProps) {
  return (
    <AriaMenuItem {...props} className="group flex items-center gap-2 cursor-default select-none py-2 pl-3 pr-1 rounded-lg outline-none text-gray-900 disabled:text-gray-300 text-sm focus:bg-blue-600 focus:text-white">
      {renderProps => <>
        {renderProps.selectionMode !== 'none' && (
          <span className="w-4 flex items-center text-gray-900 group-focus:text-white">
            {renderProps.isSelected && <Check className="w-4 h-4" />}
          </span>
        )}
        <span className="flex-1 flex items-center gap-2 truncate font-normal group-selected:font-semibold">
          {typeof props.children === 'function' ? props.children(renderProps) : props.children}
        </span>
      </>}
    </AriaMenuItem>
  );
}

export function MenuSeparator(props: SeparatorProps) {
  return <Separator {...props} className="border-b border-gray-300 mx-3 my-1" />
}
