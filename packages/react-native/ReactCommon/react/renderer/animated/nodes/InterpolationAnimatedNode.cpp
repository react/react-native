/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "InterpolationAnimatedNode.h"

#include <glog/logging.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/drivers/AnimationDriverUtils.h>
#include <react/renderer/animated/internal/primitives.h>
#include <react/renderer/animated/nodes/PropsAnimatedNode.h>
#include <react/renderer/graphics/HostPlatformColor.h>
#include <algorithm>

namespace facebook::react {

InterpolationAnimatedNode::InterpolationAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : ValueAnimatedNode(tag, config, manager) {
  // inputRange example: [0, 1, 10], [1, 1.4, 1.5]
  const auto& nodeConfig = getConfig();
  for (const auto& rangeValue : nodeConfig["inputRange"]) {
    inputRanges_.push_back(rangeValue.asDouble());
  }

  const auto outputType = nodeConfig["outputType"].isString()
      ? nodeConfig["outputType"].asString()
      : "";
  outputType_ = outputType;
  if (outputType == "color") {
    isColorValue_ = true;
    for (const auto& rangeValue : nodeConfig["outputRange"]) {
      colorOutputRanges_.push_back(static_cast<int>(rangeValue.asInt()));
    }
  } else if (outputType == "platform_color") {
    for (const auto& rangeValue : nodeConfig["outputRange"]) {
      platformColorOutputRanges_.push_back(rangeValue);
    }
  } else {
    for (const auto& rangeValue : nodeConfig["outputRange"]) {
      defaultOutputRanges_.push_back(rangeValue.asDouble());
    }
  }

  extrapolateLeft_ = nodeConfig["extrapolateLeft"].asString();
  extrapolateRight_ = nodeConfig["extrapolateRight"].asString();

  // Optional non-uniform easing stops baked from a JS interpolation `easing`
  // function, as [position, value] pairs. Absent for interpolations without
  // custom easing.
  if (auto easingStopsIt = nodeConfig.find("easingStops");
      easingStopsIt != nodeConfig.items().end()) {
    const auto& easingStops = easingStopsIt->second;
    react_native_assert(easingStops.type() == folly::dynamic::ARRAY);
    for (const auto& stop : easingStops) {
      react_native_assert(
          stop.type() == folly::dynamic::ARRAY && stop.size() == 2);
      easingStopInputs_.push_back(stop[0].asDouble());
      easingStopOutputs_.push_back(stop[1].asDouble());
    }
  }
}

double InterpolationAnimatedNode::easeRatio(double ratio) const {
  // No easing, or out-of-range ratio (extrapolation) — leave it untouched.
  if (easingStopInputs_.size() < 2 || ratio < 0.0 || ratio > 1.0) {
    return ratio;
  }
  // Binary search for the stop segment [lower, upper] bracketing `ratio`.
  const auto it = std::upper_bound(
      easingStopInputs_.begin(), easingStopInputs_.end(), ratio);
  if (it == easingStopInputs_.begin()) {
    return easingStopOutputs_.front();
  }
  if (it == easingStopInputs_.end()) {
    return easingStopOutputs_.back();
  }
  const auto upper = static_cast<size_t>(it - easingStopInputs_.begin());
  const auto lower = upper - 1;
  const auto inputLo = easingStopInputs_[lower];
  const auto inputHi = easingStopInputs_[upper];
  if (inputHi == inputLo) {
    return easingStopOutputs_[upper];
  }
  const auto weight = (ratio - inputLo) / (inputHi - inputLo);
  return easingStopOutputs_[lower] +
      (easingStopOutputs_[upper] - easingStopOutputs_[lower]) * weight;
}

void InterpolationAnimatedNode::update() {
  if (parentTag_ == animated::undefinedAnimatedNodeIdentifier) {
    return;
  }

  if (const auto node =
          manager_->getAnimatedNode<ValueAnimatedNode>(parentTag_)) {
    if (outputType_ == "color") {
      setRawValue(interpolateColor(node->getValue()));
    } else if (outputType_ == "platform_color") {
      setRawValue(interpolatePlatformColor(node->getValue()));
    } else {
      setRawValue(interpolateValue(node->getValue()));
    }
  }
}

void InterpolationAnimatedNode::onDetachedFromNode(Tag animatedNodeTag) {
  assert(parentTag_ == animatedNodeTag);
  parentTag_ = animated::undefinedAnimatedNodeIdentifier;
}

void InterpolationAnimatedNode::onAttachToNode(Tag animatedNodeTag) {
  assert(!parentTag_);
  parentTag_ = animatedNodeTag;
}

double InterpolationAnimatedNode::interpolateValue(double value) {
  // Compute range index
  int index = 1;
  for (; index < inputRanges_.size() - 1; ++index) {
    if (inputRanges_[index] >= value) {
      break;
    }
  }
  index--;

  const auto inputMin = inputRanges_[index];
  const auto inputMax = inputRanges_[index + 1];
  const auto outputMin = defaultOutputRanges_[index];
  const auto outputMax = defaultOutputRanges_[index + 1];

  if (!easingStopInputs_.empty() && inputMin != inputMax) {
    const auto ratio = (value - inputMin) / (inputMax - inputMin);
    if (ratio >= 0.0 && ratio <= 1.0) {
      // In-range: map the eased ratio straight to the output. The easing may
      // overshoot [0, 1] (e.g. Easing.back/elastic); that overshoot must be
      // preserved, not clamped — it comes from the easing, not from an
      // out-of-range input. This matches JS, where easing runs after
      // extrapolation handling. Out-of-range inputs fall through to linear
      // extrapolation below (the stops only cover [0, 1]).
      return outputMin + easeRatio(ratio) * (outputMax - outputMin);
    }
  }

  return interpolate(
      value,
      inputMin,
      inputMax,
      outputMin,
      outputMax,
      extrapolateLeft_,
      extrapolateRight_);
}

double InterpolationAnimatedNode::interpolateColor(double value) {
  // Compute range index
  int index = 1;
  for (; index < inputRanges_.size() - 1; ++index) {
    if (inputRanges_[index] >= value) {
      break;
    }
  }
  index--;

  const auto outputMin = colorOutputRanges_[index];
  const auto outputMax = colorOutputRanges_[index + 1];
  if (outputMin == outputMax) {
    return outputMin;
  }

  const auto inputMin = inputRanges_[index];
  const auto inputMax = inputRanges_[index + 1];
  if (inputMin == inputMax) {
    if (value <= inputMin) {
      return static_cast<int32_t>(outputMin);
    } else {
      return static_cast<int32_t>(outputMax);
    }
  }

  auto ratio = easeRatio((value - inputMin) / (inputMax - inputMin));

  auto outputMinA = alphaFromHostPlatformColor(outputMin);
  auto outputMinR = redFromHostPlatformColor(outputMin);
  auto outputMinG = greenFromHostPlatformColor(outputMin);
  auto outputMinB = blueFromHostPlatformColor(outputMin);

  auto outputMaxA = alphaFromHostPlatformColor(outputMax);
  auto outputMaxR = redFromHostPlatformColor(outputMax);
  auto outputMaxG = greenFromHostPlatformColor(outputMax);
  auto outputMaxB = blueFromHostPlatformColor(outputMax);

  auto outputValueA = ratio * (outputMaxA - outputMinA) + outputMinA;
  auto outputValueR = ratio * (outputMaxR - outputMinR) + outputMinR;
  auto outputValueG = ratio * (outputMaxG - outputMinG) + outputMinG;
  auto outputValueB = ratio * (outputMaxB - outputMinB) + outputMinB;

  return static_cast<int32_t>(hostPlatformColorFromRGBA(
      static_cast<uint8_t>(outputValueR),
      static_cast<uint8_t>(outputValueG),
      static_cast<uint8_t>(outputValueB),
      static_cast<uint8_t>(outputValueA)));
}

double InterpolationAnimatedNode::interpolatePlatformColor(double value) {
  if (connectedRootTag_ == animated::undefinedAnimatedNodeIdentifier) {
    connectedRootTag_ = resolveConnectedRootTag();
  }

  // Compute range index
  size_t index = 1;
  for (; index < inputRanges_.size() - 1; ++index) {
    if (inputRanges_[index] >= value) {
      break;
    }
  }
  index--;
  SharedColor outputMinSharedColor;
  SharedColor outputMaxSharedColor;
  if (manager_ != nullptr) {
    manager_->resolvePlatformColor(
        connectedRootTag_,
        RawValue(platformColorOutputRanges_[index]),
        outputMinSharedColor);
    manager_->resolvePlatformColor(
        connectedRootTag_,
        RawValue(platformColorOutputRanges_[index + 1]),
        outputMaxSharedColor);
  }
  auto outputMin = *outputMinSharedColor;
  auto outputMax = *outputMaxSharedColor;

  if (outputMin == outputMax) {
    return outputMin;
  }

  const auto inputMin = inputRanges_[index];
  const auto inputMax = inputRanges_[index + 1];
  if (inputMin == inputMax) {
    if (value <= inputMin) {
      return static_cast<int32_t>(outputMin);
    } else {
      return static_cast<int32_t>(outputMax);
    }
  }

  auto ratio = easeRatio((value - inputMin) / (inputMax - inputMin));

  auto outputMinA = alphaFromHostPlatformColor(outputMin);
  auto outputMinR = redFromHostPlatformColor(outputMin);
  auto outputMinG = greenFromHostPlatformColor(outputMin);
  auto outputMinB = blueFromHostPlatformColor(outputMin);

  auto outputMaxA = alphaFromHostPlatformColor(outputMax);
  auto outputMaxR = redFromHostPlatformColor(outputMax);
  auto outputMaxG = greenFromHostPlatformColor(outputMax);
  auto outputMaxB = blueFromHostPlatformColor(outputMax);

  auto outputValueA = ratio * (outputMaxA - outputMinA) + outputMinA;
  auto outputValueR = ratio * (outputMaxR - outputMinR) + outputMinR;
  auto outputValueG = ratio * (outputMaxG - outputMinG) + outputMinG;
  auto outputValueB = ratio * (outputMaxB - outputMinB) + outputMinB;

  return static_cast<int32_t>(hostPlatformColorFromRGBA(
      static_cast<uint8_t>(outputValueR),
      static_cast<uint8_t>(outputValueG),
      static_cast<uint8_t>(outputValueB),
      static_cast<uint8_t>(outputValueA)));
}

SurfaceId InterpolationAnimatedNode::resolveConnectedRootTag() const {
  // find nearest connected props node
  std::deque<Tag> nodesQueue{tag()};
  while (!nodesQueue.empty()) {
    auto nodeTag = nodesQueue.front();
    nodesQueue.pop_front();
    if (auto node = manager_->getAnimatedNode<AnimatedNode>(nodeTag)) {
      if (node->type() == AnimatedNodeType::Props) {
        if (auto propsNode = static_cast<PropsAnimatedNode*>(node)) {
          return propsNode->connectedRootTag();
        }
        break;
      }
      auto children = node->getChildren();
      nodesQueue.insert(nodesQueue.end(), children.begin(), children.end());
    }
  }

  LOG(ERROR)
      << "InterpolationAnimatedNode: Unable to resolve connected root tag";
  return animated::undefinedAnimatedNodeIdentifier;
}

} // namespace facebook::react
