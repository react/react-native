/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

import type ReactNativeElement from '../dom/nodes/ReactNativeElement';
import type {NativeIntersectionObserverEntry} from './specs/NativeIntersectionObserver';

import DOMRectReadOnly from '../geometry/DOMRectReadOnly';
import {setPlatformObject} from '../webidl/PlatformObjects';

/**
 * The [`IntersectionObserverEntry`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry)
 * interface of the Intersection Observer API describes the intersection between
 * the target element and its root container at a specific moment of transition.
 *
 * An array of `IntersectionObserverEntry` is delivered to
 * `IntersectionObserver` callbacks as the first argument.
 */
export default class IntersectionObserverEntry {
  // We lazily compute all the properties from the raw entry provided by the
  // native module, so we avoid unnecessary work.
  _nativeEntry: NativeIntersectionObserverEntry;
  // There are cases where this cannot be safely derived from the instance
  // handle in the native entry (when the target is detached), so we need to
  // keep a reference to it directly.
  _target: ReactNativeElement;

  constructor(
    nativeEntry: NativeIntersectionObserverEntry,
    target: ReactNativeElement,
  ) {
    this._nativeEntry = nativeEntry;
    this._target = target;
  }

  /**
   * Returns the bounds rectangle of the target element as a `DOMRectReadOnly`.
   * The bounds are computed as described in the documentation for
   * [`Element.getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
   */
  get boundingClientRect(): DOMRectReadOnly {
    const targetRect = this._nativeEntry.targetRect;
    return new DOMRectReadOnly(
      targetRect[0],
      targetRect[1],
      targetRect[2],
      targetRect[3],
    );
  }

  /**
   * Returns the ratio of the `intersectionRect` to the `boundingClientRect`.
   */
  get intersectionRatio(): number {
    const intersectionRect = this.intersectionRect;
    const boundingClientRect = this.boundingClientRect;

    if (boundingClientRect.width === 0 || boundingClientRect.height === 0) {
      return 0;
    }

    const ratio =
      (intersectionRect.width * intersectionRect.height) /
      (boundingClientRect.width * boundingClientRect.height);

    // Prevent rounding errors from making this value greater than 1.
    return Math.min(ratio, 1);
  }

  /**
   * Returns the ratio of the `intersectionRect` to the `boundingRootRect`.
   */
  get rnRootIntersectionRatio(): number {
    const intersectionRect = this.intersectionRect;

    const rootRect = this._nativeEntry.rootRect;
    const boundingRootRect = new DOMRectReadOnly(
      rootRect[0],
      rootRect[1],
      rootRect[2],
      rootRect[3],
    );

    if (boundingRootRect.width === 0 || boundingRootRect.height === 0) {
      return 0;
    }

    const ratio =
      (intersectionRect.width * intersectionRect.height) /
      (boundingRootRect.width * boundingRootRect.height);

    // Prevent rounding errors from making this value greater than 1.
    return Math.min(ratio, 1);
  }

  /**
   * Returns a `DOMRectReadOnly` representing the target's visible area.
   */
  get intersectionRect(): DOMRectReadOnly {
    const intersectionRect = this._nativeEntry.intersectionRect;

    if (intersectionRect == null) {
      return new DOMRectReadOnly();
    }

    return new DOMRectReadOnly(
      intersectionRect[0],
      intersectionRect[1],
      intersectionRect[2],
      intersectionRect[3],
    );
  }

  /**
   * A `Boolean` value which is `true` if the target element intersects with the
   * intersection observer's root.
   * * If this is `true`, then, the `IntersectionObserverEntry` describes a
   * transition into a state of intersection.
   * * If it's `false`, then you know the transition is from intersecting to
   * not-intersecting.
   */
  get isIntersecting(): boolean {
    return this._nativeEntry.isIntersectingAboveThresholds;
  }

  /**
   * Returns a `DOMRectReadOnly` for the intersection observer's root.
   */
  get rootBounds(): DOMRectReadOnly {
    const rootRect = this._nativeEntry.rootRect;
    return new DOMRectReadOnly(
      rootRect[0],
      rootRect[1],
      rootRect[2],
      rootRect[3],
    );
  }

  /**
   * The `ReactNativeElement` whose intersection with the root changed.
   */
  get target(): ReactNativeElement {
    return this._target;
  }

  /**
   * A `DOMHighResTimeStamp` indicating the time at which the intersection was
   * recorded, relative to the `IntersectionObserver`'s time origin.
   */
  get time(): DOMHighResTimeStamp {
    return this._nativeEntry.time;
  }
}

setPlatformObject(IntersectionObserverEntry);

export function createIntersectionObserverEntry(
  entry: NativeIntersectionObserverEntry,
  target: ReactNativeElement,
): IntersectionObserverEntry {
  return new IntersectionObserverEntry(entry, target);
}

export const IntersectionObserverEntry_public: typeof IntersectionObserverEntry =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function IntersectionObserverEntry() {
    throw new TypeError(
      "Failed to construct 'IntersectionObserverEntry': Illegal constructor",
    );
  };

// $FlowExpectedError[prop-missing]
IntersectionObserverEntry_public.prototype =
  IntersectionObserverEntry.prototype;
