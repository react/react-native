/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>

#include <yoga/Yoga.h>

#include <yoga/numeric/FloatOptional.h>
#include <yoga/style/SmallValueBuffer.h>
#include <yoga/style/StyleLength.h>

namespace facebook::yoga {

#pragma pack(push)
#pragma pack(1)

/**
 * StyleValueHandle is a small (16-bit) handle to a length or number in a style.
 * The value may be embedded directly in the handle if simple, or the handle may
 * instead point to an index within a StyleValuePool.
 *
 * To read or write a value from a StyleValueHandle, use
 * `StyleValuePool::store()`, and `StyleValuePool::getLength()`/
 * `StyleValuePool::getNumber()`.
 */
class StyleValueHandle {
 public:
  static constexpr StyleValueHandle ofAuto() {
    StyleValueHandle handle;
    handle.setType(Type::Auto);
    return handle;
  }

  constexpr bool isUndefined() const {
    return type() == Type::Undefined;
  }

  constexpr bool isDefined() const {
    return !isUndefined();
  }

  constexpr bool isAuto() const {
    return type() == Type::Auto;
  }

  constexpr bool isPercent() const {
    return type() == Type::Percent;
  }

  constexpr bool isPoint() const {
    return type() == Type::Point;
  }

 private:
  friend class StyleValuePool;

  static constexpr uint16_t kHandleTypeMask = 0b0000'0000'0000'0111;
  static constexpr uint16_t kHandleIndexedMask = 0b0000'0000'0000'1000;
  static constexpr uint16_t kHandleValueMask = 0b1111'1111'1111'0000;

  enum class Type : uint8_t {
    Undefined,
    Point,
    Percent,
    Number,
    Auto,
    Keyword
  };

  // Intentionally leaving out auto as a fast path
  enum class Keyword : uint8_t { MaxContent, FitContent, Stretch };

  constexpr bool isKeyword(Keyword keyword) const {
    return type() == Type::Keyword && value() == static_cast<uint16_t>(keyword);
  }

  constexpr Type type() const {
    return static_cast<Type>(repr_ & kHandleTypeMask);
  }

  constexpr void setType(Type handleType) {
    repr_ &= (~kHandleTypeMask);
    repr_ |= static_cast<uint8_t>(handleType);
  }

  constexpr uint16_t value() const {
    return repr_ >> 4;
  }

  constexpr void setValue(uint16_t value) {
    repr_ &= (~kHandleValueMask);
    repr_ |= (value << 4);
  }

  constexpr bool isValueIndexed() const {
    return (repr_ & kHandleIndexedMask) != 0;
  }

  constexpr void setValueIsIndexed() {
    repr_ |= kHandleIndexedMask;
  }

  uint16_t repr_{0};
};

#pragma pack(pop)

} // namespace facebook::yoga
