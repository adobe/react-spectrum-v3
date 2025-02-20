import {classNames} from '@react-spectrum/utils';
import {ItemDropTarget} from '@react-types/shared';
import listStyles from './styles.css';
import {ListViewContext} from './ListView';
import React, {ReactElement, useContext, useRef} from 'react';
import {useVisuallyHidden} from '@react-aria/visually-hidden';

interface InsertionIndicatorProps {
  target: ItemDropTarget,
  isPresentationOnly?: boolean
}

export default function InsertionIndicator(props: InsertionIndicatorProps): ReactElement | null {
  let {dropState, dragAndDropHooks} = useContext(ListViewContext)!;
  const {target, isPresentationOnly} = props;

  let ref = useRef<HTMLDivElement | null>(null);
  let {dropIndicatorProps} = dragAndDropHooks!.useDropIndicator!(props, dropState!, ref);
  let {visuallyHiddenProps} = useVisuallyHidden();

  let isDropTarget = dropState!.isDropTarget(target);

  if (!isDropTarget && dropIndicatorProps['aria-hidden']) {
    return null;
  }

  return (
    <div role="row" aria-hidden={dropIndicatorProps['aria-hidden']}>
      <div
        role="gridcell"
        aria-selected="false"
        className={
          classNames(
            listStyles,
            'react-spectrum-ListViewInsertionIndicator',
            {
              'react-spectrum-ListViewInsertionIndicator--dropTarget': isDropTarget
            }
          )}>
        {!isPresentationOnly &&
          <div {...visuallyHiddenProps} role="button" {...dropIndicatorProps} ref={ref} />
        }
      </div>
    </div>
  );
}
