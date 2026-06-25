/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export type VisualElement = {
  time: number,
  rect: DOMRectReadOnly,
};

function debug(...args: ReadonlyArray<unknown>): void {
  console.debug('VCTrackerExample', args);
}

export default class VCTracker {
  _navigationStartTime: number;
  _intersectionObserver: IntersectionObserver;
  _mutationObserver: MutationObserver;
  _registeredCallback: (ReadonlyArray<VisualElement>) => void;
  _visualElements: Map<Element, VisualElement> = new Map();
  _pendingMutations: WeakSet<Node> = new WeakSet();

  constructor(navigationStartTime: number) {
    this._navigationStartTime = navigationStartTime;

    // This should be guaranteed to run before painting RootView in native.
    this._intersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        // This will be executed after mount/paint.
        for (const entry of entries) {
          if (this._pendingMutations.has(entry.target)) {
            this._registerVisualElement(entry.target, {
              time: entry.time,
              rect: entry.boundingClientRect,
            });
            this._pendingMutations.delete(entry.target);
            this._intersectionObserver.unobserve(entry.target);
          }
        }
      },
    );

    this._mutationObserver = new MutationObserver((entries, observer) => {
      // This will be executed after layout effects, and before mount/paint.
      for (const entry of entries) {
        if (entry.addedNodes) {
          for (const addedNode of entry.addedNodes) {
            // To measure paint time for added nodes
            this._pendingMutations.add(addedNode);
            if (addedNode instanceof Element) {
              this._intersectionObserver.observe(addedNode);
            }
          }
          for (const removedNode of entry.removedNodes) {
            // To measure paint time for added nodes
            this._pendingMutations.delete(removedNode);
            if (removedNode instanceof Element) {
              this._unregisterVisualElement(removedNode);
            }
          }
        }
      }
    });
  }

  _registerVisualElement(target: Element, visualElement: VisualElement): void {
    debug(
      'registerVisualElement',
      (target instanceof Element && target.id) || '<target-without-id>',
      '. Painted in',
      (visualElement.time - this._navigationStartTime).toFixed(2),
      'ms (at ',
      visualElement.time,
      '), rect:',
      // $FlowExpectedError[prop-missing] - DOMRectReadOnly isn't typed correctly.
      visualElement.rect.toJSON(),
    );

    this._visualElements.set(target, visualElement);
    this._registeredCallback?.([...this._visualElements.values()]);
  }

  _unregisterVisualElement(target: Element): void {
    this._visualElements.delete(target);
    this._registeredCallback?.([...this._visualElements.values()]);
  }

  onUpdateVisualElements(
    callback: (ReadonlyArray<VisualElement>) => void,
  ): void {
    this._registeredCallback = callback;
  }

  addMutationRoot(rootNode: Element): void {
    debug('addMutationRoot', rootNode.id);
    // To observe new nodes added.
    this._mutationObserver.observe(rootNode, {
      subtree: true,
      childList: true,
    });
    this._pendingMutations.add(rootNode);

    // To measure initial paint.
    this._intersectionObserver.observe(rootNode);
  }

  getVisualElements(): ReadonlyArray<VisualElement> {
    return [...this._visualElements.values()];
  }

  disconnect(): void {
    this._mutationObserver.disconnect();
    this._intersectionObserver.disconnect();
  }
}
