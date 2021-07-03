/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import React, {ReactNode, useContext, useLayoutEffect, useMemo, useState} from 'react';

// To support SSR, the auto incrementing id counter is stored in a context. This allows
// it to be reset on every request to ensure the client and server are consistent.
// There is also a prefix counter that is used to support async loading components
// Each async boundary must be wrapped in an SSR provider, which increments the prefix
// and resets the current id counter. This ensures that async loaded components have
// consistent ids regardless  of the loading order.
interface SSRContextValue {
  prefix: number,
  current: number
}

// Default context value to use in case there is no SSRProvider. This is fine for
// client-only apps. In order to support multiple copies of React Aria potentially
// being on the page at once, the prefix is set to a random number. SSRProvider
// will reset this to zero for consistency between server and client, so in the
// SSR case multiple copies of React Aria is not supported.
const defaultContext: SSRContextValue = {
  prefix: Math.round(Math.random() * 10000000000),
  current: 0
};

const SSRContext = React.createContext<SSRContextValue>(defaultContext);

interface SSRProviderProps {
  /** Your application here. */
  children: ReactNode
}

/**
 * When using SSR with React Aria, applications must be wrapped in an SSRProvider.
 * This ensures that auto generated ids are consistent between the client and server.
 */
export function SSRProvider(props: SSRProviderProps): JSX.Element {
  let cur = useContext(SSRContext);
  let value: SSRContextValue = useMemo(() => ({
    // If this is the first SSRProvider, set to zero, otherwise increment.
    prefix: cur === defaultContext ? 0 : ++cur.prefix,
    current: 0
  }), [cur]);

  return (
    <SSRContext.Provider value={value}>
      {props.children}
    </SSRContext.Provider>
  );
}

let canUseDOM = Boolean(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

/** @private */
export function useSSRSafeId(defaultId?: string): string {
  let ctx = useContext(SSRContext);

  // If we are rendering in a non-DOM environment, and there's no SSRProvider,
  // provide a warning to hint to the developer to add one.
  if (ctx === defaultContext && !canUseDOM) {
    console.warn('When server rendering, you must wrap your application in an <SSRProvider> to ensure consistent ids are generated between the client and server.');
  }

  return useMemo(() => defaultId || `react-aria-${ctx.prefix}-${++ctx.current}`, [defaultId, ctx]);
}

/**
 * Returns whether the component is currently being server side rendered or
 * hydrated on the client. Can be used to delay browser-specific rendering
 * until after hydration.
 */
export function useIsSSR(): boolean {
  let cur = useContext(SSRContext);
  let isInSSRContext = cur !== defaultContext;
  let [isSSR, setIsSSR] = useState(isInSSRContext);

  // If on the client, and the component was initially server rendered,
  // then schedule a layout effect to update the component after hydration.
  if (typeof window !== 'undefined' && isInSSRContext) {
    // This if statement technically breaks the rules of hooks, but is safe
    // because the condition never changes after mounting.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      setIsSSR(false);
    }, []);
  }

  return isSSR;
}
