import {classNames} from '@react-spectrum/utils';
import React, {ReactNode, RefObject, useRef} from 'react';
import styles from '@adobe/spectrum-css-temp/components/tooltip/vars.css';

interface TooltipProps {
  children: ReactNode,
  variant?: 'neutral' | 'positive' | 'negative' | 'info',
  placement?: 'right' | 'left' | 'top' | 'bottom',
  showIcon?: boolean
}

export const Tooltip = React.forwardRef((props: TooltipProps, ref: RefObject<HTMLDivElement>) => {
  ref = ref || useRef();
  let {
    variant = 'neutral',
    placement = 'right',
    showIcon = true
  } = props;

  return (
    <div
      className={classNames(
        styles,
        'spectrum-Tooltip',
        `spectrum-Tooltip--${variant}`,
        `spectrum-Tooltip--${placement.split(' ')[0]}`,
        {
          'is-open': showIcon
        }
      )}
      ref={ref}>
      {props.children && (
        <span className={classNames(styles, 'spectrum-Tooltip-label')}>
          {props.children}
        </span>
      )}
      <span className={classNames(styles, 'spectrum-Tooltip-tip')} />
    </div>
  );
});
