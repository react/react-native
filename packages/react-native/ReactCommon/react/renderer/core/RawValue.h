/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <unordered_map>
#include <variant>

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>

#include <react/renderer/core/RawPropsPrimitives.h>

#include <react/debug/react_native_assert.h>

namespace facebook::react {

class RawPropsParser;

/*
 * `RawValue` abstracts some arbitrary complex data structure similar to JSON.
 * `RawValue` supports explicit conversion to: `bool`, `int`, `int64_t`,
 * `float`, `double`, `string`, and `vector` & `map` of those types and itself.
 *
 * The main intention of the class is to abstract React props parsing infra from
 * JSI, to enable support for any non-JSI-based data sources. The particular
 * implementation of the interface is a very slim abstraction around
 * `folly::dynamic` though.
 * In the near future, this class will hold a `jsi::Runtime` and `jsi::Value`
 * pair instead of `folly::dynamic`.
 *
 * How `RawValue` is different from `JSI::Value`:
 *  * `RawValue` provides much more scoped API without any references to
 * JavaScript specifics.
 *  * The API is much more C++-idiomatic and easy to use from C++ code.
 *  * The API prevents access to JSI/JavaScript internals from prop-parsing
 * code.
 *  * The `RawValue` is not copyable nor thread-safe, which prevent
 * misuse and accidental performance problems.
 *
 * How `RawValue` is different from `folly::dynamic`:
 *  * `RawValue` is a lazy data structure, it does not copy all content inside,
 * it provides efficient SAX-like access to the data.
 *  * `RawValue` has more static and C++-idiomatic API.
 *  * The `RawValue` is not copyable nor thread-safe, which prevent
 * misuse and accidental performance problems.
 */
class RawValue {
 public:
  /*
   * Constructors.
   */
  RawValue() noexcept : value_(folly::dynamic(nullptr)) {}

  RawValue(RawValue &&other) noexcept : value_(std::move(other.value_)) {}

  RawValue &operator=(RawValue &&other) noexcept
  {
    if (this != &other) {
      value_ = std::move(other.value_);
    }
    return *this;
  }

  explicit RawValue(jsi::Runtime &runtime, const jsi::Value &value) noexcept
      : value_(std::make_pair(&runtime, jsi::Value(runtime, value)))
  {
  }

  explicit RawValue(jsi::Runtime &runtime, jsi::Value &&value) noexcept
      : value_(std::make_pair(&runtime, std::move(value)))
  {
  }

  explicit RawValue(const folly::dynamic &dynamic) noexcept : value_(dynamic) {}

  explicit RawValue(folly::dynamic &&dynamic) noexcept : value_(std::move(dynamic)) {}

 private:
  friend class RawProps;
  friend class RawPropsParser;
  friend class UIManagerBinding;

  RawValue(const RawValue &other)
  {
    if (std::holds_alternative<folly::dynamic>(other.value_)) {
      auto &dynamic = std::get<folly::dynamic>(other.value_);
      value_ = dynamic;
    } else {
      const auto &[runtime, value] = std::get<JsiValuePair>(other.value_);
      value_ = std::make_pair(runtime, jsi::Value(*runtime, value));
    }
  }

  RawValue &operator=(const RawValue &other)
  {
    if (this != &other) {
      if (std::holds_alternative<folly::dynamic>(other.value_)) {
        auto &dynamic = std::get<folly::dynamic>(other.value_);
        value_ = dynamic;
      } else {
        const auto &[runtime, value] = std::get<JsiValuePair>(other.value_);
        value_ = std::make_pair(runtime, jsi::Value(*runtime, value));
      }
    }
    return *this;
  }

 public:
  /*
   * Casts the value to a specified type.
   */
  template <typename T>
  explicit operator T() const
  {
    if (std::holds_alternative<folly::dynamic>(value_)) {
      auto &dynamic = std::get<folly::dynamic>(value_);
      return castValue(dynamic, (T *)nullptr);
    } else {
      const auto &[runtime, value] = std::get<JsiValuePair>(value_);
      return castValue(runtime, value, (T *)nullptr);
    }
  }

