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

import {ariaHideOutside} from '../src';
import React from 'react';
import ReactDOM from 'react-dom';
import {render, waitFor} from '@react-spectrum/test-utils-internal';

describe('ariaHideOutside', function () {
  it('should hide everything except the provided element [button]', function () {
    let {getByRole, getAllByRole} = render(
      <>
        <input type="checkbox" />
        <button>Button</button>
        <input type="checkbox" />
      </>
    );

    let checkboxes = getAllByRole('checkbox');
    let button = getByRole('button');

    let revert = ariaHideOutside([button]);

    expect(checkboxes[0]).toHaveAttribute('aria-hidden', 'true');
    expect(checkboxes[1]).toHaveAttribute('aria-hidden', 'true');
    expect(button).not.toHaveAttribute('aria-hidden');

    expect(() => getAllByRole('checkbox')).toThrow();
    expect(() => getByRole('button')).not.toThrow();

    revert();

    expect(checkboxes[0]).not.toHaveAttribute('aria-hidden');
    expect(checkboxes[1]).not.toHaveAttribute('aria-hidden');
    expect(button).not.toHaveAttribute('aria-hidden');

    expect(() => getAllByRole('checkbox')).not.toThrow();
    expect(() => getByRole('button')).not.toThrow();
  });

  it('should hide everything except multiple elements', function () {
    let {getByRole, getAllByRole, queryByRole, queryAllByRole} = render(
      <>
        <input type="checkbox" />
        <button>Button</button>
        <input type="checkbox" />
      </>
    );

    let checkboxes = getAllByRole('checkbox');
    let button = getByRole('button');

    let revert = ariaHideOutside(checkboxes);

    expect(checkboxes[0]).not.toHaveAttribute('aria-hidden', 'true');
    expect(checkboxes[1]).not.toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveAttribute('aria-hidden');

    expect(queryAllByRole('checkbox')).not.toBeNull();
    expect(queryByRole('button')).toBeNull();

    revert();

    expect(checkboxes[0]).not.toHaveAttribute('aria-hidden');
    expect(checkboxes[1]).not.toHaveAttribute('aria-hidden');
    expect(button).not.toHaveAttribute('aria-hidden');

    expect(() => getAllByRole('checkbox')).not.toThrow();
    expect(() => getByRole('button')).not.toThrow();
  });

  it('should not traverse into an already hidden container', function () {
    let {getByRole, getAllByRole} = render(
      <>
        <div>
          <input type="checkbox" />
        </div>
        <button>Button</button>
        <input type="checkbox" />
      </>
    );

    let checkboxes = getAllByRole('checkbox');
    let button = getByRole('button');

    let revert = ariaHideOutside([button]);

    expect(checkboxes[0].parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(checkboxes[1]).toHaveAttribute('aria-hidden', 'true');
    expect(button).not.toHaveAttribute('aria-hidden');

    expect(() => getAllByRole('checkbox')).toThrow();
    expect(() => getByRole('button')).not.toThrow();

    revert();

    expect(checkboxes[0].parentElement).not.toHaveAttribute('aria-hidden');
    expect(checkboxes[1]).not.toHaveAttribute('aria-hidden');
    expect(button).not.toHaveAttribute('aria-hidden');

    expect(() => getAllByRole('checkbox')).not.toThrow();
    expect(() => getByRole('button')).not.toThrow();
  });

  it('should not overwrite an existing aria-hidden prop', function () {
    let {getByRole, getAllByRole} = render(
      <>
        <input type="checkbox" aria-hidden="true" />
        <button>Button</button>
        <input type="checkbox" />
      </>
    );

    let checkboxes = getAllByRole('checkbox');
    let button = getByRole('button');

    let revert = ariaHideOutside([button]);

    expect(checkboxes).toHaveLength(1);
    expect(checkboxes[0]).toHaveAttribute('aria-hidden', 'true');
    expect(button).not.toHaveAttribute('aria-hidden');

    expect(() => getAllByRole('checkbox')).toThrow();
    expect(() => getByRole('button')).not.toThrow();

    revert();

    checkboxes = getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(1);
    expect(checkboxes[0]).not.toHaveAttribute('aria-hidden');
    expect(button).not.toHaveAttribute('aria-hidden');

    expect(() => getAllByRole('checkbox')).not.toThrow();
    expect(() => getByRole('button')).not.toThrow();
  });

  it('should handle when a new element is added outside while active', async function () {
    let Test = props => (
      <>
        {props.show && <input type="checkbox" />}
        <button>Button</button>
        {props.show && <input type="checkbox" />}
      </>
    );

    let {getByRole, getAllByRole, rerender} = render(<Test />);

    let button = getByRole('button');
    expect(() => getAllByRole('checkbox')).toThrow();

    let revert = ariaHideOutside([button]);

    rerender(<Test show />);

    // MutationObserver is async
    await waitFor(() => expect(() => getAllByRole('checkbox')).toThrow());
    expect(() => getByRole('button')).not.toThrow();

    revert();

    expect(getAllByRole('checkbox')).toHaveLength(2);
  });

  it('should handle when a new element is added to an already hidden container', async function () {
    let Test = props => (
      <>
        <div data-testid="test">
          {props.show && <input type="checkbox" />}
        </div>
        <button>Button</button>
        {props.show && <input type="checkbox" />}
      </>
    );

    let {getByRole, getAllByRole, getByTestId, rerender} = render(<Test />);

    let button = getByRole('button');
    let test = getByTestId('test');
    expect(() => getAllByRole('checkbox')).toThrow();

    let revert = ariaHideOutside([button]);

    expect(test).toHaveAttribute('aria-hidden');

    rerender(<Test show />);

    // MutationObserver is async
    await waitFor(() => expect(() => getAllByRole('checkbox')).toThrow());
    expect(() => getByRole('button')).not.toThrow();

    let checkboxes = getAllByRole('checkbox', {hidden: true});
    expect(test).toHaveAttribute('aria-hidden');
    expect(checkboxes[0]).not.toHaveAttribute('aria-hidden');
    expect(checkboxes[1]).toHaveAttribute('aria-hidden', 'true');

    revert();

    expect(getAllByRole('checkbox')).toHaveLength(2);
  });

  it('should handle when a new element is added along with a top layer element', async function () {
    let Test = props => (
      <>
        <button>Button</button>
        {props.show && <div>
          <div role="alert" data-react-aria-top-layer="true">Top layer</div>
          <input type="checkbox" />
        </div>}
      </>
    );

    let {getByRole, queryByRole, getAllByRole, rerender} = render(<Test />);

    let button = getByRole('button');
    expect(queryByRole('checkbox')).toBeNull();

    let revert = ariaHideOutside([button]);

    rerender(<Test show />);

    // MutationObserver is async
    await waitFor(() => queryByRole('checkbox') == null);
    expect(queryByRole('button')).not.toBeNull();
    expect(getByRole('alert')).toHaveTextContent('Top layer');

    revert();

    expect(getAllByRole('checkbox')).toHaveLength(1);
  });

  it('should handle when a new element is added inside a target element', async function () {
    let Test = props => (
      <>
        <input type="checkbox" />
        <div data-testid="test">
          <button>Button</button>
          {props.show && <input type="radio" />}
        </div>
        <input type="checkbox" />
      </>
    );

    let {queryByRole, getByRole, getAllByRole, getByTestId, rerender} = render(<Test />);

    let test = getByTestId('test');
    let revert = ariaHideOutside([test]);

    expect(() => getAllByRole('checkbox')).toThrow();
    expect(queryByRole('radio')).toBeNull();
    expect(queryByRole('button')).not.toBeNull();
    expect(() => getByTestId('test')).not.toThrow();

    rerender(<Test show />);

    // Wait for mutation observer tick
    await Promise.resolve();
    expect(() => getAllByRole('checkbox')).toThrow();
    expect(() => getByRole('radio')).not.toThrow();
    expect(() => getByRole('button')).not.toThrow();
    expect(() => getByTestId('test')).not.toThrow();

    revert();

    expect(() => getAllByRole('checkbox')).not.toThrow();
    expect(() => getByRole('radio')).not.toThrow();
    expect(() => getByRole('button')).not.toThrow();
    expect(() => getByTestId('test')).not.toThrow();
  });

  it('work when called multiple times', function () {
    let {getByRole, getAllByRole} = render(
      <>
        <input type="checkbox" />
        <input type="radio" />
        <button>Button</button>
        <input type="radio" />
        <input type="checkbox" />
      </>
    );

    let radios = getAllByRole('radio');
    let button = getByRole('button');

    let revert1 = ariaHideOutside([button, ...radios]);

    expect(() => getAllByRole('checkbox')).toThrow();
    expect(() => getAllByRole('radio')).not.toThrow();
    expect(() => getByRole('button')).not.toThrow();

    let revert2 = ariaHideOutside([button]);

    expect(() => getAllByRole('checkbox')).toThrow();
    expect(() => getAllByRole('radio')).toThrow();
    expect(() => getByRole('button')).not.toThrow();

    revert2();

    expect(() => getAllByRole('checkbox')).toThrow();
    expect(() => getAllByRole('radio')).not.toThrow();
    expect(() => getByRole('button')).not.toThrow();

    revert1();

    expect(() => getAllByRole('checkbox')).not.toThrow();
    expect(() => getAllByRole('radio')).not.toThrow();
    expect(() => getByRole('button')).not.toThrow();
  });

  it('work when called multiple times and restored out of order', function () {
    let {getByRole, getAllByRole} = render(
      <>
        <input type="checkbox" />
        <input type="radio" />
        <button>Button</button>
        <input type="radio" />
        <input type="checkbox" />
      </>
    );

    let radios = getAllByRole('radio');
    let button = getByRole('button');

    let revert1 = ariaHideOutside([button, ...radios]);

    expect(() => getAllByRole('checkbox')).toThrow();
    expect(() => getAllByRole('radio')).not.toThrow();
    expect(() => getByRole('button')).not.toThrow();

    let revert2 = ariaHideOutside([button]);

    expect(() => getAllByRole('checkbox')).toThrow();
    expect(() => getAllByRole('radio')).toThrow();
    expect(() => getByRole('button')).not.toThrow();

    revert1();

    expect(() => getAllByRole('checkbox')).toThrow();
    expect(() => getAllByRole('radio')).toThrow();
    expect(() => getByRole('button')).not.toThrow();

    revert2();

    expect(() => getAllByRole('checkbox')).not.toThrow();
    expect(() => getAllByRole('radio')).not.toThrow();
    expect(() => getByRole('button')).not.toThrow();
  });

  it('should hide everything except the provided element [row]', function () {
    let {getAllByRole} = render(
      <div role="grid">
        <div role="row">
          <div role="gridcell">Cell 1</div>
        </div>
        <div role="row">
          <div role="gridcell">Cell 2</div>
        </div>
      </div>
    );

    let cells = getAllByRole('gridcell');
    let rows = getAllByRole('row');

    let revert = ariaHideOutside([rows[1]]);

    // Applies aria-hidden to the row and cell despite recursive nature of aria-hidden
    // for https://bugs.webkit.org/show_bug.cgi?id=222623
    expect(rows[0]).toHaveAttribute('aria-hidden', 'true');
    expect(cells[0]).toHaveAttribute('aria-hidden', 'true');
    expect(rows[1]).not.toHaveAttribute('aria-hidden', 'true');
    expect(cells[1]).not.toHaveAttribute('aria-hidden', 'true');

    revert();

    expect(rows[0]).not.toHaveAttribute('aria-hidden', 'true');
    expect(cells[0]).not.toHaveAttribute('aria-hidden', 'true');
    expect(rows[1]).not.toHaveAttribute('aria-hidden', 'true');
    expect(cells[1]).not.toHaveAttribute('aria-hidden', 'true');
  });

  function isEffectivelyHidden(element) {
    while (element && element.getAttribute) {
      const ariaHidden = element.getAttribute('aria-hidden');
      if (ariaHidden === 'true') {
        return true;
      } else if (ariaHidden === 'false') {
        return false;
      }
      const rootNode = element.getRootNode ? element.getRootNode() : document;
      element = element.parentNode || (rootNode !== document ? rootNode.host : null);
    }
    return false;
  }

  describe('ariaHideOutside with Shadow DOM', () => {
    it('should not apply aria-hidden to direct parents of the shadow root', () => {
      const div1 = document.createElement('div');
      div1.id = 'parent1';
      const div2 = document.createElement('div');
      div2.id = 'parent2';
      div1.appendChild(div2);
      document.body.appendChild(div1);

      const shadowRoot = div2.attachShadow({mode: 'open'});
      const ExampleModal = () => (
        <>
          <div id="modal" role="dialog">Modal Content</div>
        </>
      );
      ReactDOM.render(<ExampleModal />, shadowRoot);

      ariaHideOutside([shadowRoot.getElementById('modal')], shadowRoot);

      expect(isEffectivelyHidden(document.getElementById('parent1'))).toBeFalsy();
      expect(isEffectivelyHidden(document.getElementById('parent2'))).toBeFalsy();
      expect(isEffectivelyHidden(document.body)).toBeFalsy();

      expect(isEffectivelyHidden(shadowRoot.getElementById('modal'))).toBeFalsy();
    });

    it('should correctly apply aria-hidden based on shadow DOM structure', () => {
      const div1 = document.createElement('div');
      div1.id = 'parent1';
      const div2 = document.createElement('div');
      div2.id = 'parent2';
      div1.appendChild(div2);
      document.body.appendChild(div1);

      const shadowRoot = div2.attachShadow({mode: 'open'});
      shadowRoot.innerHTML = '<div id="modal" role="dialog">Modal Content</div>';

      shadowRoot.innerHTML += '<div id="insideContent">Inside Shadow Content</div>';

      const outsideContent = document.createElement('div');
      outsideContent.id = 'outsideContent';
      outsideContent.textContent = 'Outside Content';
      document.body.appendChild(outsideContent);

      ariaHideOutside([shadowRoot.getElementById('modal')], shadowRoot);

      expect(isEffectivelyHidden(div1)).toBeFalsy();
      expect(isEffectivelyHidden(div2)).toBeFalsy();

      expect(isEffectivelyHidden(shadowRoot.querySelector('#insideContent'))).toBe(true);

      expect(isEffectivelyHidden(shadowRoot.querySelector('#modal'))).toBeFalsy();

      expect(isEffectivelyHidden(outsideContent)).toBe(true);

      expect(isEffectivelyHidden(document.body)).toBeFalsy();
    });

    it('should hide non-direct parent elements like header when modal is in Shadow DOM', () => {
      const header = document.createElement('header');
      header.id = 'header';
      document.body.appendChild(header);

      const div1 = document.createElement('div');
      div1.id = 'parent1';
      const div2 = document.createElement('div');
      div2.id = 'parent2';
      div1.appendChild(div2);
      document.body.appendChild(div1);

      const shadowRoot = div2.attachShadow({mode: 'open'});
      const modal = document.createElement('div');
      modal.id = 'modal';
      modal.setAttribute('role', 'dialog');
      modal.textContent = 'Modal Content';
      shadowRoot.appendChild(modal);

      ariaHideOutside([modal]);

      expect(isEffectivelyHidden(header)).toBe(true);

      expect(isEffectivelyHidden(div1)).toBe(false);
      expect(isEffectivelyHidden(div2)).toBe(false);

      expect(isEffectivelyHidden(modal)).toBe(false);

      document.body.removeChild(header);
      document.body.removeChild(div1);
    });

    it('should handle a modal inside nested Shadow DOM structures and hide sibling content in the outer shadow root', () => {
      const outerDiv = document.createElement('div');
      document.body.appendChild(outerDiv);
      const outerShadowRoot = outerDiv.attachShadow({mode: 'open'});
      const innerDiv = document.createElement('div');
      outerShadowRoot.appendChild(innerDiv);
      const innerShadowRoot = innerDiv.attachShadow({mode: 'open'});

      const modal = document.createElement('div');
      modal.setAttribute('role', 'dialog');
      modal.textContent = 'Modal Content';
      innerShadowRoot.appendChild(modal);

      const outsideContent = document.createElement('div');
      outsideContent.textContent = 'Outside Content';
      document.body.appendChild(outsideContent);

      const siblingContent = document.createElement('div');
      siblingContent.textContent = 'Sibling Content';
      outerShadowRoot.appendChild(siblingContent);

      ariaHideOutside([modal], innerShadowRoot);

      expect(isEffectivelyHidden(modal)).toBe(false);

      expect(isEffectivelyHidden(outsideContent)).toBe(true);

      expect(isEffectivelyHidden(siblingContent)).toBe(true);

      document.body.removeChild(outerDiv);
      document.body.removeChild(outsideContent);
    });

    it('should handle a modal inside deeply nested Shadow DOM structures', async () => {
      // Create a deep nested shadow DOM structure
      const createNestedShadowRoot = (depth, currentDepth = 0) => {
        const div = document.createElement('div');
        if (currentDepth < depth) {
          const shadowRoot = div.attachShadow({mode: 'open'});
          shadowRoot.appendChild(createNestedShadowRoot(depth, currentDepth + 1));
        } else {
          div.innerHTML = '<div id="modal" role="dialog">Modal Content</div>';
        }
        return div;
      };

      const nestedShadowRootContainer = createNestedShadowRoot(3); // Adjust the depth as needed
      document.body.appendChild(nestedShadowRootContainer);

      // Get the deepest shadow root
      const getDeepestShadowRoot = (node) => {
        while (node.shadowRoot) {
          node = node.shadowRoot.childNodes[0];
        }
        return node;
      };

      const deepestElement = getDeepestShadowRoot(nestedShadowRootContainer);
      const modal = deepestElement.querySelector('#modal');

      // Apply ariaHideOutside
      ariaHideOutside([modal]);

      // Check visibility
      expect(modal.getAttribute('aria-hidden')).toBeNull();
      expect(isEffectivelyHidden(modal)).toBeFalsy();

      // Add checks for other elements as needed to ensure correct `aria-hidden` application
    });

    it('should handle dynamic content added to the shadow DOM after ariaHideOutside is applied', async () => {
      // This test checks if the MutationObserver logic within ariaHideOutside correctly handles new elements added to the shadow DOM
      const div1 = document.createElement('div');
      div1.id = 'parent1';
      document.body.appendChild(div1);

      const shadowRoot = div1.attachShadow({mode: 'open'});
      let ExampleDynamicContent = ({showExtraContent}) => (
        <>
          <div id="modal" role="dialog">Modal Content</div>
          {showExtraContent && <div id="extraContent">Extra Content</div>}
        </>
      );

      ReactDOM.render(<ExampleDynamicContent showExtraContent={false} />, shadowRoot);

      // Apply ariaHideOutside
      ariaHideOutside([shadowRoot.getElementById('modal')]);

      // Dynamically update the content inside the Shadow DOM
      ReactDOM.render(<ExampleDynamicContent showExtraContent />, shadowRoot);

      // Ideally, use a utility function to wait for the MutationObserver callback to run, then check expectations
      await waitForMutationObserver();

      // Expectations
      expect(shadowRoot.getElementById('extraContent').getAttribute('aria-hidden')).toBe('true');
    });
  });

  function waitForMutationObserver() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  describe('ariaHideOutside with nested Shadow DOMs', () => {
    it('should hide appropriate elements including those in nested shadow roots without targets', () => {
      // Set up the initial DOM with shadow hosts and content.
      document.body.innerHTML = `
      <div id="P1">
        <div id="C1"></div>
        <div id="C2"></div>
      </div>
      <div id="P2">
        <div id="C3"></div>
        <div id="C4"></div>
      </div>
    `;

      // Create the first shadow root for C3 and append children to it.
      const shadowHostC3 = document.querySelector('#C3');
      const shadowRootC3 = shadowHostC3.attachShadow({mode: 'open'});
      shadowRootC3.innerHTML = `
      <div id="innerC1">Inner Content C3-1</div>
      <div id="innerC2">Inner Content C3-2</div>
    `;

      // Create the second shadow root for C4 and append children to it.
      const shadowHostC4 = document.querySelector('#C4');
      const shadowRootC4 = shadowHostC4.attachShadow({mode: 'open'});
      shadowRootC4.innerHTML = `
      <div id="C5"></div>
      <div id="C6"></div>
    `;

      // Create a nested shadow root inside C6 and append a modal element to it.
      const divC6 = shadowRootC4.querySelector('#C6');
      const shadowRootC6 = divC6.attachShadow({mode: 'open'});
      shadowRootC6.innerHTML = `
      <div id="modal">Modal Content</div>
    `;

      // Execute ariaHideOutside targeting the modal and C1.
      const modalElement = shadowRootC6.querySelector('#modal');
      const c1Element = document.querySelector('#C1');
      ariaHideOutside([modalElement, c1Element]);

      // Assertions to check the visibility
      expect(c1Element.getAttribute('aria-hidden')).toBeNull();
      expect(modalElement.getAttribute('aria-hidden')).toBeNull();

      // Parents of the modal and C1 should be visible
      expect(shadowHostC4.getAttribute('aria-hidden')).toBeNull();
      expect(document.getElementById('P1').getAttribute('aria-hidden')).toBeNull();
      expect(document.getElementById('P2').getAttribute('aria-hidden')).toBeNull();

      // Siblings and other elements should be hidden
      expect(document.getElementById('C2').getAttribute('aria-hidden')).toBe('true');
      expect(shadowHostC3.getAttribute('aria-hidden')).toBe('true');
      expect(shadowRootC4.querySelector('#C5').getAttribute('aria-hidden')).toBe('true');
    });

    it('should handle input and popup pattern in shadow DOM', () => {
      // Set up the initial DOM with shadow hosts and content
      document.body.innerHTML = `
    <div id="P1">
      <div id="C1"></div>
      <div id="C2"></div>
    </div>
    <div id="P2">
      <div id="C3"></div>
      <div id="C4"></div>
    </div>
  `;

      // Create a shadow root that will contain both our input and overlay
      const shadowHostC4 = document.querySelector('#C4');
      const shadowRootC4 = shadowHostC4.attachShadow({mode: 'open'});
      shadowRootC4.innerHTML = `
    <div class="content-container-2"></div>
    <div class="content-container">
      <input type="text" id="input" />
    </div>
    <div class="overlay-portal">
      <div id="popup">Popup</div>
    </div>
  `;

      // Get our target elements (input and popup) that should remain visible
      const inputElement = shadowRootC4.querySelector('#input');
      const popupElement = shadowRootC4.querySelector('#popup');

      // Call ariaHideOutside with both the input and popup as targets
      ariaHideOutside([inputElement, popupElement]);

      // Input and popup should remain visible
      expect(inputElement.getAttribute('aria-hidden')).toBeNull();
      expect(popupElement.getAttribute('aria-hidden')).toBeNull();

      // Their direct containers should remain visible
      expect(shadowRootC4.querySelector('.content-container').getAttribute('aria-hidden')).toBeNull();
      expect(shadowRootC4.querySelector('.overlay-portal').getAttribute('aria-hidden')).toBeNull();

      // The unrelated container should be hidden
      expect(shadowRootC4.querySelector('.content-container-2').getAttribute('aria-hidden')).toBe('true');

      // Shadow host and its parent should be visible since they contain our targets
      expect(shadowHostC4.getAttribute('aria-hidden')).toBeNull();
      expect(document.getElementById('P2').getAttribute('aria-hidden')).toBeNull();
    });
  });
});
