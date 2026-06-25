/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string_view>

namespace facebook::react {

enum class BlendMode {
  Normal,
  Multiply,
  Screen,
  Overlay,
  Darken,
  Lighten,
  ColorDodge,
  ColorBurn,
  HardLight,
  SoftLight,
  Difference,
  Exclusion,
  Hue,
  Saturation,
  Color,
  Luminosity,
  PlusLighter,
};

inline std::optional<BlendMode> blendModeFromString(std::string_view blendModeName)
{
  if (blendModeName == "normal") {
    return BlendMode::Normal;
  } else if (blendModeName == "multiply") {
    return BlendMode::Multiply;
  } else if (blendModeName == "screen") {
    return BlendMode::Screen;
  } else if (blendModeName == "overlay") {
    return BlendMode::Overlay;
  } else if (blendModeName == "darken") {
    return BlendMode::Darken;
  } else if (blendModeName == "lighten") {
    return BlendMode::Lighten;
  } else if (blendModeName == "color-dodge") {
    return BlendMode::ColorDodge;
  } else if (blendModeName == "color-burn") {
    return BlendMode::ColorBurn;
  } else if (blendModeName == "hard-light") {
    return BlendMode::HardLight;
  } else if (blendModeName == "soft-light") {
    return BlendMode::SoftLight;
  } else if (blendModeName == "difference") {
    return BlendMode::Difference;
  } else if (blendModeName == "exclusion") {
    return BlendMode::Exclusion;
  } else if (blendModeName == "hue") {
    return BlendMode::Hue;
  } else if (blendModeName == "saturation") {
    return BlendMode::Saturation;
  } else if (blendModeName == "color") {
    return BlendMode::Color;
  } else if (blendModeName == "luminosity") {
    return BlendMode::Luminosity;
  } else if (blendModeName == "plus-lighter") {
    return BlendMode::PlusLighter;
  } else {
    return std::nullopt;
  }
}

inline std::string toString(const BlendMode &blendMode)
{
  switch (blendMode) {
    case BlendMode::Normal:
      return "normal";
    case BlendMode::Multiply:
      return "multiply";
    case BlendMode::Screen:
      return "screen";
    case BlendMode::Overlay:
      return "overlay";
    case BlendMode::Darken:
      return "darken";
    case BlendMode::Lighten:
      return "lighten";
    case BlendMode::ColorDodge:
      return "color-dodge";
    case BlendMode::ColorBurn:
      return "color-burn";
    case BlendMode::HardLight:
      return "hard-light";
    case BlendMode::SoftLight:
      return "soft-light";
    case BlendMode::Difference:
      return "difference";
    case BlendMode::Exclusion:
      return "exclusion";
    case BlendMode::Hue:
      return "hue";
    case BlendMode::Saturation:
      return "saturation";
    case BlendMode::Color:
      return "color";
    case BlendMode::Luminosity:
      return "luminosity";
    case BlendMode::PlusLighter:
      return "plus-lighter";
    default:
      abort();
  }
}
} // namespace facebook::react
