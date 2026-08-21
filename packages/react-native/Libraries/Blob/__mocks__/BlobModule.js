/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const BlobModule: {
  createFromParts: JestMockFn<[Array<{...}>, Array<ArrayBuffer>, string], void>,
  release: JestMockFn<[string], void>,
} = {
  createFromParts: jest.fn(),
  release: jest.fn(),
};

export default BlobModule;
