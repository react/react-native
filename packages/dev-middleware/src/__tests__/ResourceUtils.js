/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export function withAbortSignalForEachTest(): Readonly<{signal: AbortSignal}> {
  const ref: {signal: AbortSignal} = {
    // $FlowFixMe[unsafe-getters-setters]
    get signal() {
      throw new Error(
        'The return value of withAbortSignalForEachTest is lazily initialized and can only be accessed in tests.',
      );
    },
  };
  let controller;
  beforeEach(() => {
    controller = new AbortController();
    Object.defineProperty(ref, 'signal', {
      value: controller.signal,
    });
  });
  afterEach(() => {
    controller.abort();
  });
  return ref;
}
