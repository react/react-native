/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/animationbackend/AnimationChoreographer.h>
#include <atomic>

namespace facebook::react {

class AndroidAnimationChoreographer : public AnimationChoreographer {
 public:
  void resume() override
  {
    active_.store(true);
  }

  void pause() override
  {
    active_.store(false);
  }

  void onAnimationFrameIfActive(AnimationTimestamp timestamp) const
  {
    if (active_.load()) {
      onAnimationFrame(timestamp);
    }
  }

 private:
  std::atomic_bool active_{false};
};

} // namespace facebook::react
