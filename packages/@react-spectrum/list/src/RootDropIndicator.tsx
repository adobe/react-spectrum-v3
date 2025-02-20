import {ListViewContext} from './ListView';
import React, {ReactElement, useContext, useRef} from 'react';
import {useVisuallyHidden} from '@react-aria/visually-hidden';

export default function RootDropIndicator(): ReactElement | null {
  let {dropState, dragAndDropHooks} = useContext(ListViewContext)!;
  let ref = useRef<HTMLDivElement | null>(null);
  let {dropIndicatorProps} = dragAndDropHooks!.useDropIndicator!({
    target: {type: 'root'}
  }, dropState!, ref);
  let isDropTarget = dropState!.isDropTarget({type: 'root'});
  let {visuallyHiddenProps} = useVisuallyHidden();

  if (!isDropTarget && dropIndicatorProps['aria-hidden']) {
    return null;
  }

  return (
    <div role="row" aria-hidden={dropIndicatorProps['aria-hidden']}>
      <div
        role="gridcell"
        aria-selected="false">
        <div role="button" {...visuallyHiddenProps} {...dropIndicatorProps} ref={ref} />
      </div>
    </div>
  );
}
