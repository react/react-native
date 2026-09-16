/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableResizeObserverByDefault:*
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

declare var ResizeObserverEntry: unknown;
declare var ResizeObserverSize: unknown;

// TODO: Merge into `setUpDefaultReactNativeEnvironment-Globals-itest.js` once
// the `enableResizeObserverByDefault` feature flag is cleaned up and the
// ResizeObserver globals are exposed unconditionally.
describe('setUpDefaultReactNativeEnvironment (ResizeObserver globals)', () => {
  if (ReactNativeFeatureFlags.enableResizeObserverByDefault()) {
    describe('when enableResizeObserverByDefault is enabled', () => {
      it('should provide ResizeObserver', () => {
        expect(typeof ResizeObserver).toBe('function');
      });

      it('should provide ResizeObserverEntry', () => {
        expect(typeof ResizeObserverEntry).toBe('function');
      });

      it('should provide ResizeObserverSize', () => {
        expect(typeof ResizeObserverSize).toBe('function');
      });
    });
  } else {
    describe('when enableResizeObserverByDefault is disabled', () => {
      it('should not provide ResizeObserver', () => {
        expect(typeof ResizeObserver).toBe('undefined');
      });

      it('should not provide ResizeObserverEntry', () => {
        expect(typeof ResizeObserverEntry).toBe('undefined');
      });

      it('should not provide ResizeObserverSize', () => {
        expect(typeof ResizeObserverSize).toBe('undefined');
      });
    });
  }
});
