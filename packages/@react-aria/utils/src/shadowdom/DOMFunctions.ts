// Source: https://github.com/microsoft/tabster/blob/a89fc5d7e332d48f68d03b1ca6e344489d1c3898/src/Shadowdomize/DOMFunctions.ts#L16

import {isShadowRoot} from '../domHelpers';
import {shadowDOM} from '@react-stately/flags';

/**
 * ShadowDOM safe version of Node.contains.
 */
export function nodeContains(
  node: Node | null | undefined,
  otherNode: Node | null | undefined
): boolean {
  if (!shadowDOM()) {
    return otherNode && node ? node.contains(otherNode) : false;
  }

  if (!node || !otherNode) {
    return false;
  }

  let currentNode: HTMLElement | Node | null | undefined = otherNode;

  while (currentNode !== null) {
    if (currentNode === node) {
      return true;
    }

    if ((currentNode as HTMLSlotElement).tagName === 'SLOT' &&
      (currentNode as HTMLSlotElement).assignedSlot) {
      // Element is slotted
      currentNode = (currentNode as HTMLSlotElement).assignedSlot!.parentNode;
    } else if (isShadowRoot(currentNode)) {
      // Element is in shadow root
      currentNode = currentNode.host;
    } else {
      currentNode = currentNode.parentNode;
    }
  }

  return false;
}

/**
 * ShadowDOM safe version of document.activeElement.
 */
export const getActiveElement = (doc: Document = document) => {
  if (!shadowDOM()) {
    return doc.activeElement;
  }
  let activeElement: Element | null = doc.activeElement;

  while (activeElement && 'shadowRoot' in activeElement &&
  activeElement.shadowRoot?.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement;
  }

  return activeElement;
};

/**
 * ShadowDOM safe version of event.target.
 */
export function getEventTarget(event): Element {
  if (shadowDOM() && event.target.shadowRoot) {
    if (event.composedPath) {
      return event.composedPath()[0];
    }
  }
  return event.target;
}