  inline explicit operator folly::dynamic() const
  {
    if (std::holds_alternative<folly::dynamic>(value_)) {
      return std::get<folly::dynamic>(value_);
    } else {
      const auto &[runtime, value] = std::get<JsiValuePair>(value_);
      return jsi::dynamicFromValue(*runtime, value);
    }
  }

  /*
   * Checks if the stored value has specified type.
   */
  template <typename T>
  bool hasType() const
  {
    if (std::holds_alternative<folly::dynamic>(value_)) {
      auto &dynamic = std::get<folly::dynamic>(value_);
      return checkValueType(dynamic, (T *)nullptr);
    } else {
      const auto &[runtime, value] = std::get<JsiValuePair>(value_);
      return checkValueType(runtime, value, (T *)nullptr);
    }
  }

  /*
   * Checks if the stored value is *not* `null`.
   */
  bool hasValue() const
  {
    if (std::holds_alternative<folly::dynamic>(value_)) {
      auto &dynamic = std::get<folly::dynamic>(value_);
      return !dynamic.isNull();
    } else {
      const auto &[runtime, value] = std::get<JsiValuePair>(value_);
      return !value.isNull() && !value.isUndefined();
    }
  }

 private:
  using JsiValuePair = std::pair<jsi::Runtime *, jsi::Value>;
  std::variant<folly::dynamic, JsiValuePair> value_;

  static bool checkValueType(const folly::dynamic & /*dynamic*/, RawValue * /*type*/) noexcept
  {
    return true;
  }

  static bool checkValueType(jsi::Runtime * /*runtime*/, const jsi::Value & /*value*/, RawValue * /*type*/) noexcept
  {
    return true;
  }

  static bool checkValueType(const folly::dynamic &dynamic, bool * /*type*/) noexcept
  {
    return dynamic.isBool();
  }

  static bool checkValueType(jsi::Runtime * /*runtime*/, const jsi::Value &value, bool * /*type*/) noexcept
  {
    return value.isBool();
  }

  static bool checkValueType(const folly::dynamic &dynamic, int * /*type*/) noexcept
  {
    return dynamic.isNumber();
  }

  static bool checkValueType(jsi::Runtime * /*runtime*/, const jsi::Value &value, int * /*type*/) noexcept
  {
    return value.isNumber();
  }

  static bool checkValueType(const folly::dynamic &dynamic, int64_t * /*type*/) noexcept
  {
    return dynamic.isNumber();
  }

  static bool checkValueType(jsi::Runtime * /*runtime*/, const jsi::Value &value, int64_t * /*type*/) noexcept
  {
    return value.isNumber();
  }

  static bool checkValueType(const folly::dynamic &dynamic, float * /*type*/) noexcept
  {
    return dynamic.isNumber();
  }

  static bool checkValueType(jsi::Runtime * /*runtime*/, const jsi::Value &value, float * /*type*/) noexcept
  {
    return value.isNumber();
  }

  static bool checkValueType(const folly::dynamic &dynamic, double * /*type*/) noexcept
  {
    return dynamic.isNumber();
  }

  static bool checkValueType(jsi::Runtime * /*runtime*/, const jsi::Value &value, double * /*type*/) noexcept
  {
    return value.isNumber();
  }

  static bool checkValueType(const folly::dynamic &dynamic, std::string * /*type*/) noexcept
  {
    return dynamic.isString();
  }

  static bool checkValueType(jsi::Runtime * /*runtime*/, const jsi::Value &value, std::string * /*type*/) noexcept
  {
    return value.isString();
  }

  static bool checkValueType(const folly::dynamic & /*dynamic*/, JsiValuePair * /*type*/) noexcept
  {
    return false;
  }

  static bool checkValueType(jsi::Runtime * /*runtime*/, const jsi::Value & /*value*/, JsiValuePair * /*type*/) noexcept
  {
    return true;
  }

  template <typename T>
  static bool checkValueType(const folly::dynamic &dynamic, std::vector<T> * /*type*/) noexcept
  {
    if (!dynamic.isArray()) {
      return false;
    }

    for (const auto &item : dynamic) {
      // Note: We test only one element.
      return checkValueType(item, (T *)nullptr);
    }

    return true;
  }

