/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/enums/Unit.h>
#include <yoga/numeric/FloatOptional.h>

namespace facebook::yoga {

/**
 * This class represents a CSS Value for sizes (e.g. width, height, min-width,
 * etc.). It may be one of:
 * 1. Undefined
 * 2. A keyword (e.g. auto, max-content, stretch, etc.)
 * 3. A CSS <length-percentage> value:
 *    a. <length> value (e.g. 10px)
 *    b. <percentage> value of a reference <length>
 *
 * References:
 * 1. https://www.w3.org/TR/css-values-4/#lengths
 * 2. https://www.w3.org/TR/css-values-4/#percentage-value
 * 3. https://www.w3.org/TR/css-values-4/#mixed-percentages
 */
class StyleSizeLength {
 public:
  constexpr StyleSizeLength() = default;

  constexpr static StyleSizeLength points(float value) {
    return yoga::isUndefined(value) || yoga::isinf(value)
        ? undefined()
        : StyleSizeLength{FloatOptional{value}, Unit::Point};
  }

  constexpr static StyleSizeLength percent(float value) {
    return yoga::isUndefined(value) || yoga::isinf(value)
        ? undefined()
        : StyleSizeLength{FloatOptional{value}, Unit::Percent};
  }

  constexpr static StyleSizeLength stretch(float fraction) {
    return yoga::isUndefined(fraction) || yoga::isinf(fraction)
        ? undefined()
        : StyleSizeLength{FloatOptional{fraction}, Unit::Stretch};
  }

  constexpr static StyleSizeLength ofAuto() {
    return StyleSizeLength{{}, Unit::Auto};
  }

  constexpr static StyleSizeLength ofMaxContent() {
    return StyleSizeLength{{}, Unit::MaxContent};
  }

  constexpr static StyleSizeLength ofFitContent() {
    return StyleSizeLength{{}, Unit::FitContent};
  }

  constexpr static StyleSizeLength ofStretch() {
    return StyleSizeLength{{}, Unit::Stretch};
  }

  constexpr static StyleSizeLength undefined() {
    return StyleSizeLength{{}, Unit::Undefined};
  }

  constexpr bool isAuto() const {
    return unit_ == Unit::Auto;
  }

  constexpr bool isMaxContent() const {
    return unit_ == Unit::MaxContent;
  }

  constexpr bool isFitContent() const {
    return unit_ == Unit::FitContent;
  }

  constexpr bool isStretch() const {
    return unit_ == Unit::Stretch;
  }

  constexpr bool isUndefined() const {
    return unit_ == Unit::Undefined;
  }

  constexpr bool isDefined() const {
    return !isUndefined();
  }

  constexpr bool isPoints() const {
    return unit_ == Unit::Point;
  }

  constexpr bool isPercent() const {
    return unit_ == Unit::Percent;
  }

  constexpr FloatOptional value() const {
    return value_;
  }

  constexpr FloatOptional resolve(float referenceLength) const {
#ifdef __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wswitch-enum"
#endif
    switch (unit_) {
#ifdef __clang__
#pragma clang diagnostic pop
#endif
      case Unit::Point:
        return value_;
      case Unit::Percent:
        return FloatOptional{value_.unwrap() * referenceLength * 0.01f};
      default:
        return FloatOptional{};
    }
  }

  explicit constexpr operator YGValue() const {
    return YGValue{value_.unwrap(), unscopedEnum(unit_)};
  }

  constexpr bool operator==(const StyleSizeLength& rhs) const {
    return value_ == rhs.value_ && unit_ == rhs.unit_;
  }

  constexpr bool inexactEquals(const StyleSizeLength& other) const {
    return unit_ == other.unit_ &&
        facebook::yoga::inexactEquals(value_, other.value_);
  }

 private:
  // We intentionally do not allow direct construction using value and unit, to
  // avoid invalid, or redundant combinations.
  constexpr StyleSizeLength(FloatOptional value, Unit unit)
      : value_(value), unit_(unit) {}

  FloatOptional value_{};
  Unit unit_{Unit::Undefined};
};

inline bool inexactEquals(const StyleSizeLength& a, const StyleSizeLength& b) {
  return a.inexactEquals(b);
}

} // namespace facebook::yoga
