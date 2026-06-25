/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const AccessibilityInfo = {
  addEventListener: jest.fn(() => ({
    remove: jest.fn(),
  })) as JestMockFn<$FlowFixMe, {remove: JestMockFn<[], void>}>,
  announceForAccessibility: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  announceForAccessibilityWithOptions: jest.fn() as JestMockFn<
    $FlowFixMe,
    $FlowFixMe,
  >,
  isAccessibilityServiceEnabled: jest.fn(() =>
    Promise.resolve(false),
  ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
  isBoldTextEnabled: jest.fn(() => Promise.resolve(false)) as JestMockFn<
    $FlowFixMe,
    $FlowFixMe,
  >,
  isGrayscaleEnabled: jest.fn(() => Promise.resolve(false)) as JestMockFn<
    $FlowFixMe,
    $FlowFixMe,
  >,
  isInvertColorsEnabled: jest.fn(() => Promise.resolve(false)) as JestMockFn<
    $FlowFixMe,
    $FlowFixMe,
  >,
  isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)) as JestMockFn<
    $FlowFixMe,
    $FlowFixMe,
  >,
  isHighTextContrastEnabled: jest.fn(() =>
    Promise.resolve(false),
  ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
  isDarkerSystemColorsEnabled: jest.fn(() =>
    Promise.resolve(false),
  ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
  prefersCrossFadeTransitions: jest.fn(() =>
    Promise.resolve(false),
  ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
  isReduceTransparencyEnabled: jest.fn(() =>
    Promise.resolve(false),
  ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)) as JestMockFn<
    $FlowFixMe,
    $FlowFixMe,
  >,
  setAccessibilityFocus: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  sendAccessibilityEvent: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  getRecommendedTimeoutMillis: jest.fn(() =>
    Promise.resolve(false),
  ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
};

export default AccessibilityInfo;