  template <typename T>
  static bool checkValueType(jsi::Runtime *runtime, const jsi::Value &value, std::vector<T> * /*type*/) noexcept
  {
    if (!value.isObject()) {
      return false;
    }

    jsi::Object asObject = value.getObject(*runtime);
    if (!asObject.isArray(*runtime)) {
      return false;
    }

    jsi::Array array = asObject.getArray(*runtime);
    size_t size = array.size(*runtime);
    for (size_t i = 0; i < size; i++) {
      jsi::Value itemValue = array.getValueAtIndex(*runtime, i);
      // Note: We test only one element.
      return checkValueType(runtime, itemValue, (T *)nullptr);
    }

    return true;
  }

  template <typename T>
  static bool checkValueType(const folly::dynamic &dynamic, std::unordered_map<std::string, T> * /*type*/) noexcept
  {
    if (!dynamic.isObject()) {
      return false;
    }

    for (const auto &item : dynamic.items()) {
      react_native_assert(item.first.isString());
      // Note: We test only one element.
      return checkValueType(item.second, (T *)nullptr);
    }

    return true;
  }

  template <typename T>
  static bool
  checkValueType(jsi::Runtime *runtime, const jsi::Value &value, std::unordered_map<std::string, T> * /*type*/)
  {
    if (!value.isObject()) {
      return false;
    }

    jsi::Object asObject = value.getObject(*runtime);

    auto propertyNames = asObject.getPropertyNames(*runtime);
    size_t size = propertyNames.size(*runtime);
    for (size_t i = 0; i < size; i++) {
      jsi::String propertyName = propertyNames.getValueAtIndex(*runtime, i).getString(*runtime);
      jsi::Value propertyValue = asObject.getProperty(*runtime, propertyName);
      // Note: We test only one element.
      return checkValueType(runtime, propertyValue, (T *)nullptr);
    }

    return true;
  }

  // Casts
  static RawValue castValue(const folly::dynamic &dynamic, RawValue * /*type*/) noexcept
  {
    return RawValue(dynamic);
  }

  static RawValue castValue(jsi::Runtime *runtime, const jsi::Value &value, RawValue * /*type*/) noexcept
  {
    return RawValue(*runtime, value);
  }

  static bool castValue(const folly::dynamic &dynamic, bool * /*type*/)
  {
    return dynamic.getBool();
  }

  static bool castValue(jsi::Runtime * /*runtime*/, const jsi::Value &value, bool * /*type*/)
  {
    return value.asBool();
  }

  static int castValue(const folly::dynamic &dynamic, int * /*type*/)
  {
    return static_cast<int>(dynamic.asInt());
  }

  static int castValue(jsi::Runtime * /*runtime*/, const jsi::Value &value, int * /*type*/)
  {
    // Casting directly from double to int loses precision, go via int64
    auto number = static_cast<int64_t>(value.asNumber());
    return static_cast<int>(number);
  }

  static int64_t castValue(const folly::dynamic &dynamic, int64_t * /*type*/)
  {
    return dynamic.asInt();
  }

  static int64_t castValue(jsi::Runtime * /*runtime*/, const jsi::Value &value, int64_t * /*type*/)
  {
    double number = value.asNumber();
    return static_cast<int64_t>(number);
  }

  static float castValue(const folly::dynamic &dynamic, float * /*type*/)
  {
    return static_cast<float>(dynamic.asDouble());
  }

  static float castValue(jsi::Runtime * /*runtime*/, const jsi::Value &value, float * /*type*/)
  {
    double number = value.asNumber();
    return static_cast<float>(number);
  }

  static double castValue(const folly::dynamic &dynamic, double * /*type*/)
  {
    return dynamic.asDouble();
  }

  static double castValue(jsi::Runtime * /*runtime*/, const jsi::Value &value, double * /*type*/)
  {
    return value.asNumber();
  }

  static std::string castValue(const folly::dynamic &dynamic, std::string * /*type*/)
  {
    return dynamic.getString();
  }

  static std::string castValue(jsi::Runtime *runtime, const jsi::Value &value, std::string * /*type*/)
  {
    jsi::String stringValue = value.asString(*runtime);
    return stringValue.utf8(*runtime);
  }

  static JsiValuePair castValue(const folly::dynamic & /*dynamic*/, JsiValuePair * /*type*/)
  {
    react_native_assert(false);
    throw std::runtime_error("Cannot cast dynamic to a jsi::Value type");
  }

