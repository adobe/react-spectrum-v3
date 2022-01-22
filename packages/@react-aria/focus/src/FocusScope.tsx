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

import {focusSafely} from './focusSafely';
import {isElementVisible} from './isElementVisible';
import React, {ReactNode, RefObject, useContext, useEffect, useRef} from 'react';
import {useLayoutEffect} from '@react-aria/utils';

// import {FocusScope, useFocusScope} from 'react-events/focus-scope';
// export {FocusScope};

interface FocusScopeProps {
  /** The contents of the focus scope. */
  children: ReactNode,

  /**
   * The position in the DOM where this component's descendants
   * should be inserted into the tab order. This has no effect when
   * focus is contained.
   */
  tabOrder?: 'replace-trigger' | 'after-trigger' | RefObject<HTMLElement | null>,

  /**
   * Whether to contain focus inside the scope, so users cannot
   * move focus outside, for example in a modal dialog.
   */
  contain?: boolean,

  /**
   * Whether to restore focus back to the element that was focused
   * when the focus scope mounted, after the focus scope unmounts.
   */
  restoreFocus?: boolean,

  /** Whether to auto focus the first focusable element in the focus scope on mount. */
  autoFocus?: boolean
}

interface FocusManagerOptions {
  /** The element to start searching from. The currently focused element by default. */
  from?: HTMLElement,
  /** Whether to only include tabbable elements, or all focusable elements. */
  tabbable?: boolean,
  /** Whether focus should wrap around when it reaches the end of the scope. */
  wrap?: boolean
}

interface FocusManager {
  /** Moves focus to the next focusable or tabbable element in the focus scope. */
  focusNext(opts?: FocusManagerOptions): HTMLElement,
  /** Moves focus to the previous focusable or tabbable element in the focus scope. */
  focusPrevious(opts?: FocusManagerOptions): HTMLElement,
  /** Moves focus to the first focusable or tabbable element in the focus scope. */
  focusFirst(opts?: FocusManagerOptions): HTMLElement,
    /** Moves focus to the last focusable or tabbable element in the focus scope. */
  focusLast(opts?: FocusManagerOptions): HTMLElement
}

type Scope = HTMLElement[];
interface IFocusContext {
  scope: Scope,
  focusManager: FocusManager
}

const FocusContext = React.createContext<IFocusContext>(null);

let containedScope: Scope = null;
let scopes: Map<Scope, Scope | null> = new Map();

// This is a hacky DOM-based implementation of a FocusScope until this RFC lands in React:
// https://github.com/reactjs/rfcs/pull/109
// For now, it relies on the DOM tree order rather than the React tree order, and is probably
// less optimized for performance.

/**
 * A FocusScope manages focus for its descendants. It supports containing focus inside
 * the scope, restoring focus to the previously focused element on unmount, and auto
 * focusing children on mount. It also acts as a container for a programmatic focus
 * management interface that can be used to move focus forward and back in response
 * to user events.
 */
export function FocusScope(props: FocusScopeProps) {
  let {children, tabOrder, contain, restoreFocus, autoFocus} = props;
  let startRef = useRef<HTMLSpanElement>();
  let endRef = useRef<HTMLSpanElement>();
  // enforce immutability of the scope object as this component's hooks should not change
  let scopeRef: RefObject<Scope> = useRef([]);
  let ctx = useContext(FocusContext);
  let parentScope = ctx?.scope;

  useLayoutEffect(() => {
    // Find all rendered nodes between the sentinels and add them to the scope.
    let node = startRef.current.nextSibling;
    let nodes = [];
    while (node && node !== endRef.current) {
      nodes.push(node);
      node = node.nextSibling;
    }

    scopeRef.current.splice(0, undefined, ...nodes);
  }, [children, parentScope]);

  useLayoutEffect(() => {
    let scope = scopeRef.current;
    scopes.set(scope, parentScope);
    return () => {
      // Restore the active scope on unmount if this scope or a descendant scope is active.
      // Parent effect cleanups run before children, so we need to check if the
      // parent scope actually still exists before restoring the active scope to it.
      if (
        (scope === containedScope || isAncestorScope(scope, containedScope)) &&
        (!parentScope || scopes.has(parentScope))
      ) {
        containedScope = parentScope;
      }
      scopes.delete(scope);
    };
  }, [parentScope]);

  useAutoFocus(scopeRef.current, autoFocus);
  let nodeToRestoreRef = useRestoreFocus(scopeRef.current, restoreFocus);
  let domRef = typeof tabOrder === 'object' ? tabOrder : nodeToRestoreRef;
  const tabStrategy = typeof tabOrder === 'string' ? tabOrder : 'replace-trigger';
  useTabOrderSplice(scopeRef.current, contain ? 'contain' : tabStrategy, domRef);

  let focusManager = createFocusManagerForScope(scopeRef.current);

  return (
    <FocusContext.Provider value={{scope: scopeRef.current, focusManager}}>
      <span data-focus-scope-start hidden ref={startRef} />
      {children}
      <span data-focus-scope-end hidden ref={endRef} />
    </FocusContext.Provider>
  );
}

