import {AllHTMLAttributes, RefObject} from 'react';
import {DOMProps} from '@react-types/shared';
import {useId} from '@react-aria/utils';
import {useOverlayTrigger} from '@react-aria/overlays';

interface MenuProps extends DOMProps{
  type: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid',
  onClose?: () => void,
  role: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid'
}

interface MenuTriggerProps extends DOMProps {
  ref: RefObject<HTMLElement | null>,
}

interface MenuTriggerAria {
  menuTriggerAriaProps: AllHTMLAttributes<HTMLElement>,
  menuAriaProps: AllHTMLAttributes<HTMLElement>
}

export function useMenuTrigger(menuProps: MenuProps, menuTriggerProps:MenuTriggerProps, isOpen: boolean): MenuTriggerAria {
  let menuTriggerId = useId(menuTriggerProps.id);
  let {triggerAriaProps, overlayAriaProps} = useOverlayTrigger({
    ref: menuTriggerProps.ref,
    type: menuProps.type,
    id: menuProps.id,
    onClose: menuProps.onClose,
    isOpen
  });

  return {
    menuTriggerAriaProps: {
      ...triggerAriaProps,
      id: menuTriggerId,
      'aria-haspopup': menuTriggerProps['aria-haspopup'] || menuProps.role || 'true',
      role: 'button',
      type: 'button'
    },
    menuAriaProps: {
      ...overlayAriaProps,
      'aria-labelledby': menuProps['aria-labelledby'] || menuTriggerId,
      role: menuProps.role || 'menu'
    }
  };
}
