/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutAnimationDriver.h"

#include <glog/logging.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/animations/utils.h>
#include <algorithm>

namespace facebook::react {

void LayoutAnimationDriver::animationMutationsForFrame(
    SurfaceId surfaceId,
    ShadowViewMutation::List& mutationsList,
    uint64_t now) const {
  for (auto& animation : inflightAnimations_) {
    if (animation.surfaceId != surfaceId) {
      continue;
    }
    if (animation.completed) {
      continue;
    }

    int incompleteAnimations = 0;
    for (auto& keyframe : animation.keyFrames) {
      if (keyframe.invalidated) {
        continue;
      }

      const auto& baselineShadowView = keyframe.viewStart;
      const auto& finalShadowView = keyframe.viewEnd;

      // The contract with the "keyframes generation" phase is that any animated
      // node will have a valid configuration.
      const auto layoutAnimationConfig = animation.layoutAnimationConfig;
      const auto& mutationConfig =
          (keyframe.type == AnimationConfigurationType::Delete
               ? layoutAnimationConfig.deleteConfig
               : (keyframe.type == AnimationConfigurationType::Create
                      ? layoutAnimationConfig.createConfig
                      : layoutAnimationConfig.updateConfig));

      // Interpolate
      auto progress =
          calculateAnimationProgress(now, animation, mutationConfig);
      auto animationTimeProgressLinear = progress.first;
      auto animationInterpolationFactor = progress.second;

      auto mutatedShadowView = createInterpolatedShadowView(
          animationInterpolationFactor, baselineShadowView, finalShadowView);

      // Create the mutation instruction
      mutationsList.emplace_back(
          ShadowViewMutation::UpdateMutation(
              keyframe.viewPrev, mutatedShadowView, keyframe.parentTag));

      PrintMutationInstruction("Animation Progress:", mutationsList.back());

      keyframe.viewPrev = std::move(mutatedShadowView);

      if (animationTimeProgressLinear < 1) {
        incompleteAnimations++;
      }
    }

    // Are there no ongoing mutations left in this animation?
    if (incompleteAnimations == 0) {
      animation.completed = true;
    }
  }

  // Record boundary: animation-frame Updates above this point carry
  // parentTag from before any structural changes and must execute first.
  auto animationUpdatesEnd = mutationsList.size();

  // Clear out finished animations
  for (auto it = inflightAnimations_.begin();
       it != inflightAnimations_.end();) {
    const auto& animation = *it;
    if (animation.completed) {
      callCallback(animation.successCallback);

      // Queue up "final" mutations for all keyframes in the completed animation
      for (const auto& keyframe : animation.keyFrames) {
        if (keyframe.invalidated) {
          continue;
        }
        queueFinalMutationsForCompletedKeyFrame(
            keyframe,
            mutationsList,
            false,
            "LayoutAnimationDriver: Animation Completed");
      }

      it = inflightAnimations_.erase(it);
    } else {
      it++;
    }
  }

  // Sort only the final mutations from completed animations.
  // Animation-frame Updates must stay before structural mutations because
  // they reference views by their pre-structural-change parentTag.
  std::stable_sort(
      mutationsList.begin() + static_cast<ptrdiff_t>(animationUpdatesEnd),
      mutationsList.end(),
      &shouldFirstComeBeforeSecondMutation);
}

} // namespace facebook::react
