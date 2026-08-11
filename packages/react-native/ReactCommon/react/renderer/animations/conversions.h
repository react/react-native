/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/renderer/animations/primitives.h>

#include <optional>

namespace facebook::react {

static inline std::optional<AnimationType> parseAnimationType(
    std::string param) {
  if (param == "spring") {
    return AnimationType::Spring;
  }
  if (param == "linear") {
    return AnimationType::Linear;
  }
  if (param == "easeInEaseOut") {
    return AnimationType::EaseInEaseOut;
  }
  if (param == "easeIn") {
    return AnimationType::EaseIn;
  }
  if (param == "easeOut") {
    return AnimationType::EaseOut;
  }
  if (param == "keyboard") {
    return AnimationType::Keyboard;
  }

  LOG(ERROR) << "Error parsing animation type: " << param;
  return {};
}

static inline std::optional<AnimationProperty> parseAnimationProperty(
    std::string param) {
  if (param == "opacity") {
    return AnimationProperty::Opacity;
  }
  if (param == "scaleX") {
    return AnimationProperty::ScaleX;
  }
  if (param == "scaleY") {
    return AnimationProperty::ScaleY;
  }
  if (param == "scaleXY") {
    return AnimationProperty::ScaleXY;
  }

  LOG(ERROR) << "Error parsing animation property: " << param;
  return {};
}

static inline std::optional<AnimationConfig> parseAnimationConfig(
    const folly::dynamic& config,
    double defaultDuration,
    bool parsePropertyType) {
  if (config.empty() || !config.isObject()) {
    return AnimationConfig{
        .animationType = AnimationType::Linear,
        .animationProperty = AnimationProperty::NotApplicable,
        .duration = defaultDuration,
        .delay = 0,
        .springDamping = 0,
        .initialVelocity = 0};
  }

  const auto typeIt = config.find("type");
  if (typeIt == config.items().end()) {
    LOG(ERROR) << "Error parsing animation config: could not find field `type`";
    return {};
  }
  const auto animationTypeParam = typeIt->second;
  if (animationTypeParam.empty() || !animationTypeParam.isString()) {
    LOG(ERROR)
        << "Error parsing animation config: could not unwrap field `type`";
    return {};
  }
  const auto animationType = parseAnimationType(animationTypeParam.asString());
  if (!animationType) {
    LOG(ERROR)
        << "Error parsing animation config: could not parse field `type`";
    return {};
  }

  AnimationProperty animationProperty = AnimationProperty::NotApplicable;
  if (parsePropertyType) {
    const auto propertyIt = config.find("property");
    if (propertyIt == config.items().end()) {
      LOG(ERROR)
          << "Error parsing animation config: could not find field `property`";
      return {};
    }
    const auto animationPropertyParam = propertyIt->second;
    if (animationPropertyParam.empty() || !animationPropertyParam.isString()) {
      LOG(ERROR)
          << "Error parsing animation config: could not unwrap field `property`";
      return {};
    }
    const auto animationPropertyParsed =
        parseAnimationProperty(animationPropertyParam.asString());
    if (!animationPropertyParsed) {
      LOG(ERROR)
          << "Error parsing animation config: could not parse field `property`";
      return {};
    }
    animationProperty = *animationPropertyParsed;
  }

  double duration = defaultDuration;
  double delay = 0;
  Float springDamping = 0.5;
  Float initialVelocity = 0;

  const auto durationIt = config.find("duration");
  if (durationIt != config.items().end()) {
    if (durationIt->second.isDouble()) {
      duration = durationIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `duration` must be a number";
      return {};
    }
  }

  const auto delayIt = config.find("delay");
  if (delayIt != config.items().end()) {
    if (delayIt->second.isDouble()) {
      delay = delayIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `delay` must be a number";
      return {};
    }
  }

  const auto springDampingIt = config.find("springDamping");
  if (springDampingIt != config.items().end() &&
      springDampingIt->second.isDouble()) {
    if (springDampingIt->second.isDouble()) {
      springDamping = (Float)springDampingIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `springDamping` must be a number";
      return {};
    }
  }

  const auto initialVelocityIt = config.find("initialVelocity");
  if (initialVelocityIt != config.items().end()) {
    if (initialVelocityIt->second.isDouble()) {
      initialVelocity = (Float)initialVelocityIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `initialVelocity` must be a number";
      return {};
    }
  }

  return std::optional<AnimationConfig>(AnimationConfig{
      .animationType = *animationType,
      .animationProperty = animationProperty,
      .duration = duration,
      .delay = delay,
      .springDamping = springDamping,
      .initialVelocity = initialVelocity});
}

// Parse animation config from JS
static inline std::optional<LayoutAnimationConfig> parseLayoutAnimationConfig(
    const folly::dynamic& config) {
  if (config.empty() || !config.isObject()) {
    return {};
  }

  const auto durationIt = config.find("duration");
  if (durationIt == config.items().end() || !durationIt->second.isDouble()) {
    return {};
  }
  const double duration = durationIt->second.asDouble();

  const auto createConfigIt = config.find("create");
  const auto createConfig = createConfigIt == config.items().end()
      ? std::optional<AnimationConfig>(AnimationConfig{})
      : parseAnimationConfig(createConfigIt->second, duration, true);

  const auto updateConfigIt = config.find("update");
  const auto updateConfig = updateConfigIt == config.items().end()
      ? std::optional<AnimationConfig>(AnimationConfig{})
      : parseAnimationConfig(updateConfigIt->second, duration, false);

  const auto deleteConfigIt = config.find("delete");
  const auto deleteConfig = deleteConfigIt == config.items().end()
      ? std::optional<AnimationConfig>(AnimationConfig{})
      : parseAnimationConfig(deleteConfigIt->second, duration, true);

  if (!createConfig || !updateConfig || !deleteConfig) {
    return {};
  }

  return LayoutAnimationConfig{
      .duration = duration,
      .createConfig = *createConfig,
      .updateConfig = *updateConfig,
      .deleteConfig = *deleteConfig};
}

} // namespace facebook::react
