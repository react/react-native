/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableMutationObserverByDefault:*
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

declare var MutationRecord: unknown;

// TODO: Merge into `setUpDefaultReactNativeEnvironment-Globals-itest.js` once
// the `enableMutationObserverByDefault` feature flag is cleaned up and the
// MutationObserver globals are exposed unconditionally.
describe('setUpDefaultReactNativeEnvironment (MutationObserver globals)', () => {
  if (ReactNativeFeatureFlags.enableMutationObserverByDefault()) {
    describe('when enableMutationObserverByDefault is enabled', () => {
      it('should provide MutationObserver', () => {
        expect(typeof MutationObserver).toBe('function');
      });

      it('should provide MutationRecord', () => {
        expect(typeof MutationRecord).toBe('function');
      });
    });
  } else {
    describe('when enableMutationObserverByDefault is disabled', () => {
      it('should not provide MutationObserver', () => {
        expect(typeof MutationObserver).toBe('undefined');
      });

      it('should not provide MutationRecord', () => {
        expect(typeof MutationRecord).toBe('undefined');
      });
    });
  }
});
