/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<571d4f35aacf5086c088bdc8dd1abd33>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags --update
 */

#pragma once

#include <string>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook::react {

/**
 * This class provides public access to select internal React Native feature flags.
 */
class ReactNativeFeatureFlags_DO_NOT_USE {
 public:
  /**
   * When enabled, Android will accumulate updates in rawProps to reduce the number of mounting instructions for cascading re-renders.
   */
  RN_EXPORT static bool enableAccumulatedUpdatesInRawPropsAndroid();

  /**
   * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
   */
  RN_EXPORT static bool enableCppPropsIteratorSetter();

  /**
   * When enabled, Android will disable Props 1.5 raw value merging when Props 2.0 is available.
   */
  RN_EXPORT static bool enableExclusivePropsUpdateAndroid();

  /**
   * When enabled, Android mounts transactions with the pull model (like iOS): the commit thread no longer pulls and builds the mount batch in schedulerShouldRenderTransactions. Instead the UI thread pulls the transaction itself at its next mount dispatch, builds the IntBufferBatchMountItem, and applies it synchronously. Requires `enableAccumulatedUpdatesInRawPropsAndroid` to be enabled as well, since a single pull may collapse several commits into one diff and therefore needs complete accumulated rawProps; when used together with Props 2.0, also enable `enableExclusivePropsUpdateAndroid` and `enablePropsUpdateReconciliationAndroid`.
   */
  RN_EXPORT static bool enableMountingCoordinatorPullModelAndroid();

  /**
   * Parse CSS strings using the Fabric CSS parser instead of ViewConfig processing
   */
  RN_EXPORT static bool enableNativeCSSParsing();

  /**
   * When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.
   */
  RN_EXPORT static bool enablePropsUpdateReconciliationAndroid();

  /**
   * Use shared animation backend in C++ Animated
   */
  RN_EXPORT static bool useSharedAnimatedBackend();
};

} // namespace facebook::react
