/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableIntersectionObserverByDefault:*
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

declare var IntersectionObserverEntry: unknown;

// TODO: Merge into `setUpDefaultReactNativeEnvironment-Globals-itest.js` once
// the `enableIntersectionObserverByDefault` feature flag is cleaned up and the
// IntersectionObserver globals are exposed unconditionally.
describe('setUpDefaultReactNativeEnvironment (IntersectionObserver globals)', () => {
  if (ReactNativeFeatureFlags.enableIntersectionObserverByDefault()) {
    describe('when enableIntersectionObserverByDefault is enabled', () => {
      it('should provide IntersectionObserver', () => {
        expect(typeof IntersectionObserver).toBe('function');
      });

      it('should provide IntersectionObserverEntry', () => {
        expect(typeof IntersectionObserverEntry).toBe('function');
      });
    });
  } else {
    describe('when enableIntersectionObserverByDefault is disabled', () => {
      it('should not provide IntersectionObserver', () => {
        expect(typeof IntersectionObserver).toBe('undefined');
      });

      it('should not provide IntersectionObserverEntry', () => {
        expect(typeof IntersectionObserverEntry).toBe('undefined');
      });
    });
  }
});
