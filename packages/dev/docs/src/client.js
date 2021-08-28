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

import {ActionButton} from '@react-spectrum/button';
import {createCodeSandbox} from './createCodeSandbox';
import docsStyle from './docs.css';
import LinkOut from '@spectrum-icons/workflow/LinkOut';
import {listen} from 'quicklink';
import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';
import {Text} from '@react-spectrum/text';
import {ThemeSwitcher} from './ThemeSwitcher';
import {watchModals} from '@react-aria/aria-modal-polyfill';

window.addEventListener('load', () => listen());
window.addEventListener('load', () => watchModals());

let title = document.querySelector('h1');

// Size the title to fit the available space.
function updateTitleFontSize() {
  let fontSize = parseInt(window.getComputedStyle(title).fontSize, 10);

  // Constrain font size to 58px, or 10% of the window width, whichever is smaller.
  let maxFontSize = Math.min(58, Math.round(window.innerWidth * 0.1));
  if (fontSize > maxFontSize) {
    fontSize = maxFontSize;
    title.style.fontSize = maxFontSize + 'px';
  }

  // If the font size is less than the maximum font size,
  // increase the font size until it overflows.
  while (fontSize < maxFontSize && title.scrollWidth <= title.clientWidth) {
    fontSize++;
    title.style.fontSize = fontSize + 'px';
  }

  // Reduce the font size until it doesn't overflow.
  while (title.scrollWidth > title.clientWidth) {
    fontSize--;
    title.style.fontSize = fontSize + 'px';
  }
}

updateTitleFontSize();

// Use ResizeObserver where available to detect size changes not related to window resizing, e.g. font loading.
if (typeof ResizeObserver !== 'undefined') {
  let observer = new ResizeObserver(() => {
    // Avoid updating the layout during the resize event and creating circular notifications.
    requestAnimationFrame(updateTitleFontSize);
  });
  observer.observe(title);
} else {
  window.addEventListener('resize', updateTitleFontSize);
}

