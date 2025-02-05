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

import {
  createShadowTreeWalker,
  getActiveElement,
  getEventTarget,
  getOwnerDocument,
  isAndroid,
  isChrome,
  isFocusable,
  isTabbable,
  ShadowTreeWalker,
  useLayoutEffect
} from '@react-aria/utils';
import {FocusableElement, RefObject} from '@react-types/shared';
import {focusSafely} from './focusSafely';
import {getInteractionModality} from '@react-aria/interactions';
import {isElementVisible} from './isElementVisible';
import React, {ReactNode, useContext, useEffect, useMemo, useRef} from 'react';

export interface FocusScopeProps {
  /** The contents of the focus scope. */
  children: ReactNode,

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

export interface FocusManagerOptions {
  /** The element to start searching from. The currently focused element by default. */
  from?: Element,
  /** Whether to only include tabbable elements, or all focusable elements. */
  tabbable?: boolean,
  /** Whether focus should wrap around when it reaches the end of the scope. */
  wrap?: boolean,
  /** A callback that determines whether the given element is focused. */
  accept?: (node: Element) => boolean
}

export interface FocusManager {
  /** Moves focus to the next focusable or tabbable element in the focus scope. */
  focusNext(opts?: FocusManagerOptions): FocusableElement | null,
  /** Moves focus to the previous focusable or tabbable element in the focus scope. */
  focusPrevious(opts?: FocusManagerOptions): FocusableElement | null,
  /** Moves focus to the first focusable or tabbable element in the focus scope. */
  focusFirst(opts?: FocusManagerOptions): FocusableElement | null,
  /** Moves focus to the last focusable or tabbable element in the focus scope. */
  focusLast(opts?: FocusManagerOptions): FocusableElement | null
}

type ScopeRef = RefObject<Element[] | null> | null;
interface IFocusContext {
  focusManager: FocusManager,
  parentNode: TreeNode | null
}

const FocusContext = React.createContext<IFocusContext | null>(null);
const RESTORE_FOCUS_EVENT = 'react-aria-focus-scope-restore';

let activeScope: ScopeRef = null;

// This is a hacky DOM-based implementation of a FocusScope until this RFC lands in React:
// https://github.com/reactjs/rfcs/pull/109

/**
 * A FocusScope manages focus for its descendants. It supports containing focus inside
 * the scope, restoring focus to the previously focused element on unmount, and auto
 * focusing children on mount. It also acts as a container for a programmatic focus
 * management interface that can be used to move focus forward and back in response
 * to user events.
 */
export function FocusScope(props: FocusScopeProps) {
  let {children, contain, restoreFocus, autoFocus} = props;
  let startRef = useRef<HTMLSpanElement>(null);
  let endRef = useRef<HTMLSpanElement>(null);
  let scopeRef = useRef<Element[]>([]);
  let {parentNode} = useContext(FocusContext) || {};

  // Create a tree node here so we can add children to it even before it is added to the tree.
  let node = useMemo(() => new TreeNode({scopeRef}), [scopeRef]);

  useLayoutEffect(() => {
    // If a new scope mounts outside the active scope, (e.g. DialogContainer launched from a menu),
    // use the active scope as the parent instead of the parent from context. Layout effects run bottom
    // up, so if the parent is not yet added to the tree, don't do this. Only the outer-most FocusScope
    // that is being added should get the activeScope as its parent.
    let parent = parentNode || focusScopeTree.root;
    if (focusScopeTree.getTreeNode(parent.scopeRef) && activeScope && !isAncestorScope(activeScope, parent.scopeRef)) {
      let activeNode = focusScopeTree.getTreeNode(activeScope);
      if (activeNode) {
        parent = activeNode;
      }
    }

    // Add the node to the parent, and to the tree.
    parent.addChild(node);
    focusScopeTree.addNode(node);
  }, [node, parentNode]);

  useLayoutEffect(() => {
    let node = focusScopeTree.getTreeNode(scopeRef);
    if (node) {
      node.contain = !!contain;
    }
  }, [contain]);

  useLayoutEffect(() => {
    // Find all rendered nodes between the sentinels and add them to the scope.
    let node = startRef.current?.nextSibling!;
    let nodes: Element[] = [];
    let stopPropagation = e => e.stopPropagation();
    while (node && node !== endRef.current) {
      nodes.push(node as Element);
      // Stop custom restore focus event from propagating to parent focus scopes.
      node.addEventListener(RESTORE_FOCUS_EVENT, stopPropagation);
      node = node.nextSibling as Element;
    }

    scopeRef.current = nodes;

    return () => {
      for (let node of nodes) {
        node.removeEventListener(RESTORE_FOCUS_EVENT, stopPropagation);
      }
    };
  }, [children]);

  useActiveScopeTracker(scopeRef, restoreFocus, contain);
  useFocusContainment(scopeRef, contain);
  useRestoreFocus(scopeRef, restoreFocus, contain);
  useAutoFocus(scopeRef, autoFocus);

  // This needs to be an effect so that activeScope is updated after the FocusScope tree is complete.
  // It cannot be a useLayoutEffect because the parent of this node hasn't been attached in the tree yet.
  useEffect(() => {
    const activeElement = getActiveElement(getOwnerDocument(scopeRef.current ? scopeRef.current[0] : undefined));
    let scope: TreeNode | null = null;

    if (isElementInScope(activeElement, scopeRef.current)) {
      // We need to traverse the focusScope tree and find the bottom most scope that
      // contains the active element and set that as the activeScope.
      for (let node of focusScopeTree.traverse()) {
        if (node.scopeRef && isElementInScope(activeElement, node.scopeRef.current)) {
          scope = node;
        }
      }

      if (scope === focusScopeTree.getTreeNode(scopeRef)) {
        activeScope = scope.scopeRef;
      }
    }
  }, [scopeRef]);

  // This layout effect cleanup is so that the tree node is removed synchronously with react before the RAF
  // in useRestoreFocus cleanup runs.
  useLayoutEffect(() => {
    return () => {
      // Scope may have been re-parented.
      let parentScope = focusScopeTree.getTreeNode(scopeRef)?.parent?.scopeRef ?? null;

      if (
        (scopeRef === activeScope || isAncestorScope(scopeRef, activeScope)) &&
        (!parentScope || focusScopeTree.getTreeNode(parentScope))
      ) {
        activeScope = parentScope;
      }
      focusScopeTree.removeTreeNode(scopeRef);
    };
  }, [scopeRef]);

  let focusManager = useMemo(() => createFocusManagerForScope(scopeRef), []);
  let value = useMemo(() => ({
    focusManager,
    parentNode: node
  }), [node, focusManager]);

  return (
    <FocusContext.Provider value={value}>
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
export function useFocusManager(): FocusManager | undefined {
  return useContext(FocusContext)?.focusManager;
}

function createFocusManagerForScope(scopeRef: React.RefObject<Element[] | null>): FocusManager {
  return {
    focusNext(opts: FocusManagerOptions = {}) {
      let scope = scopeRef.current!;
      let {from, tabbable, wrap, accept} = opts;
      let node = from || getActiveElement(getOwnerDocument(scope[0] ?? undefined))!;
      let sentinel = scope[0].previousElementSibling!;
      let scopeRoot = getScopeRoot(scope);
      let walker = getFocusableTreeWalker(scopeRoot, {tabbable, accept}, scope);
      walker.currentNode = isElementInScope(node, scope) ? node : sentinel;
      let nextNode = walker.nextNode() as FocusableElement;
      if (!nextNode && wrap) {
        walker.currentNode = sentinel;
        nextNode = walker.nextNode() as FocusableElement;
      }
      if (nextNode) {
        focusElement(nextNode, true);
      }
      return nextNode;
    },
    focusPrevious(opts: FocusManagerOptions = {}) {
      let scope = scopeRef.current!;
      let {from, tabbable, wrap, accept} = opts;
      let node = from || getActiveElement(getOwnerDocument(scope[0] ?? undefined))!;
      let sentinel = scope[scope.length - 1].nextElementSibling!;
      let scopeRoot = getScopeRoot(scope);
      let walker = getFocusableTreeWalker(scopeRoot, {tabbable, accept}, scope);
      walker.currentNode = isElementInScope(node, scope) ? node  : sentinel;
      let previousNode = walker.previousNode() as FocusableElement;
      if (!previousNode && wrap) {
        walker.currentNode = sentinel;
        previousNode = walker.previousNode() as FocusableElement;
      }
      if (previousNode) {
        focusElement(previousNode, true);
      }
      return previousNode;
    },
    focusFirst(opts = {}) {
      let scope = scopeRef.current!;
      let {tabbable, accept} = opts;
      let scopeRoot = getScopeRoot(scope);
      let walker = getFocusableTreeWalker(scopeRoot, {tabbable, accept}, scope);
      walker.currentNode = scope[0].previousElementSibling!;
      let nextNode = walker.nextNode() as FocusableElement;
      if (nextNode) {
        focusElement(nextNode, true);
      }
      return nextNode;
    },
    focusLast(opts = {}) {
      let scope = scopeRef.current!;
      let {tabbable, accept} = opts;
      let scopeRoot = getScopeRoot(scope);
      let walker = getFocusableTreeWalker(scopeRoot, {tabbable, accept}, scope);
      walker.currentNode = scope[scope.length - 1].nextElementSibling!;
      let previousNode = walker.previousNode() as FocusableElement;
      if (previousNode) {
        focusElement(previousNode, true);
      }
      return previousNode;
    }
  };
}

function getScopeRoot(scope: Element[]) {
  return scope[0].parentElement!;
}

function shouldContainFocus(scopeRef: ScopeRef) {
  let scope = focusScopeTree.getTreeNode(activeScope);
  while (scope && scope.scopeRef !== scopeRef) {
    if (scope.contain) {
      return false;
    }

    scope = scope.parent;
  }

  return true;
}

function useFocusContainment(scopeRef: RefObject<Element[] | null>, contain?: boolean) {
  let focusedNode = useRef<FocusableElement>(undefined);

  let raf = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);
  useLayoutEffect(() => {
    let scope = scopeRef.current;
    if (!contain) {
      // if contain was changed, then we should cancel any ongoing waits to pull focus back into containment
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = undefined;
      }
      return;
    }

    const ownerDocument = getOwnerDocument(scope ? scope[0] : undefined);

    // Handle the Tab key to contain focus within the scope
    let onKeyDown = (e) => {
      if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || !shouldContainFocus(scopeRef) || e.isComposing) {
        return;
      }

      let focusedElement = getActiveElement(ownerDocument);
      let scope = scopeRef.current;
      if (!scope || !isElementInScope(focusedElement, scope)) {
        return;
      }

      let scopeRoot = getScopeRoot(scope);
      let walker = getFocusableTreeWalker(scopeRoot, {tabbable: true}, scope);
      if (!focusedElement) {
        return;
      }
      walker.currentNode = focusedElement;
      let nextElement = (e.shiftKey ? walker.previousNode() : walker.nextNode()) as FocusableElement;
      if (!nextElement) {
        walker.currentNode = e.shiftKey ? scope[scope.length - 1].nextElementSibling! : scope[0].previousElementSibling!;
        nextElement = (e.shiftKey ? walker.previousNode() : walker.nextNode()) as FocusableElement;
      }

      e.preventDefault();
      if (nextElement) {
        focusElement(nextElement, true);
      }
    };

    let onFocus: EventListener = (e) => {
      // If focusing an element in a child scope of the currently active scope, the child becomes active.
      // Moving out of the active scope to an ancestor is not allowed.
      if ((!activeScope || isAncestorScope(activeScope, scopeRef)) && isElementInScope(getEventTarget(e) as Element, scopeRef.current)) {
        activeScope = scopeRef;
        focusedNode.current = getEventTarget(e) as FocusableElement;
      } else if (shouldContainFocus(scopeRef) && !isElementInChildScope(getEventTarget(e) as Element, scopeRef)) {
        // If a focus event occurs outside the active scope (e.g. user tabs from browser location bar),
        // restore focus to the previously focused node or the first tabbable element in the active scope.
        if (focusedNode.current) {
          focusedNode.current.focus();
        } else if (activeScope && activeScope.current) {
          focusFirstInScope(activeScope.current);
        }
      } else if (shouldContainFocus(scopeRef)) {
        focusedNode.current = getEventTarget(e) as FocusableElement;
      }
    };

    let onBlur: EventListener = (e) => {
      // Firefox doesn't shift focus back to the Dialog properly without this
      if (raf.current) {
        cancelAnimationFrame(raf.current);
      }
      raf.current = requestAnimationFrame(() => {
        // Patches infinite focus coersion loop for Android Talkback where the user isn't able to move the virtual cursor
        // if within a containing focus scope. Bug filed against Chrome: https://issuetracker.google.com/issues/384844019.
        // Note that this means focus can leave focus containing modals due to this, but it is isolated to Chrome Talkback.
        let modality = getInteractionModality();
        let shouldSkipFocusRestore = (modality === 'virtual' || modality === null) && isAndroid() && isChrome();

        // Use document.activeElement instead of e.relatedTarget so we can tell if user clicked into iframe
        let activeElement = getActiveElement(ownerDocument);
        if (!shouldSkipFocusRestore && activeElement && shouldContainFocus(scopeRef) && !isElementInChildScope(activeElement, scopeRef)) {
          activeScope = scopeRef;
          let target = getEventTarget(e) as FocusableElement;
          if (target && target.isConnected) {
            focusedNode.current = target;
            focusedNode.current?.focus();
          } else if (activeScope.current) {
            focusFirstInScope(activeScope.current);
          }
        }
      });
    };

    ownerDocument.addEventListener('keydown', onKeyDown, false);
    ownerDocument.addEventListener('focusin', onFocus, false);
    scope?.forEach(element => element.addEventListener('focusin', onFocus, false));
    scope?.forEach(element => element.addEventListener('focusout', onBlur, false));
    return () => {
      ownerDocument.removeEventListener('keydown', onKeyDown, false);
      ownerDocument.removeEventListener('focusin', onFocus, false);
      scope?.forEach(element => element.removeEventListener('focusin', onFocus, false));
      scope?.forEach(element => element.removeEventListener('focusout', onBlur, false));
    };
  }, [scopeRef, contain]);

