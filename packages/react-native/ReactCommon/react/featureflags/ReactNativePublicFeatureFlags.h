/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<39037a69a47b86d0c6643d90f4058002>>
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
