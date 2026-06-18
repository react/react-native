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

#include "ValueAnimatedNode.h"

#include <react/renderer/animated/internal/primitives.h>
#include <react/renderer/graphics/Color.h>

namespace facebook::react {

class InterpolationAnimatedNode final : public ValueAnimatedNode {
 public:
  InterpolationAnimatedNode(Tag tag, const folly::dynamic &config, NativeAnimatedNodesManager &manager);

  void update() override;
  void onDetachedFromNode(Tag animatedNodeTag) override;
  void onAttachToNode(Tag animatedNodeTag) override;

 private:
  double interpolateValue(double value);
  double interpolateColor(double value);
  double interpolatePlatformColor(double value);

  // Applies the optional easing stops to a segment's normalized ratio via binary
  // search + linear interpolation. Returns the ratio unchanged when no easing is
  // configured or when the ratio falls outside [0, 1] (so extrapolation behavior
  // is preserved).
  double easeRatio(double ratio) const;

  SurfaceId resolveConnectedRootTag() const;

  std::vector<double> inputRanges_;
  std::vector<double> defaultOutputRanges_;
  std::vector<Color> colorOutputRanges_;
  std::vector<folly::dynamic> platformColorOutputRanges_;
  // Non-uniform easing stops (RDP-simplified, CSS `linear()`-style) baked from a
  // JS interpolation `easing` function. `easingStopInputs_` are the stop
  // positions in [0, 1] (sorted), `easingStopOutputs_` the eased values. Both
  // empty when the interpolation has no custom easing.
  std::vector<double> easingStopInputs_;
  std::vector<double> easingStopOutputs_;
  std::string extrapolateLeft_;
  std::string extrapolateRight_;

  std::string outputType_;

  Tag parentTag_{animated::undefinedAnimatedNodeIdentifier};

  // Needed for PlatformColor resolver
  SurfaceId connectedRootTag_{animated::undefinedAnimatedNodeIdentifier};
};
} // namespace facebook::react
