/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaLabelingProps, DOMAttributes, FocusableElement} from '@react-types/shared';
import {RefObject, useCallback, useEffect, useState} from 'react';
import {useLayoutEffect} from '@react-aria/utils';
import {useSyncExternalStore} from 'use-sync-external-store/shim/index.js';

export type AriaLandmarkRole = 'main' | 'region' | 'search' | 'navigation' | 'form' | 'banner' | 'contentinfo' | 'complementary';

export interface AriaLandmarkProps extends AriaLabelingProps {
  role: AriaLandmarkRole,
  focus?: (direction: 'forward' | 'backward') => void
}

export interface LandmarkAria {
  landmarkProps: DOMAttributes
}

// Increment this version number whenever the
// LandmarkManagerApi or Landmark interfaces change.
const LANDMARK_API_VERSION = 1;

// Minimal API for LandmarkManager that must continue to work between versions.
// Changes to this interface are considered breaking. New methods/properties are
// safe to add, but changes or removals are not allowed (same as public APIs).
interface LandmarkManagerApi {
  version: number,
  createLandmarkController(): LandmarkController,
  registerLandmark(landmark: Landmark): () => void
}

// Changes to this interface are considered breaking.
// New properties MUST be optional so that registering a landmark
// from an older version of useLandmark against a newer version of
// LandmarkManager does not crash.
interface Landmark {
  ref: RefObject<FocusableElement>,
  role: AriaLandmarkRole,
  label?: string,
  lastFocused?: FocusableElement,
  focus: (direction: 'forward' | 'backward') => void,
  blur: () => void
}

export interface LandmarkControllerOptions {
  /**
   * The element from which to start navigating.
   * @default document.activeElement
   */
  from?: FocusableElement
}

/** A LandmarkController allows programmatic navigation of landmarks. */
export interface LandmarkController {
  /** Moves focus to the next landmark. */
  focusNext(opts?: LandmarkControllerOptions): boolean,
  /** Moves focus to the previous landmark. */
  focusPrevious(opts?: LandmarkControllerOptions): boolean,
  /** Moves focus to the main landmark. */
  focusMain(): boolean,
  /** Moves focus either forward or backward in the landmark sequence. */
  navigate(direction: 'forward' | 'backward', opts?: LandmarkControllerOptions): boolean,
  /**
   * Disposes the landmark controller. When no landmarks are registered, and no
   * controllers are active, the landmark keyboard listeners are removed from the page.
   */
  dispose(): void
}

// Symbol under which the singleton landmark manager instance is attached to the document.
const landmarkSymbol = Symbol.for('react-aria-landmark-manager');

function subscribe(fn: () => void) {
  document.addEventListener('react-aria-landmark-manager-change', fn);
  return () => document.removeEventListener('react-aria-landmark-manager-change', fn);
}

function getLandmarkManager(): LandmarkManagerApi | null {
  if (typeof document === 'undefined') {
    return null;
  }

  // Reuse an existing instance if it has the same or greater version.
  let instance = document[landmarkSymbol];
  if (instance && instance.version >= LANDMARK_API_VERSION) {
    return instance;
  }

  // Otherwise, create a new instance and dispatch an event so anything using the existing
  // instance updates and re-registers their landmarks with the new one.
  document[landmarkSymbol] = new LandmarkManager();
  document.dispatchEvent(new CustomEvent('react-aria-landmark-manager-change'));
  return document[landmarkSymbol];
}

// Subscribes a React component to the current landmark manager instance.
function useLandmarkManager(): LandmarkManagerApi | null {
  return useSyncExternalStore(subscribe, getLandmarkManager, getLandmarkManager);
}

class LandmarkManager implements LandmarkManagerApi {
  private landmarks: Array<Landmark> = [];
  private isListening = false;
  private refCount = 0;
  public version = LANDMARK_API_VERSION;

  constructor() {
    this.f6Handler = this.f6Handler.bind(this);
    this.focusinHandler = this.focusinHandler.bind(this);
    this.focusoutHandler = this.focusoutHandler.bind(this);
  }

  private setupIfNeeded() {
    if (this.isListening) {
      return;
    }
    document.addEventListener('keydown', this.f6Handler, {capture: true});
    document.addEventListener('focusin', this.focusinHandler, {capture: true});
    document.addEventListener('focusout', this.focusoutHandler, {capture: true});
    this.isListening = true;
  }

