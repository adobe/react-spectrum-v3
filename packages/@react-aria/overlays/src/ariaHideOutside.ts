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

let refCountMap = new WeakMap<Element, number>();
interface ObserverWrapper {
  visibleNodes: Set<Element>,
  hiddenNodes: Set<Element>,
  observe: () => void,
  disconnect: () => void
}
let observerStack: Array<ObserverWrapper> = [];

function isInShadowDOM(node) {
  return node.getRootNode() instanceof ShadowRoot;
}

// Function to find the shadow root, if any, in the targets
function findShadowRoots(targets) {
  return targets.filter(target => isInShadowDOM(target))?.map(target => target.getRootNode());
}

/**
 * Hides all elements in the DOM outside the given targets from screen readers using aria-hidden,
 * and returns a function to revert these changes. In addition, changes to the DOM are watched
 * and new elements outside the targets are automatically hidden.
 * @param targets - The elements that should remain visible.
 * @param root - Nothing will be hidden above this element.
 * @returns - A function to restore all hidden elements.
 */
export function ariaHideOutside(targets: Element[], root = document.body) {
  let visibleNodes = new Set<Element>(targets);
  let hiddenNodes = new Set<Element>();
  const shadowRoots = findShadowRoots(targets);

  if (shadowRoots.length > 0) {
    const targetsByShadowRoot = new Map<ShadowRoot, Element[]>();

    targets.forEach(target => {
      const root = target.getRootNode();
      if (root instanceof ShadowRoot) {
        if (!targetsByShadowRoot.has(root)) {
          targetsByShadowRoot.set(root, []);
        }
        targetsByShadowRoot.get(root).push(target);
      } else {
        // For non-shadow DOM targets, add all ancestors up to document.body
        let current = target;
        while (current && current !== document.body) {
          visibleNodes.add(current);
          current = current.parentElement;
        }
      }
    });

    // Handle targets in each shadow root
    targetsByShadowRoot.forEach((groupedTargets, shadowRoot) => {
      groupedTargets.forEach(target => {
        // Add the target itself
        visibleNodes.add(target);

        // Add its parent container within shadow root
        if (target.parentElement) {
          visibleNodes.add(target.parentElement);
        }

        // Walk up until we hit the shadow root's immediate child
        let current = target;
        while (current && current.parentElement && current.parentElement !== shadowRoot.host) {
          visibleNodes.add(current.parentElement);
          current = current.parentElement;
        }
      });

      // Add the shadow host and its ancestors up to document.body
      let host = shadowRoot.host;
      while (host && host !== document.body) {
        visibleNodes.add(host);
        if (host.getRootNode() instanceof ShadowRoot) {
          host = (host.getRootNode() as ShadowRoot).host;
        } else {
          host = host.parentElement;
        }
      }
    });

    // Always add document.body
    visibleNodes.add(document.body);
  }

  let walk = (root: Element) => {
    // Keep live announcer and top layer elements (e.g. toasts) visible.
    for (let element of root.querySelectorAll('[data-live-announcer], [data-react-aria-top-layer]')) {
      visibleNodes.add(element);
    }

    let acceptNode = (node: Element) => {
      // Skip this node and its children if it is one of the target nodes, or a live announcer.
      // Also skip children of already hidden nodes, as aria-hidden is recursive. An exception is
      // made for elements with role="row" since VoiceOver on iOS has issues hiding elements with role="row".
      // For that case we want to hide the cells inside as well (https://bugs.webkit.org/show_bug.cgi?id=222623).
      if (
        visibleNodes.has(node) ||
        (node.parentElement && hiddenNodes.has(node.parentElement) && node.parentElement.getAttribute('role') !== 'row')
      ) {
        return NodeFilter.FILTER_REJECT;
      }

      // Skip this node but continue to children if one of the targets is inside the node.
      for (let target of visibleNodes) {
        if (node.contains(target)) {
          return NodeFilter.FILTER_SKIP;
        }
      }

      return NodeFilter.FILTER_ACCEPT;
    };

    let walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {acceptNode}
    );

    // TreeWalker does not include the root.
    let acceptRoot = acceptNode(root);
    if (acceptRoot === NodeFilter.FILTER_ACCEPT) {
      hide(root);
    }

    if (acceptRoot !== NodeFilter.FILTER_REJECT) {
      let node = walker.nextNode() as Element;
      while (node != null) {
        hide(node);
        node = walker.nextNode() as Element;
      }
    }
  };

  let hide = (node: Element) => {
    let refCount = refCountMap.get(node) ?? 0;

    if (!(node instanceof Element)) {
      return;
    }

    // If already aria-hidden, and the ref count is zero, then this element
    // was already hidden and there's nothing for us to do.
    if (node.getAttribute('aria-hidden') === 'true' && refCount === 0) {
      return;
    }

    if (refCount === 0) {
      node.setAttribute('aria-hidden', 'true');
    }

    hiddenNodes.add(node);
    refCountMap.set(node, refCount + 1);
  };

  // Function to hide an element's siblings
  const hideSiblings = (element: Element) => {
    let parentNode = element.parentNode;
    if (parentNode) {
      parentNode.childNodes.forEach((sibling:  Element) => {
        if (sibling !== element && !visibleNodes.has(sibling) && !hiddenNodes.has(sibling)) {
          hide(sibling);
        }
      });
    }
  };

  if (shadowRoots.length > 0) {
    targets.forEach(target => {
      let current = target;
      // Process up to and including the body element
      while (current && current !== document.body) {
        hideSiblings(current);
        if (current.parentNode instanceof ShadowRoot) {
          current = current.parentNode.host;
        } else {
          // Otherwise, just move to the parent node
          current = current.parentNode as Element;
        }
      }
    });
  }

  // If there is already a MutationObserver listening from a previous call,
  // disconnect it so the new on takes over.
  if (observerStack.length) {
    observerStack[observerStack.length - 1].disconnect();
  }

  walk(root);

  let observer = new MutationObserver(changes => {
    for (let change of changes) {
      if (change.type !== 'childList' || change.addedNodes.length === 0) {
        continue;
      }

      // If the parent element of the added nodes is not within one of the targets,
      // and not already inside a hidden node, hide all of the new children.
      if (![...visibleNodes, ...hiddenNodes].some(node => node.contains(change.target))) {
        for (let node of change.removedNodes) {
          if (node instanceof Element) {
            visibleNodes.delete(node);
            hiddenNodes.delete(node);
          }
        }

        for (let node of change.addedNodes) {
          if (
            (node instanceof HTMLElement || node instanceof SVGElement) &&
            (node.dataset.liveAnnouncer === 'true' || node.dataset.reactAriaTopLayer === 'true')
          ) {
            visibleNodes.add(node);
          } else if (node instanceof Element) {
            walk(node);
          }
        }
      }
    }
  });

  if (shadowRoots.length > 0) {
    shadowRoots.forEach(shadowRoot => {
      observer.observe(shadowRoot, {childList: true, subtree: true});
    });
  }

  observer.observe(root, {childList: true, subtree: true});

  let observerWrapper: ObserverWrapper = {
    visibleNodes,
    hiddenNodes,
    observe() {
      observer.observe(root, {childList: true, subtree: true});
    },
    disconnect() {
      observer.disconnect();
    }
  };

  observerStack.push(observerWrapper);

  return () => {
    observer.disconnect();

    if (shadowRoots.length > 0) {
      shadowRoots.forEach(() => {
        observer.disconnect();
      });
    }

    for (let node of hiddenNodes) {
      let count = refCountMap.get(node);
      if (count == null) {
        continue;
      }
      if (count === 1) {
        node.removeAttribute('aria-hidden');
        refCountMap.delete(node);
      } else {
        refCountMap.set(node, count - 1);
      }
    }

    // Remove this observer from the stack, and start the previous one.
    if (observerWrapper === observerStack[observerStack.length - 1]) {
      observerStack.pop();
      if (observerStack.length) {
        observerStack[observerStack.length - 1].observe();
      }
    } else {
      observerStack.splice(observerStack.indexOf(observerWrapper), 1);
    }
  };
}

export function keepVisible(element: Element) {
  let observer = observerStack[observerStack.length - 1];
  if (observer && !observer.visibleNodes.has(element)) {
    observer.visibleNodes.add(element);
    return () => {
      observer.visibleNodes.delete(element);
    };
  }
}
