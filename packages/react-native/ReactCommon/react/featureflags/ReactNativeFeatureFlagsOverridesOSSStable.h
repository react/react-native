/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

namespace facebook::react {

class ReactNativeFeatureFlagsOverridesOSSStable : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableBridgelessArchitecture() override
  {
    return true;
  }
  bool useNativeViewConfigsInBridgelessMode() override
  {
    return true;
  }
};
} // namespace facebook::react
