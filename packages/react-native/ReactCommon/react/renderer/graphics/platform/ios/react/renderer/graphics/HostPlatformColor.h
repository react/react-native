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

namespace facebook::react {

struct DynamicColor {
  int32_t lightColor = 0;
  int32_t darkColor = 0;
  int32_t highContrastLightColor = 0;
  int32_t highContrastDarkColor = 0;
};

struct Color {
  Color(int32_t color);
  Color(const DynamicColor &dynamicColor);
  Color(const ColorComponents &components);
  Color() : uiColor_(nullptr) {};
  int32_t getColor() const;
  std::size_t getUIColorHash() const;

  // Returns the UndefinedColor sentinel (null underlying UIColor) on a miss, so
  // callers can tell a miss from a name that resolves to transparent. Callers
  // reaching into getUIColor() must null-check it.
  static Color createSemanticColor(std::vector<std::string> &semanticItems);

  std::shared_ptr<void> getUIColor() const
  {
    return uiColor_;
  }

  float getChannel(int channelId) const;

  ColorComponents getColorComponents() const
  {
    float ratio = 255;
    int32_t primitiveColor = getColor();
    return ColorComponents{
        .red = (float)((primitiveColor >> 16) & 0xff) / ratio,
        .green = (float)((primitiveColor >> 8) & 0xff) / ratio,
        .blue = (float)((primitiveColor >> 0) & 0xff) / ratio,
        .alpha = (float)((primitiveColor >> 24) & 0xff) / ratio};
  }
  bool operator==(const Color &other) const;
  bool operator!=(const Color &other) const;
  operator int32_t() const
  {
    return getColor();
  }

 private:
  Color(std::shared_ptr<void> uiColor);
  std::shared_ptr<void> uiColor_;
  std::size_t uiColorHashValue_;
};

namespace HostPlatformColor {

#if defined(__clang__)
#define NO_DESTROY [[clang::no_destroy]]
#else
#define NO_DESTROY
#endif

NO_DESTROY static const facebook::react::Color UndefinedColor = Color();
} // namespace HostPlatformColor

inline Color hostPlatformColorFromRGBA(uint8_t r, uint8_t g, uint8_t b, uint8_t a)
{
  float ratio = 255;
  const auto colorComponents = ColorComponents{
      .red = r / ratio,
      .green = g / ratio,
      .blue = b / ratio,
      .alpha = a / ratio,
  };
  return Color(colorComponents);
}

inline Color hostPlatformColorFromComponents(ColorComponents components)
{
  return Color(components);
}

inline ColorComponents colorComponentsFromHostPlatformColor(Color color)
{
  return color.getColorComponents();
}

inline float alphaFromHostPlatformColor(Color color)
{
  return color.getChannel(3) * 255;
}

inline float redFromHostPlatformColor(Color color)
{
  return color.getChannel(0) * 255;
}

inline float greenFromHostPlatformColor(Color color)
{
  return color.getChannel(1) * 255;
}

inline float blueFromHostPlatformColor(Color color)
{
  return color.getChannel(2) * 255;
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
    return color.getUIColorHash();
  }
};