/**
 * Returns a FocusManager interface for the parent FocusScope.
 * A FocusManager can be used to programmatically move focus within
 * a FocusScope, e.g. in response to user events like keyboard navigation.
 */
export function useFocusManager(): FocusManager {
  return useContext(FocusContext)?.focusManager;
}

function createFocusManagerForScope(scope: Scope): FocusManager {
  return {
    focusNext(opts: FocusManagerOptions = {}) {
      let {from, tabbable, wrap} = opts;
      let node = from || document.activeElement;
      let sentinel = scope[0].previousElementSibling;
      let walker = getFocusableTreeWalker(getScopeRoot(scope), {tabbable}, scope);
      walker.currentNode = isElementInScope(node, scope) ? node : sentinel;
      let nextNode = walker.nextNode() as HTMLElement;
      if (!nextNode && wrap) {
        walker.currentNode = sentinel;
        nextNode = walker.nextNode() as HTMLElement;
      }
      if (nextNode) {
        focusElement(nextNode, true);
      }
      return nextNode;
    },
    focusPrevious(opts: FocusManagerOptions = {}) {
      let {from, tabbable, wrap} = opts;
      let node = from || document.activeElement;
      let sentinel = scope[scope.length - 1].nextElementSibling;
      let walker = getFocusableTreeWalker(getScopeRoot(scope), {tabbable}, scope);
      walker.currentNode = isElementInScope(node, scope) ? node : sentinel;
      let previousNode = walker.previousNode() as HTMLElement;
      if (!previousNode && wrap) {
        walker.currentNode = sentinel;
        previousNode = walker.previousNode() as HTMLElement;
      }
      if (previousNode) {
        focusElement(previousNode, true);
      }
      return previousNode;
    },
    focusFirst(opts = {}) {
      let {tabbable} = opts;
      let walker = getFocusableTreeWalker(getScopeRoot(scope), {tabbable}, scope);
      walker.currentNode = scope[0].previousElementSibling;
      let nextNode = walker.nextNode() as HTMLElement;
      if (nextNode) {
        focusElement(nextNode, true);
      }
      return nextNode;
    },
    focusLast(opts = {}) {
      let {tabbable} = opts;
      let walker = getFocusableTreeWalker(getScopeRoot(scope), {tabbable}, scope);
      walker.currentNode = scope[scope.length - 1].nextElementSibling;
      let previousNode = walker.previousNode() as HTMLElement;
      if (previousNode) {
        focusElement(previousNode, true);
      }
      return previousNode;
    }
  };
}

const focusableElements = [
  'input:not([disabled]):not([type=hidden])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'a[href]',
  'area[href]',
  'summary',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]'
];

const FOCUSABLE_ELEMENT_SELECTOR = focusableElements.join(':not([hidden]),') + ',[tabindex]:not([disabled]):not([hidden])';

focusableElements.push('[tabindex]:not([tabindex="-1"]):not([disabled])');
const TABBABLE_ELEMENT_SELECTOR = focusableElements.join(':not([hidden]):not([tabindex="-1"]),');

function getScopeRoot(scope: Scope) {
  return scope[0].parentElement;
}

