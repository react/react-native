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

import type {IntersectionObserverId} from './internals/IntersectionObserverManager';
import type IntersectionObserverEntry from './IntersectionObserverEntry';

import ReactNativeElement from '../dom/nodes/ReactNativeElement';
import {setPlatformObject} from '../webidl/PlatformObjects';
import * as IntersectionObserverManager from './internals/IntersectionObserverManager';

export type IntersectionObserverCallback = (
  entries: Array<IntersectionObserverEntry>,
  observer: IntersectionObserver,
) => unknown;

export interface IntersectionObserverInit {
  root?: ?ReactNativeElement;
  rootMargin?: string;
  threshold?: number | ReadonlyArray<number>;

  /**
   * This is a React Native specific option (not spec compliant) that specifies
   * ratio threshold(s) of the intersection area to the total `root` area.
   *
   * If set, it will either be a singular ratio value between 0-1 (inclusive)
   * or an array of such ratios.
   *
   * Note: If `rnRootThreshold` is set, and `threshold` is not set,
   * `threshold` will not default to [0] (as per spec)
   */
  rnRootThreshold?: number | ReadonlyArray<number>;
}

/**
 * The [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 * provides a way to asynchronously observe changes in the intersection of a
 * target element with an ancestor element or with a top-level document's
 * viewport.
 *
 * The ancestor element or viewport is referred to as the root.
 *
 * When an `IntersectionObserver` is created, it's configured to watch for given
 * ratios of visibility within the root.
 *
 * The configuration cannot be changed once the `IntersectionObserver` is
 * created, so a given observer object is only useful for watching for specific
 * changes in degree of visibility; however, you can watch multiple target
 * elements with the same observer.
 *
 * This implementation supports `threshold`, `root`, and `rootMargin` options and
 * provides a React Native specific option `rnRootThreshold`.
 *
 */
