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

class SpringAnimationDriver : public AnimationDriver {
 public:
  SpringAnimationDriver(
      int id,
      Tag animatedValueTag,
      std::optional<AnimationEndCallback> endCallback,
      folly::dynamic config,
      NativeAnimatedNodesManager* manager);

 protected:
  bool update(double timeDeltaMs, bool restarting) override;

 private:
  std::tuple<float, double> getValueAndVelocityForTime(double time) const;
  bool isAtRest(double currentVelocity, double currentValue, double endValue)
      const;
  bool isOvershooting(double currentValue) const;

  double springStiffness_{0};
  double springDamping_{0};
  double springMass_{0};
  double initialVelocity_{0};
  std::optional<double> fromValue_{std::nullopt};
  double endValue_{0};
  double restSpeedThreshold_{0};
  double displacementFromRestThreshold_{0};
  bool overshootClampingEnabled_{false};

  double lastTime_{0};
  double timeAccumulator_{0};
};

} // namespace facebook::react