  static JsiValuePair castValue(jsi::Runtime *runtime, const jsi::Value &value, JsiValuePair * /*type*/)
  {
    return {runtime, jsi::Value(*runtime, value)};
  }

  template <typename T>
  static std::vector<T> castValue(const folly::dynamic &dynamic, std::vector<T> * /*type*/)
  {
    react_native_assert(dynamic.isArray());
    auto result = std::vector<T>{};
    result.reserve(dynamic.size());
    for (const auto &item : dynamic) {
      result.push_back(castValue(item, (T *)nullptr));
    }
    return result;
  }

  template <typename T>
  static std::vector<T> castValue(jsi::Runtime *runtime, const jsi::Value &value, std::vector<T> * /*type*/)
  {
    react_native_assert(value.isObject());
    jsi::Object object = value.getObject(*runtime);
    react_native_assert(object.isArray(*runtime));
    jsi::Array array = object.getArray(*runtime);
    size_t size = array.size(*runtime);
    std::vector<T> result;
    result.reserve(size);
    for (size_t i = 0; i < size; i++) {
      jsi::Value itemValue = array.getValueAtIndex(*runtime, i);
      T item = castValue(runtime, itemValue, (T *)nullptr);
      result.push_back(std::move(item));
    }
    return result;
  }

  template <typename T>
  static std::vector<std::vector<T>> castValue(const folly::dynamic &dynamic, std::vector<std::vector<T>> * /*type*/)
  {
    react_native_assert(dynamic.isArray());
    auto result = std::vector<std::vector<T>>{};
    result.reserve(dynamic.size());
    for (const auto &item : dynamic) {
      result.push_back(castValue(item, (std::vector<T> *)nullptr));
    }
    return result;
  }

  template <typename T>
  static std::vector<std::vector<T>>
  castValue(jsi::Runtime *runtime, const jsi::Value &value, std::vector<std::vector<T>> * /*type*/)
  {
    react_native_assert(value.isObject());
    jsi::Object object = value.getObject(*runtime);
    react_native_assert(object.isArray(*runtime));
    jsi::Array array = std::move(object).getArray(*runtime);
    size_t size = array.size(*runtime);
    std::vector<std::vector<T>> result;
    result.reserve(size);
    for (size_t i = 0; i < size; i++) {
      jsi::Value itemValue = array.getValueAtIndex(*runtime, i);
      std::vector<T> item = castValue(runtime, itemValue, (std::vector<T> *)nullptr);
      result.push_back(std::move(item));
    }
    return result;
  }

  template <typename T>
  static std::unordered_map<std::string, T> castValue(
      const folly::dynamic &dynamic,
      std::unordered_map<std::string, T> * /*type*/)
  {
    react_native_assert(dynamic.isObject());
    auto result = std::unordered_map<std::string, T>{};
    for (const auto &item : dynamic.items()) {
      react_native_assert(item.first.isString());
      result[item.first.getString()] = castValue(item.second, (T *)nullptr);
    }
    return result;
  }

  template <typename T>
  static std::unordered_map<std::string, T>
  castValue(jsi::Runtime *runtime, const jsi::Value &value, std::unordered_map<std::string, T> * /*type*/)
  {
    react_native_assert(value.isObject());
    jsi::Object object = value.getObject(*runtime);
    jsi::Array propertyNames = object.getPropertyNames(*runtime);
    size_t size = propertyNames.size(*runtime);
    std::unordered_map<std::string, T> result;
    for (size_t i = 0; i < size; i++) {
      jsi::Value propertyNameValue = propertyNames.getValueAtIndex(*runtime, i);
      jsi::String propertyName = propertyNameValue.getString(*runtime);
      jsi::Value propertyValue = object.getProperty(*runtime, propertyName);
      if (propertyValue.isUndefined()) {
        // Skip undefined values to mimic JSIDynamic::dynamicFromValue behavior.
        // Null values are allowed in the map.
        continue;
      }

      std::string propertyNameString = propertyName.utf8(*runtime);
      T property = castValue(runtime, propertyValue, (T *)nullptr);
      result.emplace(propertyNameString, std::move(property));
    }
    return result;
  }
};

} // namespace facebook::react
