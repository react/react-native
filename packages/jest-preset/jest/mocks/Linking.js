/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const Linking = {
  openURL: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  canOpenURL: jest.fn(() => Promise.resolve(true)) as JestMockFn<
    $FlowFixMe,
    $FlowFixMe,
  >,
  openSettings: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  addEventListener: jest.fn(() => ({
    remove: jest.fn(),
  })) as JestMockFn<$FlowFixMe, $FlowFixMe>,
  getInitialURL: jest.fn(() => Promise.resolve()) as JestMockFn<
    $FlowFixMe,
    $FlowFixMe,
  >,
  sendIntent: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
};

export default Linking;
