import {HoverResponder} from '@react-aria/interactions';
import {PositionProps, useOverlayPosition} from '@react-aria/overlays';
import {PressResponder} from '@react-aria/interactions';
import React, {Fragment, ReactNode, RefObject, useRef} from 'react';
import {useControlledState} from '@react-stately/utils';

interface TooltipTriggerProps extends PositionProps {
  children: ReactNode,
  type?: 'click' | 'hover',
  targetRef?: RefObject<HTMLElement>,
  isOpen?: boolean,
  defaultOpen?: boolean,
  onOpenChange?: (isOpen: boolean) => void
}

export function TooltipTrigger(props: TooltipTriggerProps) {
  let {
    children,
    type,
    targetRef
  } = props;

  let [trigger, content] = React.Children.toArray(children);

  let [isOpen, setOpen] = useControlledState(props.isOpen, props.defaultOpen || false, props.onOpenChange);

  let onInteraction = () => {
    setOpen(!isOpen);
  };

  return (
    <TooltipTriggerContainer
      type={type}
      isOpen={isOpen}
      onInteraction={onInteraction}
      targetRef={targetRef}
      trigger={trigger}
      content={content} />
  );
}

function TooltipTriggerContainer({type, isOpen, onInteraction, targetRef, trigger, content, ...props}) {
  let containerRef = useRef<HTMLDivElement>();
  let triggerRef = useRef<HTMLElement>();
  let overlayRef = useRef<HTMLDivElement>();

  let {overlayProps} = useOverlayPosition({
    containerRef,
    targetRef: targetRef || triggerRef,
    overlayRef,
    isOpen
  });

  let triggerPropsWithRef = {
    ref: triggerRef
  };

  let overlay = (
    React.cloneElement(content, {...props, ref: overlayRef, ...overlayProps, isOpen: isOpen})
  );

  if (type === 'click') {
    return (
      <TooltipClickTrigger
        triggerPropsWithRef={triggerPropsWithRef}
        isOpen={isOpen}
        onPress={onInteraction}
        trigger={trigger}
        overlay={overlay} />
    );
  } else {
    return (
      <TooltipHoverTrigger
        isOpen={isOpen}
        onHover={onInteraction}
        trigger={trigger}
        overlay={overlay} />
    );
  }
}

function TooltipClickTrigger({triggerPropsWithRef, isOpen, onPress, trigger, overlay}) {
  return (
    <Fragment>
      <PressResponder
        {...triggerPropsWithRef}
        isPressed={isOpen}
        onPress={onPress}>
        {trigger}
      </PressResponder>
      {overlay}
    </Fragment>
  );
}

function TooltipHoverTrigger({isOpen, onHover, trigger, overlay}) {
  return (
    <Fragment>
      <HoverResponder
        isHovering={isOpen}
        onHover={onHover}>
        {trigger}
      </HoverResponder>
      {overlay}
    </Fragment>
  );
}
