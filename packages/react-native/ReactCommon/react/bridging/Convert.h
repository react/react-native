/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

#include <optional>
#include <type_traits>

namespace facebook::react::bridging {

// std::remove_cvref_t is not available until C++20.
template <typename T>
using remove_cvref_t = std::remove_cv_t<std::remove_reference_t<T>>;

template <typename T>
inline constexpr bool is_jsi_v = std::is_same_v<jsi::Value, remove_cvref_t<T>> ||
    std::is_same_v<jsi::String, remove_cvref_t<T>> || std::is_base_of_v<jsi::Object, remove_cvref_t<T>>;

template <typename>
struct is_optional : std::false_type {};

template <typename T>
struct is_optional<std::optional<T>> : std::true_type {};

template <typename T>
inline constexpr bool is_optional_v = is_optional<T>::value;

template <typename T, typename = void>
inline constexpr bool is_optional_jsi_v = false;

template <typename T>
inline constexpr bool is_optional_jsi_v<T, typename std::enable_if_t<is_optional_v<T>>> =
    is_jsi_v<typename T::value_type>;

template <typename T>
struct Converter;

template <typename T>
struct ConverterBase {
  using BaseT = remove_cvref_t<T>;

  ConverterBase(jsi::Runtime &rt, T &&value) : rt_(rt), value_(std::forward<T>(value)) {}

  operator BaseT() &&
  {
    if constexpr (std::is_lvalue_reference_v<T>) {
      // Copy the reference into a Value that then can be moved from.
      auto value = jsi::Value(rt_, value_);

      if constexpr (std::is_same_v<BaseT, jsi::Value>) {
        return std::move(value);
      } else if constexpr (std::is_same_v<BaseT, jsi::String>) {
        return std::move(value).getString(rt_);
      } else if constexpr (std::is_same_v<BaseT, jsi::Object>) {
        return std::move(value).getObject(rt_);
      } else if constexpr (std::is_same_v<BaseT, jsi::Array>) {
        return std::move(value).getObject(rt_).getArray(rt_);
      } else if constexpr (std::is_same_v<BaseT, jsi::Function>) {
        return std::move(value).getObject(rt_).getFunction(rt_);
      } else if constexpr (std::is_same_v<BaseT, jsi::ArrayBuffer>) {
        return std::move(value).asObject(rt_).getArrayBuffer(rt_);
      }
    } else {
      return std::move(value_);
    }
  }

  template <
      typename U,
      std::enable_if_t<
          std::is_lvalue_reference_v<T> &&
              // Ensure non-reference type can be converted to the desired type.
              std::is_convertible_v<Converter<BaseT>, U>,
          int> = 0>
  operator U() &&
  {
    return Converter<BaseT>(rt_, std::move(*this).operator BaseT());
  }

  template <typename U, std::enable_if_t<is_jsi_v<T> && std::is_same_v<U, jsi::Value>, int> = 0>
  operator U() && = delete; // Prevent unwanted upcasting of JSI values.

 protected:
  jsi::Runtime &rt_;
  T value_;
};

template <typename T>
struct Converter : public ConverterBase<T> {
  using ConverterBase<T>::ConverterBase;
};

template <>
struct Converter<jsi::Value> : public ConverterBase<jsi::Value> {
  using ConverterBase<jsi::Value>::ConverterBase;

  operator jsi::String() &&
  {
    return std::move(value_).asString(rt_);
  }

  operator jsi::Object() &&
  {
    return std::move(value_).asObject(rt_);
  }

  operator jsi::Array() &&
  {
    return std::move(value_).asObject(rt_).asArray(rt_);
  }

  operator jsi::Function() &&
  {
    return std::move(value_).asObject(rt_).asFunction(rt_);
  }

  operator jsi::ArrayBuffer() &&
  {
    return std::move(value_).asObject(rt_).getArrayBuffer(rt_);
  }
};

template <>
struct Converter<jsi::Object> : public ConverterBase<jsi::Object> {
  using ConverterBase<jsi::Object>::ConverterBase;

  operator jsi::Array() &&
  {
    return std::move(value_).asArray(rt_);
  }

  operator jsi::Function() &&
  {
    return std::move(value_).asFunction(rt_);
  }

  operator jsi::ArrayBuffer() &&
  {
    return std::move(value_).getArrayBuffer(rt_);
  }
};

template <typename T>
struct Converter<std::optional<T>> : public ConverterBase<jsi::Value> {
  Converter(jsi::Runtime &rt, std::optional<T> value)
      : ConverterBase(rt, value ? std::move(*value) : jsi::Value::null())
  {
  }

  operator std::optional<T>() &&
  {
    if (value_.isNull() || value_.isUndefined()) {
      return {};
    }
    return std::move(value_);
  }
};

template <typename T, std::enable_if_t<is_jsi_v<T>, int> = 0>
auto convert(jsi::Runtime &rt, T &&value)
{
  return Converter<T>(rt, std::forward<T>(value));
}

template <typename T, std::enable_if_t<is_jsi_v<T> || std::is_scalar_v<T>, int> = 0>
auto convert(jsi::Runtime &rt, std::optional<T> value)
{
  return Converter<std::optional<T>>(rt, std::move(value));
}

template <typename T, std::enable_if_t<std::is_scalar_v<T>, int> = 0>
auto convert(jsi::Runtime & /*rt*/, T &&value)
{
  return value;
}

template <typename T>
auto convert(jsi::Runtime & /*rt*/, Converter<T> &&converter)
{
  return std::move(converter);
}

} // namespace facebook::react::bridging