function useTabOrderSplice(scope: Scope, strategy: 'contain' | 'replace-trigger' | 'after-trigger', domRef: React.RefObject<HTMLElement> | undefined) {
  let focusedNode = useRef<HTMLElement>();

  let raf = useRef(null);
  useLayoutEffect(() => {
    // Handle the Tab key to contain focus within the scope
    let onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }

      if (strategy === 'contain' && scope !== containedScope) {
        return;
      }

      let focusedElement = document.activeElement as HTMLElement;
      if (!isElementInScope(focusedElement, scope)) {
        return;
      }

      // Create a DOM tree walker that matches all tabbable elements (and when contained, filtered to the current scope)
      let walker = getFocusableTreeWalker(getScopeRoot(scope), {tabbable: true}, strategy === 'contain' ? scope : undefined);

      // Find the next tabbable element after the currently focused element
      walker.currentNode = focusedElement;
      let nextElement = (e.shiftKey ? walker.previousNode() : walker.nextNode()) as HTMLElement;

      if (strategy === 'contain') {
        if (!nextElement) {
          // wrap focus to the opposite end of the scope
          walker.currentNode = e.shiftKey ? scope[scope.length - 1].nextElementSibling : scope[0].previousElementSibling;
          nextElement = (e.shiftKey ? walker.previousNode() : walker.nextNode()) as HTMLElement;
        }
      } else if (domRef?.current) {
        walker.currentNode = domRef.current;

        if (strategy === 'after-trigger' && e.shiftKey) {
          nextElement = walker.currentNode as HTMLElement;
        } else {
          nextElement = (e.shiftKey ? walker.previousNode() : walker.nextNode()) as HTMLElement;
        }

        // Skip over elements within the scope, in case the scope immediately follows the domRef.
        while (isElementInScope(nextElement, scope)) {
          nextElement = (e.shiftKey ? walker.previousNode() : walker.nextNode()) as HTMLElement;
        }

        // If there is no next element and the domRef isn't within a FocusScope (i.e. we are leaving the top level focus scope)
        // then move focus to the body.
        // Otherwise restore focus to the domRef (e.g menu within a popover -> tabbing to close the menu should move focus to menu trigger)
        if (!nextElement && !isElementInAnyScope(domRef.current)) {
          focusedElement.blur();
        }
      }

      if (nextElement) {
        // prevent native focus movement
        e.preventDefault();
        focusElement(nextElement, true);
      }
    };

    let onFocus = (e: FocusEvent) => {
      // If focusing an element in a child scope of the currently active scope, the child becomes active.
      // Moving out of the active scope to an ancestor is not allowed.
      if (isElementInScope(e.target as HTMLElement, scope)) {
        if (!containedScope || isAncestorScope(containedScope, scope)) {
          containedScope = scope;
          focusedNode.current = e.target as HTMLElement;
        }
      } else if (scope === containedScope && !isElementInChildScope(e.target as HTMLElement, scope)) {
        // If a focus event occurs outside the active scope (e.g. user tabs from browser location bar),
        // restore focus to the previously focused node or the first tabbable element in the active scope.
        if (focusedNode.current) {
          focusedNode.current.focus();
        } else if (containedScope) {
          focusFirstInScope(containedScope);
        }
      } else if (scope === containedScope) {
        focusedNode.current = e.target as HTMLElement;
      }
    };

    let onBlur = (e: FocusEvent) => {
      // Firefox doesn't shift focus back to the Dialog properly without this
      raf.current = requestAnimationFrame(() => {
        // Use document.activeElement instead of e.relatedTarget so we can tell if user clicked into iframe
        if (scope === containedScope && !isElementInChildScope(document.activeElement, scope)) {
          containedScope = scope;
          focusedNode.current = e.target as HTMLElement;
          focusedNode.current.focus();
        }
      });
    };

    document.addEventListener('keydown', onKeyDown, false);
    if (strategy === 'contain') {
      document.addEventListener('focusin', onFocus, false);
      document.addEventListener('focusout', onBlur, false);
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown, false);
      if (strategy === 'contain') {
        document.removeEventListener('focusin', onFocus, false);
        document.removeEventListener('focusout', onBlur, false);
      }
    };
  }, [scope, strategy, domRef]);

  // eslint-disable-next-line arrow-body-style
  useEffect(() => {
    return () => cancelAnimationFrame(raf.current);
  }, [raf]);
}

function isElementInAnyScope(element: Element) {
  for (let scope of scopes.keys()) {
    if (isElementInScope(element, scope)) {
      return true;
    }
  }
  return false;
}

function isElementInScope(element: Element, scope: Scope) {
  return scope.some(node => node.contains(element));
}

function isElementInChildScope(element: Element, scope: Scope) {
  // node.contains in isElementInScope covers child scopes that are also DOM children,
  // but does not cover child scopes in portals.
  for (let s of scopes.keys()) {
    if ((s === scope || isAncestorScope(scope, s)) && isElementInScope(element, s)) {
      return true;
    }
  }

  return false;
}

function isAncestorScope(ancestor: Scope, scope: Scope) {
  let parent = scopes.get(scope);
  if (!parent) {
    return false;
  }

  if (parent === ancestor) {
    return true;
  }

  return isAncestorScope(ancestor, parent);
}

function focusElement(element: HTMLElement | null, scroll = false) {
  if (element != null && !scroll) {
    try {
      focusSafely(element);
    } catch (err) {
      // ignore
    }
  } else if (element != null) {
    try {
      element.focus();
    } catch (err) {
      // ignore
    }
  }
}

