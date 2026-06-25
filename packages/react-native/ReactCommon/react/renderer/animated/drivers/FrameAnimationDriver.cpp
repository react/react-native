/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "FrameAnimationDriver.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/animated/drivers/AnimationDriver.h>
#include <react/renderer/animated/drivers/AnimationDriverUtils.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>
#include <cmath>
#include <utility>

namespace facebook::react {

FrameAnimationDriver::FrameAnimationDriver(
    int id,
    Tag animatedValueTag,
    std::optional<AnimationEndCallback> endCallback,
    folly::dynamic config,
    NativeAnimatedNodesManager* manager)
    : AnimationDriver(
          id,
          animatedValueTag,
          std::move(endCallback),
          std::move(config),
          manager) {
  onConfigChanged();
}

void FrameAnimationDriver::updateConfig(folly::dynamic config) {
  AnimationDriver::updateConfig(config);
  onConfigChanged();
}

void FrameAnimationDriver::onConfigChanged() {
  auto frames = config_["frames"];
  react_native_assert(frames.type() == folly::dynamic::ARRAY);
  frames_.clear();
  for (const auto& frame : frames) {
    auto frameValue = frame.asDouble();
    frames_.push_back(frameValue);
  }
  toValue_ = config_["toValue"].asDouble();
  auto deferIt = config_.find("deferredStart");
  deferredStart_ = deferIt != config_.items().end() && deferIt->second.asBool();
}

bool FrameAnimationDriver::update(double timeDeltaMs, bool restarting) {
  if (auto node =
          manager_->getAnimatedNode<ValueAnimatedNode>(animatedValueTag_)) {
    if (!startValue_) {
      startValue_ = node->getRawValue();
    }

    if (deferredStart_ && restarting) {
      // On the very first update after start: output the starting value
      // (frame 0) and defer the time anchor. The base class will re-anchor
      // startFrameTimeMs_ on the next call, so elapsed time is measured
      // from the first frame that has actually been rendered — not from
      // when startAnimatingNode was dispatched.
      //
      // This prevents skipping initial frames when the UI thread is busy
      // with layout/mount work between animation start and first composite.
      node->setRawValue(
          startValue_.value() + frames_[0] * (toValue_ - startValue_.value()));
      markNodeUpdated(node->tag());
      startFrameTimeMs_ = -1;
      deferredStart_ = false;
      return false;
    }

    const auto startIndex =
        static_cast<size_t>(std::round(timeDeltaMs / SingleFrameIntervalMs));
    assert(startIndex >= 0);
    const auto nextIndex = startIndex + 1;

    double nextValue = NAN;
    auto isComplete = false;
    if (nextIndex >= frames_.size()) {
      if (iterations_ == -1 || currentIteration_ < iterations_) {
        // Use last frame value, just in case it's different from toValue_
        nextValue = startValue_.value() +
            frames_[frames_.size() - 1] * (toValue_ - startValue_.value());
      } else {
        nextValue = toValue_;
      }
      isComplete = true;
    } else {
      const auto fromInterval = startIndex * SingleFrameIntervalMs;
      const auto toInterval = nextIndex * SingleFrameIntervalMs;
      const auto fromValue = frames_[startIndex];
      const auto toValue = frames_[nextIndex];

      // Map timestamp to frame value (frames_ elements are in [0,1])
      const auto frameOutput = interpolate(
          timeDeltaMs,
          fromInterval,
          toInterval,
          fromValue,
          toValue,
          ExtrapolateTypeExtend,
          ExtrapolateTypeExtend);

      // Map frame to output value
      nextValue = interpolate(
          frameOutput,
          0,
          1,
          startValue_.value(),
          toValue_,
          ExtrapolateTypeExtend,
          ExtrapolateTypeExtend);
    }

    if (node->setRawValue(nextValue)) {
      markNodeUpdated(node->tag());
    }

    return isComplete;
  }

  return true;
}

} // namespace facebook::react
