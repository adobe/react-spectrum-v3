import {ContextValue, StyleRenderProps, useContextProps, useRenderProps} from './utils';
import {HoverEvents, mergeProps, useFocusRing, useHover} from 'react-aria';
import {InputRenderProps} from './Input';
import React, {createContext, ForwardedRef, forwardRef, TextareaHTMLAttributes} from 'react';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'style'>, HoverEvents, StyleRenderProps<InputRenderProps> {}

export const TextAreaContext = createContext<ContextValue<TextAreaProps, HTMLTextAreaElement>>({});

let filterHoverProps = (props: TextAreaProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let {onHoverStart, onHoverChange, onHoverEnd, ...otherProps} = props;
  return otherProps;
};

/**
 * A textarea allows a user to input mult-line text.
 */
export const TextArea = forwardRef(function TextArea(props: TextAreaProps, ref: ForwardedRef<HTMLTextAreaElement>) {
  [props, ref] = useContextProps(props, ref, TextAreaContext);

  let {hoverProps, isHovered} = useHover(props);
  let {isFocused, isFocusVisible, focusProps} = useFocusRing({
    autoFocus: props.autoFocus
  });

  let isInvalid = !!props['aria-invalid'] && props['aria-invalid'] !== 'false';
  let renderProps = useRenderProps({
    ...props,
    values: {
      isHovered,
      isFocused,
      isFocusVisible,
      isDisabled: props.disabled || false,
      isInvalid
    },
    defaultClassName: 'react-aria-TextArea'
  });

  return (
    <textarea
      {...mergeProps(filterHoverProps(props), focusProps, hoverProps)}
      {...renderProps}
      ref={ref}
      data-focused={isFocused || undefined}
      data-disabled={props.disabled || undefined}
      data-hovered={isHovered || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-invalid={isInvalid || undefined} />
  );
});