  private teardownIfNeeded() {
    if (!this.isListening || this.landmarks.length > 0 || this.refCount > 0) {
      return;
    }
    document.removeEventListener('keydown', this.f6Handler, {capture: true});
    document.removeEventListener('focusin', this.focusinHandler, {capture: true});
    document.removeEventListener('focusout', this.focusoutHandler, {capture: true});
    this.isListening = false;
  }

  private focusLandmark(landmark: FocusableElement, direction: 'forward' | 'backward') {
    this.landmarks.find(l => l.ref.current === landmark)?.focus?.(direction);
  }

  /**
   * Return set of landmarks with a specific role.
   */
  private getLandmarksByRole(role: AriaLandmarkRole) {
    return new Set(this.landmarks.filter(l => l.role === role));
  }

  /**
   * Return first landmark with a specific role.
   */
  private getLandmarkByRole(role: AriaLandmarkRole) {
    return this.landmarks.find(l => l.role === role);
  }

  private addLandmark(newLandmark: Landmark) {
    this.setupIfNeeded();
    if (this.landmarks.find(landmark => landmark.ref === newLandmark.ref) || !newLandmark.ref.current) {
      return;
    }

    if (this.landmarks.filter(landmark => landmark.role === 'main').length > 1) {
      console.error('Page can contain no more than one landmark with the role "main".');
    }

    if (this.landmarks.length === 0) {
      this.landmarks = [newLandmark];
      this.checkLabels(newLandmark.role);
      return;
    }


    // Binary search to insert new landmark based on position in document relative to existing landmarks.
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
    let start = 0;
    let end = this.landmarks.length - 1;
    while (start <= end) {
      let mid = Math.floor((start + end) / 2);
      let comparedPosition = newLandmark.ref.current.compareDocumentPosition(this.landmarks[mid].ref.current as Node);
      let isNewAfterExisting = Boolean((comparedPosition & Node.DOCUMENT_POSITION_PRECEDING) || (comparedPosition & Node.DOCUMENT_POSITION_CONTAINS));

      if (isNewAfterExisting) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }

    this.landmarks.splice(start, 0, newLandmark);
    this.checkLabels(newLandmark.role);
  }

  private updateLandmark(landmark: Pick<Landmark, 'ref'> & Partial<Landmark>) {
    let index = this.landmarks.findIndex(l => l.ref === landmark.ref);
    if (index >= 0) {
      this.landmarks[index] = {...this.landmarks[index], ...landmark};
      this.checkLabels(this.landmarks[index].role);
    }
  }

  private removeLandmark(ref: RefObject<Element>) {
    this.landmarks = this.landmarks.filter(landmark => landmark.ref !== ref);
    this.teardownIfNeeded();
  }