  // This is a useLayoutEffect so it is guaranteed to run before our async synthetic blur

  useLayoutEffect(() => {
    return () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
      }
    };
  }, [raf]);
}

function isElementInAnyScope(element: Element) {
  return isElementInChildScope(element);
}

function isElementInScope(element?: Element | null, scope?: Element[] | null) {
  if (!element) {
    return false;
  }
  if (!scope) {
    return false;
  }
  return scope.some(node => node.contains(element));
}

function isElementInChildScope(element: Element, scope: ScopeRef = null) {
  // If the element is within a top layer element (e.g. toasts), always allow moving focus there.
  if (element instanceof Element && element.closest('[data-react-aria-top-layer]')) {
    return true;
  }

  // node.contains in isElementInScope covers child scopes that are also DOM children,
  // but does not cover child scopes in portals.
  for (let {scopeRef: s} of focusScopeTree.traverse(focusScopeTree.getTreeNode(scope))) {
    if (s && isElementInScope(element, s.current)) {
      return true;
    }
  }

  return false;
}

/** @private */
export function isElementInChildOfActiveScope(element: Element) {
  return isElementInChildScope(element, activeScope);
}

function isAncestorScope(ancestor: ScopeRef, scope: ScopeRef) {
  let parent = focusScopeTree.getTreeNode(scope)?.parent;
  while (parent) {
    if (parent.scopeRef === ancestor) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

function focusElement(element: FocusableElement | null, scroll = false) {
  if (element != null && !scroll) {
    try {
      focusSafely(element);
    } catch {
      // ignore
    }
  } else if (element != null) {
    try {
      element.focus();
    } catch {
      // ignore
    }
  }
}

function getFirstInScope(scope: Element[], tabbable = true) {
  let sentinel = scope[0].previousElementSibling!;
  let scopeRoot = getScopeRoot(scope);
  let walker = getFocusableTreeWalker(scopeRoot, {tabbable}, scope);
  walker.currentNode = sentinel;
  let nextNode = walker.nextNode();

  // If the scope does not contain a tabbable element, use the first focusable element.
  if (tabbable && !nextNode) {
    scopeRoot = getScopeRoot(scope);
    walker = getFocusableTreeWalker(scopeRoot, {tabbable: false}, scope);
    walker.currentNode = sentinel;
    nextNode = walker.nextNode();
  }

  return nextNode as FocusableElement;
}

function focusFirstInScope(scope: Element[], tabbable:boolean = true) {
  focusElement(getFirstInScope(scope, tabbable));
}

function useAutoFocus(scopeRef: RefObject<Element[] | null>, autoFocus?: boolean) {
  const autoFocusRef = React.useRef(autoFocus);
  useEffect(() => {
    if (autoFocusRef.current) {
      activeScope = scopeRef;
      const ownerDocument = getOwnerDocument(scopeRef.current ? scopeRef.current[0] : undefined);
      if (!isElementInScope(getActiveElement(ownerDocument), activeScope.current) && scopeRef.current) {
        focusFirstInScope(scopeRef.current);
      }
    }
    autoFocusRef.current = false;
  }, [scopeRef]);
}

function useActiveScopeTracker(scopeRef: RefObject<Element[] | null>, restore?: boolean, contain?: boolean) {
  // tracks the active scope, in case restore and contain are both false.
  // if either are true, this is tracked in useRestoreFocus or useFocusContainment.
  useLayoutEffect(() => {
    if (restore || contain) {
      return;
    }

    let scope = scopeRef.current;
    const ownerDocument = getOwnerDocument(scope ? scope[0] : undefined);

    let onFocus = (e) => {
      let target = getEventTarget(e) as Element;
      if (isElementInScope(target, scopeRef.current)) {
        activeScope = scopeRef;
      } else if (!isElementInAnyScope(target)) {
        activeScope = null;
      }
    };

    ownerDocument.addEventListener('focusin', onFocus, false);
    scope?.forEach(element => element.addEventListener('focusin', onFocus, false));
    return () => {
      ownerDocument.removeEventListener('focusin', onFocus, false);
      scope?.forEach(element => element.removeEventListener('focusin', onFocus, false));
    };
  }, [scopeRef, restore, contain]);
}

function shouldRestoreFocus(scopeRef: ScopeRef) {
  let scope = focusScopeTree.getTreeNode(activeScope);
  while (scope && scope.scopeRef !== scopeRef) {
    if (scope.nodeToRestore) {
      return false;
    }

    scope = scope.parent;
  }

  return scope?.scopeRef === scopeRef;
}

function useRestoreFocus(scopeRef: RefObject<Element[] | null>, restoreFocus?: boolean, contain?: boolean) {
  // create a ref during render instead of useLayoutEffect so the active element is saved before a child with autoFocus=true mounts.
  // eslint-disable-next-line no-restricted-globals
  const nodeToRestoreRef = useRef(typeof document !== 'undefined' ? getActiveElement(getOwnerDocument(scopeRef.current ? scopeRef.current[0] : undefined)) as FocusableElement : null);

  // restoring scopes should all track if they are active regardless of contain, but contain already tracks it plus logic to contain the focus
  // restoring-non-containing scopes should only care if they become active so they can perform the restore
  useLayoutEffect(() => {
    let scope = scopeRef.current;
    const ownerDocument = getOwnerDocument(scope ? scope[0] : undefined);
    if (!restoreFocus || contain) {
      return;
    }

    let onFocus = () => {
      // If focusing an element in a child scope of the currently active scope, the child becomes active.
      // Moving out of the active scope to an ancestor is not allowed.
      if ((!activeScope || isAncestorScope(activeScope, scopeRef)) &&
        isElementInScope(getActiveElement(ownerDocument), scopeRef.current)
      ) {
        activeScope = scopeRef;
      }
    };

    ownerDocument.addEventListener('focusin', onFocus, false);
    scope?.forEach(element => element.addEventListener('focusin', onFocus, false));
    return () => {
      ownerDocument.removeEventListener('focusin', onFocus, false);
      scope?.forEach(element => element.removeEventListener('focusin', onFocus, false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeRef, contain]);

  useLayoutEffect(() => {
    const ownerDocument = getOwnerDocument(scopeRef.current ? scopeRef.current[0] : undefined);

    if (!restoreFocus) {
      return;
    }

    // Handle the Tab key so that tabbing out of the scope goes to the next element
    // after the node that had focus when the scope mounted. This is important when
    // using portals for overlays, so that focus goes to the expected element when
    // tabbing out of the overlay.
    let onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || !shouldContainFocus(scopeRef) || e.isComposing) {
        return;
      }

      let focusedElement = ownerDocument.activeElement as FocusableElement;
      if (!isElementInChildScope(focusedElement, scopeRef) || !shouldRestoreFocus(scopeRef)) {
        return;
      }
      let treeNode = focusScopeTree.getTreeNode(scopeRef);
      if (!treeNode) {
        return;
      }
      let nodeToRestore = treeNode.nodeToRestore;

      // Create a DOM tree walker that matches all tabbable elements
      let walker = getFocusableTreeWalker(ownerDocument.body, {tabbable: true});

      // Find the next tabbable element after the currently focused element
      walker.currentNode = focusedElement;
      let nextElement = (e.shiftKey ? walker.previousNode() : walker.nextNode()) as FocusableElement;

      if (!nodeToRestore || !nodeToRestore.isConnected || nodeToRestore === ownerDocument.body) {
        nodeToRestore = undefined;
        treeNode.nodeToRestore = undefined;
      }

      // If there is no next element, or it is outside the current scope, move focus to the
      // next element after the node to restore to instead.
      if ((!nextElement || !isElementInChildScope(nextElement, scopeRef)) && nodeToRestore) {
        walker.currentNode = nodeToRestore;

        // Skip over elements within the scope, in case the scope immediately follows the node to restore.
        do {
          nextElement = (e.shiftKey ? walker.previousNode() : walker.nextNode()) as FocusableElement;
        } while (isElementInChildScope(nextElement, scopeRef));

        e.preventDefault();
        e.stopPropagation();
        if (nextElement) {
          focusElement(nextElement, true);
        } else {
          // If there is no next element and the nodeToRestore isn't within a FocusScope (i.e. we are leaving the top level focus scope)
          // then move focus to the body.
          // Otherwise restore focus to the nodeToRestore (e.g menu within a popover -> tabbing to close the menu should move focus to menu trigger)
          if (!isElementInAnyScope(nodeToRestore)) {
            focusedElement.blur();
          } else {
            focusElement(nodeToRestore, true);
          }
        }
      }
    };

    if (!contain) {
      ownerDocument.addEventListener('keydown', onKeyDown as EventListener, true);
    }

    return () => {
      if (!contain) {
        ownerDocument.removeEventListener('keydown', onKeyDown as EventListener, true);
      }
    };
  }, [scopeRef, restoreFocus, contain]);

  // useLayoutEffect instead of useEffect so the active element is saved synchronously instead of asynchronously.
  useLayoutEffect(() => {
    const ownerDocument = getOwnerDocument(scopeRef.current ? scopeRef.current[0] : undefined);

    if (!restoreFocus) {
      return;
    }

    let treeNode = focusScopeTree.getTreeNode(scopeRef);
    if (!treeNode) {
      return;
    }
    treeNode.nodeToRestore = nodeToRestoreRef.current ?? undefined;
    return () => {
      let treeNode = focusScopeTree.getTreeNode(scopeRef);
      if (!treeNode) {
        return;
      }
      let nodeToRestore = treeNode.nodeToRestore;

      // if we already lost focus to the body and this was the active scope, then we should attempt to restore
      let activeElement = getActiveElement(ownerDocument);
      if (
        restoreFocus
        && nodeToRestore
        && (
          ((activeElement && isElementInChildScope(activeElement, scopeRef)) || (activeElement === ownerDocument.body && shouldRestoreFocus(scopeRef)))
        )
      ) {
        // freeze the focusScopeTree so it persists after the raf, otherwise during unmount nodes are removed from it
        let clonedTree = focusScopeTree.clone();
        requestAnimationFrame(() => {
          // Only restore focus if we've lost focus to the body, the alternative is that focus has been purposefully moved elsewhere
          if (ownerDocument.activeElement === ownerDocument.body) {
            // look up the tree starting with our scope to find a nodeToRestore still in the DOM
            let treeNode = clonedTree.getTreeNode(scopeRef);
            while (treeNode) {
              if (treeNode.nodeToRestore && treeNode.nodeToRestore.isConnected) {
                restoreFocusToElement(treeNode.nodeToRestore);
                return;
              }
              treeNode = treeNode.parent;
            }

            // If no nodeToRestore was found, focus the first element in the nearest
            // ancestor scope that is still in the tree.
            treeNode = clonedTree.getTreeNode(scopeRef);
            while (treeNode) {
              if (treeNode.scopeRef && treeNode.scopeRef.current && focusScopeTree.getTreeNode(treeNode.scopeRef)) {
                let node = getFirstInScope(treeNode.scopeRef.current, true);
                restoreFocusToElement(node);
                return;
              }
              treeNode = treeNode.parent;
            }
          }
        });
      }
    };
  }, [scopeRef, restoreFocus]);
}

function restoreFocusToElement(node: FocusableElement) {
  // Dispatch a custom event that parent elements can intercept to customize focus restoration.
  // For example, virtualized collection components reuse DOM elements, so the original element
  // might still exist in the DOM but representing a different item.
  if (node.dispatchEvent(new CustomEvent(RESTORE_FOCUS_EVENT, {bubbles: true, cancelable: true}))) {
    focusElement(node);
  }
}

/**
 * Create a [TreeWalker]{@link https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker}
 * that matches all focusable/tabbable elements.
 */
export function getFocusableTreeWalker(root: Element, opts?: FocusManagerOptions, scope?: Element[]): ShadowTreeWalker | TreeWalker {
  let filter = opts?.tabbable ? isTabbable : isFocusable;

  // Ensure that root is an Element or fall back appropriately
  let rootElement = root?.nodeType === Node.ELEMENT_NODE ? (root as Element) : null;

  // Determine the document to use
  let doc = getOwnerDocument(rootElement);

  // Create a TreeWalker, ensuring the root is an Element or Document
  let walker = createShadowTreeWalker(
    doc,
    root || doc,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        // Skip nodes inside the starting node.
        if (opts?.from?.contains(node)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (filter(node as Element)
          && isElementVisible(node as Element)
          && (!scope || isElementInScope(node as Element, scope))
          && (!opts?.accept || opts.accept(node as Element))
        ) {
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
export function createFocusManager(ref: RefObject<Element | null>, defaultOptions: FocusManagerOptions = {}): FocusManager {
  return {
    focusNext(opts: FocusManagerOptions = {}) {
      let root = ref.current;
      if (!root) {
        return null;
      }
      let {from, tabbable = defaultOptions.tabbable, wrap = defaultOptions.wrap, accept = defaultOptions.accept} = opts;
      let node = from || getActiveElement(getOwnerDocument(root));
      let walker = getFocusableTreeWalker(root, {tabbable, accept});
      if (root.contains(node)) {
        walker.currentNode = node!;
      }
      let nextNode = walker.nextNode() as FocusableElement;
      if (!nextNode && wrap) {
        walker.currentNode = root;
        nextNode = walker.nextNode() as FocusableElement;
      }
      if (nextNode) {
        focusElement(nextNode, true);
      }
      return nextNode;
    },
    focusPrevious(opts: FocusManagerOptions = defaultOptions) {
      let root = ref.current;
      if (!root) {
        return null;
      }
      let {from, tabbable = defaultOptions.tabbable, wrap = defaultOptions.wrap, accept = defaultOptions.accept} = opts;
      let node = from || getActiveElement(getOwnerDocument(root));
      let walker = getFocusableTreeWalker(root, {tabbable, accept});
      if (root.contains(node)) {
        walker.currentNode = node!;
      } else {
        let next = last(walker);
        if (next) {
          focusElement(next, true);
        }
        return next ?? null;
      }
      let previousNode = walker.previousNode() as FocusableElement;
      if (!previousNode && wrap) {
        walker.currentNode = root;
        let lastNode = last(walker);
        if (!lastNode) {
          // couldn't wrap
          return null;
        }
        previousNode = lastNode;
      }
      if (previousNode) {
        focusElement(previousNode, true);
      }
      return previousNode ?? null;
    },
    focusFirst(opts = defaultOptions) {
      let root = ref.current;
      if (!root) {
        return null;
      }
      let {tabbable = defaultOptions.tabbable, accept = defaultOptions.accept} = opts;
      let walker = getFocusableTreeWalker(root, {tabbable, accept});
      let nextNode = walker.nextNode() as FocusableElement;
      if (nextNode) {
        focusElement(nextNode, true);
      }
      return nextNode;
    },
    focusLast(opts = defaultOptions) {
      let root = ref.current;
      if (!root) {
        return null;
      }
      let {tabbable = defaultOptions.tabbable, accept = defaultOptions.accept} = opts;
      let walker = getFocusableTreeWalker(root, {tabbable, accept});
      let next = last(walker);
      if (next) {
        focusElement(next, true);
      }
      return next ?? null;
    }
  };
}

function last(walker: ShadowTreeWalker | TreeWalker) {
  let next: FocusableElement | undefined = undefined;
  let last: FocusableElement;
  do {
    last = walker.lastChild() as FocusableElement;
    if (last) {
      next = last;
    }
  } while (last);
  return next;
}


class Tree {
  root: TreeNode;
  private fastMap = new Map<ScopeRef, TreeNode>();

  constructor() {
    this.root = new TreeNode({scopeRef: null});
    this.fastMap.set(null, this.root);
  }

  get size() {
    return this.fastMap.size;
  }

  getTreeNode(data: ScopeRef) {
    return this.fastMap.get(data);
  }

  addTreeNode(scopeRef: ScopeRef, parent: ScopeRef, nodeToRestore?: FocusableElement) {
    let parentNode = this.fastMap.get(parent ?? null);
    if (!parentNode) {
      return;
    }
    let node = new TreeNode({scopeRef});
    parentNode.addChild(node);
    node.parent = parentNode;
    this.fastMap.set(scopeRef, node);
    if (nodeToRestore) {
      node.nodeToRestore = nodeToRestore;
    }
  }

  addNode(node: TreeNode) {
    this.fastMap.set(node.scopeRef, node);
  }

  removeTreeNode(scopeRef: ScopeRef) {
    // never remove the root
    if (scopeRef === null) {
      return;
    }
    let node = this.fastMap.get(scopeRef);
    if (!node) {
      return;
    }
    let parentNode = node.parent;
    // when we remove a scope, check if any sibling scopes are trying to restore focus to something inside the scope we're removing
    // if we are, then replace the siblings restore with the restore from the scope we're removing
    for (let current of this.traverse()) {
      if (
        current !== node &&
        node.nodeToRestore &&
        current.nodeToRestore &&
        node.scopeRef &&
        node.scopeRef.current &&
        isElementInScope(current.nodeToRestore, node.scopeRef.current)
      ) {
        current.nodeToRestore = node.nodeToRestore;
      }
    }
    let children = node.children;
    if (parentNode) {
      parentNode.removeChild(node);
      if (children.size > 0) {
        children.forEach(child => parentNode && parentNode.addChild(child));
      }
    }

    this.fastMap.delete(node.scopeRef);
  }

  // Pre Order Depth First
  *traverse(node: TreeNode = this.root): Generator<TreeNode> {
    if (node.scopeRef != null) {
      yield node;
    }
    if (node.children.size > 0) {
      for (let child of node.children) {
        yield* this.traverse(child);
      }
    }
  }

  clone(): Tree {
    let newTree = new Tree();
    for (let node of this.traverse()) {
      newTree.addTreeNode(node.scopeRef, node.parent?.scopeRef ?? null, node.nodeToRestore);
    }
    return newTree;
  }
}

class TreeNode {
  public scopeRef: ScopeRef;
  public nodeToRestore?: FocusableElement;
  public parent?: TreeNode;
  public children: Set<TreeNode> = new Set();
  public contain = false;

  constructor(props: {scopeRef: ScopeRef}) {
    this.scopeRef = props.scopeRef;
  }
  addChild(node: TreeNode) {
    this.children.add(node);
    node.parent = this;
  }
  removeChild(node: TreeNode) {
    this.children.delete(node);
    node.parent = undefined;
  }
}

export let focusScopeTree = new Tree();
