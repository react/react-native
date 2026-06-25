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

import Platform from '../../Utilities/Platform';

const ReactNativeVersion = require('../ReactNativeVersion');
const ReactNativeVersionCheck = require('../ReactNativeVersionCheck');

// Fantom runs the real C++ runtime, so the version sources are mocked manually
// by mutating the (real) modules instead of using jest.mock/resetModules.
//
// The original Jest test ran every case twice (with `__DEV__` true and false).
// `checkVersions()` does not branch on `__DEV__`, so the two runs were
// identical; the cases are run once here to avoid mutating the runtime's
// `__DEV__` value.
describe('checkVersions', () => {
  const originalJsVersion = {...ReactNativeVersion.version};
  const originalConstants = Platform.constants;
  const originalConsoleError = console.error;

  let mockConsoleError: JestMockFn<Array<unknown>, unknown>;

  beforeEach(() => {
    mockConsoleError = jest.fn();
    // $FlowFixMe[cannot-write]
    console.error = mockConsoleError;
  });

  afterEach(() => {
    _mockJsVersion(
      originalJsVersion.major,
      originalJsVersion.minor,
      originalJsVersion.patch,
      originalJsVersion.prerelease,
    );
    // $FlowFixMe[incompatible-type]
    // $FlowFixMe[prop-missing]
    Platform.__constants = originalConstants;
    // $FlowFixMe[cannot-write]
    console.error = originalConsoleError;
  });

  it('passes when all the versions are zero', () => {
    _mockJsVersion(0, 0, 0);
    _mockNativeVersion(0, 0, 0);

    expect(ReactNativeVersion.version).toEqual({
      major: 0,
      minor: 0,
      patch: 0,
      prerelease: null,
    });
    expect(() => ReactNativeVersionCheck.checkVersions()).not.toThrow();
  });

  it('passes when the minor matches when the major is zero', () => {
    _mockJsVersion(0, 1, 0);
    _mockNativeVersion(0, 1, 0);

    expect(() => ReactNativeVersionCheck.checkVersions()).not.toThrow();
  });

  it("logs error when the minor doesn't match when the major is zero", () => {
    _mockJsVersion(0, 1, 0);
    _mockNativeVersion(0, 2, 0);

    ReactNativeVersionCheck.checkVersions();
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError.mock.calls[0][0]).toContain(
      'React Native version mismatch',
    );
  });

  it("logs error when the major doesn't match", () => {
    _mockJsVersion(1, 0, 0);
    _mockNativeVersion(2, 0, 0);

    ReactNativeVersionCheck.checkVersions();
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError.mock.calls[0][0]).toContain(
      'React Native version mismatch',
    );
  });

  it("doesn't log error if the patch doesn't match", () => {
    _mockJsVersion(0, 1, 0);
    _mockNativeVersion(0, 1, 2);

    ReactNativeVersionCheck.checkVersions();
    expect(mockConsoleError).toHaveBeenCalledTimes(0);
  });

  it("doesn't log error if the prerelease doesn't match", () => {
    _mockJsVersion(0, 1, 0, 'beta.0');
    _mockNativeVersion(0, 1, 0, 'alpha.1');

    ReactNativeVersionCheck.checkVersions();
    expect(mockConsoleError).toHaveBeenCalledTimes(0);
  });
});

function _mockJsVersion(
  major: number = 0,
  minor: number = 0,
  patch: number = 0,
  prerelease: string | null = null,
) {
  ReactNativeVersion.version.major = major;
  ReactNativeVersion.version.minor = minor;
  ReactNativeVersion.version.patch = patch;
  ReactNativeVersion.version.prerelease = prerelease;
}

function _mockNativeVersion(
  major: number = 0,
  minor: number = 0,
  patch: number = 0,
  prerelease: string | null = null,
) {
  // $FlowFixMe[incompatible-type]
  // $FlowFixMe[prop-missing]
  Platform.__constants = {
    ...Platform.constants,
    reactNativeVersion: {major, minor, patch, prerelease},
  };
}
