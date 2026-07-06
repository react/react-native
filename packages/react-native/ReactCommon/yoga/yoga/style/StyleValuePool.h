/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cassert>
#include <cstdint>

#include <yoga/numeric/FloatOptional.h>
#include <yoga/style/SmallValueBuffer.h>
#include <yoga/style/StyleLength.h>
#include <yoga/style/StyleSizeLength.h>
#include <yoga/style/StyleValueHandle.h>

namespace facebook::yoga {

/**
 * StyleValuePool allows compact storage for a sparse collection of assigned
 * lengths and numbers. Values are referred to using StyleValueHandle. In most
 * cases StyleValueHandle can embed the value directly, but if not, the value is
 * stored within a buffer provided by the pool. The pool contains a fixed number
 * of inline slots before falling back to heap allocating additional slots.
 */
class StyleValuePool {
 public:
  void store(StyleValueHandle& handle, StyleLength length) {
    if (length.isUndefined()) {
      handle.setType(StyleValueHandle::Type::Undefined);
    } else if (length.isAuto()) {
      handle.setType(StyleValueHandle::Type::Auto);
    } else if (length.isDynamic()) {
      storeDynamic(handle, length.callback(), length.callbackId());
    } else {
      auto type = length.isPoints() ? StyleValueHandle::Type::Point
                                    : StyleValueHandle::Type::Percent;
      storeValue(handle, length.value().unwrap(), type);
    }
  }

  void store(StyleValueHandle& handle, StyleSizeLength sizeValue) {
    if (sizeValue.isUndefined()) {
      handle.setType(StyleValueHandle::Type::Undefined);
    } else if (sizeValue.isAuto()) {
      handle.setType(StyleValueHandle::Type::Auto);
    } else if (sizeValue.isMaxContent()) {
      storeKeyword(handle, StyleValueHandle::Keyword::MaxContent);
    } else if (sizeValue.isStretch()) {
      storeKeyword(handle, StyleValueHandle::Keyword::Stretch);
    } else if (sizeValue.isFitContent()) {
      storeKeyword(handle, StyleValueHandle::Keyword::FitContent);
    } else if (sizeValue.isDynamic()) {
      storeDynamic(handle, sizeValue.callback(), sizeValue.callbackId());
    } else {
      auto type = sizeValue.isPoints() ? StyleValueHandle::Type::Point
                                       : StyleValueHandle::Type::Percent;
      storeValue(handle, sizeValue.value().unwrap(), type);
    }
  }

  void store(StyleValueHandle& handle, FloatOptional number) {
    if (number.isUndefined()) {
      handle.setType(StyleValueHandle::Type::Undefined);
    } else {
      storeValue(handle, number.unwrap(), StyleValueHandle::Type::Number);
    }
  }

  StyleLength getLength(StyleValueHandle handle) const {
    if (handle.isUndefined()) {
      return StyleLength::undefined();
    } else if (handle.isAuto()) {
      return StyleLength::ofAuto();
    } else if (handle.isDynamic()) {
      return StyleLength::dynamic(
          getDynamicCallback(handle), getDynamicCallbackID(handle));
    } else {
      assert(
          handle.type() == StyleValueHandle::Type::Point ||
          handle.type() == StyleValueHandle::Type::Percent);
      float value = (handle.isValueIndexed())
          ? std::bit_cast<float>(buffer_.get32(handle.value()))
          : unpackInlineInteger(handle.value());

      return handle.type() == StyleValueHandle::Type::Point
          ? StyleLength::points(value)
          : StyleLength::percent(value);
    }
  }

  StyleSizeLength getSize(StyleValueHandle handle) const {
    if (handle.isUndefined()) {
      return StyleSizeLength::undefined();
    } else if (handle.isAuto()) {
      return StyleSizeLength::ofAuto();
    } else if (handle.isKeyword(StyleValueHandle::Keyword::MaxContent)) {
      return StyleSizeLength::ofMaxContent();
    } else if (handle.isKeyword(StyleValueHandle::Keyword::FitContent)) {
      return StyleSizeLength::ofFitContent();
    } else if (handle.isKeyword(StyleValueHandle::Keyword::Stretch)) {
      return StyleSizeLength::ofStretch();
    } else if (handle.isDynamic()) {
      return StyleSizeLength::dynamic(
          getDynamicCallback(handle), getDynamicCallbackID(handle));
    } else {
      assert(
          handle.type() == StyleValueHandle::Type::Point ||
          handle.type() == StyleValueHandle::Type::Percent);
      float value = (handle.isValueIndexed())
          ? std::bit_cast<float>(buffer_.get32(handle.value()))
          : unpackInlineInteger(handle.value());

      return handle.type() == StyleValueHandle::Type::Point
          ? StyleSizeLength::points(value)
          : StyleSizeLength::percent(value);
    }
  }

