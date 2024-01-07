import {Dialog as RACDialog, DialogProps} from 'react-aria-components';
import {twMerge} from 'tailwind-merge';
import React from 'react';

export function Dialog(props: DialogProps) {
  return <RACDialog {...props} className={twMerge('outline outline-0 p-6 [[data-placement]>&]:p-4 max-h-[inherit] overflow-auto relative', props.className)} />;
}
