/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const Clipboard = {
  getString: jest.fn(async () => '') as JestMockFn<[], Promise<string>>,
  setString: jest.fn() as JestMockFn<[string], void>,
};

export default Clipboard;
