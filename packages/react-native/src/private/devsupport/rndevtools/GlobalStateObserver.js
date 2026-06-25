/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * Generic observer for a boolean state exposed via a native global object.
 *
 * Native code installs a global object with the following shape:
 *   global[globalName] = {
 *     [statusProperty]: boolean,
 *     subscribers: Set<(status: boolean) => void>,
 *     [callbackName]: (status: boolean) => void,
 *   }
 *
 * This class provides a JS-friendly API over that global object.
 */
class GlobalStateObserver {
  #globalName: string;
  #statusProperty: string;

  constructor(globalName: string, statusProperty: string) {
    this.#globalName = globalName;
    this.#statusProperty = statusProperty;
  }

  #hasNativeSupport(): boolean {
    return global.hasOwnProperty(this.#globalName);
  }

  getStatus(): boolean {
    if (!this.#hasNativeSupport()) {
      return false;
    }

    return global[this.#globalName][this.#statusProperty];
  }

  subscribe(callback: (status: boolean) => void): () => void {
    if (!this.#hasNativeSupport()) {
      return () => {};
    }

    global[this.#globalName].subscribers.add(callback);
    return () => {
      global[this.#globalName].subscribers.delete(callback);
    };
  }
}

export default GlobalStateObserver;
