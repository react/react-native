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

  static StyleSizeLength dynamic(YGValueDynamic callback, YGValueDynamicID id) {
    return StyleSizeLength{callback, id};
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

  constexpr bool isDynamic() const {
    return unit_ == Unit::Dynamic;
  }

  constexpr FloatOptional value() const {
    if (isDynamic()) {
      return FloatOptional{};
    }
    return payload_.value;
  }

  YGValueDynamic callback() const {
    return isDynamic() ? payload_.dynamic.callback : nullptr;
  }

  constexpr YGValueDynamicID callbackId() const {
    return isDynamic() ? payload_.dynamic.id : 0;
  }

  constexpr FloatOptional resolve(float referenceLength, YGNodeConstRef node)
      const {
#ifdef __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wswitch-enum"
#endif
    switch (unit_) {
#ifdef __clang__
#pragma clang diagnostic pop
#endif
      case Unit::Point:
        return payload_.value;
      case Unit::Percent:
        return FloatOptional{payload_.value.unwrap() * referenceLength * 0.01f};
      case Unit::Dynamic:
        if (payload_.dynamic.callback != nullptr && node != nullptr) {
          auto value = payload_.dynamic.callback(
              node,
              payload_.dynamic.id,
              YGValueDynamicContext{referenceLength});
          return FloatOptional{value.value};
        }
        return FloatOptional{};
      default:
        return FloatOptional{};
    }
  }

  explicit constexpr operator YGValue() const {
    return YGValue{value().unwrap(), unscopedEnum(unit_)};
  }

  constexpr bool operator==(const StyleSizeLength& rhs) const {
    if (unit_ != rhs.unit_) {
      return false;
    }
    if (isDynamic()) {
      return payload_.dynamic.callback == rhs.payload_.dynamic.callback &&
          payload_.dynamic.id == rhs.payload_.dynamic.id;
    }
    return payload_.value == rhs.payload_.value;
  }

  constexpr bool inexactEquals(const StyleSizeLength& other) const {
    if (unit_ != other.unit_) {
      return false;
    }
    if (isDynamic()) {
      return payload_.dynamic.callback == other.payload_.dynamic.callback &&
          payload_.dynamic.id == other.payload_.dynamic.id;
    }
    return facebook::yoga::inexactEquals(payload_.value, other.payload_.value);
  }

 private:
  struct YGValueDynamicData {
    YGValueDynamic callback;
    YGValueDynamicID id;
  };

  union Payload {
    constexpr Payload() : value{} {}
    constexpr explicit Payload(FloatOptional val) : value(val) {}
    constexpr Payload(YGValueDynamic callback, YGValueDynamicID id)
        : dynamic{callback, id} {}

    FloatOptional value;
    YGValueDynamicData dynamic;
  };

  // We intentionally do not allow direct construction using value and unit, to
  // avoid invalid, or redundant combinations.
  constexpr StyleSizeLength(FloatOptional value, Unit unit)
      : payload_(value), unit_(unit) {}
  constexpr StyleSizeLength(YGValueDynamic callback, YGValueDynamicID id)
      : payload_(callback, id), unit_(Unit::Dynamic) {}

  Payload payload_{};
  Unit unit_{Unit::Undefined};
};

inline bool inexactEquals(const StyleSizeLength& a, const StyleSizeLength& b) {
  return a.inexactEquals(b);
}

} // namespace facebook::yoga
