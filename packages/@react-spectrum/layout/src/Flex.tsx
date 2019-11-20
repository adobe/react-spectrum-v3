import {classNames, filterDOMProps} from '@react-spectrum/utils';
import {HTMLElement} from 'react-dom';
import React, {RefObject} from 'react';
import styles from './layout.css';
import {useSlotProvider} from './Slots';

export interface FlexProps {
}

export const Flex = React.forwardRef((props: FlexProps, ref: RefObject<HTMLElement>) => {
  let defaults = {};
  let completeProps = Object.assign({}, defaults, props);
  let {
    children,
    className,
    slot,
    ...otherProps
  } = completeProps;
  let {[slot]: slotClassName} = useSlotProvider();

  console.log(slot, slotClassName);
  return (
    <div {...filterDOMProps(otherProps)} ref={ref} className={classNames(styles, 'flex', slotClassName, className)}>
      {children}
    </div>
  );
});