  FloatOptional getNumber(StyleValueHandle handle) const {
    if (handle.isUndefined()) {
      return FloatOptional{};
    } else {
      assert(handle.type() == StyleValueHandle::Type::Number);
      float value = (handle.isValueIndexed())
          ? std::bit_cast<float>(buffer_.get32(handle.value()))
          : unpackInlineInteger(handle.value());
      return FloatOptional{value};
    }
  }

  float getStoredValue(StyleValueHandle handle) const {
    assert(
        handle.type() == StyleValueHandle::Type::Point ||
        handle.type() == StyleValueHandle::Type::Percent ||
        handle.type() == StyleValueHandle::Type::Number);
    return handle.isValueIndexed()
        ? std::bit_cast<float>(buffer_.get32(handle.value()))
        : unpackInlineInteger(handle.value());
  }

  YGValueDynamic getDynamicCallback(StyleValueHandle handle) const {
    assert(handle.isDynamic());
    assert(handle.isValueIndexed());
    return reinterpret_cast<YGValueDynamic>(
        static_cast<uintptr_t>(buffer_.get64(handle.value())));
  }

  YGValueDynamicID getDynamicCallbackID(StyleValueHandle handle) const {
    assert(handle.isDynamic());
    assert(handle.isValueIndexed());
    return buffer_.get32(handle.value() + 2);
  }

 private:
  void storeValue(
      StyleValueHandle& handle,
      float value,
      StyleValueHandle::Type type) {
    handle.setType(type);

    if (handle.isValueIndexed()) {
      auto newIndex =
          buffer_.replace(handle.value(), std::bit_cast<uint32_t>(value));
      handle.setValue(newIndex);
    } else if (isIntegerPackable(value)) {
      handle.setValue(packInlineInteger(value));
    } else {
      auto newIndex = buffer_.push(std::bit_cast<uint32_t>(value));
      handle.setValue(newIndex);
      handle.setValueIsIndexed();
    }
  }

  void storeKeyword(
      StyleValueHandle& handle,
      StyleValueHandle::Keyword keyword) {
    handle.setType(StyleValueHandle::Type::Keyword);

    if (handle.isValueIndexed()) {
      auto newIndex =
          buffer_.replace(handle.value(), static_cast<uint32_t>(keyword));
      handle.setValue(newIndex);
    } else {
      handle.setValue(static_cast<uint16_t>(keyword));
    }
  }

  void storeDynamic(
      StyleValueHandle& handle,
      YGValueDynamic callback,
      YGValueDynamicID id) {
    handle.setType(StyleValueHandle::Type::Dynamic);
    auto packed = static_cast<uint64_t>(reinterpret_cast<uintptr_t>(callback));

    if (handle.isValueIndexed()) {
      auto oldIndex = handle.value();
      auto newIndex = buffer_.replace(oldIndex, packed);
      if (newIndex == oldIndex) {
        [[maybe_unused]] auto replacedIndex = buffer_.replace(
            static_cast<uint16_t>(newIndex + 2), static_cast<uint32_t>(id));
      } else {
        buffer_.push(static_cast<uint32_t>(id));
      }
      handle.setValue(newIndex);
    } else {
      auto newIndex = buffer_.push(packed);
      buffer_.push(static_cast<uint32_t>(id));
      handle.setValue(newIndex);
      handle.setValueIsIndexed();
    }
  }

  static constexpr bool isIntegerPackable(float f) {
    constexpr uint16_t kMaxInlineAbsValue = (1 << 11) - 1;

    auto i = static_cast<int32_t>(f);
    return static_cast<float>(i) == f && i >= -kMaxInlineAbsValue &&
        i <= +kMaxInlineAbsValue;
  }

  static constexpr uint16_t packInlineInteger(float value) {
    uint16_t isNegative = value < 0 ? 1 : 0;
    return static_cast<uint16_t>(
        (isNegative << 11) |
        (static_cast<int32_t>(value) * (isNegative != 0u ? -1 : 1)));
  }

  static constexpr float unpackInlineInteger(uint16_t value) {
    constexpr uint16_t kValueSignMask = 0b0000'1000'0000'0000;
    constexpr uint16_t kValueMagnitudeMask = 0b0000'0111'1111'1111;
    const bool isNegative = (value & kValueSignMask) != 0;
    return static_cast<float>(
        (value & kValueMagnitudeMask) * (isNegative ? -1 : 1));
  }

  SmallValueBuffer<4> buffer_;
};

} // namespace facebook::yoga
