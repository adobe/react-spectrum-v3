import {useEffect, useRef, useState} from 'react';

export interface PendingHookProps {
  /** Whether the element is in a pending state (e.g. press events are disabled but the element is not disabled). */
  isPending: boolean,
  /** Timeout before the element enters an indeterminate state. */
  timeoutMs?: number
}

export interface PendingResult {
  /** Whether the element is in an indeterminate state (e.g. conveys indeterminate progress). Only pending elements can be indeterminate. */
  isIndeterminate: boolean
}

/**
 * Handles indeterminate state. When an element becomes pending, starts a timer for it to transition to an indeterminate state. When an indeterminate element is no longer pending, exit the indeterminate state.
 */
export function useIndeterminate(props: PendingHookProps): PendingResult {
  let {isPending, timeoutMs = 1000} = props;
  let [isIndeterminate, setIndeterminate] = useState(false);
  let timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Start timer when isPending is set to true.
    if (isPending) {
      timeout.current = setTimeout(() => {
        setIndeterminate(true);
        timeout.current = null;
      }, timeoutMs);
    // Exit indeterminate state when isPending is set to false. */
    } else {
      setIndeterminate(false);
    }

    return () => {
      // Clean up on unmount or when user removes isPending prop before entering indeterminate state.
      clearTimeout(timeout.current);
      timeout.current = null;
    };
  }, [isPending, timeoutMs]);

  return {
    isIndeterminate
  };
}