  /**
   * Warn if there are 2+ landmarks with the same role but no label.
   * Labels for landmarks with the same role must also be unique.
   *
   * See https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/.
   */
  private checkLabels(role: AriaLandmarkRole) {
    let landmarksWithRole = this.getLandmarksByRole(role);
    if (landmarksWithRole.size > 1) {
      let duplicatesWithoutLabel = [...landmarksWithRole].filter(landmark => !landmark.label);
      if (duplicatesWithoutLabel.length > 0) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
          `Page contains more than one landmark with the '${role}' role. If two or more landmarks on a page share the same role, all must be labeled with an aria-label or aria-labelledby attribute: `,
          duplicatesWithoutLabel.map(landmark => landmark.ref.current)
        );
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          let labels = [...landmarksWithRole].map(landmark => landmark.label);
          let duplicateLabels = labels.filter((item, index) => labels.indexOf(item) !== index);

          duplicateLabels.forEach((label) => {
            console.warn(
            `Page contains more than one landmark with the '${role}' role and '${label}' label. If two or more landmarks on a page share the same role, they must have unique labels: `,
            [...landmarksWithRole].filter(landmark => landmark.label === label).map(landmark => landmark.ref.current)
          );
          });
        }
      }
    }
  }

  /**
   * Get the landmark that is the closest parent in the DOM.
   * Returns undefined if no parent is a landmark.
   */
  private closestLandmark(element: FocusableElement) {
    let landmarkMap = new Map(this.landmarks.map(l => [l.ref.current, l]));
    let currentElement = element;
    while (currentElement && !landmarkMap.has(currentElement) && currentElement !== document.body && currentElement.parentElement) {
      currentElement = currentElement.parentElement;
    }
    return landmarkMap.get(currentElement);
  }

  /**
   * Gets the next landmark, in DOM focus order, or previous if backwards is specified.
   * If last landmark, next should be the first landmark.
   * If not inside a landmark, will return first landmark.
   * Returns undefined if there are no landmarks.
   */
  private getNextLandmark(element: FocusableElement, {backward}: {backward?: boolean }) {
    let currentLandmark = this.closestLandmark(element);
    let nextLandmarkIndex = backward ? this.landmarks.length - 1 : 0;
    if (currentLandmark) {
      nextLandmarkIndex = this.landmarks.indexOf(currentLandmark) + (backward ? -1 : 1);
    }

    let wrapIfNeeded = () => {
      // When we reach the end of the landmark sequence, fire a custom event that can be listened for by applications.
      // If this event is canceled, we return immediately. This can be used to implement landmark navigation across iframes.
      if (nextLandmarkIndex < 0) {
        if (!element.dispatchEvent(new CustomEvent('react-aria-landmark-navigation', {detail: {direction: 'backward'}, bubbles: true, cancelable: true}))) {
          return true;
        }

        nextLandmarkIndex = this.landmarks.length - 1;
      } else if (nextLandmarkIndex >= this.landmarks.length) {
        if (!element.dispatchEvent(new CustomEvent('react-aria-landmark-navigation', {detail: {direction: 'forward'}, bubbles: true, cancelable: true}))) {
          return true;
        }

        nextLandmarkIndex = 0;
      }

      if (nextLandmarkIndex < 0 || nextLandmarkIndex >= this.landmarks.length) {
        return true;
      }

      return false;
    };

    if (wrapIfNeeded()) {
      return undefined;
    }

    // Skip over hidden landmarks.
    let i = nextLandmarkIndex;
    while (this.landmarks[nextLandmarkIndex].ref.current?.closest('[aria-hidden=true]')) {
      nextLandmarkIndex += backward ? -1 : 1;
      if (wrapIfNeeded()) {
        return undefined;
      }

      if (nextLandmarkIndex === i) {
        break;
      }
    }

    return this.landmarks[nextLandmarkIndex];
  }

  /**
   * Look at next landmark. If an element was previously focused inside, restore focus there.
   * If not, focus the landmark itself.
   * If no landmarks at all, or none with focusable elements, don't move focus.
   */
  private f6Handler(e: KeyboardEvent) {
    if (e.key === 'F6') {
      // If alt key pressed, focus main landmark, otherwise navigate forward or backward based on shift key.
      let handled = e.altKey ? this.focusMain() : this.navigate(e.target as FocusableElement, e.shiftKey);
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  private focusMain() {
    let main = this.getLandmarkByRole('main');
    if (main && main.ref.current && document.contains(main.ref.current)) {
      this.focusLandmark(main.ref.current, 'forward');
      return true;
    }

    return false;
  }

  private navigate(from: FocusableElement, backward: boolean) {
    let nextLandmark = this.getNextLandmark(from, {
      backward
    });

    if (!nextLandmark) {
      return false;
    }

    // If something was previously focused in the next landmark, then return focus to it
    if (nextLandmark.lastFocused) {
      let lastFocused = nextLandmark.lastFocused;
      if (document.body.contains(lastFocused)) {
        lastFocused.focus();
        return true;
      }
    }

    // Otherwise, focus the landmark itself
    if (nextLandmark.ref.current && document.contains(nextLandmark.ref.current)) {
      this.focusLandmark(nextLandmark.ref.current, backward ? 'backward' : 'forward');
      return true;
    }

    return false;
  }

  /**
   * Sets lastFocused for a landmark, if focus is moved within that landmark.
   * Lets the last focused landmark know it was blurred if something else is focused.
   */
  private focusinHandler(e: FocusEvent) {
    let currentLandmark = this.closestLandmark(e.target as FocusableElement);
    if (currentLandmark && currentLandmark.ref.current !== e.target) {
      this.updateLandmark({ref: currentLandmark.ref, lastFocused: e.target as FocusableElement});
    }
    let previousFocusedElement = e.relatedTarget as FocusableElement;
    if (previousFocusedElement) {
      let closestPreviousLandmark = this.closestLandmark(previousFocusedElement);
      if (closestPreviousLandmark && closestPreviousLandmark.ref.current === previousFocusedElement) {
        closestPreviousLandmark.blur();
      }
    }
  }

  /**
   * Track if the focus is lost to the body. If it is, do cleanup on the landmark that last had focus.
   */
  private focusoutHandler(e: FocusEvent) {
    let previousFocusedElement = e.target as FocusableElement;
    let nextFocusedElement = e.relatedTarget;
    // the === document seems to be a jest thing for focus to go there on generic blur event such as landmark.blur();
    // browsers appear to send focus instead to document.body and the relatedTarget is null when that happens
    if (!nextFocusedElement || nextFocusedElement === document) {
      let closestPreviousLandmark = this.closestLandmark(previousFocusedElement);
      if (closestPreviousLandmark && closestPreviousLandmark.ref.current === previousFocusedElement) {
        closestPreviousLandmark.blur();
      }
    }
  }

  public createLandmarkController(): LandmarkController {
    let instance: LandmarkManager | null = this;
    instance.refCount++;
    instance.setupIfNeeded();
    return {
      navigate(direction, opts) {
        let element = opts?.from || (document!.activeElement as FocusableElement);
        return instance!.navigate(element, direction === 'backward');
      },
      focusNext(opts) {
        let element = opts?.from || (document!.activeElement as FocusableElement);
        return instance!.navigate(element, false);
      },
      focusPrevious(opts) {
        let element = opts?.from || (document!.activeElement as FocusableElement);
        return instance!.navigate(element, true);
      },
      focusMain() {
        return instance!.focusMain();
      },
      dispose() {
        if (instance) {
          instance.refCount--;
          instance.teardownIfNeeded();
          instance = null;
        }
      }
    };
  }

  public registerLandmark(landmark: Landmark): () => void {
    if (this.landmarks.find(l => l.ref === landmark.ref)) {
      this.updateLandmark(landmark);
    } else {
      this.addLandmark(landmark);
    }

    return () => this.removeLandmark(landmark.ref);
  }
}

/** Creates a LandmarkController, which allows programmatic navigation of landmarks. */
export function createLandmarkController(): LandmarkController {
  // Get the current landmark manager and create a controller using it.
  let instance: LandmarkManagerApi | null = getLandmarkManager();
  let controller = instance?.createLandmarkController();

  let unsubscribe = subscribe(() => {
    // If the landmark manager changes, dispose the old
    // controller and create a new one.
    controller?.dispose();
    instance = getLandmarkManager();
    controller = instance?.createLandmarkController();
  });

  // Return a wrapper that proxies requests to the current controller instance.
  return {
    navigate(direction, opts) {
      return controller!.navigate(direction, opts);
    },
    focusNext(opts) {
      return controller!.focusNext(opts);
    },
    focusPrevious(opts) {
      return controller!.focusPrevious(opts);
    },
    focusMain() {
      return controller!.focusMain();
    },
    dispose() {
      controller?.dispose();
      unsubscribe();
      controller = undefined;
      instance = null;
    }
  };
}

/**
 * Provides landmark navigation in an application. Call this with a role and label to register a landmark navigable with F6.
 * @param props - Props for the landmark.
 * @param ref - Ref to the landmark.
 */
export function useLandmark(props: AriaLandmarkProps, ref: RefObject<FocusableElement>): LandmarkAria {
  const {
    role,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    focus
  } = props;
  let manager = useLandmarkManager();
  let label = ariaLabel || ariaLabelledby;
  let [isLandmarkFocused, setIsLandmarkFocused] = useState(false);

  let defaultFocus = useCallback(() => {
    setIsLandmarkFocused(true);
  }, [setIsLandmarkFocused]);

  let blur = useCallback(() => {
    setIsLandmarkFocused(false);
  }, [setIsLandmarkFocused]);

  useLayoutEffect(() => {
    if (manager) {
      return manager.registerLandmark({ref, label, role, focus: focus || defaultFocus, blur});
    }
  }, [manager, label, ref, role, focus, defaultFocus, blur]);

  useEffect(() => {
    if (isLandmarkFocused) {
      ref.current?.focus();
    }
  }, [isLandmarkFocused, ref]);

  return {
    landmarkProps: {
      role,
      tabIndex: isLandmarkFocused ? -1 : undefined,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby
    }
  };
}
