/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/ColorComponents.h>
#include <react/utils/hash_combine.h>
#include <cmath>
#include <cstdint>

namespace facebook::react {

struct Color {
  int32_t value{0};
  bool isDefined{false};

  constexpr Color() = default;
  constexpr Color(int32_t colorValue) : value(colorValue), isDefined(true) {}

  constexpr bool operator==(const Color &otherColor) const
  {
    return value == otherColor.value && isDefined == otherColor.isDefined;
  }

  constexpr bool operator!=(const Color &otherColor) const
  {
    return !(*this == otherColor);
  }

  constexpr operator int32_t() const
  {
    return value;
  }
};

namespace HostPlatformColor {
constexpr facebook::react::Color UndefinedColor{};
}

inline Color hostPlatformColorFromRGBA(uint8_t r, uint8_t g, uint8_t b, uint8_t a)
{
  return Color{(a & 0xff) << 24 | (r & 0xff) << 16 | (g & 0xff) << 8 | (b & 0xff)};
}

inline Color hostPlatformColorFromComponents(ColorComponents components)
{
  float ratio = 255;
  return Color{
      ((int)round(components.alpha * ratio) & 0xff) << 24 | ((int)round(components.red * ratio) & 0xff) << 16 |
      ((int)round(components.green * ratio) & 0xff) << 8 | ((int)round(components.blue * ratio) & 0xff)};
}

inline ColorComponents colorComponentsFromHostPlatformColor(Color color)
{
  float ratio = 255;
  return ColorComponents{
      .red = (float)((color.value >> 16) & 0xff) / ratio,
      .green = (float)((color.value >> 8) & 0xff) / ratio,
      .blue = (float)((color.value >> 0) & 0xff) / ratio,
      .alpha = (float)((color.value >> 24) & 0xff) / ratio};
}

inline float alphaFromHostPlatformColor(Color color)
{
  return static_cast<float>((color.value >> 24) & 0xff);
}

inline float redFromHostPlatformColor(Color color)
{
  return static_cast<float>((color.value >> 16) & 0xff);
}

inline float greenFromHostPlatformColor(Color color)
{
  return static_cast<float>((color.value >> 8) & 0xff);
}

inline float blueFromHostPlatformColor(Color color)
{
  return static_cast<uint8_t>((color.value >> 0) & 0xff);
}

inline bool hostPlatformColorIsColorMeaningful(Color color) noexcept
{
  return alphaFromHostPlatformColor(color) > 0;
}

} // namespace facebook::react

template <>
struct std::hash<facebook::react::Color> {
  size_t operator()(const facebook::react::Color &color) const
  {
    return facebook::react::hash_combine(color.value, color.isDefined);
  }
};
