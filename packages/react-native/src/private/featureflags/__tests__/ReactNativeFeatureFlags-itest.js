/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import {dangerouslyResetForTesting} from '../ReactNativeFeatureFlagsBase';

const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');

// These cases exercise the JS-only override/caching mechanism, which can run
// against the real runtime. `dangerouslyResetForTesting()` replaces the
// `jest.resetModules()` isolation used by the Jest version.
//
// The cases that simulate the native module being unavailable or returning
// custom values still live in `ReactNativeFeatureFlags-test.js` because they
// fundamentally require mocking the `NativeReactNativeFeatureFlags` spec, which
// Fantom cannot do (it runs the real native module).
describe('ReactNativeFeatureFlags', () => {
  beforeEach(() => {
    dangerouslyResetForTesting();
  });

  afterEach(() => {
    dangerouslyResetForTesting();
  });

  it('should provide default values for JS-only flags', () => {
    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(false);
  });

  it('should access and cache overridden JS-only flags', () => {
    const jsOnlyTestFlagFn = jest.fn(() => true);
    ReactNativeFeatureFlags.override({
      jsOnlyTestFlag: jsOnlyTestFlagFn,
    });

    expect(jsOnlyTestFlagFn).toHaveBeenCalledTimes(0);

    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(true);
    expect(jsOnlyTestFlagFn).toHaveBeenCalledTimes(1);

    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(true);
    expect(jsOnlyTestFlagFn).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if any of the JS flags has been accessed before overridding', () => {
    ReactNativeFeatureFlags.jsOnlyTestFlag();

    expect(() =>
      ReactNativeFeatureFlags.override({
        jsOnlyTestFlag: () => true,
      }),
    ).toThrow(
      'Feature flags were accessed before being overridden: jsOnlyTestFlag',
    );
  });

  it('should NOT throw an error if any of the common flags has been accessed before overridding', () => {
    ReactNativeFeatureFlags.commonTestFlag();

    expect(() => {
      ReactNativeFeatureFlags.override({
        jsOnlyTestFlag: () => true,
      });
    }).not.toThrow();

    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(true);
  });

  it('should throw an error when trying to set overrides twice', () => {
    ReactNativeFeatureFlags.override({
      jsOnlyTestFlag: () => true,
    });

    expect(() =>
      ReactNativeFeatureFlags.override({
        jsOnlyTestFlag: () => false,
      }),
    ).toThrow('Feature flags cannot be overridden more than once');
  });

  it('should evaluate to default value if the override returns null', () => {
    ReactNativeFeatureFlags.override({
      jsOnlyTestFlag: () => null,
    });

    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(false);
  });

  it('should evaluate to default value if the override returns undefined', () => {
    ReactNativeFeatureFlags.override({
      jsOnlyTestFlag: () => undefined,
    });

    expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(false);
  });
});
