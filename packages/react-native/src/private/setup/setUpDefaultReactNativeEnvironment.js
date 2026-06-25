/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

let initialized = false;

export default function setUpDefaltReactNativeEnvironment(
  enableDeveloperTools: boolean = true,
) {
  if (initialized) {
    return;
  }

  initialized = true;

  require('../../../Libraries/Core/setUpGlobals');
  require('./setUpDOM').default();
  require('../../../Libraries/Core/setUpPerformance');
  require('../../../Libraries/Core/polyfillPromise');
  require('../../../Libraries/Core/setUpTimers');
  if (__DEV__ && enableDeveloperTools) {
    require('../../../Libraries/Core/setUpReactDevTools');
  }
  require('../../../Libraries/Core/setUpErrorHandling');
  require('../../../Libraries/Core/setUpRegeneratorRuntime');
  require('../../../Libraries/Core/setUpXHR');
  require('../../../Libraries/Core/setUpAlert');
  require('../../../Libraries/Core/setUpNavigator');
  require('../../../Libraries/Core/setUpBatchedBridge');
  require('../../../Libraries/Core/setUpSegmentFetcher');
  if (__DEV__ && enableDeveloperTools) {
    require('../../../Libraries/Core/checkNativeVersion');
    require('../../../Libraries/Core/setUpDeveloperTools');
    require('../../../Libraries/LogBox/LogBox').default.install();
  }

  require('../../../Libraries/ReactNative/AppRegistry');

  if (
    require('../../../src/private/featureflags/ReactNativeFeatureFlags').enableIntersectionObserverByDefault()
  ) {
    require('./setUpIntersectionObserver').default();
  }

  if (
    require('../../../src/private/featureflags/ReactNativeFeatureFlags').enableMutationObserverByDefault()
  ) {
    require('./setUpMutationObserver').default();
  }
}
