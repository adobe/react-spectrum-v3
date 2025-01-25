/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {BaseCollection} from './BaseCollection';
import {BaseNode, Document, ElementNode} from './Document';
import {CachedChildrenOptions, useCachedChildren} from './useCachedChildren';
import {createPortal} from 'react-dom';
import {forwardRefType, Node} from '@react-types/shared';
import {getNodeKey} from './utils';
import {Hidden} from './Hidden';
import React, {createContext, ForwardedRef, forwardRef, JSX, ReactElement, ReactNode, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {useIsSSR} from '@react-aria/ssr';
import {useLayoutEffect} from '@react-aria/utils';
import {useSyncExternalStore as useSyncExternalStoreShim} from 'use-sync-external-store/shim/index.js';

const ShallowRenderContext = createContext(false);
const CollectionDocumentContext = createContext<Document<any, BaseCollection<any>> | null>(null);

export interface CollectionBuilderProps<C extends BaseCollection<object>> {
  content: ReactNode,
  children: (collection: C) => ReactNode,
  createCollection?: () => C
}

/**
 * Builds a `Collection` from the children provided to the `content` prop, and passes it to the child render prop function.
 */
export function CollectionBuilder<C extends BaseCollection<object>>(props: CollectionBuilderProps<C>): ReactElement {
  // If a document was provided above us, we're already in a hidden tree. Just render the content.
  let doc = useContext(CollectionDocumentContext);
  if (doc) {
    // The React types prior to 18 did not allow returning ReactNode from components
    // even though the actual implementation since React 16 did.
    // We must return ReactElement so that TS does not complain that <CollectionBuilder>
    // is not a valid JSX element with React 16 and 17 types.
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
    return props.content as ReactElement;
  }

  // Otherwise, render a hidden copy of the children so that we can build the collection before constructing the state.
  // This should always come before the real DOM content so we have built the collection by the time it renders during SSR.

  // This is fine. CollectionDocumentContext never changes after mounting.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  let {collection, document} = useCollectionDocument(props.createCollection);
  return (
    <>
      <Hidden>
        <CollectionDocumentContext.Provider value={document}>
          {props.content}
        </CollectionDocumentContext.Provider>
      </Hidden>
      <CollectionInner render={props.children} collection={collection} />
    </>
  );
}

function CollectionInner({collection, render}) {
  return render(collection);
}

interface CollectionDocumentResult<T, C extends BaseCollection<T>> {
  collection: C,
  document: Document<T, C>
}

// React 16 and 17 don't support useSyncExternalStore natively, and the shim provided by React does not support getServerSnapshot.
// This wrapper uses the shim, but additionally calls getServerSnapshot during SSR (according to SSRProvider).
function useSyncExternalStoreFallback<C>(subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => C, getServerSnapshot: () => C): C {
  let isSSR = useIsSSR();
  let isSSRRef = useRef(isSSR);
  // This is read immediately inside the wrapper, which also runs during render.
  // We just need a ref to avoid invalidating the callback itself, which
  // would cause React to re-run the callback more than necessary.
  // eslint-disable-next-line rulesdir/pure-render
  isSSRRef.current = isSSR;

  let getSnapshotWrapper = useCallback(() => {
    return isSSRRef.current ? getServerSnapshot() : getSnapshot();
  }, [getSnapshot, getServerSnapshot]);
  return useSyncExternalStoreShim(subscribe, getSnapshotWrapper);
}

const useSyncExternalStore = typeof React['useSyncExternalStore'] === 'function'
  ? React['useSyncExternalStore']
  : useSyncExternalStoreFallback;

function useCollectionDocument<T extends object, C extends BaseCollection<T>>(createCollection?: () => C): CollectionDocumentResult<T, C> {
  // The document instance is mutable, and should never change between renders.
  // useSyncExternalStore is used to subscribe to updates, which vends immutable Collection objects.
  let [document] = useState(() => new Document<T, C>(createCollection?.() || new BaseCollection() as C));
  let subscribe = useCallback((fn: () => void) => document.subscribe(fn), [document]);
  let getSnapshot = useCallback(() => {
    let collection = document.getCollection();
    if (document.isSSR) {
      // After SSR is complete, reset the document to empty so it is ready for React to render the portal into.
      // We do this _after_ getting the collection above so that the collection still has content in it from SSR
      // during the current render, before React has finished the client render.
      document.resetAfterSSR();
    }
    return collection;
  }, [document]);
  let getServerSnapshot = useCallback(() => {
    document.isSSR = true;
    return document.getCollection();
  }, [document]);
  let collection = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useLayoutEffect(() => {
    document.isMounted = true;
    return () => {
      // Mark unmounted so we can skip all of the collection updates caused by 
      // React calling removeChild on every item in the collection.
      document.isMounted = false;
    };
  }, [document]);
  return {collection, document};
}

const SSRContext = createContext<BaseNode<any> | null>(null);

function useSSRCollectionNode<T extends Element>(Type: string, props: object, ref: ForwardedRef<T>, rendered?: any, children?: ReactNode, render?: (node: Node<T>) => ReactElement) {
  // During SSR, portals are not supported, so the collection children will be wrapped in an SSRContext.
  // Since SSR occurs only once, we assume that the elements are rendered in order and never re-render.
  // Therefore we can create elements in our collection document during render so that they are in the
  // collection by the time we need to use the collection to render to the real DOM.
  // After hydration, we switch to client rendering using the portal.
  let itemRef = useCallback((element: ElementNode<any> | null) => {
    element?.setProps(props, ref, rendered, render);
  }, [props, ref, rendered, render]);
  let parentNode = useContext(SSRContext);
  if (parentNode) {
    // Guard against double rendering in strict mode.
    let element = parentNode.ownerDocument.nodesByProps.get(props);
    if (!element) {
      element = parentNode.ownerDocument.createElement(Type);
      element.setProps(props, ref, rendered, render);
      parentNode.appendChild(element);
      parentNode.ownerDocument.updateCollection();
      parentNode.ownerDocument.nodesByProps.set(props, element);
    }

    return children
      ? <SSRContext.Provider value={element}>{children}</SSRContext.Provider>
      : null;
  }

  // @ts-ignore
  return <Type ref={itemRef}>{children}</Type>;
}

export function createLeafComponent<T extends object, P extends object, E extends Element>(type: string, render: (props: P, ref: ForwardedRef<E>) => ReactElement): (props: P & React.RefAttributes<T>) => ReactElement | null;
export function createLeafComponent<T extends object, P extends object, E extends Element>(type: string, render: (props: P, ref: ForwardedRef<E>, node: Node<T>) => ReactElement): (props: P & React.RefAttributes<T>) => ReactElement | null;
export function createLeafComponent<P extends object, E extends Element>(type: string, render: (props: P, ref: ForwardedRef<E>, node?: any) => ReactElement) {
  let Component = ({node}) => render(node.props, node.props.ref, node);
  let Result = (forwardRef as forwardRefType)((props: P, ref: ForwardedRef<E>) => {
    let isShallow = useContext(ShallowRenderContext);
    if (!isShallow) {
      if (render.length >= 3) {
        throw new Error(render.name + ' cannot be rendered outside a collection.');
      }
      return render(props, ref);
    }

    return useSSRCollectionNode(type, props, ref, 'children' in props ? props.children : null, null, node => <Component node={node} />);
  });
  // @ts-ignore
  Result.displayName = render.name;
  return Result;
}

export function createBranchComponent<T extends object, P extends {children?: any}, E extends Element>(type: string, render: (props: P, ref: ForwardedRef<E>, node: Node<T>) => ReactElement, useChildren: (props: P) => ReactNode = useCollectionChildren) {
  let Component = ({node}) => render(node.props, node.props.ref, node);
  let Result = (forwardRef as forwardRefType)((props: P, ref: ForwardedRef<E>) => {
    let children = useChildren(props);
    return useSSRCollectionNode(type, props, ref, null, children, node => <Component node={node} />) ?? <></>;
  });
  // @ts-ignore
  Result.displayName = render.name;
  return Result;
}

function useCollectionChildren<T extends object>(options: CachedChildrenOptions<T>) {
  return useCachedChildren({...options, addIdAndValue: true});
}

export interface CollectionProps<T> extends CachedChildrenOptions<T> {}

const CollectionContext = createContext<CachedChildrenOptions<unknown> | null>(null);

/** A Collection renders a list of items, automatically managing caching and keys. */
export function Collection<T extends object>(props: CollectionProps<T>): JSX.Element {
  let ctx = useContext(CollectionContext)!;
  let dependencies = (ctx?.dependencies || []).concat(props.dependencies);
  let idScope = props.idScope && ctx?.idScope ? getNodeKey(props.idScope, ctx.idScope) : (props.idScope || ctx?.idScope);
  let children = useCollectionChildren({
    ...props,
    idScope,
    dependencies
  });

  let doc = useContext(CollectionDocumentContext);
  if (doc) {
    children = <CollectionRoot>{children}</CollectionRoot>;
  }

  // Propagate dependencies and idScope to child collections.
  ctx = useMemo(() => ({
    dependencies,
    idScope
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [idScope, ...dependencies]);

  return (
    <CollectionContext.Provider value={ctx}>
      {children}
    </CollectionContext.Provider>
  );
}

function CollectionRoot({children}) {
  let doc = useContext(CollectionDocumentContext);
  let wrappedChildren = useMemo(() => (
    <CollectionDocumentContext.Provider value={null}>
      <ShallowRenderContext.Provider value>
        {children}
      </ShallowRenderContext.Provider>
    </CollectionDocumentContext.Provider>
  ), [children]);
  // During SSR, we render the content directly, and append nodes to the document during render.
  // The collection children return null so that nothing is actually rendered into the HTML.
  return useIsSSR()
    ? <SSRContext.Provider value={doc}>{wrappedChildren}</SSRContext.Provider>
    : createPortal(wrappedChildren, doc as unknown as Element);
}
