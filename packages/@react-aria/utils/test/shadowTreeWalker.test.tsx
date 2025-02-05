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

import {createShadowRoot, render} from '@react-spectrum/test-utils-internal';
import {createShadowTreeWalker} from '../src';
import {enableShadowDOM} from '@react-stately/flags';
import React from 'react';
import ReactDOM from 'react-dom';

describe('ShadowTreeWalker', () => {
  beforeAll(() => {
    enableShadowDOM();
  });
  describe('Shadow free', () => {
    it('walks through the dom', () => {
      render(
        <>
          <div id="div-one" />
          <input id="input-one" />
          <div id="div-two" />
          <input id="input-two" />
          <div id="div-three" />
          <input id="input-three" />
          <div id="div-four" />
        </>
      );
      let realTreeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL);
      let walker = createShadowTreeWalker(document, document.body);
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.firstChild()).toBe(realTreeWalker.firstChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.nextNode()).toBe(realTreeWalker.nextNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.previousNode()).toBe(realTreeWalker.previousNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.lastChild()).toBe(realTreeWalker.lastChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
    });

    it('walks through the dom with a filter function', () => {
      render(
        <>
          <div id="div-one" />
          <input id="input-one" />
          <div id="div-two" />
          <input id="input-two" />
          <div id="div-three" />
          <input id="input-three" />
          <div id="div-four" />
        </>
      );
      let filterFn = (node) => {
        if (node.tagName === 'INPUT') {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      };
      let realTreeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL, filterFn);
      let walker = createShadowTreeWalker(document, document.body, undefined, filterFn);
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.firstChild()).toBe(realTreeWalker.firstChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.nextNode()).toBe(realTreeWalker.nextNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.previousNode()).toBe(realTreeWalker.previousNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.lastChild()).toBe(realTreeWalker.lastChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
    });

    it('walks through nested dom with a filter object', () => {
      render(
        <>
          <div id="div-one">
            <input id="input-one" />
            <div id="div-two">
              <input id="input-two" />
              <div id="div-three" />
            </div>
            <input id="input-three" />
            <div id="div-four" />
          </div>
        </>
      );
      let realFilterFn = jest.fn((node) => {
        if (node.tagName === 'INPUT') {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      });
      let filterFn = jest.fn((node) => {
        if (node.tagName === 'INPUT') {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      });
      let realTreeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL, realFilterFn);
      let walker = createShadowTreeWalker(document, document.body, undefined, filterFn);
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.firstChild()).toBe(realTreeWalker.firstChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.nextNode()).toBe(realTreeWalker.nextNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.previousNode()).toBe(realTreeWalker.previousNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.lastChild()).toBe(realTreeWalker.lastChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);

      expect(filterFn).toHaveBeenCalledTimes(realFilterFn.mock.calls.length);
      for (let i = 0; i < realFilterFn.mock.calls.length; i++) {
        expect(filterFn.mock.calls[i][0]).toBe(realFilterFn.mock.calls[i][0]);
      }
    });
  });

  describe('Shadow dom at root', () => {
    it('walks through the dom with shadow dom', () => {
      let {shadowRoot, cleanup} = createShadowRoot();
      let Contents = () => ReactDOM.createPortal(
        <>
          <div id="div-one" />
          <input id="input-one" />
          <div id="div-two" />
          <input id="input-two" />
          <div id="div-three" />
          <input id="input-three" />
          <div id="div-four" />
        </>
      , shadowRoot);
      let {unmount} = render(<Contents />);
      let filterFn = (node) => {
        if (node.tagName === 'INPUT') {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      };
      let realTreeWalker = document.createTreeWalker(shadowRoot, NodeFilter.SHOW_ALL, filterFn);
      let walker = createShadowTreeWalker(document, document.body, undefined, filterFn);
      expect(walker.firstChild()).toBe(realTreeWalker.firstChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.firstChild()).toBe(realTreeWalker.firstChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.nextNode()).toBe(realTreeWalker.nextNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.previousNode()).toBe(realTreeWalker.previousNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.lastChild()).toBe(realTreeWalker.lastChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.lastChild()).toBe(realTreeWalker.lastChild());
      cleanup();
      unmount();
    });
  });

  describe('multiple shadow doms', () => {
    it('walks through the dom with multiple peer level shadow doms', () => {
      let {shadowRoot, shadowHost, cleanup} = createShadowRoot();
      shadowHost.setAttribute('id', 'num-1');
      let {shadowRoot: shadowRoot2, shadowHost: shadowHost2, cleanup: cleanup2} = createShadowRoot();
      shadowHost2.setAttribute('id', 'num-2');
      let Contents = () => ReactDOM.createPortal(
        <>
          <div id="div-one" />
          <input id="input-one" />
          <div id="div-two" />
          <input id="input-two" />
          <div id="div-three" />
          <input id="input-three" />
          <div id="div-four" />
        </>
      , shadowRoot);
      let Contents2 = () => ReactDOM.createPortal(
        <>
          <div id="div-five" />
          <input id="input-four" />
          <div id="div-six" />
          <input id="input-five" />
          <div id="div-seven" />
          <input id="input-six" />
          <div id="div-eight" />
        </>
      , shadowRoot2);
      let {unmount} = render(<><Contents /><Contents2 /></>);
      let filterFn = (node) => {
        if (node.tagName === 'INPUT') {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      };
      let realTreeWalker = document.createTreeWalker(shadowRoot, NodeFilter.SHOW_ALL, filterFn);
      let walker = createShadowTreeWalker(document, document.body, undefined, filterFn);
      expect(walker.firstChild()).toBe(realTreeWalker.firstChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.firstChild()).toBe(realTreeWalker.firstChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.nextNode()).toBe(realTreeWalker.nextNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.previousNode()).toBe(realTreeWalker.previousNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.nextNode()).toBe(realTreeWalker.nextNode());
      expect(walker.nextNode()).toBe(realTreeWalker.nextNode());
      let realTreeWalker2 = document.createTreeWalker(shadowRoot2, NodeFilter.SHOW_ALL, filterFn);
      expect(walker.nextNode()).toBe(realTreeWalker2.nextNode());
      expect(walker.previousNode()).toBe(realTreeWalker.currentNode);

      cleanup();
      cleanup2();
      unmount();
    });

    it('walks through the dom with multiple nested shadow doms', () => {
      let {shadowHost, cleanup} = createShadowRoot();
      shadowHost.setAttribute('id', 'parent');
      let {shadowRoot: shadowRoot1, shadowHost: shadowHost1, cleanup: cleanup2} = createShadowRoot(shadowHost);
      shadowHost1.setAttribute('id', 'num-1');
      let {shadowRoot: shadowRoot2, shadowHost: shadowHost2, cleanup: cleanup3} = createShadowRoot(shadowHost);
      shadowHost2.setAttribute('id', 'num-2');
      let Contents = () => ReactDOM.createPortal(
        <>
          <div id="div-one" />
          <input id="input-one" />
          <div id="div-two" />
          <input id="input-two" />
          <div id="div-three" />
          <input id="input-three" />
          <div id="div-four" />
        </>
      , shadowRoot1);
      let Contents2 = () => ReactDOM.createPortal(
        <>
          <div id="div-five" />
          <input id="input-four" />
          <div id="div-six" />
          <input id="input-five" />
          <div id="div-seven" />
          <input id="input-six" />
          <div id="div-eight" />
        </>
      , shadowRoot2);
      let {unmount} = render(<><Contents /><Contents2 /></>);
      let filterFn = (node) => {
        if (node.tagName === 'INPUT') {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      };
      let realTreeWalker = document.createTreeWalker(shadowRoot1, NodeFilter.SHOW_ALL, filterFn);
      let walker = createShadowTreeWalker(document, document.body, undefined, filterFn);
      expect(walker.firstChild()).toBe(realTreeWalker.firstChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.firstChild()).toBe(realTreeWalker.firstChild());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.nextNode()).toBe(realTreeWalker.nextNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.previousNode()).toBe(realTreeWalker.previousNode());
      expect(walker.currentNode).toBe(realTreeWalker.currentNode);
      expect(walker.nextNode()).toBe(realTreeWalker.nextNode());
      expect(walker.nextNode()).toBe(realTreeWalker.nextNode());
      let realTreeWalker2 = document.createTreeWalker(shadowRoot2, NodeFilter.SHOW_ALL, filterFn);
      expect(walker.nextNode()).toBe(realTreeWalker2.nextNode());
      expect(walker.previousNode()).toBe(realTreeWalker.currentNode);

      cleanup3();
      cleanup2();
      cleanup();
      unmount();
    });
  });
});

describe.skip('speed test', () => {
  let Component = (props) => {
    if (props.depth === 0) {
      return <div data-testid="hello">hello</div>;
    }
    return <div><Component depth={props.depth - 1} /></div>;
  };
  it.each`
  Name | createTreeWalker
  ${'native'} | ${() => document.createTreeWalker(document.body, NodeFilter.SHOW_ALL)}
  ${'shadow'} | ${() => createShadowTreeWalker(document, document.body)}
  `('$Name', ({createTreeWalker}) => {
    render(
      <>
        <div id="div-one" />
        <Component depth={100} />
        <input id="input-one" />
        <div id="div-two" />
        <Component depth={100} />
        <input id="input-two" />
        <div id="div-three" />
        <Component depth={100} />
        <input id="input-three" />
        <div id="div-four" />
        <Component depth={100} />
      </>
    );
    let walker = createTreeWalker();
    let start = performance.now();
    for (let i = 0; i < 10000; i++) {
      walker.firstChild();
      walker.nextNode();
      walker.previousNode();
      walker.lastChild();
    }
    let end = performance.now();
    console.log(`Time taken for 10000 iterations: ${end - start}ms`);
  });
});


// describe('checking if node is contained', () => {
//   let user;
//   beforeAll(() => {
//     user = userEvent.setup({delay: null, pointerMap});
//   });
//   it.only("benchmark native contains", async () => {
//     let Component = (props) => {
//       if (props.depth === 0) {
//         return <div data-testid="hello">hello</div>
//       }
//       return <div><Component depth={props.depth -1}/></div>
//     }
//     let {getByTestId} = render(
//       <Component depth={100} />
//     );
//     let target = getByTestId('hello');
//     let handler = jest.fn((e) => {
//       expect(e.currentTarget.contains(e.target)).toBe(true);
//     });
//     document.body.addEventListener('click', handler);
//     for (let i = 0; i < 50; i++) {
//       await user.click(target);
//       expect(handler).toHaveBeenCalledTimes(i + 1);
//     }
//   });
//   it.only("benchmark nodeContains", async () => {
//     let Component = (props) => {
//       if (props.depth === 0) {
//         return <div data-testid="hello">hello</div>
//       }
//       return <div><Component depth={props.depth -1}/></div>
//     }
//     let {getByTestId} = render(
//       <Component depth={100} />
//     );
//     let target = getByTestId('hello');
//     let handler = jest.fn((e) => {
//       expect(nodeContains(e.currentTarget, e.composedPath()[0])).toBe(true);
//     });
//     document.body.addEventListener('click', handler);
//     for (let i = 0; i < 50; i++) {
//       await user.click(target);
//       expect(handler).toHaveBeenCalledTimes(i + 1);
//     }
//   });
// });
