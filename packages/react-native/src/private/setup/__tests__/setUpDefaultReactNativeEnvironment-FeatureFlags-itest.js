/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as ReactNativeFeatureFlags from '../../featureflags/ReactNativeFeatureFlags';
import * as ReactNativeFeatureFlagsBase from '../../featureflags/ReactNativeFeatureFlagsBase';
import setUpDefaultReactNativeEnvironment from '../setUpDefaultReactNativeEnvironment';

describe('setUpReactNativeEnvironment (feature flags side-effects)', () => {
  it('should not read any feature flags', () => {
    ReactNativeFeatureFlagsBase.dangerouslyResetForTesting();

    setUpDefaultReactNativeEnvironment(false);

    expect(() => {
      // If any feature flags were read, this call would fail.
      ReactNativeFeatureFlags.override({
        jsOnlyTestFlag: () => true,
      });
    }).not.toThrow();
  });
});