export default class IntersectionObserver {
  _callback: IntersectionObserverCallback;
  _thresholds: ReadonlyArray<number>;
  _observationTargets: Set<ReactNativeElement> = new Set();
  _intersectionObserverId: ?IntersectionObserverId;
  _rootThresholds: ReadonlyArray<number> | null;
  _root: ReactNativeElement | null;
  _rootMargin: string;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ): void {
    if (callback == null) {
      throw new TypeError(
        "Failed to construct 'IntersectionObserver': 1 argument required, but only 0 present.",
      );
    }

    if (typeof callback !== 'function') {
      throw new TypeError(
        "Failed to construct 'IntersectionObserver': parameter 1 is not of type 'Function'.",
      );
    }

    if (
      options?.root != null &&
      !(options?.root instanceof ReactNativeElement)
    ) {
      throw new TypeError(
        "Failed to construct 'IntersectionObserver': Failed to read the 'root' property from 'IntersectionObserverInit': The provided value is not of type '(null or ReactNativeElement)",
      );
    }

    if (options != null && 'delay' in options) {
      throw new Error(
        "Failed to construct 'IntersectionObserver': The 'delay' option is not supported.",
      );
    }

    if (options != null && 'scrollMargin' in options) {
      throw new Error(
        "Failed to construct 'IntersectionObserver': The 'scrollMargin' option is not supported.",
      );
    }

    if (options != null && 'trackVisibility' in options) {
      throw new Error(
        "Failed to construct 'IntersectionObserver': The 'trackVisibility' option is not supported.",
      );
    }

    this._callback = callback;

    this._rootThresholds = normalizeRootThreshold(options?.rnRootThreshold);
    this._thresholds = normalizeThreshold(
      options?.threshold,
      this._rootThresholds != null, // only provide default if no rootThreshold
    );
    this._root = options?.root ?? null;
    this._rootMargin = normalizeRootMargin(options?.rootMargin);
  }

  /**
   * The `ReactNativeElement` whose bounds are used as the bounding box when
   * testing for intersection.
   * If no `root` value was passed to the constructor or its value is `null`,
   * the root view is used.
   *
   * NOTE: This cannot currently be configured and `root` is always `null`.
   */
  get root(): ReactNativeElement | null {
    return this._root;
  }

  /**
   * String with syntax similar to that of the CSS `margin` property.
   * Each side of the rectangle represented by `rootMargin` is added to the
   * corresponding side in the root element's bounding box before the
   * intersection test is performed.
   */
  get rootMargin(): string {
    return this._rootMargin;
  }

  /**
   * A list of thresholds, sorted in increasing numeric order, where each
   * threshold is a ratio of intersection area to bounding box area of an
   * observed target.
   * Notifications for a target are generated when any of the thresholds specified
   * in `rnRootThreshold` or `threshold` are crossed for that target.
   *
   * If no value was passed to the constructor, and no `rnRootThreshold`
   * is set, `0` is used.
   */
  get thresholds(): ReadonlyArray<number> {
    return this._thresholds;
  }

  /**
   * A list of root thresholds, sorted in increasing numeric order, where each
   * threshold is a ratio of intersection area to bounding box area of the specified
   * root view, which defaults to the viewport.
   * Notifications for a target are generated when any of the thresholds specified
   * in `rnRootThreshold` or `threshold` are crossed for that target.
   */
  get rnRootThresholds(): ReadonlyArray<number> | null {
    return this._rootThresholds;
  }

  /**
   * The `delay` option is not supported.
   * @throws {Error} Always throws an error indicating this property is not supported.
   */
  get delay(): number {
    throw new Error(
      "Failed to read the 'delay' property from 'IntersectionObserver': This property is not supported.",
    );
  }

  /**
   * The `scrollMargin` option is not supported.
   * @throws {Error} Always throws an error indicating this property is not supported.
   */
  get scrollMargin(): string {
    throw new Error(
      "Failed to read the 'scrollMargin' property from 'IntersectionObserver': This property is not supported.",
    );
  }

  /**
   * The `trackVisibility` option is not supported.
   * @throws {Error} Always throws an error indicating this property is not supported.
   */
  get trackVisibility(): boolean {
    throw new Error(
      "Failed to read the 'trackVisibility' property from 'IntersectionObserver': This property is not supported.",
    );
  }

  /**
   * Adds an element to the set of target elements being watched by the
   * `IntersectionObserver`.
   * One observer has one set of thresholds and one root, but can watch multiple
   * target elements for visibility changes.
   * To stop observing the element, call `IntersectionObserver.unobserve()`.
   */
  observe(target: ReactNativeElement): void {
    if (target == null) {
      throw new TypeError(
        "Failed to execute 'observe' on 'IntersectionObserver': parameter 1 is null or undefined.",
      );
    }

    if (!(target instanceof ReactNativeElement)) {
      throw new TypeError(
        "Failed to execute 'observe' on 'IntersectionObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    }

    if (this._observationTargets.has(target)) {
      return;
    }

    const didStartObserving = IntersectionObserverManager.observe({
      intersectionObserverId: this._getOrCreateIntersectionObserverId(),
      root: this._root,
      target,
    });

    if (didStartObserving) {
      this._observationTargets.add(target);
    }
  }

  /**
   * Instructs the `IntersectionObserver` to stop observing the specified target
   * element.
   */
  unobserve(target: ReactNativeElement): void {
    if (!(target instanceof ReactNativeElement)) {
      throw new TypeError(
        "Failed to execute 'unobserve' on 'IntersectionObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    }

    if (!this._observationTargets.has(target)) {
      return;
    }

    const intersectionObserverId = this._intersectionObserverId;
    if (intersectionObserverId == null) {
      // This is unexpected if the target is in `_observationTargets`.
      console.error(
        "Unexpected state in 'IntersectionObserver': could not find observer ID to unobserve target.",
      );
      return;
    }

    IntersectionObserverManager.unobserve(intersectionObserverId, target);
    this._observationTargets.delete(target);

    if (this._observationTargets.size === 0) {
      IntersectionObserverManager.unregisterObserver(intersectionObserverId);
      this._intersectionObserverId = null;
    }
  }

  /**
   * Stops watching all of its target elements for visibility changes.
   */
  disconnect(): void {
    for (const target of this._observationTargets.keys()) {
      this.unobserve(target);
    }
  }

  _getOrCreateIntersectionObserverId(): IntersectionObserverId {
    let intersectionObserverId = this._intersectionObserverId;
    if (intersectionObserverId == null) {
      intersectionObserverId = IntersectionObserverManager.registerObserver(
        this,
        this._callback,
      );
      this._intersectionObserverId = intersectionObserverId;
    }
    return intersectionObserverId;
  }

  // Only for tests
  __getObserverID(): ?IntersectionObserverId {
    return this._intersectionObserverId;
  }
}

setPlatformObject(IntersectionObserver);

/**
 * Converts the user defined `threshold` value into an array of sorted valid
 * threshold options for `IntersectionObserver` (double ∈ [0, 1]).
 *
 * If `defaultEmpty` is true, then defaults to empty array, otherwise [0].
 *
 * @example
 * normalizeThresholds(0.5);                // → [0.5]
 * normalizeThresholds([1, 0.5, 0]);        // → [0, 0.5, 1]
 * normalizeThresholds(['1', '0.5', '0']);  // → [0, 0.5, 1]
 * normalizeThresholds(null);               // → [0]
 * normalizeThresholds([null, null]);       // → [0, 0]
 *
 * normalizeThresholds([null], true);       // → [0]
 * normalizeThresholds(null, true);         // → []
 * normalizeThresholds([], true);           // → []
 */
function normalizeThreshold(
  threshold: unknown,
  defaultEmpty: boolean = false,
): ReadonlyArray<number> {
  if (Array.isArray(threshold)) {
    if (threshold.length > 0) {
      return threshold
        .map(t => normalizeThresholdValue(t, 'threshold'))
        .map(t => t ?? 0)
        .sort();
    } else if (defaultEmpty) {
      return [];
    } else {
      return [0];
    }
  }

  const normalized = normalizeThresholdValue(threshold, 'threshold');
  if (normalized == null) {
    return defaultEmpty ? [] : [0];
  }

  return [normalized];
}

/**
 * Converts the user defined `rnRootThreshold` value into an array of sorted valid
 * threshold options for `IntersectionObserver` (double ∈ [0, 1]).
 *
 * If invalid array or null, returns null.
 *
 * @example
 * normalizeRootThreshold(0.5);                 // → [0.5]
 * normalizeRootThresholds([1, 0.5, 0]);        // → [0, 0.5, 1]
 * normalizeRootThresholds([null, '0.5', '0']); // → [0, 0.5]
 * normalizeRootThresholds(null);               // → null
 * normalizeRootThresholds([null, null]);       // → null
 */
function normalizeRootThreshold(
  rootThreshold: unknown,
): null | ReadonlyArray<number> {
  if (Array.isArray(rootThreshold)) {
    const normalizedArr = rootThreshold
      .map(rt => normalizeThresholdValue(rt, 'rnRootThreshold'))
      .filter((rt): rt is number => rt != null)
      .sort();
    return normalizedArr.length === 0 ? null : normalizedArr;
  }

  const normalized = normalizeThresholdValue(rootThreshold, 'rnRootThreshold');
  return normalized == null ? null : [normalized];
}

function normalizeThresholdValue(
  threshold: unknown,
  property: string,
): null | number {
  if (threshold == null) {
    return null;
  }

  const thresholdAsNumber = Number(threshold);
  if (!Number.isFinite(thresholdAsNumber)) {
    throw new TypeError(
      `Failed to read the '${property}' property from 'IntersectionObserverInit': The provided double value is non-finite.`,
    );
  }

  if (thresholdAsNumber < 0 || thresholdAsNumber > 1) {
    throw new RangeError(
      "Failed to construct 'IntersectionObserver': Threshold values must be numbers between 0 and 1",
    );
  }

  return thresholdAsNumber;
}

/**
 * Validates and normalizes the rootMargin value.
 * Accepts CSS margin syntax (e.g., "10px", "10px 20px", "10px 20px 30px 40px").
 * Returns the normalized string or throws an error if invalid.
 *
 * Per W3C spec, rootMargin must be specified in pixels or percent.
 * This implementation validates the basic format.
 */
function normalizeRootMargin(rootMargin: unknown): string {
  if (rootMargin == null || rootMargin === '') {
    return '0px 0px 0px 0px';
  }

  if (typeof rootMargin !== 'string') {
    throw new TypeError(
      "Failed to construct 'IntersectionObserver': Failed to read the 'rootMargin' property from 'IntersectionObserverInit': The provided value is not of type 'string'.",
    );
  }

  const marginStr = rootMargin.trim();
  if (marginStr === '') {
    return '0px 0px 0px 0px';
  }

  // Split by whitespace and validate each value
  const parts = marginStr.split(/\s+/);
  if (parts.length > 4) {
    throw new SyntaxError(
      "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: Too many values (expected 1-4).",
    );
  }

  // Validate each part matches the pattern: optional minus, digits, and unit (px or %)
  const validPattern = /^-?\d+(\.\d+)?(px|%)$/;
  for (const part of parts) {
    if (!validPattern.test(part)) {
      throw new SyntaxError(
        `Failed to construct 'IntersectionObserver': Failed to parse rootMargin: '${part}' is not a valid length. Only 'px' and '%' units are allowed.`,
      );
    }
  }

  // Normalize to 4 values following CSS margin shorthand rules
  let normalized: Array<string>;
  switch (parts.length) {
    case 1:
      // All sides the same
      normalized = [parts[0], parts[0], parts[0], parts[0]];
      break;
    case 2:
      // Vertical | Horizontal
      normalized = [parts[0], parts[1], parts[0], parts[1]];
      break;
    case 3:
      // Top | Horizontal | Bottom
      normalized = [parts[0], parts[1], parts[2], parts[1]];
      break;
    case 4:
      // Top | Right | Bottom | Left
      normalized = parts;
      break;
    default:
      throw new SyntaxError(
        "Failed to construct 'IntersectionObserver': Failed to parse rootMargin.",
      );
  }

  return normalized.join(' ');
}
