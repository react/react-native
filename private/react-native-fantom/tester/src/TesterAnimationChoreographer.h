/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <react/renderer/animationbackend/AnimationChoreographer.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/runtime/ReactInstanceConfig.h>

namespace facebook::react {

class TesterAnimationChoreographer : public AnimationChoreographer {
 public:
  void resume() override;
  void pause() override;
  void runUITick(AnimationTimestamp timestamp);

  AnimationTimestamp now() const override
  {
    if (clockProvider_) {
      return clockProvider_();
    }
    return AnimationChoreographer::now();
  }

  void setClockProvider(std::function<AnimationTimestamp()> clockProvider)
  {
    clockProvider_ = std::move(clockProvider);
  }

 private:
  bool isPaused_{false};
  std::function<AnimationTimestamp()> clockProvider_;
};

} // namespace facebook::react
