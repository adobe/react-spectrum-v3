import React, {ReactNode, useCallback, useContext, useEffect, useState} from 'react';
import {useIsSSR} from '@react-aria/ssr';

interface Breakpoints {
  S?: number,
  M?: number,
  L?: number,
  [custom: string]: number | undefined
}

interface BreakpointContext {
  matchedBreakpoints: string[]
}

const Context = React.createContext<BreakpointContext>(null);
Context.displayName = 'BreakpointContext';

interface BreakpointProviderProps {
  children?: ReactNode,
  matchedBreakpoints: string[]
}

export function BreakpointProvider(props: BreakpointProviderProps) {
  let {
    children,
    matchedBreakpoints
  } = props;
  return (
    <Context.Provider
      value={{matchedBreakpoints}} >
      {children}
    </Context.Provider>
  );
}

export function useMatchedBreakpoints(breakpoints: Breakpoints): string[] {
  let entries = Object.entries(breakpoints).sort(([, valueA], [, valueB]) => valueB - valueA);
  let breakpointQueries = entries.map(([, value]) => `(min-width: ${value}px)`);

  let supportsMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  let getBreakpointHandler = useCallback(() => {
    let matched = [];
    for (let i in breakpointQueries) {
      let query = breakpointQueries[i];
      if (window.matchMedia(query).matches) {
        matched.push(entries[i][0]);
      }
    }
    matched.push('base');
    return matched;
  }, [breakpointQueries, entries]);

  let [breakpoint, setBreakpoint] = useState(() =>
    supportsMatchMedia
      ? getBreakpointHandler()
      : ['base']
  );

  useEffect(() => {
    if (!supportsMatchMedia) {
      return;
    }

    let onResize = () => {
      setBreakpoint(getBreakpointHandler());
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [supportsMatchMedia, getBreakpointHandler]);

  // If in SSR, the media query should never match. Once the page hydrates,
  // this will update and the real value will be returned.
  let isSSR = useIsSSR();
  return isSSR ? ['base'] : breakpoint;
}

export function useBreakpoint(): BreakpointContext {
  return useContext(Context);
}
