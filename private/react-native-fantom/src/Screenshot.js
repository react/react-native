/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

type NativeScreenshot = {
  saveToFile(filePath: string): void,
  isEqual(other: NativeScreenshot): boolean,
  getHash(): string,
};

export default class Screenshot {
  #nativeScreenshot: NativeScreenshot;

  constructor(nativeScreenshot: NativeScreenshot) {
    this.#nativeScreenshot = nativeScreenshot;
  }

  saveToFile(filePath: string): void {
    this.#nativeScreenshot.saveToFile(filePath);
  }

  isEqual(other: Screenshot): boolean {
    return (
      other instanceof Screenshot &&
      this.#nativeScreenshot.isEqual(other.#nativeScreenshot)
    );
  }

  toJSON(): {type: 'Screenshot', hash: string} {
    return {type: 'Screenshot', hash: this.#nativeScreenshot.getHash()};
  }
}
