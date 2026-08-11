/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/ColorComponents.h>
#include <cmath>
#include <cstdint>

namespace facebook::react {

using Color = int32_t;

namespace HostPlatformColor {
constexpr facebook::react::Color UndefinedColor = 0;
}

inline Color
hostPlatformColorFromRGBA(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
  return (a & 0xff) << 24 | (r & 0xff) << 16 | (g & 0xff) << 8 | (b & 0xff);
}

inline Color hostPlatformColorFromComponents(ColorComponents components) {
  float ratio = 255;
  return hostPlatformColorFromRGBA(
      static_cast<uint8_t>(std::round(components.red * ratio)),
      static_cast<uint8_t>(std::round(components.green * ratio)),
      static_cast<uint8_t>(std::round(components.blue * ratio)),
      static_cast<uint8_t>(std::round(components.alpha * ratio)));
}

inline float alphaFromHostPlatformColor(Color color) {
  return static_cast<float>((color >> 24) & 0xff);
}

inline float redFromHostPlatformColor(Color color) {
  return static_cast<float>((color >> 16) & 0xff);
}

inline float greenFromHostPlatformColor(Color color) {
  return static_cast<float>((color >> 8) & 0xff);
}

inline float blueFromHostPlatformColor(Color color) {
  return static_cast<uint8_t>((color >> 0) & 0xff);
}

inline bool hostPlatformColorIsColorMeaningful(Color color) noexcept {
  return alphaFromHostPlatformColor(color) > 0;
}

inline ColorComponents colorComponentsFromHostPlatformColor(Color color) {
  float ratio = 255;
  return ColorComponents{
      .red = static_cast<float>(redFromHostPlatformColor(color)) / ratio,
      .green = static_cast<float>(greenFromHostPlatformColor(color)) / ratio,
      .blue = static_cast<float>(blueFromHostPlatformColor(color)) / ratio,
      .alpha = static_cast<float>(alphaFromHostPlatformColor(color)) / ratio};
}

} // namespace facebook::react
