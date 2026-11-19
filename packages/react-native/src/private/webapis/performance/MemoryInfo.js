/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {setPlatformObject} from '../webidl/PlatformObjects';

type MemoryInfoLike = {
  jsHeapSizeLimit: ?number,
  totalJSHeapSize: ?number,
  usedJSHeapSize: ?number,
};

// Read-only object with JS memory information. This is returned by the performance.memory API.
export default class MemoryInfo {
  #jsHeapSizeLimit: ?number;
  #totalJSHeapSize: ?number;
  #usedJSHeapSize: ?number;

  constructor(memoryInfo: ?MemoryInfoLike) {
    if (memoryInfo != null) {
      this.#jsHeapSizeLimit = memoryInfo.jsHeapSizeLimit;
      this.#totalJSHeapSize = memoryInfo.totalJSHeapSize;
      this.#usedJSHeapSize = memoryInfo.usedJSHeapSize;
    }
  }

  /**
   * The maximum size of the heap, in bytes, that is available to the context
   */
  // $FlowFixMe[unsafe-getters-setters]
  get jsHeapSizeLimit(): ?number {
    return this.#jsHeapSizeLimit;
  }

  /**
   * The total allocated heap size, in bytes
   */
  // $FlowFixMe[unsafe-getters-setters]
  get totalJSHeapSize(): ?number {
    return this.#totalJSHeapSize;
  }

  /**
   * The currently active segment of JS heap, in bytes.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get usedJSHeapSize(): ?number {
    return this.#usedJSHeapSize;
  }
}

setPlatformObject(MemoryInfo);