function focusFirstInScope(scope: Scope) {
  let sentinel = scope[0].previousElementSibling;
  let walker = getFocusableTreeWalker(getScopeRoot(scope), {tabbable: true}, scope);
  walker.currentNode = sentinel;
  focusElement(walker.nextNode() as HTMLElement);
}

function useAutoFocus(scope: Scope, autoFocus: boolean) {
  const autoFocusRef = useRef(autoFocus);
  useLayoutEffect(() => {
    if (autoFocusRef.current && !isElementInScope(document.activeElement, scope)) {
      focusFirstInScope(scope);
    }
    autoFocusRef.current = false;
  }, [scope]);
}

function useRestoreFocus(scope: Scope, restoreFocus: boolean) {
  // create a ref during render instead of useLayoutEffect so the active element is saved before a child with autoFocus=true mounts.
  const nodeToRestoreRef = useRef(typeof document !== 'undefined' ? document.activeElement as HTMLElement : null);
  useLayoutEffect(() => {
    let nodeToRestore = nodeToRestoreRef.current;

    if (!restoreFocus) {
      return;
    }

    return () => {
      if (restoreFocus && nodeToRestore && isElementInScope(document.activeElement, scope)) {
        requestAnimationFrame(() => {
          if (document.body.contains(nodeToRestore)) {
            focusElement(nodeToRestore);
          }
        });
      }
    };
  }, [scope, restoreFocus]);

  return restoreFocus ? nodeToRestoreRef : undefined;
}

/**
 * Create a [TreeWalker]{@link https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker}
 * that matches all focusable/tabbable elements.
 */
export function getFocusableTreeWalker(root: HTMLElement, opts?: FocusManagerOptions, scope?: Scope) {
  let selector = opts?.tabbable ? TABBABLE_ELEMENT_SELECTOR : FOCUSABLE_ELEMENT_SELECTOR;
  let walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        // Skip nodes inside the starting node.
        if (opts?.from?.contains(node)) {
          return NodeFilter.FILTER_REJECT;
        }

        if ((node as HTMLElement).matches(selector)
          && isElementVisible(node as HTMLElement)
          && (!scope || isElementInScope(node as HTMLElement, scope))) {
          return NodeFilter.FILTER_ACCEPT;
        }

        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  if (opts?.from) {
    walker.currentNode = opts.from;
  }

  return walker;
}

/**
 * Creates a FocusManager object that can be used to move focus within an element.
 */
export function createFocusManager(ref: RefObject<HTMLElement>): FocusManager {
  return {
    focusNext(opts: FocusManagerOptions = {}) {
      let root = ref.current;
      let {from, tabbable, wrap} = opts;
      let node = from || document.activeElement;
      let walker = getFocusableTreeWalker(root, {tabbable});
      if (root.contains(node)) {
        walker.currentNode = node;
      }
      let nextNode = walker.nextNode() as HTMLElement;
      if (!nextNode && wrap) {
        walker.currentNode = root;
        nextNode = walker.nextNode() as HTMLElement;
      }
      if (nextNode) {
        focusElement(nextNode, true);
      }
      return nextNode;
    },
    focusPrevious(opts: FocusManagerOptions = {}) {
      let root = ref.current;
      let {from, tabbable, wrap} = opts;
      let node = from || document.activeElement;
      let walker = getFocusableTreeWalker(root, {tabbable});
      if (root.contains(node)) {
        walker.currentNode = node;
      } else {
        let next = last(walker);
        if (next) {
          focusElement(next, true);
        }
        return next;
      }
      let previousNode = walker.previousNode() as HTMLElement;
      if (!previousNode && wrap) {
        walker.currentNode = root;
        previousNode = last(walker);
      }
      if (previousNode) {
        focusElement(previousNode, true);
      }
      return previousNode;
    },
    focusFirst(opts = {}) {
      let root = ref.current;
      let {tabbable} = opts;
      let walker = getFocusableTreeWalker(root, {tabbable});
      let nextNode = walker.nextNode() as HTMLElement;
      if (nextNode) {
        focusElement(nextNode, true);
      }
      return nextNode;
    },
    focusLast(opts = {}) {
      let root = ref.current;
      let {tabbable} = opts;
      let walker = getFocusableTreeWalker(root, {tabbable});
      let next = last(walker);
      if (next) {
        focusElement(next, true);
      }
      return next;
    }
  };
}

function last(walker: TreeWalker) {
  let next: HTMLElement;
  let last: HTMLElement;
  do {
    last = walker.lastChild() as HTMLElement;
    if (last) {
      next = last;
    }
  } while (last);
  return next;
}
