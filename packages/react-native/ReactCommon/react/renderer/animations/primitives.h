/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/animations/LayoutAnimationCallbackWrapper.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <vector>

namespace facebook::react {

// This corresponds exactly with JS.
enum class AnimationType {
  None = 0,
  Spring = 1,
  Linear = 2,
  EaseInEaseOut = 4,
  EaseIn = 8,
  EaseOut = 16,
  Keyboard = 32
};

enum class AnimationProperty {
  NotApplicable = 0,
  Opacity = 1,
  ScaleX = 2,
  ScaleY = 4,
  ScaleXY = 8
};

// This corresponds exactly with JS.
struct AnimationConfig {
  AnimationType animationType = AnimationType::None;
  AnimationProperty animationProperty = AnimationProperty::NotApplicable;
  double duration =
      0; // these are perhaps better represented as uint64_t, but they
  // come from JS as doubles
  double delay = 0;
  Float springDamping = 0;
  Float initialVelocity = 0;
};

// This corresponds exactly with JS.
struct LayoutAnimationConfig {
  double duration; // ms
  AnimationConfig createConfig;
  AnimationConfig updateConfig;
  AnimationConfig deleteConfig;
};

enum class AnimationConfigurationType { Create = 1, Update = 2, Delete = 4 };

struct AnimationKeyFrame {
  // The mutation(s) that should be executed once the animation completes.
  // This maybe empty.
  // For CREATE/INSERT this will contain CREATE, INSERT in that order.
  // For REMOVE/DELETE, same.
  std::vector<ShadowViewMutation> finalMutationsForKeyFrame;

  // The type of animation this is (for configuration purposes)
  AnimationConfigurationType type;

  // Tag representing the node being animated.
  Tag tag;

  Tag parentTag;

  // ShadowView representing the start and end points of this animation.
  ShadowView viewStart;
  ShadowView viewEnd;

  // ShadowView representing the previous frame of the animation.
  ShadowView viewPrev;

  // If an animation interrupts an existing one, the starting state may actually
  // be halfway through the intended transition.
  double initialProgress;

  bool invalidated{false};

  // In the case where some mutation conflicts with this keyframe,
  // should we generate final synthetic UPDATE mutations for this keyframe?
  bool generateFinalSyntheticMutations{true};
};

struct LayoutAnimation {
  SurfaceId surfaceId;
  uint64_t startTime;
  bool completed = false;
  LayoutAnimationConfig layoutAnimationConfig;
  LayoutAnimationCallbackWrapper successCallback;
  LayoutAnimationCallbackWrapper failureCallback;
  std::vector<AnimationKeyFrame> keyFrames;
};

} // namespace facebook::react
