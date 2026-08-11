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
  SharedColor() : color_(HostPlatformColor::UndefinedColor) {}

  SharedColor(Color color) : color_(color) {}

  Color& operator*() {
    return color_;
  }

  const Color& operator*() const {
    return color_;
  }

  bool operator==(const SharedColor& otherColor) const {
    return color_ == otherColor.color_;
  }

  bool operator!=(const SharedColor& otherColor) const {
    return color_ != otherColor.color_;
  }

  operator bool() const {
    return color_ != HostPlatformColor::UndefinedColor;
  }

  std::string toString() const noexcept;

 private:
  Color color_;
};

bool isColorMeaningful(const SharedColor& color) noexcept;
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
inline folly::dynamic toDynamic(const SharedColor& sharedColor) {
  return *sharedColor;
}
#endif

} // namespace facebook::react

template <>
struct std::hash<facebook::react::SharedColor> {
  size_t operator()(const facebook::react::SharedColor& color) const {
    return std::hash<facebook::react::Color>{}(*color);
  }
};
