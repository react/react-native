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

import type {ResizeObserverId} from './internals/ResizeObserverManager';
import type ResizeObserverEntry from './ResizeObserverEntry';

import ReactNativeElement from '../dom/nodes/ReactNativeElement';
import {setPlatformObject} from '../webidl/PlatformObjects';
import * as ResizeObserverManager from './internals/ResizeObserverManager';

export type ResizeObserverCallback = (
  entries: ReadonlyArray<ResizeObserverEntry>,
  observer: ResizeObserver,
) => unknown;

/**
 * Corresponds to the `box` option of `ResizeObserver#observe`.
 * https://drafts.csswg.org/resize-observer/#resize-observer-box-options
 */
export type ResizeObserverBoxOptions =
  'content-box' | 'border-box' | 'device-pixel-content-box';

export interface ResizeObserverOptions {
  box?: ResizeObserverBoxOptions;
}

/**
 * The [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
 * interface of the Resize Observer API reports changes to the dimensions of
 * an element's content or border box.
 *
 * `ResizeObserver` avoids infinite callback loops and cyclic dependencies
 * that are often created when resizing via a callback function, as it only
 * observes block and inline sizes on the content box or border box, as
 * opposed to observing changes in pixels.
 *
 * You can add/remove multiple target elements to/from a single
 * `ResizeObserver` instance.
 */
export default class ResizeObserver {
  _callback: ResizeObserverCallback;
  _observationTargets: Map<ReactNativeElement, ResizeObserverBoxOptions> =
    new Map();
  _resizeObserverId: ?ResizeObserverId;

  constructor(callback: ResizeObserverCallback): void {
    if (callback == null) {
      throw new TypeError(
        "Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.",
      );
    }

    if (typeof callback !== 'function') {
      throw new TypeError(
        "Failed to construct 'ResizeObserver': parameter 1 is not of type 'Function'.",
      );
    }

    this._callback = callback;
  }

  /**
   * Starts observing the specified `ReactNativeElement`.
   * One observer has one set of observation targets, and each target can be
   * observed using either the target's content box or its border box (as
   * specified by the `box` option).
   * To stop observing an element, call `ResizeObserver.unobserve()`.
   */
  observe(target: ReactNativeElement, options?: ResizeObserverOptions): void {
    if (target == null) {
      throw new TypeError(
        "Failed to execute 'observe' on 'ResizeObserver': parameter 1 is null or undefined.",
      );
    }

    if (!(target instanceof ReactNativeElement)) {
      throw new TypeError(
        "Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    }

    const box = normalizeBoxOption(options?.box);

    if (this._observationTargets.has(target)) {
      // Re-observing a target already observed with the SAME box is a no-op
      // and does not re-deliver. This matches observed browser behavior.
      const previousBox = this._observationTargets.get(target);
      if (previousBox === box) {
        return;
      }

      ResizeObserverManager.unobserve(
        this._getOrCreateResizeObserverId(),
        target,
      );
      this._observationTargets.delete(target);
    }

    const resizeObserverId = this._getOrCreateResizeObserverId();
    const didObserve = ResizeObserverManager.observe({
      resizeObserverId,
      target,
      box,
    });

    if (didObserve) {
      this._observationTargets.set(target, box);
    } else if (this._observationTargets.size === 0) {
      // Target couldn't be observed (e.g. disconnected). Don't record it so a
      // later `observe` can retry, and release the registration since nothing
      // is observed.
      ResizeObserverManager.unregisterObserver(resizeObserverId);
      this._resizeObserverId = null;
    }
  }

  /**
   * Ends the observing of the specified `ReactNativeElement`.
   */
  unobserve(target: ReactNativeElement): void {
    if (!(target instanceof ReactNativeElement)) {
      throw new TypeError(
        "Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    }

    if (!this._observationTargets.has(target)) {
      return;
    }

    const resizeObserverId = this._resizeObserverId;
    if (resizeObserverId == null) {
      // This is unexpected if the target is in `_observationTargets`.
      console.error(
        "Unexpected state in 'ResizeObserver': could not find observer ID to unobserve target.",
      );
      return;
    }

    ResizeObserverManager.unobserve(resizeObserverId, target);
    this._observationTargets.delete(target);

    if (this._observationTargets.size === 0) {
      ResizeObserverManager.unregisterObserver(resizeObserverId);
      this._resizeObserverId = null;
    }
  }

  /**
   * Unobserves all observed `ReactNativeElement` targets.
   */
  disconnect(): void {
    for (const target of this._observationTargets.keys()) {
      this.unobserve(target);
    }
  }

  _getOrCreateResizeObserverId(): ResizeObserverId {
    let resizeObserverId = this._resizeObserverId;
    if (resizeObserverId == null) {
      resizeObserverId = ResizeObserverManager.registerObserver(
        this,
        this._callback,
      );
      this._resizeObserverId = resizeObserverId;
    }
    return resizeObserverId;
  }

  // Only for tests
  __getObserverID(): ?ResizeObserverId {
    return this._resizeObserverId;
  }
}

setPlatformObject(ResizeObserver);

function normalizeBoxOption(
  box: ?ResizeObserverBoxOptions,
): ResizeObserverBoxOptions {
  if (box == null) {
    return 'content-box';
  }

  if (
    box !== 'content-box' &&
    box !== 'border-box' &&
    box !== 'device-pixel-content-box'
  ) {
    throw new TypeError(
      `Failed to execute 'observe' on 'ResizeObserver': Failed to read the 'box' property from 'ResizeObserverOptions': The provided value '${String(
        box,
      )}' is not a valid enum value of type ResizeObserverBoxOptions.`,
    );
  }

  return box;
}