function Hamburger() {
  let [isPressed, setIsPressed] = useState(false);

  let onPress = (event) => {
    let nav = document.querySelector('.' + docsStyle.nav);
    let main = document.querySelector('main');
    let themeSwitcher = event.target.parentElement.nextElementSibling;

    nav.classList.toggle(docsStyle.visible);

    if (nav.classList.contains(docsStyle.visible)) {
      setIsPressed(true);
      main.setAttribute('aria-hidden', 'true');
      themeSwitcher.setAttribute('aria-hidden', 'true');
      themeSwitcher.querySelector('button').tabIndex = -1;
      nav.tabIndex = -1;
      nav.focus();
    } else {
      setIsPressed(false);
      main.removeAttribute('aria-hidden');
      themeSwitcher.removeAttribute('aria-hidden');
      themeSwitcher.querySelector('button').removeAttribute('tabindex');
      nav.removeAttribute('tabindex');
    }
  };

  useEffect(() => {
    let mediaQueryList = window.matchMedia('(max-width: 1020px)');
    let nav = document.querySelector('.' + docsStyle.nav);
    let main = document.querySelector('main');
    let hamburgerButton = document.querySelector('.' + docsStyle.hamburgerButton);
    let themeSwitcher = hamburgerButton.nextElementSibling;

    /* remove visible className and aria-attributes that make nav behave as a modal */
    let removeVisible = (isNotResponsive = false) => {
      hamburgerButton.setAttribute('aria-pressed', 'false');

      if (nav.contains(document.activeElement) && !isNotResponsive) {
        hamburgerButton.focus();
      }

      nav.classList.remove(docsStyle.visible);
      main.removeAttribute('aria-hidden');
      themeSwitcher.removeAttribute('aria-hidden');
      themeSwitcher.querySelector('button').removeAttribute('tabindex');
      nav.removeAttribute('tabindex');
    };

    /* collapse nav when underlying content is clicked */
    let onClick = () => removeVisible();

    /* collapse expanded nav when esc key is pressed */
    let onKeydownEsc = (event) => {
      if (event.keyCode === 27) {
        removeVisible();
      }
    };

    /* trap keyboard focus within expanded nav */
    let onKeydownTab = (event) => {
      if (event.keyCode === 9 && nav.classList.contains(docsStyle.visible)) {
        let tabbables = nav.querySelectorAll('button, a[href]');
        let first = tabbables[0];
        let last = tabbables[tabbables.length - 1];

        if (event.shiftKey && event.target === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && event.target === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    /* restore default behavior when responsive media query no longer matches */
    let mediaQueryTest = (event) => {
      if (!event.matches) {
        removeVisible(true);
      }
    };

    main.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydownEsc);
    nav.addEventListener('keydown', onKeydownTab);

    let useEventListener = typeof mediaQueryList.addEventListener === 'function';
    if (useEventListener) {
      mediaQueryList.addEventListener('change', mediaQueryTest);
    } else {
      mediaQueryList.addListener(mediaQueryTest);
    }

    return () => {
      main.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeydownEsc);
      nav.removeEventListener('keydown', onKeydownTab);

      if (useEventListener) {
        mediaQueryList.removeEventListener('change', mediaQueryTest);
      } else {
        mediaQueryList.removeListener(mediaQueryTest);
      }
    };
  }, []);

  return (
    <div className={docsStyle.hamburgerButton} title="Open navigation panel" role="presentation">
      <ActionButton onPress={onPress} aria-label="Open navigation panel" aria-pressed={isPressed ? isPressed : undefined}>
        <ShowMenu />
      </ActionButton>
    </div>
  );
}

ReactDOM.render(<>
  <Hamburger />
  <ThemeSwitcher />
</>, document.querySelector('.' + docsStyle.pageHeader));

document.addEventListener('mousedown', (e) => {
  // Prevent focusing on links to other pages with the mouse to avoid flash of focus ring during navigation.
  let link = e.target.closest('a');
  if (link && (link.host !== location.host || link.pathname !== location.pathname)) {
    e.preventDefault();
  }

  // Add mouse focus class to summary elements on mouse down to prevent native browser focus from showing.
  if (e.target.tagName === 'SUMMARY') {
    e.target.classList.add(docsStyle.mouseFocus);
  }
});

// Remove mouse focus class on blur of a summary element.
document.addEventListener('blur', (e) => {
  if (e.target.tagName === 'SUMMARY') {
    e.target.classList.remove(docsStyle.mouseFocus);
  }
}, true);

let sidebar = document.querySelector('.' + docsStyle.nav);
let lastSelectedItem = sessionStorage.getItem('sidebarSelectedItem');
let lastScrollPosition = sessionStorage.getItem('sidebarScrollPosition');

// If we have a recorded scroll position, and the last selected item is in the sidebar
// (e.g. we're in the same category), then restore the scroll position.
if (lastSelectedItem && lastScrollPosition && [...sidebar.querySelectorAll('a')].some(a => a.pathname === lastSelectedItem)) {
  sidebar.scrollTop = parseInt(lastScrollPosition, 10);
}

// Save scroll position of the sidebar when we're about to navigate
window.addEventListener('pagehide', () => {
  sessionStorage.setItem('sidebarSelectedItem', location.pathname);
  sessionStorage.setItem('sidebarScrollPosition', sidebar.scrollTop);
});

// Only add CodeSandbox links to react-spectrum examples now. We'll add react-aria and react-stately support later
if (window.location.pathname.includes('/react-spectrum/')) {
  [...document.querySelectorAll('code[metastring^="example"]')].forEach(element => {
    let div = document.createElement('div');
    div.classList.add('codeSandboxLink');
    element.prepend(div);
  
    ReactDOM.render(
      <ActionButton
        onPress={createCodeSandbox}
        aria-label="Open current example in a code sandbox"
        UNSAFE_style={{float: 'right'}}
        isQuiet>
        <LinkOut />
        <Text>Open Sandbox</Text>
      </ActionButton>,
      element.querySelector('.codeSandboxLink')
    );
  });
}

