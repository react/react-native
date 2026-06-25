/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#pragma once

#include "AnimationDriver.h"

namespace facebook::react {

class FrameAnimationDriver : public AnimationDriver {
 public:
  FrameAnimationDriver(
      int id,
      Tag animatedValueTag,
      std::optional<AnimationEndCallback> endCallback,
      folly::dynamic config,
      NativeAnimatedNodesManager *manager);

 protected:
  bool update(double timeDeltaMs, bool restarting) override;

  void updateConfig(folly::dynamic config) override;

 private:
  void onConfigChanged();

  std::vector<double> frames_{};
  double toValue_{0};
  std::optional<double> startValue_{};
  bool deferredStart_{false};
};

} // namespace facebook::react
