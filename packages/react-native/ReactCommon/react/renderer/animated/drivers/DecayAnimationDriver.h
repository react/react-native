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

class DecayAnimationDriver : public AnimationDriver {
 public:
  DecayAnimationDriver(
      int id,
      Tag animatedValueTag,
      std::optional<AnimationEndCallback> endCallback,
      folly::dynamic config,
      NativeAnimatedNodesManager* manager);

 protected:
  bool update(double timeDeltaMs, bool restarting) override;

 private:
  std::tuple<float, double> getValueAndVelocityForTime(double time) const;

 private:
  double velocity_{0};
  double deceleration_{0};
  std::optional<double> fromValue_{std::nullopt};
  std::optional<double> lastValue_{0};
};

} // namespace facebook::react
