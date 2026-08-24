/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/ColorComponents.h>
#include <react/renderer/graphics/HostPlatformColor.h>

#include <functional>
#include <string>

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#endif

namespace facebook::react {

/*
 * On Android, a color can be represented as 32 bits integer, so there is no
 * need to instantiate complex color objects and then pass them as shared
 * pointers. Hense instead of using shared_ptr, we use a simple wrapper class
 * which provides a pointer-like interface. On other platforms, colors may be
 * represented by more complex objects that cannot be represented as 32-bits
 * integers, so we hide the implementation detail in HostPlatformColor.h.
 */
class SharedColor {
 public:
  SharedColor() : color_(HostPlatformColor::UndefinedColor), isDefined_(false) {}

  SharedColor(Color color) : color_(color), isDefined_(true) {}

  Color &operator*()
  {
    return color_;
  }

  const Color &operator*() const
  {
    return color_;
  }

  bool operator==(const SharedColor &otherColor) const
  {
    return color_ == otherColor.color_ && isDefined_ == otherColor.isDefined_;
  }

  bool operator!=(const SharedColor &otherColor) const
  {
    return !(*this == otherColor);
  }

  operator bool() const
  {
    return isDefined_;
  }

  std::string toString() const noexcept;

 private:
  Color color_;
  // Android represents both transparent black and UndefinedColor as ARGB 0.
  // Track presence separately so prop reconciliation can distinguish them.
  bool isDefined_;
};

bool isColorMeaningful(const SharedColor &color) noexcept;
SharedColor colorFromComponents(ColorComponents components);
ColorComponents colorComponentsFromColor(SharedColor color);

uint8_t alphaFromColor(SharedColor color) noexcept;
uint8_t redFromColor(SharedColor color) noexcept;
uint8_t greenFromColor(SharedColor color) noexcept;
uint8_t blueFromColor(SharedColor color) noexcept;
SharedColor colorFromRGBA(uint8_t r, uint8_t g, uint8_t b, uint8_t a);

SharedColor clearColor();
SharedColor blackColor();
SharedColor whiteColor();

#ifdef RN_SERIALIZABLE_STATE
inline folly::dynamic toDynamic(const SharedColor &sharedColor)
{
  return *sharedColor;
}
#endif

} // namespace facebook::react

template <>
struct std::hash<facebook::react::SharedColor> {
  size_t operator()(const facebook::react::SharedColor &color) const
  {
    auto seed = std::hash<facebook::react::Color>{}(*color);
    return seed ^ (std::hash<bool>{}(static_cast<bool>(color)) + 0x9e3779b9 + (seed << 6) + (seed >> 2));
  }
};
