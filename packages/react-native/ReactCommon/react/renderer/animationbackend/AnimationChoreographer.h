/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/uimanager/UIManagerAnimationBackend.h>
#include <react/timing/primitives.h>

namespace facebook::react {

/*
 * This class serves as an interface for native animation frame scheduling that can be used as abstraction in
 * ReactCxxPlatform.
 */
class AnimationChoreographer {
 public:
  virtual ~AnimationChoreographer() = default;

  virtual void resume() = 0;
  virtual void pause() = 0;
  virtual AnimationTimestamp now() const
  {
    return HighResTimeStamp::now().toChronoSteadyClockTimePoint().time_since_epoch();
  }
  void setAnimationBackend(std::weak_ptr<UIManagerAnimationBackend> animationBackend)
  {
    animationBackend_ = animationBackend;
  }
  void onAnimationFrame(AnimationTimestamp timestamp) const
  {
    if (auto animationBackend = animationBackend_.lock()) {
      animationBackend->onAnimationFrame(timestamp);
    }
  }

 private:
  std::weak_ptr<UIManagerAnimationBackend> animationBackend_;
};

} // namespace facebook::react
