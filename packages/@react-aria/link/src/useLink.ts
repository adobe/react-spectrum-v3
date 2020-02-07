import {AllHTMLAttributes, RefObject, SyntheticEvent} from 'react';
import {DOMProps, PressEvent} from '@react-types/shared';
import {LinkProps} from '@react-types/link';
import {useId} from '@react-aria/utils';
import {usePress} from '@react-aria/interactions';

export interface AriaLinkProps extends LinkProps, DOMProps {
  isDisabled?: boolean,
  href?: string,
  tabIndex?: number,
  onPress?: (e: PressEvent) => void,
  onClick?: (e: SyntheticEvent) => void,
  ref: RefObject<HTMLElement | null>
}

export interface LinkAria {
  linkProps: AllHTMLAttributes<HTMLDivElement>
}

export function useLink(props: AriaLinkProps): LinkAria {
  let {
    id,
    href,
    tabIndex = 0,
    children,
    onPress,
    onPressStart,
    onPressEnd,
    onClick: deprecatedOnClick,
    isDisabled,
    ref
  } = props;

  let linkProps: AllHTMLAttributes<HTMLDivElement>;
  if (typeof children === 'string') {
    linkProps = {
      role: 'link',
      tabIndex: !isDisabled ? tabIndex : undefined,
      'aria-disabled': isDisabled || undefined
    };
  }

  if (href) {
    console.warn('href is deprecated, please use an anchor element as children');
  }

  let {pressProps} = usePress({onPress, onPressStart, onPressEnd, isDisabled, ref});

  return {
    linkProps: {
      ...pressProps,
      ...linkProps,
      id: useId(id),
      onClick: (e) => {
        pressProps.onClick(e);
        if (deprecatedOnClick) {
          deprecatedOnClick(e);
          console.warn('onClick is deprecated, please use onPress');
        }
      }
    }
  };
}
