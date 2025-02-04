export const getOwnerDocument = (el: Element | null | undefined): Document => {
  return el?.ownerDocument ?? document;
};

export const getOwnerWindow = (
  el: (Window & typeof global) | Element | null | undefined
): Window & typeof global => {
  if (el && 'window' in el && el.window === el) {
    return el;
  }

  const doc = getOwnerDocument(el as Element | null | undefined);
  return doc.defaultView || window;
};

/**
 * Type guard that checks if a value is a Node. Verifies the presence and type of the nodeType property.
 */
function isNode(value: unknown): value is Node {
  return value !== null &&
    typeof value === 'object' &&
    'nodeType' in value &&
    typeof (value as Node).nodeType === 'number';
}
/**
 * Type guard that checks if a node is a ShadowRoot. Uses nodeType and host property checks to
 * distinguish ShadowRoot from other DocumentFragments.
 */
export function isShadowRoot(node: Node | null): node is ShadowRoot {
  return isNode(node) &&
    node.nodeType === Node.DOCUMENT_FRAGMENT_NODE &&
    'host' in node;
}
