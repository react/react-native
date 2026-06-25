/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// Pretend to not run in a testing environment so we log the warning for the
// missing native module to the console.
process.env.NODE_ENV = 'development';

describe('ReactNativeFeatureFlags', () => {
  beforeEach(() => {
    jest.unmock('../specs/NativeReactNativeFeatureFlags');
    jest.resetModules();
    jest.restoreAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should provide default values for common flags and NOT log an error if the native module is available but the method is NOT defined', () => {
    jest.doMock('../specs/NativeReactNativeFeatureFlags', () => ({
      __esModule: true,
      default: {},
    }));

    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');
    expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(false);

    expect(console.error).toHaveBeenCalledTimes(0);
  });

  it('should access and cache common flags from the native module if it is available', () => {
    const commonTestFlagFn = jest.fn(() => true);

    jest.doMock('../specs/NativeReactNativeFeatureFlags', () => ({
      __esModule: true,
      default: {
        commonTestFlag: commonTestFlagFn,
      },
    }));

    const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');

    expect(commonTestFlagFn).toHaveBeenCalledTimes(0);

    expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(true);
    expect(commonTestFlagFn).toHaveBeenCalledTimes(1);

    expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(true);
    expect(commonTestFlagFn).toHaveBeenCalledTimes(1);
  });

  describe('when the native module is NOT available', () => {
    let originalBridgelessValue;

    beforeEach(() => {
      originalBridgelessValue = global.RN$Bridgeless;
    });

    afterEach(() => {
      // $FlowExpectedError[cannot-write]
      global.RN$Bridgeless = originalBridgelessValue;
    });

    it('should provide default values for common flags and log an error if TurboModules are available', () => {
      // $FlowExpectedError[cannot-write]
      global.RN$Bridgeless = true;

      const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');
      expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(false);

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        "Could not access feature flag 'commonTestFlag' because native module method was not available",
      );
    });

    it('should provide default values for common flags and NOT log an error if TurboModules are NOT available', () => {
      // $FlowExpectedError[cannot-write]
      global.RN$Bridgeless = false;

      const ReactNativeFeatureFlags = require('../ReactNativeFeatureFlags');
      expect(ReactNativeFeatureFlags.commonTestFlag()).toBe(false);

      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
