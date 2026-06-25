/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const AppState = {
  addEventListener: jest.fn(() => ({
    remove: jest.fn(),
  })) as JestMockFn<$FlowFixMe, $FlowFixMe>,
  removeEventListener: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  currentState: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
};

export default AppState;
