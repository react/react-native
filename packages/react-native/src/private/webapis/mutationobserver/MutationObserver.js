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

import type {MutationObserverId} from './internals/MutationObserverManager';
import type MutationRecord from './MutationRecord';

import ReactNativeElement from '../dom/nodes/ReactNativeElement';
import {setPlatformObject} from '../webidl/PlatformObjects';
import * as MutationObserverManager from './internals/MutationObserverManager';

export type MutationObserverCallback = (
  mutationRecords: ReadonlyArray<MutationRecord>,
  observer: MutationObserver,
) => unknown;

export interface MutationObserverInit {
  readonly subtree?: boolean;
  // This is the only supported option so it's required to be `true`.
  readonly childList: true;

  // Unsupported:
  readonly attributes?: boolean;
  readonly attributeFilter?: ReadonlyArray<string>;
  readonly attributeOldValue?: boolean;
  readonly characterData?: boolean;
  readonly characterDataOldValue?: boolean;
}

/**
 * This is a React Native implementation for the `MutationObserver` API
 * (https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver).
 *
 * It only supports the `subtree` and `childList` options at the moment.
 */
export default class MutationObserver {
  _callback: MutationObserverCallback;
  // TODO: delete in the next version.
  _observationTargets: Set<ReactNativeElement> = new Set();
  _mutationObserverId: ?MutationObserverId;

  constructor(callback: MutationObserverCallback): void {
    if (callback == null) {
      throw new TypeError(
        "Failed to construct 'MutationObserver': 1 argument required, but only 0 present.",
      );
    }

    if (typeof callback !== 'function') {
      throw new TypeError(
        "Failed to construct 'MutationObserver': parameter 1 is not of type 'Function'.",
      );
    }

    this._callback = callback;
  }

  /**
   * Configures the `MutationObserver` callback to begin receiving notifications
   * of changes to the UI tree that match the given options.
   * Depending on the configuration, the observer may watch a single node in the
   * UI tree, or that node and some or all of its descendant nodes.
   * To stop the `MutationObserver` (so that none of its callbacks will be
   * triggered any longer), call `MutationObserver.disconnect()`.
   */
  observe(target: ReactNativeElement, options?: MutationObserverInit): void {
    if (!(target instanceof ReactNativeElement)) {
      throw new TypeError(
        "Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    }

    // Browsers force a cast of this value to boolean
    if (Boolean(options?.childList) !== true) {
      throw new TypeError(
        "Failed to execute 'observe' on 'MutationObserver': The options object must set 'childList' to true.",
      );
    }

    if (options?.attributes != null) {
      throw new Error(
        "Failed to execute 'observe' on 'MutationObserver': attributes is not supported",
      );
    }

    if (options?.attributeFilter != null) {
      throw new Error(
        "Failed to execute 'observe' on 'MutationObserver': attributeFilter is not supported",
      );
    }

    if (options?.attributeOldValue != null) {
      throw new Error(
        "Failed to execute 'observe' on 'MutationObserver': attributeOldValue is not supported",
      );
    }

    if (options?.characterData != null) {
      throw new Error(
        "Failed to execute 'observe' on 'MutationObserver': characterData is not supported",
      );
    }

    if (options?.characterDataOldValue != null) {
      throw new Error(
        "Failed to execute 'observe' on 'MutationObserver': characterDataOldValue is not supported",
      );
    }

    const mutationObserverId = this._getOrCreateMutationObserverId();

    MutationObserverManager.observe({
      mutationObserverId,
      target,
      subtree: Boolean(options?.subtree),
    });
  }

  /**
   * Tells the observer to stop watching for mutations.
   * The observer can be reused by calling its `observe()` method again.
   */
  disconnect(): void {
    const mutationObserverId = this._mutationObserverId;
    if (mutationObserverId == null) {
      return;
    }

    MutationObserverManager.unobserveAll(mutationObserverId);

    MutationObserverManager.unregisterObserver(mutationObserverId);
    this._mutationObserverId = null;
  }

  _getOrCreateMutationObserverId(): MutationObserverId {
    let mutationObserverId = this._mutationObserverId;
    if (mutationObserverId == null) {
      mutationObserverId = MutationObserverManager.registerObserver(
        this,
        this._callback,
      );
      this._mutationObserverId = mutationObserverId;
    }
    return mutationObserverId;
  }

  // Only for tests
  __getObserverID(): ?MutationObserverId {
    return this._mutationObserverId;
  }
}

setPlatformObject(MutationObserver);
