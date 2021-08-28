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
import docsStyle from './docs.css';
import {listen} from 'quicklink';
import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import {SearchField} from '@react-spectrum/searchfield';
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';
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
    let themeSwitcherButton = themeSwitcher.querySelector('button');
    nav.classList.toggle(docsStyle.visible);

    if (nav.classList.contains(docsStyle.visible)) {
      setIsPressed(true);
      main.setAttribute('aria-hidden', 'true');
      themeSwitcher.setAttribute('aria-hidden', 'true');
      if (themeSwitcherButton) {
        themeSwitcherButton.tabIndex = -1;
      }
      nav.tabIndex = -1;
      nav.focus();
    } else {
      setIsPressed(false);
      main.removeAttribute('aria-hidden');
      themeSwitcher.removeAttribute('aria-hidden');
      if (themeSwitcherButton) {
        themeSwitcherButton.removeAttribute('tabindex');
      }
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
      setIsPressed(false);
      let button = hamburgerButton.querySelector('button');
      if (button) {
        if (nav.contains(document.activeElement) && !isNotResponsive) {
          button.focus();
        }
      }

      nav.classList.remove(docsStyle.visible);
      main.removeAttribute('aria-hidden');
      themeSwitcher.removeAttribute('aria-hidden');
      let themeSwitcherButton = themeSwitcher.querySelector('button');
      if (themeSwitcherButton) {
        themeSwitcherButton.removeAttribute('tabindex');
      }
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
      <ActionButton onPress={onPress} aria-label="Open navigation panel" aria-pressed={isPressed ? isPressed : 'false'}>
        <ShowMenu />
      </ActionButton>
    </div>
  );
}

function DocSearch() {
  useEffect(() => {
    // the following comes from docsearch.min.js
    // eslint-disable-next-line no-undef
    const search = docsearch({
      apiKey: '9b5a0967c8bb751b5048ecfc99917979',
      indexName: 'react-spectrum',
      inputSelector: '#algolia-doc-search',
      debug: false // Set debug to true to inspect the dropdown
    });

    // autocomplete:opened event handler
    search.autocomplete.on('autocomplete:opened', event => {
      const input = event.target;
      
      // WAI-ARIA 1.2 uses aria-controls rather than aria-owns on combobox.
      if (!input.hasAttribute('aria-controls') && input.hasAttribute('aria-owns')) {
        input.setAttribute('aria-controls', input.getAttribute('aria-owns'));
      }

      // Listbox dropdown should have an accessibility name.
      const listbox = input.parentElement.querySelector(`#${input.getAttribute('aria-controls')}`);
      listbox.setAttribute('aria-label', 'Search results');
    });

    // autocomplete:updated event handler
    search.autocomplete.on('autocomplete:updated', event => {
      const input = event.target;
      const listbox = input.parentElement.querySelector(`#${input.getAttribute('aria-controls')}`);
      
      // Add aria-hidden to the logo in the footer so that it does not break the listbox accessibility tree structure.
      const footer = listbox.querySelector('.algolia-docsearch-footer');
      if (footer && !footer.hasAttribute('aria-hidden')) {
        footer.setAttribute('aria-hidden', 'true');
        footer.querySelector('a[href]').tabIndex = -1;
      }

      // With no results, the message should be an option in the listbox. 
      const noResults = listbox.querySelector('.algolia-docsearch-suggestion--no-results');
      if (noResults) {
        noResults.setAttribute('role', 'option');

        // Use aria-live to ensure that the noResults message gets announced.
        noResults.querySelector('.algolia-docsearch-suggestion--title').setAttribute('aria-live', 'assertive');
      }

      // Clean up WAI-ARIA listbox structure by setting role=presentation to non-semantic div and span elements.
      [...listbox.querySelectorAll('div:not([role]), span:not([role])')].forEach(element => element.setAttribute('role', 'presentation'));

      // Clean up WAI-ARIA listbox structure by correcting improper nesting of interactive controls.
      [...listbox.querySelectorAll('.ds-suggestion[role="option"]')].forEach(element => {
        const link = element.querySelector('a.algolia-docsearch-suggestion');
        if (link) {

          // Remove static aria-label="Link to the result" that causes all options to be named the same.
          link.removeAttribute('aria-label');

          // The interactive element should have role="option", a unique id, and tabIndex.
          link.setAttribute('role', 'option');
          link.id = `${element.id}-link`;
          link.tabIndex = -1;

          // containing element should have role="presentation"
          element.setAttribute('role', 'presentation');

          // Move aria-selected to the link, and update aria-activedescendant on input.
          if (element.hasAttribute('aria-selected')) {
            link.setAttribute('aria-selected', element.getAttribute('aria-selected'));
            element.removeAttribute('aria-selected');
            input.setAttribute('aria-activedescendant', link.id);
          }

          // Fix double voicing of options when subcategory matches suggestion title.
          const subcategoryColumn = link.querySelector('.algolia-docsearch-suggestion--subcategory-column');
          const suggestionTitle = link.querySelector('.algolia-docsearch-suggestion--title');
          if (subcategoryColumn.textContent.trim() === suggestionTitle.textContent.trim()) {
            subcategoryColumn.setAttribute('aria-hidden', 'true');
          }
        }
      });
    });

    // When navigating listbox, move aria-selected to link.
    search.autocomplete.on('autocomplete:cursorchanged', event => {
      const input = event.target;
      const listbox = input.parentElement.querySelector(`#${input.getAttribute('aria-controls')}`);
      let element = listbox.querySelector('a.algolia-docsearch-suggestion[aria-selected]');
      if (element) {
        element.removeAttribute('aria-selected');
      }
      
      element = listbox.querySelector('.ds-suggestion.ds-cursor[aria-selected]');
      if (element) {
        let link = element.querySelector('a.algolia-docsearch-suggestion');
        
        // Move aria-selected to the link, and update aria-activedescendant on input.
        if (link) {
          link.id = `${element.id}-link`;
          link.setAttribute('aria-selected', 'true');
          input.setAttribute('aria-activedescendant', link.id);
          element.removeAttribute('aria-selected');
        }
      }
    });
  }, []);

  return (
    <div role="search">
      <SearchField
        aria-label="Search"
        UNSAFE_className={docsStyle.docSearchBox}
        id="algolia-doc-search"
        placeholder="Search" />
    </div>
  );
}

ReactDOM.render(<>
  <Hamburger />
  <DocSearch />
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
