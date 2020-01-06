import {classNames, filterDOMProps} from '@react-spectrum/utils';
import {HTMLElement} from 'react-dom';
import React, {ReactElement, RefObject} from 'react';
import {SlotContext} from '@react-spectrum/utils';
import styles from './layout.css';
import {useProviderProps} from '@react-spectrum/provider';

export interface GridProps {
  children: ReactElement | ReactElement[],
  className?: string,
  slots: {[key: string]: string}
}

// TODO: needs Devon's style stuff
export const Grid = React.forwardRef((props: GridProps, ref: RefObject<HTMLElement>) => {
  let defaults = {};
  let completeProps = Object.assign({}, defaults, useProviderProps(props));
  let {
    children,
    className,
    slots,
    ...otherProps
  } = completeProps;
  // TODO: add useStyleProps for grids

  return (
    <div {...filterDOMProps(otherProps)} ref={ref} className={classNames(styles, 'grid', className, slots && slots.container)}>
      <SlotContext.Provider value={slots}>
        {children}
      </SlotContext.Provider>
    </div>
  );
});
